<template>
  <div class="service-page">
    <section class="service-subheader">
      <div class="service-container">
        <nav class="service-back" aria-label="breadcrumb">
          <button class="service-back__link" type="button" @click="goBackToHome">
            {{ t('client.header.nav.services') }}
          </button>
          <span class="service-back__separator" aria-hidden="true">&lt;</span>
          <span class="service-back__current">{{ pageTitle }}</span>
        </nav>
      </div>
    </section>

    <section class="service-body">
      <div class="service-container">
        <article class="service-hero">
          <img class="service-hero__bg" :src="heroImage" alt="" />
          <div class="service-hero__mask" />
          <div class="service-hero__content">
            <h1>{{ heroTitle }}</h1>
            <p>{{ heroDesc }}</p>
            <div class="service-hero__tags">
              <span v-for="(tag, index) in heroTags" :key="`${tag.label}-${index}`">
                <img :src="tag.icon" alt="" />
                {{ tag.label }}
              </span>
            </div>
          </div>
        </article>

        <section class="service-grid">
          <article v-for="item in serviceCards" :key="item.key" class="service-card">
            <div class="service-card__content">
              <div class="service-card__icon">
                <img :src="item.icon" :alt="item.title" />
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ t('client.serviceList.card.priceFrom', { price: item.price }) }}</p>
            </div>
            <button class="service-card__btn" type="button" @click="goProductDetail(item.spuId)">
              {{ t('client.serviceList.card.bookNow') }}
            </button>
          </article>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type LocationQueryValue, useRoute, useRouter } from 'vue-router';
import {
  level1Categories,
  onShelfSpus,
  type ExclusiveSpuRecord,
  type Level1CategoryRecord,
} from '@/modules/client/api';

type ServiceCardView = {
  key: string;
  spuId: string;
  title: string;
  price: string;
  icon: string;
};

const heroImage = 'https://www.figma.com/api/mcp/asset/9940165e-0acb-4e47-a159-467533923434';
const tagIconCertified = new URL('@/assets/images/client/icon10.png', import.meta.url).href;
const tagIconFast = new URL('@/assets/images/client/icon11.png', import.meta.url).href;
const tagIconReliable = new URL('@/assets/images/client/icon12.png', import.meta.url).href;

const cardIconSet = [
  'https://www.figma.com/api/mcp/asset/eb5c30c7-689f-4ed5-bbbd-d173eed0127f',
  'https://www.figma.com/api/mcp/asset/09552e9b-ee1f-4389-9c80-8ad2058e2a6d',
  'https://www.figma.com/api/mcp/asset/4fd2bf43-6d9b-4120-b782-12f955ead59c',
  'https://www.figma.com/api/mcp/asset/1cb9d72b-e802-4cc7-84c8-34ca417a10c7',
  'https://www.figma.com/api/mcp/asset/6a649f2a-a66f-4922-b744-d52b9db77848',
  'https://www.figma.com/api/mcp/asset/eb5c30c7-689f-4ed5-bbbd-d173eed0127f',
];

const { t, locale } = useI18n({ useScope: 'global' });
const route = useRoute();
const router = useRouter();

const selectedLevel1 = ref<Level1CategoryRecord | null>(null);
const onShelfRecords = ref<ExclusiveSpuRecord[]>([]);

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const getQueryValue = (
  value?: LocationQueryValue | LocationQueryValue[] | null,
) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw.trim() : '';
};

const pickI18nValue = (
  i18n?: Record<string, string>,
  fallback = '',
): string => {
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

const normalizeTagList = (raw: unknown): string[] => {
  const source = Array.isArray(raw) ? raw : [raw];
  return source
    .flatMap((item) =>
      String(item ?? '')
        .split('|')
        .map((part) => part.trim()),
    )
    .filter(Boolean);
};

const pickI18nTags = (
  i18n?: Record<string, string[] | string>,
): string[] => {
  const valueMap = i18n || {};
  const preferredLangs = getPreferredLangs();
  for (const lang of preferredLangs) {
    const tags = normalizeTagList(valueMap[lang]);
    if (tags.length) {
      return tags;
    }
  }
  const firstValue = Object.values(valueMap).find((value) => normalizeTagList(value).length > 0);
  return normalizeTagList(firstValue);
};

const parseLevel1FromQuery = (): Level1CategoryRecord | null => {
  const raw = getQueryValue(route.query.level1);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as Level1CategoryRecord : null;
  } catch {
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      return parsed && typeof parsed === 'object' ? parsed as Level1CategoryRecord : null;
    } catch {
      return null;
    }
  }
};

const categoryId = computed(() => getQueryValue(route.query.categoryId));

const defaultHeroTags = computed(() => [
  t('client.serviceList.hero.tagCertified'),
  t('client.serviceList.hero.tagFast'),
  t('client.serviceList.hero.tagReliable'),
]);

const pageTitle = computed(() => {
  const fromQuery = getQueryValue(route.query.name);
  return pickI18nValue(
    selectedLevel1.value?.nameI18n,
    fromQuery || t('client.serviceList.pageTitle'),
  );
});

const heroTitle = computed(() =>
  pickI18nValue(selectedLevel1.value?.bannerTitleI18n, pageTitle.value),
);

const heroDesc = computed(() =>
  pickI18nValue(selectedLevel1.value?.bannerDescI18n, ''),
);

const heroTags = computed(() => {
  const labels = pickI18nTags(selectedLevel1.value?.bannerTagsI18n);
  const source = labels.length ? labels : defaultHeroTags.value;
  const icons = [tagIconCertified, tagIconFast, tagIconReliable];
  return source.slice(0, 6).map((label, index) => ({
    label,
    icon: icons[index % icons.length],
  }));
});

