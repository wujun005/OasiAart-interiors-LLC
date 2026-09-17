<template>
  <div class="h5-orders-page">
    <header class="h5-orders-topbar">
      <h1>{{ t("client.orderList.title") }}</h1>
    </header>

    <main class="h5-orders-main">
      <section class="h5-orders-search">
        <van-icon name="search" />
        <input
          v-model.trim="searchKeyword"
          type="text"
          :placeholder="t('client.orderList.searchPlaceholder')"
          @keyup.enter="onSearchNow"
        />
      </section>

      <section class="h5-orders-tabs">
        <button
          v-for="item in statusTabs"
          :key="item.value"
          type="button"
          class="h5-orders-tab"
          :class="{ 'h5-orders-tab--active': selectedStatus === item.value }"
          @click="onStatusChange(item.value)"
        >
          <i v-if="item.dot" :style="{ background: item.dot }" />
          {{ item.label }}
          <b>{{ item.count }}</b>
        </button>
      </section>

      <section class="h5-orders-list">
        <p v-if="isLoading" class="h5-orders-empty">
          {{ t("client.orderList.loading") }}
        </p>
        <div v-else-if="loadError" class="h5-orders-error" role="alert">
          <strong>{{
            locale === "zh" ? "订单暂时无法加载" : "Unable to load orders"
          }}</strong>
          <span>{{
            locale === "zh"
              ? "请检查网络或稍后重试。"
              : "Please check your connection or try again shortly."
          }}</span>
          <button type="button" @click="loadOrders">
            {{ locale === "zh" ? "重试" : "Try Again" }}
          </button>
        </div>
        <p v-else-if="!orderCards.length" class="h5-orders-empty">
          {{ t("client.orderList.empty") }}
        </p>

        <article
          v-for="item in orderCards"
          :key="item.orderNo"
          class="h5-order-card"
          tabindex="0"
          @click="goDetail(item)"
          @keyup.enter="goDetail(item)"
        >
          <header class="h5-order-card__head">
            <div class="h5-order-card__order-no">
              <van-icon name="label-o" />
              <span>{{ item.orderNo }}</span>
            </div>
            <span
              class="h5-order-card__badge"
              :class="badgeClassMap[item.statusCode]"
            >
              {{ item.statusText }}
            </span>
          </header>

          <div class="h5-order-card__body">
            <img
              class="h5-order-card__image"
              :src="item.image"
              :alt="item.title"
            />
            <div class="h5-order-card__content">
              <div class="h5-order-card__title-row">
                <h3>{{ item.title }}</h3>
                <strong>{{ item.amountText }}</strong>
              </div>
              <div
                v-if="item.specText || item.addOnsText"
                class="h5-order-card__selections"
              >
                <span v-if="item.specText">
                  {{ item.specText }}
                </span>
                <span v-if="item.addOnsText">
                  <b>{{ t("client.orderList.addOns") }}:</b>
                  {{ item.addOnsText }}
                </span>
              </div>
            </div>
          </div>

          <div class="h5-order-card__meta">
            <div class="h5-order-card__meta-row">
              <van-icon name="clock-o" />
              <span>
                <small>{{ t("client.orderList.serviceTime") }}</small>
                <strong>{{ item.serviceTimeText }}</strong>
              </span>
            </div>
            <div class="h5-order-card__meta-row">
              <van-icon name="calendar-o" />
              <span>
                <small>{{ t("client.orderList.createdTime") }}</small>
                <strong>{{ item.createdTimeText }}</strong>
              </span>
            </div>
            <div class="h5-order-card__meta-row">
              <van-icon name="location-o" />
              <span>
                <small>{{ t("client.orderList.serviceAddress") }}</small>
                <strong>{{ item.addressText }}</strong>
              </span>
            </div>
          </div>

          <div v-if="item.showActions" class="h5-order-card__actions">
            <button
              v-if="item.canContinue"
              type="button"
              class="h5-order-card__btn h5-order-card__btn--primary"
              :disabled="isManageResolving"
              @click.stop="goContinueBooking(item)"
            >
              {{ locale === "zh" ? "继续预订" : "Continue Booking" }}
            </button>
            <button
              v-if="item.canManage"
              type="button"
              class="h5-order-card__btn h5-order-card__btn--primary"
              @click.stop="requestReschedule(item)"
            >
              {{ locale === "zh" ? "管理预订" : "Manage Booking" }}
            </button>
            <button
              v-if="item.canReview && !item.reviewed"
              type="button"
              class="h5-order-card__btn h5-order-card__btn--ghost"
              @click.stop="openReview(item)"
            >
              {{ t("client.orderList.review") }}
            </button>
            <button
              v-if="item.canRebook"
              type="button"
              class="h5-order-card__btn h5-order-card__btn--primary"
              @click.stop="goRebook(item)"
            >
              {{ t("client.orderList.rebook") }}
            </button>
          </div>
        </article>
      </section>
    </main>

    <nav class="h5-orders-tabbar">
      <button class="h5-orders-tabbar__item" type="button" @click="goHome">
        <van-icon name="home-o" />
        <span>{{ t("client.header.nav.home") }}</span>
      </button>
      <button
        class="h5-orders-tabbar__item"
        type="button"
        @click="router.push({ name: 'h5-cart' })"
      >
        <span class="h5-orders-tabbar__cart-icon">
          <van-icon name="cart-o" />
          <b v-if="cartCount">{{ cartCount > 99 ? "99+" : cartCount }}</b>
        </span>
        <span>{{ t("client.header.nav.cart") }}</span>
      </button>
      <button
        class="h5-orders-tabbar__item h5-orders-tabbar__item--active"
        type="button"
      >
        <van-icon name="orders-o" />
        <span>{{ t("client.header.nav.orders") }}</span>
      </button>
      <button class="h5-orders-tabbar__item" type="button" @click="goProfile">
        <van-icon name="contact-o" />
        <span>{{ t("client.header.profile") }}</span>
      </button>
    </nav>

    <van-popup
      v-model:show="reviewPopupVisible"
      round
      position="bottom"
      :style="{ minHeight: '34vh' }"
    >
      <div class="h5-review-sheet">
        <div class="h5-review-sheet__header">
          <h3>{{ t("client.orderList.reviewDialog.title") }}</h3>
          <button
            type="button"
            :disabled="isReviewSubmitting"
            @click="reviewPopupVisible = false"
          >
            <van-icon name="cross" />
          </button>
        </div>
        <div class="h5-review-sheet__intro">
          <strong>{{ reviewForm.serviceName }}</strong>
          <span>{{
            locale === "zh"
              ? "这次服务体验怎么样？"
              : `How was your ${reviewForm.serviceName} service?`
          }}</span>
        </div>
        <div class="h5-review-sheet__field">
          <span>{{ t("client.orderList.reviewDialog.ratingLabel") }}</span>
          <van-rate v-model="reviewForm.rating" :max="5" />
          <small v-if="reviewRatingLabel">{{ reviewRatingLabel }}</small>
        </div>
        <div class="h5-review-sheet__field">
          <span>{{
            locale === "zh" ? "你最满意什么？" : "WHAT DID YOU LIKE MOST?"
          }}</span>
          <div class="h5-review-tags">
            <button
              v-for="tag in reviewTagOptions"
              :key="tag"
              type="button"
              :class="{ 'is-selected': reviewForm.tags.includes(tag) }"
              @click="toggleReviewTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        <div class="h5-review-sheet__field">
          <span>{{ t("client.orderList.reviewDialog.contentLabel") }}</span>
          <textarea
            v-model.trim="reviewForm.content"
            :placeholder="t('client.orderList.reviewDialog.contentPlaceholder')"
            :disabled="isReviewSubmitting"
            maxlength="500"
          />
          <small class="h5-review-sheet__counter"
            >{{ reviewForm.content.length }}/500</small
          >
        </div>
        <button
          class="h5-review-sheet__submit"
          type="button"
          :disabled="isReviewSubmitting"
          @click="submitReview"
        >
          {{
            isReviewSubmitting
              ? t("client.profile.actions.submitting")
              : t("client.orderList.reviewDialog.submit")
          }}
        </button>
      </div>
    </van-popup>

    <CancellationPolicyGate
      v-model="cancelPolicyVisible"
      @continue="continueCancellation"
    />

    <van-popup
      v-model:show="refundPopupVisible"
      class="h5-refund-popup"
      round
      position="bottom"
      :style="{ maxHeight: 'calc(100dvh - 16px)' }"
    >
      <CancellationModalContent
        :locale="locale"
        :reasons="cancelReasonOptions"
        :reason="refundForm.reason"
        :other-reason="refundForm.otherReason"
        :service-name="refundForm.item?.title"
        :schedule="refundForm.item?.serviceTimeText"
        :amount-text="refundForm.amountText"
        :mode="refundForm.mode"
        :submitting="isRefundSubmitting"
        :confirmed="cancelConfirmed"
        @update:reason="refundForm.reason = $event"
        @update:other-reason="refundForm.otherReason = $event"
        @close="refundPopupVisible = false"
        @done="refundPopupVisible = false"
        @reschedule="rescheduleFromCancel"
        @confirm="submitRefund"
      />
    </van-popup>

    <van-popup
      v-model:show="reschedulePopupVisible"
      class="h5-reschedule-popup"
      round
      position="bottom"
      :close-on-click-overlay="!isRescheduleSubmitting"
      :style="{ maxHeight: 'calc(100dvh - 16px)' }"
    >
      <div class="h5-review-sheet h5-reschedule-sheet">
        <div class="h5-review-sheet__header">
          <h3>{{ locale.startsWith("zh") ? "管理预订" : "Manage Booking" }}</h3>
          <button
            type="button"
            :disabled="isRescheduleSubmitting"
            @click="reschedulePopupVisible = false"
          >
            <van-icon name="cross" />
          </button>
        </div>
        <div class="h5-reschedule-sheet__summary">
          <span>{{ rescheduleForm.serviceName }}</span>
          <small>{{
            locale.startsWith("zh") ? "当前安排" : "Current schedule"
          }}</small>
          <strong>{{ rescheduleForm.currentSchedule }}</strong>
        </div>
        <label class="h5-reschedule-sheet__field">
          <span>{{
            locale.startsWith("zh") ? "新的服务日期" : "New service date"
          }}</span>
          <div
            class="h5-reschedule-sheet__date"
            @click="openRescheduleDatePicker"
          >
            <van-icon name="calendar-o" />
            <input
              :value="rescheduleForm.serviceTime"
              type="text"
              readonly
              :placeholder="
                locale.startsWith('zh')
                  ? '请选择服务日期'
                  : 'Select service date'
              "
            />
            <van-icon name="arrow" />
          </div>
          <small class="h5-reschedule-sheet__date-hint">{{
            localizedRescheduleDate
          }}</small>
        </label>
        <label class="h5-reschedule-sheet__field">
          <span>{{
            locale.startsWith("zh") ? "新的服务时段" : "New time slot"
          }}</span>
          <select
            v-model.number="rescheduleForm.timeRange"
            @mousedown="handleRescheduleTimeOpen"
          >
            <option :value="null" disabled>
              {{ rescheduleTimePlaceholder }}
            </option>
            <option
              v-for="slot in selectableRescheduleTimeOptions"
              :key="slot.timeRange"
              :value="slot.timeRange"
              :disabled="!slot.available || slot.isCurrent"
            >
              {{ slot.time }}{{ slot.isCurrent ? (locale.startsWith("zh") ? "（当前时段）" : " (current slot)") : "" }}
            </option>
          </select>
        </label>
        <p>
          {{
            locale.startsWith("zh")
              ? "提交时会检查时段容量及服务开始前的时间限制。"
              : "Availability and the minimum advance-time rule are checked when you submit."
          }}
        </p>
        <div class="h5-reschedule-sheet__actions">
          <button
            class="h5-reschedule-sheet__cancel"
            type="button"
            :disabled="isRescheduleSubmitting"
            @click="cancelFromManage"
          >
            {{ locale.startsWith("zh") ? "取消预订" : "Cancel Booking" }}
          </button>
          <button
            class="h5-review-sheet__submit"
            type="button"
            :disabled="
              isRescheduleSubmitting ||
              isRescheduleTimeLoading
            "
            @click="submitReschedule"
          >
            {{
              isRescheduleSubmitting
                ? locale.startsWith("zh")
                  ? "提交中…"
                  : "Submitting…"
                : locale.startsWith("zh")
                  ? "确认改期"
                  : "Confirm Reschedule"
            }}
          </button>
        </div>
      </div>
    </van-popup>
    <van-calendar
      v-model:show="rescheduleDateCalendarVisible"
      :title="locale.startsWith('zh') ? '新的服务日期' : 'New service date'"
      :min-date="rescheduleDateMinDate"
      :default-date="rescheduleDateDefaultDate"
      :show-confirm="false"
      @confirm="handleRescheduleDateConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { showFailToast, showSuccessToast } from "vant"
