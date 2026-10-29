<template>
  <div class="package-detail-page">
    <PackageDetailMobile
      v-if="props.platform === 'h5'"
      :view="view"
      :loading="loading"
      :missing="missing"
      :busy="busy"
      :price-ready="priceReady"
      :price-loading="priceLoading"
      :price-error="priceError"
      :selection-locked="selectionLocked"
      :selected-image-index="selectedImageIndex"
      :cart-count="cartCount"
      @back="goBack"
      @cart="router.push({ name: routeNames.cart })"
      @image-change="selectedImageIndex = $event"
      @add-to-cart="addToCart"
      @checkout="openCheckout"
      @select-spec="selectSpec"
      @retry-price="loadPrice"
      @select-shared-spec="selectSharedSpec"
      @toggle-separate-specs="toggleSeparateSpecs"
    />
    <div v-else class="product-detail-page">
    <section class="product-detail-subheader">
      <div class="product-detail-container">
        <nav class="product-detail-back" aria-label="breadcrumb">
          <RouterLink class="product-detail-back__link" :to="{ name: 'packages' }">
            {{ t('client.home.packages.detailBack') }}
          </RouterLink>
          <span class="product-detail-back__separator" aria-hidden="true">&lt;</span>
          <span class="product-detail-back__current">{{ view?.title || t(loading ? 'client.productDetail.loading' : 'client.home.packages.unavailable') }}</span>
        </nav>
      </div>
    </section>

    <section class="product-detail-body">
      <div v-if="loading || missing" class="product-detail-container package-detail-state" :aria-busy="loading">
        <p role="status">{{ t(loading ? 'client.productDetail.loading' : 'client.home.packages.unavailable') }}</p>
        <RouterLink v-if="missing" :to="{ name: 'packages' }">{{ t('client.home.packages.viewAll') }}</RouterLink>
      </div>

      <div v-else-if="view" class="product-detail-container product-detail-layout">
        <div class="product-main">
          <section class="product-gallery">
            <div v-if="galleryImages.length" class="product-gallery__thumbs">
              <button
                v-for="(image, index) in galleryImages"
                :key="`thumb-${index}`"
                class="product-gallery__thumb"
                :class="{ 'product-gallery__thumb--active': index === selectedImageIndex }"
                type="button"
                @click="selectedImageIndex = index"
              >
                <img :src="image" :alt="view.title" />
              </button>
            </div>

            <div class="product-gallery__hero" :class="{ 'is-empty': !galleryImages.length }">
              <img v-if="heroImage" :src="heroImage" :alt="view.title" />
              <span v-else class="product-gallery__empty">{{ view.mark }}</span>
              <button
                v-if="galleryImages.length > 1"
                class="product-gallery__arrow product-gallery__arrow--prev"
                type="button"
                :aria-label="t('client.productDetail.previousImage')"
                @click="showPreviousImage"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button
                v-if="galleryImages.length > 1"
                class="product-gallery__arrow product-gallery__arrow--next"
                type="button"
                :aria-label="t('client.productDetail.nextImage')"
                @click="showNextImage"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <div v-if="galleryImages.length > 1" class="product-gallery__dots">
                <button
                  v-for="(image, index) in galleryImages"
                  :key="`dot-${image}-${index}`"
                  type="button"
                  class="product-gallery__dot"
                  :class="{ 'product-gallery__dot--active': index === selectedImageIndex }"
                  :aria-label="`${view.title} image ${index + 1}`"
                  @click="selectedImageIndex = index"
                />
              </div>
            </div>
          </section>

          <div class="product-trust-strip" aria-label="service benefits">
            <div class="product-trust-strip__item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 5 6v5c0 4.8 2.9 8.2 7 10 4.1-1.8 7-5.2 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>{{ t('client.productDetail.trust.professional') }}</span>
            </div>
            <div class="product-trust-strip__item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
              <span>{{ t('client.productDetail.trust.flexible') }}</span>
            </div>
            <div class="product-trust-strip__item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-3.1-6.3" />
                <path d="m20 4-8.5 8.5L8 9" />
              </svg>
              <span>{{ t('client.productDetail.trust.clearPricing') }}</span>
            </div>
          </div>

          <section class="product-detail-tabs">
            <div class="product-detail-tabs__nav" role="tablist" :aria-label="t('client.productDetail.pageTitle')">
              <button
                v-for="tab in detailTabs"
                :id="`package-detail-tab-${tab.key}`"
                :key="tab.key"
                class="product-detail-tabs__tab"
                :class="{ 'product-detail-tabs__tab--active': activeDetailTab === tab.key }"
                type="button"
                role="tab"
                :aria-selected="activeDetailTab === tab.key"
                aria-controls="package-detail-panel"
                :tabindex="activeDetailTab === tab.key ? 0 : -1"
                @click="activeDetailTab = tab.key"
                @keydown="handleDetailTabKeydown($event, tab.key)"
              >{{ tab.label }}</button>
            </div>
            <div id="package-detail-panel" class="product-detail-tabs__panel" role="tabpanel" :aria-labelledby="`package-detail-tab-${activeDetailTab}`" tabindex="0">
              <section v-if="activeDetailTab === 'description'" class="product-detail-tabs__section">
                <div class="product-section-heading">
                  <span class="product-section-heading__icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h14M7 16V8l5-4 5 4v8M10 16v-4h4v4" /></svg>
                  </span>
                  <h2>{{ t('client.productDetail.serviceDescription') }}</h2>
                </div>
                <div v-if="view.descHtml" class="product-rich-text" v-html="view.descHtml" />
                <p v-else class="product-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
              </section>
              <section v-else-if="activeDetailTab === 'includes'" class="product-detail-tabs__section">
              <div class="product-section-heading">
                <span class="product-section-heading__icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                </span>
                <h2>{{ t('client.productDetail.includesTitle') }}</h2>
              </div>
              <div v-if="view.aboutHtml" class="product-rich-text" v-html="view.aboutHtml" />
              <ul v-if="view.items.length" class="package-includes">
                <li v-for="item in view.items" :key="item.id">
                  <div>
                    <strong>{{ item.name }}</strong>
                    <small v-if="item.selectionSummary">{{ item.selectionSummary }}</small>
                  </div>
                  <em>{{ item.times }}</em>
                </li>
              </ul>
              <p v-if="!view.aboutHtml && !view.items.length" class="product-card__empty">
                {{ t('client.productDetail.emptyDesc') }}
              </p>
              </section>
              <section v-else-if="activeDetailTab === 'notice'" class="product-detail-tabs__section">
              <div class="product-section-heading">
                <span class="product-section-heading__icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 8h.01" />
                  </svg>
                </span>
                <h2>{{ t('client.productDetail.noticeTitle') }}</h2>
              </div>
              <div v-if="view.noticeHtml" class="product-rich-text" v-html="view.noticeHtml" />
              <p v-else class="product-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
              </section>
              <section v-else class="product-detail-tabs__section">
                <div class="product-section-heading">
                  <span class="product-section-heading__icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9Z" /></svg>
                  </span>
                  <h2>{{ t('client.productDetail.reviewsTitle') }}</h2>
                </div>
                <p class="product-card__empty">{{ t('client.productDetail.emptyReviews') }}</p>
              </section>
            </div>
          </section>
        </div>

        <aside class="booking-side">
          <section class="booking-card">
            <div class="booking-card__scroll">
            <div class="booking-card__hero">
              <span class="booking-card__eyebrow">{{ t('client.productDetail.pageTitle') }}</span>
              <h1>{{ view.title }}</h1>
              <div v-if="view.tags.length" class="biz-tags">
                <span v-for="tag in view.tags" :key="tag">{{ tag }}</span>
              </div>
              <div class="booking-card__meta">
                <div v-if="view.visits" class="booking-card__rating">
                  <strong>{{ view.visits }}</strong>
                  <small v-if="view.validDays">{{ view.validDays }}</small>
                </div>
                <span class="booking-card__trust">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 5 6v5c0 4.8 2.9 8.2 7 10 4.1-1.8 7-5.2 7-10V6l-7-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {{ t('client.productDetail.trust.trusted') }}
                </span>
              </div>
            </div>

            <div class="booking-price-card" :aria-busy="priceLoading">
              <span class="booking-price-card__label">{{ t('client.home.packages.dealPrice') }}</span>
              <div class="booking-price-card__main"><span v-if="priceReady">AED</span><strong>{{ view.saleAmount == null ? '—' : view.saleAmount.toFixed(2) }}</strong></div>
              <div v-if="view.original" class="booking-price-card__offer">
                <del>AED {{ view.original }}</del>
                <span v-if="view.save">{{ view.save }}</span>
              </div>
              <p v-if="view.perVisit" class="package-price-per-visit">{{ view.perVisit }}</p>
              <div v-if="!priceReady" class="package-price-status" :class="{ 'is-error': !!priceError }" role="status">
                <span>{{ priceLoading ? t('client.home.packages.priceLoading') : priceError || t('client.home.packages.chooseSkuRequired') }}</span>
                <button v-if="priceError" type="button" @click="loadPrice">{{ t('client.home.packages.retryPrice') }}</button>
              </div>
            </div>

            <PackageSharedSpecs
              v-if="view.hasSharedSpecs"
              :groups="view.sharedGroups"
              :separate="view.separateSpecs"
              :disabled="selectionLocked"
              @select="selectSharedSpec"
              @toggle-separate="toggleSeparateSpecs"
            />

            <div class="booking-card__section-heading">
              <h2>{{ t('client.home.packages.included') }}</h2>
            </div>

            <div v-if="view.items.length" class="booking-field">
              <div class="booking-attach-list">
                <div v-for="item in view.items" :key="`side-${item.id}`" class="booking-attach-item">
                  <div class="booking-attach-item__meta">
                    <span class="booking-attach-item__name">{{ item.name }}</span>
                    <span v-if="item.sharedSummary" class="package-shared-applied">{{ t('client.home.packages.sharedApplied', { specs: item.sharedSummary }) }}</span>
                    <span v-else-if="item.spec && !item.groups.length" class="booking-attach-item__price">{{ item.spec }}</span>
                    <div v-if="item.groups.length" class="package-sku-groups">
                      <div v-for="group in item.groups" :key="group.id" class="package-sku-group">
                        <p class="package-sku-group__label">{{ group.label }}</p>
                        <div class="package-sku-options" role="radiogroup" :aria-label="group.label">
                          <button
                            v-for="option in group.options"
                            :key="option.id"
                            type="button"
                            class="package-sku-option"
                            :class="{ 'is-selected': group.selectedId === option.id }"
                            :aria-pressed="group.selectedId === option.id"
                            :disabled="selectionLocked || option.disabled"
                            @click="selectSpec(item.id, group.id, option.id)"
                          >{{ option.label }}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span class="package-times">{{ item.times }}</span>
                </div>
              </div>
            </div>
            <p v-else class="booking-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
            <p class="package-visit-note">{{ t('client.home.packages.visitLater') }}</p>

            <div class="booking-summary">
              <div class="booking-summary__caption">{{ t('client.productDetail.booking.summaryTitle') }}</div>
              <div class="booking-summary__row">
                <span>
                  {{ t('client.productDetail.booking.selectedService') }}
                  <small>{{ [view.title, view.perVisit, view.save].filter(Boolean).join(' · ') }}</small>
                </span>
                <strong>{{ formatAed(view.saleAmount) }}</strong>
              </div>
              <div class="booking-summary__row booking-summary__row--tax">
                <span>{{ t('client.productDetail.booking.vat') }}</span>
                <strong>{{ formatAed(view.vat) }}</strong>
              </div>
              <div class="booking-summary__row booking-summary__row--total">
                <span>{{ t('client.productDetail.booking.total') }}</span>
                <strong>{{ formatAed(view.total) }}</strong>
              </div>
            </div>

            </div>
            <div class="booking-card__footer">
            <div class="booking-actions">
              <button class="booking-add-cart" type="button" :disabled="busy || !priceReady" @click="addToCart">
                <svg class="booking-add-cart__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 4h2.2l1.7 9.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20 8H7" />
                  <circle cx="9.5" cy="19" r="1.3" />
                  <circle cx="17" cy="19" r="1.3" />
                  <path d="M14.5 3.5v5M12 6h5" />
                </svg>
                <span>{{ t('client.productDetail.booking.addToCart') }}</span>
              </button>
              <button class="booking-submit" type="button" :disabled="busy || !priceReady" @click="openCheckout">
                {{ t('client.productDetail.booking.bookNow') }}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>
              </button>
            </div>
            <p class="booking-card__policy">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
              {{ t('client.productDetail.booking.flexiblePolicy') }}
            </p>
            </div>
          </section>
        </aside>
      </div>
    </section>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { bizTagLabels } from '@/modules/client/utils/biz-tag'
