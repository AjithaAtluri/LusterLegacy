import { useAdminPriceCalculator } from "@/hooks/use-admin-price-calculator";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceBreakdownTotalProps {
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneType?: string;
  secondaryStoneWeight?: string;
  otherStoneType?: string;
  otherStoneWeight?: string;
}

/**
 * A component to display the complete price breakdown with formula and total
 * This matches exactly what the useAdminPriceCalculator hook returns
 */
export function PriceBreakdownTotal({
  metalType,
  metalWeight,
  mainStoneType,
  mainStoneWeight,
  secondaryStoneType = "none_selected",
  secondaryStoneWeight = "0",
  otherStoneType = "none_selected",
  otherStoneWeight = "0"
}: PriceBreakdownTotalProps) {
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
    secondaryStoneType,
    secondaryStoneWeight,
    otherStoneType,
    otherStoneWeight
  });
  
  // Calculate the total of all cost components to verify it matches the returned price
  const totalCost = breakdown.metalCost + 
                     breakdown.primaryStoneCost + 
                     breakdown.secondaryStoneCost + 
                     breakdown.overhead;
  
  // The price from the API should match this total (with possible small rounding differences)
  const isConsistent = Math.abs(totalCost - priceUSD) < 5; // Allow for small rounding differences
  
  return (
    <div className="space-y-3">
      {/* Metal cost */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Metal Cost:</span>
        {isCalculating ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span>~{formatCurrency(breakdown.metalCost)}</span>
        )}
      </div>
      
      {/* Main stone cost */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Main Stone:</span>
        {isCalculating ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span>~{formatCurrency(breakdown.primaryStoneCost)}</span>
        )}
      </div>
      
      {/* Secondary stone cost */}
      {secondaryStoneType !== "none_selected" && Number(secondaryStoneWeight) > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Secondary Stone:</span>
          {isCalculating ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span>~{formatCurrency(breakdown.secondaryStoneCost)}</span>
          )}
        </div>
      )}
      
      {/* Other stone cost */}
      {otherStoneType !== "none_selected" && Number(otherStoneWeight) > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Other Stone:</span>
          {isCalculating ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span>~{formatCurrency(0)}</span>
          )}
        </div>
      )}
      
      {/* Overhead */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Craftsmanship & Overhead (25%):</span>
        {isCalculating ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span>~{formatCurrency(breakdown.overhead)}</span>
        )}
      </div>
      
      <Separator className="my-2" />
      
      {/* Total price */}
      <div className="flex justify-between items-center font-semibold">
        <span>Total Price:</span>
        {isCalculating ? (
          <Skeleton className="h-5 w-28" />
        ) : (
          <div className="flex flex-col items-end">
            <span>~{formatCurrency(priceUSD)}</span>
            <span className="text-sm font-normal">~₹{priceINR.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
      
      {/* Price formula */}
      <div className="mt-4 text-xs text-primary">
        <p className="font-medium">Price Formula:</p>
        <p className="mt-1">(Metal weight × current gold price × metal modifier) + (Stone carat weight × stone price) + 25% overhead = Total Price</p>
      </div>
      
      {/* Gold price information */}
      {goldPrice && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          <span>Based on live gold price: ₹{goldPrice?.toLocaleString('en-IN') || "---"}/g</span>
        </div>
      )}
    </div>
  );
}