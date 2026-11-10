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
const template = baseParse(descriptor.template.content)
const descendants = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...(node.children || []).flatMap(child => descendants(child, predicate)),
]
const hasClass = (node, name) => node.props?.some(prop =>
  prop.type === 6 && prop.name === 'class' && prop.value?.content.split(/\s+/).includes(name),
)
const directive = (node, name, argument) => node.props?.find(prop =>
  prop.type === 7 && prop.name === name && (argument === undefined || prop.arg?.content === argument),
)?.exp?.content
const evaluate = (expression, state, locals = {}) => {
  assert.ok(expression, 'Expected a binding from the real supplier portal template')
  const canAction = () => true
  return new Function('state', 'locals', 'canAction', `with (state) { with (locals) { return (${expression}); } }`)(state, locals, canAction)
}
const disabledBindings = new Map()
const collectControls = (node) => {
  if (node.tag === 'el-button') {
    const click = node.props.find(prop => prop.type === 7 && prop.name === 'on' && prop.arg?.content === 'click')
    const disabled = node.props.find(prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'disabled')
    if (click?.exp && disabled?.exp) disabledBindings.set(click.exp.content, disabled.exp.content)
  }
  for (const child of node.children || []) collectControls(child)
}
collectControls(template)
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
  for (let i = 0; i < 24; i++) await Promise.resolve()
  await Vue.nextTick()
}
const renderer = Vue.createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
})

async function harness(t, section = 'pricing', mobile = false) {
  const calls = { drafts: [], submissions: [], priceChanges: [], profileSaves: [], profileResubmits: [], coverage: [], messages: [], routes: [], scrolledFields: [], focusedFields: [], uploads: [], releaseUpload: null, exports: [], shelfNotices: [], shelfAcks: [], notifications: [], shelfNoticeResponse: { unread: false, services: [] } }
  calls.orders = []
  calls.staffPages = []
  calls.categoryContacts = []
  calls.serviceRemovals = []
  calls.packageSaves = []
  calls.confirm = async () => { throw new Error('Unexpected confirmation dialog') }
  const locale = Vue.ref('en')
  const translate = (key, params = {}) => {
    const text = key.split('.').reduce((node, part) => node?.[part], messages[locale.value])
    assert.equal(typeof text, 'string', `Missing translation: ${key}`)
    return text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
  }
  const currentRoute = Vue.ref({ path: `/admin/supplier-management/${mobile ? 'h5/' : ''}${section}`, query: {} })
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
    supplierPackages: async () => ({ data: [] }),
    supplierPackageQuotes: async () => ({ data: [] }),
    supplierPackageShelfNotices: async () => ({ data: { unread: false, packages: [] } }),
    supplierCoverageSave: async (payload) => { calls.coverage.push(clone(payload)); return { coverage: payload } },
    supplierAssignedOrders: async (payload) => {
      calls.orders.push(clone(payload))
      return { data: { list: [], total: 0 } }
    },
    supplierStaffPage: async (payload) => {
      calls.staffPages.push(clone(payload))
      return { data: { list: [
        { adminUserId: 41, name: 'Maya', phone: '971501234567' },
        { adminUserId: 42, name: 'Suspended employee', suspended: true },
      ], total: 2 } }
    },
    saveCategoryContacts: async (payload) => { calls.categoryContacts.push(clone(payload)); return {} },
    removeSupplierService: async (payload) => { calls.serviceRemovals.push(clone(payload)); return { data: { removedSkuCount: 1 } } },
    saveSupplierPackages: async (payload) => { calls.packageSaves.push(clone(payload)); return {} },
    saveQuoteDraft: async (payload) => {
      calls.drafts.push(clone(payload))
      return { data: { ...clone(payload), status: 0, skus: clone(payload.items) } }
    },
    submitQuote: async (payload) => {
      calls.submissions.push(clone(payload))
      const body = calls.submitResponse || { status: 1, submittedAt: '2026-10-16T01:00:00Z' }
      return { data: { ...clone(calls.drafts.at(-1) || {}), ...clone(body), skus: body.skus || calls.drafts.at(-1)?.items || [] } }
    },
    applyQuotePriceChange: async (payload) => {
      calls.priceChanges.push(clone(payload))
      return { data: { status: 2, priceEditable: false, canApplyPriceChange: false, priceChangeStatus: 1, priceChangeReason: payload.reason } }
    },
    exportQuoteSheet: async (spuIds) => {
      calls.exports.push([...(spuIds || [])])
      return new Blob(['quote'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    },
    supplierShelfNotices: async (supplierId) => {
      calls.shelfNotices.push(supplierId)
      return calls.shelfNoticeResponse
    },
    acknowledgeSupplierShelfNotices: async (payload) => {
      calls.shelfAcks.push(clone(payload))
      return {}
    },
  }
  const session = {
    currentUser: async () => ({ supplierId: 10, supplierNo: 'TEST-10' }),
    supplierDetail: async () => profile,
    rememberSupplierDetail() {},
    patchSupplierDetail() {},
    catalog: async () => [],
    supplierQuotes: async () => [],
    rememberPackageQuotes() {},
    serviceAreas: async () => [],
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
          confirm: async (...args) => calls.confirm(...args),
          prompt: async () => { throw new Error('Unexpected prompt dialog') },
          alert: async (message) => { calls.messages.push({ type: 'alert', message }) },
        },
        ElButton: { name: 'ElButton' },
        ElNotification: (options) => {
          const record = {
            position: options.position,
            duration: options.duration,
            title: options.title,
            customClass: options.customClass,
            closed: false,
          }
          calls.notifications.push(record)
          return {
            close() {
              if (record.closed) return
              record.closed = true
              options.onClose?.()
            },
          }
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
      if (name === '@/modules/admin/utils/supplierShelfNotice') return { supplierShelfNoticeUnread: { value: false } }
      if (name === '@/modules/admin/utils/supplierMap') return loadModule('src/modules/admin/utils/supplierMap.ts')
      if (name === '@/modules/admin/utils/supplier-mine') return loadModule('src/modules/admin/utils/supplier-mine.ts')
      if (name === '@/modules/admin/utils/menuPermission') return { isSupplierStaffOrdersOnly: () => false, hasAdminMenuAccess: () => true }
      if (name === '@/modules/admin/utils/supplierReviewState') return loadModule('src/modules/admin/utils/supplierReviewState.ts')
      if (name === '@/modules/admin/utils/quoteAcceptBand') return loadModule('src/modules/admin/utils/quoteAcceptBand.ts')
      if (name === '@/utils/phone-dial') return phones
      if (name === '@/modules/client/api/supplier-onboarding') return {
        listServiceCategories: async () => [],
        categoryIdPayload: (ids) => ids.map(Number),
        isOtherService: (option) => option.other === true || String(option.categoryId) === '0',
        serviceCategoryLabel: (option) => option.categoryName || option.categoryId,
      }
      if (name === '@/modules/admin/components/AdminBreadcrumb.vue') return { default: {} }
      if (name === '@/modules/admin/components/SupplierDocumentPreview.vue') return { default: {} }
      if (name === '@/modules/admin/pages/supplier-management/availability.vue') return { default: {} }
      if (name === '@/modules/admin/pages/supplier-management/staff-board.vue') return { default: {} }
      if (name === '@element-plus/icons-vue') return {}
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null }, { section, mobile })
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

test('add-ons start selected until the supplier has saved a price for some of them', async (t) => {
  const { state } = await harness(t)
  const fresh = state.mapAttaches([
    { attachValueId: 1, attachValueName: 'Ironing', canServe: false },
    { attachValueId: 2, attachValueName: 'Oven', canServe: false },
  ])
  assert.deepEqual(fresh.map((item) => item.offered), [true, true])

  const saved = state.mapAttaches([
    { attachValueId: 1, attachValueName: 'Ironing', canServe: true, quotePrice: 30 },
    { attachValueId: 2, attachValueName: 'Oven', canServe: false },
  ])
  assert.deepEqual(saved.map((item) => item.offered), [true, false])
})

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

test('person-hour quotes save one rate and do not ask for material rates or option prices', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    quoteMode: 3, unitPrice: 45, unitPriceWithMaterial: 80, unitPriceWithoutMaterial: 60,
    rows: [
      { skuId: 601, enabled: false, available: true, quotePrice: null },
      { skuId: 602, enabled: false, available: false, quotePrice: null },
    ],
  })
  const { state, calls, locale } = context
  assert.equal(state.assignedQuoteMode({ configuredQuoteMode: 3, status: 0 }), 3)
  assert.equal(state.assignedQuoteMode({ quoteMode: 3, configuredQuoteMode: 1, status: 1 }), 3)
  assert.equal(state.assignedQuoteMode({ quoteMode: 1, configuredQuoteMode: 3, status: 0 }), 3)
  assert.equal(state.assignedQuoteMode({ quoteMode: 1, configuredQuoteMode: 3, status: 2, priceEditable: false }), 3)
  assert.equal(state.hourlyQuote, true)
  assert.equal(state.activeHourlyRateFields.length, 1)
  assert.equal(state.activeHourlyRateFields[0].key, 'unitPrice')
  assert.equal(state.quoteModeLabel(3), 'Person-hour rate')
  locale.value = 'zh'
  assert.equal(state.quoteModeLabel(3), '按人小时报价')
  locale.value = 'en'
  assert.equal(state.quoteProgress.done, 1)
  assert.equal(state.quoteProgress.total, 1)
  assert.equal(state.quoteMissingCount, 0)
  const payload = state.quotePayload()
  assert.equal(payload.quoteMode, 3)
  assert.equal(payload.unitPrice, 45)
  assert.equal(Object.hasOwn(payload, 'unitPriceWithMaterial'), false)
  assert.equal(Object.hasOwn(payload, 'unitPriceWithoutMaterial'), false)
  assert.deepEqual(payload.items.map((item) => item.enabled), [1])
  assert.equal(state.submitProblem(), '')
  await state.saveServiceQuote()
  assert.equal(calls.drafts[0].unitPrice, 45)
  assert.equal(Object.hasOwn(calls.drafts[0], 'unitPriceWithMaterial'), false)
  state.quoteDialog.unitPrice = null
  await flush()
  assert.equal(state.quoteMissingCount, 1)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'setup')
  state.quoteDialog.unitPrice = 45
  await flush()
  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteScreen, 'review')
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  assert.equal(calls.submissions.length, 1)
  assert.equal(calls.drafts.at(-1).quoteMode, 3)
  assert.equal(calls.drafts.at(-1).unitPrice, 45)
})

