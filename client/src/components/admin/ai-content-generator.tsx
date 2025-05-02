import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateProductContent } from "@/lib/ai-content-generator";
import { AIContentRequest, AIGeneratedContent } from "@/types/store-types";
import { AlertCircle, AlertTriangle, Check, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIContentGeneratorProps {
  productType: string;
  metalType: string;
  metalWeight?: number;
  primaryGems?: Array<{ name: string; carats?: number }>;
  userDescription?: string;
  imageUrls?: string[];
  onContentGenerated: (content: AIGeneratedContent) => void;
}

export default function AIContentGenerator({
  productType,
  metalType,
  metalWeight,
  primaryGems,
  userDescription,
  imageUrls,
  onContentGenerated
}: AIContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<AIGeneratedContent | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [generationTime, setGenerationTime] = useState<string | null>(null);
  const [regenerateCount, setRegenerateCount] = useState(0);
  const { toast } = useToast();

  // Improved helper function to resize an image and convert to base64 with optimized compression
  const resizeAndConvertToBase64 = async (blob: Blob, maxWidth = 512, maxHeight = 512, quality = 0.7): Promise<string> => {
    console.log(`Processing image: Original size ${(blob.size / 1024).toFixed(2)}KB`);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        console.log(`Original dimensions: ${width}x${height}`);
        
        // Determine target size based on original image size
        // OpenAI's Vision API works well with images 512-1024px, so we target that range
        let targetWidth = maxWidth;
        let targetHeight = maxHeight;
        let targetQuality = quality;
        
        // We're being less aggressive with compression because GPT-4o can handle larger images
        // But still compress large images more
        if (blob.size > 2000000) { // 2MB
          targetWidth = 512;
          targetHeight = 512;
          targetQuality = 0.6;
        } else if (blob.size > 1000000) { // 1MB
          targetWidth = 768;
          targetHeight = 768;
          targetQuality = 0.7;
        } else if (blob.size > 500000) { // 500KB
          targetWidth = 1024;
          targetHeight = 1024;
          targetQuality = 0.8;
        }
        
        // Apply resize logic
        const aspectRatio = width / height;
        if (width > height) {
          width = targetWidth;
          height = Math.round(width / aspectRatio);
        } else {
          height = targetHeight;
          width = Math.round(height * aspectRatio);
        }
        
        console.log(`Resizing to: ${width}x${height} with quality ${targetQuality}`);
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image with better quality for vision models
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high'; // Better quality for vision models
        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          // Convert to base64 with appropriate quality
          const dataUrl = canvas.toDataURL('image/jpeg', targetQuality);
          
          // Validate data URL format
          if (!dataUrl.startsWith('data:image/jpeg;base64,')) {
            console.error('Invalid data URL format:', dataUrl.substring(0, 30) + '...');
            reject(new Error('Invalid data URL format'));
            return;
          }
          
          const base64 = dataUrl.split(',')[1];
          
          // Verify the base64 data exists
          if (!base64) {
            console.error('Failed to extract base64 data from data URL');
            reject(new Error('Failed to extract base64 data'));
            return;
          }
          
          // Verify the base64 string is valid
          if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
            console.error('Generated base64 contains invalid characters');
            reject(new Error('Invalid base64 characters'));
            return;
          }
        
          // If base64 is still too large, we'll apply more compression but not as extreme as before
          // Maximum size increased to 150KB which is reasonable for vision API
          if (base64.length > 150000) { // ~150KB in base64
            console.log(`Base64 still large: ${(base64.length / 1024).toFixed(2)}KB - applying higher compression`);
            
            // Reduce quality but keep dimensions the same
            const higherCompressionQuality = 0.5;
            const compressedDataUrl = canvas.toDataURL('image/jpeg', higherCompressionQuality);
            const compressedBase64 = compressedDataUrl.split(',')[1];
            
            if (!compressedBase64 || !/^[A-Za-z0-9+/=]+$/.test(compressedBase64)) {
              console.error('Invalid compressed base64 data');
              // Fall back to original base64 if compression fails
              console.log('Using original base64 data since compression failed');
              resolve(base64);
              return;
            }
            
            console.log(`After higher compression: ${(compressedBase64.length / 1024).toFixed(2)}KB`);
            
            // If still too large, resize and compress further
            if (compressedBase64.length > 150000) {
              const smallerWidth = Math.round(width * 0.75);
              const smallerHeight = Math.round(height * 0.75);
              
              canvas.width = smallerWidth;
              canvas.height = smallerHeight;
              
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'medium';
              ctx.drawImage(img, 0, 0, smallerWidth, smallerHeight);
              
              const finalQuality = 0.4;
              const finalDataUrl = canvas.toDataURL('image/jpeg', finalQuality);
              const finalBase64 = finalDataUrl.split(',')[1];
              
              if (!finalBase64 || !/^[A-Za-z0-9+/=]+$/.test(finalBase64)) {
                console.error('Invalid final base64 data');
                // Fall back to compressed base64 if final compression fails
                resolve(compressedBase64);
                return;
              }
              
              console.log(`Final compression: ${(finalBase64.length / 1024).toFixed(2)}KB with ${smallerWidth}x${smallerHeight} at ${finalQuality} quality`);
              resolve(finalBase64);
            } else {
              resolve(compressedBase64);
            }
          } else {
            console.log(`Compressed image size: ${(base64.length / 1024).toFixed(2)}KB - good quality for vision API`);
            resolve(base64);
          }
        } catch (canvasError) {
          console.error('Canvas operation error:', canvasError);
          reject(canvasError);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };
  
  // Enhanced helper function to fetch and convert a blob URL to base64
  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      console.log(`Processing image URL type: ${url.substring(0, 20)}...`);
      
      // Only process blob URLs (created with URL.createObjectURL)
      if (url.startsWith('blob:')) {
        console.log('Processing blob URL');
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log(`Blob fetched successfully: ${(blob.size / 1024).toFixed(2)}KB, type: ${blob.type}`);
        
        // Resize the image before converting to base64
        const base64 = await resizeAndConvertToBase64(blob);
        console.log(`Converted blob to base64: ${(base64.length / 1024).toFixed(2)}KB`);
        return base64;
      } else if (url.startsWith('data:')) {
        console.log('Processing data URL');
        // It's already a data URL, extract the base64 part
        try {
          const base64Data = url.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid data URL format');
          }
          
          // Return base64 directly if it's already valid (using a more conservative approach)
          if (/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
            console.log(`Using existing valid base64 data: ${(base64Data.length / 1024).toFixed(2)}KB`);
            return base64Data;
          }
          
          const mimeType = url.split(',')[0].split(':')[1].split(';')[0];
          console.log(`Image MIME type: ${mimeType}`);
          
          // Convert base64 to blob for processing
          const byteString = atob(base64Data);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          
          const blob = new Blob([ab], { type: mimeType || 'image/jpeg' });
          console.log(`Created blob from data URL: ${(blob.size / 1024).toFixed(2)}KB`);
          
          // Resize the blob and convert back to base64
          return await resizeAndConvertToBase64(blob);
        } catch (dataUrlError) {
          console.error('Error processing data URL:', dataUrlError);
          throw new Error('Failed to process data URL');
        }
      } else {
        console.log(`Unsupported URL format: ${url.substring(0, 10)}...`);
        throw new Error('Unsupported URL format');
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const handleGenerateContent = async () => {
    if (!productType || !metalType) {
      toast({
        title: "Missing Information",
        description: "Please provide at least the product type and metal type.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Track generation stats
      setIsGenerating(true);
      setGenerationError(null);
      setStartTime(Date.now());
      setRegenerateCount(prev => prev + 1);
      
      // Process images - we'll use a fallback approach if we hit size limits
      let processedImageUrls: string[] = [];
      let fallbackToNoImages = false;
      let initialAttempt = true;
      
      if (imageUrls && imageUrls.length > 0) {
        try {
          // First attempt - try with images (limit to 1 image only to be ultra-safe)
          if (initialAttempt) {
            const maxImages = 1;
            const imagesToProcess = imageUrls.slice(0, maxImages);
            
            toast({
              title: "Processing Images",
              description: `Converting ${imagesToProcess.length}${imageUrls.length > maxImages ? ` of ${imageUrls.length}` : ''} images for AI analysis...`,
            });
            
            // Try just the first image
            if (imagesToProcess.length > 0) {
              console.log(`Attempting to process image 1 of ${imageUrls.length}`);
              try {
                const base64 = await fetchImageAsBase64(imagesToProcess[0]);
                
                // More detailed logging
                console.log(`Base64 image result length: ${base64?.length || 0}`);
                console.log(`Is empty: ${!base64 || base64.length === 0}`);
                
                // Verify the base64 string is valid
                if (base64 && base64.length > 0) {
                  // Additional validation - only include valid base64 characters
                  const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64);
                  
                  if (isValidBase64) {
                    console.log(`Successfully processed image with final size ${(base64.length / 1024).toFixed(2)}KB - valid base64: ✓`);
                    processedImageUrls.push(base64);
                  } else {
                    console.error(`Image data contains invalid base64 characters`);
                    fallbackToNoImages = true;
                  }
                } else {
                  console.log(`Failed to process image: ${base64 ? (base64.length / 1024).toFixed(2) + 'KB' : 'empty result'}`);
                  fallbackToNoImages = true;
                }
              } catch (imageError) {
                console.error("Image processing error:", imageError);
                fallbackToNoImages = true;
              }
            }
          }
        } catch (error) {
          console.error("Failed to process images:", error);
          fallbackToNoImages = true;
        }

        // If the first attempt with images failed, try without images
        if (fallbackToNoImages) {
          toast({
            title: "Image Processing Failed",
            description: "Generating content without images due to size constraints.",
            variant: "destructive"
          });
          
          processedImageUrls = []; // Clear any processed images
          console.log("Falling back to no images due to size constraints");
        } else if (processedImageUrls.length > 0) {
          console.log(`Proceeding with ${processedImageUrls.length} processed ${processedImageUrls.length === 1 ? 'image' : 'images'}`);
        }
      }
      
      const request: AIContentRequest = {
        productType,
        metalType,
        metalWeight,
        primaryGems,
        userDescription,
        imageUrls: processedImageUrls
      };

      // Add some analytics info
      const imgCount = processedImageUrls.length || 0;
      const hasPrimaryGems = primaryGems && primaryGems.length > 0;
      const gemNames = hasPrimaryGems ? primaryGems.map(g => g.name).join(', ') : 'none';
      
      console.log(`Generating AI content for: ${productType}, Metal: ${metalType}, Images: ${imgCount}, Gems: ${gemNames}`);
      
      const generatedContent = await generateProductContent(request);
      
      // Calculate and store generation time
      const elapsed = Date.now() - (startTime || Date.now());
      const timeString = (elapsed / 1000).toFixed(1);
      setGenerationTime(timeString);
      
      // Store the generated content for preview
      setGeneratedPreview(generatedContent);
      setShowPreviewDialog(true);
      
      toast({
        title: "Content Generated",
        description: `AI successfully generated content in ${timeString} seconds!`,
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      setGenerationError(error.message || "Failed to generate content");
      
      // More detailed error toast with helpful diagnostic info
      let errorMessage = "Failed to generate content";
      if (error.message) {
        console.log("Detailed AI generation error:", error.message);
        
        if (error.message.includes("OpenAI")) {
          errorMessage = "OpenAI API error. Check your connection and API key.";
        } else if (error.message.includes("rate limit")) {
          errorMessage = "OpenAI rate limit reached. Please try again in a few minutes.";
        } else if (error.message.includes("billing")) {
          errorMessage = "OpenAI billing issue. Please check your account status.";
        } else if (error.message.includes("Required fields")) {
          errorMessage = "Please fill in both Product Type and Metal Type fields.";
        } else {
          // Keep the original error message if we have one
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const applyGeneratedContent = () => {
    if (generatedPreview) {
      onContentGenerated(generatedPreview);
      setShowPreviewDialog(false);
      toast({
        title: "Content Applied",
        description: "The generated content has been applied to your product form.",
        variant: "default"
      });
    }
  };

  return (
    <>
      <Card className={cn(
        "border shadow-md",
        isGenerating ? "border-blue-300 bg-blue-50/30" : 
        generationError ? "border-red-300 bg-red-50/30" : 
        generatedPreview ? "border-green-300 bg-green-50/30" : 
        "border-primary/20"
      )}>
        <CardHeader className={cn(
          "rounded-t-lg", 
          isGenerating ? "bg-blue-50" : 
          generationError ? "bg-red-50" : 
          generatedPreview ? "bg-green-50" : 
          "bg-primary/5"
        )}>
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center">
              <Sparkles className={cn(
                "h-5 w-5 mr-2", 
                isGenerating ? "text-blue-500" : 
                generationError ? "text-red-500" : 
                generatedPreview ? "text-green-500" : 
                "text-primary"
              )} />
              AI Content Generator
            </div>
            
            {generatedPreview && !isGenerating && !generationError && (
              <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Content Ready
              </Badge>
            )}
            
            {isGenerating && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processing
              </Badge>
            )}
            
            {generationError && !isGenerating && (
              <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Generate product descriptions, taglines, and pricing automatically based on your inputs
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            {generationError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Generation Error</AlertTitle>
                <AlertDescription>
                  {generationError}
                </AlertDescription>
              </Alert>
            )}
            
            {generatedPreview && !isGenerating && !generationError && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-500" />
                <AlertTitle>Content Generated Successfully</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-1">
                      <span>Content ready to preview and apply.</span>
                      {generationTime && (
                        <div className="flex items-center text-xs text-green-600">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="mr-1"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          Generated in {generationTime} seconds
                          {regenerateCount > 1 && (
                            <span className="ml-2">
                              • Generation #{regenerateCount}
                            </span>
                          )}
                        </div>
                      )}
                      {generatedPreview?.imageInsights && (
                        <div className="flex items-center text-xs text-green-600">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="12" 
                            height="12" 
                            viewBox="0 0 24 24"
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="mr-1"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          AI vision analysis included for enhanced descriptions
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-green-200 text-green-700 hover:bg-green-100"
                      onClick={() => setShowPreviewDialog(true)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Type <span className="text-red-500">*</span></label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={productType || ""}
                  onChange={(e) => {
                    // We're using a custom event since we can't modify props directly
                    if (typeof window !== 'undefined') {
                      // Update a hidden field that the edit-product page can access
                      const event = new CustomEvent('ai-field-update', {
                        detail: {
                          field: 'productType',
                          value: e.target.value
                        }
                      });
                      document.dispatchEvent(event);
                    }
                  }}
                >
                  <option value="">Select Product Type</option>
                  <option value="necklace">Necklace</option>
                  <option value="earrings">Earrings</option>
                  <option value="ring">Ring</option>
                  <option value="bracelet">Bracelet</option>
                  <option value="pendant">Pendant</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Metal Type <span className="text-red-500">*</span></label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={metalType || ""}
                  onChange={(e) => {
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('ai-field-update', {
                        detail: {
                          field: 'metalType',
                          value: e.target.value
                        }
                      });
                      document.dispatchEvent(event);
                    }
                  }}
                >
                  <option value="">Select Metal Type</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="platinum">Platinum</option>
                  <option value="white gold">White Gold</option>
                  <option value="rose gold">Rose Gold</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Metal Weight (g) <span className="text-xs text-muted-foreground">(optional)</span></label>
                <input 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  type="number"
                  min="0"
                  step="0.1"
                  value={metalWeight || ""}
                  onChange={(e) => {
                    if (typeof window !== 'undefined') {
                      const newValue = e.target.value ? parseFloat(e.target.value) : undefined;
                      const event = new CustomEvent('ai-field-update', {
                        detail: {
                          field: 'metalWeight',
                          value: newValue
                        }
                      });
                      document.dispatchEvent(event);
                    }
                  }}
                  placeholder="Enter weight in grams"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Gems <span className="text-xs text-muted-foreground">(optional)</span></label>
                <div className="px-3 py-2 border rounded-md bg-muted/20 text-sm">
                  {primaryGems?.length ? primaryGems.map(gem => 
                    `${gem.name}${gem.carats ? ` (${gem.carats} carats)` : ''}`
                  ).join(', ') : "None specified"}
                  <div className="text-xs mt-1 text-muted-foreground">(Select gems from the stone types section below)</div>
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Your Description <span className="text-xs text-muted-foreground">(optional)</span></label>
                <textarea 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  value={userDescription || ""}
                  onChange={(e) => {
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('ai-field-update', {
                        detail: {
                          field: 'userDescription',
                          value: e.target.value
                        }
                      });
                      document.dispatchEvent(event);
                    }
                  }}
                  placeholder="Add a custom description if you want the AI to include specific details or features about this product"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Images for Analysis <span className="text-xs text-muted-foreground">(optional)</span></label>
                <div className="px-3 py-2 border rounded-md bg-muted/20 text-sm">
                  {imageUrls?.length ? (
                    <>
                      <p>{imageUrls.length} image{imageUrls.length > 1 ? 's' : ''} uploaded</p>
                      {imageUrls.length > 1 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Note: Due to API size limits, only the first image can be processed. Multiple images are still saved with the product.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No images provided for content generation. Adding an image can help improve the quality of generated content.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className={cn(
          "rounded-b-lg", 
          isGenerating ? "bg-blue-50" : 
          generationError ? "bg-red-50" : 
          generatedPreview ? "bg-green-50" : 
          "bg-primary/5"
        )}>
          <div className="w-full space-y-2">
            <div className="mb-2 text-xs text-center text-muted-foreground">
              <span className="text-red-500">*</span> Required fields. Only Product Type and Metal Type are required.
            </div>
            <Button 
              onClick={handleGenerateContent} 
              disabled={isGenerating || !productType || !metalType}
              className={cn(
                "w-full",
                generatedPreview && !isGenerating && !generationError ? "bg-green-600 hover:bg-green-700" : ""
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : generatedPreview ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate Content
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
            
            {generatedPreview && !isGenerating && (
              <Button 
                variant="outline" 
                className="w-full border-green-500 text-green-700 hover:bg-green-50"
                onClick={applyGeneratedContent}
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Generated Content
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Content Preview</DialogTitle>
            <DialogDescription className="space-y-1">
              <p>Review the AI-generated content before applying it to your product form</p>
              
              {generationTime && (
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  {generationTime && (
                    <span className="flex items-center mr-3">
                      <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Generated in {generationTime}s
                    </span>
                  )}
                  
                  {imageUrls && imageUrls.length > 0 && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      {generatedPreview?.imageInsights ? "1" : "0"} image{generatedPreview?.imageInsights ? "" : "s"} analyzed
                    </span>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {generatedPreview && (
            <div className="space-y-6 py-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="shortDesc">Short Description</TabsTrigger>
                  <TabsTrigger value="detailedDesc">Detailed Description</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  {generatedPreview.imageInsights && (
                    <TabsTrigger value="imageInsights">Image Analysis</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Title</h4>
                      <p className="text-lg font-medium">{generatedPreview.title}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Tagline</h4>
                      <p className="italic">{generatedPreview.tagline}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="shortDesc">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Short Description</h4>
                    <p className="whitespace-pre-line">{generatedPreview.shortDescription}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="detailedDesc">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Detailed Description</h4>
                    <div className="p-4 bg-gray-50 rounded-md text-gray-800 whitespace-pre-line">
                      {generatedPreview.detailedDescription}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pricing">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                      <div>
                        <h4 className="text-sm font-medium">Price (USD)</h4>
                        <p className="text-2xl font-bold">${generatedPreview.priceUSD}</p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-medium">Price (INR)</h4>
                        <p className="text-2xl font-bold">₹{generatedPreview.priceINR}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      * Prices are estimated based on material costs, craftsmanship, and market value
                    </p>
                  </div>
                </TabsContent>
                
                {generatedPreview.imageInsights && (
                  <TabsContent value="imageInsights">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">AI Image Analysis Insights</h4>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                <circle cx="9" cy="9" r="2"></circle>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-medium text-blue-900">Visual Elements Detected</h5>
                              <p className="text-sm text-blue-700 whitespace-pre-line mt-1">{generatedPreview.imageInsights}</p>
                            </div>
                          </div>
                          
                          <div className="text-xs text-blue-600 italic mt-4">
                            These insights show how the AI analyzed your product images to generate more accurate descriptions.
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Cancel</Button>
            <Button onClick={applyGeneratedContent} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Apply Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}