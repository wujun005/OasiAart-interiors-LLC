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

test("order add-ons show whether they were bought with the order or after payment", () => {
  const text = exports.formatOrderAddOns([
    {
      attachValueName: "Towels",
      quantity: 1,
      source: "INITIAL",
      sourceI18n: { zh: "首次下单", en: "Initial order" },
    },
    {
      attachValueNameI18n: { zh: "精油", en: "Oil" },
      quantity: 2,
      source: "ADDON",
      sourceI18n: { zh: "支付后追加", en: "Added after payment" },
    },
  ], "zh")

  assert.equal(text, "Towels（首次下单） · 精油 × 2（支付后追加）")
  assert.equal(exports.orderLineSourceLabel({ addedAfterPay: true }, "en"), "Added after payment")
  assert.equal(exports.formatOrderAddOns([{
    attachValueNameI18n: { zh: "额外毛巾", en: "Extra towels" },
    unitI18n: { zh: "套", en: "set" },
    quantity: 2,
    source: "ADDON",
    sourceI18n: { en: "Added after payment" },
    unitPriceWithoutTax: "20.00",
    unitPriceWithTax: "21.00",
    amountWithoutTax: "40.00",
    amountWithTax: "42.00",
    taxAmount: "2.00",
  }], "en"), "Extra towels / set × 2 (Added after payment) · AED 42.00")
  assert.equal(exports.readPurchasedAttachLines([{
    attachValueName: "Extra towels",
    quantity: 2,
    unitPriceWithTax: 21,
    amountWithoutTax: 40,
    amountWithTax: 42,
    taxAmount: 2,
  }], "en")[0].taxAmount, 2)
})
