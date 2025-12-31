<template>
  <div class="order-history-page">
    <AppHeader />

    <main class="order-history-content">
      <!-- Banner Section -->
      <section class="order-banner">
        <div class="banner-background"></div>
        <div class="banner-overlay"></div>
        <div class="banner-content">
          <h1 class="banner-title">{{ $t('orderHistory.title') }}</h1>
        </div>
      </section>

      <!-- Order List Section -->
      <section class="order-list-section">
        <div class="order-list-container">
          <div v-if="loading" class="loading-container">
            <p>{{ $t('orderHistory.loading') }}</p>
          </div>
          <div v-else-if="orders.length === 0" class="empty-container">
            <p>{{ $t('orderHistory.empty') }}</p>
          </div>
          <div v-else class="orders-list">
            <div
              v-for="order in orders"
              :key="order.id"
              class="order-card"
            >
              <!-- Service Image -->
              <div class="order-image">
                <img
                  v-if="order.serviceImage"
                  :src="order.serviceImage"
                  :alt="order.serviceName"
                />
                <div v-else class="image-placeholder">
                  {{ $t('orderHistory.noImage') }}
                </div>
              </div>

              <!-- Order Details -->
              <div class="order-details">
                <h3 class="service-name">{{ order.serviceName }}</h3>
                <p class="service-rate">{{ order.serviceRate }}</p>
                <p class="service-quantity">x{{ order.quantity }}</p>
                <p class="order-date">{{ order.orderDate }}</p>
              </div>

              <!-- Order Status and Action -->
              <div class="order-status-action">
                <div class="order-status" :class="getStatusClass(order.orderStatus)">
                  {{ getStatusText(order.orderStatus) }}
                </div>
                <el-button
                  type="default"
                  class="view-details-button"
                  @click="handleViewDetails(order.id)"
                >
                  {{ $t('orderHistory.viewDetails') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import { getOrderPage } from '../api';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { isLoggedIn } = useAuth();

interface OrderItem {
  id: string | number;
  productId?: string | number;
  productName?: string;
  productNameZh?: string;
  productNameEn?: string;
  price?: number;
  quantity?: number;
  productImage?: string;
}

interface Order {
  id: string | number;
  orderNo?: string;
  userId?: string | number;
  totalAmount?: number;
  currency?: string;
  orderStatus?: string;
  payStatus?: string;
  createdAt?: string;
  orderItems?: OrderItem[];
  serviceName?: string;
  serviceRate?: string;
  quantity?: number;
  orderDate?: string;
  serviceImage?: string;
}

const orders = ref<Order[]>([]);
const loading = ref(false);

// 格式化订单数据
const formatOrder = (orderData: any): Order => {
  const order = orderData?.order || orderData || {};
  const orderItems = orderData?.orderItems || order.orderItems || [];
  
  // 获取第一个订单项作为主要显示项
  const firstItem = orderItems[0] || {};
  
  // 根据实际 API 结构，订单项可能直接包含 productName, unitPrice
  // 也可能嵌套在 product 对象中
  const product = firstItem?.product || {};
  const productI18n = firstItem?.productI18nList?.[0] || product?.productI18nList?.[0] || {};
  const productImage = firstItem?.productImages?.[0]?.imageUrl || product?.productImages?.[0]?.imageUrl || '';

  // 根据当前语言选择服务名称
  // 优先使用订单项中的 productName（API 直接返回）
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

  return {
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    totalAmount: order.totalAmount,
    currency: order.currency || 'USD', // 处理 currency 为 null 的情况
    orderStatus: order.orderStatus,
    payStatus: order.payStatus,
    createdAt: order.createdAt,
    orderItems: orderItems,
    serviceName,
    serviceRate,
    quantity,
    orderDate,
    serviceImage: productImage,
  };
};

// 获取订单列表
const fetchOrders = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录');
    router.push('/login?redirect=/order-history');
    return;
  }

  loading.value = true;
  try {
    const response: any = await getOrderPage({
      pageNum: 1,
      pageSize: 100, // 获取所有订单
    });

    // 处理响应数据
    const data = response?.data || response || {};
    const orderList = data.list || data || [];
    
    orders.value = Array.isArray(orderList)
      ? orderList.map(formatOrder)
      : [];
  } catch (error: any) {
    console.error('获取订单列表失败:', error);
    ElMessage.error(error?.message || '获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取状态文本
const getStatusText = (status?: string) => {
  if (!status) return '未知';
  
  // 处理中文状态（API 可能返回中文）
  const chineseStatusMap: Record<string, string> = {
    '已支付': '已完成',
    '已确认': '已完成',
    '处理中': '处理中',
    '清洁中': '清洁中',
    '已完成': '已完成',
    '已取消': '已取消',
  };
  
  // 处理英文状态
  const englishStatusMap: Record<string, string> = {
    PENDING: '处理中',
    PROCESSING: '处理中',
    CLEANING: '清洁中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    UNPAID: '未支付',
    PAID: '已支付',
  };
  
  // 先检查中文状态
  if (chineseStatusMap[status]) {
    return chineseStatusMap[status];
  }
  
  // 再检查英文状态
  if (englishStatusMap[status]) {
    return englishStatusMap[status];
  }
  
  // 如果都不匹配，直接返回原状态
  return status;
};

// 获取状态样式类
const getStatusClass = (status?: string) => {
  if (!status) return 'status-unknown';
  
  // 统一状态映射（将不同格式的状态映射到标准状态）
  const statusLower = status.toUpperCase();
  
  // 处理中/处理中
  if (statusLower.includes('PENDING') || statusLower.includes('PROCESSING') || status === '处理中') {
    return 'status-processing';
  }
  
  // 清洁中
  if (statusLower.includes('CLEANING') || status === '清洁中') {
    return 'status-cleaning';
  }
  
  // 已完成/已支付/已确认
  if (statusLower.includes('COMPLETED') || statusLower.includes('PAID') || 
      status === '已完成' || status === '已支付' || status === '已确认') {
    return 'status-completed';
  }
  
  // 已取消
  if (statusLower.includes('CANCELLED') || status === '已取消') {
    return 'status-cancelled';
  }
  
  return 'status-unknown';
};

// 查看订单详情
const handleViewDetails = (orderId: string | number) => {
  router.push(`/order-detail/${orderId}`);
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped lang="scss">
.order-history-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;

  // 页眉在历史订单页面显示为白色背景，黑色文字
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

.order-history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

// Banner Section
.order-banner {
  position: relative;
  width: 100%;
  height: 300px;
  margin-top: 72px; // 为固定定位的页眉留出空间
  overflow: hidden;

  .banner-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('@/assets/images/about/image_1.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
  }

  .banner-content {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .banner-title {
    font-size: 48px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    text-align: center;
  }
}

// Order List Section
.order-list-section {
  flex: 1;
  padding: 60px 200px;
  background-color: #f5f5f5;
}

.order-list-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container,
.empty-container {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.order-image {
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

.order-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .service-name {
    font-size: 20px;
    font-weight: 600;
    color: #000000;
    margin: 0;
  }

  .service-rate {
    font-size: 16px;
    color: #666;
    margin: 0;
  }

  .service-quantity {
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  .order-date {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.order-status-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  min-width: 120px;
}

.order-status {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;

  &.status-pending,
  &.status-processing {
    background-color: #fff3cd;
    color: #856404;
  }

  &.status-cleaning {
    background-color: #d1ecf1;
    color: #0c5460;
  }

  &.status-completed {
    background-color: #d4edda;
    color: #155724;
  }

  &.status-cancelled {
    background-color: #f8d7da;
    color: #721c24;
  }

  &.status-unknown {
    background-color: #e2e3e5;
    color: #383d41;
  }
}

.view-details-button {
  padding: 10px 24px;
  font-size: 14px;
  color: #ffffff;
  background-color: #8b6f47;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #7a5f3a;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .order-list-section {
    padding: 40px 100px;
  }
}

@media (max-width: 1024px) {
  .order-list-section {
    padding: 40px 50px;
  }

  .order-banner .banner-title {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .order-list-section {
    padding: 30px 24px;
  }

  .order-banner {
    height: 200px;

    .banner-title {
      font-size: 28px;
    }
  }

  .order-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-image {
    width: 100%;
    height: 200px;
  }

  .order-status-action {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>