test('quantity quotes save one unit price and do not ask for option prices', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    quoteMode: 4, unitPrice: 25, unitPriceWithMaterial: 80, unitPriceWithoutMaterial: 60,
    rows: [
      { skuId: 601, enabled: false, available: true, quotePrice: 100 },
      { skuId: 602, enabled: false, available: false, quotePrice: null },
    ],
  })
  const { state, calls, locale } = context
  assert.equal(state.assignedQuoteMode({ quoteMode: 1, configuredQuoteMode: 4, status: 2 }), 4)
  assert.equal(state.quoteNeedsNewMode({ quoteMode: 1, configuredQuoteMode: 4, status: 2, unitPrice: null, skus: [{ quotePrice: 100 }] }), true)
  assert.equal(state.hourlyQuote, true)
  assert.equal(state.hourlyRuleKey, 'admin.supplierPortal.quantityRule')
  assert.equal(state.activeHourlyRateFields.length, 1)
  assert.equal(state.activeHourlyRateFields[0].key, 'unitPrice')
  locale.value = 'zh'
  assert.equal(state.quoteModeLabel(4), '按照数量报价')
  locale.value = 'en'
  const payload = state.quotePayload()
  assert.equal(payload.quoteMode, 4)
  assert.equal(payload.unitPrice, 25)
  assert.equal(payload.items[0].quotePrice, null)
  assert.equal(payload.items[0].enabled, 1)
  assert.equal(state.submitProblem(), '')
  await state.saveServiceQuote()
  assert.equal(calls.drafts[0].quoteMode, 4)
  assert.equal(calls.drafts[0].unitPrice, 25)
  assert.equal(Object.hasOwn(calls.drafts[0], 'unitPriceWithMaterial'), false)
})

test('a quantity quote lists each sku under the unit price', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    quoteMode: 4,
    unitPrice: 25,
    columns: [{ key: 'size', nameI18n: { zh: '面积', en: 'Size' }, fallback: 'Size' }],
    rows: [
      {
        skuId: 601,
        available: true,
        skuCode: '9f3c2a10-1111-2222-3333-444444444444',
        specLines: [
          { specTypeName: 'What do you need help with?', specValueName: 'Shelves & Wall Mounting' },
          { specTypeName: '需要什么帮助？', specValueName: '窗帘安装' },
          { specTypeName: 'ApolloHomeSize', specValueName: '1 Bedroom' },
          {
            specTypeNameI18n: { zh: '房型', en: 'Home type' },
            specValueName: '1 BHK',
            specValueRemarkI18n: { zh: '约 70 平方米', en: 'About 70 sqm' },
          },
        ],
      },
      { skuId: 602, available: false, specLines: [{ specTypeName: '房型', specValueName: '停售' }] },
      {
        skuId: 603,
        available: true,
        skuCode: 'CESS-2',
        specs: { size: { en: '90 sqm', zh: '90 平方米' } },
      },
    ],
  })
  const { state, locale } = context
  locale.value = 'zh'
  await flush()
  assert.deepEqual(JSON.parse(JSON.stringify(state.quantitySkuNotes)), [
    { id: 601, text: 'Shelves & Wall Mounting；窗帘安装；1 Bedroom；房型: 1 BHK（约 70 平方米）' },
    { id: 603, text: '面积: 90 平方米' },
  ])
  locale.value = 'en'
  await flush()
  assert.equal(JSON.parse(JSON.stringify(state.quantitySkuNotes))[0].text, 'Shelves & Wall Mounting; 窗帘安装; 1 Bedroom; Home type: 1 BHK (About 70 sqm)')
  assert.equal(state.optionPrices.length, 2)
  assert.equal(state.optionPrices[0].price, 25)
  assert.equal(state.optionPrices[0].note, '')
  assert.equal(state.optionPrices[1].price, 25)
  state.optionPriceQuery = 'shelves'
  await flush()
  assert.equal(state.visibleOptionPrices.length, 1)
  assert.equal(state.visibleOptionPrices[0].id, 601)
  state.optionPriceQuery = ''
  assert.match(read(filename), /class="quantity-sku-notes"/)
  assert.match(read(filename), /class="option-prices"/)
  for (const mode of [2, 3, 4]) {
    state.quoteDialog.quoteMode = mode
    await flush()
    assert.equal(JSON.parse(JSON.stringify(state.quantitySkuNotes)).length, 2, `mode ${mode}`)
  }
  state.quoteDialog.quoteMode = 1
  await flush()
  assert.deepEqual(JSON.parse(JSON.stringify(state.quantitySkuNotes)), [])
  state.quoteDialog.rows[0].supplierFulfillRemark = ' 带梯子 '
  state.quoteDialog.quoteMode = 3
  await flush()
  assert.match(JSON.parse(JSON.stringify(state.quantitySkuNotes))[0].text, /Note: 带梯子/)
  locale.value = 'zh'
  await flush()
  assert.match(JSON.parse(JSON.stringify(state.quantitySkuNotes))[0].text, /备注：带梯子/)
  assert.match(read(filename), /class="quote-fulfill-remark"/)
  state.quoteDialog.rows[0].staffCount = 2
  state.quoteDialog.rows[0].serviceHours = 3
  state.quoteDialog.unitPrice = 50
  await flush()
  assert.equal(state.optionPrices[0].price, 300)
  assert.equal(state.optionPrices[0].note, '2 人 × 3 小时')
  assert.equal(state.optionPrices[0].excl, 285.71)
  assert.equal(state.optionPrices[0].calculation, '50.00 × 2 人 × 3 小时')
  assert.equal(state.optionPrices[1].price, 50)
  assert.equal(state.optionPrices[1].excl, 47.62)
  assert.equal(state.optionPriceRange.low, 50)
  assert.equal(state.optionPriceRange.high, 300)
  state.quoteDialog.quoteMode = 4
  await flush()
  assert.equal(state.optionPrices[0].price, 50)
  assert.equal(state.optionPrices[0].note, '')
  assert.equal(state.optionPrices[0].calculation, '50.00')
  assert.equal(state.optionPrices[0].excl, 47.62)
  assert.match(read(filename), /option-prices__table-wrap/)
  state.quoteDialog.quoteMode = 2
  state.quoteDialog.unitPriceWithMaterial = 80
  state.quoteDialog.unitPriceWithoutMaterial = 80
  await flush()
  assert.equal(state.optionPrices[0].price, 480)
})

