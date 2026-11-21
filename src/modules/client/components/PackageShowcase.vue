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
            <div v-if="hasOverflow" class="packages__nav">
              <button
                type="button"
                :aria-label="t('client.home.packages.previousPackage')"
                :disabled="!canScrollPrevious"
                @click="scrollPackages(-1)"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20">
                  <path d="M15.5 10h-10m4-4-4 4 4 4" />
                </svg>
              </button>
              <button
                type="button"
                :aria-label="t('client.home.packages.nextPackage')"
                :disabled="!canScrollNext"
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

        <div v-if="activeGroup" class="packages__carousel" :class="{ 'can-scroll-next': canScrollNext }">
          <div
            ref="gridRef"
            :id="`package-panel-${activeGroup.id}`"
            class="packages__grid"
            :class="{
              'is-single': activeGroup.cards.length === 1,
              'is-double': activeGroup.cards.length === 2,
              'is-scrollable': activeGroup.cards.length > 2,
            }"
            role="tabpanel"
            :aria-labelledby="`package-tab-${activeGroup.id}`"
            @scroll.passive="updateScrollState"
          >
            <RouterLink
              v-for="card in activeGroup.cards"
              :key="card.id"
              class="package-card"
              :to="{ name: platform === 'h5' ? 'h5-package-detail' : 'package-detail', params: { id: card.id } }"
            >
              <div class="package-card__media" :class="{ 'is-split': card.images.length === 2 }">
                <template v-if="card.images.length">
                  <img v-for="image in card.images" :key="image" :src="image" alt="" />
                </template>
                <span v-else class="package-card__mark" aria-hidden="true">{{ card.mark }}</span>
                <span v-if="card.images.length === 2" class="package-card__plus" aria-hidden="true">
                  <svg viewBox="0 0 16 16"><path d="M3 8h10M8 3v10" /></svg>
                </span>
                <div class="package-card__media-labels">
                  <span class="package-card__badge">{{
                    card.visitCount > 1 ? t('client.home.packages.multiVisitPackage') :
                    card.bundle ? t(card.visitCount === 1 ? 'client.home.packages.singleVisitBundle' : 'client.home.packages.bundle') : card.badge
                  }}</span>
                  <span v-if="card.visits" class="package-card__visits">{{
                    card.visitCount === 1 && card.bundle ? t('client.home.packages.combinedVisit') : card.visits
                  }}</span>
                </div>
              </div>
              <div class="package-card__body">
                <div class="package-card__copy">
                  <span class="package-card__eyebrow">{{ t(card.bundle ? 'client.home.packages.bundleEyebrow' : 'client.home.packages.packageEyebrow') }}</span>
                  <h3>{{ card.title }}</h3>
                  <p v-if="card.desc">{{ card.desc }}</p>
                  <div v-if="card.tags.length" class="biz-tags">
                    <span v-for="tag in card.tags" :key="tag">{{ tag }}</span>
                  </div>
                </div>
                <ul v-if="card.services.length" class="package-card__services" :aria-label="t('client.home.packages.includedServices')">
                  <li v-for="service in card.services" :key="service.key">
                    <svg aria-hidden="true" viewBox="0 0 18 18">
                      <circle cx="9" cy="9" r="7.5" />
                      <path d="m5.625 9.375 2.25 2.25 4.5-4.5" />
                    </svg>
                    <span class="package-card__service-name">{{ service.name }}</span>
                    <span class="package-card__service-detail">{{ service.detail }}</span>
                  </li>
                </ul>
                <div class="package-card__foot">
                  <div class="package-card__price">
                    <span class="package-card__price-label">{{ t('client.home.packages.dealPrice') }}</span>
                    <div class="package-card__amount">
                      <span>AED</span>
                      <strong>{{ card.sale }}</strong>
                      <small>{{ t('client.home.packages.exclVat') }}</small>
                    </div>
                    <div v-if="card.original || card.save" class="package-card__savings">
                      <s v-if="card.original" :aria-label="`${t('client.home.packages.originalPrice')} AED ${card.original}`">AED {{ card.original }}</s>
                      <span v-if="card.save">{{ card.save }}</span>
                    </div>
                  </div>
                  <span class="package-card__action">
                    {{ t('client.home.packages.viewPackage') }}
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </RouterLink>
          </div>
          <button
            v-if="canScrollPrevious"
            type="button"
            class="packages__edge packages__edge--previous"
            :aria-label="t('client.home.packages.previousPackage')"
            :aria-controls="`package-panel-${activeGroup.id}`"
            @click="scrollPackages(-1)"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M15.5 10h-10m4-4-4 4 4 4" />
            </svg>
          </button>
          <button
            v-if="canScrollNext"
            type="button"
            class="packages__edge packages__edge--next"
            :aria-label="t('client.home.packages.nextPackage')"
            :aria-controls="`package-panel-${activeGroup.id}`"
            @click="scrollPackages(1)"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M4.5 10h10m-4-4 4 4-4 4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  packageCatalog,
  type PackageBoundService,
  type PackageCatalogCard,
  type PackageCatalogCategory,
  type PackageCatalogItem,
} from '@/modules/client/api'
import { bizTagLabels } from '@/modules/client/utils/biz-tag'
import { packageVisitCount } from '@/modules/client/utils/package-visits'

