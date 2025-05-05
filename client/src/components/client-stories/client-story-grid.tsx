import { useQuery } from "@tanstack/react-query";
import { Testimonial } from "@shared/schema";
import { ClientStoryCard } from "./client-story-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ClientStoryGridProps {
  showEmpty?: boolean;
  emptyMessage?: string;
  stories?: Testimonial[];
  className?: string;
}

export function ClientStoryGrid({
  showEmpty = true,
  emptyMessage = "No stories available.",
  stories: providedStories,
  className,
}: ClientStoryGridProps) {
  // If stories are provided, use them, otherwise fetch from API
  const { data: fetchedStories, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
    queryFn: async () => {
      const response = await fetch("/api/testimonials");
      if (!response.ok) {
        throw new Error("Failed to fetch client stories");
      }
      return response.json();
    },
    // Skip the query if stories are provided
    enabled: !providedStories,
  });

  const stories = providedStories || fetchedStories || [];
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8", className)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-2/5 h-64 md:h-auto">
              <Skeleton className="w-full h-full" />
            </div>
            <div className="p-6 flex flex-col space-y-4 md:w-3/5">
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Empty state
  if (showEmpty && stories.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-gray-500 italic">{emptyMessage}</p>
      </div>
    );
  }
  
  // Content state
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8", className)}>
      {stories.map((story) => (
        <ClientStoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}