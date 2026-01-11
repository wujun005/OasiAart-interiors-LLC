<template>
  <div class="product-detail">
    <!-- Banner 区域 -->
    <img
      class="product-banner"
      src="@/assets/images/h5/product-banner.png"
      alt=""
    />
    <div class="product-bg">
      <div class="banner-text">我们的服务</div>
    </div>

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="24px">加载中...</van-loading>
    </div>

    <div v-else-if="!serviceData.id" class="empty-container">
      <van-empty description="服务不存在" />
    </div>

    <template v-else>
      <!-- 面包屑导航 -->
      <Breadcrumb :brand-list="brandList" />

      <div class="detail-content">
        <!-- 服务图片 -->
        <div class="service-image">
          <img :src="serviceData.imageUrl || ''" :alt="serviceData.name" />
        </div>

        <!-- 服务信息 -->
        <div class="service-info">
          <h2 class="service-name">{{ serviceData.name }}</h2>
          <div class="service-price">
            <span class="price-value">{{ serviceData.price || 0 }}</span>
            <span class="price-unit">{{ serviceData.currency || 'USD' }}/小时</span>
          </div>

          <!-- 数量选择 -->
          <div class="quantity-section">
            <div class="quantity-label">数量</div>
            <van-stepper v-model="quantity" :min="1" :max="10" />
          </div>

          <!-- 立即购买按钮 -->
          <van-button
            type="primary"
            block
            size="large"
            class="buy-button"
            @click="handleBuyNow"
            :loading="buying"
          >
            立即购买
          </van-button>
        </div>

        <!-- 可展开的服务详情 -->
        <van-collapse v-model="activeCollapse" class="expandable-sections">
          <van-collapse-item name="serviceDetails" title="服务详情">
            <div class="expandable-content">
              <p v-if="serviceData.description">{{ serviceData.description }}</p>
              <p v-else>我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。秉承"专业、高效、贴心"的服务理念。</p>
            </div>
          </van-collapse-item>
          <van-collapse-item name="returnDetails" title="退货详情">
            <div class="expandable-content">
              <p>退货政策详情内容...</p>
            </div>
          </van-collapse-item>
        </van-collapse>

        <!-- 更多服务 -->
        <div v-if="relatedServices.length > 0" class="more-services">
          <h3 class="more-services-title">更多服务</h3>
          <div class="more-services-list">
            <div
              v-for="(service, index) in relatedServices"
              :key="index"
              class="service-card"
              @click="goToServiceDetail(getServiceId(service))"
            >
              <img :src="getServiceImage(service) || ''" :alt="getServiceName(service)" class="service-card-image" />
              <div class="service-card-info">
                <div class="service-card-name">{{ getServiceName(service) }}</div>
                <van-icon name="arrow" class="service-card-arrow" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useServiceStore } from '@/modules/h5/store/services';
import { getServiceDetail, getServicesList } from '@/modules/client/api';
import { showToast } from 'vant';
import Breadcrumb from '@/modules/h5/components/bread-crumb/index.vue';

const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const serviceStore = useServiceStore();
const { services } = storeToRefs(serviceStore);

const loading = ref(true);
const buying = ref(false);
const quantity = ref(1);
const serviceData = ref<any>({});
const relatedServices = ref<any[]>([]);
const activeCollapse = ref(['serviceDetails']); // 默认展开服务详情
const rawServiceDetail = ref<any>(null);
const rawRelatedServicesData = ref<any[]>([]);

// 面包屑导航
const brandList = computed(() => [
  {
    name: '首页',
    path: '/',
  },
  {
    name: '所有服务',
    path: '/products',
  },
  {
    name: '服务详情',
    path: `/products/${route.params.id}`,
  },
]);

// 从路由参数获取服务ID
const serviceId = computed(() => route.params.id as string);

