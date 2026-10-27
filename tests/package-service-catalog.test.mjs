import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { compileScript, parse } from "@vue/compiler-sfc"
import ts from "typescript"
import * as Vue from "vue"

// Execute the real package-management SFC and mock only its external boundaries.
const root = new URL("../", import.meta.url)
const filename = "src/modules/admin/pages/package/index.vue"
const read = (path) => readFileSync(new URL(path, root), "utf8")
const source = read(filename)
const { descriptor, errors } = parse(source, { filename })
assert.deepEqual(errors, [])
const script = compileScript(descriptor, { id: "package-service-catalog-test" })
const transpile = (content) =>
  ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
const code = transpile(script.content)
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

const messages = {
  en: {
    admin: {
      packageList: {
        message: {
          categoryFailed: "Category load failed",
          fetchFailed: "Package load failed",
          spuFailed: "Service load failed",
          skuFailed: "SKU load failed",
          detailFailed: "Package detail failed",
          serviceDuplicate: "Service already selected",
          serviceFallback: "Service {index}",
        },
      },
    },
  },
  zh: {
    admin: {
      packageList: {
        message: {
          categoryFailed: "套餐分类加载失败",
          fetchFailed: "套餐加载失败",
          spuFailed: "服务加载失败",
          skuFailed: "规格加载失败",
          detailFailed: "套餐详情加载失败",
          serviceDuplicate: "服务已选择",
          serviceFallback: "服务 {index}",
        },
      },
    },
  },
}

const pickI18nText = (map, locale, fallback = "") => {
  if (!map || typeof map !== "object") return fallback
  const language = String(locale || "en")
  const direct = map[language]
  if (typeof direct === "string" && direct.trim()) return direct
  const aliases = language.startsWith("zh")
    ? ["zh", "zh-CN", "zh_CN"]
    : ["en", "en-US", "en_US"]
  for (const alias of aliases) {
    if (typeof map[alias] === "string" && map[alias].trim()) return map[alias]
  }
  return Object.values(map).find((value) => typeof value === "string" && value.trim()) || fallback
}

const spuItem = (id, english = `Service ${id}`, chinese = `服务 ${id}`) => ({
  spu: { id, spuName: english, status: 1, packageService: 1 },
  nameI18n: { en: english, zh: chinese },
})
const savedSku = (skuId, redeemTimes) => ({
  skuId,
  redeemTimes,
  available: true,
  specLabel: `Saved SKU ${skuId}`,
  price: 99,
})

