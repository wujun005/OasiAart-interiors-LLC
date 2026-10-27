import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import {
  parse,
  compileScript,
  compileStyle,
  compileTemplate,
} from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"
import { baseParse } from "@vue/compiler-dom"

// 编译实际订单组件与翻译，只模拟接口边界，不访问真实订单或供应商。
const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")
const source = read("src/modules/admin/pages/orders/index.vue")
const { descriptor } = parse(source)
const script = compileScript(descriptor, { id: "admin-orders-status-test" })
const transpile = (content) =>
  ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
const code = transpile(script.content)
const messages = {}
for (const language of ["en", "zh"]) {
  const exports = {}
  runInNewContext(transpile(read(`src/modules/admin/locales/${language}.ts`)), {
    exports,
  })
  messages[language] = exports.default
}
const adminI18n = {}
runInNewContext(transpile(read("src/modules/admin/utils/i18n.ts")), {
  exports: adminI18n,
})
const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve()
  await Vue.nextTick()
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
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function harness(t, options = {}) {
  const calls = {
    queries: [],
    updates: [],
    dispatches: [],
    orderDetails: [],
    details: [],
    statuses: [],
    messages: [],
    windowEvents: [],
  }
  const locale = Vue.ref("en")
  const route = Vue.reactive({ name: options.routeName || "admin-orders" })
  const translate = (key, params = {}) => {
    const value = key
      .split(".")
      .reduce((node, part) => node?.[part], messages[locale.value])
    assert.equal(typeof value, "string", `缺少翻译：${key}`)
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""))
  }
  const controls = {
    detail: async (id) => ({
      data: {
        supplier: {
          id,
          supplierName: `Supplier ${id}`,
          contactInfo: "Test contact",
        },
      },
    }),
    update: async () => true,
    query: async () => [{ id: 10, supplierName: "Supplier 10" }],
    orderDetail: async (orderId) => ({ data: { orderId, fulfillmentList: [] } }),
  }
  const api = {
    page: async () => ({ data: { list: [], total: 0 } }),
    querySuppliers: async (params) => {
      calls.queries.push(clone(params))
      return controls.query(params)
    },
    updateSupplier: async (payload) => {
      calls.updates.push(clone(payload))
      return controls.update(payload)
    },
    dispatchSupplier: async (payload) => { calls.dispatches.push(clone(payload)); return true },
    detail: async (orderId) => { calls.orderDetails.push(orderId); return controls.orderDetail(orderId) },
    updateOrderStatus: async (payload) => {
      calls.statuses.push(clone(payload))
      return true
    },
  }
  const exports = {}
  const window = {
    addEventListener: (type) => calls.windowEvents.push({ type, action: "add" }),
    removeEventListener: (type) =>
      calls.windowEvents.push({ type, action: "remove" }),
  }
  const document = {
    body: { classList: { remove() {} } },
  }
  runInNewContext(code, {
    exports,
    document,
    window,
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "vue-i18n")
        return { useI18n: () => ({ t: translate, locale }) }
      if (name === "vue-router")
        return { useRoute: () => route }
      if (name === "element-plus")
        return {
          ElMessage: Object.fromEntries(
            ["warning", "success", "error", "info"].map((type) => [
              type,
              (message) => calls.messages.push({ type, message }),
            ]),
          ),
          ElMessageBox: {
            confirm: async () => {
              throw new Error("未预期的确认框")
            },
          },
        }
      if (name === "@/modules/admin/api/order") return api
      if (name === "@/modules/admin/api/spu")
        return { page: async () => ({ list: [] }) }
      if (name === "@/modules/admin/api/supplier")
        return {
          detail: async (id) => {
            calls.details.push(id)
            return controls.detail(id)
          },
        }
      if (name === "@/modules/admin/utils/i18n") return adminI18n
      throw new Error(`未允许的依赖：${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null })
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  assert.deepEqual(calls.messages, [])
  const state = instance.$.setupState
  const row = (status, extras = {}) =>
    state.parseOrderRow({
      orderId: 100,
      orderNo: "TEST-100",
      orderStatus: status,
      supplierId: null,
      supplierName: "",
      ...extras,
    })
  return { state, calls, controls, row, locale, translate, route }
}

test("业务状态 0—6、字符串与枚举名称均映射正确，仅未付款已取消保持中性", async (t) => {
  const { state, row } = await harness(t)
  const tones = [
    "neutral",
    "action-needed",
    "completed",
    "closed",
    "neutral",
    "closed",
    "neutral",
  ]
  for (const [index, name] of [
    "UNPAID",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDING",
    "REFUNDED",
    "REFUND_FAILED",
  ].entries()) {
    for (const status of [index, String(index), name]) {
      for (const paymentStatus of index === 3 ? [1, 5] : [0, 1, 5]) {
        assert.equal(
          state.orderRowClassName({ row: row(status, { paymentStatus }) }),
          `order-status--${tones[index]}`,
        )
      }
    }
  }
  for (const status of [3, "3", "CANCELLED"]) {
    assert.equal(
      state.orderRowClassName({ row: row(status, { paymentStatus: 0 }) }),
      "order-status--neutral",
    )
    assert.equal(
      state.orderRowClassName({ row: row(status, { paymentStatus: 1 }) }),
      "order-status--closed",
    )
  }
  assert.equal(state.orderStatusTone(null), "neutral")
  assert.equal(state.orderStatusTone(99), "neutral")
})

test("日期与改期提示不会覆盖订单状态底色", async (t) => {
  const { state, row } = await harness(t)
  const today = new Date()
  const tomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  )
  const dateText = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} 09:00-11:00`
  for (const date of [today, tomorrow]) {
    for (const status of [0, 1, 2, 3, 5]) {
      const order = row(status, {
        serviceTime: dateText(date),
        rescheduled: true,
        rescheduleRead: false,
      })
      assert.equal(
        state.orderRowClassName({ row: order }),
        `order-status--${state.orderStatusTone(status)} order-row--rescheduled-unread`,
      )
      assert.ok(
        state.formatServiceDayLabel(order.serviceTime).match(/Today|Tomorrow/),
      )
    }
  }
})

