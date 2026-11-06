import assert from 'node:assert/strict'
import test from 'node:test'
import { filterAdminMenu } from '../src/modules/admin/utils/menuSearch.ts'

const menu = [
  {
    id: 1,
    name: '基础数据',
    path: '/admin/basic',
    children: [
      { id: 2, name: '一级类目', path: '/admin/basic/categories', children: [] },
      { id: 3, name: '规格', path: '/admin/basic/specs', children: [] },
    ],
  },
  { id: 4, name: '订单管理', path: '/admin/orders', children: [] },
]

const labels = (item) => item.path === '/admin/orders'
  ? ['订单管理', 'Orders']
  : item.path === '/admin/basic/specs'
    ? ['规格', 'Specifications']
    : [item.name]

test('menu search keeps a matching group and only the matching children', () => {
  assert.equal(filterAdminMenu(menu, '   ', labels), menu)
  assert.deepEqual(filterAdminMenu(menu, '规格', labels).map((item) => item.id), [1])
  assert.deepEqual(filterAdminMenu(menu, '规格', labels)[0].children.map((item) => item.path), ['/admin/basic/specs'])
  assert.deepEqual(filterAdminMenu(menu, '基础', labels)[0].children.map((item) => item.id), [2, 3])
  assert.deepEqual(filterAdminMenu(menu, 'orders', labels).map((item) => item.path), ['/admin/orders'])
  assert.deepEqual(filterAdminMenu(menu, '不存在', labels), [])
})
