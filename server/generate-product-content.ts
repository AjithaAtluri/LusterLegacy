import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

// Set up multer for file uploads - using public/uploads for persistence between deployments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "temp");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any);
    }
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Handles product content generation with image analysis
 */
export const generateProductContent = async (req: Request, res: Response) => {
  try {
    // Use multer to handle file uploads
    const uploadMiddleware = upload.fields([
      { name: 'mainImage', maxCount: 1 },
      { name: 'additionalImage1', maxCount: 1 },
      { name: 'additionalImage2', maxCount: 1 },
      { name: 'additionalImage3', maxCount: 1 },
    ]);

    uploadMiddleware(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        // Get uploaded files
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const mainImageFile = files.mainImage ? files.mainImage[0] : null;
        
        // Create a properly typed array for additional images
        let additionalImages: Express.Multer.File[] = [];
        
        // Add each additional image if it exists
        if (files.additionalImage1) {
          additionalImages = [...additionalImages, files.additionalImage1[0]];
        }
        if (files.additionalImage2) {
          additionalImages = [...additionalImages, files.additionalImage2[0]];
        }
        if (files.additionalImage3) {
          additionalImages = [...additionalImages, files.additionalImage3[0]];
        }
        
        // Check if main image was uploaded
        if (!mainImageFile) {
          return res.status(400).json({ success: false, message: 'Main image is required' });
        }
        
        // Get form data
        const productType = req.body.productType || '';
        const metalType = req.body.metalType || '';
        const metalWeight = parseFloat(req.body.metalWeight) || 5;
        const mainStoneType = req.body.mainStoneType;
        const mainStoneWeight = parseFloat(req.body.mainStoneWeight) || 1;
        const secondaryStoneType = req.body.secondaryStoneType || null;
        const secondaryStoneWeight = secondaryStoneType ? parseFloat(req.body.secondaryStoneWeight) || 0.5 : null;
        const otherStoneType = req.body.otherStoneType || null;
        const otherStoneWeight = otherStoneType ? parseFloat(req.body.otherStoneWeight) || 0.2 : null;
        const additionalDetails = req.body.additionalDetails || '';
        
        // Validate required fields
        if (!productType) {
          return res.status(400).json({ success: false, message: 'Product type is required' });
        }
        
        if (!metalType) {
          return res.status(400).json({ success: false, message: 'Metal type is required' });
        }
        
        if (!mainStoneType) {
          return res.status(400).json({ success: false, message: 'Main stone type is required' });
        }
        
        // Read main image file as base64
        const mainImageBase64 = fs.readFileSync(mainImageFile.path, { encoding: 'base64' });
        
        // Prepare stone information
        const stoneInfo = [
          {
            type: mainStoneType,
            weight: mainStoneWeight,
            position: 'main'
          }
        ];
        
        if (secondaryStoneType) {
          stoneInfo.push({
            type: secondaryStoneType,
            weight: secondaryStoneWeight || 0.5,
            position: 'secondary'
          });
        }
        
        if (otherStoneType) {
          stoneInfo.push({
            type: otherStoneType,
            weight: otherStoneWeight || 0.2,
            position: 'other'
          });
        }
        
        // Build the prompt for AI
        const productDescription = `
I am creating content for a luxury jewelry product with the following details:

PRODUCT TYPE: ${productType}
METAL TYPE: ${metalType}
METAL WEIGHT: ${metalWeight} grams
STONE INFORMATION:
${stoneInfo.map(stone => `- ${stone.position.toUpperCase()} STONE: ${stone.type}, ${stone.weight} carats`).join('\n')}
${additionalDetails ? `ADDITIONAL DETAILS: ${additionalDetails}` : ''}

I've uploaded a main product image and ${additionalImages.length} additional image(s).
        `;
        
        // Create the messages array with system prompt
        const messages = [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: "You are an expert jewelry copywriter and product description specialist for a luxury jewelry brand called 'Luster Legacy'. Create compelling, creative, and detailed jewelry product descriptions and metadata for e-commerce. Focus on craftsmanship, materials, design elements, and the emotional appeal. Price estimates should reflect luxury market positioning with USD and INR pricing.\n\nIMPORTANT: Generate highly diverse product titles that don't repeat the same patterns or formulas. Avoid overused phrases and patterns like 'The [Metal] [Stone] [Product]', 'Eternal [Stone] [Product]', or '[Stone] [Metal] [Product]'. Instead, use evocative, distinctive names that reflect the product's unique character. Each product title should stand out as completely unique in style from other titles."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: productDescription
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${mainImageBase64}`,
                }
              }
            ]
          }
        ];
        
        // Add additional images to the prompt if available
        for (const additionalImage of additionalImages) {
          const additionalImageBase64 = fs.readFileSync(additionalImage.path, { encoding: 'base64' });
          
          (messages[1].content as any).push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${additionalImageBase64}`,
            }
          });
        }
        
        // Add the specific request
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: `Based on these details and images, please generate the following for this luxury jewelry product:
1. A compelling product title (50-70 characters)
2. A catchy tagline (100-120 characters)
3. A brief marketing description (150-200 characters)
4. A detailed description highlighting materials, craftsmanship, and unique selling points (500-700 characters)
5. An estimated price in USD that reflects luxury positioning
6. An equivalent price in INR (use approximately 85 INR = 1 USD)
7. A brief analysis of what you observe in the image(s)

Format your response as structured JSON with these fields: title, tagline, shortDescription, detailedDescription, priceUSD (number), priceINR (number), and imageInsights.`
            }
          ]
        });

        // Set headers for tracking model fallback
        let usedGpt4 = true;
        
        // Perform clean up of temporary files as a separate function
        const cleanupFiles = () => {
          try {
            if (mainImageFile && fs.existsSync(mainImageFile.path)) {
              fs.unlinkSync(mainImageFile.path);
            }
            additionalImages.forEach(img => {
              if (fs.existsSync(img.path)) {
                fs.unlinkSync(img.path);
              }
            });
          } catch (cleanupError) {
            console.error("Error cleaning up temporary files:", cleanupError);
          }
        };

        // Set a timeout for the API request
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("OpenAI API request timed out after 30 seconds"));
          }, 30000); // 30 second timeout
        });

        // Call the OpenAI API with timeout
        try {
          console.log("Calling OpenAI API with primary model (gpt-4o)...");
          
          // Use Promise.race to implement timeout
          const completion = await Promise.race([
            openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
              messages: messages as any,
              temperature: 0.7,
              max_tokens: 1500,
              response_format: { type: "json_object" }
            }),
            timeoutPromise
          ]) as OpenAI.Chat.Completions.ChatCompletion;
          
          console.log("OpenAI API response received successfully");
          
          // Parse the response
          const content = completion.choices[0].message.content;
          if (!content) {
            throw new Error("Empty response from OpenAI API");
          }
          
          console.log("Raw response content:", content.substring(0, 100) + "...");
          
          let jsonResponse;
          try {
            jsonResponse = JSON.parse(content);
            console.log("JSON parsed successfully");
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            // If parsing fails, make a simple object with the raw content
            jsonResponse = { 
              title: "Generated Product",
              error: "Failed to parse AI response properly",
              rawContent: content
            };
          }
          
          // Clean up temporary files
          cleanupFiles();
          
          // Return the generated content
          console.log("Returning successful response to client");
          return res.status(200).json(jsonResponse);
          
        } catch (apiError) {
          console.error("OpenAI API error with primary model:", apiError);
          
          // Try with a fallback model
          try {
            console.log("Attempting fallback to simpler model...");
            usedGpt4 = false;
            
            // Use Promise.race to implement timeout for fallback
            const fallbackCompletion = await Promise.race([
              openai.chat.completions.create({
                model: "gpt-3.5-turbo", 
                messages: [
                  {
                    role: "system",
                    content: "You are a jewelry product description expert for a luxury brand called 'Luster Legacy'. Generate compelling product descriptions with CREATIVE, UNIQUE TITLES that avoid standard patterns. Don't use titles like 'The [Metal] [Stone] [Product]' or '[Stone] [Metal] [Product]'. Create evocative, distinct names instead."
                  },
                  {
                    role: "user",
                    content: `Generate content for a ${productType} made of ${metalType} with ${mainStoneType} stones. The title must be unique and creative - avoid generic patterns used in other jewelry products. Return in JSON format with these fields: title, tagline, shortDescription, detailedDescription, priceUSD (number), priceINR (number).`
                  }
                ],
                temperature: 0.7,
                max_tokens: 800,
                response_format: { type: "json_object" }
              }),
              timeoutPromise
            ]) as OpenAI.Chat.Completions.ChatCompletion;
            
            console.log("Fallback model response received");
            
            // Parse the response
            const fallbackContent = fallbackCompletion.choices[0].message.content;
            if (!fallbackContent) {
              throw new Error("Empty response from fallback model");
            }
            
            console.log("Raw fallback content:", fallbackContent.substring(0, 100) + "...");
            
            let fallbackJsonResponse;
            try {
              fallbackJsonResponse = JSON.parse(fallbackContent);
              console.log("Fallback JSON parsed successfully");
            } catch (parseError) {
              console.error("Fallback JSON parse error:", parseError);
              // Use a simple placeholder response
              fallbackJsonResponse = {
                title: `${productType} with ${mainStoneType}`,
                tagline: "Elegantly crafted luxury jewelry piece",
                shortDescription: "A beautiful piece of jewelry crafted with precision and care.",
                detailedDescription: `This ${productType} is made with premium ${metalType} and features exquisite ${mainStoneType} stones. It embodies luxury and sophistication.`,
                priceUSD: 1200,
                priceINR: 102000
              };
            }
            
            // Clean up temporary files
            cleanupFiles();
            
            // Set header for model fallback
            res.setHeader('X-Model-Fallback', 'true');
            
            // Return the generated content from the fallback model
            console.log("Returning fallback response to client");
            return res.status(200).json(fallbackJsonResponse);
          } catch (fallbackError) {
            console.error("Fallback model error:", fallbackError);
            // Clean up temporary files before exiting
            cleanupFiles();
            
            // Return a simpler error response
            return res.status(500).json({ 
              success: false, 
              message: "AI content generation failed. Please try again with simpler inputs or fewer images." 
            });
          }
        }
        
      } catch (err) {
        console.error("Error processing request:", err);
        return res.status(500).json({ 
          success: false, 
          message: err instanceof Error ? err.message : "An unknown error occurred" 
        });
      }
    });
    
  } catch (err) {
    console.error("Top-level error:", err);
    return res.status(500).json({ 
      success: false, 
      message: err instanceof Error ? err.message : "An unknown error occurred" 
    });
  }
};