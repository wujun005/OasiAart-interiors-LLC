<template>
  <RouterLink
    class="h5-home-return"
    :to="{ name: 'h5-home' }"
    :aria-label="t('h5.common.backToHome')"
  >
    <van-icon name="home-o" aria-hidden="true" />
    <span>{{ t('h5.common.homeAction') }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.h5-home-return {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  gap: 0.375rem;
  min-height: 2.75rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--hourx-client-border);
  border-radius: 0.625rem;
  background: #fff;
  color: var(--hourx-client-text);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
}

.h5-home-return :deep(.van-icon) {
  flex: none;
  font-size: 1rem;
}

.h5-home-return:active {
  background: var(--hourx-client-canvas);
}

.h5-home-return:focus-visible {
  outline: 2px solid var(--hourx-client-text);
  outline-offset: 2px;
}
</style>
