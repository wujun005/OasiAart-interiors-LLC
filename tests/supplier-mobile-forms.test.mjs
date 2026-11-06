import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import ts from 'typescript'
import * as Vue from 'vue'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const utility = path => {
  const exports = {}
  runInNewContext(transpile(read(path)), { exports, Intl, Date })
  return exports
}
const messages = utility('src/modules/admin/locales/en.ts').default
const translate = (key, params = {}) => {
  const value = key.split('.').reduce((entry, part) => entry?.[part], messages)
  assert.equal(typeof value, 'string', `Missing translation: ${key}`)
  return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
}
const modules = Object.fromEntries(['staffBoard', 'availabilityScope', 'supplierReviewState'].map(name => [
  `@/modules/admin/utils/${name}`, utility(`src/modules/admin/utils/${name}.ts`),
]))
const compile = name => {
  const filename = `src/modules/admin/pages/supplier-management/${name}.vue`
  const { descriptor, errors } = parse(read(filename), { filename })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: `mobile-${name}` })
  const template = compileTemplate({ source: descriptor.template.content, filename, id: `mobile-${name}`, compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  return { script: transpile(script.content), template: transpile(template.code) }
}
const compiled = { staff: compile('staff-board'), availability: compile('availability') }
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); await Vue.nextTick() }
const renderer = Vue.createRenderer({
  createElement: tag => ({ tag, props: {}, children: [], parent: null, text: '' }),
  createText: text => ({ tag: '#text', text, children: [] }),
  createComment: text => ({ tag: '#comment', text, children: [] }),
  insert(node, parent, anchor) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
    node.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
  },
  remove(node) { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1) },
  setText(node, text) { node.text = text },
  setElementText(node, text) { node.text = text; node.children = [] },
  patchProp(node, key, previous, value) { node.props[key] = value },
  parentNode: node => node.parent,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
})
const findAll = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...(node.children || []).flatMap(child => findAll(child, predicate)),
]
const byClass = name => node => String(node.props?.class || '').split(' ').includes(name)
const textOf = node => `${node.text || ''}${(node.children || []).map(textOf).join('')}`
const plain = value => JSON.parse(JSON.stringify(value))
const rows = [
  { id: 1, adminUserId: 81, name: 'Alex Chen', phone: '971501234567', email: '', jobStatus: 'idle', todayJobCount: 2, acceptJobs: true, services: [{ categoryId: 7, categoryName: 'Cleaning' }] },
  { id: 2, adminUserId: 82, name: 'Taylor', phone: '971501234568', email: '', jobStatus: 'serving', todayJobCount: 1, suspended: true, services: [{ categoryId: 8, categoryName: 'Repairs' }] },
]

async function harness(t, mode, props = {}) {
  const calls = { routes: [], patches: [], saves: [], notices: [] }
  const api = {
    supplierStaffPage: async () => ({ data: { list: rows } }),
    serviceCatalog: async () => ({ data: [{ categoryId: 7, categoryName: 'Cleaning' }, { categoryId: 8, categoryName: 'Repairs' }] }),
    updateSupplierStaffState: async payload => calls.patches.push(plain(payload)),
    supplierEventSave: async payload => calls.saves.push(plain(payload)),
    supplierEventDelete: async () => {},
  }
  const exports = {}
  const vue = { ...Vue, vModelText: {}, vModelSelect: {}, vModelCheckbox: {} }
  const require = name => {
    if (name === 'vue') return vue
    if (name === 'vue-i18n') return { useI18n: () => ({ t: translate, locale: Vue.ref('en') }) }
    if (name === 'vue-router') return { useRouter: () => ({ push: route => calls.routes.push(plain(route)) }) }
    if (name === 'element-plus') return { ElMessage: Object.fromEntries(['error', 'success', 'warning'].map(type => [type, message => calls.notices.push({ type, message })])), ElMessageBox: { confirm: async () => {} } }
    if (name === '@element-plus/icons-vue') return {}
    if (name === '@/modules/admin/api/supplierWorkbench') return api
    if (name === '@/modules/admin/stores/session') return { useAdminSessionStore: () => ({ supplierEvents: async () => ({ list: [], total: 0 }) }) }
    if (modules[name]) return modules[name]
    throw new Error(`Unexpected dependency: ${name}`)
  }
  runInNewContext(compiled[mode].script, { exports, require, Date, Intl })
  const rendered = {}
  runInNewContext(compiled[mode].template, { exports: rendered, require })
  const component = { ...exports.default, render: rendered.render }
  const app = renderer.createApp(component, { mobile: true, enabled: true, acceptDispatch: true, dispatchSaving: false, canToggle: true, reviewStatus: 2, ...props })
  app.config.warnHandler = () => {}
  app.directive('loading', {})
  app.component('el-dialog', { props: ['modelValue'], setup: (dialog, { slots }) => () => dialog.modelValue ? Vue.h('section', slots.default?.().concat(slots.footer?.() || [])) : null })
  const host = { children: [] }
  const instance = app.mount(host)
  t.after(() => app.unmount())
  await flush()
  return { state: instance.$.setupState, calls, host }
}

