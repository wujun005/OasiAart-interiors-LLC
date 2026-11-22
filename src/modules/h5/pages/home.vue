<template>
  <div class="h5-home-page">
    <header class="h5-topbar">
      <div class="h5-topbar__main">
        <a class="h5-topbar__brand" href="/h5" @click.prevent="goHome">
          <img class="h5-topbar__logo" :src="logoUrl" alt="HourX" />
          <!-- <span>HourX</span> -->
        </a>
        <div class="h5-topbar__actions">
          <button
            class="h5-pill h5-pill--ghost"
            type="button"
            @click="toggleLocale"
          >
            <img class="h5-pill__icon" :src="languageIconUrl" alt="" />
            <span>{{ localeLabel }}</span>
          </button>
          <button
            v-if="!isLoggedIn"
            class="h5-pill h5-pill--primary"
            type="button"
            @click="goAuthEntry"
          >
            {{ authButtonLabel }}
          </button>
          <div v-else class="h5-account">
            <button
              class="h5-account__trigger"
              type="button"
              :aria-label="t('h5.profile.accountMenu.open')"
              :aria-expanded="accountMenuOpen"
              @click.stop="accountMenuOpen = !accountMenuOpen"
            >
              <img :src="avatarIconUrl" alt="" />
            </button>
            <div
              v-if="accountMenuOpen"
              class="h5-account__menu"
              role="menu"
              @click.stop
            >
              <button type="button" role="menuitem" @click="openAccountList('booking')">
                <van-icon name="orders-o" aria-hidden="true" />
                <span>{{ t("h5.profile.menu.bookings") }}</span>
              </button>
              <button type="button" role="menuitem" @click="openAccountList('package')">
                <van-icon name="gift-o" aria-hidden="true" />
                <span>{{ t("h5.profile.menu.packages") }}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                @click="openAccountSection()"
              >
                <van-icon name="contact-o" aria-hidden="true" />
                <span>{{ t("client.header.accountSettings") }}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                @click="openAccountSection('addresses')"
              >
                <van-icon name="location-o" />
                <span>{{ t("h5.profile.menu.addresses") }}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                @click="openAccountSection('payments')"
              >
                <van-icon name="balance-o" />
                <span>{{ t("h5.profile.menu.payments") }}</span>
              </button>
              <button type="button" role="menuitem" @click="openSupport">
                <van-icon name="service-o" />
                <span>{{ t("h5.profile.accountMenu.help") }}</span>
              </button>
              <button
                class="h5-account__logout"
                type="button"
                role="menuitem"
                @click="handleHeaderLogout"
              >
                <van-icon name="close" />
                <span>{{ t("client.header.logout") }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div
      v-if="accountMenuOpen"
      class="h5-account__scrim"
      aria-hidden="true"
      @click="accountMenuOpen = false"
    ></div>

    <main class="h5-home-main">
      <HomeHero @select="selectHomeBanner" />
      <WebsitePromotions />

      <section id="services" class="h5-section">
        <form
          class="h5-home-search"
          role="search"
          @submit.prevent="submitHomeSearch"
        >
          <van-icon name="search" aria-hidden="true" />
          <input
            v-model="homeSearch"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            :placeholder="t('client.home.sections.searchPlaceholder')"
            :aria-label="t('client.home.sections.searchPlaceholder')"
          />
          <button
            type="submit"
            :aria-label="t('client.home.sections.searchPlaceholder')"
          >
            <van-icon name="arrow" />
          </button>
        </form>
        <header class="h5-home-intro">
          <p class="h5-home-intro__eyebrow">
            {{ t("client.home.sections.servicesTitle") }}
          </p>
          <h2>{{ t("client.home.sections.serviceSelectorTitle") }}</h2>
          <p class="h5-home-intro__description">
            {{ t("client.home.sections.serviceSelectorSubtitle") }}
          </p>
        </header>
        <div id="h5-service-grid" class="h5-service-grid">
          <button
            v-for="item in visibleMobileServiceTiles"
            :key="item.id"
            class="h5-service-tile"
            type="button"
            @click="openServiceList(item)"
          >
            <span class="h5-service-tile__icon">
              <img :src="item.icon" :alt="item.title" />
            </span>
            <span class="h5-service-tile__copy">
              <span v-if="tilePromo(item.categoryId)" class="h5-service-tile__promo">{{ tilePromo(item.categoryId) }}</span>
              <span class="h5-service-tile__label">{{ item.title }}</span>
              <span v-if="item.description" class="h5-service-tile__description">{{ item.description }}</span>
              <span class="h5-service-tile__link">{{ t("client.home.serviceTile.action") }} →</span>
            </span>
          </button>
        </div>
        <button
          v-if="canToggleMobileServices"
          class="h5-service-toggle"
          type="button"
          :aria-expanded="servicesExpanded"
          aria-controls="h5-service-grid"
          @click="servicesExpanded = !servicesExpanded"
        >
          <span>{{
            servicesExpanded
              ? t("client.home.serviceTile.collapse")
              : t("client.home.serviceTile.expand")
          }}</span>
          <span class="h5-service-toggle__chevron" aria-hidden="true" />
        </button>
      </section>

      <PackageShowcase platform="h5" />

      <section class="h5-booking-section">
        <div class="h5-section__header h5-section__header--light">
          <span class="h5-section__eyebrow">{{ t("client.home.sections.bookingEyebrow") }}</span>
          <h2>{{ t("client.home.sections.bookingTitle") }}</h2>
        </div>
        <div class="h5-booking-steps">
          <article
            v-for="(item, index) in bookingSteps"
            :key="item.title"
            class="h5-booking-step"
          >
            <span class="h5-booking-step__icon">
              <img :src="item.icon" :alt="item.title" />
            </span>
            <span class="h5-section__eyebrow">
              {{ t("client.home.steps.number", { number: index + 1 }) }}
            </span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </section>

      <section id="why-hourx" class="h5-trust-section">
        <div class="h5-section__header">
          <span class="h5-section__eyebrow">{{ t("client.home.sections.aboutEyebrow") }}</span>
          <h2>{{ t("client.home.sections.aboutTitle") }}</h2>
          <p>{{ t("client.home.sections.aboutSubtitle") }}</p>
        </div>
        <div class="h5-trust-grid">
          <article
            v-for="item in trustReasons"
            :key="item.title"
            class="h5-trust-card"
          >
            <span class="h5-trust-card__icon">
              <img :src="item.icon" alt="" />
            </span>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="h5-final-cta">
        <h2>{{ t("client.home.sections.finalCtaTitle") }}</h2>
        <p>{{ t("client.home.sections.finalCtaSubtitle") }}</p>
        <div class="h5-final-cta__actions">
          <button
            class="h5-final-cta__button h5-final-cta__button--primary"
            type="button"
            @click="scrollToServices"
          >
            {{ t("client.home.sections.finalCtaBrowse") }}
          </button>
          <button
            class="h5-final-cta__button h5-final-cta__button--whatsapp"
            type="button"
            @click="openWhatsApp"
          >
            <img :src="whatsappIconUrl" alt="" />
            <span>WhatsApp</span>
          </button>
        </div>
      </section>

      <footer class="h5-footer">
        <div class="h5-footer__brand-row">
          <a
            class="h5-footer__brand"
            href="/h5/#/"
            aria-label="Back to homepage"
            @click.prevent="goHome"
          >
            <img class="h5-footer__logo" :src="logoUrl" alt="HourX" />
          </a>
          <div class="h5-footer__social">
            <a
              class="h5-footer__social-item"
              href="https://www.facebook.com/profile.php?id=61583039242229"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <img :src="facebookIconUrl" alt="" />
            </a>
            <a
              class="h5-footer__social-item"
              href="https://www.linkedin.com/company/hourx-home/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <img :src="linkedinIconUrl" alt="" />
            </a>
            <a
              class="h5-footer__social-item"
              href="https://www.instagram.com/hourxhomeservice.ae?igsi=Mnp2OWtrZDVja2lx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <img :src="instagramIconUrl" alt="" />
            </a>
            <a
              class="h5-footer__social-item"
              href="https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <img :src="whatsappIconUrl" alt="" />
            </a>
          </div>
        </div>

        <p class="h5-footer__tagline">{{ t("client.footer.tagline") }}</p>

        <div class="h5-footer__columns">
          <section class="h5-footer__section">
            <h4>{{ t("client.footer.contactUs") }}</h4>
            <a
              class="h5-footer__contact-row"
              href="mailto:support@hourxportal.com"
            >
              <img :src="emailIconUrl" alt="" />
              <span>{{ t("client.footer.contactEmail") }}</span>
            </a>
            <a
              class="h5-footer__contact-row"
              href="https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img :src="whatsappIconUrl" alt="" />
              <span>{{ t("client.footer.whatsapp") }}</span>
            </a>
            <p class="h5-footer__contact-row">
              <img :src="locationIconUrl" alt="" />
              <span>{{ t("client.footer.contactLocation") }}</span>
            </p>
          </section>
          <section class="h5-footer__section">
            <h4>{{ t("client.footer.quickLinks") }}</h4>
            <a href="/h5/#/" @click.prevent="goHome">{{
              t("client.header.nav.home")
            }}</a>
            <a href="#services" @click.prevent="scrollToServices">{{
              t("client.footer.services")
            }}</a>
            <a
              href="/h5/#/orders?kind=booking"
              @click.prevent="router.push({ name: 'h5-orders', query: { kind: 'booking' } })"
            >
              {{ t("client.profile.menu.bookings") }}
            </a>
            <a
              href="/h5/#/join-us/apply"
              @click.prevent="router.push({ name: 'h5-supplier-onboarding' })"
            >{{ t("client.header.nav.joinUs") }}</a>
            <a href="/faq">{{ t("client.footer.faq") }}</a>
          </section>
          <section class="h5-footer__section">
            <h4>{{ t("client.footer.businessHours") }}</h4>
            <p>{{ t("client.footer.weekday") }}</p>
            <p>{{ t("client.footer.saturday") }}</p>
            <p>{{ t("client.footer.sunday") }}</p>
          </section>
        </div>

        <div class="h5-footer__bottom">
          <div class="h5-footer__legal-links">
            <a href="/terms">{{ t("client.footer.terms") }}</a>
            <a href="/privacy">{{ t("client.footer.privacy") }}</a>
            <a href="/data-deletion">{{ t("client.footer.dataDeletion") }}</a>
          </div>
          <div
            class="h5-footer__payments"
            role="group"
            :aria-label="t('client.footer.paymentsLabel')"
          >
            <img :src="visaIconUrl" alt="Visa" />
            <img :src="mastercardIconUrl" alt="Mastercard" />
            <img :src="applePayIconUrl" alt="Apple Pay" />
          </div>
        </div>

        <p class="h5-footer__copyright">
          {{ t("client.footer.copyright", { year }) }}
        </p>
      </footer>
    </main>

    <nav class="h5-tabbar">
      <button
        class="h5-tabbar__item h5-tabbar__item--active"
        type="button"
        @click="goHome"
      >
        <van-icon name="home-o" />
        <span>{{ t("client.header.nav.home") }}</span>
      </button>
      <button
        class="h5-tabbar__item"
        type="button"
        @click="router.push({ name: 'h5-cart' })"
      >
        <span class="h5-tabbar__cart-icon">
          <van-icon name="cart-o" />
          <b v-if="cartCount">{{ cartCount > 99 ? "99+" : cartCount }}</b>
        </span>
        <span>{{ t("client.header.nav.cart") }}</span>
      </button>
      <button
        class="h5-tabbar__item"
        type="button"
        @click="router.push({ name: 'h5-profile' })"
      >
        <van-icon name="contact-o" />
        <span>{{ t("client.header.profile") }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { showConfirmDialog, showSuccessToast } from "vant"
import {
  level1Categories,
  type Level1CategoryRecord,
} from "@/modules/client/api"
import { useAuth } from "@/modules/h5/composables/useAuth"
import { setClientLocale } from "@/modules/client/locales"
import { useCart } from "@/modules/client/composables/useCart"
import HomeHero from "@/modules/client/components/HomeHero.vue"
import WebsitePromotions from "@/modules/client/components/WebsitePromotions.vue"
import PackageShowcase from "@/modules/client/components/PackageShowcase.vue"
import { serviceTagLabels, useWebsitePromotion } from "@/modules/client/utils/website-promotion"

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

type TrustReason = {
  title: string
  desc: string
  icon: string
}

const logoUrl = "/assets/images/client/hourx-mark.svg"
const languageIconUrl = new URL(
  "@/assets/images/client/language-Icon.png",
  import.meta.url,
).href
const avatarIconUrl = new URL(
  "@/assets/images/client/icon13.png",
  import.meta.url,
).href
const facebookIconUrl = new URL(
  "@/assets/images/client/icon_facebook.svg",
  import.meta.url,
).href
const linkedinIconUrl = new URL(
  "@/assets/images/client/icon_linkedin.svg",
  import.meta.url,
).href
const instagramIconUrl = new URL(
  "@/assets/images/client/icon_instagram.svg",
  import.meta.url,
).href
const whatsappIconUrl = new URL(
  "@/assets/images/client/icon_whatsapp.svg",
  import.meta.url,
).href
const emailIconUrl = new URL(
  "@/assets/images/client/icon_email.svg",
  import.meta.url,
).href
const locationIconUrl = new URL(
  "@/assets/images/client/icon_location.svg",
  import.meta.url,
).href
const visaIconUrl = new URL(
  "@/assets/images/client/payment_visa.svg",
  import.meta.url,
).href
const mastercardIconUrl = new URL(
  "@/assets/images/client/payment_mastercard.svg",
  import.meta.url,
).href
const applePayIconUrl = new URL(
  "@/assets/images/client/payment_apple_pay.svg",
  import.meta.url,
).href
const bookingStepIcons = [
  new URL("@/assets/images/client/Icon6.svg", import.meta.url).href,
  new URL("@/assets/images/client/Icon5.svg", import.meta.url).href,
  new URL("@/assets/images/client/Icon4.svg", import.meta.url).href,
]
const trustReasonIcons = [
  new URL("@/assets/images/client/Icon7.svg", import.meta.url).href,
  new URL("@/assets/images/client/Icon_quick.png", import.meta.url).href,
  new URL("@/assets/images/client/Icon9.svg", import.meta.url).href,
]

const serviceFallbackIcons = [
  "https://www.figma.com/api/mcp/asset/b994c7f7-36cb-4f29-bd2b-3b84781989a8",
  "https://www.figma.com/api/mcp/asset/d8fd8a35-27a2-481f-ae68-86dfd8853932",
  "https://www.figma.com/api/mcp/asset/76b9a7d1-56be-4060-8a95-9ee39978d6de",
  "https://www.figma.com/api/mcp/asset/060f9bb0-e9e2-48af-b272-00840497f1ca",
  "https://www.figma.com/api/mcp/asset/5c35c482-78ab-476a-8a82-cd11b8bf38a7",
  "https://www.figma.com/api/mcp/asset/aeead3a4-7d53-4ee9-88e0-a3a4528b2518",
  "https://www.figma.com/api/mcp/asset/f95b8c61-7087-47e1-b45a-c8e3120953f7",
  "https://www.figma.com/api/mcp/asset/113f43e4-8c4a-45fa-bea7-37db4d19bc1b",
  "https://www.figma.com/api/mcp/asset/70fd0bdd-66f0-42af-a430-cb8006b3a606",
  "https://www.figma.com/api/mcp/asset/7998499a-af87-4d3d-a9a6-16eff69af9fe",
]

const { t, locale } = useI18n({ useScope: "global" })
const { home: websitePromotions } = useWebsitePromotion(() => "home")
const tilePromo = (categoryId: string) =>
  serviceTagLabels(websitePromotions.value.serviceTags, "", categoryId, locale.value)[0] || ""
const router = useRouter()
const { cartCount } = useCart()
const { isLoggedIn, clearAuth, checkLoginStatus } = useAuth()
const serviceMenuRecords = ref<Level1CategoryRecord[]>([])
const accountMenuOpen = ref(false)
const homeSearch = ref("")
const year = new Date().getFullYear()

const getPreferredLangs = () =>
  locale.value === "zh"
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"]

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

const normalizeLocale = (value: string) => (value === "zh" ? "zh" : "en")

const syncLocales = (value: string) => {
  const target = normalizeLocale(value)
  locale.value = target
  localStorage.setItem("h5-locale", target)
  setClientLocale(target)
}

const localeLabel = computed(() =>
  locale.value === "zh"
    ? t("client.header.languageZh")
    : "EN",
)
const authButtonLabel = computed(() =>
  isLoggedIn.value ? t("client.header.profile") : t("client.header.auth"),
)

const mobileServiceTiles = computed<ServiceTile[]>(() => {
  const records = (serviceMenuRecords.value || []).filter((item) => {
    const status = item.category?.status
    return status === undefined || status === null || String(status) === "1"
  })

  return records.slice(0, 10).map((item, index) => ({
    id: String(
      item.category?.categoryId || item.category?.id || `service-${index + 1}`,
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
      serviceFallbackIcons[index % serviceFallbackIcons.length],
    placeholder: false,
    source: item,
  }))
})

const MOBILE_VISIBLE_SERVICES = 4
const servicesExpanded = ref(false)
const visibleMobileServiceTiles = computed(() =>
  servicesExpanded.value
    ? mobileServiceTiles.value
    : mobileServiceTiles.value.slice(0, MOBILE_VISIBLE_SERVICES),
)
const canToggleMobileServices = computed(
  () => mobileServiceTiles.value.length > MOBILE_VISIBLE_SERVICES,
)

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

const trustReasons = computed<TrustReason[]>(() => [
  {
    title: t("client.home.defaults.reason1Title"),
    desc: t("client.home.defaults.reason1Desc"),
    icon: trustReasonIcons[0],
  },
  {
    title: t("client.home.defaults.reason2Title"),
    desc: t("client.home.defaults.reason2Desc"),
    icon: trustReasonIcons[1],
  },
  {
    title: t("client.home.defaults.reason3Title"),
    desc: t("client.home.defaults.reason3Desc"),
    icon: trustReasonIcons[2],
  },
])

const navigateToClient = (path: string, query?: Record<string, string>) => {
  syncLocales(locale.value)
  const url = new URL(path, window.location.origin)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value)
      }
    })
  }
  window.location.assign(`${url.pathname}${url.search}${url.hash}`)
}

