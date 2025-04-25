import { useState, useCallback, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { apiRequest } from "@/lib/queryClient";
import AIContentGenerator from "@/components/admin/ai-content-generator";
import type { AIGeneratedContent } from "@/lib/ai-content-generator";

interface EditProductAIGeneratorProps {
  productType: string;
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneTypes: { id: number; name: string }[];
  secondaryStoneWeight: string;
  userDescription: string;
  mainImageUrl: string | null;
  additionalImageUrls: string[];
  onContentGenerated: (content: AIGeneratedContent) => void;
  onMainImageChange: (file: File | null, preview: string | null) => void;
  onAdditionalImagesChange: (files: File[], previews: string[]) => void;
}

export default function EditProductAIGenerator({
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
}: EditProductAIGeneratorProps) {
  const { toast } = useToast();
  const [generatingContent, setGeneratingContent] = useState(false);
  const [modifiedUserDescription, setModifiedUserDescription] = useState(userDescription || "");
  
  // Process images
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(mainImageUrl);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(additionalImageUrls || []);

  // Keep description in sync with props
  useEffect(() => {
    setModifiedUserDescription(userDescription || "");
  }, [userDescription]);

  // Main image dropzone
  const onMainImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setMainImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
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

  // Additional images dropzone
  const onAdditionalImagesDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to 3 additional images
    const files = acceptedFiles.slice(0, 3);
    setAdditionalImageFiles(prev => [...prev, ...files].slice(0, 3));
    
    const previews = files.map(file => URL.createObjectURL(file));
    const newPreviews = [...additionalImagePreviews, ...previews].slice(0, 3);
    setAdditionalImagePreviews(newPreviews);
    onAdditionalImagesChange([...additionalImageFiles, ...files].slice(0, 3), newPreviews);
  }, [additionalImagePreviews, additionalImageFiles, onAdditionalImagesChange]);

  const { getRootProps: getAdditionalImagesRootProps, getInputProps: getAdditionalImagesInputProps } = useDropzone({
    onDrop: onAdditionalImagesDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 3
  });

  // Remove an additional image
  const removeAdditionalImage = (index: number) => {
    const newFiles = [...additionalImageFiles];
    newFiles.splice(index, 1);
    setAdditionalImageFiles(newFiles);
    
    const newPreviews = [...additionalImagePreviews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setAdditionalImagePreviews(newPreviews);
    
    onAdditionalImagesChange(newFiles, newPreviews);
  };

  // Handle AI content generation
  const handleGenerateContent = async () => {
    if (!productType || !metalType) {
      toast({
        title: "Missing Information",
        description: "Please select a product type and metal type before generating content.",
        variant: "destructive"
      });
      return;
    }

    // Get the primary gems
    const primaryGems = [
      ...(mainStoneType ? [{
        name: mainStoneType,
        carats: mainStoneWeight ? parseFloat(mainStoneWeight) : undefined
      }] : []),
      ...secondaryStoneTypes.map(stone => ({
        name: stone.name,
        carats: secondaryStoneWeight 
          ? parseFloat(secondaryStoneWeight) / secondaryStoneTypes.length 
          : undefined
      }))
    ];

    // Get image URLs
    const imageUrls = [
      ...(mainImagePreview ? [mainImagePreview] : []),
      ...additionalImagePreviews
    ];

    setGeneratingContent(true);

    try {
      const response = await apiRequest("POST", "/api/generate-content", {
        productType,
        metalType,
        metalWeight: metalWeight ? parseFloat(metalWeight) : undefined,
        primaryGems,
        userDescription: modifiedUserDescription,
        imageUrls
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const content: AIGeneratedContent = await response.json();
      onContentGenerated(content);
      
      toast({
        title: "Content Generated",
        description: "AI has successfully generated content for your product."
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Details for AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Custom Description</label>
              <Textarea
                value={modifiedUserDescription}
                onChange={(e) => setModifiedUserDescription(e.target.value)}
                placeholder="Describe the product in your own words to help the AI generate better content..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide any specific details or style preferences you want to be included in the AI-generated content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Main Product Image</label>
            {mainImagePreview ? (
              <div className="relative w-full h-[300px] rounded-md overflow-hidden border border-input">
                <img
                  src={mainImagePreview}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                  onClick={() => {
                    if (mainImagePreview && !mainImageUrl) URL.revokeObjectURL(mainImagePreview);
                    setMainImagePreview(null);
                    setMainImageFile(null);
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
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground">Recommended size: 1200x1200px</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Images (Up to 3)</label>
            <div className="grid grid-cols-3 gap-4">
              {additionalImagePreviews.map((preview, index) => (
                <div key={index} className="relative w-full h-[120px] rounded-md overflow-hidden border border-input">
                  <img
                    src={preview}
                    alt={`Additional preview ${index + 1}`}
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
              {additionalImagePreviews.length < 3 && (
                <div
                  {...getAdditionalImagesRootProps()}
                  className="border-2 border-dashed border-input rounded-md p-4 text-center hover:border-primary/50 cursor-pointer transition-colors h-[120px] flex flex-col items-center justify-center"
                >
                  <input {...getAdditionalImagesInputProps()} />
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Upload</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click the button below to generate AI content for your product based on the details provided above.
            The AI will create a title, tagline, short description, detailed description, and suggested pricing.
          </p>

          <div className="flex justify-center">
            <Button 
              onClick={handleGenerateContent}
              disabled={generatingContent || !productType || !metalType}
              className="w-full max-w-md"
              size="lg"
            >
              {generatingContent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                "Generate AI Content"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}