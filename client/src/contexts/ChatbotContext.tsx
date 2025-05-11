import React, { createContext, useState, useContext, useCallback, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
};

interface ChatbotContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isChatOpen: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm Luster Legacy's virtual assistant. How can I help you today?\n\nI can assist with information about our services:\n- [Custom Design](/custom-design) - Bespoke jewelry from scratch ($150 consultation fee)\n- [Personalization](/collections) - Modify our existing designs\n- [Request a Quote](/collections) - Get pricing for catalog items\n\nOr visit our [FAQ page](/faq) for common questions.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Add user message to chat
      const userMessage: ChatMessage = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Format chat history for the API (we only need role and content)
        const chatHistory = messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map(({ role, content }) => ({ role, content }));

        // Call the API
        const response = await apiRequest("POST", "/api/chatbot", {
          message,
          chatHistory,
        });

        const data = await response.json();

        // Add assistant response to chat
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error sending message to chatbot:", error);
        toast({
          title: "Error",
          description: "Failed to get a response. Please try again later.",
          variant: "destructive",
        });
        
        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm sorry, I'm having trouble connecting right now. Please try again or contact our team through the contact form.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, toast]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm Luster Legacy's virtual assistant. How can I help you today?\n\nI can assist with information about our services:\n- [Custom Design](/custom-design) - Bespoke jewelry from scratch ($150 consultation fee)\n- [Personalization](/collections) - Modify our existing designs\n- [Request a Quote](/collections) - Get pricing for catalog items\n\nOr visit our [FAQ page](/faq) for common questions.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);
  
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <ChatbotContext.Provider
      value={{
        messages,
        isLoading,
        isChatOpen,
        sendMessage,
        clearChat,
        openChat,
        closeChat,
        toggleChat
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
};