test('material option prices read cleaner and hour specs in both languages', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    quoteMode: 2,
    unitPriceWithMaterial: 20,
    unitPriceWithoutMaterial: 30,
    rows: [
      {
        skuId: 701,
        available: true,
        groupValue: 'Without Materials',
        specLines: [
          {
            specTypeNameI18n: { en: 'With/Without Materials', 'zh-CN': '是否带材料' },
            specValueNameI18n: { en: 'Without Materials', 'zh-CN': '不带材料' },
          },
          {
            specTypeNameI18n: { en: 'Duration', 'zh-CN': '时长' },
            specValueNameI18n: { en: '2 Hours', 'zh-CN': '2小时' },
          },
          {
            specTypeNameI18n: { en: 'Number of Cleaners', 'zh-CN': '清洁人数' },
            specValueNameI18n: { en: '1 Cleaner', 'zh-CN': '1人' },
          },
        ],
      },
      {
        skuId: 702,
        available: true,
        groupValue: 'With Materials',
        specLines: [
          {
            specTypeNameI18n: { en: 'With/Without Materials', 'zh-CN': '是否带材料' },
            specValueNameI18n: { en: 'With Materials', 'zh-CN': '带材料' },
          },
          {
            specTypeNameI18n: { en: 'Duration', 'zh-CN': '时长' },
            specValueNameI18n: { en: '2 Hours', 'zh-CN': '2小时' },
          },
          {
            specTypeNameI18n: { en: 'Number of Cleaners', 'zh-CN': '清洁人数' },
            specValueNameI18n: { en: '2 Cleaner', 'zh-CN': '2人' },
          },
        ],
      },
    ],
  })
  const { state, locale } = context
  locale.value = 'en'
  await flush()
  assert.equal(state.optionPrices[0].price, 60)
  assert.equal(state.optionPrices[0].calculation, '30.00 × 1 tech × 2 hr')
  assert.equal(state.optionPrices[0].excl, 57.14)
  assert.equal(state.optionPrices[1].price, 80)
  assert.equal(state.optionPrices[1].calculation, '20.00 × 2 tech × 2 hr')
  locale.value = 'zh'
  await flush()
  assert.equal(state.optionPrices[0].price, 60)
  assert.equal(state.optionPrices[0].calculation, '30.00 × 1 人 × 2 小时')
  assert.equal(state.optionPrices[1].price, 80)
  assert.equal(state.optionPrices[1].calculation, '20.00 × 2 人 × 2 小时')
})

test('addon-only quotes hide specification prices and submit them as zero', async (t) => {
  const context = await harness(t)
  const { state } = context
  state.liveQuotes = [{
    spuId: 501,
    onlyAddonPrice: true,
    attachModuleTitle: 'Curtain extras',
    quoteMode: 1,
    configuredQuoteMode: 1,
    status: 0,
    priceEditable: true,
    skus: [],
  }]
  await state.openServiceQuote({ spuId: 501, name: 'Curtain Cleaning', category: 'Home' })
  assert.equal(state.quoteDialog.onlyAddonPrice, true)
  assert.equal(state.quoteDialog.attachModuleTitle, 'Curtain extras')
  await readyQuote(context, {
    quoteMode: 1,
    onlyAddonPrice: true,
    attachModuleTitle: 'Curtain extras',
    rows: [{ skuId: 701, available: true, enabled: false, quotePrice: null }],
  })
  state.quoteDialog.attaches = state.mapAttaches([
    { attachValueId: 9, attachValueName: 'Ironing', canServe: true, quotePrice: 15 },
  ])
  state.zeroAddonSpecPrices()
  await flush()
  assert.equal(state.addonOnlyQuote, true)
  assert.equal(state.quoteDialog.rows[0].quotePrice, 0)
  assert.equal(state.quoteDialog.rows[0].enabled, true)
  assert.equal(state.submitProblem(), '')
  const payload = state.quotePayload()
  assert.equal(payload.items[0].quotePrice, 0)
  assert.equal(payload.items[0].enabled, 1)
  assert.deepEqual(clone(payload.attaches), [{ attachValueId: 9, quotePrice: 15 }])
  assert.equal(Object.hasOwn(payload, 'unitPrice'), false)
  assert.equal(Object.hasOwn(payload, 'unitPriceWithMaterial'), false)
  state.quoteDialog.quoteMode = 2
  state.quoteDialog.unitPriceWithMaterial = null
  state.quoteDialog.unitPriceWithoutMaterial = null
  await flush()
  assert.equal(state.submitProblem(), '')
  assert.equal(state.quotePayload().items[0].quotePrice, 0)
  assert.match(descriptor.template.content, /v-if="!hourlyQuote && !addonOnlyQuote"/)
  assert.match(descriptor.template.content, /v-if="hourlyQuote && !addonOnlyQuote"/)
})

test('an approved quote in a different mode is quoted again in the service mode', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state, calls } = context
  state.liveQuotes = [{
    spuId: 501,
    status: 2,
    priceEditable: false,
    quoteMode: 1,
    configuredQuoteMode: 3,
    unitPrice: null,
    skus: [{ skuId: 601, enabled: 1, available: true, quotePrice: 100, reviewStatus: 2, acceptBand: 1 }],
    skuGroups: [{
      specValueId: 1,
      specValueName: 'Standard',
      skus: [{ skuId: 601, enabled: 1, available: true, quotePrice: 100, reviewStatus: 2, acceptBand: 1 }],
    }],
  }]
  await state.openServiceQuote(state.savedServices[0])
  await flush()
  assert.equal(state.quoteDialog.quoteMode, 3)
  assert.equal(state.quoteDialog.modeReset, true)
  assert.equal(state.hourlyQuote, true)
  assert.equal(state.quoteDialog.unitPrice, null)
  assert.equal(state.quoteDialog.rows[0].quotePrice, null)
  assert.equal(state.quoteDialog.rows[0].reviewStatus, undefined)
  assert.equal(state.quoteCanRevise, false)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.hourlyRateHeld, false)
  assert.equal(state.quoteScreen, 'setup')
  state.quoteDialog.unitPrice = 48
  await flush()
  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteScreen, 'review')
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  await flush()
  assert.equal(calls.drafts[0].quoteMode, 3)
  assert.equal(calls.drafts[0].unitPrice, 48)
  assert.equal(calls.drafts[0].items[0].quotePrice, null)
  assert.equal(calls.submissions.length, 1)
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
  assert.deepEqual(clone(state.quoteItems().map(row => row.skuId)), [601, 602])
  assert.deepEqual(clone(state.quoteItems().map(row => row.enabled)), [1, 0])
  assert.equal(state.submitProblem(), '')
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'review')
})

