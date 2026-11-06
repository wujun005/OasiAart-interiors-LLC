<template>
  <div class="supplier-mobile-app" :class="{ 'supplier-mobile-app--single': tabs.length <= 1 }">
    <header class="supplier-mobile-topbar">
      <div class="supplier-mobile-brand">
        <div><strong>Hour<em>X</em></strong><span>{{ words[currentSection] }}</span></div>
      </div>
      <div class="supplier-mobile-tools">
        <button type="button" class="supplier-mobile-tool supplier-mobile-language" :aria-label="words.language" @click="toggleLanguage">{{ locale === 'zh' ? 'EN' : '中' }}</button>
        <button type="button" class="supplier-mobile-tool" :aria-label="words.refresh" @click="refresh"><Refresh aria-hidden="true" /></button>
        <button type="button" class="supplier-mobile-account" :aria-label="words.account" @click="accountOpen = true">{{ accountInitial }}</button>
      </div>
    </header>

    <main class="supplier-mobile-content el-main">
      <div v-if="gatePending" class="supplier-mobile-loading" role="status"><span />{{ words.loading }}</div>
      <RouterView v-else-if="!gateRequired" v-slot="{ Component }"><component :is="Component" :key="refreshTick" /></RouterView>
    </main>

    <div id="supplier-mobile-actions" class="supplier-mobile-actions" />

    <nav v-if="tabs.length > 1" class="supplier-mobile-tabs" :aria-label="words.navigation">
      <button v-for="item in tabs" :key="item.section" type="button" :class="{ 'is-active': currentSection === item.section }" :aria-current="currentSection === item.section ? 'page' : undefined" @click="navigate(item.section)">
        <span class="supplier-mobile-tab-icon"><component :is="item.icon" aria-hidden="true" /><i v-if="item.section === 'pricing' && supplierShelfNoticeUnread" /></span>
        <span>{{ words[item.section] }}</span>
      </button>
    </nav>

    <el-drawer v-model="accountOpen" direction="btt" size="auto" class="supplier-mobile-account-sheet" :title="words.account" append-to-body>
      <div class="supplier-mobile-identity"><span>{{ accountInitial }}</span><div><strong>{{ companyName }}</strong><small>{{ session.me?.supplierNo || words.workspace }}</small></div></div>
      <div class="supplier-mobile-shortcuts">
        <button v-for="item in availablePages" :key="item.section" type="button" @click="navigate(item.section)"><component :is="item.icon" aria-hidden="true" /><span>{{ words[item.section] }}</span><ArrowRight aria-hidden="true" /></button>
      </div>
      <div class="supplier-mobile-account-actions">
        <button type="button" @click="openPassword"><Lock aria-hidden="true" /><span>{{ words.password }}</span><ArrowRight aria-hidden="true" /></button>
        <button type="button" class="is-logout" @click="logout"><SwitchButton aria-hidden="true" /><span>{{ words.logout }}</span></button>
      </div>
    </el-drawer>

    <el-dialog v-model="passwordOpen" class="supplier-mobile-password" :title="words.password" width="min(420px, calc(100vw - 24px))" append-to-body>
      <el-form label-position="top" @submit.prevent="savePassword">
        <el-radio-group v-model="passwordForm.method" class="supplier-mobile-password-method"><el-radio-button value="old">{{ t('admin.login.useOldPassword') }}</el-radio-button><el-radio-button value="code">{{ t('admin.login.useVerifyCode') }}</el-radio-button></el-radio-group>
        <el-form-item v-if="passwordForm.method === 'old'" :label="t('admin.user.form.oldPassword')" required><el-input v-model="passwordForm.oldPassword" type="password" show-password autocomplete="current-password" /></el-form-item>
        <template v-else>
          <el-form-item :label="t('admin.login.phoneLabel')" required><div class="supplier-mobile-phone"><el-select v-model="passwordForm.dialCode"><el-option v-for="item in PHONE_DIAL_OPTIONS" :key="item.value" :value="item.value" :label="item.value" /></el-select><el-input v-model="passwordForm.phone" maxlength="15" inputmode="tel" autocomplete="tel-national" /></div></el-form-item>
          <el-form-item :label="t('admin.login.codeLabel')" required><div class="supplier-mobile-phone"><el-input v-model="passwordForm.code" maxlength="6" inputmode="numeric" autocomplete="one-time-code" /><el-button :disabled="codeWait > 0 || codeSending" @click="sendCode">{{ codeWait ? t('admin.login.resendIn', { seconds: codeWait }) : t('admin.login.sendCode') }}</el-button></div></el-form-item>
        </template>
        <el-form-item :label="t('admin.user.form.newPassword')" required><el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" /></el-form-item>
        <el-form-item :label="t('admin.user.form.confirmPassword')" required><el-input v-model="passwordForm.confirmPassword" type="password" show-password autocomplete="new-password" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="passwordOpen = false">{{ t('admin.user.actions.cancel') }}</el-button><el-button type="primary" :loading="passwordSaving" @click="savePassword">{{ t('admin.user.actions.save') }}</el-button></template>
    </el-dialog>

    <el-dialog v-model="gateRequired" class="supplier-mobile-password" :title="words.initialPassword" width="min(420px, calc(100vw - 24px))" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false" append-to-body>
      <p class="supplier-mobile-gate-note">{{ t('admin.passwordGate.desc') }}</p>
      <el-form label-position="top" @submit.prevent="saveInitialPassword">
        <el-form-item :label="t('admin.login.newPassword')"><el-input v-model="gateForm.password" type="password" show-password autocomplete="new-password" /></el-form-item>
        <el-form-item :label="t('admin.login.confirmPassword')"><el-input v-model="gateForm.confirm" type="password" show-password autocomplete="new-password" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="gateSaving" @click="saveInitialPassword">{{ t('admin.user.actions.save') }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { ArrowRight, House, Tickets, PriceTag, Present, Location, User, UserFilled, Refresh, Lock, SwitchButton } from '@element-plus/icons-vue';
import { ADMIN_LOCALE_STORAGE_KEY } from '@/modules/admin/locales';
import { clearAdminAuthState, getAdminAuthStorageValue } from '@/utils/auth-state';
import { useAdminSessionStore } from '@/modules/admin/stores/session';
import { adminMenuState, isSupplierStaffOrdersOnly, resetAdminMenuPermissions } from '@/modules/admin/utils/menuPermission';
import { canAccessSupplierSection, supplierMobilePath, supplierSectionFromPath, type SupplierMobileSection } from '@/modules/admin/utils/supplierMobile';
import { supplierShelfNoticeUnread } from '@/modules/admin/utils/supplierShelfNotice';
import { setInitialAdminPassword, updateAdminUserPassword } from '@/modules/admin/api/user';
import { resetAdminPassword, sendAdminVerifyCode } from '@/modules/admin/api';
import { DEFAULT_PHONE_DIAL, PHONE_DIAL_OPTIONS, joinPhone, splitPhone } from '@/utils/phone-dial';
import { supplierMobileMessages } from './messages';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n({ useScope: 'global' });
const session = useAdminSessionStore();
const words = computed(() => supplierMobileMessages[locale.value === 'zh' ? 'zh' : 'en']);
const currentSection = computed(() => supplierSectionFromPath(route.path) || 'overview');
const pages = [
  { section: 'overview' as const, icon: House }, { section: 'orders' as const, icon: Tickets },
  { section: 'pricing' as const, icon: PriceTag }, { section: 'package-pricing' as const, icon: Present },
  { section: 'coverage-availability' as const, icon: Location },
  { section: 'profile' as const, icon: User }, { section: 'staff' as const, icon: UserFilled },
];
const isPreview = computed(() => import.meta.env.DEV && route.query.preview === 'supplier');
const individualSupplier = computed(() => Number(session.details[String(session.me?.supplierId || '')]?.supplierType) === 2);
const availablePages = computed(() => pages.filter((page) => {
  if (individualSupplier.value && page.section === 'staff') return false;
  return isPreview.value || canAccessSupplierSection(page.section, adminMenuState.allowedPaths, isSupplierStaffOrdersOnly());
}));
const tabs = computed(() => availablePages.value.filter((page) => page.section !== 'staff' && page.section !== 'package-pricing'));
const companyName = computed(() => session.details[String(session.me?.supplierId)]?.companyName || getAdminAuthStorageValue('username') || words.value.company);
const accountInitial = computed(() => String(companyName.value).trim().slice(0, 1).toUpperCase() || 'H');
const accountOpen = ref(false);
const refreshTick = ref(0);
const passwordOpen = ref(false);
const passwordSaving = ref(false);
const codeSending = ref(false);
const codeWait = ref(0);
let codeTimer = 0;
const passwordForm = reactive({ method: 'old', oldPassword: '', newPassword: '', confirmPassword: '', dialCode: DEFAULT_PHONE_DIAL, phone: '', code: '' });
const gatePending = ref(true);
const gateRequired = ref(false);
const gateSaving = ref(false);
const gateForm = reactive({ password: '', confirm: '' });

const navigate = (section: SupplierMobileSection) => {
  accountOpen.value = false;
  router.push({ path: supplierMobilePath(section), query: isPreview.value ? { preview: 'supplier' } : {} });
};
const toggleLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh';
  localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, locale.value);
  document.documentElement.lang = locale.value;
};
const refresh = () => { session.reset(); refreshTick.value++; };
const openPassword = async () => {
  accountOpen.value = false;
  Object.assign(passwordForm, { method: 'old', oldPassword: '', newPassword: '', confirmPassword: '', code: '', dialCode: DEFAULT_PHONE_DIAL, phone: '' });
  passwordOpen.value = true;
  const parts = splitPhone(session.me?.phone);
  passwordForm.dialCode = parts.code;
  passwordForm.phone = parts.local;
};
const sendCode = async () => {
  if (codeSending.value || codeWait.value) return;
  const phone = joinPhone(passwordForm.dialCode, passwordForm.phone);
  if (!phone) { ElMessage.warning(t('admin.login.phoneRequired')); return; }
  codeSending.value = true;
  try {
    await sendAdminVerifyCode(phone);
    ElMessage.success(t('admin.login.codeSent'));
    codeWait.value = 60;
    window.clearInterval(codeTimer);
    codeTimer = window.setInterval(() => { if (--codeWait.value <= 0) window.clearInterval(codeTimer); }, 1000);
  } catch (error: any) { ElMessage.error(error?.message || t('admin.user.message.passwordSaveFailed')); }
  finally { codeSending.value = false; }
};
const savePassword = async () => {
  if (passwordSaving.value) return;
  const next = passwordForm.newPassword.trim();
  if (next.length < 6) { ElMessage.warning(t('admin.user.validation.passwordMin')); return; }
  if (next !== passwordForm.confirmPassword.trim()) { ElMessage.warning(t('admin.user.validation.passwordMismatch')); return; }
  if (passwordForm.method === 'old' && !passwordForm.oldPassword.trim()) { ElMessage.warning(t('admin.user.validation.oldPasswordRequired')); return; }
  if (passwordForm.method === 'old' && next === passwordForm.oldPassword.trim()) { ElMessage.warning(t('admin.common.passwordSame')); return; }
  const phone = joinPhone(passwordForm.dialCode, passwordForm.phone);
  if (passwordForm.method === 'code' && !phone) { ElMessage.warning(t('admin.login.phoneRequired')); return; }
  if (passwordForm.method === 'code' && !/^\d{6}$/.test(passwordForm.code.trim())) { ElMessage.warning(t('admin.login.codeRequired')); return; }
  passwordSaving.value = true;
  try {
    if (passwordForm.method === 'old') await updateAdminUserPassword({ oldPassword: passwordForm.oldPassword.trim(), newPassword: next });
    else await resetAdminPassword({ phone, verifyCode: passwordForm.code.trim(), newPassword: next });
    ElMessage.success(t('admin.user.message.passwordSaveSuccess'));
    passwordOpen.value = false;
  } catch (error: any) { ElMessage.error(error?.message || t('admin.user.message.passwordSaveFailed')); }
  finally { passwordSaving.value = false; }
};
const saveInitialPassword = async () => {
  if (gateSaving.value) return;
  const next = gateForm.password.trim();
  if (next.length < 6) { ElMessage.warning(t('admin.login.passwordMin')); return; }
  if (next !== gateForm.confirm.trim()) { ElMessage.warning(t('admin.login.passwordMismatch')); return; }
  gateSaving.value = true;
  try {
    await setInitialAdminPassword({ newPassword: next, confirmPassword: gateForm.confirm.trim() });
    gateRequired.value = false;
    Object.assign(gateForm, { password: '', confirm: '' });
    await session.currentUser(true);
    ElMessage.success(t('admin.passwordGate.saved'));
  } catch (error: any) { ElMessage.error(error?.message || t('admin.user.message.passwordSaveFailed')); }
  finally { gateSaving.value = false; }
};
const logout = async () => {
  clearAdminAuthState(); delete axios.defaults.headers.common.Authorization;
  session.reset(); resetAdminMenuPermissions(); supplierShelfNoticeUnread.value = false;
  await router.replace('/admin/login');
};

