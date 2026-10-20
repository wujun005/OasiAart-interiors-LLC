<template>
  <div id="home" class="home-page">
    <section class="hero-section" aria-labelledby="home-hero-title">
      <img
        class="hero-section__image"
        :src="homeBannerUrl"
        alt="HourX home services"
      />
      <div class="hero-section__overlay">
        <div class="hero-section__content">
          <h1 id="home-hero-title">{{ t("client.home.hero.headline") }}</h1>
          <p>{{ t("client.home.hero.description") }}</p>
          <ul
            class="hero-section__trust"
            aria-label="HourX booking information"
          >
            <li>
              <span aria-hidden="true">✓</span
              >{{ t("client.home.hero.trustPlatform") }}
            </li>
            <li>
              <span aria-hidden="true">✓</span
              >{{ t("client.home.hero.trustBooking") }}
            </li>
          </ul>
          <div class="hero-section__actions" aria-label="Banner actions">
            <button
              class="hero-section__action hero-section__action--primary"
              type="button"
              @click="scrollToServices"
            >
              {{ t("client.home.hero.cta") }}
            </button>
            <button
              class="hero-section__action hero-section__action--whatsapp"
              type="button"
              @click="openWhatsApp"
            >
              <img :src="whatsappIconUrl" alt="" />
              <span>{{ t("client.home.hero.whatsappCta") }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <button
      class="contact-card"
      type="button"
      :aria-label="t('client.home.contactCard.button')"
      @click="openWhatsApp"
    >
      <img :src="kefuImageUrl" :alt="t('client.home.contactCard.button')" />
      <span class="contact-card__text">{{
        t("client.home.contactCard.button")
      }}</span>
    </button>

    <section id="services" class="services-section" aria-labelledby="home-services-title">
      <div class="home-container">
        <header class="home-intro">
          <div class="home-intro__heading">
            <p class="home-intro__eyebrow">
              {{ t("client.home.sections.servicesTitle") }}
            </p>
            <h2 id="home-services-title">{{ t("client.home.sections.serviceSelectorTitle") }}</h2>
          </div>
          <p class="home-intro__description">
            {{ t("client.home.sections.serviceSelectorSubtitle") }}
          </p>
        </header>
        <div id="home-services-grid" class="services-grid">
          <button
            v-for="item in visibleServiceTiles"
            :key="item.id"
            class="services-grid__item"
            type="button"
            :aria-label="item.title"
            @click="openServiceList(item)"
          >
            <div class="services-grid__icon" aria-hidden="true">
              <img v-if="item.icon" :src="item.icon" alt="" loading="lazy" decoding="async" />
            </div>
            <div class="services-grid__content">
              <h3>{{ item.title }}</h3>
              <span v-if="item.description" class="services-grid__description">
                {{ item.description }}
              </span>
              <span class="services-grid__link">
                {{ t("client.home.serviceTile.action") }}
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </button>
        </div>
        <button
          v-if="canToggleServices"
          class="services-toggle"
          type="button"
          :aria-expanded="servicesExpanded"
          aria-controls="home-services-grid"
          @click="servicesExpanded = !servicesExpanded"
        >
          <span>{{
            servicesExpanded
              ? t("client.home.serviceTile.collapse")
              : t("client.home.serviceTile.expand")
          }}</span>
          <span class="services-toggle__chevron" aria-hidden="true" />
        </button>
      </div>
    </section>

    <div id="packages">
      <PackageShowcase />
    </div>

    <section class="booking-section">
      <div class="home-container">
        <h2 class="section-title section-title--light">
          {{ t("client.home.sections.bookingTitle") }}
        </h2>
        <p class="section-subtitle section-subtitle--light">
          {{ t("client.home.sections.bookingSubtitle") }}
        </p>

        <div class="booking-steps">
          <div class="booking-steps__line" />
          <article
            v-for="(item, index) in bookingSteps"
            :key="item.title"
            class="booking-step"
          >
            <div class="booking-step__icon">
              <img :src="item.icon" :alt="item.title" />
            </div>
            <h3>{{ index + 1 }}. {{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="join-us" class="trust-section">
      <div class="home-container">
        <h2 class="section-title">
          {{ t("client.home.sections.aboutTitle") }}
        </h2>
        <p class="section-subtitle section-subtitle--line">
          {{ t("client.home.sections.aboutSubtitle") }}
        </p>

        <div class="trust-grid">
          <article v-for="item in reasons" :key="item.title" class="trust-card">
            <div class="trust-card__icon">
              <img :src="item.icon" alt="" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="final-cta-section">
      <div class="home-container">
        <div class="final-cta">
          <div class="final-cta__copy">
            <h2>{{ t("client.home.sections.finalCtaTitle") }}</h2>
            <p>{{ t("client.home.sections.finalCtaSubtitle") }}</p>
          </div>
          <div class="final-cta__actions">
            <button
              class="final-cta__button final-cta__button--primary"
              type="button"
              @click="scrollToServices"
            >
              {{ t("client.home.sections.finalCtaBrowse") }}
            </button>
            <button
              class="final-cta__button final-cta__button--whatsapp"
              type="button"
              @click="openWhatsApp"
            >
              <img :src="whatsappIconUrl" alt="" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import PackageShowcase from "@/modules/client/components/PackageShowcase.vue"
import {
  level1Categories,
  type Level1CategoryRecord,
} from "@/modules/client/api"

type ServiceTile = {
  id: string
  categoryId: string
  title: string
  description: string
  icon: string
  placeholder: boolean
  source?: Level1CategoryRecord
}

type BookingStep = {
  title: string
  desc: string
  icon: string
}

type Reason = {
  title: string
  desc: string
  icon: string
}

const kefuImageUrl = new URL("@/assets/images/client/kefu.png", import.meta.url)
  .href
const homeBannerUrl = new URL(
  "@/assets/images/client/home-banner.png",
  import.meta.url,
).href
const whatsappIconUrl = new URL(
  "@/assets/images/client/icon_whatsapp.svg",
  import.meta.url,
).href

const defaultServiceIcons = [
  "https://www.figma.com/api/mcp/asset/eb5c30c7-689f-4ed5-bbbd-d173eed0127f",
  "https://www.figma.com/api/mcp/asset/09552e9b-ee1f-4389-9c80-8ad2058e2a6d",
  "https://www.figma.com/api/mcp/asset/4fd2bf43-6d9b-4120-b782-12f955ead59c",
  "https://www.figma.com/api/mcp/asset/1cb9d72b-e802-4cc7-84c8-34ca417a10c7",
  "https://www.figma.com/api/mcp/asset/6a649f2a-a66f-4922-b744-d52b9db77848",
]

const bookingStepIcons = [
  new URL("@/assets/images/client/Icon6.svg", import.meta.url).href,
  new URL("@/assets/images/client/Icon5.svg", import.meta.url).href,
  new URL("@/assets/images/client/Icon4.svg", import.meta.url).href,
]

const reasonIcons = [
  new URL("@/assets/images/client/Icon7.svg", import.meta.url).href,
  new URL("@/assets/images/client/Icon_quick.png", import.meta.url).href,
  new URL("@/assets/images/client/Icon9.svg", import.meta.url).href,
]

const { t, locale } = useI18n({ useScope: "global" })
const router = useRouter()

const serviceMenuRecords = ref<Level1CategoryRecord[]>([])

const getPreferredLangs = () =>
  locale.value === "zh"
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"]

const pickI18nValue = (
  i18n?: Record<string, string>,
  fallback = "",
): string => {
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

const serviceTiles = computed<ServiceTile[]>(() => {
  const records = serviceMenuRecords.value || []
  const filtered = records.filter((item) => {
    const status = item.category?.status
    return status === undefined || status === null || String(status) === "1"
  })
  const source = filtered.length ? filtered : records
  const mapped = source
    .map((item, index) => ({
      id: String(
        item.category?.categoryId ||
          item.category?.id ||
          `service-${index + 1}`,
      ),
      categoryId: String(item.category?.categoryId || item.category?.id || ""),
      title: pickI18nValue(
        item.nameI18n,
        item.category?.categoryName?.trim() ||
          t("client.home.defaults.unnamedService"),
      ),
      description: pickI18nValue(item.bannerDescI18n, ""),
      icon:
        item.imageUrls?.[0] ||
        defaultServiceIcons[index % defaultServiceIcons.length],
      placeholder: false,
      source: item,
    }))
    .filter((item) => item.title)

  return mapped.slice(0, 10)
})

const servicesExpanded = ref(false)
const serviceColumns = ref(3)
const collapsedServiceCount = computed(() => serviceColumns.value * 2)
const visibleServiceTiles = computed(() =>
  servicesExpanded.value
    ? serviceTiles.value
    : serviceTiles.value.slice(0, collapsedServiceCount.value),
)
const canToggleServices = computed(
  () => serviceTiles.value.length > collapsedServiceCount.value,
)

const syncServiceColumns = () => {
  if (window.matchMedia("(max-width: 640px)").matches) {
    serviceColumns.value = 1
  } else if (window.matchMedia("(max-width: 960px)").matches) {
    serviceColumns.value = 2
  } else {
    serviceColumns.value = 3
  }
}

const bookingSteps = computed<BookingStep[]>(() => [
  {
    icon: bookingStepIcons[0],
    title: t("client.home.steps.step1Title"),
    desc: t("client.home.steps.step1Desc"),
  },
  {
    icon: bookingStepIcons[1],
    title: t("client.home.steps.step2Title"),
    desc: t("client.home.steps.step2Desc"),
  },
  {
    icon: bookingStepIcons[2],
    title: t("client.home.steps.step3Title"),
    desc: t("client.home.steps.step3Desc"),
  },
])

const reasons = computed<Reason[]>(() => [
  {
    title: t("client.home.defaults.reason1Title"),
    desc: t("client.home.defaults.reason1Desc"),
    icon: reasonIcons[0],
  },
  {
    title: t("client.home.defaults.reason2Title"),
    desc: t("client.home.defaults.reason2Desc"),
    icon: reasonIcons[1],
  },
  {
    title: t("client.home.defaults.reason3Title"),
    desc: t("client.home.defaults.reason3Desc"),
    icon: reasonIcons[2],
  },
])

const loadServiceMenus = async () => {
  try {
    serviceMenuRecords.value = await level1Categories()
  } catch (error) {
    console.error("load level1 categories failed:", error)
    serviceMenuRecords.value = []
  }
}

const openServiceList = (item: ServiceTile) => {
  if (item.placeholder) {
    return
  }
  const level1Payload = item.source
    ? JSON.stringify({
        category: item.source.category || {},
        nameI18n: item.source.nameI18n || {},
        imageUrls: item.source.imageUrls || [],
        bannerTitleI18n: item.source.bannerTitleI18n || {},
        bannerDescI18n: item.source.bannerDescI18n || {},
        bannerTagsI18n: item.source.bannerTagsI18n || {},
      })
    : ""
  const query: Record<string, string> = {
    name: item.title,
  }
  if (item.categoryId) {
    query.categoryId = item.categoryId
  }
  if (level1Payload) {
    query.level1 = level1Payload
  }

  router.push({
    path: "/services/daily-cleaning",
    query,
  })
}

const scrollToServices = () => {
  const servicesSection = document.getElementById("services")
  if (!servicesSection) {
    return
  }
  const targetTop =
    servicesSection.getBoundingClientRect().top + window.scrollY - 96
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" })
}

const openWhatsApp = () => {
  window.open(
    "https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F",
    "_blank",
    "noopener,noreferrer",
  )
}

onMounted(() => {
  syncServiceColumns()
  window.addEventListener("resize", syncServiceColumns)
  loadServiceMenus()
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncServiceColumns)
})
</script>

<style scoped lang="scss">
#packages {
  scroll-margin-top: 96px;
}

.home-page {
  --primary: var(--hourx-brand);
  --primary-dark: var(--hourx-brand-hover);
  --text-main: rgba(15, 23, 42, 0.9);
  --text-sub: rgba(15, 23, 42, 0.5);
  background: #fff;
  color: var(--text-main);
  font-family: "Inter", "Noto Sans SC", "PingFang SC", sans-serif;
}

.home-container {
  width: min(1200px, calc(100% - 48px));
  margin: 0 auto;
}

.hero-section {
  position: relative;
  width: 100%;
  height: clamp(420px, 36vw, 550px);
  overflow: hidden;
  line-height: 0;
  background: var(--hourx-brand-soft);
}

.hero-section__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  background: linear-gradient(
    90deg,
    var(--hourx-brand) 0%,
    var(--hourx-brand) 60%,
    rgba(7, 33, 59, 0.82) 76%,
    rgba(7, 33, 59, 0.28) 100%
  );
}

.hero-section__content {
  width: min(620px, calc(100% - 72px));
  margin-left: max(36px, calc((100vw - 1280px) / 2));
  color: #fff;
  line-height: normal;
}

.hero-section__content h1 {
  max-width: 600px;
  margin: 0;
  font-size: clamp(38px, 3.2vw, 42px);
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.035em;
}

.hero-section__content > p {
  max-width: 570px;
  margin: 22px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 19px;
  line-height: 1.6;
  font-weight: 500;
}

.hero-section__trust {
  margin: 24px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 14px 28px;
  list-style: none;
}

.hero-section__trust li {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #fff;
  font-size: 15px;
  font-weight: 750;
}

.hero-section__trust li > span {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.hero-section__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 48%;
}

.hero-section__actions {
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: normal;
}

.hero-section__action {
  min-width: 152px;
  height: 54px;
  padding: 0 28px;
  border: 1px solid transparent;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.hero-section__action:hover {
  transform: translateY(-2px);
}

.hero-section__action:focus-visible {
  outline: 3px solid rgba(5, 21, 43, 0.36);
  outline-offset: 3px;
}

.hero-section__action--primary {
  min-width: 200px;
  min-height: 62px;
  border: none;
  background: linear-gradient(135deg, #77f4dd 0%, #2ed8bd 100%);
  color: #05152b;
  font-size: 17px;
  font-weight: 900;
  box-shadow:
    0 18px 40px rgba(4, 25, 48, 0.48),
    0 0 0 6px rgba(119, 244, 221, 0.16);
}

.hero-section__action--primary:hover {
  background: linear-gradient(135deg, #91f8e5 0%, #43e3c8 100%);
  box-shadow:
    0 22px 48px rgba(4, 25, 48, 0.56),
    0 0 0 8px rgba(119, 244, 221, 0.22);
}

.hero-section__action--whatsapp {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.72);
  box-shadow: none;
  font-weight: 600;
}

.hero-section__action--whatsapp:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.45);
  color: rgba(255, 255, 255, 0.88);
}

.hero-section__action--whatsapp img {
  width: 24px;
  height: 24px;
}

.contact-card {
  position: fixed;
  right: 32px;
  bottom: 32px;
  width: 160px;
  height: 112px;
  padding: 8px;
  border: 0;
  background: transparent;
  z-index: 60;
  cursor: pointer;
}

.contact-card img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.contact-card__text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.services-section {
  padding: 48px 0 40px;
}

.home-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  text-align: left;
}

