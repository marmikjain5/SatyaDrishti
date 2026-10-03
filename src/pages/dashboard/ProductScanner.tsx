import React, { useState } from 'react';
import {
  Images,
  BarChart3,
  Activity,
  Clock,
  Play,
  Trash2,
  FileText,
  History,
  Download,
  FileCheck,
  ChevronDown,
  Database,
  Camera,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useScanStore } from '../../store/scanStore';
import { useReportStore } from '../../store/reportStore';
import { reportService } from '../../lib/reportService';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { ImageUploader } from '../../components/scanner/ImageUploader';
import { ImagePreviewPanel } from '../../components/scanner/ImagePreviewPanel';
import { OCRProcessingCard } from '../../components/scanner/OCRProcessingCard';
import { OCRResultsPanel } from '../../components/scanner/OCRResultsPanel';
import { ComplianceResultsPanel } from '../../components/scanner/ComplianceResultsPanel';
import { ReadabilityAnalysisPanel } from '../../components/scanner/ReadabilityAnalysisPanel';
import { ScanCorrelationCard } from '../../components/scanner/ScanCorrelationCard';
import { RuleAuditView } from '../../components/scanner/RuleAuditView';
import { RecommendationsCard } from '../../components/scanner/RecommendationsCard';
import { ScanHistoryTable } from '../../components/scanner/ScanHistoryTable';
import { ComplianceReportModal } from '../../components/scanner/ComplianceReportModal';
import { ReportHistoryModal } from '../../components/scanner/ReportHistoryModal';
import { HistoricalIntelligencePanel } from '../../components/scanner/HistoricalIntelligencePanel';
import { OfflineInspectionQueue } from '../../components/scanner/OfflineInspectionQueue';
import type { ComplianceInspectionReport, ReportGenerationOptions } from '../../types/report';