import { toPlainText as plainText } from '@/modules/client/utils/plain-text'
import { findSharedSpecs, getSharedSpecGroups, resolveSharedSpecs, type SkuChoice, type SpecItem } from '@/modules/client/utils/package-shared-specs'
import { packageVisitCount } from '@/modules/client/utils/package-visits'
import { hydratePackageSpecIds } from '@/modules/client/utils/package-spec-identity'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { createPackageOrder, getProductDetail, packageDetail, packagePrice, type PackageCatalogCard, type PackagePricePayload, type PackageSkuSelection, type PackageSpecLine } from '@/modules/client/api'
import { useCart } from '@/modules/client/composables/useCart'
import PackageDetailMobile from '@/modules/h5/components/PackageDetailMobile.vue'
import PackageSharedSpecs from '@/modules/client/components/PackageSharedSpecs.vue'
import { getStoredAuthSnapshot, clearStoredAuthState } from '@/utils/auth-state'

const props = withDefaults(defineProps<{
  platform?: 'client' | 'h5'
}>(), {
  platform: 'client',
})

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const { addPackage, cartCount } = useCart({ initialize: false })
const detail = ref<PackageCatalogCard | null>(null)
const detailPackageId = ref('')
const loading = ref(false)
const missing = ref(false)
let loadRequestSeq = 0
type PriceQuote = {
  originalPrice: number
  salePrice: number
  savedPrice: number
  taxPrice: number
  totalPriceWithTax: number
  discount: number
}
const priceQuote = ref<PriceQuote | null>(null)
const priceLoading = ref(false)
const priceError = ref('')
const quotedSignature = ref('')
let priceRequestSeq = 0
const adding = ref(false)
const buying = ref(false)
const selectedImageIndex = ref(0)
type DetailTabKey = 'description' | 'includes' | 'notice' | 'reviews'
const detailTabOrder: DetailTabKey[] = ['description', 'includes', 'notice', 'reviews']
const activeDetailTab = ref<DetailTabKey>('description')
const detailTabs = computed(() => [
  { key: 'description' as const, label: t('client.productDetail.serviceDescription') },
  { key: 'includes' as const, label: t('client.productDetail.includesTitle') },
  { key: 'notice' as const, label: t('client.productDetail.noticeTitle') },
  { key: 'reviews' as const, label: t('client.productDetail.reviewsTitle') },
])
const handleDetailTabKeydown = (event: KeyboardEvent, currentKey: DetailTabKey) => {
  const currentIndex = detailTabOrder.indexOf(currentKey)
  let nextIndex = currentIndex
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % detailTabOrder.length
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + detailTabOrder.length) % detailTabOrder.length
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = detailTabOrder.length - 1
  else return
  event.preventDefault()
  const nextKey = detailTabOrder[nextIndex] || 'description'
  activeDetailTab.value = nextKey
  const tabList = (event.currentTarget as HTMLElement).closest('[role="tablist"]')
  tabList?.querySelector<HTMLButtonElement>(`#package-detail-tab-${nextKey}`)?.focus()
}
const busy = computed(() => loading.value || adding.value || buying.value || priceLoading.value)
const selectionLocked = computed(() => loading.value || adding.value || buying.value)
const routeNames = computed(() => props.platform === 'h5'
  ? {
      login: 'h5-login',
      cart: 'h5-cart',
      orderConfirm: 'h5-order-confirm',
    }
  : {
      login: 'login',
      cart: 'cart',
      orderConfirm: 'order-confirm',
    })