import {
  cancelOrder,
  checkOrderRefund,
  getAvailableSelectTime,
  getOrderByOrderNo,
  getRefundReasons,
  getOrderList,
  requestOrderRefund,
  rescheduleOrder,
  review,
  type OrderListRecord,
  type OrderRefundCheckResult,
  type RefundReasonRecord,
} from "@/modules/client/api"
import { useCart } from "@/modules/client/composables/useCart"
import CancellationPolicyGate from "@/modules/client/components/CancellationPolicyGate.vue"
import CancellationModalContent from "@/modules/client/components/CancellationModalContent.vue"
import {
  formatCreatedAt,
  formatServiceSchedule,
} from "@/modules/client/utils/order-date-time"
import {
  formatOrderAddOns,
  formatOrderSpecs,
} from "@/modules/client/utils/order-localization"

type I18nMap = Record<string, string>
type OrderListTab = "ACTIVE" | "HISTORY"

type AvailableTimeRecord = {
  time?: string
  avaiable?: boolean
  available?: boolean
  timeRange?: number | string
}

type RebookSpecSelection = {
  specTypeId: string
  specValueId: string
}

type RebookAttachSelection = {
  attachValueId: string
  quantity: number
}

type OrderCardView = {
  orderId?: string
  orderNo: string
  spuId: string
  statusCode: 1 | 2 | 3 | 4
  rawOrderStatus: number | null
  title: string
  amountText: string
  serviceTimeText: string
  createdTimeText: string
  addressText: string
  specText: string
  addOnsText: string
  statusText: string
  image: string
  reviewed: boolean
  showActions: boolean
  canContinue: boolean
  canManage: boolean
  canReview: boolean
  canRebook: boolean
  specSelections: RebookSpecSelection[]
  attachSelections: RebookAttachSelection[]
  record: OrderListRecord
}