export const ProductScanner: React.FC = () => {
  const {
    scans,
    currentScan,
    uploadedImages,
    isProcessing,
    startScan,
    clearImages,
    validationResults,
    readabilityResults,
  } = useScanStore();

  const { reports, addReport } = useReportStore();

  const [activeReport, setActiveReport] = useState<ComplianceInspectionReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showMobileDeepAnalytics, setShowMobileDeepAnalytics] = useState(false);
  const [showMobileScanHistory, setShowMobileScanHistory] = useState(false);

  const handleGenerateSessionReport = (options?: Partial<ReportGenerationOptions>) => {
    const validScans = scans.filter((s) => s.status === 'completed' && s.extractedData);
    if (validScans.length === 0) return;

    const report = reportService.generateSessionInspectionReport(
      validScans,
      validationResults,
      readabilityResults,
      options
    );

    addReport(report);
    setActiveReport(report);
    setIsReportModalOpen(true);
  };

  const handleGenerateSingleReport = (targetScan?: typeof currentScan, options?: Partial<ReportGenerationOptions>) => {
    const scan = targetScan || currentScan;
    if (!scan || !scan.extractedData) return;

    const valResult = validationResults[scan.id];
    const readResult = readabilityResults[scan.id] || scan.readabilityResult;

    const report = reportService.generateComplianceReport(
      scan,
      valResult,
      readResult,
      options
    );

    addReport(report);
    setActiveReport(report);
    setIsReportModalOpen(true);
  };

  const handleRegenerateReport = (options?: Partial<ReportGenerationOptions>) => {
    if (activeReport?.reportType === 'inspection-session') {
      handleGenerateSessionReport(options);
    } else {
      handleGenerateSingleReport(currentScan || scans[0], options);
    }
  };

  const totalScans = scans.length;
  const completedScans = scans.filter((s) => s.status === 'completed');
  const sessionTotalViolations = completedScans.reduce(
    (sum, s) => sum + (validationResults[s.id]?.violationCount || 0),
    0
  );
  const avgConfidence =
    completedScans.length > 0
      ? Math.round(
          completedScans.reduce((sum, s) => sum + s.confidence, 0) / completedScans.length * 10
        ) / 10
      : 0;
  const lastScanTime = scans[0]?.timestamp || 'Never';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Product Scanner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan product packaging & labels using optical character recognition for Legal Metrology compliance verification.
          </p>
        </div>

        {/* Top Header Report Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-xs gap-1.5 border-slate-200"
          >
            <History className="h-3.5 w-3.5 text-slate-600" />
            <span>Report Archive</span>
            {reports.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                {reports.length}
              </span>
            )}
          </Button>

          {completedScans.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGenerateSessionReport()}
              className="text-xs gap-1.5 shadow-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>
                Generate Inspection Report ({completedScans.length} {completedScans.length === 1 ? 'Product' : 'Products'})
              </span>
            </Button>
          )}
        </div>
      </div>

      <OfflineInspectionQueue />

      {/* Stat Cards - Compact 3-metric banner on mobile, 4 full cards on tablet/desktop */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Scans</div>
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">{totalScans}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
          <div className="text-base font-extrabold text-emerald-600">{avgConfidence > 0 ? `${avgConfidence}%` : '—'}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Queued</div>
          <div className="text-base font-extrabold text-blue-600">{uploadedImages.length}</div>
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scans"
          value={totalScans}
          icon={BarChart3}
          variant="accent"
          description="All-time processed"
        />
        <StatCard
          title="Avg Confidence"
          value={avgConfidence > 0 ? `${avgConfidence}%` : '—'}
          icon={Activity}
          variant={avgConfidence >= 90 ? 'success' : avgConfidence >= 70 ? 'warning' : 'default'}
          description="Across completed scans"
        />
        <StatCard
          title="Images Queued"
          value={uploadedImages.length}
          icon={Images}
          variant="default"
          description="Ready for processing"
        />
        <StatCard
          title="Last Verification"
          value={lastScanTime === 'Never' ? '—' : lastScanTime.split(',')[0] || '—'}
          icon={Clock}
          variant="default"
          description={lastScanTime === 'Never' ? 'No verifications yet' : lastScanTime}
        />
      </div>

      {/* Active Inspection Session Banner */}
      {completedScans.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-blue-900/60 p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs bg-blue-600">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-bold font-mono uppercase text-white px-2 py-0.5 rounded bg-blue-600">
                  Unified Session
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {completedScans.length} {completedScans.length === 1 ? 'Product' : 'Products'}
                </span>
                {sessionTotalViolations > 0 ? (
                  <span className="text-[9px] sm:text-[10px] font-bold font-mono uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                    {sessionTotalViolations} Flagged
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-bold font-mono uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                    Compliant
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 sm:line-clamp-none">
                All commodities scanned during this session are aggregated into a single statutory inspection record with consolidated violation ledger.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGenerateSessionReport()}
              className="w-full sm:w-auto text-xs gap-1.5 shadow-xs font-bold justify-center min-h-[38px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>
                Generate Report ({completedScans.length})
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Packaging Capture & Upload Zone */}
      <div className="min-w-0">
        <ImageUploader />
      </div>

      {/* Image Previews + Actions */}
      <ImagePreviewPanel />

      {/* Action Bar */}
      {uploadedImages.length > 0 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle px-4 py-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 min-w-0 truncate mr-2">
            <span className="font-semibold text-slate-900 dark:text-white">{uploadedImages.length}</span>{' '}
            {uploadedImages.length === 1 ? 'image' : 'images'} queued
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={clearImages}
              disabled={isProcessing}
              className="text-xs gap-1 min-h-[36px]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={startScan}
              isLoading={isProcessing}
              disabled={isProcessing}
              className="text-xs gap-1.5 font-semibold min-h-[36px]"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isProcessing ? 'Scanning...' : 'Start Scan'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Processing Status */}
      <OCRProcessingCard />

      {/* Side-by-Side: Statutory Declarations & Compliance Validation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* OCR Extraction Results */}
        <OCRResultsPanel />

        {/* Compliance Validation Results */}
        <ComplianceResultsPanel />
      </div>

      {/* Historical Batch Verification & Dual MRP Detection Panel */}
      {currentScan?.status === 'completed' && <HistoricalIntelligencePanel />}

      {/* Mobile Progressive Disclosure for Secondary Panels */}
      <div className="block lg:hidden space-y-4">
        {currentScan?.status === 'completed' && (
          <>
            {/* Historical Intelligence accordion on mobile */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <details className="group">
                <summary className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer list-none">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-violet-600" />
                    <span>Historical Intelligence</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                  <HistoricalIntelligencePanel />
                </div>
              </details>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <button
                onClick={() => setShowMobileDeepAnalytics(!showMobileDeepAnalytics)}
                className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>Readability & Rule Audit ({showMobileDeepAnalytics ? 'Hide' : 'Show'})</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showMobileDeepAnalytics ? 'rotate-180' : ''}`} />
              </button>
              {showMobileDeepAnalytics && (
                <div className="p-3 space-y-4 border-t border-slate-200 dark:border-slate-800">
                  <ReadabilityAnalysisPanel />
                  <ScanCorrelationCard />
                  {currentScan?.extractedData && (
                    <div className="space-y-4">
                      <RuleAuditView />
                      <RecommendationsCard />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <button
            onClick={() => setShowMobileScanHistory(!showMobileScanHistory)}
            className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              <span>Scan History Archive ({scans.length})</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showMobileScanHistory ? 'rotate-180' : ''}`} />
          </button>
          {showMobileScanHistory && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-800">
              <ScanHistoryTable />
            </div>
          )}
        </div>
      </div>

      {/* Desktop View: Full secondary panels */}
      <div className="hidden lg:block space-y-6">
        {currentScan?.status === 'completed' && <ReadabilityAnalysisPanel />}
        {currentScan?.status === 'completed' && <ScanCorrelationCard />}
        {currentScan?.status === 'completed' && currentScan?.extractedData && (
          <div className="grid grid-cols-12 gap-6 items-stretch">
            <div className="col-span-8 xl:col-span-9 h-full">
              <RuleAuditView />
            </div>
            <div className="col-span-4 xl:col-span-3 h-full">
              <RecommendationsCard />
            </div>
          </div>
        )}
        <ScanHistoryTable />
      </div>

      {/* Feature 5: Compliance Inspection Report Modal */}
      {activeReport && (
        <ComplianceReportModal
          report={activeReport}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onRegenerate={(opts) => handleRegenerateReport(opts)}
        />
      )}


      {/* Feature 5: Compliance Reports History Modal */}
      <ReportHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectReport={(report) => {
          setActiveReport(report);
          setIsHistoryModalOpen(false);
          setIsReportModalOpen(true);
        }}
      />
    </div>
  );
};
