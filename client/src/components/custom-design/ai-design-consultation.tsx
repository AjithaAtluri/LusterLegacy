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
  imageDataUrl?: string; // Base64 encoded image data
}

interface AIDesignConsultationProps {
  integratedWithForm?: boolean;
  formState?: {
    metalType: string;
    selectedStones: string[];
    notes: string;
    imageDataUrl?: string; // Base64 encoded image
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
  interface WindowWithCustomProps {
    startAIConsultation?: (state: any) => void;
  }
  
  // Create a global method to start the consultation and listen for events
  useEffect(() => {
    // Define a global method to start the consultation
    (window as unknown as WindowWithCustomProps).startAIConsultation = (capturedFormState: any) => {
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
      delete (window as unknown as WindowWithCustomProps).startAIConsultation;
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
    
    // Create the system message for welcome
    const systemMessage: Message = {
      role: "assistant",
      content: welcomeMessage,
      timestamp: new Date()
    };
    
    // Initialize with the welcome message
    const initialMessages = [systemMessage];
    
    // If there are design notes, automatically send them as the first user message
    if (data.notes && data.notes.trim()) {
      console.log("AI Design Consultation - Using notes as initial prompt:", data.notes);
      
      // Add the notes as a user message
      const notesMessage: Message = {
        role: "user",
        content: data.notes,
        timestamp: new Date()
      };
      
      // Add to initial messages
      initialMessages.push(notesMessage);
      
      // Since we already have a user message with design notes, immediately send it to the API
      sendMessageToAPI(notesMessage, initialMessages);
    } else {
      // Set the chat history with just the welcome message if no notes
      setChatHistory(initialMessages);
      console.log("AI Design Consultation - Initial message set:", systemMessage);
    }
  };
  
  // Helper function to send messages to API
  const sendMessageToAPI = async (userMessage: Message, history: Message[]) => {
    setIsLoading(true);
    
    try {
      // Prepare form data
      let formData: FormData = {
        metalType: formState?.metalType || formContext?.metalType || "",
        gemstones: (formState?.selectedStones || formContext?.selectedStones || []) as string[],
        designDescription: formState?.notes || formContext?.formValues?.notes || "",
        imageDataUrl: formState?.imageDataUrl || formContext?.imageDataUrl
      };
      
      // Build the request body
      const requestBody = {
        message: userMessage.content,
        history: history.filter(msg => msg.role !== userMessage.role).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        formData: {
          metalType: formData.metalType,
          gemstones: formData.gemstones,
          designDescription: formData.designDescription,
          imageDataUrl: formData.imageDataUrl
        }
      };
      
      console.log("AI Design Consultation - Sending initial request to API:", requestBody);
      
      const response = await apiRequest("POST", "/api/design-consultation-ai", requestBody);
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };
      
      // Set the complete chat history with welcome, user's notes, and AI response
      setChatHistory([...history, aiMessage]);
    } catch (error) {
      console.error("Error sending initial message:", error);
      
      // If error, just show the welcome and user messages without AI response
      setChatHistory(history);
      
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
    
    // Update chat history to include the new user message
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    
    // Clear input field
    setMessage("");
    
    // Keep focus on the textarea after sending a message
    setTimeout(() => {
      const chatInput = document.getElementById('chat-input');
      if (chatInput) {
        chatInput.focus();
      }
    }, 0);
    
    // Use the helper function to send the message to the API
    await sendMessageToAPI(userMessage, updatedHistory);
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
        <div className="h-[400px] overflow-y-auto mb-4 pr-2 space-y-6">
          {chatHistory.map((msg, index) => (
            <div 
              key={`${index}-${msg.timestamp.getTime()}`} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role !== "user" && (
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src="/logo-icon.png" alt="Design AI" />
                  <AvatarFallback>LL</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[80%] px-5 py-4 rounded-lg shadow-sm ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card border border-border"
              }`}>
                <div className="text-sm leading-relaxed">
                  {msg.role === "assistant" 
                    ? msg.content.split("\n\n").map((paragraph, idx) => (
                        <p key={idx} className="mb-3 last:mb-0">{paragraph}</p>
                      ))
                    : <p>{msg.content}</p>
                  }
                </div>
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
            autoComplete="off"
            id="chat-input"
            onFocus={(e) => e.target.focus()}
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