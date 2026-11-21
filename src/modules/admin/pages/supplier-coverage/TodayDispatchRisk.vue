<template>
  <section v-if="canViewOrders" class="dispatch-risk" aria-labelledby="dispatch-risk-title" :aria-busy="loading">
    <header class="dispatch-risk__head">
      <div>
        <h2 id="dispatch-risk-title">{{ t('admin.coverage.dispatchRisk.title') }}</h2>
        <p>{{ date }} · {{ t('admin.coverage.dispatchRisk.timezone') }}</p>
        <p>{{ t('admin.coverage.dispatchRisk.scope') }}</p>
      </div>
      <a :href="ordersHref()" target="_blank" rel="noopener noreferrer">
        {{ t('admin.coverage.dispatchRisk.viewOrders') }} <span aria-hidden="true">↗</span>
      </a>
    </header>

    <p v-if="loading" class="dispatch-risk__notice" role="status">{{ t('admin.coverage.dispatchRisk.loading') }}</p>
    <p v-else-if="failed" class="dispatch-risk__notice is-warning" role="status">
      {{ t('admin.coverage.dispatchRisk.failed') }}
      <button type="button" @click="load">{{ t('admin.coverage.dispatchRisk.retry') }}</button>
    </p>
    <template v-else-if="snapshot">
      <dl v-if="snapshot.complete || snapshot.checked" class="dispatch-risk__counts">
        <div v-for="status in statuses" :key="status" :class="{ 'has-risk': snapshot.counts[status] > 0 }">
          <dt>{{ t(`admin.coverage.dispatchRisk.${status}`) }}</dt>
          <dd>{{ numberFormat.format(snapshot.counts[status]) }}</dd>
        </div>
      </dl>
      <p v-if="!snapshot.complete" class="dispatch-risk__notice is-warning" role="status">
        {{ t('admin.coverage.dispatchRisk.partial', {
          checked: numberFormat.format(snapshot.checked), total: numberFormat.format(snapshot.total),
        }) }}
        <button type="button" @click="load">{{ t('admin.coverage.dispatchRisk.retry') }}</button>
      </p>
      <ol v-if="previewOrders.length" class="dispatch-risk__list">
        <li v-for="order in previewOrders" :key="order.orderId">
          <div class="dispatch-risk__order">
            <a v-if="order.orderNo" :href="ordersHref(order.orderNo)" target="_blank" rel="noopener noreferrer">
              {{ order.orderNo }}
            </a>
            <span>{{ productName(order) }}</span>
          </div>
          <time :datetime="date">{{ serviceSlot(order.serviceTime) }}</time>
          <span class="dispatch-risk__status" :class="`is-${order.status}`">
            {{ t(`admin.coverage.dispatchRisk.${order.status}`) }}
          </span>
        </li>
      </ol>
      <p v-else-if="snapshot.complete" class="dispatch-risk__notice" role="status">
        {{ t('admin.coverage.dispatchRisk.empty') }}
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { page as fetchOrderPage } from '@/modules/admin/api/order';
import { resolveAllowedAdminPath } from '@/modules/admin/utils/menuPermission';
import { dubaiDateKey } from '@/modules/admin/utils/staffBoard';
import { loadDispatchRisk, type DispatchRiskOrder } from './dispatchRisk';
import { adminHref } from './links';

const props = withDefaults(defineProps<{ refreshToken?: string | number; previewLimit?: number }>(), {
  previewLimit: 3,
});
const statuses = ['unassigned', 'awaiting'] as const;
const ordersPath = '/admin/orders';
const { t, locale } = useI18n();
const router = useRouter();
const canViewOrders = computed(() => resolveAllowedAdminPath(ordersPath) === ordersPath);
const date = ref(dubaiDateKey());
const snapshot = shallowRef<Awaited<ReturnType<typeof loadDispatchRisk>>>(null);
const loading = ref(false);
const failed = ref(false);
const numberFormat = computed(() => new Intl.NumberFormat(locale.value));
const previewOrders = computed(() => snapshot.value?.orders.slice(0, props.previewLimit) ?? []);
let requestId = 0;

function ordersHref(orderNo?: string) {
  return adminHref(router, ordersPath, {
    coverageDispatchDate: date.value,
    ...(orderNo ? { orderNo } : {}),
  });
}

function productName(order: DispatchRiskOrder) {
  return order.productNameI18n[locale.value] || order.productNameI18n[locale.value.split('-')[0] || ''] || order.productName;
}

function serviceSlot(value: string) {
  return value.replace(/^\d{4}-\d{2}-\d{2}[ T]?/, '').trim() || '—';
}

async function load() {
  const id = ++requestId;
  snapshot.value = null;
  failed.value = false;
  loading.value = canViewOrders.value;
  if (!canViewOrders.value) return;
  date.value = dubaiDateKey();
  const isCurrent = () => id === requestId && canViewOrders.value;
  try {
    const result = await loadDispatchRisk(fetchOrderPage, date.value, isCurrent);
    if (isCurrent()) snapshot.value = result;
  } catch {
    if (isCurrent()) failed.value = true;
  } finally {
    if (isCurrent()) loading.value = false;
  }
}

watch([canViewOrders, () => props.refreshToken], load, { immediate: true });
onBeforeUnmount(() => { requestId++; });
</script>

<style scoped>
.dispatch-risk {
  min-width: 0;
  padding: 16px 18px;
  color: var(--hx-ink, #0a1d33);
  background: #fff;
  border: 1px solid var(--hx-line, #e5dccf);
  border-radius: 14px;
}

.dispatch-risk__head,
.dispatch-risk__list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 7px 14px;
}

.dispatch-risk__head h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.dispatch-risk__head p,
.dispatch-risk__notice {
  margin: 3px 0 0;
  color: #556575;
  font-size: 12px;
  line-height: 1.55;
}

.dispatch-risk a,
.dispatch-risk__notice button {
  padding: 0;
  color: var(--el-color-primary, #0a2946);
  font: inherit;
  font-weight: 650;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.dispatch-risk__head a,
.dispatch-risk__notice button {
  font-size: 12px;
}

.dispatch-risk__notice button {
  margin-inline-start: 6px;
  border: 0;
  background: none;
  text-decoration-line: underline;
  cursor: pointer;
}

.dispatch-risk__counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin: 12px 0 0;
}

.dispatch-risk__counts div {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 9px;
  color: #45556a;
  background: #f3f5f6;
  border-radius: 6px;
  font-size: 12px;
}

.dispatch-risk__counts .has-risk,
.dispatch-risk__status.is-unassigned {
  color: #794715;
  background: #f8efdf;
}

.dispatch-risk__counts dd {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.dispatch-risk__notice {
  margin-top: 9px;
}

.dispatch-risk__notice.is-warning {
  color: #794715;
}

.dispatch-risk__list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
}

.dispatch-risk__list li {
  padding: 7px 0;
  border-top: 1px solid #eeeae3;
}

.dispatch-risk__list li:last-child {
  padding-bottom: 0;
}

.dispatch-risk__order {
  display: flex;
  flex: 1 1 220px;
  flex-wrap: wrap;
  gap: 3px 8px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.dispatch-risk__list time,
.dispatch-risk__order span {
  color: #556575;
}

.dispatch-risk__status {
  padding: 2px 6px;
  color: #274d72;
  background: #edf3f7;
  border-radius: 5px;
  white-space: nowrap;
}
</style>
