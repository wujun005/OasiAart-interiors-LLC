<template>
  <div class="profile-page">
    <div class="profile-container">
      <section class="profile-hero">
        <img class="profile-hero__avatar" src="@/assets/images/client/icon13.png" alt="" />
        <div class="profile-hero__identity">
          <h1>{{ displayName }}</h1>
          <p v-if="displayPhone">{{ displayPhone }}</p>
          <p v-if="displayEmail" class="profile-hero__email" :title="displayEmail">{{ displayEmail }}</p>
          <p v-if="!displayPhone && !displayEmail">{{ t("client.profile.defaultAccount") }}</p>
        </div>
      </section>

      <div class="profile-layout">
        <main class="profile-main-card">
          <header class="profile-heading">
            <h2>{{ t("client.profile.title") }}</h2>
            <p>{{ t("client.profile.subtitle") }}</p>
          </header>

          <div class="profile-sections">
            <article class="profile-section" :class="{ 'is-open': activeSection === 'personal' }">
              <button class="profile-section__trigger" type="button" @click="toggleSection('personal')">
                <span class="profile-section__icon"><el-icon><User /></el-icon></span>
                <span class="profile-section__label">{{ t("client.profile.menu.personal") }}</span>
                <el-icon class="profile-section__arrow"><ArrowRight /></el-icon>
              </button>

              <div v-if="activeSection === 'personal'" class="profile-section__content">
                <div class="personal-details__toolbar">
                  <span>{{ profileLoading ? (locale === 'zh' ? '加载中…' : 'Loading…') : '' }}</span>
                  <button type="button" class="text-action" @click="profileEditing ? cancelProfileEdit() : startProfileEdit()">
                    {{ profileEditing ? (locale === 'zh' ? '取消' : 'Cancel') : (locale === 'zh' ? '编辑个人信息' : 'Edit profile') }}
                  </button>
                </div>
                <form v-if="profileEditing" class="profile-edit-form" @submit.prevent="saveProfile">
                  <label><span>{{ t("client.profile.personal.name") }}</span><input v-model.trim="profileForm.name" class="profile-input" type="text" autocomplete="name" /></label>
                  <label><span>{{ t("client.profile.personal.phone") }}</span><input v-model.trim="profileForm.phone" class="profile-input" type="tel" autocomplete="tel" /></label>
                  <label><span>{{ t("client.profile.personal.email") }}</span><input v-model.trim="profileForm.email" class="profile-input" type="email" autocomplete="email" /></label>
                  <button class="primary-btn" type="submit" :disabled="profileSubmitting">{{ profileSubmitting ? (locale === 'zh' ? '保存中…' : 'Saving…') : (locale === 'zh' ? '保存个人信息' : 'Save profile') }}</button>
                </form>
                <dl v-else class="personal-details">
                  <div>
                    <dt>{{ t("client.profile.personal.name") }}</dt>
                    <dd>{{ profileName || t("client.profile.notProvided") }}</dd>
                  </div>
                  <div>
                    <dt>{{ t("client.profile.personal.phone") }}</dt>
                    <dd>{{ displayPhone || t("client.profile.notProvided") }}</dd>
                  </div>
                  <div>
                    <dt>{{ t("client.profile.personal.email") }}</dt>
                    <dd :title="displayEmail">{{ displayEmail || t("client.profile.notProvided") }}</dd>
                  </div>
                </dl>

                <div class="password-entry">
                  <span class="password-entry__icon"><el-icon><Lock /></el-icon></span>
                  <span class="password-entry__copy">
                    <strong>{{ t("client.profile.personal.password") }}</strong>
                    <small>••••••••</small>
                  </span>
                  <button type="button" class="text-action" @click="passwordExpanded = !passwordExpanded">
                    {{ t("client.profile.personal.changePassword") }}
                  </button>
                </div>

                <form v-if="passwordExpanded" class="password-form" @submit.prevent="handleSubmit">
                  <label class="field-label" for="profile-current-password">
                    {{ t("client.profile.form.currentPassword") }}
                  </label>
                  <div class="password-input-wrap">
                    <input
                      id="profile-current-password"
                      v-model="form.currentPassword"
                      class="profile-input"
                      :class="{ 'is-error': errors.currentPassword }"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      :placeholder="t('client.profile.form.currentPasswordPlaceholder')"
                      autocomplete="current-password"
                      @input="clearError('currentPassword')"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="showCurrentPassword ? t('client.login.password.hidePassword') : t('client.login.password.showPassword')"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <svg v-if="!showCurrentPassword" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m3 3 18 18M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-2.2 3M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6 10 6c1.9 0 3.5-.5 4.8-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="errors.currentPassword" class="field-error">{{ errors.currentPassword }}</p>
                  <div class="password-form__forgot">
                    <button type="button" @click="forgotPasswordVisible = true">
                      {{ t("client.login.password.forgotPassword") }}
                    </button>
                  </div>

                  <label class="field-label" for="profile-new-password">
                    {{ t("client.profile.form.newPassword") }}
                  </label>
                  <div class="password-input-wrap">
                    <input
                      id="profile-new-password"
                      v-model="form.newPassword"
                      class="profile-input"
                      :class="{ 'is-error': errors.newPassword }"
                      :type="showNewPassword ? 'text' : 'password'"
                      :placeholder="t('client.profile.form.newPasswordPlaceholder')"
                      autocomplete="new-password"
                      @input="clearError('newPassword')"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="showNewPassword ? t('client.login.password.hidePassword') : t('client.login.password.showPassword')"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <svg v-if="!showNewPassword" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m3 3 18 18M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-2.2 3M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6 10 6c1.9 0 3.5-.5 4.8-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="errors.newPassword" class="field-error">{{ errors.newPassword }}</p>

                  <label class="field-label" for="profile-confirm-password">
                    {{ t("client.profile.form.confirmPassword") }}
                  </label>
                  <div class="password-input-wrap">
                    <input
                      id="profile-confirm-password"
                      v-model="form.confirmPassword"
                      class="profile-input"
                      :class="{ 'is-error': errors.confirmPassword }"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      :placeholder="t('client.profile.form.confirmPasswordPlaceholder')"
                      autocomplete="new-password"
                      @input="clearError('confirmPassword')"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="showConfirmPassword ? t('client.login.password.hidePassword') : t('client.login.password.showPassword')"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <svg v-if="!showConfirmPassword" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m3 3 18 18M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6s-3.5 6-10 6c-1.9 0-3.5-.5-4.8-1.2M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6 10 6c1.9 0 3.5-.5 4.8-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</p>

                  <div class="password-form__actions">
                    <button type="button" class="secondary-btn" @click="resetPasswordForm">
                      {{ t("client.profile.actions.reset") }}
                    </button>
                    <button type="submit" class="primary-btn" :disabled="submitting">
                      {{ submitting ? t("client.profile.actions.submitting") : t("client.profile.actions.submit") }}
                    </button>
                  </div>
                </form>
              </div>
            </article>

            <article class="profile-section" :class="{ 'is-open': activeSection === 'addresses' }">
              <button class="profile-section__trigger" type="button" @click="toggleSection('addresses')">
                <span class="profile-section__icon"><el-icon><Location /></el-icon></span>
                <span class="profile-section__label">{{ t("client.profile.menu.addresses") }}</span>
                <el-icon class="profile-section__arrow"><ArrowRight /></el-icon>
              </button>
              <div v-if="activeSection === 'addresses'" class="profile-section__content">
                <button v-if="checkoutReturnPath" type="button" class="profile-return-checkout" @click="router.push(checkoutReturnPath)">
                  ← {{ locale === 'zh' ? '返回订单确认' : 'Back to checkout' }}
                </button>
                <SavedAddressManager />
              </div>
            </article>

            <article class="profile-section" :class="{ 'is-open': activeSection === 'payments' }">
              <button class="profile-section__trigger" type="button" @click="toggleSection('payments')">
                <span class="profile-section__icon"><el-icon><CreditCard /></el-icon></span>
                <span class="profile-section__label">{{ t("client.profile.menu.payments") }}</span>
                <el-icon class="profile-section__arrow"><ArrowRight /></el-icon>
              </button>
              <div v-if="activeSection === 'payments'" class="profile-section__content">
                <div class="section-state section-state--stacked">
                  <strong>{{ t("client.profile.payments.empty") }}</strong>
                  <span>{{ t("client.profile.payments.note") }}</span>
                </div>
              </div>
            </article>

            <article class="profile-section" :class="{ 'is-open': activeSection === 'notifications' }">
              <button class="profile-section__trigger" type="button" @click="toggleSection('notifications')">
                <span class="profile-section__icon"><el-icon><Bell /></el-icon></span>
                <span class="profile-section__label">{{ t("client.profile.menu.notifications") }}</span>
                <el-icon class="profile-section__arrow"><ArrowRight /></el-icon>
              </button>
              <div v-if="activeSection === 'notifications'" class="profile-section__content notification-list">
                <label class="notification-row">
                  <span>
                    <strong>{{ t("client.profile.notifications.bookingTitle") }}</strong>
                    <small>{{ t("client.profile.notifications.bookingDesc") }}</small>
                  </span>
                  <el-switch v-model="bookingNotifications" @change="saveNotificationPreferences" />
                </label>
                <label class="notification-row">
                  <span>
                    <strong>{{ t("client.profile.notifications.offersTitle") }}</strong>
                    <small>{{ t("client.profile.notifications.offersDesc") }}</small>
                  </span>
                  <el-switch v-model="offerNotifications" @change="saveNotificationPreferences" />
                </label>
              </div>
            </article>

            <article class="profile-section" :class="{ 'is-open': activeSection === 'support' }">
              <button class="profile-section__trigger" type="button" @click="toggleSection('support')">
                <span class="profile-section__icon"><el-icon><Service /></el-icon></span>
                <span class="profile-section__label">{{ t("client.profile.menu.support") }}</span>
                <el-icon class="profile-section__arrow"><ArrowRight /></el-icon>
              </button>
              <div v-if="activeSection === 'support'" class="profile-section__content support-panel">
                <p>{{ t("client.profile.support.description") }}</p>
                <div class="support-actions">
                  <a href="https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F" target="_blank" rel="noopener noreferrer">
                    {{ t("client.profile.support.whatsapp") }}
                  </a>
                  <a href="mailto:support@hourxportal.com">support@hourxportal.com</a>
                </div>
                <h3>{{ t("client.profile.support.faqTitle") }}</h3>
                <details>
                  <summary>{{ t("client.profile.support.bookingQuestion") }}</summary>
                  <p>{{ t("client.profile.support.bookingAnswer") }}</p>
                </details>
                <details>
                  <summary>{{ t("client.profile.support.ordersQuestion") }}</summary>
                  <p>{{ t("client.profile.support.ordersAnswer") }}</p>
                </details>
              </div>
            </article>

            <article class="profile-section" :class="{ 'is-open': activeSection === 'language' }">
              <button class="profile-section__trigger" type="button" @click="toggleSection('language')">
                <span class="profile-section__icon"><el-icon><Operation /></el-icon></span>
                <span class="profile-section__label">{{ t("client.profile.menu.language") }}</span>
                <span class="profile-section__value">{{ localeLabel }}</span>
                <el-icon class="profile-section__arrow"><ArrowRight /></el-icon>
              </button>
              <div v-if="activeSection === 'language'" class="profile-section__content language-options">
                <button type="button" :class="{ 'is-active': locale === 'en' }" @click="changeLocale('en')">English</button>
                <button type="button" :class="{ 'is-active': locale === 'zh' }" @click="changeLocale('zh')">中文</button>
              </div>
            </article>
          </div>
        </main>

        <aside class="profile-sidebar">
          <section class="partner-card">
            <img src="@/assets/images/client/icon16.png" alt="" />
            <h2>{{ t("client.profile.partner.title") }}</h2>
            <p>{{ t("client.profile.partner.desc") }}</p>
            <a href="mailto:partners@hourxportal.com">
              <img src="@/assets/images/client/email.png" alt="" />
              <span>partners@hourxportal.com</span>
            </a>
          </section>

          <button type="button" class="logout-button" @click="handleLogout">
            {{ t("client.profile.logOut") }}
          </button>
        </aside>
      </div>
    </div>
    <ForgotPasswordDialog
      v-model="forgotPasswordVisible"
      :initial-account="forgotPasswordAccount"
      @success="handleForgotPasswordSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { ArrowRight, Bell, CreditCard, Location, Lock, Operation, Service, User } from "@element-plus/icons-vue"
