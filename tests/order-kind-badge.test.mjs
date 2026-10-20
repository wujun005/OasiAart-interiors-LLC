import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse } from "@vue/compiler-sfc"

const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")

for (const file of [
  "src/modules/client/pages/order-list.vue",
  "src/modules/h5/pages/order-list.vue",
]) {
  test(`${file} labels package and regular orders`, () => {
    const source = read(file)
    const { descriptor, errors } = parse(source, { filename: file })

    assert.deepEqual(errors, [])
    assert.match(descriptor.template.content, /item\.orderKindText/)
    assert.match(descriptor.template.content, /item\.orderKind/)
    assert.match(descriptor.scriptSetup.content, /orderKind:\s*isPackage\s*\?\s*"package"\s*:\s*"regular"/)
    assert.match(descriptor.scriptSetup.content, /client\.orderList\.packageOrder/)
    assert.match(descriptor.scriptSetup.content, /client\.orderList\.regularOrder/)
  })
}

test("order type labels are localized", () => {
  const source = read("src/modules/client/locales/index.ts")

  assert.match(source, /packageOrder:\s*'Package order'/)
  assert.match(source, /regularOrder:\s*'Regular order'/)
  assert.match(source, /packageOrder:\s*'套餐订单'/)
  assert.match(source, /regularOrder:\s*'普通订单'/)
})

test("order detail loads the detail endpoint and renders every package fulfilment", () => {
  const api = read("src/modules/client/api/index.ts")
  const detail = read("src/modules/client/components/ClientOrderDetailView.vue")

  assert.match(api, /http\.get\('\/client\/order\/detail'/)
  assert.match(api, /fulfillmentList\?:\s*PackageFulfillmentRecord\[\]/)
  assert.match(detail, /await getClientOrderDetail\(orderNo\)/)
  assert.match(detail, /v-for="visit in packageFulfillmentViews"/)
  assert.match(detail, /visit\.scheduleText/)
  assert.match(detail, /visit\.addressText/)
  assert.match(detail, /visit\.contactText/)
  assert.match(detail, /visit\.cancelDetail/)
  assert.match(detail, /completed \|\| inProgress/)
  assert.match(detail, /scheduled\s*\? scheduleStatusText/)
  assert.match(api, /http\.post\('\/client\/order\/package\/fulfill'/)
  assert.match(detail, /fulfillPackageOrder/)
  assert.match(detail, /canBookPackageVisit/)
})
