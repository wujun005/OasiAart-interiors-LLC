<template>
  <section class="booking-policy-details" :class="{ 'is-compact': compact }">
    <header v-if="showIntro" class="booking-policy-details__intro">
      <h3>{{ copy.title }}</h3>
      <p>{{ copy.subtitle }}</p>
    </header>

    <div class="booking-policy-details__table">
      <div class="booking-policy-details__head">
        <span>{{ copy.colWhen }}</span>
        <span>{{ copy.colReschedule }}</span>
        <span>{{ copy.colRefund }}</span>
      </div>
      <div v-for="row in rows" :key="row.key" class="booking-policy-details__row">
        <strong>{{ row.when }}</strong>
        <p><small>{{ copy.colReschedule }}</small>{{ row.reschedule }}</p>
        <p><small>{{ copy.colRefund }}</small>{{ row.refund }}</p>
      </div>
    </div>

    <div class="booking-policy-details__notice">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      <div>
        <p>{{ copy.noticeFee }}</p>
        <p>{{ copy.noticeReschedule }}</p>
      </div>
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
  subtitle: '时间以已确认的服务开始时间计算。2 小时与 3 小时规则重叠时，以 2 小时规则为准。',
  colWhen: '申请时间或情形',
  colReschedule: '改期',
  colRefund: '取消及退款',
  noticeFee: '符合退款的客户取消，按实付金额扣除 3.9% + AED 1 的支付处理费，不另收平台取消费。确认取消前会展示处理费和预计退款金额，退款不低于 AED 0。',
  noticeReschedule: '免费改期取决于可预约时段和人员安排。新服务时间经 HourX 确认后才生效。',
  agreementLead: '我已阅读并同意 HourX 的',
  policyName: '取消、改期与退款政策',
} : {
  title: 'Before you confirm',
  subtitle: 'Times are measured from the confirmed service start. If the two-hour and three-hour windows overlap, the two-hour rule applies.',
  colWhen: 'When',
  colReschedule: 'Reschedule',
  colRefund: 'Cancel & refund',
  noticeFee: 'A refundable customer cancellation deducts a 3.9% + AED 1 processing fee from the amount paid. There is no extra platform cancellation fee. The fee and estimated refund are shown before you confirm, and the refund cannot be below AED 0.',
  noticeReschedule: 'Free rescheduling depends on open time slots and staffing. A new time applies only after HourX confirms it.',
  agreementLead: 'I’ve read & agree to HourX’s',
  policyName: 'cancellation, rescheduling & refund policy',
});

const rows = computed(() => isZh.value ? [
  {
    key: 'within-three-hours',
    when: '下单后，服务开始前 3 小时内',
    reschedule: '免费改期',
    refund: '不收平台取消费；退还实付金额，扣除支付处理费。',
  },
  {
    key: 'within-two-hours',
    when: '服务开始前 2 小时内',
    reschedule: '可申请免费改期，新时间须经 HourX 确认。',
    refund: '仅接受改期，不支持取消退款。',
  },
  {
    key: 'provider-unable',
    when: '服务商或 HourX 无法提供服务',
    reschedule: '客户可选择改期',
    refund: '选择取消时全额退还实付金额，处理费由 HourX 承担。',
  },
  {
    key: 'service-started',
    when: '服务已经开始',
    reschedule: '不可改期',
    refund: '不可取消，不退款。',
  },
] : [
  {
    key: 'within-three-hours',
    when: 'After booking, within 3 hours before the service starts',
    reschedule: 'Free',
    refund: 'No platform fee. Refund the amount paid, minus the processing fee.',
  },
  {
    key: 'within-two-hours',
    when: 'Within 2 hours before the service starts',
    reschedule: 'Free request. The new time needs HourX confirmation.',
    refund: 'Reschedule only. No cancellation refund.',
  },
  {
    key: 'provider-unable',
    when: 'Provider or HourX cannot deliver the service',
    reschedule: 'You may choose to reschedule',
    refund: 'A full refund of the amount paid. HourX bears the processing fee.',
  },
  {
    key: 'service-started',
    when: 'Service has already started',
    reschedule: 'Unavailable',
    refund: 'Cancellation unavailable. No refund.',
  },
]);

const updateAgreement = (event: Event) => {
  emit('update:agreed', (event.target as HTMLInputElement).checked);
};
</script>

