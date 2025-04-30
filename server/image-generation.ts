import { Request, Response } from 'express';
import OpenAI from 'openai';

// Initialize OpenAI with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateImage(req: Request, res: Response) {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    // Return the generated image URL
    res.json({ 
      url: response.data?.[0]?.url || "",
      revised_prompt: response.data?.[0]?.revised_prompt || prompt
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message
    });
  }
}

// Generate multiple educational jewelry images based on the topic
export async function generateEducationalJewelryImages(req: Request, res: Response) {
  try {
    const { topic, count = 3 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Define prompts based on common jewelry education topics
    const prompts = {
      "natural_gemstones": "A high-quality educational photograph of natural gemstones including ruby, sapphire and emerald in their raw uncut form on a neutral background, photorealistic, isolated specimen, museum quality, for educational purposes",
      "lab_created_gems": "A photorealistic educational comparison showing lab-created gemstones on laboratory equipment with scientific instruments nearby, highlighting their perfect clarity and color, educational lighting, no text",
      "onyx_gems": "A detailed educational photo of black onyx gemstones showing their smooth polished surface with characteristic banding, gem-quality specimen on neutral background, museum quality photography, educational lighting",
      "cabochons": "Educational photograph of various colorful cabochon-cut gemstones showing their smooth domed tops, arranged on a neutral background to highlight their colors and forms, professional lighting",
      "faceted_stones": "Educational photograph of various faceted gemstones showing light reflection and brilliance, arranged to demonstrate different faceting styles including brilliant and step cuts, professional jewelry lighting",
      "gemstone_forms": "Photorealistic educational image showing different gemstone forms side by side: faceted, cabochon, carved, and raw crystals, neutral background, professional lighting, no text",
      "gold_types": "Educational photograph showing different colors of gold (yellow, white, rose) in polished form, arranged side by side on neutral background, professional jewelry lighting, no text",
      "jewelry_craftsmanship": "Educational photograph showing traditional jewelry making tools and techniques with a craftsperson's hands working on a detailed piece, professional lighting, focus on the intricate work"
    };

    const promptKey = topic.toLowerCase().replace(/\s+/g, '_') as keyof typeof prompts;
    const selectedPrompt = prompts[promptKey] || 
      `Educational photograph of ${topic} in jewelry, photorealistic, museum quality, professional lighting, neutral background, no text`;

    // Generate image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: selectedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    // Return the generated image URL
    res.json({ 
      url: response.data?.[0]?.url || "",
      revised_prompt: response.data?.[0]?.revised_prompt || selectedPrompt
    });
  } catch (error: any) {
    console.error('Error generating educational images:', error);
    res.status(500).json({ 
      error: 'Failed to generate educational images',
      message: error.message
    });
  }
}