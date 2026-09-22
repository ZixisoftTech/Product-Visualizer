/**
 * Rajgarhwala AI Furniture Visualizer
 * Client-side image compression & product isolation for mobile & desktop browsers.
 * - Customer room: optimized JPEG (preserves quality while avoiding huge camera file limits).
 * - Furniture product: isolates background and preserves full PNG transparency.
 */

async function compressImageForUpload(file, maxDimension = 1600, isProduct = false, quality = 0.84) {
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

      // If product image, remove solid/studio background if not already transparent
      if (isProduct) {
        isolateProductBackground(canvas);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const cleanName = (file.name || 'product')
              .replace(/[^a-zA-Z0-9._-]/g, '_')
              .replace(/\.[^/.]+$/, '') + '.png';

            const compressedFile = new File([blob], cleanName, {
              type: 'image/png',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/png'
        );
      } else {
        // Room image: clean high-quality JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const cleanName = (file.name || 'room')
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
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Isolates product by removing uniform/studio/white backgrounds
 * Keeps upholstery, cushions, frame, legs 100% intact.
 */
function isolateProductBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;
  const h = canvas.height;

  // Check if image already has transparent pixels around border
  let transparentCount = 0;
  const checkBorderPoints = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1]
  ];

  for (const [x, y] of checkBorderPoints) {
    const idx = (y * w + x) * 4;
    if (data[idx + 3] < 40) {
      transparentCount++;
    }
  }

  // If already transparent PNG, don't alter pixels
  if (transparentCount >= 3) {
    return;
  }

  // Sample corner background color
  let totalR = 0, totalG = 0, totalB = 0, samples = 0;
  for (const [x, y] of checkBorderPoints) {
    const idx = (y * w + x) * 4;
    totalR += data[idx];
    totalG += data[idx + 1];
    totalB += data[idx + 2];
    samples++;
  }

  const bgR = totalR / samples;
  const bgG = totalG / samples;
  const bgB = totalB / samples;

  // Only remove background if corner samples are relatively bright/neutral (studio/white/light showroom)
  const isLightOrNeutral = (bgR > 180 && bgG > 180 && bgB > 180) || 
    (Math.abs(bgR - bgG) < 25 && Math.abs(bgG - bgB) < 25 && bgR > 140);

  if (!isLightOrNeutral) {
    return;
  }

  const threshold = 36;
  const feather = 20;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      (r - bgR) ** 2 +
      (g - bgG) ** 2 +
      (b - bgB) ** 2
    );

    if (dist < threshold) {
      data[i + 3] = 0;
    } else if (dist < threshold + feather) {
      const factor = (dist - threshold) / feather;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
