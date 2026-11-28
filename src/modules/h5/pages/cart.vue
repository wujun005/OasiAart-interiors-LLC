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

    <div class="h5-cart-dock">
      <section v-if="items.length" class="h5-cart-settlement">
        <button class="h5-cart-settlement__select" type="button" :aria-pressed="allSelected" @click="setAllSelected(!allSelected)">
          <span
            class="h5-cart-check"
            :class="{ 'h5-cart-check--active': allSelected, 'h5-cart-check--partial': partiallySelected }"
          >
            <van-icon :name="allSelected ? 'success' : (partiallySelected ? 'minus' : '')" aria-hidden="true" />
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
        <button type="button" @click="router.push({ name: 'h5-profile' })">
          <van-icon name="contact-o" />
          <span>{{ t('client.header.profile') }}</span>
        </button>
      </nav>
    </div>

    <van-popup v-model:show="checkoutVisible" position="bottom" round class="h5-cart-checkout">
      <div class="h5-cart-checkout__handle" />
      <header>
        <div>
          <span class="hourx-wordmark">HOURX HOME</span>
          <h2>{{ t('client.cart.checkoutDialog.title') }}</h2>
        </div>
        <button type="button" :aria-label="t('client.cart.checkoutDialog.cancel')" @click="checkoutVisible = false"><van-icon name="cross" aria-hidden="true" /></button>
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
        <CheckoutPromoRow
          v-if="checkoutItems.length === 1"
          v-model="promoCode"
          class="pay-promo"
          :loading="promoLoading"
          :error="promoError"
          :notice="promoNotice"
          :applied-code="activeCoupon?.couponCode || ''"
          :discount="activeCoupon?.discountAmount || 0"
          @apply="applyPromo"
          @remove="resetPromo"
        />
        <p v-else-if="checkoutItems.length > 1" class="h5-cart-checkout__promo-note">{{ t('client.productDetail.booking.promoSingleOnly') }}</p>
        <div>
          <dt>{{ t('client.cart.vat') }}</dt><dd>{{ formatAed(payableTax) }}</dd>
        </div>
        <div class="h5-cart-checkout__total">
          <dt>{{ t('client.cart.estimatedTotal') }}</dt><dd>{{ formatAed(payableTotal) }}</dd>
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
      :voucher-discount="activeCoupon?.discountAmount || 0"
      :tax="payableTax"
      :total="payableTotal"
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
import CheckoutPromoRow from '@/modules/client/components/CheckoutPromoRow.vue';
import { usePromoCode } from '@/modules/client/composables/usePromoCode';
import { cartItemCouponBody } from '@/modules/client/utils/promo-code';
import { trackInitiateCheckout } from '@/modules/client/utils/metaPixel';
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
const promoSignature = computed(() => checkoutItems.value.length === 1 ? checkoutItems.value[0]?.id || '' : '');
const {
  code: promoCode,
  loading: promoLoading,
  error: promoError,
  dropped: promoDropped,
  active: activeCoupon,
  apply: submitPromo,
  reset: resetPromo,
} = usePromoCode(() => promoSignature.value);
const payableTax = computed(() => activeCoupon.value?.payableTax ?? checkoutTax.value);
const payableTotal = computed(() => activeCoupon.value?.payableWithTax ?? checkoutTotal.value);
const promoNotice = computed(() => (
  promoDropped.value ? t('client.productDetail.booking.promoRemoved') : ''
));

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
const itemCategory = (item: CartItem) => item.packageId
  ? t('client.cart.packageLabel')
  : pickLocalizedText(item.categoryI18n, t('client.cart.storeName'));
const itemSpec = (item: CartItem) => pickLocalizedText(item.specSummaryI18n, item.specSummary || '');
const itemSchedule = (item: CartItem) => item.packageId
  ? t('client.cart.packageSchedule')
  : formatServiceSchedule(
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
      ...(item.attachSelections?.length
        ? { attachSelections: JSON.stringify(item.attachSelections) }
        : {}),
      subtotal: subtotal.toFixed(2),
      tax: (total - subtotal).toFixed(2),
      total: total.toFixed(2),
    },
  };
};
const goDetails = (item: CartItem) => {
  if (item.packageId) {
    void router.push({ name: 'h5-package-detail', params: { id: item.packageId } });
    return;
  }
  void router.push(cartBookingRoute(item));
};

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
  resetPromo();
  checkoutVisible.value = true;
};

