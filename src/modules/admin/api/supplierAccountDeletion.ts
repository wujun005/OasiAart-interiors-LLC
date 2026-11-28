import http from '@/modules/admin/utils/request';
import { parseSupplierDeletionRecord, type SupplierDeletionRequest } from '@/modules/client/api/supplier-account-deletion';

const queuePath = '/api/platform/supplier-account-deletions';

export type SupplierDeletionQueueRecord = SupplierDeletionRequest & {
  supplierId: string;
  adminUserId: string;
  updatedAt: string;
  startedAt: string | null;
  startedBy: string | null;
};

function authorized(token: string) {
  if (!token) throw new Error('Platform administrator authentication is required.');
  return { headers: { Authorization: `Bearer ${token}` } };
}

function unwrap(value: unknown): unknown {
  if (value && typeof value === 'object' && 'success' in value) {
    if (value.success !== true || !('data' in value)) throw new Error('Invalid request response.');
    return value.data;
  }
  return value;
}

const validId = (value: unknown): value is string => typeof value === 'string' && /^[1-9]\d*$/.test(value);
const validDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

function parseQueueRecord(value: unknown): SupplierDeletionQueueRecord {
  const record = parseSupplierDeletionRecord(value);
  const raw = value as Partial<SupplierDeletionQueueRecord>;
  if (!record || !validId(raw.supplierId) || !validId(raw.adminUserId) || !validDate(raw.updatedAt)) {
    throw new Error('Invalid supplier deletion request.');
  }
  if (record.status === 'IN_PROGRESS' && (!validDate(raw.startedAt) || !validId(raw.startedBy))) {
    throw new Error('The start of processing is missing its time or operator.');
  }
  return {
    ...record,
    supplierId: raw.supplierId,
    adminUserId: raw.adminUserId,
    updatedAt: raw.updatedAt,
    startedAt: raw.startedAt ?? null,
    startedBy: raw.startedBy ?? null,
  };
}

export async function listSupplierDeletionQueue(
  params: { status?: SupplierDeletionRequest['status']; pageNum: number; pageSize: number },
  token: string,
) {
  const page = unwrap(await http.get(queuePath, { ...authorized(token), params })) as { list?: unknown[]; total?: number } | null;
  if (!page || !Array.isArray(page.list) || typeof page.total !== 'number' || !Number.isSafeInteger(page.total) || page.total < 0) {
    throw new Error('Invalid supplier deletion queue response.');
  }
  return { list: page.list.map(parseQueueRecord), total: page.total };
}

export async function getSupplierDeletionQueueRecord(requestId: string, token: string) {
  const value = await http.get(`${queuePath}/${encodeURIComponent(requestId)}`, authorized(token));
  const record = parseQueueRecord(unwrap(value));
  if (record.requestId !== requestId) throw new Error('The request reference does not match.');
  return record;
}

export async function startSupplierDeletionQueueRecord(requestId: string, token: string) {
  const value = await http.post(`${queuePath}/${encodeURIComponent(requestId)}/start`, undefined, authorized(token));
  const record = parseQueueRecord(unwrap(value));
  if (record.requestId !== requestId || record.status !== 'IN_PROGRESS') throw new Error('Processing status could not be confirmed.');
  return record;
}
