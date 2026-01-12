<template>
  <div class="payment-page">
    <AppHeader />

    <main class="payment-main">
      <section class="payment-card">
        <div class="card-header">
          <h1>{{ $t('payment.page.title') }}</h1>
          <p class="subtitle">{{ $t('payment.page.subtitle') }}</p>
        </div>

        <div class="card-body">
          <div class="order-summary">
            <h2>{{ $t('payment.page.orderInfo.title') }}</h2>
            <div class="summary-row">
              <span class="label">{{ $t('payment.page.orderInfo.serviceName') }}</span>
              <span class="value">{{ itemName }}</span>
            </div>
            <div class="summary-row">
              <span class="label">{{ $t('payment.page.orderInfo.quantity') }}</span>
              <span class="value">{{ quantity }}</span>
            </div>
            <div class="summary-row">
              <span class="label">{{ $t('payment.page.orderInfo.unitPrice') }}</span>
              <span class="value">{{ currency }} {{ unitPrice.toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <span class="label">{{ $t('payment.page.orderInfo.totalAmount') }}</span>
              <span class="value">{{ currency }} {{ totalAmount }}</span>
            </div>
          </div>

          <!-- 收货信息 -->
          <div class="shipping-info">
            <h2>{{ $t('payment.page.shippingInfo.title') }}</h2>
            <el-form :model="shippingForm" :rules="shippingRules" ref="shippingFormRef" label-position="top">
              <el-form-item :label="$t('payment.page.shippingInfo.address')" prop="address">
                <el-input
                  v-model="shippingForm.address"
                  type="textarea"
                  :rows="4"
                  :placeholder="$t('payment.page.shippingInfo.addressPlaceholder')"
                  :maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item :label="$t('payment.page.shippingInfo.phone')" prop="phone">
                <el-input
                  v-model="shippingForm.phone"
                  :placeholder="$t('payment.page.shippingInfo.phonePlaceholder')"
                  :maxlength="20"
                />
              </el-form-item>
              <el-form-item :label="$t('payment.page.shippingInfo.remark')" prop="remark">
                <el-input
                  v-model="shippingForm.remark"
                  type="textarea"
                  :rows="3"
                  :placeholder="$t('payment.page.shippingInfo.remarkPlaceholder')"
                  :maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="payment-action">
            <div class="action-header">
              <h2>{{ $t('payment.page.paymentMethod.title') }}</h2>
              <p class="tips">{{ $t('payment.page.paymentMethod.tips') }}</p>
            </div>

            <!-- 测试账号提示（仅开发环境显示） -->
            <div v-if="isDevelopment" class="test-account-info">
              <h3>{{ $t('payment.page.paymentMethod.testAccount.title') }}</h3>
              <div class="test-account-details">
                <p><strong>{{ $t('payment.page.paymentMethod.testAccount.email') }}:</strong> sb-tx447x47381784@personal.example.com</p>
                <p><strong>{{ $t('payment.page.paymentMethod.testAccount.password') }}:</strong> "_o>G4Nq</p>
                <p class="test-note">{{ $t('payment.page.paymentMethod.testAccount.note') }}</p>
              </div>
            </div>

            <div class="paypal-box">
              <div v-if="paypalError" class="paypal-error">
                <p>{{ paypalError }}</p>
                <el-button type="primary" plain @click="handlePay">{{ $t('payment.page.paymentMethod.retry') }}</el-button>
              </div>

              <div v-else>
                <div v-if="loadingPaypal" class="paypal-loading">
                  <el-icon class="spin"><Loading /></el-icon>
                  <span>{{ $t('payment.page.paymentMethod.loading') }}</span>
                </div>
                <el-button
                  v-show="!loadingPaypal"
                  type="primary"
                  size="large"
                  class="paypal-button"
                  @click="handlePay"
                  :loading="loadingPaypal"
                >
                  {{ $t('payment.page.paymentMethod.button') }}
                </el-button>
                <p class="helper">{{ $t('payment.page.paymentMethod.helper') }}</p>
              </div>
            </div>

            <div v-if="paymentStatus === 'success'" class="result success">
              {{ $t('payment.page.messages.paymentSuccess') }}
            </div>
            <div v-else-if="paymentStatus === 'error'" class="result error">
              {{ $t('payment.page.messages.paymentFailed') }}
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter style="margin-top: auto"/>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import { Loading } from '@element-plus/icons-vue';
import { createPaypalOrder } from '../api';
import { useAuth } from '../composables/useAuth';

type PaymentStatus = 'idle' | 'success' | 'error';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { isLoggedIn, userInfo } = useAuth();
const shippingFormRef = ref<FormInstance>();

const normalizeCurrency = (value: string) => {
  if (!value) return 'USD';
  const upper = value.toUpperCase();
  if (upper.includes('USD') || upper.includes('美')) return 'USD';
  return upper;
};

const itemName = computed(() => (route.query.name as string) || t('payment.page.defaultServiceName'));
const productId = computed(() => (route.query.id as string) || '');
const quantity = computed(() => Number(route.query.qty) || 1);
const unitPrice = computed(() => Number(route.query.price) || 0);
const currency = computed(() => normalizeCurrency(route.query.currency as string));
const totalAmount = computed(() => (unitPrice.value * quantity.value).toFixed(2));

const loadingPaypal = ref(false);
const paypalError = ref('');
const paymentStatus = ref<PaymentStatus>('idle');
const isDevelopment = import.meta.env.DEV;

// 收货信息表单
const shippingForm = ref({
  address: '',
  phone: userInfo.value.phone || '',
  remark: '', // 备注
});

// 表单验证规则
const shippingRules: FormRules = {
  address: [
    { required: true, message: t('payment.page.shippingInfo.addressRequired'), trigger: 'blur' },
    { min: 5, message: t('payment.page.shippingInfo.addressMinLength'), trigger: 'blur' },
  ],
  phone: [
    { required: true, message: t('payment.page.shippingInfo.phoneRequired'), trigger: 'blur' },
    { pattern: /^[\d\s\-\+\(\)]+$/, message: t('payment.page.shippingInfo.phoneInvalid'), trigger: 'blur' },
  ],
};

// 处理支付
const handlePay = async () => {
  // 检查登录状态
  if (!isLoggedIn.value) {
    ElMessage.warning(t('payment.page.messages.loginRequired'));
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath, // 支付完成后返回支付页面
      },
    });
    return;
  }

  // 验证表单
  if (!shippingFormRef.value) return;
  
  const valid = await shippingFormRef.value.validate().catch(() => false);
  if (!valid) {
    ElMessage.error(t('payment.page.messages.fillShippingInfo'));
    return;
  }

  if (!productId.value) {
    ElMessage.error(t('payment.page.messages.missingServiceId'));
    return;
  }

  loadingPaypal.value = true;
  paypalError.value = '';

  try {
    // 构建订单项列表（根据 Swagger UI 实际规范）
    const orderItems = [
      {
        productId: Number(productId.value), // 商品/服务ID
        productName: itemName.value, // 商品/服务名称
        quantity: quantity.value, // 数量
        unitPrice: unitPrice.value, // 单价
        currency: currency.value, // 货币类型
        // 注意：id, orderId, createdAt 由后端生成，前端不需要发送
      },
    ];

    // 根据 Swagger UI 实际规范构建请求体
    const payload = {
      totalAmount: parseFloat(totalAmount.value), // 订单总金额
      currency: currency.value, // 货币类型
      phone: shippingForm.value.phone, // 联系电话
      address: shippingForm.value.address, // 收货地址
      remark: shippingForm.value.remark || '', // 备注（可选）
      orderItems: orderItems, // 订单项列表（必填）
    };

    const response: any = await createPaypalOrder(payload);
    
    // 后端返回支付 URL，跳转到 PayPal 支付页面
    // 根据 Swagger UI，响应结构为: { success: true, message: "string", data: { approvalUrl: "string", paymentId: "string", orderId: number, orderNo: "string" } }
    const approvalUrl = response?.data?.approvalUrl || response?.data?.paymentUrl || response?.approvalUrl || response?.paymentUrl || response?.data || response;
    
    if (typeof approvalUrl === 'string' && approvalUrl.startsWith('http')) {
      // 跳转到 PayPal 支付页面
      window.location.href = approvalUrl;
    } else {
      throw new Error(t('payment.page.messages.invalidPaymentLink'));
    }
  } catch (error: any) {
    console.error('创建支付订单失败:', error);
    const errorMessage = error?.response?.data?.message || error?.message || t('payment.page.messages.createOrderFailed');
    paypalError.value = errorMessage;
    ElMessage.error(errorMessage);
  } finally {
      loadingPaypal.value = false;
  }
};

