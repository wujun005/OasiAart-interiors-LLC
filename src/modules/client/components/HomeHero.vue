<template>
  <section
    ref="carousel"
    class="home-hero"
    :class="{ 'is-image-only': active.imageOnly, 'home-hero--compact': compact }"
    aria-roledescription="carousel"
    :aria-label="t('client.home.hero.headline')"
    @focusin="handleFocusChange"
    @focusout="handleFocusChange"
    @pointerdown="startSwipe"
    @pointerup="finishSwipe"
    @pointercancel="cancelSwipe"
  >
    <div class="home-hero__media" @click="openImage">
      <img
        v-for="(banner, index) in banners"
        :key="banner.key"
        :class="[
          'home-hero__image',
          'home-hero__image--' + banner.key,
          { 'is-active': index === activeIndex },
        ]"
        :src="banner.image"
        :fetchpriority="index === 0 ? 'high' : 'low'"
        :alt="banner.alt"
        width="1536"
        height="1024"
      />
    </div>
    <button class="home-hero__photo-link" type="button" :aria-label="active.alt || active.title" @click="openImage" />

    <div class="home-hero__inner">
      <div v-if="!active.imageOnly" class="home-hero__copy">
        <p class="home-hero__eyebrow">{{ active.eyebrow }}</p>
        <h1>
          <span>{{ active.title }}</span>
          <em v-if="active.accent">{{ active.accent }}</em>
        </h1>
        <p class="home-hero__description">{{ active.description }}</p>

        <div class="home-hero__actions">
          <div v-if="active.offer" class="home-hero__offer">
            <strong>{{ active.offer }}</strong>
          </div>
          <button type="button" class="home-hero__book" @click="choose">
            {{ active.action }} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <button v-else class="home-hero__image-link" type="button" @click="choose">{{ active.alt }}</button>

      <div class="home-hero__controls">
        <button
          v-for="(banner, index) in banners"
          :key="banner.key"
          type="button"
          :aria-label="banner.eyebrow || banner.alt || banner.title"
          :aria-current="activeIndex === index ? 'true' : undefined"
          @click="selectSlide(index)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import cleaningImage from '@/assets/images/client/home-hero-cleaning.webp'
import acImage from '@/assets/images/client/home-hero-ac.webp'
import appImage from '@/assets/images/client/home-hero-app.webp'
import { trackPromotion, type PromotionCard } from '@/modules/client/api/promotion'
import {
  openPromotion,
  openSitePath,
  promotionDevice,
  promotionImage,
  promotionText,
  rememberImpression,
  useWebsitePromotion,
} from '@/modules/client/utils/website-promotion'

type Slide = {
  key: string
  topic?: 'cleaning' | 'ac' | 'app'
  image: string
  alt: string
  imageOnly: boolean
  eyebrow: string
  title: string
  accent: string
  description: string
  offer: string
  action: string
  card?: PromotionCard
}

defineProps<{ compact?: boolean }>()
const emit = defineEmits<{
  select: [topic: 'cleaning' | 'ac' | 'app']
}>()
const { t, locale } = useI18n()
const router = useRouter()
const { home } = useWebsitePromotion(() => 'home')
const fallbackSlides = computed<Slide[]>(() => [
  ['cleaning', cleaningImage],
  ['ac', acImage],
  ['app', appImage],
].map(([key, image]) => ({
  key,
  topic: key as Slide['topic'],
  image,
  alt: t(`client.home.banners.${key}.label`),
  imageOnly: false,
  eyebrow: t(`client.home.banners.${key}.label`),
  title: t(`client.home.banners.${key}.title`),
  accent: t(`client.home.banners.${key}.accent`),
  description: t(`client.home.banners.${key}.description`),
  offer: t(`client.home.banners.${key}.offer`),
  action: t(`client.home.banners.${key}.action`),
})))
const banners = computed<Slide[]>(() => {
  const remote = home.value.banners
  if (!remote.length) return fallbackSlides.value
  return remote.map((card, index) => ({
    key: String(card.id || index),
    image: promotionImage(card, locale.value, promotionDevice()) || cleaningImage,
    alt: promotionText(card.altI18n, promotionText(card.titleI18n, '', locale.value), locale.value),
    imageOnly: Number(card.cardStyle) === 2,
    eyebrow: promotionText(card.eyebrowI18n, '', locale.value),
    title: promotionText(card.titleI18n, card.title || '', locale.value),
    accent: promotionText(card.titleLine2I18n, '', locale.value),
    description: promotionText(card.subtitleI18n, '', locale.value),
    offer: promotionText(card.badgeI18n, '', locale.value),
    action: promotionText(card.buttonI18n, t('client.home.banners.cleaning.action'), locale.value),
    card,
  }))
})
const rotationDelay = computed(() => Math.max(3, Number(home.value.bannerAutoplaySeconds || 6)) * 1000)
const carousel = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const active = computed(() => banners.value[activeIndex.value] || banners.value[0]!)
let rotationTimer: ReturnType<typeof setTimeout> | undefined
let motionPreference: MediaQueryList | undefined
let swipeStart: { x: number; y: number; pointerId: number } | null = null

