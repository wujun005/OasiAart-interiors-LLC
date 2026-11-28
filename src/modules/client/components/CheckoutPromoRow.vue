<template>
  <div class="pay-promo" :class="{ 'pay-promo--ticket': ticket }">
    <div v-if="appliedCode" class="pay-promo__applied">
      <span class="pay-promo__name">
        {{ t('client.orderConfirm.summary.promo') }}
        <em>{{ appliedCode }}</em>
      </span>
      <span class="pay-promo__value">
        <strong v-if="discount > 0">-{{ formatAed(discount) }}</strong>
        <button type="button" :disabled="loading" @click="emit('remove')">
          {{ t('client.orderConfirm.summary.promoRemove') }}
        </button>
      </span>
      <p v-if="error" class="pay-promo__error" role="alert">{{ error }}</p>
    </div>

    <form v-else-if="open" class="pay-promo__entry" @submit.prevent="submit">
      <label class="pay-promo__field">
        <span class="pay-promo__sr">{{ t('client.orderConfirm.summary.promo') }}</span>
        <input
          ref="inputRef"
          :value="modelValue"
          type="text"
          autocomplete="off"
          autocapitalize="characters"
          :spellcheck="false"
          :placeholder="t('client.orderConfirm.summary.promoPlaceholder')"
          :disabled="loading"
          :aria-invalid="error ? true : undefined"
          @input="onInput"
        />
        <button type="submit" :disabled="loading || !modelValue.trim()">
          {{ loading ? t('client.profile.actions.submitting') : t('client.orderConfirm.summary.promoApply') }}
        </button>
      </label>
      <button class="pay-promo__dismiss" type="button" :disabled="loading" @click="close">
        {{ t('client.orderConfirm.summary.promoCancel') }}
      </button>
      <p v-if="error" class="pay-promo__error" role="alert">{{ error }}</p>
      <p v-else-if="notice" class="pay-promo__notice">{{ notice }}</p>
    </form>

    <div v-else class="pay-promo__closed">
      <button
        ref="entryButton"
        class="pay-promo__row"
        type="button"
        aria-expanded="false"
        @click="openEntry"
      >
        <span class="pay-promo__title">
          <span v-if="ticket" class="pay-promo__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18v3.5a2.5 2.5 0 0 0 0 5V18H3v-3.5a2.5 2.5 0 0 0 0-5V6Z" />
              <path d="M15.5 6v2m0 3v2m0 3v2" />
            </svg>
          </span>
          <span>{{ t('client.orderConfirm.summary.promo') }}</span>
        </span>
        <span class="pay-promo__action">
          {{ t('client.orderConfirm.summary.promoEnter') }}
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
      <p v-if="notice" class="pay-promo__notice">{{ notice }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  loading?: boolean
  error?: string
  notice?: string
  appliedCode?: string
  discount?: number
  ticket?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  apply: []
  remove: []
}>()

const { t } = useI18n({ useScope: 'global' })
const open = ref(false)
const inputRef = ref<HTMLInputElement>()
const entryButton = ref<HTMLButtonElement>()

watch(() => props.appliedCode, (code) => {
  if (code) open.value = false
})

const formatAed = (value: number) => `AED ${Number(value || 0).toFixed(2)}`

const openEntry = async () => {
  open.value = true
  await nextTick()
  inputRef.value?.focus({ preventScroll: true })
}

const close = async () => {
  open.value = false
  emit('update:modelValue', '')
  await nextTick()
  entryButton.value?.focus({ preventScroll: true })
}

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const submit = () => {
  if (!props.loading && props.modelValue.trim()) emit('apply')
}
</script>

<style scoped>
.pay-promo__row,
.pay-promo__applied {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  align-items: center;
  width: 100%;
  min-height: 28px;
  color: inherit;
  font: inherit;
  text-align: start;
}

.pay-promo__applied .pay-promo__error {
  grid-column: 1 / -1;
}

