import { onMounted, ref, watch, type Ref } from 'vue';
import type { Router } from 'vue-router';
import { getStoredAuthSnapshot } from '@/utils/auth-state';
import {
  fetchWebsitePromotion,
  trackPromotion,
  type CampaignDealCard,
  type PromotionCard,
  type PromotionText,
  type WebsitePromotionHome,
} from '@/modules/client/api/promotion';

const emptyHome = (): WebsitePromotionHome => ({
  bannerAutoplaySeconds: 6,
  banners: [],
  exclusiveOffers: [],
  limitedServiceCards: [],
  limitedTimeDeals: [],
  popups: [],
  serviceTags: [],
});

const cache = new Map<string, WebsitePromotionHome>();
const pending = new Map<string, Promise<WebsitePromotionHome>>();

export function promotionDevice(): 'pc' | 'mobile' {
  if (typeof window === 'undefined') return 'pc';
  if (/h5/i.test(window.location.pathname)) return 'mobile';
  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'pc';
}

export function promotionPage(path: string) {
  if (!path || path === '/') return 'home';
  if (path.startsWith('/services')) return 'services';
  if (path.startsWith('/packages')) return 'packages';
  return path.replace(/^\//, '').slice(0, 64) || 'home';
}

export function promotionText(map: PromotionText | undefined, fallback = '', language = 'zh') {
  const lang = language.startsWith('zh') ? 'zh' : 'en';
  return map?.[lang] || map?.zh || map?.en || fallback || '';
}

export function promotionImage(card: PromotionCard, language: string, device: 'pc' | 'mobile') {
  const chinese = language.startsWith('zh');
  if (device === 'mobile') {
    return (chinese && card.mobileImageUrlZh) || card.mobileImageUrl || (chinese && card.pcImageUrlZh) || card.pcImageUrl || '';
  }
  return (chinese && card.pcImageUrlZh) || card.pcImageUrl || (chinese && card.mobileImageUrlZh) || card.mobileImageUrl || '';
}

function visitor() {
  return getStoredAuthSnapshot().token ? '' : 'guest';
}

export function loadWebsitePromotion(page: string) {
  const device = promotionDevice();
  const key = `${device}|${page}|${visitor() || 'member'}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const running = pending.get(key);
  if (running) return running;
  const request = fetchWebsitePromotion(device, page, visitor() || undefined)
    .catch(() => emptyHome())
    .then((home) => {
      cache.set(key, home);
      pending.delete(key);
      return home;
    });
  pending.set(key, request);
  return request;
}

export function useWebsitePromotion(page: Ref<string> | (() => string)) {
  const home = ref<WebsitePromotionHome>(emptyHome());
  const readPage = () => (typeof page === 'function' ? page() : page.value);
  async function refresh() {
    home.value = await loadWebsitePromotion(readPage());
  }
  onMounted(refresh);
  watch(readPage, refresh);
  return { home, refresh };
}

const seenImpressions = new Set<number>();

export function rememberImpression(id?: number) {
  if (!id || seenImpressions.has(id)) return;
  seenImpressions.add(id);
  void trackPromotion(id, 1);
}

function dubaiDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function popupAllowed(card: PromotionCard) {
  const id = Number(card.id || 0);
  if (!id) return false;
  const frequency = Number(card.popupFrequency || 1);
  if (frequency === 2) return true;
  const raw = localStorage.getItem(`hourx.promotion.popup.${id}`);
  if (!raw) return true;
  if (frequency === 3) return raw !== dubaiDay();
  return false;
}

export function rememberPopup(card: PromotionCard) {
  const id = Number(card.id || 0);
  if (!id) return;
  localStorage.setItem(`hourx.promotion.popup.${id}`, dubaiDay());
}

function sameId(left: unknown, right: unknown) {
  const a = Number(left);
  const b = Number(right);
  return Number.isFinite(a) && a > 0 && a === b;
}

export function serviceTagLabels(tags: PromotionCard[], spuId: unknown, categoryId: unknown, language: string) {
  return tags.flatMap((tag) => {
    const spus = tag.tagSpuIds || [];
    const categories = tag.tagCategoryIds || [];
    const open = !spus.length && !categories.length;
    const matched = open || spus.some((id) => sameId(id, spuId)) || categories.some((id) => sameId(id, categoryId));
    if (!matched) return [];
    const label = promotionText(tag.badgeI18n, '', language) || promotionText(tag.titleI18n, tag.title || '', language);
    return label ? [label] : [];
  });
}

export async function openPromotion(
  card: PromotionCard | CampaignDealCard,
  router: Router,
  mobile: boolean,
  deals: CampaignDealCard[] = [],
) {
  const id = 'id' in card ? Number(card.id || 0) : 0;
  if (id) void trackPromotion(id, 2);
  const names = mobile
    ? { home: 'h5-home', services: 'h5-service-search', product: 'h5-product-detail', packages: 'h5-packages', packageDetail: 'h5-package-detail' }
    : { home: 'home', services: 'service-search', product: 'product-detail', packages: 'packages', packageDetail: 'package-detail' };
  if ('bookNow' in card || ('spuId' in card && !('linkType' in card))) {
    const deal = card as CampaignDealCard;
    if (deal.spuId) {
      await router.push({ name: names.product, params: { spuId: String(deal.spuId) } });
    }
    return;
  }
  const promo = card as PromotionCard;
  if (promo.couponCode) sessionStorage.setItem('hourx.pendingCoupon', promo.couponCode);
  const link = Number(promo.linkType || 0);
  if (link === 6 && promo.externalUrl) {
    if (/^https?:\/\//i.test(promo.externalUrl)) {
      window.open(promo.externalUrl, '_blank', 'noopener');
      return;
    }
    await router.push(promo.externalUrl);
    return;
  }
  if (link === 3 && promo.spuId) {
    await router.push({ name: names.product, params: { spuId: String(promo.spuId) } });
    return;
  }
  if (link === 4 && promo.categoryId) {
    await router.push({ name: names.services, query: { categoryId: String(promo.categoryId) } });
    return;
  }
  if (link === 7 && promo.campaignId) {
    const deal = deals.find((item) => sameId(item.campaignId, promo.campaignId));
    if (deal?.spuId) {
      await router.push({ name: names.product, params: { spuId: String(deal.spuId) } });
      return;
    }
  }
  if (link === 2 || link === 1 || link === 0) {
    const page = String(promo.pageCode || '').trim();
    if (page === 'packages') {
      await router.push({ name: names.packages });
      return;
    }
    if (page === 'services') {
      await router.push({ name: names.services });
      return;
    }
    if (page && page !== 'home' && page.startsWith('/')) {
      await router.push(page);
      return;
    }
    if (link === 2 && page && page !== 'home') {
      await router.push({ name: names.services });
      return;
    }
  }
  if (names.home === 'home') await router.push('/');
  else await router.push({ name: names.home });
}
