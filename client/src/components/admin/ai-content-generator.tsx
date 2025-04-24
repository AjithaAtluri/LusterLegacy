import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateProductContent, type AIContentRequest, type AIGeneratedContent } from "@/lib/ai-content-generator";
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

  // Helper function to resize an image and convert to base64 with extreme compression
  const resizeAndConvertToBase64 = async (blob: Blob, maxWidth = 300, maxHeight = 300, quality = 0.4): Promise<string> => {
    console.log(`Processing image: Original size ${(blob.size / 1024).toFixed(2)}KB`);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        console.log(`Original dimensions: ${width}x${height}`);
        
        // Determine target size based on original image size
        let targetWidth = maxWidth;
        let targetHeight = maxHeight;
        let targetQuality = quality;
        
        // More aggressive compression for larger images
        if (blob.size > 1000000) { // 1MB
          targetWidth = 250;
          targetHeight = 250;
          targetQuality = 0.3;
        } else if (blob.size > 500000) { // 500KB
          targetWidth = 300;
          targetHeight = 300;
          targetQuality = 0.4;
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
        
        // Draw image with smoothing for better compression
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // Lower quality for better compression
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with reduced quality
        const base64 = canvas.toDataURL('image/jpeg', targetQuality).split(',')[1];
        
        // If base64 is still too large, reduce quality and size further
        if (base64.length > 60000) { // ~60KB in base64 (extremely conservative)
          console.log(`Base64 still too large: ${(base64.length / 1024).toFixed(2)}KB - applying extreme compression`);
          
          // Resize again on the same canvas with even smaller dimensions
          const smallerWidth = Math.round(width * 0.7);
          const smallerHeight = Math.round(height * 0.7);
          
          canvas.width = smallerWidth;
          canvas.height = smallerHeight;
          
          // Draw again with lower quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'low';
          ctx.drawImage(img, 0, 0, smallerWidth, smallerHeight);
          
          // Use extreme compression
          const extremeQuality = 0.2;
          const extremeBase64 = canvas.toDataURL('image/jpeg', extremeQuality).split(',')[1];
          console.log(`After extreme compression: ${(extremeBase64.length / 1024).toFixed(2)}KB`);
          resolve(extremeBase64);
        } else {
          console.log(`Compressed image size: ${(base64.length / 1024).toFixed(2)}KB`);
          resolve(base64);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };
  
  // Helper function to fetch and convert a blob URL to base64
  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      // Only process blob URLs (created with URL.createObjectURL)
      if (url.startsWith('blob:')) {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Resize the image before converting to base64
        return await resizeAndConvertToBase64(blob);
      } else if (url.startsWith('data:')) {
        // It's already a data URL, extract the base64 part, but convert it to a blob first to resize
        const base64Data = url.split(',')[1];
        const byteString = window.atob(base64Data);
        const mimeType = url.split(',')[0].split(':')[1].split(';')[0];
        
        // Convert base64 to blob
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        
        // Resize the blob and convert back to base64
        return await resizeAndConvertToBase64(blob);
      }
      // Return empty string for URLs we can't process
      return '';
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
              const base64 = await fetchImageAsBase64(imagesToProcess[0]);
              if (base64 && base64.length < 50000) { // ~50KB size limit
                processedImageUrls.push(base64);
                console.log(`Successfully processed image with final size ${(base64.length / 1024).toFixed(2)}KB`);
              } else {
                console.log(`Image too large after compression: ${base64 ? (base64.length / 1024).toFixed(2) + 'KB' : 'failed to process'}`);
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
      
      // More detailed error toast with helpful suggestions
      toast({
        title: "Generation Failed",
        description: error.message?.includes("OpenAI") 
          ? "OpenAI API error. Check your connection and API key." 
          : "Failed to generate content. Verify your inputs are complete and try again.",
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
                      {imageUrls && imageUrls.length > 0 && (
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
                          Using {generatedPreview?.imageInsights ? "1" : "0"} image{generatedPreview?.imageInsights ? "" : "s"} for enhanced descriptions
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
            
            <div className="text-sm space-y-2">
              <p><strong>Product Type:</strong> {productType || "Not specified"}</p>
              <p><strong>Metal Type:</strong> {metalType || "Not specified"}</p>
              <p><strong>Metal Weight:</strong> {metalWeight ? `${metalWeight}g` : "Not specified"}</p>
              <p><strong>Gems:</strong> {primaryGems?.length ? primaryGems.map(gem => 
                `${gem.name}${gem.carats ? ` (${gem.carats} carats)` : ''}`
              ).join(', ') : "None specified"}</p>
              {userDescription && (
                <div>
                  <strong>Your Description:</strong>
                  <p className="mt-1 italic text-muted-foreground">{userDescription}</p>
                </div>
              )}
              {imageUrls?.length ? (
                <div>
                  <strong>Images for Analysis:</strong> {imageUrls.length} image{imageUrls.length > 1 ? 's' : ''} 
                  {imageUrls.length > 1 && (
                    <span className="text-xs ml-1 text-green-600">
                      (Multiple images will provide better accuracy)
                    </span>
                  )}
                  {imageUrls.length > 1 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Note: Due to API size limits, only 1 image can be processed at a time
                    </p>
                  )}
                </div>
              ) : (
                <p><strong>Images:</strong> No images uploaded yet</p>
              )}
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