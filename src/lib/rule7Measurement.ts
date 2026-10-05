/**
 * Rule 7 Measurement Engine
 *
 * Implements Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 7 & Table-I:
 * Minimum height of letters and numerals on declarations.
 *
 * Physical calibration is done using a reference object (₹10 coin = 27.0 mm diameter,
 * RBI-confirmed) placed in frame alongside the product. This converts pixel measurements
 * to real-world millimetres.
 */

// ─── Table-I: Net Quantity → Minimum Letter Height (mm) ─────────
// Source: Legal Metrology (Packaged Commodities) Rules, 2011, Rule 7, Table-I

export interface TableIBand {
  label: string;
  /** Upper bound in grams / ml (Infinity = no upper bound) */
  maxGrams: number;
  minHeightMm: number;
  clause: string;
}

export const RULE7_TABLE_I: TableIBand[] = [
  {
    label: '≤ 50 g or 50 ml',
    maxGrams: 50,
    minHeightMm: 1.0,
    clause: 'Rule 7, Table-I, Row 1',
  },
  {
    label: '50 g – 200 g or 50 ml – 200 ml',
    maxGrams: 200,
    minHeightMm: 2.0,
    clause: 'Rule 7, Table-I, Row 2',
  },
  {
    label: '200 g – 1 kg or 200 ml – 1 L',
    maxGrams: 1000,
    minHeightMm: 4.0,
    clause: 'Rule 7, Table-I, Row 3',
  },
  {
    label: '> 1 kg or > 1 L',
    maxGrams: Infinity,
    minHeightMm: 6.0,
    clause: 'Rule 7, Table-I, Row 4',
  },
];

// ─── Reference Object Dimensions (mm) ───────────────────────────

export type ReferenceObjectType = 'coin_10' | 'coin_5' | 'id_card' | 'ean_barcode' | 'none';

export const REFERENCE_OBJECT_DIMS: Record<ReferenceObjectType, { widthMm: number; heightMm: number; label: string }> = {
  coin_10: {
    widthMm: 27.0,
    heightMm: 27.0,
    label: '₹10 Coin (27.0 mm diameter, RBI-confirmed)',
  },
  coin_5: {
    widthMm: 25.0,
    heightMm: 25.0,
    label: '₹5 Coin (25.0 mm diameter, RBI-confirmed)',
  },
  id_card: {
    widthMm: 85.6,
    heightMm: 54.0,
    label: 'Standard ID Card / Credit Card (ISO/IEC 7810 ID-1)',
  },
  ean_barcode: {
    widthMm: 37.29,
    heightMm: 25.93,
    label: 'EAN-13 Barcode Module (standard reference size)',
  },
  none: {
    widthMm: 0,
    heightMm: 0,
    label: 'None (no reference object in frame)',
  },
};

// ─── Calibration ─────────────────────────────────────────────────

export interface CoinBounds {
  /** Pixel x of the left edge of the reference object */
  x0: number;
  /** Pixel y of the top edge */
  y0: number;
  /** Pixel x of the right edge */
  x1: number;
  /** Pixel y of the bottom edge */
  y1: number;
}

export interface CalibrationResult {
  /** Reference object used */
  referenceType: ReferenceObjectType;
  /** Pixels per millimetre (horizontal) */
  pxPerMmX: number;
  /** Pixels per millimetre (vertical) */
  pxPerMmY: number;
  /** Average px/mm used for letter height */
  pxPerMm: number;
  /** Measured width of reference object in pixels */
  refWidthPx: number;
  /** Measured height of reference object in pixels */
  refHeightPx: number;
  /** Real-world width of reference in mm */
  refWidthMm: number;
  /** Real-world height of reference in mm */
  refHeightMm: number;
}

/**
 * Compute calibration from a user-drawn bounding box around a known reference object.
 */
export function calibrateFromBounds(
  bounds: CoinBounds,
  referenceType: ReferenceObjectType
): CalibrationResult | null {
  if (referenceType === 'none') return null;

  const refWidthPx = Math.abs(bounds.x1 - bounds.x0);
  const refHeightPx = Math.abs(bounds.y1 - bounds.y0);

  if (refWidthPx < 5 || refHeightPx < 5) return null;

  const dims = REFERENCE_OBJECT_DIMS[referenceType];
  const pxPerMmX = refWidthPx / dims.widthMm;
  const pxPerMmY = refHeightPx / dims.heightMm;
  const pxPerMm = (pxPerMmX + pxPerMmY) / 2;

  return {
    referenceType,
    pxPerMmX,
    pxPerMmY,
    pxPerMm,
    refWidthPx,
    refHeightPx,
    refWidthMm: dims.widthMm,
    refHeightMm: dims.heightMm,
  };
}

