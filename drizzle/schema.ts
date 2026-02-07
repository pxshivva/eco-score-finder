import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - stores cached product data from Open Food Facts API
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  barcode: varchar("barcode", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  category: varchar("category", { length: 255 }),
  
  // Eco-score data
  ecoScore: int("ecoScore"), // 0-100
  ecoScoreGrade: varchar("ecoScoreGrade", { length: 10 }), // A, B, C, D, E
  
  // Score components
  environmentalFootprint: int("environmentalFootprint"), // 0-100
  packagingSustainability: int("packagingSustainability"), // 0-100
  carbonImpact: int("carbonImpact"), // 0-100
  
  // Product details
  imageUrl: varchar("imageUrl", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  country: varchar("country", { length: 100 }),
  
  // Metadata
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Favorites table - tracks user's saved products
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  notes: text("notes"),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Comparisons table - tracks product comparisons created by users
 */
export const comparisons = mysqlTable("comparisons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  productIds: json("productIds").$type<number[]>().notNull(), // Array of product IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comparison = typeof comparisons.$inferSelect;
export type InsertComparison = typeof comparisons.$inferInsert;

/**
 * Notifications table - tracks user notification preferences and sent notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["price_drop", "new_alternative", "recommendation"]).notNull(),
  productId: int("productId"),
  message: text("message").notNull(),
  sent: boolean("sent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * User preferences table - stores notification and recommendation preferences
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enablePriceDropNotifications: boolean("enablePriceDropNotifications").default(true).notNull(),
  enableNewAlternativeNotifications: boolean("enableNewAlternativeNotifications").default(true).notNull(),
  priceDropThreshold: decimal("priceDropThreshold", { precision: 5, scale: 2 }).default("10"), // percentage
  preferredCategories: json("preferredCategories").$type<string[]>(), // Array of category preferences
  minEcoScore: int("minEcoScore").default(50), // Minimum acceptable eco-score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;
