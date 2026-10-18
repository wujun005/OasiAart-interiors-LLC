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
  const calls = { drafts: [], submissions: [], profileSaves: [], profileResubmits: [], schedules: [], coverage: [], messages: [], routes: [], scrolledFields: [], focusedFields: [] }
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
    supplierOperationsMine: async () => ({}),
    supplierScheduleSave: async (payload) => { calls.schedules.push(clone(payload)); return { schedule: payload } },
    supplierCoverageSave: async (payload) => { calls.coverage.push(clone(payload)); return { coverage: payload } },
    saveQuoteDraft: async (payload) => { calls.drafts.push(clone(payload)); return { data: { status: 0 } } },
    submitQuote: async (payload) => {
      calls.submissions.push(clone(payload))
      return { data: { status: 1, submittedAt: '2026-10-16T01:00:00Z', skus: calls.drafts.at(-1)?.items || [] } }
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
    document: {
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
      if (name === '@/utils/phone-dial') return phones
      if (name === '@/modules/client/api/supplier-onboarding') return {
        listServiceCategories: async () => [],
        categoryIdPayload: (ids) => ids.map(Number),
        isOtherService: (option) => option.other === true || String(option.categoryId) === '0',
        serviceCategoryLabel: (option) => option.categoryName || option.categoryId,
      }
      if (name === '@/modules/admin/pages/supplier-management/availability.vue') return { default: {} }
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
    status: 0, quoteMode: 1, unitPrice: null, priceEditable: true,
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

test('hourly quotes preserve structured workload while submitting the shared rate', async (t) => {
  const context = await harness(t)
  await readyQuote(context, { quoteMode: 2, unitPrice: 80 })
  const { state } = context
  assert.equal(state.firstPositive(0, 2), 2)
  assert.equal(state.firstPositive('', null, 1.5), 1.5)
  assert.equal(state.firstPositive(0, null, ''), null)
  const row = state.quoteDialog.rows[0]
  assert.deepEqual(clone(state.quoteItems()[0]), {
    skuId: 601, staffCount: 2, serviceHours: 3, quotePrice: 80, enabled: 1,
  })
  state.quoteDialog.unitPrice = 79.99
  row.staffCount = 3
  row.serviceHours = 1.5
  await flush()
  assert.deepEqual(clone(state.quotePayload().items[0]), {
    skuId: 601, staffCount: 3, serviceHours: 1.5, quotePrice: 79.99, enabled: 1,
  })
  assert.equal(row.quotePrice, '329')
  state.quoteDialog.unitPrice = null
  await flush()
  assert.equal(state.quoteMissingCount, 1)
  state.reviewServiceQuote()
  assert.equal(state.quoteScreen, 'setup')
  state.quoteDialog.unitPrice = 80
  row.staffCount = null
  row.serviceHours = null
  await flush()
  assert.equal(clone(state.quoteItems()[0]).staffCount, 0)
  assert.equal(clone(state.quoteItems()[0]).serviceHours, 0)
  assert.equal(state.quoteMissingCount, 0)
  assert.equal(state.submitProblem(), '')
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
  assert.deepEqual(clone(state.profileIssues.map(issue => issue.id)), ['accountName', 'bankName', 'iban', 'tradeLicense'])
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
  assert.deepEqual(clone(state.profileIssues.map(issue => issue.id)), ['tradeLicense'])
  await state.submitProfileForm()
  await flush()
  assert.equal(calls.messages.at(-1).message, state.profileIssues[0].message)
  assert.equal(calls.scrolledFields.at(-1), 'profile-field-tradeLicense')
  assert.equal(calls.profileSaves.length, 0)
  state.tradeLicenseFiles = ['https://example.com/trade-license.pdf']
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

test('review-period coverage and schedule save independently without changing the onboarding snapshot', async (t) => {
  const { state, calls } = await harness(t)
  state.onboardingStatus = 1
  state.profileEditable = false
  state.independentOperationsReady = true
  state.companyForm.companyName = 'Test Supplier'
  await state.saveAvailabilityHours({ start: '09:00', end: '21:00', concurrent: 3, saturday: true, sunday: false })
  assert.equal(calls.schedules.length, 1)
  assert.deepEqual(calls.schedules[0], { supplierId: 10, workingDays: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '21:00', maxConcurrentJobs: 3, timezone: 'Asia/Dubai' })
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

  await state.saveAvailabilityHours({ start: '09:00', end: '21:00', concurrent: 3, saturday: true, sunday: false })
  state.platformAreas = [{ id: 9, name: 'Test Zone' }]
  state.communitiesByArea = { 9: [{ id: 901, name: 'Test Community' }] }
  state.draftCommunityIds = [901]
  state.draftBareAreaIds = []
  await state.saveAreas()

  assert.equal(calls.schedules.length, 0)
  assert.equal(calls.coverage.length, 0)
  assert.equal(calls.profileSaves.length, 0)
  assert.deepEqual(calls.messages.map(message => message.type), ['warning', 'warning'])
  assert.ok(calls.messages.every(message => /upgrad/i.test(message.message)))
})

test('actual supplier portal template compiles with the tested setup bindings', () => {
  assert.deepEqual(compileTemplate({
    source: descriptor.template.content, filename,
    id: 'supplier-portal-workflow-test', compilerOptions: { bindingMetadata: script.bindings },
  }).errors, [])
})
