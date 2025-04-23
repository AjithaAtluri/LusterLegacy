import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import ProductCustomizer from "@/components/products/product-customizer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Product() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  
  // Parse URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const initialMetalTypeId = searchParams.get('metal') || '18kt-gold';
  const initialStoneTypeId = searchParams.get('stone') || 'natural-polki';
  
  // Fetch product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${id}`],
  });
  
  // Handle navigation back to collections page
  const handleBackToCollection = () => {
    setLocation('/collections');
  };
  
  // If product not found
  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-16 text-center">
        <h1 className="font-playfair text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
        <p className="font-montserrat text-foreground/70 mb-8">
          We couldn't find the product you're looking for. It may have been removed or the URL might be incorrect.
        </p>
        <Button 
          onClick={handleBackToCollection}
          className="font-montserrat"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Button>
      </div>
    );
  }
  
  return (
    <>
      {product && (
        <Helmet>
          <title>{product.name} | Luster Legacy</title>
          <meta name="description" content={product.description} />
        </Helmet>
      )}
      
      <div className="container mx-auto px-4 md:px-8 py-12">
        <Button 
          variant="ghost" 
          onClick={handleBackToCollection}
          className="mb-8 font-montserrat"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collections
        </Button>
        
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <Skeleton className="rounded-lg h-[500px] w-full mb-4" />
              <div className="grid grid-cols-5 gap-2">
                {Array(5).fill(0).map((_, index) => (
                  <Skeleton key={index} className="rounded-md h-20 w-full" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-10 w-2/3 mb-2" />
              <Skeleton className="h-6 w-full mb-8" />
              <Skeleton className="h-[300px] w-full mb-8" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : product ? (
          <ProductCustomizer 
            product={product} 
            initialMetalTypeId={initialMetalTypeId}
            initialStoneTypeId={initialStoneTypeId}
          />
        ) : (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
      </div>
    </>
  );
}
