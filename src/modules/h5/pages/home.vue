<template>
  <div class="h5-home-page">
    <header class="h5-topbar">
      <a class="h5-topbar__brand" href="/h5" @click.prevent="goHome">
        <img class="h5-topbar__logo" :src="logoUrl" alt="HourX" />
        <!-- <span>HourX</span> -->
      </a>
      <div class="h5-topbar__actions">
        <button class="h5-pill h5-pill--ghost" type="button" @click="toggleLocale">
          <img class="h5-pill__icon" :src="languageIconUrl" alt="" />
          <span>{{ localeLabel }}</span>
        </button>
        <button class="h5-pill h5-pill--primary" type="button" @click="goAuthEntry">
          {{ authButtonLabel }}
        </button>
      </div>
    </header>

    <main class="h5-home-main">
      <section class="h5-hero">
        <p class="h5-hero__eyebrow">{{ t('h5.home.hero.eyebrow') }}</p>
        <h1 class="h5-hero__title">{{ t('h5.home.hero.title') }}</h1>
        <p class="h5-hero__desc"></p>
        <div class="h5-hero__tags">
          <span v-for="tag in heroTags" :key="tag">
            <van-icon name="passed" />
            {{ tag }}
          </span>
        </div>
      </section>

      <section class="h5-section">
        <div class="h5-section__header">
          <h2>{{ t('client.home.sections.servicesTitle') }}</h2>
          <p>{{ t('client.home.sections.servicesSubtitle') }}</p>
        </div>
        <div class="h5-service-grid">
          <button
            v-for="item in mobileServiceTiles"
            :key="item.id"
            class="h5-service-tile"
            type="button"
            @click="openServiceList(item)"
          >
            <span class="h5-service-tile__icon">
              <img :src="item.icon" :alt="item.title" />
            </span>
            <span class="h5-service-tile__label">{{ item.title }}</span>
          </button>
        </div>
      </section>

      <section v-if="featuredCards.length" class="h5-section h5-section--muted">
        <div class="h5-section__header">
          <h2>{{ t('client.home.sections.serviceCardsTitle') }}</h2>
        </div>
        <div class="h5-offer-rail">
          <article v-for="item in featuredCards" :key="item.id" class="h5-offer-card">
            <div class="h5-offer-card__media">
              <img :src="item.image" :alt="item.title" />
              <span class="h5-offer-card__badge">{{ t('client.home.serviceCard.badge') }}</span>
            </div>
            <div class="h5-offer-card__body">
              <h3>{{ item.title }}</h3>
              <!-- <p class="h5-offer-card__desc">{{ item.desc }}</p> -->
              <p class="h5-offer-card__price">{{ item.price }}</p>
              <button type="button" @click="goProductDetail(item.spuId)">
                {{ t('client.home.serviceCard.button') }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="h5-booking-section">
        <div class="h5-section__header h5-section__header--light">
          <h2>{{ t('client.home.sections.bookingTitle') }}</h2>
          <p>{{ t('client.home.sections.bookingSubtitle') }}</p>
        </div>
        <div class="h5-booking-steps">
          <article v-for="(item, index) in bookingSteps" :key="item.title" class="h5-booking-step">
            <span class="h5-booking-step__icon">
              <img :src="item.icon" :alt="item.title" />
            </span>
            <h3>{{ index + 1 }}. {{ item.title }}</h3>
            <!-- <p>{{ item.desc }}</p> -->
          </article>
        </div>
      </section>

      <footer class="h5-footer">
        <div class="h5-footer__brand-row">
          <div class="h5-footer__brand">
            <img class="h5-footer__logo" :src="logoUrl" alt="HourX" />
            <strong>HourX</strong>
          </div>
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
            <span class="h5-footer__social-item" aria-label="Instagram">
              <img :src="instagramIconUrl" alt="" />
            </span>
            <span class="h5-footer__social-item" aria-label="WeChat">
              <img :src="wechatIconUrl" alt="" />
            </span>
          </div>
        </div>

        <p class="h5-footer__tagline">{{ t('client.footer.tagline') }}</p>

        <div class="h5-footer__columns">
          <section class="h5-footer__section">
            <h4>{{ t('client.footer.contactUs') }}</h4>
            <p>{{ t('client.footer.contactWhatsapp') }}</p>
            <p>{{ t('client.footer.contactEmail') }}</p>
            <p>{{ t('client.footer.contactLocation') }}</p>
          </section>
          <section class="h5-footer__section">
            <h4>{{ t('client.footer.services') }}</h4>
            <p>{{ t('client.home.contactCard.button') }}</p>
            <p>{{ t('client.header.nav.joinUs') }}</p>
          </section>
        </div>

        <p class="h5-footer__copyright">
          {{ t('client.footer.copyright', { year }) }}
        </p>
      </footer>
    </main>

    <nav class="h5-tabbar">
      <button class="h5-tabbar__item h5-tabbar__item--active" type="button" @click="goHome">
        <van-icon name="home-o" />
        <span>{{ t('client.header.nav.home') }}</span>
      </button>
      <button class="h5-tabbar__item" type="button" @click="router.push({ name: 'h5-orders' })">
        <van-icon name="orders-o" />
        <span>{{ t('client.header.nav.orders') }}</span>
      </button>
      <button class="h5-tabbar__item" type="button" @click="router.push({ name: 'h5-profile' })">
        <van-icon name="contact-o" />
        <span>{{ t('client.header.profile') }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  exclusiveSpus,
  level1Categories,
  type ExclusiveSpuRecord,
  type Level1CategoryRecord,
} from '@/modules/client/api';
import { useAuth } from '@/modules/h5/composables/useAuth';
import { setClientLocale } from '@/modules/client/locales';

type ServiceTile = {
  id: string;
  categoryId: string;
  title: string;
  icon: string;
  placeholder: boolean;
  source?: Level1CategoryRecord;
};

type OfferCard = {
  id: string;
  spuId: string;
  title: string;
  desc: string;
  price: string;
  image: string;
};

type BookingStep = {
  title: string;
  desc: string;
  icon: string;
};

const logoUrl = '/assets/images/client/hourx.svg';
const languageIconUrl = new URL('@/assets/images/client/language-Icon.png', import.meta.url).href;
const facebookIconUrl = new URL('@/assets/images/client/icon_Facebook.png', import.meta.url).href;
const instagramIconUrl = new URL('@/assets/images/client/icon_ins.png', import.meta.url).href;
const wechatIconUrl = new URL('@/assets/images/client/icon_WeChat.png', import.meta.url).href;
const bookingStepIcons = [
  new URL('@/assets/images/client/Icon6.svg', import.meta.url).href,
  new URL('@/assets/images/client/Icon5.svg', import.meta.url).href,
  new URL('@/assets/images/client/Icon4.svg', import.meta.url).href,
];

const defaultOfferImages = [
  'https://www.figma.com/api/mcp/asset/be119407-be81-457f-acb8-6ae8c059b658',
  'https://www.figma.com/api/mcp/asset/1385c0da-6357-456c-a792-85c4faa896fe',
  'https://www.figma.com/api/mcp/asset/689f06ae-e279-491b-8afb-133a682a3d8b',
  'https://www.figma.com/api/mcp/asset/82f87dae-0f7f-4a67-a055-5619d9dfb2ea',
];

const serviceFallbackIcons = [
  'https://www.figma.com/api/mcp/asset/b994c7f7-36cb-4f29-bd2b-3b84781989a8',
  'https://www.figma.com/api/mcp/asset/d8fd8a35-27a2-481f-ae68-86dfd8853932',
  'https://www.figma.com/api/mcp/asset/76b9a7d1-56be-4060-8a95-9ee39978d6de',
  'https://www.figma.com/api/mcp/asset/060f9bb0-e9e2-48af-b272-00840497f1ca',
  'https://www.figma.com/api/mcp/asset/5c35c482-78ab-476a-8a82-cd11b8bf38a7',
  'https://www.figma.com/api/mcp/asset/aeead3a4-7d53-4ee9-88e0-a3a4528b2518',
  'https://www.figma.com/api/mcp/asset/f95b8c61-7087-47e1-b45a-c8e3120953f7',
  'https://www.figma.com/api/mcp/asset/113f43e4-8c4a-45fa-bea7-37db4d19bc1b',
  'https://www.figma.com/api/mcp/asset/70fd0bdd-66f0-42af-a430-cb8006b3a606',
  'https://www.figma.com/api/mcp/asset/7998499a-af87-4d3d-a9a6-16eff69af9fe',
];

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const { isLoggedIn, checkLoginStatus } = useAuth();
const serviceMenuRecords = ref<Level1CategoryRecord[]>([]);
const serviceCardRecords = ref<ExclusiveSpuRecord[]>([]);
const year = new Date().getFullYear();

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const pickI18nValue = (i18n?: Record<string, string>, fallback = ''): string => {
  const valueMap = i18n || {};
  for (const lang of getPreferredLangs()) {
    const value = valueMap[lang];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === 'string' && value.trim(),
  );
  return typeof firstValue === 'string' ? firstValue.trim() : fallback;
};

const normalizeLocale = (value: string) => (value === 'zh' ? 'zh' : 'en');

const syncLocales = (value: string) => {
  const target = normalizeLocale(value);
  locale.value = target;
  localStorage.setItem('h5-locale', target);
  setClientLocale(target);
};

const localeLabel = computed(() =>
  locale.value === 'zh' ? t('client.header.languageZh') : t('client.header.languageEn'),
);
const authButtonLabel = computed(() =>
  isLoggedIn.value ? t('client.header.profile') : t('client.header.auth'),
);

const heroTags = computed(() => [
  t('h5.home.hero.tag1'),
  t('h5.home.hero.tag2'),
  t('h5.home.hero.tag3'),
]);

const formatPriceText = (minPrice?: number | string): string => {
  if (minPrice === undefined || minPrice === null || minPrice === '') {
    return t('client.home.serviceCard.priceConsult');
  }
  const value = Number(minPrice);
  if (!Number.isFinite(value)) {
    return t('client.home.serviceCard.priceConsult');
  }
  return t('client.home.serviceCard.priceFrom', {
    price: Number.isInteger(value) ? value : value.toFixed(2),
  });
};

const featuredCards = computed<OfferCard[]>(() => {
  const records = serviceCardRecords.value || [];
  if (!records.length) {
    return [];
  }
  return records
    .map((item, index) => ({
      id: String(item.id ?? `offer-${index + 1}`),
      spuId: String(item.id ?? ''),
      title: pickI18nValue(item.nameI18n, ''),
      desc: pickI18nValue(item.descI18n, ''),
      price: formatPriceText(item.minPrice),
      image: item.imageUrls?.[0] || defaultOfferImages[index % defaultOfferImages.length],
    }))
    .filter((item) => item.title)
    .slice(0, 4);
});

const mobileServiceTiles = computed<ServiceTile[]>(() => {
  const records = (serviceMenuRecords.value || []).filter((item) => {
    const status = item.category?.status;
    return status === undefined || status === null || String(status) === '1';
  });

  return records.slice(0, 10).map((item, index) => ({
    id: String(item.category?.categoryId || item.category?.id || `service-${index + 1}`),
    categoryId: String(item.category?.categoryId || item.category?.id || ''),
    title: pickI18nValue(
      item.nameI18n,
      item.category?.categoryName?.trim() || t('client.home.defaults.unnamedService'),
    ),
    icon: item.imageUrls?.[0] || serviceFallbackIcons[index % serviceFallbackIcons.length],
    placeholder: false,
    source: item,
  }));
});

const bookingSteps = computed<BookingStep[]>(() => [
  {
    icon: bookingStepIcons[0],
    title: t('client.home.steps.step1Title'),
    desc: t('client.home.steps.step1Desc'),
  },
  {
    icon: bookingStepIcons[1],
    title: t('client.home.steps.step2Title'),
    desc: t('client.home.steps.step2Desc'),
  },
  {
    icon: bookingStepIcons[2],
    title: t('client.home.steps.step3Title'),
    desc: t('client.home.steps.step3Desc'),
  },
]);

const navigateToClient = (path: string, query?: Record<string, string>) => {
  syncLocales(locale.value);
  const url = new URL(path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
};

const goHome = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const goToClientPath = (path: string) => {
  navigateToClient(path);
};

const goAuthEntry = () => {
  router.push({ name: isLoggedIn.value ? 'h5-profile' : 'h5-login' });
};

const openServiceList = (item: ServiceTile) => {
  if (item.placeholder) {
    return;
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
    : '';

  const query: Record<string, string> = {
    name: item.title,
  };
  if (item.categoryId) {
    query.categoryId = item.categoryId;
  }
  if (level1Payload) {
    query.level1 = level1Payload;
  }
  router.push({
    name: 'h5-service-list',
    query,
  });
};

const goProductDetail = (spuId: string) => {
  if (!spuId) {
    return;
  }
  router.push({
    name: 'h5-product-detail',
    params: { spuId },
  });
};

const toggleLocale = () => {
  syncLocales(locale.value === 'zh' ? 'en' : 'zh');
};

const loadServiceMenus = async () => {
  try {
    serviceMenuRecords.value = await level1Categories();
  } catch (error) {
    console.error('load level1 categories failed:', error);
    serviceMenuRecords.value = [];
  }
};

const loadExclusiveCards = async () => {
  try {
    serviceCardRecords.value = await exclusiveSpus();
  } catch (error) {
    console.error('load exclusive spus failed:', error);
    serviceCardRecords.value = [];
  }
};

onMounted(() => {
  syncLocales(locale.value);
  checkLoginStatus();
  void loadServiceMenus();
  void loadExclusiveCards();
});
</script>

<style scoped lang="scss">
.h5-home-page {
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.92);
  min-height: 100vh;
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
}

.h5-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #f1f5f9;
  backdrop-filter: blur(12px);
}

.h5-topbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #12B0FF;
  font-size: 22px;
  font-weight: 900;
  text-decoration: none;
}

