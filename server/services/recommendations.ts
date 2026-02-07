import { invokeLLM } from "../_core/llm";
import { Product } from "../../drizzle/schema";
import * as db from "../db";

/**
 * Generate personalized eco-friendly shopping recommendations using LLM
 */
export async function generateRecommendations(
  userId: number,
  userFavorites: Product[]
): Promise<string> {
  try {
    if (userFavorites.length === 0) {
      return "Start by saving your favorite products to get personalized recommendations!";
    }

    // Prepare product summary for LLM
    const productSummary = userFavorites
      .map(p => `- ${p.name} (Brand: ${p.brand || 'Unknown'}, Eco-Score: ${p.ecoScore || 'N/A'}/100)`)
      .join('\n');

    const averageEcoScore = Math.round(
      userFavorites.reduce((sum, p) => sum + (p.ecoScore || 0), 0) / userFavorites.length
    );

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an eco-conscious shopping advisor. Analyze the user's saved products and provide personalized recommendations for sustainable shopping. Be encouraging and specific about why certain choices are better for the environment. Keep recommendations concise and actionable.`,
        },
        {
          role: "user",
          content: `Here are my saved products:
${productSummary}

My average eco-score is ${averageEcoScore}/100.

Please provide:
1. A brief analysis of my current shopping patterns
2. 2-3 specific eco-friendly shopping tips based on my preferences
3. Suggestions for sustainable alternatives I should consider

Keep the response friendly and motivating!`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return typeof content === 'string' ? content : "Unable to generate recommendations at this time.";
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return "Unable to generate recommendations at this time. Please try again later.";
  }
}

/**
 * Generate eco-friendly shopping tips using LLM
 */
export async function generateShoppingTips(): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an environmental sustainability expert. Provide practical, actionable eco-friendly shopping tips that anyone can implement. Be concise and focus on high-impact changes.`,
        },
        {
          role: "user",
          content: `Generate 5 practical eco-friendly shopping tips that can help reduce environmental impact. Format as a numbered list with brief explanations.`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return typeof content === 'string' ? content : "Unable to generate tips at this time.";
  } catch (error) {
    console.error('Error generating shopping tips:', error);
    return "Unable to generate tips at this time. Please try again later.";
  }
}

/**
 * Analyze a product's sustainability using LLM
 */
export async function analyzeProductSustainability(product: Product): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a sustainability analyst. Provide a brief, insightful analysis of a product's environmental impact based on its eco-score and components. Be informative but accessible to consumers.`,
        },
        {
          role: "user",
          content: `Analyze this product's sustainability:
Product: ${product.name}
Brand: ${product.brand || 'Unknown'}
Category: ${product.category || 'Unknown'}
Eco-Score: ${product.ecoScore || 'N/A'}/100
Environmental Footprint: ${product.environmentalFootprint || 'N/A'}/100
Packaging Sustainability: ${product.packagingSustainability || 'N/A'}/100
Carbon Impact: ${product.carbonImpact || 'N/A'}/100

Provide a brief analysis (2-3 sentences) of what this score means for the environment and suggest one improvement the manufacturer could make.`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return typeof content === 'string' ? content : "Unable to analyze product at this time.";
  } catch (error) {
    console.error('Error analyzing product:', error);
    return "Unable to analyze product at this time.";
  }
}

/**
 * Compare two products using LLM
 */
export async function compareProductsSustainability(
  product1: Product,
  product2: Product
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a sustainability comparison expert. Compare two products and help consumers understand which is more eco-friendly and why. Be clear and objective.`,
        },
        {
          role: "user",
          content: `Compare the sustainability of these two products:

Product 1: ${product1.name}
- Brand: ${product1.brand || 'Unknown'}
- Eco-Score: ${product1.ecoScore || 'N/A'}/100
- Environmental Footprint: ${product1.environmentalFootprint || 'N/A'}/100
- Packaging: ${product1.packagingSustainability || 'N/A'}/100
- Carbon: ${product1.carbonImpact || 'N/A'}/100

Product 2: ${product2.name}
- Brand: ${product2.brand || 'Unknown'}
- Eco-Score: ${product2.ecoScore || 'N/A'}/100
- Environmental Footprint: ${product2.environmentalFootprint || 'N/A'}/100
- Packaging: ${product2.packagingSustainability || 'N/A'}/100
- Carbon: ${product2.carbonImpact || 'N/A'}/100

Provide a brief comparison (2-3 sentences) explaining which is more sustainable and why.`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return typeof content === 'string' ? content : "Unable to compare products at this time.";
  } catch (error) {
    console.error('Error comparing products:', error);
    return "Unable to compare products at this time.";
  }
}
