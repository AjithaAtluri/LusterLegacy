import { useState, useEffect } from "react";
import { calculatePrice } from "@/lib/utils";

interface UsePriceCalculatorProps {
  basePrice: number;
  initialMetalTypeId?: string;
  initialStoneTypeId?: string;
}

interface UsePriceCalculatorReturn {
  metalTypeId: string;
  stoneTypeId: string;
  setMetalTypeId: (id: string) => void;
  setStoneTypeId: (id: string) => void;
  currentPrice: number;
  advancePayment: number;
  remainingPayment: number;
}

export function usePriceCalculator({
  basePrice,
  initialMetalTypeId = "18kt-gold",
  initialStoneTypeId = "natural-polki"
}: UsePriceCalculatorProps): UsePriceCalculatorReturn {
  const [metalTypeId, setMetalTypeId] = useState<string>(initialMetalTypeId);
  const [stoneTypeId, setStoneTypeId] = useState<string>(initialStoneTypeId);
  const [currentPrice, setCurrentPrice] = useState<number>(basePrice);
  
  useEffect(() => {
    const calculatedPrice = calculatePrice(basePrice, metalTypeId, stoneTypeId);
    setCurrentPrice(calculatedPrice);
  }, [basePrice, metalTypeId, stoneTypeId]);
  
  const advancePayment = Math.round(currentPrice * 0.5);
  const remainingPayment = currentPrice - advancePayment;
  
  return {
    metalTypeId,
    stoneTypeId,
    setMetalTypeId,
    setStoneTypeId,
    currentPrice,
    advancePayment,
    remainingPayment
  };
}
