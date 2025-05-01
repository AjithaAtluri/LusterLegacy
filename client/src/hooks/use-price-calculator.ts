import { useState, useEffect } from "react";
import { calculatePrice } from "@/lib/utils";

interface UsePriceCalculatorProps {
  basePrice: number;
  initialMetalTypeId?: string;
  initialStoneTypeId?: string;
  initialCurrency?: string;
}

interface UsePriceCalculatorReturn {
  metalTypeId: string;
  stoneTypeId: string;
  currency: string;
  setMetalTypeId: (id: string) => void;
  setStoneTypeId: (id: string) => void;
  setCurrency: (currency: string) => void;
  currentPrice: number;
  advancePayment: number;
  remainingPayment: number;
}

export function usePriceCalculator({
  basePrice,
  initialMetalTypeId = "18kt-gold",
  initialStoneTypeId = "natural-polki",
  initialCurrency = "USD"
}: UsePriceCalculatorProps): UsePriceCalculatorReturn {
  const [metalTypeId, setMetalTypeId] = useState<string>(initialMetalTypeId);
  const [stoneTypeId, setStoneTypeId] = useState<string>(initialStoneTypeId);
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [currentPrice, setCurrentPrice] = useState<number>(basePrice);
  
  useEffect(() => {
    // Calculate base price in USD
    const calculatedPrice = calculatePrice(basePrice, metalTypeId, stoneTypeId);
    
    // Apply currency conversion if needed
    if (currency === "INR") {
      // Assume conversion rate is ~84 INR to 1 USD (will be refined with actual API)
      setCurrentPrice(Math.round(calculatedPrice * 84));
    } else {
      setCurrentPrice(calculatedPrice);
    }
  }, [basePrice, metalTypeId, stoneTypeId, currency]);
  
  // Calculate payments based on current price
  const advancePayment = Math.round(currentPrice * 0.5);
  const remainingPayment = currentPrice - advancePayment;
  
  return {
    metalTypeId,
    stoneTypeId,
    currency,
    setMetalTypeId,
    setStoneTypeId,
    setCurrency,
    currentPrice,
    advancePayment,
    remainingPayment
  };
}