import { getClientProfile, updateClientProfile, type ClientProfileRecord } from "../api"
import { changePasswordByOld } from "../api/login"
import {
  getClientAuthStorageValue,
  getStoredAuthSnapshot,
} from "@/utils/auth-state"
import { useAuth } from "../composables/useAuth"
import { setClientLocale } from "../locales"
import SavedAddressManager from "@/modules/client/components/SavedAddressManager.vue"
import ForgotPasswordDialog from "@/modules/client/components/ForgotPasswordDialog.vue"

type ProfileSection = "personal" | "addresses" | "payments" | "notifications" | "support" | "language"

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const { isLoggedIn, userInfo, checkLoginStatus, clearAuth } = useAuth()

const form = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
})

const errors = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
})

const activeSection = ref<ProfileSection | "">("personal")
const passwordExpanded = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const submitting = ref(false)
const forgotPasswordVisible = ref(false)
const profileData = ref<ClientProfileRecord | null>(null)
const profileLoading = ref(false)
const profileEditing = ref(false)
const profileSubmitting = ref(false)
const profileForm = reactive({ name: "", phone: "", email: "" })
const bookingNotifications = ref(true)
const offerNotifications = ref(false)

const account = computed(() => {
  const snapshot = getStoredAuthSnapshot()
  const storedAccount = getClientAuthStorageValue("account")
  return storedAccount || snapshot.userInfo.username || snapshot.userInfo.email || snapshot.userInfo.phone || ""
})

