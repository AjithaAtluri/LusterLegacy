// Common type definitions for the application
// These are shared between components to ensure consistency

export interface StoneType {
  id: number;
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  color?: string | null;
  createdAt?: Date | null;
  priceModifier?: number;
  imageUrl?: string | null;
  category?: string | null;
  stoneForm?: string | null;
  quality?: string | null;
  size?: string | null;
  pricePerCarat?: number; // Used in pricing calculations
}

export interface MetalType {
  id: number;
  name: string;
  priceFactor: number;
  description?: string;
}

export interface ProductType {
  id: number;
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  icon?: string | null;
  color?: string | null;
  createdAt?: Date | null;
}

export interface AIContentRequest {
  productType: string;
  metalType: string;
  metalWeight?: number;
  primaryGems?: Array<{
    name: string;
    carats?: number;
  }>;
  userDescription?: string;
  imageUrls?: string[];
}

export interface AIGeneratedContent {
  title: string;
  tagline: string;
  shortDescription: string;
  detailedDescription: string;
  priceUSD: number;
  priceINR: number;
  imageInsights?: string;
  imageUrl?: string;
  additionalData?: {
    metalType?: string;
    metalWeight?: number;
    mainStoneType?: string;
    mainStoneWeight?: number;
    secondaryStoneType?: string;
    secondaryStoneWeight?: number;
    otherStoneType?: string;
    otherStoneWeight?: number;
    productTypeId?: string;
    tagline?: string;
    basePriceINR?: number;
    userDescription?: string;
    stoneTypes?: string[];
    dimensions?: string;
    aiInputs?: {
      productType?: string;
      metalType?: string;
      metalWeight?: number;
      mainStoneType?: string;
      mainStoneWeight?: number;
      secondaryStoneType?: string;
      secondaryStoneWeight?: number;
      otherStoneType?: string;
      otherStoneWeight?: number;
      userDescription?: string;
    };
  };
}