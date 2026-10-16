<template>
  <div class="product-detail-page">
    <section class="product-detail-subheader">
      <div class="product-detail-container">
        <nav class="product-detail-back" aria-label="breadcrumb">
          <RouterLink class="product-detail-back__link" to="/">
            {{ t('client.header.nav.home') }}
          </RouterLink>
          <span class="product-detail-back__separator" aria-hidden="true">&lt;</span>
          <span class="product-detail-back__current">{{ view?.title || t('client.home.packages.unavailable') }}</span>
        </nav>
      </div>
    </section>

    <section class="product-detail-body">
      <div v-if="missing" class="product-detail-container">
        <p class="product-card__empty">{{ t('client.home.packages.unavailable') }}</p>
      </div>

      <div v-else-if="view" class="product-detail-container product-detail-layout">
        <div class="product-main">
          <section class="product-gallery">
            <div v-if="galleryImages.length > 1" class="product-gallery__thumbs">
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

          <section class="product-card product-card--overview">
            <div class="product-section-heading">
              <span class="product-section-heading__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 19h14M7 16V8l5-4 5 4v8M10 16v-4h4v4" />
                </svg>
              </span>
              <div>
                <span>{{ t('client.productDetail.pageTitle') }}</span>
                <h2>{{ t('client.productDetail.serviceDescription') }}</h2>
              </div>
            </div>
            <div class="product-card__desc">
              <div v-if="view.descHtml" class="product-rich-text" v-html="view.descHtml" />
              <p v-else class="product-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
            </div>
          </section>

          <div class="product-info-grid">
            <section class="product-card product-card--compact">
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

            <section class="product-card product-card--compact">
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
          </div>
        </div>

        <aside class="booking-side">
          <section class="booking-card">
            <div class="booking-card__hero">
              <span class="booking-card__eyebrow">{{ t('client.productDetail.pageTitle') }}</span>
              <h1>{{ view.title }}</h1>
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

            <div class="booking-card__section-heading">
              <h2>{{ t('client.home.packages.included') }}</h2>
              <p>{{ t('client.home.packages.visitLater') }}</p>
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
          </section>
        </aside>
      </div>
    </section>

    <el-dialog
      v-model="checkoutVisible"
      class="package-checkout-dialog"
      :title="t('client.cart.checkoutDialog.title')"
      width="min(560px, calc(100vw - 28px))"
    >
      <div v-if="view" class="checkout-dialog__scroll">
        <div class="checkout-dialog__items">
          <div>
            <span>{{ view.title }}</span>
            <strong>{{ formatAed(view.saleAmount) }}</strong>
          </div>
        </div>
        <dl class="checkout-dialog__total">
          <div>
            <dt>{{ t('client.cart.subtotal') }}</dt>
            <dd>{{ formatAed(view.saleAmount) }}</dd>
          </div>
          <div>
            <dt>{{ t('client.cart.vat') }}</dt>
            <dd>{{ formatAed(view.vat) }}</dd>
          </div>
          <div>
            <dt>{{ t('client.cart.estimatedTotal') }}</dt>
            <dd>{{ formatAed(view.total) }}</dd>
          </div>
        </dl>
        <BookingPolicyDetails
          class="checkout-dialog__policy"
          compact
          show-intro
          :agreed="checkoutPolicyAgreed"
          @update:agreed="checkoutPolicyAgreed = $event"
          @read-policy="openLegal('terms')"
        />
      </div>
      <template #footer>
        <button class="dialog-secondary" type="button" @click="checkoutVisible = false">
          {{ t('client.cart.checkoutDialog.cancel') }}
        </button>
        <button class="dialog-primary" type="button" :disabled="!checkoutPolicyAgreed || buying" @click="confirmCheckout">
          {{ t('client.cart.checkoutDialog.confirm') }}
        </button>
      </template>
    </el-dialog>
    <StripePaymentModal
      :visible="stripeVisible"
      :client-secret="stripeClientSecret"
      :customer-session-client-secret="stripeCustomerSessionClientSecret"
      :locale="locale"
      :subtotal="view?.saleAmount || 0"
      :tax="view?.vat || 0"
      :total="view?.total || 0"
      @close="stripeVisible = false"
      @error="handleStripeError"
      @paid="handlePaymentSuccess"
    />
    <AgreementDialog v-model="legalDialogVisible" :doc-type="legalDocType" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { checkoutCart, packageDetail, type PackageCatalogCard } from '@/modules/client/api'
