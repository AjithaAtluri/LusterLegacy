import { pgTable, text, serial, integer, boolean, real, timestamp, json, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users schema (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").default(false), // Track email verification status
  verificationToken: text("verification_token"), // Store email verification token
  phone: text("phone"),
  country: text("country"),
  role: text("role").notNull().default("customer"), // "admin", "limited-admin", or "customer"
  createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  designRequests: many(designRequests),
  cartItems: many(cartItems),
  orders: many(orders),
  testimonials: many(testimonials)
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  country: true,
  role: true,
});

// Products schema
// Define the AI inputs interface
export interface AIInputs {
  productType: string;
  metalType: string;
  metalWeight?: number;
  primaryGems?: Array<{ name: string; carats?: number }>;
  userDescription?: string; // Kept in AI inputs for additional details for generation
  imageUrls?: string[];
  otherStoneType?: string;
  otherStoneWeight?: number;
}

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  basePrice: integer("base_price").notNull(), // in INR
  imageUrl: text("image_url").notNull(),
  additionalImages: json("additional_images").$type<string[]>(),
  details: text("details"),
  dimensions: text("dimensions"),
  isNew: boolean("is_new").default(false),
  isBestseller: boolean("is_bestseller").default(false),
  isFeatured: boolean("is_featured").default(false),
  category: text("category"), // Legacy field for backward compatibility
  productTypeId: integer("product_type_id").references(() => productTypes.id), // Reference to product types table
  // Store AI input parameters for regeneration
  aiInputs: json("ai_inputs").$type<AIInputs>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Products relations defined below

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  basePrice: true,
  imageUrl: true,
  additionalImages: true,
  details: true,
  dimensions: true,
  isNew: true,
  isBestseller: true,
  isFeatured: true,
  category: true,
  productTypeId: true,
  aiInputs: true,
});

// Custom design requests schema
export const designRequests = pgTable("design_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country"),
  metalType: text("metal_type").notNull(),
  primaryStone: text("primary_stone"), // Keep for backward compatibility
  // Using text array type for PostgreSQL instead of JSON - this is more reliable
  primaryStones: text("primary_stones").array().notNull().default([]),
  notes: text("notes"),
  imageUrl: text("image_url").notNull(), // Main image (for backward compatibility)
  imageUrls: text("image_urls").array().notNull().default([]), // Array of additional images
  status: text("status").notNull().default("pending_acceptance"), // New workflow states
  consultationFeePaid: boolean("consultation_fee_paid").notNull().default(false),
  initialEstimate: integer("initial_estimate"), // Initial estimate before payment
  finalEstimate: integer("final_estimate"), // Final estimate after design approval
  iterationsCount: integer("iterations_count").notNull().default(0), // Track number of design iterations
  estimatedPrice: integer("estimated_price"), // Keep for backward compatibility
  cadImageUrl: text("cad_image_url"), // Keep for backward compatibility
  details: text("details"), // JSON string with additional details (for metalTypeId, stoneTypeId etc.)
  createdAt: timestamp("created_at").defaultNow()
});

export const designRequestsRelations = relations(designRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [designRequests.userId],
    references: [users.id]
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems)
}));

// Base schema from Drizzle
const baseDesignRequestSchema = createInsertSchema(designRequests).pick({
  userId: true,
  fullName: true,
  email: true,
  phone: true,
  country: true,
  metalType: true,
  primaryStone: true, // Keep for backward compatibility
  notes: true,
  imageUrl: true,
  imageUrls: true, // Include imageUrls field for multiple images
});

// Extended schema with explicit array validation for primaryStones and imageUrls
export const insertDesignRequestSchema = baseDesignRequestSchema.extend({
  // Override primaryStones to ensure it's an array of strings
  primaryStones: z.array(z.string()).default([]),
  // Ensure imageUrls is an array of strings
  imageUrls: z.array(z.string()).default([]),
});

