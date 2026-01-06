<template>
  <div class="home-page">
    <TabNav />
    <main class="content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import TabNav from '@/modules/h5/components/tab-nav/index.vue';
import Footer from '@/modules/h5/components/footer/index.vue';
</script>

<style scoped lang="scss">
.home-page {
  // padding-top: 80px; // 顶部固定导航的高度占位（40px + 上下 padding）
  box-sizing: border-box;
  min-height: 100vh;
}
.content {
  // padding: 0 12px 0;
}
</style>
