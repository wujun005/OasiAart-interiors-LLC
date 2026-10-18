import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"

// Execute real checkout code with local boundary mocks; never create real orders,
// mutate a cart, load Stripe.js, or send a payment request.
const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8")
const clone = (value) => JSON.parse(JSON.stringify(value))
const transpile = (source) => ts.transpileModule(
  source.replaceAll("import.meta.env", '({ VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_mock" })'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } },
).outputText
const flush = async () => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve
  const promise = new Promise((yes) => { resolve = yes })
  return { promise, resolve }
}
const renderer = Vue.createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
})
const filename = "src/modules/client/pages/order-confirm.vue"
const { descriptor } = parse(read(filename), { filename })
const script = compileScript(descriptor, { id: "package-direct-checkout" })
const code = transpile(script.content)

async function harness(t, overrides = {}) {
  const calls = { api: [], cartOptions: [], cart: [], messages: [], push: [], back: 0, elements: [] }
  const route = Vue.reactive({ query: {
    mode: "package", packageId: "2", orderId: "42", title: "Cleaning package",
    subtotal: "89.25", tax: "4.46", total: "93.71", ...overrides.query,
  } })
  const locale = Vue.ref("en")
  const controls = {
    payment: overrides.payment || (async () => ({ data: { clientSecret: "pi_mock_secret", customerSessionClientSecret: "cuss_mock" } })),
  }
  const browser = {
    location: { origin: "http://localhost:5173", pathname: "/order-confirm", href: "" },
    history: { length: 1 },
    setTimeout: (callback) => { callback(); return 1 },
    Stripe: () => ({ elements: (params) => {
      calls.elements.push(clone(params))
      return { create: () => ({ mount() {}, destroy() {}, on() {} }) }
    } }),
  }
  const exports = {}
  runInNewContext(code, {
    exports, window: browser,
    console: { error() {}, warn() {}, info() {} },
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "vue-i18n") return { useI18n: () => ({ t: (key) => key, locale }) }
      if (name === "vue-router") return {
        useRoute: () => route,
        useRouter: () => ({ push: async (to) => calls.push.push(clone(to)), replace: async () => {}, back: () => { calls.back += 1 } }),
      }
      if (name === "element-plus") return { ElMessage: Object.fromEntries(["warning", "error", "success"].map((kind) => [kind, (message) => calls.messages.push({ kind, message })])) }
      if (name.startsWith("element-plus/es/locale")) return {}
      if (name === "@/modules/client/api") return new Proxy({}, { get: (_, key) => async (...args) => {
        calls.api.push({ name: key, args: clone(args) })
        if (key === "createPay") return controls.payment(...args)
        if (key === "getClientAddressList" || key === "getAvailableSelectTime") return []
        return null
      } })
      if (name === "@/modules/client/composables/useCart") return { useCart: (options) => {
        calls.cartOptions.push(clone(options))
        return Object.fromEntries(["addItem", "refreshCart", "removeItems"].map((key) => [key, async (...args) => calls.cart.push({ name: key, args: clone(args) })]))
      } }
      if (name === "@/modules/client/utils/order-localization") return {
        formatContactName: (first, last) => `${first} ${last}`.trim(),
        splitContactName: () => ({ firstName: "", lastName: "" }),
      }
      if (name.endsWith(".vue")) return {}
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null })
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  const state = instance.$.setupState
  state.stripeElementContainerRef = {}
  return { state, calls, controls, route, locale, browser }
}

