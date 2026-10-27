import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { compileScript, parse } from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"

// Mount the real management SFC with real Vue reactivity and pricing helpers.
// Only API, editor, auth, and tag-picker boundaries are mocked.
const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")
const transpile = (content) =>
  ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
const compile = (filename, inlineTemplate = false) => {
  const { descriptor, errors } = parse(read(filename), { filename })
  assert.deepEqual(errors, [])
  return transpile(compileScript(descriptor, {
    id: "package-service-management-test",
    inlineTemplate,
  }).content)
}
const code = compile("src/modules/admin/pages/product/index.vue")
const wrapperCode = compile("src/modules/admin/pages/package-service/index.vue", true)
const realModule = (filename) => {
  const exports = {}
  runInNewContext(transpile(read(filename)), { exports })
  return exports
}
const pricing = realModule("src/modules/admin/utils/skuPriceTable.ts")
const i18n = realModule("src/modules/admin/utils/i18n.ts")
const clone = (value) => JSON.parse(JSON.stringify(value))
const flush = async () => {
  for (let index = 0; index < 24; index += 1) await Promise.resolve()
  await Vue.nextTick()
}
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
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
const pageResult = (list) => ({ data: { list, total: list.length } })
const specTypes = [
  { specType: { id: 10, categoryId: 21, priced: 0 }, nameI18n: { en: "Rooms" } },
  { specType: { id: 11, categoryId: 21, priced: 1 }, nameI18n: { en: "Furniture" } },
]
const specValues = [
  { specValue: { id: 101, specTypeId: 10, categoryId: 21 }, nameI18n: { en: "Studio" } },
  { specValue: { id: 102, specTypeId: 10, categoryId: 21 }, nameI18n: { en: "Two rooms" } },
  { specValue: { id: 111, specTypeId: 11, categoryId: 21, price: 25 }, nameI18n: { en: "Furnished" } },
  { specValue: { id: 112, specTypeId: 11, categoryId: 21, price: 0 }, nameI18n: { en: "Empty" } },
]
const skuCatalog = {
  specTypes: [
    {
      specKey: "10", specTypeId: 10, priced: 0, nameI18n: { en: "Rooms" },
      values: [
        { specValueId: 101, nameI18n: { en: "Studio" } },
        { specValueId: 102, nameI18n: { en: "Two rooms" } },
      ],
    },
    {
      specKey: "11", specTypeId: 11, priced: 1, nameI18n: { en: "Furniture" },
      values: [
        { specValueId: 111, nameI18n: { en: "Furnished" }, price: 25 },
        { specValueId: 112, nameI18n: { en: "Empty" }, price: 0 },
      ],
    },
  ],
  skus: [
    { skuId: 1, "10": { en: "Studio" }, "11": { en: "Furnished" }, price: 85, originalPrice: 125 },
    { skuId: 2, "10": { en: "Studio" }, "11": { en: "Empty" }, price: 60, originalPrice: 100 },
    { skuId: 3, "10": { en: "Two rooms" }, "11": { en: "Furnished" }, price: 105, originalPrice: 145 },
    { skuId: 4, "10": { en: "Two rooms" }, "11": { en: "Empty" }, price: 80, originalPrice: 120 },
  ],
}

