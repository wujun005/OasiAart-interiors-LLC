<template>
  <section
    v-if="mode === 'page' || groups.length"
    class="packages"
    :class="{ 'packages--page': mode === 'page', 'packages--compact': platform === 'h5' }"
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
        <RouterLink
          v-if="mode === 'home' && groups.length"
          class="packages__all"
          :to="{ name: platform === 'h5' ? 'h5-packages' : 'packages' }"
          :aria-label="t('client.home.packages.viewAll')"
        >
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
        <div class="packages__toolbar">
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
            :to="{ name: platform === 'h5' ? 'h5-package-detail' : 'package-detail', params: { id: card.id } }"
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
                <div v-if="card.tags.length" class="biz-tags">
                  <span v-for="tag in card.tags" :key="tag">{{ tag }}</span>
                </div>
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
import { bizTagLabels } from '@/modules/client/utils/biz-tag'

withDefaults(defineProps<{ mode?: 'home' | 'page'; platform?: 'client' | 'h5' }>(), {
  mode: 'home',
  platform: 'client',
})

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
  tags: string[]
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
    tags: bizTagLabels(item.tags, locale.value),
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
.biz-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.biz-tags span { padding: 2px 8px; border-radius: 999px; background: #f6f1e7; color: #6d5428; font-size: 12px; font-weight: 700; line-height: 1.5; }

.packages {
  --package-navy: #05152b;
  --package-navy-soft: #102843;
  --package-mint: #63dbc7;
  --package-mint-pale: #e4f8f4;
  --package-line: #dfe6ec;
  --package-muted: #68778a;
  padding: 44px 0 48px;
  overflow: hidden;
  background: #f3f6f8;
  font-family: "Inter", "Noto Sans SC", "PingFang SC", sans-serif;
}

.packages--page {
  min-height: 68vh;
  padding: 36px 0 72px;
}

.packages__inner {
  width: min(1200px, calc(100% - 48px));
  margin: 0 auto;
  padding: 26px 28px 30px;
  border: 1px solid #e1e7ec;
  border-radius: 24px;
  background: #fff;
  box-sizing: border-box;
  box-shadow: 0 14px 40px rgba(5, 21, 43, 0.07);
}

.packages__inner::after {
  display: none;
}

.packages__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
}

.packages__head-copy {
  min-width: 0;
  max-width: 720px;
}

.packages__eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 7px !important;
  color: #247f72 !important;
  font-size: 10px !important;
  font-weight: 850;
  letter-spacing: 0.14em;
  line-height: 1.35 !important;
  text-transform: uppercase;
}

.packages__eyebrow span {
  width: 22px;
  height: 2px;
  border-radius: 999px;
  background: var(--package-mint);
}

.packages__head h2 {
  margin: 0;
  color: var(--package-navy);
  font-size: clamp(27px, 2.6vw, 32px);
  font-weight: 850;
  letter-spacing: -0.035em;
  line-height: 1.12;
}

.packages__head-copy > p:last-child {
  max-width: 640px;
  margin: 8px 0 0;
  color: var(--package-muted);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.55;
}

.packages__all {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 6px 0 15px;
  border: 1px solid #cdd7e0;
  border-radius: 999px;
  background: #fff;
  color: var(--package-navy);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: none;
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}

.packages__all:hover {
  transform: translateY(-1px);
  border-color: var(--package-navy);
  background: #f7f9fb;
  box-shadow: none;
}

.packages__all:focus-visible,
.package-card:focus-visible {
  outline: 3px solid rgba(99, 219, 199, 0.42);
  outline-offset: 3px;
}

.packages__all svg,
.package-card__action svg {
  width: 28px;
  height: 28px;
  padding: 7px;
  border-radius: 50%;
  box-sizing: border-box;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.packages__all svg {
  background: var(--package-navy);
  color: #fff;
}

.packages__catalog {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--package-line);
}

