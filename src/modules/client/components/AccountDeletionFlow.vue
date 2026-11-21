<template>
  <section class="deletion-flow" :aria-label="t('client.accountDeletion.title')">
    <div class="deletion-flow__heading">
      <span class="deletion-flow__eyebrow">{{ t('client.accountDeletion.eyebrow') }}</span>
      <select :value="locale === 'zh' ? 'zh' : 'en'" :aria-label="t('client.accountDeletion.language')" @change="changeLanguage">
        <option value="en">English</option><option value="zh">中文</option>
      </select>
    </div>
    <h1>{{ t('client.accountDeletion.title') }}</h1>
    <p>{{ t('client.accountDeletion.intro') }}</p>
    <div class="deletion-flow__notice">
      <p>{{ t('client.accountDeletion.timeframe', { days: record?.completionWithinBusinessDays || 7 }) }}</p>
      <p>{{ t('client.accountDeletion.obligations') }}</p>
      <p>{{ t('client.accountDeletion.retention') }}</p>
    </div>

    <div v-if="!signedIn" class="deletion-flow__state">
      <p>{{ t('client.accountDeletion.signInHint') }}</p>
      <button type="button" class="deletion-flow__primary" @click="signIn">{{ t('client.accountDeletion.signIn') }}</button>
    </div>
    <template v-else>
      <p v-if="accountLabel" class="deletion-flow__account">{{ t('client.accountDeletion.account') }}: <strong>{{ accountLabel }}</strong></p>
      <p v-if="loading" role="status">{{ t('client.accountDeletion.loading') }}</p>
      <p v-if="errorKey" class="deletion-flow__error" role="alert">{{ t(`client.accountDeletion.${errorKey}`) }}</p>
      <button v-if="errorKey === 'signInRequired'" type="button" class="deletion-flow__primary" @click="signIn">{{ t('client.accountDeletion.signIn') }}</button>
      <section v-if="record && record.status !== 'none'" class="deletion-flow__state" role="status" aria-live="polite">
        <h2>{{ t(`client.accountDeletion.${record.status}Title`) }}</h2>
        <p>{{ t(`client.accountDeletion.${record.status}Body`) }}</p>
        <dl>
          <template v-if="record.requestId"><dt>{{ t('client.accountDeletion.requestId') }}</dt><dd>{{ record.requestId }}</dd></template>
          <template v-if="record.requestedAt"><dt>{{ t('client.accountDeletion.requestedAt') }}</dt><dd>{{ formatDate(record.requestedAt) }}</dd></template>
          <template v-if="record.completedAt"><dt>{{ t('client.accountDeletion.completedAt') }}</dt><dd>{{ formatDate(record.completedAt) }}</dd></template>
        </dl>
      </section>
      <form v-if="record?.status === 'none' && !loading && errorKey !== 'signInRequired'" class="deletion-flow__form" @submit.prevent="submitRequest">
        <label for="account-deletion-password">{{ t('client.accountDeletion.password') }}</label>
        <input id="account-deletion-password" v-model="password" type="password" autocomplete="current-password" :disabled="submitting" :aria-describedby="'account-deletion-password-hint'" />
        <small id="account-deletion-password-hint">{{ t('client.accountDeletion.passwordHint') }}</small>
        <label for="account-deletion-confirmation">{{ t('client.accountDeletion.confirmation') }}</label>
        <input id="account-deletion-confirmation" v-model="confirmation" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" :disabled="submitting" />
        <button type="submit" class="deletion-flow__danger" :disabled="submitting">{{ t(`client.accountDeletion.${submitting ? 'submitting' : 'submit'}`) }}</button>
      </form>
      <button type="button" class="deletion-flow__secondary" :disabled="loading || submitting" @click="refreshStatus">{{ t('client.accountDeletion.checkStatus') }}</button>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getAccountDeletionStatus, submitAccountDeletionRequest, type AccountDeletionStatus } from '@/modules/client/api/account-deletion';
