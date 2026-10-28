import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/usage-analytics-core.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const api = {}
runInNewContext(code, { exports: api, console })
const plain = (value) => JSON.parse(JSON.stringify(value))

const range = {
  startMs: Date.parse('2026-10-01T00:00:00.000Z'),
  endMs: Date.parse('2026-11-01T00:00:00.000Z'),
}

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

function event(partial) {
  return {
    eventId: `${partial.name}-${partial.anonymousId}`,
    sessionId: 'session',
    userId: '',
    userName: '',
    platform: 'web',
    paymentChannel: '',
    orderNo: '',
    targetId: '',
    ...partial,
  }
}

test('route mapping follows the booking path', () => {
  assert.equal(api.usageStepForLocation('/').name, 'home_view')
  assert.equal(api.usageStepForLocation('/services/detail/spu-1').targetId, 'spu-1')
  assert.equal(api.usageStepForLocation('/packages/8').targetId, 'package:8')
  assert.equal(api.usageStepForLocation('/cart'), null)
  assert.equal(api.usageStepForLocation('/orders/success', { orderId: '15' }).orderNo, '15')
})

test('a wallet on the Stripe result becomes the payment channel', () => {
  assert.equal(api.paymentChannelFromStripe({
    charges: { data: [{ payment_method_details: { card: { wallet: { type: 'apple_pay' } } } }] },
  }), 'apple_pay')
  assert.equal(api.normalizeUsageChannel('Visa •••• 4242'), 'card')
  assert.equal(api.normalizeUsageChannel('pm_123'), '')
})

test('the same session records each funnel step once', () => {
  const sent = []
  let serial = 0
  const tracker = api.createUsageTracker({
    platform: 'h5',
    local: memoryStorage(),
    session: memoryStorage(),
    now: () => Date.parse('2026-10-28T03:00:00.000Z'),
    createId: () => `id-${serial += 1}`,
    user: () => ({ userId: '9', userName: 'Amina' }),
    send: (events) => sent.push(...events),
  })
  tracker.trackRoute('/')
  tracker.trackRoute('/')
  tracker.trackRoute('/services/detail/spu-1')
  tracker.track('payment_view', { orderNo: 'HX1' })
  tracker.track('payment_success', { orderNo: 'HX1', paymentChannel: 'apple_pay' })
  tracker.trackRoute('/orders/success', { orderNo: 'HX1' })
  assert.deepEqual(plain(sent.map((item) => item.name)), [
    'home_view',
    'service_detail_view',
    'payment_view',
    'payment_success',
  ])
  assert.equal(sent[0].platform, 'h5')
  assert.equal(sent[0].userId, '9')
  assert.equal(sent[0].userName, 'Amina')
  assert.equal(sent[3].paymentChannel, 'apple_pay')
  assert.equal(sent[0].anonymousId, sent[3].anonymousId)
})

