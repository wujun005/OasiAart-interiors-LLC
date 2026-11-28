<template>
  <div class="h5-service-page">
    <header class="h5-service-topbar">
      <div class="h5-list-topbar">
        <HomeReturn />
        <h1>{{ pageTitle }}</h1>
      </div>
      <form
        class="h5-service-search"
        role="search"
        :aria-busy="isServiceLoading"
        @submit.prevent="submitServiceSearch"
      >
        <input
          ref="searchInput"
          v-model="serviceSearch"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          :placeholder="t('client.home.sections.searchPlaceholder')"
          :aria-label="t('client.home.sections.searchPlaceholder')"
        />
        <button
          type="submit"
          :disabled="isServiceLoading || !serviceSearch.trim()"
          :aria-label="t('client.home.sections.searchAction')"
        >
          <span
            v-if="isServiceLoading"
            class="h5-service-search__button-spinner"
            aria-hidden="true"
          />
          <van-icon v-else name="search" aria-hidden="true" />
        </button>
      </form>
    </header>

    <main class="h5-service-main" :class="{ 'h5-service-main--search': isSearchMode }">
      <section v-if="!isSearchMode" class="h5-service-hero">
        <span v-if="heroTitle !== pageTitle" class="h5-service-hero__eyebrow">{{ pageTitle }}</span>
        <h2>{{ heroTitle }}</h2>
        <p v-if="heroDesc">{{ heroDesc }}</p>
        <div class="h5-service-hero__tags">
          <span v-for="(tag, index) in heroTags" :key="`${tag.label}-${index}`">
            <img :src="tag.icon" alt="" />
            {{ tag.label }}
          </span>
        </div>
      </section>

      <section class="h5-service-section">
        <div v-if="!isSearchStart" class="h5-service-section__title">
          <h2>{{ serviceSectionTitle }}</h2>
        </div>

        <div
          v-if="isServiceLoading"
          class="h5-service-loading"
          role="status"
          aria-live="polite"
        >
          <span class="h5-service-loading__spinner" aria-hidden="true" />
          <p>
            {{ locale === "zh" ? "正在查找服务…" : "Searching for services…" }}
          </p>
        </div>
        <div v-else-if="serviceCards.length" class="h5-service-list">
          <article
            v-for="item in serviceCards"
            :key="item.key"
            class="h5-service-card"
            role="link"
            tabindex="0"
            :aria-label="item.title"
            @click="goProductDetail(item.spuId)"
            @keydown.enter="goProductDetail(item.spuId)"
            @keydown.space.prevent="goProductDetail(item.spuId)"
          >
            <div class="h5-service-card__icon">
              <img :src="item.icon" alt="" />
              <div v-if="item.tags.length" class="biz-tags">
                <span v-for="tag in item.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
                <span v-if="item.tags.length > 3" :title="item.tags.slice(3).join(' · ')">+{{ item.tags.length - 3 }}</span>
              </div>
            </div>
            <div class="h5-service-card__content">
              <h4>{{ item.title }}</h4>
              <p v-if="item.description" class="h5-service-card__description">{{ item.description }}</p>
              <div class="h5-service-card__foot">
                <p class="h5-service-card__price">
                  <s v-if="item.was">{{ item.was }}</s>
                  {{ item.price }}
                </p>
                <button type="button" @click.stop="goProductDetail(item.spuId)">
                  {{ t("h5.serviceList.bookNow") }}
                </button>
              </div>
            </div>
          </article>
        </div>
        <p v-else-if="isSearchStart" class="h5-service-search__prompt">
          {{ t("h5.serviceList.searchPrompt") }}
        </p>
        <p v-else class="h5-service-search__empty" role="status">
          {{ t("client.home.sections.searchNoResults") }}
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { toPlainText } from "@/modules/client/utils/plain-text"
import { bizTagLabels } from "@/modules/client/utils/biz-tag"
import { serviceTagLabels, useWebsitePromotion } from "@/modules/client/utils/website-promotion"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter, type LocationQueryValue } from "vue-router"
import HomeReturn from "@/modules/h5/components/HomeReturn.vue"
import {
  level1Categories,
  onShelfSpus,
  searchOnShelfSpus,
  type ExclusiveSpuRecord,
  type Level1CategoryRecord,
} from "@/modules/client/api"
import { setClientLocale } from "@/modules/client/locales"

