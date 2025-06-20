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

  productTypes
} from "@shared/schema";
import { db } from "./db";
import { sql, and, eq, ne, isNotNull, desc, asc, SQL } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hashPassword } from "./auth";

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
  getUserByLoginID(loginID: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  createPasswordResetToken(email: string): Promise<{ token: string; user: User } | undefined>;
  resetPassword(token: string, newPassword: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateNotificationPreferences(
    userId: number, 
    preferences: { 
      notifyDesignUpdates?: boolean; 
      notifyOrderStatus?: boolean; 
      notifyQuoteResponses?: boolean; 
    }
  ): Promise<User>;
  deleteUser(loginIDOrId: string | number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  countUserDesignRequests(userId: number): Promise<number>;
  countUserQuoteRequests(userId: number): Promise<number>;
  countUserCustomizationRequests(userId: number): Promise<number>;
  countUserOrders(userId: number): Promise<number>;
  countUserContactMessages(userId: number): Promise<number>;
  getUserLastActivity(userId: number): Promise<string | null>;
  
  // Password reset methods
  createPasswordResetToken(email: string): Promise<{token: string; user: User} | undefined>;
  resetPassword(token: string, newPassword: string): Promise<User | undefined>;

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

  // Client Stories (Testimonial) methods
  getAllTestimonials(): Promise<Testimonial[]>;
  getApprovedTestimonials(): Promise<Testimonial[]>;
  getTestimonials(options?: { userId?: number, status?: string, limit?: number, approved?: boolean }): Promise<Testimonial[]>;
  getTestimonialById(id: number): Promise<Testimonial | undefined>;
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
  getMetalTypeById(metalTypeId: string): Promise<MetalType | undefined>;
  getAllMetalTypes(): Promise<MetalType[]>;
  createMetalType(metalType: InsertMetalType): Promise<MetalType>;
  updateMetalType(id: number, metalType: Partial<InsertMetalType>): Promise<MetalType | undefined>;
  deleteMetalType(id: number): Promise<boolean>;

  // Stone Type methods
  getStoneType(id: number): Promise<StoneType | undefined>;
  getStoneTypeById(stoneTypeId: string): Promise<StoneType | undefined>;
  getStoneTypeByName(name: string): Promise<StoneType | undefined>;
  getAllStoneTypes(): Promise<StoneType[]>;
  createStoneType(stoneType: InsertStoneType): Promise<StoneType>;
  updateStoneType(id: number, stoneType: Partial<InsertStoneType>): Promise<StoneType | undefined>;
  deleteStoneType(id: number): Promise<boolean>;

  // Product-Stone methods
  getProductStones(productId: number): Promise<StoneType[]>;
  addProductStones(productId: number, stoneTypeIds: number[]): Promise<void>;
  updateProductStones(productId: number, stoneTypeIds: number[]): Promise<void>;
  removeProductStone(productId: number, stoneTypeId: number): Promise<boolean>;



  // Product Type methods
  getProductType(id: number): Promise<ProductType | undefined>;
  getAllProductTypes(): Promise<ProductType[]>;
  getActiveProductTypes(): Promise<ProductType[]>;
  createProductType(productType: InsertProductType): Promise<ProductType>;
  updateProductType(id: number, productType: Partial<InsertProductType>): Promise<ProductType | undefined>;
  deleteProductType(id: number): Promise<boolean>;
}

// In-memory storage implementation - keeping this for reference
class MemStorage {
  // Implementation left unchanged
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  public sessionStore: any; // Using any to avoid type issues with express-session

  constructor() {
    try {
      // Initialize with PostgresSessionStore
      // Using the already imported pool from db.ts
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: true 
      });
      
      // Add error handler to session store
      if (this.sessionStore && typeof this.sessionStore.on === 'function') {
        this.sessionStore.on('error', (error: Error) => {
          console.error('Session store error:', error);
          // Log but don't crash the application
        });
      }
    } catch (error) {
      console.error('Failed to create PostgresSessionStore:', error);
      // Create a fallback memory store
      const MemoryStore = require('memorystore')(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
      console.log('Using in-memory session store as fallback');
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByLoginID(loginID: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.loginID, loginID));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    
    // Convert to lowercase for case-insensitive comparison
    const emailLower = email.toLowerCase();
    console.log(`[STORAGE] Looking up user by email (case insensitive): ${emailLower}`);
    
    // Use SQL LOWER function for case-insensitive matching
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${emailLower}`);
      
    if (user) {
      console.log(`[STORAGE] Found user for email ${emailLower}: ID ${user.id}, username ${user.username}`);
    } else {
      console.log(`[STORAGE] No user found for email: ${emailLower}`);
    }
    
    return user;
  }
  
  async getUserByUsername(usernameOrLoginID: string): Promise<User | undefined> {
    // First try to match by loginID (preferred)
    const userByLoginID = await this.getUserByLoginID(usernameOrLoginID);
    if (userByLoginID) return userByLoginID;

    // If no match by loginID, try the email field as fallback
    return await this.getUserByEmail(usernameOrLoginID);
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateNotificationPreferences(
    userId: number, 
    preferences: { 
      notifyDesignUpdates?: boolean; 
      notifyOrderStatus?: boolean; 
      notifyQuoteResponses?: boolean; 
    }
  ): Promise<User> {
    // Get only the defined preferences (ignore undefined values)
    const updates: Partial<User> = {};
    
    if (preferences.notifyDesignUpdates !== undefined) {
      updates.notifyDesignUpdates = preferences.notifyDesignUpdates;
    }
    
    if (preferences.notifyOrderStatus !== undefined) {
      updates.notifyOrderStatus = preferences.notifyOrderStatus;
    }
    
    if (preferences.notifyQuoteResponses !== undefined) {
      updates.notifyQuoteResponses = preferences.notifyQuoteResponses;
    }
    
    // Update the user with the new preferences
    const updatedUser = await this.updateUser(userId, updates);
    
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log("createUser - Received user data:", {
        hasLoginID: !!insertUser.loginID,
        loginID: insertUser.loginID,
        name: insertUser.name,
        email: insertUser.email,
        hasPhone: !!insertUser.phone,
        hasCountry: !!insertUser.country,
        role: insertUser.role || 'customer'
      });
      
      // Database requires both username and loginID fields
      // Our schema uses loginID but the database expects username too
      if (!insertUser.loginID) {
        throw new Error("LoginID is required");
      }
      
      // Create a complete user object with all required fields
      const userData = {
        name: insertUser.name,
        email: insertUser.email,
        phone: insertUser.phone || '',
        country: insertUser.country || 'us',
        loginID: insertUser.loginID,
        // If username is provided, use it, otherwise set it to loginID
        // This maintains compatibility with the database requirement
        username: insertUser.username || insertUser.loginID, 
        password: insertUser.password,
        role: insertUser.role || 'customer',
        emailVerified: false,
        verificationToken: null,
        createdAt: new Date()
      };
      
      console.log("createUser - Full data being inserted:", {
        ...userData,
        password: userData.password ? '[REDACTED]' : undefined,
        hasPassword: !!userData.password,
        passwordLength: userData.password?.length,
        hasLoginID: !!userData.loginID,
        hasUsername: !!userData.username,
        username: userData.username
      });
      
      // Perform the database insertion with explicit field mapping
      const [user] = await db.insert(users).values(userData).returning();
      console.log("User created successfully with ID:", user.id);
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Check for specific database errors and provide better error messages
      if (error instanceof Error) {
        // Check for duplicate key violations
        if (error.message.includes("duplicate key value violates unique constraint")) {
          if (error.message.includes("users_login_id_unique")) {
            throw new Error("Login ID already exists");
          }
          if (error.message.includes("users_email_unique")) {
            throw new Error("Email already exists");
          }
          if (error.message.includes("users_username_unique")) {
            throw new Error("Username already exists");
          }
        }
        
        // Check for not-null constraint violations
        if (error.message.includes("violates not-null constraint")) {
          const match = error.message.match(/column "(.*?)" of relation/);
          if (match && match[1]) {
            throw new Error(`${match[1]} is required`);
          }
        }
      }
      
      // If we couldn't determine a specific error, rethrow the original
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async countUserDesignRequests(userId: number): Promise<number> {
    const requests = await db
      .select()
      .from(designRequests)
      .where(eq(designRequests.userId, userId));
    return requests.length;
  }

  async countUserQuoteRequests(userId: number): Promise<number> {
    const requests = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.userId, userId));
    return requests.length;
  }

  async countUserCustomizationRequests(userId: number): Promise<number> {
    const requests = await db
      .select()
      .from(customizationRequests)
      .where(eq(customizationRequests.userId, userId));
    return requests.length;
  }

  async countUserOrders(userId: number): Promise<number> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
    return userOrders.length;
  }

  async countUserContactMessages(userId: number): Promise<number> {
    // Find the user to get their email
    const user = await this.getUser(userId);
    if (!user || !user.email) {
      return 0;
    }
    
    // Find contact messages by email
    const messages = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.email, user.email));
    return messages.length;
  }

  async getUserLastActivity(userId: number): Promise<string | null> {
    // Look up the most recent activity across all user-related tables
    // Start with design requests
    const designRequest = await db
      .select()
      .from(designRequests)
      .where(eq(designRequests.userId, userId))
      .orderBy(desc(designRequests.createdAt))
      .limit(1);
    
    // Quote requests
    const quoteRequest = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.userId, userId))
      .orderBy(desc(quoteRequests.createdAt))
      .limit(1);
      
    // Customization requests
    const customRequest = await db
      .select()
      .from(customizationRequests)
      .where(eq(customizationRequests.userId, userId))
      .orderBy(desc(customizationRequests.createdAt))
      .limit(1);
      
    // Orders
    const userOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(1);
    
    // Design comments
    const designComment = await db
      .select({ 
        createdAt: designRequestComments.createdAt, 
        designRequestId: designRequestComments.designRequestId 
      })
      .from(designRequestComments)
      .innerJoin(designRequests, eq(designRequestComments.designRequestId, designRequests.id))
      .where(eq(designRequests.userId, userId))
      .orderBy(desc(designRequestComments.createdAt))
      .limit(1);
    
    // Collect all timestamps
    const timestamps = [];
    
    if (designRequest.length > 0) {
      timestamps.push(designRequest[0].createdAt);
    }
    
    if (quoteRequest.length > 0) {
      timestamps.push(quoteRequest[0].createdAt);
    }
    
    if (customRequest.length > 0) {
      timestamps.push(customRequest[0].createdAt);
    }
    
    if (userOrder.length > 0) {
      timestamps.push(userOrder[0].createdAt);
    }
    
    if (designComment.length > 0) {
      timestamps.push(designComment[0].createdAt);
    }
    
    // Find the most recent timestamp
    if (timestamps.length === 0) {
      return null;
    }
    
    // Sort timestamps in descending order and take the first one
    if (timestamps.length > 0) {
      // Make sure we sort as dates
      timestamps.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });
      // Convert to string before returning
      return typeof timestamps[0] === 'string' ? timestamps[0] : timestamps[0].toString();
    }
    return null;
  }

  async deleteUser(loginIDOrId: string | number): Promise<boolean> {
    if (typeof loginIDOrId === 'string') {
      // Delete by loginID
      await db.delete(users).where(eq(users.loginID, loginIDOrId));
    } else {
      // Delete by id
      await db.delete(users).where(eq(users.id, loginIDOrId));
    }
    return true;
  }
  
  // Password reset methods
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.verificationToken, token));
    return user;
  }
  
  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    console.log(`[STORAGE] Looking for user with reset token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    
    if (!token || token.trim() === '') {
      console.log('[STORAGE] Empty or undefined token provided');
      return undefined;
    }
    
    // Ensure we use the exact token string in the query
    const [user] = await db.select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    
    console.log(`[STORAGE] User search result: ${user ? `Found user ID ${user.id}` : 'No user found'}`);
    
    if (!user) {
      console.log('[STORAGE] No user found with this reset token');
      return undefined;
    }
    
    if (!user.passwordResetExpires) {
      console.log('[STORAGE] User found but passwordResetExpires is null');
      return undefined;
    }
    
    // Check if the token has expired
    const now = new Date();
    console.log(`[STORAGE] Token expires: ${user.passwordResetExpires.toISOString()}, Current time: ${now.toISOString()}`);
    
    if (now > user.passwordResetExpires) {
      console.log('[STORAGE] Token has expired, clearing it from user record');
      // Token expired, clear it
      await db.update(users)
        .set({ 
          passwordResetToken: null,
          passwordResetExpires: null 
        })
        .where(eq(users.id, user.id));
      return undefined;
    }
    
    console.log('[STORAGE] Valid token found, returning user');
    return user;
  }
  
  async createPasswordResetToken(email: string): Promise<{ token: string; user: User } | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return undefined;
    }

    // Generate a random token
    const token = randomBytes(32).toString('hex');
    
    // Set token expiration to 1 hour from now
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);
    
    // Update user with reset token and expiration
    const [updatedUser] = await db.update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiration
      })
      .where(eq(users.id, user.id))
      .returning();
    
    return { token, user: updatedUser };
  }
  
  async resetPassword(token: string, newPassword: string): Promise<User | undefined> {
    console.log(`[STORAGE] Reset password request with token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    
    const user = await this.getUserByPasswordResetToken(token);
    if (!user) {
      console.log(`[STORAGE] Failed to reset password - invalid or expired token`);
      return undefined;
    }

    try {
      console.log(`[STORAGE] Valid token found for user ID ${user.id}, proceeding with password reset`);
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      console.log(`[STORAGE] Password hashed successfully, updating user record`);
      
      // Update the user with new password and clear reset token
      const [updatedUser] = await db.update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null
        })
        .where(eq(users.id, user.id))
        .returning();
      
      console.log(`[STORAGE] Password reset successful for user ID ${updatedUser.id}`);
      return updatedUser;
    } catch (error) {
      console.error(`[STORAGE] Error during password reset:`, error);
      throw error;
    }
  }
  
  // Implementation for remaining methods...
  // This is just a placeholder - we'll focus on the metal, stone, and product type methods

  // Metal Type methods
  async getMetalType(id: number): Promise<MetalType | undefined> {
    const [metalType] = await db.select().from(metalTypes).where(eq(metalTypes.id, id));
    return metalType;
  }

  async getAllMetalTypes(): Promise<MetalType[]> {
    return db.select().from(metalTypes).orderBy(asc(metalTypes.name));
  }

  async createMetalType(metalType: InsertMetalType): Promise<MetalType> {
    const [newMetalType] = await db.insert(metalTypes).values(metalType).returning();
    return newMetalType;
  }

  async updateMetalType(id: number, metalTypeUpdate: Partial<InsertMetalType>): Promise<MetalType | undefined> {
    const [updatedMetalType] = await db
      .update(metalTypes)
      .set(metalTypeUpdate)
      .where(eq(metalTypes.id, id))
      .returning();
    return updatedMetalType;
  }

  async deleteMetalType(id: number): Promise<boolean> {
    const result = await db.delete(metalTypes).where(eq(metalTypes.id, id));
    return !!result;
  }
  
  async getMetalTypeById(metalTypeId: string): Promise<MetalType | undefined> {
    try {
      // Try to parse as number first
      const id = parseInt(metalTypeId);
      if (!isNaN(id)) {
        return this.getMetalType(id);
      }
      
      // Otherwise search by name
      const [metalType] = await db
        .select()
        .from(metalTypes)
        .where(eq(metalTypes.name, metalTypeId))
        .limit(1);
      return metalType;
    } catch (error) {
      console.error("Error fetching metal type by ID/name:", error);
      return undefined;
    }
  }

  // Stone Type methods
  
  // Helper function to map database stone type to StoneType format
  private mapDbStoneTypeToStoneType(dbStoneType: any): StoneType {
    if (!dbStoneType) {
      throw new Error("Attempted to map a null or undefined database stone type");
    }
    
    console.log(`Mapping stone type ${dbStoneType.name} - Raw data:`, JSON.stringify(dbStoneType));
    
    // Determine whether we have snake_case or camelCase properties in the source
    const hasSnakeCase = 'price_modifier' in dbStoneType;
    const hasCamelCase = 'priceModifier' in dbStoneType;
    
    // Handle price depending on which format it's in
    let price: number;
    if (hasSnakeCase && dbStoneType.price_modifier !== undefined && dbStoneType.price_modifier !== null) {
      price = dbStoneType.price_modifier;
      console.log(`Using snake_case price for ${dbStoneType.name}: ${price}`);
    } else if (hasCamelCase && dbStoneType.priceModifier !== undefined && dbStoneType.priceModifier !== null) {
      price = dbStoneType.priceModifier;
      console.log(`Using camelCase price for ${dbStoneType.name}: ${price}`);
    } else {
      // Direct query from SQL might have it as a raw column name
      price = dbStoneType.price_modifier || 500; // Default if all else fails
      console.log(`Fallback price for ${dbStoneType.name}: ${price}`);
    }
    
    // Create the mapped StoneType object with proper property names, handling both formats
    const stoneTypeObj: StoneType = {
      id: dbStoneType.id,
      name: dbStoneType.name,
      description: dbStoneType.description,
      // Use the determined price
      priceModifier: price,
      // Handle other fields similarly - try camelCase first, then snake_case
      displayOrder: dbStoneType.displayOrder || dbStoneType.display_order || 0,
      isActive: dbStoneType.isActive !== undefined ? dbStoneType.isActive : 
                dbStoneType.is_active !== undefined ? dbStoneType.is_active : true,
      color: dbStoneType.color,
      imageUrl: dbStoneType.imageUrl || dbStoneType.image_url,
      category: dbStoneType.category,
      stoneForm: dbStoneType.stoneForm || dbStoneType.stone_form,
      quality: dbStoneType.quality,
      size: dbStoneType.size,
      createdAt: dbStoneType.createdAt || dbStoneType.created_at
    };
    
    console.log(`Mapped stone ${dbStoneType.name} - priceModifier set to: ${stoneTypeObj.priceModifier}`);
    
    return stoneTypeObj;
  }
  
  async getStoneType(id: number): Promise<StoneType | undefined> {
    try {
      const [stoneType] = await db.select().from(stoneTypes).where(eq(stoneTypes.id, id));
      
      if (!stoneType) return undefined;
      
      try {
        // Map to StoneType format with correct property names
        return this.mapDbStoneTypeToStoneType(stoneType);
      } catch (e) {
        console.error(`Error mapping stone type with ID ${id}:`, e);
        return undefined;
      }
    } catch (error) {
      console.error(`Error fetching stone type with ID ${id}:`, error);
      return undefined;
    }
  }

  async getAllStoneTypes(): Promise<StoneType[]> {
    try {
      const stoneTypesList = await db.select().from(stoneTypes).orderBy(asc(stoneTypes.name));
      
      console.log(`Retrieved ${stoneTypesList.length} raw stone types from DB`);
      
      // Log raw data for first few items to see field names
      for (let i = 0; i < Math.min(3, stoneTypesList.length); i++) {
        const stone = stoneTypesList[i];
        console.log(`Raw stone data ${i + 1}:`, JSON.stringify(stone));
        // Check if fields are accessed via snake_case or camelCase
        const hasSnakeCase = 'price_modifier' in stone;
        const hasCamelCase = 'priceModifier' in stone;
        console.log(`Stone ${stone.name} has snake_case fields: ${hasSnakeCase}, camelCase fields: ${hasCamelCase}`);
        
        // Logging the actual value regardless of property name
        console.log(`Stone ${stone.name} price value: snake_case=${stone.price_modifier}, camelCase=${stone.priceModifier}`);
      }
      
      // Map each stone type to the correct format with safety checks
      const mappedStoneTypes: StoneType[] = [];
      
      for (const stone of stoneTypesList) {
        if (stone) {
          try {
            const mappedStone = this.mapDbStoneTypeToStoneType(stone);
            mappedStoneTypes.push(mappedStone);
            
            // Debug the mapping to see if priceModifier is preserved
            if (mappedStone.name === "Semi-Precious Beads") {
              console.log(`Special debug - Semi-Precious Beads: Original price_modifier=${stone.price_modifier}, Mapped priceModifier=${mappedStone.priceModifier}`);
            }
          } catch (mapError) {
            console.error(`Error mapping stone type with ID ${stone.id}:`, mapError);
            // Skip this stone type and continue processing others
          }
        }
      }
      
      return mappedStoneTypes;
    } catch (error) {
      console.error("Error fetching all stone types:", error);
      return [];
    }
  }

  async createStoneType(stoneType: InsertStoneType): Promise<StoneType> {
    try {
      const [newStoneType] = await db.insert(stoneTypes).values(stoneType).returning();
      return this.mapDbStoneTypeToStoneType(newStoneType);
    } catch (error) {
      console.error("Error creating stone type:", error);
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
      
      if (!updatedStoneType) return undefined;
      
      // Map the returned database object to the StoneType format
      return this.mapDbStoneTypeToStoneType(updatedStoneType);
    } catch (error) {
      console.error(`Error updating stone type with ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteStoneType(id: number): Promise<boolean> {
    const result = await db.delete(stoneTypes).where(eq(stoneTypes.id, id));
    return !!result;
  }
  
  async getStoneTypeById(stoneTypeId: string): Promise<StoneType | undefined> {
    try {
      // Try to parse as number first
      const id = parseInt(stoneTypeId);
      if (!isNaN(id)) {
        return this.getStoneType(id);
      }
      
      // Otherwise search by name and map the result
      const [stoneType] = await db
        .select()
        .from(stoneTypes)
        .where(eq(stoneTypes.name, stoneTypeId))
        .limit(1);
        
      if (!stoneType) return undefined;
      
      try {
        // Use helper function to map the database result to the StoneType format
        return this.mapDbStoneTypeToStoneType(stoneType);
      } catch (mapError) {
        console.error(`Error mapping stone type with name "${stoneTypeId}":`, mapError);
        return undefined;
      }
    } catch (error) {
      console.error("Error fetching stone type by ID/name:", error);
      return undefined;
    }
  }
  
  async getStoneTypeByName(name: string): Promise<StoneType | undefined> {
    try {
      if (!name) {
        return undefined;
      }
      
      // First try exact match
      const [stoneType] = await db
        .select()
        .from(stoneTypes)
        .where(eq(stoneTypes.name, name))
        .limit(1);
      
      if (stoneType) {
        try {
          console.log(`RAW STONE TYPE DATA for ${name}:`, stoneType);
          
          // Check if price data exists and is accessible
          if (stoneType.priceModifier) {
            console.log(`Found price in field 'priceModifier' with value: ${stoneType.priceModifier}`);
          } else if (stoneType.price_modifier) {
            console.log(`Found price in field 'price_modifier' with value: ${stoneType.price_modifier}`);
          } else {
            console.log(`No price found in either 'priceModifier' or 'price_modifier' for ${name}`);
          }
          
          // Use helper function for consistent mapping
          const result = this.mapDbStoneTypeToStoneType(stoneType);
          console.log(`Formatted stone ${name} with price: ${result.priceModifier}`);
          return result;
        } catch (mapError) {
          console.error(`Error mapping stone type with name "${name}":`, mapError);
          // Continue to try case-insensitive search
        }
      }
      
      // Try with case-insensitive search if exact match fails
      const [stoneTypeCaseInsensitive] = await db
        .select()
        .from(stoneTypes)
        .where(sql`LOWER(${stoneTypes.name}) = LOWER(${name})`)
        .limit(1);
        
      if (!stoneTypeCaseInsensitive) return undefined;
      
      try {
        // Use helper function for case-insensitive match too
        return this.mapDbStoneTypeToStoneType(stoneTypeCaseInsensitive);
      } catch (mapError) {
        console.error(`Error mapping stone type with case-insensitive name "${name}":`, mapError);
        return undefined;
      }
    } catch (error) {
      console.error(`Error fetching stone type by name "${name}":`, error);
      return undefined;
    }
  }

  // Product-Stone methods
  async getProductStones(productId: number): Promise<StoneType[]> {
    try {
      const stones = await db
        .select()
        .from(stoneTypes)
        .innerJoin(
          productStones, 
          eq(productStones.stoneTypeId, stoneTypes.id)
        )
        .where(eq(productStones.productId, productId));
      
      // Map the joined results to StoneType format
      return stones.map(stone => ({
        id: stone.stone_types.id,
        name: stone.stone_types.name,
        description: stone.stone_types.description,
        priceModifier: stone.stone_types.price_modifier,
        displayOrder: stone.stone_types.display_order,
        isActive: stone.stone_types.is_active,
        color: stone.stone_types.color,
        imageUrl: stone.stone_types.image_url,
        category: stone.stone_types.category,
        stoneForm: stone.stone_types.stone_form,
        quality: stone.stone_types.quality,
        size: stone.stone_types.size,
        createdAt: stone.stone_types.created_at
      }));
    } catch (error) {
      console.error(`Error fetching stones for product ID ${productId}:`, error);
      return [];
    }
  }

  async addProductStones(productId: number, stoneTypeIds: number[]): Promise<void> {
    // Skip if no stone IDs are provided
    if (!stoneTypeIds || stoneTypeIds.length === 0) return;

    // Create product-stone entries
    const productStoneEntries = stoneTypeIds.map(stoneTypeId => ({
      productId,
      stoneTypeId
    }));

    await db.insert(productStones).values(productStoneEntries);
  }

  async updateProductStones(productId: number, stoneTypeIds: number[]): Promise<void> {
    // Remove existing relations first
    await db.delete(productStones).where(eq(productStones.productId, productId));
    
    // Add new relations
    await this.addProductStones(productId, stoneTypeIds);
  }

  async removeProductStone(productId: number, stoneTypeId: number): Promise<boolean> {
    const result = await db
      .delete(productStones)
      .where(
        and(
          eq(productStones.productId, productId),
          eq(productStones.stoneTypeId, stoneTypeId)
        )
      );
    return !!result;
  }

  // Product Type methods
  async getProductType(id: number): Promise<ProductType | undefined> {
    const [productType] = await db.select().from(productTypes).where(eq(productTypes.id, id));
    return productType;
  }

  async getAllProductTypes(): Promise<ProductType[]> {
    return db.select().from(productTypes).orderBy(asc(productTypes.name));
  }

  async getActiveProductTypes(): Promise<ProductType[]> {
    return db
      .select()
      .from(productTypes)
      .where(eq(productTypes.isActive, true))
      .orderBy(asc(productTypes.name));
  }

  async createProductType(productType: InsertProductType): Promise<ProductType> {
    const [newProductType] = await db.insert(productTypes).values(productType).returning();
    return newProductType;
  }

  async updateProductType(id: number, productTypeUpdate: Partial<InsertProductType>): Promise<ProductType | undefined> {
    const [updatedProductType] = await db
      .update(productTypes)
      .set(productTypeUpdate)
      .where(eq(productTypes.id, id))
      .returning();
    return updatedProductType;
  }

  async deleteProductType(id: number): Promise<boolean> {
    const result = await db.delete(productTypes).where(eq(productTypes.id, id));
    return !!result;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      return undefined;
    }
  }
  
  async getProductById(id: number): Promise<Product | undefined> { 
    return this.getProduct(id); 
  }
  
  async getAllProducts(): Promise<Product[]> {
    try {
      return await db.select().from(products).orderBy(desc(products.createdAt));
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      return await db
        .select()
        .from(products)
        .where(eq(products.isFeatured, true))
        .orderBy(desc(products.createdAt))
        .limit(6);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return [];
    }
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      return await db
        .select()
        .from(products)
        .where(eq(products.category, category))
        .orderBy(desc(products.createdAt));
    } catch (error) {
      console.error(`Error fetching products by category ${category}:`, error);
      return [];
    }
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const [newProduct] = await db.insert(products).values(product).returning();
      return newProduct;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }
  
  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      // Handle additionalImages field if it's present
      if (productUpdate.additionalImages !== undefined) {
        // Convert additionalImages to the correct format
        const additionalImagesJson = Array.isArray(productUpdate.additionalImages) 
          ? productUpdate.additionalImages 
          : [];
          
        console.log("Processing additionalImages for update:", {
          originalType: typeof productUpdate.additionalImages,
          isArray: Array.isArray(productUpdate.additionalImages),
          value: productUpdate.additionalImages,
          processed: additionalImagesJson
        });
        
        // Replace the additionalImages with the processed array
        productUpdate = {
          ...productUpdate,
          additionalImages: additionalImagesJson
        };
      }
      
      // Log the update attempt
      console.log(`Updating product ${id} with data:`, {
        keys: Object.keys(productUpdate),
        hasAdditionalImages: productUpdate.additionalImages !== undefined,
        additionalImagesType: productUpdate.additionalImages !== undefined 
          ? (Array.isArray(productUpdate.additionalImages) ? "array" : typeof productUpdate.additionalImages)
          : "undefined"
      });
      
      const [updatedProduct] = await db
        .update(products)
        .set(productUpdate)
        .where(eq(products.id, id))
        .returning();
        
      if (!updatedProduct) {
        console.error(`No product returned after update for ID ${id}`);
      } else {
        console.log(`Successfully updated product ${id}, retrieved product with fields:`, Object.keys(updatedProduct));
      }
      
      return updatedProduct;
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      console.error("Update error details:", JSON.stringify(productUpdate, null, 2));
      return undefined;
    }
  }
  
  async updateProductAiInputs(id: number, aiInputs: any): Promise<Product | undefined> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({ aiInputs })
        .where(eq(products.id, id))
        .returning();
      return updatedProduct;
    } catch (error) {
      console.error(`Error updating product AI inputs with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      return false;
    }
  }
  
  // Placeholder implementations for other required methods
  // This will be implemented in the real code, we'll just add stubs here to make TypeScript happy
  async createCustomizationRequest(request: any): Promise<any> {
    try {
      const [newRequest] = await db
        .insert(customizationRequests)
        .values(request)
        .returning();
      
      console.log("Created new customization request:", newRequest);
      return newRequest;
    } catch (error) {
      console.error("Error creating customization request:", error);
      throw new Error(`Failed to create customization request: ${error.message}`);
    }
  }
  
  async getCustomizationRequestsByUserId(userId: number): Promise<any[]> {
    try {
      const requests = await db
        .select()
        .from(customizationRequests)
        .where(eq(customizationRequests.userId, userId))
        .orderBy(desc(customizationRequests.createdAt));
        
      console.log(`Found ${requests.length} customization requests for user ID ${userId}`);
      return requests;
    } catch (error) {
      console.error(`Error fetching customization requests for user ID ${userId}:`, error);
      return [];
    }
  }
  
  async getAllCustomizationRequests(): Promise<any[]> {
    try {
      const allRequests = await db
        .select()
        .from(customizationRequests)
        .orderBy(desc(customizationRequests.createdAt));
        
      console.log(`Found ${allRequests.length} total customization requests`);
      return allRequests;
    } catch (error) {
      console.error("Error fetching all customization requests:", error);
      return [];
    }
  }
  
  async updateCustomizationRequestStatus(id: number, status: string): Promise<any> {
    try {
      const [updatedRequest] = await db
        .update(customizationRequests)
        .set({ status })
        .where(eq(customizationRequests.id, id))
        .returning();
        
      console.log(`Updated customization request ${id} status to ${status}`);
      return updatedRequest;
    } catch (error) {
      console.error(`Error updating customization request status for ID ${id}:`, error);
      return {};
    }
  }
  async getOrdersByUserId(userId: number): Promise<any[]> { return []; }
  
  async getDesignRequest(id: number): Promise<DesignRequest | undefined> {
    try {
      const [request] = await db
        .select()
        .from(designRequests)
        .where(eq(designRequests.id, id))
        .limit(1);
      
      return request;
    } catch (error) {
      console.error(`Error fetching design request with ID ${id}:`, error);
      return undefined;
    }
  }
  async getAllDesignRequests(): Promise<DesignRequest[]> {
    try {
      const allDesignRequests = await db.select().from(designRequests).orderBy(desc(designRequests.createdAt));
      return allDesignRequests;
    } catch (error) {
      console.error("Error fetching all design requests:", error);
      return [];
    }
  }
  
  async getAllCustomDesigns(): Promise<DesignRequest[]> { 
    // For API consistency, we're using getAllCustomDesigns as an alias for getAllDesignRequests
    return this.getAllDesignRequests(); 
  }
  
  async getDesignRequestsByEmail(email: string): Promise<DesignRequest[]> {
    try {
      const requests = await db
        .select()
        .from(designRequests)
        .where(eq(designRequests.email, email))
        .orderBy(desc(designRequests.createdAt));
      return requests;
    } catch (error) {
      console.error(`Error fetching design requests for email ${email}:`, error);
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
      console.error(`Error fetching design requests for user ID ${userId}:`, error);
      return [];
    }
  }
  
  async getCustomDesignsByStatus(statusList: string[]): Promise<DesignRequest[]> {
    try {
      if (!statusList || statusList.length === 0) {
        return this.getAllDesignRequests();
      }
      
      const requests = await db
        .select()
        .from(designRequests)
        .where(sql`${designRequests.status} IN (${statusList.join(',')})`)
        .orderBy(desc(designRequests.createdAt));
      return requests;
    } catch (error) {
      console.error(`Error fetching design requests with status in [${statusList}]:`, error);
      return [];
    }
  }
  
  async createDesignRequest(designRequest: InsertDesignRequest): Promise<DesignRequest> {
    try {
      const [newRequest] = await db
        .insert(designRequests)
        .values(designRequest)
        .returning();
      
      console.log("Created new design request:", newRequest);
      return newRequest;
    } catch (error) {
      console.error("Error creating design request:", error);
      throw new Error(`Failed to create design request: ${error.message}`);
    }
  }
  
  async updateDesignRequest(id: number, designRequest: Partial<DesignRequest>): Promise<DesignRequest | undefined> {
    try {
      const [updatedRequest] = await db
        .update(designRequests)
        .set(designRequest)
        .where(eq(designRequests.id, id))
        .returning();
      
      return updatedRequest;
    } catch (error) {
      console.error(`Error updating design request ID ${id}:`, error);
      return undefined;
    }
  }
  async getDesignRequestComments(designRequestId: number): Promise<DesignRequestComment[]> {
    try {
      // Get all comments for the specified design request, ordered by creation date
      const comments = await db
        .select()
        .from(designRequestComments)
        .where(eq(designRequestComments.designRequestId, designRequestId))
        .orderBy(asc(designRequestComments.createdAt));
      
      console.log(`Retrieved ${comments.length} comments for design request ID ${designRequestId}`);
      return comments;
    } catch (error) {
      console.error(`Error fetching comments for design request ID ${designRequestId}:`, error);
      return [];
    }
  }
  
  async addDesignRequestComment(comment: InsertDesignRequestComment): Promise<DesignRequestComment> {
    try {
      // Insert the new comment
      const [newComment] = await db
        .insert(designRequestComments)
        .values(comment)
        .returning();
      
      console.log(`Added new comment ID ${newComment.id} to design request ID ${comment.designRequestId}`);
      return newComment;
    } catch (error) {
      console.error(`Error adding comment to design request ID ${comment.designRequestId}:`, error);
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }
  async getDesignFeedback(designRequestId: number): Promise<DesignFeedback[]> { return []; }
  async addDesignFeedback(feedback: InsertDesignFeedback): Promise<DesignFeedback> { return {} as DesignFeedback; }
  async getDesignPayments(designRequestId: number): Promise<DesignPayment[]> { return []; }
  async addDesignPayment(payment: InsertDesignPayment): Promise<DesignPayment> { return {} as DesignPayment; }
  async updateDesignPaymentStatus(id: number, status: string): Promise<DesignPayment | undefined> { return undefined; }
  async getCustomizationRequest(id: number): Promise<CustomizationRequest | undefined> {
    try {
      const [request] = await db
        .select()
        .from(customizationRequests)
        .where(eq(customizationRequests.id, id))
        .limit(1);
      
      return request;
    } catch (error) {
      console.error(`Error fetching customization request with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getCustomizationRequestsByEmail(email: string): Promise<CustomizationRequest[]> {
    try {
      const requests = await db
        .select()
        .from(customizationRequests)
        .where(eq(customizationRequests.email, email))
        .orderBy(desc(customizationRequests.createdAt));
        
      console.log(`Found ${requests.length} customization requests for email ${email}`);
      return requests;
    } catch (error) {
      console.error(`Error fetching customization requests for email ${email}:`, error);
      return [];
    }
  }
  
  async createCustomizationRequest(request: InsertCustomizationRequest): Promise<CustomizationRequest> {
    // This will supersede the earlier method once TypeScript has been fully migrated
    try {
      const [newRequest] = await db
        .insert(customizationRequests)
        .values(request)
        .returning();
      
      console.log("Created new customization request with typed schema:", newRequest);
      return newRequest;
    } catch (error) {
      console.error("Error creating customization request with typed schema:", error);
      throw new Error(`Failed to create customization request: ${error.message}`);
    }
  }
  
  async updateCustomizationRequest(id: number, request: Partial<CustomizationRequest>): Promise<CustomizationRequest | undefined> {
    try {
      const [updatedRequest] = await db
        .update(customizationRequests)
        .set(request)
        .where(eq(customizationRequests.id, id))
        .returning();
      
      return updatedRequest;
    } catch (error) {
      console.error(`Error updating customization request ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getCustomizationRequestComments(requestId: number): Promise<CustomizationRequestComment[]> {
    try {
      const comments = await db
        .select()
        .from(customizationRequestComments)
        .where(eq(customizationRequestComments.customizationRequestId, requestId))
        .orderBy(asc(customizationRequestComments.id));
      
      return comments;
    } catch (error) {
      console.error(`Error fetching comments for customization request ID ${requestId}:`, error);
      return [];
    }
  }
  
  async addCustomizationRequestComment(comment: InsertCustomizationRequestComment): Promise<CustomizationRequestComment> {
    try {
      const [newComment] = await db
        .insert(customizationRequestComments)
        .values(comment)
        .returning();
      
      return newComment;
    } catch (error) {
      console.error("Error adding customization request comment:", error);
      throw new Error(`Failed to add customization request comment: ${error.message}`);
    }
  }
  async getQuoteRequest(id: number): Promise<QuoteRequest | undefined> {
    try {
      const [request] = await db
        .select()
        .from(quoteRequests)
        .where(eq(quoteRequests.id, id))
        .limit(1);
      
      return request;
    } catch (error) {
      console.error(`Error fetching quote request with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getAllQuoteRequests(): Promise<QuoteRequest[]> {
    try {
      const allRequests = await db
        .select()
        .from(quoteRequests)
        .orderBy(desc(quoteRequests.createdAt));
        
      console.log(`Found ${allRequests.length} total quote requests`);
      return allRequests;
    } catch (error) {
      console.error("Error fetching all quote requests:", error);
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
        
      console.log(`Found ${requests.length} quote requests for email ${email}`);
      return requests;
    } catch (error) {
      console.error(`Error fetching quote requests for email ${email}:`, error);
      return [];
    }
  }
  
  async getQuoteRequestsByUserId(userId: number): Promise<QuoteRequest[]> {
    try {
      const requests = await db
        .select()
        .from(quoteRequests)
        .where(eq(quoteRequests.userId, userId))
        .orderBy(desc(quoteRequests.createdAt));
        
      console.log(`Found ${requests.length} quote requests for user ID ${userId}`);
      return requests;
    } catch (error) {
      console.error(`Error fetching quote requests for user ID ${userId}:`, error);
      return [];
    }
  }
  
  async createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest> {
    try {
      const [newRequest] = await db
        .insert(quoteRequests)
        .values(request)
        .returning();
      
      console.log("Created new quote request:", newRequest);
      return newRequest;
    } catch (error) {
      console.error("Error creating quote request:", error);
      throw new Error(`Failed to create quote request: ${(error as Error).message}`);
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
      console.error(`Error updating quote request ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getQuoteRequestComments(requestId: number): Promise<QuoteRequestComment[]> {
    try {
      const comments = await db
        .select()
        .from(quoteRequestComments)
        .where(eq(quoteRequestComments.quoteRequestId, requestId))
        .orderBy(asc(quoteRequestComments.id));
      
      return comments;
    } catch (error) {
      console.error(`Error fetching comments for quote request ID ${requestId}:`, error);
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
      throw new Error(`Failed to add quote request comment: ${(error as Error).message}`);
    }
  }
  async getCartItem(id: number): Promise<CartItem | undefined> { return undefined; }
  async getCartItemsBySession(sessionId: string): Promise<CartItem[]> { return []; }
  async getCartItemsByUser(userId: number): Promise<CartItem[]> { return []; }
  async createCartItem(cartItem: InsertCartItem): Promise<CartItem> { return {} as CartItem; }
  async updateCartItem(id: number, cartItem: Partial<CartItem>): Promise<CartItem | undefined> { return undefined; }
  async deleteCartItem(id: number): Promise<boolean> { return true; }
  async clearCart(sessionId: string): Promise<boolean> { return true; }
  async getOrder(id: number): Promise<Order | undefined> { return undefined; }
  async getAllOrders(): Promise<Order[]> { return []; }
  async getOrdersBySession(sessionId: string): Promise<Order[]> { return []; }
  async getOrdersByUser(userId: number): Promise<Order[]> { return []; }
  async createOrder(order: InsertOrder): Promise<Order> { return {} as Order; }
  async updateOrder(id: number, order: Partial<Order>): Promise<Order | undefined> { return undefined; }
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> { return []; }
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> { return {} as OrderItem; }
  async getAllTestimonials(): Promise<Testimonial[]> { return []; }
  async getApprovedTestimonials(): Promise<Testimonial[]> { return []; }
  async getTestimonials(options?: { userId?: number, status?: string, limit?: number, approved?: boolean }): Promise<Testimonial[]> { return []; }
  async getTestimonialById(id: number): Promise<Testimonial | undefined> { return undefined; }
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> { return {} as Testimonial; }
  async updateTestimonial(id: number, testimonial: Partial<Testimonial>): Promise<Testimonial | undefined> { return undefined; }
  async deleteTestimonial(id: number): Promise<boolean> { return true; }
  async getAllContactMessages(): Promise<ContactMessage[]> {
    // Fetch all messages from the database, ordered by creation date (newest first)
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    // Insert into the database and return
    const [result] = await db.insert(contactMessages).values(message).returning();
    return result;
  }
  async markContactMessageAsRead(id: number): Promise<boolean> {
    try {
      await db.update(contactMessages)
        .set({ isRead: true })
        .where(eq(contactMessages.id, id));
      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }
  async deleteContactMessage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(contactMessages)
        .where(eq(contactMessages.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting contact message:", error);
      return false;
    }
  }

}

export const storage = new DatabaseStorage();