import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as Vue from 'vue'
import * as compareUtils from '../src/modules/admin/utils/supplierQuoteCompare.ts'
import * as compareFilters from '../src/modules/admin/utils/quoteCompareFilters.ts'
import {
  buildQuoteCompareMatrix,
  formatCompareMoney,
  formatProfitPercent,
} from '../src/modules/admin/utils/supplierQuoteCompare.ts'

const rows = [
  {
    supplierId: 11,
    supplierName: 'High Margin Co',
    supplierNo: 'VED001',
    spuId: 21,
    spuName: 'Deep clean',
    skuId: 101,
    skuCode: 'SKU-101',
    quotePrice: '60.00',
    profitRate: '0.4286',
    platformPriceWithTax: '105.00',
    status: 2,
  },
  {
    supplierId: 11,
    supplierName: 'High Margin Co',
    supplierNo: 'VED001',
    spuId: 21,
    skuId: 102,
    skuCode: 'SKU-102',
    quotePrice: '150.00',
    profitRate: '0.2857',
    platformPriceWithTax: '210.00',
    status: 2,
  },
  {
    supplierId: 19,
    supplierName: 'Low Margin Co',
    supplierNo: 'VED002',
    spuId: 21,
    skuId: 101,
    skuCode: 'SKU-101',
    quotePrice: '90.00',
    profitRate: '0.1429',
    platformPriceWithTax: '105.00',
    status: 1,
  },
  {
    supplierId: 11,
    supplierName: 'High Margin Co',
    spuId: 30,
    spuName: 'Windows',
    skuId: 201,
    skuCode: 'SKU-2',
    quotePrice: '40.00',
    profitRate: '0.5000',
    platformPriceWithTax: '80.00',
  },
]

test('quote comparison lays suppliers out by their best margin and marks each row winner', () => {
  const matrix = buildQuoteCompareMatrix(rows)
  assert.deepEqual(matrix.suppliers.map((item) => item.id), [11, 19])
  assert.equal(matrix.grouped, true)
  assert.deepEqual(matrix.skus.map((item) => item.skuCode), ['SKU-101', 'SKU-102', 'SKU-2'])
  assert.equal(matrix.skus[0].cells[11].best, true)
  assert.equal(matrix.skus[0].cells[19].best, false)
  assert.equal(matrix.skus[1].cells[11].best, true)
  assert.equal(matrix.skus[1].cells[19], undefined)
  assert.equal(formatCompareMoney(matrix.skus[0].platformPrice), '105.00')
  assert.equal(formatProfitPercent(matrix.skus[0].cells[11].profitRate), '42.86%')
  assert.equal(formatProfitPercent(-0.1), '-10%')
  assert.equal(formatProfitPercent(null), '—')
})

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const loadModule = (path, require = (name) => { throw new Error(`Unexpected dependency: ${name}`) }) => {
  const exports = {}
  runInNewContext(transpile(read(path)), { exports, require })
  return exports
}
const plain = (value) => JSON.parse(JSON.stringify(value))

// The compare endpoint for SPU 121 returns a success-only envelope. There are
// two suppliers, eight options, and one absent quote in its current payload.
const comparison121 = [3545, 4610, 5545, 7080, 4825, 5995, 7035, 8610].flatMap((price, index) => {
  const secondPrice = [null, 500, 700, 900, 400, 600, 800, 1000][index]
  return [[26, 'TEST-SOFIA ROYAL SERVICE COMPANY', 700], [30, 'Test Hope Company', secondPrice]]
    .filter(([, , quotePrice]) => quotePrice !== null)
    .map(([supplierId, supplierName, quotePrice]) => ({
      supplierId, supplierName, supplierNo: `VED0000${supplierId}`, spuId: 121,
      spuName: '别墅油漆和清洁', skuId: 3640 + index, skuCode: String(3640 + index),
      quotePrice, platformPriceWithTax: price, profitRate: Number(((price - quotePrice) / price).toFixed(4)),
      status: 1, statusI18n: { zh: '待审核', en: 'Pending review' }, quoteMode: 1,
      quoteModeI18n: { zh: '一口价', en: 'Fixed price' }, versionNo: 1,
    }))
})
const successPayload = (data = comparison121) => ({ success: true, message: '操作成功', data, errorCode: null })

