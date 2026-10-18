import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/modules/admin/utils/supplierMap.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
runInNewContext(code, { exports, URL })

test('coordinates open Google driving navigation', () => {
  const url = exports.googleNavigateUrl({
    latitude: '25.2048',
    longitude: '55.2708',
    pinLocation: 'https://www.google.com/maps?q=25.2048,55.2708',
    serviceAddress: 'Dubai Marina',
  })
  assert.equal(url, 'https://www.google.com/maps/dir/?api=1&destination=25.2048%2C55.2708&travelmode=driving')
})

test('a server pin is used when coordinates are missing', () => {
  const pin = 'https://www.google.com/maps/search/?api=1&query=Dubai+Marina'
  assert.equal(exports.googleNavigateUrl({ pinLocation: pin, serviceAddress: 'Dubai Marina' }), pin)
})

test('an address opens navigation when the server sends no pin', () => {
  assert.equal(
    exports.googleNavigateUrl({ serviceAddress: 'Dubai Marina', building: 'Villa 12' }),
    'https://www.google.com/maps/dir/?api=1&destination=Dubai%20Marina%2C%20Villa%2012&travelmode=driving',
  )
})

test('blank location has no navigation link', () => {
  assert.equal(exports.googleNavigateUrl({ latitude: ' ', longitude: ' ' }), '')
  assert.equal(exports.googleNavigateUrl(null), '')
})

test('dangerous server pins fall back to encoded address navigation', () => {
  const fallback = 'https://www.google.com/maps/dir/?api=1&destination=Dubai%20Marina%2C%20Villa%2012&travelmode=driving'
  for (const pinLocation of ['javascript:alert(document.domain)', 'data:text/html,<script>alert(1)</script>']) {
    assert.equal(
      exports.googleNavigateUrl({ pinLocation, serviceAddress: 'Dubai Marina', building: 'Villa 12' }),
      fallback,
    )
  }
})

test('invalid, out-of-range, and unpaired coordinates fall back to encoded address navigation', () => {
  const fallback = 'https://www.google.com/maps/dir/?api=1&destination=Dubai%20Marina&travelmode=driving'
  const coordinates = [
    { latitude: 'north', longitude: '55.2708' },
    { latitude: '91', longitude: '55.2708' },
    { latitude: '25.2048', longitude: '181' },
    { latitude: '25.2048' },
    { longitude: '55.2708' },
  ]
  for (const coordinatePair of coordinates) {
    assert.equal(exports.googleNavigateUrl({ ...coordinatePair, serviceAddress: 'Dubai Marina' }), fallback)
  }
})
