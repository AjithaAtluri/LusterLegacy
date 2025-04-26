import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

/**
 * A hook for fetching the calculated price of a product using the same
 * backend calculation logic as the admin panel.
 * 
 * @param productId The ID of the product to calculate price for
 * @returns Object containing the calculated price in USD and INR, and loading state
 */
export function useProductPrice(productId: number) {
  const [priceUSD, setPriceUSD] = useState<number>(0);
  const [priceINR, setPriceINR] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Call the backend API to get the calculated price
        const response = await apiRequest("GET", `/api/product-price/${productId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch product price");
        }
        
        const data = await response.json();
        setPriceUSD(data.usd.price || 0);
        setPriceINR(data.inr.price || 0);
      } catch (err) {
        console.error("Error fetching product price:", err);
        setError("Failed to calculate price");
        // Set fallback prices based on backend failure
        setPriceUSD(0);
        setPriceINR(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchPrice();
    }
  }, [productId]);

  return {
    priceUSD,
    priceINR,
    isLoading,
    error
  };
}