import { useState } from "react";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

export function Rating({ value, onChange, size = "md" }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  // Size variants for stars
  const starSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  const starSize = starSizes[size];
  
  // Handle mouse events
  const handleMouseOver = (index: number) => {
    setHoverValue(index);
  };
  
  const handleMouseLeave = () => {
    setHoverValue(null);
  };
  
  const handleClick = (index: number) => {
    onChange(index);
  };
  
  return (
    <div 
      className="flex space-x-1" 
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        // Determine if the star should be filled
        const filled = (hoverValue !== null ? index <= hoverValue : index <= value);
        
        return (
          <Star
            key={index}
            className={`${starSize} cursor-pointer transition-colors duration-200 ${
              filled ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
            }`}
            onMouseOver={() => handleMouseOver(index)}
            onClick={() => handleClick(index)}
          />
        );
      })}
    </div>
  );
}