async function harness(t, overrides = {}) {
  const calls = {
    spuPages: [],
    skuSpus: [],
    packageDetails: [],
    packagePages: [],
    categoryPages: [],
    tagRefs: [],
    saves: [],
    replacements: [],
    messages: [],
  }
  const route = Vue.reactive({
    path: "/admin/package/packages",
    query: {},
    hash: "",
    ...overrides.route,
  })
  const router = {
    replace: async (target) => {
      calls.replacements.push(clone(target))
      Object.assign(route, target)
    },
  }
  const locale = Vue.ref("en")
  const translate = (key, params = {}) => {
    const value = key
      .split(".")
      .reduce((node, part) => node?.[part], messages[locale.value])
    const template = typeof value === "string" ? value : key
    return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""))
  }
  const controls = {
    spuPage:
      overrides.spuPage ||
      (async () => ({ data: { list: [spuItem(1)], total: 1 } })),
    listBySpu:
      overrides.listBySpu ||
      (async (spuId) => ({
        data: {
          specTypes: [],
          skus: [{ skuId: spuId * 100 + 1, skuCode: `SKU-${spuId}`, price: 10 }],
        },
      })),
    packageDetail:
      overrides.packageDetail ||
      (async (id) => ({ data: { id, items: [] } })),
    packagePage:
      overrides.packagePage ||
      (async () => ({ data: { list: [], total: 0 } })),
    categoryPage: overrides.categoryPage || (async () => ({ data: { list: [], total: 0 } })),
    tags: overrides.tags || (async () => ({ data: [] })),
    save: overrides.save || (async () => ({})),
  }
  const spuApi = {
    page: async (payload) => {
      calls.spuPages.push(clone(payload))
      return controls.spuPage(payload)
    },
    listBySpu: async (spuId) => {
      calls.skuSpus.push(Number(spuId))
      return controls.listBySpu(Number(spuId))
    },
  }
  const packageApi = {
    addOrUpdatePackage: async (payload) => {
      calls.saves.push(clone(payload))
      return controls.save(payload)
    },
    changePackageStatus: async () => ({}),
    deletePackage: async () => ({}),
    getPackageDetail: async (id) => {
      calls.packageDetails.push(Number(id))
      return controls.packageDetail(Number(id))
    },
    getPackagePage: async (payload) => {
      calls.packagePages.push(clone(payload))
      return controls.packagePage(payload)
    },
    sortPackages: async () => ({}),
    uploadPackageImage: async () => ({ data: { url: "https://example.com/package.jpg" } }),
  }
  const categoryApi = {
    getPackageCategoryPage: async (payload) => {
      calls.categoryPages.push(clone(payload))
      return controls.categoryPage(payload)
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
      if (name === "vue-i18n") return { useI18n: () => ({ t: translate, locale }) }
      if (name === "element-plus") {
        return {
          ElMessage: Object.fromEntries(
            ["warning", "success", "error", "info"].map((type) => [
              type,
              (message) => calls.messages.push({ type, message }),
            ]),
          ),
          ElMessageBox: { confirm: async () => true },
        }
      }
      if (name === "@element-plus/icons-vue") return { Plus: {} }
      if (name === "@vueup/vue-quill") return { QuillEditor: {} }
      if (name === "@vueup/vue-quill/dist/vue-quill.snow.css") return {}
      if (name === "@/modules/admin/api/packageCategory") return categoryApi
      if (name === "@/modules/admin/api/package") return packageApi
      if (name === "@/modules/admin/api/spu") return spuApi
      if (name === "@/modules/admin/api/bizTag") return {
        bizTagsByRef: async (type, id) => {
          calls.tagRefs.push([type, id])
          return controls.tags(type, id)
        },
      }
      if (name === "@/modules/admin/utils/i18n") return { pickI18nText }
      if (name === "@/modules/admin/utils/bizTagPicker") {
        return {
          useBizTagPicker: () => {
            const selectedIds = Vue.ref([])
            return {
              options: Vue.ref([]),
              selectedIds,
              reset() { selectedIds.value = [] },
              loadOptions: async () => {},
              loadBound: async () => {},
              saveItems: () => selectedIds.value.map((id) => ({ id })),
            }
          },
        }
      }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const app = renderer.createApp({ ...exports.default, render: () => null })
  const instance = app.mount({})
  t.after(() => app.unmount())
  await flush()
  return {
    state: instance.$.setupState,
    calls,
    controls,
    locale,
    route,
    router,
  }
}

test("service picker uses one shared local catalog instead of per-block remote search", () => {
  const template = descriptor.template?.content || ""
  assert.doesNotMatch(template, /\sremote(?:\s|=|>)/)
  assert.doesNotMatch(template, /remote-method/)
  assert.match(template, /spuOptionsFor\(block\)/)
})

test("SPU catalog preheats once and deduplicates concurrent, multi-block, and reopened-dialog loads", async (t) => {
  const gate = deferred()
  const { state, calls } = await harness(t, {
    spuPage: async () => gate.promise,
  })

  assert.equal(calls.spuPages.length, 1)
  const first = state.ensureSpus()
  const second = state.ensureSpus()
  state.openCreate()
  state.addServiceBlock()
  state.addServiceBlock()
  await flush()
  assert.equal(calls.spuPages.length, 1)

  gate.resolve({ data: { list: [spuItem(1), spuItem(2)], total: 2 } })
  await Promise.all([first, second])
  await flush()
  assert.deepEqual(
    clone(state.spuOptions.map((item) => item.id)),
    [1, 2],
  )

  await state.ensureSpus()
  state.openCreate()
  state.addServiceBlock()
  await flush()
  assert.equal(calls.spuPages.length, 1)
  assert.equal(state.spuBlocks.length, 2)
})

test("SPU catalog follows total across pages without dropping services", async (t) => {
  const firstPage = Array.from({ length: 200 }, (_, index) => spuItem(index + 1))
  const secondPage = [spuItem(201), spuItem(202), spuItem(203)]
  const { state, calls } = await harness(t, {
    spuPage: async ({ pageNum }) => ({
      data: {
        list: pageNum === 1 ? firstPage : secondPage,
        total: 203,
      },
    }),
  })

  await state.ensureSpus()
  assert.deepEqual(
    calls.spuPages,
    [
      { pageNum: 1, pageSize: 200, packageService: 1 },
      { pageNum: 2, pageSize: 200, packageService: 1 },
    ],
  )
  assert.equal(state.spuOptions.length, 203)
  assert.equal(state.spuOptions.at(-1).id, 203)
})

test("failed SPU preload can retry while a successful empty catalog remains cached", async (t) => {
  let attempt = 0
  const { state, calls } = await harness(t, {
    spuPage: async () => {
      attempt += 1
      if (attempt === 1) throw new Error("temporary catalog failure")
      return { data: { list: [], total: 0 } }
    },
  })

  assert.equal(calls.spuPages.length, 1)
  await state.ensureSpus()
  assert.equal(calls.spuPages.length, 2)
  assert.deepEqual(clone(state.spuOptions), [])
  await state.ensureSpus()
  state.openCreate()
  await flush()
  assert.equal(calls.spuPages.length, 2)
})

test("refresh includes newly created package services without clearing the current selection", async (t) => {
  let services = [spuItem(1)]
  const { state, calls } = await harness(t, {
    spuPage: async () => ({ data: { list: services, total: services.length } }),
  })
  state.openCreate()
  const block = state.spuBlocks[0]
  await state.changeSpu(block, 1)
  block.redeemTimes = 3
  services = [spuItem(1), spuItem(2)]

  await state.refreshSpus()

  assert.deepEqual(clone(state.spuOptions.map((item) => item.id)), [1, 2])
  assert.equal(block.spuId, 1)
  assert.equal(block.redeemTimes, 3)
  assert.equal(block.skus[0].skuId, 101)
  assert.equal(calls.spuPages.length, 2)
  assert.ok(calls.spuPages.every((payload) => payload.packageService === 1))
})

test("package service choices include services with internal status zero without a listing filter", async (t) => {
  const item = spuItem(22)
  item.spu.packageService = 1
  item.spu.status = 0
  const { state, calls } = await harness(t, {
    spuPage: async () => ({ data: { list: [item], total: 1 } }),
  })
  assert.deepEqual(clone(state.spuOptions.map((option) => option.id)), [22])
  assert.deepEqual(calls.spuPages, [{ pageNum: 1, pageSize: 200, packageService: 1 }])
})

test("ordinary services cannot enter the choices even if a mixed catalog is returned", async (t) => {
  const ordinary = spuItem(1)
  ordinary.spu.packageService = 0
  const { state } = await harness(t, {
    spuPage: async () => ({ data: { list: [ordinary, spuItem(2)], total: 2 } }),
  })
  state.openCreate()
  assert.deepEqual(clone(state.spuOptions.map((option) => option.id)), [2])
})

test("locale changes relabel the cached SPU catalog without another SPU request", async (t) => {
  const { state, calls, locale } = await harness(t, {
    spuPage: async () => ({
      data: { list: [spuItem(7, "Home Cleaning", "居家清洁")], total: 1 },
    }),
  })

  await state.ensureSpus()
  assert.equal(state.spuOptions[0].name, "Home Cleaning")
  locale.value = "zh"
  await flush()
  assert.equal(state.spuOptions[0].name, "居家清洁")
  assert.equal(calls.spuPages.length, 1)
})

test("SKU catalog deduplicates the same SPU and keeps option copies isolated", async (t) => {
  const gate = deferred()
  const { state, calls } = await harness(t, {
    listBySpu: async () => gate.promise,
  })
  await state.ensureSpus()

  const firstPromise = state.loadSpuBlock(5, [savedSku(501, 2)])
  const secondPromise = state.loadSpuBlock(5, [savedSku(501, 6)])
  await flush()
  assert.deepEqual(calls.skuSpus, [5])

  gate.resolve({
    data: {
      specTypes: [],
      skus: [{ skuId: 501, skuCode: "SKU-501", price: 25 }],
    },
  })
  const [first, second] = await Promise.all([firstPromise, secondPromise])
  assert.notEqual(first.skus, second.skus)
  assert.notEqual(first.skus[0], second.skus[0])
  assert.equal(first.skus[0].price, 25)
  assert.equal(second.skus[0].price, 25)
  first.skus[0].price = 9
  assert.equal(second.skus[0].price, 25)

  const third = await state.loadSpuBlock(5, [savedSku(900, 1)])
  assert.deepEqual(calls.skuSpus, [5, 5])
  assert.equal(third.skus.length, 1)
  assert.equal(third.skus[0].skuId, 501)
  assert.equal(third.skus[0].price, 25)
})

test("a later package edit reads the service's current SKUs and current option names", async (t) => {
  let generation = 0
  const { state } = await harness(t, {
    listBySpu: async () => {
      generation += 1
      if (generation === 1) {
        return {
          data: {
            specTypes: [{ specKey: "11", specTypeId: 11, values: [{ specValueId: 456, specValueName: "4 Unit", nameI18n: { en: "456" } }] }],
            skus: [{ skuId: 501, 11: { en: "456" }, price: 25 }],
          },
        }
      }
      return {
        data: {
          specTypes: [
            { specKey: "10", specTypeId: 10, values: [{ specValueId: 20, nameI18n: { en: "With furniture" } }] },
            { specKey: "11", specTypeId: 11, values: [{ specValueId: 456, specValueName: "4 Unit", nameI18n: { en: "4 Unit" } }, { specValueId: 457, specValueName: "3 Unit", nameI18n: { en: "3 Unit" } }] },
          ],
          skus: [
            { skuId: 700, 10: { en: "With furniture" }, 11: { en: "456" }, price: 90 },
            { skuId: 701, 10: { en: "With furniture" }, 11: { en: "3 Unit" }, price: 30 },
          ],
        },
      }
    },
  })
  const first = await state.loadSpuBlock(5, [savedSku(501, 2)])
  assert.equal(first.skus[0].specLabel, "4 Unit")
  const second = await state.loadSpuBlock(5, [savedSku(501, 2)])
  assert.deepEqual(clone(second.skus.map((sku) => [sku.skuId, sku.specLabel, sku.price])), [
    [700, "With furniture / 4 Unit", 90],
    [701, "With furniture / 3 Unit", 30],
  ])
})

test("editing keeps a selected off-shelf service as a fallback option", async (t) => {
  const { state, calls } = await harness(t, {
    spuPage: async () => ({ data: { list: [spuItem(1)], total: 1 } }),
    listBySpu: async () => ({ data: { specTypes: [], skus: [] } }),
    packageDetail: async (id) => ({
      data: {
        id,
        categoryId: 1,
        validDays: 30,
        discount: 0.8,
        displayTotalPrice: 100,
        displaySalePrice: 80,
        nameI18n: { en: "Legacy package" },
        imageUrls: [],
        items: [
          {
            spuId: 99,
            skuId: 9901,
            redeemTimes: 3,
            available: false,
            spuNameI18n: { en: "Retired service", zh: "已下架服务" },
            specValueNameI18n: {},
            skuPrice: 50,
          },
        ],
      },
    }),
  })

  await state.ensureSpus()
  await state.openEdit({ id: 77 })
  const block = state.spuBlocks[0]
  assert.equal(block.spuId, 99)
  assert.equal(block.redeemTimes, 3)
  assert.equal(block.skus[0].skuId, 9901)
  const options = clone(state.spuOptionsFor(block))
  assert.deepEqual(options.find((item) => item.id === 99), {
    id: 99,
    name: "Retired service",
  })
  assert.ok(options.some((item) => item.id === 1))
  assert.equal(options.filter((item) => item.id === 99).length, 1)
  assert.equal(calls.spuPages.length, 1)
})

test("clearing an SPU invalidates its pending SKU response", async (t) => {
  const gate = deferred()
  const { state, calls } = await harness(t, {
    listBySpu: async () => gate.promise,
  })
  await state.ensureSpus()
  state.openCreate()
  const block = state.spuBlocks[0]

  const pending = state.changeSpu(block, 1)
  await flush()
  assert.deepEqual(calls.skuSpus, [1])
  await state.changeSpu(block, null)
  assert.equal(block.spuId, null)
  assert.equal(block.redeemTimes, 1)
  assert.deepEqual(clone(block.skus), [])

  gate.resolve({
    data: {
      specTypes: [],
      skus: [{ skuId: 101, skuCode: "Late SKU", price: 20 }],
    },
  })
  await pending
  await flush()
  assert.equal(block.spuId, null)
  assert.equal(block.redeemTimes, 1)
  assert.deepEqual(clone(block.skus), [])
})

test("package list displays every bound service as a wrapping list with an empty fallback", () => {
  const template = descriptor.template?.content || ""
  const column = template.match(/<el-table-column :label="t\('admin\.packageList\.table\.services'\)"[^>]*>([\s\S]*?)<\/el-table-column>/)?.[1]
  assert.ok(column)
  assert.match(column, /v-for="service in row\.services"/)
  assert.match(column, /\{\{ service\.name \}\}/)
  assert.match(column, /<span v-else>-<\/span>/)
  assert.doesNotMatch(column, /el-tooltip|v-html|show-overflow-tooltip/)
  const styles = descriptor.styles.map((style) => style.content).join("\n")
  const serviceStyle = styles.match(/\.bound-service\s*\{([^}]+)\}/)?.[1] || ""
  assert.match(serviceStyle, /white-space:\s*normal/)
  assert.match(serviceStyle, /overflow-wrap:\s*anywhere/)
  assert.doesNotMatch(serviceStyle, /text-overflow:\s*ellipsis|overflow:\s*hidden|line-clamp/)
})