test("图例包含五种状态，中英文随语言切换", async (t) => {
  const { state, locale } = await harness(t)
  assert.deepEqual(
    clone(state.orderStatusLegend.map((item) => item.value)),
    [0, 1, 2, 3, 5],
  )
  assert.deepEqual(clone(state.orderStatusLegend.map((item) => item.label)), [
    "Unpaid",
    "Action Needed",
    "Completed",
    "Cancelled",
    "Refunded",
  ])
  locale.value = "zh"
  assert.deepEqual(clone(state.orderStatusLegend.map((item) => item.label)), [
    "未付款",
    "需处理",
    "已完成",
    "已取消",
    "已退款",
  ])
})

for (const status of [2, 3, 5]) {
  test(`状态 ${status} 无论是否分配供应商均为查看入口，且不调用写接口`, async (t) => {
    const { state, calls, row } = await harness(t)
    for (const supplierId of [null, 10]) {
      const order = row(status, {
        supplierId,
        supplierName: supplierId ? "Stored name" : "",
      })
      assert.equal(
        state.supplierActionKey(order),
        "admin.orders.actions.viewSupplier",
      )
      await state.openAssignDialog(order)
      assert.equal(state.supplierViewVisible, true)
      assert.equal(state.assignDialogVisible, false)
      assert.equal(
        state.supplierViewInfo.supplierName,
        supplierId ? "Supplier 10" : "",
      )
      await state.submitSupplierAssignment()
    }
    assert.deepEqual(calls.details, [10])
    assert.deepEqual(calls.queries, [])
    assert.deepEqual(calls.updates, [])
  })
}

test("仅有供应商名称或完全未分配时，无需查询候选供应商", async (t) => {
  const { state, calls, row } = await harness(t)
  await state.openSupplierView(row(2, { supplierName: "Historical supplier" }))
  assert.equal(state.supplierViewInfo.supplierName, "Historical supplier")
  await state.openSupplierView(row(3))
  assert.equal(state.supplierViewInfo.supplierName, "")
  assert.equal(state.supplierViewLoading, false)
  assert.deepEqual(calls.details, [])
})

