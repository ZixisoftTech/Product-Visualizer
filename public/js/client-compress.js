/**
 * Rajgarhwala AI Furniture Visualizer
 * Client-side image compression & product isolation for mobile & desktop browsers.
 * - Customer room: optimized JPEG (preserves quality while avoiding huge camera file limits).
 * - Furniture product: isolates background and preserves full PNG transparency.
 */

async function compressImageForUpload(file, maxDimension = 1200, isProduct = false, quality = 0.82) {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // Optimize target max dimension: 800px is crystal clear for isolated products, 1200px for room
  const targetMaxDim = isProduct ? 800 : Math.min(1200, maxDimension);

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
 * High-precision product background isolation:
 * Uses boundary flood-fill & edge detection to remove showroom walls,
 * studio backdrops, and floors while preserving the furniture piece 100%.
 * Eliminates the rectangular box artifact entirely.
 */
function isolateProductBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;
  const h = canvas.height;

  // 1. Check if image is already a transparent PNG
  let transparentBorderPixels = 0;
  let totalBorderPixels = 0;

  for (let x = 0; x < w; x++) {
    const topIdx = x * 4;
    const botIdx = ((h - 1) * w + x) * 4;
    if (data[topIdx + 3] < 30) transparentBorderPixels++;
    if (data[botIdx + 3] < 30) transparentBorderPixels++;
    totalBorderPixels += 2;
  }
  for (let y = 1; y < h - 1; y++) {
    const leftIdx = (y * w) * 4;
    const rightIdx = (y * w + (w - 1)) * 4;
    if (data[leftIdx + 3] < 30) transparentBorderPixels++;
    if (data[rightIdx + 3] < 30) transparentBorderPixels++;
    totalBorderPixels += 2;
  }

  // If already > 5% transparent around the border, it is pre-cutout
  if (transparentBorderPixels / Math.max(1, totalBorderPixels) > 0.05) {
    return;
  }

  // 2. Sample border colors to build background palette
  let bgR = 0, bgG = 0, bgB = 0, samples = 0;
  const borderStep = Math.max(1, Math.floor(Math.min(w, h) / 40));

  for (let x = 0; x < w; x += borderStep) {
    const tIdx = x * 4;
    const bIdx = ((h - 1) * w + x) * 4;
    bgR += data[tIdx] + data[bIdx];
    bgG += data[tIdx + 1] + data[bIdx + 1];
    bgB += data[tIdx + 2] + data[bIdx + 2];
    samples += 2;
  }
  for (let y = 0; y < h; y += borderStep) {
    const lIdx = (y * w) * 4;
    const rIdx = (y * w + (w - 1)) * 4;
    bgR += data[lIdx] + data[rIdx];
    bgG += data[lIdx + 1] + data[rIdx + 1];
    bgB += data[lIdx + 2] + data[rIdx + 2];
    samples += 2;
  }

  const avgR = bgR / Math.max(1, samples);
  const avgG = bgG / Math.max(1, samples);
  const avgB = bgB / Math.max(1, samples);

  // 3. Flood Fill BFS from outer boundaries inward
  const visited = new Uint8Array(w * h); // 0: unvisited, 1: background, 2: foreground
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  // Push all border pixels as seeds
  for (let x = 0; x < w; x++) {
    queue[qTail++] = x; // y = 0
    visited[x] = 1;
    const bIdx = (h - 1) * w + x;
    queue[qTail++] = bIdx; // y = h - 1
    visited[bIdx] = 1;
  }
  for (let y = 1; y < h - 1; y++) {
    const lIdx = y * w;
    queue[qTail++] = lIdx; // x = 0
    visited[lIdx] = 1;
    const rIdx = y * w + (w - 1);
    queue[qTail++] = rIdx; // x = w - 1
    visited[rIdx] = 1;
  }

  const colorTolerance = 48; // Max color difference from local / border background

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);
    const cIdx = curr * 4;

    const cr = data[cIdx];
    const cg = data[cIdx + 1];
    const cb = data[cIdx + 2];

    // Check 4 neighbors (Up, Down, Left, Right)
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

      // Distance from global border background average
      const distFromAvg = Math.sqrt(
        (nr - avgR) ** 2 +
        (ng - avgG) ** 2 +
        (nb - avgB) ** 2
      );

      // Distance from immediate neighbor pixel (smooth gradient check)
      const distFromNeighbor = Math.sqrt(
        (nr - cr) ** 2 +
        (ng - cg) ** 2 +
        (nb - cb) ** 2
      );

      // Showroom studio light background detection (low saturation neutral tint)
      const maxC = Math.max(nr, ng, nb);
      const minC = Math.min(nr, ng, nb);
      const isNeutralStudio = (maxC - minC < 32) && (nr > 135 && ng > 135 && nb > 135);

      const isBackgroundPixel = (distFromAvg < colorTolerance * 1.35) ||
        (distFromNeighbor < colorTolerance * 0.70 && distFromAvg < colorTolerance * 1.6) ||
        (isNeutralStudio && distFromNeighbor < colorTolerance * 0.90);

      if (isBackgroundPixel) {
        visited[n] = 1; // Mark as background
        queue[qTail++] = n;
      } else {
        visited[n] = 2; // Hit edge of furniture
      }
    }
  }

  // 4. Apply Alpha Mask and Edge Feathering
  for (let i = 0; i < w * h; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0; // Strictly transparent
    }
  }

  // Soft edge anti-aliasing on transition boundary
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (visited[idx] !== 1) {
        // Count background neighbors
        let bgNeighbors = 0;
        if (visited[idx - 1] === 1) bgNeighbors++;
        if (visited[idx + 1] === 1) bgNeighbors++;
        if (visited[idx - w] === 1) bgNeighbors++;
        if (visited[idx + w] === 1) bgNeighbors++;

        if (bgNeighbors > 0) {
          const pIdx = idx * 4;
          data[pIdx + 3] = Math.round(data[pIdx + 3] * (1 - (bgNeighbors * 0.22)));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
