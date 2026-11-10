import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileScript, compileStyle, compileTemplate, parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as Vue from 'vue'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const plain = value => JSON.parse(JSON.stringify(value))
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const load = (source, require = name => { throw new Error(`Unexpected dependency ${name}`) }, extra = {}) => {
  const exports = {}
  runInNewContext(transpile(source), { exports, require, ...extra })
  return exports
}
const helpers = Object.fromEntries(['order-addons', 'order-localization', 'order-date-time'].map(name => [
  `@/modules/client/utils/${name}`, load(read(`src/modules/client/utils/${name}.ts`)),
]))
const messages = load(read('src/modules/client/locales/index.ts'), name => JSON.parse(read(`src/modules/client/locales/${name.slice(2)}`))).default
const filename = 'src/modules/client/components/OrderAddonView.vue'
const { descriptor, errors } = parse(read(filename), { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: 'order-addon-menu-test' })
const template = compileTemplate({ source: descriptor.template.content, filename, id: 'order-addon-menu-test', compilerOptions: { bindingMetadata: script.bindings } })
assert.deepEqual(template.errors, [])
for (const style of descriptor.styles) assert.deepEqual(compileStyle({ source: style.content, filename, id: 'order-addon-menu-test', scoped: style.scoped, preprocessLang: style.lang }).errors, [])
// The custom renderer has no DOM input event target; search is driven through
// the real setup ref while Vue's browser-only text-input binding is stubbed.
const render = load(template.code, () => ({ ...Vue, vModelText: {} })).render
const flush = async () => {
  for (let index = 0; index < 24; index++) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve
  const promise = new Promise(yes => { resolve = yes })
  return { promise, resolve }
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
  createElement: type => ({ type, props: {}, children: [] }), createText: text => ({ type: '#text', text }), createComment: () => ({ type: '#comment' }),
  insert, remove, setText: (node, text) => { node.text = text }, setElementText: (node, text) => { node.text = text; node.children = [] },
  patchProp: (node, key, _previous, next) => { node.props[key] = next }, parentNode: node => node.parent,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  insertStaticContent(content, parent, anchor) {
    const node = { type: '#static', text: content.replace(/<[^>]+>/g, '') }
    insert(node, parent, anchor)
    return [node, node]
  },
})
const nodesOf = node => [node, ...(node.children || []).flatMap(nodesOf)]
const textOf = node => `${node.text || ''} ${(node.children || []).map(textOf).join(' ')}`.replace(/\s+/g, ' ').trim()
const byClass = (node, name) => nodesOf(node).filter(item => Vue.normalizeClass(item.props?.class).split(/\s+/).includes(name))
const cards = container => byClass(container, 'order-addons__option')
const buttons = container => nodesOf(container).filter(node => node.type === 'button')
const option = (id, label, price, group = 1, groupName = 'Extra care') => ({
  attachValueId: id, attachTypeId: group, attachTypeNameI18n: { en: groupName, zh: groupName === 'Cleaning' ? '清洁' : '加购护理' },
  attachValueNameI18n: { en: label, zh: `中文${label}` }, unitI18n: { en: 'session', zh: '次' }, unitPriceWithoutTax: price,
})
const order = () => ({
  orderId: 11, orderNo: 'HX11', orderType: 1, orderStatus: 1, paymentStatus: 1, canAddAttach: true,
  spuId: 8, spuNameI18n: { en: 'Home service', zh: '上门服务' }, orderAmount: 999,
  serviceDateTime: '2026-11-20 09:00-12:00', attachModuleTitle: 'Extras for your visit',
  availableAttaches: [option(8, 'Extra care', 60), option(9, 'Long care', 110), option(10, 'Window detail', .1, 2, 'Cleaning'), option(11, 'Complimentary item', 0, 2, 'Cleaning'), option(99, 'Invalid price', null)],
  attachSelections: [{ attachValueId: 7, attachValueNameI18n: { en: 'Already purchased', zh: '已购项目' }, quantity: 1, amountWithTax: 21, unitPriceWithTax: 21, source: 'INITIAL' }],
})

