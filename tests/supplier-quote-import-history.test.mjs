import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as Vue from 'vue'

// Render the real history component with local read-only API boundaries.
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const clone = (value) => JSON.parse(JSON.stringify(value))
const moduleExports = (path) => {
  const exports = {}
  runInNewContext(transpile(read(path)), { exports })
  return exports
}
const i18n = moduleExports('src/modules/admin/utils/i18n.ts')
const messages = Object.fromEntries(['en', 'zh'].map((language) => [language,
  moduleExports(`src/modules/admin/locales/${language}.ts`).default,
]))
const filename = 'src/modules/admin/components/SupplierQuoteImportHistory.vue'
const { descriptor, errors } = parse(read(filename), { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: 'supplier-quote-history-test' })
const template = compileTemplate({ source: descriptor.template.content, filename, id: 'supplier-quote-history-test',
  compilerOptions: { bindingMetadata: script.bindings } })
assert.deepEqual(template.errors, [])
const templateExports = {}
runInNewContext(transpile(template.code), { exports: templateExports, require: () => Vue })
const flush = async () => {
  for (let index = 0; index < 24; index++) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const log = (id, overrides = {}) => ({
  id, supplierId: 10, supplierNo: 'SUP10', supplierName: 'Supplier A', operatorId: 90, operatorName: 'Operator',
  operatorType: 'ADMIN', importBy: 'PLATFORM', fileName: 'quotes.xlsx', fileUrl: '',
  serviceCount: 2, skuCount: 8, skippedCount: 0, messages: [], error: '', operateTime: '2026-10-25 12:34:56',
  ...overrides,
})
const allNodes = (node) => [node, ...(node.children || []).flatMap(allNodes)]
const textOf = (node) => `${node.text || ''}${(node.children || []).map(textOf).join(' ')}`
const hasClass = (node, className) => String(node.props?.class || '').split(/\s+/).includes(className)
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
  createElement: (type) => ({ type, props: {}, children: [] }),
  createText: (text) => ({ type: '#text', text }),
  createComment: () => ({ type: '#comment' }),
  insert: insertNode,
  remove: removeNode,
  setText: (node, text) => { node.text = text },
  setElementText(node, text) { node.text = text; node.children = [] },
  patchProp: (node, key, _before, after) => { node.props[key] = after },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  insertStaticContent(content, parent, anchor) {
    const node = { type: '#static', text: content.replace(/<[^>]+>/g, '') }
    insertNode(node, parent, anchor)
    return [node, node]
  },
})

async function harness(t, overrides = {}) {
  const calls = { reads: [], emitted: [], renderErrors: [] }
  const control = { load: overrides.load || (async () => []) }
  const props = Vue.reactive({ modelValue: false, supplierId: 10, supplierName: 'Supplier A', ...overrides.props })
  const locale = Vue.ref('en')
  const translate = (key, params = {}) => {
    const value = key.split('.').reduce((node, part) => node?.[part], messages[locale.value])
    assert.equal(typeof value, 'string', `Missing translation: ${key}`)
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
  }
  const exports = {}
  runInNewContext(transpile(script.content), { exports, URL,
    require: (name) => {
      if (name === 'vue') return Vue
      if (name === 'vue-i18n') return { useI18n: () => ({ t: translate, locale }) }
      if (name === '@/modules/admin/utils/i18n') return i18n
      if (name === '@/modules/admin/api/supplierWorkbench') return {
        listPlatformQuoteImports: async (supplierId) => { calls.reads.push(supplierId); return control.load(supplierId) },
      }
      throw new Error(`Unexpected history dependency: ${name}`)
    },
  })
  const component = { ...exports.default, render: templateExports.render }
  let instance
  const app = renderer.createApp({ setup: () => () => Vue.h(component, { ...props,
    ref: (value) => { if (value) instance = value },
    'onUpdate:modelValue': (value) => { calls.emitted.push(value); props.modelValue = value },
  }) })
  app.component('ElDialog', { props: ['modelValue'], setup: (dialog, { slots }) => () =>
    dialog.modelValue ? Vue.h('section', slots.default?.()) : null })
  app.component('ElButton', { setup: (_button, { slots }) => () => Vue.h('button', slots.default?.()) })
  app.component('ElEmpty', { props: ['description'], setup: (empty) => () => Vue.h('p', { 'data-empty': true }, empty.description) })
  app.component('ElPagination', { render: () => Vue.h('nav') })
  app.config.warnHandler = () => {}
  app.config.errorHandler = (error) => calls.renderErrors.push(error)
  const container = { children: [] }
  app.mount(container)
  let disposed = false
  const unmount = () => { if (!disposed) { app.unmount(); disposed = true } }
  t.after(unmount)
  await flush()
  return { state: instance.$.setupState, props, locale, control, calls, container, translate, unmount }
}

