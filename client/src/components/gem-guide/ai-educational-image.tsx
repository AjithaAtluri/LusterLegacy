import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Educational image URLs for all topics
const preGeneratedImages: Record<string, string> = {
  // Gemstone types
  "natural-gemstones": "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=1024",
  "lab-created-gems": "https://images.unsplash.com/photo-1582307811683-75b18a59e255?auto=format&fit=crop&q=80&w=1024",
  "onyx-gems": "https://images.unsplash.com/photo-1619119069152-a2b331eb392a?auto=format&fit=crop&q=80&w=1024",
  "ruby": "https://images.unsplash.com/photo-1685347964997-f5a3cc0bfe5b?auto=format&fit=crop&q=80&w=1024",
  "sapphire": "https://images.unsplash.com/photo-1616255225760-7638aaed1c11?auto=format&fit=crop&q=80&w=1024",
  "emerald": "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=1024",
  "diamond": "https://images.unsplash.com/photo-1586864089358-991adab8e546?auto=format&fit=crop&q=80&w=1024",

  // Stone forms
  "cabochons": "https://images.unsplash.com/photo-1611425143678-08fc480cafde?auto=format&fit=crop&q=80&w=1024",
  "faceted": "https://images.unsplash.com/photo-1546697935-a0221fcf7e7c?auto=format&fit=crop&q=80&w=1024",
  "crystals": "https://images.unsplash.com/photo-1598747573891-1c6158d86ba3?auto=format&fit=crop&q=80&w=1024",
  "carved": "https://images.unsplash.com/photo-1530116114-098bc2fbc01c?auto=format&fit=crop&q=80&w=1024",
  "beads": "https://images.unsplash.com/photo-1527243154091-420d01d02fda?auto=format&fit=crop&q=80&w=1024",
  
  // Metal categories
  "gold": "https://images.unsplash.com/photo-1624365165689-b58802ddb79f?auto=format&fit=crop&q=80&w=1024",
  "platinum": "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=1024",
  "silver": "https://images.unsplash.com/photo-1627469189271-2efc91b8af5b?auto=format&fit=crop&q=80&w=1024",
  "yellow-gold": "https://images.unsplash.com/photo-1624365165689-b58802ddb79f?auto=format&fit=crop&q=80&w=1024",
  "rose-gold": "https://images.unsplash.com/photo-1573407947625-124549a711af?auto=format&fit=crop&q=80&w=1024",
  "white-gold": "https://images.unsplash.com/photo-1589735247658-19a1b39fcd0a?auto=format&fit=crop&q=80&w=1024",
  
  // Craftsmanship
  "filigree": "https://images.unsplash.com/photo-1602173957644-acb0276f027b?auto=format&fit=crop&q=80&w=1024",
  "setting": "https://images.unsplash.com/photo-1586170526385-40222a2147de?auto=format&fit=crop&q=80&w=1024",
  "craftsmanship": "https://images.unsplash.com/photo-1586170526385-40222a2147de?auto=format&fit=crop&q=80&w=1024",
  "enamel": "https://images.unsplash.com/photo-1608613304040-db57f9c14baf?auto=format&fit=crop&q=80&w=1024",
  "techniques": "https://images.unsplash.com/photo-1586170526385-40222a2147de?auto=format&fit=crop&q=80&w=1024",
  
  // Generic jewelry
  "hero": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1024",
  "jewelry": "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&q=80&w=1024",
  "luxury": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1024",
  "default": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1024"
};

// Topics to keywords mapping for better matching
const topicKeywords: Record<string, string[]> = {
  "natural-gemstones": ["natural", "genuine", "real", "mined", "earth"],
  "lab-created-gems": ["lab", "synthetic", "created", "grown", "man-made", "laboratory"],
  "onyx-gems": ["onyx", "black", "dark", "opaque"],
  "ruby": ["ruby", "red", "corundum", "pigeon blood"],
  "sapphire": ["sapphire", "blue", "corundum"],
  "emerald": ["emerald", "green", "beryl"],
  "diamond": ["diamond", "brilliant", "clarity", "carat"],
  "cabochons": ["cabochon", "domed", "smooth", "polished", "rounded"],
  "faceted": ["facet", "faceted", "cut", "brilliant", "step"],
  "crystals": ["crystal", "raw", "rough", "natural", "formation"],
  "carved": ["carved", "carving", "sculpture", "engraved", "relief"],
  "gold": ["gold", "karat", "yellow", "rose", "white gold", "alloy"],
  "platinum": ["platinum", "white", "noble metal", "dense"],
  "silver": ["silver", "sterling", "925", "tarnish", "white metal"],
  "filigree": ["filigree", "wire", "delicate", "intricate", "lace"],
  "setting": ["setting", "prong", "bezel", "pave", "channel", "mount"]
};

// Function to find the best matching pre-generated image for a topic
function findMatchingImage(topic: string): string {
  if (!topic) return preGeneratedImages.default;
  
  // Normalize the topic
  const normalizedTopic = topic.toLowerCase().trim();
  
  // Direct match to keys in preGeneratedImages
  for (const [key, url] of Object.entries(preGeneratedImages)) {
    if (normalizedTopic === key || normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
      return url;
    }
  }
  
  // Check against keywords mapping for better topic matching
  for (const [key, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => normalizedTopic.includes(keyword))) {
      // If we have a keyword match and the matching category exists in preGeneratedImages
      if (preGeneratedImages[key]) {
        return preGeneratedImages[key];
      }
    }
  }
  
  // Category-based matching as fallback
  if (/gem|stone|ruby|sapphire|emerald|diamond|onyx|amethyst|jade/i.test(normalizedTopic)) {
    return preGeneratedImages["natural-gemstones"];
  } else if (/gold|karat|rose|yellow|white gold/i.test(normalizedTopic)) {
    return preGeneratedImages["gold"];
  } else if (/platinum|white metal/i.test(normalizedTopic)) {
    return preGeneratedImages["platinum"];
  } else if (/silver|sterling/i.test(normalizedTopic)) {
    return preGeneratedImages["silver"];
  } else if (/craft|technique|artisan|handmade/i.test(normalizedTopic)) {
    return preGeneratedImages["craftsmanship"];
  }
  
  // Default fallback
  return preGeneratedImages.default;
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