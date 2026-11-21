<template>
  <div class="auth-page auth-page--mobile">
    <main class="auth-main">
      <header class="auth-tools">
        <button class="auth-tool" type="button" @click="goBackOrLogin">
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
          <h1>{{ t('client.login.register.title') }}</h1>
          <p>
            {{ t('client.login.register.hasAccount') }}
            <button class="auth-link" type="button" @click="goLogin">
              {{ t('client.login.register.goLogin') }}
            </button>
          </p>
        </div>

        <form class="auth-form" @submit.prevent="submitRegister">
          <label class="auth-field">
            <span>{{ t('client.login.register.phoneLabel') }}</span>
            <div class="auth-account">
              <div class="auth-prefix">
                <select v-model="form.countryCode" autocomplete="tel-country-code">
                  <option v-for="item in countryCodeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="auth-input">
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

          <label class="auth-field">
            <span>{{ t('client.login.register.emailLabel') }}</span>
            <div class="auth-input">
              <van-icon name="envelop-o" />
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
              <van-icon name="shield-o" />
              <input
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                :placeholder="t('client.login.register.passwordPlaceholder')"
              />
            </div>
          </label>

          <label class="auth-field">
            <span>{{ t('client.login.register.codeLabel') }}</span>
            <div class="auth-code-row">
              <div class="auth-input">
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
import { showFailToast, showSuccessToast, showToast } from 'vant';
import { preferEmailHint, wantsEmailChannel } from '@/modules/client/utils/verificationChannel';
import { register as sendRegisterCode, registerByEmailPhone } from '@/modules/client/api/login';
import { trackCompleteRegistration } from '@/modules/client/utils/metaPixel';
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
    label: item.value,
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
    const result = await sendRegisterCode({
      phone: buildFullPhone(form.countryCode, form.phone),
      email: form.email.trim() || undefined,
    });
    const guidance = preferEmailHint(result, String(locale.value))
      || (wantsEmailChannel(result) ? t('client.login.register.preferEmail') : '');
    if (guidance) {
      showToast({ message: guidance, duration: 4500 });
    } else {
      showSuccessToast(t('client.login.register.codeSent'));
    }
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
    trackCompleteRegistration();
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
@use '../../client/style/auth';
</style>
