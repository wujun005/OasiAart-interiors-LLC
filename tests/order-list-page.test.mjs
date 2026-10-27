import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(readFileSync(new URL('../src/modules/client/utils/order-list-page.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(code, { exports })
const { parseOrderListPage, packageServiceLines, packageTimesText, orderListKind, matchesOrderListKind, narrowOrderList, orderTypeForListKind } = exports

const nameOf = (map) => map?.zh || map?.en || ''

const plain = (value) => JSON.parse(JSON.stringify(value))

test('order list page reads the paged payload, an envelope, and a legacy array', () => {
  assert.deepEqual(plain(parseOrderListPage({
    success: true,
    data: { list: [{ orderNo: 'A' }], total: 24, pageNum: 2, pageSize: 10 },
  })), { list: [{ orderNo: 'A' }], total: 24, pageNum: 2, pageSize: 10 })
  assert.equal(plain(parseOrderListPage({ list: [{ orderNo: 'B' }], total: '3', pageNum: '1', pageSize: '10' })).total, 3)
  assert.deepEqual(plain(parseOrderListPage([{ orderNo: 'C' }])), {
    list: [{ orderNo: 'C' }],
    total: 1,
    pageNum: 1,
    pageSize: 1,
  })
  assert.deepEqual(plain(parseOrderListPage(null)), { list: [], total: 0, pageNum: 1, pageSize: 10 })
})

test('bookings and packages can be split without dropping older orders that have no type', () => {
  const booking = { orderNo: 'B', orderType: 1 }
  const legacy = { orderNo: 'L' }
  const packageOrder = { orderNo: 'P', packageOrder: true, orderType: 2 }
  assert.equal(orderListKind('package'), 'package')
  assert.equal(orderListKind(['booking']), 'booking')
  assert.equal(orderListKind(''), 'all')
  assert.equal(orderTypeForListKind('booking'), 1)
  assert.equal(orderTypeForListKind('package'), 2)
  assert.equal(orderTypeForListKind('all'), undefined)
  assert.equal(matchesOrderListKind('booking', legacy), true)
  assert.equal(matchesOrderListKind('package', legacy), false)
  assert.equal(matchesOrderListKind('package', packageOrder), true)
  assert.deepEqual(narrowOrderList('booking', [booking, legacy, packageOrder], 8).records.map((item) => item.orderNo), ['B', 'L'])
  assert.equal(narrowOrderList('booking', [booking, legacy, packageOrder], 8).total, 2)
  assert.equal(narrowOrderList('booking', [booking, legacy], 8).total, 8)
})

test('package lines keep each sub-service total, completed, in-progress, and remaining', () => {
  const lines = packageServiceLines([
    {
      spuId: 8,
      spuNameI18n: { zh: '深度保洁', en: 'Deep cleaning' },
      specI18n: [{ specTypeNameI18n: { zh: '时长' }, specValueNameI18n: { zh: '2小时' } }],
      totalTimes: 5,
      redeemTimes: 5,
      completedTimes: 1,
      inProgressTimes: 2,
      remainingTimes: 2,
    },
    {
      skuId: 3,
      spuNameI18n: { zh: '维修' },
      redeemTimes: 2,
      occupiedTimes: 1,
    },
  ], nameOf)
  assert.equal(lines[0].name, '深度保洁')
  assert.equal(lines[0].spec, '时长: 2小时')
  assert.deepEqual([lines[0].total, lines[0].completed, lines[0].inProgress, lines[0].remaining], [5, 1, 2, 2])
  assert.deepEqual([lines[1].total, lines[1].completed, lines[1].remaining], [2, null, 1])
  assert.equal(packageTimesText(lines[0], (key, count) => `${key}:${count}`), 'total:5 · completed:1 · inProgress:2 · remaining:2')
})
