import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/admin/api/supplierWorkbench.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText
const calls = []
const exports = {}
runInNewContext(code, {
  exports,
  require: (name) => {
    assert.equal(name, '@/modules/admin/utils/request')
    const http = {
      get: (url, config) => {
        calls.push({ url, params: config?.params, responseType: config?.responseType })
        return Promise.resolve()
      },
      post: () => Promise.resolve(),
    }
    return { __esModule: true, default: http }
  },
})

test('quote export sends checked service ids as one comma-separated parameter', async () => {
  await exports.exportQuoteSheet([501, '502', 501, 0, -3])
  await exports.exportQuoteSheet([])
  await exports.exportQuoteSheet()
  await exports.exportPlatformQuoteSheet(10, [88, 89])
  await exports.exportPlatformQuoteSheet(10)
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { url: '/api/supplier/tools/quotes/export', params: { spuIds: '501,502' }, responseType: 'blob' },
    { url: '/api/supplier/tools/quotes/export', params: {}, responseType: 'blob' },
    { url: '/api/supplier/tools/quotes/export', params: {}, responseType: 'blob' },
    {
      url: '/api/platform/supplierQuote/quotes/export',
      params: { supplierId: 10, spuIds: '88,89' },
      responseType: 'blob',
    },
    {
      url: '/api/platform/supplierQuote/quotes/export',
      params: { supplierId: 10 },
      responseType: 'blob',
    },
  ])
})