const preferredLangs = () =>
  locale.value === 'zh' ? ['zh-CN', 'zh', 'en', 'en-US'] : ['en', 'en-US', 'zh-CN', 'zh']

const pickRaw = (i18n?: Record<string, string>, fallback = '') => {
  const map = i18n || {}
  for (const lang of preferredLangs()) {
    const value = map[lang]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  const first = Object.values(map).find((value) => typeof value === 'string' && value.trim())
  return typeof first === 'string' ? first.trim() : fallback
}

const asHtml = (value: string) => {
  const text = String(value || '').trim()
  if (!text) return ''
  return /<[a-z][\s\S]*>/i.test(text) ? text : `<p>${text}</p>`
}

const amount = (value: unknown) => {
  if (value == null || (typeof value === 'string' && !value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const money = (value: number) =>
  new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatAed = (value: number | null) => value == null ? '—' : `AED ${value.toFixed(2)}`
const selectedSkuIds = ref<Record<string, string>>({})
const positiveId = (value: unknown) => /^[1-9]\d*$/.test(String(value ?? '')) && Number.isSafeInteger(Number(value))
const itemKey = (item: NonNullable<PackageCatalogCard['items']>[number], index: number) => String(item.packageItemId || item.skuId || index)
const pricePayload = computed<PackagePricePayload | null>(() => {
  const card = detail.value
  const packageId = String(route.params.id || '').trim()
  if (!card || detailPackageId.value !== packageId || !positiveId(packageId)) return null
  const selections: PackageSkuSelection[] = []
  for (const [index, item] of (card.items || []).entries()) {
    const options = (item.skuOptions || []).filter((option) => positiveId(option.skuId))
    const selectable = Number(item.bindType) !== 2 && (Number(item.bindType) === 1 || (item.skuOptions || []).length > 0)
    if (!selectable) continue
    const skuId = selectedSkuIds.value[itemKey(item, index)]
    if (!positiveId(skuId) || !options.some((option) => String(option.skuId) === skuId)) return null
    const packageItemId = positiveId(item.packageItemId) ? Number(item.packageItemId) : undefined
    const spuId = positiveId(item.spuId) ? Number(item.spuId) : undefined
    if (!packageItemId && !spuId) return null
    selections.push({ ...(packageItemId ? { packageItemId } : {}), ...(spuId ? { spuId } : {}), skuId: Number(skuId) })
  }
  return { packageId, selections }
})
const priceSignature = computed(() => pricePayload.value ? JSON.stringify(pricePayload.value) : '')
const priceReady = computed(() => Boolean(priceQuote.value && !priceLoading.value && quotedSignature.value === priceSignature.value))

const loadPrice = async () => {
  const requestSeq = ++priceRequestSeq
  const payload = pricePayload.value
  const signature = priceSignature.value
  priceQuote.value = null
  quotedSignature.value = ''
  priceError.value = ''
  priceLoading.value = Boolean(payload)
  if (!payload) return
  try {
    const result = await packagePrice(payload)
    if (requestSeq !== priceRequestSeq || signature !== priceSignature.value) return
    const fields = ['originalPrice', 'salePrice', 'savedPrice', 'taxPrice', 'totalPriceWithTax', 'discount'] as const
    const values = Object.fromEntries(fields.map((key) => [key, amount(result?.[key])]))
    if (fields.some((key) => values[key] == null || values[key] < 0) || !(Number(values.discount) > 0)) {
      throw new Error(t('client.home.packages.priceFailed'))
    }
    priceQuote.value = values as PriceQuote
    quotedSignature.value = signature
  } catch (error: any) {
    if (requestSeq !== priceRequestSeq || signature !== priceSignature.value) return
    priceError.value = error?.message || t('client.home.packages.priceFailed')
  } finally {
    if (requestSeq === priceRequestSeq) priceLoading.value = false
  }
}

const specLabel = (lines?: PackageSpecLine[]) => (lines || [])
  .map((line) => {
    const type = plainText(pickRaw(line.specTypeNameI18n))
    const value = plainText(pickRaw(line.specValueNameI18n))
    return [type, value].filter(Boolean).join(': ')
  })
  .filter(Boolean)
  .join(' · ')

const skuChoices = (options: Array<{ skuId?: number | string; specI18n?: PackageSpecLine[] }>): SkuChoice[] =>
  options
    .filter((option) => positiveId(option.skuId))
    .map((option) => {
      const parts = (option.specI18n || []).map((line, index) => {
        const typeLabel = plainText(pickRaw(line.specTypeNameI18n))
        const valueLabel = plainText(pickRaw(line.specValueNameI18n))
        const typeId = positiveId(line.specTypeId) ? String(line.specTypeId) : undefined
        const valueId = positiveId(line.specValueId) ? String(line.specValueId) : undefined
        const typeKey = typeId ? `type:${typeId}` : typeLabel || `type-${index}`
        return {
          typeKey,
          typeId,
          valueId,
          typeLabel: typeLabel || t('client.home.packages.chooseSku'),
          valueKey: typeId && valueId ? `value:${valueId}` : `${typeKey}::${valueLabel || index}`,
          valueLabel: valueLabel || String(option.skuId),
        }
      })
      return {
        id: String(option.skuId),
        label: specLabel(option.specI18n) || String(option.skuId),
        parts,
      }
    })

const specItemsFor = (card: PackageCatalogCard | null): SpecItem[] => (card?.items || []).map((item, index) => ({
  id: itemKey(item, index),
  choices: Number(item.bindType) === 2 ? [] : skuChoices(item.skuOptions || []),
}))
const specItems = computed(() => specItemsFor(detail.value))
const separateSpecs = ref(false)
const sharedDefinitions = computed(() => findSharedSpecs(specItems.value))
const activeSharedDefinitions = computed(() => separateSpecs.value ? [] : sharedDefinitions.value)
const sharedGroups = computed(() => getSharedSpecGroups(specItems.value, activeSharedDefinitions.value, selectedSkuIds.value))
const itemSharesSpecs = (itemId: string) => activeSharedDefinitions.value.some((group) => group.itemIds.includes(itemId))
const exactLocalChoice = (choices: SkuChoice[], selectedId: string, typeKey: string, valueKey: string) => {
  const current = choices.find((choice) => choice.id === selectedId) || choices[0]
  if (!current) return undefined
  const desired = new Map(current.parts.map((part) => [part.typeKey, part.valueKey]))
  desired.set(typeKey, valueKey)
  return choices.find((choice) => [...desired].every(([key, value]) => choice.parts.some((part) => part.typeKey === key && part.valueKey === value)))
}

const specGroups = (choices: SkuChoice[], selectedId: string) => {
  const selected = choices.find((choice) => choice.id === selectedId) || choices[0]
  const order: string[] = []
  const types = new Map<string, { label: string; values: Map<string, string> }>()
  choices.forEach((choice) => {
    choice.parts.forEach((part) => {
      const type = types.get(part.typeKey)
      if (!type) {
        types.set(part.typeKey, { label: part.typeLabel, values: new Map([[part.valueKey, part.valueLabel]]) })
        order.push(part.typeKey)
        return
      }
      type.values.set(part.valueKey, part.valueLabel)
    })
  })
  return order.map((typeKey) => {
    const type = types.get(typeKey)
    const selectedPart = selected?.parts.find((part) => part.typeKey === typeKey)
    return {
      id: typeKey,
      label: type?.label || '',
      selectedId: selectedPart?.valueKey || '',
      options: [...(type?.values.entries() || [])].map(([id, label]) => ({ id, label, disabled: false })),
    }
  }).filter((group) => group.options.length)
}

const view = computed(() => {
  const card = detail.value
  if (!card) return null
  const quote = priceReady.value ? priceQuote.value : null
  const sale = quote?.salePrice ?? null
  const original = quote?.originalPrice ?? null
  const saved = quote?.savedPrice ?? 0
  const visits = packageVisitCount(card)
  const name = plainText(pickRaw(card.nameI18n, card.packageName || ''))
  return {
    title: name,
    tags: bizTagLabels(card.tags, locale.value),
    mark: Array.from(name)[0] || 'H',
    category: plainText(pickRaw(card.categoryNameI18n)),
    visits: visits > 0 ? t('client.home.packages.visits', { count: visits }) : '',
    descHtml: asHtml(pickRaw(card.descI18n, card.packageDesc || '')),
    aboutHtml: asHtml(pickRaw(card.serviceContentTextI18n)),
    noticeHtml: asHtml(pickRaw(card.bookingNoticeI18n)),
    saleAmount: sale,
    original: original != null && sale != null && original > sale ? money(original) : '',
    perVisit: sale != null && visits > 1 ? t('client.home.packages.perVisit', { price: money(sale / visits) }) : '',
    save: saved > 0 ? t('client.home.packages.save', { price: money(saved) }) : '',
    validDays: Number(card.validDays) > 0 ? t('client.home.packages.validDays', { days: card.validDays }) : '',
    vat: quote?.taxPrice ?? null,
    total: quote?.totalPriceWithTax ?? null,
    images: (card.imageUrls || []).map((url) => String(url || '').trim()).filter(Boolean),
    hasSharedSpecs: sharedDefinitions.value.length > 0,
    separateSpecs: separateSpecs.value,
    sharedGroups: sharedGroups.value.map((group) => ({
      ...group,
      serviceNames: (card.items || []).filter((item, index) => group.itemIds.includes(itemKey(item, index)))
        .map((item) => plainText(pickRaw(item.spuNameI18n)) || t('client.orderList.unknownService')).join(locale.value === 'zh' ? '、' : ', '),
    })),
    items: (card.items || []).map((item, index) => {
      const id = itemKey(item, index)
      const choices = Number(item.bindType) === 2 ? [] : skuChoices(item.skuOptions || [])
      const selectedSkuId = selectedSkuIds.value[id] || ''
      const selected = choices.find((choice) => choice.id === selectedSkuId)
      const sharedKeys = new Set(activeSharedDefinitions.value.filter((group) => group.itemIds.includes(id)).map((group) => group.id))
      const groups = specGroups(choices, selectedSkuId).filter((group) => !sharedKeys.has(group.id)).map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option, disabled: itemSharesSpecs(id) && !exactLocalChoice(choices, selectedSkuId, group.id, option.id) })),
      }))
      return {
        id,
        packageItemId: item.packageItemId != null && String(item.packageItemId) !== '' ? String(item.packageItemId) : '',
        spuId: item.spuId != null && String(item.spuId) !== '' ? String(item.spuId) : '',
        name: plainText(pickRaw(item.spuNameI18n)) || t('client.orderList.unknownService'),
        spec: specLabel(item.specI18n),
        times: t('client.home.packages.itemTimes', { count: Number(item.redeemTimes || 0) }),
        choices,
        options: choices.map((choice) => ({ id: choice.id, label: choice.label })),
        groups,
        sharedSummary: selected?.parts.filter((part) => sharedKeys.has(part.typeKey)).map((part) => part.valueLabel).join(' · ') || '',
        selectionSummary: selected?.label || specLabel(item.specI18n),
        selectable: Number(item.bindType) !== 2 && (Number(item.bindType) === 1 || choices.length > 0),
        selectedSkuId,
      }
    }),
  }
})

