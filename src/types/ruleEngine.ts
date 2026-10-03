/**
 * Rule Engine Types for Legal Metrology Compliance Validation
 *
 * Consumed by: ruleEngineService.ts, ComplianceResultsPanel, RuleAuditView
 * Data source: legalMetrologyRules.ts (mock, future RAG-replaceable)
 */

import type { DeclarationFieldKey } from './scan';
import type { ViolationSeverity } from './compliance';

/** A single Legal Metrology rule definition */
export interface LegalMetrologyRule {
  id: string;
  ruleCode: string;
  act: string;
  section: string;
  fieldKey: DeclarationFieldKey;
  title: string;
  description: string;
  severity: ViolationSeverity;
  isMandatory: boolean;
  /** Whether this rule is conditionally applicable (e.g. importer only for imports) */
  isConditional: boolean;
  /** Human-readable condition description when isConditional = true */
  conditionDescription: string;
  /** Which validator function name to dispatch in the engine */
  validatorKey: string;
  penaltyRange: {
    minFine: number;
    maxFine: number;
    imprisonmentMonths?: number;
  };
  recommendations: string[];
}

/** Result of validating a single rule against product data */
export interface RuleAuditEntry {
  ruleId: string;
  ruleName: string;
  ruleDescription: string;
  ruleCode: string;
  section: string;
  fieldKey: DeclarationFieldKey;
  status: 'pass' | 'fail' | 'warning' | 'unknown' | 'not-applicable';
  severity: ViolationSeverity;
  /** The OCR-extracted value used as evidence */
  evidence: string;
  /** What the rule expects */
  expectedStandard: string;
  /** Actionable remediation suggestion */
  recommendation: string;
  /** Penalty range from rule definition */
  penaltyRange: {
    minFine: number;
    maxFine: number;
    imprisonmentMonths?: number;
  };
}

/** Complete validation result for one product scan */
export interface ComplianceValidationResult {
  id: string;
  timestamp: string;
  scanId: string;
  overallStatus: 'compliant' | 'non-compliant' | 'warning' | 'under-review';
  complianceScore: number; // 0–100
  violationCount: number;
  warningCount: number;
  passCount: number;
  notApplicableCount: number;
  unknownCount?: number;
  rulePack?: {
    id: string;
    version: string;
    effectiveFrom: string;
    citationSource: string;
    approvalState: 'approved' | 'draft' | 'superseded';
  };
  missingDeclarations: string[];
  audit: RuleAuditEntry[];
  recommendations: string[];
}
