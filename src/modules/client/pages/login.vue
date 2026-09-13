<template>
  <div class="auth-page">
    <aside class="auth-page__left">
      <div class="auth-brand">
        <img class="auth-brand__logo" :src="assetLogo" alt="HourX Logo" />
        <span class="auth-brand__name">{{ t('client.login.register.brand') }}</span>
      </div>

      <div class="auth-page__left-content">
        <h1 class="auth-page__headline">
          {{ t('client.login.register.heroLine1') }}<br />
          {{ t('client.login.register.heroLine2') }}
        </h1>
        <p class="auth-page__slogan">{{ t('client.login.register.heroSlogan') }}</p>

        <div class="auth-feature-card">
          <article v-for="item in leftFeatures" :key="item.key" class="auth-feature-card__item">
            <img :src="item.icon" alt="" />
            <strong>{{ t(item.titleKey) }}</strong>
            <span>{{ t(item.descKey) }}</span>
          </article>
        </div>
      </div>
    </aside>

    <section class="auth-page__right">
      <div class="auth-page__tools">
        <button class="top-pill top-pill--back" type="button" @click="goHome">
          {{ t('client.login.register.backHome') }}
        </button>

        <el-dropdown trigger="click" @command="handleLocaleCommand">
          <button class="top-pill top-pill--locale" type="button">
            <img :src="assetLocale" alt="" />
            <span>{{ localeLabel }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="en">{{ t('client.header.languageEn') }}</el-dropdown-item>
              <el-dropdown-item command="zh">{{ t('client.header.languageZh') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="auth-form-wrap">
        <header class="auth-form-wrap__header">
          <h2>
            {{
              isCodeLogin
                ? t('client.login.password.codeTitle')
                : t('client.login.password.title')
            }}
          </h2>
          <p>
            {{ t('client.login.password.noAccount') }}
            <button type="button" class="link-btn" @click="goRegister">
              {{ t('client.login.password.goRegister') }}
            </button>
          </p>
        </header>

        <form class="auth-form" @submit.prevent="submitLogin">
          <label class="form-item">
            <span>
              {{
                isCodeLogin
                  ? t('client.login.password.phoneEmailLabel')
                  : t('client.login.password.accountLabel')
              }}
            </span>
            <div class="form-item__control">
              <img :src="assetAccount" alt="" />
              <input
                v-model.trim="form.account"
                type="text"
                autocomplete="username"
                :placeholder="
                  isCodeLogin
                    ? t('client.login.password.phoneEmailPlaceholder')
                    : t('client.login.password.accountPlaceholder')
                "
              />
            </div>
          </label>

          <label v-if="!isCodeLogin" class="form-item form-item--password">
            <span>{{ t('client.login.password.passwordLabel') }}</span>
            <div class="form-item__control">
              <svg class="form-item__leading-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                v-model="form.password"
                :type="passwordInputType"
                autocomplete="current-password"
                :placeholder="t('client.login.password.passwordPlaceholder')"
              />
              <button
                class="password-toggle"
                type="button"
                :aria-label="
                  showPassword
                    ? t('client.login.password.hidePassword')
                    : t('client.login.password.showPassword')
                "
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M3 3L21 21M10.58 10.59A2 2 0 0 0 13.41 13.42M9.88 4.24A10.94 10.94 0 0 1 12 4C17 4 21 8 22 12A11.77 11.77 0 0 1 18.76 16.24M6.61 6.61C4.62 8.05 3.29 9.87 2 12C3 16 7 20 12 20C13.85 20 15.55 19.42 17.01 18.42"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M2 12C3 8 7 4 12 4S21 8 22 12C21 16 17 20 12 20S3 16 2 12Z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <span class="form-item__forgot">
              <button type="button" @click="toggleLoginMode">
                {{ t('client.login.password.forgotPassword') }}
              </button>
            </span>
          </label>

          <label v-else class="form-item">
            <span>{{ t('client.login.password.codeLabel') }}</span>
            <div class="code-row">
              <div class="form-item__control form-item__control--code">
                <img :src="assetCode" alt="" />
                <input
                  v-model.trim="form.code"
                  type="text"
                  inputmode="numeric"
                  maxlength="8"
                  :placeholder="t('client.login.password.codeInputPlaceholder')"
                />
              </div>
              <button
                class="code-btn"
                type="button"
                :disabled="sendingCode || codeCooldown > 0"
                @click="requestLoginCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
          </label>

          <button class="submit-btn" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.password.submitting') : t('client.login.password.submit') }}
          </button>

          <div class="login-divider" aria-hidden="true">
            <span>{{ t('client.login.password.separator') }}</span>
          </div>

          <button class="secondary-login-btn" type="button" @click="toggleLoginMode">
            {{
              isCodeLogin
                ? t('client.login.password.usePasswordLogin')
                : t('client.login.password.useCodeLogin')
            }}
          </button>
        </form>

        <p class="agreement">
          {{ t('client.login.password.agreementPrefix') }}
          <RouterLink :to="{ name: 'legal-terms' }">
            {{ t('client.login.password.terms') }}
          </RouterLink>
          {{ t('client.login.password.agreementAnd') }}
          <RouterLink :to="{ name: 'legal-privacy' }">
            {{ t('client.login.password.privacy') }}
          </RouterLink>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  login as loginByPassword,
  loginByVerifyCode,
  sendCode,
} from '@/modules/client/api/login';
import { setClientLocale, type ClientLocale } from '@/modules/client/locales';
import {
  clearStoredAuthState,
  setClientAuthStorageValue,
} from '@/utils/auth-state';

const assetLogo = '/assets/images/client/hourx-mark.svg';
const assetFeature1 = new URL('@/assets/images/client/icon.png', import.meta.url).href;
const assetFeature2 = new URL('@/assets/images/client/Icon (1).png', import.meta.url).href;
const assetFeature3 = new URL('@/assets/images/client/Icon (2).png', import.meta.url).href;
const assetAccount = new URL('@/assets/images/client/Icon (3).png', import.meta.url).href;
const assetCode = new URL('@/assets/images/client/Icon (5).png', import.meta.url).href;
const assetLocale = new URL('@/assets/images/client/Icon (8).png', import.meta.url).href;

const { t, locale } = useI18n({ useScope: 'global' });
const route = useRoute();
const router = useRouter();

type LoginMode = 'password' | 'code';

const form = reactive({
  account: '',
  password: '',
  code: '',
});
const loginMode = ref<LoginMode>('password');
const sendingCode = ref(false);
const codeCooldown = ref(0);
const submitting = ref(false);
const showPassword = ref(false);
let codeTimer: number | null = null;

const localeLabel = computed(() =>
  locale.value === 'zh' ? t('client.header.languageZh') : t('client.header.languageEn'),
);
const isCodeLogin = computed(() => loginMode.value === 'code');
const passwordInputType = computed(() => (showPassword.value ? 'text' : 'password'));
const codeBtnText = computed(() => {
  if (codeCooldown.value > 0) {
    return t('client.login.password.resendIn', { seconds: codeCooldown.value });
  }
  if (sendingCode.value) {
    return t('client.login.password.sendingCode');
  }
  return t('client.login.password.getCode');
});

const leftFeatures = [
  {
    key: 'professional',
    icon: assetFeature1,
    titleKey: 'client.login.register.featureProfessionalTitle',
    descKey: 'client.login.register.featureProfessionalDesc',
  },
  {
    key: 'quick',
    icon: assetFeature2,
    titleKey: 'client.login.register.featureQuickTitle',
    descKey: 'client.login.register.featureQuickDesc',
  },
  {
    key: 'reliable',
    icon: assetFeature3,
    titleKey: 'client.login.register.featureReliableTitle',
    descKey: 'client.login.register.featureReliableDesc',
  },
];

const handleLocaleCommand = (value: string | number | object) => {
  const target = value === 'zh' ? 'zh' : 'en';
  locale.value = setClientLocale(target) as ClientLocale;
};

const goHome = () => {
  router.push('/');
};

const goRegister = () => {
  router.push('/register');
};

const toggleLoginMode = () => {
  const nextMode: LoginMode = isCodeLogin.value ? 'password' : 'code';
  loginMode.value = nextMode;
  if (nextMode === 'code') {
    form.password = '';
    showPassword.value = false;
    return;
  }
  form.code = '';
};

const saveClientToken = (raw: any, account?: string) => {
  const payload = raw?.data ?? raw ?? {};
  const token = payload?.token || payload?.accessToken;
  if (!token) {
    return false;
  }
  clearStoredAuthState();
  setClientAuthStorageValue('token', token);
  if (payload?.tokenType) {
    setClientAuthStorageValue('tokenType', payload.tokenType);
  }
  if (payload?.expiresIn !== undefined && payload?.expiresIn !== null) {
    const expiresAt = Date.now() + Number(payload.expiresIn);
    setClientAuthStorageValue('expiresAt', expiresAt);
  }
  if (payload?.userId !== undefined && payload?.userId !== null) {
    setClientAuthStorageValue('userId', payload.userId);
  }
  if (payload?.username) {
    setClientAuthStorageValue('username', payload.username);
  }
  if (payload?.userType) {
    setClientAuthStorageValue('userType', payload.userType);
  }
  const resolvedAccount = account?.trim() || payload?.username || '';
  if (resolvedAccount) {
    setClientAuthStorageValue('account', resolvedAccount);
  }
  return true;
};

const validatePasswordLogin = () => {
  if (!form.account.trim()) {
    ElMessage.warning(t('client.login.password.accountRequired'));
    return false;
  }
  if (!form.password.trim()) {
    ElMessage.warning(t('client.login.password.passwordRequired'));
    return false;
  }
  return true;
};

const validateCodeLogin = () => {
  if (!form.account.trim()) {
    ElMessage.warning(t('client.login.password.accountRequired'));
    return false;
  }
  if (!/^\d{4,8}$/.test(form.code.trim())) {
    ElMessage.warning(t('client.login.password.codeInvalid'));
    return false;
  }
  return true;
};

const resolveAfterLogin = async () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect.trim() : '';
  if (redirect.startsWith('/')) {
    await router.push(redirect);
    return;
  }
  await router.push('/');
};

const startCodeCountdown = () => {
  if (codeTimer) {
    window.clearInterval(codeTimer);
  }
  codeCooldown.value = 60;
  codeTimer = window.setInterval(() => {
    if (codeCooldown.value <= 1) {
      codeCooldown.value = 0;
      if (codeTimer) {
        window.clearInterval(codeTimer);
        codeTimer = null;
      }
      return;
    }
    codeCooldown.value -= 1;
  }, 1000);
};

const requestLoginCode = async () => {
  const accountValue = form.account.trim();
  if (!accountValue) {
    ElMessage.warning(t('client.login.password.accountRequired'));
    return;
  }
  sendingCode.value = true;
  try {
    await sendCode({
      phoneOrEmail: accountValue,
    });
    ElMessage.success(t('client.login.password.codeSent'));
    startCodeCountdown();
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.login.password.codeSendFailed'));
  } finally {
    sendingCode.value = false;
  }
};

const submitLogin = async () => {
  const valid = isCodeLogin.value ? validateCodeLogin() : validatePasswordLogin();
  if (!valid) return;

  submitting.value = true;
  const accountValue = form.account.trim();
  try {
    if (!isCodeLogin.value) {
      const result = await loginByPassword({
        account: accountValue,
        username: accountValue,
        phoneOrEmail: accountValue,
        password: form.password,
      });
      if (!saveClientToken(result, accountValue)) {
        throw new Error(t('client.login.password.failed'));
      }
      ElMessage.success(t('client.login.password.success'));
      await resolveAfterLogin();
      return;
    }

    const codeValue = form.code.trim();
    const result = await loginByVerifyCode({
      account: accountValue,
      phoneOrEmail: accountValue,
      code: codeValue,
      verifyCode: codeValue,
    });
    if (!saveClientToken(result, accountValue)) {
      throw new Error(t('client.login.password.codeLoginFailed'));
    }
    ElMessage.success(t('client.login.password.codeLoginSuccess'));
    await resolveAfterLogin();
  } catch (error: any) {
    ElMessage.error(
      error?.message
        || (isCodeLogin.value
          ? t('client.login.password.codeLoginFailed')
          : t('client.login.password.failed')),
    );
  } finally {
    submitting.value = false;
  }
};

onBeforeUnmount(() => {
  if (codeTimer) {
    window.clearInterval(codeTimer);
    codeTimer = null;
  }
});
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

.auth-page__left {
  width: min(500px, 45vw);
  min-width: 400px;
  padding: 48px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, var(--hourx-brand-hover) 0%, var(--hourx-brand) 58%, var(--hourx-brand-hover) 100%);
}

