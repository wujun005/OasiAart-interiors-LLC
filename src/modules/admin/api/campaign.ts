import http from '@/modules/admin/utils/request';

export type CampaignSavePayload = {
  id?: number;
  nameI18n: Record<string, string>;
  subtitleI18n?: Record<string, string>;
  targetScope: number;
  priceMode: number;
  validStart: string;
  validEnd: string;
  status: number;
  quota?: number;
  showOnHome: boolean;
  sortNo: number;
  categoryIds?: number[];
  spuIds?: number[];
  skuIds?: number[];
  specValueIds?: number[];
  packageIds?: number[];
  highlightSkuId?: number;
  campaignPrice?: number;
  discountPercent?: number;
  perCustomerQuota?: number;
  coverImage?: string;
  badgeI18n?: Record<string, string>;
  excludePackage: boolean;
};

export function campaignPage(payload: {
  keyword?: string;
  status?: number;
  pageNum: number;
  pageSize: number;
}) {
  return http.post('/api/platform/campaign/page', payload);
}

export function campaignDetail(id: number) {
  return http.post('/api/platform/campaign/detail', { id });
}

export function campaignAdd(payload: CampaignSavePayload) {
  return http.post('/api/platform/campaign/add', payload);
}

export function campaignUpdate(payload: CampaignSavePayload) {
  return http.post('/api/platform/campaign/update', payload);
}

export function campaignEnable(id: number) {
  return http.post('/api/platform/campaign/enable', { id });
}

export function campaignDisable(id: number) {
  return http.post('/api/platform/campaign/disable', { id });
}

export function campaignEnd(id: number) {
  return http.post('/api/platform/campaign/end', { id });
}
