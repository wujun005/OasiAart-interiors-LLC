<template>
  <div class="h5-profile-page">
    <main class="h5-profile-main">
      <section class="h5-profile-hero">
        <div class="h5-profile-hero__avatar">
          <img :src="avatarIconUrl" alt="" />
        </div>
        <div class="h5-profile-hero__text">
          <h1>{{ displayName }}</h1>
          <p v-if="displayPhone" class="h5-profile-hero__phone">{{ displayPhone }}</p>
          <p v-if="displayEmail" class="h5-profile-hero__email" :title="displayEmail">
            {{ displayEmail }}
          </p>
          <p v-if="!displayPhone && !displayEmail" class="h5-profile-hero__fallback">
            {{ t('h5.profile.defaultAccount') }}
          </p>
        </div>
      </section>

      <section class="h5-profile-card h5-profile-card--menu">
        <div class="h5-profile-item" :class="{ 'h5-profile-item--open': activeSection === 'personal' }">
          <button class="h5-profile-row" type="button" @click="toggleSection('personal')">
            <span class="h5-profile-row__left">
              <van-icon name="contact-o" />
              <span>{{ t('h5.profile.menu.personal') }}</span>
            </span>
            <van-icon class="h5-profile-row__arrow" name="arrow" />
          </button>
          <div v-if="activeSection === 'personal'" class="h5-profile-panel">
            <button class="h5-profile-edit-toggle" type="button" @click="profileEditing ? cancelProfileEdit() : startProfileEdit()">
              {{ profileEditing ? (locale === 'zh' ? '取消' : 'Cancel') : (locale === 'zh' ? '编辑个人信息' : 'Edit profile') }}
            </button>
            <form v-if="profileEditing" class="h5-profile-edit-form" @submit.prevent="saveProfile">
              <label><span>{{ t('h5.profile.personal.name') }}</span><input v-model.trim="profileForm.name" type="text" autocomplete="name" /></label>
              <label><span>{{ t('h5.profile.personal.phone') }}</span><input v-model.trim="profileForm.phone" type="tel" autocomplete="tel" /></label>
              <label><span>{{ t('h5.profile.personal.email') }}</span><input v-model.trim="profileForm.email" type="email" autocomplete="email" /></label>
              <button type="submit" :disabled="profileSubmitting">{{ profileSubmitting ? (locale === 'zh' ? '保存中…' : 'Saving…') : (locale === 'zh' ? '保存个人信息' : 'Save profile') }}</button>
            </form>
            <dl v-else class="h5-profile-details">
              <div>
                <dt>{{ t('h5.profile.personal.name') }}</dt>
                <dd>{{ profileName || t('h5.profile.notProvided') }}</dd>
              </div>
              <div>
                <dt>{{ t('h5.profile.personal.phone') }}</dt>
                <dd>{{ displayPhone || t('h5.profile.notProvided') }}</dd>
              </div>
              <div>
                <dt>{{ t('h5.profile.personal.email') }}</dt>
                <dd class="h5-profile-details__email" :title="displayEmail">
                  {{ displayEmail || t('h5.profile.notProvided') }}
                </dd>
              </div>
            </dl>
            <button class="h5-profile-inline-link" type="button" @click="goSecurity">
              <span>
                <strong>{{ t('h5.profile.personal.password') }}</strong>
                <small>••••••••</small>
              </span>
              <span class="h5-profile-inline-link__action">
                {{ t('h5.profile.personal.changePassword') }}
                <van-icon name="arrow" />
              </span>
            </button>
          </div>
        </div>

        <div class="h5-profile-item" :class="{ 'h5-profile-item--open': activeSection === 'addresses' }">
          <button class="h5-profile-row" type="button" @click="toggleSection('addresses')">
            <span class="h5-profile-row__left">
              <van-icon name="location-o" />
              <span>{{ t('h5.profile.menu.addresses') }}</span>
            </span>
            <van-icon class="h5-profile-row__arrow" name="arrow" />
          </button>
          <div v-if="activeSection === 'addresses'" class="h5-profile-panel">
            <button v-if="checkoutReturnPath" class="h5-profile-return-checkout" type="button" @click="router.push(checkoutReturnPath)">
              ← {{ locale === 'zh' ? '返回订单确认' : 'Back to checkout' }}
            </button>
            <SavedAddressManager />
          </div>
        </div>

        <div class="h5-profile-item" :class="{ 'h5-profile-item--open': activeSection === 'payments' }">
          <button class="h5-profile-row" type="button" @click="toggleSection('payments')">
            <span class="h5-profile-row__left">
              <van-icon name="balance-o" />
              <span>{{ t('h5.profile.menu.payments') }}</span>
            </span>
            <van-icon class="h5-profile-row__arrow" name="arrow" />
          </button>
          <div v-if="activeSection === 'payments'" class="h5-profile-panel">
            <p class="h5-profile-empty">{{ t('h5.profile.payments.empty') }}</p>
            <p class="h5-profile-panel__note">{{ t('h5.profile.payments.note') }}</p>
          </div>
        </div>

        <div class="h5-profile-item" :class="{ 'h5-profile-item--open': activeSection === 'notifications' }">
          <button class="h5-profile-row" type="button" @click="toggleSection('notifications')">
            <span class="h5-profile-row__left">
              <van-icon name="bell" />
              <span>{{ t('h5.profile.menu.notifications') }}</span>
            </span>
            <van-icon class="h5-profile-row__arrow" name="arrow" />
          </button>
          <div v-if="activeSection === 'notifications'" class="h5-profile-panel h5-profile-panel--settings">
            <label class="h5-profile-setting">
              <span>
                <strong>{{ t('h5.profile.notifications.bookingTitle') }}</strong>
                <small>{{ t('h5.profile.notifications.bookingDesc') }}</small>
              </span>
              <van-switch v-model="bookingNotifications" size="20px" active-color="var(--hourx-brand)" />
            </label>
            <label class="h5-profile-setting">
              <span>
                <strong>{{ t('h5.profile.notifications.offersTitle') }}</strong>
                <small>{{ t('h5.profile.notifications.offersDesc') }}</small>
              </span>
              <van-switch v-model="offerNotifications" size="20px" active-color="var(--hourx-brand)" />
            </label>
          </div>
        </div>

        <div class="h5-profile-item" :class="{ 'h5-profile-item--open': activeSection === 'support' }">
          <button class="h5-profile-row" type="button" @click="toggleSection('support')">
            <span class="h5-profile-row__left">
              <van-icon name="service-o" />
              <span>{{ t('h5.profile.menu.support') }}</span>
            </span>
            <van-icon class="h5-profile-row__arrow" name="arrow" />
          </button>
          <div v-if="activeSection === 'support'" class="h5-profile-panel h5-profile-panel--support">
            <p>{{ t('h5.profile.support.description') }}</p>
            <div class="h5-profile-faq">
              <strong>{{ t('h5.profile.support.faqTitle') }}</strong>
              <dl>
                <div>
                  <dt>{{ t('h5.profile.support.bookingQuestion') }}</dt>
                  <dd>{{ t('h5.profile.support.bookingAnswer') }}</dd>
                </div>
                <div>
                  <dt>{{ t('h5.profile.support.ordersQuestion') }}</dt>
                  <dd>{{ t('h5.profile.support.ordersAnswer') }}</dd>
                </div>
              </dl>
            </div>
            <div class="h5-profile-support-actions">
              <a :href="supportLink" target="_blank" rel="noopener noreferrer">
                <van-icon name="chat-o" />
                <span>{{ t('h5.profile.support.whatsapp') }}</span>
              </a>
              <a :href="`mailto:${supportEmail}`">
                <van-icon name="envelop-o" />
                <span>{{ supportEmail }}</span>
              </a>
            </div>
          </div>
        </div>

        <div class="h5-profile-item">
          <button class="h5-profile-row" type="button" @click="toggleLocale">
            <span class="h5-profile-row__left">
              <van-icon name="exchange" />
              <span>{{ t('h5.profile.menu.language') }}</span>
            </span>
            <span class="h5-profile-row__value">{{ localeLabel }}</span>
          </button>
        </div>
      </section>

      <section class="h5-profile-card h5-profile-card--partner">
        <div class="h5-profile-card__title">
          <img :src="joinIconUrl" alt="" />
          <span>{{ t('h5.profile.partner.title') }}</span>
        </div>
        <p class="h5-profile-card__desc">{{ t('h5.profile.partner.desc') }}</p>
        <button class="h5-profile-mail" type="button" @click="openPartnerMail">
          <img :src="mailIconUrl" alt="" />
          <span>{{ partnerEmail }}</span>
        </button>
      </section>

      <button class="h5-profile-logout" type="button" @click="handleLogout">
        {{ t('h5.profile.logOut') }}
      </button>
    </main>

    <nav class="h5-profile-tabbar">
      <button class="h5-profile-tabbar__item" type="button" @click="router.push({ name: 'h5-home' })">
        <van-icon name="home-o" />
        <span>{{ t('client.header.nav.home') }}</span>
      </button>
      <button class="h5-profile-tabbar__item" type="button" @click="router.push({ name: 'h5-cart' })">
        <span class="h5-profile-tabbar__cart-icon">
          <van-icon name="cart-o" />
          <b v-if="cartCount">{{ cartCount > 99 ? '99+' : cartCount }}</b>
        </span>
        <span>{{ t('client.header.nav.cart') }}</span>
      </button>
      <button class="h5-profile-tabbar__item" type="button" @click="router.push({ name: 'h5-orders' })">
        <van-icon name="orders-o" />
        <span>{{ t('client.header.nav.orders') }}</span>
      </button>
      <button class="h5-profile-tabbar__item h5-profile-tabbar__item--active" type="button">
        <van-icon name="contact-o" />
        <span>{{ t('client.header.profile') }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showConfirmDialog, showFailToast, showSuccessToast } from 'vant';
