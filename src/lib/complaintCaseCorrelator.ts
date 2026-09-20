/**
 * End-to-End Evidence-Backed Complaint Case Correlator for SatyaDrishti
 *
 * Combines:
 * 1. Consumer free-text input & evidence images
 * 2. Existing multi-pass OCR & Statutory Extraction Pipeline (`ocrService.ts`, `fieldExtractors.ts`)
 * 3. Deterministic Complaint Classification Engine (`complaintClassifier.ts`)
 * 4. Existing SatyaDrishti Regulatory RAG System (`ragKnowledgeService.ts`)
 * 5. Four-way Case Correlation & Government Officer Dossier Synthesis
 *
 * NO LLM IS USED IN THIS FLOW.
 * AUTOMATIC LEGAL VIOLATION DECLARATIONS ARE STRICTLY PROHIBITED.
 */

import { classifyComplaintText } from './complaintClassifier';
import { processMultiEvidenceImages, ProcessedEvidenceInput } from './complaintOcrPipeline';
import { queryRegulatoryRAG } from './ragKnowledgeService';
import { validateProduct } from './ruleEngineService';
import type { ExtractedProductData } from '../types/scan';
import type {
  Complaint,
  EvidenceImageItem,
  ExtractedEvidenceSummary,
  ComplaintClassificationResult,
  RegulatoryMappingResult,
  CaseCorrelationSummary,
  OfficerDecisionRecord,
  PlatformType,
  ScannerDiscrepancyItem,
  RegulatoryMappingItem,
  SupportedLanguage,
  ShopLocation,
} from '../types/compliance';

export interface ComplaintSubmissionInput {
  language?: SupportedLanguage;
  consumerName: string;
  consumerEmail: string;
  consumerPhone?: string;
  productName?: string;  // optional — derived from shop context when not set
  brand?: string;
  platform?: PlatformType;
  productUrl?: string;
  orderNumber?: string;
  description: string;
  evidenceInputs: ProcessedEvidenceInput[];
  /** Physical shop selected via Google Maps Places */
  shopLocation?: ShopLocation;
}

/**
 * Correlates consumer claim, multi-evidence OCR extractions, label discrepancy scanning, and Regulatory RAG context.
 */
