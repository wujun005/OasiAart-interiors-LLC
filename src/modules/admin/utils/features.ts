// 服务覆盖范围接口已在当前服务端提供。只有显式写成 false 时才停用。
export const supplierOperationsApiEnabled =
  import.meta.env.VITE_SUPPLIER_OPERATIONS_ENABLED !== 'false'
