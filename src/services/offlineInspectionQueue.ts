import type { ScanRecord, UploadedImage } from '../types/scan';
import type { ComplianceValidationResult } from '../types/ruleEngine';
import type { ScanCorrelationResult } from '../lib/scanComplaintCorrelator';

export type InspectionQueueStatus = 'pending' | 'syncing' | 'failed' | 'conflict' | 'synced';

export interface InspectionEvidenceImage {
  name: string;
  type: string;
  blob: Blob;
  sizeBytes: number;
  sha256: string;
}

export interface InspectionRetryEvent {
  at: string;
  message: string;
  retryAt: string;
}

export interface QueuedInspection {
  id: string;
  scan: ScanRecord;
  analysis: {
    validationResult: ComplianceValidationResult;
    correlationResult: ScanCorrelationResult;
  };
  evidenceImages: InspectionEvidenceImage[];
  status: InspectionQueueStatus;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
  conflictMessage?: string;
  idempotencyKey: string;
  retryCount: number;
  nextRetryAt?: string;
  retryHistory: InspectionRetryEvent[];
  lastSyncAt?: string;
}

interface SyncResult {
  id: string;
  status: 'synced' | 'already_synced' | 'conflict';
  message?: string;
}

const DATABASE_NAME = 'satyadrishti-offline-inspections';
const DATABASE_VERSION = 2;
const STORE_NAME = 'inspections';
const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || '';
const UPDATED_EVENT = 'satyadrishti:inspection-queue-updated';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_INSPECTION_BYTES = 24 * 1024 * 1024;
const SYNC_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 30 * 60 * 1000;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open the offline inspection queue.'));
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: Error) => void) => void
): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, mode);
    action(
      tx.objectStore(STORE_NAME),
      (value) => resolve(value),
      reject
    );
    tx.oncomplete = () => database.close();
    tx.onerror = () => {
      database.close();
      reject(tx.error ?? new Error('Offline inspection storage failed.'));
    };
    tx.onabort = () => {
      database.close();
      reject(tx.error ?? new Error('Offline inspection storage was interrupted.'));
    };
  });
}

function notifyUpdated(): void {
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

type QueueRecordWithLegacyMetadata = Omit<QueuedInspection, 'idempotencyKey' | 'retryCount' | 'retryHistory'>
  & Partial<Pick<QueuedInspection, 'idempotencyKey' | 'retryCount' | 'retryHistory'>>;

export function normalizedRecord(record: QueueRecordWithLegacyMetadata): QueuedInspection {
  return {
    ...record,
    idempotencyKey: record.idempotencyKey || record.id,
    retryCount: record.retryCount || 0,
    retryHistory: record.retryHistory || [],
  };
}

async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function retryDelayMs(retryCount: number): number {
  return Math.min(2 ** Math.max(0, retryCount - 1) * 60_000, MAX_RETRY_DELAY_MS);
}

function inspectionSnapshot(scan: ScanRecord): ScanRecord {
  const omitDerivedImages = (data: ScanRecord['extractedData']) =>
    data ? { ...data, preprocessedVariants: undefined } : data;

  return {
    ...scan,
    imageDataUrl: '',
    extractedData: omitDerivedImages(scan.extractedData),
    angles: scan.angles?.map((angle) => ({
      ...angle,
      imageDataUrl: '',
      extractedData: omitDerivedImages(angle.extractedData),
    })),
  };
}

function dataUrlFromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Evidence image could not be prepared for sync.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Evidence image could not be read.'));
    reader.readAsDataURL(blob);
  });
}

async function save(record: QueuedInspection): Promise<void> {
  await transaction<void>('readwrite', (store, resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Could not save the inspection locally.'));
  });
  notifyUpdated();
}

async function updateRecord(
  id: string,
  updates: Partial<Pick<QueuedInspection, 'status' | 'updatedAt' | 'lastError' | 'conflictMessage' | 'retryCount' | 'nextRetryAt' | 'retryHistory' | 'lastSyncAt'>>
): Promise<void> {
  await transaction<void>('readwrite', (store, resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const current = request.result as QueuedInspection | undefined;
      if (!current) {
        reject(new Error(`Inspection ${id} is missing from the local queue.`));
        return;
      }
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      const saveRequest = store.put(updated);
      saveRequest.onsuccess = () => resolve();
      saveRequest.onerror = () => reject(saveRequest.error ?? new Error('Could not update the inspection sync state.'));
    };
    request.onerror = () => reject(request.error ?? new Error('Could not read the inspection sync state.'));
  });
  notifyUpdated();
}

async function buildSyncPayload(record: QueuedInspection) {
  return {
    id: record.id,
    clientCreatedAt: record.createdAt,
    scan: record.scan,
    analysis: record.analysis,
    evidenceImages: await Promise.all(
      record.evidenceImages.map(async (image) => ({
        name: image.name,
        mimeType: image.type,
        dataUrl: await dataUrlFromBlob(image.blob),
        sizeBytes: image.sizeBytes,
        sha256: image.sha256,
      }))
    ),
  };
}

