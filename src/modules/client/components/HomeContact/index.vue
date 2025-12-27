<template>
  <section class="home-contact">
    <div class="contact-background">
      <!-- 背景图片将通过 CSS 设置 -->
    </div>
    <div class="contact-overlay"></div>
    <div class="contact-bottom-bar"></div>
    <div class="contact-right-space"></div>
    <div class="contact-right-black"></div>
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
  background-color: #ffffff; // 右侧空白区域背景色为白色
}

.contact-background {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% - 200px); // 减去右边距200px
  height: calc(100% - 60px); // 减去底部黑色条带的高度
  background-color: #808080; // 占位背景色（灰色）
  background-image: url('@/assets/images/homepage/contact-service.png');
  background-size: cover; // 铺满整个区域
  background-position: center; // 居中显示
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
  width: calc(100% - 200px); // 减去右边距200px
  height: calc(100% - 60px);
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
  z-index: 3;
}

// 右侧区域：上半部分（透明，沿用页面背景色），下半部分黑色
.contact-right-space {
  position: absolute;
  top: 0;
  right: 0; // 右侧区域从最右边开始
  width: 200px;
  height: 50%; // 上半部分
  background-color: #f5f5f5;
  z-index: 1;
}

.contact-right-black {
  position: absolute;
  bottom: 60px; // 在底部黑色条带上方
  right: 0; // 右侧区域从最右边开始
  width: 200px;
  height: calc(50% - 30px); // 下半部分，减去底部黑色条带的一半高度
  background-color: #000000;
  z-index: 1;
}

.contact-container {
  position: relative;
  z-index: 4;
  width: calc(100% - 200px); // 只覆盖左侧内容区域
  height: calc(100% - 60px);
  display: flex;
  align-items: center;
  padding: 0 200px;
  box-sizing: border-box;
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
}

.contact-button {
  padding: 1rem 3rem;
  font-size: 1.125rem;
  border-radius: 4px;
  background-color: #8b7355; // 棕色/橄榄色，与加入我们保持一致
  border: none;
  color: #ffffff;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #756147;
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
  
  // 在小屏幕上隐藏右侧区域
  .contact-right-space,
  .contact-right-black {
    display: none;
  }
  
  .contact-background,
  .contact-overlay {
    width: 100%;
  }
  
  .contact-container {
    width: 100%;
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

