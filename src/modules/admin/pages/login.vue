<template>
  <div class="admin-auth" :class="{ 'is-english': currentLocale === 'en' }">
    <aside class="admin-auth__visual">
      <div class="visual-grid" aria-hidden="true" />

      <div class="brand-lockup">
        <span class="brand-lockup__mark">
          <img :src="assetLogo" alt="HourX" />
        </span>
        <span>{{ t('admin.login.leftBrand') }}</span>
      </div>

      <div class="visual-content">
        <span class="visual-eyebrow">
          <i aria-hidden="true" />
          {{ t('admin.login.consoleEyebrow') }}
        </span>
        <h1>
          {{ t('admin.login.leftHeroLine1') }}<br />
          <span>{{ t('admin.login.leftHeroLine2') }}</span>
        </h1>
        <p>{{ t('admin.login.leftSlogan') }}</p>

        <div class="feature-panel">
          <article v-for="item in leftFeatures" :key="item.key" class="feature-panel__item">
            <span class="feature-panel__icon">
              <img :src="item.icon" alt="" />
            </span>
            <span class="feature-panel__copy">
              <strong>{{ t(item.titleKey) }}</strong>
              <small>{{ t(item.descKey) }}</small>
            </span>
          </article>
        </div>
      </div>

      <div class="visual-footnote">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span>{{ t('admin.login.authorizedOnly') }}</span>
      </div>
    </aside>

    <div class="admin-auth__locale">
      <el-dropdown trigger="click" @command="handleLocaleChange">
        <button class="locale-pill" type="button">
          <img :src="assetLocale" alt="" />
          <span>{{ localeLabel }}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m6 8 4 4 4-4" />
          </svg>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh">{{ t('admin.common.langZh') }}</el-dropdown-item>
            <el-dropdown-item command="en">{{ t('admin.common.langEn') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <main class="admin-auth__main">
      <div class="admin-auth__halo" aria-hidden="true" />

      <section class="login-card">
        <header class="login-card__header">
          <span class="login-card__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 20 6.5V12c0 4.7-3.4 7.8-8 9-4.6-1.2-8-4.3-8-9V6.5L12 3Z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
          </span>
          <div>
            <h2>{{ t('admin.login.title') }}</h2>
            <p>{{ t('admin.login.subtitle') }}</p>
          </div>
        </header>

        <form class="login-form" @submit.prevent="submitLogin">
          <label class="form-field">
            <span class="form-field__label">{{ t('admin.login.accountLabel') }}</span>
            <span class="form-field__control">
              <img :src="assetAccount" alt="" />
              <input
                v-model.trim="form.account"
                type="text"
                autocomplete="username"
                :placeholder="t('admin.login.accountPlaceholder')"
              />
            </span>
          </label>

          <label class="form-field">
            <span class="form-field__label">{{ t('admin.login.passwordLabel') }}</span>
            <span class="form-field__control">
              <svg class="form-field__leading" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                :placeholder="t('admin.login.passwordPlaceholder')"
              />
              <button
                class="password-toggle"
                type="button"
                :aria-label="showPassword ? t('admin.login.hidePassword') : t('admin.login.showPassword')"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3 21 21M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A11 11 0 0 1 12 4c5 0 9 4 10 8a11.8 11.8 0 0 1-3.2 4.2M6.6 6.6C4.6 8.1 3.3 9.9 2 12c1 4 5 8 10 8 1.9 0 3.6-.6 5-1.6" />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12c1-4 5-8 10-8s9 4 10 8c-1 4-5 8-10 8S3 16 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </span>
          </label>

          <div class="form-meta">
            <span class="secure-session">
              <i aria-hidden="true" />
              {{ t('admin.login.secureSession') }}
            </span>
            <button type="button" class="text-button" @click="handleForgotPassword">
              {{ t('admin.login.forgotPassword') }}
            </button>
          </div>

          <button class="submit-button" type="submit" :disabled="submitting">
            <span v-if="submitting" class="submit-button__spinner" aria-hidden="true" />
            <span>{{ submitting ? t('admin.login.signingIn') : t('admin.login.submit') }}</span>
            <svg v-if="!submitting" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </button>
        </form>

        <footer class="login-card__footer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 20 6.5V12c0 4.7-3.4 7.8-8 9-4.6-1.2-8-4.3-8-9V6.5L12 3Z" />
          </svg>
          <span>{{ t('admin.login.securityNotice') }}</span>
        </footer>
      </section>

      <p class="page-signature">© {{ currentYear }} HourX · Operations Console</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { isNavigationFailure, useRoute } from 'vue-router';
import { login } from '@/modules/admin/api';
import router from '@/modules/admin/router';
import { ADMIN_LOCALE_STORAGE_KEY, type AdminLocale } from '@/modules/admin/locales';
import {
  clearAdminAuthState,
  setAdminAuthStorageValue,
} from '@/utils/auth-state';
import {
  getFirstAllowedAdminPath,
  loadAdminMenuPermissions,
  resetAdminMenuPermissions,
} from '@/modules/admin/utils/menuPermission';

const { t, locale } = useI18n({ useScope: 'global' });
const route = useRoute();
const currentLocale = ref<AdminLocale>(locale.value === 'en' ? 'en' : 'zh');
const showPassword = ref(false);
const submitting = ref(false);
const currentYear = new Date().getFullYear();

const form = reactive({
  account: '',
  password: '',
});

const assetLogo = '/assets/images/client/hourx-mark.svg';
const assetLocale = new URL('@/assets/images/client/Icon (8).png', import.meta.url).href;
const assetAccount = new URL('@/assets/images/client/Icon (3).png', import.meta.url).href;
const assetFeature1 = new URL('@/assets/images/client/icon.png', import.meta.url).href;
const assetFeature2 = new URL('@/assets/images/client/Icon (1).png', import.meta.url).href;
const assetFeature3 = new URL('@/assets/images/client/Icon (2).png', import.meta.url).href;

const localeLabel = computed(() => (
  currentLocale.value === 'zh'
    ? t('admin.common.langZh')
    : t('admin.common.langEn')
));

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

const submitLogin = async () => {
  if (submitting.value) return;
  if (!form.account) return ElMessage.warning(t('admin.login.accountRequired'));
  if (!form.password) return ElMessage.warning(t('admin.login.passwordRequired'));

  submitting.value = true;
  try {
    const result = await login({
      account: form.account,
      password: form.password,
      rememberMe: true,
    });
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

    clearAdminAuthState();
    setAdminAuthStorageValue('token', token);
    setAdminAuthStorageValue('tokenType', tokenType);
    if (userId !== undefined) setAdminAuthStorageValue('userId', userId);
    if (username) setAdminAuthStorageValue('username', username);
    if (userType) setAdminAuthStorageValue('userType', userType);

    if (expiresIn) {
      setAdminAuthStorageValue('expiresAt', Date.now() + Number(expiresIn));
    }

    resetAdminMenuPermissions();
    await loadAdminMenuPermissions(true);
    ElMessage.success(result?.message || t('admin.login.loginSuccess'));
    const redirectQuery = Array.isArray(route.query.redirect)
      ? route.query.redirect[0]
      : route.query.redirect;
    const redirectPath =
      typeof redirectQuery === 'string' &&
      redirectQuery.startsWith('/admin') &&
      !redirectQuery.startsWith('/admin/login')
        ? redirectQuery
        : getFirstAllowedAdminPath();
    try {
      await router.replace(redirectPath || '/admin');
    } catch (error) {
      if (!isNavigationFailure(error)) throw error;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error(t('admin.login.loginFailed'));
  } finally {
    submitting.value = false;
  }
};

const handleForgotPassword = () => {
  ElMessage.info(t('admin.login.resetHint'));
};

const handleLocaleChange = (lang: AdminLocale) => {
  locale.value = lang;
  currentLocale.value = lang;
  localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
};
</script>

<style scoped lang="scss">
.admin-auth {
  --auth-ink: #071a32;
  --auth-muted: #65758b;
  --auth-line: #dce4ed;
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(500px, 46%) minmax(540px, 54%);
  background: #f7f9fc;
  color: var(--auth-ink);
  font-family: Inter, Manrope, "SF Pro Display", "Segoe UI", Arial, sans-serif;
}

.admin-auth__visual {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: clamp(36px, 4.2vw, 66px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  isolation: isolate;
  color: #fff;
  background:
    radial-gradient(circle at 91% 5%, rgba(121, 233, 211, 0.29), transparent 31%),
    radial-gradient(circle at 2% 96%, rgba(35, 140, 183, 0.23), transparent 34%),
    linear-gradient(145deg, #0b2b4d 0%, #061c36 43%, #041326 100%);
}

.admin-auth__visual::before,
.admin-auth__visual::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 999px;
  pointer-events: none;
}

.admin-auth__visual::before {
  width: 340px;
  height: 340px;
  top: -190px;
  right: -110px;
  border: 1px solid rgba(190, 250, 237, 0.28);
  box-shadow: 0 0 0 54px rgba(190, 250, 237, 0.035), 0 0 0 108px rgba(190, 250, 237, 0.025);
}

.admin-auth__visual::after {
  width: 250px;
  height: 250px;
  left: -150px;
  bottom: -120px;
  background: rgba(127, 231, 211, 0.15);
  filter: blur(6px);
}

.visual-grid {
  position: absolute;
  inset: 0;
  z-index: -2;
  opacity: 0.26;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 48px 48px;
  -webkit-mask-image: linear-gradient(to bottom, #000, transparent 78%);
  mask-image: linear-gradient(to bottom, #000, transparent 78%);
}

.visual-grid::after {
  content: '';
  position: absolute;
  left: -6%;
  right: -6%;
  bottom: -78px;
  height: 270px;
  opacity: 0.42;
  background-image: radial-gradient(circle, rgba(85, 232, 216, 0.65) 1px, transparent 1.35px);
  background-size: 13px 13px;
  transform: skewY(-5deg);
  -webkit-mask-image: linear-gradient(to bottom, transparent 5%, #000 52%, transparent 96%);
  mask-image: linear-gradient(to bottom, transparent 5%, #000 52%, transparent 96%);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 21px;
  line-height: 1;
  font-weight: 760;
  letter-spacing: -0.02em;
}

.brand-lockup__mark {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.brand-lockup__mark img {
  width: 33px;
  height: 33px;
  object-fit: contain;
}

.visual-content {
  width: min(100%, 590px);
  margin: auto 0;
  padding: clamp(72px, 9vh, 108px) 0 54px;
}

.visual-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #baf7e9;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.visual-eyebrow i {
  width: 30px;
  height: 2px;
  border-radius: 2px;
  background: #75dec9;
}

.visual-content h1 {
  margin: 26px 0 0;
  max-width: 590px;
  font-size: clamp(42px, 3.55vw, 56px);
  line-height: 1.1;
  font-weight: 780;
  letter-spacing: -0.045em;
}

.visual-content h1 span {
  color: #baf7e9;
}

.admin-auth.is-english .visual-content h1 {
  font-size: clamp(40px, 3.25vw, 52px);
}

.admin-auth.is-english .visual-content h1 span {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.82em;
  letter-spacing: -0.04em;
  white-space: nowrap;
}

.visual-content > p {
  margin: 25px 0 0;
  color: rgba(235, 246, 255, 0.68);
  font-size: 15px;
  line-height: 1.7;
  letter-spacing: 0.025em;
}

.feature-panel {
  margin-top: 54px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(18px, 3vw, 46px);
}

.feature-panel__item {
  min-width: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.feature-panel__icon {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(138, 231, 216, 0.2);
  border-radius: 12px;
  background: rgba(186, 247, 233, 0.065);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.feature-panel__icon img {
  width: 23px;
  height: 23px;
  object-fit: contain;
}

.feature-panel__copy {
  min-width: 0;
}

.feature-panel strong,
.feature-panel small {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feature-panel strong {
  font-size: 14px;
  line-height: 1.4;
  font-weight: 730;
}

.feature-panel small {
  margin-top: 4px;
  color: rgba(235, 246, 255, 0.56);
  font-size: 12px;
  line-height: 1.35;
}

.visual-footnote {
  display: flex;
  align-items: center;
  gap: 9px;
  color: rgba(235, 246, 255, 0.45);
  font-size: 11.5px;
  line-height: 1.5;
}

.visual-footnote svg {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.admin-auth__main {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  min-height: 100vh;
  padding: 94px 58px 40px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(rgba(247, 249, 252, 0.91), rgba(247, 249, 252, 0.91)),
    radial-gradient(circle at center, #fff 0%, #edf3f9 100%);
}

.admin-auth__halo {
  position: absolute;
  width: 720px;
  height: 720px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -48%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(174, 239, 226, 0.18) 0%, rgba(220, 240, 247, 0.085) 48%, transparent 70%);
  pointer-events: none;
}

.admin-auth__locale {
  position: absolute;
  z-index: 3;
  top: 28px;
  right: 34px;
}

.locale-pill {
  height: 42px;
  min-width: 112px;
  padding: 0 15px;
  border: 1px solid #dce5ed;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.86);
  color: #526277;
  font-size: 13.5px;
  font-weight: 650;
  cursor: pointer;
  box-shadow: 0 5px 18px rgba(17, 42, 70, 0.05);
  backdrop-filter: blur(14px);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.locale-pill:hover {
  border-color: #bdcad8;
  box-shadow: 0 8px 24px rgba(17, 42, 70, 0.09);
  transform: translateY(-1px);
}

.locale-pill img {
  width: 16px;
  height: 16px;
}

.locale-pill svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-card {
  position: relative;
  z-index: 1;
  width: min(100%, 540px);
  box-sizing: border-box;
  padding: 34px 40px 28px;
  border: 1px solid rgba(218, 227, 237, 0.92);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 30px 76px rgba(25, 51, 79, 0.085),
    0 3px 10px rgba(25, 51, 79, 0.04),
    inset 0 1px 0 #fff;
  backdrop-filter: blur(24px);
}

.login-card__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.login-card__badge {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #0d5d58;
  background: linear-gradient(145deg, #ddf8f2 0%, #bcecdf 100%);
  box-shadow: 0 8px 20px rgba(47, 154, 139, 0.15);
}

.login-card__badge svg {
  width: 28px;
  height: 28px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-card__header h2 {
  margin: 17px 0 0;
  color: var(--auth-ink);
  font-size: 30px;
  line-height: 1.22;
  font-weight: 780;
  letter-spacing: -0.025em;
}

.login-card__header p {
  max-width: 430px;
  margin: 9px auto 0;
  color: var(--auth-muted);
  font-size: 13.5px;
  line-height: 1.58;
}

.login-form {
  margin-top: 28px;
}

.form-field {
  display: block;
}

.form-field + .form-field {
  margin-top: 18px;
}

.form-field__label {
  display: block;
  margin-bottom: 7px;
  color: #26384d;
  font-size: 13.5px;
  line-height: 1.4;
  font-weight: 700;
}

.form-field__control {
  width: 100%;
  height: 54px;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1px solid #cfd9e4;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 11px;
  background: #f9fbfd;
  box-shadow: inset 0 1px 2px rgba(23, 47, 73, 0.02);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.form-field__control:focus-within {
  border-color: #3d8a85;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(71, 158, 150, 0.11);
}

.form-field__control > img,
.form-field__leading {
  width: 19px;
  height: 19px;
  flex: 0 0 19px;
  object-fit: contain;
}

.form-field__leading {
  fill: none;
  stroke: #91a6bf;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.form-field__control input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #13263d;
  font: inherit;
  font-size: 14.5px;
}

.form-field__control input::placeholder {
  color: #93a3b6;
}

.password-toggle {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border: 0;
  border-radius: 7px;
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
  color: #7c8da2;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.password-toggle:hover {
  color: var(--auth-ink);
  background: #edf2f7;
}

.password-toggle svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.form-meta {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.secure-session {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #287b6e;
  font-size: 12.5px;
  font-weight: 600;
}

.secure-session i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #31ae8d;
  box-shadow: 0 0 0 4px rgba(49, 174, 141, 0.1);
}

.text-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #123f61;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

.text-button:hover {
  text-decoration: underline;
}

.submit-button {
  width: 100%;
  height: 56px;
  margin-top: 27px;
  border: 0;
  border-radius: 10px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 11px;
  overflow: hidden;
  position: relative;
  color: #fff;
  background: linear-gradient(135deg, #0b2d4f 0%, #06182d 100%);
  box-shadow: 0 13px 26px rgba(6, 29, 53, 0.2);
  font-size: 16px;
  font-weight: 720;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.submit-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 20%, rgba(186, 247, 233, 0.16) 55%, transparent 85%);
  transform: translateX(-100%);
  transition: transform 0.55s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow: 0 17px 31px rgba(6, 29, 53, 0.24);
}

.submit-button:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.submit-button span,
.submit-button svg {
  position: relative;
  z-index: 1;
}

.submit-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.submit-button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.login-card__footer {
  margin-top: 26px;
  padding-top: 19px;
  border-top: 1px solid #e8edf2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #8a98aa;
  text-align: center;
  font-size: 11.5px;
  line-height: 1.5;
}

.login-card__footer svg {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  fill: none;
  stroke: #5d9d91;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.page-signature {
  position: relative;
  z-index: 1;
  margin: 22px 0 0;
  color: #99a6b5;
  font-size: 10px;
  line-height: 1.5;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1120px) {
  .admin-auth {
    grid-template-columns: minmax(430px, 44%) minmax(500px, 56%);
  }

  .admin-auth__visual {
    padding: 36px;
  }

  .feature-panel__item {
    gap: 7px;
  }

  .feature-panel__icon {
    width: 30px;
    height: 30px;
    flex-basis: 30px;
  }

  .feature-panel small {
    display: none;
  }

  .admin-auth__main {
    padding-inline: 38px;
  }
}

@media (max-width: 860px) {
  .admin-auth {
    display: block;
    min-height: 100vh;
    background: #f7f9fc;
  }

  .admin-auth__visual {
    min-height: 228px;
    padding: 24px 28px 36px;
  }

  .brand-lockup {
    font-size: 17px;
  }

  .brand-lockup__mark {
    width: 39px;
    height: 39px;
    border-radius: 10px;
  }

  .brand-lockup__mark img {
    width: 27px;
    height: 27px;
  }

  .visual-content {
    margin: 34px 0 0;
    padding: 0;
  }

  .visual-eyebrow,
  .visual-content > p,
  .feature-panel,
  .visual-footnote {
    display: none;
  }

  .visual-content h1 {
    margin-top: 0;
    font-size: 31px;
    line-height: 1.18;
  }

  .admin-auth.is-english .visual-content h1 span {
    font-size: clamp(17px, 4.35vw, 20px);
    letter-spacing: -0.025em;
    white-space: nowrap;
  }

  .admin-auth__main {
    min-height: auto;
    margin-top: -42px;
    padding: 0 20px 30px;
    overflow: visible;
    background: transparent;
  }

  .admin-auth__halo {
    display: none;
  }

  .admin-auth__locale {
    top: 25px;
    right: 26px;
  }

  .locale-pill {
    height: 36px;
    min-width: 92px;
    border-color: rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    box-shadow: none;
  }

  .login-card {
    width: min(100%, 540px);
  }
}

@media (max-width: 520px) {
  .admin-auth__visual {
    min-height: 218px;
    padding-inline: 20px;
  }

  .brand-lockup span:last-child {
    font-size: 15px;
  }

  .visual-content {
    margin-top: 27px;
  }

  .visual-content h1 {
    font-size: 25px;
  }

  .admin-auth__locale {
    top: 26px;
    right: 20px;
  }

  .admin-auth__main {
    margin-top: -35px;
    padding-inline: 12px;
  }

  .login-card {
    padding: 28px 21px 24px;
    border-radius: 20px;
  }

  .login-card__badge {
    width: 42px;
    height: 42px;
    border-radius: 13px;
  }

  .login-card__header h2 {
    font-size: 23px;
  }

  .login-form {
    margin-top: 26px;
  }

  .form-field__control {
    height: 50px;
  }

  .form-meta {
    align-items: flex-start;
  }

  .page-signature {
    margin-top: 18px;
  }
}
</style>