import { getStoredAuthSnapshot, type StoredAuthSnapshot } from '@/utils/auth-state';
import { setClientLocale } from '@/modules/client/locales';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();
const auth = shallowRef(getStoredAuthSnapshot());
const signedIn = computed(() => auth.value.isLoggedIn);
const record = shallowRef<AccountDeletionStatus | null>(null);
const password = ref('');
const confirmation = ref('');
const loading = ref(false);
const submitting = ref(false);
const errorKey = ref('');
let alive = true;
let sequence = 0;

const ownerKey = (value: StoredAuthSnapshot) => value.isLoggedIn ? `${value.token || ''}\0${value.userInfo.userId || ''}` : '';
const accountLabel = computed(() => {
  const user = auth.value.userInfo;
  const value = user.email || user.phone || user.username || '';
  if (value.includes('@')) {
    const [name = '', domain = ''] = value.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (/^[+\d\s()-]+$/.test(value)) return `${value.slice(0, 3)}••••${value.slice(-4)}`;
  return value;
});

const syncAuth = () => {
  const next = getStoredAuthSnapshot();
  const changed = ownerKey(next) !== ownerKey(auth.value);
  auth.value = next;
  if (changed) {
    sequence++;
    record.value = null;
    password.value = '';
    confirmation.value = '';
    loading.value = false;
    submitting.value = false;
    errorKey.value = next.isLoggedIn ? 'accountChanged' : '';
  }
  return changed;
};
const current = (owner: string, stamp: number) => alive && sequence === stamp && owner !== '' && ownerKey(getStoredAuthSnapshot()) === owner;
const applyStatus = (value: AccountDeletionStatus) => {
  record.value = value;
  if (value.status !== 'none') {
    password.value = '';
    confirmation.value = '';
  }
};

const refreshStatus = async () => {
  syncAuth();
  if (!signedIn.value || submitting.value) return;
  const owner = ownerKey(auth.value);
  const token = auth.value.token!;
  const stamp = ++sequence;
  loading.value = true;
  errorKey.value = '';
  try {
    const value = await getAccountDeletionStatus(token);
    if (current(owner, stamp)) applyStatus(value);
  } catch (error: any) {
    if (current(owner, stamp)) errorKey.value = error?.status === 401 ? 'signInRequired' : 'unavailable';
  } finally {
    if (current(owner, stamp)) loading.value = false;
    else if (alive && sequence === stamp) syncAuth();
  }
};

const submitRequest = async () => {
  if (syncAuth() || !signedIn.value || submitting.value || loading.value || record.value?.status !== 'none') return;
  if (!password.value.length) { errorKey.value = 'passwordRequired'; return; }
  if (confirmation.value !== 'DELETE') { errorKey.value = 'confirmationRequired'; return; }
  const owner = ownerKey(auth.value);
  const token = auth.value.token!;
  const stamp = ++sequence;
  submitting.value = true;
  errorKey.value = '';
  try {
    const value = await submitAccountDeletionRequest(password.value, token);
    if (current(owner, stamp)) applyStatus(value);
  } catch (error: any) {
    if (!current(owner, stamp)) return;
    if (error?.code === 'REAUTH_FAILED') {
      password.value = '';
      errorKey.value = 'reauthFailed';
    } else if (error?.code === 'CONFIRMATION_REQUIRED') {
      errorKey.value = 'confirmationRequired';
    } else if (error?.status === 401) {
      errorKey.value = 'signInRequired';
    } else {
      // A timeout is ambiguous: read the durable record once rather than
      // submitting again or claiming the account was deleted.
      password.value = '';
      try {
        const value = await getAccountDeletionStatus(token);
        if (!current(owner, stamp)) return;
        applyStatus(value);
        errorKey.value = value.status === 'none' ? 'unconfirmed' : '';
      } catch {
        if (current(owner, stamp)) errorKey.value = 'unconfirmed';
      }
    }
  } finally {
    if (current(owner, stamp)) submitting.value = false;
    else if (alive && sequence === stamp) syncAuth();
  }
};

const signIn = () => router.push({ name: route.name === 'h5-account-deletion' ? 'h5-login' : 'login', query: { redirect: '/data-deletion' } });
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' }).format(new Date(value));
const changeLanguage = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  locale.value = setClientLocale(value);
  if (route.name === 'h5-account-deletion') localStorage.setItem('h5-locale', locale.value);
};
const resume = () => {
  const changed = syncAuth();
  if (changed || (!loading.value && !submitting.value)) void refreshStatus();
};
onMounted(() => {
  window.addEventListener('storage', resume);
  window.addEventListener('focus', resume);
  void refreshStatus();
});
onUnmounted(() => {
  alive = false;
  sequence++;
  password.value = '';
  window.removeEventListener('storage', resume);
  window.removeEventListener('focus', resume);
});
</script>

