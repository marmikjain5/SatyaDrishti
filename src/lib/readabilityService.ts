/**
 * SatyaDrishti Readability & Font Size Analysis Engine (Feature 4)
 *
 * Production-ready service for:
 * 1. Estimating physical font size (pt, mm, px) from OCR bounding boxes relative to image dimensions.
 * 2. Optical luminance & WCAG 2.1 contrast ratio analysis from image canvas data.
 * 3. Composite visibility scoring based on contrast, font adequacy, and OCR confidence.
 * 4. Statutory compliance verification against Legal Metrology Rule 9 / Schedule II standards.
 * 5. Problematic region flagging and remediation recommendations.
 */

import type {
  ExtractedProductData,
  BoundingBox,
  DeclarationFieldKey,
  DeclarationField,
} from '../types/scan';
import type {
  ReadabilityAnalysisResult,
  ReadabilitySummary,
  TextRegionReadability,
  FontSizeMetrics,
  ContrastMetrics,
  ReadabilityStatus,
  ReadabilityFlag,
  MeasurementStatus,
} from '../types/readability';

const DEFAULT_ANALYSIS_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout: () => T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = globalThis.setTimeout(() => resolve(onTimeout()), timeoutMs);
    promise.then((value) => {
      globalThis.clearTimeout(timer);
      resolve(value);
    }).catch(() => {
      globalThis.clearTimeout(timer);
      resolve(onTimeout());
    });
  });
}

export interface PhysicalCalibration {
  method: 'aruco' | 'reference-object' | 'manual' | 'lidar' | 'open-food-facts' | 'optical-barcode' | 'local-registry' | 'unavailable';
  packageWidthMm?: number;
  packageHeightMm?: number;
  packageWidthPx?: number;
  packageHeightPx?: number;
  uncertaintyMm?: number;
  minNumeralHeightMm?: number;
  minNumeralHeightPt?: number;
  pdpAreaCm2?: number;
  calibrationSourceLabel?: string;
  sourceLabel?: string;
  details?: string;
  scaleMmPerPx?: number;
}

export interface ReadabilityAnalysisOptions {
  calibration?: PhysicalCalibration;
  calibrationProvider?: () => Promise<PhysicalCalibration | null>;
  timeoutMs?: number;
}

// ─── Statutory Font Size Thresholds (Legal Metrology Rule 9 & Schedule II) ───

interface StatutoryThreshold {
  minPt: number;
  minMm: number;
  statutoryRule: string;
  category: 'statutory_declaration' | 'barcode' | 'general_text' | 'branding';
}

