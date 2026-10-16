<template>
  <section
    v-if="mode === 'page' || groups.length"
    class="packages"
    :class="{ 'packages--page': mode === 'page' }"
    aria-labelledby="packages-title"
  >
    <div class="packages__inner">
      <header class="packages__head">
        <div class="packages__head-copy">
          <p class="packages__eyebrow">
            <span aria-hidden="true"></span>
            {{ t('client.home.packages.eyebrow') }}
          </p>
          <h2 id="packages-title">{{ t('client.home.packages.title') }}</h2>
          <p>{{ t('client.home.packages.subtitle') }}</p>
        </div>
        <RouterLink v-if="mode === 'home' && groups.length" class="packages__all" :to="{ name: 'packages' }">
          <span>{{ t('client.home.packages.viewAll') }}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="M4.5 10h10m-4-4 4 4-4 4" />
          </svg>
        </RouterLink>
      </header>

      <p v-if="loaded && !groups.length" class="packages__empty">
        {{ t('client.home.packages.emptyCatalog') }}
      </p>

      <div v-if="groups.length" class="packages__catalog">
        <div class="packages__filter-head">
          <p>{{ t('client.home.packages.browseBy') }}</p>
          <div class="packages__filter-side">
            <span v-if="activeGroup">
              {{ t('client.home.packages.showing', { count: activeGroup.cards.length }) }}
            </span>
            <div v-if="activeGroup && activeGroup.cards.length > 3" class="packages__nav">
              <button
                type="button"
                :aria-label="t('client.home.packages.previousPackage')"
                @click="scrollPackages(-1)"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20">
                  <path d="M15.5 10h-10m4-4-4 4 4 4" />
                </svg>
              </button>
              <button
                type="button"
                :aria-label="t('client.home.packages.nextPackage')"
                @click="scrollPackages(1)"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20">
                  <path d="M4.5 10h10m-4-4 4 4-4 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="packages__tabs" role="tablist" :aria-label="t('client.home.packages.browseBy')">
          <button
            v-for="(group, index) in groups"
            :id="`package-tab-${group.id}`"
            :key="group.id"
            type="button"
            role="tab"
            :aria-controls="`package-panel-${group.id}`"
            :aria-selected="group.id === activeId"
            :tabindex="group.id === activeId ? 0 : -1"
            :class="{ 'is-on': group.id === activeId }"
            @click="activeId = group.id"
            @keydown.left.prevent="activateSibling(index, -1, $event)"
            @keydown.right.prevent="activateSibling(index, 1, $event)"
          >
            <span>{{ group.name }}</span>
            <small>{{ group.cards.length }}</small>
          </button>
        </div>

        <p v-if="activeGroup && !activeGroup.cards.length" class="packages__empty">
          {{ t('client.home.packages.emptyCategory') }}
        </p>

        <div
          v-if="activeGroup"
          ref="gridRef"
          :id="`package-panel-${activeGroup.id}`"
          class="packages__grid"
          :class="{
            'is-single': activeGroup.cards.length === 1,
            'is-double': activeGroup.cards.length === 2,
            'is-scrollable': activeGroup.cards.length > 3,
          }"
          role="tabpanel"
          :aria-labelledby="`package-tab-${activeGroup.id}`"
        >
          <RouterLink
            v-for="card in activeGroup.cards"
            :key="card.id"
            class="package-card"
            :to="{ name: 'package-detail', params: { id: card.id } }"
          >
            <div class="package-card__media" :class="{ 'is-empty': !card.image }">
              <img v-if="card.image" :src="card.image" alt="" />
              <span v-else class="package-card__mark" aria-hidden="true">{{ card.mark }}</span>
              <span class="package-card__badge" :class="card.badgeTone">{{ card.badge }}</span>
              <span v-if="card.discount" class="package-card__discount">{{ card.discount }}</span>
              <span v-if="card.visits" class="package-card__visits">{{ card.visits }}</span>
            </div>
            <div class="package-card__body">
              <div class="package-card__copy">
                <h3>{{ card.title }}</h3>
                <p v-if="card.desc">{{ card.desc }}</p>
              </div>
              <div v-if="card.perVisit || card.save" class="package-card__meta">
                <span v-if="card.perVisit">{{ card.perVisit }}</span>
                <span v-if="card.save" class="is-save">{{ card.save }}</span>
              </div>
              <div class="package-card__foot">
                <div class="package-card__price">
                  <span class="package-card__price-label">{{ t('client.home.packages.dealPrice') }}</span>
                  <div>
                    <small>AED</small>
                    <strong>{{ card.sale }}</strong>
                  </div>
                  <div v-if="card.original" class="package-card__original">
                    <span>{{ t('client.home.packages.originalPrice') }}</span>
                    <s>AED {{ card.original }}</s>
                  </div>
                </div>
                <span class="package-card__action">
                  <span>{{ t('client.home.packages.viewPackage') }}</span>
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="M4.5 10h10m-4-4 4 4-4 4" />
                  </svg>
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  packageCatalog,
  type PackageCatalogCard,
  type PackageCatalogCategory,
} from '@/modules/client/api'