async function cleanupSyncedRecords(records: QueuedInspection[]): Promise<QueuedInspection[]> {
  const cutoff = Date.now() - SYNC_RETENTION_MS;
  const expired = records.filter(
    (record) => record.status === 'synced' && Date.parse(record.updatedAt) < cutoff
  );
  for (const record of expired) {
    await transaction<void>('readwrite', (store, resolve, reject) => {
      const request = store.delete(record.id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Could not clean up synced inspection.'));
    });
  }
  if (expired.length > 0) notifyUpdated();
  return records.filter((record) => !expired.some((item) => item.id === record.id));
}

export const offlineInspectionQueue = {
  async list(): Promise<QueuedInspection[]> {
    return transaction<QueuedInspection[]>('readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () =>
        resolve((request.result as QueuedInspection[]).map(normalizedRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      request.onerror = () => reject(request.error ?? new Error('Could not load offline inspections.'));
    }).then((records) => cleanupSyncedRecords(records));
  },

  async enqueue(
    scan: ScanRecord,
    images: UploadedImage[],
    analysis: QueuedInspection['analysis']
  ): Promise<void> {
    const now = new Date().toISOString();
    const evidenceImages = await Promise.all(images.map(async (image) => {
      const blob = image.file;
      if (blob.size > MAX_IMAGE_BYTES) {
        throw new Error(`${image.name} is too large to save offline. Maximum size is 8 MB.`);
      }
      return {
        name: image.name,
        type: blob.type || 'image/jpeg',
        blob,
        sizeBytes: blob.size,
        sha256: await sha256(blob),
      };
    }));
    if (evidenceImages.reduce((total, image) => total + image.sizeBytes, 0) > MAX_INSPECTION_BYTES) {
      throw new Error('This inspection has too much evidence to save offline. Maximum size is 24 MB.');
    }
    await save({
      id: scan.id,
      scan: inspectionSnapshot(scan),
      analysis,
      evidenceImages,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      idempotencyKey: scan.id,
      retryCount: 0,
      retryHistory: [],
    });
  },

  async saveConflictAsNewInspection(id: string): Promise<void> {
    const record = (await this.list()).find((inspection) => inspection.id === id);
    if (!record) throw new Error('Conflicted inspection was not found in the local queue.');

    const newId = `scan-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await save({
      ...record,
      id: newId,
      scan: { ...record.scan, id: newId },
      evidenceImages: record.evidenceImages,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      lastError: undefined,
      conflictMessage: undefined,
    });
  },

  async restoreScan(record: QueuedInspection): Promise<ScanRecord> {
    const imageDataUrls = await Promise.all(
      record.evidenceImages.map((image) => dataUrlFromBlob(image.blob))
    );
    return {
      ...record.scan,
      imageDataUrl: imageDataUrls[0] || '',
      angles: record.scan.angles?.map((angle, index) => ({
        ...angle,
        imageDataUrl: imageDataUrls[index] || angle.imageDataUrl,
      })),
    };
  },

  async syncPending(): Promise<void> {
    if (!navigator.onLine) return;
    const records = (await this.list()).filter(
      (record) => (record.status === 'pending' || record.status === 'failed')
        && (!record.nextRetryAt || Date.parse(record.nextRetryAt) <= Date.now())
    );
    for (const record of records) {
      await updateRecord(record.id, { status: 'syncing', lastError: undefined });
      try {
        for (const evidence of record.evidenceImages) {
          if (evidence.blob.size !== evidence.sizeBytes || await sha256(evidence.blob) !== evidence.sha256) {
            throw new Error(`Evidence integrity check failed for ${evidence.name}. The inspection was not uploaded.`);
          }
        }
        const response = await fetch(`${BACKEND_BASE_URL}/api/inspections/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': record.idempotencyKey,
          },
          body: JSON.stringify({ inspections: [await buildSyncPayload(record)] }),
        });
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || `Inspection sync failed (${response.status}).`);
        }
        const result = (await response.json()) as { results: SyncResult[] };
        const item = result.results?.find((entry) => entry.id === record.id);
        if (!item) throw new Error('The server did not return a sync result for this inspection.');

        if (item.status === 'conflict') {
          await updateRecord(record.id, {
            status: 'conflict',
            conflictMessage: item.message || 'A different inspection already exists on the server with this ID.',
            nextRetryAt: undefined,
          });
        } else {
          await updateRecord(record.id, {
            status: 'synced',
            conflictMessage: undefined,
            retryCount: 0,
            nextRetryAt: undefined,
            lastSyncAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Inspection sync failed.';
        const retryCount = record.retryCount + 1;
        const nextRetryAt = new Date(Date.now() + retryDelayMs(retryCount)).toISOString();
        await updateRecord(record.id, {
          status: 'failed',
          lastError: message,
          retryCount,
          nextRetryAt,
          retryHistory: [
            ...record.retryHistory,
            { at: new Date().toISOString(), message, retryAt: nextRetryAt },
          ].slice(-10),
        });
      }
    }
  },
};

export function subscribeToInspectionQueueUpdates(listener: () => void): () => void {
  window.addEventListener(UPDATED_EVENT, listener);
  return () => window.removeEventListener(UPDATED_EVENT, listener);
}