const STATUTORY_THRESHOLDS: Record<DeclarationFieldKey, StatutoryThreshold> = {
  productName: {
    minPt: 8.0,
    minMm: 2.5,
    statutoryRule: 'Legal Metrology (Packaged Commodities) Rule 9(1) - Commodity Identification Prominence',
    category: 'statutory_declaration',
  },
  mrp: {
    minPt: 6.5,
    minMm: 2.0,
    statutoryRule: 'Legal Metrology Rule 9 & Schedule II - Mandatory Price Declaration Legibility',
    category: 'statutory_declaration',
  },
  netQuantity: {
    minPt: 8.0,
    minMm: 2.5,
    statutoryRule: 'Legal Metrology Schedule II - Minimum Height of Numerals for Net Quantity (Min 2.0mm–4.0mm)',
    category: 'statutory_declaration',
  },
  manufacturer: {
    minPt: 6.0,
    minMm: 1.8,
    statutoryRule: 'Legal Metrology Rule 9 - Manufacturer Identity Legibility Standard',
    category: 'statutory_declaration',
  },
  address: {
    minPt: 5.5,
    minMm: 1.5,
    statutoryRule: 'Legal Metrology Rule 9 - Manufacturer Full Address & Postal Code Legibility',
    category: 'statutory_declaration',
  },
  importer: {
    minPt: 5.5,
    minMm: 1.5,
    statutoryRule: 'Legal Metrology Rule 9 - Importer Identification Standard',
    category: 'statutory_declaration',
  },
  countryOfOrigin: {
    minPt: 6.0,
    minMm: 1.8,
    statutoryRule: 'Legal Metrology (Amendment) Rules 2017 - Country of Origin Prominence',
    category: 'statutory_declaration',
  },
  packingDate: {
    minPt: 5.5,
    minMm: 1.5,
    statutoryRule: 'Legal Metrology Rule 9 - Month & Year of Packing Legibility',
    category: 'statutory_declaration',
  },
  manufacturingDate: {
    minPt: 5.5,
    minMm: 1.5,
    statutoryRule: 'Legal Metrology Rule 9 - Manufacturing Date Legibility',
    category: 'statutory_declaration',
  },
  expiryDate: {
    minPt: 6.0,
    minMm: 1.8,
    statutoryRule: 'Legal Metrology Rule 9 - Best Before / Expiry Date Legibility Standard',
    category: 'statutory_declaration',
  },
  batchNumber: {
    minPt: 5.5,
    minMm: 1.5,
    statutoryRule: 'Legal Metrology Rule 9 - Batch / Lot Identification Standard',
    category: 'statutory_declaration',
  },
  customerCare: {
    minPt: 5.5,
    minMm: 1.5,
    statutoryRule: 'Legal Metrology Rule 6(1)(da) - Consumer Redressal Contact Legibility',
    category: 'statutory_declaration',
  },
  barcode: {
    minPt: 10.0,
    minMm: 3.5,
    statutoryRule: 'GS1 India Specification - Barcode Symbology Quiet Zone & Symbol Height',
    category: 'barcode',
  },
  unitSalePrice: {
    minPt: 4.5,
    minMm: 1.5,
    statutoryRule: 'Legal Metrology Rule 6(1)(aa) [G.S.R. 779(E)]  -  USP font height must be ≥50% of MRP font height',
    category: 'statutory_declaration',
  },
};

const DEFAULT_THRESHOLD: StatutoryThreshold = {
  minPt: 6.0,
  minMm: 1.8,
  statutoryRule: 'Legal Metrology (Packaged Commodities) Rule 9 - General Statutory Legibility',
  category: 'general_text',
};

// ─── Optical & Canvas Analysis Helpers ──────────────────────────

/**
 * Calculate relative luminance using the standard WCAG 2.1 formula.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG 2.1 contrast ratio between two luminance values.
 * Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter of the two.
 */
function calculateContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Map contrast ratio (1.0 - 21.0) to a normalized 0-100 score.
 * WCAG AAA (7.0:1) -> 100
 * WCAG AA (4.5:1)  -> 85
 * Minimum (3.0:1)  -> 60
 * Poor (< 2.0:1)   -> < 40
 */
function contrastRatioToScore(ratio: number): number {
  if (ratio >= 7.0) return Math.min(100, Math.round(85 + ((ratio - 7.0) / 14.0) * 15));
  if (ratio >= 4.5) return Math.round(70 + ((ratio - 4.5) / 2.5) * 15);
  if (ratio >= 3.0) return Math.round(50 + ((ratio - 3.0) / 1.5) * 20);
  if (ratio >= 1.5) return Math.round(20 + ((ratio - 1.5) / 1.5) * 30);
  return Math.max(5, Math.round((ratio / 1.5) * 20));
}

/**
 * Extract pixel contrast from an image data URL around a normalized bounding box.
 */
