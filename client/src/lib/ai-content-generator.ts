import { apiRequest } from "./queryClient";

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
}

export async function generateProductContent(data: AIContentRequest): Promise<AIGeneratedContent> {
  try {
    const response = await apiRequest("POST", "/api/admin/generate-content", data);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to generate content");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}