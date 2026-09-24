<template>
  <div class="h5-order-page">
    <header class="h5-order-topbar">
      <button class="h5-order-topbar__back" type="button" @click="goBack">
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ t("client.orderConfirm.pageTitle") }}</h1>
      <span class="h5-order-topbar__spacer" />
    </header>

    <main class="h5-order-main">
      <section class="h5-order-card h5-order-card--address">
        <div class="h5-order-card__heading">
          <span class="h5-order-card__heading-icon" aria-hidden="true">
            <van-icon name="location-o" />
          </span>
          <h2>
            {{
              locale === "zh"
                ? "联系信息与服务地址"
                : "Contact & Service Address"
            }}
          </h2>
        </div>
        <div class="h5-address-book">
          <div class="h5-address-book__bar">
            <strong>{{
              locale === "zh" ? "服务地址" : "Service Address"
            }}</strong>
          </div>
          <p v-if="addressListLoading" class="h5-address-book__state">
            {{ t("client.orderConfirm.addressBook.loading") }}
          </p>
          <div
            v-else-if="addressListError"
            class="h5-address-book__state h5-address-book__state--error"
            role="alert"
          >
            <span>{{
              locale === "zh"
                ? "地址加载失败，请重试。"
                : "Unable to load addresses. Please try again."
            }}</span>
            <div class="h5-address-book__error-actions">
              <button type="button" @click="loadAddressBook(selectedAddressId)">
                {{ locale === "zh" ? "重试" : "Retry" }}
              </button>
              <button type="button" @click="openAddAddressPopup">
                {{ locale === "zh" ? "添加地址" : "Add address" }}
              </button>
            </div>
          </div>
          <div
            v-else-if="addressList.length && selectedAddress"
            class="h5-address-picker"
            :class="{ 'is-expanded': addressPickerExpanded }"
          >
            <button
              class="h5-address-picker__trigger"
              type="button"
              :aria-expanded="addressPickerExpanded"
              @click="addressPickerExpanded = !addressPickerExpanded"
            >
              <span
                class="h5-address-picker__category-icon"
                :class="`h5-address-picker__category-icon--${normalizeAddressCategory(selectedAddress.category)}`"
                aria-hidden="true"
              >
                <AddressCategoryIcon
                  :category="normalizeAddressCategory(selectedAddress.category)"
                />
              </span>
              <span class="h5-address-picker__summary">
                <strong>{{
                  addressCategoryLabel(selectedAddress.category)
                }}</strong>
                <span class="h5-address-picker__contact">
                  {{ getAddressFullName(selectedAddress) }}
                  <template v-if="formatAddressPhone(selectedAddress)">
                    · {{ formatAddressPhone(selectedAddress) }}
                  </template>
                </span>
                <small>{{ formatAddressLine(selectedAddress) }}</small>
              </span>
              <van-icon
                class="h5-address-picker__arrow"
                name="arrow"
                aria-hidden="true"
              />
            </button>
            <div
              v-if="addressPickerExpanded"
              class="h5-address-picker__list"
              role="radiogroup"
              :aria-label="t('client.orderConfirm.addressBook.title')"
            >
              <button
                v-for="item in addressList"
                :key="item.id"
                class="h5-address-picker__option"
                :class="{ 'is-selected': selectedAddressId === item.id }"
                type="button"
                role="radio"
                :aria-checked="selectedAddressId === item.id"
                @click="selectSavedAddress(item)"
              >
                <span
                  class="h5-address-picker__category-icon"
                  :class="`h5-address-picker__category-icon--${normalizeAddressCategory(item.category)}`"
                  aria-hidden="true"
                >
                  <AddressCategoryIcon
                    :category="normalizeAddressCategory(item.category)"
                  />
                </span>
                <span class="h5-address-picker__summary">
                  <strong>{{ addressCategoryLabel(item.category) }}</strong>
                  <span class="h5-address-picker__contact">
                    {{ getAddressFullName(item) }}
                    <template v-if="formatAddressPhone(item)">
                      · {{ formatAddressPhone(item) }}
                    </template>
                  </span>
                  <small>{{ formatAddressLine(item) }}</small>
                </span>
                <span
                  v-if="selectedAddressId === item.id"
                  class="h5-address-picker__check"
                  aria-hidden="true"
                  >✓</span
                >
              </button>
              <button
                class="h5-address-picker__manage"
                type="button"
                @click="openAddAddressPopup"
              >
                {{
                  locale === "zh"
                    ? "+ 添加新地址"
                    : "+ Add another address"
                }}
              </button>
            </div>
          </div>
          <div
            v-else
            class="h5-address-book__state h5-address-book__state--empty"
          >
            <van-icon name="location-o" aria-hidden="true" />
            <div>
              <strong>{{
                locale === "zh" ? "还没有服务地址" : "No service address yet"
              }}</strong>
              <span>{{
                locale === "zh"
                  ? "添加地址后即可继续预约。"
                  : "Add an address to continue your booking."
              }}</span>
            </div>
            <button type="button" @click="openAddAddressPopup">
              {{ locale === "zh" ? "去添加" : "Add" }}
            </button>
          </div>
        </div>
      </section>

      <section class="h5-order-card h5-order-card--summary">
        <div class="h5-order-card__heading">
          <span class="h5-order-card__heading-icon" aria-hidden="true">
            <van-icon name="bag-o" />
          </span>
          <h2>{{ t("client.orderConfirm.summary.title") }}</h2>
        </div>
        <div class="h5-order-summary__item">
          <div class="h5-order-summary__visual" aria-hidden="true">
            <img v-if="summaryImageUrl" :src="summaryImageUrl" alt="" />
            <van-icon v-else name="wap-home-o" />
          </div>
          <div class="h5-order-summary__content">
            <strong>{{ summaryTitle }}</strong>
            <p>{{ summaryMeta }}</p>
            <em>{{ formatAed(subtotal) }}</em>
          </div>
        </div>
        <div class="h5-order-summary__prices">
          <div>
            <span>{{ t("client.orderConfirm.summary.subtotal") }}</span>
            <span>{{ formatAed(subtotal) }}</span>
          </div>
          <div>
            <span>{{ t("client.orderConfirm.summary.vat") }}</span>
            <span>{{ formatAed(tax) }}</span>
          </div>
          <div class="h5-order-summary__total">
            <strong>{{ t("h5.orderConfirm.totalLabel") }}</strong>
            <strong>{{ formatAed(total) }}</strong>
          </div>
        </div>
      </section>

      <section class="h5-order-card h5-order-card--time">
        <div class="h5-order-card__heading">
          <span class="h5-order-card__heading-icon" aria-hidden="true">
            <van-icon name="clock-o" />
          </span>
          <h2>{{ t("client.orderConfirm.sections.time") }}</h2>
        </div>
        <div class="h5-order-grid h5-order-grid--two">
          <label class="h5-order-field">
            <span class="h5-order-field__label">
              {{ t("client.orderConfirm.fields.serviceDate") }}
            </span>
            <div class="h5-order-input" @click="openServiceDatePicker">
              <van-icon name="calendar-o" />
              <input
                :value="form.serviceDate"
                type="text"
                readonly
                :placeholder="t('client.orderConfirm.placeholders.serviceDate')"
                :aria-label="t('client.orderConfirm.fields.serviceDate')"
                :title="t('client.orderConfirm.fields.serviceDateHint')"
              />
            </div>
            <small v-if="form.serviceDate" class="h5-order-field__hint">
              {{ localizedServiceDate }}
            </small>
          </label>
          <label class="h5-order-field">
            <span class="h5-order-field__label">
              {{ locale === "zh" ? "服务时段" : "Time slot" }}
            </span>
            <div class="h5-order-input">
              <van-icon name="clock-o" />
              <select
                v-model="form.timeRange"
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
        <p class="h5-order-lead-time">
          <van-icon name="info-o" />
          <span>{{
            t("client.orderConfirm.fields.serviceLeadTimeHint", {
              minutes: bookingLeadMinutes,
            })
          }}</span>
        </p>
      </section>

      <section class="h5-order-card h5-order-card--note">
        <div class="h5-order-card__heading">
          <span class="h5-order-card__heading-icon" aria-hidden="true">
            <van-icon name="notes-o" />
          </span>
          <h2>{{ t("client.orderConfirm.sections.note") }}</h2>
        </div>
        <label class="h5-order-field h5-order-booking-note">
          <span>{{ t("client.orderConfirm.fields.bookingNote") }}</span>
          <div class="h5-order-input h5-order-input--textarea">
            <van-icon name="notes-o" />
            <textarea
              v-model.trim="form.remark"
              rows="3"
              maxlength="500"
              :placeholder="t('client.orderConfirm.placeholders.bookingNote')"
            />
          </div>
        </label>
      </section>

    </main>

    <footer class="h5-order-footer">
      <div class="h5-order-footer__summary">
        <span>{{ t("h5.orderConfirm.totalLabel") }}</span>
        <strong>{{ formatAed(total) }}</strong>
      </div>
      <button
        class="h5-order-footer__submit"
        type="button"
        :disabled="isSubmitting"
        @click="handleConfirm"
      >
        <span>{{
          isCartEditMode
            ? locale === "zh"
              ? "确认结算"
              : "Confirm Checkout"
            : isCartMode
              ? locale === "zh"
                ? "加入购物车"
                : "Add to Cart"
              : t("client.orderConfirm.summary.confirmPay")
        }}</span>
        <van-icon
          :name="isCartMode && !isCartEditMode ? 'shopping-cart-o' : 'shield-o'"
        />
      </button>
      <p class="h5-order-footer__ssl">
        <van-icon name="shield-o" />
        <span>{{ t("client.orderConfirm.summary.ssl") }}</span>
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
          <h3>
            {{
              editingAddressId
                ? t("client.orderConfirm.addressBook.editTitle")
                : t("client.orderConfirm.addressBook.addTitle")
            }}
          </h3>
          <button
            type="button"
            :disabled="addressAdding"
            @click="addAddressPopupVisible = false"
          >
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
            <AddressCategoryIcon :category="item.value" />
            <span>{{ item.label }}</span>
          </button>
        </div>
        <GoogleAddressPicker
          v-if="addAddressPopupVisible"
          class="h5-add-address-sheet__google-map"
          :locale="String(locale)"
          :latitude="addAddressForm.latitude"
          :longitude="addAddressForm.longitude"
          @select="applyGoogleAddressToEditor"
        />
        <div class="h5-add-address-sheet__location">
          <button
            type="button"
            :disabled="addressEditorLocating"
            @click="fillAddressEditorWithCurrentLocation"
          >
            <van-icon name="aim" />
            {{
              addressEditorLocating
                ? t("client.orderConfirm.location.locating")
                : t("client.orderConfirm.location.useCurrent")
            }}
          </button>
          <p>
            {{
              locale === "zh"
                ? "当前位置将自动填写区域和街道，请补充其余地址信息。"
                : "Current location will auto-fill the area and street. Please enter the remaining details."
            }}
          </p>
        </div>
        <div class="h5-add-address-sheet__section">
          <van-icon name="location-o" />
          <div>
            <strong>{{
              locale === "zh" ? "地址详情" : "Address Details"
            }}</strong>
            <small>{{
              locale === "zh"
                ? "请输入您的迪拜地址"
                : "Enter your Dubai address."
            }}</small>
          </div>
        </div>
        <label class="h5-add-address-field">
          <span>{{ t("client.orderConfirm.fields.areaCommunity") }} *</span>
          <input
            v-model="addAddressForm.community"
            type="text"
            maxlength="128"
            :placeholder="t('client.orderConfirm.placeholders.areaCommunity')"
          />
        </label>
        <label class="h5-add-address-field">
          <span>{{ t("client.orderConfirm.fields.street") }} *</span>
          <input
            v-model="addAddressForm.address"
            type="text"
            maxlength="128"
            :placeholder="t('client.orderConfirm.placeholders.street')"
          />
          <span
            v-if="addressEditorLocating"
            class="h5-add-address-field__locating"
          >
            {{ t("client.orderConfirm.location.locating") }}
          </span>
        </label>
        <label class="h5-add-address-field">
          <span>{{ t("client.orderConfirm.fields.buildingVilla") }} *</span>
          <input
            v-model="addAddressForm.building"
            type="text"
            maxlength="128"
            :placeholder="t('client.orderConfirm.placeholders.buildingVilla')"
          />
        </label>
        <label class="h5-add-address-field">
          <span
            >{{ t("client.orderConfirm.fields.apartmentUnitFloor") }} *</span
          >
          <input
            v-model="addAddressForm.roomNo"
            type="text"
            maxlength="128"
            :placeholder="
              t('client.orderConfirm.placeholders.apartmentUnitFloor')
            "
          />
        </label>

        <div class="h5-add-address-sheet__section">
          <van-icon name="contact-o" />
          <div>
            <strong>{{
              locale === "zh" ? "联系人信息" : "Contact Details"
            }}</strong>
            <small>{{
              locale === "zh" ? "我们应该联系谁？" : "Who should we deliver to?"
            }}</small>
          </div>
        </div>
        <label class="h5-add-address-field">
          <span>{{ t("client.orderConfirm.fields.fullName") }} *</span>
          <input
            v-model="addAddressForm.fullName"
            type="text"
            autocomplete="name"
            :placeholder="t('client.orderConfirm.placeholders.fullName')"
          />
        </label>
        <label class="h5-add-address-field">
          <span>{{ t("client.orderConfirm.fields.phone") }} *</span>
          <div class="h5-add-address-field__phone">
            <select v-model="addAddressForm.phoneCountryCode">
              <option
                v-for="item in countryCodeOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </option>
            </select>
            <input
              v-model="addAddressForm.phone"
              type="tel"
              :placeholder="t('client.login.register.phoneNumberPlaceholder')"
            />
          </div>
        </label>
        <div class="h5-add-address-sheet__section">
          <van-icon name="records-o" />
          <div>
            <strong>{{ t("client.orderConfirm.fields.remark") }}</strong>
          </div>
        </div>
        <label class="h5-add-address-field">
          <textarea
            v-model="addAddressForm.additionalNotes"
            rows="2"
            :aria-label="t('client.orderConfirm.fields.remark')"
            :placeholder="t('client.orderConfirm.placeholders.remark')"
          />
        </label>
        <button
          class="h5-add-address-sheet__submit"
          type="button"
          :disabled="addressAdding"
          @click="submitAddressEditor"
        >
          {{
            addressAdding
              ? t("client.orderConfirm.addressBook.saving")
              : editingAddressId
                ? t("client.orderConfirm.addressBook.saveChanges")
                : t("client.orderConfirm.addressBook.save")
          }}
        </button>
      </div>
    </van-popup>

    <van-calendar
      v-model:show="serviceDateCalendarVisible"
      :title="t('client.orderConfirm.fields.serviceDate')"
      :min-date="serviceDateMinDate"
      :default-date="serviceDateDefaultDate"
      :show-confirm="false"
      @confirm="handleServiceDateConfirm"
    />

    <BookingPolicyConfirm
      v-model="policyPopupVisible"
      :agreed="agreedPolicy"
      :submitting="isSubmitting"
      show-order-summary
      :order-summary-items="[
        {
          title: summaryTitle,
          meta: summaryMeta,
          amountText: formatAed(subtotal),
        },
      ]"
      :subtotal-text="formatAed(subtotal)"
      :tax-text="formatAed(tax)"
      :total-text="formatAed(total)"
      @update:agreed="agreedPolicy = $event"
      @read-policy="openLegal('terms')"
      @continue="confirmPolicyAndContinue"
    />

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
          <h3>{{ locale === "zh" ? "Stripe 支付" : "Stripe Payment" }}</h3>
          <button
            type="button"
            :disabled="stripeSubmitting"
            @click="stripePopupVisible = false"
          >
            <van-icon name="cross" />
          </button>
        </div>
        <p class="h5-stripe-sheet__tip">
          {{
            locale === "zh"
              ? "钱包方式会按当前设备自动展示，也可以直接填写银行卡完成支付"
              : "Wallet options depend on your device, or you can pay directly by card."
          }}
        </p>
        <div
          class="h5-stripe-sheet__express"
          :class="{
            'h5-stripe-sheet__express--hidden':
              !stripeExpressVisible && !stripeInitializing,
          }"
        >
          <div
            ref="stripeExpressContainerRef"
            class="h5-stripe-sheet__express-inner"
          ></div>
        </div>
        <div
          ref="stripeElementContainerRef"
          class="h5-stripe-sheet__element"
        ></div>
        <button
          class="h5-stripe-sheet__submit"
          type="button"
          :disabled="stripeSubmitting || stripeInitializing"
          @click="handleStripeConfirm"
        >
          {{
            stripeSubmitting
              ? locale === "zh"
                ? "支付中..."
                : "Paying..."
              : locale === "zh"
                ? "立即支付"
                : "Pay Now"
          }}
        </button>
      </div>
    </van-popup>
    <AgreementDialog v-model="legalDialogVisible" :doc-type="legalDocType" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { showConfirmDialog, showFailToast, showSuccessToast } from "vant"
