import { Testimonial } from "@shared/schema";
import { ClientStoryCard } from "./client-story-card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClientStoryGridProps {
  stories?: Testimonial[];
  isLoading?: boolean;
  emptyMessage?: string;
  showEmpty?: boolean;
  className?: string;
}

export function ClientStoryGrid({
  stories,
  isLoading = false,
  emptyMessage = "No client stories available",
  showEmpty = false,
  className = "",
}: ClientStoryGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading client stories...</p>
      </div>
    );
  }
  
  // Empty state
  if (!stories || stories.length === 0) {
    if (showEmpty) {
      return (
        <Alert variant="default" className="bg-muted/40 border-muted">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-muted-foreground">
            {emptyMessage}
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }
  
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {stories.map((story) => (
        <ClientStoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}