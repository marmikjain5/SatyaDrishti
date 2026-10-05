/**
 * Multi-Angle Packaging Declaration Consolidator
 *
 * Compiles multiple angle views (Front, Back, Side, Nutritional Panel, MRP Stamp)
 * of the same product packaging into a single authoritative statutory declaration profile.
 */

import type {
  ExtractedProductData,
  DeclarationField,
  DeclarationFieldKey,
  FieldConfidence,
  LegalMetrologyCompliancePayload,
  OcrPassSummary,
  ScanAngle,
} from '../types/scan';

const DECLARATION_KEYS: DeclarationFieldKey[] = [
  'productName',
  'mrp',
  'unitSalePrice',
  'netQuantity',
  'manufacturer',
  'address',
  'importer',
  'countryOfOrigin',
  'packingDate',
  'manufacturingDate',
  'expiryDate',
  'batchNumber',
  'customerCare',
  'barcode',
];

export interface ConsolidatedMultiAngleResult {
  masterExtractedData: ExtractedProductData;
  masterConfidence: number;
  consolidatedRawText: string;
}

/**
 * Consolidates multiple angle scan outputs into a unified master product record.
 */
export function consolidateMultiAngleExtractions(
  angles: ScanAngle[],
  productTitleHint?: string
): ConsolidatedMultiAngleResult {
  if (angles.length === 0) {
    throw new Error('Cannot consolidate empty angles');
  }

  // If only 1 angle, return its data directly
  if (angles.length === 1 && angles[0].extractedData) {
    return {
      masterExtractedData: angles[0].extractedData,
      masterConfidence: angles[0].confidence,
      consolidatedRawText: angles[0].rawText,
    };
  }

  const consolidatedDeclarations: Record<DeclarationFieldKey, DeclarationField> = {} as any;
  const consolidatedFieldConfidence: Partial<FieldConfidence> = {};
  const allPassSummaries: OcrPassSummary[] = [];
  const rawTextSections: string[] = [];

  let totalConfidenceSum = 0;
  let detectedFieldsCount = 0;

  // Compile raw text from all angles
  angles.forEach((angle, idx) => {
    rawTextSections.push(`=== ${angle.label.toUpperCase()} (${angle.imageName}) ===\n${angle.rawText || ''}`);
    if (angle.extractedData?.ocrPassResults) {
      angle.extractedData.ocrPassResults.forEach((pass) => {
        allPassSummaries.push({
          ...pass,
          name: `${angle.label}: ${pass.name}`,
        });
      });
    }
  });

  const consolidatedRawText = rawTextSections.join('\n\n');

  // For each statutory declaration key, find the best extraction across all angles
  for (const key of DECLARATION_KEYS) {
    let bestField: DeclarationField | null = null;
    let bestScore = -1;
    let bestAngleLabel = '';
    let bestAngleIndex = 0;

    for (let i = 0; i < angles.length; i++) {
      const angle = angles[i];
      const field = angle.extractedData?.declarations?.[key];
      if (!field) continue;

      const val = field.value?.trim() || '';
      if (!val || val === '(Not detected)') continue;

      // Score based on confidence and non-empty quality
      const score = (field.confidence || 50) + (field.validationStatus === 'compliant' ? 20 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
        bestAngleLabel = angle.label;
        bestAngleIndex = i + 1;
      }
    }

    if (bestField && bestField.value && bestField.value.trim().length > 0) {
      consolidatedDeclarations[key] = {
        ...bestField,
        sourceAngle: bestAngleLabel,
        sourceAngleIndex: bestAngleIndex,
      };
      consolidatedFieldConfidence[key] = bestField.confidence;
      totalConfidenceSum += bestField.confidence;
      detectedFieldsCount++;
    } else {
      // Field was not found on any angle
      const sampleField = angles[0]?.extractedData?.declarations?.[key];
      const isMandatory = sampleField?.isMandatory ?? true;
      consolidatedDeclarations[key] = {
        key,
        label: sampleField?.label || key,
        value: '',
        rawValue: '',
        confidence: 0,
        sourceText: '',
        sourcePass: 'multi_angle_pass',
        sourceAngle: 'Not detected in any angle',
        boundingBox: null,
        validationStatus: isMandatory ? 'missing' : 'compliant',
        validationMessage: isMandatory ? 'Mandatory declaration missing across all scanned angles' : 'Optional',
        ruleCode: sampleField?.ruleCode || 'LM-PCR-2011',
        ruleDescription: sampleField?.ruleDescription || 'Statutory declaration requirement',
        isMandatory,
        category: sampleField?.category || 'identity',
      };
      consolidatedFieldConfidence[key] = 0;
    }
  }

  // Address & Manufacturer Cross-Fallback
  if (!consolidatedDeclarations.address?.value && consolidatedDeclarations.manufacturer?.value) {
    consolidatedDeclarations.address = {
      ...consolidatedDeclarations.manufacturer,
      key: 'address',
      label: 'Manufacturer Address',
      ruleCode: 'PCR-2011-R6(1)(d)',
      ruleDescription: 'Complete address of the manufacturer / packer with PIN code.',
      isMandatory: true,
      category: 'manufacturing',
    };
    consolidatedFieldConfidence.address = consolidatedDeclarations.manufacturer.confidence;
  }
  if (!consolidatedDeclarations.manufacturer?.value && consolidatedDeclarations.address?.value) {
    consolidatedDeclarations.manufacturer = {
      ...consolidatedDeclarations.address,
      key: 'manufacturer',
      label: 'Manufacturer Name',
      ruleCode: 'PCR-2011-R6(1)(a)',
      ruleDescription: 'Name of the manufacturer or packer.',
      isMandatory: true,
      category: 'manufacturing',
    };
    consolidatedFieldConfidence.manufacturer = consolidatedDeclarations.address.confidence;
  }

  // Calculate mandatory compliance summary
  let totalMandatory = 0;
  let compliantCount = 0;
  let warningCount = 0;
  let nonCompliantCount = 0;
  let missingCount = 0;

  for (const key of DECLARATION_KEYS) {
    const decl = consolidatedDeclarations[key];
    if (decl.isMandatory) {
      totalMandatory++;
      if (decl.validationStatus === 'compliant') compliantCount++;
      else if (decl.validationStatus === 'warning') warningCount++;
      else if (decl.validationStatus === 'non-compliant') nonCompliantCount++;
      else if (decl.validationStatus === 'missing') missingCount++;
    }
  }

  const overallConfidence =
    detectedFieldsCount > 0
      ? Math.round(totalConfidenceSum / detectedFieldsCount)
      : Math.round(angles.reduce((acc, a) => acc + a.confidence, 0) / angles.length);

  const primaryAngle = angles[0];
  const primaryDimensions = primaryAngle.extractedData?.imageDimensions || { width: 1200, height: 900 };

  const compliancePayload: LegalMetrologyCompliancePayload = {
    schemaVersion: '2.0.0',
    extractionTimestamp: new Date().toISOString(),
    engineVersion: 'SatyaDrishti-LM-Extraction-2.0',
    productMetadata: {
      imageName: `${angles.length} Angles Consolidated (${angles.map((a) => a.imageName).join(', ')})`,
      imageDimensions: primaryDimensions,
      overallConfidence,
      ocrPassesCount: allPassSummaries.length || angles.length,
    },
    declarations: consolidatedDeclarations,
    mandatorySummary: {
      totalMandatory,
      compliantCount,
      warningCount,
      nonCompliantCount,
      missingCount,
      compliancePercentage:
        totalMandatory > 0
          ? Math.round(((compliantCount + warningCount * 0.7) / totalMandatory) * 100)
          : 100,
    },
    rawOcrText: consolidatedRawText,
    ocrPassSummaries: allPassSummaries,
  };

  const masterExtractedData: ExtractedProductData = {
    productName: consolidatedDeclarations.productName?.value || productTitleHint || 'Multi-Angle Scanned Product',
    mrp: consolidatedDeclarations.mrp?.value || '',
    unitSalePrice: consolidatedDeclarations.unitSalePrice?.value || '',
    netQuantity: consolidatedDeclarations.netQuantity?.value || '',
    manufacturer: consolidatedDeclarations.manufacturer?.value || consolidatedDeclarations.address?.value || '',
    address: consolidatedDeclarations.address?.value || consolidatedDeclarations.manufacturer?.value || '',
    importer: consolidatedDeclarations.importer?.value || '',
    countryOfOrigin: consolidatedDeclarations.countryOfOrigin?.value || 'India',
    packingDate: consolidatedDeclarations.packingDate?.value || '',
    manufacturingDate: consolidatedDeclarations.manufacturingDate?.value || '',
    expiryDate: consolidatedDeclarations.expiryDate?.value || '',
    batchNumber: consolidatedDeclarations.batchNumber?.value || '',
    customerCare: consolidatedDeclarations.customerCare?.value || '',
    barcode: consolidatedDeclarations.barcode?.value || '',
    rawText: consolidatedRawText,
    confidence: overallConfidence,
    fieldConfidence: consolidatedFieldConfidence as FieldConfidence,
    declarations: consolidatedDeclarations,
    compliancePayload,
    imageDimensions: primaryDimensions,
    ocrPassResults: allPassSummaries,
    croppedImageDataUrl: angles[0]?.extractedData?.croppedImageDataUrl || undefined,
    packageBounds: angles.find((a) => a.extractedData?.packageBounds)?.extractedData?.packageBounds,
  };

  return {
    masterExtractedData,
    masterConfidence: overallConfidence,
    consolidatedRawText,
  };
}