import {
  addClientAddress,
  deleteClientAddress,
  getClientAddressList,
  updateClientAddress,
  saveContactAddress,
  getLatestAddress,
  getCartDetail,
  type AddressCategory,
  type ClientAddressRecord,
  type LatestAddressRecord,
  getAvailableSelectTime,
  createPay,
  type CartSkuDetail,
} from "@/modules/client/api"
import { useCart } from "@/modules/client/composables/useCart"
import { setClientLocale } from "@/modules/client/locales"
import AgreementDialog from "@/modules/client/components/agreement-dialog.vue"
import BookingPolicyConfirm from "@/modules/client/components/booking-policy-confirm.vue"
import AddressCategoryIcon from "@/modules/client/components/address-category-icon.vue"
import GoogleAddressPicker from "@/modules/client/components/GoogleAddressPicker.vue"
import type { LegalDocType } from "@/modules/client/constants/legal"
import type { GoogleAddressSelection } from "@/modules/client/utils/google-maps"
import {
  locateCurrentAddress,
  LocationLookupError,
  type LocationLookupErrorCode,
} from "@/modules/client/utils/geolocation"
import {
  formatContactName,
  splitContactName,
} from "@/modules/client/utils/order-localization"

type I18nText = Record<string, string>

type AvailableTimeRecord = {
  time?: string
  avaiable?: boolean
  available?: boolean
  timeRange?: number | string
}

type StripeElementInstance = {
  mount: (domElement: HTMLElement | string) => void
  destroy: () => void
  on?: (
    eventName: string,
    handler: (event?: any) => void | Promise<void>,
  ) => void
}

type StripeElementsInstance = {
  create: (
    type: string,
    options?: Record<string, unknown>,
  ) => StripeElementInstance
}

type StripeConfirmResult = {
  error?: { message?: string }
  paymentIntent?: { status?: string }
}

type StripeInstance = {
  elements: (options: Record<string, unknown>) => StripeElementsInstance
  confirmPayment: (
    options: Record<string, unknown>,
  ) => Promise<StripeConfirmResult>
}

type StripeFactory = (
  publishableKey: string,
  options?: { locale?: string },
) => StripeInstance | null

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: "global" })
const { addItem, refreshCart, removeItems } = useCart()

