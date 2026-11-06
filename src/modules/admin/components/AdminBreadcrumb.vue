<template>
  <nav class="admin-breadcrumb" :aria-label="t('admin.common.breadcrumb')">
    <button
      type="button"
      class="admin-breadcrumb__back"
      :aria-label="t('admin.common.back')"
      :title="t('admin.common.back')"
      @click="emit('back')"
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m11.5 5-5 5 5 5M7 10h9" />
      </svg>
    </button>
    <ol class="admin-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="admin-breadcrumb__item"
        :class="{ 'is-current': index === items.length - 1 }"
      >
        <svg
          v-if="index"
          class="admin-breadcrumb__separator"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="m6 4 4 4-4 4" />
        </svg>
        <button
          v-if="item.onClick && index < items.length - 1"
          type="button"
          class="admin-breadcrumb__label admin-breadcrumb__link"
          :title="item.label"
          @click="item.onClick()"
        >
          {{ item.label }}
        </button>
        <span
          v-else
          class="admin-breadcrumb__label"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
          :title="item.label"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  items: { label: string; onClick?: () => void }[]
}>()

const emit = defineEmits<{ back: [] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped>
.admin-breadcrumb {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  min-width: 0;
  min-height: 48px;
  margin: 0;
  padding: 6px 0;
  border: 0;
  border-bottom: 1px solid #e6e0d6;
  border-radius: 0;
  background: #fffefa;
  color: #667386;
  font-size: 14px;
  line-height: 1.5;
}

.admin-breadcrumb__back {
  display: grid;
  flex: 0 0 34px;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #f1eee7;
  color: #213a51;
  cursor: pointer;
}

.admin-breadcrumb__back svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.admin-breadcrumb__list {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.admin-breadcrumb__item {
  display: flex;
  flex: 0 2 auto;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 220px;
}

.admin-breadcrumb__item.is-current {
  flex: 1 1 0;
  max-width: 560px;
  color: #102b44;
  font-weight: 650;
}

.admin-breadcrumb__item:only-child {
  max-width: 100%;
}

.admin-breadcrumb__separator {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  color: #b5a58c;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.admin-breadcrumb__label {
  display: block;
  min-width: 0;
  padding: 5px 6px;
  overflow: hidden;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-breadcrumb__link {
  cursor: pointer;
}

.is-current .admin-breadcrumb__label {
  background: transparent;
}

.admin-breadcrumb__back,
.admin-breadcrumb__link {
  transition: color .18s ease, border-color .18s ease, background-color .18s ease;
}

.admin-breadcrumb__back:hover,
.admin-breadcrumb__link:hover {
  border-color: #c9b68e;
  background: #f7f2e9;
  color: #86632e;
}

.admin-breadcrumb button:focus-visible {
  outline: 2px solid #b38b4b;
  outline-offset: 2px;
}

@media (max-width: 760px) {
  .admin-breadcrumb {
    gap: 8px;
    min-height: 52px;
    padding: 4px 0;
    font-size: 13px;
  }

  .admin-breadcrumb__back {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
  }

  .admin-breadcrumb__list,
  .admin-breadcrumb__item {
    gap: 2px;
  }

  .admin-breadcrumb__item {
    max-width: 24%;
  }

  .admin-breadcrumb__item.is-current {
    max-width: none;
  }

  .admin-breadcrumb__item:only-child {
    max-width: 100%;
  }

  .admin-breadcrumb__label {
    padding-inline: 6px;
  }

  .admin-breadcrumb__separator {
    flex-basis: 12px;
    width: 12px;
    height: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-breadcrumb__back,
  .admin-breadcrumb__link {
    transition: none;
  }
}
</style>