test("供应商详情失败保留名称并显示错误，重新打开可以恢复", async (t) => {
  const { state, controls, calls, row } = await harness(t)
  controls.detail = async () => {
    throw new Error("模拟详情失败")
  }
  const order = row(5, { supplierId: 10, supplierName: "Stored name" })
  await state.openSupplierView(order)
  assert.equal(state.supplierViewError, "模拟详情失败")
  assert.equal(state.supplierViewInfo.supplierName, "Stored name")
  assert.equal(state.supplierViewLoading, false)
  controls.detail = async () => ({
    supplierName: "Recovered",
    contactInfo: "Recovered contact",
  })
  await state.openSupplierView(order)
  assert.equal(state.supplierViewError, "")
  assert.equal(state.supplierViewInfo.contactInfo, "Recovered contact")
  assert.deepEqual(calls.updates, [])
})

test("快速切换供应商时，较旧响应不能覆盖当前查看内容", async (t) => {
  const { state, controls, row } = await harness(t)
  const old = deferred()
  controls.detail = (id) =>
    id === 10 ? old.promise : Promise.resolve({ supplierName: "Current" })
  const loading = state.openSupplierView(row(2, { supplierId: 10 }))
  await state.openSupplierView(row(3, { orderNo: "CURRENT", supplierId: 20 }))
  old.resolve({ supplierName: "Stale" })
  await loading
  assert.equal(state.supplierViewInfo.supplierName, "Current")
  assert.equal(state.supplierViewOrderNo, "CURRENT")
  assert.equal(state.supplierViewLoading, false)
})

test("关闭后返回的详情请求不会写入已关闭的查看状态", async (t) => {
  const { state, controls, row } = await harness(t)
  const pending = deferred()
  controls.detail = () => pending.promise
  const loading = state.openSupplierView(
    row(2, { supplierId: 10, supplierName: "Stored" }),
  )
  state.closeSupplierView()
  pending.reject(new Error("已过期的失败"))
  await loading
  assert.equal(state.supplierViewError, "")
  assert.equal(state.supplierViewLoading, false)
})

test("其他状态保留分配及管理入口，支持分配与解除分配", async (t) => {
  const { state, calls, row } = await harness(t)
  for (const status of [0, 1, 4, 6]) {
    assert.equal(
      state.supplierActionKey(row(status)),
      "admin.orders.actions.assignSupplier",
    )
    assert.equal(
      state.supplierActionKey(row(status, { supplierId: 10 })),
      "admin.orders.actions.assigned",
    )
  }
  await state.openAssignDialog(row(1))
  state.assignForm.supplierId = 10
  await state.submitSupplierAssignment()
  await state.openAssignDialog(row(1, { supplierId: 10 }))
  state.assignForm.supplierId = null
  await state.submitSupplierAssignment()
  assert.deepEqual(calls.updates, [
    { orderId: 100, supplierIds: [10] },
    { orderId: 100, supplierIds: [] },
  ])
})

test("批量选择包含只读订单时整体阻止分配，不偷偷跳过订单", async (t) => {
  const { state, calls, row } = await harness(t)
  for (const status of [2, 3, 5]) {
    state.selectedRows = [row(1), row(status, { orderId: 200 })]
    await state.openBulkAssignDialog()
    assert.equal(state.assignDialogVisible, false)
  }
  assert.equal(calls.messages.length, 3)
  assert.deepEqual(calls.queries, [])
  assert.deepEqual(calls.updates, [])
})

test("可编辑订单的批量分配保持原有行为", async (t) => {
  const { state, calls, row } = await harness(t)
  state.selectedRows = [row(0), row(1, { orderId: 200 })]
  await state.openBulkAssignDialog()
  state.assignForm.supplierId = 10
  await state.submitSupplierAssignment()
  assert.deepEqual(calls.updates, [
    { orderId: 100, supplierIds: [10] },
    { orderId: 200, supplierIds: [10] },
  ])
})

