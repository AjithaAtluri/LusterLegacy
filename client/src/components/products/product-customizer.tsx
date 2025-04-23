import { useState } from "react";
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
  };
  initialMetalTypeId?: string;
  initialStoneTypeId?: string;
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
    initialMetalTypeId,
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
        <p className="font-cormorant text-xl text-foreground/70 mb-6">
          {product.description}
        </p>
        
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
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="care">Care</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="font-montserrat text-foreground/80">
            <p>{product.details || "Handcrafted with precision by our master artisans using traditional techniques combined with modern design principles. Each piece undergoes rigorous quality checks."}</p>
          </TabsContent>
          <TabsContent value="dimensions" className="font-montserrat text-foreground/80">
            <p>{product.dimensions || "Dimensions may vary slightly as each piece is handcrafted. Standard ring sizes and chain lengths are available. Custom dimensions can be accommodated upon request."}</p>
          </TabsContent>
          <TabsContent value="care" className="font-montserrat text-foreground/80">
            <p>Store your jewelry in a cool, dry place. Clean with a soft, lint-free cloth. Avoid exposure to harsh chemicals, perfumes, and prolonged sunlight. Visit us for professional cleaning and maintenance.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
