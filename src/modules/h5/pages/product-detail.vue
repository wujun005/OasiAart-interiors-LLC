<template>
  <div class="h5-detail-page">
    <header class="h5-detail-topbar">
      <button class="h5-detail-topbar__back" type="button" @click="handleBack">
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ t('client.productDetail.pageTitle') }}</h1>
      <span class="h5-detail-topbar__spacer" />
    </header>

    <main class="h5-detail-main">
      <section class="h5-detail-gallery">
        <van-swipe class="h5-detail-gallery__swipe" :autoplay="3000" lazy-render @change="handleSwipeChange">
          <van-swipe-item v-for="(image, index) in galleryImages" :key="`gallery-${index}`">
            <img :src="image" :alt="displayTitle" />
          </van-swipe-item>
        </van-swipe>
        <span class="h5-detail-gallery__badge">{{ t('client.productDetail.badge') }}</span>
        <div class="h5-detail-gallery__dots">
          <span
            v-for="(image, index) in galleryImages"
            :key="`dot-${index}`"
            :class="{ 'h5-detail-gallery__dot--active': index === selectedImageIndex }"
          />
        </div>
      </section>

      <section class="h5-detail-card h5-detail-card--summary">
        <div class="h5-detail-card__title-row">
          <h2>{{ displayTitle }}</h2>
          <strong>{{ formatPriceBlock(subtotalPrice) }}</strong>
        </div>
        <div class="h5-detail-card__meta-row">
          <div class="h5-detail-card__rating" v-if="averageRating > 0">
            <van-rate :model-value="averageRating" allow-half readonly size="12" color="#fbbf24" />
            <span>{{ t('h5.productDetail.reviewCount', { count: reviewCount }) }}</span>
          </div>
          <span v-else>{{ t('h5.productDetail.reviewCount', { count: 0 }) }}</span>
          <template v-if="soldCount > 0">
            <span class="h5-detail-card__meta-separator" />
            <span>{{ t('h5.productDetail.soldCount', { count: soldCount }) }}</span>
          </template>
        </div>
        <div class="h5-detail-card__divider" />
        <div class="h5-detail-card__section">
          <h3>{{ t('client.productDetail.serviceDescription') }}</h3>
          <p v-if="isLoading">{{ t('client.productDetail.loading') }}</p>
          <p v-else-if="displayDesc">{{ displayDesc }}</p>
          <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
        </div>
      </section>

      <section class="h5-detail-card">
        <div class="h5-detail-card__heading">
          <span />
          <h3>{{ t('h5.productDetail.bookingOptions') }}</h3>
        </div>

        <div v-if="bookingSpecGroups.length || bookingAttachGroups.length" class="h5-booking-groups">
          <div v-for="group in bookingSpecGroups" :key="group.typeId" class="h5-booking-group">
            <p class="h5-booking-group__label">{{ group.label }}</p>
            <div class="h5-booking-group__options">
              <button
                v-for="option in group.options"
                :key="`${group.typeId}-${option.id}`"
                class="h5-booking-option"
                :class="{ 'h5-booking-option--active': selectedSpecValues[group.typeId] === option.id }"
                type="button"
                @click="selectSpecValue(group.typeId, option.id)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div v-for="group in bookingAttachGroups" :key="group.typeId" class="h5-booking-group">
            <p class="h5-booking-group__label">{{ group.label }}</p>
            <div class="h5-attach-list">
              <div v-for="option in group.options" :key="`${group.typeId}-${option.id}`" class="h5-attach-item">
                <div class="h5-attach-item__meta">
                  <strong>{{ option.label }}</strong>
                  <span>
                    {{ t('client.productDetail.booking.attachUnitPrice', { price: option.price.toFixed(2) }) }}
                  </span>
                </div>
                <div class="h5-attach-item__stepper">
                  <button type="button" @click="decreaseAttachQty(option.id)">-</button>
                  <span>{{ attachQuantities[option.id] || 0 }}</span>
                  <button type="button" @click="increaseAttachQty(option.id)">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
      </section>

      <section class="h5-detail-card">
        <div class="h5-detail-card__heading">
          <span />
          <h3>{{ t('client.productDetail.includesTitle') }}</h3>
        </div>
        <ul v-if="includesItems.length" class="h5-detail-checklist">
          <li v-for="item in includesItems" :key="item">
            <van-icon name="passed" />
            <span>{{ item }}</span>
          </li>
        </ul>
        <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
      </section>

      <section class="h5-detail-card">
        <div class="h5-detail-card__heading">
          <span />
          <h3>{{ t('client.productDetail.noticeTitle') }}</h3>
        </div>
        <div v-if="bookingNoticeHtml" class="h5-detail-html" v-html="bookingNoticeHtml" />
        <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
      </section>

      <section class="h5-detail-card">
        <div class="h5-detail-card__review-head">
          <div class="h5-detail-card__heading h5-detail-card__heading--compact">
            <span />
            <h3>{{ t('client.productDetail.reviewsTitle') }}</h3>
          </div>
          <div class="h5-detail-card__review-summary" v-if="averageRating > 0">
            <van-rate :model-value="averageRating" allow-half readonly size="12" color="#fbbf24" />
            <strong>{{ averageRating.toFixed(1) }}</strong>
            <span>{{ t('h5.productDetail.reviewCount', { count: reviewCount }) }}</span>
          </div>
        </div>
        <article v-if="primaryReview" class="h5-review-card">
          <div class="h5-review-card__head">
            <div class="h5-review-card__user">
              <span class="h5-review-card__avatar">{{ primaryReview.avatarText }}</span>
              <strong>{{ primaryReview.commenter }}</strong>
            </div>
            <span class="h5-review-card__time" v-if="primaryReview.commentTime">{{ primaryReview.commentTime }}</span>
          </div>
          <van-rate :model-value="primaryReview.rating" readonly size="12" color="#fbbf24" />
          <p>{{ primaryReview.content }}</p>
        </article>
        <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
      </section>
    </main>

    <footer class="h5-detail-bottom">
      <div class="h5-detail-bottom__summary">
        <div>
          <span>{{ t('client.productDetail.booking.vat') }}</span>
          <small>{{ formatAed(vatPrice) }}</small>
        </div>
        <div>
          <span>{{ t('client.productDetail.booking.total') }}</span>
          <strong>{{ formatAed(totalPrice) }}</strong>
        </div>
      </div>
      <button class="h5-detail-bottom__submit" type="button" :disabled="isCreatingOrder" @click="goOrderConfirm">
        {{ isCreatingOrder ? t('client.profile.actions.submitting') : t('client.productDetail.booking.bookNow') }}
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast } from 'vant';
import { createOrder, getProductDetail, getProductSku } from '@/modules/client/api';
import { setClientLocale } from '@/modules/client/locales';