function apiHarness(get) {
  const calls = []
  const http = { get: async (url, options) => { calls.push(plain({ url, options })); return get(url, options) } }
  const api = loadModule('src/modules/admin/api/supplierWorkbench.ts', (name) => {
    if (name === '@/modules/admin/utils/request') return { __esModule: true, default: http }
    if (name === '@/modules/admin/utils/supplierServiceCatalog') return {}
    if (name === '@/modules/admin/utils/supplierQuoteCompare') return compareUtils
    throw new Error(`Unexpected API dependency: ${name}`)
  })
  return { api, calls }
}

const comparePage = (list, pageNum, pageSize, total = list.length) => successPayload({
  list, total, pageNum, pageSize, totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
})

test('compare API unwraps the paged success envelope without dropping supplier prices', async () => {
  const { api, calls } = apiHarness(async () => comparePage(comparison121, 1, 500, comparison121.length))
  const result = await api.supplierQuoteCompare({ spuId: 121 })
  assert.equal(Array.isArray(result), true, 'The endpoint adapter must expose the quote array inside data.list')
  assert.deepEqual(plain(result), comparison121)
  assert.deepEqual(calls, [{
    url: '/api/platform/supplierQuote/compare',
    options: { params: { spuId: 121, pageNum: 1, pageSize: 500 } },
  }])
  const matrix = buildQuoteCompareMatrix(result)
  assert.equal(matrix.suppliers.length, 2)
  assert.equal(matrix.skus.length, 8)
  assert.equal(matrix.skus.reduce((count, sku) => count + Object.keys(sku.cells).length, 0), 15)
  assert.equal(matrix.skus[0].cells[30], undefined)
  assert.equal(matrix.skus[7].cells[26].quotePrice, 700)
  assert.equal(matrix.skus[7].cells[30].quotePrice, 1000)
  assert.equal(matrix.skus[2].cells[26].best, true)
  assert.equal(matrix.skus[2].cells[30].best, true)
})

test('compare API follows later pages so the matrix keeps every supplier quote', async () => {
  const midpoint = 8
  const { api, calls } = apiHarness(async (_url, options) => comparePage(
    options.params.pageNum === 1 ? comparison121.slice(0, midpoint) : comparison121.slice(midpoint),
    options.params.pageNum,
    midpoint,
    comparison121.length,
  ))
  const result = await api.supplierQuoteCompare({ packageId: 9 })
  assert.deepEqual(plain(result), comparison121)
  assert.deepEqual(calls.map((call) => call.options.params), [
    { packageId: 9, pageNum: 1, pageSize: 500 },
    { packageId: 9, pageNum: 2, pageSize: 500 },
  ])
  assert.equal(buildQuoteCompareMatrix(result).skus.length, 8)
})

test('compare API accepts unwrapped arrays, wrapped arrays and empty results for service or package queries', async () => {
  for (const payload of [comparison121, { data: comparison121 }, successPayload()]) {
    const { api } = apiHarness(async () => payload)
    const result = await api.supplierQuoteCompare({ packageId: 9 })
    assert.equal(Array.isArray(result), true)
    assert.deepEqual(plain(result), comparison121)
  }
  for (const payload of [[], { data: [] }, successPayload([]), comparePage([], 1, 500, 0)]) {
    const { api } = apiHarness(async () => payload)
    assert.deepEqual(plain(await api.supplierQuoteCompare({ spuId: 121 })), [])
  }
})

test('compare API preserves request failures for the preview error state', async () => {
  const { api } = apiHarness(async () => { throw new Error('Compare service unavailable') })
  await assert.rejects(api.supplierQuoteCompare({ spuId: 121 }), /Compare service unavailable/)
})

const filename = 'src/modules/admin/components/SupplierQuoteCompareDialog.vue'
const { descriptor, errors } = parse(read(filename), { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: 'supplier-quote-compare-test' })
const template = compileTemplate({ source: descriptor.template.content, filename, id: 'supplier-quote-compare-test',
  compilerOptions: { bindingMetadata: script.bindings } })
