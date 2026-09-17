<template>
  <div class="order-confirm-page">
    <section class="order-confirm-subheader">
      <div class="order-confirm-container order-confirm-subheader__inner">
        <button class="order-confirm-back" type="button" @click="goBack">
          <span class="order-confirm-back__icon" aria-hidden="true">&lt;</span>
          <span>{{ t("client.orderConfirm.pageTitle") }}</span>
        </button>
        <p class="order-confirm-secure">
          {{ t("client.orderConfirm.securePay") }}
        </p>
      </div>
    </section>

    <section class="order-confirm-body">
      <div class="order-confirm-container order-confirm-layout">
        <div class="order-confirm-main">
          <section class="order-card">
            <header class="order-section-title">
              <span class="order-section-title__index">1</span>
              <h2>{{ locale === 'zh' ? '联系信息与服务地址' : 'Contact & Service Address' }}</h2>
            </header>
            <div class="order-address-book">
              <div class="order-address-book__bar">
                <strong>{{ locale === 'zh' ? '服务地址' : 'Service Address' }}</strong>
              </div>
              <p v-if="addressListLoading" class="order-address-book__state">
                {{ t("client.orderConfirm.addressBook.loading") }}
              </p>
              <div v-else-if="addressListError" class="order-address-book__state order-address-book__state--error" role="alert">
                <span>{{ locale === 'zh' ? '地址加载失败，请重试。' : 'Unable to load addresses. Please try again.' }}</span>
                <button type="button" @click="loadAddressBook(selectedAddressId)">{{ locale === 'zh' ? '重试' : 'Retry' }}</button>
              </div>
              <div
                v-else-if="addressList.length && selectedAddress"
                class="order-address-picker"
                :class="{ 'is-expanded': addressPickerExpanded }"
              >
                <button
                  class="order-address-picker__trigger"
                  type="button"
                  :aria-expanded="addressPickerExpanded"
                  @click="addressPickerExpanded = !addressPickerExpanded"
                >
                  <span class="order-address-picker__category-icon" aria-hidden="true">
                    {{ addressCategoryIcon(selectedAddress.category) }}
                  </span>
                  <span class="order-address-picker__summary">
                    <strong>{{ addressCategoryLabel(selectedAddress.category) }}</strong>
                    <small>{{ formatAddressLine(selectedAddress) }}</small>
                  </span>
                  <span class="order-address-picker__arrow" aria-hidden="true">⌄</span>
                </button>
                <div
                  v-if="addressPickerExpanded"
                  class="order-address-picker__list"
                  role="radiogroup"
                  :aria-label="t('client.orderConfirm.addressBook.title')"
                >
                  <button
                    v-for="item in addressList"
                    :key="item.id"
                    class="order-address-picker__option"
                    :class="{ 'is-selected': selectedAddressId === item.id }"
                    type="button"
                    role="radio"
                    :aria-checked="selectedAddressId === item.id"
                    @click="selectSavedAddress(item)"
                  >
                    <span class="order-address-picker__category-icon" aria-hidden="true">
                      {{ addressCategoryIcon(item.category) }}
                    </span>
                    <span class="order-address-picker__summary">
                      <strong>{{ addressCategoryLabel(item.category) }}</strong>
                      <small>{{ formatAddressLine(item) }}</small>
                    </span>
                    <span
                      v-if="selectedAddressId === item.id"
                      class="order-address-picker__check"
                      aria-hidden="true"
                    >✓</span>
                  </button>
                  <button
                    class="order-address-picker__manage"
                    type="button"
                    @click="goManageAddresses"
                  >
                    {{ locale === 'zh' ? '+ 添加新地址' : '+ Add another address' }}
                  </button>
                </div>
              </div>
              <div v-else class="order-address-book__state order-address-book__state--empty">
                <div>
                  <strong>{{ locale === 'zh' ? '还没有服务地址' : 'No service address yet' }}</strong>
                  <span>{{ locale === 'zh' ? '添加地址后即可继续预约。' : 'Add an address to continue your booking.' }}</span>
                </div>
                <button type="button" @click="goManageAddresses">
                  {{ locale === 'zh' ? '添加地址' : 'Add address' }}
                </button>
              </div>
            </div>
          </section>

          <section class="order-card">
            <header class="order-section-title">
              <span class="order-section-title__index">2</span>
              <h2>{{ t("client.orderConfirm.sections.time") }}</h2>
            </header>
            <div class="order-fields-grid">
              <label class="order-field">
                <span>{{ t("client.orderConfirm.fields.serviceDate") }}</span>
                <div class="order-input-wrap order-input-wrap--date">
                  <i aria-hidden="true" @click="openServiceDatePicker">D</i>
                  <el-config-provider :locale="datePickerLocale">
                    <el-date-picker
                      ref="serviceDatePickerRef"
                      v-model="form.serviceDate"
                      class="order-date-picker"
                      popper-class="order-date-picker-popper"
                      type="date"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      :editable="false"
                      :clearable="false"
                      :disabled-date="isServiceDateDisabled"
                      :placeholder="
                        t('client.orderConfirm.placeholders.serviceDate')
                      "
                      :aria-label="t('client.orderConfirm.fields.serviceDate')"
                    />
                  </el-config-provider>
                </div>
                <small class="order-field__hint">
                  {{ localizedServiceDate }}
                </small>
              </label>
              <label class="order-field">
                <span>{{ t("client.orderConfirm.fields.serviceTime") }}</span>
                <div class="order-input-wrap">
                  <i aria-hidden="true">T</i>
                  <select
                    v-model="form.timeRange"
                    required
                    @mousedown="handleServiceTimeOpen"
                  >
                    <option value="" disabled>
                      {{ serviceTimePlaceholder }}
                    </option>
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
              <span class="order-section-title__index">3</span>
              <h2>{{ t("client.orderConfirm.sections.note") }}</h2>
            </header>
            <label class="order-field order-booking-note">
              <span>{{ t("client.orderConfirm.fields.bookingNote") }}</span>
              <textarea
                v-model.trim="form.remark"
                rows="4"
                maxlength="500"
                :placeholder="t('client.orderConfirm.placeholders.bookingNote')"
              />
            </label>
          </section>

          <section class="order-card">
            <header class="order-section-title">
              <span class="order-section-title__index">4</span>
              <h2>{{ t("client.orderConfirm.sections.payment") }}</h2>
            </header>
            <div class="payment-methods">
              <div class="payment-method payment-method--static">
                <span class="payment-method__icon" aria-hidden="true">▣</span>
                <div>
                  <strong>{{ locale === "zh" ? "安全支付" : "Secure payment" }}</strong>
                  <small>{{ locale === "zh" ? "由 Stripe 提供" : "Powered by Stripe" }}</small>
                  <p>Apple Pay · Google Pay · Link · Cards</p>
                </div>
              </div>
            </div>
            <p class="payment-method__note">
              {{
                locale === "zh"
                  ? "可用的支付选项由 Stripe 安全提供，并可能因设备而异。"
                  : "Available payment options are securely provided by Stripe and may vary by device."
              }}
            </p>
            <div class="payment-policy">
              <span>{{ t("client.orderConfirm.payment.policy") }}</span>
              <button type="button" @click="openLegal('terms')">
                {{ locale === "zh" ? "条款与条件" : "Terms & Conditions" }}
              </button>
              <button type="button" @click="openLegal('privacy')">
                {{ locale === "zh" ? "隐私政策" : "Privacy Policy" }}
              </button>
            </div>
          </section>
        </div>

        <aside class="order-summary-side">
          <section class="order-summary-card">
            <h2>{{ t("client.orderConfirm.summary.title") }}</h2>
            <div class="order-summary-card__item">
              <div>
                <h3>{{ summaryTitle }}</h3>
                <p>{{ summaryMeta }}</p>
              </div>
              <strong>{{ formatAed(total) }}</strong>
            </div>

            <div class="order-summary-card__prices">
              <div class="order-summary-card__total">
                <span>{{ t("client.orderConfirm.summary.total") }}</span>
                <span>{{ formatAed(total) }}</span>
              </div>
            </div>

            <button
              class="order-summary-card__submit"
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirm"
            >
              {{
                isCartEditMode
                  ? locale === "zh"
                    ? "确认结算"
                    : "Confirm Checkout"
                  : isCartMode
                    ? locale === "zh"
                      ? "加入预订购物车"
                      : "Add to Booking Cart"
                    : t("client.orderConfirm.summary.confirmPay")
              }}
            </button>
            <p class="order-summary-card__ssl">
              {{ t("client.orderConfirm.summary.ssl") }}
            </p>
          </section>
        </aside>
      </div>
    </section>

    <BookingPolicyConfirm
      v-model="policyDialogVisible"
      :agreed="agreedPolicy"
      :submitting="isSubmitting"
      @update:agreed="agreedPolicy = $event"
      @read-policy="openLegal('terms')"
      @continue="confirmPolicyAndContinue"
    />

    <AgreementDialog v-model="legalDialogVisible" :doc-type="legalDocType" />

    <SavedAddressManager
      ref="checkoutAddressEditorRef"
      :editor-only="true"
      @saved="handleCheckoutAddressSaved"
    />

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
            locale === "zh"
              ? "可用的钱包方式会显示在上方；也可以直接填写银行卡信息完成支付"
              : "Available wallets appear above; you can also enter your card details below"
          }}
        </p>
        <div
          class="stripe-express-wrap"
          :class="{
            'stripe-express-wrap--hidden':
              !stripeExpressVisible && !stripeInitializing,
          }"
        >
          <div
            ref="stripeExpressContainerRef"
            class="stripe-express-container"
          ></div>
        </div>
        <div
          ref="stripeElementContainerRef"
          class="stripe-element-container"
        ></div>
      </div>
      <template #footer>
        <div class="stripe-dialog-actions">
          <button
            class="stripe-dialog-btn stripe-dialog-btn--ghost"
            type="button"
            :disabled="stripeSubmitting"
            @click="stripeDialogVisible = false"
          >
            {{ locale === "zh" ? "取消" : "Cancel" }}
          </button>
          <button
            class="stripe-dialog-btn stripe-dialog-btn--primary"
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
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus"
import elLocaleEn from "element-plus/es/locale/lang/en"
import elLocaleZhCn from "element-plus/es/locale/lang/zh-cn"
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import {
  getClientAddressList,
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
import AgreementDialog from "@/modules/client/components/agreement-dialog.vue"
import BookingPolicyConfirm from "@/modules/client/components/booking-policy-confirm.vue"
import SavedAddressManager from "@/modules/client/components/SavedAddressManager.vue"
import type { LegalDocType } from "@/modules/client/constants/legal"
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

type CheckoutAddressEditorHandle = {
  openCreate: (prefill?: {
    fullName?: string
    phoneCountryCode?: string
    phone?: string
    category?: AddressCategory
  }) => void
}

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: "global" })
const DEFAULT_COUNTRY_CODE = "+971"
const COUNTRY_CODE_ENTRIES = [
  { value: "+971", labelEn: "UAE +971", labelZh: "阿联酋 +971" },
  { value: "+966", labelEn: "Saudi Arabia +966", labelZh: "沙特阿拉伯 +966" },
  { value: "+1", labelEn: "United States +1", labelZh: "美国 +1" },
  { value: "+44", labelEn: "United Kingdom +44", labelZh: "英国 +44" },
  { value: "+91", labelEn: "India +91", labelZh: "印度 +91" },
  { value: "+86", labelEn: "China +86", labelZh: "中国 +86" },
]

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
const policyDialogVisible = ref(false)
const legalDialogVisible = ref(false)
const legalDocType = ref<LegalDocType>("terms")
const isSubmitting = ref(false)
const addressList = ref<ClientAddressRecord[]>([])
const addressListLoading = ref(false)
const addressListError = ref(false)
const selectedAddressId = ref<number | null>(null)
const addressPickerExpanded = ref(false)
const checkoutAddressEditorRef = ref<CheckoutAddressEditorHandle | null>(null)
let isApplyingSavedAddress = false
const serviceDatePickerRef = ref<{
  focus?: () => void
  handleOpen?: () => void
} | null>(null)
const ORDER_PAYMENT_METHOD = "stripe"
const CREATE_PAY_METHOD = "stripe"
const PAYMENT_STATUS_SYNC_DELAY_MS = 2000
const STRIPE_SCRIPT_ID = "hourx-stripe-js"
const stripePublishableKey =
  typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === "string"
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.trim()
    : ""
