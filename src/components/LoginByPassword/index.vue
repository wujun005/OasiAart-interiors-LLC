<template>
  <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item :label="t('admin.login.accountLabel')" label-position="top" style="margin-bottom: 30px">
      <el-input v-model="form.account" :placeholder="t('admin.login.accountPlaceholder')" />
    </el-form-item>

    <div class="forgot-password" @click="goResetPassword">{{ t('admin.login.forgotPassword') }}</div>

    <el-form-item :label="t('admin.login.passwordLabel')" label-position="top">
      <el-input v-model="form.password" :placeholder="t('admin.login.passwordPlaceholder')" type="password" show-password />
    </el-form-item>

    <el-form-item>
      <div class="btn" @click="loginByPassword">{{ t('admin.login.submit') }}</div>
    </el-form-item>

    <el-form-item>
      <div class="register" @click="goRegister">
        {{ t('admin.login.noAccount') }}<span class="register-text">{{ t('admin.login.registerNow') }}</span>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

const form = ref({
  account: '',
  password: '',
});

const emit = defineEmits<{
  (e: 'go-register'): void;
  (e: 'go-reset-password'): void;
  (e: 'login'): void;
}>();

const loginByPassword = () => {
  const account = form.value.account.trim();
  const password = form.value.password.trim();

  if (!account) return ElMessage.warning(t('admin.login.accountRequired'));
  if (!password) return ElMessage.warning(t('admin.login.passwordRequired'));

  emit('login', { account, password });
};

const goRegister = () => {
  emit('go-register');
};

const goResetPassword = () => {
  emit('go-reset-password');
};
</script>

<style scoped>
.auth-page-right-form {
  width: 552px;
  margin-top: 40px;
  position: relative;

  .btn {
    width: 552px;
    height: 56px;
    background: #796f51;
    border-radius: 6px;
    font-weight: 400;
    font-size: 18px;
    color: #ffffff;
    letter-spacing: 0;
    text-align: center;
    line-height: 56px;
    cursor: pointer;
  }

  .register {
    color: #00000080;
    font-size: 18px;
    font-face: PingFangSC;
    font-weight: 400;
    line-height: 0;
    letter-spacing: 0;
    text-align: right;
    width: 100%;
    cursor: pointer;
    margin-top: 15px;
    .register-text {
      color: #000000;
    }
  }

  .forgot-password {
    min-width: 90px;
    height: 25px;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 18px;
    color: #796f51;
    letter-spacing: 0;
    text-align: right;
    position: absolute;
    top: 110px;
    right: 5px;
    cursor: pointer;
  }

  /* 新增：验证码输入行 */
  .code-row {
    width: 552px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .code-btn {
    min-width: 140px;
    height: 56px;
    border-radius: 6px;
    border: 1px solid #796f51;
    color: #796f51;
    font-size: 16px;
    line-height: 56px;
    text-align: center;
    cursor: pointer;
    user-select: none;
    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
