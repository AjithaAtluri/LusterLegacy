import { useState } from "react";
import { formatDistance } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react";
import { Rating } from "./rating";
import { Testimonial } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ClientStoryCardProps {
  story: Testimonial;
  className?: string;
}

export function ClientStoryCard({ story, className }: ClientStoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasImages = story.imageUrls && story.imageUrls.length > 0;
  
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (story.imageUrls?.length || 1) - 1 : prev - 1
    );
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (story.imageUrls?.length || 1) - 1 ? 0 : prev + 1
    );
  };
  
  const timeAgo = story.createdAt 
    ? formatDistance(new Date(story.createdAt), new Date(), { addSuffix: true })
    : '';
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row",
        className
      )}
    >
      {/* Image Section (if there are images) */}
      {hasImages && (
        <div className="relative w-full md:w-2/5 h-64 md:h-auto">
          <img 
            src={story.imageUrls?.[currentImageIndex]} 
            alt={`${story.name}'s story`}
            className="w-full h-full object-cover"
          />
          
          {/* Image navigation (only show if multiple images) */}
          {(story.imageUrls?.length || 0) > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <Button 
                size="icon"
                variant="ghost"
                className="rounded-full bg-black/30 text-white hover:bg-black/50"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Previous image</span>
              </Button>
              
              <Button 
                size="icon"
                variant="ghost"
                className="rounded-full bg-black/30 text-white hover:bg-black/50"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Next image</span>
              </Button>
            </div>
          )}
          
          {/* Image counter (only show if multiple images) */}
          {(story.imageUrls?.length || 0) > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1} / {story.imageUrls?.length}
            </div>
          )}
        </div>
      )}
      
      {/* Content Section */}
      <div className={cn(
        "p-6 flex flex-col space-y-4",
        hasImages ? "md:w-3/5" : "w-full"
      )}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{story.name}</h3>
            
            {story.location && (
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>{story.location}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <Rating value={story.rating || 5} readOnly size="sm" />
            <div className="text-xs text-gray-400 mt-1">{timeAgo}</div>
          </div>
        </div>
        
        <div className="relative text-gray-600">
          <Quote className="absolute -left-1 -top-1 h-6 w-6 text-gray-200 transform -scale-x-100" />
          <p className="pl-5 pr-5 italic">{story.content}</p>
          <Quote className="absolute -right-1 bottom-0 h-6 w-6 text-gray-200" />
        </div>
        
        {story.productName && (
          <div className="mt-auto pt-2 text-sm text-gray-500">
            <span className="font-medium">Purchased:</span> {story.productName}
          </div>
        )}
      </div>
    </div>
  );
}