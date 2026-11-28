<template>
  <section id="supplier" class="supplier-deletion" aria-labelledby="supplier-deletion-title">
    <span class="supplier-deletion__eyebrow">HOURX SUPPLIER</span>
    <h1 id="supplier-deletion-title">{{ copy.title }}</h1>
    <p>{{ copy.intro }}</p>
    <div class="supplier-deletion__notice">
      <p>{{ copy.scope }}</p>
      <p>{{ copy.timeframe }}</p>
      <p>{{ copy.retention }}</p>
    </div>

    <p v-if="message" role="alert" class="supplier-deletion__error">{{ copy[message] }}</p>
    <form v-if="!signedIn" class="supplier-deletion__form" @submit.prevent="signIn">
      <label for="supplier-deletion-account">{{ copy.account }}</label>
      <input id="supplier-deletion-account" v-model="account" type="tel" autocomplete="username" maxlength="254" required :disabled="busy" />
      <label for="supplier-deletion-sign-in-password">{{ copy.password }}</label>
      <input id="supplier-deletion-sign-in-password" v-model="loginPassword" type="password" autocomplete="current-password" required :disabled="busy" />
      <button type="submit" class="supplier-deletion__primary" :disabled="busy">{{ busy ? copy.signingIn : copy.signIn }}</button>
    </form>

    <template v-else>
      <p v-if="busy" role="status">{{ copy.checking }}</p>
      <div v-if="record" role="status" class="supplier-deletion__notice">
        <h2>{{ record.status === 'REQUESTED' ? copy.requested : copy.processing }}</h2>
        <p>{{ copy.notComplete }}</p>
        <dl>
          <dt>{{ copy.reference }}</dt><dd>{{ record.requestId }}</dd>
          <dt>{{ copy.requestScope }}</dt><dd>{{ record.scope === 'SUPPLIER_ACCOUNT' ? copy.business : copy.staff }}</dd>
        </dl>
      </div>
      <form v-else-if="record === null" class="supplier-deletion__form" @submit.prevent="submitRequest">
        <label for="supplier-deletion-confirm-password">{{ copy.password }}</label>
        <input id="supplier-deletion-confirm-password" v-model="confirmPassword" type="password" autocomplete="current-password" maxlength="1024" required :disabled="busy" />
        <label for="supplier-deletion-confirmation">{{ copy.confirmation }}</label>
        <input id="supplier-deletion-confirmation" v-model="confirmation" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="6" required :disabled="busy" />
        <button type="submit" class="supplier-deletion__danger" :disabled="busy || confirmation !== 'DELETE'">{{ copy.submit }}</button>
      </form>
      <div class="supplier-deletion__tools">
        <button type="button" :disabled="busy" @click="refresh">{{ copy.checkStatus }}</button>
        <button type="button" @click="reset">{{ copy.signOut }}</button>
      </div>
    </template>
    <p class="supplier-deletion__support">{{ copy.support }} <a href="mailto:support@hourxportal.com">support@hourxportal.com</a>. {{ copy.keepPrivate }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import {
  createSupplierDeletionRequest,
  getSupplierDeletionRequest,
  signInForSupplierDeletion,
  SupplierDeletionError,
  type SupplierDeletionRequest,
} from '@/modules/client/api/supplier-account-deletion';

const props = defineProps<{ chinese: boolean }>();
const en = {
  title: 'Delete your HourX Supplier account',
  intro: 'Sign in with the HourX Supplier account you want to delete. You can use this page even after uninstalling the app. Use the separate HourX Home form for a consumer account.',
  scope: 'The supplier account owner can request deletion of the business account and all linked staff accounts. A staff member can request deletion of their own account.',
  timeframe: 'HourX Operations completes eligible requests within 7 business days. Open orders and unsettled payments must be resolved first. If more time is needed, we will tell you why and give you an expected completion date. We will confirm when deletion is complete.',
  retention: 'We remove the account and associated data except records needed for legal, tax or dispute-resolution obligations. Applicable UAE VAT records generally must be kept for at least 5 years and corporate tax records for at least 7 years. Employee names and phone numbers associated with historical orders are anonymised; other copies are deleted. Verification documents are deleted after the applicable post-service and dispute periods, unless a legal obligation requires longer retention.',
  account: 'Supplier account phone number', password: 'Current password', signIn: 'Sign in to continue', signingIn: 'Signing in…',
  checking: 'Checking your request…', confirmation: 'Type DELETE to confirm', submit: 'Submit account deletion request',
  requested: 'Deletion request received', processing: 'Deletion request in progress',
  notComplete: 'Your account has not been deleted yet. You can return to this page and sign in to check the status.',
  reference: 'Request reference', requestScope: 'Account to be deleted', business: 'Supplier business and linked staff accounts', staff: 'Your staff account',
  checkStatus: 'Check request status', signOut: 'Sign out of this page', support: 'For help or to request deletion by email, contact',
  keepPrivate: 'Do not email your password or verification codes.',
  loginFailed: 'We could not sign you in. Check that you are using your HourX Supplier account and try again.',
  unavailable: 'We could not check your request. Please try again.', reauthFailed: 'The password could not be verified. Please check it and try again.',
  rateLimited: 'Too many password attempts. Wait 15 minutes before trying again.',
  expired: 'Your session has expired. Sign in again to continue.',
  unconfirmed: 'We could not confirm whether your request was saved. Check the request status before trying again.',
};
const zh: typeof en = {
  title: '删除您的 HourX Supplier 账户',
  intro: '请登录要注销的 HourX Supplier 账户。即使已卸载 App，也可以使用本页。消费者请使用单独的 HourX Home 表单。',
  scope: '供应商主账号持有人可申请注销企业账户及旗下员工账户。员工可申请注销自己的账户。',
  timeframe: 'HourX 运营会在 7 个工作日内处理符合条件的申请。未完成订单及未结清的款项须先处理。如需延期，我们会通知原因及预计完成日期，并在注销完成后通知您。',
  retention: '我们将删除账户及关联数据，法律、税务或解决争议需要保留的记录除外。适用的阿联酋 VAT 记录通常至少保留 5 年，企业所得税记录至少保留 7 年。与历史订单相关的员工姓名和电话将匿名化，其他副本将删除。验证证件在适用的售后及争议期结束后删除，法律要求延长保留的除外。',
  account: '供应商账户手机号', password: '当前密码', signIn: '登录后继续', signingIn: '正在登录…',
  checking: '正在查询申请…', confirmation: '请输入 DELETE 确认', submit: '提交注销申请',
  requested: '已收到注销申请', processing: '注销申请处理中',
  notComplete: '您的账户尚未删除。您可返回本页登录后查询进度。',
  reference: '申请编号', requestScope: '注销范围', business: '供应商企业账户及旗下员工账户', staff: '您的员工账户',
  checkStatus: '查询申请进度', signOut: '退出本页登录', support: '如需帮助或通过邮件申请注销，请联系',
  keepPrivate: '请勿通过邮件发送密码或验证码。',
  loginFailed: '暂时无法登录。请检查您使用的 HourX Supplier 账户及密码后再试。',
  unavailable: '当前无法查询申请，请稍后重试。', reauthFailed: '密码未通过验证，请核对后重试。',
  rateLimited: '密码尝试次数过多，请等待 15 分钟后重试。',
  expired: '登录已过期，请重新登录后继续。',
  unconfirmed: '未能确认申请是否已保存。请先查询申请进度，再决定是否重试。',
};
const copy = computed(() => props.chinese ? zh : en);
const account = ref('');
const loginPassword = ref('');
const confirmPassword = ref('');
const confirmation = ref('');
const signedIn = ref(false);
const busy = ref(false);
const record = shallowRef<SupplierDeletionRequest | null | undefined>(undefined);
const message = ref<'' | 'loginFailed' | 'unavailable' | 'reauthFailed' | 'rateLimited' | 'expired' | 'unconfirmed'>('');
let sessionToken = '';
let active: AbortController | null = null;

function clearForm() {
  loginPassword.value = '';
  confirmPassword.value = '';
  confirmation.value = '';
}

function reset() {
  active?.abort();
  active = null;
  account.value = '';
  clearForm();
  sessionToken = '';
  signedIn.value = false;
  busy.value = false;
  record.value = undefined;
  message.value = '';
}

function begin() {
  active = new AbortController();
  busy.value = true;
  message.value = '';
  return active;
}

const expired = (error: unknown) => error instanceof SupplierDeletionError && error.httpStatus === 401;

function finish(run: AbortController) {
  if (active !== run) return;
  active = null;
  busy.value = false;
}

async function signIn() {
  if (busy.value || signedIn.value || !account.value.trim() || !loginPassword.value) return;
  const run = begin();
  const login = signInForSupplierDeletion(account.value, loginPassword.value, run.signal);
  loginPassword.value = '';
  try {
    const token = await login;
    if (active !== run) return;
    sessionToken = token;
    signedIn.value = true;
    account.value = '';
    await check(run);
  } catch {
    if (active === run) message.value = 'loginFailed';
  } finally {
    finish(run);
  }
}

async function check(run: AbortController) {
  try {
    const result = await getSupplierDeletionRequest(sessionToken, run.signal);
    if (active === run) record.value = result;
  } catch (error) {
    if (active !== run) return;
    if (expired(error)) { reset(); message.value = 'expired'; }
    else { record.value = undefined; message.value = 'unavailable'; }
  }
}

async function refresh() {
  if (busy.value || !signedIn.value) return;
  const run = begin();
  clearForm();
  try { await check(run); }
  finally { finish(run); }
}

async function submitRequest() {
  if (busy.value || !signedIn.value || record.value !== null || !confirmPassword.value || confirmation.value !== 'DELETE') return;
  const run = begin();
  const request = createSupplierDeletionRequest(confirmPassword.value, sessionToken, run.signal);
  clearForm();
  try {
    const result = await request;
    if (active === run) record.value = result;
  } catch (error) {
    if (active !== run) return;
    if (error instanceof SupplierDeletionError && error.code === 'REAUTH_FAILED') {
      message.value = 'reauthFailed';
    } else if (error instanceof SupplierDeletionError && error.code === 'REAUTH_RATE_LIMITED') {
      message.value = 'rateLimited';
    } else if (expired(error)) {
      reset();
      message.value = 'expired';
    } else {
      await check(run);
      if (active === run && !record.value) {
        record.value = undefined;
        message.value = 'unconfirmed';
      }
    }
  } finally {
    finish(run);
  }
}

onMounted(() => window.addEventListener('pagehide', reset));
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', reset);
  reset();
});
</script>

