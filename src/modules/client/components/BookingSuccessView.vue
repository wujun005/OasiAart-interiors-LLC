<template>
  <main class="booking-success" :class="{ 'booking-success--mobile': mobile }">
    <section class="booking-success__card">
      <div class="booking-success__check" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7" /></svg>
      </div>
      <span class="booking-success__eyebrow hourx-wordmark">HOURX HOME</span>
      <h1>{{ locale.startsWith('zh') ? '预订成功！' : 'Your booking is confirmed!' }}</h1>
      <p>{{ locale.startsWith('zh') ? '感谢您的预订。支付和订单状态同步后，可在订单列表中查看最新进度。' : 'Thank you for booking with HourX. Your latest status will appear in Orders as soon as payment synchronization completes.' }}</p>

      <dl class="booking-success__summary">
        <div><dt>{{ locale.startsWith('zh') ? '订单编号' : 'Order ID' }}</dt><dd>{{ orderReference }}</dd></div>
        <div v-if="service"><dt>{{ locale.startsWith('zh') ? '服务' : 'Service' }}</dt><dd>{{ service }}</dd></div>
        <div v-if="scheduled"><dt>{{ locale.startsWith('zh') ? '预约日期和时间' : 'Scheduled date and time' }}</dt><dd>{{ scheduled }}</dd></div>
        <div v-if="amount"><dt>{{ locale.startsWith('zh') ? '支付金额' : 'Amount paid' }}</dt><dd class="booking-success__amount">{{ amount }}</dd></div>
      </dl>

      <div class="booking-success__notice">
        <span>i</span>
        {{ locale.startsWith('zh') ? '订单状态通常会在数秒内完成同步，无需重复支付。' : 'Order status usually synchronizes within a few seconds. Please do not submit payment again.' }}
      </div>

      <div class="booking-success__actions">
        <button type="button" class="primary" @click="router.push({ name: ordersRoute })">{{ locale.startsWith('zh') ? '查看订单' : 'View Orders' }}</button>
        <button type="button" class="secondary" @click="router.push(mobile ? { name: 'h5-home' } : { path: '/' })">{{ locale.startsWith('zh') ? '返回首页' : 'Back to Home' }}</button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { formatServiceSchedule } from '@/modules/client/utils/order-date-time';

const props = withDefaults(defineProps<{ mobile?: boolean }>(), { mobile: false });
const route = useRoute();
const router = useRouter();
const { locale } = useI18n({ useScope: 'global' });
const textQuery = (name: string) => Array.isArray(route.query[name]) ? String(route.query[name]?.[0] || '') : String(route.query[name] || '');
const orderReference = computed(() => textQuery('orderNo') || textQuery('orderId') || (locale.value.startsWith('zh') ? '正在生成' : 'Processing'));
const service = computed(() => textQuery('service'));
const scheduled = computed(() => {
  const value = textQuery('scheduled');
  return value ? formatServiceSchedule(value, locale.value, value) : '';
});
const amount = computed(() => {
  const value = textQuery('amount').replace(/^AED\s*|\s*AED$/gi, '');
  return value ? `AED ${Number(value).toFixed(2)}` : '';
});
const ordersRoute = computed(() => props.mobile ? 'h5-orders' : 'order-list');
</script>

<style scoped lang="scss">
.booking-success { min-height:100vh;padding:54px 20px;display:grid;place-items:center;background:radial-gradient(circle at 50% 0,rgba(23,105,194,.16),transparent 34%),#f4f7fb;color:#05152b; }.booking-success__card { width:min(680px,100%);padding:44px clamp(22px,6vw,56px);border:1px solid rgba(255,255,255,.9);border-radius:28px;background:#fff;text-align:center;box-shadow:0 28px 80px rgba(5,21,43,.13); }.booking-success__check { width:76px;height:76px;margin:0 auto 20px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#19a95b,#0f8c48);color:#fff;box-shadow:0 16px 30px rgba(21,153,80,.25); }.booking-success__check svg { width:42px;height:42px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round; }.booking-success__eyebrow { color:#1769c2;font-size:11px;font-weight:900;letter-spacing:.19em; }.booking-success h1 { margin:9px 0 12px;font-size:clamp(28px,5vw,42px);line-height:1.12; }.booking-success>section>p { max-width:530px;margin:0 auto;color:#64748b;font-size:14px;line-height:1.7; }.booking-success__summary { margin:28px 0 18px;padding:6px 20px;border:1px solid #e3eaf1;border-radius:18px;background:#f8fafc;text-align:left; }.booking-success__summary>div { padding:14px 0;display:grid;grid-template-columns:140px minmax(0,1fr);gap:16px;border-bottom:1px solid #e8edf2; }.booking-success__summary>div:last-child { border-bottom:0; }.booking-success__summary dt { color:#8290a2;font-size:12px;font-weight:700; }.booking-success__summary dd { margin:0;color:#25364b;font-size:13px;font-weight:800;text-align:right;overflow-wrap:anywhere; }.booking-success__summary .booking-success__amount { color:#1769c2;font-size:17px; }.booking-success__notice { padding:12px 14px;border-radius:13px;display:flex;align-items:flex-start;gap:9px;background:#edf5ff;color:#526a84;font-size:11px;line-height:1.55;text-align:left; }.booking-success__notice span { width:18px;height:18px;flex:0 0 auto;border-radius:50%;display:grid;place-items:center;background:#1769c2;color:#fff;font-weight:900; }.booking-success__actions { margin-top:24px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px; }.booking-success__actions button { min-height:48px;border-radius:13px;font-weight:900;cursor:pointer; }.booking-success__actions .primary { border:0;background:#05152b;color:#fff;box-shadow:0 12px 25px rgba(5,21,43,.18); }.booking-success__actions .secondary { border:1px solid #d5dee8;background:#fff;color:#334155; }
@media(max-width:520px){.booking-success { padding:18px 14px;align-items:start; }.booking-success__card { margin-top:20px;padding:32px 18px 22px;border-radius:23px; }.booking-success__check { width:64px;height:64px; }.booking-success__summary { padding:4px 14px; }.booking-success__summary>div { grid-template-columns:105px minmax(0,1fr);gap:10px; }.booking-success__actions { grid-template-columns:1fr; }.booking-success__actions .primary { order:-1; }}
</style>
