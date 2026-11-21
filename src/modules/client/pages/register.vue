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
          <h1>{{ t('client.login.register.title') }}</h1>
          <p>
            {{ t('client.login.register.hasAccount') }}
            <button type="button" class="auth-link" @click="goLogin">
              {{ t('client.login.register.goLogin') }}
            </button>
          </p>
        </header>

        <form class="auth-form" @submit.prevent="submitRegister">
          <label class="auth-field">
            <span>{{ t('client.login.register.phoneLabel') }}</span>
            <div class="auth-account">
              <div class="auth-prefix">
                <select v-model="form.countryCode" autocomplete="tel-country-code">
                  <option
                    v-for="item in countryCodeOptions"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="auth-input">
                <img :src="assetPhone" alt="" />
                <input
                  v-model.trim="form.phone"
                  type="text"
                  autocomplete="tel-national"
                  :placeholder="t('client.login.register.phoneNumberPlaceholder')"
                />
              </div>
            </div>
          </label>

          <label class="auth-field">
            <span>{{ t('client.login.register.emailLabel') }}</span>
            <div class="auth-input">
              <img :src="assetEmail" alt="" />
              <input
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                :placeholder="t('client.login.register.emailPlaceholder')"
              />
            </div>
          </label>

          <label class="auth-field">
            <span>{{ t('client.login.register.passwordLabel') }}</span>
            <div class="auth-input">
              <img :src="assetPassword" alt="" />
              <input
                v-model="form.password"
                :type="passwordInputType"
                autocomplete="new-password"
                :placeholder="t('client.login.register.passwordPlaceholder')"
              />
              <button
                class="auth-password-toggle"
                type="button"
                :aria-label="
                  showPassword
                    ? t('client.login.register.hidePassword')
                    : t('client.login.register.showPassword')
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
          </label>

          <label class="auth-field">
            <span>{{ t('client.login.register.confirmPasswordLabel') }}</span>
            <div class="auth-input">
              <img :src="assetPassword" alt="" />
              <input
                v-model="form.confirmPassword"
                :type="passwordInputType"
                autocomplete="new-password"
                :placeholder="t('client.login.register.confirmPasswordPlaceholder')"
              />
            </div>
          </label>

          <label class="auth-field">
            <span>{{ t('client.login.register.codeLabel') }}</span>
            <div class="auth-code-row">
              <div class="auth-input">
                <img :src="assetCode" alt="" />
                <input
                  v-model.trim="form.smsCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  :placeholder="t('client.login.register.codePlaceholder')"
                />
              </div>
              <button
                class="auth-code-btn"
                type="button"
                :disabled="sendingCode || codeCooldown > 0"
                @click="requestSmsCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
          </label>

          <button class="auth-submit" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.register.submitting') : t('client.login.register.submit') }}
          </button>
        </form>

        <p class="auth-agreement">
          {{ t('client.login.register.agreementPrefix') }}
          <RouterLink :to="{ name: 'legal-terms' }">
            {{ t('client.login.register.terms') }}
          </RouterLink>
          {{ t('client.login.register.agreementAnd') }}
          <RouterLink :to="{ name: 'legal-privacy' }">
            {{ t('client.login.register.privacy') }}
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
import { useRouter } from 'vue-router';
import {
  register as sendRegisterCode,
  registerByEmailPhone,
} from '@/modules/client/api/login';
import { setClientLocale, type ClientLocale } from '@/modules/client/locales';
import { preferEmailHint, wantsEmailChannel } from '@/modules/client/utils/verificationChannel';
import {
  clearStoredAuthState,
  setClientAuthStorageValue,
} from '@/utils/auth-state';
import { trackCompleteRegistration } from '@/modules/client/utils/metaPixel';

const assetLogo = '/assets/images/client/hourx-mark.svg';
const assetFeature1 = new URL('@/assets/images/client/Icon.png', import.meta.url).href;
const assetFeature2 = new URL('@/assets/images/client/Icon (1).png', import.meta.url).href;
const assetFeature3 = new URL('@/assets/images/client/Icon (2).png', import.meta.url).href;
const assetPhone = new URL('@/assets/images/client/Icon (6).png', import.meta.url).href;
const assetEmail = new URL('@/assets/images/client/Icon (7).png', import.meta.url).href;
const assetPassword = new URL('@/assets/images/client/Icon (4).png', import.meta.url).href;
const assetCode = new URL('@/assets/images/client/Icon (5).png', import.meta.url).href;
const assetLocale = new URL('@/assets/images/client/Icon (8).png', import.meta.url).href;

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const form = reactive({
  countryCode: '+971',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  smsCode: '',
});

