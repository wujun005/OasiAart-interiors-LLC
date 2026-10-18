import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import {
  compileScript,
  compileStyle,
  compileTemplate,
  parse,
} from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"

// Compile and execute the real staff order SFC. Only network/UI boundaries are mocked;
// no real order mutation or file upload can leave this process.
const root = new URL("../", import.meta.url)
const filename = "src/modules/admin/pages/supplier-management/orders-h5.vue"
const read = (path) => readFileSync(new URL(path, root), "utf8")
const source = read(filename)
const { descriptor, errors } = parse(source, { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: "supplier-staff-orders-h5-test" })
const transpile = (content) =>
  ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
const code = transpile(script.content)
const template = compileTemplate({
  source: descriptor.template.content,
  filename,
  id: "supplier-staff-orders-h5-test",
  compilerOptions: { bindingMetadata: script.bindings },
})
const styles = descriptor.styles.map((style, index) =>
  compileStyle({
    source: style.content,
    filename,
    id: `data-v-supplier-staff-orders-h5-test-${index}`,
    scoped: style.scoped,
    preprocessLang: style.lang,
  }),
)

const loadModule = (path, context = {}) => {
  const exports = {}
  runInNewContext(transpile(read(path)), { exports, ...context })
  return exports
}
const i18n = loadModule("src/modules/admin/utils/i18n.ts")
const supplierMap = loadModule("src/modules/admin/utils/supplierMap.ts", { URL })
const messages = Object.fromEntries(
  ["en", "zh"].map((language) => [
    language,
    loadModule(`src/modules/admin/locales/${language}.ts`).default,
  ]),
)
const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let index = 0; index < 24; index += 1) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const renderer = Vue.createRenderer({
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  insert() {},
  remove() {},
  setText() {},
  setElementText() {},
  patchProp() {},
  parentNode: () => null,
  nextSibling: () => null,
})

const orderRow = (overrides = {}) => ({
  orderId: 101,
  fulfillmentId: 201,
  orderNo: "TEST-101",
  orderStatus: 1,
  serviceStatus: 0,
  supplierStage: "NEW",
  spuName: "Home cleaning",
  serviceDate: "2026-10-20",
  serviceTime: "09:00-11:00",
  serviceAddress: "Test Street",
  ...overrides,
})
const imageFile = (name, type, size = 1024) => ({ name, type, size })
const fileEvent = (files) => ({ target: { files, value: "selected" } })

async function harness(t, overrides = {}) {
  const calls = {
    lists: [],
    details: [],
    accepts: [],
    departs: [],
    arrives: [],
    completes: [],
    uploads: [],
    confirmations: [],
    messages: [],
  }
  const locale = Vue.ref("en")
  const translate = (key, params = {}) => {
    const value = key
      .split(".")
      .reduce((node, part) => node?.[part], messages[locale.value])
    assert.equal(typeof value, "string", `Missing translation: ${key}`)
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""))
  }
  const controls = {
    list:
      overrides.list ||
      (async () => ({ data: { list: [], total: 0 } })),
    detail:
      overrides.detail ||
      (async (orderId, fulfillmentId) => ({
        data: orderRow({ orderId, fulfillmentId }),
      })),
    accept: overrides.accept || (async () => ({ data: true })),
    depart: overrides.depart || (async () => ({ data: true })),
    arrive: overrides.arrive || (async () => ({ data: true })),
    complete: overrides.complete || (async () => ({ data: true })),
    upload:
      overrides.upload ||
      (async (file) => ({ data: { url: `https://files.test/${file.name}` } })),
    confirm: overrides.confirm || (async () => true),
  }
  const api = {
    supplierAssignedOrders: async (payload) => {
      calls.lists.push(clone(payload))
      return controls.list(payload)
    },
    supplierAssignedOrderDetail: async (orderId, fulfillmentId) => {
      calls.details.push({ orderId, fulfillmentId })
      return controls.detail(orderId, fulfillmentId)
    },
    supplierAccept: async (payload) => {
      calls.accepts.push(clone(payload))
      return controls.accept(payload)
    },
    supplierDepart: async (payload) => {
      calls.departs.push(clone(payload))
      return controls.depart(payload)
    },
    supplierArrive: async (payload) => {
      calls.arrives.push(clone(payload))
      return controls.arrive(payload)
    },
    supplierComplete: async (payload) => {
      calls.completes.push(clone(payload))
      return controls.complete(payload)
    },
    uploadFile: async (file) => {
      calls.uploads.push({ name: file.name, type: file.type, size: file.size })
      return controls.upload(file)
    },
  }
  const exports = {}
  runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "vue-i18n")
        return { useI18n: () => ({ t: translate, locale }) }
      if (name === "element-plus")
        return {
          ElMessage: Object.fromEntries(
            ["warning", "success", "error", "info"].map((type) => [
              type,
              (message) => calls.messages.push({ type, message }),
            ]),
          ),
          ElMessageBox: {
            confirm: async (...args) => {
              calls.confirmations.push(clone(args))
              return controls.confirm(...args)
            },
          },
        }
      if (name === "@/modules/admin/api/supplierWorkbench") return api
      if (name === "@/modules/admin/utils/i18n") return i18n
      if (name === "@/modules/admin/utils/supplierMap") return supplierMap
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null })
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  assert.deepEqual(calls.messages, [])
  calls.lists.length = 0
  return { state: instance.$.setupState, calls, controls, locale }
}

