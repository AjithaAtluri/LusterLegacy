import { apiRequest } from "@/lib/queryClient";

export interface ImageAnalysisResult {
  title: string;
  alt: string;
  description: string;
  success: boolean;
  error?: string;
}

/**
 * Analyzes an image using OpenAI's vision capabilities to generate title, alt text, and description
 * @param imageFile The image file to analyze
 * @returns Promise with analysis results
 */
export async function analyzeJewelryImage(imageFile: File): Promise<ImageAnalysisResult> {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Create form data with image
    const formData = new FormData();
    formData.append('image', base64Image);
    formData.append('type', 'jewelry');
    
    // Make API request
    const response = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }
    
    const result = await response.json();
    
    return {
      title: result.title || '',
      alt: result.alt || '',
      description: result.description || '',
      success: true
    };
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      title: '',
      alt: '',
      description: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error analyzing image'
    };
  }
}

/**
 * Converts a File object to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}