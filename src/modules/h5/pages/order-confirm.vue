<template>
  <div class="h5-order-page">
    <header class="h5-order-topbar">
      <button class="h5-order-topbar__back" type="button" @click="goBack">
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ t('client.orderConfirm.pageTitle') }}</h1>
      <span class="h5-order-topbar__spacer" />
    </header>

    <main class="h5-order-main">
      <section class="h5-order-card h5-order-card--summary">
        <div class="h5-order-card__heading">
          <span />
          <h2>{{ t('client.orderConfirm.summary.title') }}</h2>
        </div>
        <div class="h5-order-summary__item">
          <div>
            <strong>{{ summaryTitle }}</strong>
            <p>{{ summaryMeta }}</p>
          </div>
          <em>{{ formatAed(subtotal) }}</em>
        </div>
        <div class="h5-order-summary__prices">
          <div>
            <span>{{ t('client.orderConfirm.summary.subtotal') }}</span>
            <span>{{ formatAed(subtotal) }}</span>
          </div>
          <div>
            <span>{{ t('client.orderConfirm.summary.vat') }}</span>
            <span>{{ formatAed(tax) }}</span>
          </div>
        </div>
      </section>

      <section class="h5-order-card">
        <div class="h5-order-card__heading">
          <span />
          <h2>{{ t('client.orderConfirm.sections.contact') }}</h2>
        </div>
        <div class="h5-order-grid h5-order-grid--two">
          <label class="h5-order-field">
            <div class="h5-order-input">
              <van-icon name="contact-o" />
              <input
                v-model="form.firstName"
                type="text"
                :placeholder="t('client.orderConfirm.placeholders.firstName')"
              />
            </div>
          </label>
          <label class="h5-order-field">
            <div class="h5-order-input">
              <van-icon name="contact-o" />
              <input
                v-model="form.lastName"
                type="text"
                :placeholder="t('client.orderConfirm.placeholders.lastName')"
              />
            </div>
          </label>
        </div>
        <div class="h5-order-stack">
          <label class="h5-order-field">
            <div class="h5-order-input h5-order-input--phone">
              <van-icon name="phone-o" />
              <select v-model="form.countryCode" autocomplete="tel-country-code">
                <option v-for="item in countryCodeOptions" :key="item.value" :value="item.value">
                  {{ item.value }}
                </option>
              </select>
              <input
                v-model="form.phone"
                type="text"
                autocomplete="tel-national"
                :placeholder="t('client.login.register.phoneNumberPlaceholder')"
              />
            </div>
          </label>
          <label class="h5-order-field">
            <div class="h5-order-input">
              <van-icon name="envelop-o" />
              <input
                v-model="form.email"
                type="email"
                :placeholder="t('client.orderConfirm.placeholders.email')"
              />
            </div>
          </label>
        </div>
      </section>

      <section class="h5-order-card">
        <div class="h5-order-card__heading">
          <span />
          <h2>{{ t('client.orderConfirm.sections.address') }}</h2>
          <span v-if="isLocating" class="h5-location-status">
            {{ t('client.orderConfirm.location.locating') }}
          </span>
        </div>
        <div class="h5-address-book">
          <div class="h5-address-book__bar">
            <strong>{{ t('client.orderConfirm.addressBook.title') }}</strong>
            <button type="button" @click="openAddAddressPopup">
              <van-icon name="plus" />
              {{ t('client.orderConfirm.addressBook.add') }}
            </button>
          </div>
          <p v-if="addressListLoading" class="h5-address-book__state">
            {{ t('client.orderConfirm.addressBook.loading') }}
          </p>
          <div v-else-if="addressList.length" class="h5-address-picker">
            <div
              class="h5-address-picker__list"
              role="radiogroup"
              :aria-label="t('client.orderConfirm.addressBook.title')"
            >
              <article
                v-for="item in addressList"
                :key="item.id"
                class="h5-address-card"
                :class="{ 'is-selected': selectedAddressId === item.id }"
              >
                <button
                  class="h5-address-card__select"
                  type="button"
                  role="radio"
                  :aria-checked="selectedAddressId === item.id"
                  @click="selectSavedAddress(item)"
                >
                  <span class="h5-address-card__topline">
                    <span class="h5-address-picker__tags">
                      <em>{{ addressCategoryLabel(item.category) }}</em>
                      <em v-if="item.isDefault" class="h5-address-picker__default">
                        {{ t('client.orderConfirm.addressBook.defaultTag') }}
                      </em>
                      <em v-if="selectedAddressId === item.id" class="h5-address-picker__selected">
                        {{ t('client.orderConfirm.addressBook.selectedTag') }}
                      </em>
                    </span>
                    <i class="h5-address-card__radio" aria-hidden="true" />
                  </span>
                  <strong>{{ item.firstName }} {{ item.lastName }}</strong>
                  <span>{{ formatAddressPhone(item) }}</span>
                  <span class="h5-address-card__address">{{ formatAddressLine(item) }}</span>
                  <small v-if="item.additionalNotes">{{ item.additionalNotes }}</small>
                </button>
                <button
                  class="h5-address-card__edit"
                  type="button"
                  @click="openEditAddressPopup(item)"
                >
                  {{ t('client.orderConfirm.addressBook.edit') }}
                </button>
              </article>
            </div>
            <button class="h5-address-picker__manual" type="button" @click="selectManualAddress">
              <van-icon name="plus" />
              {{ t('client.orderConfirm.addressBook.manualOption') }}
            </button>
            <p class="h5-address-picker__hint">
              {{ t('client.orderConfirm.addressBook.editHint') }}
            </p>
          </div>
          <p v-else class="h5-address-book__state">
            {{ t('client.orderConfirm.addressBook.empty') }}
          </p>
        </div>
        <div class="h5-address-category">
          <span>{{ t('client.orderConfirm.addressBook.categoryLabel') }}</span>
          <div>
            <button
              v-for="item in addressCategoryOptions"
              :key="item.value"
              type="button"
              :class="{ 'is-active': form.category === item.value }"
              @click="form.category = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <div class="h5-order-stack">
          <label class="h5-order-field">
            <div class="h5-order-input">
              <van-icon name="guide-o" />
              <input
                v-model="form.district"
                type="text"
                :placeholder="t('client.orderConfirm.placeholders.district')"
              />
            </div>
          </label>
          <label class="h5-order-field">
            <div class="h5-order-input h5-order-input--textarea">
              <van-icon name="location-o" />
              <textarea
                v-model="form.address"
                rows="3"
                :placeholder="t('client.orderConfirm.placeholders.address')"
              />
            </div>
          </label>
          <label class="h5-order-field">
            <div class="h5-order-input">
              <input
                v-model="form.remark"
                type="text"
                :placeholder="t('client.orderConfirm.placeholders.remark')"
              />
            </div>
          </label>
          <p v-if="locationLookupUsed" class="h5-location-attribution">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t('client.orderConfirm.location.attribution') }}
            </a>
          </p>
        </div>
      </section>

      <section class="h5-order-card">
        <div class="h5-order-card__heading">
          <span />
          <h2>{{ t('client.orderConfirm.sections.time') }}</h2>
        </div>
        <div class="h5-order-grid h5-order-grid--two">
          <label class="h5-order-field">
            <div class="h5-order-input" @click="openServiceDatePicker">
              <van-icon name="calendar-o" />
              <input
                ref="serviceDateInputRef"
                v-model="form.serviceDate"
                type="date"
                :min="minServiceDate"
              />
            </div>
          </label>
          <label class="h5-order-field">
            <div class="h5-order-input">
              <van-icon name="clock-o" />
              <select v-model="form.timeRange" @mousedown="handleServiceTimeOpen">
                <option value="" disabled>{{ serviceTimePlaceholder }}</option>
                <option
                  v-for="item in selectableTimeOptions"
                  :key="item.timeRange"
                  :value="item.timeRange"
                  :disabled="!item.available"
                >
                  {{ item.time }}
                </option>
              </select>
            </div>
          </label>
        </div>
        <p class="h5-order-lead-time">
          <van-icon name="info-o" />
          <span>{{ t('client.orderConfirm.fields.serviceLeadTimeHint', { minutes: bookingLeadMinutes }) }}</span>
        </p>
      </section>

      <section class="h5-order-card h5-order-card--payment">
        <div class="h5-order-card__heading">
          <span />
          <h2>{{ t('client.orderConfirm.sections.payment') }}</h2>
        </div>
        <div class="h5-payment-method">
          <div class="h5-payment-method__icon">S</div>
          <div class="h5-payment-method__content">
            <strong>{{ t('h5.orderConfirm.methodTitle') }}</strong>
            <span>{{ t('h5.orderConfirm.methodDesc') }}</span>
          </div>
        </div>
        <div class="h5-payment-note">
          <van-icon name="shield-o" />
          <span>{{ t('h5.orderConfirm.paymentNote') }}</span>
        </div>
        <label class="h5-payment-policy">
          <input v-model="agreedPolicy" type="checkbox" />
          <span>{{ t('client.orderConfirm.payment.policy') }}</span>
        </label>
      </section>
    </main>

    <footer class="h5-order-footer">
      <div class="h5-order-footer__summary">
        <span>{{ t('h5.orderConfirm.totalLabel') }}</span>
        <strong>
          {{ total.toFixed(2) }}
          <small>AED</small>
        </strong>
      </div>
      <button class="h5-order-footer__submit" type="button" :disabled="isSubmitting" @click="handleConfirm">
        {{ t('client.orderConfirm.summary.confirmPay') }}
      </button>
      <p class="h5-order-footer__ssl">
        <van-icon name="shield-o" />
        <span>{{ t('client.orderConfirm.summary.ssl') }}</span>
      </p>
    </footer>

    <van-popup
      v-model:show="addAddressPopupVisible"
      round
      position="bottom"
      :close-on-click-overlay="!addressAdding"
      :style="{ maxHeight: '90vh' }"
    >
      <div class="h5-add-address-sheet">
        <div class="h5-add-address-sheet__header">
          <h3>{{ editingAddressId ? t('client.orderConfirm.addressBook.editTitle') : t('client.orderConfirm.addressBook.addTitle') }}</h3>
          <button type="button" :disabled="addressAdding" @click="addAddressPopupVisible = false">
            <van-icon name="cross" />
          </button>
        </div>
        <div class="h5-add-address-sheet__categories">
          <button
            v-for="item in addressCategoryOptions"
            :key="item.value"
            type="button"
            :class="{ 'is-active': addAddressForm.category === item.value }"
            @click="addAddressForm.category = item.value"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="h5-add-address-sheet__grid">
          <label class="h5-add-address-field">
            <span>{{ t('client.orderConfirm.fields.firstName') }} *</span>
            <input v-model="addAddressForm.firstName" type="text" :placeholder="t('client.orderConfirm.placeholders.firstName')" />
          </label>
          <label class="h5-add-address-field">
            <span>{{ t('client.orderConfirm.fields.lastName') }} *</span>
            <input v-model="addAddressForm.lastName" type="text" :placeholder="t('client.orderConfirm.placeholders.lastName')" />
          </label>
        </div>
        <label class="h5-add-address-field">
          <span>{{ t('client.orderConfirm.fields.phone') }} *</span>
          <div class="h5-add-address-field__phone">
            <select v-model="addAddressForm.phoneCountryCode">
              <option v-for="item in countryCodeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
            <input v-model="addAddressForm.phone" type="tel" :placeholder="t('client.login.register.phoneNumberPlaceholder')" />
          </div>
        </label>
        <label class="h5-add-address-field">
          <span>{{ t('client.orderConfirm.fields.email') }}</span>
          <input v-model="addAddressForm.email" type="email" :placeholder="t('client.orderConfirm.placeholders.email')" />
        </label>
        <label class="h5-add-address-field">
          <span>{{ t('client.orderConfirm.fields.district') }}</span>
          <input v-model="addAddressForm.district" type="text" :placeholder="t('client.orderConfirm.placeholders.district')" />
        </label>
        <label class="h5-add-address-field">
          <span>{{ t('client.orderConfirm.fields.address') }} *</span>
          <textarea v-model="addAddressForm.address" rows="2" :placeholder="t('client.orderConfirm.placeholders.address')" />
        </label>
        <label class="h5-add-address-field">
          <span>{{ t('client.orderConfirm.fields.remark') }}</span>
          <textarea v-model="addAddressForm.additionalNotes" rows="2" :placeholder="t('client.orderConfirm.placeholders.remark')" />
        </label>
        <button
          class="h5-add-address-sheet__submit"
          type="button"
          :disabled="addressAdding"
          @click="submitAddressEditor"
        >
          {{
            addressAdding
              ? t('client.orderConfirm.addressBook.saving')
              : editingAddressId
                ? t('client.orderConfirm.addressBook.saveChanges')
                : t('client.orderConfirm.addressBook.save')
          }}
        </button>
      </div>
    </van-popup>

    <van-popup
      v-model:show="stripePopupVisible"
      round
      position="bottom"
      :close-on-click-overlay="!stripeSubmitting"
      :style="{ minHeight: '42vh' }"
      @closed="destroyStripeElements"
    >
      <div class="h5-stripe-sheet">
        <div class="h5-stripe-sheet__header">
          <h3>{{ locale === 'zh' ? 'Stripe 支付' : 'Stripe Payment' }}</h3>
          <button type="button" :disabled="stripeSubmitting" @click="stripePopupVisible = false">
            <van-icon name="cross" />
          </button>
        </div>
        <p class="h5-stripe-sheet__tip">
          {{
            locale === 'zh'
              ? '钱包方式会按当前设备自动展示，也可以直接填写银行卡完成支付'
              : 'Wallet options depend on your device, or you can pay directly by card.'
          }}
        </p>
        <div
          class="h5-stripe-sheet__express"
          :class="{ 'h5-stripe-sheet__express--hidden': !stripeExpressVisible && !stripeInitializing }"
        >
          <div ref="stripeExpressContainerRef" class="h5-stripe-sheet__express-inner"></div>
        </div>
        <div ref="stripeElementContainerRef" class="h5-stripe-sheet__element"></div>
        <button
          class="h5-stripe-sheet__submit"
          type="button"
          :disabled="stripeSubmitting || stripeInitializing"
          @click="handleStripeConfirm"
        >
          {{ stripeSubmitting ? (locale === 'zh' ? '支付中...' : 'Paying...') : (locale === 'zh' ? '立即支付' : 'Pay Now') }}
        </button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import {
  addClientAddress,
  getClientAddressList,
  updateClientAddress,
  saveContactAddress,
  getLatestAddress,
  type AddressCategory,
  type ClientAddressRecord,
  type LatestAddressRecord,
  getAvailableSelectTime,
  createPay,
} from '@/modules/client/api';
import { setClientLocale } from '@/modules/client/locales';
import {
  locateCurrentAddress,
  LocationLookupError,
  type LocationLookupErrorCode,
} from '@/modules/client/utils/geolocation';