import StripePaymentModal from '@/modules/client/components/StripePaymentModal.vue'
import AgreementDialog from '@/modules/client/components/agreement-dialog.vue'
import BookingPolicyDetails from '@/modules/client/components/booking-policy-details.vue'
import { useCart } from '@/modules/client/composables/useCart'
import type { LegalDocType } from '@/modules/client/constants/legal'
import { getStoredAuthSnapshot, clearStoredAuthState } from '@/utils/auth-state'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const { addPackage, removeItems } = useCart()
const detail = ref<PackageCatalogCard | null>(null)
const missing = ref(false)
const adding = ref(false)
const buying = ref(false)
const checkoutVisible = ref(false)
const checkoutPolicyAgreed = ref(false)
const stripeVisible = ref(false)
const stripeClientSecret = ref('')
const stripeCustomerSessionClientSecret = ref('')
const legalDialogVisible = ref(false)
const legalDocType = ref<LegalDocType>('terms')
const checkedOutItemIds = ref<string[]>([])
const checkoutSummary = ref({ orderNo: '', orderId: '', service: '', scheduled: '', amount: '' })
const selectedImageIndex = ref(0)
const busy = computed(() => adding.value || buying.value)

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

const plainText = (value: string) => {
  let text = String(value || '').trim()
  if (!text) return ''
  if (typeof DOMParser !== 'undefined') {
    const readable = text.replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6])\s*>/gi, ' ')
    text = new DOMParser().parseFromString(readable, 'text/html').body.textContent || text
  }
  return text.replace(/<\/?[a-z][^>]*>/gi, ' ').replace(/\s+/g, ' ').trim()
}

