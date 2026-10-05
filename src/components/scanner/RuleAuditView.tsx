import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  Gavel,
  FileText,
  Search,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useScanStore } from '../../store/scanStore';
import { cn, formatCurrency } from '../../lib/utils';
import type { RuleAuditEntry } from '../../types/ruleEngine';

// ─── Status Icon ────────────────────────────────────────────────

const StatusIcon: React.FC<{ status: RuleAuditEntry['status'] }> = ({ status }) => {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
    case 'fail':
      return <XCircle className="h-4 w-4 text-red-600 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
    case 'unknown':
      return <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />;
    case 'not-applicable':
    default:
      return <MinusCircle className="h-4 w-4 text-slate-400 shrink-0" />;
  }
};

const statusLabel: Record<RuleAuditEntry['status'], string> = {
  pass: 'Pass',
  fail: 'Fail',
  warning: 'Warning',
  unknown: 'Unknown',
  'not-applicable': 'N/A',
};

const statusBadgeVariant: Record<
  RuleAuditEntry['status'],
  'success' | 'danger' | 'warning' | 'neutral'
> = {
  pass: 'success',
  fail: 'danger',
  warning: 'warning',
  unknown: 'neutral',
  'not-applicable': 'neutral',
};

// ─── Expandable Audit Row ───────────────────────────────────────

