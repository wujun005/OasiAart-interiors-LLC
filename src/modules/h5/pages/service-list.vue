<template>
  <div class="h5-service-page">
    <header class="h5-service-topbar">
      <button class="h5-service-topbar__back" type="button" @click="goBackToHome">
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ pageTitle }}</h1>
      <span class="h5-service-topbar__spacer" />
    </header>

    <main class="h5-service-main">
      <section class="h5-service-hero">
        <h2>{{ heroTitle }}</h2>
        <p>{{ heroDesc }}</p>
        <div class="h5-service-hero__tags">
          <span v-for="(tag, index) in heroTags" :key="`${tag.label}-${index}`">
            <img :src="tag.icon" alt="" />
            {{ tag.label }}
          </span>
        </div>
      </section>

      <section class="h5-service-section">
        <div class="h5-service-section__title">
          <span />
          <h3>{{ serviceSectionTitle }}</h3>
          <span />
        </div>

        <div class="h5-service-list">
          <article v-for="item in serviceCards" :key="item.key" class="h5-service-card">
            <div class="h5-service-card__icon">
              <img :src="item.icon" :alt="item.title" />
            </div>
            <div class="h5-service-card__content">
              <h4>{{ item.title }}</h4>
              <p>{{ t('client.serviceList.card.priceFrom', { price: item.price }) }}</p>
            </div>
            <button type="button" @click="goProductDetail(item.spuId)">
              {{ t('h5.serviceList.bookNow') }}
            </button>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router';
import {
  level1Categories,
  onShelfSpus,
  type ExclusiveSpuRecord,
  type Level1CategoryRecord,
} from '@/modules/client/api';
import { setClientLocale } from '@/modules/client/locales';

type ServiceCardView = {
  key: string;
  spuId: string;
  title: string;
  price: string;
  icon: string;
};

const tagIconCertified = new URL('@/assets/images/client/icon10.png', import.meta.url).href;
const tagIconFast = new URL('@/assets/images/client/icon11.png', import.meta.url).href;
const tagIconReliable = new URL('@/assets/images/client/icon12.png', import.meta.url).href;

const cardIconSet = [
  'https://www.figma.com/api/mcp/asset/0928f181-b954-49a5-b2f6-373df17e5a05',
  'https://www.figma.com/api/mcp/asset/c4bfe039-3b87-4506-909a-a3376acba5a7',
  'https://www.figma.com/api/mcp/asset/0726b733-167b-40de-bcc7-c1f3ea51204e',
  'https://www.figma.com/api/mcp/asset/bd8706ba-39ac-4275-a865-5371b9c70f8c',
  'https://www.figma.com/api/mcp/asset/439ddc00-08a0-483f-a15a-c505055cb46d',
  'https://www.figma.com/api/mcp/asset/397e0bd6-cb70-4344-8f7a-758d216f828d',
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

const getQueryValue = (value?: LocationQueryValue | LocationQueryValue[] | null) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw.trim() : '';
};

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

const pickI18nTags = (i18n?: Record<string, string[] | string>): string[] => {
  const valueMap = i18n || {};
  for (const lang of getPreferredLangs()) {
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
    return parsed && typeof parsed === 'object' ? (parsed as Level1CategoryRecord) : null;
  } catch {
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      return parsed && typeof parsed === 'object' ? (parsed as Level1CategoryRecord) : null;
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

const heroTitle = computed(() => pickI18nValue(selectedLevel1.value?.bannerTitleI18n, pageTitle.value));
const heroDesc = computed(() => pickI18nValue(selectedLevel1.value?.bannerDescI18n, ''));
const serviceSectionTitle = computed(() =>
  locale.value === 'zh' ? '选择服务类型' : 'Choose Service Type',
);

const heroTags = computed(() => {
  const labels = pickI18nTags(selectedLevel1.value?.bannerTagsI18n);
  const source = labels.length ? labels : defaultHeroTags.value;
  const icons = [tagIconCertified, tagIconFast, tagIconReliable];
  return source.slice(0, 3).map((label, index) => ({
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
  return records
    .map((item, index) => ({
      key: String(item.id ?? `service-${index + 1}`),
      spuId: String(item.id ?? ''),
      title: pickI18nValue(item.nameI18n, ''),
      price: formatPrice(item.minPrice),
      icon: item.imageUrls?.[0] || cardIconSet[index % cardIconSet.length],
    }))
    .filter((item) => item.title);
});

const syncLocaleToClient = () => {
  setClientLocale(locale.value === 'zh' ? 'zh' : 'en');
};

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
    selectedLevel1.value =
      records.find((item) => {
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
    onShelfRecords.value = await onShelfSpus({ categoryId: categoryId.value });
  } catch (error) {
    console.error('load on shelf products failed:', error);
    onShelfRecords.value = [];
  }
};

watch(
  () => [route.query.categoryId, route.query.level1, locale.value],
  () => {
    syncLocaleToClient();
    void loadLevel1Context();
    void loadOnShelfRecords();
  },
  { immediate: true },
);

const goBackToHome = () => {
  router.push({ name: 'h5-home' });
};

const goProductDetail = (spuId: string) => {
  if (!spuId) {
    return;
  }
  const level1Raw = getQueryValue(route.query.level1);
  router.push({
    name: 'h5-product-detail',
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
.h5-service-page {
  min-height: 100vh;
  background: #f8fafc;
}

.h5-service-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 56px;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #f1f5f9;
  backdrop-filter: blur(12px);
}

.h5-service-topbar__back,
.h5-service-topbar__spacer {
  width: 40px;
  height: 40px;
}

.h5-service-topbar__back {
  border: 0;
  background: transparent;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 22px;
}

.h5-service-topbar h1 {
  margin: 0;
  text-align: center;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.h5-service-main {
  max-width: 430px;
  margin: 0 auto;
  padding: 24px 16px 40px;
}

.h5-service-hero {
  padding: 30px 20px 20px;
  border-radius: 16px;
  background: linear-gradient(180deg, #3972f5 0%, #4a7ef8 100%);
  box-shadow: 0 18px 40px rgba(57, 114, 245, 0.22);
}

.h5-service-hero h2 {
  margin: 0;
  color: #fff;
  font-size: 16px;
  line-height: 1.22;
  font-weight: 900;
}

.h5-service-hero p {
  margin: 12px 0 0;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.6;
  font-weight: 500;
}

.h5-service-hero__tags {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.h5-service-hero__tags span {
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
}

.h5-service-hero__tags img {
  width: 12px;
  height: 12px;
  object-fit: contain;
}

.h5-service-section {
  margin-top: 30px;
}

.h5-service-section__title {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.h5-service-section__title span {
  height: 1px;
  background: #cad5e2;
}

.h5-service-section__title h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
}

.h5-service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.h5-service-card {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.h5-service-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.h5-service-card__icon img {
  width: auto;
  height: 100%;
  object-fit: contain;
}

.h5-service-card__content h4 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 800;
}

.h5-service-card__content p {
  margin: 4px 0 0;
  color: #3972f5;
  font-size: 12px;
  font-weight: 700;
}

.h5-service-card button {
  width: 56px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  background: #3972f5;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}
</style>
