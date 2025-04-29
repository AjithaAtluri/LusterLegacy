import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface ReliableProductImageProps {
  productId: number;
  imageUrl?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
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
  alt, 
  className = "",
  fallbackSrc = "" // Empty default, we'll show a loading state instead
}: ReliableProductImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // First try to use the directly provided imageUrl
  useEffect(() => {
    setIsLoading(true);
    if (imageUrl) {
      setImageSrc(getImagePath(imageUrl));
      setIsLoading(false);
      return;
    }
    
    // Only if imageUrl is not provided directly, try to fetch product data
    if (!imageUrl && productId > 0) {
      // Keep the existing API fetching logic as a fallback
      fetchProductImage();
    } else {
      setIsLoading(false);
    }
  }, [imageUrl, productId]);
  
  // Fetch product image only when necessary
  const fetchProductImage = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/product/${productId}`);
      if (response.ok) {
        const product = await response.json();
        const productImageUrl = product.imageUrl || product.image_url;
        if (productImageUrl) {
          setImageSrc(getImagePath(productImageUrl));
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
        <p className="text-sm text-muted-foreground">Image Not Available</p>
      </div>
    );
  }
  
  return (
    <img 
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}