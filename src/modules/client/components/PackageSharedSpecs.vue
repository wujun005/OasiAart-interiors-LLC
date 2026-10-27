<template>
  <section class="package-shared-specs">
    <header>
      <h3>{{ t('client.home.packages.sharedSpecsTitle') }}</h3>
      <button class="package-shared-specs__toggle" type="button" :disabled="disabled" @click="emit('toggle-separate')">
        {{ t(separate ? 'client.home.packages.useSharedSpecs' : 'client.home.packages.useSeparateSpecs') }}
      </button>
    </header>
    <p v-if="separate" class="package-shared-specs__hint">{{ t('client.home.packages.separateSpecsHint') }}</p>
    <div v-for="group in groups" :key="group.id" class="package-shared-specs__group">
      <strong>{{ group.label }}</strong>
      <div class="package-shared-specs__options" role="radiogroup" :aria-label="group.label">
        <button
          v-for="option in group.options"
          :key="option.id"
          type="button"
          :class="{ 'is-selected': group.selectedId === option.id }"
          :aria-pressed="group.selectedId === option.id"
          :disabled="disabled || option.disabled"
          @click="emit('select', group.id, option.id)"
        >{{ option.label }}</button>
      </div>
      <small v-if="group.serviceNames">{{ t('client.home.packages.sharedServices', { names: group.serviceNames }) }}</small>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SharedSpecGroup } from '@/modules/client/utils/package-shared-specs'

defineProps<{
  groups: Array<SharedSpecGroup & { serviceNames?: string }>
  separate: boolean
  disabled: boolean
}>()
const emit = defineEmits<{
  select: [typeKey: string, valueKey: string]
  'toggle-separate': []
}>()
const { t } = useI18n()
</script>

<style scoped>
.package-shared-specs { margin: 16px 0; padding: 16px; background: #f2f7f7; border: 1px solid #d8e6e6; border-radius: 12px; }
.package-shared-specs header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.package-shared-specs h3 { margin: 0; color: #18384a; font-size: 15px; line-height: 1.4; }
.package-shared-specs__toggle { padding: 3px 0; color: #4b6476; background: transparent; border: 0; font: inherit; font-size: 12px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.package-shared-specs__hint { margin: 6px 0 0; color: #647c89; font-size: 12px; line-height: 1.6; }
.package-shared-specs__group { margin-top: 16px; }
.package-shared-specs__group > strong { color: #29495b; font-size: 12px; font-weight: 600; }
.package-shared-specs__options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 7px; }
.package-shared-specs__options button { padding: 7px 13px; color: #334155; background: #fff; border: 1px solid #ccd9df; border-radius: 999px; font: inherit; font-size: 13px; line-height: 1.4; cursor: pointer; }
.package-shared-specs__options button.is-selected { color: #fff; background: #153b49; border-color: #153b49; font-weight: 600; }
.package-shared-specs button:disabled { cursor: not-allowed; opacity: .4; }
.package-shared-specs button:focus-visible { outline: 2px solid #388d91; outline-offset: 3px; }
.package-shared-specs__group > small { display: block; margin-top: 7px; color: #758a94; font-size: 11px; line-height: 1.5; }
</style>
