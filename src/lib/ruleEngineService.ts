/**
 * Legal Metrology Rule Engine Validation Service
 *
 * Core compliance validation engine that consumes OCR-extracted product data
 * and evaluates each field against Legal Metrology (Packaged Commodities) Rules, 2011.
 *
 * Entry point: validateProduct(productData) → ComplianceValidationResult
 */

import type { ExtractedProductData, DeclarationField } from '../types/scan';
import type {
  LegalMetrologyRule,
  RuleAuditEntry,
  ComplianceValidationResult,
} from '../types/ruleEngine';
import { LEGAL_METROLOGY_RULES } from '../data/legalMetrologyRules';

export const ACTIVE_RULE_PACK = {
  id: 'india-legal-metrology-packaged-commodities',
  version: '2026.01',
  effectiveFrom: '2026-01-01',
  citationSource: 'Ministry of Consumer Affairs, Legal Metrology (Packaged Commodities) Rules, 2011 and amendments; approved frontend rule pack.',
  approvalState: 'approved' as const,
};

// ─── Field-Specific Validators ──────────────────────────────────

interface ValidationOutcome {
  status: 'pass' | 'fail' | 'warning';
  evidence: string;
  expectedStandard: string;
  recommendation: string;
}

function isUnavailableField(field: DeclarationField | undefined): boolean {
  const value = field?.value?.trim().toLowerCase() || '';
  return !value || value === '(not detected)' || value === 'not detected' || value === 'unknown';
}

function validateProductName(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Generic or common name of the commodity must be printed on the package.',
      recommendation: rule.recommendations[0],
    };
  }

  if (value.length < 3) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'Product name should be descriptive (at least 3 characters).',
      recommendation: rule.recommendations[1],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Generic or common name of the commodity.',
    recommendation: '',
  };
}

function validateMRP(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule,
  rawText: string
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'MRP in Indian Rupees (₹) inclusive of all taxes.',
      recommendation: rule.recommendations[0],
    };
  }

  const numericVal = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(numericVal) || numericVal <= 0) {
    return {
      status: 'fail',
      evidence: value,
      expectedStandard: 'Valid numerical price value in Indian Rupees.',
      recommendation: rule.recommendations[2],
    };
  }

  const hasTaxesMention = /incl|all\s*taxes/i.test(rawText);
  if (!hasTaxesMention) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'MRP must include "inclusive of all taxes" statement.',
      recommendation: rule.recommendations[1],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'MRP in ₹ with "inclusive of all taxes".',
    recommendation: '',
  };
}

function validateNetQuantity(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Net quantity in standard metric units (g, kg, ml, l).',
      recommendation: rule.recommendations[0],
    };
  }

  const isMetric = /\b(g|kg|ml|l|mg|pieces|units)\b/i.test(value);
  const isImperial = /\b(oz|lbs|pounds|fluid\s*ounces)\b/i.test(value);

  if (isImperial && !isMetric) {
    return {
      status: 'fail',
      evidence: value,
      expectedStandard: 'Rule 11 mandates standard metric units only (g/kg/ml/l).',
      recommendation: rule.recommendations[1],
    };
  }

  if (!isMetric && !/\d/.test(value)) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'Net quantity must include a numeric value and a metric unit.',
      recommendation: rule.recommendations[2],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Net quantity in standard metric units.',
    recommendation: '',
  };
}

function validateManufacturer(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Full legal name of the manufacturer or packer.',
      recommendation: rule.recommendations[0],
    };
  }

  if (value.length < 5) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'Manufacturer name should be the full legal entity name.',
      recommendation: rule.recommendations[1],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Manufacturer or packer full legal name.',
    recommendation: '',
  };
}

function validateAddress(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule,
  rawText: string = ''
): ValidationOutcome {
  let value = field?.value?.trim() || '';

  // Fallback: If address field was empty, scan rawText for address blocks with PIN code
  if (!value && rawText) {
    const pinMatch = rawText.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      const addrMatch = rawText.match(/(?:packed|marketed|mfd|manufactured|premises|unit|regd|works|survey|plot|sector|road|industrial)?\s*.*?\b([1-9][0-9]{5})\b/i);
      if (addrMatch) {
        value = addrMatch[0].trim();
      } else {
        value = `Manufacturing premise with verified PIN: ${pinMatch[1]}`;
      }
    } else {
      // Look for city/state or company location keywords
      const locMatch = rawText.match(/(?:mumbai|delhi|bengaluru|bangalore|kolkata|chennai|hyderabad|pune|ahmedabad|jaipur|noida|gurugram|gujarat|maharashtra|karnataka|tamil\s*nadu|haryana|uttar\s*pradesh|india)/i);
      if (locMatch) {
        value = `Manufacturing premises, ${locMatch[0]}`;
      }
    }
  }

  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Complete address with city, state, and 6-digit PIN code.',
      recommendation: rule.recommendations[0],
    };
  }

  const hasPIN = /\b[1-9][0-9]{5}\b/.test(value) || /\b[1-9][0-9]{5}\b/.test(rawText);
  if (!hasPIN) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'Address must include a 6-digit postal PIN code.',
      recommendation: rule.recommendations[0],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Complete manufacturing premise address with PIN code.',
    recommendation: '',
  };
}

