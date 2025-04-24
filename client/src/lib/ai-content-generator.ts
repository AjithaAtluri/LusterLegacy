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
 * Convert a File object to a base64 string with compression
 * This version includes image compression to reduce payload size
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      console.error('No file provided to fileToBase64');
      reject(new Error('No file provided'));
      return;
    }

    // Log file details
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('File is not an image:', file.type);
      reject(new Error('File must be an image'));
      return;
    }
    
    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      console.error('File is too large:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
      reject(new Error('File size exceeds 8MB limit'));
      return;
    }

    // Use image compression before converting to base64
    const compressImage = (imageFile: File): Promise<Blob> => {
      return new Promise((resolveCompress, rejectCompress) => {
        // Create an image element to load the file
        const img = new Image();
        img.onload = () => {
          // Get the image dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          // Create a canvas and draw the resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            rejectCompress(new Error('Failed to get canvas context'));
            return;
          }
          
          // Draw image with white background (for transparent PNGs)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality adjustment
          // Use 85% quality for JPEG which is a good balance between quality and size
          // Default to JPEG format for best compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Compressed image from ${(file.size / 1024).toFixed(2)}KB to ${(blob.size / 1024).toFixed(2)}KB`);
                resolveCompress(blob);
              } else {
                rejectCompress(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        
        img.onerror = () => {
          rejectCompress(new Error('Failed to load image for compression'));
        };
        
        // Load the image from the file
        img.src = URL.createObjectURL(imageFile);
      });
    };

    // Process the image with compression first
    compressImage(file)
      .then(compressedBlob => {
        // Now read the compressed blob
        const reader = new FileReader();
        
        reader.onload = () => {
          try {
            if (typeof reader.result === 'string') {
              // Validate the data URL format
              if (!reader.result.startsWith('data:image/')) {
                console.error('Invalid data URL format:', reader.result.substring(0, 30) + '...');
                reject(new Error('Invalid data URL format'));
                return;
              }
              
              // Log success details
              console.log(`Compressed file loaded successfully, data URL length: ${reader.result.length}`);
              
              // Extract the base64 content after the comma
              const parts = reader.result.split(',');
              if (parts.length !== 2) {
                console.error('Invalid data URL structure:', reader.result.substring(0, 30) + '...');
                reject(new Error('Invalid data URL structure'));
                return;
              }
              
              const base64String = parts[1];
              
              // Validate that the base64 string only contains valid characters
              if (!/^[A-Za-z0-9+/=]+$/.test(base64String)) {
                console.error('Invalid base64 characters in string');
                reject(new Error('Invalid base64 characters'));
                return;
              }
              
              console.log(`Base64 string extracted, length: ${base64String.length}`);
              resolve(base64String);
            } else {
              console.error('FileReader result is not a string:', typeof reader.result);
              reject(new Error('Failed to convert file to base64 - result not a string'));
            }
          } catch (err) {
            console.error('Error processing file:', err);
            reject(err);
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        
        // Start reading the compressed blob
        try {
          reader.readAsDataURL(compressedBlob);
        } catch (err) {
          console.error('Error reading compressed blob:', err);
          reject(err);
        }
      })
      .catch(compressionError => {
        console.error('Compression failed, falling back to original file:', compressionError);
        
        // If compression fails, fall back to original file
        const fallbackReader = new FileReader();
        
        fallbackReader.onload = () => {
          try {
            if (typeof fallbackReader.result === 'string') {
              const parts = fallbackReader.result.split(',');
              if (parts.length === 2) {
                console.log('Using original file as fallback');
                resolve(parts[1]);
              } else {
                reject(new Error('Invalid data URL structure in fallback'));
              }
            } else {
              reject(new Error('FileReader result is not a string in fallback'));
            }
          } catch (fallbackErr) {
            reject(fallbackErr);
          }
        };
        
        fallbackReader.onerror = reject;
        fallbackReader.readAsDataURL(file);
      });
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
    
    // Try our new direct jewelry image analysis endpoint first
    console.log("Trying direct jewelry image analysis endpoint...");
    if (data.imageUrls && data.imageUrls.length > 0) {
      try {
        // Prepare data for direct jewelry image analysis
        const directImageData = {
          imageData: data.imageUrls[0], // Send only the first image
          productType: data.productType,
          metalType: data.metalType,
          metalWeight: data.metalWeight,
          primaryGems: data.primaryGems,
          userDescription: data.userDescription
        };
        
        console.log("Calling direct jewelry image analysis with:", {
          hasImage: !!directImageData.imageData,
          imageDataLength: directImageData.imageData ? directImageData.imageData.length : 0,
          productType: directImageData.productType,
          metalType: directImageData.metalType,
          gemCount: directImageData.primaryGems?.length || 0
        });
        
        const directResponse = await fetch("/api/direct-jewelry-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(directImageData),
          credentials: "include"
        });
        
        if (directResponse.ok) {
          console.log("Direct jewelry image analysis successful");
          const responseText = await directResponse.text();
          console.log("Got direct jewelry analysis response text:", responseText.substring(0, 50) + "...");
          
          try {
            const result = JSON.parse(responseText);
            console.log("Successfully parsed direct jewelry analysis response");
            return result;
          } catch (parseError) {
            console.error("Failed to parse direct jewelry analysis response:", parseError);
            // Continue to next approach
          }
        } else {
          console.log("Direct jewelry image analysis failed, status:", directResponse.status);
        }
      } catch (directError) {
        console.error("Error with direct jewelry image analysis:", directError);
      }
    }
    
    // Try the public content generation endpoint using regular fetch instead of apiRequest
    console.log("Falling back to public content generation endpoint...");
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