<template>
  <div class="product-detail-page">
    <section class="product-detail-subheader">
      <div class="product-detail-container">
        <nav class="product-detail-back" aria-label="breadcrumb">
          <button
            class="product-detail-back__link"
            type="button"
            @click="goServicesHome"
          >
            {{ t("client.header.nav.services") }}
          </button>
          <span class="product-detail-back__separator" aria-hidden="true"
            >&lt;</span
          >
          <template v-if="parentBreadcrumbTitle">
            <button
              class="product-detail-back__link"
              type="button"
              @click="goServiceList"
            >
              {{ parentBreadcrumbTitle }}
            </button>
            <span class="product-detail-back__separator" aria-hidden="true"
              >&lt;</span
            >
          </template>
          <span class="product-detail-back__current">{{ displayTitle }}</span>
        </nav>
      </div>
    </section>

    <section class="product-detail-body">
      <div class="product-detail-container product-detail-layout">
        <div class="product-main">
          <section class="product-gallery">
            <div class="product-gallery__thumbs">
              <button
                v-for="(image, index) in galleryImages"
                :key="`thumb-${index}`"
                class="product-gallery__thumb"
                :class="{
                  'product-gallery__thumb--active':
                    index === selectedImageIndex,
                }"
                type="button"
                @click="selectedImageIndex = index"
              >
                <img :src="image" :alt="displayTitle" />
              </button>
            </div>

            <div class="product-gallery__hero">
              <img :src="heroImage" :alt="displayTitle" />
              <button
                v-if="galleryImages.length > 1"
                class="product-gallery__arrow product-gallery__arrow--prev"
                type="button"
                :aria-label="t('client.productDetail.previousImage')"
                @click="showPreviousImage"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                v-if="galleryImages.length > 1"
                class="product-gallery__arrow product-gallery__arrow--next"
                type="button"
                :aria-label="t('client.productDetail.nextImage')"
                @click="showNextImage"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <span class="product-gallery__badge">
                {{ t("client.productDetail.badge") }}
              </span>
              <div class="product-gallery__dots">
                <button
                  v-for="(image, index) in galleryImages"
                  :key="`dot-${index}`"
                  type="button"
                  class="product-gallery__dot"
                  :class="{
                    'product-gallery__dot--active':
                      index === selectedImageIndex,
                  }"
                  :aria-label="`${displayTitle} image ${index + 1}`"
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
              <span>{{ t("client.productDetail.trust.professional") }}</span>
            </div>
            <div class="product-trust-strip__item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
              <span>{{ t("client.productDetail.trust.flexible") }}</span>
            </div>
            <div class="product-trust-strip__item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-3.1-6.3" />
                <path d="m20 4-8.5 8.5L8 9" />
              </svg>
              <span>{{ t("client.productDetail.trust.clearPricing") }}</span>
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
                <span>{{ t("client.productDetail.pageTitle") }}</span>
                <h2>{{ t("client.productDetail.serviceDescription") }}</h2>
              </div>
            </div>
            <div class="product-card__desc">
              <p v-if="isLoading">{{ t("client.productDetail.loading") }}</p>
              <div
                v-else-if="serviceDescriptionHtml"
                class="product-rich-text"
                v-html="serviceDescriptionHtml"
              />
              <p v-else class="product-card__empty">
                {{ t("client.productDetail.emptyDesc") }}
              </p>
            </div>
          </section>

          <div class="product-info-grid">
            <section class="product-card product-card--compact">
              <div class="product-section-heading">
                <span class="product-section-heading__icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </span>
                <h2>{{ t("client.productDetail.includesTitle") }}</h2>
              </div>
              <div
                v-if="serviceContentHtml"
                class="product-rich-text"
                v-html="serviceContentHtml"
              />
              <p v-else class="product-card__empty">
                {{ t("client.productDetail.emptyDesc") }}
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
                <h2>{{ t("client.productDetail.noticeTitle") }}</h2>
              </div>
              <div
                v-if="bookingNoticeHtml"
                class="product-rich-text"
                v-html="bookingNoticeHtml"
              />
              <p v-else class="product-card__empty">
                {{ t("client.productDetail.emptyDesc") }}
              </p>
            </section>
          </div>

          <section class="product-card">
            <div class="product-reviews-heading">
              <div class="product-section-heading">
                <span class="product-section-heading__icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                  </svg>
                </span>
                <h2>{{ t("client.productDetail.reviewsTitle") }}</h2>
              </div>
              <div v-if="reviewCount" class="product-reviews-heading__score">
                <strong>{{ averageRating.toFixed(1) }}</strong>
                <span>{{ t("client.productDetail.reviewCount", { count: reviewCount }) }}</span>
              </div>
            </div>
            <div v-if="reviewItems.length" class="product-review-list">
              <article
                v-for="(item, index) in reviewItems"
                :key="`${item.commenter}-${item.commentTime}-${index}`"
                class="product-review"
              >
                <div class="product-review__avatar">
                  <img
                    v-if="item.avatarUrl"
                    :src="item.avatarUrl"
                    :alt="item.commenter"
                  />
                  <span v-else>{{ item.avatarText }}</span>
                </div>
                <div class="product-review__content">
                  <div class="product-review__head">
                    <strong>{{ item.commenter }}</strong>
                    <el-rate
                      class="product-review__rating"
                      :model-value="item.rating"
                      :max="5"
                      disabled
                      show-score
                      score-template="{value}/5"
                    />
                  </div>
                  <p>{{ item.content }}</p>
                  <span v-if="item.commentTime" class="product-review__time">{{
                    item.commentTime
                  }}</span>
                </div>
              </article>
            </div>
            <p v-else class="product-card__empty">
              {{ t("client.productDetail.emptyReviews") }}
            </p>
          </section>
        </div>

        <aside class="booking-side">
          <section class="booking-card">
            <div class="booking-card__hero">
              <span class="booking-card__eyebrow">{{
                t("client.productDetail.pageTitle")
              }}</span>
              <h1>{{ displayTitle }}</h1>
              <div class="booking-card__meta">
                <div v-if="reviewCount" class="booking-card__rating">
                  <span aria-hidden="true">★★★★★</span>
                  <strong>{{ averageRating.toFixed(1) }}</strong>
                  <small>{{
                    t("client.productDetail.reviewCount", { count: reviewCount })
                  }}</small>
                </div>
                <span class="booking-card__trust">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 5 6v5c0 4.8 2.9 8.2 7 10 4.1-1.8 7-5.2 7-10V6l-7-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {{ t("client.productDetail.trust.trusted") }}
                </span>
              </div>
              <div class="booking-card__price">
                <span>{{ t("client.productDetail.booking.priceFrom") }}</span>
                <strong>{{ formatAed(basePrice) }}</strong>
              </div>
            </div>

            <div class="booking-card__section-heading">
              <h2>{{ t("client.productDetail.booking.chooseTitle") }}</h2>
              <p>{{ t("client.productDetail.booking.chooseHint") }}</p>
            </div>

            <template v-if="bookingSpecGroups.length">
              <div
                v-for="group in bookingSpecGroups"
                :key="group.typeId"
                class="booking-field"
              >
                <p>{{ group.label }}</p>
                <div class="booking-options">
                  <button
                    v-for="option in group.options"
                    :key="`${group.typeId}-${option.id}`"
                    class="booking-option"
                    :class="{
                      'booking-option--active':
                        selectedSpecValues[group.typeId] === option.id,
                    }"
                    type="button"
                    @click="selectSpecValue(group.typeId, option.id)"
                  >
                    <span class="booking-option__topline">
                      <span class="booking-option__name">{{ option.label }}</span>
                      <svg
                        v-if="selectedSpecValues[group.typeId] === option.id"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m8 12 2.5 2.5L16 9" />
                      </svg>
                    </span>
                    <small v-if="option.remark" class="booking-option__remark">
                      {{ option.remark }}
                    </small>
                  </button>
                </div>
              </div>
            </template>

            <template v-if="bookingAttachGroups.length">
              <div class="booking-card__section-heading booking-card__section-heading--addons">
                <h2>{{ t("client.productDetail.booking.addOnsTitle") }}</h2>
                <p>{{ t("client.productDetail.booking.addOnsHint") }}</p>
              </div>
              <div
                v-for="group in bookingAttachGroups"
                :key="group.typeId"
                class="booking-field"
              >
                <p>{{ group.label }}</p>
                <div class="booking-attach-list">
                  <div
                    v-for="option in group.options"
                    :key="`${group.typeId}-${option.id}`"
                    class="booking-attach-item"
                  >
                    <div class="booking-attach-item__meta">
                      <span class="booking-attach-item__name">{{
                        option.label
                      }}</span>
                      <span class="booking-attach-item__price">
                        {{
                          t("client.productDetail.booking.attachUnitPrice", {
                            price: option.price.toFixed(2),
                          })
                        }}
                      </span>
                    </div>
                    <div class="booking-attach-item__stepper">
                      <button
                        class="booking-option booking-option--step"
                        type="button"
                        @click="decreaseAttachQty(option.id)"
                      >
                        -
                      </button>
                      <button
                        class="booking-option booking-option--step booking-option--readonly"
                        type="button"
                        disabled
                      >
                        {{ attachQuantities[option.id] || 0 }}
                      </button>
                      <button
                        class="booking-option booking-option--step"
                        type="button"
                        @click="increaseAttachQty(option.id)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <p
              v-if="!bookingSpecGroups.length && !bookingAttachGroups.length"
              class="booking-card__empty"
            >
              {{ t("client.productDetail.emptyDesc") }}
            </p>

            <div class="booking-summary">
              <div class="booking-summary__caption">
                {{ t("client.productDetail.booking.summaryTitle") }}
              </div>
              <div class="booking-summary__row">
                <span>
                  {{ t("client.productDetail.booking.selectedService") }}
                  <small v-if="selectedSpecSummary">{{ selectedSpecSummary }}</small>
                </span>
                <strong>{{ formatAed(basePrice) }}</strong>
              </div>
              <div v-if="attachTotalPrice > 0" class="booking-summary__row">
                <span>{{ t("client.productDetail.booking.attachTotal") }}</span>
                <strong>{{ formatAed(attachTotalPrice) }}</strong>
              </div>
              <div class="booking-summary__row booking-summary__row--total">
                <span>{{ t("client.productDetail.booking.total") }}</span>
                <strong>{{ formatAed(totalPrice) }}</strong>
              </div>
            </div>

            <div class="booking-actions">
              <button
                class="booking-add-cart"
                type="button"
                @click="handleAddToCart"
              >
                <svg
                  class="booking-add-cart__icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M3 4h2.2l1.7 9.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20 8H7"
                  />
                  <circle cx="9.5" cy="19" r="1.3" />
                  <circle cx="17" cy="19" r="1.3" />
                  <path d="M14.5 3.5v5M12 6h5" />
                </svg>
                <span>{{ t("client.productDetail.booking.addToCart") }}</span>
              </button>
              <button
                class="booking-submit"
                type="button"
                :disabled="isCreatingOrder"
                @click="goOrderConfirm"
              >
                {{ t("client.productDetail.booking.bookNow") }}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M14 7l5 5-5 5" />
                </svg>
              </button>
            </div>
            <p class="booking-card__policy">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
              {{ t("client.productDetail.booking.flexiblePolicy") }}
            </p>
          </section>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus"
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import {
  getProductDetail,
  getProductSku,
  createOrder,
} from "@/modules/client/api"
import { formatCreatedAt } from "@/modules/client/utils/order-date-time"
import { formatContactName } from "@/modules/client/utils/order-localization"
import { clearStoredAuthState, getStoredAuthSnapshot } from "@/utils/auth-state"

