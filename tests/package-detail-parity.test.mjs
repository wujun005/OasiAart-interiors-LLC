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
const sharedSpecExports = {}
runInNewContext(transpile(read("src/modules/client/utils/package-shared-specs.ts")), {
  exports: sharedSpecExports,
})
const specIdentityExports = {}
runInNewContext(transpile(read("src/modules/client/utils/package-spec-identity.ts")), {
  exports: specIdentityExports,
})
const packageVisitExports = {}
runInNewContext(transpile(read("src/modules/client/utils/package-visits.ts")), {
  exports: packageVisitExports,
})
const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let index = 0; index < 32; index += 1) await Promise.resolve()
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
  displaySalePrice: 89.25,
  displayTotalPrice: 120,
  displaySavedPrice: null,
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

const packageQuote = (overrides = {}) => ({
  originalPrice: 120,
  salePrice: 89.25,
  savedPrice: 30.75,
  taxPrice: 4.46,
  totalPriceWithTax: 93.71,
  discount: 0.74375,
  ...overrides,
})

async function harness(t, overrides = {}) {
  const calls = { prices: [], details: [], products: [], addPackage: [], packageSelections: [], createOrder: [], orderSelections: [], cartOptions: [], checkout: [], removeItems: [], push: [], back: 0, clearAuth: 0, messages: [], errors: [], renderErrors: [], timers: [] }
  const locale = Vue.ref("en")
  const route = Vue.reactive({ params: { id: "2" }, fullPath: "/packages/2" })
  const auth = { isLoggedIn: false, isExpired: false, ...overrides.auth }
  const controls = {
    packageDetail: overrides.packageDetail || (async (id) => packageCard(id)),
    productDetail: overrides.productDetail || (async () => null),
    packagePrice: overrides.packagePrice || (async () => packageQuote()),
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
        getProductDetail: async (id) => { calls.products.push(id); return controls.productDetail(id) },
        packagePrice: async (payload) => { calls.prices.push(clone(payload)); return controls.packagePrice(payload) },
        createPackageOrder: async (id, selections = []) => { calls.createOrder.push(id); calls.orderSelections.push(clone(selections)); return controls.createOrder(id) },
        checkoutCart: async (...args) => { calls.checkout.push(clone(args)); return controls.checkout(...args) },
      }
      if (name === "@/modules/client/composables/useCart") return { useCart: (options) => { calls.cartOptions.push(clone(options)); return {
        cartCount: Vue.ref(3),
        addPackage: async (id, selections = []) => { calls.addPackage.push(id); calls.packageSelections.push(clone(selections)); return controls.addPackage(id) },
        removeItems: async (ids) => { calls.removeItems.push(clone(ids)) },
      } } }
      if (name === "@/utils/auth-state") return {
        getStoredAuthSnapshot: () => ({ ...auth }),
        clearStoredAuthState: () => { calls.clearAuth += 1 },
      }
      if (name === "@/modules/client/utils/biz-tag") return bizTagExports
      if (name === "@/modules/client/utils/plain-text") return plainTextExports
      if (name === "@/modules/client/utils/package-shared-specs") return sharedSpecExports
      if (name === "@/modules/client/utils/package-spec-identity") return specIdentityExports
      if (name === "@/modules/client/utils/package-visits") return packageVisitExports
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
  assert.match(descriptor.template.content, /class="package-visit-note"[\s\S]*class="booking-summary"/)
  assert.doesNotMatch(descriptor.template.content, /booking-card__section-heading[\s\S]{0,240}visitLater/)
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
  assert.match(mobile.template.content, /class="h5-package-booking-note"[\s\S]*client\.productDetail\.booking\.subtotal/)
  assert.doesNotMatch(mobile.template.content, /h5-package-booking-note[\s\S]*PackageSharedSpecs/)
  assert.doesNotMatch(mobileScript.content, /checkoutCart|addPackageToCart|useRouter/)
})

test("package view uses server original price, savings and tax while preserving redemption details", async (t) => {
  const { state, calls } = await harness(t)
  assert.deepEqual(calls.prices, [{ packageId: "2", selections: [] }])
  assert.equal(state.priceReady, true)
  assert.equal(state.view.original, "120")
  assert.match(state.view.save, /30\.75/)
  assert.equal(state.view.saleAmount, 89.25)
  assert.equal(state.view.vat, 4.46)
  assert.equal(state.view.total, 93.71)
  assert.match(state.view.perVisit, /29\.75/)
  assert.match(state.view.validDays, /90/)
  assert.equal(state.view.items[0].name, "Home Cleaning")
  assert.equal(state.view.items[0].spec, "Duration: 2 hours")
  assert.equal(state.view.items[0].options.length, 0)
  assert.equal(state.view.items[0].selectedSkuId, "")
  assert.match(state.view.items[0].times, /3/)
  assert.equal(state.cartCount, 3)
  assert.equal(state.loading, false)
  assert.equal(state.missing, false)
})

