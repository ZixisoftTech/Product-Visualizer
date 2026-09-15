import React from 'react';
import { MessageSquareText } from 'lucide-react';

interface InstructionInputProps {
  instructions: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function InstructionInput({
  instructions,
  onChange,
  disabled = false,
}: InstructionInputProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm transition-all hover:border-stone-300">
      <div className="flex items-center space-x-2 mb-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">
          5
        </span>
        <h2 className="font-semibold text-stone-900 text-base sm:text-lg">
          Additional Instructions (Optional)
        </h2>
      </div>

      <p className="text-stone-500 text-xs sm:text-sm mb-3">
        Specify walking clearance, orientation facing TV/windows, or alignment details for the AI model.
      </p>

      <div className="relative">
        <textarea
          rows={3}
          value={instructions}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          maxLength={1000}
          placeholder="e.g. Place the sofa against the back wall, centered in the available space, facing the camera. Keep realistic walking space on both sides."
          className="w-full px-3.5 py-3 rounded-xl text-sm font-medium border border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-200 bg-stone-50/50 focus:bg-white transition focus:outline-none resize-none"
        />
        <div className="absolute right-3 bottom-2.5 text-[11px] text-stone-400 font-medium">
          {instructions.length}/1000
        </div>
      </div>

      <div className="mt-2 flex items-center space-x-1.5 text-stone-400 text-xs">
        <MessageSquareText className="w-3.5 h-3.5" />
        <span>Passed directly to the OpenAI vision reasoning engine</span>
      </div>
    </div>
  );
}