type I18nText = Record<string, string>
type I18nTextArray = Record<string, string[] | string>
type SpecValueI18nEntry = {
  remarkI18n?: I18nText
  [key: string]: string | I18nText | undefined
}

type ProductDetailRecord = {
  id?: number | string
  spuId?: number | string
  imageUrls?: string[]
  nameI18n?: I18nText
  descI18n?: I18nText
  serviceContentI18n?: I18nTextArray
  serviceContentTextI18n?: I18nText
  bookingNoticeI18n?: I18nText
  specBindings?: Array<{
    specTypeId?: number | string
    specValueIds?: Array<number | string>
  }>
  specTypeNameI18n?: Record<string, I18nText>
  specValueNameI18n?: Record<string, SpecValueI18nEntry>
  specValueRemarkI18n?: Record<string, I18nText>
  attachBindings?: Array<{
    attachTypeId?: number | string
    attachValueIds?: Array<number | string>
  }>
  attachTypeNameI18n?: Record<string, I18nText>
  attachValueNameI18n?: Record<string, I18nText>
  reviewList?: Array<{
    rating?: number | string
    content?: string
    firstName?: string
    lastName?: string
    customerName?: string
    reviewerName?: string
    fullName?: string
    customerFullName?: string
    nickname?: string
    displayName?: string
    userName?: string
    name?: string
    commenter?: string
    avatarUrl?: string | null
    commentTime?: string
    user?: {
      firstName?: string
      lastName?: string
      name?: string
      nickname?: string
    }
  }>
  minPrice?: number | string
  price?: number | string
  [key: string]: unknown
}

type ProductSkuPayload = {
  spuId: number | string
  specValueIds: Array<number | string>
  attachItems: Array<{
    attachValueId: number | string
    quantity: number
  }>
}

type ProductSkuRecord = {
  skuId?: number | string
  skuCode?: string
  originalPrice?: number | string
  price?: number | string
  totalOriginalPrice?: number | string
  totalPrice?: number | string
  originalPriceWithTax?: number | string
  priceWithTax?: number | string
  totalOriginalPriceWithTax?: number | string
  totalPriceWithTax?: number | string
  attachTotalPrice?: number | string
  attachTotalPriceWithTax?: number | string
  totalTaxPrice?: number | string
}

type RebookSpecSelection = {
  specTypeId: string
  specValueId: string
}

type RebookAttachSelection = {
  attachValueId: string
  quantity: number
}

