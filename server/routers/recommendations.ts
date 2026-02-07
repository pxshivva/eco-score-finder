import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import {
  generateRecommendations,
  generateShoppingTips,
  analyzeProductSustainability,
  compareProductsSustainability,
} from "../services/recommendations";
import { sendRecommendationNotification } from "../services/emailNotifications";

export const recommendationsRouter = router({
  /**
   * Get personalized recommendations based on user's saved products
   */
  getPersonalized: protectedProcedure.query(async ({ ctx }) => {
    try {
      const favorites = await db.getUserFavorites(ctx.user.id);
      const recommendations = await generateRecommendations(ctx.user.id, favorites);

      // Send notification
      await sendRecommendationNotification(ctx.user.id, recommendations);

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return {
        success: false,
        recommendations: 'Unable to generate recommendations at this time.',
      };
    }
  }),

  /**
   * Get general eco-friendly shopping tips
   */
  getShoppingTips: protectedProcedure.query(async () => {
    try {
      const tips = await generateShoppingTips();
      return {
        success: true,
        tips,
      };
    } catch (error) {
      console.error('Error getting shopping tips:', error);
      return {
        success: false,
        tips: 'Unable to generate tips at this time.',
      };
    }
  }),

  /**
   * Analyze a specific product's sustainability
   */
  analyzeProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      try {
        // Get product from database
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          return {
            success: false,
            analysis: 'Database connection failed.',
          };
        }

        const products = await dbInstance
          .select()
          .from(require('../../drizzle/schema').products)
          .where(
            require('drizzle-orm').eq(
              require('../../drizzle/schema').products.id,
              input.productId
            )
          )
          .limit(1);

        const product = products[0];
        if (!product) {
          return {
            success: false,
            analysis: 'Product not found.',
          };
        }

        const analysis = await analyzeProductSustainability(product as any);
        return {
          success: true,
          analysis,
        };
      } catch (error) {
        console.error('Error analyzing product:', error);
        return {
          success: false,
          analysis: 'Unable to analyze product at this time.',
        };
      }
    }),

  /**
   * Compare two products' sustainability
   */
  compareProducts: protectedProcedure
    .input(
      z.object({
        productId1: z.number(),
        productId2: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          return {
            success: false,
            comparison: 'Database connection failed.',
          };
        }

        const schema = require('../../drizzle/schema');
        const { eq } = require('drizzle-orm');

        const products = await dbInstance
          .select()
          .from(schema.products)
          .where(
            (schema.products.id as any).inArray([input.productId1, input.productId2])
          );

        if (products.length !== 2) {
          return {
            success: false,
            comparison: 'One or both products not found.',
          };
        }

        const comparison = await compareProductsSustainability(
          products[0] as any,
          products[1] as any
        );

        return {
          success: true,
          comparison,
        };
      } catch (error) {
        console.error('Error comparing products:', error);
        return {
          success: false,
          comparison: 'Unable to compare products at this time.',
        };
      }
    }),
});