const isEmailAccount = (value: string) => value.includes("@")
const isPhoneAccount = (value: string) => /^\+?[\d\s-]{7,}$/.test(value)

const maskPhone = (phone: string) => {
  const value = phone.trim()
  if (!value) return ""
  if (value.length <= 7) return value
  return `${value.slice(0, 4)}••••${value.slice(-3)}`
}

const profileName = computed(() => {
  const value = profileData.value?.name?.trim() || userInfo.value.username?.trim() || ""
  if (value && !isEmailAccount(value) && !isPhoneAccount(value)) return value
  return ""
})

const displayName = computed(() => profileName.value || t("client.profile.defaultName"))

const displayPhone = computed(() => {
  const value = profileData.value?.phone || userInfo.value.phone || (isPhoneAccount(account.value) ? account.value : "")
  return maskPhone(value)
})

const displayEmail = computed(() => {
  return profileData.value?.email || userInfo.value.email || (isEmailAccount(account.value) ? account.value : "")
})

const forgotPasswordAccount = computed(() =>
  (profileData.value?.email || profileData.value?.phone || account.value).trim(),
)

const loadProfile = async () => {
  profileLoading.value = true
  try { profileData.value = await getClientProfile() } catch (error) { console.error("load profile failed:", error) }
  finally { profileLoading.value = false }
}