import { getClientProfile, updateClientProfile, type ClientProfileRecord } from '@/modules/client/api';
import { setClientLocale } from '@/modules/client/locales';
import { useAuth } from '@/modules/h5/composables/useAuth';
import { useCart } from '@/modules/client/composables/useCart';
import SavedAddressManager from '@/modules/client/components/SavedAddressManager.vue';

type ProfileSection = 'personal' | 'addresses' | 'payments' | 'notifications' | 'support';

const avatarIconUrl = new URL('@/assets/images/client/icon13.png', import.meta.url).href;
const joinIconUrl = new URL('@/assets/images/client/icon16.png', import.meta.url).href;
const mailIconUrl = new URL('@/assets/images/client/email.png', import.meta.url).href;
const supportLink = 'https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F';
const supportEmail = 'support@hourxportal.com';
const partnerEmail = 'partners@hourxportal.com';
const bookingNotificationKey = 'hourx-h5-booking-notifications';
const offerNotificationKey = 'hourx-h5-offer-notifications';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const route = useRoute();
const { cartCount } = useCart();
const { isLoggedIn, userInfo, clearAuth, checkLoginStatus } = useAuth();
const activeSection = ref<ProfileSection | ''>('');
const profileData = ref<ClientProfileRecord | null>(null);
const profileEditing = ref(false);
const profileSubmitting = ref(false);
const profileForm = ref({ name: '', phone: '', email: '' });
const bookingNotifications = ref(true);
const offerNotifications = ref(false);