const goHome = () => {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" })
}

const goToClientPath = (path: string) => {
  navigateToClient(path)
}

const goAuthEntry = () => {
  router.push({ name: isLoggedIn.value ? "h5-profile" : "h5-login" })
}

const openAccountList = (kind: "booking" | "package") => {
  accountMenuOpen.value = false
  router.push({ name: "h5-orders", query: { kind } })
}

const openAccountSection = (section?: "addresses" | "payments" | "support") => {
  accountMenuOpen.value = false
  router.push({
    name: "h5-profile",
    query: section ? { section } : undefined,
  })
}

const openSupport = () => {
  openAccountSection("support")
}

const handleHeaderLogout = async () => {
  try {
    await showConfirmDialog({
      title: t("h5.profile.logoutConfirm.title"),
      message: t("h5.profile.logoutConfirm.message"),
      confirmButtonText: t("h5.profile.logoutConfirm.confirm"),
      cancelButtonText: t("h5.profile.logoutConfirm.cancel"),
    })
  } catch {
    return
  }
  accountMenuOpen.value = false
  clearAuth()
  showSuccessToast(t("h5.profile.logoutSuccess"))
  await router.replace({ name: "h5-home" })
}

const submitHomeSearch = () => {
  const keyword = homeSearch.value.trim()
  if (!keyword) return
  router.push({ name: "h5-service-search", query: { keyword } })
}

