import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
import ts from 'typescript'
import * as Vue from 'vue'

// Exercise the platform SFC's real loading, review and export flows with local API boundaries.
const root = new URL('../', import.meta.url)
const filename = 'src/modules/admin/pages/supplier/index.vue'
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const { descriptor, errors } = parse(read(filename), { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: 'platform-supplier-hourly-review-test' })
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const code = transpile(script.content)
const loadModule = (path) => {
  const exports = {}
  runInNewContext(transpile(read(path)), { exports })
  return exports
}
const modules = Object.fromEntries(['supplierReviewState', 'supplierPortal', 'supplierQueue', 'i18n'].map(name => [
  `@/modules/admin/utils/${name}`, loadModule(`src/modules/admin/utils/${name}.ts`),
]))
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
const service = { spuId: 501, spuName: 'Cleaning', categoryName: 'Home', status: 1 }
const hourly = {
  spuId: 501, quoteMode: 2, reviewByUnitPrice: true, status: 1, versionNo: 3,
  unitPrice: 999, unitPriceWithMaterial: 80, unitPriceWithoutMaterial: '65.50', skus: [], attaches: [],
}

async function harness(t, quote = hourly, query = { id: '10' }) {
  const calls = { reviews: [], skus: [], messages: [], downloads: [], blobs: [], quoteExports: [], confirms: [], onboarding: [], priceChanges: [] }
  const controls = { quote, confirm: async () => {} }
  const locale = Vue.ref('en')
  const translate = (key, params = {}) => {
    const value = key.split('.').reduce((node, part) => node?.[part], messages[locale.value])
    assert.equal(typeof value, 'string', `Missing translation: ${key}`)
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
  }
  const route = Vue.reactive({ path: '/admin/supplier', query })
  const emptyPage = async () => ({ data: { list: [], total: 0 } })
  const api = {
    platformSupplierQuotePage: emptyPage,
    onboardingPage: emptyPage,
    onboardingDetail: async () => ({ data: { id: 10, supplierNo: 'VED10', companyName: 'Test Supplier', status: 2 } }),
    platformSupplierQuoteServices: async () => ({ data: [service] }),
    serviceCatalog: async () => ({ data: [] }),
    platformSupplierQuoteSkus: async (supplierId, spuId) => {
      calls.skus.push({ supplierId, spuId })
      return { data: controls.quote }
    },
    platformSupplierQuoteReview: async (payload) => { calls.reviews.push(clone(payload)); return { data: controls.quote } },
    onboardingChangeStatus: async (payload) => { calls.onboarding.push(clone(payload)); return { data: {} } },
    reviewQuotePriceChange: async (payload) => { calls.priceChanges.push(clone(payload)); return { data: {} } },
    exportPlatformQuoteSheet: async (supplierId, spuIds) => {
      calls.quoteExports.push({ supplierId, spuIds: [...(spuIds || [])] })
      return new Blob(['quote'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    },
  }
  const exports = {}
  runInNewContext(code, {
    exports,
    Blob,
    URL: {
      createObjectURL: (blob) => { calls.blobs.push(blob); return 'blob:test' },
      revokeObjectURL() {},
    },
    document: {
      createElement: () => {
        const link = { href: '', download: '', click: () => calls.downloads.push(link.download) }
        return link
      },
    },
    require: (name) => {
      if (name === 'vue') return Vue
      if (name === 'vue-i18n') return { useI18n: () => ({ t: translate, locale }) }
      if (name === 'vue-router') return { useRoute: () => route, useRouter: () => ({ push: async (to) => Object.assign(route, to) }) }
      if (name === 'element-plus') return {
        ElMessage: Object.fromEntries(['warning', 'success', 'error', 'info'].map(type => [
          type, (message) => calls.messages.push({ type, message }),
        ])),
        ElMessageBox: {
          alert: async () => {},
          confirm: async (...args) => {
            calls.confirms.push(args.map((item) => typeof item === 'string' ? item : { ...item }))
            return controls.confirm(...args)
          },
          prompt: async () => {},
        },
      }
      if (name === '@/modules/admin/api/supplierWorkbench') return api
      if (name === '@/modules/admin/components/SupplierQuoteImportHistory.vue') return {}
      if (name === '@/modules/admin/api/spu') return {
        listBySpu: async () => ({ data: { specTypes: [], skus: [], attaches: [] } }),
        listSpuAttachCatalog: async () => [],
      }
      if (name === '@/modules/client/api/supplier-onboarding') return {
        listServiceCategories: async () => [], serviceCategoryLabel: () => '',
      }
      if (modules[name]) return modules[name]
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null })
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  assert.deepEqual(calls.messages, [])
  return { state: instance.$.setupState, calls, controls, locale, translate }
}

const findByClass = (node, name) => {
  if (node.props?.some(prop => prop.type === 6 && prop.name === 'class' && prop.value?.content.split(' ').includes(name))) return node
  for (const child of node.children || []) {
    const result = findByClass(child, name)
    if (result) return result
  }
}
const templateAst = baseParse(descriptor.template.content)
const renderFragment = (className, state) => {
  const fragment = findByClass(templateAst, className)
  assert.ok(fragment, `Missing real template section: ${className}`)
  const compiled = compileTemplate({ source: fragment.loc.source, filename, id: className })
  assert.deepEqual(compiled.errors, [])
  const exports = {}
  runInNewContext(transpile(compiled.code), { exports, require: (name) => {
    assert.equal(name, 'vue')
    return Vue
  } })
  const textOf = (node) => typeof node === 'string' ? node
    : Array.isArray(node) ? node.map(textOf).join(' ')
      : node?.children ? textOf(node.children) : ''
  return textOf(exports.render(state, []))
}

test('platform hourly summary and review card show the two source rates in English and Chinese', async (t) => {
  const { state, locale, translate } = await harness(t)
  await state.openSkus(service)
  assert.equal(state.skuUnitPriceWithMaterial, 80)
  assert.equal(state.skuUnitPriceWithoutMaterial, '65.50')
  for (const language of ['en', 'zh']) {
    locale.value = language
    for (const className of ['quote-head__hourly-rates', 'hourly-review__content']) {
      const text = renderFragment(className, state)
      assert.ok(text.includes(translate('admin.platformSuppliers.hourlyRateWithMaterial')))
      assert.ok(text.includes(translate('admin.platformSuppliers.hourlyRateWithoutMaterial')))
      assert.match(text, /AED 80\.00/)
      assert.match(text, /AED 65\.50/)
      assert.doesNotMatch(text, /999/)
    }
  }
})

test('reopening a legacy hourly quote clears both rates and shows missing values without copying unitPrice', async (t) => {
  const { state, controls } = await harness(t)
  await state.openSkus(service)
  controls.quote = { ...hourly, unitPriceWithMaterial: undefined, unitPriceWithoutMaterial: null }
  await state.openSkus({ ...service, spuId: 502 })
  assert.equal(state.skuUnitPriceWithMaterial, null)
  assert.equal(state.skuUnitPriceWithoutMaterial, null)
  assert.equal(state.hourlyRateText(state.skuUnitPriceWithMaterial, true), '-')
  assert.equal(state.hourlyRateText(state.skuUnitPriceWithoutMaterial, true), '-')
  const text = renderFragment('hourly-review__content', state)
  assert.doesNotMatch(text, /999|80\.00|65\.50/)
})

test('current price-list export includes both material rates and preserves a missing rate as a dash', async (t) => {
  const { state, calls, controls, translate } = await harness(t)
  await state.exportPriceList()
  assert.equal(calls.downloads.length, 1)
  const csv = await calls.blobs[0].text()
  assert.ok(csv.includes(translate('admin.platformSuppliers.hourlyRateWithMaterial')))
  assert.ok(csv.includes(translate('admin.platformSuppliers.hourlyRateWithoutMaterial')))
  assert.match(csv, /"80\.00"/)
  assert.match(csv, /"65\.50"/)
  assert.doesNotMatch(csv, /999/)
  controls.quote = { ...hourly, unitPriceWithMaterial: null, unitPriceWithoutMaterial: undefined }
  const rows = clone(await state.loadServicePriceRows(service))
  assert.equal(rows.length, 2)
  assert.deepEqual(rows.map(row => row[8]), ['-', '-'])
})

test('fixed-price export retains the SKU quote and active price rows', async (t) => {
  const { state, translate } = await harness(t, {
    quoteMode: 1, reviewByUnitPrice: false, status: 1, unitPriceWithMaterial: 80, unitPriceWithoutMaterial: 65,
    skus: [{ skuId: 601, skuCode: 'FIXED', quoted: true, enabled: 1, quotePrice: 150, approvedPrice: 140, platformPriceWithTax: 200 }],
  })
  const rows = clone(await state.loadServicePriceRows(service))
  assert.equal(rows.length, 1)
  assert.equal(rows[0][4], translate('admin.platformSuppliers.exportSpecItem'))
  assert.equal(rows[0][5], 'FIXED')
  assert.equal(rows[0][8], '150.00')
  assert.equal(rows[0][10], '140.00')
})

test('approving or rejecting hourly rates still sends one whole-quote decision without prices or SKU lines', async (t) => {
  const { state, calls } = await harness(t)
  await state.openSkus(service)
  await state.reviewHourlyQuote(2)
  await state.reviewHourlyQuote(3, 'Please revise both rates')
  assert.deepEqual(calls.reviews, [
    { supplierId: 10, spuId: 501, versionNo: 3, status: 2 },
    { supplierId: 10, spuId: 501, versionNo: 3, status: 3, rejectReason: 'Please revise both rates' },
  ])
  assert.equal(calls.confirms.length, 2)
  assert.match(calls.confirms[0][0], /Cleaning/)
  assert.match(calls.confirms[1][0], /Cleaning/)
  assert.equal(calls.confirms[0][1], 'Approve quote')
  assert.equal(calls.confirms[1][1], 'Reject quote')
})

test('onboarding and price-change decisions wait for confirmation', async (t) => {
  const { state, calls, controls } = await harness(t)
  controls.confirm = async () => { throw new Error('cancel') }
  await state.approveOnboarding()
  state.rejectReason = 'Need a clearer licence'
  await state.submitReject()
  await state.reviewPriceChange({ spuId: 501, spuName: 'Cleaning' }, 2)
  assert.deepEqual(calls.onboarding, [])
  assert.deepEqual(calls.priceChanges, [])
  assert.equal(calls.confirms.length, 3)
  assert.match(calls.confirms[0][0], /Test Supplier/)
  assert.match(calls.confirms[2][0], /Cleaning/)
  controls.confirm = async () => {}
  await state.approveOnboarding()
  await state.submitReject()
  await state.reviewPriceChange({ spuId: 501, spuName: 'Cleaning' }, 2)
  assert.deepEqual(calls.onboarding.map((item) => item.status), [2, 3])
  assert.equal(calls.onboarding[1].rejectReason, 'Need a clearer licence')
  assert.deepEqual(calls.priceChanges, [{ supplierId: 10, spuId: 501, status: 2 }])
})

test('an offered add-on can be approved or rejected on its own', async (t) => {
  const quote = {
    spuId: 501, quoteMode: 1, reviewByUnitPrice: false, status: 1, versionNo: 4,
    skus: [{ skuId: 601, skuCode: 'FIXED', quoted: true, enabled: 1, quotePrice: 150, reviewStatus: null }],
    attaches: [{
      attachValueId: 9, attachTypeName: 'Extra', attachValueName: 'Oven',
      canServe: true, quotePrice: 25, platformPrice: 30, reviewStatus: null,
    }],
  }
  const { state, calls } = await harness(t, quote)
  await state.openSkus(service)
  assert.equal(state.skuAttaches.length, 1)
  assert.equal(state.showQuoteFoot, true)
  assert.equal(state.isAttachSelectable(state.skuAttaches[0]), true)
  renderFragment('sku-attaches', state)
  await state.approveAttach(state.skuAttaches[0])
  await state.openLineReject([], [state.skuAttaches[0]])
  state.lineRejectReason = 'Too expensive'
  await state.rejectSelectedLines()
  assert.deepEqual(calls.reviews, [
    { supplierId: 10, spuId: 501, versionNo: 4, attaches: [{ attachValueId: 9, status: 2 }] },
    {
      supplierId: 10, spuId: 501, versionNo: 4,
      attaches: [{ attachValueId: 9, status: 3, rejectReason: 'Too expensive' }],
    },
  ])
  assert.equal(calls.confirms.length, 2)
})

test('cancelling the quote confirmation sends no review', async (t) => {
  const { state, calls, controls } = await harness(t)
  await state.openSkus(service)
  controls.confirm = async () => { throw new Error('cancel') }
  await state.reviewHourlyQuote(2)
  await state.reviewHourlyQuote(3, 'Please revise both rates')
  assert.deepEqual(calls.reviews, [])
  assert.equal(calls.confirms.length, 2)
  assert.deepEqual(calls.messages, [])
})

test('a quote notice deep link loads the service list before opening quote lines', async (t) => {
  const { state, calls } = await harness(t, hourly, { id: '10', view: 'quote', spu: '501' })
  assert.equal(state.services.length, 1)
  assert.equal(state.services[0].spuId, 501)
  assert.equal(state.skuTarget.spuId, 501)
  assert.equal(state.skuUnitPriceWithMaterial, 80)
  assert.equal(state.skuUnitPriceWithoutMaterial, '65.50')
  assert.equal(state.quoteRoutePending, false)
  assert.deepEqual(calls.skus, [{ supplierId: 10, spuId: 501 }])
})

test('checked services export only those quote ids on the platform supplier page', async (t) => {
  const { state, calls } = await harness(t)
  state.services = [
    { spuId: 501, spuName: 'Cleaning', categoryName: 'Home', status: 1 },
    { spuId: 502, spuName: 'Moving', categoryName: 'Home', status: 2 },
  ]
  await flush()
  assert.equal(state.quoteExportLabel, messages.en.admin.platformSuppliers.exportQuoteSheet)
  await state.downloadQuoteSheet()
  assert.deepEqual(calls.quoteExports[0], { supplierId: 10, spuIds: [] })
  state.toggleVisibleQuoteSelection(true)
  assert.deepEqual(clone(state.selectedQuoteSpuIds), [501, 502])
  assert.equal(state.quoteExportLabel, 'Export selected (2)')
  state.serviceStatusFilter = 2
  await flush()
  assert.deepEqual(state.visibleServices.map((row) => row.spuId), [502])
  state.toggleVisibleQuoteSelection(false)
  assert.deepEqual(clone(state.selectedQuoteSpuIds), [501])
  await state.downloadQuoteSheet()
  assert.deepEqual(calls.quoteExports.at(-1), { supplierId: 10, spuIds: [501] })
  state.services = state.services.filter((row) => row.spuId !== 501)
  await flush()
  assert.deepEqual(clone(state.selectedQuoteSpuIds), [])
  assert.match(descriptor.template.content, /toggleQuoteSpu\(row\.spuId, checked === true\)/)
  assert.match(descriptor.template.content, /class="quote-select" @click.stop/)
  assert.match(descriptor.template.content, /quoteExportLabel/)
  assert.match(descriptor.template.content, /admin\.platformSuppliers\.exportSelectionHint/)
})

test('platform supplier template compiles against the actual setup bindings', () => {
  assert.deepEqual(compileTemplate({
    source: descriptor.template.content, filename, id: 'platform-supplier-hourly-review-test',
    compilerOptions: { bindingMetadata: script.bindings },
  }).errors, [])
})

test('both quote screens open the same supplier-scoped import history dialog', () => {
  for (const className of ['panel-actions', 'quote-head__actions']) {
    const section = findByClass(templateAst, className)
    assert.ok(section)
    assert.match(section.loc.source, /@click="quoteHistoryOpen = true"/)
    assert.match(section.loc.source, /admin\.platformSuppliers\.quoteHistory\.title/)
  }
  assert.match(descriptor.template.content, /<SupplierQuoteImportHistory\s+v-model="quoteHistoryOpen"\s+:supplier-id="detailId"/)
})