const galleryImages = computed(() => view.value?.images || [])
const heroImage = computed(() => galleryImages.value[selectedImageIndex.value] || '')

const showPreviousImage = () => {
  const count = galleryImages.value.length
  if (count <= 1) return
  selectedImageIndex.value = (selectedImageIndex.value - 1 + count) % count
}

const showNextImage = () => {
  const count = galleryImages.value.length
  if (count <= 1) return
  selectedImageIndex.value = (selectedImageIndex.value + 1) % count
}

const load = async (id: string) => {
  const requestSeq = ++loadRequestSeq
  loading.value = true
  missing.value = false
  detailPackageId.value = ''
  detail.value = null
  selectedImageIndex.value = 0
  activeDetailTab.value = 'description'
  if (!id) {
    missing.value = true
    loading.value = false
    return
  }
  try {
    const card = await packageDetail(id)
    if (requestSeq !== loadRequestSeq) return
    const hydrated = card ? await hydratePackageSpecIds(card, getProductDetail) : null
    if (requestSeq !== loadRequestSeq) return
    detailPackageId.value = id
    detail.value = hydrated
    missing.value = !view.value
  } catch (error) {
    if (requestSeq !== loadRequestSeq) return
    console.error('load package detail failed:', error)
    missing.value = true
  } finally {
    if (requestSeq === loadRequestSeq) loading.value = false
  }
}

