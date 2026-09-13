<template>
  <div class="cart-page">
    <div class="cart-container">
      <header class="cart-page__header">
        <div>
          <h1>{{ t('client.cart.title') }}</h1>
          <p>{{ t('client.cart.subtitle') }}</p>
        </div>
        <RouterLink class="cart-page__browse" :to="{ path: '/', hash: '#services' }">
          {{ t('client.cart.browseServices') }}
          <el-icon><ArrowRight /></el-icon>
        </RouterLink>
      </header>

      <template v-if="items.length">
        <section class="cart-card">
          <div class="cart-card__topbar">
            <div class="cart-card__tabs">
              <button class="cart-tab cart-tab--active" type="button">
                {{ t('client.cart.allItems') }}
                <span>{{ items.length }}</span>
              </button>
            </div>
            <p>{{ isLoading ? (locale === 'zh' ? '正在同步购物车…' : 'Syncing cart…') : (locale === 'zh' ? '购物车项目保留 20 分钟' : 'Cart items are reserved for 20 minutes') }}</p>
          </div>

          <div class="cart-group">
            <div class="cart-group__heading">
              <el-checkbox
                :model-value="allSelected"
                :indeterminate="partiallySelected"
                @change="handleSelectAll"
              />
              <span class="cart-group__mark">H</span>
              <strong>{{ t('client.cart.storeName') }}</strong>
              <span>{{ t('client.cart.storeDesc') }}</span>
            </div>

            <div class="cart-table-head" aria-hidden="true">
              <span>{{ t('client.cart.columns.service') }}</span>
              <span>{{ t('client.cart.columns.unitPrice') }}</span>
              <span>{{ t('client.cart.columns.actions') }}</span>
            </div>

            <article v-for="item in items" :key="item.id" class="cart-item" :class="{ 'is-selected': item.selected }">
              <div class="cart-item__select">
                <el-checkbox
                  :model-value="item.selected"
                  :aria-label="t('client.cart.selectItem', { name: itemTitle(item) })"
                  @change="(value) => setSelected(item.id, Boolean(value))"
                />
              </div>

              <div class="cart-item__service">
                <RouterLink class="cart-item__image" :to="item.detailPath || { path: '/', hash: '#services' }">
                  <img :src="item.image || fallbackImage" :alt="itemTitle(item)" />
                </RouterLink>
                <div class="cart-item__content">
                  <span class="cart-item__category">{{ itemCategory(item) }}</span>
                  <RouterLink class="cart-item__title" :to="item.detailPath || { path: '/', hash: '#services' }">
                    {{ itemTitle(item) }}
                  </RouterLink>
                  <p v-if="itemSpec(item)" class="cart-item__spec">{{ itemSpec(item) }}</p>
                  <div v-if="itemAddOns(item).length" class="cart-item__addons">
                    <span v-for="addon in itemAddOns(item)" :key="addon">{{ addon }}</span>
                  </div>
                  <p class="cart-item__schedule">
                    {{ itemSchedule(item) || t('client.cart.scheduleAtCheckout') }}
                  </p>
                </div>
              </div>

              <div class="cart-item__price" :data-label="t('client.cart.columns.unitPrice')">
                {{ formatAed(item.unitPrice) }}
              </div>

              <div class="cart-item__actions">
                <RouterLink :to="item.detailPath || { path: '/', hash: '#services' }">
                  {{ t('client.cart.edit') }}
                </RouterLink>
                <button type="button" @click="confirmRemove([item.id])">
                  {{ t('client.cart.remove') }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="cart-summary">
          <div class="cart-summary__bulk">
            <el-checkbox
              :model-value="allSelected"
              :indeterminate="partiallySelected"
              @change="handleSelectAll"
            >
              {{ t('client.cart.selectAll') }}
            </el-checkbox>
            <button type="button" :disabled="!selectedLineCount" @click="confirmRemove(selectedIds)">
              {{ t('client.cart.removeSelected') }}
            </button>
          </div>

          <div class="cart-summary__prices">
            <div>
              <span>{{ t('client.cart.selectedCount', { count: selectedCount }) }}</span>
              <p>
                {{ t('client.cart.estimatedTotal') }}
                <strong>{{ formatAed(total) }}</strong>
              </p>
              <small>{{ t('client.cart.vatIncludedPreview') }}</small>
            </div>
            <button type="button" :disabled="!selectedLineCount" @click="openCheckout">
              {{ t('client.cart.checkout') }}
              <span>{{ formatAed(total) }}</span>
            </button>
          </div>
        </section>
      </template>

      <section v-else class="cart-empty">
        <span class="cart-empty__icon"><el-icon><ShoppingCart /></el-icon></span>
        <h2>{{ t('client.cart.empty.title') }}</h2>
        <p>{{ t('client.cart.empty.desc') }}</p>
        <div><RouterLink :to="{ path: '/', hash: '#services' }">{{ t('client.cart.browseServices') }}</RouterLink></div>
      </section>
    </div>

    <el-dialog
      v-model="checkoutVisible"
      class="cart-checkout-dialog"
      :title="t('client.cart.checkoutDialog.title')"
      width="min(560px, calc(100vw - 28px))"
    >
      <div class="checkout-dialog__scroll">
      <p class="checkout-dialog__intro">{{ t('client.cart.checkoutDialog.desc') }}</p>
      <div class="checkout-dialog__items">
        <div v-for="item in selectedItems" :key="item.id">
          <span>{{ itemTitle(item) }}</span>
          <strong>{{ formatAed(item.unitPrice) }}</strong>
        </div>
      </div>
      <dl class="checkout-dialog__total">
        <div>
          <dt>{{ t('client.cart.estimatedTotal') }}</dt>
          <dd>{{ formatAed(total) }}</dd>
        </div>
      </dl>
      <BookingPolicyDetails
        class="checkout-dialog__policy"
        compact
        show-intro
        :agreed="checkoutPolicyAgreed"
        @update:agreed="checkoutPolicyAgreed = $event"
        @read-policy="openLegal('terms')"
      />
      </div>
      <template #footer>
        <button class="dialog-secondary" type="button" @click="checkoutVisible = false">
          {{ t('client.cart.checkoutDialog.cancel') }}
        </button>
        <button class="dialog-primary" type="button" :disabled="!checkoutPolicyAgreed || isCheckingOut" @click="confirmCheckout">
          {{ t('client.cart.checkoutDialog.confirm') }}
        </button>
      </template>
    </el-dialog>
    <StripePaymentModal
      :visible="stripeVisible"
      :client-secret="stripeClientSecret"
      :locale="locale"
      @close="stripeVisible = false"
      @error="handleStripeError"
      @paid="handlePaymentSuccess"
    />
    <AgreementDialog v-model="legalDialogVisible" :doc-type="legalDocType" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowRight, ShoppingCart } from '@element-plus/icons-vue';
