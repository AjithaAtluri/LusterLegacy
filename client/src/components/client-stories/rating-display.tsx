import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function RatingDisplay({
  value,
  size = 'sm',
  className,
  showText = false
}: RatingDisplayProps) {
  // Calculate size based on the prop
  const starSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={cn(
              'transition-colors',
              value >= star 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
      
      {showText && (
        <span className="ml-1 text-sm font-medium text-gray-600">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default RatingDisplay;