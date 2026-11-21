import http from '@/modules/admin/utils/request';

export type DeletionRequest = {
  requestId: string;
  userId: number;
  status: 'requested' | 'processing' | 'completed';
  requestedAt: string;
  processingAt?: string;
  processingBy?: number;
  completedAt?: string;
  completedBy?: number;
  completionAudit?: string;
};

export type DeletionCompletion = {
  ticketReference: string;
  retentionSummary: string;
  businessObligationsResolved: boolean;
  personalDataErased: boolean;
  externalProcessorsHandled: boolean;
  retentionReviewed: boolean;
  customerNotified: boolean;
};

function unwrap(value: unknown): unknown {
  const result = value as { success?: boolean; data?: unknown };
  return result?.success === true ? result.data : value;
}

function parseRequest(value: unknown): DeletionRequest {
  const item = value as Partial<DeletionRequest> | null;
  if (!item || !['requested', 'processing', 'completed'].includes(item.status || '')
    || typeof item.requestId !== 'string' || !item.requestId.trim()
    || typeof item.userId !== 'number' || !Number.isSafeInteger(item.userId) || item.userId <= 0
    || typeof item.requestedAt !== 'string' || !Number.isFinite(Date.parse(item.requestedAt))) {
    throw new Error('Invalid deletion request response. Refresh and try again.');
  }
  if (item.status === 'completed' && (!item.completedAt || !Number.isFinite(Date.parse(item.completedAt)))) {
    throw new Error('Deletion completion has not been confirmed.');
  }
  return item as DeletionRequest;
}

function authorized(token: string) {
  if (!token) throw new Error('Sign in to the platform administrator account.');
  return { headers: { Authorization: `Bearer ${token}` } };
}

function sameRequest(value: unknown, requestId: string): DeletionRequest {
  const result = parseRequest(unwrap(value));
  if (result.requestId !== requestId) throw new Error('The deletion request has changed. Refresh and try again.');
  return result;
}

export async function listDeletionRequests(params: { status?: string; pageNum: number; pageSize: number }, token: string) {
  const data = unwrap(await http.get('/api/platform/account-deletions', { ...authorized(token), params })) as { list?: unknown[]; total?: number } | null;
  if (!data || !Array.isArray(data.list) || typeof data.total !== 'number' || !Number.isSafeInteger(data.total) || data.total < 0) {
    throw new Error('Invalid deletion queue response. Refresh and try again.');
  }
  return { list: data.list.map(parseRequest), total: data.total };
}

export async function getDeletionRequest(requestId: string, token: string) {
  return sameRequest(await http.get(`/api/platform/account-deletions/${encodeURIComponent(requestId)}`, authorized(token)), requestId);
}

export async function startDeletionRequest(requestId: string, token: string) {
  return sameRequest(await http.post(`/api/platform/account-deletions/${encodeURIComponent(requestId)}/start`, undefined, authorized(token)), requestId);
}

export async function completeDeletionRequest(requestId: string, input: DeletionCompletion, token: string) {
  const result = sameRequest(await http.post(`/api/platform/account-deletions/${encodeURIComponent(requestId)}/complete`, input, authorized(token)), requestId);
  if (result.status !== 'completed') throw new Error('Deletion completion has not been confirmed.');
  return result;
}