const maskPhone = (value?: string) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const digits = text.replace(/[^\d+]/g, '');
  if (digits.length <= 7) return text;
  return digits.replace(/(\+?\d{3})\d+(\d{4})$/, '$1****$2');
};

const isEmailAccount = (value?: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isPhoneAccount = (value?: string) => {
  const text = String(value || '').trim();
  return /^\+?[\d\s()-]+$/.test(text) && text.replace(/\D/g, '').length >= 7;
};

const profileName = computed(() => {
  const username = String(profileData.value?.name || userInfo.value.username || '').trim();
  return username && !isEmailAccount(username) && !isPhoneAccount(username)
    ? username
    : '';
});
const displayName = computed(() => profileName.value || t('h5.profile.defaultName'));
const displayPhone = computed(() => {
  const storedPhone = String(profileData.value?.phone || userInfo.value.phone || '').trim();
  const username = String(userInfo.value.username || '').trim();
  return maskPhone(storedPhone || (isPhoneAccount(username) ? username : ''));
});
const displayEmail = computed(() => {
  const storedEmail = String(profileData.value?.email || userInfo.value.email || '').trim();
  const username = String(userInfo.value.username || '').trim();
  return storedEmail || (isEmailAccount(username) ? username : '');
});
const localeLabel = computed(() =>
  locale.value === 'zh' ? t('client.header.languageZh') : t('client.header.languageEn'),
);
const checkoutReturnPath = computed(() => {
  const value = Array.isArray(route.query.returnTo) ? route.query.returnTo[0] : route.query.returnTo;
  return typeof value === 'string' && value.startsWith('/orders/confirm') ? value : '';
});

const loadProfile = async () => {
  try { profileData.value = await getClientProfile(); } catch (error) { console.error('load profile failed:', error); }
};
const startProfileEdit = () => {
  profileForm.value = {
    name: profileData.value?.name || profileName.value,
    phone: profileData.value?.phone || String(userInfo.value.phone || ''),
    email: profileData.value?.email || displayEmail.value,
  };
  profileEditing.value = true;
};
const cancelProfileEdit = () => { profileEditing.value = false; };
const saveProfile = async () => {
  const payload = { ...profileForm.value };
  if (!payload.name && !payload.phone && !payload.email) {
    showFailToast(locale.value === 'zh' ? '请至少填写一项个人信息' : 'Please provide at least one profile field');
    return;
  }
  profileSubmitting.value = true;
  try {
    profileData.value = await updateClientProfile(payload);
    profileEditing.value = false;
    showSuccessToast(locale.value === 'zh' ? '个人信息已更新' : 'Profile updated');
  } catch (error: any) {
    showFailToast(error?.message || (locale.value === 'zh' ? '个人信息更新失败' : 'Failed to update profile'));
  } finally { profileSubmitting.value = false; }
};

const ensureLogin = async () => {
  checkLoginStatus();
  if (isLoggedIn.value) return true;
  await router.replace({
    name: 'h5-login',
    query: { redirect: route.fullPath },
  });
  return false;
};

const toggleSection = (section: ProfileSection) => {
  activeSection.value = activeSection.value === section ? '' : section;
};

const goSecurity = () => router.push({ name: 'h5-profile-security' });
const openPartnerMail = () => {
  window.location.href = `mailto:${partnerEmail}`;
};
const toggleLocale = () => {
  const target = locale.value === 'zh' ? 'en' : 'zh';
  locale.value = target;
  localStorage.setItem('h5-locale', target);
  setClientLocale(target);
};

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: t('h5.profile.logoutConfirm.title'),
      message: t('h5.profile.logoutConfirm.message'),
      confirmButtonText: t('h5.profile.logoutConfirm.confirm'),
      cancelButtonText: t('h5.profile.logoutConfirm.cancel'),
    });
  } catch {
    return;
  }
  clearAuth();
  showSuccessToast(t('h5.profile.logoutSuccess'));
  await router.replace({ name: 'h5-home' });
};