type I18nText = Record<string, string>;
type I18nTextArray = Record<string, string[]>;

type ProductDetailRecord = {
  id?: number | string;
  spuId?: number | string;
  imageUrls?: string[];
  nameI18n?: I18nText;
  descI18n?: I18nText;
  serviceContentI18n?: I18nTextArray;
  bookingNoticeI18n?: I18nText;
  specBindings?: Array<{
    specTypeId?: number | string;
    specValueIds?: Array<number | string>;
  }>;
  specTypeNameI18n?: Record<string, I18nText>;
  specValueNameI18n?: Record<string, I18nText>;
  attachBindings?: Array<{
    attachTypeId?: number | string;
    attachValueIds?: Array<number | string>;
  }>;
  attachTypeNameI18n?: Record<string, I18nText>;
  attachValueNameI18n?: Record<string, I18nText>;
  reviewList?: Array<{
    rating?: number | string;
    content?: string;
    commenter?: string;
    avatarUrl?: string | null;
    commentTime?: string;
  }>;
  minPrice?: number | string;
  price?: number | string;
  soldCount?: number | string;
  saleCount?: number | string;
  salesCount?: number | string;
  orderCount?: number | string;
  reviewCount?: number | string;
  commentCount?: number | string;
  rating?: number | string;
  ratingAvg?: number | string;
  ratingAverage?: number | string;
  [key: string]: unknown;
};

type ProductSkuPayload = {
  spuId: number | string;
  specValueIds: Array<number | string>;
  attachItems: Array<{
    attachValueId: number | string;
    quantity: number;
  }>;
};

type ProductSkuRecord = {
  skuId?: number | string;
  totalPrice?: number | string;
  totalPriceWithTax?: number | string;
  attachTotalPrice?: number | string;
  attachTotalPriceWithTax?: number | string;
  totalTaxPrice?: number | string;
};

type RebookSpecSelection = {
  specTypeId: string;
  specValueId: string;
};

