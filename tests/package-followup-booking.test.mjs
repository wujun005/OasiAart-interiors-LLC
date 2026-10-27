import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { compileScript, compileStyle, compileTemplate, parse } from '@vue/compiler-sfc';
import ts from 'typescript';
import * as Vue from 'vue';

// Run the real order-detail component and shared availability intersection against
// local boundaries. No orders, addresses, bookings, or payments are sent to a server.
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));
const transpile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const load = (source, require = () => { throw new Error('Unexpected dependency'); }) => {
  const exports = {};
  runInNewContext(transpile(source), { exports, require });
  return exports;
};
const filename = 'src/modules/client/components/ClientOrderDetailView.vue';
const { descriptor, errors } = parse(read(filename), { filename });
assert.deepEqual(errors, []);
const script = compileScript(descriptor, { id: 'package-followup-booking' });
const code = transpile(script.content);
const dates = load(read('src/modules/client/utils/order-date-time.ts'));
const localization = load(read('src/modules/client/utils/order-localization.ts'));
const availabilityCode = read('src/modules/client/utils/package-booking-times.ts');
const futureDate = '2099-01-01';
const slots = [
  { time: '09:00', timeRange: 7, available: true },
  { time: '10:00', timeRange: 8, available: true },
];
const packageOrder = () => ({
  orderId: 42, orderNo: 'PK-42', orderType: 2, orderStatus: 1,
  packageId: 12, packageNameI18n: { en: 'Home care', zh: '居家套餐' },
  email: 'customer@example.test', validUntil: '2099-12-31',
  packageItems: [
    { bindType: 1, skuId: null, spuId: 7, spuNameI18n: { en: 'Cleaning', zh: '清洁' }, redeemTimes: 3, occupiedTimes: 1, remainingTimes: 2,
      serviceAddress: 'Cleaning Street', building: 'Villa 1', roomNo: 'A' },
    { bindType: 2, skuId: 302, spuId: 8, spuNameI18n: { en: 'AC service', zh: '空调服务' }, redeemTimes: 2, occupiedTimes: 1, remainingTimes: 1,
      serviceAddress: 'AC Street', building: 'Tower 2', roomNo: 'B' },
    { bindType: 2, skuId: 303, spuId: 9, spuNameI18n: { en: 'Used service' }, redeemTimes: 1, occupiedTimes: 1, remainingTimes: 0 },
  ],
  packageSnapshot: { items: [
    { bindType: 1, skuId: null, spuId: 7, chosenSkuId: 201, specs: [
      { specTypeNameI18n: { en: 'Home size' }, specValueNameI18n: { en: '2 bedrooms' } },
    ] },
    { bindType: 2, skuId: 302, spuId: 8, specs: [
      { specTypeNameI18n: { en: 'Units' }, specValueNameI18n: { en: '2 units' } },
    ] },
  ] },
  fulfillmentList: [],
});
const flush = async () => {
  for (let count = 0; count < 25; count += 1) await Promise.resolve();
  await Vue.nextTick();
};
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const renderer = Vue.createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null, insertStaticContent: () => [{}, {}],
});

