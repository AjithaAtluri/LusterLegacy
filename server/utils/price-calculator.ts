/**
 * Jewelry Price Calculator using database metal and stone values
 * Calculates prices based on: 
 * 1. Metal weight * 24k gold price * metal type modifier
 * 2. Stone carats * stone-specific price per carat from database
 * 3. Applies 25% overhead
 */

import { storage } from "../storage";
import { getCachedGoldPrice, getGoldPrice } from "../services/gold-price-service";
import { getCachedExchangeRate, getUsdToInrRate } from "../services/exchange-rate-service";

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
  otherStone?: {
    stoneTypeId?: number | string;
    caratWeight?: number;
  };
}

// Fallback price of 24k gold per gram in INR (2025 rates) - will be replaced with real value
const DEFAULT_GOLD_24K_PRICE_PER_GRAM_INR = 9800; // Consistent with gold-price-service.ts fallback

/**
 * Calculate jewelry price based on individual parameters (legacy/compatibility method)
 */
export async function calculateJewelryPrice(
  basePrice: number,
  metalType: string,
  metalWeight: string | number,
  mainStoneType?: string,
  mainStoneWeight?: string | number,
  secondaryStoneType?: string,
  secondaryStoneWeight?: string | number
): Promise<{
  priceUSD: number;
  priceINR: number;
  exchangeRate?: number;
  breakdown?: {
    metalCost: number;
    stoneCost: number;
    overhead: number;
    stones?: Array<{name: string, carats: number, price: number, totalCost: number}>;
  };
}>;

/**
 * Calculate jewelry price based on PriceCalculationParams object (main implementation)
 */
export async function calculateJewelryPrice(params: PriceCalculationParams): Promise<{
  priceUSD: number;
  priceINR: number;
  exchangeRate?: number;
  breakdown?: {
    metalCost: number;
    stoneCost: number;
    overhead: number;
    stones?: Array<{name: string, carats: number, price: number, totalCost: number}>;
  };
}>;

