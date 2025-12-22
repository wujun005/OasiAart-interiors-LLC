<template>
  <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item label="账号" label-position="top" style="margin-bottom: 30px">
      <el-input v-model="form.account" />
    </el-form-item>

    <div class="forgot-password" @click="goResetPassword">忘记密码?</div>

    <el-form-item label="密码" label-position="top">
      <el-input v-model="form.password" type="password" show-password />
    </el-form-item>

    <el-form-item>
      <div class="btn" @click="loginByPassword">登录</div>
    </el-form-item>

    <el-form-item>
      <div class="register" @click="goRegister">
        没有账号，<span class="register-text">立即注册</span>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

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

  if (!account) return ElMessage.warning('请输入账号');
  if (!password) return ElMessage.warning('请输入密码');

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
