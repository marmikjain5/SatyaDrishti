/**
 * HistoricalIntelligencePanel.tsx
 *
 * Premium Historical Batch Verification & Dual MRP Detection panel.
 * Renders scan-history stats, batch fraud detection results, and MRP mismatch
 * findings for the currently active scan.
 *
 * Only visible when `currentScan.status === 'completed'`  -  guarded by the
 * parent ProductScanner page.
 */

import React, { useState } from 'react';
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Hash,
  Tag,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { useScanStore } from '../../store/scanStore';
import { cn } from '../../lib/utils';

// ─── Badge variants ────────────────────────────────────────────────────────────

type BadgeVariant = 'verified' | 'warning' | 'fraud_alert' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label, className }) => {
  const styles: Record<BadgeVariant, string> = {
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    fraud_alert: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const icons: Record<BadgeVariant, React.ReactNode> = {
    verified: <CheckCircle2 className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
    fraud_alert: <XCircle className="h-3 w-3" />,
    neutral: <Info className="h-3 w-3" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider',
        styles[variant],
        className
      )}
    >
      {icons[variant]}
      {label}
    </span>
  );
};

// ─── Evidence Row ──────────────────────────────────────────────────────────────

interface EvidenceRowProps {
  label: string;
  value: string;
  highlight?: 'red' | 'green' | 'neutral';
}

const EvidenceRow: React.FC<EvidenceRowProps> = ({ label, value, highlight = 'neutral' }) => {
  const valueStyles = {
    red: 'text-red-700 font-bold',
    green: 'text-emerald-700 font-bold',
    neutral: 'text-slate-800 font-semibold',
  };
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500 font-medium shrink-0">{label}</span>
      <span className={cn('text-xs font-mono text-right', valueStyles[highlight])}>{value}</span>
    </div>
  );
};

// ─── Fraud Alert Block ────────────────────────────────────────────────────────

interface FraudAlertBlockProps {
  title: string;
  message: string;
  evidence: { label: string; value: string; highlight?: 'red' | 'green' | 'neutral' }[];
  type: 'batch' | 'mrp';
}

const FraudAlertBlock: React.FC<FraudAlertBlockProps> = ({ title, message, evidence, type }) => {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/60 overflow-hidden">
      {/* Header banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-red-100/70 border-b border-red-200">
        <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-sm">
          <ShieldAlert className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-red-900 leading-tight">{title}</p>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded shrink-0">
          High Risk
        </span>
      </div>

      {/* Description */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] text-red-800 leading-relaxed">{message}</p>
      </div>

      {/* Evidence table */}
      {evidence.length > 0 && (
        <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-white/80 px-3 py-1 mt-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-red-500 pt-2 pb-1">
            Evidence
          </p>
          {evidence.map((ev) => (
            <EvidenceRow key={ev.label} {...ev} />
          ))}
        </div>
      )}

      {/* Rule reference */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-red-600 font-mono">
          {type === 'batch'
            ? 'Ref: Legal Metrology (Packaged Commodities) Rules, 2011  -  Counterfeit / Duplicate Expiry Label'
            : 'Ref: Legal Metrology Act, 2009  -  Section 36 / Dual MRP Prohibition'}
        </p>
      </div>
    </div>
  );
};