watch(
  () => route.query.section,
  (value) => {
    const section = Array.isArray(value) ? value[0] : value;
    if (section === 'personal' || section === 'addresses' || section === 'payments' || section === 'notifications' || section === 'support') {
      activeSection.value = section;
    }
  },
  { immediate: true },
);

watch(bookingNotifications, (value) => localStorage.setItem(bookingNotificationKey, String(value)));
watch(offerNotifications, (value) => localStorage.setItem(offerNotificationKey, String(value)));

onMounted(async () => {
  const loggedIn = await ensureLogin();
  if (!loggedIn) return;
  bookingNotifications.value = localStorage.getItem(bookingNotificationKey) !== 'false';
  offerNotifications.value = localStorage.getItem(offerNotificationKey) === 'true';
  await loadProfile();
});
</script>

<style scoped lang="scss">
.h5-profile-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(76px + env(safe-area-inset-bottom));
}

.h5-profile-return-checkout {
  margin: 0 0 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font-size: 12px;
  font-weight: 800;
}

.h5-profile-main {
  max-width: 393px;
  margin: 0 auto;
  min-height: calc(100vh - 56px);
  padding-bottom: 20px;
}

.h5-profile-hero {
  height: 124px;
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--hourx-brand);
  position: relative;
  overflow: hidden;
}

