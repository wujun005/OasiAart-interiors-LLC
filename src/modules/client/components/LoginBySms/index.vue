<template>
  <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item
      label="手机号"
      label-position="top"
      style="margin-bottom: 30px"
    >
      <el-input
        v-model="form.account"
        maxlength="11"
        placeholder="请输入手机号"
      />
    </el-form-item>

    <el-form-item label="验证码" label-position="top">
      <div class="code-row">
        <el-input
          v-model="form.password"
          maxlength="6"
          placeholder="请输入验证码"
        />
        <div
          class="code-btn"
          :class="{ disabled: codeCountdown > 0 || isSendingCode }"
          @click="sendCode"
        >
          {{ codeBtnText }}
        </div>
      </div>
    </el-form-item>

    <el-form-item>
      <div class="btn" @click="loginBySms">登录</div>
    </el-form-item>

    <el-form-item>
      <div class="register" @click="goRegister">
        没有账号，<span class="register-text">立即注册</span>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const form = ref({
  account: '',
  password: '',
});

const codeCountdown = ref(0);
const isSendingCode = ref(false);

const codeBtnText = computed(() => {
  if (isSendingCode.value) return '发送中...';
  if (codeCountdown.value > 0) return `${codeCountdown.value}s后重试`;
  return '获取验证码';
});

const emit = defineEmits<{
  (e: 'go-register'): void;
  (e: 'login'): void;
}>();

const isValidCNPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);

const sendCode = async () => {
  const phone = form.value.account.trim();
  if (!isValidCNPhone(phone)) {
    ElMessage.warning('请输入正确的手机号');
    return;
  }

  try {
    isSendingCode.value = true;
    // 调用验证码发送接口
    // await sendSmsCode({ phone });
    ElMessage.success('验证码已发送');
    startCountdown(60);
  } catch (e) {
    console.error(e);
    ElMessage.error('验证码发送失败，请稍后重试');
  } finally {
    isSendingCode.value = false;
  }
};

const startCountdown = (sec = 60) => {
  codeCountdown.value = sec;
  setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      codeCountdown.value = 0;
    }
  }, 1000);
};

const loginBySms = () => {
  const account = form.value.account.trim();
  const code = form.value.password.trim();

  if (!isValidCNPhone(account)) return ElMessage.warning('请输入正确的手机号');
  if (!code || code.length < 4) return ElMessage.warning('请输入正确的验证码');

  emit('login', { account, password: code });
};

const goRegister = () => {
  emit('go-register');
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
