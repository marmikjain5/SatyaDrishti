import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  XCircle,
  Gavel,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useScanStore } from '../../store/scanStore';
import { useReportStore } from '../../store/reportStore';
import { reportService } from '../../lib/reportService';
import { ComplianceReportModal } from './ComplianceReportModal';
import { cn, formatCurrency } from '../../lib/utils';
import type { RuleAuditEntry } from '../../types/ruleEngine';
import type { ComplianceInspectionReport, ReportGenerationOptions } from '../../types/report';

// ─── Main Component ─────────────────────────────────────────────

export const ComplianceResultsPanel: React.FC = () => {
  const { currentScan, validationResults, readabilityResults } = useScanStore();
  const { addReport } = useReportStore();

  const [showAllViolations, setShowAllViolations] = useState(false);
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [expandedViolationIds, setExpandedViolationIds] = useState<Record<string, boolean>>({});
  const [activeReport, setActiveReport] = useState<ComplianceInspectionReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (
    !currentScan ||
    currentScan.status !== 'completed' ||
    !currentScan.extractedData
  ) {
    return null;
  }

  const result = validationResults[currentScan.id];
  if (!result) return null;

  const violations = result.audit.filter((e) => e.status === 'fail');
  const warnings = result.audit.filter((e) => e.status === 'warning');

  // Preview limits matching reference design (5 violations, 2 warnings, 6 missing in 2x3 grid)
  const VIOLATIONS_PREVIEW = 5;
  const WARNINGS_PREVIEW = 2;
  const MISSING_PREVIEW = 6;

  const displayedViolations = showAllViolations
    ? violations
    : violations.slice(0, VIOLATIONS_PREVIEW);

  const displayedWarnings = showAllWarnings
    ? warnings
    : warnings.slice(0, WARNINGS_PREVIEW);

  const displayedMissing = showAllMissing
    ? result.missingDeclarations
    : result.missingDeclarations.slice(0, MISSING_PREVIEW);

  const remainingMissingCount = Math.max(0, result.missingDeclarations.length - MISSING_PREVIEW);

  const toggleViolationExpand = (ruleId: string) => {
    setExpandedViolationIds((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const statusConfig = {
    compliant: {
      label: 'COMPLIANT',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    'non-compliant': {
      label: 'NON-COMPLIANT',
      badgeClass: 'bg-red-50 text-red-600 border-red-200',
    },
    warning: {
      label: 'NEEDS ATTENTION',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    'under-review': {
      label: 'UNDER REVIEW',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  }[result.overallStatus];

  return (
    <Card className="h-full flex flex-col border border-slate-200/90 shadow-subtle bg-white">
      {/* 1. Header with Shield Icon & Top-Right Overall Status Badge */}
      <CardHeader className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg border border-blue-200 bg-blue-50/60 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase block leading-none">
              LEGAL METROLOGY
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Compliance Validation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Overall compliance evaluation against applicable rules.
            </p>
          </div>
        </div>

        {/* Top-Right Status Badge & Report Action */}
        <div className="flex items-center flex-wrap gap-2 shrink-0 self-start">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const readResult = readabilityResults[currentScan.id] || currentScan.readabilityResult;
              const rep = reportService.generateComplianceReport(currentScan, result, readResult);
              addReport(rep);
              setActiveReport(rep);
              setIsReportModalOpen(true);
            }}
            className="text-xs h-8 sm:h-7 min-h-[36px] sm:min-h-[28px] gap-1 border-slate-200"
          >
            <FileCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Generate Report</span>
          </Button>

          <span
            className={cn(
              'px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wider',
              statusConfig.badgeClass
            )}
          >
            {statusConfig.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5 flex-1 flex flex-col">
        {/* 2. Top Score & Metrics Card (Matching Reference Design) */}
        <div className="border border-slate-200/90 rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          {/* Left: Score with Progress Bar */}
          <div className="min-w-[140px]">
            <span className="text-xs text-slate-500 font-medium block">
              Compliance Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                {result.complianceScore}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-mono">
                / 100
              </span>
            </div>
            {/* Blue Progress Bar under score */}
            <div className="h-1.5 w-full sm:w-36 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${result.complianceScore}%` }}
              />
            </div>
          </div>

          {/* Right: 4 Metrics with subtle vertical dividers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0 sm:divide-x divide-slate-100 text-center flex-1 max-w-full sm:max-w-sm sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="px-2">
              <span className="text-lg font-bold font-mono text-red-600 block leading-none">
                {result.violationCount}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-1">
                Violations
              </span>
            </div>

            <div className="px-2">
              <span className="text-lg font-bold font-mono text-amber-500 block leading-none">
                {result.warningCount}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-1">
                Warnings
              </span>
            </div>

            <div className="px-2">
              <span className="text-lg font-bold font-mono text-emerald-600 block leading-none">
                {result.passCount}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-1">
                Compliant
              </span>
            </div>

            <div className="px-2">
              <span className="text-lg font-bold font-mono text-slate-500 block leading-none">
                {result.notApplicableCount}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-1">
                N/A
              </span>
            </div>
          </div>
        </div>

        {/* 3. Violations Section */}
        {violations.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <h4 className="text-xs font-bold text-slate-900">
                  Violations ({violations.length})
                </h4>
              </div>
              {violations.length > VIOLATIONS_PREVIEW && (
                <button
                  onClick={() => setShowAllViolations(!showAllViolations)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {showAllViolations ? 'Show less' : `Show all ${violations.length}`}
                </button>
              )}
            </div>

            {/* Violation Rows (Matching Reference Design) */}
            <div className="space-y-2">
              {displayedViolations.map((v) => {
                const isExpanded = !!expandedViolationIds[v.ruleId];

                return (
                  <div
                    key={v.ruleId}
                    className="border border-slate-200/90 rounded-lg p-3 hover:border-slate-300 transition-all bg-white cursor-pointer"
                    onClick={() => toggleViolationExpand(v.ruleId)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {v.ruleName}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {v.ruleCode}
                          </p>
                        </div>
                      </div>

                      <div className="text-slate-400 hover:text-slate-600 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {/* Expandable Details Container */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <p className="leading-relaxed">{v.ruleDescription}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                              OCR Evidence
                            </span>
                            <span className="font-semibold text-slate-800">{v.evidence}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                              Expected Standard
                            </span>
                            <span className="font-semibold text-slate-800">{v.expectedStandard}</span>
                          </div>
                        </div>

                        {v.recommendation && (
                          <div className="flex items-start gap-1.5 bg-blue-50/60 border border-blue-100 rounded p-2 text-[11px]">
                            <span className="text-blue-900 leading-snug">{v.recommendation}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500 font-mono">
                          <Gavel className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>
                            Penalty: {formatCurrency(v.penaltyRange.minFine)} – {formatCurrency(v.penaltyRange.maxFine)}
                            {v.penaltyRange.imprisonmentMonths
                              ? ` / ${v.penaltyRange.imprisonmentMonths} months imprisonment`
                              : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Warnings Section */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <h4 className="text-xs font-bold text-slate-900">
                  Warnings ({warnings.length})
                </h4>
              </div>
              {warnings.length > WARNINGS_PREVIEW && (
                <button
                  onClick={() => setShowAllWarnings(!showAllWarnings)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {showAllWarnings ? 'Show less' : `Show all ${warnings.length}`}
                </button>
              )}
            </div>

            {/* Warning Items (Matching Reference Design) */}
            <div className="space-y-1.5">
              {displayedWarnings.map((w) => (
                <div
                  key={w.ruleId}
                  className="flex items-center justify-between gap-2.5 rounded-lg border border-amber-100 bg-amber-50/30 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate text-xs">
                      {w.ruleName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {w.ruleCode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Missing Mandatory Declarations Section */}
        {result.missingDeclarations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <h4 className="text-xs font-bold text-slate-900">
                  Missing Mandatory Declarations ({result.missingDeclarations.length})
                </h4>
              </div>
              {result.missingDeclarations.length > MISSING_PREVIEW && (
                <button
                  onClick={() => setShowAllMissing(!showAllMissing)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {showAllMissing ? 'Show less' : `Show all ${result.missingDeclarations.length}`}
                </button>
              )}
            </div>

            {/* 2-Column Grid (Matching Reference Design) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayedMissing.map((decl) => (
                <div
                  key={decl}
                  className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50/25 px-3 py-2"
                >
                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate">{decl}</span>
                </div>
              ))}
            </div>

            {/* + X more missing mandatory declarations link */}
            {!showAllMissing && remainingMissingCount > 0 && (
              <button
                onClick={() => setShowAllMissing(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 pt-0.5 block transition-colors"
              >
                + {remainingMissingCount} more missing mandatory declarations
              </button>
            )}
          </div>
        )}
      </CardContent>

      {/* Compliance Inspection Report Modal */}
      {activeReport && (
        <ComplianceReportModal
          report={activeReport}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onRegenerate={(opts) => {
            const readResult = readabilityResults[currentScan.id] || currentScan.readabilityResult;
            const updated = reportService.generateComplianceReport(currentScan, result, readResult, opts);
            addReport(updated);
            setActiveReport(updated);
          }}
        />
      )}
    </Card>
  );
};