test('history is lazy, paginates locally and reloads only when explicitly reopened', async (t) => {
  const { state, props, calls, container } = await harness(t, { load: async () =>
    Array.from({ length: 23 }, (_, index) => log(index + 1)) })
  assert.deepEqual(calls.reads, [])
  props.modelValue = true
  await flush()
  assert.deepEqual(calls.reads, [10])
  assert.equal(state.records.length, 23)
  assert.equal(allNodes(container).filter((node) => hasClass(node, 'quote-history__card')).length, 10)
  state.page = 3
  await flush()
  assert.equal(state.pagedRows.length, 3)
  assert.equal(allNodes(container).filter((node) => hasClass(node, 'quote-history__card')).length, 3)
  assert.deepEqual(calls.reads, [10])
  state.dialogVisible = false
  await flush()
  assert.deepEqual(calls.emitted, [false])
  assert.equal(state.records.length, 0)
  props.modelValue = true
  await flush()
  assert.equal(state.page, 1)
  assert.deepEqual(calls.reads, [10, 10])
  assert.deepEqual(calls.renderErrors, [])
})

test('switching suppliers clears old rows and rejects stale results or another supplier’s returned rows', async (t) => {
  const first = deferred(), second = deferred()
  const { state, props, calls, container } = await harness(t, { props: { modelValue: true },
    load: (supplierId) => supplierId === 10 ? first.promise : second.promise })
  props.supplierId = 20
  props.supplierName = 'Supplier B'
  await flush()
  assert.equal(state.loading, true)
  assert.equal(state.records.length, 0)
  second.resolve([log(2, { supplierId: 20, operatorName: 'Current operator' }), log(3, { operatorName: 'LEAKED OPERATOR' })])
  await flush()
  assert.deepEqual(clone(state.records.map((record) => record.id)), [2])
  first.resolve([log(1, { operatorName: 'STALE OPERATOR' })])
  await flush()
  assert.deepEqual(clone(state.records.map((record) => record.id)), [2])
  assert.doesNotMatch(textOf(container), /LEAKED OPERATOR|STALE OPERATOR/)
  assert.deepEqual(calls.reads, [10, 20])
})

test('closing or unmounting invalidates pending reads without restoring hidden records', async (t) => {
  for (const action of ['close', 'unmount']) {
    const gate = deferred()
    const { state, calls, unmount } = await harness(t, { props: { modelValue: true }, load: () => gate.promise })
    if (action === 'close') state.dialogVisible = false
    else unmount()
    gate.resolve([log(1)])
    await flush()
    assert.equal(state.records.length, 0, action)
    assert.equal(state.loading, false, action)
    assert.equal(state.error, '', action)
    if (action === 'close') assert.deepEqual(calls.emitted, [false])
  }
})

test('load failures are distinct from an empty history and retry recovers with plain error text', async (t) => {
  const rawError = '<img src=x onerror=alert(1)> unavailable'
  const { state, control, container, calls } = await harness(t, { props: { modelValue: true },
    load: async () => { throw new Error(rawError) } })
  assert.equal(state.error, rawError)
  assert.ok(allNodes(container).some((node) => node.props?.role === 'alert'))
  assert.ok(textOf(container).includes(rawError))
  assert.equal(allNodes(container).some((node) => node.type === 'img'), false)
  assert.equal(allNodes(container).some((node) => node.props?.['data-empty']), false)
  control.load = async () => []
  await state.loadRecords()
  await flush()
  assert.equal(state.error, '')
  assert.ok(allNodes(container).some((node) => node.props?.['data-empty']))
  control.load = async () => [log(1)]
  await state.loadRecords()
  await flush()
  assert.equal(state.records.length, 1)
  assert.deepEqual(calls.reads, [10, 10, 10])
  assert.deepEqual(calls.renderErrors, [])
})

