import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPriceCalculator } from "@/hooks/use-admin-price-calculator";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PriceCalculatorDisplayProps {
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneTypes?: Array<{ id: number; name: string }>;
  secondaryStoneWeight?: string;
}

export function PriceCalculatorDisplay({
  metalType,
  metalWeight,
  mainStoneType,
  mainStoneWeight,
  secondaryStoneTypes = [],
  secondaryStoneWeight = "0"
}: PriceCalculatorDisplayProps) {
  const {
    priceUSD,
    priceINR,
    isCalculating,
    breakdown,
    goldPrice,
    goldPriceLocation,
    goldPriceTimestamp,
    isGoldPriceLoading
  } = useAdminPriceCalculator({
    metalType,
    metalWeight,
    mainStoneType,
    mainStoneWeight,
    secondaryStoneTypes,
    secondaryStoneWeight
  });

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
                <p className="text-2xl font-bold">{formatCurrency(priceUSD)}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">INR Price</p>
              {isCalculating ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">₹{priceINR.toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Price Breakdown (USD)</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Metal Cost</span>
                {isCalculating ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span>{formatCurrency(breakdown.metalCost)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Primary Stone</span>
                {isCalculating ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span>{formatCurrency(breakdown.primaryStoneCost)}</span>
                )}
              </div>
              {/* Secondary Stones with detail display */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Secondary Stones</span>
                  {isCalculating ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span>{formatCurrency(breakdown.secondaryStoneCost)}</span>
                  )}
                </div>
                {secondaryStoneTypes && secondaryStoneTypes.length > 0 && (
                  <div className="bg-muted/30 p-2 rounded-sm text-xs space-y-1 ml-2">
                    {secondaryStoneTypes.map((stone, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mr-1.5"></div>
                          {stone.name}
                        </span>
                      </div>
                    ))}
                    {secondaryStoneWeight && Number(secondaryStoneWeight) > 0 && (
                      <div className="text-right text-muted-foreground mt-1 pt-1 border-t border-border/40">
                        Total: {secondaryStoneWeight} carats
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overhead (25%)</span>
                {isCalculating ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span>{formatCurrency(breakdown.overhead)}</span>
                )}
              </div>
            </div>
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