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
          <div v-if="loading" class="loading-container">
            <p>加载中...</p>
          </div>
          <div v-else-if="filteredServices.length === 0" class="empty-container">
            <p>暂无服务</p>
          </div>
          <div v-else class="services-grid">
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
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import ServiceCardPage from '../components/HomeServices/ServiceCardPage.vue';
import { serviceCategories } from '../data/homepage';
import { getServicesList } from '../api';
import type { Service } from '../types/homepage';

const { locale } = useI18n();
const activeCategoryId = ref('cleaning'); // 默认显示保洁
const services = ref<Service[]>([]);
const rawServicesData = ref<any[]>([]); // 保存原始 API 数据
const loading = ref(false);

// 根据当前语言处理服务数据
const processServicesData = (servicesData: any[], currentLang: string) => {
  return servicesData.map((item: any) => {
    // 处理商品数据结构：可能是 { product, productI18nList, productImages } 或直接是商品对象
    const product = item.product || item;
    const i18nList = item.productI18nList || item.i18nList || [];
    const images = item.productImages || item.images || [];
    
    // 尝试匹配语言代码（支持 'zh', 'zh-CN', 'en', 'en-US' 等格式）
    const langCodes = [currentLang, currentLang === 'zh' ? 'zh-CN' : 'en-US', currentLang === 'zh' ? 'zh' : 'en'];
    let currentI18n = i18nList.find((i: any) => langCodes.indexOf(i.langCode) !== -1);
    
    if (!currentI18n && i18nList.length > 0) {
      // 如果找不到匹配的，尝试模糊匹配
      currentI18n = i18nList.find((i: any) => i.langCode && i.langCode.indexOf(currentLang) === 0) || i18nList[0];
    }
    return {
      id: product.id?.toString() || item.id?.toString() || '',
      name: currentI18n?.name || product.name || item.name || '',
      categoryId: product.categoryId || item.categoryId || item.category?.id || 'cleaning',
      imageUrl: images[0]?.imageUrl || product.imageUrl || item.imageUrl || item.mainImage || '',
      description: currentI18n?.details || currentI18n?.description || product.description || item.description || '',
      displayOrder: product.sort || product.displayOrder || item.sortOrder || item.sort || item.order || 0,
    };
  });
};

// 从 API 获取所有服务
const fetchServices = async () => {
  loading.value = true;
  try {
    const response: any = await getServicesList();
    console.log('获取服务列表响应:', response);
    
    // 根据实际 API 返回的数据结构处理
    // 如果返回的是数组，直接使用
    // 如果返回的是 { data: [...] }，使用 response.data
    const servicesData = Array.isArray(response) 
      ? response 
      : (response?.data || (response as any)?.list || []);
    
    // 保存原始数据
    rawServicesData.value = servicesData;
    
    // 获取当前语言代码 (zh 或 en)
    const currentLang = locale.value === 'zh' ? 'zh-CN' : 'en-US';
    
    // 处理服务数据
    services.value = processServicesData(servicesData, currentLang);
    
    console.log('处理后的服务列表:', services.value);
  } catch (error: any) {
    console.error('获取服务列表失败:', error);
    ElMessage.error(error?.message || '获取服务列表失败');
    services.value = [];
    rawServicesData.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听语言变化，重新处理服务数据
watch(locale, (newLocale) => {
  if (rawServicesData.value.length > 0) {
    const currentLang = newLocale === 'zh' ? 'zh-CN' : 'en-US';
    services.value = processServicesData(rawServicesData.value, currentLang);
    console.log('语言切换，重新处理服务列表:', services.value);
  }
});

const filteredServices = computed(() => {
  return services.value
    .filter((service: Service) => service.categoryId === activeCategoryId.value)
    .sort((a: Service, b: Service) => a.displayOrder - b.displayOrder);
});

// 组件挂载时获取服务列表
onMounted(() => {
  fetchServices();
});
</script>

<style scoped lang="scss">
.services-page {
  width: 100%;
  min-height: 100vh;

  // 页眉在服务页面显示为白色背景，黑色文字
  :deep(.app-header) {
    background-color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    border-top: none !important;
    
    .header-logo {
      color: #000000 !important;
    }

    .header-nav .nav-link {
      color: #000000 !important;

      &:hover {
        color: #333333 !important;
      }

      &.router-link-active {
        color: #000000 !important;
        font-weight: bold !important;

        &::after {
          background-color: #000000 !important;
        }
      }
    }

    .header-utils {
      .util-icon {
        color: #000000 !important;
      }

      .search-input {
        :deep(.el-input__inner) {
          color: #000000 !important;

          &::placeholder {
            color: rgba(0, 0, 0, 0.5) !important;
          }
        }

        .search-input-icon {
          color: rgba(0, 0, 0, 0.6) !important;

          &:hover {
            color: #000000 !important;
          }
        }
      }

      .language-link {
        color: #000000 !important;

        &:hover {
          color: #333333 !important;
        }
      }
    }

    // 滚动后也保持白色背景和黑色文字
    &.scrolled {
      background-color: #ffffff !important;
    }
  }
}


// Banner Section
.services-banner {
  position: relative;
  width: 100%;
  height: 300px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: 72px;

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

// Loading and Empty States
.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.125rem;
  color: #666;
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