async function harness(t, extras = {}) {
  const calls = { details: [], catalog: [], products: [], payments: [], messages: [], pushes: [], replaces: [], timers: [], canceledTimers: [] }
  const controls = { order: order(), payment: async () => ({ clientSecret: 'pi_test_secret', customerSessionClientSecret: 'css_test' }), ...extras }
  const route = Vue.reactive({ query: extras.query || { orderId: '11', orderNo: 'HX11' } })
  const locale = Vue.ref('en')
  const document = { body: { style: { overflow: '' } }, activeElement: null }
  const api = {
    getClientOrderDetail: async no => { calls.details.push(no); return controls.detail ? controls.detail(no) : plain(controls.order) },
    getClientOrderDetailById: async id => { calls.details.push(id); return controls.detail ? controls.detail(id) : plain(controls.order) },
    listOrderAddonAttaches: async id => { calls.catalog.push(id); return [] },
    getProductDetail: async id => { calls.products.push(id); return {} },
    createOrderAddonPayment: async payload => { calls.payments.push(plain(payload)); return controls.payment(payload) },
  }
  const view = load(script.content, name => {
    if (name === 'vue') return Vue
    if (name === 'vue-i18n') return { useI18n: () => ({ locale, t: (key, params = {}) => {
      const result = key.split('.').reduce((current, part) => current?.[part], messages[locale.value])
      assert.equal(typeof result, 'string', `Missing translation ${key}`)
      return result.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''))
    } }) }
    if (name === 'vue-router') return { useRoute: () => route, useRouter: () => ({ push: async to => calls.pushes.push(plain(to)), replace: async to => calls.replaces.push(plain(to)) }) }
    if (name === 'element-plus') return { ElMessage: Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => calls.messages.push({ type, text })])) }
    if (name === '@/modules/client/api') return api
    if (name === '@/modules/client/components/StripePaymentModal.vue') return { __esModule: true, default: { props: ['visible'], render: () => null } }
    if (helpers[name]) return helpers[name]
    throw new Error(`Unexpected component dependency ${name}`)
  }, { document, window: {
    setTimeout: fn => { calls.timers.push(fn); return calls.timers.length },
    clearTimeout: id => calls.canceledTimers.push(id),
  }, console }).default
  const container = { type: 'root', children: [] }
  const app = renderer.createApp({ ...view, render }, { mobile: !!extras.mobile })
  const instance = app.mount(container)
  let mounted = true
  const unmount = () => { if (mounted) { app.unmount(); mounted = false } }
  t.after(unmount)
  await flush()
  return { state: instance.$.setupState, calls, controls, route, locale, container, document, unmount }
}

test('actual category and search filters keep the basket while the menu shows only valid server prices', async t => {
  const { state, container, locale } = await harness(t)
  assert.equal(cards(container).length, 4)
  assert.doesNotMatch(cards(container).map(textOf).join(' '), /Invalid price/)
  assert.match(textOf(cards(container)[0]), /AED 63\.00.*Incl\. 5% VAT/)
  const history = nodesOf(container).find(node => node.type === 'details')
  assert.ok(history)
  assert.equal(history.props.open, undefined, 'Purchased history starts collapsed')
  byClass(cards(container)[0], 'order-addons__add')[0].props.onClick()
  assert.equal(state.selectedCount, 1)
  buttons(container).find(button => textOf(button) === 'Cleaning').props.onClick()
  await flush()
  assert.equal(cards(container).length, 2)
  assert.equal(state.selectedLines[0].id, '8')
  state.search = 'window'
  await flush()
  assert.equal(cards(container).length, 1)
  assert.match(textOf(cards(container)[0]), /Window detail/)
  state.search = 'no match'
  await flush()
  assert.equal(cards(container).length, 0)
  assert.match(textOf(container), /No extras match/)
  state.clearFilters()
  await flush()
  assert.equal(cards(container).length, 4)
  assert.equal(state.selectedCount, 1)
  locale.value = 'zh'
  await flush()
  assert.match(textOf(container), /为这次服务，再加一点/)
  assert.match(textOf(container), /含 5% VAT/)
  assert.equal(state.selectedLines[0].id, '8')
})

test('inclusive unit labels and line-level VAT rounding charge only newly selected extras', async t => {
  const { state, calls } = await harness(t)
  assert.equal(state.canPay, false)
  state.changeQty('10', 3)
  assert.equal(state.priceText({ price: .1, unit: 'session' }), 'AED 0.11 / session')
  assert.deepEqual(plain(state.totals), { without: .3, tax: .02, withTax: .32 })
  assert.equal(state.selectedLines[0].withTax, .32)
  await state.startPayment()
  assert.deepEqual(calls.payments, [{ orderId: '11', paymentMethod: 'stripe', attachItems: [{ attachValueId: '10', quantity: 3 }] }])
  assert.equal(state.stripeVisible, true)
  assert.equal(state.totals.withTax, .32, 'The original order and purchased history are not charged again')
})

