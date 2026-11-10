import test from "node:test"
import assert from "node:assert/strict"
import { hourlyCompareGap, hourlyCustomerUnitPrice, hourlyMarginPercent, hourlySupplierCost, quantityMarginPercent, summarizeHourlyCompare, summarizeQuantityCompare } from "../src/modules/admin/utils/supplierPortal.ts"

test("person-hour profit uses the rate, headcount and duration", () => {
  const input = {
    quoteMode: 3,
    unitPrice: 35,
    platformPriceWithTax: 210,
    sources: [
      { specTypeName: "Duration", specValueName: "2 Hours" },
      { specTypeName: "Number of Cleaners", specValueName: "1 Cleaner" },
    ],
  }
  assert.equal(hourlySupplierCost(input), 70)
  assert.equal(hourlyMarginPercent(input), 67)
  assert.equal(hourlySupplierCost({
    ...input,
    sources: [
      { specTypeName: "时长", specValueName: "2小时" },
      { specTypeName: "人数", specValueName: "1人" },
    ],
  }), 70)
})

test("material hourly profit follows the option, including Chinese labels", () => {
  const shared = {
    quoteMode: 2,
    unitPriceWithMaterial: 80,
    unitPriceWithoutMaterial: 65.5,
    staffCount: 1,
    serviceHours: 1,
    platformPriceWithTax: 240,
  }
  assert.equal(hourlySupplierCost({ ...shared, sources: ["With Materials"] }), 80)
  assert.equal(hourlyMarginPercent({ ...shared, sources: ["With Materials"] }), 67)
  assert.equal(hourlySupplierCost({ ...shared, sources: ["不带材料"] }), 65.5)
  assert.equal(hourlyMarginPercent({ ...shared, sources: ["不带材料"] }), 73)
})

test("duration in minutes and a couples option expand the person-hour cost", () => {
  const input = {
    quoteMode: 3,
    unitPrice: 100,
    platformPriceWithTax: 280,
    sources: [
      { specTypeName: "Single/Couples", specValueName: "Couples" },
      { specTypeName: "Duration", specValueName: "60 min" },
    ],
  }
  assert.equal(hourlySupplierCost(input), 200)
  assert.equal(hourlyMarginPercent(input), 29)
})

test("a single option is not counted as two because the spec type mentions couples", () => {
  const input = {
    quoteMode: 3,
    unitPrice: 100,
    platformPriceWithTax: 240,
    sources: [
      { specTypeName: "Single/Couples", specValueName: "Single" },
      { specValueName: "60 min" },
    ],
  }
  assert.equal(hourlySupplierCost(input), 100)
  assert.equal(hourlyMarginPercent(input), 58)
})

test("stored line price is used when the option has no duration", () => {
  const input = {
    quoteMode: 3,
    unitPrice: 45,
    quotePrice: 100,
    platformPriceWithTax: 240,
    sources: ["Lighting"],
  }
  assert.equal(hourlySupplierCost(input), 100)
  assert.equal(hourlyMarginPercent(input), 58)
})

test("profit stays empty when neither a line price nor a duration is known", () => {
  assert.equal(hourlyMarginPercent({
    quoteMode: 2,
    unitPriceWithMaterial: 35,
    unitPriceWithoutMaterial: 30,
    platformPriceWithTax: 210,
    sources: ["With Materials"],
  }), null)
})

test("one hour per technician is one person for one hour", () => {
  const input = {
    quoteMode: 3,
    unitPrice: 880,
    staffCount: 0,
    serviceHours: 0,
    platformPriceWithTax: 162.75,
    sources: [{ specValueNameI18n: { en: "1 Hour / Tech", zh: "1 小时/技术" } }],
  }
  assert.equal(hourlySupplierCost(input), 880)
  assert.equal(hourlyCustomerUnitPrice(input), 162.75)
  assert.equal(hourlyMarginPercent(input), -441)
  assert.equal(hourlySupplierCost({
    ...input,
    unitPrice: 40,
    sources: ["1名技术员", { specValueRemarkI18n: { zh: "1小时" } }],
  }), 40)
  assert.equal(hourlySupplierCost({
    quoteMode: 3,
    unitPrice: 50,
    sources: ["2 清洁工", "2小时"],
  }), 200)
  const nested = {
    ...input,
    sources: [{}, [null, [{ specValueNameI18n: { en: "1 Hour / Tech", zh: "1 小时/技术" } }]], ""],
  }
  assert.equal(hourlyCustomerUnitPrice(nested), 162.75)
  assert.equal(hourlyMarginPercent(nested), -441)
  const summary = summarizeHourlyCompare([input], null)
  assert.equal(summary.customerMin, 162.75)
  assert.equal(summary.customerMax, 162.75)
  assert.equal(summary.marginMin, -441)
  assert.equal(summary.marginMax, -441)
})

test("quantity profit compares the one unit price with the customer price", () => {
  const shared = { quoteMode: 4, unitPrice: 800, staffCount: 2, serviceHours: 3 }
  assert.equal(quantityMarginPercent({ ...shared, platformPriceWithTax: 1000 }), 20)
  assert.equal(quantityMarginPercent({ ...shared, platformPriceWithTax: 700 }), -14)
  assert.equal(quantityMarginPercent({ quoteMode: 3, unitPrice: 800, platformPriceWithTax: 1000 }), null)
  const summary = summarizeQuantityCompare([
    { ...shared, platformPriceWithTax: 1000 },
    { ...shared, platformPriceWithTax: 1200 },
    { ...shared },
  ])
  assert.equal(summary.customerMin, 1000)
  assert.equal(summary.customerMax, 1200)
  assert.equal(summary.marginMin, 20)
  assert.equal(summary.marginMax, 33)
})

test("tv installation uses the technician remark and the one-hour spec", () => {
  const sources = [{
    size: { zh: "最大 55 英寸", en: 'Upto 55" inches', remarkI18n: { zh: "1 技术", en: "1 Tech" } },
    time: { zh: "1小时", en: "1 Hour" },
  }]
  const priced = { quoteMode: 3, unitPrice: 80, platformPrice: 200, sources }
  assert.equal(hourlyCustomerUnitPrice(priced), 210)
  assert.equal(hourlySupplierCost(priced), 80)
  assert.equal(hourlyMarginPercent(priced), 62)
  assert.equal(hourlyCompareGap([priced], null), "ok")
  assert.equal(hourlyCompareGap([{ quoteMode: 3, unitPrice: 80, sources }], null), "price")
  assert.equal(hourlyCompareGap([{
    quoteMode: 3, unitPrice: 80, platformPrice: 200, sources: [{ zh: "最大 55 英寸" }],
  }], null), "effort")
})

test("hourly review compares the unit rate, not every option total", () => {
  const shared = {
    quoteMode: 2,
    unitPriceWithMaterial: 120,
    unitPriceWithoutMaterial: 80,
    serviceHours: 2,
  }
  const summary = summarizeHourlyCompare([
    { ...shared, staffCount: 1, platformPriceWithTax: 89.25, sources: ["无材料"] },
    { ...shared, staffCount: 2, platformPriceWithTax: 178.5, sources: ["无材料"] },
    { ...shared, staffCount: 1, platformPriceWithTax: 400, sources: ["带材料"] },
  ], "without")
  assert.deepEqual(summary, {
    customerMin: 44.63,
    customerMax: 44.63,
    marginMin: -79,
    marginMax: -79,
  })
  assert.equal(summarizeHourlyCompare([
    { quoteMode: 3, unitPrice: 45, staffCount: 1, serviceHours: 2, platformPriceWithTax: 210 },
  ], null).customerMin, 105)
})
