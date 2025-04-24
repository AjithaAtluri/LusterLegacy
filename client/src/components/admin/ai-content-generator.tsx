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
  const { toast } = useToast();

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
      setIsGenerating(true);
      setGenerationError(null);
      
      const request: AIContentRequest = {
        productType,
        metalType,
        metalWeight,
        primaryGems,
        userDescription,
        imageUrls
      };

      const generatedContent = await generateProductContent(request);
      
      // Store the generated content for preview
      setGeneratedPreview(generatedContent);
      setShowPreviewDialog(true);
      
      toast({
        title: "Content Generated",
        description: "AI has successfully generated content for your product!",
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      setGenerationError(error.message || "Failed to generate content");
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again or adjust your inputs.",
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
                <AlertDescription className="flex justify-between items-center">
                  <span>Preview and apply the generated content to your product form.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-green-200 text-green-700 hover:bg-green-100"
                    onClick={() => setShowPreviewDialog(true)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
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
                  {imageUrls.length > 4 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Note: Only the first 4 images will be analyzed due to API limitations
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
            <DialogDescription>
              Review the AI-generated content before applying it to your product form
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