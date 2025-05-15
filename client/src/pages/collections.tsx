import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import ProductCard from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, PlusCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Define product type interface
interface ProductType {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  icon: string | null;
  color: string | null;
}

// Define product interface
interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  details?: string;
  dimensions?: string;
  productTypeId: number;
  productType?: string;
  category?: string; // Legacy field
  calculatedPriceUSD?: number; // Add the calculated price fields
  calculatedPriceINR?: number;
}

export default function Collections() {
  const [productType, setProductType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  
  // Use direct fetch for products to ensure fresh prices
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  // State for tracking fresh prices
  const [productIds, setProductIds] = useState<number[]>([]);
  const [productsWithFreshPrices, setProductsWithFreshPrices] = useState<Product[]>([]);
  
  // Fetch products directly with no caching
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await fetch('/api/products', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();
        setAllProducts(data);
        
        // Extract all product IDs for price fetching
        const ids = data.map((product: Product) => product.id);
        setProductIds(ids);
        
        setProductsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProductsLoading(false);
      }
    };
    
    fetchProducts();
    
    // Refresh every 30 minutes
    const interval = setInterval(() => {
      console.log("Refreshing product list (30-min interval)");
      fetchProducts();
    }, 1800000); // 30 minutes in milliseconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch fresh prices for each product
  useEffect(() => {
    if (!productIds.length) return;
    
    const loadFreshPrices = async () => {
      try {
        console.log("Loading fresh prices for all products...");
        
        // Fetch each product from direct-product endpoint to get fresh prices
        const productPromises = productIds.map(id => 
          fetch(`/api/direct-product/${id}?nocache=${Date.now()}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
            .then(res => res.json())
            .then(data => {
              console.log(`Fresh price data for product ${id}:`, {
                id: id,
                calculatedPriceUSD: data.calculatedPriceUSD,
                calculatedPriceINR: data.calculatedPriceINR
              });
              return data;
            })
            .catch(err => {
              console.error(`Error fetching prices for product ${id}:`, err);
              return null;
            })
        );
        
        // Wait for all requests to complete
        const productResults = await Promise.all(productPromises);
        const validProducts = productResults.filter(p => p !== null);
        
        setProductsWithFreshPrices(validProducts);
      } catch (error) {
        console.error("Error loading fresh prices:", error);
      }
    };
    
    // Load fresh prices immediately and every 30 minutes
    loadFreshPrices();
    const interval = setInterval(() => {
      console.log("Refreshing product prices (30-min interval)");
      loadFreshPrices();
    }, 1800000); // 30 minutes in milliseconds
    
    return () => clearInterval(interval);
  }, [productIds]);
  
  // Fetch active product types
  const { data: productTypes = [], isLoading: typesLoading } = useQuery<ProductType[]>({
    queryKey: ['/api/product-types/active'],
  });
  
  // Merge fresh price data with original product data
  const [enhancedProducts, setEnhancedProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    if (!allProducts.length || !productsWithFreshPrices.length) {
      return;
    }
    
    // Create a map of fresh prices by product ID for quick lookup
    const freshPricesMap = productsWithFreshPrices.reduce((map, product) => {
      map[product.id] = {
        calculatedPriceUSD: product.calculatedPriceUSD,
        calculatedPriceINR: product.calculatedPriceINR
      };
      return map;
    }, {} as Record<number, {calculatedPriceUSD?: number, calculatedPriceINR?: number}>);
    
    // Merge fresh prices into original product data
    const enhanced = allProducts.map(product => {
      if (freshPricesMap[product.id]) {
        return {
          ...product,
          calculatedPriceUSD: freshPricesMap[product.id].calculatedPriceUSD,
          calculatedPriceINR: freshPricesMap[product.id].calculatedPriceINR
        };
      }
      return product;
    });
    
    console.log("Created enhanced products with fresh prices:", enhanced.length);
    setEnhancedProducts(enhanced);
  }, [allProducts, productsWithFreshPrices]);

  // Filter and sort products
  const filteredProducts = enhancedProducts.filter((product) => {
    // Filter by product type (with backward compatibility for legacy category field)
    if (productType !== "all") {
      // Try to match by productTypeId first (new way)
      const typeIdMatch = product.productTypeId === parseInt(productType);
      
      // If no productTypeId match, try to match by category (old way) for backward compatibility
      const categoryMatch = product.category === productType;
      
      if (!typeIdMatch && !categoryMatch) {
        return false;
      }
    }
    
    // Filter by search query
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !product.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        // Use calculated price when available, fall back to base price
        const priceA = a.calculatedPriceUSD || Math.round(a.basePrice / 83);
        const priceB = b.calculatedPriceUSD || Math.round(b.basePrice / 83);
        return priceA - priceB;
      case "price-desc":
        const priceHighA = a.calculatedPriceUSD || Math.round(a.basePrice / 83);
        const priceHighB = b.calculatedPriceUSD || Math.round(b.basePrice / 83);
        return priceHighB - priceHighA;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        // Default is by ID 
        return b.id - a.id;
    }
  });
  
  // Create product types list plus "All Collections"
  const productTypeOptions = [
    { id: "all", name: "All Collections" },
    ...productTypes.map(type => ({ 
      id: type.id.toString(), 
      name: type.name 
    }))
  ];
  
  return (
    <>
      <Helmet>
        <title>Collections | Luster Legacy</title>
        <meta name="description" content="Browse our curated collection of luxury jewelry. Each piece is meticulously handcrafted by our master artisans." />
      </Helmet>
      
      <div className="bg-charcoal py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-pearl mb-4">Our Collections</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="font-cormorant text-lg md:text-xl text-pearl/80 max-w-2xl mx-auto">
            Discover our exquisitely handcrafted pieces, each one a testament to timeless elegance and superior craftsmanship.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <Tabs defaultValue="all" value={productType} onValueChange={setProductType} className="w-full md:w-auto">
            <TabsList className="h-auto flex flex-wrap">
              {productTypeOptions.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="data-[state=active]:bg-primary data-[state=active]:text-background">
                  {type.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {productsLoading || typesLoading || (allProducts.length > 0 && productsWithFreshPrices.length === 0) ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-background border rounded-full">
                <Loader2 className="h-4 w-4 text-primary animate-spin mr-2" />
                <span className="text-sm font-medium">Loading products with current prices...</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {Array(6).fill(0).map((_, index) => (
                <div className="flex justify-center" key={index}>
                  <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300 max-w-full">
                    <Skeleton className="h-96 w-full" />
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
                </div>
              ))}
            </div>
          </>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {sortedProducts.map((product) => (
              <div className="flex justify-center" key={`${product.id}-${product.calculatedPriceUSD || 'pending'}`}>
                <ProductCard 
                  product={product} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="font-playfair text-xl font-semibold text-foreground mb-2">No products found</h3>
            <p className="font-montserrat text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </>
  );
}
