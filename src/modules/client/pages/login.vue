<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2 class="auth-title">
        {{ mode === 'login' ? '手机号登录' : '手机号注册' }}
      </h2>

      <div class="auth-tabs">
        <button
          type="button"
          :class="['auth-tab', { active: mode === 'login' }]"
          @click="mode = 'login'"
        >
          登录
        </button>
        <button
          type="button"
          :class="['auth-tab', { active: mode === 'register' }]"
          @click="mode = 'register'"
        >
          注册
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <!-- 手机号 -->
        <div class="field">
          <label class="field-label">手机号码</label>
          <div class="phone-row">
            <select v-model="form.countryCode" class="country-select">
              <option
                v-for="item in countryList"
                :key="item.code"
                :value="item.dialCode"
              >
                {{ item.flag }} {{ item.name }} ({{ item.dialCode }})
              </option>
            </select>
            <input
              v-model="form.phone"
              class="phone-input"
              type="tel"
              placeholder="请输入手机号，不含区号"
            />
          </div>
        </div>

        <!-- 验证码 -->
        <div class="field">
          <label class="field-label">短信验证码</label>
          <div class="code-row">
            <input
              v-model="form.code"
              class="code-input"
              type="text"
              maxlength="6"
              placeholder="请输入验证码"
            />
            <button
              type="button"
              class="code-btn"
              :disabled="countdown > 0 || sendingCode"
              @click="handleSendCode"
            >
              <span v-if="countdown > 0">{{ countdown }}s 后重发</span>
              <span v-else>获取验证码</span>
            </button>
          </div>
        </div>

        <button
          class="submit-btn"
          type="submit"
          :disabled="submitting"
        >
          {{ mode === 'login' ? '登录' : '注册并登录' }}
        </button>
      </form>

      <p class="tips">
        登录即表示你已阅读并同意
        <a href="#" target="_blank">《用户协议》</a>
        和
        <a href="#" target="_blank">《隐私政策》</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

type Mode = 'login' | 'register'

interface FormState {
  countryCode: string
  phone: string
  code: string
}

interface CountryOption {
  code: string
  name: string
  dialCode: string
  flag: string
}

// 登录模式：登录 / 注册
const mode = ref<Mode>('login')

const form = ref<FormState>({
  countryCode: '+86',
  phone: '',
  code: '',
})

// 简单列几个国家
const countryList: CountryOption[] = [
  { code: 'CN', name: '中国大陆', dialCode: '+86', flag: '🇨🇳' },
  { code: 'HK', name: '中国香港', dialCode: '+852', flag: '🇭🇰' },
  { code: 'MO', name: '中国澳门', dialCode: '+853', flag: '🇲🇴' },
  { code: 'TW', name: '中国台湾', dialCode: '+886', flag: '🇹🇼' },
  { code: 'US', name: '美国', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: '英国', dialCode: '+44', flag: '🇬🇧' },
  { code: 'JP', name: '日本', dialCode: '+81', flag: '🇯🇵' },
]

const countdown = ref(0)
const timerId = ref<number | null>(null)
const sendingCode = ref(false)
const submitting = ref(false)

function normalizePhone(): string {
  // 只保留数字，后端再做更严格校验
  return form.value.phone.replace(/\D/g, '')
}

function validatePhone(): boolean {
  const phone = normalizePhone()
  if (!phone) {
    window.alert('请输入手机号')
    return false
  }
  if (!form.value.countryCode) {
    window.alert('请选择区号')
    return false
  }
  // 简单长度校验（6-15 位），真正规则建议后端再校验一次
  if (phone.length < 6 || phone.length > 15) {
    window.alert('手机号格式不太正确')
    return false
  }
  return true
}

function startCountdown(seconds: number) {
  countdown.value = seconds
  if (timerId.value) {
    window.clearInterval(timerId.value)
  }
  timerId.value = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && timerId.value) {
      window.clearInterval(timerId.value)
      timerId.value = null
    }
  }, 1000)
}

async function handleSendCode() {
  if (!validatePhone()) return
  if (countdown.value > 0 || sendingCode.value) return

  sendingCode.value = true
  try {
    const payload = {
      countryCode: form.value.countryCode,
      phone: normalizePhone(),
      scene: mode.value, // login / register，看后端要不要区分
    }
    // TODO: 换成你自己的 axios / fetch 请求
    await fakeSendCodeApi(payload)

    startCountdown(60)
    window.alert('验证码已发送，请注意查收')
  } catch (error) {
    console.error(error)
    window.alert('发送验证码失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

async function handleSubmit() {
  if (!validatePhone()) return
  if (!form.value.code.trim()) {
    window.alert('请输入验证码')
    return
  }

  submitting.value = true
  const payload = {
    countryCode: form.value.countryCode,
    phone: normalizePhone(),
    code: form.value.code.trim(),
  }

  try {
    if (mode.value === 'login') {
      await fakeLoginApi(payload)
    } else {
      await fakeRegisterApi(payload)
    }
    window.alert('登录成功')
    // TODO: 在这里保存 token / 用户信息，跳转到首页等
  } catch (error) {
    console.error(error)
    window.alert('操作失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// ------- 下面是占位的假接口，你用的时候换成真实接口即可 -------

async function fakeSendCodeApi(data: {
  countryCode: string
  phone: string
  scene: Mode
}) {
  console.log('send sms code', data)
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 500)
  })
}

async function fakeLoginApi(data: {
  countryCode: string
  phone: string
  code: string
}) {
  console.log('login with phone', data)
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 500)
  })
}

async function fakeRegisterApi(data: {
  countryCode: string
  phone: string
  code: string
}) {
  console.log('register with phone', data)
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 500)
  })
}

onBeforeUnmount(() => {
  if (timerId.value) {
    window.clearInterval(timerId.value)
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 24px;
  box-sizing: border-box;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  padding: 32px 28px 24px;
  box-sizing: border-box;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
}

.auth-title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}

.auth-tabs {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px;
  background: #f5f5f5;
  margin: 0 auto 24px;
}

.auth-tab {
  border: none;
  outline: none;
  padding: 6px 20px;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  background: transparent;
}

.auth-tab.active {
  background: #165dff;
  color: #ffffff;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
  color: #555555;
}

.phone-row {
  display: flex;
  gap: 8px;
}

.country-select {
  width: 140px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  background: #ffffff;
  box-sizing: border-box;
}

.phone-input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  box-sizing: border-box;
}

.code-row {
  display: flex;
  gap: 8px;
}

.code-input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  box-sizing: border-box;
}

.code-btn {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  box-sizing: border-box;
  background: #165dff;
  color: #ffffff;
}

.code-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.submit-btn {
  margin-top: 6px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  background: #165dff;
  color: #ffffff;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tips {
  margin-top: 16px;
  font-size: 12px;
  color: #888888;
  text-align: center;
}

.tips a {
  color: #165dff;
  text-decoration: none;
}
</style>