const DEFAULT_COUNTRY_CODE = "+971"
const COUNTRY_CODE_ENTRIES = [
  { value: "+971", labelEn: "UAE +971", labelZh: "阿联酋 +971" },
  { value: "+966", labelEn: "Saudi Arabia +966", labelZh: "沙特阿拉伯 +966" },
  { value: "+1", labelEn: "United States +1", labelZh: "美国 +1" },
  { value: "+44", labelEn: "United Kingdom +44", labelZh: "英国 +44" },
  { value: "+91", labelEn: "India +91", labelZh: "印度 +91" },
  { value: "+86", labelEn: "China +86", labelZh: "中国 +86" },
]
const ORDER_PAYMENT_METHOD = "stripe"
const CREATE_PAY_METHOD = "stripe"
const PAYMENT_STATUS_SYNC_DELAY_MS = 2000
const DEFAULT_BOOKING_LEAD_MINUTES = 60
const configuredBookingLeadMinutes = Number(
  import.meta.env.VITE_BOOKING_LEAD_MINUTES,
)
const bookingLeadMinutes =
  Number.isFinite(configuredBookingLeadMinutes) &&
  configuredBookingLeadMinutes >= 0
    ? configuredBookingLeadMinutes
    : DEFAULT_BOOKING_LEAD_MINUTES
const DUBAI_UTC_OFFSET = "+04:00"
const STRIPE_SCRIPT_ID = "hourx-stripe-js"
const stripePublishableKey =
  typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === "string"
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.trim()
    : ""

const form = reactive({
  firstName: "",
  lastName: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  phone: "",
  district: "",
  address: "",
  building: "",
  roomNo: "",
  community: "",
  latitude: null as number | null,
  longitude: null as number | null,
  remark: "",
  category: "others" as AddressCategory,
  serviceDate: "",
  timeRange: "",
})

const availableTimeRecords = ref<AvailableTimeRecord[]>([])
const isTimeOptionsLoading = ref(false)
const lastLoadedServiceDate = ref("")
const pendingTimeText = ref("")
const pendingTimeRange = ref("")
const agreedPolicy = ref(false)
const policyPopupVisible = ref(false)
const isSubmitting = ref(false)
const isLocating = ref(false)
const locationLookupUsed = ref(false)
const addressList = ref<ClientAddressRecord[]>([])
const addressListLoading = ref(false)
const addressListError = ref(false)
const selectedAddressId = ref<number | null>(null)
const addressPickerExpanded = ref(false)
const addAddressPopupVisible = ref(false)
const addressAdding = ref(false)
const addressDeletingId = ref<number | null>(null)
const addressEditorLocating = ref(false)
const editingAddressId = ref<number | null>(null)
let isApplyingSavedAddress = false
const addAddressForm = reactive({
  fullName: "",
  phoneCountryCode: DEFAULT_COUNTRY_CODE,
  phone: "",
  district: "",
  address: "",
  building: "",
  roomNo: "",
  community: "",
  latitude: null as number | null,
  longitude: null as number | null,
  additionalNotes: "",
  category: "home" as AddressCategory,
})
const serviceDateCalendarVisible = ref(false)

const stripePopupVisible = ref(false)
const stripeInitializing = ref(false)
const stripeSubmitting = ref(false)
const stripeClientSecret = ref("")
const stripeCustomerSessionClientSecret = ref("")
const legalDialogVisible = ref(false)
const legalDocType = ref<LegalDocType>("terms")
const stripeExpressVisible = ref(true)
const stripeExpressContainerRef = ref<HTMLElement | null>(null)
const stripeElementContainerRef = ref<HTMLElement | null>(null)
const stripeInstance = ref<StripeInstance | null>(null)
const stripeElements = ref<StripeElementsInstance | null>(null)
const stripeExpressElement = ref<StripeElementInstance | null>(null)
const stripePaymentElement = ref<StripeElementInstance | null>(null)

const getStripeLocale = () => (locale.value.startsWith("zh") ? "zh" : "en")

const openLegal = (docType: LegalDocType) => {
  legalDocType.value = docType
  legalDialogVisible.value = true
}

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

const normalizeCoordinate = (value: unknown): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") return null
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}

const normalizePhoneNumber = (value: unknown): string =>
  typeof value === "string" ? value.replace(/[^\d]/g, "") : ""

const normalizeAddressCategory = (value: unknown): AddressCategory => {
  if (value === "home" || value === "office" || value === "others") {
    return value
  }
  return "others"
}

const addressCategoryOptions = computed(() => [
  {
    value: "home" as AddressCategory,
    label: t("client.orderConfirm.addressBook.categories.home"),
  },
  {
    value: "office" as AddressCategory,
    label: t("client.orderConfirm.addressBook.categories.office"),
  },
  {
    value: "others" as AddressCategory,
    label: t("client.orderConfirm.addressBook.categories.others"),
  },
])

const addressCategoryLabel = (category: unknown) => {
  const normalized = normalizeAddressCategory(category)
  return t(`client.orderConfirm.addressBook.categories.${normalized}`)
}

const selectedAddress = computed(
  () =>
    addressList.value.find((item) => item.id === selectedAddressId.value) ||
    null,
)

const formatAddressPhone = (item: ClientAddressRecord) =>
  [normalizeText(item.phoneCountryCode), normalizeText(item.phone)]
    .filter(Boolean)
    .join(" ")

const formatAddressLine = (item: ClientAddressRecord) =>
  [
    normalizeText(item.community) || normalizeText(item.district),
    normalizeText(item.address),
    normalizeText(item.building),
    normalizeText(item.roomNo),
  ]
    .filter(Boolean)
    .join(", ")

const getAddressFullName = (item: ClientAddressRecord) =>
  normalizeText(item.fullName)

const normalizeAddressRecord = (
  item: ClientAddressRecord,
): ClientAddressRecord | null => {
  const id = Number(item?.id)
  if (!Number.isFinite(id) || id <= 0) return null
  return {
    ...item,
    id,
    fullName: normalizeText(item.fullName),
    phoneCountryCode:
      normalizeText(item.phoneCountryCode) || DEFAULT_COUNTRY_CODE,
    phone: normalizeText(item.phone),
    district: normalizeText(item.district),
    address: normalizeText(item.address),
    building: normalizeText(item.building),
    roomNo: normalizeText(item.roomNo),
    community: normalizeText(item.community),
    latitude: normalizeCoordinate(item.latitude) ?? undefined,
    longitude: normalizeCoordinate(item.longitude) ?? undefined,
    additionalNotes: normalizeText(item.additionalNotes),
    category: normalizeAddressCategory(item.category),
    isDefault: item.isDefault === true,
  }
}

const selectSavedAddress = (item: ClientAddressRecord) => {
  const fallbackName = splitContactName(getAddressFullName(item))
  isApplyingSavedAddress = true
  selectedAddressId.value = item.id
  form.firstName = fallbackName.firstName
  form.lastName = fallbackName.lastName
  form.countryCode =
    normalizeText(item.phoneCountryCode) || DEFAULT_COUNTRY_CODE
  form.phone = normalizeText(item.phone)
  form.district = normalizeText(item.district)
  form.address = normalizeText(item.address)
  form.building = normalizeText(item.building)
  form.roomNo = normalizeText(item.roomNo)
  form.community = normalizeText(item.community)
  form.latitude = normalizeCoordinate(item.latitude)
  form.longitude = normalizeCoordinate(item.longitude)
  form.category = normalizeAddressCategory(item.category)
  locationLookupUsed.value = false
  addressPickerExpanded.value = false
  isApplyingSavedAddress = false
}

const selectManualAddress = () => {
  isApplyingSavedAddress = true
  selectedAddressId.value = null
  form.district = ""
  form.address = ""
  form.building = ""
  form.roomNo = ""
  form.community = ""
  form.latitude = null
  form.longitude = null
  form.category = "others"
  locationLookupUsed.value = false
  isApplyingSavedAddress = false
}

const loadAddressBook = async (preferredId?: number | null) => {
  addressListLoading.value = true
  addressListError.value = false
  try {
    const records = await getClientAddressList()
    addressList.value = records
      .map(normalizeAddressRecord)
      .filter((item): item is ClientAddressRecord => item !== null)
    const preferred =
      addressList.value.find(
        (item) => preferredId && item.id === preferredId,
      ) ||
      addressList.value.find((item) => item.isDefault) ||
      addressList.value[0]
    if (preferred) {
      selectSavedAddress(preferred)
    } else {
      selectedAddressId.value = null
    }
  } catch (error) {
    console.error("load address list failed:", error)
    addressList.value = []
    selectedAddressId.value = null
    addressListError.value = true
    showFailToast(t("client.orderConfirm.addressBook.listFailed"))
  } finally {
    addressListLoading.value = false
  }
}

const openAddAddressPopup = () => {
  editingAddressId.value = null
  Object.assign(addAddressForm, {
    fullName: formatContactName(form.firstName, form.lastName),
    phoneCountryCode: form.countryCode || DEFAULT_COUNTRY_CODE,
    phone: form.phone,
    district: "",
    address: "",
    building: "",
    roomNo: "",
    community: "",
    latitude: null,
    longitude: null,
    additionalNotes: "",
    category: "home" as AddressCategory,
  })
  addAddressPopupVisible.value = true
}

const applyGoogleAddressToEditor = (selection: GoogleAddressSelection) => {
  const community = normalizeText(selection.community)
  const street =
    normalizeText(selection.street) || normalizeText(selection.formattedAddress)
  const building = normalizeText(selection.building)
  if (community) {
    addAddressForm.community = community
    addAddressForm.district = community
  }
  if (street) addAddressForm.address = street
  if (building && !normalizeText(addAddressForm.building)) {
    addAddressForm.building = building
  }
  addAddressForm.latitude = selection.latitude
  addAddressForm.longitude = selection.longitude
}

const fillAddressEditorWithCurrentLocation = async () => {
  if (addressEditorLocating.value) return
  addressEditorLocating.value = true
  try {
    const result = await locateCurrentAddress(locale.value)
    if (!addAddressPopupVisible.value) return
    const area = result.district || result.address
    addAddressForm.community = area
    addAddressForm.district = area
    addAddressForm.address = result.street || result.address
    addAddressForm.latitude = result.latitude
    addAddressForm.longitude = result.longitude
  } catch (error) {
    const code =
      error instanceof LocationLookupError ? error.code : "LOOKUP_FAILED"
    console.warn("auto locate for address editor failed:", code)
  } finally {
    addressEditorLocating.value = false
  }
}