test("the real H5 SFC template, scoped styles and guarded action layout compile together", () => {
  assert.deepEqual(template.errors, [])
  assert.ok(descriptor.styles.length > 0)
  assert.ok(descriptor.styles.every((style) => style.scoped))
  for (const style of styles) assert.deepEqual(style.errors, [])
  assert.equal(script.bindings.loadOrders, "setup-const")
  assert.equal(script.bindings.openDetail, "setup-const")
  assert.equal(script.bindings.submitAction, "setup-const")
  assert.match(
    descriptor.template.content,
    /v-else-if="detailFailed \|\| !detailReady"[\s\S]*@click="retryDetail"[\s\S]*<template v-else>/,
  )
  assert.match(
    descriptor.template.content,
    /<footer class="staff-detail__foot"[^>]*>[\s\S]*canAct\(order, 0\)[\s\S]*canAct\(order, 4\)[\s\S]*canAct\(order, 3\)[\s\S]*canAct\(order, 1\)/,
  )
  const css = descriptor.styles.map((style) => style.content).join("\n")
  assert.match(css, /\.staff-detail__foot\s*\{[^}]*position:\s*fixed/)
  assert.match(css, /\.staff-detail\s*\{[^}]*safe-area-inset-bottom/)
  assert.match(css, /@media\s*\(max-width:\s*720px\)[\s\S]*\.staff-detail__foot\s*\{[^}]*safe-area-inset-bottom/)
})

test("only the latest list and detail responses may update visible state", async (t) => {
  const { state, calls, controls } = await harness(t)
  const oldList = deferred()
  const freshList = deferred()
  controls.list = ({ pageNum }) => (pageNum === 2 ? oldList.promise : freshList.promise)
  state.page = 2
  const oldLoad = state.loadOrders()
  state.page = 3
  const freshLoad = state.loadOrders()
  freshList.resolve({ data: { list: [orderRow({ orderId: 303 })], total: 31 } })
  await freshLoad
  assert.deepEqual(clone(state.orders.map((row) => row.orderId)), [303])
  assert.equal(state.total, 31)
  assert.equal(state.loading, false)
  oldList.reject(new Error("stale list failed"))
  await oldLoad
  assert.deepEqual(clone(state.orders.map((row) => row.orderId)), [303])
  assert.equal(state.failed, false)
  assert.deepEqual(calls.messages, [])

  const oldDetail = deferred()
  const freshDetail = deferred()
  controls.detail = (orderId) => (orderId === 401 ? oldDetail.promise : freshDetail.promise)
  const first = state.openDetail(orderRow({ orderId: 401, fulfillmentId: 41 }))
  const second = state.openDetail(orderRow({ orderId: 402, fulfillmentId: 42 }))
  freshDetail.resolve({
    data: orderRow({ orderId: 402, fulfillmentId: undefined, orderNo: "FRESH" }),
  })
  await second
  assert.equal(state.order.orderNo, "FRESH")
  assert.equal(state.order.fulfillmentId, 42, "detail keeps the requested visit id")
  assert.equal(state.detailLoading, false)
  oldDetail.resolve({ data: orderRow({ orderId: 401, orderNo: "STALE" }) })
  await first
  assert.equal(state.order.orderNo, "FRESH")
  assert.equal(state.detailFailed, false)
})

