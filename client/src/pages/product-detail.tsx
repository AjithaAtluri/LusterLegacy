import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShoppingBag, Heart as HeartIcon, Award, Info, Package, Sun, Star, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import GemSparkle from "@/components/ui/gem-sparkle";
import ReliableProductImage from "@/components/ui/reliable-product-image";
import { RelatedProducts } from "@/components/products/related-products";
import { ProductSpecifications } from "@/components/products/product-specifications";
import { SocialShare } from "@/components/products/social-share";

// Extended product details interface
interface ProductDetails {
  detailedDescription: string;
  additionalData: {
    tagline: string;
    basePriceINR: number;
    metalType: string;
    metalWeight: number;
    stoneTypes: string[]; // Legacy field - use single values instead
    mainStoneType?: string;
    mainStoneWeight?: number;
    secondaryStoneType?: string; // Single value for secondary stone
    secondaryStoneWeight?: number;
    otherStoneType?: string; // Single value for other stone
    otherStoneWeight?: number;
    productTypeId?: string;
    userDescription?: string;
    // dimensions field removed as requested
    // Add separate section for AI inputs to ensure they persist
    aiInputs?: {
      metalType?: string;
      metalWeight?: number;
      mainStoneType?: string;
      mainStoneWeight?: number;
      secondaryStoneType?: string; // Standardized to single value
      secondaryStoneWeight?: number;
      otherStoneType?: string; // Added other stone type
      otherStoneWeight?: number;
      userDescription?: string;
    };
  };
}

