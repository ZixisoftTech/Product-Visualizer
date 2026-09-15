import sharp from 'sharp';

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    format?: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
  };
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Validates an uploaded image buffer using Sharp and MIME type inspection.
 * Rejects corrupt files, non-images, oversized files, and unsupported formats.
 */
export async function validateImageBuffer(
  buffer: Buffer,
  declaredMimeType?: string
): Promise<ImageValidationResult> {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'Empty file received' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds the 20MB limit (size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  if (declaredMimeType && !ALLOWED_MIME_TYPES.includes(declaredMimeType.toLowerCase())) {
    return {
      isValid: false,
      error: `Unsupported MIME type: ${declaredMimeType}. Supported formats: JPG, PNG, WEBP`,
    };
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format.toLowerCase())) {
      return {
        isValid: false,
        error: `Unsupported image format (${metadata.format || 'unknown'}). Supported formats: JPG, PNG, WEBP`,
      };
    }

    if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
      return { isValid: false, error: 'Corrupt or zero-dimension image' };
    }

    return {
      isValid: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        sizeBytes: buffer.length,
      },
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Invalid or corrupt image file: ${err?.message || 'Corrupt data'}`,
    };
  }
}
