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
const modules = Object.fromEntries(['supplierReviewState', 'supplierPortal', 'supplierQueue', 'supplierServiceCatalog', 'i18n'].map(name => [
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

async function harness(t, quote = hourly, query = { id: '10' }, extras = {}) {
  const calls = { reviews: [], skus: [], messages: [], downloads: [], blobs: [], quoteExports: [], confirms: [], onboarding: [], priceChanges: [], supplierPages: [], productPages: [], catalogs: [] }
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
    platformSupplierQuotePage: async (payload) => {
      if (extras.quoteRows) return { data: { list: extras.quoteRows, total: extras.quoteRows.length } }
      return emptyPage(payload)
    },
    onboardingPage: emptyPage,
    onboardingDetail: async () => ({ data: { id: 10, supplierNo: 'VED10', companyName: 'Test Supplier', status: 2 } }),
    platformSupplierQuoteServices: async () => ({ data: extras.services || [service] }),
    serviceCatalog: async (supplierId, packageService = false) => {
      calls.catalogs.push({ supplierId, packageService })
      return { data: packageService ? (extras.packageCatalog || extras.catalog || []) : (extras.catalog || []) }
    },
    supplierPackageQuotes: async () => ({ data: [] }),
    importPlatformQuoteSheet: async () => ({ data: {} }),
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
      if (name === 'vue-router') return { useRoute: () => route, useRouter: () => ({
        push: async (to) => Object.assign(route, to),
        replace: async (to) => Object.assign(route, to),
      }) }
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
      if (name === '@/modules/admin/components/AdminBreadcrumb.vue') return {}
      if (name === '@/modules/admin/components/SupplierDocumentPreview.vue') return {}
      if (name === '@/modules/admin/api/spu') return {
        listBySpu: async () => ({ data: { specTypes: extras.specTypes || [], skus: extras.catalogSkus || [], attaches: extras.attaches || [] } }),
        listSpuAttachCatalog: async () => [],
        page: async (payload) => {
          calls.productPages.push(clone(payload))
          return { data: { list: extras.products || [], total: (extras.products || []).length } }
        },
      }
      if (name === '@/modules/admin/api/supplier') return {
        page: async (payload) => {
          calls.supplierPages.push(clone(payload))
          return extras.supplierPage ? await extras.supplierPage(payload) : { data: { list: [], total: 0 } }
        },
      }
      if (name === '@/modules/client/api/supplier-onboarding') return {
        listServiceCategories: async () => [], serviceCategoryLabel: () => '',
      }
      if (modules[name]) return modules[name]
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null }, extras.props || {})
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  assert.deepEqual(calls.messages, [])
  return { state: instance.$.setupState, calls, controls, locale, translate, route }
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
  return textOf(exports.render({ ...state, canAction: typeof state.canAction === 'function' ? state.canAction : () => true }, []))
}

test('platform hourly summary and review card show the two source rates in English and Chinese', async (t) => {
  const { state, controls, locale, translate } = await harness(t)
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
  controls.quote = {
    ...hourly,
    skus: [{
      skuId: 9, quoted: true, enabled: 1, available: true, quotePrice: null,
      staffCount: 1, serviceHours: 2, platformPriceWithTax: 210,
      specs: [{ specKey: 'material', specValueName: '不带材料' }],
    }],
  }
  await state.openSkus({ ...service, spuId: 502 })
  assert.equal(state.hourlyQuoteReview, true)
  assert.equal(state.reviewSkuRows.length, 1)
  assert.equal(state.reviewQuoteAmount(state.reviewSkuRows[0]), 131)
  assert.equal(state.marginText(state.reviewSkuRows[0]), '38%')
  locale.value = 'zh'
  assert.equal(state.hourlyCompareLabel('without'), '我们的单价 105.00 · 毛利率 38%')
  locale.value = 'en'
  assert.equal(state.hourlyCompareLabel('without'), 'Our rate 105.00 · Margin 38%')
  const table = findByClass(templateAst, 'quote-table')
  assert.equal(table.props.find((prop) => prop.type === 7 && prop.name === 'if')?.exp?.content, '!hourlyQuoteReview')
})

test('person-hour review shows one rate and exports that rate', async (t) => {
  const personHour = {
    ...hourly, quoteMode: 3, reviewByUnitPrice: true, unitPrice: 45,
    unitPriceWithMaterial: null, unitPriceWithoutMaterial: null,
  }
  const { state, controls, locale, translate } = await harness(t, personHour)
  await state.openSkus(service)
  assert.equal(state.skuQuoteMode, 3)
  assert.equal(state.skuUnitPrice, 45)
  const option = { staffCount: 1, serviceHours: 2, platformPriceWithTax: 210, quotePrice: null }
  assert.equal(state.reviewQuoteAmount(option), 90)
  assert.equal(state.marginText(option), '57%')
  assert.equal(state.staffHourQuote, true)
  assert.equal(state.billingLabel(3), translate('admin.platformSuppliers.personHour'))
  for (const language of ['en', 'zh']) {
    locale.value = language
    for (const className of ['quote-head__hourly-rates', 'hourly-review__content']) {
      const text = renderFragment(className, state)
      assert.ok(text.includes(translate('admin.platformSuppliers.hourlyRateLabel')))
      assert.match(text, /AED 45\.00/)
      assert.ok(!text.includes(translate('admin.platformSuppliers.hourlyRateWithMaterial')))
      assert.ok(!text.includes(translate('admin.platformSuppliers.hourlyRateWithoutMaterial')))
    }
    assert.ok(renderFragment('hourly-review__content', state).includes(translate('admin.platformSuppliers.staffHourReviewHint')))
  }
  assert.equal(state.hourlyQuoteReview, true)
  const rows = clone(await state.loadServicePriceRows(service))
  assert.equal(rows.length, 1)
  assert.equal(rows[0][4], translate('admin.platformSuppliers.hourlyRateLabel'))
  assert.equal(rows[0][8], '45.00')
  controls.quote = {
    ...personHour,
    unitPrice: 880,
    skus: [{
      skuId: 9, quoted: true, enabled: 1, available: true, quotePrice: null,
      staffCount: 0, serviceHours: 0, platformPriceWithTax: 162.75,
      specs: [{ specKey: 'duration', specValueNameI18n: { en: '1 Hour / Tech', zh: '1 小时/技术' } }],
    }],
  }
  await state.openSkus({ ...service, spuId: 503 })
  locale.value = 'zh'
  assert.equal(state.hourlyCompareLabel(null), '我们的单价 162.75 · 毛利率 -441%')
  assert.match(renderFragment('hourly-review__content', state), /我们的单价 162\.75/)
  assert.match(renderFragment('hourly-review__content', state), /-441%/)
  controls.quote = {
    ...personHour,
    skus: [{
      skuId: 9, quoted: true, enabled: 1, skuCode: 'L1', quotePrice: null,
      staffCount: 1, serviceHours: 2, platformPriceWithTax: 210, specs: [],
    }],
  }
  const priced = clone(await state.loadServicePriceRows(service))
  assert.equal(priced.length, 2)
  assert.equal(priced[1][8], '90.00')
  assert.equal(priced[1][9], '57%')
})

test('material hourly review shows the platform unit price from current catalog options', async (t) => {
  const quote = {
    ...hourly, status: 2, unitPriceWithMaterial: 120, unitPriceWithoutMaterial: 80,
    skus: [{ skuId: 1, quoted: false, enabled: 1, available: false }],
  }
  const catalogSkus = [
    {
      skuId: 11, price: 100, originalPrice: 100, valid: 1,
      material: { zh: '带材料', en: 'With Materials' },
      duration: { zh: '2小时', en: '2 Hours' },
      cleaners: { zh: '1 清洁工', en: '1 Cleaner' },
    },
    {
      skuId: 12, price: 85, originalPrice: 85, valid: 1,
      material: { zh: '无材料', en: 'Without Materials' },
      duration: { zh: '2小时', en: '2 Hours' },
      cleaners: { zh: '1 清洁工', en: '1 Cleaner' },
    },
  ]
  const { state, locale } = await harness(t, quote, { id: '10' }, { catalogSkus })
  await state.openSkus(service)
  locale.value = 'zh'
  assert.equal(state.hourlyCompareLabel('with'), '我们的单价 52.50 · 毛利率 -129%')
  assert.equal(state.hourlyCompareLabel('without'), '我们的单价 44.63 · 毛利率 -79%')
  assert.match(renderFragment('hourly-review__content', state), /我们的单价 52\.50/)
  assert.match(renderFragment('hourly-review__content', state), /我们的单价 44\.63/)
})

test('person-hour review says when the service has no platform price', async (t) => {
  const quote = { ...hourly, quoteMode: 3, reviewByUnitPrice: true, unitPrice: 80, status: 2, skus: [] }
  const catalogSkus = [{
    skuId: 5721, price: null, originalPrice: null, valid: 1,
    time: { zh: '1小时', en: '1 Hour' },
    size: { zh: '最大 55 英寸', en: 'Upto 55" inches', remarkI18n: { zh: '1 技术', en: '1 Tech' } },
  }]
  const { state, locale, translate } = await harness(t, quote, { id: '10' }, { catalogSkus })
  await state.openSkus(service)
  locale.value = 'zh'
  assert.equal(state.hourlyCompareLabel(null), '')
  const text = renderFragment('hourly-review__content', state)
  assert.match(text, /AED 80\.00/)
  assert.ok(text.includes(translate('admin.platformSuppliers.hourlyCompareMissingPrice')))
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

test('a quantity quote is reviewed as one price and a fixed quote adopts the service quantity mode', async (t) => {
  const quantity = {
    ...hourly, quoteMode: 4, configuredQuoteMode: 4, reviewByUnitPrice: true, unitPrice: 30,
    unitPriceWithMaterial: null, unitPriceWithoutMaterial: null,
  }
  const { state, locale, translate } = await harness(t, quantity)
  await state.openSkus(service)
  assert.equal(state.skuQuoteMode, 4)
  assert.equal(state.quantityQuote, true)
  assert.equal(state.hourlyQuoteReview, true)
  assert.equal(state.staffHourQuote, false)
  locale.value = 'zh'
  assert.equal(state.quoteModeText, translate('admin.platformSuppliers.quantityPrice'))
  const panel = renderFragment('hourly-review__content', state)
  assert.ok(panel.includes(translate('admin.platformSuppliers.quantityRateLabel')))
  assert.ok(panel.includes(translate('admin.platformSuppliers.quantityReviewHint')))
  assert.match(panel, /AED 30\.00/)
  assert.ok(!panel.includes(translate('admin.platformSuppliers.hourlyRateWithMaterial')))
  const rows = clone(await state.loadServicePriceRows(service))
  assert.equal(rows[0][3], translate('admin.platformSuppliers.quantityPrice'))
  assert.equal(rows[0][4], translate('admin.platformSuppliers.quantityRateLabel'))
  assert.equal(rows[0][6], translate('admin.platformSuppliers.quantityUnit'))
  assert.ok(panel.includes(translate('admin.platformSuppliers.quantityCompareMissingPrice')))

  const adopted = { quoteMode: 1, configuredQuoteMode: 4, unitPrice: null }
  assert.equal(state.displayedQuoteMode(adopted), 4)
  assert.equal(state.quoteUsesHourlyReview(adopted), false)
})

test('a quantity quote shows the platform price and margin beside the supplier rate', async (t) => {
  const quantity = {
    ...hourly, quoteMode: 4, configuredQuoteMode: 4, reviewByUnitPrice: true, unitPrice: 800,
    unitPriceWithMaterial: null, unitPriceWithoutMaterial: null,
    skus: [
      { skuId: 1, quoted: true, enabled: 1, available: true, quotePrice: null, platformPriceWithTax: 1000, staffCount: 2, serviceHours: 3 },
      { skuId: 2, quoted: true, enabled: 1, available: true, quotePrice: null, platformPriceWithTax: 1200, staffCount: 1, serviceHours: 1 },
    ],
  }
  const { state, locale } = await harness(t, quantity)
  await state.openSkus(service)
  locale.value = 'zh'
  assert.equal(state.quantityCompareLabel, '我们的单价 1000.00 – 1200.00 · 毛利率 20% – 33%')
  assert.equal(state.quantityCompareNegative, false)
  const panel = renderFragment('hourly-review__content', state)
  assert.match(panel, /我们的单价 1000\.00 – 1200\.00/)
  assert.match(panel, /毛利率 20% – 33%/)
  assert.ok(!panel.includes('人数或时长'))
})

test('a fixed quote on a unit-price service is shown as unit price and keeps specification prices', async (t) => {
  const { state, locale, translate } = await harness(t, {
    quoteMode: 1,
    configuredQuoteMode: 2,
    reviewByUnitPrice: false,
    status: 2,
    unitPrice: null,
    unitPriceWithMaterial: null,
    unitPriceWithoutMaterial: null,
    skus: [{
      skuId: 601, skuCode: 'BHC', quoted: true, enabled: 1, quotePrice: 100,
      approvedPrice: 100, platformPriceWithTax: 89.25, available: true, reviewStatus: 2,
    }],
    attaches: [],
  })
  await state.openSkus(service)
  assert.equal(state.skuQuoteMode, 2)
  assert.equal(state.hourlyQuoteReview, false)
  assert.equal(state.reviewSkuRows.length, 1)
  assert.equal(state.reviewSkuRows[0].quotePrice, 100)
  locale.value = 'zh'
  assert.equal(state.quoteModeText, translate('admin.platformSuppliers.unitPrice'))
  assert.match(renderFragment('quote-head__meta', state), /单价计费/)
  assert.doesNotMatch(renderFragment('quote-head__meta', state), /一口价/)
  const rows = clone(await state.loadServicePriceRows(service))
  assert.equal(rows[0][3], translate('admin.platformSuppliers.unitPrice'))
  assert.equal(rows[0][4], translate('admin.platformSuppliers.exportSpecItem'))
  assert.equal(rows[0][8], '100.00')
})

test('clicking a quote status opens that supplier filtered to the same status', async (t) => {
  const quotedServices = [
    { spuId: 1, spuName: 'Pending', status: 1 },
    { spuId: 2, spuName: 'Approved', status: 2 },
    { spuId: 3, spuName: 'Rejected', status: 3 },
  ]
  const { state, route } = await harness(t, hourly, {}, {
    props: { desk: 'quotes' },
    services: quotedServices,
  })
  const row = { id: 26, supplierName: 'Links', pendingCount: 2, rejectedCount: 17, effectiveCount: 3 }
  await state.openSupplierQuotes(row, 1)
  await flush()
  assert.equal(state.serviceStatusFilter, 1)
  assert.equal(route.path, '/admin/basic/quotes')
  assert.equal(route.query.id, '26')
  assert.equal(route.query.scope, 'services')
  assert.deepEqual(state.visibleServices.map((item) => item.spuId), [1])
  await state.openSupplierQuotes(row, 3)
  await flush()
  assert.equal(state.serviceStatusFilter, 3)
  assert.deepEqual(state.visibleServices.map((item) => item.spuId), [3])
  await state.openSupplierQuotes(row, 2)
  await flush()
  assert.deepEqual(state.visibleServices.map((item) => item.spuId), [2])
  await state.openReview(row)
  await flush()
  assert.equal(state.serviceStatusFilter, '')
  assert.deepEqual(state.visibleServices.map((item) => item.spuId), [1, 2, 3])
  assert.doesNotMatch(descriptor.template.content, /class-name="category-col"/)
  assert.match(descriptor.template.content, /openSupplierQuotes\(row, 1\)/)
  assert.match(descriptor.template.content, /openSupplierQuotes\(row, 3\)/)
  assert.match(descriptor.template.content, /openSupplierQuotes\(row, 2\)/)
})

test('fixed-price review still lists each specification', async (t) => {
  const { state } = await harness(t, {
    quoteMode: 1, reviewByUnitPrice: false, status: 1, unitPriceWithMaterial: null, unitPriceWithoutMaterial: null,
    skus: [{ skuId: 601, skuCode: 'FIXED', quoted: true, enabled: 1, quotePrice: 150, approvedPrice: 140, platformPriceWithTax: 200, available: true }],
    attaches: [],
  })
  await state.openSkus(service)
  assert.equal(state.hourlyQuoteReview, false)
  assert.equal(state.reviewSkuRows.length, 1)
  assert.equal(state.reviewSkuRows[0].quotePrice, 150)
  assert.equal(state.reviewSkuRows[0].approvedPrice, 140)
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
      canServe: true, quotePrice: 25, platformPrice: 30, platformPriceWithTax: 31.5,
      profitRate: 0.2063, approvedPrice: 20, approvedProfitRate: 0.3651, reviewStatus: null,
    }],
  }
  const { state, calls, locale } = await harness(t, quote)
  await state.openSkus(service)
  assert.equal(state.skuAttaches.length, 1)
  assert.equal(state.skuAttaches[0].profitRate, 0.2063)
  assert.equal(state.skuAttaches[0].approvedProfitRate, 0.3651)
  assert.equal(state.profitRateText(0.2063), '20.63%')
  assert.equal(state.profitRateText(0.25), '25%')
  assert.equal(state.profitRateText(-0.1), '-10%')
  assert.equal(state.profitRateText(null), '—')
  assert.equal(state.showQuoteFoot, true)
  assert.equal(state.isAttachSelectable(state.skuAttaches[0]), true)
  for (const language of ['en', 'zh']) {
    locale.value = language
    const text = renderFragment('sku-attaches', state)
    assert.match(text, /20\.63%/)
    assert.match(text, /36\.51%/)
    assert.match(text, /31\.50/)
  }
  const rows = clone(await state.loadServicePriceRows(service))
  const addon = rows.find((row) => row[6] === 'Oven')
  assert.equal(addon[7], '31.50')
  assert.equal(addon[8], '25.00')
  assert.equal(addon[9], '20.63%')
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

test('platform service list shows the category contact name and phones', async (t) => {
  const { state } = await harness(t, hourly, { id: '10' }, {
    services: [{
      spuId: 501,
      spuName: 'Cleaning',
      categoryId: 7,
      categoryName: 'Home',
      status: 1,
      contactName: ' Layla ',
      contactPhones: ['+971501111111', ' '],
      workerCount: 9,
    }],
    catalog: [{
      categoryId: 7,
      contactName: 'Catalog Name',
      contactPhones: ['+971500000000'],
      nameI18n: { en: 'Home Cleaning' },
      services: [{ spuId: 501, selected: true, workerCount: 4, contactPhones: ['+971522222222'] }],
    }],
  })
  assert.equal(state.services[0].contactName, 'Layla')
  assert.deepEqual(state.services[0].contactPhones, ['+971501111111', ' '])
  assert.equal(state.services[0].workerCount, 4)
  assert.match(descriptor.template.content, /admin\.platformSuppliers\.contactTitle/)
  assert.match(descriptor.template.content, /admin\.platformSuppliers\.phones/)

  const older = await harness(t, hourly, { id: '10' }, {
    services: [{ spuId: 501, spuName: 'Cleaning', categoryId: 7, categoryName: 'Home', status: 1 }],
    catalog: [{
      categoryId: 7,
      contactName: 'Noura',
      contactPhones: ['+971533333333'],
      services: [{ spuId: 501, selected: true, workerCount: 2, contactPhones: ['+971544444444'] }],
    }],
  })
  assert.equal(older.state.services[0].contactName, 'Noura')
  assert.deepEqual(older.state.services[0].contactPhones, ['+971533333333'])

  const empty = await harness(t, hourly, { id: '10' }, {
    services: [{
      spuId: 501,
      spuName: 'Cleaning',
      categoryId: 7,
      categoryName: 'Home',
      status: 1,
      contactName: '',
      contactPhones: [],
    }],
    catalog: [{
      categoryId: 7,
      contactName: 'Noura',
      contactPhones: ['+971533333333'],
      services: [],
    }],
  })
  assert.equal(empty.state.services[0].contactName, '')
  assert.deepEqual(empty.state.services[0].contactPhones, [])
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

test('service search keeps suppliers that offer every selected service', async (t) => {
  const { state, calls } = await harness(t, hourly, { id: '' }, {
    quoteRows: [
      { id: 8, supplierName: 'Match', supplierNo: 'VED8', pendingCount: 1, onboardingStatus: 2 },
      { id: 9, supplierName: 'Other', supplierNo: 'VED9', pendingCount: 0, onboardingStatus: 2 },
    ],
    products: [{ spu: { id: 501, spuName: 'Deep Cleaning' }, nameI18n: { en: 'Deep Cleaning', 'zh-CN': '深度清洁' } }],
    supplierPage: async () => ({ data: { list: [{ id: 8 }], total: 1 } }),
  })
  assert.deepEqual(calls.supplierPages, [])
  await state.searchServices('deep')
  assert.equal(calls.productPages.at(-1).nameKeyword, 'deep')
  assert.equal(calls.productPages.at(-1).shelfStatus, 1)
  assert.equal(calls.productPages.at(-1).packageService, 0)
  assert.deepEqual(clone(state.serviceOptions), [{ id: 501, name: 'Deep Cleaning' }])
  state.serviceIds = [501]
  state.rememberServiceOptions()
  await state.search()
  assert.deepEqual(clone(calls.supplierPages.at(-1).spuIds), [501])
  assert.deepEqual(clone(state.suppliers).map((row) => row.id), [8])
})

test('package services are requested separately and stay off the service list', async (t) => {
  const { state, calls } = await harness(t, hourly, { id: '38' }, {
    services: [
      { spuId: 501, spuName: 'Cleaning', categoryId: 7, categoryName: 'Home', status: 1 },
      { spuId: 900, spuName: 'Package cleaning', categoryId: 7, categoryName: 'Home', status: 1 },
    ],
    catalog: [{
      categoryId: 7,
      nameI18n: { en: 'Home' },
      services: [{ spuId: 501, selected: true, packageService: 0, workerCount: 2 }],
    }],
    packageCatalog: [{
      categoryId: 7,
      services: [
        { spuId: 501, selected: true, packageService: 0, workerCount: 2 },
        { spuId: 900, selected: true, packageService: 1, workerCount: 6 },
      ],
    }],
  })
  assert.deepEqual(calls.catalogs.map((call) => call.packageService), [false, true])
  assert.equal(calls.catalogs.every((call) => call.supplierId === 38), true)
  assert.deepEqual(state.services.map((row) => row.spuId), [501])
  assert.equal(state.services[0].workerCount, 2)
})

test('supplier list filters can return to every supplier', async (t) => {
  const { state } = await harness(t)
  state.quoteStatus = 1
  state.onboardingStatus = 2
  state.needReview = 'yes'
  state.queueFocus = 'licence'
  await state.showEverySupplier()
  assert.equal(state.quoteStatus, '')
  assert.equal(state.onboardingStatus, '')
  assert.equal(state.needReview, '')
  assert.equal(state.queueFocus, '')
  state.queueFocus = 'licence'
  state.onboardingStatus = 1
  await state.changeOnboardingStatus('all')
  assert.equal(state.onboardingStatus, '')
  assert.equal(state.queueFocus, '')
  state.queueFocus = 'priceChange'
  state.needReview = 'yes'
  await state.changeNeedReview('all')
  assert.equal(state.needReview, '')
  assert.equal(state.queueFocus, '')
  state.quoteStatus = 3
  await state.changeQuoteStatus(3)
  assert.equal(state.quoteStatus, 3)
  assert.match(descriptor.template.content, /showEverySupplier/)
  assert.match(descriptor.template.content, /admin\.platformSuppliers\.filterAll/)
  assert.match(descriptor.template.content, /quoteRejectedFilter/)
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
