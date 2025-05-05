import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface ReliableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  fallbackClassName?: string;
}

export function ReliableImage({ 
  src, 
  alt = "", 
  className, 
  fallback, 
  fallbackClassName,
  ...props 
}: ReliableImageProps) {
  const [error, setError] = useState(false);
  
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
  
  // Otherwise, render the image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}

export default ReliableImage;