const openEditAddressPopup = (item: ClientAddressRecord) => {
  editingAddressId.value = item.id
  Object.assign(addAddressForm, {
    fullName: getAddressFullName(item),
    phoneCountryCode:
      normalizeText(item.phoneCountryCode) || DEFAULT_COUNTRY_CODE,
    phone: normalizeText(item.phone),
    district: normalizeText(item.district),
    address: normalizeText(item.address),
    building: normalizeText(item.building),
    roomNo: normalizeText(item.roomNo),
    community: normalizeText(item.community) || normalizeText(item.district),
    latitude: normalizeCoordinate(item.latitude),
    longitude: normalizeCoordinate(item.longitude),
    additionalNotes: normalizeText(item.additionalNotes),
    category: normalizeAddressCategory(item.category),
  })
  addAddressPopupVisible.value = true
}

const deleteSavedAddress = async (item: ClientAddressRecord) => {
  if (addressDeletingId.value !== null) return
  try {
    await showConfirmDialog({
      title: t("client.orderConfirm.addressBook.deleteConfirmTitle"),
      message: t("client.orderConfirm.addressBook.deleteConfirmMessage"),
      confirmButtonText: t("client.orderConfirm.addressBook.delete"),
      cancelButtonText: t("client.orderConfirm.addressBook.cancel"),
    })
  } catch {
    return
  }

  addressDeletingId.value = item.id
  try {
    await deleteClientAddress(item.id)
    if (selectedAddressId.value === item.id) {
      selectManualAddress()
    }
    await loadAddressBook()
    showSuccessToast(t("client.orderConfirm.addressBook.deleteSuccess"))
  } catch (error: any) {
    showFailToast(
      error?.message || t("client.orderConfirm.addressBook.deleteFailed"),
    )
  } finally {
    addressDeletingId.value = null
  }
}

const getAddAddressValidationMessage = () => {
  const requiredFields = [
    [addAddressForm.fullName, t("client.orderConfirm.fields.fullName")],
    [addAddressForm.phone, t("client.orderConfirm.fields.phone")],
    [addAddressForm.community, t("client.orderConfirm.fields.areaCommunity")],
    [addAddressForm.address, t("client.orderConfirm.fields.street")],
    [addAddressForm.building, t("client.orderConfirm.fields.buildingVilla")],
    [addAddressForm.roomNo, t("client.orderConfirm.fields.apartmentUnitFloor")],
  ]
  const missing = requiredFields.find(([value]) => !normalizeText(value))
  if (missing) {
    return t("client.orderConfirm.validation.requiredField", {
      field: missing[1],
    })
  }
  return ""
}

const submitAddressEditor = async () => {
  const validationMessage = getAddAddressValidationMessage()
  if (validationMessage) {
    showFailToast(validationMessage)
    return
  }
  addressAdding.value = true
  try {
    const payload = {
      fullName: normalizeText(addAddressForm.fullName),
      phoneCountryCode:
        normalizeText(addAddressForm.phoneCountryCode) || DEFAULT_COUNTRY_CODE,
      phone: normalizeText(addAddressForm.phone),
      district: normalizeText(addAddressForm.community) || undefined,
      address: normalizeText(addAddressForm.address),
      building: normalizeText(addAddressForm.building),
      roomNo: normalizeText(addAddressForm.roomNo),
      community: normalizeText(addAddressForm.community) || undefined,
      latitude: normalizeCoordinate(addAddressForm.latitude) ?? undefined,
      longitude: normalizeCoordinate(addAddressForm.longitude) ?? undefined,
      additionalNotes:
        normalizeText(addAddressForm.additionalNotes) || undefined,
      category: normalizeAddressCategory(addAddressForm.category),
    }
    if (editingAddressId.value) {
      await updateClientAddress({ id: editingAddressId.value, ...payload })
      await loadAddressBook(editingAddressId.value)
      const edited = addressList.value.find((item) => item.id === editingAddressId.value)
      if (edited) {
        Object.assign(edited, {
          latitude: payload.latitude,
          longitude: payload.longitude,
        })
        selectSavedAddress(edited)
      }
      addAddressPopupVisible.value = false
      showSuccessToast(t("client.orderConfirm.addressBook.editSuccess"))
      return
    }

    const added = await addClientAddress(payload)
    const addedId = Number(typeof added === "number" ? added : added?.id)
    await loadAddressBook(Number.isFinite(addedId) ? addedId : null)
    const matched = Number.isFinite(addedId)
      ? addressList.value.find((item) => item.id === addedId)
      : [...addressList.value]
        .reverse()
        .find(
          (item) =>
            item.address === normalizeText(addAddressForm.address) &&
            item.building === normalizeText(addAddressForm.building) &&
            normalizeText(item.roomNo) ===
              normalizeText(addAddressForm.roomNo) &&
            normalizeText(item.community) ===
              normalizeText(addAddressForm.community) &&
            item.phone === normalizeText(addAddressForm.phone),
        )
    if (matched) {
      Object.assign(matched, {
        latitude: payload.latitude,
        longitude: payload.longitude,
      })
      selectSavedAddress(matched)
    }
    addAddressPopupVisible.value = false
    showSuccessToast(t("client.orderConfirm.addressBook.addSuccess"))
  } catch (error: any) {
    showFailToast(
      error?.message ||
        t(
          editingAddressId.value
            ? "client.orderConfirm.addressBook.editFailed"
            : "client.orderConfirm.addressBook.addFailed",
        ),
    )
  } finally {
    addressAdding.value = false
  }
}

const locationErrorKeyMap: Record<LocationLookupErrorCode, string> = {
  UNSUPPORTED: "unsupported",
  PERMISSION_DENIED: "permissionDenied",
  UNAVAILABLE: "unavailable",
  TIMEOUT: "timeout",
  LOOKUP_FAILED: "lookupFailed",
}

const handleUseCurrentLocation = async () => {
  if (isLocating.value) return
  isLocating.value = true
  try {
    const result = await locateCurrentAddress(locale.value)
    form.district = result.district
    form.address = ""
    form.building = ""
    form.roomNo = ""
    form.community = ""
    form.latitude = result.latitude
    form.longitude = result.longitude
    locationLookupUsed.value = true
    showSuccessToast(t("client.orderConfirm.location.success"))
  } catch (error) {
    const code =
      error instanceof LocationLookupError ? error.code : "LOOKUP_FAILED"
    showFailToast(
      t(`client.orderConfirm.location.errors.${locationErrorKeyMap[code]}`),
    )
  } finally {
    isLocating.value = false
  }
}

const countryCodeOptions = computed(() =>
  COUNTRY_CODE_ENTRIES.map((item) => ({
    value: item.value,
    label: locale.value === "zh" ? item.labelZh : item.labelEn,
  })),
)

const splitPhoneNumber = (
  value: unknown,
): { countryCode: string; phone: string } => {
  const text = normalizeText(value)
  if (!text) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      phone: "",
    }
  }

  const normalized = text.startsWith("+")
    ? `+${text.slice(1).replace(/[^\d]/g, "")}`
    : normalizePhoneNumber(text)
  const matchedCode = COUNTRY_CODE_ENTRIES.map((item) => item.value)
    .sort((left, right) => right.length - left.length)
    .find((code) => {
      const codeDigits = normalizePhoneNumber(code)
      return (
        normalized.startsWith(code) ||
        (!normalized.startsWith("+") && normalized.startsWith(codeDigits))
      )
    })

  if (!matchedCode) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      phone: normalized.startsWith("+")
        ? normalizePhoneNumber(normalized)
        : normalized,
    }
  }

  const matchedDigits = normalizePhoneNumber(matchedCode)
  return {
    countryCode: matchedCode,
    phone: normalized.startsWith(matchedCode)
      ? normalizePhoneNumber(normalized.slice(matchedCode.length))
      : normalizePhoneNumber(normalized.slice(matchedDigits.length)),
  }
}

const normalizeTimeRangeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ""
  }
  return String(value).trim()
}

const getDubaiDateText = (timestamp: number): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp))
  const partMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )
  return `${partMap.year}-${partMap.month}-${partMap.day}`
}

const bookingThreshold = () => Date.now() + bookingLeadMinutes * 60 * 1000
const minServiceDate = computed(() => getDubaiDateText(bookingThreshold()))

