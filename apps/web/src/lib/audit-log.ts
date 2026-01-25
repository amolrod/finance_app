export interface AuditEvent {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
}

const STORAGE_KEY = 'financeapp.auditLog';
const MAX_EVENTS = 80;

export const loadAuditLog = (): AuditEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as AuditEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const logAuditEvent = (event: Omit<AuditEvent, 'id' | 'createdAt'>) => {
  if (typeof window === 'undefined') return;
  const payload: AuditEvent = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
    action: event.action,
    detail: event.detail,
    createdAt: new Date().toISOString(),
  };
  const current = loadAuditLog();
  const next = [payload, ...current].slice(0, MAX_EVENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

export const clearAuditLog = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