test("package list maps distinct services from page items without per-package or per-service requests", async (t) => {
  const packages = [
    {
      id: 77,
      nameI18n: { en: "Whole home package", zh: "全屋套餐" },
      status: 1,
      discount: 0.8,
      displayTotalPrice: 100,
      displaySalePrice: 80,
      items: [
        { spuId: 1, skuId: 101, spuNameI18n: { en: "<strong>Home&nbsp;Cleaning</strong>", zh: "<b>居家清洁</b>" } },
        { spuId: "1", skuId: 102, spuNameI18n: { en: "Home Cleaning", zh: "居家清洁" } },
        { spuId: 2, skuId: 201, spuNameI18n: { en: "<p>Air conditioning</p>", zh: "<p>空调保养</p>" } },
        { spuId: 3, skuId: 301, spuNameI18n: { en: "Home Cleaning", zh: "居家清洁" } },
        { skuId: 401, spuNameI18n: { en: "<b>Move&nbsp;Out</b>", zh: "<b>退租清洁</b>" } },
        { skuId: 402, spuNameI18n: { en: "Move Out", zh: "退租清洁" } },
        { spuId: 0, skuId: 403, spuNameI18n: { en: "Move Out", zh: "退租清洁" } },
        { spuId: 4, spuNameI18n: { zh: "单语服务" } },
        { spuId: 5, spuNameI18n: {} },
        null,
        {},
      ],
    },
    { id: 78, nameI18n: { en: "Empty package", zh: "空套餐" }, items: [] },
  ]
  const { state, calls, locale } = await harness(t, {
    packagePage: async () => ({ data: { list: packages, total: 2 } }),
  })
  assert.deepEqual(clone(state.rows[0].services), [
    { key: "spu:1", id: 1, name: "Home Cleaning" },
    { key: "spu:2", id: 2, name: "Air conditioning" },
    { key: "spu:3", id: 3, name: "Home Cleaning" },
    { key: "name:Move Out", id: null, name: "Move Out" },
    { key: "spu:4", id: 4, name: "单语服务" },
    { key: "spu:5", id: 5, name: "Service 9" },
  ])
  assert.deepEqual(clone(state.rows[1].services), [])
  assert.equal(state.rows[0].onShelf, true)
  assert.equal(state.rows[0].displaySalePrice, 80)
  assert.equal(calls.packagePages.length, 1)
  assert.deepEqual(calls.packageDetails, [])
  assert.deepEqual(calls.skuSpus, [])
  assert.equal(calls.spuPages.length, 1)

  locale.value = "zh"
  await flush()
  assert.deepEqual(clone(state.rows[0].services.map((service) => service.name)), [
    "居家清洁", "空调保养", "居家清洁", "退租清洁", "单语服务", "服务 9",
  ])
  assert.equal(calls.packagePages.length, 2)
  state.onPageChange(2)
  await flush()
  assert.deepEqual(calls.packagePages, [
    { pageNum: 1, pageSize: 10 },
    { pageNum: 1, pageSize: 10 },
    { pageNum: 2, pageSize: 10 },
  ])
  assert.deepEqual(calls.packageDetails, [])
  assert.deepEqual(calls.skuSpus, [])
  assert.equal(calls.spuPages.length, 1)
  assert.ok(state.rows[0].services.every((service) => !/[<>]|&nbsp;/.test(service.name)))
})

