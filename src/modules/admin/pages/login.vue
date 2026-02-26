<template>
  <div class="auth-page">
    <div class="auth-page-left">
      <div class="auth-brand">
        <img class="auth-brand__logo" :src="assetLogo" alt="HourX Logo" />
        <span class="auth-brand__name">{{ t('admin.login.leftBrand') }}</span>
      </div>

      <div class="auth-page-left-content">
        <h1 class="auth-page-left-headline">
          {{ t('admin.login.leftHeroLine1') }}<br />
          {{ t('admin.login.leftHeroLine2') }}
        </h1>
        <p class="auth-page-left-slogan">{{ t('admin.login.leftSlogan') }}</p>

        <div class="auth-feature-card">
          <article
            v-for="item in leftFeatures"
            :key="item.key"
            class="auth-feature-card__item"
          >
            <img :src="item.icon" alt="" />
            <strong>{{ t(item.titleKey) }}</strong>
            <span>{{ t(item.descKey) }}</span>
          </article>
        </div>
      </div>
    </div>

    <div class="auth-page-right">
      <el-select
        v-model="currentLocale"
        size="small"
        class="locale-switcher"
        @change="handleLocaleChange"
      >
        <el-option value="zh" :label="$t('admin.common.langZh')" />
        <el-option value="en" :label="$t('admin.common.langEn')" />
      </el-select>

      <div class="auth-page-right-title">
        {{ $t('message.account_login_c') }}
      </div>

      <div class="auth-page-right-form">
        <LoginByPassword @login="debouncedLoginByPassword" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import LoginByPassword from '@/components/LoginByPassword/index.vue';
import { login } from '@/modules/admin/api';
import { ElMessage } from 'element-plus';
import router from '@/modules/admin/router';
import axios from 'axios';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ADMIN_LOCALE_STORAGE_KEY, type AdminLocale } from '@/modules/admin/locales';
import {
  loadAdminMenuPermissions,
  resetAdminMenuPermissions,
} from '@/modules/admin/utils/menuPermission';

const { t, locale } = useI18n({ useScope: 'global' });
const currentLocale = ref<AdminLocale>(locale.value === 'en' ? 'en' : 'zh');
const assetLogo = new URL('@/assets/images/client/logo.png', import.meta.url).href;
const assetFeature1 = 'https://www.figma.com/api/mcp/asset/ef75fc3a-3d62-4db2-a1cd-9ee8a181b227';
const assetFeature2 = 'https://www.figma.com/api/mcp/asset/40985476-5fe7-4bab-bcc7-d4faef415060';
const assetFeature3 = 'https://www.figma.com/api/mcp/asset/743d31dc-3585-491d-ab1e-1e9ef5756564';

const leftFeatures = [
  {
    key: 'secure',
    icon: assetFeature1,
    titleKey: 'admin.login.leftFeatureSecureTitle',
    descKey: 'admin.login.leftFeatureSecureDesc',
  },
  {
    key: 'efficient',
    icon: assetFeature2,
    titleKey: 'admin.login.leftFeatureEfficientTitle',
    descKey: 'admin.login.leftFeatureEfficientDesc',
  },
  {
    key: 'reliable',
    icon: assetFeature3,
    titleKey: 'admin.login.leftFeatureReliableTitle',
    descKey: 'admin.login.leftFeatureReliableDesc',
  },
];

const debounceLeading = <T extends (...args: any[]) => unknown>(
  fn: T,
  delay = 500
) => {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) return;
    fn(...args);
    timer = window.setTimeout(() => {
      timer = null;
    }, delay);
  };
};
const debouncedLoginByPassword = debounceLeading((...args) => {
  loginByPassword(...args);
}, 800);

const loginByPassword = async ({
  account,
  password,
}: {
  account: string;
  password: string;
}) => {
  if (!account) return ElMessage.warning(t('admin.login.accountRequired'));
  if (!password) return ElMessage.warning(t('admin.login.passwordRequired'));

  try {
    const result = await login({ account, password, rememberMe: true });
    const data = result?.data;
    if (!data?.token) throw new Error(t('admin.login.loginFailed'));

    const {
      token,
      tokenType = 'Bearer',
      expiresIn,
      userId,
      username,
      userType,
    } = data;

    localStorage.setItem('token', token);
    if (userId !== undefined) localStorage.setItem('userId', String(userId));
    if (username) localStorage.setItem('username', username);
    if (userType) localStorage.setItem('userType', userType);

    if (expiresIn) {
      const expiresAt = Date.now() + Number(expiresIn);
      localStorage.setItem('expiresAt', String(expiresAt));
    }

    axios.defaults.headers.common.Authorization = `${tokenType} ${token}`;
    resetAdminMenuPermissions();
    await loadAdminMenuPermissions(true);
    ElMessage.success(result?.message || t('admin.login.loginSuccess'));
    router.push('/admin');
  } catch (e) {
    console.error(e);
    ElMessage.error(t('admin.login.loginFailed'));
  }
};

