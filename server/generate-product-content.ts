import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "temp");
    
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
        
        // Extract additional images if present
        const additionalImages = [];
        if (files.additionalImage1) additionalImages.push(files.additionalImage1[0]);
        if (files.additionalImage2) additionalImages.push(files.additionalImage2[0]);
        if (files.additionalImage3) additionalImages.push(files.additionalImage3[0]);
        
        // Check if main image was uploaded
        if (!mainImageFile) {
          return res.status(400).json({ success: false, message: 'Main image is required' });
        }
        
        // Get form data
        const productTypes = JSON.parse(req.body.productTypes || '[]');
        const metalTypes = JSON.parse(req.body.metalTypes || '[]');
        const metalWeight = parseFloat(req.body.metalWeight) || 5;
        const mainStoneType = req.body.mainStoneType;
        const mainStoneWeight = parseFloat(req.body.mainStoneWeight) || 1;
        const secondaryStoneType = req.body.secondaryStoneType || null;
        const secondaryStoneWeight = secondaryStoneType ? parseFloat(req.body.secondaryStoneWeight) || 0.5 : null;
        const otherStoneType = req.body.otherStoneType || null;
        const otherStoneWeight = otherStoneType ? parseFloat(req.body.otherStoneWeight) || 0.2 : null;
        const additionalDetails = req.body.additionalDetails || '';
        
        // Validate required fields
        if (productTypes.length === 0) {
          return res.status(400).json({ success: false, message: 'At least one product type is required' });
        }
        
        if (metalTypes.length === 0) {
          return res.status(400).json({ success: false, message: 'At least one metal type is required' });
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

PRODUCT TYPE(S): ${productTypes.join(', ')}
METAL TYPE(S): ${metalTypes.join(', ')}
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
                text: "You are an expert jewelry copywriter and product description specialist for a luxury jewelry brand called 'Luster Legacy'. Create compelling, creative, and detailed jewelry product descriptions and metadata for e-commerce. Focus on craftsmanship, materials, design elements, and the emotional appeal. Price estimates should reflect luxury market positioning with USD and INR pricing."
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
        
        // Call the OpenAI API
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: messages as any,
            temperature: 0.7,
            max_tokens: 1500,
            response_format: { type: "json_object" }
          });
          
          // Parse the response
          const content = completion.choices[0].message.content;
          const jsonResponse = JSON.parse(content || "{}");
          
          // Clean up temporary files
          try {
            fs.unlinkSync(mainImageFile.path);
            additionalImages.forEach(img => fs.unlinkSync(img.path));
          } catch (cleanupError) {
            console.error("Error cleaning up temporary files:", cleanupError);
          }
          
          // Set header if model fallback occurred
          if (!usedGpt4) {
            res.setHeader('X-Model-Fallback', 'true');
          }
          
          // Return the generated content
          return res.status(200).json(jsonResponse);
          
        } catch (apiError) {
          console.error("OpenAI API error:", apiError);
          
          // Try with a fallback model
          try {
            usedGpt4 = false;
            const fallbackCompletion = await openai.chat.completions.create({
              model: "gpt-3.5-turbo", 
              messages: messages as any,
              temperature: 0.7,
              max_tokens: 1000,
              response_format: { type: "json_object" }
            });
            
            // Parse the response
            const fallbackContent = fallbackCompletion.choices[0].message.content;
            const fallbackJsonResponse = JSON.parse(fallbackContent || "{}");
            
            // Clean up temporary files
            try {
              fs.unlinkSync(mainImageFile.path);
              additionalImages.forEach(img => fs.unlinkSync(img.path));
            } catch (cleanupError) {
              console.error("Error cleaning up temporary files:", cleanupError);
            }
            
            // Set header for model fallback
            res.setHeader('X-Model-Fallback', 'true');
            
            // Return the generated content from the fallback model
            return res.status(200).json(fallbackJsonResponse);
          } catch (fallbackError) {
            console.error("Fallback model error:", fallbackError);
            throw new Error("Failed to generate content with both primary and fallback models");
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