// Design request comments schema
export const designRequestComments = pgTable("design_request_comments", {
  id: serial("id").primaryKey(),
  designRequestId: integer("design_request_id").notNull().references(() => designRequests.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  imageUrl: text("image_url"), // Single image URL for comment image
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow()
});

export const designRequestCommentsRelations = relations(designRequestComments, ({ one }) => ({
  designRequest: one(designRequests, {
    fields: [designRequestComments.designRequestId],
    references: [designRequests.id]
  })
}));

export const insertDesignRequestCommentSchema = createInsertSchema(designRequestComments).pick({
  designRequestId: true,
  content: true,
  createdBy: true,
  isAdmin: true,
  imageUrl: true,
  userId: true,
});

// Design feedback schema (for advanced chat functionality)
export const designFeedback = pgTable("design_feedback", {
  id: serial("id").primaryKey(),
  designRequestId: integer("design_request_id").notNull().references(() => designRequests.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  content: text("content").notNull(),
  isFromAdmin: boolean("is_from_admin").notNull().default(false),
  imageUrls: text("image_urls").array().default([]),
  createdAt: timestamp("created_at").defaultNow()
});

export const designFeedbackRelations = relations(designFeedback, ({ one }) => ({
  designRequest: one(designRequests, {
    fields: [designFeedback.designRequestId],
    references: [designRequests.id]
  }),
  user: one(users, {
    fields: [designFeedback.userId],
    references: [users.id]
  })
}));

export const insertDesignFeedbackSchema = createInsertSchema(designFeedback).pick({
  designRequestId: true,
  userId: true,
  content: true,
  isFromAdmin: true,
  imageUrls: true,
});

// Product personalization requests schema 
export const customizationRequests = pgTable("customization_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country"),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  originalMetalType: text("original_metal_type").notNull(),
  requestedMetalType: text("requested_metal_type").notNull(),
  originalStoneType: text("original_stone_type").notNull(),
  requestedStoneType: text("requested_stone_type").notNull(),
  additionalNotes: text("additional_notes"),
  status: text("status").notNull().default("pending"), // 'pending', 'quoted', 'approved', 'rejected', 'completed'
  estimatedPrice: integer("estimated_price"),
  imageUrls: text("image_urls").array().default([]), // Reference images provided by customer
  createdAt: timestamp("created_at").defaultNow()
});

export const customizationRequestsRelations = relations(customizationRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [customizationRequests.userId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [customizationRequests.productId],
    references: [products.id]
  }),
  comments: many(customizationRequestComments)
}));

export const insertCustomizationRequestSchema = createInsertSchema(customizationRequests).pick({
  userId: true,
  fullName: true,
  email: true,
  phone: true,
  country: true,
  productId: true,
  originalMetalType: true,
  requestedMetalType: true,
  originalStoneType: true,
  requestedStoneType: true,
  additionalNotes: true,
  imageUrls: true,
});

// Product personalization request comments schema
export const customizationRequestComments = pgTable("customization_request_comments", {
  id: serial("id").primaryKey(),
  customizationRequestId: integer("customization_request_id").notNull().references(() => customizationRequests.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  imageUrl: text("image_url"), // Single image URL for comment image
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow()
});

export const customizationRequestCommentsRelations = relations(customizationRequestComments, ({ one }) => ({
  customizationRequest: one(customizationRequests, {
    fields: [customizationRequestComments.customizationRequestId],
    references: [customizationRequests.id]
  })
}));

export const insertCustomizationRequestCommentSchema = createInsertSchema(customizationRequestComments).pick({
  customizationRequestId: true,
  content: true,
  createdBy: true,
  isAdmin: true,
  imageUrl: true,
  userId: true,
});

// Quote requests for catalog products (no modifications)
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country"),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  metalType: text("metal_type").notNull(),
  stoneType: text("stone_type").notNull(),
  additionalNotes: text("additional_notes"),
  status: text("status").notNull().default("pending"), // 'pending', 'quoted', 'approved', 'rejected', 'completed'
  estimatedPrice: integer("estimated_price"),
  quotedPrice: integer("quoted_price"),
  isReadyToShip: boolean("is_ready_to_ship").default(false),
  currency: text("currency").default("USD"),
  createdAt: timestamp("created_at").defaultNow()
});

