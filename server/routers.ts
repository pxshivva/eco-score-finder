import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { fetchProductFromOpenFoodFacts, searchProductsOpenFoodFacts, findAlternatives } from "./services/openFoodFacts";
import { TRPCError } from "@trpc/server";
import { recommendationsRouter } from "./routers/recommendations";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Product search and eco-score procedures
  products: router({
    searchByBarcode: publicProcedure
      .input(z.object({ barcode: z.string() }))
      .query(async ({ input }) => {
        try {
          // First check local database
          let product = await db.getProductByBarcode(input.barcode);
          
          if (!product) {
            // Fetch from Open Food Facts
            const offProduct = await fetchProductFromOpenFoodFacts(input.barcode);
            if (!offProduct) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Product not found',
              });
            }
            
            // Save to database
            const productId = await db.upsertProduct(offProduct);
            product = await db.getProductByBarcode(input.barcode);
          }
          
          return product;
        } catch (error) {
          console.error('Error searching product by barcode:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to search product',
          });
        }
      }),

    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        try {
          // First search local database
          const localResults = await db.searchProducts(input.query, input.limit);
          
          if (localResults.length > 0) {
            return localResults;
          }
          
          // Search Open Food Facts
          const offResults = await searchProductsOpenFoodFacts(input.query, input.limit);
          
          // Save results to database
          for (const product of offResults) {
            await db.upsertProduct(product);
          }
          
          return offResults;
        } catch (error) {
          console.error('Error searching products:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to search products',
          });
        }
      }),

    getAlternatives: publicProcedure
      .input(z.object({ barcode: z.string(), minSimilarity: z.number().default(0.8) }))
      .query(async ({ input }) => {
        try {
          const product = await db.getProductByBarcode(input.barcode);
          if (!product) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Product not found',
            });
          }

          const alternatives = await findAlternatives(
            {
              barcode: product.barcode,
              name: product.name,
              brand: product.brand || undefined,
              category: product.category || undefined,
              ecoScore: product.ecoScore || 50,
              ecoScoreGrade: product.ecoScoreGrade || 'C',
              environmentalFootprint: product.environmentalFootprint || 50,
              packagingSustainability: product.packagingSustainability || 50,
              carbonImpact: product.carbonImpact || 50,
              imageUrl: product.imageUrl || undefined,
              price: product.price?.toString(),
              country: product.country || undefined,
            },
            input.minSimilarity
          );

          // Save alternatives to database
          for (const alt of alternatives) {
            await db.upsertProduct(alt);
          }

          return alternatives;
        } catch (error) {
          console.error('Error finding alternatives:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to find alternatives',
          });
        }
      }),
  }),

  // Favorites procedures
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await db.getUserFavorites(ctx.user.id);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch favorites',
        });
      }
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const id = await db.addFavorite(ctx.user.id, input.productId, input.notes);
          return { success: true, id };
        } catch (error) {
          console.error('Error adding favorite:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to add favorite',
          });
        }
      }),

    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.removeFavorite(ctx.user.id, input.productId);
          return { success: true };
        } catch (error) {
          console.error('Error removing favorite:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to remove favorite',
          });
        }
      }),

    isFavorite: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          return await db.isFavorite(ctx.user.id, input.productId);
        } catch (error) {
          console.error('Error checking favorite:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to check favorite',
          });
        }
      }),
  }),

  // Comparison procedures
  comparisons: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const comps = await db.getUserComparisons(ctx.user.id);
        
        // Fetch product details for each comparison
        const enriched = await Promise.all(
          comps.map(async (comp) => {
            const productIds = comp.productIds as number[];
            const products = await Promise.all(
              productIds.map(id => db.getDb().then(dbInstance => {
                if (!dbInstance) return null;
                return dbInstance.select().from(require('../drizzle/schema').products).where(
                  require('drizzle-orm').eq(require('../drizzle/schema').products.id, id)
                ).limit(1).then((res: any[]) => res[0] || null);
              }))
            );
            return { ...comp, products: products.filter(Boolean) };
          })
        );
        
        return enriched;
      } catch (error) {
        console.error('Error fetching comparisons:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch comparisons',
        });
      }
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string(), productIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        try {
          const id = await db.createComparison(ctx.user.id, input.name, input.productIds);
          return { success: true, id };
        } catch (error) {
          console.error('Error creating comparison:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create comparison',
          });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ comparisonId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.deleteComparison(input.comparisonId, ctx.user.id);
          return { success: true };
        } catch (error) {
          console.error('Error deleting comparison:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete comparison',
          });
        }
      }),
  }),

  // Recommendations procedures
  recommendations: recommendationsRouter,

  // User preferences procedures
  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      try {
        const prefs = await db.getUserPreferences(ctx.user.id);
        if (!prefs) {
          // Create default preferences
          await db.upsertUserPreferences(ctx.user.id, {});
          return await db.getUserPreferences(ctx.user.id);
        }
        return prefs;
      } catch (error) {
        console.error('Error fetching preferences:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch preferences',
        });
      }
    }),

    update: protectedProcedure
      .input(z.object({
        enablePriceDropNotifications: z.boolean().optional(),
        enableNewAlternativeNotifications: z.boolean().optional(),
        priceDropThreshold: z.number().optional(),
        preferredCategories: z.array(z.string()).optional(),
        minEcoScore: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const prefs: any = {};
          if (input.enablePriceDropNotifications !== undefined) prefs.enablePriceDropNotifications = input.enablePriceDropNotifications;
          if (input.enableNewAlternativeNotifications !== undefined) prefs.enableNewAlternativeNotifications = input.enableNewAlternativeNotifications;
          if (input.priceDropThreshold !== undefined) prefs.priceDropThreshold = input.priceDropThreshold.toString();
          if (input.preferredCategories !== undefined) prefs.preferredCategories = input.preferredCategories;
          if (input.minEcoScore !== undefined) prefs.minEcoScore = input.minEcoScore;
          
          await db.upsertUserPreferences(ctx.user.id, prefs);
          return { success: true };
        } catch (error) {
          console.error('Error updating preferences:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update preferences',
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