// Implementation
export async function calculateJewelryPrice(
  paramsOrBasePrice: PriceCalculationParams | number,
  metalType?: string,
  metalWeight?: string | number,
  mainStoneType?: string,
  mainStoneWeight?: string | number,
  secondaryStoneType?: string,
  secondaryStoneWeight?: string | number
): Promise<{
  priceUSD: number;
  priceINR: number;
  exchangeRate?: number;
  breakdown?: {
    metalCost: number;
    stoneCost: number;
    overhead: number;
    stones?: Array<{name: string, carats: number, price: number, totalCost: number}>;
  };
}> {
  // Convert legacy parameters to PriceCalculationParams object if needed
  let params: PriceCalculationParams;
  
  if (typeof paramsOrBasePrice === 'number') {
    // Handle legacy parameter format
    console.log('Using legacy parameter format for calculateJewelryPrice');
    
    // Parse metal weight
    const numericMetalWeight = typeof metalWeight === 'string' 
      ? parseFloat(metalWeight) || 0 
      : (metalWeight || 0);
      
    // Calculate based on individual parameters
    params = {
      productType: "jewelry", // Default product type
      metalType: metalType || "",
      metalWeight: numericMetalWeight,
      primaryGems: [] // Initialize as empty array
    };
    
    // Add main stone if available
    if (mainStoneType) {
      const mainStoneCarat = typeof mainStoneWeight === 'string'
        ? parseFloat(mainStoneWeight) || 0
        : (mainStoneWeight || 0);
        
      // Ensure primaryGems array exists before pushing
      if (!params.primaryGems) {
        params.primaryGems = [];
      }
      params.primaryGems.push({
        name: mainStoneType,
        carats: mainStoneCarat
      });
    }
    
    // Add secondary stone if available
    if (secondaryStoneType) {
      const secondaryStoneCarat = typeof secondaryStoneWeight === 'string'
        ? parseFloat(secondaryStoneWeight) || 0
        : (secondaryStoneWeight || 0);
        
      // Ensure primaryGems array exists before pushing
      if (!params.primaryGems) {
        params.primaryGems = [];
      }
      params.primaryGems.push({
        name: secondaryStoneType,
        carats: secondaryStoneCarat
      });
    }
  } else {
    // Use provided PriceCalculationParams object
    params = paramsOrBasePrice;
  }
  
  // Main implementation continues below
  try {
    const { metalType, metalWeight, primaryGems = [] } = params;
    
    // 1. Get metal price modifier from DB or use fallback method
    let metalPriceModifier = 0;
    
    // Try to get metal type from database by ID first
    if (params.metalTypeId) {
      let metalTypeData;
      if (typeof params.metalTypeId === 'number') {
        metalTypeData = await storage.getMetalTypeById(params.metalTypeId);
      } else {
        // If metalTypeId is a string, it might be a name or ID
        const metalTypes = await storage.getAllMetalTypes();
        const metalTypeIdStr = String(params.metalTypeId);
        metalTypeData = metalTypes.find(mt => 
          (mt.id !== undefined && String(mt.id) === metalTypeIdStr) || 
          (mt.name && mt.name.toLowerCase() === metalTypeIdStr.toLowerCase())
        );
      }
      if (metalTypeData?.priceModifier) {
        metalPriceModifier = metalTypeData.priceModifier / 100; // Convert percentage to decimal
      }
    }
    
    // Fallback: If no modifier found, estimate based on name
    if (!metalPriceModifier) {
      // Special case: Commercial Metal should have zero cost
      if (metalType.toLowerCase().includes('commercial') || metalType.toLowerCase() === 'commercial metal') {
        metalPriceModifier = 0; // Set to zero for no cost
        console.log('Commercial Metal detected - setting price modifier to 0');
      } else if (metalType.toLowerCase().includes('24k') || metalType.toLowerCase().includes('24 k')) {
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
    
    // 2. Get the current gold price from Hyderabad, India
    // Try to get a fresh price, with fallback to cached or default price
    let goldPriceINR = DEFAULT_GOLD_24K_PRICE_PER_GRAM_INR;
    
    try {
      // First try to get real-time price
      const goldPriceResponse = await getGoldPrice();
      if (goldPriceResponse.success && goldPriceResponse.price) {
        goldPriceINR = goldPriceResponse.price;
        console.log(`Using real-time gold price from Hyderabad: ₹${goldPriceINR} per gram (24K)`);
      } else {
        // If API call fails, use cached price
        goldPriceINR = getCachedGoldPrice();
        console.log(`Using cached gold price: ₹${goldPriceINR} per gram (24K)`);
      }
    } catch (err) {
      // If all fails, use default price
      console.error("Error fetching gold price, using default:", err);
      goldPriceINR = DEFAULT_GOLD_24K_PRICE_PER_GRAM_INR;
    }
    
    // Calculate metal cost: grams * 24k price * metal modifier
    const metalCost = metalWeight * goldPriceINR * metalPriceModifier;
    
    // 2. Calculate stone costs by summing each stone's carat * per-carat price
    let stoneCost = 0;
    
    // This array stores detailed cost information for each gem
    const gemCosts: {name: string, carats: number, price: number, totalCost: number}[] = [];
    
    // Process primary gems
    for (const gem of primaryGems) {
      // Default carat weight if not provided
      const carats = gem.carats || 0.5;
      let perCaratPrice = 0;
      let stoneTypeName = "";
      
      // Try to get stone price from database by ID first (prioritize database values)
      if (gem.stoneTypeId) {
        let stoneTypeData;
        if (typeof gem.stoneTypeId === 'number') {
          // Direct lookup by ID
          stoneTypeData = await storage.getStoneTypeById(gem.stoneTypeId);
          console.log(`Looking up stone by ID ${gem.stoneTypeId}`);
        } else {
          // If stoneTypeId is a string, it might be a name or ID
          const stoneTypes = await storage.getAllStoneTypes();
          const stoneTypeIdStr = String(gem.stoneTypeId);
          
          console.log(`Looking up stone by string ID/name "${stoneTypeIdStr}"`);
          
          // First try exact ID match
          stoneTypeData = stoneTypes.find(st => st.id !== undefined && String(st.id) === stoneTypeIdStr);
          
          // If no match, try by name
          if (!stoneTypeData) {
            stoneTypeData = stoneTypes.find(st => 
              st.name && st.name.toLowerCase() === stoneTypeIdStr.toLowerCase()
            );
          }
          
          // Still no match, try partial name match
          if (!stoneTypeData) {
            stoneTypeData = stoneTypes.find(st => 
              st.name && stoneTypeIdStr.toLowerCase().includes(st.name.toLowerCase())
            );
          }
        }
        
        if (stoneTypeData) {
          stoneTypeName = stoneTypeData.name;
          // Use the specific price modifier for this stone type from DB
          perCaratPrice = stoneTypeData.priceModifier;
          console.log(`Using database stone price for ${stoneTypeName}: ₹${perCaratPrice} per carat`);
        } else {
          console.log(`Stone with ID/name "${gem.stoneTypeId}" not found in database`);
        }
      }
      
      // If we have a name but no stoneTypeId, try to find it in the database by name
      if (!perCaratPrice && gem.name) {
        try {
          console.log(`Searching database for stone type by name: "${gem.name}"`);
          const stoneTypes = await storage.getAllStoneTypes();
          
          // Try exact name match
          const matchingStone = stoneTypes.find(st => 
            st.name && st.name.toLowerCase() === gem.name.toLowerCase()
          );
          
          // If no exact match, try partial name match
          if (!matchingStone) {
            const partialMatch = stoneTypes.find(st => 
              st.name && (
                gem.name.toLowerCase().includes(st.name.toLowerCase()) ||
                st.name.toLowerCase().includes(gem.name.toLowerCase())
              )
            );
            
            if (partialMatch) {
              stoneTypeName = partialMatch.name;
              perCaratPrice = partialMatch.priceModifier;
              console.log(`Using database price for partially matched stone "${stoneTypeName}": ₹${perCaratPrice} per carat`);
            }
          } else {
            stoneTypeName = matchingStone.name;
            perCaratPrice = matchingStone.priceModifier;
            console.log(`Using database price for exact matched stone "${stoneTypeName}": ₹${perCaratPrice} per carat`);
          }
        } catch (error) {
          console.error("Error searching stone types by name:", error);
        }
      }
      
      // Last resort fallback: If still no price found from database, estimate based on name
      if (!perCaratPrice) {
        stoneTypeName = gem.name || "Unknown Stone";
        perCaratPrice = await getGemPricePerCaratFromName(gem.name);
        console.log(`Using fallback stone price for ${stoneTypeName}: ₹${perCaratPrice} per carat`);
      }
      
      // Calculate this gem's cost contribution
      const thisGemCost = carats * perCaratPrice;
      stoneCost += thisGemCost;
      
      // Store the detailed cost info for this gem
      gemCosts.push({
        name: stoneTypeName || gem.name || "Unknown Stone",
        carats: carats,
        price: perCaratPrice,
        totalCost: thisGemCost
      });
    }
    
    // Process otherStone if provided
    if (params.otherStone && params.otherStone.stoneTypeId && params.otherStone.stoneTypeId !== 'none_selected') {
      const otherStoneWeight = params.otherStone.caratWeight || 0.5;
      let otherStonePrice = 0;
      let otherStoneName = "Other Stone";
      
      // Try to get stone price from database with multiple matching approaches
      try {
        const stoneTypeId = typeof params.otherStone.stoneTypeId === 'string' ? 
          parseInt(params.otherStone.stoneTypeId) : params.otherStone.stoneTypeId;
          
        console.log(`Looking up other stone with ID ${stoneTypeId} in database`);
        
        // Try to get directly by ID first
        if (typeof stoneTypeId === 'number' && !isNaN(stoneTypeId)) {
          try {
            const stoneTypeData = await storage.getStoneTypeById(stoneTypeId);
            if (stoneTypeData) {
              otherStoneName = stoneTypeData.name;
              otherStonePrice = stoneTypeData.priceModifier;
              console.log(`Found other stone by ID: ${otherStoneName} with price ${otherStonePrice}`);
            }
          } catch (error) {
            console.error(`Error looking up stone type with ID ${stoneTypeId}:`, error);
          }
        }
        
        // If not found by ID, try to search all stones
        if (!otherStonePrice) {
          const stoneTypes = await storage.getAllStoneTypes();
          
          // Try exact ID match first
          let otherStoneData = stoneTypes.find(st => 
            st.id !== undefined && st.id === stoneTypeId
          );
          
          // If ID doesn't match, try by name 
          if (!otherStoneData && typeof params.otherStone.stoneTypeId === 'string') {
            const stoneName = params.otherStone.stoneTypeId;
            otherStoneData = stoneTypes.find(st => 
              st.name && st.name.toLowerCase() === stoneName.toLowerCase()
            );
          }
          
          // Use the found stone data if available
          if (otherStoneData?.priceModifier) {
            otherStoneName = otherStoneData.name;
            otherStonePrice = otherStoneData.priceModifier;
            console.log(`Using database price for ${otherStoneName}: ₹${otherStonePrice} per carat`);
          } else if (typeof params.otherStone.stoneTypeId === 'string') {
            // Try to find by keywords, separating compound names
            const stoneTypeName = params.otherStone.stoneTypeId;
            const words = stoneTypeName.toLowerCase().split(/\s+/);
            for (const word of words) {
              if (word.length < 3) continue; // Skip short words
              
              const keywordMatch = stoneTypes.find(st => 
                st.name && st.name.toLowerCase().includes(word)
              );
              
              if (keywordMatch?.priceModifier) {
                otherStoneName = keywordMatch.name;
                otherStonePrice = keywordMatch.priceModifier;
                console.log(`Found keyword match "${word}" for stone "${otherStoneName}": ₹${otherStonePrice} per carat`);
                break;
              }
            }
            
            // If still no price, fallback to name-based pricing
            if (!otherStonePrice) {
              otherStonePrice = await getGemPricePerCaratFromName(params.otherStone.stoneTypeId);
              console.log(`Using fallback price for ${params.otherStone.stoneTypeId}: ₹${otherStonePrice} per carat`);
            }
          }
        }
        
        // Calculate other stone cost
        const otherStoneCost = otherStoneWeight * otherStonePrice;
        stoneCost += otherStoneCost;
        
        // Add to gem costs
        gemCosts.push({
          name: otherStoneName,
          carats: otherStoneWeight,
          price: otherStonePrice,
          totalCost: otherStoneCost
        });
      } catch (error) {
        console.error(`Error calculating other stone price:`, error);
      }
    }
    
    // Log detailed gem cost breakdown for debugging
    if (gemCosts.length > 0) {
      console.log("Stone Cost Breakdown:");
      gemCosts.forEach(gem => {
        console.log(`- ${gem.name} (${gem.carats} carats at ₹${gem.price}/carat): ₹${gem.totalCost}`);
      });
    }
    
    // 3. Calculate total with 25% overhead
    const baseCost = metalCost + stoneCost;
    const overhead = baseCost * 0.25;
    const totalPriceINR = Math.round(baseCost + overhead);
    
    // Get the current USD to INR exchange rate (with fallback)
    let exchangeRate = 83; // Default fallback rate
    try {
      // Try to get the current rate
      const freshRate = await getUsdToInrRate();
      if (freshRate && freshRate > 0) {
        exchangeRate = freshRate;
        console.log(`Using current USD to INR exchange rate: ${exchangeRate}`);
      } else {
        // Use cached rate as fallback
        exchangeRate = getCachedExchangeRate();
        console.log(`Using cached USD to INR exchange rate: ${exchangeRate}`);
      }
    } catch (error) {
      console.error("Error fetching exchange rate, using default:", error);
    }
    
    // Convert to USD using the current exchange rate
    const priceUSD = Math.round(totalPriceINR / exchangeRate);
    
    return {
      priceINR: totalPriceINR,
      priceUSD,
      exchangeRate, // Include the exchange rate used in the response
      breakdown: {
        metalCost: Math.round(metalCost),
        stoneCost: Math.round(stoneCost),
        overhead: Math.round(overhead),
        stones: gemCosts // Include detailed stone breakdown with individual stones
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
export async function getGemPricePerCaratFromName(gemName: string): Promise<number> {
  try {
    // Try to find in database first
    const stoneTypes = await storage.getAllStoneTypes();
    
    // First try exact name match
    let matchingStone = stoneTypes.find(st => 
      st.name && st.name.toLowerCase() === gemName.toLowerCase()
    );

    // If no exact match, try partial name match in either direction
    if (!matchingStone) {
      matchingStone = stoneTypes.find(st =>
        st.name && (
          st.name.toLowerCase().includes(gemName.toLowerCase()) ||
          gemName.toLowerCase().includes(st.name.toLowerCase())
        )
      );
    }
    
    if (matchingStone?.priceModifier) {
      console.log(`Found matching stone in DB: "${matchingStone.name}" with price ₹${matchingStone.priceModifier} for query "${gemName}"`);
      return matchingStone.priceModifier;
    } else {
      console.log(`No matching stone found in DB for: "${gemName}"`);
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
  const metalCost = sample.metalWeight * DEFAULT_GOLD_24K_PRICE_PER_GRAM_INR * 0.75;
  const stoneCost = 2.5 * 56000; // Natural diamond at ₹56,000 per carat
  const baseCost = metalCost + stoneCost;
  const overhead = baseCost * 0.25;
  const totalPrice = baseCost + overhead;
  
  return `
Sample Price Calculation for "${sample.productName}":

1. Metal Cost: 
   ${sample.metalWeight} grams × ₹${DEFAULT_GOLD_24K_PRICE_PER_GRAM_INR} (24K gold price) × ${0.75} (18K modifier)
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
   ₹${totalPrice.toLocaleString('en-IN')} ÷ 83 (exchange rate)
   = $${(totalPrice / 83).toLocaleString('en-US', {maximumFractionDigits: 0})}
`;
}