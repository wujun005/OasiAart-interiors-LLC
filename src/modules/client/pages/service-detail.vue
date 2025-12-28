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
            <span class="breadcrumb-current">{{ serviceData.name }}</span>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading-container">
            <p>加载中...</p>
          </div>

          <!-- Main Content: Image and Info -->
          <div v-else class="detail-main">
            <!-- Left: Service Image -->
            <div class="service-image-section">
              <img
                :src="serviceData.imageUrl"
                :alt="serviceData.name"
                class="service-detail-image"
              />
            </div>

            <!-- Right: Service Information -->
            <div class="service-info-section">
              <h2 class="service-title">{{ serviceData.name }}</h2>
              
              <!-- Price -->
              <div class="service-price">
                <span class="price-value">{{ serviceData.price || 0 }}</span>
                <span class="price-unit">{{ serviceData.currency || '美元' }}/{{ $t('homepage.services.hour') }}</span>
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
                    <p v-if="serviceData.description">{{ serviceData.description }}</p>
                    <p v-else>{{ $t('homepage.about.description') }}</p>
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
          <section v-if="!loading && relatedServices.length > 0" class="more-services-section">
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowUp } from '@element-plus/icons-vue';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import ServiceCardPage from '../components/HomeServices/ServiceCardPage.vue';
import { getServiceDetail, getServicesList } from '../api';
import type { Service } from '../types/homepage';

const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const quantity = ref(1);
const isServiceDetailsOpen = ref(true); // 默认展开
const isReturnDetailsOpen = ref(false); // 默认折叠
const loading = ref(false);
const serviceData = ref<Service & { price?: number; currency?: string }>({
  id: '',
  name: '',
  categoryId: 'cleaning',
  imageUrl: '',
  description: '',
  displayOrder: 0,
});
const relatedServices = ref<Service[]>([]);

// 从路由参数获取服务ID
const serviceId = computed(() => route.params.id as string);

// 获取服务详情
const fetchServiceDetail = async () => {
  if (!serviceId.value) {
    ElMessage.error('服务ID不存在');
    router.push('/services');
    return;
  }

  loading.value = true;
  try {
    const response: any = await getServiceDetail(serviceId.value);
    console.log('获取服务详情响应:', response);
    
    // 处理 API 返回的数据结构
    const detail = response?.data || response || {};
    const product = detail.product || detail;
    const i18nList = detail.productI18nList || detail.i18nList || [];
    const images = detail.productImages || detail.images || [];
    
    // 获取当前语言代码
    const currentLang = locale.value === 'zh' ? 'zh' : 'en';
    const currentI18n = i18nList.find((i: any) => i.langCode === currentLang) || i18nList[0] || {};
    
    // 转换为 Service 格式
    serviceData.value = {
      id: product.id?.toString() || '',
      name: currentI18n.name || product.name || '',
      categoryId: product.categoryId || detail.categoryId || 'cleaning',
      imageUrl: images[0]?.imageUrl || product.imageUrl || '',
      description: currentI18n.details || currentI18n.description || product.description || '',
      displayOrder: product.sort || product.displayOrder || 0,
      price: product.price || 0,
      currency: product.currency || '美元',
    };
    
    console.log('处理后的服务详情:', serviceData.value);
    
    // 获取相关服务
    await fetchRelatedServices();
  } catch (error: any) {
    console.error('获取服务详情失败:', error);
    ElMessage.error(error?.message || '获取服务详情失败');
    router.push('/services');
  } finally {
    loading.value = false;
  }
};

// 获取相关服务
const fetchRelatedServices = async () => {
  try {
    const response: any = await getServicesList();
    const servicesData = Array.isArray(response) 
      ? response 
      : (response?.data || (response as any)?.list || []);
    
    const currentLang = locale.value === 'zh' ? 'zh' : 'en';
    
    // 转换为 Service 格式
    const allServices = servicesData.map((item: any) => {
      const product = item.product || item;
      const i18nList = item.productI18nList || item.i18nList || [];
      const images = item.productImages || item.images || [];
      const currentI18n = i18nList.find((i: any) => i.langCode === currentLang) || i18nList[0] || {};
      
      return {
        id: product.id?.toString() || '',
        name: currentI18n.name || product.name || '',
        categoryId: product.categoryId || item.categoryId || 'cleaning',
        imageUrl: images[0]?.imageUrl || product.imageUrl || '',
        description: currentI18n.details || currentI18n.description || '',
        displayOrder: product.sort || product.displayOrder || 0,
      };
    });
    
    // 过滤相关服务（同分类，排除当前服务）
    relatedServices.value = allServices
      .filter((s: Service) => s.id !== serviceId.value && s.categoryId === serviceData.value.categoryId)
      .slice(0, 3);
  } catch (error: any) {
    console.error('获取相关服务失败:', error);
    relatedServices.value = [];
  }
};

const toggleServiceDetails = () => {
  isServiceDetailsOpen.value = !isServiceDetailsOpen.value;
};

const toggleReturnDetails = () => {
  isReturnDetailsOpen.value = !isReturnDetailsOpen.value;
};

const handleBuyNow = () => {
  router.push({
    name: 'Payment',
    query: {
      id: serviceData.value.id,
      name: serviceData.value.name,
      qty: quantity.value,
      price: serviceData.value.price || 0,
      currency: serviceData.value.currency || 'USD',
    },
  });
};

// 组件挂载时获取服务详情
onMounted(() => {
  fetchServiceDetail();
});

// 监听路由参数变化，当服务ID改变时重新获取详情
watch(serviceId, () => {
  fetchServiceDetail();
});
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

// Loading State
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.125rem;
  color: #666;
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
