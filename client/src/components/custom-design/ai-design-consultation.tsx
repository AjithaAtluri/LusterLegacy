import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowUp, Hourglass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export default function AIDesignConsultation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "Welcome to your personal design consultant! I can help you explore jewelry design ideas, recommend styles, and answer questions about materials and gemstones. How can I assist with your custom design today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      // Time's up
      setTimerActive(false);
      setIsOpen(false);
      toast({
        title: "Session Ended",
        description: "Your design consultation session has ended. You can start a new session if needed.",
        variant: "default"
      });
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeRemaining, toast]);

  // Scroll to bottom of messages on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConsultation = () => {
    setIsOpen(true);
    setTimerActive(true);
    setTimeRemaining(15 * 60); // Reset timer to 15 minutes
  };

  const endConsultation = () => {
    setIsOpen(false);
    setTimerActive(false);
    
    // Save consultation to server
    if (messages.length > 1) {
      const userMessages = messages.filter(m => m.role === "user" || m.role === "assistant");
      apiRequest("POST", "/api/design-consultations", {
        messages: userMessages,
        userId: user?.id
      }).catch(err => {
        console.error("Error saving consultation:", err);
      });
    }
    
    toast({
      title: "Consultation Ended",
      description: "Your design consultation has been saved.",
      variant: "default"
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Send message to AI
      const response = await apiRequest("POST", "/api/design-consultation-ai", {
        message: input.trim(),
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      
      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't generate a response at this time.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error while generating a response. Please try again.",
          timestamp: new Date()
        }
      ]);
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="w-full flex flex-col items-center justify-center bg-muted/30 p-6 rounded-lg">
        <Sparkles className="h-10 w-10 text-primary mb-4" />
        <h3 className="font-playfair text-xl font-semibold text-foreground mb-2">
          Get AI Design Inspiration
        </h3>
        <p className="font-montserrat text-foreground/70 text-center mb-4 max-w-lg">
          Chat with our AI design consultant to explore ideas, get style recommendations, 
          and learn about materials before submitting your design request.
        </p>
        <Button 
          onClick={startConsultation}
          className="flex items-center gap-2"
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          Start Design Consultation
        </Button>
        <p className="text-xs text-foreground/50 mt-3">
          Sessions are limited to 15 minutes and are not saved unless you submit a design request.
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <div className="bg-primary/10 flex items-center justify-between p-3">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-playfair font-semibold">AI Design Consultation</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm font-medium">
            <Hourglass className="h-4 w-4 mr-1" />
            <span>{formatTimeRemaining()}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={endConsultation}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 h-[350px] overflow-y-auto">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 ${
              message.role === "user" 
                ? "ml-auto max-w-[80%]" 
                : message.role === "system" 
                  ? "mx-auto max-w-[90%] text-center" 
                  : "mr-auto max-w-[80%]"
            }`}
          >
            <div className={`p-3 rounded-lg ${
              message.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : message.role === "system" 
                  ? "bg-muted/60 text-foreground/80 italic" 
                  : "bg-card text-foreground border"
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe your jewelry ideas or ask for suggestions..."
            className="min-h-[60px]"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()}
            className="h-full aspect-square"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}