<template>
  <Teleport to="body">
    <div v-if="visible" class="stripe-modal" role="dialog" aria-modal="true">
      <button class="stripe-modal__backdrop" type="button" aria-label="Close" @click="close" />
      <section class="stripe-modal__card">
        <header>
          <div>
            <span class="hourx-wordmark">HOURX HOME</span>
            <h2>{{ locale === 'zh' ? '安全支付' : 'Secure Payment' }}</h2>
          </div>
          <button type="button" :disabled="submitting" @click="close">×</button>
        </header>
        <p>{{ locale === 'zh' ? '支付信息由 Stripe 安全处理，HourX 不保存银行卡号。' : 'Your payment is securely processed by Stripe. HourX does not store card numbers.' }}</p>
        <dl v-if="showPaymentSummary" class="stripe-modal__summary">
          <div>
            <dt>{{ locale === 'zh' ? '小计' : 'Subtotal' }}</dt>
            <dd>{{ formatAed(subtotal) }}</dd>
          </div>
          <div>
            <dt>{{ locale === 'zh' ? '增值税 VAT（5%）' : 'VAT (5%)' }}</dt>
            <dd>{{ formatAed(tax) }}</dd>
          </div>
          <div class="is-total">
            <dt>{{ locale === 'zh' ? '总额' : 'Total' }}</dt>
            <dd>{{ formatAed(total) }}</dd>
          </div>
        </dl>
        <div
          class="stripe-modal__express"
          :class="{ 'stripe-modal__express--hidden': !expressCheckoutVisible && !loading }"
        >
          <div ref="expressCheckoutRef" />
        </div>
        <div v-if="expressCheckoutVisible" class="stripe-modal__divider">
          <span>{{ locale === 'zh' ? '或使用银行卡' : 'Or pay by card' }}</span>
        </div>
        <div ref="paymentElementRef" class="stripe-modal__element" />
        <p v-if="errorText" class="stripe-modal__error">{{ errorText }}</p>
        <button class="stripe-modal__pay" type="button" :disabled="loading || submitting" @click="confirmPayment">
          {{ loading ? (locale === 'zh' ? '加载中...' : 'Loading...') : submitting ? (locale === 'zh' ? '支付中...' : 'Paying...') : (locale === 'zh' ? '立即支付' : 'Pay Now') }}
        </button>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  clientSecret: string;
  customerSessionClientSecret?: string;
  locale: string;
  subtotal?: number;
  tax?: number;
  total?: number;
}>();
const emit = defineEmits<{
  close: [];
  paid: [];
  error: [message: string];
}>();

const expressCheckoutRef = ref<HTMLElement | null>(null);
const paymentElementRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const submitting = ref(false);
const errorText = ref('');
const expressCheckoutVisible = ref(true);
const showPaymentSummary = computed(() => Number(props.total) > 0);
const formatAed = (value?: number) => `AED ${Number(value || 0).toFixed(2)}`;
let stripe: any = null;
let elements: any = null;
let expressCheckoutElement: any = null;
let paymentElement: any = null;

const loadStripe = async () => {
  if (typeof (window as any).Stripe === 'function') return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('hourx-stripe-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = 'hourx-stripe-js';
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(script);
  });
};

const destroy = () => {
  try { expressCheckoutElement?.destroy?.(); } catch { /* no-op */ }
  try { paymentElement?.destroy?.(); } catch { /* no-op */ }
  expressCheckoutElement = null;
  paymentElement = null;
  elements = null;
  stripe = null;
  expressCheckoutVisible.value = true;
};

const handleExpressCheckoutConfirm = async () => {
  await confirmPayment();
};

