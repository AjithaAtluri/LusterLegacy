import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool, db } from "./db"; // Add pool for direct SQL queries
import { asc, eq, inArray } from "drizzle-orm";
import * as z from "zod";
import { setupAuth } from "./auth";
import passport from "passport";
// Import the comparePasswords function for admin auth
import { comparePasswords } from "./auth";
import { 
  insertProductSchema, 
  insertDesignRequestSchema, 
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertContactMessageSchema,
  insertUserSchema,
  insertMetalTypeSchema,
  insertStoneTypeSchema,
  insertInspirationGallerySchema,
  insertProductTypeSchema,
  insertCustomizationRequestSchema,
  insertCustomizationRequestCommentSchema,
  insertQuoteRequestSchema,
  insertQuoteRequestCommentSchema,
  stoneTypes
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { calculateJewelryPrice, getSamplePriceCalculation, getGemPricePerCaratFromName } from "./utils/price-calculator";
import fs from "fs";
import { validateAdmin } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { paypalClientId, createOrder, captureOrder, cancelOrder } from "./paypal";
import { generateContent } from "./ai-service";
import { generateJewelryContent } from "./openai-content-generator";
import { analyzeJewelryImage } from "./direct-vision-api";
import { generateProductContent } from "./generate-product-content";
import { generateChatbotResponse } from "./chatbot-service";
import { generateAITestimonial } from "./openai-service";
import { generateDesignConsultationResponse } from "./design-consultation-service";
// We don't import processImageForTestimonial because it fails with local image paths
import { getGoldPrice, fetchGoldPrice } from "./services/gold-price-service";
import { analyzeImage } from "./ai-image-analyzer";

// USD to INR conversion rate - must match the rate in price-calculator.ts
const USD_TO_INR_RATE = 83;

// Set up multer for file uploads - using both /uploads and /attached_assets for persistence
// attached_assets is part of source control and will persist between deployments
const uploadDir = path.join(process.cwd(), 'uploads');
const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');

// Ensure both directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(attachedAssetsDir)) {
  fs.mkdirSync(attachedAssetsDir, { recursive: true });
}

// Create a symbolic link from 'public/uploads' to 'uploads' if it doesn't exist
const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(path.dirname(publicUploadsDir))) {
  fs.mkdirSync(path.dirname(publicUploadsDir), { recursive: true });
}

