<template>
  <div class="h5-register-page">
    <header class="h5-register-topbar">
      <button class="h5-register-topbar__back" type="button" @click="goBackOrLogin">
        <van-icon name="arrow-left" />
      </button>
      <button class="h5-register-topbar__locale" type="button" @click="toggleLocale">
        <img :src="languageIconUrl" alt="" />
        <span>{{ localeButtonText }}</span>
      </button>
    </header>

    <main class="h5-register-main">
      <section class="h5-register-panel">
        <div class="h5-register-panel__header">
          <h1>{{ t('client.login.register.title') }}</h1>
          <p>
            {{ t('client.login.register.hasAccount') }}
            <button type="button" @click="goLogin">
              {{ t('client.login.register.goLogin') }}
            </button>
          </p>
        </div>

        <form class="h5-register-form" @submit.prevent="submitRegister">
          <label class="h5-register-field">
            <span>{{ t('client.login.register.phoneLabel') }}</span>
            <div class="h5-register-phone-row">
              <div class="h5-register-select">
                <select v-model="form.countryCode" autocomplete="tel-country-code">
                  <option v-for="item in countryCodeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="h5-register-input">
                <van-icon name="phone-o" />
                <input
                  v-model.trim="form.phone"
                  type="text"
                  autocomplete="tel-national"
                  :placeholder="t('client.login.register.phoneNumberPlaceholder')"
                />
              </div>
            </div>
          </label>

          <label class="h5-register-field">
            <span>{{ t('client.login.register.emailLabel') }}</span>
            <div class="h5-register-input">
              <van-icon name="envelop-o" />
              <input
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                :placeholder="t('client.login.register.emailPlaceholder')"
              />
            </div>
          </label>

          <label class="h5-register-field">
            <span>{{ t('client.login.register.passwordLabel') }}</span>
            <div class="h5-register-input">
              <van-icon name="shield-o" />
              <input
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                :placeholder="t('client.login.register.passwordPlaceholder')"
              />
            </div>
          </label>

          <label class="h5-register-field">
            <span>{{ t('client.login.register.codeLabel') }}</span>
            <div class="h5-register-code-row">
              <div class="h5-register-input h5-register-input--code">
                <van-icon name="chat-o" />
                <input
                  v-model.trim="form.smsCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  :placeholder="t('client.login.register.codePlaceholder')"
                />
              </div>
              <button
                class="h5-register-code-btn"
                type="button"
                :disabled="sendingCode || codeCooldown > 0"
                @click="requestSmsCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
          </label>

          <button class="h5-register-submit" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.register.submitting') : t('client.login.register.submit') }}
          </button>
        </form>

        <p class="h5-register-agreement">
          {{ t('client.login.register.agreementPrefix') }}
          <button type="button" @click="openTerms">{{ t('client.login.register.terms') }}</button>
          {{ t('client.login.register.agreementAnd') }}
          <button type="button" @click="openPrivacy">{{ t('client.login.register.privacy') }}</button>
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
import { register as sendRegisterCode, registerByEmailPhone } from '@/modules/client/api/login';
import { setClientLocale } from '@/modules/client/locales';
import {
  buildFullPhone,
  DEFAULT_H5_COUNTRY_CODE,
  H5_COUNTRY_CODE_OPTIONS,
  normalizePhoneNumber,
  openClientLegalPage,
  saveClientToken,
} from '@/modules/h5/utils/auth';

const languageIconUrl = new URL('@/assets/images/client/language-Icon.png', import.meta.url).href;

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();

const form = reactive({
  countryCode: DEFAULT_H5_COUNTRY_CODE,
  phone: '',
  email: '',
  password: '',
  smsCode: '',
});

const sendingCode = ref(false);
const codeCooldown = ref(0);
const submitting = ref(false);
let codeTimer: number | null = null;

const localeButtonText = computed(() =>
  locale.value === 'zh' ? t('client.header.languageZh') : t('client.header.languageEn'),
);
const countryCodeOptions = computed(() =>
  H5_COUNTRY_CODE_OPTIONS.map((item) => ({
    value: item.value,
    label: locale.value === 'zh' ? item.labelZh : item.labelEn,
  })),
);
const codeBtnText = computed(() => {
  if (codeCooldown.value > 0) {
    return t('client.login.register.resendIn', { seconds: codeCooldown.value });
  }
  if (sendingCode.value) {
    return t('client.login.register.sendingCode');
  }
  return t('client.login.register.getCode');
});

const toggleLocale = () => {
  const next = locale.value === 'zh' ? 'en' : 'zh';
  locale.value = setClientLocale(next);
  localStorage.setItem('h5-locale', next);
};

const goBackOrLogin = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push({ name: 'h5-login' });
};