test("package visit count uses the longest included service when a shorter service shares that visit", async (t) => {
  const { state } = await harness(t, {
    packageDetail: async (id) => packageCard(id, {
      redeemTimes: 5,
      items: [
        { packageItemId: 20, spuId: 12, bindType: 1, redeemTimes: 4, spuNameI18n: { en: "Home Cleaning", zh: "家庭清洁" }, skuOptions: [] },
        { packageItemId: 21, spuId: 13, bindType: 1, redeemTimes: 1, spuNameI18n: { en: "AC Cleaning", zh: "空调清洁" }, skuOptions: [] },
      ],
    }),
  })
  assert.match(state.view.visits, /"count":4/)
  assert.match(state.view.items[0].times, /"count":4/)
  assert.match(state.view.items[1].times, /"count":1/)
})

test("package detail lists every service option and submits the chosen sku", async (t) => {
  const { state, calls } = await harness(t, {
    auth: { isLoggedIn: true },
    packageDetail: async (id) => packageCard(id, {
      items: [{
        packageItemId: 20,
        spuId: 12,
        bindType: 1,
        redeemTimes: 3,
        spuNameI18n: { en: "Home Cleaning", zh: "家庭清洁" },
        skuOptions: [
          { skuId: 201, specI18n: [{ specTypeNameI18n: { en: "Duration" }, specValueNameI18n: { en: "2 hours" } }] },
          { skuId: 202, specI18n: [{ specTypeNameI18n: { en: "Furniture" }, specValueNameI18n: { en: "With furniture" } }] },
        ],
      }],
    }),
  })
  assert.equal(state.view.items[0].spec, "")
  assert.deepEqual(state.view.items[0].options.map((option) => option.label), ["Duration: 2 hours", "Furniture: With furniture"])
  assert.equal(state.view.items[0].selectedSkuId, "201")
  assert.equal(state.view.items[0].groups.map((group) => group.label).join("|"), "Duration|Furniture")
  state.selectSku("20", "202")
  await flush()
  assert.equal(state.view.items[0].selectedSkuId, "202")
  state.selectSku("20", "999")
  assert.equal(state.view.items[0].selectedSkuId, "202")
  await state.addToCart()
  await state.openCheckout()
  const selection = [{ packageItemId: 20, spuId: 12, skuId: 202 }]
  assert.deepEqual(calls.packageSelections, [selection])
  assert.deepEqual(calls.orderSelections, [selection])
})

test("package detail selects each pricing type separately and resolves one sku", async (t) => {
  const line = (type, value) => ({ specTypeNameI18n: { en: type }, specValueNameI18n: { en: value } })
  const { state, calls } = await harness(t, {
    auth: { isLoggedIn: true },
    packageDetail: async (id) => packageCard(id, {
      items: [{
        packageItemId: 20,
        spuId: 12,
        bindType: 1,
        redeemTimes: 1,
        spuNameI18n: { en: "Home Cleaning" },
        skuOptions: [
          { skuId: 1, specI18n: [line("Duct AC Cleaning", "With furniture"), line("Staff", "456")] },
          { skuId: 2, specI18n: [line("Duct AC Cleaning", "With furniture"), line("Staff", "1212")] },
          { skuId: 3, specI18n: [line("Duct AC Cleaning", "Without furniture"), line("Staff", "456")] },
          { skuId: 4, specI18n: [line("Duct AC Cleaning", "Without furniture"), line("Staff", "1212")] },
        ],
      }],
    }),
  })
  const labels = (group) => group.options.map((option) => option.label).join("|")
  const selected = (group) => group.options.find((option) => option.id === group.selectedId)?.label || ""
  assert.equal(state.view.items[0].groups.map((group) => `${group.label}:${labels(group)}:${selected(group)}`).join(" || "), "Duct AC Cleaning:With furniture|Without furniture:With furniture || Staff:456|1212:456")
  state.selectSpec("20", "Duct AC Cleaning", "Duct AC Cleaning::Without furniture")
  await flush()
  assert.equal(state.view.items[0].selectedSkuId, "3")
  state.selectSpec("20", "Staff", "Staff::1212")
  await flush()
  assert.equal(state.view.items[0].selectedSkuId, "4")
  await state.openCheckout()
  assert.deepEqual(calls.orderSelections, [[{ packageItemId: 20, spuId: 12, skuId: 4 }]])
})

test("a service without a chosen option cannot be added or booked", async (t) => {
  const { state, calls } = await harness(t, {
    auth: { isLoggedIn: true },
    packageDetail: async (id) => packageCard(id, {
      items: [{ packageItemId: 20, spuId: 12, bindType: 1, redeemTimes: 1, spuNameI18n: { en: "Home Cleaning" }, skuOptions: [] }],
    }),
  })
  await state.addToCart()
  await state.openCheckout()
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.createOrder, [])
  assert.deepEqual(calls.messages.map((message) => message.type), ["warning", "warning"])
})

