<template>
  <section class="profile-page">
    <div class="profile-container">
      <div class="profile-card">
        <h1>{{ t('client.profile.title') }}</h1>
        <p>{{ t('client.profile.subtitle') }}</p>

        <form class="profile-form" @submit.prevent="submitResetPassword">
          <label class="form-item">
            <span>{{ t('client.profile.form.currentPassword') }}</span>
            <input
              v-model="form.currentPassword"
              type="password"
              autocomplete="current-password"
              :placeholder="t('client.profile.form.currentPasswordPlaceholder')"
            />
          </label>

          <label class="form-item">
            <span>{{ t('client.profile.form.newPassword') }}</span>
            <input
              v-model="form.newPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="t('client.profile.form.newPasswordPlaceholder')"
            />
          </label>

          <label class="form-item">
            <span>{{ t('client.profile.form.confirmPassword') }}</span>
            <input
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="t('client.profile.form.confirmPasswordPlaceholder')"
            />
          </label>

          <button class="submit-btn" type="submit" :disabled="submitting">
            {{ submitting ? t('client.profile.actions.submitting') : t('client.profile.actions.confirm') }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { changePasswordByOld } from '@/modules/client/api/login';
import { useAuth } from '@/modules/client/composables/useAuth';
import { getStoredAuthSnapshot } from '@/utils/auth-state';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const { clearAuth } = useAuth();

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const submitting = ref(false);

const validateForm = () => {
  if (!form.currentPassword.trim()) {
    ElMessage.warning(t('client.profile.validation.currentPasswordRequired'));
    return false;
  }
  if (!form.newPassword.trim()) {
    ElMessage.warning(t('client.profile.validation.newPasswordRequired'));
    return false;
  }
  if (form.newPassword.length < 6) {
    ElMessage.warning(t('client.profile.validation.newPasswordMin'));
    return false;
  }
  if (!form.confirmPassword.trim()) {
    ElMessage.warning(t('client.profile.validation.confirmPasswordRequired'));
    return false;
  }
  if (form.newPassword !== form.confirmPassword) {
    ElMessage.warning(t('client.profile.validation.passwordMismatch'));
    return false;
  }
  return true;
};

const submitResetPassword = async () => {
  if (!validateForm()) return;
  const account =
    localStorage.getItem('account')?.trim()
    || localStorage.getItem('username')?.trim()
    || '';
  if (!account) {
    ElMessage.warning(t('client.profile.message.accountMissing'));
    router.replace('/login');
    return;
  }
  submitting.value = true;
  try {
    await changePasswordByOld({
      account,
      oldPassword: form.currentPassword.trim(),
      newPassword: form.newPassword.trim(),
    });
    ElMessage.success(t('client.profile.message.updateSuccess'));
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
    clearAuth();
    await router.replace('/login');
  } catch (error: any) {
    ElMessage.error(error?.message || t('client.profile.message.updateFailed'));
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  if (!getStoredAuthSnapshot().isLoggedIn) {
    ElMessage.warning(t('client.profile.message.loginRequired'));
    router.replace('/login');
  }
});
</script>

<style scoped lang="scss">
.profile-page {
  min-height: calc(100vh - 168px);
  background: #f8fafc;
  padding: 36px 24px 64px;
}

.profile-container {
  max-width: 980px;
  margin: 0 auto;
}

.profile-card {
  width: min(560px, 100%);
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.06),
    0 2px 4px rgba(15, 23, 42, 0.05);
}

.profile-card h1 {
  margin: 0;
  color: rgba(15, 23, 42, 0.92);
  font-size: 28px;
  font-weight: 800;
}

.profile-card > p {
  margin: 10px 0 0;
  color: rgba(15, 23, 42, 0.55);
  font-size: 14px;
  line-height: 1.5;
}

.profile-form {
  margin-top: 24px;
}

.form-item {
  display: block;
}

.form-item + .form-item {
  margin-top: 14px;
}

.form-item > span {
  display: block;
  margin-bottom: 6px;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  font-weight: 700;
}

.form-item > input {
  width: 100%;
  height: 48px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.9);
  font-size: 15px;
  padding: 0 12px;
  box-sizing: border-box;
  outline: none;
}

.form-item > input:focus {
  border-color: #3972f5;
  box-shadow: 0 0 0 2px rgba(57, 114, 245, 0.15);
}

.submit-btn {
  margin-top: 20px;
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 12px;
  background: #3972f5;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