const startProfileEdit = () => {
  profileForm.name = profileData.value?.name || profileName.value
  profileForm.phone = profileData.value?.phone || userInfo.value.phone || ""
  profileForm.email = profileData.value?.email || displayEmail.value
  profileEditing.value = true
}
const cancelProfileEdit = () => { profileEditing.value = false }
const saveProfile = async () => {
  if (!profileForm.name && !profileForm.phone && !profileForm.email) {
    ElMessage.warning(locale.value === "zh" ? "请至少填写一项个人信息" : "Please provide at least one profile field")
    return
  }
  profileSubmitting.value = true
  try {
    profileData.value = await updateClientProfile({ ...profileForm })
    profileEditing.value = false
    ElMessage.success(locale.value === "zh" ? "个人信息已更新" : "Profile updated")
  } catch (error: any) {
    ElMessage.error(error?.message || (locale.value === "zh" ? "个人信息更新失败" : "Failed to update profile"))
  } finally { profileSubmitting.value = false }
}

const localeLabel = computed(() => (locale.value === "zh" ? "中文" : "English"))

const checkoutReturnPath = computed(() => {
  const value = Array.isArray(route.query.returnTo) ? route.query.returnTo[0] : route.query.returnTo
  return typeof value === "string" && value.startsWith("/orders/confirm") ? value : ""
})