test("missing, empty, invalid or negative quoted sale prices are unavailable while an explicit zero quote remains valid", async (t) => {
  const { state, controls, calls } = await harness(t, { auth: { isLoggedIn: true } })
  for (const salePrice of [null, undefined, "", "   ", "invalid", -1]) {
    controls.packagePrice = async () => packageQuote({ salePrice })
    await state.loadPrice()
    await flush()
    assert.equal(state.priceQuote, null, `salePrice ${String(salePrice)}`)
    assert.equal(state.priceReady, false)
    assert.ok(state.priceError)
    assert.equal(state.view.saleAmount, null)
    assert.equal(state.missing, false)
    assert.equal(state.priceLoading, false)
    await state.addToCart()
    await state.openCheckout()
  }
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.createOrder, [])
  controls.packagePrice = async () => packageQuote({
    originalPrice: 0, salePrice: 0, savedPrice: 0, taxPrice: 0, totalPriceWithTax: 0, discount: 1,
  })
  await state.loadPrice()
  await flush()
  assert.equal(state.view.saleAmount, 0)
  assert.equal(state.priceReady, true)
  assert.equal(state.priceError, "")
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
  assert.deepEqual(calls.prices, [{ packageId: "2", selections: [] }])
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

const selectablePackageCard = (id) => packageCard(id, {
  displaySalePrice: 1,
  displayTotalPrice: 2,
  items: [{
    packageItemId: 20,
    spuId: 12,
    bindType: 1,
    redeemTimes: 3,
    spuNameI18n: { en: "Home Cleaning", zh: "家庭清洁" },
    skuOptions: [201, 202, 203].map((skuId, index) => ({
      skuId,
      specI18n: [{
        specTypeNameI18n: { en: "Duration", zh: "时长" },
        specValueNameI18n: { en: `${index + 2} hours`, zh: `${index + 2}小时` },
      }],
    })),
  }],
})
const changedQuote = () => packageQuote({ originalPrice: 250, salePrice: 170, savedPrice: 80, taxPrice: 9.2, totalPriceWithTax: 179.2, discount: 0.68 })
const latestQuote = () => packageQuote({ originalPrice: 300, salePrice: 190, savedPrice: 110, taxPrice: 10.5, totalPriceWithTax: 200.5, discount: 190 / 300 })

for (const platform of ["client", "h5"]) {
  test(`${platform} initializes and requotes selected SKUs using server totals rather than display prices or a local tax formula`, async (t) => {
    const firstQuote = packageQuote({ originalPrice: 180, salePrice: 100, savedPrice: 80, taxPrice: 7, totalPriceWithTax: 107, discount: 100 / 180 })
    const { state, calls, locale } = await harness(t, {
      platform,
      auth: { isLoggedIn: true },
      packageDetail: async (id) => selectablePackageCard(id),
      packagePrice: async ({ selections }) => selections[0]?.skuId === 202 ? changedQuote() : firstQuote,
    })
    assert.deepEqual(calls.prices, [{ packageId: "2", selections: [{ packageItemId: 20, spuId: 12, skuId: 201 }] }])
    assert.equal(state.priceReady, true)
    assert.equal(state.view.saleAmount, 100)
    assert.equal(state.view.original, "180")
    assert.equal(state.view.vat, 7)
    assert.equal(state.view.total, 107)
    state.selectSpec("20", "Duration", "Duration::3 hours")
    await flush()
    assert.equal(state.view.items[0].selectedSkuId, "202")
    assert.equal(calls.prices.length, 2)
    assert.deepEqual(calls.prices[1], { packageId: "2", selections: [{ packageItemId: 20, spuId: 12, skuId: 202 }] })
    assert.equal(state.view.saleAmount, 170)
    assert.equal(state.view.original, "250")
    assert.match(state.view.save, /80/)
    assert.equal(state.view.vat, 9.2)
    assert.equal(state.view.total, 179.2)
    locale.value = "zh"
    await flush()
    assert.equal(state.view.items[0].selectedSkuId, "202")
    assert.equal(calls.prices.length, 2)
    assert.equal(calls.details.length, 1)
    await state.openCheckout()
    assert.deepEqual(calls.orderSelections, [[{ packageItemId: 20, spuId: 12, skuId: 202 }]])
    assert.equal(calls.push.at(-1).query.subtotal, "170")
    assert.equal(calls.push.at(-1).query.tax, "9.2")
    assert.equal(calls.push.at(-1).query.total, "179.2")
  })
}

test("requote loading and failures clear previous amounts and block purchases until retry succeeds", async (t) => {
  const gate = deferred()
  const { state, controls, calls } = await harness(t, {
    auth: { isLoggedIn: true },
    packageDetail: async (id) => selectablePackageCard(id),
  })
  assert.equal(state.priceReady, true)
  controls.packagePrice = () => gate.promise
  state.selectSku("20", "202")
  await flush()
  assert.equal(state.priceLoading, true)
  assert.equal(state.busy, true)
  assert.equal(state.priceReady, false)
  assert.equal(state.priceQuote, null)
  assert.deepEqual([state.view.saleAmount, state.view.vat, state.view.total], [null, null, null])
  await state.addToCart()
  await state.openCheckout()
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.createOrder, [])
  gate.reject(new Error("Quote service unavailable"))
  await flush()
  assert.equal(state.priceLoading, false)
  assert.equal(state.busy, false)
  assert.equal(state.priceReady, false)
  assert.equal(state.priceQuote, null)
  assert.ok(state.priceError)
  assert.deepEqual([state.view.saleAmount, state.view.vat, state.view.total], [null, null, null])
  await state.addToCart()
  await state.openCheckout()
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.createOrder, [])
  controls.packagePrice = async () => changedQuote()
  await state.loadPrice()
  await flush()
  assert.equal(state.priceReady, true)
  assert.equal(state.priceError, "")
  assert.equal(state.view.total, 179.2)
  await state.addToCart()
  assert.deepEqual(calls.packageSelections, [[{ packageItemId: 20, spuId: 12, skuId: 202 }]])
})

