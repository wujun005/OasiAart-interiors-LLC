import assert from 'node:assert/strict'
import test from 'node:test'
import { deriveStaffJob, serviceLabel, tallyStaffJobs } from '../src/modules/admin/utils/staffBoard.ts'

test('staff job status follows the board priority', () => {
  assert.equal(deriveStaffJob({ serverStatus: 'onJob', suspended: true }), 'onJob')
  assert.equal(deriveStaffJob({ suspended: true, onJob: true }), 'unavailable')
  assert.equal(deriveStaffJob({ onJob: true, acceptJobs: false }), 'onJob')
  assert.equal(deriveStaffJob({ acceptJobs: false }), 'unavailable')
  assert.equal(deriveStaffJob({ acceptJobs: true, loggedInToday: false }), 'offline')
  assert.equal(deriveStaffJob({ acceptJobs: true, loggedInToday: true }), 'available')
  assert.equal(deriveStaffJob({ acceptJobs: true }), '')
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
  assert.deepEqual(tally, { count: 2, onJob: true })
})

test('service chips follow the current language', () => {
  const service = { name: 'Cleaning', nameZh: '清洁', nameEn: 'Cleaning' }
  assert.equal(serviceLabel(service, 'zh'), '清洁')
  assert.equal(serviceLabel(service, 'en'), 'Cleaning')
})
