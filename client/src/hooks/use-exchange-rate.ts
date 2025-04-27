import { useQuery } from "@tanstack/react-query";

// Hook for fetching current USD to INR exchange rate
export function useExchangeRate() {
  const { data: exchangeRate, isLoading, error } = useQuery({
    queryKey: ["/api/exchange-rate"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rate");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rate");
      }
      const data = await response.json();
      return data.rate;
    },
    // Cache the exchange rate for 1 hour (it doesn't change that frequently)
    staleTime: 60 * 60 * 1000,
    // If the request fails, retry 3 times
    retry: 3,
    // If we can't get the exchange rate, use a fallback value
    // (This ensures the UI doesn't break if the API is down)
    placeholderData: 83,
  });

  return {
    exchangeRate: exchangeRate || 83, // Fallback to 83 if no data
    isLoading,
    error,
  };
}