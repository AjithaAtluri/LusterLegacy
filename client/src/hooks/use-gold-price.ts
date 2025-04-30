import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface GoldPriceResponse {
  success: boolean;
  price?: number;
  timestamp?: number;
  location?: string;
  error?: string;
  message?: string;
}

/**
 * Hook to fetch the current gold price from Hyderabad, India
 * Returns price per gram in INR for 24K gold
 * 
 * Features:
 * - Auto-refresh every 5 minutes
 * - Manual refresh capability
 * - Force update from all sources
 */
export function useGoldPrice() {
  const queryClient = useQueryClient();
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);
  
  const { 
    data,
    isLoading: isQueryLoading,
    error,
    refetch
  } = useQuery<GoldPriceResponse>({
    queryKey: ['/api/gold-price'],
    // Refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Keep data valid for 10 minutes
    staleTime: 10 * 60 * 1000
  });
  
  /**
   * Force refresh gold price from all sources
   * Uses the /api/gold-price/force-update endpoint
   */
  const forceRefresh = async () => {
    try {
      setIsForceRefreshing(true);
      
      // Call the force-update endpoint which bypasses cache and tries all sources
      const response = await fetch('/api/gold-price/force-update');
      const freshData = await response.json();
      
      // Update the query cache with the fresh data
      queryClient.setQueryData(['/api/gold-price'], freshData);
      
      return freshData;
    } catch (err) {
      console.error('Failed to force refresh gold price:', err);
      throw err;
    } finally {
      setIsForceRefreshing(false);
    }
  };
  
  // Standard refresh (uses cache policy)
  const refresh = async () => {
    return refetch();
  };
  
  const isLoading = isQueryLoading || isForceRefreshing;
  
  return {
    goldPrice: data?.price,
    location: data?.location,
    timestamp: data?.timestamp,
    isLoading,
    isForceRefreshing,
    error: error || (data?.error ? new Error(data.error) : undefined),
    refresh,
    forceRefresh
  };
}