test("the latest selected SKU quote wins when earlier selection prices arrive last", async (t) => {
  const old = deferred()
  const fresh = deferred()
  const { state, controls } = await harness(t, { packageDetail: async (id) => selectablePackageCard(id) })
  controls.packagePrice = ({ selections }) => selections[0].skuId === 202 ? old.promise : fresh.promise
  state.selectSku("20", "202")
  await flush()
  state.selectSku("20", "203")
  await flush()
  fresh.resolve(latestQuote())
  await flush()
  assert.equal(state.priceReady, true)
  assert.equal(state.view.total, 200.5)
  old.resolve(changedQuote())
  await flush()
  assert.equal(state.view.items[0].selectedSkuId, "203")
  assert.equal(state.view.total, 200.5)
  assert.equal(state.priceError, "")
})

test("route changes invalidate a pending quote from the previous package", async (t) => {
  const old = deferred()
  const { state, route, calls } = await harness(t, {
    packageDetail: async (id) => id === "2" ? selectablePackageCard(id) : packageCard(id, {
      items: [{
        packageItemId: 30, spuId: 13, bindType: 1, redeemTimes: 1,
        skuOptions: [{ skuId: 301, specI18n: [] }],
      }],
    }),
    packagePrice: ({ packageId }) => packageId === "2" ? old.promise : Promise.resolve(latestQuote()),
  })
  assert.equal(state.priceLoading, true)
  route.params.id = "3"
  route.fullPath = "/packages/3"
  await flush()
  assert.equal(state.view.title, "Package 3")
  assert.equal(state.priceReady, true)
  assert.equal(state.view.total, 200.5)
  old.resolve(packageQuote())
  await flush()
  assert.equal(state.view.title, "Package 3")
  assert.equal(state.view.total, 200.5)
  assert.deepEqual(calls.prices, [
    { packageId: "2", selections: [{ packageItemId: 20, spuId: 12, skuId: 201 }] },
    { packageId: "3", selections: [{ packageItemId: 30, spuId: 13, skuId: 301 }] },
  ])
})

test("an invalid selection clears pricing and prevents an obsolete valid quote from restoring a purchasable state", async (t) => {
  const gate = deferred()
  const { state, controls, calls } = await harness(t, {
    auth: { isLoggedIn: true },
    packageDetail: async (id) => selectablePackageCard(id),
  })
  controls.packagePrice = () => gate.promise
  state.selectSku("20", "202")
  await flush()
  const priceCalls = calls.prices.length
  state.selectedSkuIds = { "20": "not-a-valid-sku" }
  await flush()
  assert.equal(state.priceQuote, null)
  assert.equal(state.priceReady, false)
  assert.equal(calls.prices.length, priceCalls)
  gate.resolve(changedQuote())
  await flush()
  assert.equal(state.priceQuote, null)
  assert.equal(state.priceReady, false)
  assert.deepEqual([state.view.saleAmount, state.view.vat, state.view.total], [null, null, null])
  await state.addToCart()
  await state.openCheckout()
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.createOrder, [])
})

test("selection stays locked throughout pending cart and order mutations and unlocks after completion", async (t) => {
  for (const operation of ["addToCart", "openCheckout"]) {
    const gate = deferred()
    const { state, calls } = await harness(t, {
      auth: { isLoggedIn: true },
      packageDetail: async (id) => selectablePackageCard(id),
      ...(operation === "addToCart" ? { addPackage: () => gate.promise } : { createOrder: () => gate.promise }),
    })
    const pending = state[operation]()
    await flush()
    assert.equal(state.selectionLocked, true)
    const priceCalls = calls.prices.length
    state.selectSku("20", "202")
    state.selectSpec("20", "Duration", "Duration::4 hours")
    await flush()
    assert.equal(state.view.items[0].selectedSkuId, "201")
    assert.equal(calls.prices.length, priceCalls)
    const selections = operation === "addToCart" ? calls.packageSelections : calls.orderSelections
    assert.deepEqual(selections, [[{ packageItemId: 20, spuId: 12, skuId: 201 }]])
    gate.resolve(operation === "addToCart" ? { cartItemId: "mock-cart-id" } : "42")
    await pending
    assert.equal(state.selectionLocked, false)
    state.selectSku("20", "202")
    await flush()
    assert.equal(state.view.items[0].selectedSkuId, "202")
  }
})

test("changing specifications during login resolution cancels old purchase snapshots and allows the new quoted selection", async (t) => {
  const { state, calls } = await harness(t, {
    auth: { isLoggedIn: true },
    packageDetail: async (id) => selectablePackageCard(id),
  })
  const adding = state.addToCart()
  const buying = state.openCheckout()
  state.selectSpec("20", "Duration", "Duration::3 hours")
  await Promise.all([adding, buying])
  await flush()
  assert.deepEqual(calls.addPackage, [])
  assert.deepEqual(calls.createOrder, [])
  assert.equal(state.view.items[0].selectedSkuId, "202")
  assert.equal(state.priceReady, true)
  assert.deepEqual(calls.prices.at(-1).selections, [{ packageItemId: 20, spuId: 12, skuId: 202 }])
  await state.openCheckout()
  assert.deepEqual(calls.orderSelections, [[{ packageItemId: 20, spuId: 12, skuId: 202 }]])
})