const goBack = () => {
  if (window.history.state?.back) router.back()
  else void router.push({ name: props.platform === 'h5' ? 'h5-packages' : 'packages' })
}

const ensureLogin = async () => {
  const authSnapshot = getStoredAuthSnapshot()
  if (authSnapshot.isExpired) clearStoredAuthState()
  if (authSnapshot.isLoggedIn) return true
  await router.push({ name: routeNames.value.login, query: { redirect: route.fullPath } })
  return false
}

const selectSku = (itemId: string, skuId: string) => {
  if (selectionLocked.value) return
  const item = view.value?.items.find((entry) => entry.id === itemId)
  if (!item?.options.some((option) => option.id === skuId)) return
  const next = { ...selectedSkuIds.value, [itemId]: skuId }
  const choice = item.choices.find((choice) => choice.id === skuId)
  const patch = Object.fromEntries((choice?.parts || []).filter((part) => activeSharedDefinitions.value.some((group) => group.id === part.typeKey && group.itemIds.includes(itemId))).map((part) => [part.typeKey, part.valueKey]))
  const resolved = resolveSharedSpecs(specItems.value, activeSharedDefinitions.value, next, patch)
  if (resolved) selectedSkuIds.value = resolved
}

const selectSharedSpec = (typeKey: string, valueKey: string) => {
  if (selectionLocked.value) return
  const group = sharedGroups.value.find((group) => group.id === typeKey)
  if (!group?.options.some((option) => option.id === valueKey && !option.disabled)) return
  const next = resolveSharedSpecs(specItems.value, activeSharedDefinitions.value, selectedSkuIds.value, { [typeKey]: valueKey })
  if (next) selectedSkuIds.value = next
}

