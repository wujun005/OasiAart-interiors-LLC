<template>
  <header :class="['home-header', { scrolled: isScrolled }]">
    <div class="header-container">
      <!-- Logo -->
      <div class="header-logo">
        <img src="@/assets/images/homepage/logo.png" alt="OASIS ART" class="logo-image" />
      </div>

      <!-- Navigation -->
      <nav class="header-nav">
        <router-link to="/" class="nav-link">{{ $t('homepage.header.nav.home') }}</router-link>
        <router-link to="/services" class="nav-link">{{ $t('homepage.header.nav.services') }}</router-link>
        <router-link to="/about" class="nav-link">{{ $t('homepage.header.nav.about') }}</router-link>
        <router-link to="/order-history" class="nav-link">{{ $t('homepage.header.nav.orderHistory') }}</router-link>
      </nav>

      <!-- Right side utilities -->
      <div class="header-utils">
        <!-- Search icon -->
        <el-icon class="util-icon" :size="20">
          <Search />
        </el-icon>

        <!-- Language switcher -->
        <span class="language-link">{{ $t('homepage.header.language', '中文') }}</span>

        <!-- User icon -->
        <el-icon class="util-icon" :size="20">
          <User />
        </el-icon>

        <!-- Phone number -->
        <span class="phone-link">{{ $t('homepage.header.phone') }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Search, User } from '@element-plus/icons-vue';

const isScrolled = ref(false);
const SCROLL_THRESHOLD = 50; // 滚动阈值，超过50px时改变背景色（较小的阈值，让 Header 更快变化）

const handleScroll = () => {
  isScrolled.value = window.scrollY > SCROLL_THRESHOLD;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  // 初始化时也检查一次滚动位置
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped lang="scss">
.home-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: transparent;
  transition: background-color 0.3s ease;
  width: 100%;
  border-top: 4px solid #2d8f7f; // 顶部深色条带

  &.scrolled {
    background-color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-container {
    max-width: 1920px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 2rem;
    height: 68px;
  }

  .header-logo {
    display: flex;
    align-items: center;
    height: 100%;

    .logo-image {
      height: 40px;
      width: auto;
      object-fit: contain;
    }
  }

  .header-nav {
    display: flex;
    gap: 0.5rem;
    align-items: center;

    .nav-link {
      text-decoration: none;
      color: #ffffff;
      font-weight: 400;
      font-size: 16px;
      letter-spacing: 0;
      padding: 0.5rem 1rem;
      background-color: transparent; // 初始状态透明背景
      border-radius: 4px;
      transition: color 0.3s ease;

      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }

      &.router-link-active {
        color: #ffffff;
        font-weight: 500;
      }
    }
  }

  .header-utils {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .util-icon {
      cursor: pointer;
      color: #ffffff;
      transition: opacity 0.3s ease;

      &:hover {
        opacity: 0.8;
      }
    }

    .language-link,
    .phone-link {
      font-weight: 400;
      font-size: 16px;
      letter-spacing: 0;
      color: #ffffff;
      padding: 0.5rem 1rem;
      background-color: transparent; // 初始状态透明背景
      border-radius: 4px;
      transition: color 0.3s ease;
      cursor: pointer;

      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

// 当 Header 滚动后背景变为白色时，调整文字和链接颜色
.home-header.scrolled {
  border-top: none;

  .header-nav .nav-link {
    color: #000000;
    font-weight: 400;
    font-size: 16px;
    letter-spacing: 0;
    background-color: transparent; // 滚动后移除背景色
    padding: 0.5rem 1rem;

    &:hover {
      background-color: transparent;
    }

    &.router-link-active {
      background-color: transparent;
    }
  }

  .header-utils {
    .util-icon {
      color: #000000;
    }

    .language-link,
    .phone-link {
      color: #000000;
      font-weight: 400;
      font-size: 16px;
      letter-spacing: 0;
      background-color: transparent; // 滚动后移除背景色
      padding: 0.5rem 1rem;

      &:hover {
        background-color: transparent;
      }
    }
  }
}
</style>

