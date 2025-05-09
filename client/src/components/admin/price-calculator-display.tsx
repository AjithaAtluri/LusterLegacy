import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPriceCalculator } from "@/hooks/use-admin-price-calculator";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PriceCalculatorDisplayProps {
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneType?: string;
  secondaryStoneWeight?: string;
  otherStoneType?: string;
  otherStoneWeight?: string;
  compact?: boolean;
}

export function PriceCalculatorDisplay({
  metalType,
  metalWeight,
  mainStoneType,
  mainStoneWeight,
  secondaryStoneType = "none_selected",
  secondaryStoneWeight = "0",
  otherStoneType = "none_selected",
  otherStoneWeight = "0",
  compact = false
}: PriceCalculatorDisplayProps) {
  const {
    priceUSD,
    priceINR,
    isCalculating,
    breakdown,
    goldPrice,
    exchangeRate,
    goldPriceLocation,
    goldPriceTimestamp,
    isGoldPriceLoading,
    calculatePrice // Get the manual calculation function
  } = useAdminPriceCalculator({
    metalType,
    metalWeight,
    mainStoneType,
    mainStoneWeight,
    secondaryStoneType,
    secondaryStoneWeight,
    otherStoneType,
    otherStoneWeight
  });
  
  // Calculate the base cost (materials only)
  const baseCost = breakdown.metalCost + 
                 breakdown.primaryStoneCost + 
                 breakdown.secondaryStoneCost + 
                 breakdown.otherStoneCost;
                 
  // Calculate the correct 25% overhead
  const correctOverhead = baseCost * 0.25;
  
  // Calculate the total with the correct overhead
  const calculatedTotalCost = baseCost + correctOverhead;
  
  // The price from the API should match this total (with possible small rounding differences)
  const isConsistent = Math.abs(calculatedTotalCost - priceUSD) < 5; // Allow for small rounding differences
  
  // Use the calculated total if it's significantly different from the API total
  const displayTotalUSD = !isConsistent && calculatedTotalCost > 5 ? calculatedTotalCost : priceUSD;
  const displayTotalINR = !isConsistent && calculatedTotalCost > 5 ? Math.round(calculatedTotalCost * (exchangeRate || 83)) : priceINR;

  // Render a compact version with just the price info
  if (compact) {
    return (
      <div className="space-y-2 price-calculator-display">
        <div className="flex justify-between items-center">
          <span className="text-sm">USD:</span>
          {isCalculating ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <span className="font-medium">{formatCurrency(displayTotalUSD)}</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">INR:</span>
          {isCalculating ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <span className="font-medium">₹{displayTotalINR.toLocaleString('en-IN')}</span>
          )}
        </div>
        {!isConsistent && !isCalculating && (
          <div className="text-xs text-amber-500">
            Recalculated for accuracy
          </div>
        )}
        <div className="text-xs pt-2 text-muted-foreground flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          <span>Based on live gold price: ₹{goldPrice?.toLocaleString('en-IN') || "---"}/g</span>
        </div>
      </div>
    );
  }

  // Full detailed view
  return (
    <Card className="transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="mr-2">Calculated Price</span>
          {isCalculating && (
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Gold Price Information */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <h3 className="text-sm font-medium text-amber-900">Current Gold Price</h3>
            </div>
            
            <div className="mt-1">
              {isGoldPriceLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : goldPrice ? (
                <div className="flex flex-col">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-800">24K Gold:</span>
                    <span className="font-medium text-amber-900">₹{goldPrice.toLocaleString('en-IN')}/gram</span>
                  </div>
                  
                  {goldPriceTimestamp && (
                    <div className="flex justify-between text-xs text-amber-700 mt-1">
                      <span>{goldPriceLocation}</span>
                      <span>Updated {formatDistanceToNow(goldPriceTimestamp)} ago</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-amber-700">
                  Using default gold price estimate
                </div>
              )}
            </div>
          </div>

          {/* Price Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">USD Price</p>
              {isCalculating ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(displayTotalUSD)}</p>
                  {!isConsistent && (
                    <p className="text-xs text-amber-500">Recalculated for accuracy</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">INR Price</p>
              {isCalculating ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div>
                  <p className="text-2xl font-bold">₹{displayTotalINR.toLocaleString('en-IN')}</p>
                  {!isConsistent && (
                    <p className="text-xs text-amber-500">(API: ₹{priceINR.toLocaleString('en-IN')})</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Price Breakdown (USD & INR)</h4>
            <div className="space-y-1">
              {/* Metal Cost with detail */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Metal Cost</span>
                  {isCalculating ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(breakdown.metalCost)}</span>
                      <span className="text-xs text-muted-foreground">₹{Math.round(breakdown.metalCost * exchangeRate).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="bg-muted/30 p-2 rounded-sm text-xs space-y-1 ml-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5"></div>
                      {metalType}
                    </span>
                  </div>
                  <div className="text-right text-muted-foreground mt-1 pt-1 border-t border-border/40">
                    Weight: {metalWeight}g × ₹{Math.round(breakdown.metalCost / Number(metalWeight) * exchangeRate).toLocaleString('en-IN')}/g
                  </div>
                </div>
              </div>
              
              {/* Primary Stone with detail */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Primary Stone</span>
                  {isCalculating ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(breakdown.primaryStoneCost)}</span>
                      <span className="text-xs text-muted-foreground">₹{Math.round(breakdown.primaryStoneCost * exchangeRate).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="bg-muted/30 p-2 rounded-sm text-xs space-y-1 ml-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>
                      {mainStoneType}
                    </span>
                  </div>
                  <div className="text-right text-muted-foreground mt-1 pt-1 border-t border-border/40">
                    Weight: {mainStoneWeight} carats × ₹{Math.round(breakdown.primaryStoneCost / Number(mainStoneWeight) * exchangeRate).toLocaleString('en-IN')}/carat
                  </div>
                </div>
              </div>
              {/* Secondary Stones with detail display */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Secondary Stones</span>
                  {isCalculating ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <div className="flex flex-col items-end">
                      <span>{formatCurrency(breakdown.secondaryStoneCost)}</span>
                      <span className="text-xs text-muted-foreground">₹{Math.round(breakdown.secondaryStoneCost * exchangeRate).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                {secondaryStoneType && secondaryStoneType !== "none_selected" && (
                  <div className="bg-muted/30 p-2 rounded-sm text-xs space-y-1 ml-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mr-1.5"></div>
                        {secondaryStoneType}
                      </span>
                    </div>
                    {secondaryStoneWeight && Number(secondaryStoneWeight) > 0 && (
                      <div className="text-right text-muted-foreground mt-1 pt-1 border-t border-border/40">
                        Weight: {secondaryStoneWeight} carats × ₹{Math.round(breakdown.secondaryStoneCost / Number(secondaryStoneWeight) * exchangeRate).toLocaleString('en-IN')}/carat
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Other Stone display (if present) */}
              {otherStoneType && otherStoneType !== "none_selected" && otherStoneType !== "none" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Other Stone</span>
                    {isCalculating ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <div className="flex flex-col items-end">
                        <span>{formatCurrency(breakdown.otherStoneCost)}</span>
                        <span className="text-xs text-muted-foreground">₹{Math.round(breakdown.otherStoneCost * exchangeRate).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/30 p-2 rounded-sm text-xs space-y-1 ml-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></div>
                        {otherStoneType}
                      </span>
                    </div>
                    {otherStoneWeight && Number(otherStoneWeight) > 0 && (
                      <div className="text-right text-muted-foreground mt-1 pt-1 border-t border-border/40">
                        Weight: {otherStoneWeight} carats × ₹{Math.round(breakdown.otherStoneCost / Number(otherStoneWeight) * exchangeRate).toLocaleString('en-IN')}/carat
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overhead (25%)</span>
                {isCalculating ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(correctOverhead)}</span>
                    <span className="text-xs text-muted-foreground">₹{Math.round(correctOverhead * exchangeRate).toLocaleString('en-IN')}</span>
                    {Math.abs(correctOverhead - breakdown.overhead) > 5 && (
                      <div className="text-xs text-amber-500 mt-0.5">
                        Recalculated (API: {formatCurrency(breakdown.overhead)})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Refresh Price Button */}
          <div className="pt-3 flex justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => calculatePrice()}
              disabled={isCalculating}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} className={isCalculating ? "animate-spin" : ""} />
              <span>Update Price</span>
            </Button>
          </div>
          
          {/* Note */}
          <div className="text-xs text-muted-foreground pt-2">
            <p>Price calculations based on current market rates and material costs.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}