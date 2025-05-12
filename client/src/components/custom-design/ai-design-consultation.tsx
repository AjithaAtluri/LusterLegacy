import { useState, useRef, useEffect, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Send, Sparkles, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { DesignFormContext } from "./design-form";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface FormData {
  metalType: string;
  gemstones: string[];
  designDescription: string;
}

interface AIDesignConsultationProps {
  integratedWithForm?: boolean;
  formState?: {
    metalType: string;
    selectedStones: string[];
    notes: string;
  };
}

function StartConsultationButton({ onStart }: { onStart: () => void }) {
  return (
    <Button 
      onClick={onStart}
      className="w-full mb-4 bg-primary hover:bg-primary/90"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Start AI Design Consultation
    </Button>
  );
}

// This is an improved version of the component that is less dependent on form state interactions
export default function AIDesignConsultation({ 
  integratedWithForm = false, 
  formState = { metalType: "", selectedStones: [], notes: "" } 
}: AIDesignConsultationProps) {
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
  
  // Ensure the form data ready flag is set
  useEffect(() => {
    // Set form data as ready if we have any context
    if (integratedWithForm && formContext) {
      console.log("AI Design Consultation - Setting form data ready");
      setFormDataReady(true);
    }
  }, [integratedWithForm, formContext]);
  
  // Helper function for type checking with window
  interface WindowWithCustomProps extends Window {
    startAIConsultation?: (state: any) => void;
  }
  
  // Create a global method to start the consultation and listen for events
  useEffect(() => {
    // Define a global method to start the consultation
    (window as WindowWithCustomProps).startAIConsultation = (capturedFormState: any) => {
      console.log("AI Design Consultation - Global method trigger received");
      
      if (capturedFormState) {
        console.log("AI Design Consultation - Using captured form state:", capturedFormState);
        // Use the captured form state to override the existing state 
        const updatedFormState = {
          ...formState,
          ...capturedFormState
        };
        
        // Start consultation with updated form state
        handleStartConsultationWithState(updatedFormState);
      } else {
        // Start with existing form state
        handleStartConsultation();
      }
    };
    
    // Legacy event listener for backward compatibility
    const handleStartEvent = () => {
      console.log("AI Design Consultation - Received start event");
      handleStartConsultation();
    };
    
    window.addEventListener('start-ai-consultation', handleStartEvent);
    
    return () => {
      window.removeEventListener('start-ai-consultation', handleStartEvent);
      delete (window as WindowWithCustomProps).startAIConsultation;
    };
  }, [formContext, formState]); // Include both dependencies
  
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
  
  // Interface for our form data structure
  interface FormDataType {
    metalType: string;
    selectedStones: string[];
    notes: string;
  }
  
  // Generate a welcome message based on the form data
  const generateWelcomeMessage = (data: FormDataType) => {
    // Generate a context-aware welcome message
    let welcomeMessage = "Welcome to your AI design consultation! I'm here to help you explore jewelry design ideas, suggest materials, gemstones, and answer your questions about custom jewelry design.";
    
    // Add context from the form data
    if (data.metalType) {
      welcomeMessage += ` I see you're interested in ${data.metalType} for your piece.`;
    }
    
    if (data.selectedStones && data.selectedStones.length > 0) {
      welcomeMessage += ` You've selected ${data.selectedStones.join(", ")} for gemstones.`;
    }
    
    if (data.notes) {
      welcomeMessage += ` I'll keep in mind your design notes: "${data.notes}"`;
    }
    
    welcomeMessage += " What specific questions do you have about your jewelry design?";
    
    // Create the system message
    const systemMessage: Message = {
      role: "assistant",
      content: welcomeMessage,
      timestamp: new Date()
    };
    
    // Set the chat history with this welcome message
    setChatHistory([systemMessage]);
    
    // Log the message
    console.log("AI Design Consultation - Initial message set:", systemMessage);
  };
  
  // New function that accepts explicit form state
  const handleStartConsultationWithState = (explicitFormState: any) => {
    setIsActive(true);
    setStartTime(new Date());
    setChatHistory([]);
    setTimeLeft(15);
    
    console.log("AI Consultation - Using explicit form state:", explicitFormState);
    
    // Make sure we have valid data by filtering out undefined values
    const currentFormData: FormDataType = {
      metalType: explicitFormState?.metalType || "",
      selectedStones: (explicitFormState?.selectedStones || []).filter((stone: any) => stone),
      notes: explicitFormState?.notes || ""
    };
    
    console.log("AI Consultation - Form data extracted from explicit state:", currentFormData);
    
    // Generate welcome message and initialize chat
    generateWelcomeMessage(currentFormData);
  };
  
  // Original function that uses the component props and context
  const handleStartConsultation = () => {
    setIsActive(true);
    setStartTime(new Date());
    setChatHistory([]);
    setTimeLeft(15);
    
    // Use the formState prop directly if available (new approach)
    // Otherwise fall back to the context (for backward compatibility)
    console.log("AI Consultation - Form state prop received:", formState);
    
    // Make sure we have valid data by filtering out undefined values
    const currentFormData: FormDataType = {
      metalType: formState?.metalType || formContext?.metalType || "",
      selectedStones: (formState?.selectedStones || formContext?.selectedStones || []).filter((stone: any) => stone),
      notes: formState?.notes || formContext?.formValues?.notes || ""
    };
    
    console.log("AI Consultation - Form data extracted:", currentFormData);
    console.log("AI Design Consultation - Starting with form data:", currentFormData);
    
    // Use the shared function to generate welcome message
    generateWelcomeMessage(currentFormData);
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
      // Use the formState prop directly if available (new approach)
      // Otherwise fall back to the context (for backward compatibility)
      console.log("AI Design Consultation - FormState prop:", formState);
      console.log("AI Design Consultation - Form Context:", formContext);
      
      // Prepare form data for context if it exists
      let formData: FormData = {
        metalType: "",
        gemstones: [],
        designDescription: ""
      };
      
      if (integratedWithForm) {
        if (formState) {
          console.log("AI Design Consultation - Using formState prop:", formState);
          
          // Extract data from the formState prop
          formData = {
            metalType: formState.metalType || "",
            gemstones: (formState.selectedStones || []) as string[],
            designDescription: formState.notes || ""
          };
        } else if (formContext) {
          console.log("AI Design Consultation - Using form context (fallback):", formContext);
          
          // Get current form values directly 
          const metalType = formContext.metalType;
          const selectedStones = formContext.selectedStones;
          const notes = formContext.formValues?.notes;
          
          // Always provide formData, even if empty
          // Cast selectedStones to string[] to match FormData interface
          formData = {
            metalType: metalType || "",
            gemstones: (selectedStones || []) as string[],
            designDescription: notes || ""
          };
        }
        
        console.log("AI Design Consultation - Form data prepared:", formData);
        
        // Make sure we have non-empty values to include
        if (!formData.metalType) {
          console.log("AI Design Consultation - No metal type in form context");
        } else {
          console.log("AI Design Consultation - Using metal type:", formData.metalType);
        }
        
        if (!formData.gemstones || formData.gemstones.length === 0) {
          console.log("AI Design Consultation - No gemstones in form context");
        } else {
          console.log("AI Design Consultation - Using gemstones:", formData.gemstones);
        }
        
        if (!formData.designDescription) {
          console.log("AI Design Consultation - No design description in form context");
        } else {
          console.log("AI Design Consultation - Using description:", formData.designDescription);
        }
      }
      
      // Log the prepared form data
      console.log("AI Design Consultation - Prepared Form Data:", formData);
      
      // Send message to API with form context data if available
      // Build the request body with the correct parameter names
      const requestBody = {
        message: userMessage.content,
        history: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        // Always include formData with defined values
        formData: {
          metalType: formData.metalType,
          gemstones: formData.gemstones,
          designDescription: formData.designDescription
        }
      };
      
      console.log("AI Design Consultation - Sending request to API:", requestBody);
      
      const response = await apiRequest("POST", "/api/design-consultation-ai", requestBody);
      
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
  
  // This function is now triggered through the custom event system
  // No need for a FormButton component anymore

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
        <StartConsultationButton onStart={handleStartConsultation} />
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
      {/* Render the main consultation interface only */}
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