const { addItem, refreshCart, removeItems } = useCart()

const openLegal = (docType: LegalDocType) => {
  legalDocType.value = docType
  legalDialogVisible.value = true
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

const stripeDialogVisible = ref(false)
const stripeInitializing = ref(false)
const stripeSubmitting = ref(false)
const stripeClientSecret = ref("")
const stripeExpressVisible = ref(true)
const stripeExpressContainerRef = ref<HTMLElement | null>(null)
const stripeElementContainerRef = ref<HTMLElement | null>(null)
const stripeInstance = ref<StripeInstance | null>(null)
const stripeElements = ref<StripeElementsInstance | null>(null)
const stripeExpressElement = ref<StripeElementInstance | null>(null)
const stripePaymentElement = ref<StripeElementInstance | null>(null)

const getStripeLocale = () => (locale.value.startsWith("zh") ? "zh" : "en")

const getDateText = (date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, "0")
  const dd = `${date.getDate()}`.padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

const normalizePhoneNumber = (value: unknown): string =>
  typeof value === "string" ? value.replace(/[^\d]/g, "") : ""

const normalizeAddressCategory = (value: unknown): AddressCategory => {
  if (value === "home" || value === "office" || value === "others") {
    return value
  }
  return "others"
}

const addressCategoryLabel = (category: unknown) => {
  const normalized = normalizeAddressCategory(category)
  return t(`client.orderConfirm.addressBook.categories.${normalized}`)
}

const addressCategoryIcon = (category: unknown) => {
  const normalized = normalizeAddressCategory(category)
  if (normalized === "home") return "⌂"
  if (normalized === "office") return "▣"
  return "●"
}

const selectedAddress = computed(() =>
  addressList.value.find((item) => item.id === selectedAddressId.value) || null,
)

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
  form.category = normalizeAddressCategory(item.category)
  addressPickerExpanded.value = false
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
    ElMessage.warning(t("client.orderConfirm.addressBook.listFailed"))
  } finally {
    addressListLoading.value = false
  }
}