function startSwipe(event: PointerEvent) {
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('button, a, input, textarea, select')) return
  swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
}

function cancelSwipe() {
  swipeStart = null
}

function finishSwipe(event: PointerEvent) {
  if (!swipeStart || swipeStart.pointerId !== event.pointerId) return
  const dx = event.clientX - swipeStart.x
  const dy = event.clientY - swipeStart.y
  swipeStart = null
  if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return
  const next = dx < 0
    ? (activeIndex.value + 1) % banners.value.length
    : (activeIndex.value - 1 + banners.value.length) % banners.value.length
  selectSlide(next)
}

function canRotate() {
  return carousel.value && !motionPreference?.matches && !carousel.value.querySelector(':focus-visible')
}

function scheduleRotation() {
  clearTimeout(rotationTimer)
  if (!canRotate()) return

  rotationTimer = setTimeout(() => {
    if (!canRotate()) return
    activeIndex.value = (activeIndex.value + 1) % banners.value.length
    scheduleRotation()
  }, rotationDelay.value)
}

function selectSlide(index: number) {
  activeIndex.value = index
  scheduleRotation()
}

function handleFocusChange() {
  void nextTick(scheduleRotation)
}

function choose() {
  if (active.value.card) {
    void openPromotion(active.value.card, router, promotionDevice() === 'mobile', home.value.limitedTimeDeals)
    return
  }
  if (active.value.topic) emit('select', active.value.topic)
}

async function openAddress(url: string) {
  const id = Number(active.value.card?.id || 0)
  if (id) void trackPromotion(id, 2)
  await openSitePath(router, promotionDevice() === 'mobile', url)
}

function openImage() {
  const imageLink = String(active.value.card?.imageLink || '').trim()
  if (imageLink) {
    void openAddress(imageLink)
    return
  }
  choose()
}

watch(active, (slide) => rememberImpression(slide.card?.id), { immediate: true })
watch(banners, () => {
  if (activeIndex.value >= banners.value.length) activeIndex.value = 0
})

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', scheduleRotation)
  scheduleRotation()
})

onUnmounted(() => {
  motionPreference?.removeEventListener('change', scheduleRotation)
  clearTimeout(rotationTimer)
})
</script>

<style scoped>
.home-hero {
  --hero-navy: #091a30;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--hero-navy);
  color: #fff;
  touch-action: pan-y;
}

.home-hero__media {
  position: absolute;
  inset: 0 0 0 auto;
  z-index: -1;
  width: min(56%, 64rem);
  overflow: hidden;
}

.home-hero__photo-link {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 4.5rem;
  z-index: 1;
  width: min(42%, 36rem);
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.home-hero__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--hero-navy), rgb(9 26 48 / 72%) 13%, rgb(9 26 48 / 13%) 37%, transparent 53%);
}

.home-hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 37%;
  opacity: 0;
  transition: opacity 420ms ease;
}

.home-hero__image.is-active {
  opacity: 1;
}

.home-hero.is-image-only .home-hero__media {
  inset: 0;
  width: 100%;
}

.home-hero.is-image-only .home-hero__media::after {
  background: linear-gradient(90deg, rgb(9 26 48 / 28%), transparent 42%);
}

.home-hero.is-image-only {
  min-height: 0;
  aspect-ratio: 1920 / 600;
}

.home-hero.is-image-only .home-hero__image {
  object-fit: contain;
  object-position: center;
  background: #06182f;
}

.home-hero__image-link {
  position: absolute;
  inset: 0;
  border: 0;
  background: transparent;
  color: transparent;
  cursor: pointer;
}

.home-hero__image--ac {
  object-position: center 15%;
}

