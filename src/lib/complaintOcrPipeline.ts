/**
 * Multi-Evidence OCR & Parameter Extraction Pipeline for SatyaDrishti
 *
 * Integrates directly with existing `ocrService.ts` and `fieldExtractors.ts`.
 * Ingests multi-evidence images (Packaging, Labels, Store Receipts, Invoices, Screenshots),
 * preserves original files untouched, extracts product/receipt declarations deterministically,
 * and generates bounding box annotated image previews.
 */

import { ocrService } from './ocrService';
import type { OCRResult, DeclarationField, ExtractedProductData, ScanAngle } from '../types/scan';
import type {
  EvidenceImageItem,
  EvidenceTag,
  ExtractedEvidenceSummary,
} from '../types/compliance';
import { uploadEvidenceImage } from '../services/supabaseStorageService';
import { consolidateMultiAngleExtractions } from './multiAngleConsolidator';

export interface ProcessedEvidenceInput {
  fileOrUrl: File | string;
  fileName: string;
  tag: EvidenceTag;
}

/** Regex patterns for receipt/invoice extractions */
const RECEIPT_PRICE_PATTERNS = [
  /(?:total|net\s*amt|amount|grand\s*total|paid|charged|bill\s*amount)\s*[:;.\-]?\s*(?:rs\.?|₹)?\s*([\d]+(?:[.,]\d{1,2})?)/gi,
  /(?:item\s*total|subtotal|final\s*price)\s*[:;.\-]?\s*(?:rs\.?|₹)?\s*([\d]+(?:[.,]\d{1,2})?)/gi,
  /[₹]\s*([\d]+(?:[.,]\d{1,2})?)/gi,
  /rs\.?\s*([\d]+(?:[.,]\d{1,2})?)/gi,
];

/** Extract price from store receipt text */
export function extractReceiptPrice(rawText: string): string | undefined {
  if (!rawText) return undefined;
  for (const pattern of RECEIPT_PRICE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(rawText)) !== null) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0 && num < 500000) {
        return num % 1 === 0 ? `₹${num}.00` : `₹${num.toFixed(2)}`;
      }
    }
  }
  return undefined;
}

/** Converts File or URL to Data URL string */
async function getOrConvertToDataUrl(source: File | string): Promise<string> {
  if (typeof source === 'string') return source;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(source);
  });
}

