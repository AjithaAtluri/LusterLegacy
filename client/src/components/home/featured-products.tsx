import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from "@/components/ui/button";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  details?: string;
  [key: string]: any; // Allow for other properties
}

export default function FeaturedProducts() {
  // Fetch featured products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });
  
  // Prepare products for display in two rows
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);
  const [firstRow, setFirstRow] = useState<Product[]>([]);
  const [secondRow, setSecondRow] = useState<Product[]>([]);
  
  useEffect(() => {
    if (products && products.length > 0) {
      // Create a copy of products and shuffle them
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      setShuffledProducts(shuffled);
      
      // Split shuffled products into two rows
      const halfway = Math.ceil(shuffled.length / 2);
      setFirstRow(shuffled.slice(0, halfway));
      setSecondRow(shuffled.slice(halfway));
    }
  }, [products]);
  
  // Render a row of products
  const renderProductRow = (rowProducts: Product[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {rowProducts.map((product) => (
        <div key={product.id} className="min-w-0">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
  
  // Render loading skeletons
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array(4).fill(0).map((_, index) => (
        <div key={index} className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300 min-w-0 h-[700px]">
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
      ))}
    </div>
  );
  
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
        
        <div className="space-y-10">
          {isLoading ? (
            // Loading skeletons
            <>
              {renderSkeletons()}
              <div className="mt-6">
                {renderSkeletons()}
              </div>
            </>
          ) : shuffledProducts.length > 0 ? (
            // Products in two rows
            <>
              {firstRow.length > 0 && renderProductRow(firstRow)}
              {secondRow.length > 0 && (
                <div className="mt-8">
                  {renderProductRow(secondRow)}
                </div>
              )}
            </>
          ) : (
            // Fallback for no data
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">No products available at the moment.</p>
            </div>
          )}
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
