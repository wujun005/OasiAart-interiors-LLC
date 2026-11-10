import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(readFileSync(new URL('../src/modules/admin/utils/supplier-mine.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(code, { exports })
const { supplierMineCounts, packageVisitProgress, supplierQuoteRates, supplierSkuCode, supplierAttachLines, supplierSkuLines, supplierFulfillRemarks, supplierOrderGroups, supplierLineEarning, supplierAttachEarning, supplierOrderEarning, supplierOrderKind, supplierSpecSummary, materialHourStaffCount, materialHourServiceHours } = exports
const plain = (value) => JSON.parse(JSON.stringify(value))

test('supplier mine counts stay with the page and ignore the selected tab total', () => {
  assert.deepEqual(plain(supplierMineCounts({
    list: [{ orderId: 1 }],
    total: 1,
    newOrderCount: 4,
    upcomingOrderCount: '2',
    inProgressOrderCount: 0,
    completedOrderCount: 9,
  })), {
    newRequests: 4,
    upcoming: 2,
    inProgress: 0,
    completed: 9,
  })
  assert.deepEqual(plain(supplierMineCounts({ summary: { newRequests: 3, completed: 1 } })), {
    newRequests: 3,
    completed: 1,
  })
})

test('package rows show this visit and the sub-service total', () => {
  assert.deepEqual(plain(packageVisitProgress({
    packageOrder: true,
    orderType: 2,
    seqNo: 2,
    totalTimes: 5,
  })), { seq: 2, total: 5 })
  assert.deepEqual(plain(packageVisitProgress({ orderType: 2, seqNo: 1 })), { seq: 1, total: null })
  assert.equal(packageVisitProgress({ orderType: 1, seqNo: 1, totalTimes: 5 }), null)
  assert.equal(packageVisitProgress({ packageOrder: true }), null)
})

test('assigned order detail keeps the quote rates and attach prices that can be shown', () => {
  assert.equal(supplierSkuCode({ skuCode: ' AC-4 ' }), 'AC-4')
  assert.deepEqual(plain(supplierQuoteRates({
    quoteMode: 2,
    unitPriceWithMaterial: '80.00',
    unitPriceWithoutMaterial: 60,
    unitPrice: 10,
  })), [
    { key: 'admin.supplierOrders.rateWithMaterial', amount: 80 },
    { key: 'admin.supplierOrders.rateWithoutMaterial', amount: 60 },
  ])
  assert.deepEqual(plain(supplierQuoteRates({ quoteMode: 4, unitPrice: 25 })), [
    { key: 'admin.supplierOrders.rateQuantity', amount: 25 },
  ])
  assert.deepEqual(plain(supplierQuoteRates({ quoteMode: 1, unitPrice: 25 })), [])
  assert.deepEqual(plain(supplierAttachLines({
    attaches: [{
      attachValueId: 9,
      name: 'Towels',
      quantity: 2,
      addedAfterPay: true,
      source: 'ADDON',
      sourceI18n: { zh: '支付后追加', en: 'Added after payment' },
      unitPriceWithoutTax: '10.00',
      amountWithoutTax: 20,
      amountWithTax: '21.00',
      quotePrice: 15,
    }],
  })), [{
    id: '9-0',
    name: 'Towels',
    quantity: 2,
    addedAfterPay: true,
    source: 'ADDON',
    sourceI18n: { zh: '支付后追加', en: 'Added after payment' },
    addonPaymentId: '',
    quotePrice: 15,
  }])
})

test('supplier order detail keeps the original order and each add-on order apart, with every SKU', () => {
  const groups = plain(supplierOrderGroups({
    lines: [
      {
        skuId: 11,
        skuCode: 'AC-1',
        spuCode: 'SPU-1',
        spuName: 'Cleaning',
        quantity: 1,
        quotePrice: '80.00',
        unitPriceWithoutTax: '100.00',
        unitPriceWithTax: 105,
        originalPrice: 120,
        amountWithoutTax: 100,
        amountWithTax: '105.00',
        taxAmount: 5,
        taxRate: 5,
      },
      { skuId: 12, skuCode: 'AC-2', quantity: 2 },
    ],
    attaches: [
      { attachValueId: 1, name: 'Towels', quantity: 1, source: 'INITIAL', sourceI18n: { zh: '首次下单' } },
      { attachValueId: 2, name: 'Oil', quantity: 1, source: 'ADDON', addonPaymentId: 88, sourceI18n: { zh: '支付后追加' }, taxAmount: '2.00' },
      { attachValueId: 3, name: 'Gloves', quantity: 1, source: 'ADDON', addonPaymentId: 88 },
      { attachValueId: 4, name: 'Bags', quantity: 1, addedAfterPay: true },
    ],
  }))
  assert.equal(groups.length, 3)
  assert.equal(groups[0].source, 'INITIAL')
  assert.deepEqual(groups[0].skus.map((item) => item.skuCode), ['AC-1', 'AC-2'])
  assert.equal(groups[0].skus[0].spuCode, 'SPU-1')
  assert.equal(groups[0].skus[0].quotePrice, 80)
  assert.deepEqual(groups[0].attaches.map((item) => item.name), ['Towels'])
  assert.equal(groups[1].key, 'ADDON-88')
  assert.deepEqual(groups[1].attaches.map((item) => item.name), ['Oil', 'Gloves'])
  assert.equal(groups[1].addonPaymentId, '88')
  assert.deepEqual(groups[2].attaches.map((item) => item.name), ['Bags'])
  assert.deepEqual(plain(supplierOrderGroups({ skuId: 7, skuCode: 'SOLO' })).map((group) => group.skus[0].skuCode), ['SOLO'])
})

test('supplier specs keep the chosen values and drop internal type codes', () => {
  assert.equal(supplierSpecSummary({
    skuCode: 'SOLO',
    specs: [
      { typeName: 'ApolloHomeCleaningPackageOption', valueName: '1 Bedroom' },
      { typeName: '房型', valueName: '1 BHK' },
    ],
  }), '1 Bedroom; 房型: 1 BHK')
  assert.equal(supplierSpecSummary({
    skuCode: '9f1c2d30-1111-2222-3333-444444444444',
    specDescription: '9f1c2d30-1111-2222-3333-444444444444',
  }), '')
  assert.equal(supplierSpecSummary({
    specDescription: 'ApolloHomeSize: 1 BHK; 服务时长: 2小时',
  }), '1 BHK; 服务时长: 2小时')
})

test('package visit specs are shown on the service line in the order detail', () => {
  const matched = plain(supplierSkuLines({
    orderType: 2,
    packageOrder: true,
    skuId: 5280,
    specs: [{ typeName: '房型', valueName: '1 BHK' }],
    specDescription: '房型: 1 BHK',
    lines: [{ skuId: 5280, spuName: '深度清洁', quantity: 1 }],
  }))
  assert.equal(supplierSpecSummary(matched[0]), '房型: 1 BHK')
  const onlyLine = plain(supplierSkuLines({
    orderType: 2,
    packageOrder: true,
    skuId: 5280,
    specs: [{ typeName: 'ApolloHomeSize', valueName: '1 Bedroom' }],
    lines: [{ skuId: 9, spuName: '套餐', quantity: 1 }],
  }))
  assert.equal(supplierSpecSummary(onlyLine[0]), '1 Bedroom')
  const ordinary = plain(supplierSkuLines({
    orderType: 1,
    packageOrder: false,
    skuId: 1,
    specs: [{ typeName: '房型', valueName: '不应使用' }],
    lines: [{ skuId: 1, spuName: '清洁', specs: [{ typeName: '时长', valueName: '2小时' }] }],
  }))
  assert.equal(supplierSpecSummary(ordinary[0]), '时长: 2小时')
})

test('supplier orders show the sku note from price maintenance', () => {
  const visit = plain(supplierSkuLines({
    orderType: 2,
    packageOrder: true,
    skuId: 5280,
    supplierFulfillRemark: ' 带梯子 ',
    lines: [{ skuId: 9, spuName: '套餐', supplierFulfillRemark: '不要用这一条' }],
  }))
  assert.equal(visit[0].supplierFulfillRemark, '带梯子')
  assert.deepEqual(plain(supplierFulfillRemarks({
    orderType: 2,
    packageOrder: true,
    skuId: 5280,
    supplierFulfillRemark: '带梯子',
    lines: [{ skuId: 9, supplierFulfillRemark: '不要用这一条' }],
  })), ['带梯子'])
  assert.deepEqual(plain(supplierFulfillRemarks({
    orderType: 1,
    lines: [
      { skuId: 1, spuName: '清洁', supplierFulfillRemark: '带梯子' },
      { skuId: 2, spuName: '清洁', supplierFulfillRemark: ' 带梯子 ' },
      { skuId: 3, spuName: '清洁', supplierFulfillRemark: '自备水电' },
    ],
  })), ['带梯子', '自备水电'])
})

test('service staff and hours show only for normal material-hour orders', () => {
  assert.equal(materialHourStaffCount({
    orderType: 1,
    packageOrder: false,
    quoteMode: 2,
    staffCount: 3,
    serviceHours: 2.5,
  }), 3)
  assert.equal(materialHourServiceHours({
    orderType: 1,
    quoteMode: 2,
    staffCount: 3,
    serviceHours: '2.50',
  }), 2.5)
  assert.equal(materialHourStaffCount({
    orderType: 1,
    quoteMode: 2,
    staffCount: 0,
    serviceHours: 1,
  }), 0)
  assert.equal(materialHourStaffCount({
    orderType: 2,
    packageOrder: true,
    quoteMode: 2,
    staffCount: 3,
    serviceHours: 2,
  }), null)
  assert.equal(materialHourServiceHours({
    orderType: 1,
    quoteMode: 3,
    staffCount: 2,
    serviceHours: 4,
  }), null)
  assert.equal(materialHourStaffCount({
    orderType: 1,
    quoteMode: 1,
    staffCount: 2,
    serviceHours: 4,
  }), null)
  assert.equal(materialHourStaffCount({
    orderType: 1,
    lines: [{ quoteMode: 2 }],
    staffCount: 4,
  }), 4)
  assert.equal(materialHourStaffCount({
    orderType: 1,
    quoteMode: 2,
    staffCount: null,
  }), null)
  assert.equal(materialHourStaffCount({
    orderType: 1,
    packageOrder: false,
    withMaterial: false,
    staffCount: 2,
    serviceHours: 3,
  }), 2)
  assert.equal(materialHourServiceHours({
    orderType: 1,
    packageOrder: false,
    withMaterial: false,
    staffCount: 2,
    serviceHours: 3,
  }), 3)
  assert.equal(materialHourStaffCount({
    orderType: 1,
    packageOrder: false,
    staffCount: 2,
    serviceHours: 3,
  }), null)
})

test('package visits are marked and priced from this visit quote', () => {
  assert.equal(supplierOrderKind({ orderType: 2, packageOrder: true }), 'package')
  assert.equal(supplierOrderKind({ orderType: 1, packageOrder: false }), 'normal')
  assert.equal(supplierOrderKind({}), '')
  assert.equal(supplierOrderEarning({
    orderType: 2,
    packageOrder: true,
    packageQuotePrice: 20,
    quotePrice: 20,
    quoteAmount: 40,
    lines: [{ skuId: 1, quotePrice: 99, quoteAmount: 99 }],
  }), 40)
  assert.equal(supplierOrderEarning({
    orderType: 1,
    packageOrder: false,
    quotePrice: 5,
    quoteAmount: 5,
    lines: [{ skuId: 1, quantity: 1, quotePrice: 5, quoteAmount: 5 }],
  }), 5)
})

test('supplier order price is the money they receive for the order', () => {
  assert.equal(supplierLineEarning({ quotePrice: 5, quoteAmount: 10, unitPrice: 5 }), 10)
  assert.equal(supplierAttachEarning({ quotePrice: '5.00', quantity: 2 }), 10)
  assert.equal(supplierOrderEarning({
    quotePrice: 5,
    quoteAmount: 5,
    unitPrice: 5,
    lines: [{ skuId: 1, quantity: 1, quotePrice: 5, quoteAmount: 5, unitPrice: 5 }],
    attaches: [{ attachValueId: 7, quantity: 1, source: 'ADDON', quotePrice: 5 }],
  }), 10)
})
