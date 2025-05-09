import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaOptionsType } from 'embla-carousel';
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  details?: string;
  calculatedPriceUSD?: number; // Add the calculated price fields
  calculatedPriceINR?: number;
  [key: string]: any; // Allow for other properties
}

export default function FeaturedProducts() {
  // Force refetch on initial render to ensure we have fresh data
  useEffect(() => {
    // Invalidate the featured products cache to ensure we get fresh data
    queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
  }, []);

  // Fetch featured products with refetch enabled
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
    refetchOnMount: true,
    staleTime: 0 // Consider data always stale to force refetch
  });
  
  // Carousel options with autoplay
  const options: EmblaOptionsType = {
    align: 'start',
    loop: true,
    dragFree: false,
    containScroll: 'trimSnaps',
    slidesToScroll: 1
  };
  
  // Embla carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  
  // Carousel navigation state
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  
  // Auto-scroll functionality
  useEffect(() => {
    if (emblaApi) {
      // Set up auto-scrolling
      const autoplayInterval = setInterval(() => {
        if (emblaApi.canScrollNext()) {
          emblaApi.scrollNext();
        } else {
          emblaApi.scrollTo(0); // Loop back to the beginning if at the end
        }
      }, 7000); // Scroll every 7 seconds for a more luxury browsing experience
      
      // Clean up interval
      return () => clearInterval(autoplayInterval);
    }
  }, [emblaApi]);
  
  // Update button states on scroll
  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);
  
  useEffect(() => {
    if (emblaApi) {
      onScroll();
      emblaApi.on('select', onScroll);
      emblaApi.on('reInit', onScroll);
    }
    return () => {
      if (emblaApi) {
        emblaApi.off('select', onScroll);
        emblaApi.off('reInit', onScroll);
      }
    };
  }, [emblaApi, onScroll]);
  
  // Navigation handlers
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  
  // Randomize products order on component mount
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    if (products && products.length > 0) {
      // Create a copy of products and shuffle
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      setShuffledProducts(shuffled);
    }
  }, [products]);
  
  return (
    <section id="collections" className="py-20 px-4 md:px-8 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Signature Collection
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-montserrat text-lg text-foreground/80 max-w-2xl mx-auto">
            Each piece is meticulously handcrafted by our master artisans using only the finest materials.
            Browse our curated designs or customize to make them uniquely yours.
          </p>
        </div>
        
        <div className="relative mb-8">
          {/* Carousel navigation */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-4 z-10 md:-translate-x-6">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 text-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none shadow-md"
              onClick={scrollPrev}
              disabled={prevBtnDisabled}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 z-10 md:translate-x-6">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 text-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none shadow-md"
              onClick={scrollNext}
              disabled={nextBtnDisabled}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Carousel container with larger product cards */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {isLoading ? (
                // Loading skeletons
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="flex-[0_0_100%] sm:flex-[0_0_80%] md:flex-[0_0_45%] lg:flex-[0_0_32%] bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300 min-w-0 h-[700px]">
                    <Skeleton className="h-[400px] w-full" />
                    <div className="p-6">
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="mb-4">
                        <Skeleton className="h-4 w-1/3 mb-1" />
                        <Skeleton className="h-10 w-full mb-3" />
                        <Skeleton className="h-4 w-1/3 mb-1" />
                        <Skeleton className="h-10 w-full mb-3" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <Skeleton className="h-3 w-16 mb-1" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-10 w-24" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Actual products with dynamic ordering
                shuffledProducts.length > 0 ? (
                  shuffledProducts.map((product) => (
                    <div key={product.id} className="flex-[0_0_100%] sm:flex-[0_0_80%] md:flex-[0_0_45%] lg:flex-[0_0_32%] min-w-0 px-2">
                      <ProductCard product={product} />
                    </div>
                  ))
                ) : (
                  // Fallback for no data
                  <div className="flex-[0_0_100%] text-center py-8">
                    <p className="text-lg text-muted-foreground">No products available at the moment.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Link 
            href="/collections"
            className="font-montserrat font-medium text-foreground hover:text-primary border-b-2 border-primary pb-1 transition duration-300 inline-flex items-center"
          >
            View Entire Collection <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
