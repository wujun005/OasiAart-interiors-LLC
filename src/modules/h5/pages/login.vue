<template>
  <div class="h5-login-page">
    <header class="h5-login-topbar">
      <button class="h5-login-topbar__back" type="button" @click="goBackOrHome">
        <van-icon name="arrow-left" />
      </button>
      <button class="h5-login-topbar__locale" type="button" @click="toggleLocale">
        <img :src="languageIconUrl" alt="" />
        <span>{{ localeButtonText }}</span>
      </button>
    </header>

    <main class="h5-login-main">
      <section class="h5-login-panel">
        <div class="h5-login-panel__header">
          <h1>{{ isCodeLogin ? t('client.login.password.codeTitle') : t('client.login.password.title') }}</h1>
          <p>
            {{ t('client.login.password.noAccount') }}
            <button type="button" @click="goRegister">
              {{ t('client.login.password.goRegister') }}
            </button>
          </p>
        </div>

        <form class="h5-login-form" @submit.prevent="submitLogin">
          <div class="h5-login-field">
            <span>{{ isCodeLogin ? t('client.login.password.phoneEmailLabel') : t('client.login.password.accountLabel') }}</span>
            <div class="h5-login-account-row">
              <div class="h5-login-prefix-box">
                <select
                  v-model="form.countryCode"
                  class="h5-login-country-code"
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
              <div class="h5-login-input h5-login-input--account">
                <van-icon name="contact-o" />
                <input
                  v-model.trim="form.account"
                  type="text"
                  autocomplete="username"
                  :placeholder="t('client.login.password.mobileAccountPlaceholder')"
                />
              </div>
            </div>
          </div>

          <label v-if="!isCodeLogin" class="h5-login-field h5-login-field--password">
            <span>{{ t('client.login.password.passwordLabel') }}</span>
            <div class="h5-login-input">
              <van-icon name="lock" />
              <input
                v-model="form.password"
                :type="passwordInputType"
                autocomplete="current-password"
                :placeholder="t('client.login.password.passwordPlaceholder')"
              />
              <button
                class="h5-password-toggle"
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
            <span class="h5-login-forgot">
              <button type="button" @click="toggleLoginMode">
                {{ t('client.login.password.forgotPassword') }}
              </button>
            </span>
          </label>

          <label v-else class="h5-login-field">
            <span>{{ t('client.login.password.codeLabel') }}</span>
            <div class="h5-login-code-row">
              <div class="h5-login-input h5-login-input--code">
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
                class="h5-login-code-btn"
                type="button"
                :disabled="!isCodeDestinationValid || sendingCode || codeCooldown > 0"
                @click="requestLoginCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
            <small v-if="codeSentHint" class="h5-login-code-hint">{{ codeSentHint }}</small>
          </label>

          <button class="h5-login-submit" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.password.submitting') : t('client.login.password.submit') }}
          </button>

          <div class="h5-login-divider" aria-hidden="true">
            <span>{{ t('client.login.password.separator') }}</span>
          </div>

          <button class="h5-login-secondary" type="button" @click="toggleLoginMode">
            {{
              isCodeLogin
                ? t('client.login.password.usePasswordLogin')
                : t('client.login.password.useCodeLogin')
            }}
          </button>
        </form>

        <p class="h5-login-agreement">
          <span class="h5-login-agreement__lead">
            {{ t('client.login.password.agreementPrefix') }}
          </span>
          <span class="h5-login-agreement__links">
            <button type="button" @click="openTerms">{{ t('client.login.password.terms') }}</button>
            <span>{{ t('client.login.password.agreementAnd') }}</span>
            <button type="button" @click="openPrivacy">{{ t('client.login.password.privacy') }}</button>
          </span>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { login as loginByPassword, loginByVerifyCode, sendCode } from '@/modules/client/api/login';
