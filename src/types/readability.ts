/**
 * SatyaDrishti Font Size & Readability Analysis Types (Feature 4)
 *
 * Comprehensive types for OCR Bounding Box evaluation, Font Size estimation,
 * Luminance & Contrast analysis, Visibility scoring, and Statutory Readability compliance.
 *
 * Statutory References:
 * - Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 9 & Schedule II: Minimum Height of Numerals & Letters)
 * - ISO/IEC 15415 & WCAG 2.1 Contrast Standards for Packaging
 */

import type { BoundingBox, DeclarationFieldKey } from './scan';

export type ReadabilityStatus = 'compliant' | 'warning' | 'non-compliant' | 'indeterminate';

export type MeasurementStatus = 'measured' | 'unavailable' | 'timed-out';

export type ReadabilityFlag =
  | 'LOW_CONFIDENCE'
  | 'LOW_CONTRAST'
  | 'POOR_VISIBILITY'
  | 'BELOW_MIN_FONT_SIZE'
  | 'BACKGROUND_NOISE'
  | 'UNEVEN_ILLUMINATION';

export interface FontSizeMetrics {
  /** Estimated font size in points (pt) */
  pt: number;
  /** Estimated font height in millimeters (mm) */
  mm: number;
  /** Bounding box height in original image pixels (px) */
  px: number;
  /** Relative height as percentage of image height (0-100%) */
  relativeHeightPercent: number;
  /** Statutory minimum required font size in pt for this field category */
  minThresholdPt: number;
  /** Statutory minimum required font size in mm for this field category */
  minThresholdMm: number;
  /** Whether the estimated font size is below the statutory threshold */
  isBelowThreshold: boolean;
  /** Whether a calibrated physical scale was available for this measurement */
  measurementStatus?: MeasurementStatus;
  /** Calibration method used, when measured */
  calibrationMethod?: string;
  /** Human-readable formatted string, e.g. "8.5 pt (2.3 mm)" */
  formatted: string;
}

export interface ContrastMetrics {
  /** Contrast score mapped to 0–100% scale */
  contrastScore: number;
  /** WCAG 2.1 Contrast Ratio (1.0 to 21.0) e.g. 4.5 for 4.5:1 */
  contrastRatio: number;
  /** Estimated relative luminance of text foreground (0.0 to 1.0) */
  foregroundLuminance: number;
  /** Estimated relative luminance of background surrounding area (0.0 to 1.0) */
  backgroundLuminance: number;
  /** Whether contrast falls below minimum legibility standards (< 40% or ratio < 3.0:1) */
  isLowContrast: boolean;
  /** Formatted contrast ratio string, e.g. "5.2:1" */
  formattedRatio: string;
  /** Whether the image could be sampled successfully */
  measurementStatus?: MeasurementStatus;
  /** Reason when the optical measurement is unavailable */
  failureReason?: string;
}

export interface TextRegionReadability {
  /** Unique identifier for the region */
  id: string;
  /** Display label for the field or text line */
  fieldName: string;
  /** Mapped statutory declaration field key if applicable */
  fieldKey?: DeclarationFieldKey;
  /** Recognized raw text snippet */
  rawText: string;
  /** Bounding box coordinates mapped to image */
  boundingBox: BoundingBox;
  /** Estimated font size metrics */
  fontSize: FontSizeMetrics;
  /** Tesseract OCR confidence (0–100%) */
  ocrConfidence: number;
  /** Optical contrast metrics */
  contrast: ContrastMetrics;
  /** Composite visibility score (0–100%) */
  visibilityScore: number;
  /** Readability compliance status */
  status: ReadabilityStatus;
  /** Specific flagged defects */
  flags: ReadabilityFlag[];
  /** Statutory reference citation */
  statutoryReference: string;
  /** Actionable remediation guidance */
  remediationAdvice: string;
  /** Category of text region */
  category: 'statutory_declaration' | 'barcode' | 'general_text' | 'branding';
}

export interface ReadabilitySummary {
  /** Overall Readability Score (0–100) */
  overallScore: number;
  /** Overall Readability Status */
  overallStatus: ReadabilityStatus;
  /** Total text regions evaluated */
  totalRegionsEvaluated: number;
  /** Count of compliant text regions */
  compliantCount: number;
  /** Count of warning text regions */
  warningCount: number;
  /** Count of non-compliant text regions */
  nonCompliantCount: number;
  /** Count of regions that could not be determined from available evidence */
  indeterminateCount?: number;
  /** Total count of flagged problematic text regions */
  flaggedCount: number;
  /** Average estimated font size in pt */
  avgFontSizePt: number;
  /** Average optical contrast ratio */
  avgContrastRatio: number;
  /** Average OCR recognition confidence */
  avgConfidence: number;
  /** Average composite visibility score */
  avgVisibilityScore: number;
}

export interface ReadabilityAnalysisResult {
  /** Associated scan identifier */
  scanId: string;
  /** Analysis generation timestamp */
  timestamp: string;
  /** Engine version */
  engineVersion: 'SatyaDrishti-Readability-4.0' | 'SatyaDrishti-Readability-5.0';
  /** Physical-scale calibration used by this analysis, if any */
  calibration?: {
    status: MeasurementStatus;
    method?: string;
    packageWidthMm?: number;
    packageHeightMm?: number;
    packageWidthPx?: number;
    packageHeightPx?: number;
    uncertaintyMm?: number;
    reason?: string;
  };
  /** Original image dimensions */
  imageDimensions: { width: number; height: number };
  /** Overall summary metrics */
  summary: ReadabilitySummary;
  /** Detailed readability breakdown for all evaluated regions */
  regions: TextRegionReadability[];
  /** Filtered list of problematic / flagged regions requiring remediation */
  flaggedRegions: TextRegionReadability[];
}
