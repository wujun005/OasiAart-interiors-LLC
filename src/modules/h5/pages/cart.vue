<template>
  <div class="h5-cart-page">
    <header class="h5-cart-topbar">
      <button type="button" :aria-label="t('h5.common.back')" @click="router.back()">
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ t('client.cart.title') }}</h1>
      <button type="button" :aria-label="t('client.cart.browseServices')" @click="goServices">
        <van-icon name="apps-o" />
      </button>
    </header>

    <main class="h5-cart-main">
      <section v-if="items.length" class="h5-cart-hero">
        <div>
          <h2>{{ t('client.cart.allItems') }}</h2>
          <p>{{ t('client.cart.subtitle') }}</p>
        </div>
        <strong>{{ items.length }}</strong>
      </section>

      <template v-if="items.length">
        <section class="h5-cart-store">
          <button
            class="h5-cart-check"
            :class="{ 'h5-cart-check--active': allSelected, 'h5-cart-check--partial': partiallySelected }"
            type="button"
            :aria-label="t('client.cart.selectAll')"
            :aria-pressed="allSelected"
            @click="setAllSelected(!allSelected)"
          >
            <van-icon :name="allSelected ? 'success' : (partiallySelected ? 'minus' : '')" />
          </button>
          <span class="h5-cart-store__mark">H</span>
          <div>
            <strong>{{ t('client.cart.storeName') }}</strong>
            <small>{{ t('client.cart.storeDesc') }}</small>
          </div>
        </section>

        <section class="h5-cart-list">
          <article
            v-for="item in items"
            :key="item.id"
            class="h5-cart-item"
            :class="{ 'h5-cart-item--selected': item.selected }"
            role="link"
            tabindex="0"
            :aria-label="itemTitle(item)"
            @click="handleCartItemClick(item, $event)"
            @keydown.enter.self.prevent="goDetails(item)"
            @keydown.space.self.prevent="goDetails(item)"
          >
            <button
              class="h5-cart-check h5-cart-item__check"
              :class="{ 'h5-cart-check--active': item.selected }"
              type="button"
              :aria-label="t('client.cart.selectItem', { name: itemTitle(item) })"
              :aria-pressed="item.selected"
              @click="setSelected(item.id, !item.selected)"
            >
              <van-icon v-if="item.selected" name="success" />
            </button>

            <button class="h5-cart-item__image" type="button" @click="goDetails(item)">
              <img :src="item.image || fallbackImage" :alt="itemTitle(item)" />
            </button>

            <div class="h5-cart-item__body">
              <div class="h5-cart-item__heading">
                <span>{{ itemCategory(item) }}</span>
                <button type="button" :aria-label="t('client.cart.remove')" @click="confirmRemove([item.id])">
                  <van-icon name="delete-o" />
                </button>
              </div>
              <button class="h5-cart-item__title" type="button" @click="goDetails(item)">
                {{ itemTitle(item) }}
              </button>
              <p v-if="itemSpec(item)" class="h5-cart-item__spec">{{ itemSpec(item) }}</p>
              <p class="h5-cart-item__schedule">
                <van-icon name="clock-o" />
                {{ itemSchedule(item) || t('client.cart.scheduleAtCheckout') }}
              </p>
              <div v-if="itemAddOns(item).length" class="h5-cart-item__addons">
                <span v-for="addon in itemAddOns(item)" :key="addon">{{ addon }}</span>
              </div>
              <div class="h5-cart-item__footer">
                <strong>{{ formatAed(item.unitPrice) }}</strong>
                <button type="button" @click="goDetails(item)">
                  {{ t('client.cart.edit') }}
                  <van-icon name="arrow" />
                </button>
              </div>
            </div>
          </article>
        </section>

        <button class="h5-cart-add-more" type="button" @click="goServices">
          <van-icon name="plus" />
          {{ t('client.cart.browseServices') }}
        </button>

        <p class="h5-cart-note">
          <van-icon name="info-o" />
          {{ t('client.cart.scheduleAtCheckout') }}
        </p>
      </template>

      <section v-else class="h5-cart-empty">
        <span><van-icon name="cart-o" /></span>
        <h2>{{ t('client.cart.empty.title') }}</h2>
        <p>{{ t('client.cart.empty.desc') }}</p>
        <button type="button" @click="goServices">{{ t('client.cart.browseServices') }}</button>
      </section>
    </main>

    <section v-if="items.length" class="h5-cart-settlement">
      <button class="h5-cart-settlement__select" type="button" @click="setAllSelected(!allSelected)">
        <span
          class="h5-cart-check"
          :class="{ 'h5-cart-check--active': allSelected, 'h5-cart-check--partial': partiallySelected }"
        >
          <van-icon :name="allSelected ? 'success' : (partiallySelected ? 'minus' : '')" />
        </span>
        <small>{{ t('client.cart.selectAll') }}</small>
      </button>
      <div class="h5-cart-settlement__price">
        <small>{{ t('client.cart.selectedCount', { count: selectedCount }) }}</small>
        <dl>
          <div>
            <dt>{{ t('client.cart.subtotal') }}</dt>
            <dd>{{ formatAed(subtotal) }}</dd>
          </div>
          <div>
            <dt>{{ t('client.cart.vat') }}</dt>
            <dd>{{ formatAed(tax) }}</dd>
          </div>
          <div class="is-total">
            <dt>{{ t('client.cart.estimatedTotal') }}</dt>
            <dd>{{ formatAed(total) }}</dd>
          </div>
        </dl>
      </div>
      <button
        class="h5-cart-settlement__checkout"
        type="button"
        :disabled="!selectedLineCount"
        @click="openCheckout"
      >
        {{ t('client.cart.checkout') }}
      </button>
    </section>

    <nav class="h5-cart-tabbar">
      <button type="button" @click="router.push({ name: 'h5-home' })">
        <van-icon name="home-o" />
        <span>{{ t('client.header.nav.home') }}</span>
      </button>
      <button class="h5-cart-tabbar__active" type="button">
        <span class="h5-cart-tabbar__icon">
          <van-icon name="cart-o" />
          <b v-if="cartCount">{{ cartCount > 99 ? '99+' : cartCount }}</b>
        </span>
        <span>{{ t('client.header.nav.cart') }}</span>
      </button>
      <button type="button" @click="router.push({ name: 'h5-orders' })">
        <van-icon name="orders-o" />
        <span>{{ t('client.header.nav.orders') }}</span>
      </button>
      <button type="button" @click="router.push({ name: 'h5-profile' })">
        <van-icon name="contact-o" />
        <span>{{ t('client.header.profile') }}</span>
      </button>
    </nav>

    <van-popup v-model:show="checkoutVisible" position="bottom" round class="h5-cart-checkout">
      <div class="h5-cart-checkout__handle" />
      <header>
        <div>
          <span class="hourx-wordmark">HOURX HOME</span>
          <h2>{{ t('client.cart.checkoutDialog.title') }}</h2>
        </div>
        <button type="button" @click="checkoutVisible = false"><van-icon name="cross" /></button>
      </header>
      <div class="h5-cart-checkout__items">
        <div v-for="item in checkoutItems" :key="item.id">
          <img :src="item.image || fallbackImage" :alt="itemTitle(item)" />
          <span>{{ itemTitle(item) }}</span>
          <strong>{{ formatAed(item.unitPrice) }}</strong>
        </div>
      </div>
      <dl>
        <div>
          <dt>{{ t('client.cart.subtotal') }}</dt><dd>{{ formatAed(checkoutSubtotal) }}</dd>
        </div>
        <div>
          <dt>{{ t('client.cart.vat') }}</dt><dd>{{ formatAed(checkoutTax) }}</dd>
        </div>
        <div class="h5-cart-checkout__total">
          <dt>{{ t('client.cart.estimatedTotal') }}</dt><dd>{{ formatAed(checkoutTotal) }}</dd>
        </div>
      </dl>
      <BookingPolicyDetails
        class="h5-cart-checkout__policy"
        compact
        show-intro
        :agreed="checkoutPolicyAgreed"
        @update:agreed="checkoutPolicyAgreed = $event"
        @read-policy="openLegal('terms')"
      />
      <button class="h5-cart-checkout__confirm" type="button" :disabled="!checkoutPolicyAgreed || isCheckingOut" @click="confirmCheckout">
        {{ t('client.cart.checkoutDialog.confirm') }}
      </button>
    </van-popup>
    <StripePaymentModal
      :visible="stripeVisible"
      :client-secret="stripeClientSecret"
      :customer-session-client-secret="stripeCustomerSessionClientSecret"
      :locale="locale"
      :subtotal="checkoutSubtotal"
      :tax="checkoutTax"
      :total="checkoutTotal"
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
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant';
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
const router = useRouter();
const route = useRoute();
const checkoutVisible = ref(false);
const checkoutPolicyAgreed = ref(false);
const isCheckingOut = ref(false);
const stripeVisible = ref(false);
const stripeClientSecret = ref('');
const stripeCustomerSessionClientSecret = ref('');
const legalDialogVisible = ref(false);
const legalDocType = ref<LegalDocType>('terms');
const checkoutSummary = ref({ orderNo: '', orderId: '', service: '', scheduled: '', amount: '' });
const checkedOutItemIds = ref<string[]>([]);
const checkoutItemIds = ref<string[]>([]);
const {
  items,
  selectedItems,
  cartCount,
  selectedCount,
  selectedLineCount,
  allSelected,
  partiallySelected,
  subtotal,
  tax,
  total,
  refreshCart,
  setSelected,
  setAllSelected,
  removeItems,
} = useCart();

