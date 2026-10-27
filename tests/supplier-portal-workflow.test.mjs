import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
import ts from 'typescript'
import * as Vue from 'vue'

// Execute the real SFC setup and business helpers; only external boundaries are mocked.
const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const filename = 'src/modules/admin/pages/supplier-management/index.vue'
const { descriptor, errors } = parse(read(filename), { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: 'supplier-portal-workflow-test' })
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText
const code = transpile(script.content)
const disabledBindings = new Map()
const collectControls = (node) => {
  if (node.tag === 'el-button') {
    const click = node.props.find(prop => prop.type === 7 && prop.name === 'on' && prop.arg?.content === 'click')
    const disabled = node.props.find(prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'disabled')
    if (click?.exp && disabled?.exp) disabledBindings.set(click.exp.content, disabled.exp.content)
  }
  for (const child of node.children || []) collectControls(child)
}
collectControls(baseParse(descriptor.template.content))
const controlDisabled = (handler, state) => {
  const expression = disabledBindings.get(handler)
  assert.ok(expression, `Missing actual disabled binding for ${handler}`)
  return new Function('state', `with (state) { return Boolean(${expression}); }`)(state)
}
const loadModule = (path) => {
  const exports = {}
  runInNewContext(transpile(read(path)), { exports })
  return exports
}
const portal = loadModule('src/modules/admin/utils/supplierPortal.ts')
const i18n = loadModule('src/modules/admin/utils/i18n.ts')
const phones = loadModule('src/utils/phone-dial.ts')
const messages = Object.fromEntries(['en', 'zh'].map(language => [
  language, loadModule(`src/modules/admin/locales/${language}.ts`).default,
]))
const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let i = 0; i < 16; i++) await Promise.resolve()
  await Vue.nextTick()
}
const renderer = Vue.createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
})