.h5-profile-hero::before,
.h5-profile-hero::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.11);
}

.h5-profile-hero::before {
  width: 210px;
  height: 210px;
  right: -78px;
  top: -102px;
  filter: blur(52px);
}

.h5-profile-hero::after {
  width: 150px;
  height: 150px;
  left: -44px;
  top: 30px;
  filter: blur(38px);
}

.h5-profile-hero__avatar,
.h5-profile-hero__text {
  position: relative;
  z-index: 1;
}

.h5-profile-hero__avatar {
  width: 58px;
  height: 58px;
  border: 2px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
  flex: 0 0 auto;
}

.h5-profile-hero__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h5-profile-hero__text {
  min-width: 0;
  max-width: calc(100% - 72px);
}

.h5-profile-hero__text h1 {
  margin: 0;
  color: #fff;
  font-size: 19px;
  line-height: 1.35;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h5-profile-hero__text p {
  margin: 2px 0 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.35;
  font-weight: 500;
}

.h5-profile-hero__phone {
  font-size: 12px;
}

.h5-profile-hero__email,
.h5-profile-hero__fallback {
  max-width: 100%;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h5-profile-card {
  margin: 12px 16px 0;
  border: 1px solid #edf1f5;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.025);
}

.h5-profile-item + .h5-profile-item {
  border-top: 1px solid #f1f4f7;
}

.h5-profile-row {
  width: 100%;
  min-height: 50px;
  border: 0;
  background: transparent;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.h5-profile-row__left {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  font-weight: 700;
}

.h5-profile-row__left :deep(.van-icon) {
  width: 20px;
  color: var(--hourx-brand);
  font-size: 19px;
  text-align: center;
}

.h5-profile-row__arrow {
  color: #a9b2bf;
  font-size: 14px;
  transition: transform 0.2s ease;
}

.h5-profile-item--open .h5-profile-row__arrow {
  transform: rotate(90deg);
}

.h5-profile-row__value {
  color: #7a8797;
  font-size: 12px;
  font-weight: 600;
}

.h5-profile-panel {
  padding: 2px 16px 14px 48px;
  background: #fbfdff;
}

.h5-profile-details {
  margin: 0;
}

.h5-profile-details > div {
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eef2f6;
}

.h5-profile-details dt {
  color: #7a8797;
  font-size: 12px;
}

.h5-profile-details dd {
  min-width: 0;
  max-width: 62%;
  margin: 0;
  color: #273548;
  font-size: 12px;
  font-weight: 650;
  text-align: right;
}

.h5-profile-details__email {
  overflow-wrap: anywhere;
  white-space: normal;
}

.h5-profile-inline-link {
  width: 100%;
  min-height: 46px;
  padding: 8px 0 0;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.h5-profile-inline-link > span:first-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.h5-profile-inline-link strong {
  color: #273548;
  font-size: 12px;
}

.h5-profile-inline-link small {
  color: #9aa5b3;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.h5-profile-inline-link__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--hourx-brand);
  font-size: 11px;
  font-weight: 700;
}

.h5-profile-empty,
.h5-profile-panel__note {
  margin: 10px 0 0;
  color: #7a8797;
  font-size: 12px;
  line-height: 1.55;
}

.h5-profile-panel__note {
  margin-top: 4px;
  color: #a0a9b5;
  font-size: 11px;
}

.h5-profile-empty--error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.h5-profile-empty--error button {
  border: 0;
  background: transparent;
  color: var(--hourx-brand);
  font-size: 12px;
  font-weight: 700;
}

.h5-profile-address {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--hourx-brand-soft);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.h5-profile-address strong {
  color: #273548;
  font-size: 12px;
  line-height: 1.45;
}

.h5-profile-address span {
  color: #7a8797;
  font-size: 11px;
}

.h5-profile-panel--settings {
  padding-top: 2px;
}

.h5-profile-panel--support > p {
  margin: 8px 0 0;
  color: #7a8797;
  font-size: 11px;
  line-height: 1.5;
}

.h5-profile-support-actions {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.h5-profile-faq {
  margin-top: 12px;
  padding: 11px;
  border-radius: 9px;
  background: #f8fafc;
}

.h5-profile-faq > strong {
  color: #273548;
  font-size: 11px;
}

.h5-profile-faq dl {
  margin: 8px 0 0;
}

.h5-profile-faq dl > div + div {
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px solid #e7edf3;
}

.h5-profile-faq dt {
  color: #334155;
  font-size: 11px;
  font-weight: 750;
}

.h5-profile-faq dd {
  margin: 3px 0 0;
  color: #718096;
  font-size: 10px;
  line-height: 1.45;
}

.h5-profile-support-actions a {
  min-height: 38px;
  padding: 0 11px;
  border: 1px solid #dcebf5;
  border-radius: 9px;
  background: var(--hourx-brand-soft);
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--hourx-brand);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.h5-profile-support-actions :deep(.van-icon) {
  font-size: 17px;
}

.h5-profile-setting {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-profile-setting + .h5-profile-setting {
  border-top: 1px solid #eef2f6;
}

.h5-profile-setting > span {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.h5-profile-setting strong {
  color: #273548;
  font-size: 12px;
}

.h5-profile-setting small {
  color: #8c98a8;
  font-size: 10px;
  line-height: 1.4;
}

.h5-profile-card--partner {
  padding: 16px;
}

.h5-profile-card__title {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  font-weight: 750;
}

.h5-profile-card__title img {
  width: 20px;
  height: 20px;
}

.h5-profile-card__desc {
  margin: 12px 0 0;
  color: rgba(15, 23, 42, 0.6);
  font-size: 12px;
  line-height: 1.6;
}

.h5-profile-mail {
  max-width: 100%;
  margin-top: 12px;
  min-height: 34px;
  border: 0;
  border-radius: 8px;
  background: var(--hourx-brand-soft);
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--hourx-brand);
  font-size: 12px;
  font-weight: 700;
}

.h5-profile-mail img {
  width: 16px;
  height: 16px;
}

.h5-profile-logout {
  display: block;
  margin: 18px auto 0;
  padding: 7px 12px;
  border: 0;
  background: transparent;
  color: #dc4040;
  font-size: 13px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.h5-profile-tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(100%, 393px);
  height: calc(56px + env(safe-area-inset-bottom));
  padding: 1px 24px env(safe-area-inset-bottom);
  border-top: 1px solid #f3f4f6;
  background: #fff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h5-profile-tabbar__item {
  width: 64px;
  min-height: 44px;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #99a1af;
  font-size: 10px;
  font-weight: 500;
}

.h5-profile-tabbar__item :deep(.van-icon) {
  font-size: 24px;
}

.h5-profile-tabbar__cart-icon {
  position: relative;
  display: inline-flex;
}

.h5-profile-tabbar__cart-icon b {
  position: absolute;
  top: -8px;
  right: -12px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 8px;
  font-weight: 900;
  line-height: 13px;
}

.h5-profile-tabbar__item--active {
  color: var(--hourx-brand);
}
.h5-profile-edit-toggle { display: block; margin: 0 0 12px auto; border: 0; background: transparent; color: #1769c2; font-size: 12px; font-weight: 800; }
.h5-profile-edit-form { display: grid; gap: 12px; margin-bottom: 16px; }
.h5-profile-edit-form label { display: grid; gap: 6px; color: #64748b; font-size: 11px; font-weight: 700; }
.h5-profile-edit-form input { width: 100%; height: 42px; box-sizing: border-box; border: 1px solid #dbe3ec; border-radius: 11px; background: #fff; padding: 0 12px; color: #05152b; font-size: 14px; }
.h5-profile-edit-form > button { min-height: 44px; border: 0; border-radius: 12px; background: #05152b; color: #fff; font-weight: 800; }
.h5-profile-edit-form > button:disabled { opacity: .55; }
</style>
