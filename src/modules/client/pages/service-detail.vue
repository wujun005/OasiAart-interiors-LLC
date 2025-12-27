<template>
  <div class="service-detail-page">
    <!-- Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="service-detail-content">
      <!-- Banner Section -->
      <section class="detail-banner">
        <div class="banner-background">
          <!-- 背景图片将通过 CSS 设置 -->
        </div>
        <div class="banner-overlay"></div>
        <div class="banner-content">
          <h1 class="banner-title">{{ $t('homepage.serviceDetail.title') }}</h1>
        </div>
      </section>

      <!-- Service Detail Section -->
      <section class="service-detail-section">
        <div class="detail-container">
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <router-link to="/" class="breadcrumb-link">{{ $t('homepage.serviceDetail.breadcrumb.home') }}</router-link>
            <span class="breadcrumb-separator">></span>
            <router-link to="/services" class="breadcrumb-link">{{ $t('homepage.serviceDetail.breadcrumb.allServices') }}</router-link>
            <span class="breadcrumb-separator">></span>
            <span class="breadcrumb-current">{{ $t(serviceData.name) }}</span>
          </div>

          <!-- Main Content: Image and Info -->
          <div class="detail-main">
            <!-- Left: Service Image -->
            <div class="service-image-section">
              <img
                :src="serviceData.imageUrl"
                :alt="$t(serviceData.name)"
                class="service-detail-image"
              />
            </div>

            <!-- Right: Service Information -->
            <div class="service-info-section">
              <h2 class="service-title">{{ $t(serviceData.name) }}</h2>
              
              <!-- Price -->
              <div class="service-price">
                <span class="price-value">42</span>
                <span class="price-unit">美元/{{ $t('homepage.services.hour') }}</span>
              </div>

              <!-- Quantity Selector -->
              <div class="quantity-selector">
                <label class="quantity-label">{{ $t('homepage.serviceDetail.quantity') }}</label>
                <el-input-number
                  v-model="quantity"
                  :min="1"
                  :max="10"
                  class="quantity-input"
                />
              </div>

              <!-- Buy Now Button -->
              <el-button type="primary" size="large" class="buy-now-button" @click="handleBuyNow">
                {{ $t('homepage.serviceDetail.buyNow') }}
              </el-button>

              <!-- Expandable Sections -->
              <div class="expandable-sections">
                <!-- Service Details -->
                <div class="expandable-item">
                  <div class="expandable-header" @click="toggleServiceDetails">
                    <span class="expandable-title">{{ $t('homepage.serviceDetail.serviceDetails') }}</span>
                    <el-icon class="expandable-icon" :class="{ rotated: isServiceDetailsOpen }">
                      <ArrowUp />
                    </el-icon>
                  </div>
                  <div v-show="isServiceDetailsOpen" class="expandable-content">
                    <p>{{ $t('homepage.about.description') }}</p>
                  </div>
                </div>

                <!-- Return Details -->
                <div class="expandable-item">
                  <div class="expandable-header" @click="toggleReturnDetails">
                    <span class="expandable-title">{{ $t('homepage.serviceDetail.returnDetails') }}</span>
                    <el-icon class="expandable-icon" :class="{ rotated: isReturnDetailsOpen }">
                      <ArrowUp />
                    </el-icon>
                  </div>
                  <div v-show="isReturnDetailsOpen" class="expandable-content">
                    <p>退货政策详情内容...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- More Services Section -->
      <section class="more-services-section">
        <div class="more-services-container">
          <h2 class="more-services-title">{{ $t('homepage.serviceDetail.moreServices') }}</h2>
          <div class="more-services-grid">
            <ServiceCardPage
              v-for="service in relatedServices"
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowUp } from '@element-plus/icons-vue';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import ServiceCardPage from '../components/HomeServices/ServiceCardPage.vue';
import { services } from '../data/homepage';

const route = useRoute();
const quantity = ref(1);
const isServiceDetailsOpen = ref(true); // 默认展开
const isReturnDetailsOpen = ref(false); // 默认折叠

// 从路由参数获取服务ID，如果没有则使用默认值
const serviceId = computed(() => (route.params.id as string) || 'daily-cleaning');

// 获取当前服务数据
const serviceData = computed(() => {
  return services.find(s => s.id === serviceId.value) || services[0];
});

// 获取相关服务（排除当前服务）
const relatedServices = computed(() => {
  return services
    .filter(s => s.id !== serviceId.value && s.categoryId === serviceData.value.categoryId)
    .slice(0, 3);
});

const toggleServiceDetails = () => {
  isServiceDetailsOpen.value = !isServiceDetailsOpen.value;
};

const toggleReturnDetails = () => {
  isReturnDetailsOpen.value = !isReturnDetailsOpen.value;
};

const handleBuyNow = () => {
  // TODO: 实现购买逻辑
  console.log('购买服务:', serviceData.value.id, '数量:', quantity.value);
};
</script>

<style scoped lang="scss">
.service-detail-page {
  width: 100%;
  min-height: 100vh;
}

// Banner Section
.detail-banner {
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
    background-color: #808080;
    background-image: url('@/assets/images/service/service_bg.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 1;

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
    background: rgba(0, 0, 0, 0.5);
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

// Service Detail Section
.service-detail-section {
  padding: 3rem 0;
  background-color: #ffffff;
}

.detail-container {
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

// Main Content
.detail-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  margin-bottom: 4rem;
}

.service-image-section {
  width: 100%;

  .service-detail-image {
    width: 100%;
    height: auto;
    border-radius: 8px;
    object-fit: cover;
  }
}

.service-info-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.service-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.service-price {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;

  .price-value {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
  }

  .price-unit {
    font-size: 1rem;
    color: #666;
  }
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 1rem;

  .quantity-label {
    font-size: 1rem;
    color: #333;
    font-weight: 500;
  }

  .quantity-input {
    width: 120px;
  }
}

.buy-now-button {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  background-color: #d4a574;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #c89664;
  }
}

// Expandable Sections
.expandable-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.expandable-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.expandable-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f0f0f0;
  }

  .expandable-title {
    font-size: 1rem;
    font-weight: 500;
    color: #333;
  }

  .expandable-icon {
    font-size: 1rem;
    color: #666;
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.expandable-content {
  padding: 1.5rem;
  background-color: #ffffff;
  color: #666;
  line-height: 1.6;
}

// More Services Section
.more-services-section {
  padding: 4rem 0;
  background-color: #f5f5f5;
}

.more-services-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 200px;
}

.more-services-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 3rem 0;
}

.more-services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

// 响应式设计
@media (max-width: 1400px) {
  .detail-container,
  .more-services-container {
    padding: 0 100px;
  }

  .banner-content {
    padding: 0 100px;
  }
}

@media (max-width: 1024px) {
  .detail-main {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .more-services-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .detail-container,
  .more-services-container {
    padding: 0 50px;
  }

  .banner-content {
    padding: 0 50px;
  }

  .more-services-grid {
    grid-template-columns: 1fr;
  }

  .banner-title {
    font-size: 2rem;
  }

  .service-title {
    font-size: 2rem;
  }
}
</style>