async function harness(t, { packageService, wrapper = false, route: initialRoute = {}, ...overrides } = {}) {
  const calls = { pages: [], saves: [], details: [], prices: [], skuIds: [], tags: [], messages: [], events: [], replaces: [], catalogs: [] }
  const route = Vue.reactive({
    path: packageService === 1 || wrapper ? "/admin/package/services" : "/admin/products",
    query: {},
    hash: "",
    ...initialRoute,
  })
  const router = {
    replace: async (location) => {
      calls.replaces.push(clone(location))
      if (location.path != null) route.path = location.path
      route.query = clone(location.query ?? {})
      route.hash = location.hash ?? ""
    },
  }
  const locale = Vue.ref("en")
  const controls = {
    page: async () => pageResult([]),
    save: async () => ({}),
    detail: async (id) => ({
      data: {
        spu: { id, packageService: packageService === 1 ? 0 : 1, status: 1, currency: "CNY" },
        categoryIds: ["2", "21"],
        nameI18n: { en: "Existing cleaning", "zh-CN": "清洁服务" },
        descI18n: { en: "<p>Description</p>" },
        serviceContentI18n: { en: "<p>Cleaning</p>" },
        bookingNoticeI18n: { en: "<p>Book ahead</p>" },
        imageUrls: ["https://example.com/service.jpg"],
        specBindings: [
          { specTypeId: 10, specValueIds: [101, 102] },
          { specTypeId: 11, specValueIds: [111, 112] },
        ],
        attachBindings: [{ attachTypeId: 20, attachValueIds: [201] }],
      },
    }),
    skus: async () => ({ data: clone(skuCatalog) }),
    tags: async () => ({ data: [] }),
    prices: async () => ({}),
    ...overrides,
  }
  const spuApi = {
    page: async (payload) => {
      calls.pages.push(clone(payload))
      return controls.page(payload)
    },
    addOrUpdate: async (payload) => {
      calls.saves.push(clone(payload))
      calls.events.push({ type: "save", id: payload.id ?? null })
      return controls.save(payload)
    },
    detial: async (id) => {
      calls.details.push(id)
      return controls.detail(id)
    },
    listBySpu: async (id) => {
      calls.skuIds.push(id)
      return controls.skus(id)
    },
    batchUpdatePrices: async (payload) => {
      calls.prices.push(clone(payload))
      calls.events.push({ type: "prices", id: payload.productId })
      return controls.prices(payload)
    },
    sortProducts: async () => ({}),
    deleteProduct: async () => ({}),
    enable: async () => ({}),
    disable: async () => ({}),
    enableExclusive: async () => ({}),
    disableExclusive: async () => ({}),
  }
  const tagPicker = {
    selectedIds: Vue.ref([]),
    options: Vue.ref([]),
    reset() { this.selectedIds.value = [] },
    loadOptions: async () => {},
    loadBound: async () => {},
    saveItems(names = []) {
      return [
        ...this.selectedIds.value.map((id) => ({ id })),
        ...names.map((en) => ({ nameI18n: { en } })),
      ]
    },
  }
  const exports = {}
  runInNewContext(code, {
    exports,
    console,
    FormData,
    require: (name) => {
      if (name === "vue") return Vue
      if (name === "vue-router") return { useRoute: () => route, useRouter: () => router }
      if (name === "vue-i18n") return { useI18n: () => ({
        t: (key, params = {}) => key === "admin.product.fallback.package"
          ? `${locale.value.startsWith("zh") ? "套餐" : "Package"} ${params.id}`
          : key,
        locale,
      }) }
      if (name === "element-plus") return {
        ElMessage: Object.fromEntries(["warning", "success", "error", "info"].map((type) => [
          type, (message) => calls.messages.push({ type, message }),
        ])),
        ElMessageBox: { confirm: async () => true },
      }
      if (name === "@element-plus/icons-vue") return { Plus: {} }
      if (name === "@vueup/vue-quill") return { QuillEditor: {} }
      if (name === "@vueup/vue-quill/dist/vue-quill.snow.css") return {}
      if (name === "@/modules/admin/api/spu") return spuApi
      if (name === "@/modules/admin/api/product") return {
        currencies: async () => ({ data: ["CNY"] }),
        upload: async () => ({ data: "https://example.com/upload.jpg" }),
      }
      if (name === "@/modules/admin/api/category") return {
        getPage: async () => pageResult([{ category: { id: 2 }, nameI18n: { en: "Home" } }]),
        searchCategory: async (payload) => {
          calls.catalogs.push(clone(payload))
          return pageResult([{ category: { id: 21, parentId: 2 }, nameI18n: { en: "Cleaning" } }])
        },
        fuzzySearchCategory: async () => pageResult([]),
      }
      if (name === "@/modules/admin/api/packageServiceCategory") return {
        getPage: async (payload) => {
          calls.catalogs.push({ api: "packageServiceCategory", ...clone(payload) })
          return pageResult([{ category: { id: 21 }, nameI18n: { en: "Package cleaning" } }])
        },
        fuzzySearch: async () => pageResult([]),
      }
      if (name === "@/modules/admin/api/specType") return {
        getSpecTypePage: async (payload) => {
          calls.catalogs.push(clone(payload))
          return pageResult(specTypes)
        },
        fuzzySearchSpecType: async () => pageResult([]),
      }
      if (name === "@/modules/admin/api/spec") return {
        getSpecValuePage: async (payload) => {
          calls.catalogs.push(clone(payload))
          return pageResult(specValues)
        },
      }
      if (name === "@/modules/admin/api/addonType") return {
        getPage: async () => pageResult([{ attachType: { id: 20 }, nameI18n: { en: "Extras" } }]),
      }
      if (name === "@/modules/admin/api/addon") return {
        getPage: async () => pageResult([{ attachValue: { id: 201, attachTypeId: 20 }, nameI18n: { en: "Windows" } }]),
      }
      if (name === "@/modules/admin/api/bizTag") return {
        bizTagsByRef: async (refType, refId) => {
          calls.tags.push({ refType, refId })
          return controls.tags(refType, refId)
        },
      }
      if (name === "@/modules/admin/utils/i18n") return i18n
      if (name === "@/modules/admin/utils/skuPriceTable") return pricing
      if (name === "@/modules/admin/utils/bizTagPicker") return { useBizTagPicker: () => tagPicker }
      if (name === "@/modules/client/utils/biz-tag") return { bizTagLabels: () => [] }
      if (name === "@/utils/auth-state") return { getAdminAuthStorageValue: () => "test-token" }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const productComponent = { ...exports.default, render: () => null }
  let component = productComponent
  if (wrapper) {
    const wrapperExports = {}
    runInNewContext(wrapperCode, {
      exports: wrapperExports,
      require: (name) => {
        if (name === "vue") return Vue
        if (name === "@/modules/admin/pages/product/index.vue") return productComponent
        throw new Error(`Unexpected wrapper dependency: ${name}`)
      },
    })
    component = wrapperExports.default
  }
  const app = renderer.createApp(component, packageService == null ? {} : { packageService })
  const instance = app.mount({})
  t.after(() => app.unmount())
  const state = wrapper ? instance.$.subTree.component.setupState : instance.$.setupState
  // Element Plus form validation is an external UI boundary. Filled forms below
  // use valid data; the callback makes the real save handler execute normally.
  state.formRef = { validate: (callback) => callback(true), clearValidate() {} }
  await flush()
  return { state, calls, locale, controls, tagPicker, route, router }
}

for (const packageService of [0, 1]) {
  test(`catalog ${packageService} keeps initial, filtered, reset, paginated, and locale requests isolated`, async (t) => {
    const { state, calls, locale } = await harness(t, { packageService })
    assert.equal(state.isPackageService, packageService === 1)
    assert.deepEqual(calls.pages, [{ pageNum: 1, pageSize: 10, packageService }])

    state.query.pageNum = 4
    state.query.nameKeyword = "  Cleaning  "
    state.query.categoryId = 2
    state.query.serviceSubCategoryId = 21
    state.query.shelfStatus = "0"
    state.query.status = "0"
    state.handleSearch()
    await flush()
    assert.deepEqual(calls.pages.at(-1), {
      pageNum: 1, pageSize: 10, packageService, categoryId: "2",
      ...(packageService === 0 ? { shelfStatus: "0", status: "0" } : {}),
      serviceSubCategoryId: 21, nameKeyword: "Cleaning",
    })

    state.onPageChange(3)
    await flush()
    assert.equal(calls.pages.at(-1).pageNum, 3)
    assert.equal(calls.pages.at(-1).nameKeyword, "Cleaning")
    state.onSizeChange(20)
    await flush()
    assert.equal(calls.pages.at(-1).pageNum, 1)
    assert.equal(calls.pages.at(-1).pageSize, 20)

    state.reset()
    await flush()
    assert.deepEqual(calls.pages.at(-1), { pageNum: 1, pageSize: 20, packageService })
    locale.value = "zh-CN"
    await flush()
    assert.equal(calls.pages.length, 6)
    assert.ok(calls.pages.every((payload) => payload.packageService === packageService))
    assert.deepEqual(calls.messages, [])
  })

  test(`catalog ${packageService} create and edit preserve its service flag, specs, addons, and multilingual content`, async (t) => {
    const { state, calls } = await harness(t, { packageService })
    state.openCreate()
    assert.equal(state.form.product.isOnSale, packageService === 0)
    state.form.productI18nList = [{ langCode: "en", name: "New cleaning" }]
    state.form.descI18nList = [{ lang: "en", value: "<p>Description</p>" }]
    state.form.serviceContentI18nList = [{ lang: "en", value: "<p>Cleaning</p>" }]
    state.form.bookingNoticeI18nList = [{ lang: "en", value: "<p>Book ahead</p>" }]
    state.form.specGroups = [
      { specTypeId: 10, specIds: [101, 102] },
      { specTypeId: 11, specIds: [111, 112] },
    ]
    state.form.addonGroups = [{ categoryId: 20, addonIds: [201] }]
    state.save()
    await flush()
    assert.equal(calls.saves.length, 1)
    assert.equal(calls.saves[0].packageService, packageService)
    assert.equal(calls.saves[0].status, packageService === 1 ? undefined : 1)
    assert.equal(calls.saves[0].id, undefined)
    assert.equal(calls.saves[0].spuName, "New cleaning")
    assert.deepEqual(calls.saves[0].categoryIds, ["2", "21"])
    assert.deepEqual(calls.saves[0].specBindings, [
      { specTypeId: 10, specValueIds: [101, 102] },
      { specTypeId: 11, specValueIds: [111, 112] },
    ])
    assert.deepEqual(calls.saves[0].attachBindings, [{ attachTypeId: 20, attachValueIds: [201] }])
    assert.equal(state.dialogVisible, false)

    await state.openEdit({ id: 71 })
    await flush()
    assert.deepEqual(calls.details, [71])
    assert.equal(state.isEdit, true)
    assert.deepEqual(clone(state.form.specGroups), [
      { specTypeId: 10, specIds: [101, 102] },
      { specTypeId: 11, specIds: [111, 112] },
    ])
    state.form.productI18nList.find((item) => item.langCode === "en").name = "Updated cleaning"
    state.form.product.isOnSale = false
    state.save()
    await flush()
    assert.equal(calls.saves.length, 2)
    const saved = calls.saves[1]
    assert.equal(saved.id, 71)
    assert.equal(saved.packageService, packageService)
    assert.equal(saved.status, packageService === 1 ? undefined : 0)
    assert.deepEqual(saved.nameI18n, { en: "Updated cleaning", "zh-CN": "清洁服务" })
    assert.deepEqual(saved.descI18n, { en: "<p>Description</p>" })
    assert.deepEqual(saved.serviceContentI18n, { en: "<p>Cleaning</p>" })
    assert.deepEqual(saved.bookingNoticeI18n, { en: "<p>Book ahead</p>" })
    assert.deepEqual(saved.specBindings, calls.saves[0].specBindings)
    assert.deepEqual(saved.attachBindings, calls.saves[0].attachBindings)
    assert.deepEqual(saved.imageUrls, ["https://example.com/service.jpg"])
    assert.ok(calls.pages.filter((payload) => payload.pageSize !== 200)
      .every((payload) => payload.packageService === packageService))
    assert.equal(calls.messages.filter((item) => item.type === "error").length, 0)
  })
}

test("ordinary product management defaults to catalog 0 and the new page mounts catalog 1", async (t) => {
  const ordinary = await harness(t)
  assert.equal(ordinary.state.isPackageService, false)
  assert.equal(ordinary.calls.pages[0].packageService, 0)
  const packageServices = await harness(t, { wrapper: true })
  assert.equal(packageServices.state.isPackageService, true)
  assert.equal(packageServices.calls.pages[0].packageService, 1)
})

test("package services retain SKU base-price editing and priced-spec additions", async (t) => {
  const { state, calls } = await harness(t, { packageService: 1 })
  await state.openPriceDialog({ id: 71 })
  assert.deepEqual(calls.skuIds, [71])
  assert.deepEqual(clone(state.priceColumns), [{ key: "10", label: "Rooms" }])
  assert.deepEqual(clone(state.priceRows.map((row) => ({
    specValueIds: row.specValueIds,
    origin: row.originPrice,
    sale: row.discountPrice,
  }))), [
    { specValueIds: [101], origin: 100, sale: 60 },
    { specValueIds: [102], origin: 120, sale: 80 },
  ])
  assert.deepEqual(clone(state.priceTotalLines(state.priceRows[0])), [
    { label: "Furnished", origin: 125, sale: 85, missingPrice: false },
    { label: "Empty", origin: 100, sale: 60, missingPrice: false },
  ])

  state.priceRows[0].discountPrice = 0
  state.priceRows[1].discountPrice = 75
  state.savePrice()
  await flush()
  assert.deepEqual(calls.prices, [{
    productId: 71,
    bases: [
      { specValueIds: [101], price: 100, originalPrice: 100 },
      { specValueIds: [102], price: 75, originalPrice: 120 },
    ],
  }])
  assert.equal(state.priceDialogVisible, false)
  assert.equal(calls.messages.filter((item) => item.type === "error").length, 0)
})

const sourceItem = (id) => ({
  spu: { id, packageService: 0, status: id % 2 },
  nameI18n: { en: `Ordinary service ${id}`, "zh-CN": `普通服务 ${id}` },
})
const sourceTags = [
  { id: 301, nameI18n: { en: "Popular", "zh-CN": "热门" } },
  { id: 302, nameI18n: { en: "Home care", "zh-CN": "居家护理" } },
]
const draftSnapshot = (state, tagPicker) => clone({
  form: state.form,
  sourceServiceId: state.sourceServiceId,
  prices: state.importedPriceEditor,
  selectedTagIds: tagPicker.selectedIds.value,
  pendingTagNames: state.pendingTagNames,
})
const openImportedDraft = async (t, overrides = {}) => {
  const result = await harness(t, {
    packageService: 1,
    save: async () => ({ data: 901 }),
    tags: async () => ({ data: clone(sourceTags) }),
    ...overrides,
  })
  result.state.openCreate()
  await result.state.ensureSourceServices()
  await result.state.importSourceService(77)
  await flush()
  return result
}

test("copy picker preloads every ordinary-service page once and relabels its local catalog", async (t) => {
  const gate = deferred()
  const { state, calls, locale } = await harness(t, {
    packageService: 1,
    page: async (payload) => {
      if (payload.packageService === 1) return pageResult([])
      if (payload.pageNum === 1) return gate.promise
      return { data: { list: [sourceItem(201), sourceItem(2)], total: 202 } }
    },
  })
  state.openCreate()
  const first = state.ensureSourceServices()
  const second = state.ensureSourceServices()
  await flush()
  assert.deepEqual(calls.pages.filter((payload) => payload.packageService === 0), [
    { pageNum: 1, pageSize: 200, packageService: 0 },
  ])
  gate.resolve({ data: {
    list: Array.from({ length: 200 }, (_, index) => sourceItem(index + 1)),
    total: 202,
  } })
  await Promise.all([first, second])
  assert.deepEqual(calls.pages.filter((payload) => payload.packageService === 0), [
    { pageNum: 1, pageSize: 200, packageService: 0 },
    { pageNum: 2, pageSize: 200, packageService: 0 },
  ])
  assert.equal(state.sourceServiceOptions.length, 201)
  assert.equal(state.sourceServiceOptions.at(-1).name, "Ordinary service 201")
  locale.value = "zh-CN"
  await flush()
  assert.equal(state.sourceServiceOptions.at(-1).name, "普通服务 201")
  state.dialogVisible = false
  await flush()
  state.openCreate()
  await state.ensureSourceServices()
  assert.equal(calls.pages.filter((payload) => payload.packageService === 0).length, 2)
  assert.equal(calls.messages.filter((message) => message.type === "error").length, 0)
})

test("copying an ordinary service keeps its content but leaves package pricing methods empty", async (t) => {
  const { state, calls, controls, tagPicker } = await openImportedDraft(t)
  const original = (await controls.detail(77)).data
  assert.equal(state.isEdit, false)
  assert.equal(state.form.product.id, undefined)
  assert.equal(state.form.product.isOnSale, false)
  assert.equal(state.sourceServiceId, 77)
  assert.deepEqual(clone(state.form.productI18nList), [
    { langCode: "en", name: "Existing cleaning", details: "<p>Description</p>" },
    { langCode: "zh-CN", name: "清洁服务", details: "" },
  ])
  assert.deepEqual(clone(state.form.descI18nList), [{ lang: "en", value: "<p>Description</p>" }])
  assert.deepEqual(clone(state.form.serviceContentI18nList), [{ lang: "en", value: "<p>Cleaning</p>" }])
  assert.deepEqual(clone(state.form.bookingNoticeI18nList), [{ lang: "en", value: "<p>Book ahead</p>" }])
  assert.equal(state.form.product.categoryId, 2)
  assert.equal(state.form.product.subCategoryId, undefined)
  assert.deepEqual(clone(state.form.specGroups), [{ specTypeId: null, specIds: [] }])
  assert.equal(state.form.product.specTypeId, undefined)
  assert.deepEqual(clone(state.form.product.specIds), [])
  assert.deepEqual(clone(state.form.addonGroups), [{ categoryId: 20, addonIds: [201] }])
  assert.ok(state.form.productImages.every((image) => image.productId == null))
  assert.deepEqual(clone(tagPicker.selectedIds.value), [301, 302])
  assert.deepEqual(clone(state.selectedProductTags), sourceTags)
  assert.deepEqual(calls.tags, [{ refType: 1, refId: 77 }])
  assert.equal(state.importedPriceEditor, null)
  assert.deepEqual(calls.skuIds, [])

  state.save()
  await flush()
  assert.equal(calls.saves.length, 1)
  const saved = calls.saves[0]
  assert.equal(saved.id, undefined)
  assert.equal(saved.packageService, 1)
  assert.equal(saved.status, undefined)
  for (const key of ["nameI18n", "descI18n", "serviceContentI18n", "bookingNoticeI18n", "imageUrls", "attachBindings"]) {
    assert.deepEqual(saved[key], original[key], key)
  }
  assert.deepEqual(saved.categoryIds, ["2"])
  assert.deepEqual(saved.specBindings, [{ specTypeId: null, specValueIds: [] }])
  assert.notDeepEqual(saved.specBindings, original.specBindings)
  assert.deepEqual(saved.tags, [{ id: 301 }, { id: 302 }])
  assert.deepEqual(calls.events, [{ type: "save", id: null }])
  assert.deepEqual(calls.prices, [])
  assert.equal(calls.saves.some((payload) => payload.id === 77), false)
  assert.equal(state.dialogVisible, false)
})

test("copying an ordinary service ignores its source pricing methods and SKU prices", async (t) => {
  const catalog = clone(skuCatalog)
  catalog.skus.forEach((sku, index) => { sku.price = index % 2 ? null : 0 })
  const { state, calls } = await openImportedDraft(t, {
    skus: async () => ({ data: catalog }),
  })
  assert.equal(state.importedPriceEditor, null)
  assert.deepEqual(clone(state.form.specGroups), [{ specTypeId: null, specIds: [] }])
  assert.deepEqual(calls.skuIds, [])
  state.save()
  await flush()
  assert.deepEqual(calls.prices, [])
  assert.deepEqual(calls.saves[0].specBindings, [{ specTypeId: null, specValueIds: [] }])
})

test("a later source selection wins even when an earlier import resolves last", async (t) => {
  const gate = deferred()
  const { state, controls, tagPicker, calls } = await harness(t, { packageService: 1 })
  const defaultDetail = controls.detail
  controls.detail = async (id) => {
    if (id === 77) return gate.promise
    const result = await defaultDetail(id)
    result.data.nameI18n.en = `Selected ${id}`
    return result
  }
  state.openCreate()
  const earlier = state.importSourceService(77)
  await flush()
  await state.importSourceService(78)
  const selected = draftSnapshot(state, tagPicker)
  const messages = calls.messages.length
  gate.resolve(await defaultDetail(77))
  await earlier
  await flush()
  assert.deepEqual(draftSnapshot(state, tagPicker), selected)
  assert.equal(state.sourceServiceId, 78)
  assert.equal(state.form.productI18nList[0].name, "Selected 78")
  assert.equal(calls.messages.length, messages)
  assert.equal(state.detailLoading, false)
})

test("closing and reopening the creation dialog invalidates a pending source import", async (t) => {
  const gate = deferred()
  const { state, controls, tagPicker, calls } = await harness(t, { packageService: 1 })
  const result = await controls.detail(77)
  controls.detail = async () => gate.promise
  state.openCreate()
  const pending = state.importSourceService(77)
  await flush()
  state.dialogVisible = false
  await flush()
  state.openCreate()
  state.form.productI18nList[0].name = "Fresh draft after reopening"
  const draft = draftSnapshot(state, tagPicker)
  const messages = calls.messages.length
  gate.resolve(result)
  await pending
  await flush()
  assert.deepEqual(draftSnapshot(state, tagPicker), draft)
  assert.equal(state.sourceServiceId, null)
  assert.equal(state.detailLoading, false)
  assert.equal(calls.messages.length, messages)
})

for (const boundary of ["detail", "tags"]) {
  test(`a failed source ${boundary} request preserves the complete existing draft and prior source selection`, async (t) => {
    const { state, controls, tagPicker, calls } = await openImportedDraft(t)
    state.form.productI18nList[0].name = "My unsaved title"
    state.pendingTagNames = ["Draft tag"]
    const draft = draftSnapshot(state, tagPicker)
    controls[boundary] = async () => { throw new Error(`Cannot read source ${boundary}`) }
    await state.importSourceService(78)
    await flush()
    assert.deepEqual(draftSnapshot(state, tagPicker), draft)
    assert.equal(state.dialogVisible, true)
    assert.equal(state.detailLoading, false)
    assert.equal(calls.saves.length, 0)
    assert.equal(calls.prices.length, 0)
    assert.equal(calls.messages.at(-1).type, "error")
  })
}

test("a failed creation keeps imported content for retry and never writes source prices", async (t) => {
  const { state, controls, tagPicker, calls } = await openImportedDraft(t)
  const draft = draftSnapshot(state, tagPicker)
  controls.save = async () => { throw new Error("Creation failed") }
  state.save()
  await flush()
  assert.deepEqual(draftSnapshot(state, tagPicker), draft)
  assert.equal(state.form.product.id, undefined)
  assert.equal(state.isEdit, false)
  assert.equal(state.dialogVisible, true)
  assert.equal(calls.prices.length, 0)
  controls.save = async () => ({ data: 901 })
  state.save()
  await flush()
  assert.equal(calls.saves.length, 2)
  assert.ok(calls.saves.every((payload) => payload.id == null && payload.packageService === 1))
  assert.deepEqual(calls.prices, [])
  assert.deepEqual(calls.events, [{ type: "save", id: null }, { type: "save", id: null }])
})

test("saving an imported draft does not copy the source service prices", async (t) => {
  const { state, controls, calls } = await openImportedDraft(t)
  controls.prices = async () => { throw new Error("Price copy failed") }
  state.form.specGroups = [{ specTypeId: 10, specIds: [101] }]
  state.save()
  await flush()
  assert.equal(state.dialogVisible, false)
  assert.equal(state.importedPriceEditor, null)
  assert.deepEqual(calls.prices, [])
  assert.deepEqual(calls.events, [{ type: "save", id: null }])
  assert.deepEqual(calls.saves[0].specBindings, [{ specTypeId: 10, specValueIds: [101] }])
})

test("choosing package pricing methods after import does not restore the source service bindings", async (t) => {
  const { state, calls } = await openImportedDraft(t)
  state.form.specGroups = [{ specTypeId: 10, specIds: [101] }]
  await flush()
  assert.equal(state.importedPriceEditor, null)
  assert.equal(calls.messages.some((message) => message.type === "warning"), false)
  state.save()
  await flush()
  assert.deepEqual(calls.saves[0].specBindings, [{ specTypeId: 10, specValueIds: [101] }])
  assert.equal(calls.prices.length, 0)
})

test("a pending imported save blocks reopening, editing, importing, and duplicate saves", async (t) => {
  const saveGate = deferred()
  const { state, calls, tagPicker } = await openImportedDraft(t, {
    save: async () => saveGate.promise,
  })
  const attemptOtherActions = async () => {
    const draft = draftSnapshot(state, tagPicker)
    state.openCreate()
    await state.openEdit({ id: 88 })
    await state.importSourceService(99)
    state.save()
    await flush()
    assert.deepEqual(draftSnapshot(state, tagPicker), draft)
    assert.equal(state.dialogVisible, true)
    assert.equal(state.submitLoading, true)
    assert.deepEqual(calls.details, [77])
    assert.deepEqual(calls.skuIds, [])
    assert.equal(calls.saves.length, 1)
  }

  state.save()
  await flush()
  assert.equal(calls.prices.length, 0)
  assert.equal(state.form.product.id, undefined)
  await attemptOtherActions()

  saveGate.resolve({ data: 901 })
  await flush()
  assert.deepEqual(calls.events, [{ type: "save", id: null }])
  assert.deepEqual(calls.prices, [])
  assert.equal(state.submitLoading, false)
  assert.equal(state.dialogVisible, false)
})

test("a failed newer import rolls back to the last applied source rather than an earlier pending selection", async (t) => {
  const firstGate = deferred()
  const secondGate = deferred()
  const { state, controls, tagPicker, calls } = await openImportedDraft(t)
  const appliedDraft = draftSnapshot(state, tagPicker)
  const initialDetail = controls.detail
  controls.detail = async (id) => id === 78 ? firstGate.promise : secondGate.promise
  const first = state.importSourceService(78)
  const second = state.importSourceService(79)
  await flush()
  assert.equal(state.sourceServiceId, 79)

  secondGate.reject(new Error("Newer source failed"))
  await second
  await flush()
  assert.equal(state.sourceServiceId, 77)
  assert.deepEqual(draftSnapshot(state, tagPicker), appliedDraft)
  assert.equal(state.detailLoading, false)
  const messages = calls.messages.length

  firstGate.resolve(await initialDetail(78))
  await first
  await flush()
  assert.deepEqual(draftSnapshot(state, tagPicker), appliedDraft)
  assert.equal(calls.messages.length, messages)
})

test("inconsistent source SKU prices are not copied into the package service draft", async (t) => {
  const catalog = clone(skuCatalog)
  catalog.skus[0].price = 90
  catalog.skus[2].price = 110
  const { state, calls } = await openImportedDraft(t, {
    skus: async () => ({ data: catalog }),
  })
  assert.equal(state.importedPriceEditor, null)
  assert.deepEqual(clone(state.form.specGroups), [{ specTypeId: null, specIds: [] }])
  state.save()
  await flush()
  assert.equal(calls.saves.length, 1)
  assert.deepEqual(calls.prices, [])
  assert.equal(calls.messages.some((message) => message.message === "admin.packageService.priceUnavailable"), false)
  assert.equal(state.dialogVisible, false)
})

test("adding groups after source import starts from an empty package pricing method", async (t) => {
  const { state } = await openImportedDraft(t)
  assert.equal(state.form.product.subCategoryId, undefined)
  assert.deepEqual(clone(state.form.specGroups), [{ specTypeId: null, specIds: [] }])
  state.addSpecGroup()
  assert.deepEqual(clone(state.form.specGroups.map((group) => group.specTypeId)), [null, null])
  state.form.product.subCategoryId = 21
  await flush()
  assert.deepEqual(clone(state.form.specGroups.map((group) => group.specTypeId)), [10, 11])
  state.addSpecGroup()
  assert.deepEqual(clone(state.form.specGroups.at(-1)), { specTypeId: null, specIds: [] })

  state.addAddonGroup()
  assert.deepEqual(clone(state.form.addonGroups.at(-1)), { categoryId: null, addonIds: [] })
  state.addonCategoryOptions.push({ value: 30, label: "Additional extras" })
  state.addAddonGroup()
  assert.deepEqual(clone(state.form.addonGroups.at(-1)), { categoryId: 30, addonIds: [] })
  state.addAddonGroup()
  assert.deepEqual(clone(state.form.addonGroups.map((group) => group.categoryId)), [20, null, 30, null])
})

for (const packageService of [0, 1]) {
  test(`catalog ${packageService} group options retain the current type and exclude types selected in other groups`, async (t) => {
    const { state } = await harness(t, { packageService })
    state.specTypeOptions.push({ value: 12, label: "Unused specification", subCategoryId: 21, priced: false })
    state.form.specGroups = [
      { specTypeId: 10, specIds: [101, 102] },
      { specTypeId: 11, specIds: [111] },
      { specTypeId: null, specIds: [] },
    ]
    assert.deepEqual(clone(state.specTypeOptionsFor(state.form.specGroups[0]).map((item) => item.value)), [10, 12])
    assert.deepEqual(clone(state.specTypeOptionsFor(state.form.specGroups[1]).map((item) => item.value)), [11, 12])
    assert.deepEqual(clone(state.specTypeOptionsFor(state.form.specGroups[2]).map((item) => item.value)), [12])

    state.addonCategoryOptions.push({ value: 30, label: "Other extras" }, { value: 40, label: "Unused extras" })
    state.form.addonGroups = [
      { categoryId: 20, addonIds: [201] },
      { categoryId: 30, addonIds: [301] },
      { categoryId: null, addonIds: [] },
    ]
    assert.deepEqual(clone(state.addonCategoryOptionsFor(state.form.addonGroups[0]).map((item) => item.value)), [20, 40])
    assert.deepEqual(clone(state.addonCategoryOptionsFor(state.form.addonGroups[1]).map((item) => item.value)), [30, 40])
    assert.deepEqual(clone(state.addonCategoryOptionsFor(state.form.addonGroups[2]).map((item) => item.value)), [40])
  })

  test(`catalog ${packageService} form rules reject repeated specification and addon types`, async (t) => {
    const { state } = await harness(t, { packageService })
    const validationMessages = async (field, value) => {
      const validators = state.rules[field].filter((rule) => typeof rule.validator === "function")
      assert.ok(validators.length > 0)
      return Promise.all(validators.map((rule) => new Promise((resolve) => {
        rule.validator(rule, value, (error) => resolve(error?.message))
      })))
    }
    assert.ok((await validationMessages("specGroups", [
      { specTypeId: 10, specIds: [101, 102] },
      { specTypeId: 10, specIds: [101] },
    ])).includes("admin.product.validation.specTypeDuplicate"))
    assert.ok((await validationMessages("addonGroups", [
      { categoryId: 20, addonIds: [201] },
      { categoryId: 20, addonIds: [201] },
    ])).includes("admin.product.validation.addonTypeDuplicate"))
  })

  for (const kind of ["spec", "addon"]) {
    test(`catalog ${packageService} independently guards duplicate ${kind} types before save and preserves the draft`, async (t) => {
      const { state, calls, tagPicker } = packageService === 1
        ? await openImportedDraft(t)
        : await harness(t, { packageService })
      if (packageService === 0) {
        state.openCreate()
        state.form.productI18nList[0].name = "Unsaved ordinary service"
        state.form.specGroups = [{ specTypeId: 10, specIds: [101, 102] }]
        state.form.addonGroups = [{ categoryId: 20, addonIds: [201] }]
      }
      state.pendingTagNames = ["Unsaved tag"]
      if (packageService === 1 && kind === "spec") {
        state.form.specGroups = [{ specTypeId: 10, specIds: [101] }]
      }
      if (kind === "spec") state.form.specGroups.push({ specTypeId: 10, specIds: [101] })
      else state.form.addonGroups.push({ categoryId: 20, addonIds: [201] })
      await flush()
      const draft = draftSnapshot(state, tagPicker)
      const pages = calls.pages.length
      // The form boundary deliberately reports valid, proving save itself checks
      // uniqueness even when UI validation is bypassed or the draft is stale.
      state.save()
      await flush()
      assert.deepEqual(draftSnapshot(state, tagPicker), draft)
      assert.equal(state.dialogVisible, true)
      assert.equal(state.submitLoading, false)
      assert.equal(calls.saves.length, 0)
      assert.equal(calls.prices.length, 0)
      assert.equal(calls.pages.length, pages)
      assert.equal(calls.messages.at(-1).message,
        `admin.product.validation.${kind === "spec" ? "specTypeDuplicate" : "addonTypeDuplicate"}`)
    })
  }
}

for (const packageService of [0, 1]) {
  test(`catalog ${packageService} maps bound packages from the page contract, deduplicates identities, and relabels without detail requests`, async (t) => {
    const list = [
      {
        spu: { id: 71, packageService },
        nameI18n: { en: "Cleaning", "zh-CN": "清洁" },
        packages: [
          { id: 9, packageName: "居家套餐", packageEnglishName: "Home package", status: 1, discount: 0.8 },
          { id: "9", packageName: "居家套餐", packageEnglishName: "Home package", status: 1, discount: 0.8 },
          { id: 10, packageName: "居家套餐", packageEnglishName: "Home package", status: 0, discount: 1 },
          { id: 11, packageName: "仅中文套餐", packageEnglishName: "" },
          { id: 12, packageEnglishName: "English-only package" },
          { id: 13, packageName: "", packageEnglishName: "" },
          { packageEnglishName: "Legacy draft" },
          { id: 0, packageEnglishName: "Legacy draft" },
          { id: -1, packageEnglishName: "Legacy draft" },
          null,
          false,
          "invalid package",
          [],
          {},
          { id: 0 },
          { id: "invalid" },
        ],
      },
      { spu: { id: 72, packageService }, packages: [] },
      { spu: { id: 73, packageService }, packages: { id: 9, packageEnglishName: "Malformed collection" } },
      { spu: { id: 74, packageService } },
    ]
    const { state, calls, locale } = await harness(t, {
      packageService,
      page: async () => ({ data: { list, total: list.length } }),
    })
    const packages = state.products[0].packages
    assert.deepEqual(clone(packages.map((item) => item.id)), [9, 10, 11, 12, 13, null])
    assert.deepEqual(clone(packages.map((item) => item.name)), [
      "Home package", "Home package", "仅中文套餐", "English-only package", "Package 13", "Legacy draft",
    ])
    assert.equal(new Set(packages.map((item) => item.key)).size, packages.length)
    assert.notEqual(packages[0].key, packages[1].key)
    assert.deepEqual(clone(state.products.slice(1).map((item) => item.packages)), [[], [], []])
    assert.deepEqual(calls.pages, [{ pageNum: 1, pageSize: 10, packageService }])
    assert.deepEqual(calls.details, [])
    assert.deepEqual(calls.skuIds, [])
    assert.deepEqual(calls.tags, [])

    locale.value = "zh-CN"
    await flush()
    assert.deepEqual(clone(state.products[0].packages.map((item) => item.name)), [
      "居家套餐", "居家套餐", "仅中文套餐", "English-only package", "套餐 13", "Legacy draft",
    ])
    assert.deepEqual(calls.pages, [
      { pageNum: 1, pageSize: 10, packageService },
      { pageNum: 1, pageSize: 10, packageService },
    ])
    assert.deepEqual(calls.details, [])
    assert.deepEqual(calls.skuIds, [])
    assert.deepEqual(calls.tags, [])
    assert.deepEqual(calls.messages, [])
  })
}

const linkedServiceDetail = (id, packageService) => ({
  data: {
    spu: { id, packageService, status: 1, currency: "CNY" },
    categoryIds: ["2", "21"],
    nameI18n: { en: `Linked service ${id}` },
    descI18n: { en: "<p>Description</p>" },
    serviceContentI18n: { en: "<p>Service content</p>" },
    bookingNoticeI18n: { en: "<p>Book ahead</p>" },
    specBindings: [{ specTypeId: 10, specValueIds: [101, 102] }],
    imageUrls: ["https://example.com/linked-service.jpg"],
  },
})

test("service edit links open records outside the current page and close or save without losing unrelated query and hash", async (t) => {
  for (const packageService of [0, 1]) {
    const otherQuery = { filter: "cleaning", selected: ["one", "two"] }
    const { state, calls, route } = await harness(t, {
      packageService,
      route: { query: { ...otherQuery, editId: "77" }, hash: "#bound-service" },
      detail: async (id) => linkedServiceDetail(id, packageService),
    })
    assert.deepEqual(clone(state.products), [])
    assert.deepEqual(calls.details, [77])
    assert.equal(state.dialogVisible, true)
    assert.equal(state.isEdit, true)
    assert.equal(state.form.product.id, 77)
    assert.equal(state.form.productI18nList[0].name, "Linked service 77")
    state.dialogVisible = false
    await flush()
    assert.deepEqual(clone(route.query), otherQuery)
    assert.equal(route.hash, "#bound-service")
    assert.equal(route.path, packageService === 1 ? "/admin/package/services" : "/admin/products")

    route.query = { ...otherQuery, editId: "78" }
    await flush()
    assert.equal(state.form.product.id, 78)
    assert.equal(state.dialogVisible, true)
    state.save()
    await flush()
    assert.equal(calls.saves.at(-1).id, 78)
    assert.equal(calls.saves.at(-1).packageService, packageService)
    assert.equal(state.dialogVisible, false)
    assert.deepEqual(clone(route.query), otherQuery)
    assert.equal(route.hash, "#bound-service")
  }
})

test("changing linked service IDs keeps the latest editor and removing the query ignores any pending response", async (t) => {
  const { state, calls, controls, route, tagPicker } = await harness(t, {
    packageService: 1,
    route: { query: { editId: "77", keep: "yes" } },
    detail: async (id) => linkedServiceDetail(id, 1),
  })
  const gates = new Map([[78, deferred()], [79, deferred()], [80, deferred()]])
  controls.detail = async (id) => gates.get(id).promise
  route.query = { editId: "78", keep: "yes" }
  await flush()
  route.query = { editId: "79", keep: "yes" }
  await flush()
  assert.deepEqual(calls.details, [77, 78, 79])
  gates.get(79).resolve(linkedServiceDetail(79, 1))
  await flush()
  assert.equal(state.form.product.id, 79)
  gates.get(78).resolve(linkedServiceDetail(78, 1))
  await flush()
  assert.equal(state.form.product.id, 79)
  assert.equal(state.form.productI18nList[0].name, "Linked service 79")

  route.query = { editId: "80", keep: "yes" }
  await flush()
  route.query = { keep: "yes" }
  await flush()
  assert.equal(state.dialogVisible, false)
  const closedDraft = draftSnapshot(state, tagPicker)
  const messages = calls.messages.length
  gates.get(80).resolve(linkedServiceDetail(80, 1))
  await flush()
  assert.deepEqual(draftSnapshot(state, tagPicker), closedDraft)
  assert.equal(state.dialogVisible, false)
  assert.equal(calls.messages.length, messages)
  assert.deepEqual(clone(route.query), { keep: "yes" })
})

test("failed or empty linked service details close the editor and clear only the edit query", async (t) => {
  for (const detail of [
    async () => { throw new Error("Linked service unavailable") },
    async () => ({ data: {} }),
    async () => linkedServiceDetail(999, 1),
  ]) {
    const { state, calls, route } = await harness(t, {
      packageService: 1,
      route: { query: { editId: "77", keep: "yes" }, hash: "#packages" },
      detail,
    })
    assert.deepEqual(calls.details, [77])
    assert.equal(state.dialogVisible, false)
    assert.equal(state.form.product.id, undefined)
    assert.deepEqual(clone(route.query), { keep: "yes" })
    assert.equal(route.hash, "#packages")
    assert.equal(calls.saves.length, 0)
    assert.equal(calls.prices.length, 0)
    assert.ok(calls.messages.some((message) => message.type === "error"))
  }
})

test("a legacy ordinary service link redirects to ordinary management before applying any detail on the package-service page", async (t) => {
  const { state, calls, route } = await harness(t, {
    packageService: 1,
    route: { query: { editId: "77", keep: "yes" }, hash: "#bound-service" },
    detail: async (id) => linkedServiceDetail(id, 0),
  })
  assert.deepEqual(calls.details, [77])
  assert.equal(state.dialogVisible, false)
  assert.equal(state.form.product.id, undefined)
  assert.equal(route.path, "/admin/products")
  assert.deepEqual(clone(route.query), { editId: "77", keep: "yes" })
  assert.equal(route.hash, "#bound-service")
  assert.deepEqual(calls.replaces, [{
    path: "/admin/products", query: { editId: "77", keep: "yes" }, hash: "#bound-service",
  }])
  assert.equal(calls.saves.length, 0)
  assert.equal(calls.prices.length, 0)
})

test("late tags from an earlier linked service cannot overwrite the newer service detail or tag selection", async (t) => {
  const gate = deferred()
  const newerTags = [{ id: 302, nameI18n: { en: "Newer service tag" } }]
  const { state, route, calls, tagPicker } = await harness(t, {
    packageService: 1,
    route: { query: { editId: "77" } },
    detail: async (id) => linkedServiceDetail(id, 1),
    tags: async (_refType, refId) => refId === 77 ? gate.promise : { data: newerTags },
  })
  assert.deepEqual(calls.details, [77])
  assert.deepEqual(calls.tags, [{ refType: 1, refId: 77 }])
  assert.equal(state.detailLoading, true)

  route.query = { editId: "78" }
  await flush()
  assert.equal(state.form.product.id, 78)
  assert.equal(state.form.productI18nList[0].name, "Linked service 78")
  assert.deepEqual(clone(tagPicker.selectedIds.value), [302])
  assert.deepEqual(clone(state.selectedProductTags), newerTags)
  const currentDraft = draftSnapshot(state, tagPicker)
  const messages = calls.messages.length

  gate.resolve({ data: [{ id: 301, nameI18n: { en: "Earlier service tag" } }] })
  await flush()
  assert.deepEqual(draftSnapshot(state, tagPicker), currentDraft)
  assert.deepEqual(clone(state.selectedProductTags), newerTags)
  assert.equal(state.dialogVisible, true)
  assert.equal(state.detailLoading, false)
  assert.equal(calls.messages.length, messages)
  assert.deepEqual(calls.tags, [{ refType: 1, refId: 77 }, { refType: 1, refId: 78 }])
})

test("package services load subcategories and pricing methods from the package catalog", async (t) => {
  const ordinary = await harness(t, { packageService: 0 })
  assert.equal(ordinary.calls.catalogs.some((item) => item.api === "packageServiceCategory"), false)
  assert.ok(ordinary.calls.catalogs.some((item) => item.categoryDomain === "2"))
  assert.ok(ordinary.calls.catalogs.filter((item) => item.categoryDomain).every((item) => item.categoryDomain === "2"))

  const packaged = await harness(t, { packageService: 1 })
  assert.ok(packaged.calls.catalogs.some((item) => item.api === "packageServiceCategory"))
  assert.equal(packaged.calls.catalogs.some((item) => item.categoryDomain === "2"), false)
  assert.ok(packaged.calls.catalogs.filter((item) => item.categoryDomain).every((item) => item.categoryDomain === "4"))
})