async function harness(t, section = 'pricing') {
  const calls = { drafts: [], submissions: [], profileSaves: [], profileResubmits: [], coverage: [], messages: [], routes: [], scrolledFields: [], focusedFields: [], uploads: [], releaseUpload: null, exports: [] }
  const locale = Vue.ref('en')
  const translate = (key, params = {}) => {
    const text = key.split('.').reduce((node, part) => node?.[part], messages[locale.value])
    assert.equal(typeof text, 'string', `Missing translation: ${key}`)
    return text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
  }
  const currentRoute = Vue.ref({ path: `/admin/supplier-management/${section}`, query: {} })
  const router = {
    currentRoute,
    replace: async (route) => { calls.routes.push(clone(route)); currentRoute.value = route },
    push: async (route) => { calls.routes.push(clone(route)); currentRoute.value = route },
  }
  const profile = { id: 10, status: 0, editable: true, extra: {} }
  const api = {
    onboardingMine: async () => ({ data: profile }),
    onboardingSave: async (payload) => { calls.profileSaves.push(clone(payload)); return { data: 10 } },
    onboardingResubmit: async (payload) => { calls.profileResubmits.push(clone(payload)); return { data: 10 } },
    uploadFile: (file, onProgress) => new Promise((resolve, reject) => {
      calls.uploads.push(file?.name || '')
      calls.releaseUpload = (result) => {
        if (result instanceof Error) reject(result)
        else {
          onProgress?.(70)
          resolve(result)
        }
      }
    }),
    supplierOperationsMine: async () => ({}),
    supplierCoverageSave: async (payload) => { calls.coverage.push(clone(payload)); return { coverage: payload } },
    saveQuoteDraft: async (payload) => {
      calls.drafts.push(clone(payload))
      return { data: { ...clone(payload), status: 0, skus: clone(payload.items) } }
    },
    submitQuote: async (payload) => {
      calls.submissions.push(clone(payload))
      return { data: { ...clone(calls.drafts.at(-1) || {}), status: 1, submittedAt: '2026-10-16T01:00:00Z', skus: calls.drafts.at(-1)?.items || [] } }
    },
    exportQuoteSheet: async (spuIds) => {
      calls.exports.push([...(spuIds || [])])
      return new Blob(['quote'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    },
  }
  const session = {
    currentUser: async () => ({ supplierId: 10, supplierNo: 'TEST-10' }),
    supplierDetail: async () => profile,
    rememberSupplierDetail() {},
    patchSupplierDetail() {},
    catalog: async () => [],
    supplierQuotes: async () => [],
  }
  const exports = {}
  runInNewContext(code, {
    exports,
    Blob,
    URL: { createObjectURL: () => 'blob:quote', revokeObjectURL() {} },
    document: {
      createElement: () => ({ href: '', download: '', click() {} }),
      querySelector: () => null,
      getElementById: (id) => ({
        scrollIntoView: () => calls.scrolledFields.push(id),
        querySelector: () => ({ focus: () => calls.focusedFields.push(id) }),
      }),
    },
    require: (name) => {
      if (name === 'vue') return Vue
      if (name === 'vue-i18n') return { useI18n: () => ({ t: translate, locale }) }
      if (name === 'vue-router') return { useRouter: () => router }
      if (name === 'element-plus') return {
        ElMessage: Object.fromEntries(['warning', 'success', 'error', 'info'].map(type => [
          type, (message) => calls.messages.push({ type, message }),
        ])),
        ElMessageBox: {
          confirm: async () => { throw new Error('Unexpected confirmation dialog') },
          prompt: async () => { throw new Error('Unexpected prompt dialog') },
          alert: async (message) => { calls.messages.push({ type: 'alert', message }) },
        },
      }
      if (name === '@/modules/admin/api/supplierWorkbench') return api
      if (name === '@/modules/admin/api/spu') return {
        listBySpu: async () => ({ skus: [] }), listSpuAttachCatalog: async () => [],
      }
      if (name === '@/modules/admin/stores/session') return { useAdminSessionStore: () => session }
      if (name === '@/modules/admin/utils/features') return { supplierOperationsApiEnabled: true }
      if (name === '@/modules/admin/utils/supplierPortal') return portal
      if (name === '@/modules/admin/utils/i18n') return i18n
      if (name === '@/modules/admin/utils/supplierMap') return loadModule('src/modules/admin/utils/supplierMap.ts')
      if (name === '@/modules/admin/utils/supplier-mine') return loadModule('src/modules/admin/utils/supplier-mine.ts')
      if (name === '@/modules/admin/utils/menuPermission') return { isSupplierStaffOrdersOnly: () => false }
      if (name === '@/modules/admin/utils/supplierReviewState') return loadModule('src/modules/admin/utils/supplierReviewState.ts')
      if (name === '@/utils/phone-dial') return phones
      if (name === '@/modules/client/api/supplier-onboarding') return {
        listServiceCategories: async () => [],
        categoryIdPayload: (ids) => ids.map(Number),
        isOtherService: (option) => option.other === true || String(option.categoryId) === '0',
        serviceCategoryLabel: (option) => option.categoryName || option.categoryId,
      }
      if (name === '@/modules/admin/pages/supplier-management/availability.vue') return { default: {} }
      if (name === '@/modules/admin/pages/supplier-management/staff-board.vue') return { default: {} }
      if (name === '@element-plus/icons-vue') return {}
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null }, { section })
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  assert.deepEqual(calls.messages, [])
  return { state: instance.$.setupState, calls, router, locale }
}

async function readyQuote(context, overrides = {}) {
  const { state, router } = context
  state.savedServices = [{
    spuId: 501, categoryId: 11, category: 'Cleaning', name: 'Apartment Cleaning',
    workerCount: 2, phones: ['971501234567'], acceptOrder: 1,
  }]
  Object.assign(state.quoteDialog, {
    visible: true, spuId: 501, name: 'Apartment Cleaning', category: 'Cleaning',
    status: 0, quoteMode: 1, unitPrice: null, unitPriceWithMaterial: null, unitPriceWithoutMaterial: null, priceEditable: true,
    rows: [{ skuId: 601, enabled: true, available: true, staffCount: 2, serviceHours: 3, quotePrice: '329' }],
    attaches: [], ...overrides,
  })
  router.currentRoute.value = {
    path: '/admin/supplier-management/pricing',
    query: { service: '501', category: '11', quoteStep: 'setup' },
  }
  await flush()
}

test('fixed-price missing fields block Review, and completing the price enables Review', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state, calls } = context
  state.quoteDialog.rows[0].quotePrice = ''
  await flush()
  assert.equal(state.quoteMissingCount, 1)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'setup')
  assert.equal(calls.submissions.length, 0)
  assert.equal(calls.messages.at(-1)?.type, 'warning')
  assert.match(calls.messages.at(-1).message, /price/i)
  state.quoteDialog.rows[0].quotePrice = '329'
  state.quoteDialog.rows[0].staffCount = 4
  state.quoteDialog.rows[0].serviceHours = 5
  await flush()
  assert.equal(state.quoteMissingCount, 0)
  assert.equal(state.quoteItems()[0].quotePrice, 329)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'review')
  assert.equal(state.quoteConfirmed, false)
  assert.equal(controlDisabled('submitServiceQuote', state), true)
  state.savedServices = [{ ...state.savedServices[0], workerCount: null, phones: [] }]
  await flush()
  assert.equal(state.quoteMissingCount, 0)
  assert.equal(state.submitProblem(), '')
})