type ServiceCardView = {
  key: string
  spuId: string
  title: string
  description: string
  price: string
  was: string
  icon: string
  tags: string[]
}

const tagIconCertified = new URL(
  "@/assets/images/client/icon10.png",
  import.meta.url,
).href
const tagIconFast = new URL(
  "@/assets/images/client/icon11.png",
  import.meta.url,
).href
const tagIconReliable = new URL(
  "@/assets/images/client/icon12.png",
  import.meta.url,
).href

const cardIconSet = [
  "https://www.figma.com/api/mcp/asset/0928f181-b954-49a5-b2f6-373df17e5a05",
  "https://www.figma.com/api/mcp/asset/c4bfe039-3b87-4506-909a-a3376acba5a7",
  "https://www.figma.com/api/mcp/asset/0726b733-167b-40de-bcc7-c1f3ea51204e",
  "https://www.figma.com/api/mcp/asset/bd8706ba-39ac-4275-a865-5371b9c70f8c",
  "https://www.figma.com/api/mcp/asset/439ddc00-08a0-483f-a15a-c505055cb46d",
  "https://www.figma.com/api/mcp/asset/397e0bd6-cb70-4344-8f7a-758d216f828d",
]

const { t, locale } = useI18n({ useScope: "global" })
const { home: websitePromotions } = useWebsitePromotion(() => "services")
const route = useRoute()
const router = useRouter()

const selectedLevel1 = ref<Level1CategoryRecord | null>(null)
const onShelfRecords = ref<ExclusiveSpuRecord[]>([])
const serviceSearch = ref("")
const searchInput = ref<HTMLInputElement | null>(null)
const isServiceLoading = ref(false)
let serviceRequestId = 0
let categoryRequestId = 0

const getPreferredLangs = () =>
  locale.value === "zh"
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"]

const getQueryValue = (
  value?: LocationQueryValue | LocationQueryValue[] | null,
) => {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === "string" ? raw.trim() : ""
}

const pickI18nValue = (
  i18n?: Record<string, string>,
  fallback = "",
): string => {
  const valueMap = i18n || {}
  for (const lang of getPreferredLangs()) {
    const value = valueMap[lang]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === "string" && value.trim(),
  )
  return typeof firstValue === "string" ? firstValue.trim() : fallback
}

const normalizeTagList = (raw: unknown): string[] => {
  const source = Array.isArray(raw) ? raw : [raw]
  return source
    .flatMap((item) =>
      String(item ?? "")
        .split("|")
        .map((part) => part.trim()),
    )
    .filter(Boolean)
}

const pickI18nTags = (i18n?: Record<string, string[] | string>): string[] => {
  const valueMap = i18n || {}
  for (const lang of getPreferredLangs()) {
    const tags = normalizeTagList(valueMap[lang])
    if (tags.length) {
      return tags
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => normalizeTagList(value).length > 0,
  )
  return normalizeTagList(firstValue)
}

const parseLevel1FromQuery = (): Level1CategoryRecord | null => {
  const raw = getQueryValue(route.query.level1)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object"
      ? (parsed as Level1CategoryRecord)
      : null
  } catch {
    try {
      const decoded = decodeURIComponent(raw)
      const parsed = JSON.parse(decoded)
      return parsed && typeof parsed === "object"
        ? (parsed as Level1CategoryRecord)
        : null
    } catch {
      return null
    }
  }
}

