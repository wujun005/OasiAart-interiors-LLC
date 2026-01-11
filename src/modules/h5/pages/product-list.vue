<template>
  <div class="product">
    <img
      class="product-banner"
      src="@/assets/images/h5/product-banner.png"
      alt=""
    />
    <div class="product-bg">
      <div class="banner-text">我们的服务</div>
    </div>
    <Breadcrumb :brand-list="brandList" />
    <ServiceList @switch="switchService" />
    <div class="product-list">
      <template v-if="serviceType === 1">
        <div
          class="product-item"
          v-for="item in displayedServices"
          :key="item.id"
          @click="goToDetail(item.id)"
        >
          <img class="thumb" :src="item.image" alt="" />
          <div class="info">
            <div class="name">{{ item.name }}</div>
            <div class="desc">{{ item.desc }}</div>
            <div class="price" v-if="item.price">{{ item.price }}</div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="service-empty">暂无数据</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import Breadcrumb from '@/modules/h5/components/bread-crumb/index.vue';
import ServiceList from '@/modules/h5/components/service-list/index.vue';
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useServiceStore } from '@/modules/h5/store/services';
import { ref } from 'vue';

const router = useRouter();
const brandList = [
  {
    name: '首页',
    path: '/',
  },
  {
    name: '服务',
    path: '/products',
  },
];
const switchService = (type: number) => {
  serviceType.value = type;
};

const { locale } = useI18n();
const serviceType = ref(1);
const serviceStore = useServiceStore();
const { services } = storeToRefs(serviceStore);

const displayedServices = computed(() => {
  const langCode = locale.value === 'en' ? 'en-US' : 'zh-CN';
  return (services.value || []).map((item: any, idx: number) => {
    const { product = {}, productI18nList = [], productImages = [] } = item || {};
    const i18n =
      productI18nList.find((i: any) => i?.langCode === langCode) ||
      productI18nList[0] ||
      {};
    return {
      id: product.id ?? idx,
      name: i18n.name || '服务',
      desc: i18n.details || '',
      price: product.price ? `${product.currency || ''} ${product.price}` : '',
      image: productImages[0]?.imageUrl || '',
    };
  });
});

// 跳转到服务详情页
const goToDetail = (id: string | number) => {
  router.push(`/products/${id}`);
};

onMounted(() => {
  serviceStore.fetchServices();
});
</script>

<style lang="scss" scoped>
.product-banner {
  width: 100%;
  height: 200px;
}
.product-bg {
  width: 100%;
  height: 200px;
  background: #00000080;
  position: absolute;
  top: 0;
  padding: 0 20px;
  .banner-text {
    width: 144px;
    height: 66px;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 24px;
    color: #ffffff;
    margin-top: 80px;
  }
  .banner-desc {
    width: 168px;
    height: 20px;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 14px;
    color: #ffffff;
    letter-spacing: 0;
    margin-top: 10px;
  }
  .banner-btn {
    width: 150px;
    height: 46px;
    background: #2c61f900;
    border: 1px solid #ffffff;
    border-radius: 6px;
    text-align: center;
    line-height: 46px;
    color: #ffffff;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    font-size: 14px;
    margin-top: 30px;
  }
}
.product-list {
  padding: 16px 20px 40px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  .product-item {
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
    .thumb {
      width: 100%;
      height: 120px;
      object-fit: cover;
      background: #f7f7f7;
    }
    .info {
      padding: 10px;
      .name {
        font-size: 14px;
        font-weight: 600;
        color: #000;
        margin-bottom: 6px;
      }
      .desc {
        font-size: 12px;
        color: #666;
        min-height: 32px;
        margin-bottom: 8px;
      }
      .price {
        font-size: 14px;
        color: #796f51;
        font-weight: 600;
      }
    }
  }
}
</style>