const fallbackImages = [
  "https://www.figma.com/api/mcp/asset/db809cc9-6be7-4a8a-b172-c01ceb90c52d",
  "https://www.figma.com/api/mcp/asset/73059317-b96b-4536-a776-8bffc89f5dde",
  "https://www.figma.com/api/mcp/asset/126efaa5-90af-4a3b-957b-062383f10321",
]

const { t, locale } = useI18n({ useScope: "global" })
const router = useRouter()
const route = useRoute()
const { cartCount } = useCart()

const badgeClassMap: Record<1 | 2 | 3 | 4, string> = {
  1: "h5-order-card__badge--action",
  2: "h5-order-card__badge--progress",
  3: "h5-order-card__badge--done",
  4: "h5-order-card__badge--cancel",
}

const selectedStatus = ref<OrderListTab>("ACTIVE")
const searchKeyword = ref("")
const orderRecords = ref<OrderListRecord[]>([])
const tabCounts = ref<Record<OrderListTab, number>>({ ACTIVE: 0, HISTORY: 0 })
const isLoading = ref(false)
const loadError = ref(false)
const reviewPopupVisible = ref(false)
const isReviewSubmitting = ref(false)
const cancelPolicyVisible = ref(false)
const refundPopupVisible = ref(false)
const isRefundSubmitting = ref(false)
const reschedulePopupVisible = ref(false)
const isRescheduleSubmitting = ref(false)
const isManageResolving = ref(false)
const cancelConfirmed = ref(false)
const reviewForm = ref({
  orderNo: "",
  serviceName: "",
  rating: 0,
  content: "",
  tags: [] as string[],
})
const refundForm = ref({
  orderNo: "",
  reason: "",
  otherReason: "",
  amountText: "",
  handlingFeeText: "",
  mode: "refund" as "refund" | "cancel",
  item: null as OrderCardView | null,
})
const refundReasonRecords = ref<RefundReasonRecord[]>([])
const rescheduleForm = ref({
  orderNo: "",
  spuId: "",
  serviceName: "",
  currentSchedule: "",
  currentServiceDate: "",
  currentTimeText: "",
  serviceTime: "",
  timeRange: null as number | null,
  item: null as OrderCardView | null,
})
const rescheduleAvailableTimeRecords = ref<AvailableTimeRecord[]>([])
const isRescheduleTimeLoading = ref(false)
const lastLoadedRescheduleKey = ref("")
const normalizeTimeSlot = (value: string) =>
  String(value || "").replace(/\s/g, "").replace(/[–—]/g, "-")
const rescheduleDateCalendarVisible = ref(false)
const minRescheduleDate = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
})
const rescheduleDateMinDate = computed(() => {
  const parsed = new Date(`${minRescheduleDate.value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
})
const rescheduleDateDefaultDate = computed(() => {
  const parsed = new Date(`${rescheduleForm.value.serviceTime}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return rescheduleDateMinDate.value
  return parsed.getTime() < rescheduleDateMinDate.value.getTime()
    ? rescheduleDateMinDate.value
    : parsed
})
const localizedRescheduleDate = computed(() => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    rescheduleForm.value.serviceTime,
  )
  if (!matched)
    return locale.value.startsWith("zh")
      ? "请选择新的服务日期"
      : "Choose a new service date"
  const [, year, month, day] = matched
  if (locale.value.startsWith("zh"))
    return `${year}年${Number(month)}月${Number(day)}日`
  return new Intl.DateTimeFormat("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
})
const selectableRescheduleTimeOptions = computed(() =>
  rescheduleAvailableTimeRecords.value
    .map((item) => {
      const time = String(item.time || "").trim()
      const timeRange = Number(item.timeRange)
      if (!time || !Number.isFinite(timeRange)) return null
      return {
        time,
        timeRange,
        available: Boolean(item.avaiable ?? item.available ?? false),
        isCurrent:
          rescheduleForm.value.serviceTime ===
            rescheduleForm.value.currentServiceDate &&
          normalizeTimeSlot(time) ===
            normalizeTimeSlot(rescheduleForm.value.currentTimeText),
      }
    })
    .filter(
      (item): item is {
        time: string
        timeRange: number
        available: boolean
        isCurrent: boolean
      } =>
        Boolean(item),
    ),
)
const rescheduleTimePlaceholder = computed(() => {
  if (!rescheduleForm.value.serviceTime)
    return locale.value.startsWith("zh")
      ? "请先选择日期"
      : "Please select a date first"
  if (isRescheduleTimeLoading.value)
    return locale.value.startsWith("zh") ? "时间加载中…" : "Loading times…"
  if (!selectableRescheduleTimeOptions.value.length)
    return locale.value.startsWith("zh") ? "暂无可选时间" : "No available times"
  return locale.value.startsWith("zh") ? "请选择时段" : "Select a time slot"
})

const fetchRescheduleAvailableTimes = async (force = false) => {
  const serviceTime = rescheduleForm.value.serviceTime.trim()
  const spuId = rescheduleForm.value.spuId.trim()
  if (!serviceTime || !spuId) return
  const cacheKey = `${spuId}:${serviceTime}`
  if (
    !force &&
    cacheKey === lastLoadedRescheduleKey.value &&
    rescheduleAvailableTimeRecords.value.length
  )
    return
  isRescheduleTimeLoading.value = true
  try {
    const payload = await getAvailableSelectTime({
      spuId: Number.isFinite(Number(spuId)) ? Number(spuId) : spuId,
      serviceTime,
    })
    rescheduleAvailableTimeRecords.value = Array.isArray(payload) ? payload : []
    lastLoadedRescheduleKey.value = cacheKey
  } catch (error) {
    console.error("load reschedule available time failed:", error)
    rescheduleAvailableTimeRecords.value = []
    lastLoadedRescheduleKey.value = ""
  } finally {
    isRescheduleTimeLoading.value = false
  }
}

