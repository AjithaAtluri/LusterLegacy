import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ArrowLeft, Send, LogIn, Calculator, DollarSign, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculatePrice } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import ReliableProductImage from "@/components/ui/reliable-product-image";
import { ProductSpecifications } from "@/components/products/product-specifications";
import { usePriceCalculator } from "@/hooks/use-price-calculator";

export default function CustomizeRequest() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [personalizationDetails, setPersonalizationDetails] = useState("");
  const [preferredBudget, setPreferredBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [metalTypeId, setMetalTypeId] = useState("");
  const [primaryStoneId, setPrimaryStoneId] = useState("");
  const [secondaryStoneId, setSecondaryStoneId] = useState("");
  const [otherStoneId, setOtherStoneId] = useState("");
  
  // Price estimation state
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  // Always use USD for consistency
  const currency = "USD";
  
  // State for related stones based on the product's original stones
  const [suggestedStones, setSuggestedStones] = useState<any[]>([]);
  
  // State to track which stone types exist in the original product
  const [hasSecondaryStone, setHasSecondaryStone] = useState<boolean>(false);
  const [hasOtherStone, setHasOtherStone] = useState<boolean>(false);
  
  // State to track successful submission
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<boolean>(false);
  
  // State to track requested metal and stone types for the success dialog
  const [requestedMetalType, setRequestedMetalType] = useState<string>("Unknown");
  const [requestedStoneType, setRequestedStoneType] = useState<string>("Unknown");
  
  // Fetch product data to display in the form
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });
  
  // Fetch metal types for dropdown
  const { data: metalTypes, isLoading: isLoadingMetalTypes } = useQuery({
    queryKey: ['/api/metal-types'],
  });
  
  // Get navigate function from wouter
  const [, navigate] = useLocation();
  
  // Redirect back to product page if product is in Beads & Gems category
  useEffect(() => {
    if (product) {
      // Check if product type or category is "Beads & Gems"
      const isBeadsAndGems = 
        (typeof product === 'object' && 'category' in product && product.category === "Beads & Gems") || 
        (typeof product === 'object' && 'productType' in product && product.productType === "Beads & Gems");
      
      if (isBeadsAndGems) {
        toast({
          title: "Personalization Unavailable",
          description: "Beads & Gems products cannot be personalized. Redirecting to product page.",
          variant: "destructive"
        });
        navigate(`/products/${id}`);
      }
    }
  }, [product, id, navigate]);
  
  // Fetch stone types for dropdown
  const { data: stoneTypes, isLoading: isLoadingStoneTypes } = useQuery({
    queryKey: ['/api/stone-types'],
  });

  // Handle form submission
  const personalizationMutation = useMutation({
    mutationFn: async (formData: {
      userId?: number;
      productId: number;
      fullName: string;
      email: string;
      phone: string;
      country: string;
      originalMetalType: string;
      requestedMetalType: string;
      originalStoneType: string;
      requestedStoneType: string;
      additionalNotes?: string;
      imageUrls?: string[];
    }) => {
      const response = await apiRequest("POST", "/api/personalization-requests", formData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit personalization request");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customization Request Sent!",
        description: "We've received your request and will contact you soon.",
        variant: "default",
      });
      
      // Show a dialog confirming successful submission
      setIsSubmitSuccessful(true);
      
      // Navigation will now be handled by the dialog button
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!name || !email || !phone || !personalizationDetails) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields (name, email, phone, and personalization details).",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      // Save form data to session storage first
      try {
        const formData = {
          productId: Number(id),
          name,
          email,
          phone,
          personalizationDetails,
          preferredBudget,
          timeline,
          metalTypeId,
          primaryStoneId,
          secondaryStoneId,
          otherStoneId,
          estimatedPrice
        };
        
        // Save the form data to session storage
        sessionStorage.setItem('personalizationFormData', JSON.stringify(formData));
        console.log("Personalization form data saved to session storage");
        
        // Toast notification to inform user
        toast({
          title: "Login required",
          description: "Your personalization details have been saved. Please log in or create an account to continue.",
        });
        
        // Redirect to auth page with detailed return URL
        const returnUrl = `/customize-request/${id}`;
        window.location.href = `/auth?returnTo=${encodeURIComponent(returnUrl)}`;
        return;
      } catch (error) {
        console.error('Error saving personalization form data to session storage', error);
      }
      return;
    }
    
    // If user is logged in, submit the form according to the schema required fields
    // First, determine the original and requested metal and stone types
    let originalMetalType = "Unknown";
    let requestedMetalType = "Unknown";
    let originalStoneType = "Unknown";
    let requestedStoneType = "Unknown";
    
    // Set original metal type from product data if available
    try {
      const details = product?.details ? 
        (typeof product.details === 'string' ? JSON.parse(product.details) : product.details) : {};
      
      const additionalData = details.additionalData || {};
      const specifications = additionalData.specifications || {};
      
      originalMetalType = specifications.metalType || "Unknown";
      originalStoneType = (specifications.mainStoneType || specifications.stoneType || "Unknown");
      
      // Get the requested metal type based on selected ID
      if (metalTypeId && metalTypes) {
        const selectedMetal = metalTypes.find((metal) => String(metal.id) === metalTypeId);
        if (selectedMetal) {
          requestedMetalType = selectedMetal.name;
          // Set it to component state for the success dialog
          setRequestedMetalType(selectedMetal.name);
        } else {
          requestedMetalType = originalMetalType; // Default to original if not found
          setRequestedMetalType(originalMetalType);
        }
      } else {
        requestedMetalType = originalMetalType; // Default to original if not selected
        setRequestedMetalType(originalMetalType);
      }
      
      // Get the requested stone type based on selected ID
      if (primaryStoneId && primaryStoneId !== "none_selected" && stoneTypes) {
        const selectedStone = stoneTypes.find((stone) => String(stone.id) === primaryStoneId);
        if (selectedStone) {
          requestedStoneType = selectedStone.name;
          // Set it to component state for the success dialog
          setRequestedStoneType(selectedStone.name);
        } else {
          requestedStoneType = originalStoneType; // Default to original if not found
          setRequestedStoneType(originalStoneType);
        }
      } else {
        requestedStoneType = originalStoneType; // Default to original if not selected
        setRequestedStoneType(originalStoneType);
      }
    } catch (error) {
      console.error("Error preparing personalization data:", error);
    }
    
    personalizationMutation.mutate({
      userId: user?.id,
      productId: Number(id),
      fullName: name, // Schema expects fullName, not name
      email,
      phone,
      country: "Unknown", // Required by schema, can add this field to form later
      originalMetalType,
      requestedMetalType,
      originalStoneType,
      requestedStoneType,
      additionalNotes: personalizationDetails, // Schema expects additionalNotes
      imageUrls: [] // Required by schema
    });
  };

  // Restore form data from session storage or pre-fill with user data
  useEffect(() => {
    // First, check for saved form data in session storage
    const savedFormData = sessionStorage.getItem('personalizationFormData');
    
    if (savedFormData && user) {
      try {
        console.log("Found saved personalization form data in session storage");
        const parsedData = JSON.parse(savedFormData);
        
        // Only restore data if the product ID matches
        if (parsedData.productId && parsedData.productId === Number(id)) {
          setName(parsedData.name || user.username);
          setEmail(parsedData.email || user.email || "");
          setPhone(parsedData.phone || "");
          setCustomizationDetails(parsedData.customizationDetails || "");
          setPreferredBudget(parsedData.preferredBudget || "");
          setTimeline(parsedData.timeline || "");
          setMetalTypeId(parsedData.metalTypeId || "");
          setPrimaryStoneId(parsedData.primaryStoneId || "");
          setSecondaryStoneId(parsedData.secondaryStoneId || "");
          setOtherStoneId(parsedData.otherStoneId || "");
          setEstimatedPrice(parsedData.estimatedPrice || 0);
          
          // Show success message
          toast({
            title: "Form restored",
            description: "Your customization details have been restored.",
          });
          
          // Clear the saved data to prevent reloading it on subsequent visits
          sessionStorage.removeItem('customizationFormData');
          
          // Skip the rest of the function to avoid overwriting with default values
          return;
        }
      } catch (error) {
        console.error("Error restoring customization form data:", error);
      }
    }
    
    // If no saved data or error occurred, fill with user data
    if (user) {
      setName(user.name || user.loginID);
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
    
    // Fill product specifications if product is loaded
    if (product && metalTypes && stoneTypes) {
      try {
        // Define exchange rate constant for INR to USD conversion
        const EXCHANGE_RATE = 83.8488;

        // Parse product details
        const details = product.details ? (typeof product.details === 'string' 
          ? JSON.parse(product.details) 
          : product.details) : {};
          
        const additionalData = details.additionalData || {};
        const aiInputs = additionalData.aiInputs || {};
        
        // Get original metal and stone types from the product
        const originalMetalType = aiInputs.metalType || additionalData.metalType || "";
        const originalMainStoneType = aiInputs.mainStoneType || additionalData.mainStoneType || "";
        const originalSecondaryStoneType = aiInputs.secondaryStoneType || additionalData.secondaryStoneType || "";
        const originalOtherStoneType = aiInputs.otherStoneType || additionalData.otherStoneType || "";
        
        // Determine if the product has secondary and other stones
        const hasSecondaryStoneValue = !!(originalSecondaryStoneType && 
          originalSecondaryStoneType.toLowerCase() !== "none" && 
          originalSecondaryStoneType.trim() !== "");
        
        const hasOtherStoneValue = !!(originalOtherStoneType && 
          originalOtherStoneType.toLowerCase() !== "none" && 
          originalOtherStoneType.trim() !== "");
          
        // Update state variables to control display of stone fields
        setHasSecondaryStone(hasSecondaryStoneValue);
        setHasOtherStone(hasOtherStoneValue);
        
        console.log("Pre-filling form with product specifications:");
        console.log("Original metal type:", originalMetalType);
        console.log("Original main stone type:", originalMainStoneType);
        console.log("Original secondary stone type:", originalSecondaryStoneType, "- Will display:", hasSecondaryStoneValue);
        console.log("Original other stone type:", originalOtherStoneType, "- Will display:", hasOtherStoneValue);
        
        // Find matching metal type ID
        if (originalMetalType) {
          const matchingMetal = metalTypes.find((metal: any) => 
            metal.name.toLowerCase() === originalMetalType.toLowerCase());
          
          if (matchingMetal) {
            console.log("Found matching metal type:", matchingMetal.name, "with ID:", matchingMetal.id);
            setMetalTypeId(String(matchingMetal.id));
          }
        }
        
        // Find matching primary stone type ID
        if (originalMainStoneType) {
          const matchingPrimaryStone = stoneTypes.find((stone: any) => 
            stone.name.toLowerCase() === originalMainStoneType.toLowerCase());
          
          if (matchingPrimaryStone) {
            console.log("Found matching primary stone:", matchingPrimaryStone.name, "with ID:", matchingPrimaryStone.id);
            setPrimaryStoneId(String(matchingPrimaryStone.id));
          }
        }
        
        // Find matching secondary stone type ID
        if (originalSecondaryStoneType && originalSecondaryStoneType.toLowerCase() !== "none") {
          const matchingSecondaryStone = stoneTypes.find((stone: any) => 
            stone.name.toLowerCase() === originalSecondaryStoneType.toLowerCase());
          
          if (matchingSecondaryStone) {
            console.log("Found matching secondary stone:", matchingSecondaryStone.name, "with ID:", matchingSecondaryStone.id);
            setSecondaryStoneId(String(matchingSecondaryStone.id));
          }
        }
        
        // Find matching other stone type ID
        if (originalOtherStoneType && originalOtherStoneType.toLowerCase() !== "none") {
          const matchingOtherStone = stoneTypes.find((stone: any) => 
            stone.name.toLowerCase() === originalOtherStoneType.toLowerCase());
          
          if (matchingOtherStone) {
            console.log("Found matching other stone:", matchingOtherStone.name, "with ID:", matchingOtherStone.id);
            setOtherStoneId(String(matchingOtherStone.id));
          }
        }
      } catch (error) {
        console.error("Error pre-filling form with product specifications:", error);
      }
    }
  }, [user, product, metalTypes, stoneTypes]);
  
  // Update estimated price based on selected personalization options
  useEffect(() => {
    if (product) {
      try {
        // Define exchange rate constant for INR to USD conversion
        const EXCHANGE_RATE = 83.8488;
        
        // Parse product details to get stone weights
        const details = product.details ? (typeof product.details === 'string' 
          ? JSON.parse(product.details) 
          : product.details) : {};
          
        const additionalData = details.additionalData || {};
        const aiInputs = additionalData.aiInputs || {};
        
        // Get stone weights from the product (these don't change in personalization)
        const mainStoneWeight = aiInputs.mainStoneWeight || additionalData.mainStoneWeight || 0;
        const secondaryStoneWeight = aiInputs.secondaryStoneWeight || additionalData.secondaryStoneWeight || 0;
        const otherStoneWeight = aiInputs.otherStoneWeight || additionalData.otherStoneWeight || 0;
        
        // Get metal weight (this doesn't change in personalization)
        const metalWeight = aiInputs.metalWeight || additionalData.metalWeight || 0;
        
        // Get original metal and stone types from the product
        const originalMetalType = aiInputs.metalType || additionalData.metalType || "";
        const originalMainStoneType = aiInputs.mainStoneType || additionalData.mainStoneType || "";
        const originalSecondaryStoneType = aiInputs.secondaryStoneType || additionalData.secondaryStoneType || "";
        const originalOtherStoneType = aiInputs.otherStoneType || additionalData.otherStoneType || "";
        
        console.log("Product metal weight:", metalWeight, "grams");
        console.log("Product main stone weight:", mainStoneWeight, "carats");
        console.log("Product secondary stone weight:", secondaryStoneWeight, "carats");
        console.log("Original metal type:", originalMetalType);
        console.log("Original main stone type:", originalMainStoneType);
        
        // Start with the product's calculated price if available, or fall back to base price
        let priceEstimate = product.calculatedPriceUSD || product.basePrice;
        console.log("Starting price estimate:", priceEstimate);
        
        // 1. For metals: Calculate the difference between original and selected metal
        if (metalTypeId && metalTypes) {
          const selectedMetal = metalTypes.find((metal: any) => String(metal.id) === metalTypeId);
          console.log("Selected metal:", selectedMetal?.name);
          
          // Find the original metal's price modifier in our list of metals
          const originalMetalObj = metalTypes.find((metal: any) => 
            metal.name.toLowerCase() === originalMetalType.toLowerCase());
          console.log("Original metal from DB:", originalMetalObj?.name, "with modifier:", originalMetalObj?.priceModifier);
          
          if (selectedMetal && originalMetalObj && selectedMetal.id !== originalMetalObj.id) {
            // Remove the original metal's price contribution and add the new one
            const originalMetalMultiplier = 1 + (originalMetalObj.priceModifier / 100);
            const newMetalMultiplier = 1 + (selectedMetal.priceModifier / 100);
            
            // Adjust the price: first remove original metal effect, then apply new metal effect
            const priceWithoutMetal = priceEstimate / originalMetalMultiplier;
            priceEstimate = priceWithoutMetal * newMetalMultiplier;
            
            console.log(`Adjusting price for metal change: ${originalMetalObj.name} -> ${selectedMetal.name}`);
            console.log(`Metal price adjustment: original multiplier ${originalMetalMultiplier}, new multiplier ${newMetalMultiplier}`);
            console.log(`Price after metal adjustment: ${priceEstimate}`);
          }
        }
        
        // 2. For stones: Calculate the price based on weight × stone price per carat
        // Find in the database what stone types and prices were used in the original calculation
        console.log("All available stone types in database:", stoneTypes?.map(s => {
          // Convert price from INR to USD for display (stone prices are stored in INR in database)
          const usdPrice = (s.priceModifier / EXCHANGE_RATE).toFixed(2);
          return `${s.name} - $${usdPrice}/carat`;
        }));
        
        const originalPrimaryStoneObj = stoneTypes?.find((stone: any) => 
          stone.name.toLowerCase() === originalMainStoneType.toLowerCase());
        
        console.log(`Looking for original stone type "${originalMainStoneType}" in database...`);
        console.log("Original primary stone object from DB:", originalPrimaryStoneObj);
        
        // Calculate a rough estimate of how much the original stones contributed to the price
        let originalStoneContribution = 0;
        if (originalPrimaryStoneObj && mainStoneWeight > 0) {
          // Assuming priceModifier is stored as price per carat in this case
          const pricePerCaratInr = originalPrimaryStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          originalStoneContribution += mainStoneWeight * pricePerCaratUsd;
          console.log(`Original primary stone (${originalMainStoneType}) contribution: ${mainStoneWeight} carats × $${pricePerCaratUsd.toFixed(2)}/carat = $${(mainStoneWeight * pricePerCaratUsd).toFixed(2)}`);
        } else {
          console.log(`Warning: Could not find original primary stone "${originalMainStoneType}" in database`);
        }
        
        const originalSecondaryStoneObj = stoneTypes?.find((stone: any) => 
          stone.name.toLowerCase() === originalSecondaryStoneType.toLowerCase());
        
        if (originalSecondaryStoneObj && secondaryStoneWeight > 0) {
          const pricePerCaratInr = originalSecondaryStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          originalStoneContribution += secondaryStoneWeight * pricePerCaratUsd;
          console.log(`Original secondary stone (${originalSecondaryStoneType}) contribution: ${secondaryStoneWeight} carats × $${pricePerCaratUsd.toFixed(2)}/carat = $${(secondaryStoneWeight * pricePerCaratUsd).toFixed(2)}`);
        } else if (secondaryStoneWeight > 0) {
          console.log(`Warning: Could not find original secondary stone "${originalSecondaryStoneType}" in database`);
        }
        
        // Check for original other stone contribution
        const originalOtherStoneObj = stoneTypes?.find((stone: any) => 
          stone.name.toLowerCase() === originalOtherStoneType.toLowerCase());
        
        if (originalOtherStoneObj && otherStoneWeight > 0) {
          const pricePerCaratInr = originalOtherStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          originalStoneContribution += otherStoneWeight * pricePerCaratUsd;
          console.log(`Original other stone (${originalOtherStoneType}) contribution: ${otherStoneWeight} carats × $${pricePerCaratUsd.toFixed(2)}/carat = $${(otherStoneWeight * pricePerCaratUsd).toFixed(2)}`);
        } else if (otherStoneWeight > 0) {
          console.log(`Warning: Could not find original other stone "${originalOtherStoneType}" in database`);
        }
        
        // Now if the user selected different stones, calculate their contribution
        let newStoneContribution = 0;
        
        console.log(`Selected primary stone ID: ${primaryStoneId}`);
        
        if (primaryStoneId && primaryStoneId !== "none_selected" && stoneTypes && mainStoneWeight > 0) {
          const selectedStone = stoneTypes.find((stone: any) => String(stone.id) === primaryStoneId);
          console.log("Selected primary stone object from DB:", selectedStone);
          
          if (selectedStone) {
            // Use the selected stone's price per carat
            const pricePerCaratInr = selectedStone.priceModifier || 0;
            const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
            newStoneContribution += mainStoneWeight * pricePerCaratUsd;
            console.log(`New primary stone (${selectedStone.name}) contribution: ${mainStoneWeight} carats × $${pricePerCaratUsd.toFixed(2)}/carat = $${(mainStoneWeight * pricePerCaratUsd).toFixed(2)}`);
          } else {
            console.log(`Warning: Could not find selected primary stone with ID ${primaryStoneId} in database`);
          }
        } else if (originalPrimaryStoneObj && mainStoneWeight > 0) {
          // If no new stone selected, use the original
          newStoneContribution += mainStoneWeight * (originalPrimaryStoneObj.priceModifier || 0);
          console.log(`Using original primary stone (no new selection): ${mainStoneWeight} carats × $${originalPrimaryStoneObj.priceModifier}/carat = $${mainStoneWeight * originalPrimaryStoneObj.priceModifier}`);
        }
        
        if (secondaryStoneId && secondaryStoneId !== "none_selected" && stoneTypes && secondaryStoneWeight > 0) {
          const selectedSecondaryStone = stoneTypes.find((stone: any) => String(stone.id) === secondaryStoneId);
          if (selectedSecondaryStone) {
            // Use the selected stone's price per carat
            const pricePerCaratInr = selectedSecondaryStone.priceModifier || 0;
            const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
            newStoneContribution += secondaryStoneWeight * pricePerCaratUsd;
            console.log(`New secondary stone (${selectedSecondaryStone.name}) contribution: ${secondaryStoneWeight} carats × $${pricePerCaratUsd.toFixed(2)}/carat = $${(secondaryStoneWeight * pricePerCaratUsd).toFixed(2)}`);
          }
        } else if (originalSecondaryStoneObj && secondaryStoneWeight > 0) {
          // If no new stone selected, use the original
          newStoneContribution += secondaryStoneWeight * (originalSecondaryStoneObj.priceModifier || 0);
        }
        
        // Handle the other stone contribution
        if (otherStoneId && otherStoneId !== "none_selected" && stoneTypes && otherStoneWeight > 0) {
          const selectedOtherStone = stoneTypes.find((stone: any) => String(stone.id) === otherStoneId);
          if (selectedOtherStone) {
            // Use the selected stone's price per carat
            const pricePerCaratInr = selectedOtherStone.priceModifier || 0;
            const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
            newStoneContribution += otherStoneWeight * pricePerCaratUsd;
            console.log(`New other stone (${selectedOtherStone.name}) contribution: ${otherStoneWeight} carats × $${pricePerCaratUsd.toFixed(2)}/carat = $${(otherStoneWeight * pricePerCaratUsd).toFixed(2)}`);
          }
        } else if (originalOtherStoneObj && otherStoneWeight > 0) {
          // If no new stone selected, use the original
          newStoneContribution += otherStoneWeight * (originalOtherStoneObj.priceModifier || 0);
          console.log(`Using original other stone (no new selection): ${otherStoneWeight} carats × $${originalOtherStoneObj.priceModifier}/carat = $${otherStoneWeight * originalOtherStoneObj.priceModifier}`);
        }
        
        // Adjust the price by removing the original stone contribution and adding the new one
        if (originalStoneContribution > 0 || newStoneContribution > 0) {
          // Remove the estimated original stone contribution from price (if we could calculate it)
          if (originalStoneContribution > 0) {
            priceEstimate = priceEstimate - originalStoneContribution;
          }
          
          // Add the new stone contribution
          priceEstimate = priceEstimate + newStoneContribution;
          
          console.log(`Price adjustment for stone change: Original $${originalStoneContribution} -> New $${newStoneContribution}`);
          console.log(`Price after stone adjustment: ${priceEstimate}`);
        }
        
        // Always use USD as the currency
        // No currency conversion needed
        
        // Round to nearest whole number
        const finalPrice = Math.round(priceEstimate);
        console.log("Final estimated price:", finalPrice);
        setEstimatedPrice(finalPrice);
      } catch (error) {
        console.error("Error calculating price:", error);
        // If there's an error, just use the original price
        setEstimatedPrice(Math.round(product.calculatedPriceUSD || product.basePrice));
      }
    }
  }, [product, metalTypeId, primaryStoneId, secondaryStoneId, otherStoneId, metalTypes, stoneTypes, currency]);
  
  // Extract stone types from product details to create customization suggestions
  useEffect(() => {
    if (product && product.details && stoneTypes) {
      try {
        // Parse product details to extract stone information
        const parsedDetails = typeof product.details === 'string' 
          ? JSON.parse(product.details) 
          : product.details;
        
        // Extract stone information from product details
        let productStoneTypes = [];
        
        if (parsedDetails.additionalData) {
          // Get primary stone from the product
          const mainStoneType = parsedDetails.additionalData.mainStoneType || "";
          
          // Add all similar stone types to suggested stones
          if (mainStoneType && stoneTypes) {
            // Find similar stones based on keywords in stone names
            const keywords = mainStoneType.toLowerCase().split(/[,\s()]+/).filter(k => k.length > 3);
            console.log("Main stone keywords for customization options:", keywords);
            
            // Filter stone types that have similar keywords
            const similarStones = stoneTypes.filter(stone => {
              const stoneName = stone.name.toLowerCase();
              return keywords.some(keyword => stoneName.includes(keyword));
            });
            
            console.log("Similar stones for customization:", similarStones);
            setSuggestedStones(similarStones);
          }
        }
      } catch (error) {
        console.error("Error extracting stone types from product:", error);
      }
    }
  }, [product, stoneTypes]);

  const handleBack = () => {
    setLocation(`/product-detail/${id}`);
  };

  // Redirect to login if not authenticated
  const handleLoginRedirect = () => {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', `/customize-request/${id}`);
    setLocation('/auth');
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="font-playfair text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-6">You need to be logged in to request customization for our products.</p>
        <p className="mb-6 text-sm text-foreground/70">
          Creating an account allows you to track your customization requests in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={handleLoginRedirect} className="bg-primary">
            <LogIn className="mr-2 h-4 w-4" />
            Login or Create Account
          </Button>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-6">We couldn't find the product you're looking for.</p>
        <Button onClick={() => setLocation("/collections")}>
          Back to Collections
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Personalize {product.name} | Luster Legacy</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>
          <h1 className="font-playfair text-3xl font-bold mb-2">Request Personalization</h1>
          <p className="text-foreground/70 mb-6">
            Fill out the form below to request personalization for {product.name}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Product Summary Card */}
          <Card className="md:col-span-1 h-fit">
            <CardContent className="p-6">
              <h2 className="font-playfair text-xl font-semibold mb-4">Product Summary</h2>
              <div className="mb-4 rounded-md overflow-hidden">
                <ReliableProductImage
                  productId={product.id}
                  alt={product.name}
                  className="w-full h-auto object-cover"
                />
              </div>
              <h3 className="font-playfair text-lg font-semibold">{product.name}</h3>
              <p className="text-foreground/70 text-sm my-2">{product.description}</p>
              
              {/* Product Specifications Component */}
              {product.details && (
                <>
                  {(() => {
                    try {
                      const details = JSON.parse(product.details);
                      const additionalData = details.additionalData || {};
                      const aiInputs = additionalData.aiInputs || {};
                      
                      const metalType = aiInputs.metalType || additionalData.metalType || "";
                      const metalWeight = aiInputs.metalWeight || additionalData.metalWeight || 0;
                      const mainStoneType = aiInputs.mainStoneType || additionalData.mainStoneType || "";
                      const mainStoneWeight = aiInputs.mainStoneWeight || additionalData.mainStoneWeight || 0;
                      const secondaryStoneType = aiInputs.secondaryStoneType || additionalData.secondaryStoneType || "";
                      const secondaryStoneWeight = aiInputs.secondaryStoneWeight || additionalData.secondaryStoneWeight || 0;
                      const otherStoneType = aiInputs.otherStoneType || additionalData.otherStoneType || "";
                      const otherStoneWeight = aiInputs.otherStoneWeight || additionalData.otherStoneWeight || 0;
                      
                      return (
                        <ProductSpecifications
                          productMetalType={metalType}
                          productMetalWeight={metalWeight}
                          mainStoneType={mainStoneType}
                          mainStoneWeight={mainStoneWeight}
                          secondaryStoneType={secondaryStoneType}
                          secondaryStoneWeight={secondaryStoneWeight}
                          otherStoneType={otherStoneType}
                          otherStoneWeight={otherStoneWeight}
                          // Use calculated price if available, fall back to base price
                          currentPrice={product.calculatedPriceUSD || product.basePrice}
                          formatCurrency={formatCurrency}
                          className="mt-4"
                        />
                      );
                    } catch (e) {
                      console.error("Error parsing product details:", e);
                      return null;
                    }
                  })()}
                </>
              )}
              
              <p className="mt-4 text-sm text-foreground/60">
                * Final price may vary based on personalization requests
              </p>
            </CardContent>
          </Card>
          
          {/* Personalization Request Form */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit}>
                  {user && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-md border border-border">
                      <p className="text-sm text-muted-foreground">
                        Your contact information will be automatically used from your account.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {!user ? (
                      // Show full contact form for non-logged in users
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name*</Label>
                          <Input
                            id="name"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address*</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number*</Label>
                          <Input
                            id="phone"
                            placeholder="Your contact number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </>
                    ) : (
                      // Hidden inputs for logged-in users to maintain the form functionality
                      <div className="col-span-2">
                        <Input id="name" type="hidden" value={name} />
                        <Input id="email" type="hidden" value={email} />
                        <Input id="phone" type="hidden" value={phone || user.phone || ""} />
                      </div>
                    )}
                  
                    <div className="space-y-2">
                      <Label htmlFor="budget">Preferred Budget (Optional)</Label>
                      <Input
                        id="budget"
                        placeholder="Your budget range"
                        value={preferredBudget}
                        onChange={(e) => setPreferredBudget(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Preferred Timeline (Optional)</Label>
                      <Input
                        id="timeline"
                        placeholder="When do you need this by?"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metalType">Preferred Metal Type</Label>
                      <Select value={metalTypeId} onValueChange={setMetalTypeId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select metal type" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingMetalTypes ? (
                            <div className="flex items-center justify-center p-2">Loading...</div>
                          ) : !metalTypes || metalTypes.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground">No metal types available</div>
                          ) : (
                            metalTypes.map((metal) => (
                              <SelectItem key={metal.id} value={String(metal.id)}>
                                {metal.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Primary Stone field based on the product's original stones */}
                    <div className="space-y-2">
                      <Label htmlFor="primaryStone">Preferred Primary Stone Type</Label>
                      <Select value={primaryStoneId} onValueChange={setPrimaryStoneId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select primary stone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none_selected">None</SelectItem>
                          
                          {/* If we have suggested stones based on the product */}
                          {suggestedStones && suggestedStones.length > 0 && (
                            <>
                              <div className="p-2 text-center text-xs font-medium text-accent">
                                Recommended for this product:
                              </div>
                              {suggestedStones.map((stone) => (
                                <SelectItem 
                                  key={`suggested-${stone.id}`} 
                                  value={String(stone.id)}
                                  className="font-medium"
                                >
                                  {stone.name} ★
                                </SelectItem>
                              ))}
                              <div className="py-1"><hr className="border-border" /></div>
                            </>
                          )}
                          
                          {/* All stone types */}
                          {isLoadingStoneTypes ? (
                            <div className="flex items-center justify-center p-2">Loading...</div>
                          ) : !stoneTypes || stoneTypes.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground">No stone types available</div>
                          ) : (
                            stoneTypes.map((stone) => (
                              <SelectItem key={`primary-${stone.id}`} value={String(stone.id)}>
                                {stone.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Only show Secondary Stone field if the product actually has one */}
                    {hasSecondaryStone && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="secondaryStone">Preferred Secondary Stone Type</Label>
                        <Select value={secondaryStoneId} onValueChange={setSecondaryStoneId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select secondary stone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_selected">None</SelectItem>
                            {isLoadingStoneTypes ? (
                              <div className="flex items-center justify-center p-2">Loading...</div>
                            ) : !stoneTypes || stoneTypes.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground">No stone types available</div>
                            ) : (
                              stoneTypes.map((stone) => (
                                <SelectItem key={`secondary-${stone.id}`} value={String(stone.id)}>
                                  {stone.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Only show Other Stone field if the product actually has one */}
                    {hasOtherStone && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="otherStone">Preferred Other Stone Type</Label>
                        <Select value={otherStoneId} onValueChange={setOtherStoneId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select other stone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_selected">None</SelectItem>
                            {isLoadingStoneTypes ? (
                              <div className="flex items-center justify-center p-2">Loading...</div>
                            ) : !stoneTypes || stoneTypes.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground">No stone types available</div>
                            ) : (
                              stoneTypes.map((stone) => (
                                <SelectItem key={`other-${stone.id}`} value={String(stone.id)}>
                                  {stone.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="personalizationDetails">Personalization Details*</Label>
                      <Textarea
                        id="personalizationDetails"
                        placeholder="Describe your personalization requirements in detail..."
                        className="min-h-[150px]"
                        value={personalizationDetails}
                        onChange={(e) => setPersonalizationDetails(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Estimated Price Card */}
                  {estimatedPrice > 0 && (
                    <div className="mt-6 mb-6 p-4 border border-border rounded-lg bg-accent/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Calculator className="h-5 w-5 mr-2 text-accent" />
                          <h3 className="text-lg font-semibold">Projected Estimated Price</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Currency:</span>
                          <div className="text-sm font-medium">USD</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded-md bg-background">
                        <div>
                          <p className="text-sm text-muted-foreground">Based on your customization choices</p>
                          <p className="text-xs text-muted-foreground mt-1">This is an estimate only. Final price may vary.</p>
                        </div>
                        <div className="text-xl font-bold text-accent">
                          {formatCurrency(estimatedPrice, currency)}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Price includes material costs and craftsmanship</li>
                          <li>You'll receive an exact quote after review by our design team</li>
                          <li>Gold price will be locked on the day of 50% advance payment</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90"
                      disabled={personalizationMutation.isPending}
                    >
                      {personalizationMutation.isPending ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Success Dialog */}
      <Dialog open={isSubmitSuccessful} onOpenChange={setIsSubmitSuccessful}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Request Submitted Successfully
            </DialogTitle>
            <DialogDescription>
              Your customization request has been submitted. Our designers will review your request and get back to you soon.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-secondary/20 rounded-lg">
            <p className="text-sm">Request details:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><span className="font-medium">Product:</span> {product?.name}</li>
              <li><span className="font-medium">Metal Type:</span> {requestedMetalType}</li>
              {requestedStoneType !== "Unknown" && (
                <li><span className="font-medium">Primary Stone:</span> {requestedStoneType}</li>
              )}
            </ul>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setLocation('/customer-dashboard')} 
              className="w-full bg-primary hover:bg-primary/90"
            >
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}