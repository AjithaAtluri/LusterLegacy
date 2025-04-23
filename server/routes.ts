import type { Express, Request, Response } from "express";
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
  insertInspirationGallerySchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { validateAdmin } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { paypalClientId, createOrder, captureOrder, cancelOrder } from "./paypal";

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

  /**
   * Session management - basic approach using session IDs in cookies
   * In a real production app, you'd use express-session with a proper session store
   */
  app.use((req: Request, res: Response, next) => {
    if (!req.cookies || !req.cookies.sessionId) {
      const sessionId = uuidv4();
      res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      req.sessionId = sessionId;
    } else {
      req.sessionId = req.cookies.sessionId;
    }
    next();
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
      const cartItems = await storage.getCartItemsBySession(sessionId);

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

      const cartItemData = insertCartItemSchema.parse({
        sessionId,
        userId,
        productId,
        metalTypeId,
        stoneTypeId,
        price
      });

      const cartItem = await storage.createCartItem(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Process main image
      const mainImageUrl = files.mainImage ? `/uploads/${files.mainImage[0].filename}` : null;
      
      // Process additional images
      let additionalImages: string[] = [];
      if (files.additionalImages) {
        additionalImages = files.additionalImages.map(file => `/uploads/${file.filename}`);
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
      
      // First create the product
      const product = await storage.createProduct({
        ...req.body,
        imageUrl: mainImageUrl,
        additionalImages: additionalImages
      });
      
      // Then associate stone types with the product
      if (stoneTypeIds.length > 0) {
        await storage.addProductStones(product.id, stoneTypeIds);
      }
      
      res.status(201).json({
        ...product,
        stoneTypes: stoneTypeIds.length > 0 ? await storage.getProductStones(product.id) : []
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  app.put('/api/admin/products/:id', validateAdmin, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let updateData = { ...req.body };
      
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

  return httpServer;
}
