const PURCHASE_STORAGE_KEY = 'hourx.meta.purchases';

type PixelFn = (...args: unknown[]) => void;

type PixelContent = {
  contentId?: string | number | null;
  contentIds?: Array<string | number | null | undefined>;
  contentName?: string | null;
  contentType?: 'product' | 'product_group';
  value?: number | string | null;
  numItems?: number;
};

const seenPurchases = new Set<string>();

const pixel = (): PixelFn | null => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return null;
  return window.fbq;
};

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

export const parseMoney = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? roundMoney(value) : null;
  }
  if (value == null) return null;
  const text = String(value).replace(/aed/gi, '').replace(/,/g, '').trim();
  if (!text) return null;
  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : null;
};

export const purchaseOrderKey = (orderId: string) => {
  const parts = String(orderId || '')
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return [...new Set(parts)].sort().join(',');
};

const contentIdsOf = (event: PixelContent) => {
  const source = event.contentIds?.length ? event.contentIds : [event.contentId];
  return source
    .map((id) => String(id ?? '').trim())
    .filter((id) => id && id !== '0');
};

const contentPayload = (event: PixelContent) => {
  const ids = contentIdsOf(event);
  const name = String(event.contentName ?? '').trim();
  const value = parseMoney(event.value);
  const payload: Record<string, unknown> = { currency: 'AED' };
  if (ids.length) {
    payload.content_ids = ids;
    payload.content_type = event.contentType || 'product';
  }
  if (name) payload.content_name = name;
  if (value != null) payload.value = value;
  if (event.numItems && event.numItems > 0) payload.num_items = event.numItems;
  return payload;
};

const track = (eventName: string, event: PixelContent = {}) => {
  pixel()?.('track', eventName, contentPayload(event));
};

export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.location && (
    /^\/data-deletion\/?$/i.test(window.location.pathname) ||
    /^#\/data-deletion\/?(?:[?#]|$)/i.test(window.location.hash)
  )) return;
  pixel()?.('track', 'PageView');
};

export const trackViewContent = (event: PixelContent) => track('ViewContent', event);

export const trackAddToCart = (event: PixelContent) => track('AddToCart', event);

export const trackInitiateCheckout = (event: PixelContent) => track('InitiateCheckout', event);

export const trackCompleteRegistration = () => {
  pixel()?.('track', 'CompleteRegistration');
};

export const claimPurchase = (orderId: string) => {
  const key = purchaseOrderKey(orderId);
  if (!key || seenPurchases.has(key)) return null;
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = new Set(
        (sessionStorage.getItem(PURCHASE_STORAGE_KEY) || '').split(',').filter(Boolean),
      );
      if (stored.has(key)) {
        seenPurchases.add(key);
        return null;
      }
      stored.add(key);
      const next = [...stored].slice(-40);
      sessionStorage.setItem(PURCHASE_STORAGE_KEY, next.join(','));
    }
  } catch {
    // Keep the in-memory mark when storage is blocked.
  }
  seenPurchases.add(key);
  return key;
};

export const trackPurchaseOnce = (event: PixelContent & { orderId: string }) => {
  const send = pixel();
  if (!send) return false;
  const key = claimPurchase(event.orderId);
  if (!key) return false;
  send('track', 'Purchase', contentPayload(event), { eventID: `purchase.${key}` });
  return true;
};

declare global {
  interface Window {
    fbq?: PixelFn;
  }
}
