<template>
  <div class="order-list-page">
    <section class="order-list-body">
      <div class="order-list-container">
        <header class="order-list-head">
          <div>
            <h1>{{ t("client.orderList.title") }}</h1>
            <p>{{ t("client.orderList.subtitle") }}</p>
          </div>

          <div class="order-list-search">
            <div class="order-list-search__input">
              <img :src="searchIconUrl" alt="" />
              <input
                v-model.trim="searchKeyword"
                type="text"
                :placeholder="t('client.orderList.searchPlaceholder')"
                @keyup.enter="onSearchNow"
              />
            </div>
            <button type="button" @click="onSearchNow">
              <img :src="filterIconUrl" alt="" />
            </button>
          </div>
        </header>

        <section class="order-status-tabs">
          <button
            v-for="item in statusTabs"
            :key="item.value"
            type="button"
            class="order-status-tab"
            :class="{
              'order-status-tab--active': selectedStatus === item.value,
            }"
            @click="onStatusChange(item.value)"
          >
            <i v-if="item.dot" :style="{ background: item.dot }" />
            {{ item.label }}
            <b>{{ item.count }}</b>
          </button>
        </section>

        <section class="order-list-content">
          <p v-if="isLoading" class="order-list-empty">
            {{ t("client.orderList.loading") }}
          </p>
          <div v-else-if="loadError" class="order-list-error" role="alert">
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
          <p v-else-if="!orderCards.length" class="order-list-empty">
            {{ t("client.orderList.empty") }}
          </p>

          <template v-else>
            <article
              v-for="item in orderCards"
              :key="item.orderNo"
              class="order-card"
              :class="[
                `order-card--status-${item.rawOrderStatus ?? 'unknown'}`,
                { 'order-card--history': selectedStatus === 'HISTORY' },
              ]"
              tabindex="0"
              @click="goDetail(item)"
              @keyup.enter="goDetail(item)"
            >
              <div class="order-card__image-wrap">
                <img
                  class="order-card__image"
                  :src="item.image"
                  :alt="item.title"
                />
                <span class="order-card__badge">{{ item.statusText }}</span>
              </div>

              <div class="order-card__main">
                <div class="order-card__title-row">
                  <h3>{{ item.title }}</h3>
                  <strong>{{ item.amountText }}</strong>
                </div>

                <div class="order-card__meta-row">
                  <span>
                    <img :src="orderNoIconUrl" alt="" />
                    {{ t("client.orderList.orderNo") }}: {{ item.orderNo }}
                  </span>
                  <span>
                    <img :src="dateIconUrl" alt="" />
                    {{ t("client.orderList.createdTime") }}:
                    {{ item.createdTimeText }}
                  </span>
                </div>

                <div class="order-card__details">
                  <div class="order-card__detail">
                    <img :src="timeIconUrl" alt="" />
                    <span>
                      <small>{{ t("client.orderList.serviceTime") }}</small>
                      <strong>{{ item.serviceTimeText }}</strong>
                    </span>
                  </div>
                  <div class="order-card__detail order-card__detail--address">
                    <img :src="addressIconUrl" alt="" />
                    <span>
                      <small>{{ t("client.orderList.serviceAddress") }}</small>
                      <strong>{{ item.addressText }}</strong>
                    </span>
                  </div>
                </div>

                <div
                  v-if="item.specText || item.addOnsText"
                  class="order-card__selections"
                >
                  <span v-if="item.specText">
                    {{ item.specText }}
                  </span>
                  <span v-if="item.addOnsText">
                    <b>{{ t("client.orderList.addOns") }}:</b>
                    {{ item.addOnsText }}
                  </span>
                </div>

                <div
                  v-if="item.refundHandlingFeeText"
                  class="order-card__refund-fee"
                >
                  <span>{{ t("client.orderList.refundHandlingFee") }}</span>
                  <strong>{{ item.refundHandlingFeeText }}</strong>
                </div>

                <div class="order-card__actions">
                  <button
                    v-if="item.canContinue"
                    type="button"
                    class="order-card__btn order-card__btn--primary"
                    :disabled="isManageResolving"
                    @click.stop="goContinueBooking(item)"
                  >
                    {{ locale === "zh" ? "继续预订" : "Continue Booking" }}
                  </button>
                  <button
                    v-if="item.canManage"
                    type="button"
                    class="order-card__btn order-card__btn--primary"
                    @click.stop="requestReschedule(item)"
                  >
                    {{ locale === "zh" ? "管理预订" : "Manage Booking" }}
                  </button>
                  <button
                    v-if="item.canReview && !item.reviewed"
                    type="button"
                    class="order-card__btn order-card__btn--ghost"
                    @click.stop="openReview(item)"
                  >
                    {{ t("client.orderList.review") }}
                  </button>
                  <button
                    v-if="item.canRebook"
                    type="button"
                    class="order-card__btn order-card__btn--primary"
                    @click.stop="goRebook(item)"
                  >
                    {{ t("client.orderList.rebook") }}
                  </button>
                </div>
              </div>
            </article>
          </template>
        </section>
      </div>
    </section>

    <el-dialog
      v-model="reviewDialogVisible"
      :title="t('client.orderList.reviewDialog.title')"
      width="520px"
      :close-on-click-modal="false"
      :show-close="!isReviewSubmitting"
    >
      <div class="order-review-form">
        <div class="order-review-form__intro">
          <strong>{{ reviewForm.serviceName }}</strong>
          <span>{{
            locale === "zh"
              ? "这次服务体验怎么样？"
              : `How was your ${reviewForm.serviceName} service?`
          }}</span>
        </div>
        <label class="order-review-form__field">
          <span>{{ t("client.orderList.reviewDialog.ratingLabel") }}</span>
          <el-rate v-model="reviewForm.rating" :max="5" />
          <small v-if="reviewRatingLabel">{{ reviewRatingLabel }}</small>
        </label>
        <div class="order-review-form__field">
          <span>{{
            locale === "zh" ? "你最满意什么？" : "WHAT DID YOU LIKE MOST?"
          }}</span>
          <div class="order-review-tags">
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
        <label class="order-review-form__field">
          <span>{{ t("client.orderList.reviewDialog.contentLabel") }}</span>
          <textarea
            v-model.trim="reviewForm.content"
            :placeholder="t('client.orderList.reviewDialog.contentPlaceholder')"
            :disabled="isReviewSubmitting"
            maxlength="500"
          />
          <small class="order-review-form__counter"
            >{{ reviewForm.content.length }}/500</small
          >
        </label>
      </div>
      <template #footer>
        <div class="order-review-form__footer">
          <button
            class="order-card__btn order-card__btn--ghost"
            type="button"
            :disabled="isReviewSubmitting"
            @click="reviewDialogVisible = false"
          >
            {{ t("client.orderList.reviewDialog.cancel") }}
          </button>
          <button
            class="order-card__btn order-card__btn--primary"
            type="button"
            :disabled="isReviewSubmitting"
            @click="submitReview"
          >
            {{ t("client.orderList.reviewDialog.submit") }}
          </button>
        </div>
      </template>
    </el-dialog>

    <CancellationPolicyGate
      v-model="cancelPolicyVisible"
      :show-refund-summary="refundForm.mode === 'refund'"
      :handling-fee-text="refundForm.handlingFeeText"
      :refund-amount-text="refundForm.amountText"
      @continue="continueCancellation"
    />

    <el-dialog
      v-model="refundDialogVisible"
      class="order-cancellation-dialog"
      width="min(420px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      :show-close="false"
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
        @close="refundDialogVisible = false"
        @done="refundDialogVisible = false"
        @reschedule="rescheduleFromCancel"
        @confirm="submitRefund"
      />
    </el-dialog>

    <el-dialog
      v-model="rescheduleDialogVisible"
      :title="locale.startsWith('zh') ? '管理预订' : 'Manage Booking'"
      class="order-reschedule-dialog"
      width="min(560px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      :show-close="!isRescheduleSubmitting"
    >
      <div class="order-reschedule-form">
        <div class="order-reschedule-form__summary">
          <span>{{ rescheduleForm.serviceName }}</span>
          <small>{{
            locale.startsWith("zh") ? "当前安排" : "Current schedule"
          }}</small>
          <strong>{{ rescheduleForm.currentSchedule }}</strong>
        </div>
        <div class="order-reschedule-form__grid">
          <label>
            <span>{{
              locale.startsWith("zh") ? "新的服务日期" : "New service date"
            }}</span>
            <el-config-provider :locale="rescheduleDatePickerLocale">
              <el-date-picker
                v-model="rescheduleForm.serviceTime"
                class="order-reschedule-form__date-picker"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :editable="false"
                :clearable="false"
                :disabled-date="isRescheduleDateDisabled"
                :placeholder="
                  locale.startsWith('zh')
                    ? '请选择服务日期'
                    : 'Select service date'
                "
                @change="handleRescheduleDateChange"
              />
            </el-config-provider>
            <small class="order-reschedule-form__date-hint">{{
              localizedRescheduleDate
            }}</small>
          </label>
          <label>
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
                {{ slot.time
                }}{{
                  slot.isCurrent
                    ? locale.startsWith("zh")
                      ? "（当前时段）"
                      : " (current slot)"
                    : ""
                }}
              </option>
            </select>
          </label>
        </div>
        <p>
          {{
            locale.startsWith("zh")
              ? "提交后系统会检查时段容量及服务开始前的时间限制。"
              : "Availability and the minimum advance-time rule are checked when you submit."
          }}
        </p>
      </div>
      <template #footer>
        <div class="order-review-form__footer">
          <button
            class="order-cancel-booking"
            type="button"
            :disabled="isRescheduleSubmitting"
            @click="cancelFromManage"
          >
            {{ locale.startsWith("zh") ? "取消预订" : "Cancel Booking" }}
          </button>
          <button
            class="order-card__btn order-card__btn--primary"
            type="button"
            :disabled="isRescheduleSubmitting || isRescheduleTimeLoading"
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
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus"
import elLocaleEn from "element-plus/es/locale/lang/en"
import elLocaleZhCn from "element-plus/es/locale/lang/zh-cn"
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
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
import {
  cancelOrder,
  checkOrderRefund,
  getAvailableSelectTime,
  getOrderByOrderNo,
  getOrderRefundAmount,
  getRefundReasons,
  getOrderList,
  requestOrderRefund,
  rescheduleOrder,
  type OrderListRecord,
  type OrderRefundCheckResult,
  type RefundReasonRecord,
  review,
} from "@/modules/client/api"

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
  refundHandlingFeeText: string
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

