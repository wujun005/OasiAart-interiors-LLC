const loginPath = '/api/api/admin/auth/login';
const deletionPath = '/api/api/supplier/account-deletion';

export type SupplierDeletionScope = 'SUPPLIER_ACCOUNT' | 'STAFF_ACCOUNT';
export type SupplierDeletionState = 'REQUESTED' | 'IN_PROGRESS';
export type SupplierDeletionRequest = {
  requestId: string;
  scope: SupplierDeletionScope;
  status: SupplierDeletionState;
  requestedAt: string;
};

export class SupplierDeletionError extends Error {
  readonly httpStatus: number;
  readonly code: string;

  constructor(httpStatus: number, code: string = '') {
    super('SUPPLIER_ACCOUNT_DELETION_ERROR');
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

const asObject = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;

async function send(path: string, body?: object, token?: string, signal?: AbortSignal): Promise<unknown> {
  const headers = new Headers({ Accept: 'application/json' });
  if (body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    signal,
  });
  const envelope = asObject(await response.json().catch(() => null));
  const validCode = envelope && (envelope.code == null || envelope.code === 0 || envelope.code === 200);
  const successfulEnvelope = envelope && Object.prototype.hasOwnProperty.call(envelope, 'data') && validCode &&
    (envelope.success === true || (envelope.success === undefined && (envelope.code === 0 || envelope.code === 200)));
  if (!response.ok || !successfulEnvelope) {
    const errorCode = envelope?.errorCode;
    const status = response.ok && typeof envelope?.code === 'number' && envelope.code >= 400
      ? envelope.code : response.status;
    throw new SupplierDeletionError(status, typeof errorCode === 'string' ? errorCode : '');
  }
  return envelope.data;
}

export async function signInForSupplierDeletion(account: string, password: string, signal?: AbortSignal): Promise<string> {
  const data = asObject(await send(loginPath, { account: account.trim(), password, rememberMe: false }, undefined, signal));
  if (typeof data?.token !== 'string' || !data.token || /\s/.test(data.token)) throw new SupplierDeletionError(0);
  return data.token;
}

export const parseSupplierDeletionRecord = (value: unknown): SupplierDeletionRequest | null => {
  if (value === null) return null;
  const data = asObject(value);
  if (!data || typeof data.requestId !== 'string' || !data.requestId.trim() ||
      (data.scope !== 'SUPPLIER_ACCOUNT' && data.scope !== 'STAFF_ACCOUNT') ||
      (data.status !== 'REQUESTED' && data.status !== 'IN_PROGRESS') ||
      typeof data.requestedAt !== 'string' || !Number.isFinite(Date.parse(data.requestedAt))) {
    throw new SupplierDeletionError(0);
  }
  return { requestId: data.requestId, scope: data.scope, status: data.status, requestedAt: data.requestedAt };
};

export async function getSupplierDeletionRequest(token: string, signal?: AbortSignal): Promise<SupplierDeletionRequest | null> {
  return parseSupplierDeletionRecord(await send(deletionPath, undefined, token, signal));
}

export async function createSupplierDeletionRequest(password: string, token: string, signal?: AbortSignal): Promise<SupplierDeletionRequest> {
  const record = parseSupplierDeletionRecord(await send(deletionPath, { password, confirmation: 'DELETE' }, token, signal));
  if (!record) throw new SupplierDeletionError(0);
  return record;
}
