import { validateImageBuffer } from '../lib/image/validate';
import { saveImageToDisk, resolveUploadDiskPath, generateUniqueFilename } from '../lib/image/storage';
import { visualizationFormSchema, regenerationSchema } from '../lib/validation/visualization';
import { buildVisualizationPrompt } from '../lib/ai/prompts';
import { prisma } from '../lib/db/prisma';
import sharp from 'sharp';

async function runTestSuite() {
  console.log('====================================================');
  console.log('RAJGARHWALA AI FURNITURE VISUALIZER — TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // --- SECTION 1: SHARP IMAGE VALIDATION ---
  console.log('\n--- 1. Image Validation & Sharp Processing Tests ---');

  // Generate a valid 100x100 JPEG buffer using Sharp
  const validJpgBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 200, g: 150, b: 100 },
    },
  })
    .jpeg()
    .toBuffer();

  const validJpgResult = await validateImageBuffer(validJpgBuffer, 'image/jpeg');
  assert(validJpgResult.isValid === true, 'TEST: Valid JPEG passes validation');
  assert(validJpgResult.metadata?.format === 'jpeg', 'TEST: Valid JPEG metadata format is jpeg');
  assert(validJpgResult.metadata?.width === 100, 'TEST: Valid JPEG metadata width is 100');

  // Test 10: Unsupported File (.exe, .pdf, .txt)
  const textBuffer = Buffer.from('This is a plain text file, not an image');
  const txtResult = await validateImageBuffer(textBuffer, 'text/plain');
  assert(txtResult.isValid === false, 'TEST 10: Plain text rejected as unsupported file');

  const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00');
  const exeResult = await validateImageBuffer(exeBuffer, 'application/x-msdownload');
  assert(exeResult.isValid === false, 'TEST 10: Binary executable rejected as unsupported file');

  // Test 12: Corrupt image file renamed as .jpg
  const corruptBuffer = Buffer.from('Corrupt pseudo JPEG header \xff\xd8\xff\xe0 random garbage bytes');
  const corruptResult = await validateImageBuffer(corruptBuffer, 'image/jpeg');
  assert(corruptResult.isValid === false, 'TEST 12: Corrupted image file correctly rejected by Sharp');

  // Empty buffer
  const emptyResult = await validateImageBuffer(Buffer.alloc(0));
  assert(emptyResult.isValid === false, 'TEST: Empty buffer rejected');

  // --- SECTION 2: ZOD VALIDATION (TEST 07: Invalid Dimensions) ---
  console.log('\n--- 2. Form & Dimension Validation Tests (TEST 07) ---');

  // Test 07: Width: -100, Depth: abc, Height: 0
  const invalidDims = visualizationFormSchema.safeParse({
    product_width: -100,
    product_depth: 'abc',
    product_height: 0,
    dimension_unit: 'cm',
    placement: 'Center',
  });
  assert(invalidDims.success === false, 'TEST 07: Negative, non-numeric and 0 dimensions rejected');

  // Valid dimensions
  const validDims = visualizationFormSchema.safeParse({
    product_width: 240,
    product_depth: 90,
    product_height: 85,
    dimension_unit: 'cm',
    placement: 'Center',
    instructions: 'Place sofa against the back wall.',
  });
  assert(validDims.success === true, 'TEST 01: Normal Sofa dimensions & placement validated successfully');

  // Test custom units (inch, ft)
  const inchDims = visualizationFormSchema.safeParse({
    product_width: 80,
    product_depth: 35,
    product_height: 32,
    dimension_unit: 'inch',
    placement: 'Against Back Wall',
  });
  assert(inchDims.success === true, 'TEST 01b: Valid dimensions with inch unit');

  // Invalid unit
  const badUnit = visualizationFormSchema.safeParse({
    product_width: 200,
    product_depth: 100,
    product_height: 80,
    dimension_unit: 'meters',
    placement: 'Center',
  });
  assert(badUnit.success === false, 'TEST: Unsupported dimension unit rejected');

  // --- SECTION 3: REGENERATION VALIDATION (TEST 06) ---
  console.log('\n--- 3. Regeneration Validation Tests (TEST 06) ---');
  const regenValid = regenerationSchema.safeParse({
    placement: 'Against Left Wall',
    instructions: 'Move sofa toward the left wall.',
  });
  assert(regenValid.success === true, 'TEST 06: Valid regeneration request validated');

  // --- SECTION 4: LOCAL STORAGE & PATH SECURITY ---
  console.log('\n--- 4. Local Filesystem Storage & Security Tests ---');

  const filename = generateUniqueFilename('test_hall', 'jpg');
  assert(
    filename.startsWith('test_hall_') && filename.endsWith('.jpg'),
    'TEST: Unique filename conforms to prefix_date_uuid format'
  );

  const saved = await saveImageToDisk(validJpgBuffer, 'halls', 'hall', 'jpg');
  assert(
    saved.relativePath.startsWith('/uploads/halls/'),
    'TEST: File saved under /uploads/halls/ relative path'
  );

  // Path traversal security check
  let traversalBlocked = false;
  try {
    resolveUploadDiskPath('../../../../etc/passwd');
  } catch (err) {
    traversalBlocked = true;
  }
  assert(traversalBlocked, 'TEST: Path traversal attempt (../../../../etc/passwd) safely blocked');

  // --- SECTION 5: MYSQL & PRISMA ORM INTEGRATION ---
  console.log('\n--- 5. MySQL Database & Prisma Integration Tests ---');

  const testRecord = await prisma.visualization.create({
    data: {
      hall_image_path: saved.relativePath,
      product_image_path: saved.relativePath,
      product_width: 240,
      product_depth: 90,
      product_height: 85,
      dimension_unit: 'cm',
      placement: 'Center',
      instructions: 'Place sofa against the back wall centered in available space.',
      status: 'PENDING',
    },
  });

  assert(!!testRecord.id, 'TEST: MySQL record created with unique ID');
  assert(testRecord.status === 'PENDING', 'TEST: Initial status is PENDING');

  // Update status to PROCESSING and COMPLETED
  const updatedProcessing = await prisma.visualization.update({
    where: { id: testRecord.id },
    data: { status: 'PROCESSING' },
  });
  assert(updatedProcessing.status === 'PROCESSING', 'TEST: Updated status to PROCESSING');

  const updatedCompleted = await prisma.visualization.update({
    where: { id: testRecord.id },
    data: {
      status: 'COMPLETED',
      generated_image_path: '/uploads/generated/test_gen.png',
    },
  });
  assert(updatedCompleted.status === 'COMPLETED', 'TEST: Updated status to COMPLETED with image path');

  // Clean up test record
  await prisma.visualization.delete({ where: { id: testRecord.id } });
  assert(true, 'TEST: Test record cleaned up from MySQL');

  // --- SECTION 6: AI PROMPT ARCHITECTURE ---
  console.log('\n--- 6. AI Prompt Preservation & Fidelity Architecture ---');

  const prompt = buildVisualizationPrompt({
    roomAnalysis: {
      roomType: 'living room',
      floorDescription: 'light oak parquet flooring',
      wallDescription: 'warm cream walls with 5-inch white baseboards',
      cameraPerspective: 'eye-level 50mm lens perspective angled 15 degrees right',
      lighting: 'bright diffused daylight from left window',
      windows: ['large left sliding window'],
      doors: ['back right hallway entrance'],
      availablePlacementArea: 'central wall expanse',
      existingFurniture: ['minimalist wall-mounted TV console'],
    },
    productAnalysis: {
      category: '3-seater sofa',
      orientation: 'angled front-right',
      visualDescription: 'luxurious camel velvet 3-seater sofa with deep tufted back',
      material: 'camel velvet with double stitching',
      color: 'warm camel',
      shape: 'contemporary boxy frame with track arms',
      importantFeatures: ['black metal tapered legs', 'thick dual seat cushions', 'fluted stitching'],
      backgroundClutterToExclude: ['showroom floor tiles', 'yellow sale price tag on right arm'],
    },
    width: 240,
    depth: 90,
    height: 85,
    unit: 'cm',
    placement: 'Against Back Wall',
    instructions: 'Place the sofa centered against the back wall facing the camera with 60cm walking clearance.',
  });

  assert(prompt.includes('ROOM PRESERVATION'), 'TEST 15: Prompt enforces strict ROOM PRESERVATION');
  assert(prompt.includes('PRODUCT IDENTITY'), 'TEST 16: Prompt enforces exact PRODUCT IDENTITY');
  assert(prompt.includes('camel velvet'), 'TEST 16: Prompt preserves specific product material and color');
  assert(prompt.includes('DISCARD ALL SHOWROOM BACKGROUND'), 'TEST 02: Prompt mandates stripping showroom clutter');
  assert(prompt.includes('Width 240 cm × Depth 90 cm × Height 85 cm'), 'TEST 17: Prompt specifies exact dimensions and scale');
  assert(prompt.includes('60cm walking clearance'), 'TEST 19: Prompt includes full natural-language instruction');

  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