const serviceDateMinDate = computed(() => {
  const parsed = new Date(`${minServiceDate.value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
})

const serviceDateDefaultDate = computed(() => {
  const parsed = new Date(`${form.serviceDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return serviceDateMinDate.value
  }
  return parsed.getTime() < serviceDateMinDate.value.getTime()
    ? serviceDateMinDate.value
    : parsed
})

const localizedServiceDate = computed(() => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(form.serviceDate)
  if (!matched) {
    return t("client.orderConfirm.fields.serviceDateHint")
  }

  const [, year, month, day] = matched
  if (locale.value.startsWith("zh")) {
    return `${year}年${Number(month)}月${Number(day)}日`
  }

  return new Intl.DateTimeFormat("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
})

const extractServiceStartTime = (value: string): string => {
  const text = normalizeText(value)
  if (!text) {
    return ""
  }
  const [rangeStart = ""] = text.split("-")
  const normalized = normalizeText(rangeStart)
  const matched = /^(\d{1,2}):(\d{2})$/.exec(normalized)
  if (!matched) {
    return normalized
  }
  return `${matched[1].padStart(2, "0")}:${matched[2]}`
}

const isFutureServiceSlot = (dateText: string, timeText: string): boolean => {
  const startTime = extractServiceStartTime(timeText)
  if (!dateText || !startTime) {
    return false
  }
  const slotTimestamp = Date.parse(
    `${dateText}T${startTime}:00${DUBAI_UTC_OFFSET}`,
  )
  if (Number.isNaN(slotTimestamp)) {
    return false
  }
  return slotTimestamp >= bookingThreshold()
}

const getQueryText = (key: string) => {
  const raw = route.query[key]
  if (Array.isArray(raw)) {
    return typeof raw[0] === "string" ? raw[0].trim() : ""
  }
  return typeof raw === "string" ? raw.trim() : ""
}

const parseQueryJson = <T,>(key: string, fallback: T): T => {
  const raw = getQueryText(key)
  if (!raw) {
    return fallback
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    try {
      const decoded = decodeURIComponent(raw)
      return JSON.parse(decoded) as T
    } catch {
      return fallback
    }
  }
}

const selectableTimeOptions = computed(() => {
  const selectedDate = normalizeText(form.serviceDate)
  if (!selectedDate) {
    return [] as Array<{ time: string; available: boolean; timeRange: string }>
  }

  const today = getDubaiDateText(Date.now())
  if (selectedDate < today) {
    return []
  }

  return availableTimeRecords.value
    .map((item) => {
      const timeRange = normalizeTimeRangeValue(item.timeRange)
      const time = normalizeText(item.time)
      if (!time || !timeRange) {
        return null
      }
      const apiAvailable = item.avaiable ?? item.available ?? false
      return {
        time,
        timeRange,
        available:
          Boolean(apiAvailable) && isFutureServiceSlot(selectedDate, time),
      }
    })
    .filter(
      (item): item is { time: string; available: boolean; timeRange: string } =>
        Boolean(item),
    )
})

const selectedTimeOption = computed(
  () =>
    selectableTimeOptions.value.find(
      (item) => item.timeRange === normalizeTimeRangeValue(form.timeRange),
    ) || null,
)

const applyPendingTimeText = () => {
  if (pendingTimeRange.value) {
    const matched = selectableTimeOptions.value.find(
      (item) => item.timeRange === pendingTimeRange.value,
    )
    if (matched) {
      form.timeRange = matched.timeRange
    }
    pendingTimeRange.value = ""
  }

  if (!pendingTimeText.value) {
    return
  }
  const matched = selectableTimeOptions.value.find((item) => {
    const time = normalizeText(item.time)
    return (
      time === pendingTimeText.value ||
      extractServiceStartTime(time) === pendingTimeText.value
    )
  })
  if (matched) {
    form.timeRange = matched.timeRange
  }
  pendingTimeText.value = ""
}

const openServiceDatePicker = () => {
  serviceDateCalendarVisible.value = true
}

const handleServiceDateConfirm = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, "0")
  const dd = `${date.getDate()}`.padStart(2, "0")
  form.serviceDate = `${yyyy}-${mm}-${dd}`
  serviceDateCalendarVisible.value = false
}

const serviceTimePlaceholder = computed(() => {
  if (!normalizeText(form.serviceDate)) {
    return locale.value === "zh" ? "请先选择日期" : "Please select a date first"
  }
  if (isTimeOptionsLoading.value) {
    return locale.value === "zh" ? "时间加载中..." : "Loading times..."
  }
  if (!selectableTimeOptions.value.length) {
    return locale.value === "zh" ? "暂无可选时间" : "No available times"
  }
  return locale.value === "zh" ? "请选择时间" : "Please select time"
})

const fetchAvailableTimes = async (force = false) => {
  const serviceDate = normalizeText(form.serviceDate)
  const spuIdText = getQueryText("spuId")
  if (!serviceDate || !spuIdText) {
    return
  }
  if (
    !force &&
    lastLoadedServiceDate.value === serviceDate &&
    availableTimeRecords.value.length
  ) {
    return
  }

  isTimeOptionsLoading.value = true
  try {
    const payload = await getAvailableSelectTime({
      spuId: Number.isFinite(Number(spuIdText)) ? Number(spuIdText) : spuIdText,
      serviceTime: serviceDate,
    })
    availableTimeRecords.value = Array.isArray(payload) ? payload : []
    lastLoadedServiceDate.value = serviceDate
    applyPendingTimeText()
  } catch (error) {
    console.error("load available select time failed:", error)
    availableTimeRecords.value = []
    lastLoadedServiceDate.value = ""
  } finally {
    isTimeOptionsLoading.value = false
  }
}

const handleServiceTimeOpen = async () => {
  if (!normalizeText(form.serviceDate)) {
    showFailToast(
      t("client.orderConfirm.validation.requiredField", {
        field: t("client.orderConfirm.fields.serviceDate"),
      }),
    )
    return
  }
  await fetchAvailableTimes()
}

watch(
  () => form.serviceDate,
  (value, oldValue) => {
    if (value !== oldValue) {
      availableTimeRecords.value = []
      lastLoadedServiceDate.value = ""
      pendingTimeText.value = ""
      form.timeRange = ""
      if (normalizeText(value)) {
        void fetchAvailableTimes(true)
      }
    }
  },
)

watch(
  () => [
    form.firstName,
    form.lastName,
    form.countryCode,
    form.phone,
    form.district,
    form.address,
    form.building,
    form.roomNo,
    form.community,
    form.category,
  ],
  () => {
    if (!isApplyingSavedAddress && selectedAddressId.value !== null) {
      selectedAddressId.value = null
    }
  },
  { flush: "sync" },
)

watch(
  () =>
    selectableTimeOptions.value
      .map((item) => `${item.timeRange}:${item.available}`)
      .join("|"),
  () => {
    if (isTimeOptionsLoading.value) {
      return
    }
    applyPendingTimeText()
    const currentValue = normalizeTimeRangeValue(form.timeRange)
    const currentExists = selectableTimeOptions.value.some(
      (item) => item.timeRange === currentValue && item.available,
    )
    if (!currentExists) {
      const firstAvailable = selectableTimeOptions.value.find(
        (item) => item.available,
      )
      form.timeRange = firstAvailable?.timeRange || ""
    }
  },
  { immediate: true },
)

watch(
  () => stripePopupVisible.value,
  (visible) => {
    if (visible) {
      return
    }
    stripeClientSecret.value = ""
    stripeCustomerSessionClientSecret.value = ""
    destroyStripeElements()
  },
)

watch(
  () => locale.value,
  async () => {
    setClientLocale(locale.value === "zh" ? "zh" : "en")
    if (!stripePopupVisible.value || !stripeClientSecret.value) {
      return
    }
    await initStripeElements()
  },
  { immediate: true },
)

const getPreferredLangs = () =>
  locale.value === "zh"
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"]

const pickI18nValue = (i18n?: I18nText, fallback = ""): string => {
  const valueMap = i18n || {}
  for (const lang of getPreferredLangs()) {
    const value = valueMap[lang]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === "string" && value.trim(),
  )
  return typeof firstValue === "string" ? firstValue.trim() : fallback
}

const getQueryNumber = (key: string, fallback = 0) => {
  const numeric = Number(getQueryText(key))
  return Number.isFinite(numeric) ? numeric : fallback
}

const getQueryOrderId = (): number | null => {
  const text = getQueryText("orderId")
  if (!text) {
    return null
  }
  const numeric = Number(text)
  return Number.isFinite(numeric) ? numeric : null
}

const orderId = computed(() => getQueryOrderId())
const isCartEditMode = computed(() => getQueryText("mode") === "cart-edit")
const editingCartItemId = computed(() => getQueryText("cartItemId"))
const isCartMode = computed(() =>
  ["cart", "cart-edit"].includes(getQueryText("mode")),
)
const cartSkuDetail = computed(() =>
  parseQueryJson<CartSkuDetail | null>("cartSkuDetail", null),
)

const summaryTitle = computed(() =>
  pickI18nValue(
    parseQueryJson<I18nText>("titleI18n", {}),
    getQueryText("title") || t("client.orderConfirm.summary.itemDefault"),
  ),
)

const summaryMeta = computed(() => {
  const selectedSpecValueIds = parseQueryJson<string[]>(
    "selectedSpecValueIds",
    [],
  )
  const specValueNameI18n = parseQueryJson<Record<string, I18nText>>(
    "specValueNameI18n",
    {},
  )
  if (Array.isArray(selectedSpecValueIds) && selectedSpecValueIds.length) {
    const labels = selectedSpecValueIds
      .map((id) => pickI18nValue(specValueNameI18n[String(id)], ""))
      .filter(Boolean)
    if (labels.length === selectedSpecValueIds.length) {
      return labels.join(" / ")
    }
  }
  return (
    getQueryText("specSummary") || t("client.orderConfirm.summary.metaDefault")
  )
})

const summaryImageUrl = computed(() => {
  const rawProductImageUrls = parseQueryJson<unknown>("imageUrls", [])
  const productImageUrls = Array.isArray(rawProductImageUrls)
    ? rawProductImageUrls
    : []
  const level1 = parseQueryJson<{ imageUrls?: unknown[] }>("level1", {})
  const categoryImageUrls = Array.isArray(level1.imageUrls)
    ? level1.imageUrls
    : []
  const imageUrl = [...productImageUrls, ...categoryImageUrls].find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  )
  return imageUrl?.trim() || ""
})

const explicitSubtotal = computed(() => getQueryNumber("subtotal", 0))
const explicitTax = computed(() => getQueryNumber("tax", 0))
const total = computed(() =>
  getQueryText("total")
    ? getQueryNumber("total", 0)
    : explicitSubtotal.value + explicitTax.value,
)
const subtotal = computed(() =>
  getQueryText("subtotal") ? explicitSubtotal.value : total.value / 1.05,
)
const tax = computed(() =>
  getQueryText("tax") ? explicitTax.value : Math.max(0, total.value - subtotal.value),
)

const formatAed = (value: number) => `AED ${value.toFixed(2)}`

const extractEnvelopeData = <T,>(payload: unknown): T | null => {
  if (payload === null || payload === undefined) {
    return null
  }
  if (payload && typeof payload === "object") {
    const maybe = payload as Record<string, unknown>
    if ("data" in maybe) {
      return (maybe.data ?? null) as T | null
    }
  }
  return payload as T
}