test("a failed detail is non-actionable and retry is the only way back", async (t) => {
  const { state, calls, controls } = await harness(t)
  const row = orderRow({ orderId: 501, fulfillmentId: 51 })
  controls.detail = async () => {
    throw new Error("detail unavailable")
  }
  await state.openDetail(row)
  assert.equal(state.detailOpen, true)
  assert.equal(state.detailFailed, true)
  assert.equal(state.detailReady, false)
  assert.equal(state.order, null)
  assert.equal(state.canAct(row, 0), false)

  await state.accept(row)
  await state.depart({ ...row, serviceStatus: 4 })
  state.openAction({ ...row, serviceStatus: 3 }, "arrive")
  Object.assign(state.action, {
    open: true,
    orderId: 501,
    fulfillmentId: 51,
    mode: "arrive",
  })
  await state.submitAction()
  assert.equal(calls.confirmations.length, 0)
  assert.deepEqual(calls.accepts, [])
  assert.deepEqual(calls.departs, [])
  assert.deepEqual(calls.arrives, [])
  assert.deepEqual(calls.completes, [])

  controls.detail = async () => ({ data: row })
  await state.retryDetail()
  assert.equal(state.detailFailed, false)
  assert.equal(state.detailReady, true)
  assert.equal(state.order.orderId, 501)
  assert.equal(state.canAct(state.order, 0), true)
})

test("cancellation wins over labels and all service states map deliberately", async (t) => {
  const { state, locale } = await harness(t)
  const misleading = {
    supplierStage: "NEW",
    supplierStageI18n: { en: "New request", zh: "新订单" },
  }
  for (const cancellation of [
    { orderStatus: 3 },
    { orderStatus: 4 },
    { orderStatus: 5 },
    { scheduleStatus: 2 },
    { supplierStage: "cancelled" },
  ]) {
    const row = { ...misleading, orderStatus: 1, ...cancellation }
    assert.equal(state.cancelled(row), true)
    assert.equal(state.statusText(row), "Cancelled")
    assert.equal(state.statusClass(row), "is-danger")
  }
  assert.equal(state.cancelled({ orderStatus: 1, scheduleStatus: 1 }), false)

  const steps = [
    [0, "Not started"],
    [4, "Accepted"],
    [3, "Departed for service"],
    [1, "Arrived and started"],
    [2, "Service completed"],
  ]
  for (const [serviceStatus, label] of steps) {
    const row = { orderStatus: 1, serviceStatus }
    assert.equal(state.step(row), serviceStatus)
    assert.equal(state.statusText(row), label)
  }
  for (const serviceStatus of [undefined, null, "", -1, 5, 1.5, "unknown"])
    assert.equal(state.step({ serviceStatus }), -1)

  locale.value = "zh"
  await flush()
  assert.equal(state.statusText({ orderStatus: 5 }), "已取消")
})

test("composite service addresses do not repeat exact parts or swallow a distinct door", async (t) => {
  const { state } = await harness(t)
  assert.equal(
    state.placeText({
      serviceAddress: "Villa 12, Marina Gate, Dubai Marina",
      building: "Marina Gate",
      roomNo: "Villa 120",
      community: "Dubai Marina",
    }),
    "Villa 12, Marina Gate, Dubai Marina, Villa 120",
  )
})

