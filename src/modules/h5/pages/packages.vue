<template>
  <div class="h5-packages-page">
    <van-nav-bar
      :title="t('client.home.packages.title')"
      :left-text="t('client.header.nav.home')"
      left-arrow
      @click-left="router.push({ name: 'h5-home' })"
    />
    <PackageShowcase mode="page" platform="h5" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import PackageShowcase from '@/modules/client/components/PackageShowcase.vue'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
</script>