type I18nText = Record<string, string>;

type AvailableTimeRecord = {
  time?: string;
  avaiable?: boolean;
  available?: boolean;
  timeRange?: number | string;
};

type StripeElementInstance = {
  mount: (domElement: HTMLElement | string) => void;
  destroy: () => void;
  on?: (eventName: string, handler: (event?: any) => void | Promise<void>) => void;
};

type StripeElementsInstance = {
  create: (type: string, options?: Record<string, unknown>) => StripeElementInstance;
};

type StripeConfirmResult = {
  error?: { message?: string };
  paymentIntent?: { status?: string };
};

type StripeInstance = {
  elements: (options: Record<string, unknown>) => StripeElementsInstance;
  confirmPayment: (options: Record<string, unknown>) => Promise<StripeConfirmResult>;
};

type StripeFactory = (
  publishableKey: string,
  options?: { locale?: string },
) => StripeInstance | null;

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n({ useScope: 'global' });

const DEFAULT_COUNTRY_CODE = '+971';
const COUNTRY_CODE_ENTRIES = [
  { value: '+971', labelEn: 'UAE +971', labelZh: '阿联酋 +971' },
  { value: '+966', labelEn: 'Saudi Arabia +966', labelZh: '沙特阿拉伯 +966' },
  { value: '+1', labelEn: 'United States +1', labelZh: '美国 +1' },
  { value: '+44', labelEn: 'United Kingdom +44', labelZh: '英国 +44' },
  { value: '+91', labelEn: 'India +91', labelZh: '印度 +91' },
  { value: '+86', labelEn: 'China +86', labelZh: '中国 +86' },
];
const ORDER_PAYMENT_METHOD = 'stripe';
const CREATE_PAY_METHOD = 'stripe';
const PAYMENT_STATUS_SYNC_DELAY_MS = 2000;
const DEFAULT_BOOKING_LEAD_MINUTES = 60;
const configuredBookingLeadMinutes = Number(import.meta.env.VITE_BOOKING_LEAD_MINUTES);
const bookingLeadMinutes = Number.isFinite(configuredBookingLeadMinutes) && configuredBookingLeadMinutes >= 0
  ? configuredBookingLeadMinutes
  : DEFAULT_BOOKING_LEAD_MINUTES;