withDefaults(defineProps<{ mode?: 'home' | 'page' }>(), { mode: 'home' })

const { t, locale } = useI18n({ useScope: 'global' })
const categories = ref<PackageCatalogCategory[]>([])
const activeId = ref('')
const loaded = ref(false)
const gridRef = ref<HTMLElement | null>(null)

const preferredLangs = () =>
  locale.value === 'zh' ? ['zh-CN', 'zh', 'en', 'en-US'] : ['en', 'en-US', 'zh-CN', 'zh']

const pickText = (i18n?: Record<string, string>, fallback = '') => {
  const map = i18n || {}
  for (const lang of preferredLangs()) {
    const value = map[lang]
    if (typeof value === 'string' && value.trim()) return plainText(value)
  }
  const first = Object.values(map).find((value) => typeof value === 'string' && value.trim())
  return typeof first === 'string' ? plainText(first) : fallback
}

const plainText = (value: string) => {
  let text = String(value || '').trim()
  if (!text) return ''
  if (typeof DOMParser !== 'undefined') {
    const readable = text.replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6])\s*>/gi, ' ')
    text = new DOMParser().parseFromString(readable, 'text/html').body.textContent || text
  }
  return text.replace(/<\/?[a-z][^>]*>/gi, ' ').replace(/\s+/g, ' ').trim()
}

const amount = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const money = (value: number) =>
  new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)

type CardView = {
  id: string
  title: string
  mark: string
  desc: string
  sale: string
  original: string
  discount: string
  visits: string
  perVisit: string
  save: string
  badge: string
  badgeTone: string
  image: string
}

const groups = computed(() =>
  categories.value
    .map((category) => {
      const id = String(category.categoryId ?? '')
      const name = pickText(category.nameI18n, category.categoryName || '')
      const packages = Array.isArray(category.packages) ? category.packages : []
      const savings = packages.map((item) => Math.max(0, amount(item.savedAmount) || 0))
      const bestSaving = Math.max(0, ...savings)
      const cards = packages
        .map((item, index) => toCard(item, name, index, bestSaving))
        .filter((item): item is CardView => Boolean(item))
      return { id, name, cards }
    })
    .filter((group) => group.id && group.name && group.cards.length),
)

const toCard = (item: PackageCatalogCard, categoryName: string, index: number, bestSaving: number): CardView | null => {
  const id = String(item.id ?? '')
  const sale = amount(item.salePrice)
  if (!id || sale == null) return null
  const original = amount(item.originalPrice)
  const saved = Math.max(0, amount(item.savedAmount) ?? (original != null ? original - sale : 0))
  const discount = original != null && original > sale
    ? Math.round(((original - sale) / original) * 100)
    : 0
  const visits = Number(item.redeemTimes || 0)
  const name = pickText(item.nameI18n, item.packageName || '')
  const isBest = saved > 0 && saved === bestSaving
  const tones = ['is-mint', 'is-sand', 'is-sky']
  return {
    id,
    title: name,
    mark: Array.from(name)[0] || 'H',
    desc: pickText(item.descI18n, item.packageDesc || ''),
    sale: money(sale),
    original: original != null && original > sale ? money(original) : '',
    discount: discount > 0 ? t('client.home.packages.off', { percent: discount }) : '',
    visits: visits > 0 ? t('client.home.packages.visits', { count: visits }) : '',
    perVisit: visits > 1 ? t('client.home.packages.perVisit', { price: money(sale / visits) }) : '',
    save: saved > 0 ? t('client.home.packages.save', { price: money(saved) }) : '',
    badge: isBest ? t('client.home.packages.bestValue') : categoryName,
    badgeTone: isBest ? 'is-best' : tones[index % tones.length],
    image: item.imageUrls?.find((url) => String(url || '').trim()) || '',
  }
}

const activeGroup = computed(() => groups.value.find((group) => group.id === activeId.value) || groups.value[0])

