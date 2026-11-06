/** 服务页传 false，只拿普通服务。套餐服务要另传 true，再按 packageService === 1 取。 */
export function serviceCatalogQuery(
  supplierId?: number | string,
  packageService = false,
) {
  const params: Record<string, string | number | boolean> = {
    packageService: packageService === true,
  }
  if (supplierId != null && String(supplierId).trim() !== '') params.supplierId = supplierId
  return params
}

export function packageServiceSpuIds(
  groups: Array<{ services?: Array<{ spuId?: unknown; packageService?: unknown }> }> | null | undefined,
) {
  const ids = new Set<number>()
  for (const group of groups || []) {
    for (const service of group?.services || []) {
      const spuId = Number(service?.spuId)
      if (Number(service?.packageService) === 1 && Number.isInteger(spuId) && spuId > 0) ids.add(spuId)
    }
  }
  return ids
}
