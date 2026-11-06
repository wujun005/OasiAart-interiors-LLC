import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const transpile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const names = {}
runInNewContext(transpile('../src/modules/admin/utils/i18n.ts'), { exports: names })
const helper = {}
runInNewContext(transpile('../src/modules/admin/utils/quoteCompareSpecs.ts'), {
  exports: helper,
  require: name => {
    assert.equal(name, './i18n')
    return names
  },
})
const specsOf = (payload, locale = 'en') => JSON.parse(JSON.stringify(helper.buildQuoteCompareSpecs(payload, locale)))

const catalogue = {
  specTypes: [
    { specKey: '285', nameI18n: { zh: '家具', en: 'Furnishing' } },
    { specTypeId: 286, nameI18n: { zh: '选择别墅面积', en: 'Choose Villa Size' } },
  ],
  skus: [
    { skuId: 3640, skuCode: '3640', '285': { en: 'Unfurnished' }, '286': { en: '2 BHK', zh: '2 BHK', remarkI18n: { en: 'Walls + Ceiling' } }, supplierQuotes: [{ quotePrice: 300 }] },
    { skuId: '3647', skuCode: '3647', '285': { en: 'Furnished', zh: '带家具' }, '286': { en: '5 BHK', zh: '5 BHK' } },
  ],
}

test('comparison describes real dynamic SKU dimensions in either language', () => {
  assert.deepEqual(specsOf(catalogue), {
    3640: { label: 'Unfurnished · 2 BHK', details: ['Furnishing: Unfurnished', 'Choose Villa Size: 2 BHK'] },
    3647: { label: 'Furnished · 5 BHK', details: ['Furnishing: Furnished', 'Choose Villa Size: 5 BHK'] },
  })
  assert.deepEqual(specsOf({ success: true, data: catalogue }, 'zh-CN')[3647], {
    label: '带家具 · 5 BHK', details: ['家具: 带家具', '选择别墅面积: 5 BHK'],
  })
  assert.equal(specsOf(catalogue, 'zh')[3640].label, 'Unfurnished · 2 BHK')
  assert.equal(catalogue.skus[0].supplierQuotes[0].quotePrice, 300)
})

test('missing metadata keeps a readable SKU fallback without creating price data', () => {
  const specs = specsOf({ skus: [{ skuId: 21, skuCode: 'SKU-21' }, { skuId: 22 }] })
  assert.deepEqual(specs, { 21: { label: 'SKU-21', details: [] }, 22: { label: '22', details: [] } })
  assert.deepEqual(Object.keys(specs[21]), ['label', 'details'])
})

test('empty, failed, and malformed catalogue records do not prevent comparison rendering', () => {
  for (const payload of [null, [], {}, { data: null }, { success: false, data: catalogue }, { skus: 'invalid' }]) {
    assert.deepEqual(specsOf(payload), {})
  }
  assert.deepEqual(specsOf({
    specTypes: [null, { specTypeId: 10, specTypeName: 'Size' }],
    skus: [null, {}, { skuId: 0 }, { skuId: -1 }, { skuId: 'invalid' }, { skuId: 1.5 }, { skuId: true }, { skuId: [3] },
      { skuId: 4, '10': 'Large' }],
  }), { 4: { label: 'Large', details: ['Size: Large'] } })
})