.home-hero__inner {
  position: relative;
  display: grid;
  align-content: center;
  box-sizing: border-box;
  width: min(1200px, calc(100% - 48px));
  min-height: clamp(27.5rem, 38vw, 32rem);
  margin-inline: auto;
  padding-block: 3rem 5rem;
  pointer-events: none;
}

.home-hero__copy,
.home-hero__controls,
.home-hero__image-link {
  pointer-events: auto;
}

.home-hero__copy {
  width: min(50%, 34rem);
}

.home-hero__copy p,
.home-hero__copy h1 {
  margin: 0;
}

.home-hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--hourx-client-accent);
  font-size: var(--hourx-client-size-label);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.home-hero__eyebrow::before {
  content: '';
  width: 1.5rem;
  height: 1px;
  background: currentColor;
  flex-shrink: 0;
}

.home-hero__copy h1 {
  margin-block: 0.875rem 0.875rem;
  font-family: var(--hourx-client-heading-font);
  font-size: clamp(2.25rem, 1.8rem + 1.15vw, 2.875rem);
  font-weight: 700;
  line-height: 1.09;
  letter-spacing: -0.035em;
}

.home-hero__copy h1 span,
.home-hero__copy h1 em {
  display: block;
}

.home-hero__copy h1 em {
  color: var(--hourx-client-accent);
  font-style: normal;
}

.home-hero__description {
  color: var(--hourx-client-on-dark);
  font-size: var(--hourx-client-size-body);
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: stretch;
  margin-top: 1.5rem;
}

.home-hero__offer {
  display: grid;
  align-content: center;
  gap: 0.125rem;
  min-height: 3rem;
  box-sizing: border-box;
  padding: 0.375rem 0.75rem;
  border: 1px solid rgb(184 154 114 / 45%);
  border-radius: 8px;
  background: rgb(255 255 255 / 3%);
}

.home-hero__offer strong {
  color: var(--hourx-client-accent);
  font-size: var(--hourx-client-size-action);
  line-height: 1.28;
}

.home-hero__offer small {
  color: var(--hourx-client-on-dark);
  font-size: var(--hourx-client-size-label);
  line-height: 1.3;
}

.home-hero__book {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 3rem;
  padding: 0.625rem 0.9375rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--hourx-client-canvas);
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  line-height: 1.32;
  text-align: left;
  cursor: pointer;
}

.home-hero__book:hover {
  background: #ece1cf;
}

.home-hero__controls {
  position: absolute;
  bottom: 1.125rem;
  left: -0.625rem;
  display: flex;
  align-items: center;
}

.home-hero__controls button {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
}

.home-hero__controls button::before {
  content: '';
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 999px;
  background: #829099;
}

.home-hero__controls [aria-current]::before {
  width: 1.5rem;
  background: var(--hourx-client-accent);
}

.home-hero__book:focus-visible,
.home-hero__controls button:focus-visible {
  outline: 2px solid var(--hourx-client-accent);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .home-hero__media {
    position: relative;
    z-index: 0;
    width: 100%;
    height: clamp(12.5rem, 58vw, 20rem);
    cursor: pointer;
  }

  .home-hero.is-image-only {
    aspect-ratio: 750 / 900;
  }

  .home-hero.is-image-only .home-hero__media {
    height: auto;
    aspect-ratio: 750 / 900;
  }

  .home-hero__photo-link {
    display: none;
  }

  .home-hero__media::after {
    background: linear-gradient(180deg, transparent 66%, var(--hero-navy));
  }

  .home-hero__inner {
    width: calc(100% - 36px);
    min-height: 0;
    margin-top: -0.625rem;
    padding-block: 0 0.5rem;
  }

  .home-hero__copy {
    width: 100%;
  }

  .home-hero__copy h1 {
    margin-block: 0.375rem 0.5rem;
    font-size: clamp(1.375rem, 5.6vw, 1.75rem);
    line-height: 1.12;
    letter-spacing: -0.027em;
  }

  .home-hero__description {
    font-size: var(--hourx-client-size-action);
  }

  .home-hero__actions {
    margin-top: 1rem;
    align-items: flex-start;
  }

  .home-hero__controls {
    position: static;
    margin-top: 0.5rem;
    margin-left: -0.625rem;
  }
}

.home-hero--compact .home-hero__copy h1 {
  font-size: clamp(1.1875rem, 4.9vw, 1.5rem);
  line-height: 1.16;
  overflow-wrap: anywhere;
}

@media (max-width: 26rem) {
  .home-hero__actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__image {
    transition: none;
  }
}
</style>