const initialize = async () => {
  destroy();
  if (!props.visible || !props.clientSecret) return;
  loading.value = true;
  errorText.value = '';
  try {
    await loadStripe();
    const key = String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
    if (!key) throw new Error(props.locale === 'zh' ? 'Stripe 公钥未配置' : 'Stripe publishable key is not configured');
    stripe = (window as any).Stripe(key, { locale: props.locale.startsWith('zh') ? 'zh' : 'en' });
    elements = stripe.elements({
      clientSecret: props.clientSecret,
      ...(props.customerSessionClientSecret
        ? { customerSessionClientSecret: props.customerSessionClientSecret }
        : {}),
      appearance: { theme: 'stripe' },
    });
    expressCheckoutElement = elements.create('expressCheckout', {
      paymentMethods: {
        applePay: 'always',
        googlePay: 'always',
      },
    });
    expressCheckoutElement.on?.('ready', (event?: { availablePaymentMethods?: Record<string, unknown> | null }) => {
      expressCheckoutVisible.value = Boolean(event?.availablePaymentMethods);
    });
    expressCheckoutElement.on?.('confirm', handleExpressCheckoutConfirm);
    paymentElement = elements.create('payment', { layout: 'tabs' });
    await nextTick();
    if (expressCheckoutRef.value) expressCheckoutElement.mount(expressCheckoutRef.value);
    if (paymentElementRef.value) paymentElement.mount(paymentElementRef.value);
  } catch (error: any) {
    errorText.value = String(error?.message || 'Unable to initialize payment');
    emit('error', errorText.value);
  } finally {
    loading.value = false;
  }
};

const confirmPayment = async () => {
  if (!stripe || !elements || submitting.value) return;
  submitting.value = true;
  errorText.value = '';
  try {
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });
    if (result?.error) throw new Error(result.error.message || 'Payment failed');
    emit('paid');
  } catch (error: any) {
    errorText.value = String(error?.message || 'Payment failed');
    emit('error', errorText.value);
  } finally {
    submitting.value = false;
  }
};

const close = () => {
  if (!submitting.value) emit('close');
};

watch(
  () => [props.visible, props.clientSecret, props.customerSessionClientSecret],
  () => void initialize(),
  { immediate: true },
);
onBeforeUnmount(destroy);
</script>

<style scoped>
.stripe-modal { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 16px; }
.stripe-modal__backdrop { position: absolute; inset: 0; width: 100%; border: 0; background: rgba(5, 21, 43, .56); }
.stripe-modal__card { position: relative; width: min(560px, 100%); max-height: calc(100dvh - 32px); overflow: auto; border-radius: 22px; background: #fff; padding: 24px; box-shadow: 0 24px 80px rgba(5, 21, 43, .28); }
.stripe-modal__card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.stripe-modal__card header span { color: #1769c2; font-size: 11px; font-weight: 900; letter-spacing: .16em; }
.stripe-modal__card h2 { margin: 5px 0 0; color: #05152b; font-size: 24px; }
.stripe-modal__card header button { width: 36px; height: 36px; border: 0; border-radius: 50%; background: #f1f5f9; color: #475569; font-size: 22px; }
.stripe-modal__card > p { color: #64748b; font-size: 13px; line-height: 1.6; }
.stripe-modal__summary { margin: 18px 0; padding: 13px 15px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
.stripe-modal__summary div { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 5px 0; color: #64748b; font-size: 13px; }
.stripe-modal__summary dd { margin: 0; color: #17233a; font-weight: 800; }
.stripe-modal__summary .is-total { margin-top: 6px; padding-top: 11px; border-top: 1px dashed #cbd5e1; color: #05152b; font-size: 15px; font-weight: 900; }
.stripe-modal__summary .is-total dd { color: #1769c2; }
.stripe-modal__express { min-height: 44px; margin: 18px 0; }
.stripe-modal__express--hidden { display: none; }
.stripe-modal__divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 4px; color: #94a3b8; font-size: 12px; }
.stripe-modal__divider::before, .stripe-modal__divider::after { height: 1px; flex: 1; background: #e2e8f0; content: ''; }
.stripe-modal__element { min-height: 150px; margin: 18px 0; }
.stripe-modal__error { color: #dc2626 !important; }
.stripe-modal__pay { width: 100%; min-height: 48px; border: 0; border-radius: 14px; background: #05152b; color: #fff; font-weight: 800; }
.stripe-modal__pay:disabled { opacity: .55; }
@media (max-width: 640px) { .stripe-modal { align-items: end; padding: 0; } .stripe-modal__card { width: 100%; max-height: calc(100dvh - 12px); border-radius: 24px 24px 0 0; padding: 22px 18px calc(20px + env(safe-area-inset-bottom)); } }
</style>