// ─── Net Quantity Parsing ─────────────────────────────────────────

/**
 * Parse net quantity string to grams or ml.
 * Returns null if unrecognisable.
 */
export function parseNetQuantityToGrams(netQty: string): number | null {
  if (!netQty) return null;

  const clean = netQty.trim().toLowerCase();

  // Match number + unit
  const match = clean.match(/^([\d.,]+)\s*(kg|g|gm|gms|mg|l|ltr|litre|litres|liter|liters|ml|cc|pieces?|pcs|units?)/);
  if (!match) return null;

  const value = parseFloat(match[1].replace(',', '.'));
  if (isNaN(value)) return null;

  const unit = match[2];

  switch (unit) {
    case 'kg': return value * 1000;
    case 'g':
    case 'gm':
    case 'gms': return value;
    case 'mg': return value / 1000;
    case 'l':
    case 'ltr':
    case 'litre':
    case 'litres':
    case 'liter':
    case 'liters': return value * 1000;
    case 'ml':
    case 'cc': return value;
    case 'piece':
    case 'pieces':
    case 'pcs':
    case 'unit':
    case 'units': return value; // treat as grams equivalent for table lookup
    default: return null;
  }
}

/**
 * Look up the minimum letter height for a given net quantity (in grams/ml).
 */
export function getMinLetterHeightMm(grams: number): TableIBand {
  for (const band of RULE7_TABLE_I) {
    if (grams <= band.maxGrams) return band;
  }
  return RULE7_TABLE_I[RULE7_TABLE_I.length - 1];
}

// ─── Measurement Result ───────────────────────────────────────────

export type Rule7Verdict = 'PASS' | 'FAIL' | 'REVIEW_REQUIRED' | 'INSUFFICIENT_EVIDENCE';

export interface Rule7FieldMeasurement {
  fieldName: string;
  rawText: string;
  heightPx: number;
  heightMm: number;
  minRequiredMm: number;
  tableBand: TableIBand;
  verdict: Rule7Verdict;
  verdictReason: string;
  /** Was this measurement calibrated (true) or pixel-relative estimate (false) */
  isCalibrated: boolean;
}

export interface Rule7MeasurementResult {
  calibration: CalibrationResult | null;
  netQuantityRaw: string;
  netQuantityGrams: number | null;
  tableBand: TableIBand | null;
  fieldMeasurements: Rule7FieldMeasurement[];
  overallVerdict: Rule7Verdict;
  overallVerdictReason: string;
  clauseReference: string;
}

/**
 * Run Rule 7 measurement over OCR bounding boxes.
 *
 * @param calibration - from calibrateFromBounds(), or null if no reference object
 * @param netQuantityRaw - the extracted net quantity string
 * @param ocrLines - array of {text, bbox: {x0,y0,x1,y1}, confidence} from Tesseract
 * @param imageDimensions - original image width/height in pixels
 */