.packages__toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.packages__tabs {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.packages__tabs::-webkit-scrollbar,
.packages__grid::-webkit-scrollbar {
  display: none;
}

.packages__tabs button {
  flex: 0 0 auto;
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 7px 0 13px;
  border: 1px solid #dce3e9;
  border-radius: 999px;
  background: #f6f8fa;
  color: #526176;
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease, border-color 180ms ease;
}

.packages__tabs button:hover {
  border-color: #a8b7c5;
  color: var(--package-navy);
}

.packages__tabs button:focus-visible,
.packages__nav button:focus-visible {
  outline: 2px solid var(--package-mint);
  outline-offset: 2px;
}

.packages__tabs button small {
  display: grid;
  min-width: 23px;
  height: 23px;
  padding: 0 6px;
  place-items: center;
  border-radius: 999px;
  background: #e7ecf0;
  color: #667589;
  box-sizing: border-box;
  font-size: 10px;
  font-weight: 850;
}

.packages__tabs button.is-on {
  border-color: var(--package-navy);
  background: var(--package-navy);
  color: #fff;
}

.packages__tabs button.is-on small {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.packages__filter-side {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.packages__filter-side > span {
  color: #7d8997;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.packages__nav {
  display: flex;
  gap: 5px;
}

.packages__nav button {
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  border: 1px solid #d5dde4;
  border-radius: 50%;
  background: #fff;
  color: var(--package-navy);
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.packages__nav button:hover {
  transform: translateY(-1px);
  border-color: var(--package-navy);
  background: #f4f7f9;
}

.packages__nav svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.packages__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
  align-items: stretch;
}

.packages__grid.is-scrollable {
  grid-template-columns: none;
  grid-auto-columns: calc((100% - 32px) / 3);
  grid-auto-flow: column;
  padding-bottom: 4px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-padding-inline: 0;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.packages__grid.is-scrollable .package-card {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.packages__grid.is-single {
  grid-template-columns: minmax(0, calc((100% - 32px) / 3));
  justify-content: start;
}

.packages__grid.is-double {
  grid-template-columns: repeat(2, minmax(0, calc((100% - 32px) / 3)));
  justify-content: start;
}

.package-card {
  display: flex;
  height: 382px;
  min-width: 0;
  box-sizing: border-box;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dce4ea;
  border-radius: 17px;
  background: #fff;
  color: inherit;
  text-decoration: none;
  box-shadow: 0 8px 22px rgba(5, 21, 43, 0.075);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.package-card:hover {
  transform: translateY(-3px);
  border-color: #bac8d3;
  box-shadow: 0 13px 28px rgba(5, 21, 43, 0.12);
}

.package-card__media {
  position: relative;
  flex: 0 0 136px;
  height: 136px;
  overflow: hidden;
  background: linear-gradient(145deg, #17334e, var(--package-navy));
}

.package-card__media img,
.package-card__mark {
  width: 100%;
  height: 100%;
  transition: transform 260ms ease;
}

.package-card__media img {
  display: block;
  object-fit: cover;
}

.package-card:hover .package-card__media img,
.package-card:hover .package-card__mark {
  transform: scale(1.025);
}

.package-card__media::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 21, 43, 0.02) 46%, rgba(5, 21, 43, 0.42) 100%);
  content: "";
  pointer-events: none;
}

.package-card__mark {
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.88);
  font-size: 54px;
  font-weight: 350;
  letter-spacing: -0.05em;
}

.package-card__badge,
.package-card__discount,
.package-card__visits {
  position: absolute;
  z-index: 1;
  max-width: calc(100% - 22px);
  overflow: hidden;
  border-radius: 999px;
  box-sizing: border-box;
  font-size: 10px;
  font-weight: 850;
  line-height: 25px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-card__badge {
  top: 10px;
  left: 10px;
  height: 25px;
  padding: 0 9px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(5, 21, 43, 0.82);
  color: #fff;
  backdrop-filter: blur(8px);
}

.package-card__badge.is-best,
.package-card__discount {
  border-color: transparent;
  background: var(--package-mint-pale);
  color: #09675c;
}

.package-card__badge.is-sand,
.package-card__badge.is-sky,
.package-card__badge.is-mint {
  color: #fff;
}

.package-card__discount {
  top: 10px;
  right: 10px;
  min-width: 48px;
  height: 25px;
  padding: 0 9px;
  box-shadow: 0 4px 12px rgba(5, 21, 43, 0.12);
}

.package-card__visits {
  right: 10px;
  bottom: 9px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(5, 21, 43, 0.72);
  color: #fff;
  line-height: 23px;
  backdrop-filter: blur(8px);
}

.package-card__body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 14px 15px 15px;
}

.package-card__copy {
  flex: 0 0 82px;
  height: 82px;
  overflow: hidden;
}

.package-card h3 {
  display: -webkit-box;
  max-height: 42px;
  margin: 0;
  overflow: hidden;
  color: var(--package-navy);
  font-size: 17px;
  font-weight: 820;
  letter-spacing: -0.02em;
  line-height: 1.24;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.package-card__copy > p {
  display: -webkit-box;
  height: 35px;
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--package-muted);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.5;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.package-card__meta {
  display: flex;
  min-height: 24px;
  flex-wrap: nowrap;
  gap: 6px;
  margin-top: 7px;
  overflow: hidden;
  color: #58677a;
  font-size: 10px;
  line-height: 1.35;
}

.package-card__meta span {
  display: inline-flex;
  min-width: 0;
  min-height: 24px;
  align-items: center;
  padding: 0 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f0f3f6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-card__meta .is-save {
  flex: 0 0 auto;
  border: 1px solid #bcebe3;
  background: var(--package-mint-pale);
  color: #09675c;
  font-weight: 850;
}

.package-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #edf1f4;
}

.package-card__price {
  min-width: 0;
}

.package-card__price-label {
  display: block;
  margin-bottom: 3px;
  color: #36766d;
  font-size: 8.5px;
  font-weight: 900;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-transform: uppercase;
}

.package-card__price > div {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.package-card__price strong {
  color: var(--package-navy);
  font-size: 27px;
  font-weight: 880;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.045em;
  line-height: 1;
}

.package-card__price small {
  color: #637286;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.package-card__original {
  width: fit-content;
  margin-top: 5px;
  padding: 3px 6px;
  border-radius: 6px;
  background: #f3f5f7;
  color: #788493;
  font-size: 10px;
  font-weight: 750;
}

.package-card__original span {
  letter-spacing: 0.02em;
}

.package-card__original s {
  color: #8c3f49;
  font-size: 12px;
  font-weight: 850;
  text-decoration-thickness: 1.3px;
}

.package-card__action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  color: var(--package-navy);
  font-size: 10.5px;
  font-weight: 800;
  white-space: nowrap;
}

.package-card__action svg {
  flex: 0 0 auto;
  background: var(--package-navy);
  color: #fff;
  transition: transform 180ms ease;
}

.package-card:hover .package-card__action svg {
  transform: translateX(2px);
}

.packages__empty {
  margin: 18px 0 0;
  padding: 16px 18px;
  border: 1px solid var(--package-line);
  border-radius: 13px;
  background: #f6f8fa;
  color: var(--package-muted);
  font-size: 13px;
  line-height: 1.55;
}

@media (max-width: 1080px) {
  .packages__inner {
    width: min(100% - 36px, 1200px);
    padding-inline: 22px;
  }

  .package-card__action > span {
    display: none;
  }
}

@media (max-width: 900px) {
  .packages {
    padding: 40px 0 44px;
  }

  .packages__grid,
  .packages__grid.is-scrollable,
  .packages__grid.is-single,
  .packages__grid.is-double {
    grid-template-columns: none;
    grid-auto-columns: calc((100% - 14px) / 2);
    grid-auto-flow: column;
    gap: 14px;
    justify-content: initial;
    padding-bottom: 4px;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .packages__grid .package-card {
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }
}

@media (max-width: 640px) {
  .packages,
  .packages--page {
    padding: 40px 0 46px;
  }

  .packages__inner {
    width: calc(100% - 20px);
    padding: 20px 14px 18px;
    border-radius: 19px;
  }

  .packages__head {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .packages__head h2 {
    font-size: 27px;
  }

  .packages__head-copy > p:last-child {
    margin-top: 6px;
    font-size: 12.5px;
  }

  .packages__all {
    min-height: 36px;
  }

  .packages__catalog {
    margin-top: 16px;
    padding-top: 13px;
  }

  .packages__toolbar {
    align-items: flex-end;
    flex-direction: column-reverse;
    gap: 8px;
  }

  .packages__tabs {
    width: calc(100% + 28px);
    margin-inline: -14px;
    padding: 0 14px 2px;
    box-sizing: border-box;
  }

  .packages__filter-side {
    width: 100%;
    justify-content: space-between;
  }

  .packages__filter-side > span {
    font-size: 9.5px;
  }

  .packages__grid,
  .packages__grid.is-scrollable,
  .packages__grid.is-single,
  .packages__grid.is-double {
    grid-auto-columns: calc((100% - 10px) / 1.1);
    gap: 10px;
    margin-top: 13px;
  }

  .package-card {
    height: 370px;
    border-radius: 15px;
  }

  .package-card__media {
    flex-basis: 128px;
    height: 128px;
  }

  .package-card__body {
    padding: 13px 14px 14px;
  }
}

.packages--compact {
  padding: 24px 0;

  .packages__inner {
    width: calc(100% - 24px);
    padding: 16px 12px;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(5, 21, 43, 0.04);
  }

  .packages__head {
    align-items: center;
    flex-direction: row;
    gap: 10px;
  }

  .packages__head h2 {
    font-size: 23px;
  }

  .packages__head-copy > p:last-child {
    font-size: 12px;
    font-weight: 400;
  }

  .packages__all {
    width: 34px;
    min-height: 34px;
    padding: 0;
  }

  .packages__all > span,
  .packages__filter-side > span {
    display: none;
  }

  .packages__catalog {
    margin-top: 14px;
    padding-top: 12px;
  }

  .packages__toolbar {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .packages__tabs {
    width: auto;
    margin: 0;
    padding: 2px 0;
  }

  .packages__tabs button {
    min-height: 32px;
    font-size: 11px;
  }

  .packages__filter-side {
    width: auto;
  }

  .package-card {
    height: 344px;
    border-radius: 13px;
  }

  .package-card__media {
    flex-basis: 104px;
    height: 104px;
  }

  .package-card__body {
    padding: 12px;
  }

  .package-card h3 {
    font-size: 16px;
  }

  .package-card__copy {
    flex-basis: 78px;
    height: 78px;
  }

  .package-card__price strong {
    font-size: 25px;
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

  .packages__grid {
    scroll-behavior: auto;
  }
}
</style>
