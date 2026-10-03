/**
 * Rule7MeasurementPanel — Interactive Rule 7 Letter Height Measurement UI
 *
 * Features:
 * 1. Coin / reference object marking on the scanned image (draw a bounding box)
 * 2. Real-time calibration (px → mm conversion)
 * 3. Per-field letter height verdict table
 * 4. Table-I compliance summary card with statutory clause citation
 *
 * Legal basis: Rule 7 & Table-I, Legal Metrology (Packaged Commodities) Rules, 2011
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Ruler,
  CircleDot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Scale,
  Microscope,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { useScanStore } from '../../store/scanStore';
import {
  calibrateFromBounds,
  measureRule7Compliance,
  REFERENCE_OBJECT_DIMS,
  RULE7_TABLE_I,
  type CoinBounds,
  type CalibrationResult,
  type Rule7MeasurementResult,
  type Rule7Verdict,
  type ReferenceObjectType,
} from '../../lib/rule7Measurement';
import type { ScanOptionsValue } from './ScanOptionsCard';
import { cn } from '../../lib/utils';

// ─── Verdict Styling ──────────────────────────────────────────────

const VERDICT_CONFIG: Record<Rule7Verdict, {
  label: string;
  icon: React.FC<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  PASS: {
    label: 'PASS',
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  FAIL: {
    label: 'FAIL',
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950/50',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  REVIEW_REQUIRED: {
    label: 'REVIEW',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'INSUFFICIENT',
    icon: HelpCircle,
    bg: 'bg-slate-50 dark:bg-slate-900',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

// ─── Props ────────────────────────────────────────────────────────

interface Rule7MeasurementPanelProps {
  scanOptions: ScanOptionsValue;
}

// ─── Component ────────────────────────────────────────────────────

export const Rule7MeasurementPanel: React.FC<Rule7MeasurementPanelProps> = ({ scanOptions }) => {
  const { currentScan } = useScanStore();

  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [result, setResult] = useState<Rule7MeasurementResult | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<CoinBounds | null>(null);
  const [showFieldTable, setShowFieldTable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const refType: ReferenceObjectType =
    scanOptions.calibrationMethod === 'reference_object'
      ? scanOptions.referenceObjectType
      : 'none';

  const refDims = REFERENCE_OBJECT_DIMS[refType];

  // ── Image + calibration ─────────────────────────────────────────

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawCanvasOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (drawRect) {
      const { x0, y0, x1, y1 } = drawRect;
      const w = x1 - x0;
      const h = y1 - y0;

      // Semi-transparent overlay on reference object
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.fillRect(x0, y0, w, h);

      // Dashed border
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y0, w, h);

      // Label
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.92)';
      const label = refType === 'coin_10' ? '₹10 Coin' : refType === 'id_card' ? 'ID Card' : 'Barcode';
      const textPad = 4;
      const fontSize = Math.max(11, Math.min(16, canvas.width * 0.018));
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      const tw = ctx.measureText(label).width;
      const lx = Math.min(x0, canvas.width - tw - textPad * 2 - 2);
      const ly = Math.max(y0 - fontSize - textPad * 2, 0);
      ctx.fillRect(lx, ly, tw + textPad * 2, fontSize + textPad * 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, lx + textPad, ly + fontSize + textPad * 0.5);
    }
  }, [drawRect, refType]);

  // Load image onto canvas when scan changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentScan?.imageDataUrl) return;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = currentScan.imageDataUrl;

    // Reset state on new scan
    setCalibration(null);
    setResult(null);
    setDrawRect(null);
    setError(null);
  }, [currentScan?.imageDataUrl]);

  useEffect(() => {
    drawCanvasOverlay();
  }, [drawRect, drawCanvasOverlay]);

  // ── Canvas mouse events ─────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (scanOptions.calibrationMethod !== 'reference_object') return;
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawRect(null);
    setCalibration(null);
    setResult(null);
    setError(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const pos = getCanvasCoords(e);
    setDrawRect({
      x0: Math.min(drawStart.x, pos.x),
      y0: Math.min(drawStart.y, pos.y),
      x1: Math.max(drawStart.x, pos.x),
      y1: Math.max(drawStart.y, pos.y),
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    setIsDrawing(false);
    const pos = getCanvasCoords(e);
    const bounds: CoinBounds = {
      x0: Math.min(drawStart.x, pos.x),
      y0: Math.min(drawStart.y, pos.y),
      x1: Math.max(drawStart.x, pos.x),
      y1: Math.max(drawStart.y, pos.y),
    };
    setDrawRect(bounds);

    const cal = calibrateFromBounds(bounds, refType);
    if (!cal) {
      setError('The marked area is too small. Draw a larger box around the reference object.');
      return;
    }
    setCalibration(cal);
    runMeasurement(cal);
  };

  // ── Measurement run ─────────────────────────────────────────────

  const runMeasurement = useCallback((cal: CalibrationResult | null) => {
    if (!currentScan?.extractedData) return;

    const netQtyRaw = currentScan.extractedData.netQuantity || '';
    const ocrLines = (currentScan.extractedData as any).rawOcrLines || [];

    // Fallback: use extracted fields as mock OCR lines with synthetic bboxes
    const lines = ocrLines.length > 0
      ? ocrLines
      : Object.values(currentScan.extractedData)
          .filter((f: any) => f?.value && f?.boundingBox)
          .map((f: any) => ({
            text: f.value,
            confidence: f.confidence || 70,
            bbox: {
              x0: f.boundingBox.x0,
              y0: f.boundingBox.y0,
              x1: f.boundingBox.x1,
              y1: f.boundingBox.y1,
            },
          }));

    const imgDims = currentScan.extractedData.imageDimensions || { width: 800, height: 600 };

    const res = measureRule7Compliance(cal, netQtyRaw, lines, imgDims);
    setResult(res);
  }, [currentScan]);

  // Auto-run without calibration when no reference object selected
  useEffect(() => {
    if (currentScan?.status === 'completed' && scanOptions.calibrationMethod !== 'reference_object') {
      runMeasurement(null);
    }
  }, [currentScan, scanOptions.calibrationMethod, runMeasurement]);

  // ── Guard ───────────────────────────────────────────────────────

  if (!currentScan || currentScan.status !== 'completed' || !currentScan.extractedData) {
    return null;
  }

  const needsCoinMarking = scanOptions.calibrationMethod === 'reference_object' && !calibration;
  const overallCfg = result ? VERDICT_CONFIG[result.overallVerdict] : null;
  const OverallIcon = overallCfg?.icon;

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="p-4 sm:p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center shrink-0">
              <Ruler className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Rule 7 — Letter Height Measurement
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Legal Metrology (PC) Rules, 2011 · Table-I minimum font height compliance
              </p>
            </div>
          </div>

          {result && (
            <button
              onClick={() => { setCalibration(null); setResult(null); setDrawRect(null); setError(null); runMeasurement(null); }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              title="Re-run measurement"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-run</span>
            </button>
          )}
        </div>

        {/* Table-I quick reference */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-2 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              Table-I — Minimum Letter Heights
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {RULE7_TABLE_I.map((band) => {
              const isActive = result?.tableBand?.clause === band.clause;
              return (
                <div
                  key={band.clause}
                  className={cn(
                    'grid grid-cols-2 px-3 py-1.5 text-[11px]',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 font-bold'
                      : 'bg-white dark:bg-slate-900'
                  )}
                >
                  <span className={cn('text-slate-600 dark:text-slate-400', isActive && 'text-indigo-700 dark:text-indigo-300')}>
                    {band.label}
                  </span>
                  <span className={cn('font-mono font-bold text-right', isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300')}>
                    ≥ {band.minHeightMm} mm
                    {isActive && <span className="ml-1 text-indigo-500">◄</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calibration method notice */}
        {scanOptions.calibrationMethod === 'reference_object' && (
          <div className="rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-3 space-y-2">
            <div className="flex items-start gap-2">
              <CircleDot className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-800 dark:text-indigo-200">
                  {calibration
                    ? `Calibrated — ${refDims.label}`
                    : `Draw a box around your ${refDims.label}`}
                </p>
                {calibration ? (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Scale: <strong>{calibration.pxPerMm.toFixed(2)} px/mm</strong> ·
                    Reference: {calibration.refWidthPx}×{calibration.refHeightPx} px = {calibration.refWidthMm}×{calibration.refHeightMm} mm
                  </p>
                ) : (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Click and drag on the image below to mark the {refType === 'coin_10' ? '₹10 coin' : refType === 'id_card' ? 'ID card' : 'barcode'}.
                    This sets the real-world scale for mm measurement.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interactive canvas */}
        {scanOptions.calibrationMethod === 'reference_object' && currentScan.imageDataUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={cn(
                'w-full block',
                needsCoinMarking ? 'cursor-crosshair' : 'cursor-default'
              )}
              style={{ maxHeight: '320px', objectFit: 'contain' }}
            />
            {needsCoinMarking && (
              <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                <div className="bg-black/60 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                  ✚ Draw box around {refType === 'coin_10' ? '₹10 coin' : 'reference object'}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Overall verdict */}
        {result && overallCfg && OverallIcon && (
          <div className={cn('rounded-xl border px-4 py-3.5 space-y-1', overallCfg.bg, overallCfg.border)}>
            <div className="flex items-center gap-2">
              <OverallIcon className={cn('h-4.5 w-4.5', overallCfg.text)} />
              <span className={cn('text-sm font-black tracking-wide', overallCfg.text)}>
                Rule 7 — {overallCfg.label}
              </span>
              {result.tableBand && (
                <span className="ml-auto text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  Min: {result.tableBand.minHeightMm} mm
                </span>
              )}
            </div>
            <p className={cn('text-[11px] leading-snug', overallCfg.text)}>
              {result.overallVerdictReason}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              {result.clauseReference}
            </p>
          </div>
        )}

        {/* Net quantity & band info */}
        {result?.tableBand && (
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="text-slate-400 uppercase font-bold tracking-wide text-[10px]">Net Quantity (extracted)</div>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {result.netQuantityRaw || '—'}
              </div>
              {result.netQuantityGrams && (
                <div className="text-slate-400 text-[10px] mt-0.5">{result.netQuantityGrams.toLocaleString()} g / ml equivalent</div>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="text-slate-400 uppercase font-bold tracking-wide text-[10px]">Table-I Band</div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{result.tableBand.label}</div>
              <div className="text-[10px] font-mono text-violet-600 dark:text-violet-400 mt-0.5">Min: {result.tableBand.minHeightMm} mm</div>
            </div>
          </div>
        )}

        {/* Calibration summary */}
        {calibration && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px]">
            <Microscope className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
              <p><span className="font-semibold">Scale:</span> {calibration.pxPerMm.toFixed(3)} px / mm</p>
              <p><span className="font-semibold">Reference:</span> {REFERENCE_OBJECT_DIMS[calibration.referenceType].label}</p>
              <p><span className="font-semibold">Measured in frame:</span> {calibration.refWidthPx}×{calibration.refHeightPx} px → {calibration.refWidthMm}×{calibration.refHeightMm} mm</p>
            </div>
          </div>
        )}

        {/* Field-level measurements table */}
        {result && result.fieldMeasurements.length > 0 && (
          <div>
            <button
              onClick={() => setShowFieldTable((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                Field-level Measurements ({result.fieldMeasurements.length} regions)
              </span>
              {showFieldTable ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showFieldTable && (
              <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      <th className="text-left px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Field / Text</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Height</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Min</th>
                      <th className="text-center px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.fieldMeasurements.map((m, i) => {
                      const cfg = VERDICT_CONFIG[m.verdict];
                      const Icon = cfg.icon;
                      return (
                        <tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 max-w-[160px] truncate" title={m.rawText}>
                            {m.fieldName}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-700 dark:text-slate-200">
                            {m.isCalibrated ? `${m.heightMm.toFixed(2)} mm` : `~${m.heightMm.toFixed(1)} mm`}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-500 dark:text-slate-400">
                            {m.minRequiredMm} mm
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border', cfg.bg, cfg.text, cfg.border)}>
                              <Icon className="h-2.5 w-2.5" />
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Uncalibrated notice */}
        {result && !calibration && scanOptions.calibrationMethod === 'none' && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-amber-700 dark:text-amber-300">
              <strong>Uncalibrated mode:</strong> Measurements are pixel-relative estimates.
              For a confirmed Rule 7 verdict, select "Reference object in frame" in Scan Options
              and place a ₹10 coin alongside the product before scanning.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
};