const stableSpec = (typeId, valueId) => {
  const types = {
    1: { en: "Furnishing", zh: "家具" },
    2: { en: "Home size", zh: "户型" },
    3: { en: "Duration", zh: "时长" },
  }
  const values = {
    11: { en: "Unfurnished", zh: "无家具" },
    12: { en: "Furnished", zh: "带家具" },
    13: { en: "Cleaning exclusive", zh: "清洁独有" },
    14: { en: "Painting exclusive", zh: "油漆独有" },
    21: { en: "Studio", zh: "单间" },
    22: { en: "2 BHK", zh: "两居室" },
    31: { en: "2 hours", zh: "2小时" },
    32: { en: "3 hours", zh: "3小时" },
  }
  return { specTypeId: typeId, specValueId: valueId, specTypeNameI18n: types[typeId], specValueNameI18n: values[valueId] }
}
const stableSku = (skuId, furnishing, size, duration) => ({
  skuId,
  specI18n: [stableSpec(1, furnishing), stableSpec(2, size), ...(duration ? [stableSpec(3, duration)] : [])],
})
const sharedPackageCard = (id = "2", options = {}) => packageCard(id, {
  items: [{
    packageItemId: 20, spuId: 12, bindType: 1, redeemTimes: 3,
    spuNameI18n: { en: "Home Cleaning", zh: "家庭清洁" },
    skuOptions: options.cleaning || [21, 22].flatMap((size, sizeIndex) => [31, 32].flatMap((duration, durationIndex) =>
      [11, 12].map((furnishing, furnishingIndex) => stableSku(201 + sizeIndex * 4 + durationIndex * 2 + furnishingIndex, furnishing, size, duration)))),
  }, {
    packageItemId: 30, spuId: 13, bindType: 1, redeemTimes: 1,
    spuNameI18n: { en: "Home Painting", zh: "家庭油漆" },
    skuOptions: options.painting || [21, 22].flatMap((size, sizeIndex) =>
      [11, 12].map((furnishing, furnishingIndex) => stableSku(301 + sizeIndex * 2 + furnishingIndex, furnishing, size))),
  }],
})
const selectedIds = (state) => state.view.items.map((item) => item.selectedSkuId)
const expectedSharedSelections = (cleaning, painting) => [
  { packageItemId: 20, spuId: 12, skuId: cleaning },
  { packageItemId: 30, spuId: 13, skuId: painting },
]

for (const platform of ["client", "h5"]) {
  test(`${platform} shows repeated stable specifications once and atomically requotes both services while preserving local choices`, async (t) => {
    const { state, calls, locale } = await harness(t, {
      platform,
      auth: { isLoggedIn: true },
      packageDetail: async (id) => sharedPackageCard(id),
    })
    assert.equal(state.view.hasSharedSpecs, true)
    assert.equal(state.view.separateSpecs, false)
    assert.deepEqual(clone(state.view.sharedGroups.map((group) => ({ id: group.id, selectedId: group.selectedId, itemIds: group.itemIds }))), [
      { id: "type:1", selectedId: "value:11", itemIds: ["20", "30"] },
      { id: "type:2", selectedId: "value:21", itemIds: ["20", "30"] },
    ])
    assert.equal(state.view.sharedGroups[0].serviceNames, "Home Cleaning, Home Painting")
    assert.deepEqual(clone(state.view.items.map((item) => item.groups.map((group) => group.id))), [["type:3"], []])
    assert.deepEqual(calls.prices, [{ packageId: "2", selections: expectedSharedSelections(201, 301) }])
    assert.deepEqual(calls.products, [])

    state.selectSpec("20", "type:3", "value:32")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["203", "301"])
    assert.equal(calls.prices.length, 2)
    state.selectSharedSpec("type:1", "value:12")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["204", "302"])
    assert.equal(calls.prices.length, 3)
    assert.deepEqual(calls.prices.at(-1), { packageId: "2", selections: expectedSharedSelections(204, 302) })
    assert.equal(state.view.items[0].groups[0].selectedId, "value:32")
    assert.equal(state.view.items[0].sharedSummary, "Furnished · Studio")
    assert.equal(state.view.items[0].selectionSummary, "Furnishing: Furnished · Home size: Studio · Duration: 3 hours")

    locale.value = "zh"
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["204", "302"])
    assert.equal(state.view.sharedGroups[0].label, "家具")
    assert.equal(state.view.sharedGroups[0].serviceNames, "家庭清洁、家庭油漆")
    assert.equal(state.view.items[0].sharedSummary, "带家具 · 单间")
    assert.match(state.view.items[0].selectionSummary, /时长: 3小时/)
    assert.equal(calls.prices.length, 3)
    assert.equal(calls.details.length, 1)
    assert.deepEqual(calls.products, [])
    await state.openCheckout()
    assert.deepEqual(calls.orderSelections, [expectedSharedSelections(204, 302)])
  })
}