const fallbackGallery = [
  "https://www.figma.com/api/mcp/asset/5aa6ad0e-a319-4f63-950e-3654b6bab901",
  "https://www.figma.com/api/mcp/asset/30e46728-8330-4576-878d-44f5c5fe610e",
  "https://www.figma.com/api/mcp/asset/30d7a797-41ac-4b26-be69-b05a69801e01",
  "https://www.figma.com/api/mcp/asset/4a23c9cc-b72c-4b17-a507-ac26f8af0f40",
  "https://www.figma.com/api/mcp/asset/a3925844-c8df-4a13-bc77-e9907c4ccc27",
  "https://www.figma.com/api/mcp/asset/7e43c383-3d8d-4734-b4d3-d561d3a178eb",
]

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: "global" })

const isLoading = ref(false)
const productDetail = ref<ProductDetailRecord | null>(null)
const skuPrice = ref<ProductSkuRecord | null>(null)
const selectedImageIndex = ref(0)
const selectedSpecValues = ref<Record<string, string>>({})
const attachQuantities = ref<Record<string, number>>({})
const skuRequestSeq = ref(0)
const isCreatingOrder = ref(false)

const getPreferredLangs = () =>
  locale.value === "zh"
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"]

const pickI18nValue = (i18n?: I18nText, fallback = ""): string => {
  const valueMap = i18n || {}
  const preferredLangs = getPreferredLangs()
  for (const lang of preferredLangs) {
    const value = valueMap[lang]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === "string" && value.trim(),
  )
  if (typeof firstValue === "string") {
    return firstValue.trim()
  }
  return fallback
}

const pickI18nList = (i18n?: I18nTextArray): string[] => {
  const valueMap = i18n || {}
  const preferredLangs = getPreferredLangs()
  for (const lang of preferredLangs) {
    const value = valueMap[lang]
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
      if (normalized.length) {
        return normalized
      }
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => Array.isArray(value) && value.length > 0,
  )
  if (Array.isArray(firstValue)) {
    return firstValue.map((item) => String(item ?? "").trim()).filter(Boolean)
  }
  return []
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

const normalizeRichTextHtml = (value: string) => {
  const content = String(value || "").trim()
  if (!content) return ""
  if (/<\/?[a-z][^>]*>/i.test(content)) return content
  return `<p>${escapeHtml(content).replace(/\r?\n/g, "<br>")}</p>`
}

const legacyListToHtml = (items: string[]) =>
  items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : ""

const parseSpuId = (): string => {
  const fromParams = route.params.spuId
  if (typeof fromParams === "string" && fromParams.trim()) {
    return fromParams.trim()
  }
  if (
    Array.isArray(fromParams) &&
    typeof fromParams[0] === "string" &&
    fromParams[0].trim()
  ) {
    return fromParams[0].trim()
  }
  const fromQuery = route.query.spuId
  if (typeof fromQuery === "string" && fromQuery.trim()) {
    return fromQuery.trim()
  }
  if (
    Array.isArray(fromQuery) &&
    typeof fromQuery[0] === "string" &&
    fromQuery[0].trim()
  ) {
    return fromQuery[0].trim()
  }
  return ""
}

const getRouteQueryText = (key: string): string => {
  const raw = route.query[key]
  if (Array.isArray(raw)) {
    return typeof raw[0] === "string" ? raw[0].trim() : ""
  }
  return typeof raw === "string" ? raw.trim() : ""
}

const parseRebookSpecSelections = (): RebookSpecSelection[] => {
  const raw = getRouteQueryText("specSelections")
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null
        }
        const selection = item as {
          specTypeId?: number | string
          specValueId?: number | string
        }
        const specTypeId = String(selection.specTypeId ?? "").trim()
        const specValueId = String(selection.specValueId ?? "").trim()
        if (!specTypeId || !specValueId) {
          return null
        }
        return { specTypeId, specValueId }
      })
      .filter((item): item is RebookSpecSelection => Boolean(item))
  } catch {
    return []
  }
}

const parseRebookAttachSelections = (): RebookAttachSelection[] => {
  const raw = getRouteQueryText("attachSelections")
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null
        }
        const selection = item as {
          attachValueId?: number | string
          quantity?: number | string
        }
        const attachValueId = String(selection.attachValueId ?? "").trim()
        const quantity = Math.max(0, Number(selection.quantity ?? 0) || 0)
        if (!attachValueId || quantity <= 0) {
          return null
        }
        return { attachValueId, quantity }
      })
      .filter((item): item is RebookAttachSelection => Boolean(item))
  } catch {
    return []
  }
}

const spuId = computed(() => parseSpuId())
const level1FromQuery = computed(() => {
  const raw = getRouteQueryText("level1")
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object"
      ? (parsed as { nameI18n?: I18nText })
      : null
  } catch {
    try {
      const decoded = decodeURIComponent(raw)
      const parsed = JSON.parse(decoded)
      return parsed && typeof parsed === "object"
        ? (parsed as { nameI18n?: I18nText })
        : null
    } catch {
      return null
    }
  }
})

const rebookSpecSelections = computed(() => parseRebookSpecSelections())
const rebookAttachSelections = computed(() => parseRebookAttachSelections())

const rebookSpecSelectionMap = computed(() => {
  const map: Record<string, string> = {}
  rebookSpecSelections.value.forEach((item) => {
    map[item.specTypeId] = item.specValueId
  })
  return map
})

const rebookAttachSelectionMap = computed(() => {
  const map: Record<string, number> = {}
  rebookAttachSelections.value.forEach((item) => {
    map[item.attachValueId] = item.quantity
  })
  return map
})

const resolveNumber = (value: unknown): number => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }
  return numeric >= 0 ? numeric : 0
}

const resolveOptionalNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  return numeric >= 0 ? numeric : 0
}

const normalizeIdForApi = (value: string): number | string => {
  const numeric = Number(value)
  if (Number.isInteger(numeric)) {
    return numeric
  }
  return value
}

const galleryImages = computed<string[]>(() => {
  const raw = productDetail.value?.imageUrls
  const fromApi = Array.isArray(raw)
    ? raw.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : []
  return fromApi.length ? fromApi : fallbackGallery
})

const heroImage = computed(
  () => galleryImages.value[selectedImageIndex.value] || fallbackGallery[0],
)

const showPreviousImage = () => {
  const imageCount = galleryImages.value.length
  if (imageCount <= 1) {
    return
  }
  selectedImageIndex.value =
    (selectedImageIndex.value - 1 + imageCount) % imageCount
}

const showNextImage = () => {
  const imageCount = galleryImages.value.length
  if (imageCount <= 1) {
    return
  }
  selectedImageIndex.value = (selectedImageIndex.value + 1) % imageCount
}

const displayTitle = computed(() =>
  pickI18nValue(
    productDetail.value?.nameI18n,
    t("client.productDetail.fallbackTitle"),
  ),
)

const parentBreadcrumbTitle = computed(() =>
  pickI18nValue(
    level1FromQuery.value?.nameI18n,
    getRouteQueryText("breadcrumb") || getRouteQueryText("name"),
  ),
)

const serviceListQuery = computed(() => {
  const query: Record<string, string> = {}
  const categoryId = getRouteQueryText("categoryId")
  const level1 = getRouteQueryText("level1")
  const keyword = getRouteQueryText("keyword")
  const name = parentBreadcrumbTitle.value || getRouteQueryText("name")
  if (categoryId) {
    query.categoryId = categoryId
  }
  if (level1) {
    query.level1 = level1
  }
  if (name) {
    query.name = name
  }
  if (keyword) {
    query.keyword = keyword
  }
  return query
})

