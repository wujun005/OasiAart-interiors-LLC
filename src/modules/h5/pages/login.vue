<template>
  <div class="auth-page auth-page--mobile">
    <main class="auth-main">
      <header class="auth-tools">
        <button class="auth-tool" type="button" @click="goBackOrHome">
          <van-icon name="arrow-left" />
          {{ t('client.login.register.back') }}
        </button>
        <button class="auth-tool" type="button" :aria-label="localeButtonText" @click="toggleLocale">
          <img :src="languageIconUrl" alt="" />
          <span>{{ locale === 'zh' ? '中' : 'EN' }}</span>
        </button>
      </header>

      <section class="auth-panel">
        <div class="auth-heading">
          <h1>{{ isCodeLogin ? t('client.login.password.codeTitle') : t('client.login.password.title') }}</h1>
          <p>
            {{ t('client.login.password.noAccount') }}
            <button class="auth-link" type="button" @click="goRegister">
              {{ t('client.login.password.goRegister') }}
            </button>
          </p>
        </div>

        <form class="auth-form" @submit.prevent="submitLogin">
          <div class="auth-field">
            <label for="login-account">
              {{ t(isCodeLogin ? 'client.login.password.phoneEmailLabel' : 'client.login.password.accountLabel') }}
            </label>
            <div class="auth-account">
              <div v-if="!showEmailAccount" class="auth-prefix">
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
                <van-icon name="contact-o" />
                <input
                  id="login-account"
                  v-model.trim="form.account"
                  type="text"
                  autocomplete="username"
                  :placeholder="t(showEmailAccount ? 'client.login.register.emailPlaceholder' : 'client.login.register.phoneNumberPlaceholder')"
                  :inputmode="showEmailAccount ? 'email' : 'tel'"
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
              <van-icon name="lock" />
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
                <van-icon :name="showPassword ? 'closed-eye' : 'eye-o'" />
              </button>
            </div>
          </div>

          <label v-else class="auth-field">
            <span>{{ t('client.login.password.codeLabel') }}</span>
            <div class="auth-code-row">
              <div class="auth-input">
                <van-icon name="chat-o" />
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
                :disabled="!isCodeDestinationValid || sendingCode || codeCooldown > 0"
                @click="requestLoginCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
            <small v-if="codeSentHint" class="auth-note">{{ codeSentHint }}</small>
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
                : t(showEmailAccount ? 'client.login.password.useCodeLoginEmail' : 'client.login.password.useCodeLogin')
            }}
          </button>

          <p v-if="emailLoginHint || !showEmailAccount" class="auth-note" role="note">
            {{ emailLoginHint || t('client.login.password.otpNote') }}
          </p>
        </form>

        <p class="auth-agreement">
          {{ t('client.login.password.agreementPrefix') }}
          <button type="button" @click="openTerms">{{ t('client.login.password.terms') }}</button>
          {{ t('client.login.password.agreementAnd') }}
          <button type="button" @click="openPrivacy">{{ t('client.login.password.privacy') }}</button>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { login as loginByPassword, loginByVerifyCode, sendCode } from '@/modules/client/api/login';
import { setClientLocale } from '@/modules/client/locales';
import { preferEmailErrorCode, preferEmailMessage } from '@/modules/client/utils/verificationChannel';
import { openClientLegalPage, saveClientToken } from '@/modules/h5/utils/auth';
import {
  DEFAULT_LOGIN_COUNTRY_CODE,
  isEmailLoginAccount,
  LOGIN_COUNTRY_CODE_OPTIONS,
  resolveLoginAccount,
} from '@/utils/login-account';

type LoginMode = 'password' | 'code';

const languageIconUrl = new URL('@/assets/images/client/language-Icon.png', import.meta.url).href;

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();

const form = reactive({
  countryCode: DEFAULT_LOGIN_COUNTRY_CODE,
  account: '',
  password: '',
  code: '',
});

const loginMode = ref<LoginMode>('password');
const sendingCode = ref(false);
const codeCooldown = ref(0);
const codeSentDestination = ref('');
const submitting = ref(false);
const showPassword = ref(false);
let codeTimer: number | null = null;