const checkoutItems = computed(() => {
  const ids = new Set(checkoutItemIds.value);
  return items.value.filter((item) => ids.has(item.id));
});
const checkoutSubtotal = computed(() =>
  checkoutItems.value.reduce((sum, item) => sum + item.unitPrice, 0),
);
const checkoutTotal = computed(() =>
  checkoutItems.value.reduce((sum, item) => sum + item.priceWithTax, 0),
);
const checkoutTax = computed(() => checkoutTotal.value - checkoutSubtotal.value);

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

const itemTitle = (item: CartItem) => pickLocalizedText(item.titleI18n, t('client.cart.unnamedService'));
const itemCategory = (item: CartItem) => pickLocalizedText(item.categoryI18n, t('client.cart.storeName'));
const itemSpec = (item: CartItem) => pickLocalizedText(item.specSummaryI18n, item.specSummary || '');
const itemSchedule = (item: CartItem) => formatServiceSchedule(
  item.serviceDateTime,
  locale.value,
  item.serviceTimeDisplay || '',
);
const itemAddOns = (item: CartItem) => item.addOnsI18n?.length
  ? item.addOnsI18n.map((entry) => pickLocalizedText(entry)).filter(Boolean)
  : (item.addOns || []);
const formatAed = (value: number) => `AED ${Number(value || 0).toFixed(2)}`;

