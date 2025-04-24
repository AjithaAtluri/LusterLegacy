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
    
    // Log what we're sending to the server for diagnostics
    console.log("Sending AI content request with:", {
      productType: data.productType,
      metalType: data.metalType, 
      gems: data.primaryGems?.length || 0,
      hasDescription: !!data.userDescription,
      imageCount: data.imageUrls?.length || 0
    });
    
    // Try our new improved jewelry content endpoint first
    try {
      console.log("Trying improved jewelry content endpoint first...");
      const improvedResponse = await apiRequest("POST", "/api/admin/generate-jewelry-content", data);
      if (improvedResponse.ok) {
        console.log("Improved endpoint successful");
        return await improvedResponse.json();
      }
      console.log("Improved endpoint failed (status: " + improvedResponse.status + "), falling back to main endpoint");
    } catch (e) {
      console.log("Improved endpoint error:", e);
    }
    
    // Then try the test endpoint as a backup option
    try {
      console.log("Trying test endpoint next...");
      const testResponse = await apiRequest("POST", "/api/test-content-generation", data);
      if (testResponse.ok) {
        console.log("Test endpoint successful");
        return await testResponse.json();
      }
      console.log("Test endpoint failed, falling back to standard endpoint");
    } catch (e) {
      console.log("Test endpoint error:", e);
    }
    
    // Try the public content generation endpoint
    const response = await apiRequest("POST", "/api/generate-content", data);
    
    if (!response.ok) {
      let errorMessage = "Failed to generate content";
      let errorDetails = "";
      
      try {
        const errorData = await response.json();
        
        // Get more detailed error information if available
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData.details || errorData.error || "";
        
        // Specific error handling based on status code
        if (response.status === 401 || response.status === 402) {
          errorMessage = "OpenAI API key issue. Please verify your API key is valid and has sufficient credits.";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again in a few moments.";
        } else if (response.status === 413) {
          errorMessage = "Request too large. Try with fewer or smaller images.";
        } else if (response.status >= 500) {
          errorMessage = "Server error processing your request. Please try again or use text-only mode.";
        }
        
        // Log more details for debugging
        console.error("API Error Response:", {
          status: response.status,
          errorMessage,
          errorDetails,
          rawError: errorData
        });
        
      } catch (e) {
        // If JSON parsing fails, use response status text
        errorDetails = response.statusText;
        console.error("Failed to parse error response", e);
      }
      
      const finalErrorMessage = errorDetails 
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;
        
      throw new Error(finalErrorMessage);
    }
    
    const result = await response.json();
    
    // Validate the result has the expected fields
    if (!result.title || !result.tagline || !result.shortDescription || !result.detailedDescription) {
      console.error("AI response missing required fields:", result);
      throw new Error("Incomplete content generated. The AI response is missing required fields.");
    }
    
    // Calculate generation time
    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`AI content generated in ${generationTime} seconds`);
    
    return result;
  } catch (error: any) {
    console.error("Error generating content:", error);
    // Make sure we always return a proper Error object with message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(error?.message || "Unknown error generating content");
    }
  }
}