/** Generates canvas-drawn annotated preview image with bounding box highlights */
export async function createAnnotatedImageCopy(
  dataUrl: string,
  declarations: Record<string, DeclarationField>
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Draw bounding boxes for detected declarations
        const keys = Object.keys(declarations);
        let bboxCount = 0;

        for (const key of keys) {
          const decl = declarations[key];
          if (decl && decl.boundingBox && decl.value) {
            const bbox = decl.boundingBox;
            const x = bbox.x0;
            const y = bbox.y0;
            const w = bbox.x1 - bbox.x0;
            const h = bbox.y1 - bbox.y0;

            // Box style based on validation status
            const strokeColor =
              decl.validationStatus === 'compliant'
                ? '#10b981'
                : decl.validationStatus === 'warning'
                ? '#f59e0b'
                : decl.validationStatus === 'non-compliant'
                ? '#ef4444'
                : '#3b82f6';

            ctx.lineWidth = Math.max(3, Math.round(canvas.width / 300));
            ctx.strokeStyle = strokeColor;
            ctx.strokeRect(x, y, w, h);

            // Translucent fill
            ctx.fillStyle = strokeColor + '22';
            ctx.fillRect(x, y, w, h);

            // Label tag background
            const labelText = `${decl.label}: ${decl.value}`;
            ctx.font = `bold ${Math.max(12, Math.round(canvas.width / 50))}px sans-serif`;
            const textMetrics = ctx.measureText(labelText);
            const textWidth = textMetrics.width + 12;
            const textHeight = Math.max(18, Math.round(canvas.width / 40));

            ctx.fillStyle = strokeColor;
            ctx.fillRect(x, Math.max(0, y - textHeight), textWidth, textHeight);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, x + 6, Math.max(textHeight - 4, y - 4));

            bboxCount++;
          }
        }

        if (bboxCount === 0) {
          return resolve(dataUrl);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Executes multi-evidence OCR processing using SatyaDrishti's existing OCR service.
 */
export async function processMultiEvidenceImages(
  inputs: ProcessedEvidenceInput[],
  onProgress?: (percent: number, status: string) => void
): Promise<{
  evidenceImages: EvidenceImageItem[];
  consolidatedSummary: ExtractedEvidenceSummary;
  allRawText: string;
  masterExtractedData?: ExtractedProductData;
}> {
  const evidenceImages: EvidenceImageItem[] = [];
  const angles: ScanAngle[] = [];
  let consolidatedSummary: ExtractedEvidenceSummary = {
    extractionConfidence: 0,
  };
  let totalRawText = '';
  let totalConfidenceSum = 0;
  const count = inputs.length;

  for (let i = 0; i < count; i++) {
    const item = inputs[i];
    const stepLabel = `Processing Evidence ${i + 1}/${count} (${item.tag})...`;
    onProgress?.(Math.round(((i) / count) * 80) + 5, stepLabel);

    const originalDataUrl = await getOrConvertToDataUrl(item.fileOrUrl);

    // Call existing ocrService
    let ocrRes: OCRResult;
    try {
      ocrRes = await ocrService.recognize(originalDataUrl, (p, msg) => {
        const overallP = Math.round(((i + p / 100) / count) * 80) + 5;
        onProgress?.(overallP, `${stepLabel}: ${msg}`);
      });
    } catch (err) {
      ocrRes = {
        rawText: '',
        confidence: 0,
        extractedData: {
          productName: '',
          mrp: '',
          unitSalePrice: '',
          netQuantity: '',
          manufacturer: '',
          address: '',
          importer: '',
          countryOfOrigin: '',
          packingDate: '',
          manufacturingDate: '',
          expiryDate: '',
          batchNumber: '',
          customerCare: '',
          barcode: '',
          rawText: '',
          confidence: 0,
          fieldConfidence: {} as any,
          declarations: {} as any,
          compliancePayload: {} as any,
          imageDimensions: { width: 800, height: 600 },
          ocrPassResults: [],
        },
      };
    }

    totalConfidenceSum += ocrRes.confidence;
    totalRawText += `\n--- Evidence ${i + 1}: ${item.tag} (${item.fileName}) ---\n${ocrRes.rawText}\n`;

    // Track as angle for multi-angle consolidation engine
    angles.push({
      id: `ev-angle-${Date.now()}-${i}`,
      angleIndex: i + 1,
      label: item.tag,
      imageName: item.fileName,
      imageDataUrl: originalDataUrl,
      extractedData: ocrRes.extractedData,
      confidence: ocrRes.confidence,
      rawText: ocrRes.rawText,
    });

    const declarations = (ocrRes.extractedData.declarations || {}) as Record<string, DeclarationField>;
    const detectedBBoxesCount = Object.keys(declarations).filter(
      (k) => declarations[k]?.boundingBox !== null
    ).length;

    // Generate annotated preview copy while leaving original intact
    const annotatedUrl = await createAnnotatedImageCopy(originalDataUrl, declarations);

    // Upload images to Supabase Storage for persistent public URLs
    const [persistentOriginalUrl, persistentAnnotatedUrl] = await Promise.all([
      uploadEvidenceImage(originalDataUrl, `original-${item.fileName}`),
      annotatedUrl
        ? uploadEvidenceImage(annotatedUrl, `annotated-${item.fileName}`)
        : Promise.resolve(undefined as string | undefined),
    ]);

    evidenceImages.push({
      id: `ev-img-${Date.now()}-${i}`,
      originalUrl: persistentOriginalUrl,
      annotatedUrl: persistentAnnotatedUrl,
      fileName: item.fileName,
      tag: item.tag,
      uploadedAt: new Date().toISOString(),
      ocrConfidence: ocrRes.confidence,
      extractedRawText: ocrRes.rawText,
      detectedBBoxesCount,
    });

    // Consolidate Extracted Parameters
    const ext = ocrRes.extractedData;
    if (ext.productName && !consolidatedSummary.productName) consolidatedSummary.productName = ext.productName;
    if (ext.mrp && !consolidatedSummary.declaredMrp) consolidatedSummary.declaredMrp = ext.mrp;
    if (ext.netQuantity && !consolidatedSummary.netQuantity) consolidatedSummary.netQuantity = ext.netQuantity;
    if (ext.manufacturer && !consolidatedSummary.manufacturer) consolidatedSummary.manufacturer = ext.manufacturer;
    if (ext.importer && !consolidatedSummary.importer) consolidatedSummary.importer = ext.importer;
    if (ext.customerCare && !consolidatedSummary.customerCare) consolidatedSummary.customerCare = ext.customerCare;
    if (ext.packingDate && !consolidatedSummary.packingDate) consolidatedSummary.packingDate = ext.packingDate;
    if (ext.expiryDate && !consolidatedSummary.expiryDate) consolidatedSummary.expiryDate = ext.expiryDate;

    // Check for receipt price extraction if tagged as Receipt/Invoice or text contains receipt markers
    if (item.tag === 'Receipt / Invoice' || /receipt|bill|invoice|total|paid/i.test(ocrRes.rawText)) {
      const receiptVal = extractReceiptPrice(ocrRes.rawText);
      if (receiptVal) {
        consolidatedSummary.receiptPrice = receiptVal;
      }
    }
  }

  // Consolidate all evidence images using the same multi-angle consolidation algorithm as ProductScanner
  let masterExtractedData: ExtractedProductData | undefined = undefined;
  if (angles.length > 0) {
    const consolidated = consolidateMultiAngleExtractions(angles, inputs[0]?.fileName);
    masterExtractedData = consolidated.masterExtractedData;

    // Update consolidatedSummary with the authoritative consolidated declarations
    if (masterExtractedData.productName) consolidatedSummary.productName = masterExtractedData.productName;
    if (masterExtractedData.mrp) consolidatedSummary.declaredMrp = masterExtractedData.mrp;
    if (masterExtractedData.netQuantity) consolidatedSummary.netQuantity = masterExtractedData.netQuantity;
    if (masterExtractedData.manufacturer) consolidatedSummary.manufacturer = masterExtractedData.manufacturer;
    if (masterExtractedData.importer) consolidatedSummary.importer = masterExtractedData.importer;
    if (masterExtractedData.customerCare) consolidatedSummary.customerCare = masterExtractedData.customerCare;
    if (masterExtractedData.packingDate) consolidatedSummary.packingDate = masterExtractedData.packingDate;
    if (masterExtractedData.expiryDate) consolidatedSummary.expiryDate = masterExtractedData.expiryDate;
    if (masterExtractedData.barcode) consolidatedSummary.barcode = masterExtractedData.barcode;
  }

  // Calculate overcharge amount if both packaging MRP and receipt price are found
  if (consolidatedSummary.declaredMrp && consolidatedSummary.receiptPrice) {
    const pkgNum = parseFloat(consolidatedSummary.declaredMrp.replace(/[^0-9.]/g, ''));
    const rcpNum = parseFloat(consolidatedSummary.receiptPrice.replace(/[^0-9.]/g, ''));
    if (!isNaN(pkgNum) && !isNaN(rcpNum) && rcpNum > pkgNum) {
      consolidatedSummary.priceOverchargeAmount = Math.round((rcpNum - pkgNum) * 100) / 100;
    }
  }

  consolidatedSummary.extractionConfidence = count > 0 ? Math.round(totalConfidenceSum / count) : 0;

  onProgress?.(90, 'Consolidating Evidence Parameters & Annotations...');

  return {
    evidenceImages,
    consolidatedSummary,
    allRawText: totalRawText,
    masterExtractedData,
  };
}
