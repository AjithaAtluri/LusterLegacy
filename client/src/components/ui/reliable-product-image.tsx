import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface ReliableProductImageProps {
  productId: number;
  imageUrl?: string;  // Add direct imageUrl prop
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
  imageUrl,  // Accept imageUrl directly
  alt, 
  className = "", 
  fallbackSrc = "/uploads/40c3afd0-d8d5-4fa4-87b0-f717a6941660.jpg" 
}: ReliableProductImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [hasError, setHasError] = useState(false);
  
  // First try to use the directly provided imageUrl
  useEffect(() => {
    if (imageUrl) {
      setImageSrc(getImagePath(imageUrl));
      return;
    }
    
    // Only if imageUrl is not provided directly, try to fetch product data
    if (!imageUrl && productId > 0) {
      // Keep the existing API fetching logic as a fallback
      fetchProductImage();
    }
  }, [imageUrl, productId]);
  
  // Fetch product image only when necessary
  const fetchProductImage = async () => {
    try {
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
    }
  };
  
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