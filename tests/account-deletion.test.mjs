import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parse, compileScript } from '@vue/compiler-sfc';
import ts from 'typescript';
import * as Vue from 'vue';

// Exercise actual component/API code with offline HTTP and auth boundaries.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const compile = (source) => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} }).outputText;
const { descriptor } = parse(read('src/modules/client/components/AccountDeletionFlow.vue'));
const componentCode = compile(compileScript(descriptor, { id: 'account-deletion-test' }).content);
const apiCode = compile(read('src/modules/client/api/account-deletion.ts'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const flush = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
const status = (state = 'none') => ({ status: state, completionWithinBusinessDays: 7,
  ...(state === 'none' ? {} : { requestId: 'request-fixture', requestedAt: '2026-11-19T12:00:00Z' }),
});
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const renderer = Vue.createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
});

async function harness(t, options = {}) {
  const calls = { get: [], post: [], authorization: [], routes: [], storageWrites: [] };
  const auth = { current: { hasToken: options.signedIn !== false, isExpired: false,
    isLoggedIn: options.signedIn !== false, token: options.signedIn === false ? undefined : 'fixture-A',
    userInfo: { userId: 'fixture-user-A', email: 'customer@example.invalid' },
  } };
  const reads = [...(options.reads || [])];
  const writes = [...(options.writes || [])];
  const resolveValue = async (value, fallback) => typeof value === 'function' ? value() : (value === undefined ? fallback : value);
  const apiExports = {};
  runInNewContext(apiCode, { exports: apiExports, require(name) {
    assert.equal(name, '@/modules/client/utils/request');
    return { __esModule: true, default: {
      async get(path, config) { calls.authorization.push(config?.headers?.Authorization); calls.get.push(path); assert.equal(path, '/client/user/account-deletion'); return resolveValue(reads.shift(), { success: true, data: status() }); },
      async post(path, payload, config) { calls.authorization.push(config?.headers?.Authorization); calls.post.push({ path, payload: clone(payload) }); assert.equal(path, '/client/user/account-deletion'); return resolveValue(writes.shift(), { success: true, data: status('requested') }); },
    } };
  } });
  const listeners = new Map();
  const localStorage = { setItem: (...args) => calls.storageWrites.push(args) };
  const componentExports = {};
  runInNewContext(componentCode, { exports: componentExports, window: {
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
  }, localStorage, Intl, require(name) {
    if (name === 'vue') return Vue;
    if (name === 'vue-i18n') return { useI18n: () => ({ locale: Vue.ref('en'), t: (key) => key }) };
    if (name === 'vue-router') return { useRoute: () => ({ name: options.h5 ? 'h5-account-deletion' : 'legal-data-deletion' }), useRouter: () => ({ push: (value) => { calls.routes.push(clone(value)); } }) };
    if (name === '@/modules/client/api/account-deletion') return apiExports;
    if (name === '@/utils/auth-state') return { getStoredAuthSnapshot: () => clone(auth.current) };
    if (name === '@/modules/client/locales') return { setClientLocale: (value) => value === 'zh' ? 'zh' : 'en' };
    throw new Error(`Unexpected dependency ${name}`);
  } });
  const app = renderer.createApp({ ...componentExports.default, render: () => null });
  const instance = app.mount({});
  let mounted = true;
  const unmount = () => { if (mounted) { mounted = false; app.unmount(); } };
  t.after(unmount);
  await flush();
  return { state: instance.$.setupState, calls, auth, reads, writes, api: apiExports, listeners, unmount };
}
const fill = (state, password = '  unchanged password  ') => { state.password = password; state.confirmation = 'DELETE'; };
const swapAccount = (auth) => { auth.current = { ...auth.current, token: 'fixture-B', userInfo: { userId: 'fixture-user-B', email: 'other@example.invalid' } }; };