const formatPrice = (minPrice?: number | string) => {
  const value = Number(minPrice);
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return value.toFixed(2);
};

const serviceCards = computed<ServiceCardView[]>(() => {
  const records = onShelfRecords.value || [];
  if (!records.length) {
    return [];
  }
  const mapped = records
    .map((item, index) => {
      return {
        key: String(item.id ?? `service-${index + 1}`),
        spuId: String(item.id ?? ''),
        title: pickI18nValue(item.nameI18n, ''),
        price: formatPrice(item.minPrice),
        icon: item.imageUrls?.[0] || cardIconSet[index % cardIconSet.length],
      };
    })
    .filter((item) => item.title);
  return mapped;
});

const loadLevel1Context = async () => {
  const fromQuery = parseLevel1FromQuery();
  if (fromQuery) {
    selectedLevel1.value = fromQuery;
    return;
  }
  if (!categoryId.value) {
    selectedLevel1.value = null;
    return;
  }
  try {
    const records = await level1Categories();
    selectedLevel1.value = records.find((item) => {
      const id = item.category?.categoryId || item.category?.id;
      return String(id ?? '') === categoryId.value;
    }) || null;
  } catch (error) {
    console.error('load level1 category context failed:', error);
    selectedLevel1.value = null;
  }
};

const loadOnShelfRecords = async () => {
  if (!categoryId.value) {
    onShelfRecords.value = [];
    return;
  }
  try {
    onShelfRecords.value = await onShelfSpus({
      categoryId: categoryId.value,
    });
  } catch (error) {
    console.error('load on shelf products failed:', error);
    onShelfRecords.value = [];
  }
};

watch(
  () => [route.query.categoryId, route.query.level1],
  () => {
    void loadLevel1Context();
    void loadOnShelfRecords();
  },
  { immediate: true },
);

const goBackToHome = () => {
  router.push({ path: '/', hash: '#services' });
};

const goProductDetail = (spuId: string) => {
  if (!spuId) {
    return;
  }
  const level1Raw = getQueryValue(route.query.level1);
  router.push({
    name: 'product-detail',
    params: { spuId },
    query: {
      breadcrumb: pageTitle.value,
      name: pageTitle.value,
      categoryId: categoryId.value,
      level1: level1Raw,
    },
  });
};
</script>

<style scoped lang="scss">
.service-page {
  background: #f8fafc;
  min-height: 100%;
}

.service-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.service-subheader {
  height: 64px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.service-back {
  height: 64px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(15, 23, 42, 0.78);
  font-size: 17px;
  line-height: 1;
  font-weight: 600;
  padding: 0;
}

.service-back__link {
  border: 0;
  background: transparent;
  padding: 0;
  color: #3972f5;
  font-size: inherit;
  line-height: 1;
  font-weight: 700;
  cursor: pointer;
}

.service-back__separator {
  color: rgba(15, 23, 42, 0.45);
  font-size: 16px;
}

.service-back__current {
  color: rgba(15, 23, 42, 0.88);
  font-size: inherit;
  line-height: 1;
  font-weight: 700;
}

.service-body {
  padding: 18px 0 48px;
}

.service-hero {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 248px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.service-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.2;
}

.service-hero__mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #3972f5 0%, rgba(57, 114, 245, 0.8) 50%, rgba(0, 0, 0, 0) 100%);
}

.service-hero__content {
  position: relative;
  z-index: 1;
  // min-height: 248px;
  padding: 46px 32px;
}

.service-hero__content h1 {
  margin: 0;
  color: #fff;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 900;
}

.service-hero__content p {
  margin: 16px 0 0;
  width: min(1060px, 100%);
  color: #dbeafe;
  font-size: 20px;
  line-height: 1.45;
  font-weight: 500;
}

.service-hero__tags {
  margin-top: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.service-hero__tags span {
  height: 38px;
  padding: 0 17px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.service-hero__tags span img {
  width: 18px;
  height: 18px;
}

.service-grid {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}

.service-card {
  min-height: 343px;
  border-radius: 14px;
  border: 1px solid #f8fafc;
  border-top-width: 4px;
  background: #fff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 36px 16px 33px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.service-card__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.service-card__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-card__icon img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.service-card h3 {
  margin: 24px 0 0;
  text-align: center;
  color: rgba(15, 23, 42, 0.9);
  font-size: 20px;
  line-height: 1.2;
  font-weight: 800;
  min-height: 72px;
}

.service-card p {
  margin: 24px 0 0;
  width: 100%;
  height: 36px;
  border-radius: 999px;
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.service-card__btn {
  margin-top: 18px;
  width: 180px;
  height: 52px;
  border-radius: 10px;
  border: 2px solid #3972f5;
  background: #3972f5;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1260px) {
  .service-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .service-hero__content h1 {
    font-size: 34px;
  }

  .service-hero__content p {
    font-size: 18px;
  }

  .service-card h3 {
    font-size: 24px;
  }
}

@media (max-width: 960px) {
  .service-container {
    width: calc(100% - 32px);
  }

  .service-back {
    font-size: 16px;
  }

  .service-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .service-card {
    min-height: 320px;
  }
}

@media (max-width: 680px) {
  .service-subheader,
  .service-back {
    height: 56px;
  }

  .service-body {
    padding-top: 14px;
  }

  .service-hero__content {
    padding: 24px 18px;
  }

  .service-hero__content h1 {
    font-size: 26px;
  }

  .service-hero__content p {
    font-size: 15px;
    margin-top: 12px;
  }

  .service-grid {
    grid-template-columns: 1fr;
  }

  .service-card h3 {
    min-height: 0;
    font-size: 22px;
  }
}
</style>
