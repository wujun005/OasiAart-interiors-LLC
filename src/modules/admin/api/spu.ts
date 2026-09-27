import http from '@/modules/admin/utils/request';
import { getPage as attachTypePage } from '@/modules/admin/api/addonType';
import { getPage as attachValuePage } from '@/modules/admin/api/addon';

// 规格类型分页查询/api/productSpu/page
export function page(payload: any) {
  return http.post('/api/productSpu/page', payload);
}

// 拖拽排序：ids 按当前页拖拽后的展示顺序传递
export function sortProducts(ids: Array<number | string>) {
  return http.post('/api/productSpu/sort', { ids });
}

// 新增或更新规格类型/api/productSpu/addOrUpdate
export function addOrUpdate(payload: any) {
  return http.post('/api/productSpu/addOrUpdate', payload);
}

// 删除规格类型/api/productSpu/delete/{id}
export function deleteProduct(id) {
  return http.delete(`/api/productSpu/delete/${id}`);
}

// 详情/api/productSpu/{id}
export function detial(id) {
  return http.get(`/api/productSpu/${id}`);
}

// 启动 /api/productSpu/enable/{id}
export function enable(id) {
    return http.post(`/api/productSpu/enable/${id}`);
}

// 停用 /api/productSpu/disable/{id}
export function disable(id) {
    return http.post(`/api/productSpu/disable/${id}`);
}

// /api/productSku/listBySpu 查询SKU列表
export function listBySpu(id: any) {
    return http.get(`/api/productSku/listBySpu?productId=${id}`);
}

const unwrapPage = (res: any) => {
  const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  return [];
};

/** 服务上可报价的附加项。优先用 listBySpu.attaches；当前接口还没带这个字段时，用商品绑定的附加项补齐。 */
export async function listSpuAttachCatalog(productId: number | string, listed?: unknown) {
  if (Array.isArray(listed) && listed.length) return listed;
  const detailRes = await detial(productId);
  const detail = detailRes && typeof detailRes === 'object' && 'data' in detailRes ? detailRes.data : detailRes;
  const bindings = Array.isArray(detail?.attachBindings) ? detail.attachBindings : [];
  const wanted = bindings.flatMap((binding: any) =>
    (Array.isArray(binding.attachValueIds) ? binding.attachValueIds : [])
      .map((valueId: unknown) => ({ attachTypeId: Number(binding.attachTypeId), attachValueId: Number(valueId) }))
      .filter((item: { attachTypeId: number; attachValueId: number }) => item.attachTypeId && item.attachValueId),
  );
  if (!wanted.length) return [];
  const [valueRows, typeRows] = await Promise.all([
    attachValuePage({ pageNum: 1, pageSize: 500 }).then(unwrapPage),
    attachTypePage({ pageNum: 1, pageSize: 200 }).then(unwrapPage),
  ]);
  const values = new Map(valueRows.map((row: any) => {
    const value = row.attachValue || row;
    return [Number(value.id), { ...value, nameI18n: row.nameI18n || value.nameI18n }];
  }));
  const types = new Map(typeRows.map((row: any) => {
    const type = row.attachType || row;
    return [Number(type.id), { ...type, nameI18n: row.nameI18n || type.nameI18n }];
  }));
  return wanted.flatMap((item) => {
    const value = values.get(item.attachValueId);
    if (!value || value.isDelete) return [];
    const type = types.get(item.attachTypeId);
    return [{
      attachTypeId: item.attachTypeId,
      attachTypeName: type?.typeName || '',
      attachTypeNameI18n: type?.nameI18n || null,
      attachValueId: item.attachValueId,
      attachValueName: value.attachValue || '',
      attachValueNameI18n: value.nameI18n || null,
      platformPrice: value.amount ?? null,
    }];
  });
}

// /api/productSku/batchUpdatePrices 批量更新价格
export function batchUpdatePrices(payload: any) {
    return http.post(`/api/productSku/batchUpdatePrices`, payload);
}

// 上架特卖/api/productSpu/enableExclusive/{id}
export function enableExclusive(id: any) {
  return http.post(`/api/productSpu/enableExclusive/${id}`);
}

// 下架特卖/api/productSpu/enableExclusive/{id}
export function disableExclusive(id: any) {
  return http.post(`/api/productSpu/disableExclusive/${id}`);
}
