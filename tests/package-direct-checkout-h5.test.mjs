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
const plainTextExports = {}
runInNewContext(ts.transpileModule(
  readFileSync(new URL("src/modules/client/utils/plain-text.ts", root), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, { exports: plainTextExports })
const packageBookingCode = ts.transpileModule(
  readFileSync(new URL("src/modules/client/composables/usePackageFirstBooking.ts", root), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText
const packageTimesCode = ts.transpileModule(
  readFileSync(new URL("src/modules/client/utils/package-booking-times.ts", root), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText
const purchasedOrder = (orderId = 42, packageId = 12, spuIds = [7, 8]) => ({
  orderId, orderType: 2, packageItems: [],
  packageSnapshot: { packageId, items: [
    { skuId: 201, chosenSkuId: 204, bindType: 1, spuId: spuIds[0], redeemTimes: 3, spuNameI18n: { en: "Home cleaning", zh: "家庭清洁" },
      specs: [{ specTypeNameI18n: { en: "Home size" }, specValueNameI18n: { en: "4 BHK" } }] },
    { skuId: 301, bindType: 2, spuId: spuIds[1], redeemTimes: 2, spuNameI18n: { en: "Home painting", zh: "家庭油漆" } },
  ] },
})
const timeOptions = [{ time: "09:00", timeRange: 7, available: true }]
const completeBooking = async (state) => {
  const address = { id: 1, fullName: "Test Customer", phoneCountryCode: "+971", phone: "501234567", address: "Test Street", building: "Villa 1" }
  state.addressList = [address]
  state.selectSavedAddress(address)
  state.form.serviceDate = "2099-01-01"
  state.form.remark = "Ring the doorbell once"
  await flush()
  state.form.timeRange = "7"
}

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
  insertStaticContent: () => [{}, {}],
})

async function harness(t, overrides = {}) {
  const calls = {
    cartOptions: [],
    packageDetails: [],
    orderDetails: [],
    cartRefresh: 0,
    cartAdd: [],
    cartRemove: [],
    addressList: 0,
    latestAddress: 0,
    availableTimes: 0,
    availableTimeParams: [],
    cartDetail: 0,
    saveContact: [],
    createPay: [],
    push: [],
    failures: [],
    successes: [],
    errors: [],
    renderErrors: [],
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
  const loadAvailableTimes = async (params) => {
    calls.availableTimes += 1
    calls.availableTimeParams.push(clone(params))
    return overrides.availableTimes ? overrides.availableTimes(params) : timeOptions
  }
  const packageBookingExports = {}
  runInNewContext(packageBookingCode, { exports: packageBookingExports, require: (name) => {
    if (name === "vue") return Vue
    if (name === "@/modules/client/utils/plain-text") return plainTextExports
    if (name === "@/modules/client/api") return { getClientOrderDetailById: async (id) => {
      calls.orderDetails.push(id)
      return overrides.orderDetail ? overrides.orderDetail(id) : purchasedOrder()
    } }
    throw new Error(`Unexpected booking dependency: ${name}`)
  } })
  const packageTimesExports = {}
  runInNewContext(packageTimesCode, { exports: packageTimesExports, require: (name) => {
    if (name === "@/modules/client/api") return { getAvailableSelectTime: loadAvailableTimes }
    throw new Error(`Unexpected availability dependency: ${name}`)
  } })
  runInNewContext(code, {
    exports,
    window: browser,
    console: {
      ...console,
      error: (...args) => calls.errors.push(args),
    },
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "@/modules/client/utils/plain-text") return plainTextExports
      if (name === "@/modules/client/composables/usePackageFirstBooking") return packageBookingExports
      if (name === "@/modules/client/utils/package-booking-times") return packageTimesExports
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
          getAvailableSelectTime: loadAvailableTimes,
          getCartDetail: async () => {
            calls.cartDetail += 1
            return null
          },
          saveContactAddress: async (payload) => {
            calls.saveContact.push(clone(payload))
            if (overrides.saveContact) return overrides.saveContact(payload)
            return 1
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
          readOrderSummaryAttachLines: () => [],
        }
      }
      if (name.endsWith(".vue")) return {}
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: overrides.renderTemplate || (() => null) })
  if (overrides.renderTemplate) {
    app.config.errorHandler = (error) => calls.renderErrors.push(error)
    app.config.warnHandler = () => {}
  }
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  return { state: instance.$.setupState, route, calls, browser, locale }
}

test("H5 package confirmation compiles with a read-only included-service list, address, time and note fields", () => {
  const result = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: "package-direct-checkout-h5",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(result.errors, [])
  assert.match(descriptor.template.content, /v-for="option in packageServiceOptions"/)
  assert.doesNotMatch(descriptor.template.content, /v-model="packageSkuId"/)
  assert.match(descriptor.template.content, /v-model(?:\.trim)?="form\.remark"/)
  assert.doesNotMatch(descriptor.template.content, /v-if="!isPackageMode" class="h5-order-card h5-order-card--(?:time|note)"/)
})

test("H5 first-visit confirmation executes the actual template before and after booking form completion", async (t) => {
  const result = compileTemplate({ source: descriptor.template.content, filename, id: "h5-first-visit-render", compilerOptions: { bindingMetadata: script.bindings } })
  const template = {}
  runInNewContext(ts.transpileModule(result.code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports: template, require: () => ({ ...Vue, withDirectives: (vnode) => vnode }) })
  const { state, calls } = await harness(t, { renderTemplate: template.render })
  await completeBooking(state)
  await flush()
  assert.deepEqual(calls.renderErrors, [])
  assert.equal(state.getValidationMessage(), "")
})

test("package mode renders summary and loads first-visit address/service data without initializing cart", async (t) => {
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
  assert.equal(calls.addressList, 1)
  assert.equal(calls.latestAddress, 1)
  assert.deepEqual(clone(state.packageServiceOptions.map((service) => service.value)), ["204", "301"])
  assert.equal(state.packageServiceOptions[0].spec, "Home size: 4 BHK")
  assert.deepEqual(calls.orderDetails, ["42"])
  assert.deepEqual(calls.packageDetails, [])
  assert.equal(calls.availableTimes, 0)
  assert.equal(calls.cartDetail, 0)
})

test("package confirmation validates a scheduled visit, requires policy and saves first booking before payment", async (t) => {
  const pendingSave = deferred()
  const pendingPayment = deferred()
  const { state, calls, browser } = await harness(t, {
    saveContact: () => pendingSave.promise,
    createPay: () => pendingPayment.promise,
  })

  state.handleConfirm()
  assert.equal(state.policyPopupVisible, false)
  assert.match(calls.failures.at(-1), /saved contact and service address/i)
  await completeBooking(state)
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
  assert.equal(calls.saveContact.length, 1)
  assert.equal(calls.createPay.length, 0)
  pendingSave.resolve(1)
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
  assert.equal(calls.saveContact.length, 1)
  assert.equal(Object.hasOwn(calls.saveContact[0], "packageSkuId"), false)
  assert.equal(calls.saveContact[0].orderId, 42)
  assert.equal(calls.saveContact[0].serviceAddress, "Test Street")
  assert.equal(calls.saveContact[0].serviceTime, "2099-01-01")
  assert.equal(calls.saveContact[0].timeRange, 7)
  assert.equal(calls.saveContact[0].remark, "Ring the doorbell once")
  assert.deepEqual(calls.availableTimeParams.map((params) => params.spuId), [7, 8])
  assert.equal(calls.cartAdd.length, 0)
  assert.equal(calls.cartRemove.length, 0)
})

test("package payment success skips cart refresh and shows its first scheduled visit", async (t) => {
  const { state, calls } = await harness(t)
  await completeBooking(state)
  await state.handleStripeSuccess()
  assert.equal(calls.cartRefresh, 0)
  assert.deepEqual(calls.push.at(-1), {
    name: "h5-booking-success",
    query: {
      orderId: "42",
      service: "Care Package",
      scheduled: "2099-01-01 09:00",
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
  await completeBooking(state)
  state.agreedPolicy = true

  await state.confirmPolicyAndContinue()
  assert.equal(state.isSubmitting, false)
  assert.equal(calls.createPay.length, 1)
  assert.equal(calls.failures.at(-1), "Temporary payment failure")

  await state.confirmPolicyAndContinue()
  assert.equal(state.isSubmitting, false)
  assert.equal(calls.createPay.length, 2)
  assert.equal(browser.location.href, "https://payments.example.test/retry")
  assert.equal(calls.saveContact.length, 2)
  assert.equal(calls.cartAdd.length, 0)
})

test("H5 never creates payment if saving the first booking fails", async (t) => {
  const { state, calls } = await harness(t, { saveContact: async () => { throw new Error("First booking unavailable") } })
  await completeBooking(state)
  state.agreedPolicy = true
  await state.submitBooking()
  assert.equal(calls.saveContact.length, 1)
  assert.equal(calls.createPay.length, 0)
  assert.equal(state.isSubmitting, false)
  assert.equal(calls.failures.at(-1), "First booking unavailable")
})

test("H5 switching package orders ignores stale shared availability and keeps the purchased service list", async (t) => {
  const old = deferred()
  const current = deferred()
  const { state, calls, route } = await harness(t, {
    orderDetail: async (id) => id === "42" ? purchasedOrder() : purchasedOrder(43, 13, [9, 10]),
    availableTimes: ({ spuId }) => spuId < 9 ? old.promise : current.promise,
  })
  state.form.serviceDate = "2099-01-01"
  await flush()
  route.query.orderId = "43"
  route.query.packageId = "13"
  await flush()
  current.resolve([{ time: "10:00", timeRange: 9, available: true }])
  await flush()
  old.resolve(timeOptions)
  await flush()
  assert.equal(state.availableTimeRecords[0].timeRange, 9)
  assert.equal(state.form.timeRange, "9")
  assert.deepEqual(clone(state.packageServiceOptions.map((service) => service.spuId)), ["9", "10"])
  assert.deepEqual(calls.availableTimeParams.map((params) => params.spuId), [7, 8, 10, 9])
  assert.equal(calls.createPay.length, 0)
  assert.equal(calls.saveContact.length, 0)
})

test("H5 cannot pay when any included service has no common slot or its availability fails", async (t) => {
  for (const scenario of ["no-common-slot", "failed"]) {
    const { state, calls } = await harness(t, { availableTimes: async ({ spuId }) => {
      if (spuId === 7) return timeOptions
      if (scenario === "failed") throw new Error("Painting availability failed")
      return [{ time: "10:00", timeRange: 9, available: true }]
    } })
    await completeBooking(state)
    state.agreedPolicy = true
    assert.deepEqual(clone(state.availableTimeRecords), [])
    if (scenario === "failed") {
      state.availableTimeRecords = clone(timeOptions)
      state.form.timeRange = "7"
    }
    assert.notEqual(state.getValidationMessage(), "")
    await state.submitBooking()
    assert.equal(calls.createPay.length, 0)
    assert.equal(calls.saveContact.length, 0)
  }
})

test("H5 rejects a manually restored old slot while the new date is loading and after no common slot is found", async (t) => {
  const gate = deferred()
  const { state, calls } = await harness(t, { availableTimes: ({ serviceTime }) =>
    serviceTime === "2099-01-01" ? Promise.resolve(timeOptions) : gate.promise })
  await completeBooking(state)
  assert.equal(state.getValidationMessage(), "")
  state.agreedPolicy = true
  state.form.serviceDate = "2099-01-02"
  await flush()
  state.availableTimeRecords = clone(timeOptions)
  state.form.timeRange = "7"
  assert.equal(state.isTimeOptionsLoading, true)
  assert.notEqual(state.getValidationMessage(), "")
  await state.submitBooking()
  assert.equal(calls.saveContact.length, 0)
  assert.equal(calls.createPay.length, 0)
  gate.resolve([{ time: "09:00", timeRange: 7, available: false }])
  await flush()
  state.form.timeRange = "7"
  assert.deepEqual(clone(state.availableTimeRecords), [])
  await state.submitBooking()
  assert.equal(calls.saveContact.length, 0)
  assert.equal(calls.createPay.length, 0)
})

test("H5 deduplicates a pending first-booking save and does not pay after navigating to another order", async (t) => {
  const saving = deferred()
  const { state, calls, route } = await harness(t, { saveContact: () => saving.promise })
  await completeBooking(state)
  state.agreedPolicy = true
  const pending = state.submitBooking()
  await flush()
  await state.submitBooking()
  assert.equal(calls.saveContact.length, 1)
  assert.equal(calls.saveContact[0].orderId, 42)
  assert.equal(calls.createPay.length, 0)
  route.query.orderId = "43"
  await flush()
  saving.resolve(1)
  await pending
  assert.equal(calls.saveContact.length, 1)
  assert.equal(calls.createPay.length, 0)
  assert.equal(state.isSubmitting, false)
})

test("H5 confirmation strips rich-text multilingual titles and handles old checkout links", async (t) => {
  const { state, route, locale, calls } = await harness(t, { query: {
    title: "<p>Fallback package</p>",
    titleI18n: JSON.stringify({ en: "<p>Massage <strong>3 visits</strong></p>", zh: "<p>柔式上门按摩3次</p>" }),
  } })
  assert.equal(state.summaryTitle, "Massage 3 visits")
  locale.value = "zh"
  assert.equal(state.summaryTitle, "柔式上门按摩3次")
  route.query.titleI18n = JSON.stringify({ zh: "<p><br></p>" })
  assert.equal(state.summaryTitle, "Fallback package")
  route.query.title = "<p><br></p>"
  assert.equal(state.summaryTitle, "client.orderConfirm.summary.itemDefault")
  assert.equal(calls.createPay.length, 0)
  assert.equal(calls.cartAdd.length, 0)
})
