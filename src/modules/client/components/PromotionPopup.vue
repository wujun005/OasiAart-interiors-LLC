<template>
  <Teleport to="body">
    <dialog
      v-if="visible && popup"
      ref="dialog"
      class="promo-popup"
      :class="{ 'promo-popup--mobile': mobile }"
      :aria-label="title ? undefined : (zh ? '活动优惠' : 'Special offer')"
      :aria-labelledby="title ? titleId : undefined"
      :aria-describedby="subtitle ? subtitleId : undefined"
      @cancel.prevent="close"
      @click.self="close"
    >
      <div class="promo-popup__panel">
        <button
          class="promo-popup__close"
          type="button"
          :aria-label="zh ? '关闭' : 'Close'"
          autofocus
          @click="close"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </button>
        <div
          class="promo-popup__body"
          :class="{
            'promo-popup__body--no-hero': !hasImage || compactArtwork,
            'promo-popup__body--image-only': hasImage && !hasCopy,
            'promo-popup__body--no-story': !hasImage && !hasCopy,
          }"
          tabindex="0"
        >
          <div class="promo-popup__story" :class="{ 'promo-popup__story--inset': compactArtwork && hasCopy }">
            <div v-if="hasImage" class="promo-popup__media">
              <img :key="image" :src="image" :alt="text(popup.altI18n)" @load="measureArtwork" @error="failedImage = image" />
            </div>
            <div v-if="hasCopy" class="promo-popup__copy">
              <p v-if="eyebrow" class="promo-popup__eyebrow">{{ eyebrow }}</p>
              <h2 v-if="title" :id="titleId" class="promo-popup__title">{{ title }}</h2>
              <p v-if="subtitle" :id="subtitleId" class="promo-popup__subtitle">{{ subtitle }}</p>
            </div>
          </div>
          <p v-if="badge" class="promo-popup__offer">{{ badge }}</p>
        </div>
        <div v-if="button || popup.linkType" class="promo-popup__footer">
          <button class="promo-popup__action" type="button" @click="open">
            <span>{{ button || (zh ? '查看' : 'View') }}</span>
            <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3.5 9h10m-4-4 4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
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
const mobile = promotionDevice() === 'mobile';
const home = ref<WebsitePromotionHome | null>(null);
const visible = ref(false);
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = `promotion-title-${useId()}`;
const subtitleId = `promotion-subtitle-${useId()}`;
const popup = computed(() => home.value?.popups?.[0] || null);
const image = computed(() => popup.value ? promotionImage(popup.value, locale.value, promotionDevice()) : '');
const artwork = ref<{ url: string; inset: boolean }>();
const failedImage = ref('');
const hasImage = computed(() => Boolean(image.value && failedImage.value !== image.value));
const compactArtwork = computed(() => artwork.value?.url === image.value && artwork.value.inset);
const eyebrow = computed(() => text(popup.value?.eyebrowI18n));
const title = computed(() => text(popup.value?.titleI18n, popup.value?.title));
const subtitle = computed(() => text(popup.value?.subtitleI18n));
const badge = computed(() => text(popup.value?.badgeI18n));
const button = computed(() => text(popup.value?.buttonI18n));
const hasCopy = computed(() => Boolean(eyebrow.value || title.value || subtitle.value));

function text(map: PromotionCard['titleI18n'], fallback = '') {
  return promotionText(map, fallback, locale.value).trim();
}

function measureArtwork(event: Event) {
  const img = event.currentTarget as HTMLImageElement;
  if (img.naturalHeight) {
    artwork.value = { url: image.value, inset: img.naturalWidth / img.naturalHeight < 1.6 };
  }
}

function hide() {
  dialog.value?.close();
  visible.value = false;
}
function close() {
  if (popup.value) rememberPopup(popup.value);
  hide();
}
function open() {
  const card = popup.value;
  if (!card) return;
  close();
  void openPromotion(card, router, promotionDevice() === 'mobile', home.value?.limitedTimeDeals || []);
}
function categoryKey() {
  const value = route.query.categoryId;
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

watch(dialog, (element) => {
  if (element && !element.open) element.showModal();
}, { flush: 'post' });

watch([() => route.path, categoryKey], async ([path, category], _, onCleanup) => {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => {
    active = false;
    clearTimeout(timer);
    hide();
  });

  if (/login|register/.test(path)) return;
  const nextHome = await loadWebsitePromotion(promotionPage(path, category));
  if (!active) return;
  home.value = nextHome;
  const card = popup.value;
  if (!card || !popupAllowed(card)) return;

  const delay = Number(card.popupTrigger) === 2 ? Number(card.popupDelaySeconds ?? 3) : 0;
  timer = setTimeout(() => {
    if (mobile && document.querySelector('dialog[data-booking-options][open]')) return;
    failedImage.value = '';
    visible.value = true;
    rememberImpression(card.id);
  }, Math.max(0, delay) * 1000);
}, { immediate: true });
</script>

<style scoped>
:global(html:has(.promo-popup[open])) {
  overflow: hidden;
  scrollbar-gutter: stable;
}

