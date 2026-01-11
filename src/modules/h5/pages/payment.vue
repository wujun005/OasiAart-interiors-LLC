<template>
  <div class="payment-page">
    <van-nav-bar
      title="支付"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
    />

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="24px">加载中...</van-loading>
    </div>

    <template v-else>
      <div class="payment-content">
        <!-- 订单信息 -->
        <van-cell-group inset class="order-summary">
          <div class="summary-header">
            <h2>订单信息</h2>
          </div>
          <van-cell title="服务名称" :value="itemName" />
          <van-cell title="数量" :value="quantity.toString()" />
          <van-cell title="单价" :value="`${currency} ${unitPrice.toFixed(2)}`" />
          <van-cell title="总金额" :value="`${currency} ${totalAmount}`" class="total-cell" />
        </van-cell-group>

        <!-- 收货信息 -->
        <van-cell-group inset class="shipping-info">
          <div class="shipping-header">
            <h2>收货信息</h2>
          </div>
          <van-field
            v-model="shippingForm.address"
            type="textarea"
            rows="4"
            label="收货地址"
            placeholder="请输入详细收货地址"
            :maxlength="200"
            show-word-limit
            :rules="[{ required: true, message: '请输入收货地址' }]"
          />
          <van-field
            v-model="shippingForm.phone"
            label="联系电话"
            placeholder="请输入联系电话"
            :maxlength="20"
            :rules="[
              { required: true, message: '请输入联系电话' },
              { pattern: /^[\d\s\-\+\(\)]+$/, message: '请输入有效的电话号码' }
            ]"
          />
          <van-field
            v-model="shippingForm.remark"
            type="textarea"
            rows="3"
            label="备注"
            placeholder="请输入备注信息（可选）"
            :maxlength="500"
            show-word-limit
          />
        </van-cell-group>

        <!-- 支付方式 -->
        <van-cell-group inset class="payment-action">
          <div class="action-header">
            <h2>支付方式</h2>
            <p class="tips">使用 PayPal 支付，更安全快捷</p>
          </div>

          <!-- 测试账号提示（仅开发环境显示） -->
          <van-notice-bar
            v-if="isDevelopment"
            left-icon="info-o"
            color="#fffbeb"
            background="#fffbeb"
            class="test-account-info"
          >
            <div class="test-account-content">
              <div class="test-title">🧪 测试账号信息</div>
              <div class="test-details">
                <div>邮箱: sb-tx447x47381784@personal.example.com</div>
                <div>密码: "_o>G4Nq</div>
              </div>
              <div class="test-note">这是 PayPal 沙盒测试账号，仅用于测试，不会产生真实交易。</div>
            </div>
          </van-notice-bar>

          <div class="paypal-box">
            <div v-if="paypalError" class="paypal-error">
              <van-notice-bar type="danger" :text="paypalError" />
              <van-button type="primary" plain block @click="handlePay" class="retry-button">
                重试
              </van-button>
            </div>

            <div v-else>
              <van-button
                type="primary"
                block
                size="large"
                class="paypal-button"
                @click="handlePay"
                :loading="loadingPaypal"
              >
                {{ loadingPaypal ? '创建订单中...' : 'Pay with PayPal' }}
              </van-button>
              <p class="helper">点击按钮将跳转到 PayPal 完成支付</p>
            </div>
          </div>
        </van-cell-group>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { showToast, showFailToast } from 'vant';
import { createPaypalOrder } from '../api';
import { useAuth } from '../composables/useAuth';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { isLoggedIn, userInfo } = useAuth();

const goBack = () => {
  router.back();
};

const loading = ref(false);
const loadingPaypal = ref(false);
const paypalError = ref('');
const isDevelopment = import.meta.env.DEV;

const normalizeCurrency = (value: string) => {
  if (!value) return 'USD';
  const upper = value.toUpperCase();
  if (upper.includes('USD') || upper.includes('美')) return 'USD';
  return upper;
};

const itemName = computed(() => (route.query.name as string) || '服务名称');
const productId = computed(() => (route.query.id as string) || '');
const quantity = computed(() => Number(route.query.qty) || 1);
const unitPrice = computed(() => Number(route.query.price) || 0);
const currency = computed(() => normalizeCurrency(route.query.currency as string));
const totalAmount = computed(() => (unitPrice.value * quantity.value).toFixed(2));

// 收货信息表单
const shippingForm = ref({
  address: '',
  phone: userInfo.value.phone || '',
  remark: '',
});