const openServiceList = (item: ServiceTile) => {
  if (item.placeholder) {
    return
  }
  const query: Record<string, string> = {
    name: item.title,
  }
  if (item.categoryId) {
    query.categoryId = item.categoryId
  }
  router.push({
    name: "h5-service-list",
    query,
  })
}

const selectHomeBanner = (topic: 'cleaning' | 'ac' | 'app') => {
  const categoryName = {
    cleaning: /home cleaning|daily cleaning|日常清洁|家庭清洁|居家清洁/,
    ac: /\bac\b|air conditioning|空调/i,
  }
  const category = topic === 'app' ? undefined : mobileServiceTiles.value.find(item => {
    const names = [item.title, ...Object.values(item.source?.nameI18n || {})]
    return names.some(name => categoryName[topic].test(name.toLowerCase()))
  })
  if (category) openServiceList(category)
  else scrollToServices()
}

const scrollToServices = () => {
  const servicesSection = document.getElementById("services")
  if (!servicesSection) {
    return
  }
  const targetTop =
    servicesSection.getBoundingClientRect().top + window.scrollY - 64
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" })
}

const openWhatsApp = () => {
  window.open(
    "https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F",
    "_blank",
    "noopener,noreferrer",
  )
}

const toggleLocale = () => {
  syncLocales(locale.value === "zh" ? "en" : "zh")
}