export const quoteRequestsRelations = relations(quoteRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [quoteRequests.userId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [quoteRequests.productId],
    references: [products.id]
  }),
  comments: many(quoteRequestComments)
}));

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).pick({
  userId: true,
  fullName: true,
  email: true,
  phone: true, 
  country: true,
  productId: true,
  metalType: true,
  stoneType: true,
  additionalNotes: true,
});

// Quote request comments schema
export const quoteRequestComments = pgTable("quote_request_comments", {
  id: serial("id").primaryKey(),
  quoteRequestId: integer("quote_request_id").notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  imageUrl: text("image_url"), // Single image URL for comment image
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow()
});

export const quoteRequestCommentsRelations = relations(quoteRequestComments, ({ one }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [quoteRequestComments.quoteRequestId],
    references: [quoteRequests.id]
  })
}));

export const insertQuoteRequestCommentSchema = createInsertSchema(quoteRequestComments).pick({
  quoteRequestId: true,
  content: true,
  createdBy: true,
  isAdmin: true,
  imageUrl: true,
  userId: true,
});

// Design payments schema
export const designPayments = pgTable("design_payments", {
  id: serial("id").primaryKey(),
  designRequestId: integer("design_request_id").notNull().references(() => designRequests.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  amount: integer("amount").notNull(),
  paymentType: text("payment_type").notNull(), // 'consultation_fee', 'deposit', 'final_payment'
  paymentMethod: text("payment_method").notNull(), // 'paypal', 'credit_card', etc.
  transactionId: text("transaction_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow()
});

export const designPaymentsRelations = relations(designPayments, ({ one }) => ({
  designRequest: one(designRequests, {
    fields: [designPayments.designRequestId],
    references: [designRequests.id]
  }),
  user: one(users, {
    fields: [designPayments.userId],
    references: [users.id]
  })
}));

export const insertDesignPaymentSchema = createInsertSchema(designPayments).pick({
  designRequestId: true,
  userId: true,
  amount: true,
  paymentType: true,
  paymentMethod: true,
  transactionId: true,
  status: true,
});

// Cart items schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  sessionId: text("session_id"),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  metalTypeId: text("metal_type_id").notNull(),
  stoneTypeId: text("stone_type_id").notNull(),
  price: integer("price").notNull(),
  isCustomDesign: boolean("is_custom_design").default(false),
  designRequestId: integer("design_request_id").references(() => designRequests.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow()
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id]
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id]
  }),
  designRequest: one(designRequests, {
    fields: [cartItems.designRequestId],
    references: [designRequests.id]
  })
}));

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  userId: true,
  sessionId: true,
  productId: true,
  metalTypeId: true,
  stoneTypeId: true,
  price: true,
  isCustomDesign: true,
  designRequestId: true,
});

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  sessionId: text("session_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: json("shipping_address").notNull(),
  specialInstructions: text("special_instructions"),
  totalAmount: integer("total_amount").notNull(),
  advanceAmount: integer("advance_amount").notNull(),
  balanceAmount: integer("balance_amount").notNull(),
  paymentStatus: text("payment_status").notNull().default("advance_paid"), // "advance_paid", "full_paid"
  orderStatus: text("order_status").notNull().default("processing"), // "processing", "shipped", "delivered", "cancelled"
  createdAt: timestamp("created_at").defaultNow()
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  orderItems: many(orderItems)
}));

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  sessionId: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  shippingAddress: true,
  specialInstructions: true,
  totalAmount: true,
  advanceAmount: true,
  balanceAmount: true,
  paymentStatus: true,
  orderStatus: true,
});

