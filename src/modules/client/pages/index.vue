<template>
  <div id="home" class="home-page">
    <section class="hero-section">
      <div class="home-container hero-section__inner">
        <div class="hero-section__content">
          <p class="hero-section__eyebrow">{{ t('client.home.hero.eyebrow') }}</p>
          <h1 class="hero-section__title">
            {{ t('client.home.hero.titleLine1') }}
            {{ t('client.home.hero.titleLine2') }}
          </h1>
          <p class="hero-section__desc">{{ t('client.home.hero.desc') }}</p>
          <button class="hero-section__cta" type="button" @click="scrollToOffers">
            {{ t('client.home.hero.cta') }}
          </button>
          <div class="hero-section__tags">
            <span v-for="tag in heroTags" :key="tag">
              <img src="@/assets/images/client/Icon1.png" alt="" />
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <div class="contact-card">
      <div class="contact-card__agent">
        <img :src="supportAgentUrl" :alt="t('client.home.alt.supportAgent')" />
        <span class="contact-card__status" />
      </div>
      <button type="button">{{ t('client.home.contactCard.button') }}</button>
    </div>

    <section id="services" class="services-section">
      <div class="home-container">
        <h2 class="section-title">{{ t('client.home.sections.servicesTitle') }}</h2>
        <p class="section-subtitle section-subtitle--line">
          {{ t('client.home.sections.servicesSubtitle') }}
        </p>
        <div class="services-grid">
          <article
            v-for="item in serviceTiles"
            :key="item.id"
            class="services-grid__item"
            :class="{ 'services-grid__item--placeholder': item.placeholder }"
            @click="openServiceList(item)"
          >
            <div class="services-grid__icon">
              <img v-if="item.icon" :src="item.icon" :alt="item.title" />
            </div>
            <p>{{ item.title }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="orders" class="offers-section">
      <div class="home-container">
        <h2 class="section-title">{{ t('client.home.sections.serviceCardsTitle') }}</h2>
        <div class="offers-grid">
          <article v-for="item in featuredCards" :key="item.id" class="offer-card">
            <div class="offer-card__media">
              <img :src="item.image" :alt="item.title" />
              <span class="offer-card__badge">{{ t('client.home.serviceCard.badge') }}</span>
            </div>
            <div class="offer-card__body">
              <h3>{{ item.title }}</h3>
              <p class="offer-card__desc">{{ item.desc }}</p>
              <p class="offer-card__price">{{ item.price }}</p>
              <button type="button" @click="goProductDetail(item.spuId)">
                {{ t('client.home.serviceCard.button') }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="booking-section">
      <div class="home-container">
        <h2 class="section-title section-title--light">
          {{ t('client.home.sections.bookingTitle') }}
        </h2>
        <p class="section-subtitle section-subtitle--light">
          {{ t('client.home.sections.bookingSubtitle') }}
        </p>

        <div class="booking-steps">
          <div class="booking-steps__line" />
          <article v-for="(item, index) in bookingSteps" :key="item.title" class="booking-step">
            <div class="booking-step__icon">
              <img :src="item.icon" :alt="item.title" />
            </div>
            <h3>{{ index + 1 }}. {{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="join-us" class="about-section">
      <div class="home-container">
        <h2 class="section-title">{{ t('client.home.sections.aboutTitle') }}</h2>
        <p class="section-subtitle section-subtitle--line">
          {{ t('client.home.sections.aboutSubtitle') }}
        </p>

        <div class="about-content">
          <div class="about-content__left">
            <h3>{{ t('client.home.aboutIntro.title') }}</h3>
            <ul>
              <li v-for="line in aboutBulletList" :key="line">{{ line }}</li>
            </ul>
            <div class="about-reasons">
              <article v-for="item in reasons" :key="item.title" class="about-reason">
                <div class="about-reason__icon-wrap">
                  <img :src="item.icon" :alt="item.title" />
                  <span v-if="item.highlight" />
                </div>
                <h4 style="text-align: center;">{{ item.title }}</h4>
                <p>{{ item.desc }}</p>
              </article>
            </div>
          </div>

          <div class="about-content__image">
            <img :src="aboutImageUrl" :alt="t('client.home.alt.about')" />
          </div>
        </div>
      </div>
    </section>
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

type Reason = {
  title: string;
  desc: string;
  icon: string;
  highlight?: boolean;
};

const supportAgentUrl = new URL('@/assets/images/client/kefu.jpeg', import.meta.url).href;
const aboutImageUrl = new URL('@/assets/images/client/fengmian.png', import.meta.url).href;;

const defaultServiceIcons = [
  'https://www.figma.com/api/mcp/asset/eb5c30c7-689f-4ed5-bbbd-d173eed0127f',
  'https://www.figma.com/api/mcp/asset/09552e9b-ee1f-4389-9c80-8ad2058e2a6d',
  'https://www.figma.com/api/mcp/asset/4fd2bf43-6d9b-4120-b782-12f955ead59c',
  'https://www.figma.com/api/mcp/asset/1cb9d72b-e802-4cc7-84c8-34ca417a10c7',
  'https://www.figma.com/api/mcp/asset/6a649f2a-a66f-4922-b744-d52b9db77848',
];

const defaultOfferImages = [
  'https://www.figma.com/api/mcp/asset/be119407-be81-457f-acb8-6ae8c059b658',
  'https://www.figma.com/api/mcp/asset/1385c0da-6357-456c-a792-85c4faa896fe',
  'https://www.figma.com/api/mcp/asset/689f06ae-e279-491b-8afb-133a682a3d8b',
  'https://www.figma.com/api/mcp/asset/82f87dae-0f7f-4a67-a055-5619d9dfb2ea',
];

const bookingStepIcons = [
  new URL('@/assets/images/client/Icon6.svg', import.meta.url).href,
  new URL('@/assets/images/client/Icon5.svg', import.meta.url).href,
  new URL('@/assets/images/client/Icon4.svg', import.meta.url).href,
  
];

const reasonIcons = [
  new URL('@/assets/images/client/Icon7.svg', import.meta.url).href,
  new URL('@/assets/images/client/Icon8.svg', import.meta.url).href,
  new URL('@/assets/images/client/Icon9.svg', import.meta.url).href,
];

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const serviceMenuRecords = ref<Level1CategoryRecord[]>([]);
const serviceCardRecords = ref<ExclusiveSpuRecord[]>([]);

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const pickI18nValue = (i18n?: Record<string, string>, fallback = ''): string => {
  const valueMap = i18n || {};
  const preferredLangs = getPreferredLangs();
  for (const lang of preferredLangs) {
    const value = valueMap[lang];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === 'string' && value.trim(),
  );
  if (typeof firstValue === 'string') {
    return firstValue.trim();
  }
  return fallback;
};

const serviceTiles = computed<ServiceTile[]>(() => {
  const records = serviceMenuRecords.value || [];
  const filtered = records.filter((item) => {
    const status = item.category?.status;
    return status === undefined || status === null || String(status) === '1';
  });
  const source = filtered.length ? filtered : records;
  const mapped = source
    .map((item, index) => ({
      id: String(item.category?.categoryId || item.category?.id || `service-${index + 1}`),
      categoryId: String(item.category?.categoryId || item.category?.id || ''),
      title: pickI18nValue(
        item.nameI18n,
        item.category?.categoryName?.trim() || t('client.home.defaults.unnamedService'),
      ),
      icon: item.imageUrls?.[0] || defaultServiceIcons[index % defaultServiceIcons.length],
      placeholder: false,
      source: item,
    }))
    .filter((item) => item.title);

  return mapped.slice(0, 10);
});

const defaultOfferCards = computed<OfferCard[]>(() => [
  {
    id: 'offer-default-1',
    spuId: '',
    title: t('client.home.defaults.card1Title'),
    desc: t('client.home.defaults.card1Desc'),
    price: t('client.home.defaults.card1Price'),
    image: defaultOfferImages[0],
  },
  {
    id: 'offer-default-2',
    spuId: '',
    title: t('client.home.defaults.card2Title'),
    desc: t('client.home.defaults.card2Desc'),
    price: t('client.home.defaults.card2Price'),
    image: defaultOfferImages[1],
  },
  {
    id: 'offer-default-3',
    spuId: '',
    title: t('client.home.defaults.card3Title'),
    desc: t('client.home.defaults.card3Desc'),
    price: t('client.home.defaults.card3Price'),
    image: defaultOfferImages[2],
  },
  {
    id: 'offer-default-4',
    spuId: '',
    title: t('client.home.defaults.card4Title'),
    desc: t('client.home.defaults.card4Desc'),
    price: t('client.home.defaults.card4Price'),
    image: defaultOfferImages[3],
  },
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
    return defaultOfferCards.value;
  }
  const mapped = records
    .map((item, index) => {
      const fallback = defaultOfferCards.value[index % defaultOfferCards.value.length];
      return {
        id: String(item.id ?? `offer-${index + 1}`),
        spuId: String(item.id ?? ''),
        title: pickI18nValue(item.nameI18n, fallback.title),
        desc: pickI18nValue(item.descI18n, fallback.desc),
        price: formatPriceText(item.minPrice),
        image: item.imageUrls?.[0] || fallback.image,
      };
    })
    .filter((item) => item.title);
  return (mapped.length ? mapped : defaultOfferCards.value).slice(0, 4);
});

const heroTags = computed(() => [
  t('client.home.hero.tag1'),
  t('client.home.hero.tag2'),
  t('client.home.hero.tag3'),
]);

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

const aboutBulletList = computed(() => [
  t('client.home.aboutIntro.bullet1'),
  t('client.home.aboutIntro.bullet2'),
  t('client.home.aboutIntro.bullet3'),
  t('client.home.aboutIntro.bullet4'),
]);

const reasons = computed<Reason[]>(() => [
  {
    title: t('client.home.defaults.reason1Title'),
    desc: t('client.home.defaults.reason1Desc'),
    icon: reasonIcons[0],
  },
  {
    title: t('client.home.defaults.reason2Title'),
    desc: t('client.home.defaults.reason2Desc'),
    icon: reasonIcons[1],
  },
  {
    title: t('client.home.defaults.reason3Title'),
    desc: t('client.home.defaults.reason3Desc'),
    icon: reasonIcons[2],
    highlight: true,
  },
]);

const loadServiceMenus = async () => {
  try {
    serviceMenuRecords.value = await level1Categories();
  } catch (error) {
    console.error('load level1 categories failed:', error);
    serviceMenuRecords.value = [];
  }
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
    path: '/services/daily-cleaning',
    query,
  });
};

const scrollToOffers = () => {
  const offersSection = document.getElementById('orders');
  if (offersSection) {
    const targetTop = offersSection.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    return;
  }
  router.push({ path: '/', hash: '#orders' });
};

const goProductDetail = (spuId: string) => {
  if (!spuId) {
    return;
  }
  router.push({
    name: 'product-detail',
    params: { spuId },
  });
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
  loadServiceMenus();
  loadExclusiveCards();
});
</script>