const goLogin = () => {
  router.push({ name: 'h5-login' });
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

const requestSmsCode = async () => {
  if (!normalizePhoneNumber(form.phone)) {
    showFailToast(t('client.login.register.phoneRequired'));
    return;
  }
  sendingCode.value = true;
  try {
    await sendRegisterCode({
      phone: buildFullPhone(form.countryCode, form.phone),
      email: form.email.trim() || undefined,
    });
    showSuccessToast(t('client.login.register.codeSent'));
    startCodeCountdown();
  } catch (error: any) {
    showFailToast(error?.message || t('client.login.register.codeSendFailed'));
  } finally {
    sendingCode.value = false;
  }
};

const validateForm = () => {
  if (!normalizePhoneNumber(form.phone)) {
    showFailToast(t('client.login.register.phoneRequired'));
    return false;
  }
  if (!form.email.trim()) {
    showFailToast(t('client.login.register.emailRequired'));
    return false;
  }
  if (!/.+@.+\..+/.test(form.email.trim())) {
    showFailToast(t('client.login.register.emailInvalid'));
    return false;
  }
  if (!form.password || form.password.length < 6) {
    showFailToast(t('client.login.register.passwordInvalid'));
    return false;
  }
  if (!/^\d{6}$/.test(form.smsCode.trim())) {
    showFailToast(t('client.login.register.codeInvalid'));
    return false;
  }
  return true;
};

const resolveAfterRegister = async () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect.trim() : '';
  if (redirect.startsWith('/')) {
    await router.push(redirect);
    return;
  }
  await router.push({ name: 'h5-home' });
};

const submitRegister = async () => {
  if (!validateForm()) {
    return;
  }

  submitting.value = true;
  const fullPhone = buildFullPhone(form.countryCode, form.phone);
  try {
    const result = await registerByEmailPhone({
      phone: fullPhone,
      email: form.email.trim(),
      password: form.password,
      code: form.smsCode.trim(),
      smsCode: form.smsCode.trim(),
      verifyCode: form.smsCode.trim(),
    });
    if (!saveClientToken(result, form.email.trim() || fullPhone, { email: form.email.trim(), phone: fullPhone })) {
      throw new Error(t('client.login.register.failed'));
    }
    showSuccessToast(t('client.login.register.success'));
    await resolveAfterRegister();
  } catch (error: any) {
    showFailToast(error?.message || t('client.login.register.failed'));
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
.h5-register-page {
  min-height: 100vh;
  background: #fff;
  color: #1d293d;
}

.h5-register-topbar {
  max-width: 393px;
  height: 72px;
  margin: 0 auto;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef2f6;
}

.h5-register-topbar__back,
.h5-register-topbar__locale {
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.h5-register-topbar__back {
  width: 40px;
  height: 40px;
  justify-content: center;
  color: #45556c;
  font-size: 20px;
  border-radius: 999px;
}

.h5-register-topbar__locale {
  height: 32px;
  gap: 6px;
  padding: 0 12px 0 10px;
  color: #45556c;
  font-size: 14px;
  font-weight: 700;
  border-radius: 999px;
}

.h5-register-topbar__locale img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.h5-register-main {
  max-width: 393px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.h5-register-panel {
  padding-top: 16px;
}

.h5-register-panel__header h1 {
  margin: 0;
  color: #1d293d;
  font-size: 24px;
  line-height: 32px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.h5-register-panel__header p {
  margin: 8px 0 0;
  color: #62748e;
  font-size: 15px;
  line-height: 22px;
  font-weight: 500;
}

.h5-register-panel__header p button,
.h5-register-agreement button {
  border: 0;
  background: transparent;
  padding: 0;
  color: #3972f5;
  font-weight: 700;
  cursor: pointer;
}

.h5-register-panel__header p button {
  font-size: 16px;
  line-height: 24px;
}

.h5-register-form {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.h5-register-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.h5-register-field > span {
  color: #314158;
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
}

.h5-register-phone-row,
.h5-register-code-row {
  display: grid;
  gap: 12px;
}

.h5-register-phone-row {
  grid-template-columns: 112px minmax(0, 1fr);
}

.h5-register-code-row {
  grid-template-columns: minmax(0, 1fr) 110px;
}

.h5-register-select,
.h5-register-input {
  min-height: 49px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.h5-register-select {
  padding: 0 12px;
  display: flex;
  align-items: center;
}

.h5-register-select select {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1d293d;
  font-size: 16px;
  font-weight: 500;
}

.h5-register-input {
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.h5-register-input :deep(.van-icon) {
  color: #9bb0cf;
  font-size: 20px;
}

.h5-register-input input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1d293d;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 500;
}

.h5-register-input input::placeholder {
  color: #90a1b9;
}

.h5-register-input:focus-within,
.h5-register-select:focus-within {
  border-color: rgba(57, 114, 245, 0.32);
  box-shadow: 0 0 0 3px rgba(57, 114, 245, 0.06);
  background: #fff;
}

.h5-register-input--code {
  min-width: 0;
}

.h5-register-code-btn {
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

.h5-register-code-btn:disabled,
.h5-register-submit:disabled {
  opacity: 0.6;
}

.h5-register-submit {
  margin-top: 24px;
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

.h5-register-agreement {
  width: min(212px, 100%);
  margin: 44px auto 0;
  color: #90a1b9;
  font-size: 12px;
  line-height: 19.5px;
  font-weight: 500;
  text-align: center;
}

.h5-register-agreement button {
  color: #45556c;
  font-size: 12px;
  line-height: 19.5px;
  font-weight: 700;
}
</style>
