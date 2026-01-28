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
          <el-button 
            type="primary" 
            size="large" 
            class="join-button-banner" 
            @click="handleJoinUs"
          >
            {{ $t('aboutPage.join.button') }}
          </el-button>
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

      <!-- Section 4 removed -->
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

  // 页眉在关于我们页面显示为白色背景，黑色文字
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
  margin-top: 72px;

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
    height: 100%;
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

// Join Button in Banner
.join-button-banner {
  position: absolute;
  bottom: 40px;
  right: 200px;
  z-index: 4;
  background-color: #8b7355;
  border: none;
  color: #ffffff;
  padding: 12px 24px;
  font-size: 1.125rem;
  border-radius: 4px;

  &:hover {
    background-color: #756147;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .section-container {
    padding: 4rem 100px;
  }

  .banner-content {
    padding: 0 100px;
  }
  
  .join-button-banner {
    right: 100px;
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

  .banner-content {
    padding: 0 50px;
  }
  
  .join-button-banner {
    right: 50px;
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

  .banner-content {
    padding: 0 30px;
  }
  
  .join-button-banner {
    right: 30px;
    bottom: 20px;
    padding: 10px 20px;
    font-size: 1rem;
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
