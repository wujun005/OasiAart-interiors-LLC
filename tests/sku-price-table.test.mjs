import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImportedSkuPriceEditor,
  buildSkuPriceEditor,
  formatSkuMoney,
  skuPriceBases,
  skuPriceTotals,
} from '../src/modules/admin/utils/skuPriceTable.ts';

const labelOf = (value, fallback = '') => {
  if (!value || typeof value !== 'object') return fallback;
  return value.en || value['zh-CN'] || value.zh || fallback;
};

const duct = {
  specTypeId: 339,
  specKey: '339',
  specTypeName: 'Duct AC Cleaning',
  nameI18n: { en: 'Duct AC Cleaning' },
  priced: 1,
  values: [
    { specValueId: 780, specValueName: '带家具', nameI18n: { en: '带家具' }, price: 100 },
    { specValueId: 781, specValueName: '不带家具', nameI18n: { en: '不带家具' }, price: 10 },
  ],
};

const staff = {
  specTypeId: 340,
  specKey: '340',
  specTypeName: '美女',
  nameI18n: { en: '美女' },
  priced: 0,
  values: [
    { specValueId: 783, specValueName: '456', nameI18n: { en: '456' } },
    { specValueId: 782, specValueName: '1212', nameI18n: { en: '1212' } },
  ],
};

test('priced specs collapse out of the rows and their prices are added to the total', () => {
  const editor = buildSkuPriceEditor([duct, staff], [
    { skuId: 4961, price: 90, originalPrice: 100, 339: { en: '带家具', price: 100 }, 340: { en: '456' } },
    { skuId: 4962, price: 90, originalPrice: 100, 339: { en: '带家具', price: 100 }, 340: { en: '1212' } },
    { skuId: 4963, price: 30, originalPrice: 200, 339: { en: '不带家具', price: 10 }, 340: { en: '456' } },
    { skuId: 4964, price: 222, originalPrice: 330, 339: { en: '不带家具', price: 10 }, 340: { en: '1212' } },
  ], labelOf);

  assert.deepEqual(editor.columns.map((column) => column.label), ['美女']);
  assert.deepEqual(editor.rows.map((row) => row.specMap['340']), ['456', '1212']);
  assert.deepEqual(editor.rows.map((row) => row.specValueIds), [[783], [782]]);
  assert.deepEqual(editor.addons, [{
    key: '339',
    label: 'Duct AC Cleaning',
    options: [
      { id: 780, label: '带家具', price: 100 },
      { id: 781, label: '不带家具', price: 10 },
    ],
  }]);
  assert.equal(editor.rows[0].originPrice, null);
  assert.equal(editor.rows[0].discountPrice, null);

  editor.rows[0].originPrice = 100;
  editor.rows[0].discountPrice = 80;
  assert.deepEqual(skuPriceTotals(editor.rows[0].originPrice, editor.rows[0].discountPrice, editor.addons), [
    { label: '带家具', origin: 200, sale: 180, missingPrice: false },
    { label: '不带家具', origin: 110, sale: 90, missingPrice: false },
  ]);
  assert.deepEqual(skuPriceBases(editor.rows), [
    { specValueIds: [783], price: 80, originalPrice: 100 },
    { specValueIds: [782], price: null, originalPrice: null },
  ]);
});

test('a zero discount price uses the original price', () => {
  const totals = skuPriceTotals(100, 0, [{
    key: '341',
    label: 'WithMaterialYAO',
    options: [
      { id: 785, label: 'Without', price: 5 },
      { id: 784, label: 'With', price: 10 },
    ],
  }]);
  assert.deepEqual(totals, [
    { label: 'Without', origin: 105, sale: 0, missingPrice: false },
    { label: 'With', origin: 110, sale: 0, missingPrice: false },
  ]);
  assert.deepEqual(skuPriceTotals(100, null, [{
    key: '341',
    label: 'WithMaterialYAO',
    options: [
      { id: 785, label: 'Without', price: 5 },
      { id: 784, label: 'With', price: 10 },
    ],
  }]), totals);
  assert.deepEqual(skuPriceBases([{
    id: '786',
    specValueIds: [786],
    specMap: {},
    originPrice: 100,
    discountPrice: null,
  }]), [{ specValueIds: [786], price: 100, originalPrice: 100 }]);
});