const DUBAI_UTC_OFFSET = '+04:00';
const STRIPE_SCRIPT_ID = 'hourx-stripe-js';
const stripePublishableKey =
  typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'string'
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.trim()
    : '';

const form = reactive({
  firstName: '',
  lastName: '',
  countryCode: DEFAULT_COUNTRY_CODE,
  phone: '',
  email: '',
  district: '',
  address: '',
  remark: '',
  category: 'others' as AddressCategory,
  serviceDate: '',
  timeRange: '',
});

const availableTimeRecords = ref<AvailableTimeRecord[]>([]);
const isTimeOptionsLoading = ref(false);
const lastLoadedServiceDate = ref('');
const pendingTimeText = ref('');
const agreedPolicy = ref(true);
const isSubmitting = ref(false);
const isLocating = ref(false);
const locationLookupUsed = ref(false);
const addressList = ref<ClientAddressRecord[]>([]);
const addressListLoading = ref(false);
const selectedAddressId = ref<number | null>(null);
const addAddressPopupVisible = ref(false);
const addressAdding = ref(false);
const editingAddressId = ref<number | null>(null);
let isApplyingSavedAddress = false;
const addAddressForm = reactive({
  firstName: '',
  lastName: '',
  phoneCountryCode: DEFAULT_COUNTRY_CODE,
  phone: '',
  email: '',
  district: '',
  address: '',
  additionalNotes: '',
  category: 'home' as AddressCategory,
});
const serviceDateInputRef = ref<HTMLInputElement | null>(null);

const stripePopupVisible = ref(false);
const stripeInitializing = ref(false);
const stripeSubmitting = ref(false);
const stripeClientSecret = ref('');
const stripeExpressVisible = ref(true);
const stripeExpressContainerRef = ref<HTMLElement | null>(null);
const stripeElementContainerRef = ref<HTMLElement | null>(null);
const stripeInstance = ref<StripeInstance | null>(null);
const stripeElements = ref<StripeElementsInstance | null>(null);
const stripeExpressElement = ref<StripeElementInstance | null>(null);
const stripePaymentElement = ref<StripeElementInstance | null>(null);

const getStripeLocale = () => (locale.value.startsWith('zh') ? 'zh' : 'en');

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizePhoneNumber = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/[^\d]/g, '') : '';

const normalizeAddressCategory = (value: unknown): AddressCategory => {
  if (value === 'home' || value === 'office' || value === 'others') {
    return value;
  }
  return 'others';
};

const addressCategoryOptions = computed(() => [
  { value: 'home' as AddressCategory, label: t('client.orderConfirm.addressBook.categories.home') },
  { value: 'office' as AddressCategory, label: t('client.orderConfirm.addressBook.categories.office') },
  { value: 'others' as AddressCategory, label: t('client.orderConfirm.addressBook.categories.others') },
]);

const addressCategoryLabel = (category: unknown) => {
  const normalized = normalizeAddressCategory(category);
  return t(`client.orderConfirm.addressBook.categories.${normalized}`);
};

const formatAddressPhone = (item: ClientAddressRecord) =>
  [normalizeText(item.phoneCountryCode), normalizeText(item.phone)].filter(Boolean).join(' ');

const formatAddressLine = (item: ClientAddressRecord) =>
  [normalizeText(item.district), normalizeText(item.address)].filter(Boolean).join(', ');

const normalizeAddressRecord = (item: ClientAddressRecord): ClientAddressRecord | null => {
  const id = Number(item?.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    ...item,
    id,
    firstName: normalizeText(item.firstName),
    lastName: normalizeText(item.lastName),
    phoneCountryCode: normalizeText(item.phoneCountryCode) || DEFAULT_COUNTRY_CODE,
    phone: normalizeText(item.phone),
    email: normalizeText(item.email),
    district: normalizeText(item.district),
    address: normalizeText(item.address),
    additionalNotes: normalizeText(item.additionalNotes),
    category: normalizeAddressCategory(item.category),
    isDefault: item.isDefault === true,
  };
};

const selectSavedAddress = (item: ClientAddressRecord) => {
  isApplyingSavedAddress = true;
  selectedAddressId.value = item.id;
  form.firstName = normalizeText(item.firstName);
  form.lastName = normalizeText(item.lastName);
  form.countryCode = normalizeText(item.phoneCountryCode) || DEFAULT_COUNTRY_CODE;
  form.phone = normalizeText(item.phone);
  form.email = normalizeText(item.email);
  form.district = normalizeText(item.district);
  form.address = normalizeText(item.address);
  form.remark = normalizeText(item.additionalNotes);
  form.category = normalizeAddressCategory(item.category);
  locationLookupUsed.value = false;
  isApplyingSavedAddress = false;
};

const selectManualAddress = () => {
  isApplyingSavedAddress = true;
  selectedAddressId.value = null;
  form.district = '';
  form.address = '';
  form.remark = '';
  form.category = 'others';
  locationLookupUsed.value = false;
  isApplyingSavedAddress = false;
};

const loadAddressBook = async (preferredId?: number | null) => {
  addressListLoading.value = true;
  try {
    const records = await getClientAddressList();
    addressList.value = records
      .map(normalizeAddressRecord)
      .filter((item): item is ClientAddressRecord => item !== null);
    const preferred =
      addressList.value.find((item) => preferredId && item.id === preferredId) ||
      addressList.value.find((item) => item.isDefault) ||
      addressList.value[0];
    if (preferred) {
      selectSavedAddress(preferred);
    } else {
      selectedAddressId.value = null;
    }
  } catch (error) {
    console.error('load address list failed:', error);
    addressList.value = [];
    showFailToast(t('client.orderConfirm.addressBook.listFailed'));
  } finally {
    addressListLoading.value = false;
  }
};

const openAddAddressPopup = () => {
  editingAddressId.value = null;
  Object.assign(addAddressForm, {
    firstName: form.firstName,
    lastName: form.lastName,
    phoneCountryCode: form.countryCode || DEFAULT_COUNTRY_CODE,
    phone: form.phone,
    email: form.email,
    district: selectedAddressId.value ? '' : form.district,
    address: selectedAddressId.value ? '' : form.address,
    additionalNotes: '',
    category: 'home' as AddressCategory,
  });
  addAddressPopupVisible.value = true;
};

const openEditAddressPopup = (item: ClientAddressRecord) => {
  editingAddressId.value = item.id;
  Object.assign(addAddressForm, {
    firstName: normalizeText(item.firstName),
    lastName: normalizeText(item.lastName),
    phoneCountryCode: normalizeText(item.phoneCountryCode) || DEFAULT_COUNTRY_CODE,
    phone: normalizeText(item.phone),
    email: normalizeText(item.email),
    district: normalizeText(item.district),
    address: normalizeText(item.address),
    additionalNotes: normalizeText(item.additionalNotes),
    category: normalizeAddressCategory(item.category),
  });
  addAddressPopupVisible.value = true;
};

const isValidEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getAddAddressValidationMessage = () => {
  const requiredFields = [
    [addAddressForm.firstName, t('client.orderConfirm.fields.firstName')],
    [addAddressForm.lastName, t('client.orderConfirm.fields.lastName')],
    [addAddressForm.phone, t('client.orderConfirm.fields.phone')],
    [addAddressForm.address, t('client.orderConfirm.fields.address')],
  ];
  const missing = requiredFields.find(([value]) => !normalizeText(value));
  if (missing) {
    return t('client.orderConfirm.validation.requiredField', { field: missing[1] });
  }
  if (!isValidEmail(normalizeText(addAddressForm.email))) {
    return t('client.orderConfirm.addressBook.invalidEmail');
  }
  return '';
};

const submitAddressEditor = async () => {
  const validationMessage = getAddAddressValidationMessage();
  if (validationMessage) {
    showFailToast(validationMessage);
    return;
  }
  addressAdding.value = true;
  try {
    const payload = {
      firstName: normalizeText(addAddressForm.firstName),
      lastName: normalizeText(addAddressForm.lastName),
      phoneCountryCode: normalizeText(addAddressForm.phoneCountryCode) || DEFAULT_COUNTRY_CODE,
      phone: normalizeText(addAddressForm.phone),
      email: normalizeText(addAddressForm.email) || undefined,
      district: normalizeText(addAddressForm.district) || undefined,
      address: normalizeText(addAddressForm.address),
      additionalNotes: normalizeText(addAddressForm.additionalNotes) || undefined,
      category: normalizeAddressCategory(addAddressForm.category),
    };
    if (editingAddressId.value) {
      await updateClientAddress({ id: editingAddressId.value, ...payload });
      await loadAddressBook(editingAddressId.value);
      addAddressPopupVisible.value = false;
      showSuccessToast(t('client.orderConfirm.addressBook.editSuccess'));
      return;
    }

    const added = await addClientAddress(payload);
    const addedId = Number(typeof added === 'number' ? added : added?.id);
    await loadAddressBook(Number.isFinite(addedId) ? addedId : null);
    if (!Number.isFinite(addedId)) {
      const matched = [...addressList.value].reverse().find(
        (item) =>
          item.address === normalizeText(addAddressForm.address) &&
          item.phone === normalizeText(addAddressForm.phone),
      );
      if (matched) selectSavedAddress(matched);
    }
    addAddressPopupVisible.value = false;
    showSuccessToast(t('client.orderConfirm.addressBook.addSuccess'));
  } catch (error: any) {
    showFailToast(
      error?.message || t(
        editingAddressId.value
          ? 'client.orderConfirm.addressBook.editFailed'
          : 'client.orderConfirm.addressBook.addFailed',
      ),
    );
  } finally {
    addressAdding.value = false;
  }
};

const locationErrorKeyMap: Record<LocationLookupErrorCode, string> = {
  UNSUPPORTED: 'unsupported',
  PERMISSION_DENIED: 'permissionDenied',
  UNAVAILABLE: 'unavailable',
  TIMEOUT: 'timeout',
  LOOKUP_FAILED: 'lookupFailed',
};

const handleUseCurrentLocation = async () => {
  if (isLocating.value) return;
  isLocating.value = true;
  try {
    const result = await locateCurrentAddress(locale.value);
    form.district = result.district;
    form.address = result.address;
    locationLookupUsed.value = true;
    showSuccessToast(t('client.orderConfirm.location.success'));
  } catch (error) {
    const code = error instanceof LocationLookupError ? error.code : 'LOOKUP_FAILED';
    showFailToast(t(`client.orderConfirm.location.errors.${locationErrorKeyMap[code]}`));
  } finally {
    isLocating.value = false;
  }
};

const countryCodeOptions = computed(() =>
  COUNTRY_CODE_ENTRIES.map((item) => ({
    value: item.value,
    label: locale.value === 'zh' ? item.labelZh : item.labelEn,
  })),
);

const splitPhoneNumber = (value: unknown): { countryCode: string; phone: string } => {
  const text = normalizeText(value);
  if (!text) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      phone: '',
    };
  }

  const normalized = text.startsWith('+')
    ? `+${text.slice(1).replace(/[^\d]/g, '')}`
    : normalizePhoneNumber(text);
  const matchedCode = COUNTRY_CODE_ENTRIES.map((item) => item.value)
    .sort((left, right) => right.length - left.length)
    .find((code) => {
      const codeDigits = normalizePhoneNumber(code);
      return normalized.startsWith(code) || (!normalized.startsWith('+') && normalized.startsWith(codeDigits));
    });

  if (!matchedCode) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      phone: normalized.startsWith('+') ? normalizePhoneNumber(normalized) : normalized,
    };
  }

  const matchedDigits = normalizePhoneNumber(matchedCode);
  return {
    countryCode: matchedCode,
    phone: normalized.startsWith(matchedCode)
      ? normalizePhoneNumber(normalized.slice(matchedCode.length))
      : normalizePhoneNumber(normalized.slice(matchedDigits.length)),
  };
};

const normalizeTimeRangeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const getDubaiDateText = (timestamp: number): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

const bookingThreshold = () => Date.now() + bookingLeadMinutes * 60 * 1000;
const minServiceDate = computed(() => getDubaiDateText(bookingThreshold()));

const extractServiceStartTime = (value: string): string => {
  const text = normalizeText(value);
  if (!text) {
    return '';
  }
  const [rangeStart = ''] = text.split('-');
  return normalizeText(rangeStart);
};

const isFutureServiceSlot = (dateText: string, timeText: string): boolean => {
  const startTime = extractServiceStartTime(timeText);
  if (!dateText || !startTime) {
    return false;
  }
  const slotTimestamp = Date.parse(`${dateText}T${startTime}:00${DUBAI_UTC_OFFSET}`);
  if (Number.isNaN(slotTimestamp)) {
    return false;
  }
  return slotTimestamp >= bookingThreshold();
};

const getQueryText = (key: string) => {
  const raw = route.query[key];
  if (Array.isArray(raw)) {
    return typeof raw[0] === 'string' ? raw[0].trim() : '';
  }
  return typeof raw === 'string' ? raw.trim() : '';
};

const parseQueryJson = <T>(key: string, fallback: T): T => {
  const raw = getQueryText(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      const decoded = decodeURIComponent(raw);
      return JSON.parse(decoded) as T;
    } catch {
      return fallback;
    }
  }
};

const selectableTimeOptions = computed(() => {
  const selectedDate = normalizeText(form.serviceDate);
  if (!selectedDate) {
    return [] as Array<{ time: string; available: boolean; timeRange: string }>;
  }

  const today = getDubaiDateText(Date.now());
  if (selectedDate < today) {
    return [];
  }

  return availableTimeRecords.value
    .map((item) => {
      const timeRange = normalizeTimeRangeValue(item.timeRange);
      const time = normalizeText(item.time);
      if (!time || !timeRange) {
        return null;
      }
      const apiAvailable = item.avaiable ?? item.available ?? false;
      return {
        time,
        timeRange,
        available: Boolean(apiAvailable) && isFutureServiceSlot(selectedDate, time),
      };
    })
    .filter((item): item is { time: string; available: boolean; timeRange: string } => Boolean(item));
});

const selectedTimeOption = computed(() =>
  selectableTimeOptions.value.find((item) => item.timeRange === normalizeTimeRangeValue(form.timeRange)) ||
  null,
);

const applyPendingTimeText = () => {
  if (!pendingTimeText.value) {
    return;
  }
  const matched = selectableTimeOptions.value.find((item) => {
    const time = normalizeText(item.time);
    return time === pendingTimeText.value || extractServiceStartTime(time) === pendingTimeText.value;
  });
  if (matched) {
    form.timeRange = matched.timeRange;
  }
  pendingTimeText.value = '';
};

const openServiceDatePicker = () => {
  const input = serviceDateInputRef.value;
  if (!input) return;

  const pickerInput = input as HTMLInputElement & {
    showPicker?: () => void;
  };

  if (typeof pickerInput.showPicker === 'function') {
    pickerInput.showPicker();
    return;
  }

  input.focus();
  input.click();
};