import fallbackImage from '@/assets/images/client/kv.png';
import { useCart, type CartItem, type CartLocalizedText } from '@/modules/client/composables/useCart';
import { checkoutCart } from '@/modules/client/api';
import StripePaymentModal from '@/modules/client/components/StripePaymentModal.vue';
import AgreementDialog from '@/modules/client/components/agreement-dialog.vue';
import BookingPolicyDetails from '@/modules/client/components/booking-policy-details.vue';
import type { LegalDocType } from '@/modules/client/constants/legal';
import { clearStoredAuthState, getStoredAuthSnapshot } from '@/utils/auth-state';
import { formatServiceSchedule } from '@/modules/client/utils/order-date-time';

const { t, locale } = useI18n({ useScope: 'global' });
const checkoutVisible = ref(false);
const checkoutPolicyAgreed = ref(false);
const isCheckingOut = ref(false);
const stripeVisible = ref(false);
const stripeClientSecret = ref('');
const legalDialogVisible = ref(false);
const legalDocType = ref<LegalDocType>('terms');
const checkoutSummary = ref({ orderNo: '', orderId: '', service: '', scheduled: '', amount: '' });
const router = useRouter();
const route = useRoute();
const {
  items,
  selectedItems,
  selectedCount,
  selectedLineCount,
  allSelected,
  partiallySelected,
  total,
  isLoading,
  refreshCart,
  clearCart,
  setSelected,
  setAllSelected,
  removeItems,
} = useCart();

const selectedIds = computed(() => selectedItems.value.map((item) => item.id));

const pickLocalizedText = (value?: CartLocalizedText, fallback = '') => {
  const source = value || {};
  const preferred = locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];
  for (const lang of preferred) {
    const text = source[lang];
    if (typeof text === 'string' && text.trim()) return text.trim();
  }
  return Object.values(source).find((text) => typeof text === 'string' && text.trim()) || fallback;
};

const itemTitle = (item: CartItem) => pickLocalizedText(
  item.titleI18n,
  t('client.cart.unnamedService'),
);

const itemCategory = (item: CartItem) => pickLocalizedText(
  item.categoryI18n,
  t('client.cart.storeName'),
);

