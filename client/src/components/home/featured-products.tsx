import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedProducts() {
  // Fetch featured products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products/featured'],
  });
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
                <Skeleton className="h-80 w-full" />
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
            // Actual products
            products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            )) || (
              // Fallback for no data
              <div className="col-span-full text-center py-8">
                <p className="text-lg text-muted-foreground">No products available at the moment.</p>
              </div>
            )
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