test("shared specification options disable unsupported SKU combinations and reject programmatic selection without requoting", async (t) => {
  const { state, calls } = await harness(t, {
    packageDetail: async (id) => sharedPackageCard(id, {
      cleaning: [stableSku(201, 11, 21, 31), stableSku(202, 12, 21, 31), stableSku(203, 11, 22, 31)],
      painting: [stableSku(301, 11, 21), stableSku(302, 12, 21), stableSku(303, 11, 22)],
    }),
  })
  state.selectSharedSpec("type:2", "value:22")
  await flush()
  assert.deepEqual(clone(selectedIds(state)), ["203", "303"])
  const furnishings = state.view.sharedGroups.find((group) => group.id === "type:1")
  assert.equal(furnishings.selectedId, "value:11")
  assert.equal(furnishings.options.find((option) => option.id === "value:12").disabled, true)
  const priceCount = calls.prices.length
  state.selectSharedSpec("type:1", "value:12")
  await flush()
  assert.deepEqual(clone(selectedIds(state)), ["203", "303"])
  assert.equal(calls.prices.length, priceCount)
  assert.equal(state.priceReady, true)
})

test("exclusive values stay visible before switching the remaining shared dimensions to separate settings", async (t) => {
  const { state, calls } = await harness(t, {
    packageDetail: async (id) => sharedPackageCard(id, {
      cleaning: [stableSku(201, 11, 21, 31), stableSku(202, 12, 21, 31), stableSku(203, 13, 21, 31)],
      painting: [stableSku(301, 11, 21), stableSku(302, 12, 21), stableSku(303, 14, 21)],
    }),
  })
  assert.deepEqual(clone(state.view.sharedGroups.map((group) => group.id)), ["type:2"])
  assert.deepEqual(clone(state.view.items[0].groups[0].options.map((option) => option.id)), ["value:11", "value:12", "value:13"])
  assert.deepEqual(clone(state.view.items[1].groups[0].options.map((option) => option.id)), ["value:11", "value:12", "value:14"])
  state.toggleSeparateSpecs()
  await flush()
  assert.equal(state.view.hasSharedSpecs, true)
  assert.equal(state.view.separateSpecs, true)
  assert.deepEqual(clone(state.view.sharedGroups), [])
  assert.deepEqual(clone(state.view.items.map((item) => item.groups.map((group) => group.id))), [["type:1", "type:2", "type:3"], ["type:1", "type:2"]])
  assert.deepEqual(clone(state.view.items[0].groups[0].options.map((option) => option.id)), ["value:11", "value:12", "value:13"])
  assert.deepEqual(clone(state.view.items[1].groups[0].options.map((option) => option.id)), ["value:11", "value:12", "value:14"])
  assert.deepEqual(clone(selectedIds(state)), ["201", "301"])
  assert.equal(calls.prices.length, 1)
  state.selectSpec("20", "type:1", "value:13")
  await flush()
  assert.deepEqual(clone(selectedIds(state)), ["203", "301"])
  assert.equal(calls.prices.length, 2)
  assert.deepEqual(calls.prices.at(-1).selections, expectedSharedSelections(203, 301))
})

test("matching specification labels without stable IDs remain independent service choices", async (t) => {
  const { state, calls } = await harness(t, {
    packageDetail: async (id) => {
      const card = sharedPackageCard(id)
      card.items.forEach((item) => item.skuOptions.forEach((sku) => sku.specI18n.forEach((line) => {
        delete line.specTypeId
        delete line.specValueId
      })))
      return card
    },
  })
  assert.equal(state.view.hasSharedSpecs, false)
  assert.deepEqual(clone(state.view.sharedGroups), [])
  assert.deepEqual(clone(state.view.items.map((item) => item.groups.map((group) => group.id))), [["Furnishing", "Home size", "Duration"], ["Furnishing", "Home size"]])
  state.selectSpec("20", "Furnishing", "Furnishing::Furnished")
  await flush()
  assert.deepEqual(clone(selectedIds(state)), ["202", "301"])
  assert.equal(calls.prices.length, 2)
  assert.deepEqual(calls.prices.at(-1).selections, expectedSharedSelections(202, 301))
})

// The running legacy package API returns these names without their identities;
// the public SPU detail supplies the authoritative dictionary for both services.
const legacyProductMetadata = (spuId) => ({
  id: Number(spuId),
  packageService: 1,
  specBindings: [
    { specTypeId: 350, specValueIds: [811, 810] },
    { specTypeId: 351, specValueIds: [812, 813, 814, 815] },
  ],
  specTypeNameI18n: {
    350: { en: "ApolloFurnishing" },
    351: { en: "ApolloHomeSize" },
  },
  specValueNameI18n: {
    811: { en: "Unfurnished" },
    810: { en: "Furnished" },
    812: { en: "1 BHK" },
    813: { en: "2 BHK" },
    814: { en: "3 BHK" },
    815: { en: "4 BHK" },
  },
})
const legacyPackageCard = (id, repeatSpu = false) => {
  const card = packageCard(id, {
    items: [162, 163].map((spuId, itemIndex) => {
      const metadata = legacyProductMetadata(spuId)
      return {
        packageItemId: 20 + itemIndex * 10,
        spuId,
        bindType: 1,
        redeemTimes: 1,
        spuNameI18n: { en: `Service ${spuId}` },
        skuOptions: [812, 813, 814, 815].flatMap((size, sizeIndex) => [811, 810].map((furnishing, furnishingIndex) => ({
          skuId: 201 + itemIndex * 100 + sizeIndex * 2 + furnishingIndex,
          specI18n: [[350, furnishing], [351, size]].map(([typeId, valueId]) => ({
            specTypeNameI18n: clone(metadata.specTypeNameI18n[typeId]),
            specValueNameI18n: clone(metadata.specValueNameI18n[valueId]),
          })),
        }))),
      }
    }),
  })
  if (repeatSpu) card.items.push({ ...clone(card.items[0]), packageItemId: 40 })
  return card
}
const legacySelections = (cleaning, painting, repeatSpu = false) => [
  { packageItemId: 20, spuId: 162, skuId: cleaning },
  { packageItemId: 30, spuId: 163, skuId: painting },
  ...(repeatSpu ? [{ packageItemId: 40, spuId: 162, skuId: cleaning }] : []),
]

