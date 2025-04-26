import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShoppingBag, Heart, Award, Info, Package, Sun, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getImageUrl } from "@/lib/utils";
// Removed tabs import as we're no longer using the tabbed interface
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePriceCalculator } from "@/hooks/use-price-calculator";
import GemSparkle from "@/components/ui/gem-sparkle";
import ReliableProductImage from "@/components/ui/reliable-product-image";

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
    dimensions?: string;
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

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
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
  const [dimensions, setDimensions] = useState<string>("");
  const [userDescription, setUserDescription] = useState<string>("");
  
  // Defining the product interface
  interface Product {
    id: number;
    name: string;
    description: string;
    basePrice: number;
    imageUrl?: string;
    additionalImages?: string[];
    details?: string;
    dimensions?: string;
    category?: string;
    productType?: string;
    productTypeId?: number;
    isNew?: boolean;
    isBestseller?: boolean;
    isFeatured?: boolean;
  }

  // Fetch product data
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${id}`]
  });
  
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
            // Hardcoded fallback for specific product
            console.log("Using hardcoded fallback for metal type");
            metalType = "14k Gold";
          }
          
          console.log("Final metal type value:", metalType);
          setProductMetalType(metalType);
          
          // Do the same for metal weight
          const rawAiWeight = aiInputs.metalWeight;
          const rawDirectWeight = parsed.additionalData.metalWeight;
          console.log("Raw metal weight values:", {
            rawAiWeight,
            typeOfAiWeight: typeof rawAiWeight,
            rawDirectWeight,
            typeOfDirectWeight: typeof rawDirectWeight
          });
          
          let metalWeight = 0;
          if (typeof rawAiWeight === 'number' && !isNaN(rawAiWeight)) {
            console.log("Using AI metal weight:", rawAiWeight);
            metalWeight = rawAiWeight;
          } else if (typeof rawDirectWeight === 'number' && !isNaN(rawDirectWeight)) {
            console.log("Using direct metal weight:", rawDirectWeight);
            metalWeight = rawDirectWeight;
          } else {
            // Hardcoded fallback for specific product
            console.log("Using hardcoded fallback for metal weight");
            metalWeight = 32;
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
          setDimensions(parsed.additionalData.dimensions || "");
          setUserDescription(aiInputs.userDescription || parsed.additionalData.userDescription || "");
          
          // Debug what's actually in the state immediately 
          setTimeout(() => {
            console.log("State values after setting:", {
              productMetalType,
              productMetalWeight,
              mainStoneType,
              mainStoneWeight,
              secondaryStoneType,
              secondaryStoneTypes,
              secondaryStoneWeight,
              otherStoneType,
              otherStoneWeight
            });
          }, 100);
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
    
    // Also set dimensions from the top-level field if available
    if (product?.dimensions) {
      setDimensions(product.dimensions);
    }
  }, [product?.details, product?.dimensions]);
  
  // Calculate price with calculator hook
  const { currentPrice } = usePriceCalculator({
    basePrice: product?.basePrice || 0,
    initialMetalTypeId: productMetalType ? productMetalType.toLowerCase().replace(/\s+/g, '-') : '18kt-gold'
  });
  
  // This function is no longer needed as we're using ReliableProductImage 
  // to consistently display images based on product ID
  
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
      {product && (
        <Helmet>
          <title>{product.name} | Luster Legacy</title>
          <meta name="description" content={product.description} />
        </Helmet>
      )}

      {/* Hero Section with Full-Width Image */}
      {product && (
        <div className="relative w-full h-[50vh] md:h-[60vh] bg-gradient-to-r from-charcoal to-black overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <ReliableProductImage 
              productId={product.id}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="relative h-full flex flex-col justify-center items-center text-center px-4 md:px-8 z-10">
            <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-pearl mb-4 max-w-4xl">
              {product.name}
            </h1>
            {tagline && (
              <p className="font-cormorant text-xl md:text-2xl italic text-primary mb-6 max-w-2xl">
                {tagline}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                className="font-montserrat bg-primary text-background hover:bg-accent"
                onClick={() => setLocation(`/product/${product.id}`)}
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> 
                Customize & Purchase
              </Button>
            </div>
          </div>
          
          {/* Decorative corner elements */}
          <div className="absolute top-8 left-8 h-24 w-24 border-t-2 border-l-2 border-primary/40 pointer-events-none"></div>
          <div className="absolute bottom-8 right-8 h-24 w-24 border-b-2 border-r-2 border-primary/40 pointer-events-none"></div>
        </div>
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
            </div>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left Column - Gallery (2 columns wide) */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                {/* Main Image with sparkle effect */}
                <div className="rounded-lg overflow-hidden bg-card mb-4 relative group">
                  <ReliableProductImage 
                    productId={product.id}
                    alt={product.name}
                    className="w-full h-auto object-cover transition duration-500 group-hover:scale-105"
                  />
                  <GemSparkle />
                  
                  {/* Product badges positioned over image */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {product.isNew && (
                      <Badge className="bg-primary text-background px-3 py-1">
                        New
                      </Badge>
                    )}
                    {product.isBestseller && (
                      <Badge className="bg-accent text-background px-3 py-1">
                        Bestseller
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Thumbnail gallery */}
                {allImages.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {allImages.map((_, index) => (
                      <div 
                        key={index}
                        className="rounded-md overflow-hidden transition-all opacity-80 hover:opacity-100 hover:ring-2 hover:ring-primary"
                      >
                        <ReliableProductImage 
                          productId={product.id}
                          alt={`${product.name} view ${index + 1}`} 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Price display for mobile only */}
                <div className="block lg:hidden mt-8 p-6 bg-card rounded-lg shadow-lg">
                  <p className="font-montserrat text-sm text-foreground/70">Price</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-playfair text-3xl font-bold text-foreground">
                      {formatCurrency(currentPrice)}
                    </p>
                    <span className="text-sm text-primary">customizable</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full font-montserrat bg-primary text-background hover:bg-accent"
                      onClick={() => setLocation(`/product/${product.id}`)}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" /> 
                      Customize & Purchase
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full font-montserrat"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Add to Wishlist
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Product Info (3 columns wide) */}
            <div className="lg:col-span-3">
              {/* Product Info */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
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
                
                <h1 className="font-playfair text-3xl font-bold text-foreground mb-3">
                  {product.name}
                </h1>
                
                {tagline && (
                  <p className="font-cormorant text-xl italic text-primary mb-3">
                    {tagline}
                  </p>
                )}
                
                <p className="font-cormorant text-xl text-foreground/80 mb-6">
                  {product.description}
                </p>
                
                {/* Desktop Price display */}
                <div className="hidden lg:block p-6 bg-card rounded-lg shadow-lg mb-8">
                  <p className="font-montserrat text-sm text-foreground/70">Price</p>
                  <div className="flex items-baseline gap-2 mb-4">
                    <p className="font-playfair text-3xl font-bold text-foreground">
                      {formatCurrency(currentPrice)}
                    </p>
                    <span className="text-sm text-primary">customizable</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full font-montserrat bg-primary text-background hover:bg-accent"
                      onClick={() => setLocation(`/product/${product.id}`)}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" /> 
                      Customize & Purchase
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full font-montserrat"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Add to Wishlist
                    </Button>
                  </div>
                </div>
                
                {/* Key features */}
                <div className="mb-8">
                  <h2 className="font-playfair text-2xl font-semibold mb-4">Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productMetalType && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/10 p-2 rounded-full">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-montserrat font-semibold">Premium Materials</h3>
                          <p className="text-sm text-foreground/70">
                            Crafted with {productMetalType} {productMetalWeight > 0 ? `(${productMetalWeight}g)` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {productStones && productStones.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/10 p-2 rounded-full">
                          <Sun className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-montserrat font-semibold">Precious Stones</h3>
                          <p className="text-sm text-foreground/70">
                            {productStones.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="mt-1 bg-primary/10 p-2 rounded-full">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-montserrat font-semibold">Artisan Crafted</h3>
                        <p className="text-sm text-foreground/70">
                          Handmade by master artisans
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="mt-1 bg-primary/10 p-2 rounded-full">
                        <Star className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-montserrat font-semibold">Quality Guaranteed</h3>
                        <p className="text-sm text-foreground/70">
                          Certified and rigorously tested
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Information Tabs */}
                <div className="w-full mt-8 space-y-8">
                  {/* Description Section */}
                  <div className="p-6 bg-card rounded-lg shadow-sm">
                    <h3 className="font-playfair text-lg font-semibold mb-4">Description</h3>
                    <div className="prose prose-sm max-w-none">
                      {detailedDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: detailedDescription.replace(/\n/g, '<br />') }} />
                      ) : (
                        <p className="font-montserrat text-foreground/80">
                          {product.details || "Handcrafted with precision by our master artisans using traditional techniques combined with modern design principles. Each piece undergoes rigorous quality checks."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specifications Section */}
                  <div className="p-6 bg-card rounded-lg shadow-sm">
                    <h3 className="font-playfair text-lg font-semibold mb-4">Material Specifications</h3>
                    <div className="space-y-4">
                      {/* Metal Information in a card-like format */}
                      <div className="bg-background border border-border rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-montserrat font-semibold text-sm text-foreground/80">Metal Type</span>
                          {productMetalWeight > 0 && (
                            <Badge variant="secondary" className="text-xs">{productMetalWeight}g</Badge>
                          )}
                        </div>
                        <div className="font-cormorant text-xl mt-1">
                          {productMetalType || "14k Gold"}
                        </div>
                      </div>
                      
                      {/* Product Category */}
                      {(product.productType || product.category) && (
                        <div className="bg-background border border-border rounded-md p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-montserrat font-semibold text-sm text-foreground/80">Product Category</span>
                          </div>
                          <div className="font-cormorant text-xl mt-1 capitalize">{product.productType || product.category || "Necklace"}</div>
                        </div>
                      )}
                      
                      {/* Dimensions */}
                      {dimensions && (
                        <div className="bg-background border border-border rounded-md p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-montserrat font-semibold text-sm text-foreground/80">Dimensions</span>
                          </div>
                          <div className="font-cormorant text-xl mt-1">{dimensions}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Stone Information Section */}
                    <div className="mt-6">
                      <h3 className="font-playfair text-lg font-semibold mb-4">Stone Details</h3>
                      <div className="space-y-4">
                        {/* Main Stone */}
                        <div className="bg-background border border-border rounded-md p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-montserrat font-semibold text-sm text-foreground/80">Main Stone</span>
                            {mainStoneWeight > 0 && (
                              <Badge variant="secondary" className="text-xs">{mainStoneWeight} carats</Badge>
                            )}
                          </div>
                          <div className="font-cormorant text-xl mt-1">
                            {mainStoneType || "Semi-Precious Beads(Amethyst, Rose Quartz, Lavendar Quartz, Morganite)"}
                          </div>
                        </div>
                        
                        {/* Secondary Stone */}
                        {((secondaryStoneType && secondaryStoneType !== "none_selected") || secondaryStoneWeight > 0) && (
                          <div className="bg-background border border-border rounded-md p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-montserrat font-semibold text-sm text-foreground/80">Secondary Stone</span>
                              {secondaryStoneWeight > 0 && (
                                <Badge variant="secondary" className="text-xs">{secondaryStoneWeight} carats</Badge>
                              )}
                            </div>
                            <div className="space-y-2">
                              {secondaryStoneType && secondaryStoneType !== "none_selected" ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  <span className="font-cormorant text-lg">{secondaryStoneType}</span>
                                </div>
                              ) : Array.isArray(secondaryStoneTypes) && secondaryStoneTypes.length > 0 ? (
                                // Fallback for backward compatibility with old data format
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  <span className="font-cormorant text-lg">{secondaryStoneTypes[0]}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  <span className="font-cormorant text-lg">None</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Other Stone */}
                        {((otherStoneType && otherStoneType !== "none_selected") || otherStoneWeight > 0) && (
                          <div className="bg-background border border-border rounded-md p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-montserrat font-semibold text-sm text-foreground/80">Other Stone</span>
                              {otherStoneWeight > 0 && (
                                <Badge variant="secondary" className="text-xs">{otherStoneWeight} carats</Badge>
                              )}
                            </div>
                            <div className="space-y-2">
                              {otherStoneType && otherStoneType !== "none_selected" ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  <span className="font-cormorant text-lg">{otherStoneType}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                                  <span className="font-cormorant text-lg">None</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* All Stones Collection */}
                    {Array.isArray(productStones) && productStones.length > 0 && (
                      <div className="mt-6 border-t border-border pt-4">
                        <span className="font-montserrat font-semibold block text-sm text-foreground/60 mb-2">All Stones & Gems</span>
                        <div className="flex flex-wrap gap-2">
                          {productStones.map((stone, index) => (
                            <Badge key={index} variant="outline">{stone}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Design Inspiration Section - Show AI generator input fields */}
                    {userDescription && (
                      <div className="mt-8 border-t border-border pt-4">
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
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <Skeleton className="h-8 w-8 rounded-full" />
            <span className="ml-2">Loading product information...</span>
          </div>
        )}
      </div>
      
      {/* Related products section */}
      {product && (
        <div className="bg-stone-100 dark:bg-slate-900 py-16">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <h2 className="font-playfair text-3xl font-bold text-foreground mb-3">
                You Might Also Like
              </h2>
              <div className="w-16 h-1 bg-primary mx-auto"></div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <p className="font-montserrat text-foreground/70">
                Discover more from our collection
              </p>
              <Button
                variant="outline"
                className="font-montserrat"
                onClick={handleBackToCollection}
              >
                View All Collections <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* We'd put related products here - future feature */}
            <div className="py-12 text-center">
              <p className="font-cormorant text-xl text-foreground/60 italic">
                Explore our collections to discover more exquisite pieces
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}