test('select all and select none change only the current specification tab', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state } = context
  state.quoteDialog.rows = [
    { skuId: 1, enabled: false, available: true, groupId: 'a', groupType: '台数', groupValue: '1 台', quotePrice: '10' },
    { skuId: 2, enabled: true, available: true, groupId: 'a', groupType: '台数', groupValue: '1 台', quotePrice: '10' },
    { skuId: 3, enabled: false, available: true, groupId: 'b', groupType: '台数', groupValue: '2 台', quotePrice: '20' },
  ]
  await flush()
  state.quoteGroupTab = 'a'
  await flush()
  state.setQuotesEnabled(true)
  assert.deepEqual(state.quoteDialog.rows.map((row) => row.enabled), [true, true, false])
  state.setQuotesEnabled(false)
  assert.deepEqual(state.quoteDialog.rows.map((row) => row.enabled), [false, false, false])
  state.quoteDialog.rows[2].enabled = true
  state.quoteGroupTab = 'b'
  await flush()
  state.setQuotesEnabled(false)
  assert.equal(state.quoteDialog.rows[0].enabled, false)
  assert.equal(state.quoteDialog.rows[2].enabled, false)
  state.setQuotesEnabled(true)
  assert.deepEqual(state.quoteDialog.rows.map((row) => row.enabled), [false, false, true])
})

test('hourly drafts save independent material rates while retaining existing SKU prices and workload', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    quoteMode: 2, unitPrice: 99, unitPriceWithMaterial: 80, unitPriceWithoutMaterial: 65.5,
    rows: [
      { skuId: 601, enabled: true, available: true, staffCount: 2, serviceHours: 3, quotePrice: '329' },
      { skuId: 602, enabled: false, available: true, staffCount: 4, serviceHours: 1.5, quotePrice: null },
    ],
  })
  const { state, calls } = context
  assert.equal(state.firstPositive(0, 2), 2)
  assert.equal(state.firstPositive('', null, 1.5), 1.5)
  assert.equal(state.firstPositive(0, null, ''), null)
  state.quoteDialog.rows[0].staffCount = 3
  state.quoteDialog.rows[0].serviceHours = 1.5
  await flush()
  const payload = state.quotePayload()
  assert.equal(payload.unitPriceWithMaterial, 80)
  assert.equal(payload.unitPriceWithoutMaterial, 65.5)
  assert.equal(Object.hasOwn(payload, 'unitPrice'), false)
  assert.deepEqual(clone(payload.items), [
    { skuId: 601, staffCount: 3, serviceHours: 1.5, quotePrice: 329, enabled: 1 },
    { skuId: 602, staffCount: 4, serviceHours: 1.5, quotePrice: null, enabled: 1 },
  ])
  assert.equal(state.quoteMissingCount, 0)
  assert.equal(state.submitProblem(), '')
  await state.saveServiceQuote()
  assert.equal(calls.drafts.length, 1)
  assert.equal(calls.drafts[0].unitPriceWithMaterial, 80)
  assert.equal(calls.drafts[0].unitPriceWithoutMaterial, 65.5)
  assert.equal(Object.hasOwn(calls.drafts[0], 'unitPrice'), false)
  assert.equal(state.quoteDialog.unitPriceWithMaterial, 80)
  assert.equal(state.quoteDialog.unitPriceWithoutMaterial, 65.5)

  state.liveQuotes = [{
    ...calls.drafts[0], status: 0, skus: calls.drafts[0].items,
    skuGroups: [{ specValueId: 1, specValueName: 'Standard', skus: calls.drafts[0].items }],
  }]
  state.quoteDialog.unitPriceWithMaterial = null
  state.quoteDialog.unitPriceWithoutMaterial = null
  await state.openServiceQuote(state.savedServices[0])
  await flush()
  assert.equal(state.quoteDialog.unitPriceWithMaterial, 80)
  assert.equal(state.quoteDialog.unitPriceWithoutMaterial, 65.5)
  state.quoteDialog.unitPriceWithMaterial = 82.25
  state.quoteDialog.unitPriceWithoutMaterial = 61.75
  await flush()
  await state.saveServiceQuote()
  assert.equal(calls.drafts[1].unitPriceWithMaterial, 82.25)
  assert.equal(calls.drafts[1].unitPriceWithoutMaterial, 61.75)
  assert.equal(calls.drafts[1].items[0].quotePrice, 329)
  assert.equal(calls.drafts[1].items[1].quotePrice, null)
  assert.equal(Object.hasOwn(calls.drafts[1], 'unitPrice'), false)

  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteScreen, 'review')
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  assert.equal(calls.submissions.length, 1)
  assert.equal(calls.drafts.at(-1).unitPriceWithMaterial, 82.25)
  assert.equal(calls.drafts.at(-1).unitPriceWithoutMaterial, 61.75)
})