const loadServiceMenus = async () => {
  try {
    serviceMenuRecords.value = await level1Categories()
  } catch (error) {
    console.error("load level1 categories failed:", error)
    serviceMenuRecords.value = []
  }
}

onMounted(() => {
  syncLocales(locale.value)
  checkLoginStatus()
  void loadServiceMenus()
})
</script>

<style scoped lang="scss">
.h5-home-page {
  background: var(--hourx-client-canvas);
  color: var(--hourx-client-text);
  min-height: 100vh;
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
}

.h5-topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #f1f5f9;
  backdrop-filter: blur(12px);
}

.h5-topbar__main {
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-topbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--hourx-brand);
  font-size: 22px;
  font-weight: 900;
  text-decoration: none;
}

.h5-topbar__logo {
  width: 63px;
  height: 37px;
  object-fit: contain;
}

.h5-footer__logo {
  width: 72px;
  height: 42px;
  object-fit: contain;
}

.h5-topbar__actions {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.h5-pill {
  height: 32px;
  border-radius: 999px;
  border: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
}

.h5-pill__icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
}

.h5-pill--ghost {
  background: #f8fafc;
  color: #475569;
}

.h5-pill--primary {
  background: var(--hourx-brand);
  color: #fff;
}

.h5-account {
  position: relative;
}