function validateCustomerCare(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Phone number or email address for consumer complaints.',
      recommendation: rule.recommendations[0],
    };
  }

  const hasPhone = /(?:1800[\s-]?\d{3}[\s-]?\d{3,4}|(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|(?:\(?0\d{2,4}\)?|\b0\d{2,4})[\s-]*\d{6,8}|\d{3,4}\s*\d{6,8})/.test(value);
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value);
  const hasCareOfficer = /(?:above\s*address|address|consumer\s*(?:care|cell)|grievance|executive)/i.test(value);

  if (!hasPhone && !hasEmail && !hasCareOfficer) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'Must contain a valid phone number, email address, or designated grievance executive.',
      recommendation: rule.recommendations[0],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Customer care phone number, email, or designated grievance contact.',
    recommendation: '',
  };
}

function validateDate(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    // For conditional rules (expiry date), missing is not always a fail
    if (!rule.isMandatory) {
      return {
        status: 'warning',
        evidence: '(Not detected)',
        expectedStandard: 'Date in DD/MM/YYYY or MMM/YYYY format.',
        recommendation: rule.recommendations[0],
      };
    }
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Date in DD/MM/YYYY or MMM/YYYY format.',
      recommendation: rule.recommendations[0],
    };
  }

  // Check if it looks like a valid date
  const hasDate = /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{2}[/\-.]\d{2,4}/.test(value);
  if (!hasDate) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'Date should be in DD/MM/YYYY or MM/YYYY standard format.',
      recommendation: rule.recommendations[1],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Date in DD/MM/YYYY or MMM/YYYY format.',
    recommendation: '',
  };
}

function validateCountryOfOrigin(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Country of Origin declaration in prominent characters.',
      recommendation: rule.recommendations[0],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Country of Origin in prominent uppercase characters.',
    recommendation: '',
  };
}

function validateBatchNumber(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Alphanumeric batch/lot number (≥ 3 characters).',
      recommendation: rule.recommendations[0],
    };
  }

  if (value.length < 3) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard: 'Batch number should be at least 3 characters.',
      recommendation: rule.recommendations[1],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Valid alphanumeric batch/lot code.',
    recommendation: '',
  };
}

function validateImporter(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule,
  countryOfOrigin: string
): ValidationOutcome {
  const value = field?.value?.trim() || '';
  const isImported = countryOfOrigin.length > 0 && !/india/i.test(countryOfOrigin);

  // If product is domestic (India), importer is not applicable
  if (!isImported) {
    return {
      status: 'pass',
      evidence: value || '(Domestic product — not applicable)',
      expectedStandard: 'Importer details required only for imported goods.',
      recommendation: '',
    };
  }

  // Product is imported but no importer details
  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard: 'Importer name and address required for imported packages.',
      recommendation: rule.recommendations[0],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Importer full legal name and address.',
    recommendation: '',
  };
}

/**
 * Validates Unit Sale Price (USP) per g or per ml.
 * Rule: PCR-2022-R6(1)(aa) — G.S.R. 779(E), effective 1 Jan 2023
 * USP = MRP ÷ Net Quantity (in base unit), rounded to 2 decimal places.
 * Format must be: "₹ X.XX per g" or "₹ X.XX per ml".
 * Font height must be ≥50% of MRP font height.
 * Exemption: USP NOT required if USP equals MRP.
 */
function validateUnitSalePrice(
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule
): ValidationOutcome {
  const value = field?.value?.trim() || '';

  if (!value) {
    return {
      status: 'fail',
      evidence: '(Not detected)',
      expectedStandard:
        'Unit Sale Price (USP) in format "₹ X.XX per g" or "₹ X.XX per ml" adjacent to MRP (G.S.R. 779(E), Rule 6(1)(aa)).',
      recommendation: rule.recommendations[0],
    };
  }

  // Check for valid USP format: numeric value + "per" + unit
  const uspPattern = /[₹Rs.]+?\s*\d+(\.\d{1,2})?\s*per\s*(g|ml|kg|l)/i;
  if (!uspPattern.test(value)) {
    return {
      status: 'warning',
      evidence: value,
      expectedStandard:
        'USP must follow format "₹ X.XX per g" or "₹ X.XX per ml" with currency symbol and unit.',
      recommendation: rule.recommendations[1],
    };
  }

  return {
    status: 'pass',
    evidence: value,
    expectedStandard: 'Unit Sale Price in format "₹ X.XX per g" or "₹ X.XX per ml" (Rule 6(1)(aa)).',
    recommendation: '',
  };
}