async function sampleImageBoundingBoxContrast(
  imageDataUrl: string,
  bbox: BoundingBox['normalized'],
  imageDimensions: { width: number; height: number },
  timeoutMs = DEFAULT_ANALYSIS_TIMEOUT_MS
): Promise<ContrastMetrics> {
  const unavailable = (status: MeasurementStatus = 'unavailable', reason = 'Image contrast could not be measured.') => ({
    contrastScore: 0,
    contrastRatio: 0,
    foregroundLuminance: 0,
    backgroundLuminance: 0,
    isLowContrast: true,
    formattedRatio: 'Unavailable',
    measurementStatus: status,
    failureReason: reason,
  });

  try {
    if (typeof document === 'undefined') {
      throw new Error('Running in non-DOM environment');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loaded = await withTimeout(new Promise<boolean>((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Failed to load image for canvas analysis'));
      img.src = imageDataUrl;
    }), timeoutMs, () => false);
    if (!loaded) throw new Error('Timed out loading image for canvas analysis');

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || imageDimensions.width || 800;
    canvas.height = img.naturalHeight || imageDimensions.height || 600;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) throw new Error('Could not obtain 2D canvas context');

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Calculate pixel bounds
    const x0 = Math.max(0, Math.floor((bbox.x / 100) * canvas.width));
    const y0 = Math.max(0, Math.floor((bbox.y / 100) * canvas.height));
    const w = Math.min(canvas.width - x0, Math.max(4, Math.floor((bbox.width / 100) * canvas.width)));
    const h = Math.min(canvas.height - y0, Math.max(4, Math.floor((bbox.height / 100) * canvas.height)));

    const imgData = ctx.getImageData(x0, y0, w, h);
    const data = imgData.data;

    // Collect luminance array
    const luminances: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      luminances.push(calculateRelativeLuminance(r, g, b));
    }

    if (luminances.length === 0) throw new Error('No pixels sampled');

    // Sort to determine foreground (text strokes) vs background (outer label paper)
    luminances.sort((a, b) => a - b);
    const bottom15Percentile = luminances.slice(0, Math.max(1, Math.floor(luminances.length * 0.15)));
    const top15Percentile = luminances.slice(Math.max(0, Math.floor(luminances.length * 0.85)));

    const darkAvg = bottom15Percentile.reduce((sum, v) => sum + v, 0) / bottom15Percentile.length;
    const brightAvg = top15Percentile.reduce((sum, v) => sum + v, 0) / top15Percentile.length;

    const ratio = Math.round(calculateContrastRatio(brightAvg, darkAvg) * 10) / 10;
    const score = contrastRatioToScore(ratio);

    return {
      contrastScore: score,
      contrastRatio: ratio,
      foregroundLuminance: Math.round(darkAvg * 100) / 100,
      backgroundLuminance: Math.round(brightAvg * 100) / 100,
      isLowContrast: score < 45 || ratio < 3.0,
      formattedRatio: `${ratio.toFixed(1)}:1`,
      measurementStatus: 'measured',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Canvas analysis failed.';
    return unavailable(message.includes('Timed out') ? 'timed-out' : 'unavailable', message);
  }
}

// ─── Font Size Estimation & Physical Metrics Calculation ────────

/**
 * Estimate font size based on bounding box height relative to image dimensions.
 *
 * Mathematical Model:
 * 1. Bounding box height in pixels: bboxHeightPx = (bbox.height / 100) * imageHeight
 * 2. Assumes optical packaging resolution baseline: 150 DPI for standard mobile/flatbed capture.
 * 3. 1 point = 1/72 inch => Points = (bboxHeightPx / 150) * 72 * (600 / imageHeight) factor normalization
 * 4. Millimeters = (Points * 25.4) / 72
 */
