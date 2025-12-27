<template>
  <div class="about-page">
    <AppHeader />

    <main class="about-content">
      <!-- Banner Section -->
      <section class="about-banner">
        <div class="banner-background">
          <!-- 背景图案 -->
        </div>
        <div class="banner-overlay"></div>
        <div class="banner-content">
          <h1 class="banner-title">{{ $t('aboutPage.banner.title') }}</h1>
        </div>
      </section>

      <!-- Section 1: Company Introduction -->
      <section class="about-section section-intro">
        <div class="section-container">
          <div class="intro-content">
            <!-- Left: Text -->
            <div class="intro-text">
              <h2 class="section-title">{{ $t('aboutPage.intro.title') }}</h2>
              <p class="intro-description">{{ $t('aboutPage.intro.description') }}</p>
            </div>
            <!-- Right: Image -->
            <div class="intro-image">
              <img
                :src="introImage"
                alt="Company Building"
                class="building-image"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Our Values -->
      <section class="about-section section-values">
        <div class="section-container">
          <h2 class="values-title">{{ $t('aboutPage.values.title') }}</h2>
          <div class="values-grid">
            <div
              v-for="value in values"
              :key="value.id"
              class="value-card"
            >
              <div class="value-icon">
                <img
                  :src="value.icon"
                  :alt="$t(value.titleKey)"
                  class="icon-image"
                />
              </div>
              <h3 class="value-title">{{ $t(value.titleKey) }}</h3>
              <p class="value-description">{{ $t(value.descriptionKey) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Welcome Section -->
      <section class="about-section section-welcome">
        <div class="section-container">
          <div class="welcome-content">
            <!-- Left: Image -->
            <div class="welcome-image">
              <img
                :src="welcomeImage"
                alt="Welcome"
                class="building-image"
              />
            </div>
            <!-- Right: Text and Contact -->
            <div class="welcome-text">
              <h2 class="welcome-title">{{ $t('aboutPage.welcome.title') }}</h2>
              <p class="welcome-location">{{ $t('aboutPage.welcome.location') }}</p>
              <p class="welcome-description">{{ $t('aboutPage.welcome.description') }}</p>
              <div class="contact-info">
                <div class="contact-item">
                  <span class="contact-label">{{ $t('aboutPage.welcome.emailLabel') }}</span>
                  <span class="contact-value">{{ $t('aboutPage.welcome.email') }}</span>
                </div>
                <div class="contact-item">
                  <span class="contact-label">{{ $t('aboutPage.welcome.phoneLabel') }}</span>
                  <span class="contact-value">{{ $t('aboutPage.welcome.phone') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Join Us -->
      <section class="about-section section-join">
        <div class="join-background">
          <img
            :src="joinImage"
            alt="Join Us"
            class="join-image"
          />
        </div>
        <div class="join-overlay"></div>
        <div class="join-bottom-bar"></div>
        <div class="join-right-space"></div>
        <div class="join-right-black"></div>
        <div class="join-content-wrapper">
          <div class="join-content">
            <div class="join-left">
              <h2 class="join-title">
                <span class="join-title-line1">{{ $t('aboutPage.join.titleLine1') }}</span>
                <span class="join-title-line2">{{ $t('aboutPage.join.titleLine2') }}</span>
              </h2>
            </div>
            <div class="join-right">
              <el-button type="primary" size="large" class="join-button" @click="handleJoinUs">
                {{ $t('aboutPage.join.button') }}
              </el-button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />

    <!-- 加入我们弹窗 -->
    <el-dialog
      v-model="joinDialogVisible"
      :title="$t('aboutPage.join.dialog.title')"
      width="480px"
      :close-on-click-modal="false"
      class="join-dialog"
    >
      <div class="join-dialog-content">
        <div class="contact-item">
          <span class="contact-label">{{ $t('aboutPage.join.dialog.emailLabel') }}</span>
          <span class="contact-value">{{ contactInfo.email }}</span>
        </div>
        <div class="contact-item">
          <span class="contact-label">{{ $t('aboutPage.join.dialog.phoneLabel') }}</span>
          <span class="contact-value">{{ $t('aboutPage.welcome.phone') }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';
import { contactInfo } from '../data/homepage';
import bannerImage from '@/assets/images/about/image_1.png';
import introImage from '@/assets/images/about/image_2.png';
import welcomeImage from '@/assets/images/about/image_3.png';
import joinImage from '@/assets/images/about/image_4.png';
import icon1 from '@/assets/images/about/icon_1.png';
import icon2 from '@/assets/images/about/icon_2.png';
import icon3 from '@/assets/images/about/icon_3.png';
import icon4 from '@/assets/images/about/icon_3(1).png';
import icon5 from '@/assets/images/about/icon_5.png';
import icon6 from '@/assets/images/about/icon_6.png';

const router = useRouter();
const joinDialogVisible = ref(false);

const values = [
  {
    id: 'quality',
    icon: icon1,
    titleKey: 'aboutPage.values.quality.title',
    descriptionKey: 'aboutPage.values.quality.description',
  },
  {
    id: 'commitment',
    icon: icon2,
    titleKey: 'aboutPage.values.commitment.title',
    descriptionKey: 'aboutPage.values.commitment.description',
  },
  {
    id: 'innovation',
    icon: icon3,
    titleKey: 'aboutPage.values.innovation.title',
    descriptionKey: 'aboutPage.values.innovation.description',
  },
  {
    id: 'openness',
    icon: icon4,
    titleKey: 'aboutPage.values.openness.title',
    descriptionKey: 'aboutPage.values.openness.description',
  },
  {
    id: 'teamwork',
    icon: icon5,
    titleKey: 'aboutPage.values.teamwork.title',
    descriptionKey: 'aboutPage.values.teamwork.description',
  },
  {
    id: 'leadership',
    icon: icon6,
    titleKey: 'aboutPage.values.leadership.title',
    descriptionKey: 'aboutPage.values.leadership.description',
  },
];

const handleJoinUs = () => {
  joinDialogVisible.value = true;
};
</script>

<style scoped lang="scss">
.about-page {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
}

.about-content {
  width: 100%;
}

// Banner Section
.about-banner {
  position: relative;
  width: 100%;
  height: 300px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: -72px;

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
    z-index: 1;

    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      background-image: url('@/assets/images/about/image_1@2x.png');
    }
  }

  .banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 2;
  }

  .banner-content {
    position: relative;
    z-index: 3;
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    padding: 0 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .banner-title {
    font-size: 3rem;
    font-weight: bold;
    color: #ffffff;
    margin: 0;
    text-align: center;
  }
}

// Common Section Styles
.about-section {
  width: 100%;
}

.section-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 4rem 200px;
}

// Section 1: Introduction
.section-intro {
  background-color: #f5f5f5; // 浅米色背景
}

.intro-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.intro-text {
  .section-title {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    margin: 0 0 1.5rem 0;
  }

  .intro-description {
    font-size: 1rem;
    line-height: 1.8;
    color: #333;
    margin: 0;
  }
}

.intro-image {
  width: 100%;
  height: 500px;

  .building-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
}

// Section 2: Welcome
.section-welcome {
  background-color: #ffffff;
}

.welcome-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.welcome-image {
  width: 100%;
  height: 500px;

  .building-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
}

.welcome-text {
  .welcome-title {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    margin: 0 0 1rem 0;
  }

  .welcome-location {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 1.5rem 0;
  }

  .welcome-description {
    font-size: 1rem;
    line-height: 1.8;
    color: #333;
    margin: 0 0 2rem 0;
  }

  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .contact-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .contact-label {
        font-size: 1rem;
        color: #333;
      }

      .contact-value {
        font-size: 1rem;
        color: #666;
      }
    }
  }
}

