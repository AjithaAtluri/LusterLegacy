import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Share2, 
  Download, 
  ZoomIn, 
  Loader2,
  Filter
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { InspirationGalleryItem } from "@shared/schema";

// For component compatibility
type InspirationItem = InspirationGalleryItem;

export default function InspirationGallery() {
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState<InspirationItem | null>(null);
  const [filter, setFilter] = useState<string[]>([]);
  
  // Fetch inspiration gallery items
  const { data: inspirationItems, isLoading } = useQuery<InspirationItem[]>({
    queryKey: ['/api/inspiration'],
  });
  
  // Get unique categories for tabs
  const categories = inspirationItems 
    ? Array.from(new Set(inspirationItems.map(item => item.category)))
    : [];
  
  // Get unique tags for filtering
  const allTags = inspirationItems
    ? Array.from(new Set(inspirationItems.flatMap(item => item.tags)))
    : [];
  
  // Filter items based on selected filters
  const getFilteredItems = (category: string) => {
    if (!inspirationItems) return [];
    
    let filtered = inspirationItems.filter(item => item.category === category);
    
    // Apply tag filters if any are selected
    if (filter.length > 0) {
      filtered = filtered.filter(item => 
        filter.some(tag => item.tags.includes(tag))
      );
    }
    
    return filtered;
  };
  
  // Handle filter changes
  const toggleFilter = (tag: string) => {
    setFilter(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilter([]);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Design Inspiration Gallery | Luster Legacy</title>
        <meta name="description" content="Explore our curated gallery of jewelry design inspiration to help you envision your perfect custom piece." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-10">
          <h1 className="font-playfair text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Design Inspiration Gallery
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our curated collection of jewelry designs to inspire your next custom piece. Browse by category or use the filters to find exactly what you're looking for.
          </p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-muted-foreground">
            {inspirationItems?.length || 0} designs to explore
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {filter.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filter.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[80vh]" : ""}>
              <SheetHeader>
                <SheetTitle>Filter Designs</SheetTitle>
                <SheetDescription>
                  Narrow down designs by style, material, or feature.
                </SheetDescription>
              </SheetHeader>
              
              <ScrollArea className="h-[70vh] mt-6 pr-4">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Filter by Tags</h3>
                    <Separator className="mb-4" />
                    <div className="space-y-3">
                      {allTags.map(tag => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`tag-${tag}`} 
                            checked={filter.includes(tag)}
                            onCheckedChange={() => toggleFilter(tag)}
                          />
                          <label 
                            htmlFor={`tag-${tag}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="mb-8 flex w-full h-auto flex-wrap justify-start md:justify-center bg-transparent">
            {categories.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="capitalize text-sm px-4 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {getFilteredItems(category).map(item => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative w-full aspect-square overflow-hidden group">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedImage(item)}
                        >
                          <ZoomIn className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {item.featured && (
                        <Badge className="absolute top-2 left-2 bg-primary text-white">
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1 truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="capitalize text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <Button variant="ghost" size="sm" className="px-2">
                          <Heart className="h-4 w-4 mr-1" />
                          <span className="sr-only">Like</span>
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="px-2">
                            <Share2 className="h-4 w-4" />
                            <span className="sr-only">Share</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="px-2">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {getFilteredItems(category).length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No designs match your filters</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filter criteria to see more designs.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
            <DialogDescription>
              {selectedImage?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden my-4">
            <img 
              src={selectedImage?.imageUrl} 
              alt={selectedImage?.title} 
              className="w-full h-auto object-contain max-h-[60vh]"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedImage?.tags.map(tag => (
              <Badge key={tag} className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              Add to Favorites
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}