<template>
  <div v-if="hasContent" class="website-promos">
    <section v-if="home.exclusiveOffers.length" class="website-promos__section">
      <header>
        <p>EXCLUSIVE OFFERS</p>
        <h2>{{ zh ? '专属优惠' : 'Exclusive Offers' }}</h2>
      </header>
      <div class="website-promos__grid">
        <button v-for="card in home.exclusiveOffers" :key="card.id" type="button" @click="open(card)">
          <small>{{ text(card.eyebrowI18n) }}</small>
          <strong>{{ text(card.titleI18n, card.title) }}</strong>
          <span>{{ text(card.subtitleI18n) }}</span>
          <em v-if="text(card.badgeI18n)">{{ text(card.badgeI18n) }}</em>
        </button>
      </div>
    </section>

    <section v-if="deals.length" id="deals" class="website-promos__section" aria-labelledby="deals-title">
      <header class="website-promos__deals-heading">
        <h2 id="deals-title">{{ zh ? '限时优惠' : 'Limited-time Deals' }}</h2>
        <div v-if="canScrollBack || canScrollForward" class="website-promos__deals-nav">
          <button
            type="button"
            aria-controls="deals-rail"
            :aria-label="zh ? '上一项优惠' : 'Previous deal'"
            :disabled="!canScrollBack"
            @click="scrollDeals(-1)"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m11.5 5.5-4.5 4.5 4.5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-controls="deals-rail"
            :aria-label="zh ? '下一项优惠' : 'Next deal'"
            :disabled="!canScrollForward"
            @click="scrollDeals(1)"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m8.5 5.5 4.5 4.5-4.5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </header>
      <ul
        id="deals-rail"
        ref="dealRail"
        class="website-promos__deals-rail"
        :class="{
          'website-promos__deals-rail--more': deals.length > 2,
          'website-promos__deals-rail--inventory': deals.some(deal => deal.inventory),
        }"
        role="list"
        @scroll.passive="updateDealScroll"
      >
        <li v-for="deal in deals" :key="deal.key" class="website-promos__deal">
          <button type="button" class="deal-card" @click="open(deal.source)">
            <img
              v-if="deal.image && !failedImages.has(deal.image)"
              class="deal-card__image"
              :class="{ 'deal-card__image--artwork': deal.preserveArtwork }"
              :src="deal.image"
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
              @error="failedImages.add(deal.image)"
            />
            <span class="deal-card__body">
              <span v-if="deal.eyebrow" class="deal-card__eyebrow">{{ deal.eyebrow }}</span>
              <strong class="deal-card__title" :title="deal.title">{{ deal.title }}</strong>
              <span v-if="deal.subtitle" class="deal-card__summary">{{ deal.subtitle }}</span>
              <span v-if="deal.price || deal.inventory" class="deal-card__details">
                <span v-if="deal.price" class="deal-card__prices">
                  <b>AED {{ deal.price }}</b>
                  <s v-if="deal.originalPrice"><span class="deal-card__compare-currency">AED </span>{{ deal.originalPrice }}</s>
                </span>
                <small v-if="deal.inventory" class="deal-card__inventory">{{ deal.inventory }}</small>
              </span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { CampaignDealCard, PromotionCard } from '@/modules/client/api/promotion';
import {
  openPromotion,
  promotionDevice,
  promotionImage,
  promotionText,
  rememberImpression,
  useWebsitePromotion,
} from '@/modules/client/utils/website-promotion';

const { locale } = useI18n();
const router = useRouter();
const zh = computed(() => locale.value.startsWith('zh'));
const { home } = useWebsitePromotion(() => 'home');
const dealRail = ref<HTMLUListElement | null>(null);
const canScrollBack = ref(false);
const canScrollForward = ref(false);
const failedImages = ref(new Set<string>());
let dealObserver: ResizeObserver | undefined;

