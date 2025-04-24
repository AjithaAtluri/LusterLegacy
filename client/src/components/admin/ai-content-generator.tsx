import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateProductContent, type AIContentRequest, type AIGeneratedContent } from "@/lib/ai-content-generator";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      
      const request: AIContentRequest = {
        productType,
        metalType,
        metalWeight,
        primaryGems,
        userDescription,
        imageUrls
      };

      const generatedContent = await generateProductContent(request);
      
      // Pass the generated content to the parent component
      onContentGenerated(generatedContent);
      
      toast({
        title: "Content Generated",
        description: "AI has successfully generated content for your product!",
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again or adjust your inputs.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <CardTitle className="flex items-center text-xl">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          AI Content Generator
        </CardTitle>
        <CardDescription>
          Generate product descriptions, taglines, and pricing automatically based on your inputs
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
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
                <strong>Images:</strong> {imageUrls.length} image(s) will be analyzed
              </div>
            ) : (
              <p><strong>Images:</strong> No images uploaded yet</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-primary/5 rounded-b-lg">
        <Button 
          onClick={handleGenerateContent} 
          disabled={isGenerating || !productType || !metalType}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Content...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}