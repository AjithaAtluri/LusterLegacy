import OpenAI from "openai";
import { AIInputs } from "@shared/schema";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate an AI testimonial based on user input data
 */
export async function generateAITestimonial(
  inputData: {
    name: string;
    productType: string;
    rating: number;
    text: string;
    story?: string;
    purchaseType?: "self" | "gift_for" | "gift_from";
    giftGiver?: string;
    occasion?: string;
    satisfaction?: "very_much" | "ok" | "did_not";
    wouldReturn?: boolean;
    imageUrls?: string[];
  }
): Promise<{ generatedTestimonial: string; generatedStory: string; aiInputData: any }> {
  try {
    // Log the raw input data for debugging
    console.log("DEBUG - OpenAI testimonial input data:", {
      purchaseType: inputData.purchaseType,
      giftGiver: inputData.giftGiver,
      occasion: inputData.occasion
    });
    
    // Build the prompt based on the available data
    let purchaseContext = "This was purchased for themselves.";
    
    // Handle different purchase types properly
    if (inputData.purchaseType === "gift_for") {
      purchaseContext = `This was purchased as a gift for ${inputData.giftGiver || "someone special"}.`;
    } else if (inputData.purchaseType === "gift_from") {
      purchaseContext = `This was received as a gift from ${inputData.giftGiver || "someone special"}.`;
    }
    
    console.log("DEBUG - Generated purchase context:", purchaseContext);

    const occasionContext = inputData.occasion 
      ? `The occasion was ${inputData.occasion.replace(/_/g, ' ')}.` 
      : "";
      
    const satisfactionContext = inputData.satisfaction 
      ? `The customer was ${inputData.satisfaction.replace(/_/g, ' ')} satisfied with the purchase.` 
      : "";
      
    const returnContext = inputData.wouldReturn !== undefined 
      ? `The customer ${inputData.wouldReturn ? "would" : "would not"} return for more designs.` 
      : "";

    // Combine the contexts
    const userContext = `
      ${purchaseContext}
      ${occasionContext}
      ${satisfactionContext}
      ${returnContext}
    `;

    const userTestimonial = inputData.text || "";
    const userStory = inputData.story || "";
    
    // Process images if available
    let imageDescriptions = "";
    let imagesList = [];
    
    if (inputData.imageUrls && inputData.imageUrls.length > 0) {
      console.log(`Processing ${inputData.imageUrls.length} images for testimonial`);
      
      try {
        // For each image, extract a description
        for (const urlPath of inputData.imageUrls) {
          try {
            // Format image path for processing
            // Note: Only using a basic description since we're skipping vision API processing
            const fileName = path.basename(urlPath);
            
            imagesList.push({
              url: urlPath,
              fileName: fileName
            });
            
            console.log(`Added image to testimonial data: ${fileName}`);
          } catch (imgError) {
            console.error(`Error processing image ${urlPath}:`, imgError);
          }
        }
        
        // Add a generic description for the images
        if (imagesList.length > 0) {
          imageDescriptions = `The customer uploaded ${imagesList.length} image(s) of the jewelry piece. 
            Make sure to mention that the craftsmanship of the piece is highlighted in the photos.`;
        }
      } catch (imagesError) {
        console.error("Error processing images for testimonial:", imagesError);
      }
    }
    
    const prompt = `
      Create a professional and compelling testimonial for a luxury jewelry brand called Luster Legacy.
      
      Customer info:
      - Name: ${inputData.name}
      - Product: ${inputData.productType}
      - Rating: ${inputData.rating}/5 stars
      
      Context:
      ${userContext}
      
      Customer testimonial:
      "${userTestimonial}"
      
      Additional story (if provided):
      "${userStory}"
      
      ${imageDescriptions}
      
      Create TWO distinct versions of a testimonial:
      
      1. A brief testimonial (2-3 sentences) that captures the essence of the customer's experience, suitable for display in a testimonial card.
      
      2. A detailed story (2-3 paragraphs) that elaborates on their experience with the jewelry, the emotional connection, and the quality of the craftsmanship.
      
      Both versions should:
      - Be in first person, as if spoken by the customer
      - Emphasize the luxury nature of the jewelry
      - Highlight the emotional connection to the piece
      - Mention the craftsmanship of Luster Legacy
      - Be authentic and not overly promotional
      
      If images were uploaded, make a subtle reference to the visual beauty of the piece, using phrases like
      "as you can see in the photos" or "the craftsmanship is evident in every detail".
      
      If the original testimonial is already well-written, maintain its voice and style while enhancing it.
      Do not invent specific product details that weren't mentioned.
      
      Format your response exactly like this:
      
      BRIEF:
      [brief testimonial here]
      
      STORY:
      [detailed story here]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const fullContent = response.choices[0].message.content?.trim() || "";
    console.log("Raw AI response:", fullContent);
    
    // Extract brief testimonial and full story from the formatted response
    const briefMatch = fullContent.match(/BRIEF:\s*([\s\S]*?)(?=\s*STORY:|$)/i);
    const storyMatch = fullContent.match(/STORY:\s*([\s\S]*?)$/i);
    
    const briefTestimonial = briefMatch ? briefMatch[1].trim() : fullContent;
    const detailedStory = storyMatch ? storyMatch[1].trim() : "";
    
    console.log("Extracted brief testimonial:", briefTestimonial);
    console.log("Extracted detailed story:", detailedStory ? "Found" : "Not found");

    // Return both the generated testimonial and the data used for the generation
    const aiInputData = {
      prompt,
      name: inputData.name,
      productType: inputData.productType,
      rating: inputData.rating,
      purchaseType: inputData.purchaseType,
      giftGiver: inputData.giftGiver,
      occasion: inputData.occasion,
      satisfaction: inputData.satisfaction,
      wouldReturn: inputData.wouldReturn,
      originalText: inputData.text,
      originalStory: inputData.story,
      imageUrls: inputData.imageUrls,
      imagesList: imagesList
    };

    return {
      generatedTestimonial: briefTestimonial,
      generatedStory: detailedStory,
      aiInputData
    };
  } catch (error) {
    console.error("Error generating AI testimonial:", error);
    throw new Error(`Failed to generate AI testimonial: ${error.message}`);
  }
}

/**
 * Process image and generate a description
 * This function is maintained for compatibility but not used directly anymore
 */
export async function processImageForTestimonial(
  imageUrl: string
): Promise<string> {
  console.log("WARNING: processImageForTestimonial is deprecated and should not be called directly");
  return "This jewelry piece showcases exquisite craftsmanship with attention to detail.";
}