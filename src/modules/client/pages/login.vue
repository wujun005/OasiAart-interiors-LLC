<template>
  <div class="auth-page">
    <div class="auth-page-left">
      <img
        src="https://img0.baidu.com/it/u=36026366,1309004716&fm=253&app=138&f=JPEG?w=800&h=1421"
        alt=""
      />
    </div>

    <div class="auth-page-right">
      <div class="language" @click="switchLanguage">
        <img src="../../../assets/images/language.png" alt="" />
      </div>

      <div class="languages" v-if="isShowLanguage">
        <div
          @click="changeLanguage('en')"
          class="language-item"
          style="border-bottom: 1px solid #0000000f"
        >
          English
        </div>
        <div @click="changeLanguage('zh')" class="language-item">中文</div>
      </div>

      <div class="auth-page-right-title" v-if="status === 'login'">
        {{ $t('message.account_login_c') }}
      </div>

      <div v-if="status === 'login'" class="auth-page-right-tab">
        <div
          class="auth-page-right-tab-item"
          :class="{ active: active === '0' }"
          @click="active = '0'"
        >
          账号密码登录
        </div>
        <div
          class="auth-page-right-tab-item"
          :class="{ active: active === '1' }"
          @click="active = '1'"
        >
          手机快速登录
        </div>
      </div>

      <div class="auth-page-right-form" v-if="status === 'login'">
        <LoginByPassword
          v-if="active === '0'"
          @login="debouncedLoginByPassword"
          @go-register="status = 'register'"
          @go-reset-password="status = 'reset'"
        />
        <LoginBySms v-else @login="debouncedLoginBySms" />
      </div>
      <div v-else :mode="status" class="auth-page-right-form">
        <ResetPasswordForm
          @back="status = 'login'"
          @success="status = 'login'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { login, sendSmsCode } from '@/modules/client/api';
import ResetPasswordForm from '@/modules/client/components/ResetPasswordForm/index.vue';
import { useI18n } from 'vue-i18n';
import { loginSuccess } from '@/modules/client/utils';
import LoginByPassword from '@/modules/client/components/LoginByPassword/index.vue';
import LoginBySms from '@/modules/client/components/LoginBySms/index.vue';

const { locale } = useI18n();
async function smsLoginApi(payload: { account: string; password: string }) {
  // return smsLogin(payload)
  return login(payload);
}

const active = ref<'0' | '1'>('0');
const isShowLanguage = ref(false);

const pwdForm = ref({
  account: '',
  password: '',
});

const smsForm = ref({
  account: '',
  password: '',
});

const status = ref('login');

// 验证码倒计时
const isSendingCode = ref(false);
const codeCountdown = ref(0);
let countdownTimer: number | null = null;

const switchLanguage = () => {
  isShowLanguage.value = !isShowLanguage.value;
};

const changeLanguage = (lang: string) => {
  switchLanguage();
  locale.value = lang;
};

const debounceLeading = <T extends (...args: any[]) => unknown>(
  fn: T,
  delay = 500
) => {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) return;
    fn(...args);
    timer = window.setTimeout(() => {
      timer = null;
    }, delay);
  };
};

// 简单手机号校验（中国大陆 11 位）
const isValidCNPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);

const startCountdown = (sec = 60) => {
  // 清理旧定时器
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

const loginByPassword = async ({ account, password }: { account: string; password: string }) => {

  if (!account) return ElMessage.warning('请输入账号');
  if (!password) return ElMessage.warning('请输入密码');

  try {
    const result = await login({ account, password, rememberMe: true });
    loginSuccess(result);
    // TODO: 登录成功后的跳转/存 token
  } catch (e) {
    console.error(e);
    ElMessage.error('登录失败，请检查账号或密码');
  }
};

const loginBySms = async ({ account, password }: { account: string; password: string }) => {
  console.log('loginBySms', status);

  if (!isValidCNPhone(account)) return ElMessage.warning('请输入正确的手机号');
  if (!password || password.length < 6) return ElMessage.warning('请输入正确的验证码');

  try {
    await smsLoginApi({ account, password: password });
    ElMessage.success('登录成功');
    // TODO: 登录成功后的跳转/存 token
  } catch (e) {
    console.error(e);
    ElMessage.error('登录失败，请检查验证码');
  }
};

const debouncedLoginByPassword = debounceLeading((...args) => {
  console.log('debouncedLoginByPassword', args);
  loginByPassword(...args);
}, 800);
const debouncedLoginBySms = debounceLeading((...args) => {
  loginBySms(...args);
}, 800);
// 重置密码
const goResetPassword = () => {
  status.value = 'reset';
};

onBeforeUnmount(() => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style scoped>
.auth-page {
  display: flex;
  padding: 30px;
  box-sizing: border-box;
  align-items: center;
  background: #fff;
  overflow: hidden;
  .auth-page-left {
    width: calc(50% - 30px);
    height: calc(100vh - 60px);
    img {
      width: 100%;
      height: 100%;
    }
  }
  .auth-page-right {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    .language {
      width: 24px;
      height: 24px;
      background: #d8d8d800;
      position: absolute;
      right: 30px;
      top: 30px;
      cursor: pointer;
      img {
        width: 19px;
        height: 19px;
      }
    }
    .languages {
      background: #0000000a;
      border: 1px solid #00000026;
      width: 207px;
      padding: 0px 20px;
      box-sizing: border-box;
      position: absolute;
      top: 52px;
      right: 35px;
      border-radius: 6px;
      .language-item {
        font-weight: 500;
        font-size: 16px;
        color: #000000;
        line-height: 40px;
        cursor: pointer;
        &:hover {
          /* background: #0000000a; */
          color: #999;
        }
      }
    }
    .auth-page-right-title {
      width: 120px;
      height: 42px;
      font-family: PingFangSC-Medium;
      font-weight: 500;
      font-size: 30px;
      color: #000000;
      letter-spacing: 0;
      text-align: center;
      margin-bottom: 60px;
    }
    .auth-page-right-tab {
      display: flex;
      width: 552px;
      .auth-page-right-tab-item {
        width: 109px;
        text-align: left;
        font-family: AlibabaPuHuiTi_3_75_SemiBold;
        font-weight: 600;
        font-size: 18px;
        color: #796f51;
        line-height: 46px;
        position: relative;
        margin-right: 40px;
        &.active {
          border-bottom: 2px solid #796f51;
        }
      }
    }
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
  }
}

/deep/ .el-form-item__label {
  font-size: 18px;
  color: #000000;
  font-weight: 500;
}
/deep/ .el-input {
  height: 56px;
}
/deep/ .el-input__inner {
  height: 50px;
  line-height: 50px;
  font-size: 20px;
}
</style>
