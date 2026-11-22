<template>
  <div class="promo-code">
    <button
      v-if="!expanded && !appliedCode"
      class="promo-code__add"
      type="button"
      @click="expanded = true"
    >
      <span class="promo-code__tag" aria-hidden="true">%</span>
      {{ t('client.productDetail.booking.promoAdd') }}
    </button>

    <div v-else-if="appliedCode" class="promo-code__applied">
      <span class="promo-code__tag" aria-hidden="true">%</span>
      <span class="promo-code__applied-copy">
        <strong>{{ appliedCode }}</strong>
        <small>{{ t('client.productDetail.booking.promoApplied') }}</small>
      </span>
      <button type="button" @click="emit('remove')">
        {{ t('client.productDetail.booking.promoRemove') }}
      </button>
    </div>

    <div v-else class="promo-code__entry">
      <div class="promo-code__row">
        <input
          :value="modelValue"
          type="text"
          autocomplete="off"
          autocapitalize="characters"
          :placeholder="t('client.productDetail.booking.promoPlaceholder')"
          :disabled="loading"
          @input="onInput"
          @keydown.enter.prevent="emit('apply')"
        />
        <button type="button" :disabled="loading || !modelValue.trim()" @click="emit('apply')">
          {{ loading ? t('client.profile.actions.submitting') : t('client.productDetail.booking.promoApply') }}
        </button>
      </div>
      <button class="promo-code__cancel" type="button" :disabled="loading" @click="closeEntry">
        {{ t('client.productDetail.booking.promoCancel') }}
      </button>
    </div>

    <p v-if="error && (expanded || appliedCode)" class="promo-code__error">{{ error }}</p>
    <p v-else-if="notice" class="promo-code__notice">{{ notice }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
const expanded = ref(Boolean(props.modelValue))

watch(() => props.appliedCode, (code) => {
  if (code) expanded.value = false
})

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const closeEntry = () => {
  expanded.value = false
  emit('update:modelValue', '')
}
</script>

<style scoped>
.promo-code {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.promo-code__add,
.promo-code__applied,
.promo-code__cancel {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.promo-code__add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 0;
  color: var(--hourx-client-text, #17324d);
  font-size: 14px;
  font-weight: 700;
}

.promo-code__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  color: #fff;
  background: #0f7a4a;
  font-size: 12px;
  font-weight: 800;
}

.promo-code__applied {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 6px 8px 6px 10px;
  border: 1px solid #cdeadb;
  border-radius: 10px;
  background: #f3fbf6;
  text-align: left;
}

.promo-code__applied-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.promo-code__applied-copy strong {
  color: var(--hourx-client-text, #17324d);
  font-size: 13px;
}

.promo-code__applied-copy small {
  color: #0f7a4a;
  font-size: 12px;
}

.promo-code__applied > button,
.promo-code__cancel {
  color: #64748b;
  font-size: 13px;
  font-weight: 650;
}

.promo-code__cancel {
  width: fit-content;
  padding: 0;
}

.promo-code__row {
  display: flex;
  align-items: stretch;
  min-height: 40px;
  overflow: hidden;
  border: 1px solid #d7dee8;
  border-radius: 10px;
  background: #fff;
}

.promo-code__row input {
  flex: 1;
  min-width: 0;
  border: 0;
  padding: 0 12px;
  color: var(--hourx-client-text, #1d2430);
  background: transparent;
  font: inherit;
  font-size: 14px;
}

.promo-code__row input:focus {
  outline: none;
}

.promo-code__row button {
  flex: 0 0 auto;
  border: 0;
  padding: 0 16px;
  color: #fff;
  background: var(--hourx-client-text, #17324d);
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}

.promo-code__row button:disabled,
.promo-code__cancel:disabled {
  cursor: default;
  opacity: 0.55;
}

.promo-code__error,
.promo-code__notice {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.promo-code__error {
  color: #c0392b;
}

.promo-code__notice {
  color: #8a8378;
}
</style>
