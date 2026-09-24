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
  minNotIncTaxPrice?: number | string | null;
}

export interface OrderListRecord {
  orderId?: number | string;
  orderAmount?: number | string;
  refundHandlingFee?: number | string | null;
  refundedAmount?: number | string | null;
  spuName?: string;
  spuNameI18n?: Record<string, string>;
  descI18n?: Record<string, string>;
  status?: number | string;
  orderStatus?: number | string;
  paymentStatus?: number | string;
  orderNo?: string;
  createTime?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  contactEmail?: string;
  customerEmail?: string;
  userEmail?: string;
  serviceAddress?: string;
  building?: string;
  roomNo?: string;
  community?: string;
  remark?: string;
  cancelReason?: string;
  cancellationReason?: string;
  serviceDateTime?: string;
  serviceTimeDisplay?: string;
  paymentMethod?: string;
  paymentMethodDetail?: string;
  cardBrand?: string;
  cardLast4?: string;
  receiptUrl?: string;
  statusName?: string;
  statusNameI18n?: Record<string, string>;
  skuCode?: string;
  spuId?: number | string;
  spuImage?: string;
  reviewed?: boolean;
  teamAssigned?: boolean;
  supplierAssigned?: boolean;
  supplierId?: number | string;
  supplierName?: string;
  supplierNameI18n?: Record<string, string>;
  supplier?: {
    id?: number | string;
    name?: string;
    supplierName?: string;
  };
  specSelections?: Array<{
    specTypeId?: number | string;
    specValueId?: number | string;
    specTypeName?: string;
    specTypeNameI18n?: Record<string, string>;
    specValueName?: string;
    specValueNameI18n?: Record<string, string>;
  }>;
  attachSelections?: Array<{
    attachTypeId?: number | string;
    attachValueId?: number | string;
    attachValueName?: string;
    attachValueNameI18n?: Record<string, string>;
    quantity?: number | string;
    attachTypeName?: string;
    attachTypeNameI18n?: Record<string, string>;
  }>;
}

export interface LatestAddressRecord {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  district?: string;
  serviceAddress?: string;
  building?: string;
  roomNo?: string;
  community?: string;
  remark?: string;
  serviceTime?: string;
  timeRange?: number | string;
  serviceDateTime?: string;
  paymentMethod?: string;
}

export interface ClientProfileRecord {
  userId?: number | string;
  name?: string;
  phone?: string;
  email?: string;
}

export type UpdateClientProfilePayload = {
  name?: string;
  phone?: string;
  email?: string;
};

export type CartSkuDetail = {
  spuId: number | string;
  specValueIds: Array<number | string>;
  attachItems?: Array<{
    attachValueId: number | string;
    quantity: number;
  }>;
};

export type AddCartItemPayload = {
  skuDetail: CartSkuDetail;
  addressId?: number | string;
  firstName: string;
  lastName: string;
  phoneCountryCode?: string;
  phone: string;
  email?: string;
  district?: string;
  serviceAddress: string;
  building?: string;
  roomNo?: string;
  community?: string;
  latitude?: number;
  longitude?: number;
  remark?: string;
  category?: AddressCategory;
  serviceTime: string;
  timeRange: number;
  paymentMethod?: string;
};

export interface ClientCartItemRecord {
  cartItemId: string;
  orderId?: number | string;
  orderNo?: string;
  spuId?: number | string;
  productName?: string;
  productNameI18n?: Record<string, string>;
  skuCode?: string;
  amountWithTax?: number | string;
  specValueIds?: Array<number | string>;
  attachItems?: Array<{ attachValueId?: number | string; quantity?: number }>;
  addressId?: number | string;
  firstName?: string;
  lastName?: string;
  phoneCountryCode?: string;
  phone?: string;
  email?: string;
  district?: string;
  serviceAddress?: string;
  building?: string;
  roomNo?: string;
  community?: string;
  latitude?: number | string;
  longitude?: number | string;
  remark?: string;
  category?: AddressCategory;
  serviceTime?: string;
  serviceTimeDisplay?: string;
  timeRange?: number | string;
  paymentMethod?: string;
  addedAt?: string;
  expiresAt?: string;
  specDesc?: string;
  serviceDateTime?: string;
  spuImage?: string;
  specSelections?: Array<{
    specTypeId?: number | string;
    specValueId?: number | string;
    specTypeName?: string;
    specTypeNameI18n?: Record<string, string>;
    specValueName?: string;
    specValueNameI18n?: Record<string, string>;
  }>;
  attachSelections?: Array<{
    attachTypeId?: number | string;
    attachValueId?: number | string;
    attachValueName?: string;
    attachValueNameI18n?: Record<string, string>;
    quantity?: number;
    attachTypeName?: string;
    attachTypeNameI18n?: Record<string, string>;
  }>;
}