test('public page loads no private API and uses fixed same-site login return', async (t) => {
  for (const h5 of [false, true]) {
    const { state, calls } = await harness(t, { signedIn: false, h5 });
    assert.equal(calls.get.length, 0); assert.equal(calls.post.length, 0);
    state.signIn();
    assert.deepEqual(calls.routes, [{ name: h5 ? 'h5-login' : 'login', query: { redirect: '/data-deletion' } }]);
  }
});

test('shared H5 route resolves the mobile login return to the same deletion page', () => {
  const router = read('src/modules/h5/router/index.ts');
  assert.match(router, /path: '\/data-deletion',[\s\S]*?name: 'h5-account-deletion',[\s\S]*?pages\/data-deletion[.]vue/);
});

test('status parser accepts actual envelopes and null optional fields, rejects malformed successes', async (t) => {
  const { api } = await harness(t, { signedIn: false });
  for (const raw of [status(), { success: true, data: status('requested') }, { code: 200, data: { ...status(), requestId: null, requestedAt: null } }]) assert.ok(api.parseAccountDeletionStatus(raw));
  for (const raw of [null, true, {}, { status: 'none', reviewWithinBusinessDays: 7 }, { status: 'accepted', completionWithinBusinessDays: 7 }, { ...status(), completionWithinBusinessDays: 0 }, { success: false, data: status('requested') }, { code: 500, data: status('requested') }, { ...status('requested'), requestedAt: 'not-a-date' }, { ...status('requested'), requestId: null }, { ...status('processing'), requestedAt: null }, status('completed')]) assert.throws(() => api.parseAccountDeletionStatus(raw));
});

test('submit sends unchanged password and literal confirmation once, pending is not completed', async (t) => {
  const pending = deferred();
  const { state, calls, auth } = await harness(t, { writes: [() => pending.promise] });
  fill(state);
  const first = state.submitRequest(); const second = state.submitRequest();
  assert.equal(calls.post.length, 1);
  assert.deepEqual(calls.post[0], { path: '/client/user/account-deletion', payload: { password: '  unchanged password  ', confirmation: 'DELETE' } });
  pending.resolve({ success: true, data: status('requested') }); await Promise.all([first, second]);
  assert.equal(state.record.status, 'requested'); assert.equal(state.errorKey, '');
  assert.equal(state.password, ''); assert.equal(auth.current.token, 'fixture-A');
  await state.submitRequest(); assert.equal(calls.post.length, 1);
});

test('empty password and incorrect confirmation do not submit a request', async (t) => {
  const { state, calls } = await harness(t);
  state.confirmation = 'DELETE'; await state.submitRequest(); assert.equal(state.errorKey, 'passwordRequired');
  state.password = 'fixture'; state.confirmation = 'delete'; await state.submitRequest(); assert.equal(state.errorKey, 'confirmationRequired');
  assert.equal(calls.post.length, 0);
});

for (const [code, errorKey] of [['REAUTH_FAILED', 'reauthFailed'], ['CONFIRMATION_REQUIRED', 'confirmationRequired']]) {
  test(`${code} remains a safe validation failure and preserves the session`, async (t) => {
    const { state, calls, auth } = await harness(t, { writes: [() => { throw Object.assign(new Error('private server details'), { status: 400, code }); }] });
    fill(state); await state.submitRequest();
    assert.equal(state.errorKey, errorKey); assert.equal(auth.current.token, 'fixture-A');
    assert.equal(calls.get.length, 1); assert.equal(calls.post.length, 1);
    if (code === 'REAUTH_FAILED') assert.equal(state.password, '');
  });
}

for (const savedState of ['requested', 'processing']) {
  test(`POST timeout reconciles a durable ${savedState} record with GET and never resubmits`, async (t) => {
    const { state, calls } = await harness(t, { reads: [status(), { success: true, data: status(savedState) }], writes: [() => { throw new Error('timeout with private details'); }] });
    fill(state); await state.submitRequest();
    assert.equal(state.record.status, savedState); assert.equal(state.errorKey, '');
    assert.equal(calls.get.length, 2); assert.equal(calls.post.length, 1);
  });
}