// 检查是否是支付回调
onMounted(() => {
  // 检查登录状态
  if (!isLoggedIn.value) {
    ElMessage.warning(t('payment.page.messages.loginRequired'));
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
      name: 'PaymentSuccess',
      query: {
        name: itemName.value,
        qty: quantity.value.toString(),
        price: unitPrice.value.toString(),
        currency: currency.value,
        total: totalAmount.value,
            },
      });
  } else if (route.query.cancel === 'true' || route.path.includes('/cancel')) {
    // 支付取消回调，跳转到失败页面
    router.replace({
      name: 'PaymentFailure',
      query: {
        name: itemName.value,
        qty: quantity.value.toString(),
        price: unitPrice.value.toString(),
        currency: currency.value,
        total: totalAmount.value,
      },
    });
  }
});
</script>

<style scoped lang="scss">
.payment-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;

  // 页眉在支付页面显示为白色背景，黑色文字
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;

      .header-logo {
        color: #000000 !important;
      }

      .header-nav .nav-link {
        color: #000000 !important;

        &.router-link-active {
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
    }
  }
}

.payment-main {
  max-width: 1200px;
  margin: 100px auto 60px;
  padding: 0 24px;
}

.payment-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 24px 32px 16px;
  border-bottom: 1px solid #f0f2f5;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f2933;
  }

  .subtitle {
    margin: 8px 0 0;
    color: #6b7280;
    font-size: 14px;
  }
}

