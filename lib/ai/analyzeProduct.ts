import OpenAI from 'openai';
import { aiConfig, isOpenAIConfigured } from './config';
import { PRODUCT_ANALYSIS_SYSTEM_PROMPT } from './prompts';
import { ProductAnalysis } from './types';
import { optimizeImageForAI } from '../image/process';

export async function analyzeProduct(productBuffer: Buffer): Promise<ProductAnalysis> {
  if (!isOpenAIConfigured()) {
    console.log('[AI Product Analysis] No OpenAI API Key configured, using default structured analysis');
    return {
      category: 'sofa',
      orientation: 'angled three-quarter view',
      visualDescription: 'contemporary upholstered furniture piece with tailored cushions and elegant proportions',
      material: 'high-durability textured upholstery with fine seam stitching',
      color: 'neutral contemporary tone',
      shape: 'clean linear silhouette with ergonomic backrest and plush seat cushions',
      importantFeatures: [
        'tailored armrest profile',
        'cushion structure and firm foundation',
        'solid support base/legs',
      ],
      backgroundClutterToExclude: [
        'showroom floor tiles',
        'price tags and informational cards',
        'neighboring display furniture',
        'background reflections and showroom ceiling lights',
      ],
    };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: aiConfig.timeoutMs,
  });

  const optimized = await optimizeImageForAI(productBuffer, { maxWidth: 1536, quality: 85 });

  const response = await openai.chat.completions.create({
    model: aiConfig.visionModel,
    messages: [
      {
        role: 'system',
        content: PRODUCT_ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this showroom furniture photograph. Identify the primary furniture piece, its exact materials and features, and explicitly identify the showroom clutter to be excluded. Output your analysis into JSON.',
          },
          {
            type: 'image_url',
            image_url: {
              url: optimized.base64,
              detail: 'high',
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty product analysis');
  }

  try {
    const parsed = JSON.parse(content) as ProductAnalysis;
    return parsed;
  } catch (err) {
    console.warn('[AI Product Analysis] Failed to parse JSON response:', content);
    throw new Error('Could not parse product analysis response');
  }
}
