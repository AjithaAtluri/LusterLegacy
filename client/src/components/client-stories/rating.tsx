import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
}

export function Rating({
  value,
  onChange,
  maxRating = 5,
  size = "md",
  className,
  showValue = true,
}: RatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  // Size class mapping
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  
  const starSizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];
  
  // Generate array of stars based on rating
  const stars = Array.from({ length: maxRating }, (_, index) => {
    const starValue = index + 1;
    const isFilled = (hoverRating || value) >= starValue;
    
    return (
      <Star
        key={index}
        className={cn(
          starSizeClass,
          "cursor-pointer transition-colors duration-150",
          isFilled ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-200"
        )}
        onMouseEnter={() => setHoverRating(starValue)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => onChange(starValue)}
      />
    );
  });
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1">{stars}</div>
      {showValue && value > 0 && (
        <span className={cn("text-muted-foreground", textSizeClass)}>
          ({value.toFixed(1)})
        </span>
      )}
    </div>
  );
}