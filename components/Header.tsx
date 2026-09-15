import React from 'react';
import { Armchair, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-amber-500 shadow-md">
            <Armchair className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-bold text-lg sm:text-xl text-stone-900 tracking-tight">
                Rajgarhwala AI
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Showroom Visualizer
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-medium">
              Visualize furniture in your customer's actual room
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Room-Preserving AI</span>
            <span className="md:hidden">AI Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
