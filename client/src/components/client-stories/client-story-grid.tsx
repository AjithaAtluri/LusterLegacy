import { useQuery } from "@tanstack/react-query";
import { ClientStoryCard } from "./client-story-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Testimonial } from "@shared/schema";

interface ClientStoryGridProps {
  limit?: number;
  columns?: number;
  showEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ClientStoryGrid({
  limit,
  columns = 3,
  showEmpty = true,
  emptyMessage = "No client stories found.",
  className,
}: ClientStoryGridProps) {
  const { data: stories, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
    queryFn: async () => {
      const response = await fetch("/api/testimonials");
      if (!response.ok) {
        throw new Error("Failed to fetch client stories");
      }
      return response.json();
    },
  });

  // Set up grid columns based on the columns prop
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[Math.min(Math.max(columns, 1), 4) as 1 | 2 | 3 | 4];

  // Loading state
  if (isLoading) {
    return (
      <div className={`grid ${gridColsClass} gap-6 ${className || ""}`}>
        {Array(limit || 3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden shadow-md">
              <Skeleton className="h-64 w-full" />
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  // Show empty state if no stories and showEmpty is true
  if ((!stories || stories.length === 0) && showEmpty) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Limit the number of stories if limit is provided
  const displayStories = limit ? stories?.slice(0, limit) : stories;

  return (
    <div className={`grid ${gridColsClass} gap-6 ${className || ""}`}>
      {displayStories?.map((story) => (
        <ClientStoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}