test('mobile staff cards retain selection, editing and the staff-scoped H5 order link', async t => {
  const { state, calls, host } = await harness(t, 'staff')
  assert.equal(findAll(host, node => node.tag === 'table').length, 0)
  const cards = findAll(host, byClass('staff-mobile-card'))
  assert.equal(cards.length, 2)
  const checkbox = findAll(cards[0], node => node.tag === 'input')[0]
  checkbox.props.onChange()
  await flush()
  assert.deepEqual(plain(state.selected), [1])
  const actions = findAll(cards[0], byClass('staff-mobile-card__actions'))[0]
  const buttons = findAll(actions, node => node.tag === 'button')
  buttons[0].props.onClick()
  assert.deepEqual(calls.routes, [{ path: '/admin/supplier-management/h5/orders', query: { staff: '81' } }])
  buttons[1].props.onClick()
  await flush()
  assert.equal(state.dialogOpen, true)
  assert.equal(state.form.name, 'Alex Chen')
  assert.deepEqual(plain(state.form.categoryIds), [7])
})

test('mobile select-all and account filters keep bulk actions scoped to the selected staff', async t => {
  const { state, calls, host } = await harness(t, 'staff')
  findAll(findAll(host, byClass('staff-mobile-select-all'))[0], node => node.tag === 'input')[0].props.onChange()
  await flush()
  assert.deepEqual(plain(state.selected), [1, 2])
  await state.suspendMany()
  assert.deepEqual(calls.patches, [{ id: 1, suspended: true }])
  state.accountFilter = 'suspended'
  await flush()
  assert.deepEqual(plain(state.pageRows.map(row => row.id)), [2])
  assert.deepEqual(plain(state.selected), [])
})

test('desktop employee order links retain their original route', async t => {
  const { state, calls } = await harness(t, 'staff', { mobile: false })
  state.viewJobs(state.pageRows[0])
  assert.deepEqual(calls.routes, [{ path: '/admin/supplier-management/orders', query: { staff: '81' } }])
})

test('mobile native date and time fields submit the existing validated blocked-time contract', async t => {
  const { state, calls, host } = await harness(t, 'availability')
  state.openBlock()
  await flush()
  const dates = findAll(host, node => node.tag === 'input' && node.props.type === 'date')
  const times = findAll(host, node => node.tag === 'input' && node.props.type === 'time')
  assert.equal(dates.length, 2)
  assert.equal(times.length, 2)
  dates[0].props['onUpdate:modelValue']('2026-11-01')
  dates[1].props['onUpdate:modelValue']('2026-11-01')
  times[0].props['onUpdate:modelValue']('09:00')
  times[1].props['onUpdate:modelValue']('11:00')
  state.toggleWeekday(7)
  state.blockForm.reason = 'Holiday'
  await state.saveBlock()
  assert.deepEqual(calls.saves, [{ startDate: '2026-11-01', endDate: '2026-11-01', fullDay: 0, startTime: '09:00', endTime: '11:00', weekdays: [7], spuIds: [], areaIds: [], reason: 'Holiday' }])
  assert.equal(state.blockOpen, false)
})

test('mobile blocked-time inputs cannot bypass invalid date or time validation', async t => {
  const { state, calls } = await harness(t, 'availability')
  state.openBlock()
  state.blockForm.dates = ['2026-11-02', '2026-11-01']
  state.blockForm.weekdays = [1]
  state.blockForm.startTime = '12:00'
  state.blockForm.endTime = '10:00'
  await state.saveBlock()
  assert.equal(calls.saves.length, 0)
  assert.equal(calls.notices.at(-1).message, translate('admin.supplierAvailability.dateInvalid'))
  state.blockForm.dates = ['2026-11-02', '2026-11-02']
  await state.saveBlock()
  assert.equal(calls.saves.length, 0)
  assert.equal(calls.notices.at(-1).message, translate('admin.supplierAvailability.timeInvalid'))
})
