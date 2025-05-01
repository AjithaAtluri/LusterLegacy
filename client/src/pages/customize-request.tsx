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
import { ArrowLeft, Send, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import ReliableProductImage from "@/components/ui/reliable-product-image";
import { ProductSpecifications } from "@/components/products/product-specifications";

export default function CustomizeRequest() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customizationDetails, setCustomizationDetails] = useState("");
  const [preferredBudget, setPreferredBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [metalTypeId, setMetalTypeId] = useState("");
  const [primaryStoneId, setPrimaryStoneId] = useState("");
  const [secondaryStoneId, setSecondaryStoneId] = useState("");
  
  // State for related stones based on the product's original stones
  const [suggestedStones, setSuggestedStones] = useState<any[]>([]);
  
  // Fetch product data to display in the form
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });
  
  // Fetch metal types for dropdown
  const { data: metalTypes, isLoading: isLoadingMetalTypes } = useQuery({
    queryKey: ['/api/metal-types'],
  });
  
  // Fetch stone types for dropdown
  const { data: stoneTypes, isLoading: isLoadingStoneTypes } = useQuery({
    queryKey: ['/api/stone-types'],
  });

  // Handle form submission
  const customizationMutation = useMutation({
    mutationFn: async (formData: {
      productId: number;
      name: string;
      email: string;
      phone: string;
      customizationDetails: string;
      preferredBudget: string;
      timeline: string;
      metalTypeId?: string;
      primaryStoneId?: string;
      secondaryStoneId?: string;
    }) => {
      const response = await apiRequest("POST", "/api/customization-requests", formData);
      if (!response.ok) {
        throw new Error("Failed to submit customization request");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customization Request Sent!",
        description: "We've received your request and will contact you soon.",
        variant: "default",
      });
      // Navigate back to product detail page after successful submission
      setTimeout(() => {
        setLocation(`/product-detail/${id}`);
      }, 2000);
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
    if (!name || !email || !phone || !customizationDetails) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields (name, email, phone, and customization details).",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the form
    customizationMutation.mutate({
      productId: Number(id),
      name,
      email,
      phone,
      customizationDetails,
      preferredBudget,
      timeline,
      metalTypeId,
      primaryStoneId,
      secondaryStoneId,
    });
  };

  // Navigate back to product detail
  // Pre-fill form with user data if available
  useEffect(() => {
    if (user) {
      setName(user.username);
      setEmail(user.email || "");
    }
  }, [user]);
  
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
        <title>Customize {product.name} | Luster Legacy</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>
          <h1 className="font-playfair text-3xl font-bold mb-2">Request Customization</h1>
          <p className="text-foreground/70 mb-6">
            Fill out the form below to request customization for {product.name}
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
                * Final price may vary based on customization requests
              </p>
            </CardContent>
          </Card>
          
          {/* Customization Request Form */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                              <SelectItem key={stone.id} value={String(stone.id)}>
                                {stone.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="secondaryStone">Preferred Secondary Stone Type (Optional)</Label>
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
                              <SelectItem key={stone.id} value={String(stone.id)}>
                                {stone.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="customizationDetails">Customization Details*</Label>
                      <Textarea
                        id="customizationDetails"
                        placeholder="Describe your customization requirements in detail..."
                        className="min-h-[150px]"
                        value={customizationDetails}
                        onChange={(e) => setCustomizationDetails(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90"
                      disabled={customizationMutation.isPending}
                    >
                      {customizationMutation.isPending ? (
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
    </>
  );
}