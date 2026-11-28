import http from '@/modules/client/utils/request';

export type PromotionText = Record<string, string>;

export type PromotionCard = {
  id?: number;
  slot?: number;
  cardStyle?: number;
  title?: string;
  titleI18n?: PromotionText;
  titleLine2I18n?: PromotionText;
  eyebrowI18n?: PromotionText;
  subtitleI18n?: PromotionText;
  badgeI18n?: PromotionText;
  buttonI18n?: PromotionText;
  altI18n?: PromotionText;
  linkType?: number;
  pcImageUrl?: string;
  mobileImageUrl?: string;
  pcImageUrlZh?: string;
  mobileImageUrlZh?: string;
  couponCode?: string;
  pageCode?: string;
  spuId?: number;
  categoryId?: number;
  skuId?: number;
  campaignId?: number;
  externalUrl?: string;
  imageLink?: string;
  popupTrigger?: number;
  popupDelaySeconds?: number;
  popupFrequency?: number;
  popupAudience?: number;
  popupPages?: number;
  tagSpuIds?: number[];
  tagCategoryIds?: number[];
};

export type CampaignDealCard = {
  campaignId?: number;
  name?: string;
  nameI18n?: PromotionText;
  subtitleI18n?: PromotionText;
  badgeI18n?: PromotionText;
  coverImage?: string;
  spuId?: number;
  skuId?: number;
  originalPrice?: number;
  campaignPrice?: number;
  discountPercent?: number;
  validEnd?: string;
  remainingQuota?: number | null;
  bookNow?: boolean;
};

export type WebsitePromotionHome = {
  bannerAutoplaySeconds?: number;
  banners: PromotionCard[];
  exclusiveOffers: PromotionCard[];
  limitedServiceCards: PromotionCard[];
  limitedTimeDeals: CampaignDealCard[];
  popups: PromotionCard[];
  serviceTags: PromotionCard[];
};

function unwrap(payload: unknown): WebsitePromotionHome {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : root;
  const list = (value: unknown) => (Array.isArray(value) ? value : []);
  return {
    bannerAutoplaySeconds: Number(data.bannerAutoplaySeconds || 6),
    banners: list(data.banners),
    exclusiveOffers: list(data.exclusiveOffers),
    limitedServiceCards: list(data.limitedServiceCards),
    limitedTimeDeals: list(data.limitedTimeDeals),
    popups: list(data.popups),
    serviceTags: list(data.serviceTags),
  };
}

export async function fetchWebsitePromotion(device: 'pc' | 'mobile', page: string, visitor?: string) {
  const payload = await http.post('/client/promotion/home', {
    device,
    page,
    ...(visitor ? { visitor } : {}),
  });
  return unwrap(payload);
}

export function trackPromotion(id: number, eventType: 1 | 2) {
  return http.post('/client/promotion/track', { id, eventType }).catch(() => undefined);
}

export type CampaignServiceCard = {
  id?: number;
  nameI18n?: PromotionText;
  imageUrls?: string[];
  minNotIncTaxPrice?: number;
  catalogMinNotIncTaxPrice?: number;
  packageService?: number;
};

export type CampaignPackageCard = {
  id?: number | string;
  packageName?: string;
  nameI18n?: PromotionText;
  imageUrls?: string[];
  salePrice?: number | string | null;
  campaignPrice?: number | string | null;
};

export type CampaignServiceList = {
  campaignId?: number;
  name?: string;
  nameI18n?: PromotionText;
  subtitleI18n?: PromotionText;
  badgeI18n?: PromotionText;
  open?: boolean;
  services: CampaignServiceCard[];
  packages: CampaignPackageCard[];
};

export async function fetchCampaignServices(id: number): Promise<CampaignServiceList> {
  const payload = await http.post('/client/campaign/services', { id });
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const data = root.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : root;
  return {
    campaignId: Number(data.campaignId || id),
    name: typeof data.name === 'string' ? data.name : '',
    nameI18n: data.nameI18n as PromotionText | undefined,
    subtitleI18n: data.subtitleI18n as PromotionText | undefined,
    badgeI18n: data.badgeI18n as PromotionText | undefined,
    open: data.open !== false,
    services: Array.isArray(data.services) ? data.services as CampaignServiceCard[] : [],
    packages: Array.isArray(data.packages) ? data.packages as CampaignPackageCard[] : [],
  };
}