test('either missing or nonpositive material rate blocks Review and direct submission despite a positive legacy rate', async (t) => {
  const context = await harness(t)
  const { state, calls } = context
  for (const field of ['unitPriceWithMaterial', 'unitPriceWithoutMaterial']) {
    for (const invalid of [null, 0, -1]) {
      await readyQuote(context, { quoteMode: 2, unitPrice: 99, unitPriceWithMaterial: 80, unitPriceWithoutMaterial: 65 })
      state.quoteDialog[field] = invalid
      state.quoteScreen = 'setup'
      await flush()
      assert.equal(state.quoteMissingCount, 1, `${field}=${invalid}`)
      assert.ok(state.submitProblem())
      state.reviewServiceQuote()
      assert.equal(state.quoteScreen, 'setup')
      assert.equal(calls.messages.at(-1).type, 'warning')
      state.quoteScreen = 'review'
      state.quoteConfirmed = true
      assert.equal(controlDisabled('submitServiceQuote', state), true)
      await state.submitServiceQuote()
      assert.equal(calls.drafts.length, 0)
      assert.equal(calls.submissions.length, 0)
    }
  }
})

test('changing either reviewed material rate clears confirmation and prevents submission', async (t) => {
  const context = await harness(t)
  await readyQuote(context, { quoteMode: 2, unitPriceWithMaterial: 80, unitPriceWithoutMaterial: 65 })
  const { state, calls } = context
  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteScreen, 'review')
  for (const field of ['unitPriceWithMaterial', 'unitPriceWithoutMaterial']) {
    state.quoteConfirmed = true
    state.quoteDialog[field] += 1
    await flush()
    assert.equal(state.quoteConfirmed, false)
    assert.equal(controlDisabled('submitServiceQuote', state), true)
    await state.submitServiceQuote()
    assert.equal(calls.drafts.length, 0)
    assert.equal(calls.submissions.length, 0)
  }
})

test('reopening a legacy hourly quote leaves both material rates to be completed instead of duplicating unitPrice', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state, calls } = context
  state.liveQuotes = [{
    spuId: 501, status: 0, quoteMode: 2, unitPrice: 99,
    skus: [{ skuId: 601, enabled: 1, available: true, quotePrice: 329, staffCount: 2, serviceHours: 3 }],
    skuGroups: [{
      specValueId: 1, specValueName: 'Standard',
      skus: [{ skuId: 601, enabled: 1, available: true, quotePrice: 329, staffCount: 2, serviceHours: 3 }],
    }],
  }]
  await state.openServiceQuote(state.savedServices[0])
  await flush()
  assert.equal(state.quoteDialog.unitPrice, 99)
  assert.equal(state.quoteDialog.unitPriceWithMaterial, null)
  assert.equal(state.quoteDialog.unitPriceWithoutMaterial, null)
  assert.equal(state.quoteMissingCount, 2)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'setup')
  state.quoteDialog.unitPriceWithMaterial = 90
  await flush()
  assert.equal(state.quoteMissingCount, 1)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'setup')
  state.quoteDialog.unitPriceWithoutMaterial = 75
  await flush()
  assert.equal(state.quoteMissingCount, 0)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'review')
  assert.equal(calls.submissions.length, 0)
})