test("分配弹窗打开后状态改变，单个和批量提交均重新检查", async (t) => {
  const { state, calls, row } = await harness(t)
  const order = row(1)
  state.orders = [order]
  await state.openAssignDialog(order)
  state.orders[0].orderStatusCode = 2
  await state.submitSupplierAssignment()
  assert.deepEqual(calls.updates, [])
  state.orders = [row(1)]
  state.selectedRows = state.orders
  await state.openBulkAssignDialog()
  state.orders = [row(5)]
  await state.submitSupplierAssignment()
  assert.deepEqual(calls.updates, [])
})

test("接口成功后颜色与供应商入口同步响应订单状态变化", async (t) => {
  const { state, row } = await harness(t)
  const order = row(1, { supplierId: 10 })
  await state.handleOrderStatusChange(order, 2)
  assert.equal(
    state.orderRowClassName({ row: order }),
    "order-status--completed",
  )
  assert.equal(
    state.supplierActionKey(order),
    "admin.orders.actions.viewSupplier",
  )
  await state.handleOrderStatusChange(order, 0)
  assert.equal(state.orderRowClassName({ row: order }), "order-status--neutral")
  assert.equal(state.supplierActionKey(order), "admin.orders.actions.assigned")
})

test("提交期间不能重复分配，失败后仍可重试", async (t) => {
  const { state, calls, controls, row } = await harness(t)
  const pending = deferred()
  controls.update = () => pending.promise
  await state.openAssignDialog(row(1))
  const submit = state.submitSupplierAssignment()
  await state.submitSupplierAssignment()
  assert.equal(calls.updates.length, 1)
  pending.reject(new Error("模拟提交失败"))
  await submit
  assert.equal(state.assignDialogVisible, true)
  assert.equal(state.assignSubmitting, false)
  controls.update = async () => true
  await state.submitSupplierAssignment()
  assert.equal(calls.updates.length, 2)
  assert.equal(state.assignDialogVisible, false)
})

for (const routeName of ["admin-orders", "admin-orders-h5"]) {
  test(`${routeName} 套餐存在多个履约仍将一个供应商分配给整单`, async (t) => {
    const { state, calls, row } = await harness(t, { routeName })
    const order = row(1, { packageOrder: true, orderType: 2, fulfillmentList: [
      { id: 41, spuId: 12, serviceStatus: 0 }, { id: 42, spuId: 13, serviceStatus: 0 },
    ] })
    assert.equal(order.fulfillments.length, 2)
    await state.openAssignDialog(order)
    state.assignForm.supplierId = "10"
    await state.submitSupplierAssignment()
    assert.deepEqual(calls.updates, [{ orderId: 100, supplierIds: [10] }])
    assert.deepEqual(calls.dispatches, [])
    assert.deepEqual(calls.orderDetails, [])
    assert.equal(Object.hasOwn(calls.updates[0], "fulfillmentId"), false)
  })
}

test("PC和H5分配弹窗都只显示单供应商选择，不显示履约选择", () => {
  const ast = baseParse(descriptor.template.content)
  const nodes = (node) => [node, ...(node.children || []).flatMap(nodes)]
  const dialogs = nodes(ast).filter((node) => ["el-dialog", "el-drawer"].includes(node.tag)
    && node.props?.some((prop) => prop.type === 7 && prop.name === "model" && prop.exp?.content === "assignDialogVisible"))
  assert.equal(dialogs.length, 2)
  for (const dialog of dialogs) {
    const selectors = nodes(dialog).filter((node) => node.tag === "el-select")
    assert.equal(selectors.length, 1)
    assert.ok(selectors[0].props.some((prop) => prop.type === 7 && prop.name === "model" && prop.exp?.content === "assignForm.supplierId"))
    assert.equal(selectors[0].props.some((prop) => prop.name === "multiple"), false)
    assert.doesNotMatch(dialog.loc.source, /assignForm\.fulfillmentId|assignVisitPlaceholder|needsVisitChoice/)
  }
})

