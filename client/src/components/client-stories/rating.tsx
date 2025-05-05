import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Rating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  className
}: RatingProps) {
  // Calculate size based on the prop
  const starSize = size === 'sm' ? 16 : size === 'md' ? 24 : 32;
  
  // Handle clicking on a star
  const handleClick = (rating: number) => {
    if (readOnly) return;
    onChange?.(rating);
  };

  // Determine if a star should be filled
  const isStarFilled = (starPosition: number) => {
    return value >= starPosition;
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-1', 
        readOnly ? 'pointer-events-none' : 'cursor-pointer',
        className
      )}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={starSize}
          onClick={() => handleClick(star)}
          className={cn(
            'transition-all',
            isStarFilled(star) 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300',
            !readOnly && 'hover:scale-110 hover:text-yellow-400'
          )}
        />
      ))}
    </div>
  );
}

export default Rating;