const clearError = (field: keyof typeof errors) => {
  errors[field] = ""
}

const resetPasswordForm = () => {
  form.currentPassword = ""
  form.newPassword = ""
  form.confirmPassword = ""
  errors.currentPassword = ""
  errors.newPassword = ""
  errors.confirmPassword = ""
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

const validate = () => {
  resetErrors()

  if (!form.currentPassword) errors.currentPassword = t("client.profile.validation.currentPasswordRequired")

  if (!form.newPassword) {
    errors.newPassword = t("client.profile.validation.newPasswordRequired")
  } else if (form.newPassword.length < 6) {
    errors.newPassword = t("client.profile.validation.newPasswordMin")
  } else if (form.newPassword === form.currentPassword) {
    errors.newPassword = t("client.profile.validation.passwordSame")
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = t("client.profile.validation.confirmPasswordRequired")
  } else if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = t("client.profile.validation.passwordMismatch")
  }

  return !errors.currentPassword && !errors.newPassword && !errors.confirmPassword
}

const resetErrors = () => {
  errors.currentPassword = ""
  errors.newPassword = ""
  errors.confirmPassword = ""
}

const handleSubmit = async () => {
  if (!validate()) return
  const normalizedAccount = account.value.trim()
  if (!normalizedAccount) {
    ElMessage.error(t("client.profile.message.accountMissing"))
    return
  }

  submitting.value = true
  try {
    await changePasswordByOld({
      account: normalizedAccount,
      oldPassword: form.currentPassword.trim(),
      newPassword: form.newPassword.trim()
    })
    ElMessage.success(t("client.profile.message.updateSuccess"))
    resetPasswordForm()
    clearAuth()
    await router.replace({ name: "login" })
  } catch (error: any) {
    ElMessage.error(error?.message || t("client.profile.message.updateFailed"))
  } finally {
    submitting.value = false
  }
}

const handleForgotPasswordSuccess = async () => {
  ElMessage.success(locale.value === "zh" ? "密码已重置，请重新登录" : "Password reset. Please sign in again.")
  clearAuth()
  await router.replace({ name: "login" })
}

const toggleSection = (section: ProfileSection) => {
  activeSection.value = activeSection.value === section ? "" : section
}

const changeLocale = (nextLocale: "en" | "zh") => {
  locale.value = nextLocale
  setClientLocale(nextLocale)
}

const saveNotificationPreferences = () => {
  window.localStorage.setItem("hourx-h5-booking-notifications", String(bookingNotifications.value))
  window.localStorage.setItem("hourx-h5-offer-notifications", String(offerNotifications.value))
}

const restoreNotificationPreferences = () => {
  bookingNotifications.value = window.localStorage.getItem("hourx-h5-booking-notifications") !== "false"
  offerNotifications.value = window.localStorage.getItem("hourx-h5-offer-notifications") === "true"
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      t("client.profile.logoutConfirm.message"),
      t("client.profile.logoutConfirm.title"),
      {
        confirmButtonText: t("client.profile.logoutConfirm.confirm"),
        cancelButtonText: t("client.profile.logoutConfirm.cancel"),
        confirmButtonClass: "hourx-confirm-button"
      }
    )
    clearAuth()
    ElMessage.success(t("client.profile.logoutSuccess"))
    await router.replace("/")
  } catch {
    // User cancelled the confirmation dialog.
  }
}

const applySectionFromRoute = (section: unknown) => {
  const supported: ProfileSection[] = ["personal", "addresses", "payments", "notifications", "support", "language"]
  if (typeof section === "string" && supported.includes(section as ProfileSection)) {
    activeSection.value = section as ProfileSection
  }
}

onMounted(async () => {
  checkLoginStatus()
  if (!isLoggedIn.value) {
    await router.replace({ name: "login", query: { redirect: route.fullPath } })
    return
  }
  restoreNotificationPreferences()
  applySectionFromRoute(route.query.section)
  await loadProfile()
})

watch(
  () => route.query.section,
  (section) => applySectionFromRoute(section)
)
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 76px);
  padding: 34px 24px 72px;
  background: #f4f7fb;
  color: #05152b;
}

.profile-container {
  width: min(1160px, 100%);
  margin: 0 auto;
}