type RebookAttachSelection = {
  attachValueId: string;
  quantity: number;
};

type BookingSpecOption = { id: string; label: string };
type BookingSpecGroup = { typeId: string; label: string; options: BookingSpecOption[] };
type BookingAttachOption = { id: string; label: string; price: number };
type BookingAttachGroup = { typeId: string; label: string; options: BookingAttachOption[] };

const fallbackGallery = [
  'https://www.figma.com/api/mcp/asset/dbce0640-663a-4f61-812a-00884004fb43',
  'https://www.figma.com/api/mcp/asset/561d0271-676b-468c-8b4d-07d08db4945d',
  'https://www.figma.com/api/mcp/asset/4a3d627d-d868-413e-8717-782857d00f20',
];

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n({ useScope: 'global' });

const isLoading = ref(false);
const isCreatingOrder = ref(false);
const productDetail = ref<ProductDetailRecord | null>(null);
const skuPrice = ref<ProductSkuRecord | null>(null);
const selectedImageIndex = ref(0);
const selectedSpecValues = ref<Record<string, string>>({});
const attachQuantities = ref<Record<string, number>>({});
const skuRequestSeq = ref(0);

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const pickI18nValue = (i18n?: I18nText, fallback = ''): string => {
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

const pickI18nList = (i18n?: I18nTextArray): string[] => {
  const valueMap = i18n || {};
  for (const lang of getPreferredLangs()) {
    const value = valueMap[lang];
    if (Array.isArray(value)) {
      const normalized = value.map((item) => String(item ?? '').trim()).filter(Boolean);
      if (normalized.length) {
        return normalized;
      }
    }
  }
  const firstValue = Object.values(valueMap).find((value) => Array.isArray(value) && value.length > 0);
  return Array.isArray(firstValue)
    ? firstValue.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
};

const getRouteQueryText = (key: string): string => {
  const raw = route.query[key];
  if (Array.isArray(raw)) {
    return typeof raw[0] === 'string' ? raw[0].trim() : '';
  }
  return typeof raw === 'string' ? raw.trim() : '';
};

const parseSpuId = (): string => {
  const fromParams = route.params.spuId;
  if (typeof fromParams === 'string' && fromParams.trim()) {
    return fromParams.trim();
  }
  if (Array.isArray(fromParams) && typeof fromParams[0] === 'string' && fromParams[0].trim()) {
    return fromParams[0].trim();
  }
  const fromQuery = route.query.spuId;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.trim();
  }
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === 'string' && fromQuery[0].trim()) {
    return fromQuery[0].trim();
  }
  return '';
};

const parseRebookSpecSelections = (): RebookSpecSelection[] => {
  const raw = getRouteQueryText('specSelections');
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const specTypeId = String((item as any).specTypeId ?? '').trim();
        const specValueId = String((item as any).specValueId ?? '').trim();
        if (!specTypeId || !specValueId) {
          return null;
        }
        return { specTypeId, specValueId };
      })
      .filter((item): item is RebookSpecSelection => Boolean(item));
  } catch {
    return [];
  }
};

const parseRebookAttachSelections = (): RebookAttachSelection[] => {
  const raw = getRouteQueryText('attachSelections');
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const attachValueId = String((item as any).attachValueId ?? '').trim();
        const quantity = Math.max(0, Number((item as any).quantity ?? 0) || 0);
        if (!attachValueId || quantity <= 0) {
          return null;
        }
        return { attachValueId, quantity };
      })
      .filter((item): item is RebookAttachSelection => Boolean(item));
  } catch {
    return [];
  }
};

const resolveNumber = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return numeric >= 0 ? numeric : 0;
};

const resolveOptionalNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric >= 0 ? numeric : 0;
};

const normalizeIdForApi = (value: string): number | string => {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : value;
};

const spuId = computed(() => parseSpuId());
const rebookSpecSelections = computed(() => parseRebookSpecSelections());
const rebookAttachSelections = computed(() => parseRebookAttachSelections());

const rebookSpecSelectionMap = computed(() => {
  const map: Record<string, string> = {};
  rebookSpecSelections.value.forEach((item) => {
    map[item.specTypeId] = item.specValueId;
  });
  return map;
});

const rebookAttachSelectionMap = computed(() => {
  const map: Record<string, number> = {};
  rebookAttachSelections.value.forEach((item) => {
    map[item.attachValueId] = item.quantity;
  });
  return map;
});

