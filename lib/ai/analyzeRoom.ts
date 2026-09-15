import OpenAI from 'openai';
import { aiConfig, isOpenAIConfigured } from './config';
import { ROOM_ANALYSIS_SYSTEM_PROMPT } from './prompts';
import { RoomAnalysis } from './types';
import { optimizeImageForAI } from '../image/process';

export async function analyzeRoom(roomBuffer: Buffer): Promise<RoomAnalysis> {
  if (!isOpenAIConfigured()) {
    console.log('[AI Room Analysis] No OpenAI API Key configured, using default structured analysis');
    return {
      roomType: 'living room',
      floorDescription: 'hardwood flooring with natural grain and soft ambient sheen',
      wallDescription: 'neutral warm off-white painted drywall with clean baseboards',
      cameraPerspective: 'eye-level perspective angled slightly toward the primary wall',
      lighting: 'diffused natural daylight from side opening complemented by soft ambient indoor lighting',
      windows: ['large natural light source'],
      doors: ['hallway entryway'],
      availablePlacementArea: 'central open floor area along the primary wall',
      existingFurniture: ['existing room boundary elements'],
    };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: aiConfig.timeoutMs,
  });

  const optimized = await optimizeImageForAI(roomBuffer, { maxWidth: 1536, quality: 85 });

  const response = await openai.chat.completions.create({
    model: aiConfig.visionModel,
    messages: [
      {
        role: 'system',
        content: ROOM_ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this customer room image for furniture placement. Extract the structural, spatial, and lighting features into JSON.',
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
    throw new Error('OpenAI returned empty room analysis');
  }

  try {
    const parsed = JSON.parse(content) as RoomAnalysis;
    return parsed;
  } catch (err) {
    console.warn('[AI Room Analysis] Failed to parse JSON response:', content);
    throw new Error('Could not parse room analysis response');
  }
}
