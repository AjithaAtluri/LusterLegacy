import OpenAI from "openai";
import { AIInputs } from "@shared/schema";

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
    purchaseType?: "self" | "gift";
    giftGiver?: string;
    occasion?: string;
    satisfaction?: "very_much" | "ok" | "did_not";
    wouldReturn?: boolean;
    imageUrls?: string[];
  }
): Promise<{ generatedTestimonial: string; aiInputData: any }> {
  try {
    // Build the prompt based on the available data
    const purchaseContext = inputData.purchaseType === "gift" 
      ? `This was purchased as a gift for ${inputData.giftGiver || "someone special"}.`
      : "This was purchased for themselves.";

    const occasionContext = inputData.occasion 
      ? `The occasion was ${inputData.occasion.replace('_', ' ')}.` 
      : "";
      
    const satisfactionContext = inputData.satisfaction 
      ? `The customer was ${inputData.satisfaction.replace('_', ' ')} satisfied with the purchase.` 
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
      
      Create an enhanced, natural-sounding testimonial that captures the essence of the customer's feedback,
      emphasizes the luxury nature of the jewelry, the customer's emotional connection to the piece,
      and the craftsmanship of Luster Legacy. The testimonial should be in first person, as if spoken by the customer.
      It should be 2-3 paragraphs long, authentic, and not overly promotional.
      
      If the original testimonial is already well-written, maintain its voice and style while enhancing it.
      Do not invent specific product details that weren't mentioned.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const generatedTestimonial = response.choices[0].message.content?.trim() || "";

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
      imageUrls: inputData.imageUrls
    };

    return {
      generatedTestimonial,
      aiInputData
    };
  } catch (error) {
    console.error("Error generating AI testimonial:", error);
    throw new Error(`Failed to generate AI testimonial: ${error.message}`);
  }
}

/**
 * Process image and generate a description
 */
export async function processImageForTestimonial(
  imageUrl: string
): Promise<string> {
  try {
    // Base64 decode is handled outside this function
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this piece of jewelry in detail, focusing on its craftsmanship, design elements, stones, and overall aesthetic. Keep it brief (1-2 sentences)."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ],
        },
      ],
      max_tokens: 150,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error processing image for testimonial:", error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}