import { eq, and, desc, like, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, favorites, comparisons, notifications, userPreferences } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Product queries
export async function getProductByBarcode(barcode: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchProducts(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(products)
    .where(like(products.name, `%${query}%`))
    .limit(limit);
}

export async function upsertProduct(product: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await getProductByBarcode(product.barcode);
  if (existing) {
    await db.update(products).set(product).where(eq(products.barcode, product.barcode));
    return existing.id;
  }
  
  const result = await db.insert(products).values(product);
  return (result as any).insertId as number;
}

// Favorites queries
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const favs = await db.select().from(favorites).where(eq(favorites.userId, userId));
  const productIds = favs.map(f => f.productId);
  
  if (productIds.length === 0) return [];
  
  const { inArray } = require('drizzle-orm');
  return db.select().from(products).where(
    inArray(products.id, productIds)
  );
}

export async function addFavorite(userId: number, productId: number, notes?: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  const result = await db.insert(favorites).values({ userId, productId, notes });
  return (result as any).insertId as number;
}

export async function removeFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.productId, productId))
  );
  return true;
}

export async function isFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)))
    .limit(1);
  
  return result.length > 0;
}

// Comparison queries
export async function getUserComparisons(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(comparisons).where(eq(comparisons.userId, userId));
}

export async function createComparison(userId: number, name: string, productIds: number[]) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(comparisons).values({ userId, name, productIds });
  return (result as any).insertId as number;
}

export async function deleteComparison(comparisonId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(comparisons).where(
    and(eq(comparisons.id, comparisonId), eq(comparisons.userId, userId))
  );
  return true;
}

// User preferences queries
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserPreferences(userId: number, prefs: Partial<typeof userPreferences.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;
  
  const existing = await getUserPreferences(userId);
  
  if (existing) {
    await db.update(userPreferences).set(prefs).where(eq(userPreferences.userId, userId));
    return existing.id;
  }
  
  const result = await db.insert(userPreferences).values({ userId, ...prefs });
  return (result as any).insertId as number;
}

// Notification queries
export async function createNotification(userId: number, type: string, message: string, productId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.insert(notifications).values({ userId, type: type as any, message, productId });
  return (result as any).insertId as number;
}

export async function getUserNotifications(userId: number, unsent = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (unsent) {
    return db.select().from(notifications).where(
      and(eq(notifications.userId, userId), eq(notifications.sent, false))
    );
  }
  return db.select().from(notifications).where(eq(notifications.userId, userId));
}

export async function markNotificationAsSent(notificationId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(notifications).set({ sent: true, sentAt: new Date() }).where(eq(notifications.id, notificationId));
  return true;
}
