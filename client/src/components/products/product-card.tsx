import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { METAL_TYPES, STONE_TYPES } from "@/lib/constants";
import { usePriceCalculator } from "@/hooks/use-price-calculator";
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
  
  const { 
    metalTypeId, 
    stoneTypeId,
    setMetalTypeId, 
    setStoneTypeId,
    currentPrice 
  } = usePriceCalculator({
    basePrice: product.basePrice,
    initialMetalTypeId: initialMetalType
  });
  
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
          {productStones && productStones.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {productStones.join(', ')}
            </Badge>
          )}
        </div>
        
        <div className="mb-4">
          {/* Customization Options */}
          <div className="mb-3">
            <label className="block font-montserrat text-sm text-foreground/80 mb-1">Metal</label>
            <Select
              value={metalTypeId}
              onValueChange={setMetalTypeId}
            >
              <SelectTrigger className="w-full p-2 border border-foreground/20 rounded font-montserrat text-sm">
                <SelectValue placeholder="Select metal type" />
              </SelectTrigger>
              <SelectContent>
                {METAL_TYPES.map((metal) => (
                  <SelectItem key={metal.id} value={metal.id}>
                    {metal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-3">
            <label className="block font-montserrat text-sm text-foreground/80 mb-1">Stones</label>
            <Select
              value={stoneTypeId}
              onValueChange={setStoneTypeId}
            >
              <SelectTrigger className="w-full p-2 border border-foreground/20 rounded font-montserrat text-sm">
                <SelectValue placeholder="Select stone type" />
              </SelectTrigger>
              <SelectContent>
                {STONE_TYPES.map((stone) => (
                  <SelectItem key={stone.id} value={stone.id}>
                    {stone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-montserrat text-sm text-foreground/70">Starting from</p>
              <p className="font-playfair text-xl font-semibold text-foreground group-hover:animate-gem-glow group-hover:text-amber-600 transition-colors duration-500">
                {formatCurrency(currentPrice)}
              </p>
            </div>
          </div>
        </div>
            
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            asChild
            className="font-montserrat bg-foreground hover:bg-primary text-background px-4 py-2 rounded transition duration-300"
          >
            <Link href={`/product/${product.id}?metal=${metalTypeId}&stone=${stoneTypeId}`}>
              Customize
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline" 
            className="font-montserrat"
          >
            <Link href={`/product-detail/${product.id}`}>
              More Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
