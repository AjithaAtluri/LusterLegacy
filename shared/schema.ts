import { pgTable, text, serial, integer, boolean, real, timestamp, json, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users schema (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // "admin" or "customer"
  createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  designRequests: many(designRequests),
  cartItems: many(cartItems),
  orders: many(orders)
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Products schema
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
  category: text("category"), // e.g. "necklace", "earrings", "ring", etc.
  createdAt: timestamp("created_at").defaultNow()
});

export const productsRelations = relations(products, ({ many }) => ({
  cartItems: many(cartItems),
  orderItems: many(orderItems)
}));

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
});

// Custom design requests schema
export const designRequests = pgTable("design_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  metalType: text("metal_type").notNull(),
  primaryStone: text("primary_stone").notNull(),
  notes: text("notes"),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "quoted", "approved", "rejected", "completed"
  estimatedPrice: integer("estimated_price"),
  cadImageUrl: text("cad_image_url"),
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

export const insertDesignRequestSchema = createInsertSchema(designRequests).pick({
  userId: true,
  fullName: true,
  email: true,
  metalType: true,
  primaryStone: true,
  notes: true,
  imageUrl: true,
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
  isCustomDesign: true,
  designRequestId: true,
});

// Testimonials schema
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productType: text("product_type").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  initials: text("initials").notNull(),
  isApproved: boolean("is_approved").default(false)
});

export const insertTestimonialSchema = createInsertSchema(testimonials).pick({
  name: true,
  productType: true,
  rating: true,
  text: true,
  initials: true,
  isApproved: true,
});

// Contact messages schema
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  phone: true,
  message: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type DesignRequest = typeof designRequests.$inferSelect;
export type InsertDesignRequest = z.infer<typeof insertDesignRequestSchema>;

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
