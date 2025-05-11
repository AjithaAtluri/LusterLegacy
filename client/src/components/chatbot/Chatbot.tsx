import React, { useRef, useEffect, useState } from "react";
import { Send, X, Maximize2, Minimize2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatbot } from "@/contexts/ChatbotContext";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ChatbotMessage: React.FC<{
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}> = ({ role, content, timestamp }) => {
  return (
    <div
      className={`flex ${
        role === "user" ? "justify-end" : "justify-start"
      } mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <div className="text-sm">{content}</div>
        {timestamp && (
          <div className="text-xs mt-1 opacity-70">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatbotButton: React.FC = () => {
  const { toggleChat, isChatOpen } = useChatbot();

  return (
    <Button
      onClick={toggleChat}
      className="fixed bottom-5 right-5 rounded-full h-12 w-12 p-0 shadow-lg"
      aria-label={isChatOpen ? "Close chat" : "Open chat"}
    >
      <MessageCircle size={24} />
    </Button>
  );
};

const ChatbotWindow: React.FC = () => {
  const { messages, sendMessage, isLoading, closeChat, isChatOpen, clearChat } = useChatbot();
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!isChatOpen) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-5 right-5 w-[350px] rounded-lg shadow-xl bg-card border border-border z-50 overflow-hidden transition-all duration-300 ${
        isMinimized ? "h-14" : "h-[500px]"
      }`}
    >
      {/* Chat Header */}
      <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <MessageCircle className="mr-2 h-5 w-5" />
          Luster Legacy Assistant
        </h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-primary-foreground/20"
            onClick={toggleMinimize}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-primary-foreground/20"
            onClick={closeChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      {!isMinimized && (
        <>
          <div className="h-[380px] overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <ChatbotMessage
                key={index}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t">
            <form
              onSubmit={handleSubmit}
              className="flex items-center space-x-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="min-h-9 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export const Chatbot: React.FC = () => {
  return (
    <>
      <ChatbotButton />
      <ChatbotWindow />
    </>
  );
};

export default Chatbot;