import OpenAI from "openai";
import { Request, Response } from "express";
import { ChatCompletionMessageParam } from "openai/resources";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface JewelryContentRequest {
  productType: string;
  metalType: string;
  metalWeight?: number;
  primaryGems?: Array<{ name: string; carats?: number }>;
  userDescription?: string;
}

interface JewelryContentResponse {
  title: string;
  tagline: string;
  shortDescription: string;
  detailedDescription: string;
  priceUSD: number;
  priceINR: number;
}

// USD to INR conversion rate
const USD_TO_INR_RATE = 83.5;

// Base prices for different metals (per gram in USD)
const METAL_PRICES = {
  "18k Gold": 64,
  "14k Gold": 50,
  "22k Gold": 78,
  "24k Gold": 85,
  "Platinum": 34,
  "Sterling Silver": 1,
  "Rose Gold 18k": 64,
  "White Gold 18k": 65,
};

// Base prices for common gems (per carat in USD)
const GEM_PRICES = {
  "Diamond": 3500,
  "Ruby": 1200,
  "Sapphire": 1000,
  "Emerald": 800,
  "Amethyst": 300,
  "Aquamarine": 500,
  "Tanzanite": 600,
  "Topaz": 200,
  "Opal": 400,
  "Pearl": 150,
  "Garnet": 250,
  "Peridot": 300,
  "Tourmaline": 350,
  "Citrine": 150,
  "Morganite": 300,
};

// Calculate price based on materials
function calculateEstimatedPrice(
  metalType: string,
  metalWeight: number = 5,
  gems: Array<{ name: string; carats?: number }> = []
): number {
  // Base metal price
  const metalPricePerGram = METAL_PRICES[metalType as keyof typeof METAL_PRICES] || 50;
  const metalPrice = metalPricePerGram * metalWeight;
  
  // Gem prices
  let gemPrice = 0;
  for (const gem of gems) {
    const pricePerCarat = GEM_PRICES[gem.name as keyof typeof GEM_PRICES] || 200;
    gemPrice += pricePerCarat * (gem.carats || 0.1);
  }
  
  // Add craftsmanship premium (30%)
  const craftmanshipPremium = (metalPrice + gemPrice) * 0.3;
  
  // Total price with minimum of $100
  return Math.max(metalPrice + gemPrice + craftmanshipPremium, 100);
}

// Generate jewelry content
export async function generateJewelryContent(req: Request, res: Response) {
  try {
    console.log("Jewelry content generation request received");
    
    // Validate required fields
    if (!req.body || !req.body.productType || !req.body.metalType) {
      return res.status(400).json({
        message: "Missing required fields",
        details: "productType and metalType are required"
      });
    }
    
    const {
      productType,
      metalType,
      metalWeight = 5,
      primaryGems = [],
      userDescription = "",
    } = req.body as JewelryContentRequest;
    
    console.log(`Processing request for ${productType} in ${metalType}`);
    
    // Calculate price
    const estimatedUSDPrice = calculateEstimatedPrice(metalType, metalWeight, primaryGems);
    
    // OpenAI API key validation
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured");
      return res.status(500).json({
        message: "OpenAI API key is not configured"
      });
    }
    
    // Create system and user messages
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: `You are a professional jewelry copywriter who creates elegant, compelling product descriptions.
Your response must be valid, parseable JSON with exactly these fields:
{
  "title": "A concise, elegant product title (max 50 chars)",
  "tagline": "A brief, compelling tagline (max 100 chars)",
  "shortDescription": "A concise overview (max 150 chars)",
  "detailedDescription": "A detailed, elegant description (max 500 chars)"
}

DO NOT include any text, formatting, or explanation outside the JSON structure.
Focus on luxury language appropriate for high-end jewelry marketing.`
    };
    
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: `Create luxury jewelry marketing content for:
      
Product Details:
- Type: ${productType}
- Metal: ${metalType}${metalWeight ? ` (${metalWeight}g)` : ''}
- Gems: ${primaryGems.map(gem => `${gem.name}${gem.carats ? ` (${gem.carats} carats)` : ''}`).join(', ') || 'None'}
${userDescription ? `- Additional Details: ${userDescription}` : ''}

Please generate elegant marketing content with the exact JSON structure and fields specified in your instructions.`
    };
    
    const messages: ChatCompletionMessageParam[] = [systemMessage, userMessage];
    
    // Track request timing
    const requestStart = Date.now();
    console.log("Sending request to OpenAI API...");
    
    // Try with model fallbacks
    let response;
    try {
      // First try gpt-4o
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
    } catch (err: any) {
      console.log("gpt-4o model failed, trying gpt-4...", err.message);
      
      // Then try gpt-4
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4",
          messages,
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
      } catch (err2: any) {
        console.log("gpt-4 model failed, trying gpt-3.5-turbo...", err2.message);
        
        // Finally try gpt-3.5-turbo
        response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages,
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
      }
    }
    
    const requestDuration = Date.now() - requestStart;
    console.log(`OpenAI response received in ${requestDuration}ms`);
    
    // Process response
    if (!response?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI API");
    }
    
    // Parse the JSON content
    const content = response.choices[0].message.content;
    let result;
    
    try {
      result = JSON.parse(content);
      console.log("Successfully parsed JSON response");
    } catch (parseError: any) {
      console.error("Failed to parse response as JSON:", content);
      return res.status(500).json({
        message: "Failed to parse AI response as JSON",
        details: parseError.message
      });
    }
    
    // Add pricing to the result
    const priceUSD = Math.round(estimatedUSDPrice);
    const priceINR = Math.round(estimatedUSDPrice * USD_TO_INR_RATE / 10) * 10;
    
    const finalResponse: JewelryContentResponse = {
      ...result,
      priceUSD,
      priceINR
    };
    
    // Send response
    console.log("Sending successful response to client");
    return res.status(200).json(finalResponse);
    
  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({
      message: "Failed to generate content",
      details: error.message || "Unknown error"
    });
  }
}