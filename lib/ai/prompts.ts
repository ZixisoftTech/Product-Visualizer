import { RoomAnalysis, ProductAnalysis } from './types';

export const ROOM_ANALYSIS_SYSTEM_PROMPT = `You are an architectural and interior space analyzer for a high-end furniture visualizer.
Your job is to inspect an uploaded photograph of a customer's real room and extract structural, spatial, and lighting characteristics.
You must be factual and observant. Do NOT hallucinate measurements as exact facts; describe the visible environment precisely.

Respond ONLY with valid JSON conforming to this schema:
{
  "roomType": "living room | bedroom | hallway | etc.",
  "floorDescription": "exact description of flooring (e.g., light oak parquet, polished beige marble tiles, dark carpet)",
  "wallDescription": "wall colors, textures, trims, baseboards, paint finish",
  "cameraPerspective": "eye-level / angled from left / wide-angle / high-angle, vanishing points, field of view",
  "lighting": "natural window light direction, warm ceiling recessed spots, soft ambient shadows, color temperature",
  "windows": ["list visible windows and locations"],
  "doors": ["list visible doors and locations"],
  "availablePlacementArea": "clear open floor area where furniture could naturally sit",
  "existingFurniture": ["list visible existing furniture items that must remain preserved and untouched"]
}`;

export const PRODUCT_ANALYSIS_SYSTEM_PROMPT = `You are an expert furniture product specialist.
Your task is to inspect an uploaded photograph of an actual showroom furniture product.
Crucially: The photograph may contain showroom clutter (showroom floors, tags, price cards, other unrelated furniture, background walls, showroom lighting, people).
You must ISOLATE the primary furniture product and describe it with exacting precision so it can be recreated 100% faithfully.

Respond ONLY with valid JSON conforming to this schema:
{
  "category": "sofa | bed | wardrobe | l-shaped sofa | dining table | coffee table | accent chair | etc.",
  "orientation": "facing front / angled 45 degrees left / profile",
  "visualDescription": "comprehensive visual summary of the piece",
  "material": "exact upholstery/finish (e.g., cognac top-grain leather with tufting, light grey textured linen, matte walnut veneer)",
  "color": "specific color shade and tone",
  "shape": "geometric structure, curves, contours, modular sections",
  "importantFeatures": [
    "specific legs/feet (material, color, taper)",
    "cushion style, thickness, and count",
    "armrest design and stitching details",
    "distinctive seams, tufting, handles, hardware or profile lines"
  ],
  "backgroundClutterToExclude": [
    "showroom elements that must NOT appear in the final room (e.g. showroom tiled floor, price stickers, adjacent showroom display units, background shoppers)"
  ]
}`;

interface VisualizationPromptParams {
  roomAnalysis?: RoomAnalysis;
  productAnalysis?: ProductAnalysis;
  width: number;
  depth: number;
  height: number;
  unit: string;
  placement: string;
  instructions?: string;
}

/**
 * Builds the comprehensive generation prompt enforcing room preservation,
 * product fidelity, physical scale, and lighting/shadow integration.
 */
export function buildVisualizationPrompt(params: VisualizationPromptParams): string {
  const {
    roomAnalysis,
    productAnalysis,
    width,
    depth,
    height,
    unit,
    placement,
    instructions,
  } = params;

  const roomDesc = roomAnalysis
    ? `SOURCE ROOM ENVIRONMENT:
- Room Type: ${roomAnalysis.roomType}
- Camera View & Angle: ${roomAnalysis.cameraPerspective}
- Floor: ${roomAnalysis.floorDescription}
- Walls & Architecture: ${roomAnalysis.wallDescription}
- Existing Fixtures/Lighting: ${roomAnalysis.lighting}
- Windows & Openings: ${roomAnalysis.windows.join(', ') || 'none noted'}
- Preserved Existing Elements: ${roomAnalysis.existingFurniture.join(', ') || 'clear room'}
- Target Floor Region: ${roomAnalysis.availablePlacementArea}`
    : 'SOURCE ROOM ENVIRONMENT: Real residential room photographed from realistic perspective.';

  const productDesc = productAnalysis
    ? `SOURCE FURNITURE PIECE TO INTEGRATE:
- Item: ${productAnalysis.category}
- Specific Color & Finish: ${productAnalysis.color}
- Exact Material & Texture: ${productAnalysis.material}
- Silhouette & Architecture: ${productAnalysis.shape}
- Critical Distinctive Details: ${productAnalysis.importantFeatures.join('; ')}
- DISCARD ALL SHOWROOM BACKGROUND: Strip away all showroom backgrounds, price tags, and clutter (${productAnalysis.backgroundClutterToExclude.join(', ')}). Only the furniture piece itself exists.`
    : 'SOURCE FURNITURE PIECE: Showroom furniture piece.';

  const userInstructions = instructions && instructions.trim().length > 0
    ? `ADDITIONAL SHOWROOM SALESPERSON INSTRUCTIONS:\n"${instructions.trim()}"`
    : 'No additional instructions provided.';

  return `A photorealistic interior photograph depicting the customer's ACTUAL room with the showroom furniture product naturally and seamlessly integrated.

${roomDesc}

${productDesc}

PLACEMENT & PHYSICAL SPECIFICATIONS:
- Position in Room: ${placement}
- Exact Physical Dimensions: Width ${width} ${unit} × Depth ${depth} ${unit} × Height ${height} ${unit}
- Realistic Scale: The furniture must be rendered strictly proportional to the visible room geometry and ceiling height.
${userInstructions}

CRITICAL EXECUTION MANDATES:
1. ROOM PRESERVATION: Retain the customer's exact room architecture, walls, paint color, flooring material, doors, windows, and existing room fixtures. Do NOT redecorate or remodel the room.
2. PRODUCT IDENTITY: The furniture piece must be instantly recognizable as the showroom product. Faithfully replicate its exact form, upholstery texture, color, armrests, cushion style, and distinctive feet/legs.
3. PHYSICAL REALISM & CONTACT: The furniture must rest firmly on the actual floor plane with precise soft contact shadows and ambient occlusion beneath the base/legs.
4. LIGHTING INTEGRATION: Match the direction, intensity, and warm/cool color temperature of the room's existing light sources.
5. PHOTOREALISM: High-end architectural photography quality, 50mm natural lens perspective, zero distortion, zero cut-and-paste artifacts, zero floating.`;
}
