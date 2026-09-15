import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const STAGES = [
  'Analyzing customer room architecture...',
  'Isolating furniture piece & stripping showroom clutter...',
  'Calculating room perspective, vanishing points & scale...',
  'Balancing contact shadows and ambient lighting...',
  'Generating photorealistic visualization with OpenAI...',
  'Finalizing high-resolution result...',
];

interface ProcessingStateProps {
  isProcessing: boolean;
}

export function ProcessingState({ isProcessing }: ProcessingStateProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
          <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-amber-700">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        </div>

        <h3 className="font-serif font-bold text-xl text-stone-900 mb-1">
          Creating Visualization
        </h3>
        <p className="text-stone-500 text-xs sm:text-sm mb-6">
          Preserving your customer's actual room while naturally placing the showroom product
        </p>

        <div className="space-y-2.5 text-left bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-4">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage}
                className={`flex items-center space-x-2.5 text-xs sm:text-sm transition-all ${
                  isCurrent
                    ? 'text-stone-900 font-semibold translate-x-1'
                    : isDone
                    ? 'text-stone-400 font-normal line-through'
                    : 'text-stone-300'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-stone-300 flex-shrink-0" />
                )}
                <span className="truncate">{stage}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-stone-400">
          This usually takes between 15 to 30 seconds. Please keep this tab open.
        </p>
      </div>
    </div>
  );
}
