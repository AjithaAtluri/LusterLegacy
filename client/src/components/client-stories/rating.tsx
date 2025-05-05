import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Rating({ value, onChange, size = "md", className }: RatingProps) {
  const maxRating = 5;
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center", className)}>
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            "cursor-pointer transition-all",
            sizeClasses[size],
            star <= value
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground"
          )}
          onClick={() => onChange(star)}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />
      ))}
    </div>
  );
}