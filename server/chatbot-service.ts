import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user.
const CHATBOT_MODEL = "gpt-4o";

// System message to guide the chatbot's behavior
const SYSTEM_MESSAGE = `You are a helpful assistant for Luster Legacy, a luxury custom jewelry brand.

IMPORTANT GUIDELINES:
1. Be friendly, professional, and helpful.
2. You can answer questions about our services, jewelry types, materials, and general processes.
3. DO NOT provide specific pricing information for individual stones or materials.
4. DO NOT share internal company information or sensitive details about our supply chain.
5. Suggest users fill out our contact form for:
   - Custom design inquiries requiring personal consultation
   - Specific price quotes for items
   - Account-specific questions 
   - Complex design requests
   
INFORMATION ABOUT OUR SERVICES:
1. Custom Design Service ($150 consultation fee, covers up to 4 iterations)
   - For creating completely new, unique jewelry pieces
   - Timeline: 2-3 weeks design phase, 4-8 weeks production
   - Fee is credited toward final purchase

2. Final Quote Service (free)
   - For getting exact pricing on catalog items without modifications
   - No obligation quote valid for 14 days
   
3. Personalization Service (free to request)
   - For modifying existing catalog pieces (metal type, stones, size)
   - Timeline: 3-6 weeks after approval

MATERIALS WE OFFER:
- Metals: 18K gold (yellow, white, rose), 14K gold, platinum, sterling silver
- Gemstones: Diamonds (natural and lab-grown), rubies, sapphires, emeralds, semi-precious stones
- We use ethically sourced materials and provide certificates of authenticity

Keep responses concise and to the point. If unsure about any question, suggest the customer complete our contact form for personalized assistance.`;

export async function generateChatbotResponse(
  userMessage: string,
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  try {
    // Prepare the messages array with system message and chat history
    const messages = [
      { role: "system", content: SYSTEM_MESSAGE },
      ...chatHistory,
      { role: "user", content: userMessage },
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    // Generate a response using the OpenAI API
    const response = await openai.chat.completions.create({
      model: CHATBOT_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const chatbotResponse = response.choices[0].message.content?.trim() || 
      "I apologize, but I'm having trouble processing your request. Please try again or contact our team directly.";

    return chatbotResponse;
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    return "I apologize, but I'm experiencing technical difficulties. Please try again later or reach out to our team through the contact form.";
  }
}