test('conversion counts only visitors who pass the steps in order', () => {
  const report = api.buildUsageReport([
    event({ name: 'home_view', anonymousId: 'a', occurredAt: '2026-10-02T01:00:00.000Z', userId: '9', userName: 'Amina' }),
    event({ name: 'service_detail_view', anonymousId: 'a', occurredAt: '2026-10-02T01:05:00.000Z', targetId: 'spu-1' }),
    event({ name: 'payment_view', anonymousId: 'a', occurredAt: '2026-10-02T01:10:00.000Z', orderNo: 'HX1' }),
    event({ name: 'payment_success', anonymousId: 'a', occurredAt: '2026-10-02T01:12:00.000Z', orderNo: 'HX1', paymentChannel: 'apple_pay' }),
    event({ name: 'home_view', anonymousId: 'b', occurredAt: '2026-10-03T01:00:00.000Z', platform: 'h5' }),
    event({ name: 'service_detail_view', anonymousId: 'b', occurredAt: '2026-10-03T01:05:00.000Z', platform: 'h5' }),
    event({ name: 'service_detail_view', anonymousId: 'c', occurredAt: '2026-10-04T01:00:00.000Z' }),
    event({ name: 'home_view', anonymousId: 'd', occurredAt: '2026-10-05T01:00:00.000Z', platform: 'ios' }),
    event({ name: 'service_detail_view', anonymousId: 'd', occurredAt: '2026-10-05T01:04:00.000Z', platform: 'ios' }),
    event({ name: 'payment_view', anonymousId: 'd', occurredAt: '2026-10-05T01:08:00.000Z', platform: 'ios', orderNo: 'HX2' }),
    event({ name: 'payment_success', anonymousId: 'd', occurredAt: '2026-10-05T01:09:00.000Z', platform: 'ios', orderNo: 'HX2', paymentChannel: 'card' }),
    event({ name: 'service_detail_view', anonymousId: 'e', occurredAt: '2026-10-06T01:00:00.000Z' }),
    event({ name: 'home_view', anonymousId: 'e', occurredAt: '2026-10-06T02:00:00.000Z' }),
  ], { ...range, platform: 'all' })

  assert.deepEqual(plain(report.steps.map((step) => step.visitors)), [4, 3, 2, 2])
  assert.equal(report.steps[1].rateFromPrevious, 0.75)
  assert.equal(report.steps[3].rateFromStart, 0.5)
  assert.equal(report.steps[3].rateFromPrevious, 1)
  assert.deepEqual(plain(report.byPlatform.find((row) => row.platform === 'h5').steps), [1, 1, 0, 0])
  assert.deepEqual(plain(report.channels.map((row) => row.channel)), ['apple_pay', 'card'])
  assert.equal(report.journeys.find((row) => row.key === 'a').userName, 'Amina')

  const web = api.buildUsageReport([
    event({ name: 'home_view', anonymousId: 'a', occurredAt: '2026-10-02T01:00:00.000Z' }),
    event({ name: 'home_view', anonymousId: 'b', occurredAt: '2026-10-02T01:00:00.000Z', platform: 'ios' }),
  ], { ...range, platform: 'web' })
  assert.deepEqual(plain(web.steps.map((step) => step.visitors)), [1, 0, 0, 0])
})

test('paid orders keep the payer and card channel inside the selected dates', () => {
  const paid = api.parsePaidOrder({
    orderNo: 'HX9',
    paymentStatus: 1,
    paidTime: '2026-10-02T01:12:00.000Z',
    paymentMethodDetail: 'Visa •••• 4242',
    customerName: 'Amina',
    userPhone: '+971500000000',
    userEmail: 'amina@example.com',
    payAmount: 120,
    clientPlatform: 'ios',
  }, range)
  assert.equal(paid.paymentChannel, 'card')
  assert.equal(paid.userName, 'Amina')
  assert.equal(paid.phone, '+971500000000')
  assert.equal(paid.platform, 'ios')
  assert.equal(paid.amountText, 'AED 120.00')
  const listed = api.parsePaidOrder({
    paymentStatus: 1,
    orderTime: '2026-10-02T01:12:00.000Z',
    paymentMethod: 'stripe',
    cardLast4: '4242',
    amountText: 'AED 88.00',
    firstName: 'Amina',
    lastName: 'Noor',
  }, range)
  assert.equal(listed.paymentChannel, 'card')
  assert.equal(listed.amountText, 'AED 88.00')
  assert.equal(listed.userName, 'Amina Noor')
  assert.equal(api.parsePaidOrder({ paymentStatus: 0, paidTime: '2026-10-02T01:12:00.000Z' }, range), null)
  assert.equal(api.parsePaidOrder({
    paymentStatus: 'PAID',
    paidTime: '2026-09-01T01:12:00.000Z',
  }, range), null)
  assert.deepEqual(
    plain(api.summarizePaymentChannels(['card', 'card', 'apple_pay']).map((row) => [row.channel, row.count])),
    [['card', 2], ['apple_pay', 1]],
  )
})
