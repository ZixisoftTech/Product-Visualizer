import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateImageBuffer } from '@/lib/image/validate';
import { saveImageToDisk } from '@/lib/image/storage';
import { visualizationFormSchema } from '@/lib/validation/visualization';
import { generateVisualization } from '@/lib/ai/generateVisualization';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Userid, Token, X-Requested-With',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Helper to parse image input from:
 * 1. File / Blob
 * 2. Base64 string (with or without data:image/...;base64, prefix)
 * 3. HTTP / HTTPS image URL
 */
async function parseImageInput(
  val: any,
  defaultFormat: string = 'jpeg'
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!val) return null;

  // 1. File or Blob instance
  if (typeof val === 'object' && typeof val.arrayBuffer === 'function') {
    try {
      const arrBuf = await val.arrayBuffer();
      if (arrBuf.byteLength === 0) return null;
      return {
        buffer: Buffer.from(arrBuf),
        mimeType: val.type || `image/${defaultFormat}`,
      };
    } catch (e) {
      console.error('[API /visualize] Error reading File arrayBuffer:', e);
      return null;
    }
  }

  // 2. String input (URL or Base64)
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // 2a. Remote URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const res = await fetch(trimmed);
        if (res.ok) {
          const arrBuf = await res.arrayBuffer();
          const mime = res.headers.get('content-type') || `image/${defaultFormat}`;
          return { buffer: Buffer.from(arrBuf), mimeType: mime };
        }
      } catch (err) {
        console.error('[API /visualize] Failed to fetch image from URL:', err);
      }
    }

    // 2b. Base64 string
    let b64 = trimmed;
    let mimeType = `image/${defaultFormat}`;
    const dataUriMatch = trimmed.match(/^data:image\/([a-zA-Z0-9-+]+);base64,/i);
    if (dataUriMatch) {
      mimeType = `image/${dataUriMatch[1].toLowerCase()}`;
      b64 = trimmed.substring(dataUriMatch[0].length);
    }
    try {
      const buffer = Buffer.from(b64, 'base64');
      if (buffer.length > 0) {
        return { buffer, mimeType };
      }
    } catch (err) {
      console.error('[API /visualize] Base64 decode error:', err);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    let hallInput: any = null;
    let productInput: any = null;
    let rawWidth: any = 180;
    let rawDepth: any = 90;
    let rawHeight: any = 85;
    let rawUnit: any = 'cm';
    let rawPlacement: any = 'Center';
    let rawInstructions: any = '';

    const contentType = request.headers.get('content-type') || '';

    // Handle JSON or Multipart/Form-Data
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      hallInput = body.hall_image || body.room_image;
      productInput = body.product_image || body.furniture_image;
      rawWidth = body.product_width ?? 180;
      rawDepth = body.product_depth ?? 90;
      rawHeight = body.product_height ?? 85;
      rawUnit = body.dimension_unit || 'cm';
      rawPlacement = body.placement || 'Center';
      rawInstructions = body.instructions || '';
    } else {
      const formData = await request.formData();
      hallInput = formData.get('hall_image') || formData.get('room_image');
      productInput = formData.get('product_image') || formData.get('furniture_image');
      rawWidth = formData.get('product_width') ?? 180;
      rawDepth = formData.get('product_depth') ?? 90;
      rawHeight = formData.get('product_height') ?? 85;
      rawUnit = formData.get('dimension_unit') || 'cm';
      rawPlacement = formData.get('placement') || 'Center';
      rawInstructions = formData.get('instructions') || '';
    }

    // 1. Validate image inputs presence
    if (!hallInput) {
      return NextResponse.json(
        { error: 'Customer room image is required. Please provide hall_image (file, base64, or URL).' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!productInput) {
      return NextResponse.json(
        { error: 'Furniture product image is required. Please provide product_image (file, base64, or URL).' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Validate dimensions and form fields with Zod
    const parsedForm = visualizationFormSchema.safeParse({
      product_width: rawWidth,
      product_depth: rawDepth,
      product_height: rawHeight,
      dimension_unit: rawUnit,
      placement: rawPlacement,
      instructions: rawInstructions,
    });

    if (!parsedForm.success) {
      const errorMsg = parsedForm.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400, headers: corsHeaders });
    }

    const { product_width, product_depth, product_height, dimension_unit, placement, instructions } =
      parsedForm.data;

    // 3. Extract and validate image buffers
    const parsedHall = await parseImageInput(hallInput, 'jpeg');
    if (!parsedHall) {
      return NextResponse.json(
        { error: 'Failed to process room image. Please provide a valid file upload, base64 string, or image URL.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsedProduct = await parseImageInput(productInput, 'png');
    if (!parsedProduct) {
      return NextResponse.json(
        { error: 'Failed to process product image. Please provide a valid file upload, base64 string, or image URL.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const hallValidation = await validateImageBuffer(parsedHall.buffer, parsedHall.mimeType);
    if (!hallValidation.isValid) {
      return NextResponse.json(
        { error: `Room image error: ${hallValidation.error}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const productValidation = await validateImageBuffer(parsedProduct.buffer, parsedProduct.mimeType);
    if (!productValidation.isValid) {
      return NextResponse.json(
        { error: `Product image error: ${productValidation.error}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Save source images locally
    const hallSaved = await saveImageToDisk(
      parsedHall.buffer,
      'halls',
      'hall',
      hallValidation.metadata?.format || 'jpg'
    );

    const productSaved = await saveImageToDisk(
      parsedProduct.buffer,
      'products',
      'product',
      productValidation.metadata?.format || 'jpg'
    );

    // 5. Create visualization record in MySQL (with fallback if DB is unreachable on serverless)
    let visualization: any;
    try {
      visualization = await prisma.visualization.create({
        data: {
          hall_image_path: hallSaved.relativePath,
          product_image_path: productSaved.relativePath,
          product_width,
          product_depth,
          product_height,
          dimension_unit,
          placement,
          instructions: instructions || null,
          status: 'PENDING',
        },
      });
      console.log(`[API /visualize] Created record ${visualization.id} in MySQL`);
    } catch (dbErr: any) {
      console.warn('[API /visualize] Database unreachable (using serverless in-memory record):', dbErr?.message);
      visualization = {
        id: uuidv4(),
        hall_image_path: hallSaved.relativePath,
        product_image_path: productSaved.relativePath,
        product_width,
        product_depth,
        product_height,
        dimension_unit,
        placement,
        instructions: instructions || null,
        generated_image_path: null,
        status: 'PENDING',
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    }

    // 6. Execute AI visualization pipeline
    const aiResult = await generateVisualization({
      visualizationId: visualization.id,
      hallImagePath: hallSaved.relativePath,
      productImagePath: productSaved.relativePath,
      productWidth: product_width,
      productDepth: product_depth,
      productHeight: product_height,
      dimensionUnit: dimension_unit,
      placement,
      instructions,
    });

    // 7. Fetch final updated record
    let updatedRecord: any = null;
    try {
      updatedRecord = await prisma.visualization.findUnique({
        where: { id: visualization.id },
      });
    } catch (dbErr: any) {
      // ignore
    }

    if (!updatedRecord) {
      updatedRecord = {
        ...visualization,
        status: aiResult.success ? 'COMPLETED' : 'FAILED',
        generated_image_path: aiResult.generatedImagePath || null,
        error_message: aiResult.error || null,
      };
    }

    if (!aiResult.success) {
      return NextResponse.json(
        {
          error: aiResult.error || 'Visualization generation failed',
          visualization: updatedRecord,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        visualization: {
          ...updatedRecord,
          generated_image_data: aiResult.generatedImageData,
        },
        isMock: aiResult.isMock,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[API /visualize] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing visualization' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const visualization = await prisma.visualization.findUnique({
        where: { id },
      });
      if (!visualization) {
        return NextResponse.json({ error: 'Visualization not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ visualization }, { headers: corsHeaders });
    }

    const recent = await prisma.visualization.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({ visualizations: recent }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Database error fetching visualizations' },
      { status: 500, headers: corsHeaders }
    );
  }
}