const itemSpec = (item: CartItem) => pickLocalizedText(item.specSummaryI18n, item.specSummary || '');
const itemSchedule = (item: CartItem) => item.serviceTimeDisplay || formatServiceSchedule(
  item.serviceDateTime,
  locale.value,
  '',
);

const itemAddOns = (item: CartItem) => {
  if (item.addOnsI18n?.length) {
    return item.addOnsI18n.map((entry) => pickLocalizedText(entry)).filter(Boolean);
  }
  return item.addOns || [];
};

const formatAed = (value: number) => `AED ${Number(value || 0).toFixed(2)}`;

const handleSelectAll = (value: string | number | boolean) => {
  setAllSelected(Boolean(value));
};

const confirmRemove = async (ids: string[]) => {
  if (!ids.length) return;
  try {
    await ElMessageBox.confirm(
      t('client.cart.removeConfirm.message', { count: ids.length }),
      t('client.cart.removeConfirm.title'),
      {
        confirmButtonText: t('client.cart.removeConfirm.confirm'),
        cancelButtonText: t('client.cart.removeConfirm.cancel'),
        type: 'warning',
      },
    );
    await removeItems(ids);
    ElMessage.success(t('client.cart.removeSuccess'));
  } catch {
    // The user cancelled the removal.
  }
};

const ensureLogin = async () => {
  const snapshot = getStoredAuthSnapshot();
  if (snapshot.isExpired) clearStoredAuthState();
  if (snapshot.isLoggedIn) return true;
  await router.push({ name: 'login', query: { redirect: route.fullPath } });
  return false;
};

const openCheckout = async () => {
  if (!(await ensureLogin())) return;
  checkoutPolicyAgreed.value = false;
  checkoutVisible.value = true;
};

const openLegal = (docType: LegalDocType) => {
  legalDocType.value = docType;
  legalDialogVisible.value = true;
};

const confirmCheckout = async () => {
  if (!checkoutPolicyAgreed.value || isCheckingOut.value) return;
  isCheckingOut.value = true;
  try {
    const result = await checkoutCart(selectedIds.value, 'STRIPE', window.location.href);
    const payment = result?.payment;
    checkoutSummary.value = {
      orderNo: (result?.orderNos || []).join(', '),
      orderId: (result?.orderIds || []).join(', '),
      service: selectedItems.value.length === 1 && selectedItems.value[0]
        ? itemTitle(selectedItems.value[0])
        : (locale.value === 'zh' ? `${selectedItems.value.length} 项家居服务` : `${selectedItems.value.length} home services`),
      scheduled: selectedItems.value.length === 1 ? itemSchedule(selectedItems.value[0]!) : '',
      amount: String(result?.totalAmount || total.value || ''),
    };
    const approvalUrl = String(payment?.approvalUrl || '').trim();
    const clientSecret = String(payment?.clientSecret || '').trim();
    if (approvalUrl) {
      window.location.href = approvalUrl;
      return;
    }
    if (!clientSecret) throw new Error(locale.value === 'zh' ? '未获取到支付参数' : 'Missing payment parameters');
    checkoutVisible.value = false;
    stripeClientSecret.value = clientSecret;
    stripeVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || (locale.value === 'zh' ? '购物车结算失败' : 'Cart checkout failed'));
  } finally {
    isCheckingOut.value = false;
  }
};

const handleStripeError = (message: string) => ElMessage.error(message);
const handlePaymentSuccess = async () => {
  stripeVisible.value = false;
  void clearCart().catch((error) => {
    console.warn('Payment succeeded but clearing the cart failed:', error);
  });
  ElMessage.success(locale.value === 'zh' ? '支付成功' : 'Payment successful');
  window.setTimeout(() => void router.push({ name: 'booking-success', query: checkoutSummary.value }), 2000);
};

onMounted(() => void refreshCart());
</script>

<style scoped lang="scss">
.cart-page {
  min-height: calc(100vh - 96px);
  padding: 38px 24px 76px;
  background: #f4f7fb;
  color: #05152b;
}

.cart-container {
  width: min(1240px, 100%);
  margin: 0 auto;
}

.cart-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.cart-page__header h1 {
  margin: 7px 0 8px;
  font-size: clamp(30px, 4vw, 44px);
  line-height: 1.1;
}

.cart-page__header p {
  margin: 0;
  color: #718095;
  font-size: 15px;
}

.cart-page__browse {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 0;
  color: #1769c2;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
}

.cart-card {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 14px 38px rgb(5 21 43 / 7%);
}

.cart-card__topbar {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 24px;
  border-bottom: 1px solid #e8edf3;
}

