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
    console.log("DEBUG - OpenAI testimonial input data:", JSON.stringify({
      purchaseType: inputData.purchaseType,
      giftGiver: inputData.giftGiver,
      occasion: inputData.occasion
    }, null, 2));
    
    // Build the prompt based on the available data - with stricter checking
    let purchaseContext = "This was purchased for themselves.";
    
    // Explicitly check each purchase type to ensure correct context
    if (inputData.purchaseType === "gift_for") {
      // Gift FOR someone (user bought it as a gift)
      purchaseContext = `This was purchased as a gift for ${inputData.giftGiver || "someone special"}.`;
      console.log("Using GIFT FOR context");
    } 
    else if (inputData.purchaseType === "gift_from") {
      // Gift FROM someone (user received it as a gift)
      purchaseContext = `This was received as a gift from ${inputData.giftGiver || "someone special"}.`;
      console.log("Using GIFT FROM context");
    }
    else if (inputData.purchaseType === "self") {
      // Self purchase (default)
      purchaseContext = "This was purchased for themselves.";
      console.log("Using SELF PURCHASE context");
    }
    else {
      // If for some reason purchaseType is invalid or missing
      console.log("WARNING: Unknown purchase type:", inputData.purchaseType);
      purchaseContext = "This was purchased for themselves.";
    }
    
    console.log("DEBUG - Final purchase context:", purchaseContext);

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
      Create a genuine, natural-sounding testimonial for a luxury jewelry brand called Luster Legacy. Make it sound like a real person talking about their experience, not like marketing copy.
      
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
      
      1. A brief testimonial (2-3 sentences) that captures the person's genuine feelings in a conversational tone.
      
      2. A detailed story (2-3 paragraphs) that sounds like someone naturally telling a friend about their experience.
      
      Both versions should:
      - Use casual, conversational language with occasional filler words or natural speech patterns
      - Include natural human imperfections in speech (like starting sentences with "And" or using contractions)
      - Avoid marketing buzzwords or overly formal language
      - Sound like a real person would talk, not like an advertisement
      - Include personal details and specific reactions to make it feel authentic
      - Mention the recipient's genuine reaction if it was a gift
      
      If images were uploaded, reference them naturally, like "I had to share a pic of this gorgeous piece" or "The photo doesn't even do it justice, honestly."
      
      If the original testimonial is already well-written, preserve its casual voice and personal style.
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