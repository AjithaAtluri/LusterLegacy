import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GemSparkle from "@/components/ui/gem-sparkle";
import ReliableProductImage from "@/components/ui/reliable-product-image";
import { formatCurrency } from "@/lib/utils";

// Helper function to generate 5-word titles for products
function getShortProductTitle(product: any): string {
  // For product ID 42, use our manually crafted title
  if (product.id === 42) {
    return "Gold Gemstone Elegance Necklace";
  }
  
  // For all other products, create a 5-word title based on product name, type, and details
  const productType = product.productType || product.category || "";
  const productName = product.name || "";
  
  // Extract key terms from product name and type
  const terms = [...productName.split(/\s+/), ...productType.split(/\s+/)];
  const keywords = terms
    .filter(term => term.length > 2) // Filter out short words
    .filter(term => !["and", "the", "with", "for", "from"].includes(term.toLowerCase())) // Filter common words
    .filter((item, index, self) => self.indexOf(item) === index); // Remove duplicates
  
  // Product-specific titles based on ID
  switch(product.id) {
    case 29: return "Ruby Polki Gold Ornate Set";
    case 32: return "Pearl Ruby Luxe Graceful Elegance";
    case 33: return "Amethyst Crystal Fusion Grace Collection";
    case 39: return "Navaratan Gem Royal Opulence";
    case 40: return "Diamond Gem Radiance Luxury Set";
    case 43: return "Kundan Pearl Polki Heritage Collection";
    case 44: return "Quartz Masterpiece Lavish Beaded Dreams";
    case 45: return "Emerald Natural Exquisite Treasure Collection";
    default: {
      // Create dynamic title from available keywords, aiming for 5 words
      const metalWords = ["Gold", "Silver", "Platinum", "Diamond"];
      const gemWords = ["Ruby", "Emerald", "Sapphire", "Pearl", "Gem", "Crystal", "Stone"];
      const qualityWords = ["Luxury", "Elegant", "Exquisite", "Regal", "Royal", "Classic"];
      
      // Try to include one metal word, one gem word, one quality word, and the product type
      let title = [];
      
      // Try to find a metal word in the product name
      const metalWord = keywords.find(k => metalWords.some(m => k.toLowerCase().includes(m.toLowerCase())));
      if (metalWord) title.push(metalWord);
      
      // Try to find a gem word in the product name
      const gemWord = keywords.find(k => gemWords.some(g => k.toLowerCase().includes(g.toLowerCase())));
      if (gemWord && !title.includes(gemWord)) title.push(gemWord);
      
      // Add the product type if it's a single word and not already included
      if (productType && !title.includes(productType) && !productType.includes(" ")) {
        title.push(productType);
      }
      
      // Add a quality word
      const qualityWord = qualityWords[Math.floor(Math.random() * qualityWords.length)];
      title.push(qualityWord);
      
      // Add the word "Collection" or the product type as the last word
      title.push("Collection");
      
      // Ensure we have exactly 5 words
      while (title.length > 5) {
        title.pop();
      }
      
      // If we have less than 5 words, add words from the product name
      const remainingKeywords = keywords.filter(k => !title.includes(k));
      while (title.length < 5 && remainingKeywords.length > 0) {
        title.push(remainingKeywords.shift());
      }
      
      // If we still have less than 5 words, pad with quality words
      while (title.length < 5) {
        const word = qualityWords[Math.floor(Math.random() * qualityWords.length)];
        if (!title.includes(word)) {
          title.push(word);
        }
      }
      
      return title.slice(0, 5).join(" ");
    }
  }
}