.h5-account__trigger {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 2px solid #e5eaf1;
  border-radius: 999px;
  background: var(--hourx-brand-soft);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.h5-account__trigger img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h5-account__menu {
  position: absolute;
  top: 42px;
  right: 0;
  z-index: 2;
  width: 218px;
  padding: 6px;
  border: 1px solid #e5eaf1;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
}

.h5-account__menu button {
  width: 100%;
  min-height: 42px;
  padding: 0 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  text-align: left;
}

.h5-account__menu button:active {
  background: var(--hourx-brand-soft);
}

.h5-account__menu :deep(.van-icon) {
  width: 20px;
  color: #607086;
  font-size: 18px;
  text-align: center;
}

.h5-account__menu .h5-account__logout {
  margin-top: 4px;
  border-top: 1px solid #edf1f5;
  border-radius: 0 0 9px 9px;
  color: #dc4040;
}

.h5-account__menu .h5-account__logout :deep(.van-icon) {
  color: #dc4040;
}

.h5-account__scrim {
  position: fixed;
  inset: 64px 0 0;
  z-index: 30;
  background: rgba(15, 23, 42, 0.08);
}

.h5-home-main {
  max-width: 75rem;
  margin: 0 auto;
  background: var(--hourx-client-canvas);
  min-height: calc(100vh - 64px);
}

.h5-section {
  padding: 56px 16px 0;
}

.h5-home-search {
  display: flex;
  align-items: center;
  height: 48px;
  margin: 0 0 22px;
  padding-left: 14px;
  overflow: hidden;
  border: 1px solid #d7e2ee;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.h5-home-search :deep(.van-icon) {
  flex: 0 0 auto;
  color: #7b8ba0;
  font-size: 18px;
}

.h5-home-search input {
  min-width: 0;
  flex: 1;
  height: 100%;
  margin-left: 8px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
  font-size: 14px;
}

.h5-home-search input::-webkit-search-cancel-button {
  display: none;
}

.h5-home-search button {
  align-self: stretch;
  width: 48px;
  flex: 0 0 48px;
  padding: 0;
  border: 0;
  border-left: 1px solid #e5edf6;
  background: #f4f7fa;
  color: var(--hourx-brand);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.h5-home-search button :deep(.van-icon) {
  color: var(--hourx-brand);
  font-size: 16px;
}

.h5-home-search:focus-within {
  border-color: #1769c2;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.1);
}

.h5-home-intro {
  text-align: left;
}

.h5-home-intro__eyebrow {
  margin: 0;
  color: var(--hourx-client-accent-ink);
  font-size: var(--hourx-client-size-label);
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.h5-home-intro h2 {
  margin: 10px 0 0;
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-section);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.015em;
  font-family: var(--hourx-client-heading-font);
}

.h5-home-intro__description {
  max-width: 360px;
  margin: 12px 0 0;
  color: var(--hourx-client-muted);
  font-size: var(--hourx-client-size-body);
  line-height: 1.55;
  font-weight: 400;
}

.h5-section__header {
  text-align: center;
}

.h5-section__header h2 {
  margin: 0;
  font-size: var(--hourx-client-size-section);
  line-height: 1.25;
  font-weight: 700;
  color: var(--hourx-client-text);
  font-family: var(--hourx-client-heading-font);
  letter-spacing: -0.015em;
}

.h5-section__header p {
  margin: 8px auto 0;
  max-width: 320px;
  color: var(--hourx-client-muted);
  font-size: var(--hourx-client-size-body);
  line-height: 1.55;
  font-weight: 400;
}

.h5-section__header--light h2 {
  color: #fff;
}

.h5-section__eyebrow {
  display: block;
  margin: 0 0 10px;
  color: var(--hourx-client-accent-ink);
  font-size: var(--hourx-client-size-label);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.h5-section__header--light .h5-section__eyebrow,
.h5-booking-step .h5-section__eyebrow {
  color: var(--hourx-client-accent);
}

.h5-service-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.h5-service-tile {
  min-width: 0;
  min-height: 144px;
  border: 1px solid #dce7f3;
  border-radius: 14px;
  background: #fff;
  padding: 20px;
  display: grid;
  align-items: start;
  justify-content: center;
  gap: 16px;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
  grid-template-columns: 44px minmax(0, 1fr);
  border-color: var(--hourx-client-border);
  text-align: start;
}

.h5-service-tile:active {
  transform: scale(0.975);
  border-color: rgba(5, 21, 43, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.h5-service-tile__icon {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(5, 21, 43, 0.12);
  border-radius: 12px;
  background: linear-gradient(
    145deg,
    var(--hourx-brand-soft) 0%,
    var(--hourx-brand-soft) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  box-sizing: border-box;
  border-color: var(--hourx-client-border);
}

.h5-service-tile__icon img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: var(--hourx-brand-filter);
}

.h5-service-tile__promo {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8faf7;
  color: #0a7a6a;
  font-size: 11px;
  font-weight: 700;
}
.h5-service-tile__label {
  max-width: 100%;
  display: -webkit-box;
  overflow: hidden;
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-card);
  line-height: 1.3;
  font-weight: 600;
  text-align: start;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.h5-service-tile__copy {
  display: grid;
  gap: 6px;
}

.h5-service-tile__description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--hourx-client-muted);
  font-size: var(--hourx-client-size-body);
}

.h5-service-tile__link {
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
}

.h5-service-toggle {
  width: auto;
  height: 44px;
  margin-top: 16px;
  border: 1px solid #dce7f3;
  border-radius: 12px;
  background: #fff;
  color: var(--hourx-brand);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font: inherit;
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  cursor: pointer;
  line-height: 1;
  padding-inline: 16px;
  border-color: var(--hourx-client-border);
}

.h5-service-toggle__chevron {
  width: 7px;
  height: 7px;
  margin-top: -3px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
}

.h5-service-toggle[aria-expanded="true"] .h5-service-toggle__chevron {
  margin-top: 3px;
  transform: rotate(225deg);
}

.h5-service-tile--placeholder {
  opacity: 0.48;
}

.h5-service-tile--placeholder .h5-service-tile__icon {
  background: #f3f4f6;
}

.h5-service-tile--product .h5-service-tile__icon {
  overflow: hidden;
}

.h5-service-tile--product .h5-service-tile__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
}

@media (max-width: 360px) {
  .h5-section {
    padding-right: 14px;
    padding-left: 14px;
  }

  .h5-service-grid {
    gap: 8px;
  }

  .h5-service-tile {
    min-height: 78px;
    padding: 8px 6px;
    gap: 6px;
  }

  .h5-service-tile__icon {
    width: 32px;
    height: 32px;
  }

  .h5-service-tile__icon img {
    width: 20px;
    height: 20px;
  }

}

.h5-booking-section {
  background: var(--hourx-client-text);
  padding: 56px 16px;
}

.h5-booking-steps {
  margin-top: 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.h5-booking-step {
  text-align: center;
  color: #fff;
}

.h5-booking-step__icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.h5-booking-step__icon img {
  display: block;
  width: auto;
  height: auto;
  max-width: 28px;
  max-height: 28px;
  object-fit: contain;
}

.h5-booking-step h3 {
  margin: 0;
  font-size: var(--hourx-client-size-card);
  line-height: 1.3;
  font-weight: 600;
  color: #fff;
}

.h5-booking-step p {
  margin: 8px 0 0;
  color: var(--hourx-client-on-dark);
  font-size: var(--hourx-client-size-action);
  line-height: 1.55;
  font-weight: 400;
}

.h5-trust-section {
  padding: 56px 16px 0;
  background: var(--hourx-client-canvas);
}

.h5-trust-grid {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}

.h5-trust-card {
  padding: 16px;
  border: 1px solid #e5edf5;
  border-radius: 16px;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  align-items: start;
  gap: 13px;
  background: #fff;
  border-color: var(--hourx-client-border);
}

.h5-trust-card__icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    var(--hourx-brand-soft) 0%,
    var(--hourx-brand-soft) 100%
  );
}

.h5-trust-card__icon img {
  width: 25px;
  height: 25px;
  object-fit: contain;
}

.h5-trust-card h3 {
  margin: 1px 0 0;
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-card);
  line-height: 1.3;
  font-weight: 600;
}