test("only positive safe integer order and fulfilment ids reach APIs", async (t) => {
  const { state, calls, controls } = await harness(t)
  assert.deepEqual(
    clone(state.idsOf({ orderId: "42", fulfillmentId: "7" })),
    { orderId: 42, fulfillmentId: 7 },
  )
  assert.deepEqual(
    clone(state.idsOf({ orderId: 42, fulfillmentId: 7.5 })),
    { orderId: 42, fulfillmentId: 0 },
  )
  assert.equal(state.validIds(state.idsOf({ orderId: 42, fulfillmentId: 7.5 })), false)
  for (const orderId of [undefined, null, "", 0, -1, 1.5, Infinity, "invalid"]) {
    const ids = state.idsOf({ orderId, fulfillmentId: 8 })
    assert.ok(!ids || !ids.orderId, `invalid order id ${String(orderId)}`)
  }

  for (const orderId of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "invalid"]) {
    await state.openDetail(orderRow({ orderId }))
    await state.accept(orderRow({ orderId }))
  }
  assert.deepEqual(calls.details, [])
  assert.deepEqual(calls.confirmations, [])
  assert.deepEqual(calls.accepts, [])

  const row = orderRow({ orderId: "52", fulfillmentId: undefined })
  controls.detail = async () => ({ data: row })
  await state.openDetail(row)
  assert.equal(state.detailReady, true)
  assert.deepEqual(clone(state.idsOf(state.order)), { orderId: 52 })
  assert.equal(state.canAct(state.order, 0), true)
  await state.accept(state.order)
  assert.deepEqual(calls.accepts, [{ orderId: 52 }])
})

test("the shared action lock prevents duplicate confirmation and writes", async (t) => {
  const { state, calls, controls } = await harness(t)
  const row = orderRow({ orderId: 601, fulfillmentId: 61, serviceStatus: 0 })
  controls.detail = async () => ({ data: row })
  await state.openDetail(row)

  const confirmation = deferred()
  const acceptance = deferred()
  controls.confirm = () => confirmation.promise
  controls.accept = () => acceptance.promise
  const firstAccept = state.accept(state.order)
  const duplicateAccept = state.accept(state.order)
  await flush()
  assert.equal(state.actionBusy, true)
  assert.equal(calls.confirmations.length, 1)
  assert.equal(calls.accepts.length, 0)
  confirmation.resolve(true)
  await flush()
  assert.equal(calls.accepts.length, 1)
  assert.deepEqual(calls.accepts[0], { orderId: 601, fulfillmentId: 61 })
  acceptance.resolve({ data: true })
  await Promise.all([firstAccept, duplicateAccept])
  assert.equal(state.actionBusy, false)

  const arrivalRow = orderRow({
    orderId: 602,
    fulfillmentId: 62,
    serviceStatus: 3,
    supplierStage: "IN_PROGRESS",
  })
  controls.detail = async () => ({ data: arrivalRow })
  await state.openDetail(arrivalRow)
  state.openAction(state.order, "arrive")
  assert.equal(state.action.open, true)
  const arrival = deferred()
  controls.arrive = () => arrival.promise
  const firstSubmit = state.submitAction()
  const duplicateSubmit = state.submitAction()
  await flush()
  assert.equal(state.action.saving, true)
  assert.equal(state.actionBusy, true)
  assert.equal(calls.arrives.length, 1)
  arrival.resolve({ data: true })
  await Promise.all([firstSubmit, duplicateSubmit])
  assert.equal(calls.arrives.length, 1)
  assert.equal(calls.completes.length, 0)
  assert.equal(state.actionBusy, false)
})

