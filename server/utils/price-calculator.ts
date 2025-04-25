/**
 * Jewelry Price Calculator using database metal and stone values
 * Calculates prices based on: 
 * 1. Metal weight * 24k gold price * metal type modifier
 * 2. Stone carats * per-carat price for each stone
 * 3. Applies 25% overhead
 */

import { storage } from "../storage";

interface Gem {
  name: string;
  carats?: number;
  stoneTypeId?: number; // Stone type ID from the database
}

interface PriceCalculationParams {
  productType: string;
  metalType: string;
  metalTypeId?: number; // Metal type ID from the database
  metalWeight: number;
  primaryGems?: Gem[];
}

// Base price of 24k gold per gram in INR (2025 rates)
const GOLD_24K_PRICE_PER_GRAM_INR = 7500;

// USD to INR conversion rate
const USD_TO_INR_RATE = 83;

export async function calculateJewelryPrice(params: PriceCalculationParams): Promise<{
  priceUSD: number;
  priceINR: number;
  breakdown?: {
    metalCost: number;
    stoneCost: number;
    overhead: number;
  };
}> {
  try {
    const { metalType, metalWeight, primaryGems = [] } = params;
    
    // 1. Get metal price modifier from DB or use fallback method
    let metalPriceModifier = 0;
    
    // Try to get metal type from database by ID first
    if (params.metalTypeId) {
      const metalTypeData = await storage.getMetalTypeById(params.metalTypeId);
      if (metalTypeData?.priceModifier) {
        metalPriceModifier = metalTypeData.priceModifier / 100; // Convert percentage to decimal
      }
    }
    
    // Fallback: If no modifier found, estimate based on name
    if (!metalPriceModifier) {
      if (metalType.toLowerCase().includes('24k') || metalType.toLowerCase().includes('24 k')) {
        metalPriceModifier = 1.0;
      } else if (metalType.toLowerCase().includes('22k') || metalType.toLowerCase().includes('22 k')) {
        metalPriceModifier = 0.91;
      } else if (metalType.toLowerCase().includes('18k') || metalType.toLowerCase().includes('18 k')) {
        metalPriceModifier = 0.75;
      } else if (metalType.toLowerCase().includes('14k') || metalType.toLowerCase().includes('14 k')) {
        metalPriceModifier = 0.58;
      } else {
        // Default to 18K if can't determine
        metalPriceModifier = 0.75;
      }
    }
    
    // Calculate metal cost: grams * 24k price * metal modifier
    const metalCost = metalWeight * GOLD_24K_PRICE_PER_GRAM_INR * metalPriceModifier;
    
    // 2. Calculate stone costs by summing each stone's carat * per-carat price
    let stoneCost = 0;
    
    for (const gem of primaryGems) {
      // Default carat weight if not provided
      const carats = gem.carats || 0.5;
      let perCaratPrice = 0;
      
      // Try to get stone price from database by ID first
      if (gem.stoneTypeId) {
        const stoneTypeData = await storage.getStoneTypeById(gem.stoneTypeId);
        if (stoneTypeData?.priceModifier) {
          perCaratPrice = stoneTypeData.priceModifier;
        }
      }
      
      // Fallback: If no price found, estimate based on name
      if (!perCaratPrice) {
        perCaratPrice = await getGemPricePerCaratFromName(gem.name);
      }
      
      stoneCost += carats * perCaratPrice;
    }
    
    // 3. Calculate total with 25% overhead
    const baseCost = metalCost + stoneCost;
    const overhead = baseCost * 0.25;
    const totalPriceINR = Math.round(baseCost + overhead);
    
    // Convert to USD
    const priceUSD = Math.round(totalPriceINR / USD_TO_INR_RATE);
    
    return {
      priceINR: totalPriceINR,
      priceUSD,
      breakdown: {
        metalCost: Math.round(metalCost),
        stoneCost: Math.round(stoneCost),
        overhead: Math.round(overhead)
      }
    };
  } catch (error) {
    console.error("Error calculating jewelry price:", error);
    // Return fallback price if calculation fails
    return {
      priceINR: 95000,
      priceUSD: 1200
    };
  }
}