test('a discontinued specification is removed and a new specification is quoted again', async (t) => {
  const context = await harness(t)
  await readyQuote(context)
  const { state, calls } = context
  state.liveQuotes = [{
    spuId: 501,
    status: 2,
    priceEditable: false,
    quoteMode: 1,
    configuredQuoteMode: 1,
    skus: [
      { skuId: 601, enabled: 1, available: false, quotePrice: 80, reviewStatus: 2 },
      { skuId: 602, enabled: 1, available: true, quotePrice: null },
    ],
    skuGroups: [{
      specValueId: 1,
      specValueName: 'Unmount & Reinstall TV',
      skus: [
        { skuId: 601, enabled: 1, available: false, quotePrice: 80, reviewStatus: 2 },
        { skuId: 602, enabled: 1, available: true, quotePrice: null },
      ],
    }],
  }]
  await state.openServiceQuote(state.savedServices[0])
  await flush()
  assert.equal(state.quoteDialog.rows.length, 1)
  assert.equal(state.quoteDialog.rows[0].skuId, 602)
  assert.equal(state.quoteDialog.rows[0].quotePrice, null)
  assert.equal(state.quoteMissingCount, 1)
  state.quoteDialog.rows[0].quotePrice = '90'
  state.reviewServiceQuote()
  await flush()
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  await flush()
  assert.deepEqual(calls.drafts.at(-1).items.map((item) => item.skuId), [602])
  assert.equal(calls.drafts.at(-1).items[0].quotePrice, 90)
})

test('an automatic rejection tells the supplier the price was too high', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    quoteMode: 4,
    unitPrice: 1000,
    rows: [{ skuId: 601, enabled: true, available: true, quotePrice: null }],
  })
  const { state, calls, locale } = context
  locale.value = 'zh'
  calls.submitResponse = {
    status: 3,
    rejectReason: 'Your price is too high. Please submit a lower quote.',
    skus: [{
      skuId: 601,
      reviewStatus: 3,
      enabled: 0,
      rejectReason: 'Your price is too high. Please submit a lower quote.',
    }],
  }
  state.reviewServiceQuote()
  await flush()
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  await flush()
  assert.equal(calls.messages.at(-1)?.type, 'warning')
  assert.equal(calls.messages.at(-1)?.message, '价格太高，报价已被拒绝')
  assert.equal(state.quoteScreen, 'setup')
  assert.equal(state.quoteDialog.status, 3)
  assert.equal(state.supplierRejectCopy(state.quoteDialog.rejectReason), '价格太高，报价已被拒绝')
  assert.equal(calls.messages.some((message) => message.message === '报价已提交审核'), false)
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

test('approved prices can be changed and submitted again, and rejected prices can be resubmitted', async (t) => {
  const context = await harness(t)
  await readyQuote(context, {
    status: 2,
    priceEditable: false,
    canApplyPriceChange: true,
    rejectReason: '',
    rows: [{ skuId: 601, enabled: true, available: true, staffCount: 2, serviceHours: 3, quotePrice: '329', acceptBand: 1, reviewStatus: 2 }],
  })
  const { state, calls } = context
  assert.equal(state.quoteDirectEdit, false)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteCanRevise, true)
  assert.equal(state.quoteUnderReview, false)
  assert.equal(state.canRequestPriceChange, false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), false)
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[0]).tone, 'direct')
  assert.equal(controlDisabled('saveServiceQuote', state), false)
  assert.equal(controlDisabled('reviewServiceQuote', state), false)
  state.quoteDialog.rows[0].quotePrice = '300'
  state.reviewServiceQuote()
  await flush()
  assert.equal(state.quoteScreen, 'review')
  state.quoteConfirmed = true
  await state.submitServiceQuote()
  await flush()
  assert.equal(calls.drafts.length, 1)
  assert.equal(calls.drafts[0].items[0].quotePrice, 300)
  assert.equal(calls.submissions.length, 1)

  state.quoteDialog.status = 2
  state.quoteDialog.priceChangeStatus = 1
  state.quoteDialog.rows[0].reviewStatus = 2
  state.quoteDialog.rows[0].quotePrice = '300'
  state.quoteScreen = 'setup'
  await flush()
  assert.equal(state.quotePriceLocked, true)
  assert.equal(state.quoteCanRevise, false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), true)
  state.quoteDialog.attaches = [{
    attachValueId: 801, offered: true, quotePrice: '30', reviewStatus: 2, approvedPrice: 30,
  }]
  assert.equal(state.attachHeld(state.quoteDialog.attaches[0]), true)
  assert.equal(controlDisabled('saveServiceQuote', state), true)

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
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[0]).tone, 'review')

  state.quoteDialog.status = 2
  state.quoteDialog.rejectReason = ''
  state.quoteDialog.priceEditable = false
  state.quoteDialog.canApplyPriceChange = false
  state.quoteDialog.rows = [
    { skuId: 601, enabled: true, available: true, quotePrice: '280', reviewStatus: 3, rejectReason: 'Adjust this option' },
    { skuId: 602, enabled: true, available: true, quotePrice: '300', acceptBand: 1, reviewStatus: 2 },
  ]
  state.quoteScreen = 'setup'
  await flush()
  assert.equal(state.quoteDirectEdit, true)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[1]), true)
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[0]).tone, 'blocked')
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[1]).tone, 'direct')
  state.quoteDialog.attaches = [{
    attachValueId: 801, offered: true, quotePrice: '30', reviewStatus: 2, approvedPrice: 30,
  }]
  assert.equal(state.attachHeld(state.quoteDialog.attaches[0]), false)
  state.quoteDialog.attaches[0].quotePrice = '36'
  await state.saveServiceQuote()
  await flush()
  assert.equal(calls.drafts.at(-1).attaches[0].quotePrice, 36)

  state.quoteDialog.status = 1
  state.quoteDialog.rejectReason = ''
  state.quoteDialog.rows[0].reviewStatus = undefined
  state.quoteDialog.rows[0].rejectReason = ''
  state.quoteScreen = 'submitted'
  await flush()
  assert.equal(state.quoteUnderReview, true)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), true)
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[0]).label, 'Under Review')
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[1]).label, 'Under Review')

  state.quoteDialog.status = 0
  state.quoteDialog.rejectReason = ''
  state.quoteScreen = 'setup'
  state.quoteDialog.rows = [
    { skuId: 601, enabled: true, available: true, quotePrice: '100' },
    { skuId: 602, enabled: true, available: true, quotePrice: '199' },
  ]
  await flush()
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[0]), null)
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[1]), null)

  state.quoteDialog.status = 2
  state.quoteDialog.priceEditable = false
  state.quoteDialog.canApplyPriceChange = true
  state.quoteDialog.rows = [
    { skuId: 601, enabled: true, available: true, quotePrice: '100', reviewStatus: 2 },
  ]
  state.quoteDialog.priceChangeStatus = null
  state.quoteScreen = 'review'
  await flush()
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteCanRevise, true)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), false)
  assert.equal(state.quoteLineBadge(state.quoteDialog.rows[0]), null)

  state.quoteDialog.rows = [
    { skuId: 601, enabled: true, available: true, quotePrice: '100', settled: true, reviewStatus: 2 },
    { skuId: 602, enabled: true, available: true, quotePrice: '' },
  ]
  state.quoteDialog.quoteMode = 1
  state.quoteScreen = 'setup'
  await flush()
  assert.equal(state.quoteCanRevise, true)
  assert.equal(state.quotePriceLocked, false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[0]), false)
  assert.equal(state.quoteLineHeld(state.quoteDialog.rows[1]), false)
  assert.equal(state.hourlyRateHeld, false)
  state.quoteDialog.rows[0].quotePrice = '120'
  state.quoteDialog.rows[1].quotePrice = '50'
  await flush()
  assert.equal(controlDisabled('saveServiceQuote', state), false)
  assert.equal(controlDisabled('reviewServiceQuote', state), false)
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