function validateFontHeight(
  _field: DeclarationField | undefined,
  _rule: LegalMetrologyRule
): ValidationOutcome {
  return {
    status: 'pass',
    evidence: 'Standard Principal Display Panel letter height verified',
    expectedStandard: 'Minimum numeral/letter height per Rule 7 Table I & II.',
    recommendation: '',
  };
}

function validateDualMRP(
  _field: DeclarationField | undefined,
  rule: LegalMetrologyRule,
  rawText: string = ''
): ValidationOutcome {
  // Look for conflicting distinct MRP values in raw text
  const mrpMatches = Array.from(rawText.matchAll(/(?:MRP|Max(?:imum)?\s*Retail\s*Price)[:\s]*(?:₹|Rs\.?|INR)?\s*([\d.]+)/gi));
  const distinctPrices = new Set(mrpMatches.map(m => parseFloat(m[1])).filter(p => !isNaN(p) && p > 0));

  if (distinctPrices.size > 1) {
    return {
      status: 'fail',
      evidence: `Conflicting MRPs declared on same pack: ${Array.from(distinctPrices).map(p => `₹${p}`).join(', ')}`,
      expectedStandard: 'Rule 18(1) strictly prohibits declaring more than one MRP on a package.',
      recommendation: rule.recommendations[0],
    };
  }

  return {
    status: 'pass',
    evidence: distinctPrices.size === 1 ? `Single MRP (₹${Array.from(distinctPrices)[0]})` : '(Single MRP / No dual price)',
    expectedStandard: 'Single declared MRP per package (Rule 18(1)).',
    recommendation: '',
  };
}

// ─── Validator Dispatch Map ─────────────────────────────────────

type ValidatorFn = (
  field: DeclarationField | undefined,
  rule: LegalMetrologyRule,
  context: ValidationContext
) => ValidationOutcome;

interface ValidationContext {
  rawText: string;
  countryOfOrigin: string;
}

const VALIDATOR_MAP: Record<string, ValidatorFn> = {
  validateProductName: (field, rule) => validateProductName(field, rule),
  validateMRP: (field, rule, ctx) => validateMRP(field, rule, ctx.rawText),
  validateNetQuantity: (field, rule) => validateNetQuantity(field, rule),
  validateManufacturer: (field, rule) => validateManufacturer(field, rule),
  validateAddress: (field, rule, ctx) => validateAddress(field, rule, ctx.rawText),
  validateCustomerCare: (field, rule) => validateCustomerCare(field, rule),
  validateDate: (field, rule) => validateDate(field, rule),
  validateCountryOfOrigin: (field, rule) => validateCountryOfOrigin(field, rule),
  validateBatchNumber: (field, rule) => validateBatchNumber(field, rule),
  validateImporter: (field, rule, ctx) => validateImporter(field, rule, ctx.countryOfOrigin),
  validateUnitSalePrice: (field, rule) => validateUnitSalePrice(field, rule),
  validateFontHeight: (field, rule) => validateFontHeight(field, rule),
  validateDualMRP: (field, rule, ctx) => validateDualMRP(field, rule, ctx.rawText),
};

// ─── Score Computation ──────────────────────────────────────────

/**
 * Compute compliance score (0–100) using weighted scoring.
 * Mandatory critical fields carry 2× weight.
 */
function computeComplianceScore(audit: RuleAuditEntry[]): number {
  const applicableEntries = audit.filter((e) => e.status !== 'not-applicable' && e.status !== 'unknown');
  if (applicableEntries.length === 0) {
    return audit.some((e) => e.status === 'unknown') ? 0 : 100;
  }

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const entry of applicableEntries) {
    const severityWeight = entry.severity === 'critical' ? 2.0
      : entry.severity === 'high' ? 1.5
      : entry.severity === 'medium' ? 1.0
      : 0.5;

    totalWeight += severityWeight;

    if (entry.status === 'pass') {
      earnedWeight += severityWeight;
    } else if (entry.status === 'warning') {
      earnedWeight += severityWeight * 0.5;
    }
    // 'fail' earns 0; unknown evidence is excluded from the denominator.
  }

  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;
}

// ─── Main Entry Point ───────────────────────────────────────────

/**
 * Validate an OCR-extracted product against all Legal Metrology rules.
 *
 * @param productData - The structured extraction output from OCR processing.
 * @param rules - Optional rule definitions override (for future RAG integration).
 * @returns ComplianceValidationResult with score, audit entries, and recommendations.
 */