// 根据当前语言处理服务详情数据
const processServiceDetail = (detail: any, currentLang: string) => {
  const product = detail.product || detail;
  const i18nList = detail.productI18nList || detail.i18nList || [];
  const images = detail.productImages || detail.images || [];
  
  const langCodes = [currentLang, currentLang === 'zh' ? 'zh-CN' : 'en-US', currentLang === 'zh' ? 'zh' : 'en'];
  let currentI18n = i18nList.find((i: any) => langCodes.indexOf(i.langCode) !== -1);
  
  if (!currentI18n && i18nList.length > 0) {
    currentI18n = i18nList.find((i: any) => i.langCode?.startsWith(currentLang)) || i18nList[0];
  }
  
  return {
    id: product.id?.toString() || '',
    name: currentI18n?.name || product.name || '',
    categoryId: product.categoryId || detail.categoryId || 'cleaning',
    imageUrl: images[0]?.imageUrl || product.imageUrl || '',
    description: currentI18n?.details || currentI18n?.description || product.description || '',
    displayOrder: product.sort || product.displayOrder || 0,
    price: product.price || 0,
    currency: product.currency || 'USD',
  };
};

// 根据当前语言处理相关服务数据
const processRelatedServices = (servicesData: any[], currentLang: string, currentServiceId: string, currentCategoryId: string) => {
  const langCodes = [currentLang, currentLang === 'zh' ? 'zh-CN' : 'en-US', currentLang === 'zh' ? 'zh' : 'en'];
  
  const allServices = servicesData.map((item: any) => {
    const product = item.product || item;
    const i18nList = item.productI18nList || item.i18nList || [];
    const images = item.productImages || item.images || [];
    
    let currentI18n = i18nList.find((i: any) => langCodes.indexOf(i.langCode) !== -1);
    if (!currentI18n && i18nList.length > 0) {
      currentI18n = i18nList.find((i: any) => i.langCode?.startsWith(currentLang)) || i18nList[0];
    }
    
    return {
      id: product.id?.toString() || '',
      name: currentI18n?.name || product.name || '',
      categoryId: product.categoryId || 'cleaning',
      imageUrl: images[0]?.imageUrl || product.imageUrl || '',
      description: currentI18n?.details || currentI18n?.description || '',
    };
  });
  
  return allServices
    .filter((s: any) => s.id !== currentServiceId && s.categoryId === currentCategoryId)
    .slice(0, 3);
};

// 获取服务详情
const fetchServiceDetail = async () => {
  const serviceIdValue = serviceId.value;
  if (!serviceIdValue) {
    loading.value = false;
    showToast('服务ID不存在');
    return;
  }

  try {
    loading.value = true;
    
    // 先从 store 中查找
    const langCode = locale.value === 'en' ? 'en-US' : 'zh-CN';
    const serviceInStore = (services.value || []).find((item: any) => {
      return item?.product?.id?.toString() === serviceIdValue.toString();
    });

    if (serviceInStore) {
      const { product = {}, productI18nList = [], productImages = [] } = serviceInStore;
      const i18n =
        productI18nList.find((i: any) => i?.langCode === langCode) ||
        productI18nList[0] ||
        {};
      
      const currentLang = locale.value === 'zh' ? 'zh' : 'en';
      serviceData.value = {
        id: product.id,
        name: i18n.name || '服务',
        description: i18n.details || i18n.description || '',
        price: product.price || 0,
        currency: product.currency || 'USD',
        imageUrl: productImages[0]?.imageUrl || '',
        categoryId: product.categoryId || 'cleaning',
      };
      
      rawServiceDetail.value = serviceInStore;
      await fetchRelatedServices();
      loading.value = false;
      return;
    }

    // 如果 store 中没有，尝试从 API 获取
    try {
      const response: any = await getServiceDetail(serviceIdValue);
      const detail = response?.data || response || {};
      
      rawServiceDetail.value = detail;
      const currentLang = locale.value === 'zh' ? 'zh' : 'en';
      serviceData.value = processServiceDetail(detail, currentLang);
      
      await fetchRelatedServices();
    } catch (error) {
      console.error('获取服务详情失败:', error);
      showToast('获取服务详情失败');
    }
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
    
    rawRelatedServicesData.value = servicesData;
    const currentLang = locale.value === 'zh' ? 'zh' : 'en';
    const currentServiceId = serviceData.value.id?.toString();
    const currentCategoryId = serviceData.value.categoryId || 'cleaning';
    
    relatedServices.value = processRelatedServices(
      servicesData,
      currentLang,
      currentServiceId,
      currentCategoryId
    );
  } catch (error) {
    console.error('获取相关服务失败:', error);
    relatedServices.value = [];
  }
};