.pay-promo__row {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.pay-promo__action {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #17375c;
  font-weight: 700;
}

.pay-promo__action svg {
  width: 14px;
  height: 14px;
}

.pay-promo__name {
  min-width: 0;
  color: inherit;
}

.pay-promo__name em {
  margin-inline-start: 6px;
  color: #17375c;
  font-style: normal;
  font-weight: 700;
}

.pay-promo__value {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.pay-promo__value strong {
  color: #0f7a4a;
  font-weight: 700;
}

.pay-promo__value button,
.pay-promo__dismiss {
  padding: 0;
  border: 0;
  background: none;
  color: #8a5a16;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.pay-promo__dismiss {
  align-self: flex-end;
  width: fit-content;
}

.pay-promo__entry {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pay-promo__field {
  display: flex;
  align-items: stretch;
  min-height: 42px;
  overflow: hidden;
  border: 1px solid #d7dee8;
  border-radius: 10px;
  background: #fff;
}

.pay-promo__field input {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: #172033;
  font: inherit;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pay-promo__field input:focus {
  outline: none;
}

.pay-promo__field button {
  flex: none;
  padding: 0 14px;
  border: 0;
  background: #06182f;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.pay-promo__field button:disabled {
  cursor: default;
  opacity: 0.45;
}

.pay-promo__error,
.pay-promo__notice {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.pay-promo__error {
  color: #b42318;
}

.pay-promo__notice {
  color: #8a5a16;
}

.pay-promo__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.pay-promo--ticket {
  --promo-ink: #664511;
  --promo-border: #debf80;
  --promo-surface: #fff3d8;
  border: 1px solid var(--promo-border);
  border-radius: 12px;
  background: var(--promo-surface);
  color: #172033;
  font-size: 14px;
}

.pay-promo--ticket .pay-promo__row,
.pay-promo--ticket .pay-promo__applied,
.pay-promo--ticket .pay-promo__entry {
  padding: 8px 9px;
}

.pay-promo--ticket .pay-promo__row {
  min-height: 54px;
  gap: 7px;
  border-radius: inherit;
}

.pay-promo--ticket .pay-promo__row:active {
  background: #ffebc0;
}

.pay-promo--ticket .pay-promo__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  line-height: 1.25;
}

.pay-promo__icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 8px;
  background: #f9e5b5;
  color: var(--promo-ink);
}

.pay-promo__icon svg {
  width: 21px;
  height: 21px;
  stroke: currentColor;
  stroke-width: 1.65;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pay-promo--ticket .pay-promo__action {
  justify-content: center;
  min-height: 34px;
  gap: 4px;
  padding-inline: 8px;
  border: 1px solid #dcc895;
  border-radius: 8px;
  background: #fffdfa;
  color: var(--promo-ink);
  font-size: 13px;
  white-space: nowrap;
}

.pay-promo--ticket .pay-promo__row:focus-visible {
  outline: 2px solid var(--promo-ink);
  outline-offset: -2px;
}

.pay-promo--ticket .pay-promo__applied {
  min-height: 54px;
  padding-inline: 12px;
  font-weight: 700;
}

.pay-promo--ticket .pay-promo__name em {
  display: block;
  margin-inline-start: 0;
  overflow-wrap: anywhere;
  color: var(--promo-ink);
}

.pay-promo--ticket .pay-promo__value strong {
  white-space: nowrap;
}

.pay-promo--ticket .pay-promo__value button,
.pay-promo--ticket .pay-promo__dismiss {
  min-height: 36px;
  padding-inline: 4px;
}

.pay-promo--ticket .pay-promo__field {
  min-height: 44px;
  border-color: var(--promo-border);
}

.pay-promo--ticket .pay-promo__field:focus-within {
  outline: 2px solid var(--promo-ink);
  outline-offset: -2px;
}

.pay-promo--ticket .pay-promo__field input {
  font-size: 16px;
}

.pay-promo--ticket .pay-promo__closed .pay-promo__notice {
  padding: 0 9px 8px;
}
</style>
