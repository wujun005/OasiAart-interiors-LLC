<template>
  <div class="history-page">
    <!-- Banner 区域 -->
    <div class="banner-wrapper">
      <img
        class="history-banner"
        src="@/assets/images/h5/product-banner.png"
        alt=""
      />
      <div class="history-bg">
        <div class="banner-text">历史订单</div>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="order-list-container">
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" size="24px">加载中...</van-loading>
      </div>

      <div v-else-if="orders.length === 0" class="empty-container">
        <van-empty description="暂无订单" />
      </div>

      <div v-else class="orders-list">
        <div
          v-for="(order, index) in orders"
          :key="order.id || index"
          class="order-card"
        >
          <!-- 服务图片 -->
          <div class="order-image">
            <img
              v-if="order.serviceImage"
              :src="order.serviceImage"
              :alt="order.serviceName"
            />
            <div v-else class="image-placeholder">
              <van-icon name="photo" size="24" color="#ccc" />
            </div>
          </div>

          <!-- 订单信息 -->
          <div class="order-info">
            <div class="order-header">
              <h3 class="service-name">{{ order.serviceName }}</h3>
              <span class="order-status" :class="getStatusClass(order.orderStatus)">
                {{ getStatusText(order.orderStatus) }}
              </span>
            </div>
            
            <div class="service-rate">
              {{ order.serviceRate }} x{{ order.quantity }}
            </div>

            <div class="order-meta">
              <div class="order-time">时间: {{ order.orderDate }}</div>
              <div class="order-number">订单编号: {{ order.orderNo }}</div>
            </div>
          </div>

          <!-- 查看详情按钮 -->
          <van-button
            type="primary"
            block
            class="view-details-button"
            @click="handleViewDetails(order.id)"
          >
            查看详情
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showFailToast } from 'vant';
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
  unitPrice?: number;
  currency?: string;
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
  // 每个订单项都有自己的 productImages，在 orderData 顶层
  const productImages = orderData?.productImages || {};
  
  // 获取第一个订单项作为主要显示项
  const firstItem = orderItems[0] || {};
  
  // 根据实际 API 结构，订单项可能直接包含 productName, unitPrice
  // 也可能嵌套在 product 对象中
  const product = firstItem?.product || {};
  const productI18n = firstItem?.productI18nList?.[0] || product?.productI18nList?.[0] || {};
  
  // 根据实际 API 结构，productImages 在每个订单项数据中，与 order 和 orderItems 平级
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
    currency: order.currency || 'USD',
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
    showToast('请先登录');
    router.push('/login?redirect=/history');
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
    
    // 调试：打印 API 响应结构
    console.log('订单列表 API 响应:', response);
    if (orderList.length > 0) {
      console.log('第一个订单数据结构:', orderList[0]);
      console.log('第一个订单的 productImages:', orderList[0]?.productImages);
      if (orderList[0]?.orderItems?.length > 0) {
        console.log('第一个订单项数据结构:', orderList[0].orderItems[0]);
        console.log('第一个订单项的 productId:', orderList[0].orderItems[0]?.productId);
      }
    }
    
    orders.value = Array.isArray(orderList)
      ? orderList.map(formatOrder)
      : [];
  } catch (error: any) {
    console.error('获取订单列表失败:', error);
    const errorMessage = error?.response?.data?.message || error?.message || '获取订单列表失败';
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

// 查看订单详情
const handleViewDetails = (orderId: string | number) => {
  // 暂时跳转到历史订单页面（如果后续有订单详情页，可以改为跳转到详情页）
  router.push(`/order-detail/${orderId}`);
};

onMounted(() => {
  fetchOrders();
});
</script>

<style lang="scss" scoped>
.history-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 0;
}

// Banner 区域
.banner-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
}

.history-banner {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.history-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;

  .banner-text {
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 24px;
    color: #ffffff;
    text-align: center;
  }
}

// 订单列表容器
.order-list-container {
  padding: 16px;
  padding-bottom: 0;
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

// 订单列表
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

// 订单卡片
.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}

// 订单图片
.order-image {
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

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.order-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin: 0;
  flex: 1;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;

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

.service-rate {
  font-size: 14px;
  color: #000;
  font-weight: 500;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.order-time,
.order-number {
  margin: 0;
}

// 查看详情按钮
.view-details-button {
  width: 100%;
  height: 44px;
  background: #796f51;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 12px;
}

// 调整卡片布局，按钮在底部
.order-card {
  flex-wrap: wrap;
}

.order-card > .view-details-button {
  width: 100%;
  margin-top: 12px;
}
</style>