// Interface for product details stored as JSON
interface ProductDetails {
  detailedDescription: string;
  additionalData: {
    tagline: string;
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
  
  // CRITICAL FIX: Always use server-calculated prices WITHOUT fallback
  // This ensures prices are always consistent with the product detail page
  const USD_TO_INR_RATE = 83; // Same rate used server-side
  
  // Logging to debug price discrepancies
  useEffect(() => {
    if (product.id) {
      console.log(`ProductCard ID ${product.id} - Price Data:`, {
        calculatedPriceUSD: product.calculatedPriceUSD,
        calculatedPriceINR: product.calculatedPriceINR,
        basePrice: product.basePrice,
        calculatedLocalUSD: Math.round(product.basePrice / USD_TO_INR_RATE)
      });
    }
  }, [product]);
  
  // CRITICAL FIX: Store server-calculated prices in state to prevent re-renders changing values
  const [calculatedPriceUSD, setCalculatedPriceUSD] = useState<number | null>(null);
  const [calculatedPriceINR, setCalculatedPriceINR] = useState<number | null>(null);
  
  // We no longer update prices from props - always fetch directly from API
  // This ensures consistent pricing across the application
  // The useEffect below will fetch fresh prices directly from the API
  
  // ALWAYS fetch prices directly to ensure consistency, regardless of what props provide
  useEffect(() => {
    if (product.id) {
      // Always fetch latest prices directly from API for each product
      fetch(`/api/direct-product/${product.id}?nocache=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.calculatedPriceUSD) {
            setCalculatedPriceUSD(data.calculatedPriceUSD);
            console.log(`Direct product ${product.id} fresh data:`, {
              id: product.id,
              calculatedPriceUSD: data.calculatedPriceUSD,
              basePrice: data.basePrice
            });
          }
          if (data.calculatedPriceINR) setCalculatedPriceINR(data.calculatedPriceINR);
          
          console.log(`Fetched fresh prices for product ${product.id}:`, {
            USD: data.calculatedPriceUSD,
            INR: data.calculatedPriceINR
          });
        })
        .catch(err => {
          console.error(`Error fetching direct prices for product ${product.id}:`, err);
        });
    }
  }, [product.id]); // Only depend on product.id, not on calculated prices
  
  return (
    <div className="product-card bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300 group flex flex-col h-[620px]">
      <div className="relative h-[400px] overflow-hidden flex-shrink-0 bg-white dark:bg-black dark:bg-opacity-40 bg-opacity-5 flex items-center justify-center p-2">
        {/* Using the reliable product image component for consistent images */}
        <Link href={`/product-detail/${product.id}`}>
          <ReliableProductImage 
            productId={product.id}
            imageUrl={product.imageUrl}
            image_url={product.image_url}
            alt={product.name}
            className="max-w-full max-h-[380px] object-contain group-hover:scale-105 transition duration-500 cursor-pointer"
          />
        </Link>
        
        {/* Gemstone sparkle effect on hover */}
        <GemSparkle />
        
        {/* Status badges positioned at top-right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-primary text-background px-3 py-1 rounded-full">New</Badge>
          )}
          {product.isBestseller && (
            <Badge className="bg-accent text-background px-3 py-1 rounded-full">Bestseller</Badge>
          )}
        </div>
      </div>
      
      {/* Content area with fixed layout */}
      <div className="p-4 flex flex-col justify-between h-[180px]">
        {/* Product type badge - only showing product type, not "featured" */}
        <div className="mb-2">
          {(product.productType || product.category) && (
            <Badge variant="outline" className="capitalize text-xs">
              {product.productType || product.category}
            </Badge>
          )}
        </div>
        
        {/* Product title with simplified 5-word versions for all products */}
        <div className="relative mb-4 py-2">
          {/* Decorative lines before and after title */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-12 h-[1px] bg-primary/40 dark:bg-primary/60"></div>
          <h3 className="font-cormorant text-xl italic font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors duration-300 text-center uppercase px-2 leading-tight">
            {getShortProductTitle(product)}
          </h3>
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-12 h-[1px] bg-primary/40 dark:bg-primary/60"></div>
        </div>
        
        {/* Product Price Display */}
        <div className="text-center mb-3 relative">
          <div className="relative inline-block px-6 py-2">
            {calculatedPriceUSD !== null ? (
              <p className="font-montserrat font-semibold text-lg text-primary">
                {formatCurrency(calculatedPriceUSD || 0, 'USD')}
              </p>
            ) : (
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
            )}
            
            {calculatedPriceINR !== null ? (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(calculatedPriceINR || 0, 'INR')}
              </p>
            ) : (
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mt-1"></div>
            )}
            
            {/* Visual indicator for updated prices */}
            {calculatedPriceUSD !== null && (
              <span className="absolute -top-2 -right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
            <div className="absolute top-0 left-0 h-[1px] w-4 bg-primary/40"></div>
            <div className="absolute top-0 right-0 h-[1px] w-4 bg-primary/40"></div>
            <div className="absolute bottom-0 left-0 h-[1px] w-4 bg-primary/40"></div>
            <div className="absolute bottom-0 right-0 h-[1px] w-4 bg-primary/40"></div>
          </div>
        </div>
        
        {/* Flex spacer to push button to bottom */}
        <div className="flex-grow"></div>
        
        {/* Button always at the bottom */}
        <div>
          <Button 
            asChild
            className="font-montserrat bg-accent hover:bg-accent/90 dark:bg-primary/90 dark:hover:bg-primary text-white w-full py-2 rounded transition duration-300"
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
