<template>
  <div class="h5-profile-page">
    <main class="h5-profile-main">
      <section class="h5-profile-hero">
        <div class="h5-profile-hero__avatar">
          <img :src="avatarIconUrl" alt="" />
        </div>
        <div class="h5-profile-hero__text">
          <h1>{{ displayName }}</h1>
          <p>{{ displayAccount }}</p>
        </div>
      </section>

      <section class="h5-profile-card">
        <button class="h5-profile-row" type="button" @click="goSecurity">
          <div class="h5-profile-row__left">
            <img :src="userManageIconUrl" alt="" />
            <span>{{ t('h5.profile.menu.account') }}</span>
          </div>
          <img class="h5-profile-row__arrow" :src="arrowIconUrl" alt="" />
        </button>
        <button class="h5-profile-row" type="button" @click="openSupport">
          <div class="h5-profile-row__left">
            <img :src="supportIconUrl" alt="" />
            <span>{{ t('h5.profile.menu.support') }}</span>
          </div>
          <img class="h5-profile-row__arrow" :src="arrowIconUrl" alt="" />
        </button>
      </section>

      <section class="h5-profile-card h5-profile-card--join">
        <div class="h5-profile-card__title">
          <img :src="joinIconUrl" alt="" />
          <span>{{ t('h5.profile.joinUs.title') }}</span>
        </div>
        <p class="h5-profile-card__desc">{{ t('h5.profile.joinUs.desc') }}</p>
        <button class="h5-profile-mail" type="button" @click="openJoinMail">
          <img :src="mailIconUrl" alt="" />
          <span>{{ joinUsEmail }}</span>
        </button>
      </section>

      <button class="h5-profile-logout" type="button" @click="handleLogout">
        {{ t('client.header.logout') }}
      </button>
    </main>

    <nav class="h5-profile-tabbar">
      <button class="h5-profile-tabbar__item" type="button" @click="router.push({ name: 'h5-home' })">
        <img :src="tabHomeIconUrl" alt="" />
        <span>{{ t('client.header.nav.home') }}</span>
      </button>
      <button class="h5-profile-tabbar__item" type="button" @click="router.push({ name: 'h5-orders' })">
        <img :src="tabOrdersIconUrl" alt="" />
        <span>{{ t('client.header.nav.orders') }}</span>
      </button>
      <button class="h5-profile-tabbar__item h5-profile-tabbar__item--active" type="button">
        <img :src="tabProfileIconUrl" alt="" />
        <span>{{ t('client.header.profile') }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showSuccessToast } from 'vant';
import { useAuth } from '@/modules/h5/composables/useAuth';

const avatarIconUrl = 'https://www.figma.com/api/mcp/asset/0e35d62d-3d61-4e75-8c53-a1ea0e4badcf';
const userManageIconUrl = 'https://www.figma.com/api/mcp/asset/c58ec41a-9617-4239-bb92-9fad1c17d1db';
const arrowIconUrl = 'https://www.figma.com/api/mcp/asset/54dd2ae2-8304-45f5-b65a-ad13dfa0bd13';
const supportIconUrl = 'https://www.figma.com/api/mcp/asset/bd61f7c4-3be1-47a1-893f-8dfd12f5e6d6';
const joinIconUrl = 'https://www.figma.com/api/mcp/asset/e44f3cf3-d82e-461b-96c1-6ddcbad8d2eb';
const mailIconUrl = 'https://www.figma.com/api/mcp/asset/2be8db0c-618f-4f4e-917e-4aa220a82f7c';
const tabHomeIconUrl = 'https://www.figma.com/api/mcp/asset/a6820c95-bfec-4f2e-9686-0f2b037666b5';
const tabOrdersIconUrl = 'https://www.figma.com/api/mcp/asset/1c28c7f8-bec1-4d80-8c8c-630b5686a4c8';
const tabProfileIconUrl = 'https://www.figma.com/api/mcp/asset/0e16bbe3-f8ee-49e2-9f32-575dcf39ba1e';
const supportLink = 'https://wa.me/971502100284';
const joinUsEmail = 'careers@hourxportal.com';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();
const { isLoggedIn, userInfo, clearAuth, checkLoginStatus } = useAuth();

const maskPhone = (value?: string) => {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  const digits = text.replace(/[^\d+]/g, '');
  if (digits.length <= 7) {
    return text;
  }
  return digits.replace(/(\+?\d{3})\d+(\d{4})$/, '$1****$2');
};

const maskEmail = (value?: string) => {
  const text = String(value || '').trim();
  if (!text.includes('@')) {
    return text;
  }
  const [name, domain] = text.split('@');
  if (name.length <= 2) {
    return `${name[0] || ''}***@${domain}`;
  }
  return `${name.slice(0, 2)}***@${domain}`;
};

