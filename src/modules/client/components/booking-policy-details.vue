<template>
  <section class="booking-policy-details" :class="{ 'is-compact': compact }">
    <header v-if="showIntro" class="booking-policy-details__intro">
      <h3>{{ copy.title }}</h3>
      <p>{{ copy.subtitle }}</p>
    </header>

    <div class="booking-policy-details__rules">
      <div v-for="rule in rules" :key="rule.key" class="booking-policy-detail-rule">
        <svg class="booking-policy-detail-rule__icon" viewBox="0 0 24 24" aria-hidden="true">
          <template v-if="rule.icon === 'clock'">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </template>
          <template v-else-if="rule.icon === 'calendar'">
            <rect x="4" y="5.5" width="14" height="13" rx="2" />
            <path d="M7 3.5v4M15 3.5v4M4 9.5h14" />
            <circle cx="18" cy="17" r="3.5" />
            <path d="M18 15.5V17l1 1" />
          </template>
          <template v-else-if="rule.icon === 'alarm'">
            <circle cx="12" cy="13" r="7" />
            <path d="M12 9v4l2.5 1.5M7 4.5 4.5 7M17 4.5 19.5 7M9.5 3h5" />
          </template>
          <template v-else-if="rule.icon === 'refresh'">
            <path d="M19 8V4.5L16.5 7A7 7 0 1 0 19 12" />
          </template>
          <template v-else>
            <circle cx="12" cy="12" r="8.5" />
            <path d="m6 6 12 12" />
          </template>
        </svg>
        <strong>{{ rule.label }}</strong>
        <span class="booking-policy-detail-rule__status" :class="`is-${rule.tone}`">
          {{ rule.status }}
        </span>
      </div>
    </div>

    <div class="booking-policy-details__notice">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      <p>{{ copy.notice }}</p>
    </div>

    <div class="booking-policy-details__agreement">
      <label>
        <input type="checkbox" :checked="agreed" @change="updateAgreement" />
        <span class="booking-policy-details__checkbox" aria-hidden="true">
          <svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg>
        </span>
        <span>{{ copy.agreementLead }}</span>
      </label>
      <button type="button" @click="$emit('read-policy')">{{ copy.policyName }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

withDefaults(defineProps<{
  agreed: boolean;
  compact?: boolean;
  showIntro?: boolean;
}>(), {
  compact: false,
  showIntro: false,
});

const emit = defineEmits<{
  'update:agreed': [value: boolean];
  'read-policy': [];
}>();

const { locale } = useI18n({ useScope: 'global' });
const isZh = computed(() => String(locale.value).startsWith('zh'));

const copy = computed(() => isZh.value ? {
  title: '确认前请知悉',
  subtitle: '如果您的计划有变，以下规则将适用。',
  notice: '*退款将扣除 Stripe 不可退还的支付处理费：所有银行卡统一为 3.9% + AED 1。',
  agreementLead: '我已阅读并同意 HourX 的',
  policyName: '取消、改期与退款政策',
} : {
  title: 'Before you confirm',
  subtitle: 'Here’s what happens if your plans change.',
  notice: "*Refunds deduct Stripe's non-refundable 3.9% + AED 1 processing fee, applied to all cards.",
  agreementLead: 'I’ve read & agree to HourX’s',
  policyName: 'cancellation, rescheduling & refund policy',
});

const rules = computed(() => isZh.value ? [
  { key: 'booking-grace', icon: 'clock', label: '预订后 10 分钟内', status: '可退款*', tone: 'success' },
  { key: 'cancel-early', icon: 'calendar', label: '服务开始前 6 小时以上', status: '可退款*', tone: 'success' },
  { key: 'cancel-late', icon: 'alarm', label: '距服务开始不足 6 小时', status: '不退款', tone: 'danger' },
  { key: 'reschedule-early', icon: 'refresh', label: '提前 3 小时以上改期', status: '免费', tone: 'success' },
  { key: 'reschedule-late', icon: 'blocked', label: '提前不足 3 小时改期', status: '不可改期', tone: 'danger' },
] : [
  { key: 'booking-grace', icon: 'clock', label: 'Within 10 min of booking', status: 'Refund*', tone: 'success' },
  { key: 'cancel-early', icon: 'calendar', label: '6+ hours before service', status: 'Refund*', tone: 'success' },
  { key: 'cancel-late', icon: 'alarm', label: 'Less than 6 hours before service', status: 'No refund', tone: 'danger' },
  { key: 'reschedule-early', icon: 'refresh', label: 'Reschedule, 3+ hours before', status: 'Free', tone: 'success' },
  { key: 'reschedule-late', icon: 'blocked', label: 'Reschedule, under 3 hours', status: 'Unavailable', tone: 'danger' },
]);

const updateAgreement = (event: Event) => {
  emit('update:agreed', (event.target as HTMLInputElement).checked);
};
</script>

<style scoped lang="scss">
.booking-policy-details__intro { margin-bottom: 15px; }
.booking-policy-details__intro h3 { margin: 0; color: #090909; font-size: 20px; line-height: 1.25; font-weight: 800; }
.booking-policy-details__intro p { margin: 4px 0 0; color: #565656; font-size: 13px; line-height: 1.45; }
.booking-policy-details__rules { border-top: 1px solid transparent; }
.booking-policy-detail-rule { min-height: 69px; display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; align-items: center; gap: 12px; border-bottom: 1px solid #e5e5e2; }
.booking-policy-detail-rule__icon { width: 23px; height: 23px; overflow: visible; fill: none; stroke: #5b5b57; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.booking-policy-detail-rule strong { color: #262626; font-size: 16px; line-height: 1.35; font-weight: 650; }
.booking-policy-detail-rule__status { min-height: 32px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; padding: 5px 14px; border-radius: 999px; font-size: 14px; line-height: 1; font-weight: 700; white-space: nowrap; }
.booking-policy-detail-rule__status.is-success { background: #dff6df; color: #18803a; }
.booking-policy-detail-rule__status.is-danger { background: #ffe1e3; color: #a82f3a; }
.booking-policy-details__notice { display: flex; align-items: flex-start; gap: 10px; margin-top: 24px; padding: 14px 16px; border: 1px solid #e1e1de; border-radius: 18px; color: #484844; }
.booking-policy-details__notice > svg { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 1px; fill: none; stroke: #777771; stroke-linecap: round; stroke-width: 1.7; }
.booking-policy-details__notice p { margin: 0; font-size: 13px; line-height: 1.45; }
.booking-policy-details__agreement { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 4px; margin-bottom: 17px; color: #3d3d3b; font-size: 13px; line-height: 22px; }
.booking-policy-details__agreement label { display: inline-flex; align-items: flex-start; gap: 9px; cursor: pointer; }
.booking-policy-details__agreement input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
.booking-policy-details__checkbox { width: 21px; height: 21px; flex: 0 0 auto; display: grid; place-items: center; box-sizing: border-box; border: 2px solid #242424; border-radius: 3px; background: #fff; transition: background .15s ease; }
.booking-policy-details__checkbox svg { width: 16px; height: 16px; fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.4; opacity: 0; }
.booking-policy-details__agreement input:checked + .booking-policy-details__checkbox { background: #0a0a0a; }
.booking-policy-details__agreement input:checked + .booking-policy-details__checkbox svg { opacity: 1; }
.booking-policy-details__agreement input:focus-visible + .booking-policy-details__checkbox { outline: 3px solid rgb(27 86 137 / 24%); outline-offset: 2px; }
.booking-policy-details__agreement button { padding: 0; border: 0; background: transparent; color: #30302e; font: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }

.booking-policy-details.is-compact .booking-policy-detail-rule { min-height: 52px; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 9px; }
.booking-policy-details.is-compact .booking-policy-detail-rule__icon { width: 19px; height: 19px; }
.booking-policy-details.is-compact .booking-policy-detail-rule strong { font-size: 13px; }
.booking-policy-details.is-compact .booking-policy-detail-rule__status { min-height: 27px; padding: 4px 10px; font-size: 11px; }
.booking-policy-details.is-compact .booking-policy-details__notice { margin-top: 15px; padding: 11px 12px; border-radius: 13px; }
.booking-policy-details.is-compact .booking-policy-details__notice p { font-size: 11px; }
.booking-policy-details.is-compact .booking-policy-details__agreement { margin-bottom: 0; font-size: 11px; line-height: 19px; }
.booking-policy-details.is-compact .booking-policy-details__checkbox { width: 19px; height: 19px; }

@media (max-width: 600px) {
  .booking-policy-detail-rule { min-height: 58px; grid-template-columns: 23px minmax(0, 1fr) auto; gap: 9px; }
  .booking-policy-detail-rule__icon { width: 20px; height: 20px; }
  .booking-policy-detail-rule strong { font-size: 13px; }
  .booking-policy-detail-rule__status { min-height: 28px; padding: 4px 10px; font-size: 12px; }
  .booking-policy-details__notice { margin-top: 18px; padding: 12px 13px; }
  .booking-policy-details__notice p, .booking-policy-details__agreement { font-size: 12px; }
}
</style>
