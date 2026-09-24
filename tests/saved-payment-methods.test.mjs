import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { parse, compileScript } from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"

// 编译实际组件与 API，替换边界依赖；不会加载 Stripe.js 或访问支付服务。
const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")
const componentSource = read(
  "src/modules/client/components/SavedPaymentMethodManager.vue",
)
const { descriptor } = parse(componentSource)
const compiled = compileScript(descriptor, {
  id: "saved-payment-methods-test",
}).content
const apiSource = read("src/modules/client/api/index.ts")
const transpile = (source) =>
  ts.transpileModule(
    source.replaceAll(
      "import.meta.env",
      '({ VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_mock_only" })',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText
const componentCode = transpile(compiled)
const apiCode = transpile(apiSource)
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}
const clone = (value) => JSON.parse(JSON.stringify(value))
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

async function harness(t, locale = "en") {
  const calls = { http: [], confirmations: [], dialogs: [], elements: [] }
  const controls = {
    consent: false,
    failEnable: false,
    failSetup: false,
    failList: false,
    setupResult: { setupIntent: { status: "succeeded" } },
  }
  const cards = [
    {
      paymentMethodId: "pm_legacy",
      last4: "4242",
      brand: "visa",
      allowRedisplay: "unspecified",
      isDefault: true,
    },
    {
      paymentMethodId: "pm_ready",
      last4: "4444",
      brand: "visa",
      allowRedisplay: "always",
    },
  ]
  const http = {
    async get(url) {
      calls.http.push({ method: "get", url })
      assert.equal(url, "/client/payment/methods")
      if (controls.failList) throw new Error("模拟列表失败")
      return { data: clone(cards) }
    },
    async post(url) {
      calls.http.push({ method: "post", url })
      assert.equal(url, "/client/payment/setup-intent")
      if (controls.failSetup) throw new Error("模拟初始化失败")
      return {
        data: { clientSecret: "seti_mock_secret", setupIntentId: "seti_mock" },
      }
    },
    async put(url, payload) {
      calls.http.push({
        method: "put",
        url,
        payload: payload && clone(payload),
      })
      if (url.endsWith("/redisplay-consent")) {
        if (controls.failEnable) throw new Error("模拟授权失败")
        assert.equal(payload.consent, true)
        const id = decodeURIComponent(url.split("/").at(-2))
        const card = cards.find((item) => item.paymentMethodId === id)
        if (card) card.allowRedisplay = "always"
      } else {
        assert.ok(url.endsWith("/default"))
      }
      return { data: true }
    },
    async delete(url) {
      calls.http.push({ method: "delete", url })
      return { data: true }
    },
  }
  const apiExports = {}
  runInNewContext(apiCode, {
    exports: apiExports,
    require: (name) => {
      assert.equal(name, "@/modules/client/utils/request")
      return { __esModule: true, default: http }
    },
  })
  const elements = { create: () => ({ mount() {}, destroy() {} }) }
  const stripe = {
    elements(params) {
      calls.elements.push(clone(params))
      return elements
    },
    async confirmSetup(params) {
      calls.confirmations.push(params)
      if (controls.setupResult.setupIntent?.status === "succeeded") {
        cards.push({
          paymentMethodId: "pm_new",
          last4: "5555",
          brand: "visa",
          allowRedisplay: "always",
        })
      }
      return controls.setupResult
    },
  }
  const mockWindow = {
    Stripe: () => stripe,
    location: { href: "http://localhost/profile" },
    setTimeout(callback, delay) {
      if (delay === 350) queueMicrotask(callback)
      return 0
    },
    confirm(message) {
      calls.dialogs.push(message)
      return controls.consent
    },
  }
  const componentExports = {}
  runInNewContext(componentCode, {
    exports: componentExports,
    window: mockWindow,
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "vue-i18n")
        return { useI18n: () => ({ locale: Vue.ref(locale) }) }
      if (name === "@/modules/client/api") return apiExports
      throw new Error(`未允许的测试依赖：${name}`)
    },
  })
  const app = renderer.createApp({
    ...componentExports.default,
    render: () => null,
  })
  const instance = app.mount({})
  t.after(() => app.unmount())
  const state = instance.$.setupState
  state.paymentElementRef = {}
  await flush()
  return { state, calls, controls, api: apiExports }
}