const buildValidationUrl = (): string => {
  if (typeof window === "undefined") {
    return ""
  }
  return `${window.location.origin}${window.location.pathname}`
}

const navigateToClient = (path: string, query?: Record<string, string>) => {
  setClientLocale(locale.value === "zh" ? "zh" : "en")
  localStorage.setItem("h5-locale", locale.value === "zh" ? "zh" : "en")
  const url = new URL(path, window.location.origin)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value)
      }
    })
  }
  window.location.assign(`${url.pathname}${url.search}${url.hash}`)
}

const loadStripeJs = async () => {
  if (typeof window === "undefined") {
    throw new Error("Stripe is only available in browser")
  }

  if (typeof (window as any).Stripe === "function") {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const existed = document.getElementById(
      STRIPE_SCRIPT_ID,
    ) as HTMLScriptElement | null
    if (existed) {
      existed.addEventListener("load", () => resolve(), { once: true })
      existed.addEventListener(
        "error",
        () => reject(new Error("Failed to load Stripe.js")),
        {
          once: true,
        },
      )
      return
    }

    const script = document.createElement("script")
    script.id = STRIPE_SCRIPT_ID
    script.src = "https://js.stripe.com/v3/"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Stripe.js"))
    document.head.appendChild(script)
  })
}

const destroyStripeElements = () => {
  try {
    stripeExpressElement.value?.destroy?.()
  } catch {
    // ignore destroy errors
  }
  try {
    stripePaymentElement.value?.destroy?.()
  } catch {
    // ignore destroy errors
  }
  stripeExpressElement.value = null
  stripePaymentElement.value = null
  stripeElements.value = null
  stripeExpressVisible.value = true
}

const initStripeElements = async () => {
  if (!stripeClientSecret.value) {
    return
  }
  if (!stripePublishableKey) {
    throw new Error(
      locale.value === "zh"
        ? "缺少 Stripe 公钥，请配置 VITE_STRIPE_PUBLISHABLE_KEY"
        : "Missing Stripe publishable key, please set VITE_STRIPE_PUBLISHABLE_KEY.",
    )
  }

  stripeInitializing.value = true
  try {
    await loadStripeJs()
    const stripeFactory = (window as any).Stripe as StripeFactory | undefined
    if (typeof stripeFactory !== "function") {
      throw new Error("Stripe SDK is unavailable")
    }

    stripeInstance.value = stripeFactory(stripePublishableKey, {
      locale: getStripeLocale(),
    }) as StripeInstance
    if (!stripeInstance.value) {
      throw new Error("Stripe initialization failed")
    }

    await nextTick()
    const expressContainer = stripeExpressContainerRef.value
    const container = stripeElementContainerRef.value
    if (!container) {
      throw new Error("Stripe container is missing")
    }

    destroyStripeElements()
    const elements = stripeInstance.value.elements({
      clientSecret: stripeClientSecret.value,
      ...(stripeCustomerSessionClientSecret.value
        ? { customerSessionClientSecret: stripeCustomerSessionClientSecret.value }
        : {}),
      appearance: { theme: "stripe" },
    })
    if (expressContainer) {
      const expressElement = elements.create("expressCheckout", {
        paymentMethods: {
          applePay: "always",
          googlePay: "always",
        },
      })
      expressElement.on?.(
        "ready",
        (event?: {
          availablePaymentMethods?: Record<string, unknown> | null
        }) => {
          stripeExpressVisible.value = Boolean(event?.availablePaymentMethods)
        },
      )
      expressElement.on?.("confirm", async () => {
        await handleStripeExpressConfirm()
      })
      expressElement.mount(expressContainer)
      stripeExpressElement.value = expressElement
    }
    const paymentElement = elements.create("payment")
    paymentElement.mount(container)
    stripeElements.value = elements
    stripePaymentElement.value = paymentElement
  } finally {
    stripeInitializing.value = false
  }
}

const openStripePopup = async (
  clientSecret: string,
  customerSessionClientSecret = "",
) => {
  stripeClientSecret.value = clientSecret
  stripeCustomerSessionClientSecret.value = customerSessionClientSecret
  stripePopupVisible.value = true
  await initStripeElements()
}

const handleStripeSuccess = async () => {
  stripePopupVisible.value = false
  showSuccessToast(t("client.orderConfirm.validation.orderSuccess"))
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, PAYMENT_STATUS_SYNC_DELAY_MS)
  })
  try {
    await refreshCart()
  } catch (error) {
    console.warn("Payment succeeded but refreshing the cart failed:", error)
  }
  await router.push({
    name: "h5-booking-success",
    query: {
      orderId: String(route.query.orderId || ""),
      service: summaryTitle.value,
      scheduled:
        `${form.serviceDate} ${selectedTimeOption.value?.time || ""}`.trim(),
      amount: String(total.value),
    },
  })
}

const handleStripeConfirmResult = async (
  confirmResult: StripeConfirmResult,
) => {
  const errorMessage = normalizeText(confirmResult.error?.message)
  if (errorMessage) {
    throw new Error(errorMessage)
  }

  const status = normalizeText(
    confirmResult.paymentIntent?.status,
  ).toLowerCase()
  if (
    status === "succeeded" ||
    status === "processing" ||
    status === "requires_capture"
  ) {
    await handleStripeSuccess()
    return
  }

  if (!status) {
    return
  }

  throw new Error(
    locale.value === "zh"
      ? `支付状态异常: ${status}`
      : `Unexpected payment status: ${status}`,
  )
}

const handleStripeExpressConfirm = async () => {
  if (stripeSubmitting.value || stripeInitializing.value) {
    return
  }
  if (!stripeInstance.value || !stripeElements.value) {
    showFailToast(
      locale.value === "zh"
        ? "Stripe 钱包支付组件尚未初始化"
        : "Stripe wallet checkout is not ready.",
    )
    return
  }

  stripeSubmitting.value = true
  try {
    const confirmResult = await stripeInstance.value.confirmPayment({
      elements: stripeElements.value,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
    })
    await handleStripeConfirmResult(confirmResult)
  } catch (error: any) {
    showFailToast(error?.message || "Stripe wallet payment failed")
  } finally {
    stripeSubmitting.value = false
  }
}

const handleStripeConfirm = async () => {
  if (stripeSubmitting.value || stripeInitializing.value) {
    return
  }
  if (!stripeInstance.value || !stripeElements.value) {
    showFailToast(
      locale.value === "zh"
        ? "Stripe 支付组件尚未初始化"
        : "Stripe payment component is not ready.",
    )
    return
  }

  stripeSubmitting.value = true
  try {
    const confirmResult = await stripeInstance.value.confirmPayment({
      elements: stripeElements.value,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
    })
    await handleStripeConfirmResult(confirmResult)
  } catch (error: any) {
    showFailToast(error?.message || "Stripe payment failed")
  } finally {
    stripeSubmitting.value = false
  }
}

const normalizeTimestamp = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value) < 1e12 ? value * 1000 : value
  }
  if (typeof value === "string") {
    const text = value.trim()
    if (!text) return null
    const numeric = Number(text)
    if (Number.isFinite(numeric)) {
      return Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric
    }
  }
  return null
}

const parseServiceDateTime = (
  value: unknown,
): { date: string; time: string } => {
  const timestamp = normalizeTimestamp(value)
  if (timestamp !== null) {
    const parsedByTs = new Date(timestamp)
    if (!Number.isNaN(parsedByTs.getTime())) {
      const yyyy = parsedByTs.getFullYear()
      const mm = `${parsedByTs.getMonth() + 1}`.padStart(2, "0")
      const dd = `${parsedByTs.getDate()}`.padStart(2, "0")
      const hh = `${parsedByTs.getHours()}`.padStart(2, "0")
      const mi = `${parsedByTs.getMinutes()}`.padStart(2, "0")
      return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${mi}`,
      }
    }
  }

  const text = normalizeText(value)
  if (!text) return { date: "", time: "" }

  const matched = text.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
  if (matched) {
    return { date: matched[1] || "", time: matched[2] || "" }
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear()
    const mm = `${parsed.getMonth() + 1}`.padStart(2, "0")
    const dd = `${parsed.getDate()}`.padStart(2, "0")
    const hh = `${parsed.getHours()}`.padStart(2, "0")
    const mi = `${parsed.getMinutes()}`.padStart(2, "0")
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${mi}`,
    }
  }

  const dateOnly = text.match(/(\d{4}-\d{2}-\d{2})/)
  return { date: dateOnly?.[1] || "", time: "" }
}

const fillFormByLatestAddress = (payload: LatestAddressRecord | null) => {
  if (!payload || typeof payload !== "object") {
    return
  }

  const dateTime = parseServiceDateTime(payload.serviceDateTime)
  const serviceDate = normalizeText(
    (payload as LatestAddressRecord & { serviceTime?: string }).serviceTime,
  )
  const timeRange = normalizeTimeRangeValue(
    (payload as LatestAddressRecord & { timeRange?: number | string })
      .timeRange,
  )

  if (serviceDate) {
    form.serviceDate = serviceDate
  } else if (dateTime.date) {
    form.serviceDate = dateTime.date
  }

  if (timeRange) {
    pendingTimeRange.value = timeRange
    form.timeRange = timeRange
  } else if (dateTime.time) {
    pendingTimeText.value = dateTime.time
  }
}

const loadLatestAddress = async () => {
  try {
    const payload = await getLatestAddress()
    fillFormByLatestAddress(payload)
  } catch (error) {
    console.error("load latest address failed:", error)
  }
}

const buildServiceDateTime = (): string | undefined => {
  const date = normalizeText(form.serviceDate)
  const time = extractServiceStartTime(selectedTimeOption.value?.time || "")
  if (!date) {
    return undefined
  }
  const timeValue = time || "00:00"
  const slotTimestamp = Date.parse(`${date}T${timeValue}:00${DUBAI_UTC_OFFSET}`)
  if (Number.isNaN(slotTimestamp)) {
    return undefined
  }
  if (slotTimestamp < bookingThreshold()) {
    return undefined
  }
  return `${date} ${timeValue}`
}

