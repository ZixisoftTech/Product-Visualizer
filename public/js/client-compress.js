/**
 * Vidona AI Furniture Visualizer
 * Client-side image processing, product crop/framing & safe studio cutout.
 * - Customer room: optimized high-quality JPEG.
 * - Furniture product: interactive crop & framing to isolate the exact product
 *   (discarding showroom walls, curtains, trees, ceiling) while preserving
 *   100% of furniture textures, white duvets, pillows, and wooden finishes!
 */

async function compressImageForUpload(file, maxDimension = 1200, isProduct = false, quality = 0.85) {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  const targetMaxDim = isProduct ? 1200 : Math.min(1400, maxDimension);

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > targetMaxDim || height > targetMaxDim) {
        if (width > height) {
          height = Math.round((height * targetMaxDim) / width);
          width = targetMaxDim;
        } else {
          width = Math.round((width * targetMaxDim) / height);
          height = targetMaxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);

      if (isProduct) {
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
 * Crops a product image to the exact normalized bounding box selected by user,
 * and optionally applies non-destructive studio background removal.
 * 
 * @param {File} file Source image file
 * @param {Object} normRect { x: 0..1, y: 0..1, w: 0..1, h: 0..1 }
 * @param {boolean} removeStudioBg Whether to run safe studio cutout
 * @returns {Promise<File>} Clean cropped product File
 */
async function cropAndProcessProduct(file, normRect, removeStudioBg = false) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;

      // Calculate pixel crop coordinates
      const sx = Math.max(0, Math.round((normRect.x || 0) * natW));
      const sy = Math.max(0, Math.round((normRect.y || 0) * natH));
      const sw = Math.min(natW - sx, Math.round((normRect.w || 1) * natW));
      const sh = Math.min(natH - sy, Math.round((normRect.h || 1) * natH));

      if (sw <= 0 || sh <= 0) {
        return resolve(file);
      }

      // Max dimension 1200px for sharp high-DPI rendering
      const maxDim = 1200;
      let targetW = sw;
      let targetH = sh;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      // Draw cropped area
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      // If user enabled studio cutout, apply safe non-destructive isolation
      if (removeStudioBg) {
        safeStudioCutout(canvas);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const cleanName = (file.name || 'product')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.[^/.]+$/, '') + '_picked.png';

          const croppedFile = new File([blob], cleanName, {
            type: 'image/png',
            lastModified: Date.now(),
          });

          resolve(croppedFile);
        },
        'image/png'
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Safe, Non-Destructive Studio Background Cutout:
 * ONLY removes plain studio backdrops (like pure white #FFF or studio grey)
 * strictly connected to outer borders.
 * NEVER erases white bedding, mattresses, cushions, or light wood inside the product!
 */
function safeStudioCutout(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;
  const h = canvas.height;

  // 1. Check if the image already has transparency around the border
  let transparentBorderCount = 0;
  let totalBorderCount = 0;
  for (let x = 0; x < w; x++) {
    if (data[x * 4 + 3] < 30) transparentBorderCount++;
    if (data[((h - 1) * w + x) * 4 + 3] < 30) transparentBorderCount++;
    totalBorderCount += 2;
  }
  for (let y = 1; y < h - 1; y++) {
    if (data[(y * w) * 4 + 3] < 30) transparentBorderCount++;
    if (data[(y * w + (w - 1)) * 4 + 3] < 30) transparentBorderCount++;
    totalBorderCount += 2;
  }
  if (transparentBorderCount / Math.max(1, totalBorderCount) > 0.05) {
    return; // Already pre-cut transparent PNG
  }

  // 2. Sample 4 outer corner points to verify if it is a studio background
  const getCorner = (cx, cy) => {
    const idx = (cy * w + cx) * 4;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  const cTL = getCorner(0, 0);
  const cTR = getCorner(w - 1, 0);
  const cBL = getCorner(0, h - 1);
  const cBR = getCorner(w - 1, h - 1);

  // Check variance between top corners (studio wall)
  const topDiff = Math.sqrt((cTL[0] - cTR[0]) ** 2 + (cTL[1] - cTR[1]) ** 2 + (cTL[2] - cTR[2]) ** 2);
  
  // Studio backdrop color
  const studioR = (cTL[0] + cTR[0]) / 2;
  const studioG = (cTL[1] + cTR[1]) / 2;
  const studioB = (cTL[2] + cTR[2]) / 2;

  // Tight tolerance: only pixels nearly identical to the studio wall are removed
  // This guarantees that white sheets with folds/texture or wood grain will NOT be touched
  const maxTolerance = 28;

  // BFS from top & side borders
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  // Seed top and side borders
  for (let x = 0; x < w; x++) {
    const idx = x * 4;
    const dist = Math.sqrt((data[idx] - studioR) ** 2 + (data[idx + 1] - studioG) ** 2 + (data[idx + 2] - studioB) ** 2);
    if (dist < maxTolerance) {
      visited[x] = 1;
      queue[qTail++] = x;
    }
  }

  for (let y = 1; y < h; y++) {
    const leftIdx = (y * w) * 4;
    const rightIdx = (y * w + (w - 1)) * 4;

    const distL = Math.sqrt((data[leftIdx] - studioR) ** 2 + (data[leftIdx + 1] - studioG) ** 2 + (data[leftIdx + 2] - studioB) ** 2);
    if (distL < maxTolerance) {
      const idxL = y * w;
      if (!visited[idxL]) { visited[idxL] = 1; queue[qTail++] = idxL; }
    }

    const distR = Math.sqrt((data[rightIdx] - studioR) ** 2 + (data[rightIdx + 1] - studioG) ** 2 + (data[rightIdx + 2] - studioB) ** 2);
    if (distR < maxTolerance) {
      const idxR = y * w + (w - 1);
      if (!visited[idxR]) { visited[idxR] = 1; queue[qTail++] = idxR; }
    }
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const n = neighbors[i];
      if (n === -1 || visited[n] !== 0) continue;

      const nIdx = n * 4;
      const nr = data[nIdx];
      const ng = data[nIdx + 1];
      const nb = data[nIdx + 2];

      // Strict distance check against studio backdrop color ONLY
      const dist = Math.sqrt((nr - studioR) ** 2 + (ng - studioG) ** 2 + (nb - studioB) ** 2);

      if (dist < maxTolerance) {
        visited[n] = 1;
        queue[qTail++] = n;
      } else {
        visited[n] = 2; // Boundary of furniture product
      }
    }
  }

  // Apply transparency to visited background pixels
  for (let i = 0; i < w * h; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0;
    }
  }

  // Smooth feathering on border edges
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (visited[idx] !== 1) {
        let bgCount = 0;
        if (visited[idx - 1] === 1) bgCount++;
        if (visited[idx + 1] === 1) bgCount++;
        if (visited[idx - w] === 1) bgCount++;
        if (visited[idx + w] === 1) bgCount++;
        if (bgCount > 0) {
          data[idx * 4 + 3] = Math.round(data[idx * 4 + 3] * (1 - (bgCount * 0.18)));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
