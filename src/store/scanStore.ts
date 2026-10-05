import { create } from 'zustand';
import type {
  ScanRecord,
  UploadedImage,
  ExtractedProductData,
  ScanAngle,
  BatchVerificationResult,
  MRPVerificationResult,
  ScanMode,
  ParallelScanJob,
} from '../types/scan';
import type { ComplianceValidationResult } from '../types/ruleEngine';
import type { ReadabilityAnalysisResult } from '../types/readability';
import { ocrService } from '../lib/ocrService';
import { validateProduct } from '../lib/ruleEngineService';
import { readabilityService } from '../lib/readabilityService';
import { productDimensionsService } from '../lib/productDimensionsService';
import {
  processScanDiscrepanciesAndCorrelate,
  ScanCorrelationResult,
} from '../lib/scanComplaintCorrelator';
import { consolidateMultiAngleExtractions } from '../lib/multiAngleConsolidator';
import { useComplianceStore } from './complianceStore';
import { offlineInspectionQueue, type QueuedInspection } from '../services/offlineInspectionQueue';
import { verifyBatch, verifyMRP } from '../lib/batchVerificationService';
import {
  MOCK_SCANS,
  MOCK_VALIDATION_RESULTS,
  MOCK_READABILITY_RESULTS,
} from '../data/mockScans';

/** Maximum number of parallel OCR scans to prevent browser resource exhaustion */
const MAX_PARALLEL_SCANS = 2;

interface ScanState {
  // State
  scans: ScanRecord[];
  currentScan: ScanRecord | null;
  uploadedImages: UploadedImage[];
  isProcessing: boolean;
  currentProgress: number;
  currentStatusMessage: string;
  activeAngleIndex: number; // 0 = Master Consolidated View and 1..N = Angle View
  hasUnviewedCompletion: boolean;
  lastCompletedScanId: string | null;

  /** Validation results keyed by scan ID */
  validationResults: Record<string, ComplianceValidationResult>;
  /** Correlation results (RAG mappings, verified user complaints, auto-added complaints) */
  correlationResults: Record<string, ScanCorrelationResult>;
  /** Readability analysis results keyed by scan ID */
  readabilityResults: Record<string, ReadabilityAnalysisResult>;
  /** Batch number verification results keyed by scan ID */
  batchVerificationResults: Record<string, BatchVerificationResult>;
  /** MRP vs Product Directory verification results keyed by scan ID */
  mrpVerificationResults: Record<string, MRPVerificationResult>;

  // ── Parallel Multi-Product Scanning State ──────────────────────
  /** Current scanning mode */
  scanMode: ScanMode;
  /** Active parallel scan jobs keyed by job ID */
  parallelScanJobs: Record<string, ParallelScanJob>;
  /** ID of the currently selected parallel job for detail view */
  selectedParallelJobId: string | null;
  /** Whether any parallel jobs are actively running */
  isParallelProcessing: boolean;

  // Actions
  addImages: (files: File[]) => void;
  loadSampleImage: (imageUrl: string, fileName: string) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
  updateImageAngleLabel: (id: string, label: string) => void;
  setActiveAngleIndex: (index: number) => void;
  clearUnviewedCompletion: () => void;
  startScan: () => Promise<void>;
  updateScanProgress: (id: string, progress: number, status: string) => void;
  completeScan: (
    id: string,
    rawText: string,
    confidence: number,
    extractedData: ExtractedProductData
  ) => void;
  failScan: (id: string, error: string) => void;
  deleteScan: (id: string) => void;
  clearHistory: () => void;
  viewScan: (scan: ScanRecord | null) => void;
  setValidationResult: (scanId: string, result: ComplianceValidationResult) => void;
  setReadabilityResult: (scanId: string, result: ReadabilityAnalysisResult) => void;

