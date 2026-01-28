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

      <!-- Learn More Button -->
      <div class="services-actions">
        <el-button type="default" size="large" class="learn-more-button" @click="handleLearnMore">
          {{ $t('homepage.services.learnMore') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { serviceCategories } from '../../data/homepage';
import { getServicesList } from '../../api';
import type { Service } from '../../types/homepage';
import ServiceCardPage from './ServiceCardPage.vue';

const router = useRouter();
const { locale, t } = useI18n();
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
    
    // 根据实际 API 返回的数据结构处理
    const servicesData = Array.isArray(response) 
      ? response 
      : (response?.data || (response as any)?.list || []);
    
    // 保存原始数据
    rawServicesData.value = servicesData;
    
    // 获取当前语言代码 (zh 或 en)
    const currentLang = locale.value === 'zh' ? 'zh-CN' : 'en-US';
    
    // 处理服务数据
    services.value = processServicesData(servicesData, currentLang);
  } catch (error: any) {
    console.error('获取服务列表失败:', error);
    // 检查是否是网络连接错误
    const errorMessage = error?.message || '';
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      ElMessage.warning(t('homepage.services.errors.connectionFailed'));
    } else {
      // 这里的错误提示可能需要 adjust，因为 t('homepage.services.errors.fetchFailed') 可能不存在如果我没检查 locale 文件
      // checked locale file, it exists.
      ElMessage.error(errorMessage || t('homepage.services.errors.fetchFailed'));
    }
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
  }
});

const filteredServices = computed<Service[]>(() => {
  return services.value
    .filter((service: Service) => service.categoryId === activeCategoryId.value)
    .sort((a: Service, b: Service) => a.displayOrder - b.displayOrder);
});

const handleLearnMore = () => {
  router.push('/services');
};

onMounted(() => {
  fetchServices();
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

// Loading and Empty States
.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
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

.services-actions {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
}

.learn-more-button {
  min-width: 160px;
  border-color: #333;
  color: #333;

  &:hover {
    background-color: #333;
    color: #fff;
  }
}

@media (max-width: 1400px) {
  .services-container {
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

  .services-grid {
    grid-template-columns: 1fr;
  }

  .services-title {
    font-size: 2rem;
  }
}
</style>