test('mobile review is a named modal with a closed-state inert basket and preserves choices when dismissed', async t => {
  const { state, container, document } = await harness(t, { mobile: true })
  let panel = byClass(container, 'order-addons__basket')[0]
  assert.equal(panel.props.role, 'dialog')
  assert.equal(panel.props['aria-hidden'], true)
  assert.equal(panel.props.inert, true)
  assert.equal(byClass(container, 'order-addons__mobile-basket')[0].children.at(-1).props.disabled, true)
  state.changeQty('8', 1)
  state.openReview()
  await flush()
  panel = byClass(container, 'order-addons__basket')[0]
  assert.equal(panel.props['aria-modal'], true)
  assert.equal(panel.props.inert, false)
  assert.equal(panel.props['aria-label'], 'This addition')
  assert.equal(byClass(container, 'order-addons__main')[0].props.inert, true)
  assert.equal(document.body.style.overflow, 'hidden')
  state.closeReview()
  await flush()
  assert.equal(document.body.style.overflow, '')
  assert.equal(state.selectedCount, 1)
  state.removeLine('8')
  state.changeQty('11', 1)
  assert.equal(state.selectedCount, 1, 'A configured zero-price extra remains selectable')
  assert.equal(state.canPay, false, 'A zero-only basket cannot start an invalid payment')
  state.changeQty('unknown', 1)
  assert.equal(state.quantities.unknown, undefined)
})

test('payment locks edits, closes the review modal, and cancellation restores the same basket', async t => {
  const pending = deferred()
  const { state, container, calls } = await harness(t, { mobile: true, payment: () => pending.promise })
  state.changeQty('8', 1)
  state.openReview()
  const payment = state.startPayment()
  await flush()
  assert.equal(state.editingLocked, true)
  assert.equal(byClass(container, 'order-addons__stepper')[0].children[0].props.disabled, true)
  state.changeQty('8', 1)
  state.removeLine('8')
  assert.equal(state.quantities['8'], 1)
  pending.resolve({ clientSecret: 'pi_current_secret' })
  await payment
  await flush()
  assert.equal(state.stripeVisible, true)
  assert.equal(state.reviewOpen, false, 'Only the Stripe modal remains active')
  assert.notEqual(byClass(container, 'order-addons__basket')[0].props['aria-modal'], true)
  state.changeQty('8', 1)
  assert.equal(state.quantities['8'], 1)
  state.handleStripeClose()
  await flush()
  assert.equal(state.stripeVisible, false)
  assert.equal(state.reviewOpen, true)
  assert.equal(state.selectedCount, 1)
  assert.equal(state.canPay, true)
  assert.equal(calls.payments.length, 1)
})

test('a failed payment keeps the selection available for an explicit retry', async t => {
  const { state, controls, calls } = await harness(t, { payment: async () => { throw new Error('Payment unavailable') } })
  state.changeQty('8', 1)
  await state.startPayment()
  assert.equal(state.stripeVisible, false)
  assert.equal(state.quantities['8'], 1)
  assert.equal(state.canPay, true)
  assert.equal(calls.messages.at(-1).text, 'Payment unavailable')
  controls.payment = async () => ({ clientSecret: 'pi_retry_secret' })
  await state.startPayment()
  assert.equal(calls.payments.length, 2)
  assert.equal(state.stripeVisible, true)
})

test('authoritative empty catalogs and eligibility flags remain authoritative, and ambiguous routes never load an order', async t => {
  const empty = order(); empty.availableAttaches = []
  const first = await harness(t, { order: empty })
  assert.equal(first.state.groups.length, 0)
  assert.deepEqual(first.calls.catalog, [])
  assert.deepEqual(first.calls.products, [])
  assert.equal(byClass(first.container, 'order-addons__basket').length, 0)
  const blocked = await harness(t, { order: { ...order(), canAddAttach: false } })
  assert.equal(blocked.state.gate, 'blocked')
  assert.equal(cards(blocked.container).length, 0)
  const ambiguous = await harness(t, { query: { orderId: '11,22', orderNo: 'HX11' } })
  assert.equal(ambiguous.state.gate, 'missing')
  assert.deepEqual(ambiguous.calls.details, [])
})

