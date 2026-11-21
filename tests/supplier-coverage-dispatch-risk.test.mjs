import assert from 'node:assert/strict';
import test from 'node:test';
import { loadDispatchRisk } from '../src/modules/admin/pages/supplier-coverage/dispatchRisk.ts';
import { dubaiDateKey } from '../src/modules/admin/utils/staffBoard.ts';

const date = '2026-11-15';
const supplier = (serviceStatus, supplierId = 26) => ({ supplierId, serviceStatus });
const order = (orderId, fields = {}) => ({
  orderId,
  orderNo: `HX-${orderId}`,
  orderStatus: 1,
  paymentStatus: 1,
  serviceDate: date,
  serviceTime: `${date} 9:30`,
  orderTime: '2026-11-13 16:30:57',
  productName: 'Deep cleaning',
  productNameI18n: { en: 'Deep cleaning', zh: '深度清洁' },
  packageView: { orderType: 1, packageOrder: false },
  assignedSuppliers: [],
  ...fields,
});
const page = (list, pageNum = 1, total = list.length) => ({
  success: true,
  data: { list, pageNum, pageSize: 50, total, totalPages: Math.ceil(total / 50) },
});

test('checks confirmed paid normal orders on the Dubai service date through the existing paginated API', async () => {
  const businessDate = dubaiDateKey(new Date('2026-11-14T21:30:00Z'));
  assert.equal(businessDate, date);
  const calls = [];
  const result = await loadDispatchRisk(async (query) => {
    calls.push(query);
    return query.pageNum === 1
      ? page([
        order(1, { serviceTime: `${date} 10:00` }),
        order(2, { assignedSuppliers: [supplier(0)] }),
        order(3, { assignedSuppliers: [supplier(4)] }),
        order(4, { assignedSuppliers: [supplier(2)] }),
      ], 1, 6)
      : page([
        order(5, { assignedSuppliers: [supplier(3), supplier(0, 30)], serviceTime: `${date} 09:00-11:00` }),
        order(6, { assignedSuppliers: [supplier(1)] }),
      ], 2, 6);
  }, businessDate);
  assert.deepEqual(calls, [1, 2].map((pageNum) => ({
    pageNum, pageSize: 50, serviceTimeStart: date, serviceTimeEnd: date,
    orderStatuses: [1], paymentStatuses: [1], packageOrder: false,
    sortField: 'serviceTime', sortOrder: 'ASC',
  })));
  assert.equal(result.complete, true);
  assert.equal(result.checked, 6);
  assert.deepEqual(result.counts, { unassigned: 1, awaiting: 2 });
  assert.deepEqual(result.orders.map(({ orderNo, status }) => [orderNo, status]), [
    ['HX-5', 'awaiting'], ['HX-2', 'awaiting'], ['HX-1', 'unassigned'],
  ]);
});

test('uncertain assignment data and mismatched order scope do not generate false risk counts', async () => {
  const result = await loadDispatchRisk(async () => page([
    order(1, { assignedSuppliers: undefined }),
    order(2, { assignedSuppliers: [], supplierId: 26 }),
    order(3, { assignedSuppliers: [supplier(null)] }),
    order(4, { paymentStatus: 0 }),
    order(5, { orderStatus: 3 }),
    order(6, { serviceDate: '2026-11-16' }),
    order(7, { packageView: { orderType: 2, packageOrder: true } }),
    order(8),
  ]), date);
  assert.equal(result.complete, false);
  assert.equal(result.checked, 1);
  assert.equal(result.total, 8);
  assert.deepEqual(result.counts, { unassigned: 1, awaiting: 0 });
  assert.deepEqual(result.orders.map(({ orderNo }) => orderNo), ['HX-8']);
});

test('a failed later page gives a partial result, whereas first-page failure remains an error', async () => {
  const error = new Error('Request failed');
  await assert.rejects(loadDispatchRisk(async () => { throw error; }, date), error);
  await assert.rejects(loadDispatchRisk(async () => ({ success: true, data: {} }), date), /Invalid order page response/);
  const result = await loadDispatchRisk(async ({ pageNum }) => {
    if (pageNum === 2) throw error;
    return page([order(1)], 1, 2);
  }, date);
  assert.equal(result.complete, false);
  assert.equal(result.checked, 1);
  assert.equal(result.total, 2);
  assert.deepEqual(result.counts, { unassigned: 1, awaiting: 0 });
});

test('pagination is bounded, duplicate rows are counted once, and an empty result is explicit', async () => {
  const calls = [];
  const result = await loadDispatchRisk(async ({ pageNum }) => {
    calls.push(pageNum);
    const list = Array.from({ length: 50 }, (_, index) => order((pageNum - 1) * 49 + index + 1));
    return page(list, pageNum, 500);
  }, date);
  assert.deepEqual(calls, [1, 2, 3, 4, 5]);
  assert.equal(result.complete, false);
  assert.equal(result.checked, 246);
  assert.equal(result.counts.unassigned, 246);
  const empty = await loadDispatchRisk(async () => page([]), date);
  assert.deepEqual(empty, { checked: 0, total: 0, complete: true, counts: { unassigned: 0, awaiting: 0 }, orders: [] });
});

test('an invalidated request stops paging and discards previously loaded rows', async () => {
  let current = true;
  const calls = [];
  const result = await loadDispatchRisk(async ({ pageNum }) => {
    calls.push(pageNum);
    current = false;
    return page([order(1)], 1, 2);
  }, date, () => current);
  assert.equal(result, null);
  assert.deepEqual(calls, [1]);
});
