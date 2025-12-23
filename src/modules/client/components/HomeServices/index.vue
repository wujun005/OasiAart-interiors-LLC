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
  padding: 4rem 2rem;
  background-color: #f5f5f5;
  min-height: 600px;
}

.services-container {
  max-width: 1920px;
  margin: 0 auto;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
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