test("photo validation and action sessions prevent unsafe or stale uploads", async (t) => {
  const { state, calls, controls } = await harness(t)
  const row = orderRow({
    orderId: 701,
    fulfillmentId: 71,
    serviceStatus: 3,
    supplierStage: "IN_PROGRESS",
  })
  controls.detail = async () => ({ data: row })
  await state.openDetail(row)
  state.openAction(state.order, "arrive")
  assert.equal(state.action.open, true)

  await state.addPhotos(
    fileEvent([
      imageFile("not-an-image.pdf", "application/pdf"),
      imageFile("too-large.jpg", "image/jpeg", 10 * 1024 * 1024 + 1),
    ]),
  )
  assert.deepEqual(calls.uploads, [])
  assert.deepEqual(clone(state.action.photos), [])
  assert.ok(calls.messages.some((message) => message.type === "warning"))

  const lateUpload = deferred()
  controls.upload = () => lateUpload.promise
  const pending = state.addPhotos(
    fileEvent([imageFile("late.webp", "image/webp")]),
  )
  await flush()
  assert.equal(state.action.uploading, true)
  state.closeAction()
  assert.equal(state.action.open, true, "the visible cancel control is locked during upload")
  state.action.open = false
  await flush()
  lateUpload.resolve({ data: { url: "https://files.test/late.webp" } })
  await pending
  assert.equal(state.action.open, false)
  assert.equal(state.action.uploading, false)
  assert.deepEqual(clone(state.action.photos), [])

  state.openAction(state.order, "arrive")
  controls.upload = async (file) => ({ data: { url: `https://files.test/${file.name}` } })
  calls.uploads.length = 0
  await state.addPhotos(
    fileEvent([
      imageFile("one.jpg", "image/jpeg"),
      imageFile("two.png", "image/png"),
      imageFile("three.webp", "image/webp"),
      imageFile("four.gif", "image/gif"),
    ]),
  )
  assert.deepEqual(
    clone(calls.uploads.map((file) => file.name)),
    ["one.jpg", "two.png", "three.webp", "four.gif"],
  )
  assert.equal(state.action.photos.length, 4)

  state.action.photos = Array.from({ length: 19 }, (_, index) => ({
    name: `existing-${index}.jpg`,
    url: `https://files.test/existing-${index}.jpg`,
  }))
  calls.uploads.length = 0
  await state.addPhotos(
    fileEvent([
      imageFile("twentieth.jpg", "image/jpeg"),
      imageFile("overflow.jpg", "image/jpeg"),
    ]),
  )
  assert.deepEqual(clone(calls.uploads.map((file) => file.name)), ["twentieth.jpg"])
  assert.equal(state.action.photos.length, 20)
  state.removePhoto(19)
  assert.equal(state.action.photos.length, 19)
})

test("pagination rejects stale, busy and out-of-range navigation", async (t) => {
  const { state, calls, controls } = await harness(t)
  state.total = 21
  state.page = 1
  assert.equal(state.pageCount, 3)
  state.changePage(0)
  state.changePage(4)
  assert.equal(state.page, 1)
  assert.deepEqual(calls.lists, [])

  state.loading = true
  state.changePage(2)
  assert.equal(state.page, 1)
  assert.deepEqual(calls.lists, [])
  state.loading = false

  controls.list = async () => ({ data: { list: [orderRow()], total: 21 } })
  await state.changePage(2)
  await flush()
  assert.equal(state.page, 2)
  assert.deepEqual(calls.lists, [
    { pageNum: 2, pageSize: 10 },
  ])

  calls.lists.length = 0
  state.page = 3
  controls.list = async ({ pageNum }) => ({
    data: {
      list: pageNum === 2 ? [orderRow({ orderId: 202 })] : [],
      total: 11,
    },
  })
  await state.loadOrders()
  assert.equal(state.page, 2, "a shrunken result set returns to its last real page")
  assert.deepEqual(calls.lists, [
    { pageNum: 3, pageSize: 10 },
    { pageNum: 2, pageSize: 10 },
  ])
  assert.deepEqual(clone(state.orders.map((row) => row.orderId)), [202])
})
