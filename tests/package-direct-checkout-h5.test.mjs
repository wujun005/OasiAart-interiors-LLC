import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"

// Exercise the actual H5 confirmation SFC with local API/router mocks. These
// tests never send cart, order, address, availability, or payment requests.
const root = new URL("../", import.meta.url)
const filename = "src/modules/h5/pages/order-confirm.vue"
const source = readFileSync(new URL(filename, root), "utf8")
const { descriptor, errors } = parse(source, { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: "package-direct-checkout-h5" })
const scriptSource = script.content
  .replaceAll("import.meta.env.VITE_BOOKING_LEAD_MINUTES", "undefined")
  .replaceAll("import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY", '""')
const code = ts.transpileModule(scriptSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText

const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve()
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

async function harness(t, overrides = {}) {
  const calls = {
    cartOptions: [],
    cartRefresh: 0,
    cartAdd: [],
    cartRemove: [],
    addressList: 0,
    latestAddress: 0,
    availableTimes: 0,
    cartDetail: 0,
    saveContact: [],
    createPay: [],
    push: [],
    failures: [],
    successes: [],
    errors: [],
  }
  const route = Vue.reactive({
    query: {
      mode: "package",
      packageId: "12",
      orderId: "42",
      title: "Care Package",
      titleI18n: JSON.stringify({ en: "Care Package", zh: "安心套餐" }),
      specSummary: "3 visits · Valid for 90 days",
      imageUrls: JSON.stringify(["https://example.com/package.jpg"]),
      subtotal: "100.00",
      tax: "5.00",
      total: "105.00",
      ...overrides.query,
    },
  })
  const locale = Vue.ref(overrides.locale || "en")
  const createPay = overrides.createPay || (async () => ({
    data: { approvalUrl: "https://payments.example.test/checkout" },
  }))
  const browser = {
    location: {
      origin: "http://localhost:5173",
      pathname: "/h5/orders/confirm",
      href: "http://localhost:5173/h5/orders/confirm",
    },
    setTimeout(callback) {
      callback()
      return 1
    },
  }
  const exports = {}
  runInNewContext(code, {
    exports,
    window: browser,
    console: {
      ...console,
      error: (...args) => calls.errors.push(args),
    },
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "vue-i18n") {
        return {
          useI18n: () => ({
            locale,
            t: (key, params = {}) =>
              `${key}${Object.keys(params).length ? `:${JSON.stringify(params)}` : ""}`,
          }),
        }
      }
      if (name === "vue-router") {
        return {
          useRoute: () => route,
          useRouter: () => ({
            push: async (target) => calls.push.push(clone(target)),
          }),
        }
      }
      if (name === "vant") {
        return {
          showConfirmDialog: async () => true,
          showFailToast: (message) => calls.failures.push(message),
          showSuccessToast: (message) => calls.successes.push(message),
        }
      }
      if (name === "@/modules/client/api") {
        return {
          addClientAddress: async () => null,
          deleteClientAddress: async () => null,
          updateClientAddress: async () => null,
          getClientAddressList: async () => {
            calls.addressList += 1
            return []
          },
          getLatestAddress: async () => {
            calls.latestAddress += 1
            return null
          },
          getAvailableSelectTime: async () => {
            calls.availableTimes += 1
            return []
          },
          getCartDetail: async () => {
            calls.cartDetail += 1
            return null
          },
          saveContactAddress: async (payload) => {
            calls.saveContact.push(clone(payload))
            return null
          },
          createPay: async (payload) => {
            calls.createPay.push(clone(payload))
            return createPay(payload)
          },
        }
      }
      if (name === "@/modules/client/composables/useCart") {
        return {
          useCart: (options) => {
            calls.cartOptions.push(clone(options))
            return {
              addItem: async (payload) => calls.cartAdd.push(clone(payload)),
              refreshCart: async () => {
                calls.cartRefresh += 1
              },
              removeItems: async (ids) => calls.cartRemove.push(clone(ids)),
            }
          },
        }
      }
      if (name === "@/modules/client/locales") {
        return { setClientLocale() {} }
      }
      if (name === "@/modules/client/utils/geolocation") {
        return {
          locateCurrentAddress: async () => ({}),
          LocationLookupError: class LocationLookupError extends Error {},
        }
      }
      if (name === "@/modules/client/utils/order-localization") {
        return {
          formatContactName: (firstName, lastName) =>
            [firstName, lastName].filter(Boolean).join(" "),
          splitContactName: (fullName) => ({ firstName: fullName, lastName: "" }),
        }
      }
      if (name.endsWith(".vue")) return {}
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null })
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  return { state: instance.$.setupState, route, calls, browser }
}

test("H5 package confirmation compiles and hides address, schedule and note sections", () => {
  const result = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: "package-direct-checkout-h5",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(result.errors, [])
  assert.match(descriptor.template.content, /v-if="!isPackageMode"[\s\S]+?h5-order-card--address/)
  assert.match(descriptor.template.content, /v-if="!isPackageMode" class="h5-order-card h5-order-card--time"/)
  assert.match(descriptor.template.content, /v-if="!isPackageMode" class="h5-order-card h5-order-card--note"/)
  assert.match(descriptor.template.content, /套餐支付后可在订单中按次预约，届时选择服务地址和时间/)
})