const goServices = () => router.push({ name: 'h5-home', hash: '#services' });
const cartBookingRoute = (item: CartItem) => {
  const subtotal = item.unitPrice;
  const total = item.priceWithTax;
  return {
    name: 'h5-order-confirm',
    query: {
      mode: 'cart-edit',
      cartItemId: item.id,
      cartSkuDetail: JSON.stringify(item.skuDetail || {
        spuId: item.spuId,
        specValueIds: item.selectedSpecValueIds || [],
      }),
      spuId: item.spuId,
      skuId: item.skuId || '',
      title: itemTitle(item),
      titleI18n: JSON.stringify(item.titleI18n || {}),
      imageUrls: JSON.stringify(item.image ? [item.image] : []),
      specSummary: itemSpec(item),
      selectedSpecValueIds: JSON.stringify(item.selectedSpecValueIds || []),
      specValueNameI18n: JSON.stringify(item.specValueNameI18n || {}),
      subtotal: subtotal.toFixed(2),
      tax: (total - subtotal).toFixed(2),
      total: total.toFixed(2),
    },
  };
};
const goDetails = (item: CartItem) => router.push(cartBookingRoute(item));

const handleCartItemClick = (item: CartItem, event: MouseEvent) => {
  const target = event.target;
  if (
    target instanceof Element
    && target.closest('a, button, input, label, [role="checkbox"]')
  ) return;
  void goDetails(item);
};

const confirmRemove = async (ids: string[]) => {
  if (!ids.length) return;
  try {
    await showConfirmDialog({
      title: t('client.cart.removeConfirm.title'),
      message: t('client.cart.removeConfirm.message', { count: ids.length }),
      confirmButtonText: t('client.cart.removeConfirm.confirm'),
      cancelButtonText: t('client.cart.removeConfirm.cancel'),
      confirmButtonColor: '#05152b',
    });
  await removeItems(ids);
    showSuccessToast(t('client.cart.removeSuccess'));
  } catch {
    // The user cancelled the removal.
  }
};