const galleryImages = computed(() => {
  const raw = productDetail.value?.imageUrls;
  const fromApi = Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  return fromApi.length ? fromApi : fallbackGallery;
});

const displayTitle = computed(() => pickI18nValue(productDetail.value?.nameI18n, t('client.productDetail.fallbackTitle')));
const displayDesc = computed(() => pickI18nValue(productDetail.value?.descI18n, ''));
const includesItems = computed(() => pickI18nList(productDetail.value?.serviceContentI18n));
const bookingNoticeHtml = computed(() => pickI18nValue(productDetail.value?.bookingNoticeI18n, ''));

const serviceListQuery = computed(() => {
  const query: Record<string, string> = {};
  const categoryId = getRouteQueryText('categoryId');
  const level1 = getRouteQueryText('level1');
  const name = getRouteQueryText('breadcrumb') || getRouteQueryText('name');
  if (categoryId) query.categoryId = categoryId;
  if (level1) query.level1 = level1;
  if (name) query.name = name;
  return query;
});

const basePrice = computed(() => resolveNumber(productDetail.value?.minPrice ?? productDetail.value?.price));

const buildAttachOptionPriceMap = (record: ProductDetailRecord | null) => {
  const map: Record<string, number> = {};
  if (!record || typeof record !== 'object') {
    return map;
  }

  const appendByMap = (source: unknown) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return;
    }
    Object.entries(source as Record<string, unknown>).forEach(([id, rawPrice]) => {
      const cleanId = String(id || '').trim();
      if (!cleanId) return;
      const price = resolveOptionalNumber(rawPrice);
      if (price === null) return;
      if (map[cleanId] === undefined || map[cleanId] <= 0) {
        map[cleanId] = price;
      }
    });
  };

  const appendByArray = (source: unknown) => {
    if (!Array.isArray(source)) {
      return;
    }
    source.forEach((item) => {
      if (!item || typeof item !== 'object') {
        return;
      }
      const entry = item as Record<string, unknown>;
      const id = String(entry.id ?? entry.attachValueId ?? entry.valueId ?? '').trim();
      if (!id) return;
      const price = resolveOptionalNumber(
        entry.price ?? entry.amount ?? entry.attachPrice ?? entry.attachAmount,
      );
      if (price === null) return;
      if (map[id] === undefined || map[id] <= 0) {
        map[id] = price;
      }
    });
  };

  appendByMap((record as any).attachValuePriceMap);
  appendByMap((record as any).attachValueAmountMap);
  appendByMap((record as any).attachPriceMap);
  appendByMap((record as any).attachAmountMap);
  appendByMap((record as any).attachValuePrices);
  appendByMap((record as any).attachValueAmounts);

  appendByArray((record as any).attachValues);
  appendByArray((record as any).attachValueList);
  appendByArray((record as any).attachValueItems);
  appendByArray((record as any).attachOptions);
  appendByArray((record as any).addons);
  appendByArray((record as any).addonOptions);

  const bindings = Array.isArray((record as any).attachBindings)
    ? ((record as any).attachBindings as Array<Record<string, unknown>>)
    : [];
  bindings.forEach((binding) => {
    Object.values(binding).forEach((value) => appendByArray(value));
  });

  return map;
};

const attachOptionPriceMap = computed(() => buildAttachOptionPriceMap(productDetail.value));

const bookingSpecGroups = computed<BookingSpecGroup[]>(() => {
  const record = productDetail.value;
  const bindings = Array.isArray(record?.specBindings) ? record.specBindings : [];
  return bindings
    .map((binding) => {
      const typeId = String(binding.specTypeId ?? '').trim();
      if (!typeId) return null;
      const label = pickI18nValue(record?.specTypeNameI18n?.[typeId], typeId);
      const valueIds = Array.isArray(binding.specValueIds) ? binding.specValueIds : [];
      const options = valueIds
        .map((valueId) => {
          const id = String(valueId ?? '').trim();
          if (!id) return null;
          const optionLabel = pickI18nValue(record?.specValueNameI18n?.[id], id);
          return optionLabel ? { id, label: optionLabel } : null;
        })
        .filter((item): item is BookingSpecOption => Boolean(item));
      return options.length ? { typeId, label, options } : null;
    })
    .filter((item): item is BookingSpecGroup => Boolean(item));
});

