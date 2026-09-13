<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="forgot-password-dialog__backdrop"
      @click.self="closeDialog"
    >
      <section
        class="forgot-password-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="forgot-password-dialog__header">
          <div>
            <span>HOURX HOME</span>
            <h2 :id="titleId">{{ copy.title }}</h2>
          </div>
          <button type="button" :aria-label="copy.close" @click="closeDialog">×</button>
        </header>

        <p class="forgot-password-dialog__intro">{{ copy.intro }}</p>

        <form class="forgot-password-dialog__form" @submit.prevent="submitReset">
          <label>
            <span>{{ copy.account }}</span>
            <input
              v-model.trim="form.account"
              type="text"
              autocomplete="username"
              :placeholder="copy.accountPlaceholder"
            />
          </label>

          <label>
            <span>{{ copy.code }}</span>
            <div class="forgot-password-dialog__code-row">
              <input
                v-model.trim="form.verifyCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                :placeholder="copy.codePlaceholder"
              />
              <button
                type="button"
                :disabled="sendingCode || countdown > 0"
                @click="requestCode"
              >
                {{ codeButtonText }}
              </button>
            </div>
          </label>

          <label>
            <span>{{ copy.newPassword }}</span>
            <input
              v-model="form.newPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="copy.newPasswordPlaceholder"
            />
          </label>

          <label>
            <span>{{ copy.confirmPassword }}</span>
            <input
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="copy.confirmPasswordPlaceholder"
            />
          </label>

          <p v-if="statusMessage" class="forgot-password-dialog__status" role="status">
            {{ statusMessage }}
          </p>
          <p v-if="errorMessage" class="forgot-password-dialog__error" role="alert">
            {{ errorMessage }}
          </p>

          <div class="forgot-password-dialog__actions">
            <button type="button" class="is-secondary" @click="closeDialog">
              {{ copy.cancel }}
            </button>
            <button type="submit" class="is-primary" :disabled="submitting">
              {{ submitting ? copy.submitting : copy.submit }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  resetPasswordByEmail,
  resetPasswordByPhone,
  sendCode,
} from "@/modules/client/api/login"

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    initialAccount?: string
  }>(),
  {
    initialAccount: "",
  },
)

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
  (event: "success"): void
}>()

const { locale } = useI18n({ useScope: "global" })
const titleId = `forgot-password-title-${Math.random().toString(36).slice(2)}`
const form = reactive({
  account: "",
  verifyCode: "",
  newPassword: "",
  confirmPassword: "",
})
const sendingCode = ref(false)
const submitting = ref(false)
const countdown = ref(0)
const statusMessage = ref("")
const errorMessage = ref("")
let countdownTimer: number | null = null

const copy = computed(() =>
  locale.value === "zh"
    ? {
        title: "忘记密码",
        intro: "使用账户绑定的邮箱或手机接收验证码，然后设置新密码。",
        account: "邮箱或手机号码",
        accountPlaceholder: "name@example.com 或 +971…",
        code: "验证码",
        codePlaceholder: "请输入 6 位验证码",
        newPassword: "新密码",
        newPasswordPlaceholder: "至少 6 个字符",
        confirmPassword: "确认新密码",
        confirmPasswordPlaceholder: "请再次输入新密码",
        getCode: "获取验证码",
        sendingCode: "发送中…",
        resendIn: (seconds: number) => `${seconds} 秒后重发`,
        codeSent: "验证码已发送，请注意查收。",
        invalidAccount: "请输入有效的邮箱或带国际区号的手机号码，例如 +971501234567。",
        invalidCode: "请输入 6 位数字验证码。",
        passwordRequired: "新密码至少需要 6 个字符。",
        passwordMismatch: "两次输入的新密码不一致。",
        failed: "密码重置失败，请稍后重试。",
        cancel: "取消",
        submit: "重置密码",
        submitting: "重置中…",
        close: "关闭",
      }
    : {
        title: "Forgot password",
        intro: "Receive a verification code using your account email or phone, then set a new password.",
        account: "Email or phone number",
        accountPlaceholder: "name@example.com or +971…",
        code: "Verification code",
        codePlaceholder: "Enter the 6-digit code",
        newPassword: "New password",
        newPasswordPlaceholder: "At least 6 characters",
        confirmPassword: "Confirm new password",
        confirmPasswordPlaceholder: "Enter the new password again",
        getCode: "Send code",
        sendingCode: "Sending…",
        resendIn: (seconds: number) => `Resend in ${seconds}s`,
        codeSent: "Verification code sent. Please check your messages.",
        invalidAccount: "Enter a valid email or an international phone number such as +971501234567.",
        invalidCode: "Enter the 6-digit verification code.",
        passwordRequired: "The new password must contain at least 6 characters.",
        passwordMismatch: "The new passwords do not match.",
        failed: "Unable to reset the password. Please try again.",
        cancel: "Cancel",
        submit: "Reset password",
        submitting: "Resetting…",
        close: "Close",
      },
)

const codeButtonText = computed(() => {
  if (sendingCode.value) return copy.value.sendingCode
  if (countdown.value > 0) return copy.value.resendIn(countdown.value)
  return copy.value.getCode
})

const normalizeAccount = () => {
  const value = form.account.trim()
  return value.includes("@") ? value.toLowerCase() : value.replace(/[\s-]/g, "")
}

const isValidAccount = (value: string) =>
  value.includes("@")
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : /^\+[1-9]\d{7,14}$/.test(value)

