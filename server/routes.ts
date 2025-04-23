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
  insertUserSchema
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
