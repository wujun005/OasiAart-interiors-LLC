<template>
  <div class="client-layout" :class="{ 'client-layout--plain': isPlainLayout }">
    <SiteHeader v-if="!isPlainLayout" />
    <main class="client-layout__main">
      <RouterView />
    </main>
    <SiteFooter v-if="!isPlainLayout" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from '@/modules/client/components/layout/SiteHeader.vue';
import SiteFooter from '@/modules/client/components/layout/SiteFooter.vue';

const route = useRoute();
const isPlainLayout = computed(() =>
  route.path === '/login' || route.path === '/register',
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