// Order items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  metalTypeId: text("metal_type_id").notNull(),
  stoneTypeId: text("stone_type_id").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").default("USD"),
  isCustomDesign: boolean("is_custom_design").default(false),
  designRequestId: integer("design_request_id").references(() => designRequests.id, { onDelete: 'set null' })
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
  designRequest: one(designRequests, {
    fields: [orderItems.designRequestId],
    references: [designRequests.id]
  })
}));

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  metalTypeId: true,
  stoneTypeId: true,
  price: true,
  currency: true,
  isCustomDesign: true,
  designRequestId: true,
});

// Testimonials & Client Stories schema
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  name: text("name").notNull(),
  email: text("email"),
  productType: text("product_type").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(), // Brief testimonial (AI-generated)
  story: text("story"), // Longer client story content (AI-generated)
  initials: text("initials").notNull(),
  location: text("location"), // Client's city/country
  imageUrls: text("image_urls").array().default([]), // Up to 3 images from the client
  // New fields for expanded form
  purchaseType: text("purchase_type"), // 'self', 'gift'
  giftGiver: text("gift_giver"), // Who gave the gift, if not self-purchase
  occasion: text("occasion"), // 'casual', 'birthday', 'wedding', 'special_occasion'
  satisfaction: text("satisfaction"), // 'very_much', 'ok', 'did_not'
  wouldReturn: boolean("would_return").default(true), // Whether they would return for more designs
  // AI generation params/data - stored for reference
  aiInputData: json("ai_input_data"), // Store the inputs that were sent to the AI
  aiGenerationDate: timestamp("ai_generation_date"),
  // Original fields
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'set null' }), // Optional link to the order/purchase
  productId: integer("product_id").references(() => products.id, { onDelete: 'set null' }), // Optional link to specific product
  adminNotes: text("admin_notes"), // Private admin notes about the testimonial
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  isApproved: boolean("is_approved").default(false), // Keeping for backward compatibility
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  user: one(users, {
    fields: [testimonials.userId],
    references: [users.id]
  }),
  order: one(orders, {
    fields: [testimonials.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [testimonials.productId],
    references: [products.id]
  })
}));

export const insertTestimonialSchema = createInsertSchema(testimonials).pick({
  userId: true,
  name: true,
  email: true,
  productType: true,
  rating: true,
  text: true,
  story: true,
  initials: true,
  location: true,
  imageUrls: true,
  // New fields
  purchaseType: true,
  giftGiver: true,
  occasion: true,
  satisfaction: true,
  wouldReturn: true,
  aiInputData: true,
  // Original fields
  orderId: true,
  productId: true,
  status: true,
  isApproved: true,
});

// Contact messages schema
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  phone: true,
  subject: true,
  message: true,
});

// Metal types schema
export const metalTypes = pgTable("metal_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  priceModifier: real("price_modifier").notNull().default(1.0),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  color: text("color"), // hex color code for UI display
  createdAt: timestamp("created_at").defaultNow()
});

export const insertMetalTypeSchema = createInsertSchema(metalTypes).pick({
  name: true,
  description: true,
  priceModifier: true,
  displayOrder: true,
  isActive: true,
  color: true,
});

// Stone types schema
export const stoneTypes = pgTable("stone_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  priceModifier: real("price_modifier").notNull().default(1.0),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  color: text("color"), // hex color code for UI display
  imageUrl: text("image_url"), // optional image of the stone
  // All new parameters are added as nullable/optional
  category: text("category"), // Earth Mined Precious, Semi-Precious, Rare, Popular, Precious Lab Grown, Quartz, Onyx, Commercial
  stoneForm: text("stone_form"), // Beads, Stones, Cabs, Carved, Pota
  quality: text("quality"), // low, medium, high
  size: text("size"), // very small, small, medium, large, very large
  createdAt: timestamp("created_at").defaultNow()
});

export const insertStoneTypeSchema = createInsertSchema(stoneTypes).pick({
  name: true,
  description: true,
  priceModifier: true,
  displayOrder: true,
  isActive: true,
  color: true,
  imageUrl: true,
  category: true,
  stoneForm: true,
  quality: true,
  size: true,
});

