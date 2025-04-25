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
    // Refresh every hour
    refetchInterval: 60 * 60 * 1000,
    // Keep data valid for 2 hours
    staleTime: 2 * 60 * 60 * 1000
  });
  
  return {
    goldPrice: data?.price,
    location: data?.location,
    timestamp: data?.timestamp,
    isLoading,
    error: error || (data?.error ? new Error(data.error) : undefined)
  };
}