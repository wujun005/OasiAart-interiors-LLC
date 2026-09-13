<template>
  <section class="cancellation-card" role="dialog" aria-modal="true" :aria-label="titleText">
    <template v-if="!confirmed">
      <header class="cancellation-card__header">
        <div>
          <h2>{{ titleText }}</h2>
          <p>{{ bookingSummary }}</p>
        </div>
        <button type="button" class="cancellation-card__close" :disabled="submitting" aria-label="Close" @click="$emit('close')">×</button>
      </header>

      <div class="cancellation-card__body">
        <p class="cancellation-card__helper">{{ helperText }}</p>

        <div class="cancellation-card__reasons">
          <label
            v-for="item in reasons"
            :key="item.value"
            :class="{ 'is-selected': item.value === reason }"
          >
            <input
              :checked="item.value === reason"
              type="radio"
              name="cancellation-reason"
              :value="item.value"
              :disabled="submitting"
              @change="$emit('update:reason', item.value)"
            />
            <span>{{ item.label }}</span>
          </label>
        </div>

        <textarea
          v-if="selectedReason?.remarkRequired"
          :value="otherReason"
          maxlength="300"
          :disabled="submitting"
          :placeholder="otherReasonPlaceholder"
          @input="$emit('update:otherReason', ($event.target as HTMLTextAreaElement).value)"
        />

        <div v-if="showReschedule" class="cancellation-card__nudge">
          <div>
            <span aria-hidden="true">📅</span>
            <span>{{ rescheduleHint }}</span>
          </div>
          <button type="button" :disabled="submitting" @click="$emit('reschedule')">
            {{ isZh ? "改为调整时间" : "Reschedule Instead" }}
          </button>
        </div>

        <p v-else class="cancellation-card__apology">{{ apologyText }}</p>

      </div>

      <footer class="cancellation-card__footer">
        <button type="button" class="is-secondary" :disabled="submitting" @click="$emit('close')">
          {{ isZh ? "保留预订" : "Keep Booking" }}
        </button>
        <button type="button" class="is-primary" :disabled="submitting" @click="$emit('confirm')">
          {{ submitting ? (isZh ? "提交中…" : "Submitting…") : (isZh ? "确认取消" : "Confirm Cancellation") }}
        </button>
      </footer>
    </template>

    <div v-else class="cancellation-card__confirmed">
      <div class="cancellation-card__confirmed-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
      </div>
      <h2>{{ isZh ? "您的预订已取消" : "Your booking has been cancelled" }}</h2>
      <p>{{ confirmedText }}</p>
      <button type="button" @click="$emit('done')">{{ isZh ? "完成" : "Done" }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"

export type CancellationReasonOption = {
  value: string
  label: string
  remarkRequired: boolean
}

const props = defineProps<{
  locale: string
  reasons: CancellationReasonOption[]
  reason: string
  otherReason: string
  serviceName?: string
  schedule?: string
  amountText?: string
  mode: "refund" | "cancel"
  submitting: boolean
  confirmed: boolean
}>()

defineEmits<{
  close: []
  done: []
  confirm: []
  reschedule: []
  "update:reason": [value: string]
  "update:otherReason": [value: string]
}>()

const isZh = computed(() => props.locale.startsWith("zh"))
const selectedReason = computed(() =>
  props.reasons.find((item) => item.value === props.reason),
)
const showReschedule = computed(() =>
  ["CHANGE_DATE_OR_TIME", "SERVICE_TIME_NO_LONGER_WORKS"].includes(props.reason),
)
const titleText = computed(() => isZh.value ? "取消这个预订？" : "Cancel this booking?")
const bookingSummary = computed(() =>
  [props.serviceName, props.schedule].map((item) => String(item || "").trim()).filter(Boolean).join(" · "),
)
const helperText = computed(() => isZh.value
  ? "帮助我们改进——请告诉我们您取消的原因。"
  : "Help us improve — tell us why you're cancelling.")
const otherReasonPlaceholder = computed(() => isZh.value ? "请填写取消原因" : "Tell us why you are cancelling")
const rescheduleHint = computed(() => isZh.value
  ? "看起来更换日期或时间就能解决，无需取消后重新预订。"
  : "Sounds like a new date/time would fix this — no need to cancel and rebook.")
const apologyText = computed(() => {
  const zh: Record<string, string> = {
    PLANS_CHANGED: "很遗憾您的计划发生了变化，希望很快能再次为您服务。",
    SERVICE_PROVIDER_CONCERN: "很抱歉这次我们未能成为合适的选择，希望还有机会再次为您服务。",
    PRICE_CONCERN: "很抱歉本次价格未能符合您的预期。",
    OTHER: "很遗憾看到您离开，如愿意，也欢迎告诉我们更多。",
  }
  const en: Record<string, string> = {
    PLANS_CHANGED: "We're sorry your plans changed — hope to see you again soon.",
    SERVICE_PROVIDER_CONCERN: "Sorry we weren't the right fit this time — we'd love another chance.",
    PRICE_CONCERN: "Sorry the pricing didn't work for you this time.",
    OTHER: "Sorry to see you go — we'd love to hear more if you'd like to share.",
  }
  const values = isZh.value ? zh : en
  return values[props.reason] || values.OTHER || ""
})
const confirmedText = computed(() => {
  if (props.mode === "cancel") {
    return isZh.value
      ? "取消确认信息将发送至您的邮箱。"
      : "A cancellation confirmation will be sent to your email."
  }
  return isZh.value
    ? `退款 ${props.amountText || ""} 将在 5–7 个工作日内原路退回。`
    : `A refund of ${props.amountText || ""} will be returned to your original payment method within 5–7 business days.`
})
</script>

<style scoped>
.cancellation-card { width: 100%; max-width: 420px; overflow: hidden; border-radius: 16px; background: #fff; color: #111; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25); font-family: Arial, Helvetica, sans-serif; }
.cancellation-card__header { padding: 20px 24px 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.cancellation-card__header h2 { margin: 0 0 4px; color: #111; font-size: 18px; line-height: 1.3; }
.cancellation-card__header p { margin: 0; color: #6b6b70; font-size: 13px; line-height: 1.45; }
.cancellation-card__close { padding: 4px; border: 0; background: none; color: #8a8a90; font-size: 20px; line-height: 1; cursor: pointer; }
.cancellation-card__body { padding: 16px 24px 0; }
.cancellation-card__helper { margin: 0 0 12px; color: #6b6b70; font-size: 13px; }
.cancellation-card__reasons { display: flex; flex-direction: column; gap: 8px; }
.cancellation-card__reasons label { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid #dddde1; border-radius: 10px; background: #fff; color: #111; font-size: 14px; line-height: 1.35; cursor: pointer; }
.cancellation-card__reasons label.is-selected { border-color: #2b6cb0; background: #eaf2fe; }
.cancellation-card__reasons input { width: 16px; height: 16px; flex: 0 0 auto; margin: 0; accent-color: #111; }
.cancellation-card__body > textarea { width: 100%; min-height: 76px; margin-top: 10px; padding: 10px 12px; resize: vertical; border: 1px solid #dddde1; border-radius: 10px; color: #111; font: inherit; font-size: 13px; box-sizing: border-box; }
.cancellation-card__nudge { margin-top: 12px; padding: 12px 14px; border-radius: 10px; background: #eaf2fe; color: #1d5fa6; font-size: 13px; }
.cancellation-card__nudge > div { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px; line-height: 1.45; }
.cancellation-card__nudge button { width: 100%; padding: 10px; border: 0; border-radius: 8px; background: #111; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
.cancellation-card__apology { margin: 12px 0 0; padding: 10px 2px; color: #6b6b70; font-size: 13px; font-style: italic; line-height: 1.45; }
.cancellation-card__footer { padding: 20px 24px 24px; display: flex; gap: 10px; margin-top: 4px; }
.cancellation-card__footer button { flex: 1; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; }
.cancellation-card__footer .is-secondary { border: 1px solid #dddde1; background: #fff; color: #111; }
.cancellation-card__footer .is-primary { border: 0; background: #111; color: #fff; }
.cancellation-card__footer .is-primary:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }
.cancellation-card__confirmed { padding: 40px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.cancellation-card__confirmed-icon { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: #eaf2fe; color: #2b6cb0; }
.cancellation-card__confirmed-icon svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.cancellation-card__confirmed h2 { margin: 0; color: #111; font-size: 17px; }
.cancellation-card__confirmed p { max-width: 280px; margin: 0; color: #6b6b70; font-size: 13px; line-height: 1.5; }
.cancellation-card__confirmed button { width: 100%; margin-top: 10px; padding: 12px; border: 1px solid #dddde1; border-radius: 10px; background: #fff; color: #111; font-size: 14px; font-weight: 500; cursor: pointer; }
@media (max-width: 480px) { .cancellation-card { max-width: none; border-radius: 16px 16px 0 0; box-shadow: none; } .cancellation-card__header { padding: 18px 18px 0; } .cancellation-card__body { padding: 14px 18px 0; } .cancellation-card__footer { padding: 18px; } }
</style>