const serviceDescriptionHtml = computed(() =>
  normalizeRichTextHtml(pickI18nValue(productDetail.value?.descI18n, "")),
)

const basePrice = computed(() =>
  resolveNumber(productDetail.value?.minPrice ?? productDetail.value?.price),
)

const selectedSpecValueIds = computed(() =>
  bookingSpecGroups.value
    .map((group) => selectedSpecValues.value[group.typeId])
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeIdForApi(value)),
)

const attachItemsForSku = computed(() => {
  const payloadMap = new Map<
    string,
    { attachValueId: number | string; quantity: number }
  >()
  bookingAttachGroups.value.forEach((group) => {
    group.options.forEach((option) => {
      const quantity = Math.max(
        0,
        Number(attachQuantities.value[option.id] || 0),
      )
      payloadMap.set(option.id, {
        attachValueId: normalizeIdForApi(option.id),
        quantity,
      })
    })
  })
  return Array.from(payloadMap.values())
})

const skuRequestPayload = computed<ProductSkuPayload | null>(() => {
  if (!spuId.value) {
    return null
  }
  if (!productDetail.value) {
    return null
  }
  if (
    bookingSpecGroups.value.length > 0 &&
    selectedSpecValueIds.value.length !== bookingSpecGroups.value.length
  ) {
    return null
  }
  return {
    spuId: normalizeIdForApi(spuId.value),
    specValueIds: selectedSpecValueIds.value,
    attachItems: attachItemsForSku.value,
  }
})

const skuRequestSignature = computed(() => {
  const payload = skuRequestPayload.value
  return payload ? JSON.stringify(payload) : ""
})

const subtotalPrice = computed(() => {
  const skuSubtotal = resolveOptionalNumber(skuPrice.value?.totalPrice)
  return skuSubtotal ?? basePrice.value
})

const attachTotalPrice = computed(() => {
  const fromSku = resolveOptionalNumber(skuPrice.value?.attachTotalPrice)
  if (fromSku !== null) {
    return fromSku
  }
  const fromSkuWithTax = resolveOptionalNumber(
    skuPrice.value?.attachTotalPriceWithTax,
  )
  if (fromSkuWithTax !== null) {
    return fromSkuWithTax
  }
  return bookingAttachGroups.value.reduce((sum, group) => {
    return (
      sum +
      group.options.reduce((groupSum, option) => {
        const quantity = Math.max(
          0,
          Number(attachQuantities.value[option.id] || 0),
        )
        return groupSum + option.price * quantity
      }, 0)
    )
  }, 0)
})

const vatPrice = computed(() => {
  const explicitTax = resolveOptionalNumber(skuPrice.value?.totalTaxPrice)
  if (explicitTax !== null) {
    return explicitTax
  }
  const withTax = resolveOptionalNumber(skuPrice.value?.totalPriceWithTax)
  const withoutTax = resolveOptionalNumber(skuPrice.value?.totalPrice)
  if (withTax !== null && withoutTax !== null) {
    return Math.max(0, withTax - withoutTax)
  }
  return 0
})

const totalPrice = computed(() => {
  const skuTotal = resolveOptionalNumber(skuPrice.value?.totalPriceWithTax)
  if (skuTotal !== null) {
    return skuTotal
  }
  return subtotalPrice.value
})

const serviceContentHtml = computed(() => {
  const detail = productDetail.value
  const richText = pickI18nValue(detail?.serviceContentTextI18n, "")
  if (richText) return normalizeRichTextHtml(richText)

  const mixedText = pickI18nValue(
    detail?.serviceContentI18n as unknown as I18nText | undefined,
    "",
  )
  if (mixedText) return normalizeRichTextHtml(mixedText)

  return legacyListToHtml(pickI18nList(detail?.serviceContentI18n))
})

const bookingNoticeHtml = computed(() =>
  normalizeRichTextHtml(
    pickI18nValue(productDetail.value?.bookingNoticeI18n, ""),
  ),
)

const normalizeRating = (value: unknown): number => {
  const rating = Number(value)
  if (!Number.isFinite(rating)) {
    return 0
  }
  if (rating < 0) {
    return 0
  }
  if (rating > 5) {
    return 5
  }
  return rating
}

const reviewItems = computed(() => {
  const source = Array.isArray(productDetail.value?.reviewList)
    ? productDetail.value?.reviewList || []
    : []
  return source.map((item) => {
    const commenter =
      formatContactName(item.firstName, item.lastName) ||
      formatContactName(item.user?.firstName, item.user?.lastName) ||
      String(item.customerName ?? "").trim() ||
      String(item.customerFullName ?? "").trim() ||
      String(item.fullName ?? "").trim() ||
      String(item.reviewerName ?? "").trim() ||
      String(item.nickname ?? "").trim() ||
      String(item.displayName ?? "").trim() ||
      String(item.user?.name ?? "").trim() ||
      String(item.user?.nickname ?? "").trim() ||
      String(item.name ?? "").trim() ||
      t("client.productDetail.reviewUser")
    const content =
      String(item.content ?? "").trim() || t("client.productDetail.reviewText")
    const avatarUrl =
      typeof item.avatarUrl === "string" ? item.avatarUrl.trim() : ""
    const rawCommentTime = String(item.commentTime ?? "").trim()
    const commentTime = rawCommentTime
      ? formatCreatedAt(rawCommentTime, locale.value, rawCommentTime)
      : ""
    const avatarText = commenter.slice(0, 1).toUpperCase()
    return {
      commenter,
      content,
      avatarUrl,
      commentTime,
      avatarText,
      rating: normalizeRating(item.rating),
    }
  })
})

const reviewCount = computed(() => reviewItems.value.length)
const averageRating = computed(() => {
  if (!reviewCount.value) return 0
  const total = reviewItems.value.reduce((sum, item) => sum + item.rating, 0)
  return total / reviewCount.value
})

type BookingSpecOption = {
  id: string
  label: string
  remark: string
}

type BookingSpecGroup = {
  typeId: string
  label: string
  options: BookingSpecOption[]
}

type BookingAttachOption = {
  id: string
  label: string
  price: number
}

type BookingAttachGroup = {
  typeId: string
  label: string
  options: BookingAttachOption[]
}

