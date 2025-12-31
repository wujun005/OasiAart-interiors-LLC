<template>
  <div class="payment-failure-page">
    <AppHeader />

    <main class="payment-failure-content">
      <section class="failure-section">
        <div class="failure-container">
          <div class="failure-main">
            <h1 class="failure-title">{{ $t('payment.failure.title') }}</h1>
            <p class="failure-description">{{ $t('payment.failure.description') }}</p>
            <el-button 
              type="default" 
              size="large" 
              class="back-button" 
              @click="handleGoBack"
            >
              {{ $t('payment.failure.back') }}
            </el-button>
          </div>
        </div>
      </section>

      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';

const router = useRouter();

const handleGoBack = () => {
  router.go(-1);
};
</script>

<style scoped lang="scss">
.payment-failure-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.payment-failure-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.failure-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 200px;
  margin-top: 72px; // 为固定定位的页眉留出空间
}

.failure-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.failure-main {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.failure-title {
  font-size: 32px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  line-height: 1.5;
}

.failure-description {
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  margin: 0;
  line-height: 1.6;
  max-width: 600px;
}

.back-button {
  margin-top: 8px;
  padding: 12px 48px;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  background-color: #ffffff;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f5f5f5;
    border-color: #999999;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .failure-section {
    padding: 80px 100px;
  }
}

@media (max-width: 1024px) {
  .failure-section {
    padding: 60px 50px;
  }

  .failure-title {
    font-size: 28px;
  }

  .failure-description {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .failure-section {
    padding: 40px 24px;
  }

  .failure-title {
    font-size: 24px;
  }

  .failure-description {
    font-size: 14px;
  }

  .back-button {
    padding: 10px 32px;
    font-size: 14px;
  }
}
</style>