test("非法供应商ID不会提交，空字符串明确解除整单分配", async (t) => {
  const { state, calls, row } = await harness(t)
  await state.openAssignDialog(row(1, { supplierId: 10 }))
  for (const supplierId of [0, -1, 1.5, "NaN", "Infinity", "bad", "9007199254740992", [], [10], {}, true, false]) {
    state.assignForm.supplierId = supplierId
    await state.submitSupplierAssignment()
    assert.deepEqual(calls.updates, [])
    assert.equal(state.assignDialogVisible, true)
  }
  state.assignForm.supplierId = ""
  await state.submitSupplierAssignment()
  assert.deepEqual(calls.updates, [{ orderId: 100, supplierIds: [] }])
  assert.deepEqual(calls.dispatches, [])
})

test("新订单弹窗与最新候选搜索不会被旧供应商详情或旧搜索覆盖", async (t) => {
  const { state, controls, row } = await harness(t)
  const oldDetail = deferred()
  controls.detail = (id) => id === 10 ? oldDetail.promise : Promise.resolve({
    data: { supplier: { id, supplierName: "Current supplier", contactInfo: "Current contact" } },
  })
  const first = state.openAssignDialog(row(1, { supplierId: 10, supplierName: "Old supplier" }))
  await flush()
  await state.openAssignDialog(row(1, { orderId: 200, orderNo: "TEST-200", supplierId: 20, supplierName: "Current supplier" }))
  oldDetail.resolve({ data: { supplier: { id: 10, supplierName: "Late old supplier", contactInfo: "Old contact" } } })
  await first
  assert.equal(state.assignForm.orderId, 200)
  assert.equal(state.assignForm.supplierId, 20)
  assert.equal(state.assignSupplierPreview.supplierName, "Current supplier")

  const oldSearch = deferred(), freshSearch = deferred()
  controls.query = ({ supplierName }) => supplierName === "old" ? oldSearch.promise : freshSearch.promise
  const older = state.loadSupplierOptions("old")
  const newer = state.loadSupplierOptions("fresh")
  freshSearch.resolve([{ id: 40, supplierName: "Fresh result" }])
  await newer
  oldSearch.resolve([{ id: 30, supplierName: "Old result" }])
  await older
  assert.ok(state.supplierOptions.some((supplier) => supplier.id === 40))
  assert.equal(state.supplierOptions.some((supplier) => supplier.id === 30), false)

  const closedSearch = deferred()
  controls.query = () => closedSearch.promise
  const pending = state.loadSupplierOptions("closed")
  state.assignDialogVisible = false
  await flush()
  const closedOptions = clone(state.supplierOptions)
  closedSearch.resolve([{ id: 99, supplierName: "Late hidden result" }])
  await pending
  assert.deepEqual(clone(state.supplierOptions), closedOptions)
})

test("保存整单分配期间不能重入或切换为另一订单和批量弹窗", async (t) => {
  const { state, calls, controls, row } = await harness(t)
  const saving = deferred()
  controls.update = () => saving.promise
  await state.openAssignDialog(row(1))
  state.assignForm.supplierId = 10
  const pending = state.submitSupplierAssignment()
  await flush()
  const queryCount = calls.queries.length
  await state.openAssignDialog(row(1, { orderId: 200, orderNo: "TEST-200" }))
  state.selectedRows = [row(1, { orderId: 300 })]
  await state.openBulkAssignDialog()
  await state.submitSupplierAssignment()
  assert.equal(state.assignForm.orderId, 100)
  assert.equal(state.bulkAssignMode, false)
  assert.equal(calls.queries.length, queryCount)
  assert.deepEqual(calls.updates, [{ orderId: 100, supplierIds: [10] }])
  saving.resolve(true)
  await pending
  assert.equal(state.assignDialogVisible, false)
  assert.equal(state.assignSubmitting, false)
  await state.openAssignDialog(row(1, { orderId: 200, orderNo: "TEST-200" }))
  assert.equal(state.assignDialogVisible, true)
  assert.equal(state.assignForm.orderId, 200)
})