const buildAttachOptionPriceMap = (record: ProductDetailRecord | null) => {
  const map: Record<string, number> = {}
  if (!record || typeof record !== "object") {
    return map
  }

  const appendByMap = (source: unknown) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return
    }
    Object.entries(source as Record<string, unknown>).forEach(
      ([id, rawPrice]) => {
        const cleanId = String(id || "").trim()
        if (!cleanId) {
          return
        }
        const price = resolveOptionalNumber(rawPrice)
        if (price === null) {
          return
        }
        if (map[cleanId] === undefined || map[cleanId] <= 0) {
          map[cleanId] = price
        }
      },
    )
  }

  const appendByArray = (source: unknown) => {
    if (!Array.isArray(source)) {
      return
    }
    source.forEach((item) => {
      if (!item || typeof item !== "object") {
        return
      }
      const entry = item as Record<string, unknown>
      const id = String(
        entry.id ?? entry.attachValueId ?? entry.valueId ?? "",
      ).trim()
      if (!id) {
        return
      }
      const price = resolveOptionalNumber(
        entry.price ?? entry.amount ?? entry.attachPrice ?? entry.attachAmount,
      )
      if (price === null) {
        return
      }
      if (map[id] === undefined || map[id] <= 0) {
        map[id] = price
      }
    })
  }

  appendByMap((record as any).attachValuePriceMap)
  appendByMap((record as any).attachValueAmountMap)
  appendByMap((record as any).attachPriceMap)
  appendByMap((record as any).attachAmountMap)
  appendByMap((record as any).attachValuePrices)
  appendByMap((record as any).attachValueAmounts)

  appendByArray((record as any).attachValues)
  appendByArray((record as any).attachValueList)
  appendByArray((record as any).attachValueItems)
  appendByArray((record as any).attachOptions)
  appendByArray((record as any).addons)
  appendByArray((record as any).addonOptions)

  const bindings = Array.isArray((record as any).attachBindings)
    ? ((record as any).attachBindings as Array<Record<string, unknown>>)
    : []
  bindings.forEach((binding) => {
    Object.values(binding).forEach((value) => {
      appendByArray(value)
    })
  })

  return map
}

const attachOptionPriceMap = computed(() =>
  buildAttachOptionPriceMap(productDetail.value),
)

const bookingSpecGroups = computed<BookingSpecGroup[]>(() => {
  const record = productDetail.value
  const bindings = Array.isArray(record?.specBindings)
    ? record.specBindings
    : []
  return bindings
    .map((binding) => {
      const typeId = String(binding.specTypeId ?? "").trim()
      if (!typeId) {
        return null
      }
      const label = pickI18nValue(record?.specTypeNameI18n?.[typeId], typeId)
      const valueIds = Array.isArray(binding.specValueIds)
        ? binding.specValueIds
        : []
      const options = valueIds
        .map((valueId) => {
          const id = String(valueId ?? "").trim()
          if (!id) {
            return null
          }
          const optionI18n = record?.specValueNameI18n?.[id]
          const optionLabel = pickI18nValue(optionI18n as I18nText, id)
          const remark = pickI18nValue(
            record?.specValueRemarkI18n?.[id] || optionI18n?.remarkI18n,
            "",
          )
          return optionLabel ? { id, label: optionLabel, remark } : null
        })
        .filter((item): item is BookingSpecOption => Boolean(item))
      if (!options.length) {
        return null
      }
      return {
        typeId,
        label,
        options,
      }
    })
    .filter((item): item is BookingSpecGroup => Boolean(item))
})

const selectedSpecSummary = computed(() => {
  return bookingSpecGroups.value
    .map((group) => {
      const selectedId = selectedSpecValues.value[group.typeId]
      const selected = group.options.find((option) => option.id === selectedId)
      return selected?.label || ""
    })
    .filter(Boolean)
    .join(" / ")
})

const bookingAttachGroups = computed<BookingAttachGroup[]>(() => {
  const record = productDetail.value
  const bindings = Array.isArray(record?.attachBindings)
    ? record.attachBindings
    : []
  return bindings
    .map((binding) => {
      const typeId = String(binding.attachTypeId ?? "").trim()
      if (!typeId) {
        return null
      }
      const label = pickI18nValue(record?.attachTypeNameI18n?.[typeId], typeId)
      const valueIds = Array.isArray(binding.attachValueIds)
        ? binding.attachValueIds
        : []
      const options = valueIds
        .map((valueId) => {
          const id = String(valueId ?? "").trim()
          if (!id) {
            return null
          }
          const optionLabel = pickI18nValue(
            record?.attachValueNameI18n?.[id],
            id,
          )
          return optionLabel
            ? {
                id,
                label: optionLabel,
                price: attachOptionPriceMap.value[id] ?? 0,
              }
            : null
        })
        .filter((item): item is BookingAttachOption => Boolean(item))
      if (!options.length) {
        return null
      }
      return {
        typeId,
        label,
        options,
      }
    })
    .filter((item): item is BookingAttachGroup => Boolean(item))
})

const loadProductDetail = async () => {
  if (!spuId.value) {
    productDetail.value = null
    skuPrice.value = null
    return
  }
  isLoading.value = true
  skuPrice.value = null
  try {
    const payload = await getProductDetail(spuId.value)
    productDetail.value =
      payload && typeof payload === "object"
        ? (payload as ProductDetailRecord)
        : null
  } catch (error) {
    console.error("load product detail failed:", error)
    productDetail.value = null
  } finally {
    isLoading.value = false
  }
}

const loadSkuPrice = async (payload: ProductSkuPayload) => {
  const requestId = skuRequestSeq.value + 1
  skuRequestSeq.value = requestId
  try {
    const result = await getProductSku(payload)
    if (requestId !== skuRequestSeq.value) {
      return
    }
    skuPrice.value =
      result && typeof result === "object" ? (result as ProductSkuRecord) : null
  } catch (error) {
    if (requestId !== skuRequestSeq.value) {
      return
    }
    console.error("load product sku failed:", error)
    skuPrice.value = null
  }
}

watch(
  () => spuId.value,
  () => {
    void loadProductDetail()
  },
  { immediate: true },
)

watch(
  () => [
    spuId.value,
    getRouteQueryText("specSelections"),
    getRouteQueryText("attachSelections"),
  ],
  () => {
    selectedSpecValues.value = {}
    attachQuantities.value = {}
  },
  { immediate: true },
)

watch(
  () => galleryImages.value.length,
  (length) => {
    if (!length) {
      selectedImageIndex.value = 0
      return
    }
    if (selectedImageIndex.value >= length) {
      selectedImageIndex.value = 0
    }
  },
  { immediate: true },
)

watch(
  () => bookingSpecGroups.value,
  (groups) => {
    const rebookMap = rebookSpecSelectionMap.value
    const next: Record<string, string> = {}
    groups.forEach((group) => {
      const current = selectedSpecValues.value[group.typeId]
      const isValid = group.options.some((option) => option.id === current)
      const rebookSelected = rebookMap[group.typeId]
      const isRebookValid = group.options.some(
        (option) => option.id === rebookSelected,
      )
      next[group.typeId] = isValid
        ? current
        : isRebookValid
          ? rebookSelected
          : group.options[0].id
    })
    selectedSpecValues.value = next
  },
  { immediate: true },
)

watch(
  () => bookingAttachGroups.value,
  (groups) => {
    const rebookMap = rebookAttachSelectionMap.value
    const next: Record<string, number> = {}
    groups.forEach((group) => {
      group.options.forEach((option) => {
        const current = attachQuantities.value[option.id]
        const rebookQuantity = rebookMap[option.id]
        next[option.id] =
          Number.isFinite(current) && current > 0
            ? current
            : Number.isFinite(rebookQuantity) && rebookQuantity > 0
              ? rebookQuantity
              : 0
      })
    })
    attachQuantities.value = next
  },
  { immediate: true },
)

watch(
  () => skuRequestSignature.value,
  () => {
    const payload = skuRequestPayload.value
    if (!payload) {
      skuPrice.value = null
      return
    }
    void loadSkuPrice(payload)
  },
  { immediate: true },
)

const formatAed = (value: number) => `AED ${value.toFixed(2)}`

