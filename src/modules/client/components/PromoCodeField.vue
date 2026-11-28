<template>
  <div class="promo-code">
    <div
      class="promo-code__ticket"
      :class="{ 'promo-code__ticket--closed': !expanded && !appliedCode }"
    >
      <div class="promo-code__header">
        <svg
          class="promo-code__icon"
          viewBox="0 0 32 26"
          fill="none"
          aria-hidden="true"
        >
          <rect x="9" y="6" width="14" height="14" rx="4" fill="#CFF0DC" />
          <path
            d="M5.5 3.5h21a3 3 0 0 1 3 3v2a4.5 4.5 0 0 0 0 9v2a3 3 0 0 1-3 3h-21a3 3 0 0 1-3-3v-2a4.5 4.5 0 0 0 0-9v-2a3 3 0 0 1 3-3Z"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
          <path d="m12.75 17 6.5-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="13.2" cy="10.2" r="1.4" stroke="currentColor" stroke-width="1.3" />
          <circle cx="18.8" cy="15.8" r="1.4" stroke="currentColor" stroke-width="1.3" />
        </svg>

        <button
          v-if="!expanded && !appliedCode"
          ref="trigger"
          class="promo-code__trigger"
          type="button"
          aria-expanded="false"
          @click="openEntry"
        >
          <span class="promo-code__title">{{ t('client.productDetail.booking.promoAdd') }}</span>
          <span class="promo-code__stub" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="m8 5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </button>

        <template v-else>
          <div v-if="appliedCode" class="promo-code__applied">
            <strong class="promo-code__title">{{ appliedCode }}</strong>
            <small class="promo-code__status">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" fill="currentColor" />
                <path d="m5 8 2 2 4-4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ t('client.productDetail.booking.promoApplied') }}
            </small>
          </div>
          <label v-else class="promo-code__title" :for="inputId">
            {{ t('client.productDetail.booking.promoPlaceholder') }}
          </label>
          <button
            v-if="appliedCode"
            class="promo-code__stub promo-code__action"
            type="button"
            @click="removeCode"
          >
            {{ t('client.productDetail.booking.promoRemove') }}
          </button>
          <button
            v-else
            class="promo-code__stub promo-code__action"
            type="button"
            :disabled="loading"
            @click="closeEntry"
          >
            {{ t('client.productDetail.booking.promoCancel') }}
          </button>
        </template>
      </div>

      <div v-if="expanded && !appliedCode" class="promo-code__entry" :aria-busy="loading">
        <input
          :id="inputId"
          ref="input"
          :value="modelValue"
          type="text"
          autocomplete="off"
          autocapitalize="characters"
          :spellcheck="false"
          :placeholder="t('client.productDetail.booking.promoEnter')"
          :disabled="loading"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="error ? errorId : undefined"
          @input="onInput"
          @keydown.enter.prevent="applyCode"
        />
        <button type="button" :disabled="loading || !modelValue.trim()" @click="applyCode">
          {{ loading ? t('client.profile.actions.submitting') : t('client.productDetail.booking.promoApply') }}
        </button>
      </div>
    </div>

    <div aria-live="polite">
      <p v-if="error && (expanded || appliedCode)" :id="errorId" class="promo-code__error">{{ error }}</p>
      <p v-else-if="notice" class="promo-code__notice">{{ notice }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  loading?: boolean
  error?: string
  notice?: string
  appliedCode?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  apply: []
  remove: []
}>()

const { t } = useI18n({ useScope: 'global' })
const inputId = `voucher-${useId()}`
const errorId = `${inputId}-error`
const expanded = ref(Boolean(props.modelValue))
const input = ref<HTMLInputElement>()
const trigger = ref<HTMLButtonElement>()

watch(() => props.appliedCode, (code) => {
  if (code) expanded.value = false
})

const openEntry = async () => {
  expanded.value = true
  await nextTick()
  input.value?.focus({ preventScroll: true })
}

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const applyCode = () => {
  if (!props.loading && props.modelValue.trim()) emit('apply')
}