const openRescheduleDatePicker = () => {
  rescheduleDateCalendarVisible.value = true
}

const handleRescheduleDateConfirm = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  rescheduleForm.value.serviceTime = `${year}-${month}-${day}`
  rescheduleForm.value.timeRange = null
  rescheduleAvailableTimeRecords.value = []
  lastLoadedRescheduleKey.value = ""
  rescheduleDateCalendarVisible.value = false
  void fetchRescheduleAvailableTimes(true)
}

const handleRescheduleTimeOpen = () => {
  if (!rescheduleForm.value.serviceTime) {
    showFailToast(
      locale.value.startsWith("zh")
        ? "请先选择新的服务日期"
        : "Select a new service date first",
    )
    return
  }
  void fetchRescheduleAvailableTimes()
}

const reviewRatingLabel = computed(() => {
  const labels = locale.value.startsWith("zh")
    ? ["", "较差", "一般", "满意", "很好", "非常满意"]
    : ["", "Poor", "Fair", "Good", "Very good", "Excellent"]
  return labels[Math.round(reviewForm.value.rating)] || ""
})
const reviewTagOptions = computed(() =>
  locale.value.startsWith("zh")
    ? ["准时到达", "服务专业", "沟通顺畅", "细致认真", "物有所值"]
    : [
        "On time",
        "Professional",
        "Great communication",
        "Detail-oriented",
        "Good value",
      ],
)
const toggleReviewTag = (tag: string) => {
  const index = reviewForm.value.tags.indexOf(tag)
  if (index >= 0) reviewForm.value.tags.splice(index, 1)
  else reviewForm.value.tags.push(tag)
}
const fallbackRefundReasons: RefundReasonRecord[] = [
  {
    code: "PLANS_CHANGED",
    nameI18n: {
      zh: "计划有变 / 不再需要",
      en: "Change of plans / no longer needed",
    },
    remarkRequired: false,
  },
  {
    code: "CHANGE_DATE_OR_TIME",
    nameI18n: {
      zh: "预约了错误的日期或时间",
      en: "Booked the wrong date or time",
    },
    remarkRequired: false,
  },
  {
    code: "SERVICE_PROVIDER_CONCERN",
    nameI18n: { zh: "已选择其他服务商", en: "Found another provider" },
    remarkRequired: false,
  },
  {
    code: "PRICE_CONCERN",
    nameI18n: { zh: "价格高于预期", en: "Price is higher than expected" },
    remarkRequired: false,
  },
  {
    code: "SERVICE_TIME_NO_LONGER_WORKS",
    nameI18n: {
      zh: "所选时间不再合适",
      en: "Selected time no longer works",
    },
    remarkRequired: false,
  },
  {
    code: "OTHER",
    nameI18n: { zh: "其他", en: "Other" },
    remarkRequired: true,
  },
]
const cancelReasonOptions = computed(() =>
  (refundReasonRecords.value.length
    ? refundReasonRecords.value
    : fallbackRefundReasons
  ).map((item) => ({
    value: item.code,
    label: pickI18nValue(item.nameI18n, item.code),
    remarkRequired: item.remarkRequired,
  })),
)
let searchTimer: ReturnType<typeof setTimeout> | null = null
let pendingActionHandled = false
let loadRequestId = 0

const preferredLangs = computed(() =>
  locale.value.startsWith("zh")
    ? ["zh-CN", "zh", "en", "en-US"]
    : ["en", "en-US", "zh-CN", "zh"],
)

const pickI18nValue = (data?: I18nMap, fallback = "") => {
  const valueMap = data || {}
  for (const lang of preferredLangs.value) {
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

const ensureRefundReasons = async () => {
  if (refundReasonRecords.value.length) return
  try {
    const records = await getRefundReasons()
    if (records.length) refundReasonRecords.value = records
  } catch (error) {
    console.warn(
      "load refund reasons failed, using server-compatible fallback:",
      error,
    )
  }
}

const formatAmount = (value?: number | string) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return "AED 0"
  }
  const text = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2)
  return `AED ${text}`
}

// 仅用于界面展示：跟随当前语言
const normalizeStatusText = (record: OrderListRecord) =>
  pickI18nValue(
    record.statusNameI18n,
    record.statusName || t("client.orderList.statusUnknown"),
  )

