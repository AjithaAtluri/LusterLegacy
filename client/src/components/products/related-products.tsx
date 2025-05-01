import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ReliableProductImage from "@/components/ui/reliable-product-image";

// Define the Product interface for related products
interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  category?: string;
  calculatedPriceUSD?: number;
  calculatedPriceINR?: number;
}

interface RelatedProductsProps {
  products: Product[];
  currentProductId?: number;
}

export function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  // Filter out current product if it's in the list
  const filteredProducts = products.filter(p => p.id !== currentProductId);
  
  // If no related products, don't render anything
  if (filteredProducts.length === 0) {
    return null;
  }
  
  // Create a ref for the container to use in scrolling
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll the container left or right
  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const { current: container } = containerRef;
      const scrollAmount = direction === "left" 
        ? -container.clientWidth * 0.8 
        : container.clientWidth * 0.8;
      
      container.scrollBy({ 
        left: scrollAmount, 
        behavior: "smooth" 
      });
    }
  };
  
  // Extract only the main title (first 5 words) from the product name
  const getShortTitle = (name: string) => {
    const words = name.split(" ");
    return words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
  };
  
  return (
    <section className="mt-16 mb-16 relative">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-2xl md:text-3xl text-foreground">
            You Might Also Like
          </h2>
          
          {/* Navigation buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => scroll("left")}
              className="rounded-full hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => scroll("right")}
              className="rounded-full hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide gap-6 pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="min-w-[280px] max-w-[280px] flex flex-col relative h-[420px]"
            >
              <div className="block relative h-[280px] overflow-hidden rounded-lg transition-all duration-200 hover:shadow-lg mb-4 group cursor-pointer" onClick={() => window.location.href = `/product-detail/${product.id}`}>
                <ReliableProductImage 
                  productId={product.id} 
                  imageUrl={product.imageUrl}
                  alt={product.name || "Product image"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              
              <div className="flex flex-col justify-between flex-grow text-center">
                {/* Product Name with Luxury Styling */}
                <div className="relative mb-4 flex items-center justify-center h-16">
                  <div className="h-px w-10 bg-accent/50 absolute top-1/2 left-0 ml-3 -translate-y-1/2" />
                  <h3 className={cn(
                    "font-cormorant font-medium italic tracking-wide uppercase",
                    "text-lg leading-tight px-4 mx-auto max-w-[220px]"
                  )}>
                    {getShortTitle(product.name)}
                  </h3>
                  <div className="h-px w-10 bg-accent/50 absolute top-1/2 right-0 mr-3 -translate-y-1/2" />
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full border-accent text-accent hover:bg-accent hover:text-white mt-auto"
                  onClick={() => window.location.href = `/product-detail/${product.id}`}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Gradient fades to indicate more content */}
      <div className="absolute left-0 top-1/3 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-1/3 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </section>
  );
}