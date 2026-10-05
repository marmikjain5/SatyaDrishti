import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw, Save, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  offlineInspectionQueue,
  subscribeToInspectionQueueUpdates,
  type QueuedInspection,
} from '../../services/offlineInspectionQueue';
import { useScanStore } from '../../store/scanStore';

const statusLabels = {
  pending: 'Waiting to sync',
  syncing: 'Syncing',
  failed: 'Sync failed',
  conflict: 'Conflict needs review',
  synced: 'Synced',
} as const;

export const OfflineInspectionQueue: React.FC = () => {
  const [inspections, setInspections] = useState<QueuedInspection[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydratedIds = useRef(new Set<string>());
  const restoreOfflineInspections = useScanStore((state) => state.restoreOfflineInspections);

  const refreshQueue = useCallback(async () => {
    try {
      const queuedInspections = await offlineInspectionQueue.list();
      setInspections(queuedInspections);
      const newInspections = queuedInspections.filter((inspection) => !hydratedIds.current.has(inspection.id));
      await restoreOfflineInspections(newInspections);
      newInspections.forEach((inspection) => hydratedIds.current.add(inspection.id));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the offline inspection queue.');
    }
  }, [restoreOfflineInspections]);

  useEffect(() => {
    void refreshQueue();
    const unsubscribe = subscribeToInspectionQueueUpdates(() => void refreshQueue());
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      unsubscribe();
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [refreshQueue]);

  const syncNow = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await offlineInspectionQueue.syncPending();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Could not sync offline inspections.');
    } finally {
      await refreshQueue();
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const syncOnReconnect = () => {
      if (!navigator.onLine) return;
      void offlineInspectionQueue.syncPending().then(() => refreshQueue());
    };
    window.addEventListener('online', syncOnReconnect);
    return () => window.removeEventListener('online', syncOnReconnect);
  }, [refreshQueue]);

  const saveAsNew = async (id: string) => {
    try {
      await offlineInspectionQueue.saveConflictAsNewInspection(id);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save a new copy of this inspection.');
    }
  };

  const pendingCount = inspections.filter(
    (inspection) => inspection.status === 'pending' || inspection.status === 'failed'
  ).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-amber-600" />}
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Offline inspection queue</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Completed scans and original evidence images are saved on this device. Sync is explicit; local findings are not server-verified.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={syncNow}
          disabled={!isOnline || isSyncing || pendingCount === 0}
          isLoading={isSyncing}
          className="shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Now{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </Button>
      </div>

      {!isOnline && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <CloudOff className="h-4 w-4 shrink-0" />
          Offline mode: inspections stay on this device until you reconnect and sync.
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {inspections.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">No saved inspections yet. Completed scans will be retained here for sync.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {inspections.map((inspection) => (
            <li key={inspection.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {inspection.scan.imageName}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    inspection.status === 'synced'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : inspection.status === 'conflict' || inspection.status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {statusLabels[inspection.status]}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {inspection.evidenceImages.length} evidence {inspection.evidenceImages.length === 1 ? 'image' : 'images'} · {new Date(inspection.createdAt).toLocaleString()}
                </p>
                {inspection.scan.extractedData && (
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {inspection.scan.extractedData.productName || 'Product not identified'}
                    {inspection.scan.extractedData.mrp ? ` · MRP ${inspection.scan.extractedData.mrp}` : ''}
                    {' · '}{inspection.scan.confidence}% local OCR confidence
                  </p>
                )}
                {(inspection.lastError || inspection.conflictMessage) && (
                  <p className="mt-1 flex items-start gap-1 text-[11px] text-red-600 dark:text-red-400">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {inspection.conflictMessage || inspection.lastError}
                  </p>
                )}
                {inspection.status === 'failed' && inspection.nextRetryAt && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Retry scheduled for {new Date(inspection.nextRetryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {inspection.retryCount > 0 ? ` · Attempt ${inspection.retryCount}` : ''}
                  </p>
                )}
              </div>
              {inspection.status === 'conflict' && (
                <Button variant="outline" size="sm" onClick={() => void saveAsNew(inspection.id)} className="shrink-0">
                  <Save className="h-3.5 w-3.5" />
                  Save as new inspection
                </Button>
              )}
              {inspection.status === 'synced' && (
                <CheckCircle2 className="hidden h-4 w-4 shrink-0 text-emerald-600 sm:block" />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
