import { afterEach, describe, expect, it } from 'vitest';
import { appendInspectionAuditEvent, listInspectionAuditEvents, verifyInspectionAuditTrail } from './inspectionAuditService';

const originalStorage = globalThis.localStorage;

function installStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
}

afterEach(() => Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage }));

describe('inspection audit trail', () => {
  it('chains approval and dispatch events and verifies the chain', async () => {
    installStorage();
    await appendInspectionAuditEvent({ caseId: 'case-1', type: 'SCN_APPROVED', actorId: 'i-1', actorName: 'Inspector', payload: { ruleCode: 'R6' } });
    await appendInspectionAuditEvent({ caseId: 'case-1', type: 'SCN_SENT', actorId: 'i-1', actorName: 'Inspector', payload: { messageId: 'msg-1' } });

    const events = await listInspectionAuditEvents('case-1');
    expect(events).toHaveLength(2);
    expect(events[1].previousHash).toBe(events[0].eventHash);
    await expect(verifyInspectionAuditTrail('case-1')).resolves.toBe(true);
  });

  it('detects changed audit payloads', async () => {
    installStorage();
    await appendInspectionAuditEvent({ caseId: 'case-2', type: 'EVIDENCE_REVIEWED', actorId: 'i-1', actorName: 'Inspector', payload: { image: 'original.jpg' } });
    const events = await listInspectionAuditEvents('case-2');
    events[0].payload.image = 'changed.jpg';
    localStorage.setItem('satyadrishti:inspection-audit:case-2', JSON.stringify(events));
    await expect(verifyInspectionAuditTrail('case-2')).resolves.toBe(false);
  });
});