const toggleSeparateSpecs = () => {
  if (selectionLocked.value) return
  if (!separateSpecs.value) {
    separateSpecs.value = true
    return
  }
  const next = resolveSharedSpecs(specItems.value, sharedDefinitions.value, selectedSkuIds.value)
  if (!next) {
    ElMessage.warning(t('client.home.packages.sharedConflict'))
    return
  }
  separateSpecs.value = false
  selectedSkuIds.value = next
}

const selectSpec = (itemId: string, typeKey: string, valueKey: string) => {
  if (selectionLocked.value) return
  const item = view.value?.items.find((entry) => entry.id === itemId)
  if (!item?.groups.some((group) => group.id === typeKey && group.options.some((option) => option.id === valueKey && !option.disabled))) return
  const choices = item?.choices || []
  const current = choices.find((choice) => choice.id === item?.selectedSkuId) || choices[0]
  if (!current) return
  const desired = new Map(current.parts.map((part) => [part.typeKey, part.valueKey]))
  desired.set(typeKey, valueKey)
  const matches = (choice: SkuChoice) => choice.parts.every((part) => desired.get(part.typeKey) === part.valueKey)
  const exact = choices.find(matches)
  const partial = choices.find((choice) => choice.parts.some((part) => part.typeKey === typeKey && part.valueKey === valueKey))
  const next = itemSharesSpecs(itemId) ? exactLocalChoice(choices, item.selectedSkuId, typeKey, valueKey) : exact || partial
  if (!next) return
  selectedSkuIds.value = { ...selectedSkuIds.value, [itemId]: next.id }
}

