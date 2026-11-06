import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isOfferedFlag,
  isOfferedSku,
  loadValidSkuKeys,
  reconcileSkuSelection,
  skuOptionShown,
  skuSelectionOffered,
} from '../src/modules/client/utils/sku-availability.ts'

const groups = [
  { typeId: 'rooms', options: [{ id: 'studio' }, { id: 'two' }] },
  { typeId: 'hours', options: [{ id: '1h' }, { id: '2h' }] },
]

test('only an explicit zero marks a sku as unavailable', () => {
  assert.equal(isOfferedFlag(undefined), true)
  assert.equal(isOfferedFlag(null), true)
  assert.equal(isOfferedFlag(1), true)
  assert.equal(isOfferedFlag('1'), true)
  assert.equal(isOfferedFlag(0), false)
  assert.equal(isOfferedFlag('0'), false)
  assert.equal(isOfferedSku(null), false)
  assert.equal(isOfferedSku({ valid: 0 }), false)
  assert.equal(isOfferedSku({}), true)
})

test('disabled combinations stay hidden and the other choice moves to a pair that exists', async () => {
  const offered = new Set(['studio,2h', 'two,2h', 'studio,1h'])
  const keys = await loadValidSkuKeys('9', groups, async ({ specValueIds }) => (
    offered.has(specValueIds.join(',')) ? { valid: 1 } : { valid: 0 }
  ))
  assert.equal(skuOptionShown(groups, 1, '1h', keys), true)
  assert.equal(skuOptionShown(groups, 0, 'studio', keys), true)
  assert.equal(skuOptionShown(groups, 1, '1h', keys, { rooms: 'two' }), false)
  assert.equal(skuOptionShown(groups, 1, '2h', keys, { rooms: 'two' }), true)
  assert.equal(skuOptionShown(groups, 0, 'two', keys, { hours: '1h' }), false)
  assert.equal(skuOptionShown(groups, 0, 'studio', keys, { hours: '1h' }), true)

  const none = new Set(['studio,2h'])
  assert.equal(skuOptionShown(groups, 1, '1h', none), false)
  assert.equal(skuSelectionOffered(groups, { rooms: 'two', hours: '1h' }, keys), false)

  const next = reconcileSkuSelection(
    groups,
    { rooms: 'two', hours: '1h' },
    keys,
    'rooms',
  )
  assert.deepEqual(next, { rooms: 'two', hours: '2h' })
  assert.equal(skuSelectionOffered(groups, next, keys), true)
})
