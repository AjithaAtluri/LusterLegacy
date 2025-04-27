import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GemSparkle from "@/components/ui/gem-sparkle";
import ReliableProductImage from "@/components/ui/reliable-product-image";

// Interface for product details stored as JSON
interface ProductDetails {
  detailedDescription: string;
  additionalData: {
    tagline: string;
    basePriceINR: number;
    metalType: string;
    metalWeight: number;
    stoneTypes: string[];
  };
}

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description: string;
    basePrice: number;
    imageUrl?: string;
    image_url?: string;
    isNew?: boolean;
    isBestseller?: boolean;
    isFeatured?: boolean;
    productTypeId?: number;
    productType?: string;
    category?: string; // Legacy field
    details?: string;
    // New calculated price fields returned from API
    calculatedPriceUSD?: number;
    calculatedPriceINR?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [parsedDetails, setParsedDetails] = useState<ProductDetails | null>(null);
  const [tagline, setTagline] = useState<string>("");
  const [productMetalType, setProductMetalType] = useState<string>("");
  const [productStones, setProductStones] = useState<string[]>([]);
  
  // Parse additional details from JSON
  useEffect(() => {
    if (product.details) {
      try {
        const parsed = JSON.parse(product.details) as ProductDetails;
        setParsedDetails(parsed);
        
        if (parsed.additionalData) {
          setTagline(parsed.additionalData.tagline || "");
          setProductMetalType(parsed.additionalData.metalType || "");
          setProductStones(parsed.additionalData.stoneTypes || []);
        }
      } catch (e) {
        console.error("Failed to parse product details JSON:", e);
      }
    }
  }, [product.details]);
  
  // Determine initial metal type from parsed details if available
  const initialMetalType = productMetalType 
    ? productMetalType.toLowerCase().replace(/\s+/g, '-') 
    : undefined;
  
  // Use calculated price if available, or fall back to calculating from base price
  // We'll use 83 as the conversion rate (same as in price-calculator.ts) for fallback
  const USD_TO_INR_RATE = 83;
  
  // Use the calculated price from API if available
  const calculatedPriceUSD = product.calculatedPriceUSD || Math.round(product.basePrice / USD_TO_INR_RATE);
  const calculatedPriceINR = product.calculatedPriceINR || product.basePrice;
  
  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300 group">
      <div className="relative h-80 overflow-hidden">
        {/* Using the reliable product image component for consistent images */}
        <ReliableProductImage 
          productId={product.id}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          fallbackSrc="/uploads/40c3afd0-d8d5-4fa4-87b0-f717a6941660.jpg"
        />
        
        {/* Gemstone sparkle effect on hover */}
        <GemSparkle />
        
        {product.isNew && (
          <Badge className="absolute top-4 right-4 bg-primary text-background px-3 py-1 rounded-full">
            New
          </Badge>
        )}
        
        {product.isBestseller && (
          <Badge className="absolute top-4 right-4 bg-accent text-background px-3 py-1 rounded-full">
            Bestseller
          </Badge>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-playfair text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">{product.name}</h3>
        
        {/* Display tagline if available */}
        {tagline && (
          <p className="font-cormorant text-md italic text-primary mb-2">{tagline}</p>
        )}
        
        <p className="font-cormorant text-lg text-foreground/70 mb-3">{product.description}</p>
        
        {/* Display product type and status badges */}
        <div className="flex flex-wrap gap-1 mb-4">
          {/* Use productType if available, fall back to category for backward compatibility */}
          {(product.productType || product.category) && (
            <Badge variant="outline" className="capitalize text-xs">
              {product.productType || product.category}
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="text-xs">Featured</Badge>
          )}
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-montserrat text-sm text-foreground/70">Price</p>
              <p className="font-playfair text-xl font-semibold text-foreground group-hover:animate-gem-glow group-hover:text-amber-600 transition-colors duration-500">
                ${calculatedPriceUSD}
              </p>
              <p className="font-montserrat text-xs text-muted-foreground">
                ₹{calculatedPriceINR.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
            
        <div className="flex justify-center">
          <Button 
            asChild
            className="font-montserrat bg-foreground hover:bg-primary text-background px-6 py-2 rounded transition duration-300"
          >
            <Link href={`/product-detail/${product.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