test('a saved zero discount stays zero when the selling price equals the original price', () => {
  const editor = buildSkuPriceEditor([
    {
      specTypeId: 342,
      specKey: '342',
      priced: 0,
      nameI18n: { en: 'Rooms' },
      values: [
        { specValueId: 787, specValueName: '2 room', nameI18n: { en: '2 room' } },
      ],
    },
    {
      specTypeId: 341,
      specKey: '341',
      priced: 1,
      nameI18n: { en: 'WithMaterialYAO' },
      values: [
        { specValueId: 785, specValueName: 'Without', nameI18n: { en: 'Without' }, price: 5 },
        { specValueId: 784, specValueName: 'With', nameI18n: { en: 'With' }, price: 10 },
      ],
    },
  ], [
    { price: 105, originalPrice: 105, 342: { en: '2 room' }, 341: { en: 'Without', price: 5 } },
    { price: 110, originalPrice: 110, 342: { en: '2 room' }, 341: { en: 'With', price: 10 } },
  ], labelOf);

  assert.deepEqual(editor.rows.map((row) => [row.originPrice, row.discountPrice]), [[100, 0]]);
});

test('a consistent base is restored and unpriced combinations stay as rows', () => {
  const editor = buildSkuPriceEditor([staff, duct], [
    { price: 180, originalPrice: 200, 339: { en: '带家具' }, 340: { en: '456' } },
    { price: 90, originalPrice: 110, 339: { en: '不带家具' }, 340: { en: '456' } },
    { price: 250, originalPrice: 300, 339: { en: '带家具' }, 340: { en: '1212' } },
    { price: 160, originalPrice: 210, 339: { en: '不带家具' }, 340: { en: '1212' } },
  ], labelOf);

  assert.deepEqual(editor.rows.map((row) => [row.specMap['340'], row.originPrice, row.discountPrice]), [
    ['456', 100, 80],
    ['1212', 200, 150],
  ]);
  assert.equal(formatSkuMoney(skuPriceTotals(100, 80, editor.addons)[1].sale), '90');
});

test('services without a priced spec keep one row for every combination', () => {
  const rooms = {
    specTypeId: 1,
    specKey: '1',
    priced: 0,
    nameI18n: { en: 'Rooms' },
    values: [
      { specValueId: 11, specValueName: '1 room', nameI18n: { en: '1 room' } },
      { specValueId: 12, specValueName: '2 room', nameI18n: { en: '2 room' } },
    ],
  };
  const hours = {
    specTypeId: 2,
    specKey: '2',
    priced: 0,
    nameI18n: { en: 'Hours' },
    values: [
      { specValueId: 21, specValueName: '2 hours', nameI18n: { en: '2 hours' } },
    ],
  };
  const editor = buildSkuPriceEditor([rooms, hours], [
    { price: 30, originalPrice: 40, 1: { en: '1 room' }, 2: { en: '2 hours' } },
    { price: 50, originalPrice: 60, 1: { en: '2 room' }, 2: { en: '2 hours' } },
  ], labelOf);

  assert.deepEqual(editor.addons, []);
  assert.equal(skuPriceTotals(30, 40, editor.addons).length, 0);
  assert.deepEqual(editor.rows.map((row) => [row.specMap['1'], row.specMap['2'], row.originPrice, row.discountPrice]), [
    ['1 room', '2 hours', 40, 30],
    ['2 room', '2 hours', 60, 50],
  ]);
});

test('a service whose specs are all priced uses one base row', () => {
  const editor = buildSkuPriceEditor([duct], [
    { price: 180, originalPrice: 200, 339: { en: '带家具', price: 100 } },
    { price: 90, originalPrice: 110, 339: { en: '不带家具', price: 10 } },
  ], labelOf);

  assert.deepEqual(editor.columns, []);
  assert.equal(editor.rows.length, 1);
  assert.deepEqual(editor.rows[0].specValueIds, []);
  assert.equal(editor.rows[0].originPrice, 100);
  assert.equal(editor.rows[0].discountPrice, 80);
  assert.equal(formatSkuMoney(null), '—');
});

const importAddon = {
  specTypeId: 401,
  specKey: '401',
  priced: 1,
  nameI18n: { en: 'Materials' },
  values: [{ specValueId: 801, nameI18n: { en: 'Included' }, price: 20 }],
};

