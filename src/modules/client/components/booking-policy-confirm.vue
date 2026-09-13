<template>
  <Teleport to="body">
    <Transition name="booking-policy-fade">
      <div
        v-if="modelValue"
        class="booking-policy-overlay"
        role="presentation"
        @mousedown.self="close"
      >
        <section
          ref="panelRef"
          class="booking-policy-card"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @keydown.esc="close"
        >
          <header class="booking-policy-card__header">
            <div>
              <h2 :id="titleId">{{ copy.title }}</h2>
              <p>{{ copy.subtitle }}</p>
            </div>
            <button
              class="booking-policy-card__close"
              type="button"
              :disabled="submitting"
              :aria-label="copy.close"
              @click="close"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <BookingPolicyDetails
            :agreed="agreed"
            @update:agreed="$emit('update:agreed', $event)"
            @read-policy="$emit('read-policy')"
          />

          <button
            class="booking-policy-card__continue"
            type="button"
            :disabled="!agreed || submitting"
            @click="$emit('continue')"
          >
            <span v-if="submitting" class="booking-policy-card__spinner" />
            {{ submitting ? copy.processing : copy.continue }}
          </button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import BookingPolicyDetails from "@/modules/client/components/booking-policy-details.vue"

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    agreed: boolean
    submitting?: boolean
    context?: "payment" | "cancellation"
  }>(),
  {
    submitting: false,
    context: "payment",
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "update:agreed": [value: boolean]
  "read-policy": []
  continue: []
}>()

const { locale } = useI18n({ useScope: "global" })
const panelRef = ref<HTMLElement | null>(null)
const titleId = `booking-policy-${Math.random().toString(36).slice(2)}`
let previousOverflow = ""

const isZh = computed(() => String(locale.value).startsWith("zh"))
const copy = computed(() =>
  isZh.value
    ? {
        title: "确认前请知悉",
        subtitle: "如果您的计划有变，以下规则将适用。",
        close: "关闭",
        processing: "处理中...",
        continue:
          props.context === "cancellation"
            ? "同意并继续取消"
            : "同意并继续支付",
      }
    : {
        title: "Before you confirm",
        subtitle: "Here’s what happens if your plans change.",
        close: "Close",
        processing: "Processing...",
        continue:
          props.context === "cancellation"
            ? "Agree and continue"
            : "Agree and continue to payment",
      },
)

const close = () => {
  if (!props.submitting) {
    emit("update:modelValue", false)
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      void nextTick(() => panelRef.value?.focus())
    } else {
      document.body.style.overflow = previousOverflow
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
})
</script>

<style scoped lang="scss">
.booking-policy-overlay {
  position: fixed;
  inset: 0;
  z-index: 3600;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 18px;
  background: rgba(24, 24, 24, 0.54);
}

.booking-policy-card {
  width: min(580px, 100%);
  max-height: calc(100dvh - 36px);
  overflow: auto;
  box-sizing: border-box;
  padding: 32px 38px 30px;
  border: 1px solid #d7d7d3;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  color: #171717;
  outline: none;
}

.booking-policy-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.booking-policy-card__header h2 {
  margin: 0;
  color: #090909;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.booking-policy-card__header p {
  margin: 5px 0 0;
  color: #565656;
  font-size: 15px;
  line-height: 1.45;
}

.booking-policy-card__close {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  margin: -5px -8px 0 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #777;
  cursor: pointer;
}

.booking-policy-card__close:hover:not(:disabled) {
  background: #f3f3f1;
  color: #111;
}

.booking-policy-card__close svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.7;
}

.booking-policy-card__continue {
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 20px;
  border: 0;
  border-radius: 10px;
  background: #080808;
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 750;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.booking-policy-card__continue:hover:not(:disabled) {
  background: #222;
  transform: translateY(-1px);
}

.booking-policy-card__continue:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.booking-policy-card__spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: booking-policy-spin 0.75s linear infinite;
}

.booking-policy-fade-enter-active,
.booking-policy-fade-leave-active {
  transition: opacity 0.18s ease;
}

.booking-policy-fade-enter-active .booking-policy-card,
.booking-policy-fade-leave-active .booking-policy-card {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.booking-policy-fade-enter-from,
.booking-policy-fade-leave-to {
  opacity: 0;
}

.booking-policy-fade-enter-from .booking-policy-card,
.booking-policy-fade-leave-to .booking-policy-card {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

@keyframes booking-policy-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .booking-policy-overlay {
    padding: 10px;
  }

  .booking-policy-card {
    max-height: calc(100dvh - 20px);
    padding: 24px 20px 22px;
    border-radius: 22px;
  }

  .booking-policy-card__header {
    margin-bottom: 17px;
  }

  .booking-policy-card__header h2 {
    font-size: 22px;
  }

  .booking-policy-card__header p {
    font-size: 13px;
  }

  .booking-policy-card__continue {
    min-height: 52px;
    font-size: 14px;
  }
}
</style>
