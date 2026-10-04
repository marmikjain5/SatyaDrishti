export type InspectionAuditEventType =
  | 'SCN_APPROVED'
  | 'SCN_SENT'
  | 'SCN_DISPATCH_FAILED'
  | 'EVIDENCE_REVIEWED';

export interface InspectionAuditEvent {
  eventId: string;
  caseId: string;
  type: InspectionAuditEventType;
  actorId: string;
  actorName: string;
  occurredAt: string;
  payload: Record<string, unknown>;
  previousHash: string | null;
  eventHash: string;
}

const STORAGE_PREFIX = 'satyadrishti:inspection-audit:';

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
    .join(',')}}`;
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const result = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function storageKey(caseId: string): string {
  return `${STORAGE_PREFIX}${caseId}`;
}

export async function listInspectionAuditEvents(caseId: string): Promise<InspectionAuditEvent[]> {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(storageKey(caseId));
  if (!raw) return [];
  try {
    const events = JSON.parse(raw) as InspectionAuditEvent[];
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

export async function appendInspectionAuditEvent(input: {
  caseId: string;
  type: InspectionAuditEventType;
  actorId: string;
  actorName: string;
  payload: Record<string, unknown>;
}): Promise<InspectionAuditEvent> {
  const previousEvents = await listInspectionAuditEvents(input.caseId);
  const previousHash = previousEvents.at(-1)?.eventHash || null;
  const unsignedEvent = {
    eventId: `${input.caseId}-${Date.now()}-${crypto.randomUUID()}`,
    ...input,
    occurredAt: new Date().toISOString(),
    previousHash,
  };
  const event: InspectionAuditEvent = {
    ...unsignedEvent,
    eventHash: await digest(unsignedEvent),
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(storageKey(input.caseId), JSON.stringify([...previousEvents, event]));
  }
  return event;
}

export async function verifyInspectionAuditTrail(caseId: string): Promise<boolean> {
  const events = await listInspectionAuditEvents(caseId);
  let previousHash: string | null = null;
  for (const event of events) {
    const { eventHash, ...unsignedEvent } = event;
    if (event.previousHash !== previousHash || await digest(unsignedEvent) !== eventHash) return false;
    previousHash = eventHash;
  }
  return true;
}
