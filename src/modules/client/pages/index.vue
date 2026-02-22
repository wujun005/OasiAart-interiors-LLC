<template>
  <div id="home" class="home-page">
    <section class="hero-section">
      <div class="home-container hero-section__inner">
        <div class="hero-section__content">
          <p class="hero-section__eyebrow">{{ t('client.home.hero.eyebrow') }}</p>
          <h1>{{ t('client.home.hero.titleLine1') }}<br />{{ t('client.home.hero.titleLine2') }}</h1>
          <p class="hero-section__desc">{{ t('client.home.hero.desc') }}</p>
          <div class="hero-section__actions">
            <button type="button">{{ t('client.home.hero.cta') }}</button>
            <div class="hero-section__tags">
              <span>{{ t('client.home.hero.tag1') }}</span>
              <span>{{ t('client.home.hero.tag2') }}</span>
            </div>
          </div>
        </div>
        <div class="hero-section__visual">
          <img :src="heroImageUrl" :alt="t('client.home.alt.hero')" />
        </div>
      </div>

      <div
        ref="contactCardRef"
        class="hero-section__contact-card"
        :class="{ 'hero-section__contact-card--dragging': isContactCardDragging }"
        :style="contactCardStyle"
        @mousedown="onContactCardMouseDown"
        @touchstart="onContactCardTouchStart"
      >
        <div class="hero-section__agent">
          <img :src="supportAgentUrl" :alt="t('client.home.alt.supportAgent')" />
        </div>
        <p>{{ t('client.home.contactCard.title') }}</p>
        <button type="button">{{ t('client.home.contactCard.button') }}</button>
      </div>
    </section>

    <section id="services" class="category-section">
      <div class="home-container">
        <h2 class="section-title">{{ t('client.home.sections.servicesTitle') }}</h2>
        <div class="category-section__grid">
          <article v-for="item in serviceMenus" :key="item.id" class="category-section__item">
            <div class="category-section__icon">
              <img :src="item.icon" :alt="item.title" />
            </div>
            <p>{{ item.title }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="service-section">
      <div class="home-container">
        <h2 class="section-title">{{ t('client.home.sections.serviceCardsTitle') }}</h2>
        <p class="section-desc">{{ t('client.home.sections.serviceCardsDesc') }}</p>

        <div class="service-section__grid">
          <article v-for="item in serviceCards" :key="item.id" class="service-section__card">
            <img class="service-section__image" :src="item.image" :alt="item.title" />
            <span class="service-section__badge">{{ t('client.home.serviceCard.badge') }}</span>
            <div class="service-section__body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
              <div class="service-section__footer">
                <strong>{{ item.price }}</strong>
                <button type="button">{{ t('client.home.serviceCard.button') }}</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="booking-section">
      <div class="home-container">
        <h2 class="section-title section-title--light">{{ t('client.home.sections.bookingTitle') }}</h2>
        <p class="section-desc section-desc--light">{{ t('client.home.sections.bookingSubtitle') }}</p>

        <div class="booking-section__grid">
          <div class="booking-section__form-card">
            <h3>{{ t('client.home.bookingForm.title') }}</h3>
            <label>
              {{ t('client.home.bookingForm.dateLabel') }}
              <input type="text" :placeholder="t('client.home.bookingForm.datePlaceholder')" />
            </label>
            <label>
              {{ t('client.home.bookingForm.typeLabel') }}
              <input type="text" :placeholder="t('client.home.bookingForm.typePlaceholder')" />
            </label>
            <label>
              {{ t('client.home.bookingForm.contactLabel') }}
              <input type="text" :placeholder="t('client.home.bookingForm.contactPlaceholder')" />
            </label>
            <button type="button">{{ t('client.home.bookingForm.next') }}</button>
          </div>

          <div class="booking-section__steps">
            <article v-for="(step, index) in bookingSteps" :key="step.title" class="booking-section__step">
              <span>{{ index + 1 }}</span>
              <div>
                <h4>{{ step.title }}</h4>
                <p>{{ step.desc }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section id="about" class="about-section">
      <div class="home-container">
        <h2 class="section-title">{{ t('client.home.sections.aboutTitle') }}</h2>
        <p class="section-desc">{{ t('client.home.sections.aboutDesc') }}</p>

        <div class="about-section__grid">
          <div class="about-section__content">
            <div class="about-section__intro">
              <h3>{{ t('client.home.aboutIntro.title') }}</h3>
              <p>{{ t('client.home.aboutIntro.desc') }}</p>
            </div>

            <div class="about-section__reason-list">
              <article v-for="item in reasons" :key="item.title" class="about-section__reason-item">
                <img :src="item.icon" :alt="item.title" />
                <h4>{{ item.title }}</h4>
                <p>{{ item.desc }}</p>
              </article>
            </div>
          </div>

          <div class="about-section__image-wrap">
            <img :src="aboutImageUrl" :alt="t('client.home.alt.about')" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  level1Categories,
  type Level1CategoryRecord,
  exclusiveSpus,
  type ExclusiveSpuRecord,
} from '@/modules/client/api';

type ServiceMenu = {
  id: string;
  title: string;
  icon: string;
};

type ServiceCard = {
  id: string;
  title: string;
  desc: string;
  price: string;
  image: string;
};

type BookingStep = {
  title: string;
  desc: string;
};

type Reason = {
  title: string;
  desc: string;
  icon: string;
};

const { t, locale } = useI18n({ useScope: 'global' });

const heroImageUrl = 'https://www.figma.com/api/mcp/asset/51ab48a9-57f8-4d57-aad4-d0b73840a4d3';
const supportAgentUrl = 'https://www.figma.com/api/mcp/asset/2941720e-95cd-4749-93e2-11fc3982d1be';
const aboutImageUrl = 'https://www.figma.com/api/mcp/asset/e3a37040-2d8a-485d-8ae8-4040982c6482';
const contactCardRef = ref<HTMLElement | null>(null);
const contactCardPosition = ref<{ left: number; top: number } | null>(null);
const isContactCardDragging = ref(false);

const dragState = {
  offsetX: 0,
  offsetY: 0,
  cardWidth: 0,
  cardHeight: 0,
};

const contactCardStyle = computed(() => {
  if (!contactCardPosition.value) {
    return {};
  }
  return {
    left: `${contactCardPosition.value.left}px`,
    top: `${contactCardPosition.value.top}px`,
    bottom: 'auto',
  };
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function extractPoint(event: MouseEvent | TouchEvent) {
  if ('touches' in event) {
    const touch = event.touches[0] || event.changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  return { x: event.clientX, y: event.clientY };
}

function handleContactCardMove(event: MouseEvent | TouchEvent) {
  if (!isContactCardDragging.value) {
    return;
  }
  const point = extractPoint(event);
  if (!point) {
    return;
  }
  if ('preventDefault' in event) {
    event.preventDefault();
  }
  const maxLeft = Math.max(window.innerWidth - dragState.cardWidth, 0);
  const maxTop = Math.max(window.innerHeight - dragState.cardHeight, 0);
  const left = clamp(point.x - dragState.offsetX, 0, maxLeft);
  const top = clamp(point.y - dragState.offsetY, 0, maxTop);
  contactCardPosition.value = { left, top };
}

function stopContactCardDrag() {
  if (!isContactCardDragging.value) {
    return;
  }
  isContactCardDragging.value = false;
  window.removeEventListener('mousemove', handleContactCardMove);
  window.removeEventListener('mouseup', stopContactCardDrag);
  window.removeEventListener('touchmove', handleContactCardMove);
  window.removeEventListener('touchend', stopContactCardDrag);
  document.body.style.userSelect = '';
}

function startContactCardDrag(pointX: number, pointY: number) {
  const cardEl = contactCardRef.value;
  if (!cardEl) {
    return;
  }
  const rect = cardEl.getBoundingClientRect();
  dragState.offsetX = pointX - rect.left;
  dragState.offsetY = pointY - rect.top;
  dragState.cardWidth = rect.width;
  dragState.cardHeight = rect.height;
  contactCardPosition.value = { left: rect.left, top: rect.top };
  isContactCardDragging.value = true;
  window.addEventListener('mousemove', handleContactCardMove);
  window.addEventListener('mouseup', stopContactCardDrag);
  window.addEventListener('touchmove', handleContactCardMove, { passive: false });
  window.addEventListener('touchend', stopContactCardDrag);
  document.body.style.userSelect = 'none';
}

function onContactCardMouseDown(event: MouseEvent) {
  if (event.button !== 0) {
    return;
  }
  startContactCardDrag(event.clientX, event.clientY);
}

function onContactCardTouchStart(event: TouchEvent) {
  const point = extractPoint(event);
  if (!point) {
    return;
  }
  startContactCardDrag(point.x, point.y);
}

const defaultMenuIcons = [
  'https://www.figma.com/api/mcp/asset/a9147542-21a2-4a03-8ff5-17b595720d27',
  'https://www.figma.com/api/mcp/asset/c1967d33-9dd9-45d4-ad1b-1d7c311f2d0f',
  'https://www.figma.com/api/mcp/asset/3bc85a98-4b74-4957-b3fa-ec1eb5912098',
  'https://www.figma.com/api/mcp/asset/4548fd59-8604-486e-a98e-87279dd2d814',
  'https://www.figma.com/api/mcp/asset/9ce026c8-5e6b-47ff-b1d7-5d8a614816f5',
];

const defaultCardImages = [
  'https://www.figma.com/api/mcp/asset/f6ca1504-083d-4962-83dc-e2791349924c',
  'https://www.figma.com/api/mcp/asset/de5b0ce0-d113-44fa-8657-3e43d736694d',
  'https://www.figma.com/api/mcp/asset/e62082ed-11ba-4f92-8596-d6f6a3e9856d',
  'https://www.figma.com/api/mcp/asset/e63c85e3-b0d2-432a-9b60-98896c50c1ab',
];

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

const defaultServiceMenus = computed<ServiceMenu[]>(() => [
  {
    id: 'default-1',
    title: t('client.home.defaults.menu1'),
    icon: defaultMenuIcons[0],
  },
  {
    id: 'default-2',
    title: t('client.home.defaults.menu2'),
    icon: defaultMenuIcons[1],
  },
  {
    id: 'default-3',
    title: t('client.home.defaults.menu3'),
    icon: defaultMenuIcons[2],
  },
  {
    id: 'default-4',
    title: t('client.home.defaults.menu4'),
    icon: defaultMenuIcons[3],
  },
  {
    id: 'default-5',
    title: t('client.home.defaults.menu5'),
    icon: defaultMenuIcons[4],
  },
]);

const serviceMenus = computed<ServiceMenu[]>(() => {
  const records = serviceMenuRecords.value || [];
  if (!records.length) {
    return defaultServiceMenus.value;
  }
  const activeList = records.filter((item) => {
    const status = item.category?.status;
    return status === undefined || status === null || String(status) === '1';
  });
  const sourceList = activeList.length ? activeList : records;
  const mapped = sourceList
    .map((item, index) => {
      const id = String(
        item.category?.categoryId || item.category?.id || `service-${index + 1}`,
      );
      const icon =
        item.imageUrls?.[0] ||
        defaultServiceMenus.value[index % defaultServiceMenus.value.length].icon;
      const fallbackName =
        item.category?.categoryName?.trim() || t('client.home.defaults.unnamedService');
      return {
        id,
        title: pickI18nValue(item.nameI18n, fallbackName),
        icon,
      };
    })
    .filter((item) => item.title);
  return mapped.length ? mapped : defaultServiceMenus.value;
});

const defaultServiceCards = computed<ServiceCard[]>(() => [
  {
    id: 'default-card-1',
    title: t('client.home.defaults.card1Title'),
    desc: t('client.home.defaults.card1Desc'),
    price: t('client.home.defaults.card1Price'),
    image: defaultCardImages[0],
  },
  {
    id: 'default-card-2',
    title: t('client.home.defaults.card2Title'),
    desc: t('client.home.defaults.card2Desc'),
    price: t('client.home.defaults.card2Price'),
    image: defaultCardImages[1],
  },
  {
    id: 'default-card-3',
    title: t('client.home.defaults.card3Title'),
    desc: t('client.home.defaults.card3Desc'),
    price: t('client.home.defaults.card3Price'),
    image: defaultCardImages[2],
  },
  {
    id: 'default-card-4',
    title: t('client.home.defaults.card4Title'),
    desc: t('client.home.defaults.card4Desc'),
    price: t('client.home.defaults.card4Price'),
    image: defaultCardImages[3],
  },
]);

const formatMinPrice = (minPrice?: number | string): string => {
  if (minPrice === null || minPrice === undefined || minPrice === '') {
    return t('client.home.serviceCard.priceConsult');
  }
  const value = Number(minPrice);
  if (!Number.isFinite(value)) {
    return t('client.home.serviceCard.priceConsult');
  }
  return t('client.home.serviceCard.priceFrom', { price: value });
};

const serviceCards = computed<ServiceCard[]>(() => {
  const records = serviceCardRecords.value || [];
  if (!records.length) {
    return defaultServiceCards.value;
  }
  const mapped = records
    .map((item, index) => {
      const fallback = defaultServiceCards.value[index % defaultServiceCards.value.length];
      return {
        id: String(item.id ?? `exclusive-${index + 1}`),
        title: pickI18nValue(item.nameI18n, fallback.title),
        desc: pickI18nValue(item.descI18n, fallback.desc),
        price: formatMinPrice(item.minPrice),
        image: item.imageUrls?.[0] || fallback.image,
      };
    })
    .filter((item) => item.title);
  return mapped.length ? mapped : defaultServiceCards.value;
});

const loadServiceMenus = async () => {
  try {
    serviceMenuRecords.value = await level1Categories();
  } catch (error) {
    console.error('load level1 categories failed:', error);
    serviceMenuRecords.value = [];
  }
};

const loadServiceCards = async () => {
  try {
    serviceCardRecords.value = await exclusiveSpus();
  } catch (error) {
    console.error('load exclusive spus failed:', error);
    serviceCardRecords.value = [];
  }
};

onMounted(() => {
  loadServiceMenus();
  loadServiceCards();
});

onBeforeUnmount(() => {
  stopContactCardDrag();
});

const bookingSteps = computed<BookingStep[]>(() => [
  {
    title: t('client.home.steps.step1Title'),
    desc: t('client.home.steps.step1Desc'),
  },
  {
    title: t('client.home.steps.step2Title'),
    desc: t('client.home.steps.step2Desc'),
  },
  {
    title: t('client.home.steps.step3Title'),
    desc: t('client.home.steps.step3Desc'),
  },
  {
    title: t('client.home.steps.step4Title'),
    desc: t('client.home.steps.step4Desc'),
  },
]);

const reasons = computed<Reason[]>(() => [
  {
    title: t('client.home.defaults.reason1Title'),
    desc: t('client.home.defaults.reason1Desc'),
    icon: 'https://www.figma.com/api/mcp/asset/4ce52fb0-618b-46d7-8220-957414885980',
  },
  {
    title: t('client.home.defaults.reason2Title'),
    desc: t('client.home.defaults.reason2Desc'),
    icon: 'https://www.figma.com/api/mcp/asset/19de2f6e-64d6-4673-8b20-b7dad1a27d14',
  },
  {
    title: t('client.home.defaults.reason3Title'),
    desc: t('client.home.defaults.reason3Desc'),
    icon: 'https://www.figma.com/api/mcp/asset/e7cb9284-26be-41cc-b586-05a7448cadf4',
  },
]);

</script>

<style scoped lang="scss">
.home-page {
  --primary: #3972f5;
  --bg-light: #f8fafc;
  --text-main: #101828;
  --text-sub: #4a5565;
  font-family: 'Inter', 'Noto Sans SC', 'PingFang SC', sans-serif;
  background: var(--bg-light);
  color: var(--text-main);
}

.home-container {
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
}

.hero-section {
  position: relative;
  padding: 34px 0 72px;
  background: linear-gradient(135deg, #eef4ff 0%, #f8fafc 55%, #eef2ff 100%);
}

.hero-section__inner {
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  align-items: center;
  gap: 24px;
  min-height: 500px;
}

.hero-section__content {
  max-width: 520px;
}

.hero-section__eyebrow {
  margin: 0 0 12px;
  color: var(--primary);
  font-size: 15px;
  font-weight: 700;
}

.hero-section h1 {
  margin: 0;
  color: var(--primary);
  font-size: 56px;
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: -0.6px;
}

.hero-section__desc {
  margin: 16px 0 0;
  color: var(--text-sub);
  font-size: 18px;
  line-height: 1.7;
}

.hero-section__actions {
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-section__actions button {
  height: 48px;
  border: 0;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  padding: 0 24px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.hero-section__tags {
  display: flex;
  gap: 8px;
}

.hero-section__tags span {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(57, 114, 245, 0.12);
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
}

.hero-section__visual {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 500px;
  box-shadow: 0 24px 48px rgba(13, 30, 76, 0.15);
}

.hero-section__visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-section__contact-card {
  position: fixed;
  left: 24px;
  bottom: 24px;
  width: 196px;
  padding: 38px 16px 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #1e3a8a 0%, #3972f5 100%);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
  text-align: center;
  z-index: 60;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.hero-section__contact-card--dragging {
  cursor: grabbing;
}

.hero-section__agent {
  position: absolute;
  left: 50%;
  top: -28px;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  padding: 4px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #1e3a8a;
}

.hero-section__agent img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.hero-section__contact-card p {
  margin: 0 0 10px;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
}

.hero-section__contact-card button {
  width: 100%;
  border: 0;
  height: 28px;
  border-radius: 999px;
  background: #fff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.category-section {
  padding: 78px 0 66px;
  background: #fff;
}

.section-title {
  margin: 0;
  text-align: center;
  color: var(--primary);
  font-size: 40px;
  font-weight: 800;
  line-height: 1.2;
}

.category-section__grid {
  margin-top: 56px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 24px;
}

.category-section__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.category-section__icon {
  width: 110px;
  height: 110px;
  border-radius: 24px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-section__icon img {
  width: 52px;
  height: 52px;
}

.category-section__item p {
  margin: 0;
  color: #314158;
  font-size: 20px;
  font-weight: 700;
}

.service-section {
  padding: 90px 0;
}

.section-desc {
  width: min(900px, 100%);
  margin: 18px auto 0;
  color: var(--text-sub);
  font-size: 18px;
  line-height: 1.7;
  text-align: center;
}

.service-section__grid {
  margin-top: 58px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
}

.service-section__card {
  position: relative;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(10, 31, 68, 0.12);
}

.service-section__image {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.service-section__badge {
  position: absolute;
  right: 14px;
  top: 14px;
  min-width: 74px;
  height: 30px;
  border-radius: 9px;
  background: #fb2c36;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.service-section__body {
  padding: 20px 18px 22px;
}

.service-section__body h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.service-section__body p {
  margin: 12px 0 0;
  color: var(--text-sub);
  line-height: 1.6;
  font-size: 14px;
  min-height: 88px;
}

.service-section__footer {
  margin-top: 16px;
}

.service-section__footer strong {
  display: block;
  color: var(--primary);
  font-size: 18px;
  text-align: center;
}

.service-section__footer button {
  margin-top: 8px;
  width: 100%;
  height: 46px;
  border: 0;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.booking-section {
  padding: 76px 0 80px;
  background: linear-gradient(180deg, #3972f5 0%, #2d63df 100%);
}

.section-title--light,
.section-desc--light {
  color: #fff;
}

.booking-section__grid {
  margin-top: 40px;
  display: grid;
  grid-template-columns: 440px 1fr;
  gap: 36px;
}

.booking-section__form-card {
  background: #fff;
  border-radius: 14px;
  padding: 22px 20px;
  box-shadow: 0 20px 36px rgba(16, 36, 94, 0.2);
}

.booking-section__form-card h3 {
  margin: 0 0 14px;
  font-size: 18px;
}

.booking-section__form-card label {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  color: #45556c;
  font-size: 13px;
  gap: 6px;
}

.booking-section__form-card input {
  height: 40px;
  border-radius: 8px;
  border: 1px solid #d1d5dc;
  padding: 0 12px;
  font-size: 14px;
}

.booking-section__form-card button {
  margin-top: 14px;
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.booking-section__steps {
  display: grid;
  gap: 14px;
}

.booking-section__step {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 16px 18px;
  display: flex;
  gap: 14px;
  color: #fff;
}

.booking-section__step span {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  background: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.booking-section__step h4 {
  margin: 0;
  font-size: 17px;
}

.booking-section__step p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 14px;
  line-height: 1.55;
}

.about-section {
  padding: 90px 0 98px;
}

.about-section__grid {
  margin-top: 44px;
  display: grid;
  grid-template-columns: 1.04fr 1fr;
  gap: 28px;
}

.about-section__content {
  display: grid;
  gap: 22px;
}

.about-section__intro {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 24px rgba(10, 31, 68, 0.1);
}

.about-section__intro h3 {
  margin: 0;
  color: var(--primary);
  font-size: 26px;
}

.about-section__intro p {
  margin: 10px 0 0;
  color: var(--text-sub);
  line-height: 1.75;
  font-size: 15px;
}

.about-section__reason-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.about-section__reason-item {
  background: #fff;
  border-radius: 14px;
  padding: 16px 14px;
  box-shadow: 0 10px 20px rgba(10, 31, 68, 0.08);
}

.about-section__reason-item img {
  width: 34px;
  height: 34px;
}

.about-section__reason-item h4 {
  margin: 10px 0 0;
  font-size: 15px;
}

.about-section__reason-item p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-sub);
}

.about-section__image-wrap {
  border-radius: 16px;
  overflow: hidden;
  min-height: 390px;
  box-shadow: 0 18px 30px rgba(10, 31, 68, 0.14);
}

.about-section__image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1180px) {
  .service-section__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .category-section__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .booking-section__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .home-container {
    width: calc(100% - 32px);
  }

  .hero-section {
    padding: 24px 0 44px;
  }

  .hero-section__inner {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .hero-section h1 {
    font-size: 40px;
  }

  .hero-section__visual {
    min-height: 360px;
  }

  .hero-section__contact-card {
    width: 168px;
    left: 12px;
    bottom: 12px;
    padding: 34px 12px 12px;
  }

  .section-title {
    font-size: 32px;
  }

  .section-desc {
    font-size: 16px;
  }

  .about-section__grid {
    grid-template-columns: 1fr;
  }

  .about-section__reason-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-section h1 {
    font-size: 34px;
  }

  .hero-section__actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .category-section {
    padding: 56px 0 48px;
  }

  .category-section__grid,
  .service-section__grid {
    grid-template-columns: 1fr;
  }
}
</style>