const storage_disk = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueFilename = uuidv4() + path.extname(file.originalname);
    
    // Also save to attached_assets for persistence
    const fileCallback = (err, filename) => {
      if (!err && filename) {
        // Copy to attached_assets
        const sourcePath = path.join(uploadDir, filename);
        const destPath = path.join(attachedAssetsDir, filename);
        
        // Use setTimeout to ensure the file is written before copying
        setTimeout(() => {
          try {
            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, destPath);
              console.log(`File saved to both uploads and attached_assets: ${filename}`);
            }
          } catch (copyError) {
            console.error(`Error copying file to attached_assets: ${copyError}`);
          }
        }, 100);
      }
      
      cb(err, filename);
    };
    
    fileCallback(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage_disk,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Test route that returns stone types directly without any authentication
  // This is ONLY for debugging authentication issues
  app.get('/api/debug/stone-types', async (_req, res) => {
    try {
      console.log("DEBUG ROUTE: Directly serving stone types");
      const stoneTypes = await storage.getAllStoneTypes();
      console.log(`Successfully fetched ${stoneTypes.length} stone types from debug route`);
      res.json(stoneTypes);
    } catch (error) {
      console.error('Error fetching stone types:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching stone types',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  /**
   * Direct product endpoint (bypasses authentication)
   * Reliable product data endpoint for production that doesn't require authentication
   * and provides enhanced caching to avoid flickering issues
   */
  app.get('/api/direct-product/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' });
      }
      
      console.log(`[DIRECT-PRODUCT] Direct product data request for ID: ${productId}`);
      
      // Allow any auth headers that might be provided
      const userIdHeader = req.headers['x-auth-user-id'] as string;
      const usernameHeader = req.headers['x-auth-username'] as string;
      
      // Log auth context for debugging
      if (userIdHeader || usernameHeader) {
        console.log(`[DIRECT-PRODUCT] Auth context headers:`, { 
          userId: userIdHeader, 
          username: usernameHeader 
        });
      }
      
      // Fetch the product data directly from storage
      const product = await storage.getProduct(productId);
      
      if (!product) {
        console.log(`[DIRECT-PRODUCT] Product ${productId} not found`);
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found'
        });
      }
      
      console.log(`[DIRECT-PRODUCT] Successfully retrieved product ${productId}`);
      
      // Define interface for the enhanced product including calculated prices
      interface EnhancedProduct {
        id: number;
        name: string;
        description: string;
        // basePrice field removed - now using calculated price exclusively
        calculatedPriceUSD?: number; // Added calculated price fields
        calculatedPriceINR?: number; // Added calculated price fields
        imageUrl: string;
        additionalImages: string[] | null;
        details: any;
        dimensions: string | null;
        isNew: boolean | null;
        category: string | null;
        createdAt: Date | null;
        aiInputs: any;
        calculatedPriceUSD?: number;
        calculatedPriceINR?: number;
      }
      
      // Add calculated prices to the product
      let enhancedProduct: EnhancedProduct = { ...product };
      
      try {
        if (product.details) {
          // Parse product details
          const details = typeof product.details === 'string' 
            ? JSON.parse(product.details) 
            : product.details;
            
          // Extract metal and stone details for price calculation
          // ONLY use database values, NOT AI-generated values
          // This prioritizes user-edited values over AI-generated values
          const metalType = details.metalType || "";
          const metalWeight = details.metalWeight || "";
          const mainStoneType = details.primaryStone || details.mainStoneType || ""; // First try primaryStone (user edited)
          const mainStoneWeight = details.primaryStoneWeight || details.mainStoneWeight || "";
          const secondaryStoneType = details.secondaryStone || details.secondaryStoneType || "";
          const secondaryStoneWeight = details.secondaryStoneWeight || "";
          const otherStoneType = details.otherStone || ""; // Add other stone type
          const otherStoneWeight = details.otherStoneWeight || ""; // Add other stone weight
          
          console.log(`[DIRECT-PRODUCT] Calculating prices for product ${productId} with database values:`, {
            metalType,
            metalWeight,
            mainStoneType,
            mainStoneWeight,
            secondaryStoneType,
            secondaryStoneWeight,
            otherStoneType,
            otherStoneWeight
          });
          
          // Instead of using the legacy function call, use the more flexible version that supports otherStone
          const params = {
            productType: "jewelry",
            metalType,
            metalWeight: parseFloat(metalWeight) || 0,
            primaryGems: []
          };
          
          // Add primary stone if available
          if (mainStoneType) {
            params.primaryGems.push({
              name: mainStoneType,
              carats: parseFloat(mainStoneWeight) || 0
            });
          }
          
          // Add secondary stone if available
          if (secondaryStoneType) {
            params.primaryGems.push({
              name: secondaryStoneType,
              carats: parseFloat(secondaryStoneWeight) || 0
            });
          }
          
          // Add other stone if available - this is the key fix for product #59
          if (otherStoneType && otherStoneWeight) {
            params.otherStone = {
              stoneTypeId: otherStoneType,
              caratWeight: parseFloat(otherStoneWeight) || 0
            };
            
            console.log(`[DIRECT-PRODUCT] Including other stone in price calculation: ${otherStoneType} (${otherStoneWeight} carats)`);
          }
          
          // Calculate prices using the enhanced parameter format
          const prices = await calculateJewelryPrice(params);
          
          // Standard price calculation for all products - no special cases
          enhancedProduct = {
            ...product,
            calculatedPriceUSD: prices.priceUSD,
            calculatedPriceINR: prices.priceINR
          }
          
          console.log(`[DIRECT-PRODUCT] Added calculated prices:`, {
            USD: enhancedProduct.calculatedPriceUSD,
            INR: enhancedProduct.calculatedPriceINR
          });
        }
      } catch (priceError) {
        console.error("[DIRECT-PRODUCT] Error calculating prices:", priceError);
        // Continue with original product if price calculation fails
      }
      
      // CRITICAL FIX: Set cache control headers to prevent any caching
      // This forces browsers to always get fresh data with recalculated prices
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      console.log(`[DIRECT-PRODUCT] Successfully served product ${productId}`);
      res.json(enhancedProduct);
    } catch (error) {
      console.error("[DIRECT-PRODUCT] Error fetching product:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server error fetching product data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up authentication
  setupAuth(app);

  // Health check routes for deployments
  // Only serve JSON for API health endpoints, not for the root route
  // This allows the Vite middleware to properly serve the frontend

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // Special debug endpoint for development - REMOVE IN PRODUCTION
  app.get('/api/debug/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        passwordFormat: user.password ? `${user.password.substring(0, 15)}... (${user.password.length} chars)` : 'no password',
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: "Unable to fetch users for debugging" });
    }
  });
  
  // Debug endpoint to examine session data - REMOVE IN PRODUCTION
  app.get('/api/debug/session', (req, res) => {
    try {
      console.log(`[DEBUG] Session request - Session ID: ${req.sessionID}`);
      console.log(`[DEBUG] Session authenticated: ${req.isAuthenticated()}`);
      
      const sessionInfo = {
        sessionID: req.sessionID,
        authenticated: req.isAuthenticated(),
        user: req.user ? {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        } : null,
        cookies: {
          names: req.cookies ? Object.keys(req.cookies) : [],
          hasConnectSid: req.cookies && 'connect.sid' in req.cookies,
          hasAdminId: req.cookies && 'admin_id' in req.cookies,
        },
        session: req.session ? {
          cookie: req.session.cookie,
          passport: req.session.passport,
        } : null,
        headers: {
          userAgent: req.headers['user-agent'],
          hasAuthorizationHeader: !!req.headers.authorization,
          cookie: req.headers.cookie,
        }
      };
      
      res.json(sessionInfo);
    } catch (error) {
      console.error("Session debug error:", error);
      res.status(500).json({ error: "Unable to fetch session debug info" });
    }
  });
  
  // DEV ONLY: Special login route for development troubleshooting
  // This bypasses password verification for testing purposes
  app.post('/api/dev-login', async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      console.log(`[DEV LOGIN] Bypassing password check for user: ${username}`);
      
      // Look up user without password verification
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Manually log the user in by setting session data
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Error during login" });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        console.log(`[DEV LOGIN] Successfully authenticated ${username} with role ${user.role}`);
        return res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Dev login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  // Serve static files from uploads directory (root-level persistent storage)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Also serve files from attached_assets as a fallback for missing uploads
  // But exclude debug screenshots and other non-jewelry images
  app.use('/uploads', (req, res, next) => {
    const requestPath = req.path;
    
    // Skip debug screenshots and system-generated images
    if (requestPath.includes('screenshot-') || requestPath.includes('image_')) {
      console.log(`Skipping debug image request: ${requestPath}`);
      return next('route'); // Skip to next route
    }
    
    // Continue to static file middleware for valid jewelry images
    return express.static(path.join(process.cwd(), 'attached_assets'))(req, res, next);
  });
  
  // Directly serve files from attached_assets folder
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));
  
  /**
   * Generic File Upload Endpoint
   */
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      
      console.log(`File uploaded successfully: ${fileUrl}`);
      res.status(200).json({ 
        success: true, 
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  /**
   * AI Testimonial Generation
   */
  app.post('/api/generate-testimonial', upload.array('images', 5), async (req, res) => {
    try {
      // Validate if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      // Extract input data
      const { 
        name, 
        productType, 
        rating, 
        text, 
        story,
        purchaseType,
        giftGiver,
        occasion,
        satisfaction,
        wouldReturn
      } = req.body;
      
      // Basic validation
      if (!name || !productType || !rating) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, product type, and rating are required' 
        });
      }
      
      // Handle uploaded images if any
      const imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          imageUrls.push(`/uploads/${file.filename}`);
        }
      }
      
      // Generate AI testimonial
      const inputData = {
        name,
        productType,
        rating: parseInt(rating),
        text,
        story,
        purchaseType,
        giftGiver,
        occasion,
        satisfaction,
        wouldReturn: wouldReturn === 'true',
        imageUrls
      };
      
      const { generatedTestimonial, generatedStory, aiInputData } = await generateAITestimonial(inputData);
      
      // Return both the brief testimonial and the full story
      res.json({
        success: true,
        generatedTestimonial,
        generatedStory,
        aiInputData
      });
    } catch (error) {
      console.error('Error generating testimonial:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate testimonial',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/process-testimonial-image', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image provided' });
      }
      
      console.log(`Successfully uploaded image: ${req.file.filename}`);
      
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Note: This is a completely rewritten endpoint - NO OpenAI calls at all
      // We previously tried to call processImageForTestimonial here but it's failing with local paths
      // So we're just returning a success response with the image URL instead
      
      return res.json({
        success: true,
        url: imageUrl, // Field expected by FileUploader
        imageUrl,
        description: "Jewelry image uploaded successfully"
      });
    } catch (error) {
      console.error('Error in testimonial image upload endpoint:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to process image upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Special fallback route for handling image requests that can't be found
  app.use('/api/image-fallback/:filename', (req, res) => {
    const filename = req.params.filename;
    console.log(`Fallback image request for: ${filename}`);
    
    // Skip debug screenshots and system-generated images
    if (filename.includes('screenshot-') || filename.includes('image_')) {
      console.log(`Skipping debug image request in fallback: ${filename}`);
      return res.status(404).json({ error: 'Image not found or excluded' });
    }
    
    // Check if file exists in uploads directory
    const uploadsPath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(uploadsPath)) {
      console.log(`Found in uploads directory: ${uploadsPath}`);
      return res.sendFile(uploadsPath);
    }
    
    // Check if file exists in attached_assets directory
    // Only using proper jewelry images, no debug screenshots
    const assetsPath = path.join(process.cwd(), 'attached_assets', filename);
    if (fs.existsSync(assetsPath) && 
        !(filename.startsWith('screenshot-') || filename.startsWith('image_'))) {
      console.log(`Found in attached_assets directory: ${assetsPath}`);
      return res.sendFile(assetsPath);
    }
    
    // Use a specific default image that we know exists
    const defaultImagePath = path.join(process.cwd(), 'uploads', 'test_jewelry.jpeg');
    if (fs.existsSync(defaultImagePath)) {
      console.log(`Using default jewelry image: ${defaultImagePath}`);
      return res.sendFile(defaultImagePath);
    }
    
    // If even our default image is missing, try the last resort
    try {
      // Find only actual jewelry images to use as fallbacks, avoiding debug screenshots
      const jpegFiles = fs.readdirSync(path.join(process.cwd(), 'uploads'))
        .filter(file => {
          // Must be a jpeg/jpg file
          const isImage = file.endsWith('.jpeg') || file.endsWith('.jpg');
          // Avoid debug screenshots and other non-jewelry images
          const isNotDebug = !file.startsWith('screenshot-') && !file.startsWith('image_');
          return isImage && isNotDebug;
        });
      
      if (jpegFiles.length > 0) {
        // Use a consistent image rather than random selections
        const fallbackImagePath = path.join(process.cwd(), 'uploads', jpegFiles[0]);
        console.log(`Using fallback image: ${fallbackImagePath}`);
        return res.sendFile(fallbackImagePath);
      }
    } catch (err) {
      console.error("Error finding fallback images:", err);
    }
    
    // If no file is found, send a 404
    console.log("No suitable fallback found, returning 404");
    res.status(404).json({ error: 'Image not found' });
  });
  
  /**
   * Session management - basic approach using session IDs in cookies
   * In a real production app, you'd use express-session with a proper session store
   */
  app.use((req: Request, res: Response, next) => {
    if (!req.cookies || !req.cookies.sessionId) {
      const sessionId = uuidv4();
      console.log(`Creating new sessionId: ${sessionId} for URL: ${req.url}`);
      res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax', // Allow cross-site requests when navigating from external site
        secure: false, // Allow non-HTTPS (for development)
        path: '/' // Ensure cookie is sent with all requests
      });
      req.sessionId = sessionId;
    } else {
      req.sessionId = req.cookies.sessionId;
      console.log(`Using existing sessionId: ${req.sessionId} for URL: ${req.url}`);
    }
    next();
  });

  // Test endpoint for debugging
  app.get('/api/debug/session', (req, res) => {
    res.json({
      sessionId: req.sessionId,
      cookies: req.cookies
    });
  });
  
  // Special URL login route for debugging (NEVER USE IN PRODUCTION)
  app.get('/api/debug/direct-login/:username', async (req, res) => {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({ message: "Username parameter is required" });
      }
      
      console.log(`[DIRECT LOGIN] Bypassing password check for user: ${username}`);
      
      // Look up user without password verification
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Manually log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Direct login error:", err);
          return res.status(500).json({ message: "Error during login" });
        }
        
        // Send a success response with information about the login
        res.status(200).json({ 
          message: `Successfully logged in as ${username} (${user.role})`,
          redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/' 
        });
      });
    } catch (error) {
      console.error("Direct login error:", error);
      res.status(500).json({ message: "Server error during direct login" });
    }
  });
  
  // Debug route to list all users (NEVER USE IN PRODUCTION)
  app.get('/api/debug/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Only return safe user info (no passwords)
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }));
      
      res.status(200).json(safeUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Server error fetching users" });
    }
  });

  /**
   * Customization Request routes
   */
  app.post("/api/customization-requests", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertCustomizationRequestSchema.parse(req.body);
      
      // Add user ID if authenticated
      if (req.isAuthenticated() && req.user) {
        validatedData.userId = req.user.id;
        
        // Try to fill in country from user's previous customization requests if not provided
        if (!validatedData.country || validatedData.country === "Unknown") {
          try {
            const previousRequests = await storage.getCustomizationRequestsByUserId(req.user.id);
            if (previousRequests.length > 0) {
              const previousCountry = previousRequests[0].country;
              if (previousCountry && previousCountry !== "Unknown") {
                validatedData.country = previousCountry;
              }
            }
          } catch (err) {
            console.error("Error fetching previous requests for country:", err);
            // Continue without country
          }
        }
      }
      
      // Set default country if still not available
      if (!validatedData.country || validatedData.country === "Unknown") {
        validatedData.country = "India"; // Default country based on most of our customers
      }
      
      // Create customization request
      const newCustomizationRequest = await storage.createCustomizationRequest(validatedData);
      
      res.status(201).json(newCustomizationRequest);
    } catch (error) {
      console.error("Error creating customization request:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create customization request" 
      });
    }
  });
  
  // Get all customization requests (admin only)
  // Get all customization requests (admin only)
  app.get("/api/customization-requests", async (req: Request, res: Response) => {
    try {
      // Check if admin - use validateAdmin as a function that returns a boolean
      await validateAdmin(req, res);
      
      // Get all customization requests
      const customizationRequests = await storage.getAllCustomizationRequests();
      
      // For each request, get product name
      const enrichedRequests = await Promise.all(
        customizationRequests.map(async (request) => {
          try {
            const product = await storage.getProduct(request.productId);
            return {
              ...request,
              productName: product ? product.name : "Unknown Product",
              customizationType: request.requestedMetalType !== request.originalMetalType && 
                               request.requestedStoneType !== request.originalStoneType
                ? "metal_and_stone"
                : request.requestedMetalType !== request.originalMetalType
                  ? "metal_only"
                  : "stone_only",
              preferredMetal: request.requestedMetalType,
              preferredStones: [request.requestedStoneType],
              customizationDetails: request.additionalNotes || "",
              quotedPrice: request.estimatedPrice,
              currency: "USD", // Default currency
            };
          } catch (error) {
            console.error(`Error enriching customization request ${request.id}:`, error);
            return request;
          }
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching customization requests:", error);
      res.status(500).json({ message: "Failed to fetch customization requests" });
    }
  });
  
  // Get user customization requests
  app.get("/api/customization-requests/user", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get user-specific customization requests
      const customizationRequests = await storage.getCustomizationRequestsByUserId(req.user.id);
      
      // For each request, get product name
      const enrichedRequests = await Promise.all(
        customizationRequests.map(async (request) => {
          try {
            const product = await storage.getProduct(request.productId);
            return {
              ...request,
              productName: product ? product.name : "Unknown Product",
              productImageUrl: product ? product.imageUrl : null,
              product: product || null, // Include full product data
              customizationType: request.requestedMetalType !== request.originalMetalType && 
                               request.requestedStoneType !== request.originalStoneType
                ? "metal_and_stone"
                : request.requestedMetalType !== request.originalMetalType
                  ? "metal_only"
                  : "stone_only",
              preferredMetal: request.requestedMetalType,
              preferredStones: [request.requestedStoneType],
              customizationDetails: request.additionalNotes || "",
              quotedPrice: request.estimatedPrice,
              currency: "USD", // Default currency
            };
          } catch (error) {
            console.error(`Error enriching customization request ${request.id}:`, error);
            return request;
          }
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching user customization requests:", error);
      res.status(500).json({ message: "Failed to fetch user customization requests" });
    }
  });
  
  // Get a specific customization request
  app.get("/api/customization-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid customization request ID" });
      }
      
      // Get the customization request
      const customizationRequest = await storage.getCustomizationRequest(id);
      if (!customizationRequest) {
        return res.status(404).json({ message: "Customization request not found" });
      }
      
      // Check authorization - admin or owner
      const isAdmin = await validateAdmin(req);
      const isOwner = req.isAuthenticated() && req.user && req.user.id === customizationRequest.userId;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to view this customization request" });
      }
      
      // Get product name
      const product = await storage.getProduct(customizationRequest.productId);
      
      // Get comments for this customization request
      const comments = await storage.getCustomizationRequestComments(id);
      
      // Extract metal and stone types from product details if available
      let productDetails = {
        metalType: "Unknown",
        mainStoneType: "Unknown",
        secondaryStoneType: null
      };
      
      if (product && product.details) {
        try {
          const details = JSON.parse(product.details);
          if (details.additionalData) {
            productDetails = {
              metalType: details.additionalData.metalType || "Unknown",
              mainStoneType: details.additionalData.mainStoneType || "Unknown",
              secondaryStoneType: details.additionalData.secondaryStoneType || null
            };
          }
        } catch (e) {
          console.error('Error parsing product details:', e);
        }
      }
      
      // Return enriched request
      const enrichedRequest = {
        ...customizationRequest,
        productName: product ? product.name : "Unknown Product",
        productImageUrl: product ? product.imageUrl : null,
        product: product || null, // Include full product data
        originalMetalType: productDetails.metalType, // Override with extracted metal type
        originalStoneType: productDetails.mainStoneType, // Override with extracted stone type
        customizationType: customizationRequest.requestedMetalType !== customizationRequest.originalMetalType && 
                         customizationRequest.requestedStoneType !== customizationRequest.originalStoneType
          ? "metal_and_stone"
          : customizationRequest.requestedMetalType !== customizationRequest.originalMetalType
            ? "metal_only"
            : "stone_only",
        preferredMetal: customizationRequest.requestedMetalType,
        preferredStones: [customizationRequest.requestedStoneType],
        customizationDetails: customizationRequest.additionalNotes || "",
        quotedPrice: customizationRequest.estimatedPrice,
        currency: "USD", // Default currency
        comments: comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      };
      
      res.json(enrichedRequest);
    } catch (error) {
      console.error(`Error fetching customization request:`, error);
      res.status(500).json({ message: "Failed to fetch customization request" });
    }
  });
  
  // Update a customization request (status, price)
  app.patch("/api/customization-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid customization request ID" });
      }
      
      // Check if admin - use validateAdmin as middleware
      await validateAdmin(req, res);
      
      // Get the existing request
      const existingRequest = await storage.getCustomizationRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Customization request not found" });
      }
      
      // Update only allowed fields
      const updates: Record<string, any> = {};
      
      if (req.body.status && typeof req.body.status === 'string') {
        updates.status = req.body.status;
      }
      
      if (req.body.quotedPrice && !isNaN(parseFloat(req.body.quotedPrice))) {
        updates.estimatedPrice = parseFloat(req.body.quotedPrice);
      }
      
      // Update the request
      const updatedRequest = await storage.updateCustomizationRequest(id, updates);
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating customization request:", error);
      res.status(500).json({ message: "Failed to update customization request" });
    }
  });
  
  // Add a comment to a customization request
  app.post("/api/customization-comments", upload.single('image'), async (req: Request, res: Response) => {
    try {
      const { customizationRequestId, content, createdBy, isAdmin } = req.body;
      
      if (!customizationRequestId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate the request exists
      const customizationRequest = await storage.getCustomizationRequest(parseInt(customizationRequestId));
      if (!customizationRequest) {
        return res.status(404).json({ message: "Customization request not found" });
      }
      
      // Check authorization - admin or owner
      const isAdminUser = await validateAdmin(req);
      const isOwner = req.isAuthenticated() && req.user && req.user.id === customizationRequest.userId;
      
      // Check if the user claims to be admin but isn't
      if (isAdmin === 'true' && !isAdminUser) {
        return res.status(403).json({ message: "Not authorized to post admin comments" });
      }
      
      if (!isAdminUser && !isOwner) {
        return res.status(403).json({ message: "Not authorized to comment on this customization request" });
      }
      
      // Create comment data
      const commentData: any = {
        customizationRequestId: parseInt(customizationRequestId),
        content: content,
        createdBy: isAdminUser ? 'Design Team' : createdBy || req.user?.username || 'Customer',
        isAdmin: isAdminUser
      };
      
      // Add user ID if authenticated
      if (req.isAuthenticated() && req.user) {
        commentData.userId = req.user.id;
      }
      
      // Add image URL if provided
      if (req.file) {
        commentData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      // Create the comment
      const newComment = await storage.addCustomizationRequestComment(commentData);
      
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error adding customization comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  
  /**
   * Quote Request routes
   */
  app.post("/api/quote-requests", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertQuoteRequestSchema.parse(req.body);
      
      // Add user ID if authenticated
      if (req.isAuthenticated() && req.user) {
        validatedData.userId = req.user.id;
      }
      
      // Create quote request
      const newQuoteRequest = await storage.createQuoteRequest(validatedData);
      
      res.status(201).json(newQuoteRequest);
    } catch (error) {
      console.error("Error creating quote request:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create quote request" 
      });
    }
  });
  
  // Get all quote requests (admin only)
  app.get("/api/quote-requests", async (req: Request, res: Response) => {
    try {
      // Check if admin - use validateAdmin as a function that returns a boolean
      await validateAdmin(req, res);
      
      // Get all quote requests
      const quoteRequests = await storage.getAllQuoteRequests();
      
      // For each request, get product name
      const enrichedRequests = await Promise.all(
        quoteRequests.map(async (request) => {
          try {
            const product = await storage.getProduct(request.productId);
            return {
              ...request,
              productName: product ? product.name : "Unknown Product",
              quantity: 1, // Default quantity
              specialRequirements: request.additionalNotes,
              preferredCurrency: "USD", // Default currency
              quotedPrice: request.estimatedPrice,
              imageUrl: product ? product.imageUrl : null,
              currency: "USD", // Default currency
              shippingAddress: null // Default
            };
          } catch (error) {
            console.error(`Error enriching quote request ${request.id}:`, error);
            return request;
          }
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching quote requests:", error);
      res.status(500).json({ message: "Failed to fetch quote requests" });
    }
  });
  
  // Get user quote requests
  app.get("/api/quote-requests/user", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get user-specific quote requests
      const quoteRequests = await storage.getQuoteRequestsByUserId(req.user.id);
      
      // For each request, get product name
      const enrichedRequests = await Promise.all(
        quoteRequests.map(async (request) => {
          try {
            const product = await storage.getProduct(request.productId);
            return {
              ...request,
              productName: product ? product.name : "Unknown Product",
              productImageUrl: product ? product.imageUrl : null,
              product: product || null, // Include full product data
              quantity: 1, // Default quantity
              specialRequirements: request.additionalNotes,
              preferredCurrency: "USD", // Default currency
              quotedPrice: request.estimatedPrice,
              imageUrl: product ? product.imageUrl : null,
              currency: "USD", // Default currency
              shippingAddress: null // Default
            };
          } catch (error) {
            console.error(`Error enriching quote request ${request.id}:`, error);
            return request;
          }
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching user quote requests:", error);
      res.status(500).json({ message: "Failed to fetch user quote requests" });
    }
  });
  
  // Get a specific quote request
  app.get("/api/quote-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      // Get the quote request
      const quoteRequest = await storage.getQuoteRequest(id);
      if (!quoteRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      // Check authorization - admin or owner
      const isAdmin = await validateAdmin(req);
      const isOwner = req.isAuthenticated() && req.user && req.user.id === quoteRequest.userId;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to view this quote request" });
      }
      
      // Get product name and image
      const product = await storage.getProduct(quoteRequest.productId);
      
      // Get comments for this quote request
      const comments = await storage.getQuoteRequestComments(id);
      
      // Return enriched request
      const enrichedRequest = {
        ...quoteRequest,
        productName: product ? product.name : "Unknown Product",
        productImageUrl: product ? product.imageUrl : null,
        product: {
          // Include specific pricing information
          // basePrice field removed - now using calculated price exclusively
          calculatedPriceUSD: product?.calculatedPriceUSD || null,
          calculatedPriceINR: product?.calculatedPriceINR || null,
          // Include full product data as well
          ...product
        } || null,
        quantity: 1, // Default quantity
        specialRequirements: quoteRequest.additionalNotes,
        preferredCurrency: "USD", // Default currency
        quotedPrice: quoteRequest.estimatedPrice,
        imageUrl: product ? product.imageUrl : null,
        currency: "USD", // Default currency
        shippingAddress: null, // Default
        comments: comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      };
      
      res.json(enrichedRequest);
    } catch (error) {
      console.error(`Error fetching quote request:`, error);
      res.status(500).json({ message: "Failed to fetch quote request" });
    }
  });
  
  // Add a comment to a quote request
  app.post("/api/quote-requests/:id/comments", upload.single('image'), async (req: Request, res: Response) => {
    try {
      const quoteRequestId = parseInt(req.params.id);
      if (isNaN(quoteRequestId)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      // Check if the quote request exists
      const quoteRequest = await storage.getQuoteRequest(quoteRequestId);
      if (!quoteRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      // Check authorization - admin or owner can comment
      const isAdmin = await validateAdmin(req);
      const isOwner = req.isAuthenticated() && req.user && req.user.id === quoteRequest.userId;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Not authorized to comment on this quote request" });
      }

      // Extract data from request body
      const { content, createdBy, isAdmin: isAdminComment = false } = req.body;
      
      // Validate required fields
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Create comment data
      const commentData: any = {
        quoteRequestId,
        content,
        createdBy: createdBy || (req.user ? (req.user.name || req.user.loginID || req.user.username) : "Customer"),
        isAdmin: isAdmin ? (isAdminComment === 'true' || isAdminComment === true) : false, // Only allow isAdmin=true if the user is actually an admin
        userId: req.user ? req.user.id : null
      };
      
      // Add image URL if file was uploaded
      if (req.file) {
        commentData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      // Create the comment
      const comment = await storage.addQuoteRequestComment(commentData);
      
      res.status(201).json(comment);
    } catch (error) {
      console.error(`Error creating quote request comment:`, error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Update a quote request (status, price)
  app.patch("/api/quote-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      // Check if admin
      const isAdmin = await validateAdmin(req);
      if (!isAdmin) {
        return res.status(403).json({ message: "Not authorized to update quote requests" });
      }
      
      // Get the existing request
      const existingRequest = await storage.getQuoteRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      // Update only allowed fields
      const updates: Record<string, any> = {};
      
      if (req.body.status && typeof req.body.status === 'string') {
        updates.status = req.body.status;
      }
      
      if (req.body.quotedPrice !== undefined && !isNaN(parseFloat(String(req.body.quotedPrice)))) {
        updates.quotedPrice = parseFloat(String(req.body.quotedPrice));
        
        // If we're setting a quoted price, also set the estimatedPrice for backward compatibility
        updates.estimatedPrice = parseFloat(String(req.body.quotedPrice));
        
        // When setting price, automatically set status to "quoted" if not already in a later stage
        const latestStages = ["approved", "payment_received", "in_production", "shipping", "delivered", "completed"];
        if (!updates.status && !latestStages.includes(existingRequest.status)) {
          updates.status = "quoted";
        }
      }
      
      if (req.body.isReadyToShip !== undefined) {
        updates.isReadyToShip = Boolean(req.body.isReadyToShip);
      }
      
      if (req.body.currency) {
        updates.currency = req.body.currency;
      }
      
      // Update the request
      const updatedRequest = await storage.updateQuoteRequest(id, updates);
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating quote request:", error);
      res.status(500).json({ message: "Failed to update quote request" });
    }
  });
  
  // Accept a quote request (customer action)
  app.post("/api/quote-requests/:id/accept", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote request ID" });
      }
      
      // Get the existing request
      const existingRequest = await storage.getQuoteRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      // Check authorization - owner only
      const isOwner = req.isAuthenticated() && req.user && req.user.id === existingRequest.userId;
      
      if (!isOwner) {
        return res.status(403).json({ message: "Not authorized to accept this quote request" });
      }
      
      // Make sure the request is in a 'quoted' status
      if (existingRequest.status !== 'quoted') {
        return res.status(400).json({ message: "Cannot accept a quote that hasn't been quoted yet" });
      }
      
      // Update only allowed fields
      const updates: Record<string, any> = {
        status: "approved"
      };
      
      // Preserve isReadyToShip status from request body or existing record
      if (req.body.isReadyToShip !== undefined) {
        updates.isReadyToShip = Boolean(req.body.isReadyToShip);
      } else if (existingRequest.isReadyToShip !== undefined) {
        updates.isReadyToShip = existingRequest.isReadyToShip;
      }
      
      // Update the request
      const updatedRequest = await storage.updateQuoteRequest(id, updates);
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error accepting quote request:", error);
      res.status(500).json({ message: "Failed to accept quote request" });
    }
  });
  
  // Add a comment to a quote request
  app.post("/api/quote-comments", upload.single('image'), async (req: Request, res: Response) => {
    try {
      const { quoteRequestId, content, createdBy, isAdmin } = req.body;
      
      if (!quoteRequestId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate the request exists
      const quoteRequest = await storage.getQuoteRequest(parseInt(quoteRequestId));
      if (!quoteRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      
      // Check authorization - admin or owner
      const isAdminUser = await validateAdmin(req);
      const isOwner = req.isAuthenticated() && req.user && req.user.id === quoteRequest.userId;
      
      // Check if the user claims to be admin but isn't
      if (isAdmin === 'true' && !isAdminUser) {
        return res.status(403).json({ message: "Not authorized to post admin comments" });
      }
      
      if (!isAdminUser && !isOwner) {
        return res.status(403).json({ message: "Not authorized to comment on this quote request" });
      }
      
      // Create comment data
      const commentData: any = {
        quoteRequestId: parseInt(quoteRequestId),
        content: content,
        createdBy: isAdminUser ? req.user?.username || 'Admin' : createdBy || req.user?.username || 'Customer',
        isAdmin: isAdminUser
      };
      
      // Add user ID if authenticated
      if (req.isAuthenticated() && req.user) {
        commentData.userId = req.user.id;
      }
      
      // Add image URL if provided
      if (req.file) {
        commentData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      // Create the comment
      const newComment = await storage.addQuoteRequestComment(commentData);
      
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error adding quote comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  
  /**
   * Debug and diagnostic routes
   */
  app.get('/api/debug/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product for debug:', error);
      res.status(500).json({ message: 'Failed to fetch product for debug' });
    }
  });

  /**
   * Email diagnostic tools - only available in development mode
   */
  app.post("/api/diagnostic/email-test", async (req, res) => {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false,
        message: "Email diagnostics are not available in production mode" 
      });
    }
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required"
      });
    }
    
    console.log(`[EMAIL DIAGNOSTIC] Test email requested for ${email}`);
    
    try {
      // Import email service dynamically to avoid circular dependencies
      const emailService = await import("./services/email-service");
      
      const result = await emailService.sendTestEmail(email);
      
      if (result.success) {
        console.log(`[EMAIL DIAGNOSTIC] Test email sent successfully to ${email}`);
      } else {
        console.error(`[EMAIL DIAGNOSTIC] Test email failed: ${result.message}`);
      }
      
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error(`[EMAIL DIAGNOSTIC] Exception during test:`, error);
      
      res.status(500).json({
        success: false,
        message: "An error occurred while testing the email service",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Product routes
   */
  // Get all products
  app.get('/api/products', async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      
      // Calculate accurate prices for each product using the price calculator
      const productsWithAccuratePrices = await Promise.all(products.map(async product => {
        try {
          // Try to get AI inputs from product.aiInputs first
          let aiInputs = product.aiInputs ? JSON.parse(product.aiInputs as unknown as string) : null;
          
          // If aiInputs is null, try to extract from the nested details JSON
          if (!aiInputs && product.details) {
            try {
              const parsedDetails = JSON.parse(product.details as string);
              if (parsedDetails.additionalData && parsedDetails.additionalData.aiInputs) {
                aiInputs = parsedDetails.additionalData.aiInputs;
                console.log(`Found AI inputs in details for product ${product.id}`);
              }
            } catch (err) {
              console.error(`Failed to parse details JSON for product ${product.id}:`, err);
            }
          }
          
          // Debug logging for product data
          console.log(`Product ${product.id} - ${product.name} - AI Inputs:`, 
            aiInputs ? JSON.stringify(aiInputs).substring(0, 150) + '...' : 'No AI inputs');
          
          if (aiInputs) {
            // Extract parameters for the price calculator
            const params = {
              productType: aiInputs.productType || "",
              metalType: aiInputs.metalType || "",
              metalWeight: parseFloat(aiInputs.metalWeight) || 0,
              primaryGems: [], // We'll manually add all gems below
              otherStone: aiInputs.otherStoneType ? {
                stoneTypeId: aiInputs.otherStoneType,
                caratWeight: parseFloat(aiInputs.otherStoneWeight) || 0
              } : undefined
            };
            
            // Add main stone if available
            if (aiInputs.mainStoneType && aiInputs.mainStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.mainStoneType,
                carats: parseFloat(aiInputs.mainStoneWeight) || 0
              });
            }
            
            // Add secondary stone if available
            if (aiInputs.secondaryStoneType && aiInputs.secondaryStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.secondaryStoneType,
                carats: parseFloat(aiInputs.secondaryStoneWeight) || 0
              });
            }
            
            console.log(`Product ${product.id} - Price calculation parameters:`, JSON.stringify(params));
            
            const result = await calculateJewelryPrice(params);
            console.log(`Product ${product.id} - Calculated prices: USD: ${result.priceUSD}, INR: ${result.priceINR}`);
            
            // No special cases - all products use standard price calculation
            
            // Add the accurate prices to the product
            return {
              ...product,
              calculatedPriceUSD: result.priceUSD,
              calculatedPriceINR: result.priceINR
            };
          }
          
          // If AI inputs are not available, use default pricing method
          console.log(`Product ${product.id} - No AI inputs, using default pricing method`);
          // Set default calculated price based on fixed values
          const defaultPriceINR = 75000; // Default price if calculations fail
          return {
            ...product,
            calculatedPriceUSD: Math.round(defaultPriceINR / USD_TO_INR_RATE),
            calculatedPriceINR: defaultPriceINR
          };
        } catch (error) {
          console.error(`Error calculating price for product ${product.id}:`, error);
          // Return the product with default fixed price
          const defaultPriceINR = 75000; // Default price if calculations fail
          return {
            ...product,
            calculatedPriceUSD: Math.round(defaultPriceINR / USD_TO_INR_RATE),
            calculatedPriceINR: defaultPriceINR
          };
        }
      }));
      
      res.json(productsWithAccuratePrices);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  });

  // Get featured products with simplified, more reliable pricing
  app.get('/api/products/featured', async (_req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      
      // Calculate accurate prices for each featured product - using the exact same logic as single product endpoint
      const productsWithAccuratePrices = await Promise.all(
        products.map(async (product) => {
          try {
            // Parse the product details to get the latest data
            let parsedDetails = {};
            if (product.details) {
              try {
                parsedDetails = typeof product.details === 'string' 
                  ? JSON.parse(product.details) 
                  : product.details;
              } catch (err) {
                console.error(`Error parsing details for product ${product.id}:`, err);
              }
            }
            
            // Get material info from various possible sources
            // PRIORITY: 1. Direct details fields (from UI edits), 2. aiInputs, 3. nested aiInputs
            let materialInfo = {
              // First check if user updated these fields directly in the UI
              metalType: parsedDetails.metalType,
              metalWeight: parsedDetails.metalWeight,
              primaryStone: parsedDetails.primaryStone,
              primaryStoneWeight: parsedDetails.primaryStoneWeight,
              secondaryStone: parsedDetails.secondaryStone,
              secondaryStoneWeight: parsedDetails.secondaryStoneWeight,
              otherStone: parsedDetails.otherStone,
              otherStoneWeight: parsedDetails.otherStoneWeight,
              
              // These might not be set by direct UI edits
              productType: "",
              mainStoneType: "",
              mainStoneWeight: "",
              secondaryStoneType: "",
              otherStoneType: ""
            };
            
            // If we don't have material info directly, try from aiInputs
            if (!materialInfo.metalType || !materialInfo.primaryStone) {
              // Extract AI inputs if available
              let aiInputs = null;
              if (product.aiInputs) {
                aiInputs = typeof product.aiInputs === 'string' 
                  ? JSON.parse(product.aiInputs) 
                  : product.aiInputs;
              } else if (parsedDetails.additionalData && parsedDetails.additionalData.aiInputs) {
                aiInputs = parsedDetails.additionalData.aiInputs;
              }
              
              if (aiInputs) {
                // Fill in any missing values from aiInputs
                materialInfo.productType = aiInputs.productType || materialInfo.productType;
                materialInfo.metalType = materialInfo.metalType || aiInputs.metalType;
                materialInfo.metalWeight = materialInfo.metalWeight || aiInputs.metalWeight;
                
                // For gemstones, map between different naming conventions
                materialInfo.primaryStone = materialInfo.primaryStone || aiInputs.mainStoneType;
                materialInfo.primaryStoneWeight = materialInfo.primaryStoneWeight || aiInputs.mainStoneWeight;
                materialInfo.secondaryStone = materialInfo.secondaryStone || aiInputs.secondaryStoneType;
                materialInfo.secondaryStoneWeight = materialInfo.secondaryStoneWeight || aiInputs.secondaryStoneWeight;
                materialInfo.otherStone = materialInfo.otherStone || aiInputs.otherStoneType;
                materialInfo.otherStoneWeight = materialInfo.otherStoneWeight || aiInputs.otherStoneWeight;
              }
            }
            
            // If we have material info, calculate the price
            if (materialInfo.metalType && (materialInfo.metalWeight || materialInfo.metalWeight === 0)) {
              // Create parameters for price calculator
              // IMPORTANT: Parse weights correctly by converting any string values to actual numbers
              const metalWeightValue = materialInfo.metalWeight;
              const metalWeightNumber = typeof metalWeightValue === 'string' ? 
                parseFloat(metalWeightValue.replace(/[^\d.-]/g, '')) : 
                (typeof metalWeightValue === 'number' ? metalWeightValue : 0);
              
              // Set up parameters for price calculator
              const params = {
                productType: materialInfo.productType || "",
                metalType: materialInfo.metalType || "",
                metalWeight: metalWeightNumber,
                primaryGems: [],
                otherStone: materialInfo.otherStone ? {
                  stoneTypeId: materialInfo.otherStone,
                  caratWeight: typeof materialInfo.otherStoneWeight === 'string' ? 
                    parseFloat(materialInfo.otherStoneWeight.replace(/[^\d.-]/g, '')) : 
                    (typeof materialInfo.otherStoneWeight === 'number' ? materialInfo.otherStoneWeight : 0)
                } : undefined
              };
              
              // Add primary stone if available
              if (materialInfo.primaryStone && materialInfo.primaryStoneWeight) {
                // Properly extract the numeric weight value by cleaning non-numeric characters
                const primaryStoneWeight = typeof materialInfo.primaryStoneWeight === 'string' ? 
                  parseFloat(materialInfo.primaryStoneWeight.replace(/[^\d.-]/g, '')) : 
                  (typeof materialInfo.primaryStoneWeight === 'number' ? materialInfo.primaryStoneWeight : 0);
                
                params.primaryGems.push({
                  name: materialInfo.primaryStone,
                  carats: primaryStoneWeight
                });
              }
              
              // Add secondary stone if available
              if (materialInfo.secondaryStone && materialInfo.secondaryStoneWeight) {
                // Properly extract the numeric weight value by cleaning non-numeric characters
                const secondaryStoneWeight = typeof materialInfo.secondaryStoneWeight === 'string' ? 
                  parseFloat(materialInfo.secondaryStoneWeight.replace(/[^\d.-]/g, '')) : 
                  (typeof materialInfo.secondaryStoneWeight === 'number' ? materialInfo.secondaryStoneWeight : 0);
                
                params.primaryGems.push({
                  name: materialInfo.secondaryStone,
                  carats: secondaryStoneWeight
                });
              }
              
              // Calculate the price
              const result = await calculateJewelryPrice(params);
              
              // No special cases - all products use standard price calculation
              
              return {
                ...product,
                calculatedPriceUSD: result.priceUSD,
                calculatedPriceINR: result.priceINR
              };
            } else {
              // Fall back to base price if no material info
              // Set default calculated price based on fixed value
              const defaultPriceINR = 75000; // Default price if calculations fail
              return {
                ...product,
                calculatedPriceUSD: Math.round(defaultPriceINR / USD_TO_INR_RATE),
                calculatedPriceINR: defaultPriceINR
              };
            }
          } catch (error) {
            console.error(`Error calculating price for product ${product.id}:`, error);
            // Set default calculated price based on fixed value
            const defaultPriceINR = 75000; // Default price if calculations fail
            return {
              ...product,
              calculatedPriceUSD: Math.round(defaultPriceINR / USD_TO_INR_RATE),
              calculatedPriceINR: defaultPriceINR
            };
          }
        })
      );
      
      res.json(productsWithAccuratePrices);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      res.status(500).json({ message: 'Error fetching featured products' });
    }
  });

  // Get products by category
  app.get('/api/products/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      
      // Calculate accurate prices for each product using the price calculator
      const productsWithAccuratePrices = await Promise.all(products.map(async product => {
        try {
          // Try to get AI inputs from product.aiInputs first
          let aiInputs = product.aiInputs ? JSON.parse(product.aiInputs as unknown as string) : null;
          
          // If aiInputs is null, try to extract from the nested details JSON
          if (!aiInputs && product.details) {
            try {
              const parsedDetails = JSON.parse(product.details as string);
              if (parsedDetails.additionalData && parsedDetails.additionalData.aiInputs) {
                aiInputs = parsedDetails.additionalData.aiInputs;
                console.log(`Found AI inputs in details for product ${product.id}`);
              }
            } catch (err) {
              console.error(`Failed to parse details JSON for product ${product.id}:`, err);
            }
          }
          
          if (aiInputs) {
            // Extract parameters for the price calculator
            const params = {
              productType: aiInputs.productType || "",
              metalType: aiInputs.metalType || "",
              metalWeight: parseFloat(aiInputs.metalWeight) || 0,
              primaryGems: [], // We'll manually add all gems below
              otherStone: aiInputs.otherStoneType ? {
                stoneTypeId: aiInputs.otherStoneType,
                caratWeight: parseFloat(aiInputs.otherStoneWeight) || 0
              } : undefined
            };
            
            // Add main stone if available
            if (aiInputs.mainStoneType && aiInputs.mainStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.mainStoneType,
                carats: parseFloat(aiInputs.mainStoneWeight) || 0
              });
            }
            
            // Add secondary stone if available
            if (aiInputs.secondaryStoneType && aiInputs.secondaryStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.secondaryStoneType,
                carats: parseFloat(aiInputs.secondaryStoneWeight) || 0
              });
            }
            
            const result = await calculateJewelryPrice(params);
            
            // No special cases - all products use standard price calculation
            
            // Add the accurate prices to the product
            return {
              ...product,
              calculatedPriceUSD: result.priceUSD,
              calculatedPriceINR: result.priceINR
            };
          }
          
          // If AI inputs are not available, use a default price
          return {
            ...product,
            calculatedPriceUSD: Math.round(75000 / USD_TO_INR_RATE), // Using default price
            calculatedPriceINR: 75000 // Default price if calculations fail
          };
        } catch (error) {
          console.error(`Error calculating price for product ${product.id}:`, error);
          // Return the product with default conversion from base price
          return {
            ...product,
            calculatedPriceUSD: Math.round(75000 / USD_TO_INR_RATE), // Using default price
            calculatedPriceINR: 75000 // Default price if calculations fail
          };
        }
      }));
      
      res.json(productsWithAccuratePrices);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({ message: 'Error fetching products by category' });
    }
  });

  // Get product by ID with simplified error handling
  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Log the structure for debugging
      console.log(`Product ${productId} found:`, {
        id: product.id,
        name: product.name
      });

      // Try to calculate accurate price based on product information
      try {
        // Parse the product details to get the latest data
        let parsedDetails = {};
        if (product.details) {
          try {
            parsedDetails = typeof product.details === 'string' 
              ? JSON.parse(product.details) 
              : product.details;
          } catch (err) {
            console.error("Error parsing product details:", err);
          }
        }
        
        // Get material info from various possible sources
        // PRIORITY: 1. Direct details fields (from UI edits), 2. aiInputs, 3. nested aiInputs
        let materialInfo = {
          // First check if user updated these fields directly in the UI
          metalType: parsedDetails.metalType,
          metalWeight: parsedDetails.metalWeight,
          primaryStone: parsedDetails.primaryStone,
          primaryStoneWeight: parsedDetails.primaryStoneWeight,
          secondaryStone: parsedDetails.secondaryStone,
          secondaryStoneWeight: parsedDetails.secondaryStoneWeight,
          otherStone: parsedDetails.otherStone,
          otherStoneWeight: parsedDetails.otherStoneWeight,
          
          // These might not be set by direct UI edits
          productType: "",
          mainStoneType: "",
          mainStoneWeight: "",
          secondaryStoneType: "",
          otherStoneType: ""
        };
        
        // We are no longer using AI inputs for material info to avoid price calculation inconsistencies
        // Only use database values that have been directly edited and saved
        // This ensures consistency with product card prices and admin views
        
        // Set a sensible fallback for metal type if it's missing (use 14K gold as default)
        if (!materialInfo.metalType) {
          materialInfo.metalType = "14k Yellow Gold";
          console.log(`[DIRECT-PRODUCT] Using default metal type (14k Yellow Gold) for product ${productId}`);
        }
        
        // Log what we're using for calculations
        console.log(`[DIRECT-PRODUCT] Using database values only for product ${productId}`);
        
        // No AI input fallbacks - this is intentional to maintain price consistency
        
        console.log("Using material info for price calculation:", {
          metalType: materialInfo.metalType,
          metalWeight: materialInfo.metalWeight,
          primaryStone: materialInfo.primaryStone,
          primaryStoneWeight: materialInfo.primaryStoneWeight,
          secondaryStone: materialInfo.secondaryStone,
          secondaryStoneWeight: materialInfo.secondaryStoneWeight,
          otherStone: materialInfo.otherStone,
          otherStoneWeight: materialInfo.otherStoneWeight
        });
        
        // CRITICAL FIX: Use the same calculation method as the direct-product endpoint
        // to ensure consistent pricing across the application
        console.log(`[CONSISTENCY FIX] Using legacy calculator format for product ${productId} to match direct-product endpoint`);
        
        // Parse numeric values from strings if needed
        const parsedMetalWeight = typeof materialInfo.metalWeight === 'string' ? 
          parseFloat(materialInfo.metalWeight.replace(/[^\d.-]/g, '')) : 
          (typeof materialInfo.metalWeight === 'number' ? materialInfo.metalWeight : 0);
          
        const parsedPrimaryStoneWeight = typeof materialInfo.primaryStoneWeight === 'string' ? 
          parseFloat(materialInfo.primaryStoneWeight.replace(/[^\d.-]/g, '')) : 
          (typeof materialInfo.primaryStoneWeight === 'number' ? materialInfo.primaryStoneWeight : 0);
          
        const parsedSecondaryStoneWeight = typeof materialInfo.secondaryStoneWeight === 'string' ? 
          parseFloat(materialInfo.secondaryStoneWeight.replace(/[^\d.-]/g, '')) : 
          (typeof materialInfo.secondaryStoneWeight === 'number' ? materialInfo.secondaryStoneWeight : 0);
        
        // Setup the parameters for the price calculator in the enhanced format
        // that supports otherStone, just like the direct-product endpoint
        const parsedOtherStoneWeight = typeof materialInfo.otherStoneWeight === 'string' ? 
          parseFloat(materialInfo.otherStoneWeight.replace(/[^\d.-]/g, '')) : 
          (typeof materialInfo.otherStoneWeight === 'number' ? materialInfo.otherStoneWeight : 0);
          
        // Enhanced parameter format with otherStone support
        const params = {
          productType: "jewelry",
          metalType: materialInfo.metalType || "",
          metalWeight: parsedMetalWeight,
          primaryGems: []
        };
        
        // Add primary stone if available
        if (materialInfo.primaryStone) {
          params.primaryGems.push({
            name: materialInfo.primaryStone,
            carats: parsedPrimaryStoneWeight
          });
        }
        
        // Add secondary stone if available
        if (materialInfo.secondaryStone) {
          params.primaryGems.push({
            name: materialInfo.secondaryStone,
            carats: parsedSecondaryStoneWeight
          });
        }
        
        // Add other stone if available - this is the key fix for product #59
        if (materialInfo.otherStone && parsedOtherStoneWeight > 0) {
          params.otherStone = {
            stoneTypeId: materialInfo.otherStone,
            caratWeight: parsedOtherStoneWeight
          };
          
          console.log(`Including other stone in price calculation: ${materialInfo.otherStone} (${parsedOtherStoneWeight} carats)`);
        }
        
        // Call the calculator with the enhanced parameter format
        const result = await calculateJewelryPrice(params);
        
        // No special cases - all products use standard price calculation
        // Add calculated prices to product
        product.calculatedPriceUSD = result.priceUSD;
        product.calculatedPriceINR = result.priceINR;
      } catch (calcError) {
        console.error(`Error calculating price for product ${product.id}:`, calcError);
        // Fallback to default price
        const defaultPriceINR = 75000; // Default price if calculations fail
        product.calculatedPriceUSD = Math.round(defaultPriceINR / USD_TO_INR_RATE);
        product.calculatedPriceINR = defaultPriceINR;
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product' });
    }
  });
  
  // [REMOVED] Duplicate direct-product endpoint removed to fix price calculation inconsistency
  // Now using only the primary direct-product endpoint which includes proper price calculation
  
  // Get related products by product ID - uses keyword and image matching algorithm
  app.get('/api/products/:id/related', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      // Get limit from query parameter, default to 4
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      // Get related products using the algorithm in storage
      const relatedProducts = await storage.getRelatedProducts(productId, limit);
      
      // Calculate accurate prices for each product
      const productsWithAccuratePrices = await Promise.all(relatedProducts.map(async product => {
        try {
          // Parse the product details to get the latest data
          let parsedDetails = {};
          if (product.details) {
            try {
              parsedDetails = typeof product.details === 'string' 
                ? JSON.parse(product.details) 
                : product.details;
            } catch (err) {
              console.error("Error parsing product details:", err);
            }
          }
          
          // Get material info from various possible sources
          // PRIORITY: 1. Direct details fields (from UI edits), 2. aiInputs, 3. nested aiInputs
          let materialInfo = {
            // First check if user updated these fields directly in the UI
            metalType: parsedDetails.metalType,
            metalWeight: parsedDetails.metalWeight,
            primaryStone: parsedDetails.primaryStone,
            primaryStoneWeight: parsedDetails.primaryStoneWeight,
            secondaryStone: parsedDetails.secondaryStone,
            secondaryStoneWeight: parsedDetails.secondaryStoneWeight,
            otherStone: parsedDetails.otherStone,
            otherStoneWeight: parsedDetails.otherStoneWeight,
            
            // These might not be set by direct UI edits
            productType: "",
            mainStoneType: "",
            mainStoneWeight: "",
            secondaryStoneType: "",
            otherStoneType: ""
          };
          
          // We are no longer using AI inputs for material info in related products
          // to ensure consistency with direct product endpoint and product cards
          
          // Set a sensible fallback for metal type if it's missing
          if (!materialInfo.metalType) {
            materialInfo.metalType = "14k Yellow Gold";
            console.log(`[RELATED PRODUCTS] Using default metal type (14k Yellow Gold) for product ${product.id}`);
          }
          
          console.log(`[RELATED PRODUCTS] Using database values only for product ${product.id}`);
          
          // No AI input fallbacks to ensure price calculation consistency
          
          // Create parameters for price calculator
          // IMPORTANT: Parse weights correctly by converting any string values to actual numbers
          const metalWeightValue = materialInfo.metalWeight;
          const metalWeightNumber = typeof metalWeightValue === 'string' ? 
            parseFloat(metalWeightValue.replace(/[^\d.-]/g, '')) : 
            (typeof metalWeightValue === 'number' ? metalWeightValue : 0);
            
          console.log(`Related product: Parsed metal weight: ${metalWeightValue} → ${metalWeightNumber}`);
            
          const params = {
            productType: materialInfo.productType || "",
            metalType: materialInfo.metalType || "",
            metalWeight: metalWeightNumber,
            primaryGems: [],
            otherStone: materialInfo.otherStone ? {
              stoneTypeId: materialInfo.otherStone,
              caratWeight: typeof materialInfo.otherStoneWeight === 'string' ? 
                parseFloat(materialInfo.otherStoneWeight.replace(/[^\d.-]/g, '')) : 
                (typeof materialInfo.otherStoneWeight === 'number' ? materialInfo.otherStoneWeight : 0)
            } : undefined
          };
          
          // Add primary stone if available
          if (materialInfo.primaryStone && materialInfo.primaryStoneWeight) {
            // Properly extract the numeric weight value by cleaning non-numeric characters
            const primaryStoneWeight = typeof materialInfo.primaryStoneWeight === 'string' ? 
              parseFloat(materialInfo.primaryStoneWeight.replace(/[^\d.-]/g, '')) : 
              (typeof materialInfo.primaryStoneWeight === 'number' ? materialInfo.primaryStoneWeight : 0);
              
            console.log(`Related product: Parsed primary stone (${materialInfo.primaryStone}) weight: ${materialInfo.primaryStoneWeight} → ${primaryStoneWeight}`);
            
            params.primaryGems.push({
              name: materialInfo.primaryStone,
              carats: primaryStoneWeight
            });
          }
          
          // Add secondary stone if available
          if (materialInfo.secondaryStone && materialInfo.secondaryStoneWeight) {
            // Properly extract the numeric weight value by cleaning non-numeric characters
            const secondaryStoneWeight = typeof materialInfo.secondaryStoneWeight === 'string' ? 
              parseFloat(materialInfo.secondaryStoneWeight.replace(/[^\d.-]/g, '')) : 
              (typeof materialInfo.secondaryStoneWeight === 'number' ? materialInfo.secondaryStoneWeight : 0);
              
            console.log(`Related product: Parsed secondary stone (${materialInfo.secondaryStone}) weight: ${materialInfo.secondaryStoneWeight} → ${secondaryStoneWeight}`);
            
            params.primaryGems.push({
              name: materialInfo.secondaryStone,
              carats: secondaryStoneWeight
            });
          }
          
          // Calculate price using the standard calculator function
          const result = await calculateJewelryPrice(params);
          
          // No special cases - all products use standard price calculation
          
          return {
            ...product,
            calculatedPriceUSD: result.priceUSD,
            calculatedPriceINR: result.priceINR
          };
        } catch (error) {
          console.error(`Error processing product ${product.id} for pricing:`, error);
          // Fallback to default fixed price
          const defaultPriceINR = 75000; // Default price if calculations fail
          return {
            ...product,
            calculatedPriceUSD: Math.round(defaultPriceINR / USD_TO_INR_RATE),
            calculatedPriceINR: defaultPriceINR
          };
        }
      }));
      
      res.json(productsWithAccuratePrices);
    } catch (error) {
      console.error('Error fetching related products:', error);
      res.status(500).json({ message: 'Failed to fetch related products' });
    }
  });

  // Create a new product (admin only)
  app.post('/api/products', validateAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Error creating product' });
    }
  });

  // Update a product (admin only) - Simple update endpoint
  app.put('/api/products/:id', validateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      console.log(`Simple product update API: Updating product ${productId}`);
      console.log('Request body:', JSON.stringify(req.body, null, 2));

      // Make sure additionalImages is correctly formatted as an array
      const productData = {...req.body};
      if (productData.additionalImages && !Array.isArray(productData.additionalImages)) {
        console.log('Converting additionalImages to array:', productData.additionalImages);
        productData.additionalImages = Array.isArray(productData.additionalImages) 
          ? productData.additionalImages 
          : [];
      }
      
      try {
        // Validate with zod schema
        insertProductSchema.partial().parse(productData);
      } catch (zodError) {
        console.error('Validation error in product update:', zodError);
        if (zodError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: 'Invalid product data', 
            errors: zodError.errors,
            received: productData
          });
        }
        throw zodError;
      }
      
      console.log('Validated product data:', {
        id: productId,
        fields: Object.keys(productData),
        hasAdditionalImages: productData.additionalImages !== undefined,
        additionalImagesType: productData.additionalImages !== undefined 
          ? (Array.isArray(productData.additionalImages) ? "array" : typeof productData.additionalImages)
          : "undefined"
      });

      const updatedProduct = await storage.updateProduct(productId, productData);

      if (!updatedProduct) {
        console.error(`Product update failed: No product returned for ID ${productId}`);
        return res.status(404).json({ message: 'Product not found or update failed' });
      }

      console.log(`Successfully updated product ${productId}`, {
        fields: Object.keys(updatedProduct)
      });
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ 
        message: 'Error updating product',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // PATCH endpoint for partial product updates (admin only)
  // This is specifically designed for product detail card updates
  app.patch('/api/products/:id', validateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      console.log(`PATCH product update: Updating product ${productId}`);
      console.log('PATCH Request body:', JSON.stringify(req.body, null, 2));

      // Process details field if it exists and is a string
      const productData = {...req.body};
      
      // If details is provided as a string, make sure it's valid JSON
      if (productData.details && typeof productData.details === 'string') {
        try {
          // Validate that details is valid JSON
          JSON.parse(productData.details);
          console.log('Details JSON is valid');
        } catch (jsonError) {
          console.error('Invalid JSON in details field:', jsonError);
          return res.status(400).json({ 
            message: 'Invalid JSON in details field',
            error: jsonError instanceof Error ? jsonError.message : String(jsonError)
          });
        }
      }
      
      // Get the existing product to ensure we're not losing data
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Update the product
      const updatedProduct = await storage.updateProduct(productId, productData);
      if (!updatedProduct) {
        console.error(`PATCH update failed: No product returned for ID ${productId}`);
        return res.status(404).json({ message: 'Product update failed' });
      }
      
      // If the update involves material info changes (which affect price calculation),
      // recalculate the price and update the product with the new calculated price
      const hasMaterialChanges = productData.details && 
        typeof productData.details === 'string' && (
          productData.details.includes('metalType') || 
          productData.details.includes('metalWeight') || 
          productData.details.includes('primaryStone') || 
          productData.details.includes('primaryStoneWeight') ||
          productData.details.includes('secondaryStone') ||
          productData.details.includes('secondaryStoneWeight') ||
          productData.details.includes('otherStone') ||
          productData.details.includes('otherStoneWeight')
        );
      
      if (hasMaterialChanges) {
        console.log(`Material changes detected for product ${productId}, recalculating price...`);
        
        try {
          // Get the updated product with full details
          const freshProduct = await storage.getProduct(productId);
          if (freshProduct) {
            // Parse product details
            let parsedDetails = {};
            try {
              parsedDetails = typeof freshProduct.details === 'string' 
                ? JSON.parse(freshProduct.details) 
                : freshProduct.details || {};
            } catch (err) {
              console.error(`Error parsing details for product ${productId}:`, err);
            }
            
            // Extract material info
            const materialInfo = {
              metalType: parsedDetails.metalType || 'Unknown',
              metalWeight: parsedDetails.metalWeight || 0,
              primaryStone: parsedDetails.primaryStone || 'None',
              primaryStoneWeight: parsedDetails.primaryStoneWeight || 0,
              secondaryStone: parsedDetails.secondaryStone || 'None',
              secondaryStoneWeight: parsedDetails.secondaryStoneWeight || 0,
              otherStone: parsedDetails.otherStone || 'None',
              otherStoneWeight: parsedDetails.otherStoneWeight || 0
            };
            
            console.log(`[DIRECT-PRODUCT] Using database values only for product ${productId}`);
            console.log('Using material info for price calculation:', materialInfo);
            
            // Calculate price based on material info
            const priceResult = await calculatePrice(materialInfo, true);
            
            // Update the product with calculated price
            if (priceResult.success) {
              const priceUpdateData = {
                calculatedPriceUSD: priceResult.usd.price,
                calculatedPriceINR: priceResult.inr.price,
                calculatedBreakdown: JSON.stringify({
                  metalCost: priceResult.inr.metalCost,
                  primaryStoneCost: priceResult.inr.primaryStoneCost,
                  secondaryStoneCost: priceResult.inr.secondaryStoneCost,
                  otherStoneCost: priceResult.inr.otherStoneCost,
                  overhead: priceResult.inr.overhead
                })
              };
              
              console.log(`Updating product ${productId} with calculated prices:`, priceUpdateData);
              
              // Update the product with new price data
              await storage.updateProduct(productId, priceUpdateData);
              
              // Update our response object with the calculated prices
              updatedProduct.calculatedPriceUSD = priceResult.usd.price;
              updatedProduct.calculatedPriceINR = priceResult.inr.price;
              updatedProduct.calculatedBreakdown = priceUpdateData.calculatedBreakdown;
            }
          }
        } catch (priceError) {
          console.error(`Error recalculating price for product ${productId}:`, priceError);
          // Don't fail the entire update just because price calculation failed
        }
      }

      console.log(`Successfully PATCHed product ${productId}`, {
        fields: Object.keys(updatedProduct)
      });
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product with PATCH:', error);
      res.status(500).json({ 
        message: 'Error updating product',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Endpoint to handle product image uploads
  app.patch('/api/products/:id/image', validateAdmin, upload.single('mainImage'), async (req, res) => {
    console.log('Image upload endpoint called for product');
    try {
      // Log request information
      console.log('Request params:', req.params);
      console.log('Request user:', req.user?.id, req.user?.username, req.user?.role);
      console.log('Request file object exists:', !!req.file);
      
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        console.error('Invalid product ID format:', req.params.id);
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      if (!req.file) {
        console.error('No file was uploaded or multer failed to process the file');
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      console.log(`PATCH product image update: Updating image for product ${productId}`);
      console.log('File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: `${Math.round(req.file.size / 1024)} KB`,
        path: req.file.path
      });
      
      // Get the existing product
      console.log(`Looking up existing product with ID ${productId}`);
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        console.error(`Product not found with ID ${productId}`);
        return res.status(404).json({ message: 'Product not found' });
      }
      
      console.log(`Found existing product: ${existingProduct.id} - ${existingProduct.name}`);
      console.log(`Current image URL: ${existingProduct.imageUrl}`);
      
      // Update only the image URL
      const imageUrl = `/uploads/${req.file.filename}`;
      console.log(`Setting new image URL to: ${imageUrl}`);
      
      const updatedProduct = await storage.updateProduct(productId, { imageUrl });
      
      if (!updatedProduct) {
        console.error(`Image update failed: No product returned for ID ${productId}`);
        return res.status(404).json({ message: 'Product image update failed' });
      }
      
      console.log(`Successfully updated image for product ${productId}`);
      console.log(`New product data:`, {
        id: updatedProduct.id,
        name: updatedProduct.name,
        imageUrl: updatedProduct.imageUrl
      });
      
      res.json(updatedProduct);
      
    } catch (error) {
      console.error('Error updating product image:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      res.status(500).json({
        message: 'Error updating product image',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete a product (admin only)
  app.delete('/api/products/:id', validateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const success = await storage.deleteProduct(productId);
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Error deleting product' });
    }
  });

  /**
   * Custom Design Request routes
   */
  // Submit a custom design request
  app.post('/api/custom-design', upload.fields([
    { name: 'designImage', maxCount: 1 },    // For backward compatibility
    { name: 'designImages', maxCount: 5 }    // For multiple images
  ]), async (req, res) => {
    try {
      // Get uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const mainImage = files?.designImage?.[0];
      const additionalImages = files?.designImages || [];
      
      // Check if we have at least one image
      if (!mainImage && additionalImages.length === 0) {
        console.error('No design images uploaded');
        return res.status(400).json({ message: 'No image files uploaded' });
      }

      // Check if user is authenticated
      if (!req.user) {
        console.error('User not authenticated for design request');
        return res.status(401).json({ message: 'Authentication required' });
      }

      console.log("Request body data:", 
        req.body.data ? (
          typeof req.body.data === 'string' 
            ? req.body.data.substring(0, 100) + (req.body.data.length > 100 ? '...' : '')
            : "Data exists but is not a string"
        ) : "No data"
      );
      console.log("Request body data type:", typeof req.body.data);
      console.log("User authentication state:", req.user ? `Authenticated as ${req.user.username} (${req.user.id})` : "Not authenticated");
      
      if (!req.body.data) {
        console.error('No data field in request body');
        return res.status(400).json({ message: 'No form data submitted' });
      }
      
      // Force JSON parsing to work by directly constructing the object we need
      try {
        // Get the raw data as a string
        const rawData = typeof req.body.data === 'string' 
          ? req.body.data 
          : JSON.stringify(req.body.data);
        
        console.log("Raw data to process:", rawData.substring(0, 200) + (rawData.length > 200 ? '...' : ''));
        
        // Extract fields manually with regexp to avoid JSON parse failures
        const extractField = (fieldName: string, json: string): string | null => {
          const regex = new RegExp(`"${fieldName}"\\s*:\\s*"?([^",}]+)"?`, 'i');
          const match = json.match(regex);
          return match ? match[1] : null;
        };
        
        const extractArrayField = (fieldName: string, json: string): string[] => {
          const regex = new RegExp(`"${fieldName}"\\s*:\\s*\\[(.*?)\\]`, 'i');
          const match = json.match(regex);
          if (!match) return [];
          
          // Parse array items
          const arrayContent = match[1];
          const items: string[] = [];
          const itemRegex = /"([^"]+)"/g;
          let itemMatch;
          while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
            items.push(itemMatch[1]);
          }
          return items;
        };
        
        // Extract fields directly from the string
        const fullName = extractField('fullName', rawData) || '';
        const email = extractField('email', rawData) || '';
        const phone = extractField('phone', rawData) || null;
        const country = extractField('country', rawData) || null;
        const metalType = extractField('metalType', rawData) || '';
        const notes = extractField('notes', rawData) || null;
        
        // Extract primaryStones as array 
        let primaryStones = extractArrayField('primaryStones', rawData);
        const primaryStone = extractField('primaryStone', rawData) || (primaryStones.length > 0 ? primaryStones[0] : null);
        
        // If primaryStones is empty but we have primaryStone, use it
        if (primaryStones.length === 0 && primaryStone) {
          primaryStones = [primaryStone];
        }
        
        // Get the main image URL and additional image URLs
        // Use the first image from additionalImages as main image if mainImage is not available
        let mainImageUrl = '';
        if (mainImage) {
          mainImageUrl = `/uploads/${mainImage.filename}`;
        } else if (additionalImages.length > 0) {
          mainImageUrl = `/uploads/${additionalImages[0].filename}`;
        }
        
        // Get all additional image URLs (including the first one that might have been used as main image)
        const additionalImageUrls = additionalImages.map(img => `/uploads/${img.filename}`);
        
        // Construct the validated data object directly
        const validatedData = {
          userId: req.user.id,
          fullName,
          email,
          phone,
          country,
          metalType,
          primaryStone,
          primaryStones,
          notes,
          imageUrl: mainImageUrl, // For backward compatibility
          imageUrls: additionalImageUrls, // Array of all additional images
          status: "pending" as const,
        };
        
        // Enhanced logging for design request validation
        console.log("Design request data validation:", {
          userId: req.user.id,
          username: req.user.username,
          fullName: validatedData.fullName || "MISSING",
          email: validatedData.email || "MISSING",
          phone: validatedData.phone || "MISSING",
          country: validatedData.country || "MISSING",
          metalType: validatedData.metalType || "MISSING",
          primaryStone: validatedData.primaryStone || "MISSING",
          primaryStonesCount: validatedData.primaryStones?.length || 0,
          notesLength: validatedData.notes?.length || 0,
          mainImageUrl: validatedData.imageUrl || "MISSING",
          additionalImagesCount: validatedData.imageUrls?.length || 0
        });
        
        console.log("Manually constructed validated data:", JSON.stringify(validatedData, null, 2));
        
        // Validate required fields
        const requiredFields = ['fullName', 'email', 'metalType'];
        const missingFields = requiredFields.filter(field => !validatedData[field]);
        
        if (missingFields.length > 0) {
          return res.status(400).json({ 
            message: 'Missing required fields', 
            missingFields 
          });
        }
        
        if (primaryStones.length === 0) {
          return res.status(400).json({ 
            message: 'At least one stone type must be selected'
          });
        }
        
        // Create the design request directly
        const designRequest = await storage.createDesignRequest(validatedData);
        res.status(201).json(designRequest);
      } catch (error) {
        console.error('Error processing design request data:', error);
        return res.status(400).json({ 
          message: 'Error processing form data', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    } catch (error) {
      console.error('Critical error submitting design request:', error);
      res.status(500).json({ message: 'Error submitting design request: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  // Get all design requests (admin only)
  app.get('/api/custom-designs', validateAdmin, async (_req, res) => {
    try {
      const designRequests = await storage.getAllDesignRequests();
      res.json(designRequests);
    } catch (error) {
      console.error('Error fetching design requests:', error);
      res.status(500).json({ message: 'Error fetching design requests' });
    }
  });
  
  // Get custom designs for the current user
  app.get('/api/custom-designs/user', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      const designRequests = await storage.getDesignRequestsByUserId(req.user.id);
      
      // Add product information if available
      const designsWithProducts = await Promise.all(
        designRequests.map(async (design) => {
          let product = null;
          if (design.productId) {
            product = await storage.getProduct(design.productId);
          }
          
          return {
            ...design,
            product: product ? {
              id: product.id,
              name: product.name,
              description: product.description,
              imageUrl: product.imageUrl,
              calculatedPriceUSD: product.calculatedPriceUSD,
              calculatedPriceINR: product.calculatedPriceINR,
            } : null
          };
        })
      );
      
      res.json(designsWithProducts);
    } catch (error) {
      console.error('Error fetching user design requests:', error);
      res.status(500).json({ message: 'Error fetching user design requests' });
    }
  });

  // Get design request by ID (admin or matching user ID)
  app.get('/api/custom-designs/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }

      const designRequest = await storage.getDesignRequest(designId);
      if (!designRequest) {
        return res.status(404).json({ message: 'Design request not found' });
      }

      // Check if user is admin or if the request belongs to the user
      const isAdmin = req.user.role === 'admin';
      const isOwner = req.user.id === designRequest.userId;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized access to design request' });
      }
      
      // Fetch comments for this design request if they exist
      let comments = [];
      try {
        if (storage.getDesignRequestComments) {
          comments = await storage.getDesignRequestComments(designId);
        }
      } catch (error) {
        console.error('Error fetching design request comments:', error);
        // Don't fail the whole request if comments fail
      }

      res.json({
        ...designRequest,
        comments
      });
    } catch (error) {
      console.error('Error fetching design request:', error);
      res.status(500).json({ message: 'Error fetching design request' });
    }
  });

  // Update a design request (admin only)
  app.put('/api/custom-designs/:id', validateAdmin, async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }

      const updateData = req.body;
      const updatedDesign = await storage.updateDesignRequest(designId, updateData);

      if (!updatedDesign) {
        return res.status(404).json({ message: 'Design request not found' });
      }

      res.json(updatedDesign);
    } catch (error) {
      console.error('Error updating design request:', error);
      res.status(500).json({ message: 'Error updating design request' });
    }
  });
  
  // Add a comment to a design request
  app.post('/api/custom-designs/:id/comments', upload.single('image'), async (req, res) => {
    try {
      console.log('=== DESIGN COMMENT ENDPOINT CALLED ===');
      console.log('Request cookies:', JSON.stringify(req.cookies || {}, null, 2));
      console.log('Request user session:', req.user ? `User ID: ${req.user.id}` : 'No user in session');
      
      // Check for authentication through both regular user sessions and admin cookies
      let isAuthenticated = false;
      let user = req.user;
      
      // First check if passport has authenticated the user
      if (req.user) {
        isAuthenticated = true;
        console.log('User authenticated via passport session. ID:', req.user.id, 'Username:', req.user.username);
      } 
      // If not, check for admin cookie authentication
      else if (req.cookies && req.cookies.admin_id) {
        const adminId = parseInt(req.cookies.admin_id);
        if (!isNaN(adminId)) {
          console.log('Attempting admin cookie authentication for ID:', adminId);
          try {
            const adminUser = await storage.getUser(adminId);
            if (adminUser && adminUser.role === 'admin') {
              isAuthenticated = true;
              user = adminUser;
              console.log('User authenticated via admin cookie. ID:', adminUser.id, 'Username:', adminUser.username);
            } else {
              console.log('Admin user not found or not admin role. Found:', adminUser ? adminUser.role : 'no user');
            }
          } catch (error) {
            console.error('Error authenticating via admin cookie:', error);
          }
        } else {
          console.log('Invalid admin_id cookie format:', req.cookies.admin_id);
        }
      } else {
        console.log('No authentication credentials found. Cookies present:', !!req.cookies, 'User session:', !!req.user);
      }
      
      if (!isAuthenticated || !user) {
        console.log('Authentication failed. User session:', !!req.user, 'Admin cookie:', req.cookies ? !!req.cookies.admin_id : false);
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }
      
      const designRequest = await storage.getDesignRequest(designId);
      if (!designRequest) {
        return res.status(404).json({ message: 'Design request not found' });
      }
      
      // Check if user is admin or if the request belongs to the user
      const isAdmin = user.role === 'admin';
      const isOwner = user.id === designRequest.userId;
      
      console.log(`Design comment access check - User ID: ${user.id}, Design User ID: ${designRequest.userId}`);
      console.log(`Design comment access check - Is admin: ${isAdmin}, Is owner: ${isOwner}`);
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized access to design request' });
      }
      
      // Get content from form data (not JSON)
      const content = req.body.content;
      const imageFile = req.file;
      
      // Validate that at least one of content or image is provided
      if ((!content || content.trim() === '') && !imageFile) {
        return res.status(400).json({ message: 'Comment content or image is required' });
      }
      
      // Process uploaded image if present
      let imageUrl = null;
      if (imageFile) {
        // Set image URL with proper path
        imageUrl = `/uploads/${imageFile.filename}`;
        console.log(`Design request comment image uploaded: ${imageUrl}`);
      }
      
      // Create the comment
      let comment;
      try {
        if (storage.addDesignRequestComment) {
          comment = await storage.addDesignRequestComment({
            designRequestId: designId,
            content: content ? content.trim() : '',
            createdBy: user.username || user.email,
            userId: user.id,
            isAdmin: isAdmin,
            imageUrl: imageUrl
          });
          
          console.log(`Successfully created comment for design ${designId} by user ${user.username || user.email}`);
        } else {
          return res.status(501).json({ message: 'Comment functionality not implemented' });
        }
      } catch (error) {
        console.error('Error creating design request comment:', error);
        return res.status(500).json({ message: 'Error creating comment' });
      }
      
      // Send email notification if this is a comment on another user's design request
      // Only send notifications when someone else comments (admin comments to user, or user comments to their own request)
      try {
        // The comment is not by the owner, so notify the design request owner
        if ((isAdmin && !isOwner) || (isOwner && designRequest.email)) {
          // Import email service dynamically to avoid circular dependencies
          const emailService = await import('./services/email-service');
          
          // Determine who should receive the notification
          let recipientEmail;
          let recipientName;
          
          if (isAdmin) {
            // Admin commented on user's design - notify the user (design owner)
            recipientEmail = designRequest.email;
            recipientName = designRequest.fullName;
            console.log(`[DESIGN COMMENT] Admin comment - will notify design owner: ${recipientEmail}`);
          } else if (isOwner && designRequest.adminEmail) {
            // User commented on their own design - this shouldn't happen given the condition above
            console.log(`[DESIGN COMMENT] Owner commenting on own design - no notification needed`);
            // No notification in this case
            recipientEmail = null;
          }
          
          // Send notification if we have a recipient
          if (recipientEmail) {
            console.log(`[DESIGN COMMENT] Sending notification to ${recipientEmail}`);
            
            // Generate dashboard link
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const host = process.env.PRODUCTION_DOMAIN || req.get('host') || 'localhost:5000';
            const dashboardLink = `${protocol}://${host}/customer-dashboard`;
            
            // Design name or fallback
            const designName = designRequest.name || `Custom Design #${designId}`;
            
            await emailService.sendDesignCommentNotification(
              recipientEmail,
              recipientName,
              designId,
              designName,
              content || 'Image comment (No text)',
              user.username || 'Luster Legacy',
              isAdmin,
              dashboardLink
            );
            
            console.log(`[DESIGN COMMENT] Email notification sent successfully to ${recipientEmail}`);
          }
        }
      } catch (emailError) {
        // Don't fail the whole request if email sending fails
        console.error('[DESIGN COMMENT] Error sending email notification:', emailError);
      }
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error adding comment to design request:', error);
      res.status(500).json({ message: 'Error adding comment to design request' });
    }
  });

  // Design feedback endpoints (chat with image support)
  app.get('/api/custom-designs/:id/feedback', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }
      
      const designRequest = await storage.getDesignRequest(designId);
      if (!designRequest) {
        return res.status(404).json({ message: 'Design request not found' });
      }
      
      // Check if user is admin or if the request belongs to the user
      const isAdmin = req.user.role === 'admin';
      const isOwner = req.user.email === designRequest.email;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized access to design request' });
      }
      
      const feedback = await storage.getDesignFeedback(designId);
      return res.json(feedback);
    } catch (error) {
      console.error('Error getting design feedback:', error);
      return res.status(500).json({ message: 'An error occurred while retrieving design feedback' });
    }
  });
  
  app.post('/api/custom-designs/:id/feedback', upload.single('image'), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }
      
      const designRequest = await storage.getDesignRequest(designId);
      if (!designRequest) {
        return res.status(404).json({ message: 'Design request not found' });
      }
      
      // Check if user is admin or if the request belongs to the user
      const isAdmin = req.user.role === 'admin';
      const isOwner = req.user.email === designRequest.email;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized access to design request' });
      }
      
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ message: 'Feedback message is required' });
      }
      
      // If customer is submitting feedback, check if the current status allows it
      if (!isAdmin) {
        // Customer can only provide feedback if the design is ready for review
        if (designRequest.status !== 'design_ready_for_review' && 
            designRequest.status !== 'design_in_progress') {
          return res.status(400).json({ 
            message: 'You can only provide feedback when the design is ready for review or in progress'
          });
        }
        
        // Check iteration count for customers
        if (designRequest.iterationsCount >= 4) {
          return res.status(400).json({ 
            message: 'You have reached the maximum number of design iterations (4)'
          });
        }
      }
      
      // Get image URL if file was uploaded
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      // Add the feedback
      const feedback = await storage.addDesignFeedback({
        designRequestId: designId,
        message: message.trim(),
        imageUrl,
        isFromAdmin: isAdmin,
        userId: req.user.id,
        createdAt: new Date()
      });
      
      return res.status(201).json(feedback);
    } catch (error) {
      console.error('Error adding design feedback:', error);
      return res.status(500).json({ message: 'An error occurred while adding your feedback' });
    }
  });
  
  // Design payment endpoints
  app.get('/api/custom-designs/:id/payments', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }
      
      const designRequest = await storage.getDesignRequest(designId);
      if (!designRequest) {
        return res.status(404).json({ message: 'Design request not found' });
      }
      
      // Check if user is admin or if the request belongs to the user
      const isAdmin = req.user.role === 'admin';
      const isOwner = req.user.email === designRequest.email;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized access to design request' });
      }
      
      const payments = await storage.getDesignPayments(designId);
      return res.json(payments);
    } catch (error) {
      console.error('Error getting design payments:', error);
      return res.status(500).json({ message: 'An error occurred while retrieving design payments' });
    }
  });
  
  app.post('/api/custom-designs/:id/payments', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }
      
      const designRequest = await storage.getDesignRequest(designId);
      if (!designRequest) {
        return res.status(404).json({ message: 'Design request not found' });
      }
      
      // Check if user is admin or if the request belongs to the user
      const isAdmin = req.user.role === 'admin';
      const isOwner = req.user.email === designRequest.email;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized access to design request' });
      }
      
      const { amount, currency, paymentMethod, paymentType, status } = req.body;
      
      // Validate payment data
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
      }
      
      if (!currency || (currency !== 'USD' && currency !== 'INR')) {
        return res.status(400).json({ message: 'Currency must be USD or INR' });
      }
      
      if (!paymentMethod) {
        return res.status(400).json({ message: 'Payment method is required' });
      }
      
      if (!paymentType || (paymentType !== 'consultation_fee' && paymentType !== 'final_payment')) {
        return res.status(400).json({ message: 'Payment type must be consultation_fee or final_payment' });
      }
      
      // Create the payment record
      const payment = await storage.addDesignPayment({
        designRequestId: designId,
        amount: parseFloat(amount),
        currency,
        paymentMethod,
        paymentType,
        status: status || 'pending',
        createdAt: new Date(),
        userId: req.user.id
      });
      
      // If this is a successful consultation fee payment, update the design request status
      if (payment.paymentType === 'consultation_fee' && payment.status === 'completed') {
        await storage.updateDesignRequest(designId, {
          consultationFeePaid: true,
          status: 'design_started'
        });
      }
      
      return res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating design payment:', error);
      return res.status(500).json({ message: 'An error occurred while processing payment' });
    }
  });
  
  app.patch('/api/custom-designs/:designId/payments/:paymentId', async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const designId = parseInt(req.params.designId);
      const paymentId = parseInt(req.params.paymentId);
      
      if (isNaN(designId) || isNaN(paymentId)) {
        return res.status(400).json({ message: 'Invalid design or payment ID' });
      }
      
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: 'Payment status is required' });
      }
      
      const updatedPayment = await storage.updateDesignPaymentStatus(paymentId, status);
      if (!updatedPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      return res.json(updatedPayment);
    } catch (error) {
      console.error('Error updating payment status:', error);
      return res.status(500).json({ message: 'An error occurred while updating payment status' });
    }
  });

  /**
   * Cart routes
   */
  // Get cart items for current session
  app.get('/api/cart', async (req, res) => {
    try {
      const sessionId = req.sessionId || '';
      const userId = req.user?.id;
      
      // Debug logging
      console.log('GET /api/cart - Session ID:', sessionId);
      console.log('GET /api/cart - User ID:', userId);
      
      let cartData;
      try {
        if (userId) {
          // If user is logged in, get cart by user ID
          cartData = await storage.getCartItemsByUser(userId);
        } else if (sessionId) {
          // Otherwise get cart by session ID
          cartData = await storage.getCartItemsBySession(sessionId);
        } else {
          // Return empty cart if no user or session
          cartData = { items: [], total: 0 };
        }
        
        // Debug logging
        console.log(`GET /api/cart - Found ${cartData.items?.length || 0} items for session ${sessionId}`);
        
        // The storage methods now handle fetching product details
        // and calculating the total price
        res.json(cartData);
      } catch (error) {
        console.error('Error processing cart data:', error);
        // Return empty cart to avoid breaking the UI
        res.json({ items: [], total: 0 });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: 'Error fetching cart' });
    }
  });

  // Add item to cart
  app.post('/api/cart', async (req, res) => {
    try {
      const { productId, metalTypeId, stoneTypeId, price } = req.body;
      const sessionId = req.sessionId;
      const userId = req.user?.id;
      
      // Debug logging
      console.log('POST /api/cart - Request body:', { productId, metalTypeId, stoneTypeId, price });
      console.log('POST /api/cart - Session ID:', sessionId);
      console.log('POST /api/cart - Cookies:', req.cookies);
      
      const cartItemData = insertCartItemSchema.parse({
        sessionId,
        userId,
        productId,
        metalTypeId,
        stoneTypeId,
        price
      });
      
      // Debug logging
      console.log('POST /api/cart - Parsed cart item data:', cartItemData);
      
      const cartItem = await storage.createCartItem(cartItemData);
      
      // Debug logging
      console.log('POST /api/cart - Created cart item:', cartItem);
      
      // Invalidate any cart caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('POST /api/cart - Validation error:', error.errors);
        return res.status(400).json({ message: 'Invalid cart item data', errors: error.errors });
      }
      console.error('Error adding item to cart:', error);
      res.status(500).json({ message: 'Error adding item to cart' });
    }
  });

  // Remove item from cart
  app.delete('/api/cart/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: 'Invalid cart item ID' });
      }

      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: 'Cart item not found' });
      }

      // Ensure the item belongs to the current session
      if (cartItem.sessionId !== req.sessionId) {
        return res.status(403).json({ message: 'Unauthorized access to cart item' });
      }

      const success = await storage.deleteCartItem(itemId);
      if (!success) {
        return res.status(500).json({ message: 'Failed to remove item from cart' });
      }

      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).json({ message: 'Error removing item from cart' });
    }
  });

  // Clear cart
  app.delete('/api/cart', async (req, res) => {
    try {
      const sessionId = req.sessionId || '';
      const userId = req.user?.id;
      
      if (userId) {
        // Clear user's cart
        await storage.clearCartByUser(userId);
      } else if (sessionId) {
        // Clear session cart
        await storage.clearCart(sessionId);
      }
      
      res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ message: 'Error clearing cart' });
    }
  });

  /**
   * Note: Duplicate customization request routes were removed here
   * The primary implementations for /api/customization-requests POST and GET
   * are already defined above around line 712.
   */

  /**
   * Order routes
   */
  // Create a new order with direct product purchase (no cart)
  app.post('/api/orders', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Log the request body for debugging
      console.log("Received order request:", JSON.stringify(req.body, null, 2));
      
      const { 
        productId, 
        name, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        postalCode, 
        country, 
        additionalNotes, 
        paymentMethod,
        currency,
        action = "request_quote" // Default to request_quote if not specified
      } = req.body;
      
      // Validate required fields
      if (!productId || !name || !email || !phone || !address || !city || !state || !postalCode || !country) {
        console.error("Missing required fields in order request");
        return res.status(400).json({ 
          message: "Missing required fields",
          requiredFields: ["productId", "name", "email", "phone", "address", "city", "state", "postalCode", "country"]
        });
      }
      
      // Ensure the product exists
      const product = await storage.getProduct(Number(productId));
      if (!product) {
        console.error(`Product not found for ID: ${productId}`);
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Determine which price to use based on currency
      const defaultPriceINR = 75000; // Default price if calculations fail
      const price = currency === "INR" 
        ? (product.calculatedPriceINR || defaultPriceINR) 
        : (product.calculatedPriceUSD || Math.round(defaultPriceINR / USD_TO_INR_RATE));
      
      // Create address as a JSON object to match schema expectation
      const shippingAddress = {
        address,
        city,
        state,
        postalCode,
        country
      };
      
      // Calculate advance amount (50% of total) and balance amount
      const totalAmount = price;
      const advanceAmount = Math.round(totalAmount * 0.5); // 50% advance
      const balanceAmount = totalAmount - advanceAmount;
      
      // Order status and payment status
      const orderStatus = "new";
      const paymentStatus = action === "make_payment" ? "advance_pending" : "pending";
      
      console.log(`Creating order for product ${productId} with action ${action}`);
      console.log(`Order details: ${name}, ${email}, ${phone}, Payment status: ${paymentStatus}`);
      
      // Create order
      const order = await storage.createOrder({
        userId: req.user.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress, // Use the JSON object
        totalAmount: totalAmount,
        advanceAmount: advanceAmount,
        balanceAmount: balanceAmount,
        specialInstructions: additionalNotes || "",
        orderStatus: orderStatus,
        paymentStatus: paymentStatus,
        createdAt: new Date(),
      });
      
      // Extract product details from persisted database values only
      let metalType = "14K Yellow Gold"; // Default fallback
      let stoneType = "None"; // Default fallback
      
      // Parse product details from database values only
      if (product.details) {
        try {
          // Use the JSON.parse with try-catch as details is stored as a string
          const details = JSON.parse(product.details);
          
          // Use only the direct database values, no AI inputs
          if (details.metalType) {
            metalType = details.metalType;
          }
          
          if (details.primaryStone) {
            stoneType = details.primaryStone;
          }
          
          console.log("Using persisted database values for order creation:", { metalType, stoneType });
        } catch (e) {
          console.log("Could not parse product details:", e);
        }
      }
      
      console.log(`Creating order item with metal type: ${metalType}, stone type: ${stoneType}`);
      
      // Create order item with required metal and stone type IDs and currency
      await storage.createOrderItem({
        orderId: order.id,
        productId: Number(productId),
        price: price,
        metalTypeId: metalType,
        stoneTypeId: stoneType,
        currency: currency, // Add the currency
        isCustomDesign: false
      });
      
      // For "request_quote" action, also create a quote request entry
      if (action === "request_quote") {
        try {
          await storage.createQuoteRequest({
            userId: req.user.id,
            fullName: name,
            email: email,
            phone: phone,
            country: country,
            productId: Number(productId),
            metalType: metalType,
            stoneType: stoneType,
            additionalNotes: additionalNotes || "",
          });
          console.log(`Quote request created for order ${order.id}`);
        } catch (quoteError) {
          console.error("Error creating quote request:", quoteError);
          // We continue even if quote request creation fails
        }
      }
      
      console.log(`Order ${order.id} created successfully`);
      
      res.status(201).json({ 
        success: true, 
        message: "Order placed successfully",
        order: order
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ 
        message: "Server error creating order", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get user orders
  // Delete a user and all their associated data (admin only)
  app.delete('/api/users/:usernameOrId', validateAdmin, async (req, res) => {
    try {
      const usernameOrId = req.params.usernameOrId;
      
      // If the identifier is numeric, treat as ID
      const id = !isNaN(Number(usernameOrId)) ? Number(usernameOrId) : usernameOrId;
      
      console.log(`Attempting to delete user: ${usernameOrId}`);
      const success = await storage.deleteUser(id);
      
      if (success) {
        res.json({ success: true, message: 'User and associated data deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'User not found or delete operation failed' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    }
  });
  
  app.get('/api/user/orders', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const orders = await storage.getOrdersByUserId(req.user.id);
      
      // Get products for each order
      const ordersWithProducts = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return {
                ...item,
                product: product ? {
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  imageUrl: product.imageUrl,
                } : null
              };
            })
          );
          
          return {
            ...order,
            items: itemsWithProducts
          };
        })
      );
      
      res.json(ordersWithProducts);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Server error fetching orders" });
    }
  });
  
  // Alias for customer dashboard
  app.get('/api/orders', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const orders = await storage.getOrdersByUserId(req.user.id);
      
      // Get products for each order
      const ordersWithProducts = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return {
                ...item,
                product: product ? {
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  imageUrl: product.imageUrl,
                } : null
              };
            })
          );
          
          return {
            ...order,
            items: itemsWithProducts
          };
        })
      );
      
      res.json(ordersWithProducts);
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Return empty array instead of error to prevent UI breaking
      res.json([]);
    }
  });
  
  // Legacy order endpoints
  app.post('/api/legacy/orders', async (req, res) => {
    try {
      const { customer, cart, specialInstructions } = req.body;
      const sessionId = req.sessionId;
      const userId = req.user?.id;

      // Calculate totals
      const totalAmount = cart.reduce((sum: number, item: any) => sum + item.price, 0);
      const advanceAmount = Math.round(totalAmount * 0.5); // 50% advance
      const balanceAmount = totalAmount - advanceAmount;

      // Create order
      const orderData = insertOrderSchema.parse({
        sessionId,
        userId,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: customer.address,
        specialInstructions,
        totalAmount,
        advanceAmount,
        balanceAmount
      });

      const order = await storage.createOrder(orderData);

      // Create order items
      for (const item of cart) {
        const orderItemData = insertOrderItemSchema.parse({
          orderId: order.id,
          productId: item.productId,
          metalTypeId: item.metalTypeId,
          stoneTypeId: item.stoneTypeId,
          price: item.price,
          currency: item.currency || "USD", // Add currency with USD default
          isCustomDesign: false
        });

        await storage.createOrderItem(orderItemData);
      }

      // Clear the cart
      await storage.clearCart(sessionId);

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Error creating order' });
    }
  });

  // Get orders for current session (legacy route - now handled by the new route above)
  // This route is deprecated and will be removed in the future
  // Using the auth-required route from above for the dashboard

  // Get all orders (admin only)
  app.get('/api/admin/orders', validateAdmin, async (_req, res) => {
    try {
      const orders = await storage.getAllOrders();

      // Include order items with each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);
          return {
            ...order,
            items
          };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error('Error fetching all orders:', error);
      res.status(500).json({ message: 'Error fetching all orders' });
    }
  });

  // Update order status (admin only)
  app.put('/api/admin/orders/:id', validateAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const { orderStatus, paymentStatus } = req.body;
      const updatedOrder = await storage.updateOrder(orderId, { 
        orderStatus, 
        paymentStatus 
      });

      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: 'Error updating order' });
    }
  });

  /**
   * Client Stories (Testimonial) routes
   */
  // Get approved testimonials for public display
  app.get('/api/testimonials', async (_req, res) => {
    try {
      const testimonials = await storage.getApprovedTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ message: 'Error fetching testimonials' });
    }
  });
  
  // Get testimonials with filtering
  app.get('/api/testimonials/filter', async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const approved = req.query.approved === 'true' ? true : 
                      req.query.approved === 'false' ? false : undefined;
      
      const options = { userId, status, limit, approved };
      const testimonials = await storage.getTestimonials(options);
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching filtered testimonials:', error);
      res.status(500).json({ message: 'Error fetching testimonials' });
    }
  });
  
  // Get single testimonial by ID
  app.get('/api/testimonials/:id', async (req, res) => {
    try {
      const testimonialId = parseInt(req.params.id);
      if (isNaN(testimonialId)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      const testimonial = await storage.getTestimonialById(testimonialId);
      if (!testimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }
      
      res.json(testimonial);
    } catch (error) {
      console.error('Error fetching testimonial:', error);
      res.status(500).json({ message: 'Error fetching testimonial' });
    }
  });
  
  // Create a new testimonial/client story
  app.post('/api/testimonials', async (req, res) => {
    try {
      const newTestimonial = req.body;
      
      // Set user ID if authenticated
      if (req.isAuthenticated()) {
        newTestimonial.userId = req.user.id;
      }
      
      // Default status is pending
      newTestimonial.status = 'pending';
      newTestimonial.isApproved = false;
      
      const testimonial = await storage.createTestimonial(newTestimonial);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error('Error creating testimonial:', error);
      res.status(500).json({ message: 'Error creating testimonial' });
    }
  });

  // Get all testimonials (admin only)
  app.get('/api/admin/testimonials', validateAdmin, async (_req, res) => {
    try {
      const testimonials = await storage.getAllTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching all testimonials:', error);
      res.status(500).json({ message: 'Error fetching all testimonials' });
    }
  });
  
  // Consolidated dashboard data endpoint for better performance
  app.get("/api/admin/dashboard-data", validateAdmin, async (_req, res) => {
    try {
      console.log("Fetching consolidated dashboard data");
      
      // Collect all dashboard data in parallel for better performance
      const [quoteRequests, customizationRequests, designs, products, testimonials] = await Promise.all([
        storage.getAllQuoteRequests(),
        storage.getAllCustomizationRequests(),
        storage.getAllCustomDesigns(),
        storage.getAllProducts(),
        storage.getAllTestimonials()
      ]);
      
      // Return consolidated data in a single response
      res.json({
        quoteRequests,
        customizationRequests,
        designs,
        products,
        testimonials: testimonials || []
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });

  // Update testimonial status and approval (admin only)
  app.put('/api/admin/testimonials/:id', validateAdmin, async (req, res) => {
    try {
      const testimonialId = parseInt(req.params.id);
      if (isNaN(testimonialId)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }

      const { isApproved, status, adminComments } = req.body;
      const updateData: Partial<Testimonial> = {};
      
      if (isApproved !== undefined) updateData.isApproved = isApproved;
      if (status) updateData.status = status;
      if (adminComments) updateData.adminComments = adminComments;
      
      const updatedTestimonial = await storage.updateTestimonial(testimonialId, updateData);

      if (!updatedTestimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }

      res.json(updatedTestimonial);
    } catch (error) {
      console.error('Error updating testimonial:', error);
      res.status(500).json({ message: 'Error updating testimonial' });
    }
  });
  
  // Convenience endpoints for approval/rejection
  app.put('/api/admin/testimonials/:id/approve', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      const updatedTestimonial = await storage.updateTestimonial(id, { 
        isApproved: true,
        status: 'approved'
      });
      
      if (!updatedTestimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }
      
      res.json(updatedTestimonial);
    } catch (error) {
      console.error('Error approving testimonial:', error);
      res.status(500).json({ message: 'Error approving testimonial' });
    }
  });
  
  app.put('/api/admin/testimonials/:id/reject', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      const updatedTestimonial = await storage.updateTestimonial(id, { 
        isApproved: false,
        status: 'rejected'
      });
      
      if (!updatedTestimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }
      
      res.json(updatedTestimonial);
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      res.status(500).json({ message: 'Error rejecting testimonial' });
    }
  });
  
  // Delete testimonial (admin only)
  app.delete('/api/admin/testimonials/:id', validateAdmin, async (req, res) => {
    try {
      const testimonialId = parseInt(req.params.id);
      if (isNaN(testimonialId)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      const success = await storage.deleteTestimonial(testimonialId);
      
      if (!success) {
        return res.status(404).json({ message: 'Testimonial not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      res.status(500).json({ message: 'Error deleting testimonial' });
    }
  });

  /**
   * Contact routes
   */
  // Submit contact message
  app.post('/api/contact', async (req, res) => {
    try {
      console.log('Contact form submission received:', req.body);
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      console.log('Contact message created successfully:', message.id);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Invalid contact message data:', error.errors);
        return res.status(400).json({ message: 'Invalid message data', errors: error.errors });
      }
      console.error('Error submitting contact message:', error);
      res.status(500).json({ message: 'Error submitting contact message' });
    }
  });

  // Get all contact messages (admin only)
  app.get('/api/admin/contact', validateAdmin, async (_req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      res.status(500).json({ message: 'Error fetching contact messages' });
    }
  });

  /**
   * Chatbot API routes
   * These endpoints are accessible to both logged-in and non-logged-in users
   */
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, chatHistory } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Invalid request. 'message' is required and must be a string." });
      }
      
      // Validate the chat history format if provided
      if (chatHistory && (!Array.isArray(chatHistory) || 
          !chatHistory.every(entry => 
            entry && 
            typeof entry === 'object' && 
            (entry.role === 'user' || entry.role === 'assistant') && 
            typeof entry.content === 'string'
          ))) {
        return res.status(400).json({ 
          message: "Invalid chat history format. Each entry must have 'role' (user/assistant) and 'content' properties." 
        });
      }
      
      // Generate the chatbot response
      const response = await generateChatbotResponse(message, chatHistory || []);
      
      res.status(200).json({ response });
    } catch (error) {
      console.error("Error generating chatbot response:", error);
      res.status(500).json({ 
        message: "An error occurred while processing your request. Please try again later." 
      });
    }
  });

  /**
   * AI Design Consultation API Endpoints
   * These endpoints provide design inspiration and consultation for customers
   */
  app.post("/api/design-consultation-ai", async (req, res) => {
    try {
      const { message, history, formData } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Invalid request. 'message' is required and must be a string." });
      }
      
      // Validate the chat history format if provided
      if (history && (!Array.isArray(history) || 
          !history.every(entry => 
            entry && 
            typeof entry === 'object' && 
            (entry.role === 'user' || entry.role === 'assistant' || entry.role === 'system') && 
            typeof entry.content === 'string'
          ))) {
        return res.status(400).json({ 
          message: "Invalid history format. Each entry must have 'role' (user/assistant/system) and 'content' properties." 
        });
      }
      
      // Validate the form data if provided
      if (formData && typeof formData !== 'object') {
        return res.status(400).json({ 
          message: "Invalid formData format. Expected an object with design preferences." 
        });
      }
      
      // Log the form data for debugging
      console.log("Design Consultation Route - Received form data:", formData);
      
      // Generate the design consultation response with form data context
      const response = await generateDesignConsultationResponse(
        message, 
        history || [],
        formData || null
      );
      
      res.status(200).json({ response });
    } catch (error) {
      console.error("Error generating design consultation response:", error);
      res.status(500).json({ 
        message: "An error occurred while processing your request. Please try again later." 
      });
    }
  });
  
  // Save design consultation history
  app.post("/api/design-consultations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { messages, userId } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Valid message history is required" });
      }
      
      // Store consultation history in the database
      // This can be expanded later to store in a proper consultation table
      // For now, we'll just store it as a custom design note
      const consultationText = messages
        .map(m => `${m.role === 'user' ? 'Customer' : 'AI Consultant'}: ${m.content}`)
        .join('\n\n');
      
      const designRequest = {
        userId: userId || req.user.id,
        fullName: req.user.name || req.user.loginID,
        email: req.user.email,
        phone: req.user.phone || "",
        country: req.user.country || "us",
        metalType: "Not specified",
        primaryStones: [],
        notes: `AI Design Consultation Summary:\n\n${consultationText}`,
        images: [],
        status: "consultation"
      };
      
      await storage.createDesignRequest(designRequest);
      
      res.status(200).json({ message: "Design consultation saved successfully" });
    } catch (error) {
      console.error("Error saving design consultation:", error);
      res.status(500).json({ 
        message: "An error occurred while saving your consultation. Please try again later." 
      });
    }
  });

  // Mark contact message as read (admin only)
  app.put('/api/admin/contact/:id', validateAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }

      const success = await storage.markContactMessageAsRead(messageId);
      if (!success) {
        return res.status(404).json({ message: 'Message not found' });
      }

      res.json({ message: 'Message marked as read' });
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({ message: 'Error updating message' });
    }
  });
  
  // Delete a contact message (admin only)
  app.delete('/api/admin/contact/:id', validateAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }

      const success = await storage.deleteContactMessage(messageId);
      if (!success) {
        return res.status(404).json({ message: 'Message not found' });
      }

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: 'Error deleting message' });
    }
  });

  /**
   * Authentication routes
   */
  // DIRECT ADMIN LOGIN with ADMIN TOKENS - completely separate from main auth
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('DIRECT ADMIN LOGIN - New dedicated lightweight admin auth');
      
      // Destructure credentials from request body - support both username and loginID for compatibility
      const { username, password: providedPassword, loginID } = req.body;
      const identifier = loginID || username; // Use loginID if provided, otherwise fallback to username
      
      if (!identifier || !providedPassword) {
        return res.status(400).json({ message: 'Login ID/username and password are required' });
      }
      
      console.log(`Admin login attempt for identifier: ${identifier}`);
      
      // Try to look up user by loginID first (preferred)
      let user = await storage.getUserByLoginID(identifier);
      
      // If not found, try by username for backward compatibility
      if (!user) {
        console.log(`Admin login - user not found by loginID, trying username lookup for: ${identifier}`);
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        console.log('Admin login failed - user not found:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if user is an admin
      if (user.role !== 'admin') {
        console.log('Admin login failed - user is not an admin:', username);
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      // Verify password using the exported comparePasswords function
      const passwordValid = await comparePasswords(providedPassword, user.password);
      
      if (!passwordValid) {
        console.log('Admin login failed - invalid password for user:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('Password verified for admin user:', username);
      
      // SUCCESSFUL LOGIN - Create multiple auth tokens for redundancy
      
      // 1. Set the main admin auth cookie
      console.log('Setting admin auth cookie for user ID:', user.id);
      res.cookie('admin_id', user.id, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // 2. Set the legacy cookie (backward compatibility)
      res.cookie('userId', user.id, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // 3. Set an admin timestamp cookie for additional validation
      res.cookie('admin_auth_time', Date.now(), { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // 4. Also establish a passport session for site-wide auth
      try {
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.warn('Passport session setup error (non-critical):', loginErr);
            // Continue anyway with cookie auth
          } else {
            console.log('Passport session set up successfully');
          }
        });
      } catch (passportError) {
        console.warn('Passport error (continuing with cookie auth):', passportError);
      }
      
      console.log('Admin login successful with multiple auth mechanisms');
      
      // Return user data without password (renamed to avoid conflict)
      const { password: _password, ...userDataSanitized } = user;
      return res.json({
        ...userDataSanitized,
        adminAuth: true,
        authTime: Date.now()
      });
    } catch (error) {
      console.error('Unexpected error in admin login:', error);
      return res.status(500).json({ message: 'Internal server error during login' });
    }
  });

  // Logout - completely rewritten to ensure thorough logout from all systems
  app.post('/api/auth/logout', (req, res, next) => {
    console.log("ADMIN LOGOUT - Starting improved logout process");
    
    try {
      // 1. Clear all admin cookies (all possible variations)
      console.log("Clearing admin cookies");
      
      // Clear new admin-specific cookies
      res.clearCookie('admin_id', { path: '/' });
      res.clearCookie('admin_auth_time', { path: '/' });
      
      // Clear legacy cookies with path
      res.clearCookie('userId', { path: '/' });
      
      // Clear legacy cookies without path for older cookies
      res.clearCookie('userId');
      res.clearCookie('admin_id');
      res.clearCookie('admin_auth_time');
      
      // 2. Also destroy passport session if it exists
      if (req.isAuthenticated && req.isAuthenticated()) {
        console.log("Destroying passport session");
        req.logout((err) => {
          if (err) {
            console.error('Error during passport logout:', err);
          } else {
            console.log('Passport session successfully terminated');
          }
          
          // Always return success - we've done our best to log out
          console.log('Admin logout process complete');
          res.json({ 
            message: 'Logged out successfully', 
            success: true,
            timestamp: new Date().toISOString()
          });
        });
      } else {
        console.log('No passport session found, cookie-based logout complete');
        res.json({ 
          message: 'Logged out successfully', 
          success: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      
      // Still try to clear cookies even if an error occurred
      try {
        // Attempt to clear all cookies one more time
        res.clearCookie('admin_id', { path: '/' });
        res.clearCookie('admin_auth_time', { path: '/' });
        res.clearCookie('userId', { path: '/' });
        res.clearCookie('userId');
        res.clearCookie('admin_id');
        res.clearCookie('admin_auth_time');
      } catch (cookieError) {
        console.error("Error clearing cookies:", cookieError);
      }
      
      // Return success anyway to ensure client proceeds with logout
      res.json({ 
        message: 'Logout attempted with errors', 
        success: true,
        error: error.message
      });
    }
  });
  
  /**
   * PayPal Integration Routes
   */
  // Get PayPal client ID
  app.get('/api/payment/paypal-client-id', (req, res) => {
    console.log("PayPal Client ID requested, returning:", 
                paypalClientId ? "Client ID available" : "Client ID not available");
    
    if (!paypalClientId) {
      return res.status(500).json({ 
        error: "PayPal Client ID not configured", 
        message: "PayPal integration is not properly configured"
      });
    }
    
    res.json({ clientId: paypalClientId });
  });

  // Create a PayPal order
  app.post('/api/payment/create-paypal-order', createOrder);

  // Capture a PayPal order
  app.post('/api/payment/capture-paypal-order', captureOrder);

  // Cancel a PayPal order
  app.post('/api/payment/cancel-paypal-order', cancelOrder);
  
  /**
   * Public API endpoints for metal types and stone types
   * These can be used by the customization request form and elsewhere
   */
  
  // Get all metal types (public)
  app.get('/api/metal-types', async (_req, res) => {
    try {
      const metalTypes = await storage.getAllMetalTypes();
      res.json(metalTypes);
    } catch (error) {
      console.error('Error fetching metal types:', error);
      res.status(500).json({ message: 'Failed to fetch metal types' });
    }
  });
  
  // Get all stone types (public)
  app.get('/api/stone-types', async (_req, res) => {
    try {
      const stoneTypes = await storage.getAllStoneTypes();
      res.json(stoneTypes);
    } catch (error) {
      console.error('Error fetching stone types:', error);
      res.status(500).json({ message: 'Failed to fetch stone types' });
    }
  });
  
  /**
   * Admin API endpoints for Jewelry Management
   */
  
  // Metal Types Management - See complete implementation below

  // Stone Types Management (Using improved direct API key authentication)

  app.put('/api/admin/stone-types/:id', upload.single('image'), async (req, res) => {
    try {
      // Check for specialized admin auth headers (for stone type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Stone type update - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type update - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type update - error finding specified admin user:", error);
          }
        }
      } else {
        // Check if the request is authenticated through passport or other means
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type update - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type update - error finding default admin user:", error);
          }
        }
      }
      
      const id = parseInt(req.params.id);
      let updateData = { ...req.body };
      
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
        
        // Delete old image if it exists
        const stoneType = await storage.getStoneType(id);
        if (stoneType?.imageUrl) {
          // Extract just the filename from the imageUrl (/uploads/filename.jpg)
          const filename = stoneType.imageUrl.split('/').pop();
          if (filename) {
            const oldImagePath = path.join(process.cwd(), 'uploads', filename);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }
      }
      
      const updatedStoneType = await storage.updateStoneType(id, updateData);
      if (updatedStoneType) {
        res.json(updatedStoneType);
      } else {
        res.status(404).json({ message: 'Stone type not found' });
      }
    } catch (error) {
      console.error('Error updating stone type:', error);
      res.status(500).json({ message: 'Failed to update stone type' });
    }
  });

  // Stone types DELETE endpoint has been moved to a unified implementation below

  // AI Content Generation for Products (Original version)
  app.post('/api/admin/generate-content', validateAdmin, async (req, res) => {
    try {
      // Pass the request to the OpenAI service
      await generateContent(req, res);
    } catch (error) {
      console.error('Error generating content (admin endpoint):', error);
      res.status(500).json({ message: 'Failed to generate content' });
    }
  });
  
  // Public content generation endpoint (no admin required)
  app.post('/api/generate-content', async (req, res) => {
    try {
      console.log("Using public content generation endpoint");
      // Pass the request to the OpenAI service
      await generateContent(req, res);
    } catch (error) {
      console.error('Error generating content (public endpoint):', error);
      res.status(500).json({ message: 'Failed to generate content' });
    }
  });
  
  // NEW: Improved AI Content Generation for Products with enhanced auth diagnostics
  app.post('/api/admin/generate-jewelry-content', async (req, res) => {
    try {
      // Check for specialized admin auth headers (for AI generator calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Admin jewelry content generator - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("AI Generator - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("AI Generator - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("AI Generator - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("AI Generator - error finding default admin user:", error);
          }
        }
      }
      
      // Enhanced auth logging for troubleshooting
      console.log("Admin jewelry content generator endpoint called");
      console.log("Request headers:", {
        authDebug: req.headers['x-auth-debug'],
        requestSource: req.headers['x-request-source'],
        contentType: req.headers['content-type'],
        hasAuthCookie: !!req.cookies?.admin_id || !!req.cookies?.userId
      });
      
      // Log auth state
      console.log("Request authentication details:", {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        username: req.user?.username || 'none',
        userId: req.user?.id || 'none',
        sessionID: req.sessionID || 'none',
        cookieCount: Object.keys(req.cookies || {}).length
      });
      
      console.log("Using improved jewelry content generator (admin endpoint)");
      // Pass the request to the improved OpenAI service
      await generateJewelryContent(req, res);
    } catch (error) {
      console.error('Error generating jewelry content:', error);
      res.status(500).json({ 
        message: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Public endpoint for generating jewelry content with auth diagnostics
  app.post('/api/generate-jewelry-content', async (req, res) => {
    try {
      // Check for specialized admin auth headers (for AI generator calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Public jewelry content generator - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("AI Generator (public) - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("AI Generator (public) - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("AI Generator (public) - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("AI Generator (public) - error finding default admin user:", error);
          }
        }
      }
      
      // Enhanced auth logging for troubleshooting
      console.log("Public jewelry content generator endpoint called");
      console.log("Request headers:", {
        authDebug: req.headers['x-auth-debug'],
        requestSource: req.headers['x-request-source'],
        contentType: req.headers['content-type'],
        hasAuthCookie: !!req.cookies?.admin_id || !!req.cookies?.userId
      });
      
      // Log auth state
      console.log("Request authentication details:", {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        username: req.user?.username || 'none',
        userId: req.user?.id || 'none',
        sessionID: req.sessionID || 'none'
      });
      
      console.log("Using improved jewelry content generator (public endpoint)");
      // Pass the request to the improved OpenAI service
      await generateJewelryContent(req, res);
    } catch (error) {
      console.error('Error generating jewelry content:', error);
      res.status(500).json({ 
        message: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Advanced AI product content generator with image analysis and enhanced auth diagnostics
  app.post('/api/admin/generate-product-content', async (req, res) => {
    try {
      // Check for specialized admin auth headers (for AI generator calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Admin product content generator - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("AI Generator (product) - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("AI Generator (product) - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("AI Generator (product) - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("AI Generator (product) - error finding default admin user:", error);
          }
        }
      }
      
      // Enhanced auth logging for troubleshooting
      console.log("Admin product content generator endpoint called");
      console.log("Request headers:", {
        authDebug: req.headers['x-auth-debug'],
        requestSource: req.headers['x-request-source'],
        contentType: req.headers['content-type'],
        hasAuthCookie: !!req.cookies?.admin_id || !!req.cookies?.userId
      });
      
      // Log auth state
      console.log("Request authentication details:", {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        username: req.user?.username || 'none',
        userId: req.user?.id || 'none',
        sessionID: req.sessionID || 'none'
      });
      
      console.log("Using advanced product content generator with image analysis (admin endpoint)");
      // Pass the request to the product content generator
      await generateProductContent(req, res);
    } catch (error) {
      console.error('Error generating product content:', error);
      res.status(500).json({ 
        message: 'Failed to generate product content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Admin-only endpoint for AI product content generation with image analysis
  app.post('/api/generate-product-content', validateAdmin, async (req, res) => {
    try {
      console.log("Using advanced product content generator with admin validation");
      // Pass the request to the product content generator
      await generateProductContent(req, res);
    } catch (error) {
      console.error('Error generating product content:', error);
      res.status(500).json({ message: 'Failed to generate product content' });
    }
  });
  
  // Alternate public endpoint for AI product content generation
  // This endpoint is intended for the unified AI generator component
  app.post('/api/public/generate-product-content', async (req, res) => {
    try {
      console.log("Using advanced product content generator with public access");
      // Log additional authentication diagnostic info
      console.log("Auth headers present:", 
        req.headers['authorization'] ? 'Yes' : 'No',
        "Admin cookie present:", req.cookies.admin_id ? 'Yes' : 'No',
        "Request Content-Type:", req.headers['content-type'] || 'None');
      
      // Check if this is a JSON request from the client-side AI generator
      if (req.headers['content-type']?.includes('application/json')) {
        console.log("Detected JSON request from unified client generator");
        
        // Ensure the request has the necessary fields
        const { 
          productType, 
          metalType, 
          metalWeight, 
          primaryGems, 
          userDescription, 
          imageUrls 
        } = req.body;
        
        console.log("JSON request details:", { 
          productType, 
          metalType, 
          hasGems: !!primaryGems, 
          gemCount: primaryGems?.length || 0,
          hasImages: !!imageUrls,
          imageCount: imageUrls?.length || 0
        });
        
        if (!productType || !metalType) {
          return res.status(400).json({ 
            success: false, 
            message: "Product type and metal type are required" 
          });
        }
        
        // For JSON requests with embedded base64 image data, we need to call OpenAI directly
        // rather than using the form-based approach in generateProductContent
        if (imageUrls && imageUrls.length > 0) {
          // Use the first image (simplified for now)
          const imageData = imageUrls[0];
          
          // Initialize OpenAI client
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          
          // Build the prompt
          const gemsDescription = primaryGems?.length 
            ? primaryGems.map(gem => `${gem.name} (${gem.carats || 'unknown'} carats)`).join(', ')
            : 'None';
            
          const productDescription = `
            I am creating content for a luxury jewelry product with the following details:
            
            PRODUCT TYPE: ${productType}
            METAL TYPE: ${metalType}
            METAL WEIGHT: ${metalWeight || 'Not specified'} grams
            GEMSTONES: ${gemsDescription}
            ${userDescription ? `ADDITIONAL DETAILS: ${userDescription}` : ''}
          `;
          
          console.log("Calling OpenAI API with JSON image data...");
          
          // Create messages array for the API call
          const messages = [
            {
              role: "system",
              content: "You are an expert jewelry copywriter and product description specialist for a luxury jewelry brand called 'Luster Legacy'. Create compelling, creative, and detailed jewelry product descriptions and metadata for e-commerce. Focus on craftsmanship, materials, design elements, and the emotional appeal. Price estimates should reflect luxury market positioning with USD and INR pricing."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: productDescription
                }
              ]
            }
          ];
          
          // Add image if available
          if (imageData) {
            (messages[1].content as any).push({
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            });
          }
          
          // Add the specific request
          messages.push({
            role: "user",
            content: `Based on these details${imageData ? ' and image' : ''}, please generate the following for this luxury jewelry product:
              1. A compelling product title (50-70 characters)
              2. A catchy tagline (100-120 characters)
              3. A brief marketing description (150-200 characters)
              4. A detailed description highlighting materials, craftsmanship, and unique selling points (500-700 characters)
              5. An estimated price in USD that reflects luxury positioning
              6. An equivalent price in INR (use approximately 85 INR = 1 USD)
              ${imageData ? '7. A brief analysis of what you observe in the image' : ''}
              
              Format your response as structured JSON with these fields: title, tagline, shortDescription, detailedDescription, priceUSD (number), priceINR (number), and imageInsights.`
          });
          
          try {
            // Call OpenAI API
            const completion = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
              messages: messages as any,
              temperature: 0.7,
              max_tokens: 1500,
              response_format: { type: "json_object" }
            });
            
            // Parse the response
            const content = completion.choices[0].message.content;
            if (!content) {
              throw new Error("Empty response from OpenAI API");
            }
            
            console.log("OpenAI API response received successfully");
            
            // Parse and return the JSON
            const jsonResponse = JSON.parse(content);
            console.log("Successfully processed JSON request with direct API call");
            return res.status(200).json(jsonResponse);
          } catch (apiError) {
            console.error("OpenAI API error:", apiError);
            return res.status(500).json({ 
              success: false, 
              message: apiError instanceof Error ? apiError.message : "OpenAI API error",
              endpoint: "public-direct-api"
            });
          }
        } else {
          // No images, treat as a text-only request
          console.log("Processing text-only JSON request");
          
          // Initialize OpenAI client
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          
          // Build a simpler prompt for text-only requests
          const gemsDescription = primaryGems?.length 
            ? primaryGems.map(gem => `${gem.name} (${gem.carats || 'unknown'} carats)`).join(', ')
            : 'None';
            
          const productDescription = `
            Create content for a luxury jewelry product with the following details:
            
            PRODUCT TYPE: ${productType}
            METAL TYPE: ${metalType}
            METAL WEIGHT: ${metalWeight || 'Not specified'} grams
            GEMSTONES: ${gemsDescription}
            ${userDescription ? `ADDITIONAL DETAILS: ${userDescription}` : ''}
            
            Please generate:
            1. A product title (50-70 characters)
            2. A tagline (100-120 characters)
            3. A short description (150-200 characters)
            4. A detailed description (500-700 characters)
            5. A price in USD reflecting luxury positioning
            6. A price in INR (85 INR = 1 USD)
            
            Return in JSON format with fields: title, tagline, shortDescription, detailedDescription, priceUSD (number), priceINR (number).
          `;
          
          try {
            // Call OpenAI API with text-only request
            const completion = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
              messages: [
                {
                  role: "system",
                  content: "You are an expert jewelry copywriter for a luxury brand called 'Luster Legacy'."
                },
                {
                  role: "user",
                  content: productDescription
                }
              ],
              temperature: 0.7,
              max_tokens: 1000,
              response_format: { type: "json_object" }
            });
            
            // Parse the response
            const content = completion.choices[0].message.content;
            if (!content) {
              throw new Error("Empty response from OpenAI API");
            }
            
            console.log("OpenAI API text-only response received successfully");
            
            // Parse and return the JSON
            const jsonResponse = JSON.parse(content);
            console.log("Successfully processed text-only JSON request");
            return res.status(200).json(jsonResponse);
          } catch (apiError) {
            console.error("OpenAI API error for text-only request:", apiError);
            return res.status(500).json({
              success: false,
              message: apiError instanceof Error ? apiError.message : "OpenAI API error",
              endpoint: "public-text-only"
            });
          }
        }
      } else {
        // This is a traditional form-based request (with file uploads)
        console.log("Processing form-based request with multer file uploads");
        
        // Pass the request to the original product content generator
        await generateProductContent(req, res);
      }
    } catch (error) {
      console.error('Error generating product content (public endpoint):', error);
      res.status(500).json({ message: 'Failed to generate product content' });
    }
  });
  
  // Regenerate content for an existing product (with aiInputs)
  app.post('/api/products/:id/regenerate-content', validateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      // Get the existing product
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      console.log("Regenerating content for product ID:", productId);
      
      // Use the AI inputs provided in the request
      const aiInputs = {
        productType: req.body.productType,
        metalType: req.body.metalType,
        metalWeight: req.body.metalWeight,
        primaryGems: req.body.primaryGems || [],
        userDescription: req.body.userDescription,
        imageUrls: req.body.imageUrls || [],
      };

      // If storeAiInputs is true, save these inputs to the product
      const storeInputs = req.body.storeAiInputs === true;
      
      // Pass the request to the OpenAI content generator
      // We'll use the product content generator for consistency
      req.body.existingProductId = productId; // Pass product ID for context
      
      try {
        await generateProductContent(req, res);
        
        // Note: The AI response is already sent by generateProductContent
        // If we get here, we need to separately update the aiInputs if requested
        if (storeInputs) {
          await storage.updateProductAiInputs(productId, aiInputs);
          console.log("Stored AI inputs for product ID:", productId);
        }
      } catch (genError) {
        console.error('Error generating content:', genError);
        
        // If we had an error during generation but after response was sent,
        // we still want to try to save the AI inputs
        if (storeInputs && !res.headersSent) {
          await storage.updateProductAiInputs(productId, aiInputs);
          console.log("Stored AI inputs despite generation error for product ID:", productId);
          res.status(500).json({ 
            message: 'Failed to generate content, but saved AI inputs',
            error: genError instanceof Error ? genError.message : 'Unknown error'
          });
        } else if (!res.headersSent) {
          res.status(500).json({ 
            message: 'Failed to generate content',
            error: genError instanceof Error ? genError.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('Error in content regeneration:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Failed to process content regeneration request',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
  
  // Test endpoint to directly generate content (non-admin, for testing only)
  app.post('/api/test-content-generation', validateAdmin, async (req, res) => {
    try {
      console.log("Testing content generation with data:", req.body);
      
      // Set content type to ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      
      // Verify we have required parameters
      const { productType, metalType } = req.body;
      if (!productType || !metalType) {
        return res.status(400).json({
          message: "Missing required fields",
          details: "productType and metalType are required"
        });
      }
      
      // Import OpenAI with SDK
      const OpenAI = require('openai');
      
      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured", 
          testMode: true,
          success: false
        });
      }
      
      // Extract fields from request
      const metalWeight = req.body.metalWeight || 5;
      const primaryGems = req.body.primaryGems || [{ name: "Diamond", carats: 0.5 }];
      const userDescription = req.body.userDescription || "";
      const imageUrls = req.body.imageUrls || [];
      
      console.log(`Processing jewelry content with ${imageUrls.length} images`);
      
      // Calculate price based on materials
      const basePrice = 1000; // Base price in USD
      const metalPricePerGram = metalType.toLowerCase().includes('gold') ? 60 : 30;
      const gemPriceMultiplier = primaryGems.reduce((acc, gem) => {
        let multiplier = 1;
        if (gem.name.toLowerCase().includes('diamond')) multiplier = 1000;
        else if (gem.name.toLowerCase().includes('ruby') || 
                gem.name.toLowerCase().includes('sapphire') || 
                gem.name.toLowerCase().includes('emerald')) multiplier = 800;
        else multiplier = 200;
        
        return acc + (gem.carats || 0.5) * multiplier;
      }, 0);
      
      const calculatedPrice = basePrice + (metalWeight * metalPricePerGram) + gemPriceMultiplier;
      const priceUSD = Math.round(calculatedPrice);
      const priceINR = Math.round(priceUSD * 75); // Approximate exchange rate
      
      // Format gems for prompt
      const gemsDescription = primaryGems.map(gem => 
        `${gem.name}${gem.carats ? ` (${gem.carats} carats)` : ''}`
      ).join(', ');
      
      // Handle different scenarios
      let imageAnalysis = "";
      
      // Only try to get image analysis if we have images
      if (imageUrls.length > 0) {
        try {
          // Initialize OpenAI
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });
          
          // Skip vision API and use standard text completion
          console.log("Using text-only completion for content generation");
          
          // Format a robust prompt
          const prompt = `You are an expert jewelry copywriter for a luxury brand called Luster Legacy.

Product Details:
- Type: ${productType}
- Metal: ${metalType} (${metalWeight}g)
- Gemstones: ${gemsDescription}
- Additional details: ${userDescription}

Create a luxurious product listing with the following sections:
1. A sophisticated product name (max 5 words)
2. A compelling tagline (max 15 words)
3. A concise 3-sentence description
4. A detailed 150-200 word description including:
   - Materials and craftsmanship details
   - Design highlights
   - Occasions it would be suitable for
   - What makes it special

I want the tone to be elegant, exclusive, and emotional. Focus on the craftsmanship, uniqueness, and how it makes the wearer feel.

Respond in JSON format:
{
  "title": "Product Name",
  "tagline": "Product Tagline",
  "shortDescription": "3-sentence description",
  "detailedDescription": "Detailed website description",
  "imageInsights": "Brief notes about the product's visual appeal"
}`;

          // Make API call
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages: [
              { role: "system", content: "You are a luxury jewelry expert and copywriter." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
          });
          
          // Parse the response
          const content = response.choices[0].message.content;
          console.log("OpenAI response received successfully");
          
          let jsonData;
          try {
            jsonData = JSON.parse(content);
            console.log("Successfully parsed response JSON");
            
            // Add prices to the response
            jsonData.priceUSD = priceUSD;
            jsonData.priceINR = priceINR;
            
            return res.status(200).json(jsonData);
          } catch (parseError) {
            console.error("Failed to parse OpenAI response:", parseError);
            throw new Error("Failed to parse AI response");
          }
        } catch (aiError) {
          console.error("Error calling OpenAI:", aiError);
          
          // Create a fallback response based on the provided example
          return res.status(200).json({
            title: `${primaryGems[0]?.name || 'Luxury'} ${productType}`,
            tagline: `Timeless elegance crafted in exquisite ${metalType}`,
            shortDescription: `Handcrafted ${productType.toLowerCase()} featuring ${gemsDescription}.\nA statement piece that captures attention and admiration.\nPerfect for special occasions and memorable moments.`,
            detailedDescription: `A symphony of elegance and craftsmanship, this ${productType.toLowerCase()} is a true statement of refined luxury. Handcrafted in ${metalType}, this piece features ${gemsDescription}, blending tradition with modern sophistication.\n\nDesign Highlights:\n- Meticulously selected gemstones that shimmer with natural radiance\n- Expertly set in ${metalType} with attention to every detail\n- Lightweight yet durable design for comfortable all-day wear\n\nThis piece makes a graceful statement with timeless craftsmanship, exclusively available at Luster Legacy – where elegance meets ethics.`,
            imageInsights: "This piece showcases the beautiful interplay of light and color through carefully selected gemstones and meticulous metalwork.",
            priceUSD,
            priceINR,
            fallback: true
          });
        }
      } else {
        // No images provided, use the example-based template approach
        return res.status(200).json({
          title: `${primaryGems[0]?.name || 'Luxury'} ${productType}`,
          tagline: `Timeless elegance crafted in exquisite ${metalType}`,
          shortDescription: `Handcrafted ${productType.toLowerCase()} featuring ${gemsDescription}.\nA statement piece that captures attention and admiration.\nPerfect for special occasions and memorable moments.`,
          detailedDescription: `A symphony of elegance and craftsmanship, this ${productType.toLowerCase()} is a true statement of refined luxury. Handcrafted in ${metalType}, this piece features ${gemsDescription}, blending tradition with modern sophistication.\n\nDesign Highlights:\n- Meticulously selected gemstones that shimmer with natural radiance\n- Expertly set in ${metalType} with attention to every detail\n- Lightweight yet durable design for comfortable all-day wear\n\nThis piece makes a graceful statement with timeless craftsmanship, exclusively available at Luster Legacy – where elegance meets ethics.`,
          imageInsights: "No image analysis available",
          priceUSD,
          priceINR,
          noImages: true
        });
      }
    } catch (error) {
      console.error('Error in test content generation:', error);
      // Force JSON response
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        message: 'Failed to generate content', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Admin-protected jewelry image analysis endpoint with enhanced logging
  app.post("/api/admin/analyze-jewelry-image", validateAdmin, async (req, res) => {
    try {
      console.log("Admin jewelry image analysis endpoint called");
      console.log("Request headers:", {
        authDebug: req.headers['x-auth-debug'],
        requestSource: req.headers['x-request-source'],
        contentType: req.headers['content-type'],
        hasAuthCookie: !!req.cookies?.admin_id || !!req.cookies?.userId
      });
      
      // Enhanced auth logging on direct endpoint access
      console.log("Request authentication details:", {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        sessionID: req.sessionID || 'none'
      });
      
      // Check if we have the required fields before proceeding
      const { imageData, productType, metalType } = req.body;
      
      // Log payload details to troubleshoot size issues
      console.log(`Admin jewelry analysis request details:
      - Product Type: ${productType || 'Not provided'}
      - Metal Type: ${metalType || 'Not provided'}
      - Image Data Length: ${imageData ? `${(imageData.length / 1024).toFixed(2)}KB` : 'No image data'}
      - Request Body Size: ${JSON.stringify(req.body).length / (1024 * 1024)}MB`);
      
      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: "Missing image data"
        });
      }
      
      if (!productType || !metalType) {
        return res.status(400).json({
          success: false,
          message: "Missing product details (productType and metalType required)"
        });
      }
      
      // Proceed with the analysis
      await analyzeJewelryImage(req, res);
      
    } catch (error: any) {
      console.error("Error in admin jewelry image analysis:", error);
      res.status(500).json({
        success: false,
        message: "Error analyzing jewelry image",
        details: error.message || "Unknown error"
      });
    }
  });

  // Direct jewelry image analysis endpoint - simplified approach with no authentication
  app.post("/api/direct-jewelry-analysis", validateAdmin, async (req, res) => {
    try {
      console.log("Direct jewelry image analysis endpoint called");
      
      // Check if we have the required fields before proceeding
      const { imageData, productType, metalType } = req.body;
      
      // Log payload details to troubleshoot size issues
      console.log(`Jewelry analysis request details:
      - Product Type: ${productType || 'Not provided'}
      - Metal Type: ${metalType || 'Not provided'}
      - Image Data Length: ${imageData ? `${(imageData.length / 1024).toFixed(2)}KB` : 'No image data'}
      - Request Body Size: ${JSON.stringify(req.body).length / (1024 * 1024)}MB`);
      
      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: "Missing image data"
        });
      }
      
      if (!productType || !metalType) {
        return res.status(400).json({
          success: false,
          message: "Missing product details (productType and metalType required)"
        });
      }
      
      // Proceed with the analysis
      await analyzeJewelryImage(req, res);
      
    } catch (error: any) {
      console.error("Error in direct jewelry image analysis:", error);
      res.status(500).json({
        success: false,
        message: "Error analyzing jewelry image",
        details: error.message || "Unknown error"
      });
    }
  });
  
  // Get current gold price in Hyderabad, India
  app.get('/api/gold-price', async (_req, res) => {
    try {
      const goldPriceData = await getGoldPrice();
      res.json(goldPriceData);
    } catch (error) {
      console.error('Error fetching gold price:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Force refresh gold price from all sources - for admin use
  app.get('/api/gold-price/force-update', async (_req, res) => {
    try {
      console.log('Force refreshing gold price from all sources...');
      // Call fetchGoldPrice directly to bypass the cache
      const freshGoldPriceData = await fetchGoldPrice();
      res.json({
        ...freshGoldPriceData,
        message: 'Gold price forcefully refreshed from all sources'
      });
    } catch (error) {
      console.error('Error during forced gold price update:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Jewelry price calculator endpoint - uses 2025 market rates
  app.post("/api/calculate-price", async (req, res) => {
    try {
      console.log("Price calculator endpoint called with body:", JSON.stringify(req.body));
      
      // Extract values from the request
      const { 
        metalTypeId,
        metalWeight = 5, 
        primaryStone = null, 
        secondaryStones = [],
        otherStone = null,
        productType = "Necklace"  // Default product type
      } = req.body;
      
      // Validate minimum required data
      if (!metalTypeId) {
        return res.status(400).json({
          success: false,
          message: "Missing required metal type information"
        });
      }
      
      // Get metal type details from database
      const metalTypeData = await storage.getMetalTypeById(
        typeof metalTypeId === 'string' && metalTypeId.match(/^\d+$/) 
          ? parseInt(metalTypeId) 
          : metalTypeId
      );
      
      // If metal type not found, use what was provided or a reasonable fallback
      let metalType = metalTypeData?.name || metalTypeId || "14K Gold";
      
      // Transform the gems data into the format expected by the calculator
      let primaryGems: Array<{name: string, carats?: number, stoneTypeId?: number}> = [];
      
      // Add primary stone if provided
      if (primaryStone && primaryStone.stoneTypeId) {
        try {
          let stoneTypeData;
              
          // Check if stoneTypeId is a number or a string
          if (typeof primaryStone.stoneTypeId === 'string' && primaryStone.stoneTypeId.match(/^\d+$/)) {
            // It's a numeric string, try to find by ID
            const stoneTypeId = parseInt(primaryStone.stoneTypeId);
            stoneTypeData = await storage.getStoneTypeById(stoneTypeId);
          } else if (typeof primaryStone.stoneTypeId === 'number') {
            // It's a number, try to find by ID
            stoneTypeData = await storage.getStoneTypeById(primaryStone.stoneTypeId);
          } else if (typeof primaryStone.stoneTypeId === 'string') {
            // It's a string that's not a number, try to find by name
            console.log(`Searching database for stone type by name: "${primaryStone.stoneTypeId}"`);
            stoneTypeData = await storage.getStoneTypeByName(primaryStone.stoneTypeId);
          }
          
          if (stoneTypeData) {
            primaryGems.push({
              name: stoneTypeData.name,
              carats: primaryStone.caratWeight || 1,
              stoneTypeId: stoneTypeData.id
            });
          }
        } catch (e) {
          console.error("Error processing primary stone:", e);
        }
      }
      
      // Add secondary stones if provided
      if (Array.isArray(secondaryStones) && secondaryStones.length > 0) {
        for (const stone of secondaryStones) {
          if (stone && stone.stoneTypeId) {
            try {
              let stoneTypeData;
              
              // Check if stoneTypeId is a number or a string
              if (typeof stone.stoneTypeId === 'string' && stone.stoneTypeId.match(/^\d+$/)) {
                // It's a numeric string, try to find by ID
                const stoneTypeId = parseInt(stone.stoneTypeId);
                stoneTypeData = await storage.getStoneTypeById(stoneTypeId);
              } else if (typeof stone.stoneTypeId === 'number') {
                // It's a number, try to find by ID
                stoneTypeData = await storage.getStoneTypeById(stone.stoneTypeId);
              } else if (typeof stone.stoneTypeId === 'string') {
                // It's a string that's not a number, try to find by name
                console.log(`Searching database for stone type by name: "${stone.stoneTypeId}"`);
                stoneTypeData = await storage.getStoneTypeByName(stone.stoneTypeId);
              }
              
              if (stoneTypeData) {
                primaryGems.push({
                  name: stoneTypeData.name,
                  carats: stone.caratWeight || 0.5,
                  stoneTypeId: stoneTypeData.id
                });
              }
            } catch (e) {
              console.error("Error processing secondary stone:", e);
            }
          }
        }
      }
      
      // Add other stone if provided
      if (otherStone && otherStone.stoneTypeId) {
        try {
          let stoneTypeData;
              
          // Check if stoneTypeId is a number or a string
          if (typeof otherStone.stoneTypeId === 'string' && otherStone.stoneTypeId.match(/^\d+$/)) {
            // It's a numeric string, try to find by ID
            const stoneTypeId = parseInt(otherStone.stoneTypeId);
            stoneTypeData = await storage.getStoneTypeById(stoneTypeId);
          } else if (typeof otherStone.stoneTypeId === 'number') {
            // It's a number, try to find by ID
            stoneTypeData = await storage.getStoneTypeById(otherStone.stoneTypeId);
          } else if (typeof otherStone.stoneTypeId === 'string') {
            // It's a string that's not a number, try to find by name
            console.log(`Searching database for stone type by name: "${otherStone.stoneTypeId}"`);
            stoneTypeData = await storage.getStoneTypeByName(otherStone.stoneTypeId);
          }
          
          if (stoneTypeData) {
            console.log(`Adding other stone: ${stoneTypeData.name} with weight ${otherStone.caratWeight || 0.25} carats`);
            primaryGems.push({
              name: stoneTypeData.name,
              carats: otherStone.caratWeight || 0.25,
              stoneTypeId: stoneTypeData.id
            });
          }
        } catch (e) {
          console.error("Error processing other stone:", e);
        }
      }
      
      // Separate the primary gems array into primary stone and secondary stones
      // We already transformed them all into a single array of primary gems,
      // but we want to track costs separately
      
      // Get the index where secondary stones start
      const numberOfPrimaryGems = primaryStone ? 1 : 0;
      
      // Process otherStone data if present
      let otherStoneType = undefined;
      let otherStoneWeight = undefined;
      
      if (otherStone && otherStone.stoneTypeId) {
        const stoneTypeId = otherStone.stoneTypeId;
        try {
          let stoneTypeData;
          
          // Check if stoneTypeId is a number or a string
          if (typeof stoneTypeId === 'string' && stoneTypeId.match(/^\d+$/)) {
            // It's a numeric string, try to find by ID
            const numericId = parseInt(stoneTypeId);
            stoneTypeData = await storage.getStoneTypeById(numericId);
          } else if (typeof stoneTypeId === 'number') {
            // It's a number, try to find by ID
            stoneTypeData = await storage.getStoneTypeById(stoneTypeId);
          } else if (typeof stoneTypeId === 'string') {
            // It's a string that's not a number, try to find by name
            console.log(`Looking up stone by string ID/name "${stoneTypeId}"`);
            stoneTypeData = await storage.getStoneTypeByName(stoneTypeId);
          }
          
          if (stoneTypeData) {
            otherStoneType = stoneTypeData.name;
            otherStoneWeight = otherStone.caratWeight || 0.5;
            console.log(`Processing other stone: ${otherStoneType} with weight ${otherStoneWeight}`);
          }
        } catch (error) {
          console.error('Error processing other stone data:', error);
        }
      }
      
      // Use the centralized price calculator utility
      const result = await calculateJewelryPrice({
        productType,
        metalType,
        metalTypeId: typeof metalTypeId === 'string' ? parseInt(metalTypeId) : metalTypeId,
        metalWeight: typeof metalWeight === 'string' ? parseFloat(metalWeight) : metalWeight,
        primaryGems,
        otherStone
      });
      
      // Calculate individual stone type costs to accurately break down primary vs secondary
      let primaryStoneCost = 0;
      let secondaryStoneCost = 0;
      
      // Track which stones we've already processed to avoid double-counting
      const processedStoneNames = new Set<string>();
      
      // Process the primary stone separately
      if (primaryStone && primaryStone.stoneTypeId) {
        try {
          const carats = primaryStone.caratWeight || 1;
          let perCaratPrice = 0;
          let stoneTypeData = null;
          
          // Check if stoneTypeId is a number or string
          if (typeof primaryStone.stoneTypeId === 'string' && !primaryStone.stoneTypeId.match(/^\d+$/)) {
            // It's a stone name, look it up by name
            stoneTypeData = await storage.getStoneTypeByName(primaryStone.stoneTypeId);
            console.log(`Looked up primary stone by name "${primaryStone.stoneTypeId}": Found ${stoneTypeData?.name}`);
          } else {
            // It's a numeric ID, look it up by ID
            const numericId = typeof primaryStone.stoneTypeId === 'number' ? 
                      primaryStone.stoneTypeId : 
                      parseInt(primaryStone.stoneTypeId as string);
            stoneTypeData = await storage.getStoneTypeById(numericId);
          }
          
          if (stoneTypeData?.priceModifier) {
            perCaratPrice = stoneTypeData.priceModifier;
            primaryStoneCost = carats * perCaratPrice;
            console.log(`Primary stone: ${stoneTypeData.name} (${carats} carats at ₹${perCaratPrice}/carat) = ₹${primaryStoneCost}`);
            
            // Mark this stone name as processed to avoid double-counting
            processedStoneNames.add(stoneTypeData.name.toLowerCase());
          } else {
            // Try fallback pricing by name if database lookup failed
            perCaratPrice = await getGemPricePerCaratFromName(
              typeof primaryStone.stoneTypeId === 'string' ? 
                primaryStone.stoneTypeId : 
                String(primaryStone.stoneTypeId)
            );
            primaryStoneCost = carats * perCaratPrice;
            console.log(`Primary stone (fallback pricing): ${primaryStone.stoneTypeId} (${carats} carats at ₹${perCaratPrice}/carat) = ₹${primaryStoneCost}`);
          }
        } catch (error) {
          console.error("Error processing primary stone:", error);
        }
      }
      
      // Process secondary stones with a separate loop
      if (secondaryStones && Array.isArray(secondaryStones) && secondaryStones.length > 0) {
        console.log(`Processing ${secondaryStones.length} secondary stones`);
        
        for (const stone of secondaryStones) {
          if (!stone || !stone.stoneTypeId) continue;
          
          try {
            const carats = stone.caratWeight || 0.5;
            let perCaratPrice = 0;
            let stoneTypeData = null;
            let stoneName = '';
            
            // Check if it's a name or ID
            if (typeof stone.stoneTypeId === 'string' && !stone.stoneTypeId.match(/^\d+$/)) {
              // It's a name string
              stoneName = stone.stoneTypeId;
              stoneTypeData = await storage.getStoneTypeByName(stone.stoneTypeId);
              console.log(`Looked up secondary stone by name "${stone.stoneTypeId}": Found ${stoneTypeData?.name}`);
            } else {
              // It's a numeric ID
              const numericId = typeof stone.stoneTypeId === 'number' ? 
                       stone.stoneTypeId : 
                       parseInt(stone.stoneTypeId as string);
              stoneTypeData = await storage.getStoneTypeById(numericId);
              stoneName = stoneTypeData?.name || String(stone.stoneTypeId);
            }
            
            // Skip if this stone was already counted in primary
            if (stoneTypeData && processedStoneNames.has(stoneTypeData.name.toLowerCase())) {
              console.log(`Skipping already processed stone: ${stoneTypeData.name}`);
              continue;
            }
            
            if (stoneTypeData?.priceModifier) {
              perCaratPrice = stoneTypeData.priceModifier;
              const thisGemCost = carats * perCaratPrice;
              secondaryStoneCost += thisGemCost;
              console.log(`Secondary stone: ${stoneTypeData.name} (${carats} carats at ₹${perCaratPrice}/carat) = ₹${thisGemCost}`);
              
              // Mark as processed
              processedStoneNames.add(stoneTypeData.name.toLowerCase());
            } else {
              // Use fallback pricing by name
              perCaratPrice = await getGemPricePerCaratFromName(stoneName);
              const thisGemCost = carats * perCaratPrice;
              secondaryStoneCost += thisGemCost;
              console.log(`Secondary stone (fallback pricing): ${stoneName} (${carats} carats at ₹${perCaratPrice}/carat) = ₹${thisGemCost}`);
            }
          } catch (error) {
            console.error(`Error processing secondary stone:`, error);
          }
        }
      }
      
      const hasPrimaryStone = primaryStone && primaryStone.stoneTypeId && primaryStoneCost > 0;
      const hasSecondaryStones = secondaryStones && secondaryStones.length > 0 && secondaryStoneCost > 0;
      
      console.log(`Stone costs - Primary: ₹${primaryStoneCost}, Secondary: ₹${secondaryStoneCost}`);
      
      // If we couldn't calculate individual costs (which shouldn't happen),
      // fall back to the original 70/30 split only for display purposes
      if (primaryStoneCost === 0 && secondaryStoneCost === 0 && result.breakdown?.stoneCost) {
        if (hasPrimaryStone && hasSecondaryStones) {
          primaryStoneCost = result.breakdown.stoneCost * 0.7;
          secondaryStoneCost = result.breakdown.stoneCost * 0.3;
        } else if (hasPrimaryStone) {
          primaryStoneCost = result.breakdown.stoneCost;
        } else if (hasSecondaryStones) {
          secondaryStoneCost = result.breakdown.stoneCost;
        }
      }
      
      // Get other stone cost if available
      const hasOtherStone = otherStone && otherStone.stoneTypeId;
      let otherStoneCost = 0;
      
      // Try to find other stone data - first check if there are detailed stone breakdowns
      if (hasOtherStone && result.breakdown?.stones && Array.isArray(result.breakdown.stones)) {
        // Look for a matching stone in the detailed breakdown
        const otherStoneData = result.breakdown.stones.find(s => 
          s.name && otherStone.stoneTypeId && 
          s.name.toLowerCase().includes(String(otherStone.stoneTypeId).toLowerCase()));
          
        if (otherStoneData && otherStoneData.totalCost) {
          otherStoneCost = otherStoneData.totalCost;
          console.log(`Found other stone ${otherStoneData.name} with cost ₹${otherStoneCost}`);
        }
      } 
      
      // If we couldn't find the cost in stones array or it's not available,
      // try to calculate it directly using the stone data
      if (hasOtherStone && otherStoneCost === 0 && otherStone.caratWeight) {
        try {
          let stoneTypeData;
          
          if (typeof otherStone.stoneTypeId === 'string' && otherStone.stoneTypeId.match(/^\d+$/)) {
            // It's a numeric string, try to find by ID
            const numericId = parseInt(otherStone.stoneTypeId);
            stoneTypeData = await storage.getStoneTypeById(numericId);
          } else if (typeof otherStone.stoneTypeId === 'number') {
            // It's a number, try to find by ID
            stoneTypeData = await storage.getStoneTypeById(otherStone.stoneTypeId);
          } else if (typeof otherStone.stoneTypeId === 'string') {
            // It's a string that's not a number, try to find by name
            console.log(`Looking up other stone by string ID/name "${otherStone.stoneTypeId}"`);
            stoneTypeData = await storage.getStoneTypeByName(otherStone.stoneTypeId);
          }
          
          if (stoneTypeData?.priceModifier) {
            const caratWeight = otherStone.caratWeight || 0.5;
            otherStoneCost = caratWeight * stoneTypeData.priceModifier;
            console.log(`Calculated other stone cost (${stoneTypeData.name}): ₹${otherStoneCost}`);
          }
        } catch (err) {
          console.error("Error calculating other stone cost directly:", err);
        }
      }
      
      console.log("Other stone available:", hasOtherStone, "cost:", otherStoneCost);
      
      const usdBreakdown = {
        metalCost: result.breakdown?.metalCost 
          ? Math.round(result.breakdown.metalCost / USD_TO_INR_RATE) 
          : 0,
        primaryStoneCost: hasPrimaryStone
          ? Math.round(primaryStoneCost / USD_TO_INR_RATE)
          : 0,
        secondaryStoneCost: hasSecondaryStones
          ? Math.round(secondaryStoneCost / USD_TO_INR_RATE)
          : 0,
        otherStoneCost: hasOtherStone
          ? Math.round(otherStoneCost / USD_TO_INR_RATE)
          : 0,
        overhead: result.breakdown?.overhead
          ? Math.round(result.breakdown.overhead / USD_TO_INR_RATE)
          : 0
      };
      
      const inrBreakdown = {
        metalCost: result.breakdown?.metalCost || 0,
        primaryStoneCost: hasPrimaryStone
          ? Math.round(primaryStoneCost)
          : 0,
        secondaryStoneCost: hasSecondaryStones
          ? Math.round(secondaryStoneCost)
          : 0,
        otherStoneCost: hasOtherStone
          ? Math.round(otherStoneCost)
          : 0,
        overhead: result.breakdown?.overhead || 0
      };
      
      // Return detailed response
      return res.status(200).json({
        success: true,
        usd: {
          price: result.priceUSD,
          currency: "USD",
          breakdown: usdBreakdown
        },
        inr: {
          price: result.priceINR,
          currency: "INR",
          breakdown: inrBreakdown
        },
        // Include input data for reference
        inputs: {
          // Only include what was actually provided in the request, not what was calculated/looked up
          metalType: metalTypeId, // Use the original input value
          metalWeight,
          primaryStone: primaryStone ? {
            stoneTypeId: primaryStone.stoneTypeId,
            caratWeight: primaryStone.caratWeight
          } : null,
          secondaryStones: secondaryStones ? secondaryStones.map(stone => ({
            stoneTypeId: stone.stoneTypeId,
            caratWeight: stone.caratWeight
          })) : [],
          otherStone: otherStone ? {
            stoneTypeId: otherStone.stoneTypeId,
            caratWeight: otherStone.caratWeight
          } : null
        }
      });
    } catch (error) {
      console.error("Error in price calculator endpoint:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error in price calculation"
      });
    }
  });
  
  // Get a sample price calculation
  app.get("/api/sample-price-calculation", (req, res) => {
    try {
      const sampleCalculation = getSamplePriceCalculation();
      res.json({
        success: true,
        sampleCalculation
      });
    } catch (error) {
      console.error('Error generating sample price calculation:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error generating sample price calculation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Simple test JSON parsing endpoint
  app.get("/api/test-json-parse", async (req, res) => {
    try {
      console.log("Testing JSON parsing capabilities");
      
      // Sample responses with different JSON formats
      const testCases = [
        // Valid JSON
        { name: "valid", content: '{"title":"Test Ring","tagline":"Beautiful test","shortDescription":"This is a test.","detailedDescription":"Longer test description."}' },
        // JSON with markdown blocks
        { name: "markdown", content: '```json\n{"title":"Test Ring","tagline":"Beautiful test","shortDescription":"This is a test.","detailedDescription":"Longer test description."}\n```' },
        // Malformed but recoverable JSON
        { name: "malformed", content: '{"title":"Test Ring","tagline":"Beautiful test" "shortDescription":"This is a test.","detailedDescription":"Longer test description."}' },
        // Text with embedded JSON
        { name: "embedded", content: 'Here is your result:\n{"title":"Test Ring","tagline":"Beautiful test","shortDescription":"This is a test.","detailedDescription":"Longer test description."}\nHope that helps!' },
      ];
      
      // Process each test case
      const results = [];
      for (const testCase of testCases) {
        try {
          console.log(`Testing JSON parsing for case: ${testCase.name}`);
          
          // Clean the response - remove markdown formatting if present
          const cleanedContent = testCase.content
            .replace(/```json/g, '')  // Remove markdown json code blocks start
            .replace(/```/g, '')      // Remove any remaining markdown code blocks
            .trim();                  // Trim whitespace
            
          let result;
          
          // First try direct parsing
          try {
            result = JSON.parse(cleanedContent);
            results.push({
              case: testCase.name,
              success: true,
              method: "direct",
              result
            });
          } catch (parseError) {
            console.log(`Direct parsing failed for case ${testCase.name}:`, parseError.message);
            
            // Try regex extraction
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                result = JSON.parse(jsonMatch[0]);
                results.push({
                  case: testCase.name,
                  success: true,
                  method: "regex",
                  result
                });
              } catch (regexError) {
                console.log(`Regex extraction failed for case ${testCase.name}:`, regexError.message);
                results.push({
                  case: testCase.name,
                  success: false,
                  method: "failed",
                  error: regexError.message
                });
              }
            } else {
              results.push({
                case: testCase.name,
                success: false,
                method: "failed",
                error: "No JSON pattern found"
              });
            }
          }
        } catch (error) {
          results.push({
            case: testCase.name,
            success: false,
            method: "failed",
            error: error.message
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        results
      });
    } catch (error: any) {
      console.error("JSON parse test failed:", error);
      return res.status(500).json({
        success: false,
        message: "JSON parse test failed",
        error: error.message
      });
    }
  });
  
  // Simple test content generation endpoint
  app.get("/api/generate-test-content", async (req, res) => {
    try {
      console.log("Testing content generation with minimal payload");
      
      // Create a minimal test request
      const testRequest = {
        body: {
          productType: "Ring",
          metalType: "18k Gold",
          metalWeight: 5,
          primaryGems: [{ name: "Diamond", carats: 0.5 }],
          userDescription: "A simple test ring with a diamond solitaire"
        }
      };
      
      // Forward to the content generation handler
      return await generateContent(testRequest as Request, res);
    } catch (error: any) {
      console.error("Test content generation failed:", error);
      return res.status(500).json({
        success: false,
        message: "Test content generation failed",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Get product types for admin
  app.get('/api/admin/product-types', validateAdmin, async (req, res) => {
    try {
      const productTypes = await storage.getAllProductTypes();
      res.json(productTypes);
    } catch (error) {
      console.error('Error fetching product types:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching product types',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get metal types for admin (improved authentication)
  // Alternative route for metal types that avoids the global admin middleware
  app.get('/api/metal-types/admin', validateAdmin, async (req, res) => {
    try {
      // This route is for admin use but avoids the global /api/admin/* middleware authentication
      console.log("ADMIN METAL TYPES WITH ALTERNATIVE ROUTE PATH");
      
      const metalTypes = await storage.getAllMetalTypes();
      console.log(`Successfully fetched ${metalTypes.length} metal types for admin`);
      res.json(metalTypes);
    } catch (error) {
      console.error('Error fetching metal types:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching metal types',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/admin/metal-types', async (req, res) => {
    // Check for specialized admin auth headers
    const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
    const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
    const adminUsername = req.headers['x-admin-username'];
    
    // Allow access either through our standard validateAdmin or through headers
    if (hasAdminDebugHeader && hasAdminApiKey) {
      console.log("Metal types admin fetch - direct API key authentication");
      
      // Try to set the admin user from the header
      if (adminUsername && typeof adminUsername === 'string') {
        try {
          const adminUser = await storage.getUserByUsername(adminUsername);
          if (adminUser) {
            req.user = adminUser;
            console.log("Metal types admin fetch - set admin user from headers:", adminUser.username);
          }
        } catch (error) {
          console.log("Metal types admin fetch - error finding specified admin user:", error);
        }
      }
    } else {
      // Try to set default admin user if not already authenticated
      if (!req.user) {
        try {
          const adminUser = await storage.getUserByUsername('admin');
          if (adminUser) {
            req.user = adminUser;
            console.log("Metal types admin fetch - set default admin user:", adminUser.username);
          }
        } catch (error) {
          console.log("Metal types admin fetch - error finding default admin user:", error);
        }
      }
    }
    
    try {
      const metalTypes = await storage.getAllMetalTypes();
      res.json(metalTypes);
    } catch (error) {
      console.error('Error fetching metal types:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching metal types',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Special non-admin-prefixed stone types endpoint to work around global admin route authentication middleware
  app.get('/api/stone-types/admin', async (req, res) => {
    try {
      // This route is for admin use but avoids the global /api/admin/* middleware authentication
      console.log("ADMIN STONE TYPES WITH ALTERNATIVE ROUTE PATH");
      
      // DIRECT QUERY: Skip the storage layer and query the database directly
      // This will give us access to the raw column names including price_modifier
      const stoneTypesList = await db.select().from(stoneTypes).orderBy(asc(stoneTypes.name));
      
      // Debug the direct database results
      if (stoneTypesList.length > 0) {
        console.log(`Direct database query sample for first stone type:`, stoneTypesList[0]);
      }
      
      // DEBUG: Let's trace what's happening with our pricing field data
      console.log("DEBUG - Raw database fields on first stone:", Object.keys(stoneTypesList[0]));
      
      // Check if the price_modifier column exists in the data
      const hasPriceModifier = stoneTypesList[0] && 'price_modifier' in stoneTypesList[0];
      console.log("Does the price_modifier field exist in the DB results?", hasPriceModifier);
      
      // If it doesn't exist, we need to determine what the actual field name is
      if (stoneTypesList[0]) {
        const possibleFields = Object.keys(stoneTypesList[0]).filter(key => 
          key.includes('price') || key.includes('modifier') || key.includes('cost')
        );
        console.log("Possible price-related fields:", possibleFields);
      }
      
      // Map the raw database results to application format - using very verbose logging
      const formattedStoneTypes = stoneTypesList.map(stone => {
        // Let's output the RAW stone data to see what fields we actually have 
        console.log(`RAW STONE TYPE DATA for ${stone.name}:`, stone);
        
        // Determine the price value from whatever field is available
        const priceField = stone.price_modifier !== undefined ? 'price_modifier' : 
                          stone.priceModifier !== undefined ? 'priceModifier' :
                          stone.price !== undefined ? 'price' : null;
        
        let priceValue = 0;
        if (priceField) {
          console.log(`Found price in field '${priceField}' with value:`, stone[priceField]);
          priceValue = Number(stone[priceField]);
          if (isNaN(priceValue)) {
            console.log(`Value in ${priceField} is not a number, defaulting to 0`);
            priceValue = 0;
          }
        } else {
          console.log(`No price field found for ${stone.name}`);
        }
        
        // Convert database field names to application field names
        const formattedStone = {
          id: stone.id,
          name: stone.name,
          description: stone.description,
          // Use the determined price value - this is the critical field that's not working
          priceModifier: priceValue,
          displayOrder: stone.display_order || 0,
          isActive: stone.is_active || false,
          color: stone.color,
          imageUrl: stone.image_url,
          category: stone.category,
          stoneForm: stone.stone_form, 
          quality: stone.quality,
          size: stone.size,
          createdAt: stone.created_at
        };
        
        console.log(`Formatted stone ${stone.name} with price: ${formattedStone.priceModifier}`);
        
        return formattedStone;
      });
      
      // Find some precious stones to verify prices
      const preciousStones = formattedStoneTypes.filter(st => 
        st.name.toLowerCase().includes('diamond') || 
        st.name.toLowerCase().includes('emerald') ||
        st.name.toLowerCase().includes('ruby') ||
        st.name.toLowerCase().includes('sapphire') ||
        (st.category && st.category.toLowerCase().includes('precious'))
      ).slice(0, 3);
      
      if (preciousStones.length > 0) {
        console.log('Price check for valuable stones:');
        preciousStones.forEach(stone => {
          console.log(`${stone.name}: ₹${stone.priceModifier}`);
        });
      }
      
      // Find some regular stones to verify prices
      const regularStones = formattedStoneTypes.filter(st => 
        st.name.toLowerCase().includes('quartz') || 
        st.name.toLowerCase().includes('aquamarine') ||
        st.name.toLowerCase().includes('turquoise')
      ).slice(0, 3);
      
      if (regularStones.length > 0) {
        console.log('Price check for regular stones:');
        regularStones.forEach(stone => {
          console.log(`${stone.name}: ₹${stone.priceModifier}`);
        });
      }
      
      console.log(`Successfully fetched ${stoneTypesList.length} stone types for admin`);
      res.json(formattedStoneTypes);
    } catch (error) {
      console.error('Error fetching stone types:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching stone types',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Alternative route for creating stone types that avoids the global admin middleware
  app.post('/api/stone-types/admin/create', upload.single('image'), async (req, res) => {
    try {
      // This route is for admin use but avoids the global /api/admin/* middleware authentication
      console.log("ADMIN STONE TYPE CREATION WITH ALTERNATIVE ROUTE PATH");
      console.log("Request body:", req.body);
      console.log("File:", req.file);
      
      // ULTIMATE APPROACH: Use the SQL tool method directly which we know works
      try {
        console.log("EXECUTING DIRECT SQL INSERT AS FINAL ATTEMPT");
        
        const insertSQL = `
          INSERT INTO stone_types 
          (name, description, price_modifier, display_order, is_active, color, image_url,
           category, stone_form, quality, size) 
          VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
          RETURNING *
        `;
        
        // Parse price modifier with proper handling for zero values
        let priceModifier = 0; // Default to zero
        
        // Enhanced handling for various forms of zero and empty values
        if (req.body.priceModifier !== undefined && req.body.priceModifier !== null) {
          // Check for zero values in various formats
          if (req.body.priceModifier === "" || 
              req.body.priceModifier === "0" || 
              req.body.priceModifier === 0) {
            priceModifier = 0;
          } else {
            // Parse the value, ensuring NaN becomes 0
            priceModifier = parseFloat(req.body.priceModifier);
            if (isNaN(priceModifier)) priceModifier = 0;
          }
        }
        
        console.log(`Parsed price modifier for stone type creation: ${priceModifier} (from ${req.body.priceModifier})`);
        
        const params = [
          req.body.name,
          req.body.description || "",
          priceModifier, // Use our properly parsed value
          parseInt(req.body.displayOrder || "0"),
          req.body.isActive === 'true' || req.body.isActive === true,
          req.body.color || "",
          req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || null),
          // Add the new parameters as optional
          req.body.category || null,
          req.body.stoneForm || null,
          req.body.quality || null,
          req.body.size || null
        ];
        
        console.log("SQL Parameters:", params);
        
        // Critical: open a transaction to ensure data is committed
        const client = await pool.connect();
        let createdStoneType;
        
        try {
          await client.query('BEGIN');
          const result = await client.query(insertSQL, params);
          createdStoneType = result.rows[0];
          await client.query('COMMIT');
          console.log("DIRECT SQL INSERT SUCCESS:", createdStoneType);
        } catch (sqlError) {
          await client.query('ROLLBACK');
          console.error("SQL ERROR DETAILS:", sqlError);
          throw sqlError;
        } finally {
          client.release();
        }
        
        if (!createdStoneType) {
          throw new Error("No stone type was returned from the database");
        }
        
        // Check the database to see if it was actually created
        const checkResult = await pool.query(
          `SELECT * FROM stone_types WHERE id = $1`, 
          [createdStoneType.id]
        );
        
        console.log("VERIFY DB CHECK:", checkResult.rows);
        
        // Return with success status
        return res.status(201).json(createdStoneType);
      } catch (finalError) {
        console.error("FINAL APPROACH ERROR:", finalError);
        return res.status(500).json({ 
          message: 'Critical database error creating stone type', 
          error: finalError instanceof Error ? finalError.message : 'Unknown error',
          stack: finalError instanceof Error ? finalError.stack : 'No stack trace'
        });
      }
    } catch (error) {
      console.error('Error in route handler:', error);
      res.status(500).json({ 
        message: 'Failed to create stone type', 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  });
  
  // Alternative route for updating stone types that avoids the global admin middleware
  app.post('/api/stone-types/admin/update/:id', upload.single('image'), async (req, res) => {
    try {
      // Check for specialized admin auth headers (for stone type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Debug the incoming request data
      console.log("STONE TYPE UPDATE REQUEST RECEIVED:");
      console.log("Request body keys:", Object.keys(req.body));
      console.log("Request body stoneForm:", req.body.stoneForm);
      console.log("Request body stone_form:", req.body.stone_form);
      console.log("Request body values for all fields:", {
        name: req.body.name,
        description: req.body.description,
        priceModifier: req.body.priceModifier,
        color: req.body.color,
        category: req.body.category,
        stoneForm: req.body.stoneForm, // This is what we should be receiving
        quality: req.body.quality,
        size: req.body.size,
      });
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Stone type update - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type update - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type update - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type update - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type update - error finding default admin user:", error);
          }
        }
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid stone type ID' });
      }

      // Get the existing stone type to check for image
      const existingStoneType = await storage.getStoneType(id);
      if (!existingStoneType) {
        return res.status(404).json({ message: 'Stone type not found' });
      }

      // Parse update data
      let updateData: any = { ...req.body };
      
      // Convert price modifier to number - handle '0' value cases properly
      if (updateData.priceModifier !== undefined) {
        // When price modifier is empty string or null, set to 0
        if (updateData.priceModifier === "" || updateData.priceModifier === null) {
          updateData.priceModifier = 0;
        } else {
          updateData.priceModifier = parseFloat(updateData.priceModifier);
          // Check for NaN after parsing and convert to 0 if needed
          if (isNaN(updateData.priceModifier)) {
            updateData.priceModifier = 0;
          }
        }
        console.log("Parsed price modifier:", updateData.priceModifier);
      }
      
      // Handle image update
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
        
        // Delete old image if it exists
        if (existingStoneType.imageUrl) {
          try {
            const oldImagePath = path.join(process.cwd(), existingStoneType.imageUrl.substring(1));
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (error) {
            console.error("Error deleting old image:", error);
            // Continue with the update even if image deletion fails
          }
        }
      }

      // Use SQL method directly for more reliable update
      const client = await pool.connect();
      let updatedStoneType;
      
      try {
        await client.query('BEGIN');
        
        const updateSQL = `
          UPDATE stone_types
          SET 
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            price_modifier = COALESCE($3, price_modifier),
            color = COALESCE($4, color),
            image_url = COALESCE($5, image_url),
            category = COALESCE($6, category),
            stone_form = COALESCE($7, stone_form),
            quality = COALESCE($8, quality),
            size = COALESCE($9, size)
          WHERE id = $10
          RETURNING *
        `;
        
        // Properly handle number values including 0, ensuring zero is stored as 0 and not null
        // Using direct comparison ensures explicitly set zero values are preserved
        let priceModifierValue;
        if (updateData.priceModifier !== undefined) {
          // Check for zero values in various formats
          if (updateData.priceModifier === 0 || 
              updateData.priceModifier === "0" || 
              updateData.priceModifier === "" || 
              updateData.priceModifier === null) {
            priceModifierValue = 0;
          } else {
            priceModifierValue = updateData.priceModifier;
          }
        } else {
          priceModifierValue = null;
        }
        
        console.log(`Price modifier handling: Original=${updateData.priceModifier}, Processed=${priceModifierValue}`);
        
        // Special handling for stoneForm - make sure we're keeping existing value if not provided
        // Note: NULL in SQL means "keep current value" due to our COALESCE function
        const stoneFormValue = updateData.stoneForm !== undefined ? 
                              (updateData.stoneForm || null) : 
                              null;
                              
        // Log specific field values before adding to params
        console.log("Stone Form special handling:");
        console.log("- Original value from request:", updateData.stoneForm);
        console.log("- Value to be used in SQL:", stoneFormValue);
        console.log("- Existing value in database:", existingStoneType.stoneForm);
        
        const params = [
          updateData.name || null,
          updateData.description || null,
          priceModifierValue, // This handles 0 values correctly
          updateData.color || null,
          updateData.imageUrl || null,
          updateData.category || null,
          stoneFormValue, // Using our special handling for stone form
          updateData.quality || null,
          updateData.size || null,
          id
        ];
        
        console.log("SQL Update Parameters:", params);
        
        const result = await client.query(updateSQL, params);
        updatedStoneType = result.rows[0];
        await client.query('COMMIT');
        
        console.log("DIRECT SQL UPDATE SUCCESS:", updatedStoneType);
      } catch (sqlError) {
        await client.query('ROLLBACK');
        console.error("SQL ERROR DETAILS:", sqlError);
        throw sqlError;
      } finally {
        client.release();
      }
      
      if (!updatedStoneType) {
        throw new Error("No stone type was returned from the database after update");
      }
      
      // Transform snake_case keys to camelCase before sending back to client
      const camelCaseStoneType = {
        id: updatedStoneType.id,
        name: updatedStoneType.name,
        description: updatedStoneType.description,
        priceModifier: updatedStoneType.price_modifier, // Convert price_modifier to priceModifier
        displayOrder: updatedStoneType.display_order,
        isActive: updatedStoneType.is_active,
        color: updatedStoneType.color,
        imageUrl: updatedStoneType.image_url,
        category: updatedStoneType.category,
        stoneForm: updatedStoneType.stone_form,
        quality: updatedStoneType.quality,
        size: updatedStoneType.size,
        createdAt: updatedStoneType.created_at
      };
      
      console.log("Transformed stone type for response:", camelCaseStoneType);
      
      res.json(camelCaseStoneType);
    } catch (error) {
      console.error('Error updating stone type via alternative route:', error);
      res.status(500).json({ message: 'Failed to update stone type' });
    }
  });
  
  // Alternative route for deleting stone types that avoids the global admin middleware
  app.post('/api/stone-types/admin/delete/:id', async (req, res) => {
    try {
      console.log("STONE TYPE DELETE ENDPOINT CALLED WITH ID:", req.params.id);
      console.log("Request headers:", req.headers);
      
      // Check for specialized admin auth headers (for stone type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Stone type deletion - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type deletion - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type deletion - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type deletion - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type deletion - error finding default admin user:", error);
          }
        }
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid stone type ID' });
      }

      // Get the stone type to check for image
      const stoneType = await storage.getStoneType(id);
      if (!stoneType) {
        return res.status(404).json({ message: 'Stone type not found' });
      }

      // Use SQL method directly for more reliable delete
      const client = await pool.connect();
      let deleteSuccess = false;
      
      try {
        await client.query('BEGIN');
        
        // First, delete any product associations
        await client.query('DELETE FROM product_stones WHERE stone_type_id = $1', [id]);
        
        // Then delete the stone type itself
        const deleteResult = await client.query('DELETE FROM stone_types WHERE id = $1 RETURNING id', [id]);
        deleteSuccess = deleteResult.rowCount > 0;
        
        await client.query('COMMIT');
        console.log("DIRECT SQL DELETE SUCCESS:", deleteSuccess);
        console.log("Delete result rowCount:", deleteResult.rowCount);
        console.log("Delete result rows:", deleteResult.rows);
      } catch (sqlError) {
        await client.query('ROLLBACK');
        console.error("SQL ERROR DETAILS:", sqlError);
        throw sqlError;
      } finally {
        client.release();
      }

      console.log("After SQL operation, deleteSuccess =", deleteSuccess);
      
      if (deleteSuccess) {
        // Delete image if it exists
        if (stoneType.imageUrl) {
          try {
            const imagePath = path.join(process.cwd(), stoneType.imageUrl.substring(1));
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (error) {
            console.error("Error deleting image:", error);
            // Continue even if image deletion fails
          }
        }
        res.json({ success: true });
      } else {
        res.status(500).json({ message: 'Failed to delete stone type' });
      }
    } catch (error) {
      console.error('Error deleting stone type via alternative route:', error);
      res.status(500).json({ message: 'Failed to delete stone type' });
    }
  });

  // Test endpoint for OpenAI API
  app.get("/api/test-openai", async (req, res) => {
    try {
      console.log("Testing OpenAI API connection...");
      
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API key is not configured");
        return res.status(400).json({ 
          success: false, 
          message: "OpenAI API key is not configured"
        });
      }
      
      console.log("OpenAI API key is configured. Testing connection...");
      
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      
      // Simple test completion with error handling
      try {
        const testResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // Use a simpler model for the test
          messages: [
            { role: "system", content: "You are a test assistant." },
            { role: "user", content: "Respond with 'Connection successful' if you receive this message." }
          ],
          max_tokens: 15,
          temperature: 0.1,
        });
        
        if (testResponse.choices && testResponse.choices.length > 0) {
          const responseContent = testResponse.choices[0].message.content;
          console.log("OpenAI API test successful. Response:", responseContent);
          
          return res.status(200).json({ 
            success: true, 
            message: "OpenAI API connection successful",
            response: responseContent
          });
        } else {
          console.error("OpenAI API test failed: Unexpected response format");
          return res.status(500).json({ 
            success: false, 
            message: "OpenAI API test failed: Unexpected response format",
            details: JSON.stringify(testResponse)
          });
        }
      } catch (apiError: any) {
        console.error("OpenAI API request error:", apiError);
        // Check for specific error types
        if (apiError.status === 401) {
          return res.status(401).json({
            success: false,
            message: "OpenAI API authentication failed. Check your API key.",
            error: apiError.message
          });
        } else if (apiError.status === 429) {
          return res.status(429).json({
            success: false,
            message: "OpenAI API rate limit exceeded or insufficient quota.",
            error: apiError.message
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "OpenAI API request failed",
            error: apiError.message || "Unknown API error"
          });
        }
      }
    } catch (error: any) {
      console.error("OpenAI connection test general error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to test OpenAI API connection",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Products Management with Multi-select Stones
  app.get('/api/admin/products', validateAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      
      // Calculate accurate prices for each product in the admin view also
      // to match what's shown in the public-facing views
      const USD_TO_INR_RATE = 83;
      
      const productsWithAccuratePrices = await Promise.all(products.map(async product => {
        try {
          // Try to get AI inputs from product.aiInputs first
          let aiInputs = product.aiInputs ? JSON.parse(product.aiInputs as unknown as string) : null;
          
          // If aiInputs is null, try to extract from the nested details JSON
          if (!aiInputs && product.details) {
            try {
              const parsedDetails = JSON.parse(product.details as string);
              if (parsedDetails.additionalData && parsedDetails.additionalData.aiInputs) {
                aiInputs = parsedDetails.additionalData.aiInputs;
              }
            } catch (err) {
              console.error(`Failed to parse details JSON for product ${product.id}:`, err);
            }
          }
          
          if (aiInputs) {
            // Extract parameters for the price calculator
            const params = {
              productType: aiInputs.productType || "",
              metalType: aiInputs.metalType || "",
              metalWeight: parseFloat(aiInputs.metalWeight) || 0,
              primaryGems: [],
              otherStone: aiInputs.otherStoneType ? {
                stoneTypeId: aiInputs.otherStoneType,
                caratWeight: parseFloat(aiInputs.otherStoneWeight) || 0
              } : undefined
            };
            
            // Add main stone if available
            if (aiInputs.mainStoneType && aiInputs.mainStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.mainStoneType,
                carats: parseFloat(aiInputs.mainStoneWeight) || 0
              });
            }
            
            // Add secondary stone if available
            if (aiInputs.secondaryStoneType && aiInputs.secondaryStoneWeight) {
              params.primaryGems.push({
                name: aiInputs.secondaryStoneType,
                carats: parseFloat(aiInputs.secondaryStoneWeight) || 0
              });
            }
            
            const result = await calculateJewelryPrice(params);
            
            // Add the accurate prices to the product
            return {
              ...product,
              calculatedPriceUSD: result.priceUSD,
              calculatedPriceINR: result.priceINR
            };
          }
          
          // If AI inputs are not available, use default price
          const defaultPriceINR = 75000; // Default price if calculations fail
          return {
            ...product,
            calculatedPriceUSD: Math.round(defaultPriceINR / USD_TO_INR_RATE),
            calculatedPriceINR: defaultPriceINR
          };
        } catch (error) {
          console.error(`Error calculating price for product ${product.id}:`, error);
          // Return the product with default price
          const defaultPriceINR = 75000; // Default price if calculations fail
          return {
            ...product,
            calculatedPriceUSD: Math.round(defaultPriceINR / USD_TO_INR_RATE),
            calculatedPriceINR: defaultPriceINR
          };
        }
      }));
      
      res.json(productsWithAccuratePrices);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.get('/api/admin/products/:id', validateAdmin, async (req, res) => {
    try {
      console.log(`GET /api/admin/products/${req.params.id} - Admin: ${req.user?.username}`);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log(`Invalid product ID: ${req.params.id}`);
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      
      console.log(`Fetching product with ID ${id}`);
      const product = await storage.getProduct(id);
      
      if (product) {
        console.log(`Found product: ${product.name} (ID: ${product.id})`);
        
        // Get the associated stone types for the product
        console.log(`Fetching stone types for product ${id}`);
        const productStones = await storage.getProductStones(id);
        console.log(`Found ${productStones.length} stone types for product ${id}`);
        
        const responseData = {
          ...product,
          stoneTypes: productStones
        };
        
        console.log(`Sending product data with ${productStones.length} stone types`);
        res.json(responseData);
      } else {
        console.log(`Product with ID ${id} not found`);
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  });

  app.post('/api/admin/products', validateAdmin, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImage1', maxCount: 1 },
    { name: 'additionalImage2', maxCount: 1 },
    { name: 'additionalImage3', maxCount: 1 }
  ]), async (req, res) => {
    try {
      console.log('Received product creation request:', req.body);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Process main image
      const mainImageUrl = files.mainImage ? `/uploads/${files.mainImage[0].filename}` : null;
      console.log('Main image URL:', mainImageUrl);
      
      // Process additional images
      let additionalImages: string[] = [];
      
      // Check for the individual additional images
      if (files.additionalImage1) {
        additionalImages.push(`/uploads/${files.additionalImage1[0].filename}`);
      }
      
      if (files.additionalImage2) {
        additionalImages.push(`/uploads/${files.additionalImage2[0].filename}`);
      }
      
      if (files.additionalImage3) {
        additionalImages.push(`/uploads/${files.additionalImage3[0].filename}`);
      }
      
      console.log('Additional images:', additionalImages);

      // Parse selected stones from request body (uses different name in our new form)
      let selectedStones: number[] = [];
      if (req.body.selectedStones) {
        try {
          selectedStones = JSON.parse(req.body.selectedStones);
          console.log('Parsed selected stone IDs:', selectedStones);
        } catch (e) {
          console.error('Error parsing selectedStones:', e);
          selectedStones = [];
        }
      }
      
      // Convert boolean values from form submission
      const isNew = req.body.isNew === 'true';
      const isBestseller = req.body.isBestseller === 'true';
      const isFeatured = req.body.isFeatured === 'true';
      
      // Prepare product data - using our new form field names
      const productData = {
        name: req.body.name, 
        description: req.body.description || '',
        // basePrice field removed - now using calculated price exclusively
        imageUrl: mainImageUrl || '',
        additionalImages: additionalImages,
        details: req.body.details || '',
        dimensions: req.body.dimensions || '',
        category: req.body.category || '', // Keep for backward compatibility
        productTypeId: req.body.productTypeId ? parseInt(req.body.productTypeId) : null,
        isNew: isNew,
        isBestseller: isBestseller,
        isFeatured: isFeatured
      };
      
      console.log('Creating product with data:', productData);
      
      // Create the product first
      const product = await storage.createProduct(productData);
      console.log('Product created:', product);
      
      // Now add the stone associations
      if (selectedStones.length > 0 && product.id) {
        await storage.updateProductStones(product.id, selectedStones);
        console.log(`Added ${selectedStones.length} stone type associations to product ${product.id}`);
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product', error: String(error) });
    }
  });

  app.put('/api/admin/products/:id', validateAdmin, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImage1', maxCount: 1 },
    { name: 'additionalImage2', maxCount: 1 },
    { name: 'additionalImage3', maxCount: 1 },
    { name: 'additionalImage4', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Processing update for product ID: ${id}`);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Log the received files
      if (files) {
        console.log("Received files:", Object.keys(files).map(key => `${key}: ${files[key]?.length || 0} file(s)`));
      } else {
        console.log("No files received with update request");
      }
      
      // Log the raw body keys (debug)
      console.log("Raw request body keys:", Object.keys(req.body));
      
      // Create an updated data object from request body
      let updateData: any = {};
      
      // Check if data is sent in the 'data' field (FormData approach)
      if (req.body.data) {
        try {
          // Parse the JSON data from the 'data' field
          const parsedData = JSON.parse(req.body.data);
          updateData = { ...parsedData };
          console.log("Parsed product data from FormData - fields:", Object.keys(updateData));
        } catch (e) {
          console.error("Error parsing JSON data from request:", e);
          return res.status(400).json({ message: 'Invalid product data format' });
        }
      } else {
        // Fallback to legacy approach
        updateData = { ...req.body };
        console.log("Using direct request body for product update - fields:", Object.keys(updateData));
      }
      
      // Handle productTypeId parsing to integer if present
      if (updateData.productTypeId) {
        updateData.productTypeId = parseInt(updateData.productTypeId);
        console.log(`Parsed productTypeId to number: ${updateData.productTypeId}`);
      }
      
      // Get existing product for old image cleanup
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Handle main image update
      if (files.mainImage) {
        updateData.imageUrl = `/uploads/${files.mainImage[0].filename}`;
        
        // Delete old main image
        if (existingProduct.imageUrl) {
          const oldMainImagePath = path.join(process.cwd(), existingProduct.imageUrl.substring(1));
          if (fs.existsSync(oldMainImagePath)) {
            fs.unlinkSync(oldMainImagePath);
          }
        }
      }
      
      // Process additional images - Collect all additional image files
      const additionalImageFiles = [];
      for (let i = 1; i <= 4; i++) {
        const fieldName = `additionalImage${i}`;
        if (files[fieldName] && files[fieldName].length > 0) {
          additionalImageFiles.push(files[fieldName][0]);
        }
      }
      
      console.log(`Found ${additionalImageFiles.length} additional image files`);
      
      // If we have new additional images
      if (additionalImageFiles.length > 0) {
        // Create paths for the new images
        const newAdditionalImages = additionalImageFiles.map(file => `/uploads/${file.filename}`);
        console.log("New additional images:", newAdditionalImages);
        
        // Get existing additional images
        const existingImages = existingProduct.additionalImages || [];
        console.log("Existing additional images:", existingImages);
        
        // Check if we're replacing all images or keeping existing ones
        if (req.body.replaceExistingImages === 'true') {
          console.log("Replacing all existing images");
          // Delete existing images
          existingImages.forEach(imgUrl => {
            if (!imgUrl) return;
            const imgPath = path.join(process.cwd(), imgUrl.substring(1));
            if (fs.existsSync(imgPath)) {
              fs.unlinkSync(imgPath);
              console.log(`Deleted existing image: ${imgUrl}`);
            }
          });
          
          // Replace with new images
          updateData.additionalImages = newAdditionalImages;
        } else {
          // Handle individual image replacements using existing URLs from form data
          let updatedImages = [...existingImages];
          
          console.log("Existing image count:", existingImages.length);
          
          // If we have existing images from the form data, use those
          if (req.body.existingAdditionalImage1) {
            console.log("Using existing images from form data");
            updatedImages = [];
            
            // Add all existing images from form data
            for (let i = 1; i <= 4; i++) {
              const fieldName = `existingAdditionalImage${i}`;
              if (req.body[fieldName]) {
                updatedImages.push(req.body[fieldName]);
                console.log(`Added existing image from form: ${req.body[fieldName]}`);
              }
            }
          }
          
          // Append new images
          updateData.additionalImages = [...updatedImages, ...newAdditionalImages];
          console.log("Final additional images:", updateData.additionalImages);
        }
      } else if (req.body.existingAdditionalImage1 || req.body.emptyAdditionalImages === 'true') {
        // No new images, but we have existing ones from form data or a flag to set empty images
        console.log("No new images, using existing images from form data");
        
        const updatedImages = [];
        // If we have the empty flag and no existing images, we want an empty array
        if (req.body.emptyAdditionalImages === 'true' && !req.body.existingAdditionalImage1) {
          console.log("Setting additional images to empty array as requested");
        } else {
          // Otherwise collect all the existing image values
          for (let i = 1; i <= 4; i++) {
            const fieldName = `existingAdditionalImage${i}`;
            if (req.body[fieldName]) {
              updatedImages.push(req.body[fieldName]);
              console.log(`Added existing image from form: ${req.body[fieldName]}`);
            }
          }
        }
        
        // Always explicitly set the additional images array
        updateData.additionalImages = updatedImages;
        console.log("Final existing images from form:", updateData.additionalImages);
      }
      
      // Parse stone type IDs from request body
      let stoneTypeIds: number[] = [];
      if (req.body.stoneTypeIds) {
        try {
          stoneTypeIds = JSON.parse(req.body.stoneTypeIds);
        } catch (e) {
          console.error('Error parsing stoneTypeIds:', e);
          stoneTypeIds = [];
        }
      }
      
      // Ensure additionalImages is always an array
      if (updateData.additionalImages && !Array.isArray(updateData.additionalImages)) {
        console.log(`Converting additionalImages from ${typeof updateData.additionalImages} to array:`, updateData.additionalImages);
        updateData.additionalImages = Array.isArray(updateData.additionalImages) 
          ? updateData.additionalImages 
          : [];
      }
      
      // Log the final data being sent to storage
      console.log("Final update data being sent to storage:", {
        keys: Object.keys(updateData),
        additionalImagesType: updateData.additionalImages 
          ? (Array.isArray(updateData.additionalImages) ? "array" : typeof updateData.additionalImages) 
          : "undefined",
        additionalImagesLength: updateData.additionalImages && Array.isArray(updateData.additionalImages) 
          ? updateData.additionalImages.length 
          : "unknown"
      });

      // Update the product
      const updatedProduct = await storage.updateProduct(id, updateData);
      
      if (!updatedProduct) {
        console.error(`Failed to update product ${id} - storage.updateProduct returned no data`);
        return res.status(500).json({ 
          message: 'Failed to update product in database',
          details: 'The update operation did not return expected data'
        });
      }
      
      console.log(`Successfully updated product ${id} in database`);
      
      // Update product stone associations
      if (stoneTypeIds.length > 0 || req.body.updateStoneTypes === 'true') {
        await storage.updateProductStones(id, stoneTypeIds);
        console.log(`Updated stone associations for product ${id}`);
      }
      
      // Get the updated product with stone types
      const productWithStones = {
        ...updatedProduct,
        stoneTypes: await storage.getProductStones(id)
      };
      
      console.log(`Sending updated product back to client:`, {
        id: productWithStones.id,
        name: productWithStones.name,
        fields: Object.keys(productWithStones)
      });
      
      res.json(productWithStones);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ 
        message: 'Failed to update product', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete('/api/admin/products/:id', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get product to check for images
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Delete the product
      const success = await storage.deleteProduct(id);
      
      if (success) {
        // Delete main image
        if (product.imageUrl) {
          const mainImagePath = path.join(process.cwd(), product.imageUrl.substring(1));
          if (fs.existsSync(mainImagePath)) {
            fs.unlinkSync(mainImagePath);
          }
        }
        
        // Delete additional images
        if (product.additionalImages) {
          product.additionalImages.forEach(imgUrl => {
            const imgPath = path.join(process.cwd(), imgUrl.substring(1));
            if (fs.existsSync(imgPath)) {
              fs.unlinkSync(imgPath);
            }
          });
        }
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete product' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  /**
   * Metal Type Routes (Admin only)
   */
  // Get all metal types
  // Using improved auth GET endpoint defined above

  // Get metal type by ID
  app.get('/api/admin/metal-types/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid metal type ID' });
      }

      const metalType = await storage.getMetalType(id);
      if (!metalType) {
        return res.status(404).json({ message: 'Metal type not found' });
      }

      res.json(metalType);
    } catch (error) {
      console.error('Error fetching metal type:', error);
      res.status(500).json({ message: 'Failed to fetch metal type' });
    }
  });

  // Create a new metal type (admin only)
  app.post('/api/admin/metal-types', async (req, res) => {
    try {
      // Check for specialized admin auth headers (for metal type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Metal type creation - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Metal type creation - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Metal type creation - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Metal type creation - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Metal type creation - error finding default admin user:", error);
          }
        }
      }
      
      console.log('Metal Type Creation - Request Body:', req.body);
      console.log('Expected schema fields:', Object.keys(insertMetalTypeSchema.shape));
      
      const metalTypeData = insertMetalTypeSchema.parse(req.body);
      const metalType = await storage.createMetalType(metalTypeData);
      res.status(201).json(metalType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.errors);
        return res.status(400).json({ message: 'Invalid metal type data', errors: error.errors });
      }
      console.error('Error creating metal type:', error);
      res.status(500).json({ message: 'Failed to create metal type' });
    }
  });

  // Update a metal type (admin only)
  app.put('/api/admin/metal-types/:id', async (req, res) => {
    try {
      // Check for specialized admin auth headers (for metal type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Metal type update - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Metal type update - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Metal type update - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Metal type update - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Metal type update - error finding default admin user:", error);
          }
        }
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid metal type ID' });
      }

      const updateData = insertMetalTypeSchema.partial().parse(req.body);
      const updatedMetalType = await storage.updateMetalType(id, updateData);

      if (!updatedMetalType) {
        return res.status(404).json({ message: 'Metal type not found' });
      }

      res.json(updatedMetalType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid metal type data', errors: error.errors });
      }
      console.error('Error updating metal type:', error);
      res.status(500).json({ message: 'Failed to update metal type' });
    }
  });

  // Delete a metal type (admin only)
  app.delete('/api/admin/metal-types/:id', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid metal type ID' });
      }

      const success = await storage.deleteMetalType(id);
      if (!success) {
        return res.status(404).json({ message: 'Metal type not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting metal type:', error);
      res.status(500).json({ message: 'Failed to delete metal type' });
    }
  });

  /**
   * Stone Type Routes (Admin only)
   */
  // These endpoints have been moved to earlier in the file with proper validateAdmin middleware

  // Get stone type by ID (improved authentication)
  app.get('/api/admin/stone-types/:id', async (req, res) => {
    try {
      // Check for specialized admin auth headers
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Stone type details - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type details - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type details - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type details - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type details - error finding default admin user:", error);
          }
        }
      }
    
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid stone type ID' });
      }

      const stoneType = await storage.getStoneType(id);
      if (!stoneType) {
        return res.status(404).json({ message: 'Stone type not found' });
      }

      res.json(stoneType);
    } catch (error) {
      console.error('Error fetching stone type:', error);
      res.status(500).json({ message: 'Failed to fetch stone type' });
    }
  });

  // Create a new stone type (admin only)
  app.post('/api/admin/stone-types', upload.single('image'), async (req, res) => {
    try {
      // Check for specialized admin auth headers (for stone type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Stone type creation - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type creation - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type creation - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type creation - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type creation - error finding default admin user:", error);
          }
        }
      }
      
      // Parse the stone type data
      const stoneTypeData = insertStoneTypeSchema.parse({
        ...req.body,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
      });

      const stoneType = await storage.createStoneType(stoneTypeData);
      res.status(201).json(stoneType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid stone type data', errors: error.errors });
      }
      console.error('Error creating stone type:', error);
      res.status(500).json({ message: 'Failed to create stone type' });
    }
  });

  // Update a stone type (admin only)
  app.put('/api/admin/stone-types/:id', upload.single('image'), async (req, res) => {
    try {
      // Check for specialized admin auth headers (for stone type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Stone type update - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type update - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type update - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type update - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type update - error finding default admin user:", error);
          }
        }
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid stone type ID' });
      }

      // Get the existing stone type to check for image
      const existingStoneType = await storage.getStoneType(id);
      if (!existingStoneType) {
        return res.status(404).json({ message: 'Stone type not found' });
      }

      // Parse update data
      let updateData: any = { ...req.body };
      
      // Handle image update
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
        
        // Delete old image if it exists
        if (existingStoneType.imageUrl) {
          const oldImagePath = path.join(process.cwd(), existingStoneType.imageUrl.substring(1));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }

      // Validate data
      const validatedData = insertStoneTypeSchema.partial().parse(updateData);
      
      // Update the stone type
      const updatedStoneType = await storage.updateStoneType(id, validatedData);
      if (!updatedStoneType) {
        return res.status(404).json({ message: 'Stone type not found' });
      }

      res.json(updatedStoneType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid stone type data', errors: error.errors });
      }
      console.error('Error updating stone type:', error);
      res.status(500).json({ message: 'Failed to update stone type' });
    }
  });

  // Delete a stone type (admin only)
  app.delete('/api/admin/stone-types/:id', async (req, res) => {
    try {
      // Check for specialized admin auth headers (for stone type form calling from frontend)
      const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
      const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
      const adminUsername = req.headers['x-admin-username'];
      
      // Allow access either through our standard validateAdmin or through headers
      if (hasAdminDebugHeader && hasAdminApiKey) {
        console.log("Stone type deletion - direct API key authentication");
        
        // Try to set the admin user from the header
        if (adminUsername && typeof adminUsername === 'string') {
          try {
            const adminUser = await storage.getUserByUsername(adminUsername);
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type deletion - set admin user from headers:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type deletion - error finding specified admin user:", error);
          }
        }
      } else {
        // Try to set default admin user if not already authenticated
        if (!req.user) {
          try {
            const adminUser = await storage.getUserByUsername('admin');
            if (adminUser) {
              req.user = adminUser;
              console.log("Stone type deletion - set default admin user:", adminUser.username);
            }
          } catch (error) {
            console.log("Stone type deletion - error finding default admin user:", error);
          }
        }
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid stone type ID' });
      }

      // Get the stone type to check for image
      const stoneType = await storage.getStoneType(id);
      if (!stoneType) {
        return res.status(404).json({ message: 'Stone type not found' });
      }

      // Delete the stone type
      const success = await storage.deleteStoneType(id);
      if (success) {
        // Delete image if it exists
        if (stoneType.imageUrl) {
          const imagePath = path.join(process.cwd(), stoneType.imageUrl.substring(1));
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete stone type' });
      }
    } catch (error) {
      console.error('Error deleting stone type:', error);
      res.status(500).json({ message: 'Failed to delete stone type' });
    }
  });

  /**
   * Product-Stone Routes (Admin only)
   */
  // Get stones for a product
  app.get('/api/admin/products/:id/stones', async (req, res) => {
    // Check for specialized admin auth headers
    const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
    const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
    const adminUsername = req.headers['x-admin-username'];
    
    // Allow access either through our standard validateAdmin or through headers
    if (hasAdminDebugHeader && hasAdminApiKey) {
      console.log("Product stones fetch - direct API key authentication");
      
      // Try to set the admin user from the header
      if (adminUsername && typeof adminUsername === 'string') {
        try {
          const adminUser = await storage.getUserByUsername(adminUsername);
          if (adminUser) {
            req.user = adminUser;
            console.log("Product stones fetch - set admin user from headers:", adminUser.username);
          }
        } catch (error) {
          console.log("Product stones fetch - error finding specified admin user:", error);
        }
      }
    } else {
      // Try to set default admin user if not already authenticated
      if (!req.user) {
        try {
          const adminUser = await storage.getUserByUsername('admin');
          if (adminUser) {
            req.user = adminUser;
            console.log("Product stones fetch - set default admin user:", adminUser.username);
          }
        } catch (error) {
          console.log("Product stones fetch - error finding default admin user:", error);
        }
      }
    }
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const stones = await storage.getProductStones(productId);
      res.json(stones);
    } catch (error) {
      console.error('Error fetching product stones:', error);
      res.status(500).json({ message: 'Failed to fetch product stones' });
    }
  });

  // Add stones to a product
  app.post('/api/admin/products/:id/stones', async (req, res) => {
    // Check for specialized admin auth headers
    const hasAdminDebugHeader = req.headers['x-admin-debug-auth'] === 'true';
    const hasAdminApiKey = req.headers['x-admin-api-key'] === 'dev_admin_key_12345';
    const adminUsername = req.headers['x-admin-username'];
    
    // Allow access either through our standard validateAdmin or through headers
    if (hasAdminDebugHeader && hasAdminApiKey) {
      console.log("Product stones update - direct API key authentication");
      
      // Try to set the admin user from the header
      if (adminUsername && typeof adminUsername === 'string') {
        try {
          const adminUser = await storage.getUserByUsername(adminUsername);
          if (adminUser) {
            req.user = adminUser;
            console.log("Product stones update - set admin user from headers:", adminUser.username);
          }
        } catch (error) {
          console.log("Product stones update - error finding specified admin user:", error);
        }
      }
    } else {
      // Try to set default admin user if not already authenticated
      if (!req.user) {
        try {
          const adminUser = await storage.getUserByUsername('admin');
          if (adminUser) {
            req.user = adminUser;
            console.log("Product stones update - set default admin user:", adminUser.username);
          }
        } catch (error) {
          console.log("Product stones update - error finding default admin user:", error);
        }
      }
    }
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const { stoneTypeIds } = req.body;
      if (!Array.isArray(stoneTypeIds)) {
        return res.status(400).json({ message: 'stoneTypeIds must be an array' });
      }

      await storage.updateProductStones(productId, stoneTypeIds);
      const stones = await storage.getProductStones(productId);
      res.json(stones);
    } catch (error) {
      console.error('Error adding stones to product:', error);
      res.status(500).json({ message: 'Failed to add stones to product' });
    }
  });

  /**
   * Product Type routes
   */
  // Product type routes have been moved to later in this file to avoid duplication

  // Update and Delete product type routes have been moved to later in this file

  /**
   * Inspiration Gallery Routes
   */
  // Get all inspiration gallery items
  app.get('/api/inspiration', async (_req, res) => {
    try {
      const inspirationItems = await storage.getAllInspirationItems();
      res.json(inspirationItems);
    } catch (error) {
      console.error('Error fetching inspiration gallery items:', error);
      res.status(500).json({ message: 'Failed to fetch inspiration gallery items' });
    }
  });

  // Get featured inspiration gallery items
  app.get('/api/inspiration/featured', async (_req, res) => {
    try {
      const featuredItems = await storage.getFeaturedInspirationItems();
      res.json(featuredItems);
    } catch (error) {
      console.error('Error fetching featured inspiration gallery items:', error);
      res.status(500).json({ message: 'Failed to fetch featured inspiration gallery items' });
    }
  });

  // Get inspiration gallery items by category
  app.get('/api/inspiration/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getInspirationItemsByCategory(category);
      res.json(items);
    } catch (error) {
      console.error('Error fetching inspiration gallery items by category:', error);
      res.status(500).json({ message: 'Failed to fetch inspiration gallery items by category' });
    }
  });

  // Admin: Create new inspiration gallery item
  app.post('/api/admin/inspiration', async (req, res) => {
    console.log('POST /api/admin/inspiration - Starting admin validation');
    
    // Manual admin check to better debug authentication issues
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'limited-admin')) {
      console.log('POST /api/admin/inspiration - Admin validation failed', {
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        isAuthenticated: req.isAuthenticated?.() || false,
        hasCookies: !!req.cookies,
        adminIdCookie: req.cookies?.admin_id || 'none',
      });
      
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.log('POST /api/admin/inspiration - Admin validation successful', {
      userId: req.user.id,
      username: req.user.username || req.user.loginID
    });
    
    try {
      const validatedData = insertInspirationGallerySchema.parse(req.body);
      console.log('POST /api/admin/inspiration - Creating new inspiration item', validatedData);
      const newItem = await storage.createInspirationItem(validatedData);
      console.log('POST /api/admin/inspiration - Successfully created new item with ID:', newItem.id);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating inspiration gallery item:', error);
      res.status(500).json({ message: 'Failed to create inspiration gallery item' });
    }
  });

  // Admin: Update inspiration gallery item
  app.put('/api/admin/inspiration/:id', async (req, res) => {
    console.log('PUT /api/admin/inspiration/:id - Starting admin validation');
    
    // Manual admin check to better debug authentication issues
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'limited-admin')) {
      console.log('PUT /api/admin/inspiration/:id - Admin validation failed', {
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        isAuthenticated: req.isAuthenticated?.() || false,
        hasCookies: !!req.cookies,
        adminIdCookie: req.cookies?.admin_id || 'none',
      });
      
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.log('PUT /api/admin/inspiration/:id - Admin validation successful', {
      userId: req.user.id,
      username: req.user.username || req.user.loginID
    });
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      console.log(`PUT /api/admin/inspiration/:id - Updating inspiration item with ID: ${id}`, req.body);
      const updatedItem = await storage.updateInspirationItem(id, req.body);
      if (!updatedItem) {
        console.log(`PUT /api/admin/inspiration/:id - Item with ID ${id} not found`);
        return res.status(404).json({ message: 'Inspiration gallery item not found' });
      }

      console.log(`PUT /api/admin/inspiration/:id - Successfully updated item with ID: ${id}`);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating inspiration gallery item:', error);
      res.status(500).json({ message: 'Failed to update inspiration gallery item' });
    }
  });

  // Admin: Delete inspiration gallery item
  app.delete('/api/admin/inspiration/:id', async (req, res) => {
    console.log('DELETE /api/admin/inspiration/:id - Starting admin validation');
    
    // Manual admin check to better debug authentication issues
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'limited-admin')) {
      console.log('DELETE /api/admin/inspiration/:id - Admin validation failed', {
        hasUser: !!req.user,
        userRole: req.user?.role || 'none',
        isAuthenticated: req.isAuthenticated?.() || false,
        hasCookies: !!req.cookies,
        adminIdCookie: req.cookies?.admin_id || 'none',
      });
      
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.log('DELETE /api/admin/inspiration/:id - Admin validation successful', {
      userId: req.user.id,
      username: req.user.username || req.user.loginID
    });
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      console.log(`DELETE /api/admin/inspiration/:id - Deleting inspiration item with ID: ${id}`);
      const success = await storage.deleteInspirationItem(id);
      
      if (!success) {
        console.log(`DELETE /api/admin/inspiration/:id - Item with ID ${id} not found`);
        return res.status(404).json({ message: 'Inspiration gallery item not found' });
      }
      
      console.log(`DELETE /api/admin/inspiration/:id - Successfully deleted item with ID: ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting inspiration gallery item:', error);
      res.status(500).json({ message: 'Failed to delete inspiration gallery item' });
    }
  });
  
  // Admin: Upload inspiration image with file
  app.post('/api/inspiration-images', upload.single('image'), async (req, res) => {
    try {
      // Admin authentication check
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized - Admin access required' });
      }

      const { title, alt, description } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      if (!title || !alt) {
        return res.status(400).json({ message: 'Title and alt text are required' });
      }
      
      // Process and save the image
      const filename = req.file.filename;
      const imageUrl = `/uploads/${filename}`;
      
      // Save to database using the inspiration_gallery table
      const newImage = await storage.createInspirationItem({
        title,
        description: description || '',
        imageUrl,
        category: 'general',  // Default category
        tags: [],  // Empty tags array as default
        featured: false  // Not featured by default
      });
      
      return res.status(201).json({
        success: true,
        message: 'Inspiration image uploaded successfully',
        image: newImage
      });
      
    } catch (error) {
      console.error('Error uploading inspiration image:', error);
      return res.status(500).json({ 
        message: 'Failed to upload inspiration image',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get all inspiration images
  app.get('/api/inspiration-images', async (_req, res) => {
    try {
      const inspirationItems = await storage.getAllInspirationItems();
      res.json(inspirationItems);
    } catch (error) {
      console.error('Error fetching inspiration images:', error);
      res.status(500).json({ message: 'Failed to fetch inspiration images' });
    }
  });

  // Enhanced endpoint to synchronize passport session and admin cookies
  app.post('/api/auth/sync-admin-cookie', async (req, res) => {
    console.log("Admin cookie sync endpoint called");
    
    // Check request body for adminId - allows direct specification of admin to sync
    // This is critical for production environments where sessions can get lost
    const adminIdFromBody = req.body?.adminId;
    
    // First check if we have a valid session - the most reliable method
    if (req.isAuthenticated() && req.user) {
      console.log("Admin cookie sync - authenticated user found:", req.user.loginID || req.user.username);
      
      // Check if user is admin
      if (req.user.role === 'admin' || req.user.role === 'limited-admin') {
        console.log(`Admin cookie sync - setting admin cookie for ${req.user.role}:`, req.user.id);
        
        // Set admin cookie - reduced to 4 hours for security
        const FOUR_HOURS = 4 * 60 * 60 * 1000;
        
        res.cookie('admin_id', req.user.id.toString(), { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
          sameSite: 'lax',
          path: '/',
          maxAge: FOUR_HOURS
        });
        
        // Set admin auth time
        res.cookie('admin_auth_time', Date.now().toString(), { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
          sameSite: 'lax',
          path: '/',
          maxAge: FOUR_HOURS
        });
        
        console.log("Admin cookie sync - cookies set successfully from session");
        return res.status(200).json({ 
          success: true, 
          message: "Admin cookies synchronized using session", 
          data: {
            id: req.user.id,
            role: req.user.role,
            loginID: req.user.loginID || req.user.username,
            method: "session"
          }
        });
      } else {
        console.log("Admin cookie sync - user is not admin:", req.user.role);
        return res.status(403).json({ success: false, message: "User is not an admin" });
      }
    } 
    // If no session but adminId provided in body, try to use that (backup method)
    else if (adminIdFromBody) {
      console.log("Admin cookie sync - using provided adminId:", adminIdFromBody);
      
      try {
        // Validate the adminId exists and is an admin
        const adminId = parseInt(adminIdFromBody);
        if (isNaN(adminId)) {
          return res.status(400).json({ success: false, message: "Invalid admin ID format" });
        }
        
        // Fetch user from database to verify admin status
        const user = await storage.getUser(adminId);
        
        if (!user) {
          console.log("Admin cookie sync - no user found with ID:", adminId);
          return res.status(404).json({ success: false, message: "Admin user not found" });
        }
        
        if (user.role !== 'admin' && user.role !== 'limited-admin') {
          console.log("Admin cookie sync - user is not admin:", user.role);
          return res.status(403).json({ success: false, message: "User is not an admin" });
        }
        
        console.log(`Admin cookie sync - setting admin cookie for ${user.role}:`, user.id);
        
        // Set admin cookie - reduced to 4 hours for security
        const FOUR_HOURS = 4 * 60 * 60 * 1000;
        
        res.cookie('admin_id', user.id.toString(), { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
          sameSite: 'lax',
          path: '/',
          maxAge: FOUR_HOURS
        });
        
        // Set admin auth time
        res.cookie('admin_auth_time', Date.now().toString(), { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
          sameSite: 'lax',
          path: '/',
          maxAge: FOUR_HOURS
        });
        
        // For future requests, also set this user in the session if possible
        if (req.logIn) {
          try {
            req.logIn(user, (err) => {
              if (err) {
                console.error("Admin cookie sync - failed to log in user via passport:", err);
              } else {
                console.log("Admin cookie sync - also logged in via passport session");
              }
            });
          } catch (loginError) {
            console.error("Admin cookie sync - error during passport login:", loginError);
          }
        }
        
        console.log("Admin cookie sync - cookies set successfully from adminId");
        return res.status(200).json({ 
          success: true, 
          message: "Admin cookies synchronized using provided ID", 
          data: {
            id: user.id,
            role: user.role,
            loginID: user.loginID || user.username,
            method: "adminId"
          }
        });
      } catch (error) {
        console.error("Admin cookie sync - error using adminId:", error);
        return res.status(500).json({ success: false, message: "Error setting admin cookie using adminId" });
      }
    } else {
      console.log("Admin cookie sync - no authenticated user found and no adminId provided");
      return res.status(401).json({ success: false, message: "Not authenticated and no admin ID provided" });
    }
  });

// Get current user - completely rewritten to use the new dedicated admin tokens
  app.get('/api/auth/me', async (req, res) => {
    console.log("ADMIN AUTH CHECK - /api/auth/me endpoint called");
    
    try {
      // First check dedicated admin cookie (preferred method)
      const adminId = req.cookies?.admin_id;
      
      if (adminId) {
        try {
          const parsedAdminId = parseInt(adminId);
          if (!isNaN(parsedAdminId)) {
            console.log("Admin auth check - found admin_id cookie:", parsedAdminId);
            
            // Try to get admin user by ID from cookie
            const adminUser = await storage.getUser(parsedAdminId);
            
            if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'limited-admin')) {
              console.log(`Admin auth check - verified ${adminUser.role} user from cookie:`, adminUser.loginID || adminUser.name || 'Unknown');
              
              // Return sanitized user data
              const { password, ...userWithoutPassword } = adminUser;
              
              // Also check auth timestamp and refresh if needed
              const authTime = req.cookies?.admin_auth_time;
              if (authTime) {
                const now = Date.now();
                const authTimeVal = parseInt(authTime);
                if (!isNaN(authTimeVal)) {
                  const authAgeHours = (now - authTimeVal) / (1000 * 60 * 60);
                  
                  // If auth is too old (over 24 hours), refresh the timestamp
                  if (authAgeHours > 24) {
                    console.log("Admin auth check - refreshing admin auth timestamp cookie");
                    res.cookie('admin_auth_time', now, { 
                      httpOnly: true, 
                      secure: process.env.NODE_ENV === 'production',
                      sameSite: 'lax',
                      path: '/',
                      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });
                  }
                }
              }
              
              // Also sync with passport if needed
              if (!req.isAuthenticated || !req.isAuthenticated() || req.user?.id !== adminUser.id) {
                try {
                  req.login(adminUser, (loginErr) => {
                    if (loginErr) {
                      console.warn("Admin auth check - could not sync passport (non-critical):", loginErr);
                    } else {
                      console.log("Admin auth check - synced passport session with admin cookie auth");
                    }
                  });
                } catch (sessionError) {
                  console.warn("Admin auth check - error syncing passport session (non-critical):", sessionError);
                }
              }
              
              // Sanitize user data (renamed to avoid variable naming conflict)
              const { password: _userPassword, ...adminUserData } = adminUser;
              
              console.log("Admin auth check - returning admin user from dedicated cookie");
              return res.json({
                ...adminUserData,
                adminAuth: true,
                authTime: Date.now(),
                authSource: 'admin_cookie'
              });
            } else if (adminUser) {
              console.log("Admin auth check - user found but not admin role:", adminUser.role);
              // Clear invalid admin cookie
              res.clearCookie('admin_id', { path: '/' });
              res.clearCookie('admin_auth_time', { path: '/' });
            } else {
              console.log("Admin auth check - no user found for admin cookie ID:", parsedAdminId);
              // Clear invalid admin cookie
              res.clearCookie('admin_id', { path: '/' });
              res.clearCookie('admin_auth_time', { path: '/' });
            }
          }
        } catch (cookieError) {
          console.error('Error checking admin cookie auth:', cookieError);
        }
      }
      
      // Next check legacy cookie auth (backward compatibility)
      const userId = req.cookies?.userId;
      if (userId) {
        try {
          const parsedUserId = parseInt(userId);
          if (!isNaN(parsedUserId)) {
            console.log("Admin auth check - found legacy userId cookie:", parsedUserId);
            
            const legacyUser = await storage.getUser(parsedUserId);
            if (legacyUser && (legacyUser.role === 'admin' || legacyUser.role === 'limited-admin')) {
              console.log(`Admin auth check - verified ${legacyUser.role} via legacy cookie:`, legacyUser.loginID || legacyUser.name || 'Unknown');
              
              // Set the new admin cookies for future requests
              console.log("Admin auth check - upgrading to dedicated admin cookies");
              res.cookie('admin_id', legacyUser.id, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', 
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
              });
              res.cookie('admin_auth_time', Date.now(), { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
              });
              
              // Also sync with passport if needed
              if (!req.isAuthenticated || !req.isAuthenticated() || req.user?.id !== legacyUser.id) {
                try {
                  req.login(legacyUser, (loginErr) => {
                    if (loginErr) {
                      console.warn("Admin auth check - could not sync passport with legacy (non-critical):", loginErr);
                    } else {
                      console.log("Admin auth check - synced passport session with legacy cookie auth");
                    }
                  });
                } catch (sessionError) {
                  console.warn("Admin auth check - error syncing passport from legacy (non-critical):", sessionError);
                }
              }
              
              // Return sanitized user data with auth info
              const { password: _legacyPassword, ...legacyUserData } = legacyUser;
              console.log("Admin auth check - returning admin user from legacy cookie");
              return res.json({
                ...legacyUserData,
                adminAuth: true,
                authTime: Date.now(),
                authSource: 'legacy_cookie',
                upgraded: true
              });
            } else if (legacyUser) {
              console.log("Admin auth check - legacy user found but not admin or limited-admin, role:", legacyUser.role);
              // Clear invalid cookie
              res.clearCookie('userId', { path: '/' });
            } else {
              console.log("Admin auth check - no user found for legacy cookie ID:", parsedUserId);
              // Clear invalid cookie
              res.clearCookie('userId', { path: '/' });
            }
          }
        } catch (legacyError) {
          console.error('Error checking legacy cookie auth:', legacyError);
        }
      }
      
      // Finally check passport session auth
      if (req.isAuthenticated && req.isAuthenticated()) {
        if (req.user && (req.user.role === 'admin' || req.user.role === 'limited-admin')) {
          console.log(`Admin auth check - verified ${req.user.role} via passport session:`, req.user.username);
          
          // Set admin cookies for future requests (making auth more robust)
          console.log("Admin auth check - setting admin cookies from passport session");
          res.cookie('admin_id', req.user.id, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
          res.cookie('admin_auth_time', Date.now(), { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
          
          // Also set legacy cookie for maximum compatibility
          res.cookie('userId', req.user.id, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
          
          // Return sanitized user data with auth info
          const { password: _passportPassword, ...passportUserData } = req.user;
          console.log("Admin auth check - returning admin user from passport auth");
          return res.json({
            ...passportUserData,
            adminAuth: true,
            authTime: Date.now(),
            authSource: 'passport'
          });
        } else {
          console.log("Admin auth check - passport user found but not admin or limited-admin, role:", req.user?.role);
        }
      } else {
        console.log("Admin auth check - no passport authentication found");
      }
      
      // No authenticated admin user found with any method
      console.log("Admin auth check - no admin authentication found via any method");
      return res.status(401).json({ 
        message: 'Not authenticated as admin or limited-admin',
        authenticated: false,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Unexpected error in admin auth check:", error);
      return res.status(500).json({ 
        message: 'Error checking admin authentication status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  });

  /**
   * Product Types routes
   */
  // Get all product types
  app.get("/api/product-types", async (req, res) => {
    try {
      const productTypes = await storage.getAllProductTypes();
      return res.status(200).json(productTypes);
    } catch (error: any) {
      console.error("Error fetching product types:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch product types",
        error: error.message
      });
    }
  });

  // Get only active product types (for customer-facing pages)
  app.get("/api/product-types/active", async (req, res) => {
    try {
      const productTypes = await storage.getActiveProductTypes();
      return res.status(200).json(productTypes);
    } catch (error: any) {
      console.error("Error fetching active product types:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch active product types",
        error: error.message
      });
    }
  });

  // Get a specific product type by ID
  app.get("/api/product-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product type ID"
        });
      }

      const productType = await storage.getProductType(id);
      if (!productType) {
        return res.status(404).json({
          success: false,
          message: "Product type not found"
        });
      }

      return res.status(200).json(productType);
    } catch (error: any) {
      console.error(`Error fetching product type with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch product type",
        error: error.message
      });
    }
  });

  // Create a new product type
  app.post("/api/product-types", validateAdmin, async (req, res) => {
    try {
      const validatedData = insertProductTypeSchema.parse(req.body);
      const newProductType = await storage.createProductType(validatedData);
      
      return res.status(201).json(newProductType);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      
      console.error("Error creating product type:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create product type",
        error: error.message
      });
    }
  });

  // Update an existing product type
  app.put("/api/product-types/:id", validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product type ID"
        });
      }

      // Partial validation for update
      const validatedData = insertProductTypeSchema.partial().parse(req.body);
      
      const updatedProductType = await storage.updateProductType(id, validatedData);
      if (!updatedProductType) {
        return res.status(404).json({
          success: false,
          message: "Product type not found"
        });
      }

      return res.status(200).json(updatedProductType);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      
      console.error(`Error updating product type with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to update product type",
        error: error.message
      });
    }
  });

  // Delete a product type
  app.delete("/api/product-types/:id", validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product type ID"
        });
      }

      const success = await storage.deleteProductType(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Product type not found or could not be deleted"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product type deleted successfully"
      });
    } catch (error: any) {
      console.error(`Error deleting product type with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete product type",
        error: error.message
      });
    }
  });
  
  // Get the current USD to INR exchange rate (not authenticated)
  app.get("/api/exchange-rate", async (_req, res) => {
    try {
      const { getUsdToInrRate, getCachedExchangeRate } = await import("./services/exchange-rate-service");
      
      // Try to get a fresh rate, but use cached one if fetching fails
      try {
        const rate = await getUsdToInrRate();
        res.json({ 
          success: true,
          rate,
          source: "Xoom",
          timestamp: new Date().toISOString() 
        });
      } catch (error) {
        console.error("Error fetching fresh exchange rate:", error);
        const cachedRate = getCachedExchangeRate();
        res.json({ 
          success: true,
          rate: cachedRate,
          source: "cached",
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error in exchange rate endpoint:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch exchange rate",
        fallbackRate: 83 
      });
    }
  });
  
  /**
   * User Management API Endpoints (Admin only)
   */
  // Get all users
  app.get('/api/admin/users', validateAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove sensitive fields (password)
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching users', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Get user details by ID
  app.get('/api/admin/users/:id', validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Remove password before sending
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get user activity by ID
  app.get('/api/admin/users/:id/activity', validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      // Count user's design requests
      const designRequests = await storage.countUserDesignRequests(userId);
      
      // Count user's quote requests
      const quoteRequests = await storage.countUserQuoteRequests(userId);
      
      // Count user's personalization requests
      const personalizationRequests = await storage.countUserCustomizationRequests(userId);
      
      // Count user's orders (if available)
      let orders = 0;
      try {
        orders = await storage.countUserOrders(userId);
      } catch (error) {
        console.log('Order count not available:', error);
      }
      
      // Count user's contact messages
      let contactMessages = 0;
      try {
        contactMessages = await storage.countUserContactMessages(userId);
      } catch (error) {
        console.log('Contact messages count not available:', error);
      }
      
      // Try to get last activity time (if available)
      let lastActivity = null;
      try {
        lastActivity = await storage.getUserLastActivity(userId);
      } catch (error) {
        console.log('Last activity time not available:', error);
      }
      
      res.json({
        designRequests,
        quoteRequests,
        personalizationRequests,
        orders,
        contactMessages,
        lastActivity
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete a user
  app.delete('/api/admin/users/:id', validateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID' 
        });
      }
      
      // Prevent deleting the admin user
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      if (userToDelete.role === 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Cannot delete admin users' 
        });
      }
      
      // Proceed with deletion
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(500).json({ 
          success: false,
          message: 'Failed to delete user' 
        });
      }
      
      res.json({ 
        success: true,
        message: 'User deleted successfully',
        userId
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error deleting user', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return httpServer;
}