const startStripePayment = async (targetOrderId: number) => {
  const validationUrl = buildValidationUrl()
  const paymentResponse = await createPay({
    orderId: targetOrderId,
    paymentMethod: CREATE_PAY_METHOD,
    validationUrl,
  })
  const paymentData =
    extractEnvelopeData<Record<string, unknown>>(paymentResponse)
  if (!paymentData || typeof paymentData !== "object") {
    throw new Error("Create payment response is empty")
  }

  const clientSecret = normalizeText(paymentData.clientSecret)
  if (clientSecret) {
    await openStripePopup(
      clientSecret,
      normalizeText(paymentData.customerSessionClientSecret),
    )
    return
  }

  const approvalUrl = normalizeText(
    paymentData.approvalUrl ||
      paymentData.redirectUrl ||
      paymentData.checkoutUrl,
  )
  if (approvalUrl && typeof window !== "undefined") {
    window.location.href = approvalUrl
    return
  }

  throw new Error(
    locale.value === "zh"
      ? "未获取到支付参数（clientSecret/跳转链接），请稍后重试"
      : "Missing Stripe payment params (clientSecret/redirect URL), please try again.",
  )
}

const getValidationMessage = (): string => {
  if (!isCartMode.value && orderId.value === null) {
    return t("client.orderConfirm.validation.orderIdMissing")
  }
  if (selectedAddressId.value === null) {
    return locale.value === "zh"
      ? "请先选择个人中心中保存的联系信息与服务地址"
      : "Please select a saved contact and service address"
  }
  if (!selectedAddress.value || !getAddressFullName(selectedAddress.value)) {
    return t("client.orderConfirm.validation.requiredField", {
      field: t("client.orderConfirm.fields.fullName"),
    })
  }
  if (!normalizePhoneNumber(form.phone)) {
    return t("client.orderConfirm.validation.requiredField", {
      field: t("client.orderConfirm.fields.phone"),
    })
  }
  if (!normalizeText(form.address)) {
    return t("client.orderConfirm.validation.requiredField", {
      field: t("client.orderConfirm.fields.address"),
    })
  }
  if (!normalizeText(form.building)) {
    return t("client.orderConfirm.validation.requiredField", {
      field: t("client.orderConfirm.fields.building"),
    })
  }
  if (!normalizeText(form.serviceDate)) {
    return t("client.orderConfirm.validation.requiredField", {
      field: t("client.orderConfirm.fields.serviceDate"),
    })
  }
  if (!normalizeTimeRangeValue(form.timeRange)) {
    return t("client.orderConfirm.validation.requiredField", {
      field: t("client.orderConfirm.fields.serviceTime"),
    })
  }
  if (!buildServiceDateTime()) {
    return t("client.orderConfirm.validation.futureTime")
  }
  return ""
}

const goBack = () => {
  const spuId = getQueryText("spuId")
  if (spuId) {
    router.push({
      name: "h5-product-detail",
      params: { spuId },
      query: {
        breadcrumb: getQueryText("breadcrumb"),
        name: getQueryText("name"),
        categoryId: getQueryText("categoryId"),
        level1: getQueryText("level1"),
      },
    })
    return
  }
  router.push({ name: "h5-home" })
}

const submitBooking = async () => {
  if (isSubmitting.value) {
    return
  }

  const serviceDateTime = buildServiceDateTime()
  if (!serviceDateTime) {
    showFailToast(t("client.orderConfirm.validation.futureTime"))
    return
  }
  if (!isCartMode.value && orderId.value === null) {
    showFailToast(t("client.orderConfirm.validation.orderIdMissing"))
    return
  }

  const addressPayload = {
    addressId: selectedAddressId.value as number,
    phoneCountryCode: normalizeText(form.countryCode) || DEFAULT_COUNTRY_CODE,
    phone: normalizeText(form.phone),
    district: normalizeText(form.district),
    serviceAddress: normalizeText(form.address),
    building: normalizeText(form.building),
    roomNo: normalizeText(form.roomNo),
    community: normalizeText(form.community),
    latitude: normalizeCoordinate(form.latitude) ?? undefined,
    longitude: normalizeCoordinate(form.longitude) ?? undefined,
    remark: normalizeText(form.remark),
    category: normalizeAddressCategory(form.category),
    serviceTime: normalizeText(form.serviceDate),
    timeRange: Number(form.timeRange),
    paymentMethod: ORDER_PAYMENT_METHOD,
  }

  isSubmitting.value = true
  try {
    if (isCartMode.value) {
      if (!cartSkuDetail.value) {
        throw new Error(
          locale.value === "zh"
            ? "购物车商品规格无效"
            : "Invalid cart service configuration",
        )
      }
      await addItem({
        ...addressPayload,
        firstName: normalizeText(form.firstName),
        lastName: normalizeText(form.lastName),
        skuDetail: cartSkuDetail.value,
      })
      if (isCartEditMode.value && editingCartItemId.value) {
        await removeItems([editingCartItemId.value])
      }
      policyPopupVisible.value = false
      showSuccessToast(
        isCartEditMode.value
          ? locale.value === "zh"
            ? "购物车预约已更新"
            : "Cart booking updated"
          : locale.value === "zh"
            ? "已加入预订购物车"
            : "Added to booking cart",
      )
      await router.replace({
        name: "h5-cart",
        query: isCartEditMode.value ? { checkout: "1" } : undefined,
      })
    } else {
      await saveContactAddress({
        ...addressPayload,
        fullName: selectedAddress.value
          ? getAddressFullName(selectedAddress.value)
          : formatContactName(form.firstName, form.lastName),
        orderId: orderId.value,
      })
      policyPopupVisible.value = false
      await startStripePayment(orderId.value as number)
    }
  } catch (error: any) {
    console.error("save contact address failed:", error)
    showFailToast(error?.message || "Payment request failed")
  } finally {
    isSubmitting.value = false
  }
}

const handleConfirm = () => {
  const validationMessage = getValidationMessage()
  if (validationMessage) {
    showFailToast(validationMessage)
    return
  }
  if (isCartMode.value) {
    void submitBooking()
    return
  }
  agreedPolicy.value = false
  policyPopupVisible.value = true
}

const confirmPolicyAndContinue = async () => {
  if (!agreedPolicy.value) {
    showFailToast(t("client.orderConfirm.validation.policy"))
    return
  }
  await submitBooking()
}

onMounted(async () => {
  let preferredAddressId: number | null = null
  if (isCartEditMode.value && editingCartItemId.value) {
    try {
      const cartItem = await getCartDetail(editingCartItemId.value)
      fillFormByLatestAddress(cartItem)
      form.remark = normalizeText(cartItem?.remark)
      const addressId = Number(cartItem?.addressId)
      preferredAddressId = Number.isFinite(addressId) ? addressId : null
    } catch (error: any) {
      showFailToast(
        error?.message ||
          (locale.value === "zh"
            ? "购物车预约信息加载失败"
            : "Unable to load the cart booking"),
      )
    }
  } else {
    await loadLatestAddress()
  }
  await loadAddressBook(preferredAddressId)
})
</script>

<style scoped lang="scss">
.h5-order-page {
  min-height: 100vh;
  background: #f3f5f7;
  padding-bottom: calc(118px + env(safe-area-inset-bottom));
  color: #172033;
}

.h5-order-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 52px;
  padding: 0 12px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  background: rgba(243, 245, 247, 0.92);
  backdrop-filter: blur(16px);
}

.h5-order-topbar__back,
.h5-order-topbar__spacer {
  width: 44px;
  height: 44px;
}

.h5-order-topbar__back {
  border: 0;
  background: transparent;
  color: #172033;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 22px;
}

.h5-order-topbar h1 {
  margin: 0;
  text-align: center;
  color: #172033;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.h5-order-main {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 4px 12px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.h5-order-card {
  background: #fff;
  padding: 16px;
  border: 1px solid rgba(224, 229, 236, 0.72);
  border-radius: 16px;
  box-shadow: 0 3px 14px rgba(20, 30, 48, 0.045);
}

.h5-order-card--summary {
  padding-top: 16px;
}

.h5-order-card__heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.h5-order-card__heading-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: #edf4fb;
  color: var(--hourx-brand);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.h5-order-card__heading-icon :deep(.van-icon) {
  font-size: 17px;
}

.h5-order-card__heading h2 {
  margin: 0;
  color: #172033;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.h5-location-status {
  margin-left: auto;
  color: var(--hourx-brand);
  font-size: 10px;
  font-weight: 700;
}

.h5-order-summary__item {
  margin-top: 14px;
  padding: 12px;
  border-radius: 14px;
  background: #f6f8fa;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: stretch;
  gap: 12px;
}

