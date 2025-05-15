import { Helmet } from "react-helmet";
import DesignForm from "@/components/custom-design/design-form";
import AIDesignConsultation from "@/components/custom-design/ai-design-consultation";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function CustomDesign() {
  // Create shared state that will be passed to both components
  const [formState, setFormState] = useState({
    metalType: "",
    selectedStones: [] as string[],
    notes: "",
    imageDataUrl: undefined as string | undefined
  });
  
  // Check for inspiration image in localStorage
  useEffect(() => {
    try {
      const storedImage = localStorage.getItem('INSPIRATION_IMAGE');
      
      if (storedImage) {
        console.log("Custom Design Page - Found image in localStorage");
        
        // Update form state with the image source
        setFormState(prev => ({
          ...prev,
          imageDataUrl: storedImage
        }));
        
        // Clear localStorage after retrieving the image
        localStorage.removeItem('INSPIRATION_IMAGE');
        console.log("Custom Design Page - Applied image from localStorage");
      }
    } catch (err) {
      console.error("Custom Design Page - Error retrieving from localStorage:", err);
    }
  }, []); // Empty dependency array means this runs once on mount
  
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