for (const platform of ["client", "h5"]) {
  test(`${platform} keeps a service-only 4 BHK visible while sharing identical furnishing options`, async (t) => {
    const { state, calls } = await harness(t, {
      platform,
      auth: { isLoggedIn: true },
      packageDetail: async (id) => {
        const card = legacyPackageCard(id)
        // The SPU dictionary still lists four sizes, but only the second
        // service has an actual sellable 4 BHK SKU in this package response.
        card.items[0].skuOptions = card.items[0].skuOptions.filter((option) => !option.specI18n.some((line) => line.specValueNameI18n.en === "4 BHK"))
        return card
      },
      productDetail: async (spuId) => legacyProductMetadata(spuId),
    })
    assert.deepEqual(clone(state.view.sharedGroups.map((group) => group.id)), ["type:350"])
    assert.deepEqual(clone(state.view.items.map((item) => item.groups.map((group) => group.id))), [["type:351"], ["type:351"]])
    assert.deepEqual(clone(state.view.items[0].groups[0].options.map((option) => option.label)), ["1 BHK", "2 BHK", "3 BHK"])
    assert.deepEqual(clone(state.view.items[1].groups[0].options.map((option) => option.label)), ["1 BHK", "2 BHK", "3 BHK", "4 BHK"])
    assert.equal(state.view.separateSpecs, false)
    assert.equal(calls.prices.length, 1)

    state.selectSpec("30", "type:351", "value:815")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["201", "307"])
    assert.equal(calls.prices.length, 2)
    state.selectSharedSpec("type:350", "value:810")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["202", "308"])
    assert.equal(state.view.items[1].groups[0].selectedId, "value:815")
    assert.equal(calls.prices.length, 3)
    assert.deepEqual(calls.prices.at(-1).selections, legacySelections(202, 308))

    state.selectSpec("20", "type:351", "value:813")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["204", "308"])
    assert.equal(state.view.items[1].groups[0].selectedId, "value:815")
    await state.openCheckout()
    assert.deepEqual(calls.orderSelections, [legacySelections(204, 308)])
  })
}

for (const platform of ["client", "h5"]) {
  test(`${platform} hydrates missing package identities from each SPU once before one initial quote`, async (t) => {
    const { state, calls, locale } = await harness(t, {
      platform,
      packageDetail: async (id) => legacyPackageCard(id, true),
      productDetail: async (spuId) => legacyProductMetadata(spuId),
    })
    assert.deepEqual(calls.products.slice().sort(), ["162", "163"])
    assert.equal(state.loading, false)
    assert.equal(state.priceReady, true)
    assert.equal(state.view.hasSharedSpecs, true)
    assert.deepEqual(clone(state.view.sharedGroups.map((group) => ({ id: group.id, selectedId: group.selectedId, itemIds: group.itemIds }))), [
      { id: "type:350", selectedId: "value:811", itemIds: ["20", "30", "40"] },
      { id: "type:351", selectedId: "value:812", itemIds: ["20", "30", "40"] },
    ])
    assert.deepEqual(clone(state.view.items.map((item) => item.groups)), [[], [], []])
    assert.deepEqual(calls.prices, [{ packageId: "2", selections: legacySelections(201, 301, true) }])
    state.selectSharedSpec("type:350", "value:810")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["202", "302", "202"])
    assert.equal(calls.prices.length, 2)
    assert.deepEqual(calls.prices.at(-1).selections, legacySelections(202, 302, true))
    locale.value = "zh"
    await flush()
    assert.equal(state.view.sharedGroups[0].selectedId, "value:810")
    assert.equal(calls.prices.length, 2)
    assert.equal(calls.products.length, 2)
  })
}

test("failed or ambiguous SPU metadata preserves independent service choices and usable package pricing", async (t) => {
  for (const scenario of ["failed", "ambiguous"]) {
    const { state, calls } = await harness(t, {
      packageDetail: async (id) => legacyPackageCard(id),
      productDetail: async (spuId) => {
        if (scenario === "failed") throw new Error("Metadata unavailable")
        const record = legacyProductMetadata(spuId)
        for (const [original, duplicate] of [[350, 352], [351, 353]]) {
          record.specBindings.push({ specTypeId: duplicate, specValueIds: record.specBindings.find((binding) => binding.specTypeId === original).specValueIds.slice() })
          record.specTypeNameI18n[duplicate] = clone(record.specTypeNameI18n[original])
        }
        return record
      },
    })
    assert.equal(state.loading, false, scenario)
    assert.equal(state.missing, false, scenario)
    assert.equal(state.priceReady, true, scenario)
    assert.equal(state.view.hasSharedSpecs, false, scenario)
    assert.deepEqual(clone(state.view.items.map((item) => item.groups.map((group) => group.id))), [
      ["ApolloFurnishing", "ApolloHomeSize"], ["ApolloFurnishing", "ApolloHomeSize"],
    ], scenario)
    assert.equal(calls.prices.length, 1, scenario)
    state.selectSpec("20", "ApolloFurnishing", "ApolloFurnishing::Furnished")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["202", "301"], scenario)
    assert.equal(calls.prices.length, 2, scenario)
    assert.deepEqual(calls.prices.at(-1).selections, legacySelections(202, 301), scenario)
  }
})