const bookingAttachGroups = computed<BookingAttachGroup[]>(() => {
  const record = productDetail.value;
  const bindings = Array.isArray(record?.attachBindings) ? record.attachBindings : [];
  return bindings
    .map((binding) => {
      const typeId = String(binding.attachTypeId ?? '').trim();
      if (!typeId) return null;
      const label = pickI18nValue(record?.attachTypeNameI18n?.[typeId], typeId);
      const valueIds = Array.isArray(binding.attachValueIds) ? binding.attachValueIds : [];
      const options = valueIds
        .map((valueId) => {
          const id = String(valueId ?? '').trim();
          if (!id) return null;
          const optionLabel = pickI18nValue(record?.attachValueNameI18n?.[id], id);
          return optionLabel ? { id, label: optionLabel, price: attachOptionPriceMap.value[id] ?? 0 } : null;
        })
        .filter((item): item is BookingAttachOption => Boolean(item));
      return options.length ? { typeId, label, options } : null;
    })
    .filter((item): item is BookingAttachGroup => Boolean(item));
});

const selectedSpecValueIds = computed(() =>
  bookingSpecGroups.value
    .map((group) => selectedSpecValues.value[group.typeId])
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeIdForApi(value)),
);

const attachItemsForSku = computed(() => {
  const payloadMap = new Map<string, { attachValueId: number | string; quantity: number }>();
  bookingAttachGroups.value.forEach((group) => {
    group.options.forEach((option) => {
      payloadMap.set(option.id, {
        attachValueId: normalizeIdForApi(option.id),
        quantity: Math.max(0, Number(attachQuantities.value[option.id] || 0)),
      });
    });
  });
  return Array.from(payloadMap.values());
});

const skuRequestPayload = computed<ProductSkuPayload | null>(() => {
  if (!spuId.value || !productDetail.value) return null;
  if (bookingSpecGroups.value.length > 0 && selectedSpecValueIds.value.length !== bookingSpecGroups.value.length) {
    return null;
  }
  return {
    spuId: normalizeIdForApi(spuId.value),
    specValueIds: selectedSpecValueIds.value,
    attachItems: attachItemsForSku.value,
  };
});

const skuRequestSignature = computed(() => {
  const payload = skuRequestPayload.value;
  return payload ? JSON.stringify(payload) : '';
});

const subtotalPrice = computed(() => resolveOptionalNumber(skuPrice.value?.totalPrice) ?? basePrice.value);
const attachTotalPrice = computed(() => {
  const fromSku = resolveOptionalNumber(skuPrice.value?.attachTotalPrice);
  if (fromSku !== null) return fromSku;
  const fromSkuWithTax = resolveOptionalNumber(skuPrice.value?.attachTotalPriceWithTax);
  if (fromSkuWithTax !== null) return fromSkuWithTax;
  return bookingAttachGroups.value.reduce((sum, group) => sum + group.options.reduce((groupSum, option) => {
    const quantity = Math.max(0, Number(attachQuantities.value[option.id] || 0));
    return groupSum + option.price * quantity;
  }, 0), 0);
});

const vatPrice = computed(() => {
  const explicitTax = resolveOptionalNumber(skuPrice.value?.totalTaxPrice);
  if (explicitTax !== null) return explicitTax;
  const withTax = resolveOptionalNumber(skuPrice.value?.totalPriceWithTax);
  const withoutTax = resolveOptionalNumber(skuPrice.value?.totalPrice);
  if (withTax !== null && withoutTax !== null) {
    return Math.max(0, withTax - withoutTax);
  }
  return subtotalPrice.value * 0.05;
});

const totalPrice = computed(() => resolveOptionalNumber(skuPrice.value?.totalPriceWithTax) ?? subtotalPrice.value + vatPrice.value);

const normalizeRating = (value: unknown): number => {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.max(0, Math.min(5, rating));
};

const reviewItems = computed(() => {
  const source = Array.isArray(productDetail.value?.reviewList) ? productDetail.value?.reviewList || [] : [];
  return source.map((item) => {
    const commenter = String(item.commenter ?? '').trim() || t('client.productDetail.reviewUser');
    const content = String(item.content ?? '').trim() || t('client.productDetail.reviewText');
    const commentTime = String(item.commentTime ?? '').trim();
    return {
      commenter,
      content,
      commentTime,
      avatarText: commenter.slice(0, 1).toUpperCase(),
      rating: normalizeRating(item.rating),
    };
  });
});