// Product stones (many-to-many relationship between products and stone types)
export const productStones = pgTable("product_stones", {
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  stoneTypeId: integer("stone_type_id").notNull().references(() => stoneTypes.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.productId, t.stoneTypeId] }),
}));

export const productStonesRelations = relations(productStones, ({ one }) => ({
  product: one(products, {
    fields: [productStones.productId],
    references: [products.id],
  }),
  stoneType: one(stoneTypes, {
    fields: [productStones.stoneTypeId],
    references: [stoneTypes.id],
  }),
}));

// Update product relations to include stones and product type
export const productsRelations = relations(products, ({ many, one }) => ({
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  productStones: many(productStones),
  productType: one(productTypes, {
    fields: [products.productTypeId],
    references: [productTypes.id],
    relationName: "productTypeToProducts"
  })
}));

// Stone types relations
export const stoneTypesRelations = relations(stoneTypes, ({ many }) => ({
  productStones: many(productStones),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type DesignRequest = typeof designRequests.$inferSelect;
export type InsertDesignRequest = z.infer<typeof insertDesignRequestSchema>;

export type DesignRequestComment = typeof designRequestComments.$inferSelect;
export type InsertDesignRequestComment = z.infer<typeof insertDesignRequestCommentSchema>;

export type DesignFeedback = typeof designFeedback.$inferSelect;
export type InsertDesignFeedback = z.infer<typeof insertDesignFeedbackSchema>;

// We're maintaining CustomizationRequest for compatibility, but this represents a Personalization Request
export type CustomizationRequest = typeof customizationRequests.$inferSelect;
export type InsertCustomizationRequest = z.infer<typeof insertCustomizationRequestSchema>;

// We're maintaining CustomizationRequestComment for compatibility, but this represents a Personalization Request Comment
export type CustomizationRequestComment = typeof customizationRequestComments.$inferSelect;
export type InsertCustomizationRequestComment = z.infer<typeof insertCustomizationRequestCommentSchema>;

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;

export type QuoteRequestComment = typeof quoteRequestComments.$inferSelect;
export type InsertQuoteRequestComment = z.infer<typeof insertQuoteRequestCommentSchema>;

export type DesignPayment = typeof designPayments.$inferSelect;
export type InsertDesignPayment = z.infer<typeof insertDesignPaymentSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type MetalType = typeof metalTypes.$inferSelect;
export type InsertMetalType = z.infer<typeof insertMetalTypeSchema>;

export type StoneType = typeof stoneTypes.$inferSelect;
export type InsertStoneType = z.infer<typeof insertStoneTypeSchema>;

export type ProductStone = typeof productStones.$inferSelect;

// Inspiration gallery schema
export const inspirationGallery = pgTable("inspiration_gallery", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(), // "rings", "necklaces", "earrings", "bracelets", etc.
  tags: json("tags").$type<string[]>().notNull(),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertInspirationGallerySchema = createInsertSchema(inspirationGallery).pick({
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  tags: true,
  featured: true,
});

export type InspirationGalleryItem = typeof inspirationGallery.$inferSelect;
export type InsertInspirationGalleryItem = z.infer<typeof insertInspirationGallerySchema>;

// Product types schema
export const productTypes = pgTable("product_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon"), // icon name from Lucide icons
  color: text("color"), // color code for UI representation
  createdAt: timestamp("created_at").defaultNow()
});

export const insertProductTypeSchema = createInsertSchema(productTypes).pick({
  name: true,
  description: true,
  displayOrder: true,
  isActive: true,
  icon: true,
  color: true,
});

export type ProductType = typeof productTypes.$inferSelect;
export type InsertProductType = z.infer<typeof insertProductTypeSchema>;

// Product types relations 
export const productTypesRelations = relations(productTypes, ({ many }) => ({
  products: many(products, { relationName: "productTypeToProducts" }),
}));
