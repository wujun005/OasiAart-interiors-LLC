import http from '@/modules/admin/utils/request';

export type CouponReductionRule = {
  threshold?: number | null;
  reduction?: number | null;
};

export type CouponSavePayload = {
  id?: number;
  nameI18n: Record<string, string>;
  couponCode: string;
  allocationType: number;
  customerScope: number;
  allServices: boolean;
  allPackages: boolean;
  validStart: string;
  validEnd: string;
  status: number;
  discountType: number;
  platformRatio: number;
  supplierRatio: number;
  customerIds?: number[];
  categoryIds?: number[];
  spuIds?: number[];
  skuIds?: number[];
  packageIds?: number[];
  totalUseLimit?: number | null;
  perCustomerUseLimit?: number | null;
  discountPercent?: number | null;
  maxDiscountPerOrder?: number | null;
  reductionRules?: CouponReductionRule[];
  minSpend?: number | null;
  maxReduction?: number | null;
  minQualifyingAmount?: number | null;
  batchSize?: number | null;
  excludeVat?: boolean;
  excludePackaging?: boolean;
  oncePerOrder?: boolean;
};

export function couponPage(payload: {
  keyword?: string;
  status?: number;
  pageNum: number;
  pageSize: number;
}) {
  return http.post('/api/platform/coupon/page', payload);
}

export function couponDetail(id: number) {
  return http.post('/api/platform/coupon/detail', { id });
}

export function couponAdd(payload: CouponSavePayload) {
  return http.post('/api/platform/coupon/add', payload);
}

export function couponUpdate(payload: CouponSavePayload) {
  return http.post('/api/platform/coupon/update', payload);
}

export function couponEnable(id: number) {
  return http.post('/api/platform/coupon/enable', { id });
}

export function couponDisable(id: number) {
  return http.post('/api/platform/coupon/disable', { id });
}

export function couponRedemptions(payload: {
  couponCode: string;
  pageNum: number;
  pageSize: number;
}) {
  return http.post('/api/platform/coupon/redemptions', payload);
}
