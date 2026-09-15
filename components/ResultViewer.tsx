import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  Maximize2,
  Download,
  PlusCircle,
  Sliders,
  ExternalLink,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { ALLOWED_PLACEMENTS } from '@/lib/validation/visualization';

interface VisualizationRecord {
  id: string;
  hall_image_path: string;
  product_image_path: string;
  product_width: number;
  product_depth: number;
  product_height: number;
  dimension_unit: string;
  placement: string;
  instructions: string | null;
  generated_image_path: string | null;
  status: string;
  error_message: string | null;
}

interface ResultViewerProps {
  visualization: VisualizationRecord;
  onRegenerate: (newPlacement: string, newInstructions: string) => Promise<void>;
  onStartNew: () => void;
  isRegenerating: boolean;
}

export function ResultViewer({
  visualization,
  onRegenerate,
  onStartNew,
  isRegenerating,
}: ResultViewerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [newPlacement, setNewPlacement] = useState(visualization.placement);
  const [newInstructions, setNewInstructions] = useState(visualization.instructions || '');

  const originalUrl = visualization.hall_image_path;
  const generatedUrl = visualization.generated_image_path || visualization.hall_image_path;
  const productUrl = visualization.product_image_path;

  const handleRegenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegenerate(newPlacement, newInstructions);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Photorealistic Visualization Ready
            </span>
            {visualization.error_message?.includes('mock mode') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Dev Mock Mode
              </span>
            )}
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 mt-1">
            Visualized in Customer's Actual Room
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            {visualization.product_width}×{visualization.product_depth}×{visualization.product_height}{' '}
            {visualization.dimension_unit} • {visualization.placement}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'slider' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Slider
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'side-by-side' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Side by Side
            </button>
          </div>

          <button
            type="button"
            onClick={onStartNew}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 text-stone-600" />
            <span className="hidden xs:inline">New Visual</span>
          </button>
        </div>
      </div>

      {/* Main Image Display */}
      <div className="bg-white rounded-3xl p-3 sm:p-5 border border-stone-200/80 shadow-md">
        {viewMode === 'slider' ? (
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] bg-stone-900 select-none touch-none">
            {/* Background: Generated Image */}
            <img
              src={generatedUrl}
              alt="AI Furniture Visualization"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-stone-950/80 text-white text-xs font-bold backdrop-blur-sm z-10">
              AI Visualization
            </span>

            {/* Foreground: Original Room Image (Clipped via slider position) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={originalUrl}
                alt="Original Customer Room"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  // Ensure inner image stays aligned with full container
                  minWidth: '100%',
                }}
              />
              <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-stone-950/80 text-white text-xs font-bold backdrop-blur-sm z-10">
                Original Room
              </span>
            </div>

            {/* Vertical Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize z-20"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-stone-900">
                <Sliders className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Range Input Overlay for accessibility and touch dragging */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              aria-label="Before and after comparison slider"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100 border border-stone-200">
                <img
                  src={originalUrl}
                  alt="Original Customer Room"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-stone-950/80 text-white text-xs font-bold backdrop-blur-sm">
                  Original Customer Room
                </span>
              </div>
            </div>

            <div>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-900 border border-stone-200 shadow-sm">
                <img
                  src={generatedUrl}
                  alt="AI Furniture Visualization"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold backdrop-blur-sm">
                  AI Visualization (Preserved Room)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons below image */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Full Res</span>
            </a>
            <a
              href={generatedUrl}
              download={`rajgarhwala-room-visualization-${visualization.id.slice(0, 6)}.png`}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Image</span>
            </a>
          </div>

          <div className="text-stone-500 font-medium">
            Drag slider left/right to compare before and after
          </div>
        </div>
      </div>

      {/* Preservation & Product Reference Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Preserved Room Card */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Customer Room Source
          </h4>
          <div className="flex items-center space-x-3">
            <img
              src={originalUrl}
              alt="Room Thumbnail"
              className="w-16 h-16 rounded-xl object-cover border border-stone-200"
            />
            <div className="text-xs text-stone-600">
              <p className="font-semibold text-stone-900">Room Architecture Preserved</p>
              <p className="text-stone-500 mt-0.5">Walls, floorings, doors, and ambient lighting preserved</p>
            </div>
          </div>
        </div>

        {/* Showroom Product Card */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Showroom Product Source
          </h4>
          <div className="flex items-center space-x-3">
            <img
              src={productUrl}
              alt="Product Thumbnail"
              className="w-16 h-16 rounded-xl object-cover border border-stone-200"
            />
            <div className="text-xs text-stone-600">
              <p className="font-semibold text-stone-900">Showroom Piece Isolated</p>
              <p className="text-stone-500 mt-0.5">Showroom background stripped, upholstery & form replicated</p>
            </div>
          </div>
        </div>

        {/* Placement Specifications */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Scale & Coordinates
          </h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Placement:</span>
              <span className="font-semibold text-stone-900">{visualization.placement}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Dimensions:</span>
              <span className="font-semibold text-stone-900">
                {visualization.product_width} × {visualization.product_depth} × {visualization.product_height} {visualization.dimension_unit}
              </span>
            </div>
            {visualization.instructions && (
              <p className="text-stone-500 italic mt-1 line-clamp-2">
                "{visualization.instructions}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Regeneration Panel */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                Regenerate with Adjusted Placement
              </h3>
              <p className="text-xs text-stone-500">
                Uses the same room & product photos. Update positioning or natural-language instructions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingInstructions(!isEditingInstructions)}
            className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold hover:bg-stone-50 transition"
          >
            {isEditingInstructions ? 'Hide Adjustments' : 'Adjust Placement'}
          </button>
        </div>

        {isEditingInstructions && (
          <form onSubmit={handleRegenerateSubmit} className="space-y-4 pt-2 border-t border-stone-100">
            {/* Placement choices */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                New Placement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALLOWED_PLACEMENTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={isRegenerating}
                    onClick={() => setNewPlacement(item)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-center border transition ${
                      newPlacement === item
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Instruction input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                New Placement Instructions
              </label>
              <textarea
                rows={3}
                value={newInstructions}
                disabled={isRegenerating}
                onChange={(e) => setNewInstructions(e.target.value)}
                maxLength={1000}
                placeholder="e.g. Move the sofa slightly to the left. Make it closer to the back wall."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-200 bg-stone-50/50 focus:bg-white transition focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                disabled={isRegenerating}
                onClick={() => setIsEditingInstructions(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRegenerating}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition flex items-center space-x-2"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Visualization'}</span>
              </button>
            </div>
          </form>
        )}

        {!isEditingInstructions && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-stone-500">
              Satisfied with the result? You can download the image or start a new visualization for another room/product.
            </p>
            <button
              type="button"
              disabled={isRegenerating}
              onClick={() => onRegenerate(visualization.placement, visualization.instructions || '')}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow transition flex items-center space-x-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Generate Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
