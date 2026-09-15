export const aiConfig = {
  // Vision analysis model (for room perspective & product isolation)
  visionModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
  
  // Generation model (using OpenAI's current image generation model gpt-image-1)
  generationModel: process.env.OPENAI_GEN_MODEL || 'gpt-image-1',
  
  // Image generation size
  imageSize: (process.env.OPENAI_IMAGE_SIZE || '1024x1024') as '1024x1024' | '1536x1024' | '1024x1536',
  
  // Quality: 'high', 'medium', 'low', 'auto'
  imageQuality: (process.env.OPENAI_IMAGE_QUALITY || 'auto') as any,
  
  // Output format from generation
  outputFormat: 'png' as const,
  
  // Request timeout in milliseconds
  timeoutMs: 90000,
};

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0;
}