.cart-card__topbar p {
  margin: 0;
  color: #8a96a7;
  font-size: 12px;
}

.cart-tab {
  position: relative;
  height: 64px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: #05152b;
  font: inherit;
  font-size: 16px;
  font-weight: 900;
}

.cart-tab::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 99px 99px 0 0;
  background: #1769c2;
  content: '';
}

.cart-tab span {
  margin-left: 5px;
  color: #1769c2;
}

.cart-group {
  padding: 0 24px 20px;
}

.cart-group__heading {
  display: flex;
  min-height: 60px;
  align-items: center;
  gap: 10px;
}

.cart-group__heading strong {
  font-size: 15px;
}

.cart-group__heading > span:last-child {
  color: #8b96a7;
  font-size: 12px;
}

.cart-group__mark {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #05152b;
  color: #fff;
  font-size: 13px;
  font-weight: 900;
}

.cart-table-head,
.cart-item {
  display: grid;
  grid-template-columns: minmax(420px, 1fr) 150px 90px;
  gap: 18px;
  align-items: center;
}

.cart-table-head {
  min-height: 42px;
  margin-left: 42px;
  padding: 0 18px;
  border-radius: 10px;
  background: #f7f9fc;
  color: #7d899a;
  font-size: 12px;
  font-weight: 700;
}

.cart-table-head span:not(:first-child) {
  text-align: center;
}

.cart-item {
  position: relative;
  margin-top: 12px;
  padding: 18px 18px 18px 60px;
  border: 1px solid #e6ebf2;
  border-radius: 16px;
  background: #fff;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.cart-item.is-selected {
  border-color: #c9dcf3;
  background: #fafdff;
  box-shadow: 0 8px 22px rgb(23 105 194 / 6%);
}

.cart-item__select {
  position: absolute;
  top: 50%;
  left: 18px;
  transform: translateY(-50%);
}

.cart-item__service {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 16px;
}

.cart-item__image {
  display: block;
  width: 118px;
  height: 104px;
  flex: 0 0 118px;
  overflow: hidden;
  border-radius: 13px;
  background: #eaf0f7;
}

.cart-item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.cart-item__image:hover img {
  transform: scale(1.04);
}

.cart-item__content {
  min-width: 0;
}

.cart-item__category {
  display: inline-block;
  margin-bottom: 5px;
  color: #1769c2;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cart-item__title {
  display: block;
  color: #05152b;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.45;
  text-decoration: none;
}

.cart-item__title:hover {
  color: #1769c2;
}

.cart-item__spec,
.cart-item__schedule {
  margin: 6px 0 0;
  color: #69778b;
  font-size: 12px;
  line-height: 1.45;
}

.cart-item__schedule {
  color: #9a7a31;
}

.cart-item__addons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.cart-item__addons span {
  padding: 4px 7px;
  border-radius: 6px;
  background: #eef3f8;
  color: #536277;
  font-size: 11px;
}

.cart-item__price {
  text-align: center;
  color: #1769c2;
  font-size: 15px;
  font-weight: 800;
}

.cart-item__actions {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
}

.cart-item__actions a,
.cart-item__actions button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #69778a;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.cart-item__actions a:hover {
  color: #1769c2;
}

.cart-item__actions button:hover {
  color: #bd3d43;
}

.cart-summary {
  position: sticky;
  z-index: 10;
  bottom: 18px;
  display: flex;
  min-height: 86px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 18px;
  padding: 14px 16px 14px 24px;
  border: 1px solid #dfe6ef;
  border-radius: 18px;
  background: rgb(255 255 255 / 96%);
  box-shadow: 0 18px 42px rgb(5 21 43 / 14%);
  backdrop-filter: blur(12px);
}

