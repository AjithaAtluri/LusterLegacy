import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface ExchangeRateResponse {
  success: boolean;
  rate: number;
  source: string;
  timestamp: string;
  fallbackRate?: number;
}

/**
 * A hook to fetch the current USD to INR exchange rate
 * This uses the server's exchange rate service which provides cached values if the API is unavailable
 */
export function useExchangeRate() {
  const { data, isLoading, error } = useQuery<ExchangeRateResponse>({
    queryKey: ["/api/exchange-rate"],
    refetchInterval: 3600000, // Refetch every hour
    staleTime: 3600000, // Consider data fresh for an hour
  });

  // Default exchange rate if API call fails
  const DEFAULT_EXCHANGE_RATE = 83;
  
  return {
    // If data exists and was successful, use the rate, otherwise use the fallback or default
    exchangeRate: data?.success ? data.rate : (data?.fallbackRate || DEFAULT_EXCHANGE_RATE),
    source: data?.source || "default",
    timestamp: data?.timestamp,
    isLoading,
    error
  };
}