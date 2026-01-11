<template>
  <div class="payment-failure-page">
    <van-nav-bar
      title="支付失败"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
    />

    <div class="failure-content">
      <van-icon name="close" size="64" color="#ee0a24" class="failure-icon" />
      <h1 class="failure-title">付款失败,请重新付款。</h1>
      <p class="failure-description">点击下方按钮「返回」上一页,即可重新付款。</p>
      
      <van-button
        type="primary"
        block
        size="large"
        class="back-button"
        @click="handleBack"
      >
        返回
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.back();
};

const handleBack = () => {
  router.back();
};
</script>

<style lang="scss" scoped>
.payment-failure-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  padding-top: 0;
}

.failure-content {
  background: #fff;
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.failure-icon {
  margin-bottom: 24px;
}

.failure-title {
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px;
  line-height: 1.5;
}

.failure-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 32px;
  line-height: 1.6;
}

.back-button {
  height: 44px;
  background: #796f51;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
}
</style>
