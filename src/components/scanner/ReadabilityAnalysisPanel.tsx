import React, { useState, useMemo, useEffect } from 'react';
import {
  Type,
  Eye,
  ScanEye,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Info,
  Maximize2,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck,
  FileWarning,
  Copy,
  Check,
  SlidersHorizontal,
  ZoomIn,
  RefreshCw,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useScanStore } from '../../store/scanStore';
import { readabilityService } from '../../lib/readabilityService';
import { productDimensionsService } from '../../lib/productDimensionsService';
import { ForensicCoinCalibrationModal } from './ForensicCoinCalibrationModal';
import type {
  ReadabilityAnalysisResult,
  TextRegionReadability,
  ReadabilityStatus,
  ReadabilityFlag,
} from '../../types/readability';
import { cn } from '../../lib/utils';

// ─── Flag Configuration & Labels ────────────────────────────────

const FLAG_CONFIG: Record<
  ReadabilityFlag,
  { label: string; bg: string; text: string; border: string }
> = {
  BELOW_MIN_FONT_SIZE: {
    label: 'Below Min Font Size',
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800/80',
  },
  LOW_CONFIDENCE: {
    label: 'Low OCR Confidence (<60%)',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/80',
  },
  LOW_CONTRAST: {
    label: 'Low Contrast (<3:1)',
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800/80',
  },
  POOR_VISIBILITY: {
    label: 'Poor Visibility',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/80',
  },
  BACKGROUND_NOISE: {
    label: 'Background Clutter',
    bg: 'bg-slate-50 dark:bg-slate-900/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-800',
  },
  UNEVEN_ILLUMINATION: {
    label: 'Glare / Shadow',
    bg: 'bg-yellow-50 dark:bg-yellow-950/60',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800/80',
  },
};

// ─── Status Badge Config ────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReadabilityStatus,
  { label: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  compliant: {
    label: 'Compliant',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
    icon: CheckCircle2,
  },
  warning: {
    label: 'Needs Attention',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
    icon: AlertTriangle,
  },
  'non-compliant': {
    label: 'Non-Compliant',
    badgeClass: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80',
    icon: XCircle,
  },
  indeterminate: {
    label: 'Unable to Verify',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
    icon: HelpCircle,
  },
};

// ─── Main Component ─────────────────────────────────────────────