import { setClientLocale } from '@/modules/client/locales';
import { openClientLegalPage, saveClientToken } from '@/modules/h5/utils/auth';
import {
  DEFAULT_LOGIN_COUNTRY_CODE,
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
const countryCodeOptions = LOGIN_COUNTRY_CODE_OPTIONS;
const resolvedLoginAccount = computed(() => resolveLoginAccount(form.account, form.countryCode));
const isCodeDestinationValid = computed(() => {
  const value = resolvedLoginAccount.value;
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
  if (window.history.length > 1) {
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
    showSuccessToast(t('client.login.password.codeSent'));
    startCodeCountdown();
  } catch (error: any) {
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
.h5-login-page {
  min-height: 100vh;
  background: #fff;
  color: #1d293d;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.h5-login-topbar {
  max-width: 393px;
  height: 54px;
  margin: 0 auto;
  padding: 0 12px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef2f6;
}

.h5-login-topbar__back,
.h5-login-topbar__locale {
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.h5-login-topbar__back {
  width: 44px;
  height: 44px;
  justify-content: center;
  color: #45556c;
  font-size: 20px;
  border-radius: 999px;
}

.h5-login-topbar__locale {
  height: 32px;
  gap: 6px;
  padding: 0 12px 0 10px;
  color: #45556c;
  font-size: 14px;
  font-weight: 700;
  border-radius: 999px;
}

.h5-login-topbar__locale img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.h5-login-main {
  max-width: 393px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.h5-login-panel {
  padding-top: 18px;
}

.h5-login-panel__header h1 {
  margin: 0;
  color: #1d293d;
  font-size: 24px;
  line-height: 32px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.h5-login-panel__header p {
  margin: 8px 0 0;
  color: #62748e;
  font-size: 15px;
  line-height: 22px;
  font-weight: 500;
}

.h5-login-panel__header p button,
.h5-login-forgot button {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--hourx-brand);
  font-weight: 700;
  cursor: pointer;
}

.h5-login-panel__header p button {
  font-size: 16px;
  line-height: 24px;
}

.h5-login-form {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.h5-login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.h5-login-field > span {
  color: #314158;
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
}

.h5-login-input {
  min-height: 49px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.h5-login-input :deep(.van-icon) {
  color: #9bb0cf;
  font-size: 20px;
}

.h5-login-country-code {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1d293d;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 700;
}

.h5-login-account-row {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 10px;
}

.h5-login-prefix-box {
  min-width: 0;
  min-height: 49px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.h5-login-input input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1d293d;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 500;
}

.h5-login-input--account {
  min-width: 0;
  gap: 8px;
  padding-inline: 12px;
  overflow: hidden;
}

.h5-login-input--account input {
  font-size: 16px;
}

@media (max-width: 350px) {
  .h5-login-account-row {
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 8px;
  }

  .h5-login-prefix-box,
  .h5-login-input--account {
    padding-inline: 9px;
  }
}

.h5-login-input input::placeholder {
  color: #64748b;
}

.h5-login-input:focus-within {
  border-color: rgba(5, 21, 43, 0.32);
  box-shadow: 0 0 0 3px rgba(5, 21, 43, 0.06);
  background: #fff;
}

.h5-login-code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 108px;
  gap: 10px;
}

.h5-login-input--code {
  min-width: 0;
}

.h5-login-code-btn {
  min-height: 49px;
  border: 0;
  border-radius: 10px;
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  font-size: 13px;
  font-weight: 700;
  padding: 0 8px;
  cursor: pointer;
}

.h5-login-code-btn:disabled,
.h5-login-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.h5-login-code-hint {
  color: #62748e;
  font-size: 11px;
  line-height: 1.45;
}

.h5-login-field > .h5-login-forgot {
  display: flex;
  justify-content: flex-end;
}

.h5-login-forgot button {
  font-size: 14px;
  line-height: 21px;
}

.h5-password-toggle {
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  background: transparent;
  color: #62748e;
  cursor: pointer;
}

.h5-password-toggle :deep(.van-icon) {
  color: currentColor;
  font-size: 19px;
}

.h5-login-submit {
  margin-top: 0;
  width: 100%;
  min-height: 52px;
  border: 0;
  border-radius: 10px;
  background: var(--hourx-brand);
  color: #fff;
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
}

.h5-login-secondary {
  width: 100%;
  min-height: 50px;
  border: 1px solid rgba(5, 21, 43, 0.34);
  border-radius: 10px;
  background: #fff;
  color: var(--hourx-brand);
  font-size: 15px;
  line-height: 22px;
  font-weight: 750;
  cursor: pointer;
}

.h5-login-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 11px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1;
  font-weight: 650;
}

.h5-login-divider::before,
.h5-login-divider::after {
  content: '';
  height: 1px;
  background: #e2e8f0;
}

.h5-login-agreement {
  width: 100%;
  margin: 44px auto 0;
  color: #90a1b9;
  font-size: 12px;
  line-height: 19.5px;
  font-weight: 500;
  text-align: center;
}

.h5-login-agreement__lead {
  display: block;
}

.h5-login-agreement__links {
  align-items: center;
  justify-content: center;
  gap: 4px;
  display: flex;
  white-space: nowrap;
}

.h5-login-agreement button {
  border: 0;
  background: transparent;
  padding: 0;
  color: #45556c;
  font-size: 12px;
  line-height: 19.5px;
  font-weight: 700;
}
</style>