const deals = computed(() => [
  ...home.value.limitedServiceCards.map((card, index) => ({
    key: `card-${card.id ?? index}`,
    source: card,
    image: promotionImage(card, locale.value, promotionDevice()),
    preserveArtwork: Number(card.cardStyle) === 2,
    eyebrow: text(card.eyebrowI18n) || text(card.badgeI18n),
    title: text(card.titleI18n, card.title) || text(card.altI18n) || text(card.buttonI18n),
    subtitle: text(card.subtitleI18n),
    price: '',
    originalPrice: '',
    inventory: text(card.eyebrowI18n) ? text(card.badgeI18n) : '',
  })),
  ...home.value.limitedTimeDeals.map((deal, index) => {
    const price = priceAmount(deal.campaignPrice);
    return {
      key: `deal-${deal.campaignId ?? index}`,
      source: deal,
      image: deal.coverImage || '',
      preserveArtwork: false,
      eyebrow: text(deal.badgeI18n),
      title: text(deal.nameI18n, deal.name),
      subtitle: text(deal.subtitleI18n),
      price,
      originalPrice: price && Number(deal.originalPrice) > Number(deal.campaignPrice) ? priceAmount(deal.originalPrice) : '',
      inventory: deal.remainingQuota == null ? '' : (zh.value ? `剩余 ${deal.remainingQuota}` : `${deal.remainingQuota} left`),
    };
  }),
]);
const hasContent = computed(() =>
  home.value.exclusiveOffers.length > 0 || deals.value.length > 0,
);

function text(map: PromotionCard['titleI18n'], fallback = '') {
  return promotionText(map, fallback, locale.value).trim();
}
function priceAmount(value?: number) {
  const amount = Number(value);
  return value != null && String(value).trim() && Number.isFinite(amount) && amount >= 0
    ? amount.toFixed(2)
    : '';
}
function open(card: PromotionCard | CampaignDealCard) {
  void openPromotion(card, router, promotionDevice() === 'mobile', home.value.limitedTimeDeals);
}

function updateDealScroll() {
  const rail = dealRail.value;
  const offset = rail?.scrollLeft ?? 0;
  canScrollBack.value = offset > 2;
  canScrollForward.value = Boolean(rail && rail.scrollWidth - rail.clientWidth - offset > 2);
}

