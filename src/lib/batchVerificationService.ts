/**
 * Historical Batch Verification & Dual MRP Detection Service
 *
 * Two pure, side-effect-free verification functions consumed by scanStore
 * immediately after every completed scan.  No external API calls, no DB writes –
 * all comparisons are performed against already-available in-memory state.
 *
 * Functions:
 *   verifyBatch   -  Checks batch number consistency across scan history.
 *   verifyMRP     -  Checks scanned MRP against the Product Directory.
 */

import type { ScanRecord, BatchVerificationResult, MRPVerificationResult } from '../types/scan';
import type { Product } from '../types/compliance';

// ─── Batch Number Verification ────────────────────────────────────────────────

/**
 * Normalises an expiry-date string for stable comparison.
 *
 * Strips all whitespace and converts to lowercase so that minor formatting
 * differences (e.g. "06/2026" vs "06 / 2026" or "June 2026") don't cause false
 * positives.
 */
function normaliseDate(raw: string): string {
  return raw.replace(/\s+/g, '').toLowerCase();
}

/**
 * Verifies the current scan's batch number against all previous completed scans
 * in the session.
 *
 * Search strategy:
 *  1. Collect all completed scans EXCEPT the current one that have a non-empty
 *     batch number.
 *  2. Find the first prior scan whose batch number matches the current one
 *     (case-insensitive, trimmed).
 *  3. Compare normalised expiry dates.
 *
 * @param currentScanId   ID of the scan just completed (excluded from lookup).
 * @param batchNumber     Batch number extracted from the current scan.
 * @param expiryDate      Expiry date extracted from the current scan.
 * @param allScans        Full scans array from scanStore (includes the current scan).
 * @returns               A `BatchVerificationResult`  -  never throws.
 */
export function verifyBatch(
  currentScanId: string,
  batchNumber: string,
  expiryDate: string,
  allScans: ScanRecord[]
): BatchVerificationResult {
  const cleanBatch = batchNumber.trim();
  const cleanExpiry = expiryDate.trim();

  // If OCR couldn't extract a batch number, skip the check.
  if (!cleanBatch || cleanBatch.length < 2) {
    return {
      batchNumber: cleanBatch || '(not detected)',
      status: 'no_previous_record',
      message: 'Batch number was not detected in the scan  -  no historical comparison possible.',
    };
  }

  // Collect prior scans that have a valid extracted batch number.
  const priorScans = allScans.filter(
    (s) =>
      s.id !== currentScanId &&
      s.status === 'completed' &&
      s.extractedData?.batchNumber &&
      s.extractedData.batchNumber.trim().length >= 2
  );

  // Find the first previous scan with a matching batch number (case-insensitive).
  const match = priorScans.find(
    (s) => s.extractedData!.batchNumber.trim().toLowerCase() === cleanBatch.toLowerCase()
  );

  if (!match) {
    return {
      batchNumber: cleanBatch,
      status: 'no_previous_record',
      currentExpiryDate: cleanExpiry || undefined,
      message: `No prior scan found with batch number "${cleanBatch}". This appears to be the first time this batch has been scanned.`,
    };
  }

  const prevExpiry = match.extractedData?.expiryDate?.trim() || '';

  // Same expiry → everything looks consistent.
  if (normaliseDate(prevExpiry) === normaliseDate(cleanExpiry)) {
    return {
      batchNumber: cleanBatch,
      status: 'verified',
      previousScanId: match.id,
      previousExpiryDate: prevExpiry,
      currentExpiryDate: cleanExpiry,
      message: `Batch number "${cleanBatch}" is consistent  -  expiry date matches the previously scanned record.`,
    };
  }

  // Different expiry → HIGH RISK
  return {
    batchNumber: cleanBatch,
    status: 'fraud_alert',
    previousScanId: match.id,
    previousExpiryDate: prevExpiry || '(not recorded)',
    currentExpiryDate: cleanExpiry || '(not detected)',
    message: `Possible Dual Expiry Fraud Detected  -  Same batch number "${cleanBatch}" found with different expiry dates. This may indicate label tampering or counterfeit packaging.`,
  };
}

