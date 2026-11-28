<template>
  <div class="h5-packages-page">
    <header class="h5-list-topbar h5-packages-topbar">
      <HomeReturn />
      <h1>{{ t('client.home.packages.title') }}</h1>
    </header>
    <PackageShowcase mode="page" platform="h5" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PackageShowcase from '@/modules/client/components/PackageShowcase.vue'
import HomeReturn from '@/modules/h5/components/HomeReturn.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped>
.h5-packages-topbar {
  padding-inline: 1rem;
  background: #fff;
  border-bottom: 1px solid var(--hourx-client-border);
}
</style>