// 仅用于状态分类：固定以英文文案/后端原始枚举为准，不受界面语言影响，
// 否则同一条订单在中英文下会被判定成不同状态，导致各 tab 数量不一致。
const CANONICAL_STATUS_LANGS = ["en", "en-US", "en_US"]
const canonicalStatusText = (record: OrderListRecord) => {
  const valueMap = record.statusNameI18n || {}
  for (const lang of CANONICAL_STATUS_LANGS) {
    const value = valueMap[lang]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  const rawName = String(record.statusName || "").trim()
  if (rawName) return rawName
  const firstValue = Object.values(valueMap).find(
    (value) => typeof value === "string" && value.trim(),
  )
  return typeof firstValue === "string" ? firstValue.trim() : ""
}

const orderStatusNameMap: Record<string, number> = {
  CREATED: 0,
  UNPAID: 0,
  PENDING_PAYMENT: 0,
  ACTION_NEEDED: 1,
  CONFIRMED: 1,
  PAID: 1,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
  CANCELED: 3,
  REFUNDING: 4,
  REFUNDED: 5,
  REFUND_REFUSE: 6,
  REFUND_REJECTED: 6,
  REFUNDREFUSE: 6,
  REFUNDED_FAIL: 6,
  REFUND_FAILED: 6,
}

const getRawOrderStatus = (record: OrderListRecord): number | null => {
  // 1. 优先尝试数值型 orderStatus
  const explicitStatus = Number(record.orderStatus)
  if (Number.isFinite(explicitStatus)) return explicitStatus

  // 2. 尝试将字符串型 orderStatus 通过枚举映射转换
  if (record.orderStatus != null && record.orderStatus !== "") {
    const key = String(record.orderStatus).trim().toUpperCase()
    if (key in orderStatusNameMap) return orderStatusNameMap[key]
  }

  // 3. 兜底：以语言无关的英文文案做匹配（中文关键词仅为只返回中文文案的数据兜底）
  const statusText = canonicalStatusText(record).toLowerCase()
  if (!statusText) return null
  if (
    statusText.includes("退款拒绝") ||
    statusText.includes("退款失败") ||
    statusText.includes("refundrefuse") ||
    statusText.includes("refund rejected") ||
    statusText.includes("refund failed")
  )
    return 6
  if (statusText.includes("退款中") || statusText.includes("refunding"))
    return 4
  if (statusText.includes("已退款") || statusText.includes("refunded")) return 5
  if (statusText.includes("已取消") || statusText.includes("cancel")) return 3
  if (statusText.includes("已完成") || statusText.includes("completed"))
    return 2
  // 注意：未支付必须在 paid 之前判定，否则 "unpaid" 会被 "paid" 误匹配
  if (
    statusText.includes("未支付") ||
    statusText.includes("unpaid") ||
    statusText.includes("待支付") ||
    statusText.includes("pending payment") ||
    statusText.includes("draft")
  )
    return 0
  if (
    statusText.includes("待服务") ||
    statusText.includes("action needed") ||
    statusText.includes("已确认") ||
    statusText.includes("confirmed") ||
    statusText.includes("进行中") ||
    statusText.includes("in progress") ||
    statusText.includes("已支付") ||
    statusText.includes("paid")
  )
    return 1
  return null
}

const getStatusCode = (record: OrderListRecord): 1 | 2 | 3 | 4 => {
  const rawStatus = getRawOrderStatus(record)
  if (rawStatus === 0) return 1
  if (rawStatus === 1) return 2
  if (rawStatus === 2) return 3
  return 4
}

const getOrderStatusText = (rawStatus: number | null, fallbackText: string) => {
  if (rawStatus === 0) return t("client.orderList.statusUnpaid")
  if (rawStatus === 1) return t("client.orderList.statusConfirmed")
  if (rawStatus === 2) return t("client.orderList.statusCompleted")
  if (rawStatus === 3) return t("client.orderList.statusCanceled")
  if (rawStatus === 4) return t("client.orderList.statusRefunding")
  if (rawStatus === 5) return t("client.orderList.statusRefunded")
  if (rawStatus === 6) return t("client.orderList.statusRefundRejected")
  return fallbackText || t("client.orderList.statusUnknown")
}

const matchesSelectedStatus = (rawStatus: number | null) => {
  if (selectedStatus.value === "ACTIVE") return rawStatus === 1
  return [2, 3, 4, 5, 6].includes(rawStatus ?? -1)
}

const statusTabs = computed(() => [
  {
    label: t("client.orderList.statusActive"),
    value: "ACTIVE" as const,
    count: tabCounts.value.ACTIVE,
    dot: "",
  },
  {
    label: t("client.orderList.statusHistory"),
    value: "HISTORY" as const,
    count: tabCounts.value.HISTORY,
    dot: "",
  },
])

const orderCards = computed<OrderCardView[]>(() =>
  (orderRecords.value || [])
    .map((item, index) => {
      const statusCode = getStatusCode(item)
      const orderStatus = getRawOrderStatus(item)
      const statusText = getOrderStatusText(
        orderStatus,
        normalizeStatusText(item),
      )
      const specSelections = Array.isArray(item.specSelections)
        ? item.specSelections
            .map((selection) => ({
              specTypeId: String(selection.specTypeId ?? "").trim(),
              specValueId: String(selection.specValueId ?? "").trim(),
            }))
            .filter(
              (selection) => selection.specTypeId && selection.specValueId,
            )
        : []
      const attachSelections = Array.isArray(item.attachSelections)
        ? item.attachSelections
            .map((selection) => ({
              attachValueId: String(selection.attachValueId ?? "").trim(),
              quantity: Math.max(0, Number(selection.quantity ?? 0) || 0),
            }))
            .filter(
              (selection) => selection.attachValueId && selection.quantity > 0,
            )
        : []
      return {
        orderId: String(item.orderId ?? ""),
        orderNo: String(item.orderNo || `order-${index + 1}`),
        spuId: String(item.spuId ?? ""),
        statusCode,
        rawOrderStatus: orderStatus,
        title: pickI18nValue(
          item.spuNameI18n,
          String(item.spuName || "").trim() ||
            t("client.orderList.unknownService"),
        ),
        amountText: formatAmount(item.orderAmount),
        serviceTimeText: formatServiceSchedule(
          item.serviceDateTime,
          locale.value,
          t("client.orderList.notProvided"),
        ),
        createdTimeText: formatCreatedAt(
          item.createTime,
          locale.value,
          t("client.orderList.notProvided"),
        ),
        addressText:
          [item.serviceAddress, item.building, item.roomNo, item.community]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
            .join(", ") || t("client.orderList.emptyAddress"),
        specText: formatOrderSpecs(item.specSelections, locale.value),
        addOnsText: formatOrderAddOns(item.attachSelections, locale.value),
        statusText,
        image:
          item.spuImage ||
          fallbackImages[index % fallbackImages.length] ||
          fallbackImages[0] ||
          "",
        reviewed: item.reviewed === true,
        showActions: [0, 1, 2, 3, 4, 5].includes(orderStatus ?? -1),
        canContinue: orderStatus === 0,
        canManage: orderStatus === 1,
        canReview: orderStatus === 2 || orderStatus === 3,
        canRebook: [2, 3, 4, 5].includes(orderStatus ?? -1),
        specSelections,
        attachSelections,
        record: item,
      }
    })
    .filter((item) => matchesSelectedStatus(item.rawOrderStatus)),
)

const loadOrders = async () => {
  const requestId = ++loadRequestId
  isLoading.value = true
  loadError.value = false
  try {
    const keyWord = searchKeyword.value || undefined
    const [activeResult, historyResult] = await Promise.all([
      getOrderList({ tab: "ACTIVE", keyWord }),
      getOrderList({ tab: "HISTORY", keyWord }),
    ])
    if (requestId !== loadRequestId) return
    const activeRecords = Array.isArray(activeResult)
      ? (activeResult as OrderListRecord[]).filter(
          (item) => getRawOrderStatus(item) === 1,
        )
      : []
    const historyRecords = Array.isArray(historyResult)
      ? (historyResult as OrderListRecord[]).filter((item) =>
          [2, 3, 4, 5, 6].includes(getRawOrderStatus(item) ?? -1),
        )
      : []
    const records = [...activeRecords, ...historyRecords]
    orderRecords.value = records
    tabCounts.value = {
      ACTIVE: activeRecords.length,
      HISTORY: historyRecords.length,
    }
    const requestedOrderNo = String(route.query.orderNo || "")
    const requestedAction = String(route.query.action || "")
    if (!pendingActionHandled && requestedOrderNo && requestedAction) {
      const requestedRecord = records.find(
        (item) => String(item.orderNo || "") === requestedOrderNo,
      )
      if (requestedRecord) {
        selectedStatus.value = getRawOrderStatus(requestedRecord) === 1
          ? "ACTIVE"
          : "HISTORY"
      }
      const target = orderCards.value.find(
        (item) => item.orderNo === requestedOrderNo,
      )
      if (target) {
        pendingActionHandled = true
        if (requestedAction === "review") openReview(target)
        else if (requestedAction === "cancel") void openRefund(target)
        else if (
          requestedAction === "reschedule" ||
          requestedAction === "manage-booking"
        )
          void requestReschedule(target)
        else if (requestedAction === "manage") void goContinueBooking(target)
      }
    }
  } catch (error) {
    if (requestId !== loadRequestId) return
    console.error("load order list failed:", error)
    orderRecords.value = []
    tabCounts.value = { ACTIVE: 0, HISTORY: 0 }
    loadError.value = true
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

const onStatusChange = (nextStatus: OrderListTab) => {
  selectedStatus.value = nextStatus
}

const onSearchNow = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  void loadOrders()
}

const goRebook = (item: OrderCardView) => {
  if (!item.spuId) {
    return
  }
  router.push({
    name: "h5-product-detail",
    params: { spuId: item.spuId },
    query: {
      specSelections: JSON.stringify(item.specSelections),
      attachSelections: JSON.stringify(item.attachSelections),
    },
  })
}

const goContinueBooking = async (item: OrderCardView) => {
  let orderId = String(item.orderId || "").trim()
  const orderNo = String(item.orderNo || "").trim()
  if (!orderId && orderNo) {
    if (isManageResolving.value) return
    isManageResolving.value = true
    try {
      const resolvedOrder = await getOrderByOrderNo(orderNo)
      orderId = String(resolvedOrder?.orderId || "").trim()
      if (orderId) item.orderId = orderId
    } catch (error) {
      console.error("resolve order id by order number failed:", error)
    } finally {
      isManageResolving.value = false
    }
  }
  if (!orderId) {
    showFailToast(
      locale.value.startsWith("zh")
        ? "未查询到订单主键，请刷新后重试"
        : "Unable to find this order for payment. Please refresh and try again.",
    )
    return
  }
  router.push({
    name: "h5-order-confirm",
    query: {
      orderId,
      orderNo: orderNo || undefined,
      spuId: item.spuId,
      title: item.title,
      titleI18n: JSON.stringify(item.record.spuNameI18n || {}),
      imageUrls: JSON.stringify(item.image ? [item.image] : []),
      selectedSpecValueIds: JSON.stringify(
        item.specSelections.map((entry) => entry.specValueId),
      ),
      total: item.amountText.replace(/[^\d.]/g, ""),
    },
  })
}

const goDetail = (item: OrderCardView) => {
  if (item.rawOrderStatus === 0) {
    void goContinueBooking(item)
    return
  }
  router.push({ name: "h5-order-detail", params: { orderNo: item.orderNo } })
}

const requestReschedule = (item: OrderCardView) => {
  const rawSchedule = String(item.record.serviceDateTime || "").trim()
  const dateMatch = /\d{4}-\d{2}-\d{2}/.exec(rawSchedule)
  const timeMatch = /(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/.exec(rawSchedule)
  const timeText = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : ""
  rescheduleForm.value = {
    orderNo: item.orderNo,
    spuId: item.spuId,
    serviceName: item.title,
    currentSchedule: item.serviceTimeText,
    currentServiceDate: dateMatch?.[0] || "",
    currentTimeText: timeText,
    serviceTime: dateMatch?.[0] || "",
    timeRange: null,
    item,
  }
  rescheduleAvailableTimeRecords.value = []
  lastLoadedRescheduleKey.value = ""
  reschedulePopupVisible.value = true
  void fetchRescheduleAvailableTimes(true)
}

const cancelFromManage = () => {
  const item = rescheduleForm.value.item
  reschedulePopupVisible.value = false
  if (item) void openRefund(item)
}

const submitReschedule = async () => {
  if (isRescheduleSubmitting.value) return
  if (!rescheduleForm.value.serviceTime) {
    showFailToast(
      locale.value.startsWith("zh")
        ? "请选择新的服务日期"
        : "Select a new service date",
    )
    return
  }
  if (!rescheduleForm.value.timeRange) {
    showFailToast(
      locale.value.startsWith("zh")
        ? "请选择新的服务时段"
        : "Select a new time slot",
    )
    return
  }
  const selectedSlot = selectableRescheduleTimeOptions.value.find(
    (slot) => slot.timeRange === rescheduleForm.value.timeRange,
  )
  if (selectedSlot?.isCurrent) {
    showFailToast(
      locale.value.startsWith("zh")
        ? "请选择不同于当前安排的新时段"
        : "Choose a time slot different from the current schedule",
    )
    return
  }
  isRescheduleSubmitting.value = true
  try {
    await rescheduleOrder({
      orderNo: rescheduleForm.value.orderNo,
      serviceTime: rescheduleForm.value.serviceTime,
      timeRange: rescheduleForm.value.timeRange,
    })
    reschedulePopupVisible.value = false
    showSuccessToast(
      locale.value.startsWith("zh") ? "服务时间已更新" : "Service rescheduled",
    )
    await loadOrders()
  } catch (error: any) {
    showFailToast(
      error?.message ||
        (locale.value.startsWith("zh")
          ? "改期失败，请重新选择服务时间"
          : "Unable to reschedule. Please choose another time."),
    )
  } finally {
    isRescheduleSubmitting.value = false
  }
}

const openReview = (item: OrderCardView) => {
  const normalizedOrderNo = String(item.orderNo || "").trim()
  if (!normalizedOrderNo) {
    return
  }
  reviewForm.value = {
    orderNo: normalizedOrderNo,
    serviceName: item.title,
    rating: 0,
    content: "",
    tags: [],
  }
  reviewPopupVisible.value = true
}

const submitReview = async () => {
  if (isReviewSubmitting.value) {
    return
  }
  if (!reviewForm.value.orderNo) {
    showFailToast(t("client.orderList.reviewDialog.orderNoMissing"))
    return
  }
  if (
    !Number.isFinite(reviewForm.value.rating) ||
    reviewForm.value.rating <= 0
  ) {
    showFailToast(t("client.orderList.reviewDialog.ratingRequired"))
    return
  }
  const note = reviewForm.value.content.trim()
  const content = [reviewForm.value.tags.join(", "), note]
    .filter(Boolean)
    .join(" — ")
  if (!content) {
    showFailToast(t("client.orderList.reviewDialog.contentRequired"))
    return
  }

  isReviewSubmitting.value = true
  try {
    await review({
      orderNo: reviewForm.value.orderNo,
      rating: Math.round(reviewForm.value.rating),
      content,
    })
    showSuccessToast(t("client.orderList.reviewDialog.submitSuccess"))
    reviewPopupVisible.value = false
    void loadOrders()
  } catch (error: any) {
    showFailToast(
      error?.message || t("client.orderList.reviewDialog.submitFailed"),
    )
  } finally {
    isReviewSubmitting.value = false
  }
}

const localizedReason = (value?: Record<string, string>) => {
  if (!value) return ""
  const preferred = locale.value.startsWith("zh")
    ? ["zh-CN", "zh", "en"]
    : ["en", "en-US", "zh"]
  for (const key of preferred) if (value[key]) return value[key]
  return Object.values(value).find(Boolean) || ""
}

const openRefund = async (item: OrderCardView) => {
  try {
    await ensureRefundReasons()
    const check = (await checkOrderRefund(
      item.orderNo,
    )) as OrderRefundCheckResult | null
    if (!check?.canRefund && !check?.canCancelWithoutRefund) {
      showFailToast(
        localizedReason(check?.cannotRefundReason) ||
          (locale.value === "zh"
            ? "该订单当前不可取消"
            : "This booking cannot currently be cancelled"),
      )
      return
    }
    refundForm.value = {
      orderNo: item.orderNo,
      reason: cancelReasonOptions.value[0]?.value || "PLANS_CHANGED",
      otherReason: "",
      amountText: formatAmount(check.canRefund ? check.refundAmount : 0),
      handlingFeeText: check.canRefund ? formatAmount(check.handlingFee) : "",
      mode: check.canRefund ? "refund" : "cancel",
      item,
    }
    cancelConfirmed.value = false
    refundPopupVisible.value = false
    cancelPolicyVisible.value = true
  } catch (error: any) {
    showFailToast(
      error?.message ||
        (locale.value === "zh"
          ? "无法检查取消资格"
          : "Unable to check cancellation eligibility"),
    )
  }
}

const continueCancellation = () => {
  cancelPolicyVisible.value = false
  refundPopupVisible.value = true
}

const submitRefund = async () => {
  if (isRefundSubmitting.value) return
  const selectedReason = cancelReasonOptions.value.find(
    (entry) => entry.value === refundForm.value.reason,
  )
  const refundReasonRemark = refundForm.value.otherReason.trim()
  if (!selectedReason?.value) {
    showFailToast(t("client.orderList.refundDialog.reasonRequired"))
    return
  }
  if (selectedReason.remarkRequired && !refundReasonRemark) {
    showFailToast(
      locale.value.startsWith("zh")
        ? "请填写退款原因说明"
        : "Please tell us why you are requesting a refund",
    )
    return
  }
  isRefundSubmitting.value = true
  try {
    if (refundForm.value.mode === "refund") {
      await requestOrderRefund({
        orderNo: refundForm.value.orderNo,
        refundReason: selectedReason.value,
        ...(refundReasonRemark ? { refundReasonRemark } : {}),
      })
    } else {
      const cancelReason = [selectedReason.label, refundReasonRemark]
        .filter(Boolean)
        .join(": ")
      await cancelOrder({ orderNo: refundForm.value.orderNo, cancelReason })
    }
    cancelConfirmed.value = true
    await loadOrders()
  } catch (error: any) {
    showFailToast(
      error?.message || t("client.orderList.refundDialog.submitFailed"),
    )
  } finally {
    isRefundSubmitting.value = false
  }
}

const rescheduleFromCancel = () => {
  const item = refundForm.value.item
  refundPopupVisible.value = false
  if (item) void requestReschedule(item)
}

const goHome = () => {
  router.push({ name: "h5-home" })
}

const goProfile = () => {
  router.push({ name: "h5-profile" })
}

onMounted(() => {
  void loadOrders()
})

watch(
  () => searchKeyword.value,
  () => {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }
    searchTimer = setTimeout(() => {
      void loadOrders()
    }, 300)
  },
)

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})
</script>