.h5-trust-card p {
  margin: 5px 0 0;
  color: var(--hourx-client-muted);
  font-size: var(--hourx-client-size-action);
  line-height: 1.55;
  font-weight: 400;
}

.h5-final-cta {
  margin: 56px 16px;
  padding: 28px 20px;
  border-radius: 20px;
  text-align: start;
  color: #fff;
  background: var(--hourx-client-text);
}

.h5-final-cta h2 {
  margin: 0;
  font-size: var(--hourx-client-size-section);
  line-height: 1.25;
  font-weight: 700;
  color: #fff;
  font-family: var(--hourx-client-heading-font);
  letter-spacing: -0.015em;
}

.h5-final-cta p {
  margin: 8px auto 0;
  max-width: 300px;
  color: var(--hourx-client-on-dark);
  font-size: var(--hourx-client-size-body);
  line-height: 1.55;
  font-weight: 400;
}

.h5-final-cta__actions {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.h5-final-cta__button {
  height: 40px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font: inherit;
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  line-height: 1;
}

.h5-final-cta__button--primary {
  background: #fff;
  color: var(--hourx-brand);
}

.h5-final-cta__button--whatsapp {
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.h5-final-cta__button--whatsapp img {
  width: 19px;
  height: 19px;
}

.h5-footer {
  background: #08121f;
  border-top: 1px solid #1d293d;
  color: var(--hourx-client-on-dark);
  padding: 24px 24px calc(76px + env(safe-area-inset-bottom));
}

.h5-footer__brand-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.h5-footer__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.4;
  text-decoration: none;
}

.h5-footer__logo {
  width: 33px;
  height: 32px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
}

.h5-footer__social {
  display: flex;
  gap: 16px;
}

.h5-footer__social-item {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.h5-footer__social-item:active {
  transform: scale(0.94);
}

.h5-footer__social-item img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.h5-footer__tagline {
  margin: 16px 0 0;
  font-size: 12px;
  line-height: 19.5px;
  font-weight: 500;
}

.h5-footer__columns {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

.h5-footer__section h4 {
  margin: 0 0 16px;
  color: #fff;
  font-size: var(--hourx-client-size-label);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.h5-footer__section p,
.h5-footer__section a {
  margin: 0 0 12px;
  font-size: var(--hourx-client-size-action);
  line-height: 1.6;
  font-weight: 400;
  word-break: break-word;
  color: inherit;
  text-decoration: none;
  display: block;
}

.h5-footer__section .h5-footer__contact-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.h5-footer__section a.h5-footer__contact-row span {
  white-space: nowrap;
}

.h5-footer__contact-row img {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
}

.h5-footer__bottom {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid #1d293d;
}

.h5-footer__legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.h5-footer__legal-links a {
  color: var(--hourx-client-on-dark);
  font-size: 0.8125rem;
  line-height: 1.5;
  text-decoration: none;
}

.h5-footer__payments {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.h5-footer__payments img {
  width: 48px;
  height: 27px;
  display: block;
}

.h5-footer__copyright {
  margin: 18px 0 0;
  text-align: center;
  font-size: 10px;
  line-height: 15px;
  color: rgba(255, 255, 255, 0.4);
}

.h5-tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 25;
  width: 100%;
  max-width: 430px;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.08);
  padding: 0 4px env(safe-area-inset-bottom);
  box-sizing: border-box;
}

.h5-tabbar__item {
  width: 100%;
  min-width: 0;
  height: 58px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
}

.h5-tabbar__item > span:last-child {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h5-tabbar__item--active {
  color: var(--hourx-brand);
}

.h5-tabbar__item :deep(.van-icon) {
  font-size: 20px;
}

.h5-tabbar__cart-icon {
  position: relative;
  display: inline-flex;
}

.h5-tabbar__cart-icon b {
  position: absolute;
  top: -8px;
  right: -12px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 8px;
  font-weight: 900;
  line-height: 13px;
}
</style>