.card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 32px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}

.order-summary {
  padding: 20px;
  border: 1px solid #eef1f5;
  border-radius: 8px;
  background: #fafbfc;

  h2 {
    margin: 0 0 16px;
    font-size: 18px;
    color: #1f2933;
  }
}

.shipping-info {
  padding: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  h2 {
    margin: 0 0 24px;
    font-size: 20px;
    font-weight: 600;
    color: #000000;
    padding-bottom: 16px;
    border-bottom: 2px solid #000000;
  }

  :deep(.el-form-item) {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    color: #000000;
    font-weight: 600;
    font-size: 15px;
    padding-bottom: 12px;
    line-height: 1.5;
  }

  :deep(.el-input__wrapper) {
    background-color: #ffffff;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      border-color: #999999;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      border-color: #000000;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
    }
  }

  :deep(.el-textarea__inner) {
    background-color: #ffffff;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    color: #000000;
    font-size: 14px;
    line-height: 1.6;
    padding: 12px 14px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #999999;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &:focus {
      border-color: #000000;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
    }

    &::placeholder {
      color: #999999;
    }
  }

  :deep(.el-input__inner) {
    color: #000000;
    font-size: 14px;

    &::placeholder {
      color: #999999;
    }
  }

  :deep(.el-input__count) {
    color: #666666;
    font-size: 12px;
    background-color: transparent;
  }

  @media (max-width: 768px) {
    padding: 20px;

    h2 {
      font-size: 18px;
      margin-bottom: 20px;
    }
  }
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #e5e7eb;
  color: #4b5563;
  font-size: 14px;

  &:last-child {
    border-bottom: none;
  }

  &.total {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .label {
    color: #6b7280;
  }

  .value {
    color: #111827;
  }
}

.payment-action {
  padding: 20px;
  border: 1px solid #eef1f5;
  border-radius: 8px;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #1f2933;
  }

  .tips {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 13px;
  }
}

.test-account-info {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  background: #fffbeb;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    color: #92400e;
    font-weight: 600;
  }

  .test-account-details {
    p {
      margin: 8px 0;
      font-size: 13px;
      color: #78350f;
      line-height: 1.6;

      strong {
        color: #92400e;
        font-weight: 600;
      }
    }

    .test-note {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #fbbf24;
      font-size: 12px;
      color: #a16207;
      font-style: italic;
    }
  }
}

.paypal-box {
  margin-top: 16px;
  padding: 16px;
  border: 1px dashed #c7e2d9;
  border-radius: 8px;
  background: #f6fffb;
}

.paypal-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #b91c1c;

  p {
    margin: 0;
  }
}

.paypal-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #374151;

  .spin {
    animation: spin 1s linear infinite;
  }
}

.paypal-button {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  background-color: #0070ba;
  border-color: #0070ba;
  
  &:hover {
    background-color: #005ea6;
    border-color: #005ea6;
  }
}

.helper {
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
}

.result {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 6px;
  font-weight: 600;

  &.success {
    background: #ecfdf3;
    color: #166534;
    border: 1px solid #a7f3d0;
  }

  &.error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
