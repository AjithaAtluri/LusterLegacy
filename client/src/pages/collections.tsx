import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import ProductCard from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

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
  category?: string;
}

export default function Collections() {
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  
  // Fetch all products
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Fetch active product types
  const { data: productTypes = [], isLoading: typesLoading } = useQuery<ProductType[]>({
    queryKey: ['/api/product-types/active'],
  });
  
  // Filter and sort products
  const filteredProducts = allProducts.filter((product) => {
    // Filter by category
    if (category !== "all" && product.productTypeId !== parseInt(category)) {
      return false;
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
        return a.basePrice - b.basePrice;
      case "price-desc":
        return b.basePrice - a.basePrice;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  // Create categories list from product types plus "All Collections"
  const categories = [
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
          <Tabs defaultValue="all" value={category} onValueChange={setCategory} className="w-full md:w-auto">
            <TabsList className="h-auto flex flex-wrap">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-primary data-[state=active]:text-background">
                  {cat.name}
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
        
        {productsLoading || typesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, index) => (
              <div key={index} className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
                <Skeleton className="h-80 w-full" />
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
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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
