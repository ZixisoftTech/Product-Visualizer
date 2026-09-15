import React from 'react';
import { ALLOWED_PLACEMENTS } from '@/lib/validation/visualization';
import { Compass } from 'lucide-react';

interface PlacementSelectorProps {
  placement: string;
  onPlacementChange: (val: string) => void;
  disabled?: boolean;
}

export function PlacementSelector({
  placement,
  onPlacementChange,
  disabled = false,
}: PlacementSelectorProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm transition-all hover:border-stone-300">
      <div className="flex items-center space-x-2 mb-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">
          4
        </span>
        <h2 className="font-semibold text-stone-900 text-base sm:text-lg">
          Placement in Room
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ALLOWED_PLACEMENTS.map((item) => {
          const isSelected = placement === item;
          return (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => onPlacementChange(item)}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-center border transition-all ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-stone-50/70 hover:bg-stone-100 text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center space-x-1.5 text-stone-400 text-xs">
        <Compass className="w-3.5 h-3.5" />
        <span>Selected placement determines perspective orientation and floor alignment</span>
      </div>
    </div>
  );
}
