<template>
  <section class="detail-content">
    <div class="detail-content__tabs" role="tablist" :aria-label="t('client.productDetail.pageTitle')">
      <button
        v-for="(tab, index) in tabs"
        :id="`${id}-tab-${tab.key}`"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-controls="`${id}-panel`"
        :tabindex="index === activeIndex ? 0 : -1"
        @click="activeIndex = index"
        @keydown="handleKeydown"
      >
        {{ t(tab.key === 'notice' && packageTerms ? 'client.home.packages.terms' : tab.label) }}
      </button>
    </div>
    <div
      :id="`${id}-panel`"
      role="tabpanel"
      :aria-labelledby="`${id}-tab-${tabs[activeIndex].key}`"
      tabindex="0"
    >
      <slot :name="tabs[activeIndex].key" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ packageTerms?: boolean }>()

const { t } = useI18n()
const id = useId()
const activeIndex = ref(0)
const tabs = [
  { key: 'description', label: 'client.productDetail.serviceDescription' },
  { key: 'includes', label: 'client.productDetail.includesTitle' },
  { key: 'notice', label: 'client.productDetail.noticeTitle' },
  { key: 'reviews', label: 'client.productDetail.reviewsTitle' },
] as const

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowRight':
      activeIndex.value = (activeIndex.value + 1) % tabs.length
      break
    case 'ArrowLeft':
      activeIndex.value = (activeIndex.value - 1 + tabs.length) % tabs.length
      break
    case 'Home':
      activeIndex.value = 0
      break
    case 'End':
      activeIndex.value = tabs.length - 1
      break
    default:
      return
  }
  event.preventDefault()
  const tabList = (event.currentTarget as HTMLButtonElement).parentElement
  tabList?.querySelectorAll('button')[activeIndex.value]?.focus()
}
</script>

<style scoped>
.detail-content {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--hourx-client-border);
  border-radius: 1rem;
  background: #fff;
}

.detail-content__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem;
  padding: 0.25rem;
  margin-bottom: 1rem;
  border-radius: 0.875rem;
  background: #efece6;
}

.detail-content__tabs button {
  min-height: 2.5rem;
  padding: 0.35rem 0.5rem;
  border: 0;
  border-radius: 0.625rem;
  background: transparent;
  color: var(--hourx-client-text);
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  line-height: 1.2;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.detail-content__tabs button[aria-selected='true'] {
  background: var(--hourx-client-text);
  color: #fff;
}
</style>
