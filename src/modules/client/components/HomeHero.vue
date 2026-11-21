<template>
  <section
    ref="carousel"
    class="home-hero"
    aria-roledescription="carousel"
    :aria-label="t('client.home.hero.headline')"
    @focusin="handleFocusChange"
    @focusout="handleFocusChange"
    @pointerdown="startSwipe"
    @pointerup="finishSwipe"
    @pointercancel="cancelSwipe"
  >
    <div class="home-hero__media">
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
        alt=""
        width="1536"
        height="1024"
      />
    </div>

    <div class="home-hero__inner">
      <div class="home-hero__copy">
        <p class="home-hero__eyebrow">{{ t(slideKey + '.label') }}</p>
        <h1>
          <span>{{ t(slideKey + '.title') }}</span>
          <em>{{ t(slideKey + '.accent') }}</em>
        </h1>
        <p class="home-hero__description">{{ t(slideKey + '.description') }}</p>

        <div class="home-hero__actions">
          <div class="home-hero__offer">
            <strong>{{ t(slideKey + '.offer') }}</strong>
            <small>{{ t(slideKey + '.terms') }}</small>
          </div>
          <button type="button" class="home-hero__book" @click="emit('select', active.key)">
            {{ t(slideKey + '.action') }} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div class="home-hero__controls">
        <button
          v-for="(banner, index) in banners"
          :key="banner.key"
          type="button"
          :aria-label="t('client.home.banners.' + banner.key + '.label')"
          :aria-current="activeIndex === index ? 'true' : undefined"
          @click="selectSlide(index)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import cleaningImage from '@/assets/images/client/home-hero-cleaning.webp'
import acImage from '@/assets/images/client/home-hero-ac.webp'
import appImage from '@/assets/images/client/home-hero-app.webp'

const emit = defineEmits<{
  select: [topic: 'cleaning' | 'ac' | 'app']
}>()
const { t } = useI18n()
const banners = [
  { key: 'cleaning', image: cleaningImage },
  { key: 'ac', image: acImage },
  { key: 'app', image: appImage },
] as const
const rotationDelay = 6000
const carousel = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const active = computed(() => banners[activeIndex.value]!)
const slideKey = computed(() => 'client.home.banners.' + active.value.key)
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
    ? (activeIndex.value + 1) % banners.length
    : (activeIndex.value - 1 + banners.length) % banners.length
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
    activeIndex.value = (activeIndex.value + 1) % banners.length
    scheduleRotation()
  }, rotationDelay)
}

function selectSlide(index: number) {
  activeIndex.value = index
  scheduleRotation()
}

function handleFocusChange() {
  void nextTick(scheduleRotation)
}

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
    width: 100%;
    height: clamp(12.5rem, 58vw, 20rem);
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
    margin-block: 0.625rem 0.625rem;
    font-size: clamp(1.75rem, 7.7vw, 2rem);
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