test('disabled and unavailable options require no fields and are excluded from enabled counts', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state } = context
  state.quoteDialog.rows.push(
    { skuId: 602, enabled: false, available: true, staffCount: null, serviceHours: null, quotePrice: null },
    { skuId: 603, enabled: true, available: false, staffCount: null, serviceHours: null, quotePrice: null },
  )
  await flush()
  assert.equal(state.quoteMissingCount, 0)
  assert.equal(state.enabledQuoteRows.length, 1)
  assert.deepEqual(clone(state.quoteItems().map(row => row.enabled)), [1, 0, 0])
  assert.equal(state.submitProblem(), '')
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'review')
})

test('only confirmed Review submits; submitted quotes lock edits and reject repeated submission', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state, calls } = context
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  assert.equal(calls.submissions.length, 0)
  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteConfirmed, false)
  assert.equal(controlDisabled('submitServiceQuote', state), true)
  await state.submitServiceQuote()
  assert.equal(calls.drafts.length, 0)
  state.quoteConfirmed = true
  assert.equal(controlDisabled('submitServiceQuote', state), false)
  await state.submitServiceQuote()
  await flush()
  assert.equal(calls.drafts.length, 1)
  assert.deepEqual(calls.submissions, [{
    supplierId: 10, spuId: 501,
    confirmation: { pricesIncludeVat: true, informationAccurate: true },
  }])
  assert.equal(state.quoteScreen, 'submitted')
  assert.equal(state.quoteDialog.status, 1)
  assert.equal(state.quoteRevisionLocked, true)
  assert.equal(state.quoteUnderReview, true)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'submitted')
  assert.equal(calls.messages.at(-1)?.type, 'warning')
  assert.ok(state.quoteDialog.rows.every(row => state.quoteLineHeld(row)))
  await state.saveServiceQuote()
  await state.submitServiceQuote()
  state.backToQuoteSetup()
  assert.equal(state.quoteScreen, 'submitted')
  assert.equal(calls.drafts.length, 1)
  assert.equal(calls.submissions.length, 1)
})

test('an approved quote can be edited and resubmitted without a price-change request', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    status: 2,
    priceEditable: false,
    canApplyPriceChange: true,
    rejectReason: '',
    rows: [{ skuId: 601, enabled: true, available: true, staffCount: 2, serviceHours: 3, quotePrice: '329', reviewStatus: 2 }],
  })
  const { state, calls } = context
  assert.equal(state.quoteDirectEdit, true)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteUnderReview, false)
  assert.equal(state.quoteDialog.canApplyPriceChange && !state.quoteDirectEdit, false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), false)
  assert.equal(controlDisabled('saveServiceQuote', state), false)
  state.quoteDialog.rows[0].quotePrice = '310'
  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteScreen, 'review')
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  await flush()
  assert.equal(calls.drafts.length, 1)
  assert.equal(calls.drafts[0].items[0].quotePrice, 310)
  assert.equal(calls.submissions.length, 1)
  assert.equal(state.quoteScreen, 'submitted')

  state.liveQuotes = [{
    spuId: 501,
    status: 3,
    rejectReason: 'Price is too high',
    priceEditable: false,
    canApplyPriceChange: true,
    quoteMode: 1,
    skus: [{ skuId: 601, enabled: 0, available: true, quotePrice: 329, staffCount: 2, serviceHours: 3 }],
    skuGroups: [{
      specValueId: 1,
      specValueName: 'Standard',
      skus: [{ skuId: 601, enabled: 0, available: true, quotePrice: 329, staffCount: 2, serviceHours: 3 }],
    }],
  }]
  await state.openServiceQuote(state.savedServices[0])
  await flush()
  assert.equal(state.quoteDialog.status, 3)
  assert.equal(state.quoteDirectEdit, true)
  assert.equal(state.quoteUnderReview, false)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteScreen, 'setup')
  assert.equal(state.quoteDialog.canApplyPriceChange && !state.quoteDirectEdit, false)
  assert.equal(state.quoteDialog.rows[0].enabled, true)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), false)
  assert.equal(controlDisabled('saveServiceQuote', state), false)
  state.quoteDialog.rows[0].quotePrice = '280'
  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteScreen, 'review')
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  await flush()
  assert.equal(calls.drafts.length, 2)
  assert.equal(calls.drafts[1].items[0].quotePrice, 280)
  assert.equal(calls.submissions.length, 2)
  assert.equal(state.quoteScreen, 'submitted')

  state.quoteDialog.status = 2
  state.quoteDialog.rejectReason = ''
  state.quoteDialog.priceEditable = false
  state.quoteDialog.canApplyPriceChange = true
  state.quoteDialog.rows[0].reviewStatus = 3
  state.quoteDialog.rows[0].rejectReason = 'Adjust this option'
  state.quoteScreen = 'setup'
  await flush()
  assert.equal(state.quoteDirectEdit, true)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), false)

  state.quoteDialog.status = 1
  state.quoteDialog.rejectReason = 'Quote was returned'
  state.quoteDialog.rows[0].reviewStatus = undefined
  state.quoteDialog.rows[0].rejectReason = ''
  await flush()
  assert.equal(state.quoteUnderReview, false)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), true)
})