test("PC package confirmation template compiles and uses a distinct package mode", () => {
  const result = compileTemplate({ source: descriptor.template.content, filename, id: "package-direct-checkout", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(result.errors, [])
  assert.match(descriptor.template.content, /v-if="isPackageMode"/)
  assert.match(descriptor.template.content, /v-if="!isPackageMode"/)
})

test("PC package checkout loads no cart, address or available-time API and still requires policy acceptance", async (t) => {
  const { state, calls } = await harness(t)
  assert.equal(state.isPackageMode, true)
  assert.deepEqual(calls.cartOptions, [{ initialize: false }])
  assert.deepEqual(calls.api, [])
  assert.equal(state.getValidationMessage(), "")
  state.form.serviceDate = "2099-01-01"
  await flush()
  assert.deepEqual(calls.api, [])
  state.handleConfirm()
  assert.equal(state.policyDialogVisible, true)
  assert.equal(state.agreedPolicy, false)
  await state.confirmPolicyAndContinue()
  await state.submitBooking()
  assert.deepEqual(calls.api, [])
  state.agreedPolicy = true
  await state.confirmPolicyAndContinue()
  assert.deepEqual(calls.api, [{ name: "createPay", args: [{ orderId: 42, paymentMethod: "stripe", validationUrl: "http://localhost:5173/order-confirm" }] }])
  assert.deepEqual(calls.cart, [])
  assert.equal(state.stripeDialogVisible, true)
  assert.equal(state.stripeClientSecret, "pi_mock_secret")
  assert.equal(state.stripeCustomerSessionClientSecret, "cuss_mock")
  assert.equal(calls.elements[0].customerSessionClientSecret, "cuss_mock")
  assert.equal(state.isSubmitting, false)
})

test("PC package payment double clicks are deduplicated and failure remains retryable", async (t) => {
  const gate = deferred()
  const { state, calls, controls } = await harness(t, { payment: () => gate.promise })
  state.agreedPolicy = true
  const pending = state.submitBooking()
  await state.submitBooking()
  assert.equal(calls.api.length, 1)
  assert.equal(state.isSubmitting, true)
  gate.resolve(null)
  await pending
  assert.equal(state.isSubmitting, false)
  assert.equal(calls.messages.at(-1).kind, "error")
  controls.payment = async () => ({ data: { approvalUrl: "https://checkout.example.test/mock" } })
  await state.submitBooking()
  assert.equal(calls.api.length, 2)
  assert.deepEqual(calls.cart, [])
})

test("PC package confirmation rejects invalid identifiers without API mutations", async (t) => {
  const { state, route, calls } = await harness(t)
  state.agreedPolicy = true
  for (const key of ["orderId", "packageId"]) {
    const original = route.query[key]
    for (const value of ["", "0", "-1", "NaN", "Infinity", "1.5"]) {
      route.query[key] = value
      assert.notEqual(state.getValidationMessage(), "")
      await state.submitBooking()
    }
    route.query[key] = original
  }
  assert.deepEqual(calls.api, [])
  assert.deepEqual(calls.cart, [])
})

test("PC package success bypasses cart refresh and returns unscheduled confirmation", async (t) => {
  const { state, calls } = await harness(t)
  await state.handleStripeSuccess()
  assert.deepEqual(calls.cart, [])
  assert.equal(calls.push.at(-1).name, "booking-success")
  assert.equal(calls.push.at(-1).query.orderId, "42")
  assert.equal(calls.push.at(-1).query.scheduled, "")
  state.goBack()
  assert.deepEqual(calls.push.at(-1), { name: "package-detail", params: { id: "2" } })
})

test("PC normal service checkout retains saved address and booking-time validation", async (t) => {
  const { state, calls } = await harness(t, { query: { mode: "", spuId: "12" } })
  assert.equal(state.isPackageMode, false)
  assert.deepEqual(calls.cartOptions, [{ initialize: true }])
  assert.ok(calls.api.some((call) => call.name === "getLatestAddress"))
  assert.ok(calls.api.some((call) => call.name === "getClientAddressList"))
  assert.notEqual(state.getValidationMessage(), "")
  state.handleConfirm()
  assert.equal(state.policyDialogVisible, false)
  assert.ok(!calls.api.some((call) => call.name === "createPay"))
})

test("package direct-order API posts only packageId to placePackage", async () => {
  const calls = []
  const exports = {}
  runInNewContext(transpile(read("src/modules/client/api/index.ts")), {
    exports,
    require: () => ({ __esModule: true, default: { post: async (...args) => {
      calls.push(clone(args))
      return { data: "42" }
    } } }),
  })
  assert.equal(await exports.createPackageOrder("2"), "42")
  assert.deepEqual(calls, [["/client/order/placePackage", { packageId: "2" }]])
})

test("cart state can be read without eager requests, while explicit add and default initialization still fetch", async () => {
  const calls = []
  const exports = {}
  runInNewContext(transpile(read("src/modules/client/composables/useCart.ts")), {
    exports,
    require: (name) => {
      if (name === "vue") return Vue
      if (name.endsWith("/api")) return {
        getCartList: async () => { calls.push("list"); return [] },
        addPackageToCart: async (id) => { calls.push(["add", id]); return { cartItemId: "mock" } },
      }
      if (name.endsWith("order-localization")) return {}
      throw new Error(`Unexpected cart dependency: ${name}`)
    },
  })
  const lazy = exports.useCart({ initialize: false })
  await flush()
  assert.deepEqual(calls, [])
  assert.equal(lazy.cartCount.value, 0)
  await lazy.addPackage("2")
  assert.deepEqual(calls, [["add", "2"], "list"])
  calls.length = 0
  exports.useCart()
  await flush()
  assert.deepEqual(calls, ["list"])
})