const packageDetail = (id, items = []) => ({
  data: { id, categoryId: 1, validDays: 30, discount: 0.8, nameI18n: { en: `Package ${id}` }, items },
})

test("bound service links retain only valid positive IDs and missing IDs remain readable text", async (t) => {
  const { state } = await harness(t)
  const services = state.boundServices([
    { spuId: "9", spuNameI18n: { en: "Valid service" } },
    { spuNameI18n: { en: "Legacy service" } },
    { spuId: 1.5, spuNameI18n: { en: "Fraction" } },
    { spuId: "1e2", spuNameI18n: { en: "Exponent" } },
    { spuId: "9007199254740992", spuNameI18n: { en: "Unsafe number" } },
  ])
  assert.deepEqual(clone(services.map(({ id }) => id)), [9, null, null, null, null])
  const template = descriptor.template.content
  assert.match(template, /<RouterLink\s+v-if="service\.id != null"/)
  assert.match(template, /path: '\/admin\/package\/services', query: \{ editId: String\(service\.id\) \}/)
  assert.match(template, /<span v-else>\{\{ service\.name \}\}<\/span>/)
})

test("an initial edit link waits for mounted metadata and opens a package outside the current page", async (t) => {
  const metadata = deferred()
  const { state, calls } = await harness(t, {
    route: { query: { editId: "91" } },
    categoryPage: async () => metadata.promise,
    packageDetail: async (id) => packageDetail(id),
    tags: async () => ({ data: [{ id: 3, nameI18n: { en: "Popular" } }] }),
  })
  assert.deepEqual(calls.packageDetails, [])
  assert.equal(state.dialogVisible, false)
  metadata.resolve({ data: { list: [], total: 0 } })
  await flush()

  assert.deepEqual(calls.packageDetails, [91])
  assert.equal(state.rows.length, 0)
  assert.equal(state.dialogVisible, true)
  assert.equal(state.isEdit, true)
  assert.equal(state.editingId, 91)
  assert.equal(state.form.name, "Package 91")
  assert.deepEqual(clone(state.tagPicker.selectedIds.value), [3])
})

