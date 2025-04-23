import { useState } from "react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { METAL_TYPES, STONE_TYPES } from "@/lib/constants";
import { usePriceCalculator } from "@/hooks/use-price-calculator";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description: string;
    basePrice: number;
    imageUrl: string;
    isNew?: boolean;
    isBestseller?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { 
    metalTypeId, 
    stoneTypeId,
    setMetalTypeId, 
    setStoneTypeId,
    currentPrice 
  } = usePriceCalculator({
    basePrice: product.basePrice
  });
  
  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
      <div className="relative h-80 overflow-hidden">
        <img 
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition duration-500"
        />
        
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
        <h3 className="font-playfair text-xl font-semibold text-foreground mb-2">{product.name}</h3>
        <p className="font-cormorant text-lg text-foreground/70 mb-4">{product.description}</p>
        
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
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-montserrat text-sm text-foreground/70">Starting from</p>
            <p className="font-playfair text-xl font-semibold text-foreground">
              {formatCurrency(currentPrice)}
            </p>
          </div>
          <Button 
            asChild
            className="font-montserrat bg-foreground hover:bg-primary text-background px-4 py-2 rounded transition duration-300"
          >
            <Link href={`/product/${product.id}?metal=${metalTypeId}&stone=${stoneTypeId}`}>
              Customize
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
