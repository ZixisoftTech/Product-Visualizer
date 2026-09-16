import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateImageBuffer } from '@/lib/image/validate';
import { saveImageToDisk } from '@/lib/image/storage';
import { visualizationFormSchema } from '@/lib/validation/visualization';
import { generateVisualization } from '@/lib/ai/generateVisualization';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const hallFile = formData.get('hall_image') as File | null;
    const productFile = formData.get('product_image') as File | null;
    const rawWidth = formData.get('product_width');
    const rawDepth = formData.get('product_depth');
    const rawHeight = formData.get('product_height');
    const rawUnit = formData.get('dimension_unit') || 'cm';
    const rawPlacement = formData.get('placement');
    const rawInstructions = formData.get('instructions') || '';

    // 1. Validate image files existence
    if (!hallFile || hallFile.size === 0) {
      return NextResponse.json(
        { error: 'Customer room image is required. Please upload a room photograph.' },
        { status: 400 }
      );
    }

    if (!productFile || productFile.size === 0) {
      return NextResponse.json(
        { error: 'Furniture product image is required. Please upload a furniture product photograph.' },
        { status: 400 }
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
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { product_width, product_depth, product_height, dimension_unit, placement, instructions } =
      parsedForm.data;

    // 3. Inspect and validate image buffers with Sharp
    const hallBuffer = Buffer.from(await hallFile.arrayBuffer());
    const productBuffer = Buffer.from(await productFile.arrayBuffer());

    const hallValidation = await validateImageBuffer(hallBuffer, hallFile.type);
    if (!hallValidation.isValid) {
      return NextResponse.json(
        { error: `Room image error: ${hallValidation.error}` },
        { status: 400 }
      );
    }

    const productValidation = await validateImageBuffer(productBuffer, productFile.type);
    if (!productValidation.isValid) {
      return NextResponse.json(
        { error: `Product image error: ${productValidation.error}` },
        { status: 400 }
      );
    }

    // 4. Save original source images to local disk
    const hallSaved = await saveImageToDisk(
      hallBuffer,
      'halls',
      'hall',
      hallValidation.metadata?.format || 'jpg'
    );

    const productSaved = await saveImageToDisk(
      productBuffer,
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
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visualization: updatedRecord,
      isMock: aiResult.isMock,
    });
  } catch (error: any) {
    console.error('[API /visualize] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing visualization' },
      { status: 500 }
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
        return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
      }
      return NextResponse.json({ visualization });
    }

    const recent = await prisma.visualization.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({ visualizations: recent });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Database error fetching visualizations' },
      { status: 500 }
    );
  }
}