for (const pendingField of ['orderStatus', 'paymentStatus']) {
  test(`explicitly blocked ${pendingField}=0 keeps checkout blocked but offers a synchronization retry`, async t => {
    const { state, calls, controls, container } = await harness(t, { order: { ...order(), canAddAttach: false, [pendingField]: 0 } })
    assert.equal(state.gate, 'blocked', 'The explicit backend flag remains authoritative')
    assert.equal(cards(container).length, 0)
    assert.deepEqual(calls.catalog, [])
    assert.match(textOf(container), /Payment is still syncing/)
    await state.startPayment()
    assert.deepEqual(calls.payments, [])
    controls.order = order()
    await buttons(container).find(button => textOf(button) === 'Try again').props.onClick()
    await flush()
    assert.equal(state.gate, 'allowed')
    assert.equal(cards(container).length, 4)
    assert.equal(calls.details.length, 2)
  })
}

for (const action of ['route change', 'unmount']) {
  test(`an old payment response cannot open Stripe after ${action}`, async t => {
    const pending = deferred()
    const { state, route, unmount, calls } = await harness(t, {
      payment: () => pending.promise,
      detail: async no => ({ ...order(), ...(no === 'HX22' ? { orderId: 22, orderNo: 'HX22' } : {}) }),
    })
    state.changeQty('8', 1)
    const payment = state.startPayment()
    if (action === 'unmount') unmount()
    else {
      route.query = { orderId: '22', orderNo: 'HX22' }
      await flush()
      assert.equal(state.order.orderId, 22)
      assert.deepEqual(plain(state.quantities), {})
    }
    pending.resolve({ clientSecret: 'pi_old_order_secret' })
    await payment
    await flush()
    assert.equal(state.stripeVisible, false)
    assert.equal(state.stripeClientSecret, '')
    assert.deepEqual(calls.messages, [])
    assert.equal(calls.payments[0].orderId, '11')
  })
}

test('back and successful payment keep the web/H5 order reference and destination', async t => {
  for (const mobile of [false, true]) {
    const { state, calls } = await harness(t, { mobile })
    state.goBack()
    assert.deepEqual(calls.pushes.at(-1), { name: mobile ? 'h5-order-detail' : 'order-detail', params: { orderNo: 'HX11' } })
    state.changeQty('8', 1)
    await state.startPayment()
    state.handlePaid()
    assert.equal(state.stripeVisible, false)
    calls.timers.at(-1)()
    assert.deepEqual(calls.replaces.at(-1), { name: mobile ? 'h5-order-detail' : 'order-detail', params: { orderNo: 'HX11' } })
  }
})

test('payment completion keeps the basket locked until navigation and cannot trigger a duplicate checkout', async t => {
  const { state, calls } = await harness(t, { mobile: true })
  state.changeQty('8', 1)
  await state.startPayment()
  state.handlePaid()
  assert.equal(state.paymentCompleted, true)
  assert.equal(state.editingLocked, true)
  assert.equal(state.canPay, false)
  state.changeQty('8', 1)
  state.removeLine('8')
  state.handleStripeClose()
  state.openReview()
  state.handlePaid()
  await state.startPayment()
  assert.equal(state.quantities['8'], 1)
  assert.equal(state.reviewOpen, false)
  assert.equal(calls.payments.length, 1)
  assert.equal(calls.timers.length, 1)
  calls.timers[0]()
  assert.deepEqual(calls.replaces, [{ name: 'h5-order-detail', params: { orderNo: 'HX11' } }])
})

for (const action of ['route change', 'unmount']) {
  test(`a paid redirect is canceled and cannot navigate the previous receipt after ${action}`, async t => {
    const { state, route, unmount, calls } = await harness(t, {
      detail: async no => ({ ...order(), ...(no === 'HX22' ? { orderId: 22, orderNo: 'HX22' } : {}) }),
    })
    state.changeQty('8', 1)
    await state.startPayment()
    state.handlePaid()
    const oldRedirect = calls.timers[0]
    if (action === 'unmount') unmount()
    else {
      route.query = { orderId: '22', orderNo: 'HX22' }
      await flush()
      assert.equal(state.order.orderId, 22)
      assert.equal(state.paymentCompleted, false)
      assert.equal(state.editingLocked, false)
    }
    assert.deepEqual(calls.canceledTimers, [1])
    oldRedirect()
    assert.deepEqual(calls.replaces, [], 'A queued callback must also reject its old order context')
  })
}