const categoryId = computed(() => getQueryValue(route.query.categoryId))
const searchKeyword = computed(() => getQueryValue(route.query.keyword))
const isSearchMode = computed(
  () => Boolean(searchKeyword.value) || (route.name === "h5-service-search" && !categoryId.value),
)
const isSearchStart = computed(() => isSearchMode.value && !searchKeyword.value)

watch([searchInput, isSearchStart], ([input, searchStart]) => {
  if (searchStart) input?.focus({ preventScroll: true })
}, { flush: "post" })

const defaultHeroTags = computed(() => [
  t("client.serviceList.hero.tagCertified"),
  t("client.serviceList.hero.tagFast"),
  t("client.serviceList.hero.tagReliable"),
])

const pageTitle = computed(() => {
  if (isSearchMode.value) {
    return t("client.home.sections.searchPlaceholder")
  }
  const fromQuery = getQueryValue(route.query.name)
  return pickI18nValue(
    selectedLevel1.value?.nameI18n,
    fromQuery || t("client.serviceList.pageTitle"),
  )
})

const heroTitle = computed(() =>
  pickI18nValue(selectedLevel1.value?.bannerTitleI18n, pageTitle.value),
)
const heroDesc = computed(() => pickI18nValue(selectedLevel1.value?.bannerDescI18n, ""))
const serviceSectionTitle = computed(() =>
  isSearchMode.value
    ? t("h5.serviceList.searchResultsFor", { keyword: searchKeyword.value })
    : locale.value === "zh"
      ? "今天想预约什么服务？"
      : "Choose Service Type",
)

const heroTags = computed(() => {
  const labels = pickI18nTags(selectedLevel1.value?.bannerTagsI18n)
  const source = labels.length ? labels : defaultHeroTags.value
  const icons = [tagIconCertified, tagIconFast, tagIconReliable]
  return source.slice(0, 3).map((label, index) => ({
    label,
    icon: icons[index % icons.length],
  }))
})

const formatPrice = (minPrice?: number | string | null) => {
  if (minPrice === undefined || minPrice === null || minPrice === "") {
    return t("client.serviceList.card.priceConsult")
  }
  const value = Number(minPrice)
  if (!Number.isFinite(value)) {
    return t("client.serviceList.card.priceConsult")
  }
  return t("client.serviceList.card.priceFrom", { price: value.toFixed(2) })
}

const struckFromPrice = (catalog?: number | string | null, current?: number | string | null) => {
  const was = Number(catalog)
  const now = Number(current)
  if (!Number.isFinite(was) || !Number.isFinite(now) || was <= now + 0.009) return ""
  return formatPrice(was)
}

const serviceCards = computed<ServiceCardView[]>(() => {
  const records = onShelfRecords.value || []
  if (!records.length) {
    return []
  }
  return records
    .map((item, index) => ({
      key: String(item.id ?? `service-${index + 1}`),
      spuId: String(item.id ?? ""),
      title: pickI18nValue(item.nameI18n, ""),
      description: toPlainText(pickI18nValue(item.descI18n, "")),
      price: formatPrice(item.minNotIncTaxPrice),
      was: struckFromPrice(item.catalogMinNotIncTaxPrice, item.minNotIncTaxPrice),
      icon: item.imageUrls?.[0] || cardIconSet[index % cardIconSet.length],
      tags: [...new Set([
        ...serviceTagLabels(websitePromotions.value.serviceTags, item.id, categoryId.value, locale.value),
        ...bizTagLabels(item.tags, locale.value),
      ])],
    }))
    .filter((item) => item.title)
})

const syncLocaleToClient = () => {
  setClientLocale(locale.value === "zh" ? "zh" : "en")
}