withDefaults(defineProps<{ mode?: 'home' | 'page'; platform?: 'client' | 'h5' }>(), {
  mode: 'home',
  platform: 'client',
})

const { t, locale } = useI18n({ useScope: 'global' })
const categories = ref<PackageCatalogCategory[]>([])
const activeId = ref('')
const loaded = ref(false)
const gridRef = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)
const canScrollPrevious = ref(false)
const canScrollNext = ref(false)
let resizeObserver: ResizeObserver | undefined

const updateScrollState = () => {
  const grid = gridRef.value
  const overflow = grid ? grid.scrollWidth - grid.clientWidth : 0
  const left = grid?.scrollLeft || 0
  hasOverflow.value = overflow > 1
  canScrollPrevious.value = hasOverflow.value && left > 1
  canScrollNext.value = hasOverflow.value && left < overflow - 1
}

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

type CardView = {
  id: string
  title: string
  mark: string
  desc: string
  sale: string
  original: string
  visits: string
  visitCount: number
  bundle: boolean
  save: string
  badge: string
  images: string[]
  tags: string[]
  services: Array<{ key: string; name: string; detail?: string }>
}

type ServiceSource = PackageBoundService | PackageCatalogItem
type BoundService = { key: string; name: string; images?: string[]; redeemTimes?: number }

const imageUrls = (urls?: string[]) =>
  Array.isArray(urls) ? urls.map((url) => typeof url === 'string' ? url.trim() : '').filter(Boolean) : []

const serviceIdentity = (service: ServiceSource, index: number) => {
  const nameMap = ('nameI18n' in service ? service.nameI18n : undefined)
    || ('spuNameI18n' in service ? service.spuNameI18n : undefined)
  const name = pickText(nameMap, t('client.home.packages.serviceFallback', { index: index + 1 }))
  const id = Number(service.spuId)
  const key = Number.isFinite(id) && id > 0 ? `spu:${id}` : `name:${name}`
  return { key, name }
}

const boundServices = (item: PackageCatalogCard): BoundService[] => {
  const items = Array.isArray(item.items) ? item.items : []
  const sources = Array.isArray(item.spus) && item.spus.length ? item.spus : items
  const services = new Map<string, BoundService>()
  sources.forEach((source, index) => {
    if (!source || typeof source !== 'object') return
    const identity = serviceIdentity(source, index)
    const service: BoundService = services.get(identity.key) || identity
    const images = imageUrls(source.imageUrls)
    if (images.length) service.images = [...new Set([...(service.images || []), ...images])]
    services.set(service.key, service)
  })
  items.forEach((source, index) => {
    if (!source || typeof source !== 'object') return
    const service = services.get(serviceIdentity(source, index).key)
    if (!service) return
    const count = Number(source.redeemTimes)
    if (Number.isInteger(count) && count > (service.redeemTimes || 0)) service.redeemTimes = count
    const images = imageUrls(source.imageUrls)
    if (images.length) service.images = [...new Set([...(service.images || []), ...images])]
  })
  return [...services.values()]
}

const packageImages = (services: BoundService[], cover: string) => {
  const galleries = services.flatMap((service) => service.images?.length ? [service.images] : [])
  const [first = [], ...others] = galleries
  const primary = first[0]
  if (primary) {
    for (const gallery of others) {
      const secondary = gallery.find((url) => url !== primary)
      if (secondary) return [primary, secondary]
      const alternative = first.find((url) => url !== gallery[0])
      if (alternative) return [alternative, gallery[0]]
    }
  }
  return [cover || primary].filter(Boolean)
}

const groups = computed(() =>
  categories.value
    .map((category) => {
      const id = String(category.categoryId ?? '')
      const name = pickText(category.nameI18n, category.categoryName || '')
      const packages = Array.isArray(category.packages) ? category.packages : []
      const savings = packages.map((item) => Math.max(0, amount(item.displaySavedPrice) || 0))
      const bestSaving = Math.max(0, ...savings)
      const cards = packages
        .map((item) => toCard(item, name, bestSaving))
        .filter((item): item is CardView => Boolean(item))
      return { id, name, cards }
    })
    .filter((group) => group.id && group.name && group.cards.length),
)

