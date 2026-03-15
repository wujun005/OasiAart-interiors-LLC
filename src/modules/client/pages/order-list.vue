<template>
  <div class="order-list-page">
    <section class="order-list-body">
      <div class="order-list-container">
        <header class="order-list-head">
          <div>
            <h1>{{ t('client.orderList.title') }}</h1>
            <p>{{ t('client.orderList.subtitle') }}</p>
          </div>

          <div class="order-list-search">
            <div class="order-list-search__input">
              <img :src="searchIconUrl" alt="" />
              <input
                v-model.trim="searchKeyword"
                type="text"
                :placeholder="t('client.orderList.searchPlaceholder')"
                @keyup.enter="onSearchNow"
              />
            </div>
            <button type="button" @click="onSearchNow">
              <img :src="filterIconUrl" alt="" />
            </button>
          </div>
        </header>

        <section class="order-status-tabs">
          <button
            v-for="item in statusTabs"
            :key="item.value"
            type="button"
            class="order-status-tab"
            :class="{ 'order-status-tab--active': selectedStatus === item.value }"
            @click="onStatusChange(item.value)"
          >
            {{ item.label }}
          </button>
        </section>

        <section class="order-list-content">
          <p v-if="isLoading" class="order-list-empty">{{ t('client.orderList.loading') }}</p>
          <p v-else-if="!orderCards.length" class="order-list-empty">{{ t('client.orderList.empty') }}</p>

          <template v-else>
            <article v-for="item in orderCards" :key="item.orderNo" class="order-card">
              <div class="order-card__image-wrap">
                <img class="order-card__image" :src="item.image" :alt="item.title" />
                <span class="order-card__badge">{{ item.statusText }}</span>
              </div>

              <div class="order-card__main">
                <div class="order-card__title-row">
                  <h3>{{ item.title }}</h3>
                  <strong>{{ item.amountText }}</strong>
                </div>

                <div class="order-card__meta-row">
                  <span>
                    <img :src="orderNoIconUrl" alt="" />
                    {{ t('client.orderList.orderNo') }}: {{ item.orderNo }}
                  </span>
                  <span>
                    <img :src="dateIconUrl" alt="" />
                    {{ item.dateText }}
                  </span>
                  <span>
                    <img :src="timeIconUrl" alt="" />
                    {{ item.timeText }}
                  </span>
                </div>

                <div class="order-card__address">
                  <img :src="addressIconUrl" alt="" />
                  {{ item.addressText }}
                </div>

                <div class="order-card__actions">
                  <button
                    v-if="!item.reviewed"
                    type="button"
                    class="order-card__btn order-card__btn--ghost"
                    @click="openReview(item.orderNo)"
                  >
                    {{ t('client.orderList.review') }}
                  </button>
                  <button
                    type="button"
                    class="order-card__btn order-card__btn--primary"
                    @click="goRebook(item)"
                  >
                    {{ t('client.orderList.rebook') }}
                  </button>
                </div>
              </div>
            </article>
          </template>
        </section>
      </div>
    </section>

    <el-dialog
      v-model="reviewDialogVisible"
      :title="t('client.orderList.reviewDialog.title')"
      width="520px"
      :close-on-click-modal="false"
      :show-close="!isReviewSubmitting"
    >
      <div class="order-review-form">
        <label class="order-review-form__field">
          <span>{{ t('client.orderList.reviewDialog.ratingLabel') }}</span>
          <el-rate v-model="reviewForm.rating" :max="5" />
        </label>
        <label class="order-review-form__field">
          <span>{{ t('client.orderList.reviewDialog.contentLabel') }}</span>
          <textarea
            v-model.trim="reviewForm.content"
            :placeholder="t('client.orderList.reviewDialog.contentPlaceholder')"
            :disabled="isReviewSubmitting"
          />
        </label>
      </div>
      <template #footer>
        <div class="order-review-form__footer">
          <button
            class="order-card__btn order-card__btn--ghost"
            type="button"
            :disabled="isReviewSubmitting"
            @click="reviewDialogVisible = false"
          >
            {{ t('client.orderList.reviewDialog.cancel') }}
          </button>
          <button
            class="order-card__btn order-card__btn--primary"
            type="button"
            :disabled="isReviewSubmitting"
            @click="submitReview"
          >
            {{ t('client.orderList.reviewDialog.submit') }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { getOrderList, type OrderListRecord, review } from '@/modules/client/api';

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
  dateText: string;
  timeText: string;
  addressText: string;
  statusText: string;
  image: string;
  reviewed: boolean;
  showActions: boolean;
  specSelections: RebookSpecSelection[];
  attachSelections: RebookAttachSelection[];
};

