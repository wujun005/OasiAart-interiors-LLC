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

/** 服务端 WHATSAPP_UNREACHABLE_PREFER_EMAIL 的提示。优先用 data.hint，其次用已按语言返回的 message。 */
export function preferEmailMessage(error: unknown, locale: string) {
  if (!preferEmailErrorCode(error)) return '';
  const record = asRecord(error);
  const envelope = asRecord(record?.data);
  const body = asRecord(envelope?.data) ?? envelope;
  const chinese = String(locale || '').startsWith('zh');
  const hint = chinese ? body?.hintZh : body?.hintEn;
  if (typeof hint === 'string' && hint.trim()) return hint.trim();
  const message = typeof record?.message === 'string' ? record.message.trim() : '';
  return message && message !== 'Request failed' ? message : '';
}