const ensureLogin = async () => {
  const snapshot = getStoredAuthSnapshot();
  if (snapshot.isExpired) clearStoredAuthState();
  if (snapshot.isLoggedIn) return true;
  await router.push({ name: 'h5-login', query: { redirect: route.fullPath } });
  return false;
};

const openCheckout = async () => {
  if (!(await ensureLogin())) return;
  checkoutItemIds.value = selectedItems.value.map((item) => item.id);
  if (!checkoutItemIds.value.length) return;
  checkoutPolicyAgreed.value = false;
  checkoutVisible.value = true;
};

const openLegal = (docType: LegalDocType) => {
  legalDocType.value = docType;
  legalDialogVisible.value = true;
};

const confirmCheckout = async () => {
  if (!checkoutPolicyAgreed.value || isCheckingOut.value) return;
  const checkoutIds = [...checkoutItemIds.value];
  if (!checkoutIds.length) return;
  isCheckingOut.value = true;
  try {
    checkedOutItemIds.value = checkoutIds;
    const result = await checkoutCart(checkedOutItemIds.value, 'STRIPE', window.location.href);
    const payment = result?.payment;
    checkoutSummary.value = {
      orderNo: (result?.orderNos || []).join(', '),
      orderId: (result?.orderIds || []).join(', '),
      service: checkoutItems.value.length === 1 && checkoutItems.value[0]
        ? itemTitle(checkoutItems.value[0])
        : (locale.value === 'zh' ? `${checkoutItems.value.length} 项家居服务` : `${checkoutItems.value.length} home services`),
      scheduled: checkoutItems.value.length === 1 ? itemSchedule(checkoutItems.value[0]!) : '',
      amount: String(result?.totalAmount || checkoutTotal.value || ''),
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
    stripeCustomerSessionClientSecret.value = String(payment?.customerSessionClientSecret || '').trim();
    stripeVisible.value = true;
  } catch (error: any) {
    checkedOutItemIds.value = [];
    showFailToast(error?.message || (locale.value === 'zh' ? '购物车结算失败' : 'Cart checkout failed'));
  } finally {
    isCheckingOut.value = false;
  }
};

const handleStripeError = (message: string) => showFailToast(message);
const handlePaymentSuccess = async () => {
  stripeVisible.value = false;
  const completedIds = [...checkedOutItemIds.value];
  checkedOutItemIds.value = [];
  try {
    if (completedIds.length) await removeItems(completedIds);
    else await refreshCart();
  } catch (error) {
    console.warn('Payment succeeded but refreshing the cart failed:', error);
    void refreshCart();
  }
  showSuccessToast(locale.value === 'zh' ? '支付成功' : 'Payment successful');
  window.setTimeout(() => void router.push({ name: 'h5-booking-success', query: checkoutSummary.value }), 2000);
};

onMounted(async () => {
  await refreshCart();
  if (route.query.checkout !== '1' || !selectedLineCount.value) return;

  await openCheckout();
  if (route.query.checkout === '1') {
    await router.replace({ name: 'h5-cart' });
  }
});
</script>

<style scoped lang="scss">
.h5-cart-page {
  min-height: 100vh;
  color: #05152b;
  background:
    radial-gradient(circle at 90% 4%, rgba(30, 105, 188, 0.12), transparent 26%),
    #f4f7fb;
}

.h5-cart-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 58px;
  padding: 0 14px;
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  backdrop-filter: blur(14px);
}

.h5-cart-topbar h1 {
  margin: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
}

.h5-cart-topbar button {
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: #f2f6fb;
  color: #05152b;
  font-size: 19px;
}

.h5-cart-main {
  width: min(430px, 100%);
  margin: 0 auto;
  padding: 16px 14px calc(154px + env(safe-area-inset-bottom));
}