const activateSibling = (index: number, direction: number, event: KeyboardEvent) => {
  const nextIndex = (index + direction + groups.value.length) % groups.value.length
  const next = groups.value[nextIndex]
  if (!next) return
  activeId.value = next.id
  const tabs = (event.currentTarget as HTMLElement | null)?.parentElement
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  tabs?.[nextIndex]?.focus()
}

const scrollPackages = (direction: number) => {
  const grid = gridRef.value
  if (!grid) return
  grid.scrollBy({
    left: direction * Math.max(grid.clientWidth * 0.9, 280),
    behavior: 'smooth',
  })
}

watch(groups, (list) => {
  if (!list.some((group) => group.id === activeId.value)) {
    activeId.value = list[0]?.id || ''
  }
})

watch(activeId, () => {
  gridRef.value?.scrollTo({ left: 0, behavior: 'auto' })
})

onMounted(async () => {
  try {
    categories.value = await packageCatalog()
  } catch (error) {
    console.error('load package catalog failed:', error)
    categories.value = []
  } finally {
    loaded.value = true
  }
})
</script>

<style scoped lang="scss">
.packages {
  padding: 96px 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 4%, rgba(75, 220, 197, 0.13), transparent 25%),
    linear-gradient(180deg, #f3f7f8 0%, #edf2f4 100%);
  font-family: "Inter", "Noto Sans SC", "PingFang SC", sans-serif;
}

.packages--page {
  min-height: 68vh;
  padding: 48px 0 96px;
}

.packages__inner {
  position: relative;
  isolation: isolate;
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
  padding: 56px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 40px;
  background:
    radial-gradient(760px 360px at 90% -20%, rgba(69, 225, 201, 0.22), transparent 66%),
    radial-gradient(500px 320px at -8% 106%, rgba(58, 164, 187, 0.14), transparent 68%),
    linear-gradient(145deg, #0a203a 0%, #05152b 58%, #061a30 100%);
  box-sizing: border-box;
  box-shadow:
    0 30px 80px rgba(5, 21, 43, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.packages__inner::after {
  position: absolute;
  z-index: -1;
  top: -164px;
  right: -120px;
  width: 420px;
  height: 420px;
  border: 1px solid rgba(100, 235, 214, 0.12);
  border-radius: 50%;
  box-shadow:
    0 0 0 56px rgba(100, 235, 214, 0.025),
    0 0 0 112px rgba(100, 235, 214, 0.018);
  content: "";
  pointer-events: none;
}

.packages__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
}

.packages__head-copy {
  max-width: 720px;
}

.packages__eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px !important;
  color: #66ead5 !important;
  font-size: 12px !important;
  font-weight: 850;
  letter-spacing: 0.16em;
  line-height: 1.4 !important;
  text-transform: uppercase;
}

.packages__eyebrow span {
  width: 28px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.packages__head h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(36px, 4vw, 54px);
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.02;
}

.packages__head-copy > p:last-child {
  max-width: 610px;
  margin: 18px 0 0;
  color: rgba(229, 238, 247, 0.7);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.65;
}

.packages__all {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 52px;
  padding: 0 10px 0 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: #68ecd7;
  color: #05152b;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.packages__all:hover {
  transform: translateY(-2px);
  background: #88f3e1;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.25);
}

.packages__all:focus-visible {
  outline: 3px solid rgba(104, 236, 215, 0.35);
  outline-offset: 4px;
}

.packages__all svg,
.package-card__action svg {
  width: 34px;
  height: 34px;
  padding: 8px;
  border-radius: 50%;
  box-sizing: border-box;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.packages__all svg {
  background: rgba(5, 21, 43, 0.1);
}

.packages__catalog {
  position: relative;
  z-index: 1;
  margin-top: 42px;
  padding-top: 26px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.packages__filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 14px;
}

.packages__filter-head p,
.packages__filter-side > span {
  margin: 0;
  color: rgba(225, 235, 244, 0.64);
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.1em;
  line-height: 1.4;
  text-transform: uppercase;
}

.packages__filter-side {
  display: flex;
  align-items: center;
  gap: 12px;
}

.packages__filter-side > span {
  color: rgba(225, 235, 244, 0.48);
  font-weight: 650;
  letter-spacing: 0.04em;
}

.packages__nav {
  display: flex;
  gap: 6px;
}

.packages__nav button {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
}

.packages__nav button:hover {
  transform: translateY(-1px);
  border-color: #68ecd7;
  background: rgba(104, 236, 215, 0.14);
}

.packages__nav button:focus-visible {
  outline: 2px solid #68ecd7;
  outline-offset: 2px;
}

.packages__nav svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.packages__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.packages__tabs button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 8px 0 17px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.055);
  color: rgba(239, 245, 250, 0.7);
  font: inherit;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  transition:
    color 180ms ease,
    background 180ms ease,
    border-color 180ms ease;
}

