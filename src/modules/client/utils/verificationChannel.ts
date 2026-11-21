const PREFER_EMAIL = 'WHATSAPP_UNREACHABLE_PREFER_EMAIL';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function channelBody(payload: unknown) {
  const root = asRecord(payload);
  const nested = asRecord(root?.data);
  return nested ?? root;
}

export function wantsEmailChannel(payload: unknown) {
  return channelBody(payload)?.preferEmail === true;
}

export function preferEmailHint(payload: unknown, locale: string) {
  const body = channelBody(payload);
  if (body?.preferEmail !== true) return '';
  const chinese = String(locale || '').startsWith('zh');
  const hint = chinese ? body.hintZh : body.hintEn;
  return typeof hint === 'string' ? hint.trim() : '';
}

export function preferEmailErrorCode(error: unknown) {
  const record = asRecord(error);
  const direct = record?.code;
  if (direct === PREFER_EMAIL) return true;
  const data = asRecord(record?.data);
  return data?.errorCode === PREFER_EMAIL;
}