// 辅助函数：获取服务属性
const getServiceId = (service: any) => service?.id || '';
const getServiceName = (service: any) => service?.name || '服务';
const getServiceDescription = (service: any) => service?.description || '';
const getServiceImage = (service: any) => service?.imageUrl || '';

// 跳转到服务详情
const goToServiceDetail = (id: string | number) => {
  router.push(`/products/${id}`);
};

// 立即购买
const handleBuyNow = () => {
  if (!serviceData.value.id) {
    showToast('服务信息不完整');
    return;
  }

  buying.value = true;
  
  // 跳转到支付页面
  router.push({
    path: '/payment',
    query: {
      id: serviceData.value.id,
      name: serviceData.value.name,
      price: serviceData.value.price,
      currency: serviceData.value.currency,
      qty: quantity.value,
    },
  });
  
  buying.value = false;
};

// 监听语言变化，重新处理服务详情和相关服务数据
watch(locale, (newLocale) => {
  if (rawServiceDetail.value) {
    const currentLang = newLocale === 'zh' ? 'zh' : 'en';
    serviceData.value = processServiceDetail(rawServiceDetail.value, currentLang);
  }
  
  if (rawRelatedServicesData.value.length > 0 && serviceData.value.categoryId) {
    const currentLang = newLocale === 'zh' ? 'zh' : 'en';
    relatedServices.value = processRelatedServices(
      rawRelatedServicesData.value,
      currentLang,
      serviceId.value,
      serviceData.value.categoryId
    );
  }
});

onMounted(async () => {
  // 确保服务列表已加载
  if (!serviceStore.loaded) {
    await serviceStore.fetchServices();
  }
  await fetchServiceDetail();
});

// 监听路由参数变化
watch(serviceId, () => {
  fetchServiceDetail();
});
</script>

<style lang="scss" scoped>
.product-detail {
  min-height: 100vh;
  background: #f5f5f5;
  position: relative;
}

// Banner 区域
.product-banner {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-bg {
  width: 100%;
  height: 200px;
  background: #00000080;
  position: absolute;
  top: 0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  
  .banner-text {
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 24px;
    color: #ffffff;
  }
}

.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 40px 20px;
}

.detail-content {
  padding: 16px 20px 40px;
}

// 服务图片
.service-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  background: #f0f0f0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// 服务信息
.service-info {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .service-name {
    font-size: 20px;
    font-weight: 600;
    color: #000;
    margin: 0 0 12px 0;
  }

  .service-price {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 16px;

    .price-value {
      font-size: 24px;
      font-weight: 700;
      color: #796f51;
    }

    .price-unit {
      font-size: 14px;
      color: #666;
    }
  }

  .quantity-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .quantity-label {
      font-size: 16px;
      font-weight: 500;
      color: #000;
    }
  }

  .buy-button {
    width: 100%;
    height: 44px;
    background: #796f51;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
  }
}

// 可展开部分
.expandable-sections {
  margin-bottom: 16px;

  :deep(.van-collapse-item) {
    margin-bottom: 12px;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.van-collapse-item__title) {
    font-size: 16px;
    font-weight: 500;
    padding: 16px;
  }

  :deep(.van-collapse-item__content) {
    padding: 0 16px 16px;
  }
}

.expandable-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  padding: 8px 0;
}

// 更多服务
.more-services {
  margin-top: 24px;

  .more-services-title {
    font-size: 18px;
    font-weight: 600;
    color: #000;
    margin: 0 0 16px 0;
    text-align: center;
  }

  .more-services-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .service-card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.98);
    }

    .service-card-image {
      width: 100%;
      height: 150px;
      object-fit: cover;
      background: #f0f0f0;
    }

    .service-card-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;

      .service-card-name {
        font-size: 16px;
        font-weight: 500;
        color: #000;
      }

      .service-card-arrow {
        font-size: 16px;
        color: #999;
      }
    }
  }
}
</style>