test("历史多供应商不默认选择首家，必须经真实选择事件或明确解除后才能保存", async (t) => {
  const nodes = (node) => [node, ...(node.children || []).flatMap(nodes)]
  const selectors = nodes(baseParse(descriptor.template.content)).filter((node) => node.tag === "el-select"
    && node.props.some((prop) => prop.type === 7 && prop.name === "model" && prop.exp?.content === "assignForm.supplierId"))
  assert.equal(selectors.length, 2)
  for (const [index, routeName] of ["admin-orders-h5", "admin-orders"].entries()) {
    const { state, calls, row, locale, translate } = await harness(t, { routeName })
    const legacy = row(1, { assignedSuppliers: [
      { supplierId: 10, supplierName: "Historical A" }, { supplierId: 20, supplierName: "Current B" },
    ] })
    await state.openAssignDialog(legacy)
    assert.equal(state.assignForm.supplierId, null)
    assert.equal(state.assignRequiresSupplierChoice, true)
    for (const language of ["en", "zh"]) {
      locale.value = language
      await state.submitSupplierAssignment()
      assert.deepEqual(calls.updates, [])
      assert.equal(calls.messages.at(-1).message, translate("admin.orders.form.singleSupplierRequired"))
    }
    const template = compileTemplate({ source: selectors[index].loc.source, filename: "assignment-select.vue", id: "legacy-choice" })
    assert.deepEqual(template.errors, [])
    const compiled = {}
    runInNewContext(transpile(template.code), { exports: compiled, require: () => ({ ...Vue, resolveComponent: (name) => name }) })
    const selector = compiled.render(state, [])
    selector.props["onUpdate:modelValue"](20)
    selector.props.onChange(20)
    assert.equal(state.assignRequiresSupplierChoice, false)
    await state.submitSupplierAssignment()
    assert.deepEqual(calls.updates, [{ orderId: 100, supplierIds: [20] }])

    await state.openAssignDialog(legacy)
    state.clearLegacySupplierAssignment()
    assert.equal(state.assignRequiresSupplierChoice, false)
    assert.equal(state.assignForm.supplierId, null)
    await state.submitSupplierAssignment()
    assert.deepEqual(calls.updates.at(-1), { orderId: 100, supplierIds: [] })
    await state.openAssignDialog(row(1, { supplierId: 20, supplierName: "Only supplier" }))
    assert.equal(state.assignForm.supplierId, 20)
    assert.equal(state.assignRequiresSupplierChoice, false)
  }
})

test("分配成功重新读取当前详情，更新未完成履约和员工并保留已完成历史", async (t) => {
  for (const refreshedStaff of [[], [{ id: 9, name: "New B worker", phone: "0502222222", supplierId: 20, fulfillmentId: 42 }]]) {
    const { state, calls, controls, row } = await harness(t)
    const history = { id: 41, seqNo: 1, spuName: "Completed service", serviceStatus: 2,
      supplierName: "Historical A", suppliers: [{ supplierId: 10, supplierName: "Historical A", serviceStatus: 2 }] }
    const oldData = { orderId: 100, orderNo: "TEST-100", orderStatus: 1, supplierId: 10, supplierName: "Historical A",
      assignedSuppliers: [{ supplierId: 10, supplierName: "Historical A" }],
      fulfillmentList: [history, { id: 42, seqNo: 2, spuName: "Upcoming service", serviceStatus: 0,
        supplierName: "Historical A", suppliers: [{ supplierId: 10, supplierName: "Historical A", serviceStatus: 0 }] }],
      assignedStaff: [{ id: 3, name: "Old A worker", phone: "0501111111", supplierId: 10, fulfillmentId: 42 }],
    }
    let response = oldData
    controls.orderDetail = async () => ({ data: clone(response) })
    controls.query = async () => [{ id: 10, supplierName: "Historical A" }, { id: 20, supplierName: "New B" }]
    await state.openOrderDetail(row(1, oldData))
    assert.equal(state.detailRow.assignedStaff[0].name, "Old A worker")
    await state.openAssignDialog(state.detailRow)
    state.assignForm.supplierId = 20
    response = { ...oldData, supplierId: 20, supplierName: "New B",
      assignedSuppliers: [{ supplierId: 20, supplierName: "New B" }], assignedStaff: refreshedStaff,
      fulfillmentList: [history, { id: 42, seqNo: 2, spuName: "Upcoming service", serviceStatus: 0,
        supplierName: "New B", suppliers: [{ supplierId: 20, supplierName: "New B", serviceStatus: 0 }] }],
    }
    await state.submitSupplierAssignment()
    assert.deepEqual(calls.orderDetails, [100, 100])
    assert.equal(state.detailDrawerVisible, true)
    const completed = state.detailRow.fulfillments.find((visit) => visit.id === 41)
    const upcoming = state.detailRow.fulfillments.find((visit) => visit.id === 42)
    assert.equal(state.detailRow.fulfillments.length, 2)
    assert.equal(completed.supplierName, "Historical A")
    assert.equal(completed.completed, true)
    assert.equal(upcoming.supplierName, "New B")
    assert.deepEqual(clone(upcoming.suppliers.map((supplier) => supplier.id)), [20])
    assert.deepEqual(clone(state.detailRow.assignedStaff.map((person) => person.name)), refreshedStaff.map((person) => person.name))
    assert.deepEqual(clone(state.staffForVisit(state.detailRow, upcoming).map((person) => person.name)), refreshedStaff.map((person) => person.name))
  }
})

