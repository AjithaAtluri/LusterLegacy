import React, { useState } from 'react';
import { useLocation } from 'wouter';
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
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/admin-layout";

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

interface StoneType {
  id: number;
  name: string;
  pricePerCarat: number; 
  description?: string;
}

interface MetalType {
  id: number;
  name: string;
  priceFactor: number;
  description?: string;
}

interface ProductType {
  id: number;
  name: string;
  description?: string;
}

// Image upload component
interface ImageUploadProps {
  label: string;
  onChange: (file: File) => void; 
  onRemove: () => void;
  imagePreview?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, onChange, onRemove, imagePreview }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {imagePreview ? (
        <div className="relative border rounded-md overflow-hidden aspect-square">
          <img 
            src={imagePreview} 
            alt={label} 
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          onClick={() => document.getElementById('mainImage')?.click()}
          className="border border-dashed rounded-md aspect-square flex flex-col items-center justify-center gap-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload image</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</p>
          <Input 
            id="mainImage" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file);
            }}
          />
        </div>
      )}
    </div>
  );
};

// Main AI Content Generator Page
export default function AIContentGeneratorPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [savedContent, setSavedContent] = useState<AIGeneratedContent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Use effect to load saved content from localStorage on component mount
  React.useEffect(() => {
    const savedContentJson = localStorage.getItem('aiGeneratedContent');
    if (savedContentJson) {
      try {
        const parsedContent = JSON.parse(savedContentJson);
        setSavedContent(parsedContent);
      } catch (error) {
        console.error('Error parsing saved content from localStorage:', error);
      }
    }
  }, []);
  
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
      // Start by showing a loading toast
      toast({
        title: "Testing OpenAI Connection",
        description: "Please wait while we test the connection...",
      });
      
      // Make the API request
      const response = await fetch("/api/test-openai");
      
      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          // Try to parse as JSON, but fall back to text if it fails
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || "Failed to connect to OpenAI API.";
        } catch (jsonError) {
          errorMessage = errorText || `HTTP error ${response.status}`;
        }
        
        toast({
          title: "OpenAI Connection Test Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      // Parse the response
      const data = await response.json();
      
      // Show success or failure based on the response
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
                        <SelectItem value="no_types" disabled>No stone types available</SelectItem>
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
                      <SelectItem value="none">None</SelectItem>
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
                        <SelectItem value="no_types" disabled>No stone types available</SelectItem>
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
                    disabled={!formData.secondaryStoneType || formData.secondaryStoneType === 'none'}
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
                      <SelectItem value="none">None</SelectItem>
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
                        <SelectItem value="no_types" disabled>No stone types available</SelectItem>
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
                    disabled={!formData.otherStoneType || formData.otherStoneType === 'none'}
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
                placeholder="Add any other details or specific instructions for the AI..."
                value={formData.additionalDetails}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={testOpenAIConnection}
            >
              Test API Connection
            </Button>
            <Button 
              type="button" 
              onClick={generateContent} 
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isGenerating ? "Generating..." : "Generate Content"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Saved Content Card */}
        {savedContent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Saved AI-Generated Content
                <Badge variant="outline" className="ml-2">Ready to use</Badge>
              </CardTitle>
              <CardDescription>
                Use this content to create a new product or edit an existing one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{savedContent.title}</h3>
                <p className="text-muted-foreground italic">{savedContent.tagline}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Short Description</h4>
                  <p className="text-sm">{savedContent.shortDescription}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Price</h4>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      USD ${savedContent.priceUSD.toFixed(2)}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      INR ₹{savedContent.priceINR.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  // Clear saved content from state and localStorage
                  setSavedContent(null);
                  localStorage.removeItem('aiGeneratedContent');
                  localStorage.removeItem('aiGeneratedImagePreview');
                  localStorage.removeItem('aiGeneratedImageData');
                  
                  toast({
                    title: "Content Cleared",
                    description: "Saved content has been cleared.",
                  });
                }}
              >
                Clear Saved Content
              </Button>
              <Button
                onClick={() => {
                  // Navigate to the add product page, which will automatically use the saved content
                  navigate('/admin/add-product');
                  toast({
                    title: "Content Ready",
                    description: "Use the AI-generated content to create your new product.",
                  });
                }}
              >
                Use for New Product
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Result Preview Dialog */}
        {generatedContent && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Generated Content
                  {isModelFallback && (
                    <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
                      Used fallback model
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  AI-generated content based on your jewelry details
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="formatted">
                <TabsList>
                  <TabsTrigger value="formatted">Formatted</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>
                
                <TabsContent value="formatted" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">{generatedContent.title}</h3>
                      <p className="text-muted-foreground italic">{generatedContent.tagline}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Short Description</h4>
                        <p className="text-sm">{generatedContent.shortDescription}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Price</h4>
                        <div className="flex gap-3">
                          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                            USD ${generatedContent.priceUSD.toFixed(2)}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                            INR ₹{generatedContent.priceINR.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Detailed Description</h4>
                      <div className="text-sm border rounded-md p-3 bg-muted/20 whitespace-pre-wrap">
                        {generatedContent.detailedDescription}
                      </div>
                    </div>
                    
                    {generatedContent.imageInsights && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Image Insights</h4>
                        <div className="text-sm border rounded-md p-3 bg-muted/20">
                          {generatedContent.imageInsights}
                        </div>
                      </div>
                    )}
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
                  // Save content for later use
                  setSavedContent(generatedContent);
                  
                  // Store in localStorage for persistence
                  localStorage.setItem('aiGeneratedContent', JSON.stringify(generatedContent));
                  
                  // Save main image preview URL to localStorage
                  if (mainImagePreview) {
                    localStorage.setItem('aiGeneratedImagePreview', mainImagePreview);
                  }
                  
                  // Store raw image file data for later use when creating a product
                  if (mainImage) {
                    const fileReader = new FileReader();
                    fileReader.onload = (event) => {
                      if (event.target?.result) {
                        localStorage.setItem('aiGeneratedImageData', event.target.result as string);
                      }
                    };
                    fileReader.readAsDataURL(mainImage);
                  }
                  
                  // Show success toast
                  toast({
                    title: "Content Saved",
                    description: "AI generated content has been saved. You can now use it to create a product.",
                  });
                  
                  // Close dialog
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