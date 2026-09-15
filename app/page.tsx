'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { HallUpload } from '@/components/HallUpload';
import { ProductUpload } from '@/components/ProductUpload';
import { DimensionForm } from '@/components/DimensionForm';
import { PlacementSelector } from '@/components/PlacementSelector';
import { InstructionInput } from '@/components/InstructionInput';
import { GenerateButton } from '@/components/GenerateButton';
import { ProcessingState } from '@/components/ProcessingState';
import { ResultViewer } from '@/components/ResultViewer';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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

export default function Home() {
  // Upload states
  const [hallFile, setHallFile] = useState<File | null>(null);
  const [hallPreview, setHallPreview] = useState<string | null>(null);

  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);

  // Dimensions state
  const [width, setWidth] = useState<string>('240');
  const [depth, setDepth] = useState<string>('90');
  const [height, setHeight] = useState<string>('85');
  const [unit, setUnit] = useState<'cm' | 'inch' | 'ft'>('cm');

  // Placement & instructions state
  const [placement, setPlacement] = useState<string>('Center');
  const [instructions, setInstructions] = useState<string>('');

  // Processing & result state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentVisualization, setCurrentVisualization] = useState<VisualizationRecord | null>(null);

  // Image handlers
  const handleHallSelect = (file: File) => {
    setHallFile(file);
    const url = URL.createObjectURL(file);
    setHallPreview(url);
    setErrorMessage(null);
  };

  const handleHallRemove = () => {
    if (hallPreview) URL.revokeObjectURL(hallPreview);
    setHallFile(null);
    setHallPreview(null);
  };

  const handleProductSelect = (file: File) => {
    setProductFile(file);
    const url = URL.createObjectURL(file);
    setProductPreview(url);
    setErrorMessage(null);
  };

  const handleProductRemove = () => {
    if (productPreview) URL.revokeObjectURL(productPreview);
    setProductFile(null);
    setProductPreview(null);
  };

  // Validation
  const widthNum = parseFloat(width);
  const depthNum = parseFloat(depth);
  const heightNum = parseFloat(height);

  const hasValidDimensions =
    !isNaN(widthNum) && widthNum > 0 &&
    !isNaN(depthNum) && depthNum > 0 &&
    !isNaN(heightNum) && heightNum > 0;

  const dimensionErrors: { width?: string; depth?: string; height?: string } = {};
  if (width !== '' && (!widthNum || widthNum <= 0)) {
    dimensionErrors.width = 'Width must be > 0';
  }
  if (depth !== '' && (!depthNum || depthNum <= 0)) {
    dimensionErrors.depth = 'Depth must be > 0';
  }
  if (height !== '' && (!heightNum || heightNum <= 0)) {
    dimensionErrors.height = 'Height must be > 0';
  }

  // Generation handler
  const handleGenerate = async () => {
    if (isProcessing) return; // Prevent duplicate submission
    if (!hallFile || !productFile || !hasValidDimensions || !placement) {
      setErrorMessage('Please fill in all required room, product, dimensions, and placement fields.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('hall_image', hallFile);
      formData.append('product_image', productFile);
      formData.append('product_width', width);
      formData.append('product_depth', depth);
      formData.append('product_height', height);
      formData.append('dimension_unit', unit);
      formData.append('placement', placement);
      if (instructions) formData.append('instructions', instructions);

      const response = await fetch('/api/visualize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate visualization');
      }

      setCurrentVisualization(data.visualization);
    } catch (err: any) {
      console.error('Visualization error:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred during visualization generation.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Regeneration handler
  const handleRegenerate = async (newPlacement: string, newInstructions: string) => {
    if (!currentVisualization || isRegenerating) return;

    setIsRegenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/visualize/${currentVisualization.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement: newPlacement,
          instructions: newInstructions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Regeneration failed');
      }

      setCurrentVisualization(data.visualization);
      setPlacement(newPlacement);
      setInstructions(newInstructions);
    } catch (err: any) {
      console.error('Regeneration error:', err);
      setErrorMessage(err?.message || 'Failed to regenerate visualization.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Reset to create a new visualization
  const handleStartNew = () => {
    setCurrentVisualization(null);
    handleHallRemove();
    handleProductRemove();
    setWidth('240');
    setDepth('90');
    setHeight('85');
    setUnit('cm');
    setPlacement('Center');
    setInstructions('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaf7]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Unable to Complete Request</p>
              <p className="text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Processing State Modal */}
        <ProcessingState isProcessing={isProcessing || isRegenerating} />

        {/* View Mode: Result or Form */}
        {currentVisualization && currentVisualization.status === 'COMPLETED' ? (
          <ResultViewer
            visualization={currentVisualization}
            onRegenerate={handleRegenerate}
            onStartNew={handleStartNew}
            isRegenerating={isRegenerating}
          />
        ) : (
          <div className="space-y-5">
            {/* Showroom salesperson instruction banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="text-xs sm:text-sm text-amber-900 font-medium">
                <span className="font-bold">Showroom Workflow:</span> Take a photo of the customer's room & showroom piece. The AI isolates the product and preserves the customer's real room.
              </div>
            </div>

            {/* Upload sections: Room & Product */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HallUpload
                file={hallFile}
                previewUrl={hallPreview}
                onFileSelect={handleHallSelect}
                onRemove={handleHallRemove}
                disabled={isProcessing}
              />

              <ProductUpload
                file={productFile}
                previewUrl={productPreview}
                onFileSelect={handleProductSelect}
                onRemove={handleProductRemove}
                disabled={isProcessing}
              />
            </div>

            {/* Dimensions */}
            <DimensionForm
              width={width}
              depth={depth}
              height={height}
              unit={unit}
              onWidthChange={setWidth}
              onDepthChange={setDepth}
              onHeightChange={setHeight}
              onUnitChange={setUnit}
              errors={dimensionErrors}
              disabled={isProcessing}
            />

            {/* Placement */}
            <PlacementSelector
              placement={placement}
              onPlacementChange={setPlacement}
              disabled={isProcessing}
            />

            {/* Natural language placement instructions */}
            <InstructionInput
              instructions={instructions}
              onChange={setInstructions}
              disabled={isProcessing}
            />

            {/* Generate Action Button */}
            <GenerateButton
              hasHall={!!hallFile}
              hasProduct={!!productFile}
              hasValidDimensions={hasValidDimensions}
              hasPlacement={!!placement}
              isProcessing={isProcessing}
              onClick={handleGenerate}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white py-4 px-4 text-center text-xs text-stone-400">
        Rajgarhwala AI Furniture Visualizer • Showroom Sales Edition • Local Storage & MySQL Powered
      </footer>
    </div>
  );
}