const selectSpecValue = (typeId: string, valueId: string) => {
  selectedSpecValues.value = {
    ...selectedSpecValues.value,
    [typeId]: valueId,
  }
}

const increaseAttachQty = (valueId: string) => {
  const current = attachQuantities.value[valueId] || 0
  attachQuantities.value = {
    ...attachQuantities.value,
    [valueId]: current + 1,
  }
}

const decreaseAttachQty = (valueId: string) => {
  const current = attachQuantities.value[valueId] || 0
  attachQuantities.value = {
    ...attachQuantities.value,
    [valueId]: Math.max(0, current - 1),
  }
}

const handleAddToCart = async () => {
  const payload = skuRequestPayload.value
  if (!payload) {
    ElMessage.warning(t("client.productDetail.booking.createOrderInvalid"))
    return
  }
  const authSnapshot = getStoredAuthSnapshot()
  if (authSnapshot.isExpired) clearStoredAuthState()
  if (!authSnapshot.isLoggedIn) {
    await router.push({ name: "login", query: { redirect: route.fullPath } })
    return
  }
  await router.push({
    name: "order-confirm",
    query: {
      mode: "cart",
      cartSkuDetail: JSON.stringify(payload),
      spuId: spuId.value,
      skuId: skuPrice.value?.skuId ? String(skuPrice.value.skuId) : "",
      title: displayTitle.value,
      titleI18n: JSON.stringify(productDetail.value?.nameI18n || {}),
      specSummary: selectedSpecSummary.value,
      selectedSpecValueIds: JSON.stringify(
        selectedSpecValueIds.value.map((id) => String(id)),
      ),
      specValueNameI18n: JSON.stringify(
        productDetail.value?.specValueNameI18n || {},
      ),
      subtotal: subtotalPrice.value.toFixed(2),
      tax: vatPrice.value.toFixed(2),
      total: totalPrice.value.toFixed(2),
    },
  })
}

const goServicesHome = () => {
  router.push({ path: "/", hash: "#services" })
}

const goServiceList = () => {
  const path = getRouteQueryText("keyword")
    ? "/services/search"
    : "/services/daily-cleaning"
  router.push({
    path,
    query: Object.keys(serviceListQuery.value).length
      ? serviceListQuery.value
      : undefined,
  })
}

const goOrderConfirm = async () => {
  if (isCreatingOrder.value) {
    return
  }

  const authSnapshot = getStoredAuthSnapshot()
  if (authSnapshot.isExpired) {
    clearStoredAuthState()
  }
  if (!authSnapshot.isLoggedIn) {
    await router.push({
      name: "login",
      query: { redirect: route.fullPath },
    })
    return
  }

  const payload = skuRequestPayload.value
  if (!payload) {
    ElMessage.warning(t("client.productDetail.booking.createOrderInvalid"))
    return
  }

  isCreatingOrder.value = true
  try {
    const createdOrderId = await createOrder(payload)
    const orderIdText = String(createdOrderId ?? "").trim()
    if (!orderIdText) {
      ElMessage.error(t("client.productDetail.booking.createOrderFailed"))
      return
    }

    router.push({
      name: "order-confirm",
      query: {
        orderId: orderIdText,
        spuId: spuId.value,
        skuId: skuPrice.value?.skuId ? String(skuPrice.value.skuId) : "",
        title: displayTitle.value,
        titleI18n: JSON.stringify(productDetail.value?.nameI18n || {}),
        specSummary: selectedSpecSummary.value,
        selectedSpecValueIds: JSON.stringify(
          selectedSpecValueIds.value.map((id) => String(id)),
        ),
        specValueNameI18n: JSON.stringify(
          productDetail.value?.specValueNameI18n || {},
        ),
        subtotal: subtotalPrice.value.toFixed(2),
        tax: vatPrice.value.toFixed(2),
        total: totalPrice.value.toFixed(2),
      },
    })
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("client.productDetail.booking.createOrderFailed"),
    )
  } finally {
    isCreatingOrder.value = false
  }
}
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
  line-height: 1;
  padding: 0;
}

.product-detail-back__link {
  border: 0;
  background: transparent;
  padding: 0;
  color: #58708d;
  font-size: inherit;
  line-height: 1;
  font-weight: 700;
  cursor: pointer;
}

.product-detail-back__separator {
  color: #a4b1c2;
  font-size: 14px;
}

.product-detail-back__current {
  color: rgba(15, 23, 42, 0.88);
  font-size: inherit;
  line-height: 1;
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

.product-gallery__thumbs {
  display: flex;
  flex-direction: column;
  gap: 9px;
  max-height: 430px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(5, 21, 43, 0.32) transparent;
}

.product-gallery__thumb {
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  border-radius: 12px;
  border: 2px solid #fff;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #fff;
  box-shadow: 0 4px 14px rgba(7, 27, 51, 0.08);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.product-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-gallery__thumb--active {
  border-color: var(--hourx-brand);
  box-shadow: 0 0 0 2px rgba(5, 21, 43, 0.12), 0 8px 18px rgba(7, 27, 51, 0.12);
  transform: translateY(-1px);
}

.product-gallery__hero {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  background: #e5e7eb;
  border: 1px solid rgba(209, 219, 231, 0.8);
  box-shadow: 0 16px 40px rgba(7, 27, 51, 0.1);
}

.product-gallery__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-gallery__arrow {
  position: absolute;
  z-index: 2;
  top: 50%;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 50%;
  background: rgba(5, 21, 43, 0.7);
  color: #fff;
  box-shadow: 0 8px 20px rgba(5, 21, 43, 0.24);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    background-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.product-gallery__arrow--prev {
  left: 16px;
}

.product-gallery__arrow--next {
  right: 16px;
}

.product-gallery__arrow svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.product-gallery__arrow:hover {
  background: rgba(5, 21, 43, 0.9);
  box-shadow: 0 10px 24px rgba(5, 21, 43, 0.32);
  transform: translateY(-50%) scale(1.06);
}

.product-gallery__arrow:active {
  transform: translateY(-50%) scale(0.96);
}

.product-gallery__arrow:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.85);
  outline-offset: 2px;
}

.product-gallery__badge {
  position: absolute;
  top: 16px;
  left: 16px;
  height: 24px;
  border-radius: 999px;
  background: var(--hourx-brand);
  color: #fff;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.product-gallery__dots {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.product-gallery__dot {
  width: 8px;
  height: 8px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  padding: 0;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition:
    width 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.product-gallery__dot--active {
  width: 10px;
  height: 10px;
  border-color: #fff;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.24);
}

.product-trust-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  min-height: 54px;
  border: 1px solid #e5ecf4;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(7, 27, 51, 0.05);
}

.product-trust-strip__item {
  min-width: 0;
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
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e6edf5;
  padding: 26px;
  box-shadow: 0 10px 30px rgba(7, 27, 51, 0.055);
}

.product-card h2 {
  margin: 0;
  color: #10233e;
  font-size: 18px;
  font-weight: 850;
}

.product-card--overview {
  padding: 28px;
}

.product-card--compact {
  min-width: 0;
  padding: 24px;
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

.product-section-heading > div {
  min-width: 0;
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
  flex: 0 0 auto;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--hourx-brand);
  background: var(--hourx-brand-soft);
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

.product-reviews-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.product-reviews-heading__score {
  display: flex;
  align-items: baseline;
  gap: 7px;
  color: #7c8ba0;
  font-size: 12px;
}

.product-reviews-heading__score strong {
  color: #10233e;
  font-size: 24px;
  font-weight: 900;
}

.product-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.product-card__head h1 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 26px;
  line-height: 1.2;
  font-weight: 900;
}

.product-card__head p {
  margin: 0;
  color: var(--hourx-brand);
  font-size: 26px;
  line-height: 1.2;
  font-weight: 900;
  white-space: nowrap;
}

.product-card__meta {
  margin-top: 10px;
  color: rgba(15, 23, 42, 0.45);
  font-size: 12px;
  font-weight: 600;
}

.product-card__line {
  margin: 18px 0;
  border-top: 1px solid #e5e7eb;
}

.product-card__desc h2 {
  font-size: 16px;
}

.product-card__desc p {
  margin: 16px 0 0;
  color: #52647b;
  font-size: 14px;
  line-height: 1.75;
}

.product-card__empty {
  color: rgba(15, 23, 42, 0.35);
}

.product-check-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.product-check-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: rgba(15, 23, 42, 0.75);
  font-size: 13px;
  line-height: 1.5;
}

