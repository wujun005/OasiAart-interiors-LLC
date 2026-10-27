export type SkuPriceColumn = { key: string; label: string };

export type SkuPriceAddonOption = {
  id: number;
  label: string;
  price: number | null;
};

export type SkuPriceAddonGroup = {
  key: string;
  label: string;
  options: SkuPriceAddonOption[];
};

export type SkuPriceRow = {
  id: string;
  specValueIds: number[];
  specMap: Record<string, string>;
  originPrice: number | null;
  discountPrice: number | null;
};

export type SkuPriceEditor = {
  columns: SkuPriceColumn[];
  rows: SkuPriceRow[];
  addons: SkuPriceAddonGroup[];
};

export type SkuPriceTotalLine = {
  label: string;
  origin: number | null;
  sale: number | null;
  missingPrice: boolean;
};

type NameFn = (
  value: Record<string, unknown> | null | undefined,
  fallback?: string,
) => string;

type PriceOption = SkuPriceAddonOption & { names: Set<string> };

type PriceDimension = {
  key: string;
  label: string;
  priced: boolean;
  options: PriceOption[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const textSet = (value: unknown, extra: unknown[] = []) => {
  const names = new Set<string>();
  const add = (item: unknown) => {
    if (typeof item === 'string' && item.trim()) names.add(item.trim());
  };
  const record = asRecord(value);
  if (record) {
    Object.entries(record).forEach(([key, item]) => {
      if (key === 'price' || key === 'remarkI18n') return;
      add(item);
    });
  }
  extra.forEach(add);
  return names;
};

const moneyOrNull = (value: unknown) => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : null;
};

const cents = (value: number) => Math.round(value * 100);

const cartesian = <T>(lists: T[][]): T[][] => {
  if (!lists.length) return [[]];
  return lists.reduce<T[][]>(
    (rows, list) => rows.flatMap((row) => list.map((item) => [...row, item])),
    [[]],
  );
};

const matchOption = (cell: unknown, options: PriceOption[]) => {
  const names = textSet(cell);
  const hits = options.filter((option) =>
    [...option.names].some((name) => names.has(name)),
  );
  if (hits.length === 1) return hits[0];
  return hits.find((option) => names.has(option.label)) ?? null;
};

const dimensionsOf = (specTypes: unknown[], labelOf: NameFn) => {
  const dimensions: PriceDimension[] = [];
  specTypes.forEach((item, index) => {
    const type = asRecord(item);
    if (!type) return;
    const key = String(type.specKey ?? type.specTypeId ?? index);
    const values = Array.isArray(type.values) ? type.values : [];
    const priced = Number(type.priced) === 1;
    const options = values.flatMap((entry) => {
      const value = asRecord(entry);
      if (!value) return [];
      const id = Number(value.specValueId);
      if (!Number.isFinite(id) || id <= 0) return [];
      const label = labelOf(
        asRecord(value.nameI18n),
        String(value.specValueName || id),
      );
      return [{
        id,
        label,
        price: priced ? moneyOrNull(value.price) : null,
        names: textSet(value.nameI18n, [value.specValueName, label]),
      }];
    });
    dimensions.push({
      key,
      label: labelOf(asRecord(type.nameI18n), String(type.specTypeName || key)),
      priced,
      options,
    });
  });
  return dimensions;
};

const addonCents = (sku: Record<string, unknown>, priced: PriceDimension[]) => {
  let total = 0;
  for (const dimension of priced) {
    const option = matchOption(sku[dimension.key], dimension.options);
    if (!option || option.price == null) return null;
    total += cents(option.price);
  }
  return total;
};

const baseFromSkus = (
  skus: Record<string, unknown>[],
  combo: PriceOption[],
  unpriced: PriceDimension[],
  priced: PriceDimension[],
) => {
  const matched = skus.filter((sku) =>
    unpriced.every((dimension, index) =>
      matchOption(sku[dimension.key], dimension.options)?.id === combo[index]?.id,
    ),
  );
  const samples: { origin: number; sale: number }[] = [];
  for (const sku of matched) {
    const price = moneyOrNull(sku.price);
    if (price == null) continue;
    const addon = addonCents(sku, priced);
    if (addon == null) return { originPrice: null, discountPrice: null };
    const sale = (cents(price) - addon) / 100;
    const original = moneyOrNull(sku.originalPrice);
    const origin = original == null ? sale : (cents(original) - addon) / 100;
    if (sale < 0 || origin < 0) return { originPrice: null, discountPrice: null };
    samples.push({ origin, sale });
  }
  if (!samples.length) return { originPrice: null, discountPrice: null };
  const first = samples[0];
  const agreed = samples.every(
    (item) => cents(item.origin) === cents(first.origin) && cents(item.sale) === cents(first.sale),
  );
  return agreed
    ? {
        originPrice: first.origin,
        discountPrice: cents(first.sale) === cents(first.origin) ? 0 : first.sale,
      }
    : { originPrice: null, discountPrice: null };
};

export const buildSkuPriceEditor = (
  specTypes: unknown[],
  skus: unknown[],
  labelOf: NameFn,
): SkuPriceEditor => {
  const dimensions = dimensionsOf(specTypes, labelOf);
  const unpriced = dimensions.filter((dimension) => !dimension.priced && dimension.options.length);
  const priced = dimensions.filter((dimension) => dimension.priced && dimension.options.length);
  const skuRows = skus.flatMap((item) => {
    const sku = asRecord(item);
    return sku ? [sku] : [];
  });
  const combos = cartesian(unpriced.map((dimension) => dimension.options));
  const rows = combos.map((combo) => {
    const specMap: Record<string, string> = {};
    combo.forEach((option, index) => {
      specMap[unpriced[index].key] = option.label;
    });
    const base = baseFromSkus(skuRows, combo, unpriced, priced);
    const specValueIds = combo.map((option) => option.id);
    return {
      id: specValueIds.join(',') || 'base',
      specValueIds,
      specMap,
      originPrice: base.originPrice,
      discountPrice: base.discountPrice,
    };
  });
  return {
    columns: unpriced.map((dimension) => ({ key: dimension.key, label: dimension.label })),
    rows,
    addons: priced.map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      options: dimension.options.map(({ id, label, price }) => ({ id, label, price })),
    })),
  };
};