const closeEntry = async () => {
  expanded.value = false
  emit('update:modelValue', '')
  await nextTick()
  trigger.value?.focus({ preventScroll: true })
}

const removeCode = async () => {
  emit('remove')
  await nextTick()
  trigger.value?.focus({ preventScroll: true })
}
</script>

<style scoped>
.promo-code {
  --voucher-ink: #086946;
  --voucher-text: #112434;
  --voucher-border: #b8dfc9;
  --voucher-height: 52px;
  --voucher-gutter: 14px;
}

.promo-code__ticket {
  position: relative;
  border: 1px solid var(--voucher-border);
  border-radius: 13px;
  background: linear-gradient(110deg, #f2fbf5, #e8f7ef);
  color: var(--voucher-text);
  transition: background-color 150ms ease, border-color 150ms ease;
}

@media (hover: hover) {
  .promo-code__ticket--closed:hover {
    border-color: #80bb9d;
    background: #e8f7ef;
  }

  .promo-code__action:hover:not(:disabled) {
    background: #dff1e6;
  }
}

.promo-code__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: var(--voucher-height);
  padding-inline-start: var(--voucher-gutter);
}

.promo-code__icon {
  width: 32px;
  height: 26px;
  color: var(--voucher-ink);
}

.promo-code__trigger {
  grid-column: 2 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: var(--voucher-height);
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: start;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.promo-code__trigger::after {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  content: '';
}

.promo-code__trigger:focus {
  outline: none;
}

.promo-code__trigger:focus-visible::after {
  outline: 2px solid var(--voucher-ink);
  outline-offset: 2px;
}

.promo-code__title {
  display: block;
  padding-block: 5px;
  color: var(--voucher-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.promo-code__stub {
  box-sizing: border-box;
  display: grid;
  align-self: stretch;
  place-items: center;
  min-width: 46px;
  min-height: var(--voucher-height);
  padding: 0 12px;
  border: 0;
  border-inline-start: 1px dashed #a5cdb8;
  border-radius: 0 12px 12px 0;
  background: transparent;
  color: var(--voucher-ink);
}

.promo-code__stub svg {
  width: 18px;
  height: 18px;
}

.promo-code__action {
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.promo-code__applied {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  min-width: 0;
  padding-block: 6px;
}

.promo-code__applied .promo-code__title {
  padding-block: 0;
  min-width: 0;
}

.promo-code__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--voucher-ink);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.25;
}

.promo-code__status svg {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
}

.promo-code__entry {
  display: flex;
  gap: 8px;
  padding: 0 var(--voucher-gutter) var(--voucher-gutter);
}

.promo-code__entry input {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  min-height: 44px;
  padding: 0 10px;
  border: 1px solid #b8d8c7;
  border-radius: 8px;
  background: #fff;
  color: var(--voucher-text);
  font: inherit;
  font-size: 16px;
}

.promo-code__entry input::placeholder {
  color: #5b7168;
}

.promo-code__entry input[aria-invalid="true"] {
  border-color: #b53f34;
}

.promo-code__entry button {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: var(--voucher-ink);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.promo-code__entry button:disabled,
.promo-code__action:disabled {
  cursor: default;
  opacity: 0.55;
}

.promo-code__entry input:focus,
.promo-code__entry button:focus-visible,
.promo-code__action:focus-visible {
  outline: 2px solid var(--voucher-ink);
  outline-offset: 2px;
}

.promo-code__action:focus-visible {
  outline-offset: -3px;
}

.promo-code__error,
.promo-code__notice {
  margin: 6px 2px 0;
  font-size: 12px;
  line-height: 1.4;
}

.promo-code__error {
  color: #a9342c;
}

.promo-code__notice {
  color: #596d65;
}

@media (max-width: 600px) {
  .promo-code {
    --voucher-height: 48px;
    --voucher-gutter: 12px;
  }

  .promo-code__icon {
    width: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo-code__ticket {
    transition: none;
  }
}
</style>
