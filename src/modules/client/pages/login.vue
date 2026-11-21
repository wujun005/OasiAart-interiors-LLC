<template>
  <div class="auth-page">
    <aside class="auth-side">
      <div class="auth-brand">
        <img :src="assetLogo" alt="HourX" />
      </div>

      <div>
        <span class="auth-kicker">{{ t('client.login.register.brand') }}</span>
        <h2 class="auth-headline">{{ t('client.login.register.heroTitle') }}</h2>
        <p class="auth-slogan">{{ t('client.login.register.heroSlogan') }}</p>
      </div>

      <div class="auth-features">
        <article v-for="item in leftFeatures" :key="item.key" class="auth-feature">
          <img :src="item.icon" alt="" />
          <strong>{{ t(item.titleKey) }}</strong>
          <span>{{ t(item.descKey) }}</span>
        </article>
      </div>
    </aside>

    <section class="auth-main">
      <div class="auth-tools">
        <button class="auth-tool" type="button" @click="goHome">
          {{ t('client.login.register.backHome') }}
        </button>

        <el-dropdown trigger="click" @command="handleLocaleCommand">
          <button class="auth-tool" type="button" :aria-label="localeLabel">
            <img :src="assetLocale" alt="" />
            <span>{{ locale === 'zh' ? '中' : 'EN' }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="en">{{ t('client.header.languageEn') }}</el-dropdown-item>
              <el-dropdown-item command="zh">{{ t('client.header.languageZh') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="auth-panel">
        <header class="auth-heading">
          <h1>
            {{
              isCodeLogin
                ? t('client.login.password.codeTitle')
                : t('client.login.password.title')
            }}
          </h1>
          <p>
            {{ t('client.login.password.noAccount') }}
            <button type="button" class="auth-link" @click="goRegister">
              {{ t('client.login.password.goRegister') }}
            </button>
          </p>
        </header>

        <form class="auth-form" @submit.prevent="submitLogin">
          <div class="auth-field">
            <label for="login-account">
              {{ t(isCodeLogin ? 'client.login.password.phoneEmailLabel' : 'client.login.password.accountLabel') }}
            </label>
            <div class="auth-account">
              <div v-if="!isEmailAccount" class="auth-prefix">
                <select
                  v-model="form.countryCode"
                  autocomplete="tel-country-code"
                  :aria-label="t('client.login.password.countryCodeLabel')"
                >
                  <option
                    v-for="item in countryCodeOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.value }}
                  </option>
                </select>
              </div>
              <div class="auth-input">
                <img :src="assetAccount" alt="" />
                <input
                  id="login-account"
                  v-model.trim="form.account"
                  type="text"
                  autocomplete="username"
                  :placeholder="t(isEmailAccount ? 'client.login.register.emailPlaceholder' : 'client.login.register.phoneNumberPlaceholder')"
                />
              </div>
            </div>
          </div>

          <div v-if="!isCodeLogin" class="auth-field">
            <div class="auth-field__header">
              <label for="login-password">{{ t('client.login.password.passwordLabel') }}</label>
              <span class="auth-forgot">
                <button type="button" @click="toggleLoginMode">
                  {{ t('client.login.password.forgotPassword') }}
                </button>
              </span>
            </div>
            <div class="auth-input">
              <svg class="form-item__leading-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="login-password"
                v-model="form.password"
                :type="passwordInputType"
                autocomplete="current-password"
                :placeholder="t('client.login.password.passwordPlaceholder')"
              />
              <button
                class="auth-password-toggle"
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
          </div>

          <label v-else class="auth-field">
            <span>{{ t('client.login.password.codeLabel') }}</span>
            <div class="auth-code-row">
              <div class="auth-input">
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
                class="auth-code-btn"
                type="button"
                :disabled="sendingCode || codeCooldown > 0"
                @click="requestLoginCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
          </label>

          <button class="auth-submit" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.password.submitting') : t('client.login.password.submit') }}
          </button>

          <div class="auth-divider" aria-hidden="true">
            <span>{{ t('client.login.password.separator') }}</span>
          </div>

          <button class="auth-secondary" type="button" @click="toggleLoginMode">
            {{
              isCodeLogin
                ? t('client.login.password.usePasswordLogin')
                : t(isEmailAccount ? 'client.login.password.useCodeLoginEmail' : 'client.login.password.useCodeLogin')
            }}
          </button>

          <p v-if="!isEmailAccount" class="auth-note" role="note">
            {{ t('client.login.password.otpNote') }}
          </p>
        </form>

        <p class="auth-agreement">
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
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  login as loginByPassword,
  loginByVerifyCode,
  sendCode,
} from '@/modules/client/api/login';
import { setClientLocale, type ClientLocale } from '@/modules/client/locales';
import { preferEmailErrorCode } from '@/modules/client/utils/verificationChannel';
import {
  clearStoredAuthState,
  setClientAuthStorageValue,
} from '@/utils/auth-state';
import {
  DEFAULT_LOGIN_COUNTRY_CODE,
  isEmailLoginAccount,
  LOGIN_COUNTRY_CODE_OPTIONS,
  resolveLoginAccount,
} from '@/utils/login-account';

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
  countryCode: DEFAULT_LOGIN_COUNTRY_CODE,
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
const countryCodeOptions = LOGIN_COUNTRY_CODE_OPTIONS;
const isEmailAccount = computed(() => isEmailLoginAccount(form.account));
const lastPhoneCountryCode = ref(form.countryCode);
const resolvedLoginAccount = computed(() => resolveLoginAccount(form.account, form.countryCode));

watch(isEmailAccount, (isEmail) => {
  if (isEmail) {
    if (form.countryCode) {
      lastPhoneCountryCode.value = form.countryCode;
    }
    form.countryCode = '';
    return;
  }
  form.countryCode = lastPhoneCountryCode.value || DEFAULT_LOGIN_COUNTRY_CODE;
});
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
  const accountValue = resolvedLoginAccount.value;
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
    ElMessage.error(preferEmailErrorCode(error)
      ? t('client.login.password.preferEmail')
      : (error?.message || t('client.login.password.codeSendFailed')));
  } finally {
    sendingCode.value = false;
  }
};

const submitLogin = async () => {
  const valid = isCodeLogin.value ? validateCodeLogin() : validatePasswordLogin();
  if (!valid) return;

  submitting.value = true;
  const accountValue = resolvedLoginAccount.value;
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
@use '../style/auth';
</style>
