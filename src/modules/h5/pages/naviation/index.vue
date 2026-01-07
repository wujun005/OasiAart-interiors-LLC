<template>
  <div class="naviation">
    <div class="naviation-nav">
      <van-icon class="close" name="cross" @click="close" />
      <img class="logo" src="@/assets/images/h5/logo2.png" alt="" />
      <LanguageSwitch class="switch" />
    </div>
    <div class="naviation-list">
      <div
        v-for="item in menus"
        :key="item.name"
        class="naviation-item"
        @click="handleClick(item)"
      >
        <div v-if="item.action === 'logout'" class="line"></div>
        <div class="item-content">
          <span class="item-text">{{ item.name }}</span>
          <img src="@/assets/images/h5/arrow2.png" alt="">
        </div>
      </div>
    </div>
    <div></div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import LanguageSwitch from '../../components/language-switch/index.vue';
const router = useRouter();
const menus = [
  {
    name: '首页',
    path: '/',
  },
  {
    name: '服务',
    path: '/products',
  },
  {
    name: '关于我们',
    path: '/about',
  },
  {
    name: '历史订单',
    path: '/history',
  },
  {
    name: '退出登录',
    path: '/login',
    action: 'logout',
  },
];

const handleClick = (item: any) => {
  if (item.action === 'logout') {
    localStorage.removeItem('token');
    localStorage.removeItem('expiresAt');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userType');
    router.replace('/login');
    return;
  }
  if (item.path) {
    router.push(item.path);
  }
};

const close = () => router.back();
</script>
<style lang="scss" scoped>
.naviation {
  padding: 0 20px;
  box-sizing: border-box;
  .naviation-nav {
    display: flex;
    align-items: center;
    position: relative;
    height: 40px;
    .close {
      font-size: 12px;
    }
    .logo {
      width: 130px;
      height: 17px;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }
    .switch {
      margin-left: auto;
    }
  }
  .naviation-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    .naviation-item {
      font-size: 16px;
      color: #000;
      padding: 8px 0;
      cursor: pointer;
      line-height: 40px;
      .item-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .item-arrow {
        color: #00000080;
        font-size: 18px;
      }
      .line {
        width: 100%;
        height: 1px;
        background: #0000001f;
        // margin: 10px 0;
        margin-bottom: 30px;
      }
    }
  }
}
</style>