assert.deepEqual(template.errors, [])
const templateExports = {}
runInNewContext(transpile(template.code), { exports: templateExports, require: () => Vue })
const i18n = loadModule('src/modules/admin/utils/i18n.ts')
const messages = Object.fromEntries(['en', 'zh'].map(language => [language,
  loadModule(`src/modules/admin/locales/${language}.ts`).default,
]))
const translate = (key, params = {}, language = 'en') => {
  const value = key.split('.').reduce((node, part) => node?.[part], messages[language])
  assert.equal(typeof value, 'string', `Missing translation: ${key}`)
  return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
}
const flush = async () => {
  for (let index = 0; index < 24; index++) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const removeNode = (node) => {
  const children = node.parent?.children
  const index = children?.indexOf(node) ?? -1
  if (index >= 0) children.splice(index, 1)
  node.parent = null
}
const insertNode = (node, parent, anchor) => {
  if (node.parent) removeNode(node)
  const children = parent.children ||= []
  const index = anchor ? children.indexOf(anchor) : -1
  children.splice(index < 0 ? children.length : index, 0, node)
  node.parent = parent
}
const renderer = Vue.createRenderer({
  createElement: (type) => ({ type, props: {}, style: {}, children: [] }),
  createText: (text) => ({ type: '#text', text }), createComment: () => ({ type: '#comment' }),
  insert: insertNode, remove: removeNode,
  setText: (node, text) => { node.text = text },
  setElementText: (node, text) => { node.text = text; node.children = [] },
  patchProp: (node, key, _before, after) => { node.props[key] = after },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  insertStaticContent(content, parent, anchor) {
    const node = { type: '#static', text: content.replace(/<[^>]+>/g, '') }
    insertNode(node, parent, anchor)
    return [node, node]
  },
})
const allNodes = (node) => [node, ...(node.children || []).flatMap(allNodes)]
const textOf = (node) => `${node.text || ''} ${(node.children || []).map(textOf).join(' ')}`
const hasClass = (node, className) => Vue.normalizeClass(node.props?.class).split(/\s+/).includes(className)
const quoteAmounts = (container) => allNodes(container).filter((node) => node.type === 'strong'
  && Vue.normalizeClass(node.parent?.props?.class).split(/\s+/).includes('quote-compare__amount'))

async function dialogHarness(t, get = async () => successPayload(), overrides = {},
  getSpecs = async () => successPayload({ skus: [], specTypes: [] }), { viewMode = 'table' } = {}) {
  const { api, calls } = apiHarness(get)
  const props = Vue.reactive({ modelValue: false, spuId: 121, ...overrides })
  const locale = Vue.ref('en')
  const exports = {}
  runInNewContext(transpile(script.content), { exports, require: (name) => {
    if (name === 'vue') return Vue
    if (name === 'vue-i18n') return { useI18n: () => ({ t: (key, params) => translate(key, params, locale.value), locale }) }
    if (name === '@/modules/admin/api/supplierWorkbench') return api
    if (name === '@/modules/admin/api/spu') return { listBySpu: getSpecs }
    if (name === '@/modules/admin/utils/i18n') return i18n
    if (name === '@/modules/admin/utils/supplierQuoteCompare') return compareUtils
    if (name === '@/modules/admin/utils/quoteCompareFilters') return compareFilters
    if (name === '@/modules/admin/components/QuoteComparePriceChart.vue') return { __esModule: true, default: {
      props: ['skus', 'suppliers', 'labels', 'grouped'],
      setup: (chart) => () => {
        const prices = chart.skus.flatMap(sku => chart.suppliers.flatMap(supplier =>
          sku.cells[supplier.id]?.quotePrice == null ? [] : [sku.cells[supplier.id].quotePrice]))
        return Vue.h('div', { 'data-chart-stub': true, 'data-sku-count': chart.skus.length,
          'data-supplier-count': chart.suppliers.length, 'data-quote-count': prices.length,
          'data-prices': JSON.stringify(prices) }, `Chart: ${chart.skus.length} options, ${prices.length} prices`)
      },
    } }
    if (name === '@/modules/admin/utils/quoteCompareSpecs') return loadModule('src/modules/admin/utils/quoteCompareSpecs.ts', (dependency) => {
      if (dependency === '@/modules/admin/utils/i18n' || dependency === './i18n') return i18n
      throw new Error(`Unexpected spec dependency: ${dependency}`)
    })
    throw new Error(`Unexpected dialog dependency: ${name}`)
  } })
  let instance
  const component = { ...exports.default, render: templateExports.render }
  const app = renderer.createApp({ setup: () => () => Vue.h(component, { ...props,
    ref: (value) => { if (value) instance = value }, 'onUpdate:modelValue': (value) => { props.modelValue = value },
  }) })
  app.component('ElDialog', { props: ['modelValue'], setup: (dialog, { slots }) => () =>
    dialog.modelValue ? Vue.h('section', slots.default?.()) : null })
  for (const [name, tag] of Object.entries({ ElButton: 'button', ElInput: 'input', ElInputNumber: 'input',
    ElSelect: 'select', ElOption: 'option', ElCheckbox: 'label' })) {
    app.component(name, { props: ['modelValue', 'label', 'value'], setup: (control, { slots }) => () =>
      Vue.h(tag, { value: control.modelValue ?? control.value }, slots.default?.() || control.label) })
  }
  app.directive('loading', {})
  app.config.warnHandler = () => {}
  const renderErrors = []
  app.config.errorHandler = (error) => renderErrors.push(error)
  const container = { children: [] }
  app.mount(container)
  let unmounted = false
  const unmount = () => { if (!unmounted) { app.unmount(); unmounted = true } }
  t.after(unmount)
  await flush()
  const state = instance.$.setupState
  const productionViewMode = state.viewMode
  if (viewMode === 'table') { state.viewMode = 'table'; await flush() }
  return { state, productionViewMode, props, locale, calls, container, renderErrors, unmount }
}

test('preview renders all returned suppliers and option prices from the real API adapter', async (t) => {
  const { state, props, calls, container, renderErrors } = await dialogHarness(t)
  assert.deepEqual(calls, [])
  props.modelValue = true
  await flush()
  state.viewMode = 'table'
  await flush()
  assert.equal(state.matrix.suppliers.length, 2)
  assert.equal(state.matrix.skus.length, 8)
  assert.equal(quoteAmounts(container).length, 15)
  assert.match(textOf(container), /TEST-SOFIA ROYAL SERVICE COMPANY/)
  assert.match(textOf(container), /Test Hope Company/)
  assert.match(textOf(container), /8610\.00/)
  assert.match(textOf(container), /1000\.00/)
  assert.match(textOf(container), /Pending review/)
  assert.match(textOf(container), /No quote/)
  assert.deepEqual(renderErrors, [])
})

test('production defaults to charts and switching views shares filters, refresh data and reopening rules', async (t) => {
  let reads = 0
  const { state, productionViewMode, props, calls, container, renderErrors } = await dialogHarness(t, async () => {
    reads++
    return successPayload(comparison121.map(row => reads > 1 && row.skuId === 3641 && row.supplierId === 30
      ? { ...row, quotePrice: 550 } : row))
  }, { modelValue: true }, undefined, { viewMode: 'production' })
  const chart = () => allNodes(container).find(node => node.props?.['data-chart-stub'])
  const switchView = async (name) => {
    const button = allNodes(container).find(node => node.type === 'button'
      && node.props?.['aria-pressed'] != null && textOf(node).toLowerCase().includes(name))
    assert.ok(button, `The ${name} view must have a visible toggle button`)
    button.props.onClick()
    await flush()
  }
  assert.equal(productionViewMode, 'chart')
  assert.equal(state.viewMode, 'chart')
  assert.equal(chart().props['data-sku-count'], 8)
  assert.equal(chart().props['data-supplier-count'], 2)
  assert.equal(chart().props['data-quote-count'], 15)
  assert.equal(quoteAmounts(container).length, 0)
  state.selectedSupplierIds = [30]
  state.selectedSkuKeys = ['3641', '3642']
  state.statusFilter = 1
  await flush()
  assert.equal(chart().props['data-sku-count'], 2)
  assert.equal(chart().props['data-supplier-count'], 1)
  assert.deepEqual(JSON.parse(chart().props['data-prices']), [500, 700])
  await switchView('table')
  assert.equal(state.viewMode, 'table')
  assert.equal(chart(), undefined)
  assert.equal(state.quoteCount, 2)
  assert.equal(state.pendingCount, 2)
  assert.equal(quoteAmounts(container).length, 2)
  assert.deepEqual(plain(state.selectedSupplierIds), [30])
  await state.load()
  await flush()
  assert.equal(calls.length, 2)
  assert.equal(state.viewMode, 'table')
  assert.equal(quoteAmounts(container).length, 2)
  assert.match(textOf(container), /550\.00/)
  await switchView('chart')
  assert.deepEqual(JSON.parse(chart().props['data-prices']), [550, 700])
  assert.equal(state.quoteCount, 2)
  await switchView('table')
  props.modelValue = false
  await flush()
  props.modelValue = true
  await flush()
  assert.equal(calls.length, 3)
  assert.equal(state.viewMode, 'chart')
  assert.equal(state.activeFilterCount, 0)
  assert.equal(chart().props['data-sku-count'], 8)
  assert.equal(chart().props['data-quote-count'], 15)
  assert.deepEqual(renderErrors, [])
})

test('preview renders an empty message or a request error instead of stale comparison values', async (t) => {
  const empty = await dialogHarness(t, async () => successPayload([]), { modelValue: true })
  assert.equal(empty.state.matrix.skus.length, 0)
  assert.match(textOf(empty.container), /No supplier quotes to compare yet/)
  const failed = await dialogHarness(t, async () => { throw new Error('Compare service unavailable') }, { modelValue: true })
  assert.equal(failed.state.loading, false)
  assert.match(textOf(failed.container), /Compare service unavailable/)
})

test('a failed refresh keeps visible prices with an inline error and reopening clears the error', async (t) => {
  const pending = deferred()
  let reads = 0
  const { state, props, container, renderErrors } = await dialogHarness(t, async () => {
    reads++
    return reads === 2 ? pending.promise : successPayload()
  }, { modelValue: true })
  state.selectedSupplierIds = [30]
  state.selectedSkuKeys = ['3641']
  await flush()
  assert.equal(state.quoteCount, 1)
  assert.equal(quoteAmounts(container).length, 1)
  const refresh = state.load()
  await flush()
  assert.equal(state.loading, true)
  assert.equal(state.matrix.skus.length, 8)
  assert.equal(quoteAmounts(container).length, 1)
  assert.match(textOf(container), /500\.00/)
  pending.reject(new Error('Price service timed out'))
  await refresh
  await flush()
  assert.equal(state.loading, false)
  assert.equal(state.quoteCount, 1)
  assert.equal(state.viewMode, 'table')
  assert.equal(quoteAmounts(container).length, 1)
  const alert = () => allNodes(container).find(node => node.props?.role === 'alert')
  assert.equal(textOf(alert()).trim(), translate('admin.quoteCompare.refreshError', { message: 'Price service timed out' }))
  state.resetFilters()
  await flush()
  assert.equal(state.quoteCount, 15)
  assert.equal(quoteAmounts(container).length, 15)
  props.modelValue = false
  await flush()
  props.modelValue = true
  await flush()
  assert.equal(reads, 3)
  assert.equal(state.errorText, '')
  assert.equal(alert(), undefined)
  assert.equal(state.quoteCount, 15)
  assert.deepEqual(renderErrors, [])
})

test('specification metadata failures preserve the returned supplier comparison', async (t) => {
  const { state, container, renderErrors } = await dialogHarness(t, async () => successPayload(), { modelValue: true },
    async () => { throw new Error('Specification lookup unavailable') })
  assert.equal(state.matrix.skus.length, 8)
  assert.equal(quoteAmounts(container).length, 15)
  assert.deepEqual(renderErrors, [])
})

test('real specification labels support search, refresh keeps its filter and reopening restores all options', async (t) => {
  const specs = successPayload({
    specTypes: [
      { specTypeId: 285, specKey: '285', nameI18n: { en: 'Furnishing' } },
      { specTypeId: 286, specKey: '286', nameI18n: { en: 'Villa size' } },
    ],
    skus: Array.from({ length: 8 }, (_, index) => ({ skuId: 3640 + index,
      285: { en: index < 4 ? 'Unfurnished' : 'Furnished' },
      286: { en: `${2 + index % 4} BHK` },
    })),
  })
  let readCount = 0
  const { state, props, calls, container, renderErrors } = await dialogHarness(t, async () => {
    readCount++
    return successPayload(comparison121.map(row => row.skuId === 3647 && row.supplierId === 30 && readCount > 1
      ? { ...row, quotePrice: 1100 } : row))
  }, { modelValue: true }, async () => specs)
  assert.match(textOf(container), /Unfurnished · 2 BHK/)
  assert.deepEqual(plain(state.specFor(state.matrix.skus[0]).details), ['Furnishing: Unfurnished', 'Villa size: 2 BHK'])
  state.search = '2 BHK'
  await flush()
  assert.deepEqual(plain(state.visibleSkus.map(sku => sku.skuId)), [3640, 3644])
  assert.equal(quoteAmounts(container).length, 3)
  state.search = '3647'
  await flush()
  await state.load()
  await flush()
  assert.equal(calls.length, 2)
  assert.equal(state.search, '3647')
  assert.equal(state.visibleSkus.length, 1)
  assert.match(textOf(container), /1100\.00/)
  props.modelValue = false
  await flush()
  props.modelValue = true
  await flush()
  assert.equal(state.search, '')
  assert.equal(state.visibleSkus.length, 8)
  assert.equal(calls.length, 3)
  assert.deepEqual(renderErrors, [])
})

const mixedComparison121 = comparison121.map(row => {
  const approved = (row.supplierId === 26 && [3640, 3641, 3642].includes(row.skuId))
    || (row.supplierId === 30 && [3642, 3643].includes(row.skuId))
  const hourly = row.skuId === 3643
  return { ...row, status: approved ? 2 : 1,
    statusI18n: approved ? { en: 'Approved', zh: '已通过' } : row.statusI18n,
    quoteMode: hourly ? 2 : 1,
    quoteModeI18n: hourly ? { en: 'Unit price', zh: '单价计费' } : row.quoteModeI18n,
  }
})

test('supplier, option and status filters update rendered prices and distinguish masked quotes from missing quotes', async (t) => {
  const { state, container, renderErrors } = await dialogHarness(t, async () => successPayload(mixedComparison121),
    { modelValue: true })
  assert.equal(state.quoteCount, 15)
  assert.equal(state.pendingCount, 10)
  state.selectedSkuKeys = ['3640', '3641', '3642']
  state.statusFilter = 2
  await flush()
  assert.equal(state.view.suppliers.length, 2)
  assert.equal(state.view.skus.length, 3)
  assert.equal(state.quoteCount, 4)
  assert.equal(state.pendingCount, 0)
  assert.equal(quoteAmounts(container).length, 4)
  const placeholders = allNodes(container).filter(node => hasClass(node, 'quote-compare__no-quote'))
  assert.equal(placeholders.length, 2)
  assert.match(textOf(placeholders.find(node => hasClass(node, 'is-filtered'))), /Outside filters/)
  assert.match(textOf(placeholders.find(node => !hasClass(node, 'is-filtered'))), /No quote to compare/)

  state.selectedSupplierIds = [30]
  await flush()
  assert.deepEqual(plain(state.view.suppliers.map(supplier => supplier.id)), [30])
  assert.deepEqual(plain(state.visibleSkus.map(sku => sku.skuId)), [3642])
  assert.equal(state.quoteCount, 1)
  assert.equal(state.view.lowestPrice, 700)
  assert.equal(state.view.comparableSkuCount, 0)
  assert.equal(state.supplierCoverage(30), 1)
  assert.equal(quoteAmounts(container).length, 1)
  assert.equal(state.matrix.skus.length, 8, 'Filtering must preserve the loaded source options')
  state.resetFilters()
  await flush()
  assert.equal(state.activeFilterCount, 0)
  assert.equal(state.visibleSkus.length, 8)
  assert.equal(state.quoteCount, 15)
  assert.equal(state.pendingCount, 10)
  assert.equal(quoteAmounts(container).length, 15)
  assert.doesNotMatch(textOf(container), /Outside filters/)
  assert.deepEqual(renderErrors, [])
})

test('billing, price and comparable filters combine before option ordering and summary calculations', async (t) => {
  const { state, container, renderErrors } = await dialogHarness(t, async () => successPayload(mixedComparison121),
    { modelValue: true })
  state.modeFilter = 1
  state.minPrice = 500
  state.maxPrice = 800
  state.onlyComparable = true
  state.sortOrder = 'price-asc'
  await flush()
  assert.deepEqual(plain(state.visibleSkus.map(sku => sku.skuId)), [3641, 3645, 3642, 3646])
  assert.equal(state.quoteCount, 8)
  assert.equal(state.pendingCount, 5)
  assert.equal(state.view.lowestPrice, 500)
  assert.equal(state.view.comparableSkuCount, 4)
  assert.equal(state.activeFilterCount, 4)
  assert.equal(quoteAmounts(container).length, 8)
  state.sortOrder = 'spread-desc'
  await flush()
  assert.deepEqual(plain(state.visibleSkus.map(sku => sku.skuId)), [3641, 3645, 3646, 3642])
  state.modeFilter = 2
  state.minPrice = 700
  state.maxPrice = 900
  await flush()
  assert.deepEqual(plain(state.visibleSkus.map(sku => sku.skuId)), [3643])
  assert.equal(state.quoteCount, 2)
  assert.equal(state.pendingCount, 1)
  assert.equal(state.visibleSkus[0].spread, 200)
  assert.equal(quoteAmounts(container).length, 2)
  assert.match(textOf(container), /Unit price/)
  assert.deepEqual(renderErrors, [])
})

test('refresh preserves all comparison filters while switching targets or reopening clears them', async (t) => {
  let reads = 0
  const { state, props, calls, container, renderErrors } = await dialogHarness(t, async (_url, options) => {
    reads++
    return successPayload(mixedComparison121.map(row => ({ ...row, spuId: options.params.spuId,
      quotePrice: reads > 1 && row.skuId === 3642 && row.supplierId === 30 ? 750 : row.quotePrice,
    })))
  }, { modelValue: true })
  const filterValues = () => ({ search: state.search, selectedSupplierIds: [...state.selectedSupplierIds],
    selectedSkuKeys: [...state.selectedSkuKeys], statusFilter: state.statusFilter, modeFilter: state.modeFilter,
    minPrice: state.minPrice, maxPrice: state.maxPrice, onlyComparable: state.onlyComparable, sortOrder: state.sortOrder })
  const selectFilters = () => Object.assign(state, { search: '3642', selectedSupplierIds: [26, 30],
    selectedSkuKeys: ['3642'], statusFilter: 2, modeFilter: 1, minPrice: 500, maxPrice: 800,
    onlyComparable: true, sortOrder: 'price-asc' })
  selectFilters()
  await flush()
  const selected = filterValues()
  assert.equal(state.activeFilterCount, 8)
  await state.load()
  await flush()
  assert.equal(calls.length, 2)
  assert.deepEqual(filterValues(), selected)
  assert.equal(state.quoteCount, 2)
  assert.equal(state.view.skus[0].highestPrice, 750)
  assert.match(textOf(container), /750\.00/)

  props.spuId = 122
  await flush()
  assert.equal(calls.length, 3)
  assert.equal(state.activeFilterCount, 0)
  assert.deepEqual(plain(state.selectedSupplierIds), [])
  assert.deepEqual(plain(state.selectedSkuKeys), [])
  assert.equal(state.minPrice, undefined)
  assert.equal(state.maxPrice, undefined)
  assert.equal(state.onlyComparable, false)
  assert.equal(state.sortOrder, 'default')
  assert.equal(state.view.skus.length, 8)
  selectFilters()
  state.filtersExpanded = false
  await flush()
  props.modelValue = false
  await flush()
  props.modelValue = true
  await flush()
  assert.equal(calls.length, 4)
  assert.equal(state.activeFilterCount, 0)
  assert.equal(state.filtersExpanded, true)
  assert.equal(state.quoteCount, 15)
  assert.equal(state.view.skus.length, 8)
  assert.deepEqual(renderErrors, [])
})

test('reversed quote ranges show translated validation and can be cleared with reset', async (t) => {
  const { state, locale, container, renderErrors } = await dialogHarness(t, async () => successPayload(),
    { modelValue: true })
  state.minPrice = 800
  state.maxPrice = 100
  await flush()
  assert.equal(state.invalidPriceRange, true)
  assert.equal(state.view.skus.length, 0)
  assert.equal(state.quoteCount, 0)
  assert.equal(state.pendingCount, 0)
  assert.equal(quoteAmounts(container).length, 0)
  const alert = () => allNodes(container).find(node => node.props?.role === 'alert')
  assert.equal(textOf(alert()).trim(), translate('admin.quoteCompare.invalidPriceRange'))
  locale.value = 'zh'
  await flush()
  assert.equal(textOf(alert()).trim(), translate('admin.quoteCompare.invalidPriceRange', {}, 'zh'))
  assert.doesNotMatch(textOf(alert()), /admin\.quoteCompare\./)
  state.resetFilters()
  await flush()
  assert.equal(state.invalidPriceRange, false)
  assert.equal(alert(), undefined)
  assert.equal(state.view.skus.length, 8)
  assert.equal(quoteAmounts(container).length, 15)
  assert.deepEqual(renderErrors, [])
})

test('native price inputs retain controlled values across filter changes and reject invalid limits', async (t) => {
  const { state, locale, container, renderErrors } = await dialogHarness(t, async () => successPayload(),
    { modelValue: true })
  const inputs = () => allNodes(container).filter(node => node.type === 'input' && hasClass(node, 'quote-compare__price-input'))
  const enter = async (index, value) => { inputs()[index].props.onInput({ target: { value } }); await flush() }
  const alert = () => allNodes(container).find(node => node.props?.role === 'alert')
  assert.equal(inputs().length, 2)
  assert.deepEqual(inputs().map(input => input.props.value), ['', ''])
  await enter(0, '500.25')
  await enter(1, '800.75')
  assert.equal(state.minPrice, 500.25)
  assert.equal(state.maxPrice, 800.75)
  assert.equal(state.quoteCount, 11)
  assert.deepEqual(inputs().map(input => input.props.value), [500.25, 800.75])
  state.selectedSupplierIds = [30]
  state.search = '3646'
  await flush()
  assert.equal(state.quoteCount, 1)
  assert.equal(quoteAmounts(container).length, 1)
  assert.deepEqual(inputs().map(input => input.props.value), [500.25, 800.75],
    'Changing another control must not blank the visible limits while they remain applied')
  await enter(0, '')
  await enter(1, '')
  state.search = ''
  await flush()
  assert.equal(state.minPrice, undefined)
  assert.equal(state.maxPrice, undefined)
  assert.deepEqual(inputs().map(input => input.props.value), ['', ''])
  assert.equal(state.quoteCount, 7)
  await enter(0, '-1')
  assert.equal(state.minPrice, -1)
  assert.equal(state.invalidPriceValue, true)
  assert.equal(state.quoteCount, 0)
  assert.equal(state.visibleSkus.length, 0)
  assert.equal(textOf(alert()).trim(), translate('admin.quoteCompare.invalidPriceValue'))
  await enter(0, '1e309')
  locale.value = 'zh'
  await flush()
  assert.equal(state.minPrice, Infinity)
  assert.equal(state.invalidPriceValue, true)
  assert.equal(state.quoteCount, 0)
  assert.equal(textOf(alert()).trim(), translate('admin.quoteCompare.invalidPriceValue', {}, 'zh'))
  await enter(0, '0')
  assert.equal(state.minPrice, 0)
  assert.equal(inputs()[0].props.value, 0)
  assert.equal(state.invalidPriceValue, false)
  assert.equal(state.quoteCount, 7)
  assert.equal(alert(), undefined)
  state.resetFilters()
  await flush()
  assert.deepEqual(inputs().map(input => input.props.value), ['', ''])
  assert.equal(state.quoteCount, 15)
  assert.deepEqual(renderErrors, [])
})

test('changing the comparison target discards a slower earlier response', async (t) => {
  const first = deferred(), second = deferred()
  const { state, props } = await dialogHarness(t, (_url, options) => options.params.spuId === 121 ? first.promise : second.promise,
    { modelValue: true })
  props.spuId = 122
  await flush()
  second.resolve(successPayload([{ ...comparison121[0], spuId: 122, skuId: 5000, skuCode: 'CURRENT' }]))
  await flush()
  assert.equal(state.matrix.skus[0].skuCode, 'CURRENT')
  first.resolve(successPayload())
  await flush()
  assert.equal(state.matrix.skus.length, 1)
  assert.equal(state.matrix.skus[0].skuCode, 'CURRENT')
})

test('closing, clearing the target or unmounting invalidates in-flight preview requests', async (t) => {
  for (const change of [({ props }) => { props.modelValue = false }, ({ props }) => { props.spuId = null }, ({ unmount }) => unmount()]) {
    const pending = deferred()
    const harness = await dialogHarness(t, () => pending.promise, { modelValue: true })
    const { state } = harness
    change(harness)
    await flush()
    pending.resolve(successPayload())
    await flush()
    assert.equal(state.matrix.skus.length, 0)
    assert.equal(state.loading, false)
  }
})
