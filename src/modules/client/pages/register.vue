<template>
  <div class="register-page">
    <aside class="register-page__left">
      <div class="register-brand">
        <img class="register-brand__logo" :src="assetLogo" alt="HourX Logo" />
        <span class="register-brand__name">{{ t('client.login.register.brand') }}</span>
      </div>

      <div class="register-page__left-content">
        <h1 class="register-page__headline">
          {{ t('client.login.register.heroLine1') }}<br />
          {{ t('client.login.register.heroLine2') }}
        </h1>
        <p class="register-page__slogan">{{ t('client.login.register.heroSlogan') }}</p>

        <div class="left-feature-card">
          <article v-for="item in leftFeatures" :key="item.key" class="left-feature-card__item">
            <img :src="item.icon" alt="" />
            <strong>{{ t(item.titleKey) }}</strong>
            <span>{{ t(item.descKey) }}</span>
          </article>
        </div>
      </div>
    </aside>

    <section class="register-page__right">
      <div class="register-page__tools">
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

      <div class="register-form-wrap">
        <header class="register-form-wrap__header">
          <h2>{{ t('client.login.register.title') }}</h2>
          <p>
            {{ t('client.login.register.hasAccount') }}
            <button type="button" class="link-btn" @click="goLogin">
              {{ t('client.login.register.goLogin') }}
            </button>
          </p>
        </header>

        <form class="register-form" @submit.prevent="submitRegister">
          <label class="form-item">
            <span>{{ t('client.login.register.phoneLabel') }}</span>
            <div class="form-item__control">
              <img :src="assetPhone" alt="" />
              <input
                v-model.trim="form.phone"
                type="text"
                autocomplete="tel"
                :placeholder="t('client.login.register.phonePlaceholder')"
              />
            </div>
          </label>

          <label class="form-item">
            <span>{{ t('client.login.register.emailLabel') }}</span>
            <div class="form-item__control">
              <img :src="assetEmail" alt="" />
              <input
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                :placeholder="t('client.login.register.emailPlaceholder')"
              />
            </div>
          </label>

          <label class="form-item">
            <span>{{ t('client.login.register.passwordLabel') }}</span>
            <div class="form-item__control">
              <img :src="assetPassword" alt="" />
              <input
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                :placeholder="t('client.login.register.passwordPlaceholder')"
              />
            </div>
          </label>

          <label class="form-item">
            <span>{{ t('client.login.register.codeLabel') }}</span>
            <div class="code-row">
              <div class="form-item__control form-item__control--code">
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
                class="code-btn"
                type="button"
                :disabled="sendingCode || codeCooldown > 0"
                @click="requestSmsCode"
              >
                {{ codeBtnText }}
              </button>
            </div>
          </label>

          <button class="submit-btn" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.register.submitting') : t('client.login.register.submit') }}
          </button>
        </form>

        <p class="agreement">
          {{ t('client.login.register.agreementPrefix') }}
          <a href="javascript:void(0)">{{ t('client.login.register.terms') }}</a>
          {{ t('client.login.register.agreementAnd') }}
          <a href="javascript:void(0)">{{ t('client.login.register.privacy') }}</a>
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

const assetLogo = 'https://www.figma.com/api/mcp/asset/d235cecd-85f7-44e5-b4f9-f5febd8109d6';
const assetFeature1 = 'https://www.figma.com/api/mcp/asset/5e2747a2-43b5-4f19-9e52-e4eec02e8be2';
const assetFeature2 = 'https://www.figma.com/api/mcp/asset/4322c8a0-0050-418f-930d-c14831bc0e6b';
const assetFeature3 = 'https://www.figma.com/api/mcp/asset/d8546882-75c7-4904-9203-1c3b4cadaaed';
const assetPhone = 'https://www.figma.com/api/mcp/asset/7e67a1ac-e671-487a-a146-deca82c26fa7';
const assetEmail = 'https://www.figma.com/api/mcp/asset/0549c4e7-0a74-49ea-9758-60067d97b13b';
const assetPassword = 'https://www.figma.com/api/mcp/asset/7ccc9429-cb1a-4964-ae96-135662d4671f';
const assetCode = 'https://www.figma.com/api/mcp/asset/5c38b0ee-8e8c-4241-bdab-7ae9a7ff5959';
const assetLocale = 'https://www.figma.com/api/mcp/asset/d0ab65a6-42bb-43d1-a9d2-ece0ee924d7c';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const form = reactive({
  phone: '',
  email: '',
  password: '',
  smsCode: '',
});

const sendingCode = ref(false);
const codeCooldown = ref(0);
const submitting = ref(false);
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
  const phone = form.phone.trim();
  if (!phone) {
    ElMessage.warning(t('client.login.register.phoneRequired'));
    return;
  }
  sendingCode.value = true;
  try {
    await sendRegisterCode({
      phone,
      email: form.email.trim() || undefined,
    });
    ElMessage.success(t('client.login.register.codeSent'));
    startCodeCountdown();
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.login.register.codeSendFailed'));
  } finally {
    sendingCode.value = false;
  }
};