// Defining the product interface
interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  additionalImages?: string[];
  details?: string;
  // dimensions field removed as requested
  category?: string;
  productType?: string;
  productTypeId?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  // Server-calculated prices
  calculatedPriceUSD?: number;
  calculatedPriceINR?: number;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [parsedDetails, setParsedDetails] = useState<ProductDetails | null>(null);
  const [tagline, setTagline] = useState<string>("");
  const [detailedDescription, setDetailedDescription] = useState<string>("");
  const [productStones, setProductStones] = useState<string[]>([]);
  const [productMetalType, setProductMetalType] = useState<string>("");
  const [productMetalWeight, setProductMetalWeight] = useState<number>(0);
  const [mainStoneType, setMainStoneType] = useState<string>("");
  const [mainStoneWeight, setMainStoneWeight] = useState<number>(0);
  const [secondaryStoneType, setSecondaryStoneType] = useState<string>("");
  const [secondaryStoneTypes, setSecondaryStoneTypes] = useState<string[]>([]);
  const [secondaryStoneWeight, setSecondaryStoneWeight] = useState<number>(0);
  const [otherStoneType, setOtherStoneType] = useState<string>("");
  const [otherStoneWeight, setOtherStoneWeight] = useState<number>(0);
  // dimensions state removed as requested
  const [userDescription, setUserDescription] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [stableLoading, setStableLoading] = useState<boolean>(true);
  
  // Fetch product data with improved error handling
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });
  
  // Fetch related products data (will only run when product.id is available)
  const { data: relatedProductsData } = useQuery<Product[]>({
    queryKey: [`/api/products/${id}/related`],
    enabled: !!id, // Only fetch when id is available
  });
  
  // Stabilize loading state to prevent flickering
  useEffect(() => {
    if (isLoading) {
      setStableLoading(true);
      return;
    }
    
    // Add a delay to prevent flickering when content changes
    const timer = setTimeout(() => {
      setStableLoading(false);
    }, 800); // Match the delay in useAuth hook
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // Update related products state when data is fetched
  useEffect(() => {
    if (relatedProductsData && relatedProductsData.length > 0) {
      console.log("Related products data received:", relatedProductsData);
      setRelatedProducts(relatedProductsData);
    }
  }, [relatedProductsData]);
  
  // Log product data for debugging
  useEffect(() => {
    if (product) {
      console.log("Product data received from API:", product);
      console.log("Image URL from API:", product.imageUrl);
      console.log("Image URL type:", typeof product.imageUrl);
      // Also check for snake_case version
      console.log("Checking image_url property:", (product as any).image_url);
      
      // Log product details for debugging
      console.log("Product details:", product.details);
      
      try {
        if (product.details) {
          const parsed = JSON.parse(product.details);
          console.log("Parsed product details:", parsed);
          
          if (parsed.additionalData) {
            console.log("Metal type:", parsed.additionalData.metalType);
            console.log("Metal weight:", parsed.additionalData.metalWeight);
            console.log("Main stone type:", parsed.additionalData.mainStoneType);
            console.log("Main stone weight:", parsed.additionalData.mainStoneWeight);
            console.log("Secondary stone types:", parsed.additionalData.secondaryStoneTypes);
            console.log("Secondary stone weight:", parsed.additionalData.secondaryStoneWeight);
            
            // Check AI inputs
            if (parsed.additionalData.aiInputs) {
              console.log("AI inputs:", parsed.additionalData.aiInputs);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing product details:", e);
      }
    }
  }, [product]);
  
  // Handle navigation back to collections page
  const handleBackToCollection = () => {
    setLocation('/collections');
  };
  
  // Handle personalization request with authentication check
  const handleCustomizationRequest = () => { // Keeping function name for now to avoid breaking references
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login or sign up to request personalization",
        variant: "default",
      });
      setLocation('/auth');
      return;
    }
    setLocation(`/customize-request/${product?.id}`); // URL path unchanged for compatibility
  };
  
  // Handle place order with authentication check
  const handlePlaceOrder = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login or sign up to place an order",
        variant: "default",
      });
      setLocation('/auth');
      return;
    }
    setLocation(`/finalize-order/${product?.id}`);
  };
  
  useEffect(() => {
    if (product) {
      // Log product image debug information
      const imageUrl = product.imageUrl || (product as any).image_url;
      console.log("Product ID for image mapping:", product.id);
      console.log("Product image URL before processing:", imageUrl);
      console.log("Using ReliableProductImage component with direct product ID");
    }
  }, [product]);
  
  // Try to parse the details JSON
  useEffect(() => {
    if (product?.details) {
      try {
        const parsed = JSON.parse(product.details) as ProductDetails;
        setParsedDetails(parsed);
        console.log("Parsed product details in effect:", parsed);
        
        // Set individual fields from parsed data
        if (parsed.additionalData) {
          console.log("Setting fields from additionalData:", parsed.additionalData);
          // Basic info
          setTagline(parsed.additionalData.tagline || "");
          setProductStones(parsed.additionalData.stoneTypes || []);
          
          // Use AI inputs if available, otherwise fallback to direct properties
          const aiInputs = parsed.additionalData.aiInputs || {};
          console.log("AI inputs:", aiInputs);
          
          // Metal information - Debug the raw values and types
          const rawAiMetal = aiInputs.metalType;
          const rawDirectMetal = parsed.additionalData.metalType;
          console.log("Raw metal type values:", { 
            rawAiMetal, 
            typeOfAiMetal: typeof rawAiMetal,
            rawDirectMetal, 
            typeOfDirectMetal: typeof rawDirectMetal
          });
          
          // Try extracting a valid value, with more fallbacks
          let metalType = "";
          if (typeof rawAiMetal === 'string' && rawAiMetal) {
            console.log("Using AI metal type:", rawAiMetal);
            metalType = rawAiMetal;
          } else if (typeof rawDirectMetal === 'string' && rawDirectMetal) {
            console.log("Using direct metal type:", rawDirectMetal);
            metalType = rawDirectMetal;
          } else {
            // No fallbacks, use empty string if no data is found
            console.log("No metal type found in product data");
            metalType = "";
          }
          
          console.log("Final metal type value:", metalType);
          setProductMetalType(metalType);
          
          // Do the same for metal weight
          // First check for root-level metalWeight field which is the authoritative source
          const rootLevelWeight = parsed.metalWeight;
          // Fall back to AI inputs or additionalData if root level not available
          const rawAiWeight = aiInputs.metalWeight;
          const rawDirectWeight = parsed.additionalData.metalWeight;
          
          console.log("Raw metal weight values:", {
            rootLevelWeight,
            typeOfRootLevel: typeof rootLevelWeight,
            rawAiWeight,
            typeOfAiWeight: typeof rawAiWeight,
            rawDirectWeight,
            typeOfDirectWeight: typeof rawDirectWeight
          });
          
          let metalWeight = 0;
          // First try to use root-level metalWeight (top priority)
          if (rootLevelWeight && !isNaN(parseFloat(rootLevelWeight))) {
            const parsedWeight = parseFloat(rootLevelWeight);
            console.log("Using root-level metal weight:", parsedWeight);
            metalWeight = parsedWeight;
          } else if (typeof rawAiWeight === 'number' && !isNaN(rawAiWeight)) {
            console.log("Using AI metal weight:", rawAiWeight);
            metalWeight = rawAiWeight;
          } else if (typeof rawDirectWeight === 'number' && !isNaN(rawDirectWeight)) {
            console.log("Using direct metal weight:", rawDirectWeight);
            metalWeight = rawDirectWeight;
          } else {
            // No fallbacks, use 0 if no data is found
            console.log("No metal weight found in product data");
            metalWeight = 0;
          }
          
          console.log("Final metal weight value:", metalWeight);
          setProductMetalWeight(metalWeight);
          
          // Stone details
          setMainStoneType(aiInputs.mainStoneType || parsed.additionalData.mainStoneType || "");
          setMainStoneWeight(aiInputs.mainStoneWeight || parsed.additionalData.mainStoneWeight || 0);
          
          // Enhanced debug logging for secondary stone data
          console.log("Secondary stone debug - Raw additionalData:", parsed.additionalData);
          console.log("Secondary stone debug - Raw aiInputs:", aiInputs);
          console.log("Secondary stone debug - additionalData.secondaryStoneType:", parsed.additionalData.secondaryStoneType);
          // Only access the legacy array if it exists (for backward compatibility)
          if ('secondaryStoneTypes' in parsed.additionalData) {
            console.log("Secondary stone debug - additionalData.secondaryStoneTypes (legacy array):", 
              (parsed.additionalData as any).secondaryStoneTypes);
          }
          console.log("Secondary stone debug - aiInputs.secondaryStoneType:", aiInputs.secondaryStoneType);
          
          // Get secondary stone type (single value only)
          const secondaryStone = aiInputs.secondaryStoneType || parsed.additionalData.secondaryStoneType || "";
          console.log("Secondary stone debug - secondaryStone value:", secondaryStone);
          console.log("Secondary stone debug - secondaryStone type:", typeof secondaryStone);
          console.log("Secondary stone debug - Is null or none_selected?", 
                     !secondaryStone || secondaryStone === "none_selected" || secondaryStone === "");
          
          if (secondaryStone && secondaryStone !== "none_selected" && secondaryStone !== "") {
            console.log("Using secondary stone type:", secondaryStone);
            setSecondaryStoneType(secondaryStone);
            // For UI purposes, we still need an array with this single value
            setSecondaryStoneTypes([secondaryStone]);
          } else {
            // No secondary stone
            setSecondaryStoneType("");
            setSecondaryStoneTypes([]);
            console.log("No valid secondary stone found, setting to empty string");
          }
          
          setSecondaryStoneWeight(aiInputs.secondaryStoneWeight || parsed.additionalData.secondaryStoneWeight || 0);
          
          // Process other stone type
          console.log("Other stone debug - additionalData.otherStoneType:", parsed.additionalData.otherStoneType);
          console.log("Other stone debug - aiInputs.otherStoneType:", aiInputs.otherStoneType);
          
          // Get other stone type (single value)
          const otherStone = aiInputs.otherStoneType || parsed.additionalData.otherStoneType || "";
          
          if (otherStone && otherStone !== "none_selected" && otherStone !== "") {
            console.log("Using other stone type:", otherStone);
            setOtherStoneType(otherStone);
          } else {
            setOtherStoneType("");
            console.log("No valid other stone found, setting to empty string");
          }
          
          setOtherStoneWeight(aiInputs.otherStoneWeight || parsed.additionalData.otherStoneWeight || 0);
          
          // Other details
          // dimensions parsing code removed as requested
          setUserDescription(aiInputs.userDescription || parsed.additionalData.userDescription || "");
          
          // Don't need to debug state synchronously as it won't have updated yet
          // We'll see the values in the rendered UI
        }
        
        if (parsed.detailedDescription) {
          setDetailedDescription(parsed.detailedDescription);
        }
      } catch (e) {
        console.error("Failed to parse product details JSON:", e);
        // If parsing fails, use the details field directly
        setDetailedDescription(product.details);
      }
    }
    
    // dimensions handling removed as requested
  }, [product?.details]);
  
  // IMPORTANT: Always use server-calculated price rather than client-side or database-saved values
  // Server applies the proper formula with metal prices, stone costs, and overhead
  const USD_TO_INR_RATE = 83; // Same fallback rate used consistently across the application
  
  // For debugging purposes - log both values to see the difference
  useEffect(() => {
    if (product) {
      console.log("Price values comparison:", {
        "Server calculatedPriceUSD": product.calculatedPriceUSD,
        "Server calculatedPriceINR": product.calculatedPriceINR,
        "Database basePrice": product.basePrice,
        "Database basePrice in USD": product.basePrice ? Math.round(product.basePrice / USD_TO_INR_RATE) : 0
      });
    }
  }, [product]);
  
  // Always prioritize server-calculated values (these come from price-calculator.ts on the server)
  const calculatedPriceUSD = product?.calculatedPriceUSD ?? (product?.basePrice ? Math.round(product.basePrice / USD_TO_INR_RATE) : 0);
  const calculatedPriceINR = product?.calculatedPriceINR ?? product?.basePrice ?? 0;
  
  // Always use the server-calculated USD price for display
  const currentPrice = calculatedPriceUSD;
  
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
  
  // Compile all images if product exists
  const allImages = product ? 
    [
      product.imageUrl || (product as any).image_url, 
      ...((product.additionalImages || (product as any).additional_images) || [])
    ]
      .filter(img => img) // Filter out null/undefined images
    : [];
    
  console.log("All compiled images:", allImages);
  
  return (
    <>
      {!stableLoading && product && (
        <Helmet>
          <title>{product.name} | Luster Legacy</title>
          <meta name="description" content={product.description} />
          
          {/* Open Graph Meta Tags for Facebook and general social sharing */}
          <meta property="og:title" content={`${product.name} | Luster Legacy`} />
          <meta property="og:description" content={product.description} />
          <meta property="og:type" content="product" />
          <meta property="og:url" content={`${window.location.origin}/product-detail/${product.id}`} />
          <meta property="og:image" content={product.imageUrl?.startsWith('http') 
            ? product.imageUrl 
            : `${window.location.origin}${product.imageUrl}`} />
          <meta property="og:site_name" content="Luster Legacy" />
          
          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${product.name} | Luster Legacy`} />
          <meta name="twitter:description" content={product.description} />
          <meta name="twitter:image" content={product.imageUrl?.startsWith('http') 
            ? product.imageUrl 
            : `${window.location.origin}${product.imageUrl}`} />
          
          {/* Additional Product Information */}
          {product.calculatedPriceUSD && (
            <meta property="product:price:amount" content={product.calculatedPriceUSD.toString()} />
          )}
          <meta property="product:price:currency" content="USD" />
        </Helmet>
      )}

      {/* Hero Section with Full-Width Image */}
      {!stableLoading && product && (
        <div className="relative w-full h-[50vh] md:h-[60vh] bg-gradient-to-r from-charcoal to-black overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <ReliableProductImage 
              productId={product.id}
              imageUrl={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="relative h-full flex flex-col justify-center items-center text-center px-4 md:px-8 z-10">
            <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-pearl mb-4 max-w-4xl">
              {product.name}
            </h1>
            {tagline && (
              <p className="font-cormorant text-xl md:text-2xl italic text-pearl mb-6 max-w-2xl">
                {tagline}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Product Details Section */}
      <div className="container mx-auto px-4 md:px-8 py-16">
        {!stableLoading && product ? (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Column: Product Images */}
            <div className="w-full lg:w-1/2">
              {/* Main Image */}
              <div className="mb-6 rounded-xl overflow-hidden shadow-lg bg-card">
                <ReliableProductImage
                  productId={product.id}
                  imageUrl={product.imageUrl}
                  alt={product.name}
                  className="w-full h-auto object-contain aspect-square"
                />
              </div>
              
              {/* Product Details Quick Specs Below Image */}
              <ProductSpecifications
                productMetalType={productMetalType}
                productMetalWeight={productMetalWeight}
                mainStoneType={mainStoneType}
                mainStoneWeight={mainStoneWeight}
                secondaryStoneType={secondaryStoneType}
                secondaryStoneWeight={secondaryStoneWeight}
                otherStoneType={otherStoneType}
                otherStoneWeight={otherStoneWeight}
                currentPrice={currentPrice}
                inrPrice={calculatedPriceINR} // Pass the server-calculated INR price
                formatCurrency={formatCurrency}
                className="mb-6"
              />
              
              {/* Additional Images */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((img, index) => (
                    <div key={index} className="rounded-md overflow-hidden border border-border">
                      <ReliableProductImage
                        productId={0}
                        imageUrl={img}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-auto aspect-square object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right Column: Product Information */}
            <div className="w-full lg:w-1/2">
              <div className="sticky top-24">
                {/* Product Title for Mobile */}
                <div className="block lg:hidden mb-6">
                  <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">
                    {product.name}
                  </h1>
                  {tagline && (
                    <p className="font-cormorant text-xl italic text-foreground/70 mb-4">
                      {tagline}
                    </p>
                  )}
                </div>
                
                {/* Badges */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.isNew && (
                      <Badge variant="default" className="bg-green-600">New Arrival</Badge>
                    )}
                    {product.isBestseller && (
                      <Badge variant="secondary" className="bg-amber-600">Bestseller</Badge>
                    )}
                    <Badge variant="outline" className="font-montserrat">
                      <Award className="h-3 w-3 mr-1" />
                      Handcrafted
                    </Badge>
                  </div>
                  
                  <p className="font-montserrat text-sm text-foreground/80 mb-6">
                    {product.description}
                  </p>
                </div>
                
                {/* Call-To-Action Buttons */}
                <div className="flex flex-col space-y-3 mb-8 w-full">
                  {/* Two main buttons - side by side - hide customization for Beads & Gems */}
                  <div className="flex gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="font-montserrat flex-1"
                      onClick={handlePlaceOrder}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      Request Final Quote
                    </Button>
                    {/* Customization button - hidden for product ID 48 and Beads & Gems products */}
                    {(() => {
                      // Safely get product details if they exist
                      let additionalData: {
                        productTypeId?: string;
                        productType?: string;
                        [key: string]: any;
                      } = {};
                      let productTypeId = "";
                      
                      try {
                        if (product.details) {
                          const productDetails = typeof product.details === 'string' 
                            ? JSON.parse(product.details) 
                            : product.details;
                          
                          additionalData = productDetails.additionalData || {};
                          productTypeId = additionalData.productTypeId || "";
                        }
                      } catch (e) {
                        // Safely handle parsing errors
                        console.error("Error parsing product details:", e);
                      }
                      
                      // Check if product is in the Beads & Gems category
                      const isBeadsAndGems = 
                        product.productType === "Beads & Gems" || 
                        additionalData.productType === "Beads & Gems" ||
                        productTypeId === "19"; // Type ID 19 is Beads & Gems
                      
                      if (isBeadsAndGems) {
                        return false; // Don't show personalization button for Beads & Gems
                      }
                      
                      return true; // Show personalization button for all other products
                    })() && (
                      <Button 
                        variant="default" 
                        className="font-montserrat flex-1 bg-primary text-background hover:bg-primary/90"
                        onClick={handleCustomizationRequest}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Personalize & Get Estimate
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Social Share Component */}
                <div className="mb-6">
                  <SocialShare 
                    productName={product.name}
                    productDescription={product.description}
                    productUrl={`${window.location.origin}/product-detail/${product.id}`}
                    imageUrl={product.imageUrl?.startsWith('http') 
                      ? product.imageUrl 
                      : `${window.location.origin}${product.imageUrl}`}
                  />
                </div>
                
                {/* Product Highlights */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-montserrat font-semibold text-sm">Free Shipping</h3>
                        <p className="font-montserrat text-xs text-foreground/70">For orders over $200</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sun className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-montserrat font-semibold text-sm">Authenticity</h3>
                        <p className="font-montserrat text-xs text-foreground/70">Certified materials</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Product ratings removed as requested */}
                
                {/* Detailed Information Sections */}
                <div className="w-full mt-8 space-y-8">
                  {/* Description Section */}
                  <div className="p-6 bg-card rounded-lg shadow-sm">
                    <h3 className="font-playfair text-lg font-semibold mb-4">Description</h3>
                    <div className="prose prose-sm max-w-none">
                      {detailedDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: detailedDescription.replace(/\n/g, '<br />') }} />
                      ) : (
                        <p className="font-montserrat text-foreground/80">
                          {product.details || "No detailed description available."}
                        </p>
                      )}
                    </div>
                  </div>



                  {/* Design Inspiration Section */}
                  {userDescription && (
                    <div className="p-6 bg-card rounded-lg shadow-sm">
                      <h3 className="font-playfair text-lg font-semibold mb-4">Design Inspiration</h3>
                      <div className="bg-background/50 p-4 rounded-md border border-primary/10">
                        <p className="font-cormorant text-base italic">{userDescription}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <Skeleton className="h-8 w-8 rounded-full" />
            <span className="ml-2">Loading product information...</span>
          </div>
        )}
      </div>
      
      {/* Related products section */}
      {!stableLoading && product && (
        <>
          {/* Check if we have related products to show */}
          {relatedProducts && relatedProducts.length > 0 ? (
            <RelatedProducts 
              products={relatedProducts} 
              currentProductId={product.id} 
            />
          ) : (
            <div className="bg-stone-100 dark:bg-slate-900 py-16">
              <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-6">
                  <h2 className="font-playfair text-3xl font-bold text-foreground mb-3">
                    Explore Our Collection
                  </h2>
                  <div className="w-16 h-1 bg-primary mx-auto"></div>
                </div>
                
                <div className="flex justify-center items-center mb-8">
                  <Button
                    variant="outline"
                    className="font-montserrat"
                    onClick={handleBackToCollection}
                  >
                    View All Collections <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}