// Section 3: Values
.section-values {
  background-color: #f5f5f5; // 浅米色背景
  
  .section-container {
    max-width: 1200px; // 价值观部分使用更小的最大宽度
  }
}

.values-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 3rem 0;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  max-width: 1000px;
  margin: 0 auto;
}

.value-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  
  // 只有第一行（前3个）有下边框
  &:nth-child(-n + 3) {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 3rem;
  }

  .value-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .value-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    margin: 0;
  }

  .value-description {
    font-size: 1rem;
    line-height: 1.6;
    color: #666;
    margin: 0;
    max-width: 280px; // 限制描述文本的最大宽度
  }
}

// Section 4: Join Us
.section-join {
  position: relative;
  width: 100%;
  height: 600px;
  min-height: 600px;
  display: flex;
  align-items: center;
  overflow: hidden;
  margin-bottom: 0;
  background-color: #ffffff; // 右侧空白区域背景色为白色
}

.join-background {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% - 200px); // 减去右边距200px
  height: calc(100% - 60px); // 减去底部黑色条带的高度
  z-index: 1;

  .join-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.join-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% - 200px); // 减去右边距200px
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.65); // #000000 65% 透明度，与首页联系我们保持一致
  z-index: 2;
}


.join-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #000000;
  z-index: 3;
}

