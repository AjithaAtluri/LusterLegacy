import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { METAL_TYPES, STONE_TYPES } from "@/lib/constants";
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
  initialStoneTypeId = "natural-diamond",
  metalWeight = 5
}: UsePriceCalculatorProps): UsePriceCalculatorReturn {
  // State for selected options
  const [metalTypeId, setMetalTypeId] = useState<string>(initialMetalTypeId);
  const [stoneTypeId, setStoneTypeId] = useState<string>(initialStoneTypeId);
  
  // Find the metal and stone information based on the selected IDs
  const selectedMetal = METAL_TYPES.find(metal => metal.id === metalTypeId);
  const selectedStone = STONE_TYPES.find(stone => stone.id === stoneTypeId);
  
  // Prepare gems array for the price calculation
  let gems: Gem[] = [];
  if (selectedStone) {
    // Add the selected stone with a default carat value based on product type
    let defaultCarats = 0.5; // Default for rings
    
    if (productType === "Necklace") defaultCarats = 1.0;
    else if (productType === "Bracelet") defaultCarats = 0.75;
    else if (productType === "Earrings") defaultCarats = 0.5;
    
    gems = [{ name: selectedStone.name, carats: defaultCarats }];
  }
  
  // Use React Query to fetch the price from the API
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "/api/calculate-price", 
      productType, 
      metalTypeId, 
      stoneTypeId, 
      metalWeight
    ],
    queryFn: async () => {
      // Create the request payload
      const payload = {
        productType,
        metalType: selectedMetal?.name || "18k Gold", // Fallback if metal not found
        metalWeight,
        primaryGems: gems
      };
      
      // Make the API request to calculate the price
      const response = await apiRequest("POST", "/api/calculate-price", payload);
      return await response.json();
    },
    enabled: !!selectedMetal && !!selectedStone, // Only run the query if we have valid selections
    refetchInterval: false, // Don't automatically refetch
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  // Default values in case the API call fails
  const priceUSD = data?.success ? data.priceUSD : 0;
  const priceINR = data?.success ? data.priceINR : 0;
  
  // Calculate the advance payment (50%) and remaining payment
  const advancePayment = Math.round(priceUSD * 0.5);
  const remainingPayment = priceUSD - advancePayment;
  
  return {
    metalTypeId,
    stoneTypeId,
    setMetalTypeId,
    setStoneTypeId,
    priceUSD,
    priceINR,
    isLoading,
    error: error ? (error as Error).message : null,
    advancePayment,
    remainingPayment
  };
}