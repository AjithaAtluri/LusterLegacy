import { useState, useEffect, useRef } from "react";
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
  preventCalculation?: boolean; // Flag to prevent automatic calculations
  manualCalculationOnly?: boolean; // Flag to allow only manual price calculations (no auto calculations)
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
  otherStoneWeight = "0",
  preventCalculation = false,
  manualCalculationOnly = false
}: UsePriceCalculatorProps) {
  const { toast } = useToast();
  const { goldPrice, isLoading: isGoldPriceLoading, location, timestamp } = useGoldPrice();
  const { exchangeRate, isLoading: isExchangeRateLoading } = useExchangeRate();
  
  // Use a ref to track if we've already calculated price for these parameters
  const calculatedParamsRef = useRef<string>('');
  // Use a ref to limit calculation to once per render cycle
  const calculationCountRef = useRef<number>(0);
  
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



  // Define a standalone function to calculate prices outside of useEffect
  const fetchPriceCalculation = async (forceCalculation = false) => {
    try {
      // To avoid multiple concurrent price calculations, check if we're already calculating
      if (isCalculating && !forceCalculation) {
        console.log("Price calculation already in progress, skipping duplicate request");
        return;
      }

      setIsCalculating(true);
      console.log("Starting price calculation for:", {
        metalType,
        metalWeight,
        mainStoneType,
        mainStoneWeight,
        secondaryStoneType,
        secondaryStoneWeight,
        otherStoneType,
        otherStoneWeight
      });
      
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
        secondaryStones: secondaryStoneData ? [secondaryStoneData] : [],
        otherStone: otherStoneType !== "none_selected" && otherStoneType !== "none" ? {
          stoneTypeId: otherStoneType,
          caratWeight: otherStoneWeightNum
        } : null
      };
      
      console.log(`Price calculation request${forceCalculation ? ' (forced)' : ''}:`, requestData);
      
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
        metalCost: priceData.inr.breakdown?.metalCost || 0,
        primaryStoneCost: priceData.inr.breakdown?.primaryStoneCost || 0,
        secondaryStoneCost: priceData.inr.breakdown?.secondaryStoneCost || 0,
        otherStoneCost: priceData.inr.breakdown?.otherStoneCost || 0,
        overhead: priceData.inr.breakdown?.overhead || 0
      };
      
      setBreakdown(completeBreakdown);
      
      // Create a hash of current parameters to avoid duplicate calculations
      const paramsHash = `${metalType}-${metalWeight}-${mainStoneType}-${mainStoneWeight}-${secondaryStoneType}-${secondaryStoneWeight}-${otherStoneType}-${otherStoneWeight}`;
      calculatedParamsRef.current = paramsHash;
      console.log("Price calculation successful, parameters cached:", paramsHash);
      
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

  // Function to manually trigger price calculation
  const calculatePrice = () => {
    // Force a new calculation
    fetchPriceCalculation(true);
    console.log("Manual price calculation triggered");
  };

  // Use a separate useEffect for automatic calculations with better dependency tracking
  useEffect(() => {
    // If manual calculation only is enabled, skip automatic calculation completely
    if (manualCalculationOnly) {
      console.log("Automatic price calculation disabled: manualCalculationOnly flag is set to true");
      return;
    }

    // Don't calculate if required fields are missing or calculation is prevented
    if (!metalType || !metalWeight || metalType === "none_selected" || preventCalculation) {
      console.log("Automatic price calculation skipped:", 
        !metalType ? "Missing metal type" : 
        !metalWeight ? "Missing metal weight" : 
        metalType === "none_selected" ? "No metal selected" : 
        "preventCalculation flag set to true");
      return;
    }
    
    // Create a hash of current parameters to avoid duplicate calculations
    const paramsHash = `${metalType}-${metalWeight}-${mainStoneType}-${mainStoneWeight}-${secondaryStoneType}-${secondaryStoneWeight}-${otherStoneType}-${otherStoneWeight}`;
    
    // If we've already calculated price for these parameters, don't recalculate
    if (calculatedParamsRef.current === paramsHash) {
      console.log("Automatic price calculation skipped: Parameters unchanged");
      return;
    }
    
    // Only perform this once
    calculatedParamsRef.current = paramsHash;
    
    // Debounce the calculation to avoid too many API calls
    const timer = setTimeout(() => {
      console.log("Executing debounced price calculation");
      fetchPriceCalculation();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [
    // Use a stable dependency array to prevent unnecessary recalculations
    metalType, 
    metalWeight, 
    mainStoneType, 
    mainStoneWeight, 
    secondaryStoneType, 
    secondaryStoneWeight, 
    otherStoneType,
    otherStoneWeight,
    preventCalculation,
    manualCalculationOnly
    // Remove toast from dependencies to avoid unnecessary recalculations
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
    isGoldPriceLoading,
    calculatePrice // Expose the function to manually trigger price calculation
  };
}