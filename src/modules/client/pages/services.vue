<template>
  <div class="services-page">
    <!-- Header - 固定定位，永远置顶 -->
    <AppHeader />

    <!-- Main Content -->
    <main class="services-content">
      <!-- Banner Section -->
      <section class="services-banner">
        <div class="banner-background">
          <!-- 背景图片将通过 CSS 设置 -->
        </div>
        <div class="banner-overlay"></div>
        <div class="banner-content">
          <h1 class="banner-title">{{ $t('homepage.services.title') }}</h1>
        </div>
      </section>

      <!-- Services Section -->
      <section class="services-section">
        <div class="services-container">
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <router-link to="/" class="breadcrumb-link">{{ $t('homepage.services.breadcrumb.home') }}</router-link>
            <span class="breadcrumb-separator">></span>
            <span class="breadcrumb-current">{{ $t('homepage.services.breadcrumb.allServices') }}</span>
          </div>

          <!-- Category Tabs -->
          <div class="category-tabs">
            <button
              v-for="category in serviceCategories"
              :key="category.id"
              :class="['category-tab', { active: activeCategoryId === category.id }]"
              @click="activeCategoryId = category.id"
            >
              {{ $t(category.name) }}
            </button>
          </div>

          <!-- Service Cards Grid -->
          <div class="services-grid">
            <ServiceCardPage
              v-for="service in filteredServices"
              :key="service.id"
              :service="service"
            />
          </div>
        </div>
      </section>

      <!-- Footer -->
      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import ServiceCardPage from '../components/HomeServices/ServiceCardPage.vue';
import { serviceCategories, services } from '../data/homepage';

const activeCategoryId = ref('cleaning'); // 默认显示保洁

const filteredServices = computed(() => {
  return services
    .filter((service) => service.categoryId === activeCategoryId.value)
    .sort((a, b) => a.displayOrder - b.displayOrder);
});
</script>

<style scoped lang="scss">
.services-page {
  width: 100%;
  min-height: 100vh;
}


// Banner Section
.services-banner {
  position: relative;
  width: 100%;
  height: 400px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: -72px; // 负边距，让 Banner 覆盖到顶部，抵消 Header 的高度

  .banner-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #808080; // 占位背景色（灰色）
    background-image: url('@/assets/images/service/service_bg.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 1;

    // 高分辨率屏幕使用 @2x 版本
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      background-image: url('@/assets/images/service/service_bg@2x.png');
    }
  }

  .banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5); // 50% 透明度
    z-index: 2;
  }

  .banner-content {
    position: relative;
    z-index: 3;
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    padding: 0 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .banner-title {
    font-size: 3rem;
    font-weight: bold;
    color: #ffffff;
    margin: 0;
    text-align: center;
  }
}

// Services Section
.services-section {
  padding: 3rem 0;
  background-color: #ffffff;
  min-height: 600px;
}

.services-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 200px;
}

// Breadcrumb
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 14px;

  .breadcrumb-link {
    color: #666;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #2d8f7f;
    }
  }

  .breadcrumb-separator {
    color: #999;
  }

  .breadcrumb-current {
    color: #333;
    font-weight: 500;
  }
}

// Category Tabs
.category-tabs {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
}

.category-tab {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: color 0.3s ease;

  &:hover {
    color: #2d8f7f;
  }

  &.active {
    color: #333;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #333;
    }
  }
}

// Services Grid - 3列网格布局，支持多行（3x3）
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-bottom: 3rem;
}

// 响应式设计
@media (max-width: 1400px) {
  .services-container {
    padding: 0 100px;
  }

  .banner-content {
    padding: 0 100px;
  }
}

@media (max-width: 1024px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .services-container {
    padding: 0 50px;
  }

  .banner-content {
    padding: 0 50px;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .banner-title {
    font-size: 2rem;
  }
}
</style>

