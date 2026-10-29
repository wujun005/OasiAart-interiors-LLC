import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const source = readFileSync(new URL("../src/modules/client/utils/package-visits.ts", import.meta.url), "utf8")
const exports = {}
runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports })
const { packageVisitCount } = exports

test("a shorter add-on service shares the longer service's visits", () => {
  assert.equal(packageVisitCount({
    redeemTimes: 5,
    items: [{ redeemTimes: 4 }, { redeemTimes: 1 }],
  }), 4)
})

test("a single service keeps its own visit count", () => {
  assert.equal(packageVisitCount({ redeemTimes: 3, items: [{ redeemTimes: 3 }] }), 3)
  assert.equal(packageVisitCount({ redeemTimes: "4" }), 4)
})

test("missing visit counts stay hidden", () => {
  assert.equal(packageVisitCount({ items: [{ redeemTimes: 0 }, { redeemTimes: null }] }), 0)
  assert.equal(packageVisitCount(null), 0)
})

test("catalog cards without item counts use a stated visit total instead of the summed total", () => {
  assert.equal(packageVisitCount({
    redeemTimes: 5,
    items: [],
    nameI18n: { en: "Home Cleaning + AC - 4 Visits" },
  }), 4)
  assert.equal(packageVisitCount({
    redeemTimes: 4,
    packageName: "Home Cleaning Package - 4 Visits",
  }), 4)
  assert.equal(packageVisitCount({
    redeemTimes: 2,
    nameI18n: { en: "Deep Clean + Full AC Cleaning — 1 Visit Each" },
  }), 2)
  assert.equal(packageVisitCount({
    redeemTimes: 1,
    nameI18n: { en: "Split AC Cleaning – 3 or 4 Units, 1 Visit" },
  }), 1)
})