.h5-order-summary__visual {
  width: 88px;
  height: 88px;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(145deg, #eaf3fc, #f8fbff);
  color: var(--hourx-brand);
  display: grid;
  place-items: center;
}

.h5-order-summary__visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.h5-order-summary__visual :deep(.van-icon) {
  font-size: 28px;
}

.h5-order-summary__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.h5-order-summary__item strong {
  display: block;
  color: #172033;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 800;
}

.h5-order-summary__item p {
  margin: 4px 0 0;
  color: #788598;
  font-size: 11px;
  line-height: 1.4;
}

.h5-order-summary__item em {
  margin-top: auto;
  color: #172033;
  font-size: 14px;
  line-height: 1.3;
  font-style: normal;
  font-weight: 800;
  white-space: nowrap;
}

.h5-order-summary__prices {
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #edf0f3;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.h5-order-summary__prices > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #687588;
  font-size: 11px;
  font-weight: 500;
}

.h5-order-summary__prices > .h5-order-summary__total {
  margin-top: 2px;
  padding-top: 11px;
  border-top: 1px dashed #dfe4ea;
  color: #172033;
  font-size: 13px;
}

.h5-order-summary__total strong:last-child {
  color: var(--hourx-brand);
  font-size: 15px;
  font-weight: 900;
}

.h5-order-grid,
.h5-order-stack {
  margin-top: 14px;
}

.h5-order-grid {
  display: grid;
  gap: 10px;
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

.h5-order-field__label {
  color: #46546a;
  font-size: 11px;
  line-height: 1.3;
  font-weight: 700;
}

.h5-order-field__hint {
  color: #90a1b9;
  font-size: 11px;
  line-height: 1.4;
}

.h5-order-booking-note {
  margin-top: 14px;
}

.h5-order-booking-note > span {
  color: #314158;
  font-size: 12px;
  font-weight: 700;
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
  margin: 12px 0 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  border-radius: 10px;
  background: #f6f8fa;
  padding: 9px 10px;
  color: #687588;
  font-size: 10px;
  line-height: 1.45;
}

.h5-order-lead-time :deep(.van-icon) {
  margin-top: 1px;
  color: var(--hourx-brand);
  flex: 0 0 auto;
}

.h5-address-book {
  margin-top: 14px;
}

.h5-address-book__bar {
  display: none;
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
  margin: 0;
  border-radius: 12px;
  background: #f6f8fa;
  padding: 14px;
  color: #77869b;
  font-size: 12px;
  line-height: 1.5;
}

.h5-address-book__state--error {
  padding: 11px 12px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff7f7;
  color: #b91c1c;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.h5-address-book__state--error button {
  min-height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #1769c2;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.h5-address-book__error-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.h5-address-book__state--empty {
  min-height: 70px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
}

.h5-address-book__state--empty > :deep(.van-icon) {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #edf4fb;
  color: var(--hourx-brand);
  display: grid;
  place-items: center;
  font-size: 18px;
}

.h5-address-book__state--empty div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.h5-address-book__state--empty strong {
  color: #172033;
  font-size: 12px;
  font-weight: 800;
}

.h5-address-book__state--empty span {
  color: #7c899a;
  font-size: 10px;
  line-height: 1.4;
}

.h5-address-book__state--empty button {
  min-width: 52px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  background: #172b4d;
  color: #fff;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 800;
}

.h5-address-picker {
  position: relative;
}

.h5-address-picker__trigger,
.h5-address-picker__option {
  width: 100%;
  min-width: 0;
  border: 0;
  background: #fff;
  color: #05152b;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 12px;
  padding: 13px;
  text-align: left;
  font: inherit;
}

.h5-address-picker__trigger {
  min-height: 88px;
  border: 1px solid #e2e7ed;
  border-radius: 14px;
  background: linear-gradient(135deg, #fbfdff 0%, #f5f8fb 100%);
}

.h5-address-picker.is-expanded .h5-address-picker__trigger {
  border-color: var(--hourx-brand);
  border-radius: 14px 14px 0 0;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.08);
}

.h5-address-picker__category-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: #edf5ff;
  color: #1769c2;
  font-size: 20px;
}

.h5-address-picker__category-icon--office {
  background: #eef1f5;
  color: #40516a;
}

.h5-address-picker__category-icon--others {
  background: #f4f1ed;
  color: #765f43;
}

.h5-address-picker__summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.h5-address-picker__summary strong {
  color: #172033;
  font-size: 13px;
  line-height: 1.3;
  font-weight: 800;
}

.h5-address-picker__contact {
  color: #4d5b70;
  font-size: 10px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.h5-address-picker__summary small {
  color: #788598;
  font-size: 10px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.h5-address-picker__arrow {
  justify-self: center;
  color: #64748b;
  font-size: 15px;
  line-height: 1;
  transition: transform 0.18s ease;
}

.h5-address-picker.is-expanded .h5-address-picker__arrow {
  transform: rotate(90deg);
}

.h5-address-picker__list {
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  max-height: min(54vh, 360px);
  overflow-y: auto;
  border: 1px solid var(--hourx-brand);
  border-radius: 0 0 14px 14px;
  background: #fff;
  box-shadow: 0 16px 36px rgba(5, 21, 43, 0.18);
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.h5-address-picker__option {
  min-height: 82px;
  border-bottom: 1px solid #edf1f5;
}

.h5-address-picker__option.is-selected {
  background: #edf5ff;
}

.h5-address-picker__check {
  justify-self: center;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--hourx-brand);
  color: #fff;
  font-size: 10px;
  font-weight: 900;
}

.h5-address-picker__manage {
  min-height: 42px;
  border: 0;
  background: #fff;
  color: #1769c2;
  font-size: 11px;
  font-weight: 800;
}

.h5-address-card {
  position: relative;
  flex: 0 0 auto;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d9e1eb;
  border-radius: 11px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
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
  content: "";
}

.h5-address-card__actions {
  position: absolute;
  right: 11px;
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.h5-address-card__edit,
.h5-address-card__delete {
  min-width: 38px;
  min-height: 32px;
  border: 0;
  background: transparent;
  padding: 4px 0;
  font-size: 10px;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.h5-address-card__edit {
  color: #05152b;
}

.h5-address-card__delete {
  color: #b42318;
}

.h5-address-card__delete:disabled {
  opacity: 0.55;
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

.h5-add-address-sheet__categories {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.h5-add-address-sheet__categories button {
  min-width: 0;
  height: 68px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
}

.h5-add-address-sheet__categories button :deep(.address-category-icon) {
  font-size: 22px;
}

.h5-add-address-sheet__categories button.is-active {
  border-color: var(--hourx-brand);
  background: #edf4fb;
  color: var(--hourx-brand);
  box-shadow: inset 0 0 0 1px var(--hourx-brand);
}

.h5-order-input {
  min-height: 48px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #f5f7f9;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.h5-order-input:focus-within {
  border-color: rgba(23, 105, 194, 0.48);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.08);
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
  color: #253147;
  font-size: 12px;
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
  min-height: 52px;
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

.h5-order-footer {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  z-index: 24;
  width: min(100%, 560px);
  transform: translateX(-50%);
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(224, 229, 236, 0.8);
  border-bottom: 0;
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -8px 30px rgba(20, 30, 48, 0.1);
  backdrop-filter: blur(18px);
  padding: 10px 12px calc(9px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: minmax(92px, 0.75fr) minmax(205px, 1.6fr);
  gap: 4px 12px;
  align-items: center;
}

.h5-order-footer__summary span {
  display: block;
  color: #62748e;
  font-size: 10px;
  font-weight: 600;
}

.h5-order-footer__summary strong {
  display: block;
  margin-top: 2px;
  color: var(--hourx-brand);
  font-size: 20px;
  line-height: 1;
  font-weight: 900;
}

.h5-order-footer__summary small {
  margin-left: 4px;
  color: #64748b;
  font-size: 9px;
  letter-spacing: 0.04em;
}

.h5-order-footer__submit {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #0b2343 0%, var(--hourx-brand) 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 7px 16px rgba(5, 21, 43, 0.18);
}

.h5-order-footer__submit :deep(.van-icon) {
  font-size: 14px;
}

.h5-order-footer__submit:disabled {
  opacity: 0.7;
}

.h5-order-footer__ssl {
  grid-column: 2;
  margin: 1px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #90a1b9;
  font-size: 8px;
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

.h5-add-address-sheet__google-map {
  margin: 0 0 16px;
}

.h5-add-address-sheet__location {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #bdebd1;
  border-radius: 12px;
  background: #f0fbf5;
  display: grid;
  gap: 9px;
}

.h5-add-address-sheet__location button {
  min-height: 42px;
  border: 0;
  border-radius: 9px;
  background: #1769c2;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.h5-add-address-sheet__location button:disabled {
  opacity: 0.65;
}

.h5-add-address-sheet__location p {
  margin: 0;
  color: #27704d;
  font-size: 10px;
  line-height: 1.45;
}

.h5-add-address-sheet__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.h5-add-address-sheet__section {
  margin: 16px 0 10px;
  padding-top: 14px;
  border-top: 1px solid #edf1f5;
  display: flex;
  align-items: center;
  gap: 10px;
}

.h5-add-address-sheet__section :deep(.van-icon) {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #edf5ff;
  color: var(--hourx-brand);
  font-size: 18px;
}

.h5-add-address-sheet__section div {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.h5-add-address-sheet__section strong {
  color: #17233a;
  font-size: 13px;
}

.h5-add-address-sheet__section small {
  color: #8a99aa;
  font-size: 10px;
  line-height: 1.35;
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

.h5-add-address-field > span.h5-add-address-field__locating {
  color: var(--hourx-brand);
  font-size: 10px;
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
  padding: 20px 18px calc(20px + env(safe-area-inset-bottom));
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
  font-size: 18px;
  font-weight: 900;
}

.h5-stripe-sheet__header button {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #f3f5f7;
  color: #62748e;
  font-size: 18px;
}

.h5-stripe-sheet__tip {
  margin: 12px 0 0;
  border-radius: 11px;
  background: #f5f8fb;
  padding: 10px 12px;
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
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.h5-stripe-sheet__submit {
  margin-top: 14px;
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #0b2343 0%, var(--hourx-brand) 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(5, 21, 43, 0.18);
}

.h5-stripe-sheet__submit:disabled {
  opacity: 0.7;
}

@media (max-width: 360px) {
  .h5-order-grid--two {
    grid-template-columns: 1fr;
  }

  .h5-add-address-sheet__grid,
  .h5-add-address-field__phone {
    grid-template-columns: 1fr;
  }

  .h5-order-footer {
    grid-template-columns: minmax(76px, 0.65fr) minmax(184px, 1.55fr);
    gap: 4px 8px;
  }

  .h5-order-footer__summary strong {
    font-size: 18px;
  }

  .h5-order-footer__submit {
    padding: 0 10px;
    font-size: 11.5px;
  }
}
</style>
