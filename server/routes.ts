import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as z from "zod";
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
  insertProductTypeSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { validateAdmin } from "./utils";
import { calculateJewelryPrice } from "./utils/price-calculator";
import { v4 as uuidv4 } from "uuid";
import { paypalClientId, createOrder, captureOrder, cancelOrder } from "./paypal";
import { generateContent } from "./ai-service";
import { generateJewelryContent } from "./openai-content-generator";
import { analyzeJewelryImage } from "./direct-vision-api";
import { generateProductContent } from "./generate-product-content";

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_disk = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueFilename = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueFilename);
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
  // Create HTTP server
  const httpServer = createServer(app);

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
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

  /**
   * Product routes
   */
  // Get all products
  app.get('/api/products', async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  });

  // Get featured products
  app.get('/api/products/featured', async (_req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
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
      res.json(products);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({ message: 'Error fetching products by category' });
    }
  });

  // Get product by ID
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

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product' });
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

  // Update a product (admin only)
  app.put('/api/products/:id', validateAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const productData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(productId, productData);

      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product' });
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
  app.post('/api/custom-design', upload.single('designImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded' });
      }

      const designData = JSON.parse(req.body.data);
      const validatedData = insertDesignRequestSchema.parse({
        ...designData,
        imageUrl: `/uploads/${req.file.filename}`
      });

      const designRequest = await storage.createDesignRequest(validatedData);
      res.status(201).json(designRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid design request data', errors: error.errors });
      }
      console.error('Error submitting design request:', error);
      res.status(500).json({ message: 'Error submitting design request' });
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

  // Get design request by ID (admin or matching email)
  app.get('/api/custom-designs/:id', async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      if (isNaN(designId)) {
        return res.status(400).json({ message: 'Invalid design request ID' });
      }

      const designRequest = await storage.getDesignRequest(designId);
      if (!designRequest) {
        return res.status(404).json({ message: 'Design request not found' });
      }

      // Check if user is admin or if the request matches their email
      const isAdmin = req.user?.role === 'admin';
      const isOwner = req.body.email === designRequest.email;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Unauthorized access to design request' });
      }

      res.json(designRequest);
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

  /**
   * Cart routes
   */
  // Get cart items for current session
  app.get('/api/cart', async (req, res) => {
    try {
      const sessionId = req.sessionId;
      
      // Debug logging
      console.log('GET /api/cart - Session ID:', sessionId);
      console.log('GET /api/cart - Cookies:', req.cookies);
      
      const cartItems = await storage.getCartItemsBySession(sessionId);
      
      // Debug logging
      console.log(`GET /api/cart - Found ${cartItems.length} items for session ${sessionId}`);
      
      // For each cart item, fetch the corresponding product
      const itemsWithDetails = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );

      // Calculate total
      const total = itemsWithDetails.reduce((sum, item) => sum + item.price, 0);

      res.json({
        items: itemsWithDetails,
        total
      });
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
      const sessionId = req.sessionId;
      await storage.clearCart(sessionId);
      res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ message: 'Error clearing cart' });
    }
  });

  /**
   * Order routes
   */
  // Create a new order
  app.post('/api/orders', async (req, res) => {
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

  // Get orders for current session
  app.get('/api/orders', async (req, res) => {
    try {
      const sessionId = req.sessionId;
      const orders = await storage.getOrdersBySession(sessionId);

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
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders' });
    }
  });

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
   * Testimonial routes
   */
  // Get approved testimonials
  app.get('/api/testimonials', async (_req, res) => {
    try {
      const testimonials = await storage.getApprovedTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ message: 'Error fetching testimonials' });
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

  // Update testimonial approval status (admin only)
  app.put('/api/admin/testimonials/:id', validateAdmin, async (req, res) => {
    try {
      const testimonialId = parseInt(req.params.id);
      if (isNaN(testimonialId)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }

      const { isApproved } = req.body;
      const updatedTestimonial = await storage.updateTestimonial(testimonialId, { isApproved });

      if (!updatedTestimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }

      res.json(updatedTestimonial);
    } catch (error) {
      console.error('Error updating testimonial:', error);
      res.status(500).json({ message: 'Error updating testimonial' });
    }
  });

  /**
   * Contact routes
   */
  // Submit contact message
  app.post('/api/contact', async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  /**
   * Authentication routes
   */
  // Admin login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // In a real app, we would use JWT or similar
      // For simplicity, we'll just store the user ID in the session
      res.cookie('userId', user.id, { 
        httpOnly: true, 
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      res.json({
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('userId');
    res.json({ message: 'Logged out successfully' });
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
   * Admin API endpoints for Jewelry Management
   */
  
  // Metal Types Management - See complete implementation below

  // Stone Types Management
  app.get('/api/admin/stone-types', validateAdmin, async (req, res) => {
    try {
      const stoneTypes = await storage.getAllStoneTypes();
      res.json(stoneTypes);
    } catch (error) {
      console.error('Error fetching stone types:', error);
      res.status(500).json({ message: 'Failed to fetch stone types' });
    }
  });

  app.post('/api/admin/stone-types', validateAdmin, upload.single('image'), async (req, res) => {
    try {
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const stoneType = await storage.createStoneType({
        ...req.body,
        imageUrl
      });
      res.status(201).json(stoneType);
    } catch (error) {
      console.error('Error creating stone type:', error);
      res.status(500).json({ message: 'Failed to create stone type' });
    }
  });

  app.put('/api/admin/stone-types/:id', validateAdmin, upload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let updateData = { ...req.body };
      
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
        
        // Delete old image if it exists
        const stoneType = await storage.getStoneType(id);
        if (stoneType?.imageUrl) {
          const oldImagePath = path.join(process.cwd(), stoneType.imageUrl.substring(1));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
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

  app.delete('/api/admin/stone-types/:id', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get stone type to check for image
      const stoneType = await storage.getStoneType(id);
      
      const success = await storage.deleteStoneType(id);
      if (success) {
        // Delete the image file if it exists
        if (stoneType?.imageUrl) {
          const imagePath = path.join(process.cwd(), stoneType.imageUrl.substring(1));
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Stone type not found' });
      }
    } catch (error) {
      console.error('Error deleting stone type:', error);
      res.status(500).json({ message: 'Failed to delete stone type' });
    }
  });

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
  
  // NEW: Improved AI Content Generation for Products
  app.post('/api/admin/generate-jewelry-content', validateAdmin, async (req, res) => {
    try {
      console.log("Using improved jewelry content generator");
      // Pass the request to the improved OpenAI service
      await generateJewelryContent(req, res);
    } catch (error) {
      console.error('Error generating jewelry content:', error);
      res.status(500).json({ message: 'Failed to generate content' });
    }
  });
  
  // Advanced AI product content generator with image analysis
  app.post('/api/admin/generate-product-content', validateAdmin, async (req, res) => {
    try {
      console.log("Using advanced product content generator with image analysis");
      // Pass the request to the product content generator
      await generateProductContent(req, res);
    } catch (error) {
      console.error('Error generating product content:', error);
      res.status(500).json({ message: 'Failed to generate product content' });
    }
  });
  
  // Test endpoint to directly generate content (non-admin, for testing only)
  app.post('/api/test-content-generation', async (req, res) => {
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
  
  // Direct jewelry image analysis endpoint - simplified approach with no authentication
  app.post("/api/direct-jewelry-analysis", async (req, res) => {
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
  
  // Jewelry price calculator endpoint - uses 2025 market rates
  app.post("/api/calculate-price", async (req, res) => {
    try {
      console.log("Price calculator endpoint called");
      
      // Check if we have the required fields before proceeding
      const { productType, metalType, metalWeight = 5, primaryGems = [] } = req.body;
      
      if (!productType || !metalType) {
        return res.status(400).json({
          success: false,
          message: "Missing required product details (productType and metalType)"
        });
      }
      
      // Use the centralized price calculator utility
      const { priceUSD, priceINR } = calculateJewelryPrice({
        productType,
        metalType,
        metalWeight,
        primaryGems
      });
      
      return res.status(200).json({
        success: true,
        priceUSD,
        priceINR,
        productType,
        metalType,
        metalWeight,
        primaryGems
      });
    } catch (error) {
      console.error("Error in price calculator endpoint:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error in price calculation"
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
  app.get('/api/admin/product-types', async (req, res) => {
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
  
  // Get metal types for admin
  app.get('/api/admin/metal-types', async (req, res) => {
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
  
  // Get stone types for admin
  app.get('/api/admin/stone-types', async (req, res) => {
    try {
      const stoneTypes = await storage.getAllStoneTypes();
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
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.get('/api/admin/products/:id', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (product) {
        // Get the associated stone types for the product
        const productStones = await storage.getProductStones(id);
        
        res.json({
          ...product,
          stoneTypes: productStones
        });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  });

  app.post('/api/admin/products', validateAdmin, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 5 }
  ]), async (req, res) => {
    try {
      console.log('Received product creation request:', req.body);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Process main image
      const mainImageUrl = files.mainImage ? `/uploads/${files.mainImage[0].filename}` : null;
      console.log('Main image URL:', mainImageUrl);
      
      // Process additional images
      let additionalImages: string[] = [];
      if (files.additionalImages) {
        additionalImages = files.additionalImages.map(file => `/uploads/${file.filename}`);
        console.log('Additional images:', additionalImages);
      }

      // Parse stone types from request body
      let stoneTypes: string[] = [];
      if (req.body.stoneTypes) {
        try {
          stoneTypes = JSON.parse(req.body.stoneTypes);
          console.log('Parsed stone types:', stoneTypes);
        } catch (e) {
          console.error('Error parsing stoneTypes:', e);
          stoneTypes = [];
        }
      }
      
      // Extract numeric values
      const basePrice = parseFloat(req.body.basePrice) || 0;
      const basePriceINR = parseFloat(req.body.basePriceINR) || 0;
      const metalWeight = parseFloat(req.body.metalWeight) || 0;
      
      // Convert boolean values
      const isNew = req.body.isNew === 'true';
      const isBestseller = req.body.isBestseller === 'true';
      const isFeatured = req.body.isFeatured === 'true';
      
      // Prepare product data - map form fields to schema fields
      const productData = {
        name: req.body.title, // Map title to name field
        description: req.body.description || '',
        basePrice: basePrice,
        imageUrl: mainImageUrl || '',
        additionalImages: additionalImages,
        details: req.body.detailedDescription || '', // Map detailedDescription to details
        category: req.body.category, // Keep for backward compatibility
        productTypeId: req.body.productTypeId ? parseInt(req.body.productTypeId) : null, // New field for proper product type relation
        isNew: isNew,
        isBestseller: isBestseller,
        isFeatured: isFeatured
      };
      
      // Store additional data in the details field as JSON
      const additionalData = {
        tagline: req.body.tagline,
        basePriceINR: basePriceINR,
        metalType: req.body.metalType,
        metalWeight: metalWeight,
        stoneTypes: stoneTypes
      };
      
      // Add the additional data to the details field
      productData.details = JSON.stringify({
        detailedDescription: req.body.detailedDescription || '',
        additionalData
      });
      
      console.log('Creating product with data:', productData);
      
      // Create the product
      const product = await storage.createProduct(productData);
      console.log('Product created:', product);
      
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product', error: String(error) });
    }
  });

  app.put('/api/admin/products/:id', validateAdmin, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Create an updated data object from request body
      let updateData = { ...req.body };
      
      // Handle productTypeId parsing to integer if present
      if (updateData.productTypeId) {
        updateData.productTypeId = parseInt(updateData.productTypeId);
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
      
      // Handle additional images update
      if (files.additionalImages && files.additionalImages.length > 0) {
        const newAdditionalImages = files.additionalImages.map(file => `/uploads/${file.filename}`);
        
        // Delete existing additional images if 'replaceExistingImages' is true
        if (req.body.replaceExistingImages === 'true' && existingProduct.additionalImages) {
          existingProduct.additionalImages.forEach(imgUrl => {
            const imgPath = path.join(process.cwd(), imgUrl.substring(1));
            if (fs.existsSync(imgPath)) {
              fs.unlinkSync(imgPath);
            }
          });
          updateData.additionalImages = newAdditionalImages;
        } else {
          // Append new images to existing ones
          updateData.additionalImages = [...(existingProduct.additionalImages || []), ...newAdditionalImages];
        }
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
      
      // Update the product
      const updatedProduct = await storage.updateProduct(id, updateData);
      
      // Update product stone associations
      if (stoneTypeIds.length > 0 || req.body.updateStoneTypes === 'true') {
        await storage.updateProductStones(id, stoneTypeIds);
      }
      
      // Get the updated product with stone types
      const productWithStones = {
        ...updatedProduct,
        stoneTypes: await storage.getProductStones(id)
      };
      
      res.json(productWithStones);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
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
  app.get('/api/admin/metal-types', async (_req, res) => {
    try {
      const metalTypes = await storage.getAllMetalTypes();
      res.json(metalTypes);
    } catch (error) {
      console.error('Error fetching metal types:', error);
      res.status(500).json({ message: 'Failed to fetch metal types' });
    }
  });

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
  app.post('/api/admin/metal-types', validateAdmin, async (req, res) => {
    try {
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
  app.put('/api/admin/metal-types/:id', validateAdmin, async (req, res) => {
    try {
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
  // Get all stone types
  app.get('/api/admin/stone-types', async (_req, res) => {
    try {
      const stoneTypes = await storage.getAllStoneTypes();
      res.json(stoneTypes);
    } catch (error) {
      console.error('Error fetching stone types:', error);
      res.status(500).json({ message: 'Failed to fetch stone types' });
    }
  });

  // Get stone type by ID
  app.get('/api/admin/stone-types/:id', async (req, res) => {
    try {
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
  app.post('/api/admin/stone-types', validateAdmin, upload.single('image'), async (req, res) => {
    try {
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
  app.put('/api/admin/stone-types/:id', validateAdmin, upload.single('image'), async (req, res) => {
    try {
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
  app.delete('/api/admin/stone-types/:id', validateAdmin, async (req, res) => {
    try {
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
  app.get('/api/admin/products/:id/stones', validateAdmin, async (req, res) => {
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
  app.post('/api/admin/products/:id/stones', validateAdmin, async (req, res) => {
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
  app.post('/api/admin/inspiration', validateAdmin, async (req, res) => {
    try {
      const validatedData = insertInspirationGallerySchema.parse(req.body);
      const newItem = await storage.createInspirationItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating inspiration gallery item:', error);
      res.status(500).json({ message: 'Failed to create inspiration gallery item' });
    }
  });

  // Admin: Update inspiration gallery item
  app.put('/api/admin/inspiration/:id', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const updatedItem = await storage.updateInspirationItem(id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Inspiration gallery item not found' });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating inspiration gallery item:', error);
      res.status(500).json({ message: 'Failed to update inspiration gallery item' });
    }
  });

  // Admin: Delete inspiration gallery item
  app.delete('/api/admin/inspiration/:id', validateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }

      const success = await storage.deleteInspirationItem(id);
      if (!success) {
        return res.status(404).json({ message: 'Inspiration gallery item not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting inspiration gallery item:', error);
      res.status(500).json({ message: 'Failed to delete inspiration gallery item' });
    }
  });

  // Get current user
  app.get('/api/auth/me', async (req, res) => {
    try {
      const userId = req.cookies?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        res.clearCookie('userId');
        return res.status(401).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ message: 'Error fetching current user' });
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

  return httpServer;
}