export interface CartCheckoutResult {
  batchId?: string;
  orderIds?: Array<number | string>;
  orderNos?: string[];
  totalAmount?: number | string;
  payment?: CreatePayResponse;
}

export interface OrderRefundCheckResult {
  canRefund?: boolean;
  cannotRefundReason?: Record<string, string>;
  canReschedule?: boolean;
  cannotRescheduleReason?: Record<string, string>;
  canCancelWithoutRefund?: boolean;
  orderAmount?: number | string;
  handlingFee?: number | string;
  refundAmount?: number | string;
}

export interface OrderRefundAmountRecord {
  orderNo?: string;
  orderAmount?: number | string;
  handlingFee?: number | string;
  refundAmount?: number | string;
}

export type RefundReasonCode =
  | 'PLANS_CHANGED'
  | 'CHANGE_DATE_OR_TIME'
  | 'SERVICE_PROVIDER_CONCERN'
  | 'PRICE_CONCERN'
  | 'SERVICE_TIME_NO_LONGER_WORKS'
  | 'OTHER';

export interface RefundReasonRecord {
  code: RefundReasonCode | string;
  nameI18n: Record<string, string>;
  remarkRequired: boolean;
}

export type OrderReschedulePayload = {
  orderNo: string;
  serviceTime?: string;
  timeRange?: number;
  serviceAddress?: string;
  building?: string;
  roomNo?: string;
  community?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  remark?: string;
};

export interface OrderRescheduleResult extends OrderReschedulePayload {
  timeRangeLabel?: string;
}

export type AddressCategory = 'home' | 'office' | 'others';

export interface ClientAddressRecord {
  id: number;
  fullName?: string;
  phoneCountryCode?: string;
  phone: string;
  email?: string;
  district?: string;
  address: string;
  building?: string;
  roomNo?: string;
  community?: string;
  latitude?: number;
  longitude?: number;
  additionalNotes?: string;
  category: AddressCategory;
  isDefault?: boolean;
  createTime?: string;
  modifyTime?: string;
}

export type AddClientAddressPayload = {
  fullName: string;
  phoneCountryCode?: string;
  phone: string;
  email?: string;
  district?: string;
  address: string;
  building?: string;
  roomNo?: string;
  community?: string;
  latitude?: number;
  longitude?: number;
  additionalNotes?: string;
  category?: AddressCategory;
};

export type UpdateClientAddressPayload = AddClientAddressPayload & {
  id: number;
};

// 旧版服务端仍强制 firstName / lastName 非空。兼容字段只在请求层生成，
// 页面和地址业务模型继续只使用 fullName，待服务端修复后可整体移除此段。
const LEGACY_NAME_PLACEHOLDER = '-';

const normalizeNameText = (value: unknown) => String(value ?? '').trim();

const buildLegacyRequiredNameFields = (fullName: unknown) => {
  const normalized = normalizeNameText(fullName).replace(/\s+/g, ' ');
  const separatorIndex = normalized.lastIndexOf(' ');
  if (separatorIndex > 0 && separatorIndex < normalized.length - 1) {
    return {
      firstName: normalized.slice(0, separatorIndex),
      lastName: normalized.slice(separatorIndex + 1),
    };
  }
  return {
    firstName: normalized || LEGACY_NAME_PLACEHOLDER,
    lastName: LEGACY_NAME_PLACEHOLDER,
  };
};

const ensureLegacyRequiredNameFields = (
  firstName: unknown,
  lastName: unknown,
  fullName?: unknown,
) => {
  const first = normalizeNameText(firstName);
  const last = normalizeNameText(lastName);
  if (first && last) {
    return { firstName: first, lastName: last };
  }
  return buildLegacyRequiredNameFields(
    normalizeNameText(fullName) || [first, last].filter(Boolean).join(' '),
  );
};

type LegacyClientAddressRecord = ClientAddressRecord & {
  firstName?: string;
  lastName?: string;
};

const normalizeClientAddressRecord = (
  item: LegacyClientAddressRecord,
): ClientAddressRecord => {
  const firstName = normalizeNameText(item.firstName);
  const lastName = normalizeNameText(item.lastName);
  const responseFullName = normalizeNameText(item.fullName);
  const hasLegacyPlaceholder = lastName === LEGACY_NAME_PLACEHOLDER
    || responseFullName.endsWith(` ${LEGACY_NAME_PLACEHOLDER}`);
  const fullName = hasLegacyPlaceholder
    ? firstName || responseFullName.slice(0, -2).trim()
    : responseFullName || [firstName, lastName].filter(Boolean).join(' ');
  const normalized = { ...item };
  delete normalized.firstName;
  delete normalized.lastName;
  normalized.fullName = fullName;
  return normalized;
};

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

