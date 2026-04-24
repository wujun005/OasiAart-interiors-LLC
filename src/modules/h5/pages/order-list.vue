<template>
  <div class="h5-orders-page">
    <header class="h5-orders-topbar">
      <h1>{{ t('client.orderList.title') }}</h1>
    </header>

    <main class="h5-orders-main">
      <section class="h5-orders-search">
        <van-icon name="search" />
        <input
          v-model.trim="searchKeyword"
          type="text"
          :placeholder="t('client.orderList.searchPlaceholder')"
          @keyup.enter="onSearchNow"
        />
      </section>

      <section class="h5-orders-tabs">
        <button
          v-for="item in statusTabs"
          :key="item.value"
          type="button"
          class="h5-orders-tab"
          :class="{ 'h5-orders-tab--active': selectedStatus === item.value }"
          @click="onStatusChange(item.value)"
        >
          {{ item.label }}
        </button>
      </section>

      <section class="h5-orders-list">
        <p v-if="isLoading" class="h5-orders-empty">{{ t('client.orderList.loading') }}</p>
        <p v-else-if="!orderCards.length" class="h5-orders-empty">{{ t('client.orderList.empty') }}</p>

        <article v-for="item in orderCards" :key="item.orderNo" class="h5-order-card">
          <header class="h5-order-card__head">
            <div class="h5-order-card__order-no">
              <van-icon name="label-o" />
              <span>{{ item.orderNo }}</span>
            </div>
            <span class="h5-order-card__badge" :class="badgeClassMap[item.statusCode]">
              {{ item.statusText }}
            </span>
          </header>

          <div class="h5-order-card__body">
            <img class="h5-order-card__image" :src="item.image" :alt="item.title" />
            <div class="h5-order-card__content">
              <div class="h5-order-card__title-row">
                <h3>{{ item.title }}</h3>
                <strong>{{ item.amountText }}</strong>
              </div>
              <div class="h5-order-card__meta">
                <span>
                  <van-icon name="calendar-o" />
                  {{ item.dateTimeText }}
                </span>
                <span>
                  <van-icon name="location-o" />
                  {{ item.addressText }}
                </span>
              </div>
              <div v-if="item.showActions" class="h5-order-card__actions">
                <button
                  v-if="!item.reviewed"
                  type="button"
                  class="h5-order-card__btn h5-order-card__btn--ghost"
                  @click="openReview(item.orderNo)"
                >
                  {{ t('client.orderList.review') }}
                </button>
                <button
                  type="button"
                  class="h5-order-card__btn h5-order-card__btn--primary"
                  @click="goRebook(item)"
                >
                  {{ t('client.orderList.rebook') }}
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>

    <nav class="h5-orders-tabbar">
      <button class="h5-orders-tabbar__item" type="button" @click="goHome">
        <van-icon name="home-o" />
        <span>{{ t('client.header.nav.home') }}</span>
      </button>
      <button class="h5-orders-tabbar__item h5-orders-tabbar__item--active" type="button">
        <van-icon name="orders-o" />
        <span>{{ t('client.header.nav.orders') }}</span>
      </button>
      <button class="h5-orders-tabbar__item" type="button" @click="goProfile">
        <van-icon name="contact-o" />
        <span>{{ t('client.header.profile') }}</span>
      </button>
    </nav>

    <van-popup v-model:show="reviewPopupVisible" round position="bottom" :style="{ minHeight: '34vh' }">
      <div class="h5-review-sheet">
        <div class="h5-review-sheet__header">
          <h3>{{ t('client.orderList.reviewDialog.title') }}</h3>
          <button type="button" :disabled="isReviewSubmitting" @click="reviewPopupVisible = false">
            <van-icon name="cross" />
          </button>
        </div>
        <div class="h5-review-sheet__field">
          <span>{{ t('client.orderList.reviewDialog.ratingLabel') }}</span>
          <van-rate v-model="reviewForm.rating" :max="5" />
        </div>
        <div class="h5-review-sheet__field">
          <span>{{ t('client.orderList.reviewDialog.contentLabel') }}</span>
          <textarea
            v-model.trim="reviewForm.content"
            :placeholder="t('client.orderList.reviewDialog.contentPlaceholder')"
            :disabled="isReviewSubmitting"
          />
        </div>
        <button class="h5-review-sheet__submit" type="button" :disabled="isReviewSubmitting" @click="submitReview">
          {{ isReviewSubmitting ? t('client.profile.actions.submitting') : t('client.orderList.reviewDialog.submit') }}
        </button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { getOrderList, review, type OrderListRecord } from '@/modules/client/api';