const displayName = computed(() => {
  const username = String(userInfo.value.username || '').trim();
  if (username) {
    return username;
  }
  return t('h5.profile.defaultName');
});

const displayAccount = computed(() => {
  const phone = maskPhone(userInfo.value.phone);
  if (phone) {
    return phone;
  }
  const email = maskEmail(userInfo.value.email);
  if (email) {
    return email;
  }
  return t('h5.profile.defaultAccount');
});

const ensureLogin = async () => {
  checkLoginStatus();
  if (isLoggedIn.value) {
    return;
  }
  await router.replace({
    name: 'h5-login',
    query: { redirect: route.fullPath },
  });
};

const goSecurity = () => {
  router.push({ name: 'h5-profile-security' });
};

const openSupport = () => {
  window.open(supportLink, '_blank', 'noopener,noreferrer');
};

const openJoinMail = () => {
  window.location.href = `mailto:${joinUsEmail}`;
};

const handleLogout = async () => {
  clearAuth();
  showSuccessToast(t('h5.profile.logoutSuccess'));
  await router.replace({ name: 'h5-login' });
};

onMounted(() => {
  void ensureLogin();
});
</script>

<style scoped lang="scss">
.h5-profile-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(76px + env(safe-area-inset-bottom));
}

.h5-profile-main {
  max-width: 393px;
  margin: 0 auto;
  min-height: calc(100vh - 56px);
}

.h5-profile-hero {
  height: 164px;
  padding: 60px 24px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #3972f5;
  position: relative;
  overflow: hidden;
}

.h5-profile-hero::before,
.h5-profile-hero::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.h5-profile-hero::before {
  width: 256px;
  height: 256px;
  right: -96px;
  top: -96px;
  filter: blur(64px);
}

.h5-profile-hero::after {
  width: 192px;
  height: 192px;
  left: -48px;
  top: 20px;
  filter: blur(40px);
}

.h5-profile-hero__avatar,
.h5-profile-hero__text {
  position: relative;
  z-index: 1;
}

.h5-profile-hero__avatar {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 1.8px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.h5-profile-hero__avatar img {
  width: 32px;
  height: 32px;
}

.h5-profile-hero__text h1 {
  margin: 0;
  color: #fff;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 900;
}

.h5-profile-hero__text p {
  margin: 4px 0 0;
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}

.h5-profile-card {
  margin: 12px 16px 0;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.h5-profile-card--join {
  padding: 16px;
}

.h5-profile-row {
  width: 100%;
  min-height: 47px;
  border: 0;
  background: transparent;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h5-profile-row + .h5-profile-row {
  border-top: 1px solid #f9fafb;
}

.h5-profile-row__left {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(15, 23, 42, 0.9);
  font-size: 15px;
  font-weight: 700;
}

.h5-profile-row__left img,
.h5-profile-row__arrow,
.h5-profile-card__title img,
.h5-profile-mail img,
.h5-profile-tabbar__item img {
  display: block;
}

.h5-profile-row__left img,
.h5-profile-card__title img {
  width: 20px;
  height: 20px;
}

.h5-profile-row__arrow {
  width: 18px;
  height: 18px;
}

.h5-profile-card__title {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(15, 23, 42, 0.9);
  font-size: 15px;
  font-weight: 700;
}

.h5-profile-card__desc {
  margin: 16px 0 0;
  color: rgba(15, 23, 42, 0.6);
  font-size: 13px;
  line-height: 1.625;
}

.h5-profile-mail {
  margin-top: 12px;
  min-height: 33px;
  border: 0;
  border-radius: 8px;
  background: #eff6ff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #3972f5;
  font-size: 13px;
  font-weight: 700;
}

.h5-profile-mail img {
  width: 16px;
  height: 16px;
}

.h5-profile-logout {
  width: calc(100% - 32px);
  margin: 16px 16px 0;
  min-height: 48px;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  background: #fff;
  color: #fb2c36;
  font-size: 15px;
  font-weight: 700;
}

.h5-profile-tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(100%, 393px);
  height: calc(56px + env(safe-area-inset-bottom));
  padding: 1px 24px env(safe-area-inset-bottom);
  border-top: 1px solid #f3f4f6;
  background: #fff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h5-profile-tabbar__item {
  width: 64px;
  height: 48px;
  border: 0;
  background: transparent;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #99a1af;
  font-size: 10px;
  line-height: 1.5;
  font-weight: 500;
}

.h5-profile-tabbar__item img {
  width: 24px;
  height: 24px;
}

.h5-profile-tabbar__item--active {
  color: #3972f5;
}
</style>
