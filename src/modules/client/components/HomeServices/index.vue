<template>
  <section class="home-services">
    <div class="services-container">
      <h2 class="services-title">{{ $t('homepage.services.title') }}</h2>

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
        <ServiceCard
          v-for="service in filteredServices"
          :key="service.id"
          :service="service"
        />
      </div>

      <!-- Learn More Button -->
      <div class="services-actions">
        <el-button type="default" size="large" class="learn-more-button">
          {{ $t('homepage.services.learnMore') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { serviceCategories, services } from '../../data/homepage';
import ServiceCard from './ServiceCard.vue';

const activeCategoryId = ref('cleaning'); // 默认显示保洁

const filteredServices = computed(() => {
  return services
    .filter((service) => service.categoryId === activeCategoryId.value)
    .sort((a, b) => a.displayOrder - b.displayOrder);
});
</script>

<style scoped lang="scss">
.home-services {
  padding: 4rem 0;
  background-color: #f5f5f5;
  min-height: 600px;
}

.services-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 200px;
}

.services-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 3rem 0;
  color: #333;
}

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
    color: #1890ff;
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

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 2fr 3fr; // 第一行是第二行的三分之二
  gap: 20px;
  margin-bottom: 3rem;

  // 第一个卡片（日常清洁）：第一列，占据两行
  .service-card:nth-child(1) {
    grid-column: 1;
    grid-row: 1 / 3; // 跨越两行
    height: 100%;
  }

  // 第二个卡片（深度清洁）：第一行，第二列
  .service-card:nth-child(2) {
    grid-column: 2;
    grid-row: 1;
    height: 100%;
  }

  // 第三个卡片（商业清洁）：第一行，第三列
  .service-card:nth-child(3) {
    grid-column: 3;
    grid-row: 1;
    height: 100%;
  }

  // 第四个卡片（家电清洁）：第二行，横跨 2、3 列
  .service-card:nth-child(4) {
    grid-column: 2 / 4; // 横跨第2、3列
    grid-row: 2;
    height: 100%;
  }
}

.services-actions {
  display: flex;
  justify-content: center;
}

.learn-more-button {
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  border-radius: 4px;
  border: 1px solid #333;
  background-color: transparent;
  color: #333;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    color: #ffffff;
  }
}
</style>

