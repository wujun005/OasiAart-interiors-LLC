export type CoverageFilter = 'all' | 'uncovered' | 'single' | 'sufficient' | 'negative';

type CoverageRisk = Exclude<CoverageFilter, 'all'>;
export type CoverageRiskCounts = Record<CoverageRisk, number>;

type CoverageRiskItem = {
  spuId?: unknown;
  packageId?: unknown;
  status?: unknown;
  fulfillableSupplierCount?: unknown;
  minProfitRate?: unknown;
};

type CoverageRiskCategory = {
  services?: readonly (CoverageRiskItem | null | undefined)[] | null;
  packages?: readonly (CoverageRiskItem | null | undefined)[] | null;
};

function numberOf(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function matchesCoverageFilter(item: CoverageRiskItem | null | undefined, filter: CoverageFilter): boolean {
  if (filter === 'all') return true;
  if (!item || numberOf(item.status) !== 1) return false;

  if (filter === 'negative') {
    const minimum = numberOf(item.minProfitRate);
    return minimum !== null && minimum < 0;
  }

  const fulfillable = numberOf(item.fulfillableSupplierCount);
  if (filter === 'sufficient') return fulfillable !== null && fulfillable >= 2;
  return fulfillable === (filter === 'uncovered' ? 0 : 1);
}

function itemIdentity(value: unknown): string | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  if (typeof value !== 'string') return null;
  const id = value.trim();
  if (!/^\d+$/.test(id)) return null;
  return id.replace(/^0+/, '') || null;
}

const riskFilters = ['uncovered', 'single', 'negative'] as const;

export function countCoverageRisks(
  categories: readonly (CoverageRiskCategory | null | undefined)[],
  kind: 'service' | 'package',
): CoverageRiskCounts {
  const identities: Record<CoverageRisk, Set<string>> = {
    uncovered: new Set(),
    single: new Set(),
    negative: new Set(),
  };
  const listKey = kind === 'service' ? 'services' : 'packages';
  const idKey = kind === 'service' ? 'spuId' : 'packageId';

  for (const category of categories) {
    for (const item of category?.[listKey] ?? []) {
      const id = itemIdentity(item?.[idKey]);
      if (id === null) continue;
      for (const filter of riskFilters) {
        if (matchesCoverageFilter(item, filter)) identities[filter].add(id);
      }
    }
  }

  return {
    uncovered: identities.uncovered.size,
    single: identities.single.size,
    negative: identities.negative.size,
  };
}
