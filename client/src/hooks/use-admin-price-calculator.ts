import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGoldPrice } from "./use-gold-price";
import { useExchangeRate } from "./use-exchange-rate";

interface UsePriceCalculatorProps {
  // Input values for price calculation
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneType?: string;
  secondaryStoneWeight?: string;
  otherStoneType?: string;
  otherStoneWeight?: string;
}

interface PriceBreakdown {
  metalCost: number;
  primaryStoneCost: number;
  secondaryStoneCost: number;
  otherStoneCost: number;
  overhead: number;
}

interface PriceData {
  price: number;
  currency: string;
  breakdown: PriceBreakdown;
}

export function useAdminPriceCalculator({
  metalType,
  metalWeight,
  mainStoneType,
  mainStoneWeight,
  secondaryStoneType = "none_selected",
  secondaryStoneWeight = "0",
  otherStoneType = "none_selected",
  otherStoneWeight = "0"
}: UsePriceCalculatorProps) {
  const { toast } = useToast();
  const { goldPrice, isLoading: isGoldPriceLoading, location, timestamp } = useGoldPrice();
  const { exchangeRate, isLoading: isExchangeRateLoading } = useExchangeRate();
  
  const [priceUSD, setPriceUSD] = useState<number>(0);
  const [priceINR, setPriceINR] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [breakdown, setBreakdown] = useState<PriceBreakdown>({
    metalCost: 0,
    primaryStoneCost: 0,
    secondaryStoneCost: 0,
    otherStoneCost: 0,
    overhead: 0
  });
  
  // Convert form values to numbers safely
  const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate price
  useEffect(() => {
    // Don't calculate if required fields are missing
    if (!metalType || !metalWeight || metalType === "none_selected") {
      return;
    }

    const calculatePrice = async () => {
      try {
        setIsCalculating(true);
        
        // Prepare the request payload
        const metalWeightNum = safeParseFloat(metalWeight);
        const mainStoneWeightNum = safeParseFloat(mainStoneWeight);
        const secondaryStoneWeightNum = safeParseFloat(secondaryStoneWeight);
        const otherStoneWeightNum = safeParseFloat(otherStoneWeight);
        
        // Skip calculation if all weights are 0
        if (metalWeightNum <= 0 && mainStoneWeightNum <= 0 && secondaryStoneWeightNum <= 0 && otherStoneWeightNum <= 0) {
          setPriceUSD(0);
          setPriceINR(0);
          setBreakdown({
            metalCost: 0,
            primaryStoneCost: 0,
            secondaryStoneCost: 0,
            otherStoneCost: 0,
            overhead: 0
          });
          return;
        }
        
        // Prepare secondary stone with single type
        let secondaryStoneData = null;
        if (secondaryStoneType && secondaryStoneType !== "none_selected" && secondaryStoneWeightNum > 0) {
          secondaryStoneData = {
            stoneTypeId: secondaryStoneType,
            caratWeight: secondaryStoneWeightNum
          };
        }
        
        const requestData = {
          metalTypeId: metalType,
          metalWeight: metalWeightNum,
          primaryStone: mainStoneType !== "none_selected" ? {
            stoneTypeId: mainStoneType,
            caratWeight: mainStoneWeightNum
          } : null,
          secondaryStones: secondaryStoneData ? [secondaryStoneData] : null,
          otherStone: otherStoneType !== "none_selected" && otherStoneType !== "none" ? {
            stoneTypeId: otherStoneType,
            caratWeight: otherStoneWeightNum
          } : null
        };
        
        console.log("Price calculation request:", requestData);
        
        // Make API request
        const response = await apiRequest("POST", "/api/calculate-price", requestData);
        
        if (!response.ok) {
          throw new Error("Failed to calculate price");
        }
        
        const data = await response.json();
        console.log("Price calculation response:", data);
        
        if (!data.success) {
          throw new Error(data.message || "Failed to calculate price");
        }
        
        const priceData: { usd: PriceData, inr: PriceData } = data;
        
        // Update state with calculated prices
        setPriceUSD(priceData.usd.price);
        setPriceINR(priceData.inr.price);

        // Create complete breakdown - ensure all properties exist
        const completeBreakdown: PriceBreakdown = {
          metalCost: priceData.usd.breakdown?.metalCost || 0,
          primaryStoneCost: priceData.usd.breakdown?.primaryStoneCost || 0,
          secondaryStoneCost: priceData.usd.breakdown?.secondaryStoneCost || 0,
          otherStoneCost: priceData.usd.breakdown?.otherStoneCost || 0,
          overhead: priceData.usd.breakdown?.overhead || 0
        };
        
        setBreakdown(completeBreakdown);
        
      } catch (error) {
        console.error("Error calculating price:", error);
        toast({
          title: "Price Calculation Error",
          description: "Could not calculate price with the provided specifications",
          variant: "destructive"
        });
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce the calculation to avoid too many API calls
    const timer = setTimeout(() => {
      calculatePrice();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    metalType, 
    metalWeight, 
    mainStoneType, 
    mainStoneWeight, 
    secondaryStoneType, 
    secondaryStoneWeight, 
    otherStoneType,
    otherStoneWeight,
    toast
  ]);

  return {
    priceUSD,
    priceINR,
    isCalculating: isCalculating || isGoldPriceLoading || isExchangeRateLoading,
    breakdown,
    goldPrice,
    exchangeRate,
    goldPriceLocation: location,
    goldPriceTimestamp: timestamp,
    isGoldPriceLoading
  };
}