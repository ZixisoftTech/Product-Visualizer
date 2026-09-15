export interface RoomAnalysis {
  roomType: string;
  floorDescription: string;
  wallDescription: string;
  cameraPerspective: string;
  lighting: string;
  windows: string[];
  doors: string[];
  availablePlacementArea: string;
  existingFurniture: string[];
}

export interface ProductAnalysis {
  category: string;
  orientation: string;
  visualDescription: string;
  material: string;
  color: string;
  shape: string;
  importantFeatures: string[];
  backgroundClutterToExclude: string[];
}

export interface VisualizationGenerationInput {
  visualizationId: string;
  hallImagePath: string;
  productImagePath: string;
  productWidth: number;
  productDepth: number;
  productHeight: number;
  dimensionUnit: string;
  placement: string;
  instructions?: string;
}

export interface VisualizationGenerationResult {
  success: boolean;
  generatedImagePath?: string;
  error?: string;
  roomAnalysis?: RoomAnalysis;
  productAnalysis?: ProductAnalysis;
  promptUsed?: string;
  isMock?: boolean;
}
