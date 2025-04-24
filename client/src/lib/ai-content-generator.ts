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
  imageInsights?: string;
}

/**
 * Convert a File object to a base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Generate AI content for a product based on text inputs and optional images
 */
export async function generateProductContent(data: AIContentRequest): Promise<AIGeneratedContent> {
  try {
    // Show detailed error handling for any issues
    const startTime = Date.now();
    
    const response = await apiRequest("POST", "/api/admin/generate-content", data);
    
    if (!response.ok) {
      let errorMessage = "Failed to generate content";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use response status text
        errorMessage += `: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    // Calculate generation time
    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`AI content generated in ${generationTime} seconds`);
    
    return result;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}