export const ReadabilityAnalysisPanel: React.FC = () => {
  const { currentScan, readabilityResults, setReadabilityResult } = useScanStore();

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'non-compliant' | 'warning' | 'compliant'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [overlayMode, setOverlayMode] = useState<'all' | 'flagged' | 'declarations'>('all');
  const [showLabelsOnImage, setShowLabelsOnImage] = useState(true);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);

  // Retrieve or compute readability analysis on the fly if not already cached
  const result: ReadabilityAnalysisResult | undefined =
    (currentScan && readabilityResults[currentScan.id]) || currentScan?.readabilityResult;

  useEffect(() => {
    if (
      currentScan &&
      currentScan.status === 'completed' &&
      currentScan.extractedData &&
      !result &&
      !isGenerating
    ) {
      setIsGenerating(true);
      const extractedData = currentScan.extractedData;
      const scanId = currentScan.id;
      const imageDataUrl = currentScan.imageDataUrl;
      const barcodeVal = extractedData.declarations?.barcode?.value;
      const barcodeWidthPx = extractedData.declarations?.barcode?.barcodeWidthPx;
      const prodName = extractedData.declarations?.productName?.value;
      const dims = extractedData.imageDimensions || { width: 800, height: 600 };

      productDimensionsService
        .resolveDimensions({
          barcode: barcodeVal && barcodeVal !== '(Not detected)' ? barcodeVal : undefined,
          productName: prodName && prodName !== '(Not detected)' ? prodName : undefined,
          barcodeWidthPx,
          imageDimensions: dims,
        })
        .then((calib) => {
          return readabilityService.analyze(
            scanId,
            imageDataUrl,
            extractedData,
            dims,
            {
              calibration: {
                method: calib.source as any,
                packageWidthMm: calib.packageWidthMm,
                packageHeightMm: calib.packageHeightMm,
                packageWidthPx: dims.width,
                packageHeightPx: dims.height,
                scaleMmPerPx: calib.scaleMmPerPx,
                minNumeralHeightMm: calib.minNumeralHeightMm,
                minNumeralHeightPt: calib.minNumeralHeightPt,
                pdpAreaCm2: calib.pdpAreaCm2,
                calibrationSourceLabel: calib.sourceLabel,
                details: calib.details,
              },
            }
          );
        })
        .then((res) => {
          setReadabilityResult(currentScan.id, res);
          setIsGenerating(false);
        })
        .catch(() => setIsGenerating(false));
    }
  }, [currentScan, result, isGenerating, setReadabilityResult]);

  if (!currentScan || currentScan.status !== 'completed' || !currentScan.extractedData) {
    return null;
  }

  if (!result) {
    return (
      <Card className="border border-slate-200 shadow-subtle bg-white p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-2 py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm font-medium text-slate-700">
            Running Optical Font Size & Readability Analysis Engine...
          </p>
        </div>
      </Card>
    );
  }

  const { summary, regions } = result;

  // Filtered regions
  const filteredRegions = regions.filter((region) => {
    // Search match
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = region.fieldName.toLowerCase().includes(q);
      const matchText = region.rawText.toLowerCase().includes(q);
      const matchRef = region.statutoryReference.toLowerCase().includes(q);
      if (!matchName && !matchText && !matchRef) return false;
    }

    // Status filter
    if (statusFilter === 'flagged') return region.flags.length > 0 || region.status !== 'compliant';
    if (statusFilter === 'non-compliant') return region.status === 'non-compliant';
    if (statusFilter === 'warning') return region.status === 'warning';
    if (statusFilter === 'compliant') return region.status === 'compliant';
    return true;
  });

  // Regions displayed on image overlay
  const overlayRegions = regions.filter((region) => {
    if (overlayMode === 'flagged') return region.flags.length > 0 || region.status !== 'compliant';
    if (overlayMode === 'declarations') return region.fieldKey !== undefined;
    return true;
  });

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyReport = () => {
    const report = {
      scanId: result.scanId,
      overallScore: summary.overallScore,
      overallStatus: summary.overallStatus,
      summary,
      flaggedDefects: result.flaggedRegions.map((r) => ({
        field: r.fieldName,
        text: r.rawText,
        fontSizePt: r.fontSize.pt,
        fontSizeMm: r.fontSize.mm,
        minRequiredPt: r.fontSize.minThresholdPt,
        minRequiredMm: r.fontSize.minThresholdMm,
        contrastRatio: r.contrast.formattedRatio,
        ocrConfidence: `${r.ocrConfidence}%`,
        visibilityScore: `${r.visibilityScore}/100`,
        status: r.status,
        flags: r.flags,
        statutoryReference: r.statutoryReference,
        remediationAdvice: r.remediationAdvice,
      })),
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const activeRegion = regions.find(
    (r) => r.id === (hoveredRegionId || selectedRegionId)
  );

  return (
    <Card className="border border-slate-200/90 dark:border-slate-800 shadow-subtle bg-white dark:bg-slate-900 overflow-hidden">
      {/* ─── Header ────────────────────────────────────────────── */}
      <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-900/80 dark:bg-indigo-950/60 flex items-center justify-center shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400 shadow-xs">
            <ScanEye className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/80">
                FEATURE 4 • OPTICAL ENGINE
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                Rule 9 &amp; Schedule II Standard
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1 flex items-center gap-2">
              Font Size &amp; Readability Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated bounding box font height estimation, optical contrast ratio, and prominence verification.
            </p>
          </div>
        </div>

        {/* Top-Right Overall Badge & Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="text-xs h-8 gap-1.5 border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Copy Readability Audit JSON"
          >
            {copiedReport ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Copied Report</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                <span>Export Audit</span>
              </>
            )}
          </Button>

          <span
            className={cn(
              'px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs',
              STATUS_CONFIG[summary.overallStatus].badgeClass
            )}
          >
            {React.createElement(STATUS_CONFIG[summary.overallStatus].icon, { className: 'h-3.5 w-3.5' })}
            <span>{STATUS_CONFIG[summary.overallStatus].label}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* ─── 1. Top Metrics & Readability Score Banner ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Left Hero Score Card */}
          <div className="md:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Type className="h-32 w-32 text-white" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Overall Readability
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono',
                    summary.overallScore >= 80
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : summary.overallScore >= 60
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  )}
                >
                  {summary.overallScore >= 80 ? 'Optimal' : summary.overallScore >= 60 ? 'Moderate' : 'Substandard'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black font-mono tracking-tight text-white leading-none">
                  {summary.overallScore}
                </span>
                <span className="text-sm font-semibold text-slate-400 font-mono">
                  / 100
                </span>
              </div>

              <div className="h-2 w-full bg-slate-700/80 rounded-full overflow-hidden mt-3">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    summary.overallScore >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : summary.overallScore >= 60
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-red-500 to-rose-400'
                  )}
                  style={{ width: `${summary.overallScore}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-700/60 pt-3 mt-4 text-center">
              <div>
                <span className="text-xs font-bold text-emerald-400 font-mono block">
                  {summary.compliantCount}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  Compliant
                </span>
              </div>
              <div className="border-x border-slate-700/60 px-1">
                <span className="text-xs font-bold text-amber-400 font-mono block">
                  {summary.warningCount}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  Warning
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-red-400 font-mono block">
                  {summary.nonCompliantCount}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  Non-Comp
                </span>
              </div>
            </div>

            {result.calibration && result.calibration.status === 'measured' && (
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                <span className="truncate max-w-[210px]" title={result.calibration.details || result.calibration.calibrationSourceLabel || result.calibration.sourceLabel}>
                  {result.calibration.calibrationSourceLabel || result.calibration.sourceLabel || 'Calibrated Packaging Scale'}
                </span>
                {result.calibration.pdpAreaCm2 && (
                  <span className="shrink-0 text-amber-300 font-semibold ml-2">
                    PDP {result.calibration.pdpAreaCm2} cm²
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Metrics Grid */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Avg Font Size Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Avg Font Height</span>
                <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Type className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                    {summary.avgFontSizePt}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">pt</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ≈ {((summary.avgFontSizePt * 25.4) / 72).toFixed(1)} mm on package
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {result.calibration?.minNumeralHeightMm
                    ? `Schedule II Statutory Min: ${result.calibration.minNumeralHeightPt ?? 6.0} pt (${result.calibration.minNumeralHeightMm} mm)`
                    : 'Min Statutory: 6.0 pt (1.8 mm)'}
                </span>
              </div>
            </div>

            {/* Avg Contrast Ratio Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Avg Contrast Ratio</span>
                <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                    {summary.avgContrastRatio}:1
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {summary.avgContrastRatio >= 4.5 ? 'Meets WCAG AA (4.5:1)' : 'Below WCAG AA Standard'}
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    summary.avgContrastRatio >= 4.5 ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Optical Luminance Check
                </span>
              </div>
            </div>

            {/* Flagged Regions Summary Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Flagged Defects</span>
                <div
                  className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center',
                    summary.flaggedCount > 0
                      ? 'bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/80 text-red-600 dark:text-red-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/80 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {summary.flaggedCount > 0 ? (
                    <FileWarning className="h-4 w-4" />
                  ) : (
                    <FileCheck className="h-4 w-4" />
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      'text-2xl font-black font-mono',
                      summary.flaggedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    {summary.flaggedCount}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    / {summary.totalRegionsEvaluated} regions
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {summary.flaggedCount > 0
                    ? 'Requires packaging typography remediation'
                    : 'All text regions meet legibility guidelines'}
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                <button
                  onClick={() => setStatusFilter(summary.flaggedCount > 0 ? 'flagged' : 'all')}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{summary.flaggedCount > 0 ? 'View Flagged Only' : 'View All Regions'}</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. Interactive Bounding Box Visual Evidence Canvas ── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Visual Bounding Box &amp; Readability Map
              </h3>
              <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                {overlayRegions.length} Overlay Boxes
              </Badge>
            </div>

            {/* Filter Overlay Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-2xs">
                <button
                  onClick={() => setOverlayMode('all')}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
                    overlayMode === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  All ({regions.length})
                </button>
                <button
                  onClick={() => setOverlayMode('flagged')}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1',
                    overlayMode === 'flagged'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  <span>Problematic</span>
                  {summary.flaggedCount > 0 && (
                    <span className="h-4 px-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[9px] font-bold">
                      {summary.flaggedCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setOverlayMode('declarations')}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
                    overlayMode === 'declarations'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  Declarations
                </button>
              </div>

              <button
                onClick={() => setShowLabelsOnImage(!showLabelsOnImage)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors',
                  showLabelsOnImage
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/80 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                {showLabelsOnImage ? 'Hide Labels' : 'Show Labels'}
              </button>
            </div>
          </div>

          {/* Interactive Image Container */}
          <div className="relative rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-950/10 dark:bg-slate-950/60 overflow-hidden flex justify-center items-center p-3 min-h-[320px]">
            <div className="relative inline-block max-w-full">
              <img
                src={currentScan.imageDataUrl}
                alt="Product Packaging Readability Evidence"
                className="max-h-[460px] w-auto rounded-lg shadow-md object-contain select-none"
              />

              {/* Bounding Box Overlays */}
              {overlayRegions.map((region) => {
                const bbox = region.boundingBox?.normalized;
                if (!bbox) return null;

                const isSelected = selectedRegionId === region.id;
                const isHovered = hoveredRegionId === region.id;
                const isProblematic = region.status !== 'compliant' || region.flags.length > 0;

                // Color configuration
                let borderClass = 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/25';
                let tagClass = 'bg-emerald-700 text-white';

                if (region.status === 'non-compliant') {
                  borderClass = isSelected || isHovered
                    ? 'border-red-500 bg-red-500/35 ring-4 ring-red-500/40 z-30 scale-[1.01]'
                    : 'border-red-500/90 bg-red-500/20 hover:border-red-500 hover:bg-red-500/30 animate-pulse';
                  tagClass = 'bg-red-700 text-white';
                } else if (region.status === 'warning') {
                  borderClass = isSelected || isHovered
                    ? 'border-amber-500 bg-amber-500/35 ring-4 ring-amber-500/40 z-30 scale-[1.01]'
                    : 'border-amber-500/90 bg-amber-500/20 hover:border-amber-500 hover:bg-amber-500/30';
                  tagClass = 'bg-amber-700 text-white';
                } else if (isSelected || isHovered) {
                  borderClass = 'border-blue-500 bg-blue-500/35 ring-4 ring-blue-500/40 z-30 scale-[1.01]';
                  tagClass = 'bg-blue-700 text-white';
                }

                return (
                  <div
                    key={region.id}
                    onMouseEnter={() => setHoveredRegionId(region.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}
                    onClick={() => {
                      setSelectedRegionId(selectedRegionId === region.id ? null : region.id);
                      toggleRowExpand(region.id);
                    }}
                    className={cn(
                      'absolute border-2 rounded transition-all duration-150 cursor-pointer flex items-start',
                      borderClass
                    )}
                    style={{
                      left: `${bbox.x}%`,
                      top: `${bbox.y}%`,
                      width: `${Math.max(3, bbox.width)}%`,
                      height: `${Math.max(2.5, bbox.height)}%`,
                    }}
                  >
                    {/* BBox Label Tag */}
                    {showLabelsOnImage && (
                      <div
                        className={cn(
                          'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs truncate max-w-[150px] -mt-5 -ml-0.5 pointer-events-none transition-all flex items-center gap-1',
                          tagClass
                        )}
                      >
                        {isProblematic && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                        <span>{region.fieldName}</span>
                        <span className="opacity-80">({region.fontSize.pt}pt)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Hover / Selection Preview Bar */}
          {activeRegion && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    activeRegion.status === 'compliant'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : activeRegion.status === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                  )}
                >
                  {React.createElement(STATUS_CONFIG[activeRegion.status].icon, { className: 'h-4 w-4' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{activeRegion.fieldName}</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                      {activeRegion.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic mt-0.5">
                    &ldquo;{activeRegion.rawText}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Font Size</span>
                  <span
                    className={cn(
                      'font-bold',
                      activeRegion.fontSize.isBelowThreshold ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
                    )}
                  >
                    {activeRegion.fontSize.formatted}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">OCR Conf</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeRegion.ocrConfidence}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Contrast</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeRegion.contrast.formattedRatio}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Visibility</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeRegion.visibilityScore}/100</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 3. Detailed Readability Data Table ────────────────── */}
        <div className="space-y-3">
          {/* Controls: Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors',
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                )}
              >
                All ({summary.totalRegionsEvaluated})
              </button>
              <button
                onClick={() => setStatusFilter('flagged')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5',
                  statusFilter === 'flagged'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50 dark:bg-slate-900 dark:text-red-400 dark:border-red-900/60 dark:hover:bg-red-950/40'
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Flagged ({summary.flaggedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('non-compliant')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors',
                  statusFilter === 'non-compliant'
                    ? 'bg-red-700 text-white border-red-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                )}
              >
                Non-Compliant ({summary.nonCompliantCount})
              </button>
              <button
                onClick={() => setStatusFilter('warning')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors',
                  statusFilter === 'warning'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                )}
              >
                Warning ({summary.warningCount})
              </button>
              <button
                onClick={() => setStatusFilter('compliant')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors',
                  statusFilter === 'compliant'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                )}
              >
                Compliant ({summary.compliantCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search text region, field, rule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4 w-[28%]">Field / Text Region</th>
                    <th className="py-3 px-3 w-[18%]">Estimated Font Size</th>
                    <th className="py-3 px-3 w-[14%]">OCR Confidence</th>
                    <th className="py-3 px-3 w-[14%]">Contrast Score</th>
                    <th className="py-3 px-3 w-[12%]">Visibility</th>
                    <th className="py-3 px-4 w-[14%] text-right">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRegions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No text regions found matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRegions.map((region) => {
                      const isExpanded = !!expandedRowIds[region.id];
                      const isSelected = selectedRegionId === region.id;
                      const isHovered = hoveredRegionId === region.id;

                      return (
                        <React.Fragment key={region.id}>
                          <tr
                            onMouseEnter={() => setHoveredRegionId(region.id)}
                            onMouseLeave={() => setHoveredRegionId(null)}
                            onClick={() => {
                              setSelectedRegionId(isSelected ? null : region.id);
                              toggleRowExpand(region.id);
                            }}
                            className={cn(
                              'cursor-pointer transition-colors duration-100 select-none',
                              isSelected || isHovered
                                ? 'bg-blue-50/70 dark:bg-blue-950/40'
                                : region.status === 'non-compliant'
                                ? 'bg-red-500/5 hover:bg-red-500/10 dark:bg-red-950/20 dark:hover:bg-red-950/40'
                                : region.status === 'warning'
                                ? 'bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-950/20 dark:hover:bg-amber-950/40'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                            )}
                          >
                            {/* 1. Field Name & Text Snippet */}
                            <td className="py-3 px-4">
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpand(region.id);
                                  }}
                                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{region.fieldName}</span>
                                    {region.fieldKey && (
                                      <span className="text-[9px] font-mono font-semibold px-1 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80">
                                        Mandatory
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono line-clamp-1 mt-0.5">
                                    {region.rawText}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* 2. Estimated Font Size */}
                            <td className="py-3 px-3">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      'font-mono font-bold text-xs',
                                      region.fontSize.isBelowThreshold
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-slate-900 dark:text-slate-100'
                                    )}
                                  >
                                    {region.fontSize.pt} pt
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                    ({region.fontSize.mm} mm)
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                  Min: {region.fontSize.minThresholdPt}pt ({region.fontSize.minThresholdMm}mm)
                                </div>
                              </div>
                            </td>

                            {/* 3. OCR Confidence */}
                            <td className="py-3 px-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                                  <span>{Math.round(region.ocrConfidence)}%</span>
                                </div>
                                <div className="h-1.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      region.ocrConfidence >= 75
                                        ? 'bg-emerald-500'
                                        : region.ocrConfidence >= 60
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                    )}
                                    style={{ width: `${region.ocrConfidence}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* 4. Contrast Score */}
                            <td className="py-3 px-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                                  <span>{region.contrast.formattedRatio}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    ({region.contrast.contrastScore}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      region.contrast.contrastScore >= 70
                                        ? 'bg-emerald-500'
                                        : region.contrast.contrastScore >= 45
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                    )}
                                    style={{ width: `${region.contrast.contrastScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* 5. Composite Visibility Score */}
                            <td className="py-3 px-3">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                <span
                                  className={cn(
                                    region.visibilityScore >= 75
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : region.visibilityScore >= 55
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-red-600 dark:text-red-400'
                                  )}
                                >
                                  {region.visibilityScore}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/100</span>
                              </div>
                            </td>

                            {/* 6. Compliance Status */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={cn(
                                    'px-2.5 py-0.5 rounded-md border text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1 shadow-2xs',
                                    STATUS_CONFIG[region.status].badgeClass
                                  )}
                                >
                                  {React.createElement(STATUS_CONFIG[region.status].icon, {
                                    className: 'h-3 w-3',
                                  })}
                                  <span>{STATUS_CONFIG[region.status].label}</span>
                                </span>

                                {region.flags.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap justify-end">
                                    {region.flags.map((flag) => {
                                      const cfg = FLAG_CONFIG[flag] || {
                                        label: flag,
                                        bg: 'bg-red-50 dark:bg-red-950/60',
                                        text: 'text-red-700 dark:text-red-300',
                                        border: 'border-red-200 dark:border-red-800/80',
                                      };
                                      return (
                                        <span
                                          key={flag}
                                          className={cn(
                                            'text-[9px] font-semibold px-1.5 py-0.2 rounded border',
                                            cfg.bg,
                                            cfg.text,
                                            cfg.border
                                          )}
                                        >
                                          {cfg.label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* ─── Expandable Details Drawer ───────── */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800">
                              <td colSpan={6} className="p-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Statutory Rule Citation */}
                                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-2xs">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                                      Statutory Reference
                                    </span>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                      {region.statutoryReference}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Category: {region.category}
                                    </p>
                                  </div>

                                  {/* Optical Luminance Breakdown */}
                                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-2xs font-mono text-xs">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                      Luminance &amp; BBox Coordinates
                                    </span>
                                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                      <span>Foreground Lum (L1):</span>
                                      <span className="font-semibold">{region.contrast.foregroundLuminance}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                      <span>Background Lum (L2):</span>
                                      <span className="font-semibold">{region.contrast.backgroundLuminance}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                                      <span>BBox (x, y, w, h):</span>
                                      <span>
                                        {region.boundingBox.normalized.x.toFixed(1)}%, {region.boundingBox.normalized.y.toFixed(1)}%, {region.boundingBox.normalized.width.toFixed(1)}%, {region.boundingBox.normalized.height.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* Remediation Advice */}
                                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-2xs">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                                      Remediation &amp; Packaging Action
                                    </span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                      {region.remediationAdvice}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── 4. Forensic 100% Precision Coin Calibration Banner & Trigger ─── */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-yellow-950/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs mt-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
              <Coins className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-100 uppercase font-mono tracking-wider">
                  Court-Admissible 100% Calibrated Precision
                </span>
                <Badge variant="warning" size="sm" className="font-mono text-[9px]">
                  RBI Currency Coin Standard
                </Badge>
                {result.calibration?.method === 'reference-object' && (
                  <Badge variant="success" size="sm" className="font-mono text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    ✓ Coin Calibrated (±0.05mm)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Need court-admissible micrometric accuracy for enforcement? Place a standard Indian <strong>₹10 or ₹5 coin</strong> alongside the packaging to achieve <strong>100% optical precision (±0.05 mm)</strong> under Legal Metrology Act Sec 36.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCoinModalOpen(true)}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold font-mono tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all hover:shadow-md cursor-pointer"
          >
            <Coins className="h-4 w-4" />
            <span>Calibrate with Coin Scale (100% Precision)</span>
          </button>
        </div>

        {/* Modal mount */}
        <ForensicCoinCalibrationModal
          isOpen={isCoinModalOpen}
          onClose={() => setIsCoinModalOpen(false)}
        />
      </CardContent>
    </Card>
  );
};

