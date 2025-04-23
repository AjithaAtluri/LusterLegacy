import {
  User,
  InsertUser,
  Product,
  InsertProduct,
  DesignRequest,
  InsertDesignRequest,
  CartItem,
  InsertCartItem,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  Testimonial,
  InsertTestimonial,
  ContactMessage,
  InsertContactMessage,
  users,
  products,
  designRequests,
  cartItems,
  orders,
  orderItems,
  testimonials,
  contactMessages
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, SQL } from "drizzle-orm";

// Storage interface definition
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Design Request methods
  getDesignRequest(id: number): Promise<DesignRequest | undefined>;
  getAllDesignRequests(): Promise<DesignRequest[]>;
  getDesignRequestsByEmail(email: string): Promise<DesignRequest[]>;
  createDesignRequest(designRequest: InsertDesignRequest): Promise<DesignRequest>;
  updateDesignRequest(id: number, designRequest: Partial<DesignRequest>): Promise<DesignRequest | undefined>;

  // Cart methods
  getCartItem(id: number): Promise<CartItem | undefined>;
  getCartItemsBySession(sessionId: string): Promise<CartItem[]>;
  getCartItemsByUser(userId: number): Promise<CartItem[]>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, cartItem: Partial<CartItem>): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;

  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getOrdersBySession(sessionId: string): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined>;

  // Order Item methods
  getOrderItemsByOrder(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Testimonial methods
  getAllTestimonials(): Promise<Testimonial[]>;
  getApprovedTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<Testimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<boolean>;

  // Contact Message methods
  getAllContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  markContactMessageAsRead(id: number): Promise<boolean>;
  deleteContactMessage(id: number): Promise<boolean>;
  
  // Metal Type methods
  getMetalType(id: number): Promise<MetalType | undefined>;
  getAllMetalTypes(): Promise<MetalType[]>;
  createMetalType(metalType: InsertMetalType): Promise<MetalType>;
  updateMetalType(id: number, metalType: Partial<InsertMetalType>): Promise<MetalType | undefined>;
  deleteMetalType(id: number): Promise<boolean>;
  
  // Stone Type methods
  getStoneType(id: number): Promise<StoneType | undefined>;
  getAllStoneTypes(): Promise<StoneType[]>;
  createStoneType(stoneType: InsertStoneType): Promise<StoneType>;
  updateStoneType(id: number, stoneType: Partial<InsertStoneType>): Promise<StoneType | undefined>;
  deleteStoneType(id: number): Promise<boolean>;
  
  // Product-Stone methods
  getProductStones(productId: number): Promise<StoneType[]>;
  addProductStones(productId: number, stoneTypeIds: number[]): Promise<void>;
  updateProductStones(productId: number, stoneTypeIds: number[]): Promise<void>;
  removeProductStone(productId: number, stoneTypeId: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private designRequests: Map<number, DesignRequest>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private testimonials: Map<number, Testimonial>;
  private contactMessages: Map<number, ContactMessage>;
  
  private currentUserId: number;
  private currentProductId: number;
  private currentDesignRequestId: number;
  private currentCartItemId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentTestimonialId: number;
  private currentContactMessageId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.designRequests = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.testimonials = new Map();
    this.contactMessages = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentDesignRequestId = 1;
    this.currentCartItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentTestimonialId = 1;
    this.currentContactMessageId = 1;
    
    // Initialize with sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isFeatured
    );
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category === category
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const createdAt = new Date();
    const product: Product = { ...insertProduct, id, createdAt };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Design Request methods
  async getDesignRequest(id: number): Promise<DesignRequest | undefined> {
    return this.designRequests.get(id);
  }

  async getAllDesignRequests(): Promise<DesignRequest[]> {
    return Array.from(this.designRequests.values());
  }

  async getDesignRequestsByEmail(email: string): Promise<DesignRequest[]> {
    return Array.from(this.designRequests.values()).filter(
      (request) => request.email === email
    );
  }

  async createDesignRequest(insertDesignRequest: InsertDesignRequest): Promise<DesignRequest> {
    const id = this.currentDesignRequestId++;
    const createdAt = new Date();
    const status = "pending";
    const designRequest: DesignRequest = { 
      ...insertDesignRequest, 
      id, 
      status, 
      estimatedPrice: null, 
      cadImageUrl: null, 
      createdAt 
    };
    this.designRequests.set(id, designRequest);
    return designRequest;
  }

  async updateDesignRequest(id: number, designRequestUpdate: Partial<DesignRequest>): Promise<DesignRequest | undefined> {
    const designRequest = this.designRequests.get(id);
    if (!designRequest) return undefined;
    
    const updatedDesignRequest = { ...designRequest, ...designRequestUpdate };
    this.designRequests.set(id, updatedDesignRequest);
    return updatedDesignRequest;
  }

  // Cart methods
  async getCartItem(id: number): Promise<CartItem | undefined> {
    return this.cartItems.get(id);
  }

  async getCartItemsBySession(sessionId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.sessionId === sessionId
    );
  }

  async getCartItemsByUser(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
  }

  async createCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = this.currentCartItemId++;
    const createdAt = new Date();
    const cartItem: CartItem = { ...insertCartItem, id, createdAt };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, cartItemUpdate: Partial<CartItem>): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedCartItem = { ...cartItem, ...cartItemUpdate };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async deleteCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<boolean> {
    const cartItemIds = Array.from(this.cartItems.values())
      .filter((item) => item.sessionId === sessionId)
      .map((item) => item.id);
    
    cartItemIds.forEach((id) => this.cartItems.delete(id));
    return true;
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersBySession(sessionId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.sessionId === sessionId
    );
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const createdAt = new Date();
    const paymentStatus = "advance_paid";
    const orderStatus = "processing";
    
    const order: Order = { 
      ...insertOrder, 
      id, 
      paymentStatus, 
      orderStatus, 
      createdAt 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, orderUpdate: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...orderUpdate };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order Item methods
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Testimonial methods
  async getAllTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }

  async getApprovedTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values()).filter(
      (testimonial) => testimonial.isApproved
    );
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.currentTestimonialId++;
    const testimonial: Testimonial = { ...insertTestimonial, id };
    this.testimonials.set(id, testimonial);
    return testimonial;
  }

  async updateTestimonial(id: number, testimonialUpdate: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const testimonial = this.testimonials.get(id);
    if (!testimonial) return undefined;
    
    const updatedTestimonial = { ...testimonial, ...testimonialUpdate };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    return this.testimonials.delete(id);
  }

  // Contact Message methods
  async getAllContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values());
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = this.currentContactMessageId++;
    const createdAt = new Date();
    const isRead = false;
    const message: ContactMessage = { ...insertMessage, id, isRead, createdAt };
    this.contactMessages.set(id, message);
    return message;
  }

  async markContactMessageAsRead(id: number): Promise<boolean> {
    const message = this.contactMessages.get(id);
    if (!message) return false;
    
    const updatedMessage = { ...message, isRead: true };
    this.contactMessages.set(id, updatedMessage);
    return true;
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    return this.contactMessages.delete(id);
  }

  // Initialize sample data
  private initSampleData() {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      role: "admin"
    };
    this.createUser(adminUser);

    // Create featured products
    const products: InsertProduct[] = [
      {
        name: "Royal Elegance Necklace",
        description: "Handcrafted polki diamonds set in pure gold with pearl accents.",
        basePrice: 175000,
        imageUrl: "https://images.unsplash.com/photo-1605100804567-1efa885e640d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        additionalImages: [],
        details: "Exquisitely crafted necklace featuring traditional Polki diamond work. Each diamond is hand-cut and set in 22kt gold, creating a timeless piece with unparalleled brilliance.",
        dimensions: "Length: 18 inches, Weight: 45 grams approximately",
        isNew: true,
        isBestseller: false,
        isFeatured: true,
        category: "necklace"
      },
      {
        name: "Ethereal Embrace Earrings",
        description: "Cascading design with emerald accents and traditional craftsmanship.",
        basePrice: 125000,
        imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        additionalImages: [],
        details: "These statement earrings feature multiple tiers of diamond-encrusted gold work with emerald drops. Each piece is articulated to move gracefully with the wearer.",
        dimensions: "Length: 2.75 inches, Width: 1.25 inches",
        isNew: false,
        isBestseller: false,
        isFeatured: true,
        category: "earrings"
      },
      {
        name: "Regal Radiance Ring",
        description: "Center ruby surrounded by intricate diamond patterning.",
        basePrice: 95000,
        imageUrl: "https://images.unsplash.com/photo-1608042314453-ae338d80c427?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        additionalImages: [],
        details: "This statement ring features a brilliant-cut natural ruby of approximately 2 carats, surrounded by a halo of natural diamonds in an intricate gold setting.",
        dimensions: "Center stone: 8mm x 6mm, Band width: 4mm",
        isNew: false,
        isBestseller: true,
        isFeatured: true,
        category: "ring"
      }
    ];

    products.forEach(product => this.createProduct(product));

    // Create testimonials
    const testimonials: InsertTestimonial[] = [
      {
        name: "Priya Sharma",
        productType: "Custom Necklace",
        rating: 5,
        text: "The custom necklace I received exceeded all my expectations. The artisanship is extraordinary, and the stones catch light beautifully. A true heirloom piece.",
        initials: "PS",
        isApproved: true
      },
      {
        name: "Arjun & Meera Kapoor",
        productType: "Wedding Collection",
        rating: 5,
        text: "Working with Luster Legacy for our wedding rings was a dream. They perfectly captured our vision and made the entire process stress-free. The rings are stunning.",
        initials: "AK",
        isApproved: true
      },
      {
        name: "Nisha Patel",
        productType: "Heritage Bracelet",
        rating: 5,
        text: "I inherited a design from my grandmother and wanted to recreate it with modern elements. The team at Luster Legacy honored the original while making it uniquely mine.",
        initials: "NP",
        isApproved: true
      }
    ];

    testimonials.forEach(testimonial => this.createTestimonial(testimonial));
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isFeatured, true)).orderBy(asc(products.name));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category)).orderBy(asc(products.name));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Design Request methods
  async getDesignRequest(id: number): Promise<DesignRequest | undefined> {
    const [request] = await db.select().from(designRequests).where(eq(designRequests.id, id));
    return request || undefined;
  }

  async getAllDesignRequests(): Promise<DesignRequest[]> {
    return await db.select().from(designRequests).orderBy(desc(designRequests.createdAt));
  }

  async getDesignRequestsByEmail(email: string): Promise<DesignRequest[]> {
    return await db.select().from(designRequests).where(eq(designRequests.email, email));
  }

  async createDesignRequest(insertDesignRequest: InsertDesignRequest): Promise<DesignRequest> {
    const [request] = await db.insert(designRequests).values(insertDesignRequest).returning();
    return request;
  }

  async updateDesignRequest(id: number, designRequestUpdate: Partial<DesignRequest>): Promise<DesignRequest | undefined> {
    const [request] = await db.update(designRequests)
      .set(designRequestUpdate)
      .where(eq(designRequests.id, id))
      .returning();
    return request || undefined;
  }

  // Cart methods
  async getCartItem(id: number): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return item || undefined;
  }

  async getCartItemsBySession(sessionId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async getCartItemsByUser(userId: number): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async createCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    const [item] = await db.insert(cartItems).values(insertCartItem).returning();
    return item;
  }

  async updateCartItem(id: number, cartItemUpdate: Partial<CartItem>): Promise<CartItem | undefined> {
    const [item] = await db.update(cartItems)
      .set(cartItemUpdate)
      .where(eq(cartItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(sessionId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    return true;
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersBySession(sessionId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.sessionId, sessionId));
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, orderUpdate: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(orderUpdate)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Order Item methods
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertOrderItem).returning();
    return item;
  }

  // Testimonial methods
  async getAllTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials);
  }

  async getApprovedTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials).where(eq(testimonials.isApproved, true));
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db.insert(testimonials).values(insertTestimonial).returning();
    return testimonial;
  }

  async updateTestimonial(id: number, testimonialUpdate: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const [testimonial] = await db.update(testimonials)
      .set(testimonialUpdate)
      .where(eq(testimonials.id, id))
      .returning();
    return testimonial || undefined;
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    const result = await db.delete(testimonials).where(eq(testimonials.id, id));
    return result.rowCount > 0;
  }

  // Contact Message methods
  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db.insert(contactMessages).values({
      ...insertMessage,
      isRead: false
    }).returning();
    return message;
  }

  async markContactMessageAsRead(id: number): Promise<boolean> {
    const result = await db.update(contactMessages)
      .set({ isRead: true })
      .where(eq(contactMessages.id, id));
    return result.rowCount > 0;
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    const result = await db.delete(contactMessages).where(eq(contactMessages.id, id));
    return result.rowCount > 0;
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();