const packageSelections = (): PackageSkuSelection[] => (pricePayload.value?.selections || []).map((selection) => ({ ...selection }))

const ensureSkuSelections = () => {
  if (pricePayload.value) return true
  ElMessage.warning(t('client.home.packages.chooseSkuRequired'))
  return false
}

const ensurePriceReady = () => {
  if (priceReady.value) return true
  ElMessage.warning(priceError.value || t('client.home.packages.priceLoading'))
  return false
}

const addToCart = async () => {
  const packageId = String(route.params.id || '').trim()
  if (!packageId || !view.value || missing.value || busy.value) return
  if (!ensureSkuSelections()) return
  if (!ensurePriceReady()) return
  const signature = priceSignature.value
  const selections = packageSelections()
  if (!(await ensureLogin())) return
  if (busy.value || !priceReady.value || signature !== priceSignature.value || !view.value || String(route.params.id || '').trim() !== packageId) return
  adding.value = true
  try {
    await addPackage(packageId, selections)
    if (String(route.params.id || '').trim() !== packageId) return
    ElMessage.success(t('client.home.packages.added'))
    await router.push({ name: routeNames.value.cart })
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.home.packages.addFailed'))
  } finally {
    adding.value = false
  }
}

const openCheckout = async () => {
  const packageId = String(route.params.id || '').trim()
  if (!packageId || !view.value || missing.value || busy.value) return
  if (!ensureSkuSelections()) return
  if (!ensurePriceReady()) return
  const signature = priceSignature.value
  const selections = packageSelections()
  if (!(await ensureLogin())) return
  if (busy.value || !priceReady.value || signature !== priceSignature.value || !view.value || String(route.params.id || '').trim() !== packageId) return
  const selectedPackage = view.value
  const titleI18n = Object.fromEntries(
    Object.entries(detail.value?.nameI18n || {})
      .map(([language, title]) => [language, plainText(title)]),
  )
  buying.value = true
  try {
    const createdOrderId = await createPackageOrder(packageId, selections)
    if (!/^[1-9]\d*$/.test(String(createdOrderId ?? ''))) {
      throw new Error(t('client.productDetail.booking.createOrderFailed'))
    }
    if (String(route.params.id || '').trim() !== packageId) return
    await router.push({
      name: routeNames.value.orderConfirm,
      query: {
        mode: 'package',
        packageId,
        orderId: String(createdOrderId),
        title: selectedPackage.title,
        titleI18n: JSON.stringify(titleI18n),
        specSummary: locale.value === 'zh' ? '下单时预约首次服务' : 'Book your first visit at checkout',
        imageUrls: JSON.stringify(selectedPackage.images),
        subtotal: String(selectedPackage.saleAmount),
        tax: String(selectedPackage.vat),
        total: String(selectedPackage.total),
      },
    })
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.productDetail.booking.createOrderFailed'))
  } finally {
    buying.value = false
  }
}

watch(detail, (card) => {
  separateSpecs.value = false
  const next: Record<string, string> = {}
  ;(card?.items || []).forEach((item, index) => {
    const id = itemKey(item, index)
    const options = (item.skuOptions || []).filter((option) => positiveId(option.skuId))
    if (!options.length) return
    const current = selectedSkuIds.value[id]
    const match = options.find((option) => String(option.skuId) === current)
    const selected = match || options[0]
    if (selected) next[id] = String(selected.skuId)
  })
  const items = specItemsFor(card)
  selectedSkuIds.value = resolveSharedSpecs(items, findSharedSpecs(items), next, {}, false) || next
}, { flush: 'sync' })

watch(priceSignature, () => { void loadPrice() }, { flush: 'sync' })
watch(() => String(route.params.id || ''), load, { immediate: true })
onBeforeUnmount(() => {
  loadRequestSeq += 1
  priceRequestSeq += 1
})
</script>

<style scoped lang="scss" src="../styles/product-detail.scss"></style>

<style scoped lang="scss">
.package-detail-state {
  min-height: 320px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 16px;
  color: #61738a;
  text-align: center;
}

.package-detail-state p { margin: 0; }
.package-detail-state a { color: var(--hourx-brand); }
.product-detail-back__link { text-decoration: none; }

.product-gallery:not(:has(.product-gallery__thumbs)) {
  grid-template-columns: minmax(0, 1fr);
}

.product-gallery__hero.is-empty {
  display: grid;
  place-items: center;
  background: var(--hourx-brand-soft);
}

.product-gallery__empty {
  color: var(--hourx-brand);
  font-size: 72px;
  font-weight: 800;
}

.package-includes {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.package-includes li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #e9eef5;
}

.package-includes strong,
.package-includes small {
  display: block;
}

.package-includes strong {
  color: #1b3049;
  font-size: 13px;
}

.package-includes small,
.package-includes em {
  color: #73859a;
  font-size: 12px;
  font-style: normal;
}

.booking-attach-item__meta { min-width: 0; }