const stopCountdown = () => {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const startCountdown = () => {
  stopCountdown()
  countdown.value = 60
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      countdown.value = 0
      stopCountdown()
    }
  }, 1000)
}

const resetState = () => {
  form.account = props.initialAccount.trim()
  form.verifyCode = ""
  form.newPassword = ""
  form.confirmPassword = ""
  sendingCode.value = false
  submitting.value = false
  countdown.value = 0
  statusMessage.value = ""
  errorMessage.value = ""
  stopCountdown()
}

const closeDialog = () => {
  if (submitting.value) return
  emit("update:modelValue", false)
}

const requestCode = async () => {
  const account = normalizeAccount()
  errorMessage.value = ""
  statusMessage.value = ""
  if (!isValidAccount(account)) {
    errorMessage.value = copy.value.invalidAccount
    return
  }
  sendingCode.value = true
  try {
    await sendCode({ phoneOrEmail: account })
    form.account = account
    statusMessage.value = copy.value.codeSent
    startCountdown()
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.failed
  } finally {
    sendingCode.value = false
  }
}

const submitReset = async () => {
  const account = normalizeAccount()
  const verifyCode = form.verifyCode.trim()
  const newPassword = form.newPassword
  errorMessage.value = ""
  statusMessage.value = ""
  if (!isValidAccount(account)) {
    errorMessage.value = copy.value.invalidAccount
    return
  }
  if (!/^\d{6}$/.test(verifyCode)) {
    errorMessage.value = copy.value.invalidCode
    return
  }
  if (newPassword.length < 6) {
    errorMessage.value = copy.value.passwordRequired
    return
  }
  if (newPassword !== form.confirmPassword) {
    errorMessage.value = copy.value.passwordMismatch
    return
  }

  submitting.value = true
  try {
    if (account.includes("@")) {
      await resetPasswordByEmail({ email: account, verifyCode, newPassword })
    } else {
      await resetPasswordByPhone({ phone: account, verifyCode, newPassword })
    }
    emit("update:modelValue", false)
    emit("success")
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.failed
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetState()
    else stopCountdown()
  },
)

watch(
  () => props.initialAccount,
  (value) => {
    if (props.modelValue && !form.verifyCode && !form.newPassword) {
      form.account = value.trim()
    }
  },
)

onBeforeUnmount(stopCountdown)
</script>

<style scoped>
.forgot-password-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(5, 21, 43, 0.52);
  backdrop-filter: blur(4px);
}

.forgot-password-dialog {
  width: min(100%, 480px);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  box-sizing: border-box;
  padding: 24px;
  border-radius: 20px;
  background: #fff;
  color: #05152b;
  box-shadow: 0 24px 64px rgba(5, 21, 43, 0.24);
}

.forgot-password-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.forgot-password-dialog__header span {
  color: #1769c2;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.forgot-password-dialog__header h2 {
  margin: 5px 0 0;
  font-size: 24px;
}

.forgot-password-dialog__header > button {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 11px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.forgot-password-dialog__intro {
  margin: 14px 0 20px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}

.forgot-password-dialog__form,
.forgot-password-dialog__form label {
  display: flex;
  flex-direction: column;
}

.forgot-password-dialog__form {
  gap: 15px;
}

.forgot-password-dialog__form label {
  gap: 7px;
}

.forgot-password-dialog__form label > span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.forgot-password-dialog__form input {
  width: 100%;
  min-height: 46px;
  box-sizing: border-box;
  border: 1px solid #dbe3ee;
  border-radius: 11px;
  background: #f8fafc;
  padding: 0 13px;
  color: #05152b;
  font: inherit;
  outline: 0;
}

.forgot-password-dialog__form input:focus {
  border-color: #1769c2;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.1);
}

.forgot-password-dialog__code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.forgot-password-dialog__code-row button {
  min-width: 118px;
  border: 1px solid #1769c2;
  border-radius: 11px;
  background: #fff;
  color: #1769c2;
  padding: 0 12px;
  font-weight: 800;
  cursor: pointer;
}

.forgot-password-dialog__code-row button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.forgot-password-dialog__status,
.forgot-password-dialog__error {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.forgot-password-dialog__status {
  color: #27704d;
}

.forgot-password-dialog__error {
  color: #b42318;
}

.forgot-password-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.forgot-password-dialog__actions button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 11px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.forgot-password-dialog__actions .is-secondary {
  border: 1px solid #dbe3ee;
  background: #fff;
  color: #475569;
}

.forgot-password-dialog__actions .is-primary {
  border: 1px solid #1769c2;
  background: #1769c2;
  color: #fff;
}

.forgot-password-dialog__actions button:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 560px) {
  .forgot-password-dialog__backdrop {
    align-items: end;
    padding: 0;
  }

  .forgot-password-dialog {
    width: 100%;
    max-height: 92vh;
    padding: 22px 18px max(22px, env(safe-area-inset-bottom));
    border-radius: 22px 22px 0 0;
  }

  .forgot-password-dialog__code-row {
    grid-template-columns: minmax(0, 1fr) 112px;
  }

  .forgot-password-dialog__code-row button {
    min-width: 0;
    font-size: 12px;
  }

  .forgot-password-dialog__actions {
    flex-direction: column-reverse;
  }

  .forgot-password-dialog__actions button {
    width: 100%;
  }
}
</style>
