import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const source = readFileSync(new URL("../src/modules/client/utils/order-localization.ts", import.meta.url), "utf8")
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const exports = {}
runInNewContext(code, { exports })

test("order summary reads priced add-on lines and localized names", () => {
  const lines = exports.readOrderSummaryAttachLines([
    {
      id: "9",
      label: "Fridge cleaning",
      labelI18n: { en: "Fridge cleaning", zh: "冰箱清洁" },
      unitI18n: { en: "visit", zh: "次" },
      quantity: 2,
      amount: 60,
    },
    { label: "", quantity: 1 },
    { attachValueName: "Oven", quantity: 0 },
  ], "zh")

  assert.deepEqual(JSON.parse(JSON.stringify(lines)), [{
    id: "9",
    label: "冰箱清洁 / 次",
    quantity: 2,
    amount: 60,
  }])
})

test("order summary keeps saved order add-ons that have no price", () => {
  const lines = exports.readOrderSummaryAttachLines([
    {
      attachValueId: 4,
      attachValueNameI18n: { en: "Inside cabinets", zh: "柜内清洁" },
      quantity: 1,
    },
  ], "en")

  assert.deepEqual(JSON.parse(JSON.stringify(lines)), [{
    id: "4",
    label: "Inside cabinets",
    quantity: 1,
  }])
  assert.equal("amount" in lines[0], false)
})
