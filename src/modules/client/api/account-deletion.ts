import http from '@/modules/client/utils/request';

export type AccountDeletionState = 'none' | 'requested' | 'processing' | 'completed';
export interface AccountDeletionStatus {
  status: AccountDeletionState;
  requestId?: string;
  requestedAt?: string;
  completedAt?: string;
  completionWithinBusinessDays: number;
  reviewWithinBusinessDays?: number;
}

// Both ApiResponse envelopes and already-unwrapped responses are used by the
// shared client HTTP adapter. Unknown payloads must never become a success.
export function parseAccountDeletionStatus(value: unknown): AccountDeletionStatus {
  if (!value || typeof value !== 'object') throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
  const envelope = value as Record<string, unknown>;
  if (envelope.success === false ||
      (typeof envelope.code === 'number' && ![0, 200].includes(envelope.code))) {
    throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
  }
  const raw = typeof envelope.status === 'string' ? envelope : envelope.data;
  if (!raw || typeof raw !== 'object') throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
  const record = raw as Record<string, unknown>;
  if (!['none', 'requested', 'processing', 'completed'].includes(String(record.status)) ||
      record.completionWithinBusinessDays !== 7) {
    throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
  }
  const result: AccountDeletionStatus = {
    status: record.status as AccountDeletionState,
    completionWithinBusinessDays: 7,
  };
  if (record.requestId !== undefined && record.requestId !== null) {
    if (typeof record.requestId !== 'string' || !record.requestId.trim()) {
      throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
    }
    result.requestId = record.requestId;
  }
  for (const key of ['requestedAt', 'completedAt'] as const) {
    if (record[key] !== undefined && record[key] !== null) {
      if (typeof record[key] !== 'string' || !Number.isFinite(Date.parse(record[key] as string))) {
        throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
      }
      result[key] = record[key] as string;
    }
  }
  if (result.status !== 'none' && (!result.requestId || !result.requestedAt)) {
    throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
  }
  if (result.status === 'completed' && !result.completedAt) {
    throw new Error('ACCOUNT_DELETION_UNAVAILABLE');
  }
  return result;
}

export async function getAccountDeletionStatus(ownerToken: string): Promise<AccountDeletionStatus> {
  return parseAccountDeletionStatus(await http.get('/client/user/account-deletion', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  }));
}

export async function submitAccountDeletionRequest(password: string, ownerToken: string): Promise<AccountDeletionStatus> {
  // Passwords are passed unchanged. The server identifies the current token
  // owner; no account/user ID supplied by a form can select another customer.
  const result = parseAccountDeletionStatus(await http.post('/client/user/account-deletion', {
    password,
    confirmation: 'DELETE',
  }, { headers: { Authorization: `Bearer ${ownerToken}` } }));
  if (result.status === 'none') throw new Error('ACCOUNT_DELETION_UNCONFIRMED');
  return result;
}
