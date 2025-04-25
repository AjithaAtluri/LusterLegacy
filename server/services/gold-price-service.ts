import axios from 'axios';

interface GoldPriceResponse {
  success: boolean;
  price?: number;
  timestamp?: number;
  location?: string;
  error?: string;
}

// Gold price in INR per gram (24K)
// Default price if API call fails
const DEFAULT_GOLD_PRICE_INR = 7500; 

/**
 * Fetch current gold price in Hyderabad, India
 * Returns price per gram in INR for 24K gold
 */
export async function fetchGoldPrice(): Promise<GoldPriceResponse> {
  try {
    // You would typically call a real gold price API here
    // For now, we're using cached data
    // This is where we'd make the actual API call to a gold price service
    
    // Note: In a production app, you would use a real API with appropriate
    // API keys (such as gold-api.com, metals-api.com, or a similar service)
    
    // Mocked response with current price
    // In a real implementation, this would make an API call:
    // const response = await axios.get("https://api.example.com/gold-price/india/hyderabad", {
    //   headers: { "Authorization": `Bearer ${process.env.GOLD_API_KEY}` }
    // });
    
    // For demo purposes, use our static price with slight random variation
    // to simulate market fluctuations
    const variation = Math.random() * 100 - 50; // +/- 50 rupees
    const currentPrice = Math.round(DEFAULT_GOLD_PRICE_INR + variation);
    
    console.log(`Current gold price in Hyderabad: ₹${currentPrice} per gram (24K)`);
    
    return {
      success: true,
      price: currentPrice,
      timestamp: Date.now(),
      location: 'Hyderabad, India'
    };
  } catch (error) {
    console.error('Error fetching gold price:', error);
    return {
      success: false,
      price: DEFAULT_GOLD_PRICE_INR, // Fallback price
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Cache gold price for 1 hour to reduce API calls
let cachedPrice: GoldPriceResponse | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get gold price with caching
 */
export async function getGoldPrice(): Promise<GoldPriceResponse> {
  const now = Date.now();
  
  // If we have a cached price that's still fresh, use it
  if (cachedPrice && (now - cacheTime < CACHE_DURATION)) {
    return cachedPrice;
  }
  
  // Otherwise fetch a fresh price
  const freshPrice = await fetchGoldPrice();
  
  // Cache the result if successful
  if (freshPrice.success) {
    cachedPrice = freshPrice;
    cacheTime = now;
  }
  
  return freshPrice;
}

/**
 * Get cached gold price immediately without network request
 * For use in non-critical contexts where speed is more important than accuracy
 */
export function getCachedGoldPrice(): number {
  if (cachedPrice && cachedPrice.success && cachedPrice.price) {
    return cachedPrice.price;
  }
  return DEFAULT_GOLD_PRICE_INR;
}