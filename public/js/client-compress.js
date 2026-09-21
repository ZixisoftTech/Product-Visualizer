/**
 * Rajgarhwala AI Furniture Visualizer
 * Client-side image compression for mobile browsers (especially Safari/iOS).
 * Resizes camera photos to max 1600px and produces clean lightweight JPEGs
 * avoiding payload limits, timeout, and non-ASCII filename bugs.
 */

async function compressImageForUpload(file, maxDimension = 1600, quality = 0.82) {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

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

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

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
      resolve(file);
    };

    img.src = objectUrl;
  });
}
