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
  MetalType,
  InsertMetalType,
  StoneType,
  InsertStoneType,
  ProductStone,
  InspirationGalleryItem,
  InsertInspirationGalleryItem,
  ProductType,
  InsertProductType,
  DesignRequestComment,
  InsertDesignRequestComment,
  DesignFeedback,
  InsertDesignFeedback,
  DesignPayment,
  InsertDesignPayment,
  CustomizationRequest,
  InsertCustomizationRequest,
  CustomizationRequestComment,
  InsertCustomizationRequestComment,
  QuoteRequest,
  InsertQuoteRequest,
  QuoteRequestComment,
  InsertQuoteRequestComment,
  users,
  products,
  designRequests,
  designRequestComments,
  designFeedback,
  designPayments,
  customizationRequests,
  customizationRequestComments,
  quoteRequests,
  quoteRequestComments,
  cartItems,
  orders,
  orderItems,
  testimonials,
  contactMessages,
  metalTypes,
  stoneTypes,
  productStones,
  inspirationGallery,
  productTypes
} from "@shared/schema";
import { db } from "./db";
import { sql, and, eq, ne, isNotNull, desc, asc, SQL } from "drizzle-orm";

// Storage interface definition
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store for authentication
  sessionStore: any; // Using any to avoid type issues with express-session
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Customization request methods
  createCustomizationRequest(request: any): Promise<any>;
  getCustomizationRequestsByUserId(userId: number): Promise<any[]>;
  getAllCustomizationRequests(): Promise<any[]>;
  updateCustomizationRequestStatus(id: number, status: string): Promise<any>;
  
  // Order methods
  getOrdersByUserId(userId: number): Promise<any[]>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProductById(id: number): Promise<Product | undefined>; // Alias for getProduct
  getAllProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductAiInputs(id: number, aiInputs: any): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Design Request methods
  getDesignRequest(id: number): Promise<DesignRequest | undefined>;
  getAllDesignRequests(): Promise<DesignRequest[]>;
  getDesignRequestsByEmail(email: string): Promise<DesignRequest[]>;
  getDesignRequestsByUserId(userId: number): Promise<DesignRequest[]>;
  createDesignRequest(designRequest: InsertDesignRequest): Promise<DesignRequest>;
  updateDesignRequest(id: number, designRequest: Partial<DesignRequest>): Promise<DesignRequest | undefined>;
  
  // Design Request Comment methods
  getDesignRequestComments(designRequestId: number): Promise<DesignRequestComment[]>;
  addDesignRequestComment(comment: InsertDesignRequestComment): Promise<DesignRequestComment>;
  
  // Design Feedback methods (new chat functionality)
  getDesignFeedback(designRequestId: number): Promise<DesignFeedback[]>;
  addDesignFeedback(feedback: InsertDesignFeedback): Promise<DesignFeedback>;
  
  // Design Payment methods
  getDesignPayments(designRequestId: number): Promise<DesignPayment[]>;
  addDesignPayment(payment: InsertDesignPayment): Promise<DesignPayment>;
  updateDesignPaymentStatus(id: number, status: string): Promise<DesignPayment | undefined>;
  
  // Product Customization Request methods
  getCustomizationRequest(id: number): Promise<CustomizationRequest | undefined>;
  getAllCustomizationRequests(): Promise<CustomizationRequest[]>;
  getCustomizationRequestsByEmail(email: string): Promise<CustomizationRequest[]>;
  getCustomizationRequestsByUserId(userId: number): Promise<CustomizationRequest[]>;
  createCustomizationRequest(request: InsertCustomizationRequest): Promise<CustomizationRequest>;
  updateCustomizationRequest(id: number, request: Partial<CustomizationRequest>): Promise<CustomizationRequest | undefined>;
  
  // Customization Request Comment methods
  getCustomizationRequestComments(requestId: number): Promise<CustomizationRequestComment[]>;
  addCustomizationRequestComment(comment: InsertCustomizationRequestComment): Promise<CustomizationRequestComment>;
  
  // Quote Request methods
  getQuoteRequest(id: number): Promise<QuoteRequest | undefined>;
  getAllQuoteRequests(): Promise<QuoteRequest[]>;
  getQuoteRequestsByEmail(email: string): Promise<QuoteRequest[]>;
  getQuoteRequestsByUserId(userId: number): Promise<QuoteRequest[]>;
  createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest>;
  updateQuoteRequest(id: number, request: Partial<QuoteRequest>): Promise<QuoteRequest | undefined>;
  
  // Quote Request Comment methods
  getQuoteRequestComments(requestId: number): Promise<QuoteRequestComment[]>;
  addQuoteRequestComment(comment: InsertQuoteRequestComment): Promise<QuoteRequestComment>;

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
  
  // Inspiration Gallery methods
  getInspirationItem(id: number): Promise<InspirationGalleryItem | undefined>;
  getAllInspirationItems(): Promise<InspirationGalleryItem[]>;
  getFeaturedInspirationItems(): Promise<InspirationGalleryItem[]>;
  getInspirationItemsByCategory(category: string): Promise<InspirationGalleryItem[]>;
  createInspirationItem(item: InsertInspirationGalleryItem): Promise<InspirationGalleryItem>;
  updateInspirationItem(id: number, item: Partial<InspirationGalleryItem>): Promise<InspirationGalleryItem | undefined>;
  deleteInspirationItem(id: number): Promise<boolean>;
  
  // Product Type methods
  getProductType(id: number): Promise<ProductType | undefined>;
  getAllProductTypes(): Promise<ProductType[]>;
  getActiveProductTypes(): Promise<ProductType[]>;
  createProductType(productType: InsertProductType): Promise<ProductType>;
  updateProductType(id: number, productType: Partial<InsertProductType>): Promise<ProductType | undefined>;
  deleteProductType(id: number): Promise<boolean>;
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
  private metalTypes: Map<number, MetalType>;
  private stoneTypes: Map<number, StoneType>;
  private productStones: Map<string, ProductStone>; // Key is "productId-stoneTypeId"
  private inspirationItems: Map<number, InspirationGalleryItem>;
  private customizationRequests: Map<number, any>; // Customization requests
  
  private currentUserId: number;
  private currentProductId: number;
  private currentDesignRequestId: number;
  private currentCartItemId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentTestimonialId: number;
  private currentContactMessageId: number;
  private currentMetalTypeId: number;
  private currentStoneTypeId: number;
  private currentInspirationItemId: number;
  private currentProductTypeId: number;
  private currentCustomizationRequestId: number;
  private productTypes: Map<number, ProductType>;
  
  // Session store for authentication
  public sessionStore: any; // Using any to avoid type issues with express-session

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.designRequests = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.testimonials = new Map();
    this.contactMessages = new Map();
    this.metalTypes = new Map();
    this.stoneTypes = new Map();
    this.productStones = new Map();
    this.inspirationItems = new Map();
    this.productTypes = new Map();
    this.customizationRequests = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentDesignRequestId = 1;
    this.currentCartItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentTestimonialId = 1;
    this.currentContactMessageId = 1;
    this.currentMetalTypeId = 1;
    this.currentStoneTypeId = 1;
    this.currentInspirationItemId = 1;
    this.currentProductTypeId = 1;
    this.currentCustomizationRequestId = 1;
    
    // Initialize session store for authentication
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
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
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    // Alias for getProduct
    return this.getProduct(id);
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

  async updateProductAiInputs(id: number, aiInputs: any): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, aiInputs };
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
  
  // Metal Type methods
  async getMetalType(id: number): Promise<MetalType | undefined> {
    return this.metalTypes.get(id);
  }
  
  async getAllMetalTypes(): Promise<MetalType[]> {
    return Array.from(this.metalTypes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async createMetalType(metalType: InsertMetalType): Promise<MetalType> {
    const id = this.currentMetalTypeId++;
    const newMetalType: MetalType = { ...metalType, id };
    this.metalTypes.set(id, newMetalType);
    return newMetalType;
  }
  
  async updateMetalType(id: number, metalTypeUpdate: Partial<InsertMetalType>): Promise<MetalType | undefined> {
    const metalType = this.metalTypes.get(id);
    if (!metalType) return undefined;
    
    const updatedMetalType = { ...metalType, ...metalTypeUpdate };
    this.metalTypes.set(id, updatedMetalType);
    return updatedMetalType;
  }
  
  async deleteMetalType(id: number): Promise<boolean> {
    return this.metalTypes.delete(id);
  }
  
  // Stone Type methods
  async getStoneType(id: number): Promise<StoneType | undefined> {
    return this.stoneTypes.get(id);
  }
  
  async getAllStoneTypes(): Promise<StoneType[]> {
    return Array.from(this.stoneTypes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async createStoneType(stoneType: InsertStoneType): Promise<StoneType> {
    const id = this.currentStoneTypeId++;
    const newStoneType: StoneType = { ...stoneType, id };
    this.stoneTypes.set(id, newStoneType);
    return newStoneType;
  }
  
  async updateStoneType(id: number, stoneTypeUpdate: Partial<InsertStoneType>): Promise<StoneType | undefined> {
    const stoneType = this.stoneTypes.get(id);
    if (!stoneType) return undefined;
    
    const updatedStoneType = { ...stoneType, ...stoneTypeUpdate };
    this.stoneTypes.set(id, updatedStoneType);
    return updatedStoneType;
  }
  
  async deleteStoneType(id: number): Promise<boolean> {
    // First, delete any product-stone associations
    for (const [key, productStone] of this.productStones.entries()) {
      if (productStone.stoneTypeId === id) {
        this.productStones.delete(key);
      }
    }
    
    return this.stoneTypes.delete(id);
  }
  
  // Product-Stone relationship methods
  async getProductStones(productId: number): Promise<StoneType[]> {
    const stoneIds = Array.from(this.productStones.values())
      .filter(ps => ps.productId === productId)
      .map(ps => ps.stoneTypeId);
    
    return stoneIds.map(id => this.stoneTypes.get(id)).filter(Boolean) as StoneType[];
  }
  
  async addProductStones(productId: number, stoneTypeIds: number[]): Promise<void> {
    stoneTypeIds.forEach(stoneTypeId => {
      const key = `${productId}-${stoneTypeId}`;
      this.productStones.set(key, { productId, stoneTypeId });
    });
  }
  
  async updateProductStones(productId: number, stoneTypeIds: number[]): Promise<void> {
    // First, delete all existing product-stone relationships for this product
    for (const [key, productStone] of this.productStones.entries()) {
      if (productStone.productId === productId) {
        this.productStones.delete(key);
      }
    }
    
    // Then add the new relationships
    await this.addProductStones(productId, stoneTypeIds);
  }
  
  async removeProductStone(productId: number, stoneTypeId: number): Promise<boolean> {
    const key = `${productId}-${stoneTypeId}`;
    return this.productStones.delete(key);
  }

  // Customization Request methods
  async createCustomizationRequest(request: any): Promise<any> {
    const id = this.currentCustomizationRequestId++;
    const createdAt = new Date();
    const customizationRequest = { 
      ...request, 
      id, 
      createdAt,
      status: request.status || "new" 
    };
    this.customizationRequests.set(id, customizationRequest);
    return customizationRequest;
  }

  async getCustomizationRequestsByUserId(userId: number): Promise<any[]> {
    return Array.from(this.customizationRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllCustomizationRequests(): Promise<any[]> {
    return Array.from(this.customizationRequests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateCustomizationRequestStatus(id: number, status: string): Promise<any> {
    const request = this.customizationRequests.get(id);
    if (!request) return null;
    
    const updatedRequest = { ...request, status };
    this.customizationRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  // For compatibility with orders
  async getOrdersByUserId(userId: number): Promise<any[]> {
    return this.getOrdersByUser(userId);
  }

  // Inspiration Gallery methods
  async getInspirationItem(id: number): Promise<InspirationGalleryItem | undefined> {
    return this.inspirationItems.get(id);
  }

  async getAllInspirationItems(): Promise<InspirationGalleryItem[]> {
    return Array.from(this.inspirationItems.values());
  }

  async getFeaturedInspirationItems(): Promise<InspirationGalleryItem[]> {
    return Array.from(this.inspirationItems.values()).filter(
      (item) => item.featured
    );
  }

  async getInspirationItemsByCategory(category: string): Promise<InspirationGalleryItem[]> {
    return Array.from(this.inspirationItems.values()).filter(
      (item) => item.category === category
    );
  }

  async createInspirationItem(item: InsertInspirationGalleryItem): Promise<InspirationGalleryItem> {
    const id = this.currentInspirationItemId++;
    const createdAt = new Date();
    const inspirationItem: InspirationGalleryItem = { ...item, id, createdAt };
    this.inspirationItems.set(id, inspirationItem);
    return inspirationItem;
  }

  async updateInspirationItem(id: number, itemUpdate: Partial<InspirationGalleryItem>): Promise<InspirationGalleryItem | undefined> {
    const item = this.inspirationItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemUpdate };
    this.inspirationItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInspirationItem(id: number): Promise<boolean> {
    return this.inspirationItems.delete(id);
  }
  
  // Product Type methods
  async getProductType(id: number): Promise<ProductType | undefined> {
    return this.productTypes.get(id);
  }
  
  async getAllProductTypes(): Promise<ProductType[]> {
    return Array.from(this.productTypes.values()).sort((a, b) => 
      (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name)
    );
  }
  
  async getActiveProductTypes(): Promise<ProductType[]> {
    return Array.from(this.productTypes.values())
      .filter(type => type.isActive)
      .sort((a, b) => (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name));
  }
  
  async createProductType(productType: InsertProductType): Promise<ProductType> {
    const id = this.currentProductTypeId++;
    const createdAt = new Date();
    const newProductType: ProductType = { ...productType, id, createdAt };
    this.productTypes.set(id, newProductType);
    return newProductType;
  }
  
  async updateProductType(id: number, productTypeUpdate: Partial<InsertProductType>): Promise<ProductType | undefined> {
    const productType = this.productTypes.get(id);
    if (!productType) return undefined;
    
    const updatedProductType = { ...productType, ...productTypeUpdate };
    this.productTypes.set(id, updatedProductType);
    return updatedProductType;
  }
  
  async deleteProductType(id: number): Promise<boolean> {
    return this.productTypes.delete(id);
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

    // Don't automatically create product types in dev mode
    // This allows admin to create them through the UI
    // In a production environment, you might want to seed these
    
    /* Commented out to avoid seeding automatically
    const productTypes: InsertProductType[] = [
      {
        name: "Rings",
        description: "Elegant rings for all occasions",
        displayOrder: 10,
        isActive: true,
        icon: "ring",
        color: "#FFD700" // Gold color
      },
      {
        name: "Necklaces",
        description: "Beautiful necklaces for everyday wear and special occasions",
        displayOrder: 20,
        isActive: true,
        icon: "gem",
        color: "#8A2BE2" // Deep purple
      },
      {
        name: "Bracelets",
        description: "Stylish bracelets to complement any outfit",
        displayOrder: 30,
        isActive: true,
        icon: "circle",
        color: "#20B2AA" // Light sea green
      },
      {
        name: "Earrings",
        description: "Stunning earrings for a perfect finishing touch",
        displayOrder: 40,
        isActive: true,
        icon: "diamond",
        color: "#FF6347" // Tomato red
      },
      {
        name: "Pendants",
        description: "Exquisite pendants to showcase your style",
        displayOrder: 50,
        isActive: true,
        icon: "heart",
        color: "#4169E1" // Royal blue
      }
    ];

    productTypes.forEach(productType => this.createProductType(productType));
    */
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  public sessionStore: any; // Using any to avoid type issues with express-session
  
  constructor() {
    // Initialize with PostgresSessionStore
    // Using the already imported pool from db.ts
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
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
  
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
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
    const [updatedProduct] = await db
      .update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    // Alias for getProduct
    return this.getProduct(id);
  }
  
  async updateProductAiInputs(id: number, aiInputs: any): Promise<Product | undefined> {
    console.log("Updating AI inputs for product:", id, aiInputs);
    const [updatedProduct] = await db
      .update(products)
      .set({ aiInputs })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result;
  }

// These methods are already defined above

  // Design Request methods
  async getDesignRequest(id: number): Promise<DesignRequest | undefined> {
    try {
      const [request] = await db.select().from(designRequests).where(eq(designRequests.id, id));
      return request || undefined;
    } catch (error) {
      console.error("Error getting design request:", error);
      return undefined;
    }
  }

  async getAllDesignRequests(): Promise<DesignRequest[]> {
    try {
      return await db.select().from(designRequests).orderBy(desc(designRequests.createdAt));
    } catch (error) {
      console.error("Error getting all design requests:", error);
      return [];
    }
  }

  async getDesignRequestsByEmail(email: string): Promise<DesignRequest[]> {
    try {
      return await db.select().from(designRequests).where(eq(designRequests.email, email));
    } catch (error) {
      console.error("Error getting design requests by email:", error);
      return [];
    }
  }
  
  async getDesignRequestsByUserId(userId: number): Promise<DesignRequest[]> {
    try {
      const requests = await db
        .select()
        .from(designRequests)
        .where(eq(designRequests.userId, userId))
        .orderBy(desc(designRequests.createdAt));
      return requests;
    } catch (error) {
      console.error("Error getting design requests by user ID:", error);
      return [];
    }
  }

  async createDesignRequest(insertDesignRequest: InsertDesignRequest): Promise<DesignRequest> {
    try {
      // Ensure primaryStones is always an array
      const formattedData = {
        ...insertDesignRequest,
        primaryStones: Array.isArray(insertDesignRequest.primaryStones) 
          ? insertDesignRequest.primaryStones 
          : (insertDesignRequest.primaryStone ? [insertDesignRequest.primaryStone] : [])
      };
      
      // Log the data being inserted
      console.log("Creating design request with data:", JSON.stringify(formattedData, null, 2));
      
      const [request] = await db.insert(designRequests).values(formattedData).returning();
      return request;
    } catch (error) {
      console.error("Error creating design request:", error);
      throw error;
    }
  }

  async updateDesignRequest(id: number, designRequestUpdate: Partial<DesignRequest>): Promise<DesignRequest | undefined> {
    try {
      const [request] = await db.update(designRequests)
        .set(designRequestUpdate)
        .where(eq(designRequests.id, id))
        .returning();
      return request || undefined;
    } catch (error) {
      console.error("Error updating design request:", error);
      return undefined;
    }
  }
  
  // Design Request Comment methods
  async getDesignRequestComments(designRequestId: number): Promise<DesignRequestComment[]> {
    try {
      return await db
        .select()
        .from(designRequestComments)
        .where(eq(designRequestComments.designRequestId, designRequestId))
        .orderBy(asc(designRequestComments.createdAt));
    } catch (error) {
      console.error("Error getting design request comments:", error);
      return [];
    }
  }
  
  async addDesignRequestComment(comment: InsertDesignRequestComment): Promise<DesignRequestComment> {
    try {
      const [newComment] = await db
        .insert(designRequestComments)
        .values(comment)
        .returning();
      return newComment;
    } catch (error) {
      console.error("Error adding design request comment:", error);
      throw error;
    }
  }
  
  // Implement design feedback methods for chat with images support
  async getDesignFeedback(designRequestId: number): Promise<DesignFeedback[]> {
    try {
      return await db
        .select()
        .from(designFeedback)
        .where(eq(designFeedback.designRequestId, designRequestId))
        .orderBy(asc(designFeedback.createdAt));
    } catch (error) {
      console.error("Error getting design feedback:", error);
      return [];
    }
  }

  async addDesignFeedback(feedback: InsertDesignFeedback): Promise<DesignFeedback> {
    try {
      const [newFeedback] = await db
        .insert(designFeedback)
        .values(feedback)
        .returning();
      
      // If this is an admin response, increment iteration count
      if (feedback.isFromAdmin) {
        const designRequest = await this.getDesignRequest(feedback.designRequestId);
        if (designRequest) {
          // Check if we need to update the design request status
          const currentStatus = designRequest.status;
          let newStatus = currentStatus;
          
          // If current status is 'design_in_progress', change to 'design_ready_for_review'
          if (currentStatus === 'design_in_progress') {
            newStatus = 'design_ready_for_review';
          }
          
          // Update iteration count
          await this.updateDesignRequest(feedback.designRequestId, {
            iterationsCount: (designRequest.iterationsCount || 0) + 1,
            status: newStatus
          });
        }
      } else {
        // If this is a customer response, check if we need to update status
        const designRequest = await this.getDesignRequest(feedback.designRequestId);
        if (designRequest) {
          // If current status is 'design_ready_for_review', change to 'design_in_progress'
          if (designRequest.status === 'design_ready_for_review') {
            await this.updateDesignRequest(feedback.designRequestId, {
              status: 'design_in_progress'
            });
          }
        }
      }
      
      return newFeedback;
    } catch (error) {
      console.error("Error adding design feedback:", error);
      throw error;
    }
  }
  
  // Implement design payment methods
  async getDesignPayments(designRequestId: number): Promise<DesignPayment[]> {
    try {
      return await db
        .select()
        .from(designPayments)
        .where(eq(designPayments.designRequestId, designRequestId))
        .orderBy(asc(designPayments.createdAt));
    } catch (error) {
      console.error("Error getting design payments:", error);
      return [];
    }
  }

  async addDesignPayment(payment: InsertDesignPayment): Promise<DesignPayment> {
    try {
      const [newPayment] = await db
        .insert(designPayments)
        .values(payment)
        .returning();
      
      // If payment is successful consultation fee, update design request status
      if (payment.paymentType === 'consultation_fee' && payment.status === 'completed') {
        await this.updateDesignRequest(payment.designRequestId, {
          consultationFeePaid: true,
          // Update status based on current status
          status: 'design_started'
        });
      }
      
      return newPayment;
    } catch (error) {
      console.error("Error adding design payment:", error);
      throw error;
    }
  }

  async updateDesignPaymentStatus(id: number, status: string): Promise<DesignPayment | undefined> {
    try {
      const [payment] = await db
        .update(designPayments)
        .set({ status })
        .where(eq(designPayments.id, id))
        .returning();
      
      // If payment status changed to completed and it's a consultation fee,
      // update the design request as paid
      if (payment && payment.status === 'completed' && payment.paymentType === 'consultation_fee') {
        await this.updateDesignRequest(payment.designRequestId, {
          consultationFeePaid: true,
          status: 'design_started'
        });
      }
      
      return payment;
    } catch (error) {
      console.error("Error updating design payment status:", error);
      return undefined;
    }
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

  // Metal Type methods
  async getMetalType(id: number): Promise<MetalType | undefined> {
    try {
      const [metalType] = await db.select().from(metalTypes).where(eq(metalTypes.id, id));
      return metalType;
    } catch (error) {
      console.error("Error getting metal type:", error);
      return undefined;
    }
  }
  
  async getMetalTypeByName(name: string): Promise<MetalType | undefined> {
    try {
      // Convert string like "18kt-gold" to "18K Gold" format for searching
      const formattedName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/kt/i, 'K');
      
      const [metalType] = await db
        .select()
        .from(metalTypes)
        .where(sql`LOWER(${metalTypes.name}) LIKE LOWER(${`%${formattedName}%`})`);
      
      return metalType;
    } catch (error) {
      console.error("Error getting metal type by name:", error);
      return undefined;
    }
  }
  
  async getMetalTypeById(id: number | string): Promise<MetalType | undefined> {
    // If id is a number, use getMetalType
    if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
      return this.getMetalType(typeof id === 'string' ? parseInt(id) : id);
    }
    
    // Otherwise, try to look up by name
    return this.getMetalTypeByName(id as string);
  }
  
  async getAllMetalTypes(): Promise<MetalType[]> {
    try {
      return await db.select().from(metalTypes).orderBy(asc(metalTypes.name));
    } catch (error) {
      console.error("Error getting all metal types:", error);
      return [];
    }
  }
  
  async createMetalType(metalType: InsertMetalType): Promise<MetalType> {
    try {
      const [newMetalType] = await db.insert(metalTypes).values(metalType).returning();
      return newMetalType;
    } catch (error) {
      console.error("Error creating metal type:", error);
      throw error;
    }
  }
  
  async updateMetalType(id: number, metalTypeUpdate: Partial<InsertMetalType>): Promise<MetalType | undefined> {
    try {
      const [updatedMetalType] = await db
        .update(metalTypes)
        .set(metalTypeUpdate)
        .where(eq(metalTypes.id, id))
        .returning();
      return updatedMetalType;
    } catch (error) {
      console.error("Error updating metal type:", error);
      return undefined;
    }
  }
  
  async deleteMetalType(id: number): Promise<boolean> {
    try {
      const result = await db.delete(metalTypes).where(eq(metalTypes.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting metal type:", error);
      return false;
    }
  }
  
  // Stone Type methods
  async getStoneType(id: number): Promise<StoneType | undefined> {
    try {
      // Ensure id is a valid number to prevent SQL errors
      if (isNaN(id)) {
        console.warn(`Invalid stone type id provided: ${id}`);
        return undefined;
      }
      
      const [stoneType] = await db.select().from(stoneTypes).where(eq(stoneTypes.id, id));
      return stoneType;
    } catch (error) {
      console.error("Error getting stone type:", error);
      return undefined;
    }
  }
  
  async getStoneTypeByName(name: string): Promise<StoneType | undefined> {
    try {
      // Convert string like "natural-polki" to "Natural Polki" format for searching
      const formattedName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const [stoneType] = await db
        .select()
        .from(stoneTypes)
        .where(sql`LOWER(${stoneTypes.name}) LIKE LOWER(${`%${formattedName}%`})`);
      
      return stoneType;
    } catch (error) {
      console.error("Error getting stone type by name:", error);
      return undefined;
    }
  }
  
  async getStoneTypeById(id: number | string): Promise<StoneType | undefined> {
    // First check if id is valid
    if (id === null || id === undefined || (typeof id === 'number' && isNaN(id))) {
      console.warn(`Invalid stone type id: ${id}`);
      return undefined;
    }
    
    // If id is a number or numeric string, use getStoneType
    if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      // Double-check that parsed number is valid
      if (!isNaN(numericId)) {
        return this.getStoneType(numericId);
      } else {
        console.warn(`Failed to parse stone type id: ${id}`);
        return undefined;
      }
    }
    
    // If it's a non-numeric string, try to look up by name
    if (typeof id === 'string' && id.trim().length > 0) {
      return this.getStoneTypeByName(id);
    }
    
    return undefined;
  }
  
  async getAllStoneTypes(): Promise<StoneType[]> {
    try {
      return await db.select().from(stoneTypes).orderBy(asc(stoneTypes.name));
    } catch (error) {
      console.error("Error getting all stone types:", error);
      return [];
    }
  }
  
  async createStoneType(stoneType: InsertStoneType): Promise<StoneType> {
    try {
      console.log("STORAGE: Creating stone type with data:", stoneType);
      
      // Ensure priceModifier is a number
      if (typeof stoneType.priceModifier === 'string') {
        stoneType.priceModifier = parseFloat(stoneType.priceModifier as any);
      }
      
      console.log("STORAGE: Attempting database insert with cleaned data:", stoneType);
      const insertResult = await db.insert(stoneTypes).values(stoneType).returning();
      console.log("STORAGE: Insert result:", insertResult);
      
      if (insertResult && insertResult.length > 0) {
        const [newStoneType] = insertResult;
        console.log("STORAGE: Successfully created stone type:", newStoneType);
        return newStoneType;
      } else {
        throw new Error("No stone type was created or returned from database");
      }
    } catch (error) {
      console.error("STORAGE: Error creating stone type:", error);
      throw error;
    }
  }
  
  async updateStoneType(id: number, stoneTypeUpdate: Partial<InsertStoneType>): Promise<StoneType | undefined> {
    try {
      const [updatedStoneType] = await db
        .update(stoneTypes)
        .set(stoneTypeUpdate)
        .where(eq(stoneTypes.id, id))
        .returning();
      return updatedStoneType;
    } catch (error) {
      console.error("Error updating stone type:", error);
      return undefined;
    }
  }
  
  async deleteStoneType(id: number): Promise<boolean> {
    try {
      // First, delete any product-stone associations
      await db.delete(productStones).where(eq(productStones.stoneTypeId, id));
      
      // Then delete the stone type
      const result = await db.delete(stoneTypes).where(eq(stoneTypes.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting stone type:", error);
      return false;
    }
  }
  
  // Product-Stone relationship methods
  async getProductStones(productId: number): Promise<StoneType[]> {
    try {
      const result = await db
        .select({
          stoneType: stoneTypes
        })
        .from(productStones)
        .innerJoin(stoneTypes, eq(productStones.stoneTypeId, stoneTypes.id))
        .where(eq(productStones.productId, productId));
      
      return result.map(r => r.stoneType);
    } catch (error) {
      console.error("Error getting product stones:", error);
      return [];
    }
  }
  
  async addProductStones(productId: number, stoneTypeIds: number[]): Promise<void> {
    try {
      // Create the values array for batch insert
      const values = stoneTypeIds.map(stoneTypeId => ({
        productId,
        stoneTypeId
      }));
      
      if (values.length > 0) {
        await db.insert(productStones).values(values);
      }
    } catch (error) {
      console.error("Error adding product stones:", error);
      throw error;
    }
  }
  
  async updateProductStones(productId: number, stoneTypeIds: number[]): Promise<void> {
    try {
      // Begin transaction
      await db.transaction(async (tx) => {
        // Delete all existing associations
        await tx.delete(productStones).where(eq(productStones.productId, productId));
        
        // Add new associations
        if (stoneTypeIds.length > 0) {
          const values = stoneTypeIds.map(stoneTypeId => ({
            productId,
            stoneTypeId
          }));
          
          await tx.insert(productStones).values(values);
        }
      });
    } catch (error) {
      console.error("Error updating product stones:", error);
      throw error;
    }
  }
  
  async removeProductStone(productId: number, stoneTypeId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(productStones)
        .where(
          and(
            eq(productStones.productId, productId),
            eq(productStones.stoneTypeId, stoneTypeId)
          )
        );
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error removing product stone:", error);
      return false;
    }
  }

  // Inspiration Gallery methods
  async getInspirationItem(id: number): Promise<InspirationGalleryItem | undefined> {
    try {
      const [item] = await db.select().from(inspirationGallery).where(eq(inspirationGallery.id, id));
      return item || undefined;
    } catch (error) {
      console.error("Error getting inspiration gallery item:", error);
      return undefined;
    }
  }

  async getAllInspirationItems(): Promise<InspirationGalleryItem[]> {
    try {
      return await db.select().from(inspirationGallery).orderBy(desc(inspirationGallery.createdAt));
    } catch (error) {
      console.error("Error getting all inspiration gallery items:", error);
      return [];
    }
  }

  async getFeaturedInspirationItems(): Promise<InspirationGalleryItem[]> {
    try {
      return await db.select().from(inspirationGallery)
        .where(eq(inspirationGallery.featured, true))
        .orderBy(desc(inspirationGallery.createdAt));
    } catch (error) {
      console.error("Error getting featured inspiration gallery items:", error);
      return [];
    }
  }

  async getInspirationItemsByCategory(category: string): Promise<InspirationGalleryItem[]> {
    try {
      return await db.select().from(inspirationGallery)
        .where(eq(inspirationGallery.category, category))
        .orderBy(desc(inspirationGallery.createdAt));
    } catch (error) {
      console.error("Error getting inspiration gallery items by category:", error);
      return [];
    }
  }

  async createInspirationItem(item: InsertInspirationGalleryItem): Promise<InspirationGalleryItem> {
    try {
      const [inspirationItem] = await db.insert(inspirationGallery).values(item).returning();
      return inspirationItem;
    } catch (error) {
      console.error("Error creating inspiration gallery item:", error);
      throw error;
    }
  }

  async updateInspirationItem(id: number, itemUpdate: Partial<InspirationGalleryItem>): Promise<InspirationGalleryItem | undefined> {
    try {
      const [item] = await db.update(inspirationGallery)
        .set(itemUpdate)
        .where(eq(inspirationGallery.id, id))
        .returning();
      return item || undefined;
    } catch (error) {
      console.error("Error updating inspiration gallery item:", error);
      return undefined;
    }
  }

  async deleteInspirationItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(inspirationGallery).where(eq(inspirationGallery.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting inspiration gallery item:", error);
      return false;
    }
  }

  // Product Type methods
  async getProductType(id: number): Promise<ProductType | undefined> {
    try {
      const [productType] = await db.select().from(productTypes).where(eq(productTypes.id, id));
      return productType || undefined;
    } catch (error) {
      console.error("Error getting product type:", error);
      return undefined;
    }
  }
  
  async getAllProductTypes(): Promise<ProductType[]> {
    try {
      return await db.select()
        .from(productTypes)
        .orderBy(asc(productTypes.displayOrder), asc(productTypes.name));
    } catch (error) {
      console.error("Error getting all product types:", error);
      return [];
    }
  }
  
  async getActiveProductTypes(): Promise<ProductType[]> {
    try {
      return await db.select()
        .from(productTypes)
        .where(eq(productTypes.isActive, true))
        .orderBy(asc(productTypes.displayOrder), asc(productTypes.name));
    } catch (error) {
      console.error("Error getting active product types:", error);
      return [];
    }
  }
  
  async createProductType(insertProductType: InsertProductType): Promise<ProductType> {
    try {
      const [productType] = await db.insert(productTypes).values(insertProductType).returning();
      return productType;
    } catch (error) {
      console.error("Error creating product type:", error);
      throw error;
    }
  }
  
  async updateProductType(id: number, productTypeUpdate: Partial<InsertProductType>): Promise<ProductType | undefined> {
    try {
      const [productType] = await db.update(productTypes)
        .set(productTypeUpdate)
        .where(eq(productTypes.id, id))
        .returning();
      return productType || undefined;
    } catch (error) {
      console.error("Error updating product type:", error);
      return undefined;
    }
  }
  
  async deleteProductType(id: number): Promise<boolean> {
    try {
      const result = await db.delete(productTypes).where(eq(productTypes.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting product type:", error);
      return false;
    }
  }

  // Customization request methods
  async createCustomizationRequest(request: any): Promise<any> {
    try {
      console.log("Creating customization request with data:", request);
      
      // Use the correct table for customization requests
      const [newRequest] = await db
        .insert(customizationRequests)
        .values({
          userId: request.userId || null,
          fullName: request.fullName, // Match the schema field name
          email: request.email,
          phone: request.phone || null,
          country: request.country || null,
          productId: request.productId,
          originalMetalType: request.originalMetalType || "Unknown",
          requestedMetalType: request.requestedMetalType || "Unknown",
          originalStoneType: request.originalStoneType || "Unknown",
          requestedStoneType: request.requestedStoneType || "Unknown",
          additionalNotes: request.additionalNotes || null,
          status: "pending", // Default status
          imageUrls: request.imageUrls || [],
        })
        .returning();
      
      console.log("Successfully created customization request:", newRequest);
      return newRequest;
    } catch (error) {
      console.error("Error creating customization request:", error);
      throw error;
    }
  }

  async getAllCustomizationRequests(): Promise<any[]> {
    try {
      const requests = await db
        .select()
        .from(customizationRequests)
        .orderBy(desc(customizationRequests.createdAt));
      return requests;
    } catch (error) {
      console.error("Error getting all customization requests:", error);
      return [];
    }
  }
  
  async getCustomizationRequestsByUserId(userId: number): Promise<any[]> {
    try {
      const requests = await db
        .select()
        .from(customizationRequests)
        .where(eq(customizationRequests.userId, userId))
        .orderBy(desc(customizationRequests.createdAt));
      return requests;
    } catch (error) {
      console.error(`Error getting customization requests for user ${userId}:`, error);
      return [];
    }
  }
  
  async getCustomizationRequest(id: number): Promise<any> {
    try {
      const [request] = await db
        .select()
        .from(customizationRequests)
        .where(eq(customizationRequests.id, id));
      return request;
    } catch (error) {
      console.error(`Error getting customization request ${id}:`, error);
      return null;
    }
  }
  
  async getCustomizationRequestComments(requestId: number): Promise<any[]> {
    try {
      const comments = await db
        .select()
        .from(customizationRequestComments)
        .where(eq(customizationRequestComments.customizationRequestId, requestId))
        .orderBy(asc(customizationRequestComments.createdAt));
      return comments;
    } catch (error) {
      console.error(`Error getting comments for customization request ${requestId}:`, error);
      return [];
    }
  }
  
  async addCustomizationRequestComment(comment: any): Promise<any> {
    try {
      const [newComment] = await db
        .insert(customizationRequestComments)
        .values({
          customizationRequestId: comment.customizationRequestId,
          content: comment.content,
          createdBy: comment.createdBy || 'Anonymous',
          userId: comment.userId || null,
          imageUrl: comment.imageUrl || null,
          isAdmin: comment.isAdmin || false
        })
        .returning();
      return newComment;
    } catch (error) {
      console.error("Error adding customization request comment:", error);
      throw error;
    }
  }

  async updateCustomizationRequestStatus(id: number, status: string): Promise<any> {
    try {
      const [updatedRequest] = await db
        .update(customizationRequests)
        .set({ status })
        .where(eq(customizationRequests.id, id))
        .returning();
      return updatedRequest;
    } catch (error) {
      console.error("Error updating customization request status:", error);
      return null;
    }
  }
  
  // Quote Request methods
  async getAllQuoteRequests(): Promise<QuoteRequest[]> {
    try {
      const requests = await db
        .select()
        .from(quoteRequests)
        .orderBy(desc(quoteRequests.createdAt));
      return requests;
    } catch (error) {
      console.error("Error getting all quote requests:", error);
      return [];
    }
  }
  
  async getQuoteRequest(id: number): Promise<QuoteRequest | undefined> {
    try {
      const [request] = await db
        .select()
        .from(quoteRequests)
        .where(eq(quoteRequests.id, id));
      return request || undefined;
    } catch (error) {
      console.error("Error getting quote request:", error);
      return undefined;
    }
  }
  
  async getQuoteRequestsByUserId(userId: number): Promise<QuoteRequest[]> {
    try {
      const requests = await db
        .select()
        .from(quoteRequests)
        .where(eq(quoteRequests.userId, userId))
        .orderBy(desc(quoteRequests.createdAt));
      return requests;
    } catch (error) {
      console.error("Error getting quote requests by user ID:", error);
      return [];
    }
  }
  
  async getQuoteRequestsByEmail(email: string): Promise<QuoteRequest[]> {
    try {
      const requests = await db
        .select()
        .from(quoteRequests)
        .where(eq(quoteRequests.email, email))
        .orderBy(desc(quoteRequests.createdAt));
      return requests;
    } catch (error) {
      console.error("Error getting quote requests by email:", error);
      return [];
    }
  }
  
  async createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest> {
    try {
      const [newRequest] = await db
        .insert(quoteRequests)
        .values(request)
        .returning();
      return newRequest;
    } catch (error) {
      console.error("Error creating quote request:", error);
      throw error;
    }
  }
  
  async updateQuoteRequest(id: number, request: Partial<QuoteRequest>): Promise<QuoteRequest | undefined> {
    try {
      const [updatedRequest] = await db
        .update(quoteRequests)
        .set(request)
        .where(eq(quoteRequests.id, id))
        .returning();
      return updatedRequest;
    } catch (error) {
      console.error("Error updating quote request:", error);
      return undefined;
    }
  }
  
  async getQuoteRequestComments(requestId: number): Promise<QuoteRequestComment[]> {
    try {
      const comments = await db
        .select()
        .from(quoteRequestComments)
        .where(eq(quoteRequestComments.quoteRequestId, requestId))
        .orderBy(asc(quoteRequestComments.createdAt));
      return comments;
    } catch (error) {
      console.error("Error getting quote request comments:", error);
      return [];
    }
  }
  
  async addQuoteRequestComment(comment: InsertQuoteRequestComment): Promise<QuoteRequestComment> {
    try {
      const [newComment] = await db
        .insert(quoteRequestComments)
        .values(comment)
        .returning();
      return newComment;
    } catch (error) {
      console.error("Error adding quote request comment:", error);
      throw error;
    }
  }
  
  // Order methods
  async getOrdersByUserId(userId: number): Promise<any[]> {
    try {
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));
        
      // For each order, fetch its items
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
            
          // For each item, fetch the associated product
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, item.productId));
              
              return {
                ...item,
                product: product || null
              };
            })
          );
          
          return {
            ...order,
            items: itemsWithProducts
          };
        })
      );
      
      return ordersWithItems;
    } catch (error) {
      console.error("Error getting orders by user ID:", error);
      return [];
    }
  }
  
  // Cart methods
  async getCartItemsDetailsBySession(sessionId: string): Promise<any> {
    try {
      let cartItemsList = [];
      
      if (sessionId) {
        cartItemsList = await db
          .select()
          .from(cartItems)
          .where(eq(cartItems.sessionId, sessionId));
      }
      
      // Fetch product details for each cart item
      const itemsWithProducts = await Promise.all(
        cartItemsList.map(async (item) => {
          const [productData] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          
          return {
            ...item,
            product: productData || null
          };
        })
      );
      
      // Calculate total price
      const total = itemsWithProducts.reduce((sum, item) => sum + (item.price || 0), 0);
      
      return {
        items: itemsWithProducts,
        total
      };
    } catch (error) {
      console.error("Error getting cart items by session:", error);
      return { items: [], total: 0 };
    }
  }
  
  async getCartItemsByUser(userId: number): Promise<any> {
    try {
      const userCartItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.userId, userId));
      
      // Fetch product details for each cart item
      const itemsWithProducts = await Promise.all(
        userCartItems.map(async (item) => {
          const [productData] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          
          return {
            ...item,
            product: productData || null
          };
        })
      );
      
      // Calculate total price
      const total = itemsWithProducts.reduce((sum, item) => sum + (item.price || 0), 0);
      
      return {
        items: itemsWithProducts,
        total
      };
    } catch (error) {
      console.error("Error getting cart items by user:", error);
      return { items: [], total: 0 };
    }
  }
  
  async addCartItem(cartItem: InsertCartItem): Promise<any> {
    try {
      const [item] = await db
        .insert(cartItems)
        .values(cartItem)
        .returning();
      
      return item;
    } catch (error) {
      console.error("Error adding cart item:", error);
      throw error;
    }
  }
  
  async removeCartItem(id: number): Promise<boolean> {
    try {
      await db
        .delete(cartItems)
        .where(eq(cartItems.id, id));
      
      return true;
    } catch (error) {
      console.error("Error removing cart item:", error);
      return false;
    }
  }
  
  async clearCart(sessionId: string): Promise<boolean> {
    try {
      await db
        .delete(cartItems)
        .where(eq(cartItems.sessionId, sessionId));
      
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  }
  
  async clearCartByUser(userId: number): Promise<boolean> {
    try {
      await db
        .delete(cartItems)
        .where(eq(cartItems.userId, userId));
      
      return true;
    } catch (error) {
      console.error("Error clearing user cart:", error);
      return false;
    }
  }

  /**
   * Find related products based on product type, metal type, and stone types
   * Uses both keyword matching and category/material similarity
   */
  async getRelatedProducts(productId: number, limit: number = 4): Promise<any[]> {
    try {
      // First get the current product to extract keywords and properties
      const currentProduct = await this.getProduct(productId);
      if (!currentProduct) {
        console.log(`No product found with ID ${productId}`);
        return [];
      }

      console.log(`Finding related products for: ${currentProduct.name} (ID: ${productId})`);

      // Extract the product details to find matching attributes
      let productType = "";
      let metalType = "";
      let mainStoneType = "";
      let secondaryStoneType = "";
      let otherStoneType = "";
      let productCategory = currentProduct.category || "";
      let gemKeywords: string[] = [];
      let aiInputs = null;
      let similarityScore = new Map<number, number>();
      
      // Common gemstone types for keyword matching
      const gemstoneTypes = [
        "diamond", "emerald", "ruby", "sapphire", "pearl", "tanzanite", "topaz", 
        "amethyst", "aquamarine", "citrine", "garnet", "jade", "opal", "peridot", 
        "quartz", "turquoise", "morganite", "moonstone", "kundan", "polki", "gemstone",
        "keshi", "moissanite", "swarovski", "cubic zirconia", "cz", "beads", "navratna",
        "navaratan", "coral", "pota", "freshwater", "precious", "semi-precious",
        "carved", "lab-grown", "natural", "stone", "crystal"
      ];
      
      // Try to extract AI inputs for more accurate matching
      try {
        if (currentProduct.aiInputs) {
          aiInputs = typeof currentProduct.aiInputs === 'string' 
            ? JSON.parse(currentProduct.aiInputs) 
            : currentProduct.aiInputs;
            
          if (aiInputs) {
            productType = aiInputs.productType || "";
            metalType = aiInputs.metalType || "";
            mainStoneType = aiInputs.mainStoneType || "";
            secondaryStoneType = aiInputs.secondaryStoneType || "";
            otherStoneType = aiInputs.otherStoneType || "";
            
            // Add gemstone keywords from all stone types
            if (mainStoneType) gemKeywords.push(...this.extractGemKeywords(mainStoneType));
            if (secondaryStoneType) gemKeywords.push(...this.extractGemKeywords(secondaryStoneType));
            if (otherStoneType) gemKeywords.push(...this.extractGemKeywords(otherStoneType));
          }
        } else if (currentProduct.details) {
          const details = JSON.parse(currentProduct.details);
          if (details.additionalData) {
            const additionalData = details.additionalData;
            productType = additionalData.productType || "";
            metalType = additionalData.metalType || "";
            mainStoneType = additionalData.mainStoneType || "";
            secondaryStoneType = additionalData.secondaryStoneType || "";
            otherStoneType = additionalData.otherStoneType || "";
            
            // If we have aiInputs inside additionalData, use those instead
            if (additionalData.aiInputs) {
              productType = additionalData.aiInputs.productType || productType;
              metalType = additionalData.aiInputs.metalType || metalType;
              mainStoneType = additionalData.aiInputs.mainStoneType || mainStoneType;
              secondaryStoneType = additionalData.aiInputs.secondaryStoneType || secondaryStoneType;
              otherStoneType = additionalData.aiInputs.otherStoneType || otherStoneType;
            }
            
            // Add gemstone keywords from all stone types
            if (mainStoneType) gemKeywords.push(...this.extractGemKeywords(mainStoneType));
            if (secondaryStoneType) gemKeywords.push(...this.extractGemKeywords(secondaryStoneType));
            if (otherStoneType) gemKeywords.push(...this.extractGemKeywords(otherStoneType));
          }
        }
        
        // Extract gem keywords from product name and description
        if (currentProduct.name) {
          gemKeywords.push(...this.extractGemKeywords(currentProduct.name));
        }
        
        if (currentProduct.description) {
          gemKeywords.push(...this.extractGemKeywords(currentProduct.description));
        }
        
        // Remove duplicates and empty entries
        gemKeywords = [...new Set(gemKeywords)].filter(Boolean);
        console.log(`Extracted gem keywords: ${gemKeywords.join(", ")}`);
        
      } catch (error) {
        console.error(`Error parsing product details for product ${productId}:`, error);
      }
      
      // Get all products except the current one
      const allProducts = await db
        .select()
        .from(products)
        .where(
          sql`${products.id} != ${productId} AND ${products.imageUrl} IS NOT NULL`
        );
        
      console.log(`Found ${allProducts.length} other products to compare against`);
      
      // Calculate similarity score for each product
      for (const product of allProducts) {
        let score = 0;
        let productAiInputs = null;
        let otherProductType = "";
        let otherMetalType = "";
        let otherMainStoneType = "";
        let otherSecondaryStoneType = "";
        let otherOtherStoneType = "";
        let otherGemKeywords: string[] = [];
        
        // Try to extract AI inputs for comparison
        try {
          if (product.aiInputs) {
            productAiInputs = typeof product.aiInputs === 'string' 
              ? JSON.parse(product.aiInputs) 
              : product.aiInputs;
              
            if (productAiInputs) {
              otherProductType = productAiInputs.productType || "";
              otherMetalType = productAiInputs.metalType || "";
              otherMainStoneType = productAiInputs.mainStoneType || "";
              otherSecondaryStoneType = productAiInputs.secondaryStoneType || "";
              otherOtherStoneType = productAiInputs.otherStoneType || "";
              
              // Add gemstone keywords from all stone types
              if (otherMainStoneType) otherGemKeywords.push(...this.extractGemKeywords(otherMainStoneType));
              if (otherSecondaryStoneType) otherGemKeywords.push(...this.extractGemKeywords(otherSecondaryStoneType));
              if (otherOtherStoneType) otherGemKeywords.push(...this.extractGemKeywords(otherOtherStoneType));
            }
          } else if (product.details) {
            const details = JSON.parse(product.details);
            if (details.additionalData) {
              const additionalData = details.additionalData;
              otherProductType = additionalData.productType || "";
              otherMetalType = additionalData.metalType || "";
              otherMainStoneType = additionalData.mainStoneType || "";
              otherSecondaryStoneType = additionalData.secondaryStoneType || "";
              otherOtherStoneType = additionalData.otherStoneType || "";
              
              // If we have aiInputs inside additionalData, use those instead
              if (additionalData.aiInputs) {
                otherProductType = additionalData.aiInputs.productType || otherProductType;
                otherMetalType = additionalData.aiInputs.metalType || otherMetalType;
                otherMainStoneType = additionalData.aiInputs.mainStoneType || otherMainStoneType;
                otherSecondaryStoneType = additionalData.aiInputs.secondaryStoneType || otherSecondaryStoneType;
                otherOtherStoneType = additionalData.aiInputs.otherStoneType || otherOtherStoneType;
              }
              
              // Add gemstone keywords from all stone types
              if (otherMainStoneType) otherGemKeywords.push(...this.extractGemKeywords(otherMainStoneType));
              if (otherSecondaryStoneType) otherGemKeywords.push(...this.extractGemKeywords(otherSecondaryStoneType));
              if (otherOtherStoneType) otherGemKeywords.push(...this.extractGemKeywords(otherOtherStoneType));
            }
          }
          
          // Extract gem keywords from product name and description
          if (product.name) {
            otherGemKeywords.push(...this.extractGemKeywords(product.name));
          }
          
          if (product.description) {
            otherGemKeywords.push(...this.extractGemKeywords(product.description));
          }
          
          // Remove duplicates and empty entries
          otherGemKeywords = [...new Set(otherGemKeywords)].filter(Boolean);
          
        } catch (error) {
          console.error(`Error parsing product details for product ${product.id}:`, error);
        }
        
        // Match by product type/category (highest weight)
        if (otherProductType && productType && otherProductType.toLowerCase() === productType.toLowerCase()) {
          score += 5;
        } else if (product.category && productCategory && product.category.toLowerCase() === productCategory.toLowerCase()) {
          score += 4;
        }
        
        // Match by metal type (medium weight)
        if (otherMetalType && metalType && otherMetalType.toLowerCase() === metalType.toLowerCase()) {
          score += 3;
        }
        
        // Match by main stone type (medium weight)
        if (otherMainStoneType && mainStoneType && otherMainStoneType.toLowerCase().includes(mainStoneType.toLowerCase())) {
          score += 3;
        }
        
        // Match by secondary stone type (lower weight)
        if (otherSecondaryStoneType && secondaryStoneType && 
            otherSecondaryStoneType.toLowerCase().includes(secondaryStoneType.toLowerCase())) {
          score += 2;
        }
        
        // Match by other stone type
        if (otherOtherStoneType && otherStoneType && 
            otherOtherStoneType.toLowerCase().includes(otherStoneType.toLowerCase())) {
          score += 2;
        }
        
        // Enhanced gemstone keyword matching (high weight for gemstone matches)
        if (gemKeywords.length > 0 && otherGemKeywords.length > 0) {
          const matchingGemKeywords = gemKeywords.filter(keyword => 
            otherGemKeywords.some(otherKeyword => 
              otherKeyword.includes(keyword) || keyword.includes(otherKeyword)
            )
          );
          
          // Gemstone matches are highly valued
          score += matchingGemKeywords.length * 4;
        }
        
        // Name-based keyword matching (still important)
        if (product.name && currentProduct.name) {
          const productWords = product.name.toLowerCase().split(/\s+/);
          const currentProductWords = currentProduct.name.toLowerCase().split(/\s+/);
          
          // Count how many words match between the two products
          const matchingWords = productWords.filter(word => 
            currentProductWords.includes(word) && word.length > 3); // Only count words longer than 3 chars
          
          score += matchingWords.length * 2;
        }
        
        // Store the score for this product
        similarityScore.set(product.id, score);
      }
      
      // Sort the products by their similarity score (descending)
      const sortedProducts = allProducts.sort((a, b) => {
        const scoreA = similarityScore.get(a.id) || 0;
        const scoreB = similarityScore.get(b.id) || 0;
        return scoreB - scoreA;
      });
      
      // Log the top products and their scores for debugging
      const topProducts = sortedProducts.slice(0, limit);
      console.log(`Top ${topProducts.length} related products for ${productId}:`);
      topProducts.forEach(product => {
        console.log(`- ID ${product.id}: "${product.name}" (Score: ${similarityScore.get(product.id)})`);
      });
      
      // Return the top N most similar products
      return topProducts;
    } catch (error) {
      console.error("Error finding related products:", error);
      return [];
    }
  }
  
  // Helper method to extract gemstone keywords from text
  private extractGemKeywords(text: string): string[] {
    if (!text) return [];
    
    const normalizedText = text.toLowerCase();
    
    // Common gemstone types for keyword matching
    const gemstoneTypes = [
      "diamond", "emerald", "ruby", "sapphire", "pearl", "tanzanite", "topaz", 
      "amethyst", "aquamarine", "citrine", "garnet", "jade", "opal", "peridot", 
      "quartz", "turquoise", "morganite", "moonstone", "kundan", "polki", "gemstone",
      "keshi", "moissanite", "swarovski", "cubic zirconia", "cz", "beads", "navratna",
      "navaratan", "coral", "pota", "freshwater", "precious", "semi-precious",
      "carved", "lab-grown", "natural", "stone", "crystal"
    ];
    
    // Add prefixes and variations
    const gemVariations = [
      "rose quartz", "lavender quartz", "smoky quartz", "rock crystal",
      "multi-colored", "multi colored", "multicolored", "multi-gemstone", "multi gemstone"
    ];
    
    const allGemTerms = [...gemstoneTypes, ...gemVariations];
    
    // Extract keywords that are found in the text
    return allGemTerms.filter(term => normalizedText.includes(term));
  }
}

// Use database storage implementation
export const storage = new DatabaseStorage();
