<template>
  <div class="order-detail-page">
    <!-- 页眉 -->
    <TabNav />

    <!-- 面包屑导航 -->
    <Breadcrumb :brand-list="brandList" />

    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="24px">加载中...</van-loading>
    </div>

    <div v-else-if="!orderInfo.id" class="empty-container">
      <van-empty description="订单不存在" />
    </div>

    <template v-else>
      <div class="order-detail-content">
        <!-- 订单信息卡片（灰色背景） -->
        <div class="order-info-card">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">账户名称</span>
              <span class="info-value">{{ orderInfo.account || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">付款信息</span>
              <span class="info-value">{{ orderInfo.paymentInfo || '-' }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">日期</span>
              <span class="info-value">{{ orderInfo.orderDate || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">订单号</span>
              <span class="info-value">{{ orderInfo.orderNo || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 服务详情卡片（白色背景，灰色头部） -->
        <div class="service-detail-card">
          <!-- 服务头部（灰色背景） -->
          <div class="service-header">
            <span class="service-name-header">{{ orderInfo.serviceName || '服务' }}</span>
            <span class="service-status" :class="getStatusClass(orderInfo.orderStatus)">
              {{ getStatusText(orderInfo.orderStatus) }}
            </span>
          </div>

          <!-- 服务内容 -->
          <div class="service-content">
            <!-- 服务图片 -->
            <div class="service-image">
              <img
                v-if="orderInfo.serviceImage"
                :src="orderInfo.serviceImage"
                :alt="orderInfo.serviceName"
              />
              <div v-else class="image-placeholder">
                <van-icon name="photo" size="32" color="#ccc" />
              </div>
            </div>

            <!-- 服务信息 -->
            <div class="service-info">
              <h3 class="service-name">{{ orderInfo.serviceName || '服务' }}</h3>
              <div class="service-rate">{{ orderInfo.serviceRate || '-' }}</div>
              <div class="service-quantity">X{{ orderInfo.quantity || 0 }}</div>
            </div>
          </div>
        </div>

        <!-- 总计金额 -->
        <div class="total-section">
          <span class="total-label">总计</span>
          <span class="total-amount">{{ orderInfo.currency || 'USD' }}{{ orderInfo.totalAmount || 0 }}</span>
        </div>
      </div>
    </template>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showFailToast } from 'vant';
import { getOrderDetail } from '../api';
import { useAuth } from '../composables/useAuth';
import Breadcrumb from '../components/bread-crumb/index.vue';
import Footer from '../components/footer/index.vue';
import TabNav from '../components/tab-nav/index.vue';

const route = useRoute();
const router = useRouter();
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
  orderStatus?: string;
}

const orderInfo = ref<OrderInfo>({});
const loading = ref(false);

// 面包屑导航
const brandList = computed(() => [
  {
    name: '历史订单',
    path: '/history',
  },
  {
    name: '订单详情',
    path: route.path,
  },
]);

// 格式化订单详情数据
const formatOrderDetail = (orderData: any): OrderInfo => {
  // 处理 API 返回的数据结构：{ data: { order, orderItems, productImages } } 或直接 { order, orderItems, productImages }
  const data = orderData?.data || orderData || {};
  const order = data?.order || orderData?.order || orderData || {};
  const orderItems = data?.orderItems || orderData?.orderItems || order.orderItems || [];
  const productImages = data?.productImages || {}; // productImages 在 data 顶层
  
  // 获取第一个订单项作为主要显示项
  const firstItem = orderItems[0] || {};
  
  // 根据实际 API 结构，订单项直接包含 productName, unitPrice, quantity
  // 如果没有嵌套 product 对象，直接使用订单项的数据
  const product = firstItem?.product || {};
  const productI18n = firstItem?.productI18nList?.[0] || product?.productI18nList?.[0] || {};
  
  // 根据实际 API 结构，productImages 在 data 顶层，与 order 和 orderItems 平级
  // productImages: { 7: ["https://..."] }，键是 productId，值是图片 URL 数组
  const productId = firstItem?.productId || product?.id;
  let productImage = '';
  
  if (productImages && productId) {
    // productImages 是对象，键是 productId
    const imageArray = productImages[productId];
    if (Array.isArray(imageArray) && imageArray.length > 0) {
      productImage = imageArray[0]; // 第一个图片 URL
    }
  }
  
  // 如果上面没找到，尝试其他可能的路径
  if (!productImage) {
    productImage = 
      firstItem?.productImages?.[0]?.imageUrl || 
      product?.productImages?.[0]?.imageUrl ||
      firstItem?.images?.[0]?.imageUrl ||
      product?.images?.[0]?.imageUrl ||
      firstItem?.imageUrl ||
      product?.imageUrl ||
      firstItem?.productImage ||
      product?.productImage ||
      '';
  }

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
  const serviceRate = `${currency}${price.toFixed(2)}/次`;
  const itemTotal = price * quantity;

  // 格式化日期
  const date = order.createdAt || order.created_at || '';
  let orderDate = '';
  if (date) {
    try {
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).length === 1 
        ? '0' + String(dateObj.getMonth() + 1) 
        : String(dateObj.getMonth() + 1);
      const day = String(dateObj.getDate()).length === 1 
        ? '0' + String(dateObj.getDate()) 
        : String(dateObj.getDate());
      const hours = String(dateObj.getHours()).length === 1 
        ? '0' + String(dateObj.getHours()) 
        : String(dateObj.getHours());
      const minutes = String(dateObj.getMinutes()).length === 1 
        ? '0' + String(dateObj.getMinutes()) 
        : String(dateObj.getMinutes());
      const seconds = String(dateObj.getSeconds()).length === 1 
        ? '0' + String(dateObj.getSeconds()) 
        : String(dateObj.getSeconds());
      orderDate = `${year}年${month}月${day}号${hours}:${minutes}:${seconds}`;
    } catch (e) {
      orderDate = date;
    }
  }

  // 获取账户信息（从用户信息或订单中）
  const userId = order.userId || localStorage.getItem('userId') || '';
  const username = localStorage.getItem('username') || '';
  const account = username || userId.toString() || '-';

  // 格式化付款信息（从订单中获取或使用默认值）
  // 设计图显示格式：支付宝 987***@qq.com
  let paymentInfo = 'PayPal';
  if (order.paymentInfo) {
    paymentInfo = order.paymentInfo;
  } else if (order.paymentMethod) {
    paymentInfo = order.paymentMethod;
  } else if (order.payStatus === 'PAID' || order.payStatus === '已支付') {
    // 根据支付状态显示付款信息
    const userEmail = localStorage.getItem('email') || '';
    if (userEmail) {
      // 部分隐藏邮箱
      const emailParts = userEmail.split('@');
      const maskedEmail = emailParts[0]?.substring(0, 3) + '***@' + (emailParts[1] || '');
      paymentInfo = `PayPal ${maskedEmail}`;
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
    orderStatus: order.orderStatus,
  };
};

// 获取订单详情
const fetchOrderDetail = async () => {
  if (!isLoggedIn.value) {
    showToast('请先登录');
    router.push('/login?redirect=' + route.fullPath);
    return;
  }

  const orderId = route.params.id as string;
  if (!orderId) {
    showFailToast('订单ID不存在');
    return;
  }

  loading.value = true;
  try {
    const response: any = await getOrderDetail(orderId);
    
    // 调试：打印 API 响应结构
    console.log('订单详情 API 响应:', response);
    const data = response?.data || response || {};
    const orderItems = data?.orderItems || data?.order?.orderItems || [];
    const productImages = data?.productImages || {};
    console.log('productImages:', productImages);
    if (orderItems.length > 0) {
      console.log('订单项数据结构:', orderItems[0]);
      console.log('productId:', orderItems[0]?.productId);
    }
    
    orderInfo.value = formatOrderDetail(response);
  } catch (error: any) {
    console.error('获取订单详情失败:', error);
    const errorMessage = error?.response?.data?.message || error?.message || '获取订单详情失败';
    showFailToast(errorMessage);
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
  if (statusLower.indexOf('PENDING') !== -1 || statusLower.indexOf('PROCESSING') !== -1 || status === '处理中') {
    return 'status-processing';
  }
  
  // 清洁中
  if (statusLower.indexOf('CLEANING') !== -1 || status === '清洁中') {
    return 'status-cleaning';
  }
  
  // 已完成/已支付/已确认
  if (statusLower.indexOf('COMPLETED') !== -1 || statusLower.indexOf('PAID') !== -1 || 
      status === '已完成' || status === '已支付' || status === '已确认') {
    return 'status-completed';
  }
  
  // 已取消
  if (statusLower.indexOf('CANCELLED') !== -1 || status === '已取消') {
    return 'status-cancelled';
  }
  
  return 'status-unknown';
};

onMounted(() => {
  fetchOrderDetail();
});
</script>

<style lang="scss" scoped>
.order-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 0;
  padding-top: 0;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.order-detail-content {
  padding: 16px;
  padding-bottom: 0;
}

// 订单信息卡片（灰色背景，白色文字）
.order-info-card {
  background: #666;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  padding: 16px;

  .info-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-row:not(:last-child) {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 4px;
  }

  .info-value {
    font-size: 14px;
    color: #fff;
    font-weight: 500;
  }
}

// 服务详情卡片（白色背景，灰色头部）
.service-detail-card {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.service-header {
  background: #f5f5f5;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
}

.service-name-header {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.service-status {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;

  &.status-processing {
    color: #796f51;
    background: #f5f3f0;
  }

  &.status-cleaning {
    color: #0070ba;
    background: #e6f3ff;
  }

  &.status-completed {
    color: #07c160;
    background: #e8f8f0;
  }

  &.status-cancelled {
    color: #ee0a24;
    background: #ffe8e8;
  }

  &.status-unknown {
    color: #666;
    background: #f5f5f5;
  }
}

.service-content {
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.service-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;

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
    background: #f5f5f5;
  }
}

.service-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0;
}

.service-rate {
  font-size: 14px;
  color: #000;
  font-weight: 500;
}

.service-quantity {
  font-size: 14px;
  color: #000;
  font-weight: 500;
}

// 总计金额
.total-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}

.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #796f51;
}
</style>
