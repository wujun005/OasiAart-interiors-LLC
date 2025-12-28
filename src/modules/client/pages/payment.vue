<template>
  <div class="payment-page">
    <AppHeader />

    <main class="payment-main">
      <section class="payment-card">
        <div class="card-header">
          <h1>PayPal Checkout</h1>
          <p class="subtitle">确认订单并完成支付</p>
        </div>

        <div class="card-body">
          <div class="order-summary">
            <h2>订单信息</h2>
            <div class="summary-row">
              <span class="label">服务名称</span>
              <span class="value">{{ itemName }}</span>
            </div>
            <div class="summary-row">
              <span class="label">数量</span>
              <span class="value">{{ quantity }}</span>
            </div>
            <div class="summary-row">
              <span class="label">单价</span>
              <span class="value">{{ currency }} {{ unitPrice.toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <span class="label">应付总额</span>
              <span class="value">{{ currency }} {{ totalAmount }}</span>
            </div>
          </div>

          <div class="payment-action">
            <div class="action-header">
              <h2>支付方式</h2>
              <p class="tips">使用 PayPal 支付，更安全快捷</p>
            </div>

            <div class="paypal-box">
              <div v-if="paypalError" class="paypal-error">
                <p>无法加载 PayPal：{{ paypalError }}</p>
                <el-button type="primary" plain @click="reload">重新加载</el-button>
              </div>

              <div v-else>
                <div v-if="loadingPaypal" class="paypal-loading">
                  <el-icon class="spin"><Loading /></el-icon>
                  <span>正在加载 PayPal...</span>
                </div>
                <div v-show="!loadingPaypal" id="paypal-buttons-container"></div>
                <p class="helper">若无法显示按钮，请检查网络或稍后重试。</p>
              </div>
            </div>

            <div v-if="paymentStatus === 'success'" class="result success">
              支付成功，感谢您的购买！
            </div>
            <div v-else-if="paymentStatus === 'error'" class="result error">
              支付未完成，请稍后重试。
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
import { useRoute } from 'vue-router';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import { Loading } from '@element-plus/icons-vue';

type PaymentStatus = 'idle' | 'success' | 'error';

const route = useRoute();

const normalizeCurrency = (value: string) => {
  if (!value) return 'USD';
  const upper = value.toUpperCase();
  if (upper.includes('USD') || upper.includes('美')) return 'USD';
  return upper;
};

const itemName = computed(() => (route.query.name as string) || '服务名称');
const quantity = computed(() => Number(route.query.qty) || 1);
const unitPrice = computed(() => Number(route.query.price) || 0);
const currency = computed(() => normalizeCurrency(route.query.currency as string));
const totalAmount = computed(() => (unitPrice.value * quantity.value).toFixed(2));

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const loadingPaypal = ref(false);
const paypalError = ref('');
const paymentStatus = ref<PaymentStatus>('idle');

const loadPaypalSdk = async () => {
  if (!clientId) {
    paypalError.value = '缺少 PayPal client id 配置';
    return;
  }
  // 已加载则直接返回
  if ((window as any).paypal) return;

  loadingPaypal.value = true;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency.value}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PayPal SDK 加载失败'));
    document.body.appendChild(script);
  })
    .catch((err) => {
      paypalError.value = err?.message || 'PayPal SDK 加载失败';
    })
    .finally(() => {
      loadingPaypal.value = false;
    });
};

const renderPaypalButtons = () => {
  const paypal = (window as any).paypal;
  if (!paypal || paypalError.value) return;

  paypal.Buttons({
    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
    createOrder: (_data: any, actions: any) => {
      return actions.order.create({
        purchase_units: [
          {
            description: itemName.value,
            amount: {
              currency_code: currency.value,
              value: totalAmount.value,
            },
          },
        ],
      });
    },
    onApprove: (_data: any, actions: any) =>
      actions.order.capture().then(() => {
        paymentStatus.value = 'success';
      }),
    onError: () => {
      paymentStatus.value = 'error';
    },
  }).render('#paypal-buttons-container');
};

const reload = async () => {
  paypalError.value = '';
  await loadPaypalSdk();
  renderPaypalButtons();
};

onMounted(async () => {
  await loadPaypalSdk();
  renderPaypalButtons();
});
</script>

<style scoped lang="scss">
.payment-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
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

#paypal-buttons-container {
  min-height: 48px;
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
