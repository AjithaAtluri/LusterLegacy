import { Testimonial } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { RatingDisplay } from "./rating-display";
import { Star, Quote } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientStoryCardProps {
  story: Testimonial;
  className?: string;
}

export function ClientStoryCard({ story, className }: ClientStoryCardProps) {
  // Format date to relative time (e.g., "2 months ago")
  const formattedDate = story.createdAt 
    ? formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })
    : "";
  
  return (
    <Card className={cn("h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* User image or initials in a circle */}
            <div className="h-10 w-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-semibold mr-3">
              {story.imageUrls && story.imageUrls.length > 0 ? (
                <img src={story.imageUrls[0]} alt={story.name} className="h-full w-full object-cover" />
              ) : (
                <span>{story.initials}</span>
              )}
            </div>
            
            <div>
              <CardTitle className="text-lg font-semibold">{story.name}</CardTitle>
              {story.location && (
                <CardDescription className="text-sm text-muted-foreground">
                  {story.location}
                </CardDescription>
              )}
            </div>
          </div>
          
          <Quote className="h-6 w-6 text-primary/30" />
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 flex-grow">
        {/* Product type */}
        <div className="text-sm text-muted-foreground mb-2 font-medium">
          <span className="inline-block px-2 py-1 bg-primary/10 rounded-full">
            {story.productType}
          </span>
        </div>
        
        {/* Testimonial text */}
        <p className="text-sm mb-4 line-clamp-4">{story.text}</p>
        
        {/* If there's a longer story, add a link to view the full story */}
        {story.story && story.story.length > 0 && (
          <button
            className="text-xs text-primary hover:underline focus:outline-none"
            onClick={() => {
              // Implementation for expanding the full story could go here
              // For now, we'll just log that it was clicked
              console.log('View full story clicked');
            }}
          >
            Read full story
          </button>
        )}
        
        {/* Images, if any */}
        {story.imageUrls && story.imageUrls.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {story.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${story.name}'s jewelry ${index + 1}`}
                className="h-20 w-20 rounded-md object-cover flex-shrink-0"
              />
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex items-center justify-between border-t">
        <RatingDisplay rating={story.rating} showCount={true} />
        
        <div className="text-xs text-muted-foreground">
          {formattedDate}
        </div>
      </CardFooter>
    </Card>
  );
}