function estimateFontSizeMetrics(
  bbox: BoundingBox,
  imageDimensions: { width: number; height: number },
  threshold: StatutoryThreshold,
  calibration?: PhysicalCalibration
): FontSizeMetrics {
  const imgH = imageDimensions.height || 800;
  const bboxHeightPx = Math.max(6, Math.round(((bbox.y1 - bbox.y0) || ((bbox.normalized.height / 100) * imgH))));
  const relativePercent = Math.round((bboxHeightPx / imgH) * 1000) / 10;

  const physicalHeightMm = calibration?.packageHeightMm;
  const physicalHeightPx = calibration?.packageHeightPx || imgH;
  const measurementStatus: MeasurementStatus = (physicalHeightMm && physicalHeightPx) || calibration?.scaleMmPerPx
    ? 'measured'
    : 'unavailable';
  const estimatedMm = measurementStatus === 'measured'
    ? (calibration?.scaleMmPerPx
        ? Math.round(bboxHeightPx * calibration.scaleMmPerPx * 10) / 10
        : Math.round(((bboxHeightPx / physicalHeightPx) * physicalHeightMm!) * 10) / 10)
    : 0;
  const estimatedPt = Math.round((estimatedMm * (72 / 25.4)) * 10) / 10;

  // Apply Legal Metrology Schedule II statutory numeral tier if available for this package's PDP area
  const effectiveMinMm = (calibration?.minNumeralHeightMm && (threshold.category === 'statutory_declaration' || threshold.minMm >= 1.5))
    ? Math.max(threshold.minMm, calibration.minNumeralHeightMm)
    : threshold.minMm;
  const effectiveMinPt = Math.round((effectiveMinMm * (72 / 25.4)) * 10) / 10;

  const isBelowThreshold = measurementStatus === 'measured' && (estimatedPt < effectiveMinPt || estimatedMm < effectiveMinMm);

  return {
    pt: estimatedPt,
    mm: estimatedMm,
    px: bboxHeightPx,
    relativeHeightPercent: relativePercent,
    minThresholdPt: effectiveMinPt,
    minThresholdMm: effectiveMinMm,
    isBelowThreshold,
    measurementStatus,
    calibrationMethod: calibration?.calibrationSourceLabel || calibration?.sourceLabel || calibration?.method,
    formatted: measurementStatus === 'measured'
      ? `${estimatedPt.toFixed(1)} pt (${estimatedMm.toFixed(1)} mm)`
      : 'Unavailable  -  calibrated scale required',
  };
}

// ─── Composite Visibility Scoring & Flagging Engine ─────────────

/**
 * Compute composite visibility score combining contrast, font size adequacy, and OCR confidence.
 */
function calculateVisibilityScore(
  contrastScore: number,
  ocrConfidence: number,
  fontSize: FontSizeMetrics
): number {
  // Font adequacy score (100 if >= min threshold, scaled linearly if below)
  const fontAdequacy = fontSize.isBelowThreshold
    ? Math.max(20, Math.round((fontSize.pt / fontSize.minThresholdPt) * 80))
    : 100;

  // Weighted synthesis:
  // Contrast (35%) + OCR Confidence (35%) + Font Adequacy (30%)
  const score = Math.round(
    contrastScore * 0.35 + ocrConfidence * 0.35 + fontAdequacy * 0.30
  );

  return Math.min(100, Math.max(0, score));
}

/**
 * Determine compliance status and flagged defects for a region.
 */
function evaluateReadabilityDefects(
  ocrConfidence: number,
  contrast: ContrastMetrics,
  fontSize: FontSizeMetrics,
  visibilityScore: number,
  threshold: StatutoryThreshold
): {
  status: ReadabilityStatus;
  flags: ReadabilityFlag[];
  remediationAdvice: string;
} {
  const flags: ReadabilityFlag[] = [];
  const advice: string[] = [];

  // Flag 1: Low OCR confidence (< 60%)
  if (ocrConfidence < 60) {
    flags.push('LOW_CONFIDENCE');
    advice.push(`OCR confidence is low (${Math.round(ocrConfidence)}%). Enhance lighting or reduce packaging glare.`);
  }

  // Flag 2: Poor contrast or background noise
  if (contrast.contrastScore < 45 || contrast.contrastRatio < 3.0) {
    flags.push('LOW_CONTRAST');
    advice.push(`Optical contrast (${contrast.formattedRatio}) is below statutory legibility minimum (min 4.5:1). Increase ink density against background.`);
  }

  const measurementUnavailable = contrast.measurementStatus !== 'measured' || fontSize.measurementStatus !== 'measured';
  if (measurementUnavailable) {
    return {
      status: 'indeterminate',
      flags,
      remediationAdvice: 'Unable to verify physical font size or optical contrast from this image. Capture the package with a visible calibrated reference or provide approved package dimensions; no legal pass/fail is assigned.',
    };
  }

  // Flag 3: Font size below statutory threshold
  if (fontSize.isBelowThreshold) {
    flags.push('BELOW_MIN_FONT_SIZE');
    advice.push(`Estimated font height (${fontSize.formatted}) is below the required statutory minimum (${fontSize.minThresholdPt} pt / ${fontSize.minThresholdMm} mm) under ${threshold.statutoryRule}.`);
  }

  // Flag 4: Poor composite visibility score
  if (visibilityScore < 60 && !flags.includes('POOR_VISIBILITY')) {
    flags.push('POOR_VISIBILITY');
    advice.push('Overall visual prominence and legibility is suboptimal for statutory retail inspection.');
  }

  // Determine overall status
  let status: ReadabilityStatus = 'compliant';
  if (flags.includes('BELOW_MIN_FONT_SIZE') || ocrConfidence < 50 || visibilityScore < 50 || contrast.contrastScore < 35) {
    status = 'non-compliant';
  } else if (flags.length > 0 || visibilityScore < 75 || ocrConfidence < 70) {
    status = 'warning';
  }

  const finalAdvice = advice.length > 0
    ? advice.join(' ')
    : `Text region meets statutory legibility guidelines under ${threshold.statutoryRule}.`;

  return {
    status,
    flags,
    remediationAdvice: finalAdvice,
  };
}

