import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Cpu, Layers, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useScanStore } from '../../store/scanStore';
import { cn } from '../../lib/utils';

export const OCRProcessingCard: React.FC = () => {
  const { isProcessing, currentScan, currentProgress, currentStatusMessage, validationResults } = useScanStore();

  if (!isProcessing && !currentScan) return null;

  const isComplete = currentScan?.status === 'completed';
  const isError = currentScan?.status === 'error';
  const valResult = currentScan ? validationResults[currentScan.id] : null;

  // Parse pass info from status message (e.g., "Pass 2/6: Adaptive Threshold")
  const passMatch = currentStatusMessage.match(/Pass (\d+)\/(\d+)/);
  const currentPass = passMatch ? parseInt(passMatch[1]) : 0;
  const totalPasses = passMatch ? parseInt(passMatch[2]) : 0;

  // Count detected declarations from extraction
  const extractedData = currentScan?.extractedData;
  const totalDeclarationsCount = extractedData?.declarations
    ? Object.keys(extractedData.declarations).length
    : 14;

  const detectedDeclarationsCount = extractedData?.declarations
    ? Object.values(extractedData.declarations).filter((d) => d.value && d.value.trim().length > 0).length
    : 0;

  const compliantCount = extractedData?.declarations
    ? Object.values(extractedData.declarations).filter((d) => d.validationStatus === 'compliant').length
    : 0;

  const complianceScore = valResult?.complianceScore ?? (extractedData?.compliancePayload?.mandatorySummary?.compliancePercentage ?? 70);
  const violationsCount = valResult?.violationCount ?? (extractedData?.compliancePayload?.mandatorySummary?.missingCount ?? 0);
  const warningsCount = valResult?.warningCount ?? (extractedData?.compliancePayload?.mandatorySummary?.warningCount ?? 0);
  const passCount = valResult?.passCount ?? (extractedData?.compliancePayload?.mandatorySummary?.compliantCount ?? compliantCount);

  return (
    <Card className="border border-slate-200/90 shadow-subtle">
      {/* Header */}
      <CardHeader className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <Cpu className="h-4 w-4 text-slate-600" />
          <span>Legal Metrology Extraction Engine</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <Badge variant="primary" size="sm" dot>
              Running Pipeline
            </Badge>
          )}
          {isComplete && (
            <Badge variant="success" size="sm">
              Extraction Complete
            </Badge>
          )}
          {isError && (
            <Badge variant="danger" size="sm">
              Failed
            </Badge>
          )}
          {isProcessing && totalPasses > 0 && (
            <Badge variant="neutral" size="sm">
              <Layers className="h-3 w-3" />
              Pass {currentPass}/{totalPasses}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Compact Horizontal Scan Summary Row */}
        {currentScan && (
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Left: Thumbnail & File Metadata */}
              <div className="flex items-center gap-2.5 min-w-0 sm:w-5/12 shrink-0">
                <div className="h-9 w-9 rounded-md border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={currentScan.imageDataUrl}
                    alt={currentScan.imageName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-semibold text-slate-900 truncate leading-snug"
                    title={currentScan.imageName}
                  >
                    {currentScan.imageName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                    {currentScan.timestamp}
                  </p>
                </div>
              </div>

              {/* Subtle separator on sm+ screens */}
              <div className="hidden sm:block h-7 w-px bg-slate-200 shrink-0" />

              {/* Right: Extraction Status & Progress */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700 flex items-center gap-1.5 truncate text-[11px]">
                    {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />}
                    {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    {isError && <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />}
                    <span className="truncate">
                      {currentStatusMessage || 'Initializing engine...'}
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800 text-[11px] shrink-0">
                    {currentProgress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300 ease-out',
                      isError
                        ? 'bg-red-500'
                        : isComplete
                          ? 'bg-emerald-500'
                          : 'bg-blue-600'
                    )}
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>

                {/* Multi-pass progress dots when processing */}
                {isProcessing && totalPasses > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: totalPasses }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          i < currentPass
                            ? 'bg-blue-600'
                            : i === currentPass - 1
                              ? 'bg-blue-400 animate-pulse'
                              : 'bg-slate-200'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Score Summary Row */}
        {isComplete && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/90 bg-white px-4 py-2.5">
            {/* Left: Prominent compact score and label */}
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900 leading-none">
                {complianceScore} <span className="text-base font-semibold text-slate-400">/ 100</span>
              </span>
              <span className="text-xs font-semibold text-slate-600 border-l border-slate-200 pl-2.5 py-0.5 uppercase tracking-wider">
                Compliance Score
              </span>
            </div>

            {/* Right: Key metric badges  -  derived from actual extraction results */}
            <div className="flex items-center gap-2 flex-wrap">
              {extractedData?.declarations && (() => {
                const declValues = Object.values(extractedData.declarations);
                const violations = declValues.filter((d) => d.validationStatus === 'non-compliant' || d.validationStatus === 'missing').length;
                const warnings = declValues.filter((d) => d.validationStatus === 'warning').length;
                const compliant = declValues.filter((d) => d.validationStatus === 'compliant').length;
                const total = declValues.length;
                return (
                  <>
                    {violations > 0 && (
                      <Badge variant="danger" size="sm" className="font-bold">
                        {violations} Violation{violations !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {warnings > 0 && (
                      <Badge variant="warning" size="sm" className="font-bold">
                        {warnings} Warning{warnings !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="success" size="sm" className="gap-1 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{compliant} Compliant</span>
                    </Badge>
                    <Badge variant="neutral" size="sm" className="font-medium text-slate-600">
                      {total} Declaration{total !== 1 ? 's' : ''}
                    </Badge>
                  </>
                );
              })()}
            </div>
          </div>
        )}

            {/* Optical Pass Confidence Breakdown */}
            {isComplete && extractedData?.ocrPassResults && extractedData.ocrPassResults.length > 0 && (
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Optical Pass Confidence Breakdown
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">
                    6-Pass Multi-Spectral Analysis
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {extractedData.ocrPassResults.map((pass, index) => {
                    const passConf = pass.confidence ?? 0;
                    const passBarColor =
                      passConf >= 80
                        ? 'bg-emerald-500'
                        : passConf >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500';
                    const passTextColor =
                      passConf >= 80
                        ? 'text-emerald-700'
                        : passConf >= 50
                          ? 'text-amber-700'
                          : 'text-red-700';

                    return (
                      <div
                        key={pass.name || index}
                        className="rounded-md border border-slate-200/80 bg-slate-50/50 p-2 space-y-1.5 transition-colors hover:bg-slate-50"
                        title={`${pass.description || pass.name || `Pass ${index + 1}`}: ${passConf}%`}
                      >
                        {/* Header: Pass Index & Percentage */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                            Pass {index + 1}
                          </span>
                          <span className={cn('text-xs font-bold font-mono', passTextColor)}>
                            {passConf > 0 ? `${passConf}%` : ' - '}
                          </span>
                        </div>

                        {/* Horizontal Confidence Bar */}
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-300', passBarColor)}
                            style={{ width: `${Math.min(100, Math.max(0, passConf))}%` }}
                          />
                        </div>

                        {/* Subtle Pass Variant Name if available */}
                        {pass.name && (
                          <p className="text-[9px] text-slate-500 truncate font-mono capitalize leading-tight">
                            {pass.name.replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error display */}
            {isError && currentScan?.errorMessage && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 font-medium">{currentScan.errorMessage}</p>
              </div>
            )}
          </CardContent>
    </Card>
  );
};

