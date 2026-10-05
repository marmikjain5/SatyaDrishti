import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  UserCheck,
  Scale,
  Calendar,
  Layers,
  FileCheck,
  Eye,
  Type,
  FileCode,
  Building,
  Edit3,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useReportStore } from '../../store/reportStore';
import { useAuthStore } from '../../store/authStore';
import { reportService } from '../../lib/reportService';
import { exportReportToPdf, exportReportToDocx, downloadReportAsPdf } from '../../lib/reportExporter';
import type { ComplianceInspectionReport, ReportGenerationOptions } from '../../types/report';
import { cn } from '../../lib/utils';

interface ComplianceReportModalProps {
  report: ComplianceInspectionReport;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate?: (options: Partial<ReportGenerationOptions>) => void;
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onRegenerate,
}) => {
  const { addReport } = useReportStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'report' | 'customize'>('report');
  const [copiedHash, setCopiedHash] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Mobile accordion state (Executive Summary open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    products: false,
    violations: false,
    legal: false,
    evidence: false,
    recommendations: false,
    signoff: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Inspector customization state
  const [inspectorName, setInspectorName] = useState(report.coverPage.inspectorName);
  const [inspectorDesignation, setInspectorDesignation] = useState(report.coverPage.inspectorDesignation);
  const [inspectorBadge, setInspectorBadge] = useState(report.coverPage.inspectorBadge);
  const [department, setDepartment] = useState(report.coverPage.department);
  const [jurisdiction, setJurisdiction] = useState(report.coverPage.jurisdiction);
  const [customRemarks, setCustomRemarks] = useState(report.verdict.summaryRemarks);
  const [deadlineDays, setDeadlineDays] = useState(15);

  if (!isOpen) return null;

  const { coverPage, productInfo, ruleValidation, readabilityAnalysis, evidence, recommendations, verdict, digitalSignature } = report;
  const isSessionReport = report.reportType === 'inspection-session' && !!report.auditedProducts;

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    addReport(report);
    await downloadReportAsPdf(report);
    setIsExporting(false);
  };

  const handlePrint = () => {
    addReport(report);
    exportReportToPdf(report);
  };

  const handleDownloadDocx = () => {
    setIsExporting(true);
    addReport(report);
    exportReportToDocx(report);
    setTimeout(() => setIsExporting(false), 500);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(digitalSignature.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleApplyCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegenerate) {
      onRegenerate({
        inspectorName,
        inspectorDesignation,
        inspectorBadge,
        department,
        jurisdiction,
        customRemarks,
        actionDeadlineDays: deadlineDays,
      });
      setActiveTab('report');
    }
  };

  const statusBadge = {
    compliant: {
      label: 'COMPLIANT',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
      icon: CheckCircle2,
    },
    warning: {
      label: 'NEEDS ATTENTION',
      bg: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
      icon: AlertTriangle,
    },
    'non-compliant': {
      label: 'NON-COMPLIANT',
      bg: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80',
      icon: XCircle,
    },
  }[coverPage.overallStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[94vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* ─── Modal Header ────────────────────────────────────────── */}
        {/* Desktop Header (>=sm) */}
        <div className="hidden sm:flex px-6 py-4 border-b border-slate-200 dark:border-slate-800 items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono tracking-widest uppercase px-2 py-0.5 rounded border text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60">
                  OFFICIAL STATUTORY INSPECTION RECORD
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {report.reportId}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                Compliance Inspection Report Generator
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-lg p-0.5 mr-2">
              <button
                onClick={() => setActiveTab('report')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                  activeTab === 'report'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                Full Report Preview
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1',
                  activeTab === 'customize'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <Edit3 className="h-3 w-3" />
                <span>Inspector Sign-Off</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDocx}
              disabled={isExporting}
              className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-700"
            >
              <FileCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Download DOCX</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isExporting}
              className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-700"
              title="Open Browser Print Dialog"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Header (<sm) */}
        <div className="sm:hidden px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 truncate">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Compliance Report
                </h2>
                <div className="font-mono text-[10px] text-slate-500 truncate">
                  {report.reportId}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-lg p-0.5 flex-1">
              <button
                onClick={() => setActiveTab('report')}
                className={cn(
                  'flex-1 py-1 text-[11px] font-semibold rounded text-center transition-colors',
                  activeTab === 'report'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                Full Report
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={cn(
                  'flex-1 py-1 text-[11px] font-semibold rounded text-center transition-colors flex items-center justify-center gap-1',
                  activeTab === 'customize'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <Edit3 className="h-2.5 w-2.5" />
                <span>Sign-Off</span>
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white gap-1 shrink-0 font-bold"
            >
              <Download className="h-3 w-3" />
              <span>PDF</span>
            </Button>
          </div>
        </div>

        {/* ─── Modal Body ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'customize' ? (
            /* ── Inspector Customization Form ───────────────────── */
            <form onSubmit={handleApplyCustomization} className="max-w-2xl mx-auto space-y-5 py-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
                <UserCheck className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-bold">
                    Inspector Authentication & Customization
                  </h4>
                  <p className="mt-0.5 text-blue-700 dark:text-blue-400">
                    Modify inspecting officer credentials, legal department jurisdiction, and enforcement directives before exporting the official document.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Inspecting Officer Name
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Inspector Badge / ID Number
                  </label>
                  <input
                    type="text"
                    value={inspectorBadge}
                    onChange={(e) => setInspectorBadge(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Designation
                  </label>
                  <input
                    type="text"
                    value={inspectorDesignation}
                    onChange={(e) => setInspectorDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Enforcement Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Department / Authority
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Inspector Findings &amp; Summary Remarks
                </label>
                <textarea
                  rows={3}
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('report')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Update &amp; Re-generate Report
                </Button>
              </div>
            </form>
          ) : (
            <>
              {/* Desktop Full Printable Government Dossier View (>=md) */}
              <div className="hidden md:block">
                {isSessionReport ? (
                  /* ── Multi-Product Inspection Session Printable View ── */
                  <div className="max-w-4xl mx-auto bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6 text-slate-900 dark:text-slate-100">
              {/* Government Header Banner */}
              <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 text-center space-y-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest font-mono">
                  <span>GOVERNMENT OF INDIA</span>
                  <span>•</span>
                  <span>MINISTRY OF CONSUMER AFFAIRS</span>
                </div>
                <h1 className="text-xl font-black text-slate-950 dark:text-white tracking-tight uppercase">
                  Comprehensive Multi-Commodity Inspection Session Report
                </h1>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Under Legal Metrology (Packaged Commodities) Rules, 2011 &amp; Legal Metrology Act, 2009 • {report.auditedProducts?.length || 0} Products Audited
                </p>
              </div>

              {/* Identification Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500">INSPECTION SESSION ID: </span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">{coverPage.reportId}</span>
                </div>
                <div>
                  <span className="text-slate-500">SESSION DATE: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{coverPage.formattedDate}</span>
                </div>
              </div>

              {/* Status & Verdict Hero Banner */}
              <div className={cn('p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4', statusBadge.bg)}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      OVERALL INSPECTION SWEEP VERDICT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      RISK TIER: {coverPage.riskTier}
                    </span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                    {React.createElement(statusBadge.icon, { className: 'h-5 w-5' })}
                    <span>{verdict.verdictTitle}</span>
                  </h3>
                  <p className="text-xs max-w-xl opacity-90">
                    {verdict.summaryRemarks}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center min-w-[120px] shrink-0 shadow-2xs">
                  <span className="text-3xl font-black font-mono block leading-none text-slate-900 dark:text-slate-100">
                    {coverPage.complianceScore}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mt-1">
                    Avg Compliance Score
                  </span>
                </div>
              </div>

              {/* Session KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 block">
                    {report.sessionSummary?.totalProductsScanned || report.auditedProducts?.length || 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mt-0.5 block">
                    Total Products Audited
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                    {report.sessionSummary?.compliantCount ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mt-0.5 block">
                    Fully Compliant
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-2xl font-black font-mono text-red-600 dark:text-red-400 block">
                    {report.sessionSummary?.nonCompliantCount ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mt-0.5 block">
                    Non-Compliant / Flagged
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 block">
                    {report.sessionSummary?.totalViolationsCount ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mt-0.5 block">
                    Total Violations Flagged
                  </span>
                </div>
              </div>

              {/* Section 1: Inspection Authority */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>1. Inspecting Authority &amp; Sweep Identity</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-01</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">
                      Inspecting Officer
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {coverPage.inspectorName} ({coverPage.inspectorBadge})
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {coverPage.inspectorDesignation}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {coverPage.department}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">
                      Inspection Scope &amp; Jurisdiction
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {coverPage.jurisdiction}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Facility: {coverPage.inspectionLocation}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Commodities Audited: {report.auditedProducts?.length || 0} Packaged Goods
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Audited Products Master Ledger Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>2. Audited Products Master Ledger ({report.auditedProducts?.length || 0} Products)</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-02</span>
                </h4>

                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5 w-[5%] text-center">#</th>
                        <th className="p-2.5 w-[28%]">Product / Commodity</th>
                        <th className="p-2.5 w-[24%]">Manufacturer / Brand</th>
                        <th className="p-2.5 w-[15%]">MRP / Quantity</th>
                        <th className="p-2.5 w-[10%] text-center">Score</th>
                        <th className="p-2.5 w-[18%]">Inspection Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(report.auditedProducts || []).map((p, idx) => (
                        <tr key={p.scanId || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2">
                            <span className="font-bold block text-slate-900 dark:text-slate-100">{p.productName}</span>
                            <span className="text-[10px] font-mono text-slate-500">Batch: {p.batchNumber}</span>
                          </td>
                          <td className="p-2 text-slate-700 dark:text-slate-300">{p.manufacturer}</td>
                          <td className="p-2 font-mono">
                            <span className="font-bold block">{p.mrp}</span>
                            <span className="text-[10px] text-slate-500">{p.netQuantity}</span>
                          </td>
                          <td className="p-2 text-center font-mono font-bold">
                            <span className={cn(
                              p.complianceScore >= 80 ? 'text-emerald-600' : p.complianceScore >= 60 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {p.complianceScore}
                            </span>
                          </td>
                          <td className="p-2">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono inline-block',
                                p.status === 'compliant'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : p.status === 'non-compliant'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              )}
                            >
                              {p.status === 'compliant' ? 'COMPLIANT' : `${p.violationCount} VIOLATION(S)`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span>Total Violations: <strong className="text-red-600">{ruleValidation.violationCount}</strong> | Total Warnings: <strong className="text-amber-600">{ruleValidation.warningCount}</strong></span>
                  <span>Cumulative Compounding Fine Exposure: <strong className="text-slate-900 dark:text-slate-100">{verdict.statutoryPenaltyEstimate}</strong></span>
                </div>
              </div>

              {/* Section 3: Consolidated Violations Matrix */}
              {(report.consolidatedViolations || []).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                    <span>3. Consolidated Legal Metrology Violations Matrix</span>
                    <span className="font-mono text-[10px] text-slate-400">SEC-03</span>
                  </h4>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5 w-[22%]">Product &amp; Manufacturer</th>
                          <th className="p-2.5 w-[14%]">Rule Code</th>
                          <th className="p-2.5 w-[24%]">Statutory Act &amp; Section</th>
                          <th className="p-2.5 w-[26%]">Observed Deficiency</th>
                          <th className="p-2.5 w-[14%]">Statutory Fine</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(report.consolidatedViolations || []).map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-2">
                              <span className="font-bold block text-slate-900 dark:text-slate-100">{v.productName}</span>
                              <span className="text-[10px] text-slate-500">{v.manufacturer}</span>
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-700 dark:text-slate-300">{v.ruleCode}</td>
                            <td className="p-2">
                              <span className="font-bold block text-slate-900 dark:text-slate-100">{v.ruleName}</span>
                              <span className="text-[10px] text-slate-500">{v.section}</span>
                            </td>
                            <td className="p-2 text-red-600 dark:text-red-400 font-mono text-[11px]">{v.evidence}</td>
                            <td className="p-2 font-mono font-bold text-red-700 dark:text-red-400">{v.penaltyRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 4: Readability Overview */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>4. Optical Readability &amp; Print Typography Summary</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-04</span>
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Avg Font Height</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                      {readabilityAnalysis.summary.avgFontSizePt} pt
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ≈ {((readabilityAnalysis.summary.avgFontSizePt * 25.4) / 72).toFixed(1)} mm
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Contrast Ratio</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                      {readabilityAnalysis.summary.avgContrastRatio}:1
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      WCAG 2.1 Standard
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Readability Score</span>
                    <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {readabilityAnalysis.summary.overallScore}/100
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {readabilityAnalysis.flaggedRegions.length} Defect Regions
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Directives & Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>5. Corrective Action Directives &amp; Compounding Notices</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-05</span>
                </h4>

                <ul className="text-xs space-y-1.5 list-disc pl-5 text-slate-700 dark:text-slate-300">
                  {recommendations.correctiveActions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                  {recommendations.legalEnforcementSteps.map((l, i) => (
                    <li key={i}><strong className="text-slate-900 dark:text-slate-100">Statutory Notice:</strong> {l}</li>
                  ))}
                </ul>

                <p className="text-xs font-bold text-red-600 dark:text-red-400 pt-1">
                  Enforcement Deadline: {verdict.recommendedActionDeadline} (Under Rule 24 Guidelines)
                </p>
              </div>

              {/* Digital Signature Block */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">
                    Digitally signed by {digitalSignature.signedBy ? `${digitalSignature.signedBy}${digitalSignature.badgeNumber ? ` (${digitalSignature.badgeNumber})` : ''}` : 'the inspecting officer'}.
                  </p>
                  {digitalSignature.timestamp && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Timestamp: {digitalSignature.timestamp} • SHA-256 e-Sign Standard
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Single-Product Printable Report View ─────────────────── */
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6 text-slate-900 dark:text-slate-100">
              {/* Government Header Banner */}
              <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 text-center space-y-1">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest font-mono">
                  <span>GOVERNMENT OF INDIA</span>
                  <span>•</span>
                  <span>MINISTRY OF CONSUMER AFFAIRS</span>
                </div>
                <h1 className="text-xl font-black text-slate-950 dark:text-white tracking-tight uppercase">
                  Statutory Packaged Commodity Inspection Report
                </h1>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Under Legal Metrology (Packaged Commodities) Rules, 2011 &amp; Legal Metrology Act, 2009
                </p>
              </div>

              {/* Identification Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500">REPORT ID: </span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">{coverPage.reportId}</span>
                </div>
                <div>
                  <span className="text-slate-500">INSPECTION DATE: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{coverPage.formattedDate}</span>
                </div>
              </div>

              {/* Status & Verdict Hero Banner */}
              <div className={cn('p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4', statusBadge.bg)}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      FINAL STATUTORY VERDICT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      RISK TIER: {coverPage.riskTier}
                    </span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                    {React.createElement(statusBadge.icon, { className: 'h-5 w-5' })}
                    <span>{verdict.verdictTitle}</span>
                  </h3>
                  <p className="text-xs max-w-xl opacity-90">
                    {verdict.summaryRemarks}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center min-w-[120px] shrink-0 shadow-2xs">
                  <span className="text-3xl font-black font-mono block leading-none text-slate-900 dark:text-slate-100">
                    {coverPage.complianceScore}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mt-1">
                    Compliance Score
                  </span>
                </div>
              </div>

              {/* Section 1: Inspector & Product Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>1. Inspection Authority &amp; Packaging Identity</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-01</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">
                      Inspecting Officer
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {coverPage.inspectorName} ({coverPage.inspectorBadge})
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {coverPage.inspectorDesignation}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {coverPage.department} • {coverPage.jurisdiction}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block font-mono">
                      Commodity Identity
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {productInfo.productName}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Manufacturer: {productInfo.manufacturer}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Location: {productInfo.address}
                    </p>
                  </div>
                </div>

                {/* Statutory Declarations Matrix */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Statutory Field</th>
                        <th className="p-2.5">Extracted Value</th>
                        <th className="p-2.5">Statutory Field</th>
                        <th className="p-2.5">Extracted Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      <tr>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">MRP (Incl. taxes)</td>
                        <td className="p-2 font-bold">{productInfo.mrp}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">Net Quantity</td>
                        <td className="p-2 font-bold">{productInfo.netQuantity}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">Mfg / Packing Date</td>
                        <td className="p-2">{productInfo.manufacturingDate || productInfo.packingDate}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">Expiry Date</td>
                        <td className="p-2">{productInfo.expiryDate}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">Batch / Lot No.</td>
                        <td className="p-2">{productInfo.batchNumber}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">Country of Origin</td>
                        <td className="p-2">{productInfo.countryOfOrigin}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">Customer Care</td>
                        <td className="p-2">{productInfo.customerCare}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 font-sans">Barcode / GTIN</td>
                        <td className="p-2">{productInfo.barcode}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Rule Validation Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>2. Legal Metrology Rule Validation Matrix</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-02</span>
                </h4>

                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5 w-[16%]">Rule Code</th>
                        <th className="p-2.5 w-[34%]">Statutory Rule Title</th>
                        <th className="p-2.5 w-[28%]">Extracted Evidence</th>
                        <th className="p-2.5 w-[12%]">Status</th>
                        <th className="p-2.5 w-[10%]">Penalty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ruleValidation.auditTrail.slice(0, 8).map((entry) => (
                        <tr key={entry.ruleId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-2 font-mono font-bold text-slate-700 dark:text-slate-300">{entry.ruleCode}</td>
                          <td className="p-2">
                            <span className="font-bold block text-slate-900 dark:text-slate-100">{entry.ruleName}</span>
                            <span className="text-[10px] text-slate-500">{entry.section}</span>
                          </td>
                          <td className="p-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                            {entry.evidence || 'Missing from label'}
                          </td>
                          <td className="p-2">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono',
                                entry.status === 'pass'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : entry.status === 'fail'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              )}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {entry.status === 'fail' ? `₹${(entry.penaltyRange?.maxFine || 25000).toLocaleString('en-IN')}` : ' - '}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span>Violations: <strong className="text-red-600">{ruleValidation.violationCount}</strong> | Warnings: <strong className="text-amber-600">{ruleValidation.warningCount}</strong></span>
                  <span>Estimated Compounding Penalty: <strong className="text-slate-900 dark:text-slate-100">{verdict.statutoryPenaltyEstimate}</strong></span>
                </div>
              </div>

              {/* Section 3: Readability & Font Size */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>3. Optical Font Size &amp; Readability (Rule 9 &amp; Sched. II)</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-03</span>
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Avg Font Height</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                      {readabilityAnalysis.summary.avgFontSizePt} pt
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ≈ {((readabilityAnalysis.summary.avgFontSizePt * 25.4) / 72).toFixed(1)} mm
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Contrast Ratio</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                      {readabilityAnalysis.summary.avgContrastRatio}:1
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      WCAG 2.1 Standard
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Readability Score</span>
                    <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {readabilityAnalysis.summary.overallScore}/100
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {readabilityAnalysis.flaggedRegions.length} Flagged Defects
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Physical Evidence Thumbnail */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>4. Physical Packaging Evidence Snapshot</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-04</span>
                </h4>

                <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 border border-slate-300 dark:border-slate-800 text-center flex flex-col items-center justify-center">
                  <img
                    src={evidence.imageDataUrl}
                    alt="Packaging Evidence"
                    className="max-h-56 w-auto rounded-lg shadow-sm object-contain"
                  />
                  <span className="text-[10px] font-mono text-slate-500 mt-2">
                    Evidence Record • {evidence.mappedBoundingBoxesCount} Statutory Bounding Boxes Mapped
                  </span>
                </div>
              </div>

              {/* Section 5: Directives & Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>5. Enforcement Directives &amp; Corrective Actions</span>
                  <span className="font-mono text-[10px] text-slate-400">SEC-05</span>
                </h4>

                <ul className="text-xs space-y-1.5 list-disc pl-5 text-slate-700 dark:text-slate-300">
                  {recommendations.correctiveActions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                  {recommendations.legalEnforcementSteps.map((l, i) => (
                    <li key={i}><strong className="text-slate-900 dark:text-slate-100">Statutory Notice:</strong> {l}</li>
                  ))}
                </ul>

                <p className="text-xs font-bold text-red-600 dark:text-red-400 pt-1">
                  Enforcement Deadline: {verdict.recommendedActionDeadline} (Under Rule 24 Guidelines)
                </p>
              </div>

              {/* Digital Signature Block */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">
                    Digitally signed by {digitalSignature.signedBy ? `${digitalSignature.signedBy}${digitalSignature.badgeNumber ? ` (${digitalSignature.badgeNumber})` : ''}` : 'the particular officer'}.
                  </p>
                  {digitalSignature.timestamp && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Timestamp: {digitalSignature.timestamp}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Mobile Purpose-Built Accordion View (<md) ─────────── */}
        <div className="block md:hidden space-y-3 pb-4">
          {/* Compact Inspection Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Inspection ID</span>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{report.reportId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Date</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{coverPage.formattedDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-center">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[9px] uppercase text-slate-400 font-bold">Products</div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{report.auditedProducts?.length || 1}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[9px] uppercase text-slate-400 font-bold">Risk Tier</div>
                <div className="text-xs font-bold text-amber-600 capitalize mt-0.5">{coverPage.riskTier ? coverPage.riskTier.toLowerCase() : 'Medium'}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[9px] uppercase text-slate-400 font-bold">Verdict</div>
                <div className={cn("text-xs font-bold capitalize mt-0.5", coverPage.overallStatus === 'compliant' ? 'text-emerald-600' : 'text-red-600')}>
                  {coverPage.overallStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Accordion 1: Executive Summary (Open initially) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('summary')}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Executive Summary</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openSections.summary && "rotate-180")} />
            </button>
            {openSections.summary && (
              <div className="p-3.5 space-y-3 text-xs border-t border-slate-200 dark:border-slate-800">
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {verdict.summaryRemarks || 'Statutory audit completed across Legal Metrology and FSSAI packaging norms.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Violations</span>
                    <span className="font-bold text-red-600 text-sm">{ruleValidation.violationCount}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Penalty Exposure</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{verdict.statutoryPenaltyEstimate || '₹0'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Products Audited */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('products')}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>Products Audited ({report.auditedProducts?.length || 1})</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openSections.products && "rotate-180")} />
            </button>
            {openSections.products && (
              <div className="p-3 space-y-2.5 border-t border-slate-200 dark:border-slate-800">
                {report.auditedProducts && report.auditedProducts.length > 0 ? (
                  report.auditedProducts.map((p, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{p.productName}</div>
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono",
                          p.status === 'compliant' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        )}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{p.manufacturer} • {p.netQuantity}</span>
                        <span className="font-mono font-bold">Score: {p.complianceScore}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{productInfo.productName || 'Audited Product'}</div>
                    <div className="text-[11px] text-slate-500">
                      Manufacturer: {productInfo.manufacturer || ' - '} | Net: {productInfo.netQuantity || ' - '} | MRP: {productInfo.mrp || ' - '}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accordion 3: Violations */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('violations')}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span>Violations ({ruleValidation.violationCount})</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openSections.violations && "rotate-180")} />
            </button>
            {openSections.violations && (
              <div className="p-3 space-y-2.5 border-t border-slate-200 dark:border-slate-800">
                {(report.consolidatedViolations || []).length > 0 ? (
                  report.consolidatedViolations!.map((v, i) => (
                    <div key={i} className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/40 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-red-800 dark:text-red-300 font-mono">{v.ruleCode}</span>
                        <span className="font-mono text-[10px] text-red-600 font-bold">{v.penaltyRange}</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">{v.ruleName}</p>
                      <p className="text-[11px] text-red-700 dark:text-red-400 font-mono">{v.evidence}</p>
                    </div>
                  ))
                ) : ruleValidation.violationCount > 0 ? (
                  ruleValidation.auditTrail.filter((r) => r.status === 'fail').map((r, i) => (
                    <div key={i} className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/40 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-red-800 dark:text-red-300">{r.ruleName}</span>
                        <span className="text-[9px] uppercase font-bold text-red-600 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded font-mono">{r.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{r.ruleDescription}</p>
                      {r.evidence && (
                        <p className="text-[10px] text-red-700 dark:text-red-400 font-mono">{r.evidence}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>All packaging declarations passed statutory compliance validation.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accordion 4: Legal References */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                <span>Legal References</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openSections.legal && "rotate-180")} />
            </button>
            {openSections.legal && (
              <div className="p-3.5 space-y-2 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <strong className="block text-slate-900 dark:text-slate-100">Legal Metrology Act, 2009</strong>
                  <span className="text-[11px] text-slate-500">Section 18 (Declarations on pre-packaged commodities) & Section 36(1) (Penalties for non-declaration).</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <strong className="block text-slate-900 dark:text-slate-100">Legal Metrology (Packaged Commodities) Rules, 2011</strong>
                  <span className="text-[11px] text-slate-500">Rule 6 (Mandatory declarations), Rule 8 (Minimum font heights), Rule 9 (Principal display panel), Rule 24.</span>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 5: Evidence */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('evidence')}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span>Evidence & Readability</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openSections.evidence && "rotate-180")} />
            </button>
            {openSections.evidence && (
              <div className="p-3.5 space-y-3 text-xs border-t border-slate-200 dark:border-slate-800">
                {evidence.imageDataUrl && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-center p-2">
                    <img src={evidence.imageDataUrl} alt="Inspection Evidence" className="max-h-48 object-contain rounded" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Font Height</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{readabilityAnalysis.summary.avgFontSizePt} pt</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Contrast</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{readabilityAnalysis.summary.avgContrastRatio}:1</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 6: Recommendations */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('recommendations')}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span>Recommendations</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openSections.recommendations && "rotate-180")} />
            </button>
            {openSections.recommendations && (
              <div className="p-3.5 space-y-2 text-xs border-t border-slate-200 dark:border-slate-800">
                <ul className="space-y-1.5 list-disc pl-4 text-slate-700 dark:text-slate-300">
                  {recommendations.correctiveActions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <div className="pt-2 text-xs font-bold text-red-600 dark:text-red-400 border-t border-slate-100 dark:border-slate-800">
                  Deadline: {verdict.recommendedActionDeadline}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 7: Sign-Off */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('signoff')}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>Sign-Off & Verification</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openSections.signoff && "rotate-180")} />
            </button>
            {openSections.signoff && (
              <div className="p-3.5 space-y-2.5 text-xs border-t border-slate-200 dark:border-slate-800">
                <div className="text-slate-800 dark:text-slate-200">
                  <span className="font-bold">{coverPage.inspectorName}</span>
                  <span className="text-slate-500 block text-[11px]">{coverPage.inspectorDesignation} • Badge: {coverPage.inspectorBadge}</span>
                  <span className="text-slate-500 block text-[11px]">{coverPage.department} • {coverPage.jurisdiction}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[10px] break-all bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                  <span className="text-slate-400 block font-sans text-[9px] uppercase font-bold">SHA-256 e-Sign Hash</span>
                  <span className="text-slate-700 dark:text-slate-300">{digitalSignature.sha256Hash}</span>
                </div>
              </div>
            )}
          </div>

          {/* Download PDF button on mobile */}
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] font-bold text-xs gap-2 justify-center shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Generating Official PDF...' : 'Download Official PDF Report'}</span>
            </Button>
          </div>
        </div>
      </>
    )}

        </div>
      </div>
    </div>
  );
};