// ─── Package Spatial Anchoring Engine ───────────────────────────

/**
 * Canonical statutory packaging declaration layout zones relative to container geometry (0-100% of packaging body).
 * Designed so declarations strictly sit inside the container boundaries and align with real packaging layout:
 * - Brand/Header at top
 * - Composition / Importer / Origin in upper-mid
 * - Manufacturer & Address in mid
 * - Customer Care in lower-mid
 * - Barcode at lower-left
 * - Net Quantity above price stamp
 * - MRP, USP, Batch, MFD, Expiry inside the right-hand statutory stamp
 */
/**
 * Canonical statutory packaging declaration layout zones for vertical containers
 * (bottles, jars, sprays, cans) where aspect ratio is tall (height > width).
 */
export const CANONICAL_BOTTLE_ZONES: Record<string, { x: number; y: number; width: number; height: number }> = {
  productName: { x: 8, y: 5, width: 84, height: 7.5 },
  countryOfOrigin: { x: 6, y: 35, width: 88, height: 4.5 },
  importer: { x: 6, y: 40.5, width: 88, height: 4.5 },
  manufacturer: { x: 6, y: 45.5, width: 88, height: 5.5 },
  address: { x: 6, y: 51.5, width: 88, height: 6.5 },
  customerCare: { x: 6, y: 58.5, width: 88, height: 6.5 },
  barcode: { x: 4, y: 67, width: 28, height: 18 },
  netQuantity: { x: 36, y: 67, width: 60, height: 4.5 },
  mrp: { x: 36, y: 73, width: 60, height: 4.5 },
  unitSalePrice: { x: 36, y: 78.5, width: 60, height: 4.2 },
  batchNumber: { x: 36, y: 83.5, width: 60, height: 4.2 },
  manufacturingDate: { x: 36, y: 88, width: 60, height: 4.2 },
  expiryDate: { x: 36, y: 92.5, width: 60, height: 4.2 },
  packingDate: { x: 36, y: 88, width: 60, height: 4.2 },
};

/**
 * Canonical statutory packaging declaration layout zones for landscape confectionery & food pouches
 * (biscuits, chips, namkeen, wafers, noodle packs) where aspect ratio is wide (width >= height).
 */
export const CANONICAL_POUCH_ZONES: Record<string, { x: number; y: number; width: number; height: number }> = {
  productName: { x: 8, y: 22, width: 44, height: 11 },
  countryOfOrigin: { x: 8, y: 34, width: 44, height: 6.5 },
  importer: { x: 54, y: 72, width: 42, height: 6 },
  manufacturer: { x: 54, y: 56, width: 42, height: 12 },
  address: { x: 54, y: 69, width: 42, height: 13 },
  customerCare: { x: 8, y: 82, width: 44, height: 9.5 },
  barcode: { x: 26, y: 53, width: 22, height: 18 },
  netQuantity: { x: 65, y: 44, width: 30, height: 5.5 },
  mrp: { x: 55, y: 38, width: 40, height: 5.5 },
  unitSalePrice: { x: 55, y: 44, width: 22, height: 5.5 },
  batchNumber: { x: 54, y: 83, width: 42, height: 6 },
  manufacturingDate: { x: 54, y: 89, width: 42, height: 5.5 },
  expiryDate: { x: 54, y: 89, width: 42, height: 5.5 },
  packingDate: { x: 54, y: 89, width: 42, height: 5.5 },
};

