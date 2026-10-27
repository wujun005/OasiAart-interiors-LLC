import { getAvailableSelectTime } from '@/modules/client/api';

export interface PackageBookingTime {
  time: string;
  timeRange: number;
  available: boolean;
}

const normalizeTime = (time: string) => time.trim().replace(/[–—]/g, '-').replace(/\s+/g, '')
  .replace(/\b(\d):/g, '0$1:');
const isAvailable = (value: unknown) => value === true || value === 1 || value === '1';

/** Offer only slots available for every included service. Any failed lookup fails closed. */
export const loadPackageBookingTimes = async (spuIds: string[], serviceDate: string): Promise<PackageBookingTime[]> => {
  const ids = [...new Set(spuIds)].sort();
  if (!ids.length || ids.some((id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))) {
    throw new Error('Invalid package services');
  }
  const results = await Promise.all(ids.map((spuId) => getAvailableSelectTime({ spuId: Number(spuId), serviceTime: serviceDate })));
  const slots = results.map((rows) => {
    if (!Array.isArray(rows)) throw new Error('Unable to load package availability');
    const values = new Map<string, PackageBookingTime>();
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const time = typeof row.time === 'string' ? row.time.trim() : '';
      const timeRange = Number(row.timeRange);
      if (!time || !Number.isSafeInteger(timeRange) || timeRange <= 0) continue;
      const key = `${timeRange}:${normalizeTime(time)}`;
      const available = isAvailable(row.avaiable ?? row.available);
      const previous = values.get(key);
      values.set(key, { time, timeRange, available: available && (previous?.available ?? true) });
    }
    return values;
  });
  return [...slots[0]!.entries()].filter(([key, slot]) => slot.available && slots.every((map) => map.get(key)?.available))
    .map(([, slot]) => slot);
};
