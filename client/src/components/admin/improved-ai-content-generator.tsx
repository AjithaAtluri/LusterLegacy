import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Define the expected response structure from the AI
interface AIGeneratedContent {
  title: string;
  tagline: string;
  shortDescription: string;
  detailedDescription: string;
  priceUSD: number;
  priceINR: number;
  imageInsights?: string;
}

// Define the stone type interface
interface StoneType {
  id: number;
  name: string;
  pricePerCarat: number; 
  description?: string;
}

// Define the metal type interface
interface MetalType {
  id: number;
  name: string;
  priceFactor: number;
  description?: string;
}

// Define the product type interface
interface ProductType {
  id: number;
  name: string;
  description?: string;
}

// The hardcoded options below will be used as fallback only
// if API fetch fails or during development
const fallbackStoneTypeOptions = [
  "Diamond", "Ruby", "Sapphire", "Emerald", "Amethyst", 
  "Aquamarine", "Tanzanite", "Topaz", "Opal", "Pearl",
  "Garnet", "Peridot", "Tourmaline", "Citrine", "Morganite"
];

// Fallback metal options
const fallbackMetalOptions = [
  "18k Gold", "14k Gold", "22k Gold", "24k Gold", 
  "Platinum", "Sterling Silver", "Rose Gold 18k", "White Gold 18k"
];

// Fallback product type options
const fallbackProductTypeOptions = [
  "Ring", "Necklace", "Bracelet", "Earrings", "Pendant",
  "Anklet", "Brooch", "Cufflinks", "Tiara", "Bangle"
];

/**
 * Improved AI Content Generator component that creates product descriptions
 * and price estimates for jewelry items using an improved backend endpoint
 */