const asHtml = (value: string) => {
  const text = String(value || '').trim()
  if (!text) return ''
  return /<[a-z][\s\S]*>/i.test(text) ? text : `<p>${text}</p>`
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

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const formatAed = (value: number) => `AED ${Number(value || 0).toFixed(2)}`

const view = computed(() => {
  const card = detail.value
  if (!card) return null
  const sale = amount(card.salePrice)
  if (sale == null) return null
  const original = amount(card.originalPrice)
  const saved = Math.max(0, amount(card.savedAmount) ?? (original != null ? original - sale : 0))
  const visits = Number(card.redeemTimes || 0)
  const name = plainText(pickRaw(card.nameI18n, card.packageName || ''))
  const vat = roundMoney(sale * 0.05)
  return {
    title: name,
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
  missing.value = false
  detail.value = null
  selectedImageIndex.value = 0
  if (!id) {
    missing.value = true
    return
  }
  try {
    const card = await packageDetail(id)
    detail.value = card
    missing.value = !card || amount(card.salePrice) == null
  } catch (error) {
    console.error('load package detail failed:', error)
    missing.value = true
  }
}

const ensureLogin = async () => {
  const authSnapshot = getStoredAuthSnapshot()
  if (authSnapshot.isExpired) clearStoredAuthState()
  if (authSnapshot.isLoggedIn) return true
  await router.push({ name: 'login', query: { redirect: route.fullPath } })
  return false
}

const addToCart = async () => {
  const packageId = String(route.params.id || '').trim()
  if (!packageId || busy.value) return
  if (!(await ensureLogin())) return
  adding.value = true
  try {
    await addPackage(packageId)
    ElMessage.success(t('client.home.packages.added'))
    await router.push({ name: 'cart' })
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.home.packages.addFailed'))
  } finally {
    adding.value = false
  }
}

const openCheckout = async () => {
  if (!view.value || busy.value) return
  if (!(await ensureLogin())) return
  checkoutPolicyAgreed.value = false
  checkoutVisible.value = true
}

const openLegal = (docType: LegalDocType) => {
  legalDocType.value = docType
  legalDialogVisible.value = true
}

const confirmCheckout = async () => {
  const packageId = String(route.params.id || '').trim()
  if (!packageId || !view.value || !checkoutPolicyAgreed.value || buying.value) return
  buying.value = true
  try {
    const cartItem = await addPackage(packageId)
    const cartItemId = String(cartItem?.cartItemId || '').trim()
    if (!cartItemId) {
      throw new Error(t('client.productDetail.booking.createOrderFailed'))
    }
    checkedOutItemIds.value = [cartItemId]
    const result = await checkoutCart([cartItemId], 'STRIPE', window.location.href)
    const payment = result?.payment
    checkoutSummary.value = {
      orderNo: (result?.orderNos || []).join(', '),
      orderId: (result?.orderIds || []).join(', '),
      service: view.value.title,
      scheduled: t('client.home.packages.visitLater'),
      amount: String(result?.totalAmount || view.value.total || ''),
    }
    const approvalUrl = String(payment?.approvalUrl || '').trim()
    const clientSecret = String(payment?.clientSecret || '').trim()
    if (approvalUrl) {
      window.location.href = approvalUrl
      return
    }
    if (!clientSecret) {
      throw new Error(locale.value === 'zh' ? '未获取到支付参数' : 'Missing payment parameters')
    }
    checkoutVisible.value = false
    stripeClientSecret.value = clientSecret
    stripeCustomerSessionClientSecret.value = String(payment?.customerSessionClientSecret || '').trim()
    stripeVisible.value = true
  } catch (error: any) {
    checkedOutItemIds.value = []
    ElMessage.error(error?.message || t('client.productDetail.booking.createOrderFailed'))
  } finally {
    buying.value = false
  }
}

const handleStripeError = (message: string) => ElMessage.error(message)

const handlePaymentSuccess = async () => {
  stripeVisible.value = false
  const completedIds = [...checkedOutItemIds.value]
  checkedOutItemIds.value = []
  try {
    if (completedIds.length) await removeItems(completedIds)
  } catch (error) {
    console.warn('Payment succeeded but refreshing the cart failed:', error)
  }
  ElMessage.success(locale.value === 'zh' ? '支付成功' : 'Payment successful')
  window.setTimeout(() => void router.push({ name: 'booking-success', query: checkoutSummary.value }), 2000)
}

watch(() => String(route.params.id || ''), load, { immediate: true })
</script>

<style scoped lang="scss">
.product-detail-page {
  min-height: 100%;
  background:
    radial-gradient(circle at 82% 4%, rgba(5, 21, 43, 0.05), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f8fc 48%, #f7f9fc 100%);
}

.product-detail-subheader {
  height: 58px;
  background: rgba(255, 255, 255, 0.88);
  border-top: 1px solid #eef2f7;
  border-bottom: 1px solid #e7edf4;
}

.product-detail-container {
  width: min(1480px, calc(100% - clamp(32px, 4vw, 72px)));
  margin: 0 auto;
}

.product-detail-back {
  height: 58px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(15, 23, 42, 0.78);
  font-size: 14px;
  font-weight: 650;
}

.product-detail-back__link {
  color: #58708d;
  font-weight: 700;
  text-decoration: none;
}

.product-detail-back__separator {
  color: #a4b1c2;
}

.product-detail-back__current {
  color: rgba(15, 23, 42, 0.88);
  font-weight: 700;
}

.product-detail-body {
  padding: 22px 0 64px;
}

.product-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(400px, 0.82fr);
  gap: clamp(20px, 2vw, 30px);
  align-items: start;
}

.product-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.product-gallery {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 14px;
}

.product-gallery:not(:has(.product-gallery__thumbs)) {
  grid-template-columns: minmax(0, 1fr);
}

.product-gallery__thumbs {
  display: flex;
  flex-direction: column;
  gap: 9px;
  max-height: 430px;
  overflow: auto;
}

.product-gallery__thumb {
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 14px rgba(7, 27, 51, 0.08);
  cursor: pointer;
}

.product-gallery__thumb img,
.product-gallery__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-gallery__hero.is-empty {
  display: grid;
  place-items: center;
  background:
    radial-gradient(120px 80px at 18% 18%, rgba(255, 244, 220, 0.7), transparent 70%),
    linear-gradient(155deg, #1c334f 0%, #10233f 58%, #2a2118 100%);
}

.product-gallery__empty {
  color: rgba(255, 248, 236, 0.88);
  font-family: "Iowan Old Style", "Songti SC", "Noto Serif SC", Georgia, serif;
  font-size: 72px;
}

.product-gallery__thumb--active {
  border-color: var(--hourx-brand);
  box-shadow: 0 0 0 2px rgba(5, 21, 43, 0.12);
}

.product-gallery__hero {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid rgba(209, 219, 231, 0.8);
  border-radius: 18px;
  background: #e5e7eb;
  box-shadow: 0 16px 40px rgba(7, 27, 51, 0.1);
}

.product-gallery__arrow {
  position: absolute;
  z-index: 2;
  top: 50%;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 50%;
  background: rgba(5, 21, 43, 0.7);
  color: #fff;
  transform: translateY(-50%);
  cursor: pointer;
}

.product-gallery__arrow--prev { left: 16px; }
.product-gallery__arrow--next { right: 16px; }

.product-gallery__arrow svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.product-gallery__badge {
  position: absolute;
  top: 16px;
  left: 16px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--hourx-brand);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.product-gallery__dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  display: flex;
  gap: 8px;
  transform: translateX(-50%);
}

.product-gallery__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.product-gallery__dot--active {
  width: 10px;
  height: 10px;
  border-color: #fff;
  background: #fff;
}

.product-trust-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 54px;
  border: 1px solid #e5ecf4;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(7, 27, 51, 0.05);
}

.product-trust-strip__item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 14px;
  color: #52647b;
  font-size: 12px;
  font-weight: 700;
}

.product-trust-strip__item + .product-trust-strip__item {
  border-left: 1px solid #e9eef5;
}

.product-trust-strip__item svg {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  fill: none;
  stroke: var(--hourx-brand);
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.product-card {
  padding: 26px;
  border: 1px solid #e6edf5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(7, 27, 51, 0.055);
}

.product-card h2 {
  margin: 0;
  color: #10233e;
  font-size: 18px;
  font-weight: 850;
}

.product-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.product-section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-section-heading > div > span {
  display: block;
  margin-bottom: 3px;
  color: #7c8ba0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.product-section-heading__icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
}

.product-section-heading__icon svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.product-card__empty {
  margin: 16px 0 0;
  color: rgba(15, 23, 42, 0.35);
}

.product-rich-text {
  margin-top: 18px;
  color: #52647b;
  font-size: 14px;
  line-height: 1.72;
  overflow-wrap: anywhere;
}

.product-rich-text :deep(p) {
  margin: 6px 0;
}

.product-rich-text :deep(ul),
.product-rich-text :deep(ol) {
  margin: 10px 0 0;
  padding-left: 19px;
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

.booking-side {
  position: sticky;
  top: 92px;
}

.booking-card {
  overflow: hidden;
  border: 1px solid #e2eaf3;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 20px 52px rgba(7, 27, 51, 0.12);
}

.booking-card__hero {
  padding: 26px 26px 22px;
  border-bottom: 1px solid #e9eef5;
  background:
    radial-gradient(circle at 100% 0, rgba(5, 21, 43, 0.06), transparent 38%),
    linear-gradient(180deg, #fff 0%, #fbfdff 100%);
}

.booking-card__eyebrow {
  color: var(--hourx-brand);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.booking-card__hero h1 {
  margin: 8px 0 0;
  color: #071b33;
  font-size: clamp(22px, 1.7vw, 26px);
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.booking-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 13px;
}

.booking-card__rating {
  display: flex;
  align-items: center;
  gap: 6px;
}

.booking-card__rating strong {
  color: var(--hourx-brand);
  font-size: 12px;
}

.booking-card__rating small,
.booking-card__trust {
  color: #4c6279;
  font-size: 11px;
  font-weight: 700;
}

.booking-card__trust {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.booking-card__trust svg,
.booking-card__policy svg {
  fill: none;
  stroke: var(--hourx-brand);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.booking-card__trust svg {
  width: 16px;
  height: 16px;
}

.booking-card__section-heading,
.booking-field,
.booking-summary,
.booking-actions {
  padding-right: 26px;
  padding-left: 26px;
}

.booking-card__section-heading {
  padding-top: 22px;
}

.booking-card__section-heading h2 {
  margin: 0;
  color: #10233e;
  font-size: 18px;
  font-weight: 850;
}

.booking-card__section-heading p,
.booking-card__empty {
  margin: 5px 0 0;
  color: #7a8ba0;
  font-size: 12px;
  line-height: 1.45;
}

.booking-card__empty {
  margin: 18px 26px 0;
}

.booking-field {
  margin-top: 18px;
}

.booking-attach-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.booking-attach-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 12px;
  border: 1px solid #e0e8f1;
  border-radius: 12px;
  background: #fbfcfe;
}

.booking-attach-item__name {
  display: block;
  color: #1b3049;
  font-size: 13px;
  font-weight: 750;
}

.booking-attach-item__price,
.package-times {
  color: #73859a;
  font-size: 11px;
  font-weight: 600;
}

.package-times {
  white-space: nowrap;
}

.booking-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9eef5;
}

.booking-summary__caption {
  margin-bottom: 4px;
  color: #10233e;
  font-size: 16px;
  font-weight: 850;
}

.booking-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #66788e;
  font-size: 13px;
}

.booking-summary__row > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.booking-summary__row > span small {
  color: #91a0b2;
  font-size: 11px;
}

.booking-summary__row > span small.is-original {
  text-decoration: line-through;
}

.booking-summary__row strong {
  color: rgba(15, 23, 42, 0.86);
  font-size: 14px;
  white-space: nowrap;
}

.booking-summary__row--tax span {
  color: var(--hourx-brand);
}

.booking-summary__row--total {
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid #e3eaf2;
}

.booking-summary__row--total span {
  color: #10233e;
  font-size: 17px;
  font-weight: 800;
}

.booking-summary__row--total strong {
  color: var(--hourx-brand);
  font-size: 24px;
  font-weight: 900;
}

.booking-actions {
  display: grid;
  gap: 9px;
  margin-top: 20px;
}

.booking-add-cart,
.booking-submit {
  position: relative;
  display: inline-flex;
  width: 100%;
  min-width: 0;
  height: 50px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.booking-add-cart {
  order: 2;
  border: 1px solid #cbd7e4;
  background: #fff;
  color: #17314e;
  box-shadow: none;
}

.booking-add-cart__icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.booking-submit {
  order: 1;
  gap: 10px;
  border: 1px solid var(--hourx-brand);
  background: linear-gradient(135deg, var(--hourx-brand-hover) 0%, var(--hourx-brand) 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(5, 21, 43, 0.18);
}

.booking-add-cart:hover:not(:disabled) {
  border-color: #93a7bd;
  background: #f7fafd;
  box-shadow: 0 8px 18px rgba(5, 21, 43, 0.12);
  transform: translateY(-1px);
}

.booking-submit:hover:not(:disabled) {
  box-shadow: 0 14px 28px rgba(5, 21, 43, 0.24);
  transform: translateY(-1px);
}

.booking-add-cart:disabled,
.booking-submit:disabled,
.dialog-primary:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.booking-submit svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.booking-card__policy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 14px 26px 22px;
  color: #7a8ba0;
  font-size: 11px;
  text-align: center;
}

.booking-card__policy svg {
  width: 15px;
  height: 15px;
  stroke: #71849a;
}

.checkout-dialog__scroll {
  max-height: min(68vh, 720px);
  overflow-y: auto;
  padding-right: 6px;
}

.checkout-dialog__items {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: #f6f8fb;
}

.checkout-dialog__items > div,
.checkout-dialog__total > div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  color: #48576c;
  font-size: 13px;
}

.checkout-dialog__total {
  display: grid;
  gap: 9px;
  margin: 18px 0 0;
}

.checkout-dialog__total dt,
.checkout-dialog__total dd {
  margin: 0;
}

.checkout-dialog__total > div:last-child {
  padding-top: 10px;
  border-top: 1px solid #e4e9f0;
  color: #05152b;
  font-size: 16px;
  font-weight: 900;
}

.checkout-dialog__policy {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
}

.dialog-primary,
.dialog-secondary {
  min-width: 120px;
  height: 42px;
  border-radius: 10px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.dialog-primary {
  border: 1px solid #05152b;
  background: #05152b;
  color: #fff;
}

.dialog-secondary {
  margin-right: 8px;
  border: 1px solid #dbe2eb;
  background: #fff;
  color: #526176;
}

@media (max-width: 1180px) {
  .product-detail-layout {
    grid-template-columns: minmax(0, 1fr) clamp(350px, 35vw, 390px);
  }
}

@media (max-width: 820px) {
  .product-detail-layout,
  .product-gallery,
  .product-info-grid {
    grid-template-columns: 1fr;
  }

  .booking-side {
    position: static;
  }

  .product-detail-container {
    width: calc(100% - 32px);
  }

  .product-gallery__thumbs {
    order: 2;
    flex-direction: row;
    max-height: none;
  }

  .product-gallery__hero {
    height: clamp(220px, 52vw, 380px);
    aspect-ratio: auto;
  }
}
</style>
