import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Educational image URLs for all topics
const preGeneratedImages = {
  "hero": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1024",
  "cabochons": "https://images.unsplash.com/photo-1582650956869-6db3e8b8dc61?auto=format&fit=crop&q=80&w=1024",
  "faceted": "https://images.unsplash.com/photo-1613843341936-08f8a2d99abd?auto=format&fit=crop&q=80&w=1024",
  "crystals": "https://images.unsplash.com/photo-1567613221514-rules22a3f24b?auto=format&fit=crop&q=80&w=1024",
  "carved": "https://images.unsplash.com/photo-1610467048178-32ac01923077?auto=format&fit=crop&q=80&w=1024",
  "cabochons-detail": "https://images.unsplash.com/photo-1582650956869-6db3e8b8dc61?auto=format&fit=crop&q=80&w=1024",
  "faceted-detail": "https://images.unsplash.com/photo-1613843341936-08f8a2d99abd?auto=format&fit=crop&q=80&w=1024",
  "beads": "https://images.unsplash.com/photo-1611425143678-08fc480cafde?auto=format&fit=crop&q=80&w=1024",
  "natural": "https://images.unsplash.com/photo-1611425143678-08fc480cafde?auto=format&fit=crop&q=80&w=1024",
  "lab-created": "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=1024",
  "onyx": "https://images.unsplash.com/photo-1594328082970-3ed24f0e131d?auto=format&fit=crop&q=80&w=1024",
  "natural-detail": "https://images.unsplash.com/photo-1611425143678-08fc480cafde?auto=format&fit=crop&q=80&w=1024",
  "lab-created-detail": "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=1024",
  "onyx-detail": "https://images.unsplash.com/photo-1594328082970-3ed24f0e131d?auto=format&fit=crop&q=80&w=1024",
  "synthetic-comparison": "https://images.unsplash.com/photo-1594328082970-3ed24f0e131d?auto=format&fit=crop&q=80&w=1024",
  "gold": "https://images.unsplash.com/photo-1610333280276-e929f9f5f71d?auto=format&fit=crop&q=80&w=1024",
  "platinum": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1024",
  "alloys": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1024",
  "gold-karats": "https://images.unsplash.com/photo-1610333280276-e929f9f5f71d?auto=format&fit=crop&q=80&w=1024",
  "platinum-detail": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1024",
  "silver": "https://images.unsplash.com/photo-1589216532372-1c2a367900d9?auto=format&fit=crop&q=80&w=1024",
  "alternative-metals": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1024",
  "filigree": "https://images.unsplash.com/photo-1619119069152-a2b331eb392a?auto=format&fit=crop&q=80&w=1024",
  "setting": "https://images.unsplash.com/photo-1598171847522-62bcd0c14748?auto=format&fit=crop&q=80&w=1024",
  "enamel": "https://images.unsplash.com/photo-1611087944583-a5ebcc5bc666?auto=format&fit=crop&q=80&w=1024",
  "filigree-detail": "https://images.unsplash.com/photo-1619119069152-a2b331eb392a?auto=format&fit=crop&q=80&w=1024",
  "setting-techniques": "https://images.unsplash.com/photo-1598171847522-62bcd0c14748?auto=format&fit=crop&q=80&w=1024",
  "cloisonne": "https://images.unsplash.com/photo-1611087944583-a5ebcc5bc666?auto=format&fit=crop&q=80&w=1024",
  "modern-techniques": "https://images.unsplash.com/photo-1598171847522-62bcd0c14748?auto=format&fit=crop&q=80&w=1024",
  "default": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1024"
};

// Function to find the best matching pre-generated image for a topic
function findMatchingImage(topic: string): string {
  // First, check if we have an exact key match
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '-');
  
  // Check for direct matches
  if (normalizedTopic in preGeneratedImages) {
    return preGeneratedImages[normalizedTopic];
  }
  
  // Try to find partial matches in the keys
  for (const [key, url] of Object.entries(preGeneratedImages)) {
    if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
      return url;
    }
  }
  
  // Try to match by category keywords
  const gemKeywords = ['gem', 'ruby', 'sapphire', 'emerald', 'diamond', 'stone'];
  const metalKeywords = ['gold', 'silver', 'platinum', 'metal', 'alloy'];
  const craftKeywords = ['filigree', 'setting', 'enamel', 'craft'];
  
  const isGemTopic = gemKeywords.some(keyword => normalizedTopic.includes(keyword));
  const isMetalTopic = metalKeywords.some(keyword => normalizedTopic.includes(keyword));
  const isCraftTopic = craftKeywords.some(keyword => normalizedTopic.includes(keyword));
  
  if (isGemTopic) {
    return preGeneratedImages.natural || preGeneratedImages.default;
  } else if (isMetalTopic) {
    return preGeneratedImages.gold || preGeneratedImages.default;
  } else if (isCraftTopic) {
    return preGeneratedImages.filigree || preGeneratedImages.default;
  }
  
  // Default fallback
  return preGeneratedImages.default || "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1024";
}

interface AIEducationalImageProps {
  topic: string;
  altText: string;
  className?: string;
  height?: string;
  onImageLoaded?: (url: string) => void;
  onClick?: () => void;
}

const AIEducationalImage: React.FC<AIEducationalImageProps> = ({
  topic,
  altText,
  className = "w-full h-full object-cover",
  height = "h-64",
  onImageLoaded,
  onClick
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Use the pre-generated images instead of API calls
    const loadPreGeneratedImage = () => {
      try {
        setLoading(true);
        
        // Find the most appropriate image for this topic
        const url = findMatchingImage(topic);
        
        setImageUrl(url);
        
        if (onImageLoaded) {
          onImageLoaded(url);
        }
      } catch (err) {
        console.error("Error loading educational image:", err);
        toast({
          title: "Image Loading Issue",
          description: "Could not load educational image. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreGeneratedImage();
  }, [topic, onImageLoaded, toast]);

  // Placeholder UI for loading state
  if (loading) {
    return (
      <div className={`${height} flex items-center justify-center bg-muted rounded-md`}>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading educational image...</p>
        </div>
      </div>
    );
  }

  // Successful image load
  return (
    <img
      src={imageUrl || ""}
      alt={altText}
      className={className}
      onClick={onClick}
    />
  );
};

export default AIEducationalImage;