.packages__tabs button:hover {
  border-color: rgba(104, 236, 215, 0.35);
  color: #fff;
}

.packages__tabs button:focus-visible {
  outline: 2px solid #68ecd7;
  outline-offset: 3px;
}

.packages__tabs button small {
  display: grid;
  min-width: 28px;
  height: 28px;
  padding: 0 7px;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.72);
  box-sizing: border-box;
  font-size: 11px;
  font-weight: 850;
}

.packages__tabs button.is-on {
  border-color: #fff;
  background: #fff;
  color: #071b32;
}

.packages__tabs button.is-on small {
  background: #dffbf6;
  color: #0a6c62;
}

.packages__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
  align-items: stretch;
}

.packages__grid.is-scrollable {
  grid-template-columns: none;
  grid-auto-columns: calc((100% - 36px) / 3);
  grid-auto-flow: column;
  margin-top: 16px;
  padding: 8px 0 12px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-padding-inline: 0;
  scroll-snap-type: x mandatory;
  scrollbar-color: rgba(104, 236, 215, 0.55) rgba(255, 255, 255, 0.08);
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.packages__grid.is-scrollable .package-card {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.packages__grid.is-single {
  grid-template-columns: minmax(0, calc((100% - 36px) / 3));
  justify-content: start;
}

.packages__grid.is-double {
  grid-template-columns: repeat(2, minmax(0, calc((100% - 36px) / 3)));
  justify-content: start;
}

.package-card {
  display: flex;
  height: 540px;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 22px;
  background: #fdfefe;
  color: inherit;
  text-decoration: none;
  box-shadow: 0 12px 30px rgba(0, 7, 18, 0.18);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.package-card:hover {
  transform: translateY(-7px);
  border-color: rgba(104, 236, 215, 0.62);
  box-shadow: 0 22px 46px rgba(0, 7, 18, 0.28);
}

.package-card:focus-visible {
  outline: 3px solid #68ecd7;
  outline-offset: 4px;
}

.package-card__media {
  position: relative;
  flex: 0 0 232px;
  height: 232px;
  overflow: hidden;
  background:
    radial-gradient(180px 120px at 20% 18%, rgba(104, 236, 215, 0.2), transparent 70%),
    linear-gradient(145deg, #173a55 0%, #0a203a 52%, #07162a 100%);
}

.package-card__media img,
.package-card__mark {
  width: 100%;
  height: 100%;
  transition: transform 0.45s ease;
}

.package-card__media img {
  display: block;
  object-fit: cover;
}

.package-card:hover .package-card__media img,
.package-card:hover .package-card__mark {
  transform: scale(1.045);
}

.package-card__media::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(5, 21, 43, 0.03) 34%, rgba(5, 21, 43, 0.7) 100%),
    linear-gradient(110deg, rgba(5, 21, 43, 0.18), transparent 46%);
  pointer-events: none;
}

.package-card__mark {
  display: grid;
  place-items: center;
  color: rgba(222, 252, 246, 0.9);
  font-size: clamp(64px, 7vw, 84px);
  font-weight: 300;
  letter-spacing: -0.06em;
  text-shadow: 0 10px 32px rgba(0, 0, 0, 0.2);
}

.package-card__badge,
.package-card__discount,
.package-card__visits {
  position: absolute;
  z-index: 1;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-card__discount {
  top: 16px;
  right: 16px;
  min-width: 54px;
  height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  background: #fff3cf;
  color: #805300;
  box-sizing: border-box;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.035em;
  line-height: 30px;
  text-align: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}

.package-card__badge {
  top: 16px;
  left: 16px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(5, 21, 43, 0.74);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.035em;
  line-height: 30px;
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}

.package-card__badge.is-best {
  border-color: transparent;
  background: #68ecd7;
  color: #05152b;
}

.package-card__badge.is-sand {
  color: #ffe1ac;
}

.package-card__badge.is-sky {
  color: #bfe4ff;
}

.package-card__visits {
  right: 16px;
  bottom: 14px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(5, 21, 43, 0.7);
  color: #fff;
  font-size: 11.5px;
  font-weight: 750;
  line-height: 30px;
  backdrop-filter: blur(12px);
}

.package-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 20px;
}

.package-card__copy {
  flex: 0 0 104px;
  height: 104px;
  overflow: hidden;
}

.package-card h3 {
  display: -webkit-box;
  max-height: 54px;
  margin: 0;
  overflow: hidden;
  color: #071b32;
  font-size: 21px;
  font-weight: 820;
  letter-spacing: -0.028em;
  line-height: 1.28;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.package-card__copy > p {
  display: -webkit-box;
  height: 40px;
  margin: 9px 0 0;
  overflow: hidden;
  color: #66758a;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.55;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.package-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  min-height: 28px;
  margin-top: 14px;
  color: #536174;
  font-size: 11.5px;
  line-height: 1.4;
}

.package-card__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef3f6;
}

.package-card__meta .is-save {
  border: 1px solid #a8eddf;
  background: #d7f8f1;
  color: #06695f;
  font-weight: 900;
}

.package-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 18px;
}

.package-card__price {
  min-width: 0;
}

.package-card__price-label {
  display: block;
  margin-bottom: 5px;
  color: #087568;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
}

.package-card__price > div {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.package-card__price strong {
  color: #071b32;
  font-size: 31px;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.05em;
  line-height: 1;
}

.package-card__price small {
  color: #526277;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.package-card__original {
  width: fit-content;
  margin-top: 8px;
  padding: 5px 8px;
  border: 1px solid #e4e9ef;
  border-radius: 7px;
  background: #f4f6f8;
  color: #6f7c8d;
  font-size: 10px;
  font-weight: 800;
}

.package-card__original span {
  letter-spacing: 0.03em;
}

.package-card__original s {
  color: #8c3f49;
  font-size: 12px;
  font-weight: 850;
  text-decoration-thickness: 1.5px;
}

.package-card__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #071b32;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.package-card__action svg {
  flex: 0 0 auto;
  background: #071b32;
  color: #fff;
  transition: transform 0.28s ease;
}

.package-card:hover .package-card__action svg {
  transform: translateX(3px);
}

.packages__empty {
  position: relative;
  z-index: 1;
  margin: 30px 0 0;
  padding: 20px 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
  color: rgba(229, 238, 247, 0.72);
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1100px) {
  .packages__inner {
    padding: 48px 32px;
  }

  .packages__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .packages__grid.is-scrollable {
    grid-template-columns: none;
    grid-auto-columns: calc((100% - 28px) / 3);
  }

  .packages__grid.is-single {
    grid-template-columns: minmax(0, calc((100% - 28px) / 3));
  }

  .packages__grid.is-double {
    grid-template-columns: repeat(2, minmax(0, calc((100% - 28px) / 3)));
  }

  .package-card {
    height: 520px;
  }

  .package-card__media {
    flex-basis: 210px;
    height: 210px;
  }

  .package-card__body {
    padding: 16px;
  }

  .package-card__foot {
    gap: 8px;
  }

  .package-card__price strong {
    font-size: 28px;
  }

  .package-card__action > span {
    display: none;
  }
}

@media (max-width: 760px) {
  .packages {
    padding: 56px 0 64px;
  }

  .packages__inner {
    width: calc(100% - 24px);
    padding: 36px 18px 22px;
    border-radius: 28px;
  }

  .packages__head {
    align-items: flex-start;
    flex-direction: column;
    gap: 24px;
  }

  .packages__head h2 {
    font-size: clamp(34px, 11vw, 44px);
  }

  .packages__head-copy > p:last-child {
    margin-top: 14px;
    font-size: 15px;
  }

  .packages__all {
    width: 100%;
    min-height: 50px;
    box-sizing: border-box;
  }

  .packages__catalog {
    margin-top: 32px;
    padding-top: 22px;
  }

  .packages__filter-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .packages__filter-side {
    width: 100%;
    justify-content: space-between;
  }

  .packages__tabs {
    width: calc(100% + 36px);
    margin-inline: -18px;
    padding: 3px 18px 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .packages__tabs::-webkit-scrollbar {
    display: none;
  }

  .packages__tabs button {
    flex: 0 0 auto;
  }

  .packages__grid {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 18px;
  }

  .packages__grid.is-scrollable {
    grid-template-columns: none;
    grid-auto-columns: 100%;
  }

  .packages__grid.is-single,
  .packages__grid.is-double {
    grid-template-columns: 1fr;
  }

  .package-card__media {
    flex-basis: 200px;
    height: 200px;
  }

  .package-card {
    height: 520px;
  }

  .package-card__action > span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .packages__all,
  .package-card,
  .package-card__media img,
  .package-card__mark,
  .package-card__action svg {
    transition: none;
  }
}
</style>