<style scoped lang="scss">
.h5-orders-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
}

.h5-orders-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #f3f4f6;
}

.h5-orders-topbar h1 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
}

.h5-orders-main {
  padding: 12px 16px 24px;
}

.h5-orders-search {
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
}

.h5-orders-search :deep(.van-icon) {
  color: rgba(10, 10, 10, 0.5);
  font-size: 18px;
}

.h5-orders-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(15, 23, 42, 0.88);
  font-size: 14px;
}

.h5-orders-search input::placeholder {
  color: rgba(10, 10, 10, 0.5);
}

.h5-orders-tabs {
  margin-top: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  background: #fff;
  padding: 4px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.h5-orders-tab {
  height: 36px;
  min-width: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(15, 23, 42, 0.5);
  font-size: clamp(10px, 3vw, 13px);
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
  padding: 0 11px;
  flex: 1 1 0;
  justify-content: center;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.h5-orders-tab i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.h5-orders-tab b {
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #edf1f5;
  color: #526174;
  font-size: 9px;
}
.h5-orders-tab--active b {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.h5-orders-tab--active {
  background: var(--hourx-brand);
  color: #fff;
}

.h5-orders-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.h5-orders-empty {
  margin: 0;
  padding: 28px 18px;
  border-radius: 14px;
  border: 1px solid #f3f4f6;
  background: #fff;
  color: rgba(15, 23, 42, 0.5);
  font-size: 13px;
  text-align: center;
}

.h5-orders-error {
  padding: 24px 18px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fff7f7;
  color: #7f1d1d;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.h5-orders-error strong {
  font-size: 14px;
}
.h5-orders-error span {
  color: #9f3434;
  font-size: 12px;
}
.h5-orders-error button {
  margin-top: 4px;
  min-width: 88px;
  height: 34px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: var(--hourx-brand);
  color: #fff;
  font-weight: 700;
}

.h5-order-card {
  border: 1px solid #f3f4f6;
  border-radius: 14px;
  background: #fff;
  padding: 12px 14px;
  box-shadow: 0 10px 26px rgba(5, 21, 43, 0.055);
}

.h5-order-card:focus-visible {
  outline: 3px solid rgba(23, 105, 194, 0.18);
}

.h5-order-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h5-order-card__order-no {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(15, 23, 42, 0.6);
  font-size: 12px;
  font-weight: 700;
}

.h5-order-card__order-no :deep(.van-icon) {
  font-size: 16px;
}

.h5-order-card__badge {
  min-width: 54px;
  height: 19px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 700;
}

.h5-order-card__badge--all,
.h5-order-card__badge--cancel {
  background: #f1f5f9;
  color: rgba(15, 23, 42, 0.5);
}

.h5-order-card__badge--action {
  background: #fff4d6;
  color: #a85b00;
}

.h5-order-card__badge--progress {
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
}

.h5-order-card__badge--done {
  background: #f0fdf4;
  color: #00a63e;
}

.h5-order-card__body {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.h5-order-card__image {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.h5-order-card__content {
  flex: 1;
  min-width: 0;
}

.h5-order-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.h5-order-card__title-row h3 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  line-height: 1.5;
  font-weight: 700;
}

.h5-order-card__title-row strong {
  white-space: nowrap;
  color: var(--hourx-brand);
  font-size: 14px;
  line-height: 1.5;
  font-weight: 900;
}

.h5-order-card__meta {
  margin-top: 12px;
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.h5-order-card__meta-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.h5-order-card__meta-row > :deep(.van-icon) {
  margin-top: 2px;
  color: var(--hourx-brand);
  font-size: 14px;
  flex: 0 0 auto;
}

.h5-order-card__meta-row span {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.h5-order-card__meta-row small {
  color: rgba(15, 23, 42, 0.48);
  font-size: 10px;
  line-height: 14px;
  font-weight: 600;
}

.h5-order-card__meta-row strong {
  color: rgba(15, 23, 42, 0.76);
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.h5-order-card__selections {
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: rgba(15, 23, 42, 0.5);
  font-size: 10px;
  line-height: 15px;
}

.h5-order-card__selections span {
  overflow-wrap: anywhere;
}

.h5-order-card__selections b {
  color: rgba(15, 23, 42, 0.7);
  font-weight: 700;
}

.h5-order-card__actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eef2f7;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.h5-order-card__btn {
  min-width: 46px;
  height: 24px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  padding: 0 10px;
}

.h5-order-card__btn--ghost {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: rgba(15, 23, 42, 0.6);
}

.h5-order-card__btn--primary {
  border: 0;
  background: var(--hourx-brand);
  color: #fff;
}

.h5-order-card__btn--danger {
  border: 1px solid #dc2626;
  background: #fff;
  color: #dc2626;
}

.h5-order-card__btn:disabled {
  opacity: 0.65;
}

.h5-orders-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 24;
  height: calc(56px + env(safe-area-inset-bottom));
  padding: 0 24px env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #f3f4f6;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h5-orders-tabbar__item {
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
}

.h5-orders-tabbar__item :deep(.van-icon) {
  font-size: 24px;
}

.h5-orders-tabbar__cart-icon {
  position: relative;
  display: inline-flex;
}

.h5-orders-tabbar__cart-icon b {
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

.h5-orders-tabbar__item--active {
  color: var(--hourx-brand);
}

.h5-review-sheet {
  width: 100%;
  box-sizing: border-box;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
}

.h5-refund-popup {
  display: flex;
  justify-content: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #f0f0f2;
}

.h5-reschedule-popup {
  overflow-y: auto;
  overscroll-behavior: contain;
}
.h5-reschedule-sheet__summary {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 15px;
  border: 1px solid #dbe8f5;
  border-radius: 14px;
  background: linear-gradient(135deg, #edf5ff, #f9fbfe);
}
.h5-reschedule-sheet__summary span {
  color: #05152b;
  font-size: 15px;
  font-weight: 800;
}
.h5-reschedule-sheet__summary small {
  margin-top: 4px;
  color: #64748b;
  font-size: 11px;
}
.h5-reschedule-sheet__summary strong {
  color: #1769c2;
  font-size: 13px;
}
.h5-reschedule-sheet__field {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.h5-reschedule-sheet__field span {
  color: #334155;
  font-size: 12px;
  font-weight: 800;
}
.h5-reschedule-sheet__field select {
  width: 100%;
  min-height: 46px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid #d6e0ea;
  border-radius: 11px;
  outline: none;
  background: #fff;
  color: #05152b;
  font: inherit;
}
.h5-reschedule-sheet__date {
  width: 100%;
  min-height: 46px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid #d6e0ea;
  border-radius: 11px;
  background: #fff;
  color: #1769c2;
}
.h5-reschedule-sheet__date input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #05152b;
  font: inherit;
  pointer-events: none;
}
.h5-reschedule-sheet__date-hint {
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
}
.h5-reschedule-sheet > p {
  margin: 13px 0 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.55;
}
.h5-reschedule-sheet__actions {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.h5-reschedule-sheet__actions .h5-review-sheet__submit {
  margin: 0;
}
.h5-reschedule-sheet__cancel {
  min-height: 46px;
  border: 1px solid #05152b;
  border-radius: 12px;
  background: #fff;
  color: #05152b;
  font-size: 13px;
  font-weight: 900;
}

.h5-review-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.h5-review-sheet__header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
}

.h5-review-sheet__header button {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 18px;
}

.h5-review-sheet__intro {
  margin-top: 14px;
  padding: 14px;
  border-radius: 13px;
  background: linear-gradient(135deg, #edf5ff, #f8fbff);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.h5-review-sheet__intro strong {
  color: #05152b;
  font-size: 15px;
}
.h5-review-sheet__intro span {
  color: #64748b;
  font-size: 11px;
}
.h5-review-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.h5-review-tags button {
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid #dbe4ed;
  border-radius: 999px;
  background: #fff;
  color: #526174;
  font-size: 11px;
}
.h5-review-tags button.is-selected {
  border-color: #1769c2;
  background: #edf5ff;
  color: #1769c2;
  font-weight: 800;
}
.h5-review-sheet__counter {
  align-self: flex-end;
}

.h5-review-sheet__field {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.h5-review-sheet__field span {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.h5-review-sheet__field textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-height: 110px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  outline: 0;
  background: #fff;
  color: #0f172a;
  font-size: 13px;
  resize: vertical;
}

.h5-review-sheet__field small {
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.h5-refund-sheet__order-no {
  min-height: 42px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  overflow-wrap: anywhere;
  box-sizing: border-box;
  width: 100%;
}

.h5-refund-sheet__amount {
  min-height: 42px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  box-sizing: border-box;
  width: 100%;
}

@media (max-height: 620px) {
  .h5-review-sheet {
    padding-top: 14px;
  }

  .h5-review-sheet__field {
    margin-top: 12px;
    gap: 7px;
  }

  .h5-refund-sheet .h5-review-sheet__field textarea {
    min-height: 82px;
  }

  .h5-review-sheet__submit {
    margin-top: 14px;
  }
}

.h5-refund-sheet__submit {
  background: #dc2626;
}

.h5-cancel-reasons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.h5-cancel-reasons label {
  min-height: 42px;
  padding: 9px;
  border: 1px solid #e0e7ef;
  border-radius: 11px;
  display: flex;
  align-items: flex-start;
  gap: 7px;
  background: #fff;
  box-sizing: border-box;
}
.h5-cancel-reasons input {
  margin: 2px 0 0;
  accent-color: #1769c2;
}
.h5-cancel-reasons span {
  color: #475569;
  font-size: 11px;
  line-height: 1.35;
}
.h5-refund-sheet__reschedule {
  align-self: flex-start;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #1769c2;
  border-radius: 10px;
  background: #fff;
  color: #1769c2;
  font-size: 11px;
  font-weight: 800;
}
.h5-refund-sheet__reschedule--active {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
  box-shadow: 0 8px 18px rgba(5, 21, 43, 0.2);
}

.h5-review-sheet__submit {
  margin-top: 18px;
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: var(--hourx-brand);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.h5-review-sheet__submit:disabled {
  opacity: 0.7;
}
.h5-refund-sheet__policy {
  margin-top: 12px;
  padding: 13px;
  border-radius: 13px;
  background: #f4f7fb;
  color: #64748b;
  font-size: 11px;
  line-height: 1.55;
}
.h5-refund-sheet__policy strong {
  color: #05152b;
  font-size: 12px;
}
.h5-refund-sheet__policy p {
  margin: 7px 0;
}
.h5-refund-sheet__legal-links {
  display: flex;
  align-items: center;
  gap: 6px;
}
.h5-refund-sheet__legal-links button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font: inherit;
  font-weight: 800;
}
.h5-refund-sheet__policy label {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 10px;
}
.h5-refund-sheet__policy input {
  margin-top: 2px;
}

@media (max-width: 360px) {
  .h5-cancel-reasons {
    grid-template-columns: 1fr;
  }
}
</style>
