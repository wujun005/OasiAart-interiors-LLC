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
          <h2>{{ t('client.login.password.title') }}</h2>
          <p>
            {{ t('client.login.password.noAccount') }}
            <button type="button" class="link-btn" @click="goRegister">
              {{ t('client.login.password.goRegister') }}
            </button>
          </p>
        </header>

        <form class="auth-form" @submit.prevent="submitLogin">
          <label class="form-item">
            <span>{{ t('client.login.password.accountLabel') }}</span>
            <div class="form-item__control">
              <img :src="assetAccount" alt="" />
              <input
                v-model.trim="form.account"
                type="text"
                autocomplete="username"
                :placeholder="t('client.login.password.accountPlaceholder')"
              />
            </div>
          </label>

          <label class="form-item">
            <span>{{ t('client.login.password.passwordLabel') }}</span>
            <div class="form-item__control">
              <img :src="assetPassword" alt="" />
              <input
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                :placeholder="t('client.login.password.passwordPlaceholder')"
              />
            </div>
          </label>

          <div class="auth-form__helper">
            <button type="button" class="link-btn link-btn--helper" @click="loginWithVerifyCode">
              {{ t('client.login.password.forgotByCode') }}
            </button>
          </div>

          <button class="submit-btn" type="submit" :disabled="submitting">
            {{ submitting ? t('client.login.password.submitting') : t('client.login.password.submit') }}
          </button>
        </form>

        <p class="agreement">
          {{ t('client.login.password.agreementPrefix') }}
          <a href="javascript:void(0)">{{ t('client.login.password.terms') }}</a>
          {{ t('client.login.password.agreementAnd') }}
          <a href="javascript:void(0)">{{ t('client.login.password.privacy') }}</a>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  login as loginByPassword,
  loginByVerifyCode,
  sendCode,
} from '@/modules/client/api/login';
import { setClientLocale, type ClientLocale } from '@/modules/client/locales';

const assetLogo = 'https://www.figma.com/api/mcp/asset/c86fdc20-0cd0-4496-8ff1-4775b50855ee';
const assetFeature1 = 'https://www.figma.com/api/mcp/asset/ef75fc3a-3d62-4db2-a1cd-9ee8a181b227';
const assetFeature2 = 'https://www.figma.com/api/mcp/asset/40985476-5fe7-4bab-bcc7-d4faef415060';
const assetFeature3 = 'https://www.figma.com/api/mcp/asset/743d31dc-3585-491d-ab1e-1e9ef5756564';
const assetAccount = 'https://www.figma.com/api/mcp/asset/4b012541-9ead-451b-a153-922f45572485';
const assetPassword = 'https://www.figma.com/api/mcp/asset/58e9c021-fdf9-42ac-ad10-41c77d01d7f7';
const assetLocale = 'https://www.figma.com/api/mcp/asset/64934f0d-f62b-4bc7-882c-713ff6cf293e';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const form = reactive({
  account: '',
  password: '',
});
const submitting = ref(false);

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

const submitLogin = async () => {
  if (!validatePasswordLogin()) return;
  submitting.value = true;
  const accountValue = form.account.trim();
  try {
    const result = await loginByPassword({
      account: accountValue,
      username: accountValue,
      emailOrPhone: accountValue,
      password: form.password,
    });
    if (!saveClientToken(result)) {
      throw new Error(t('client.login.password.failed'));
    }
    ElMessage.success(t('client.login.password.success'));
    router.push('/');
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.login.password.failed'));
  } finally {
    submitting.value = false;
  }
};

const loginWithVerifyCode = async () => {
  const accountValue = form.account.trim();
  if (!accountValue) {
    ElMessage.warning(t('client.login.password.accountRequired'));
    return;
  }
  try {
    await sendCode({
      account: accountValue,
      emailOrPhone: accountValue,
    });
    ElMessage.success(t('client.login.password.codeSent'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.login.password.codeSendFailed'));
    return;
  }

  try {
    const { value } = await ElMessageBox.prompt(
      t('client.login.password.codeInputMessage'),
      t('client.login.password.codeInputTitle'),
      {
        confirmButtonText: t('client.login.password.codeLoginConfirm'),
        cancelButtonText: t('client.login.password.codeLoginCancel'),
        inputPlaceholder: t('client.login.password.codeInputPlaceholder'),
        inputPattern: /^\d{4,8}$/,
        inputErrorMessage: t('client.login.password.codeInvalid'),
      },
    );
    const codeValue = String(value || '').trim();
    if (!codeValue) {
      ElMessage.warning(t('client.login.password.codeRequired'));
      return;
    }
    const result = await loginByVerifyCode({
      account: accountValue,
      emailOrPhone: accountValue,
      code: codeValue,
      verifyCode: codeValue,
    });
    if (!saveClientToken(result)) {
      throw new Error(t('client.login.password.codeLoginFailed'));
    }
    ElMessage.success(t('client.login.password.codeLoginSuccess'));
    router.push('/');
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.message === 'cancel') return;
    ElMessage.error(error?.message || t('client.login.password.codeLoginFailed'));
  }
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

.auth-page__left {
  width: min(367px, 34vw);
  min-width: 300px;
  padding: 48px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #6faad0 0%, #3972f5 58%, #6597f0 100%);
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
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #fff;
}

.auth-page__left-content {
  margin-top: 220px;
}

.auth-page__headline {
  margin: 0;
  font-size: 58px;
  line-height: 1.25;
  font-weight: 800;
  color: #fff;
}

.auth-page__slogan {
  margin: 64px 0 0;
  font-size: 28px;
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
  font-size: 30px;
  line-height: 1.25;
}

.auth-feature-card__item span {
  display: block;
  margin-top: 4px;
  font-size: 20px;
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

.auth-form__helper {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.link-btn {
  border: 0;
  padding: 0;
  background: transparent;
  color: #3972f5;
  font-size: 16px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.link-btn--helper {
  font-size: 14px;
  text-decoration: none;
}

.submit-btn {
  width: 100%;
  height: 60px;
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
  .auth-brand__name {
    font-size: 34px;
  }

  .auth-page__headline {
    font-size: 50px;
  }

  .auth-page__slogan {
    font-size: 26px;
  }

  .auth-feature-card__item strong {
    font-size: 26px;
  }

  .auth-feature-card__item span {
    font-size: 17px;
  }

  .auth-form-wrap__header p,
  .link-btn {
    font-size: 16px;
  }

  .link-btn--helper {
    font-size: 13px;
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
    font-size: 36px;
  }

  .auth-page__slogan {
    margin-top: 24px;
    font-size: 22px;
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
}
</style>