const searchIconUrl = new URL(
  "@/assets/images/client/Icon (13).png",
  import.meta.url,
).href
const filterIconUrl = new URL(
  "@/assets/images/client/Icon (14).png",
  import.meta.url,
).href
const orderNoIconUrl = new URL(
  "@/assets/images/client/Icon （9）.png",
  import.meta.url,
).href
const dateIconUrl = new URL(
  "@/assets/images/client/Icon (10).png",
  import.meta.url,
).href
const timeIconUrl = new URL(
  "@/assets/images/client/Icon (11).png",
  import.meta.url,
).href
const addressIconUrl = new URL(
  "@/assets/images/client/Icon (12).png",
  import.meta.url,
).href

const fallbackImages = [
  "https://www.figma.com/api/mcp/asset/9e6bc861-0df1-4513-8431-93f5aca90399",
  "https://www.figma.com/api/mcp/asset/8adbfc97-ffcd-46ea-9407-e1c1bd168703",
  "https://www.figma.com/api/mcp/asset/460655e7-1958-421f-919c-cfb4e1186670",
]

const { t, locale } = useI18n({ useScope: "global" })
const router = useRouter()
const route = useRoute()

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

const selectedStatus = ref<OrderListTab>("ACTIVE")
const searchKeyword = ref("")
const orderRecords = ref<OrderListRecord[]>([])
const tabCounts = ref<Record<OrderListTab, number>>({ ACTIVE: 0, HISTORY: 0 })
const isLoading = ref(false)
const loadError = ref(false)
const reviewDialogVisible = ref(false)
const isReviewSubmitting = ref(false)
const cancelPolicyVisible = ref(false)
const refundDialogVisible = ref(false)
const isRefundSubmitting = ref(false)
const rescheduleDialogVisible = ref(false)
const isRescheduleSubmitting = ref(false)
const isManageResolving = ref(false)
const cancelConfirmed = ref(false)
const reviewForm = reactive({
  orderNo: "",
  serviceName: "",
  rating: 0,
  content: "",
  tags: [] as string[],
})
const refundForm = reactive({
  orderNo: "",
  reason: "",
  otherReason: "",
  amountText: "",
  handlingFeeText: "",
  mode: "refund" as "refund" | "cancel",
  item: null as OrderCardView | null,
})
const refundReasonRecords = ref<RefundReasonRecord[]>([])
const rescheduleForm = reactive({
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
  String(value || "")
    .replace(/\s/g, "")
    .replace(/[–—]/g, "-")
const minRescheduleDate = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
})
const rescheduleDatePickerLocale = computed(() =>
  locale.value.startsWith("zh") ? elLocaleZhCn : elLocaleEn,
)
const isRescheduleDateDisabled = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}` < minRescheduleDate.value
}
const localizedRescheduleDate = computed(() => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rescheduleForm.serviceTime)
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
          rescheduleForm.serviceTime === rescheduleForm.currentServiceDate &&
          normalizeTimeSlot(time) ===
            normalizeTimeSlot(rescheduleForm.currentTimeText),
      }
    })
    .filter(
      (
        item,
      ): item is {
        time: string
        timeRange: number
        available: boolean
        isCurrent: boolean
      } => Boolean(item),
    ),
)
const rescheduleTimePlaceholder = computed(() => {
  if (!rescheduleForm.serviceTime)
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
  const serviceTime = rescheduleForm.serviceTime.trim()
  const spuId = rescheduleForm.spuId.trim()
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

const handleRescheduleDateChange = () => {
  rescheduleForm.timeRange = null
  rescheduleAvailableTimeRecords.value = []
  lastLoadedRescheduleKey.value = ""
  void fetchRescheduleAvailableTimes(true)
}

const handleRescheduleTimeOpen = () => {
  if (!rescheduleForm.serviceTime) {
    ElMessage.warning(
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
  return labels[Math.round(reviewForm.rating)] || ""
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
  const index = reviewForm.tags.indexOf(tag)
  if (index >= 0) reviewForm.tags.splice(index, 1)
  else reviewForm.tags.push(tag)
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

const formatAmount = (value?: number | string | null, fallback = "AED 0") => {
  if (value == null || String(value).trim() === "") return fallback
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback
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
  const explicitStatus =
    record.orderStatus == null || String(record.orderStatus).trim() === ""
      ? NaN
      : Number(record.orderStatus)
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
    statusText.includes("refundrefuse") ||
    statusText.includes("refund rejected") ||
    statusText.includes("退款失败") ||
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

const orderCards = computed<OrderCardView[]>(() =>
  (orderRecords.value || [])
    .map((item, index) => {
      const statusCode = getStatusCode(item)
      const orderStatus = getRawOrderStatus(item)
      const statusText = getOrderStatusText(
        orderStatus,
        normalizeStatusText(item),
      )
      const title = pickI18nValue(
        item.spuNameI18n,
        String(item.spuName || "").trim() ||
          t("client.orderList.unknownService"),
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
        title,
        amountText: formatAmount(item.orderAmount),
        refundHandlingFeeText:
          orderStatus === 5 ? formatAmount(item.refundHandlingFee, "") : "",
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
        selectedStatus.value =
          getRawOrderStatus(requestedRecord) === 1 ? "ACTIVE" : "HISTORY"
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
    name: "product-detail",
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
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "未查询到订单主键，请刷新后重试"
        : "Unable to find this order for payment. Please refresh and try again.",
    )
    return
  }
  router.push({
    name: "order-confirm",
    query: {
      orderId,
      orderNo: orderNo || undefined,
      spuId: item.spuId,
      title: item.title,
      titleI18n: JSON.stringify(item.record.spuNameI18n || {}),
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
  router.push({ name: "order-detail", params: { orderNo: item.orderNo } })
}

const requestReschedule = (item: OrderCardView) => {
  const rawSchedule = String(item.record.serviceDateTime || "").trim()
  const dateMatch = /\d{4}-\d{2}-\d{2}/.exec(rawSchedule)
  const timeMatch = /(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/.exec(rawSchedule)
  const timeText = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : ""
  rescheduleForm.orderNo = item.orderNo
  rescheduleForm.spuId = item.spuId
  rescheduleForm.serviceName = item.title
  rescheduleForm.currentSchedule = item.serviceTimeText
  rescheduleForm.currentServiceDate = dateMatch?.[0] || ""
  rescheduleForm.currentTimeText = timeText
  rescheduleForm.serviceTime = rescheduleForm.currentServiceDate
  rescheduleForm.timeRange = null
  rescheduleForm.item = item
  rescheduleAvailableTimeRecords.value = []
  lastLoadedRescheduleKey.value = ""
  rescheduleDialogVisible.value = true
  void fetchRescheduleAvailableTimes(true)
}

const cancelFromManage = () => {
  const item = rescheduleForm.item
  rescheduleDialogVisible.value = false
  if (item) void openRefund(item)
}

const submitReschedule = async () => {
  if (isRescheduleSubmitting.value) return
  if (!rescheduleForm.serviceTime) {
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "请选择新的服务日期"
        : "Select a new service date",
    )
    return
  }
  if (!rescheduleForm.timeRange) {
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "请选择新的服务时段"
        : "Select a new time slot",
    )
    return
  }
  const selectedSlot = selectableRescheduleTimeOptions.value.find(
    (slot) => slot.timeRange === rescheduleForm.timeRange,
  )
  if (selectedSlot?.isCurrent) {
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "请选择不同于当前安排的新时段"
        : "Choose a time slot different from the current schedule",
    )
    return
  }
  isRescheduleSubmitting.value = true
  try {
    await rescheduleOrder({
      orderNo: rescheduleForm.orderNo,
      serviceTime: rescheduleForm.serviceTime,
      timeRange: rescheduleForm.timeRange,
    })
    rescheduleDialogVisible.value = false
    ElMessage.success(
      locale.value.startsWith("zh")
        ? "服务时间已更新"
        : "Your service has been rescheduled",
    )
    await loadOrders()
  } catch (error: any) {
    ElMessage.error(
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
  reviewForm.orderNo = normalizedOrderNo
  reviewForm.serviceName = item.title
  reviewForm.rating = 0
  reviewForm.content = ""
  reviewForm.tags = []
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (isReviewSubmitting.value) {
    return
  }
  if (!reviewForm.orderNo) {
    ElMessage.warning(t("client.orderList.reviewDialog.orderNoMissing"))
    return
  }
  if (!Number.isFinite(reviewForm.rating) || reviewForm.rating <= 0) {
    ElMessage.warning(t("client.orderList.reviewDialog.ratingRequired"))
    return
  }
  const note = reviewForm.content.trim()
  const content = [reviewForm.tags.join(", "), note].filter(Boolean).join(" — ")
  if (!content) {
    ElMessage.warning(t("client.orderList.reviewDialog.contentRequired"))
    return
  }

  isReviewSubmitting.value = true
  try {
    await review({
      orderNo: reviewForm.orderNo,
      rating: Math.round(reviewForm.rating),
      content,
    })
    ElMessage.success(t("client.orderList.reviewDialog.submitSuccess"))
    reviewDialogVisible.value = false
    void loadOrders()
  } catch (error: any) {
    ElMessage.error(
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
      ElMessage.warning(
        localizedReason(check?.cannotRefundReason) ||
          (locale.value === "zh"
            ? "该订单当前不可取消"
            : "This booking cannot currently be cancelled"),
      )
      return
    }
    refundForm.orderNo = item.orderNo
    refundForm.reason = cancelReasonOptions.value[0]?.value || "PLANS_CHANGED"
    refundForm.otherReason = ""
    refundForm.item = item
    refundForm.mode = check.canRefund ? "refund" : "cancel"
    if (check.canRefund) {
      const refundAmount = await getOrderRefundAmount(item.orderNo)
      if (!refundAmount) throw new Error(
        locale.value === "zh" ? "无法获取退款金额" : "Unable to load refund amount",
      )
      refundForm.amountText = formatAmount(refundAmount.refundAmount)
      refundForm.handlingFeeText = formatAmount(refundAmount.handlingFee)
    } else {
      refundForm.amountText = ""
      refundForm.handlingFeeText = ""
    }
    cancelConfirmed.value = false
    refundDialogVisible.value = false
    cancelPolicyVisible.value = true
  } catch (error: any) {
    ElMessage.error(
      error?.message ||
        (locale.value === "zh"
          ? "无法检查取消资格"
          : "Unable to check cancellation eligibility"),
    )
  }
}

const continueCancellation = () => {
  cancelPolicyVisible.value = false
  refundDialogVisible.value = true
}

const submitRefund = async () => {
  if (isRefundSubmitting.value) return
  const selectedReason = cancelReasonOptions.value.find(
    (entry) => entry.value === refundForm.reason,
  )
  const refundReasonRemark = refundForm.otherReason.trim()
  if (!selectedReason?.value) {
    ElMessage.warning(t("client.orderList.refundDialog.reasonRequired"))
    return
  }
  if (selectedReason.remarkRequired && !refundReasonRemark) {
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "请填写退款原因说明"
        : "Please tell us why you are requesting a refund",
    )
    return
  }
  isRefundSubmitting.value = true
  try {
    if (refundForm.mode === "refund") {
      await requestOrderRefund({
        orderNo: refundForm.orderNo,
        refundReason: selectedReason.value,
        ...(refundReasonRemark ? { refundReasonRemark } : {}),
      })
    } else {
      const cancelReason = [selectedReason.label, refundReasonRemark]
        .filter(Boolean)
        .join(": ")
      await cancelOrder({ orderNo: refundForm.orderNo, cancelReason })
    }
    cancelConfirmed.value = true
    await loadOrders()
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("client.orderList.refundDialog.submitFailed"),
    )
  } finally {
    isRefundSubmitting.value = false
  }
}

const rescheduleFromCancel = () => {
  const item = refundForm.item
  refundDialogVisible.value = false
  if (item) void requestReschedule(item)
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
.order-list-page {
  min-height: 100%;
  background: #f8fafc;
}

.order-list-body {
  padding: 48px 0 80px;
}

.order-list-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.order-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.order-list-head h1 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 26px;
  line-height: 1.2;
  font-weight: 900;
}

.order-list-head p {
  margin: 4px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
}

.order-list-search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-list-search__input {
  width: 256px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px 0 12px;
}

.order-list-search__input img {
  width: 18px;
  height: 18px;
}

.order-list-search__input input {
  width: 100%;
  border: 0;
  outline: 0;
  color: rgba(15, 23, 42, 0.86);
  font-size: 14px;
  background: transparent;
}

.order-list-search__input input::placeholder {
  color: rgba(15, 23, 42, 0.4);
}

.order-list-search button {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}

.order-list-search button img {
  width: 20px;
  height: 20px;
}

.order-status-tabs {
  margin-top: 30px;
  width: fit-content;
  display: flex;
  gap: 10px;
}

.order-status-tab {
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: #edeff2;
  color: #3a3f45;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.order-status-tab i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.order-status-tab b {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef3f8;
  color: #475569;
  font-size: 11px;
}
.order-status-tab--active b {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.order-status-tab--active {
  background: var(--hourx-brand);
  color: #fff;
}

.order-list-content {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-list-empty {
  margin: 0;
  padding: 36px 18px;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  background: #fff;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
}

.order-list-error {
  padding: 28px 22px;
  border: 1px solid #fecaca;
  border-radius: 16px;
  background: #fff7f7;
  color: #7f1d1d;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.order-list-error strong {
  font-size: 15px;
}
.order-list-error span {
  color: #9f3434;
  font-size: 13px;
}
.order-list-error button {
  margin-top: 4px;
  min-width: 88px;
  height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: var(--hourx-brand);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.order-card {
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  background: #fff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 18px;
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 22px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  border-color: #cdd9e7;
  box-shadow: 0 18px 42px rgba(5, 21, 43, 0.1);
}
.order-card:focus-visible {
  outline: 3px solid rgba(23, 105, 194, 0.2);
  outline-offset: 2px;
}

.order-card__image-wrap {
  width: 190px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.order-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.order-card__badge {
  position: absolute;
  left: 8px;
  top: 8px;
  height: 24px;
  border-radius: 999px;
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
}

.order-card--history .order-card__image {
  filter: grayscale(55%);
  opacity: 0.85;
}

.order-card--status-2 .order-card__badge {
  background: #e3f5ec;
  color: #1e8e5a;
}

.order-card--status-3 .order-card__badge {
  background: #fbe5e1;
  color: #c0392b;
}

.order-card--status-4 .order-card__badge {
  background: #fbebd3;
  color: #c87f0a;
}

.order-card--status-5 .order-card__badge {
  background: #f1f5f9;
  color: #8a8f96;
}

.order-card__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.order-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.order-card__title-row h3 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 20px;
  line-height: 1.2;
  font-weight: 800;
}

.order-card__title-row strong {
  color: var(--hourx-brand);
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
  white-space: nowrap;
}

.order-card__meta-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}

.order-card__meta-row span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.order-card__meta-row span img {
  width: 16px;
  height: 16px;
}

.order-card__details {
  margin-top: 8px;
  display: grid;
  grid-template-columns: minmax(220px, 0.75fr) minmax(300px, 1.25fr);
  gap: 10px;
}

.order-card__detail {
  min-height: 54px;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
}

.order-card__detail img {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.order-card__detail span {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-card__detail small {
  color: rgba(15, 23, 42, 0.48);
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
}

.order-card__detail strong {
  color: rgba(15, 23, 42, 0.78);
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.order-card__selections {
  margin-top: 9px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(15, 23, 42, 0.56);
  font-size: 13px;
  line-height: 18px;
}

.order-card__selections span {
  overflow-wrap: anywhere;
}

.order-card__selections b {
  color: rgba(15, 23, 42, 0.76);
  font-weight: 700;
}

.order-card__refund-fee {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #edf0f3;
  color: #687588;
  font-size: 13px;
}

.order-card__refund-fee strong {
  color: #172033;
  white-space: nowrap;
}

.order-card__actions {
  margin-top: auto;
  padding-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.order-card__btn {
  height: 36px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
}

.order-card__btn--ghost {
  background: #fff;
  color: rgba(15, 23, 42, 0.65);
  border-color: #e5e7eb;
}

.order-card__btn--primary {
  background: var(--hourx-brand);
  color: #fff;
}

.order-card__btn--danger {
  border-color: #dc2626;
  background: #dc2626;
  color: #fff;
}

.order-card__btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.order-review-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-review-form__intro {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef5fd, #f8fbff);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-review-form__intro strong {
  color: #05152b;
  font-size: 17px;
}
.order-review-form__intro span {
  color: #64748b;
  font-size: 13px;
}
.order-review-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.order-review-tags button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #dce5ef;
  border-radius: 999px;
  background: #fff;
  color: #526174;
  cursor: pointer;
}
.order-review-tags button.is-selected {
  border-color: #1769c2;
  background: #edf5ff;
  color: #1769c2;
  font-weight: 800;
}
.order-review-form__counter {
  align-self: flex-end;
  color: #94a3b8;
}

.order-review-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-review-form__field > span {
  color: rgba(15, 23, 42, 0.8);
  font-size: 14px;
  font-weight: 700;
}

.order-review-form__field textarea {
  min-height: 120px;
  resize: vertical;
  border: 1px solid #d1d5dc;
  border-radius: 10px;
  padding: 10px 12px;
  outline: 0;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.85);
}

.order-review-form__field textarea::placeholder {
  color: rgba(15, 23, 42, 0.4);
}

.order-review-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.order-refund-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.order-refund-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.order-refund-form__field > span {
  color: rgba(15, 23, 42, 0.8);
  font-size: 14px;
  font-weight: 700;
}

.order-refund-form__field input,
.order-refund-form__field textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5dc;
  border-radius: 10px;
  padding: 10px 12px;
  outline: 0;
  color: rgba(15, 23, 42, 0.85);
  font-size: 14px;
}

.order-refund-form__field input:disabled {
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.55);
}

.order-refund-form__field textarea {
  min-height: 110px;
  resize: vertical;
}

.order-refund-form__amount {
  display: flex;
  min-height: 42px;
  align-items: center;
  padding: 0 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.85);
  font-size: 15px;
  box-sizing: border-box;
  width: 100%;
}

:global(.order-refund-dialog) {
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
}

:global(.order-refund-dialog .el-dialog__body) {
  min-height: 0;
  overflow-y: auto;
}

:global(.order-cancellation-dialog) {
  padding: 0;
  overflow: visible;
  border-radius: 16px;
  background: transparent;
  box-shadow: none;
}
:global(.order-cancellation-dialog .el-dialog__header),
:global(.order-cancellation-dialog .el-dialog__footer) {
  display: none;
}
:global(.order-cancellation-dialog .el-dialog__body) {
  padding: 0;
}

.order-refund-form__field small {
  color: rgba(15, 23, 42, 0.5);
  font-size: 12px;
  line-height: 1.5;
}

.order-cancel-reasons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}
.order-cancel-reasons label {
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #e0e7ef;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
}
.order-cancel-reasons input {
  width: auto;
  margin: 2px 0 0;
  padding: 0;
  accent-color: #1769c2;
}
.order-cancel-reason-note {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
}
.order-cancel-reschedule {
  align-self: flex-start;
}
.order-cancel-reschedule--active {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
  box-shadow: 0 8px 20px rgba(5, 21, 43, 0.18);
}

.order-reschedule-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.order-reschedule-form__summary {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 17px 18px;
  border: 1px solid #dbe8f5;
  border-radius: 16px;
  background: linear-gradient(135deg, #edf5ff 0%, #f9fbfe 100%);
}
.order-reschedule-form__summary span {
  color: #05152b;
  font-size: 17px;
  font-weight: 800;
}
.order-reschedule-form__summary small {
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
}
.order-reschedule-form__summary strong {
  color: #1769c2;
  font-size: 14px;
}
.order-reschedule-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.order-reschedule-form__grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: visible;
}
.order-reschedule-form__grid span {
  color: #334155;
  font-size: 13px;
  font-weight: 750;
}
.order-reschedule-form__grid select {
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid #d6e0ea;
  border-radius: 11px;
  outline: none;
  background: #fff;
  color: #05152b;
  font: inherit;
}
.order-reschedule-form__grid select:focus {
  border-color: #1769c2;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.1);
}
.order-reschedule-form__date-picker {
  width: 100% !important;
}
.order-reschedule-form__grid
  :deep(.order-reschedule-form__date-picker .el-input__wrapper) {
  min-height: 44px;
  box-sizing: border-box;
  border-radius: 11px;
  box-shadow: 0 0 0 1px #d6e0ea inset;
}
.order-reschedule-form__grid
  :deep(.order-reschedule-form__date-picker .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #1769c2 inset,
    0 0 0 3px rgba(23, 105, 194, 0.1);
}
.order-reschedule-form__date-hint {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 2px;
  position: relative;
  z-index: 1;
}
.order-cancel-booking {
  background: none;
  border: none;
  color: rgba(15, 23, 42, 0.38);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.order-cancel-booking:hover {
  color: rgba(15, 23, 42, 0.55);
}
.order-cancel-booking:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.order-reschedule-form > p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .order-card {
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
  }

  .order-card__image-wrap {
    width: 140px;
    height: 140px;
  }

  .order-card__details {
    grid-template-columns: 1fr;
  }

  .order-card__title-row h3,
  .order-card__title-row strong {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  :global(.order-refund-dialog) {
    margin: 16px auto;
  }

  :global(.order-refund-dialog .el-dialog__header),
  :global(.order-refund-dialog .el-dialog__body),
  :global(.order-refund-dialog .el-dialog__footer) {
    padding-left: 16px;
    padding-right: 16px;
  }

  .order-refund-form__field textarea {
    min-height: 96px;
  }

  .order-reschedule-form__grid {
    grid-template-columns: 1fr;
  }

  .order-list-body {
    padding: 28px 0 56px;
  }

  .order-list-container {
    width: min(1280px, calc(100% - 24px));
  }

  .order-list-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-list-search {
    width: 100%;
  }

  .order-list-search__input {
    width: 100%;
  }

  .order-status-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .order-card {
    grid-template-columns: 1fr;
  }

  .order-card__image-wrap {
    width: 100%;
    height: 180px;
  }

  .order-card__title-row {
    align-items: center;
  }

  .order-card__title-row h3 {
    font-size: 22px;
  }

  .order-card__title-row strong {
    font-size: 18px;
  }

  .order-card__details {
    grid-template-columns: 1fr;
  }
}
.order-cancel-policy {
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  background: #f4f7fb;
  color: #475569;
  font-size: 12px;
  line-height: 1.55;
}
.order-cancel-policy strong {
  color: #05152b;
  font-size: 14px;
}
.order-cancel-policy__links {
  display: flex;
  align-items: center;
  gap: 7px;
}
.order-cancel-policy__links button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
.order-cancel-policy label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
}
.order-cancel-policy input {
  margin-top: 2px;
}

@media (max-width: 560px) {
  .order-cancel-reasons {
    grid-template-columns: 1fr;
  }
}
</style>
