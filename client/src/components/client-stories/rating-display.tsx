import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function RatingDisplay({ 
  rating,
  showCount = false,
  size = "md",
  className
}: RatingDisplayProps) {
  const maxRating = 5;
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {stars.map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground"
            )}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}