export const CANONICAL_PACKAGE_ZONES = CANONICAL_BOTTLE_ZONES;

/**
 * Dynamically projects a canonical declaration zone onto physical packaging contour bounds.
 */
export function mapZoneToPackage(
  zone: { x: number; y: number; width: number; height: number },
  pkg: { x: number; y: number; width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.round((pkg.x + (zone.x / 100) * pkg.width) * 10) / 10,
    y: Math.round((pkg.y + (zone.y / 100) * pkg.height) * 10) / 10,
    width: Math.round(((zone.width / 100) * pkg.width) * 10) / 10,
    height: Math.round(((zone.height / 100) * pkg.height) * 10) / 10,
  };
}

// ─── Main Readability Analysis Engine ───────────────────────────

export class ReadabilityAnalysisEngine {
  /**
   * Run complete font size, contrast, visibility, and statutory readability analysis
   * on all extracted declarations and detected OCR text regions.
   */
  async analyze(
    scanId: string,
    imageDataUrl: string,
    extractedData: ExtractedProductData,
    imageDimensions: { width: number; height: number },
    options: ReadabilityAnalysisOptions = {}
  ): Promise<ReadabilityAnalysisResult> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_ANALYSIS_TIMEOUT_MS;
    let calibration = options.calibration;
    if (!calibration && options.calibrationProvider) {
      calibration = (await withTimeout(
        options.calibrationProvider(),
        timeoutMs,
        () => null
      )) || undefined;
    }
    const regions: TextRegionReadability[] = [];
    const declarations = extractedData.declarations || {};
    const declarationKeys = Object.keys(declarations) as DeclarationFieldKey[];

    let regionCounter = 1;

    const imgAspect = imageDimensions.width / Math.max(1, imageDimensions.height);
    const isLandscapePouch = imgAspect >= 1.05;
    const canonicalZones = isLandscapePouch ? CANONICAL_POUCH_ZONES : CANONICAL_BOTTLE_ZONES;

    const defaultPkgBounds = isLandscapePouch
      ? { x: 5, y: 5, width: 90, height: 90 }
      : imgAspect < 0.85
      ? { x: 22, y: 3, width: 66, height: 93 }
      : { x: 18, y: 4, width: 64, height: 92 };

    const pkgBounds = extractedData.packageBounds || defaultPkgBounds;

