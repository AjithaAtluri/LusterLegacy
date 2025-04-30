import { useQuery } from "@tanstack/react-query";

interface GoldPriceResponse {
  success: boolean;
  price?: number;
  timestamp?: number;
  location?: string;
  error?: string;
}

/**
 * Hook to fetch the current gold price from Hyderabad, India
 * Returns price per gram in INR for 24K gold
 */
export function useGoldPrice() {
  const { 
    data,
    isLoading,
    error
  } = useQuery<GoldPriceResponse>({
    queryKey: ['/api/gold-price'],
    // Refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Keep data valid for 10 minutes
    staleTime: 10 * 60 * 1000
  });
  
  return {
    goldPrice: data?.price,
    location: data?.location,
    timestamp: data?.timestamp,
    isLoading,
    error: error || (data?.error ? new Error(data.error) : undefined)
  };
}