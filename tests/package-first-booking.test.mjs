import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const transpile = (source) => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText
const plainText = {}
runInNewContext(transpile(read('src/modules/client/utils/plain-text.ts')), { exports: plainText })
const code = transpile(read('src/modules/client/composables/usePackageFirstBooking.ts'))
const flush = async () => {
  for (let index = 0; index < 15; index += 1) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const item = (id, overrides = {}) => ({ chosenSkuId: id, skuId: 999, bindType: 1, spuId: id + 100, redeemTimes: 3,
  spuNameI18n: { en: '<p>Home cleaning</p>', zh: '<p>家庭清洁</p>' },
  specs: [{ specTypeNameI18n: { en: 'Home size', zh: '户型' }, specValueNameI18n: { en: '4 BHK', zh: '四居室' } }],
  ...overrides })
const order = (items = [item(201)], overrides = {}) => ({ orderId: 42, packageOrder: true, packageItems: [],
  packageSnapshot: { packageId: 2, items }, ...overrides })
async function harness(t, config = {}) {
  const calls = []
  const mode = Vue.ref(config.mode ?? true)
  const id = Vue.ref('42')
  const packageId = Vue.ref('2')
  const locale = Vue.ref('en')
  const control = { load: config.load || (async () => order()) }
  const exports = {}
  runInNewContext(code, { exports, require: (name) => {
    if (name === 'vue') return Vue
    if (name.endsWith('/api')) return { getClientOrderDetailById: async (orderId) => {
      calls.push(orderId)
      return control.load(orderId)
    } }
    if (name.endsWith('/plain-text')) return plainText
    throw new Error(`Unexpected booking dependency: ${name}`)
  } })
  const scope = Vue.effectScope()
  const state = scope.run(() => exports.usePackageFirstBooking(mode, () => id.value, locale, () => packageId.value))
  t.after(() => scope.stop())
  await flush()
  return { state, id, packageId, mode, locale, calls, control, scope }
}

test('normal products do not request package order details', async (t) => {
  const { calls, state } = await harness(t, { mode: false })
  assert.deepEqual(calls, [])
  assert.equal(state.validationMessage.value, '')
})

test('purchased SKU snapshots supply every first visit and language changes use cached plain labels', async (t) => {
  const { calls, state, locale } = await harness(t)
  assert.equal(state.options.value[0].value, '201')
  assert.equal(state.options.value[0].spuId, '301')
  assert.equal(state.options.value[0].spec, 'Home size: 4 BHK')
  assert.equal('selectedSkuId' in state, false)
  assert.equal('selectedService' in state, false)
  assert.equal(state.validationMessage.value, '')
  assert.equal(state.options.value[0].label, 'Home cleaning')
  locale.value = 'zh'
  assert.equal(state.options.value[0].label, '家庭清洁')
  assert.equal(state.options.value[0].spec, '户型: 四居室')
  assert.deepEqual(calls, ['42'])
})

test('multiple purchased services are included once each with fixed SKUs and exact duplicate rows deduplicated', async (t) => {
  const { state } = await harness(t, { load: async () => order([
    item(201), item(202, { bindType: 2, chosenSkuId: undefined, skuId: 202 }), item(201), item(201, { spuId: 999 }),
  ]) })
  assert.deepEqual(JSON.parse(JSON.stringify(state.options.value.map(({ value, spuId }) => ({ value, spuId })))), [
    { value: '201', spuId: '301' }, { value: '202', spuId: '302' }, { value: '201', spuId: '999' },
  ])
  assert.equal(state.validationMessage.value, '')
})

test('obsolete package responses cannot overwrite a newly selected package', async (t) => {
  const old = deferred()
  const next = deferred()
  const { id, packageId, state } = await harness(t, { load: (value) => value === '42' ? old.promise : next.promise })
  assert.equal(state.loading.value, true)
  id.value = '43'
  packageId.value = '3'
  await flush()
  next.resolve(order([item(302)], { orderId: 43, packageSnapshot: { packageId: 3, items: [item(302)] } }))
  await flush()
  old.resolve(order())
  await flush()
  assert.equal(state.options.value[0].value, '302')
  assert.equal(state.loading.value, false)
})

test('order failures and empty snapshots block checkout, while reload can recover', async (t) => {
  const { state, control } = await harness(t, { load: async () => { throw new Error('mock catalog failure') } })
  assert.match(state.validationMessage.value, /Unable to load/)
  control.load = async () => order([])
  await state.reload()
  assert.match(state.validationMessage.value, /incomplete/)
  control.load = async () => order()
  await state.reload()
  assert.equal(state.validationMessage.value, '')
})

test('leaving package mode invalidates pending requests and stale selections', async (t) => {
  const pending = deferred()
  const { state, mode } = await harness(t, { load: () => pending.promise })
  mode.value = false
  await flush()
  pending.resolve(order())
  await flush()
  assert.equal(state.loading.value, false)
  assert.equal(state.options.value.length, 0)
})

test('any invalid purchased item fails closed instead of silently booking only the valid services', async (t) => {
  const { state, control } = await harness(t)
  for (const invalid of [null, item(202, { chosenSkuId: undefined }), item(202, { chosenSkuId: 'bad' }),
    item(202, { spuId: 0 }), item(202, { redeemTimes: 0 }), item(202, { redeemTimes: 1.5 }), item(202, { redeemTimes: Infinity })]) {
    control.load = async () => order([item(201), invalid])
    await state.reload()
    assert.equal(state.options.value.length, 0)
    assert.match(state.validationMessage.value, /incomplete/)
  }
  control.load = async () => order([item(201, { specs: {} })])
  await state.reload()
  assert.equal(state.options.value.length, 1)
  assert.equal(state.options.value[0].spec, '')
})

test('order identity, package identity and package kind must match before exposing purchased services', async (t) => {
  const { state, control } = await harness(t)
  for (const invalid of [order(undefined, { orderId: 43 }), order(undefined, { packageOrder: false, orderType: 1 }),
    order(undefined, { packageSnapshot: { packageId: 3, items: [item(201)] } }),
    order(undefined, { packageSnapshot: undefined, packageItems: [item(201)] })]) {
    control.load = async () => invalid
    await state.reload()
    assert.equal(state.options.value.length, 0)
    assert.notEqual(state.validationMessage.value, '')
  }
  control.load = async () => order(undefined, { packageOrder: false, orderType: 2 })
  await state.reload()
  assert.equal(state.validationMessage.value, '')
})

test('disposing the booking scope invalidates pending order responses', async (t) => {
  const gate = deferred()
  const { state, scope } = await harness(t, { load: () => gate.promise })
  scope.stop()
  gate.resolve(order())
  await flush()
  assert.equal(state.options.value.length, 0)
})
