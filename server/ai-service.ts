import OpenAI from "openai";
import { Request, Response } from "express";
import { ChatCompletionMessageParam, ChatCompletionContentPart } from "openai/resources";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// USD to INR conversion rate (this would be updated regularly in a production app)
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

interface Gem {
  name: string;
  carats?: number;
}

interface ContentRequest {
  productType: string;
  metalType: string;
  metalWeight?: number;
  primaryGems?: Gem[];
  userDescription?: string;
  imageUrls?: string[];
}

export const generateContent = async (req: Request, res: Response) => {
  try {
    console.log("AI Content Generation Request Received");
    
    // Validate required fields
    if (!req.body || !req.body.productType || !req.body.metalType) {
      console.error("Missing required fields:", { body: req.body });
      return res.status(400).json({
        message: "Missing required fields: productType and metalType are required",
      });
    }
    
    const {
      productType,
      metalType,
      metalWeight = 0,
      primaryGems = [],
      userDescription = "",
      imageUrls = [],
    } = req.body as ContentRequest;

    console.log(`Processing request for ${productType} in ${metalType}`);
    console.log(`Images provided: ${imageUrls?.length || 0}`);
    
    // Calculate estimated price
    let estimatedUSDPrice = calculateEstimatedPrice(metalType, metalWeight, primaryGems);
    
    // Check if we have images to analyze
    const hasImages = imageUrls && imageUrls.length > 0;
    
    let messages;
    
    // If there are images, we'll use the vision API approach
    if (hasImages) {
      console.log("Using vision API mode with images");
      
      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: "You are a luxury jewelry expert who creates elegant, compelling product descriptions."
      };
      
      // Start with the text content part
      const contentParts: ChatCompletionContentPart[] = [
        {
          type: "text",
          text: `Analyze ${imageUrls.length > 1 ? 'these jewelry images' : 'this jewelry image'} and create product content based on what you see and the following details:
          
          Item details:
          - Product Type: ${productType}
          - Metal: ${metalType}${metalWeight ? ` (${metalWeight}g)` : ''}
          - Gems: ${primaryGems.map(gem => `${gem.name}${gem.carats ? ` (${gem.carats} carats)` : ''}`).join(', ')}
          - Additional Information: ${userDescription}
          
          Create the following content:
          1. A catchy and sophisticated product title (max 10 words)
          2. An elegant tagline that highlights the uniqueness (max 15 words)
          3. A short 3-line description that captures the essence of the piece
          4. A detailed website-friendly description (150-200 words) describing craftsmanship, materials, occasions, and luxury aspects
          5. A brief insight about what you observed in the image(s) that influenced your description
          
          Respond with JSON in this format:
          {
            "title": "Product Title",
            "tagline": "Product Tagline",
            "shortDescription": "3-line description",
            "detailedDescription": "Detailed description for website listing",
            "imageInsights": "Brief notes on what was observed in the images"
          }`
        }
      ];
      
      try {
        // Process only the first image to avoid size limits
        // We're being extremely conservative here after client-side processing
        const maxImages = 1;
        
        console.log(`Processing ${Math.min(maxImages, imageUrls.length)} of ${imageUrls.length} images`);
        
        // Only process first image if it exists
        if (imageUrls.length > 0) {
          const imageUrl = imageUrls[0];
          
          if (!imageUrl || typeof imageUrl !== 'string') {
            console.error("Invalid image URL format:", typeof imageUrl);
          } else if (imageUrl.length < 100) {
            console.error(`Image data too small, length: ${imageUrl.length}`);
          } else {
            console.log(`Adding image with length: ${imageUrl.length} characters`);
            
            contentParts.push({
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageUrl}`
              }
            });
          }
        }
        
        // Log if we're limiting images
        if (imageUrls.length > maxImages) {
          console.log(`Using only ${maxImages} image(s) out of ${imageUrls.length} provided for AI analysis due to size limitations`);
        }
      } catch (imgProcessingError) {
        console.error("Error during image processing:", imgProcessingError);
        // Continue without images if there's an error
        console.log("Falling back to text-only mode due to image processing error");
        contentParts.splice(1); // Remove any image parts that might have been added
      }
      
      const userMessage: ChatCompletionMessageParam = {
        role: "user",
        content: contentParts
      };
      
      messages = [systemMessage, userMessage] as ChatCompletionMessageParam[];
    } else {
      // Text-only prompt if no images
      console.log("Using text-only mode (no images provided)");
      
      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: "You are a luxury jewelry expert who creates elegant, compelling product descriptions."
      };
      
      const userMessage: ChatCompletionMessageParam = {
        role: "user",
        content: `You are a luxury jewelry expert specializing in crafting elegant product descriptions and marketing content.
        
        Item details:
        - Product Type: ${productType}
        - Metal: ${metalType}${metalWeight ? ` (${metalWeight}g)` : ''}
        - Gems: ${primaryGems.map(gem => `${gem.name}${gem.carats ? ` (${gem.carats} carats)` : ''}`).join(', ')}
        - Additional Information: ${userDescription}
        
        Please generate the following for this jewelry piece:
        1. A catchy and sophisticated product title (max 10 words)
        2. An elegant tagline that highlights the uniqueness (max 15 words)
        3. A short 3-line description that captures the essence of the piece
        4. A detailed website-friendly description (150-200 words) that:
           - Describes the craftsmanship and materials in detail
           - Mentions potential occasions to wear this piece
           - Highlights who would appreciate this jewelry
           - Emphasizes the luxury aspects and quality
        
        Respond with JSON in this format:
        {
          "title": "Product Title",
          "tagline": "Product Tagline",
          "shortDescription": "3-line description",
          "detailedDescription": "Detailed description for website listing"
        }`
      };
      
      messages = [systemMessage, userMessage] as ChatCompletionMessageParam[];
    }

    console.log("Sending request to OpenAI");
    
    // Verify OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not set");
      return res.status(500).json({
        message: "OpenAI API key is not configured",
      });
    }

    // Use the newest OpenAI model (gpt-4o)
    try {
      console.log("OpenAI API key configured:", process.env.OPENAI_API_KEY ? "✓ Yes" : "✗ No");
      console.log("Making OpenAI API request with model: gpt-4o");
      
      const requestStart = Date.now();
      
      // Try with gpt-4o first, then fallback to gpt-4 if that fails, and finally gpt-3.5-turbo as last resort
      let response;
      try {
        console.log("Attempting with primary model: gpt-4o");
        response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: messages,
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
      } catch (error: any) {
        // Check if the error is specifically about the model not being available
        if (error.message && (
            error.message.includes("model") || 
            error.message.includes("not found") || 
            error.message.includes("gpt-4o")
          )) {
          console.log("gpt-4o model failed, trying fallback to gpt-4...");
          try {
            // Fallback to gpt-4
            response = await openai.chat.completions.create({
              model: "gpt-4",
              messages: messages,
              response_format: { type: "json_object" },
              temperature: 0.7,
            });
          } catch (fallbackError: any) {
            console.log("gpt-4 model also failed, trying final fallback to gpt-3.5-turbo...");
            // Final fallback to gpt-3.5-turbo
            response = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: messages,
              response_format: { type: "json_object" },
              temperature: 0.7,
            });
          }
        } else {
          // If it's not a model-specific error, rethrow it
          throw error;
        }
      }
      
      const requestDuration = Date.now() - requestStart;
      console.log(`OpenAI response received successfully in ${requestDuration}ms`);
      
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
        console.error("Invalid response format from OpenAI:", response);
        return res.status(500).json({
          message: "Invalid response from AI service",
          details: "No message content in response"
        });
      }

      // Extract the content from the response
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Empty content in OpenAI response:", response.choices[0]);
        return res.status(500).json({
          message: "Empty content in AI response",
        });
      }
      
      // Parse the JSON content with improved error handling
      let result;
      try {
        // Clean the response - remove markdown formatting if present
        const cleanedContent = content
          .replace(/```json/g, '')  // Remove markdown json code blocks start
          .replace(/```/g, '')      // Remove any remaining markdown code blocks
          .trim();                  // Trim whitespace
          
        console.log("Attempting to parse cleaned AI response");
        
        // Try to parse the cleaned content
        try {
          result = JSON.parse(cleanedContent);
          console.log("Successfully parsed AI response JSON");
        } catch (initialParseError) {
          console.error("Failed to parse cleaned content, trying fallback methods:", initialParseError);
          
          // Try to find a JSON object in the response if direct parsing fails
          const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              result = JSON.parse(jsonMatch[0]);
              console.log("Successfully extracted and parsed JSON from response");
            } catch (extractError) {
              console.error("Failed to parse extracted JSON pattern:", extractError);
              throw new Error("Could not parse JSON after extraction attempt");
            }
          } else {
            throw new Error("No valid JSON structure found in response");
          }
        }
      } catch (parseError: any) {
        console.error("All JSON parsing attempts failed. Raw content:", content);
        console.error("Parse error:", parseError.message);
        
        return res.status(500).json({
          message: "Failed to parse AI response as JSON",
          details: parseError.message || "Unknown parsing error",
          // Don't include the raw content in the response to avoid leaking potentially large data
        });
      }
      
      // Round prices for better presentation
      const priceUSD = Math.round(estimatedUSDPrice);
      const priceINR = Math.round(estimatedUSDPrice * USD_TO_INR_RATE / 10) * 10; // Round to nearest 10 rupees

      // Validate that all required fields are present
      const requiredFields = ['title', 'tagline', 'shortDescription', 'detailedDescription'];
      const missingFields = requiredFields.filter(field => !result[field]);
      
      if (missingFields.length > 0) {
        console.error(`AI response missing required fields: ${missingFields.join(', ')}`);
        console.log("Partial AI response received:", result);
        
        // Extract product info from the original request
        const productType = req.body.productType || "Jewelry";
        const metalType = req.body.metalType || "Gold";
        const metalWeight = req.body.metalWeight || 5;
        
        // Create default values for missing fields to ensure we can still return a response
        const defaults: Record<string, string> = {
          title: `${productType} in ${metalType}`,
          tagline: "Elegant craftsmanship meets timeless design",
          shortDescription: `Beautifully crafted ${productType.toLowerCase()} made with premium ${metalType.toLowerCase()}.`,
          detailedDescription: `This exquisite ${productType.toLowerCase()} is meticulously crafted from the finest ${metalType.toLowerCase()}, weighing approximately ${metalWeight}g. A perfect addition to any jewelry collection.`
        };
        
        // Fill in any missing fields with defaults
        missingFields.forEach(field => {
          result[field] = defaults[field] || `Generated ${field}`;
        });
        
        console.log("Added default values for missing fields");
      }
      
      // Construct the final response
      const finalResponse = {
        ...result,
        priceUSD,
        priceINR,
      };

      console.log("Sending successful response to client");
      res.status(200).json(finalResponse);
      
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError);
      
      // Provide more detailed error logging
      if (openaiError.response) {
        console.error("OpenAI API response error details:", {
          status: openaiError.response.status,
          statusText: openaiError.response.statusText,
          headers: openaiError.response.headers,
          data: openaiError.response.data
        });
      }
      
      const errorMessage = openaiError.message || "Unknown error";
      const errorStatus = openaiError.status || 500;
      
      console.log("Full error object:", JSON.stringify(openaiError, null, 2));
      
      // Check for specific OpenAI error types with improved detection
      if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        return res.status(429).json({
          message: "OpenAI rate limit exceeded, please try again later",
          details: errorMessage
        });
      } else if (errorMessage.includes("auth") || errorMessage.includes("api key") || errorMessage.includes("401")) {
        console.error("CRITICAL: OpenAI authentication error. API key may be invalid or expired.");
        return res.status(401).json({
          message: "OpenAI authentication error, please check API key",
          details: errorMessage
        });
      } else if (errorMessage.includes("billing") || errorMessage.includes("payment") || errorMessage.includes("quota")) {
        return res.status(402).json({
          message: "OpenAI billing error, please check account status",
          details: errorMessage
        });
      } else if (errorMessage.includes("model")) {
        return res.status(400).json({
          message: "OpenAI model error, the requested model may not be available",
          details: errorMessage
        });
      }
      
      // Generic error response
      res.status(errorStatus).json({
        message: "OpenAI API error: " + errorMessage.slice(0, 100),
        details: errorMessage
      });
    }
    
  } catch (error: any) {
    console.error("AI content generation error:", error);
    res.status(500).json({
      message: "Failed to generate content",
      details: error.message || "Unknown error"
    });
  }
};

// Calculate estimated price based on materials
function calculateEstimatedPrice(
  metalType: string,
  metalWeight: number,
  gems: Gem[]
): number {
  // Base metal price calculation
  const metalPricePerGram = METAL_PRICES[metalType as keyof typeof METAL_PRICES] || 50; // Default to 50 USD if metal not found
  const metalPrice = metalPricePerGram * metalWeight;
  
  // Calculate gem prices
  let gemPrice = 0;
  for (const gem of gems) {
    const pricePerCarat = GEM_PRICES[gem.name as keyof typeof GEM_PRICES] || 200; // Default to 200 USD if gem not found
    gemPrice += pricePerCarat * (gem.carats || 0.1); // Default to 0.1 carat if not specified
  }
  
  // Add craftmanship premium (30% of material cost)
  const craftmanshipPremium = (metalPrice + gemPrice) * 0.3;
  
  // Calculate total price
  let totalPrice = metalPrice + gemPrice + craftmanshipPremium;
  
  // Ensure minimum price
  return Math.max(totalPrice, 100); // Minimum price of 100 USD
}