const AuditRow: React.FC<{ entry: RuleAuditEntry; index: number }> = ({ entry, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const rowBg =
    entry.status === 'fail'
      ? 'bg-red-50/20 hover:bg-red-50/40'
      : entry.status === 'warning'
      ? 'bg-amber-50/15 hover:bg-amber-50/30'
      : entry.status === 'pass'
      ? 'hover:bg-emerald-50/20'
      : 'hover:bg-slate-50';

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200/90 transition-all duration-150 overflow-hidden bg-white',
        isExpanded && 'ring-1 ring-blue-400 border-blue-300 shadow-xs'
      )}
    >
      {/* Summary Row */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full grid grid-cols-[28px_1fr_130px_90px_65px_45px] items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
          rowBg
        )}
      >
        {/* Index */}
        <span className="text-[11px] font-mono text-slate-400 text-center font-medium">
          {index + 1}
        </span>

        {/* Rule Name + Code */}
        <div className="min-w-0 pr-2">
          <p className="text-xs font-bold text-slate-900 truncate leading-snug">
            {entry.ruleName}
          </p>
          <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
            {entry.ruleCode}
          </p>
        </div>

        {/* Evidence */}
        <span className="text-[11px] text-slate-600 font-medium truncate">
          {entry.evidence.length > 25 ? `${entry.evidence.slice(0, 25)}…` : entry.evidence}
        </span>

        {/* Status Badge */}
        <Badge variant={statusBadgeVariant[entry.status]} size="sm" className="gap-1 w-fit py-0.5 px-1.5">
          <StatusIcon status={entry.status} />
          <span className="text-[10px]">{statusLabel[entry.status]}</span>
        </Badge>

        {/* Severity */}
        <Badge
          variant={
            entry.severity === 'critical'
              ? 'danger'
              : entry.severity === 'high'
              ? 'warning'
              : 'neutral'
          }
          size="sm"
          className="text-[9px] uppercase px-1.5 py-0 font-semibold"
        >
          {entry.severity}
        </Badge>

        {/* Action Column: Chevron Arrow (Always Visible) */}
        <div className="flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-blue-600" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/50">
          {/* Rule Description */}
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Rule Description
            </span>
            <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
              {entry.ruleDescription}
            </p>
          </div>

          {/* Evidence vs Expected */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                OCR Extracted Evidence
              </span>
              <p className="text-xs font-semibold text-slate-900 break-words">{entry.evidence}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                Expected Standard
              </span>
              <p className="text-xs font-semibold text-slate-900 break-words">
                {entry.expectedStandard}
              </p>
            </div>
          </div>

          {/* Recommendation */}
          {entry.recommendation && (
            <div className="flex items-start gap-2 bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5">
              <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span className="text-[11px] text-blue-800 font-medium leading-relaxed">
                {entry.recommendation}
              </span>
            </div>
          )}

          {/* Penalty + Section */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 font-mono">
              <Gavel className="h-3 w-3" />
              <span>
                Penalty: {formatCurrency(entry.penaltyRange.minFine)} –{' '}
                {formatCurrency(entry.penaltyRange.maxFine)}
                {entry.penaltyRange.imprisonmentMonths
                  ? ` / ${entry.penaltyRange.imprisonmentMonths}mo imprisonment`
                  : ''}
              </span>
            </div>
            <span className="font-mono">{entry.section}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Filter Buttons ─────────────────────────────────────────────

type FilterStatus = 'all' | 'pass' | 'fail' | 'warning' | 'unknown' | 'not-applicable';

const FILTER_OPTIONS: { key: FilterStatus; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: ClipboardCheck },
  { key: 'pass', label: 'Pass', icon: CheckCircle2 },
  { key: 'fail', label: 'Fail', icon: XCircle },
  { key: 'warning', label: 'Warning', icon: AlertTriangle },
  { key: 'unknown', label: 'Unknown', icon: HelpCircle },
  { key: 'not-applicable', label: 'N/A', icon: MinusCircle },
];

// ─── Main Component ─────────────────────────────────────────────

export const RuleAuditView: React.FC = () => {
  const { currentScan, validationResults } = useScanStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  if (
    !currentScan ||
    currentScan.status !== 'completed' ||
    !currentScan.extractedData
  ) {
    return null;
  }

  const result = validationResults[currentScan.id];
  if (!result) return null;

  // Apply filters
  let filteredAudit = result.audit;
  if (filter !== 'all') {
    filteredAudit = filteredAudit.filter((e) => e.status === filter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredAudit = filteredAudit.filter(
      (e) =>
        e.ruleName.toLowerCase().includes(q) ||
        e.ruleCode.toLowerCase().includes(q) ||
        e.ruleDescription.toLowerCase().includes(q) ||
        e.evidence.toLowerCase().includes(q)
    );
  }

  // Initial preview of only 5 rules
  const PREVIEW_LIMIT = 5;
  const displayedAudit = isRulesExpanded ? filteredAudit : filteredAudit.slice(0, PREVIEW_LIMIT);
  const remainingCount = Math.max(0, filteredAudit.length - PREVIEW_LIMIT);

  return (
    <Card className="h-full flex flex-col border border-slate-200/90 shadow-subtle bg-white">
      {/* Header */}
      <CardHeader className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
            <span>Rule Audit Trail</span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed per-rule evaluation  -  {result.audit.length} statutory rules assessed against
            OCR evidence.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" size="sm" className="font-mono text-[10px]">
            {result.passCount} Pass
          </Badge>
          <Badge variant="danger" size="sm" className="font-mono text-[10px]">
            {result.violationCount} Fail
          </Badge>
          <Badge variant="warning" size="sm" className="font-mono text-[10px]">
            {result.warningCount} Warn
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col">
        {/* Filter Bar + Search */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-0.5" />
            {FILTER_OPTIONS.map(({ key, label, icon: Icon }) => {
              const count =
                key === 'all'
                  ? result.audit.length
                  : result.audit.filter((e) => e.status === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all',
                    filter === key
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                  <span
                    className={cn(
                      'text-[9px] px-1 py-0 rounded font-mono',
                      filter === key ? 'text-blue-700 font-bold' : 'text-slate-400'
                    )}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules..."
              className="text-xs pl-8 pr-3 py-1 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="grid grid-cols-[28px_1fr_130px_90px_65px_45px] items-center gap-2.5 px-3.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
          <span className="text-center">#</span>
          <span>Rule Name / Code</span>
          <span>Evidence</span>
          <span>Status</span>
          <span>Severity</span>
          <span className="text-center">Action</span>
        </div>

        {/* Audit Rows */}
        <div className="space-y-1.5 flex-1">
          {displayedAudit.length > 0 ? (
            displayedAudit.map((entry, i) => (
              <AuditRow key={entry.ruleId} entry={entry} index={i} />
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No rules match the current filter.
            </div>
          )}
        </div>

        {/* Clean Integrated Expandable Control ("Show X more ↓" / "Show less ↑") */}
        {filteredAudit.length > PREVIEW_LIMIT && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsRulesExpanded(!isRulesExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors py-1 px-3 rounded hover:bg-blue-50"
            >
              <span>
                {isRulesExpanded ? 'Show less' : `Show ${remainingCount} more`}
              </span>
              {isRulesExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="px-5 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono mt-auto">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="h-3 w-3 text-blue-600" />
          <span>
            Showing {displayedAudit.length} of {result.audit.length} rules
          </span>
        </div>
        <span>{result.timestamp}</span>
      </CardFooter>
    </Card>
  );
};