const reviewCount = computed(() => {
  const explicit = resolveOptionalNumber(productDetail.value?.reviewCount ?? productDetail.value?.commentCount);
  if (explicit !== null && explicit > 0) return explicit;
  return reviewItems.value.length;
});

const averageRating = computed(() => {
  const explicit = resolveOptionalNumber(
    productDetail.value?.ratingAverage ?? productDetail.value?.ratingAvg ?? productDetail.value?.rating,
  );
  if (explicit !== null && explicit > 0) {
    return Number(explicit.toFixed(1));
  }
  if (!reviewItems.value.length) return 0;
  const total = reviewItems.value.reduce((sum, item) => sum + item.rating, 0);
  return Number((total / reviewItems.value.length).toFixed(1));
});

const soldCount = computed(() => {
  const count = resolveOptionalNumber(
    productDetail.value?.soldCount
    ?? productDetail.value?.saleCount
    ?? productDetail.value?.salesCount
    ?? productDetail.value?.orderCount,
  );
  return count ?? 0;
});

const primaryReview = computed(() => reviewItems.value[0] || null);

const loadProductDetail = async () => {
  if (!spuId.value) {
    productDetail.value = null;
    skuPrice.value = null;
    return;
  }
  isLoading.value = true;
  skuPrice.value = null;
  try {
    const payload = await getProductDetail(spuId.value);
    productDetail.value = payload && typeof payload === 'object' ? (payload as ProductDetailRecord) : null;
  } catch (error) {
    console.error('load product detail failed:', error);
    productDetail.value = null;
  } finally {
    isLoading.value = false;
  }
};

const loadSkuPrice = async (payload: ProductSkuPayload) => {
  const requestId = skuRequestSeq.value + 1;
  skuRequestSeq.value = requestId;
  try {
    const result = await getProductSku(payload);
    if (requestId !== skuRequestSeq.value) return;
    skuPrice.value = result && typeof result === 'object' ? (result as ProductSkuRecord) : null;
  } catch (error) {
    if (requestId !== skuRequestSeq.value) return;
    console.error('load product sku failed:', error);
    skuPrice.value = null;
  }
};

watch(
  () => spuId.value,
  () => {
    void loadProductDetail();
  },
  { immediate: true },
);

watch(
  () => [spuId.value, getRouteQueryText('specSelections'), getRouteQueryText('attachSelections')],
  () => {
    selectedSpecValues.value = {};
    attachQuantities.value = {};
  },
  { immediate: true },
);

watch(
  () => bookingSpecGroups.value,
  (groups) => {
    const rebookMap = rebookSpecSelectionMap.value;
    const next: Record<string, string> = {};
    groups.forEach((group) => {
      const current = selectedSpecValues.value[group.typeId];
      const isValid = group.options.some((option) => option.id === current);
      const rebookSelected = rebookMap[group.typeId];
      const isRebookValid = group.options.some((option) => option.id === rebookSelected);
      next[group.typeId] = isValid ? current : (isRebookValid ? rebookSelected : group.options[0].id);
    });
    selectedSpecValues.value = next;
  },
  { immediate: true },
);

watch(
  () => bookingAttachGroups.value,
  (groups) => {
    const rebookMap = rebookAttachSelectionMap.value;
    const next: Record<string, number> = {};
    groups.forEach((group) => {
      group.options.forEach((option) => {
        const current = attachQuantities.value[option.id];
        const rebookQuantity = rebookMap[option.id];
        next[option.id] = Number.isFinite(current) && current > 0
          ? current
          : (Number.isFinite(rebookQuantity) && rebookQuantity > 0 ? rebookQuantity : 0);
      });
    });
    attachQuantities.value = next;
  },
  { immediate: true },
);

watch(
  () => skuRequestSignature.value,
  () => {
    const payload = skuRequestPayload.value;
    if (!payload) {
      skuPrice.value = null;
      return;
    }
    void loadSkuPrice(payload);
  },
  { immediate: true },
);

watch(
  () => locale.value,
  () => {
    setClientLocale(locale.value === 'zh' ? 'zh' : 'en');
  },
  { immediate: true },
);

const handleSwipeChange = (index: number) => {
  selectedImageIndex.value = index;
};

const selectSpecValue = (typeId: string, valueId: string) => {
  selectedSpecValues.value = {
    ...selectedSpecValues.value,
    [typeId]: valueId,
  };
};

