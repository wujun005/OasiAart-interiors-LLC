import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as Vue from 'vue'
import * as compare from '../src/modules/admin/utils/supplierQuoteCompare.ts'
import * as i18n from '../src/modules/admin/utils/i18n.ts'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const filename = 'src/modules/admin/components/QuoteComparePriceChart.vue'
const { descriptor, errors } = parse(read(filename), { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: 'quote-compare-price-chart-test' })
const template = compileTemplate({ source: descriptor.template.content, filename, id: 'quote-compare-price-chart-test',
  compilerOptions: { bindingMetadata: script.bindings } })
assert.deepEqual(template.errors, [])
const rendered = {}
runInNewContext(transpile(template.code), { exports: rendered, require: () => Vue })
const messages = Object.fromEntries(['en', 'zh'].map(language => {
  const module = {}
  runInNewContext(transpile(read(`src/modules/admin/locales/${language}.ts`)), { exports: module })
  return [language, module.default]
}))
const plain = value => JSON.parse(JSON.stringify(value))
const flush = async () => {
  await Vue.nextTick()
  await Vue.nextTick()
}
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const remove = node => {
  const siblings = node.parent?.children
  const index = siblings?.indexOf(node) ?? -1
  if (index >= 0) siblings.splice(index, 1)
  node.parent = null
}
const insert = (node, parent, anchor) => {
  if (node.parent) remove(node)
  const children = parent.children ||= []
  const index = anchor ? children.indexOf(anchor) : -1
  children.splice(index < 0 ? children.length : index, 0, node)
  node.parent = parent
}
const renderer = Vue.createRenderer({
  createElement: type => ({ type, props: {}, children: [] }),
  createText: text => ({ type: '#text', text }), createComment: () => ({ type: '#comment' }),
  insert, remove,
  setText: (node, text) => { node.text = text },
  setElementText: (node, text) => { node.text = text; node.children = [] },
  patchProp: (node, key, _previous, next) => { node.props[key] = next },
  parentNode: node => node.parent,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  insertStaticContent(content, parent, anchor) {
    const node = { type: '#static', text: content.replace(/<[^>]+>/g, '') }
    insert(node, parent, anchor)
    return [node, node]
  },
})
const nodesOf = node => [node, ...(node.children || []).flatMap(nodesOf)]
const textOf = node => `${node.text || ''} ${(node.children || []).map(textOf).join(' ')}`.replace(/\s+/g, ' ').trim()
const hasClass = (node, name) => Vue.normalizeClass(node.props?.class).split(/\s+/).includes(name)
const byClass = (node, name) => nodesOf(node).filter(item => hasClass(item, name))
const chartRows = node => byClass(node, 'compare-chart__row')
const rowOf = (node, id) => chartRows(node).find(row => row.props['data-supplier-id'] === id)
const buttons = node => nodesOf(node).filter(item => item.type === 'button')
const metricValues = node => byClass(node, 'compare-chart__metrics').flatMap(group => nodesOf(group).filter(item => item.type === 'b').map(textOf))

const cell = (quotePrice, status = 2, quoteMode = 1, profitRate = 0.75) => ({
  quotePrice, status, quoteMode, profitRate, versionNo: 1, best: false,
  statusI18n: status === 1 ? { en: 'Pending review', zh: '待审核' } : { en: 'Approved', zh: '已通过' },
})
const fixture = () => ({
  skus: [
    { key: 'a', skuId: 101, skuCode: '001', spuId: 10, spuName: 'Villa cleaning', platformPrice: 100,
      cells: { 11: cell(150, 2, 1, -0.5), 22: cell(0, 1, 2, 1), 33: cell(25), 66: cell(0) },
      excludedSupplierIds: [55], lowestPrice: 0, highestPrice: 150, spread: 150, lowestSupplierIds: [22, 66] },
    { key: 'b', skuId: 202, skuCode: '002', spuId: 10, spuName: 'Villa cleaning', platformPrice: 1000,
      cells: { 11: cell(950), 22: cell(400, 1, 2) }, excludedSupplierIds: [],
      lowestPrice: 400, highestPrice: 950, spread: 550, lowestSupplierIds: [22] },
  ],
  suppliers: [
    { id: 11, name: 'High quote company', no: 'VED11' },
    { id: 22, name: 'Zero quote company', no: 'VED22' },
    { id: 33, name: 'Standard quote company', no: 'VED33' },
    { id: 44, name: 'Missing quote company', no: 'VED44' },
    { id: 55, name: 'Filtered quote company', no: 'VED55' },
    { id: 66, name: 'Another zero quote company', no: 'VED66' },
  ],
  labels: { a: 'Unfurnished · 2 BHK', b: 'Furnished · 5 BHK' },
  grouped: true,
})

async function harness(t, input = fixture()) {
  const props = Vue.reactive({ ...input })
  const locale = Vue.ref('en')
  const exports = {}
  runInNewContext(transpile(script.content), { exports, require: name => {
    if (name === 'vue') return Vue
    if (name === 'vue-i18n') return { useI18n: () => ({ locale, t: key => {
      const message = key.split('.').reduce((current, part) => current?.[part], messages[locale.value])
      assert.equal(typeof message, 'string', `Missing translation ${key}`)
      return message
    } }) }
    if (name === '@/modules/admin/utils/i18n') return i18n
    if (name === '@/modules/admin/utils/supplierQuoteCompare') return compare
    throw new Error(`Unexpected chart dependency: ${name}`)
  } })
  const component = { ...exports.default, render: rendered.render }
  const container = { type: 'root', children: [] }
  const app = renderer.createApp({ setup: () => () => Vue.h(component, { ...props }) })
  app.mount(container)
  t.after(() => app.unmount())
  await flush()
  return { props, locale, container }
}

