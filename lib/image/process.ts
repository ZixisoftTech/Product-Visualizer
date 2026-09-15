import sharp from 'sharp';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Optimizes an image buffer for OpenAI vision API or web display
 * without modifying the original preserved file.
 */
export async function optimizeImageForAI(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<{ buffer: Buffer; format: string; width: number; height: number; base64: string }> {
  const { maxWidth = 1536, maxHeight = 1536, quality = 85, format = 'jpeg' } = options;

  let pipeline = sharp(buffer).rotate(); // auto-orient from EXIF

  const metadata = await pipeline.metadata();
  const currentWidth = metadata.width || 1024;
  const currentHeight = metadata.height || 1024;

  if (currentWidth > maxWidth || currentHeight > maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  let finalBuffer: Buffer;
  let mimeType: string;

  if (format === 'png') {
    finalBuffer = await pipeline.png({ quality }).toBuffer();
    mimeType = 'image/png';
  } else if (format === 'webp') {
    finalBuffer = await pipeline.webp({ quality }).toBuffer();
    mimeType = 'image/webp';
  } else {
    finalBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    mimeType = 'image/jpeg';
  }

  const resultMeta = await sharp(finalBuffer).metadata();

  return {
    buffer: finalBuffer,
    format,
    width: resultMeta.width || currentWidth,
    height: resultMeta.height || currentHeight,
    base64: `data:${mimeType};base64,${finalBuffer.toString('base64')}`,
  };
}

/**
 * Generates a lightweight preview thumbnail.
 */
export async function generateThumbnail(buffer: Buffer, size = 300): Promise<Buffer> {
  return await sharp(buffer)
    .rotate()
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toBuffer();
}
