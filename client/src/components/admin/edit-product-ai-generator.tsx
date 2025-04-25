import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";
import type { StoneType } from "@shared/schema";

interface EditProductAIGeneratorProps {
  productType: string;
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneTypes: StoneType[];
  secondaryStoneWeight: string;
  userDescription: string;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  onContentGenerated: (content: AIGeneratedContent) => void;
  onMainImageChange: (file: File | null, preview: string | null) => void;
  onAdditionalImagesChange: (files: File[], previews: string[]) => void;
}

const EditProductAIGenerator = ({
  productType,
  metalType, 
  metalWeight,
  mainStoneType,
  mainStoneWeight,
  secondaryStoneTypes,
  secondaryStoneWeight,
  userDescription,
  mainImageUrl,
  additionalImageUrls,
  onContentGenerated,
  onMainImageChange,
  onAdditionalImagesChange
}: EditProductAIGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  // Main image handling
  const onMainImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onMainImageChange(file, previewUrl);
    }
  }, [onMainImageChange]);

  const { getRootProps: getMainImageRootProps, getInputProps: getMainImageInputProps } = useDropzone({
    onDrop: onMainImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });
  
  // Additional images handling
  const onAdditionalImagesDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to 3 additional images total
    const remainingSlots = 3 - additionalImageUrls.length;
    
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum Images Reached",
        description: "You can upload a maximum of 3 additional images.",
        variant: "destructive"
      });
      return;
    }
    
    const files = acceptedFiles.slice(0, remainingSlots);
    const previews = files.map(file => URL.createObjectURL(file));
    
    onAdditionalImagesChange(files, [...additionalImageUrls, ...previews]);
  }, [additionalImageUrls, onAdditionalImagesChange, toast]);

  const { getRootProps: getAdditionalImagesRootProps, getInputProps: getAdditionalImagesInputProps } = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 3
  });
  
  // Removing additional images
  const removeAdditionalImage = (index: number) => {
    const newPreviews = [...additionalImageUrls];
    newPreviews.splice(index, 1);
    
    // When removing an image, we assume it's from the server and not a newly added file
    onAdditionalImagesChange([], newPreviews);
  };
  
  // Generate content with AI
  const generateContent = async () => {
    try {
      setIsGenerating(true);

      // Filter out invalid values
      let filteredMainStoneType = mainStoneType;
      if (filteredMainStoneType === "none_selected") {
        filteredMainStoneType = "";
      }
      
      // Prepare form data for image upload and content generation
      const formData = new FormData();
      
      // Add product details
      const productData = {
        productType,
        metalType,
        metalWeight,
        mainStoneType: filteredMainStoneType,
        mainStoneWeight,
        secondaryStoneTypes: secondaryStoneTypes.map(stone => stone.name),
        secondaryStoneWeight,
        userDescription
      };
      
      formData.append('data', JSON.stringify(productData));
      
      // Add image URLs (if they are from server)
      if (mainImageUrl) {
        formData.append('existingMainImage', mainImageUrl);
      }
      
      additionalImageUrls.forEach((url, index) => {
        formData.append(`existingAdditionalImage${index + 1}`, url);
      });
      
      // Make the API request
      const response = await apiRequest(
        "POST", 
        "/api/admin/generate-product-content", 
        formData,
        true // isFormData flag
      );
      
      const data = await response.json();
      
      // Handle the response
      if (data) {
        onContentGenerated(data);
      } else {
        throw new Error("Failed to generate content");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please check your inputs and try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if enough data is provided for generation
  const canGenerate = !!(productType && metalType && (mainImageUrl || additionalImageUrls.length > 0));
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Product Type</h3>
              <p className="text-muted-foreground">{productType || "Not selected"}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Metal Type</h3>
              <p className="text-muted-foreground">{metalType || "Not selected"}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Metal Weight</h3>
              <p className="text-muted-foreground">{metalWeight || "Not specified"} g</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Main Stone</h3>
              <p className="text-muted-foreground">
                {mainStoneType && mainStoneType !== "none_selected" 
                  ? `${mainStoneType} (${mainStoneWeight || "0"} carat)` 
                  : "None"}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Secondary Stones</h3>
            {secondaryStoneTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {secondaryStoneTypes.map(stone => (
                  <div key={stone.id} className="px-2 py-1 bg-muted rounded-md text-sm">
                    {stone.name}
                  </div>
                ))}
                {secondaryStoneWeight && (
                  <div className="px-2 py-1 bg-muted rounded-md text-sm">
                    Total: {secondaryStoneWeight} carat
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No secondary stones selected</p>
            )}
          </div>
          
          {userDescription && (
            <div>
              <h3 className="font-medium mb-2">Custom Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{userDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Main Image</h3>
            {mainImageUrl ? (
              <div className="relative w-full h-[300px] rounded-md overflow-hidden border border-input">
                <img 
                  src={mainImageUrl} 
                  alt="Main product" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                  onClick={() => {
                    onMainImageChange(null, null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getMainImageRootProps()}
                className="border-2 border-dashed border-input rounded-md p-10 text-center hover:border-primary/50 cursor-pointer transition-colors"
              >
                <input {...getMainImageInputProps()} />
                <div className="flex flex-col items-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground">Recommended size: 1200x1200px</p>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Additional Images (Up to 3)</h3>
            <div className="grid grid-cols-3 gap-4">
              {additionalImageUrls.map((url, index) => (
                <div key={index} className="relative w-full h-[120px] rounded-md overflow-hidden border border-input">
                  <img
                    src={url}
                    alt={`Additional product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                    onClick={() => removeAdditionalImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {additionalImageUrls.length < 3 && (
                <div
                  {...getAdditionalImagesRootProps()}
                  className="border-2 border-dashed border-input rounded-md p-4 text-center hover:border-primary/50 cursor-pointer transition-colors h-[120px] flex flex-col items-center justify-center"
                >
                  <input {...getAdditionalImagesInputProps()} />
                  <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Add Image</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button
          onClick={generateContent}
          disabled={isGenerating || !canGenerate}
          className="min-w-[180px]"
        >
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGenerating ? "Generating..." : "Generate Content"}
        </Button>
      </div>
      
      {!canGenerate && (
        <p className="text-center text-sm text-muted-foreground">
          Please select at least a product type, metal type, and add an image to generate content.
        </p>
      )}
    </div>
  );
};

export default EditProductAIGenerator;