test("same-page edit link changes ignore an older detail response", async (t) => {
  const first = deferred()
  const second = deferred()
  const { state, calls, route } = await harness(t, {
    route: { query: { editId: "11", filter: "keep" }, hash: "#packages" },
    packageDetail: async (id) => id === 11 ? first.promise : second.promise,
  })
  route.query = { editId: "22", filter: "keep" }
  await flush()
  second.resolve(packageDetail(22))
  await flush()
  assert.equal(state.editingId, 22)
  assert.equal(state.form.name, "Package 22")

  first.resolve(packageDetail(11))
  await flush()
  assert.deepEqual(calls.packageDetails, [11, 22])
  assert.equal(state.editingId, 22)
  assert.equal(state.form.name, "Package 22")
  assert.equal(state.detailLoading, false)
})

test("a late SKU response cannot overwrite a newer linked package's service blocks", async (t) => {
  const oldSkus = deferred()
  const { state, route } = await harness(t, {
    route: { query: { editId: "11" } },
    packageDetail: async (id) => packageDetail(id, [{ spuId: id, bindType: 1, redeemTimes: 2 }]),
    listBySpu: async (id) => id === 11 ? oldSkus.promise : { data: { skus: [{ skuId: 2201, price: 20 }] } },
  })
  route.query = { editId: "22" }
  await flush()
  assert.equal(state.editingId, 22)
  assert.equal(state.spuBlocks[0].spuId, 22)
  oldSkus.resolve({ data: { skus: [{ skuId: 1101, price: 10 }] } })
  await flush()
  assert.equal(state.spuBlocks[0].spuId, 22)
  assert.equal(state.spuBlocks[0].skus[0].skuId, 2201)
})