.product-check-list__icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 2px;
}

.product-rich-text {
  margin-top: 18px;
  color: #52647b;
  font-size: 14px;
  line-height: 1.72;
  overflow-wrap: anywhere;
}

.product-rich-text :deep(*) {
  box-sizing: border-box;
}

.product-rich-text :deep(h1),
.product-rich-text :deep(h2),
.product-rich-text :deep(h3),
.product-rich-text :deep(h4) {
  margin: 14px 0 8px;
  color: rgba(15, 23, 42, 0.86);
  line-height: 1.35;
}

.product-rich-text :deep(h1) {
  font-size: 20px;
}

.product-rich-text :deep(h2) {
  font-size: 18px;
}

.product-rich-text :deep(h3) {
  font-size: 16px;
}

.product-rich-text :deep(h4) {
  font-size: 14px;
}

.product-rich-text :deep(ul),
.product-rich-text :deep(ol) {
  margin: 10px 0 0;
  padding-left: 19px;
}

.product-rich-text :deep(li) {
  margin: 7px 0;
  padding-left: 2px;
}

.product-rich-text :deep(li::marker) {
  color: var(--hourx-brand);
}

.product-rich-text :deep(p) {
  margin: 6px 0;
}

.product-rich-text :deep(a) {
  color: var(--hourx-brand);
  text-decoration: underline;
}

.product-rich-text :deep(blockquote) {
  margin: 10px 0;
  padding-left: 12px;
  border-left: 3px solid rgba(23, 105, 194, 0.25);
  color: rgba(15, 23, 42, 0.55);
}

.product-rich-text :deep(img) {
  max-width: 100%;
  height: auto;
}

.product-rich-text :deep(.ql-align-center) {
  text-align: center;
}

.product-rich-text :deep(.ql-align-right) {
  text-align: right;
}

.product-rich-text :deep(.ql-align-justify) {
  text-align: justify;
}

