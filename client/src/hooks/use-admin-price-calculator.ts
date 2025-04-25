import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UsePriceCalculatorProps {
  // Input values for price calculation
  metalType: string;
  metalWeight: string;
  mainStoneType: string;
  mainStoneWeight: string;
  secondaryStoneTypes?: Array<{ id: number; name: string }>;
  secondaryStoneWeight?: string;
}

interface PriceData {
  price: number;
  currency: string;
  breakdown: {
    metalCost: number;
    primaryStoneCost: number;
    secondaryStoneCost: number;
    overhead: number;
  };
}

export function useAdminPriceCalculator({
  metalType,
  metalWeight,
  mainStoneType,
  mainStoneWeight,
  secondaryStoneTypes = [],
  secondaryStoneWeight = "0"
}: UsePriceCalculatorProps) {
  const { toast } = useToast();
  const [priceUSD, setPriceUSD] = useState<number>(0);
  const [priceINR, setPriceINR] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [breakdown, setBreakdown] = useState<{
    metalCost: number;
    primaryStoneCost: number;
    secondaryStoneCost: number;
    overhead: number;
  }>({
    metalCost: 0,
    primaryStoneCost: 0,
    secondaryStoneCost: 0,
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
        
        // Skip calculation if all weights are 0
        if (metalWeightNum <= 0 && mainStoneWeightNum <= 0 && secondaryStoneWeightNum <= 0) {
          setPriceUSD(0);
          setPriceINR(0);
          setBreakdown({
            metalCost: 0,
            primaryStoneCost: 0,
            secondaryStoneCost: 0,
            overhead: 0
          });
          return;
        }
        
        // Map secondary stone types to required format
        const mappedSecondaryStones = secondaryStoneTypes.map(stone => ({
          stoneTypeId: stone.id.toString(),
          caratWeight: secondaryStoneWeightNum / (secondaryStoneTypes.length || 1) // Distribute weight evenly
        }));
        
        const requestData = {
          metalTypeId: metalType,
          metalWeight: metalWeightNum,
          primaryStone: mainStoneType !== "none_selected" ? {
            stoneTypeId: mainStoneType,
            caratWeight: mainStoneWeightNum
          } : null,
          secondaryStones: mappedSecondaryStones.length > 0 ? mappedSecondaryStones : null
        };
        
        console.log("Price calculation request:", requestData);
        
        // Make API request
        const response = await apiRequest("POST", "/api/calculate-price", requestData);
        
        if (!response.ok) {
          throw new Error("Failed to calculate price");
        }
        
        const priceData: { usd: PriceData, inr: PriceData } = await response.json();
        console.log("Price calculation response:", priceData);
        
        // Update state with calculated prices
        setPriceUSD(priceData.usd.price);
        setPriceINR(priceData.inr.price);
        setBreakdown({
          metalCost: priceData.usd.breakdown.metalCost,
          primaryStoneCost: priceData.usd.breakdown.primaryStoneCost,
          secondaryStoneCost: priceData.usd.breakdown.secondaryStoneCost,
          overhead: priceData.usd.breakdown.overhead
        });
        
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
    secondaryStoneTypes, 
    secondaryStoneWeight, 
    toast
  ]);

  return {
    priceUSD,
    priceINR,
    isCalculating,
    breakdown
  };
}