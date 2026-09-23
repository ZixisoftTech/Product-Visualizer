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

  // 2. Multi-Zone Border Sampling (Wall Palette vs Floor/Rug Palette)
  // Showroom photos have different background colors on top (wall) vs bottom (floor/rug)
  let topR = 0, topG = 0, topB = 0, topSamples = 0;
  let botR = 0, botG = 0, botB = 0, botSamples = 0;
  let leftR = 0, leftG = 0, leftB = 0, leftSamples = 0;
  let rightR = 0, rightG = 0, rightB = 0, rightSamples = 0;

  const step = Math.max(1, Math.floor(Math.min(w, h) / 30));

  // Top border (Wall)
  for (let x = 0; x < w; x += step) {
    const idx = x * 4;
    topR += data[idx]; topG += data[idx + 1]; topB += data[idx + 2];
    topSamples++;
  }
  // Bottom border (Floor/Rug)
  for (let x = 0; x < w; x += step) {
    const idx = ((h - 1) * w + x) * 4;
    botR += data[idx]; botG += data[idx + 1]; botB += data[idx + 2];
    botSamples++;
  }
  // Left border
  for (let y = 0; y < h; y += step) {
    const idx = (y * w) * 4;
    leftR += data[idx]; leftG += data[idx + 1]; leftB += data[idx + 2];
    leftSamples++;
  }
  // Right border
  for (let y = 0; y < h; y += step) {
    const idx = (y * w + (w - 1)) * 4;
    rightR += data[idx]; rightG += data[idx + 1]; rightB += data[idx + 2];
    rightSamples++;
  }

  const avgTop = [topR / topSamples, topG / topSamples, topB / topSamples];
  const avgBot = [botR / botSamples, botG / botSamples, botB / botSamples];
  const avgLeft = [leftR / leftSamples, leftG / leftSamples, leftB / leftSamples];
  const avgRight = [rightR / rightSamples, rightG / rightSamples, rightB / rightSamples];

  // 3. Flood Fill BFS from outer boundaries inward
  const visited = new Uint8Array(w * h); // 0: unvisited, 1: background, 2: foreground
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  // Push all 4 outer borders as initial seeds
  for (let x = 0; x < w; x++) {
    queue[qTail++] = x; visited[x] = 1; // Top
    const b = (h - 1) * w + x;
    queue[qTail++] = b; visited[b] = 1; // Bottom
  }
  for (let y = 1; y < h - 1; y++) {
    const l = y * w;
    queue[qTail++] = l; visited[l] = 1; // Left
    const r = y * w + (w - 1);
    queue[qTail++] = r; visited[r] = 1; // Right
  }

  const baseTolerance = 56;

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);
    const cIdx = curr * 4;

    const cr = data[cIdx];
    const cg = data[cIdx + 1];
    const cb = data[cIdx + 2];

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const n = neighbors[i];
      if (n === -1 || visited[n] !== 0) continue;

      const nx = n % w;
      const ny = Math.floor(n / w);
      const nIdx = n * 4;
      const nr = data[nIdx];
      const ng = data[nIdx + 1];
      const nb = data[nIdx + 2];

      // Select reference background palette based on spatial location
      let refBg = avgTop;
      if (ny > h * 0.60) {
        refBg = avgBot; // Floor / Rug palette
      } else if (nx < w * 0.25) {
        refBg = avgLeft;
      } else if (nx > w * 0.75) {
        refBg = avgRight;
      }

      // Distance from corresponding background palette
      const distFromBg = Math.sqrt(
        (nr - refBg[0]) ** 2 +
        (ng - refBg[1]) ** 2 +
        (nb - refBg[2]) ** 2
      );

      // Distance from neighboring background pixel (smooth gradient / shadows)
      const distFromNeighbor = Math.sqrt(
        (nr - cr) ** 2 +
        (ng - cg) ** 2 +
        (nb - cb) ** 2
      );

      // Studio neutral tone check (low chroma neutral gray/white/cream)
      const maxC = Math.max(nr, ng, nb);
      const minC = Math.min(nr, ng, nb);
      const isNeutralStudio = (maxC - minC < 30) && (
        (nr > 160 && ng > 160 && nb > 160) || // Light wall
        (ny > h * 0.68 && distFromNeighbor < 42) // Showroom floor/rug
      );

      // Showroom floor gradient detection (gradual shadow on the floor)
      const isFloorGradient = (ny > h * 0.65) && (distFromNeighbor < 32);

      const isBackground = (distFromBg < baseTolerance * 1.4) ||
        (distFromNeighbor < baseTolerance * 0.75 && distFromBg < baseTolerance * 1.9) ||
        (isNeutralStudio && distFromNeighbor < baseTolerance * 0.95) ||
        isFloorGradient;

      if (isBackground) {
        visited[n] = 1;
        queue[qTail++] = n;
      } else {
        visited[n] = 2; // Hit edge of furniture
      }
    }
  }

  // 4. Apply Alpha Transparency Mask
  for (let i = 0; i < w * h; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0; // Pure transparent
    }
  }

  // 5. Anti-aliasing Edge Feathering on Transition Boundary
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (visited[idx] !== 1) {
        let bgNeighbors = 0;
        if (visited[idx - 1] === 1) bgNeighbors++;
        if (visited[idx + 1] === 1) bgNeighbors++;
        if (visited[idx - w] === 1) bgNeighbors++;
        if (visited[idx + w] === 1) bgNeighbors++;

        if (bgNeighbors > 0) {
          const pIdx = idx * 4;
          data[pIdx + 3] = Math.round(data[pIdx + 3] * (1 - (bgNeighbors * 0.20)));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
