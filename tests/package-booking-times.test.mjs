import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(readFileSync(new URL('../src/modules/client/utils/package-booking-times.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const plain = (value) => JSON.parse(JSON.stringify(value))
const harness = (load) => {
  const calls = []
  const exports = {}
  runInNewContext(code, { exports, require: (name) => {
    assert.equal(name, '@/modules/client/api')
    return { getAvailableSelectTime: async (params) => { calls.push(plain(params)); return load(params) } }
  } })
  return { load: exports.loadPackageBookingTimes, calls }
}

test('package availability requests each distinct SPU once and intersects normalized times as well as range IDs', async () => {
  const { load, calls } = harness(({ spuId }) => spuId === 12 ? [
    { time: '09:00 - 11:00', timeRange: 7, available: true },
    { time: '11:00-13:00', timeRange: 8, available: true },
    { time: '13:00-15:00', timeRange: 9, available: true },
  ] : [
    { time: '9:00 – 11:00', timeRange: '7', avaiable: 1 },
    { time: '12:00-14:00', timeRange: 8, available: true },
    { time: '13:00-15:00', timeRange: 10, available: true },
  ])
  assert.deepEqual(plain(await load(['7', '12', '7'], '2099-01-01')), [
    { time: '09:00 - 11:00', timeRange: 7, available: true },
  ])
  assert.deepEqual(calls, [{ spuId: 12, serviceTime: '2099-01-01' }, { spuId: 7, serviceTime: '2099-01-01' }])
})

test('one unavailable service or conflicting duplicate rows cannot produce an available package slot', async () => {
  const { load } = harness(({ spuId }) => [
    { time: '09:00', timeRange: 7, available: true },
    ...(spuId === 12 ? [{ time: '9:00', timeRange: 7, available: false }] : []),
    { time: '10:00', timeRange: 8, available: spuId === 12 ? 'false' : true },
    { time: '11:00', timeRange: 9, available: true, ...(spuId === 12 ? { avaiable: false } : {}) },
    { time: '12:00', timeRange: 10, available: '1' },
    { time: '', timeRange: 11, available: true },
    { time: '14:00', timeRange: 'bad', available: true },
    null,
  ])
  assert.deepEqual(plain(await load(['7', '12'], '2099-01-01')), [{ time: '12:00', timeRange: 10, available: true }])
})

test('a failed or malformed availability lookup rejects the whole package and an empty service yields no common slots', async () => {
  for (const response of ['reject', null, {}]) {
    const { load } = harness(({ spuId }) => {
      if (spuId !== 12) return [{ time: '09:00', timeRange: 7, available: true }]
      if (response === 'reject') throw new Error('Availability unavailable')
      return response
    })
    await assert.rejects(load(['7', '12'], '2099-01-01'))
  }
  const { load } = harness(({ spuId }) => spuId === 12 ? [] : [{ time: '09:00', timeRange: 7, available: true }])
  assert.deepEqual(plain(await load(['7', '12'], '2099-01-01')), [])
})

test('invalid package service IDs reject before sending availability requests', async () => {
  const { load, calls } = harness(() => [])
  for (const ids of [[], ['0'], ['-1'], ['7', '1.5'], ['7', 'NaN'], ['9007199254740992']]) {
    await assert.rejects(load(ids, '2099-01-01'))
  }
  assert.deepEqual(calls, [])
})
