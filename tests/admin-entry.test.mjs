import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN_NO_ACCESS_PATH, pickAdminEntryPath } from '../src/modules/admin/utils/adminEntry.ts';

test('an account with no menus lands on the shared page', () => {
  assert.equal(pickAdminEntryPath([]), ADMIN_NO_ACCESS_PATH);
  assert.equal(pickAdminEntryPath([], '/admin'), ADMIN_NO_ACCESS_PATH);
  assert.equal(pickAdminEntryPath([], '/admin/orders', '/admin'), ADMIN_NO_ACCESS_PATH);
});

test('a granted page is used, and a forbidden redirect falls back to the first menu', () => {
  const allowed = ['/admin/supplier-management/orders'];
  assert.equal(
    pickAdminEntryPath(allowed, '/admin/supplier-management/orders'),
    '/admin/supplier-management/orders',
  );
  assert.equal(
    pickAdminEntryPath(allowed, '/admin/orders', '/admin/supplier-management/orders'),
    '/admin/supplier-management/orders',
  );
});

test('the overview grant does not unlock every admin page', () => {
  assert.equal(
    pickAdminEntryPath(['/admin', '/admin/orders'], '/admin/users', '/admin'),
    '/admin',
  );
});
