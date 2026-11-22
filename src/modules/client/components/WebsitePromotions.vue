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

    <section v-if="home.limitedTimeDeals.length || home.limitedServiceCards.length" id="deals" class="website-promos__section">
      <header>
        <p>LIMITED-TIME DEALS</p>
        <h2>{{ zh ? '限时优惠' : 'Limited-time Deals' }}</h2>
      </header>
      <div class="website-promos__grid">
        <button v-for="card in home.limitedServiceCards" :key="'card-' + card.id" type="button" @click="open(card)">
          <small>{{ text(card.eyebrowI18n) }}</small>
          <strong>{{ text(card.titleI18n, card.title) }}</strong>
          <span>{{ text(card.subtitleI18n) }}</span>
          <em v-if="text(card.badgeI18n)">{{ text(card.badgeI18n) }}</em>
        </button>
        <button v-for="deal in home.limitedTimeDeals" :key="'deal-' + deal.campaignId" type="button" class="is-deal" @click="open(deal)">
          <img v-if="deal.coverImage" :src="deal.coverImage" alt="" />
          <small>{{ text(deal.badgeI18n) }}</small>
          <strong>{{ text(deal.nameI18n, deal.name) }}</strong>
          <span>{{ text(deal.subtitleI18n) }}</span>
          <b>
            <s v-if="money(deal.originalPrice) !== money(deal.campaignPrice)">{{ money(deal.originalPrice) }}</s>
            {{ money(deal.campaignPrice) }}
          </b>
          <em v-if="deal.remainingQuota != null">{{ zh ? `剩余 ${deal.remainingQuota}` : `${deal.remainingQuota} left` }}</em>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { CampaignDealCard, PromotionCard } from '@/modules/client/api/promotion';
import {
  openPromotion,
  promotionDevice,
  promotionText,
  rememberImpression,
  useWebsitePromotion,
} from '@/modules/client/utils/website-promotion';

const { locale } = useI18n();
const router = useRouter();
const zh = computed(() => locale.value.startsWith('zh'));
const { home } = useWebsitePromotion(() => 'home');
const hasContent = computed(() =>
  home.value.exclusiveOffers.length + home.value.limitedServiceCards.length + home.value.limitedTimeDeals.length > 0,
);

function text(map: PromotionCard['titleI18n'], fallback = '') {
  return promotionText(map, fallback, locale.value);
}
function money(value?: number) {
  const amount = Number(value || 0);
  return `AED ${amount.toFixed(2)}`;
}
function open(card: PromotionCard | CampaignDealCard) {
  void openPromotion(card, router, promotionDevice() === 'mobile', home.value.limitedTimeDeals);
}
watch(home, (value) => {
  [...value.exclusiveOffers, ...value.limitedServiceCards].forEach((card) => rememberImpression(card.id));
}, { immediate: true });
</script>

<style scoped>
.website-promos { width: min(1200px, calc(100% - 48px)); margin: 28px auto 0; display: grid; gap: 28px; }
.website-promos__section header p { margin: 0; color: #0a7a6a; font-size: 12px; font-weight: 700; letter-spacing: .14em; }
.website-promos__section h2 { margin: 4px 0 14px; font-size: 28px; }
.website-promos__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.website-promos__grid button { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-height: 150px; padding: 18px; border: 0; border-radius: 16px; background: linear-gradient(135deg, #06182f, #16385f); color: #fff; text-align: left; cursor: pointer; }
.website-promos__grid button small { letter-spacing: .12em; font-size: 11px; font-weight: 700; opacity: .8; }
.website-promos__grid button strong { font-size: 22px; line-height: 1.2; }
.website-promos__grid button span { color: rgb(255 255 255 / 78%); font-size: 13px; }
.website-promos__grid button em { margin-top: auto; padding: 4px 8px; border-radius: 8px; background: #fff; color: #06182f; font-style: normal; font-size: 12px; font-weight: 700; }
.website-promos__grid .is-deal { background: #fff; color: #0f1b2d; border: 1px solid #e3eaf2; }
.website-promos__grid .is-deal span { color: #6b7a90; }
.website-promos__grid .is-deal b { font-size: 18px; }
.website-promos__grid .is-deal s { margin-right: 8px; color: #8b95a5; font-size: 13px; }
.website-promos__grid img { width: 100%; height: 92px; object-fit: cover; border-radius: 10px; }
@media (max-width: 900px) {
  .website-promos { width: calc(100% - 32px); }
  .website-promos__grid { grid-template-columns: 1fr; }
}
</style>
