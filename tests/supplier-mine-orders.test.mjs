import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(readFileSync(new URL('../src/modules/admin/utils/supplier-mine.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(code, { exports })
const { supplierMineCounts, packageVisitProgress } = exports
const plain = (value) => JSON.parse(JSON.stringify(value))

test('supplier mine counts stay with the page and ignore the selected tab total', () => {
  assert.deepEqual(plain(supplierMineCounts({
    list: [{ orderId: 1 }],
    total: 1,
    newOrderCount: 4,
    upcomingOrderCount: '2',
    inProgressOrderCount: 0,
    completedOrderCount: 9,
  })), {
    newRequests: 4,
    upcoming: 2,
    inProgress: 0,
    completed: 9,
  })
  assert.deepEqual(plain(supplierMineCounts({ summary: { newRequests: 3, completed: 1 } })), {
    newRequests: 3,
    completed: 1,
  })
})

test('package rows show this visit and the sub-service total', () => {
  assert.deepEqual(plain(packageVisitProgress({
    packageOrder: true,
    orderType: 2,
    seqNo: 2,
    totalTimes: 5,
  })), { seq: 2, total: 5 })
  assert.deepEqual(plain(packageVisitProgress({ orderType: 2, seqNo: 1 })), { seq: 1, total: null })
  assert.equal(packageVisitProgress({ orderType: 1, seqNo: 1, totalTimes: 5 }), null)
  assert.equal(packageVisitProgress({ packageOrder: true }), null)
})