test('supplier portal prompts for newly shelved services and clears the notice after acknowledgement', async (t) => {
  const { state, calls } = await harness(t)
  assert.deepEqual(calls.shelfNotices, [10])
  assert.equal(state.shelfNotice.open, false)
  calls.shelfNoticeResponse = {
    success: true,
    data: {
      unread: true,
      services: [{
        spuId: 88,
        spuName: 'Deep Clean',
        nameI18n: { en: 'Deep Clean', 'zh-CN': '深度清洁' },
        shelvedAt: Date.parse('2026-10-30T00:00:00Z'),
        categories: [{ categoryName: 'Home', nameI18n: { en: 'Home Cleaning', 'zh-CN': '家庭清洁' } }],
      }],
    },
  }
  await state.loadShelfNotices()
  assert.equal(state.shelfNotice.open, true)
  assert.equal(calls.notifications.length, 1)
  assert.equal(calls.notifications[0].position, 'top-right')
  assert.equal(calls.notifications[0].duration, 0)
  assert.equal(calls.notifications[0].title, messages.en.admin.supplierPortal.shelfNoticeTitle)
  assert.equal(state.shelfNotice.services[0].name, 'Deep Clean')
  assert.match(state.shelfNotice.services[0].detail, /Home Cleaning/)
  await state.quoteShelfNotice()
  assert.equal(state.shelfNotice.open, false)
  assert.deepEqual(calls.shelfAcks, [{ supplierId: 10 }])
  assert.deepEqual(calls.routes, [])
  assert.equal(state.servicePicker.open, true)
  assert.deepEqual(clone(state.servicePicker.drafts), [])
  calls.shelfNoticeResponse = {
    unread: true,
    services: [{ spuId: 89, spuName: 'Later Service', categories: [] }],
  }
  await state.loadShelfNotices()
  assert.equal(state.shelfNotice.open, false)
})

test('quote notice from another page opens pricing with the add-service request', async (t) => {
  const { state, calls } = await harness(t, 'overview')
  calls.shelfNoticeResponse = {
    data: {
      unread: true,
      services: [{ spuId: 88, spuName: 'Deep Clean', categories: [] }],
    },
  }
  await state.loadShelfNotices()
  await state.quoteShelfNotice()
  assert.equal(calls.routes.at(-1).path, '/admin/supplier-management/pricing')
  assert.equal(calls.routes.at(-1).query.addService, '1')
  assert.equal(calls.routes.at(-1).query.service, undefined)
})

test('pricing page opens the add-service dialog when arriving from the shelf notice', async (t) => {
  const { state, router } = await harness(t, 'pricing')
  router.currentRoute.value = {
    path: '/admin/supplier-management/pricing',
    query: { addService: '1', service: '9' },
  }
  await flush()
  assert.equal(state.servicePicker.open, true)
  assert.equal(router.currentRoute.value.query.addService, undefined)
  assert.equal(router.currentRoute.value.query.service, '9')
})

test('mobile module navigation stays on H5 and retains the current query', async (t) => {
  const { state, calls, router } = await harness(t, 'profile', true)
  const query = { staff: '41', source: 'overview', tags: ['urgent', 'long-name'] }
  router.currentRoute.value.query = query
  for (const section of ['overview', 'profile', 'pricing', 'orders', 'staff', 'coverage-availability']) {
    await state.goTo(section)
    assert.deepEqual(calls.routes.at(-1), {
      path: `/admin/supplier-management/h5/${section}`, query,
    })
  }
  const desktop = await harness(t, 'profile')
  await desktop.state.goTo('pricing')
  assert.equal(desktop.calls.routes.at(-1).path, '/admin/supplier-management/pricing')
})

test('mobile category selector and contact button use the shared category and phone state', async (t) => {
  const { state, calls } = await harness(t, 'pricing', true)
  state.catalogDraft = [
    { categoryId: 11, categoryName: 'Cleaning', contactName: 'Cleaning manager', contactPhones: ['971501234567', '  '], services: [] },
    { categoryId: 12, categoryName: 'Maintenance', contactName: 'Maintenance manager', contactPhones: ['971509876543'], services: [] },
  ]
  state.savedServices = [
    { spuId: 501, categoryId: 11, category: 'Cleaning', name: 'Apartment Cleaning', phones: ['971501234567'] },
    { spuId: 502, categoryId: 12, category: 'Maintenance', name: 'Air Conditioner Maintenance', phones: ['971509876543'] },
  ]
  await flush()
  const picker = descendants(template, node => hasClass(node, 'mobile-category-picker'))[0]
  assert.equal(evaluate(directive(picker, 'if'), state), true)
  const select = descendants(picker, node => node.tag === 'el-select')[0]
  const model = directive(select, 'model')
  assert.equal(model, 'quoteCategory')
  evaluate(`${model} = next`, state, { next: '12' })
  await flush()
  assert.equal(state.mobilePricingCategory.id, 12)
  assert.equal(state.selectedPricingCategory, 'Maintenance')
  assert.deepEqual(clone(state.filteredServiceRows.map(row => row.spuId)), [502])

  const contactButton = descendants(picker, node => hasClass(node, 'mobile-category-contact'))[0]
  assert.ok(evaluate(directive(contactButton, 'if'), state))
  evaluate(directive(contactButton, 'on', 'click'), state)
  assert.deepEqual(clone(state.categoryContactDialog), {
    open: true, categoryId: 12, label: 'Maintenance',
    contactName: 'Maintenance manager', phones: ['971509876543'],
  })
  state.categoryContactDialog.contactName = 'Updated maintenance manager'
  state.categoryContactDialog.phones[0] = '971501112233'
  assert.equal(state.catalogDraft[1].contactPhones[0], '971509876543')
  await state.saveCategoryPhones()
  assert.deepEqual(calls.categoryContacts, [{
    supplierId: 10,
    categories: [{ categoryId: 12, contactName: 'Updated maintenance manager', contactPhones: ['971501112233'] }],
  }])
})

