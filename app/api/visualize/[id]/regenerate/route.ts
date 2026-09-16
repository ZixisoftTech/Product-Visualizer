import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { regenerationSchema } from '@/lib/validation/visualization';
import { generateVisualization } from '@/lib/ai/generateVisualization';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Visualization ID required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = regenerationSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { placement, instructions } = parsed.data;

    // Find existing visualization
    const existing = await prisma.visualization.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Visualization record not found' }, { status: 404 });
    }

    // Update with new placement/instructions
    await prisma.visualization.update({
      where: { id },
      data: {
        placement,
        instructions: instructions || null,
        status: 'PENDING',
        error_message: null,
      },
    });

    // Re-run AI visualization pipeline reusing preserved source images and dimensions
    const aiResult = await generateVisualization({
      visualizationId: existing.id,
      hallImagePath: existing.hall_image_path,
      productImagePath: existing.product_image_path,
      productWidth: existing.product_width,
      productDepth: existing.product_depth,
      productHeight: existing.product_height,
      dimensionUnit: existing.dimension_unit,
      placement,
      instructions,
    });

    let updated: any = null;
    try {
      updated = await prisma.visualization.findUnique({
        where: { id },
      });
    } catch (e) {
      // ignore
    }

    if (!updated) {
      updated = {
        ...existing,
        placement,
        instructions: instructions || null,
        status: aiResult.success ? 'COMPLETED' : 'FAILED',
        generated_image_path: aiResult.generatedImagePath || null,
      };
    }

    if (!aiResult.success) {
      return NextResponse.json(
        {
          error: aiResult.error || 'Regeneration failed',
          visualization: updated,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visualization: {
        ...updated,
        generated_image_data: aiResult.generatedImageData,
      },
      isMock: aiResult.isMock,
    });
  } catch (error: any) {
    console.error('[API /visualize/regenerate] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during regeneration' },
      { status: 500 }
    );
  }
}
