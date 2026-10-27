import assert from 'node:assert/strict'
import test from 'node:test'
import { serviceLabel, staffPresence, tallyStaffJobs } from '../src/modules/admin/utils/staffBoard.ts'

test('staff presence only accepts the three service states', () => {
  assert.equal(staffPresence('serving'), 'serving')
  assert.equal(staffPresence('enRoute'), 'enRoute')
  assert.equal(staffPresence('idle'), 'idle')
  assert.equal(staffPresence('onJob'), '')
  assert.equal(staffPresence('available'), '')
})

test('staff presence follows depart, arrive, and complete', () => {
  const assigned = [{ adminUserId: 9 }]
  assert.deepEqual(
    tallyStaffJobs([{ serviceDate: '2026-10-20', serviceStatus: 4, assignedStaff: assigned }], 9, '2026-10-20'),
    { count: 1, presence: 'idle' },
  )
  assert.deepEqual(
    tallyStaffJobs([{ serviceDate: '2026-10-20', serviceStatus: 3, assignedStaff: assigned }], 9, '2026-10-20'),
    { count: 1, presence: 'enRoute' },
  )
  assert.deepEqual(
    tallyStaffJobs([{ serviceDate: '2026-10-20', serviceStatus: 1, assignedStaff: assigned }], 9, '2026-10-20'),
    { count: 1, presence: 'serving' },
  )
  assert.deepEqual(
    tallyStaffJobs([{ serviceDate: '2026-10-20', serviceStatus: 2, assignedStaff: assigned }], 9, '2026-10-20'),
    { count: 1, presence: 'idle' },
  )
  assert.deepEqual(
    tallyStaffJobs([
      { serviceDate: '2026-10-20', serviceStatus: 3, assignedStaff: assigned },
      { serviceDate: '2026-10-20', serviceStatus: 1, assignedStaff: assigned },
    ], 9, '2026-10-20'),
    { count: 2, presence: 'serving' },
  )
})

test('today jobs ignore cancelled visits and other days', () => {
  const tally = tallyStaffJobs([
    { serviceDate: '2026-10-20', serviceStatus: 1, assignedStaff: [{ adminUserId: 9 }] },
    { serviceDate: '2026-10-20 09:00', serviceStatus: 4, assignedStaff: [{ adminUserId: 9 }] },
    { serviceDate: '2026-10-20', serviceStatus: 3, orderStatus: 3, assignedStaff: [{ adminUserId: 9 }] },
    { serviceDate: '2026-10-19', serviceStatus: 1, assignedStaff: [{ adminUserId: 9 }] },
    { serviceDate: '2026-10-20', serviceStatus: 1, scheduleStatus: 2, assignedStaff: [{ adminUserId: 9 }] },
    { serviceDate: '2026-10-20', serviceStatus: 1, assignedStaff: [{ adminUserId: 4 }] },
  ], 9, '2026-10-20')
  assert.deepEqual(tally, { count: 2, presence: 'serving' })
})

test('service chips follow the current language', () => {
  const service = { name: 'Cleaning', nameZh: '清洁', nameEn: 'Cleaning' }
  assert.equal(serviceLabel(service, 'zh'), '清洁')
  assert.equal(serviceLabel(service, 'en'), 'Cleaning')
})