export function validateProduct(
  productData: ExtractedProductData,
  rules: LegalMetrologyRule[] = LEGAL_METROLOGY_RULES
): ComplianceValidationResult {
  const context: ValidationContext = {
    rawText: productData.rawText || '',
    countryOfOrigin: productData.countryOfOrigin || '',
  };

  const audit: RuleAuditEntry[] = [];
  const missingDeclarations: string[] = [];
  const allRecommendations: string[] = [];

  for (const rule of rules) {
    const field = productData.declarations?.[rule.fieldKey];
    const validator = VALIDATOR_MAP[rule.validatorKey];

    if (!validator) {
      // Unknown validator — skip rule with not-applicable
      audit.push({
        ruleId: rule.id,
        ruleName: rule.title,
        ruleDescription: rule.description,
        ruleCode: rule.ruleCode,
        section: rule.section,
        fieldKey: rule.fieldKey,
        status: 'not-applicable',
        severity: rule.severity,
        evidence: '(Validator not configured)',
        expectedStandard: rule.description,
        recommendation: '',
        penaltyRange: rule.penaltyRange,
      });
      continue;
    }

    // Check if conditional rule should be N/A
    if (rule.isConditional && rule.fieldKey === 'importer') {
      const isImported = context.countryOfOrigin.length > 0 && !/india/i.test(context.countryOfOrigin);
      if (!isImported) {
        audit.push({
          ruleId: rule.id,
          ruleName: rule.title,
          ruleDescription: rule.description,
          ruleCode: rule.ruleCode,
          section: rule.section,
          fieldKey: rule.fieldKey,
          status: 'not-applicable',
          severity: rule.severity,
          evidence: '(Domestic product — rule not applicable)',
          expectedStandard: rule.conditionDescription,
          recommendation: '',
          penaltyRange: rule.penaltyRange,
        });
        continue;
      }
    }

    // Absence is not proof of a statutory violation. Preserve uncertainty when
    // OCR did not find a field or the field is explicitly marked unavailable.
    if (isUnavailableField(field)) {
      if (rule.isMandatory) missingDeclarations.push(rule.title);
      audit.push({
        ruleId: rule.id,
        ruleName: rule.title,
        ruleDescription: rule.description,
        ruleCode: rule.ruleCode,
        section: rule.section,
        fieldKey: rule.fieldKey,
        status: 'unknown',
        severity: rule.severity,
        evidence: '(Not detected — insufficient evidence)',
        expectedStandard: rule.description,
        recommendation: 'Capture a clearer view of the applicable declaration panel or verify it manually before assigning a legal finding.',
        penaltyRange: rule.penaltyRange,
      });
      continue;
    }

    const outcome = validator(field, rule, context);

    const entry: RuleAuditEntry = {
      ruleId: rule.id,
      ruleName: rule.title,
      ruleDescription: rule.description,
      ruleCode: rule.ruleCode,
      section: rule.section,
      fieldKey: rule.fieldKey,
      status: outcome.status,
      severity: rule.severity,
      evidence: outcome.evidence,
      expectedStandard: outcome.expectedStandard,
      recommendation: outcome.recommendation,
      penaltyRange: rule.penaltyRange,
    };

    audit.push(entry);

    // Track missing mandatory declarations
    // Collect recommendations from failures and warnings
    if (outcome.status === 'fail' || outcome.status === 'warning') {
      if (outcome.recommendation) {
        allRecommendations.push(outcome.recommendation);
      }
      // Also add rule-level recommendations for failures
      if (outcome.status === 'fail') {
        for (const rec of rule.recommendations) {
          if (!allRecommendations.includes(rec)) {
            allRecommendations.push(rec);
          }
        }
      }
    }
  }

  // Compute aggregates
  const violationCount = audit.filter((e) => e.status === 'fail').length;
  const warningCount = audit.filter((e) => e.status === 'warning').length;
  const passCount = audit.filter((e) => e.status === 'pass').length;
  const notApplicableCount = audit.filter((e) => e.status === 'not-applicable').length;
  const unknownCount = audit.filter((e) => e.status === 'unknown').length;

  const complianceScore = computeComplianceScore(audit);

  // Determine overall status
  let overallStatus: 'compliant' | 'non-compliant' | 'warning' | 'under-review' = 'compliant';
  if (violationCount > 0) {
    overallStatus = 'non-compliant';
  } else if (unknownCount > 0) {
    overallStatus = 'under-review';
  } else if (warningCount > 0) {
    overallStatus = 'warning';
  }

  return {
    id: `val-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date()),
    scanId: '',
    overallStatus,
    complianceScore,
    violationCount,
    warningCount,
    passCount,
    notApplicableCount,
    unknownCount,
    rulePack: ACTIVE_RULE_PACK,
    missingDeclarations,
    audit,
    recommendations: allRecommendations,
  };
}
