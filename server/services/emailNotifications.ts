import { notifyOwner } from "../_core/notification";
import * as db from "../db";
import { Product } from "../../drizzle/schema";

/**
 * Send price drop notification to user
 */
export async function sendPriceDropNotification(
  userId: number,
  product: Product,
  oldPrice: number,
  newPrice: number,
  discountPercentage: number
): Promise<boolean> {
  try {
    const user = await db.getDb().then(dbInstance => {
      if (!dbInstance) return null;
      return dbInstance.select().from(require('../../drizzle/schema').users)
        .where(require('drizzle-orm').eq(require('../../drizzle/schema').users.id, userId))
        .limit(1)
        .then((res: any[]) => res[0] || null);
    });

    if (!user?.email) {
      console.warn(`[Email] User ${userId} has no email address`);
      return false;
    }

    // Create notification record
    const message = `${product.name} is now $${newPrice.toFixed(2)} (was $${oldPrice.toFixed(2)}) - ${discountPercentage}% off!`;
    await db.createNotification(userId, 'price_drop', message, product.id);

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, we'll log and notify the owner
    console.log(`[Email] Sending price drop notification to ${user.email}`);
    console.log(`[Email] Product: ${product.name}, New Price: $${newPrice.toFixed(2)}`);

    // Notify owner for monitoring
    await notifyOwner({
      title: `Price Drop Alert: ${product.name}`,
      content: `User ${user.email} should be notified: ${product.name} dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)} (${discountPercentage}% off)`,
    });

    return true;
  } catch (error) {
    console.error('[Email] Error sending price drop notification:', error);
    return false;
  }
}

/**
 * Send new alternative product notification to user
 */
export async function sendNewAlternativeNotification(
  userId: number,
  originalProduct: Product,
  alternativeProduct: Product
): Promise<boolean> {
  try {
    const user = await db.getDb().then(dbInstance => {
      if (!dbInstance) return null;
      return dbInstance.select().from(require('../../drizzle/schema').users)
        .where(require('drizzle-orm').eq(require('../../drizzle/schema').users.id, userId))
        .limit(1)
        .then((res: any[]) => res[0] || null);
    });

    if (!user?.email) {
      console.warn(`[Email] User ${userId} has no email address`);
      return false;
    }

    // Create notification record
    const message = `New eco-friendly alternative found! ${alternativeProduct.name} (Score: ${alternativeProduct.ecoScore}/100) is similar to ${originalProduct.name}`;
    await db.createNotification(userId, 'new_alternative', message, alternativeProduct.id);

    // Log for monitoring
    console.log(`[Email] Sending new alternative notification to ${user.email}`);
    console.log(`[Email] Original: ${originalProduct.name}, Alternative: ${alternativeProduct.name}`);

    // Notify owner for monitoring
    await notifyOwner({
      title: `New Alternative Alert: ${alternativeProduct.name}`,
      content: `User ${user.email} should be notified: New alternative ${alternativeProduct.name} (Score: ${alternativeProduct.ecoScore}/100) available for ${originalProduct.name}`,
    });

    return true;
  } catch (error) {
    console.error('[Email] Error sending new alternative notification:', error);
    return false;
  }
}

/**
 * Send personalized recommendation notification
 */
export async function sendRecommendationNotification(
  userId: number,
  recommendationText: string
): Promise<boolean> {
  try {
    const user = await db.getDb().then(dbInstance => {
      if (!dbInstance) return null;
      return dbInstance.select().from(require('../../drizzle/schema').users)
        .where(require('drizzle-orm').eq(require('../../drizzle/schema').users.id, userId))
        .limit(1)
        .then((res: any[]) => res[0] || null);
    });

    if (!user?.email) {
      console.warn(`[Email] User ${userId} has no email address`);
      return false;
    }

    // Create notification record
    const message = `Your personalized eco-friendly shopping recommendations are ready!`;
    await db.createNotification(userId, 'recommendation', message);

    // Log for monitoring
    console.log(`[Email] Sending recommendation notification to ${user.email}`);

    // Notify owner for monitoring
    await notifyOwner({
      title: `Recommendation Sent to ${user.email}`,
      content: `Personalized eco-friendly shopping recommendations have been generated and sent to user ${user.email}`,
    });

    return true;
  } catch (error) {
    console.error('[Email] Error sending recommendation notification:', error);
    return false;
  }
}

/**
 * Process pending notifications and mark as sent
 */
export async function processPendingNotifications(userId: number): Promise<number> {
  try {
    const notifications = await db.getUserNotifications(userId, true);
    let sentCount = 0;

    for (const notification of notifications) {
      // In production, send actual email here
      const success = await db.markNotificationAsSent(notification.id);
      if (success) {
        sentCount++;
      }
    }

    return sentCount;
  } catch (error) {
    console.error('[Email] Error processing pending notifications:', error);
    return 0;
  }
}
