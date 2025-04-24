import OpenAI from "openai";
import { Request, Response } from "express";

/**
 * Direct implementation of OpenAI's vision API for jewelry image analysis
 * This approach simplifies the process by removing complexity and using the vision API directly
 */
export async function analyzeJewelryImage(req: Request, res: Response) {
  try {
    console.log("Starting direct jewelry image analysis");
    
    // Validate required parameters
    const { imageData, productType, metalType, primaryGems, userDescription } = req.body;
    
    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid image data",
      });
    }
    
    if (!productType || !metalType) {
      return res.status(400).json({
        success: false,
        message: "Missing required product details: productType and metalType required",
      });
    }
    
    // Format gems for prompt
    const gemsDescription = primaryGems 
      ? primaryGems.map(gem => `${gem.name}${gem.carats ? ` (${gem.carats} carats)` : ''}`).join(', ')
      : "No gems specified";
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OpenAI API key not configured",
      });
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Convert the base64 to a proper data URL
    const imageUrl = `data:image/jpeg;base64,${imageData}`;
    
    console.log("Making vision API request for jewelry analysis");
    
    // Make direct vision API request with minimal complexity
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // The newest model with vision capabilities
      messages: [
        {
          role: "system",
          content: "You are a luxury e-commerce copywriter specializing in high-end jewelry product listings for Luster Legacy's online store. Your content must be engaging, concise, and optimized for web display. Focus on creating content that converts browsers to buyers with enticing product descriptions."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this jewelry image and create a complete e-commerce product listing based on what you see and these details:
              
              Product Information:
              - Type: ${productType}
              - Metal: ${metalType}
              - Gems: ${gemsDescription}
              - Additional Notes: ${userDescription || "None provided"}
              
              Create the following for this luxury jewelry e-commerce listing:
              1. A SEO-friendly product name (max 5 words) that would stand out in search results
              2. A compelling tagline that would entice clicks (max 15 words)
              3. A concise 3-sentence description perfect for product cards and thumbnails
              4. A detailed product description (150-200 words) optimized for e-commerce that includes:
                 - Key selling points visible in the image
                 - Materials and craftsmanship details shoppers would want to know
                 - Style information (occasion, outfit pairing, etc.)
                 - Value proposition (why this piece is worth the investment)
              5. Bullet-point design highlights perfect for quick scanning by online shoppers
              6. Key materials summary formatted for product specifications section
              7. Brief notes on the visual elements that influenced your description
              
              The tone should be elegant yet persuasive. Focus on benefits to the shopper, the emotions the piece evokes, and why it's a must-have addition to their collection.
              
              Format your response as JSON ready for immediate integration into our e-commerce platform:
              {
                "title": "Product Name",
                "tagline": "Product Tagline",
                "shortDescription": "3-sentence description with each sentence separated by newlines",
                "detailedDescription": "Detailed description with proper paragraphs",
                "designHighlights": "Bullet-point style design highlights",
                "materials": "Details of materials used",
                "imageInsights": "What you observed in the image"
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Process the response
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error("Invalid response format from OpenAI");
      return res.status(500).json({
        success: false,
        message: "Invalid response from vision API"
      });
    }
    
    const content = response.choices[0].message.content;
    
    if (!content) {
      return res.status(500).json({
        success: false,
        message: "Empty content in vision API response"
      });
    }
    
    console.log("Successfully received vision API response");
    
    // Parse the JSON content
    try {
      const parsedContent = JSON.parse(content);
      
      // Calculate estimated price based on materials
      const basePrice = 1000; // Base price in USD
      const metalWeight = req.body.metalWeight || 5;
      const metalPricePerGram = metalType.toLowerCase().includes('gold') ? 60 : 30;
      const gemPriceMultiplier = (primaryGems || []).reduce((acc, gem) => {
        let multiplier = 1;
        if (gem.name.toLowerCase().includes('diamond')) multiplier = 1000;
        else if (gem.name.toLowerCase().includes('ruby') || 
                gem.name.toLowerCase().includes('sapphire') || 
                gem.name.toLowerCase().includes('emerald')) multiplier = 800;
        else multiplier = 200;
        
        return acc + (gem.carats || 0.5) * multiplier;
      }, 0);
      
      const calculatedPrice = basePrice + (metalWeight * metalPricePerGram) + gemPriceMultiplier;
      const priceUSD = Math.round(calculatedPrice);
      const priceINR = Math.round(priceUSD * 75); // Approximate exchange rate
      
      // Add prices to the response
      const finalResult = {
        ...parsedContent,
        priceUSD,
        priceINR,
        success: true
      };
      
      return res.status(200).json(finalResult);
    } catch (parseError) {
      console.error("Failed to parse vision API response as JSON:", parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse vision API response",
        rawContent: content.substring(0, 100) + "..." // Send first part of content for debugging
      });
    }
  } catch (error: any) {
    console.error("Error in direct vision API analysis:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unknown error in vision API analysis"
    });
  }
}