.cart-summary__bulk {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cart-summary__bulk > button {
  border: 0;
  background: transparent;
  color: #6d7a8d;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.cart-summary__bulk > button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cart-summary__prices {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cart-summary__prices > div {
  text-align: right;
}

.cart-summary__prices > div > span,
.cart-summary__prices small {
  color: #7a8798;
  font-size: 11px;
}

.cart-summary__prices p {
  margin: 3px 0;
  color: #526176;
  font-size: 13px;
}

.cart-summary__prices p strong {
  margin-left: 7px;
  color: #1769c2;
  font-size: 22px;
}

.cart-summary__prices > button {
  display: flex;
  min-width: 210px;
  min-height: 56px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  border: 0;
  border-radius: 14px;
  background: #05152b;
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.cart-summary__prices > button span {
  color: rgb(255 255 255 / 70%);
  font-size: 11px;
}

.cart-summary__prices > button:disabled {
  background: #b8c1ce;
  cursor: not-allowed;
}

.cart-empty {
  padding: 78px 24px;
  border: 1px solid #e1e7ef;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 14px 38px rgb(5 21 43 / 6%);
  text-align: center;
}

.cart-empty__icon {
  display: inline-flex;
  width: 84px;
  height: 84px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #edf4fb;
  color: #1769c2;
  font-size: 38px;
}

.cart-empty h2 {
  margin: 22px 0 8px;
  font-size: 24px;
}

.cart-empty p {
  margin: 0;
  color: #778498;
}

.cart-empty > div {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
}

.cart-empty a,
.cart-empty button {
  min-width: 150px;
  padding: 12px 18px;
  border: 1px solid #05152b;
  border-radius: 11px;
  font: inherit;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.cart-empty a {
  background: #05152b;
  color: #fff;
}

.cart-empty button {
  background: #fff;
  color: #05152b;
}

.checkout-dialog__intro {
  margin: 0 0 18px;
  color: #6e7c90;
  line-height: 1.6;
}

.checkout-dialog__scroll {
  max-height: min(68vh, 720px);
  overflow-y: auto;
  padding-right: 6px;
}

.checkout-dialog__items {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: #f6f8fb;
}

.checkout-dialog__items > div,
.checkout-dialog__total > div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  color: #48576c;
  font-size: 13px;
}

.checkout-dialog__total {
  display: grid;
  gap: 9px;
  margin: 18px 0 0;
}

.checkout-dialog__total dt,
.checkout-dialog__total dd {
  margin: 0;
}

.checkout-dialog__total > div:last-child {
  padding-top: 10px;
  border-top: 1px solid #e4e9f0;
  color: #05152b;
  font-size: 16px;
  font-weight: 900;
}

.dialog-primary,
.dialog-secondary {
  min-width: 120px;
  height: 42px;
  border-radius: 10px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.dialog-primary {
  border: 1px solid #05152b;
  background: #05152b;
  color: #fff;
}

.dialog-secondary {
  margin-right: 8px;
  border: 1px solid #dbe2eb;
  background: #fff;
  color: #526176;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  border-color: #1769c2;
  background-color: #1769c2;
}

@media (max-width: 980px) {
  .cart-table-head,
  .cart-item {
    grid-template-columns: minmax(300px, 1fr) 120px 80px;
  }
}

@media (max-width: 760px) {
  .cart-page {
    padding: 24px 14px 52px;
  }

  .cart-page__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .cart-card__topbar {
    padding: 0 16px;
  }

  .cart-card__topbar p {
    display: none;
  }

  .cart-group {
    padding: 0 14px 14px;
  }

  .cart-group__heading > span:last-child,
  .cart-table-head {
    display: none;
  }

  .cart-item {
    grid-template-columns: 1fr auto;
    gap: 14px 10px;
    margin-top: 10px;
    padding: 14px 12px 14px 42px;
  }

  .cart-item__select {
    top: 28px;
    left: 14px;
    transform: none;
  }

  .cart-item__service {
    grid-column: 1 / -1;
  }

  .cart-item__image {
    width: 94px;
    height: 94px;
    flex-basis: 94px;
  }

  .cart-item__price {
    position: relative;
    grid-column: 1 / 2;
    padding-top: 18px;
    text-align: left;
  }

  .cart-item__price::before {
    position: absolute;
    top: 0;
    left: 0;
    color: #8793a4;
    content: attr(data-label);
    font-size: 10px;
    font-weight: 600;
  }

  .cart-item__actions {
    grid-column: 2 / 3;
    align-items: center;
    justify-content: flex-end;
    flex-direction: row;
    padding-top: 18px;
  }

  .cart-summary {
    bottom: 8px;
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  }

  .cart-summary__bulk,
  .cart-summary__prices {
    justify-content: space-between;
  }

  .cart-summary__prices > div {
    text-align: left;
  }

  .cart-summary__prices > button {
    min-width: 150px;
  }

  .cart-empty > div {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .cart-item__image {
    width: 82px;
    height: 82px;
    flex-basis: 82px;
  }

  .cart-item__addons {
    display: none;
  }

  .cart-summary__prices > div > span,
  .cart-summary__prices small {
    display: none;
  }

  .cart-summary__prices p strong {
    display: block;
    margin-left: 0;
    font-size: 19px;
  }

  .cart-summary__prices > button {
    min-width: 138px;
  }
}
.checkout-dialog__policy { margin-top: 20px; padding-top: 18px; border-top: 1px solid #e5e7eb; }
</style>
