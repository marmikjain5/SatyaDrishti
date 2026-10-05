import React from 'react';
import { X, FileImage, Layers, Info, Grid3X3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useScanStore } from '../../store/scanStore';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export const ImagePreviewPanel: React.FC = () => {
  const { uploadedImages, removeImage, isProcessing, scanMode } = useScanStore();

  if (uploadedImages.length === 0) return null;

  const isParallelMode = scanMode === 'parallel-products';
  const isMultiAngle = !isParallelMode && uploadedImages.length > 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-slate-700" />
          <span>
            {isParallelMode
              ? `Product Images for Parallel Scan (${uploadedImages.length})`
              : isMultiAngle
              ? `Multi-Angle Product Packaging Photos (${uploadedImages.length})`
              : `Uploaded Packaging Image (1)`}
          </span>
        </CardTitle>
        {isParallelMode ? (
          <Badge variant="secondary" size="sm" className="gap-1 text-xs">
            <Grid3X3 className="h-3 w-3" />
            <span>Parallel Mode</span>
          </Badge>
        ) : isMultiAngle && (
          <Badge variant="primary" size="sm" className="gap-1 text-xs">
            <Layers className="h-3 w-3" />
            <span>Multi-Angle Mode</span>
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {isParallelMode ? (
          <div className="flex items-center gap-2 rounded-lg bg-indigo-50/80 border border-indigo-200/80 px-3.5 py-2 text-xs text-indigo-900">
            <Info className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              Each image below is a <strong>separate product</strong>.{' '}
              <strong>{uploadedImages.length}</strong> {uploadedImages.length === 1 ? 'product' : 'products'} will be scanned independently and concurrently.
            </span>
          </div>
        ) : isMultiAngle && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50/80 border border-blue-200/80 px-3.5 py-2 text-xs text-blue-900">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              All <strong>{uploadedImages.length} images</strong> are treated as photos of the{' '}
              <strong>same product</strong> from different angles. Mandatory declarations from all angles
              will be merged into a single consolidated audit.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {uploadedImages.map((image, idx) => (
            <div
              key={image.id}
              className="group relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs"
            >
              <div className="aspect-square relative">
                <img
                  src={image.dataUrl}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />

                {/* Product/angle tag badge */}
                {(isParallelMode || isMultiAngle) && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-white text-[10px] font-bold shadow-xs backdrop-blur-xs ${isParallelMode ? 'bg-indigo-700/85' : 'bg-slate-900/85'}`}>
                      {isParallelMode ? `Product ${idx + 1}` : `Angle ${idx + 1}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Remove button */}
              {!isProcessing && (
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-xs"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* File info */}
              <div className="px-2.5 py-2 border-t border-slate-200 bg-white">
                <p className="text-[11px] font-semibold text-slate-900 truncate">
                  {isParallelMode ? image.name : (image.angleLabel || `Angle ${idx + 1}`)}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-normal mt-0.5">
                  {isParallelMode ? formatFileSize(image.size) : `${image.name} • ${formatFileSize(image.size)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