.profile-return-checkout {
  margin: 0 0 16px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font-weight: 800;
  cursor: pointer;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 22px;
  min-height: 168px;
  padding: 30px 38px;
  border-radius: 24px;
  background: linear-gradient(135deg, #05152b 0%, #102c50 100%);
  color: #fff;
  box-shadow: 0 18px 40px rgb(5 21 43 / 14%);
}

.profile-hero__avatar {
  width: 86px;
  height: 86px;
  flex: 0 0 auto;
  border: 3px solid rgb(255 255 255 / 70%);
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
}

.profile-hero__identity {
  min-width: 0;
}

.profile-hero h1 {
  margin: 0 0 8px;
  font-size: 28px;
  line-height: 1.2;
}

.profile-hero p {
  max-width: 640px;
  margin: 4px 0 0;
  color: rgb(255 255 255 / 72%);
  font-size: 14px;
}

.profile-hero__email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.82fr);
  gap: 24px;
  align-items: start;
  margin-top: 24px;
}

.profile-main-card,
.partner-card {
  border: 1px solid #e4eaf2;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 32px rgb(5 21 43 / 6%);
}

.profile-heading {
  padding: 28px 30px 22px;
  border-bottom: 1px solid #edf1f6;
}

.profile-heading h2 {
  margin: 0;
  color: #05152b;
  font-size: 24px;
}

.profile-heading p {
  margin: 8px 0 0;
  color: #6f7d91;
  font-size: 14px;
}

.profile-sections {
  padding: 6px 30px 22px;
}

.profile-section {
  border-bottom: 1px solid #edf1f6;
}

.profile-section:last-child {
  border-bottom: 0;
}

.profile-section__trigger {
  display: flex;
  width: 100%;
  min-height: 72px;
  align-items: center;
  gap: 14px;
  padding: 14px 2px;
  border: 0;
  background: transparent;
  color: #05152b;
  text-align: left;
  cursor: pointer;
}

.profile-section__icon,
.password-entry__icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eef4fc;
  color: #1769c2;
  font-size: 20px;
}

.profile-section__label {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
}

.profile-section__value {
  color: #768397;
  font-size: 14px;
}

.profile-section__arrow {
  color: #98a4b5;
  transition: transform 0.2s ease;
}

.profile-section.is-open .profile-section__arrow {
  transform: rotate(90deg);
}

.profile-section__content {
  padding: 2px 2px 24px 56px;
}

.personal-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 18px;
}

.personal-details div {
  min-width: 0;
  padding: 16px;
  border: 1px solid #e4eaf2;
  border-radius: 13px;
  background: #f8fafc;
}

.personal-details dt {
  margin-bottom: 7px;
  color: #7a8798;
  font-size: 12px;
}

.personal-details dd {
  overflow: hidden;
  margin: 0;
  color: #05152b;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.password-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e4eaf2;
  border-radius: 13px;
}

.password-entry__icon {
  width: 36px;
  height: 36px;
  flex-basis: 36px;
  font-size: 17px;
}

.password-entry__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.password-entry__copy strong {
  font-size: 14px;
}

.password-entry__copy small {
  color: #8b96a7;
  letter-spacing: 2px;
}

