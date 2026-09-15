import { ProductAnalysis } from './types';
import { removeBackground } from '@imgly/background-removal-node';

export interface ProductIsolationSpec {
  keepElements: string[];
  discardElements: string[];
  productSummary: string;
}

/**
 * Removes showroom background, floors, price tags, and clutter
 * from the product image, returning a pristine transparent PNG buffer.
 */
export async function isolateFurnitureProduct(productBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('[Product Isolation] Running high-precision background removal on furniture product...');
    const blob = await removeBackground(productBuffer);
    const arrayBuffer = await blob.arrayBuffer();
    const isolatedBuffer = Buffer.from(arrayBuffer);
    console.log(`[Product Isolation] Successfully isolated furniture piece (${isolatedBuffer.length} bytes)`);
    return isolatedBuffer;
  } catch (err: any) {
    console.warn('[Product Isolation] Background removal fallback warning:', err?.message);
    // If background removal fails, return the original buffer
    return productBuffer;
  }
}

/**
 * Prepares explicit isolation criteria to ensure background clutter
 * (showroom walls, price tags, other displays, people) is stripped away
 * while keeping arms, legs, cushions, upholstery, and seams intact.
 */
export function buildProductIsolationSpec(analysis?: ProductAnalysis): ProductIsolationSpec {
  if (!analysis) {
    return {
      keepElements: ['complete furniture piece', 'cushions', 'arms', 'legs', 'upholstery', 'frame'],
      discardElements: ['showroom background', 'showroom floor', 'price tags', 'other furniture', 'people'],
      productSummary: 'Showroom furniture product',
    };
  }

  const keepElements = [
    `primary ${analysis.category} structure`,
    'original upholstery & color tones',
    ...analysis.importantFeatures,
  ];

  const discardElements = [
    'all showroom floors, tiles, and rugs',
    'all showroom walls, lighting fixtures, and signage',
    'any adjacent furniture pieces or props',
    'people, sales tags, barcodes, price boards',
    ...analysis.backgroundClutterToExclude,
  ];

  return {
    keepElements,
    discardElements,
    productSummary: `${analysis.color} ${analysis.category} made of ${analysis.material}`,
  };
}