const applyPromo = async () => {
  const item = checkoutItems.value.length === 1 ? checkoutItems.value[0] : null;
  if (!item) return;
  await submitPromo(
    cartItemCouponBody(item),
    locale.value,
    t('client.productDetail.booking.promoEnter'),
    t('client.productDetail.booking.promoSingleOnly'),
  );
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
    const result = await checkoutCart(
      checkedOutItemIds.value,
      'STRIPE',
      window.location.href,
      activeCoupon.value?.couponCode,
    );
    const payment = result?.payment;
    checkoutSummary.value = {
      orderNo: (result?.orderNos || []).join(', '),
      orderId: (result?.orderIds || []).join(', '),
      service: checkoutItems.value.length === 1 && checkoutItems.value[0]
        ? itemTitle(checkoutItems.value[0])
        : (locale.value === 'zh' ? `${checkoutItems.value.length} 项家居服务` : `${checkoutItems.value.length} home services`),
      scheduled: checkoutItems.value.length === 1 ? itemSchedule(checkoutItems.value[0]!) : '',
      amount: String(result?.totalAmount || payableTotal.value || ''),
    };
    const approvalUrl = String(payment?.approvalUrl || '').trim();
    const clientSecret = String(payment?.clientSecret || '').trim();
    if (approvalUrl || clientSecret) {
      trackInitiateCheckout({
        contentIds: result?.orderIds,
        contentName: checkoutSummary.value.service,
        value: result?.totalAmount || payableTotal.value,
        numItems: checkoutItems.value.length,
      });
    }
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
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  color: var(--hourx-client-text);
  background: var(--hourx-client-canvas);
}

.h5-cart-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  min-height: 58px;
  flex-shrink: 0;
  padding: 0.375rem 0.875rem;
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr) 2.75rem;
  gap: 0.5rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  backdrop-filter: blur(14px);
}

.h5-cart-topbar h1 {
  margin: 0;
  overflow-wrap: anywhere;
  text-align: center;
  color: var(--hourx-client-text);
  font: 700 var(--hourx-client-size-card)/1.25 var(--hourx-client-heading-font);
}

.h5-cart-topbar button {
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: #f2f6fb;
  color: var(--hourx-client-text);
  font-size: 19px;
}

.h5-cart-main {
  width: min(430px, 100%);
  margin: 0 auto;
  padding: 16px 14px 24px;
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
  font: 600 var(--hourx-client-size-card)/1.3 var(--hourx-client-font-family);
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
  border-color: var(--hourx-client-text);
  background: var(--hourx-client-text);
  box-shadow: 0 4px 10px rgba(23, 105, 194, 0.22);
}

.h5-cart-store__mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--hourx-client-text);
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
  grid-template-columns: clamp(3.75rem, 19vw, 5.875rem) minmax(0, 1fr);
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
  width: 100%;
  aspect-ratio: 9 / 10;
  height: auto;
  align-self: start;
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
  color: var(--hourx-client-text);
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
  color: var(--hourx-client-text);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.35;
  text-align: left;
  overflow-wrap: anywhere;
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
  color: var(--hourx-client-text);
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
  color: var(--hourx-client-text);
  font-size: 9px;
}

