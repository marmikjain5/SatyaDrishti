import React, { useCallback, useState } from 'react';
import { Upload, ImagePlus, AlertCircle, Camera } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { useScanStore } from '../../store/scanStore';
import { cn } from '../../lib/utils';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];
const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.webp,.heic,.heif,image/*';

export const ImageUploader: React.FC = () => {
  const { addImages, isProcessing, scanMode } = useScanStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);
      const invalid = fileArray.filter(
        (f) => f.type && !ACCEPTED_TYPES.includes(f.type) && !f.type.startsWith('image/')
      );

      if (invalid.length > 0) {
        setError(`Unsupported format: ${invalid.map((f) => f.name).join(', ')}. Use PNG, JPG, JPEG, or WebP.`);
        return;
      }

      addImages(fileArray);
    },
    [addImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (isDisabled) return;

      if (e.dataTransfer.files?.length) {
        validateAndAdd(e.dataTransfer.files);
      }
    },
    [isDisabled, validateAndAdd]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) setIsDragActive(true);
    },
    [isDisabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleClick = () => {
    if (!isProcessing) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      validateAndAdd(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Hidden inputs with unique IDs linked to native HTML labels */}
        <input
          id="scanner-camera-capture"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={isProcessing}
          className="hidden"
          onChange={handleInputChange}
        />

        <input
          id="scanner-file-browse"
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          disabled={isProcessing}
          className="hidden"
          onChange={handleInputChange}
        />

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3.5 rounded-xl border-2 border-dashed p-6 sm:p-8 transition-all duration-200',
            isDragActive
              ? 'border-blue-500 bg-blue-50/60'
              : 'border-slate-300 bg-slate-50/40 hover:border-slate-400 hover:bg-slate-50/80',
            isProcessing && 'opacity-50 pointer-events-none cursor-not-allowed'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center h-12 w-12 rounded-2xl border shadow-xs transition-transform',
              isDragActive
                ? 'bg-blue-100 border-blue-300 text-blue-600'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            )}
          >
            {isDragActive ? (
              <ImagePlus className="h-6 w-6" />
            ) : (
              <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">
              {isDragActive ? 'Drop product packaging images here' : 'Upload Product Packaging Images'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Select multiple photos of the <span className="font-semibold text-blue-600">same product</span> from different angles (Front, Back, Side, Nutritional Panel)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PNG, JPG, JPEG, WebP • Multi-angle images will be consolidated into a single compliance audit
            </p>
          </div>

          {/* Dedicated Action Buttons (Native Labels to guarantee direct OS camera invocation) */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto pt-2">
            <label
              htmlFor="scanner-camera-capture"
              className={cn(
                'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md cursor-pointer transition-all active:scale-95 select-none min-h-[42px]',
                'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              )}
            >
              <Camera className="h-4 w-4 shrink-0" />
              <span>Take Photo (Back Camera)</span>
            </label>

            <label
              htmlFor="scanner-file-browse"
              className={cn(
                'w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs cursor-pointer transition-all active:scale-95 select-none min-h-[42px]'
              )}
            >
              <Upload className="h-4 w-4 shrink-0 text-slate-500" />
              <span>Browse Files</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
