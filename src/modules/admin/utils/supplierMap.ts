const text = (value: unknown) => (value == null ? '' : String(value).trim());

const coordinate = (value: unknown, limit: number) => {
  const raw = text(value);
  if (!raw || !Number.isFinite(Number(raw)) || Math.abs(Number(raw)) > limit) return '';
  return raw;
};

export function googleNavigateUrl(order?: {
  latitude?: unknown;
  longitude?: unknown;
  pinLocation?: unknown;
  serviceAddress?: unknown;
  building?: unknown;
  roomNo?: unknown;
  community?: unknown;
} | null) {
  if (!order) return '';
  const latitude = coordinate(order.latitude, 90);
  const longitude = coordinate(order.longitude, 180);
  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}&travelmode=driving`;
  }
  const pin = text(order.pinLocation);
  if (pin) {
    try {
      const url = new URL(pin);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
    } catch {
      // Invalid or unsafe pins fall back to a Google Maps address search.
    }
  }
  const address = [order.serviceAddress, order.building, order.roomNo, order.community]
    .map(text)
    .filter(Boolean)
    .join(', ');
  if (!address) return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}
