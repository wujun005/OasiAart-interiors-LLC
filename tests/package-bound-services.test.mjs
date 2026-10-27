import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parse, compileScript } from '@vue/compiler-sfc';
import ts from 'typescript';
import * as Vue from 'vue';

const filename = 'src/modules/client/components/PackageShowcase.vue';
const source = readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8');
const { descriptor, errors } = parse(source, { filename });
assert.deepEqual(errors, []);
const code = ts.transpileModule(compileScript(descriptor, { id: 'bound-services' }).content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const renderer = Vue.createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
});
const plain = (value) => JSON.parse(JSON.stringify(value));

async function harness(t, { cardCount = 1 } = {}) {
  const locale = Vue.ref('en');
  let catalogCalls = 0;
  const exports = {};
  const bindings = [
    { spuId: 1, nameI18n: { en: '<b>Cleaning</b>', zh: '居家清洁' } },
    { spuId: 2, nameI18n: { en: 'AC maintenance', zh: '空调保养' } },
  ];
  runInNewContext(code, {
    exports, console,
    getComputedStyle: (grid) => ({ columnGap: grid.columnGap || '0px' }),
    require(name) {
      if (name === 'vue') return Vue;
      if (name === 'vue-i18n') return { useI18n: () => ({ locale, t: (_key, params) => `Service ${params?.index || ''}`.trim() }) };
      if (name === '@/modules/client/utils/biz-tag') return { bizTagLabels: () => [] };
      if (name === '@/modules/client/api') return {
        packageCatalog: async () => {
          catalogCalls += 1;
          return [{ categoryId: 1, nameI18n: { en: 'Home', zh: '家居' }, packages: Array.from(
            { length: cardCount },
            (_, index) => ({ id: 8 + index, displaySalePrice: 100, nameI18n: { en: 'Care plan' }, spus: bindings }),
          ) }];
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const app = renderer.createApp({ ...exports.default, render: () => null });
  const instance = app.mount({});
  t.after(() => app.unmount());
  await Vue.nextTick();
  await Vue.nextTick();
  return { state: instance.$.setupState, locale, catalogCalls: () => catalogCalls };
}

test('catalog cards show bound service names and locale changes reuse the loaded catalog', async (t) => {
  const { state, locale, catalogCalls } = await harness(t);
  assert.deepEqual(plain(state.groups[0].cards[0].services.map((service) => service.name)), ['Cleaning', 'AC maintenance']);
  locale.value = 'zh';
  await Vue.nextTick();
  assert.deepEqual(plain(state.groups[0].cards[0].services.map((service) => service.name)), ['居家清洁', '空调保养']);
  assert.equal(catalogCalls(), 1);
});

test('bound services deduplicate IDs, keep different services with the same name and support legacy items', async (t) => {
  const { state } = await harness(t);
  const services = state.boundServices({ items: [
    { spuId: 1, skuId: 11, spuNameI18n: { en: '<p>Cleaning</p>' } },
    { spuId: 1, skuId: 12, spuNameI18n: { en: 'Cleaning' } },
    { spuId: 2, spuNameI18n: { en: 'Cleaning' } },
    { spuNameI18n: { en: '<b>AC</b>' } },
    { spuNameI18n: { en: 'AC' } },
  ] });
  assert.deepEqual(plain(services), [
    { key: 'spu:1', name: 'Cleaning' }, { key: 'spu:2', name: 'Cleaning' }, { key: 'name:AC', name: 'AC' },
  ]);
});

test('missing service names use a readable fallback and malformed collections do not break cards', async (t) => {
  const { state } = await harness(t);
  for (const item of [{}, { spus: null }, { items: {} }, { spus: [null] }]) {
    assert.deepEqual(plain(state.boundServices(item)), []);
  }
  assert.deepEqual(plain(state.boundServices({ spus: [{ spuId: 4 }] })), [{ key: 'spu:4', name: 'Service 1' }]);
});

const fakeGrid = ({ clientWidth, scrollWidth, scrollLeft = 0, cardWidth = 280, columnGap = '20px' }) => {
  const calls = [];
  const grid = {
    clientWidth,
    scrollWidth,
    scrollLeft,
    columnGap,
    querySelector: () => ({ getBoundingClientRect: () => ({ width: cardWidth }) }),
    scrollBy(options) {
      calls.push(plain(options));
      grid.scrollLeft = Math.max(0, Math.min(grid.scrollWidth - grid.clientWidth, grid.scrollLeft + options.left));
    },
    scrollTo(options) { grid.scrollLeft = options.left; },
  };
  return { grid, calls };
};

test('package navigation tracks start, middle, end and absent overflow with a one-pixel tolerance', async (t) => {
  const { state } = await harness(t, { cardCount: 3 });
  const { grid } = fakeGrid({ clientWidth: 600, scrollWidth: 1000 });
  state.gridRef = grid;
  const expectNavigation = (overflow, previous, next) => {
    state.updateScrollState();
    assert.deepEqual([state.hasOverflow, state.canScrollPrevious, state.canScrollNext], [overflow, previous, next]);
  };
  expectNavigation(true, false, true);
  grid.scrollLeft = 0.5;
  expectNavigation(true, false, true);
  grid.scrollLeft = 150;
  expectNavigation(true, true, true);
  grid.scrollLeft = 399.5;
  expectNavigation(true, true, false);
  grid.scrollLeft = 400;
  expectNavigation(true, true, false);
  grid.scrollWidth = 600.5;
  grid.scrollLeft = 0;
  expectNavigation(false, false, false);
  grid.scrollWidth = 500;
  expectNavigation(false, false, false);
  state.gridRef = null;
  expectNavigation(false, false, false);
});

test('package navigation moves one card plus the measured gap in either direction, including two cards in a narrow viewport', async (t) => {
  for (const dimensions of [
    { cardCount: 2, clientWidth: 340, scrollWidth: 562.5, cardWidth: 272.5, columnGap: '17.5px', step: 290 },
    { cardCount: 3, clientWidth: 720, scrollWidth: 900, cardWidth: 232, columnGap: '16.5px', step: 248.5 },
  ]) {
    const { state } = await harness(t, { cardCount: dimensions.cardCount });
    const { grid, calls } = fakeGrid(dimensions);
    state.gridRef = grid;
    state.updateScrollState();
    assert.equal(state.activeGroup.cards.length, dimensions.cardCount);
    assert.equal(state.hasOverflow, true);
    assert.equal(state.canScrollNext, true);
    state.scrollPackages(1);
    state.updateScrollState();
    assert.equal(state.canScrollPrevious, true);
    state.scrollPackages(-1);
    assert.deepEqual(calls, [
      { left: dimensions.step, behavior: 'smooth' },
      { left: -dimensions.step, behavior: 'smooth' },
    ]);
    assert.equal(grid.scrollLeft, 0);
  }
});