function getEnvelopeData<T>(payload: unknown): T | null {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as ApiSuccessEnvelope<T>).data ?? null) as T | null;
  }
  return (payload ?? null) as T | null;
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

// 支付创建
export type ClientPaymentMethod = 'stripe' | 'STRIPE' | 'APPLE_PAY' | 'PAYPAL' | string;

export type CreatePayRequest = {
  orderId: number | string;
  paymentMethod: ClientPaymentMethod;
  validationUrl?: string;
};

export type CreatePayResponse = {
  paymentMethod?: string;
  paymentId?: string;
  approvalUrl?: string;
  merchantSession?: string;
  orderId?: number | string;
  orderNo?: string;
  currency?: string;
  amount?: string | number;
  clientSecret?: string;
  customerSessionClientSecret?: string;
  paymentIntentId?: string;
};

export function createPay(payload: CreatePayRequest) {
  return http.post('/client/payment/create', payload);
}

export interface StripeSetupIntentRecord {
  setupIntentId?: string;
  clientSecret?: string;
}

export interface SavedPaymentMethodRecord {
  paymentMethodId: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
  allowRedisplay?: 'always' | 'limited' | 'unspecified';
}

// Stripe SetupIntent：安全采集并保存支付方式，银行卡号不会经过 HourX 服务端。
export async function createStripeSetupIntent() {
  return getEnvelopeData<StripeSetupIntentRecord>(
    await http.post('/client/payment/setup-intent'),
  );
}

export async function getSavedPaymentMethods() {
  return getDataList<SavedPaymentMethodRecord>(
    await http.get('/client/payment/methods'),
  );
}

export function deleteSavedPaymentMethod(paymentMethodId: string) {
  return http.delete(`/client/payment/methods/${encodeURIComponent(paymentMethodId)}`);
}

export function setDefaultSavedPaymentMethod(paymentMethodId: string) {
  return http.put(`/client/payment/methods/${encodeURIComponent(paymentMethodId)}/default`);
}

// 仅在用户主动确认后调用，不随列卡或设置默认卡自动授权。
export function enableSavedPaymentMethodRedisplay(paymentMethodId: string, consent: boolean) {
  return http.put(`/client/payment/methods/${encodeURIComponent(paymentMethodId)}/redisplay-consent`, {
    consent,
  });
}

// /client/payment/apple-pay/merchant-session. apple pay 商户验证
export type MerchantSessionRequest = {
  validationUrl: string;
};

export function merchant(params: MerchantSessionRequest) {
  return http.post('/client/payment/apple-pay/merchant-session', undefined, {
    params,
  });
}

// /client/payment/apple-pay/complete apple pay 支付完成
export type CompletePaymentRequest = {
  orderId: number | string;
  paymentToken: string;
};

export function complete(params: CompletePaymentRequest) {
  return http.post('/client/payment/apple-pay/complete', undefined, {
    params,
  });
}

// /client/payment/paypal/success-callback paypal支付成功回调
export type PaypalSuccessCallbackRequest = {
  paymentId: string;
  PayerID: string;
};

export function paypalSuccessCallback(params: PaypalSuccessCallbackRequest) {
  return http.get('/client/payment/paypal/success-callback', { params });
}

// /client/payment/paypal/cancel-callback paypal支付取消回调
export type PaypalCancelCallbackRequest = {
  orderNo?: string;
  token?: string;
};

export function paypalCancelCallback(params?: PaypalCancelCallbackRequest) {
  return http.get('/client/payment/paypal/cancel-callback', { params });
}

// ========== 个人信息 ==========

export async function getClientProfile() {
  return getEnvelopeData<ClientProfileRecord>(await http.get('/client/user/profile'));
}

export async function updateClientProfile(params: UpdateClientProfilePayload) {
  return getEnvelopeData<ClientProfileRecord>(await http.post('/client/user/profile', params));
}

// ========== 预订购物车 ==========

export async function addCartItem(params: AddCartItemPayload) {
  const legacyNameFields = ensureLegacyRequiredNameFields(
    params.firstName,
    params.lastName,
  );
  return getEnvelopeData<ClientCartItemRecord>(
    await http.post('/client/cart/add', { ...params, ...legacyNameFields }),
  );
}

export async function getCartList() {
  return getDataList<ClientCartItemRecord>(await http.get('/client/cart/list'));
}

export async function getCartDetail(cartItemId: string) {
  return getEnvelopeData<ClientCartItemRecord>(await http.get('/client/cart/detail', {
    params: { cartItemId },
  }));
}