test('import clears a zero sale base that would become the original price', () => {
  const source = [{ price: 20, originalPrice: 120, 401: { en: 'Included' } }];
  const editor = buildImportedSkuPriceEditor([importAddon], source, labelOf);

  assert.deepEqual(editor.rows.map((row) => [row.originPrice, row.discountPrice]), [[null, null]]);
  assert.deepEqual(source, [{ price: 20, originalPrice: 120, 401: { en: 'Included' } }]);
  // The existing maintenance editor retains its established behavior.
  assert.deepEqual(buildSkuPriceEditor([importAddon], source, labelOf).rows
    .map((row) => [row.originPrice, row.discountPrice]), [[100, 0]]);
});

test('import clears a zero original base that would suppress the option surcharge', () => {
  const editor = buildImportedSkuPriceEditor([importAddon], [
    { price: 100, originalPrice: 20, 401: { en: 'Included' } },
  ], labelOf);

  assert.deepEqual(editor.rows.map((row) => [row.originPrice, row.discountPrice]), [[null, null]]);
});

test('import retains ordinary prices and normalizes zero or missing source sale prices', () => {
  for (const price of [0, null]) {
    const source = [{ price, originalPrice: 120, 401: { en: 'Included' } }];
    const editor = buildImportedSkuPriceEditor([importAddon], source, labelOf);
    assert.deepEqual(editor.rows.map((row) => [row.originPrice, row.discountPrice]), [[100, 0]]);
    assert.equal(source[0].price, price);
  }
  const editor = buildImportedSkuPriceEditor([staff, duct], [
    { price: 180, originalPrice: 200, 339: { en: '带家具' }, 340: { en: '456' } },
    { price: 90, originalPrice: 110, 339: { en: '不带家具' }, 340: { en: '456' } },
    { price: 250, originalPrice: 300, 339: { en: '带家具' }, 340: { en: '1212' } },
    { price: 160, originalPrice: 210, 339: { en: '不带家具' }, 340: { en: '1212' } },
  ], labelOf);
  assert.deepEqual(editor.rows.map((row) => [row.originPrice, row.discountPrice]), [[100, 80], [200, 150]]);
});

test('import clears only the base combination whose reconstructed prices differ', () => {
  const editor = buildImportedSkuPriceEditor([staff, importAddon], [
    { price: 20, originalPrice: 120, 401: { en: 'Included' }, 340: { en: '456' } },
    { price: 80, originalPrice: 120, 401: { en: 'Included' }, 340: { en: '1212' } },
  ], labelOf);

  assert.deepEqual(editor.rows.map((row) => [row.specValueIds, row.originPrice, row.discountPrice]), [
    [[783], null, null],
    [[782], 100, 60],
  ]);
});

test('import rejects equally named priced options instead of guessing their different surcharges', () => {
  const ambiguousAddon = {
    ...importAddon,
    values: [
      { specValueId: 801, nameI18n: { en: 'Included' }, price: 20 },
      { specValueId: 802, nameI18n: { en: 'Included' }, price: 40 },
    ],
  };
  const source = [
    { price: 120, originalPrice: 140, 401: { en: 'Included', price: 20 } },
    { price: 120, originalPrice: 140, 401: { en: 'Included', price: 40 } },
  ];
  const editor = buildImportedSkuPriceEditor([ambiguousAddon], source, labelOf);

  assert.deepEqual(editor.rows.map((row) => [row.originPrice, row.discountPrice]), [[null, null]]);
  assert.deepEqual(buildSkuPriceEditor([ambiguousAddon], source, labelOf).rows
    .map((row) => [row.originPrice, row.discountPrice]), [[120, 100]]);
});

test('import clears every ordinary base candidate for an ambiguous source option', () => {
  const ambiguousStaff = {
    ...staff,
    values: [
      { specValueId: 783, nameI18n: { en: 'Same name' } },
      { specValueId: 782, nameI18n: { en: 'Same name' } },
      { specValueId: 784, nameI18n: { en: 'Unique name' } },
    ],
  };
  const editor = buildImportedSkuPriceEditor([ambiguousStaff], [
    { price: 80, originalPrice: 100, 340: { en: 'Same name' } },
    { price: 100, originalPrice: 120, 340: { en: 'Unique name' } },
  ], labelOf);

  assert.deepEqual(editor.rows.map((row) => [row.specValueIds, row.originPrice, row.discountPrice]), [
    [[783], null, null],
    [[782], null, null],
    [[784], 120, 100],
  ]);
});
