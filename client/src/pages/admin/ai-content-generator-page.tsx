import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2, Upload, X, PlusCircle, Image as ImageIcon } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Define the generated content interface
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

// Component for image upload
const ImageUpload = ({ 
  label, 
  onChange, 
  onRemove, 
  imagePreview 
}: { 
  label: string; 
  onChange: (file: File) => void; 
  onRemove: () => void; 
  imagePreview?: string;
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {imagePreview ? (
        <div className="relative border rounded-md overflow-hidden aspect-square">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById(label.replace(/\s+/g, ''))?.click()}>
          <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm mb-1">Click to upload or drag and drop</p>
          <p className="text-xs">JPG, PNG, WEBP, AVIF (max 10MB)</p>
          <Input 
            id={label.replace(/\s+/g, '')} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};

// Main AI Content Generator Page
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/admin-layout";

export default function AIContentGeneratorPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Store images
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  
  // Fetch data from API
  const { data: stoneTypes, isLoading: isLoadingStoneTypes, error: stoneTypesError } = useQuery<StoneType[]>({
    queryKey: ['/api/admin/stone-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  const { data: metalTypes, isLoading: isLoadingMetalTypes, error: metalTypesError } = useQuery<MetalType[]>({
    queryKey: ['/api/admin/metal-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  const { data: productTypes, isLoading: isLoadingProductTypes, error: productTypesError } = useQuery<ProductType[]>({
    queryKey: ['/api/admin/product-types'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Form state
  const [formData, setFormData] = useState({
    productTypes: [] as string[],
    metalTypes: [] as string[],
    metalWeight: 5,
    mainStoneType: "",
    mainStoneWeight: 1,
    secondaryStoneType: "",
    secondaryStoneWeight: 0.5,
    otherStoneType: "",
    otherStoneWeight: 0.2,
    additionalDetails: "",
  });
  
  // Error tracking
  const [error, setError] = useState<string | null>(null);
  const [isModelFallback, setIsModelFallback] = useState(false);
  
  // Handle image uploads
  const handleMainImageChange = (file: File) => {
    setMainImage(file);
    const imageUrl = URL.createObjectURL(file);
    setMainImagePreview(imageUrl);
  };
  
  const handleAdditionalImageChange = (file: File) => {
    if (additionalImages.length < 3) {
      setAdditionalImages([...additionalImages, file]);
      const imageUrl = URL.createObjectURL(file);
      setAdditionalImagePreviews([...additionalImagePreviews, imageUrl]);
    } else {
      toast({
        title: "Image Limit Reached",
        description: "Maximum 3 additional images allowed.",
        variant: "destructive",
      });
    }
  };
  
  const removeMainImage = () => {
    setMainImage(null);
    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
      setMainImagePreview(null);
    }
  };
  
  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages.splice(index, 1);
    setAdditionalImages(newImages);
    
    const newPreviews = [...additionalImagePreviews];
    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    newPreviews.splice(index, 1);
    setAdditionalImagePreviews(newPreviews);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle select component changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle multiple select changes
  const handleMultiSelectChange = (name: string, value: string) => {
    const currentValues = formData[name as keyof typeof formData] as string[];
    
    // If value already exists, remove it; otherwise add it
    if (Array.isArray(currentValues)) {
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      setFormData({ ...formData, [name]: updatedValues });
    }
  };
  
  // Generate content using the AI service
  const generateContent = async () => {
    setError(null);
    setIsModelFallback(false);
    setIsGenerating(true);
    
    try {
      // Validate required fields
      if (formData.productTypes.length === 0) {
        throw new Error("At least one product type is required");
      }
      
      if (formData.metalTypes.length === 0) {
        throw new Error("At least one metal type is required");
      }
      
      if (!formData.mainStoneType) {
        throw new Error("Main stone type is required");
      }
      
      if (!mainImage) {
        throw new Error("Main product image is required");
      }
      
      // Prepare form data for file upload
      const formDataObj = new FormData();
      
      // Add product details
      formDataObj.append('productTypes', JSON.stringify(formData.productTypes));
      formDataObj.append('metalTypes', JSON.stringify(formData.metalTypes));
      formDataObj.append('metalWeight', formData.metalWeight.toString());
      formDataObj.append('mainStoneType', formData.mainStoneType);
      formDataObj.append('mainStoneWeight', formData.mainStoneWeight.toString());
      
      if (formData.secondaryStoneType) {
        formDataObj.append('secondaryStoneType', formData.secondaryStoneType);
        formDataObj.append('secondaryStoneWeight', formData.secondaryStoneWeight.toString());
      }
      
      if (formData.otherStoneType) {
        formDataObj.append('otherStoneType', formData.otherStoneType);
        formDataObj.append('otherStoneWeight', formData.otherStoneWeight.toString());
      }
      
      if (formData.additionalDetails) {
        formDataObj.append('additionalDetails', formData.additionalDetails);
      }
      
      // Add images
      formDataObj.append('mainImage', mainImage);
      
      additionalImages.forEach((image, index) => {
        formDataObj.append(`additionalImage${index + 1}`, image);
      });
      
      // Make the API request to the generator endpoint
      const response = await fetch('/api/admin/generate-product-content', {
        method: 'POST',
        body: formDataObj
      });
      
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
    <AdminLayout title="AI Content Generator">
      <Helmet>
        <title>AI Content Generator | Luster Legacy Admin</title>
      </Helmet>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Product Details & Image Upload
            </CardTitle>
            <CardDescription>
              Upload images and provide details about the jewelry item to generate creative product content
            </CardDescription>
            {error && (
              <div className="mt-2 flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded-md">
                <AlertCircle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <ImageUpload
                label="Main Product Image"
                onChange={handleMainImageChange}
                onRemove={removeMainImage}
                imagePreview={mainImagePreview || undefined}
              />
              
              <div className="space-y-2">
                <Label>Additional Images (Optional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden aspect-square">
                      <img 
                        src={preview} 
                        alt={`Additional ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {additionalImagePreviews.length < 3 && (
                    <div 
                      className="border border-dashed rounded-md aspect-square flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById('additionalImage')?.click()}
                    >
                      <PlusCircle className="h-6 w-6 opacity-50" />
                      <Input 
                        id="additionalImage" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAdditionalImageChange(file);
                          // Reset the input value to allow selecting the same file again
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Product Types (Multiple Selection) */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="productTypes">Product Types <span className="text-destructive">*</span></Label>
                <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
              </div>
              
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-2">
                {productTypesError ? (
                  <div className="col-span-2 text-destructive">Error loading product types</div>
                ) : isLoadingProductTypes ? (
                  <div className="col-span-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading product types...
                  </div>
                ) : productTypes && productTypes.length > 0 ? (
                  productTypes.map((productType) => (
                    <div key={productType.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`product-type-${productType.id}`} 
                        checked={formData.productTypes.includes(productType.name)}
                        onCheckedChange={() => handleMultiSelectChange('productTypes', productType.name)}
                      />
                      <label 
                        htmlFor={`product-type-${productType.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {productType.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2">No product types available</div>
                )}
              </div>
            </div>
            
            {/* Metal Types (Multiple Selection) */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="metalTypes">Metal Types <span className="text-destructive">*</span></Label>
                <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
              </div>
              
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-2">
                {metalTypesError ? (
                  <div className="col-span-2 text-destructive">Error loading metal types</div>
                ) : isLoadingMetalTypes ? (
                  <div className="col-span-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading metal types...
                  </div>
                ) : metalTypes && metalTypes.length > 0 ? (
                  metalTypes.map((metalType) => (
                    <div key={metalType.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`metal-type-${metalType.id}`} 
                        checked={formData.metalTypes.includes(metalType.name)}
                        onCheckedChange={() => handleMultiSelectChange('metalTypes', metalType.name)}
                      />
                      <label 
                        htmlFor={`metal-type-${metalType.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {metalType.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2">No metal types available</div>
                )}
              </div>
            </div>
            
            {/* Metal Weight */}
            <div className="space-y-2">
              <Label htmlFor="metalWeight">Metal Weight (grams) <span className="text-destructive">*</span></Label>
              <Input
                id="metalWeight"
                name="metalWeight"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="5"
                value={formData.metalWeight}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {/* Stone Types Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Stone Information</h3>
              
              {/* Main Stone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="mainStoneType">Main Stone Type <span className="text-destructive">*</span></Label>
                  <Select 
                    value={formData.mainStoneType} 
                    onValueChange={(value) => handleSelectChange("mainStoneType", value)}
                  >
                    <SelectTrigger id="mainStoneType" className={isLoadingStoneTypes ? "opacity-70" : ""}>
                      <SelectValue placeholder={isLoadingStoneTypes ? "Loading stone types..." : "Select main stone type"} />
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
                        <SelectItem value="none" disabled>No stone types available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mainStoneWeight">Main Stone Weight (carats) <span className="text-destructive">*</span></Label>
                  <Input
                    id="mainStoneWeight"
                    name="mainStoneWeight"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="1"
                    value={formData.mainStoneWeight}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              {/* Secondary Stone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="secondaryStoneType">Secondary Stone Type (Optional)</Label>
                  <Select 
                    value={formData.secondaryStoneType} 
                    onValueChange={(value) => handleSelectChange("secondaryStoneType", value)}
                  >
                    <SelectTrigger id="secondaryStoneType" className={isLoadingStoneTypes ? "opacity-70" : ""}>
                      <SelectValue placeholder={isLoadingStoneTypes ? "Loading stone types..." : "Select secondary stone"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                        <SelectItem value="none" disabled>No stone types available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryStoneWeight">Secondary Stone Weight (carats)</Label>
                  <Input
                    id="secondaryStoneWeight"
                    name="secondaryStoneWeight"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.5"
                    value={formData.secondaryStoneWeight}
                    onChange={handleInputChange}
                    disabled={!formData.secondaryStoneType}
                  />
                </div>
              </div>
              
              {/* Other Stone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="otherStoneType">Other Stone Type (Optional)</Label>
                  <Select 
                    value={formData.otherStoneType} 
                    onValueChange={(value) => handleSelectChange("otherStoneType", value)}
                  >
                    <SelectTrigger id="otherStoneType" className={isLoadingStoneTypes ? "opacity-70" : ""}>
                      <SelectValue placeholder={isLoadingStoneTypes ? "Loading stone types..." : "Select other stone"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                        <SelectItem value="none" disabled>No stone types available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherStoneWeight">Other Stone Weight (carats)</Label>
                  <Input
                    id="otherStoneWeight"
                    name="otherStoneWeight"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.2"
                    value={formData.otherStoneWeight}
                    onChange={handleInputChange}
                    disabled={!formData.otherStoneType}
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="additionalDetails">Additional Details (Optional)</Label>
              <Textarea
                id="additionalDetails"
                name="additionalDetails"
                placeholder="Provide any additional details about the jewelry item..."
                rows={3}
                value={formData.additionalDetails}
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
              disabled={isGenerating || formData.productTypes.length === 0 || formData.metalTypes.length === 0 || !formData.mainStoneType || !mainImage}
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
        {generatedContent && (
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Content Applied",
                    description: "AI generated content has been saved.",
                  });
                  setIsPreviewOpen(false);
                }} className="gap-2">
                  <CheckCircle2 size={16} />
                  Save Content
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}