import React from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  X,
  Layers,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useScanStore } from '../../store/scanStore';
import { cn } from '../../lib/utils';
import type { ParallelScanJob } from '../../types/scan';

function getStatusIcon(status: ParallelScanJob['status']) {
  switch (status) {
    case 'queued':
      return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    case 'scanning':
      return <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />;
    case 'validating':
      return <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
    case 'failed':
      return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
  }
}

function getStatusBadge(status: ParallelScanJob['status']) {
  switch (status) {
    case 'queued':
      return <Badge variant="neutral" size="sm">Queued</Badge>;
    case 'scanning':
      return <Badge variant="primary" size="sm" dot>Scanning</Badge>;
    case 'validating':
      return <Badge variant="warning" size="sm" dot>Validating</Badge>;
    case 'completed':
      return <Badge variant="success" size="sm">Completed</Badge>;
    case 'failed':
      return <Badge variant="danger" size="sm">Failed</Badge>;
  }
}

function getProgressBarColor(status: ParallelScanJob['status']) {
  switch (status) {
    case 'queued':
      return 'bg-slate-300';
    case 'scanning':
      return 'bg-blue-600';
    case 'validating':
      return 'bg-amber-500';
    case 'completed':
      return 'bg-emerald-500';
    case 'failed':
      return 'bg-red-500';
  }
}

export const ParallelScanQueue: React.FC = () => {
  const {
    parallelScanJobs,
    selectedParallelJobId,
    selectParallelJob,
    removeParallelJob,
    isParallelProcessing,
  } = useScanStore();

  const jobs = Object.values(parallelScanJobs);
  if (jobs.length === 0) return null;

  // Sort: running first, then queued, then completed, then failed
  const statusOrder: Record<string, number> = {
    scanning: 0,
    validating: 1,
    queued: 2,
    completed: 3,
    failed: 4,
  };
  const sortedJobs = [...jobs].sort(
    (a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
  );

  const runningCount = jobs.filter(
    (j) => j.status === 'scanning' || j.status === 'validating'
  ).length;
  const queuedCount = jobs.filter((j) => j.status === 'queued').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;

  return (
    <Card className="border border-slate-200/90 shadow-subtle">
      {/* Header */}
      <CardHeader className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          <span>Parallel Scan Queue</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <Badge variant="primary" size="sm" dot>
              {runningCount} Running
            </Badge>
          )}
          {queuedCount > 0 && (
            <Badge variant="neutral" size="sm">
              {queuedCount} Queued
            </Badge>
          )}
          {completedCount > 0 && (
            <Badge variant="success" size="sm">
              {completedCount} Done
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="danger" size="sm">
              {failedCount} Failed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 space-y-2">
        {/* Queue summary bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1 pb-1">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-indigo-500" />
            {jobs.length} {jobs.length === 1 ? 'product' : 'products'} total
            {isParallelProcessing && (
              <span className="text-blue-600 font-semibold ml-1">
                • Processing...
              </span>
            )}
          </span>
          <span className="font-mono text-slate-400">
            Max {2} concurrent
          </span>
        </div>

        {/* Job cards */}
        <div className="space-y-2">
          {sortedJobs.map((job) => {
            const isSelected = selectedParallelJobId === job.id;
            const canRemove =
              job.status === 'queued' ||
              job.status === 'completed' ||
              job.status === 'failed';
            const canView = job.status === 'completed';

            return (
              <div
                key={job.id}
                className={cn(
                  'rounded-lg border p-3 transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-200 shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50/80'
                )}
                onClick={() => {
                  if (canView) {
                    selectParallelJob(job.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="h-10 w-10 rounded-md border border-slate-200 bg-white overflow-hidden shrink-0">
                    <img
                      src={job.imageDataUrl}
                      alt={job.imageName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Top row: name + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getStatusIcon(job.status)}
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {job.imageName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {getStatusBadge(job.status)}
                        {canRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeParallelJob(job.id);
                            }}
                            className="p-0.5 rounded text-slate-400 hover:text-red-600 transition-colors"
                            title="Remove job"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status message */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-500 truncate">
                        {job.statusMessage}
                      </p>
                      {(job.status === 'scanning' || job.status === 'validating') && (
                        <span className="text-[11px] font-mono font-semibold text-slate-800 shrink-0">
                          {job.progress}%
                        </span>
                      )}
                      {job.status === 'completed' && job.confidence > 0 && (
                        <span className="text-[11px] font-mono font-bold text-emerald-700 shrink-0">
                          {Math.round(job.confidence)}%
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {(job.status === 'scanning' ||
                      job.status === 'validating' ||
                      job.status === 'completed') && (
                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300 ease-out',
                            getProgressBarColor(job.status)
                          )}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error display */}
                    {job.status === 'failed' && job.errorMessage && (
                      <p className="text-[11px] text-red-600 font-medium truncate">
                        {job.errorMessage}
                      </p>
                    )}

                    {/* View button for completed */}
                    {canView && (
                      <div className="pt-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectParallelJob(job.id);
                          }}
                          className={cn(
                            'h-6 text-[11px] gap-1 px-2',
                            isSelected
                              ? 'text-blue-700 bg-blue-100'
                              : 'text-slate-600 hover:text-blue-700'
                          )}
                        >
                          <Eye className="h-3 w-3" />
                          <span>
                            {isSelected ? 'Viewing' : 'View Results'}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