<style scoped>
.supplier-deletion { scroll-margin-top: 96px; padding: clamp(18px, 4vw, 28px); border: 1px solid #e4e1d8; border-radius: 18px; background: #fff; color: #06182f; }
.supplier-deletion__eyebrow { color: #755f3c; font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.supplier-deletion h1 { margin: 12px 0; font-size: clamp(24px, 5vw, 32px); line-height: 1.2; }
.supplier-deletion h2 { font-size: 20px; margin: 0 0 6px; }
.supplier-deletion p, .supplier-deletion dl { font-size: 14px; line-height: 1.65; overflow-wrap: anywhere; }
.supplier-deletion__notice { margin: 16px 0; border-radius: 12px; padding: 12px 16px; background: #f7f6f3; }
.supplier-deletion__notice p { margin: 4px 0 8px; }
.supplier-deletion dl { margin-bottom: 0; }
.supplier-deletion dt { font-weight: 700; }
.supplier-deletion dd { margin: 0 0 8px; }
.supplier-deletion__form { display: grid; gap: 9px; max-width: 460px; margin: 20px 0 14px; }
.supplier-deletion label { font-size: 14px; font-weight: 600; }
.supplier-deletion input { width: 100%; min-width: 0; min-height: 46px; box-sizing: border-box; border: 1px solid #aeb4be; border-radius: 9px; padding: 10px 12px; font: inherit; font-size: 16px; }
.supplier-deletion input + label { margin-top: 6px; }
.supplier-deletion button { justify-self: start; padding: 10px 16px; min-height: 44px; border: 1px solid #c5c9d1; border-radius: 9px; background: #fff; color: #06182f; font: inherit; font-weight: 600; cursor: pointer; }
.supplier-deletion__tools { display: flex; flex-wrap: wrap; gap: 8px; }
.supplier-deletion button.supplier-deletion__primary { background: #06182f; color: #fff; border-color: #06182f; }
.supplier-deletion button.supplier-deletion__danger { background: #aa2020; color: #fff; border-color: #aa2020; }
.supplier-deletion button:disabled { opacity: .6; cursor: default; }
.supplier-deletion__support { margin: 20px 0 0; }
.supplier-deletion__support a { color: #1d4ed8; text-decoration: underline; }
.supplier-deletion__error { color: #a01d20; font-weight: 600; }
</style>
