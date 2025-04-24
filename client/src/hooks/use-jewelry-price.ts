import { useState, useEffect } from "react";
import { getMetalType, getStoneType } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface Gem {
  name: string;
  carats?: number;
}

interface UsePriceCalculatorProps {
  productType: string;
  initialMetalTypeId?: string;
  initialStoneTypeId?: string;
  metalWeight?: number;
}

interface UsePriceCalculatorReturn {
  metalTypeId: string;
  stoneTypeId: string;
  setMetalTypeId: (id: string) => void;
  setStoneTypeId: (id: string) => void;
  priceUSD: number;
  priceINR: number;
  isLoading: boolean;
  error: string | null;
  advancePayment: number;
  remainingPayment: number;
}

/**
 * Custom hook for calculating jewelry prices based on the 2025 market rates
 * Uses the same price calculator as the server, ensuring consistency
 */
export function useJewelryPrice({
  productType,
  initialMetalTypeId = "18kt-gold",
  initialStoneTypeId = "natural-polki",
  metalWeight = 5,
}: UsePriceCalculatorProps): UsePriceCalculatorReturn {
  const [metalTypeId, setMetalTypeId] = useState<string>(initialMetalTypeId);
  const [stoneTypeId, setStoneTypeId] = useState<string>(initialStoneTypeId);
  const [priceUSD, setPriceUSD] = useState<number>(0);
  const [priceINR, setPriceINR] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get the actual metal type name from the ID
    const metalType = getMetalType(metalTypeId);
    const stoneType = getStoneType(stoneTypeId);
    
    // Create primary gem from the selected stone
    const primaryGems: Gem[] = [
      {
        name: stoneType.name,
        carats: 1.0 // Default to 1 carat
      }
    ];
    
    // Call the server to calculate the price based on the current market rates
    const calculatePrice = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiRequest("POST", "/api/calculate-price", {
          productType,
          metalType: metalType.name,
          metalWeight,
          primaryGems
        });
        
        const data = await response.json();
        
        if (data.priceUSD && data.priceINR) {
          setPriceUSD(data.priceUSD);
          setPriceINR(data.priceINR);
        } else {
          // Fallback to client-side calculation if server doesn't respond with prices
          setPriceUSD(1500); // Default base price in USD
          setPriceINR(112500); // Default base price in INR
          setError("Could not get precise pricing, showing estimates");
        }
      } catch (err) {
        console.error("Error calculating price:", err);
        setError("Failed to calculate price");
        
        // Fallback to default prices
        setPriceUSD(1500);
        setPriceINR(112500);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculatePrice();
  }, [productType, metalTypeId, stoneTypeId, metalWeight]);
  
  // Calculate advance payment (50%)
  const advancePayment = Math.round(priceINR * 0.5);
  const remainingPayment = priceINR - advancePayment;
  
  return {
    metalTypeId,
    stoneTypeId,
    setMetalTypeId,
    setStoneTypeId,
    priceUSD,
    priceINR,
    isLoading,
    error,
    advancePayment,
    remainingPayment
  };
}