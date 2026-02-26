<template>
  <div class="product-detail-page">
    <section class="product-detail-subheader">
      <div class="product-detail-container">
        <button class="product-detail-back" type="button" @click="goBack">
          <span class="product-detail-back__icon" aria-hidden="true">&lt;</span>
          <span>{{ t('client.productDetail.pageTitle') }}</span>
        </button>
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
                :class="{ 'product-gallery__thumb--active': index === selectedImageIndex }"
                type="button"
                @click="selectedImageIndex = index"
              >
                <img :src="image" :alt="displayTitle" />
              </button>
            </div>

            <div class="product-gallery__hero">
              <img :src="heroImage" :alt="displayTitle" />
              <span class="product-gallery__badge">
                {{ t('client.productDetail.badge') }}
              </span>
              <div class="product-gallery__dots">
                <span
                  v-for="(image, index) in galleryImages"
                  :key="`dot-${index}`"
                  :class="{ 'product-gallery__dot--active': index === selectedImageIndex }"
                />
              </div>
            </div>
          </section>

          <section class="product-card">
            <div class="product-card__head">
              <h1>{{ displayTitle }}</h1>
              <p>{{ formatAed(basePrice) }}</p>
            </div>
            <div v-if="selectedSpecSummary" class="product-card__meta">
              <span>{{ selectedSpecSummary }}</span>
            </div>
            <div class="product-card__line" />
            <div class="product-card__desc">
              <h2>{{ t('client.productDetail.serviceDescription') }}</h2>
              <p v-if="isLoading">{{ t('client.productDetail.loading') }}</p>
              <p v-else-if="displayDesc">{{ displayDesc }}</p>
              <p v-else class="product-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
            </div>
          </section>

          <section class="product-card">
            <h2>{{ t('client.productDetail.includesTitle') }}</h2>
            <ul v-if="includesItems.length" class="product-check-list">
              <li v-for="item in includesItems" :key="item">
                <span class="product-check-list__icon">v</span>
                <span>{{ item }}</span>
              </li>
            </ul>
            <p v-else class="product-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
          </section>

          <section class="product-card">
            <h2>{{ t('client.productDetail.noticeTitle') }}</h2>
            <div
              v-if="bookingNoticeHtml"
              class="product-notice-html"
              v-html="bookingNoticeHtml"
            />
            <p v-else class="product-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
          </section>

          <section class="product-card">
            <h2>{{ t('client.productDetail.reviewsTitle') }}</h2>
            <div v-if="reviewItems.length" class="product-review-list">
              <article
                v-for="(item, index) in reviewItems"
                :key="`${item.commenter}-${item.commentTime}-${index}`"
                class="product-review"
              >
                <div class="product-review__avatar">
                  <img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="item.commenter" />
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
                  <span v-if="item.commentTime" class="product-review__time">{{ item.commentTime }}</span>
                </div>
              </article>
            </div>
            <p v-else class="product-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
          </section>
        </div>

        <aside class="booking-side">
          <section class="booking-card">
            <h2>{{ t('client.productDetail.booking.title') }}</h2>

            <template v-if="bookingSpecGroups.length">
              <div v-for="group in bookingSpecGroups" :key="group.typeId" class="booking-field">
                <p>{{ group.label }}</p>
                <div class="booking-options">
                  <button
                    v-for="option in group.options"
                    :key="`${group.typeId}-${option.id}`"
                    class="booking-option"
                    :class="{ 'booking-option--active': selectedSpecValues[group.typeId] === option.id }"
                    type="button"
                    @click="selectSpecValue(group.typeId, option.id)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
            </template>

            <template v-if="bookingAttachGroups.length">
              <div v-for="group in bookingAttachGroups" :key="group.typeId" class="booking-field">
                <p>{{ group.label }}</p>
                <div class="booking-attach-list">
                  <div
                    v-for="option in group.options"
                    :key="`${group.typeId}-${option.id}`"
                    class="booking-attach-item"
                  >
                    <span class="booking-attach-item__name">{{ option.label }}</span>
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
              {{ t('client.productDetail.emptyDesc') }}
            </p>

            <div class="booking-summary">
              <div class="booking-summary__row">
                <span>{{ t('client.productDetail.booking.subtotal') }}</span>
                <strong>{{ formatAed(subtotalPrice) }}</strong>
              </div>
              <div class="booking-summary__row booking-summary__row--tax">
                <span>{{ t('client.productDetail.booking.vat') }}</span>
                <strong>{{ formatAed(vatPrice) }}</strong>
              </div>
              <div class="booking-summary__row booking-summary__row--total">
                <span>{{ t('client.productDetail.booking.total') }}</span>
                <strong>{{ formatAed(totalPrice) }}</strong>
              </div>
            </div>

            <button
              class="booking-submit"
              type="button"
              :disabled="isCreatingOrder"
              @click="goOrderConfirm"
            >
              {{ t('client.productDetail.booking.bookNow') }}
            </button>
          </section>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getProductDetail, getProductSku, createOrder } from '@/modules/client/api';

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
  skuCode?: string;
  originalPrice?: number | string;
  price?: number | string;
  totalOriginalPrice?: number | string;
  totalPrice?: number | string;
  originalPriceWithTax?: number | string;
  priceWithTax?: number | string;
  totalOriginalPriceWithTax?: number | string;
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