  // ── Parallel Multi-Product Actions ─────────────────────────────
  setScanMode: (mode: ScanMode) => void;
  startParallelScan: () => Promise<void>;
  selectParallelJob: (jobId: string | null) => void;
  removeParallelJob: (jobId: string) => void;
  clearParallelJobs: () => void;
  restoreOfflineInspections: (inspections: QueuedInspection[]) => Promise<void>;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const DEFAULT_ANGLE_LABELS = [
  'Angle 1 (Front Panel)',
  'Angle 2 (Back / Declarations)',
  'Angle 3 (Nutritional Panel)',
  'Angle 4 (Side / MRP Stamp)',
  'Angle 5 (Top / Barcode)',
  'Angle 6 (Additional View)',
];

function generateId(): string {
  return `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatTimestamp(): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

// ─── Parallel Pipeline: Process a single product through the full pipeline ──
async function processSingleProductPipeline(
  imageDataUrl: string,
  imageName: string,
  onProgress: (progress: number, status: string) => void
): Promise<{
  scanRecord: ScanRecord;
  validationResult: ComplianceValidationResult;
  correlationResult: ScanCorrelationResult;
  readabilityResult: ReadabilityAnalysisResult;
  batchResult: BatchVerificationResult;
  mrpResult: MRPVerificationResult;
}> {
  const scanId = generateId();

  onProgress(5, 'Initializing OCR engine...');

  // Step 1: OCR
  const ocrResult = await ocrService.recognize(
    imageDataUrl,
    (p, s) => {
      onProgress(Math.min(60, Math.round(5 + (p / 100) * 55)), s);
    }
  );

  onProgress(65, 'Analyzing readability & font compliance...');

  // Step 2: Readability
  const readabilityResult = await readabilityService.analyze(
    scanId,
    imageDataUrl,
    ocrResult.extractedData,
    ocrResult.extractedData.imageDimensions || { width: 1000, height: 800 }
  );

  onProgress(75, 'Validating statutory declarations & compliance rules...');

  // Step 3: Rule Engine Validation
  const validationResult = validateProduct(ocrResult.extractedData);
  validationResult.scanId = scanId;

  // Step 4: RAG Correlation
  onProgress(82, 'Mapping regulatory discrepancies...');
  const consolidatedRawText = ocrResult.rawText;
  const correlationResult = processScanDiscrepanciesAndCorrelate(
    scanId,
    ocrResult.extractedData,
    validationResult,
    consolidatedRawText
  );

  // Step 5: Ingest into compliance store
  onProgress(88, 'Registering in compliance directory...');
  useComplianceStore.getState().addScannedProduct(
    ocrResult.extractedData,
    imageDataUrl,
    ocrResult.confidence,
    validationResult
  );

  // Step 6: Batch & MRP verification
  onProgress(92, 'Running historical batch & MRP verification...');
  const existingScans = useScanStore.getState().scans;

  const scanRecord: ScanRecord = {
    id: scanId,
    imageName: imageName,
    imageDataUrl: imageDataUrl,
    timestamp: formatTimestamp(),
    status: 'completed',
    progress: 100,
    confidence: ocrResult.confidence,
    extractedData: ocrResult.extractedData,
    readabilityResult,
    isMultiAngle: false,
    angles: [],
    activeAngleIndex: 0,
  };

  const allScansForVerification = [scanRecord, ...existingScans];

  const batchResult = verifyBatch(
    scanRecord.id,
    ocrResult.extractedData.batchNumber || '',
    ocrResult.extractedData.expiryDate || '',
    allScansForVerification
  );

  const directoryProducts = useComplianceStore.getState().products;
  const mrpResult = verifyMRP(
    ocrResult.extractedData.mrp || '',
    ocrResult.extractedData.productName || '',
    directoryProducts
  );

  onProgress(100, `Extraction complete — Score: ${readabilityResult.summary.overallScore}/100`);

  return {
    scanRecord,
    validationResult,
    correlationResult,
    readabilityResult,
    batchResult,
    mrpResult,
  };
}

export const useScanStore = create<ScanState>((set, get) => ({
  scans: MOCK_SCANS,
  currentScan: null,
  uploadedImages: [],
  isProcessing: false,
  currentProgress: 0,
  currentStatusMessage: '',
  activeAngleIndex: 0,
  hasUnviewedCompletion: false,
  lastCompletedScanId: null,
  validationResults: MOCK_VALIDATION_RESULTS,
  correlationResults: {},
  readabilityResults: MOCK_READABILITY_RESULTS,
  batchVerificationResults: {},
  mrpVerificationResults: {},

  // ── Parallel state defaults ────────────────────────────────────
  scanMode: 'single-product',
  parallelScanJobs: {},
  selectedParallelJobId: null,
  isParallelProcessing: false,

  loadSampleImage: async (imageUrl: string, fileName: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      await get().addImages([file]);
    } catch (err) {
      console.error('Failed to load sample image', err);
    }
  },

  addImages: async (files) => {
    const validFiles = files.filter((f) => ALLOWED_TYPES.includes(f.type));
    if (validFiles.length === 0) return;

    const currentImages = get().uploadedImages;
    const newImages: UploadedImage[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const dataUrl = await fileToDataUrl(file);
      const angleIndex = currentImages.length + i;
      const angleLabel = DEFAULT_ANGLE_LABELS[angleIndex] || `Angle ${angleIndex + 1}`;

      newImages.push({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        dataUrl,
        addedAt: Date.now(),
        angleLabel,
      });
    }

    set((state) => ({
      uploadedImages: [...state.uploadedImages, ...newImages],
    }));
  },

  removeImage: (id) => {
    set((state) => {
      const remaining = state.uploadedImages.filter((img) => img.id !== id);
      // Re-index angle labels only in single-product mode
      const reindexed = state.scanMode === 'single-product'
        ? remaining.map((img, idx) => ({
            ...img,
            angleLabel: DEFAULT_ANGLE_LABELS[idx] || `Angle ${idx + 1}`,
          }))
        : remaining;
      return { uploadedImages: reindexed };
    });
  },

  updateImageAngleLabel: (id, label) => {
    set((state) => ({
      uploadedImages: state.uploadedImages.map((img) =>
        img.id === id ? { ...img, angleLabel: label } : img
      ),
    }));
  },

  clearImages: () => {
    set({ uploadedImages: [] });
  },

  setActiveAngleIndex: (index) => {
    set({ activeAngleIndex: index });
  },

  clearUnviewedCompletion: () => {
    set({ hasUnviewedCompletion: false });
  },

  // ══════════════════════════════════════════════════════════════════
  // EXISTING SINGLE-PRODUCT / MULTI-ANGLE SCAN — PRESERVED AS-IS
  // ══════════════════════════════════════════════════════════════════
  startScan: async () => {
    const { uploadedImages } = get();
    if (uploadedImages.length === 0 || get().isProcessing) return;

    const isMultiAngle = uploadedImages.length > 1;
    const totalImages = uploadedImages.length;
    const scanId = generateId();
    const primaryImage = uploadedImages[0];

    const titleDescriptor = isMultiAngle
      ? `${primaryImage.name.replace(/\.[^/.]+$/, '')} (${totalImages} Angles Consolidated)`
      : primaryImage.name;

    const initialScanRecord: ScanRecord = {
      id: scanId,
      imageName: titleDescriptor,
      imageDataUrl: primaryImage.dataUrl,
      timestamp: formatTimestamp(),
      status: 'processing',
      progress: 0,
      confidence: 0,
      extractedData: null,
      isMultiAngle,
      angles: [],
      activeAngleIndex: 0,
    };

    set({
      isProcessing: true,
      currentProgress: 2,
      currentStatusMessage: isMultiAngle
        ? `Initializing Multi-Angle Vision Engine (${totalImages} photos of same product)...`
        : 'Initializing OCR engine...',
      currentScan: initialScanRecord,
      activeAngleIndex: 0,
      hasUnviewedCompletion: false,
    });

    try {
      const angles: ScanAngle[] = [];

      // Process each image as an angle of the same product
      for (let i = 0; i < totalImages; i++) {
        const image = uploadedImages[i];
        const angleLabel = image.angleLabel || DEFAULT_ANGLE_LABELS[i] || `Angle ${i + 1}`;
        const baseProgress = (i / totalImages) * 85;

        set({
          currentProgress: Math.round(baseProgress),
          currentStatusMessage: isMultiAngle
            ? `Analyzing ${angleLabel} (${i + 1}/${totalImages}): ${image.name}...`
            : 'Analyzing product packaging...',
        });

        // Run OCR on this specific angle
        const ocrResult = await ocrService.recognize(
          image.dataUrl,
          (angleProgress, angleStatus) => {
            const compositeProgress = Math.round(
              baseProgress + (angleProgress / 100) * (85 / totalImages)
            );
            set({
              currentProgress: Math.min(88, compositeProgress),
              currentStatusMessage: isMultiAngle
                ? `[${angleLabel}] ${angleStatus}`
                : angleStatus,
            });
          }
        );

        // Readability analysis for this angle (calibrated via Open Food Facts / Barcode Ruler)
        let angleReadability: ReadabilityAnalysisResult | undefined = undefined;
        try {
          const angleBarcode = ocrResult.extractedData?.declarations?.barcode?.value;
          const angleBarcodePx = ocrResult.extractedData?.declarations?.barcode?.barcodeWidthPx;
          const angleProd = ocrResult.extractedData?.declarations?.productName?.value;
          const angleDims = ocrResult.extractedData?.imageDimensions || { width: 1000, height: 800 };
          const angleCalib = await productDimensionsService.resolveDimensions({
            barcode: angleBarcode && angleBarcode !== '(Not detected)' ? angleBarcode : undefined,
            productName: angleProd && angleProd !== '(Not detected)' ? angleProd : undefined,
            barcodeWidthPx: angleBarcodePx,
            imageDimensions: angleDims,
          });

          angleReadability = await readabilityService.analyze(
            `${scanId}-angle-${i + 1}`,
            image.dataUrl,
            ocrResult.extractedData,
            angleDims,
            {
              calibration: {
                method: angleCalib.source as any,
                packageWidthMm: angleCalib.packageWidthMm,
                packageHeightMm: angleCalib.packageHeightMm,
                packageWidthPx: angleDims.width,
                packageHeightPx: angleDims.height,
                scaleMmPerPx: angleCalib.scaleMmPerPx,
                minNumeralHeightMm: angleCalib.minNumeralHeightMm,
                minNumeralHeightPt: angleCalib.minNumeralHeightPt,
                pdpAreaCm2: angleCalib.pdpAreaCm2,
                calibrationSourceLabel: angleCalib.sourceLabel,
                details: angleCalib.details,
              },
            }
          );
        } catch {
          // ignore readability errors for sub-angles
        }

        const angleRecord: ScanAngle = {
          id: `${scanId}-angle-${i + 1}`,
          angleIndex: i + 1,
          label: angleLabel,
          imageName: image.name,
          imageDataUrl: image.dataUrl,
          extractedData: ocrResult.extractedData,
          confidence: ocrResult.confidence,
          rawText: ocrResult.rawText,
          readabilityResult: angleReadability,
        };

        angles.push(angleRecord);

        // Update ongoing scan record with accumulated angles
        set((state) => ({
          currentScan: state.currentScan
            ? {
                ...state.currentScan,
                angles: [...angles],
              }
            : null,
        }));
      }

      // Step 2: Consolidate all angles into a single master product declaration
      set({
        currentProgress: 88,
        currentStatusMessage: isMultiAngle
          ? `Consolidating declarations across ${totalImages} angles & running statutory compliance audit...`
          : 'Validating statutory declarations & compliance rules...',
      });

      const { masterExtractedData, masterConfidence, consolidatedRawText } =
        consolidateMultiAngleExtractions(angles, primaryImage.name.replace(/\.[^/.]+$/, ''));

      // Step 3: Run Rule Engine Validation on the master product
      const validationResult = validateProduct(masterExtractedData);
      validationResult.scanId = scanId;

      await new Promise((r) => setTimeout(r, 300));
      set({
        currentProgress: 94,
        currentStatusMessage: 'Correlating with Legal Metrology Statutory RAG Database...',
      });

      // Step 4: Run RAG Statutory Mapping & Complaint Correlation
      const correlationResult = processScanDiscrepanciesAndCorrelate(
        scanId,
        masterExtractedData,
        validationResult,
        consolidatedRawText
      );

      await new Promise((r) => setTimeout(r, 250));
      set({
        currentProgress: 98,
        currentStatusMessage: 'Finalizing readability analysis & compliance audit report...',
      });

      // Step 5: Master Readability Analysis (calibrated via Open Food Facts API / Barcode Optical Scale)
      const masterBarcode = masterExtractedData.declarations?.barcode?.value;
      const masterBarcodePx = masterExtractedData.declarations?.barcode?.barcodeWidthPx;
      const masterProd = masterExtractedData.declarations?.productName?.value;
      const masterDims = masterExtractedData.imageDimensions || { width: 1200, height: 900 };

      const masterCalib = await productDimensionsService.resolveDimensions({
        barcode: masterBarcode && masterBarcode !== '(Not detected)' ? masterBarcode : undefined,
        productName: masterProd && masterProd !== '(Not detected)' ? masterProd : undefined,
        barcodeWidthPx: masterBarcodePx,
        imageDimensions: masterDims,
      });

      const masterReadability = await readabilityService.analyze(
        scanId,
        primaryImage.dataUrl,
        masterExtractedData,
        masterDims,
        {
          calibration: {
            method: masterCalib.source as any,
            packageWidthMm: masterCalib.packageWidthMm,
            packageHeightMm: masterCalib.packageHeightMm,
            packageWidthPx: masterDims.width,
            packageHeightPx: masterDims.height,
            scaleMmPerPx: masterCalib.scaleMmPerPx,
            minNumeralHeightMm: masterCalib.minNumeralHeightMm,
            minNumeralHeightPt: masterCalib.minNumeralHeightPt,
            pdpAreaCm2: masterCalib.pdpAreaCm2,
            calibrationSourceLabel: masterCalib.sourceLabel,
            details: masterCalib.details,
          },
        }
      );

      const completedScan: ScanRecord = {
        ...initialScanRecord,
        status: 'completed',
        progress: 100,
        confidence: masterConfidence,
        extractedData: masterExtractedData,
        readabilityResult: masterReadability,
        isMultiAngle,
        angles,
        activeAngleIndex: 0,
      };

      await offlineInspectionQueue.enqueue(completedScan, uploadedImages, {
        validationResult,
        correlationResult,
      });

      // Step 6: Ingest Scanned Product into Central Compliance Store
      useComplianceStore.getState().addScannedProduct(
        masterExtractedData,
        primaryImage.dataUrl,
        masterConfidence,
        validationResult
      );

      // Step 7: Historical Batch Verification & Dual MRP Detection
      // We need the current list of scans + the just-completed scan to compare against.
      const existingScans = get().scans; // prior scans (does NOT include completedScan yet)
      const allScansForVerification = [completedScan, ...existingScans];

      const batchResult = verifyBatch(
        completedScan.id,
        masterExtractedData.batchNumber || '',
        masterExtractedData.expiryDate || '',
        allScansForVerification
      );

      const directoryProducts = useComplianceStore.getState().products;
      const mrpResult = verifyMRP(
        masterExtractedData.mrp || '',
        masterExtractedData.productName || '',
        directoryProducts
      );

      set((state) => ({
        scans: [completedScan, ...state.scans],
        currentScan: completedScan,
        currentProgress: 100,
        currentStatusMessage: isMultiAngle
          ? `Multi-Angle Analysis Complete (${totalImages} angles compiled) — Score: ${masterReadability.summary.overallScore}/100. ${correlationResult.summary.totalDiscrepancies} discrepancy(s) mapped.`
          : `Extraction & Readability complete — Score: ${masterReadability.summary.overallScore}/100. ${correlationResult.summary.totalDiscrepancies} packaging discrepancy(s) mapped.`,
        validationResults: {
          ...state.validationResults,
          [completedScan.id]: validationResult,
        },
        correlationResults: {
          ...state.correlationResults,
          [completedScan.id]: correlationResult,
        },
        readabilityResults: {
          ...state.readabilityResults,
          [completedScan.id]: masterReadability,
        },
        batchVerificationResults: {
          ...state.batchVerificationResults,
          [completedScan.id]: batchResult,
        },
        mrpVerificationResults: {
          ...state.mrpVerificationResults,
          [completedScan.id]: mrpResult,
        },
        isProcessing: false,
        uploadedImages: [],
        hasUnviewedCompletion: true,
        lastCompletedScanId: completedScan.id,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Multi-angle scanning failed';
      const failedScan: ScanRecord = {
        ...initialScanRecord,
        status: 'error',
        progress: 0,
        errorMessage,
      };

      set((state) => ({
        scans: [failedScan, ...state.scans],
        currentScan: failedScan,
        currentStatusMessage: `Error: ${errorMessage}`,
        isProcessing: false,
      }));
    }
  },

  updateScanProgress: (id, progress, status) => {
    set((state) => ({
      currentScan:
        state.currentScan?.id === id
          ? { ...state.currentScan, progress }
          : state.currentScan,
      currentProgress: progress,
      currentStatusMessage: status,
    }));
  },

  completeScan: (id, rawText, confidence, extractedData) => {
    set((state) => ({
      scans: state.scans.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'completed' as const,
              progress: 100,
              confidence,
              extractedData,
            }
          : s
      ),
    }));
  },

  failScan: (id, error) => {
    set((state) => ({
      scans: state.scans.map((s) =>
        s.id === id ? { ...s, status: 'error' as const, errorMessage: error } : s
      ),
      isProcessing: false,
    }));
  },

  deleteScan: (id) => {
    set((state) => {
      const { [id]: _remVal, ...remainingValidation } = state.validationResults;
      const { [id]: _remCorr, ...remainingCorrelation } = state.correlationResults;
      const { [id]: _remRead, ...remainingReadability } = state.readabilityResults;
      const { [id]: _remBatch, ...remainingBatch } = state.batchVerificationResults;
      const { [id]: _remMrp, ...remainingMrp } = state.mrpVerificationResults;
      return {
        scans: state.scans.filter((s) => s.id !== id),
        currentScan: state.currentScan?.id === id ? null : state.currentScan,
        validationResults: remainingValidation,
        correlationResults: remainingCorrelation,
        readabilityResults: remainingReadability,
        batchVerificationResults: remainingBatch,
        mrpVerificationResults: remainingMrp,
      };
    });
  },

  clearHistory: () => {
    set({
      scans: [],
      currentScan: null,
      validationResults: {},
      correlationResults: {},
      readabilityResults: {},
      batchVerificationResults: {},
      mrpVerificationResults: {},
    });
  },

  viewScan: (scan) => {
    set({ currentScan: scan, activeAngleIndex: 0 });
  },

  setValidationResult: (scanId, result) => {
    set((state) => ({
      validationResults: {
        ...state.validationResults,
        [scanId]: result,
      },
    }));
  },

  setReadabilityResult: (scanId, result) => {
    set((state) => ({
      readabilityResults: {
        ...state.readabilityResults,
        [scanId]: result,
      },
      currentScan:
        state.currentScan && state.currentScan.id === scanId
          ? { ...state.currentScan, readabilityResult: result }
          : state.currentScan,
    }));
  },

  // ══════════════════════════════════════════════════════════════════
  // PARALLEL MULTI-PRODUCT SCANNING — NEW FEATURE
  // ══════════════════════════════════════════════════════════════════

  setScanMode: (mode) => {
    set({ scanMode: mode });
  },

  selectParallelJob: (jobId) => {
    if (!jobId) {
      set({ selectedParallelJobId: null });
      return;
    }
    const job = get().parallelScanJobs[jobId];
    if (job && job.completedScanId) {
      // If this job is completed, select its ScanRecord as currentScan
      const scan = get().scans.find((s) => s.id === job.completedScanId);
      if (scan) {
        set({
          selectedParallelJobId: jobId,
          currentScan: scan,
          activeAngleIndex: 0,
        });
        return;
      }
    }
    set({ selectedParallelJobId: jobId });
  },

  removeParallelJob: (jobId) => {
    set((state) => {
      const job = state.parallelScanJobs[jobId];
      // Only allow removing queued or completed/failed jobs
      if (job && job.status !== 'scanning' && job.status !== 'validating') {
        const { [jobId]: _, ...remaining } = state.parallelScanJobs;
        return {
          parallelScanJobs: remaining,
          selectedParallelJobId:
            state.selectedParallelJobId === jobId ? null : state.selectedParallelJobId,
        };
      }
      return {};
    });
  },

  clearParallelJobs: () => {
    const jobs = get().parallelScanJobs;
    // Only clear jobs that are not currently running
    const remaining: Record<string, ParallelScanJob> = {};
    for (const [id, job] of Object.entries(jobs)) {
      if (job.status === 'scanning' || job.status === 'validating') {
        remaining[id] = job;
      }
    }
    set({
      parallelScanJobs: remaining,
      selectedParallelJobId: null,
    });
  },

  startParallelScan: async () => {
    const { uploadedImages, isParallelProcessing } = get();
    if (uploadedImages.length === 0) return;

    // Create jobs from uploaded images
    const newJobs: Record<string, ParallelScanJob> = {};
    for (const image of uploadedImages) {
      const jobId = generateId();
      newJobs[jobId] = {
        id: jobId,
        status: 'queued',
        progress: 0,
        statusMessage: 'Waiting for worker...',
        imageDataUrl: image.dataUrl,
        imageName: image.name,
        file: image.file,
        confidence: 0,
        extractedData: null,
        createdAt: Date.now(),
      };
    }

    set((state) => ({
      parallelScanJobs: { ...state.parallelScanJobs, ...newJobs },
      uploadedImages: [],
      isParallelProcessing: true,
    }));

    // Launch the concurrency-limited queue processor
    const jobIds = Object.keys(newJobs);
    await processParallelQueue(jobIds);
  restoreOfflineInspections: async (inspections) => {
    const inspectionsById = new Map(inspections.map((inspection) => [inspection.id, inspection]));
    const restoredScans = await Promise.all(
      inspections
        .filter((inspection) => inspection.scan.status === 'completed' && inspection.scan.extractedData)
        .map((inspection) => offlineInspectionQueue.restoreScan(inspection))
    );
    const restoredValidation = Object.fromEntries(
      restoredScans.map((scan) => {
        const queuedInspection = inspectionsById.get(scan.id);
        const result = queuedInspection?.analysis.validationResult || validateProduct(scan.extractedData!);
        result.scanId = scan.id;
        return [scan.id, result];
      })
    );
    const restoredCorrelation = Object.fromEntries(
      restoredScans.map((scan) => [
        scan.id,
        inspectionsById.get(scan.id)!.analysis.correlationResult,
      ])
    );
    const restoredReadability = Object.fromEntries(
      restoredScans
        .filter((scan) => scan.readabilityResult)
        .map((scan) => [scan.id, scan.readabilityResult!])
    );

    set((state) => {
      const existingIds = new Set(state.scans.map((scan) => scan.id));
      const newScans = restoredScans.filter((scan) => !existingIds.has(scan.id));
      return {
        scans: [...newScans, ...state.scans],
        validationResults: { ...restoredValidation, ...state.validationResults },
        correlationResults: { ...restoredCorrelation, ...state.correlationResults },
        readabilityResults: { ...restoredReadability, ...state.readabilityResults },
      };
    });
  },
}));

// ─── Concurrency-Limited Parallel Queue Processor ────────────────────────────
// This function processes jobs with a semaphore-style concurrency limit.
// It runs MAX_PARALLEL_SCANS jobs simultaneously and starts new ones as slots open.

async function processParallelQueue(jobIds: string[]): Promise<void> {
  const queue = [...jobIds];
  const activePromises: Promise<void>[] = [];

  const processNextJob = async (): Promise<void> => {
    while (queue.length > 0) {
      const jobId = queue.shift()!;
      await processOneJob(jobId);
    }
  };

  // Start up to MAX_PARALLEL_SCANS workers
  for (let i = 0; i < Math.min(MAX_PARALLEL_SCANS, queue.length); i++) {
    activePromises.push(processNextJob());
  }

  await Promise.all(activePromises);

  // Check if any parallel jobs are still running
  const state = useScanStore.getState();
  const anyRunning = Object.values(state.parallelScanJobs).some(
    (j) => j.status === 'scanning' || j.status === 'validating' || j.status === 'queued'
  );
  if (!anyRunning) {
    useScanStore.setState({ isParallelProcessing: false });
  }
}

async function processOneJob(jobId: string): Promise<void> {
  const state = useScanStore.getState();
  const job = state.parallelScanJobs[jobId];
  if (!job || job.status !== 'queued') return;

  // Mark as scanning
  useScanStore.setState((s) => ({
    parallelScanJobs: {
      ...s.parallelScanJobs,
      [jobId]: {
        ...s.parallelScanJobs[jobId],
        status: 'scanning',
        startedAt: Date.now(),
        statusMessage: 'Initializing OCR engine...',
      },
    },
  }));

  try {
    const result = await processSingleProductPipeline(
      job.imageDataUrl,
      job.imageName,
      (progress, status) => {
        const currentJob = useScanStore.getState().parallelScanJobs[jobId];
        if (!currentJob) return;

        const jobStatus: 'scanning' | 'validating' = progress >= 70 ? 'validating' : 'scanning';

        useScanStore.setState((s) => ({
          parallelScanJobs: {
            ...s.parallelScanJobs,
            [jobId]: {
              ...s.parallelScanJobs[jobId],
              progress,
              statusMessage: status,
              status: jobStatus,
            },
          },
        }));
      }
    );

    // Commit the completed scan record to the global scans array
    useScanStore.setState((s) => ({
      scans: [result.scanRecord, ...s.scans],
      validationResults: {
        ...s.validationResults,
        [result.scanRecord.id]: result.validationResult,
      },
      correlationResults: {
        ...s.correlationResults,
        [result.scanRecord.id]: result.correlationResult,
      },
      readabilityResults: {
        ...s.readabilityResults,
        [result.scanRecord.id]: result.readabilityResult,
      },
      batchVerificationResults: {
        ...s.batchVerificationResults,
        [result.scanRecord.id]: result.batchResult,
      },
      mrpVerificationResults: {
        ...s.mrpVerificationResults,
        [result.scanRecord.id]: result.mrpResult,
      },
      parallelScanJobs: {
        ...s.parallelScanJobs,
        [jobId]: {
          ...s.parallelScanJobs[jobId],
          status: 'completed',
          progress: 100,
          statusMessage: 'Extraction complete',
          confidence: result.scanRecord.confidence,
          extractedData: result.scanRecord.extractedData,
          completedScanId: result.scanRecord.id,
          completedAt: Date.now(),
        },
      },
      // Auto-select the first completed job if none selected
      currentScan:
        s.currentScan === null || s.selectedParallelJobId === jobId
          ? result.scanRecord
          : s.currentScan,
      hasUnviewedCompletion: true,
      lastCompletedScanId: result.scanRecord.id,
    }));
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Scan failed';

    useScanStore.setState((s) => ({
      parallelScanJobs: {
        ...s.parallelScanJobs,
        [jobId]: {
          ...s.parallelScanJobs[jobId],
          status: 'failed',
          progress: 0,
          statusMessage: `Error: ${errorMessage}`,
          errorMessage,
          completedAt: Date.now(),
        },
      },
    }));
  }
}
