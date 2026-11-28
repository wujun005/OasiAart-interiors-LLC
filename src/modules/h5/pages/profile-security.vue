<template>
  <div class="h5-profile-security-page">
    <header class="h5-profile-security-topbar">
      <button class="h5-profile-security-topbar__btn" type="button" :aria-label="t('h5.common.back')" @click="goBack">
        <van-icon name="arrow-left" aria-hidden="true" />
      </button>
      <h1>{{ t('client.profile.security.title') }}</h1>
      <span class="h5-profile-security-topbar__placeholder"></span>
    </header>

    <main class="h5-profile-security-main">
      <section class="h5-profile-security-card">
        <p>{{ t('client.profile.security.description') }}</p>
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
          <button
            class="h5-profile-security-forgot"
            type="button"
            @click="forgotPasswordVisible = true"
          >
            {{ t('client.profile.security.forgotPassword') }}
          </button>

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
            {{ submitting ? t('client.profile.actions.submitting') : t('client.profile.actions.submit') }}
          </button>
        </form>
      </section>
      <section class="h5-profile-security-card" style="margin-top: 20px">
        <h2>{{ t('client.accountDeletion.entry') }}</h2>
        <p>{{ t('client.accountDeletion.intro') }}</p>
        <RouterLink :to="{ name: 'h5-account-deletion' }">{{ t('client.accountDeletion.submit') }}</RouterLink>
      </section>
    </main>
    <ForgotPasswordDialog
      v-model="forgotPasswordVisible"
      :initial-account="forgotPasswordAccount"
      @success="handleForgotPasswordSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { changePasswordByOld } from '@/modules/client/api/login';
import { useAuth } from '@/modules/h5/composables/useAuth';
import {
  getClientAuthStorageValue,
  getStoredAuthSnapshot,
} from '@/utils/auth-state';
import ForgotPasswordDialog from '@/modules/client/components/ForgotPasswordDialog.vue';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();
const { clearAuth } = useAuth();

const goBack = () => {
  if (router.options.history.state.back) router.back();
  else router.push({ name: 'h5-profile' });
};

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const submitting = ref(false);
const forgotPasswordVisible = ref(false);
const forgotPasswordAccount = computed(() => {
  const snapshot = getStoredAuthSnapshot();
  return getClientAuthStorageValue('account')
    || getClientAuthStorageValue('username')
    || snapshot.userInfo.email
    || snapshot.userInfo.phone
    || '';
});

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
  const account = getClientAuthStorageValue('account') || getClientAuthStorageValue('username');
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

const handleForgotPasswordSuccess = async () => {
  showSuccessToast(t('client.profile.message.updateSuccess'));
  clearAuth();
  await router.replace({ name: 'h5-login' });
};

onMounted(() => {
  void ensureLogin();
});
</script>

<style scoped lang="scss">
.h5-profile-security-page {
  min-height: 100vh;
  background: var(--hourx-client-canvas);
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
  color: var(--hourx-client-text);
  font: 700 1.375rem/1.2 var(--hourx-client-heading-font);
}

.h5-profile-security-main {
  max-width: 393px;
  margin: 0 auto;
  padding: 16px;
}

.h5-profile-security-card {
  border: 1px solid var(--hourx-client-border);
  border-radius: 16px;
  background: #fff;
  padding: 20px 16px;
}

.h5-profile-security-card > p {
  margin: 0;
  color: var(--hourx-client-muted);
  font: 400 0.8125rem/1.55 var(--hourx-client-font-family);
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
  color: var(--hourx-client-text);
  font: 600 0.8125rem/1 var(--hourx-client-font-family);
}

.h5-profile-security-field input {
  width: 100%;
  min-height: 48px;
  border: 1px solid #dbe3ee;
  border-radius: 14px;
  background: #f8fafc;
  color: var(--hourx-client-text);
  font: 400 var(--hourx-client-size-body)/1.55 var(--hourx-client-font-family);
  padding: 0 14px;
  box-sizing: border-box;
  outline: none;
}

.h5-profile-security-submit {
  margin-top: 6px;
  min-height: 50px;
  border: 0;
  border-radius: 16px;
  background: var(--hourx-brand);
  color: #fff;
  font: 600 var(--hourx-client-size-action)/1 var(--hourx-client-font-family);
}

.h5-profile-security-submit:disabled {
  opacity: 0.7;
}

.h5-profile-security-forgot {
  align-self: flex-end;
  margin-top: -7px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--hourx-brand);
  font-size: 12px;
  font-weight: 800;
}
</style>