test('unknown POST outcome with no record is explicitly unconfirmed, never success', async (t) => {
  const { state, calls } = await harness(t, { writes: [() => { throw new Error('timeout'); }] });
  fill(state); await state.submitRequest();
  assert.equal(state.record.status, 'none'); assert.equal(state.errorKey, 'unconfirmed');
  assert.equal(calls.post.length, 1); assert.equal(calls.get.length, 2); assert.equal(state.password, '');
});

test('failed reconciliation does not claim success or echo raw server errors', async (t) => {
  const { state, calls } = await harness(t, { reads: [status(), () => { throw new Error('sensitive response'); }], writes: [() => { throw new Error('sensitive request'); }] });
  fill(state); await state.submitRequest();
  assert.equal(state.errorKey, 'unconfirmed'); assert.equal(state.record.status, 'none'); assert.equal(calls.post.length, 1);
});

for (const reply of [() => { throw Object.assign(new Error('not deployed'), { status: 404 }); }, { success: true, data: { accepted: true } }]) {
  test('unavailable or malformed status cannot enable submission', async (t) => {
    const { state, calls } = await harness(t, { reads: [reply] });
    assert.equal(state.record, null); assert.equal(state.errorKey, 'unavailable');
    fill(state); await state.submitRequest(); assert.equal(calls.post.length, 0);
  });
}

test('old account GET response cannot display its request after an account switch', async (t) => {
  const pending = deferred();
  const { state, auth } = await harness(t, { reads: [() => pending.promise] });
  swapAccount(auth); pending.resolve(status('requested')); await flush();
  assert.equal(state.record, null); assert.equal(state.password, ''); assert.equal(state.loading, false);
  assert.equal(state.auth.userInfo.userId, 'fixture-user-B');
  await state.refreshStatus(); assert.equal(state.record.status, 'none');
});

test('old account POST response cannot replace or clear a newly signed-in session', async (t) => {
  const pending = deferred();
  const { state, auth, calls } = await harness(t, { writes: [() => pending.promise] });
  fill(state); const operation = state.submitRequest(); swapAccount(auth);
  pending.resolve(status('requested')); await operation;
  assert.equal(state.record, null); assert.equal(state.submitting, false);
  assert.equal(auth.current.token, 'fixture-B'); assert.equal(calls.post.length, 1);
  assert.deepEqual(calls.authorization, ['Bearer fixture-A', 'Bearer fixture-A']);
});

test('unmount during submission ignores late failures without reconciliation or further writes', async (t) => {
  const pending = deferred();
  const { state, calls, unmount } = await harness(t, { writes: [() => pending.promise] });
  fill(state); const operation = state.submitRequest(); unmount(); pending.reject(new Error('late timeout')); await operation;
  assert.equal(calls.get.length, 1); assert.equal(calls.post.length, 1); assert.equal(state.password, '');
});

test('a newer status query wins when older responses arrive last', async (t) => {
  const pending = deferred();
  const { state, reads } = await harness(t);
  reads.push(() => pending.promise, status('processing'));
  const first = state.refreshStatus(); await state.refreshStatus(); pending.resolve(status()); await first;
  assert.equal(state.record.status, 'processing');
});

test('completed is shown only from server status; pending session remains available for queries', async (t) => {
  const { state, auth, calls } = await harness(t, { reads: [{ ...status('completed'), completedAt: '2026-11-20T12:00:00Z' }] });
  assert.equal(state.record.status, 'completed'); assert.equal(calls.post.length, 0); assert.equal(auth.current.token, 'fixture-A');
});

test('401 directs the user back to authentication without misreporting deletion', async (t) => {
  const { state, calls } = await harness(t, { reads: [() => { throw Object.assign(new Error('unauthorized'), { status: 401 }); }] });
  assert.equal(state.errorKey, 'signInRequired'); assert.equal(state.record, null);
  state.signIn(); assert.equal(calls.routes[0].query.redirect, '/data-deletion'); assert.equal(calls.post.length, 0);
});

