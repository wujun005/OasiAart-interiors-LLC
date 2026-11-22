<template>
  <div v-if="visible && popup" class="promo-popup" role="dialog" aria-modal="true">
    <button class="promo-popup__mask" type="button" :aria-label="zh ? '关闭' : 'Close'" @click="close" />
    <article class="promo-popup__card">
      <button class="promo-popup__close" type="button" @click="close">×</button>
      <img v-if="image" :src="image" :alt="text(popup.altI18n)" />
      <small>{{ text(popup.eyebrowI18n) }}</small>
      <h2>{{ text(popup.titleI18n, popup.title) }}</h2>
      <p>{{ text(popup.subtitleI18n) }}</p>
      <strong v-if="text(popup.badgeI18n)">{{ text(popup.badgeI18n) }}</strong>
      <button v-if="text(popup.buttonI18n) || popup.linkType" class="promo-popup__action" type="button" @click="open">
        {{ text(popup.buttonI18n, zh ? '查看' : 'View') }}
      </button>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  loadWebsitePromotion,
  openPromotion,
  popupAllowed,
  promotionDevice,
  promotionImage,
  promotionPage,
  promotionText,
  rememberImpression,
  rememberPopup,
} from '@/modules/client/utils/website-promotion';
import type { PromotionCard, WebsitePromotionHome } from '@/modules/client/api/promotion';

const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const zh = computed(() => locale.value.startsWith('zh'));
const home = ref<WebsitePromotionHome | null>(null);
const visible = ref(false);
const popup = computed(() => home.value?.popups?.[0] || null);
const image = computed(() => popup.value ? promotionImage(popup.value, locale.value, promotionDevice()) : '');
let timer: ReturnType<typeof setTimeout> | undefined;

function text(map: PromotionCard['titleI18n'], fallback = '') {
  return promotionText(map, fallback, locale.value);
}
function close() {
  if (popup.value) rememberPopup(popup.value);
  visible.value = false;
}
function open() {
  if (!popup.value) return;
  rememberPopup(popup.value);
  visible.value = false;
  void openPromotion(popup.value, router, promotionDevice() === 'mobile', home.value?.limitedTimeDeals || []);
}
async function load() {
  clearTimeout(timer);
  visible.value = false;
  if (/login|register/.test(route.path)) return;
  home.value = await loadWebsitePromotion(promotionPage(route.path));
  const card = popup.value;
  if (!card || !popupAllowed(card)) return;
  const delay = Number(card.popupTrigger) === 2 ? Number(card.popupDelaySeconds || 3) : 0;
  timer = setTimeout(() => {
    visible.value = true;
    rememberImpression(card.id);
  }, Math.max(0, delay) * 1000);
}
watch(() => route.path, load, { immediate: true });
onUnmounted(() => clearTimeout(timer));
</script>

<style scoped>
.promo-popup { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 24px; }
.promo-popup__mask { position: absolute; inset: 0; border: 0; background: rgb(6 24 47 / 46%); }
.promo-popup__card { position: relative; width: min(420px, 100%); padding: 22px; border-radius: 18px; background: #fff; color: #0f1b2d; }
.promo-popup__card img { width: 100%; height: 180px; object-fit: cover; border-radius: 12px; }
.promo-popup__card small { color: #0a7a6a; font-size: 11px; font-weight: 700; letter-spacing: .12em; }
.promo-popup__card h2 { margin: 6px 0; font-size: 24px; }
.promo-popup__card p { margin: 0; color: #6b7a90; }
.promo-popup__card strong { display: inline-block; margin-top: 10px; padding: 4px 8px; border-radius: 8px; background: #e8faf7; color: #0a7a6a; }
.promo-popup__close { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border: 0; border-radius: 999px; background: #eef2f7; cursor: pointer; }
.promo-popup__action { margin-top: 16px; min-height: 42px; padding: 0 16px; border: 0; border-radius: 12px; background: #06182f; color: #fff; font-weight: 700; cursor: pointer; }
</style>