const fallbackGallery = [
  'https://www.figma.com/api/mcp/asset/5aa6ad0e-a319-4f63-950e-3654b6bab901',
  'https://www.figma.com/api/mcp/asset/30e46728-8330-4576-878d-44f5c5fe610e',
  'https://www.figma.com/api/mcp/asset/30d7a797-41ac-4b26-be69-b05a69801e01',
  'https://www.figma.com/api/mcp/asset/4a23c9cc-b72c-4b17-a507-ac26f8af0f40',
  'https://www.figma.com/api/mcp/asset/a3925844-c8df-4a13-bc77-e9907c4ccc27',
  'https://www.figma.com/api/mcp/asset/7e43c383-3d8d-4734-b4d3-d561d3a178eb',
];

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n({ useScope: 'global' });

const isLoading = ref(false);
const productDetail = ref<ProductDetailRecord | null>(null);
const skuPrice = ref<ProductSkuRecord | null>(null);
const selectedImageIndex = ref(0);
const selectedSpecValues = ref<Record<string, string>>({});
const attachQuantities = ref<Record<string, number>>({});
const skuRequestSeq = ref(0);
const isCreatingOrder = ref(false);

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const pickI18nValue = (
  i18n?: I18nText,
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

const pickI18nList = (
  i18n?: I18nTextArray,
): string[] => {
  const valueMap = i18n || {};
  const preferredLangs = getPreferredLangs();
  for (const lang of preferredLangs) {
    const value = valueMap[lang];
    if (Array.isArray(value)) {
      const normalized = value.map((item) => String(item ?? '').trim()).filter(Boolean);
      if (normalized.length) {
        return normalized;
      }
    }
  }
  const firstValue = Object.values(valueMap).find((value) => Array.isArray(value) && value.length > 0);
  if (Array.isArray(firstValue)) {
    return firstValue.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  return [];
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

const getRouteQueryText = (key: string): string => {
  const raw = route.query[key];
  if (Array.isArray(raw)) {
    return typeof raw[0] === 'string' ? raw[0].trim() : '';
  }
  return typeof raw === 'string' ? raw.trim() : '';
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
        const selection = item as {
          specTypeId?: number | string;
          specValueId?: number | string;
        };
        const specTypeId = String(selection.specTypeId ?? '').trim();
        const specValueId = String(selection.specValueId ?? '').trim();
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
        const selection = item as {
          attachValueId?: number | string;
          quantity?: number | string;
        };
        const attachValueId = String(selection.attachValueId ?? '').trim();
        const quantity = Math.max(0, Number(selection.quantity ?? 0) || 0);
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
  if (Number.isInteger(numeric)) {
    return numeric;
  }
  return value;
};

const galleryImages = computed<string[]>(() => {
  const raw = productDetail.value?.imageUrls;
  const fromApi = Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  return fromApi.length ? fromApi : fallbackGallery;
});

const heroImage = computed(() => galleryImages.value[selectedImageIndex.value] || fallbackGallery[0]);

const displayTitle = computed(() =>
  pickI18nValue(
    productDetail.value?.nameI18n,
    t('client.productDetail.fallbackTitle'),
  ),
);

const displayDesc = computed(() =>
  pickI18nValue(productDetail.value?.descI18n, ''),
);

const basePrice = computed(() =>
  resolveNumber(productDetail.value?.minPrice ?? productDetail.value?.price),
);

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
      const quantity = Math.max(0, Number(attachQuantities.value[option.id] || 0));
      payloadMap.set(option.id, {
        attachValueId: normalizeIdForApi(option.id),
        quantity,
      });
    });
  });
  return Array.from(payloadMap.values());
});