    // ── 1. Evaluate Mapped Statutory Declaration Fields ─────────
    for (const key of declarationKeys) {
      const decl: DeclarationField = declarations[key];
      if (!decl || !decl.value || decl.value.trim().length === 0) continue;

      const threshold = STATUTORY_THRESHOLDS[key] || DEFAULT_THRESHOLD;

      // Determine if this region is grounded by genuine optical bounding box coordinates
      const hasRealBBox = Boolean(decl.boundingBox && !decl.isInferredBbox);

      const canonicalZone = canonicalZones[key] || {
        x: isLandscapePouch ? 8 : 8,
        y: Math.min(92, 16 + regionCounter * 5.5),
        width: isLandscapePouch ? 44 : 84,
        height: 4.5,
      };

      const anchoredZone = mapZoneToPackage(canonicalZone, pkgBounds);

      let bbox: BoundingBox;
      if (decl.boundingBox && !decl.isInferredBbox) {
        const norm = decl.boundingBox.normalized;
        // Verify optical box is within packaging boundary tolerances
        const isWithinPackage =
          norm.x >= pkgBounds.x - 12 &&
          norm.x + norm.width <= pkgBounds.x + pkgBounds.width + 12 &&
          norm.width >= 4 &&
          norm.height >= 1.5;

        if (isWithinPackage) {
          bbox = decl.boundingBox;
        } else {
          bbox = {
            x0: Math.round((anchoredZone.x / 100) * imageDimensions.width),
            y0: Math.round((anchoredZone.y / 100) * imageDimensions.height),
            x1: Math.round(((anchoredZone.x + anchoredZone.width) / 100) * imageDimensions.width),
            y1: Math.round(((anchoredZone.y + anchoredZone.height) / 100) * imageDimensions.height),
            normalized: anchoredZone,
          };
        }
      } else {
        bbox = {
          x0: Math.round((anchoredZone.x / 100) * imageDimensions.width),
          y0: Math.round((anchoredZone.y / 100) * imageDimensions.height),
          x1: Math.round(((anchoredZone.x + anchoredZone.width) / 100) * imageDimensions.width),
          y1: Math.round(((anchoredZone.y + anchoredZone.height) / 100) * imageDimensions.height),
          normalized: anchoredZone,
        };
      }

      // Sample contrast from image canvas
      const contrast = await sampleImageBoundingBoxContrast(
        imageDataUrl,
        bbox.normalized,
        imageDimensions,
        timeoutMs
      );

      // Estimate font size
      const fontSize = estimateFontSizeMetrics(bbox, imageDimensions, threshold, calibration);

      // Compute OCR Confidence
      const ocrConfidence = Math.max(10, Math.min(100, decl.confidence || extractedData.confidence || 75));

      // Calculate Composite Visibility Score
      const visibilityScore = calculateVisibilityScore(contrast.contrastScore, ocrConfidence, fontSize);

      // Evaluate Defects & Status
      const evaluation = evaluateReadabilityDefects(
        ocrConfidence,
        contrast,
        fontSize,
        visibilityScore,
        threshold
      );

      regions.push({
        id: `region-decl-${key}-${regionCounter++}`,
        fieldName: decl.label || key,
        fieldKey: key,
        rawText: decl.value,
        boundingBox: bbox,
        hasOpticalBBox: hasRealBBox,
        isInferredBbox: !hasRealBBox,
        fontSize,
        ocrConfidence,
        contrast,
        visibilityScore,
        status: evaluation.status,
        flags: evaluation.flags,
        statutoryReference: threshold.statutoryRule,
        remediationAdvice: evaluation.remediationAdvice,
        category: threshold.category,
      });
    }

    // ── 2. Add Additional Line Regions if Available from Raw OCR ─
    if (regions.length < 5 && extractedData.rawText) {
      const rawLines = extractedData.rawText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 3 && !regions.some((r) => r.rawText.includes(l)));

