import { Testimonial } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { RatingDisplay } from "./rating-display";
import { Star, Quote, ImageIcon, ExternalLink, ImageOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReliableImage } from "@/components/ui/reliable-image";

interface ClientStoryCardProps {
  story: Testimonial;
  className?: string;
}

export function ClientStoryCard({ story, className }: ClientStoryCardProps) {
  // Format date to relative time (e.g., "2 months ago")
  const formattedDate = story.createdAt 
    ? formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })
    : "";
  
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  
  // Safely handle imageUrls which might be null
  const imageUrls = story.imageUrls || [];
  const hasImages = imageUrls.length > 0;
  
  return (
    <>
      <Card className={cn("h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* User image or initials in a circle */}
              <div className="h-10 w-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-semibold mr-3">
                {hasImages ? (
                  <ReliableImage 
                    src={imageUrls[0]} 
                    alt={story.name}
                    fallback={story.initials} 
                    className="h-full w-full object-cover" 
                  />
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
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={() => setIsStoryDialogOpen(true)}
            >
              Read full story
            </Button>
          )}
          
          {/* Images, if any */}
          {hasImages && (
            <div className="mt-4 flex flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <div 
                  key={index}
                  className="h-20 w-20 rounded-md overflow-hidden border border-muted cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setSelectedImage(url);
                    setIsImageDialogOpen(true);
                  }}
                >
                  <ReliableImage
                    src={url}
                    alt={`${story.name}'s jewelry ${index + 1}`}
                    className="h-full w-full object-cover"
                    fallback={
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-2 flex items-center justify-between border-t">
          <RatingDisplay value={story.rating} showText={true} />
          
          <div className="text-xs text-muted-foreground">
            {formattedDate}
          </div>
        </CardFooter>
      </Card>

      {/* Full Story Dialog */}
      <Dialog open={isStoryDialogOpen} onOpenChange={setIsStoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <span>Story from {story.name}</span>
          </DialogTitle>
          <DialogDescription>
            {story.location && <div className="mb-2">{story.location}</div>}
            <RatingDisplay value={story.rating} showText={true} className="mb-4" />
          </DialogDescription>
          <div className="space-y-4">
            <div className="bg-muted rounded-md p-4 italic text-sm">
              "{story.text}"
            </div>
            <div className="text-sm whitespace-pre-line">
              {story.story}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-3xl flex items-center justify-center">
          <div className="relative max-h-[70vh] overflow-hidden rounded-md">
            <ReliableImage
              src={selectedImage}
              alt={`${story.name}'s jewelry`}
              className="max-h-[70vh] w-auto object-contain"
              fallback={
                <div className="h-40 w-40 flex items-center justify-center bg-muted">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}