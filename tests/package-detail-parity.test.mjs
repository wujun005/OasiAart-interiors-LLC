import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"

// Exercise the actual package-detail SFC. API/auth/router/payment boundaries are
// local mocks: these tests never send cart, order, or payment requests.
const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")
const filename = "src/modules/client/pages/package-detail.vue"
const source = read(filename)
const { descriptor, errors } = parse(source, { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: "package-detail-parity-test" })
const transpile = (content) => ts.transpileModule(content, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText
const code = transpile(script.content)
const plainTextExports = {}
runInNewContext(transpile(read("src/modules/client/utils/plain-text.ts")), { exports: plainTextExports })
const bizTagExports = {}
runInNewContext(transpile(read("src/modules/client/utils/biz-tag.ts")), {
  exports: bizTagExports,
})
const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const renderer = Vue.createRenderer({
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null,
  nextSibling: () => null,
  insertStaticContent: () => {
    const node = {}
    return [node, node]
  },
})
const packageCard = (id = "2", overrides = {}) => ({
  id,
  nameI18n: { en: `Package ${id}`, zh: `套餐 ${id}` },
  descI18n: { en: "<p>Package details</p>", zh: "<p>套餐说明</p>" },
  serviceContentTextI18n: { en: "Included services", zh: "包含服务" },
  bookingNoticeI18n: { en: "Choose dates after purchase", zh: "购买后预约" },
  salePrice: 89.25,
  originalPrice: 120,
  savedAmount: null,
  redeemTimes: 3,
  validDays: 90,
  imageUrls: [" https://example.com/a.jpg ", "https://example.com/b.jpg"],
  tags: [{ nameI18n: { en: "Popular", zh: "热门" } }],
  items: [{
    packageItemId: 20,
    skuId: 201,
    redeemTimes: 3,
    spuNameI18n: { en: "Home Cleaning", zh: "家庭清洁" },
    specI18n: [{ specTypeNameI18n: { en: "Duration", zh: "时长" }, specValueNameI18n: { en: "2 hours", zh: "2小时" } }],
  }],
  ...overrides,
})

async function harness(t, overrides = {}) {
  const calls = { details: [], addPackage: [], createOrder: [], cartOptions: [], checkout: [], removeItems: [], push: [], back: 0, clearAuth: 0, messages: [], errors: [], renderErrors: [], timers: [] }
  const locale = Vue.ref("en")
  const route = Vue.reactive({ params: { id: "2" }, fullPath: "/packages/2" })
  const auth = { isLoggedIn: false, isExpired: false, ...overrides.auth }
  const controls = {
    packageDetail: overrides.packageDetail || (async (id) => packageCard(id)),
    addPackage: overrides.addPackage || (async () => ({ cartItemId: "cart-package-2" })),
    createOrder: overrides.createOrder || (async () => "42"),
    checkout: overrides.checkout || (async () => ({
      payment: { clientSecret: "test-secret", customerSessionClientSecret: "test-customer-session" },
      orderNos: ["MOCK-ORDER"], orderIds: ["mock-order-id"], totalAmount: 93.71,
    })),
  }
  const translate = (key, params = {}) => `${key}${Object.keys(params).length ? `:${JSON.stringify(params)}` : ""}`
  const browser = {
    location: { href: "http://localhost:5173/h5/#/packages/2" },
    history: { state: {} },
    setTimeout(callback) { calls.timers.push(callback); return calls.timers.length },
  }
  const exports = {}
  runInNewContext(code, {
    exports,
    window: browser,
    console: { ...console, error: (...args) => calls.errors.push(args), warn: (...args) => calls.errors.push(args) },
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "vue-i18n") return { useI18n: () => ({ t: translate, locale }) }
      if (name === "vue-router") return {
        useRoute: () => route,
        useRouter: () => ({ push: async (to) => { calls.push.push(clone(to)) }, back: () => { calls.back += 1 } }),
      }
      if (name === "element-plus") return {
        ElDialog: {},
        ElMessage: Object.fromEntries(["warning", "success", "error", "info"].map((type) => [type, (message) => calls.messages.push({ type, message })])),
      }
      if (name === "@/modules/client/api") return {
        packageDetail: async (id) => { calls.details.push(id); return controls.packageDetail(id) },
        createPackageOrder: async (id) => { calls.createOrder.push(id); return controls.createOrder(id) },
        checkoutCart: async (...args) => { calls.checkout.push(clone(args)); return controls.checkout(...args) },
      }
      if (name === "@/modules/client/composables/useCart") return { useCart: (options) => { calls.cartOptions.push(clone(options)); return {
        cartCount: Vue.ref(3),
        addPackage: async (id) => { calls.addPackage.push(id); return controls.addPackage(id) },
        removeItems: async (ids) => { calls.removeItems.push(clone(ids)) },
      } } }
      if (name === "@/utils/auth-state") return {
        getStoredAuthSnapshot: () => ({ ...auth }),
        clearStoredAuthState: () => { calls.clearAuth += 1 },
      }
      if (name === "@/modules/client/utils/biz-tag") return bizTagExports
      if (name === "@/modules/client/utils/plain-text") return plainTextExports
      if (name.endsWith(".vue") || name.includes("/style/")) return {}
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp(
    { ...exports.default, render: overrides.renderTemplate || (() => null) },
    { platform: overrides.platform || "client" },
  )
  if (overrides.renderTemplate) {
    app.component("RouterLink", {
      setup: (_props, { slots }) => () => Vue.h("a", slots.default?.()),
    })
    app.config.errorHandler = (error) => calls.renderErrors.push(error)
  }
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  return { state: instance.$.setupState, route, locale, auth, browser, calls, controls }
}

test("PC package details compile with the ordinary product-detail stylesheet, tabs and persistent action footer", () => {
  const product = parse(read("src/modules/client/pages/product-detail.vue")).descriptor
  assert.ok(descriptor.styles.some((style) => style.src === product.styles[0].src))
  const result = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: "package-detail-parity-test",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(result.errors, [])
  assert.match(descriptor.template.content, /role="tablist"/)
  assert.match(descriptor.template.content, /role="tabpanel"/)
  assert.match(descriptor.template.content, /class="booking-card__scroll"/)
  assert.match(descriptor.template.content, /class="booking-card__footer"/)
  assert.match(descriptor.template.content, /<del>AED \{\{ view\.original \}\}<\/del>/)
  assert.match(descriptor.template.content, /<PackageDetailMobile[\s\S]+?v-if="props\.platform === 'h5'"/)
})

test("loaded PC package executes the compiled template without missing setup bindings", async (t) => {
  const result = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: "package-detail-runtime-render-test",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(result.errors, [])
  const templateExports = {}
  runInNewContext(transpile(result.code), {
    exports: templateExports,
    require: (name) => {
      if (name === "vue") return Vue
      throw new Error(`Unexpected template dependency: ${name}`)
    },
  })

  const { state, calls } = await harness(t, {
    renderTemplate: templateExports.render,
  })
  assert.equal(state.loading, false)
  assert.equal(state.missing, false)
  assert.equal(state.view.title, "Package 2")
  assert.equal(state.formatAed(state.view.saleAmount), "AED 89.25")
  assert.deepEqual(calls.renderErrors, [])
})

test("H5 package details compile with ordinary H5 detail styling and safe fixed actions", () => {
  const path = "src/modules/h5/components/PackageDetailMobile.vue"
  const mobile = parse(read(path), { filename: path }).descriptor
  const product = parse(read("src/modules/h5/pages/product-detail.vue")).descriptor
  const mobileScript = compileScript(mobile, { id: "h5-package-detail-parity-test" })
  const result = compileTemplate({
    source: mobile.template.content,
    filename: path,
    id: "h5-package-detail-parity-test",
    compilerOptions: { bindingMetadata: mobileScript.bindings },
  })
  assert.deepEqual(result.errors, [])
  assert.ok(mobile.styles.some((style) => style.src === product.styles[0].src))
  const stylesheet = read("src/modules/h5/styles/product-detail.scss")
  assert.match(stylesheet, /\.h5-detail-bottom\s*\{[^}]*position:\s*fixed/)
  assert.match(stylesheet, /safe-area-inset-bottom/)
  assert.match(mobile.template.content, /class="h5-detail-topbar"/)
  assert.match(mobile.template.content, /<van-swipe\b/)
  assert.match(mobile.template.content, /<footer class="h5-detail-bottom">/)
  assert.match(mobile.template.content, /:disabled="!purchasable \|\| busy"/)
  assert.match(mobile.template.content, /emit\('add-to-cart'\)/)
  assert.match(mobile.template.content, /emit\('checkout'\)/)
  assert.match(mobile.template.content, /view\.original/)
  assert.match(mobile.template.content, /view\.save/)
  assert.doesNotMatch(mobileScript.content, /checkoutCart|addPackageToCart|useRouter/)
})

test("package view preserves original price, calculated savings, redemption and 5% VAT", async (t) => {
  const { state } = await harness(t)
  assert.equal(state.view.original, "120")
  assert.match(state.view.save, /30\.75/)
  assert.equal(state.view.saleAmount, 89.25)
  assert.equal(state.view.vat, 4.46)
  assert.equal(state.view.total, 93.71)
  assert.match(state.view.perVisit, /29\.75/)
  assert.match(state.view.validDays, /90/)
  assert.equal(state.view.items[0].name, "Home Cleaning")
  assert.equal(state.view.items[0].spec, "Duration: 2 hours")
  assert.match(state.view.items[0].times, /3/)
  assert.equal(state.cartCount, 3)
  assert.equal(state.loading, false)
  assert.equal(state.missing, false)
})

test("missing, empty, invalid or negative sale price is unavailable rather than free", async (t) => {
  const { state, controls } = await harness(t)
  for (const salePrice of [null, undefined, "", "   ", "invalid", -1]) {
    controls.packageDetail = async () => packageCard("3", { salePrice })
    await state.load("3")
    assert.equal(state.view, null, `salePrice ${String(salePrice)}`)
    assert.equal(state.missing, true)
    assert.equal(state.loading, false)
  }
  controls.packageDetail = async () => packageCard("3", { salePrice: 0 })
  await state.load("3")
  assert.equal(state.view.saleAmount, 0)
  assert.equal(state.missing, false)
})

test("locale switch updates package, content, tags and redemption labels without another request", async (t) => {
  const { state, locale, calls } = await harness(t)
  locale.value = "zh"
  await flush()
  assert.equal(state.view.title, "套餐 2")
  assert.equal(state.view.descHtml, "<p>套餐说明</p>")
  assert.equal(state.view.aboutHtml, "<p>包含服务</p>")
  assert.equal(state.view.noticeHtml, "<p>购买后预约</p>")
  assert.deepEqual(clone(state.view.tags), ["热门"])
  assert.equal(state.view.items[0].spec, "时长: 2小时")
  assert.deepEqual(calls.details, ["2"])
})

test("gallery wraps in both directions and tab keyboard navigation has matching focus", async (t) => {
  const { state } = await harness(t)
  assert.equal(state.heroImage, "https://example.com/a.jpg")
  state.showPreviousImage()
  assert.equal(state.heroImage, "https://example.com/b.jpg")
  state.showNextImage()
  assert.equal(state.selectedImageIndex, 0)
  assert.deepEqual(clone(state.detailTabs.map((tab) => tab.key)), ["description", "includes", "notice", "reviews"])
  const focus = []
  const key = (keyName, current) => state.handleDetailTabKeydown({
    key: keyName,
    preventDefault: () => focus.push("prevent"),
    currentTarget: { closest: () => ({ querySelector: (selector) => ({ focus: () => focus.push(selector) }) }) },
  }, current)
  key("ArrowLeft", "description")
  assert.equal(state.activeDetailTab, "reviews")
  key("Home", "reviews")
  assert.equal(state.activeDetailTab, "description")
  key("ArrowRight", "description")
  assert.equal(state.activeDetailTab, "includes")
  key("End", "includes")
  assert.equal(state.activeDetailTab, "reviews")
  assert.equal(focus.at(-1), "#package-detail-tab-reviews")
})

test("a newer route wins when older details arrive later, resetting transient UI", async (t) => {
  const old = deferred()
  const fresh = deferred()
  const { state, route } = await harness(t, { packageDetail: (id) => id === "2" ? old.promise : fresh.promise })
  assert.equal(state.loading, true)
  assert.equal(state.busy, true)
  state.selectedImageIndex = 1
  state.activeDetailTab = "notice"
  route.params.id = "3"
  route.fullPath = "/packages/3"
  await flush()
  assert.equal(state.selectedImageIndex, 0)
  assert.equal(state.activeDetailTab, "description")
  fresh.resolve(packageCard("3"))
  await flush()
  assert.equal(state.view.title, "Package 3")
  old.resolve(packageCard("2"))
  await flush()
  assert.equal(state.view.title, "Package 3")
  assert.equal(state.loading, false)
  assert.equal(state.missing, false)
})

test("an obsolete request failure cannot replace a successful current package", async (t) => {
  const old = deferred()
  const { state, route } = await harness(t, { packageDetail: (id) => id === "2" ? old.promise : Promise.resolve(packageCard(id)) })
  route.params.id = "4"
  await flush()
  old.reject(new Error("obsolete request failure"))
  await flush()
  assert.equal(state.view.title, "Package 4")
  assert.equal(state.missing, false)
  assert.equal(state.loading, false)
})

test("current failures and absent route IDs expose unavailable state without mutations", async (t) => {
  const { state, controls, calls } = await harness(t)
  controls.packageDetail = async () => { throw new Error("not found") }
  await state.load("404")
  assert.equal(state.missing, true)
  assert.equal(state.loading, false)
  assert.equal(state.view, null)
  await state.addToCart()
  await state.openCheckout()
  await state.load("")
  assert.equal(state.missing, true)
  assert.equal(state.loading, false)
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.checkout, [])
})

for (const [platform, loginName, cartName, confirmName] of [
  ["client", "login", "cart", "order-confirm"],
  ["h5", "h5-login", "h5-cart", "h5-order-confirm"],
]) {
  test(`${platform} requires login and preserves the package detail return route`, async (t) => {
    const { state, calls, auth } = await harness(t, { platform, auth: { isExpired: true } })
    await state.addToCart()
    assert.equal(calls.clearAuth, 1)
    assert.deepEqual(calls.push, [{ name: loginName, query: { redirect: "/packages/2" } }])
    assert.deepEqual(calls.addPackage, [])
    auth.isExpired = false
    await state.openCheckout()
    assert.deepEqual(calls.createOrder, [])
    assert.deepEqual(calls.checkout, [])
  })

  test(`${platform} adds a package, never a SKU, and opens its own cart`, async (t) => {
    const { state, calls } = await harness(t, { platform, auth: { isLoggedIn: true } })
    await state.addToCart()
    assert.deepEqual(calls.addPackage, ["2"])
    assert.deepEqual(calls.push, [{ name: cartName }])
    assert.deepEqual(calls.checkout, [])
    assert.equal(state.adding, false)
  })

  test(`${platform} immediate checkout creates a package order and opens ordinary order confirmation without cart or payment calls`, async (t) => {
    const { state, calls } = await harness(t, { platform, auth: { isLoggedIn: true } })
    await state.openCheckout()
    assert.deepEqual(calls.createOrder, ["2"])
    assert.deepEqual(calls.addPackage, [])
    assert.deepEqual(calls.checkout, [])
    assert.deepEqual(calls.cartOptions, [{ initialize: false }])
    assert.equal(calls.push.at(-1).name, confirmName)
    assert.equal(calls.push.at(-1).query.mode, "package")
    assert.equal(calls.push.at(-1).query.packageId, "2")
    assert.equal(calls.push.at(-1).query.orderId, "42")
    assert.equal(calls.push.at(-1).query.title, "Package 2")
    assert.equal(calls.push.at(-1).query.subtotal, "89.25")
    assert.equal(calls.push.at(-1).query.tax, "4.46")
    assert.equal(calls.push.at(-1).query.total, "93.71")
    assert.deepEqual(JSON.parse(calls.push.at(-1).query.imageUrls), ["https://example.com/a.jpg", "https://example.com/b.jpg"])
    assert.equal(state.buying, false)
  })
}

test("H5 back honors browser history and has a package-list fallback", async (t) => {
  const { state, browser, calls } = await harness(t, { platform: "h5" })
  state.goBack()
  assert.deepEqual(calls.push, [{ name: "h5-packages" }])
  browser.history.state.back = "/packages"
  state.goBack()
  assert.equal(calls.back, 1)
})

test("in-flight add and checkout failures restore actionable state and show the actual error", async (t) => {
  const gate = deferred()
  const { state, calls, controls } = await harness(t, {
    auth: { isLoggedIn: true },
    addPackage: () => gate.promise,
  })
  const pending = state.addToCart()
  await flush()
  assert.equal(state.busy, true)
  await state.addToCart()
  await state.openCheckout()
  assert.deepEqual(calls.addPackage, ["2"])
  gate.reject(new Error("Cart service unavailable"))
  await pending
  assert.equal(state.busy, false)
  assert.equal(calls.messages.at(-1).message, "Cart service unavailable")
  controls.addPackage = async () => ({ cartItemId: "mock-cart-id" })
  controls.createOrder = async () => { throw new Error("Package order unavailable") }
  await state.openCheckout()
  assert.equal(state.buying, false)
  assert.equal(calls.messages.at(-1).message, "Package order unavailable")
})

test("synchronous repeated add clicks cannot race the asynchronous login check", async (t) => {
  const gate = deferred()
  const { state, calls } = await harness(t, { auth: { isLoggedIn: true }, addPackage: () => gate.promise })
  const first = state.addToCart()
  const second = state.addToCart()
  await flush()
  assert.deepEqual(calls.addPackage, ["2"])
  gate.resolve({ cartItemId: "mock-cart-id" })
  await Promise.all([first, second])
  assert.equal(calls.push.length, 1)
})

test("navigation during login resolution cannot add or checkout a different package", async (t) => {
  const { state, route, calls } = await harness(t, { auth: { isLoggedIn: true } })
  const adding = state.addToCart()
  const opening = state.openCheckout()
  route.params.id = "3"
  route.fullPath = "/packages/3"
  await Promise.all([adding, opening])
  await flush()
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.checkout, [])
  assert.deepEqual(calls.createOrder, [])
})

