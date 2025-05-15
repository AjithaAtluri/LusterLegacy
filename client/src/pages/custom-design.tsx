import { Helmet } from "react-helmet";
import DesignForm, { DesignFormContext } from "@/components/custom-design/design-form";
import AIDesignConsultation from "@/components/custom-design/ai-design-consultation";
import { CheckCircle, Clock, HelpCircle, FileImage, ArrowRight, PenLine, Sparkles } from "lucide-react";
import { PAYMENT_TERMS } from "@/lib/constants";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function CustomDesign() {
  const [location] = useLocation();
  
  // Parse URL parameters
  const params = new URLSearchParams(location.split('?')[1] || '');
  const inspirationImage = params.get('inspirationImage');
  const fromInspiration = params.get('fromInspiration') === 'true';
  
  // Create shared state that will be passed to both components
  const [formState, setFormState] = useState({
    metalType: "",
    selectedStones: [] as string[],
    notes: "",
    imageDataUrl: undefined as string | undefined
  });
  
  // Handle inspiration image - using both session storage and URL parameter approaches
  useEffect(() => {
    const loadFromSessionDataUrl = () => {
      try {
        // Try to get the ready-made data URL first (new approach)
        const dataUrl = sessionStorage.getItem('inspirationImageDataUrl');
        if (dataUrl) {
          console.log("Custom Design Page - Found pre-processed data URL in sessionStorage");
          
          // Directly set the data URL to the form state
          setFormState(prev => ({
            ...prev,
            imageDataUrl: dataUrl
          }));
          
          // Clear from session storage to prevent reuse
          sessionStorage.removeItem('inspirationImageDataUrl');
          console.log("Custom Design Page - Applied data URL from sessionStorage");
          return true;
        }
      } catch (err) {
        console.error("Custom Design Page - Error accessing data URL from sessionStorage:", err);
      }
      return false;
    };
    
    const loadFromSessionSrc = () => {
      try {
        // Try the old approach as fallback
        const sessionImageSrc = sessionStorage.getItem('inspirationImageSrc');
        if (sessionImageSrc) {
          console.log("Custom Design Page - Found image source in sessionStorage:", sessionImageSrc.substring(0, 50) + "...");
          processInspirationImage(sessionImageSrc);
          // Clear from session storage to prevent reuse
          sessionStorage.removeItem('inspirationImageSrc');
          return true;
        }
      } catch (err) {
        console.error("Custom Design Page - Error accessing image source from sessionStorage:", err);
      }
      return false;
    };
    
    // First, try to load the pre-processed data URL (most reliable method)
    if (fromInspiration) {
      console.log("Custom Design Page - Detected fromInspiration=true in URL");
      const loadedDataUrl = loadFromSessionDataUrl();
      
      // If data URL wasn't found, try the image source
      if (!loadedDataUrl) {
        console.log("Custom Design Page - No data URL found, trying image source");
        const loadedSrc = loadFromSessionSrc();
        
        if (!loadedSrc) {
          console.warn("Custom Design Page - No inspiration image found in any sessionStorage key");
        }
      }
    }
    
    // Also check for direct image URL in parameters as ultimate fallback
    if (inspirationImage) {
      console.log("Custom Design Page - Using URL parameter for inspiration image");
      processInspirationImage(inspirationImage);
    }
  }, [inspirationImage, fromInspiration]);
  
  // Helper function to process an inspiration image source into a data URL
  const processInspirationImage = (imageSrc: string) => {
    console.log("Custom Design Page - Processing inspiration image source:", imageSrc.substring(0, 50) + "...");
    
    // Create an Image object to load the image
    const img = new Image();
    
    // Set crossOrigin to anonymous to avoid CORS issues with some image sources
    img.crossOrigin = "anonymous";
    
    // Set up onload handler to convert to data URL once loaded
    img.onload = () => {
      console.log("Custom Design Page - Inspiration image loaded successfully, dimensions:", img.width, "x", img.height);
      
      try {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image to the canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // Convert to data URL
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            console.log("Custom Design Page - Converted to data URL:", dataUrl.substring(0, 50) + "...");
            
            // Update state with the data URL
            setFormState(prev => {
              console.log("Custom Design Page - Updating form state with image data URL");
              return {
                ...prev,
                imageDataUrl: dataUrl
              };
            });
          } catch (err) {
            console.error("Custom Design Page - Error converting to data URL:", err);
          }
        }
      } catch (err) {
        console.error("Custom Design Page - Error processing image in canvas:", err);
      }
    };
    
    // Set up error handler
    img.onerror = (err) => {
      console.error("Custom Design Page - Error loading inspiration image:", err);
      
      // Try without crossOrigin as a fallback
      console.log("Custom Design Page - Retrying without crossOrigin");
      const retryImg = new Image();
      retryImg.onload = () => {
        console.log("Custom Design Page - Retry successful, dimensions:", retryImg.width, "x", retryImg.height);
        
        try {
          const canvas = document.createElement('canvas');
          canvas.width = retryImg.width;
          canvas.height = retryImg.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(retryImg, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            setFormState(prev => ({
              ...prev,
              imageDataUrl: dataUrl
            }));
            console.log("Custom Design Page - Retry conversion successful");
          }
        } catch (retryErr) {
          console.error("Custom Design Page - Retry processing failed:", retryErr);
        }
      };
      retryImg.onerror = (retryErr) => {
        console.error("Custom Design Page - Final retry failed:", retryErr);
      };
      retryImg.src = imageSrc;
    };
    
    // Start loading the image
    console.log("Custom Design Page - Starting to load image");
    img.src = imageSrc;
  };
  
  // Function to update the shared state
  const updateFormState = (data: {
    metalType?: string;
    selectedStones?: string[];
    notes?: string;
    imageDataUrl?: string;
  }) => {
    setFormState(prev => {
      const updatedState = {
        ...prev,
        ...data
      };
      
      // Debug log the latest form state
      console.log("Custom Design Page - Updated form state:", updatedState);
      return updatedState;
    });
  };
  
  // Effect to log when inspiration image is passed
  useEffect(() => {
    if (inspirationImage) {
      console.log("Received inspiration image from gallery");
    }
  }, [inspirationImage]);
  
  return (
    <>
      <Helmet>
        <title>Custom Design | Luster Legacy</title>
        <meta name="description" content="Create your dream jewelry. Upload your design and our master artisans will bring your vision to life with exceptional craftsmanship." />
      </Helmet>
      
      {/* Hero section */}
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Custom Design</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            Transform your vision into exquisite reality. Our master artisans will craft your dream jewelry with unparalleled attention to detail.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Form first - displays prominently on both mobile and desktop */}
        <div className="mx-auto max-w-2xl mb-12">
          <div className="bg-card rounded-lg shadow-lg">
            <DesignForm 
              onFormChange={updateFormState} 
              formState={formState}
            />
          </div>
        </div>
        
        {/* AI Design Consultation - integrated with the form */}
        <div className="mx-auto max-w-2xl mb-16">
          <AIDesignConsultation 
            integratedWithForm={true}
            formState={formState}
          />
        </div>
        
        {/* FAQ Section - at the bottom */}
        <div className="bg-muted/30 p-8 rounded-lg max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-3">Have Questions?</h2>
              <p className="font-montserrat text-foreground/70 max-w-md">
                Visit our FAQ page for answers to common questions about our custom design process, 
                materials, timelines, pricing, and more.
              </p>
            </div>
            <a 
              href="/faq" 
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-background hover:bg-primary/90 font-medium transition-colors text-sm"
            >
              View FAQ <ArrowRight className="ml-1.5 h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
