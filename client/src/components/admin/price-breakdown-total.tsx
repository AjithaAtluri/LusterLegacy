import { useAdminPriceCalculator } from "@/hooks/use-admin-price-calculator";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
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
    exchangeRate,
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
  
  // Calculate the base cost (materials only)
  const baseCost = breakdown.metalCost + 
                  breakdown.primaryStoneCost + 
                  breakdown.secondaryStoneCost + 
                  breakdown.otherStoneCost;
                  
  // Get the overhead directly from the API
  const apiOverhead = breakdown.overhead;
  
  // Log the calculations to verify the math
  console.log("Price Calculation Details:", {
    metalCost: breakdown.metalCost,
    primaryStoneCost: breakdown.primaryStoneCost,
    secondaryStoneCost: breakdown.secondaryStoneCost,
    otherStoneCost: breakdown.otherStoneCost,
    baseCost,
    apiOverhead,
    expectedOverhead: baseCost * 0.25,
    apiTotal: priceUSD,
    apiInrTotal: priceINR
  });
  
  // Use the values directly from the API
  const displayTotalUSD = priceUSD;
  const displayTotalINR = priceINR;
  
  // Use the overhead value directly from the API
  const displayOverhead = apiOverhead;
  
  // Function to format dual currency prices
  const formatDualCurrency = (usdAmount: number) => {
    const inrAmount = usdAmount * (exchangeRate || 83);
    return (
      <div className="flex flex-col items-end">
        <span className="font-medium">{formatCurrency(usdAmount)}</span>
        <span className="text-xs text-muted-foreground">₹{Math.round(inrAmount).toLocaleString('en-IN')}</span>
      </div>
    );
  };
  
  // Calculate weight and price for display with both USD and INR details
  const getCalculationDetail = (label: string, weight: number, pricePerUnit: number, totalCost: number) => {
    if (weight <= 0 || totalCost <= 0) return null;
    
    const rate = exchangeRate || 83;
    const inrPricePerUnit = pricePerUnit * rate;
    const inrTotalCost = totalCost * rate;
    
    return (
      <div className="text-xs text-muted-foreground ml-2 mt-0.5 space-y-0.5">
        <div>
          {`${weight.toFixed(2)} ${label} × ${formatCurrency(pricePerUnit)}/unit = ${formatCurrency(totalCost)}`}
        </div>
        <div>
          {`${weight.toFixed(2)} ${label} × ₹${Math.round(inrPricePerUnit).toLocaleString('en-IN')}/unit = ₹${Math.round(inrTotalCost).toLocaleString('en-IN')}`}
        </div>
      </div>
    );
  };
  
  // Estimate stone prices for details display
  const mainStonePricePerCarat = mainStoneType !== "none_selected" && Number(mainStoneWeight) > 0 
    ? breakdown.primaryStoneCost / Number(mainStoneWeight) 
    : 0;
    
  const secondaryStonePricePerCarat = secondaryStoneType !== "none_selected" && Number(secondaryStoneWeight) > 0 
    ? breakdown.secondaryStoneCost / Number(secondaryStoneWeight) 
    : 0;
    
  const otherStonePricePerCarat = otherStoneType !== "none_selected" && Number(otherStoneWeight) > 0 && breakdown.otherStoneCost > 0
    ? breakdown.otherStoneCost / Number(otherStoneWeight) 
    : 0;
  
  // Get metal price per gram
  const metalWeightNum = Number(metalWeight) || 0;
  const metalPricePerGram = metalWeightNum > 0 ? breakdown.metalCost / metalWeightNum : 0;
  
  return (
    <div className="space-y-3">
      {/* Metal cost */}
      <div className="text-sm">
        <div className="flex justify-between items-center">
          <span className="font-medium">Metal Cost:</span>
          {isCalculating ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            formatDualCurrency(breakdown.metalCost)
          )}
        </div>
        {!isCalculating && metalWeightNum > 0 && (
          getCalculationDetail("g", metalWeightNum, metalPricePerGram, breakdown.metalCost)
        )}
      </div>
      
      {/* Main stone cost */}
      {mainStoneType !== "none_selected" && Number(mainStoneWeight) > 0 && (
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium">{mainStoneType}:</span>
            {isCalculating ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              formatDualCurrency(breakdown.primaryStoneCost)
            )}
          </div>
          {!isCalculating && (
            getCalculationDetail("ct", Number(mainStoneWeight), mainStonePricePerCarat, breakdown.primaryStoneCost)
          )}
        </div>
      )}
      
      {/* Secondary stone cost */}
      {secondaryStoneType !== "none_selected" && Number(secondaryStoneWeight) > 0 && (
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium">{secondaryStoneType}:</span>
            {isCalculating ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              formatDualCurrency(breakdown.secondaryStoneCost)
            )}
          </div>
          {!isCalculating && (
            getCalculationDetail("ct", Number(secondaryStoneWeight), secondaryStonePricePerCarat, breakdown.secondaryStoneCost)
          )}
        </div>
      )}
      
      {/* Other stone cost */}
      {otherStoneType !== "none_selected" && Number(otherStoneWeight) > 0 && (
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium">{otherStoneType}:</span>
            {isCalculating ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              formatDualCurrency(breakdown.otherStoneCost || 0)
            )}
          </div>
          {!isCalculating && breakdown.otherStoneCost > 0 && (
            getCalculationDetail("ct", Number(otherStoneWeight), otherStonePricePerCarat, breakdown.otherStoneCost)
          )}
        </div>
      )}
      
      {/* Base Materials Cost */}
      <div className="text-sm">
        <div className="flex justify-between items-center">
          <span className="font-medium">Base Materials Subtotal:</span>
          {isCalculating ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            formatDualCurrency(baseCost)
          )}
        </div>
      </div>
      
      {/* Overhead */}
      <div className="text-sm">
        <div className="flex justify-between items-center">
          <span className="font-medium">Craftsmanship & Overhead (25%):</span>
          {isCalculating ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            formatDualCurrency(displayOverhead)
          )}
        </div>
        {/* Overhead is now directly from the API, so no need for recalculation message */}
      </div>
      
      <Separator className="my-2" />
      
      {/* Total price */}
      <div className="flex justify-between items-center font-semibold">
        <span>Total Price:</span>
        {isCalculating ? (
          <Skeleton className="h-5 w-28" />
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-base">{formatCurrency(displayTotalUSD)}</span>
            <span className="text-sm">₹{displayTotalINR.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
      
      {/* Price formula */}
      <div className="mt-4 text-xs text-primary">
        <p className="font-medium">Price Formula:</p>
        <p className="mt-1">(Metal weight × current gold price × metal modifier) + (Stone carat weights × stone prices) + 25% overhead = Total Price</p>
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