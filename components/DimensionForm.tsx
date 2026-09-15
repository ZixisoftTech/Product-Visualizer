import React from 'react';
import { Ruler } from 'lucide-react';

interface DimensionFormProps {
  width: string;
  depth: string;
  height: string;
  unit: 'cm' | 'inch' | 'ft';
  onWidthChange: (val: string) => void;
  onDepthChange: (val: string) => void;
  onHeightChange: (val: string) => void;
  onUnitChange: (unit: 'cm' | 'inch' | 'ft') => void;
  errors?: {
    width?: string;
    depth?: string;
    height?: string;
  };
  disabled?: boolean;
}

export function DimensionForm({
  width,
  depth,
  height,
  unit,
  onWidthChange,
  onDepthChange,
  onHeightChange,
  onUnitChange,
  errors = {},
  disabled = false,
}: DimensionFormProps) {
  // Input sanitizer: only allow positive digits and decimal point
  const handleNumericInput = (
    value: string,
    setter: (val: string) => void
  ) => {
    // Disallow negative or arbitrary characters
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm transition-all hover:border-stone-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">
            3
          </span>
          <h2 className="font-semibold text-stone-900 text-base sm:text-lg">
            Product Dimensions
          </h2>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(['cm', 'inch', 'ft'] as const).map((u) => (
            <button
              key={u}
              type="button"
              disabled={disabled}
              onClick={() => onUnitChange(u)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unit === u
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Width */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Width ({unit})
          </label>
          <div className="relative rounded-xl shadow-sm">
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 240"
              value={width}
              disabled={disabled}
              onChange={(e) => handleNumericInput(e.target.value, onWidthChange)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium border transition focus:outline-none focus:ring-2 ${
                errors.width
                  ? 'border-red-500 focus:ring-red-200 bg-red-50/30'
                  : 'border-stone-300 focus:border-stone-900 focus:ring-stone-200 bg-stone-50/50 focus:bg-white'
              }`}
            />
          </div>
          {errors.width && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.width}</p>
          )}
        </div>

        {/* Depth */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Depth ({unit})
          </label>
          <div className="relative rounded-xl shadow-sm">
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 90"
              value={depth}
              disabled={disabled}
              onChange={(e) => handleNumericInput(e.target.value, onDepthChange)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium border transition focus:outline-none focus:ring-2 ${
                errors.depth
                  ? 'border-red-500 focus:ring-red-200 bg-red-50/30'
                  : 'border-stone-300 focus:border-stone-900 focus:ring-stone-200 bg-stone-50/50 focus:bg-white'
              }`}
            />
          </div>
          {errors.depth && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.depth}</p>
          )}
        </div>

        {/* Height */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Height ({unit})
          </label>
          <div className="relative rounded-xl shadow-sm">
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 85"
              value={height}
              disabled={disabled}
              onChange={(e) => handleNumericInput(e.target.value, onHeightChange)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium border transition focus:outline-none focus:ring-2 ${
                errors.height
                  ? 'border-red-500 focus:ring-red-200 bg-red-50/30'
                  : 'border-stone-300 focus:border-stone-900 focus:ring-stone-200 bg-stone-50/50 focus:bg-white'
              }`}
            />
          </div>
          {errors.height && (
            <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.height}</p>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center space-x-1.5 text-stone-400 text-xs">
        <Ruler className="w-3.5 h-3.5" />
        <span>Used as a scale reference to preserve realistic room proportions</span>
      </div>
    </div>
  );
}