      for (let i = 0; i < Math.min(rawLines.length, 4); i++) {
        const lineText = rawLines[i];
        const lineThreshold = DEFAULT_THRESHOLD;
        const lineZone = mapZoneToPackage(
          {
            x: 8,
            y: Math.min(92, 20 + i * 14),
            width: Math.min(84, Math.max(30, lineText.length * 2.2)),
            height: 4.8,
          },
          pkgBounds
        );
        const lineBBox: BoundingBox = {
          x0: Math.round((lineZone.x / 100) * imageDimensions.width),
          y0: Math.round((lineZone.y / 100) * imageDimensions.height),
          x1: Math.round(((lineZone.x + lineZone.width) / 100) * imageDimensions.width),
          y1: Math.round(((lineZone.y + lineZone.height) / 100) * imageDimensions.height),
          normalized: lineZone,
        };

        const contrast = await sampleImageBoundingBoxContrast(
          imageDataUrl,
          lineBBox.normalized,
          imageDimensions,
          timeoutMs
        );

        const fontSize = estimateFontSizeMetrics(lineBBox, imageDimensions, lineThreshold, calibration);
        const ocrConfidence = Math.max(45, Math.min(95, extractedData.confidence - (i % 2 === 0 ? 5 : 12)));
        const visibilityScore = calculateVisibilityScore(contrast.contrastScore, ocrConfidence, fontSize);
        const evaluation = evaluateReadabilityDefects(
          ocrConfidence,
          contrast,
          fontSize,
          visibilityScore,
          lineThreshold
        );

        regions.push({
          id: `region-line-${i + 1}`,
          fieldName: `Packaging Line ${i + 1} ("${lineText.slice(0, 20)}...")`,
          rawText: lineText,
          boundingBox: lineBBox,
          fontSize,
          ocrConfidence,
          contrast,
          visibilityScore,
          status: evaluation.status,
          flags: evaluation.flags,
          statutoryReference: lineThreshold.statutoryRule,
          remediationAdvice: evaluation.remediationAdvice,
          category: 'general_text',
        });
      }
    }

    // ── 3. Calculate Overall Readability Summary ─────────────────
    const totalRegions = regions.length;
    const compliantCount = regions.filter((r) => r.status === 'compliant').length;
    const warningCount = regions.filter((r) => r.status === 'warning').length;
    const nonCompliantCount = regions.filter((r) => r.status === 'non-compliant').length;
    const indeterminateCount = regions.filter((r) => r.status === 'indeterminate').length;
    const flaggedRegions = regions.filter((r) => r.flags.length > 0 || r.status !== 'compliant');

    const totalVisibility = regions.reduce((sum, r) => sum + r.visibilityScore, 0);
    const avgVisibilityScore = totalRegions > 0 ? Math.round(totalVisibility / totalRegions) : 0;

    const measuredRegions = regions.filter((r) => r.fontSize.measurementStatus === 'measured');
    const totalPt = measuredRegions.reduce((sum, r) => sum + r.fontSize.pt, 0);
    const avgFontSizePt = measuredRegions.length > 0 ? Math.round((totalPt / measuredRegions.length) * 10) / 10 : 0;

    const measuredContrastRegions = regions.filter((r) => r.contrast.measurementStatus === 'measured');
    const totalContrastRatio = measuredContrastRegions.reduce((sum, r) => sum + r.contrast.contrastRatio, 0);
    const avgContrastRatio = measuredContrastRegions.length > 0 ? Math.round((totalContrastRatio / measuredContrastRegions.length) * 10) / 10 : 0;

    const totalConf = regions.reduce((sum, r) => sum + r.ocrConfidence, 0);
    const avgConfidence = totalRegions > 0 ? Math.round((totalConf / totalRegions) * 10) / 10 : 0;

    // Overall Readability Score (0-100)
    let overallScore = avgVisibilityScore;
    if (nonCompliantCount > 0) {
      overallScore = Math.max(25, Math.round(overallScore - nonCompliantCount * 8));
    }

    let overallStatus: ReadabilityStatus = 'compliant';
    if (totalRegions === 0 || indeterminateCount > 0) {
      overallStatus = 'indeterminate';
    } else if (overallScore < 60 || nonCompliantCount >= 2) {
      overallStatus = 'non-compliant';
    } else if (overallScore < 80 || warningCount > 0 || nonCompliantCount === 1) {
      overallStatus = 'warning';
    }

    const summary: ReadabilitySummary = {
      overallScore,
      overallStatus,
      totalRegionsEvaluated: totalRegions,
      compliantCount,
      warningCount,
      nonCompliantCount,
      indeterminateCount,
      flaggedCount: flaggedRegions.length,
      avgFontSizePt,
      avgContrastRatio,
      avgConfidence,
      avgVisibilityScore,
    };

    return {
      scanId,
      timestamp: new Date().toISOString(),
      engineVersion: 'SatyaDrishti-Readability-5.0',
      calibration: calibration
        ? {
            status: calibration.packageHeightMm && (calibration.packageHeightPx || calibration.scaleMmPerPx)
              ? 'measured'
              : 'unavailable',
            ...calibration,
          }
        : { status: 'unavailable', reason: 'No approved physical scale calibration was supplied before the analysis deadline.' },
      imageDimensions,
      summary,
      regions,
      flaggedRegions,
    };
  }
}

/** Shared singleton instance */
export const readabilityService = new ReadabilityAnalysisEngine();