test("a route change during identity hydration cannot restore old service selections or issue an old package quote", async (t) => {
  const gate = deferred()
  const { state, route, calls } = await harness(t, {
    packageDetail: async (id) => id === "2" ? legacyPackageCard(id) : sharedPackageCard(id),
    productDetail: async (spuId) => { await gate.promise; return legacyProductMetadata(spuId) },
  })
  assert.equal(state.loading, true)
  assert.equal(state.priceReady, false)
  assert.deepEqual(calls.prices, [])
  route.params.id = "3"
  route.fullPath = "/packages/3"
  await flush()
  assert.equal(state.view.title, "Package 3")
  assert.deepEqual(clone(state.view.sharedGroups.map((group) => group.id)), ["type:1", "type:2"])
  assert.deepEqual(calls.prices, [{ packageId: "3", selections: expectedSharedSelections(201, 301) }])
  gate.resolve()
  await flush()
  assert.equal(state.view.title, "Package 3")
  assert.equal(state.priceReady, true)
  assert.deepEqual(clone(state.view.sharedGroups.map((group) => group.id)), ["type:1", "type:2"])
  assert.deepEqual(clone(selectedIds(state)), ["201", "301"])
  assert.deepEqual(calls.prices, [{ packageId: "3", selections: expectedSharedSelections(201, 301) }])
})

for (const platform of ["client", "h5"]) {
  test(`${platform} shares only the repeated dimension across its participating services and preserves every local dimension`, async (t) => {
    const serviceSpecs = [
      { name: "Home Cleaning", furnishingType: 350, furnishingValues: [811, 810], homeType: 351, homeValues: [812, 813], homeLabels: ["1 BHK", "2 BHK"] },
      { name: "Home Painting", furnishingType: 350, furnishingValues: [811, 810], homeType: 352, homeValues: [821, 822], homeLabels: ["3 BHK", "4 BHK"] },
      { name: "Carpet Cleaning", furnishingType: 353, furnishingValues: [831, 832], homeType: 354, homeValues: [841, 842], homeLabels: ["Studio", "Villa"] },
    ]
    const { state, calls } = await harness(t, {
      platform,
      packageDetail: async (id) => packageCard(id, {
        items: serviceSpecs.map((service, index) => ({
          packageItemId: 20 + index * 10,
          spuId: 162 + index,
          bindType: 1,
          redeemTimes: 1,
          spuNameI18n: { en: service.name },
          skuOptions: service.homeValues.flatMap((homeValue, homeIndex) => service.furnishingValues.map((furnishingValue, furnishingIndex) => ({
            skuId: 201 + index * 100 + homeIndex * 2 + furnishingIndex,
            specI18n: [{
              specTypeId: service.furnishingType, specValueId: furnishingValue,
              specTypeNameI18n: { en: "Furnishing" }, specValueNameI18n: { en: furnishingIndex ? "Furnished" : "Unfurnished" },
            }, {
              specTypeId: service.homeType, specValueId: homeValue,
              specTypeNameI18n: { en: "Home size" }, specValueNameI18n: { en: service.homeLabels[homeIndex] },
            }],
          }))),
        })),
      }),
    })
    assert.deepEqual(clone(state.view.sharedGroups.map((group) => ({ id: group.id, itemIds: group.itemIds, serviceNames: group.serviceNames }))), [
      { id: "type:350", itemIds: ["20", "30"], serviceNames: "Home Cleaning, Home Painting" },
    ])
    assert.deepEqual(clone(state.view.items.map((item) => item.groups.map((group) => group.id))), [
      ["type:351"], ["type:352"], ["type:353", "type:354"],
    ])
    assert.equal(state.view.items[2].sharedSummary, "")
    assert.equal(calls.prices.length, 1)
    assert.deepEqual(calls.products, [])

    state.selectSpec("20", "type:351", "value:813")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["203", "301", "401"])
    state.selectSharedSpec("type:350", "value:810")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["204", "302", "401"])
    assert.deepEqual(clone(state.view.items.map((item) => item.groups.at(-1).selectedId)), ["value:813", "value:821", "value:841"])
    assert.match(state.view.items[0].selectionSummary, /Home size: 2 BHK/)
    assert.match(state.view.items[1].selectionSummary, /Home size: 3 BHK/)
    assert.equal(calls.prices.length, 3)
    assert.deepEqual(calls.prices.at(-1).selections, [
      { packageItemId: 20, spuId: 162, skuId: 204 },
      { packageItemId: 30, spuId: 163, skuId: 302 },
      { packageItemId: 40, spuId: 164, skuId: 401 },
    ])

    state.selectSpec("40", "type:353", "value:832")
    await flush()
    assert.deepEqual(clone(selectedIds(state)), ["204", "302", "402"])
    assert.equal(state.view.sharedGroups[0].selectedId, "value:810")
    assert.equal(calls.prices.length, 4)
  })
}