test("synchronous repeated direct-purchase clicks create only one order", async (t) => {
  const gate = deferred()
  const { state, calls } = await harness(t, { auth: { isLoggedIn: true }, createOrder: () => gate.promise })
  const first = state.openCheckout()
  const second = state.openCheckout()
  await flush()
  assert.deepEqual(calls.createOrder, ["2"])
  assert.equal(state.busy, true)
  gate.resolve("42")
  await Promise.all([first, second])
  assert.equal(calls.push.length, 1)
  assert.equal(state.buying, false)
})

test("invalid create-order responses never open payment confirmation", async (t) => {
  const { state, controls, calls } = await harness(t, { auth: { isLoggedIn: true } })
  for (const value of [null, undefined, "", 0, -1, "not-an-order", {}]) {
    controls.createOrder = async () => value
    await state.openCheckout()
    assert.equal(state.buying, false)
  }
  assert.deepEqual(calls.push, [])
  assert.deepEqual(calls.addPackage, [])
  assert.equal(calls.messages.length, 7)
})

test("navigation during direct order creation does not reopen a stale package checkout", async (t) => {
  const gate = deferred()
  const { state, calls, route } = await harness(t, { auth: { isLoggedIn: true }, createOrder: () => gate.promise })
  const pending = state.openCheckout()
  await flush()
  route.params.id = "3"
  await flush()
  gate.resolve("42")
  await pending
  assert.deepEqual(calls.push, [])
  assert.equal(state.view.title, "Package 3")
  assert.equal(state.buying, false)
})

for (const platform of ["client", "h5"]) {
  test(`${platform} package checkout sends plain multilingual titles instead of rich-text markup`, async (t) => {
    const { state, calls } = await harness(t, {
      platform,
      auth: { isLoggedIn: true },
      packageDetail: async () => packageCard("2", {
        nameI18n: { en: "<p>Massage <strong>3 visits</strong></p>", zh: "<p>柔式上门按摩3次</p>" },
      }),
    })
    assert.equal(state.view.title, "Massage 3 visits")
    await state.openCheckout()
    const query = calls.push.at(-1).query
    assert.equal(query.title, "Massage 3 visits")
    assert.deepEqual(JSON.parse(query.titleI18n), { en: "Massage 3 visits", zh: "柔式上门按摩3次" })
    assert.deepEqual(calls.addPackage, [])
    assert.deepEqual(calls.checkout, [])
  })
}