const validateForm = () => {
  if (!form.phone.trim()) {
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
  if (!/^\d{6}$/.test(form.smsCode.trim())) {
    ElMessage.warning(t('client.login.register.codeInvalid'));
    return false;
  }
  return true;
};

const saveClientToken = (raw: any) => {
  const payload = raw?.data ?? raw ?? {};
  const token = payload?.token || payload?.accessToken;
  if (!token) {
    return false;
  }
  localStorage.setItem('token', String(token));
  if (payload?.tokenType) {
    localStorage.setItem('tokenType', String(payload.tokenType));
  }
  if (payload?.expiresIn !== undefined && payload?.expiresIn !== null) {
    const expiresAt = Date.now() + Number(payload.expiresIn);
    localStorage.setItem('expiresAt', String(expiresAt));
  }
  if (payload?.userId !== undefined && payload?.userId !== null) {
    localStorage.setItem('userId', String(payload.userId));
  }
  if (payload?.username) {
    localStorage.setItem('username', String(payload.username));
  }
  return true;
};

const submitRegister = async () => {
  if (!validateForm()) return;
  submitting.value = true;
  try {
    const payload = {
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
      code: form.smsCode.trim(),
      smsCode: form.smsCode.trim(),
      verifyCode: form.smsCode.trim(),
    };
    const result = await registerByEmailPhone(payload);
    if (!saveClientToken(result)) {
      throw new Error(t('client.login.register.failed'));
    }
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
.register-page {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

.register-page__left {
  width: min(367px, 34vw);
  min-width: 300px;
  padding: 48px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #6faad0 0%, #3972f5 58%, #6597f0 100%);
}

.register-page__left::before,
.register-page__left::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(186, 247, 233, 0.65);
  filter: blur(100px);
  z-index: 0;
}

.register-page__left::before {
  left: 90px;
  top: -228px;
}

.register-page__left::after {
  left: -280px;
  bottom: -228px;
}

.register-brand,
.register-page__left-content {
  position: relative;
  z-index: 1;
}

.register-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.register-brand__logo {
  width: 50px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
}

.register-brand__name {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #fff;
}

.register-page__left-content {
  margin-top: 220px;
}

.register-page__headline {
  margin: 0;
  font-size: 58px;
  line-height: 1.25;
  font-weight: 800;
  color: #fff;
}

.register-page__slogan {
  margin: 64px 0 0;
  font-size: 28px;
  line-height: 1.4;
  font-weight: 700;
  color: #fff;
}

.left-feature-card {
  margin-top: 64px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.left-feature-card__item {
  min-height: 122px;
  padding: 18px 10px 14px;
  text-align: center;
  color: #fff;
}

.left-feature-card__item + .left-feature-card__item {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.left-feature-card__item img {
  width: 26px;
  height: 26px;
}

.left-feature-card__item strong {
  display: block;
  margin-top: 10px;
  font-size: 30px;
  line-height: 1.25;
}

.left-feature-card__item span {
  display: block;
  margin-top: 4px;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.register-page__right {
  flex: 1;
  min-width: 0;
  position: relative;
  padding: 32px 48px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-page__tools {
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

.register-form-wrap {
  width: 100%;
  max-width: 448px;
}

.register-form-wrap__header h2 {
  margin: 0;
  font-size: 42px;
  line-height: 1.2;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.9);
}

.register-form-wrap__header p {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 500;
  color: rgba(15, 23, 42, 0.5);
}

.link-btn {
  margin-left: 4px;
  border: 0;
  padding: 0;
  background: transparent;
  color: #3972f5;
  font-size: 20px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.register-form {
  margin-top: 32px;
}

.form-item {
  display: block;
  margin-bottom: 16px;
}

.form-item > span {
  display: block;
  margin-bottom: 4px;
  font-size: 18px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}

.form-item__control {
  width: 100%;
  height: 50px;
  border: 1px solid #e2e8f0;
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

.form-item__control input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(15, 23, 42, 0.88);
  font-size: 16px;
}

.form-item__control input::placeholder {
  color: rgba(10, 10, 10, 0.5);
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
  background: #eff6ff;
  color: #3972f5;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.code-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  height: 60px;
  margin-top: 20px;
  border: 0;
  border-radius: 14px;
  background: #3972f5;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
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
  .register-brand__name {
    font-size: 34px;
  }

  .register-page__headline {
    font-size: 50px;
  }

  .register-page__slogan {
    font-size: 26px;
  }

  .left-feature-card__item strong {
    font-size: 26px;
  }

  .left-feature-card__item span {
    font-size: 17px;
  }

  .register-form-wrap__header h2 {
    font-size: 36px;
  }

  .register-form-wrap__header p,
  .link-btn,
  .form-item > span {
    font-size: 16px;
  }
}

@media (max-width: 1024px) {
  .register-page {
    flex-direction: column;
  }

  .register-page__left {
    width: 100%;
    min-width: 0;
    padding: 24px 20px 32px;
  }

  .register-brand__name {
    font-size: 28px;
  }

  .register-page__left-content {
    margin-top: 56px;
  }

  .register-page__headline {
    font-size: 36px;
  }

  .register-page__slogan {
    margin-top: 24px;
    font-size: 22px;
  }

  .left-feature-card {
    margin-top: 24px;
  }

  .left-feature-card__item strong {
    font-size: 24px;
  }

  .left-feature-card__item span {
    font-size: 15px;
  }

  .register-page__right {
    padding: 82px 16px 24px;
    align-items: flex-start;
  }

  .register-page__tools {
    top: 18px;
    left: 16px;
    right: 16px;
  }

  .register-form-wrap__header h2 {
    font-size: 30px;
  }
}

@media (max-width: 520px) {
  .left-feature-card__item strong {
    font-size: 18px;
  }

  .left-feature-card__item span {
    font-size: 12px;
  }

  .code-row {
    gap: 8px;
  }

  .code-btn {
    width: 96px;
  }
}
</style>