// ─── Section Collapsible ──────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({
  icon,
  title,
  subtitle,
  badge,
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0">{icon}</span>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 block">{title}</span>
            {subtitle && (
              <span className="text-[10px] text-slate-500 block truncate">{subtitle}</span>
            )}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </button>

      {open && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const HistoricalIntelligencePanel: React.FC = () => {
  const {
    currentScan,
    scans,
    batchVerificationResults,
    mrpVerificationResults,
  } = useScanStore();

  if (!currentScan || currentScan.status !== 'completed' || !currentScan.extractedData) {
    return null;
  }

  const batchResult = batchVerificationResults[currentScan.id];
  const mrpResult = mrpVerificationResults[currentScan.id];

  // Historical scan stats: previous scans (excluding current) that share the same product name
  const productName = currentScan.extractedData.productName?.trim().toLowerCase() || '';
  const previousMatchingScans = scans.filter(
    (s) =>
      s.id !== currentScan.id &&
      s.status === 'completed' &&
      s.extractedData?.productName?.trim().toLowerCase() === productName
  );
  const previousScanCount = previousMatchingScans.length;
  const lastMatchingScan = previousMatchingScans[0]; // most recent (scans are newest-first)

  // ─── Badge Variants ────────────────────────────────────────────────────────

  const batchBadgeVariant: BadgeVariant =
    !batchResult || batchResult.status === 'no_previous_record'
      ? 'neutral'
      : batchResult.status === 'fraud_alert'
      ? 'fraud_alert'
      : 'verified';

  const batchBadgeLabel =
    !batchResult || batchResult.status === 'no_previous_record'
      ? 'First Record'
      : batchResult.status === 'fraud_alert'
      ? 'Fraud Alert'
      : 'Verified';

  const mrpBadgeVariant: BadgeVariant =
    !mrpResult || mrpResult.status === 'not_found'
      ? 'neutral'
      : mrpResult.status === 'mismatch'
      ? 'fraud_alert'
      : 'verified';

  const mrpBadgeLabel =
    !mrpResult || mrpResult.status === 'not_found'
      ? 'No Match'
      : mrpResult.status === 'mismatch'
      ? 'Dual MRP'
      : 'Verified';

  // ─── Overall header badge ──────────────────────────────────────────────────
  const hasAnyAlert =
    batchResult?.status === 'fraud_alert' || mrpResult?.status === 'mismatch';

  return (
    <Card className="border border-slate-200/90 shadow-subtle bg-white">
      {/* Panel Header */}
      <CardHeader className="px-4 sm:px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
                hasAnyAlert
                  ? 'bg-red-50/80 border-red-200'
                  : 'bg-violet-50/60 border-violet-200'
              )}
            >
              <Database
                className={cn('h-4 w-4', hasAnyAlert ? 'text-red-600' : 'text-violet-600')}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase block leading-none">
                Intelligence Layer
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                Historical Intelligence
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Batch verification, MRP cross-check & scan history analysis.
              </p>
            </div>
          </div>

          {/* Overall status badge */}
          <div className="shrink-0 self-start">
            {hasAnyAlert ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-bold text-red-700 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5" />
                Alerts Detected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                All Clear
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">

        {/* ── Section 1: Scan History Stats ────────────────────────────── */}
        <Section
          icon={<Clock className="h-4 w-4 text-indigo-500" />}
          title="Scan History"
          subtitle="Previous scans matching this product name"
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Previous Scan Count */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Previous Scans
              </span>
              <span className={cn(
                'text-2xl font-black font-mono leading-none',
                previousScanCount > 0 ? 'text-indigo-600' : 'text-slate-400'
              )}>
                {previousScanCount}
              </span>
              <span className="text-[11px] text-slate-500">
                {previousScanCount === 0
                  ? 'First scan of this product'
                  : previousScanCount === 1
                  ? 'One prior scan found'
                  : `${previousScanCount} prior scans found`}
              </span>
            </div>

            {/* Last Scan Date */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Last Scan Date
              </span>
              <span className={cn(
                'text-sm font-bold font-mono leading-snug mt-0.5',
                lastMatchingScan ? 'text-slate-800' : 'text-slate-400'
              )}>
                {lastMatchingScan ? lastMatchingScan.timestamp : ' - '}
              </span>
              <span className="text-[11px] text-slate-500">
                {lastMatchingScan ? 'Most recent matching scan' : 'No prior records'}
              </span>
            </div>
          </div>
        </Section>

        {/* ── Section 2: Batch Verification ──────────────────────────────── */}
        <Section
          icon={<Hash className="h-4 w-4 text-violet-500" />}
          title="Batch Number Verification"
          subtitle={batchResult ? `Batch: ${batchResult.batchNumber}` : 'No batch data'}
          badge={<StatusBadge variant={batchBadgeVariant} label={batchBadgeLabel} />}
          defaultOpen={batchResult?.status === 'fraud_alert'}
        >
          {!batchResult && (
            <p className="text-xs text-slate-500 italic">
              Verification result not yet available for this scan.
            </p>
          )}

          {batchResult?.status === 'no_previous_record' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">No Previous Batch Record</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{batchResult.message}</p>
                {batchResult.batchNumber && batchResult.batchNumber !== '(not detected)' && (
                  <p className="text-[11px] font-mono text-slate-600 mt-1">
                    Batch: <span className="font-bold">{batchResult.batchNumber}</span>
                    {batchResult.currentExpiryDate && (
                      <> · Expiry: <span className="font-bold">{batchResult.currentExpiryDate}</span></>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {batchResult?.status === 'verified' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Batch Number Verified</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{batchResult.message}</p>
                <div className="mt-2 rounded border border-emerald-200 bg-white/60 px-3 py-1.5">
                  <EvidenceRow
                    label="Batch Number"
                    value={batchResult.batchNumber}
                    highlight="green"
                  />
                  <EvidenceRow
                    label="Current Expiry"
                    value={batchResult.currentExpiryDate || ' - '}
                    highlight="green"
                  />
                  <EvidenceRow
                    label="Previous Expiry"
                    value={batchResult.previousExpiryDate || ' - '}
                    highlight="green"
                  />
                </div>
              </div>
            </div>
          )}

          {batchResult?.status === 'fraud_alert' && (
            <FraudAlertBlock
              type="batch"
              title="Possible Dual Expiry Fraud Detected"
              message={batchResult.message}
              evidence={[
                {
                  label: 'Batch Number',
                  value: batchResult.batchNumber,
                  highlight: 'neutral',
                },
                {
                  label: 'Previous Expiry Date',
                  value: batchResult.previousExpiryDate || '(not recorded)',
                  highlight: 'green',
                },
                {
                  label: 'Current Expiry Date',
                  value: batchResult.currentExpiryDate || '(not detected)',
                  highlight: 'red',
                },
              ]}
            />
          )}
        </Section>

        {/* ── Section 3: MRP Verification ───────────────────────────────── */}
        <Section
          icon={<Tag className="h-4 w-4 text-blue-500" />}
          title="MRP Directory Verification"
          subtitle="Cross-check scanned MRP against Product Directory"
          badge={<StatusBadge variant={mrpBadgeVariant} label={mrpBadgeLabel} />}
          defaultOpen={mrpResult?.status === 'mismatch'}
        >
          {!mrpResult && (
            <p className="text-xs text-slate-500 italic">
              MRP verification result not yet available for this scan.
            </p>
          )}

          {mrpResult?.status === 'not_found' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">No Directory Match Found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{mrpResult.message}</p>
              </div>
            </div>
          )}

          {mrpResult?.status === 'verified' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-emerald-800">MRP Verified</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{mrpResult.message}</p>
                <div className="mt-2 rounded border border-emerald-200 bg-white/60 px-3 py-1.5">
                  <EvidenceRow
                    label="Matched Product"
                    value={mrpResult.matchedProductTitle || ' - '}
                    highlight="neutral"
                  />
                  <EvidenceRow
                    label="Directory MRP"
                    value={mrpResult.directoryMRP != null ? `₹${mrpResult.directoryMRP}` : ' - '}
                    highlight="green"
                  />
                  <EvidenceRow
                    label="Scanned MRP"
                    value={mrpResult.scannedMRP > 0 ? `₹${mrpResult.scannedMRP}` : ' - '}
                    highlight="green"
                  />
                  <EvidenceRow
                    label="Difference"
                    value={mrpResult.difference != null ? `₹${mrpResult.difference.toFixed(2)}` : ' - '}
                    highlight="neutral"
                  />
                </div>
              </div>
            </div>
          )}

          {mrpResult?.status === 'mismatch' && (
            <FraudAlertBlock
              type="mrp"
              title="Possible Dual MRP Detected"
              message={mrpResult.message}
              evidence={[
                {
                  label: 'Matched Product',
                  value: mrpResult.matchedProductTitle || ' - ',
                  highlight: 'neutral',
                },
                {
                  label: 'Product Directory MRP',
                  value: mrpResult.directoryMRP != null ? `₹${mrpResult.directoryMRP}` : ' - ',
                  highlight: 'green',
                },
                {
                  label: 'Scanned MRP',
                  value: mrpResult.scannedMRP > 0 ? `₹${mrpResult.scannedMRP}` : ' - ',
                  highlight: 'red',
                },
                {
                  label: 'Difference',
                  value:
                    mrpResult.difference != null
                      ? `₹${mrpResult.difference.toFixed(2)}`
                      : ' - ',
                  highlight: 'red',
                },
              ]}
            />
          )}
        </Section>

      </CardContent>
    </Card>
  );
};