const handleLocaleChange = (lang: AdminLocale) => {
  locale.value = lang;
  currentLocale.value = lang;
  localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
};
</script>
<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

.auth-page-left {
  width: min(367px, 34vw);
  min-width: 300px;
  padding: 48px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #6faad0 0%, #3972f5 58%, #6597f0 100%);
}

.auth-page-left::before,
.auth-page-left::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(186, 247, 233, 0.65);
  filter: blur(100px);
  z-index: 0;
}

.auth-page-left::before {
  left: 90px;
  top: -228px;
}

.auth-page-left::after {
  left: -280px;
  bottom: -228px;
}

.auth-brand,
.auth-page-left-content {
  position: relative;
  z-index: 1;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.auth-brand__logo {
  width: 50px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
}

.auth-brand__name {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #fff;
}

.auth-page-left-content {
  margin-top: 220px;
}

.auth-page-left-headline {
  margin: 0;
  font-size: 46px;
  line-height: 1.25;
  font-weight: 800;
  color: #fff;
}

.auth-page-left-slogan {
  margin: 64px 0 0;
  font-size: 26px;
  line-height: 1.4;
  font-weight: 700;
  color: #fff;
}

.auth-feature-card {
  margin-top: 64px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.auth-feature-card__item {
  min-height: 122px;
  padding: 18px 10px 14px;
  text-align: center;
  color: #fff;
}

.auth-feature-card__item + .auth-feature-card__item {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-feature-card__item img {
  width: 26px;
  height: 26px;
}

.auth-feature-card__item strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  line-height: 1.25;
}

.auth-feature-card__item span {
  display: block;
  margin-top: 4px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
}

.auth-page-right {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 48px;
  box-sizing: border-box;
  background: #fff;
}

.locale-switcher {
  position: absolute;
  top: 20px;
  right: 24px;
  width: 120px;
}

.auth-page-right-title {
  margin: 0 0 40px;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
  text-align: center;
}

.auth-page-right-form {
  width: min(552px, 100%);
  position: relative;
}

.auth-page-right-form :deep(.btn) {
  width: 100%;
  height: 56px;
  background: #796f51;
  border-radius: 6px;
  font-size: 18px;
  color: #fff;
  text-align: center;
  line-height: 56px;
  cursor: pointer;
}

.auth-page-right-form :deep(.register) {
  color: rgba(0, 0, 0, 0.5);
  font-size: 18px;
  text-align: right;
  width: 100%;
  cursor: pointer;
  margin-top: 15px;
}

.auth-page-right-form :deep(.register-text) {
  color: #000;
}

.auth-page-right-form :deep(.forgot-password) {
  min-width: 90px;
  height: 25px;
  font-size: 18px;
  color: #796f51;
  text-align: right;
  position: absolute;
  top: 110px;
  right: 5px;
  cursor: pointer;
}

:deep(.el-form-item__label) {
  font-size: 18px;
  color: #000;
  font-weight: 500;
}

:deep(.el-input) {
  height: 56px;
}

:deep(.el-input__inner) {
  height: 50px;
  line-height: 50px;
  font-size: 20px;
}

@media (max-width: 1320px) {
  .auth-brand__name {
    font-size: 34px;
  }

  .auth-page-left-headline {
    font-size: 40px;
  }

  .auth-page-left-slogan {
    font-size: 22px;
  }

  .auth-feature-card__item strong {
    font-size: 24px;
  }

  .auth-feature-card__item span {
    font-size: 15px;
  }
}

@media (max-width: 1024px) {
  .auth-page {
    flex-direction: column;
  }

  .auth-page-left {
    width: 100%;
    min-width: 0;
    padding: 24px 20px 32px;
  }

  .auth-brand__name {
    font-size: 28px;
  }

  .auth-page-left-content {
    margin-top: 56px;
  }

  .auth-page-left-headline {
    font-size: 32px;
  }

  .auth-page-left-slogan {
    margin-top: 24px;
    font-size: 20px;
  }

  .auth-feature-card {
    margin-top: 24px;
  }

  .auth-page-right {
    width: 100%;
    padding: 82px 16px 24px;
    align-items: flex-start;
  }

  .locale-switcher {
    top: 18px;
    right: 16px;
  }

  .auth-page-right-title {
    margin-bottom: 24px;
    font-size: 28px;
  }
}

@media (max-width: 520px) {
  .auth-feature-card__item strong {
    font-size: 18px;
  }

  .auth-feature-card__item span {
    font-size: 12px;
  }

  .auth-page-right-title {
    font-size: 24px;
  }

  :deep(.el-form-item__label) {
    font-size: 16px;
  }

  :deep(.el-input__inner) {
    font-size: 16px;
  }
}
</style>