test('history preserves Dubai timestamps, zero counts, import source and multilingual plain-text details', async (t) => {
  const warning = '<b>Skipped row 5</b>'
  const { state, locale, calls, container, translate } = await harness(t, { props: { modelValue: true }, load: async () => [
    log(1, { importBy: 'SUPPLIER', operatorType: 'ADMIN', importByI18n: { en: 'Supplier import', 'zh-CN': '供应商导入' },
      serviceCount: 0, skuCount: 0, skippedCount: 0, messages: [warning],
      contentI18n: { en: '<p>Import details</p>', 'zh-CN': '<p>导入明细</p>' } }),
    log(2, { error: '<script>failed</script>', messages: [] }),
  ] })
  assert.deepEqual(clone(state.historyRows[0].counts), { services: '0', skus: '0', skipped: '0' })
  assert.equal(state.historyRows[0].operateTime, '2026-10-25 12:34:56')
  assert.equal(state.historyRows[0].sourceLabel, 'Supplier import')
  assert.equal(state.historyRows[0].operatorLabel, 'Operator · #90')
  assert.equal(state.historyRows[0].statusTone, 'warning')
  assert.equal(state.historyRows[1].statusTone, 'failed')
  assert.equal(state.historyRows[1].sourceLabel, translate('admin.platformSuppliers.quoteHistory.platform'))
  assert.ok(textOf(container).includes(warning))
  assert.ok(textOf(container).includes('<script>failed</script>'))
  locale.value = 'zh'
  await flush()
  assert.equal(state.historyRows[0].sourceLabel, '供应商导入')
  assert.ok(textOf(container).includes('<p>导入明细</p>'))
  assert.equal(allNodes(container).some((node) => node.type === 'script' || node.props?.innerHTML), false)
  assert.deepEqual(calls.reads, [10])
})

test('only HTTP(S) snapshot URLs produce download links and absent or unsafe snapshots stay unlinked', async (t) => {
  const urls = ['https://example.com/quotes.xlsx', 'http://example.com/old.xlsx', '', 'javascript:alert(1)',
    'data:text/plain,secret', '//example.com/relative.xlsx', 'https://user:pass@example.com/quotes.xlsx']
  const { state, container } = await harness(t, { props: { modelValue: true },
    load: async () => urls.map((fileUrl, index) => log(index + 1, { fileUrl })) })
  assert.deepEqual(clone(state.historyRows.map((row) => row.fileUrl)), [urls[0], urls[1], '', '', '', '', ''])
  const links = allNodes(container).filter((node) => node.type === 'a')
  assert.deepEqual(links.map((node) => node.props.href), urls.slice(0, 2))
  assert.ok(links.every((node) => node.props.target === '_blank' && node.props.rel.includes('noopener')))
})

test('the real history API uses only supplier identity and distinguishes valid lists from failed or malformed responses', async () => {
  const calls = []
  let response
  let transportError
  const exports = {}
  runInNewContext(transpile(read('src/modules/admin/api/supplierWorkbench.ts')), { exports, require: (name) => {
    assert.equal(name, '@/modules/admin/utils/request')
    return { __esModule: true, default: { get: async (...args) => {
      calls.push(clone(args))
      if (transportError) throw transportError
      return response
    } } }
  } })
  for (const valid of [[log(1)], { data: [log(2)] }, { code: 200, data: [] }]) {
    response = valid
    assert.deepEqual(clone(await exports.listPlatformQuoteImports(10)), Array.isArray(valid) ? valid : valid.data)
  }
  assert.deepEqual(calls, Array.from({ length: 3 }, () => ['/api/platform/supplierQuote/quotes/imports', { params: { supplierId: 10 } }]))
  for (const invalid of [null, {}, { data: {} }, { code: 500, message: 'Denied', data: [] },
    { success: false, message: 'Denied', data: [] }, { data: [null] }, { data: [5] }, { data: [[]] }]) {
    response = invalid
    await assert.rejects(exports.listPlatformQuoteImports(10), `Expected rejection for ${JSON.stringify(invalid)}`)
  }
  const previousCalls = calls.length
  for (const invalidId of [0, -1, NaN, '10']) await assert.rejects(exports.listPlatformQuoteImports(invalidId))
  assert.equal(calls.length, previousCalls)
  transportError = new Error('Network unavailable')
  await assert.rejects(exports.listPlatformQuoteImports(10), /Network unavailable/)
})