/**
 * Estimate gem price per carat based on name when database value not available
 */
async function getGemPricePerCaratFromName(gemName: string): Promise<number> {
  try {
    // Try to find in database first
    const stoneTypes = await storage.getAllStoneTypes();
    const matchingStone = stoneTypes.find(st => 
      gemName.toLowerCase().includes(st.name.toLowerCase())
    );
    
    if (matchingStone?.priceModifier) {
      return matchingStone.priceModifier;
    }
  } catch (error) {
    console.error("Error querying stone types:", error);
  }
  
  // Fallback based on name if database query fails
  const name = (gemName || '').toLowerCase();
  
  // Diamond pricing
  if (name.includes('diamond')) {
    if (name.includes('lab') || name.includes('synthetic')) {
      return 20000; // Lab-grown diamonds
    }
    return 56000; // Natural diamonds
  }
  
  // Polki
  if (name.includes('polki')) {
    if (name.includes('lab')) {
      return 7000; // Lab polki
    }
    return 15000; // Natural polki
  }
  
  // Precious gems
  if (name.includes('ruby')) return 3000;
  if (name.includes('sapphire')) return 3000;
  if (name.includes('emerald')) return 3500;
  if (name.includes('tanzanite')) return 1500;
  
  // Semi-precious 
  if (name.includes('amethyst') || name.includes('quartz') || name.includes('morganite')) return 1500;
  
  // Pearls
  if (name.includes('pearl')) {
    if (name.includes('south sea')) {
      return 300; // South sea pearls
    }
    return 100; // Standard pearls
  }
  
  // CZ and similar
  if (name.includes('cz') || name.includes('swarovski')) return 1000;
  
  return 500; // Default for other stones
}

/**
 * Sample calculation for demo purposes
 */
export function getSamplePriceCalculation(): string {
  const sample = {
    productName: "Elegant Diamond Necklace",
    metalType: "18k Yellow Gold",
    metalWeight: 12, // grams
    stones: [
      { name: "Natural Diamond", carats: 2.5 }
    ]
  };
  
  // Sample calculation
  const metalCost = sample.metalWeight * GOLD_24K_PRICE_PER_GRAM_INR * 0.75;
  const stoneCost = 2.5 * 56000; // Natural diamond at ₹56,000 per carat
  const baseCost = metalCost + stoneCost;
  const overhead = baseCost * 0.25;
  const totalPrice = baseCost + overhead;
  
  return `
Sample Price Calculation for "${sample.productName}":

1. Metal Cost: 
   ${sample.metalWeight} grams × ₹${GOLD_24K_PRICE_PER_GRAM_INR} (24K gold price) × ${0.75} (18K modifier)
   = ₹${metalCost.toLocaleString('en-IN')}

2. Stone Cost:
   ${sample.stones[0].carats} carats × ₹${56000}/carat (Natural Diamond)
   = ₹${stoneCost.toLocaleString('en-IN')}

3. Base Cost:
   ₹${metalCost.toLocaleString('en-IN')} + ₹${stoneCost.toLocaleString('en-IN')}
   = ₹${baseCost.toLocaleString('en-IN')}

4. Overhead (25%):
   ₹${baseCost.toLocaleString('en-IN')} × 0.25
   = ₹${overhead.toLocaleString('en-IN')}

5. Total Price:
   ₹${baseCost.toLocaleString('en-IN')} + ₹${overhead.toLocaleString('en-IN')}
   = ₹${totalPrice.toLocaleString('en-IN')}

6. USD Equivalent (approx.):
   ₹${totalPrice.toLocaleString('en-IN')} ÷ ${USD_TO_INR_RATE}
   = $${(totalPrice / USD_TO_INR_RATE).toLocaleString('en-US', {maximumFractionDigits: 0})}
`;
}