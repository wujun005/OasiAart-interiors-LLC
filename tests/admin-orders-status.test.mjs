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
const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve()
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

async function harness(t) {
  const calls = {
    queries: [],
    updates: [],
    details: [],
    statuses: [],
    messages: [],
  }
  const locale = Vue.ref("en")
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
  }
  const api = {
    page: async () => ({ data: { list: [], total: 0 } }),
    querySuppliers: async (params) => {
      calls.queries.push(clone(params))
      return [{ id: 10, supplierName: "Supplier 10" }]
    },
    updateSupplier: async (payload) => {
      calls.updates.push(clone(payload))
      return controls.update(payload)
    },
    updateOrderStatus: async (payload) => {
      calls.statuses.push(clone(payload))
      return true
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
  return { state, calls, controls, row, locale, translate }
}

test("业务状态 0—6、字符串与枚举名称均映射正确，行颜色不依赖支付状态", async (t) => {
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
      for (const paymentStatus of [0, 1, 5]) {
        assert.equal(
          state.orderRowClassName({ row: row(status, { paymentStatus }) }),
          `order-status--${tones[index]}`,
        )
      }
    }
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
  state.assignForm.supplierId = ""
  await state.submitSupplierAssignment()
  assert.deepEqual(calls.updates, [
    { orderId: 100, supplierId: 10 },
    { orderId: 100, supplierId: null },
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
    { orderId: 100, supplierId: 10 },
    { orderId: 200, supplierId: 10 },
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