const serviceTimePlaceholder = computed(() => {
  if (!normalizeText(form.serviceDate)) {
    return locale.value === 'zh' ? '请先选择日期' : 'Please select a date first';
  }
  if (isTimeOptionsLoading.value) {
    return locale.value === 'zh' ? '时间加载中...' : 'Loading times...';
  }
  if (!selectableTimeOptions.value.length) {
    return locale.value === 'zh' ? '暂无可选时间' : 'No available times';
  }
  return locale.value === 'zh' ? '请选择时间' : 'Please select time';
});

const fetchAvailableTimes = async (force = false) => {
  const serviceDate = normalizeText(form.serviceDate);
  const spuIdText = getQueryText('spuId');
  if (!serviceDate || !spuIdText) {
    return;
  }
  if (!force && lastLoadedServiceDate.value === serviceDate && availableTimeRecords.value.length) {
    return;
  }

  isTimeOptionsLoading.value = true;
  try {
    const payload = await getAvailableSelectTime({
      spuId: Number.isFinite(Number(spuIdText)) ? Number(spuIdText) : spuIdText,
      serviceTime: serviceDate,
    });
    availableTimeRecords.value = Array.isArray(payload) ? payload : [];
    lastLoadedServiceDate.value = serviceDate;
    applyPendingTimeText();
  } catch (error) {
    console.error('load available select time failed:', error);
    availableTimeRecords.value = [];
    lastLoadedServiceDate.value = '';
  } finally {
    isTimeOptionsLoading.value = false;
  }
};

const handleServiceTimeOpen = async () => {
  if (!normalizeText(form.serviceDate)) {
    showFailToast(
      t('client.orderConfirm.validation.requiredField', {
        field: t('client.orderConfirm.fields.serviceDate'),
      }),
    );
    return;
  }
  await fetchAvailableTimes();
};

watch(
  () => form.serviceDate,
  (value, oldValue) => {
    if (value !== oldValue) {
      availableTimeRecords.value = [];
      lastLoadedServiceDate.value = '';
      pendingTimeText.value = '';
      form.timeRange = '';
      if (normalizeText(value)) {
        void fetchAvailableTimes(true);
      }
    }
  },
);

watch(
  () => [
    form.firstName,
    form.lastName,
    form.countryCode,
    form.phone,
    form.email,
    form.district,
    form.address,
    form.remark,
    form.category,
  ],
  () => {
    if (!isApplyingSavedAddress && selectedAddressId.value !== null) {
      selectedAddressId.value = null;
    }
  },
  { flush: 'sync' },
);

watch(
  () => selectableTimeOptions.value.map((item) => `${item.timeRange}:${item.available}`).join('|'),
  () => {
    if (isTimeOptionsLoading.value) {
      return;
    }
    applyPendingTimeText();
    const currentValue = normalizeTimeRangeValue(form.timeRange);
    const currentExists = selectableTimeOptions.value.some(
      (item) => item.timeRange === currentValue && item.available,
    );
    if (!currentExists) {
      const firstAvailable = selectableTimeOptions.value.find((item) => item.available);
      form.timeRange = firstAvailable?.timeRange || '';
    }
  },
  { immediate: true },
);

watch(
  () => stripePopupVisible.value,
  (visible) => {
    if (visible) {
      return;
    }
    stripeClientSecret.value = '';
    destroyStripeElements();
  },
);

watch(
  () => locale.value,
  async () => {
    setClientLocale(locale.value === 'zh' ? 'zh' : 'en');
    if (!stripePopupVisible.value || !stripeClientSecret.value) {
      return;
    }
    await initStripeElements();
  },
  { immediate: true },
);

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const pickI18nValue = (i18n?: I18nText, fallback = ''): string => {
  const valueMap = i18n || {};
  for (const lang of getPreferredLangs()) {
    const value = valueMap[lang];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === 'string' && value.trim(),
  );
  return typeof firstValue === 'string' ? firstValue.trim() : fallback;
};

