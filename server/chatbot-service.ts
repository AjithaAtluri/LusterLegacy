import OpenAI from "openai";
import { chatSystemPrompt } from "./utils/chatbot-prompts";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Type for chat messages
type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Generate a chatbot response using the OpenAI API
 * @param userMessage - The message from the user
 * @param chatHistory - Previous chat history
 * @returns Promise<string> - The generated response
 */
export async function generateChatbotResponse(
  userMessage: string,
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not set. Using fallback response.");
      return "I'm sorry, I'm not able to respond at the moment. Please try contacting our team through the contact form.";
    }

    // Prepare the messages array with system prompt
    const messages: ChatMessage[] = [
      { role: "system", content: chatSystemPrompt },
      // Add chat history (limited to prevent token limit issues)
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      // Add the current user message
      { role: "user", content: userMessage }
    ];

    // Call the OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // Return the generated response
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again later or contact our team through the contact form for assistance.";
  }
}