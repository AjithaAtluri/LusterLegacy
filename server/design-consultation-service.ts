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
  if (formData) {
    let formContext = "\n\nThe customer has provided the following information in their design form:";
    
    if (formData.metalType) {
      formContext += `\n- Preferred Metal: ${formData.metalType}`;
    }
    
    if (formData.gemstones && formData.gemstones.length > 0) {
      formContext += `\n- Gemstone Preferences: ${formData.gemstones.join(', ')}`;
    }
    
    if (formData.designDescription) {
      formContext += `\n- Design Description: "${formData.designDescription}"`;
    }
    
    formContext += "\n\nUse this information to provide more personalized guidance in your responses.";
    
    systemPrompt += formContext;
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