async function harness(t, overrides = {}) {
  const calls = { availability: [], bookings: [], savedAddresses: 0, messages: [], errors: [], detail: [] };
  const route = Vue.reactive({ params: { orderNo: 'PK-42' }, query: {} });
  const locale = Vue.ref('en');
  const controls = {
    order: overrides.order || packageOrder(),
    availability: overrides.availability || (async ({ spuId }) =>
      spuId === 8 ? [slots[0], { ...slots[1], available: false }] : slots),
    fulfill: overrides.fulfill || (async () => 'PK-42-SPU7-N2, PK-42-SKU302-N2'),
  };
  const api = {
    getClientOrderDetail: async (orderNo) => { calls.detail.push(orderNo); return plain(controls.order); },
    getClientProfile: async () => ({ email: 'customer@example.test' }),
    getAvailableSelectTime: async (params) => { calls.availability.push(plain(params)); return controls.availability(params); },
    getClientAddressList: async () => { calls.savedAddresses += 1; return []; },
    fulfillPackageOrder: async (params) => { calls.bookings.push(plain(params)); return controls.fulfill(params); },
  };
  const availability = load(availabilityCode, (name) => {
    assert.equal(name, '@/modules/client/api');
    return api;
  });
  const exports = {};
  runInNewContext(code, {
    exports,
    console: { error: (...args) => calls.errors.push(args), warn() {} },
    require(name) {
      if (name === 'vue') return Vue;
      if (name === 'vue-i18n') return { useI18n: () => ({ locale, t: (key) => key }) };
      if (name === 'vue-router') return {
        useRoute: () => route,
        useRouter: () => ({ push: async () => {}, replace: async () => {} }),
      };
      if (name === 'element-plus') return { ElMessage: Object.fromEntries(
        ['warning', 'success', 'error'].map((kind) => [kind, (message) => calls.messages.push({ kind, message })]),
      ) };
      if (name.startsWith('element-plus/es/locale/')) return {};
      if (name === '@/modules/client/api') return api;
      if (name === '@/modules/client/composables/useCart') return { useCart: () => ({ cartCount: Vue.ref(0), refreshCart: async () => {} }) };
      if (name === '@/modules/client/utils/package-booking-times') return availability;
      if (name === '@/modules/client/utils/order-date-time') return dates;
      if (name === '@/modules/client/utils/order-localization') return localization;
      if (name === '@/modules/client/utils/richText') return { normalizeRichTextHtml: (value) => value || '' };
      if (name.endsWith('.vue') || name.endsWith('.png')) return {};
      throw new Error(`Unexpected component dependency: ${name}`);
    },
  });
  const app = renderer.createApp({ ...exports.default, render: () => null });
  const instance = app.mount({});
  t.after(() => app.unmount());
  await flush();
  return { state: instance.$.setupState, route, locale, controls, calls };
}

async function chooseDate(state, date = futureDate) {
  await state.openBookVisit();
  state.bookForm.serviceDate = date;
  await flush();
}

test('the follow-up dialog compiles with a read-only service list and per-service locked addresses', () => {
  const template = compileTemplate({ source: descriptor.template.content, filename, id: 'package-followup-booking', compilerOptions: { bindingMetadata: script.bindings } });
  assert.deepEqual(template.errors, []);
  for (const style of descriptor.styles) {
    const result = compileStyle({ source: style.content, filename, id: 'package-followup-booking', scoped: style.scoped, preprocessLang: style.lang });
    assert.deepEqual(result.errors, []);
  }
  assert.match(descriptor.template.content, /v-for="item in packageBookableServices"/);
  assert.match(descriptor.template.content, /item\.lockedAddress/);
  assert.doesNotMatch(descriptor.template.content, /bookForm\.skuId|selectedBookService/);
});

test('SPU quotas with null sku IDs and fixed SKUs both book once; exhausted services are skipped', async (t) => {
  const { state, calls } = await harness(t);
  assert.equal(state.canBookPackageVisit, true);
  assert.deepEqual(plain(state.packageBookableServices.map((item) => item.name)), ['Cleaning', 'AC service']);
  assert.equal(state.packageBookableServices[0].spec, 'Home size: 2 bedrooms');
  await chooseDate(state);
  assert.deepEqual(calls.availability, [
    { spuId: 7, serviceTime: futureDate }, { spuId: 8, serviceTime: futureDate },
  ]);
  assert.deepEqual(plain(state.bookTimeOptions), [slots[0]]);
  state.bookForm.timeRange = 7;
  await state.submitBookVisit();
  assert.deepEqual(calls.bookings, [{ orderNo: 'PK-42', serviceDate: futureDate, timeRange: 7 }]);
  assert.equal(calls.savedAddresses, 0);
});