const increaseAttachQty = (valueId: string) => {
  const current = attachQuantities.value[valueId] || 0;
  attachQuantities.value = {
    ...attachQuantities.value,
    [valueId]: current + 1,
  };
};

const decreaseAttachQty = (valueId: string) => {
  const current = attachQuantities.value[valueId] || 0;
  attachQuantities.value = {
    ...attachQuantities.value,
    [valueId]: Math.max(0, current - 1),
  };
};

const formatAed = (value: number) => `${value.toFixed(2)} AED`;
const formatPriceBlock = (value: number) => `${value.toFixed(2)} AED`;

const handleBack = () => {
  if (Object.keys(serviceListQuery.value).length) {
    router.push({ name: 'h5-service-list', query: serviceListQuery.value });
    return;
  }
  router.push({ name: 'h5-home' });
};

const goOrderConfirm = async () => {
  if (isCreatingOrder.value) return;
  const payload = skuRequestPayload.value;
  if (!payload) {
    showFailToast(t('client.productDetail.booking.createOrderInvalid'));
    return;
  }
  isCreatingOrder.value = true;
  try {
    const createdOrderId = await createOrder(payload);
    const orderIdText = String(createdOrderId ?? '').trim();
    if (!orderIdText) {
      showFailToast(t('client.productDetail.booking.createOrderFailed'));
      return;
    }
    router.push({
      name: 'h5-order-confirm',
      query: {
        orderId: orderIdText,
        spuId: spuId.value,
        skuId: skuPrice.value?.skuId ? String(skuPrice.value.skuId) : '',
        title: displayTitle.value,
        titleI18n: JSON.stringify(productDetail.value?.nameI18n || {}),
        specSummary: bookingSpecGroups.value
          .map((group) => {
            const selectedId = selectedSpecValues.value[group.typeId];
            return group.options.find((option) => option.id === selectedId)?.label || '';
          })
          .filter(Boolean)
          .join(' / '),
        selectedSpecValueIds: JSON.stringify(selectedSpecValueIds.value.map((id) => String(id))),
        specValueNameI18n: JSON.stringify(productDetail.value?.specValueNameI18n || {}),
        subtotal: subtotalPrice.value.toFixed(2),
        tax: vatPrice.value.toFixed(2),
        total: totalPrice.value.toFixed(2),
        breadcrumb: getRouteQueryText('breadcrumb'),
        name: getRouteQueryText('name'),
        categoryId: getRouteQueryText('categoryId'),
        level1: getRouteQueryText('level1'),
      },
    });
  } catch (error: any) {
    showFailToast(error?.message || t('client.productDetail.booking.createOrderFailed'));
  } finally {
    isCreatingOrder.value = false;
  }
};
</script>

<style scoped lang="scss">
.h5-detail-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

.h5-detail-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 56px;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #f3f4f6;
  backdrop-filter: blur(12px);
}

.h5-detail-topbar__back,
.h5-detail-topbar__spacer {
  width: 40px;
  height: 40px;
}

.h5-detail-topbar__back {
  border: 0;
  background: transparent;
  color: #1d293d;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 22px;
}

.h5-detail-topbar h1 {
  margin: 0;
  text-align: center;
  color: #1d293d;
  font-size: 16px;
  font-weight: 700;
}

.h5-detail-main {
  max-width: 430px;
  margin: 0 auto;
}

.h5-detail-gallery {
  position: relative;
  background: #fff;
}

.h5-detail-gallery__swipe {
  height: 226px;
}

.h5-detail-gallery__swipe img {
  width: 100%;
  height: 226px;
  object-fit: cover;
  display: block;
}

.h5-detail-gallery__badge {
  position: absolute;
  top: 16px;
  left: 16px;
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
  background: #3972f5;
  color: #fff;
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
}

.h5-detail-gallery__dots {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.h5-detail-gallery__dots span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
}

.h5-detail-gallery__dot--active {
  width: 10px;
  background: #3972f5 !important;
}

.h5-detail-card {
  margin-top: 8px;
  padding: 20px 16px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.h5-detail-card--summary {
  margin-top: 0;
}

.h5-detail-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.h5-detail-card__title-row h2 {
  margin: 0;
  color: #1d293d;
  font-size: 16px;
  line-height: 1.25;
  font-weight: 900;
}

.h5-detail-card__title-row strong {
  color: #3972f5;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
  white-space: nowrap;
}

.h5-detail-card__meta-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #62748e;
  font-size: 11px;
  font-weight: 700;
}

