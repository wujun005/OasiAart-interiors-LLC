import http from '@/modules/client/utils/request';

export interface Level1CategoryRecord {
  category?: {
    id?: number | string;
    categoryId?: string;
    categoryName?: string;
    status?: number | string;
  };
  nameI18n?: Record<string, string>;
  imageUrls?: string[];
  bannerTitleI18n?: Record<string, string>;
  bannerDescI18n?: Record<string, string>;
  bannerTagsI18n?: Record<string, string[] | string>;
}

export interface ExclusiveSpuRecord {
  id?: number | string;
  imageUrls?: string[];
  nameI18n?: Record<string, string>;
  descI18n?: Record<string, string>;
  minPrice?: number | string;
}

export interface OrderListRecord {
  orderAmount?: number | string;
  spuName?: string;
  spuNameI18n?: Record<string, string>;
  status?: number | string;
  orderNo?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  serviceAddress?: string;
  remark?: string;
  serviceDateTime?: string;
  paymentMethod?: string;
  statusName?: string;
  statusNameI18n?: Record<string, string>;
  skuCode?: string;
  spuId?: number | string;
  spuImage?: string;
  reviewed?: boolean;
  specSelections?: Array<{
    specTypeId?: number | string;
    specValueId?: number | string;
    specTypeName?: string;
    specValueName?: string;
  }>;
  attachSelections?: Array<{
    attachTypeId?: number | string;
    attachValueId?: number | string;
    attachValueName?: string;
    quantity?: number | string;
    attachTypeName?: string;
  }>;
}

export interface LatestAddressRecord {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  serviceAddress?: string;
  remark?: string;
  serviceTime?: string;
  timeRange?: number | string;
  serviceDateTime?: string;
  paymentMethod?: string;
}

type ApiSuccessEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errorCode?: string | null;
  timestamp?: string;
};

function getDataList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiSuccessEnvelope<unknown>;
    if (Array.isArray(envelope.data)) {
      return envelope.data as T[];
    }
  }
  return [];
}

// 客户端用户注册
export function register(payload: any) {
  return http.post('/api/client/auth/register', payload);
}
// 发送验证码
export function sendSmsCode(payload: any) {
  return http.post('/api/client/auth/send-sms-code', payload);
}

// 客户端用户登录
export function login(payload: any) {
  return http.post('/api/client/auth/login', payload);
}

// ========== 服务/商品相关接口 ==========

/**
 * 获取所有服务列表
 * @returns 服务列表
 */
export function getServicesList() {
  return http.get('/api/product/list');
}

/**
 * 分页获取服务
 * @param params 分页参数 { pageNum, pageSize, ... }
 * @returns 分页服务数据
 */
export function getServicesPage(params?: any) {
  return http.get('/api/product/page', { params });
}

/**
 * 获取服务详情
 * @param id 服务ID
 * @returns 服务详情
 */
export function getServiceDetail(id: string | number) {
  return http.get(`/api/product/${id}`);
}

// ========== PayPal 支付相关接口 ==========

/**
 * 创建订单并拉起支付
 * @param payload 订单信息 { productId, quantity, amount, currency, ... }
 * @returns 支付跳转 URL
 */
export function createPaypalOrder(payload: any) {
  return http.post('/api/paypal/create-order-payment', payload);
}

/**
 * 支付成功回调（由后端重定向调用）
 * @param params 回调参数 { token?, PayerID?, ... }
 * @returns 订单信息
 */
export function paypalSuccessCallback(params?: any) {
  return http.get('/api/paypal/success-order', { params });
}

/**
 * 支付取消回调（由后端重定向调用）
 * @param params 回调参数
 * @returns 取消信息
 */
export function paypalCancelCallback(params?: any) {
  return http.get('/api/paypal/cancel', { params });
}

// ========== 订单相关接口 ==========

/**
 * 分页获取订单列表
 * @param params 分页参数 { pageNum, pageSize, ... }
 * @returns 分页订单数据
 */
export function getOrderPage(params?: any) {
  return http.get('/api/order/page', { params });
}

/**
 * 获取订单详情
 * @param id 订单ID
 * @returns 订单详情
 */
export function getOrderDetail(id: string | number) {
  return http.get(`/api/order/${id}`);
}

// 一级类目表 /client/product/level1Categories
export async function level1Categories() {
  const payload = await http.get('/client/product/level1Categories');
  return getDataList<Level1CategoryRecord>(payload);
}

// /client/product/exclusiveSpus 特卖列表
export async function exclusiveSpus() {
  const payload = await http.get('/client/product/exclusiveSpus');
  return getDataList<ExclusiveSpuRecord>(payload);
}

// /client/product/onShelfSpus 上架商品列表
export async function onShelfSpus(params?: any) {
  const payload = await http.get('/client/product/onShelfSpus', { params: params });
  return getDataList<ExclusiveSpuRecord>(payload);
}

// /client/product/detail/{spuId} 获取商品详情
export async function getProductDetail(spuId: string | number) {
  const payload = await http.get(`/client/product/detail/${spuId}`);
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
}

// /client/product/sku 获取价格
export async function getProductSku(params: any) {
  const payload = await http.post('/client/product/sku', params);
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
}

// /client/product/availableSelectTime 获取可选时间
export async function getAvailableSelectTime(params: any) {
  const payload = await http.get('/client/product/availableSelectTime', {params});
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
}

// /client/order/list 获取订单列表
export async function getOrderList(params?: any) {
  const payload = await http.get('/client/order/list', { params: params });
  return getDataList<OrderListRecord>(payload);
}

// /client/order/place 创建订单
export async function createOrder(params: any) {
  const payload = await http.post('/client/order/place', params);
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
}

// /client/order/getLatestAddress 获取最新地址
export async function getLatestAddress(params?: any) {
  const payload = await http.get('/client/order/getLatestAddress', { params: params });
  if (payload && typeof payload === 'object') {
    if ('data' in payload) {
      const envelope = payload as { data?: unknown };
      if (envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)) {
        return envelope.data as LatestAddressRecord;
      }
      return null;
    }
    if (!Array.isArray(payload)) {
      return payload as LatestAddressRecord;
    }
  }
  return null;
}

// /client/order/saveContactAddress 保存联系地址
export async function saveContactAddress(params: any) {
  const payload = await http.post('/client/order/saveContactAddress', params);
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
}

// /client/order/review  保存评价
export async function review(params: any) {
  const payload = await http.post('/client/order/review', params);
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : null;
}

export default {
  register,
  getServicesList,
  getServicesPage,
  getServiceDetail,
  createPaypalOrder,
  paypalSuccessCallback,
  paypalCancelCallback,
  getOrderPage,
  getOrderDetail,
  level1Categories,
  exclusiveSpus,
  getOrderList,
};
