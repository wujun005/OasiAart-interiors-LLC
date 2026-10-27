import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Run the real TypeScript helper. Its API type import must not become a runtime dependency.
const source = readFileSync(new URL('../src/modules/client/utils/package-spec-identity.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports })
const { hydratePackageSpecIds } = exports
const plain = (value) => JSON.parse(JSON.stringify(value))
const freeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const furnishing = () => ({
  specTypeNameI18n: { en: 'ApolloFurnishing' },
  specValueNameI18n: { en: 'Unfurnished' },
})
const homeSize = () => ({
  specTypeNameI18n: { en: 'ApolloHomeSize' },
  specValueNameI18n: { en: '1 BHK' },
})
const item = (spuId = 162, lines = [furnishing(), homeSize()]) => ({
  packageItemId: spuId - 47,
  spuId,
  bindType: 1,
  skuOptions: [{ skuId: spuId === 162 ? 5055 : 5063, specI18n: lines }],
})
const metadata = (id = 162) => ({
  id,
  packageService: 1,
  specBindings: [
    { specTypeId: 350, specValueIds: [811, 810] },
    { specTypeId: 351, specValueIds: [812, 813, 814, 815] },
  ],
  specTypeNameI18n: {
    350: { en: 'ApolloFurnishing' },
    351: { en: 'ApolloHomeSize' },
  },
  specValueNameI18n: {
    811: { en: 'Unfurnished' },
    810: { en: 'Furnished' },
    812: { en: '1 BHK' },
    813: { en: '2 BHK' },
    814: { en: '3 BHK' },
    815: { en: '4 BHK' },
  },
})
const firstLine = (card, index = 0) => card.items[index].skuOptions[0].specI18n[0]

// These IDs and the flat language maps match the actual public service 162/163 contract.
test('restores the shared 350/351 identities for both services without changing source data', async () => {
  const card = freeze({ id: 28, nameI18n: { en: 'Home care' }, items: [item(162), item(163)] })
  const before = plain(card)
  const details = freeze({ 162: metadata(162), 163: metadata(163) })
  const calls = []
  const result = await hydratePackageSpecIds(card, async (spuId) => {
    calls.push(spuId)
    return details[spuId]
  })

  assert.deepEqual(calls, ['162', '163'])
  assert.deepEqual(plain(result.items.map(entry => entry.skuOptions[0].specI18n)), [
    [
      { ...furnishing(), specTypeId: '350', specValueId: '811' },
      { ...homeSize(), specTypeId: '351', specValueId: '812' },
    ],
    [
      { ...furnishing(), specTypeId: '350', specValueId: '811' },
      { ...homeSize(), specTypeId: '351', specValueId: '812' },
    ],
  ])
  assert.deepEqual(plain(card), before)
  assert.notEqual(result, card)
  assert.equal(result.items[0].skuOptions[0].skuId, 5055)
  assert.equal(result.items[1].skuOptions[0].skuId, 5063)
})

test('conflicting languages, duplicate dictionary names and values from another type remain unidentified', async () => {
  const cases = [
    {
      name: 'conflicting type translations',
      line: { ...furnishing(), specTypeNameI18n: { en: 'ApolloFurnishing', zh: '家具' } },
      change: detail => { detail.specTypeNameI18n[350].zh = '另一类型' },
    },
    {
      name: 'conflicting value translations',
      line: { ...furnishing(), specValueNameI18n: { en: 'Unfurnished', zh: '无家具' } },
      change: detail => { detail.specValueNameI18n[811].zh = '不同选项' },
    },
    {
      name: 'two types with the same name',
      line: furnishing(),
      change: detail => {
        detail.specBindings.push({ specTypeId: 352, specValueIds: [899] })
        detail.specTypeNameI18n[352] = { en: 'ApolloFurnishing' }
        detail.specValueNameI18n[899] = { en: 'Unfurnished' }
      },
    },
    {
      name: 'two values with the same name in one type',
      line: furnishing(),
      change: detail => {
        detail.specBindings[0].specValueIds.push(899)
        detail.specValueNameI18n[899] = { en: 'Unfurnished' }
      },
    },
    {
      name: 'existing value ID belongs to a different type',
      line: { ...furnishing(), specValueId: 812 },
      change() {},
    },
    {
      name: 'value name belongs to a different type',
      line: { ...furnishing(), specValueNameI18n: { en: '1 BHK' } },
      change() {},
    },
  ]
  for (const scenario of cases) {
    const detail = metadata()
    scenario.change(detail)
    const card = freeze({ id: 28, items: [item(162, [scenario.line])] })
    const before = plain(card)
    const result = await hydratePackageSpecIds(card, async () => detail)
    assert.deepEqual(plain(result), before, scenario.name)
    assert.equal(firstLine(result).specTypeId, undefined, scenario.name)
    assert.deepEqual(plain(card), before, scenario.name)
  }
})

test('failed metadata requests and another service response preserve the original package data', async () => {
  for (const load of [
    async () => { throw new Error('Metadata unavailable') },
    async () => metadata(163),
    async () => null,
  ]) {
    const card = freeze({ id: 28, items: [item()] })
    const before = plain(card)
    const result = await hydratePackageSpecIds(card, load)
    assert.deepEqual(plain(result), before)
    assert.deepEqual(plain(card), before)
    assert.equal(firstLine(result).specTypeId, undefined)
    assert.equal(firstLine(result).specValueId, undefined)
  }
})

test('already complete identities and fixed SKU rows need no metadata requests', async () => {
  const complete = item(162, [{ ...furnishing(), specTypeId: 350, specValueId: '811' }])
  const fixed = { ...item(163), bindType: 2, skuId: 5063, specI18n: [furnishing()] }
  const card = freeze({ id: 28, items: [complete, fixed] })
  let calls = 0
  const result = await hydratePackageSpecIds(card, async () => {
    calls += 1
    throw new Error('This callback must not be called')
  })

  assert.equal(calls, 0)
  assert.equal(result, card)
  assert.equal(firstLine(result).specTypeId, 350)
  assert.equal(firstLine(result, 1).specTypeId, undefined)
})

test('deduplicates metadata by SPU and never treats price or remarkI18n as language names', async () => {
  const contaminated = {
    ...furnishing(),
    specValueNameI18n: { price: '80.00', remarkI18n: { en: 'Unfurnished' } },
  }
  const card = freeze({ id: 28, items: [item(), { ...item(), packageItemId: 117 }, item(162, [contaminated])] })
  const detail = metadata()
  detail.specValueNameI18n[811] = {
    en: 'Unfurnished', price: '80.00', remarkI18n: { en: 'Unfurnished' },
  }
  const calls = []
  const result = await hydratePackageSpecIds(card, async (spuId) => {
    calls.push(spuId)
    return freeze(detail)
  })

  assert.deepEqual(calls, ['162'])
  assert.equal(firstLine(result).specTypeId, '350')
  assert.equal(firstLine(result).specValueId, '811')
  assert.equal(firstLine(result, 1).specValueId, '811')
  assert.deepEqual(plain(firstLine(result, 2)), contaminated)
  assert.equal(firstLine(result, 2).specValueId, undefined)
})
