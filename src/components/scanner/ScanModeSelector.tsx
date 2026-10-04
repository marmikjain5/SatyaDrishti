import React from 'react';
import { Layers, Grid3X3, Info } from 'lucide-react';
import { useScanStore } from '../../store/scanStore';
import { cn } from '../../lib/utils';
import type { ScanMode } from '../../types/scan';

const MODES: { value: ScanMode; label: string; shortLabel: string; icon: typeof Layers; description: string }[] = [
  {
    value: 'single-product',
    label: 'Single Product / Multi-Angle',
    shortLabel: 'Multi-Angle',
    icon: Layers,
    description: 'Multiple images = different angles of ONE product. Declarations are consolidated.',
  },
  {
    value: 'parallel-products',
    label: 'Parallel Products',
    shortLabel: 'Parallel',
    icon: Grid3X3,
    description: 'Each image = a SEPARATE product. Products are scanned concurrently.',
  },
];

export const ScanModeSelector: React.FC = () => {
  const { scanMode, setScanMode, isProcessing, isParallelProcessing, uploadedImages } = useScanStore();

  // Don't allow mode switch while processing
  const isLocked = isProcessing || isParallelProcessing;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
          Scanning Mode
        </span>
        {isLocked && (
          <span className="text-[10px] text-amber-600 font-medium">
            (locked during processing)
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2">
        {MODES.map((mode) => {
          const isActive = scanMode === mode.value;
          const Icon = mode.icon;
          return (
            <button
              key={mode.value}
              onClick={() => {
                if (!isLocked) {
                  setScanMode(mode.value);
                }
              }}
              disabled={isLocked}
              className={cn(
                'flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border-2 transition-all duration-200 text-left',
                isActive
                  ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60',
                isLocked && !isActive && 'opacity-50 cursor-not-allowed'
              )}
              title={mode.description}
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-xs font-semibold leading-tight',
                    isActive ? 'text-blue-900' : 'text-slate-700'
                  )}
                >
                  {/* Show full label on sm+, short label on mobile */}
                  <span className="hidden sm:inline">{mode.label}</span>
                  <span className="inline sm:hidden">{mode.shortLabel}</span>
                </p>
                <p className="hidden sm:block text-[10px] text-slate-500 mt-0.5 leading-snug">
                  {mode.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contextual hint */}
      {scanMode === 'parallel-products' && uploadedImages.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-indigo-50/80 border border-indigo-200/80 px-3 py-2 text-[11px] text-indigo-800">
          <Info className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
          <span>
            Upload images of <strong>different products</strong>. Each image will be scanned
            as an independent product with its own compliance result.
          </span>
        </div>
      )}
    </div>
  );
};
