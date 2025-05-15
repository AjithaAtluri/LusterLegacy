import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisResult {
  title: string;
  alt: string;
  description: string;
}

/**
 * Analyzes an image using OpenAI's vision capabilities to generate metadata
 * @param imageBase64 Base64 encoded image
 * @param type Type of image being analyzed (jewelry, etc.)
 * @returns Promise with generated title, alt text, and description
 */
export async function analyzeImage(imageBase64: string, type: string = 'general'): Promise<AnalysisResult> {
  const systemPrompt = getSystemPrompt(type);
  
  try {
    // Use the latest GPT-4o model with vision capabilities
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this jewelry image and provide the requested metadata."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      title: result.title || '',
      alt: result.alt_text || result.alt || '',
      description: result.description || ''
    };
  } catch (error: any) {
    console.error("Error analyzing image with OpenAI:", error.message);
    return {
      title: "Luxury Jewelry Piece",
      alt: "Image of a luxury jewelry piece",
      description: "A beautifully crafted piece of fine jewelry showcasing expert craftsmanship and attention to detail."
    };
  }
}

/**
 * Get the appropriate system prompt based on the image type
 */
function getSystemPrompt(type: string): string {
  if (type === 'jewelry') {
    return `
      You are an expert jewelry photographer and gemologist with extensive experience in luxury product descriptions.
      Analyze the jewelry image and provide the following information in JSON format:
      
      1. title: A concise, elegant title (3-7 words) that captures the essence of the jewelry piece.
      2. alt_text: A detailed but concise description (15-20 words) of the piece for accessibility purposes.
      3. description: A rich, evocative description (50-80 words) highlighting the materials, craftsmanship, design elements, 
         and emotional appeal of the jewelry piece. Use luxury-appropriate language.
      
      Respond ONLY with JSON in this exact format:
      {"title": "...", "alt_text": "...", "description": "..."}
      
      Make sure the descriptions are accurate and reflect what is actually visible in the image.
      If the image quality is poor or the jewelry is not clearly visible, note this in your descriptions.
    `;
  }
  
  // Default general prompt
  return `
    You are an expert in product photography and descriptions.
    Analyze the image and provide the following information in JSON format:
    
    1. title: A concise, descriptive title (3-7 words).
    2. alt_text: A detailed but concise description (15-20 words) for accessibility purposes.
    3. description: A rich, evocative description (50-80 words) highlighting key features.
    
    Respond ONLY with JSON in this exact format:
    {"title": "...", "alt_text": "...", "description": "..."}
  `;
}