// 处理支付
const handlePay = async () => {
  // 检查登录状态
  if (!isLoggedIn.value) {
    showToast('请先登录');
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
      },
    });
    return;
  }

  // 验证表单
  if (!shippingForm.value.address || shippingForm.value.address.trim().length < 5) {
    showFailToast('请输入详细收货地址（至少5个字符）');
    return;
  }

  if (!shippingForm.value.phone || !/^[\d\s\-\+\(\)]+$/.test(shippingForm.value.phone)) {
    showFailToast('请输入有效的联系电话');
    return;
  }

  if (!productId.value) {
    showFailToast('服务ID不存在');
    return;
  }

  loadingPaypal.value = true;
  paypalError.value = '';

  try {
    // 构建订单项列表（根据 Swagger UI 实际规范）
    const orderItems = [
      {
        productId: Number(productId.value),
        productName: itemName.value,
        quantity: quantity.value,
        unitPrice: unitPrice.value,
        currency: currency.value,
      },
    ];

    // 根据 Swagger UI 实际规范构建请求体
    const payload = {
      totalAmount: parseFloat(totalAmount.value),
      currency: currency.value,
      phone: shippingForm.value.phone,
      address: shippingForm.value.address,
      remark: shippingForm.value.remark || '',
      orderItems: orderItems,
    };

    const response: any = await createPaypalOrder(payload);
    
    // 后端返回支付 URL，跳转到 PayPal 支付页面
    const approvalUrl = response?.data?.approvalUrl || response?.data?.paymentUrl || response?.approvalUrl || response?.paymentUrl || response?.data || response;
    
    if (typeof approvalUrl === 'string' && approvalUrl.startsWith('http')) {
      // 跳转到 PayPal 支付页面
      window.location.href = approvalUrl;
    } else {
      throw new Error('无效的支付链接');
    }
  } catch (error: any) {
    console.error('创建支付订单失败:', error);
    const errorMessage = error?.response?.data?.message || error?.message || '创建支付订单失败，请稍后重试';
    paypalError.value = errorMessage;
    showFailToast(errorMessage);
  } finally {
    loadingPaypal.value = false;
  }
};

// 检查是否是支付回调
onMounted(() => {
  // 检查登录状态
  if (!isLoggedIn.value) {
    showToast('请先登录');
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
      },
    });
    return;
  }

  // 检查 URL 参数，判断是否是支付成功或取消的回调
  const token = route.query.token;
  const payerId = route.query.PayerID;
  
  if (token && payerId) {
    // 支付成功回调，后端应该已经处理，直接跳转到成功页面
    router.replace({
      path: '/payment/success',
      query: {
        orderId: route.query.orderId as string,
      },
    });
  } else if (route.query.cancel === 'true' || route.path.includes('/cancel')) {
    // 支付取消回调，跳转到失败页面
    router.replace({
      path: '/payment/failure',
    });
  }
});
</script>

<style lang="scss" scoped>
.payment-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px;
  padding-bottom: 40px;
  padding-top: 0;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.payment-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 订单信息
.order-summary {
  .summary-header {
    padding: 16px 16px 12px;
    border-bottom: 1px solid #f0f0f0;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #000;
    }
  }

  :deep(.van-cell) {
    padding: 12px 16px;
  }

  .total-cell {
    :deep(.van-cell__value) {
      font-size: 18px;
      font-weight: 700;
      color: #796f51;
    }
  }
}

// 收货信息
.shipping-info {
  .shipping-header {
    padding: 16px 16px 12px;
    border-bottom: 2px solid #000;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #000;
    }
  }

  :deep(.van-field) {
    padding: 12px 16px;
  }

  :deep(.van-field__label) {
      color: #000;
      font-weight: 600;
  }
}

// 支付方式
.payment-action {
  .action-header {
    padding: 16px 16px 12px;
    border-bottom: 1px solid #f0f0f0;

    h2 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 600;
      color: #000;
    }

    .tips {
      margin: 0;
      font-size: 13px;
      color: #666;
    }
  }

  .test-account-info {
    margin: 16px;
    border-radius: 8px;
    overflow: hidden;

    .test-account-content {
      padding: 12px 0;
    }

    .test-title {
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }

    .test-details {
      font-size: 13px;
      color: #78350f;
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .test-note {
      font-size: 12px;
      color: #a16207;
      font-style: italic;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #fbbf24;
    }
  }

  .paypal-box {
    padding: 16px;
  }

  .paypal-error {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .retry-button {
    margin-top: 8px;
  }

  .paypal-button {
    width: 100%;
    height: 44px;
    background: #0070ba;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
  }

  .helper {
    margin-top: 12px;
    font-size: 12px;
    color: #666;
    text-align: center;
  }
}
</style>
