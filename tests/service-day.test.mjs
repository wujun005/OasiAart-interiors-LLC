import assert from 'node:assert/strict'
import test from 'node:test'
import { serviceDayHint, serviceDayRelation } from '../src/modules/admin/utils/serviceDay.ts'

const labels = { today: '今天', tomorrow: '明天' }
const now = new Date(2026, 10, 28, 11, 14)

test('today and tomorrow match the admin order list hint', () => {
  assert.equal(serviceDayRelation('Saturday, 28 Nov 2026', now), 'today')
  assert.equal(serviceDayRelation('2026-11-29 09:00-11:00', now), 'tomorrow')
  assert.equal(serviceDayRelation('Friday, 27 Nov 2026', now), 'other')
  assert.equal(serviceDayHint('Saturday, 28 Nov 2026', 'zh', labels, now), '今天 · 星期六')
  assert.equal(serviceDayHint('2026-11-29', 'en', { today: 'Today', tomorrow: 'Tomorrow' }, now), 'Tomorrow · Sunday')
  assert.equal(serviceDayHint('Friday, 27 Nov 2026', 'zh', labels, now), '')
  assert.equal(serviceDayHint('09:00-11:00', 'zh', labels, now), '')
})
