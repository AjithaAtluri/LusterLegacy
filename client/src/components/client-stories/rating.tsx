import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Rating({ value, onChange, size = "md", className }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const starSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  
  const starSize = starSizes[size];
  const displayValue = hoverValue !== null ? hoverValue : value;
  
  return (
    <div 
      className={cn("flex", className)}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            "cursor-pointer transition-all",
            star <= displayValue
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground",
            star === 1 ? "" : "ml-1"
          )}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
        />
      ))}
    </div>
  );
}