type I18nMap = Record<string, string>;

type RebookSpecSelection = {
  specTypeId: string;
  specValueId: string;
};

type RebookAttachSelection = {
  attachValueId: string;
  quantity: number;
};

type OrderCardView = {
  orderNo: string;
  spuId: string;
  statusCode: 0 | 1 | 2 | 3;
  title: string;
  amountText: string;
  dateTimeText: string;
  addressText: string;
  statusText: string;
  image: string;
  reviewed: boolean;
  showActions: boolean;
  specSelections: RebookSpecSelection[];
  attachSelections: RebookAttachSelection[];
};

const fallbackImages = [
  'https://www.figma.com/api/mcp/asset/db809cc9-6be7-4a8a-b172-c01ceb90c52d',
  'https://www.figma.com/api/mcp/asset/73059317-b96b-4536-a776-8bffc89f5dde',
  'https://www.figma.com/api/mcp/asset/126efaa5-90af-4a3b-957b-062383f10321',
];

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const statusTabs = computed(() => [
  { label: t('client.orderList.statusAll'), value: '' },
  { label: t('client.orderList.statusInProgress'), value: '1' },
  { label: t('client.orderList.statusCompleted'), value: '2' },
  { label: t('client.orderList.statusCanceled'), value: '3' },
]);

const badgeClassMap: Record<0 | 1 | 2 | 3, string> = {
  0: 'h5-order-card__badge--all',
  1: 'h5-order-card__badge--progress',
  2: 'h5-order-card__badge--done',
  3: 'h5-order-card__badge--cancel',
};

const selectedStatus = ref('');
const searchKeyword = ref('');
const orderRecords = ref<OrderListRecord[]>([]);
const isLoading = ref(false);
const reviewPopupVisible = ref(false);
const isReviewSubmitting = ref(false);
const reviewForm = ref({
  orderNo: '',
  rating: 5,
  content: '',
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const preferredLangs = computed(() =>
  locale.value.startsWith('zh')
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'],
);

const pickI18nValue = (data?: I18nMap, fallback = '') => {
  const valueMap = data || {};
  for (const lang of preferredLangs.value) {
    const value = valueMap[lang];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const firstValue = Object.values(valueMap).find((value) => typeof value === 'string' && value.trim());
  return typeof firstValue === 'string' ? firstValue.trim() : fallback;
};

const formatAmount = (value?: number | string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0 AED';
  }
  const text = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
  return `${text} AED`;
};

const formatDateTimeText = (raw?: string) => {
  const text = String(raw || '').trim();
  if (!text) {
    return '--';
  }
  if (text.includes('T')) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = `${date.getMonth() + 1}`.padStart(2, '0');
      const dd = `${date.getDate()}`.padStart(2, '0');
      const hh = `${date.getHours()}`.padStart(2, '0');
      const mi = `${date.getMinutes()}`.padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    }
  }
  return text;
};

const normalizeStatusText = (record: OrderListRecord) =>
  pickI18nValue(record.statusNameI18n, record.statusName || t('client.orderList.statusUnknown'));

const getStatusCode = (record: OrderListRecord): 0 | 1 | 2 | 3 => {
  const code = Number(record.status);
  if (code === 1 || code === 2 || code === 3) {
    return code;
  }
  const normalized = normalizeStatusText(record).toLowerCase();
  if (
    normalized.includes('进行') ||
    normalized.includes('待服务') ||
    normalized.includes('in progress') ||
    normalized.includes('pending') ||
    normalized.includes('serving')
  ) {
    return 1;
  }
  if (normalized.includes('完成') || normalized.includes('completed') || normalized.includes('done')) {
    return 2;
  }
  if (normalized.includes('取消') || normalized.includes('cancel')) {
    return 3;
  }
  return 0;
};

const getStatusTextByCode = (statusCode: 0 | 1 | 2 | 3, fallbackText: string) => {
  if (statusCode === 1) return t('client.orderList.statusInProgress');
  if (statusCode === 2) return t('client.orderList.statusCompleted');
  if (statusCode === 3) return t('client.orderList.statusCanceled');
  return fallbackText || t('client.orderList.statusUnknown');
};