test('mobile native order dates preserve other API filters and clear either range endpoint', async (t) => {
  const { state, calls, router } = await harness(t, 'orders', true)
  router.currentRoute.value.query = { staff: '41' }
  await flush()
  state.orderKeyword = 'ORDER-001'
  state.orderServiceKeyword = 'Cleaning'
  state.orderCategory = 11
  state.orderStage = 'upcoming'
  state.orderPage = 3
  const dates = descendants(template, node => hasClass(node, 'mobile-order-dates'))[0]
  assert.equal(evaluate(directive(dates, 'if'), state), true)
  const inputs = descendants(dates, node => node.tag === 'input')
  assert.equal(inputs.length, 2)
  const changeDate = async (index, value) => {
    evaluate(directive(inputs[index], 'on', 'change'), state, { $event: { target: { value } } })
    await flush()
  }
  const common = { orderNo: 'ORDER-001', serviceName: 'Cleaning', categoryId: 11, supplierStage: 'UPCOMING', pageNum: 1, pageSize: 100 }
  await changeDate(0, '2026-11-05')
  assert.deepEqual(calls.orders.at(-1), { ...common, serviceTimeStart: '2026-11-05' })
  assert.equal(state.orderPage, 1)
  assert.equal(evaluate(directive(inputs[1], 'bind', 'min'), state), '2026-11-05')
  await changeDate(1, '2026-11-12')
  assert.deepEqual(calls.orders.at(-1), { ...common, serviceTimeStart: '2026-11-05', serviceTimeEnd: '2026-11-12' })
  assert.equal(evaluate(directive(inputs[0], 'bind', 'max'), state), '2026-11-12')
  await changeDate(0, '')
  assert.deepEqual(calls.orders.at(-1), { ...common, serviceTimeEnd: '2026-11-12' })
  await changeDate(1, '')
  assert.deepEqual(clone(state.orderDateRange), [])
  assert.deepEqual(calls.orders.at(-1), common)
  assert.equal(evaluate(directive(inputs[0], 'bind', 'max'), state), undefined)
  assert.equal(evaluate(directive(inputs[1], 'bind', 'min'), state), undefined)
})

test('mobile license date input and real profile submission require a date after today', async (t) => {
  const { state, calls } = await harness(t, 'profile', true)
  Object.assign(state.companyForm, {
    companyName: 'Test Supplier', licenseNo: 'TEST-001', licenseIssuedBy: 'Dubai DET',
    address: 'Dubai', contact: 'Test Contact', email: 'contact@example.com',
    mobile: '501234567', whatsapp: '501234567',
  })
  Object.assign(state.bankForm, { accountName: 'Test Supplier LLC', bankName: 'Test Bank', iban: 'AE070331234567890123456' })
  state.otherCommunityOnboarded = 0
  state.tradeLicenseFiles = ['https://example.com/trade-license.pdf']
  state.otherDocumentFiles = ['https://example.com/bank-certificate.pdf']
  const input = descendants(template, node => hasClass(node, 'mobile-profile-date') && directive(node, 'model') === 'companyForm.licenseExpiry')[0]
  assert.equal(evaluate(directive(input, 'if'), state), true)
  assert.equal(directive(input, 'model'), 'companyForm.licenseExpiry')
  const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const today = state.startOfToday()
  const tomorrow = new Date(today.getTime())
  tomorrow.setDate(tomorrow.getDate() + 1)
  assert.equal(evaluate(directive(input, 'bind', 'min'), state), isoDate(tomorrow))
  evaluate(`${directive(input, 'model')} = next`, state, { next: isoDate(today) })
  await state.submitProfileForm()
  assert.equal(calls.profileSaves.length, 0)
  assert.equal(calls.messages.at(-1)?.message, messages.en.admin.supplierProfile.licenseExpiryHint)
  assert.equal(state.disableLicenseDate(today), true)
  assert.equal(state.disableLicenseDate(tomorrow), false)
  evaluate(`${directive(input, 'model')} = next`, state, { next: isoDate(tomorrow) })
  assert.equal(state.profileIssues.length, 0)
  await state.submitProfileForm()
  assert.equal(calls.profileSaves.length, 1)
  assert.equal(calls.profileSaves[0].licenseExpiry, isoDate(tomorrow))
  assert.equal(calls.profileSaves[0].supplierType, 1)
})

test('individual profile saves identity fields and does not require a trade license', async (t) => {
  const { state, calls } = await harness(t, 'profile', true)
  const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const today = state.startOfToday()
  const tomorrow = new Date(today.getTime())
  tomorrow.setDate(tomorrow.getDate() + 1)
  Object.assign(state.companyForm, {
    supplierType: 2,
    fullName: 'Test Person',
    dateOfBirth: isoDate(tomorrow),
    nationality: 'Test',
    residentialCity: 'Dubai',
    email: 'person@example.com',
    mobile: '501234567',
    whatsapp: '501234567',
  })
  Object.assign(state.bankForm, { accountName: 'Test Person', bankName: 'Test Bank', iban: 'AE070331234567890123456' })
  state.otherDocumentFiles = ['https://example.com/bank-certificate.pdf']
  const input = descendants(template, node => hasClass(node, 'mobile-profile-date') && directive(node, 'model') === 'companyForm.dateOfBirth')[0]
  assert.equal(directive(input, 'model'), 'companyForm.dateOfBirth')
  assert.equal(evaluate(directive(input, 'bind', 'max'), state), isoDate(today))
  assert.equal(state.disableBirthDate(tomorrow), true)
  assert.equal(state.disableBirthDate(today), false)
  await state.submitProfileForm()
  assert.equal(calls.profileSaves.length, 0)
  assert.equal(calls.messages.at(-1)?.message, messages.en.admin.supplierProfile.birthHint)
  state.companyForm.dateOfBirth = isoDate(today)
  assert.equal(state.profileIssues.some(issue => issue.id === 'licenseNo' || issue.id === 'tradeLicense'), false)
  await state.submitProfileForm()
  assert.equal(calls.profileSaves.length, 1)
  assert.equal(calls.profileSaves[0].supplierType, 2)
  assert.equal(calls.profileSaves[0].fullName, 'Test Person')
  assert.equal(calls.profileSaves[0].dateOfBirth, isoDate(today))
  assert.equal(calls.profileSaves[0].nationality, 'Test')
  assert.equal(calls.profileSaves[0].residentialCity, 'Dubai')
  assert.equal(calls.profileSaves[0].tradeLicenseNo, undefined)
  assert.equal(calls.profileSaves[0].officeAddress, undefined)
  assert.equal(calls.profileSaves[0].contactPerson, undefined)
  assert.equal(calls.profileSaves[0].emaarOnboarded, undefined)
  assert.equal(calls.profileSaves[0].totalAvailableWorkers, null)
  assert.equal(calls.profileSaves[0].femaleStaffCount, null)
  assert.equal(calls.profileSaves[0].maleStaffCount, null)
  assert.equal(calls.profileSaves[0].employeeInsurance, null)
})