const loadLevel1Context = async () => {
  const requestId = ++categoryRequestId
  const id = categoryId.value
  const routeName = route.name
  selectedLevel1.value = parseLevel1FromQuery()
  if (!id) return

  try {
    const records = await level1Categories()
    if (requestId !== categoryRequestId || categoryId.value !== id || route.name !== routeName) {
      return
    }

    const record = records.find((item) =>
      String(item.category?.categoryId || item.category?.id || "") === id,
    )
    if (!record) return
    selectedLevel1.value = record

    if (route.name === "h5-service-list" && "level1" in route.query) {
      const query = { ...route.query }
      delete query.level1
      void router.replace({ name: "h5-service-list", query, hash: route.hash })
    }
  } catch (error) {
    if (requestId === categoryRequestId) {
      console.error("load level1 category context failed:", error)
    }
  }
}

const loadOnShelfRecords = async () => {
  const requestId = ++serviceRequestId
  if (isSearchMode.value) {
    if (!searchKeyword.value) {
      onShelfRecords.value = []
      isServiceLoading.value = false
      return
    }
    isServiceLoading.value = true
    onShelfRecords.value = []
    try {
      const records = await searchOnShelfSpus(searchKeyword.value)
      if (requestId === serviceRequestId) onShelfRecords.value = records
    } catch (error) {
      console.error("search on shelf products failed:", error)
      if (requestId === serviceRequestId) onShelfRecords.value = []
    } finally {
      if (requestId === serviceRequestId) isServiceLoading.value = false
    }
    return
  }
  if (!categoryId.value) {
    onShelfRecords.value = []
    isServiceLoading.value = false
    return
  }
  isServiceLoading.value = true
  onShelfRecords.value = []
  try {
    const records = await onShelfSpus({ categoryId: categoryId.value })
    if (requestId === serviceRequestId) onShelfRecords.value = records
  } catch (error) {
    console.error("load on shelf products failed:", error)
    if (requestId === serviceRequestId) onShelfRecords.value = []
  } finally {
    if (requestId === serviceRequestId) isServiceLoading.value = false
  }
}

watch(
  [() => route.name, categoryId, searchKeyword, locale],
  (_current, _previous, onCleanup) => {
    onCleanup(() => {
      categoryRequestId += 1
    })
    syncLocaleToClient()
    serviceSearch.value = searchKeyword.value
    void loadLevel1Context()
    void loadOnShelfRecords()
  },
  { immediate: true },
)

const submitServiceSearch = () => {
  const keyword = serviceSearch.value.trim()
  if (!keyword || isServiceLoading.value) return
  searchInput.value?.blur()
  const location = { name: "h5-service-search", query: { keyword } }
  if (isSearchMode.value) void router.replace(location)
  else void router.push(location)
}

const goProductDetail = (spuId: string) => {
  if (!spuId) {
    return
  }
  router.push({
    name: "h5-product-detail",
    params: { spuId },
  })
}
</script>

<style scoped lang="scss">
.h5-service-page {
  min-height: 100vh;
  background: var(--hourx-client-canvas);
}

.h5-service-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 0 16px 12px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--hourx-client-border);
  backdrop-filter: blur(12px);
}

.h5-service-main {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 40px;
}

.h5-service-hero {
  padding: 26px 20px;
  border-radius: 20px;
  background: linear-gradient(rgb(184 154 114 / 8%) 1px, transparent 1px), linear-gradient(90deg, rgb(184 154 114 / 8%) 1px, transparent 1px), var(--hourx-client-text);
  background-size: 48px 48px;
}