test("closing a pending linked editor clears only editId and invalidates its response", async (t) => {
  const detail = deferred()
  const { state, calls, route } = await harness(t, {
    route: { query: { editId: "31", filter: ["one", "two"] }, hash: "#keep" },
    packageDetail: async () => detail.promise,
  })
  assert.equal(state.detailLoading, true)
  state.dialogVisible = false
  await flush()
  assert.deepEqual(clone(route.query), { filter: ["one", "two"] })
  assert.equal(route.hash, "#keep")
  assert.deepEqual(calls.replacements.at(-1), {
    path: "/admin/package/packages", query: { filter: ["one", "two"] }, hash: "#keep",
  })
  detail.resolve(packageDetail(31))
  await flush()
  assert.equal(state.dialogVisible, false)
  assert.equal(state.editingId, null)
  assert.equal(state.detailLoading, false)
})

test("removing editId closes its associated editor while manual creation and edits detach the link", async (t) => {
  const { state, route } = await harness(t, {
    route: { query: { editId: "41", filter: "keep" }, hash: "#keep" },
    packageDetail: async (id) => packageDetail(id),
  })
  route.query = { filter: "keep" }
  await flush()
  assert.equal(state.dialogVisible, false)

  route.query = { editId: "42", filter: "keep" }
  await flush()
  state.openCreate()
  await flush()
  assert.equal(state.dialogVisible, true)
  assert.equal(state.isEdit, false)
  assert.equal(state.editingId, null)
  assert.deepEqual(clone(route.query), { filter: "keep" })

  route.query = { editId: "43", filter: "keep" }
  await flush()
  await state.openEdit({ id: 44 })
  await flush()
  assert.equal(state.dialogVisible, true)
  assert.equal(state.editingId, 44)
  assert.deepEqual(clone(route.query), { filter: "keep" })
  assert.equal(route.hash, "#keep")
})