<style scoped>
.deletion-flow { padding: 24px; border: 1px solid #e8e4dd; border-radius: 18px; background: #fff; color: #06182f; font-family: var(--hourx-client-font-family, Arial, sans-serif); }
.deletion-flow__heading { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
.deletion-flow__eyebrow { color: #8a7350; font-size: 12px; font-weight: 700; letter-spacing: .1em; }
.deletion-flow select { min-height: 40px; max-width: 100%; padding: 6px 10px; border: 1px solid #e8e4dd; border-radius: 8px; background: white; font: inherit; }
.deletion-flow h1 { margin: 18px 0 12px; font-size: clamp(24px, 5vw, 32px); line-height: 1.2; }
.deletion-flow h2 { font-size: 20px; margin: 0 0 10px; }
.deletion-flow p { font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
.deletion-flow__notice { margin: 20px 0; padding: 12px 16px; background: #f7f6f3; border-radius: 12px; }
.deletion-flow__notice p { margin: 6px 0; }
.deletion-flow__account { margin: 20px 0 12px; }
.deletion-flow__state { margin-top: 20px; }
.deletion-flow__state dl { margin: 16px 0; font-size: 13px; }
.deletion-flow__state dt { color: #666b73; margin-top: 12px; }
.deletion-flow__state dd { margin: 4px 0; overflow-wrap: anywhere; }
.deletion-flow__form { display: flex; flex-direction: column; margin: 18px 0; gap: 9px; }
.deletion-flow__form label { font-size: 14px; font-weight: 600; }
.deletion-flow__form label:not(:first-child) { margin-top: 12px; }
.deletion-flow__form input { min-width: 0; width: 100%; min-height: 48px; box-sizing: border-box; padding: 12px; border: 1px solid #b7bbc0; border-radius: 9px; font: inherit; font-size: 16px; }
.deletion-flow__form small { color: #666b73; line-height: 1.5; }
.deletion-flow button { padding: 12px 18px; min-height: 46px; border-radius: 10px; font: inherit; font-weight: 600; cursor: pointer; white-space: normal; }
.deletion-flow button:focus-visible, .deletion-flow input:focus-visible, .deletion-flow select:focus-visible { outline: 3px solid #b89a72; outline-offset: 3px; }
.deletion-flow__primary { color: #fff; background: #06182f; border: 1px solid #06182f; }
.deletion-flow__secondary { color: #06182f; background: #fff; border: 1px solid #e8e4dd; margin-top: 16px; }
.deletion-flow__danger { color: #fff; background: #a52b27; border: 1px solid #a52b27; margin-top: 14px; }
.deletion-flow button:disabled { cursor: default; opacity: .55; }
.deletion-flow__error { color: #a52b27; }
@media (max-width: 480px) { .deletion-flow { padding: 20px 16px; border-radius: 14px; } .deletion-flow__form button { width: 100%; } }
</style>
