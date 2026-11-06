import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('the header bell polls only the pending count', () => {
  const bell = read('src/modules/admin/components/ReviewNoticeBell.vue')
  const api = read('src/modules/admin/api/supplierWorkbench.ts')
  assert.match(bell, /platformReviewNoticeCount/)
  assert.doesNotMatch(bell, /platformReviewNotice\(/)
  assert.match(api, /\/api\/platform\/reviewNotice\/count/)
})

test('the message page loads the full board when opened and does not poll it', () => {
  const page = read('src/modules/admin/pages/review-notice/index.vue')
  assert.match(page, /platformReviewNotice\(/)
  assert.doesNotMatch(page, /setInterval/)
  assert.doesNotMatch(page, /platformReviewNoticeCount/)
})
