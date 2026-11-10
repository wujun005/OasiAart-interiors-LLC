import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as Vue from 'vue'

// Render the real shared entry and booking-success SFCs. Only navigation and
// application boundaries are local; no orders or payments are sent to a server.
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const plain = value => JSON.parse(JSON.stringify(value))
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const load = (source, require = name => { throw new Error(`Unexpected dependency: ${name}`) }) => {
  const exports = {}
  runInNewContext(transpile(source), { exports, require })
  return exports
}
const realModule = name => load(read(`src/modules/client/utils/${name}.ts`))
const addons = realModule('order-addons')
const dates = realModule('order-date-time')
const localization = realModule('order-localization')
const listPage = realModule('order-list-page')
const richText = realModule('richText')
const messages = load(read('src/modules/client/locales/index.ts'), name => {
  assert.ok(name === './en.json' || name === './zh.json')
  return JSON.parse(read(`src/modules/client/locales/${name.slice(2)}`))
}).default

const sfc = filename => {
  const { descriptor, errors } = parse(read(filename), { filename })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: filename })
  const template = compileTemplate({ source: descriptor.template.content, filename, id: filename,
    compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  return { script, render: load(template.code, () => Vue).render }
}
const entry = sfc('src/modules/client/components/AddExtraServiceButton.vue')
const success = sfc('src/modules/client/components/BookingSuccessView.vue')
const detailFilename = 'src/modules/client/components/ClientOrderDetailView.vue'
const detailDescriptor = parse(read(detailFilename), { filename: detailFilename }).descriptor
const detailScript = compileScript(detailDescriptor, { id: 'order-addon-detail-entry' })

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
const entries = container => nodesOf(container).filter(node => node.type === 'button' && hasClass(node, 'addon-entry'))
const flush = async () => {
  for (let index = 0; index < 24; index++) await Promise.resolve()
  await Vue.nextTick()
}
const invoke = (handlers, event) => {
  for (const handler of Array.isArray(handlers) ? handlers : [handlers]) handler(event)
}

function context(query = {}) {
  const locale = Vue.ref('en')
  const route = Vue.reactive({ params: { orderNo: 'HX11' }, query })
  const pushes = []
  const router = { push: async target => { pushes.push(plain(target)) }, replace: async () => {} }
  const translate = (key, params = {}) => {
    const result = key.split('.').reduce((part, name) => part?.[name], messages[locale.value])
    assert.equal(typeof result, 'string', `Missing localized entry text: ${key}`)
    return result.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
  }
  const require = name => {
    if (name === 'vue') return Vue
    if (name === 'vue-i18n') return { useI18n: () => ({ locale, t: translate }) }
    if (name === 'vue-router') return { useRoute: () => route, useRouter: () => router }
    if (name === '@/modules/client/utils/order-date-time') return dates
    if (name === '@/modules/client/utils/order-addons') return addons
    if (name === '@/modules/client/components/AddExtraServiceButton.vue') return { __esModule: true, default: component(entry, require) }
    throw new Error(`Unexpected entry dependency: ${name}`)
  }
  return { locale, route, pushes, require }
}
function component(compiled, require) {
  return { ...load(compiled.script.content, require).default, render: compiled.render }
}
async function mount(t, compiled, props = {}, ctx = context()) {
  const reactiveProps = Vue.reactive(props)
  const container = { type: 'root', children: [] }
  const view = component(compiled, ctx.require)
  let instance
  const app = renderer.createApp({ setup: () => () => Vue.h(view, { ...reactiveProps,
    ref: value => { if (value) instance = value },
  }) })
  app.mount(container)
  t.after(() => app.unmount())
  await flush()
  return { ...ctx, container, props: reactiveProps, state: instance.$.setupState }
}

test('shared extra-service entry renders localized title, explanation and action, and forwards the original click event', async t => {
  const clicks = []
  const { container, locale, props } = await mount(t, entry, { compact: true, onClick: event => clicks.push(event) })
  assert.equal(entries(container).length, 1)
  const button = entries(container)[0]
  for (const value of ['Add extra services', 'A little more, for this visit.', 'Choose extras']) {
    assert.ok(textOf(button).includes(value))
  }
  assert.equal(button.props.type, 'button')
  assert.equal(button.props.disabled, false)
  const click = new Event('click', { bubbles: true })
  invoke(button.props.onClick, click)
  assert.equal(clicks.length, 1)
  assert.equal(clicks[0], click, 'The parent must receive the same event so .stop can block card navigation')
  locale.value = 'zh'
  await flush()
  for (const value of ['追加服务', '为这次服务，再加一点', '去挑选']) {
    assert.ok(textOf(entries(container)[0]).includes(value))
  }
  props.disabled = true
  await flush()
  assert.equal(entries(container)[0].props.disabled, true)
})

test('entry stops Enter and Space propagation without blocking unrelated keys or emitting a second click', async t => {
  const clicks = []
  const { container } = await mount(t, entry, { onClick: event => clicks.push(event) })
  const button = entries(container)[0]
  for (const [callback, type] of [['onKeydown', 'keydown'], ['onKeyup', 'keyup']]) {
    for (const key of ['Enter', ' ']) {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'key', { value: key })
      invoke(button.props[callback], event)
      assert.equal(event.cancelBubble, true, `${type} ${JSON.stringify(key)} must not open the enclosing order card`)
      assert.equal(event.defaultPrevented, false, 'Native button keyboard activation must remain available')
    }
    const ordinary = new Event(type, { bubbles: true })
    Object.defineProperty(ordinary, 'key', { value: 'a' })
    invoke(button.props[callback], ordinary)
    assert.equal(ordinary.cancelBubble, false)
  }
  assert.deepEqual(clicks, [])
})

