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
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
    refetchOnWindowFocus: false,
  });
  
  return {
    goldPrice: data?.price,
    location: data?.location || 'Hyderabad, India',
    timestamp: data?.timestamp ? new Date(data.timestamp) : new Date(),
    isLoading,
    error: error as Error | null,
    isError: !!error
  };
}