import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingDisplay({ 
  rating, 
  showCount = false, 
  size = "sm", 
  className 
}: RatingDisplayProps) {
  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  const starSize = starSizes[size];
  
  return (
    <div className={cn("flex items-center", className)}>
      {showCount && (
        <span className="text-sm mr-1 font-medium">{rating}/5</span>
      )}
      
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starSize,
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300",
              star === 1 ? "" : "ml-0.5"
            )}
          />
        ))}
      </div>
    </div>
  );
}