test('availability is deduplicated by SPU even when multiple remaining services share one SPU', async (t) => {
  const order = packageOrder();
  order.packageItems.push({ bindType: 2, skuId: 202, spuId: 7, remainingTimes: 1, spuNameI18n: { en: 'Another cleaning option' } });
  const { state, calls } = await harness(t, { order });
  await chooseDate(state);
  assert.equal(state.packageBookableServices.length, 3);
  assert.deepEqual(calls.availability.map((item) => item.spuId), [7, 8]);
});

test('fully locked services show separate addresses and never send a shared contact or address', async (t) => {
  const { state, calls } = await harness(t);
  await chooseDate(state);
  assert.deepEqual(plain(state.packageBookableServices.map((item) => item.lockedAddress)), [
    'Cleaning Street · Villa 1 · A', 'AC Street · Tower 2 · B',
  ]);
  assert.equal(state.needsBookAddress, false);
  Object.assign(state.bookForm, { firstName: 'Do not reuse', phone: '000', serviceAddress: 'Incorrect shared location' });
  state.bookForm.timeRange = 7;
  await state.submitBookVisit();
  for (const key of ['skuId', 'packageItemId', 'firstName', 'phone', 'serviceAddress', 'building', 'remark']) {
    assert.equal(key in calls.bookings[0], false, `${key} must not override per-service locks`);
  }
});

test('mixed locked and new services require a new shared address without copying another service contact', async (t) => {
  const order = packageOrder();
  delete order.packageItems[1].serviceAddress;
  delete order.packageItems[1].building;
  delete order.packageItems[1].roomNo;
  // A cancelled first visit no longer locks the service address.
  order.fulfillmentList.push({ skuId: 302, spuId: 8, scheduleStatus: 2, serviceAddress: 'Cancelled address', firstName: 'Old contact', phone: '000' });
  const { state, calls } = await harness(t, { order });
  await chooseDate(state);
  assert.equal(state.needsBookAddress, true);
  assert.equal(state.bookForm.firstName, '');
  assert.equal(state.bookForm.serviceAddress, '');
  assert.equal(state.packageBookableServices[1].lockedAddress, '');
  assert.equal(calls.savedAddresses, 1);
  state.bookForm.timeRange = 7;
  await state.submitBookVisit();
  assert.equal(calls.bookings.length, 0);
  Object.assign(state.bookForm, { firstName: 'New', lastName: 'Contact', phone: '+971500001111', serviceAddress: 'New address', building: 'New tower' });
  await state.submitBookVisit();
  assert.equal(calls.bookings[0].serviceAddress, 'New address');
  assert.equal(calls.bookings[0].firstName, 'New');
  assert.equal('skuId' in calls.bookings[0], false);
  assert.equal('packageItemId' in calls.bookings[0], false);
});

test('failed or malformed availability for any service fails closed and can be retried', async (t) => {
  for (const invalid of ['failure', 'malformed']) {
    await t.test(invalid, async (t) => {
      const { state, calls, controls } = await harness(t, { availability: async ({ spuId }) => {
        if (spuId === 8) {
          if (invalid === 'failure') throw new Error('Availability unavailable');
          return { data: slots };
        }
        return slots;
      } });
      await chooseDate(state);
      assert.equal(state.bookTimeLoading, false);
      assert.ok(state.bookTimeError);
      assert.deepEqual(plain(state.bookTimeOptions), []);
      state.bookForm.timeRange = 7;
      await state.submitBookVisit();
      assert.equal(calls.bookings.length, 0);
      controls.availability = async () => slots;
      await state.fetchBookAvailableTimes();
      assert.equal(state.bookTimeError, '');
      assert.equal(state.bookTimeOptions.length, 2);
    });
  }
});

test('a missing, unavailable or outdated slot cannot submit even when a time range is assigned', async (t) => {
  const { state, calls } = await harness(t);
  await chooseDate(state);
  state.bookForm.timeRange = 99;
  await state.submitBookVisit();
  state.bookTimeOptions = [{ ...slots[0], available: false }];
  state.bookForm.timeRange = 7;
  await state.submitBookVisit();
  state.bookTimeOptions = [slots[0]];
  state.lastBookTimeKey = 'outdated services or date';
  await state.submitBookVisit();
  assert.equal(calls.bookings.length, 0);
});