for (const locale of ["en", "zh"]) {
  test(`${locale}：新卡未授权不会确认，授权后传 always`, async (t) => {
    const { state, calls } = await harness(t, locale)
    await state.openAddDialog()
    assert.equal(state.formReady, true)
    assert.equal(state.saveConsent, false)
    await state.saveMethod()
    assert.equal(calls.confirmations.length, 0)
    assert.equal(state.formError, state.copy.consentRequired)
    state.saveConsent = true
    await state.saveMethod()
    assert.equal(calls.confirmations.length, 1)
    assert.equal(
      calls.confirmations[0].confirmParams.payment_method_data.allow_redisplay,
      "always",
    )
    assert.equal(calls.confirmations[0].redirect, "if_required")
    assert.equal(state.dialogVisible, false)
    assert.equal(state.saveConsent, false)
    assert.equal(state.methods.at(-1).allowRedisplay, "always")
  })

  test(`${locale}：取消旧卡授权无写入，确认后只更新指定卡`, async (t) => {
    const { state, calls, controls } = await harness(t, locale)
    await state.enableReuse(state.methods[0])
    assert.equal(calls.http.filter((item) => item.method === "put").length, 0)
    assert.ok(calls.dialogs[0].includes("4242"))
    controls.consent = true
    await state.enableReuse(state.methods[0])
    assert.deepEqual(
      calls.http.find((item) => item.method === "put"),
      {
        method: "put",
        url: "/client/payment/methods/pm_legacy/redisplay-consent",
        payload: { consent: true },
      },
    )
    assert.equal(state.methods[0].allowRedisplay, "always")
    const count = calls.http.length
    await state.enableReuse(state.methods[0])
    assert.equal(calls.http.length, count)
  })
}

test("旧卡授权失败后保持原状态并允许重试", async (t) => {
  const { state, controls } = await harness(t)
  controls.consent = true
  controls.failEnable = true
  await state.enableReuse(state.methods[0])
  assert.equal(state.methods[0].allowRedisplay, "unspecified")
  assert.equal(state.feedback, "模拟授权失败")
  assert.equal(state.busyId, "")
  controls.failEnable = false
  await state.enableReuse(state.methods[0])
  assert.equal(state.methods[0].allowRedisplay, "always")
})

test("验证失败及未完成状态不会提示绑卡成功", async (t) => {
  const { state, controls } = await harness(t)
  await state.openAddDialog()
  state.saveConsent = true
  controls.setupResult = { error: { message: "模拟验证失败" } }
  await state.saveMethod()
  assert.equal(state.dialogVisible, true)
  assert.equal(state.formError, "模拟验证失败")
  assert.equal(state.adding, false)
  controls.setupResult = { setupIntent: { status: "processing" } }
  await state.saveMethod()
  assert.equal(state.dialogVisible, true)
  assert.equal(state.formError, state.copy.savePending)
  controls.setupResult = { setupIntent: { status: "succeeded" } }
  await state.saveMethod()
  assert.equal(state.dialogVisible, false)
})

test("重新打开绑卡弹窗必须重新勾选授权", async (t) => {
  const { state } = await harness(t)
  await state.openAddDialog()
  state.saveConsent = true
  state.closeDialog()
  await state.openAddDialog()
  assert.equal(state.saveConsent, false)
})

test("初始化失败不能提交，重新打开可重试", async (t) => {
  const { state, controls, calls } = await harness(t)
  controls.failSetup = true
  await state.openAddDialog()
  state.saveConsent = true
  await state.saveMethod()
  assert.equal(state.formReady, false)
  assert.equal(calls.confirmations.length, 0)
  state.closeDialog()
  controls.failSetup = false
  await state.openAddDialog()
  assert.equal(state.formReady, true)
  assert.equal(state.saveConsent, false)
})

test("列卡及设为默认不会隐式授权", async (t) => {
  const { state, calls } = await harness(t)
  assert.equal(calls.http.filter((item) => item.method !== "get").length, 0)
  await state.makeDefault(state.methods[0])
  assert.equal(state.methods[0].allowRedisplay, "unspecified")
  assert.ok(calls.http.some((item) => item.url.endsWith("/default")))
  assert.ok(
    calls.http.every((item) => !item.url.endsWith("/redisplay-consent")),
  )
})

test("授权请求编码卡片 ID，保留显式 consent 参数", async (t) => {
  const { api, calls } = await harness(t)
  await api.enableSavedPaymentMethodRedisplay("pm/a b", true)
  assert.equal(
    calls.http.at(-1).url,
    "/client/payment/methods/pm%2Fa%20b/redisplay-consent",
  )
})

test("PC/H5 复用此组件，普通付款及购物车继续传递 CustomerSession", () => {
  for (const module of ["client", "h5"]) {
    assert.match(
      read(`src/modules/${module}/pages/profile.vue`),
      /<SavedPaymentMethodManager\s*\/>/,
    )
    assert.match(
      read(`src/modules/${module}/pages/order-confirm.vue`),
      /customerSessionClientSecret:\s*stripeCustomerSessionClientSecret.value/,
    )
    assert.match(
      read(`src/modules/${module}/pages/order-confirm.vue`),
      /normalizeText\(paymentData.customerSessionClientSecret\)/,
    )
    assert.match(
      read(`src/modules/${module}/pages/cart.vue`),
      /:customer-session-client-secret="stripeCustomerSessionClientSecret"/,
    )
  }
  assert.match(
    read("src/modules/client/components/StripePaymentModal.vue"),
    /customerSessionClientSecret:\s*props.customerSessionClientSecret/,
  )
  assert.match(
    componentSource,
    /:disabled="initializing \|\| adding \|\| !formReady \|\| !saveConsent"/,
  )
})