test('editing a reviewed quote clears its confirmation and prevents submission', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state, calls } = context
  state.reviewServiceQuote()
  await flush()
  state.quoteConfirmed = true
  state.quoteDialog.rows[0].quotePrice = '399'
  await flush()
  assert.equal(state.quoteConfirmed, false)
  await state.submitServiceQuote()
  assert.equal(calls.submissions.length, 0)
})

test('profile submit stays clickable and explains missing bank fields or required documents', async (t) => {
  const { state, calls } = await harness(t, 'profile')
  Object.assign(state.companyForm, {
    companyName: 'Test Supplier', licenseNo: 'TEST-001', licenseIssuedBy: 'Dubai DET',
    licenseExpiry: '2099-12-31', address: 'Dubai', contact: 'Test Contact',
    email: 'contact@example.com', mobile: '501234567', whatsapp: '501234567',
  })
  state.otherCommunityOnboarded = 0
  await flush()
  assert.deepEqual(clone(state.profileIssues.map(issue => issue.id)), ['accountName', 'bankName', 'iban', 'tradeLicense', 'bankCertificate'])
  assert.equal(state.bankComplete, false)
  assert.equal(controlDisabled('submitProfileForm', state), false)
  assert.ok(state.profileProblem(1))
  await state.submitProfileForm()
  await flush()
  assert.equal(state.submitTried, true)
  assert.equal(calls.messages.at(-1).message, state.profileIssues[0].message)
  assert.equal(calls.scrolledFields.at(-1), 'profile-field-accountName')
  assert.equal(calls.focusedFields.at(-1), 'profile-field-accountName')
  assert.equal(state.profileSection, 3)
  assert.equal(calls.profileSaves.length, 0)
  assert.equal(calls.profileResubmits.length, 0)
  Object.assign(state.bankForm, { accountName: 'Test Supplier LLC', bankName: 'Test Bank', iban: 'AE070331234567890123456' })
  await flush()
  assert.deepEqual(clone(state.profileIssues.map(issue => issue.id)), ['tradeLicense', 'bankCertificate'])
  await state.submitProfileForm()
  await flush()
  assert.equal(calls.messages.at(-1).message, state.profileIssues[0].message)
  assert.equal(calls.scrolledFields.at(-1), 'profile-field-tradeLicense')
  assert.equal(calls.profileSaves.length, 0)
  state.tradeLicenseFiles = ['https://example.com/trade-license.pdf']
  await flush()
  assert.deepEqual(clone(state.profileIssues.map(issue => issue.id)), ['bankCertificate'])
  await state.submitProfileForm()
  await flush()
  assert.equal(calls.messages.at(-1).message, state.profileIssues[0].message)
  assert.equal(calls.scrolledFields.at(-1), 'profile-field-bankCertificate')
  assert.equal(calls.profileSaves.length, 0)
  state.otherDocumentFiles = ['https://example.com/bank-certificate.pdf']
  await flush()
  assert.equal(state.bankComplete, true)
  assert.equal(state.profileIssues.length, 0)
  assert.equal(controlDisabled('submitProfileForm', state), false)
  assert.equal(state.profileProblem(1), '')
  await state.submitProfileForm()
  assert.equal(calls.profileSaves.length, 1)
  assert.equal(calls.profileSaves[0].status, 1)
})