watch(() => route.path, () => { accountOpen.value = false; document.querySelector('.supplier-mobile-content')?.scrollTo({ top: 0 }); });
onMounted(async () => {
  document.body.classList.add('supplier-mobile-mode');
  try { const me = await session.currentUser(true); gateRequired.value = me?.mustChangePassword === true || me?.mustChangePassword === 1; }
  catch { /* Page-level requests retain their normal authentication handling. */ }
  finally { gatePending.value = false; }
});
onBeforeUnmount(() => { document.body.classList.remove('supplier-mobile-mode'); window.clearInterval(codeTimer); });
</script>

<style scoped>
.supplier-mobile-app { --supplier-mobile-nav-height: 70px; --el-color-primary: #102b44; --el-color-primary-light-9: #eef3f7; --el-border-color: #dce3eb; display: flex; flex-direction: column; height: 100dvh; min-height: 100dvh; overflow: hidden; color: #102b44; background: #f4f6f8; font-family: var(--hx-font-sans, sans-serif); }
.supplier-mobile-app--single { --supplier-mobile-nav-height: 0px; }
.supplier-mobile-topbar { position: sticky; top: 0; z-index: 40; display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; box-sizing: border-box; padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 10px; border-bottom: 1px solid #e4e9ef; background: #fff; }
.supplier-mobile-brand { display: flex; align-items: center; gap: 9px; min-width: 0; }
.supplier-mobile-brand > div { display: grid; gap: 2px; min-width: 0; }
.supplier-mobile-brand strong { color: #102b44; font: 750 24px/1.1 var(--hx-font-sans, sans-serif); letter-spacing: -.05em; }
.supplier-mobile-brand strong em { color: #b4935c; font-style: normal; font-weight: 650; }
.supplier-mobile-brand span { overflow: hidden; color: #64748b; font-size: 10px; font-weight: 550; text-overflow: ellipsis; white-space: nowrap; }
.supplier-mobile-tools { display: flex; align-items: center; gap: 7px; flex: none; }
.supplier-mobile-tool, .supplier-mobile-account { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 1px solid #e4e9ef; border-radius: 10px; background: #fff; color: #344c62; cursor: pointer; }
.supplier-mobile-tool svg { width: 16px; height: 16px; }
.supplier-mobile-language { font-size: 11px; font-weight: 750; }
.supplier-mobile-account { color: #fff; border-color: #132f49; background: #132f49; font-size: 13px; font-weight: 700; }
.supplier-mobile-content { box-sizing: border-box; flex: 1; width: 100%; max-width: 820px; min-width: 0; min-height: 0; margin: 0 auto; padding: 0 0 14px; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; }
.supplier-mobile-actions { box-sizing: border-box; flex: none; width: 100%; max-width: 820px; max-height: 40dvh; margin: 0 auto; overflow-y: auto; }
.supplier-mobile-actions:empty { display: none; }
.supplier-mobile-app--single .supplier-mobile-content { padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px)); }
.supplier-mobile-app--single .supplier-mobile-actions:not(:empty) { padding-bottom: env(safe-area-inset-bottom, 0px); background: #fff; }
.supplier-mobile-tabs { position: relative; z-index: 50; display: flex; flex: none; align-items: stretch; box-sizing: border-box; width: 100%; max-width: 820px; min-height: var(--supplier-mobile-nav-height); margin: 0 auto; padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px)); border: 0; border-top: 1px solid #e4e9ef; border-radius: 0; background: #fff; box-shadow: none; }
.supplier-mobile-tabs > button { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-width: 0; padding: 4px 2px; border: 0; border-radius: 12px; color: #7d8994; background: transparent; font: 600 11px/1.25 var(--hx-font-sans, sans-serif); cursor: pointer; }
.supplier-mobile-tab-icon { position: relative; display: grid; place-items: center; width: 36px; height: 28px; border-radius: 8px; }
.supplier-mobile-tab-icon svg { width: 21px; height: 21px; }
.supplier-mobile-tab-icon i { position: absolute; top: -2px; right: -6px; width: 6px; height: 6px; border: 2px solid #fff; border-radius: 50%; background: #b67c37; }
.supplier-mobile-tabs > button.is-active { color: #102b44; background: transparent; }
.supplier-mobile-tabs > button.is-active .supplier-mobile-tab-icon { background: #edf3f7; }
.supplier-mobile-loading { display: grid; place-items: center; gap: 14px; min-height: 50vh; color: #7b8792; font-size: 13px; }
.supplier-mobile-loading > span { width: 24px; height: 24px; border: 2px solid #e4dbcc; border-top-color: #b28a4d; border-radius: 50%; animation: supplier-mobile-spin .8s linear infinite; }
.supplier-mobile-identity { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.supplier-mobile-identity > span { display: grid; flex: none; place-items: center; width: 48px; height: 48px; border-radius: 14px; color: #f8eedb; background: #142f47; font-size: 20px; }
.supplier-mobile-identity > div { display: grid; gap: 5px; min-width: 0; }
.supplier-mobile-identity strong { color: #142e44; font-size: 16px; overflow-wrap: anywhere; }
.supplier-mobile-identity small { color: #64748b; font-size: 11px; }
.supplier-mobile-shortcuts, .supplier-mobile-account-actions { display: grid; gap: 7px; }
.supplier-mobile-shortcuts { padding-bottom: 16px; border-bottom: 1px solid #e9eef3; }
.supplier-mobile-account-actions { margin-top: 16px; }
.supplier-mobile-shortcuts button, .supplier-mobile-account-actions button { display: flex; align-items: center; gap: 11px; min-height: 44px; padding: 10px 12px; border: 1px solid #e4e9ef; border-radius: 11px; background: #fff; color: #344b60; font: 600 13px/1.4 var(--hx-font-sans, sans-serif); text-align: left; cursor: pointer; }
.supplier-mobile-shortcuts button svg, .supplier-mobile-account-actions button svg { flex: none; width: 18px; height: 18px; color: #8f754a; }
.supplier-mobile-shortcuts button > span, .supplier-mobile-account-actions button > span { flex: 1; }
.supplier-mobile-shortcuts button > svg:last-child, .supplier-mobile-account-actions button > svg:last-child { width: 13px; color: #8a99aa; }
.supplier-mobile-account-actions button.is-logout { color: #9c5047; background: #fff9f6; }
.supplier-mobile-phone { display: flex; gap: 8px; width: 100%; }
.supplier-mobile-phone > .el-select { width: 92px; flex: none; }
.supplier-mobile-password-method { display: flex; margin-bottom: 18px; }
.supplier-mobile-gate-note { color: #71808f; font-size: 13px; line-height: 1.6; }
@keyframes supplier-mobile-spin { to { transform: rotate(360deg); } }
@media (min-width: 821px) { .supplier-mobile-topbar { padding-inline: max(18px, calc((100vw - 784px) / 2)); } }
@media (prefers-reduced-motion: reduce) { .supplier-mobile-loading > span { animation: none; } }
</style>
