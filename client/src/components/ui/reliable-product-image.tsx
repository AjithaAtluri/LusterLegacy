import { useState, useEffect, useRef, MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReliableProductImageProps {
  productId: number;
  imageUrl?: string;
  image_url?: string; // Add support for snake_case field naming from database
  alt: string;
  className?: string;
  fallbackSrc?: string;
  allowDownload?: boolean; // Added option to explicitly allow downloading
}

// Function to get the image path based on the server structure
const getImagePath = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return "";
  
  // Normalize path to ensure it works for both uploads and attached_assets
  if (imageUrl.startsWith("/uploads/")) {
    return imageUrl; // Already has the correct format
  }
  
  // Add /uploads/ prefix if missing
  if (!imageUrl.startsWith("/")) {
    return `/uploads/${imageUrl}`;
  }
  
  return imageUrl;
};

export default function ReliableProductImage({ 
  productId, 
  imageUrl,
  image_url, // Accept both camelCase and snake_case
  alt, 
  className = "",
  fallbackSrc = "", // Empty default, we'll show a loading state instead
  allowDownload = false // Default to not allowing downloads
}: ReliableProductImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // First try to use the directly provided imageUrl (support both formats)
  useEffect(() => {
    setIsLoading(true);
    const effectiveImageUrl = imageUrl || image_url;
    
    if (effectiveImageUrl) {
      setImageSrc(getImagePath(effectiveImageUrl));
      setIsLoading(false);
      return;
    }
    
    // Only if no image URL is provided, try to fetch product data
    if (!effectiveImageUrl && productId > 0) {
      // Keep the existing API fetching logic as a fallback
      fetchProductImage();
    } else {
      setIsLoading(false);
    }
  }, [imageUrl, image_url, productId]);
  
  // Fetch product image only when necessary
  const fetchProductImage = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const product = await response.json();
        const productImageUrl = product.imageUrl || product.image_url;
        if (productImageUrl) {
          setImageSrc(getImagePath(productImageUrl));
        } else {
          console.error(`No image URL found for product ${productId}`);
          setHasError(true);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch image for product ${productId}:`, error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle image loading errors
  const handleImageError = () => {
    console.error(`Image failed to load for product ID: ${productId}, path: ${imageSrc}`);
    setHasError(true);
  };

  // Handle image load completion
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  // Prevent right click on image
  const handleContextMenu = (e: MouseEvent) => {
    if (!allowDownload) {
      e.preventDefault();
      toast({
        title: "Copyright Protected",
        description: "These images are protected by copyright law. Please contact us to inquire about custom jewelry designs.",
        variant: "default"
      });
      return false;
    }
  };
  
  // Prevent drag and drop
  const handleDragStart = (e: MouseEvent) => {
    if (!allowDownload) {
      e.preventDefault();
      return false;
    }
  };
  
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center w-full h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
        <p className="text-sm text-muted-foreground">Image Loading</p>
      </div>
    );
  }
  
  if (hasError || !imageSrc) {
    return (
      <div className={`flex flex-col items-center justify-center w-full h-full ${className}`}>
        <AlertCircle className="w-8 h-8 text-accent mb-2" />
        <p className="text-sm text-muted-foreground">Image Not Available</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="relative group"
      style={{ userSelect: 'none' }}
    >
      <img 
        src={imageSrc}
        alt={alt}
        className={`${className} ${!allowDownload ? 'select-none pointer-events-none' : ''}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        draggable={allowDownload}
      />
      {!allowDownload && (
        <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
      )}
      {/* Apply watermark only when download is not allowed (typically for non-admin users) */}
      {!allowDownload && (
        <>
          {/* Bottom right corner watermark */}
          <div className="absolute bottom-0 right-0 p-1 text-xs text-slate-50 bg-black/40 opacity-80 rounded-tl-md">
            © lusterlegacy.com
          </div>
          {/* Diagonal watermark across image */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div 
              className="text-slate-50/15 font-medium whitespace-nowrap"
              style={{ fontSize: '1.5rem', transform: 'rotate(-30deg)', letterSpacing: '3px' }}
            >
              lusterlegacy.com
            </div>
          </div>
        </>
      )}
    </div>
  );
}