import React from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface GenerateButtonProps {
  hasHall: boolean;
  hasProduct: boolean;
  hasValidDimensions: boolean;
  hasPlacement: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

export function GenerateButton({
  hasHall,
  hasProduct,
  hasValidDimensions,
  hasPlacement,
  isProcessing,
  onClick,
}: GenerateButtonProps) {
  const isReady = hasHall && hasProduct && hasValidDimensions && hasPlacement && !isProcessing;

  const missingRequirements: string[] = [];
  if (!hasHall) missingRequirements.push('Customer Room');
  if (!hasProduct) missingRequirements.push('Furniture Product');
  if (!hasValidDimensions) missingRequirements.push('Dimensions');
  if (!hasPlacement) missingRequirements.push('Placement');

  return (
    <div className="pt-2 pb-6">
      <button
        type="button"
        disabled={!isReady}
        onClick={onClick}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center space-x-2.5 transition-all shadow-lg ${
          isReady
            ? 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer active:scale-[0.99] shadow-stone-900/20'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing with OpenAI...</span>
          </>
        ) : (
          <>
            <Sparkles className={`w-5 h-5 ${isReady ? 'text-amber-400' : 'text-stone-400'}`} />
            <span>Generate AI Visualization</span>
          </>
        )}
      </button>

      {!isReady && !isProcessing && missingRequirements.length > 0 && (
        <div className="mt-2.5 flex items-center justify-center space-x-1.5 text-xs text-stone-500 text-center">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>Please provide: {missingRequirements.join(', ')} to generate</span>
        </div>
      )}
    </div>
  );
}