export function deleteCartItem(cartItemId: string) {
  return http.post('/client/cart/delete', { cartItemId });
}

export function removeCartItems(cartItemIds: string[]) {
  return http.post('/client/cart/remove', { cartItemIds });
}

export async function checkoutCart(cartItemIds: string[], paymentMethod = 'STRIPE', validationUrl?: string) {
  return getEnvelopeData<CartCheckoutResult>(await http.post('/client/cart/checkout', {
    cartItemIds,
    paymentMethod,
    ...(validationUrl ? { validationUrl } : {}),
  }));
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

// /client/product/search 按中英文服务名称搜索上架商品
export async function searchOnShelfSpus(keyword: string) {
  const payload = await http.get('/client/product/search', {
    params: { keyword: keyword.trim() },
  });
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

// /client/order/page 按订单号补查订单主键，兼容旧列表接口不返回 orderId
export async function getOrderByOrderNo(orderNo: string) {
  const payload = await http.post('/client/order/page', {
    orderNo,
    pageNum: 1,
    pageSize: 10,
  });
  const page = getEnvelopeData<unknown>(payload);
  const records = Array.isArray(page)
    ? page
    : page && typeof page === 'object'
      ? ((page as { list?: unknown[]; records?: unknown[] }).list
        ?? (page as { records?: unknown[] }).records
        ?? [])
      : [];
  return (records as OrderListRecord[]).find((item) => String(item.orderNo || '').trim() === orderNo.trim())
    ?? (records[0] as OrderListRecord | undefined)
    ?? null;
}

export type ClientRefundRequest = {
  orderNo: string;
  refundReason: string;
  refundReasonRemark?: string;
  refundAmount?: number;
};

// /client/order/refund-reasons 获取退款原因枚举
export async function getRefundReasons() {
  return getDataList<RefundReasonRecord>(await http.get('/client/order/refund-reasons'));
}

// /client/order/refund 发起退款申请
export function requestOrderRefund(params: ClientRefundRequest) {
  return http.post('/client/order/refund', params);
}

export async function checkOrderRefund(orderNo: string) {
  return getEnvelopeData<OrderRefundCheckResult>(await http.get('/client/order/refund-check', {
    params: { orderNo },
  }));
}

// /client/order/refund-amount 取消预订时展示手续费及实际到账金额
export async function getOrderRefundAmount(orderNo: string) {
  return getEnvelopeData<OrderRefundAmountRecord>(await http.get('/client/order/refund-amount', {
    params: { orderNo },
  }));
}

// /client/order/reschedule 修改服务日期、时段及可选联系信息
export async function rescheduleOrder(params: OrderReschedulePayload) {
  return getEnvelopeData<OrderRescheduleResult>(await http.post('/client/order/reschedule', params));
}

export function cancelOrder(params: { orderNo: string; cancelReason?: string }) {
  return http.post('/client/order/cancel', params);
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

// /client/address/list 地址列表
export async function getClientAddressList() {
  const payload = await http.get('/client/address/list');
  return getDataList<LegacyClientAddressRecord>(payload).map(
    normalizeClientAddressRecord,
  );
}

// /client/address/add 新增地址
export async function addClientAddress(params: AddClientAddressPayload) {
  const payload = await http.post('/client/address/add', {
    ...params,
    ...buildLegacyRequiredNameFields(params.fullName),
  });
  if (typeof payload === 'number') {
    return payload;
  }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;
    if (typeof data === 'number') {
      return data;
    }
    return data && typeof data === 'object'
      ? normalizeClientAddressRecord(data as LegacyClientAddressRecord)
      : null;
  }
  return payload && typeof payload === 'object'
    ? normalizeClientAddressRecord(payload as LegacyClientAddressRecord)
    : null;
}

// /client/address/update 编辑地址
export async function updateClientAddress(params: UpdateClientAddressPayload) {
  return http.post('/client/address/update', {
    ...params,
    ...buildLegacyRequiredNameFields(params.fullName),
  });
}

// /client/address/delete 删除地址
export async function deleteClientAddress(id: number | string) {
  return http.post('/client/address/delete', { id });
}

// /client/order/saveContactAddress 保存联系地址
export async function saveContactAddress(params: any) {
  const legacyNameFields = ensureLegacyRequiredNameFields(
    params?.firstName,
    params?.lastName,
    params?.fullName,
  );
  const payload = await http.post('/client/order/saveContactAddress', {
    ...params,
    ...legacyNameFields,
  });
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
  createPay,
  merchant,
  complete,
  paypalSuccessCallback,
  paypalCancelCallback,
  getOrderPage,
  getOrderDetail,
  level1Categories,
  exclusiveSpus,
  getOrderList,
  getRefundReasons,
  requestOrderRefund,
};