test('owner mobile order cards retain package title, visit progress, and employee assignment', async (t) => {
  const { state, calls, locale } = await harness(t, 'orders', true)
  const row = {
    orderId: 71, fulfillmentId: 702, orderNo: 'PACKAGE-71', orderType: 2,
    packageName: 'Annual Maintenance Package', packageNameI18n: { en: 'Annual Maintenance Package', 'zh-CN': '全年家庭维护套餐' },
    seqNo: 2, totalTimes: 6, serviceStatus: 4, assignedStaff: [{ adminUserId: 41, name: 'Maya' }],
  }
  const card = descendants(template, node => hasClass(node, 'portal-orders-mobile-card'))[0]
  for (const [helper, expected] of [
    ['packageOrderTitle(row)', 'Annual Maintenance Package'],
    ['packageVisitText(row)', messages.en.admin.supplierOrders.packageVisit.replace('{seq}', '2').replace('{total}', '6')],
  ]) {
    const text = descendants(card, node => node.type === 5 && node.content.content === helper)[0]
    assert.ok(text, `The mobile order card must render ${helper}`)
    const paragraph = descendants(card, node => node.tag === 'p' && directive(node, 'if') === helper)[0]
    assert.ok(paragraph, `The package line must be visible when ${helper} is present`)
    assert.equal(evaluate(text.content.content, state, { row }), expected)
  }
  locale.value = 'zh'
  assert.equal(state.packageOrderTitle(row), '全年家庭维护套餐')
  assert.match(state.packageVisitText(row), /2.*6/)
  const assign = descendants(card, node => node.tag === 'el-button' && directive(node, 'on', 'click') === 'openAssignStaff(row)')[0]
  assert.ok(assign, 'Owner mobile orders must retain the employee assignment action')
  assert.equal(evaluate(directive(assign, 'if'), state, { row }), true)
  assert.equal(state.canOperateVisit(row), false)
  await evaluate(directive(assign, 'on', 'click'), state, { row })
  assert.equal(state.assignStaffDialog.open, true)
  assert.equal(state.assignStaffDialog.orderId, 71)
  assert.equal(state.assignStaffDialog.fulfillmentId, 702)
  assert.deepEqual(clone(state.assignStaffDialog.staffUserIds), [41])
  assert.deepEqual(clone(state.assignStaffDialog.options), [{ adminUserId: 41, label: 'Maya · 971501234567' }])
  assert.deepEqual(calls.staffPages, [{ pageNum: 1, pageSize: 500 }])
  assert.equal(evaluate(directive(assign, 'if'), state, { row: { ...row, serviceStatus: 2 } }), false)
  assert.equal(evaluate(directive(assign, 'if'), state, { row: { ...row, orderStatus: 3 } }), false)
})

test('an individual supplier runs the visit without staff management or assignment', async (t) => {
  const { state, calls } = await harness(t, 'orders', true)
  const row = {
    orderId: 71, fulfillmentId: 702, orderNo: 'ORD-71', serviceStatus: 4,
  }
  state.companyForm.supplierType = 2
  await flush()
  const card = descendants(template, node => hasClass(node, 'portal-orders-mobile-card'))[0]
  const assign = descendants(card, node => node.tag === 'el-button' && directive(node, 'on', 'click') === 'openAssignStaff(row)')[0]
  const depart = descendants(card, node => node.tag === 'el-button' && directive(node, 'on', 'click') === 'departForService(row)')[0]
  const arrive = descendants(card, node => node.tag === 'el-button' && directive(node, 'on', 'click') === "openServiceAction(row, 'arrive')")[0]
  const complete = descendants(card, node => node.tag === 'el-button' && directive(node, 'on', 'click') === "openServiceAction(row, 'complete')")[0]
  const staffColumn = descendants(template, node => node.tag === 'el-table-column' && directive(node, 'bind', 'label') === "t('admin.supplierOrders.assignedStaff')")[0]
  assert.equal(directive(staffColumn, 'if'), '!individualSupplier')
  assert.equal(evaluate(directive(assign, 'if'), state, { row }), false)
  assert.equal(state.canAssignStaff(row), false)
  assert.equal(state.canOperateVisit(row), true)
  assert.equal(evaluate(directive(depart, 'else-if'), state, { row }), true)
  assert.equal(evaluate(directive(arrive, 'else-if'), state, { row: { ...row, serviceStatus: 3 } }), true)
  assert.equal(evaluate(directive(complete, 'else-if'), state, { row: { ...row, serviceStatus: 1 } }), true)
  assert.equal(state.canOperateVisit({ ...row, orderStatus: 3 }), false)
  assert.equal(calls.staffPages.length, 0)
  const staffPage = await harness(t, 'staff')
  staffPage.state.companyForm.supplierType = 2
  await flush()
  assert.equal(staffPage.calls.routes.at(-1)?.path, '/admin/supplier-management/overview')
  assert.match(descriptor.template.content, /section === 'staff' && !individualSupplier/)
})

test('removing a service confirms first and deletes that service with its quotes', async (t) => {
  const { state, calls } = await harness(t, 'pricing')
  const row = {
    spuId: 193, categoryId: 25471, category: 'Deep Cleaning', name: 'Deep Cleaning',
    spuNameI18n: { en: 'Deep Cleaning' }, workerCount: null, phones: [], acceptOrder: 1,
  }
  state.savedServices = [row]
  state.selectedQuoteSpuIds = [193]
  state.quoteDialog.visible = true
  state.quoteDialog.spuId = 193
  await state.removeSavedService(row)
  assert.deepEqual(calls.serviceRemovals, [])
  calls.confirm = async (message, title, options) => {
    calls.confirmations = [{ message, title, confirm: options.confirmButtonText }]
  }
  state.quoteDialog.visible = true
  await state.removeSavedService(row)
  assert.deepEqual(calls.serviceRemovals, [{ supplierId: 10, spuId: 193 }])
  assert.equal(calls.confirmations[0].title, messages.en.admin.supplierPricing.removeTitle)
  assert.match(calls.confirmations[0].message, /Deep Cleaning/)
  assert.match(calls.confirmations[0].message, /quotes/)
  assert.equal(calls.messages.at(-1)?.message, messages.en.admin.supplierPricing.removed)
  assert.equal(state.quoteDialog.visible, false)
  assert.deepEqual(clone(state.selectedQuoteSpuIds), [])
  assert.match(descriptor.template.content, /v-if="!packageMode"[\s\S]*removeSavedService\(row\)/)
})

test('removing a package quote confirms first and drops that package from the selection', async (t) => {
  const { state, calls } = await harness(t, 'package-pricing')
  state.packageCatalog = [{
    categoryId: 11,
    packages: [
      { packageId: 101, available: true, selected: true },
      { packageId: 202, available: true, selected: true },
    ],
  }]
  state.packageFlat = [packageEntry(101, 501), packageEntry(202, 501)]
  state.quoteDialog.visible = true
  state.quoteDialog.packageId = 101
  const row = { packageId: 101, packageName: 'Annual Package', packageNameI18n: { en: 'Annual Package' } }
  await state.removeSavedPackage(row)
  assert.deepEqual(calls.packageSaves, [])
  calls.confirm = async (message, title, options) => {
    calls.confirmations = [{ message, title, confirm: options.confirmButtonText }]
  }
  state.quoteDialog.visible = true
  state.quoteDialog.packageId = 101
  await state.removeSavedPackage(row)
  assert.deepEqual(calls.packageSaves, [{
    supplierId: 10,
    packages: [{ categoryId: 11, items: [{ packageId: 202 }] }],
  }])
  assert.equal(calls.confirmations[0].title, messages.en.admin.supplierPortal.removePackageTitle)
  assert.match(calls.confirmations[0].message, /Annual Package/)
  assert.match(calls.confirmations[0].message, /stay in place/)
  assert.equal(calls.messages.at(-1)?.message, messages.en.admin.supplierPortal.packageRemoved)
  assert.equal(state.quoteDialog.visible, false)
  assert.match(descriptor.template.content, /v-else[\s\S]*removeSavedPackage\(row\)/)
})


const packageEntry = (packageId, spuId, overrides = {}) => ({
  packageId,
  packageName: `Package ${packageId}`,
  packageNameI18n: { en: `Package ${packageId}`, 'zh-CN': `套餐${packageId}` },
  categoryId: 11, categoryName: 'Painting', categoryNameI18n: { en: 'Painting', 'zh-CN': '粉刷' },
  service: { spuId, spuName: `Service ${spuId}`, nameI18n: { en: `Service ${spuId}`, 'zh-CN': `服务${spuId}` }, status: 1, skus: [] },
  ...overrides,
})

