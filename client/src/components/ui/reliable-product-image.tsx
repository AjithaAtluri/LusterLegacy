import { useState, useEffect } from "react";

// Hardcoded reliable image mapping that we know works
const PRODUCT_IMAGE_MAPPING: Record<number, string> = {
  23: "/uploads/9cffd119-20ca-461d-be69-fd53a03b177d.jpeg", // Ethereal Elegance
  22: "/uploads/9e0ee12c-3349-41a6-b615-f574b4e71549.jpeg", // Ethereal Navaratan
  21: "/uploads/08eca768-8ea6-4d12-974b-eb7707daca49.jpeg", // Majestic Emerald
  19: "/uploads/08a3cf15-9317-45ac-9968-aa58a5bf2220.jpeg", // Multigem Harmony
  // Default fallback for other products
  0: "/uploads/test_jewelry.jpeg" 
};

interface ReliableProductImageProps {
  productId: number;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export default function ReliableProductImage({ 
  productId, 
  alt, 
  className = "", 
  fallbackSrc = "/uploads/test_jewelry.jpeg" 
}: ReliableProductImageProps) {
  // Start with a reliable image immediately to avoid flicker
  const [imageSrc, setImageSrc] = useState<string>(
    PRODUCT_IMAGE_MAPPING[productId] || 
    PRODUCT_IMAGE_MAPPING[0] || 
    fallbackSrc
  );
  
  const [hasError, setHasError] = useState(false);
  
  // Handle image loading errors by using a reliable fallback
  const handleImageError = () => {
    console.error(`Image failed to load for product ID: ${productId}`);
    
    if (!hasError) {
      const fallback = PRODUCT_IMAGE_MAPPING[0] || fallbackSrc;
      console.log(`Using fallback image: ${fallback}`);
      setImageSrc(fallback);
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