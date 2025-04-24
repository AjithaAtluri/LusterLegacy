import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { METAL_TYPES, STONE_TYPES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { usePriceCalculator } from "@/hooks/use-price-calculator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ShoppingBag, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCustomizerProps {
  product: {
    id: number;
    name: string;
    description: string;
    basePrice: number;
    imageUrl: string;
    additionalImages?: string[];
    details?: string;
    dimensions?: string;
    category?: string;
    isNew?: boolean;
    isBestseller?: boolean;
    isFeatured?: boolean;
  };
  initialMetalTypeId?: string;
  initialStoneTypeId?: string;
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
  };
}

export default function ProductCustomizer({ 
  product, 
  initialMetalTypeId = "18kt-gold",
  initialStoneTypeId = "natural-polki"
}: ProductCustomizerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const [parsedDetails, setParsedDetails] = useState<ProductDetails | null>(null);
  const [tagline, setTagline] = useState<string>("");
  const [detailedDescription, setDetailedDescription] = useState<string>("");
  const [productStones, setProductStones] = useState<string[]>([]);
  const [productMetalType, setProductMetalType] = useState<string>("");
  const [productMetalWeight, setProductMetalWeight] = useState<number>(0);
  
  // Try to parse the details JSON
  useEffect(() => {
    if (product.details) {
      try {
        const parsed = JSON.parse(product.details) as ProductDetails;
        setParsedDetails(parsed);
        
        // Set individual fields from parsed data
        if (parsed.additionalData) {
          setTagline(parsed.additionalData.tagline || "");
          setProductStones(parsed.additionalData.stoneTypes || []);
          setProductMetalType(parsed.additionalData.metalType || "");
          setProductMetalWeight(parsed.additionalData.metalWeight || 0);
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
  }, [product.details]);
  
  const { 
    metalTypeId, 
    stoneTypeId,
    setMetalTypeId, 
    setStoneTypeId,
    currentPrice,
    advancePayment,
    remainingPayment
  } = usePriceCalculator({
    basePrice: product.basePrice,
    initialMetalTypeId: productMetalType ? productMetalType.toLowerCase().replace(/\s+/g, '-') : initialMetalTypeId,
    initialStoneTypeId
  });
  
  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        metalTypeId,
        stoneTypeId,
        price: currentPrice
      });
      
      // Invalidate cart query to refresh cart count
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
      
      // Redirect to checkout
      setLocation("/checkout");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Could not add item to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddToWishlist = async () => {
    try {
      await apiRequest("POST", "/api/wishlist", {
        productId: product.id
      });
      
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast({
        title: "Error",
        description: "Could not add item to wishlist. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const changeImage = (image: string) => {
    setSelectedImage(image);
  };
  
  // Compile all images
  const allImages = [product.imageUrl, ...(product.additionalImages || [])];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Product Images */}
      <div>
        <div className="rounded-lg overflow-hidden bg-card mb-4">
          <img 
            src={selectedImage} 
            alt={product.name} 
            className="w-full h-auto object-cover"
          />
        </div>
        
        {/* Thumbnail gallery */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {allImages.map((image, index) => (
              <div 
                key={index}
                className={`rounded-md overflow-hidden cursor-pointer transition-all ${
                  selectedImage === image ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                }`}
                onClick={() => changeImage(image)}
              >
                <img 
                  src={image} 
                  alt={`${product.name} view ${index + 1}`} 
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Product Details and Customization */}
      <div>
        <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">
          {product.name}
        </h1>
        
        {/* Display the tagline if it exists */}
        {tagline && (
          <p className="font-cormorant text-lg italic text-primary mb-3">
            {tagline}
          </p>
        )}
        
        <p className="font-cormorant text-xl text-foreground/70 mb-3">
          {product.description}
        </p>
        
        {/* Display product badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {product.category && (
            <Badge variant="outline" className="capitalize">
              {product.category}
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-blue-500 text-white">New</Badge>
          )}
          {product.isBestseller && (
            <Badge className="bg-green-500 text-white">Bestseller</Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-primary text-white">Featured</Badge>
          )}
          
          {/* Show stone types from parsed details */}
          {productStones && productStones.length > 0 && productStones.map((stone, index) => (
            <Badge key={index} variant="secondary">{stone}</Badge>
          ))}
        </div>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="font-playfair text-lg font-semibold mb-4">Customize Your Piece</h3>
              
              <div className="mb-4">
                <label className="block font-montserrat text-sm font-medium mb-2">
                  Metal Type
                </label>
                <Select 
                  value={metalTypeId}
                  onValueChange={setMetalTypeId}
                >
                  <SelectTrigger className="w-full">
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
              
              <div>
                <label className="block font-montserrat text-sm font-medium mb-2">
                  Stone Type
                </label>
                <Select 
                  value={stoneTypeId}
                  onValueChange={setStoneTypeId}
                >
                  <SelectTrigger className="w-full">
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
            
            <div className="border-t border-border pt-6 mb-6">
              <div className="flex justify-between mb-2">
                <span className="font-montserrat">Total Price:</span>
                <span className="font-playfair text-lg font-semibold">
                  {formatCurrency(currentPrice)}
                </span>
              </div>
              <div className="flex justify-between mb-2 text-sm text-foreground/70">
                <span className="font-montserrat">Advance Payment (50%):</span>
                <span>{formatCurrency(advancePayment)}</span>
              </div>
              <div className="flex justify-between text-sm text-foreground/70">
                <span className="font-montserrat">Balance on Delivery:</span>
                <span>{formatCurrency(remainingPayment)}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 font-montserrat bg-primary text-background hover:bg-accent"
                onClick={handleAddToCart}
                disabled={isLoading}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {isLoading ? "Adding..." : "Add to Cart"}
              </Button>
              <Button 
                variant="outline"
                className="font-montserrat"
                onClick={handleAddToWishlist}
              >
                <Heart className="mr-2 h-4 w-4" />
                Wishlist
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="care">Care</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="font-montserrat text-foreground/80">
            {/* Show the parsed detailed description if available, otherwise show the raw details */}
            <div className="prose prose-sm max-w-none">
              {detailedDescription ? (
                <div dangerouslySetInnerHTML={{ __html: detailedDescription.replace(/\n/g, '<br />') }} />
              ) : (
                <p>{product.details || "Handcrafted with precision by our master artisans using traditional techniques combined with modern design principles. Each piece undergoes rigorous quality checks."}</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="specifications" className="font-montserrat text-foreground/80">
            <div className="space-y-4">
              {/* Show specifications from parsed details */}
              <div className="grid grid-cols-2 gap-3">
                {productMetalType && (
                  <div>
                    <span className="font-semibold block">Metal Type</span>
                    <span>{productMetalType}</span>
                  </div>
                )}
                {productMetalWeight > 0 && (
                  <div>
                    <span className="font-semibold block">Metal Weight</span>
                    <span>{productMetalWeight}g</span>
                  </div>
                )}
                {product.category && (
                  <div>
                    <span className="font-semibold block">Category</span>
                    <span className="capitalize">{product.category}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div>
                    <span className="font-semibold block">Dimensions</span>
                    <span>{product.dimensions}</span>
                  </div>
                )}
              </div>
              {productStones && productStones.length > 0 && (
                <div>
                  <span className="font-semibold block mb-1">Stones & Gems</span>
                  <div className="flex flex-wrap gap-2">
                    {productStones.map((stone, index) => (
                      <Badge key={index} variant="outline">{stone}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="care" className="font-montserrat text-foreground/80">
            <p>Store your jewelry in a cool, dry place. Clean with a soft, lint-free cloth. Avoid exposure to harsh chemicals, perfumes, and prolonged sunlight. Visit us for professional cleaning and maintenance.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
