import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(readFileSync(new URL('../src/modules/client/utils/order-addons.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(code, { exports })
const {
  addonGate,
  canAddPaidOrderAddons,
  singleOrderKey,
  addonLineCharge,
  sumAddonCharges,
  addonCatalog,
  addonGroupsFromOptions,
  attachShownAt,
} = exports
const plain = (value) => JSON.parse(JSON.stringify(value))

const paid = { orderId: 11, orderNo: 'HX11', orderType: 1, orderStatus: 1, paymentStatus: 1, spuId: 8 }

test('paid regular orders can add extras, packages and closed orders cannot', () => {
  assert.equal(canAddPaidOrderAddons(paid), true)
  assert.equal(addonGate({ ...paid, orderStatus: 2 }), 'allowed')
  assert.equal(addonGate({ ...paid, orderStatus: 6 }), 'allowed')
  assert.equal(addonGate({ ...paid, paymentStatus: undefined }), 'allowed')
  assert.equal(addonGate({ ...paid, orderStatus: 0 }), 'syncing')
  assert.equal(addonGate({ ...paid, paymentStatus: 0 }), 'syncing')
  assert.equal(addonGate({ ...paid, orderStatus: 3 }), 'blocked')
  assert.equal(addonGate({ ...paid, orderStatus: 4 }), 'blocked')
  assert.equal(addonGate({ ...paid, orderStatus: 5 }), 'blocked')
  assert.equal(addonGate({ ...paid, paymentStatus: 5 }), 'blocked')
  assert.equal(addonGate({ ...paid, orderType: 2 }), 'package')
  assert.equal(addonGate({ ...paid, packageOrder: true }), 'package')
  assert.equal(addonGate({ ...paid, packageId: 9 }), 'package')
  assert.equal(addonGate({ ...paid, orderId: '', orderNo: '' }), 'missing')
  assert.equal(canAddPaidOrderAddons(null), false)
  assert.equal(canAddPaidOrderAddons({ ...paid, orderStatus: null }, 1), true)
  assert.equal(canAddPaidOrderAddons({ ...paid, canAddAttach: true, orderStatus: 3 }), true)
  assert.equal(canAddPaidOrderAddons({ ...paid, canAddAttach: false }), false)
  assert.equal(addonGate({ ...paid, canAddAttach: true, orderStatus: 3 }), 'allowed')
  assert.equal(addonGate({ ...paid, canAddAttach: false }), 'blocked')
  assert.equal(canAddPaidOrderAddons({ ...paid, canAddAttach: null }), true)
})

test('one order reference opens the extra page, a cart of several does not', () => {
  assert.equal(singleOrderKey('88'), '88')
  assert.equal(singleOrderKey(['HX1']), 'HX1')
  assert.equal(singleOrderKey('88, 89'), '')
  assert.equal(singleOrderKey(''), '')
})

test('extra charges add five percent tax the same way as the payment api', () => {
  assert.deepEqual(plain(addonLineCharge('5', 10, 2)), {
    id: '5',
    quantity: 2,
    unitPrice: 10,
    without: 20,
    tax: 1,
    withTax: 21,
  })
  assert.equal(addonLineCharge('5', 10.01, 1).tax, 0.5)
  assert.deepEqual(plain(addonLineCharge('small', 0.1, 3)), {
    id: 'small', quantity: 3, unitPrice: 0.1, without: 0.3, tax: 0.02, withTax: 0.32,
  })
  assert.equal(addonLineCharge('5', 1, 0), null)
  assert.deepEqual(plain(sumAddonCharges([
    addonLineCharge('1', 10, 1),
    addonLineCharge('2', 3.5, 2),
  ])), { without: 17, tax: 0.85, withTax: 17.85 })
})

test('order detail attaches become grouped extras with tax-exclusive prices', () => {
  const groups = addonGroupsFromOptions([
    {
      attachTypeId: 3,
      attachTypeName: 'Extras',
      attachTypeNameI18n: { zh: '额外服务', en: 'Extras' },
      attachValueId: 9,
      attachValueName: 'Towels',
      unit: '件',
      unitI18n: { zh: '件', en: 'pc' },
      unitPriceWithoutTax: '0.00',
      sort: 2,
    },
    {
      attachTypeId: 3,
      attachValueId: 8,
      attachValueNameI18n: { zh: '精油', en: 'Oil' },
      unitI18n: { zh: '次', en: 'visit' },
      unitPriceWithoutTax: 20,
      sort: 1,
    },
    {
      attachTypeId: 4,
      attachTypeName: 'Scent',
      attachValueId: 8,
      attachValueName: 'Duplicate',
      unitPriceWithoutTax: 1,
    },
  ], 'zh')
  assert.equal(groups.length, 1)
  assert.equal(groups[0].label, '额外服务')
  assert.deepEqual(plain(groups[0].options.map((item) => [item.id, item.label, item.price, item.unit])), [
    ['9', 'Towels', 0, '件'],
    ['8', '精油', 20, '次'],
  ])
})

test('addon catalog keeps the service attach options and their prices', () => {
  const groups = addonCatalog({
    attachBindings: [{ attachTypeId: 3, attachValueIds: [8, 9] }],
    attachTypeNameI18n: { 3: { zh: '香薰', en: 'Scent' } },
    attachValueNameI18n: { 8: { zh: '精油', en: 'Oil' }, 9: { en: 'Towels' } },
    attachValueUnitI18n: { 8: { zh: '次', en: 'visit' } },
    attachValueAmountMap: { 8: 20, 9: 0 },
  }, 'zh')
  assert.equal(groups.length, 1)
  assert.equal(groups[0].label, '香薰')
  assert.deepEqual(plain(groups[0].options.map((item) => [item.id, item.label, item.price, item.unit])), [
    ['8', '精油', 20, '次'],
    ['9', 'Towels', 0, ''],
  ])
})

test('order-specific extras hide unconfigured prices and preserve explicitly configured zero prices', () => {
  const invalid = [undefined, null, '', '   ', -1, '-0.01', Infinity, NaN, 'not a price', false, [], {}]
  const rows = invalid.map((unitPriceWithoutTax, index) => ({
    attachTypeId: 3, attachTypeName: 'Extras', attachValueId: index + 1,
    attachValueName: `Unpriced option ${index + 1}`, unitPriceWithoutTax,
  }))
  const source = [
    ...rows,
    { attachTypeId: 4, attachTypeName: 'Valid extras', attachValueId: 31, attachValueName: 'Free numeric', unitPriceWithoutTax: 0 },
    { attachTypeId: 4, attachValueId: 32, attachValueName: 'Free text', unitPriceWithoutTax: '0.00' },
    { attachTypeId: 4, attachValueId: 33, attachValueName: 'Priced extra', unitPriceWithoutTax: ' 10.50 ', unitI18n: { en: 'item', zh: '件' } },
    { attachTypeId: 5, attachValueId: 33, attachValueName: 'Duplicate must not replace first', unitPriceWithoutTax: 99 },
  ]
  const before = plain(source)
  const groups = addonGroupsFromOptions(source, 'zh')
  assert.deepEqual(plain(groups), [{
    id: '4', label: 'Valid extras', options: [
      { id: '31', label: 'Free numeric', unit: '', price: 0 },
      { id: '32', label: 'Free text', unit: '', price: 0 },
      { id: '33', label: 'Priced extra', unit: '件', price: 10.5 },
    ],
  }])
  assert.deepEqual(plain(source), before)
  assert.deepEqual(plain(addonGroupsFromOptions([], 'en')), [])
  assert.deepEqual(plain(addonGroupsFromOptions(rows, 'en')), [])
})

test('legacy extras omit missing and invalid prices while keeping valid fallback sources and zero amounts', () => {
  const ids = Array.from({ length: 12 }, (_, index) => index + 1)
  const detail = {
    attachBindings: [{ attachTypeId: 3, attachValueIds: ids }],
    attachTypeNameI18n: { 3: { en: 'Extras' } },
    attachValueNameI18n: Object.fromEntries(ids.map(id => [id, { en: `Option ${id}` }])),
    attachValueAmountMap: { 2: null, 3: '', 4: ' ', 5: -3, 6: 'invalid', 7: 0, 8: '0.00', 9: '12.50', 10: Infinity, 11: false, 12: {} },
    attachValuePriceMap: { 5: 8, 9: 99 },
  }
  const groups = addonCatalog(detail, 'en')
  assert.deepEqual(plain(groups[0].options.map(({ id, price }) => ({ id, price }))), [
    { id: '5', price: 8 }, { id: '7', price: 0 }, { id: '8', price: 0 }, { id: '9', price: 12.5 },
  ])
  assert.deepEqual(plain(addonCatalog({ ...detail, attachValueAmountMap: {}, attachValuePriceMap: {} }, 'en')), [])
})

test('checkout extras and extra-service purchase use different display modes', () => {
  assert.equal(attachShownAt(1, 'checkout'), true)
  assert.equal(attachShownAt(1, 'extra'), false)
  assert.equal(attachShownAt(2, 'checkout'), false)
  assert.equal(attachShownAt(2, 'extra'), true)
  assert.equal(attachShownAt(3, 'checkout'), true)
  assert.equal(attachShownAt(undefined, 'extra'), true)
  const extra = addonGroupsFromOptions([1, 2, 3, null].map((displayMode, index) => ({
    attachTypeId: 3,
    attachTypeName: 'Extras',
    attachValueId: index + 1,
    attachValueName: `Option ${index + 1}`,
    unitPriceWithoutTax: 10,
    displayMode,
  })), 'en')
  assert.deepEqual(plain(extra[0].options.map((item) => item.id)), ['2', '3', '4'])
  const catalog = addonCatalog({
    attachBindings: [
      { attachTypeId: 1, attachValueIds: [1], displayMode: 1 },
      { attachTypeId: 2, attachValueIds: [2], displayMode: 2 },
      { attachTypeId: 3, attachValueIds: [3], displayMode: 3 },
      { attachTypeId: 4, attachValueIds: [4] },
    ],
    attachTypeNameI18n: { 1: { en: 'Before' }, 2: { en: 'After' }, 3: { en: 'Both' }, 4: { en: 'Legacy' } },
    attachValueNameI18n: { 1: { en: 'One' }, 2: { en: 'Two' }, 3: { en: 'Three' }, 4: { en: 'Four' } },
    attachValueAmountMap: { 1: 1, 2: 2, 3: 3, 4: 4 },
  }, 'en')
  assert.deepEqual(plain(catalog.map((group) => group.id)), ['2', '3', '4'])
  const web = readFileSync(new URL('../src/modules/client/pages/product-detail.vue', import.meta.url), 'utf8')
  const h5 = readFileSync(new URL('../src/modules/h5/pages/product-detail.vue', import.meta.url), 'utf8')
  assert.match(web, /attachShownAt\(binding\.displayMode, "checkout"\)/)
  assert.match(h5, /attachShownAt\(binding\.displayMode, "checkout"\)/)
})
