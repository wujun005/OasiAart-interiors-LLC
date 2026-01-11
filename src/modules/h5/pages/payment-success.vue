<template>
  <div class="payment-success-page">
    <van-nav-bar
      title="支付成功"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
    />

    <div class="success-content">
      <van-icon name="success" size="64" color="#07c160" class="success-icon" />
      <h1 class="success-title">已经完成付款,团队将在30分钟之内联系您。</h1>
      <p class="success-description">请保持手机畅通,可点击下方按钮「订单详情」,即可查看订单内容。</p>
      
      <div class="dotted-border">
        <van-button
          type="primary"
          block
          size="large"
          class="view-order-button"
          @click="handleViewOrder"
        >
          订单详情
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const goBack = () => {
  router.back();
};

const handleViewOrder = () => {
  // 跳转到历史订单页面
  router.push('/history');
};
</script>

<style lang="scss" scoped>
.payment-success-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  padding-top: 0;
}

.success-content {
  background: #fff;
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.success-icon {
  margin-bottom: 24px;
}

.success-title {
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px;
  line-height: 1.5;
}

.success-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 32px;
  line-height: 1.6;
}

.dotted-border {
  border: 2px dashed #0070ba;
  border-radius: 8px;
  padding: 2px;
}

.view-order-button {
  height: 44px;
  background: #0070ba;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
}
</style>
