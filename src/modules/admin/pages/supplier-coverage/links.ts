import type { LocationQueryRaw, Router } from 'vue-router';

export function recordId(value: unknown) {
  const id = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(id) && id > 0 ? String(id) : '';
}

export function adminHref(router: Router, path: string, query?: LocationQueryRaw) {
  return router.resolve({ path, query }).href;
}

export function supplierPageHref(router: Router, supplierId: unknown) {
  const id = recordId(supplierId);
  return id ? adminHref(router, '/admin/basic/suppliers', { id }) : '';
}

export function servicePageHref(router: Router, spuId: unknown) {
  const editId = recordId(spuId);
  return editId ? adminHref(router, '/admin/products', { editId }) : '';
}

export function packagePageHref(router: Router, packageId: unknown) {
  const editId = recordId(packageId);
  return editId ? adminHref(router, '/admin/package/packages', { editId }) : '';
}

export function serviceQuoteHref(router: Router, supplierId: unknown, spuId: unknown) {
  const id = recordId(supplierId);
  const spu = recordId(spuId);
  return id && spu
    ? adminHref(router, '/admin/basic/quotes', { id, view: 'quote', spu, scope: 'services' })
    : '';
}

export function packageQuoteHref(router: Router, supplierId: unknown, packageId: unknown) {
  const id = recordId(supplierId);
  const packageRef = recordId(packageId);
  return id && packageRef
    ? adminHref(router, '/admin/basic/quotes', { id, scope: 'packages', package: packageRef })
    : '';
}

export function storefrontServiceHref(spuId: unknown) {
  const id = recordId(spuId);
  return id ? `/services/detail/${id}` : '';
}

export function storefrontPackageHref(packageId: unknown) {
  const id = recordId(packageId);
  return id ? `/packages/${id}` : '';
}