/** 优惠价留空或为 0 表示不优惠，售价按原价。 */
export const effectiveSalePrice = (origin: number | null, sale: number | null) => {
  if (sale == null || cents(sale) === 0) return origin;
  return sale;
};

export const skuPriceTotals = (
  origin: number | null,
  sale: number | null,
  groups: SkuPriceAddonGroup[],
): SkuPriceTotalLine[] => {
  const lists = groups.filter((group) => group.options.length);
  if (!lists.length) return [];
  const noDiscount = sale == null || cents(sale) === 0;
  return cartesian(lists.map((group) => group.options)).map((options) => {
    const missingPrice = options.some((option) => option.price == null);
    const addon = missingPrice
      ? null
      : options.reduce((sum, option) => sum + cents(option.price as number), 0) / 100;
    return {
      label: options.map((option) => option.label).join(' · '),
      missingPrice,
      origin: origin == null || addon == null ? null : (cents(origin) + cents(addon)) / 100,
      sale: noDiscount
        ? 0
        : addon == null ? null : (cents(sale as number) + cents(addon)) / 100,
    };
  });
};

export const formatSkuMoney = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return '—';
  const amount = Math.abs(cents(value));
  const whole = Math.floor(amount / 100);
  const fraction = amount % 100;
  const text = fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
  return value < 0 ? `-${text}` : text;
};

export const skuPriceBases = (rows: SkuPriceRow[]) =>
  rows.map((row) => ({
    specValueIds: [...row.specValueIds],
    price: effectiveSalePrice(row.originPrice, row.discountPrice),
    originalPrice: row.originPrice,
  }));

/** Imported prices must survive both the editor's zero-discount and the server's zero-base rules. */
export const buildImportedSkuPriceEditor = (
  specTypes: unknown[],
  skus: unknown[],
  labelOf: NameFn,
): SkuPriceEditor => {
  const sourceSkus: Record<string, unknown>[] = skus.flatMap((item) => {
    const sku = asRecord(item);
    if (!sku) return [];
    const price = moneyOrNull(sku.price);
    return [{
      ...sku,
      price: price == null || cents(price) === 0 ? moneyOrNull(sku.originalPrice) : price,
    }];
  });
  const editor = buildSkuPriceEditor(specTypes, sourceSkus, labelOf);
  const dimensions = dimensionsOf(specTypes, labelOf);
  const unpriced = dimensions.filter((dimension) => !dimension.priced && dimension.options.length);
  const priced = dimensions.filter((dimension) => dimension.priced && dimension.options.length);
  const withAddon = (base: number, addon: number) => cents(base) === 0 ? 0 : cents(base) + addon;
  const candidates = (sku: Record<string, unknown>, dimension: PriceDimension) => {
    const names = textSet(sku[dimension.key]);
    return dimension.options.filter((option) => [...option.names].some((name) => names.has(name)));
  };
  const sourceMatches = sourceSkus.map((sku) => ({
    sku,
    unpriced: unpriced.map((dimension) => candidates(sku, dimension)),
    priced: priced.map((dimension) => candidates(sku, dimension)),
  }));

  editor.rows.forEach((row) => {
    const baseOriginal = row.originPrice;
    const baseSale = effectiveSalePrice(row.originPrice, row.discountPrice);
    // An ambiguous ordinary option can affect each candidate base row; an unknown one can affect any row.
    const matched = sourceMatches.filter((source) => source.unpriced.every((options, index) =>
      !options.length || options.some((option) => option.id === row.specValueIds[index]),
    ));
    const reversible = baseOriginal != null && baseSale != null && matched.length > 0
      && matched.every((source) => {
        if ([...source.unpriced, ...source.priced].some((options) => options.length !== 1)) return false;
        if (source.priced.some((options) => options[0].price == null)) return false;
        const { sku } = source;
        const sale = moneyOrNull(sku.price);
        const original = moneyOrNull(sku.originalPrice) ?? sale;
        const addon = source.priced.reduce((total, options) => total + cents(options[0].price as number), 0);
        if (sale == null || original == null) return false;
        const rebuiltOriginal = withAddon(baseOriginal, addon);
        const rebuiltSale = withAddon(baseSale, addon);
        const actualSale = rebuiltSale === 0 ? rebuiltOriginal : rebuiltSale;
        return actualSale === cents(sale) && rebuiltOriginal === cents(original);
      });
    if (!reversible) {
      row.originPrice = null;
      row.discountPrice = null;
    }
  });
  return editor;
};