const getQueryNumber = (key: string, fallback = 0) => {
  const numeric = Number(getQueryText(key));
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getQueryOrderId = (): number | null => {
  const text = getQueryText('orderId');
  if (!text) {
    return null;
  }
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
};

const orderId = computed(() => getQueryOrderId());

const summaryTitle = computed(() =>
  pickI18nValue(
    parseQueryJson<I18nText>('titleI18n', {}),
    getQueryText('title') || t('client.orderConfirm.summary.itemDefault'),
  ),
);

const summaryMeta = computed(() => {
  const selectedSpecValueIds = parseQueryJson<string[]>('selectedSpecValueIds', []);
  const specValueNameI18n = parseQueryJson<Record<string, I18nText>>('specValueNameI18n', {});
  if (Array.isArray(selectedSpecValueIds) && selectedSpecValueIds.length) {
    const labels = selectedSpecValueIds
      .map((id) => pickI18nValue(specValueNameI18n[String(id)], String(id)))
      .filter(Boolean);
    if (labels.length) {
      return labels.join(' / ');
    }
  }
  return getQueryText('specSummary') || t('client.orderConfirm.summary.metaDefault');
});

const subtotal = computed(() => getQueryNumber('subtotal', 0));
const tax = computed(() => getQueryNumber('tax', 0));
const total = computed(() => getQueryNumber('total', subtotal.value + tax.value));

const formatAed = (value: number) => `${value.toFixed(2)} AED`;

const extractEnvelopeData = <T>(payload: unknown): T | null => {
  if (payload === null || payload === undefined) {
    return null;
  }
  if (payload && typeof payload === 'object') {
    const maybe = payload as Record<string, unknown>;
    if ('data' in maybe) {
      return (maybe.data ?? null) as T | null;
    }
  }
  return payload as T;
};

const buildValidationUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}${window.location.pathname}`;
};

const navigateToClient = (path: string, query?: Record<string, string>) => {
  setClientLocale(locale.value === 'zh' ? 'zh' : 'en');
  localStorage.setItem('h5-locale', locale.value === 'zh' ? 'zh' : 'en');
  const url = new URL(path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
};

const loadStripeJs = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Stripe is only available in browser');
  }

  if (typeof (window as any).Stripe === 'function') {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existed = document.getElementById(STRIPE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existed) {
      existed.addEventListener('load', () => resolve(), { once: true });
      existed.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = STRIPE_SCRIPT_ID;
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(script);
  });
};

const destroyStripeElements = () => {
  try {
    stripeExpressElement.value?.destroy?.();
  } catch {
    // ignore destroy errors
  }
  try {
    stripePaymentElement.value?.destroy?.();
  } catch {
    // ignore destroy errors
  }
  stripeExpressElement.value = null;
  stripePaymentElement.value = null;
  stripeElements.value = null;
  stripeExpressVisible.value = true;
};

const initStripeElements = async () => {
  if (!stripeClientSecret.value) {
    return;
  }
  if (!stripePublishableKey) {
    throw new Error(
      locale.value === 'zh'
        ? '缺少 Stripe 公钥，请配置 VITE_STRIPE_PUBLISHABLE_KEY'
        : 'Missing Stripe publishable key, please set VITE_STRIPE_PUBLISHABLE_KEY.',
    );
  }

  stripeInitializing.value = true;
  try {
    await loadStripeJs();
    const stripeFactory = (window as any).Stripe as StripeFactory | undefined;
    if (typeof stripeFactory !== 'function') {
      throw new Error('Stripe SDK is unavailable');
    }

    stripeInstance.value = stripeFactory(stripePublishableKey, {
      locale: getStripeLocale(),
    }) as StripeInstance;
    if (!stripeInstance.value) {
      throw new Error('Stripe initialization failed');
    }

    await nextTick();
    const expressContainer = stripeExpressContainerRef.value;
    const container = stripeElementContainerRef.value;
    if (!container) {
      throw new Error('Stripe container is missing');
    }

    destroyStripeElements();
    const elements = stripeInstance.value.elements({
      clientSecret: stripeClientSecret.value,
      appearance: { theme: 'stripe' },
    });
    if (expressContainer) {
      const expressElement = elements.create('expressCheckout', {
        paymentMethods: {
          applePay: 'always',
          googlePay: 'always',
        },
      });
      expressElement.on?.('ready', (event?: { availablePaymentMethods?: Record<string, unknown> | null }) => {
        stripeExpressVisible.value = Boolean(event?.availablePaymentMethods);
      });
      expressElement.on?.('confirm', async () => {
        await handleStripeExpressConfirm();
      });
      expressElement.mount(expressContainer);
      stripeExpressElement.value = expressElement;
    }
    const paymentElement = elements.create('payment');
    paymentElement.mount(container);
    stripeElements.value = elements;
    stripePaymentElement.value = paymentElement;
  } finally {
    stripeInitializing.value = false;
  }
};

const openStripePopup = async (clientSecret: string) => {
  stripeClientSecret.value = clientSecret;
  stripePopupVisible.value = true;
  await initStripeElements();
};

const handleStripeSuccess = async () => {
  stripePopupVisible.value = false;
  showSuccessToast(t('client.orderConfirm.validation.orderSuccess'));
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, PAYMENT_STATUS_SYNC_DELAY_MS);
  });
  await router.push({ name: 'h5-orders' });
};

const handleStripeConfirmResult = async (confirmResult: StripeConfirmResult) => {
  const errorMessage = normalizeText(confirmResult.error?.message);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const status = normalizeText(confirmResult.paymentIntent?.status).toLowerCase();
  if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
    await handleStripeSuccess();
    return;
  }

  if (!status) {
    return;
  }

  throw new Error(
    locale.value === 'zh'
      ? `支付状态异常: ${status}`
      : `Unexpected payment status: ${status}`,
  );
};

const handleStripeExpressConfirm = async () => {
  if (stripeSubmitting.value || stripeInitializing.value) {
    return;
  }
  if (!stripeInstance.value || !stripeElements.value) {
    showFailToast(
      locale.value === 'zh'
        ? 'Stripe 钱包支付组件尚未初始化'
        : 'Stripe wallet checkout is not ready.',
    );
    return;
  }

  stripeSubmitting.value = true;
  try {
    const confirmResult = await stripeInstance.value.confirmPayment({
      elements: stripeElements.value,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
    });
    await handleStripeConfirmResult(confirmResult);
  } catch (error: any) {
    showFailToast(error?.message || 'Stripe wallet payment failed');
  } finally {
    stripeSubmitting.value = false;
  }
};

const handleStripeConfirm = async () => {
  if (stripeSubmitting.value || stripeInitializing.value) {
    return;
  }
  if (!stripeInstance.value || !stripeElements.value) {
    showFailToast(
      locale.value === 'zh'
        ? 'Stripe 支付组件尚未初始化'
        : 'Stripe payment component is not ready.',
    );
    return;
  }

  stripeSubmitting.value = true;
  try {
    const confirmResult = await stripeInstance.value.confirmPayment({
      elements: stripeElements.value,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
    });
    await handleStripeConfirmResult(confirmResult);
  } catch (error: any) {
    showFailToast(error?.message || 'Stripe payment failed');
  } finally {
    stripeSubmitting.value = false;
  }
};

const normalizeTimestamp = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(value) < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const numeric = Number(text);
    if (Number.isFinite(numeric)) {
      return Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric;
    }
  }
  return null;
};

const parseServiceDateTime = (value: unknown): { date: string; time: string } => {
  const timestamp = normalizeTimestamp(value);
  if (timestamp !== null) {
    const parsedByTs = new Date(timestamp);
    if (!Number.isNaN(parsedByTs.getTime())) {
      const yyyy = parsedByTs.getFullYear();
      const mm = `${parsedByTs.getMonth() + 1}`.padStart(2, '0');
      const dd = `${parsedByTs.getDate()}`.padStart(2, '0');
      const hh = `${parsedByTs.getHours()}`.padStart(2, '0');
      const mi = `${parsedByTs.getMinutes()}`.padStart(2, '0');
      return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${mi}`,
      };
    }
  }

  const text = normalizeText(value);
  if (!text) return { date: '', time: '' };

  const matched = text.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  if (matched) {
    return { date: matched[1], time: matched[2] };
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const dd = `${parsed.getDate()}`.padStart(2, '0');
    const hh = `${parsed.getHours()}`.padStart(2, '0');
    const mi = `${parsed.getMinutes()}`.padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${mi}`,
    };
  }

  const dateOnly = text.match(/(\d{4}-\d{2}-\d{2})/);
  return { date: dateOnly?.[1] || '', time: '' };
};

const fillFormByLatestAddress = (payload: LatestAddressRecord | null) => {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  const firstName = normalizeText(payload.firstName);
  if (firstName) form.firstName = firstName;

  const lastName = normalizeText(payload.lastName);
  if (lastName) form.lastName = lastName;

  const phone = normalizeText(payload.phone);
  if (phone) {
    const parsedPhone = splitPhoneNumber(phone);
    form.countryCode = parsedPhone.countryCode;
    form.phone = parsedPhone.phone;
  }

  const email = normalizeText(payload.email);
  if (email) form.email = email;

  const district = normalizeText(payload.district);
  if (district) form.district = district;

  const serviceAddress = normalizeText(payload.serviceAddress);
  if (serviceAddress) form.address = serviceAddress;

  const remark = normalizeText(payload.remark);
  if (remark) form.remark = remark;

  const dateTime = parseServiceDateTime(payload.serviceDateTime);
  const serviceDate = normalizeText((payload as LatestAddressRecord & { serviceTime?: string }).serviceTime);
  const timeRange = normalizeTimeRangeValue((payload as LatestAddressRecord & { timeRange?: number | string }).timeRange);

  if (serviceDate) {
    form.serviceDate = serviceDate;
  } else if (dateTime.date) {
    form.serviceDate = dateTime.date;
  }

  if (timeRange) {
    form.timeRange = timeRange;
  } else if (dateTime.time) {
    pendingTimeText.value = dateTime.time;
  }
};

const loadLatestAddress = async () => {
  try {
    const payload = await getLatestAddress();
    fillFormByLatestAddress(payload);
  } catch (error) {
    console.error('load latest address failed:', error);
  }
};

const buildServiceDateTime = (): string | undefined => {
  const date = normalizeText(form.serviceDate);
  const time = extractServiceStartTime(selectedTimeOption.value?.time || '');
  if (!date) {
    return undefined;
  }
  const timeValue = time || '00:00';
  const slotTimestamp = Date.parse(`${date}T${timeValue}:00${DUBAI_UTC_OFFSET}`);
  if (Number.isNaN(slotTimestamp)) {
    return undefined;
  }
  if (slotTimestamp < bookingThreshold()) {
    return undefined;
  }
  return `${date} ${timeValue}`;
};

const startStripePayment = async (targetOrderId: number) => {
  const validationUrl = buildValidationUrl();
  const paymentResponse = await createPay({
    orderId: targetOrderId,
    paymentMethod: CREATE_PAY_METHOD,
    validationUrl,
  });
  const paymentData = extractEnvelopeData<Record<string, unknown>>(paymentResponse);
  if (!paymentData || typeof paymentData !== 'object') {
    throw new Error('Create payment response is empty');
  }

  const clientSecret = normalizeText(paymentData.clientSecret);
  if (clientSecret) {
    await openStripePopup(clientSecret);
    return;
  }

  const approvalUrl = normalizeText(
    paymentData.approvalUrl ||
      paymentData.redirectUrl ||
      paymentData.checkoutUrl,
  );
  if (approvalUrl && typeof window !== 'undefined') {
    window.location.href = approvalUrl;
    return;
  }

  throw new Error(
    locale.value === 'zh'
      ? '未获取到支付参数（clientSecret/跳转链接），请稍后重试'
      : 'Missing Stripe payment params (clientSecret/redirect URL), please try again.',
  );
};

const getValidationMessage = (): string => {
  if (orderId.value === null) {
    return t('client.orderConfirm.validation.orderIdMissing');
  }
  if (!normalizeText(form.firstName)) {
    return t('client.orderConfirm.validation.requiredField', {
      field: t('client.orderConfirm.fields.firstName'),
    });
  }
  if (!normalizeText(form.lastName)) {
    return t('client.orderConfirm.validation.requiredField', {
      field: t('client.orderConfirm.fields.lastName'),
    });
  }
  if (!normalizePhoneNumber(form.phone)) {
    return t('client.orderConfirm.validation.requiredField', {
      field: t('client.orderConfirm.fields.phone'),
    });
  }
  if (!isValidEmail(normalizeText(form.email))) {
    return t('client.orderConfirm.addressBook.invalidEmail');
  }
  if (!normalizeText(form.address)) {
    return t('client.orderConfirm.validation.requiredField', {
      field: t('client.orderConfirm.fields.address'),
    });
  }
  if (!normalizeText(form.serviceDate)) {
    return t('client.orderConfirm.validation.requiredField', {
      field: t('client.orderConfirm.fields.serviceDate'),
    });
  }
  if (!normalizeTimeRangeValue(form.timeRange)) {
    return t('client.orderConfirm.validation.requiredField', {
      field: t('client.orderConfirm.fields.serviceTime'),
    });
  }
  if (!agreedPolicy.value) {
    return t('client.orderConfirm.validation.policy');
  }
  if (!buildServiceDateTime()) {
    return t('client.orderConfirm.validation.futureTime');
  }
  return '';
};

const goBack = () => {
  const spuId = getQueryText('spuId');
  if (spuId) {
    router.push({
      name: 'h5-product-detail',
      params: { spuId },
      query: {
        breadcrumb: getQueryText('breadcrumb'),
        name: getQueryText('name'),
        categoryId: getQueryText('categoryId'),
        level1: getQueryText('level1'),
      },
    });
    return;
  }
  router.push({ name: 'h5-home' });
};

const handleConfirm = async () => {
  if (isSubmitting.value) {
    return;
  }

  const validationMessage = getValidationMessage();
  if (validationMessage) {
    showFailToast(validationMessage);
    return;
  }

  const serviceDateTime = buildServiceDateTime();
  if (!serviceDateTime) {
    showFailToast(t('client.orderConfirm.validation.futureTime'));
    return;
  }
  if (orderId.value === null) {
    showFailToast(t('client.orderConfirm.validation.orderIdMissing'));
    return;
  }

  const payload = {
    orderId: orderId.value,
    ...(selectedAddressId.value !== null ? { addressId: selectedAddressId.value } : {}),
    firstName: normalizeText(form.firstName),
    lastName: normalizeText(form.lastName),
    phoneCountryCode: normalizeText(form.countryCode) || DEFAULT_COUNTRY_CODE,
    phone: normalizeText(form.phone),
    email: normalizeText(form.email),
    district: normalizeText(form.district),
    serviceAddress: normalizeText(form.address),
    remark: normalizeText(form.remark),
    category: normalizeAddressCategory(form.category),
    serviceTime: normalizeText(form.serviceDate),
    timeRange: Number(form.timeRange),
    paymentMethod: ORDER_PAYMENT_METHOD,
  };

  isSubmitting.value = true;
  try {
    await saveContactAddress(payload);
    await startStripePayment(orderId.value);
  } catch (error: any) {
    console.error('save contact address failed:', error);
    showFailToast(error?.message || 'Payment request failed');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  await loadLatestAddress();
  await loadAddressBook();
  if (selectedAddressId.value === null) {
    await handleUseCurrentLocation();
  }
});
</script>

<style scoped lang="scss">
.h5-order-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.h5-order-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 56px;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #f3f4f6;
  backdrop-filter: blur(12px);
}

.h5-order-topbar__back,
.h5-order-topbar__spacer {
  width: 44px;
  height: 44px;
}

.h5-order-topbar__back {
  border: 0;
  background: transparent;
  color: #1d293d;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 22px;
}

.h5-order-topbar h1 {
  margin: 0;
  text-align: center;
  color: #1d293d;
  font-size: 16px;
  font-weight: 700;
}

.h5-order-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-order-card {
  background: #fff;
  padding: 20px 16px;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.h5-order-card--summary {
  padding-top: 18px;
}

.h5-order-card__heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.h5-order-card__heading span {
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background: var(--hourx-brand);
  flex-shrink: 0;
}

.h5-order-card__heading h2 {
  margin: 0;
  color: #1d293d;
  font-size: 15px;
  font-weight: 900;
}

.h5-location-status {
  margin-left: auto;
  color: var(--hourx-brand);
  font-size: 10px;
  font-weight: 700;
}

.h5-order-summary__item {
  margin-top: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #f3f4f6;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.h5-order-summary__item strong {
  display: block;
  color: #1d293d;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 700;
}

.h5-order-summary__item p {
  margin: 4px 0 0;
  color: #62748e;
  font-size: 11px;
  line-height: 1.5;
}

.h5-order-summary__item em {
  color: #1d293d;
  font-size: 14px;
  line-height: 1.5;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.h5-order-summary__prices {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-order-summary__prices > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #62748e;
  font-size: 12px;
  font-weight: 500;
}

.h5-order-grid,
.h5-order-stack {
  margin-top: 16px;
}

.h5-order-grid {
  display: grid;
  gap: 12px;
}

.h5-order-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.h5-order-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.h5-order-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.h5-order-field__hint {
  color: #90a1b9;
  font-size: 11px;
  line-height: 1.4;
}

.h5-location-attribution {
  margin: -4px 0 0;
  color: #90a1b9;
  font-size: 10px;
  line-height: 1.4;
}

.h5-location-attribution a {
  color: inherit;
}

.h5-order-lead-time {
  margin: 10px 0 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: #62748e;
  font-size: 11px;
  line-height: 1.45;
}

.h5-order-lead-time :deep(.van-icon) {
  margin-top: 1px;
  color: var(--hourx-brand);
  flex: 0 0 auto;
}

.h5-address-book {
  margin-top: 16px;
  padding: 13px;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  background: #f8fafc;
}

.h5-address-book__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.h5-address-book__bar strong {
  color: #05152b;
  font-size: 13px;
  font-weight: 800;
}

.h5-address-book__bar button {
  min-height: 32px;
  border: 1px solid #05152b;
  border-radius: 8px;
  background: #fff;
  color: #05152b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 800;
}

.h5-address-book__state {
  margin: 13px 0 0;
  color: #77869b;
  font-size: 11px;
  line-height: 1.5;
}

.h5-address-picker {
  margin-top: 12px;
}

.h5-address-picker__list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  max-height: min(54vh, 440px);
  overflow-y: auto;
  padding: 2px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.h5-address-card {
  position: relative;
  flex: 0 0 auto;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d9e1eb;
  border-radius: 11px;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.h5-address-card.is-selected {
  border-color: #05152b;
  background: #fbfdff;
  box-shadow: 0 0 0 2px rgba(5, 21, 43, 0.08);
}

.h5-address-card__select {
  width: 100%;
  min-height: 138px;
  border: 0;
  background: transparent;
  color: #05152b;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 11px 48px 41px 12px;
  text-align: left;
  font: inherit;
}

.h5-address-card__select:focus-visible {
  outline: 2px solid #05152b;
  outline-offset: -3px;
}

.h5-address-card__topline {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.h5-address-card__select > strong {
  color: #05152b;
  font-size: 13px;
  line-height: 1.35;
}

.h5-address-card__select > span:not(.h5-address-card__topline),
.h5-address-card__select > small {
  max-width: 100%;
  color: #68788d;
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.h5-address-card__select > small {
  color: #90a1b9;
}

.h5-address-card__address {
  color: #364153 !important;
}

.h5-address-card__radio {
  position: relative;
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  border: 2px solid #aeb9c8;
  border-radius: 50%;
  box-sizing: border-box;
}

.h5-address-card.is-selected .h5-address-card__radio {
  border-color: #05152b;
}

.h5-address-card.is-selected .h5-address-card__radio::after {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #05152b;
  content: '';
}

.h5-address-card__edit {
  position: absolute;
  right: 11px;
  bottom: 8px;
  min-width: 38px;
  min-height: 32px;
  border: 0;
  background: transparent;
  color: #05152b;
  padding: 4px 0;
  font-size: 10px;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.h5-address-picker__tags {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.h5-address-picker__tags em {
  border-radius: 999px;
  background: rgba(5, 21, 43, 0.08);
  color: #05152b;
  padding: 3px 7px;
  font-size: 9px;
  line-height: 1.2;
  font-style: normal;
  font-weight: 800;
}

.h5-address-picker__tags .h5-address-picker__default {
  background: rgba(5, 21, 43, 0.14);
}

.h5-address-picker__tags .h5-address-picker__selected {
  background: #05152b;
  color: #fff;
}

.h5-address-picker__manual {
  width: 100%;
  min-height: 42px;
  margin-top: 9px;
  border: 1px dashed #aeb9c8;
  border-radius: 9px;
  background: #fff;
  color: #05152b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 10px;
  font-size: 11px;
  font-weight: 800;
}

.h5-address-picker__hint {
  margin: 8px 1px 0;
  color: #8090a5;
  font-size: 10px;
  line-height: 1.4;
}

.h5-address-category {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h5-address-category > span {
  color: #05152b;
  font-size: 12px;
  font-weight: 700;
}

.h5-address-category > div,
.h5-add-address-sheet__categories {
  display: flex;
  gap: 8px;
}

.h5-address-category button,
.h5-add-address-sheet__categories button {
  min-width: 76px;
  height: 34px;
  border: 1px solid #d6dee8;
  border-radius: 999px;
  background: #fff;
  color: #607086;
  padding: 0 13px;
  font-size: 11px;
  font-weight: 700;
}

.h5-address-category button.is-active,
.h5-add-address-sheet__categories button.is-active {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
}

.h5-order-input {
  min-height: 41px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
}

.h5-order-input :deep(.van-icon) {
  color: #90a1b9;
  font-size: 16px;
  flex-shrink: 0;
}

.h5-order-input input,
.h5-order-input select,
.h5-order-input textarea {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #314158;
  font-size: 13px;
  font-weight: 500;
}

.h5-order-input input::placeholder,
.h5-order-input textarea::placeholder {
  color: #90a1b9;
}

.h5-order-input--textarea {
  min-height: 78px;
  align-items: flex-start;
  padding-top: 11px;
  padding-bottom: 11px;
}

.h5-order-input--textarea textarea {
  min-height: 54px;
  resize: vertical;
  line-height: 1.45;
}

.h5-order-input--phone select {
  width: 62px;
  flex: 0 0 62px;
}

.h5-order-input--phone input {
  flex: 1;
}

.h5-order-card--payment {
  padding-bottom: 16px;
}

.h5-payment-method {
  margin-top: 16px;
  min-height: 74px;
  border-radius: 8px;
  border: 1px solid #1d293d;
  background: #f9fafb;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.h5-payment-method__icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #1d293d;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.h5-payment-method__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.h5-payment-method strong {
  color: #1d293d;
  font-size: 13px;
  font-weight: 700;
}

.h5-payment-method span {
  color: #62748e;
  font-size: 11px;
  line-height: 1.4;
}

.h5-payment-note {
  margin-top: 12px;
  min-height: 44px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  color: #314158;
  font-size: 11px;
  line-height: 1.4;
}

.h5-payment-note :deep(.van-icon) {
  color: #62748e;
  font-size: 14px;
  flex-shrink: 0;
}

.h5-payment-policy {
  margin-top: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.h5-payment-policy input {
  margin-top: 2px;
}

.h5-payment-policy span {
  color: #62748e;
  font-size: 11px;
  line-height: 1.5;
}

.h5-order-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 24;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #f3f4f6;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 10px 12px;
  align-items: center;
}

.h5-order-footer__summary span {
  display: block;
  color: #62748e;
  font-size: 11px;
  font-weight: 700;
}

.h5-order-footer__summary strong {
  display: block;
  margin-top: 2px;
  color: var(--hourx-brand);
  font-size: 16px;
  line-height: 1;
  font-weight: 900;
}

.h5-order-footer__summary small {
  margin-left: 4px;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.h5-order-footer__submit {
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 4px;
  background: var(--hourx-brand);
  color: #fff;
  font-size: 14px;
  font-weight: 900;
}

.h5-order-footer__submit:disabled {
  opacity: 0.7;
}

.h5-order-footer__ssl {
  grid-column: 1 / -1;
  margin: -2px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #90a1b9;
  font-size: 10px;
}

.h5-add-address-sheet {
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px 18px calc(22px + env(safe-area-inset-bottom));
}

.h5-add-address-sheet__header {
  position: sticky;
  top: -20px;
  z-index: 2;
  margin: -20px -18px 0;
  padding: 20px 18px 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-add-address-sheet__header h3 {
  margin: 0;
  color: #05152b;
  font-size: 18px;
  font-weight: 900;
}

.h5-add-address-sheet__header button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: #f1f4f8;
  color: #526176;
  font-size: 18px;
}

.h5-add-address-sheet__categories {
  margin: 3px 0 18px;
  overflow-x: auto;
  scrollbar-width: none;
}

.h5-add-address-sheet__categories::-webkit-scrollbar {
  display: none;
}

.h5-add-address-sheet__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.h5-add-address-field {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.h5-add-address-sheet__grid .h5-add-address-field {
  margin-top: 0;
}

.h5-add-address-field > span {
  color: #05152b;
  font-size: 12px;
  font-weight: 700;
}

.h5-add-address-field > input,
.h5-add-address-field > textarea,
.h5-add-address-field__phone > input,
.h5-add-address-field__phone > select {
  width: 100%;
  min-width: 0;
  border: 1px solid #dce3ec;
  border-radius: 9px;
  outline: 0;
  background: #f8fafc;
  color: #27364b;
  padding: 0 12px;
  font-size: 13px;
  box-sizing: border-box;
}

.h5-add-address-field > input,
.h5-add-address-field__phone > input,
.h5-add-address-field__phone > select {
  height: 44px;
}

.h5-add-address-field > textarea {
  min-height: 70px;
  padding-top: 11px;
  padding-bottom: 11px;
  resize: vertical;
  line-height: 1.45;
}

.h5-add-address-field__phone {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 8px;
}

.h5-add-address-sheet__submit {
  position: sticky;
  bottom: -22px;
  margin-top: 20px;
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 12px;
  background: #05152b;
  color: #fff;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 -8px 18px rgba(255, 255, 255, 0.92);
}

.h5-add-address-sheet__submit:disabled {
  opacity: 0.65;
}

.h5-stripe-sheet {
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
}

.h5-stripe-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-stripe-sheet__header h3 {
  margin: 0;
  color: #1d293d;
  font-size: 16px;
  font-weight: 800;
}

.h5-stripe-sheet__header button {
  border: 0;
  background: transparent;
  color: #62748e;
  font-size: 18px;
}

.h5-stripe-sheet__tip {
  margin: 10px 0 0;
  color: #62748e;
  font-size: 12px;
  line-height: 1.5;
}

.h5-stripe-sheet__express {
  margin-top: 12px;
  min-height: 56px;
}

.h5-stripe-sheet__express--hidden {
  display: none;
}

.h5-stripe-sheet__express-inner {
  min-height: 56px;
}

.h5-stripe-sheet__element {
  margin-top: 12px;
  min-height: 62px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

.h5-stripe-sheet__submit {
  margin-top: 14px;
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 8px;
  background: var(--hourx-brand);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.h5-stripe-sheet__submit:disabled {
  opacity: 0.7;
}

@media (max-width: 360px) {
  .h5-order-grid--two {
    grid-template-columns: 1fr;
  }

  .h5-order-footer {
    grid-template-columns: 1fr;
  }

  .h5-add-address-sheet__grid,
  .h5-add-address-field__phone {
    grid-template-columns: 1fr;
  }
}
</style>
