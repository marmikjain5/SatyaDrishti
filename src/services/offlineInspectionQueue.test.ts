import { describe, expect, it } from 'vitest';
import { normalizedRecord, retryDelayMs, type QueuedInspection } from './offlineInspectionQueue';

const baseRecord: Omit<QueuedInspection, 'idempotencyKey' | 'retryCount' | 'retryHistory'> = {
  id: 'scan-1',
  scan: {} as QueuedInspection['scan'],
  analysis: {} as QueuedInspection['analysis'],
  evidenceImages: [],
  status: 'failed' as const,
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

describe('offline inspection retry policy', () => {
  it('uses exponential delays and caps retries at thirty minutes', () => {
    expect(retryDelayMs(1)).toBe(60_000);
    expect(retryDelayMs(2)).toBe(120_000);
    expect(retryDelayMs(3)).toBe(240_000);
    expect(retryDelayMs(10)).toBe(30 * 60_000);
  });

  it('normalizes records created before retry metadata existed', () => {
    const normalized = normalizedRecord(baseRecord);
    expect(normalized.idempotencyKey).toBe('scan-1');
    expect(normalized.retryCount).toBe(0);
    expect(normalized.retryHistory).toEqual([]);
  });

  it('preserves existing retry history', () => {
    const normalized = normalizedRecord({
      ...baseRecord,
      idempotencyKey: 'idem-1',
      retryCount: 2,
      retryHistory: [{ at: '2026-10-04T00:00:00.000Z', message: 'offline', retryAt: '2026-10-04T00:02:00.000Z' }],
    });
    expect(normalized.idempotencyKey).toBe('idem-1');
    expect(normalized.retryCount).toBe(2);
    expect(normalized.retryHistory).toHaveLength(1);
  });
});
