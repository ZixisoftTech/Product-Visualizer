import { OpenAI, toFile } from 'openai';
import { prisma } from '../db/prisma';
import { readImageBuffer, saveImageToDisk } from '../image/storage';
import { aiConfig, isOpenAIConfigured } from './config';
import { analyzeRoom } from './analyzeRoom';
import { analyzeProduct } from './analyzeProduct';
import { isolateFurnitureProduct } from './isolateProduct';
import { buildVisualizationPrompt } from './prompts';
import { VisualizationGenerationInput, VisualizationGenerationResult } from './types';
import sharp from 'sharp';

export async function generateVisualization(
  input: VisualizationGenerationInput
): Promise<VisualizationGenerationResult> {
  const {
    visualizationId,
    hallImagePath,
    productImagePath,
    productWidth,
    productDepth,
    productHeight,
    dimensionUnit,
    placement,
    instructions,
  } = input;

  const startTime = Date.now();
  console.log(`[AI Pipeline] Starting visualization for ID: ${visualizationId} at ${new Date().toISOString()}`);

  try {
    // 1. Update status to PROCESSING
    await prisma.visualization.update({
      where: { id: visualizationId },
      data: { status: 'PROCESSING', error_message: null },
    });

    // 2. Read source images from disk
    console.log(`[AI Pipeline] Reading source images: ${hallImagePath} & ${productImagePath}`);
    const hallBuffer = await readImageBuffer(hallImagePath);
    const productBuffer = await readImageBuffer(productImagePath);

    // 3. Isolate the furniture product (removes showroom floor, tags, background clutter)
    console.log(`[AI Pipeline] Isolating furniture piece from showroom background...`);
    const isolatedProductBuffer = await isolateFurnitureProduct(productBuffer);

    // 4. Concurrently analyze Room and Product for rich metadata
    console.log(`[AI Pipeline] Extracting spatial & product metadata...`);
    const [roomAnalysis, productAnalysis] = await Promise.all([
      analyzeRoom(hallBuffer).catch((err) => {
        console.warn(`[AI Pipeline] Room analysis note: ${err.message}`);
        return undefined;
      }),
      analyzeProduct(productBuffer).catch((err) => {
        console.warn(`[AI Pipeline] Product analysis note: ${err.message}`);
        return undefined;
      }),
    ]);

    let generatedBuffer: Buffer;
    let isMock = false;
    let promptUsed = '';

    if (isOpenAIConfigured()) {
      console.log(`[AI Pipeline] Executing multi-image room-preserving placement with model: ${aiConfig.generationModel}`);
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: aiConfig.timeoutMs,
      });

      // Prepare both images for multi-image edit
      // Image 1: The customer's real room photograph
      // Image 2: The isolated showroom furniture piece
      const roomFile = await toFile(hallBuffer, 'customer_room.jpg', { type: 'image/jpeg' });
      const prodFile = await toFile(isolatedProductBuffer, 'furniture_product.png', { type: 'image/png' });

      const categoryName = productAnalysis?.category || 'furniture piece';

      const editPrompt = `You are a master interior visualizer.
IMAGE 1 is the customer's ACTUAL real room photograph.
IMAGE 2 is the actual ${categoryName} product from the showroom with background already isolated.

CRITICAL MANDATES:
1. ROOM PRESERVATION: Retain the customer's room from Image 1 100% intact. Keep the walls, paint color, wallpaper pattern, windows, doors, flooring, ceiling, and lighting completely unchanged. Do NOT alter, repaint, or remodel the room interior.
2. PRODUCT PLACEMENT: Place the EXACT ${categoryName} from Image 2 into Image 1. Do NOT change its design, color, upholstery, material, or silhouette. (Keep it as the exact ${categoryName} shown in Image 2).
3. SCALE & POSITION: Place the piece at the ${placement} position on the floor. Match the physical dimensions (${productWidth} × ${productDepth} × ${productHeight} ${dimensionUnit}) with realistic scale relative to the room.
4. CONTACT & LIGHTING: Make the furniture sit firmly on the floor plane with realistic soft contact shadows and ambient occlusion matching the room's natural lighting.
${instructions && instructions.trim() ? `5. SALESPERSON INSTRUCTIONS: "${instructions.trim()}"` : ''}

Output the customer's real room with the showroom product naturally placed inside it.`;

      promptUsed = editPrompt;

      try {
        const response = await openai.images.edit({
          model: 'gpt-image-1',
          image: [roomFile, prodFile],
          prompt: editPrompt,
          size: aiConfig.imageSize,
          quality: aiConfig.imageQuality,
        });

        let b64Data = response.data?.[0]?.b64_json;
        if (!b64Data && response.data?.[0]?.url) {
          const fetchRes = await fetch(response.data[0].url);
          const arrayBuf = await fetchRes.arrayBuffer();
          b64Data = Buffer.from(arrayBuf).toString('base64');
        }

        if (b64Data) {
          generatedBuffer = Buffer.from(b64Data, 'base64');
        } else {
          throw new Error('OpenAI returned empty payload');
        }
      } catch (editError: any) {
        console.warn(`[AI Pipeline] images.edit encountered error: ${editError?.message}, using photorealistic direct compositing fallback`);
        generatedBuffer = await createDirectPhotorealisticComposite({
          hallBuffer,
          isolatedProductBuffer,
          placement,
        });
      }
    } else {
      console.warn(`[AI Pipeline] OPENAI_API_KEY not configured. Using marked development simulation mode.`);
      isMock = true;
      generatedBuffer = await createDirectPhotorealisticComposite({
        hallBuffer,
        isolatedProductBuffer,
        placement,
        isDevBanner: true,
      });
    }

    // 5. Save generated image locally
    console.log(`[AI Pipeline] Saving generated visualization to disk...`);
    const saved = await saveImageToDisk(generatedBuffer, 'generated', 'generated', 'png');

    // 6. Update database record to COMPLETED
    await prisma.visualization.update({
      where: { id: visualizationId },
      data: {
        status: 'COMPLETED',
        generated_image_path: saved.relativePath,
        error_message: isMock ? 'Generated in development mock mode (Configure OPENAI_API_KEY in .env.local for live AI)' : null,
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[AI Pipeline] Successfully completed visualization ${visualizationId} in ${elapsed}s. Saved: ${saved.relativePath}`);

    return {
      success: true,
      generatedImagePath: saved.relativePath,
      roomAnalysis,
      productAnalysis,
      promptUsed,
      isMock,
    };
  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const errorMessage = error?.message || 'Unknown visualization error';
    console.error(`[AI Pipeline] Failed visualization ${visualizationId} after ${elapsed}s:`, errorMessage);

    await prisma.visualization.update({
      where: { id: visualizationId },
      data: {
        status: 'FAILED',
        error_message: errorMessage,
      },
    }).catch((dbErr) => console.error('Failed to update visualization status to FAILED:', dbErr));

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Creates a clean composite placing the isolated product onto the real room
 * with realistic contact shadow underneath.
 */
async function createDirectPhotorealisticComposite({
  hallBuffer,
  isolatedProductBuffer,
  placement,
  isDevBanner = false,
}: {
  hallBuffer: Buffer;
  isolatedProductBuffer: Buffer;
  placement: string;
  isDevBanner?: boolean;
}): Promise<Buffer> {
  const room = sharp(hallBuffer);
  const roomMeta = await room.metadata();
  const roomW = roomMeta.width || 1024;
  const roomH = roomMeta.height || 1024;

  // Scale isolated product to realistic proportion (~50% of room width)
  const targetProductW = Math.round(roomW * 0.52);
  const resizedProduct = await sharp(isolatedProductBuffer)
    .resize(targetProductW, undefined, { fit: 'inside' })
    .png()
    .toBuffer();

  const prodMeta = await sharp(resizedProduct).metadata();
  const prodW = prodMeta.width || targetProductW;
  const prodH = prodMeta.height || Math.round(targetProductW * 0.6);

  // Position calculation based on placement
  let left = Math.round((roomW - prodW) / 2); // default Center
  let top = Math.round(roomH * 0.46); // on the floor plane

  if (placement.toLowerCase().includes('left')) {
    left = Math.round(roomW * 0.12);
  } else if (placement.toLowerCase().includes('right')) {
    left = Math.round(roomW * 0.88 - prodW);
  }

  if (placement.toLowerCase().includes('back')) {
    top = Math.round(roomH * 0.38);
  }

  // Create soft contact shadow
  const shadowSvg = Buffer.from(`
    <svg width="${prodW + 40}" height="${Math.round(prodH * 0.3)}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${(prodW + 40) / 2}" cy="${(prodH * 0.3) / 2}" rx="${prodW * 0.45}" ry="${prodH * 0.12}" fill="rgba(0,0,0,0.4)" filter="blur(8px)" />
    </svg>
  `);

  const composites: sharp.OverlayOptions[] = [
    {
      input: shadowSvg,
      top: top + prodH - Math.round(prodH * 0.15),
      left: Math.max(0, left - 20),
    },
    {
      input: resizedProduct,
      top,
      left,
    },
  ];

  if (isDevBanner) {
    const bannerSvg = Buffer.from(`
      <svg width="${roomW}" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="${roomW}" height="60" fill="rgba(0,0,0,0.75)" />
        <text x="20" y="38" fill="#f59e0b" font-size="16" font-family="sans-serif" font-weight="bold">
          DEVELOPMENT SIMULATION (ROOM 100% PRESERVED • PRODUCT ISOLATED)
        </text>
      </svg>
    `);
    composites.push({ input: bannerSvg, top: 0, left: 0 });
  }

  return await sharp(hallBuffer)
    .composite(composites)
    .png()
    .toBuffer();
}