.auth-page__left::before,
.auth-page__left::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(186, 247, 233, 0.65);
  filter: blur(100px);
  z-index: 0;
}

.auth-page__left::before {
  left: 90px;
  top: -228px;
}

.auth-page__left::after {
  left: -280px;
  bottom: -228px;
}

.auth-brand,
.auth-page__left-content {
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
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #fff;
}

.auth-page__left-content {
  margin-top: 220px;
}

.auth-page__headline {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 800;
  color: #fff;
}

.auth-page__slogan {
  margin: 64px 0 0;
  font-size: 18px;
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
  font-size: 14px;
  line-height: 1.25;
  text-align: center;
}

.auth-feature-card__item span {
  display: block;
  margin-top: 4px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.auth-page__right {
  flex: 1;
  min-width: 0;
  position: relative;
  padding: 32px 48px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-page__tools {
  position: absolute;
  top: 32px;
  left: 32px;
  right: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-pill {
  position: static;
  height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.top-pill--back {
  min-width: 98px;
  padding: 0 18px;
}

.top-pill--locale {
  min-width: 94px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.top-pill--locale img {
  width: 16px;
  height: 16px;
}

.auth-form-wrap {
  width: 100%;
  max-width: 448px;
}

.auth-form-wrap__header h2 {
  margin: 0;
  font-size: 30px;
  line-height: 36px;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.9);
}

.auth-form-wrap__header p {
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: rgba(15, 23, 42, 0.5);
}

.auth-form {
  margin-top: 32px;
}

.form-item {
  display: block;
  margin-bottom: 16px;
}

.form-item > span {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}

.form-item__control {
  width: 100%;
  height: 50px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  box-sizing: border-box;
}

.form-item__control img {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-item__leading-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  fill: none;
  stroke: #9bb0cf;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.form-item__control input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(15, 23, 42, 0.88);
  font-size: 16px;
}

.form-item__control input::placeholder {
  color: #64748b;
}

.code-row {
  display: flex;
  gap: 12px;
}

.form-item__control--code {
  flex: 1;
}

.code-btn {
  width: 102px;
  border: 0;
  border-radius: 10px;
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.code-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-item > .form-item__forgot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  margin-bottom: 0;
}

.form-item__forgot button {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--hourx-brand);
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
  cursor: pointer;
}

.link-btn {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--hourx-brand);
  font-size: 16px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.password-toggle {
  width: 26px;
  height: 26px;
  border: 0;
  padding: 0;
  background: transparent;
  color: rgba(15, 23, 42, 0.58);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 26px;
  cursor: pointer;
}

.password-toggle svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.submit-btn {
  margin-top: 24px;
  width: 100%;
  height: 60px;
  border: 0;
  border-radius: 14px;
  background: var(--hourx-brand);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.secondary-login-btn {
  width: 100%;
  height: 54px;
  margin-top: 0;
  border: 1px solid rgba(5, 21, 43, 0.34);
  border-radius: 14px;
  background: #fff;
  color: var(--hourx-brand);
  font-size: 16px;
  font-weight: 750;
  cursor: pointer;
}

.login-divider {
  margin: 18px 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 650;
}

.login-divider::before,
.login-divider::after {
  content: '';
  height: 1px;
  background: #e2e8f0;
}

.submit-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.agreement {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(15, 23, 42, 0.35);
}

.agreement a {
  color: rgba(15, 23, 42, 0.5);
  text-decoration: none;
}

@media (max-width: 1320px) {
  .auth-brand__name {
    font-size: 30px;
  }

  .auth-page__headline {
    font-size: 22px;
  }

  .auth-page__slogan {
    font-size: 18px;
  }

  .auth-feature-card__item strong {
    font-size: 18px;
  }

  .auth-feature-card__item span {
    font-size: 17px;
  }

  .auth-form-wrap__header p,
  .link-btn {
    font-size: 16px;
  }

}

@media (max-width: 1024px) {
  .auth-page {
    flex-direction: column;
  }

  .auth-page__left {
    width: 100%;
    min-width: 0;
    padding: 24px 20px 32px;
  }

  .auth-brand__name {
    font-size: 28px;
  }

  .auth-page__left-content {
    margin-top: 56px;
  }

  .auth-page__headline {
    font-size: 22px;
  }

  .auth-page__slogan {
    margin-top: 24px;
    font-size: 18px;
  }

  .auth-feature-card {
    margin-top: 24px;
  }

  .auth-feature-card__item strong {
    font-size: 24px;
  }

  .auth-feature-card__item span {
    font-size: 15px;
  }

  .auth-page__right {
    padding: 82px 16px 24px;
    align-items: flex-start;
  }

  .auth-page__tools {
    top: 18px;
    left: 16px;
    right: 16px;
  }

  .auth-form-wrap__header h2 {
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

  .code-row {
    flex-direction: column;
  }

  .code-btn {
    width: 100%;
    height: 44px;
  }
}
</style>
