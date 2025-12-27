<template>
  <div class="homepage">
    <!-- Header - 固定定位，永远置顶 -->
    <AppHeader />

    <!-- Main Content - 需要添加 padding-top 避免被 Header 遮挡 -->
    <main class="homepage-content">
      <!-- Hero Section -->
      <HomeHero />

      <!-- Services Section -->
      <HomeServices />

      <!-- About Section -->
      <HomeAbout />

      <!-- Process Section (待实现) -->
      <!-- <HomeProcess /> -->

      <!-- Contact Section (待实现) -->
      <!-- <HomeContact /> -->

      <!-- Footer -->
      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../components/Header/index.vue';
import HomeHero from '../components/HomeHero/index.vue';
import HomeServices from '../components/HomeServices/index.vue';
import HomeAbout from '../components/HomeAbout/index.vue';
import AppFooter from '../components/Footer/index.vue';
</script>

<style scoped lang="scss">
.homepage {
  width: 100%;
  min-height: 100vh;
}

.homepage-content {
  // 初始状态不留白，Hero 图片覆盖到顶部，Header 浮在图片上方
  // 只有滚动后才需要 padding-top
}
</style>