// ─── MRP Verification ─────────────────────────────────────────────────────────

/**
 * Parses a raw MRP string (e.g. "₹ 240.00", "MRP Rs.240", "240") into a number.
 * Returns NaN if the string contains no numeric content.
 */
function parseMRP(raw: string): number {
  const digits = raw.replace(/[^0-9.]/g, '');
  return digits ? parseFloat(digits) : NaN;
}

/**
 * Tokenises a product name into lowercase words, filtering noise tokens.
 */
function tokenise(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Computes a simple overlap score between two product name token sets.
 * Returns a value in [0, 1] where 1 means all query tokens are present in target.
 */
function overlapScore(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const hits = queryTokens.filter((t) => targetTokens.includes(t)).length;
  return hits / queryTokens.length;
}

/** Minimum overlap score required to consider two product names a match. */
const MATCH_THRESHOLD = 0.35;

/** MRP tolerance (absolute, in ₹). Allows for minor rounding/formatting noise. */
const MRP_TOLERANCE = 2;

/**
 * Verifies the MRP extracted from the current scan against the central
 * Product Directory (complianceStore products).
 *
 * Matching strategy:
 *  1. Parse the raw scanned MRP string into a number.
 *  2. For each Product Directory entry, compute the token-overlap score between
 *     the scanned product name and the directory product title.
 *  3. Pick the directory entry with the highest overlap score that exceeds
 *     MATCH_THRESHOLD.
 *  4. Compare MRP values within MRP_TOLERANCE.
 *
 * @param scannedMRPRaw    Raw MRP string from OCR (e.g. "₹ 240").
 * @param scannedProductName  Product name string from OCR.
 * @param products         Full products array from complianceStore.
 * @returns                An `MRPVerificationResult`  -  never throws.
 */
export function verifyMRP(
  scannedMRPRaw: string,
  scannedProductName: string,
  products: Product[]
): MRPVerificationResult {
  const scannedMRP = parseMRP(scannedMRPRaw || '');

  if (isNaN(scannedMRP) || scannedMRP <= 0) {
    return {
      status: 'not_found',
      scannedMRP: 0,
      message: 'MRP could not be extracted from the scan  -  Product Directory comparison skipped.',
    };
  }

  if (!scannedProductName || scannedProductName.trim().length < 3) {
    return {
      status: 'not_found',
      scannedMRP,
      message: 'Product name not detected  -  unable to match against Product Directory.',
    };
  }

  const queryTokens = tokenise(scannedProductName);

  // Score every product in the directory.
  let bestScore = 0;
  let bestProduct: Product | null = null;

  for (const product of products) {
    const targetTokens = tokenise(product.title + ' ' + product.brand);
    const score = overlapScore(queryTokens, targetTokens);
    if (score > bestScore) {
      bestScore = score;
      bestProduct = product;
    }
  }

  if (!bestProduct || bestScore < MATCH_THRESHOLD) {
    return {
      status: 'not_found',
      scannedMRP,
      message: `No matching product found in the Product Directory for "${scannedProductName}". MRP comparison skipped.`,
    };
  }

  const directoryMRP = bestProduct.mrp;
  const difference = Math.abs(scannedMRP - directoryMRP);

  if (difference <= MRP_TOLERANCE) {
    return {
      status: 'verified',
      scannedMRP,
      directoryMRP,
      difference,
      matchedProductTitle: bestProduct.title,
      message: `MRP verified  -  scanned ₹${scannedMRP} matches Product Directory MRP ₹${directoryMRP} for "${bestProduct.title}".`,
    };
  }

  return {
    status: 'mismatch',
    scannedMRP,
    directoryMRP,
    difference,
    matchedProductTitle: bestProduct.title,
    message: `Possible Dual MRP Detected  -  Scanned MRP ₹${scannedMRP} differs from Product Directory MRP ₹${directoryMRP} (difference: ₹${difference.toFixed(2)}) for "${bestProduct.title}".`,
  };
}
