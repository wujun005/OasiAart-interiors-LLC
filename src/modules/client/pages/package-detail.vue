<template>
  <div class="package-detail-page">
    <PackageDetailMobile
      v-if="props.platform === 'h5'"
      :view="view"
      :loading="loading"
      :missing="missing"
      :busy="busy"
      :selected-image-index="selectedImageIndex"
      :cart-count="cartCount"
      @back="goBack"
      @cart="router.push({ name: routeNames.cart })"
      @image-change="selectedImageIndex = $event"
      @add-to-cart="addToCart"
      @checkout="openCheckout"
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
              <span v-if="view.badge" class="product-gallery__badge">{{ view.badge }}</span>
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
                    <small v-if="item.spec">{{ item.spec }}</small>
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

            <div class="booking-price-card">
              <span class="booking-price-card__label">{{ t('client.home.packages.dealPrice') }}</span>
              <div class="booking-price-card__main"><span>AED</span><strong>{{ view.saleAmount.toFixed(2) }}</strong></div>
              <div v-if="view.original" class="booking-price-card__offer">
                <del>AED {{ view.original }}</del>
                <span v-if="view.save">{{ view.save }}</span>
              </div>
              <p v-if="view.perVisit" class="package-price-per-visit">{{ view.perVisit }}</p>
            </div>

            <div class="booking-card__section-heading">
              <div class="booking-card__section-title-row">
                <h2>{{ t('client.home.packages.included') }}</h2>
                <p>{{ t('client.home.packages.visitLater') }}</p>
              </div>
            </div>

            <div v-if="view.items.length" class="booking-field">
              <div class="booking-attach-list">
                <div v-for="item in view.items" :key="`side-${item.id}`" class="booking-attach-item">
                  <div class="booking-attach-item__meta">
                    <span class="booking-attach-item__name">{{ item.name }}</span>
                    <span v-if="item.spec" class="booking-attach-item__price">{{ item.spec }}</span>
                  </div>
                  <span class="package-times">{{ item.times }}</span>
                </div>
              </div>
            </div>
            <p v-else class="booking-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>

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
              <button class="booking-add-cart" type="button" :disabled="busy" @click="addToCart">
                <svg class="booking-add-cart__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 4h2.2l1.7 9.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20 8H7" />
                  <circle cx="9.5" cy="19" r="1.3" />
                  <circle cx="17" cy="19" r="1.3" />
                  <path d="M14.5 3.5v5M12 6h5" />
                </svg>
                <span>{{ t('client.productDetail.booking.addToCart') }}</span>
              </button>
              <button class="booking-submit" type="button" :disabled="busy" @click="openCheckout">
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
import { computed, ref, watch } from 'vue'
import { bizTagLabels } from '@/modules/client/utils/biz-tag'
import { toPlainText as plainText } from '@/modules/client/utils/plain-text'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { createPackageOrder, packageDetail, type PackageCatalogCard } from '@/modules/client/api'
import { useCart } from '@/modules/client/composables/useCart'
import PackageDetailMobile from '@/modules/h5/components/PackageDetailMobile.vue'
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
const loading = ref(false)
const missing = ref(false)
let loadRequestSeq = 0
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
  const nextKey = detailTabOrder[nextIndex]
  activeDetailTab.value = nextKey
  const tabList = (event.currentTarget as HTMLElement).closest('[role="tablist"]')
  tabList?.querySelector<HTMLButtonElement>(`#package-detail-tab-${nextKey}`)?.focus()
}
const busy = computed(() => loading.value || adding.value || buying.value)
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

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const formatAed = (value: number) => `AED ${Number(value || 0).toFixed(2)}`

const view = computed(() => {
  const card = detail.value
  if (!card) return null
  const sale = amount(card.salePrice)
  if (sale == null || sale < 0) return null
  const original = amount(card.originalPrice)
  const saved = Math.max(0, amount(card.savedAmount) ?? (original != null ? original - sale : 0))
  const visits = Number(card.redeemTimes || 0)
  const name = plainText(pickRaw(card.nameI18n, card.packageName || ''))
  const vat = roundMoney(sale * 0.05)
  return {
    title: name,
    tags: bizTagLabels(card.tags, locale.value),
    mark: Array.from(name)[0] || 'H',
    category: plainText(pickRaw(card.categoryNameI18n)),
    badge: visits > 0 ? t('client.home.packages.visits', { count: visits }) : '',
    visits: visits > 0 ? t('client.home.packages.visits', { count: visits }) : '',
    descHtml: asHtml(pickRaw(card.descI18n, card.packageDesc || '')),
    aboutHtml: asHtml(pickRaw(card.serviceContentTextI18n)),
    noticeHtml: asHtml(pickRaw(card.bookingNoticeI18n)),
    saleAmount: sale,
    original: original != null && original > sale ? money(original) : '',
    perVisit: visits > 1 ? t('client.home.packages.perVisit', { price: money(sale / visits) }) : '',
    save: saved > 0 ? t('client.home.packages.save', { price: money(saved) }) : '',
    validDays: Number(card.validDays) > 0 ? t('client.home.packages.validDays', { days: card.validDays }) : '',
    vat,
    total: roundMoney(sale + vat),
    images: (card.imageUrls || []).map((url) => String(url || '').trim()).filter(Boolean),
    items: (card.items || []).map((item, index) => {
      const spec = (item.specI18n || [])
        .map((line) => {
          const type = plainText(pickRaw(line.specTypeNameI18n))
          const value = plainText(pickRaw(line.specValueNameI18n))
          return [type, value].filter(Boolean).join(': ')
        })
        .filter(Boolean)
        .join(' · ')
      return {
        id: String(item.packageItemId || item.skuId || index),
        name: plainText(pickRaw(item.spuNameI18n)) || t('client.orderList.unknownService'),
        spec,
        times: t('client.home.packages.itemTimes', { count: Number(item.redeemTimes || 0) }),
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
    detail.value = card
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

const addToCart = async () => {
  const packageId = String(route.params.id || '').trim()
  if (!packageId || !view.value || missing.value || busy.value) return
  if (!(await ensureLogin())) return
  if (busy.value || !view.value || String(route.params.id || '').trim() !== packageId) return
  adding.value = true
  try {
    await addPackage(packageId)
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
  if (!(await ensureLogin())) return
  if (busy.value || !view.value || String(route.params.id || '').trim() !== packageId) return
  const selectedPackage = view.value
  const titleI18n = Object.fromEntries(
    Object.entries(detail.value?.nameI18n || {})
      .map(([language, title]) => [language, plainText(title)]),
  )
  buying.value = true
  try {
    const createdOrderId = await createPackageOrder(packageId)
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

watch(() => String(route.params.id || ''), load, { immediate: true })
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
  align-items: center;
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

.package-price-per-visit {
  margin: 8px 0 0;
  color: #61738a;
  font-size: 12px;
}

.package-includes strong,
.package-includes small,
.booking-attach-item__name,
.booking-attach-item__price {
  overflow-wrap: anywhere;
}

</style>
