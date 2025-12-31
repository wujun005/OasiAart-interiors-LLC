<template>
  <div class="order-detail-page">
    <AppHeader />

    <main class="order-detail-content">
      <div class="order-detail-container">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <router-link to="/order-history" class="breadcrumb-link">
            {{ $t('orderDetail.breadcrumb.orderHistory') }}
          </router-link>
          <span class="breadcrumb-separator">></span>
          <span class="breadcrumb-current">{{ $t('orderDetail.breadcrumb.orderDetail') }}</span>
        </div>

        <!-- Order Summary Block -->
        <div class="order-summary-block">
          <div class="summary-left">
            <div class="summary-item">
              <span class="summary-label">{{ $t('orderDetail.summary.account') }}</span>
              <span class="summary-value">{{ orderInfo.account || '-' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ $t('orderDetail.summary.date') }}</span>
              <span class="summary-value">{{ orderInfo.orderDate || '-' }}</span>
            </div>
          </div>
          <div class="summary-right">
            <div class="summary-item">
              <span class="summary-label">{{ $t('orderDetail.summary.paymentInfo') }}</span>
              <span class="summary-value">{{ orderInfo.paymentInfo || '-' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ $t('orderDetail.summary.orderNumber') }}</span>
              <span class="summary-value">{{ orderInfo.orderNo || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Service Category Header -->
        <div class="service-category-header">
          <h2 class="category-title">{{ orderInfo.serviceName || '-' }}</h2>
        </div>

        <!-- Order Item Details -->
        <div class="order-item-details">
          <div class="item-image">
            <img
              v-if="orderInfo.serviceImage"
              :src="orderInfo.serviceImage"
              :alt="orderInfo.serviceName"
            />
            <div v-else class="image-placeholder">
              {{ $t('orderDetail.noImage') }}
            </div>
          </div>
          <div class="item-info">
            <h3 class="item-name">{{ orderInfo.serviceName || '-' }}</h3>
            <p class="item-rate">{{ orderInfo.serviceRate || '-' }}</p>
            <p class="item-quantity">X{{ orderInfo.quantity || 0 }}</p>
          </div>
          <div class="item-price">
            <span class="price-amount">{{ orderInfo.currency || 'USD' }}{{ orderInfo.itemTotal || 0 }}</span>
          </div>
        </div>

        <!-- Total Section -->
        <div class="total-section">
          <span class="total-label">{{ $t('orderDetail.total') }}</span>
          <span class="total-amount">{{ orderInfo.currency || 'USD' }}{{ orderInfo.totalAmount || 0 }}</span>
        </div>

        <!-- Thank You Message -->
        <div class="thank-you-message">
          <p>{{ $t('orderDetail.thankYou') }}</p>
        </div>
      </div>

      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import { getOrderDetail } from '../api';
import { useAuth } from '../composables/useAuth';

const route = useRoute();
const { isLoggedIn } = useAuth();

interface OrderInfo {
  id?: string | number;
  orderNo?: string;
  account?: string;
  orderDate?: string;
  paymentInfo?: string;
  serviceName?: string;
  serviceRate?: string;
  quantity?: number;
  itemTotal?: number;
  totalAmount?: number;
  currency?: string;
  serviceImage?: string;
}

const orderInfo = ref<OrderInfo>({});
const loading = ref(false);

// 格式化订单详情数据
const formatOrderDetail = (orderData: any): OrderInfo => {
  // 处理 API 返回的数据结构：{ data: { order, orderItems } } 或直接 { order, orderItems }
  const data = orderData?.data || orderData || {};
  const order = data?.order || orderData?.order || orderData || {};
  const orderItems = data?.orderItems || orderData?.orderItems || order.orderItems || [];
  
  // 获取第一个订单项作为主要显示项
  const firstItem = orderItems[0] || {};
  
  // 根据实际 API 结构，订单项直接包含 productName, unitPrice, quantity
  // 如果没有嵌套 product 对象，直接使用订单项的数据
  const product = firstItem?.product || {};
  const productI18n = firstItem?.productI18nList?.[0] || product?.productI18nList?.[0] || {};
  const productImage = firstItem?.productImages?.[0]?.imageUrl || product?.productImages?.[0]?.imageUrl || '';

  // 根据当前语言选择服务名称
  const currentLang = localStorage.getItem('locale') || 'zh';
  const serviceName = firstItem.productName 
    || (currentLang === 'zh' 
      ? (productI18n.nameZh || product.nameZh || product.name || '服务')
      : (productI18n.nameEn || product.nameEn || product.name || 'Service'));

  // 格式化价格 - 使用订单项中的 unitPrice
  const price = firstItem.unitPrice || firstItem.price || product.price || 0;
  const currency = firstItem.currency || order.currency || 'USD';
  const quantity = firstItem.quantity || 1;
  const serviceRate = `${currency}${price}/小时`;
  const itemTotal = price * quantity;

  // 格式化日期
  const date = order.createdAt || order.created_at || '';
  let orderDate = '';
  if (date) {
    try {
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      orderDate = `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      orderDate = date;
    }
  }

  // 获取账户信息（从用户信息或订单中）
  const userId = order.userId || localStorage.getItem('userId') || '';
  const account = userId.toString() || '-';

  // 格式化付款信息（从订单中获取或使用默认值）
  // 设计图显示格式：Apple pay 988***@qq.com Alex
  let paymentInfo = 'Apple pay';
  if (order.paymentInfo) {
    paymentInfo = order.paymentInfo;
  } else if (order.paymentMethod) {
    paymentInfo = order.paymentMethod;
  } else if (order.payStatus === 'PAID' || order.payStatus === 'UNPAID') {
    // 根据支付状态显示付款信息
    const userEmail = localStorage.getItem('email') || '';
    const username = localStorage.getItem('username') || '';
    if (userEmail) {
      // 部分隐藏邮箱
      const emailParts = userEmail.split('@');
      const maskedEmail = emailParts[0]?.substring(0, 3) + '***@' + (emailParts[1] || '');
      paymentInfo = `Apple pay ${maskedEmail} ${username || ''}`.trim();
    }
  }

  return {
    id: order.id,
    orderNo: order.orderNo,
    account,
    orderDate,
    paymentInfo,
    serviceName,
    serviceRate,
    quantity,
    itemTotal,
    totalAmount: order.totalAmount || itemTotal,
    currency,
    serviceImage: productImage,
  };
};

// 获取订单详情
const fetchOrderDetail = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录');
    return;
  }

  const orderId = route.params.id as string;
  if (!orderId) {
    ElMessage.error('订单ID不存在');
    return;
  }

  loading.value = true;
  try {
    const response: any = await getOrderDetail(orderId);
    orderInfo.value = formatOrderDetail(response);
  } catch (error: any) {
    console.error('获取订单详情失败:', error);
    ElMessage.error(error?.message || '获取订单详情失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOrderDetail();
});
</script>

<style scoped lang="scss">
.order-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;

  // 页眉在订单详情页面显示为白色背景，黑色文字
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
    }
  }
}

.order-detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 72px; // 为固定定位的页眉留出空间
}

.order-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 200px 60px;
  width: 100%;
}

// Breadcrumb
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 40px;
  font-size: 14px;

  .breadcrumb-link {
    color: #000000;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #666;
    }
  }

  .breadcrumb-separator {
    color: #666;
  }

  .breadcrumb-current {
    color: #666;
  }
}

// Order Summary Block
.order-summary-block {
  background-color: #f5f5f5;
  padding: 32px 40px;
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  gap: 40px;
}

.summary-left,
.summary-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

.summary-value {
  font-size: 16px;
  color: #000000;
  font-weight: 500;
}

// Service Category Header
.service-category-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.category-title {
  font-size: 24px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}

// Order Item Details
.order-item-details {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.item-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-name {
  font-size: 20px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}

.item-rate {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.item-quantity {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.item-price {
  min-width: 100px;
  text-align: right;
}

.price-amount {
  font-size: 20px;
  font-weight: 600;
  color: #000000;
}

// Total Section
.total-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.total-label {
  font-size: 18px;
  font-weight: 500;
  color: #000000;
}

.total-amount {
  font-size: 20px;
  font-weight: 600;
  color: #000000;
}

// Thank You Message
.thank-you-message {
  text-align: center;
  padding: 40px 0;

  p {
    font-size: 18px;
    color: #000000;
    margin: 0;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .order-detail-container {
    padding: 40px 100px 60px;
  }
}

@media (max-width: 1024px) {
  .order-detail-container {
    padding: 40px 50px 60px;
  }

  .order-summary-block {
    flex-direction: column;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .order-detail-container {
    padding: 30px 24px 40px;
  }

  .order-item-details {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-image {
    width: 100%;
    height: 200px;
  }

  .item-price {
    width: 100%;
    text-align: left;
  }

  .total-section {
    justify-content: space-between;
  }
}
</style>

