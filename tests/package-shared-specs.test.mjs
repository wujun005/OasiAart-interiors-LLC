import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the real pure resolver without Vue or network mocks.
const source = readFileSync(new URL('../src/modules/client/utils/package-shared-specs.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(code, { exports });
const plain = (value) => JSON.parse(JSON.stringify(value));

const { findSharedSpecs, resolveSharedSpecs, getSharedSpecGroups } = exports;
const typeKey = (id) => `type:${id}`;
const valueKey = (_type, value) => `value:${value}`;
const part = (type, value) => ({
  typeKey: typeKey(type),
  typeLabel: ({ 1: 'Furnishing', 2: 'Home size', 3: 'Duration', 4: 'Staff', 9: 'Visit time' })[type] || `Type ${type}`,
  valueKey: valueKey(type, value),
  valueLabel: `Value ${value}`,
  typeId: String(type),
  valueId: String(value),
});
const item = (id, rows) => ({
  id: String(id),
  choices: rows.map((row, index) => ({
    id: String(Number(id) * 10 + index + 1),
    label: `SKU ${id}-${index + 1}`,
    parts: row.map(([type, value]) => part(type, value)),
  })),
});
const choiceOf = (items, current, itemId) => items.find((entry) => entry.id === itemId)
  ?.choices.find((choice) => choice.id === current[itemId]);
const chosenValue = (items, current, itemId, type) => choiceOf(items, current, itemId)
  ?.parts.find((entry) => entry.typeKey === typeKey(type))?.valueKey;
const optionsOf = (definitions, type) => definitions.find((definition) => definition.id === typeKey(type))?.options || [];
const twoSharedTypes = () => [
  item(20, [[[1, 11], [2, 21], [3, 31]], [[1, 12], [2, 22], [3, 31]]]),
  item(30, [[[1, 11], [2, 21], [4, 41]], [[1, 12], [2, 22], [4, 42]]]),
];

test('shared types and values use stable IDs across service labels while unique types stay local', () => {
  const items = twoSharedTypes();
  items[1].choices.forEach((choice) => choice.parts.forEach((entry) => {
    entry.typeLabel = `不同语言 ${entry.typeId}`;
    entry.valueLabel = `不同名称 ${entry.valueId}`;
  }));
  items[1].choices.reverse();
  const definitions = findSharedSpecs(items);
  assert.deepEqual(plain(definitions.map((definition) => definition.id).sort()), [typeKey(1), typeKey(2)]);
  assert.deepEqual(plain(definitions.map((definition) => definition.itemIds.slice().sort())), [['20', '30'], ['20', '30']]);
  assert.deepEqual(plain(optionsOf(definitions, 1).map((option) => option.id).sort()), [valueKey(1, 11), valueKey(1, 12)]);
  assert.deepEqual(plain(optionsOf(definitions, 2).map((option) => option.id).sort()), [valueKey(2, 21), valueKey(2, 22)]);
});

test('missing identity, equal labels with different IDs, and incomplete SKU dimensions never create shared controls', () => {
  const withoutIds = [item(20, [[[1, 11]]]), item(30, [[[1, 11]]])];
  withoutIds.forEach((entry) => entry.choices[0].parts.forEach((value) => {
    delete value.typeId;
    delete value.valueId;
  }));
  const differentTypes = [item(20, [[[1, 11]]]), item(30, [[[2, 21]]])];
  differentTypes[1].choices[0].parts[0].typeLabel = differentTypes[0].choices[0].parts[0].typeLabel;
  differentTypes[1].choices[0].parts[0].valueLabel = differentTypes[0].choices[0].parts[0].valueLabel;
  const differentValues = [item(20, [[[1, 11]]]), item(30, [[[1, 12]]])];
  differentValues[1].choices[0].parts[0].valueLabel = differentValues[0].choices[0].parts[0].valueLabel;
  const missingValueId = [item(20, [[[1, 11]], [[1, 12]]]), item(30, [[[1, 11]], [[1, 12]]])];
  delete missingValueId[0].choices[1].parts[0].valueId;
  const missingDimension = [item(20, [[[1, 11]], []]), item(30, [[[1, 11]], [[1, 12]]])];
  for (const [label, items] of [
    ['no stable IDs', withoutIds],
    ['same label, different type IDs', differentTypes],
    ['same label, different value IDs', differentValues],
    ['one SKU lacks a value ID', missingValueId],
    ['one SKU lacks the dimension', missingDimension],
  ]) assert.deepEqual(plain(findSharedSpecs(items)), [], label);
});

test('common per-dimension values cannot fake a joint SKU tuple and an independent component remains shareable', () => {
  const conflicting = [
    item(20, [[[1, 11], [2, 21]], [[1, 12], [2, 22]]]),
    item(30, [[[1, 11], [2, 22]], [[1, 12], [2, 21]]]),
  ];
  assert.deepEqual(plain(findSharedSpecs(conflicting)), []);
  const items = [...conflicting, item(40, [[[9, 91]], [[9, 92]]]), item(50, [[[9, 91]], [[9, 92]]])];
  const definitions = findSharedSpecs(items);
  assert.deepEqual(plain(definitions.map((definition) => definition.id)), [typeKey(9)]);
  assert.deepEqual(plain(definitions[0].itemIds.slice().sort()), ['40', '50']);
});

test('matching single-value sets initialize each real SKU and keep current SKU preferences when possible', () => {
  const items = [
    item(20, [[[1, 11], [3, 31]], [[1, 11], [3, 32]]]),
    item(30, [[[1, 11], [4, 41]], [[1, 11], [4, 42]]]),
  ];
  const definitions = findSharedSpecs(items);
  assert.deepEqual(plain(optionsOf(definitions, 1).map((option) => option.id)), [valueKey(1, 11)]);
  const initialized = resolveSharedSpecs(items, definitions, {}, {}, false);
  assert.ok(initialized);
  assert.ok(choiceOf(items, initialized, '20'));
  assert.ok(choiceOf(items, initialized, '30'));
  const groups = getSharedSpecGroups(items, definitions, initialized);
  assert.equal(groups[0].selectedId, valueKey(1, 11));
  assert.equal(groups[0].options[0].disabled, false);
  const preferred = { '20': '202', '30': '302' };
  assert.deepEqual(plain(resolveSharedSpecs(items, definitions, preferred, {}, false)), preferred);
});

test('inconsistent current values stay visibly mixed until initialization resolves a genuine shared tuple', () => {
  const items = twoSharedTypes();
  const definitions = findSharedSpecs(items);
  const current = { '20': '201', '30': '302' };
  const groups = getSharedSpecGroups(items, definitions, current);
  assert.ok(groups.every((group) => group.selectedId === ''));
  const initialized = resolveSharedSpecs(items, definitions, current, {}, false);
  assert.ok(initialized);
  for (const type of [1, 2]) {
    assert.equal(chosenValue(items, initialized, '20', type), chosenValue(items, initialized, '30', type));
  }
  assert.ok(initialized['20'] === current['20'] || initialized['30'] === current['30']);
  assert.deepEqual(current, { '20': '201', '30': '302' });
});

test('one shared patch resolves every service atomically while preserving local and other shared choices', () => {
  const combinations = (localType, localValues) => [21, 22].flatMap((size) => localValues.flatMap((local) => [11, 12]
    .map((furnishing) => [[1, furnishing], [2, size], [localType, local]])));
  const items = [item(20, combinations(3, [31, 32])), item(30, combinations(4, [41, 42]))];
  const originalItems = plain(items);
  const definitions = findSharedSpecs(items);
  const current = { '20': '203', '30': '303' };
  const resolved = resolveSharedSpecs(items, definitions, current, { [typeKey(1)]: valueKey(1, 12) });
  assert.deepEqual(plain(resolved), { '20': '204', '30': '304' });
  assert.equal(chosenValue(items, resolved, '20', 2), valueKey(2, 21));
  assert.equal(chosenValue(items, resolved, '20', 3), valueKey(3, 32));
  assert.equal(chosenValue(items, resolved, '30', 4), valueKey(4, 42));
  const both = resolveSharedSpecs(items, definitions, current, {
    [typeKey(1)]: valueKey(1, 12), [typeKey(2)]: valueKey(2, 22),
  });
  assert.deepEqual(plain(both), { '20': '208', '30': '308' });
  assert.deepEqual(current, { '20': '203', '30': '303' });
  assert.deepEqual(plain(items), originalItems);
});

test('shared options disable unsupported combinations instead of changing another selected dimension', () => {
  const rows = [[[1, 11], [2, 21]], [[1, 12], [2, 21]], [[1, 11], [2, 22]]];
  const items = [item(20, rows), item(30, rows)];
  const definitions = findSharedSpecs(items);
  const current = { '20': '203', '30': '303' };
  const groups = getSharedSpecGroups(items, definitions, current);
  const furnishing = groups.find((group) => group.id === typeKey(1));
  assert.equal(furnishing.selectedId, valueKey(1, 11));
  assert.equal(furnishing.options.find((option) => option.id === valueKey(1, 12)).disabled, true);
  assert.equal(resolveSharedSpecs(items, definitions, current, { [typeKey(1)]: valueKey(1, 12) }), null);
  assert.deepEqual(plain(resolveSharedSpecs(items, definitions, current, {
    [typeKey(1)]: valueKey(1, 12), [typeKey(2)]: valueKey(2, 21),
  })), { '20': '202', '30': '302' });
  assert.deepEqual(current, { '20': '203', '30': '303' });
});

test('disjoint value sets leave both services independently selected', () => {
  const items = [item(20, [[[1, 11]]]), item(30, [[[1, 12]]])];
  const current = { '20': '201', '30': '301' };
  const definitions = findSharedSpecs(items);
  assert.deepEqual(plain(definitions), []);
  assert.deepEqual(plain(resolveSharedSpecs(items, definitions, current)), current);
  assert.deepEqual(plain(getSharedSpecGroups(items, definitions, current)), []);
});

test('partially overlapping value sets remain independent without requiring separate settings', () => {
  const items = [item(20, [[[1, 11]], [[1, 12]]]), item(30, [[[1, 11]], [[1, 13]]])];
  const definitions = findSharedSpecs(items);
  assert.deepEqual(plain(definitions), []);
  const selected = { '20': '202', '30': '302' };
  assert.deepEqual(plain(resolveSharedSpecs(items, definitions, selected)), selected);
  assert.deepEqual(plain(getSharedSpecGroups(items, definitions, selected)), []);
  assert.equal(chosenValue(items, selected, '20', 1), valueKey(1, 12));
  assert.equal(chosenValue(items, selected, '30', 1), valueKey(1, 13));
});

test('unequal home-size sets stay local with 4 BHK available while identical furnishing sets still share', () => {
  const combinations = (homeSizes) => homeSizes.flatMap((size) => [11, 12].map((furnishing) => [[1, furnishing], [2, size]]));
  const items = [item(20, combinations([21, 22, 23])), item(30, combinations([21, 22, 23, 24]))];
  items.forEach((service) => service.choices.forEach((choice) => choice.parts.forEach((entry) => {
    if (entry.typeId === '2') entry.valueLabel = `${Number(entry.valueId) - 20} BHK`;
  })));
  const originalItems = plain(items);
  const definitions = findSharedSpecs(items);
  assert.deepEqual(plain(definitions.map((definition) => definition.id)), [typeKey(1)]);
  assert.deepEqual(plain(optionsOf(definitions, 1).map((option) => option.id)), [valueKey(1, 11), valueKey(1, 12)]);
  const localParts = items[1].choices.flatMap((choice) => choice.parts.filter((entry) => !definitions.some((definition) => definition.id === entry.typeKey)));
  assert.ok(localParts.some((entry) => entry.valueKey === valueKey(2, 24) && entry.valueLabel === '4 BHK'));

  const current = { '20': '201', '30': '307' };
  const groups = getSharedSpecGroups(items, definitions, current);
  assert.deepEqual(plain(groups.map((group) => group.id)), [typeKey(1)]);
  assert.ok(groups[0].options.every((option) => !option.disabled));
  const resolved = resolveSharedSpecs(items, definitions, current, { [typeKey(1)]: valueKey(1, 12) });
  assert.deepEqual(plain(resolved), { '20': '202', '30': '308' });
  assert.equal(chosenValue(items, resolved, '20', 2), valueKey(2, 21));
  assert.equal(chosenValue(items, resolved, '30', 2), valueKey(2, 24));
  assert.deepEqual(current, { '20': '201', '30': '307' });
  assert.deepEqual(plain(items), originalItems);
});