.text-action {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.password-form {
  margin-top: 18px;
  padding: 20px;
  border-radius: 15px;
  background: #f7f9fc;
}

.field-label {
  display: block;
  margin: 0 0 8px;
  color: #27374d;
  font-size: 13px;
  font-weight: 700;
}

.password-input-wrap {
  position: relative;
  margin-bottom: 14px;
}

.profile-input {
  width: 100%;
  height: 44px;
  box-sizing: border-box;
  padding: 0 46px 0 13px;
  border: 1px solid #d8e0ea;
  border-radius: 10px;
  outline: none;
  background: #fff;
  color: #05152b;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.profile-input:focus {
  border-color: #1769c2;
  box-shadow: 0 0 0 3px rgb(23 105 194 / 12%);
}

.profile-input.is-error {
  border-color: #e14d52;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 10px;
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #718095;
  cursor: pointer;
}

.password-toggle svg {
  width: 19px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.field-error {
  margin: -8px 0 12px;
  color: #d93036;
  font-size: 12px;
}

.password-form__forgot {
  display: flex;
  justify-content: flex-end;
  margin: -6px 0 16px;
}

.password-form__forgot button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.password-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.primary-btn,
.secondary-btn {
  min-width: 112px;
  height: 42px;
  padding: 0 18px;
  border-radius: 10px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn {
  border: 1px solid #05152b;
  background: #05152b;
  color: #fff;
}

.primary-btn:disabled {
  cursor: wait;
  opacity: 0.65;
}

.secondary-btn {
  border: 1px solid #dbe2eb;
  background: #fff;
  color: #34445a;
}

.section-state {
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border: 1px dashed #ccd6e3;
  border-radius: 13px;
  color: #758297;
  text-align: center;
}

.section-state--error {
  color: #b23a40;
}

.section-state--stacked {
  flex-direction: column;
}

.section-state--stacked strong {
  color: #34445a;
}

.saved-address-card {
  padding: 18px;
  border: 1px solid #dce5ef;
  border-radius: 14px;
  background: #f8fafc;
}

.saved-address-card strong {
  display: block;
  color: #05152b;
  font-size: 15px;
}

.saved-address-card p {
  margin: 7px 0 0;
  color: #748196;
  font-size: 13px;
}

.notification-list {
  display: grid;
  gap: 10px;
}

.notification-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px;
  border: 1px solid #e4eaf2;
  border-radius: 13px;
}

.notification-row > span {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.notification-row strong {
  font-size: 14px;
}

.notification-row small {
  color: #778498;
  line-height: 1.5;
}

.support-panel > p {
  margin: 0 0 14px;
  color: #66758a;
  line-height: 1.65;
}

.support-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.support-actions a {
  padding: 9px 13px;
  border: 1px solid #d9e2ed;
  border-radius: 9px;
  color: #1769c2;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.support-panel h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.support-panel details {
  padding: 12px 0;
  border-bottom: 1px solid #e8edf3;
}

.support-panel details:last-child {
  border-bottom: 0;
}

.support-panel summary {
  color: #27374d;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.support-panel details p {
  margin: 10px 0 0;
  color: #718095;
  font-size: 13px;
  line-height: 1.6;
}

.language-options {
  display: flex;
  gap: 10px;
}

.language-options button {
  min-width: 110px;
  padding: 10px 20px;
  border: 1px solid #d8e1eb;
  border-radius: 10px;
  background: #fff;
  color: #516077;
  font: inherit;
  cursor: pointer;
}

.language-options button.is-active {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
  font-weight: 700;
}

.profile-sidebar {
  display: grid;
  gap: 16px;
}

.partner-card {
  padding: 28px;
}

.partner-card > img {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

.partner-card h2 {
  margin: 18px 0 10px;
  font-size: 20px;
}

.partner-card p {
  margin: 0;
  color: #6c7a8e;
  font-size: 14px;
  line-height: 1.7;
}

.partner-card a {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #e8edf3;
  color: #1769c2;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.partner-card a img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.logout-button {
  justify-self: center;
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: #a63d43;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 900px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .personal-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .profile-page {
    padding: 18px 14px 52px;
  }

  .profile-hero {
    min-height: 132px;
    padding: 22px;
    border-radius: 18px;
  }

  .profile-hero__avatar {
    width: 68px;
    height: 68px;
  }

  .profile-hero h1 {
    font-size: 22px;
  }

  .profile-heading,
  .profile-sections,
  .partner-card {
    padding-right: 18px;
    padding-left: 18px;
  }

  .profile-section__content {
    padding-left: 0;
  }

  .password-form {
    padding: 16px;
  }

  .password-form__actions {
    flex-direction: column-reverse;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}
.personal-details__toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; color: #64748b; font-size: 12px; }
.profile-edit-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; padding: 18px; border: 1px solid #e4eaf1; border-radius: 14px; background: #f8fafc; }
.profile-edit-form label { display: grid; gap: 7px; color: #334155; font-size: 12px; font-weight: 700; }
.profile-edit-form label:last-of-type { grid-column: 1 / -1; }
.profile-edit-form .primary-btn { justify-self: start; }
@media (max-width: 640px) { .profile-edit-form { grid-template-columns: 1fr; } .profile-edit-form label:last-of-type { grid-column: auto; } }
</style>