const isCodeLogin = computed(() => loginMode.value === 'code');
const isEmailAccount = computed(() => isEmailLoginAccount(form.account));
const preferEmailLogin = ref(false);
const emailLoginHint = ref('');
const showEmailAccount = computed(() => preferEmailLogin.value || isEmailAccount.value);
const countryCodeOptions = LOGIN_COUNTRY_CODE_OPTIONS;
const resolvedLoginAccount = computed(() => resolveLoginAccount(form.account, form.countryCode));
const isCodeDestinationValid = computed(() => {
  const value = resolvedLoginAccount.value;
  if (preferEmailLogin.value) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!value) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  return /^\+?[\d\s()-]{7,}$/.test(value) && value.replace(/\D/g, '').length >= 7;
});
const passwordInputType = computed(() => (showPassword.value ? 'text' : 'password'));
const localeButtonText = computed(() =>
  locale.value === 'zh' ? t('client.header.languageZh') : t('client.header.languageEn'),
);
const codeBtnText = computed(() => {
  if (codeCooldown.value > 0) {
    return t('client.login.password.resendIn', { seconds: codeCooldown.value });
  }
  if (sendingCode.value) {
    return t('client.login.password.sendingCode');
  }
  return t('client.login.password.getCode');
});
const maskCodeDestination = (value: string) => {
  if (value.includes('@')) {
    const [name = '', domain = ''] = value.split('@');
    return `${name.slice(0, 2)}${name.length > 2 ? '***' : ''}@${domain}`;
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 6) return value;
  return `${value.trim().startsWith('+') ? '+' : ''}${digits.slice(0, 3)}****${digits.slice(-4)}`;
};
const codeSentHint = computed(() => {
  const current = resolvedLoginAccount.value;
  if (!codeSentDestination.value || current !== codeSentDestination.value) return '';
  return t('client.login.password.codeSentTo', {
    destination: maskCodeDestination(codeSentDestination.value),
  });
});

const toggleLocale = () => {
  const next = locale.value === 'zh' ? 'en' : 'zh';
  locale.value = setClientLocale(next);
  localStorage.setItem('h5-locale', next);
};

const goBackOrHome = () => {
  if (router.options.history.state.back) {
    router.back();
    return;
  }
  router.push({ name: 'h5-home' });
};

const goRegister = () => {
  router.push({ name: 'h5-register' });
};

const toggleLoginMode = () => {
  loginMode.value = isCodeLogin.value ? 'password' : 'code';
  if (isCodeLogin.value) {
    form.password = '';
    showPassword.value = false;
    return;
  }
  form.code = '';
  preferEmailLogin.value = false;
  emailLoginHint.value = '';
};

const promptEmailCodeLogin = (error: unknown) => {
  const message = preferEmailMessage(error, String(locale.value)) || t('client.login.password.preferEmail');
  loginMode.value = 'code';
  form.password = '';
  form.code = '';
  form.account = '';
  showPassword.value = false;
  preferEmailLogin.value = true;
  emailLoginHint.value = message;
  showFailToast(message);
  void nextTick(() => document.getElementById('login-account')?.focus());
};

const openTerms = () => openClientLegalPage('/terms');
const openPrivacy = () => openClientLegalPage('/privacy');

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
  if (!isCodeDestinationValid.value) {
    showFailToast(t('client.login.password.accountInvalid'));
    return;
  }
  sendingCode.value = true;
  try {
    await sendCode({ phoneOrEmail: accountValue });
    codeSentDestination.value = accountValue;
    emailLoginHint.value = '';
    showSuccessToast(t('client.login.password.codeSent'));
    startCodeCountdown();
  } catch (error: any) {
    if (preferEmailErrorCode(error) && !isEmailAccount.value) {
      promptEmailCodeLogin(error);
      return;
    }
    showFailToast(error?.message || t('client.login.password.codeSendFailed'));
  } finally {
    sendingCode.value = false;
  }
};

const validatePasswordLogin = () => {
  if (!form.account.trim()) {
    showFailToast(t('client.login.password.accountRequired'));
    return false;
  }
  if (!form.password.trim()) {
    showFailToast(t('client.login.password.passwordRequired'));
    return false;
  }
  return true;
};

const validateCodeLogin = () => {
  if (preferEmailLogin.value && !isEmailAccount.value) {
    showFailToast(emailLoginHint.value || t('client.login.password.preferEmail'));
    return false;
  }
  if (!form.account.trim()) {
    showFailToast(t('client.login.password.accountRequired'));
    return false;
  }
  if (!/^\d{4,8}$/.test(form.code.trim())) {
    showFailToast(t('client.login.password.codeInvalid'));
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
  await router.push({ name: 'h5-home' });
};

const submitLogin = async () => {
  const valid = isCodeLogin.value ? validateCodeLogin() : validatePasswordLogin();
  if (!valid) {
    return;
  }

  submitting.value = true;
  const accountValue = resolvedLoginAccount.value;
  try {
    if (isCodeLogin.value) {
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
      showSuccessToast(t('client.login.password.codeLoginSuccess'));
      await resolveAfterLogin();
      return;
    }

    const result = await loginByPassword({
      account: accountValue,
      username: accountValue,
      phoneOrEmail: accountValue,
      password: form.password,
    });
    if (!saveClientToken(result, accountValue)) {
      throw new Error(t('client.login.password.failed'));
    }
    showSuccessToast(t('client.login.password.success'));
    await resolveAfterLogin();
  } catch (error: any) {
    showFailToast(
      error?.message || (isCodeLogin.value ? t('client.login.password.codeLoginFailed') : t('client.login.password.failed')),
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
@use '../../client/style/auth';
</style>
