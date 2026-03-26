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
          <label class="h5-login-field">
            <span>{{ isCodeLogin ? t('client.login.password.phoneEmailLabel') : t('client.login.password.accountLabel') }}</span>
            <div class="h5-login-input">
              <van-icon name="contact-o" />
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

          <label v-if="!isCodeLogin" class="h5-login-field">
            <span>{{ t('client.login.password.passwordLabel') }}</span>
            <div class="h5-login-input">
              <van-icon name="shield-o" />
              <input
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                :placeholder="t('client.login.password.passwordPlaceholder')"
              />
            </div>
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
                :disabled="sendingCode || codeCooldown > 0"
                @click="requestLoginCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
          </label>

          <div class="h5-login-helper">
            <button type="button" @click="toggleLoginMode">
              {{ isCodeLogin ? t('client.login.password.usePasswordLogin') : t('client.login.password.forgotByCode') }}
            </button>
          </div>

          <button class="h5-login-submit" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.password.submitting') : t('client.login.password.submit') }}
          </button>
        </form>

        <p class="h5-login-agreement">
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
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { login as loginByPassword, loginByVerifyCode, sendCode } from '@/modules/client/api/login';
import { setClientLocale } from '@/modules/client/locales';
import { openClientLegalPage, saveClientToken } from '@/modules/h5/utils/auth';

type LoginMode = 'password' | 'code';

const languageIconUrl = new URL('@/assets/images/client/language-Icon.png', import.meta.url).href;

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();

const form = reactive({
  account: '',
  password: '',
  code: '',
});

const loginMode = ref<LoginMode>('password');
const sendingCode = ref(false);
const codeCooldown = ref(0);
const submitting = ref(false);
let codeTimer: number | null = null;

const isCodeLogin = computed(() => loginMode.value === 'code');
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
  const accountValue = form.account.trim();
  if (!accountValue) {
    showFailToast(t('client.login.password.accountRequired'));
    return;
  }
  sendingCode.value = true;
  try {
    await sendCode({ phoneOrEmail: accountValue });
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
  const accountValue = form.account.trim();
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
}

.h5-login-topbar {
  max-width: 393px;
  height: 72px;
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
  width: 40px;
  height: 40px;
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
  padding-top: 16px;
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
.h5-login-helper button {
  border: 0;
  background: transparent;
  padding: 0;
  color: #3972f5;
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
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.h5-login-input :deep(.van-icon) {
  color: #9bb0cf;
  font-size: 20px;
}

.h5-login-input input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1d293d;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 500;
}

.h5-login-input input::placeholder {
  color: #90a1b9;
}

.h5-login-input:focus-within {
  border-color: rgba(57, 114, 245, 0.32);
  box-shadow: 0 0 0 3px rgba(57, 114, 245, 0.06);
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
  background: #eef4ff;
  color: #3972f5;
  font-size: 13px;
  font-weight: 700;
  padding: 0 8px;
  cursor: pointer;
}

.h5-login-code-btn:disabled,
.h5-login-submit:disabled {
  opacity: 0.6;
}

.h5-login-helper {
  margin-top: -2px;
  display: flex;
  justify-content: flex-end;
}

.h5-login-helper button {
  font-size: 14px;
  line-height: 21px;
}

.h5-login-submit {
  margin-top: 20px;
  width: 100%;
  min-height: 52px;
  border: 0;
  border-radius: 10px;
  background: #3972f5;
  color: #fff;
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
}

.h5-login-agreement {
  width: min(196px, 100%);
  margin: 44px auto 0;
  color: #90a1b9;
  font-size: 12px;
  line-height: 19.5px;
  font-weight: 500;
  text-align: center;
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
