<template>
  <section class="home-contact">
    <div class="contact-background">
      <!-- 背景图片将通过 CSS 设置 -->
    </div>
    <div class="contact-overlay"></div>
    <div class="contact-bottom-bar"></div>
    <div class="contact-container">
      <div class="contact-content">
        <!-- 左侧文字 -->
        <div class="contact-text">
          <h2 class="contact-title-line1">{{ $t('homepage.contact.titleLine1') }}</h2>
          <h2 class="contact-title-line2">{{ $t('homepage.contact.titleLine2') }}</h2>
        </div>
        
        <!-- 右侧按钮 -->
        <div class="contact-right">
          <!-- 联系我们按钮 -->
          <el-button type="primary" size="large" class="contact-button" @click="handleContact">
            {{ $t('homepage.contact.contactUs') }}
          </el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { contactInfo } from '../../data/homepage';

const handleContact = () => {
  // 打开邮件客户端
  window.location.href = `mailto:${contactInfo.email}`;
};
</script>

<style scoped lang="scss">
.home-contact {
  position: relative;
  width: 100%;
  height: 500px;
  min-height: 500px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.contact-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 60px); // 减去底部黑色条带的高度
  background-color: #808080; // 占位背景色（灰色）
  background-image: url('@/assets/images/homepage/contact-service.png');
  background-size: contain; // 改为 contain，不铺满
  background-position: right center; // 图片靠右居中显示
  background-repeat: no-repeat;
  z-index: 1;

  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    background-image: url('@/assets/images/homepage/contact-service@2x.png');
  }
}

.contact-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 60px); // 减去底部黑色条带的高度
  background: rgba(0, 0, 0, 0.65); // #000000 65% 透明度
  z-index: 2;
}

// 底部黑色条带
.contact-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #000000;
  z-index: 2;
}

.contact-container {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 200px 0 200px; // 整个卡片的右边距 200px
  height: 100%;
  display: flex;
  align-items: center;
}

.contact-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 4rem;
}

.contact-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.contact-title-line1,
.contact-title-line2 {
  font-size: 3rem;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
}

.contact-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
}

.contact-button {
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  border-radius: 4px;
  background-color: #d4a574; // 棕色/金色
  border: none;
  color: #ffffff;
  transition: background-color 0.3s ease;
  margin-right: 40px; // 按钮在卡片内的右边距

  &:hover {
    background-color: #c89664;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .contact-container {
    padding: 0 100px;
  }
}

@media (max-width: 1024px) {
  .contact-container {
    padding: 0 50px;
  }

  .contact-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 2rem;
  }

  .contact-text {
    align-items: center;
  }

  .contact-right {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .home-contact {
    height: 400px;
    min-height: 400px;
  }

  .contact-title-line1,
  .contact-title-line2 {
    font-size: 2rem;
  }

  .contact-button {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
}
</style>

