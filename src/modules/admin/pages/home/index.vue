<template>
  <div class="home-page">
    <div class="home-title">{{ t('admin.home.title') }}</div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
</script>

<style scoped lang="scss">
.home-page {
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #eef2f7;
  border-radius: 20px;
  background: #fff;
}

.home-title {
  color: #0f172a;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0.08em;
}
</style>