const skuRequestPayload = computed<ProductSkuPayload | null>(() => {
  if (!spuId.value) {
    return null;
  }
  if (!productDetail.value) {
    return null;
  }
  if (
    bookingSpecGroups.value.length > 0 &&
    selectedSpecValueIds.value.length !== bookingSpecGroups.value.length
  ) {
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

const subtotalPrice = computed(() => {
  const skuSubtotal = resolveOptionalNumber(skuPrice.value?.totalPrice);
  return skuSubtotal ?? basePrice.value;
});

const vatPrice = computed(() => {
  const explicitTax = resolveOptionalNumber(skuPrice.value?.totalTaxPrice);
  if (explicitTax !== null) {
    return explicitTax;
  }
  const withTax = resolveOptionalNumber(skuPrice.value?.totalPriceWithTax);
  const withoutTax = resolveOptionalNumber(skuPrice.value?.totalPrice);
  if (withTax !== null && withoutTax !== null) {
    return Math.max(0, withTax - withoutTax);
  }
  return subtotalPrice.value * 0.05;
});

const totalPrice = computed(() => {
  const skuTotal = resolveOptionalNumber(skuPrice.value?.totalPriceWithTax);
  if (skuTotal !== null) {
    return skuTotal;
  }
  return subtotalPrice.value + vatPrice.value;
});

const includesItems = computed(() =>
  pickI18nList(productDetail.value?.serviceContentI18n),
);

const bookingNoticeHtml = computed(() =>
  pickI18nValue(productDetail.value?.bookingNoticeI18n, ''),
);

const normalizeRating = (value: unknown): number => {
  const rating = Number(value);
  if (!Number.isFinite(rating)) {
    return 0;
  }
  if (rating < 0) {
    return 0;
  }
  if (rating > 5) {
    return 5;
  }
  return rating;
};

const reviewItems = computed(() => {
  const source = Array.isArray(productDetail.value?.reviewList)
    ? productDetail.value?.reviewList || []
    : [];
  return source.map((item) => {
    const commenter = String(item.commenter ?? '').trim() || t('client.productDetail.reviewUser');
    const content = String(item.content ?? '').trim() || t('client.productDetail.reviewText');
    const avatarUrl = typeof item.avatarUrl === 'string' ? item.avatarUrl.trim() : '';
    const commentTime = String(item.commentTime ?? '').trim();
    const avatarText = commenter.slice(0, 1).toUpperCase();
    return {
      commenter,
      content,
      avatarUrl,
      commentTime,
      avatarText,
      rating: normalizeRating(item.rating),
    };
  });
});

type BookingSpecOption = {
  id: string;
  label: string;
};

type BookingSpecGroup = {
  typeId: string;
  label: string;
  options: BookingSpecOption[];
};

type BookingAttachOption = {
  id: string;
  label: string;
};

type BookingAttachGroup = {
  typeId: string;
  label: string;
  options: BookingAttachOption[];
};

const bookingSpecGroups = computed<BookingSpecGroup[]>(() => {
  const record = productDetail.value;
  const bindings = Array.isArray(record?.specBindings) ? record.specBindings : [];
  return bindings
    .map((binding) => {
      const typeId = String(binding.specTypeId ?? '').trim();
      if (!typeId) {
        return null;
      }
      const label = pickI18nValue(record?.specTypeNameI18n?.[typeId], typeId);
      const valueIds = Array.isArray(binding.specValueIds) ? binding.specValueIds : [];
      const options = valueIds
        .map((valueId) => {
          const id = String(valueId ?? '').trim();
          if (!id) {
            return null;
          }
          const optionLabel = pickI18nValue(record?.specValueNameI18n?.[id], id);
          return optionLabel ? { id, label: optionLabel } : null;
        })
        .filter((item): item is BookingSpecOption => Boolean(item));
      if (!options.length) {
        return null;
      }
      return {
        typeId,
        label,
        options,
      };
    })
    .filter((item): item is BookingSpecGroup => Boolean(item));
});

const selectedSpecSummary = computed(() => {
  return bookingSpecGroups.value
    .map((group) => {
      const selectedId = selectedSpecValues.value[group.typeId];
      const selected = group.options.find((option) => option.id === selectedId);
      return selected?.label || '';
    })
    .filter(Boolean)
    .join(' / ');
});

const bookingAttachGroups = computed<BookingAttachGroup[]>(() => {
  const record = productDetail.value;
  const bindings = Array.isArray(record?.attachBindings) ? record.attachBindings : [];
  return bindings
    .map((binding) => {
      const typeId = String(binding.attachTypeId ?? '').trim();
      if (!typeId) {
        return null;
      }
      const label = pickI18nValue(record?.attachTypeNameI18n?.[typeId], typeId);
      const valueIds = Array.isArray(binding.attachValueIds) ? binding.attachValueIds : [];
      const options = valueIds
        .map((valueId) => {
          const id = String(valueId ?? '').trim();
          if (!id) {
            return null;
          }
          const optionLabel = pickI18nValue(record?.attachValueNameI18n?.[id], id);
          return optionLabel ? { id, label: optionLabel } : null;
        })
        .filter((item): item is BookingAttachOption => Boolean(item));
      if (!options.length) {
        return null;
      }
      return {
        typeId,
        label,
        options,
      };
    })
    .filter((item): item is BookingAttachGroup => Boolean(item));
});

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
    productDetail.value =
      payload && typeof payload === 'object'
        ? (payload as ProductDetailRecord)
        : null;
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
    if (requestId !== skuRequestSeq.value) {
      return;
    }
    skuPrice.value = result && typeof result === 'object'
      ? (result as ProductSkuRecord)
      : null;
  } catch (error) {
    if (requestId !== skuRequestSeq.value) {
      return;
    }
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
  () => galleryImages.value.length,
  (length) => {
    if (!length) {
      selectedImageIndex.value = 0;
      return;
    }
    if (selectedImageIndex.value >= length) {
      selectedImageIndex.value = 0;
    }
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
      next[group.typeId] = isValid
        ? current
        : (isRebookValid ? rebookSelected : group.options[0].id);
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

const formatAed = (value: number) => `${value.toFixed(2)} AED`;

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

const goBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/services/daily-cleaning');
};

const goOrderConfirm = async () => {
  if (isCreatingOrder.value) {
    return;
  }

  const payload = skuRequestPayload.value;
  if (!payload) {
    ElMessage.warning(t('client.productDetail.booking.createOrderInvalid'));
    return;
  }

  isCreatingOrder.value = true;
  try {
    const createdOrderId = await createOrder(payload);
    const orderIdText = String(createdOrderId ?? '').trim();
    if (!orderIdText) {
      ElMessage.error(t('client.productDetail.booking.createOrderFailed'));
      return;
    }

    router.push({
      name: 'order-confirm',
      query: {
        orderId: orderIdText,
        spuId: spuId.value,
        skuId: skuPrice.value?.skuId ? String(skuPrice.value.skuId) : '',
        title: displayTitle.value,
        specSummary: selectedSpecSummary.value,
        subtotal: subtotalPrice.value.toFixed(2),
        tax: vatPrice.value.toFixed(2),
        total: totalPrice.value.toFixed(2),
      },
    });
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.productDetail.booking.createOrderFailed'));
  } finally {
    isCreatingOrder.value = false;
  }
};
</script>

<style scoped lang="scss">
.product-detail-page {
  min-height: 100%;
  background: #f8fafc;
}

.product-detail-subheader {
  height: 64px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.product-detail-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.product-detail-back {
  height: 64px;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #3972f5;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.product-detail-back__icon {
  color: rgba(15, 23, 42, 0.9);
  font-size: 24px;
}

.product-detail-body {
  padding: 16px 0 40px;
}

.product-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
}

.product-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-gallery {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 16px;
}

.product-gallery__thumbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-gallery__thumb {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  border: 2px solid transparent;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #fff;
}

.product-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-gallery__thumb--active {
  border-color: #3972f5;
  box-shadow: 0 0 0 2px rgba(57, 114, 245, 0.2);
}

.product-gallery__hero {
  position: relative;
  min-height: 450px;
  border-radius: 16px;
  overflow: hidden;
  background: #e5e7eb;
}

.product-gallery__hero img {
  width: 100%;
  height: 450px;
  object-fit: cover;
  display: block;
}

.product-gallery__badge {
  position: absolute;
  top: 16px;
  left: 16px;
  height: 24px;
  border-radius: 999px;
  background: #3972f5;
  color: #fff;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
}

.product-gallery__dots {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.product-gallery__dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
}

.product-gallery__dot--active {
  width: 10px;
  height: 10px;
  background: #3972f5;
}

.product-card {
  border-radius: 16px;
  background: #fff;
  border: 1px solid #f3f4f6;
  padding: 24px;
}

.product-card h2 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 18px;
  font-weight: 800;
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
  font-size: 34px;
  line-height: 1.2;
  font-weight: 900;
}

.product-card__head p {
  margin: 0;
  color: #3972f5;
  font-size: 36px;
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
  margin: 12px 0 0;
  color: rgba(15, 23, 42, 0.6);
  font-size: 14px;
  line-height: 1.7;
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
  background: #dcfce7;
  color: #00a63e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 2px;
}

.product-notice-html {
  margin-top: 16px;
  color: rgba(15, 23, 42, 0.65);
  font-size: 13px;
  line-height: 1.7;
}

.product-notice-html :deep(ol) {
  margin: 0;
  padding-left: 20px;
}

.product-notice-html :deep(li) {
  margin: 6px 0;
}

.product-notice-html :deep(p) {
  margin: 6px 0;
}

.product-review-list {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.product-review {
  border-radius: 12px;
  background: #f8fafc;
  padding: 14px;
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
  top: 112px;
}

.booking-card {
  border-radius: 14px;
  background: #fff;
  border: 1px solid #f3f4f6;
  padding: 18px;
}

.booking-card h2 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 22px;
  font-weight: 800;
}

.booking-field {
  margin-top: 18px;
}

.booking-field > p {
  margin: 0 0 10px;
  color: rgba(15, 23, 42, 0.86);
  font-size: 13px;
  font-weight: 700;
}

.booking-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.booking-option {
  height: 34px;
  border-radius: 10px;
  border: 2px solid #f1f5f9;
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.5);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.booking-option--active {
  border-color: #3972f5;
  color: #3972f5;
  background: #fff;
}

.booking-option--step {
  width: 34px;
  min-width: 34px;
  height: 34px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
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
  gap: 8px;
}

.booking-attach-item {
  border-radius: 12px;
  border: 2px solid #f1f5f9;
  background: #f8fafc;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.booking-attach-item__name {
  color: rgba(15, 23, 42, 0.82);
  font-size: 13px;
  font-weight: 700;
}

.booking-attach-item__stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.booking-card__empty {
  margin: 18px 0 0;
  color: rgba(15, 23, 42, 0.35);
  font-size: 12px;
}

.booking-summary {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.booking-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(15, 23, 42, 0.56);
  font-size: 14px;
}

.booking-summary__row strong {
  color: rgba(15, 23, 42, 0.86);
  font-size: 14px;
}

.booking-summary__row--tax span {
  color: #00a63e;
}

.booking-summary__row--total {
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.booking-summary__row--total span {
  color: rgba(15, 23, 42, 0.56);
  font-size: 18px;
  font-weight: 800;
}

.booking-summary__row--total strong {
  color: #3972f5;
  font-size: 24px;
  font-weight: 900;
}

.booking-submit {
  margin-top: 16px;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  border: 2px solid #3972f5;
  background: #3972f5;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .product-detail-layout {
    grid-template-columns: 1fr;
  }

  .booking-side {
    position: static;
  }
}

@media (max-width: 820px) {
  .product-detail-container {
    width: calc(100% - 32px);
  }

  .product-gallery {
    grid-template-columns: 1fr;
  }

  .product-gallery__thumbs {
    order: 2;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .product-gallery__thumb {
    width: 100%;
    height: 68px;
  }

  .product-gallery__hero img {
    height: 320px;
  }

  .product-check-list {
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
    font-size: 24px;
  }

  .product-card {
    padding: 18px;
  }

  .product-card__head {
    flex-direction: column;
    gap: 8px;
  }

  .product-card__head p {
    font-size: 26px;
  }
}
</style>
