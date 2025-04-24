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
    
    // Try our new improved jewelry content endpoint first using direct fetch
    try {
      console.log("Trying improved jewelry content endpoint first...");
      const improvedResponse = await fetch("/api/admin/generate-jewelry-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (improvedResponse.ok) {
        console.log("Improved endpoint successful");
        const responseText = await improvedResponse.text();
        console.log("Got improved endpoint response text:", responseText.substring(0, 50) + "...");
        
        try {
          const result = JSON.parse(responseText);
          console.log("Successfully parsed improved response JSON");
          return result;
        } catch (parseError) {
          console.log("Failed to parse improved endpoint response as JSON:", parseError);
          // Continue to next endpoint
        }
      }
      console.log("Improved endpoint failed (status: " + improvedResponse.status + "), falling back to main endpoint");
    } catch (e) {
      console.log("Improved endpoint error:", e);
    }
    
    // Then try the test endpoint as a backup option using direct fetch
    try {
      console.log("Trying test endpoint next...");
      const testResponse = await fetch("/api/test-content-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (testResponse.ok) {
        console.log("Test endpoint successful");
        const responseText = await testResponse.text();
        console.log("Got test endpoint response text:", responseText.substring(0, 50) + "...");
        
        try {
          const result = JSON.parse(responseText);
          console.log("Successfully parsed test response JSON");
          return result;
        } catch (parseError) {
          console.log("Failed to parse test endpoint response as JSON:", parseError);
          // Continue to next endpoint
        }
      }
      console.log("Test endpoint failed, falling back to standard endpoint");
    } catch (e) {
      console.log("Test endpoint error:", e);
    }
    
    // Try the public content generation endpoint using regular fetch instead of apiRequest
    console.log("Trying public content generation endpoint...");
    const response = await fetch("/api/generate-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      credentials: "include"
    });
    
    // Error handling
    if (!response.ok) {
      let errorMessage = "Failed to generate content";
      let errorDetails = "";
      
      try {
        // Try to get error response as text first
        const responseText = await response.text();
        
        // Then attempt to parse it as JSON
        try {
          const errorData = JSON.parse(responseText);
          
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
        } catch (parseError) {
          // JSON parsing failed, use the text response
          errorDetails = responseText || response.statusText;
          console.error("Failed to parse error response as JSON", parseError);
        }
      } catch (e) {
        // If text retrieval fails, use response status text
        errorDetails = response.statusText;
        console.error("Failed to get error response text", e);
      }
      
      const finalErrorMessage = errorDetails 
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;
        
      throw new Error(finalErrorMessage);
    }
    
    // Get response text first and safely parse
    const responseText = await response.text();
    console.log("Got successful response text:", responseText.substring(0, 50) + "...");
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log("Successfully parsed response JSON");
    } catch (parseError) {
      console.error("Failed to parse success response as JSON:", parseError);
      
      // Try to find JSON in the response text using regex
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log("Found JSON pattern in response, trying to parse it");
          result = JSON.parse(jsonMatch[0]);
          console.log("Successfully parsed JSON from matched pattern");
        } else {
          throw new Error("Could not find valid JSON in response");
        }
      } catch (matchError) {
        console.error("JSON extraction failed:", matchError);
        throw new Error("Failed to parse AI response: " + responseText.substring(0, 100));
      }
    }
    
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