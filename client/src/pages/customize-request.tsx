import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProductSpecifications } from "@/components/products/product-specifications";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGoldPrice } from "@/hooks/use-gold-price";
import { Loader2 } from "lucide-react";
import ReliableProductImage from "@/components/ui/reliable-product-image";

export default function CustomizeRequest() {
  const [, navigate] = useLocation();
  const { productId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { goldPrice } = useGoldPrice();
  
  // Form state
  const [metalTypeId, setMetalTypeId] = useState<string>("");
  const [primaryStoneId, setPrimaryStoneId] = useState<string>("");
  const [secondaryStoneId, setSecondaryStoneId] = useState<string>("");
  const [otherStoneId, setOtherStoneId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>(user?.email || "");
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");
  
  // State for related stones based on the product's original stones
  const [suggestedStones, setSuggestedStones] = useState<any[]>([]);
  
  // Dialog state
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);

  // Get product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      console.log(`Fetching product data for ID ${productId}`);
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product details");
      }
      return response.json();
    },
  });

  // Get all metal types
  const { data: metalTypes, isLoading: isLoadingMetals } = useQuery({
    queryKey: ["/api/metal-types"],
    queryFn: async () => {
      const response = await fetch("/api/metal-types");
      if (!response.ok) {
        throw new Error("Failed to fetch metal types");
      }
      return response.json();
    },
  });

  // Get all stone types
  const { data: stoneTypes, isLoading: isLoadingStones } = useQuery({
    queryKey: ["/api/stone-types"],
    queryFn: async () => {
      const response = await fetch("/api/stone-types");
      if (!response.ok) {
        throw new Error("Failed to fetch stone types");
      }
      return response.json();
    },
  });

  // Mutation for submitting customization request
  const customizationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/customization-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Customization Request Submitted",
        description: "We'll contact you with a quote soon.",
      });
      // Redirect to dashboard or confirmation page
      navigate(user ? "/customer-dashboard" : "/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit customization request",
        variant: "destructive",
      });
    },
  });

  // Pre-fill form with product details when data is loaded
  useEffect(() => {
    if (product && metalTypes && stoneTypes) {
      console.log("Pre-filling form with product specifications:");
      // Get metal and stone types from the product
      const originalMetalType = product.metalType || "";
      const originalMainStoneType = product.mainStoneType || "";
      const originalSecondaryStoneType = product.secondaryStoneType || "";
      const originalOtherStoneType = product.otherStoneType || "";
      
      console.log("Original metal type:", originalMetalType);
      console.log("Original main stone type:", originalMainStoneType);
      console.log("Original secondary stone type:", originalSecondaryStoneType);
      console.log("Original other stone type:", originalOtherStoneType);

      // Find matching metal type in the database
      const metalTypeObj = metalTypes.find((metal: any) => 
        metal.name.toLowerCase() === originalMetalType.toLowerCase()
      );
      
      if (metalTypeObj) {
        console.log("Found matching metal type:", metalTypeObj.name, "with ID:", metalTypeObj.id);
        setMetalTypeId(String(metalTypeObj.id));
      }
      
      // Find matching primary stone in the database
      const primaryStoneObj = stoneTypes.find((stone: any) => 
        stone.name.toLowerCase() === originalMainStoneType.toLowerCase()
      );
      
      if (primaryStoneObj) {
        console.log("Found matching primary stone:", primaryStoneObj.name, "with ID:", primaryStoneObj.id);
        setPrimaryStoneId(String(primaryStoneObj.id));
      }
      
      // Find matching secondary stone in the database
      const secondaryStoneObj = stoneTypes.find((stone: any) => 
        stone.name.toLowerCase() === originalSecondaryStoneType.toLowerCase()
      );
      
      if (secondaryStoneObj) {
        console.log("Found matching secondary stone:", secondaryStoneObj.name, "with ID:", secondaryStoneObj.id);
        setSecondaryStoneId(String(secondaryStoneObj.id));
      }
      
      // Find matching other stone in the database
      const otherStoneObj = stoneTypes.find((stone: any) => 
        stone.name.toLowerCase() === originalOtherStoneType.toLowerCase()
      );
      
      if (otherStoneObj) {
        console.log("Found matching other stone:", otherStoneObj.name, "with ID:", otherStoneObj.id);
        setOtherStoneId(String(otherStoneObj.id));
      }
      
      // Set the default price to the product's calculated price
      const defaultPrice = product.calculatedPriceUSD || product.basePrice;
      console.log("Starting price estimate:", defaultPrice);
      setEstimatedPrice(defaultPrice);
      
      // Generate stone suggestions based on the primary stone
      if (primaryStoneObj) {
        // Extract keywords from the primary stone name
        const keywords = primaryStoneObj.name
          .toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3);
        
        console.log("Main stone keywords for customization options:", keywords);
        
        // Find similar stones based on keywords
        const similarStones = stoneTypes.filter((stone: any) => {
          // Don't include the exact same stone in suggestions
          if (stone.id === primaryStoneObj.id) return false;
          
          const stoneName = stone.name.toLowerCase();
          // Check if any keyword matches
          return keywords.some(keyword => stoneName.includes(keyword));
        });
        
        console.log("Similar stones for customization:", similarStones);
        setSuggestedStones(similarStones);
      }
      
      // Set email if user is logged in
      if (user?.email) {
        setEmailAddress(user.email);
      }
    }
  }, [product, metalTypes, stoneTypes, user]);

  // Calculate new price estimate based on changes
  useEffect(() => {
    console.log(`Price calculation triggered: Metal=${metalTypeId}, Primary=${primaryStoneId}, Secondary=${secondaryStoneId}, Other=${otherStoneId}`);
    
    if (product && metalTypes && stoneTypes) {
      try {
        // Define exchange rate constant for INR to USD conversion
        const EXCHANGE_RATE = 83.8488;
        
        // Extract stone weights from product
        const metalWeight = parseFloat(product.metalWeight) || 0;
        const mainStoneWeight = parseFloat(product.mainStoneWeight) || 0;
        const secondaryStoneWeight = parseFloat(product.secondaryStoneWeight) || 0;
        const otherStoneWeight = parseFloat(product.otherStoneWeight) || 0;
        
        console.log("Product metal weight:", metalWeight, "grams");
        console.log("Product main stone weight:", mainStoneWeight, "carats");
        console.log("Product secondary stone weight:", secondaryStoneWeight, "carats");
        
        // Get original metal type
        const originalMetalType = product.metalType || "";
        const originalMainStoneType = product.mainStoneType || "";
        const originalSecondaryStoneType = product.secondaryStoneType || "";
        const originalOtherStoneType = product.otherStoneType || "";
        
        console.log("Original metal type:", originalMetalType);
        console.log("Original main stone type:", originalMainStoneType);
        
        // Use the product's existing calculated price as the starting point
        const originalPrice = product.calculatedPriceUSD || product.basePrice;
        console.log("Starting price estimate:", originalPrice);
        
        // Process metal type change
        let metalPriceAdjustment = 0;
        
        if (metalTypeId && metalTypes) {
          const selectedMetal = metalTypes.find((metal: any) => String(metal.id) === metalTypeId);
          console.log("Selected metal:", selectedMetal?.name);
          
          // Find the original metal from the database
          const originalMetalObj = metalTypes.find((metal: any) => 
            metal.name.toLowerCase() === originalMetalType.toLowerCase()
          );
          
          if (originalMetalObj && selectedMetal && selectedMetal.id !== originalMetalObj.id) {
            console.log("Original metal from DB:", originalMetalObj.name, "with modifier:", originalMetalObj.priceModifier);
            
            // Calculate the price difference due to metal change
            console.log(`Adjusting price for metal change: ${originalMetalObj.name} -> ${selectedMetal.name}`);
            
            // Calculate multipliers - converting percentage to multiplier (e.g., 58% -> 1.58)
            const originalMultiplier = 1 + (originalMetalObj.priceModifier / 100);
            const newMultiplier = 1 + (selectedMetal.priceModifier / 100);
            
            console.log(`Metal price adjustment: original multiplier ${originalMultiplier}, new multiplier ${newMultiplier}`);
            
            // Estimate metal contribution to price (roughly 60% of total)
            const metalContribution = originalPrice * 0.6;
            
            // Calculate the adjustment
            metalPriceAdjustment = metalContribution * ((newMultiplier / originalMultiplier) - 1);
            
            console.log(`Price after metal adjustment: ${originalPrice + metalPriceAdjustment}`);
          }
        }
        
        // Calculate stone cost changes
        // First, calculate how much the original stones contributed
        console.log("All available stone types in database:", stoneTypes?.map(s => `${s.name} - ₹${s.priceModifier}/carat`));
        
        const originalPrimaryStoneObj = stoneTypes?.find((stone: any) => 
          stone.name.toLowerCase() === originalMainStoneType.toLowerCase());
        
        console.log(`Looking for original stone type "${originalMainStoneType}" in database...`);
        console.log("Original primary stone object from DB:", originalPrimaryStoneObj);
        
        // Calculate how much the original stones contributed to the price
        let originalStoneContribution = 0;
        if (originalPrimaryStoneObj && mainStoneWeight > 0) {
          // Stone prices are in INR, need to convert to USD
          const pricePerCaratInr = originalPrimaryStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          originalStoneContribution += mainStoneWeight * pricePerCaratUsd;
          console.log(`Original primary stone (${originalMainStoneType}) contribution: ${mainStoneWeight} carats × ₹${pricePerCaratInr}/carat (≈$${pricePerCaratUsd.toFixed(2)}/carat) = $${(mainStoneWeight * pricePerCaratUsd).toFixed(2)}`);
        }
        
        // Secondary stone contribution
        const originalSecondaryStoneObj = stoneTypes?.find((stone: any) => 
          stone.name.toLowerCase() === originalSecondaryStoneType.toLowerCase());
        
        if (originalSecondaryStoneObj && secondaryStoneWeight > 0) {
          const pricePerCaratInr = originalSecondaryStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          originalStoneContribution += secondaryStoneWeight * pricePerCaratUsd;
          console.log(`Original secondary stone (${originalSecondaryStoneType}) contribution: ${secondaryStoneWeight} carats × ₹${pricePerCaratInr}/carat (≈$${pricePerCaratUsd.toFixed(2)}/carat) = $${(secondaryStoneWeight * pricePerCaratUsd).toFixed(2)}`);
        }
        
        // Other stone contribution
        const originalOtherStoneObj = stoneTypes?.find((stone: any) => 
          stone.name.toLowerCase() === originalOtherStoneType.toLowerCase());
        
        if (originalOtherStoneObj && otherStoneWeight > 0) {
          const pricePerCaratInr = originalOtherStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          originalStoneContribution += otherStoneWeight * pricePerCaratUsd;
          console.log(`Original other stone (${originalOtherStoneType}) contribution: ${otherStoneWeight} carats × ₹${pricePerCaratInr}/carat (≈$${pricePerCaratUsd.toFixed(2)}/carat) = $${(otherStoneWeight * pricePerCaratUsd).toFixed(2)}`);
        }
        
        // Now calculate the new stone contribution based on selected stones
        let newStoneContribution = 0;
        
        // Primary stone
        if (primaryStoneId && primaryStoneId !== "none_selected" && stoneTypes && mainStoneWeight > 0) {
          const selectedStone = stoneTypes.find((stone: any) => String(stone.id) === primaryStoneId);
          console.log("Selected primary stone object from DB:", selectedStone);
          
          if (selectedStone) {
            const pricePerCaratInr = selectedStone.priceModifier || 0;
            const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
            newStoneContribution += mainStoneWeight * pricePerCaratUsd;
            console.log(`New primary stone (${selectedStone.name}) contribution: ${mainStoneWeight} carats × ₹${pricePerCaratInr}/carat (≈$${pricePerCaratUsd.toFixed(2)}/carat) = $${(mainStoneWeight * pricePerCaratUsd).toFixed(2)}`);
          }
        } else if (originalPrimaryStoneObj && mainStoneWeight > 0) {
          // If no primary stone selected, use original
          const pricePerCaratInr = originalPrimaryStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          newStoneContribution += mainStoneWeight * pricePerCaratUsd;
        }
        
        // Secondary stone
        if (secondaryStoneId && secondaryStoneId !== "none_selected" && stoneTypes && secondaryStoneWeight > 0) {
          const selectedSecondaryStone = stoneTypes.find((stone: any) => String(stone.id) === secondaryStoneId);
          
          if (selectedSecondaryStone) {
            const pricePerCaratInr = selectedSecondaryStone.priceModifier || 0;
            const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
            newStoneContribution += secondaryStoneWeight * pricePerCaratUsd;
            console.log(`New secondary stone (${selectedSecondaryStone.name}) contribution: ${secondaryStoneWeight} carats × ₹${pricePerCaratInr}/carat (≈$${pricePerCaratUsd.toFixed(2)}/carat) = $${(secondaryStoneWeight * pricePerCaratUsd).toFixed(2)}`);
          }
        } else if (originalSecondaryStoneObj && secondaryStoneWeight > 0) {
          // If no secondary stone selected, use original
          const pricePerCaratInr = originalSecondaryStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          newStoneContribution += secondaryStoneWeight * pricePerCaratUsd;
        }
        
        // Other stone
        if (otherStoneId && otherStoneId !== "none_selected" && stoneTypes && otherStoneWeight > 0) {
          const selectedOtherStone = stoneTypes.find((stone: any) => String(stone.id) === otherStoneId);
          
          if (selectedOtherStone) {
            const pricePerCaratInr = selectedOtherStone.priceModifier || 0;
            const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
            newStoneContribution += otherStoneWeight * pricePerCaratUsd;
            console.log(`New other stone (${selectedOtherStone.name}) contribution: ${otherStoneWeight} carats × ₹${pricePerCaratInr}/carat (≈$${pricePerCaratUsd.toFixed(2)}/carat) = $${(otherStoneWeight * pricePerCaratUsd).toFixed(2)}`);
          }
        } else if (originalOtherStoneObj && otherStoneWeight > 0) {
          // If no other stone selected, use original
          const pricePerCaratInr = originalOtherStoneObj.priceModifier || 0;
          const pricePerCaratUsd = pricePerCaratInr / EXCHANGE_RATE;
          newStoneContribution += otherStoneWeight * pricePerCaratUsd;
        }
        
        // Calculate the final price
        console.log(`Final price calculation: starting price ${originalPrice} + metal adjustment ${metalPriceAdjustment.toFixed(2)} + stone difference ${(newStoneContribution - originalStoneContribution).toFixed(2)}`);
        
        const finalPrice = Math.round(
          originalPrice + 
          metalPriceAdjustment + 
          (newStoneContribution - originalStoneContribution)
        );
        
        console.log(`Setting final price to: $${finalPrice.toFixed(2)}`);
        setEstimatedPrice(finalPrice);
      } catch (error) {
        console.error("Error calculating price:", error);
        // If there's an error, just use the original price
        setEstimatedPrice(Math.round(product.calculatedPriceUSD || product.basePrice));
      }
    }
  }, [product, metalTypeId, primaryStoneId, secondaryStoneId, otherStoneId, metalTypes, stoneTypes, currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    // Prepare data for submission
    const data = {
      productId: parseInt(productId),
      metalTypeId: parseInt(metalTypeId),
      primaryStoneId: primaryStoneId !== "none_selected" ? parseInt(primaryStoneId) : null,
      secondaryStoneId: secondaryStoneId !== "none_selected" ? parseInt(secondaryStoneId) : null,
      otherStoneId: otherStoneId !== "none_selected" ? parseInt(otherStoneId) : null,
      notes,
      emailAddress,
      estimatedPrice,
      currency,
    };
    
    customizationMutation.mutate(data);
  };

  // Show loading state while data is being fetched
  if (isLoadingProduct || isLoadingMetals || isLoadingStones) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">Loading product details...</h2>
        </div>
      </div>
    );
  }

  // Show error state if product not found
  if (!product) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Product Not Found</h1>
        <p>Sorry, we couldn't find the product you're looking for.</p>
        <Button 
          className="mt-4" 
          onClick={() => navigate("/")}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Customize this Piece</h1>
      <p className="text-muted-foreground mb-6">
        Modify this design to suit your preferences and get a price estimate.
      </p>
      
      <div className="grid md:grid-cols-2 gap-10">
        {/* Product preview section */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>Original Design</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full rounded-md overflow-hidden mb-4">
                <ReliableProductImage 
                  productId={product.id}
                  imageUrl={product.imageUrl}
                  alt={product.name}
                  className="w-full h-auto object-contain"
                />
              </div>
              
              <ProductSpecifications 
                productMetalType={product.metalType}
                productMetalWeight={parseFloat(product.metalWeight) || 0}
                mainStoneType={product.mainStoneType}
                mainStoneWeight={parseFloat(product.mainStoneWeight) || 0}
                secondaryStoneType={product.secondaryStoneType}
                secondaryStoneWeight={parseFloat(product.secondaryStoneWeight) || 0}
                otherStoneType={product.otherStoneType}
                otherStoneWeight={parseFloat(product.otherStoneWeight) || 0}
                currentPrice={product.calculatedPriceUSD || product.basePrice}
                formatCurrency={(value) => `$${value.toLocaleString()}`}
                className="mt-4"
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Customization form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Customization Options</CardTitle>
              <CardDescription>
                Select your preferred materials and we'll provide a price estimate. 
                Your final price may vary based on market fluctuations and detailed specifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Metal selection */}
                <div className="space-y-2">
                  <Label htmlFor="metal-type">Preferred Metal Type</Label>
                  <Select 
                    value={metalTypeId} 
                    onValueChange={(value) => {
                      console.log(`Metal changed to: ${value}`);
                      setMetalTypeId(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select metal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {metalTypes && 
                        metalTypes.map((metal) => (
                          <SelectItem key={`metal-${metal.id}`} value={String(metal.id)}>
                            {metal.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Primary stone selection */}
                <div className="space-y-2">
                  <Label htmlFor="primary-stone">Preferred Primary Stone</Label>
                  <Select 
                    value={primaryStoneId} 
                    onValueChange={(value) => {
                      console.log(`Primary stone changed to: ${value}`);
                      setPrimaryStoneId(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select primary stone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none_selected" key="none-primary">None</SelectItem>
                      
                      {/* If we have suggested stones based on the product */}
                      {suggestedStones && suggestedStones.length > 0 && (
                        <>
                          <div className="p-2 text-center text-xs font-medium text-accent">
                            Recommended for this product:
                          </div>
                          {suggestedStones.map((stone) => (
                            <SelectItem 
                              key={`primary-suggested-${stone.id}`} 
                              value={String(stone.id)}
                            >
                              {stone.name} 
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                        </>
                      )}
                      
                      {/* All stone types */}
                      <div className="p-2 text-center text-xs font-medium text-accent">
                        All Stones
                      </div>
                      {stoneTypes && 
                        stoneTypes.map((stone) => (
                          <SelectItem key={`primary-${stone.id}`} value={String(stone.id)}>
                            {stone.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Secondary stone selection (if the product has a secondary stone) */}
                {product.secondaryStoneType && product.secondaryStoneType !== "None" && (
                  <div className="space-y-2">
                    <Label htmlFor="secondary-stone">Preferred Secondary Stone</Label>
                    <Select 
                      value={secondaryStoneId} 
                      onValueChange={(value) => {
                        console.log(`Secondary stone changed to: ${value}`);
                        setSecondaryStoneId(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select secondary stone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none_selected" key="none-secondary">None</SelectItem>
                        {stoneTypes && 
                          stoneTypes.map((stone) => (
                            <SelectItem key={`secondary-${stone.id}`} value={String(stone.id)}>
                              {stone.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Other stone selection (if the product has another stone) */}
                {product.otherStoneType && product.otherStoneType !== "None" && (
                  <div className="space-y-2">
                    <Label htmlFor="other-stone">Preferred Other Stone</Label>
                    <Select 
                      value={otherStoneId} 
                      onValueChange={(value) => {
                        console.log(`Other stone changed to: ${value}`);
                        setOtherStoneId(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select other stone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none_selected" key="none-other">None</SelectItem>
                        {stoneTypes && 
                          stoneTypes.map((stone) => (
                            <SelectItem key={`other-${stone.id}`} value={String(stone.id)}>
                              {stone.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Special requests / notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Special Requests or Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us about any other customizations you'd like..."
                    rows={4}
                  />
                </div>
                
                {/* Email address */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="your@email.com"
                    required
                    readOnly={!!user}
                    className={user ? "bg-muted" : ""}
                  />
                  {user && (
                    <p className="text-xs text-muted-foreground">
                      Using email from your account.
                    </p>
                  )}
                </div>
                
                {/* Price estimate */}
                <div className="rounded-lg border p-4 mb-4">
                  <h3 className="font-medium mb-1">Projected Estimated Price</h3>
                  <p className="text-2xl font-semibold">${estimatedPrice.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is an initial estimate. Final pricing will be confirmed upon review.
                  </p>
                </div>
                
                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={customizationMutation.isPending}
                >
                  {customizationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Request Customized Quote"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Login dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to log in to submit a customization request. Would you like to continue as a guest or log in first?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/auth")}>
              Log In
            </AlertDialogAction>
            <Button 
              variant="default" 
              onClick={() => {
                setShowLoginDialog(false);
                // Submit as guest (will use email provided in form)
                customizationMutation.mutate({
                  productId: parseInt(productId),
                  metalTypeId: parseInt(metalTypeId),
                  primaryStoneId: primaryStoneId !== "none_selected" ? parseInt(primaryStoneId) : null,
                  secondaryStoneId: secondaryStoneId !== "none_selected" ? parseInt(secondaryStoneId) : null,
                  otherStoneId: otherStoneId !== "none_selected" ? parseInt(otherStoneId) : null,
                  notes,
                  emailAddress,
                  estimatedPrice,
                  currency,
                });
              }}
            >
              Continue as Guest
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