for (const mobile of [false, true]) {
  test(`${mobile ? 'H5' : 'web'} booking success renders one prominent entry and keeps both order references when navigating`, async t => {
    const ctx = context({ kind: 'booking', orderId: '11', orderNo: 'HX11', amount: '105.00', service: 'Cleaning' })
    const { container, pushes } = await mount(t, success, { mobile }, ctx)
    assert.equal(entries(container).length, 1)
    assert.equal(entries(container)[0].parent.type, 'section', 'The callout is separate from the ordinary action buttons')
    invoke(entries(container)[0].props.onClick, new Event('click'))
    assert.deepEqual(pushes, [{ name: mobile ? 'h5-order-addons' : 'order-addons', query: { orderId: '11', orderNo: 'HX11' } }])
  })
}

test('success entry accepts either single reference and reacts when the current order reference changes', async t => {
  const ctx = context({ orderNo: 'HX11' })
  const { container, route, pushes } = await mount(t, success, {}, ctx)
  assert.equal(entries(container).length, 1)
  invoke(entries(container)[0].props.onClick, new Event('click'))
  assert.deepEqual(pushes.at(-1), { name: 'order-addons', query: { orderNo: 'HX11' } })
  route.query = { orderId: ['22'] }
  await flush()
  invoke(entries(container)[0].props.onClick, new Event('click'))
  assert.deepEqual(pushes.at(-1), { name: 'order-addons', query: { orderId: '22' } })
})

test('success hides extra-service entry for packages, missing references, and any multiple-order reference', async t => {
  const { container, route, pushes, state } = await mount(t, success)
  const ineligibleQueries = [
    {}, { orderId: '' }, { orderNo: ' ' },
    { kind: 'package', orderId: '11', orderNo: 'HX11' },
    { orderId: '11,12' }, { orderNo: 'HX11,HX12' },
    { orderId: ['11', '12'] }, { orderNo: ['HX11', 'HX12'] },
    { orderId: '11,12', orderNo: 'HX11' },
    { orderId: '11', orderNo: 'HX11,HX12' },
  ]
  for (const query of ineligibleQueries) {
    route.query = query
    await flush()
    assert.equal(entries(container).length, 0, `Unexpected extra-service entry for ${JSON.stringify(query)}`)
    state.goAddExtra()
  }
  assert.deepEqual(pushes, [], 'The route guard also blocks stale or programmatic CTA callbacks')
})

async function detailHarness(t, mobile) {
  const ctx = context()
  const api = {
    getClientOrderDetail: async () => ({ orderId: 11, orderNo: 'HX11', orderType: 1, orderStatus: 1,
      paymentStatus: 1, spuId: 8, email: 'customer@example.test', reviewed: true }),
  }
  const require = name => {
    if (name === '@/modules/client/api') return api
    if (name === '@/modules/client/composables/useCart') return { useCart: () => ({ cartCount: Vue.ref(0), refreshCart: async () => {} }) }
    if (name === '@/modules/client/utils/order-localization') return localization
    if (name === '@/modules/client/utils/order-list-page') return listPage
    if (name === '@/modules/client/utils/richText') return richText
    if (name === '@/modules/client/utils/package-booking-times') return { loadPackageBookingTimes: async () => [] }
    if (name === 'element-plus') return { ElMessage: { error() {}, warning() {}, success() {} } }
    if (name.startsWith('element-plus/es/locale/') || name.endsWith('.png') || name.endsWith('.vue')) return {}
    return ctx.require(name)
  }
  const view = load(detailScript.content, require).default
  const app = renderer.createApp({ ...view, render: () => null }, { mobile })
  const instance = app.mount({ type: 'root', children: [] })
  t.after(() => app.unmount())
  await flush()
  return { ...ctx, state: instance.$.setupState }
}

for (const mobile of [false, true]) {
  test(`${mobile ? 'H5' : 'web'} detail keeps the standalone entry route and removes the duplicate secondary action`, async t => {
    const { state, pushes } = await detailHarness(t, mobile)
    assert.equal(state.canAddExtra, true)
    assert.deepEqual(plain(state.visibleActions.map(action => action.key)), ['manage-booking'])
    state.runAction('add-addons')
    assert.deepEqual(pushes.at(-1), { name: mobile ? 'h5-order-addons' : 'order-addons', query: { orderId: '11', orderNo: 'HX11' } })
    state.order = { ...state.order, canAddAttach: false }
    await flush()
    assert.equal(state.canAddExtra, false, 'The server can explicitly disable extras on a paid order')
    state.order = { ...state.order, orderStatus: 6, canAddAttach: undefined }
    await flush()
    assert.equal(state.canAddExtra, true)
    assert.deepEqual(plain(state.visibleActions), [], 'An add-ons-only order must not retain an empty footer action')
    state.order = { ...state.order, orderType: 2, packageId: 9 }
    await flush()
    assert.equal(state.canAddExtra, false)
    state.order = { ...state.order, orderType: 1, packageId: undefined, orderStatus: 3 }
    await flush()
    assert.equal(state.canAddExtra, false)
  })
}
