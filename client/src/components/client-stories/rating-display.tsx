import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  showCount?: boolean;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingDisplay({
  rating,
  showCount = false,
  maxRating = 5,
  size = "md",
  className,
}: RatingDisplayProps) {
  // Size class mapping
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  const starSizeClass = sizeClasses[size];
  
  // Generate array of stars based on rating
  const stars = Array.from({ length: maxRating }, (_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= rating;
    return (
      <Star
        key={index}
        className={cn(
          starSizeClass,
          "transition-colors",
          isFilled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        )}
      />
    );
  });
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">{stars}</div>
      {showCount && (
        <span className={cn(
          "text-muted-foreground ml-1.5",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        )}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}