test("批量分配的当前详情订单失败时不重新加载或改写它的履约和员工", async (t) => {
  const { state, calls, controls, row } = await harness(t)
  const failedOrder = row(1, { supplierId: 10, supplierName: "Existing supplier", fulfillmentList: [
    { id: 41, supplierName: "Existing supplier", serviceStatus: 0 },
  ], assignedStaff: [{ id: 3, name: "Existing worker", phone: "0501111111", fulfillmentId: 41 }] })
  state.detailRow = failedOrder
  state.detailDrawerVisible = true
  state.orders = [failedOrder, row(1, { orderId: 200, orderNo: "TEST-200" })]
  state.selectedRows = state.orders
  controls.update = async ({ orderId }) => {
    if (orderId === 100) throw new Error("Assignment refused")
    return true
  }
  const before = clone(state.detailRow)
  await state.openBulkAssignDialog()
  state.assignForm.supplierId = 20
  await state.submitSupplierAssignment()
  assert.deepEqual(calls.updates, [{ orderId: 100, supplierIds: [20] }, { orderId: 200, supplierIds: [20] }])
  assert.deepEqual(calls.orderDetails, [])
  assert.deepEqual(clone(state.detailRow), before)
})

test("模板和样式可编译，查看弹窗无编辑控件，颜色统一覆盖固定列与悬停", () => {
  const template = descriptor.template.content
  const viewDialog = template.slice(
    template.lastIndexOf(
      "<el-dialog",
      template.indexOf('v-model="supplierViewVisible"'),
    ),
    template.indexOf('v-model="assignDialogVisible"'),
  )
  assert.doesNotMatch(
    viewDialog,
    /<el-select|<el-input|submitSupplierAssignment|actions\.save/,
  )
  assert.match(viewDialog, /actions\.close/)
  assert.match(template, /supplierActionKey\(row\)/)
  assert.match(template, /item in orderStatusLegend/)
  const tableStart = template.slice(
    template.indexOf('class="orders-table"'),
    template.indexOf("@selection-change"),
  )
  assert.doesNotMatch(tableStart, /\bstripe\b/)
  const css = descriptor.styles[0].content
  for (const [tone, color] of [
    ["neutral", "#ffffff"],
    ["action-needed", "#e7f6ec"],
    ["completed", "#e8f2ff"],
    ["closed", "#e5e7eb"],
  ]) {
    assert.match(
      css,
      new RegExp(`order-status--${tone}[^}]+--order-status-bg: ${color}`),
    )
  }
  assert.match(
    css,
    /\.orders-table :deep\(\.el-table__body tr > td\.el-table__cell\)\s*\{\s*background-color: var\(--order-status-bg, #ffffff\) !important/,
  )
  assert.doesNotMatch(
    css,
    /tr\.order-row--today|tr\.order-row--tomorrow|background: #fff1f2|background: #ffe4e6/,
  )
  assert.equal(
    compileStyle({
      source: css,
      filename: "orders.vue",
      id: "data-v-orders-test",
      scoped: true,
    }).errors.length,
    0,
  )
  assert.equal(
    compileTemplate({
      source: template,
      filename: "orders.vue",
      id: "orders-test",
      compilerOptions: { bindingMetadata: script.bindings },
    }).errors.length,
    0,
  )
})

test("平台订单详情保留并按履约展示已分配员工的姓名和手机号", async (t) => {
  const { state, row } = await harness(t)
  const parsed = row(1, {
    supplierId: 8,
    supplierName: "测试报价",
    assignedSuppliers: [{ supplierId: 8, supplierName: "测试报价", serviceStatus: 4 }],
    fulfillmentList: [{ id: 41, seqNo: 1, spuName: "基本家庭清洁", supplierName: "测试报价" }],
    assignedStaff: [
      { id: 3, adminUserId: 30, name: "李明", phone: "+971501112233", fulfillmentId: 41, supplierId: 8 },
      { id: 4, name: "", phone: "", fulfillmentId: 41 },
    ],
  })
  assert.equal(parsed.assignedStaff.length, 1)
  const matched = state.staffForVisit(parsed, parsed.fulfillments[0])
  assert.equal(matched.length, 1)
  assert.equal(matched[0].name, "李明")
  assert.equal(matched[0].phone, "+971501112233")
  assert.equal(state.staffSupplierName(parsed, parsed.assignedStaff[0]), "测试报价")
  assert.equal(state.staffPhoneHref("+971 50 111 2233"), "tel:+971501112233")
  assert.equal(state.looseAssignedStaff(parsed).length, 0)

  const kept = state.normalizeOrderDetail(
    { orderId: 100, orderNo: "TEST-100", productName: "基本家庭清洁" },
    parsed,
  )
  assert.equal(kept.assignedStaff[0].name, "李明")
  assert.equal(kept.assignedStaff[0].phone, "+971501112233")

  const replaced = state.normalizeOrderDetail(
    {
      orderId: 100,
      assignedStaff: [{ id: 9, name: "王芳", phone: "0500000000", fulfillmentId: 41, supplierId: 8 }],
    },
    parsed,
  )
  assert.equal(replaced.assignedStaff.length, 1)
  assert.equal(replaced.assignedStaff[0].name, "王芳")
  assert.equal(replaced.assignedStaff[0].phone, "0500000000")
})

test("管理供应商弹窗展示已分配员工的姓名和手机号", async (t) => {
  const template = descriptor.template.content
  const h5 = template.slice(
    template.indexOf('class="h5-assign"'),
    template.indexOf('class="h5-assign__footer"'),
  )
  const desktopStart = template.lastIndexOf('v-model="assignDialogVisible"')
  const desktop = template.slice(
    desktopStart,
    template.indexOf("submitSupplierAssignment", desktopStart),
  )
  for (const block of [h5, desktop]) {
    assert.match(block, /assignTarget\.assignedStaff/)
    assert.match(block, /admin\.orders\.detail\.staffName/)
    assert.match(block, /admin\.orders\.detail\.staffPhone/)
    assert.match(block, /staffPhoneHref\(person\.phone\)/)
    assert.match(block, /admin\.orders\.detail\.assignedStaffEmpty/)
  }
  const { state, row } = await harness(t)
  const order = row(1, {
    supplierId: 8,
    supplierName: "测试报价",
    fulfillmentList: [
      { id: 41, seqNo: 1, spuName: "基本家庭清洁" },
      { id: 42, seqNo: 2, spuName: "深度清洁" },
    ],
    assignedStaff: [
      { id: 3, name: "Jenn", phone: "+971584632581", fulfillmentId: 41, supplierId: 8 },
    ],
  })
  await state.openAssignDialog(order)
  assert.equal(state.assignDialogVisible, true)
  assert.equal(state.assignTarget.assignedStaff[0].name, "Jenn")
  assert.equal(state.assignTarget.assignedStaff[0].phone, "+971584632581")
  assert.match(state.assignStaffVisitTitle(state.assignTarget.assignedStaff[0]), /基本家庭清洁|Visit 1/)
  assert.equal(state.assignStaffVisitTitle({ ...state.assignTarget.assignedStaff[0], fulfillmentId: null }), "")
})