<style scoped lang="scss">
.home-page {
  --primary: #3972f5;
  --primary-dark: #2f63de;
  --text-main: rgba(15, 23, 42, 0.9);
  --text-sub: rgba(15, 23, 42, 0.5);
  background: #fff;
  color: var(--text-main);
  font-family: 'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif;
}

.home-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.hero-section {
  background: var(--primary);
  min-height: 600px;
}

.hero-section__inner {
  display: flex;
  align-items: center;
  min-height: 600px;
}

.hero-section__content {
  // width: min(672px, 100%);
}

.hero-section__eyebrow {
  margin: 0;
  font-size: 26px;
  line-height: 40px;
  font-weight: 800;
  color: #fff;
}

.hero-section__title {
  margin: 16px 0 0;
  font-size: 26px;
  line-height: 45px;
  font-weight: 800;
  color: #fff;
}

.hero-section__desc {
  margin: 16px 0 0;
  font-size: 26px;
  line-height: 40px;
  font-weight: 800;
  color: #fff;
}

.hero-section__cta {
  margin-top: 56px;
  width: 178px;
  height: 70px;
  border: none;
  border-radius: 10px;
  background: #fff;
  color: var(--primary);
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}

.hero-section__tags {
  margin-top: 32px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-section__tags span {
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}

.hero-section__tags span img {
  width: 16px;
  height: 16px;
}

.contact-card {
  position: fixed;
  right: 24px;
  bottom: 120px;
  width: 144px;
  height: 96px;
  background: var(--primary);
  border-radius: 14px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  z-index: 60;
}

.contact-card__agent {
  position: absolute;
  width: 56px;
  height: 56px;
  left: 44px;
  top: -28px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.2);
}

