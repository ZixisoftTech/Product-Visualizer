import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, RefreshCw, Armchair, ShieldCheck } from 'lucide-react';

interface ProductUploadProps {
  file: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function ProductUpload({
  file,
  previewUrl,
  onFileSelect,
  onRemove,
  disabled = false,
}: ProductUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onFileSelect(selected);
    }
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm transition-all hover:border-stone-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">
            2
          </span>
          <h2 className="font-semibold text-stone-900 text-base sm:text-lg">
            Upload Furniture Product
          </h2>
        </div>
        <span className="text-xs text-stone-400 font-medium hidden sm:inline">
          JPG, PNG, WEBP (Max 20MB)
        </span>
      </div>

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 aspect-[4/3] sm:aspect-[16/10]">
          <img
            src={previewUrl}
            alt="Furniture Product Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/80 via-stone-950/40 to-transparent p-3 flex items-center justify-between">
            <div className="text-white text-xs truncate max-w-[65%]">
              <p className="font-medium truncate">{file?.name || 'Showroom Product Photo'}</p>
              <div className="flex items-center space-x-1 text-amber-400 text-[11px]">
                <ShieldCheck className="w-3 h-3" />
                <span>Showroom background will be isolated</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => galleryInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition flex items-center space-x-1"
                title="Replace Product Image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Replace</span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={onRemove}
                className="px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium backdrop-blur-sm transition flex items-center space-x-1"
                title="Remove Image"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 sm:p-8 text-center bg-stone-50/50 hover:bg-stone-50 transition">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center text-stone-800">
            <Armchair className="w-6 h-6" />
          </div>
          <p className="text-stone-800 font-medium text-sm sm:text-base mb-1">
            Showroom Furniture Photograph
          </p>
          <p className="text-stone-500 text-xs sm:text-sm max-w-sm mx-auto mb-4">
            Photograph the actual product in the showroom. The AI automatically isolates the piece, stripping away showroom floors, tags, and clutter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-xs mx-auto">
            <button
              type="button"
              disabled={disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium shadow-sm transition"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => galleryInputRef.current?.click()}
              className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-sm font-medium shadow-sm transition"
            >
              <ImageIcon className="w-4 h-4" />
              <span>From Gallery</span>
            </button>
          </div>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
