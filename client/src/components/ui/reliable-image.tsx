import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface ReliableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  fallbackClassName?: string;
}

// Helper function to normalize image URLs
const normalizeImagePath = (src: string | undefined): string => {
  if (!src) return "";
  
  // If path already has http, leave it as is
  if (src.startsWith("http")) {
    return src;
  }
  
  // Clear any double slashes that might exist
  let normalizedSrc = src.replace(/\/\//g, '/');
  
  // If the path is just a filename (like "abcd1234.jpg"), 
  // add the /uploads/ prefix
  if (!normalizedSrc.includes('/')) {
    return `/uploads/${normalizedSrc}`;
  }
  
  // If path doesn't start with /, add it
  if (!normalizedSrc.startsWith('/')) {
    normalizedSrc = `/${normalizedSrc}`;
  }
  
  // Make sure uploads folder is in the path for image filenames
  if (!normalizedSrc.includes('/uploads/')) {
    // Only add uploads if it looks like a filename path and not a different path
    const lastSegment = normalizedSrc.split('/').pop();
    if (lastSegment && lastSegment.includes('.')) {
      normalizedSrc = `/uploads/${lastSegment}`;
    }
  }
  
  return normalizedSrc;
};

export function ReliableImage({ 
  src, 
  alt = "", 
  className, 
  fallback, 
  fallbackClassName,
  ...props 
}: ReliableImageProps) {
  const [error, setError] = useState(false);
  const [normalizedSrc, setNormalizedSrc] = useState<string>("");
  
  useEffect(() => {
    // Normalize the image path when src changes
    setNormalizedSrc(normalizeImagePath(src));
    // Reset error state when src changes
    setError(false);
  }, [src]);
  
  // Log image loading for debugging purposes
  useEffect(() => {
    if (normalizedSrc) {
      console.log(`Loading image from path: ${normalizedSrc}`);
    }
  }, [normalizedSrc]);
  
  // If there's an error loading the image, show fallback content
  if (error) {
    if (typeof fallback === "string") {
      // If fallback is a string, render it in a div with styling for initials
      return (
        <div 
          className={cn(
            "flex items-center justify-center bg-muted text-foreground font-medium",
            fallbackClassName,
            className
          )}
          {...props}
        >
          {fallback}
        </div>
      );
    } else if (fallback) {
      // If fallback is a React node, render it
      return <>{fallback}</>;
    } else {
      // Default fallback with an image icon
      return (
        <div 
          className={cn(
            "flex items-center justify-center bg-muted",
            className
          )}
          {...props}
        >
          <ImageOff className="h-1/3 w-1/3 text-muted-foreground" />
        </div>
      );
    }
  }
  
  // Otherwise, render the image with the normalized path
  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error(`Failed to load image: ${normalizedSrc}`);
        setError(true);
      }}
      {...props}
    />
  );
}

export default ReliableImage;