.promo-popup {
  --popup-width: 460px;
  --popup-max-height: 520px;
  --popup-viewport-share: 1;
  --popup-gutter: 18px;
  --popup-art-height: 142px;
  --popup-inset-width: 138px;
  --popup-ink: #06182f;
  --popup-text: #536071;
  --popup-green: #086946;
  inset: 0;
  box-sizing: border-box;
  width: min(var(--popup-width), calc(100% - 32px - env(safe-area-inset-left) - env(safe-area-inset-right)));
  max-width: none;
  max-height: min(var(--popup-max-height), calc(var(--popup-viewport-share) * 100vh), calc(100vh - 28px));
  max-height: min(var(--popup-max-height), calc(var(--popup-viewport-share) * 100dvh), calc(100dvh - 28px - env(safe-area-inset-top) - env(safe-area-inset-bottom)));
  padding: 0;
  overflow: hidden;
  border: 1px solid #e8e4dd;
  border-radius: 20px;
  background: #fff;
  color: var(--popup-ink);
  box-shadow: 0 20px 52px rgb(6 24 47 / 22%);
}

.promo-popup[open] {
  display: flex;
}

.promo-popup::backdrop {
  background: rgb(6 24 47 / 45%);
}

.promo-popup__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.promo-popup__body {
  min-height: 0;
  min-width: 0;
  padding: var(--popup-gutter) var(--popup-gutter) 12px;
  overflow: auto;
  overscroll-behavior: contain;
  overflow-wrap: anywhere;
}

.promo-popup__body:last-child {
  padding-bottom: var(--popup-gutter);
}

.promo-popup__body--no-story {
  padding-top: 51px;
}

.promo-popup__story {
  display: grid;
  gap: 12px;
}

.promo-popup__story--inset {
  grid-template-columns: var(--popup-inset-width) minmax(0, 1fr);
  align-items: center;
}

.promo-popup__media {
  display: grid;
  place-items: center;
  overflow: hidden;
  height: var(--popup-art-height);
  border-radius: 12px;
  background: #f4f1ec;
}

.promo-popup__story--inset .promo-popup__media {
  height: var(--popup-inset-width);
}

.promo-popup__media img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
}

.promo-popup__body--no-hero .promo-popup__copy {
  padding-inline-end: 38px;
}

.promo-popup__body--no-hero.promo-popup__body--image-only .promo-popup__media {
  margin-inline-end: 38px;
}

.promo-popup__eyebrow,
.promo-popup__title,
.promo-popup__subtitle {
  margin: 0;
}

.promo-popup__eyebrow {
  margin-bottom: 4px;
  color: var(--popup-green);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.promo-popup__title {
  font-family: var(--hourx-client-heading-font, inherit);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.02em;
}

.promo-popup__subtitle {
  color: var(--popup-text);
  font-size: 14px;
  line-height: 1.45;
}

.promo-popup__title + .promo-popup__subtitle {
  margin-top: 5px;
}

.promo-popup__offer {
  margin: 10px 0 0;
  padding: 6px 9px;
  border-radius: 8px;
  background: #eaf6ef;
  color: var(--popup-green);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
}

.promo-popup__close {
  position: absolute;
  z-index: 1;
  top: 7px;
  inset-inline-end: 7px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--popup-ink);
  cursor: pointer;
}

.promo-popup__close::before {
  grid-area: 1 / 1;
  width: 32px;
  height: 32px;
  border: 1px solid #e8e4dd;
  border-radius: 50%;
  background: #fff;
  content: '';
}

.promo-popup__close svg {
  position: relative;
  grid-area: 1 / 1;
  width: 16px;
  height: 16px;
}

.promo-popup__footer {
  flex: none;
  padding: 0 var(--popup-gutter) var(--popup-gutter);
  background: #fff;
}

.promo-popup__action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 8px 13px;
  border: 0;
  border-radius: 10px;
  background: var(--popup-ink);
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.3;
  cursor: pointer;
}

.promo-popup__action span {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  padding-inline-start: 24px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.promo-popup__action svg {
  width: 18px;
  height: 18px;
}

.promo-popup :focus-visible {
  outline: 2px solid var(--popup-green);
  outline-offset: 2px;
}

.promo-popup__close:focus-visible {
  outline: none;
}

.promo-popup__close:focus-visible::before {
  outline: 2px solid var(--popup-green);
  outline-offset: 2px;
}

.promo-popup__body:focus-visible {
  outline-offset: -3px;
}

@media (hover: hover) {
  .promo-popup__close:hover::before { background: #f4f1ec; }
  .promo-popup__action:hover { background: #18304c; }
}

.promo-popup--mobile {
  --popup-width: 340px;
  --popup-max-height: 420px;
  --popup-viewport-share: 0.68;
  --popup-gutter: 14px;
  --popup-art-height: 112px;
  --popup-inset-width: 96px;
  border-radius: 18px;
}

.promo-popup--mobile .promo-popup__story { gap: 10px; }
.promo-popup--mobile .promo-popup__title { font-size: 20px; }
.promo-popup--mobile .promo-popup__subtitle { font-size: 13px; }

@media (max-height: 440px) {
  .promo-popup {
    --popup-gutter: 12px;
    --popup-art-height: 88px;
    --popup-inset-width: 84px;
  }
}
</style>
