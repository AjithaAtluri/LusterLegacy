import { Star, StarHalf } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingDisplay({
  rating,
  showCount = false,
  size = "md"
}: RatingDisplayProps) {
  // Calculate the number of full and half stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  // Star size based on the size prop
  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  const starSize = starSizes[size];
  
  return (
    <div className="flex items-center">
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Star
            key={`star-${index}`}
            className={`${starSize} text-yellow-500 fill-yellow-500`}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <StarHalf
            className={`${starSize} text-yellow-500 fill-yellow-500`}
          />
        )}
        
        {/* Empty stars */}
        {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, index) => (
          <Star
            key={`empty-star-${index}`}
            className={`${starSize} text-yellow-500`}
          />
        ))}
      </div>
      
      {/* Rating count display */}
      {showCount && (
        <span className="ml-2 text-sm text-gray-500">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}