.h5-detail-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.h5-detail-card__meta-separator {
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: #cad5e2;
}

.h5-detail-card__divider {
  margin: 14px 0;
  border-top: 1px solid #f3f4f6;
}

.h5-detail-card__section h3,
.h5-detail-card__heading h3 {
  margin: 0;
  color: #1d293d;
  font-size: 15px;
  font-weight: 900;
}

.h5-detail-card__section p {
  margin: 10px 0 0;
  color: #62748e;
  font-size: 12px;
  line-height: 1.65;
}

.h5-detail-card__empty {
  margin: 8px 0 0;
  color: rgba(15, 23, 42, 0.38);
  font-size: 12px;
}

.h5-detail-card__heading,
.h5-detail-card__review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-detail-card__heading {
  justify-content: flex-start;
}

.h5-detail-card__heading span {
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background: #3972f5;
}

.h5-detail-card__heading--compact {
  gap: 8px;
}

.h5-booking-groups {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.h5-booking-group__label {
  margin: 0 0 8px;
  color: #1d293d;
  font-size: 12px;
  font-weight: 700;
}

.h5-booking-group__options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.h5-booking-option {
  min-height: 35px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #62748e;
  font-size: 12px;
  font-weight: 700;
  padding: 0 10px;
}

.h5-booking-option--active {
  border-color: #3972f5;
  background: #eff6ff;
  color: #3972f5;
}

.h5-attach-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.h5-attach-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.h5-attach-item__meta strong {
  display: block;
  color: #1d293d;
  font-size: 12px;
  font-weight: 700;
}

.h5-attach-item__meta span {
  display: block;
  margin-top: 4px;
  color: #62748e;
  font-size: 11px;
}

.h5-attach-item__stepper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.h5-attach-item__stepper button,
.h5-attach-item__stepper span {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.h5-attach-item__stepper button {
  border: 1px solid #dbe3ee;
  background: #fff;
  color: #1d293d;
}

.h5-attach-item__stepper span {
  color: #1d293d;
}

.h5-detail-checklist {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.h5-detail-checklist li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #45556c;
  font-size: 12px;
  line-height: 1.6;
}

.h5-detail-checklist :deep(.van-icon) {
  margin-top: 2px;
  color: #10b981;
  font-size: 14px;
}

.h5-detail-html {
  margin-top: 16px;
  color: #45556c;
  font-size: 12px;
  line-height: 1.7;
}

.h5-detail-html :deep(*) {
  box-sizing: border-box;
}

.h5-detail-html :deep(p),
.h5-detail-html :deep(li) {
  color: #45556c;
  font-size: 12px;
  line-height: 1.7;
}

.h5-detail-html :deep(ul),
.h5-detail-html :deep(ol) {
  margin: 0;
  padding-left: 16px;
}

.h5-detail-card__review-summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #62748e;
  font-size: 11px;
}

.h5-detail-card__review-summary strong {
  color: #1d293d;
  font-size: 14px;
}

.h5-review-card {
  margin-top: 16px;
}

.h5-review-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-review-card__user {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.h5-review-card__avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #eff6ff;
  color: #3972f5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.h5-review-card__user strong {
  color: #1d293d;
  font-size: 13px;
  font-weight: 700;
}

.h5-review-card__time {
  color: #90a1b9;
  font-size: 11px;
}

.h5-review-card :deep(.van-rate) {
  margin-top: 8px;
}

.h5-review-card p {
  margin: 10px 0 0;
  color: #45556c;
  font-size: 13px;
  line-height: 1.6;
}

.h5-detail-bottom {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 25;
  width: min(430px, 100vw);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #f3f4f6;
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
}

.h5-detail-bottom__summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.h5-detail-bottom__summary span {
  color: #90a1b9;
  font-size: 11px;
}

.h5-detail-bottom__summary small {
  color: #62748e;
  font-size: 10px;
}

.h5-detail-bottom__summary strong {
  color: #3972f5;
  font-size: 16px;
  margin-left: 5px;
  line-height: 1;
  font-weight: 900;
}

.h5-detail-bottom__submit {
  width: 120px;
  height: 41px;
  border: 0;
  border-radius: 6px;
  background: #3972f5;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
}

.h5-detail-bottom__submit:disabled {
  opacity: 0.7;
}
</style>
