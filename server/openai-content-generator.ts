import OpenAI from "openai";
import { Request, Response } from "express";
import { ChatCompletionMessageParam } from "openai/resources";
import { calculateJewelryPrice } from "./utils/price-calculator";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface JewelryContentRequest {
  productType: string;
  metalType: string;
  metalWeight?: number;
  primaryGems?: Array<{ name: string; carats?: number }>;
  userDescription?: string;
  otherStoneType?: string;
  otherStoneWeight?: number;
}

interface JewelryContentResponse {
  title: string;
  tagline: string;
  shortDescription: string;
  detailedDescription: string;
  priceUSD: number;
  priceINR: number;
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
      otherStoneType = "",
      otherStoneWeight = 0,
    } = req.body as JewelryContentRequest;
    
    console.log(`Processing request for ${productType} in ${metalType}`);
    
    // Calculate price using the centralized price calculator
    const priceResult = await calculateJewelryPrice({
      productType,
      metalType,
      metalWeight,
      primaryGems,
      otherStoneType,
      otherStoneWeight
    });
    const { priceUSD: estimatedUSDPrice, priceINR: estimatedINRPrice } = priceResult;
    
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
${otherStoneType ? `- Other Stone: ${otherStoneType}${otherStoneWeight ? ` (${otherStoneWeight} carats)` : ''}` : ''}
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
    const priceINR = Math.round(estimatedINRPrice);
    
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