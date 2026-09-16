/**
 * Client-side image preparation and compression helper.
 * Mobile cameras (especially iPhone Safari) produce large images (3MB - 12MB)
 * and can cause:
 * 1. Vercel Serverless Function 4.5MB request payload limit (HTTP 413) -> causing Safari to fail parsing JSON.
 * 2. iOS Safari filename non-ASCII encoding issues.
 *
 * This utility resizes the image on an HTML5 canvas to a max dimension (e.g. 1600px)
 * and compresses it to a lightweight JPEG (around 300KB - 800KB) while preserving aspect ratio.
 */

export async function compressImageForUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<File> {
  // If not an image, return as is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    // If browser doesn't support Image/Canvas (SSR), fallback to original file
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate new dimensions if image exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      // Draw onto canvas (standard browsers auto-orient modern images)
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // Create a clean, ASCII-safe filename with .jpg extension
          const cleanName = (file.name || 'upload')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.[^/.]+$/, '') + '.jpg';

          const compressedFile = new File([blob], cleanName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // If error loading image (e.g. raw heic on some browsers), fallback to original file
      resolve(file);
    };

    img.src = objectUrl;
  });
}
