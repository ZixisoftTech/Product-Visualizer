import { prisma } from '../lib/db/prisma';
import { generateVisualization } from '../lib/ai/generateVisualization';
import { saveImageToDisk, readImageBuffer } from '../lib/image/storage';
import { validateImageBuffer } from '../lib/image/validate';
import { visualizationFormSchema, regenerationSchema } from '../lib/validation/visualization';
import sharp from 'sharp';

async function runE2ETest() {
  console.log('====================================================');
  console.log('RAJGARHWALA AI FURNITURE VISUALIZER — END-TO-END TEST');
  console.log('====================================================\n');

  // 1. Create simulated real room image (a warm living room with wooden floors and neutral walls)
  const roomSvg = Buffer.from(`
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <!-- Ceiling & Walls -->
      <rect width="800" height="400" fill="#f5f0eb" />
      <line x1="0" y1="400" x2="800" y2="400" stroke="#d5c8b8" stroke-width="4" />
      <!-- Window -->
      <rect x="50" y="80" width="160" height="240" fill="#e0f2fe" stroke="#94a3b8" stroke-width="4" />
      <line x1="130" y1="80" x2="130" y2="320" stroke="#94a3b8" stroke-width="2" />
      <!-- Wooden Parquet Floor -->
      <rect y="400" width="800" height="200" fill="#c29b70" />
      <text x="300" y="200" fill="#78716c" font-size="20" font-family="sans-serif">Customer Living Room</text>
    </svg>
  `);
  const roomBuffer = await sharp(roomSvg).jpeg().toBuffer();

  // 2. Create simulated showroom sofa photograph with showroom floor and background tags
  const sofaSvg = Buffer.from(`
    <svg width="600" height="500" xmlns="http://www.w3.org/2000/svg">
      <!-- Showroom Background Floor & Wall -->
      <rect width="600" height="350" fill="#e2e8f0" />
      <rect y="350" width="600" height="150" fill="#cbd5e1" />
      <!-- Price tag clutter -->
      <rect x="50" y="50" width="80" height="40" fill="#facc15" />
      <text x="55" y="75" fill="#000000" font-size="12" font-family="sans-serif">SALE $1299</text>
      <!-- Camel Velvet 3-Seater Sofa Body -->
      <rect x="100" y="220" width="400" height="160" rx="20" fill="#b45309" />
      <!-- Cushions -->
      <rect x="120" y="240" width="110" height="100" rx="10" fill="#d97706" />
      <rect x="245" y="240" width="110" height="100" rx="10" fill="#d97706" />
      <rect x="370" y="240" width="110" height="100" rx="10" fill="#d97706" />
      <!-- Legs -->
      <rect x="120" y="380" width="12" height="30" fill="#1c1917" />
      <rect x="468" y="380" width="12" height="30" fill="#1c1917" />
    </svg>
  `);
  const sofaBuffer = await sharp(sofaSvg).jpeg().toBuffer();

  console.log('1. Validating and saving showroom input images...');
  const roomValid = await validateImageBuffer(roomBuffer, 'image/jpeg');
  if (!roomValid.isValid) throw new Error('Room image invalid');

  const sofaValid = await validateImageBuffer(sofaBuffer, 'image/jpeg');
  if (!sofaValid.isValid) throw new Error('Sofa image invalid');

  const savedRoom = await saveImageToDisk(roomBuffer, 'halls', 'hall', 'jpg');
  const savedSofa = await saveImageToDisk(sofaBuffer, 'products', 'product', 'jpg');
  console.log(`   Saved Room: ${savedRoom.relativePath}`);
  console.log(`   Saved Sofa: ${savedSofa.relativePath}`);

  console.log('\n2. Testing TEST 01 — Normal Sofa placement in MySQL...');
  const viz = await prisma.visualization.create({
    data: {
      hall_image_path: savedRoom.relativePath,
      product_image_path: savedSofa.relativePath,
      product_width: 240,
      product_depth: 90,
      product_height: 85,
      dimension_unit: 'cm',
      placement: 'Center',
      instructions: 'Place sofa against the back wall centered in available space.',
      status: 'PENDING',
    },
  });
  console.log(`   Created Visualization ID: ${viz.id}`);

  console.log('\n3. Executing AI Visualization Pipeline...');
  const result = await generateVisualization({
    visualizationId: viz.id,
    hallImagePath: savedRoom.relativePath,
    productImagePath: savedSofa.relativePath,
    productWidth: 240,
    productDepth: 90,
    productHeight: 85,
    dimensionUnit: 'cm',
    placement: 'Center',
    instructions: 'Place sofa against the back wall centered in available space.',
  });

  if (!result.success || !result.generatedImagePath) {
    throw new Error(`Pipeline failed: ${result.error}`);
  }
  console.log(`   ✅ Generation Succeeded! Generated Image: ${result.generatedImagePath}`);

  // Verify file exists on disk
  const genBuffer = await readImageBuffer(result.generatedImagePath);
  const genMeta = await sharp(genBuffer).metadata();
  console.log(`   Generated Image verified on disk: ${genMeta.width}x${genMeta.height} (${genMeta.format})`);

  console.log('\n4. Testing TEST 06 — Regeneration Flow with new instructions...');
  // Salesperson asks: "Move sofa toward the left wall closer to the window."
  await prisma.visualization.update({
    where: { id: viz.id },
    data: {
      placement: 'Against Left Wall',
      instructions: 'Move sofa toward the left wall closer to the window.',
      status: 'PENDING',
    },
  });

  const regenResult = await generateVisualization({
    visualizationId: viz.id,
    hallImagePath: savedRoom.relativePath,
    productImagePath: savedSofa.relativePath,
    productWidth: 240,
    productDepth: 90,
    productHeight: 85,
    dimensionUnit: 'cm',
    placement: 'Against Left Wall',
    instructions: 'Move sofa toward the left wall closer to the window.',
  });

  if (!regenResult.success || !regenResult.generatedImagePath) {
    throw new Error(`Regeneration failed: ${regenResult.error}`);
  }
  console.log(`   ✅ Regeneration Succeeded! Updated Image: ${regenResult.generatedImagePath}`);

  const updatedRecord = await prisma.visualization.findUnique({ where: { id: viz.id } });
  console.log(`   Final DB Status: ${updatedRecord?.status}`);
  console.log(`   Final Placement: ${updatedRecord?.placement}`);
  console.log(`   Final Image: ${updatedRecord?.generated_image_path}`);

  console.log('\n====================================================');
  console.log('E2E TEST COMPLETED SUCCESSFULLY WITH ZERO ERRORS');
  console.log('====================================================\n');
}

runE2ETest().catch((err) => {
  console.error('E2E test failed:', err);
  process.exit(1);
});