export default function ImprovedAIContentGenerator({
  onGeneratedContent
}: {
  onGeneratedContent: (content: AIGeneratedContent) => void;
}) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [stoneTypeFields, setStoneTypeFields] = useState([{ name: "", carats: 0.1 }]);
  
  // Fetch stone types from the API using public endpoints
  const { data: stoneTypes, isLoading: isLoadingStoneTypes, error: stoneTypesError } = useQuery<StoneType[]>({
    queryKey: ['/api/stone-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Fetch metal types from the API using public endpoints
  const { data: metalTypes, isLoading: isLoadingMetalTypes, error: metalTypesError } = useQuery<MetalType[]>({
    queryKey: ['/api/metal-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Fetch product types from the API using public endpoints
  const { data: productTypes, isLoading: isLoadingProductTypes, error: productTypesError } = useQuery<ProductType[]>({
    queryKey: ['/api/product-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Form state
  const [formData, setFormData] = useState({
    productTypes: [] as string[],  // Changed to array for multiple selection
    metalTypes: [] as string[],    // Changed to array for multiple selection
    metalWeight: 5,
    userDescription: "",
  });

  // Error tracking
  const [error, setError] = useState<string | null>(null);
  const [isModelFallback, setIsModelFallback] = useState(false);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle select component changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // Add a new stone type field
  const addStoneTypeField = () => {
    setStoneTypeFields([...stoneTypeFields, { name: "", carats: 0.1 }]);
  };

  // Remove a stone type field
  const removeStoneTypeField = (index: number) => {
    const updatedStoneTypeFields = [...stoneTypeFields];
    updatedStoneTypeFields.splice(index, 1);
    setStoneTypeFields(updatedStoneTypeFields);
  };

  // Update stone type field values
  const updateStoneTypeField = (index: number, field: string, value: string) => {
    const updatedStoneTypeFields = [...stoneTypeFields];
    if (field === 'name') {
      updatedStoneTypeFields[index].name = value;
    } else if (field === 'carats') {
      updatedStoneTypeFields[index].carats = parseFloat(value) || 0.1;
    }
    setStoneTypeFields(updatedStoneTypeFields);
  };

  // Close the preview dialog and apply the generated content
  const applyGeneratedContent = () => {
    if (generatedContent) {
      onGeneratedContent(generatedContent);
      setIsPreviewOpen(false);
      toast({
        title: "Content Applied",
        description: "AI generated content has been applied to the product form.",
      });
    }
  };

  // Generate content using the AI service
  const generateContent = async () => {
    setError(null);
    setIsModelFallback(false);
    setIsGenerating(true);

    try {
      // Validate required fields
      if (!formData.productType || !formData.metalType) {
        throw new Error("Product type and metal type are required");
      }

      // Filter out empty stone type fields
      const validStoneTypes = stoneTypeFields.filter(stone => stone.name.trim() !== "");

      // Create the request payload
      const requestPayload = {
        ...formData,
        metalWeight: Number(formData.metalWeight) || 5,
        primaryGems: validStoneTypes.length > 0 ? validStoneTypes : undefined, // Keep primaryGems key for backward compatibility
      };

      console.log("Generating content with data:", requestPayload);

      // Make the API request to the improved endpoint
      const response = await apiRequest(
        "POST", 
        "/api/admin/generate-jewelry-content", 
        requestPayload
      );

      // Check if we got a successful response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate content");
      }

      // Parse the response
      const data = await response.json();
      console.log("Generated content:", data);

      // Check if the response contains model fallback information
      if (response.headers.get('X-Model-Fallback') === 'true') {
        setIsModelFallback(true);
      }

      // Save the generated content and open the preview
      setGeneratedContent(data);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Content generation error:", err);
      
      // Set error message
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      
      // Show error toast
      toast({
        title: "Content Generation Failed",
        description: err instanceof Error ? err.message : "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Test the OpenAI connection
  const testOpenAIConnection = async () => {
    try {
      const response = await apiRequest("GET", "/api/test-openai");
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "OpenAI Connection Test",
          description: "Connection to OpenAI API is working correctly.",
        });
      } else {
        toast({
          title: "OpenAI Connection Test Failed",
          description: data.message || "Failed to connect to OpenAI API.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "OpenAI Connection Test Failed",
        description: "Error connecting to OpenAI API. Check console for details.",
        variant: "destructive",
      });
      console.error("OpenAI connection test error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Content Generator</span>
            <Badge variant={isModelFallback ? "outline" : "default"} className="ml-2">
              {isModelFallback ? "Using Fallback Model" : "Using GPT-4o"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Generate product descriptions and price estimates using AI. Start by entering the basic product details below.
          </CardDescription>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded-md">
              <AlertCircle size={16} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type <span className="text-destructive">*</span></Label>
              <Select 
                name="productType" 
                value={formData.productType} 
                onValueChange={(value) => handleSelectChange("productType", value)}
              >
                <SelectTrigger id="productType" className={isLoadingProductTypes ? "opacity-70" : ""}>
                  <SelectValue placeholder={isLoadingProductTypes ? "Loading product types..." : "Select product type"} />
                </SelectTrigger>
                <SelectContent>
                  {productTypesError ? (
                    <SelectItem value="error" disabled>Error loading product types</SelectItem>
                  ) : isLoadingProductTypes ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : productTypes && productTypes.length > 0 ? (
                    productTypes.map((productType) => (
                      <SelectItem key={productType.id} value={productType.name}>
                        {productType.name}
                      </SelectItem>
                    ))
                  ) : (
                    fallbackProductTypeOptions.map((productType) => (
                      <SelectItem key={productType} value={productType}>
                        {productType} (Fallback)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metalType">Metal Type <span className="text-destructive">*</span></Label>
              <Select 
                name="metalType" 
                value={formData.metalType} 
                onValueChange={(value) => handleSelectChange("metalType", value)}
              >
                <SelectTrigger id="metalType" className={isLoadingMetalTypes ? "opacity-70" : ""}>
                  <SelectValue placeholder={isLoadingMetalTypes ? "Loading metal types..." : "Select metal type"} />
                </SelectTrigger>
                <SelectContent>
                  {metalTypesError ? (
                    <SelectItem value="error" disabled>Error loading metal types</SelectItem>
                  ) : isLoadingMetalTypes ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : metalTypes && metalTypes.length > 0 ? (
                    metalTypes.map((metalType) => (
                      <SelectItem key={metalType.id} value={metalType.name}>
                        {metalType.name}
                      </SelectItem>
                    ))
                  ) : (
                    fallbackMetalOptions.map((metalType) => (
                      <SelectItem key={metalType} value={metalType}>
                        {metalType} (Fallback)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metalWeight">Metal Weight (grams)</Label>
            <Input
              id="metalWeight"
              name="metalWeight"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="5"
              value={formData.metalWeight}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Stone Types (Optional)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addStoneTypeField}
              >
                Add Stone Type
              </Button>
            </div>
            
            {stoneTypeFields.map((stone, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`stoneName-${index}`} className="text-xs">Name</Label>
                  <Select 
                    value={stone.name} 
                    onValueChange={(value) => updateStoneTypeField(index, 'name', value)}
                  >
                    <SelectTrigger id={`stoneName-${index}`} className={isLoadingStoneTypes ? "opacity-70" : ""}>
                      <SelectValue placeholder={isLoadingStoneTypes ? "Loading stone types..." : "Select stone type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {stoneTypesError ? (
                        <SelectItem value="error" disabled>Error loading stone types</SelectItem>
                      ) : isLoadingStoneTypes ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : stoneTypes && stoneTypes.length > 0 ? (
                        stoneTypes.map((stoneType) => (
                          <SelectItem key={stoneType.id} value={stoneType.name}>
                            {stoneType.name}
                          </SelectItem>
                        ))
                      ) : (
                        fallbackStoneTypeOptions.map((stoneType) => (
                          <SelectItem key={stoneType} value={stoneType}>
                            {stoneType} (Fallback)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/3">
                  <Label htmlFor={`stoneCarats-${index}`} className="text-xs">Carats</Label>
                  <Input
                    id={`stoneCarats-${index}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.1"
                    value={stone.carats || ""}
                    onChange={(e) => updateStoneTypeField(index, 'carats', e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeStoneTypeField(index)}
                  className="text-destructive"
                >
                  &times;
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userDescription">Additional Details (Optional)</Label>
            <Textarea
              id="userDescription"
              name="userDescription"
              placeholder="Provide any additional details about the jewelry item..."
              rows={3}
              value={formData.userDescription}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={testOpenAIConnection}
          >
            Test API Connection
          </Button>
          <Button 
            onClick={generateContent} 
            disabled={isGenerating || !formData.productType || !formData.metalType}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Content'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span>AI Generated Content</span>
              {isModelFallback && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Used Fallback Model
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Preview the generated content before applying it to your product.
            </DialogDescription>
          </DialogHeader>

          {generatedContent && (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Title</h3>
                  <p className="border p-3 rounded-md bg-muted/50">{generatedContent.title}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Tagline</h3>
                  <p className="border p-3 rounded-md bg-muted/50">{generatedContent.tagline}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Short Description</h3>
                  <p className="border p-3 rounded-md bg-muted/50">{generatedContent.shortDescription}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Detailed Description</h3>
                  <p className="border p-3 rounded-md bg-muted/50 whitespace-pre-line">{generatedContent.detailedDescription}</p>
                </div>
                
                {generatedContent.imageInsights && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Image Insights</h3>
                    <p className="border p-3 rounded-md bg-muted/50 whitespace-pre-line">{generatedContent.imageInsights}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">USD Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${generatedContent.priceUSD.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">INR Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₹{generatedContent.priceINR.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="border rounded-md p-4 bg-muted/30">
                  <h3 className="font-medium mb-2">Price Details</h3>
                  <p className="text-sm">
                    Prices are estimated based on current market values for the specified materials, craftsmanship, and design complexity.
                    The USD price will be used for orders shipping to the US, while the INR price will be used for orders shipping to India.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="raw" className="space-y-4">
                <div className="border rounded-md p-4 bg-muted font-mono text-xs overflow-auto max-h-[400px]">
                  <pre>{JSON.stringify(generatedContent, null, 2)}</pre>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyGeneratedContent} className="gap-2">
              <CheckCircle2 size={16} />
              Apply Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}