import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import ts from 'typescript';
import * as Vue from 'vue';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const base = 'src/modules/client';
const endpoint = '/api/api/supplier/account-deletion';
const transpile = (source) => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const apiCode = transpile(read(`${base}/api/supplier-account-deletion.ts`));
const { descriptor } = parse(read(`${base}/components/SupplierAccountDeletionFlow.vue`));
const componentCode = transpile(compileScript(descriptor, { id: 'supplier-deletion-test', inlineTemplate: false }).content);
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const record = (scope = 'STAFF_ACCOUNT') => ({ requestId: 'reference-fixture', scope, status: 'REQUESTED', requestedAt: '2026-11-25T12:00:00Z' });
const response = (data, code = 200, errorCode) => new Response(JSON.stringify(code < 400
  ? { success: true, data } : { success: false, errorCode, message: 'do not disclose raw error' }), { status: code });
const renderer = Vue.createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null,
});

function setup(t, values = []) {
  const calls = [];
  const queued = [...values];
  const api = {};
  runInNewContext(apiCode, { exports: api, Headers, fetch(path, init) {
    calls.push({ path, ...init, body: init.body ? JSON.parse(init.body) : undefined });
    assert.ok(queued.length, 'request must be explicitly expected');
    const value = queued.shift();
    return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
  } });
  const component = {};
  const events = new EventTarget();
  runInNewContext(componentCode, { exports: component, AbortController, window: events, require(name) {
    if (name === 'vue') return Vue;
    if (name === '@/modules/client/api/supplier-account-deletion') return api;
    throw new Error(`Unexpected dependency ${name}`);
  } });
  const app = renderer.createApp({ ...component.default, render: () => null }, { chinese: false });
  const instance = app.mount({});
  t.after(() => app.unmount());
  const state = instance.$.setupState;
  const login = () => {
    state.account = '  supplier-fixture  ';
    state.loginPassword = ' demo pw ';
    return state.signIn();
  };
  const submit = () => {
    state.confirmPassword = ' demo pw ';
    state.confirmation = 'DELETE';
    return state.submitRequest();
  };
  return { state, calls, login, submit, api, events };
}

for (const scope of ['STAFF_ACCOUNT', 'SUPPLIER_ACCOUNT']) {
  test(`${scope}: open page is anonymous, Supplier sign-in then one confirmed and scoped request`, async (t) => {
    const { state, calls, login, submit } = setup(t, [response({ token: 'fixture' }), response(null), response(record(scope))]);
    assert.equal(calls.length, 0);
    await login();
    assert.deepEqual(calls.map((x) => [x.path, x.method, x.headers.get('Authorization')]), [
      ['/api/api/admin/auth/login', 'POST', null], [endpoint, 'GET', 'Bearer fixture'],
    ]);
    assert.deepEqual(calls[0].body, { account: 'supplier-fixture', password: ' demo pw ', rememberMe: false });
    assert.ok(calls.every((x) => x.cache === 'no-store' && x.credentials === 'omit' && x.redirect === 'error'));
    assert.equal(state.loginPassword, '');
    assert.equal(state.record, null);
    state.confirmPassword = 'test'; state.confirmation = 'delete';
    await state.submitRequest();
    assert.equal(calls.length, 2);
    const first = submit(); const second = state.submitRequest();
    assert.equal(state.confirmPassword, '');
    await Promise.all([first, second]);
    assert.deepEqual(calls[2].body, { password: ' demo pw ', confirmation: 'DELETE' });
    assert.equal(state.record.scope, scope);
    assert.equal(state.record.status, 'REQUESTED');
    assert.equal(calls.length, 3);
  });
}

test('unknown submit response reads the durable record, never sends a second mutation', async (t) => {
  const { state, calls, login, submit } = setup(t, [response({ token: 'fixture' }), response(null), new Error('timeout'), response(record())]);
  await login(); await submit();
  assert.equal(state.record.requestId, 'reference-fixture');
  assert.deepEqual(calls.map((x) => x.method), ['POST', 'GET', 'POST', 'GET']);
});

test('malformed status cannot enable submission; explicit rate limit is handled without retry', async (t) => {
  const { state, calls, login, submit } = setup(t, [response({ token: 'fixture' }), response({ status: 'unknown' }), response(null), response(null, 429, 'REAUTH_RATE_LIMITED')]);
  await login(); await submit();
  assert.equal(state.record, undefined);
  assert.equal(state.message, 'unavailable');
  assert.equal(calls.length, 2);
  await state.refresh(); await submit();
  assert.equal(state.message, 'rateLimited');
  assert.equal(calls.length, 4);
});

