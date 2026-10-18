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
  spu: { id, spuName: english, status: 1 },
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
    messages: [],
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
    addOrUpdatePackage: async () => ({}),
    changePackageStatus: async () => ({}),
    deletePackage: async () => ({}),
    getPackageDetail: async (id) => {
      calls.packageDetails.push(Number(id))
      return controls.packageDetail(Number(id))
    },
    getPackagePage: async (payload) => {
      calls.packagePages.push(clone(payload))
      return { data: { list: [], total: 0 } }
    },
    sortPackages: async () => ({}),
    uploadPackageImage: async () => ({ data: { url: "https://example.com/package.jpg" } }),
  }
  const categoryApi = {
    getPackageCategoryPage: async (payload) => {
      calls.categoryPages.push(clone(payload))
      return { data: { list: [], total: 0 } }
    },
  }
  const exports = {}
  runInNewContext(code, {
    exports,
    console,
    FormData,
    require: (name) => {
      if (name === "vue") return Vue
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
      if (name === "@/modules/admin/utils/i18n") return { pickI18nText }
      if (name === "@/modules/admin/utils/bizTagPicker") {
        return {
          useBizTagPicker: () => ({
            reset() {},
            loadOptions: async () => {},
            loadBound: async () => {},
          }),
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
    calls.spuPages.map(({ pageNum, pageSize, shelfStatus }) => ({ pageNum, pageSize, shelfStatus })),
    [
      { pageNum: 1, pageSize: 200, shelfStatus: 1 },
      { pageNum: 2, pageSize: 200, shelfStatus: 1 },
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

test("SKU catalog deduplicates the same SPU and overlays isolated redeem counts", async (t) => {
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
  assert.equal(first.skus[0].redeemTimes, 2)
  assert.equal(second.skus[0].redeemTimes, 6)
  first.skus[0].redeemTimes = 9
  assert.equal(second.skus[0].redeemTimes, 6)

  const third = await state.loadSpuBlock(5, [])
  assert.deepEqual(calls.skuSpus, [5])
  assert.equal(third.skus[0].redeemTimes, 1)
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
        originalPrice: 100,
        salePrice: 80,
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
  assert.equal(block.selectedSkuId, 9901)
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
  assert.equal(block.selectedSkuId, null)
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
  assert.equal(block.selectedSkuId, null)
  assert.deepEqual(clone(block.skus), [])
})
