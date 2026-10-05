/**
 * Rule7MeasurementPanel — Automated AI Reference Detection & Letter Height Calibration
 *
 * Features:
 * 1. Reference Selection: ₹10 Coin (27mm), ₹5 Coin (25mm), Credit / ID Card (85.6 × 54mm), EAN Barcode
 * 2. Automated AI & YOLO Reference Scanner: One-click scan finds coin or card in the image
 * 3. Visual Detection Overlay: Shows exact detection location and bounding reticle on the photo
 * 4. Automatic Scale & Readability Calculation:
 *    - Immediately calculates real-world scale (mm/px, DPI)
 *    - Recalculates Font Readability Score & compliance status via readabilityService
 *    - Recalculates Rule 7 Table-I minimum letter height compliance
 * 5. Preserves all 14 statutory declaration fields and compliance checking pipeline
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
  CreditCard,
  Barcode,
  Coins,
  Sparkles,
  Camera,
  Upload,
  ScanSearch,
  Move,
  Minus,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { useScanStore } from '../../store/scanStore';
import { readabilityService } from '../../lib/readabilityService';
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
import { getScheduleIITier } from '../../lib/productDimensionsService';
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
  scanOptions?: ScanOptionsValue;
}

interface DetectedOverlayData {
  center: { x: number; y: number };
  radius?: number;
  width: number;
  height: number;
  shape: 'circle' | 'quadrilateral';
  label: string;
  confidence: number;
}

// ─── Component ────────────────────────────────────────────────────

export const Rule7MeasurementPanel: React.FC<Rule7MeasurementPanelProps> = ({ scanOptions }) => {
  const { currentScan, setReadabilityResult } = useScanStore();

  const [activeRefType, setActiveRefType] = useState<ReferenceObjectType>(
    scanOptions?.calibrationMethod === 'reference_object' && scanOptions.referenceObjectType
      ? scanOptions.referenceObjectType
      : 'coin_10'
  );
  const [imageSource, setImageSource] = useState<'scan' | 'custom'>('scan');
  const [customImageDataUrl, setCustomImageDataUrl] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [result, setResult] = useState<Rule7MeasurementResult | null>(null);

  // Detected reference overlay
  const [detectedOverlay, setDetectedOverlay] = useState<DetectedOverlayData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const [showFieldTable, setShowFieldTable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeImageDataUrl = (imageSource === 'custom' && customImageDataUrl)
    ? customImageDataUrl
    : (currentScan?.imageDataUrl || '');

  const refDims = REFERENCE_OBJECT_DIMS[activeRefType] || REFERENCE_OBJECT_DIMS['coin_10'];

  // ── Sync with Readability Service & Score ───────────────────────

  const syncWithReadability = useCallback(async (cal: CalibrationResult) => {
    if (!currentScan || !currentScan.extractedData || cal.pxPerMm <= 0) return null;
    const extractedData = currentScan.extractedData;
    const dims = extractedData.imageDimensions || {
      width: canvasRef.current?.width || 1200,
      height: canvasRef.current?.height || 900,
    };
    const scaleMmPerPx = 1 / cal.pxPerMm;
    const packageWidthMm = Math.round(dims.width * scaleMmPerPx);
    const packageHeightMm = Math.round(dims.height * scaleMmPerPx);
    const pdpAreaCm2 = Math.round((packageWidthMm * packageHeightMm) / 100);
    const scheduleTier = getScheduleIITier(pdpAreaCm2);

    try {
      const updatedResult = await readabilityService.analyze(
        currentScan.id,
        currentScan.imageDataUrl,
        extractedData,
        dims,
        {
          calibration: {
            method: 'reference-object',
            packageWidthMm,
            packageHeightMm,
            packageWidthPx: dims.width,
            packageHeightPx: dims.height,
            scaleMmPerPx: Math.round(scaleMmPerPx * 1000) / 1000,
            minNumeralHeightMm: scheduleTier.minMm,
            minNumeralHeightPt: scheduleTier.minPt,
            uncertaintyMm: 0.05,
            pdpAreaCm2,
            calibrationSourceLabel: `Calibrated via ${refDims.label.split('(')[0].trim()}`,
            details: `AI Reference calibration (${refDims.label.split('(')[0].trim()}): ${cal.refWidthPx}×${cal.refHeightPx}px = ${cal.refWidthMm}×${cal.refHeightMm}mm (Scale: ${scaleMmPerPx.toFixed(3)} mm/px, ~${Math.round(25.4 / scaleMmPerPx)} DPI)`,
          },
        }
      );
      setReadabilityResult(currentScan.id, updatedResult);
      return updatedResult;
    } catch (err) {
      console.error('Failed to sync readability with calibration:', err);
      return null;
    }
  }, [currentScan, refDims, setReadabilityResult]);

  // ── Measurement run ─────────────────────────────────────────────

  const runMeasurement = useCallback((cal: CalibrationResult | null) => {
    if (!currentScan?.extractedData) return;

    const netQtyRaw =
      currentScan.extractedData.declarations?.netQuantity?.value ||
      (currentScan.extractedData as any).netQuantity ||
      '';

    const declarations = currentScan.extractedData.declarations || {};
    const rawOcrLines = (currentScan.extractedData as any).rawOcrLines || [];

    const dims = currentScan.extractedData.imageDimensions || {
      width: canvasRef.current?.width || 800,
      height: canvasRef.current?.height || 600,
    };

    const declLines = Object.entries(declarations)
      .filter(([_, f]) => f?.value && f.value.trim().length > 0)
      .map(([k, f]) => {
        const norm = f.boundingBox?.normalized;
        const x0 = f.boundingBox?.x0 ?? (norm ? Math.round((norm.x / 100) * dims.width) : 50);
        const y0 = f.boundingBox?.y0 ?? (norm ? Math.round((norm.y / 100) * dims.height) : 50);
        const x1 = f.boundingBox?.x1 ?? (norm ? Math.round(((norm.x + norm.width) / 100) * dims.width) : 250);
        const y1 = f.boundingBox?.y1 ?? (norm ? Math.round(((norm.y + norm.height) / 100) * dims.height) : 80);
        return {
          text: `${f.label || k}: ${f.value}`,
          bbox: { x0, y0, x1, y1 },
          confidence: f.confidence || 85,
        };
      });

    const lines = declLines.length > 0 ? declLines : rawOcrLines;

    const res = measureRule7Compliance(cal, netQtyRaw, lines, dims);
    setResult(res);
  }, [currentScan]);

  // ── Overlay Placement & Live Calibration ────────────────────────

  const applyOverlay = useCallback(
    async (overlay: DetectedOverlayData) => {
      setDetectedOverlay(overlay);

      const bounds: CoinBounds =
        overlay.shape === 'circle'
          ? {
              x0: overlay.center.x - (overlay.radius || 30),
              y0: overlay.center.y - (overlay.radius || 30),
              x1: overlay.center.x + (overlay.radius || 30),
              y1: overlay.center.y + (overlay.radius || 30),
            }
          : {
              x0: Math.round(overlay.center.x - overlay.width / 2),
              y0: Math.round(overlay.center.y - overlay.height / 2),
              x1: Math.round(overlay.center.x + overlay.width / 2),
              y1: Math.round(overlay.center.y + overlay.height / 2),
            };

      const cal = calibrateFromBounds(bounds, activeRefType);
      if (cal) {
        setCalibration(cal);
        runMeasurement(cal);
        await syncWithReadability(cal);
      }
    },
    [activeRefType, runMeasurement, syncWithReadability]
  );

  const [isDragging, setIsDragging] = useState(false);

  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      const coords = getCanvasCoords(e);
      if (!coords) return;
      setIsDragging(true);

      const isCircle = activeRefType === 'coin_5' || activeRefType === 'coin_10';
      const curRadius = detectedOverlay?.radius || 32;
      const curWidth = detectedOverlay?.width || (isCircle ? curRadius * 2 : 140);
      const curHeight =
        detectedOverlay?.height ||
        (isCircle ? curRadius * 2 : Math.round(140 / (refDims.widthMm / refDims.heightMm)));

      const newOverlay: DetectedOverlayData = {
        center: coords,
        radius: isCircle ? curRadius : undefined,
        width: curWidth,
        height: curHeight,
        shape: isCircle ? 'circle' : 'quadrilateral',
        label: refDims.label.split('(')[0].trim(),
        confidence: 1.0,
      };
      applyOverlay(newOverlay);
      setDetectionNotice(
        `Snapped reference reticle to (${coords.x}, ${coords.y}). Drag to move, or use the slider below to fit the rim.`
      );
    },
    [activeRefType, applyOverlay, detectedOverlay, getCanvasCoords, refDims]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging || !detectedOverlay) return;
      const coords = getCanvasCoords(e);
      if (!coords) return;

      const newOverlay: DetectedOverlayData = {
        ...detectedOverlay,
        center: coords,
      };
      applyOverlay(newOverlay);
    },
    [applyOverlay, detectedOverlay, getCanvasCoords, isDragging]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {}
        setIsDragging(false);
      }
    },
    [isDragging]
  );

  const handleSizeChange = useCallback(
    (newSize: number) => {
      if (!detectedOverlay) return;
      const clampedSize = Math.max(16, Math.min(600, newSize));
      const isCircle = detectedOverlay.shape === 'circle';
      const newRadius = isCircle ? Math.round(clampedSize / 2) : undefined;
      const newWidth = clampedSize;
      const newHeight = isCircle
        ? clampedSize
        : Math.round(clampedSize / (refDims.widthMm / refDims.heightMm));

      const updated: DetectedOverlayData = {
        ...detectedOverlay,
        radius: newRadius,
        width: newWidth,
        height: newHeight,
      };
      applyOverlay(updated);
    },
    [applyOverlay, detectedOverlay, refDims]
  );

  // ── AI Reference Detector Runner ────────────────────────────────

  const handleScanAndDetect = useCallback(async () => {
    if (!activeImageDataUrl) return;
    setIsDetecting(true);
    setError(null);
    setDetectionNotice(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${apiUrl}/api/v1/detect-reference-object`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: activeImageDataUrl,
          reference_type: activeRefType,
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timer);

      const payload = await response.json();
      const candidate = payload?.candidates?.[0];
      if (!response.ok || payload?.status !== 'success' || !candidate) {
        throw new Error('Could not detect reference object in image. Make sure the coin or card is clearly visible.');
      }

      const box = candidate.bbox_px;
      const center = candidate.center || {
        x: Math.round(box.x + box.width / 2),
        y: Math.round(box.y + box.height / 2),
      };

      const overlay: DetectedOverlayData = {
        center,
        radius: candidate.radius || Math.round(Math.min(box.width, box.height) / 2),
        width: box.width,
        height: box.height,
        shape: candidate.shape === 'circle' ? 'circle' : 'quadrilateral',
        label: candidate.label || refDims.label.split('(')[0].trim(),
        confidence: candidate.confidence || 0.9,
      };

      await applyOverlay(overlay);

      const cal = calibrateFromBounds(
        overlay.shape === 'circle'
          ? {
              x0: center.x - (overlay.radius || 30),
              y0: center.y - (overlay.radius || 30),
              x1: center.x + (overlay.radius || 30),
              y1: center.y + (overlay.radius || 30),
            }
          : {
              x0: box.x,
              y0: box.y,
              x1: box.x + box.width,
              y1: box.y + box.height,
            },
        activeRefType
      );

      if (cal) {
        setDetectionNotice(
          `✓ AI Detected ${overlay.label}! Snapped at (${center.x}, ${center.y}). Calibrated scale: ${(1 / cal.pxPerMm).toFixed(3)} mm/px (~${Math.round(25.4 * cal.pxPerMm)} DPI). Font Readability Score & Rule 7 compliance calculated!`
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Detection request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Reference detection failed.');
      }
    } finally {
      setIsDetecting(false);
    }
  }, [activeImageDataUrl, activeRefType, applyOverlay, refDims]);

  // ── Draw Overlay on Canvas (Detected Reference Overlay) ──────────

  const drawCanvasOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (detectedOverlay) {
      const { center, radius, width, height, shape, label } = detectedOverlay;
      ctx.save();

      if (shape === 'circle' && radius) {
        // Glowing outer amber ring for coin
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f59e0b'; // Amber 500
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius + 4, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(center.x - 14, center.y);
        ctx.lineTo(center.x + 14, center.y);
        ctx.moveTo(center.x, center.y - 14);
        ctx.lineTo(center.x, center.y + 14);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center.x, center.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Cardinal edge tick marks
        const tickLen = 8;
        ctx.beginPath();
        ctx.moveTo(center.x - radius, center.y);
        ctx.lineTo(center.x - radius + tickLen, center.y);
        ctx.moveTo(center.x + radius, center.y);
        ctx.lineTo(center.x + radius - tickLen, center.y);
        ctx.moveTo(center.x, center.y - radius);
        ctx.lineTo(center.x, center.y - radius + tickLen);
        ctx.moveTo(center.x, center.y + radius);
        ctx.lineTo(center.x, center.y + radius - tickLen);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();

        // Translucent coin tint
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Badge banner above coin
        const badgeText = `✓ AI Detected: ${label} (⌀ ${radius * 2}px = ${refDims.widthMm}mm)`;
        ctx.font = 'bold 13px monospace';
        const textW = ctx.measureText(badgeText).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(center.x - textW / 2 - 8, center.y - radius - 32, textW + 16, 24);
        ctx.fillStyle = '#fef3c7';
        ctx.fillText(badgeText, center.x - textW / 2, center.y - radius - 15);
      } else {
        // Rectangle: ID Card or Barcode
        const rx = center.x - width / 2;
        const ry = center.y - height / 2;
        const isCard = activeRefType === 'id_card';
        const strokeColor = isCard ? '#3b82f6' : '#10b981';
        const bracketColor = isCard ? '#93c5fd' : '#6ee7b7';

        // Outer rounded border
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(rx, ry, width, height, 6) : ctx.rect(rx, ry, width, height);
        ctx.lineWidth = 4;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        // Corner viewfinder brackets
        const bracketLen = Math.min(22, Math.round(width * 0.12));
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = bracketColor;

        ctx.beginPath();
        ctx.moveTo(rx, ry + bracketLen);
        ctx.lineTo(rx, ry);
        ctx.lineTo(rx + bracketLen, ry);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rx + width - bracketLen, ry);
        ctx.lineTo(rx + width, ry);
        ctx.lineTo(rx + width, ry + bracketLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rx, ry + height - bracketLen);
        ctx.lineTo(rx, ry + height);
        ctx.lineTo(rx + bracketLen, ry + height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rx + width - bracketLen, ry + height);
        ctx.lineTo(rx + width, ry + height);
        ctx.lineTo(rx + width, ry + height - bracketLen);
        ctx.stroke();

        // Center crosshair
        ctx.beginPath();
        ctx.moveTo(center.x - 14, center.y);
        ctx.lineTo(center.x + 14, center.y);
        ctx.moveTo(center.x, center.y - 14);
        ctx.lineTo(center.x, center.y + 14);
        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        // Translucent card tint
        ctx.fillStyle = isCard ? 'rgba(59, 130, 246, 0.20)' : 'rgba(16, 185, 129, 0.20)';
        ctx.fillRect(rx, ry, width, height);

        // Badge banner above card
        const badgeText = `✓ AI Detected: ${label} (${width}×${height}px = ${refDims.widthMm}×${refDims.heightMm}mm)`;
        ctx.font = 'bold 13px monospace';
        const textW = ctx.measureText(badgeText).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(center.x - textW / 2 - 8, ry - 32, textW + 16, 24);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(badgeText, center.x - textW / 2, ry - 15);
      }

      ctx.restore();
    }
  }, [detectedOverlay, activeRefType, refDims]);

  // Load image onto canvas when scan changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeImageDataUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = activeImageDataUrl;

    // Reset detection on image change
    setCalibration(null);
    setResult(null);
    setDetectedOverlay(null);
    setError(null);
    setDetectionNotice(null);
  }, [activeImageDataUrl]);

  useEffect(() => {
    drawCanvasOverlay();
  }, [detectedOverlay, drawCanvasOverlay]);

  // ── Guard ───────────────────────────────────────────────────────

  if (!currentScan || currentScan.status !== 'completed' || !currentScan.extractedData) {
    return null;
  }

  const overallCfg = result ? VERDICT_CONFIG[result.overallVerdict] : null;
  const OverallIcon = overallCfg?.icon;

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
      <CardContent className="p-4 sm:p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center shrink-0">
              <Ruler className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Rule 7  -  Physical Letter Height & Readability Calibration
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose your reference object (Coin or Card) and click Scan to auto-detect and calculate font scores
              </p>
            </div>
          </div>

          {calibration && (
            <button
              onClick={() => {
                setCalibration(null);
                setResult(null);
                setDetectedOverlay(null);
                setDetectionNotice(null);
                setError(null);
                if (currentScan?.id) {
                  setReadabilityResult(currentScan.id, undefined as any);
                }
              }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
              title="Reset calibration"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Reference Object Selection & AI Scanner Bar */}
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                1. Select Reference in Photo:
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { type: 'coin_10', label: '₹10 Coin (27mm)', icon: Coins },
                { type: 'coin_5', label: '₹5 Coin (25mm)', icon: CircleDot },
                { type: 'id_card', label: 'Credit / ID Card', icon: CreditCard },
                { type: 'ean_barcode', label: 'EAN Barcode', icon: Barcode },
              ].map((btn) => {
                const isSelected = activeRefType === btn.type;
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.type}
                    type="button"
                    onClick={() => {
                      setActiveRefType(btn.type as ReferenceObjectType);
                      setDetectedOverlay(null);
                      setCalibration(null);
                    }}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer',
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60">
            <div>
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100">
                {calibration
                  ? `✓ Calibrated: ${refDims.label}`
                  : `Scan and auto-detect ${refDims.label.split('(')[0].trim()}`}
              </p>
              {calibration ? (
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5 font-mono">
                  Scale: <strong>{calibration.pxPerMm.toFixed(2)} px/mm</strong> ({(1 / calibration.pxPerMm).toFixed(3)} mm/px) · Reference: {calibration.refWidthPx}×{calibration.refHeightPx}px = {calibration.refWidthMm}×{calibration.refHeightMm}mm
                </p>
              ) : (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Click the button to automatically find the {refDims.label.split('(')[0].trim()} and compute your font readability score.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleScanAndDetect}
                disabled={isDetecting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-xs transition-all disabled:opacity-60"
              >
                <ScanSearch className={cn('h-4 w-4', isDetecting && 'animate-spin')} />
                <span>{isDetecting ? 'Scanning for Reference...' : `Scan & Detect ${refDims.label.split('(')[0].trim()}`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success / Error Banners */}
        {detectionNotice && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-200 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{detectionNotice}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Calibration Evidence Photo Toggle & Upload */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
            <Camera className="h-3.5 w-3.5 text-slate-500" />
            <span>Calibration Photo:</span>
            {imageSource === 'custom' && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                (Separate Reference Picture in Use)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setImageSource('scan');
                setCalibration(null);
                setDetectedOverlay(null);
              }}
              className={cn(
                'px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer',
                imageSource === 'scan'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              )}
            >
              <span>Main Scanned Product</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (customImageDataUrl) {
                  setImageSource('custom');
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                'px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer',
                imageSource === 'custom' && customImageDataUrl
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
              )}
            >
              <Upload className="h-3 w-3" />
              <span>{customImageDataUrl ? 'Separate Reference Photo' : 'Upload Separate Coin/Card Photo'}</span>
            </button>

            {customImageDataUrl && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                Change Photo
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result as string;
                  setCustomImageDataUrl(dataUrl);
                  setImageSource('custom');
                  setCalibration(null);
                  setDetectedOverlay(null);
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>

        {/* Visual Canvas Viewport showing detected object */}
        {activeImageDataUrl && (
          <div className="space-y-2.5">
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative bg-slate-950 flex flex-col items-center justify-center select-none shadow-xs">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full block cursor-crosshair touch-none"
                style={{ height: '370px', maxHeight: '370px', objectFit: 'contain' }}
              />
              {!detectedOverlay ? (
                <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-3 pointer-events-none">
                  <div className="bg-black/85 backdrop-blur-xs text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
                    <Move className="h-3.5 w-3.5 text-amber-400" />
                    <span>Click anywhere on the coin/card to position reticle, or click "Scan & Detect"</span>
                  </div>
                </div>
              ) : (
                <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-amber-300 text-[11px] font-medium px-2.5 py-1 rounded-md border border-amber-400/30 flex items-center gap-1.5 pointer-events-none">
                  <Move className="h-3 w-3" />
                  <span>Click or drag directly to reposition</span>
                </div>
              )}
            </div>

            {/* Interactive Dimension Slider & Fine-Tuning Control */}
            {detectedOverlay && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    {detectedOverlay.shape === 'circle' ? <Coins className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{detectedOverlay.shape === 'circle' ? 'Coin Diameter Adjustment' : 'Card Width Adjustment'}</span>
                      <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        ({detectedOverlay.shape === 'circle' ? (detectedOverlay.radius || 30) * 2 : detectedOverlay.width} px)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Drag slider or click + / - to fit the reference object rim snugly
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = detectedOverlay.shape === 'circle' ? (detectedOverlay.radius || 30) * 2 : detectedOverlay.width;
                      handleSizeChange(cur - 2);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Nudge smaller (-2px)"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>

                  <input
                    type="range"
                    min={detectedOverlay.shape === 'circle' ? 16 : 40}
                    max={detectedOverlay.shape === 'circle' ? 240 : 450}
                    step={1}
                    value={detectedOverlay.shape === 'circle' ? (detectedOverlay.radius || 30) * 2 : detectedOverlay.width}
                    onChange={(e) => handleSizeChange(Number(e.target.value))}
                    className="w-32 sm:w-44 accent-amber-500 cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const cur = detectedOverlay.shape === 'circle' ? (detectedOverlay.radius || 30) * 2 : detectedOverlay.width;
                      handleSizeChange(cur + 2);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Nudge larger (+2px)"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  <div className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 min-w-[54px] text-center border border-slate-200 dark:border-slate-700">
                    {detectedOverlay.shape === 'circle' ? `${(detectedOverlay.radius || 30) * 2}px` : `${detectedOverlay.width}px`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table-I quick reference */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-2 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              Table-I  -  Minimum Letter Heights
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

        {/* Awaiting calibration guidance when result is null */}
        {!result && (
          <div className="rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 text-center space-y-2.5">
            <div className="mx-auto w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Rule 7 Measurement Awaiting Reference Calibration
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-0.5">
                Click the blue <span className="font-semibold text-indigo-600 dark:text-indigo-400">"Scan &amp; Detect {refDims.label.split('(')[0].trim()}"</span> button above (or position the canvas reticle) to automatically detect the reference object and measure compliance with statutory Table-I letter heights.
              </p>
            </div>
          </div>
        )}

        {/* Overall verdict */}
        {result && overallCfg && OverallIcon && (
          <div className={cn('rounded-xl border px-4 py-3.5 space-y-1', overallCfg.bg, overallCfg.border)}>
            <div className="flex items-center gap-2">
              <OverallIcon className={cn('h-4.5 w-4.5', overallCfg.text)} />
              <span className={cn('text-sm font-black tracking-wide', overallCfg.text)}>
                Rule 7  -  {overallCfg.label}
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
                {result.netQuantityRaw || ' - '}
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
              <p><span className="font-semibold">Scale:</span> {calibration.pxPerMm.toFixed(3)} px / mm ({(1 / calibration.pxPerMm).toFixed(3)} mm / px)</p>
              <p><span className="font-semibold">Reference:</span> {REFERENCE_OBJECT_DIMS[calibration.referenceType]?.label || calibration.referenceType}</p>
              <p><span className="font-semibold">Measured in frame:</span> {calibration.refWidthPx}×{calibration.refHeightPx} px → {calibration.refWidthMm}×{calibration.refHeightMm} mm</p>
            </div>
          </div>
        )}

        {/* Field-level measurements table */}
        {result && result.fieldMeasurements.length > 0 && (
          <div>
            <button
              onClick={() => setShowFieldTable((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

      </CardContent>
    </Card>
  );
};
