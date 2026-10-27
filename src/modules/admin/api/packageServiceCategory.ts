import {
  add as addCategory,
  del as deleteCategory,
  fuzzySearchCategory,
  getPage as getCategoryPage,
  update as updateCategory,
} from '@/modules/admin/api/category';
import http from '@/modules/admin/utils/request';

const PACKAGE_DOMAIN = '4';

const isMissingEndpoint = (payload: any) =>
  Number(payload?.status) === 404 && String(payload?.path || '').includes('packageServiceCategory');

async function preferPackageApi(path: string, payload: any, fallback: () => Promise<any>) {
  try {
    const result = await http.post(path, payload);
    if (isMissingEndpoint(result)) return fallback();
    return result;
  } catch (error: any) {
    if (Number(error?.response?.status ?? error?.status) === 404) return fallback();
    throw error;
  }
}

const serviceCategoryPayload = (payload: any) => ({
  ...payload,
  categoryDomain: PACKAGE_DOMAIN,
});

export function update(payload: any) {
  return preferPackageApi(
    '/api/packageServiceCategory/addOrUpdate',
    payload,
    () => updateCategory(serviceCategoryPayload(payload)),
  );
}

export function add(payload: any) {
  return preferPackageApi(
    '/api/packageServiceCategory/addOrUpdate',
    payload,
    () => addCategory(serviceCategoryPayload(payload)),
  );
}

export function getPage(payload: any) {
  return preferPackageApi(
    '/api/packageServiceCategory/page',
    payload,
    () => getCategoryPage(serviceCategoryPayload(payload)),
  );
}

export function del(payload: any) {
  return preferPackageApi(
    '/api/packageServiceCategory/delete',
    payload,
    () => deleteCategory(payload),
  );
}

export function fuzzySearch(payload: any) {
  return preferPackageApi(
    '/api/packageServiceCategory/fuzzySearch',
    payload,
    () => fuzzySearchCategory({
      ...payload,
      categoryDomain: PACKAGE_DOMAIN,
      level: '1',
    }),
  );
}
