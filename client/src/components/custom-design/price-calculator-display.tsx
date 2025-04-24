import { useState } from "react";
import { METAL_TYPES, STONE_TYPES } from "@/lib/constants";
import { useJewelryPrice } from "@/hooks/use-jewelry-price";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

/**
 * A component for displaying and testing the price calculator
 */
export function PriceCalculatorDisplay() {
  const [productType, setProductType] = useState<string>("Ring");
  const [metalTypeId, setMetalTypeId] = useState<string>("18kt-gold");
  const [stoneTypeId, setStoneTypeId] = useState<string>("natural-diamond");
  
  // Use our new jewelry price hook
  const { 
    priceUSD, 
    priceINR, 
    isLoading, 
    error, 
    advancePayment, 
    remainingPayment 
  } = useJewelryPrice({
    productType,
    initialMetalTypeId: metalTypeId,
    initialStoneTypeId: stoneTypeId
  });
  
  // Get the selected metal and stone names for display
  const selectedMetal = METAL_TYPES.find(m => m.id === metalTypeId);
  const selectedStone = STONE_TYPES.find(s => s.id === stoneTypeId);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">2025 Jewelry Price Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-type">Product Type</Label>
            <Select
              value={productType}
              onValueChange={setProductType}
            >
              <SelectTrigger id="product-type">
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ring">Ring</SelectItem>
                <SelectItem value="Necklace">Necklace</SelectItem>
                <SelectItem value="Earrings">Earrings</SelectItem>
                <SelectItem value="Bracelet">Bracelet</SelectItem>
                <SelectItem value="Pendant">Pendant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="metal-type">Metal Type</Label>
            <Select
              value={metalTypeId}
              onValueChange={setMetalTypeId}
            >
              <SelectTrigger id="metal-type">
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
          
          <div className="space-y-2">
            <Label htmlFor="stone-type">Stone Type</Label>
            <Select
              value={stoneTypeId}
              onValueChange={setStoneTypeId}
            >
              <SelectTrigger id="stone-type">
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
          
          <div className="mt-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Price Estimate (2025 Market Rates)</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Badge variant="destructive" className="text-white">{error}</Badge>
              ) : (
                <>
                  <div className="flex justify-between text-lg border-b pb-2">
                    <span>USD Price:</span>
                    <span className="font-bold">${priceUSD.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg border-b pb-2">
                    <span>INR Price:</span>
                    <span className="font-bold">₹{priceINR.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span>Advance Payment (50%):</span>
                    <span>{formatCurrency(advancePayment)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining Payment:</span>
                    <span>{formatCurrency(remainingPayment)}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="border-t pt-4 text-center text-sm text-muted-foreground">
              <p>Selected options: {productType} in {selectedMetal?.name} with {selectedStone?.name}</p>
              <p className="text-xs mt-1">Prices updated based on 2025 market rates</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}