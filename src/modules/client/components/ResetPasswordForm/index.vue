<template>
  <div class="reset-wrap">
    <div class="reset-back" @click="emit('back')">返回</div>

    <div class="reset-title">
      {{ mode === 'register' ? '注册账户' : '重置密码' }}账户注册
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="reset-form"
    >
      <el-form-item label="手机号" prop="phone" style="margin-bottom: 30px">
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </el-form-item>

      <el-form-item
        label="验证码"
        prop="verifyCode"
        style="margin-bottom: 30px"
      >
        <div class="code-row">
          <el-input
            v-model="form.verifyCode"
            placeholder="请输入验证码"
            maxlength="6"
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

      <el-form-item
        label="设置新密码"
        prop="password"
        style="margin-bottom: 30px"
      >
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入登录新密码，长度为6-12位"
        />
      </el-form-item>

      <el-form-item
        label="确认新密码"
        prop="confirmPassword"
        style="margin-bottom: 30px"
      >
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="请确认登录新密码"
        />
      </el-form-item>

      <div class="submit-btn" @click="submit">提交</div>
      <div class="register" @click="emit('back')">
        已有账号？<span class="register-text">立即登录</span>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { register, sendSmsCode } from '@/modules/client/api';

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'success'): void;
}>();

defineProps({
  mode: {
    type: String,
    default: 'reset',
  },
});

// 表单
const formRef = ref();
const form = ref({
  phone: '',
  verifyCode: '',
  password: '',
  confirmPassword: '',
});

// 手机号校验（大陆 11 位）
const isValidCNPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);

// 验证码倒计时
const isSendingCode = ref(false);
const codeCountdown = ref(0);
let timer: number | null = null;

const codeBtnText = computed(() => {
  if (isSendingCode.value) return '发送中...';
  if (codeCountdown.value > 0) return `${codeCountdown.value}s`;
  return '获取验证码';
});

const startCountdown = (sec = 60) => {
  if (timer) window.clearInterval(timer);
  codeCountdown.value = sec;
  timer = window.setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      codeCountdown.value = 0;
      if (timer) window.clearInterval(timer);
      timer = null;
    }
  }, 1000);
};

const sendCode = async () => {
  if (isSendingCode.value || codeCountdown.value > 0) return;

  const phone = form.value.phone.trim();
  if (!isValidCNPhone(phone)) return ElMessage.warning('请输入正确的手机号');

  try {
    isSendingCode.value = true;
    await sendSmsCode({phone});
    ElMessage.success('验证码已发送');
    startCountdown(60);
  } catch (e) {
    console.error(e);
    ElMessage.error('验证码发送失败，请稍后重试');
  } finally {
    isSendingCode.value = false;
  }
};

// rules
const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (_: any, val: string, cb: any) => {
        if (!isValidCNPhone((val || '').trim()))
          return cb(new Error('手机号格式不正确'));
        cb();
      },
      trigger: 'blur',
    },
  ],
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_: any, val: string, cb: any) => {
        const v = (val || '').trim();
        if (v.length < 6 || v.length > 12)
          return cb(new Error('密码长度需为 6-12 位'));
        cb();
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_: any, val: string, cb: any) => {
        if ((val || '').trim() !== (form.value.password || '').trim()) {
          return cb(new Error('两次输入的密码不一致'));
        }
        cb();
      },
      trigger: 'blur',
    },
  ],
};

const submit = async () => {
  try {
    await formRef.value?.validate?.();

    const payload = {
      phone: form.value.phone.trim(),
      verifyCode: form.value.verifyCode.trim(),
      password: form.value.password.trim(),
      name: 'join',
      email: '768481551@qq.com',
    };

    await register(payload);
    ElMessage.success('密码重置成功，请重新登录');

    emit('success'); // 让父组件切回登录表单
  } catch (e) {
    // validate 失败也会进 catch，这里不弹重复错误
    if (String(e)?.includes?.('validate')) return;
    console.error(e);
    ElMessage.error('重置失败，请检查验证码或稍后重试');
  }
};

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
  timer = null;
});
</script>

<style scoped>
.reset-wrap {
  width: 552px;
  max-width: 100%;
  margin-top: 20px;
}

.reset-back {
  font-size: 14px;
  color: #000000cc;
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
}
.reset-back::before {
  content: '‹';
  font-size: 18px;
  margin-right: 6px;
  line-height: 1;
}

.reset-title {
  text-align: center;
  font-weight: 600;
  font-weight: 500;
  font-size: 30px;
  color: #000;
  margin-bottom: 60px;
}

.reset-form {
  width: 552px;
  max-width: 100%;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.code-btn {
  width: 120px;
  height: 56px;
  border-radius: 6px;
  border: 1px solid #796f51;
  color: #796f51;
  text-align: center;
  line-height: 56px;
  cursor: pointer;
  user-select: none;
}
.code-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  height: 56px;
  background: #796f51;
  border-radius: 6px;
  font-size: 18px;
  color: #ffffff;
  text-align: center;
  line-height: 56px;
  cursor: pointer;
  margin-top: 10px;
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
  margin-top: 30px;
  .register-text {
    color: #000000;
  }
}
/* 保持你页面的 element-plus 输入风格一致 */
:deep(.el-form-item__label) {
  font-size: 14px;
  color: #000;
  font-weight: 500;
}
:deep(.el-input) {
  height: 56px;
}
:deep(.el-input__wrapper) {
  height: 56px;
}
:deep(.el-input__inner) {
  height: 50px;
  line-height: 50px;
  font-size: 16px;
}
</style>
