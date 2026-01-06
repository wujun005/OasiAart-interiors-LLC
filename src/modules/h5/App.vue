<template>
  <div class="h5-app">
    <RouterView />
    <!-- <van-button class="lang-toggle" size="small" type="primary" plain @click="toggleLocale">
      {{ locale === 'zh' ? 'EN' : '中' }}
    </van-button> -->
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'

const { locale } = useI18n()

watch(
  () => locale.value,
  (val) => localStorage.setItem('h5-locale', val),
  { immediate: true }
)

const toggleLocale = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}
</script>

<style scoped>
.h5-app {
  min-height: 100vh;
  background: #f7f8fa;
}

.lang-toggle {
  position: fixed;
  right: 12px;
  bottom: 90px;
  z-index: 999;
}
</style>