export async function buildEvidenceBackedComplaintCase(
  input: ComplaintSubmissionInput,
  onProgress?: (percent: number, status: string) => void
): Promise<Complaint> {
  // Step 1: Execute OCR & Evidence Extraction Pipeline on uploaded images
  onProgress?.(10, 'Step 1/4: Ingesting & running OCR on evidence images...');

  let ocrOut: {
    evidenceImages: EvidenceImageItem[];
    consolidatedSummary: ExtractedEvidenceSummary;
    allRawText: string;
    masterExtractedData?: ExtractedProductData;
  } = {
    evidenceImages: [],
    consolidatedSummary: { extractionConfidence: 0 },
    allRawText: '',
  };

  if (input.evidenceInputs && input.evidenceInputs.length > 0) {
    ocrOut = await processMultiEvidenceImages(input.evidenceInputs, (p, msg) => {
      onProgress?.(10 + Math.round(p * 0.4), msg);
    });
  }

  // Step 2: Deterministic Complaint Classification for User Claims
  onProgress?.(55, 'Step 2/4: Classifying User Claims & Scanning Package Label...');

  const classification: ComplaintClassificationResult = classifyComplaintText(
    input.description,
    {
      packagingMrp: ocrOut.consolidatedSummary.declaredMrp,
      receiptPrice: ocrOut.consolidatedSummary.receiptPrice,
    }
  );

  // Run Label Rule Engine Validation on extracted OCR data (detecting missing MRP, net qty, address, importer, etc.)
  const extractedProductData: ExtractedProductData = ocrOut.masterExtractedData || {
    productName: input.productName || input.shopLocation?.name || 'Physical Retail Purchase',
    mrp: ocrOut.consolidatedSummary.declaredMrp || '',
    unitSalePrice: '',
    netQuantity: ocrOut.consolidatedSummary.netQuantity || '',
    manufacturer: ocrOut.consolidatedSummary.manufacturer || input.brand || '',
    address: ocrOut.consolidatedSummary.manufacturer || '',
    importer: ocrOut.consolidatedSummary.importer || '',
    countryOfOrigin: '',
    packingDate: ocrOut.consolidatedSummary.packingDate || '',
    manufacturingDate: '',
    expiryDate: ocrOut.consolidatedSummary.expiryDate || '',
    batchNumber: '',
    customerCare: ocrOut.consolidatedSummary.customerCare || '',
    barcode: ocrOut.consolidatedSummary.barcode || '',
    rawText: ocrOut.allRawText,
    confidence: (ocrOut.consolidatedSummary.extractionConfidence || 85) / 100,
    fieldConfidence: {} as any,
    declarations: {} as any,
    compliancePayload: {} as any,
    imageDimensions: { width: 800, height: 600 },
    ocrPassResults: [],
  };

  // Ensure user-supplied product name or brand backfills if OCR didn't detect them
  if ((!extractedProductData.productName || extractedProductData.productName === 'Physical Retail Purchase') && input.productName) {
    extractedProductData.productName = input.productName;
  }
  if (!extractedProductData.manufacturer && input.brand) {
    extractedProductData.manufacturer = input.brand;
  }

  const validationResult = validateProduct(extractedProductData);

  // Step 3: Query Regulatory RAG for User Claim AND Scanner-Detected Label Issues
  onProgress?.(75, 'Step 3/4: Querying Regulatory RAG for User Claim & Label Discrepancies...');

  // A. Query RAG for primary user claim
  const userClaimRagQueryText = `${classification.categoryLabel} ${input.description} ${input.productName} ${ocrOut.allRawText}`;
  const userClaimRagResult = queryRegulatoryRAG({
    queryText: userClaimRagQueryText,
    productCategory: 'all',
    evaluationDate: new Date().toISOString().split('T')[0],
  });

  const matchedRegulatoryItems: RegulatoryMappingItem[] = userClaimRagResult.matchedChunks.slice(0, 3).map((chunk) => {
    const activeRule = userClaimRagResult.activeRules.find((r) => r.code === chunk.ruleCode);
    return {
      ruleCode: chunk.ruleCode,
      title: chunk.title,
      authority: chunk.authority,
      actName: chunk.title,
      section: chunk.section,
      officialGazetteRef: chunk.officialGazetteRef,
      effectiveDate: chunk.effectiveDate,
      activeVersion: activeRule ? activeRule.activeVersion : 1,
      verbatimClause: chunk.verbatimClause || chunk.content,
      penalties: chunk.penalties || { minFine: 10000, maxFine: 50000 },
      relevanceScore: chunk.relevanceScore,
    };
  });

  // B. Process Scanner-Detected Label Discrepancies & Query RAG for each
  const scannerDetectedDiscrepancies: ScannerDiscrepancyItem[] = [];

  validationResult.audit
    .filter((a) => a.status === 'fail' || a.status === 'warning')
    .forEach((auditEntry) => {
      const discRagQuery = `${input.productName} ${auditEntry.ruleName} ${auditEntry.ruleCode} ${auditEntry.evidence}`;
      const discRagRes = queryRegulatoryRAG({
        queryText: discRagQuery,
        productCategory: 'all',
        evaluationDate: new Date().toISOString().split('T')[0],
      });

      const topChunk = discRagRes.matchedChunks[0];
      let ragMapping: RegulatoryMappingItem | undefined = undefined;

      if (topChunk) {
        ragMapping = {
          ruleCode: topChunk.ruleCode,
          title: topChunk.title,
          authority: topChunk.authority,
          actName: topChunk.title,
          section: topChunk.section,
          officialGazetteRef: topChunk.officialGazetteRef,
          effectiveDate: topChunk.effectiveDate,
          activeVersion: 1,
          verbatimClause: topChunk.verbatimClause || topChunk.content,
          penalties: topChunk.penalties || { minFine: auditEntry.penaltyRange.minFine, maxFine: auditEntry.penaltyRange.maxFine },
          relevanceScore: topChunk.relevanceScore,
        };

        // Add to main regulatory mapping items if not already present
        if (!matchedRegulatoryItems.some((m) => m.ruleCode === ragMapping!.ruleCode)) {
          matchedRegulatoryItems.push(ragMapping);
        }
      }

      scannerDetectedDiscrepancies.push({
        ruleCode: auditEntry.ruleCode,
        ruleName: auditEntry.ruleName,
        ruleDescription: auditEntry.ruleDescription,
        fieldKey: auditEntry.fieldKey,
        status: auditEntry.status,
        evidence: auditEntry.evidence,
        expectedStandard: auditEntry.expectedStandard,
        ragMapping,
      });
    });

  const regulatoryMappingResult: RegulatoryMappingResult = {
    queryUsed: `${classification.categoryLabel} + ${scannerDetectedDiscrepancies.length} scanner label issues`,
    evaluationDate: userClaimRagResult.evaluationDate,
    matchedRules: matchedRegulatoryItems,
    provenanceSource: 'SatyaDrishti Hybrid Regulatory RAG & Rule Versioning System',
    legalFindingDeclared: false,
  };

  // Step 4: Synthesize Four-Way Case Correlation
  onProgress?.(90, 'Step 4/4: Assembling Evidence-Backed Case Dossier for Officer Review...');

  const topRuleCode = matchedRegulatoryItems.length > 0 ? matchedRegulatoryItems[0].ruleCode : 'Legal Metrology PCR Rules';
  const topRuleSection = matchedRegulatoryItems.length > 0 ? matchedRegulatoryItems[0].section : 'Rule 6 Declarations';
  const aiMatchedRule = `${topRuleSection} (${topRuleCode})`;

  const complainantAllegation = input.description;
  let ocrEvidenceExtracted = `Extracted ${ocrOut.evidenceImages.length} evidence image(s).`;
  if (ocrOut.consolidatedSummary.declaredMrp) {
    ocrEvidenceExtracted += ` Packaging MRP: ${ocrOut.consolidatedSummary.declaredMrp}.`;
  }
  if (ocrOut.consolidatedSummary.receiptPrice) {
    ocrEvidenceExtracted += ` Receipt Charged Price: ${ocrOut.consolidatedSummary.receiptPrice}.`;
  }
  if (ocrOut.consolidatedSummary.priceOverchargeAmount) {
    ocrEvidenceExtracted += ` Price Overcharge: +₹${ocrOut.consolidatedSummary.priceOverchargeAmount}.`;
  }

  if (scannerDetectedDiscrepancies.length > 0) {
    ocrEvidenceExtracted += ` Scanner detected ${scannerDetectedDiscrepancies.length} additional label discrepancy(s).`;
  }

  let assignedInspector = 'Inspector Arjun Nair (Bengaluru City Zone 1)';
  if (input.shopLocation?.name) {
    assignedInspector = `Inspector Arjun Nair (${input.shopLocation.name} Zonal Metrology)`;
  } else if (input.platform && ['Blinkit', 'Zepto', 'Instamart', 'Swiggy', 'Amazon', 'Flipkart'].includes(input.platform)) {
    assignedInspector = `Inspector Arjun Nair (${input.platform} Enforcement Cell)`;
  }

  const initialOfficerRecord: OfficerDecisionRecord = {
    id: `odr-${Date.now()}`,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    officerName: 'SatyaSetu Automated Enforcement Engine',
    action: 'ASSIGN_INSPECTION',
    actionLabel: 'Assigned Zonal Metrology Officer for On-Site Inspection',
    notes: `Automated Inspection Directive: Multi-evidence OCR & statutory rule engine verified consumer grievance and label discrepancy (${scannerDetectedDiscrepancies.length} issues detected). Automatically assigned to ${assignedInspector} for on-site physical inspection.`,
    assignedInspector,
  };

  const caseCorrelationSummary: CaseCorrelationSummary = {
    complainantAllegation,
    ocrEvidenceExtracted,
    regulatoryMappingSummary: `Mapped primary claim & ${scannerDetectedDiscrepancies.length} scanner-detected label issues to ${matchedRegulatoryItems.length} active statutory rule(s) via Regulatory RAG. Top reference: ${aiMatchedRule}.`,
    verificationStatus: 'Assigned for Inspection',
  };

  const ticketId = `NCH-GRV-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const complaint: Complaint = {
    id: `CMP-${Date.now()}`,
    ticketId,
    language: input.language || 'en',
    consumerName: input.consumerName,
    consumerEmail: input.consumerEmail,
    consumerPhone: input.consumerPhone || '',
    productName: input.productName || input.shopLocation?.name || 'Physical Retail Purchase',
    brand: input.brand || 'Unspecified Brand',
    platform: input.platform || (input.shopLocation ? 'Direct' : 'Direct') as PlatformType,
    productUrl: input.productUrl,
    orderNumber: input.orderNumber || `OD-${Math.floor(100000 + Math.random() * 900000)}`,
    category: classification.categoryLabel,
    categoryCode: classification.categoryCode,
    description: input.description,
    evidenceUrls: ocrOut.evidenceImages.map((e) => e.originalUrl),
    evidenceImages: ocrOut.evidenceImages,
    extractedEvidenceSummary: ocrOut.consolidatedSummary,
    classificationResult: classification,
    regulatoryMappingResult,
    caseCorrelationSummary,
    officerDecisionHistory: [initialOfficerRecord],
    assignedOfficer: assignedInspector,
    status: 'Assigned for Inspection',
    priority: classification.confidenceScore > 80 || scannerDetectedDiscrepancies.length > 2 ? 'Urgent' : 'High',
    submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    sentimentScore: Math.round((0.7 + (classification.confidenceScore / 100) * 0.28) * 100) / 100,
    aiMatchedRule,
    needsReview: false,
    scannerDetectedDiscrepancies,
    shopLocation: input.shopLocation,
  };

  onProgress?.(100, 'Complaint Case Dossier Successfully Built & Automatically Assigned for Inspection');
  return complaint;
}
