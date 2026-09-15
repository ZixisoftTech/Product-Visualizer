import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, RefreshCw, Home } from 'lucide-react';

interface HallUploadProps {
  file: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function HallUpload({
  file,
  previewUrl,
  onFileSelect,
  onRemove,
  disabled = false,
}: HallUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onFileSelect(selected);
    }
    // reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm transition-all hover:border-stone-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">
            1
          </span>
          <h2 className="font-semibold text-stone-900 text-base sm:text-lg">
            Upload Customer Room
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
            alt="Customer Room Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/80 via-stone-950/40 to-transparent p-3 flex items-center justify-between">
            <div className="text-white text-xs truncate max-w-[65%]">
              <p className="font-medium truncate">{file?.name || 'Customer Room Photo'}</p>
              <p className="text-stone-300 text-[11px]">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => galleryInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm transition flex items-center space-x-1"
                title="Replace Room Image"
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
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <Home className="w-6 h-6" />
          </div>
          <p className="text-stone-800 font-medium text-sm sm:text-base mb-1">
            Customer's Living Room or Hall
          </p>
          <p className="text-stone-500 text-xs sm:text-sm max-w-sm mx-auto mb-4">
            Upload the customer's real room photograph. Room structure, lighting, and existing decor will be preserved.
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

      {/* Hidden file inputs: one standard, one with mobile camera capture */}
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