const sendingCode = ref(false);
const codeCooldown = ref(0);
const submitting = ref(false);
const showPassword = ref(false);
let codeTimer: number | null = null;

const localeLabel = computed(() =>
  locale.value === 'zh' ? t('client.header.languageZh') : t('client.header.languageEn'),
);

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

const countryCodeOptions = [
  { label: 'UAE +971', value: '+971' },
  { label: 'Saudi Arabia +966', value: '+966' },
  { label: 'United States +1', value: '+1' },
  { label: 'United Kingdom +44', value: '+44' },
  { label: 'India +91', value: '+91' },
  { label: 'China +86', value: '+86' },
];

const passwordInputType = computed(() => (showPassword.value ? 'text' : 'password'));

const normalizePhoneNumber = (value: string) => value.replace(/[^\d]/g, '');

const buildFullPhone = () => `${form.countryCode}${normalizePhoneNumber(form.phone)}`;

const codeBtnText = computed(() => {
  if (codeCooldown.value > 0) {
    return t('client.login.register.resendIn', { seconds: codeCooldown.value });
  }
  if (sendingCode.value) {
    return t('client.login.register.sendingCode');
  }
  return t('client.login.register.getCode');
});

const handleLocaleCommand = (value: string | number | object) => {
  const target = value === 'zh' ? 'zh' : 'en';
  locale.value = setClientLocale(target) as ClientLocale;
};

const goHome = () => {
  router.push('/');
};

const goLogin = () => {
  router.push('/login');
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

const requestSmsCode = async () => {
  if (!normalizePhoneNumber(form.phone)) {
    ElMessage.warning(t('client.login.register.phoneRequired'));
    return;
  }
  sendingCode.value = true;
  try {
    const result = await sendRegisterCode({
      phone: buildFullPhone(),
      email: form.email.trim() || undefined,
    });
    const guidance = preferEmailHint(result, String(locale.value))
      || (wantsEmailChannel(result) ? t('client.login.register.preferEmail') : '');
    if (guidance) {
      ElMessage.warning(guidance);
    } else {
      ElMessage.success(t('client.login.register.codeSent'));
    }
    startCodeCountdown();
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.login.register.codeSendFailed'));
  } finally {
    sendingCode.value = false;
  }
};

const validateForm = () => {
  if (!normalizePhoneNumber(form.phone)) {
    ElMessage.warning(t('client.login.register.phoneRequired'));
    return false;
  }
  if (!form.email.trim()) {
    ElMessage.warning(t('client.login.register.emailRequired'));
    return false;
  }
  if (!/.+@.+\..+/.test(form.email.trim())) {
    ElMessage.warning(t('client.login.register.emailInvalid'));
    return false;
  }
  if (!form.password || form.password.length < 6) {
    ElMessage.warning(t('client.login.register.passwordInvalid'));
    return false;
  }
  if (!form.confirmPassword) {
    ElMessage.warning(t('client.login.register.confirmPasswordRequired'));
    return false;
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning(t('client.login.register.passwordMismatch'));
    return false;
  }
  if (!/^\d{6}$/.test(form.smsCode.trim())) {
    ElMessage.warning(t('client.login.register.codeInvalid'));
    return false;
  }
  return true;
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

const submitRegister = async () => {
  if (!validateForm()) return;
  submitting.value = true;
  try {
    const payload = {
      phone: buildFullPhone(),
      email: form.email.trim(),
      password: form.password,
      code: form.smsCode.trim(),
      smsCode: form.smsCode.trim(),
      verifyCode: form.smsCode.trim(),
    };
    const result = await registerByEmailPhone(payload);
    if (!saveClientToken(result, form.email.trim() || buildFullPhone())) {
      throw new Error(t('client.login.register.failed'));
    }
    trackCompleteRegistration();
    ElMessage.success(t('client.login.register.success'));
    router.push('/');
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.login.register.failed'));
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