// 右侧区域：上半部分（透明，沿用页面背景色），下半部分黑色
.join-right-space {
  position: absolute;
  top: 0;
  right: 0; // 右侧区域从最右边开始
  width: 200px;
  height: 50%; // 上半部分
  // 不设置背景色，沿用页面背景色
  z-index: 1;
}

.join-right-black {
  position: absolute;
  bottom: 60px; // 在底部黑色条带上方
  right: 0; // 右侧区域从最右边开始
  width: 200px;
  height: calc(50% - 30px); // 下半部分，减去底部黑色条带的一半高度
  background-color: #000000;
  z-index: 1;
}

.join-content-wrapper {
  position: relative;
  z-index: 4;
  width: 100%; // 覆盖整个宽度
  height: calc(100% - 60px); // 减去底部黑色条带
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 200px; // 左右内边距200px
  box-sizing: border-box;
}

.join-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: calc(100% - 200px); // 减去右侧200px空间
}

.join-left {
  flex: 1;
  display: flex;
  align-items: center; // 确保文本垂直居中
  
  .join-title {
    font-size: 3rem;
    font-weight: bold;
    color: #ffffff;
    margin: 0;
    line-height: 1.2;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .join-title-line1,
  .join-title-line2 {
    display: block;
  }
}

.join-right {
  display: flex;
  align-items: center;
}

.join-button {
  padding: 1rem 3rem;
  font-size: 1.125rem;
  border-radius: 4px;
  background-color: #8b7355; // 棕色/橄榄色
  border: none;
  color: #ffffff;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #756147;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .section-container {
    padding: 4rem 100px;
  }

  .banner-content,
  .join-content-wrapper {
    padding: 0 100px;
  }
}

@media (max-width: 1024px) {
  .intro-content,
  .welcome-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .values-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .section-container {
    padding: 3rem 50px;
  }

  .banner-content,
  .join-content-wrapper {
    padding: 0 50px;
  }
}

@media (max-width: 768px) {
  .about-banner {
    height: 250px;
    min-height: 250px;

    .banner-title {
      font-size: 2rem;
    }
  }

  .section-container {
    padding: 2rem 30px;
  }

  .intro-image,
  .welcome-image {
    height: 300px;
  }

  .values-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .value-card {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 2rem;

    &:last-child {
      border-bottom: none;
    }
  }

  .section-join {
    height: 500px;
    min-height: 500px;
  }

  .join-title {
    font-size: 2rem !important;
  }

  .join-button {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }

  .banner-content,
  .join-content-wrapper {
    padding: 0 30px;
  }
}

// 加入我们弹窗样式
.join-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
  }
  
  :deep(.el-dialog__header) {
    padding: 4rem 4rem 2rem 4rem;
    border-bottom: 1px solid #e0e0e0;
    margin: 0;
    position: relative;
    display: block !important;
    text-align: center;
    min-height: 120px;
    
    .el-dialog__title {
      font-size: 1.75rem;
      font-weight: bold !important;
      color: #333;
      line-height: 1.5;
      text-align: center !important;
      position: absolute;
      left: 50%;
      top: 4rem;
      transform: translateX(-50%);
      width: auto;
      margin: 0;
      padding: 0;
    }
    
    .el-dialog__headerbtn {
      position: absolute;
      top: 3rem;
      right: 4rem;
      width: 32px;
      height: 32px;
      z-index: 1;
      
      .el-dialog__close {
        font-size: 1.5rem;
        color: #333;
        font-weight: 500;
      }
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 4rem;
  }
}

.join-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  
  .contact-item {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    line-height: 1.5;
    
    .contact-label {
      color: #333;
      font-weight: 400;
    }
    
    .contact-value {
      color: #333;
      font-weight: 400;
    }
  }
}
</style>
