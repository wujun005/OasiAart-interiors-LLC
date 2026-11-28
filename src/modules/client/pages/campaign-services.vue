<template>
  <section class="campaign-services" :class="{ 'is-h5': h5 }">
    <header>
      <button type="button" @click="back">{{ h5 ? '←' : t('client.header.nav.services') }}</button>
      <p>LIMITED-TIME</p>
      <h1>{{ title }}</h1>
      <span v-if="subtitle">{{ subtitle }}</span>
      <em v-if="badge">{{ badge }}</em>
    </header>

    <p v-if="loading" class="campaign-services__state">{{ zh ? '正在查找服务…' : 'Searching for services…' }}</p>
    <p v-else-if="missing" class="campaign-services__state">{{ zh ? '没有找到这次活动' : 'This offer could not be found' }}</p>
    <p v-else-if="!open" class="campaign-services__state">{{ zh ? '这次活动还没开始，或已经结束' : 'This offer has not started, or it has ended' }}</p>
    <p v-else-if="!cards.length && !packageCards.length" class="campaign-services__state">{{ zh ? '这次活动里还没有可预订的服务或套餐' : 'Nothing is available in this offer yet' }}</p>
    <div v-else class="campaign-services__grid">
      <article v-for="item in cards" :key="`service-${item.id}`" @click="openService(item.id)">
        <img :src="item.image" :alt="item.title" />
        <div>
          <h2>{{ item.title }}</h2>
          <b>
            <s v-if="item.was">{{ item.was }}</s>
            {{ item.price }}
          </b>
          <button type="button" @click.stop="openService(item.id)">{{ t('client.serviceList.card.bookNow') }}</button>
        </div>
      </article>
      <article v-for="item in packageCards" :key="`package-${item.id}`" @click="openPackage(item.id)">
        <img :src="item.image" :alt="item.title" />
        <div>
          <h2>{{ item.title }}</h2>
          <b>
            <s v-if="item.was">{{ item.was }}</s>
            {{ item.price }}
          </b>
          <button type="button" @click.stop="openPackage(item.id)">{{ t('client.serviceList.card.bookNow') }}</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { fetchCampaignServices, type CampaignPackageCard, type CampaignServiceCard } from '@/modules/client/api/promotion';
import { promotionText } from '@/modules/client/utils/website-promotion';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const zh = computed(() => locale.value.startsWith('zh'));
const h5 = computed(() => route.name === 'h5-campaign-services' || /\/h5(\/|$)/i.test(window.location.pathname));
const loading = ref(false);
const missing = ref(false);
const open = ref(true);
const title = ref('');
const subtitle = ref('');
const badge = ref('');
const services = ref<CampaignServiceCard[]>([]);
const packages = ref<CampaignPackageCard[]>([]);

const cards = computed(() => services.value.flatMap((item) => {
  const id = Number(item.id || 0);
  const name = promotionText(item.nameI18n, '', locale.value);
  if (!id || !name) return [];
  const amount = Number(item.minNotIncTaxPrice);
  const catalog = Number(item.catalogMinNotIncTaxPrice);
  const price = Number.isFinite(amount) ? t('client.serviceList.card.priceFrom', { price: amount.toFixed(2) }) : t('client.serviceList.card.priceConsult');
  const was = Number.isFinite(catalog) && Number.isFinite(amount) && catalog > amount + 0.009
    ? t('client.serviceList.card.priceFrom', { price: catalog.toFixed(2) })
    : '';
  return [{
    id,
    title: name,
    image: item.imageUrls?.[0] || '',
    price,
    was,
  }];
}));