.h5-cart-item__footer {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.h5-cart-item__footer strong {
  color: var(--hourx-client-text);
  font-size: 15px;
  overflow-wrap: anywhere;
}
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
  color: var(--hourx-client-text);
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.h5-cart-empty {
  padding: 48px 18px;
  border: 1px solid var(--hourx-client-border);
  border-radius: 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.h5-cart-empty > span {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: #f1eee8;
  color: var(--hourx-client-text);
  display: grid;
  place-items: center;
  font-size: 36px;
}

.h5-cart-empty h2 { margin: 20px 0 14px; font: 700 1.5rem/1.2 var(--hourx-client-heading-font); }
.h5-cart-empty p { max-width: 290px; margin: 0 0 22px; color: var(--hourx-client-muted); font-size: var(--hourx-client-size-body); line-height: 1.55; }
.h5-cart-empty > button {
  min-width: 180px;
  height: 46px;
  border: 0;
  border-radius: 14px;
  background: var(--hourx-client-text);
  color: #fff;
  font-weight: 800;
}
.h5-cart-empty .h5-cart-empty__restore { margin-top: 9px; background: transparent; color: var(--hourx-client-text); }

.h5-cart-dock {
  position: sticky;
  bottom: 0;
  z-index: 30;
  width: min(430px, 100%);
  margin: auto auto 0;
}

.h5-cart-settlement {
  padding: 0.625rem 0.75rem;
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid #e5ebf2;
  box-shadow: 0 -10px 28px rgba(5, 21, 43, 0.1);
  backdrop-filter: blur(14px);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.h5-cart-settlement__select {
  flex: 0 0 2.75rem;
  min-height: 2.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.h5-cart-settlement__select small {
  color: var(--hourx-client-muted);
  font-size: 0.6875rem;
  line-height: 1.2;
}

.h5-cart-settlement__price {
  min-width: 0;
  flex: 1 1 8.5rem;
}

.h5-cart-settlement__price small { color: var(--hourx-client-muted); font-size: 0.6875rem; }
.h5-cart-settlement__price dl {
  margin: 2px 0 0;
}
.h5-cart-settlement__price dl > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, max-content);
  align-items: baseline;
  gap: 0.25rem;
  color: var(--hourx-client-muted);
  font-size: 0.6875rem;
  line-height: 1.35;
}
.h5-cart-settlement__price dt,
.h5-cart-settlement__price dd { margin: 0; overflow-wrap: anywhere; }
.h5-cart-settlement__price dd { color: #435168; font-weight: 700; text-align: end; }
.h5-cart-settlement__price .is-total {
  margin-top: 1px;
  color: var(--hourx-client-text);
  font-size: 0.6875rem;
  font-weight: 800;
}
.h5-cart-settlement__price .is-total dd { color: var(--hourx-client-text); font-size: 0.875rem; }

.h5-cart-settlement__checkout {
  min-width: 5rem;
  min-height: 3rem;
  margin-inline-start: auto;
  padding: 0.375rem 0.5rem;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #153b65, #05152b);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(5, 21, 43, 0.2);
}

.h5-cart-settlement__checkout:disabled { opacity: 0.42; box-shadow: none; }

.h5-cart-tabbar {
  min-height: calc(3.625rem + env(safe-area-inset-bottom));
  padding: 0 8px env(safe-area-inset-bottom);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
.h5-cart-tabbar .h5-cart-tabbar__active { color: var(--hourx-client-text); }
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
  max-height: 82dvh;
  padding: 10px 18px calc(22px + env(safe-area-inset-bottom));
  overflow-y: auto;
  color: var(--hourx-client-text);
}

.h5-cart-checkout__handle { width: 42px; height: 4px; margin: 0 auto 16px; border-radius: 9px; background: #d8e0e9; }
.h5-cart-checkout header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.h5-cart-checkout header div { min-width: 0; overflow-wrap: anywhere; }
.h5-cart-checkout header span { color: var(--hourx-client-text); font-size: 9px; font-weight: 900; letter-spacing: 0.16em; }
.h5-cart-checkout h2 { margin: 4px 0 0; font-size: 22px; }
.h5-cart-checkout header button { width: 2.75rem; height: 2.75rem; flex: none; border: 0; border-radius: 11px; background: #f2f5f8; color: #64748b; }
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
.h5-cart-checkout__items span { min-width: 0; overflow-wrap: anywhere; font-size: 12px; font-weight: 700; }
.h5-cart-checkout__items strong { font-size: 11px; }
.h5-cart-checkout__promo-note { margin: 8px 0; color: #7d899a; font-size: 12px; line-height: 1.45; }
.h5-cart-checkout dl { margin: 18px 0; padding-top: 12px; border-top: 1px solid #e9eef3; }
.h5-cart-checkout dl > div { display: flex; justify-content: space-between; margin: 8px 0; color: #728095; font-size: 12px; }
.h5-cart-checkout dl > .pay-promo { display: block; margin: 8px 0; color: #728095; font-size: 13px; font-weight: 600; }
.h5-cart-checkout dd { margin: 0; color: var(--hourx-client-text); font-weight: 800; }
.h5-cart-checkout .h5-cart-checkout__total { padding-top: 10px; border-top: 1px dashed #dce3eb; color: var(--hourx-client-text); font-size: 15px; font-weight: 900; }
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