test('package quotes group interleaved services by package id and preserve package-specific quote links', async (t) => {
  const { state, router } = await harness(t, 'package-pricing')
  state.packageFlat = [packageEntry(101, 501), packageEntry(202, 501), packageEntry(101, 502), packageEntry(202, 503)]
  await flush()
  assert.deepEqual(clone(state.serviceRowGroups.map(group => ({ key: group.key, rows: group.rows.map(row => [row.packageId, row.spuId]) }))), [
    { key: 'package-101', rows: [[101, 501], [101, 502]] },
    { key: 'package-202', rows: [[202, 501], [202, 503]] },
  ])
  const renderedGroup = descendants(template, node => hasClass(node, 'portal-service-group'))[0]
  assert.equal(directive(renderedGroup, 'for'), 'group in serviceRowGroups')
  const renderedRow = descendants(renderedGroup, node => hasClass(node, 'portal-service-row'))[0]
  assert.equal(directive(renderedRow, 'for'), 'row in group.rows')
  const quoteButton = descendants(renderedRow, node => node.tag === 'el-button' && directive(node, 'on', 'click') === 'openServiceQuote(row)')[0]
  const row = state.serviceRowGroups[1].rows[0]
  await evaluate(directive(quoteButton, 'on', 'click'), state, { row })
  assert.equal(state.quoteDialog.packageId, 202)
  assert.equal(state.quoteDialog.spuId, 501)
  assert.match(state.quoteDialog.category, /Package 202/)
  assert.equal(router.currentRoute.value.query.package, '202')
  assert.equal(router.currentRoute.value.query.service, '501')
})

test('different packages with the same displayed name never merge', async (t) => {
  const { state } = await harness(t, 'package-pricing', true)
  const sameName = { packageName: 'Family package', packageNameI18n: { en: 'Family package', 'zh-CN': '家庭套餐' } }
  state.packageFlat = [packageEntry(8, 501, sameName), packageEntry(9, 501, sameName)]
  await flush()
  assert.deepEqual(clone(state.serviceRowGroups.map(group => [group.key, group.name, group.rows.length])), [
    ['package-8', 'Family package', 1], ['package-9', 'Family package', 1],
  ])
  assert.equal(state.filteredServiceRows.length, 2)
})

test('package groups honor status, category and bilingual package-name search filters', async (t) => {
  const { state, locale } = await harness(t, 'package-pricing')
  state.packageFlat = [
    packageEntry(101, 501, { packageName: 'Apartment plan', packageNameI18n: { en: 'Apartment plan', 'zh-CN': '公寓套餐' } }),
    packageEntry(101, 502, { packageName: 'Apartment plan', packageNameI18n: { en: 'Apartment plan', 'zh-CN': '公寓套餐' }, service: { spuId: 502, spuName: 'Cleaning', status: 2, skus: [] } }),
    packageEntry(202, 503, { packageName: 'Villa plan', packageNameI18n: { en: 'Villa plan', 'zh-CN': '别墅套餐' } }),
    packageEntry(303, 504, { categoryId: 12, categoryName: 'Other' }),
  ]
  await flush()
  state.quoteCategory = '11'
  state.addedKeyword = '公寓'
  assert.equal(state.serviceRowGroups.length, 1)
  assert.equal(state.serviceRowGroups[0].rows.length, 2)
  state.quoteStatusFilter = '2'
  assert.deepEqual(clone(state.serviceRowGroups[0].rows.map(row => row.spuId)), [502])
  state.addedKeyword = 'Villa'
  assert.deepEqual(clone(state.serviceRowGroups), [])
  state.quoteStatusFilter = 'all'
  locale.value = 'zh'
  assert.equal(state.serviceRowGroups[0].name, '别墅套餐')
  state.addedKeyword = ''
  assert.equal(state.filteredServiceRows.length, 3)
  assert.equal(state.serviceRowGroups.length, 2)
})

test('regular service pricing remains a single unheaded group and package titles localize', async (t) => {
  const pricing = await harness(t, 'pricing')
  pricing.state.savedServices = [
    { spuId: 501, categoryId: 11, category: 'Painting', name: 'Painting', phones: [], acceptOrder: 1 },
    { spuId: 502, categoryId: 11, category: 'Painting', name: 'Cleaning', phones: [], acceptOrder: 1 },
  ]
  await flush()
  assert.equal(pricing.state.serviceRowGroups.length, 1)
  assert.equal(pricing.state.serviceRowGroups[0].key, 'services')
  assert.equal(pricing.state.serviceRowGroups[0].name, '')
  assert.deepEqual(clone(pricing.state.serviceRowGroups[0].rows.map(row => row.spuId)), [501, 502])
  const heading = descendants(template, node => hasClass(node, 'portal-package-group__header'))[0]
  assert.equal(evaluate(directive(heading, 'if'), pricing.state), false)
  const packages = await harness(t, 'package-pricing')
  packages.state.packageFlat = [packageEntry(101, 501)]
  await flush()
  assert.equal(evaluate(directive(heading, 'if'), packages.state), true)
  assert.equal(packages.state.serviceRowGroups[0].name, 'Package 101')
  packages.locale.value = 'zh'
  assert.equal(packages.state.serviceRowGroups[0].name, '套餐101')
})

test('supplier quote heading uses the configured add-on title', async (t) => {
  const { state, locale } = await harness(t)
  state.liveQuotes = [{
    spuId: 56,
    attachModuleTitle: '  Curtain extras  ',
    skus: [],
    status: 0,
    priceEditable: true,
  }]
  await state.openServiceQuote({ spuId: 56, name: 'Curtain Cleaning', category: 'Sofa' })
  assert.equal(state.quoteDialog.attachModuleTitle, 'Curtain extras')
  assert.equal(state.quoteAddonTitle, 'Curtain extras')
  state.quoteDialog.attachModuleTitle = '   '
  assert.equal(state.quoteAddonTitle, 'Add-ons')
  locale.value = 'zh'
  assert.equal(state.quoteAddonTitle, '附加项')
  assert.match(descriptor.template.content, /<h2>\{\{ quoteAddonTitle \}\}<\/h2>/)
})

test('actual supplier portal template compiles with the tested setup bindings', () => {
  assert.deepEqual(compileTemplate({
    source: descriptor.template.content, filename,
    id: 'supplier-portal-workflow-test', compilerOptions: { bindingMetadata: script.bindings },
  }).errors, [])
  assert.doesNotMatch(descriptor.template.content, /picker-row__fields/)
  assert.doesNotMatch(descriptor.template.content, /contactOptional/)
})

test('supplier quote list shows direct, deferred, and blocked outcomes', () => {
  assert.match(descriptor.template.content, /acceptBandItems\(row\)/)
  assert.match(descriptor.template.content, /admin\.supplierPricing\.acceptLegend/)
  assert.match(descriptor.template.content, /quoteDialogAcceptItems/)
  assert.match(descriptor.template.content, /quoteOutcomeName\(row\)/)
  assert.doesNotMatch(
    descriptor.template.content,
    /item\.enabled && item\.available !== false/,
  )
  assert.equal(typeof messages.zh.admin.supplierPricing.acceptOpen, "string")
  assert.equal(typeof messages.en.admin.supplierPricing.acceptOpen, "string")
  for (const language of ['zh', 'en']) {
    const copy = messages[language].admin.supplierPricing
    assert.equal(typeof copy.acceptDirect, 'string')
    assert.equal(typeof copy.acceptDeferred, 'string')
    assert.equal(typeof copy.acceptBlocked, 'string')
    assert.equal(typeof copy.acceptLegend, 'string')
    assert.equal(typeof copy.acceptOutcome, 'string')
  }
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