test('resubmitting from the last step points to company issues and submits after they are fixed', async (t) => {
  const { state, calls, locale } = await harness(t, 'profile')
  locale.value = 'zh'
  state.onboardingStatus = 3
  state.profileSection = 3
  Object.assign(state.companyForm, {
    companyName: 'Test Supplier', licenseNo: 'TEST-001', licenseIssuedBy: '',
    licenseExpiry: '2099-12-31', address: 'Dubai', contact: 'Test Contact',
    email: 'contact@example.com', mobile: '501234567', whatsapp: '501234567',
  })
  Object.assign(state.bankForm, { accountName: 'Test Supplier LLC', bankName: 'Test Bank', iban: 'AE070331234567890123456' })
  state.tradeLicenseFiles = ['https://example.com/trade-license.pdf']
  state.otherDocumentFiles = ['https://example.com/bank-certificate.pdf']
  await flush()
  assert.equal(controlDisabled('submitProfileForm', state), false)
  await state.submitProfileForm()
  assert.equal(state.profileSection, 0)
  assert.equal(calls.messages.at(-1).type, 'warning')
  assert.equal(calls.messages.at(-1).message, messages.zh.admin.supplierProfile.licenseIssuedByRequired)
  assert.equal(calls.focusedFields.at(-1), 'profile-field-licenseIssuedBy')
  assert.equal(calls.profileResubmits.length, 0)

  state.companyForm.licenseIssuedBy = 'Dubai DET'
  await state.submitProfileForm()
  assert.equal(calls.profileResubmits.length, 1)
  assert.equal(calls.profileSaves.length, 0)
})

test('VAT certificate uploads with visible progress and is stored beside the bank certificate', async (t) => {
  const { state, calls } = await harness(t, 'profile')
  const pending = state.uploadDocFile('vat', {
    file: { name: 'vat-certificate.pdf', size: 1024 },
    onProgress() {},
    onSuccess() {},
    onError() {},
  })
  await flush()
  assert.equal(state.docUploading('vat'), true)
  assert.equal(state.docUploadPercent('vat'), 0)
  assert.equal(calls.uploads.at(-1), 'vat-certificate.pdf')
  calls.releaseUpload({ data: 'https://example.com/vat-certificate.pdf' })
  await pending
  await flush()
  assert.equal(state.docUploading('vat'), false)
  assert.deepEqual(clone(state.vatCertificateFiles), ['https://example.com/vat-certificate.pdf'])
  assert.equal(state.profileIssues.some(issue => issue.id === 'vatCertificate'), false)
  const payload = state.buildProfilePayload(0)
  assert.deepEqual(clone(payload.extra.vatFile), ['https://example.com/vat-certificate.pdf'])

  state.applyProfile({
    id: 10,
    status: 0,
    editable: true,
    extra: { vatFile: ['https://example.com/saved-vat.pdf'], otherDocuments: ['https://example.com/bank.pdf'] },
  })
  assert.deepEqual(clone(state.vatCertificateFiles), ['https://example.com/saved-vat.pdf'])
  assert.deepEqual(clone(state.otherDocumentFiles), ['https://example.com/bank.pdf'])
})

test('review-period coverage saves independently without changing the onboarding snapshot', async (t) => {
  const { state, calls } = await harness(t)
  state.onboardingStatus = 1
  state.profileEditable = false
  state.independentOperationsReady = true
  state.companyForm.companyName = 'Test Supplier'
  state.platformAreas = [{ id: 9, name: 'Test Zone' }]
  state.communitiesByArea = { 9: [{ id: 901, name: 'Test Community' }] }
  state.draftCommunityIds = [901]
  state.draftBareAreaIds = []
  await state.saveAreas()
  assert.deepEqual(calls.coverage, [{ supplierId: 10, areaIds: [9], communityIds: [901] }])
  assert.equal(calls.profileSaves.length, 0)
  assert.equal(calls.profileResubmits.length, 0)
  assert.equal(state.onboardingStatus, 1)
  assert.deepEqual(clone(state.selectedAreaIds), [9])
})