const searchIconUrl = new URL('@/assets/images/client/Icon (13).png', import.meta.url).href;
const filterIconUrl = new URL('@/assets/images/client/Icon (14).png', import.meta.url).href;
const orderNoIconUrl = new URL('@/assets/images/client/Icon (9).png', import.meta.url).href;
const dateIconUrl =  new URL('@/assets/images/client/Icon (10).png', import.meta.url).href;
const timeIconUrl = new URL('@/assets/images/client/Icon (11).png', import.meta.url).href;
const addressIconUrl = new URL('@/assets/images/client/Icon (12).png', import.meta.url).href;

const fallbackImages = [
  'https://www.figma.com/api/mcp/asset/9e6bc861-0df1-4513-8431-93f5aca90399',
  'https://www.figma.com/api/mcp/asset/8adbfc97-ffcd-46ea-9407-e1c1bd168703',
  'https://www.figma.com/api/mcp/asset/460655e7-1958-421f-919c-cfb4e1186670',
];

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const statusTabs = computed(() => [
  { label: t('client.orderList.statusAll'), value: '' },
  { label: t('client.orderList.statusInProgress'), value: '1' },
  { label: t('client.orderList.statusCompleted'), value: '2' },
  { label: t('client.orderList.statusCanceled'), value: '3' },
]);

