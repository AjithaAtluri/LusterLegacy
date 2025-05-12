import { useState, useRef, useEffect, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Send, Sparkles, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { createPortal } from "react-dom";
import { DesignFormContext } from "./design-form";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface AIDesignConsultationProps {
  integratedWithForm?: boolean;
}

export default function AIDesignConsultation({ integratedWithForm = false }: AIDesignConsultationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const formContext = useContext(DesignFormContext);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [formDataReady, setFormDataReady] = useState(false);
  
  // Initialize the session timer when chat becomes active
  useEffect(() => {
    if (isActive && !startTime) {
      setStartTime(new Date());
    }
  }, [isActive, startTime]);
  
  // Timer for the 15-minute consultation limit
  useEffect(() => {
    if (!startTime) return;
    
    const timerInterval = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime();
      const fifteenMinutesMs = 15 * 60 * 1000;
      const remainingMs = fifteenMinutesMs - elapsedMs;
      
      if (remainingMs <= 0) {
        // Time is up
        setTimeLeft(0);
        setIsActive(false);
        clearInterval(timerInterval);
        toast({
          title: "Consultation ended",
          description: "Your 15-minute AI design consultation has ended. You can request a new consultation later.",
          variant: "default",
        });
      } else {
        // Update time left in minutes
        setTimeLeft(Math.ceil(remainingMs / 60000));
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [startTime, toast]);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);
  
  // Add effect to check for DOM element for button placement
  useEffect(() => {
    if (integratedWithForm) {
      // Check if the button container exists in the DOM
      const buttonContainer = document.getElementById('ai-consultation-button-container');
      if (buttonContainer) {
        setFormDataReady(true);
      }
    }
  }, [integratedWithForm]);
  
  // Format time left for display
  const formatTimeLeft = () => {
    if (timeLeft === null) return "15:00";
    const minutes = Math.floor(timeLeft);
    const seconds = Math.round((timeLeft - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  
  const handleStartConsultation = () => {
    setIsActive(true);
    setStartTime(new Date());
    setChatHistory([]);
    setTimeLeft(15);
    
    // Initial system message to explain the consultation
    const systemMessage: Message = {
      role: "assistant",
      content: "Welcome to your AI design consultation! I'm here to help you explore jewelry design ideas, suggest materials, gemstones, and answer your questions about custom jewelry design. What kind of jewelry piece are you interested in creating?",
      timestamp: new Date()
    };
    
    setChatHistory([systemMessage]);
  };
  
  const handleEndConsultation = async () => {
    // Save the chat history if there were meaningful exchanges
    if (chatHistory.length > 1) {
      try {
        await apiRequest("POST", "/api/design-consultations", {
          messages: chatHistory,
          userId: user?.id
        });
        
        toast({
          title: "Consultation saved",
          description: "Your design consultation has been saved for future reference.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error saving consultation:", error);
      }
    }
    
    // Reset the consultation state
    setIsActive(false);
    setStartTime(null);
    setTimeLeft(null);
    setChatHistory([]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date()
    };
    
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Log form context to debug
      console.log("AI Design Consultation - Form Context:", formContext);
      
      // Prepare form data for context if it exists
      let formData = null;
      
      if (integratedWithForm && formContext) {
        formData = {
          metalType: formContext.metalType || "",
          gemstones: formContext.selectedStones || [],
          designDescription: formContext.formValues?.notes || ""
        };
        
        // Make sure we have non-empty values to include
        if (!formData.metalType) {
          console.log("AI Design Consultation - No metal type in form context");
        }
        
        if (!formData.gemstones || formData.gemstones.length === 0) {
          console.log("AI Design Consultation - No gemstones in form context");
        }
        
        if (!formData.designDescription) {
          console.log("AI Design Consultation - No design description in form context");
        }
      }
      
      // Log the prepared form data
      console.log("AI Design Consultation - Prepared Form Data:", formData);
      
      // Send message to API with form context data if available
      const response = await apiRequest("POST", "/api/design-consultation-ai", {
        message: userMessage.content,
        history: chatHistory,
        formData: formData
      });
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };
      
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render the form button when integrated with the form
  const FormButton = () => (
    <Button 
      onClick={handleStartConsultation} 
      className="w-full font-montserrat bg-accent hover:bg-accent/90 text-background px-6 py-3 transition-colors flex items-center justify-center gap-2 h-auto"
    >
      <Sparkles size={16} />
      Get AI Design Guidance
    </Button>
  );

  // Render the standalone consultation button
  const StandaloneCard = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          AI Design Consultation
        </CardTitle>
        <CardDescription>
          Get instant design ideas and inspiration from our AI design consultant. 
          Explore materials, gemstones, and styles for your custom jewelry piece.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={handleStartConsultation} className="w-full">
          Start Free AI Consultation (15 min)
        </Button>
      </CardFooter>
    </Card>
  );

  // Render the consultation chat interface when active
  const ChatInterface = () => (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Design Consultation
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatTimeLeft()} left</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleEndConsultation}
              title="End consultation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Ask questions and get design recommendations. Your session will end in {timeLeft} minutes.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-[350px] overflow-y-auto mb-4 pr-2">
          {chatHistory.map((msg, index) => (
            <div 
              key={index} 
              className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role !== "user" && (
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src="/logo-icon.png" alt="Design AI" />
                  <AvatarFallback>LL</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary"
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
              
              {msg.role === "user" && (
                <Avatar className="w-8 h-8 ml-2">
                  <AvatarImage src="/default-avatar.png" alt="You" />
                  <AvatarFallback>YOU</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <Avatar className="w-8 h-8 mr-2">
                <AvatarImage src="/logo-icon.png" alt="Design AI" />
                <AvatarFallback>LL</AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] px-4 py-2 rounded-lg bg-secondary flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-1 animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full mr-1 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            placeholder="Ask about design ideas, materials, or styles..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 min-h-[60px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Render the button in the form when integrated */}
      {integratedWithForm && formDataReady && createPortal(
        <FormButton />,
        document.getElementById('ai-consultation-button-container')!
      )}
      
      {/* Render the main consultation interface */}
      {integratedWithForm ? (
        // When integrated with form, only show chat when active
        isActive && <ChatInterface />
      ) : (
        // When standalone, show either the card or the chat
        isActive ? <ChatInterface /> : <StandaloneCard />
      )}
    </>
  );
}