const money = (value: number) => `AED ${value.toFixed(2)}`;
const packageCards = computed(() => packages.value.flatMap((item) => {
  const id = Number(item.id || 0);
  const name = promotionText(item.nameI18n, item.packageName || '', locale.value);
  if (!id || !name) return [];
  const sale = Number(item.salePrice);
  const campaign = Number(item.campaignPrice);
  const hasSale = Number.isFinite(sale) && sale > 0;
  const hasCampaign = Number.isFinite(campaign) && hasSale && campaign > 0 && campaign < sale - 0.009;
  return [{
    id,
    title: name,
    image: item.imageUrls?.[0] || '',
    price: hasCampaign ? money(campaign) : hasSale ? money(sale) : '',
    was: hasCampaign ? money(sale) : '',
  }];
}));

async function load(id: number) {
  loading.value = true;
  missing.value = false;
  try {
    const page = await fetchCampaignServices(id);
    title.value = promotionText(page.nameI18n, page.name || '', locale.value) || (zh.value ? '活动服务' : 'Offer services');
    subtitle.value = promotionText(page.subtitleI18n, '', locale.value);
    badge.value = promotionText(page.badgeI18n, '', locale.value);
    open.value = page.open !== false;
    services.value = page.services;
    packages.value = page.packages;
  } catch {
    missing.value = true;
    services.value = [];
    packages.value = [];
    title.value = zh.value ? '活动服务' : 'Offer services';
  } finally {
    loading.value = false;
  }
}

watch(() => [route.params.id, locale.value], () => {
  const id = Number(route.params.id || 0);
  if (!id) {
    missing.value = true;
    return;
  }
  void load(id);
}, { immediate: true });

function back() {
  if (h5.value) void router.push({ name: 'h5-home' });
  else void router.push('/');
}

function openService(id: number) {
  void router.push({ name: h5.value ? 'h5-product-detail' : 'product-detail', params: { spuId: String(id) } });
}

function openPackage(id: number) {
  void router.push({ name: h5.value ? 'h5-package-detail' : 'package-detail', params: { id: String(id) } });
}
</script>

<style scoped>
.campaign-services { width: min(1120px, calc(100% - 40px)); margin: 28px auto 56px; }
.campaign-services header button { border: 0; padding: 0; background: transparent; color: #0a7a6a; font-weight: 700; cursor: pointer; }
.campaign-services header p { margin: 16px 0 0; color: #0a7a6a; font-size: 12px; font-weight: 700; letter-spacing: .16em; }
.campaign-services h1 { margin: 6px 0 0; font-size: 34px; line-height: 1.15; }
.campaign-services header span { display: block; margin-top: 8px; color: #5d6b7c; }
.campaign-services header em { display: inline-block; margin-top: 12px; border: 1px solid rgb(184 154 114 / 55%); border-radius: 8px; padding: 6px 10px; color: #8a6a32; font-style: normal; font-weight: 700; }
.campaign-services__state { margin-top: 28px; color: #5d6b7c; }
.campaign-services__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
.campaign-services__grid article { overflow: hidden; border: 1px solid #e6edf3; border-radius: 16px; background: #fff; cursor: pointer; }
.campaign-services__grid img { width: 100%; height: 180px; object-fit: cover; background: #16324f; }
.campaign-services__grid div { display: flex; flex-direction: column; gap: 8px; padding: 14px; }
.campaign-services__grid h2 { margin: 0; font-size: 18px; }
.campaign-services__grid b { color: #102033; font-size: 14px; }
.campaign-services__grid b s { display: block; color: #8b97a8; font-size: 12px; font-weight: 600; text-decoration: line-through; }
.campaign-services__grid button { align-self: flex-start; border: 0; border-radius: 8px; padding: 8px 12px; background: #102033; color: #fff; font-weight: 700; cursor: pointer; }
.campaign-services.is-h5 { width: calc(100% - 28px); margin-top: 16px; }
.campaign-services.is-h5 h1 { font-size: 26px; }
.campaign-services.is-h5 .campaign-services__grid { grid-template-columns: 1fr; }
@media (max-width: 900px) { .campaign-services__grid { grid-template-columns: 1fr; } }
</style>