function scrollDeals(direction: -1 | 1) {
  const rail = dealRail.value;
  const card = rail?.firstElementChild;
  if (!rail || !card) return;
  const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
  rail.scrollBy({
    left: direction * (card.getBoundingClientRect().width + gap),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}

watch(dealRail, (rail) => {
  dealObserver?.disconnect();
  if (rail && typeof ResizeObserver !== 'undefined') {
    dealObserver = new ResizeObserver(updateDealScroll);
    dealObserver.observe(rail);
  }
  updateDealScroll();
}, { flush: 'post' });
watch(deals, updateDealScroll, { flush: 'post' });
onBeforeUnmount(() => dealObserver?.disconnect());

watch(home, (value) => {
  [...value.exclusiveOffers, ...value.limitedServiceCards].forEach((card) => rememberImpression(card.id));
}, { immediate: true });
</script>

<style scoped>
.website-promos { width: min(1200px, calc(100% - 48px)); margin: 28px auto 0; display: grid; gap: 28px; }
.website-promos__section { min-width: 0; }
.website-promos__section header p { margin: 0; color: #0a7a6a; font-size: 12px; font-weight: 700; letter-spacing: .14em; }
.website-promos__section h2 { margin: 4px 0 14px; font-size: 28px; }
.website-promos__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.website-promos__grid button { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-height: 150px; padding: 18px; border: 0; border-radius: 16px; background: linear-gradient(135deg, #06182f, #16385f); color: #fff; text-align: left; cursor: pointer; }
.website-promos__grid button small { letter-spacing: .12em; font-size: 11px; font-weight: 700; opacity: .8; }
.website-promos__grid button strong { font-size: 22px; line-height: 1.2; }
.website-promos__grid button span { color: rgb(255 255 255 / 78%); font-size: 13px; }
.website-promos__grid button em { margin-top: auto; padding: 4px 8px; border-radius: 8px; background: #fff; color: #06182f; font-style: normal; font-size: 12px; font-weight: 700; }

.website-promos__deals-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.website-promos__deals-heading h2 {
  margin: 0;
  color: var(--hourx-client-text, #06182f);
  font-weight: 800;
  letter-spacing: -0.025em;
}

.website-promos__deals-nav {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.website-promos__deals-nav button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid #e8e4dd;
  border-radius: 50%;
  background: #fff;
  color: #06182f;
  cursor: pointer;
}

.website-promos__deals-nav button:disabled {
  opacity: 0.42;
  cursor: default;
}

.website-promos__deals-nav svg {
  width: 19px;
  height: 19px;
}

.website-promos__deals-rail {
  display: grid;
  grid-auto-columns: clamp(204px, 23%, 254px);
  grid-auto-flow: column;
  gap: 12px;
  margin: 0;
  padding: 0 0 3px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  list-style: none;
}

.website-promos__deals-rail::-webkit-scrollbar {
  display: none;
}

.website-promos__deal {
  display: flex;
  min-width: 0;
  scroll-snap-align: start;
}

.deal-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 112px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e8e4dd;
  border-radius: 14px;
  background: #fff;
  color: #06182f;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.deal-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  background: #f2efe9;
}

.deal-card__image--artwork {
  object-fit: contain;
}

.deal-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  width: 100%;
  padding: 11px 12px;
  box-sizing: border-box;
  overflow-wrap: anywhere;
}

.deal-card__eyebrow {
  display: block;
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  border-radius: 5px;
  background: #eaf5ee;
  color: #086946;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.deal-card__title,
.deal-card__summary {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.deal-card__title {
  font-size: 17px;
  font-weight: 800;
  line-height: 1.23;
}

.deal-card__summary {
  color: #566271;
  font-size: 12px;
  line-height: 1.35;
}

.deal-card__details {
  display: grid;
  gap: 4px;
  margin-top: auto;
  padding-top: 4px;
}

.website-promos__deals-rail--inventory .deal-card__details {
  grid-template-rows: auto minmax(14px, auto);
}

.deal-card__inventory {
  grid-row: 2;
}

.deal-card__prices {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  font-variant-numeric: tabular-nums;
}

.deal-card__prices b,
.deal-card__prices s {
  white-space: nowrap;
}

.deal-card__prices b {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}

.deal-card__prices s,
.deal-card__inventory {
  color: #566271;
  font-size: 11px;
  line-height: 1.35;
}

.deal-card:focus-visible,
.website-promos__deals-nav button:focus-visible {
  outline: 2px solid #086946;
  outline-offset: -3px;
}

@media (hover: hover) {
  .deal-card:hover,
  .website-promos__deals-nav button:hover:not(:disabled) {
    border-color: #92bea9;
  }
}

@media (max-width: 900px) {
  .website-promos { width: calc(100% - 32px); }
  .website-promos__grid { grid-template-columns: 1fr; }
  .website-promos__deals-rail {
    grid-auto-columns: min(216px, calc((100% - 10px) / 2));
    gap: 10px;
  }
  .website-promos__deals-rail--more {
    grid-auto-columns: min(216px, calc((100% - 32px) / 2));
  }
  .website-promos__deals-heading h2 { font-size: 23px; }
}

@media (max-width: 600px) {
  .website-promos__deals-heading h2 { font-size: 21px; }
  .deal-card { border-radius: 12px; }
  .deal-card__image { aspect-ratio: 16 / 9; }
  .deal-card__body { padding: 9px; }
  .deal-card__title { font-size: 14px; }
  .deal-card__prices b { font-size: 14px; }
  .deal-card__compare-currency { display: none; }
}
</style>