.h5-service-hero__eyebrow {
  display: block;
  margin-bottom: 12px;
  color: var(--hourx-client-accent);
  font-size: var(--hourx-client-size-label);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.h5-service-hero h2 {
  margin: 0;
  color: #fff;
  font-size: var(--hourx-client-size-page);
  line-height: 1.2;
  font-weight: 700;
  font-family: var(--hourx-client-heading-font);
  letter-spacing: -0.02em;
}

.h5-service-hero p {
  margin: 12px 0 0;
  color: var(--hourx-client-on-dark);
  font-size: var(--hourx-client-size-body);
  line-height: 1.55;
  font-weight: 400;
}

.h5-service-hero__tags {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-service-hero__tags span {
  height: auto;
  padding: 0 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.16);
  color: var(--hourx-client-on-dark);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  min-height: 26px;
}

.h5-service-hero__tags img {
  width: 12px;
  height: 12px;
  object-fit: contain;
}

.h5-service-section {
  margin-top: 30px;
}

.h5-service-main--search .h5-service-section {
  margin-top: 0;
}

.h5-service-section__title {
  margin-bottom: 20px;
}

.h5-service-section__title h2 {
  margin: 0;
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-section);
  font-weight: 700;
  font-family: var(--hourx-client-heading-font);
  line-height: 1.2;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.h5-service-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.h5-service-search {
  min-height: 2.75rem;
  padding-left: 0.8125rem;
  border: 1px solid var(--hourx-client-border);
  border-radius: 0.8125rem;
  background: #fff;
  display: flex;
  align-items: center;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.h5-service-search:focus-within {
  border-color: var(--hourx-brand);
  box-shadow: 0 0 0 3px rgb(6 24 47 / 10%);
}

.h5-service-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--hourx-client-text);
  font: inherit;
  font-size: 1rem;
}

.h5-service-search input::-webkit-search-cancel-button {
  display: none;
}

.h5-service-search button {
  align-self: stretch;
  width: 2.75rem;
  flex: 0 0 2.75rem;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--hourx-client-border);
  background: var(--hourx-brand);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.h5-service-search button:disabled {
  background: var(--hourx-client-canvas);
  color: var(--hourx-client-muted);
}

.h5-service-search__button-spinner,
.h5-service-loading__spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid rgba(23, 105, 194, 0.2);
  border-top-color: #1769c2;
  animation: h5-service-spin 700ms linear infinite;
}

.h5-service-search__button-spinner {
  width: 14px;
  height: 14px;
}

.h5-service-loading {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
}

.h5-service-loading__spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.h5-service-loading p {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

@keyframes h5-service-spin {
  to {
    transform: rotate(360deg);
  }
}

.h5-service-search__empty {
  margin: 14px 0 0;
  padding: 18px 10px;
  border: 1px dashed #cbd8e6;
  border-radius: 13px;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}

.h5-service-search__prompt {
  margin: 0;
  color: var(--hourx-client-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

.h5-service-card {
  display: flex;
  align-items: stretch;
  padding: 0;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
  flex-direction: column;
  border: 1px solid var(--hourx-client-border);
  overflow: hidden;
}

.h5-service-card:active {
  transform: scale(0.985);
}

.h5-service-card:focus-visible {
  outline: 3px solid rgba(23, 105, 194, 0.22);
  outline-offset: 2px;
}

.h5-service-card__icon {
  width: 100%;
  height: 180px;
  background: var(--hourx-brand-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.h5-service-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.biz-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 4px;
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
}
.biz-tags span {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgb(6 24 47 / 88%);
  color: #fff;
  font-size: var(--hourx-client-size-label);
  font-weight: 600;
  line-height: 1.5;
}
.h5-service-card__content {
  padding: 18px;
}

.h5-service-card__content h4 {
  margin: 0;
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-card);
  line-height: 1.3;
  font-weight: 600;
  text-align: start;
}

.h5-service-card__price {
  margin: 0;
  color: var(--hourx-brand);
  font-size: 1.125rem;
  font-weight: 700;
  text-align: start;
}

.h5-service-card__price s {
  display: block;
  color: #8b97a8;
  font-size: 0.78em;
  font-weight: 600;
  text-decoration: line-through;
}

.h5-service-card button {
  width: auto;
  border: 0;
  border-radius: 12px;
  background: var(--hourx-brand);
  color: #fff;
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  min-height: 44px;
  padding-inline: 14px;
}

.h5-service-card__description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin: 0;
  color: var(--hourx-client-muted);
  font-size: var(--hourx-client-size-action);
  line-height: 1.55;
}

.h5-service-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--hourx-client-border);
}
</style>
