import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { parse, compileScript } from '@vue/compiler-sfc';
import * as Vue from 'vue';

const code = ts.transpileModule(readFileSync(new URL('../src/modules/admin/api/accountDeletion.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const record = (status = 'processing') => ({ requestId: 'request-fixture', userId: 81, status,
  requestedAt: '2026-11-19T12:00:00Z', ...(status === 'completed' ? { completedAt: '2026-11-20T12:00:00Z' } : {}),
});
function harness(payload) {
  const exports = {}, calls = [];
  runInNewContext(code, { exports, require(name) {
    assert.equal(name, '@/modules/admin/utils/request');
    return { __esModule: true, default: {
      async get(path, config) { calls.push({ path, config }); return payload; },
      async post(path, data, config) { calls.push({ path, data, config }); return payload; },
    } };
  } });
  return { api: exports, calls };
}

test('admin actions use their captured actor token rather than a later login', async () => {
  const { api, calls } = harness({ success: true, data: record() });
  await api.startDeletionRequest('request-fixture', 'captured-admin');
  assert.equal(calls[0].config.headers.Authorization, 'Bearer captured-admin');
  assert.equal(calls[0].path, '/api/platform/account-deletions/request-fixture/start');
});

test('missing actor cannot dispatch any queue action', async () => {
  const { api, calls } = harness({ success: true, data: record() });
  await assert.rejects(api.startDeletionRequest('request-fixture', ''));
  assert.equal(calls.length, 0);
});

test('unknown statuses and mismatched identities cannot be treated as completion', async () => {
  for (const data of [{ ...record(), status: 'accepted' }, { ...record(), requestId: 'another-request' },
    { ...record(), userId: undefined }, { ...record(), requestedAt: 'invalid' }]) {
    const { api } = harness({ success: true, data });
    await assert.rejects(api.completeDeletionRequest('request-fixture', {}, 'captured-admin'));
  }
});

test('completion requires explicit completed state and completion timestamp', async () => {
  for (const data of [record('processing'), { ...record('completed'), completedAt: undefined }]) {
    const { api } = harness({ success: true, data });
    await assert.rejects(api.completeDeletionRequest('request-fixture', {}, 'captured-admin'));
  }
  const { api } = harness({ success: true, data: record('completed') });
  assert.equal((await api.completeDeletionRequest('request-fixture', {}, 'captured-admin')).status, 'completed');
});

test('malformed queue payload is rejected instead of hiding requests', async () => {
  for (const data of [{}, { list: {}, total: 1 }, { list: [record()], total: -1 }, { list: [{ status: 'completed' }], total: 1 }]) {
    const { api } = harness({ success: true, data });
    await assert.rejects(api.listDeletionRequests({ pageNum: 1, pageSize: 20 }, 'captured-admin'));
  }
  const { api, calls } = harness({ success: true, data: { list: [record()], total: 1 } });
  assert.equal((await api.listDeletionRequests({ pageNum: 1, pageSize: 20 }, 'captured-admin')).total, 1);
  assert.equal(calls[0].config.headers.Authorization, 'Bearer captured-admin');
});

const { descriptor } = parse(readFileSync(new URL('../src/modules/admin/pages/account-deletions/index.vue', import.meta.url), 'utf8'));
const componentCode = ts.transpileModule(compileScript(descriptor, { id: 'deletion-admin-offline' }).content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const renderer = Vue.createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null,
});
const flush = async () => { for (let n = 0; n < 16; n++) await Promise.resolve(); };
const deferred = () => { let resolve; const promise = new Promise((a) => { resolve = a; }); return { promise, resolve }; };

async function componentHarness(t, options = {}) {
  const actor = { token: 'admin-A' }, calls = [], listeners = new Map(), exports = {};
  runInNewContext(componentCode, { exports, Intl, window: {
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  }, require(name) {
    if (name === 'vue') return Vue;
    if (name === 'vue-i18n') return { useI18n: () => ({ locale: Vue.ref('en') }) };
    if (name === 'element-plus') return { ElMessageBox: { confirm: () => options.confirmation?.promise || Promise.resolve() } };
    if (name === '@/utils/auth-state') return { getAdminAuthStorageValue: () => actor.token };
    if (name === '@/modules/admin/api/accountDeletion') return {
      async listDeletionRequests(_query, token) { calls.push({ action: 'list', token }); return { list: [record()], total: 1 }; },
      async getDeletionRequest(_id, token) { calls.push({ action: 'detail', token }); return options.detail?.promise || record(); },
      async startDeletionRequest(_id, token) { calls.push({ action: 'start', token }); return record(); },
      async completeDeletionRequest(_id, _input, token) { calls.push({ action: 'complete', token }); return record('completed'); },
    };
    throw new Error(`Unexpected dependency ${name}`);
  } });
  const app = renderer.createApp({ ...exports.default, render: () => null });
  const instance = app.mount({}); t.after(() => app.unmount()); await flush();
  return { state: instance.$.setupState, actor, calls, listeners };
}

test('an already-open request cannot be changed by a later administrator login', async (t) => {
  const { state, actor, calls } = await componentHarness(t);
  await state.open(record()); assert.equal(state.dialog, true);
  actor.token = 'admin-B';
  await state.start();
  assert.equal(calls.filter(({ action }) => action === 'start').length, 0);
  assert.equal(state.selected, null); assert.equal(state.dialog, false); assert.equal(state.rows.length, 0);
});

test('closing a fulfilment dialog while confirmation is pending dispatches no mutation', async (t) => {
  const confirmation = deferred();
  const { state, calls } = await componentHarness(t, { confirmation });
  await state.open(record());
  Object.assign(state.completion, { ticketReference: 'PRIVACY-001', retentionSummary: 'None retained', businessObligationsResolved: true,
    personalDataErased: true, externalProcessorsHandled: true, retentionReviewed: true, customerNotified: true });
  assert.equal(state.canComplete, true);
  const pending = state.complete(); state.dialog = false;
  confirmation.resolve(); await pending;
  assert.equal(calls.filter(({ action }) => action === 'complete').length, 0);
});

test('a late detail response cannot restore a previous administrator view', async (t) => {
  const detail = deferred();
  const { state, actor, listeners } = await componentHarness(t, { detail });
  const pending = state.open(record());
  actor.token = 'admin-B'; listeners.get('storage')();
  detail.resolve(record()); await pending; await flush();
  assert.equal(state.selected, null); assert.equal(state.dialog, false);
});