.contact-card__agent img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-card__status {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #00c950;
}

.contact-card button {
  position: absolute;
  left: 19px;
  top: 44px;
  width: 106px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: #fff;
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.services-section {
  padding: 80px 0 96px;
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
  content: '';
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #90a1b9 100%);
}

.section-subtitle--line::after {
  background: linear-gradient(90deg, #90a1b9 0%, rgba(0, 0, 0, 0) 100%);
}

.services-grid {
  margin-top: 88px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  row-gap: 80px;
}

.services-grid__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.services-grid__item:hover {
  transform: translateY(-4px);
}

.services-grid__icon {
  width: 112px;
  height: 112px;
  border-radius: 24px;
  background: rgba(57, 114, 245, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.services-grid__icon img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.services-grid__item p {
  margin: 0;
  min-height: 28px;
  text-align: center;
  color: var(--text-main);
  font-size: 20px;
  line-height: 1.4;
  font-weight: 800;
}

.services-grid__item--placeholder .services-grid__icon {
  background: rgba(57, 114, 245, 0.05);
}

.services-grid__item--placeholder {
  cursor: default;
  transform: none;
}

.services-grid__item--placeholder:hover {
  transform: none;
}

.offers-section {
  background: #f8fafc;
  padding: 84px 0 120px;
}

.offers-grid {
  margin-top: 64px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 32px;
}

.offer-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #f3f4f6;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.offer-card__media {
  position: relative;
  height: 224px;
}

.offer-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.offer-card__badge {
  position: absolute;
  top: 16px;
  right: 16px;
  width: fit-content;
  max-width: calc(100% - 32px);
  padding: 0 12px;
  height: 36px;
  border-radius: 10px;
  background: #fb2c36;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.offer-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 24px;
}

.offer-card__body h3 {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 800;
}

.offer-card__desc {
  margin: 12px 0 0;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.6;
  min-height: 68px;
}

.offer-card__price {
  margin: auto 0 0;
  color: var(--primary);
  text-align: center;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
}

.offer-card__body button {
  margin-top: 12px;
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.booking-section {
  background: var(--primary);
  padding: 80px 0 96px;
}

.section-title--light {
  color: #fff;
}

.section-subtitle--light {
  color: #dbeafe;
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

.about-section {
  padding: 112px 0 108px;
}

.about-content {
  margin-top: 64px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
}

.about-content__left h3 {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 800;
}

.about-content__left ul {
  margin: 36px 0 0;
  padding: 0 0 0 22px;
  list-style: disc;
}

.about-content__left li {
  color: rgba(15, 23, 42, 0.5);
  font-size: 20px;
  line-height: 1.4;
  font-weight: 500;
  margin-top: 12px;
}

.about-reasons {
  margin-top: 56px;
  display: flex;
  gap: 22px;
}

.about-reason {
  width: 140px;
  height: 170px;
  border-radius: 14px;
  border: 1px solid #f3f4f6;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 25px;
}

.about-reason__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #faf5e4;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.about-reason__icon-wrap img {
  width: 28px;
  height: 28px;
}

.about-reason__icon-wrap span {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #fb2c36;
}

.about-reason h4 {
  margin: 20px 0 0;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 800;
}

.about-reason p {
  margin: 20px 0 0;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.25;
}

.about-content__image {
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
}

.about-content__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1300px) {
  .hero-section {
    min-height: 440px;
  }

  .hero-section__inner {
    min-height: 440px;
  }

  .hero-section__cta {
    width: 150px;
    height: 60px;
    font-size: 18px;
  }

  .services-grid {
    margin-top: 54px;
    row-gap: 48px;
  }

  .offers-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .about-content {
    gap: 28px;
  }

  .about-content__left li {
    font-size: 16px;
  }
}

@media (max-width: 960px) {
  .home-container {
    width: calc(100% - 32px);
  }

  .hero-section {
    min-height: auto;
    padding: 48px 0 56px;
  }

  .hero-section__inner {
    min-height: auto;
  }

  .hero-section__eyebrow {
    font-size: 24px;
  }

  .hero-section__title,
  .hero-section__desc {
    font-size: 32px;
  }

  .hero-section__desc {
    margin-top: 8px;
  }

  .hero-section__cta {
    margin-top: 24px;
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

  .about-content {
    grid-template-columns: 1fr;
  }

  .about-content__image {
    height: 360px;
    order: -1;
  }

  .about-reasons {
    flex-wrap: wrap;
  }

  .contact-card {
    width: 128px;
    height: 88px;
    right: 12px;
    bottom: 90px;
  }

  .contact-card__agent {
    left: 36px;
  }

  .contact-card button {
    left: 10px;
    width: 108px;
  }
}

@media (max-width: 640px) {
  .hero-section__tags {
    gap: 8px;
  }

  .services-grid {
    grid-template-columns: 1fr;
    row-gap: 24px;
  }

  .offers-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .about-content__left h3 {
    font-size: 26px;
  }
}
</style>