.home-intro__heading {
  min-width: 0;
}

.home-intro__eyebrow {
  margin: 0;
  color: var(--primary);
  font-size: 10px;
  line-height: 1.4;
  font-weight: 750;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.home-intro h2 {
  margin: 8px 0 0;
  color: var(--hourx-brand);
  font-size: clamp(26px, 2.4vw, 32px);
  line-height: 1.2;
  font-weight: 750;
  letter-spacing: -0.035em;
}

.home-intro__description {
  max-width: 310px;
  margin: 0 0 2px;
  color: #738093;
  font-size: 13px;
  line-height: 1.65;
  font-weight: 400;
}

.section-title {
  margin: 0;
  color: var(--primary);
  text-align: center;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 800;
}

.section-subtitle {
  margin: 20px auto 0;
  color: rgba(15, 23, 42, 0.35);
  text-align: center;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 700;
}

.section-subtitle--line {
  width: min(1216px, 100%);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}

.section-subtitle--line::before,
.section-subtitle--line::after {
  content: "";
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #90a1b9 100%);
}

.section-subtitle--line::after {
  background: linear-gradient(90deg, #90a1b9 0%, rgba(0, 0, 0, 0) 100%);
}

.services-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.services-grid__item {
  position: relative;
  min-width: 0;
  height: 148px;
  padding: 17px 18px;
  box-sizing: border-box;
  border: 1px solid #e5eaf0;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: start;
  gap: 14px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.025);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.services-grid__item:hover {
  transform: translateY(-2px);
  border-color: #adbcca;
  box-shadow: 0 8px 20px rgba(5, 21, 43, 0.06);
}

.services-grid__item:focus-visible {
  outline: 2px solid var(--hourx-brand);
  outline-offset: 3px;
}

.services-grid__icon {
  width: 44px;
  height: 44px;
  border: 1px solid #e5eaf0;
  border-radius: 12px;
  background: var(--hourx-brand-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.services-grid__icon img {
  width: 25px;
  height: 25px;
  object-fit: contain;
  filter: var(--hourx-brand-filter);
}

.services-grid__item--product .services-grid__icon {
  overflow: hidden;
}

.services-grid__item--product .services-grid__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
}

.services-grid__content {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.services-grid__item h3 {
  display: -webkit-box;
  width: 100%;
  max-height: 42px;
  margin: 1px 0 0;
  overflow: hidden;
  color: var(--hourx-brand);
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.02em;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.services-grid__description {
  max-width: 100%;
  margin-top: 6px;
  color: #738093;
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.services-grid__link {
  margin-top: auto;
  padding-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--hourx-brand);
  font-size: 11px;
  line-height: 1.3;
  font-weight: 650;
}

.services-grid__link span {
  font-size: 15px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.services-grid__item:hover .services-grid__link span {
  transform: translateX(4px);
}

.services-grid__item--placeholder .services-grid__icon {
  background: rgba(5, 21, 43, 0.05);
}

.services-grid__item--placeholder {
  cursor: default;
  transform: none;
  opacity: 0.62;
}

.services-grid__item--placeholder:hover {
  transform: none;
}

.services-toggle {
  min-width: 132px;
  height: 40px;
  margin: 16px auto 0;
  padding: 0 18px;
  border: 1px solid #e5eaf0;
  border-radius: 12px;
  background: #fff;
  color: var(--hourx-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.025);
}

.services-toggle:hover {
  border-color: #adbcca;
}

.services-toggle:focus-visible {
  outline: 2px solid var(--hourx-brand);
  outline-offset: 3px;
}

.services-toggle__chevron {
  width: 8px;
  height: 8px;
  margin-top: -3px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
}

.services-toggle[aria-expanded="true"] .services-toggle__chevron {
  margin-top: 3px;
  transform: rotate(225deg);
}

.booking-section {
  background: var(--primary);
  padding: 80px 0 96px;
}

.section-title--light {
  color: #fff;
}

.section-subtitle--light {
  color: #e5eaf1;
}

.booking-steps {
  margin-top: 64px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.booking-steps__line {
  position: absolute;
  top: 44px;
  left: 16%;
  width: 68%;
  height: 2px;
  // background: rgba(81, 162, 255, 0.3);
  // border-top: 2px solid rgba(142, 197, 255, 0.4);
}

.booking-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 40px;
  z-index: 1;
}

.booking-step__icon {
  width: 96px;
  height: 72px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.booking-step__icon img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.booking-step h3 {
  margin: 0;
  color: #fff;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
}

.booking-step p {
  margin: 0;
  color: rgba(219, 234, 254, 0.8);
  font-size: 16px;
  line-height: 26px;
  font-weight: 500;
}

.trust-section {
  padding: 104px 0 108px;
  background: #f8fafc;
}

.trust-grid {
  margin-top: 52px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.trust-card {
  min-height: 220px;
  padding: 32px;
  border: 1px solid #e7edf5;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
}

.trust-card__icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    var(--hourx-brand-soft) 0%,
    var(--hourx-brand-soft) 100%
  );
}

.trust-card__icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: var(--hourx-brand-filter);
}

.trust-card h3 {
  margin: 24px 0 0;
  color: var(--hourx-brand);
  font-size: 21px;
  line-height: 1.35;
  font-weight: 800;
}

.trust-card p {
  margin: 12px 0 0;
  color: rgba(15, 23, 42, 0.58);
  font-size: 15px;
  line-height: 1.65;
  font-weight: 500;
}

.final-cta-section {
  padding: 72px 0 80px;
}

.final-cta {
  padding: 46px 52px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 36px;
  background: linear-gradient(
    135deg,
    var(--hourx-brand) 0%,
    var(--hourx-brand-hover) 58%,
    var(--hourx-brand) 145%
  );
  box-shadow: 0 22px 48px rgba(15, 41, 74, 0.18);
}

.final-cta__copy h2 {
  margin: 0;
  color: #fff;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 850;
}

.final-cta__copy p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  line-height: 1.6;
}

.final-cta__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 12px;
}

.final-cta__button {
  height: 50px;
  padding: 0 22px;
  border: 1px solid transparent;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.final-cta__button--primary {
  background: #fff;
  color: var(--hourx-brand);
}

.final-cta__button--whatsapp {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.final-cta__button--whatsapp img {
  width: 22px;
  height: 22px;
}

@media (max-width: 1300px) {
  .services-grid {
    gap: 12px;
  }

}

@media (max-width: 960px) {
  .home-container {
    width: calc(100% - 32px);
  }

  .hero-section {
    width: 100%;
    height: clamp(410px, 51vw, 500px);
  }

  .hero-section__actions {
    margin-top: 22px;
  }

  .hero-section__content {
    width: min(560px, calc(100% - 48px));
    margin-left: 24px;
  }

  .hero-section__content h1 {
    font-size: clamp(38px, 6vw, 52px);
  }

  .hero-section__action {
    min-width: 136px;
    height: 48px;
    padding: 0 22px;
    border-radius: 12px;
    font-size: 15px;
  }

  .section-title {
    font-size: 26px;
  }

  .section-subtitle {
    margin-top: 14px;
    font-size: 16px;
  }

  .section-subtitle--line {
    grid-template-columns: 1fr;
  }

  .section-subtitle--line::before,
  .section-subtitle--line::after {
    display: none;
  }

  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .services-grid__item {
    padding: 16px;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 12px;
  }

  .services-grid__icon {
    width: 40px;
    height: 40px;
    border-radius: 11px;
  }

  .services-grid__icon img {
    width: 24px;
    height: 24px;
  }

  .home-intro {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .home-intro__description {
    max-width: none;
  }

  .booking-steps {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .booking-steps__line {
    display: none;
  }

  .booking-step {
    gap: 16px;
  }

  .booking-step h3 {
    font-size: 24px;
  }

  .trust-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .trust-card {
    min-height: 0;
    padding: 24px;
  }

  .final-cta {
    padding: 36px;
    align-items: flex-start;
    flex-direction: column;
  }

  .final-cta__actions {
    width: 100%;
  }

  .contact-card {
    width: 136px;
    height: 96px;
    padding: 6px;
    right: 16px;
    bottom: 16px;
    cursor: pointer;
  }
}

@media (max-width: 640px) {
  .contact-card {
    display: none;
  }

  .services-section {
    padding: 32px 0;
  }

  .home-intro h2 {
    font-size: 25px;
  }

  .home-intro__description {
    font-size: 12px;
  }

  .services-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .services-grid__item {
    height: 140px;
    padding: 14px;
  }

  .services-grid__description {
    -webkit-line-clamp: 2;
  }

  .trust-section {
    padding: 72px 0;
  }

  .final-cta-section {
    padding: 48px 0 56px;
  }

  .final-cta {
    padding: 28px 22px;
    border-radius: 20px;
  }

  .final-cta__copy h2 {
    font-size: 24px;
  }

  .final-cta__actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .final-cta__button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .services-grid__item,
  .services-grid__link span {
    transition: none;
  }

  .services-grid__item:hover {
    transform: none;
  }
}
</style>
