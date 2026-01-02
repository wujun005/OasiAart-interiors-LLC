<template>
  <div class="payment-success-page">
    <AppHeader />

    <main class="payment-success-content">
      <section class="success-section">
        <div class="success-container">
          <div class="success-main">
            <h1 class="success-title">{{ $t('payment.success.title') }}</h1>
            <p class="success-description">{{ $t('payment.success.description') }}</p>
            <el-button 
              type="default" 
              size="large" 
              class="order-details-button" 
              @click="handleViewOrder"
            >
              {{ $t('payment.success.orderDetails') }}
            </el-button>
          </div>
        </div>
      </section>

      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';

const router = useRouter();
const route = useRoute();

const handleViewOrder = () => {
  // 如果有订单ID，跳转到订单详情；否则跳转到历史订单列表
  const orderId = route.query.orderId as string;
  if (orderId) {
    router.push(`/order-detail/${orderId}`);
  } else {
    router.push('/order-history');
  }
};
</script>

<style scoped lang="scss">
.payment-success-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.payment-success-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.success-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 200px;
  margin-top: 72px; // 为固定定位的页眉留出空间
  position: relative;

  // 左右两侧的蓝色虚线边框
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background-image: repeating-linear-gradient(
      to bottom,
      #2d8f7f 0,
      #2d8f7f 8px,
      transparent 8px,
      transparent 16px
    );
  }

  &::before {
    left: 200px;
  }

  &::after {
    right: 200px;
  }
}

.success-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.success-main {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.success-title {
  font-size: 32px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  line-height: 1.5;
}

.success-description {
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  margin: 0;
  line-height: 1.6;
  max-width: 600px;
}

.order-details-button {
  margin-top: 8px;
  padding: 12px 48px;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  background-color: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f5f5f5;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .success-section {
    padding: 80px 100px;

    &::before {
      left: 100px;
    }

    &::after {
      right: 100px;
    }
  }
}

@media (max-width: 1024px) {
  .success-section {
    padding: 60px 50px;

    &::before,
    &::after {
      display: none;
    }
  }

  .success-title {
    font-size: 28px;
  }

  .success-description {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .success-section {
    padding: 40px 24px;
  }

  .success-title {
    font-size: 24px;
  }

  .success-description {
    font-size: 14px;
  }

  .order-details-button {
    padding: 10px 32px;
    font-size: 14px;
  }
}
</style>