test('services with no common time slot cannot be booked', async (t) => {
  const { state, calls } = await harness(t, { availability: async ({ spuId }) =>
    spuId === 7 ? [slots[0]] : [slots[1]],
  });
  await chooseDate(state);
  assert.deepEqual(plain(state.bookTimeOptions), []);
  assert.equal(state.bookTimeReady, false);
  state.bookForm.timeRange = 7;
  await state.submitBookVisit();
  assert.equal(calls.bookings.length, 0);
});

test('a later date owns the availability state while an earlier response remains in flight', async (t) => {
  const old = deferred();
  const current = deferred();
  const { state, calls } = await harness(t, { availability: ({ serviceTime }) => serviceTime === futureDate ? old.promise : current.promise });
  await chooseDate(state);
  state.bookForm.serviceDate = '2099-01-02';
  state.bookForm.timeRange = 7;
  await state.submitBookVisit();
  assert.equal(calls.bookings.length, 0, 'pending availability blocks booking');
  old.resolve([slots[0]]);
  await flush();
  assert.deepEqual(plain(state.bookTimeOptions), []);
  assert.equal(state.bookTimeLoading, true);
  current.resolve([slots[1]]);
  await flush();
  assert.deepEqual(plain(state.bookTimeOptions), [slots[1]]);
  assert.equal(state.bookTimeLoading, false);
});

test('closing and reopening on the same date rejects the previous dialog response', async (t) => {
  const old = deferred();
  const current = deferred();
  let lookup = 0;
  const { state } = await harness(t, { availability: () => (++lookup <= 2 ? old.promise : current.promise) });
  await chooseDate(state);
  state.closeBookVisit();
  assert.equal(state.bookTimeLoading, false);
  await chooseDate(state);
  current.resolve([slots[1]]);
  await flush();
  old.resolve([slots[0]]);
  await flush();
  assert.deepEqual(plain(state.bookTimeOptions), [slots[1]]);
  assert.equal(state.bookForm.timeRange, null);
});

test('route changes close the package dialog and reject availability from the previous order', async (t) => {
  const gate = deferred();
  const { state, route, calls } = await harness(t, { availability: () => gate.promise });
  await chooseDate(state);
  route.params.orderNo = 'PK-other';
  assert.equal(state.bookVisitVisible, false);
  assert.equal(state.bookTimeLoading, false);
  gate.resolve(slots);
  await flush();
  assert.deepEqual(plain(state.bookTimeOptions), []);
  state.bookForm.timeRange = 7;
  await state.submitBookVisit();
  assert.equal(calls.bookings.length, 0);
});

test('a service becoming exhausted invalidates the previous full-service slot cache', async (t) => {
  const { state, calls } = await harness(t);
  await chooseDate(state);
  state.bookForm.timeRange = 7;
  state.order.packageItems[1].remainingTimes = 0;
  assert.equal(state.bookForm.timeRange, null);
  assert.equal(state.bookTimeLoading, true);
  await flush();
  assert.deepEqual(calls.availability.map((item) => item.spuId), [7, 8, 7]);
  assert.equal(state.packageBookableServices.length, 1);
});

test('normal service rescheduling keeps its existing single-service availability lookup', async (t) => {
  const order = { orderId: 42, orderNo: 'PK-42', orderType: 1, orderStatus: 1, spuId: 7, email: 'customer@example.test', serviceDateTime: `${futureDate} 09:00-10:00` };
  const { state, calls } = await harness(t, { order });
  state.openReschedule();
  await flush();
  assert.equal(state.isPackageOrder, false);
  assert.equal(state.rescheduleDialogVisible, true);
  assert.deepEqual(calls.availability, [{ spuId: 7, serviceTime: futureDate }]);
  assert.equal(state.rescheduleAvailableTimeRecords.length, 2);
  assert.equal(state.bookVisitVisible, false);
});
