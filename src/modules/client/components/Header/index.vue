<template>
  <header :class="['app-header', { scrolled: isScrolled }]">
    <div class="header-container">
      <!-- Left section: Logo and Navigation -->
      <div class="header-left">
        <!-- Logo -->
        <div class="header-logo">
          <LogoIcon class="logo-image" />
        </div>

        <!-- Navigation -->
        <nav class="header-nav">
          <router-link to="/" class="nav-link">{{ $t('homepage.header.nav.home') }}</router-link>
          <router-link to="/services" class="nav-link">{{ $t('homepage.header.nav.services') }}</router-link>
          <router-link to="/about" class="nav-link">{{ $t('homepage.header.nav.about') }}</router-link>
          <router-link to="/order-history" class="nav-link">{{ $t('homepage.header.nav.orderHistory') }}</router-link>
        </nav>
      </div>

      <!-- Right section: Utilities -->
      <div class="header-utils">
        <!-- Search -->
        <el-input
          v-model="searchQuery"
          class="search-input"
          @keyup.enter="handleSearch"
          clearable
        >
          <template #suffix>
            <el-icon class="search-input-icon" @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>

        <!-- Language switcher -->
        <el-dropdown
          trigger="click"
          @command="handleLanguageChange"
          class="language-dropdown"
        >
          <span class="language-link">
            {{ currentLanguageText }}
            <el-icon class="language-arrow"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="zh"
                :class="{ 'is-active': currentLocale === 'zh' }"
              >
                中文
              </el-dropdown-item>
              <el-dropdown-item
                command="en"
                :class="{ 'is-active': currentLocale === 'en' }"
              >
                English
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- User icon with dropdown menu -->
        <el-dropdown
          trigger="click"
          @command="handleUserCommand"
          class="user-dropdown"
        >
          <el-icon class="util-icon" :size="20">
            <User />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <!-- 未登录状态 -->
              <template v-if="!isLoggedIn">
                <el-dropdown-item command="login">
                  {{ $t('homepage.header.user.notLoggedIn') }}
                </el-dropdown-item>
              </template>
              <!-- 已登录状态 -->
              <template v-else>
                <el-dropdown-item disabled class="user-info-item">
                  <div class="user-info">
                    <p v-if="userInfo.username" class="user-info-text">{{ userInfo.username }}</p>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  {{ $t('homepage.header.user.logout') }}
                </el-dropdown-item>
              </template>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, User, ArrowDown } from '@element-plus/icons-vue';
import LogoIcon from '@/assets/images/homepage/logo.svg?component';
import { useAuth } from '../../composables/useAuth';

const { locale, t } = useI18n();
const router = useRouter();
const { isLoggedIn, userInfo, checkLoginStatus, clearAuth } = useAuth();
const isScrolled = ref(false);
const SCROLL_THRESHOLD = 50; // 滚动阈值，超过50px时改变背景色（较小的阈值，让 Header 更快变化）

// 搜索相关
const searchQuery = ref('');

// 当前语言
const currentLocale = computed(() => locale.value);

// 当前语言显示文本
const currentLanguageText = computed(() => {
  return locale.value === 'zh' ? '中文' : 'English';
});

// 语言切换处理
const handleLanguageChange = (lang: string) => {
  locale.value = lang;
  // 保存到 localStorage，以便刷新后保持语言选择
  localStorage.setItem('locale', lang);
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > SCROLL_THRESHOLD;
};

// 搜索处理
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    // TODO: 实现搜索逻辑
    console.log('搜索:', searchQuery.value);
    // 可以在这里添加路由跳转或API调用
  }
};

// 用户菜单命令处理
const handleUserCommand = (command: string) => {
  if (command === 'login') {
    // 跳转到登录页
    router.push('/login');
  } else if (command === 'logout') {
    // 退出登录
    clearAuth();
    ElMessage.success(t('homepage.header.user.logoutSuccess'));
    // 刷新页面或跳转到首页
    router.push('/');
  }
};

// 初始化时从 localStorage 读取语言设置
onMounted(() => {
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
    locale.value = savedLocale;
  }
  
  window.addEventListener('scroll', handleScroll);
  // 初始化时也检查一次滚动位置
  handleScroll();
  
  // 检查登录状态
  checkLoginStatus();
  
  // 监听 localStorage 变化，实时更新登录状态
  window.addEventListener('storage', checkLoginStatus);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('storage', checkLoginStatus);
});

