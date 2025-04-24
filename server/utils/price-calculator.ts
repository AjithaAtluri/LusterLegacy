/**
 * 2025 Market-Rate Jewelry Price Calculator
 * Provides accurate pricing estimates for jewelry items based on current market rates
 */

interface Gem {
  name: string;
  carats?: number;
}

interface PriceCalculationParams {
  productType: string;
  metalType: string;
  metalWeight: number;
  primaryGems?: Gem[];
}

export function calculateJewelryPrice(params: PriceCalculationParams): {
  priceUSD: number;
  priceINR: number;
} {
  const { productType, metalType, metalWeight, primaryGems } = params;

  // Base artisanship price in USD (2025 rates)
  const basePrice = 1200;
  
  // Current 2025 metal prices per gram
  let metalPricePerGram = 30; // Default for other metals
  
  if (metalType.toLowerCase().includes('gold')) {
    // Gold pricing based on karat
    if (metalType.toLowerCase().includes('24k') || metalType.toLowerCase().includes('24 k')) {
      metalPricePerGram = 85; // 24K gold price per gram
    } else if (metalType.toLowerCase().includes('22k') || metalType.toLowerCase().includes('22 k')) {
      metalPricePerGram = 78; // 22K gold price per gram
    } else if (metalType.toLowerCase().includes('18k') || metalType.toLowerCase().includes('18 k')) {
      metalPricePerGram = 65; // 18K gold price per gram
    } else if (metalType.toLowerCase().includes('14k') || metalType.toLowerCase().includes('14 k')) {
      metalPricePerGram = 52; // 14K gold price per gram
    } else if (metalType.toLowerCase().includes('10k') || metalType.toLowerCase().includes('10 k')) {
      metalPricePerGram = 38; // 10K gold price per gram
    } else {
      metalPricePerGram = 65; // Default to 18K gold if karat not specified
    }
  } else if (metalType.toLowerCase().includes('platinum')) {
    metalPricePerGram = 42; // Platinum price per gram
  } else if (metalType.toLowerCase().includes('silver')) {
    metalPricePerGram = 1.2; // Silver price per gram
  }
  
  // Calculate gemstone values with 2025 market rates
  const gemPriceMultiplier = (primaryGems || []).reduce((acc, gem) => {
    let multiplier = 200; // Default value for semi-precious stones
    const gemName = gem.name.toLowerCase();
    
    // Diamond pricing (based on average quality)
    if (gemName.includes('diamond')) {
      if (gemName.includes('lab') || gemName.includes('synthetic')) {
        multiplier = 800; // Lab-grown diamonds
      } else {
        multiplier = 1500; // Natural diamonds
      }
    }
    // Precious gems
    else if (gemName.includes('ruby')) multiplier = 1200;
    else if (gemName.includes('sapphire')) multiplier = 1100;
    else if (gemName.includes('emerald')) multiplier = 1300;
    // Semi-precious but valuable gems
    else if (gemName.includes('tanzanite')) multiplier = 800;
    else if (gemName.includes('alexandrite')) multiplier = 1500;
    else if (gemName.includes('paraiba')) multiplier = 2000;
    else if (gemName.includes('opal')) multiplier = 500;
    else if (gemName.includes('pearl')) {
      if (gemName.includes('south sea') || gemName.includes('tahitian')) {
        multiplier = 700; // Premium pearls
      } else {
        multiplier = 300; // Standard pearls
      }
    }
    // Calculate based on carat weight or default to 0.5 carats
    return acc + (gem.carats || 0.5) * multiplier;
  }, 0);
  
  // Craftsmanship premium based on product type complexity
  let craftsmanshipMultiplier = 1.0;
  const productTypeLC = productType.toLowerCase();
  
  if (productTypeLC.includes('necklace') || productTypeLC.includes('choker')) {
    craftsmanshipMultiplier = 1.3;
  } else if (productTypeLC.includes('bracelet') || productTypeLC.includes('bangle')) {
    craftsmanshipMultiplier = 1.15;
  } else if (productTypeLC.includes('earring')) {
    craftsmanshipMultiplier = 1.1;
  } else if (productTypeLC.includes('ring')) {
    craftsmanshipMultiplier = 1.0;
  } else if (productTypeLC.includes('pendant')) {
    craftsmanshipMultiplier = 1.05;
  }
  
  const calculatedPrice = (basePrice + (metalWeight * metalPricePerGram) + gemPriceMultiplier) * craftsmanshipMultiplier;
  const priceUSD = Math.round(calculatedPrice);
  const priceINR = Math.round(priceUSD * 75); // Approximate exchange rate
  
  return {
    priceUSD,
    priceINR
  };
}

/**
 * Get current price per gram for different metals (2025 rates)
 */
export function getMetalPricePerGram(metalType: string): number {
  if (metalType.toLowerCase().includes('gold')) {
    // Gold pricing based on karat
    if (metalType.toLowerCase().includes('24k')) return 85;
    if (metalType.toLowerCase().includes('22k')) return 78;
    if (metalType.toLowerCase().includes('18k')) return 65;
    if (metalType.toLowerCase().includes('14k')) return 52;
    if (metalType.toLowerCase().includes('10k')) return 38;
    return 65; // Default to 18K gold
  } else if (metalType.toLowerCase().includes('platinum')) {
    return 42;
  } else if (metalType.toLowerCase().includes('silver')) {
    return 1.2;
  }
  return 30; // Default for other metals
}

/**
 * Get the current gem price per carat (2025 rates)
 */
export function getGemPricePerCarat(gemName: string): number {
  const name = gemName.toLowerCase();
  
  // Diamond pricing (based on average quality)
  if (name.includes('diamond')) {
    if (name.includes('lab') || name.includes('synthetic')) {
      return 800; // Lab-grown diamonds
    }
    return 1500; // Natural diamonds
  }
  
  // Precious gems
  if (name.includes('ruby')) return 1200;
  if (name.includes('sapphire')) return 1100;
  if (name.includes('emerald')) return 1300;
  
  // Semi-precious but valuable gems
  if (name.includes('tanzanite')) return 800;
  if (name.includes('alexandrite')) return 1500;
  if (name.includes('paraiba')) return 2000;
  if (name.includes('opal')) return 500;
  
  // Pearls
  if (name.includes('pearl')) {
    if (name.includes('south sea') || name.includes('tahitian')) {
      return 700; // Premium pearls
    }
    return 300; // Standard pearls
  }
  
  return 200; // Default for other semi-precious stones
}