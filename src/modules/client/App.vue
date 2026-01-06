<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const isMobile = () => {
  const ua = navigator.userAgent || '';
  const mobileRegex =
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isSmallScreen = window.innerWidth <= 820;
  return mobileRegex.test(ua) || isSmallScreen;
};

onMounted(() => {
  if (isMobile()) {
    window.location.href = '/h5';
  }
});
</script>