const isCompletedStatus = (statusCode: 0 | 1 | 2 | 3) => statusCode === 2;

const matchesSelectedStatus = (statusCode: 0 | 1 | 2 | 3) => {
  if (!selectedStatus.value) {
    return true;
  }
  return String(statusCode) === selectedStatus.value;
};

const orderCards = computed<OrderCardView[]>(() =>
  (orderRecords.value || [])
    .map((item, index) => {
      const statusCode = getStatusCode(item);
      const statusText = getStatusTextByCode(statusCode, normalizeStatusText(item));
      const specSelections = Array.isArray(item.specSelections)
        ? item.specSelections
            .map((selection) => ({
              specTypeId: String(selection.specTypeId ?? '').trim(),
              specValueId: String(selection.specValueId ?? '').trim(),
            }))
            .filter((selection) => selection.specTypeId && selection.specValueId)
        : [];
      const attachSelections = Array.isArray(item.attachSelections)
        ? item.attachSelections
            .map((selection) => ({
              attachValueId: String(selection.attachValueId ?? '').trim(),
              quantity: Math.max(0, Number(selection.quantity ?? 0) || 0),
            }))
            .filter((selection) => selection.attachValueId && selection.quantity > 0)
        : [];
      return {
        orderNo: String(item.orderNo || `order-${index + 1}`),
        spuId: String(item.spuId ?? ''),
        statusCode,
        title: pickI18nValue(item.spuNameI18n, String(item.spuName || '').trim() || t('client.orderList.unknownService')),
        amountText: formatAmount(item.orderAmount),
        dateTimeText: formatDateTimeText(item.serviceDateTime),
        addressText: String(item.serviceAddress || '').trim() || t('client.orderList.emptyAddress'),
        statusText,
        image: item.spuImage || fallbackImages[index % fallbackImages.length],
        reviewed: item.reviewed === true,
        showActions: isCompletedStatus(statusCode),
        specSelections,
        attachSelections,
      };
    })
    .filter((item) => matchesSelectedStatus(item.statusCode)),
);

const loadOrders = async () => {
  isLoading.value = true;
  try {
    const result = await getOrderList({
      status: selectedStatus.value ? Number(selectedStatus.value) : undefined,
      keyWord: searchKeyword.value || undefined,
    });
    orderRecords.value = Array.isArray(result) ? (result as OrderListRecord[]) : [];
  } catch (error) {
    console.error('load order list failed:', error);
    orderRecords.value = [];
  } finally {
    isLoading.value = false;
  }
};

const onStatusChange = (nextStatus: string) => {
  selectedStatus.value = nextStatus;
};

const onSearchNow = () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  void loadOrders();
};

const goRebook = (item: OrderCardView) => {
  if (!item.spuId) {
    return;
  }
  router.push({
    name: 'h5-product-detail',
    params: { spuId: item.spuId },
    query: {
      specSelections: JSON.stringify(item.specSelections),
      attachSelections: JSON.stringify(item.attachSelections),
    },
  });
};

const openReview = (orderNo: string) => {
  const normalizedOrderNo = String(orderNo || '').trim();
  if (!normalizedOrderNo) {
    return;
  }
  reviewForm.value = {
    orderNo: normalizedOrderNo,
    rating: 5,
    content: '',
  };
  reviewPopupVisible.value = true;
};

const submitReview = async () => {
  if (isReviewSubmitting.value) {
    return;
  }
  if (!reviewForm.value.orderNo) {
    showFailToast(t('client.orderList.reviewDialog.orderNoMissing'));
    return;
  }
  if (!Number.isFinite(reviewForm.value.rating) || reviewForm.value.rating <= 0) {
    showFailToast(t('client.orderList.reviewDialog.ratingRequired'));
    return;
  }
  const content = reviewForm.value.content.trim();
  if (!content) {
    showFailToast(t('client.orderList.reviewDialog.contentRequired'));
    return;
  }

  isReviewSubmitting.value = true;
  try {
    await review({
      orderNo: reviewForm.value.orderNo,
      rating: Math.round(reviewForm.value.rating),
      content,
    });
    showSuccessToast(t('client.orderList.reviewDialog.submitSuccess'));
    reviewPopupVisible.value = false;
    void loadOrders();
  } catch (error: any) {
    showFailToast(error?.message || t('client.orderList.reviewDialog.submitFailed'));
  } finally {
    isReviewSubmitting.value = false;
  }
};