.product-review-list {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.product-review {
  border-radius: 14px;
  border: 1px solid #e7edf4;
  background: #f9fbfd;
  padding: 16px;
  display: flex;
  gap: 10px;
}

.product-review__avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #e2e8f0;
  color: rgba(15, 23, 42, 0.6);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.product-review__avatar img {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}

.product-review__avatar span {
  line-height: 1;
}

.product-review__content {
  min-width: 0;
}

.product-review__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.product-review__head strong {
  color: rgba(15, 23, 42, 0.9);
  font-size: 12px;
  font-weight: 700;
}

.product-review__rating {
  --el-rate-fill-color: #fbbf24;
}

.product-review__rating :deep(.el-rate__icon) {
  font-size: 12px;
  margin-right: 2px;
}

.product-review__rating :deep(.el-rate__text) {
  color: #fbbf24;
  font-size: 12px;
  font-weight: 600;
}

.product-review p {
  margin: 8px 0 0;
  color: rgba(15, 23, 42, 0.58);
  font-size: 12px;
  line-height: 1.5;
}

.product-review__time {
  margin-top: 6px;
  display: inline-block;
  color: rgba(15, 23, 42, 0.42);
  font-size: 12px;
  line-height: 1.4;
}

.booking-side {
  position: sticky;
  top: 92px;
}

.booking-card {
  border-radius: 20px;
  background: #fff;
  border: 1px solid #e2eaf3;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 20px 52px rgba(7, 27, 51, 0.12);
}

.booking-card__hero {
  padding: 26px 26px 22px;
  border-bottom: 1px solid #e9eef5;
  background:
    radial-gradient(circle at 100% 0, rgba(5, 21, 43, 0.06), transparent 38%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
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
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -0.025em;
}

.booking-card__meta {
  margin-top: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.booking-card__rating {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.booking-card__rating > span {
  color: #f4a21b;
  font-size: 12px;
  letter-spacing: 0.02em;
}

.booking-card__rating strong {
  color: var(--hourx-brand);
  font-size: 12px;
}

.booking-card__rating small {
  color: #718096;
  font-size: 11px;
  white-space: nowrap;
}

.booking-card__trust {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #4c6279;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.booking-card__trust svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--hourx-brand);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.booking-card__price {
  margin-top: 18px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.booking-card__price span {
  color: #67798e;
  font-size: 13px;
  font-weight: 700;
}

.booking-card__price strong {
  color: var(--hourx-brand);
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.025em;
}

.booking-card__section-heading {
  padding: 22px 26px 0;
}

.booking-card__section-heading h2 {
  margin: 0;
  color: #10233e;
  font-size: 18px;
  font-weight: 850;
}

.booking-card__section-heading p {
  margin: 5px 0 0;
  color: #7a8ba0;
  font-size: 12px;
  line-height: 1.45;
}

.booking-card__section-heading--addons {
  padding-top: 26px;
}

.booking-field {
  margin-top: 18px;
  padding: 0 26px;
}

.booking-field > p {
  margin: 0 0 10px;
  color: #203650;
  font-size: 13px;
  font-weight: 800;
}

.booking-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 6px;
}

.booking-option {
  min-height: 34px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #dfe7f0;
  background: #fff;
  color: #1b3049;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  text-align: left;
  box-shadow: none;
  transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}

.booking-option:hover {
  border-color: rgba(5, 21, 43, 0.42);
}

.booking-option__topline {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.booking-option__topline svg {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  fill: var(--hourx-brand);
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.booking-option__name {
  color: inherit;
  line-height: 1.28;
}

.booking-option__remark {
  margin-top: 1px;
  color: #74859a;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.25;
}

.booking-option--active {
  border-color: var(--hourx-brand);
  color: var(--hourx-brand);
  background: var(--hourx-brand-soft);
  box-shadow: none;
}

.booking-option--active .booking-option__remark {
  color: #5c6d82;
}

.booking-option--step {
  width: 34px;
  min-width: 34px;
  height: 34px;
  min-height: 34px;
  padding: 0;
  border-radius: 9px;
  font-size: 16px;
  line-height: 1;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.booking-option--readonly {
  cursor: default;
}

.booking-option--readonly:disabled {
  opacity: 1;
}

.booking-attach-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.booking-attach-item {
  border-radius: 12px;
  border: 1px solid #e0e8f1;
  background: #fbfcfe;
  padding: 11px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.booking-attach-item__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.booking-attach-item__name {
  display: block;
  color: #1b3049;
  font-size: 13px;
  font-weight: 750;
}

.booking-attach-item__price {
  display: block;
  margin-top: 2px;
  color: #73859a;
  font-size: 11px;
  font-weight: 600;
}

.booking-attach-item__stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.booking-card__empty {
  margin: 18px 26px 0;
  color: rgba(15, 23, 42, 0.35);
  font-size: 12px;
}

.booking-summary {
  margin-top: 24px;
  padding: 20px 26px 0;
  border-top: 1px solid #e9eef5;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.booking-summary__row > span small {
  max-width: 245px;
  overflow: hidden;
  color: #91a0b2;
  font-size: 11px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  grid-template-columns: 1fr;
  gap: 9px;
  margin-top: 20px;
  padding: 0 26px;
}

.booking-add-cart,
.booking-submit {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 50px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  border: 1px solid var(--hourx-brand);
  background: linear-gradient(135deg, var(--hourx-brand-hover) 0%, var(--hourx-brand) 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(5, 21, 43, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
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

.booking-add-cart:hover {
  border-color: #93a7bd;
  background: #f7fafd;
  box-shadow: 0 8px 18px rgba(5, 21, 43, 0.12);
  transform: translateY(-1px);
}

.booking-submit:hover:not(:disabled) {
  box-shadow: 0 14px 28px rgba(5, 21, 43, 0.24);
  transform: translateY(-1px);
}

.booking-add-cart:active,
.booking-submit:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.booking-add-cart:focus-visible,
.booking-submit:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.22);
  outline-offset: 2px;
}

.booking-submit:disabled {
  cursor: not-allowed;
  opacity: 0.58;
  box-shadow: none;
}

.booking-card__policy {
  margin: 14px 26px 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #7a8ba0;
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
}

.booking-card__policy svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  fill: none;
  stroke: #71849a;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (min-width: 1440px) {
  .product-detail-layout {
    grid-template-columns: minmax(0, 1.58fr) minmax(430px, 0.82fr);
  }

  .product-detail-subheader,
  .product-detail-back {
    height: 62px;
  }

  .product-detail-back {
    font-size: 14px;
  }

  .product-detail-body {
    padding: 24px 0 64px;
  }

  .product-main {
    gap: 20px;
  }

  .product-gallery {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 20px;
  }

  .product-gallery__thumbs {
    max-height: 460px;
  }

  .product-gallery__thumb {
    flex-basis: 84px;
    width: 84px;
    height: 84px;
  }

  .product-gallery__hero,
  .product-card {
    border-radius: 20px;
  }

  .product-gallery__arrow {
    width: 50px;
    height: 50px;
  }

  .product-card {
    padding: 30px;
  }

  .product-card h2 {
    font-size: 20px;
  }

  .product-card__head h1,
  .product-card__head p {
    font-size: 30px;
  }

  .product-card__desc p,
  .product-rich-text {
    font-size: 15px;
  }

  .booking-side {
    top: 104px;
  }

  .booking-card {
    padding: 0;
    border-radius: 20px;
  }

  .booking-card__section-heading h2 {
    font-size: 19px;
  }

  .booking-field > p,
  .booking-attach-item__name {
    font-size: 14px;
  }

  .booking-option {
    min-height: 36px;
    font-size: 12px;
  }

  .booking-option--step {
    width: 40px;
    min-width: 40px;
    height: 40px;
    min-height: 40px;
  }

  .booking-summary__row {
    font-size: 15px;
  }

  .booking-summary__row--total span {
    font-size: 20px;
  }

  .booking-summary__row--total strong {
    font-size: 24px;
  }

  .booking-add-cart,
  .booking-submit {
    height: 52px;
    font-size: 15px;
  }
}

@media (max-width: 1180px) {
  .product-detail-layout {
    grid-template-columns: minmax(0, 1fr) clamp(350px, 35vw, 390px);
    gap: clamp(16px, 2vw, 24px);
  }

  .product-gallery {
    grid-template-columns: clamp(52px, 6vw, 64px) minmax(0, 1fr);
    gap: clamp(10px, 1.5vw, 14px);
  }

  .product-gallery__thumbs {
    max-height: clamp(260px, 34vw, 360px);
  }

  .product-gallery__thumb {
    flex-basis: auto;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }

  .booking-side {
    position: sticky;
    top: 96px;
    min-width: 0;
  }
}

@media (max-width: 820px) {
  .product-detail-layout {
    grid-template-columns: 1fr;
  }

  .booking-side {
    position: static;
  }

  .product-detail-container {
    width: calc(100% - 32px);
  }

  .product-gallery {
    grid-template-columns: 1fr;
  }

  .product-gallery__hero {
    height: clamp(220px, 52vw, 380px);
    max-height: 50vh;
    max-height: 50svh;
    aspect-ratio: auto;
  }

  .product-gallery__thumbs {
    order: 2;
    display: grid;
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: calc(20% - 8px);
    max-height: none;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x proximity;
  }

  .product-gallery__thumb {
    flex-basis: auto;
    width: 100%;
    height: 68px;
    scroll-snap-align: start;
  }

  .product-gallery__arrow {
    width: 40px;
    height: 40px;
  }

  .product-gallery__arrow--prev {
    left: 12px;
  }

  .product-gallery__arrow--next {
    right: 12px;
  }

  .product-check-list {
    grid-template-columns: 1fr;
  }

  .product-info-grid,
  .product-review-list {
    grid-template-columns: 1fr;
  }

  .product-card__head h1 {
    font-size: 28px;
  }

  .product-card__head p {
    font-size: 30px;
  }
}

@media (max-width: 640px) {
  .product-detail-subheader,
  .product-detail-back {
    height: 56px;
  }

  .product-detail-back {
    font-size: 16px;
  }

  .product-gallery__hero {
    height: clamp(180px, 52vw, 280px);
    max-height: 42vh;
    max-height: 42svh;
    border-radius: 12px;
  }

  .product-card {
    padding: 18px;
  }

  .product-trust-strip__item {
    flex-direction: column;
    gap: 5px;
    padding: 10px 6px;
    font-size: 10px;
    text-align: center;
  }

  .product-trust-strip__item svg {
    width: 18px;
    height: 18px;
  }

  .product-reviews-heading {
    align-items: flex-start;
  }

  .booking-card__hero,
  .booking-card__section-heading,
  .booking-field,
  .booking-summary,
  .booking-actions {
    padding-left: 18px;
    padding-right: 18px;
  }

  .booking-card__meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .booking-card__policy {
    margin-right: 18px;
    margin-left: 18px;
  }

  .booking-options {
    grid-template-columns: 1fr;
  }

  .product-card__head {
    flex-direction: column;
    gap: 8px;
  }

  .product-card__head p {
    font-size: 26px;
  }

  .booking-actions {
    gap: 8px;
  }

  .booking-add-cart,
  .booking-submit {
    height: 50px;
    border-radius: 12px;
    font-size: 14px;
  }

  .booking-add-cart__icon {
    width: 18px;
    height: 18px;
  }
}
</style>