.h5-topbar__logo,
.h5-footer__logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  padding: 3px;
}

.h5-topbar__actions {
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
  font-size: 12px;
  font-weight: 700;
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
  background: #12B0FF;
  color: #fff;
}

.h5-home-main {
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
  min-height: calc(100vh - 56px);
  box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.55);
}

.h5-hero {
  background: linear-gradient(180deg, #12B0FF 0%, #4f80f7 100%);
  padding: 26px 24px 24px;
  color: #fff;
  text-align: center;
}

.h5-hero__eyebrow {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 700;
  opacity: 0.9;
}

.h5-hero__title {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.22;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.h5-hero__desc {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 700;
  opacity: 0.96;
  margin-top: 20px;
}

.h5-hero__tags {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-hero__tags span {
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  padding: 0 11px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
}

.h5-section {
  padding: 28px 16px 30px;
}

.h5-section--muted {
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.h5-section__header {
  text-align: center;
}

.h5-section__header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
  color: #0f172b;
}

.h5-section__header p {
  margin: 8px auto 0;
  max-width: 320px;
  color: rgba(15, 23, 42, 0.56);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 600;
}

.h5-section__header--light h2,
.h5-section__header--light p {
  color: #fff;
}

.h5-section__header--light p {
  opacity: 0.82;
}

.h5-service-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px 10px;
}

.h5-service-tile {
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.h5-service-tile__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.h5-service-tile__icon img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.h5-service-tile__label {
  min-height: 32px;
  color: #0f172a;
  font-size: 11px;
  line-height: 1.4;
  font-weight: 700;
  text-align: center;
}

.h5-service-tile--placeholder {
  opacity: 0.48;
}

.h5-service-tile--placeholder .h5-service-tile__icon {
  background: #f3f4f6;
}

.h5-offer-rail {
  margin-top: 18px;
  display: flex;
  align-items: stretch;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
}

.h5-offer-rail::-webkit-scrollbar {
  display: none;
}

.h5-offer-card {
  display: flex;
  flex-direction: column;
  min-width: 166px;
  width: 166px;
  min-height: 200px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #edf2f7;
  background: #fff;
  scroll-snap-align: start;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.h5-offer-card__media {
  position: relative;
  height: 112px;
  background: #f1f5f9;
}

.h5-offer-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h5-offer-card__badge {
  position: absolute;
  top: 8px;
  right: 8px;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: #fb2c36;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.h5-offer-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 12px;
}

.h5-offer-card__body h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.35;
  font-weight: 800;
  min-height: 40px;
}

.h5-offer-card__desc {
  margin: 8px 0 0;
  min-height: 48px;
  color: rgba(15, 23, 42, 0.56);
  font-size: 11px;
  line-height: 1.45;
}

.h5-offer-card__price {
  margin: auto 0 0;
  color: #12B0FF;
  text-align: center;
  font-size: 14px;
  font-weight: 800;
}

.h5-offer-card__body button {
  margin-top: 10px;
  width: 100%;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: #12B0FF;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.h5-booking-section {
  background: linear-gradient(180deg, #12B0FF 0%, #4a7ef8 100%);
  padding: 28px 16px 32px;
}

.h5-booking-steps {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
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
  font-size: 13px;
  line-height: 1.4;
  font-weight: 800;
}

.h5-booking-step p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  line-height: 1.45;
}

.h5-footer {
  background: #0f172b;
  border-top: 1px solid #1d293d;
  color: rgba(255, 255, 255, 0.6);
  padding: 24px 24px 18px;
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
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 12px;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.h5-footer__section h4 {
  margin: 0 0 16px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  line-height: 20px;
}

.h5-footer__section p {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  word-break: break-word;
}

.h5-footer__copyright {
  margin: 24px 0 0;
  padding-top: 16px;
  border-top: 1px solid #1d293d;
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
  width: min(430px, 100vw);
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
}

.h5-tabbar__item {
  height: 58px;
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

.h5-tabbar__item--active {
  color: #12B0FF;
}

.h5-tabbar__item :deep(.van-icon) {
  font-size: 20px;
}
</style>
