import React, { useState, useEffect } from 'react';
import {
  FileText,
  Grid3X3,
  Copy,
  Check,
  AlertTriangle,
  Pencil,
  X,
  Layers,
  ShieldCheck,
  Code,
  Download,
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
  Scan,
  Sparkles,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  ZoomIn,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useScanStore } from '../../store/scanStore';
import { queryRegulatoryRAG } from '../../lib/ragKnowledgeService';
import { preprocessImage, type PreprocessedVariant } from '../../lib/imagePreprocessor';
import type {
  ExtractedProductData,
  DeclarationField,
  DeclarationFieldKey,
  ValidationStatus,
} from '../../types/scan';
import { cn, formatCurrency } from '../../lib/utils';

// ─── Visual Evidence & Bounding Box Inspector ───────────────────

interface EvidenceInspectorProps {
  imageUrl: string;
  declarations: Record<DeclarationFieldKey, DeclarationField>;
  highlightedKey: DeclarationFieldKey | null;
  onHighlight: (key: DeclarationFieldKey | null) => void;
}

const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  imageUrl,
  declarations,
  highlightedKey,
  onHighlight,
}) => {
  const fields = Object.values(declarations).filter(
    (d) => d.boundingBox && d.value && d.value.trim().length > 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            Hover over declaration rows or bounding boxes to cross-verify physical label evidence.
          </span>
        </div>
        <Badge variant="primary" size="sm" className="shrink-0">
          {fields.length} BBoxes Mapped
        </Badge>
      </div>

      <div className="relative rounded-xl border border-slate-300 bg-slate-950/5 overflow-hidden flex justify-center items-center p-3">
        <div className="relative inline-block max-w-full">
          <img
            src={imageUrl}
            alt="Product Packaging Label Evidence"
            className="max-h-[420px] w-auto rounded-lg shadow-md object-contain"
          />

          {/* Bounding Box Overlays */}
          {fields.map((field) => {
            const bbox = field.boundingBox?.normalized;
            if (!bbox) return null;
            const isHighlighted = highlightedKey === field.key;

            return (
              <div
                key={field.key}
                onMouseEnter={() => onHighlight(field.key)}
                onMouseLeave={() => onHighlight(null)}
                className={cn(
                  'absolute border-2 rounded transition-all duration-150 cursor-pointer flex items-start',
                  isHighlighted
                    ? 'border-blue-500 bg-blue-500/25 ring-4 ring-blue-500/30 z-20 scale-[1.01]'
                    : field.validationStatus === 'compliant'
                    ? 'border-emerald-500/80 bg-emerald-500/10 hover:border-emerald-500 hover:bg-emerald-500/20'
                    : field.validationStatus === 'warning'
                    ? 'border-amber-500/80 bg-amber-500/10 hover:border-amber-500 hover:bg-amber-500/20'
                    : 'border-red-500/80 bg-red-500/10 hover:border-red-500 hover:bg-red-500/20'
                )}
                style={{
                  left: `${bbox.x}%`,
                  top: `${bbox.y}%`,
                  width: `${Math.max(3, bbox.width)}%`,
                  height: `${Math.max(2, bbox.height)}%`,
                }}
              >
                <div
                  className={cn(
                    'text-[9px] font-mono font-bold px-1 py-0.5 rounded shadow-xs truncate max-w-[120px] -mt-5 -ml-0.5 pointer-events-none',
                    isHighlighted
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900/90 text-white'
                  )}
                >
                  {field.label}: {field.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Optical Preprocessing Stages & Forensics Visualizer ────────

interface OpticalStagesInspectorProps {
  originalImageUrl: string;
  variants?: Array<{
    name: string;
    dataUrl: string;
    description: string;
    scale: number;
  }>;
}

const STAGE_METADATA: Record<
  string,
  {
    stageNum: string;
    title: string;
    math: string;
    kernel: string;
    purpose: string;
    benefit: string;
  }
> = {
  original: {
    stageNum: 'Input',
    title: 'Raw Sensor Input (RGB)',
    math: 'RGB (8-bit per channel, uncompressed canvas stream)',
    kernel: 'Identity Pass [1.0]',
    purpose: 'Initial product image capture from consumer smartphone camera or flatbed scanner.',
    benefit: 'Baseline benchmark containing original colors, packaging gloss, and lighting variance.',
  },
  high_contrast: {
    stageNum: 'Stage 1',
    title: 'Luminance Grayscale & Histogram Dynamic Range Stretch',
    math: 'L = 0.299R + 0.587G + 0.114B | Normalized range: [min, max] → [0, 255] * 1.6',
    kernel: 'Contrast multiplier: ((val - 128) * 1.6) + 128',
    purpose: 'Stretches compressed dynamic range to normalize faded print, dark backgrounds, and low ink density.',
    benefit: 'Boosts character edge distinction against dark/colored packaging.',
  },
  sharpened: {
    stageNum: 'Stage 2',
    title: '3×3 Unsharp Mask Spatial Convolution',
    math: '∇²I edge gradient convolution with center enhancement weight (+5)',
    kernel: '[ [0, -1, 0], [-1, 5, -1], [0, -1, 0] ]',
    purpose: 'Highlights high-frequency spatial gradients to recover blurred or micro-text.',
    benefit: 'Sharpens statutory numerals (MRP, Dates, USP) distorted by optical motion or low depth of field.',
  },
  denoised: {
    stageNum: 'Stage 3',
    title: '3×3 Non-Linear Median Filter',
    math: 'y[m, n] = median(x[i, j], (i,j) ∈ W_3x3)',
    kernel: '3×3 sliding window rank filter (k=5th rank element)',
    purpose: 'Removes salt-and-pepper sensor noise and high-frequency speckle without blurring hard edges.',
    benefit: 'Cleans up reflective plastic glare artifacts before OCR character segmentation.',
  },
  adaptive_threshold: {
    stageNum: 'Stage 4',
    title: 'O(1) Integral-Image Adaptive Local Binarization',
    math: 'T(x,y) = mean_block(x,y) - C | Block: 15×15, C: 8 via 2D Integral Table',
    kernel: 'blockSum = I(x2,y2) - I(x1,y2) - I(x2,y1) + I(x1,y1)',
    purpose: 'Calculates dynamic local thresholds in O(1) time complexity to cleanly binarize text.',
    benefit: 'Flawlessly isolates text on curved bottles, cylindrical cans, and non-uniform shadow gradients.',
  },
  upscaled_2x: {
    stageNum: 'Stage 5',
    title: '2× Super-Resolution Bicubic Interpolation',
    math: '200% canvas scale with sub-pixel interpolation + sharpening',
    kernel: 'Lanczos / High-Quality Bicubic Resampling Filter',
    purpose: 'Enlarges micro-text below 6pt font size (such as FSSAI 14-digit license numbers and USP clauses).',
    benefit: 'Provides sufficient pixel height for OCR character neural networks to recognize tiny numerals.',
  },
};

const OpticalStagesInspector: React.FC<OpticalStagesInspectorProps> = ({
  originalImageUrl,
  variants: initialVariants,
}) => {
  const [variants, setVariants] = useState<PreprocessedVariant[]>(initialVariants || []);
  const [selectedVariantName, setSelectedVariantName] = useState<string>('adaptive_threshold');
  const [isComparing, setIsComparing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if ((!variants || variants.length === 0) && originalImageUrl) {
      setIsGenerating(true);
      preprocessImage(originalImageUrl)
        .then((res) => {
          setVariants(res.variants);
          if (res.variants.length > 0) {
            setSelectedVariantName(res.variants.some((v) => v.name === 'adaptive_threshold') ? 'adaptive_threshold' : res.variants[0].name);
          }
        })
        .finally(() => setIsGenerating(false));
    }
  }, [originalImageUrl, variants]);

  const activeVariant =
    variants.find((v) => v.name === selectedVariantName) ||
    variants[0] || {
      name: 'original',
      dataUrl: originalImageUrl,
      description: 'Original Image',
      scale: 1,
    };

  const meta = STAGE_METADATA[activeVariant.name] || {
    stageNum: 'Pass',
    title: activeVariant.description || activeVariant.name,
    math: 'Optical filter pass',
    kernel: 'Standard',
    purpose: 'Image enhancement before OCR text extraction.',
    benefit: 'Improves text recognition accuracy.',
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Instructions for Demo Presentation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>Computer Vision Optical Pipeline (Pre-OCR Stages)</span>
              <span className="px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-[10px] font-mono">
                {variants.length} Optical Transforms
              </span>
            </div>
            <p className="text-[11px] text-blue-700/90 mt-0.5">
              Click each stage to inspect how raw phone photography is optically enhanced before character extraction.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsComparing((prev) => !prev)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0',
            isComparing
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{isComparing ? 'Exit Split View' : 'Compare with Original'}</span>
        </button>
      </div>

      {/* Stage Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariantName === v.name;
          const stageInfo = STAGE_METADATA[v.name];
          return (
            <button
              key={v.name}
              onClick={() => setSelectedVariantName(v.name)}
              className={cn(
                'flex flex-col text-left p-2.5 rounded-xl border transition-all relative overflow-hidden',
                isSelected
                  ? 'border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={cn(
                    'text-[10px] font-mono font-bold px-1.5 py-0.2 rounded',
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {stageInfo?.stageNum || 'Pass'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {v.scale}×
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 capitalize truncate w-full">
                {v.name.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-slate-500 truncate w-full mt-0.5">
                {v.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Image Preview Canvas Area */}
      <div className="rounded-2xl border border-slate-200 bg-slate-950/5 p-4 flex flex-col items-center justify-center min-h-[320px]">
        {isGenerating ? (
          <div className="text-center py-8 text-xs text-slate-500 animate-pulse">
            Processing image optical convolution passes...
          </div>
        ) : isComparing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-700 mb-2 font-mono">
                📸 Original RGB Camera Capture
              </span>
              <img
                src={originalImageUrl}
                alt="Original capture"
                className="max-h-[340px] w-auto object-contain rounded-lg border border-slate-200"
              />
            </div>
            <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-blue-300 shadow-xs">
              <span className="text-xs font-bold text-blue-700 mb-2 font-mono">
                ⚡ {meta.stageNum}: {meta.title}
              </span>
              <img
                src={activeVariant.dataUrl}
                alt={activeVariant.name}
                className="max-h-[340px] w-auto object-contain rounded-lg border border-blue-200"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="relative inline-block max-w-full bg-white p-3 rounded-xl border border-slate-200 shadow-md">
              <img
                src={activeVariant.dataUrl}
                alt={activeVariant.name}
                className="max-h-[380px] w-auto object-contain rounded-lg"
              />
              <div className="absolute bottom-5 left-5 bg-slate-900/90 text-white text-[11px] font-mono px-2.5 py-1 rounded-md shadow-md backdrop-blur-xs flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Rendered Variant: {activeVariant.name} ({activeVariant.scale}× scale)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Algorithmic & Mathematical Deep Dive Box for Hackathon Judges */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3 font-mono text-xs border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[11px] border border-blue-500/40">
              {meta.stageNum}
            </span>
            <span className="font-bold text-white text-sm">{meta.title}</span>
          </div>
          <span className="text-[10px] text-slate-400">Target: Legal Metrology Declarations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Mathematical Model:</span>
            <p className="text-emerald-400 bg-slate-950/80 p-2 rounded border border-slate-800 break-all">
              {meta.math}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">Kernel / Filter Structure:</span>
            <p className="text-amber-300 bg-slate-950/80 p-2 rounded border border-slate-800 font-mono">
              {meta.kernel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-sans font-bold">Why This Stage is Required:</span>
            <p className="text-slate-300 font-sans leading-relaxed">{meta.purpose}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400 font-sans font-bold">Impact on Downstream Extraction:</span>
            <p className="text-slate-300 font-sans leading-relaxed">{meta.benefit}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OCRResultsPanel: React.FC = () => {
  const { currentScan, activeAngleIndex, setActiveAngleIndex, validationResults } = useScanStore();
  const [activeTab, setActiveTab] = useState('declarations');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<DeclarationFieldKey | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Partial<Record<DeclarationFieldKey, string>>>({});
  const [selectedRAGField, setSelectedRAGField] = useState<DeclarationField | null>(null);

  // Table controls state
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'warning' | 'missing' | 'non-compliant' | 'na'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingKey, setEditingKey] = useState<DeclarationFieldKey | null>(null);
  const [editingValue, setEditingValue] = useState('');

  if (!currentScan || currentScan.status !== 'completed' || !currentScan.extractedData) {
    return null;
  }

  const isMultiAngle = Boolean(currentScan.isMultiAngle || (currentScan.angles && currentScan.angles.length > 1));
  const angles = currentScan.angles || [];
  const activeAngle = activeAngleIndex > 0 && angles[activeAngleIndex - 1] ? angles[activeAngleIndex - 1] : null;

  const data: ExtractedProductData = currentScan.extractedData;
  const declarations = { ...data.declarations };

  // Apply local edits
  Object.entries(localOverrides).forEach(([k, v]) => {
    const key = k as DeclarationFieldKey;
    if (declarations[key]) {
      declarations[key] = {
        ...declarations[key],
        value: v,
        validationStatus: v.trim().length > 0 ? 'compliant' : 'missing',
        validationMessage: 'Manually corrected by compliance officer.',
      };
    }
  });

  const allDeclarationsList = Object.values(declarations);
  const compliantCount = allDeclarationsList.filter((d) => d.validationStatus === 'compliant').length;
  const warningCount = allDeclarationsList.filter((d) => d.validationStatus === 'warning').length;
  const missingCount = allDeclarationsList.filter((d) => d.validationStatus === 'missing').length;
  const violationCount = allDeclarationsList.filter((d) => d.validationStatus === 'non-compliant').length;
  const naCount = allDeclarationsList.filter((d) => !d.isMandatory).length || 1;
  const totalCount = allDeclarationsList.length;

  const valResult = currentScan ? validationResults[currentScan.id] : null;
  const hasLocalOverrides = Object.keys(localOverrides).length > 0;
  const computedFallbackScore = Math.round(
    ((compliantCount + warningCount * 0.7) / Math.max(1, totalCount - (naCount > 0 ? naCount : 0))) * 100
  );
  const displayScore = hasLocalOverrides
    ? computedFallbackScore
    : (valResult?.complianceScore ?? data.compliancePayload?.mandatorySummary?.compliancePercentage ?? computedFallbackScore);

  const scoreTheme = displayScore >= 80
    ? { border: 'border-emerald-200', bg: 'bg-emerald-50/70', text: 'text-emerald-700', label: 'text-emerald-600' }
    : displayScore >= 60
    ? { border: 'border-amber-200', bg: 'bg-amber-50/70', text: 'text-amber-700', label: 'text-amber-600' }
    : { border: 'border-red-200', bg: 'bg-red-50/70', text: 'text-red-700', label: 'text-red-600' };

  const handleEditSave = (key: DeclarationFieldKey) => {
    setLocalOverrides((prev) => ({ ...prev, [key]: editingValue.trim() }));
    setEditingKey(null);
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(data.compliancePayload, null, 2)
      );
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDownloadPayload = () => {
    const jsonStr = JSON.stringify(data.compliancePayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_extraction_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'declarations', label: 'Statutory Declarations', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: 'evidence', label: 'Visual Evidence & Boxes', icon: <Scan className="h-3.5 w-3.5" /> },
    { id: 'stages', label: 'Optical Preprocessing Stages', icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
    { id: 'rule_engine', label: 'Structured JSON Payload', icon: <Code className="h-3.5 w-3.5" /> },
    { id: 'passes', label: 'OCR Telemetry', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'raw', label: 'Raw OCR Text', icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  // Filtering
  const filteredDeclarations = allDeclarationsList.filter((decl) => {
    if (statusFilter === 'na') {
      if (decl.isMandatory) return false;
    } else if (statusFilter !== 'all' && decl.validationStatus !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        decl.label.toLowerCase().includes(q) ||
        decl.value.toLowerCase().includes(q) ||
        decl.ruleCode.toLowerCase().includes(q) ||
        decl.validationMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const PREVIEW_LIMIT = 6;
  const displayedDeclarations = isExpanded
    ? filteredDeclarations
    : filteredDeclarations.slice(0, PREVIEW_LIMIT);

  // Helper for Severity tag
  const getSeverity = (field: DeclarationField) => {
    if (!field.isMandatory) return { label: 'Medium', class: 'bg-slate-50 text-slate-600 border-slate-200' };
    if (field.key === 'productName' || field.key === 'mrp' || field.key === 'netQuantity' || field.key === 'manufacturer') {
      return { label: 'Critical', class: 'bg-red-50 text-red-600 border-red-200' };
    }
    return { label: 'High', class: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  return (
    <Card className="h-full flex flex-col border border-slate-200/90 shadow-subtle bg-white">
      {/* 1. Header with Shield Icon & Top-Right Compliance Score Box */}
      <CardHeader className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg border border-blue-200 bg-blue-50/60 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase block leading-none">
              LEGAL METROLOGY
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Statutory Declarations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Packaged Commodities Rules (2011) declaration evidence &amp; rule validation.
            </p>
          </div>
        </div>

        {/* Top-right Compliance Score */}
        <div className={cn("rounded-lg border px-3.5 py-1.5 text-center min-w-[110px] shadow-2xs shrink-0 self-start transition-colors", scoreTheme.border, scoreTheme.bg)}>
          <span className={cn("text-xl font-black font-mono leading-none block", scoreTheme.text)}>
            {displayScore} / 100
          </span>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider block mt-0.5", scoreTheme.label)}>
            Compliance Score
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col">
        {/* Multi-Angle Inspection Selector Bar */}
        {isMultiAngle && angles.length > 1 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5">
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                Multi-Angle Photo Views ({angles.length} Angles of Same Product)
              </span>
              <span className="text-[10px] text-blue-600 font-medium">
                Click any angle to view its specific photo & extracted declarations
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveAngleIndex(0)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border shadow-2xs',
                  activeAngleIndex === 0
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>🌟 Consolidated Master View</span>
              </button>

              {angles.map((angle, idx) => {
                const angleNum = idx + 1;
                const isSelected = activeAngleIndex === angleNum;
                return (
                  <button
                    key={angle.id || idx}
                    onClick={() => setActiveAngleIndex(angleNum)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border shadow-2xs',
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <span>📸 {angle.label || `Angle ${angleNum}`}</span>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1 py-0.2 rounded',
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {angle.confidence}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Top Summary Statistics Bar (Single clean bordered card with icons) */}
        <div className="border border-slate-200/90 rounded-xl p-3 bg-white grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-0 sm:divide-x divide-slate-100 text-center shadow-xs">

          <div className="px-1 sm:px-2">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-base font-bold font-mono text-slate-900">{compliantCount}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Compliant</span>
          </div>

          <div className="px-1 sm:px-2">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-base font-bold font-mono text-slate-900">{missingCount}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Missing</span>
          </div>

          <div className="px-1 sm:px-2">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-base font-bold font-mono text-slate-900">{warningCount}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Warnings</span>
          </div>

          <div className="px-1 sm:px-2">
            <div className="flex items-center justify-center gap-1">
              <MinusCircle className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-base font-bold font-mono text-slate-900">{naCount}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">N/A</span>
          </div>

          <div className="px-1 sm:px-2 col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="text-base font-bold font-mono text-slate-900 block">{totalCount}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Total Rules</span>
          </div>
        </div>

        {/* 3. Clean Horizontal Underline Tabs */}
        <div className="border-b border-slate-200 flex items-center gap-4 sm:gap-6 overflow-x-auto text-xs font-semibold scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 pb-2.5 pt-1 border-b-2 transition-all whitespace-nowrap',
                  isActive
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Tab 1: Statutory Declarations Table View */}
        {activeTab === 'declarations' && (
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'all', label: 'All', count: allDeclarationsList.length, variant: 'default' },
                    { id: 'missing', label: 'Missing', count: missingCount, variant: 'danger' },
                    { id: 'warning', label: 'Warnings', count: warningCount, variant: 'warning' },
                    { id: 'compliant', label: 'Compliant', count: compliantCount, variant: 'success' },
                    { id: 'na', label: 'N/A', count: naCount, variant: 'neutral' },
                  ] as const
                ).map((item) => {
                  const isSelected = statusFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setStatusFilter(item.id)}
                      className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-md border transition-all flex items-center gap-1',
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      <span>{item.label}</span>
                      <span
                        className={cn(
                          'text-[10px] font-mono',
                          isSelected ? 'text-blue-700 font-bold' : 'text-slate-400'
                        )}
                      >
                        ({item.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar with Search Icon */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search declarations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1 text-xs rounded-md border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {/* Clean Enterprise Data Table (Matching Reference Image) */}
            <div className="border border-slate-200/90 rounded-lg overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Declaration</th>
                      <th className="py-2.5 px-3">Rule Code</th>
                      <th className="py-2.5 px-3">Evidence</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {displayedDeclarations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                          No declarations matching current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      displayedDeclarations.map((field, idx) => {
                        const hasValue = field.value && field.value.trim().length > 0;
                        const isEditingThis = editingKey === field.key;
                        const isHighlighted = highlightedKey === field.key;
                        const severity = getSeverity(field);
                        const isPass = field.validationStatus === 'compliant';

                        return (
                          <tr
                            key={field.key}
                            onMouseEnter={() => setHighlightedKey(field.key)}
                            onMouseLeave={() => setHighlightedKey(null)}
                            className={cn(
                              'transition-colors group',
                              isHighlighted ? 'bg-blue-50/30' : 'hover:bg-slate-50/60'
                            )}
                          >
                            {/* Column 1: # */}
                            <td className="py-3 px-3 text-center text-slate-500 font-medium text-xs align-middle">
                              {idx + 1}
                            </td>

                            {/* Column 2: Declaration */}
                            <td className="py-3 px-3 align-middle min-w-[170px]">
                              <div>
                                <span className="font-bold text-slate-900 text-xs block leading-snug">
                                  {field.label}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                                  {field.isMandatory ? 'Mandatory declaration' : 'Statutory declaration'}
                                </span>
                                {field.sourceAngle && isMultiAngle && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mt-1 font-mono">
                                    📸 {field.sourceAngle}
                                  </span>
                                )}


                                {/* Inline value editing or value snippet */}

                                {isEditingThis ? (
                                  <div className="mt-1 space-y-1">
                                    <input
                                      type="text"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="w-full text-xs font-medium text-slate-900 border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50/30"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEditSave(field.key);
                                        if (e.key === 'Escape') setEditingKey(null);
                                      }}
                                    />
                                    <div className="flex items-center gap-1 justify-end">
                                      <button
                                        onClick={() => setEditingKey(null)}
                                        className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleEditSave(field.key)}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-0.5 font-medium"
                                      >
                                        <Check className="h-2.5 w-2.5" />
                                        <span>Save</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  hasValue && (
                                    <div className="flex items-center gap-1 mt-0.5 group/edit">
                                      <span className="text-[11px] text-slate-600 truncate max-w-[180px]">
                                        Value: {field.value}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setEditingKey(field.key);
                                          setEditingValue(field.value);
                                        }}
                                        className="opacity-0 group-hover/edit:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-700"
                                        title="Edit value"
                                      >
                                        <Pencil className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </td>

                            {/* Column 3: Rule Code */}
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500 align-middle whitespace-nowrap">
                              {field.ruleCode}
                            </td>

                            {/* Column 4: Evidence */}
                            <td className="py-3 px-3 align-middle whitespace-nowrap">
                              {hasValue ? (
                                <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  <span>Detected</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span>Not detected</span>
                                </div>
                              )}
                            </td>

                            {/* Column 5: Status */}
                            <td className="py-3 px-3 align-middle whitespace-nowrap">
                              {isPass ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Pass
                                </span>
                              ) : field.validationStatus === 'warning' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  Warning
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
                                  Missing
                                </span>
                              )}
                            </td>

                            {/* Column 6: Severity */}
                            <td className="py-3 px-3 align-middle whitespace-nowrap">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border',
                                  severity.class
                                )}
                              >
                                {severity.label}
                              </span>
                            </td>

                            {/* Column 7: Action (ALWAYS VISIBLE, preserves Ask RAG & chevron) */}
                            <td className="py-3 px-3 align-middle text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedRAGField(field)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                title="View detailed rule, evidence & Ask RAG guidance"
                              >
                                <span className="hidden sm:inline text-[11px]">Ask RAG</span>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Show All Declarations Button at Bottom */}
              {filteredDeclarations.length > PREVIEW_LIMIT && (
                <div className="py-2.5 px-3 border-t border-slate-100 bg-white text-center">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>
                      {isExpanded
                        ? 'Show less'
                        : `Show all ${filteredDeclarations.length} declarations`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Info Tip (from Reference Design) */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50/40 border border-blue-100 text-xs text-blue-700 mt-auto">
              <Info className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              <span>Click on any declaration to view detailed rule, evidence &amp; recommendations.</span>
            </div>

            {/* Overrides notice if modified */}
            {Object.keys(localOverrides).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <Pencil className="h-3 w-3 shrink-0" />
                <span>
                  {Object.keys(localOverrides).length} declaration field(s) manually corrected.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Visual Evidence & Bounding Box Inspector */}
        {activeTab === 'evidence' && (
          <EvidenceInspector
            imageUrl={activeAngle ? activeAngle.imageDataUrl : currentScan.imageDataUrl}
            declarations={activeAngle?.extractedData?.declarations || declarations}
            highlightedKey={highlightedKey}
            onHighlight={setHighlightedKey}
          />
        )}

        {/* Tab 3: Optical Preprocessing Stages Inspector */}
        {activeTab === 'stages' && (
          <OpticalStagesInspector
            originalImageUrl={activeAngle ? activeAngle.imageDataUrl : currentScan.imageDataUrl}
            variants={activeAngle?.extractedData?.preprocessedVariants || data.preprocessedVariants}
          />
        )}


        {/* Tab 3: Rule Engine Compliance Payload (JSON) */}
        {activeTab === 'rule_engine' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
              <span className="text-slate-600 font-medium">
                Structured Legal Metrology evidence payload prepared for Rule Validation Engine.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPayload}
                  className="text-xs gap-1.5 h-8"
                >
                  <Download className="h-3.5 w-3.5 text-slate-600" />
                  <span>Download JSON</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyPayload}
                  className="text-xs gap-1.5 h-8"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 max-h-80 overflow-y-auto">
              <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(data.compliancePayload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Multi-Pass OCR Telemetry */}
        {activeTab === 'passes' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-700">
              Multi-Pass Optical Preprocessing Variant Telemetry
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.ocrPassResults.map((pass) => (
                <div
                  key={pass.name}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 capitalize">
                      {pass.name.replace(/_/g, ' ')}
                    </span>
                    <Badge
                      variant={pass.confidence >= 80 ? 'success' : pass.confidence >= 50 ? 'warning' : 'danger'}
                      size="sm"
                      className="font-mono font-bold text-[10px]"
                    >
                      {pass.confidence}%
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{pass.description}</p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Text Length: {pass.textLength} characters
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Raw OCR Text */}
        {activeTab === 'raw' && (
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 max-h-80 overflow-y-auto">
              <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                {data.rawText || 'No text extracted.'}
              </pre>
            </div>
          </div>
        )}

        {/* Contextual RAG Intelligence Modal */}
        {selectedRAGField && (() => {
          const ragResult = queryRegulatoryRAG({ fieldKey: selectedRAGField.key, evaluationDate: '2026-08-27' });
          const topChunk = ragResult.matchedChunks[0];

          return (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setSelectedRAGField(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 w-fit">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>SatyaDrishti RAG Regulatory Evidence</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Statutory Guidance: {selectedRAGField.label}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Rule Code: {selectedRAGField.ruleCode}</p>
                </div>

                {topChunk ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                          {topChunk.authority}
                        </Badge>
                        <Badge variant="success" size="sm" className="text-[10px]">
                          {topChunk.status}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{topChunk.section}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{topChunk.content}</p>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Verbatim Official Gazette Statutory Clause:
                      </span>
                      <p className="text-xs text-amber-950 font-serif italic">"{topChunk.verbatimClause}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                      <div className="p-2.5 bg-slate-100 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Official Gazette Ref</span>
                        <span className="font-bold text-slate-800">{topChunk.officialGazetteRef}</span>
                      </div>
                      <div className="p-2.5 bg-slate-100 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Statutory Fine Schedule</span>
                        <span className="font-bold text-rose-600">
                          {formatCurrency(topChunk.penalties.minFine)} - {formatCurrency(topChunk.penalties.maxFine)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <a
                        href={topChunk.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>Download Gazette PDF</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <Button variant="primary" size="sm" onClick={() => setSelectedRAGField(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No RAG chunk found for this field.</p>
                )}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};
