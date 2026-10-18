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
const item = (id, overrides = {}) => ({ skuId: id, spuId: id + 100, redeemTimes: 3,
  spuNameI18n: { en: '<p>Home cleaning</p>', zh: '<p>家庭清洁</p>' }, ...overrides })
async function harness(t, config = {}) {
  const calls = []
  const mode = Vue.ref(config.mode ?? true)
  const id = Vue.ref('2')
  const locale = Vue.ref('en')
  const control = { load: config.load || (async () => ({ items: [item(201)] })) }
  const exports = {}
  runInNewContext(code, { exports, require: (name) => {
    if (name === 'vue') return Vue
    if (name.endsWith('/api')) return { packageDetail: async (packageId) => {
      calls.push(packageId)
      return control.load(packageId)
    } }
    if (name.endsWith('/plain-text')) return plainText
    throw new Error(`Unexpected booking dependency: ${name}`)
  } })
  const scope = Vue.effectScope()
  const state = scope.run(() => exports.usePackageFirstBooking(mode, () => id.value, locale))
  t.after(() => scope.stop())
  await flush()
  return { state, id, mode, locale, calls, control }
}

test('normal products do not request the package catalog', async (t) => {
  const { calls, state } = await harness(t, { mode: false })
  assert.deepEqual(calls, [])
  assert.equal(state.validationMessage.value, '')
})

test('a single service is selected automatically, and language changes use cached plain labels', async (t) => {
  const { calls, state, locale } = await harness(t)
  assert.equal(state.selectedSkuId.value, '201')
  assert.equal(state.selectedService.value.spuId, '301')
  assert.equal(state.validationMessage.value, '')
  assert.equal(state.options.value[0].label, 'Home cleaning')
  locale.value = 'zh'
  assert.equal(state.options.value[0].label, '家庭清洁')
  assert.deepEqual(calls, ['2'])
})

test('multiple services require an explicit valid first-visit selection', async (t) => {
  const { state } = await harness(t, { load: async () => ({ items: [item(201), item(202), item(201), item(203, { redeemTimes: 0 })] }) })
  assert.equal(state.options.value.length, 2)
  assert.equal(state.selectedSkuId.value, '')
  assert.match(state.validationMessage.value, /select a service/)
  state.selectedSkuId.value = '202'
  assert.equal(state.validationMessage.value, '')
  state.selectedSkuId.value = '999'
  assert.notEqual(state.validationMessage.value, '')
})

test('obsolete package responses cannot overwrite a newly selected package', async (t) => {
  const old = deferred()
  const next = deferred()
  const { id, state } = await harness(t, { load: (value) => value === '2' ? old.promise : next.promise })
  assert.equal(state.loading.value, true)
  id.value = '3'
  await flush()
  next.resolve({ items: [item(302)] })
  await flush()
  old.resolve({ items: [item(201)] })
  await flush()
  assert.equal(state.selectedSkuId.value, '302')
  assert.equal(state.loading.value, false)
})

test('catalog failures and empty catalogs block checkout, while reload can recover', async (t) => {
  const { state, control } = await harness(t, { load: async () => { throw new Error('mock catalog failure') } })
  assert.match(state.validationMessage.value, /Unable to load/)
  control.load = async () => ({ items: [] })
  await state.reload()
  assert.match(state.validationMessage.value, /No bookable/)
  control.load = async () => ({ items: [item(201)] })
  await state.reload()
  assert.equal(state.validationMessage.value, '')
})

test('leaving package mode invalidates pending requests and stale selections', async (t) => {
  const pending = deferred()
  const { state, mode } = await harness(t, { load: () => pending.promise })
  mode.value = false
  await flush()
  pending.resolve({ items: [item(201)] })
  await flush()
  assert.equal(state.loading.value, false)
  assert.equal(state.selectedSkuId.value, '')
  assert.equal(state.options.value.length, 0)
})

test('malformed catalog items cannot crash the confirmation render or permit checkout', async (t) => {
  const { state, control } = await harness(t, { load: async () => ({ items: {} }) })
  assert.equal(state.options.value.length, 0)
  assert.notEqual(state.validationMessage.value, '')
  control.load = async () => ({ items: [null, item(201, { specI18n: {} }), item(202, { redeemTimes: Infinity })] })
  await state.reload()
  assert.equal(state.options.value.length, 1)
  assert.equal(state.selectedSkuId.value, '201')
  assert.equal(state.validationMessage.value, '')
})