<style scoped lang="scss">
.booking-policy-details__intro { margin-bottom: 15px; }
.booking-policy-details__intro h3 { margin: 0; color: #090909; font-size: 20px; line-height: 1.25; font-weight: 800; }
.booking-policy-details__intro p { margin: 4px 0 0; color: #565656; font-size: 13px; line-height: 1.45; }
.booking-policy-details__table { border-top: 1px solid #e5e5e2; }
.booking-policy-details__head,
.booking-policy-details__row { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.9fr) minmax(0, 1.15fr); gap: 10px; }
.booking-policy-details__head { padding: 8px 0; color: #6b6b66; font-size: 11px; font-weight: 700; }
.booking-policy-details__row { padding: 10px 0; border-top: 1px solid #e5e5e2; color: #3d3d3b; font-size: 12px; line-height: 1.45; }
.booking-policy-details__row strong { color: #262626; font-size: 13px; line-height: 1.4; font-weight: 700; }
.booking-policy-details__row p { margin: 0; }
.booking-policy-details__row small { display: none; }
.booking-policy-details__notice { display: flex; align-items: flex-start; gap: 10px; margin-top: 16px; padding: 14px 16px; border: 1px solid #e1e1de; border-radius: 18px; color: #484844; }
.booking-policy-details__notice > svg { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 1px; fill: none; stroke: #777771; stroke-linecap: round; stroke-width: 1.7; }
.booking-policy-details__notice p { margin: 0; font-size: 13px; line-height: 1.45; }
.booking-policy-details__notice p + p { margin-top: 6px; }
.booking-policy-details__agreement { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 4px; margin-bottom: 17px; color: #3d3d3b; font-size: 13px; line-height: 22px; }
.booking-policy-details__agreement label { display: inline-flex; align-items: flex-start; gap: 9px; cursor: pointer; }
.booking-policy-details__agreement input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
.booking-policy-details__checkbox { width: 21px; height: 21px; flex: 0 0 auto; display: grid; place-items: center; box-sizing: border-box; border: 2px solid #242424; border-radius: 3px; background: #fff; transition: background .15s ease; }
.booking-policy-details__checkbox svg { width: 16px; height: 16px; fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.4; opacity: 0; }
.booking-policy-details__agreement input:checked + .booking-policy-details__checkbox { background: #0a0a0a; }
.booking-policy-details__agreement input:checked + .booking-policy-details__checkbox svg { opacity: 1; }
.booking-policy-details__agreement input:focus-visible + .booking-policy-details__checkbox { outline: 3px solid rgb(27 86 137 / 24%); outline-offset: 2px; }
.booking-policy-details__agreement button { padding: 0; border: 0; background: transparent; color: #30302e; font: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }

.booking-policy-details.is-compact .booking-policy-details__head,
.booking-policy-details.is-compact .booking-policy-details__row { grid-template-columns: 1fr; gap: 4px; }
.booking-policy-details.is-compact .booking-policy-details__head { display: none; }
.booking-policy-details.is-compact .booking-policy-details__row { padding: 10px 0; }
.booking-policy-details.is-compact .booking-policy-details__row strong { font-size: 13px; }
.booking-policy-details.is-compact .booking-policy-details__row p { font-size: 12px; }
.booking-policy-details.is-compact .booking-policy-details__row small { display: block; margin-bottom: 2px; color: #6b6b66; font-size: 10px; font-weight: 700; }
.booking-policy-details.is-compact .booking-policy-details__notice { margin-top: 12px; padding: 11px 12px; border-radius: 13px; }
.booking-policy-details.is-compact .booking-policy-details__notice p { font-size: 11px; }
.booking-policy-details.is-compact .booking-policy-details__agreement { margin-bottom: 0; font-size: 11px; line-height: 19px; }
.booking-policy-details.is-compact .booking-policy-details__checkbox { width: 19px; height: 19px; }

@media (max-width: 600px) {
  .booking-policy-details__head { display: none; }
  .booking-policy-details__row { grid-template-columns: 1fr; gap: 4px; }
  .booking-policy-details__row small { display: block; margin-bottom: 2px; color: #6b6b66; font-size: 10px; font-weight: 700; }
  .booking-policy-details__notice { margin-top: 14px; padding: 12px 13px; }
  .booking-policy-details__notice p, .booking-policy-details__agreement { font-size: 12px; }
}
</style>