test("package mode renders query summary without initializing cart or loading booking data", async (t) => {
  const { state, calls } = await harness(t)
  assert.equal(state.isPackageMode, true)
  assert.equal(state.packageId, 12)
  assert.equal(state.orderId, 42)
  assert.equal(state.summaryTitle, "Care Package")
  assert.equal(state.summaryMeta, "3 visits · Valid for 90 days")
  assert.equal(state.summaryImageUrl, "https://example.com/package.jpg")
  assert.equal(state.subtotal, 100)
  assert.equal(state.tax, 5)
  assert.equal(state.total, 105)
  assert.deepEqual(calls.cartOptions, [{ initialize: false }])
  assert.equal(calls.addressList, 0)
  assert.equal(calls.latestAddress, 0)
  assert.equal(calls.availableTimes, 0)
  assert.equal(calls.cartDetail, 0)
})

test("package confirmation requires agreement and sends only the existing createPay request", async (t) => {
  const pendingPayment = deferred()
  const { state, calls, browser } = await harness(t, {
    createPay: () => pendingPayment.promise,
  })

  state.handleConfirm()
  assert.equal(state.policyPopupVisible, true)
  assert.equal(state.agreedPolicy, false)
  await state.confirmPolicyAndContinue()
  assert.equal(calls.createPay.length, 0)

  state.agreedPolicy = true
  const first = state.confirmPolicyAndContinue()
  await flush()
  assert.equal(state.isSubmitting, true)
  const duplicate = state.confirmPolicyAndContinue()
  await flush()
  assert.equal(calls.createPay.length, 1)
  assert.deepEqual(calls.createPay[0], {
    orderId: 42,
    paymentMethod: "stripe",
    validationUrl: "http://localhost:5173/h5/orders/confirm",
  })

  pendingPayment.resolve({
    data: { approvalUrl: "https://payments.example.test/checkout" },
  })
  await Promise.all([first, duplicate])
  assert.equal(browser.location.href, "https://payments.example.test/checkout")
  assert.equal(calls.saveContact.length, 0)
  assert.equal(calls.cartAdd.length, 0)
  assert.equal(calls.cartRemove.length, 0)
})

test("package payment success skips cart refresh and returns an empty schedule", async (t) => {
  const { state, calls } = await harness(t)
  await state.handleStripeSuccess()
  assert.equal(calls.cartRefresh, 0)
  assert.deepEqual(calls.push.at(-1), {
    name: "h5-booking-success",
    query: {
      orderId: "42",
      service: "Care Package",
      scheduled: "",
      amount: "105",
    },
  })

  state.goBack()
  assert.deepEqual(calls.push.at(-1), {
    name: "h5-package-detail",
    params: { id: "12" },
  })
})

test("package mode rejects missing or non-positive package and order IDs", async (t) => {
  const { state, calls } = await harness(t, {
    query: { packageId: "0", orderId: "-1" },
  })
  state.handleConfirm()
  assert.equal(state.policyPopupVisible, false)
  assert.equal(calls.createPay.length, 0)
  assert.equal(calls.failures.length, 1)
})

test("ordinary product mode keeps address and time validation", async (t) => {
  const { state, calls } = await harness(t, {
    query: {
      mode: "",
      packageId: "",
      orderId: "43",
      spuId: "7",
    },
  })
  assert.equal(state.isPackageMode, false)
  assert.deepEqual(calls.cartOptions, [{ initialize: true }])
  assert.equal(calls.latestAddress, 1)
  assert.equal(calls.addressList, 1)

  state.handleConfirm()
  assert.match(calls.failures.at(-1), /select a saved contact and service address/i)
  assert.equal(state.policyPopupVisible, false)

  Object.assign(state.form, {
    phone: "501234567",
    address: "Test Street",
    building: "Villa 1",
    serviceDate: "2099-01-01",
    timeRange: "",
  })
  state.addressList = [{ id: 1, fullName: "Test Customer" }]
  state.selectedAddressId = 1
  state.handleConfirm()
  assert.match(calls.failures.at(-1), /client\.orderConfirm\.fields\.serviceTime/)
  assert.equal(calls.createPay.length, 0)
})

test("failed package payment can be retried after the submit guard resets", async (t) => {
  let attempt = 0
  const { state, calls, browser } = await harness(t, {
    createPay: async () => {
      attempt += 1
      if (attempt === 1) throw new Error("Temporary payment failure")
      return { data: { approvalUrl: "https://payments.example.test/retry" } }
    },
  })
  state.agreedPolicy = true

  await state.confirmPolicyAndContinue()
  assert.equal(state.isSubmitting, false)
  assert.equal(calls.createPay.length, 1)
  assert.equal(calls.failures.at(-1), "Temporary payment failure")

  await state.confirmPolicyAndContinue()
  assert.equal(state.isSubmitting, false)
  assert.equal(calls.createPay.length, 2)
  assert.equal(browser.location.href, "https://payments.example.test/retry")
  assert.equal(calls.saveContact.length, 0)
  assert.equal(calls.cartAdd.length, 0)
})
