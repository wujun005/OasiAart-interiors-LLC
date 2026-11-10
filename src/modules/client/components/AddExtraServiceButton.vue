<template>
  <button
    type="button"
    class="addon-entry"
    :class="{ 'addon-entry--compact': compact }"
    :disabled="disabled"
    @click="emit('click', $event)"
    @keydown.enter.stop
    @keyup.enter.stop
    @keydown.space.stop
    @keyup.space.stop
  >
    <span class="addon-entry__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="5" /><path d="M12 8v8M8 12h8" /></svg>
    </span>
    <span class="addon-entry__copy">
      <strong>{{ t('client.orderList.addExtra') }}</strong>
      <small>{{ t('client.orderAddons.entryHint') }}</small>
    </span>
    <span class="addon-entry__action" aria-hidden="true">
      <span>{{ t('client.orderAddons.entryAction') }}</span>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
withDefaults(defineProps<{ compact?: boolean; disabled?: boolean }>(), { compact: false, disabled: false })
const emit = defineEmits<{ click: [event: MouseEvent] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped>
.addon-entry { box-sizing: border-box; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 72px; padding: 13px 15px; border: 1px solid #9fd3bf; border-radius: 12px; background: #eefaf4; color: #0d263f; font: inherit; text-align: start; cursor: pointer; transition: border-color .15s, background-color .15s; }
.addon-entry:hover:not(:disabled) { border-color: #70bd9d; background: #e7f7ef; }
.addon-entry:focus-visible { outline: 3px solid #9eddd0; outline-offset: 3px; }
.addon-entry:disabled { opacity: .5; cursor: default; }
.addon-entry__icon { display: grid; flex: 0 0 37px; width: 37px; height: 37px; place-items: center; border: 1px solid #c8e8d8; border-radius: 9px; background: #ffffffc9; color: #11977e; }
.addon-entry__icon svg { width: 23px; height: 23px; }
.addon-entry__copy { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.addon-entry__copy strong { color: #0d263f; font-size: 15px; font-weight: 650; line-height: 1.35; }
.addon-entry__copy small { color: #59746a; font-size: 12px; font-weight: 400; line-height: 1.4; }
.addon-entry__action { display: inline-flex; flex-shrink: 0; align-items: center; gap: 6px; color: #198c76; font-size: 11px; font-weight: 500; white-space: nowrap; }
.addon-entry__action svg { width: 17px; height: 17px; }
.addon-entry--compact { min-height: 68px; padding: 12px; gap: 10px; border-radius: 10px; }
.addon-entry--compact .addon-entry__icon { flex-basis: 33px; width: 33px; height: 33px; border-radius: 8px; }
.addon-entry--compact .addon-entry__icon svg { width: 21px; height: 21px; }
.addon-entry--compact .addon-entry__copy strong { font-size: 14px; }
.addon-entry--compact .addon-entry__copy small { font-size: 11px; }
.addon-entry:dir(rtl) .addon-entry__action svg { transform: rotate(180deg); }
@media (max-width: 520px) { .addon-entry { gap: 10px; min-height: 72px; padding: 12px; }.addon-entry__action { justify-content: center; gap: 0; width: 30px; height: 30px; border-radius: 50%; background: #0d263f; color: #fff; }.addon-entry__action > span { display: none; }.addon-entry__action svg { width: 17px; height: 17px; }.addon-entry--compact { min-height: 68px; } }
@media (prefers-reduced-motion: reduce) { .addon-entry { transition: none; } }
</style>