const openAddAddressDialog = () => {
  checkoutAddressEditorRef.value?.openCreate({
    fullName: formatContactName(form.firstName, form.lastName),
    phoneCountryCode: form.countryCode || DEFAULT_COUNTRY_CODE,
    phone: form.phone,
    category: "home" as AddressCategory,
  })
}

const handleCheckoutAddressSaved = async (saved: {
  id: number | null
  record: ClientAddressRecord | null
}) => {
  await loadAddressBook(saved.id)
  if (saved.id === null && saved.record) {
    const matched = addressList.value.find((item) => item.id === saved.record?.id)
    if (matched) selectSavedAddress(matched)
  }
  addressPickerExpanded.value = false
}

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
  const text = String(value).trim()
  return text
}

const minServiceDate = computed(() => getDateText(new Date()))

const datePickerLocale = computed(() =>
  locale.value.startsWith("zh") ? elLocaleZhCn : elLocaleEn,
)

const isServiceDateDisabled = (date: Date) =>
  getDateText(date) < minServiceDate.value

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
  return normalizeText(rangeStart)
}

const isFutureServiceSlot = (dateText: string, timeText: string): boolean => {
  const startTime = extractServiceStartTime(timeText)
  if (!dateText || !startTime) {
    return false
  }
  const parsed = new Date(`${dateText}T${startTime}:00`)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }
  return parsed.getTime() > Date.now()
}