test('review-period operational saves stop safely when the server capability is unavailable', async (t) => {
  const { state, calls } = await harness(t)
  state.onboardingStatus = 1
  state.profileEditable = false
  state.independentOperationsReady = false
  state.companyForm.companyName = 'Test Supplier'

  state.platformAreas = [{ id: 9, name: 'Test Zone' }]
  state.communitiesByArea = { 9: [{ id: 901, name: 'Test Community' }] }
  state.draftCommunityIds = [901]
  state.draftBareAreaIds = []
  await state.saveAreas()

  assert.equal(calls.coverage.length, 0)
  assert.equal(calls.profileSaves.length, 0)
  assert.deepEqual(calls.messages.map(message => message.type), ['warning'])
  assert.ok(calls.messages.every(message => /upgrad/i.test(message.message)))
})

test('checked services export only those quote rows and keep the rest of the selection', async (t) => {
  const { state, calls } = await harness(t)
  state.supplierRecordId = 10
  state.savedServices = [
    { spuId: 501, categoryId: 11, category: 'Cleaning', name: 'Apartment', workerCount: 1, phones: [], acceptOrder: 1 },
    { spuId: 502, categoryId: 11, category: 'Cleaning', name: 'Villa', workerCount: 1, phones: [], acceptOrder: 1 },
    { spuId: 503, categoryId: 12, category: 'Move', name: 'Move', workerCount: 1, phones: [], acceptOrder: 1 },
  ]
  await flush()
  assert.equal(state.quoteCategory, '11')
  assert.equal(state.quoteExportLabel, messages.en.admin.supplierPricing.downloadTemplate)
  state.toggleQuoteSpu(501, true)
  assert.equal(state.quoteExportLabel, 'Export selected (1)')
  await state.downloadQuoteTemplate()
  assert.deepEqual(calls.exports[0], [501])
  state.toggleVisibleQuoteSelection(true)
  assert.deepEqual(clone(state.selectedQuoteSpuIds), [501, 502])
  state.quoteCategory = '12'
  await flush()
  state.toggleVisibleQuoteSelection(true)
  assert.deepEqual(clone(state.selectedQuoteSpuIds), [501, 502, 503])
  await state.downloadQuoteTemplate()
  assert.deepEqual(calls.exports[1], [501, 502, 503])
  state.savedServices = state.savedServices.filter((row) => row.spuId !== 502)
  await flush()
  assert.deepEqual(clone(state.selectedQuoteSpuIds), [501, 503])
  state.selectedQuoteSpuIds = []
  await state.downloadQuoteTemplate()
  assert.deepEqual(calls.exports[2], [])
  assert.match(descriptor.template.content, /toggleQuoteSpu\(row\.spuId, checked === true\)/)
  assert.match(descriptor.template.content, /quoteExportLabel/)
  assert.match(descriptor.template.content, /admin\.supplierPricing\.exportSelectionHint/)
})

test('actual supplier portal template compiles with the tested setup bindings', () => {
  assert.deepEqual(compileTemplate({
    source: descriptor.template.content, filename,
    id: 'supplier-portal-workflow-test', compilerOptions: { bindingMetadata: script.bindings },
  }).errors, [])
})

test('profile review status keeps a compact heading and a separate explanation row', () => {
  const styles = descriptor.styles.map(style => style.content).join('\n')
  const optimizationStyles = read('src/modules/admin/pages/supplier-management/portal-optimization.css')
  assert.match(
    descriptor.template.content,
    /class="profile-status__heading"[\s\S]*statusLabel[\s\S]*profileStatusLabel[\s\S]*<\/div>[\s\S]*<p v-if="onboardingStatus === 1">[\s\S]*reviewHint/,
  )
  assert.match(styles, /\.profile-status__heading\s*\{[\s\S]*?display:\s*flex;/)
  assert.match(styles, /\.profile-status__heading strong\s*\{[\s\S]*?font-size:\s*18px;/)
  assert.match(styles, /\.profile-status p\s*\{[\s\S]*?display:\s*block;[\s\S]*?font-size:\s*13px;/)
  assert.match(
    optimizationStyles,
    /\.profile-status\.is-review,\s*\.profile-status\.is-rejected\s*\{[^}]*display:\s*grid;/,
  )
  assert.equal(
    messages.en.admin.supplierProfile.reviewHint,
    'Your business profile is currently under review. Editing will be available once the review process is complete.',
  )
})
