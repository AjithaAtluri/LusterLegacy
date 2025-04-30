import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIEducationalImageProps {
  topic: string;
  altText: string;
  className?: string;
  height?: string;
  onImageLoaded?: (url: string) => void;
}

const AIEducationalImage: React.FC<AIEducationalImageProps> = ({
  topic,
  altText,
  className = "w-full h-full object-cover",
  height = "h-64",
  onImageLoaded
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const generateImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest("POST", "/api/ai/generate-educational-images", {
          topic
        });
        
        if (!response.ok) {
          throw new Error(`Failed to generate image: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.url) {
          setImageUrl(data.url);
          if (onImageLoaded) {
            onImageLoaded(data.url);
          }
        } else {
          throw new Error("No image URL returned from server");
        }
      } catch (err: any) {
        console.error("Error generating educational image:", err);
        setError(err.message || "Failed to generate image");
        toast({
          title: "Image Generation Failed",
          description: "Could not generate educational image. Using placeholder instead.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    // Generate image when component mounts
    generateImage();
  }, [topic, onImageLoaded, toast]);

  // Placeholder UI for loading state
  if (loading) {
    return (
      <div className={`${height} flex items-center justify-center bg-muted rounded-md`}>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating educational image...</p>
        </div>
      </div>
    );
  }

  // Error state with reload button
  if (error) {
    return (
      <div className={`${height} flex flex-col items-center justify-center bg-muted/50 rounded-md border border-border`}>
        <p className="text-muted-foreground mb-2">Image Loading</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()} 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Successful image load
  return (
    <img
      src={imageUrl || ""}
      alt={altText}
      className={className}
    />
  );
};

export default AIEducationalImage;