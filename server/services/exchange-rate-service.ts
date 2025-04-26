import axios from 'axios';
import { JSDOM } from 'jsdom';

// Cache the exchange rate for a period of time to avoid too many requests
let cachedExchangeRate: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_EXPIRY_MS = 3600000; // 1 hour

/**
 * Get the current USD to INR exchange rate from Xoom (PayPal)
 * Uses web scraping to get the current rate without requiring an API key
 */
export async function getUsdToInrRate(): Promise<number> {
  // Check if we have a fresh cached value
  const now = Date.now();
  if (cachedExchangeRate && (now - cacheTimestamp) < CACHE_EXPIRY_MS) {
    console.log('Using cached USD to INR exchange rate:', cachedExchangeRate);
    return cachedExchangeRate;
  }

  try {
    // Default fallback rate in case scraping fails
    let rate = 83;

    // Fetch the Xoom website to get the current exchange rate
    const response = await axios.get('https://www.xoom.com/india/send-money', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000, // 10 seconds timeout
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Try to extract the exchange rate from the page
    // Xoom shows exchange rates in various formats, we'll try a few selectors
    const rateElements = document.querySelectorAll('[data-v-exchange-rate]');
    if (rateElements.length > 0) {
      const rateText = rateElements[0].textContent || '';
      const rateMatch = rateText.match(/\d+(\.\d+)?/);
      if (rateMatch && rateMatch[0]) {
        rate = parseFloat(rateMatch[0]);
      }
    }

    // If the above selector doesn't work, try an alternative approach
    if (rate === 83) {
      const html = response.data;
      const rateRegex = /([0-9.]+)\s*INR/i;
      const match = html.match(rateRegex);
      if (match && match[1]) {
        rate = parseFloat(match[1]);
      }
    }

    // Validate the rate is reasonable
    if (rate < 50 || rate > 100) {
      console.warn('Exchange rate from Xoom seems invalid:', rate);
      rate = 83; // Fallback to a reasonable default
    } else {
      console.log('Successfully fetched USD to INR exchange rate from Xoom:', rate);
    }

    // Cache the result
    cachedExchangeRate = rate;
    cacheTimestamp = now;
    
    return rate;
  } catch (error) {
    console.error('Error fetching USD to INR exchange rate:', error);
    // Default fallback rate in case of error
    return 83;
  }
}

/**
 * Get the cached exchange rate or default
 */
export function getCachedExchangeRate(): number {
  return cachedExchangeRate || 83;
}

/**
 * Convert INR amount to USD using the current exchange rate
 */
export async function convertInrToUsd(amountInr: number): Promise<number> {
  const rate = await getUsdToInrRate();
  return Math.round(amountInr / rate);
}

/**
 * Convert USD amount to INR using the current exchange rate
 */
export async function convertUsdToInr(amountUsd: number): Promise<number> {
  const rate = await getUsdToInrRate();
  return Math.round(amountUsd * rate);
}