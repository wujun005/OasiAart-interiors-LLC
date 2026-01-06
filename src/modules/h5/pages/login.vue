<template>
  <div class="login-page">
    <div class="page-tabbar">
      <img class="logo" src="@/assets/images/logo2.png" alt="" />
      <LanguageSwitch />
    </div>
    <div v-if="status !== 'login'" class="back-btn" @click="backToLogin">
      <van-icon name="arrow-left" />返回
    </div>
    <div class="page-title">{{ pageTitle }}</div>
    <template v-if="status === 'login'">
      <div class="login-tab">
        <div
          class="tab-item"
          @click="activeTab = 'psd'"
          :class="{ active: activeTab === 'psd' }"
        >
          账号密码登录
        </div>
        <div
          class="tab-item"
          @click="activeTab = 'phone'"
          :class="{ active: activeTab === 'phone' }"
        >
          手机快速登录
        </div>
      </div>
      <van-form @submit.prevent="onSubmit">
        <van-cell-group inset>
          <template v-if="activeTab === 'psd'">
            <van-field
              v-model="pwdForm.account"
              name="用户名"
              label-align="top"
              label="用户名"
              placeholder="请输入用户名"
              :rules="[{ required: true, message: '请填写用户名' }]"
            />
            <div class="forg-password" @click="goReset">忘记密码?</div>
            <van-field
              v-model="pwdForm.password"
              type="password"
              label-align="top"
              name="密码"
              label="密码"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请填写密码' }]"
            />
          </template>
          <template v-else>
            <van-field
              v-model="smsForm.account"
              name="手机号"
              label-align="top"
              label="手机号"
              placeholder="请输入手机号"
              maxlength="11"
              :rules="[{ required: true, message: '请填写手机号' }]"
            />
            <van-field
              v-model="smsForm.code"
              type="number"
              name="验证码"
              label="验证码"
              label-align="top"
              maxlength="6"
              placeholder="请输入验证码"
              :rules="[{ required: true, message: '请填写验证码' }]"
            >
              <template #button>
                <div
                  class="code-btn"
                  :class="{ disabled: codeCountdown > 0 || isSendingCode }"
                  @click.stop="sendCode()"
                >
                  {{ codeBtnText }}
                </div>
              </template>
            </van-field>
          </template>
        </van-cell-group>
        <div class="btns">
          <div class="btn" @click="onSubmit">登录</div>
        </div>
        <div v-if="activeTab === 'psd'" class="register" @click="goRegister">
          没有账号，<span class="register-text">立即注册</span>
        </div>
      </van-form>
    </template>
    <template v-else>
      <van-form @submit.prevent="onSubmitRegister">
        <van-cell-group inset>
          <van-field
            v-model="resetForm.phone"
            name="手机号"
            label-align="top"
            label="手机号"
            placeholder="请输入手机号"
            maxlength="11"
            :rules="[{ required: true, message: '请填写手机号' }]"
          />
          <van-field
            v-model="resetForm.verifyCode"
            type="number"
            name="验证码"
            label="验证码"
            label-align="top"
            maxlength="6"
            placeholder="请输入验证码"
            :rules="[{ required: true, message: '请填写验证码' }]"
          >
            <template #button>
              <div
                class="code-btn"
                :class="{ disabled: codeCountdown > 0 || isSendingCode }"
                @click.stop="sendCode(resetForm.phone)"
              >
                {{ codeBtnText }}
              </div>
            </template>
          </van-field>
          <van-field
            v-model="resetForm.password"
            type="password"
            name="密码"
            label="密码"
            label-align="top"
            placeholder="请输入登录新密码，长度为6-12位"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
          <van-field
            v-model="resetForm.confirmPassword"
            type="password"
            name="确认密码"
            label="确认密码"
            label-align="top"
            placeholder="请确认登录新密码"
            :rules="[{ required: true, message: '请再次输入密码' }]"
          />
        </van-cell-group>
        <div class="btns">
          <div class="btn" @click="onSubmitRegister">
            {{ status === 'register' ? '注册' : '提交' }}
          </div>
        </div>
        <div class="register" @click="backToLogin">
          已有账号，<span class="register-text">立即登录</span>
        </div>
      </van-form>
    </template>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { reactive, ref, computed, onBeforeUnmount } from 'vue';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { login, register, sendSmsCode } from '@/modules/client/api';
import LanguageSwitch from '../components/language-switch/index.vue';

const router = useRouter();
const { locale, messages } = useI18n();
const text = computed(() => (messages.value as any)[locale.value].auth);

const status = ref<'login' | 'register' | 'reset'>('login');
const activeTab = ref<'psd' | 'phone'>('psd');

const pwdForm = reactive({
  account: '',
  password: '',
});

const smsForm = reactive({
  account: '',
  code: '',
});

const resetForm = reactive({
  phone: '',
  verifyCode: '',
  password: '',
  confirmPassword: '',
});

const pageTitle = computed(() => {
  if (status.value === 'register') return '注册账户';
  if (status.value === 'reset') return '重置密码';
  return '账户登录';
});

const isSendingCode = ref(false);
const codeCountdown = ref(0);
let countdownTimer: number | null = null;
const codeBtnText = computed(() => {
  if (isSendingCode.value) return '发送中...';
  if (codeCountdown.value > 0) return `${codeCountdown.value}s后重试`;
  return text.value.sendCode || '获取验证码';
});

const isValidCNPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone.trim());

const startCountdown = (sec = 60) => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
  codeCountdown.value = sec;
  countdownTimer = window.setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      codeCountdown.value = 0;
      if (countdownTimer) {
        window.clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  }, 1000);
};

