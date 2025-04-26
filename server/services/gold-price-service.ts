import axios from 'axios';

interface GoldPriceResponse {
  success: boolean;
  price?: number;
  timestamp?: number;
  location?: string;
  error?: string;
}

// Cache for gold price (to avoid frequent API calls)
let cachedGoldPrice: number = 7500; // Default value
let cachedTimestamp: number = Date.now();

/**
 * Fetch current gold price in Hyderabad, India
 * Returns price per gram in INR for 24K gold
 */
export async function fetchGoldPrice(): Promise<GoldPriceResponse> {
  try {
    // This is a simulated API call for demonstration
    // In a production environment, replace this with a call to a real gold price API
    
    // Simulating network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate a realistic price with small fluctuations around 9800 INR/gram (updated price)
    // In a real implementation, this would be fetched from an actual API
    const basePrice = 9800;
    const fluctuation = Math.random() * 300 - 150; // +/- 150 INR
    const currentPrice = Math.round(basePrice + fluctuation);
    
    // Update cache
    cachedGoldPrice = currentPrice;
    cachedTimestamp = Date.now();
    
    return {
      success: true,
      price: currentPrice,
      timestamp: cachedTimestamp,
      location: 'Hyderabad, India'
    };
    
    /* 
    // Real implementation would look like this:
    const response = await axios.get('https://api.example.com/gold-price/india/hyderabad');
    const price = response.data.price_per_gram_inr;
    
    // Update cache
    cachedGoldPrice = price;
    cachedTimestamp = Date.now();
    
    return {
      success: true,
      price: price,
      timestamp: cachedTimestamp,
      location: 'Hyderabad, India'
    };
    */
    
  } catch (error) {
    console.error('Error fetching gold price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getGoldPrice(): Promise<GoldPriceResponse> {
  // If cache is less than 1 hour old, return cached value
  const cacheAge = Date.now() - cachedTimestamp;
  if (cachedGoldPrice && cacheAge < 60 * 60 * 1000) {
    return {
      success: true,
      price: cachedGoldPrice,
      timestamp: cachedTimestamp,
      location: 'Hyderabad, India'
    };
  }
  
  // Otherwise fetch fresh data
  return fetchGoldPrice();
}

/**
 * Get cached gold price immediately without network request
 * For use in non-critical contexts where speed is more important than accuracy
 */
export function getCachedGoldPrice(): number {
  return cachedGoldPrice;
}