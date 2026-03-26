<template>
  <div class="h5-profile-security-page">
    <header class="h5-profile-security-topbar">
      <button class="h5-profile-security-topbar__btn" type="button" @click="router.back()">
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ t('client.profile.title') }}</h1>
      <span class="h5-profile-security-topbar__placeholder"></span>
    </header>

    <main class="h5-profile-security-main">
      <section class="h5-profile-security-card">
        <p>{{ t('client.profile.subtitle') }}</p>
        <form class="h5-profile-security-form" @submit.prevent="submitResetPassword">
          <label class="h5-profile-security-field">
            <span>{{ t('client.profile.form.currentPassword') }}</span>
            <input
              v-model="form.currentPassword"
              type="password"
              autocomplete="current-password"
              :placeholder="t('client.profile.form.currentPasswordPlaceholder')"
            />
          </label>

          <label class="h5-profile-security-field">
            <span>{{ t('client.profile.form.newPassword') }}</span>
            <input
              v-model="form.newPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="t('client.profile.form.newPasswordPlaceholder')"
            />
          </label>

          <label class="h5-profile-security-field">
            <span>{{ t('client.profile.form.confirmPassword') }}</span>
            <input
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="t('client.profile.form.confirmPasswordPlaceholder')"
            />
          </label>

          <button class="h5-profile-security-submit" type="submit" :disabled="submitting">
            {{ submitting ? t('client.profile.actions.submitting') : t('client.profile.actions.confirm') }}
          </button>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { changePasswordByOld } from '@/modules/client/api/login';
import { useAuth } from '@/modules/h5/composables/useAuth';
import { getStoredAuthSnapshot } from '@/utils/auth-state';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();
const { clearAuth } = useAuth();

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const submitting = ref(false);

const validateForm = () => {
  if (!form.currentPassword.trim()) {
    showFailToast(t('client.profile.validation.currentPasswordRequired'));
    return false;
  }
  if (!form.newPassword.trim()) {
    showFailToast(t('client.profile.validation.newPasswordRequired'));
    return false;
  }
  if (form.newPassword.length < 6) {
    showFailToast(t('client.profile.validation.newPasswordMin'));
    return false;
  }
  if (!form.confirmPassword.trim()) {
    showFailToast(t('client.profile.validation.confirmPasswordRequired'));
    return false;
  }
  if (form.newPassword !== form.confirmPassword) {
    showFailToast(t('client.profile.validation.passwordMismatch'));
    return false;
  }
  return true;
};

const ensureLogin = async () => {
  if (getStoredAuthSnapshot().isLoggedIn) {
    return;
  }
  await router.replace({
    name: 'h5-login',
    query: { redirect: route.fullPath },
  });
};

const submitResetPassword = async () => {
  if (!validateForm()) return;
  const account = localStorage.getItem('account')?.trim() || localStorage.getItem('username')?.trim() || '';
  if (!account) {
    showFailToast(t('client.profile.message.accountMissing'));
    await router.replace({ name: 'h5-login' });
    return;
  }
  submitting.value = true;
  try {
    await changePasswordByOld({
      account,
      oldPassword: form.currentPassword.trim(),
      newPassword: form.newPassword.trim(),
    });
    showSuccessToast(t('client.profile.message.updateSuccess'));
    clearAuth();
    await router.replace({ name: 'h5-login' });
  } catch (error: any) {
    showFailToast(error?.message || t('client.profile.message.updateFailed'));
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  void ensureLogin();
});
</script>

<style scoped lang="scss">
.h5-profile-security-page {
  min-height: 100vh;
  background: #f8fafc;
}

.h5-profile-security-topbar {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #f3f4f6;
}

.h5-profile-security-topbar__btn,
.h5-profile-security-topbar__placeholder {
  width: 32px;
}

.h5-profile-security-topbar__btn {
  border: 0;
  background: transparent;
  color: #0f172a;
  font-size: 18px;
  padding: 0;
}

.h5-profile-security-topbar h1 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
}

.h5-profile-security-main {
  max-width: 393px;
  margin: 0 auto;
  padding: 16px;
}

.h5-profile-security-card {
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
  padding: 20px 16px;
}

.h5-profile-security-card > p {
  margin: 0;
  color: rgba(15, 23, 42, 0.55);
  font-size: 13px;
  line-height: 1.6;
}

.h5-profile-security-form {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.h5-profile-security-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-profile-security-field span {
  color: rgba(15, 23, 42, 0.9);
  font-size: 13px;
  font-weight: 700;
}

.h5-profile-security-field input {
  width: 100%;
  min-height: 48px;
  border: 1px solid #dbe3ee;
  border-radius: 14px;
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  padding: 0 14px;
  box-sizing: border-box;
  outline: none;
}

.h5-profile-security-submit {
  margin-top: 6px;
  min-height: 50px;
  border: 0;
  border-radius: 16px;
  background: #3972f5;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

.h5-profile-security-submit:disabled {
  opacity: 0.7;
}
</style>
