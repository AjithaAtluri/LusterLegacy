import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface FormData {
  metalType?: string;
  gemstones?: string[];
  designDescription?: string;
  imageDataUrl?: string; // Base64 encoded image data
}

/**
 * Generate a response from the AI about jewelry design
 */
export async function generateDesignConsultationResponse(
  message: string,
  history: Message[] = [],
  formData?: FormData | null
): Promise<string> {
  // Create system message with instructions and incorporate form data if available
  let systemPrompt = `You are an expert jewelry designer and consultant for Luster Legacy, a luxury custom jewelry brand. 
Your role is to help customers explore design ideas, recommend styles, materials, and gemstones for their custom jewelry.
Be specific, helpful, and inspirational. Provide thoughtful advice about jewelry design options.
Focus on these key aspects:
1. Understand the customer's design preferences and style
2. Recommend appropriate materials (gold, platinum, etc.)
3. Suggest gemstone options that match their vision
4. Explain design elements like settings, bands, and details
5. Consider wearability, durability, and timelessness

Keep your responses concise and focused on helping the customer refine their design vision.
Do not provide pricing information - only mention that final quotes will be provided after design consultation.

If you don't know the answer to a specific technical question, be honest and suggest they ask their dedicated designer during the consultation.`;

  // Add context from the form data if available
  console.log("Design Consultation Service - Form Data received:", formData);
  
  if (formData) {
    let formContext = "\n\nThe customer has provided the following information in their design form:";
    
    if (formData.metalType) {
      formContext += `\n- Preferred Metal: ${formData.metalType}`;
      console.log("Design Consultation Service - Using metal type:", formData.metalType);
    }
    
    if (formData.gemstones && formData.gemstones.length > 0) {
      formContext += `\n- Gemstone Preferences: ${formData.gemstones.join(', ')}`;
      console.log("Design Consultation Service - Using gemstones:", formData.gemstones);
    }
    
    if (formData.designDescription) {
      formContext += `\n- Design Description: "${formData.designDescription}"`;
      console.log("Design Consultation Service - Using design description:", formData.designDescription);
    }
    
    // Set up OpenAI API call to analyze image if provided
    if (formData.imageDataUrl) {
      try {
        console.log("Design Consultation Service - Image provided, analyzing...");
        
        // If image is base64, extract content part (removing data:image/jpeg;base64, etc.)
        let imageContent = formData.imageDataUrl;
        if (imageContent.includes('base64,')) {
          imageContent = imageContent.split('base64,')[1];
        }
        
        // Send image for analysis to vision model
        const imageAnalysisResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            {
              role: "system",
              content: "You are a luxury jewelry expert analyzing design inspiration images. Describe the image in detail, focusing on jewelry design elements relevant to creating a custom piece. Identify metals, gemstones, setting styles, and unique design features. Organize your analysis into sections: Overall Style, Metal Elements, Gemstones, Setting Type, and Special Design Features. Be concise but detailed."
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageContent}`
                  }
                },
                {
                  type: "text",
                  text: "Analyze this jewelry image for custom design inspiration. Describe what you see in detail."
                }
              ]
            }
          ],
          max_tokens: 500
        });
        
        // Add the image analysis to the form context
        const imageAnalysis = imageAnalysisResponse.choices[0].message.content;
        formContext += "\n\n- Image Analysis:\n" + imageAnalysis;
        console.log("Design Consultation Service - Image analysis added to context");
      } catch (error) {
        console.error("Design Consultation Service - Error analyzing image:", error);
        formContext += "\n\n- Image was provided but could not be analyzed due to technical issues.";
      }
    }
    
    formContext += "\n\nUse this information to provide more personalized guidance in your responses. If an image was analyzed, refer to specific elements from the image analysis in your recommendations.";
    console.log("Design Consultation Service - Form context appended to prompt");
    
    systemPrompt += formContext;
  } else {
    console.log("Design Consultation Service - No form data provided");
  }

  // Default history with system message if not provided
  if (history.length === 0 || history[0].role !== "system") {
    history = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...history,
    ];
  }

  try {
    // Add the new user message
    history.push({
      role: "user",
      content: message,
    });

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: history,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Return the generated response
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a design recommendation at this time.";
  } catch (error) {
    console.error("Error generating design consultation response:", error);
    return "I apologize, but I'm having trouble providing design recommendations at the moment. Please try again shortly or continue with your design request.";
  }
}