.h5-cart-hero {
  min-height: 104px;
  padding: 17px 18px;
  border-radius: 22px;
  background:
    linear-gradient(125deg, rgba(25, 74, 124, 0.72), transparent 52%),
    #05152b;
  color: #fff;
  box-shadow: 0 18px 35px rgba(5, 21, 43, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.h5-cart-hero h2 {
  margin: 0 0 5px;
  font-size: 22px;
  line-height: 1;
}

.h5-cart-hero p {
  max-width: 250px;
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  line-height: 1.55;
}

.h5-cart-hero > strong {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: grid;
  place-items: center;
  font-size: 21px;
}

.h5-cart-store {
  margin-top: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.h5-cart-check {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  padding: 0;
  border: 1.5px solid #bdc8d6;
  border-radius: 50%;
  background: #fff;
  color: #fff;
  display: inline-grid;
  place-items: center;
  font-size: 13px;
}

.h5-cart-check--active,
.h5-cart-check--partial {
  border-color: #1769c2;
  background: #1769c2;
  box-shadow: 0 4px 10px rgba(23, 105, 194, 0.22);
}

.h5-cart-store__mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #05152b;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 900;
}

.h5-cart-store div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.h5-cart-store strong { font-size: 13px; }
.h5-cart-store small { color: #8795a8; font-size: 10px; }

.h5-cart-list {
  margin-top: 12px;
  display: grid;
  gap: 12px;
}

.h5-cart-item {
  position: relative;
  min-width: 0;
  padding: 14px 14px 14px 48px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 25px rgba(36, 52, 73, 0.07);
  display: grid;
  grid-template-columns: 94px minmax(0, 1fr);
  gap: 13px;
  cursor: pointer;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.h5-cart-item:focus-visible {
  outline: 3px solid rgba(23, 105, 194, 0.2);
  outline-offset: 2px;
}

.h5-cart-item--selected {
  border-color: rgba(23, 105, 194, 0.25);
  box-shadow: 0 10px 28px rgba(23, 105, 194, 0.1);
}

.h5-cart-item__check {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
}

.h5-cart-item__image {
  width: 94px;
  height: 104px;
  padding: 0;
  border: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #e8eef5;
}

.h5-cart-item__image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.h5-cart-item__body { min-width: 0; }

.h5-cart-item__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.h5-cart-item__heading > span {
  max-width: calc(100% - 30px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1769c2;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.h5-cart-item__heading button {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: #f4f7fa;
  color: #8795a8;
  font-size: 16px;
}

.h5-cart-item__title {
  display: block;
  max-width: 100%;
  margin-top: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #05152b;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.35;
  text-align: left;
}

.h5-cart-item__spec {
  margin: 7px 0 0;
  padding: 6px 8px;
  border-radius: 8px;
  background: #f2f6fb;
  color: #6b7a90;
  font-size: 10px;
  line-height: 1.4;
}

.h5-cart-item__schedule {
  margin: 6px 0 0;
  color: #526176;
  font-size: 10px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 5px;
}

.h5-cart-item__schedule :deep(.van-icon) {
  margin-top: 1px;
  flex: 0 0 auto;
  color: #1769c2;
}

.h5-cart-item__addons {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.h5-cart-item__addons span {
  padding: 3px 6px;
  border-radius: 6px;
  background: #edf7ff;
  color: #1769c2;
  font-size: 9px;
}

.h5-cart-item__footer {
  margin-top: 10px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
}

.h5-cart-item__footer strong { color: #05152b; font-size: 15px; }
.h5-cart-item__footer button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #738197;
  font-size: 10px;
}

.h5-cart-note {
  margin: 14px 5px 0;
  color: #8795a8;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  line-height: 1.5;
}

.h5-cart-add-more {
  width: 100%;
  min-height: 48px;
  margin-top: 14px;
  border: 1px dashed #8ab7e7;
  border-radius: 15px;
  background: #eef6ff;
  color: #1769c2;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.h5-cart-empty {
  min-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.h5-cart-empty > span {
  width: 92px;
  height: 92px;
  border-radius: 30px;
  background: linear-gradient(145deg, #e8f3ff, #f8fbff);
  color: #1769c2;
  display: grid;
  place-items: center;
  font-size: 44px;
  box-shadow: 0 18px 34px rgba(23, 105, 194, 0.14);
}

.h5-cart-empty h2 { margin: 24px 0 8px; font-size: 22px; }
.h5-cart-empty p { max-width: 290px; margin: 0 0 22px; color: #7c899b; font-size: 13px; line-height: 1.6; }
.h5-cart-empty > button {
  min-width: 180px;
  height: 46px;
  border: 0;
  border-radius: 14px;
  background: #05152b;
  color: #fff;
  font-weight: 800;
}
.h5-cart-empty .h5-cart-empty__restore { margin-top: 9px; background: transparent; color: #1769c2; }

.h5-cart-settlement {
  position: fixed;
  z-index: 28;
  left: 50%;
  bottom: calc(58px + env(safe-area-inset-bottom));
  width: min(430px, 100vw);
  min-height: 74px;
  padding: 10px 12px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid #e5ebf2;
  box-shadow: 0 -10px 28px rgba(5, 21, 43, 0.1);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  gap: 10px;
}

.h5-cart-settlement__select {
  width: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.h5-cart-settlement__select small { color: #77859a; font-size: 9px; }

.h5-cart-settlement__price {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.h5-cart-settlement__price small,
.h5-cart-settlement__price span { color: #8a97aa; font-size: 9px; }
.h5-cart-settlement__price dl {
  min-width: 142px;
  margin: 2px 0 0;
}
.h5-cart-settlement__price dl > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  color: #7b889a;
  font-size: 9px;
  line-height: 1.35;
}
.h5-cart-settlement__price dt,
.h5-cart-settlement__price dd { margin: 0; }
.h5-cart-settlement__price dd { color: #435168; font-weight: 700; }
.h5-cart-settlement__price .is-total {
  margin-top: 1px;
  color: #05152b;
  font-size: 11px;
  font-weight: 800;
}
.h5-cart-settlement__price .is-total dd { color: #1769c2; font-size: 14px; }

.h5-cart-settlement__checkout {
  min-width: 94px;
  height: 48px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #153b65, #05152b);
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(5, 21, 43, 0.2);
}

.h5-cart-settlement__checkout:disabled { opacity: 0.42; box-shadow: none; }

.h5-cart-tabbar {
  position: fixed;
  z-index: 30;
  left: 50%;
  bottom: 0;
  width: min(430px, 100vw);
  min-height: calc(58px + env(safe-area-inset-bottom));
  padding: 0 8px env(safe-area-inset-bottom);
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fff;
  border-top: 1px solid #edf1f5;
}

.h5-cart-tabbar > button {
  border: 0;
  background: transparent;
  color: #99a4b3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 10px;
}

.h5-cart-tabbar > button > :deep(.van-icon),
.h5-cart-tabbar__icon > :deep(.van-icon) { font-size: 22px; }
.h5-cart-tabbar .h5-cart-tabbar__active { color: #1769c2; }
.h5-cart-tabbar__icon { position: relative; display: inline-flex; }
.h5-cart-tabbar__icon b {
  position: absolute;
  top: -7px;
  right: -12px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 8px;
  line-height: 13px;
}

.h5-cart-checkout {
  max-height: 82vh;
  padding: 10px 18px calc(22px + env(safe-area-inset-bottom));
  overflow-y: auto;
  color: #05152b;
}

.h5-cart-checkout__handle { width: 42px; height: 4px; margin: 0 auto 16px; border-radius: 9px; background: #d8e0e9; }
.h5-cart-checkout header { display: flex; align-items: flex-start; justify-content: space-between; }
.h5-cart-checkout header span { color: #1769c2; font-size: 9px; font-weight: 900; letter-spacing: 0.16em; }
.h5-cart-checkout h2 { margin: 4px 0 0; font-size: 22px; }
.h5-cart-checkout header button { width: 34px; height: 34px; border: 0; border-radius: 11px; background: #f2f5f8; color: #64748b; }
.h5-cart-checkout > p { margin: 12px 0 16px; color: #7d899a; font-size: 12px; line-height: 1.55; }
.h5-cart-checkout__items { display: grid; gap: 8px; }
.h5-cart-checkout__items > div {
  min-width: 0;
  padding: 8px;
  border-radius: 13px;
  background: #f5f8fb;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
}
.h5-cart-checkout__items img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; }
.h5-cart-checkout__items span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 700; }
.h5-cart-checkout__items strong { font-size: 11px; }
.h5-cart-checkout dl { margin: 18px 0; padding-top: 12px; border-top: 1px solid #e9eef3; }
.h5-cart-checkout dl div { display: flex; justify-content: space-between; margin: 8px 0; color: #728095; font-size: 12px; }
.h5-cart-checkout dd { margin: 0; color: #05152b; font-weight: 800; }
.h5-cart-checkout .h5-cart-checkout__total { padding-top: 10px; border-top: 1px dashed #dce3eb; color: #05152b; font-size: 15px; font-weight: 900; }
.h5-cart-checkout__confirm {
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 15px;
  background: linear-gradient(135deg, #153b65, #05152b);
  color: #fff;
  font-size: 14px;
  font-weight: 900;
}
.h5-cart-checkout__policy { margin: 16px 0; padding-top: 15px; border-top: 1px solid #e5e7eb; }
</style>
