<template>
  <div class="auth-page">
    <div class="auth-page-left">
      <img
        src="https://img0.baidu.com/it/u=36026366,1309004716&fm=253&app=138&f=JPEG?w=800&h=1421"
        alt=""
      />
    </div>

    <div class="auth-page-right">
      <div class="auth-page-right-title">
        {{ $t('message.account_login_c') }}
      </div>

      <div class="auth-page-right-form">
        <LoginByPassword @login="debouncedLoginByPassword" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import LoginByPassword from '@/components/LoginByPassword/index.vue';
import { login } from '@/modules/admin/api';
import { ElMessage } from 'element-plus';
import router from '@/modules/admin/router';
import axios from 'axios';
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
const debouncedLoginByPassword = debounceLeading((...args) => {
  console.log('debouncedLoginByPassword', args);
  loginByPassword(...args);
}, 800);

const loginByPassword = async ({
  account,
  password,
}: {
  account: string;
  password: string;
}) => {
  if (!account) return ElMessage.warning('请输入账号');
  if (!password) return ElMessage.warning('请输入密码');

  try {
    const result = await login({ account, password, rememberMe: true });
    console.log('登录成功', result);
    const data = result?.data;
    if (!data?.token) throw new Error('登录失败');

    const {
      token,
      tokenType = 'Bearer',
      expiresIn,
      userId,
      username,
      userType,
    } = data;

    localStorage.setItem('token', token);
    if (userId !== undefined) localStorage.setItem('userId', String(userId));
    if (username) localStorage.setItem('username', username);
    if (userType) localStorage.setItem('userType', userType);

    if (expiresIn) {
      const expiresAt = Date.now() + Number(expiresIn);
      localStorage.setItem('expiresAt', String(expiresAt));
    }

    axios.defaults.headers.common.Authorization = `${tokenType} ${token}`;
    ElMessage.success(result?.message || '登录成功');
    router.push('/admin');
  } catch (e) {
    console.error(e);
    ElMessage.error('登录失败，请检查账号或密码');
  }
};
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