export function measureRule7Compliance(
  calibration: CalibrationResult | null,
  netQuantityRaw: string,
  ocrLines: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; confidence: number }>,
  imageDimensions: { width: number; height: number }
): Rule7MeasurementResult {
  const netQuantityGrams = parseNetQuantityToGrams(netQuantityRaw);
  const tableBand = netQuantityGrams !== null ? getMinLetterHeightMm(netQuantityGrams) : null;

  // Without calibration, we can only estimate relatively
  const isCalibrated = calibration !== null && calibration.pxPerMm > 0;

  if (!netQuantityGrams || !tableBand) {
    return {
      calibration,
      netQuantityRaw,
      netQuantityGrams: null,
      tableBand: null,
      fieldMeasurements: [],
      overallVerdict: 'INSUFFICIENT_EVIDENCE',
      overallVerdictReason: 'Net quantity could not be parsed — Table-I band is unknown. Cannot determine minimum letter height.',
      clauseReference: 'Rule 7, Legal Metrology (Packaged Commodities) Rules, 2011',
    };
  }

  // Focus on key statutory declaration lines (top candidates by confidence + text length)
  const candidateLines = ocrLines
    .filter((l) => l.text.trim().length >= 2 && l.confidence > 40)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20);

  const fieldMeasurements: Rule7FieldMeasurement[] = candidateLines.map((line) => {
    const heightPx = Math.abs(line.bbox.y1 - line.bbox.y0);

    let heightMm: number;
    if (isCalibrated) {
      heightMm = heightPx / calibration!.pxPerMm;
    } else {
      // Rough estimate: assume typical label image is ~150mm tall
      const estimatedLabelHeightMm = 150;
      heightMm = (heightPx / imageDimensions.height) * estimatedLabelHeightMm;
    }

    const minRequiredMm = tableBand.minHeightMm;
    let verdict: Rule7Verdict;
    let verdictReason: string;

    if (!isCalibrated) {
      // No reference object — can only give an estimate
      if (heightMm < minRequiredMm * 0.5) {
        verdict = 'FAIL';
        verdictReason = `Estimated height ~${heightMm.toFixed(1)} mm — well below minimum ${minRequiredMm} mm. Place a ₹10 coin in frame for exact measurement.`;
      } else {
        verdict = 'REVIEW_REQUIRED';
        verdictReason = `Estimated ~${heightMm.toFixed(1)} mm (uncalibrated). Minimum required: ${minRequiredMm} mm. Place a ₹10 coin in frame for a confirmed measurement.`;
      }
    } else if (heightMm >= minRequiredMm) {
      verdict = 'PASS';
      verdictReason = `Letter height ${heightMm.toFixed(2)} mm ≥ minimum ${minRequiredMm} mm for ${tableBand.label}. Compliant with ${tableBand.clause}.`;
    } else {
      verdict = 'FAIL';
      verdictReason = `Letter height ${heightMm.toFixed(2)} mm < minimum ${minRequiredMm} mm required for ${tableBand.label}. Violation of ${tableBand.clause}.`;
    }

    return {
      fieldName: line.text.trim().substring(0, 40),
      rawText: line.text.trim(),
      heightPx,
      heightMm: Math.round(heightMm * 100) / 100,
      minRequiredMm,
      tableBand,
      verdict,
      verdictReason,
      isCalibrated,
    };
  });

  // Overall verdict: worst across all fields
  const hasFail = fieldMeasurements.some((m) => m.verdict === 'FAIL');
  const hasReview = fieldMeasurements.some((m) => m.verdict === 'REVIEW_REQUIRED');
  const hasInsufficient = fieldMeasurements.some((m) => m.verdict === 'INSUFFICIENT_EVIDENCE');

  let overallVerdict: Rule7Verdict;
  let overallVerdictReason: string;

  if (hasFail) {
    const failCount = fieldMeasurements.filter((m) => m.verdict === 'FAIL').length;
    overallVerdict = 'FAIL';
    overallVerdictReason = `${failCount} text region(s) fall below the minimum letter height of ${tableBand.minHeightMm} mm required for ${tableBand.label}. This is a potential violation of ${tableBand.clause}.`;
  } else if (hasInsufficient) {
    overallVerdict = 'INSUFFICIENT_EVIDENCE';
    overallVerdictReason = 'Net quantity unknown — Table-I minimum cannot be determined.';
  } else if (hasReview || !isCalibrated) {
    overallVerdict = 'REVIEW_REQUIRED';
    overallVerdictReason = isCalibrated
      ? 'Some regions require officer review. Measurements are calibrated but outcomes are borderline.'
      : 'Measurements are estimates only (no reference object in frame). Place a ₹10 coin alongside the product and re-scan for confirmed compliance.';
  } else {
    overallVerdict = 'PASS';
    overallVerdictReason = `All evaluated text regions meet the minimum ${tableBand.minHeightMm} mm letter height requirement for ${tableBand.label}.`;
  }

  return {
    calibration,
    netQuantityRaw,
    netQuantityGrams,
    tableBand,
    fieldMeasurements,
    overallVerdict,
    overallVerdictReason,
    clauseReference: `${tableBand.clause} — Legal Metrology (Packaged Commodities) Rules, 2011`,
  };
}
