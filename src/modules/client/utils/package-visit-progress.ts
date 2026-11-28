import type { PackageFulfillmentRecord, PackageOrderItemRecord } from '@/modules/client/api';

export type PackageVisitState = 'completed' | 'scheduled' | 'partial' | 'pending' | 'available' | 'unavailable';

const count = (value: number | string | null | undefined): number | null => {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
};

const serviceId = (value: number | string | null | undefined) => String(value ?? '').trim();

/** Build customer-facing visit rounds from separately numbered service records. */
export function buildPackageVisitProgress(
  items: ReadonlyArray<PackageOrderItemRecord | null> | null | undefined,
  fulfillments: ReadonlyArray<PackageFulfillmentRecord | null> | null | undefined,
  canSchedule: boolean,
) {
  const packageItems: ReadonlyArray<PackageOrderItemRecord | null> = Array.isArray(items) ? items : [];
  const history: ReadonlyArray<PackageFulfillmentRecord | null> = Array.isArray(fulfillments) ? fulfillments : [];
  const quotaKeys = new Set<string>();
  const quotas = packageItems.flatMap((item) => {
    if (!item) return [];
    const sku = serviceId(item.skuId);
    const spu = serviceId(item.spuId);
    const key = sku && Number(item.bindType) !== 1 ? `SKU${sku}` : spu ? `SPU${spu}` : '';
    if (key) quotaKeys.add(key);
    const total = count(item.totalTimes) ?? count(item.redeemTimes) ?? 0;
    if (!total) return [];
    const remaining = count(item.remainingTimes);
    const occupied = remaining == null ? count(item.occupiedTimes) : total - remaining;
    return [{ total, occupied, key }];
  });

  const byService = new Map<string, Array<{
    index: number;
    sequence: number;
    state: 'completed' | 'scheduled' | 'pending';
  }>>();
  history.forEach((visit, index) => {
    if (!visit || Number(visit.scheduleStatus) === 2) return;
    const quota = /-(SPU\d+|SKU\d+)-N\d+$/i.exec(visit.fulfillmentNo?.trim() ?? '')?.[1];
    const sku = serviceId(visit.skuId);
    const spuKey = `SPU${serviceId(visit.spuId)}`;
    const skuKey = `SKU${sku}`;
    const useSku = quotaKeys.has(skuKey) || (sku !== '' && !quotaKeys.has(spuKey));
    const key = quota?.toUpperCase() ?? (useSku ? skuKey : spuKey);
    const serviceStatus = Number(visit.serviceStatus);
    const state = serviceStatus === 2
      ? 'completed'
      : Number(visit.scheduleStatus) === 1 || [1, 3, 4].includes(serviceStatus)
        ? 'scheduled'
        : 'pending';
    const rows = byService.get(key) ?? [];
    rows.push({ index, sequence: count(visit.seqNo) || index + 1, state });
    byService.set(key, rows);
  });

  const longestQuota = quotas.reduce((longest, quota) => Math.max(longest, quota.total), 0);
  const total = longestQuota || [...byService.values()].reduce((longest, rows) => Math.max(longest, rows.length), 0);
  const numberByFulfillment = new Map<number, number>();
  const visitsByNumber = new Map<number, PackageVisitState[]>();
  for (const rows of byService.values()) {
    rows.sort((a, b) => a.sequence - b.sequence);
    // Cancellations leave gaps in the server sequence but return the purchased visit.
    rows.slice(0, total).forEach((row, index) => {
      const number = index + 1;
      numberByFulfillment.set(row.index, number);
      const states = visitsByNumber.get(number) ?? [];
      states.push(row.state);
      visitsByNumber.set(number, states);
    });
  }

  const balances = quotas.map(({ total: limit, occupied, key }) => ({
    limit,
    occupied: occupied == null ? null : Math.max(0, occupied, byService.get(key)?.length ?? 0),
  }));
  let completed = 0;
  let scheduled = 0;
  let available = 0;
  let next: number | null = null;
  const rounds = Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const states = visitsByNumber.get(number) ?? [];
    const open = balances.some(({ limit, occupied }) => occupied != null && number > occupied && number <= limit);
    const reserved = balances.some(({ occupied, limit }) => occupied != null && number <= occupied && number <= limit);
    if (open && canSchedule) {
      next ??= number;
      available += 1;
    }

    let state: PackageVisitState;
    if (states.length && open) state = 'partial';
    else if (states.length && states.every((value) => value === 'completed')) {
      state = 'completed';
      completed += 1;
    } else if (states.some((value) => value === 'scheduled' || value === 'completed')) {
      state = 'scheduled';
      scheduled += 1;
    } else if (states.length || (reserved && !open)) state = 'pending';
    else state = open && canSchedule ? 'available' : 'unavailable';

    return { number, state };
  });

  return { total, completed, scheduled, available, next, rounds, numberByFulfillment };
}
