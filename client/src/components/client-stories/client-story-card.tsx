import { Testimonial } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { RatingDisplay } from "./rating-display";

interface ClientStoryCardProps {
  story: Testimonial;
}

export function ClientStoryCard({ story }: ClientStoryCardProps) {
  const { customerName, location, productType, story: content, imageUrls, rating, purchaseDate } = story;
  
  // Use the first image if available
  const imageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;
  
  // Format date
  const formattedDate = purchaseDate ? formatDate(new Date(purchaseDate)) : null;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Image section */}
        {imageUrl ? (
          <div className="w-full md:w-2/5 h-64 md:h-auto relative">
            <img 
              src={imageUrl} 
              alt={`${customerName}'s ${productType}`} 
              className="w-full h-full object-cover object-center" 
            />
          </div>
        ) : (
          <div className="w-full md:w-2/5 h-64 md:h-auto bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500 italic px-6 text-center">No image available</p>
          </div>
        )}
        
        {/* Content section */}
        <CardContent className="flex-1 p-6">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{customerName}</h3>
                {location && (
                  <p className="text-sm text-gray-500">{location}</p>
                )}
              </div>
              {rating && <RatingDisplay rating={rating} />}
            </div>
            
            {/* Product type badge */}
            {productType && (
              <div className="mb-4">
                <span className="inline-block bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                  {productType}
                </span>
              </div>
            )}
            
            {/* Story content */}
            <p className="text-gray-700 flex-grow mb-4">{content}</p>
            
            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              {formattedDate && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Purchase Date:</span> {formattedDate}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}