test('clears credentials and ignores a late result upon page unload', async (t) => {
  const pending = deferred();
  const { state, calls, login, events } = setup(t, [pending.promise]);
  const action = login();
  events.dispatchEvent(new Event('pagehide'));
  assert.equal(calls[0].signal.aborted, true);
  pending.resolve(response({ token: 'late-result' }));
  await action;
  assert.equal(state.signedIn, false);
  assert.equal(state.loginPassword, '');
  assert.equal(calls.length, 1);
});

test('deletion deep link is separate from Consumer and skips loading the Meta script', () => {
  const page = read(`${base}/pages/data-deletion.vue`);
  assert.match(page, /<SupplierAccountDeletionFlow v-if="supplier && !trackedDocument"/);
  assert.match(page, /<AccountDeletionFlow v-if="!supplier"/);
  assert.match(page, /if \(selected && trackedDocument.value\) window.location.reload/);
  for (const [path, pathname, hash] of [['index.html', '/data-deletion', '#supplier'], ['h5.html', '/h5/', '#/data-deletion#supplier']]) {
    const html = read(path);
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find((match) => match[1].includes('connect.facebook.net'))[1];
    let insertions = 0;
    const document = { createElement: () => ({}), getElementsByTagName: () => [ { parentNode: { insertBefore: () => ++insertions } } ] };
    const trackedLocation = { pathname: '/', hash: '' };
    for (const [location, expected] of [[{ pathname, hash }, 0], [trackedLocation, 1]]) {
      const window = { location };
      const context = { window, document };
      Object.defineProperty(context, 'fbq', { get: () => window.fbq });
      runInNewContext(script, context);
      assert.equal(insertions, expected);
    }
  }
});

test('Supplier queue verifies the operation and sends only the captured platform actor', async (t) => {
  const publicApi = setup(t).api;
  const code = transpile(read('src/modules/admin/api/supplierAccountDeletion.ts'));
  const queue = {};
  const calls = [];
  const waiting = { ...record('SUPPLIER_ACCOUNT'), supplierId: '101', adminUserId: '72', updatedAt: '2026-11-25T12:00:00Z' };
  const started = { ...waiting, status: 'IN_PROGRESS', startedAt: '2026-11-25T12:05:00Z', startedBy: '20' };
  const responses = [{ success: true, data: { list: [waiting], total: 1 } }, waiting, { success: true, data: started }, waiting,
    { ...started, requestId: 'different' }];
  runInNewContext(code, { exports: queue, require(name) {
    if (name === '@/modules/client/api/supplier-account-deletion') return publicApi;
    assert.equal(name, '@/modules/admin/utils/request');
    return { default: {
      get(path, config) { calls.push({ path, config }); return Promise.resolve(responses.shift()); },
      post(path, body, config) { calls.push({ path, body, config }); return Promise.resolve(responses.shift()); },
    } };
  } });
  await assert.rejects(queue.startSupplierDeletionQueueRecord(waiting.requestId, ''));
  assert.equal(calls.length, 0);
  const list = await queue.listSupplierDeletionQueue({ status: 'REQUESTED', pageNum: 1, pageSize: 20 }, 'fixture');
  assert.equal(list.total, 1);
  assert.equal(list.list[0].scope, 'SUPPLIER_ACCOUNT');
  assert.equal((await queue.getSupplierDeletionQueueRecord(waiting.requestId, 'fixture')).adminUserId, '72');
  assert.equal((await queue.startSupplierDeletionQueueRecord(waiting.requestId, 'fixture')).startedBy, '20');
  assert.match(calls.at(2).path, /^\/api\/platform\/supplier-account-deletions\/reference-fixture\/start$/);
  assert.equal(calls.at(2).body, undefined);
  assert.ok(calls.every((call) => call.config.headers.Authorization === 'Bearer fixture'));
  await assert.rejects(queue.startSupplierDeletionQueueRecord(waiting.requestId, 'fixture'));
  await assert.rejects(queue.getSupplierDeletionQueueRecord(waiting.requestId, 'fixture'));
});

test('existing admin deletion menu leads to the Supplier route behind the super-admin guard', () => {
  const router = read('src/modules/admin/router/index.ts');
  const page = read('src/modules/admin/pages/account-deletions/index.vue');
  assert.match(router, /path: 'account-deletions\/suppliers',\s*name: 'admin-supplier-account-deletions'/);
  assert.match(router, /to.name === 'admin-supplier-account-deletions'[\s\S]{0,105}!adminMenuState.superAdmin/);
  assert.match(page, /<RouterLink :to="\{ name: 'admin-supplier-account-deletions' \}"/);
});
