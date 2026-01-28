<template>
  <div class="home-page">
    <TabNav />
    <main class="content">
      <router-view />
    </main>
    <Footer />

    <!-- 悬浮联系按钮 -->
    <div class="floating-contact" @click="handleContact">
      <van-icon name="chat-o" size="24" color="#fff" />
    </div>

    <!-- 联系我们弹窗 -->
    <van-dialog
      v-model:show="showContact"
      title="联系我们"
      :show-confirm-button="false"
      close-on-click-overlay
      class="contact-dialog"
    >
      <div class="contact-content">
        <div class="contact-item">
          <span class="contact-label">邮箱</span>
          <span class="contact-value">Contact@gmail.com</span>
        </div>
        <div class="contact-item">
          <span class="contact-label">电话</span>
          <span class="contact-value">050-1234567</span>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TabNav from '@/modules/h5/components/tab-nav/index.vue';
import Footer from '@/modules/h5/components/footer/index.vue';

const showContact = ref(false);

const handleContact = () => {
  showContact.value = true;
};
</script>

<style scoped lang="scss">
.home-page {
  // padding-top: 80px; // 顶部固定导航的高度占位（40px + 上下 padding）
  box-sizing: border-box;
  min-height: 100vh;
}
.content {
  // padding: 0 12px 0;
}

.floating-contact {
  position: fixed;
  right: 20px;
  bottom: 120px;
  z-index: 999;
  width: 44px;
  height: 44px;
  background-color: #000;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
  }
}

.contact-content {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;

  .contact-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    color: #333;
    
    .contact-label {
      font-weight: 500;
      min-width: 40px;
      text-align: right;
    }

    .contact-value {
      color: #333;
    }
  }
}
</style>