test('chart compares one chosen SKU, sorts suppliers and shows zero prices and lowest ties', async t => {
  const input = freeze(fixture())
  const snapshot = plain(input)
  const { container } = await harness(t, input)
  assert.equal(buttons(container)[0].props['aria-pressed'], true)
  assert.equal(textOf(nodesOf(container).find(node => node.type === 'h3')), 'Unfurnished · 2 BHK')
  assert.deepEqual(chartRows(container).map(row => row.props['data-supplier-id']), [22, 66, 33, 11, 44, 55])
  assert.deepEqual(metricValues(container), ['100.00', '0.00', '150.00'])
  assert.match(textOf(buttons(container)[0]), /0\.00\s*–\s*150\.00/)
  assert.equal(byClass(rowOf(container, 22), 'compare-chart__bar')[0].props.style.width, '0%')
  assert.equal(byClass(rowOf(container, 22), 'compare-chart__zero').length, 1)
  assert.equal(hasClass(rowOf(container, 22), 'is-lowest'), true)
  assert.equal(hasClass(rowOf(container, 66), 'is-lowest'), true)
  assert.equal(hasClass(rowOf(container, 11), 'is-above'), true)
  assert.equal(byClass(rowOf(container, 11), 'compare-chart__bar')[0].props.style.width, '100%')
  const reference = parseFloat(byClass(rowOf(container, 11), 'compare-chart__reference')[0].props.style.left)
  assert.ok(Math.abs(reference - 100 / 150 * 100) < 0.001)
  assert.match(textOf(rowOf(container, 11)), /Above customer price/)
  assert.match(textOf(rowOf(container, 22)), /Pending review.*Unit price.*100%/)

  buttons(container)[1].props.onClick()
  await flush()
  assert.equal(buttons(container)[0].props['aria-pressed'], false)
  assert.equal(buttons(container)[1].props['aria-pressed'], true)
  assert.equal(textOf(nodesOf(container).find(node => node.type === 'h3')), 'Furnished · 5 BHK')
  assert.deepEqual(metricValues(container), ['1000.00', '400.00', '550.00'])
  assert.deepEqual(chartRows(container).map(row => row.props['data-supplier-id']), [22, 11, 33, 44, 55, 66])
  assert.equal(byClass(rowOf(container, 11), 'compare-chart__bar')[0].props.style.width, '95%')
  assert.deepEqual(plain(input), snapshot, 'Selecting and sorting must never change input SKU or supplier records')
})

test('chart clearly separates filtered prices from missing quotes and localizes review labels', async t => {
  const { container, locale } = await harness(t)
  assert.match(textOf(rowOf(container, 44)), /No quote to compare/)
  assert.match(textOf(rowOf(container, 55)), /Outside filters/)
  assert.equal(byClass(rowOf(container, 44), 'compare-chart__bar').length, 0)
  assert.equal(byClass(rowOf(container, 55), 'compare-chart__bar').length, 0)
  locale.value = 'zh'
  await flush()
  assert.match(textOf(rowOf(container, 22)), /待审核/)
  assert.match(textOf(rowOf(container, 11)), /已通过/)
})

test('selection survives refresh and reordering, and falls back when the chosen SKU is removed', async t => {
  const { props, container } = await harness(t)
  buttons(container)[1].props.onClick()
  await flush()
  props.skus = [...fixture().skus].reverse()
  await flush()
  assert.equal(buttons(container)[0].props['aria-pressed'], true)
  assert.equal(textOf(nodesOf(container).find(node => node.type === 'h3')), 'Furnished · 5 BHK')
  props.skus = fixture().skus.slice(0, 1)
  await flush()
  assert.equal(buttons(container)[0].props['aria-pressed'], true)
  assert.equal(textOf(nodesOf(container).find(node => node.type === 'h3')), 'Unfurnished · 2 BHK')
  props.skus = []
  await flush()
  assert.equal(chartRows(container).length, 0)
  assert.match(textOf(container), /No options to display/)
  props.skus = fixture().skus
  await flush()
  assert.equal(buttons(container)[0].props['aria-pressed'], true)
})

test('an all-zero single quote remains visible with a zero customer reference and finite scale', async t => {
  const source = fixture()
  source.skus = [{ ...source.skus[0], platformPrice: 0, cells: { 11: cell(0, 1) },
    excludedSupplierIds: [], lowestPrice: 0, highestPrice: 0, spread: null, lowestSupplierIds: [11] }]
  source.suppliers = source.suppliers.slice(0, 1)
  const { container, props } = await harness(t, source)
  assert.deepEqual(metricValues(container), ['0.00', '0.00', '—'])
  assert.match(textOf(byClass(container, 'compare-chart__metrics')[0]), /One quote/)
  assert.equal(byClass(container, 'compare-chart__bar')[0].props.style.width, '0%')
  assert.equal(byClass(container, 'compare-chart__reference')[0].props.style.left, '0%')
  assert.match(textOf(byClass(container, 'compare-chart__scale')[0]), /0\.00 AED/)
  assert.doesNotMatch(textOf(container), /NaN|Infinity/)
  props.skus = [{ ...source.skus[0], platformPrice: null, cells: { 11: cell(null) }, lowestPrice: null, highestPrice: null }]
  await flush()
  assert.deepEqual(metricValues(container), ['—', '—', '—'])
  assert.equal(byClass(container, 'compare-chart__reference').length, 0)
  assert.equal(byClass(container, 'compare-chart__bar').length, 0)
  assert.match(textOf(rowOf(container, 11)), /No quote to compare/)
})
