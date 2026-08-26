<template>
  <div
    class="client-layout"
    :class="{
      'client-layout--plain': isPlainLayout,
      'client-layout--home': route.path === '/',
    }"
  >
    <SiteHeader v-if="!isPlainLayout" />
    <main class="client-layout__main">
      <RouterView />
    </main>
    <SiteFooter v-if="!isPlainLayout" :reserve-support-space="route.path === '/'" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import SiteHeader from '@/modules/client/components/layout/SiteHeader.vue';
import SiteFooter from '@/modules/client/components/layout/SiteFooter.vue';

const route = useRoute();
const { locale } = useI18n({ useScope: 'global' });
const isPlainLayout = computed(() =>
  route.path === '/login' || route.path === '/register',
);

watch(
  () => locale.value,
  (value) => {
    document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.client-layout__main {
  flex: 1;
}

.client-layout--plain .client-layout__main {
  min-height: 100vh;
}
</style>
