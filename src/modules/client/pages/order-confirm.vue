<template>
  <div class="order-confirm-page">
    <section class="order-confirm-subheader">
      <div class="order-confirm-container order-confirm-subheader__inner">
        <button class="order-confirm-back" type="button" @click="goBack">
          <span class="order-confirm-back__icon" aria-hidden="true">&lt;</span>
          <span>{{ t('client.orderConfirm.pageTitle') }}</span>
        </button>
        <p class="order-confirm-secure">{{ t('client.orderConfirm.securePay') }}</p>
      </div>
    </section>

    <section class="order-confirm-body">
      <div class="order-confirm-container order-confirm-layout">
        <div class="order-confirm-main">
          <section class="order-card">
            <header class="order-section-title">
              <span class="order-section-title__index">1</span>
              <h2>{{ t('client.orderConfirm.sections.contact') }}</h2>
            </header>
            <div class="order-fields-grid">
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.firstName') }}</span>
                <div class="order-input-wrap">
                  <i aria-hidden="true">U</i>
                  <input
                    v-model="form.firstName"
                    type="text"
                    required
                    :placeholder="t('client.orderConfirm.placeholders.firstName')"
                  />
                </div>
              </label>
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.lastName') }}</span>
                <div class="order-input-wrap">
                  <i aria-hidden="true">U</i>
                  <input
                    v-model="form.lastName"
                    type="text"
                    required
                    :placeholder="t('client.orderConfirm.placeholders.lastName')"
                  />
                </div>
              </label>
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.phone') }}</span>
                <div class="order-phone-row">
                  <div class="order-input-wrap order-input-wrap--dial">
                    <select v-model="form.countryCode" autocomplete="tel-country-code">
                      <option
                        v-for="item in countryCodeOptions"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </option>
                    </select>
                  </div>
                  <div class="order-input-wrap order-input-wrap--phone">
                    <i aria-hidden="true">P</i>
                    <input
                      v-model="form.phone"
                      type="text"
                      required
                      autocomplete="tel-national"
                      :placeholder="t('client.login.register.phoneNumberPlaceholder')"
                    />
                  </div>
                </div>
              </label>
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.email') }}</span>
                <div class="order-input-wrap">
                  <i aria-hidden="true">@</i>
                  <input
                    v-model="form.email"
                    type="email"
                    :placeholder="t('client.orderConfirm.placeholders.email')"
                  />
                </div>
              </label>
            </div>
          </section>

          <section class="order-card">
            <header class="order-section-title">
              <span class="order-section-title__index">2</span>
              <h2>{{ t('client.orderConfirm.sections.address') }}</h2>
              <span v-if="isLocating" class="order-location-status">
                {{ t('client.orderConfirm.location.locating') }}
              </span>
            </header>
            <div class="order-address-book">
              <div class="order-address-book__bar">
                <strong>{{ t('client.orderConfirm.addressBook.title') }}</strong>
                <button type="button" @click="openAddAddressDialog">
                  <span aria-hidden="true">+</span>
                  {{ t('client.orderConfirm.addressBook.add') }}
                </button>
              </div>
              <p v-if="addressListLoading" class="order-address-book__state">
                {{ t('client.orderConfirm.addressBook.loading') }}
              </p>
              <div v-else-if="addressList.length" class="order-address-picker">
                <div
                  class="order-address-picker__list"
                  role="radiogroup"
                  :aria-label="t('client.orderConfirm.addressBook.title')"
                >
                  <article
                    v-for="item in addressList"
                    :key="item.id"
                    class="order-address-card"
                    :class="{ 'is-selected': selectedAddressId === item.id }"
                  >
                    <button
                      class="order-address-card__select"
                      type="button"
                      role="radio"
                      :aria-checked="selectedAddressId === item.id"
                      @click="selectSavedAddress(item)"
                    >
                      <span class="order-address-card__topline">
                        <span class="order-address-picker__tags">
                          <em>{{ addressCategoryLabel(item.category) }}</em>
                          <em v-if="item.isDefault" class="order-address-picker__default">
                            {{ t('client.orderConfirm.addressBook.defaultTag') }}
                          </em>
                          <em v-if="selectedAddressId === item.id" class="order-address-picker__selected">
                            {{ t('client.orderConfirm.addressBook.selectedTag') }}
                          </em>
                        </span>
                        <i class="order-address-card__radio" aria-hidden="true" />
                      </span>
                      <strong>{{ item.firstName }} {{ item.lastName }}</strong>
                      <span>{{ formatAddressPhone(item) }}</span>
                      <span class="order-address-card__address">{{ formatAddressLine(item) }}</span>
                      <small v-if="item.additionalNotes">{{ item.additionalNotes }}</small>
                    </button>
                    <button
                      class="order-address-card__edit"
                      type="button"
                      @click="openEditAddressDialog(item)"
                    >
                      {{ t('client.orderConfirm.addressBook.edit') }}
                    </button>
                  </article>
                </div>
                <button class="order-address-picker__manual" type="button" @click="selectManualAddress">
                  <span aria-hidden="true">+</span>
                  {{ t('client.orderConfirm.addressBook.manualOption') }}
                </button>
                <p class="order-address-picker__hint">
                  {{ t('client.orderConfirm.addressBook.editHint') }}
                </p>
              </div>
              <p v-else class="order-address-book__state">
                {{ t('client.orderConfirm.addressBook.empty') }}
              </p>
            </div>
            <div class="order-fields-stack">
              <div class="order-address-category">
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
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.district') }}</span>
                <div class="order-input-wrap">
                  <i aria-hidden="true">A</i>
                  <input
                    v-model="form.district"
                    type="text"
                    :placeholder="t('client.orderConfirm.placeholders.district')"
                  />
                </div>
              </label>
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.address') }}</span>
                <div class="order-input-wrap">
                  <i aria-hidden="true">L</i>
                  <input
                    v-model="form.address"
                    type="text"
                    required
                    :placeholder="t('client.orderConfirm.placeholders.address')"
                  />
                </div>
              </label>
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.remark') }}</span>
                <div class="order-input-wrap">
                  <input
                    v-model="form.remark"
                    type="text"
                    :placeholder="t('client.orderConfirm.placeholders.remark')"
                  />
                </div>
              </label>
              <p v-if="locationLookupUsed" class="order-location-attribution">
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

          <section class="order-card">
            <header class="order-section-title">
              <span class="order-section-title__index">3</span>
              <h2>{{ t('client.orderConfirm.sections.time') }}</h2>
            </header>
            <div class="order-fields-grid">
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.serviceDate') }}</span>
                <div class="order-input-wrap" @click="openServiceDatePicker">
                  <i aria-hidden="true">D</i>
                  <input
                    ref="serviceDateInputRef"
                    v-model="form.serviceDate"
                    type="date"
                    required
                    :min="minServiceDate"
                  />
                </div>
                <small class="order-field__hint">
                  {{ t('client.orderConfirm.fields.serviceDateHint') }}
                </small>
              </label>
              <label class="order-field">
                <span>{{ t('client.orderConfirm.fields.serviceTime') }}</span>
                <div class="order-input-wrap">
                  <i aria-hidden="true">T</i>
                  <select
                    v-model="form.timeRange"
                    required
                    @mousedown="handleServiceTimeOpen"
                  >
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
          </section>

          <section class="order-card">
            <header class="order-section-title">
              <span class="order-section-title__index">4</span>
              <h2>{{ t('client.orderConfirm.sections.payment') }}</h2>
            </header>
            <div class="payment-methods">
              <div class="payment-method payment-method--active payment-method--static">
                <strong>Stripe</strong>
                <p>
                  {{
                    locale === 'zh'
                      ? 'Apple Pay、Google Pay、Link 与银行卡会由 Stripe 根据当前设备和浏览器自动展示。'
                      : 'Apple Pay, Google Pay, Link, and cards are shown automatically by Stripe based on the current device and browser.'
                  }}
                </p>
              </div>
            </div>
            <label class="payment-policy">
              <input v-model="agreedPolicy" type="checkbox" required />
              <span>{{ t('client.orderConfirm.payment.policy') }}</span>
            </label>
          </section>
        </div>

        <aside class="order-summary-side">
          <section class="order-summary-card">
            <h2>{{ t('client.orderConfirm.summary.title') }}</h2>
            <div class="order-summary-card__item">
              <div>
                <h3>{{ summaryTitle }}</h3>
                <p>{{ summaryMeta }}</p>
              </div>
              <strong>{{ formatAed(subtotal) }}</strong>
            </div>

            <div class="order-summary-card__prices">
              <div>
                <span>{{ t('client.orderConfirm.summary.subtotal') }}</span>
                <span>{{ formatAed(subtotal) }}</span>
              </div>
              <div>
                <span>{{ t('client.orderConfirm.summary.vat') }}</span>
                <span>{{ formatAed(tax) }}</span>
              </div>
              <div class="order-summary-card__total">
                <span>{{ t('client.orderConfirm.summary.total') }}</span>
                <span>{{ formatAed(total) }}</span>
              </div>
            </div>

            <button
              class="order-summary-card__submit"
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirm"
            >
              {{ t('client.orderConfirm.summary.confirmPay') }}
            </button>
            <p class="order-summary-card__ssl">{{ t('client.orderConfirm.summary.ssl') }}</p>
          </section>
        </aside>
      </div>
    </section>

    <el-dialog
      v-model="addAddressDialogVisible"
      :title="editingAddressId ? t('client.orderConfirm.addressBook.editTitle') : t('client.orderConfirm.addressBook.addTitle')"
      width="min(680px, calc(100% - 32px))"
      :close-on-click-modal="!addressAdding"
      :show-close="!addressAdding"
    >
      <el-form label-position="top" class="order-add-address-form">
        <el-form-item :label="t('client.orderConfirm.addressBook.categoryLabel')">
          <div class="order-add-address-form__categories">
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
        </el-form-item>
        <div class="order-add-address-form__grid">
          <el-form-item :label="t('client.orderConfirm.fields.firstName')" required>
            <el-input v-model="addAddressForm.firstName" :placeholder="t('client.orderConfirm.placeholders.firstName')" />
          </el-form-item>
          <el-form-item :label="t('client.orderConfirm.fields.lastName')" required>
            <el-input v-model="addAddressForm.lastName" :placeholder="t('client.orderConfirm.placeholders.lastName')" />
          </el-form-item>
          <el-form-item :label="t('client.orderConfirm.fields.phone')" required>
            <div class="order-add-address-form__phone">
              <el-select v-model="addAddressForm.phoneCountryCode">
                <el-option
                  v-for="item in countryCodeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-input v-model="addAddressForm.phone" :placeholder="t('client.login.register.phoneNumberPlaceholder')" />
            </div>
          </el-form-item>
          <el-form-item :label="t('client.orderConfirm.fields.email')">
            <el-input v-model="addAddressForm.email" type="email" :placeholder="t('client.orderConfirm.placeholders.email')" />
          </el-form-item>
          <el-form-item :label="t('client.orderConfirm.fields.district')">
            <el-input v-model="addAddressForm.district" :placeholder="t('client.orderConfirm.placeholders.district')" />
          </el-form-item>
          <el-form-item class="order-add-address-form__wide" :label="t('client.orderConfirm.fields.address')" required>
            <el-input v-model="addAddressForm.address" :placeholder="t('client.orderConfirm.placeholders.address')" />
          </el-form-item>
          <el-form-item class="order-add-address-form__wide" :label="t('client.orderConfirm.fields.remark')">
            <el-input
              v-model="addAddressForm.additionalNotes"
              type="textarea"
              :rows="3"
              :placeholder="t('client.orderConfirm.placeholders.remark')"
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button :disabled="addressAdding" @click="addAddressDialogVisible = false">
          {{ t('client.orderConfirm.addressBook.cancel') }}
        </el-button>
        <el-button
          class="order-add-address-form__submit"
          type="primary"
          :loading="addressAdding"
          @click="submitAddressEditor"
        >
          {{ editingAddressId ? t('client.orderConfirm.addressBook.saveChanges') : t('client.orderConfirm.addressBook.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="stripeDialogVisible"
      :title="locale === 'zh' ? 'Stripe 支付' : 'Stripe Payment'"
      width="560px"
      :close-on-click-modal="false"
      :close-on-press-escape="!stripeSubmitting"
      :show-close="!stripeSubmitting"
      @closed="destroyStripeElements"
    >
      <div class="stripe-dialog-body">
        <p class="stripe-dialog-tip">
          {{
            locale === 'zh'
              ? '可用的钱包方式会显示在上方；也可以直接填写银行卡信息完成支付'
              : 'Available wallets appear above; you can also enter your card details below'
          }}
        </p>
        <div
          class="stripe-express-wrap"
          :class="{ 'stripe-express-wrap--hidden': !stripeExpressVisible && !stripeInitializing }"
        >
          <div ref="stripeExpressContainerRef" class="stripe-express-container"></div>
        </div>
        <div ref="stripeElementContainerRef" class="stripe-element-container"></div>
      </div>
      <template #footer>
        <div class="stripe-dialog-actions">
          <button
            class="stripe-dialog-btn stripe-dialog-btn--ghost"
            type="button"
            :disabled="stripeSubmitting"
            @click="stripeDialogVisible = false"
          >
            {{ locale === 'zh' ? '取消' : 'Cancel' }}
          </button>
          <button
            class="stripe-dialog-btn stripe-dialog-btn--primary"
            type="button"
            :disabled="stripeSubmitting || stripeInitializing"
            @click="handleStripeConfirm"
          >
            {{
              stripeSubmitting
                ? (locale === 'zh' ? '支付中...' : 'Paying...')
                : (locale === 'zh' ? '立即支付' : 'Pay Now')
            }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
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
const addAddressDialogVisible = ref(false);
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
const ORDER_PAYMENT_METHOD = 'stripe';
const CREATE_PAY_METHOD = 'stripe';
const PAYMENT_STATUS_SYNC_DELAY_MS = 2000;
const STRIPE_SCRIPT_ID = 'hourx-stripe-js';
const stripePublishableKey =
  typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'string'
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.trim()
    : '';

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

const stripeDialogVisible = ref(false);
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

const getDateText = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
    ElMessage.warning(t('client.orderConfirm.addressBook.listFailed'));
  } finally {
    addressListLoading.value = false;
  }
};

const openAddAddressDialog = () => {
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
  addAddressDialogVisible.value = true;
};

const openEditAddressDialog = (item: ClientAddressRecord) => {
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
  addAddressDialogVisible.value = true;
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
    ElMessage.warning(validationMessage);
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
      addAddressDialogVisible.value = false;
      ElMessage.success(t('client.orderConfirm.addressBook.editSuccess'));
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
    addAddressDialogVisible.value = false;
    ElMessage.success(t('client.orderConfirm.addressBook.addSuccess'));
  } catch (error: any) {
    ElMessage.error(
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
    ElMessage.success(t('client.orderConfirm.location.success'));
  } catch (error) {
    const code = error instanceof LocationLookupError ? error.code : 'LOOKUP_FAILED';
    ElMessage.error(t(`client.orderConfirm.location.errors.${locationErrorKeyMap[code]}`));
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
  const text = String(value).trim();
  return text;
};

const minServiceDate = computed(() => getDateText(new Date()));

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
  const parsed = new Date(`${dateText}T${startTime}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return parsed.getTime() > Date.now();
};

const selectableTimeOptions = computed(() => {
  const selectedDate = normalizeText(form.serviceDate);
  if (!selectedDate) {
    return [] as Array<{ time: string; available: boolean; timeRange: string }>;
  }

  const today = getDateText(new Date());
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
  if (!serviceDate) {
    return;
  }
  if (!spuIdText) {
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
    ElMessage.warning(
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
  () =>
    selectableTimeOptions.value
      .map((item) => `${item.timeRange}:${item.available}`)
      .join('|'),
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
  () => stripeDialogVisible.value,
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
    if (!stripeDialogVisible.value || !stripeClientSecret.value) {
      return;
    }
    await initStripeElements();
  },
);

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

const getPreferredLangs = () =>
  locale.value === 'zh'
    ? ['zh-CN', 'zh', 'en', 'en-US']
    : ['en', 'en-US', 'zh-CN', 'zh'];

const pickI18nValue = (i18n?: I18nText, fallback = ''): string => {
  const valueMap = i18n || {};
  const preferredLangs = getPreferredLangs();
  for (const lang of preferredLangs) {
    const value = valueMap[lang];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === 'string' && value.trim(),
  );
  if (typeof firstValue === 'string') {
    return firstValue.trim();
  }
  return fallback;
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
    // Ignore express checkout destroy errors during dialog close.
  }
  try {
    stripePaymentElement.value?.destroy?.();
  } catch {
    // Ignore stripe element destroy errors during dialog close.
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

const openStripeDialog = async (clientSecret: string) => {
  stripeClientSecret.value = clientSecret;
  stripeDialogVisible.value = true;
  await initStripeElements();
};

const handleStripeSuccess = async () => {
  stripeDialogVisible.value = false;
  ElMessage.success(t('client.orderConfirm.validation.orderSuccess'));
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, PAYMENT_STATUS_SYNC_DELAY_MS);
  });
  await router.push({ name: 'order-list' });
};

const handleStripeConfirmResult = async (confirmResult: StripeConfirmResult) => {
  const errorMessage = normalizeText(confirmResult.error?.message);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const status = normalizeText(confirmResult.paymentIntent?.status).toLowerCase();
  if (
    status === 'succeeded' ||
    status === 'processing' ||
    status === 'requires_capture'
  ) {
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
    ElMessage.error(
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
    ElMessage.error(error?.message || 'Stripe wallet payment failed');
  } finally {
    stripeSubmitting.value = false;
  }
};

const handleStripeConfirm = async () => {
  if (stripeSubmitting.value || stripeInitializing.value) {
    return;
  }
  if (!stripeInstance.value || !stripeElements.value) {
    ElMessage.error(
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
    ElMessage.error(error?.message || 'Stripe payment failed');
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

const parseServiceDateTime = (
  value: unknown,
): { date: string; time: string } => {
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
  const parsed = new Date(`${date}T${timeValue}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  if (parsed.getTime() <= Date.now()) {
    return undefined;
  }
  return `${date} ${timeValue}`;
};

const startStripePayment = async (targetOrderId: number) => {
  const validationUrl = buildValidationUrl();
  const createPayload = {
    orderId: targetOrderId,
    paymentMethod: CREATE_PAY_METHOD,
    validationUrl,
  };
  const paymentResponse = await createPay(createPayload);
  const paymentData = extractEnvelopeData<Record<string, unknown>>(paymentResponse);
  if (!paymentData || typeof paymentData !== 'object') {
    throw new Error('Create payment response is empty');
  }

  const clientSecret = normalizeText(paymentData.clientSecret);
  if (clientSecret) {
    await openStripeDialog(clientSecret);
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
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }
  const spuId = getQueryText('spuId');
  if (spuId) {
    router.push({
      name: 'product-detail',
      params: { spuId },
    });
    return;
  }
  router.push('/services/daily-cleaning');
};

const handleConfirm = async () => {
  if (isSubmitting.value) {
    return;
  }

  const validationMessage = getValidationMessage();
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  const serviceDateTime = buildServiceDateTime();
  if (!serviceDateTime) {
    ElMessage.warning(t('client.orderConfirm.validation.futureTime'));
    return;
  }
  if (orderId.value === null) {
    ElMessage.warning(t('client.orderConfirm.validation.orderIdMissing'));
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
    const result = await saveContactAddress(payload);
    console.info('save contact address success:', result);
    await startStripePayment(orderId.value);
  } catch (error: any) {
    console.error('save contact address failed:', error);
    ElMessage.error(error?.message || 'Payment request failed');
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
.order-confirm-page {
  min-height: 100%;
  background: #f8fafc;
}

.order-confirm-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.order-confirm-subheader {
  height: 64px;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.order-confirm-subheader__inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-confirm-back {
  height: 64px;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--hourx-brand);
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.order-confirm-back__icon {
  color: rgba(15, 23, 42, 0.9);
  font-size: 24px;
}

.order-confirm-secure {
  margin: 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 13px;
  font-weight: 700;
}

.order-confirm-body {
  padding: 16px 0 44px;
}

.order-confirm-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
}

.order-confirm-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.order-card {
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  background: #fff;
  padding: 24px;
}

.order-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-section-title__index {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
}

.order-section-title h2 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 22px;
  line-height: 1.2;
  font-weight: 900;
}

.order-location-status {
  margin-left: auto;
  color: var(--hourx-brand);
  font-size: 12px;
  font-weight: 700;
}

.order-fields-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 14px;
}

.order-fields-stack {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.order-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-field > span {
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  font-weight: 700;
}

.order-field__hint {
  color: rgba(15, 23, 42, 0.55);
  font-size: 12px;
  line-height: 1.4;
}

.order-location-attribution {
  margin: -6px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 11px;
  line-height: 1.4;
}

.order-location-attribution a {
  color: inherit;
}

.order-input-wrap {
  height: 50px;
  border: 1px solid #d1d5dc;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}

.order-input-wrap i {
  width: 16px;
  color: rgba(15, 23, 42, 0.35);
  font-style: normal;
  font-size: 12px;
  line-height: 1;
  text-align: center;
  flex-shrink: 0;
}

.order-input-wrap input,
.order-input-wrap select {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(15, 23, 42, 0.82);
  font-size: 16px;
}

.order-input-wrap input::placeholder {
  color: rgba(15, 23, 42, 0.45);
}

.order-phone-row {
  display: flex;
  gap: 12px;
}

.order-input-wrap--dial {
  width: 162px;
}

.order-input-wrap--dial select {
  cursor: pointer;
}

.order-input-wrap--phone {
  flex: 1;
}

.order-address-book {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #e4e9f0;
  border-radius: 14px;
  background: #f8fafc;
}

.order-address-book__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.order-address-book__bar strong {
  color: #05152b;
  font-size: 15px;
  font-weight: 800;
}

.order-address-book__bar button {
  min-height: 36px;
  border: 1px solid #05152b;
  border-radius: 9px;
  background: #fff;
  color: #05152b;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.order-address-book__bar button span {
  font-size: 20px;
  line-height: 1;
}

.order-address-book__state {
  margin: 16px 0 0;
  color: rgba(5, 21, 43, 0.56);
  font-size: 14px;
}

.order-address-picker {
  margin-top: 14px;
}

.order-address-picker__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.order-address-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d9e1eb;
  border-radius: 12px;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.order-address-card:hover {
  border-color: rgba(5, 21, 43, 0.55);
}

.order-address-card.is-selected {
  border-color: #05152b;
  background: #fbfdff;
  box-shadow: 0 0 0 2px rgba(5, 21, 43, 0.09);
}

.order-address-card__select {
  width: 100%;
  min-height: 164px;
  border: 0;
  background: transparent;
  color: rgba(5, 21, 43, 0.64);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px 14px 45px;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.order-address-card__select:focus-visible {
  outline: 2px solid #05152b;
  outline-offset: -3px;
}

.order-address-card__topline {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.order-address-card__select > strong {
  color: #05152b;
  font-size: 15px;
  line-height: 1.35;
}

.order-address-card__select > span:not(.order-address-card__topline),
.order-address-card__select > small {
  max-width: 100%;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.order-address-card__select > small {
  color: rgba(5, 21, 43, 0.45);
}

.order-address-card__address {
  color: rgba(5, 21, 43, 0.8);
}

.order-address-card__radio {
  position: relative;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  border: 2px solid #aeb9c8;
  border-radius: 50%;
  box-sizing: border-box;
}

.order-address-card.is-selected .order-address-card__radio {
  border-color: #05152b;
}

.order-address-card.is-selected .order-address-card__radio::after {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #05152b;
  content: '';
}

.order-address-card__edit {
  position: absolute;
  right: 14px;
  bottom: 11px;
  min-height: 30px;
  border: 0;
  background: transparent;
  color: #05152b;
  padding: 3px 0;
  font-size: 12px;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.order-address-picker__tags {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.order-address-picker__tags em {
  border-radius: 999px;
  background: rgba(5, 21, 43, 0.08);
  color: #05152b;
  padding: 3px 8px;
  font-size: 11px;
  line-height: 1.2;
  font-style: normal;
  font-weight: 800;
}

.order-address-picker__tags .order-address-picker__default {
  background: rgba(5, 21, 43, 0.14);
}

.order-address-picker__tags .order-address-picker__selected {
  background: #05152b;
  color: #fff;
}

.order-address-picker__manual {
  width: 100%;
  min-height: 44px;
  margin-top: 12px;
  border: 1px dashed #aeb9c8;
  border-radius: 10px;
  background: #fff;
  color: #05152b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.order-address-picker__manual:hover,
.order-address-picker__manual:focus-visible {
  border-color: #05152b;
  outline: none;
}

.order-address-picker__manual span {
  font-size: 20px;
  line-height: 1;
}

.order-address-picker__hint {
  margin: 9px 2px 0;
  color: rgba(5, 21, 43, 0.5);
  font-size: 12px;
  line-height: 1.45;
}

.order-address-category {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.order-address-category > span {
  color: #05152b;
  font-size: 14px;
  font-weight: 700;
}

.order-address-category > div,
.order-add-address-form__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.order-address-category button,
.order-add-address-form__categories button {
  min-width: 92px;
  height: 38px;
  border: 1px solid #d1d9e4;
  border-radius: 999px;
  background: #fff;
  color: rgba(5, 21, 43, 0.64);
  padding: 0 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.order-address-category button.is-active,
.order-add-address-form__categories button.is-active {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
}

.order-add-address-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.order-add-address-form__wide {
  grid-column: 1 / -1;
}

.order-add-address-form__phone {
  width: 100%;
  display: grid;
  grid-template-columns: 158px minmax(0, 1fr);
  gap: 8px;
}

:deep(.order-add-address-form__submit.el-button--primary) {
  border-color: #05152b;
  background: #05152b;
}

:deep(.order-add-address-form__submit.el-button--primary:hover),
:deep(.order-add-address-form__submit.el-button--primary:focus) {
  border-color: #142b49;
  background: #142b49;
}

.payment-methods {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.payment-method {
  min-height: 84px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: rgba(15, 23, 42, 0.58);
  font-size: 16px;
  font-weight: 700;
}

.payment-method--static {
  padding: 16px 18px;
  cursor: default;
}

.payment-method--static strong {
  display: block;
}

.payment-method--static p {
  margin: 8px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}

.payment-method--active {
  border-color: var(--hourx-brand);
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
}

.payment-policy {
  margin-top: 12px;
  min-height: 32px;
  border-radius: 8px;
  background: var(--hourx-brand-soft);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}

.payment-policy input {
  margin: 0;
}

.payment-policy span {
  color: var(--hourx-brand);
  font-size: 12px;
  font-weight: 600;
}

.order-summary-side {
  position: sticky;
  top: 112px;
}

.order-summary-card {
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  background: #fff;
  padding: 24px;
}

.order-summary-card h2 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 22px;
  line-height: 1.2;
  font-weight: 900;
}

.order-summary-card__item {
  margin-top: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.order-summary-card__item h3 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 16px;
  font-weight: 700;
}

.order-summary-card__item p {
  margin: 6px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
}

.order-summary-card__item strong {
  color: rgba(15, 23, 42, 0.9);
  font-size: 20px;
  font-weight: 800;
}

.order-summary-card__prices {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-summary-card__prices > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(15, 23, 42, 0.5);
  font-size: 16px;
  font-weight: 600;
}

.order-summary-card__total {
  margin-top: 2px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.order-summary-card__total span {
  color: var(--hourx-brand);
  font-size: 22px;
  font-weight: 900;
}

.order-summary-card__submit {
  margin-top: 16px;
  width: 100%;
  height: 54px;
  border-radius: 12px;
  border: 2px solid var(--hourx-brand);
  background: var(--hourx-brand);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.order-summary-card__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.order-summary-card__ssl {
  margin: 10px 0 0;
  text-align: center;
  color: rgba(15, 23, 42, 0.35);
  font-size: 12px;
  font-weight: 500;
}

.stripe-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stripe-dialog-tip {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
  font-size: 14px;
}

.stripe-express-wrap {
  min-height: 56px;
}

.stripe-express-wrap--hidden {
  display: none;
}

.stripe-express-container {
  min-height: 56px;
}

.stripe-element-container {
  min-height: 62px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

.stripe-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.stripe-dialog-btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.stripe-dialog-btn--ghost {
  background: #fff;
  color: rgba(15, 23, 42, 0.75);
}

.stripe-dialog-btn--primary {
  border-color: var(--hourx-brand);
  background: var(--hourx-brand);
  color: #fff;
}

.stripe-dialog-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 1160px) {
  .order-confirm-layout {
    grid-template-columns: 1fr;
  }

  .order-summary-side {
    position: static;
  }
}

@media (max-width: 860px) {
  .order-confirm-container {
    width: calc(100% - 32px);
  }

  .order-fields-grid {
    grid-template-columns: 1fr;
  }

  .order-address-picker__list {
    grid-template-columns: 1fr;
  }

  .payment-methods {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .order-confirm-subheader,
  .order-confirm-back {
    height: 56px;
  }

  .order-confirm-back {
    font-size: 24px;
  }

  .order-card,
  .order-summary-card {
    padding: 18px;
  }

  .order-section-title h2,
  .order-summary-card h2 {
    font-size: 22px;
  }

  .order-section-title {
    flex-wrap: wrap;
  }

  .order-location-status {
    width: 100%;
    margin: 2px 0 0 36px;
  }

  .order-phone-row {
    gap: 8px;
  }

  .order-input-wrap--dial {
    width: 138px;
  }

  .order-address-book {
    padding: 14px;
  }

  .order-address-book__bar {
    align-items: flex-start;
  }

  .order-add-address-form__grid {
    grid-template-columns: 1fr;
  }

  .order-add-address-form__wide {
    grid-column: auto;
  }

  .order-add-address-form__phone {
    grid-template-columns: 136px minmax(0, 1fr);
  }
}

@media (max-width: 480px) {
  .order-phone-row {
    flex-direction: column;
  }

  .order-input-wrap--dial {
    width: 100%;
  }

  .order-add-address-form__phone {
    grid-template-columns: 1fr;
  }
}
</style>