const selectedStatus = ref('');
const searchKeyword = ref('');
const orderRecords = ref<OrderListRecord[]>([]);
const isLoading = ref(false);
const reviewDialogVisible = ref(false);
const isReviewSubmitting = ref(false);
const reviewForm = reactive({
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

const parseDateTime = (raw?: string) => {
  const text = String(raw || '').trim();
  if (!text) {
    return { date: '--', time: '--' };
  }
  if (text.includes('T')) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = `${date.getMonth() + 1}`.padStart(2, '0');
      const dd = `${date.getDate()}`.padStart(2, '0');
      const hh = `${date.getHours()}`.padStart(2, '0');
      const mi = `${date.getMinutes()}`.padStart(2, '0');
      return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${mi}`,
      };
    }
  }
  const [datePart = '', ...timeParts] = text.split(' ');
  return {
    date: datePart || text,
    time: timeParts.join(' ').trim() || '--',
  };
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
  if (
    normalized.includes('完成') ||
    normalized.includes('completed') ||
    normalized.includes('done')
  ) {
    return 2;
  }
  if (
    normalized.includes('取消') ||
    normalized.includes('cancel')
  ) {
    return 3;
  }
  return 0;
};

const getStatusTextByCode = (statusCode: 0 | 1 | 2 | 3, fallbackText: string) => {
  if (statusCode === 1) {
    return t('client.orderList.statusInProgress');
  }
  if (statusCode === 2) {
    return t('client.orderList.statusCompleted');
  }
  if (statusCode === 3) {
    return t('client.orderList.statusCanceled');
  }
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
      const title = pickI18nValue(item.spuNameI18n, String(item.spuName || '').trim() || t('client.orderList.unknownService'));
      const dateTime = parseDateTime(item.serviceDateTime);
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
        title,
        amountText: formatAmount(item.orderAmount),
        dateText: dateTime.date,
        timeText: dateTime.time,
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
    orderRecords.value = Array.isArray(result) ? result as OrderListRecord[] : [];
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
    name: 'product-detail',
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
  reviewForm.orderNo = normalizedOrderNo;
  reviewForm.rating = 5;
  reviewForm.content = '';
  reviewDialogVisible.value = true;
};

const submitReview = async () => {
  if (isReviewSubmitting.value) {
    return;
  }
  if (!reviewForm.orderNo) {
    ElMessage.warning(t('client.orderList.reviewDialog.orderNoMissing'));
    return;
  }
  if (!Number.isFinite(reviewForm.rating) || reviewForm.rating <= 0) {
    ElMessage.warning(t('client.orderList.reviewDialog.ratingRequired'));
    return;
  }
  const content = reviewForm.content.trim();
  if (!content) {
    ElMessage.warning(t('client.orderList.reviewDialog.contentRequired'));
    return;
  }

  isReviewSubmitting.value = true;
  try {
    await review({
      orderNo: reviewForm.orderNo,
      rating: Math.round(reviewForm.rating),
      content,
    });
    ElMessage.success(t('client.orderList.reviewDialog.submitSuccess'));
    reviewDialogVisible.value = false;
    void loadOrders();
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.orderList.reviewDialog.submitFailed'));
  } finally {
    isReviewSubmitting.value = false;
  }
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
.order-list-page {
  min-height: 100%;
  background: #f8fafc;
}

.order-list-body {
  padding: 48px 0 80px;
}

.order-list-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.order-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.order-list-head h1 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 26px;
  line-height: 1.2;
  font-weight: 900;
}

.order-list-head p {
  margin: 4px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
}

.order-list-search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-list-search__input {
  width: 256px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px 0 12px;
}

.order-list-search__input img {
  width: 18px;
  height: 18px;
}

.order-list-search__input input {
  width: 100%;
  border: 0;
  outline: 0;
  color: rgba(15, 23, 42, 0.86);
  font-size: 14px;
  background: transparent;
}

.order-list-search__input input::placeholder {
  color: rgba(15, 23, 42, 0.4);
}

.order-list-search button {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}

.order-list-search button img {
  width: 20px;
  height: 20px;
}

.order-status-tabs {
  margin-top: 30px;
  width: fit-content;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  background: #fff;
  padding: 5px;
  display: flex;
  gap: 4px;
}

.order-status-tab {
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 16px;
}

.order-status-tab--active {
  background: #3972f5;
  color: #fff;
}

.order-list-content {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-list-empty {
  margin: 0;
  padding: 36px 18px;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  background: #fff;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
}

.order-card {
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  background: #fff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 21px;
  display: grid;
  grid-template-columns: 192px minmax(0, 1fr);
  gap: 24px;
}

.order-card__image-wrap {
  width: 192px;
  height: 192px;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}

.order-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.order-card__badge {
  position: absolute;
  left: 8px;
  top: 8px;
  height: 24px;
  border-radius: 999px;
  background: #eff6ff;
  color: #3972f5;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
}

.order-card__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.order-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.order-card__title-row h3 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 20px;
  line-height: 1.2;
  font-weight: 800;
}

.order-card__title-row strong {
  color: #3972f5;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
  white-space: nowrap;
}

.order-card__meta-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}

.order-card__meta-row span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.order-card__meta-row span img {
  width: 16px;
  height: 16px;
}

.order-card__address {
  margin-top: 8px;
  min-height: 44px;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.order-card__address img {
  width: 16px;
  height: 16px;
}

.order-card__actions {
  margin-top: auto;
  padding-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.order-card__btn {
  height: 36px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
}

.order-card__btn--ghost {
  background: #fff;
  color: rgba(15, 23, 42, 0.65);
  border-color: #e5e7eb;
}

.order-card__btn--primary {
  background: #3972f5;
  color: #fff;
}

.order-review-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-review-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-review-form__field > span {
  color: rgba(15, 23, 42, 0.8);
  font-size: 14px;
  font-weight: 700;
}

.order-review-form__field textarea {
  min-height: 120px;
  resize: vertical;
  border: 1px solid #d1d5dc;
  border-radius: 10px;
  padding: 10px 12px;
  outline: 0;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.85);
}

.order-review-form__field textarea::placeholder {
  color: rgba(15, 23, 42, 0.4);
}

.order-review-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1024px) {
  .order-card {
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
  }

  .order-card__image-wrap {
    width: 140px;
    height: 140px;
  }

  .order-card__title-row h3,
  .order-card__title-row strong {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .order-list-body {
    padding: 28px 0 56px;
  }

  .order-list-container {
    width: min(1280px, calc(100% - 24px));
  }

  .order-list-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-list-search {
    width: 100%;
  }

  .order-list-search__input {
    width: 100%;
  }

  .order-status-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .order-card {
    grid-template-columns: 1fr;
  }

  .order-card__image-wrap {
    width: 100%;
    height: 180px;
  }

  .order-card__title-row {
    align-items: center;
  }

  .order-card__title-row h3 {
    font-size: 22px;
  }

  .order-card__title-row strong {
    font-size: 18px;
  }
}
</style>