// 监听路由变化，检查登录状态
watch(() => window.location.pathname, () => {
  checkLoginStatus();
}, { immediate: true });
</script>

<style scoped lang="scss">
.app-header {
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
    padding: 0.75rem 200px;
    height: 68px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 50px;
  }

  .header-logo {
    display: flex;
    align-items: center;
    height: 100%;
    color: #ffffff; // 初始状态白色，滚动后通过 scrolled 类变为黑色

    .logo-image {
      height: 21px;
      width: auto;
      display: block;
    }
  }

  .header-nav {
    display: flex;
    gap: 50px;
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
        font-weight: bold;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0.5rem;
          right: 0.5rem;
          height: 2px;
          background-color: #ffffff;
        }
      }
    }
  }

  .header-utils {
    display: flex;
    align-items: center;
    gap: 50px;
    
    // 搜索框和语言切换器之间的间距特殊处理
    .search-input + .language-dropdown {
      margin-left: -34px; // 50px - 16px = 34px，使间距变为16px
    }

    .util-icon {
      cursor: pointer;
      color: #ffffff;
      transition: opacity 0.3s ease;

      &:hover {
        opacity: 0.8;
      }
    }

    .user-dropdown {
      cursor: pointer;
    }

    .search-input {
      width: 180px;
      margin-right: 16px;

      :deep(.el-input__wrapper) {
        background-color: transparent;
        border: none;
        border-radius: 0;
        box-shadow: none;
        padding: 0.4rem 0;
        transition: all 0.3s ease;

        &:hover {
          background-color: transparent;
        }

        &.is-focus {
          background-color: transparent;
        }
      }

      :deep(.el-input__inner) {
        color: #ffffff;
        font-size: 14px;
        font-weight: 400;

        &::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      }

      .search-input-icon {
        cursor: pointer;
        color: rgba(255, 255, 255, 0.8);
        transition: color 0.3s ease;
        font-size: 16px;

        &:hover {
          color: #ffffff;
        }
      }
    }


    .language-dropdown {
      cursor: pointer;
    }

    .language-link {
      display: flex;
      align-items: center;
      gap: 4px;
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

    .language-arrow {
      font-size: 12px;
      transition: transform 0.3s ease;
    }
  }
}

// 当 Header 滚动后背景变为白色时，调整文字和链接颜色
.app-header.scrolled {
  border-top: none;

  .header-logo {
    color: #000000; // 滚动后 logo 变为黑色
  }

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
      font-weight: bold;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0.5rem;
        right: 0.5rem;
        height: 2px;
        background-color: #000000;
      }
    }
  }

  .header-utils {
    .util-icon {
      color: #000000;
    }

    .user-dropdown {
      cursor: pointer;
    }

    .search-input {
      :deep(.el-input__wrapper) {
        background-color: transparent;
        border: none;

        &:hover {
          background-color: transparent;
        }

        &.is-focus {
          background-color: transparent;
        }
      }

      :deep(.el-input__inner) {
        color: #000000;

        &::placeholder {
          color: rgba(0, 0, 0, 0.5);
        }
      }

      .search-input-icon {
        color: rgba(0, 0, 0, 0.6);

        &:hover {
          color: #2d8f7f;
        }
      }
    }

    .language-link {
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

<style lang="scss">
// 自定义用户电话号码提示框样式
.user-phone-tooltip {
  background-color: rgba(0, 0, 0, 0.85) !important;
  color: #ffffff !important;
  border: none !important;
  padding: 0.5rem 1rem !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  backdrop-filter: blur(4px);

  .el-popper__arrow::before {
    background-color: rgba(0, 0, 0, 0.85) !important;
    border: none !important;
  }
}

// 语言下拉菜单样式
.language-dropdown {
  .el-dropdown-menu__item {
    font-size: 16px;
    padding: 0.75rem 1.5rem;

    &.is-active {
      color: #2d8f7f;
      font-weight: 500;
    }

    &:hover {
      background-color: rgba(45, 143, 127, 0.1);
    }
  }
}

// 用户下拉菜单样式
.user-dropdown {
  .el-dropdown-menu__item {
    font-size: 16px;
    padding: 0.75rem 1.5rem;

    &.user-info-item {
      cursor: default;
      opacity: 1;
      
      .user-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        .user-info-text {
          margin: 0;
          font-size: 14px;
          color: #333;
          line-height: 1.5;
        }
      }
    }

    &:hover:not(.user-info-item) {
      background-color: rgba(45, 143, 127, 0.1);
    }
  }
}
</style>