const goHome = () => {
  router.push({ name: 'h5-home' });
};

const goProfile = () => {
  router.push({ name: 'h5-profile' });
};

watch(
  () => selectedStatus.value,
  () => {
    void loadOrders();
  },
  { immediate: true },
);

watch(
  () => searchKeyword.value,
  () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(() => {
      void loadOrders();
    }, 300);
  },
);

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
});
</script>

<style scoped lang="scss">
.h5-orders-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
}

.h5-orders-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #f3f4f6;
}

.h5-orders-topbar h1 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
}

.h5-orders-main {
  padding: 12px 16px 24px;
}

.h5-orders-search {
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
}

.h5-orders-search :deep(.van-icon) {
  color: rgba(10, 10, 10, 0.5);
  font-size: 18px;
}

.h5-orders-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(15, 23, 42, 0.88);
  font-size: 14px;
}

.h5-orders-search input::placeholder {
  color: rgba(10, 10, 10, 0.5);
}

.h5-orders-tabs {
  margin-top: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  background: #fff;
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
}

.h5-orders-tab {
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  font-weight: 700;
}

.h5-orders-tab--active {
  background: #12B0FF;
  color: #fff;
}

.h5-orders-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.h5-orders-empty {
  margin: 0;
  padding: 28px 18px;
  border-radius: 14px;
  border: 1px solid #f3f4f6;
  background: #fff;
  color: rgba(15, 23, 42, 0.5);
  font-size: 13px;
  text-align: center;
}

.h5-order-card {
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  background: #fff;
  padding: 12px 14px;
}

.h5-order-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-order-card__order-no {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(15, 23, 42, 0.6);
  font-size: 12px;
  font-weight: 700;
}

.h5-order-card__order-no :deep(.van-icon) {
  font-size: 16px;
}

.h5-order-card__badge {
  min-width: 54px;
  height: 19px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 700;
}

.h5-order-card__badge--all,
.h5-order-card__badge--cancel {
  background: #f1f5f9;
  color: rgba(15, 23, 42, 0.5);
}

.h5-order-card__badge--progress {
  background: #eff6ff;
  color: #12B0FF;
}

.h5-order-card__badge--done {
  background: #f0fdf4;
  color: #00a63e;
}

.h5-order-card__body {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.h5-order-card__image {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.h5-order-card__content {
  flex: 1;
  min-width: 0;
}

.h5-order-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.h5-order-card__title-row h3 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  line-height: 1.5;
  font-weight: 700;
}

.h5-order-card__title-row strong {
  white-space: nowrap;
  color: #12B0FF;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 900;
}

.h5-order-card__meta {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(15, 23, 42, 0.5);
  font-size: 11px;
}

.h5-order-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.h5-order-card__meta :deep(.van-icon) {
  font-size: 12px;
}

.h5-order-card__actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.h5-order-card__btn {
  min-width: 46px;
  height: 24px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  padding: 0 10px;
}

.h5-order-card__btn--ghost {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: rgba(15, 23, 42, 0.6);
}

.h5-order-card__btn--primary {
  border: 0;
  background: #12B0FF;
  color: #fff;
}

.h5-orders-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 24;
  height: calc(56px + env(safe-area-inset-bottom));
  padding: 0 24px env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #f3f4f6;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h5-orders-tabbar__item {
  width: 64px;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #99a1af;
  font-size: 10px;
}

.h5-orders-tabbar__item :deep(.van-icon) {
  font-size: 24px;
}

.h5-orders-tabbar__item--active {
  color: #12B0FF;
}

.h5-review-sheet {
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
}

.h5-review-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h5-review-sheet__header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
}

.h5-review-sheet__header button {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 18px;
}

.h5-review-sheet__field {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.h5-review-sheet__field span {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.h5-review-sheet__field textarea {
  width: 100%;
  min-height: 110px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  outline: 0;
  background: #fff;
  color: #0f172a;
  font-size: 13px;
  resize: vertical;
}

.h5-review-sheet__submit {
  margin-top: 18px;
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: #12B0FF;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.h5-review-sheet__submit:disabled {
  opacity: 0.7;
}
</style>
