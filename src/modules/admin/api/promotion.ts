import http from '@/modules/admin/utils/request';

export type PromotionSavePayload = {
  id?: number;
  slot: number;
  cardStyle?: number;
  linkType?: number;
  status?: number;
  sortNo?: number;
  validStart?: string;
  validEnd?: string;
  showOnPc?: boolean;
  showOnMobile?: boolean;
  eyebrowI18n?: Record<string, string>;
  titleI18n?: Record<string, string>;
  titleLine2I18n?: Record<string, string>;
  subtitleI18n?: Record<string, string>;
  badgeI18n?: Record<string, string>;
  buttonI18n?: Record<string, string>;
  altI18n?: Record<string, string>;
  pcImageUrl?: string;
  mobileImageUrl?: string;
  pcImageUrlZh?: string;
  mobileImageUrlZh?: string;
  imageLink?: string;
  couponCode?: string;
  pageCode?: string;
  spuId?: number;
  categoryId?: number;
  skuId?: number;
  campaignId?: number;
  externalUrl?: string;
  popupTrigger?: number;
  popupDelaySeconds?: number;
  popupFrequency?: number;
  popupAudience?: number;
  popupPages?: number;
  popupCategoryKey?: string;
};

export function promotionPage(payload: {
  keyword?: string;
  slot?: number;
  status?: number;
  pageNum: number;
  pageSize: number;
}) {
  return http.post('/api/platform/promotion/page', payload);
}

export function promotionDetail(id: number) {
  return http.post('/api/platform/promotion/detail', { id });
}

export function promotionAdd(payload: PromotionSavePayload) {
  return http.post('/api/platform/promotion/add', payload);
}

export function promotionUpdate(payload: PromotionSavePayload) {
  return http.post('/api/platform/promotion/update', payload);
}

export function promotionEnable(id: number) {
  return http.post('/api/platform/promotion/enable', { id });
}

export function promotionDisable(id: number) {
  return http.post('/api/platform/promotion/disable', { id });
}

export function promotionSort(id: number, direction: 1 | 2) {
  return http.post('/api/platform/promotion/sort', { id, direction });
}