const toCard = (item: PackageCatalogCard, categoryName: string, bestSaving: number): CardView | null => {
  const id = String(item.id ?? '')
  const sale = amount(item.displaySalePrice)
  if (!id || sale == null) return null
  const original = amount(item.displayTotalPrice)
  const saved = Math.max(0, amount(item.displaySavedPrice) ?? (original != null ? original - sale : 0))
  const bound = boundServices(item)
  const bundle = bound.length > 1
  // The catalog lists distinct services and sums their redemptions. If each
  // service has exactly one redemption, all are booked on the first visit.
  const combinedVisit = bundle && amount(item.redeemTimes) === bound.length
    && bound.every(({ key }) => key.startsWith('spu:'))
    && packageVisitCount({ items: item.items }) <= 1
    && packageVisitCount({ packageName: item.packageName, nameI18n: item.nameI18n }) <= 1
  const visits = combinedVisit ? 1 : packageVisitCount(item)
  const cover = imageUrls(item.imageUrls)[0] || ''
  const services = bound.map(({ key, name, redeemTimes }) => {
    const count = redeemTimes || (!bundle ? visits : 0)
    if (count > 1) return { key, name, detail: t('client.home.packages.cardVisits', { count }) }
    if (count === 1 && visits > 1) return { key, name, detail: t('client.home.packages.serviceFirstVisit') }
    return { key, name, detail: t('client.home.packages.serviceIncluded') }
  })
  const name = pickText(item.nameI18n, item.packageName || '')
  const isBest = saved > 0 && saved === bestSaving
  return {
    id,
    title: name,
    mark: Array.from(name)[0] || 'H',
    desc: pickText(item.descI18n, item.packageDesc || ''),
    sale: money(sale),
    original: original != null && original > sale ? money(original) : '',
    visits: visits > 0 ? t('client.home.packages.cardVisits', { count: visits }) : '',
    visitCount: visits,
    bundle,
    save: saved > 0 ? t('client.home.packages.save', { price: money(saved) }) : '',
    badge: isBest ? t('client.home.packages.bestValue') : categoryName,
    images: packageImages(bound, cover),
    tags: bizTagLabels(item.tags, locale.value),
    services,
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
  const card = grid.querySelector<HTMLElement>('.package-card')
  const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0
  grid.scrollBy({
    left: direction * (card ? card.getBoundingClientRect().width + gap : grid.clientWidth),
    behavior: 'smooth',
  })
}

watch(groups, (list) => {
  if (!list.some((group) => group.id === activeId.value)) {
    activeId.value = list[0]?.id || ''
  }
})

watch(gridRef, (grid) => {
  resizeObserver?.disconnect()
  if (grid && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(grid)
  }
  updateScrollState()
}, { flush: 'post' })

watch(activeGroup, async (group, previous) => {
  await nextTick()
  if (group?.id !== previous?.id) {
    gridRef.value?.scrollTo({ left: 0, behavior: 'auto' })
  }
  updateScrollState()
}, { flush: 'post' })

onBeforeUnmount(() => resizeObserver?.disconnect())

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
@font-face {
  font-family: "Manrope Package";
  src: url('@/assets/fonts/manrope-latin-800.woff2') format('woff2');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

.biz-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.biz-tags span { padding: 2px 8px; border-radius: 999px; background: #f6f1e7; color: #6d5428; font-size: 12px; font-weight: 700; line-height: 1.5; }

.packages {
  --package-navy: var(--hourx-client-text);
  --package-navy-soft: #16233b;
  --package-mint: var(--hourx-client-accent);
  --package-mint-pale: #f1eee8;
  --package-line: var(--hourx-client-border);
  --package-muted: var(--hourx-client-muted);
  --package-media-height: 150px;
  padding: var(--hourx-client-section-space) 0;
  overflow: hidden;
  background: var(--hourx-client-canvas);
}

.packages--page {
  min-height: 68vh;
  padding: 28px 0 48px;
}

.packages__inner {
  width: min(1200px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0;
  border: 0;
  border-radius: 20px;
  background: transparent;
  box-sizing: border-box;
  box-shadow: none;
}

.packages__inner::after {
  display: none;
}

.packages__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.packages__head-copy {
  min-width: 0;
  max-width: 720px;
}

.packages__eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 8px;
  color: var(--hourx-client-accent-ink);
  font-size: var(--hourx-client-size-label);
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1.2;
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
  font-size: var(--hourx-client-size-section);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.25;
  font-family: var(--hourx-client-heading-font);
}

.packages__head-copy > p:last-child {
  max-width: 640px;
  margin: 6px 0 0;
  color: var(--package-muted);
  font-size: var(--hourx-client-size-body);
  font-weight: 400;
  line-height: 1.55;
}

.packages__all {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 10px 0 14px;
  border: 1px solid #cdd7e0;
  border-radius: 12px;
  background: #fff;
  color: var(--package-navy);
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: none;
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
  border-color: var(--package-line);
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

.packages__all svg {
  width: 26px;
  height: 26px;
  padding: 6px;
  border-radius: 50%;
  box-sizing: border-box;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  background: var(--package-navy);
  color: #fff;
}

.packages__catalog {
  margin-top: 24px;
  padding-top: 0;
  border-top: 0;
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
  flex: 0 1 auto;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px;
  border-radius: 14px;
  background: #efece6;
}

.packages__tabs::-webkit-scrollbar,
.packages__grid::-webkit-scrollbar {
  display: none;
}

.packages__tabs button {
  flex: 0 0 auto;
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 6px;
  padding: 0 6px 0 11px;
  border: 1px solid #dce3e9;
  border-radius: 10px;
  background: #f6f8fa;
  color: var(--package-navy);
  font: inherit;
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease, border-color 180ms ease;
}

.packages__tabs button:hover {
  border-color: #a8b7c5;
  color: var(--package-navy);
}

.packages__tabs button:focus-visible,
.packages__nav button:focus-visible,
.packages__edge:focus-visible {
  outline: 2px solid var(--package-mint);
  outline-offset: 2px;
}

.packages__tabs button small {
  display: grid;
  min-width: 20px;
  height: 20px;
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
  color: var(--package-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  white-space: nowrap;
  text-transform: none;
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

.packages__nav button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--package-navy);
  background: #f4f7f9;
}

.packages__nav button:disabled {
  opacity: 0.35;
  cursor: default;
}

.packages__nav svg,
.packages__edge svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.packages__carousel {
  position: relative;
  margin-top: 12px;
}

.packages__carousel.can-scroll-next::after {
  position: absolute;
  z-index: 1;
  inset: 0 0 4px auto;
  width: 52px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), #fff);
  pointer-events: none;
  content: '';
}

.packages__edge {
  position: absolute;
  z-index: 2;
  top: calc(var(--package-media-height) / 2);
  display: grid;
  width: 48px;
  height: 48px;
  padding: 0;
  place-items: center;
  transform: translateY(-50%);
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--package-navy);
  color: #fff;
  box-shadow: 0 4px 18px rgba(5, 21, 43, 0.25);
  cursor: pointer;
}

.packages__edge:hover {
  background: #174b53;
}

.packages__edge svg {
  width: 22px;
  height: 22px;
}

.packages__edge--previous { left: -14px; }
.packages__edge--next { right: -14px; }

.packages__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.packages__grid.is-scrollable {
  grid-template-columns: none;
  grid-auto-columns: calc((100% - 48px) / 3.15);
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
  grid-template-columns: minmax(0, calc((100% - 48px) / 3.15));
  justify-content: start;
}

.packages__grid.is-double {
  grid-template-columns: repeat(2, minmax(0, calc((100% - 48px) / 3.15)));
  justify-content: start;
}

.package-card {
  --card-muted: #55657a;
  --card-gold-text: #8a6a2e;
  --card-gold-tint: #f6eedc;
  --card-heading-font: "Manrope Package", var(--hourx-client-heading-font);
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: #fff;
  color: var(--package-navy);
  font-family: var(--hourx-client-font-family);
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(6, 24, 47, 0.06), 0 12px 32px rgba(6, 24, 47, 0.08);
  transition: box-shadow 180ms ease;
}

.package-card:hover {
  box-shadow: 0 1px 2px rgba(6, 24, 47, 0.08), 0 12px 32px rgba(6, 24, 47, 0.14);
}

.package-card__media {
  position: relative;
  display: grid;
  flex: 0 0 var(--package-media-height);
  grid-template-columns: minmax(0, 1fr);
  height: var(--package-media-height);
  background: #edf2f8;
}

.package-card__media.is-split {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px;
  background: #fff;
}

.package-card__media img {
  display: block;
  width: 100%;
  height: var(--package-media-height);
  object-fit: cover;
}

.package-card__mark {
  display: grid;
  place-items: center;
  color: #60738b;
  font-family: var(--card-heading-font);
  font-size: 56px;
  font-weight: 800;
}

.package-card__plus {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: 38px;
  height: 38px;
  box-sizing: border-box;
  place-items: center;
  transform: translate(-50%, -50%);
  border: 3px solid #fff;
  border-radius: 50%;
  background: var(--package-navy);
  color: #fff;
}

.package-card__plus svg,
.package-card__action svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.package-card__media-labels {
  position: absolute;
  inset: auto 12px 12px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
}

.package-card__badge,
.package-card__visits {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.package-card__badge {
  background: rgba(6, 24, 47, 0.85);
  color: #fff;
  font-weight: 600;
}

.package-card__visits {
  margin-inline-start: auto;
  background: #fff;
  color: var(--package-navy);
}

.package-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px 20px;
}

.package-card__copy {
  display: grid;
  gap: 6px;
}

.package-card__eyebrow {
  color: var(--card-gold-text);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
}

.package-card h3,
.package-card__copy > p {
  display: -webkit-box;
  min-height: 2lh;
  margin: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.package-card h3 {
  color: var(--package-navy);
  font-family: var(--card-heading-font);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
}

.package-card__copy > p {
  color: var(--card-muted);
  font-size: 13px;
  line-height: 1.5;
}

.package-card__services {
  margin: 0;
  padding: 4px 14px;
  border-radius: 12px;
  background: #f5f8fc;
  list-style: none;
}

.package-card__services li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  line-height: 1.3;
}

.package-card__services li + li {
  border-top: 1px solid #e3eaf2;
}

.package-card__services svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--card-gold-text);
  stroke-width: 1.65;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.package-card__service-name {
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 600;
}

.package-card__service-detail {
  color: var(--card-muted);
  font-size: 12px;
  font-weight: 600;
  text-align: end;
}

.package-card__foot {
  display: grid;
  gap: 12px;
  margin-top: auto;
}

.package-card__price {
  display: grid;
  gap: 4px;
}

.package-card__price-label {
  color: var(--card-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-transform: uppercase;
}

.package-card__amount,
.package-card__savings {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 6px;
}

.package-card__amount > span {
  font-size: 14px;
  font-weight: 700;
}

.package-card__amount strong {
  font-family: var(--card-heading-font);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1;
}

.package-card__amount small {
  margin-inline-start: 4px;
  color: #6b7a90;
  font-size: 12px;
  font-weight: 500;
}

.package-card__savings {
  align-items: center;
  gap: 4px 10px;
  color: #6b7a90;
  font-size: 13px;
  line-height: 1.2;
}

.package-card__savings span {
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--card-gold-tint);
  color: var(--card-gold-text);
  font-weight: 700;
}

.package-card__action {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background: var(--package-navy);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.package-card__action svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.4;
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
    padding-inline: 0;
  }
}

