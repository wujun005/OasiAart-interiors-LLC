import assert from 'node:assert/strict';
import test from 'node:test';
import { buttonAllowed, permissionKeysAfterToggle } from '../src/modules/admin/utils/admin-button-permission.ts';

test('button permission stays open until a catalog exists', () => {
  assert.equal(buttonAllowed({
    superAdmin: false,
    catalog: [],
    granted: [],
    code: 'btn:/admin/orders:export',
  }), true);
});

test('a catalogued button is visible only when granted', () => {
  const catalog = ['btn:/admin/orders:export'];
  assert.equal(buttonAllowed({
    superAdmin: false,
    catalog,
    granted: [],
    code: 'btn:/admin/orders:export',
  }), false);
  assert.equal(buttonAllowed({
    superAdmin: false,
    catalog,
    granted: catalog,
    code: 'btn:/admin/orders:export',
  }), true);
});

test('a super admin keeps every button', () => {
  assert.equal(buttonAllowed({
    superAdmin: true,
    catalog: ['btn:/admin/orders:export'],
    granted: [],
    code: 'btn:/admin/orders:export',
  }), true);
});

test('checking a page selects the buttons under it', () => {
  const tree = [{
    id: 1,
    path: '/admin',
    children: [{
      id: 2,
      path: '/admin/products',
      children: [
        { id: 3, path: 'btn:/admin/products:edit' },
        { id: 4, path: 'btn:/admin/products:quote-compare' },
      ],
    }],
  }];
  assert.deepEqual(
    permissionKeysAfterToggle(tree, [2], 2).sort(),
    ['2', '3', '4'],
  );
  assert.deepEqual(
    permissionKeysAfterToggle(tree, [1], 1).sort(),
    ['1', '2', '3', '4'],
  );
  assert.deepEqual(
    permissionKeysAfterToggle(tree, [1, 3, 4], 2).sort(),
    ['1'],
  );
  assert.deepEqual(
    permissionKeysAfterToggle(tree, [2, 3], 3).sort(),
    ['2', '3'],
  );
});

test('checking user management selects both account menus', () => {
  const tree = [{
    id: 1,
    path: '/admin/users',
    children: [
      { id: 2, path: '/admin/users/platform' },
      { id: 3, path: '/admin/users/suppliers' },
      { id: 4, path: 'btn:/admin/users:edit' },
    ],
  }];
  assert.deepEqual(permissionKeysAfterToggle(tree, [1], 1).sort(), ['1', '2', '3', '4']);
  assert.deepEqual(permissionKeysAfterToggle(tree, [2, 3, 4], 1).sort(), []);
  assert.deepEqual(permissionKeysAfterToggle(tree, [1, 2, 4], 3).sort(), ['1', '2', '4']);
});

test('a button that has not been catalogued stays available', () => {
  assert.equal(buttonAllowed({
    superAdmin: false,
    catalog: ['btn:/admin/orders:export'],
    granted: [],
    code: 'btn:/admin/users:create',
  }), true);
});
