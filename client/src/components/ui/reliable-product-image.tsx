import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface ReliableProductImageProps {
  productId: number;
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
  alt, 
  className = "", 
  fallbackSrc = "/uploads/40c3afd0-d8d5-4fa4-87b0-f717a6941660.jpg" 
}: ReliableProductImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [hasError, setHasError] = useState(false);
  
  // If we have a direct product ID, query the product data to get its image
  const { data: product } = useQuery<any>({
    queryKey: ['/api/products', productId],
    enabled: productId > 0
  });
  
  useEffect(() => {
    if (product) {
      const imageUrl = product.imageUrl || (product as any).image_url;
      if (imageUrl) {
        setImageSrc(getImagePath(imageUrl));
      }
    }
  }, [product]);
  
  // Handle image loading errors
  const handleImageError = () => {
    console.error(`Image failed to load for product ID: ${productId}, path: ${imageSrc}`);
    
    if (!hasError) {
      console.log(`Using fallback image: ${fallbackSrc}`);
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  };
  
  return (
    <img 
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
    />
  );
}