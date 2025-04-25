import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShoppingBag, Heart, Award, Info, Package, Sun, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePriceCalculator } from "@/hooks/use-price-calculator";
import GemSparkle from "@/components/ui/gem-sparkle";

// Helper function to handle image URLs
function getImageUrl(url: string | undefined): string {
  console.log("getImageUrl input:", url);
  
  if (!url) {
    console.log("No image URL provided, returning placeholder");
    return "https://placehold.co/600x400/png?text=No+Image";
  }
  
  // If it's an absolute URL (starts with http/https or //)
  if (url.match(/^(https?:)?\/\//)) {
    console.log("URL is already absolute, returning as is:", url);
    return url;
  }
  
  // If it's a relative URL starting with /
  if (url.startsWith('/')) {
    // Fix double slashes if any
    const cleanUrl = url.replace(/\/+/g, '/');
    console.log("URL starts with /, normalized to:", cleanUrl);
    return cleanUrl;
  }
  
  // Otherwise, assume it's a relative URL without leading /
  const prefixedUrl = `/${url}`;
  console.log("Added / prefix to URL:", prefixedUrl);
  return prefixedUrl;
}

// Extended product details interface
interface ProductDetails {
  detailedDescription: string;
  additionalData: {
    tagline: string;
    basePriceINR: number;
    metalType: string;
    metalWeight: number;
    stoneTypes: string[];
    mainStoneType?: string;
    mainStoneWeight?: number;
    secondaryStoneTypes?: string[];
    secondaryStoneWeight?: number;
    productTypeId?: string;
    userDescription?: string;
    dimensions?: string;
  };
}

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [parsedDetails, setParsedDetails] = useState<ProductDetails | null>(null);
  const [tagline, setTagline] = useState<string>("");
  const [detailedDescription, setDetailedDescription] = useState<string>("");
  const [productStones, setProductStones] = useState<string[]>([]);
  const [productMetalType, setProductMetalType] = useState<string>("");
  const [productMetalWeight, setProductMetalWeight] = useState<number>(0);
  const [mainStoneType, setMainStoneType] = useState<string>("");
  const [mainStoneWeight, setMainStoneWeight] = useState<number>(0);
  const [secondaryStoneTypes, setSecondaryStoneTypes] = useState<string[]>([]);
  const [secondaryStoneWeight, setSecondaryStoneWeight] = useState<number>(0);
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
    }
  }, [product]);
  
  // Handle navigation back to collections page
  const handleBackToCollection = () => {
    setLocation('/collections');
  };
  
  useEffect(() => {
    if (product?.imageUrl) {
      console.log("Product image URL before processing:", product.imageUrl);
      const processedUrl = getImageUrl(product.imageUrl);
      console.log("Product image URL after processing:", processedUrl);
      setSelectedImage(processedUrl);
    } else {
      console.log("No product image URL available");
    }
  }, [product?.imageUrl]);
  
  // Try to parse the details JSON
  useEffect(() => {
    if (product?.details) {
      try {
        const parsed = JSON.parse(product.details) as ProductDetails;
        setParsedDetails(parsed);
        
        // Set individual fields from parsed data
        if (parsed.additionalData) {
          // Basic info
          setTagline(parsed.additionalData.tagline || "");
          setProductStones(parsed.additionalData.stoneTypes || []);
          setProductMetalType(parsed.additionalData.metalType || "");
          setProductMetalWeight(parsed.additionalData.metalWeight || 0);
          
          // Stone details
          setMainStoneType(parsed.additionalData.mainStoneType || "");
          setMainStoneWeight(parsed.additionalData.mainStoneWeight || 0);
          setSecondaryStoneTypes(parsed.additionalData.secondaryStoneTypes || []);
          setSecondaryStoneWeight(parsed.additionalData.secondaryStoneWeight || 0);
          
          // Other details
          setDimensions(parsed.additionalData.dimensions || "");
          setUserDescription(parsed.additionalData.userDescription || "");
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
  
  const changeImage = (image: string) => {
    setSelectedImage(getImageUrl(image));
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
  
  // Compile all images if product exists
  const allImages = product ? 
    [product.imageUrl, ...(product.additionalImages || [])]
      .filter(img => img) // Filter out null/undefined images
    : [];
  
  return (
    <>
      {product && (
        <Helmet>
          <title>{product.name} | Luster Legacy</title>
          <meta name="description" content={product.description} />
        </Helmet>
      )}

      {/* Hero Section with Full-Width Image */}
      {product && selectedImage && (
        <div className="relative w-full h-[50vh] md:h-[60vh] bg-gradient-to-r from-charcoal to-black overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <img 
              src={selectedImage}
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
                  {selectedImage && (
                    <img 
                      src={selectedImage} 
                      alt={product.name} 
                      className="w-full h-auto object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
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
                    {allImages.map((image, index) => (
                      <div 
                        key={index}
                        className={`rounded-md overflow-hidden cursor-pointer transition-all ${
                          image && selectedImage === getImageUrl(image) ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => image && changeImage(image)}
                      >
                        <img 
                          src={getImageUrl(image || '')} 
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
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="details">Description</TabsTrigger>
                    <TabsTrigger value="specifications">Specifications</TabsTrigger>
                    <TabsTrigger value="care">Care Instructions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="p-6 bg-card rounded-lg shadow-sm">
                    {/* Show the parsed detailed description if available */}
                    <div className="prose prose-sm max-w-none">
                      {detailedDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: detailedDescription.replace(/\n/g, '<br />') }} />
                      ) : (
                        <p className="font-montserrat text-foreground/80">
                          {product.details || "Handcrafted with precision by our master artisans using traditional techniques combined with modern design principles. Each piece undergoes rigorous quality checks."}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="specifications" className="p-6 bg-card rounded-lg shadow-sm">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {productMetalType && (
                          <div className="border-b pb-2">
                            <span className="font-montserrat font-semibold block text-sm text-foreground/60">Metal Type</span>
                            <span className="font-cormorant text-lg">{productMetalType}</span>
                          </div>
                        )}
                        {productMetalWeight > 0 && (
                          <div className="border-b pb-2">
                            <span className="font-montserrat font-semibold block text-sm text-foreground/60">Metal Weight</span>
                            <span className="font-cormorant text-lg">{productMetalWeight}g</span>
                          </div>
                        )}
                        {(product.productType || product.category) && (
                          <div className="border-b pb-2">
                            <span className="font-montserrat font-semibold block text-sm text-foreground/60">Category</span>
                            <span className="font-cormorant text-lg capitalize">{product.productType || product.category}</span>
                          </div>
                        )}
                        {product.dimensions && (
                          <div className="border-b pb-2">
                            <span className="font-montserrat font-semibold block text-sm text-foreground/60">Dimensions</span>
                            <span className="font-cormorant text-lg">{product.dimensions}</span>
                          </div>
                        )}
                      </div>
                      {/* Main Stone Information */}
                      {mainStoneType && (
                        <div className="border-b pb-2">
                          <span className="font-montserrat font-semibold block text-sm text-foreground/60">Main Stone</span>
                          <div className="flex items-center gap-2">
                            <span className="font-cormorant text-lg">{mainStoneType}</span>
                            {mainStoneWeight > 0 && (
                              <Badge variant="secondary" className="text-xs">{mainStoneWeight} carats</Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Secondary Stones Information */}
                      {secondaryStoneTypes && secondaryStoneTypes.length > 0 && (
                        <div className="border-b pb-2">
                          <span className="font-montserrat font-semibold block text-sm text-foreground/60 mb-1">Secondary Stones</span>
                          <div className="flex flex-wrap gap-2">
                            {secondaryStoneTypes.map((stone, index) => (
                              <Badge key={index} variant="outline">{stone}</Badge>
                            ))}
                            {secondaryStoneWeight > 0 && (
                              <Badge variant="secondary" className="text-xs">{secondaryStoneWeight} carats total</Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* All Stones Collection */}
                      {productStones && productStones.length > 0 && (
                        <div className="border-b pb-2">
                          <span className="font-montserrat font-semibold block text-sm text-foreground/60 mb-1">All Stones & Gems</span>
                          <div className="flex flex-wrap gap-2">
                            {productStones.map((stone, index) => (
                              <Badge key={index} variant="outline">{stone}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="care" className="p-6 bg-card rounded-lg shadow-sm">
                    <div className="space-y-4 font-montserrat text-foreground/80">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <Info className="h-5 w-5 text-primary" />
                        </div>
                        <p>
                          Store your jewelry in a cool, dry place, preferably in individual soft pouches or a lined jewelry box to prevent scratches.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <Info className="h-5 w-5 text-primary" />
                        </div>
                        <p>
                          Clean your precious jewelry with a soft, lint-free cloth. For deeper cleaning, use mild soapy water and a soft brush.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <Info className="h-5 w-5 text-primary" />
                        </div>
                        <p>
                          Avoid exposure to harsh chemicals including household cleaners, perfumes, and chlorine. Remove jewelry before swimming or bathing.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <Info className="h-5 w-5 text-primary" />
                        </div>
                        <p>
                          We recommend professional cleaning and inspection once a year to maintain your jewelry's brilliance and integrity.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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