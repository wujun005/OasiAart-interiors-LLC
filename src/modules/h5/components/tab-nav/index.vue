<template>
  <div class="nav-bar" :class="{ 'is-scrolled': isScrolled }">
    <img
      @click="goHome"
      class="logo"
      :src="isScrolled ? scrolledIcons.logo : defaultIcons.logo"
      alt=""
    />
    <div class="right">
      <img :src="isScrolled ? scrolledIcons.search : defaultIcons.search" alt="" />
      <img
        @click="goMenu"
        :src="isScrolled ? scrolledIcons.menu : defaultIcons.menu"
        alt=""
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const isScrolled = ref(false);

const defaultIcons = {
  logo: new URL('@/assets/images/h5/logo1.png', import.meta.url).href,
  search: new URL('@/assets/images/h5/search1.png', import.meta.url).href,
  menu: new URL('@/assets/images/h5/menu1.png', import.meta.url).href,
};

const scrolledIcons = {
  logo: new URL('@/assets/images/h5/logo2.png', import.meta.url).href,
  search: new URL('@/assets/images/h5/search2.png', import.meta.url).href,
  menu: new URL('@/assets/images/h5/menu2.png', import.meta.url).href,
};

const handleScroll = () => {
  const banner = document.querySelector('.home-banner') as HTMLElement | null;
  const bannerHeight = banner?.clientHeight || 240;
  const threshold = bannerHeight - 60; // 快滚动完时切换
  isScrolled.value = window.scrollY >= threshold;
};

const goMenu = () => {
  router.push('/naviation');
};
const goHome = () => {
  router.push('/');
};

onMounted(() => {
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>
<style scoped lang="scss">
.nav-bar {
  display: flex;
  //   background: #000;
  width: 100vw;
  height: 40px;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9;
  padding: 20px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  &.is-scrolled {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .logo {
    width: 130px;
    height: 17px;
  }
  .right {
    width: 60px;
    display: flex;
    align-items: center;
    margin-left: auto;
    img {
      width: 20px;
      height: 20px;
      margin-left: 10px;
    }
  }
}
</style>
