import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/admin/utils/availabilityScope.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(code, { exports })

const {
  ALL_AVAILABILITY_SCOPE,
  availabilityScopePayload,
  availabilityScopeSelection,
  updateAvailabilityScopeSelection,
} = exports
const plain = (value) => Array.from(value)

test('empty service or area scopes are shown as an explicit All selection', () => {
  assert.deepEqual(plain(availabilityScopeSelection([])), [ALL_AVAILABILITY_SCOPE])
  assert.deepEqual(plain(availabilityScopeSelection(undefined)), [ALL_AVAILABILITY_SCOPE])
  assert.deepEqual(plain(availabilityScopeSelection([3, '4', 3])), [3, 4])
})

test('All and concrete scope options remain mutually exclusive', () => {
  assert.deepEqual(
    plain(updateAvailabilityScopeSelection([2], [2, ALL_AVAILABILITY_SCOPE])),
    [ALL_AVAILABILITY_SCOPE],
  )
  assert.deepEqual(
    plain(updateAvailabilityScopeSelection([ALL_AVAILABILITY_SCOPE], [ALL_AVAILABILITY_SCOPE, 2, 5])),
    [2, 5],
  )
  assert.deepEqual(plain(updateAvailabilityScopeSelection([2], [])), [ALL_AVAILABILITY_SCOPE])
})

test('the explicit All selection keeps the existing empty-array API contract', () => {
  assert.deepEqual(plain(availabilityScopePayload([ALL_AVAILABILITY_SCOPE])), [])
  assert.deepEqual(plain(availabilityScopePayload([2, 5, 2])), [2, 5])
  assert.deepEqual(plain(availabilityScopePayload([ALL_AVAILABILITY_SCOPE, 2])), [])
})