const selectableTimeOptions = computed(() => {
  const selectedDate = normalizeText(form.serviceDate)
  if (!selectedDate) {
    return [] as Array<{ time: string; available: boolean; timeRange: string }>
  }

  const today = getDateText(new Date())
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
  const picker = serviceDatePickerRef.value
  if (!picker) return

  if (typeof picker.handleOpen === "function") {
    picker.handleOpen()
    return
  }

  picker.focus?.()
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
  if (!serviceDate) {
    return
  }
  if (!spuIdText) {
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
    ElMessage.warning(
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
  () => stripeDialogVisible.value,
  (visible) => {
    if (visible) {
      return
    }
    stripeClientSecret.value = ""
    destroyStripeElements()
  },
)

watch(
  () => locale.value,
  async () => {
    if (!stripeDialogVisible.value || !stripeClientSecret.value) {
      return
    }
    await initStripeElements()
  },
)

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

const getPreferredLangs = () =>
  locale.value === "zh"
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"]

const pickI18nValue = (i18n?: I18nText, fallback = ""): string => {
  const valueMap = i18n || {}
  const preferredLangs = getPreferredLangs()
  for (const lang of preferredLangs) {
    const value = valueMap[lang]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === "string" && value.trim(),
  )
  if (typeof firstValue === "string") {
    return firstValue.trim()
  }
  return fallback
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
      .map((id) => pickI18nValue(specValueNameI18n[String(id)], String(id)))
      .filter(Boolean)
    if (labels.length) {
      return labels.join(" / ")
    }
  }
  return (
    getQueryText("specSummary") || t("client.orderConfirm.summary.metaDefault")
  )
})

const subtotal = computed(() => getQueryNumber("subtotal", 0))
const tax = computed(() => getQueryNumber("tax", 0))
const total = computed(() =>
  getQueryNumber("total", subtotal.value + tax.value),
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
    // Ignore express checkout destroy errors during dialog close.
  }
  try {
    stripePaymentElement.value?.destroy?.()
  } catch {
    // Ignore stripe element destroy errors during dialog close.
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

const openStripeDialog = async (clientSecret: string) => {
  stripeClientSecret.value = clientSecret
  stripeDialogVisible.value = true
  await initStripeElements()
}

const handleStripeSuccess = async () => {
  stripeDialogVisible.value = false
  ElMessage.success(t("client.orderConfirm.validation.orderSuccess"))
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, PAYMENT_STATUS_SYNC_DELAY_MS)
  })
  try {
    await refreshCart()
  } catch (error) {
    console.warn("Payment succeeded but refreshing the cart failed:", error)
  }
  await router.push({
    name: "booking-success",
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
    ElMessage.error(
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
    ElMessage.error(error?.message || "Stripe wallet payment failed")
  } finally {
    stripeSubmitting.value = false
  }
}

const handleStripeConfirm = async () => {
  if (stripeSubmitting.value || stripeInitializing.value) {
    return
  }
  if (!stripeInstance.value || !stripeElements.value) {
    ElMessage.error(
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
    ElMessage.error(error?.message || "Stripe payment failed")
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
  const parsed = new Date(`${date}T${timeValue}:00`)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  if (parsed.getTime() <= Date.now()) {
    return undefined
  }
  return `${date} ${timeValue}`
}

const startStripePayment = async (targetOrderId: number) => {
  const validationUrl = buildValidationUrl()
  const createPayload = {
    orderId: targetOrderId,
    paymentMethod: CREATE_PAY_METHOD,
    validationUrl,
  }
  const paymentResponse = await createPay(createPayload)
  const paymentData =
    extractEnvelopeData<Record<string, unknown>>(paymentResponse)
  if (!paymentData || typeof paymentData !== "object") {
    throw new Error("Create payment response is empty")
  }

  const clientSecret = normalizeText(paymentData.clientSecret)
  if (clientSecret) {
    await openStripeDialog(clientSecret)
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
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back()
    return
  }
  const spuId = getQueryText("spuId")
  if (spuId) {
    router.push({
      name: "product-detail",
      params: { spuId },
    })
    return
  }
  router.push("/services/daily-cleaning")
}

const goManageAddresses = () => {
  openAddAddressDialog()
}

const submitBooking = async () => {
  if (isSubmitting.value) {
    return
  }

  const serviceDateTime = buildServiceDateTime()
  if (!serviceDateTime) {
    ElMessage.warning(t("client.orderConfirm.validation.futureTime"))
    return
  }
  if (!isCartMode.value && orderId.value === null) {
    ElMessage.warning(t("client.orderConfirm.validation.orderIdMissing"))
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
    remark: normalizeText(form.remark),
    category: normalizeAddressCategory(form.category),
    serviceTime: normalizeText(form.serviceDate),
    timeRange: Number(form.timeRange),
    paymentMethod: ORDER_PAYMENT_METHOD,
  }

  isSubmitting.value = true
  try {
    if (isCartMode.value) {
      if (!cartSkuDetail.value)
        throw new Error(
          locale.value === "zh"
            ? "购物车商品规格无效"
            : "Invalid cart service configuration",
        )
      await addItem({
        ...addressPayload,
        firstName: normalizeText(form.firstName),
        lastName: normalizeText(form.lastName),
        skuDetail: cartSkuDetail.value,
      })
      if (isCartEditMode.value && editingCartItemId.value) {
        await removeItems([editingCartItemId.value])
      }
      policyDialogVisible.value = false
      ElMessage.success(
        isCartEditMode.value
          ? locale.value === "zh"
            ? "购物车预约已更新"
            : "Cart booking updated"
          : locale.value === "zh"
            ? "已加入预订购物车"
            : "Added to booking cart",
      )
      await router.replace({
        name: "cart",
        query: isCartEditMode.value ? { checkout: "1" } : undefined,
      })
    } else {
      const result = await saveContactAddress({
        ...addressPayload,
        fullName: selectedAddress.value
          ? getAddressFullName(selectedAddress.value)
          : formatContactName(form.firstName, form.lastName),
        orderId: orderId.value,
      })
      console.info("save contact address success:", result)
      policyDialogVisible.value = false
      await startStripePayment(orderId.value as number)
    }
  } catch (error: any) {
    console.error("save contact address failed:", error)
    ElMessage.error(error?.message || "Payment request failed")
  } finally {
    isSubmitting.value = false
  }
}

const handleConfirm = () => {
  const validationMessage = getValidationMessage()
  if (validationMessage) {
    ElMessage.warning(validationMessage)
    return
  }
  if (isCartMode.value) {
    void submitBooking()
    return
  }
  agreedPolicy.value = false
  policyDialogVisible.value = true
}

const confirmPolicyAndContinue = async () => {
  if (!agreedPolicy.value) {
    ElMessage.warning(t("client.orderConfirm.validation.policy"))
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
      ElMessage.warning(
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

.order-booking-note {
  margin-top: 18px;
}

.order-booking-note textarea {
  width: 100%;
  min-height: 104px;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #d1d5dc;
  border-radius: 10px;
  outline: 0;
  resize: vertical;
  color: rgba(15, 23, 42, 0.82);
  background: #fff;
  font: inherit;
  font-size: 15px;
  line-height: 1.5;
}

.order-booking-note textarea:focus {
  border-color: var(--hourx-brand);
  box-shadow: 0 0 0 3px rgb(23 105 194 / 12%);
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

.order-input-wrap--date .order-date-picker {
  flex: 1;
  width: 100%;
  height: 100%;
}

.order-input-wrap--date i {
  cursor: pointer;
}

.order-date-picker :deep(.el-input__wrapper) {
  padding: 0;
  height: 100%;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}

.order-date-picker :deep(.el-input__prefix) {
  display: none;
}

.order-date-picker :deep(.el-input__inner) {
  height: 100%;
  color: rgba(15, 23, 42, 0.82);
  font-size: 16px;
  cursor: pointer;
}

.order-date-picker :deep(.el-input__inner::placeholder) {
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

.order-address-book__state--error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff7f7;
  color: #b91c1c;
}

.order-address-book__state--error button {
  min-height: 32px;
  padding: 0 13px;
  border: 0;
  border-radius: 8px;
  background: #1769c2;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.order-address-book__state--empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #fff;
}

.order-address-book__state--empty div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.order-address-book__state--empty strong {
  color: #05152b;
  font-size: 14px;
}

.order-address-book__state--empty span {
  line-height: 1.5;
}

.order-address-book__state--empty button {
  min-height: 36px;
  flex: 0 0 auto;
  padding: 0 16px;
  border: 0;
  border-radius: 9px;
  background: #1769c2;
  color: #fff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.order-address-book__state--empty button:hover {
  background: #12569f;
}

.order-address-picker {
  position: relative;
  margin-top: 14px;
}

.order-address-picker__trigger,
.order-address-picker__option {
  width: 100%;
  min-width: 0;
  border: 0;
  background: #fff;
  color: #05152b;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.order-address-picker__trigger {
  min-height: 70px;
  border: 1px solid #d9e1eb;
  border-radius: 12px;
}

.order-address-picker.is-expanded .order-address-picker__trigger {
  border-color: #1769c2;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 0 0 2px rgba(23, 105, 194, 0.08);
}

.order-address-picker__category-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: #edf5ff;
  color: #1769c2;
  font-size: 18px;
  font-weight: 900;
}

.order-address-picker__summary {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-address-picker__summary strong {
  font-size: 14px;
  line-height: 1.3;
}

.order-address-picker__summary small {
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.order-address-picker__arrow {
  justify-self: center;
  color: #64748b;
  font-size: 22px;
  line-height: 1;
  transition: transform 0.18s ease;
}

.order-address-picker.is-expanded .order-address-picker__arrow {
  transform: rotate(180deg);
}

.order-address-picker__list {
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: min(48vh, 360px);
  overflow-y: auto;
  border: 1px solid #1769c2;
  border-radius: 0 0 12px 12px;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0 18px 40px rgba(5, 21, 43, 0.16);
}

.order-address-picker__option {
  border-bottom: 1px solid #edf1f5;
}

.order-address-picker__option:hover,
.order-address-picker__option.is-selected {
  background: #edf5ff;
}

.order-address-picker__check {
  justify-self: center;
  width: 20px;
  height: 20px;
  border: 1px solid #1769c2;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #1769c2;
  font-size: 12px;
  font-weight: 900;
}

.order-address-picker__manage {
  min-height: 44px;
  border: 0;
  background: #fff;
  color: #1769c2;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.order-address-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d9e1eb;
  border-radius: 12px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
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
  content: "";
}

.order-address-card__actions {
  position: absolute;
  right: 14px;
  bottom: 11px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-address-card__edit,
.order-address-card__delete {
  min-height: 30px;
  border: 0;
  background: transparent;
  padding: 3px 0;
  font-size: 12px;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.order-address-card__edit {
  color: #05152b;
}

.order-address-card__delete {
  color: #b42318;
}

.order-address-card__delete:disabled {
  cursor: wait;
  opacity: 0.55;
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

.order-address-category > div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.order-address-category button {
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

.order-address-category button.is-active {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
}

.payment-methods {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr;
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
  display: flex;
  align-items: center;
  gap: 14px;
}

.payment-method--static strong {
  display: block;
  color: #172033;
}

.payment-method--static small {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.payment-method__icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #05152b;
  color: #fff;
  font-size: 19px;
}

.payment-method--static p {
  margin: 8px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}

.payment-method__note {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
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
.payment-policy button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
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

  .order-address-book__state--empty {
    align-items: flex-start;
    flex-direction: column;
  }

}

@media (max-width: 480px) {
  .order-phone-row {
    flex-direction: column;
  }

  .order-input-wrap--dial {
    width: 100%;
  }

}
</style>