@media (max-width: 900px) {
  .packages {
    padding: 28px 0 32px;
  }

  .packages__grid,
  .packages__grid.is-scrollable,
  .packages__grid.is-single,
  .packages__grid.is-double {
    grid-template-columns: none;
    grid-auto-columns: calc((100% - 28px) / 2.15);
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
    --package-media-height: 150px;
    padding: 28px 0 32px;
  }

  .packages__inner {
    width: calc(100% - 32px);
    padding: 0;
    border-radius: 16px;
  }

  .packages__head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .packages__head h2 {
    font-size: var(--hourx-client-size-section);
  }

  .packages__head-copy > p:last-child {
    margin-top: 6px;
    font-size: 12px;
  }

  .packages__all {
    min-height: 36px;
  }

  .packages__catalog {
    margin-top: 12px;
    padding-top: 10px;
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
    grid-auto-columns: min(100%, 340px);
    gap: 10px;
  }

  .packages__carousel { margin-top: 10px; }

  .packages__carousel.can-scroll-next::after,
  .packages__edge {
    display: none;
  }
}

.packages--compact {
  --package-media-height: 150px;
  padding: 20px 0;

  .packages__inner {
    width: calc(100% - 32px);
    padding: 0;
    border-radius: 16px;
    box-shadow: none;
  }

  .packages__head {
    align-items: center;
    flex-direction: row;
    gap: 10px;
  }

  .packages__head h2 {
    font-size: var(--hourx-client-size-section);
  }

  .packages__head-copy > p:last-child {
    font-size: var(--hourx-client-size-body);
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
    margin-top: 12px;
    padding-top: 10px;
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
}

@media (prefers-reduced-motion: reduce) {
  .packages__all,
  .package-card,
  .package-card__action svg {
    transition: none;
  }

  .packages__grid {
    scroll-behavior: auto;
  }
}
</style>
