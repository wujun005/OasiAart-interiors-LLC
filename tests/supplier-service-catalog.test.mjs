import test from 'node:test'
import assert from 'node:assert/strict'
import { packageServiceSpuIds, serviceCatalogQuery } from '../src/modules/admin/utils/supplierServiceCatalog.ts'

test('service catalog asks for ordinary services and package services separately', () => {
  assert.deepEqual(serviceCatalogQuery(38, false), { supplierId: 38, packageService: false })
  assert.deepEqual(serviceCatalogQuery(38, true), { supplierId: 38, packageService: true })
  assert.deepEqual(serviceCatalogQuery(), { packageService: false })
})

test('only an explicit package service flag identifies a package sku', () => {
  const ids = packageServiceSpuIds([
    {
      services: [
        { spuId: 11, packageService: 0 },
        { spuId: 12, packageService: 1 },
        { spuId: '13' },
        { spuId: 0, packageService: 1 },
      ],
    },
  ])
  assert.deepEqual([...ids], [12])
})