const sendCode = async (phone?: string) => {
  if (isSendingCode.value || codeCountdown.value > 0) return;
  const mobile = (phone || smsForm.account || '').trim();
  if (!isValidCNPhone(mobile)) {
    showToast('请输入正确的手机号');
    return;
  }
  try {
    isSendingCode.value = true;
    await sendSmsCode({ phone: mobile });
    showToast(text.value.toast.sent);
    startCountdown(60);
  } catch (e) {
    console.error(e);
    showToast('验证码发送失败，请稍后重试');
  } finally {
    isSendingCode.value = false;
  }
};

const handleLoginSuccess = (response: any) => {
  const data = response?.data || response || {};
  const { token, userId, username, userType, expiresIn } = data;

  if (token) {
    localStorage.setItem('token', token);
    axios.defaults.headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId !== undefined) localStorage.setItem('userId', String(userId));
  if (username) localStorage.setItem('username', username);
  if (userType) localStorage.setItem('userType', userType);
  if (expiresIn) {
    const expiresAt = Date.now() + expiresIn;
    localStorage.setItem('expiresAt', expiresAt.toString());
  }

  window.dispatchEvent(new Event('storage'));
  showToast(text.value.toast.success);
  router.replace('/');
};

const loginByPassword = async () => {
  const account = pwdForm.account.trim();
  const password = pwdForm.password.trim();
  if (!account) return showToast('请输入账号');
  if (!password) return showToast('请输入密码');
  try {
    const result = await login({ account, password, rememberMe: true });
    handleLoginSuccess(result);
  } catch (e) {
    console.error(e);
    showToast('登录失败，请检查账号或密码');
  }
};

const loginBySms = async () => {
  const account = smsForm.account.trim();
  const code = smsForm.code.trim();
  if (!isValidCNPhone(account)) return showToast('请输入正确的手机号');
  if (!code || code.length < 4) return showToast('请输入正确的验证码');

  try {
    const result = await login({ account, password: code });
    handleLoginSuccess(result);
  } catch (e) {
    console.error(e);
    showToast('登录失败，请检查验证码');
  }
};

const onSubmit = () => {
  if (activeTab.value === 'psd') {
    loginByPassword();
  } else {
    loginBySms();
  }
};

const onSubmitRegister = async () => {
  const phone = resetForm.phone.trim();
  const verifyCode = resetForm.verifyCode.trim();
  const password = resetForm.password.trim();
  const confirmPassword = resetForm.confirmPassword.trim();

  if (!isValidCNPhone(phone)) return showToast('请输入正确的手机号');
  if (!verifyCode || verifyCode.length < 4)
    return showToast('请输入正确的验证码');
  if (password.length < 6 || password.length > 12)
    return showToast('密码长度需为6-12位');
  if (password !== confirmPassword) return showToast('两次输入的密码不一致');

  try {
    await register({
      phone,
      verifyCode,
      password,
      name: 'join',
      email: '768481551@qq.com',
    });
    showToast(status.value === 'register' ? '注册成功' : '密码重置成功');
    status.value = 'login';
  } catch (e) {
    console.error(e);
    showToast('提交失败，请稍后重试');
  }
};

const goRegister = () => {
  status.value = 'register';
};

const goReset = () => {
  status.value = 'reset';
};

const backToLogin = () => {
  status.value = 'login';
};

onBeforeUnmount(() => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style scoped lang="scss">
.login-page {
  padding: 20px;
}

.login-card {
  margin-top: 8px;
}

.login-title {
  margin-bottom: 12px;
}

.login-title h2 {
  margin: 0;
  font-size: 20px;
}

.login-title p {
  margin: 4px 0 0;
  color: #666;
}
.page-tabbar {
  display: flex;
  align-items: center;
  .logo {
    width: 130px;
    height: 17px;
  }
}
.page-title {
  font-weight: 500;
  font-size: 30px;
  color: #000000;
  letter-spacing: 0;
  margin-top: 29px;
}
.login-tab {
  height: 40px;
  font-family: PingFangSC-Regular;
  font-weight: 400;
  font-size: 14px;
  color: #796f51;
  display: flex;
  .tab-item {
    height: 32px;
    line-height: 32px;
    margin-right: 20px;
    &.active {
      border-bottom: 1px solid #796f51;
    }
  }
}
.btns {
  margin-top: 20px;
  .btn {
    width: 100%;
    height: 46px;
    background: #796f51;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
    color: #ffffff;
    line-height: 46px;
    text-align: center;
  }
}
:deep .van-cell {
  background: transparent;
  padding: 10px 0;
}
:deep .van-cell-group {
  background: transparent;
}
:deep .van-cell-group--inset {
  margin: 0;
}
:deep .van-field__label {
  font-family: PingFangSC-Medium;
  font-weight: 500;
  font-size: 14px;
  color: #000000;
}
:deep .van-field__body {
  width: 100%;
  height: 46px;
  background: #ffffff;
  border: 1px solid #00000040;
  border-radius: 4px;
  padding: 10px;
}
:deep .van-field__button {
  padding-left: 12px;
}
.back-btn {
  font-size: 14px;
  color: #796f51;
  margin-top: 16px;
  cursor: pointer;
  width: fit-content;
  font-weight: 500;
  font-size: 14px;
  color: #000000;
}
.code-btn {
  min-width: 90px;
  height: 28px;
  border: 1px solid #796f51;
  color: #796f51;
  font-size: 12px;
  border-radius: 4px;
  line-height: 28px;
  text-align: center;
  padding: 0 8px;
  cursor: pointer;
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
.forg-password {
  height: 20px;
  font-family: PingFangSC-Regular;
  font-weight: 400;
  font-size: 14px;
  color: #796f51;
  letter-spacing: 0;
  text-align: right;
}
.register {
  color: #00000080;
  font-size: 14px;
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
</style>