test("invalid edit IDs never request details and empty or mismatched details cannot open blank editors", async (t) => {
  for (const editId of ["", "0", "-1", "1.5", "1e2", "01", "9007199254740992", ["5", "6"], null]) {
    const { state, calls, route } = await harness(t, { route: { query: { editId, filter: "keep" } } })
    assert.deepEqual(calls.packageDetails, [])
    assert.equal(state.dialogVisible, false)
    assert.deepEqual(clone(route.query), { filter: "keep" })
    assert.equal(calls.messages.at(-1)?.type, "error")
  }
  for (const response of [{ data: null }, { data: {} }, { data: { id: 999 } }, new Error("missing package")]) {
    const { state, calls, route } = await harness(t, {
      route: { query: { editId: "51", filter: "keep" }, hash: "#keep" },
      packageDetail: async () => {
        if (response instanceof Error) throw response
        return response
      },
    })
    assert.equal(state.dialogVisible, false)
    assert.equal(state.editingId, null)
    assert.equal(state.detailLoading, false)
    assert.deepEqual(clone(route.query), { filter: "keep" })
    assert.equal(route.hash, "#keep")
    assert.equal(calls.messages.at(-1)?.type, "error")
  }
})

test("linked save success clears editId while preserving the rest of the URL", async (t) => {
  const { state, calls, route } = await harness(t, {
    route: { query: { editId: "61", filter: "keep" }, hash: "#keep" },
    packageDetail: async (id) => packageDetail(id, [{ spuId: 1, bindType: 1, redeemTimes: 2 }]),
  })
  await state.save()
  await flush()
  assert.equal(calls.saves[0].id, 61)
  assert.equal(state.dialogVisible, false)
  assert.deepEqual(clone(route.query), { filter: "keep" })
  assert.equal(route.hash, "#keep")
})

