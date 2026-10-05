import React, { useState } from 'react';
import { History, Search, Eye, Trash2, Clock, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useScanStore } from '../../store/scanStore';
import { useReportStore } from '../../store/reportStore';
import { reportService } from '../../lib/reportService';
import { ComplianceReportModal } from './ComplianceReportModal';
import type { ScanRecord } from '../../types/scan';
import type { ComplianceInspectionReport } from '../../types/report';

export const ScanHistoryTable: React.FC = () => {
  const { scans, viewScan, deleteScan, clearHistory, validationResults, readabilityResults } = useScanStore();
  const { addReport } = useReportStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReport, setActiveReport] = useState<ComplianceInspectionReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleOpenReport = (scan: ScanRecord) => {
    const valResult = validationResults[scan.id];
    const readResult = readabilityResults[scan.id] || scan.readabilityResult;
    const report = reportService.generateComplianceReport(scan, valResult, readResult);
    addReport(report);
    setActiveReport(report);
    setIsReportOpen(true);
  };

  const filteredScans = scans.filter((scan) =>
    scan.imageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.timestamp.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (scan.extractedData?.productName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (scans.length === 0) return null;

  const getStatusBadge = (scan: ScanRecord) => {
    switch (scan.status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'error':
        return <Badge variant="danger" size="sm">Failed</Badge>;
      case 'processing':
        return <Badge variant="primary" size="sm" dot>Processing</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Idle</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-emerald-700';
    if (confidence >= 70) return 'text-amber-700';
    return 'text-red-700';
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-emerald-600';
    if (confidence >= 70) return 'bg-amber-500';
    return 'bg-red-600';
  };

  const completedScans = scans.filter((s) => s.status === 'completed' && s.extractedData);

  const handleOpenSessionReport = () => {
    if (completedScans.length === 0) return;
    const report = reportService.generateSessionInspectionReport(
      completedScans,
      validationResults,
      readabilityResults
    );
    addReport(report);
    setActiveReport(report);
    setIsReportOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <History className="h-4 w-4 text-slate-700" />
          <span>Scan History ({scans.length})</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          {completedScans.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSessionReport}
              className="text-xs h-7 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-300"
            >
              <FileCheck className="h-3 w-3" />
              <span>Session Report ({completedScans.length})</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pb-2">
        <div className="mb-3">
          <Input
            placeholder="Search scans by file name, product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="text-xs"
          />
        </div>
      </CardContent>

      {/* Desktop Table View (>=md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Image / File</th>
              <th className="px-3 py-3">Timestamp</th>
              <th className="px-3 py-3">Product Name</th>
              <th className="px-3 py-3">Confidence</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredScans.map((scan) => (
              <tr
                key={scan.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      <img
                        src={scan.imageDataUrl}
                        alt={scan.imageName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {scan.imageName}
                    </span>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[11px]">{scan.timestamp}</span>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px] block">
                    {scan.extractedData?.productName || ' - '}
                  </span>
                </td>

                <td className="px-3 py-3 font-mono">
                  {scan.status === 'completed' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${getConfidenceBarColor(scan.confidence)}`}
                          style={{ width: `${Math.min(100, scan.confidence)}%` }}
                        />
                      </div>
                      <span className={`font-semibold text-[11px] ${getConfidenceColor(scan.confidence)}`}>
                        {Math.round(scan.confidence)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400"> - </span>
                  )}
                </td>

                <td className="px-3 py-3">
                  {getStatusBadge(scan)}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {scan.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReport(scan)}
                          className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40 gap-1"
                          title="Generate Single Product Report"
                        >
                          <FileCheck className="h-3 w-3" />
                          <span>Report</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewScan(scan)}
                          className="h-7 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScan(scan.id)}
                      className="h-7 text-xs text-slate-500 hover:text-red-600 gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredScans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                  No scans match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards View (<md) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredScans.map((scan) => (
          <div key={scan.id} className="p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                  <img
                    src={scan.imageDataUrl}
                    alt={scan.imageName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {scan.extractedData?.productName || scan.imageName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="font-mono">{scan.timestamp}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {getStatusBadge(scan)}
              </div>
            </div>

            {/* Confidence Bar */}
            {scan.status === 'completed' && (
              <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Declaration Accuracy:</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getConfidenceBarColor(scan.confidence)}`}
                      style={{ width: `${Math.min(100, scan.confidence)}%` }}
                    />
                  </div>
                  <span className={`font-mono font-bold text-xs ${getConfidenceColor(scan.confidence)}`}>
                    {Math.round(scan.confidence)}%
                  </span>
                </div>
              </div>
            )}

            {/* Touch Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {scan.status === 'completed' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenReport(scan)}
                    className="flex-1 text-xs gap-1.5 min-h-[38px] justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Report</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewScan(scan)}
                    className="flex-1 text-xs gap-1.5 min-h-[38px] justify-center"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect</span>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteScan(scan.id)}
                className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[38px] px-3"
                title="Delete scan"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {filteredScans.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-xs">
            No scans match your search.
          </div>
        )}
      </div>

      {/* Compliance Inspection Report Modal */}
      {activeReport && (
        <ComplianceReportModal
          report={activeReport}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          onRegenerate={(opts) => {
            if (activeReport.reportType === 'inspection-session') {
              const updated = reportService.generateSessionInspectionReport(
                completedScans,
                validationResults,
                readabilityResults,
                opts
              );
              addReport(updated);
              setActiveReport(updated);
            } else {
              const scan = scans.find((s) => s.id === activeReport.scanId);
              if (scan) {
                const valResult = validationResults[scan.id];
                const readResult = readabilityResults[scan.id] || scan.readabilityResult;
                const updated = reportService.generateComplianceReport(scan, valResult, readResult, opts);
                addReport(updated);
                setActiveReport(updated);
              }
            }
          }}
        />
      )}
    </Card>
  );
};