.package-times {
  flex-shrink: 0;
  color: #73859a;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.package-shared-applied { display: block; margin-top: 6px; color: #527279; font-size: 11px; line-height: 1.5; }
.booking-card__scroll > .package-shared-specs { margin: 8px 16px; }

.booking-side .booking-card__hero { padding: 12px 16px 10px; }
.booking-side .booking-card__eyebrow { display: none; }
.booking-side .booking-card__hero h1 { margin-top: 0; font-size: 20px; line-height: 1.2; }
.booking-side .booking-card__meta { margin-top: 6px; gap: 8px; }
.booking-side .booking-card__hero .biz-tags { margin-top: 6px; gap: 4px; }
.booking-side .booking-card__trust svg { width: 14px; height: 14px; }
.booking-side .booking-price-card { margin: 8px 16px 0; padding: 8px 10px; }
.booking-side .package-shared-specs { padding: 10px 12px; }
.booking-side :deep(.package-shared-specs h3) { font-size: 13px; }
.booking-side :deep(.package-shared-specs__toggle) { font-size: 11px; }
.booking-side :deep(.package-shared-specs__group) {
  display: grid;
  grid-template-columns: fit-content(38%) minmax(0, 1fr);
  align-items: center;
  gap: 4px 8px;
  margin-top: 8px;
}
.booking-side :deep(.package-shared-specs__group > strong) { overflow-wrap: anywhere; font-size: 11px; }
.booking-side :deep(.package-shared-specs__options) { gap: 6px; margin-top: 0; }
.booking-side :deep(.package-shared-specs__options button) { min-height: 28px; padding: 4px 10px; font-size: 12px; line-height: 1.35; }
.booking-side :deep(.package-shared-specs__group > small) { grid-column: 1 / -1; margin-top: 0; font-size: 10px; line-height: 1.35; }
.booking-side .booking-card__section-heading { padding: 8px 16px 0; }
.booking-side .booking-card__section-heading h2 { font-size: 14px; }
.booking-side .booking-field { margin-top: 6px; padding: 0 16px; }
.booking-side .booking-attach-item { gap: 6px; }
.booking-side .booking-attach-item__meta { flex: 1 1 auto; flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; }
.booking-side .package-shared-applied { margin-top: 0; font-size: 10px; line-height: 1.35; }
.booking-side .package-times { align-self: flex-start; }
.booking-side .package-sku-groups { flex-basis: 100%; min-width: 0; gap: 6px; margin-top: 4px; }
.booking-side .package-sku-group { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.booking-side .package-sku-group__label { margin: 0; font-size: 11px; line-height: 1.35; }
.booking-side .package-sku-options { flex: 1 1 180px; gap: 6px; }
.booking-side .package-sku-option { min-height: 28px; padding: 4px 9px; font-size: 12px; line-height: 1.35; }
.booking-side .booking-summary { margin-top: 10px; padding: 10px 16px 8px; gap: 4px; }
.booking-side .booking-summary__caption { margin-bottom: 0; font-size: 13px; }
.booking-side .booking-summary__row { font-size: 11px; }
.booking-side .booking-summary__row > span small { display: none; }
.booking-side .booking-summary__row strong { font-size: 13px; }
.booking-side .booking-summary__row--total { margin-top: 2px; padding-top: 6px; }
.booking-side .booking-summary__row--total span { font-size: 15px; }
.booking-side .booking-summary__row--total strong { font-size: 20px; }
.booking-side .booking-card__footer .booking-actions { padding: 8px 16px 0; }
.booking-side .booking-add-cart,
.booking-side .booking-submit { height: 40px; }
.booking-side .booking-card__policy { margin: 6px 16px 8px; line-height: 1.25; }

.booking-price-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  padding: 10px 12px;
}
.booking-price-card__label { font-size: 9px; letter-spacing: .02em; white-space: nowrap; }
.booking-price-card__main { flex: 0 0 auto; gap: 4px; margin: 0; white-space: nowrap; }
.booking-price-card__main span { font-size: 11px; }
.booking-price-card__main strong { font-size: 22px; }
.booking-price-card__offer { gap: 6px; margin: 0; white-space: nowrap; }
.booking-price-card__offer del { font-size: 11px; }
.booking-price-card__offer span { min-height: 20px; padding: 2px 6px; font-size: 10px; }
.booking-price-card .package-price-status { flex-basis: 100%; margin: 0; }

.package-price-per-visit {
  margin: 0;
  color: #61738a;
  font-size: 11px;
  white-space: nowrap;
}

.package-visit-note {
  margin: 14px 20px 0;
  color: #7a8ba0;
  font-size: 12px;
  line-height: 1.45;
}

.package-price-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 12px;
  color: #61738a;
  font-size: 12px;
  line-height: 1.5;
}
.package-price-status.is-error { color: #a23928; }
.package-price-status button {
  padding: 5px 10px;
  color: var(--hourx-brand);
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font: inherit;
  cursor: pointer;
}
.package-sku-option:disabled { cursor: not-allowed; opacity: .6; }

.package-includes strong,
.package-includes small,
.booking-attach-item__name,
.booking-attach-item__price {
  overflow-wrap: anywhere;
}

.package-sku-groups {
  display: grid;
  gap: 10px;
  margin-top: 8px;
}

.package-sku-group__label {
  margin: 0 0 6px;
  color: #61738a;
  font-size: 12px;
  line-height: 1.4;
}

.package-sku-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.package-sku-option {
  border: 1px solid #d7dee8;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  color: #334155;
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
}

.package-sku-option.is-selected {
  border-color: var(--hourx-brand);
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  font-weight: 650;
}

</style>