test("late tag responses cannot replace the newer editor's selection", async (t) => {
  const oldTags = deferred()
  const { state, route } = await harness(t, {
    route: { query: { editId: "71" } },
    packageDetail: async (id) => packageDetail(id),
    tags: async (_type, id) => id === 71 ? oldTags.promise : { data: [{ id: 72 }] },
  })
  route.query = { editId: "72" }
  await flush()
  assert.equal(state.editingId, 72)
  assert.deepEqual(clone(state.tagPicker.selectedIds.value), [72])
  oldTags.resolve({ data: [{ id: 71 }] })
  await flush()
  assert.equal(state.editingId, 72)
  assert.deepEqual(clone(state.tagPicker.selectedIds.value), [72])
})

test("failed linked saves clear only editId and keep the loaded record available to retry", async (t) => {
  const { state, calls, route } = await harness(t, {
    route: { query: { editId: "81", filter: "keep" }, hash: "#keep" },
    packageDetail: async (id) => packageDetail(id, [{ spuId: 1, bindType: 1, redeemTimes: 2 }]),
    save: async () => { throw new Error("save rejected") },
  })
  await state.save()
  await flush()
  assert.equal(state.editingId, 81)
  assert.equal(state.dialogVisible, true)
  assert.equal(state.submitLoading, false)
  assert.deepEqual(clone(route.query), { filter: "keep" })
  assert.equal(route.hash, "#keep")
  assert.equal(calls.messages.at(-1)?.message, "save rejected")
})

test("a pending linked editor cannot save a blank record before details arrive", async (t) => {
  const pending = deferred()
  const { state, calls } = await harness(t, {
    route: { query: { editId: "91" } },
    packageDetail: async () => pending.promise,
  })
  state.form.categoryId = 1
  state.spuBlocks = [{ key: 99, spuId: 1, redeemTimes: 1, skus: [], skuSeq: 0 }]
  await state.save()
  assert.deepEqual(calls.saves, [])
  state.dialogVisible = false
  await flush()
  pending.resolve(packageDetail(91))
  await flush()
  assert.equal(state.dialogVisible, false)
})
