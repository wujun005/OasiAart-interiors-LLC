<template>
  <main
    class="client-order-detail"
    :class="{ 'client-order-detail--mobile': mobile }"
  >
    <div class="client-order-detail__container">
      <button class="client-order-detail__back" type="button" @click="goBack">
        <span aria-hidden="true">←</span>
        {{ locale.startsWith("zh") ? "返回全部订单" : "Back to All Orders" }}
      </button>

      <section v-if="loading" class="client-order-detail__state">
        <span class="client-order-detail__spinner" />
        {{
          locale.startsWith("zh") ? "正在加载订单…" : "Loading your booking…"
        }}
      </section>
      <section
        v-else-if="!order"
        class="client-order-detail__state client-order-detail__state--empty"
      >
        <strong>{{
          locale.startsWith("zh") ? "未找到该订单" : "Booking not found"
        }}</strong>
        <p>
          {{
            locale.startsWith("zh")
              ? "订单可能仍在同步，请稍后刷新或返回订单列表。"
              : "The booking may still be syncing. Please refresh shortly or return to your orders."
          }}
        </p>
        <button type="button" @click="goBack">
          {{ locale.startsWith("zh") ? "查看订单列表" : "View Orders" }}
        </button>
      </section>

      <template v-else>
        <header class="client-order-detail__hero">
          <div>
            <span class="client-order-detail__eyebrow hourx-wordmark"
              >HOURX HOME</span
            >
            <h1>
              {{ locale.startsWith("zh") ? "订单详情" : "Booking Details" }}
            </h1>
            <p>{{ order.orderNo }}</p>
          </div>
          <span
            class="client-order-detail__status"
            :class="`is-${statusTone}`"
            >{{ statusText }}</span
          >
        </header>

        <section
          class="client-order-detail__progress"
          aria-label="Booking progress"
        >
          <div
            v-for="(step, index) in progressSteps"
            :key="step"
            :class="{ 'is-active': index <= progressIndex }"
          >
            <span class="client-order-detail__progress-icon">
              <i>{{ index < progressIndex ? "✓" : index + 1 }}</i>
            </span>
            <span class="client-order-detail__progress-label">{{ step }}</span>
          </div>
        </section>

        <section
          class="client-order-detail__status-box"
          :class="`is-${statusTone}`"
          aria-live="polite"
        >
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{{ statusBoxTitle }}</strong>
            <p>{{ statusBoxMessage }}</p>
          </div>
        </section>

        <div class="client-order-detail__grid">
          <section
            class="client-order-detail__panel client-order-detail__service"
          >
            <div class="client-order-detail__section-title">
              <span>{{
                locale.startsWith("zh") ? "服务内容" : "Service booked"
              }}</span>
            </div>
            <div class="client-order-detail__service-main">
              <img :src="order.spuImage || fallbackImage" :alt="serviceTitle" />
              <div>
                <h2>{{ serviceTitle }}</h2>
                <div
                  v-if="serviceDescriptionHtml"
                  class="client-order-detail__service-description"
                  v-html="serviceDescriptionHtml"
                />
                <p v-if="naturalSpecText" class="client-order-detail__service-variant">
                  {{ naturalSpecText }}
                </p>
                <p v-if="addOnsText">
                  <b>{{ locale.startsWith("zh") ? "附加项" : "Add-ons" }}</b
                  >{{ addOnsText }}
                </p>
              </div>
            </div>
          </section>

          <section class="client-order-detail__panel">
            <div class="client-order-detail__section-title">
              <span>{{
                locale.startsWith("zh") ? "服务安排" : "Service schedule"
              }}</span>
            </div>
            <dl class="client-order-detail__facts">
              <div>
                <dt>◷</dt>
                <dd>
                  <small>{{
                    locale.startsWith("zh") ? "服务时间" : "Date & time"
                  }}</small
                  ><strong>{{ formattedServiceSchedule }}</strong>
                </dd>
              </div>
              <div>
                <dt>⌖</dt>
                <dd>
                  <small>{{
                    locale.startsWith("zh") ? "服务地址" : "Service address"
                  }}</small
                  ><strong>{{ displayValue(serviceAddressText) }}</strong>
                </dd>
              </div>
              <div>
                <dt>▣</dt>
                <dd>
                  <small>{{
                    locale.startsWith("zh") ? "创建时间" : "Booked on"
                  }}</small
                  ><strong>{{ formattedCreatedAt }}</strong>
                </dd>
              </div>
            </dl>
          </section>

          <section class="client-order-detail__panel">
            <div class="client-order-detail__section-title">
              <span>{{
                locale.startsWith("zh") ? "支付摘要" : "Payment summary"
              }}</span>
            </div>
            <dl class="client-order-detail__info-list">
              <div>
                <dt>{{ paymentSummaryLabel }}</dt>
                <dd>{{ paymentSummaryText }}</dd>
              </div>
              <div class="is-total">
                <dt>
                  {{ locale.startsWith("zh") ? "订单总额（含 VAT）" : "Total (incl. VAT)" }}
                </dt>
                <dd>{{ formatAed(order.orderAmount) }}</dd>
              </div>
            </dl>
          </section>

          <section class="client-order-detail__panel">
            <div class="client-order-detail__section-title">
              <span>{{
                locale.startsWith("zh") ? "联系人信息" : "Contact details"
              }}</span>
            </div>
            <dl class="client-order-detail__info-list">
              <div>
                <dt>{{ locale.startsWith("zh") ? "联系人" : "Customer" }}</dt>
                <dd>
                  {{
                    displayValue(formatContactName(order.firstName, order.lastName))
                  }}
                </dd>
              </div>
              <div>
                <dt>{{ locale.startsWith("zh") ? "联系电话" : "Phone" }}</dt>
                <dd>{{ displayValue(order.phone) }}</dd>
              </div>
              <div>
                <dt>{{ locale.startsWith("zh") ? "邮箱" : "Email" }}</dt>
                <dd>{{ displayValue(orderEmail) }}</dd>
              </div>
              <div v-if="String(order.remark || '').trim()">
                <dt>
                  {{ locale.startsWith("zh") ? "预订备注" : "Booking notes" }}
                </dt>
                <dd>{{ displayValue(order.remark) }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section v-if="actions.length" class="client-order-detail__actions">
          <button
            v-for="action in actions"
            :key="action.key"
            type="button"
            :class="action.tone"
            @click="runAction(action.key)"
          >
            {{ action.label }}
          </button>
        </section>
      </template>
    </div>

    <div
      v-if="reviewDialogVisible"
      class="client-order-detail__review-backdrop"
      role="presentation"
      @click.self="closeReview"
    >
      <section
        class="client-order-detail__review-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="locale.startsWith('zh') ? '留下评价' : 'Leave Feedback'"
      >
        <button
          class="client-order-detail__review-close"
          type="button"
          :disabled="reviewSubmitting"
          aria-label="Close"
          @click="closeReview"
        >
          ×
        </button>
        <span class="client-order-detail__review-kicker">{{
          locale.startsWith("zh") ? "服务评价" : "SERVICE REVIEW"
        }}</span>
        <h2>{{ locale.startsWith("zh") ? "留下评价" : "Leave Feedback" }}</h2>
        <p>
          {{
            locale.startsWith("zh")
              ? `请评价本次${serviceTitle}服务。`
              : `How was your ${serviceTitle} service?`
          }}
        </p>
        <div
          class="client-order-detail__review-stars"
          :aria-label="locale.startsWith('zh') ? '评分' : 'Rating'"
        >
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            :class="{ 'is-active': star <= reviewRating }"
            @click="reviewRating = star"
          >
            ★
          </button>
        </div>
        <textarea
          v-model.trim="reviewContent"
          maxlength="500"
          :placeholder="
            locale.startsWith('zh') ? '写下您的服务体验…' : 'Write your review…'
          "
        />
        <small>{{ reviewContent.length }}/500</small>
        <p v-if="reviewError" class="client-order-detail__review-error">
          {{ reviewError }}
        </p>
        <button
          class="client-order-detail__review-submit"
          type="button"
          :disabled="reviewSubmitting"
          @click="submitFeedback"
        >
          {{
            reviewSubmitting
              ? locale.startsWith("zh")
                ? "提交中…"
                : "Submitting…"
              : locale.startsWith("zh")
                ? "提交评价"
                : "Submit Review"
          }}
        </button>
      </section>
    </div>

    <div
      v-if="rescheduleDialogVisible"
      class="client-order-detail__review-backdrop"
      role="presentation"
      @click.self="closeReschedule"
    >
      <section
        class="client-order-detail__review-dialog client-order-detail__reschedule-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="locale.startsWith('zh') ? '管理预订' : 'Manage Booking'"
      >
        <button
          class="client-order-detail__review-close"
          type="button"
          :disabled="isRescheduleSubmitting"
          aria-label="Close"
          @click="closeReschedule"
        >
          ×
        </button>
        <span class="client-order-detail__review-kicker">{{
          locale.startsWith("zh") ? "管理预订" : "MANAGE BOOKING"
        }}</span>
        <h2>
          {{ locale.startsWith("zh") ? "调整服务时间" : "Reschedule Service" }}
        </h2>

        <div class="client-order-detail__reschedule-summary">
          <span>{{ serviceTitle }}</span>
          <small>{{
            locale.startsWith("zh") ? "当前安排" : "Current schedule"
          }}</small>
          <strong>{{ formattedServiceSchedule }}</strong>
        </div>

        <div class="client-order-detail__reschedule-grid">
          <label>
            <span>{{
              locale.startsWith("zh") ? "新的服务日期" : "New service date"
            }}</span>
            <el-config-provider :locale="rescheduleDatePickerLocale">
              <el-date-picker
                v-model="rescheduleForm.serviceTime"
                class="client-order-detail__reschedule-date"
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
            <small class="client-order-detail__reschedule-date-hint">{{
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
                {{ slot.time }}{{ slot.isCurrent ? (locale.startsWith("zh") ? "（当前时段）" : " (current slot)") : "" }}
              </option>
            </select>
          </label>
        </div>

        <p class="client-order-detail__reschedule-note">
          {{
            locale.startsWith("zh")
              ? "提交后系统会检查时段容量及服务开始前的时间限制。"
              : "Availability and the minimum advance-time rule are checked when you submit."
          }}
        </p>

        <div class="client-order-detail__reschedule-actions">
          <button
            class="client-order-detail__reschedule-cancel"
            type="button"
            :disabled="isRescheduleSubmitting"
            @click="cancelFromManage"
          >
            {{ locale.startsWith("zh") ? "取消预订" : "Cancel Booking" }}
          </button>
          <button
            class="client-order-detail__review-submit"
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
      </section>
    </div>

    <CancellationPolicyGate
      v-model="cancelPolicyVisible"
      @continue="continueCancellation"
    />

    <div
      v-if="cancelDialogVisible"
      class="client-order-detail__review-backdrop"
      role="presentation"
      @click.self="closeCancellation"
    >
      <CancellationModalContent
        :locale="locale"
        :reasons="cancelReasonOptions"
        :reason="cancelForm.reason"
        :other-reason="cancelForm.otherReason"
        :service-name="serviceTitle"
        :schedule="formattedServiceSchedule"
        :amount-text="cancelForm.amountText"
        :mode="cancelForm.mode"
        :submitting="isCancelSubmitting"
        :confirmed="cancelConfirmed"
        @update:reason="cancelForm.reason = $event"
        @update:other-reason="cancelForm.otherReason = $event"
        @close="closeCancellation"
        @done="closeCancellation"
        @reschedule="rescheduleFromCancellation"
        @confirm="submitCancellation"
      />
    </div>


    <aside v-if="cartCount" class="client-order-detail__cart-bar">
      <span>🛒</span>
      <div>
        <strong>{{
          locale.startsWith("zh")
            ? `购物车中有 ${cartCount} 项服务`
            : `${cartCount} service${cartCount > 1 ? "s" : ""} waiting in your cart`
        }}</strong
        ><small>{{
          locale.startsWith("zh")
            ? "可一起结算，减少重复填写"
            : "Checkout together when you are ready"
        }}</small>
      </div>
      <button
        type="button"
        @click="router.push({ name: mobile ? 'h5-cart' : 'cart' })"
      >
        {{ locale.startsWith("zh") ? "管理预订" : "Manage Booking" }}
      </button>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus"
import elLocaleEn from "element-plus/es/locale/lang/en"
import elLocaleZhCn from "element-plus/es/locale/lang/zh-cn"
import { computed, onMounted, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import fallbackImage from "@/assets/images/client/kv.png"
import CancellationPolicyGate from "@/modules/client/components/CancellationPolicyGate.vue"
import CancellationModalContent from "@/modules/client/components/CancellationModalContent.vue"
import {
  cancelOrder,
  checkOrderRefund,
  getAvailableSelectTime,
  getClientProfile,
  getOrderList,
  getRefundReasons,
  requestOrderRefund,
  rescheduleOrder,
  review,
  type OrderListRecord,
  type OrderRefundCheckResult,
  type RefundReasonRecord,
} from "@/modules/client/api"
import { useCart } from "@/modules/client/composables/useCart"
import {
  formatCreatedAt,
  formatServiceSchedule,
} from "@/modules/client/utils/order-date-time"
import {
  formatContactName,
  formatOrderAddOns,
  localizeOrderText,
} from "@/modules/client/utils/order-localization"

const props = withDefaults(defineProps<{ mobile?: boolean }>(), {
  mobile: false,
})
const route = useRoute()
const router = useRouter()
const { locale } = useI18n({ useScope: "global" })
const { cartCount, refreshCart } = useCart()
const loading = ref(true)
const order = ref<OrderListRecord | null>(null)
const profileEmail = ref("")
const reviewDialogVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewRating = ref(0)
const reviewContent = ref("")
const reviewError = ref("")
const cancelPolicyVisible = ref(false)
const cancelDialogVisible = ref(false)
const isCancelSubmitting = ref(false)
const cancelConfirmed = ref(false)
const refundReasonRecords = ref<RefundReasonRecord[]>([])
const cancelForm = reactive({
  reason: "",
  otherReason: "",
  mode: "refund" as "refund" | "cancel",
  amountText: "",
  handlingFeeText: "",
})

// Reschedule dialog state
const rescheduleDialogVisible = ref(false)
const isRescheduleSubmitting = ref(false)
const isRescheduleTimeLoading = ref(false)
const lastLoadedRescheduleKey = ref("")
const rescheduleAvailableTimeRecords = ref<any[]>([])
const rescheduleForm = reactive({
  currentServiceDate: "",
  currentTimeText: "",
  serviceTime: "",
  timeRange: null as number | null,
})
const normalizeTimeSlot = (value: string) =>
  String(value || "").replace(/\s/g, "").replace(/[–—]/g, "-")

type AvailableTimeRecord = {
  time?: string
  avaiable?: boolean
  available?: boolean
  timeRange?: number | string
}

const preferred = computed(() =>
  locale.value.startsWith("zh")
    ? ["zh-CN", "zh", "en"]
    : ["en", "en-US", "zh-CN"],
)
const i18nText = (map?: Record<string, string>, fallback = "") => {
  for (const lang of preferred.value) if (map?.[lang]) return map[lang]
  return Object.values(map || {}).find(Boolean) || fallback
}
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
const normalizeRichTextHtml = (value: string) => {
  const content = String(value || "").trim()
  if (!content) return ""
  if (/<\/?[a-z][^>]*>/i.test(content)) return content
  return `<p>${escapeHtml(content).replace(/\r?\n/g, "<br>")}</p>`
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
    label: i18nText(item.nameI18n, item.code),
    remarkRequired: item.remarkRequired,
  })),
)
const selectedCancelReason = computed(() =>
  cancelReasonOptions.value.find((item) => item.value === cancelForm.reason),
)
const serviceTitle = computed(() =>
  i18nText(
    order.value?.spuNameI18n,
    order.value?.spuName ||
      (locale.value.startsWith("zh") ? "家居服务" : "Home service"),
  ),
)
const serviceDescriptionHtml = computed(() =>
  normalizeRichTextHtml(i18nText(order.value?.descI18n)),
)
const naturalSpecText = computed(() =>
  (Array.isArray(order.value?.specSelections) ? order.value.specSelections : [])
    .map((selection) => {
      const typeName = localizeOrderText(
        selection.specTypeNameI18n,
        selection.specTypeName,
        locale.value,
        "type",
      )
      const valueName = localizeOrderText(
        selection.specValueNameI18n,
        selection.specValueName,
        locale.value,
      )
      if (!valueName) return ""
      if (
        !locale.value.startsWith("zh") &&
        /unit types?/i.test(typeName) &&
        /^\d+\s+bedrooms?$/i.test(valueName)
      ) {
        return `${valueName} Apartment`
      }
      if (locale.value.startsWith("zh")) {
        return valueName.replace(/(\d+)\s*(?:人|位|名技师)/g, "$1 人")
      }
      return valueName
        .replace(/^(\d+)\s+hours?$/i, (_, count) => `${count} hour${Number(count) === 1 ? "" : "s"}`)
        .replace(/^(\d+)\s+(?:technicians?|people|persons?)$/i, (_, count) => `${count} person${Number(count) === 1 ? "" : "s"}`)
    })
    .filter(Boolean)
    .join(locale.value.startsWith("zh") ? "，" : ", "),
)
const addOnsText = computed(() =>
  formatOrderAddOns(order.value?.attachSelections, locale.value),
)
const serviceAddressText = computed(() =>
  [
    order.value?.serviceAddress,
    order.value?.building,
    order.value?.roomNo,
    order.value?.community,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", "),
)

// 状态分类固定以英文文案/后端原始枚举为准，不跟随界面语言，
// 保证与订单列表页的判定结果一致。
const normalizedStatus = computed(() => {
  const map = order.value?.statusNameI18n || {}
  const canonical =
    map["en"] ||
    map["en-US"] ||
    map["en_US"] ||
    order.value?.statusName ||
    Object.values(map).find(Boolean) ||
    ""
  return `${order.value?.statusName || ""} ${canonical}`.toLowerCase()
})
const rawStatus = computed(() => {
  const value = Number(order.value?.orderStatus)
  if (Number.isFinite(value)) return value
  const text = normalizedStatus.value
  if (
    text.includes("refundrefuse") ||
    text.includes("refund failed") ||
    text.includes("退款失败")
  )
    return 6
  if (text.includes("refunded") || text.includes("已退款")) return 5
  if (text.includes("refunding") || text.includes("退款中")) return 4
  if (text.includes("complete") || text.includes("完成")) return 2
  if (text.includes("cancel") || text.includes("取消")) return 3
  if (
    text.includes("unpaid") ||
    text.includes("待支付") ||
    text.includes("draft")
  )
    return 0
  return 1
})
const fallbackStatusText = computed(() => {
  const zh = locale.value.startsWith("zh")
  const labels: Record<number, string> = zh
    ? {
        0: "未支付",
        1: "已确认",
        2: "已完成",
        3: "已取消",
        4: "退款中",
        5: "已退款",
        6: "退款失败",
      }
    : {
        0: "Unpaid",
        1: "Confirmed",
        2: "Completed",
        3: "Cancelled",
        4: "Refunding",
        5: "Refunded",
        6: "Refund Failed",
      }
  return labels[rawStatus.value] || (zh ? "未知状态" : "Unknown")
})
const teamAssigned = computed(
  () => {
    const current = order.value
    if (!current) return false
    const supplierId = current.supplierId ?? current.supplier?.id
    const supplierName =
      current.supplierName ||
      current.supplier?.supplierName ||
      current.supplier?.name ||
      Object.values(current.supplierNameI18n || {}).find(Boolean) ||
      ""
    return Boolean(
      current.supplierAssigned === true ||
        current.teamAssigned ||
        (supplierId !== null && supplierId !== undefined && supplierId !== "") ||
        String(supplierName).trim() ||
        normalizedStatus.value.includes("assigned") ||
        normalizedStatus.value.includes("已分配"),
    )
  },
)
const statusText = computed(() => {
  if (rawStatus.value === 1 && teamAssigned.value) {
    return locale.value.startsWith("zh") ? "团队已分配" : "Team Assigned"
  }
  return fallbackStatusText.value
})
const statusTone = computed(() => {
  if (rawStatus.value === 2 || rawStatus.value === 5) return "success"
  if (rawStatus.value === 6) return "danger"
  if (rawStatus.value === 3) return "muted"
  if (rawStatus.value === 0 || rawStatus.value === 4) return "warning"
  return "primary"
})
const progressIndex = computed(() => {
  if (rawStatus.value === 2 || rawStatus.value === 3 || rawStatus.value === 5)
    return 2
  if (rawStatus.value === 4 || teamAssigned.value) return 1
  return 0
})
const progressSteps = computed(() => {
  const zh = locale.value.startsWith("zh")
  if (rawStatus.value === 4 || rawStatus.value === 5) {
    return zh
      ? ["预订已确认", "退款中", "已退款"]
      : ["Booking confirmed", "Refunding", "Refunded"]
  }
  if (rawStatus.value === 3) {
    return zh
      ? ["预订已确认", "已取消", "流程结束"]
      : ["Booking confirmed", "Cancelled", "Closed"]
  }
  return zh
    ? ["预订已确认", "团队已分配", "服务已完成"]
    : ["Booking confirmed", "Team assigned", "Service completed"]
})
const statusBoxTitle = computed(
  () =>
    `${locale.value.startsWith("zh") ? "状态" : "Status"}: ${statusText.value}`,
)
const statusBoxMessage = computed(() => {
  const zh = locale.value.startsWith("zh")
  if (rawStatus.value === 1 && teamAssigned.value)
    return zh
      ? "服务团队已分配，正在为预定时间做准备。"
      : "Our team has been assigned and is preparing for your scheduled time slot."
  if (rawStatus.value === 1)
    return zh
      ? "预订已确认，我们正在安排服务团队。"
      : "Your booking is confirmed and we are assigning the service team."
  if (rawStatus.value === 2)
    return zh
      ? "本次服务已完成，感谢您选择 HourX。"
      : "This service has been completed. Thank you for choosing HourX."
  if (rawStatus.value === 3)
    return zh ? "本次预订已取消。" : "This booking has been cancelled."
  if (rawStatus.value === 4)
    return zh
      ? "退款正在处理，请留意后续状态更新。"
      : "Your refund is being processed. Please watch for the next status update."
  if (rawStatus.value === 5)
    return zh ? "退款已处理完成。" : "Your refund has been completed."
  if (rawStatus.value === 6)
    return zh
      ? "退款处理失败，请联系客服协助。"
      : "The refund could not be completed. Please contact support."
  return zh
    ? "请继续完成付款以确认预订。"
    : "Continue payment to confirm this booking."
})
const actions = computed(() => {
  if (rawStatus.value === 0) return []
  if (rawStatus.value === 1)
    return [
      {
        key: "manage-booking",
        label: locale.value.startsWith("zh") ? "管理预订" : "Manage Booking",
        tone: "primary",
      },
    ]
  if (rawStatus.value === 2)
    return [
      ...(!order.value?.reviewed
        ? [
            {
              key: "review",
              label: locale.value.startsWith("zh")
                ? "客户评价"
                : "Customer Review",
              tone: "secondary",
            },
          ]
        : []),
      {
        key: "rebook",
        label: locale.value.startsWith("zh") ? "再次预订" : "Book Again",
        tone: "primary",
      },
    ]
  if (rawStatus.value === 3)
    return [
      ...(!order.value?.reviewed
        ? [
            {
              key: "review",
              label: locale.value.startsWith("zh")
                ? "客户评价"
                : "Customer Review",
              tone: "secondary",
            },
          ]
        : []),
      {
        key: "rebook",
        label: locale.value.startsWith("zh") ? "再次预订" : "Book Again",
        tone: "primary",
      },
    ]
  if (rawStatus.value === 4 || rawStatus.value === 5)
    return [
      {
        key: "rebook",
        label: locale.value.startsWith("zh") ? "再次预订" : "Book Again",
        tone: "primary",
      },
    ]
  return []
})

const displayValue = (value?: string) =>
  String(value || "").trim() ||
  (locale.value.startsWith("zh") ? "暂无" : "Not provided")
const formatAed = (value?: number | string) =>
  `AED ${Number(value || 0).toFixed(2)}`
const orderEmail = computed(() => {
  const current = order.value
  return String(
    current?.contactEmail ||
      current?.customerEmail ||
      current?.userEmail ||
      current?.email ||
      profileEmail.value ||
      "",
  ).trim()
})
const formattedServiceSchedule = computed(() =>
  formatServiceSchedule(
    order.value?.serviceDateTime,
    locale.value,
    displayValue(),
  ),
)
const formattedCreatedAt = computed(() =>
  formatCreatedAt(order.value?.createTime, locale.value, displayValue()),
)
const paymentSummaryLabel = computed(() =>
  locale.value.startsWith("zh") ? "支付信息" : "Payment",
)
const paymentSummaryText = computed(() => {
  const current = order.value as
    | (OrderListRecord & {
        paymentMethodDetail?: string
        cardBrand?: string
        cardLast4?: string
      })
    | null
  const detail = String(current?.paymentMethodDetail || "").trim()
  if (detail) {
    return locale.value.startsWith("zh") ? `通过 ${detail} 支付` : `Paid via ${detail}`
  }
  const brand = String(current?.cardBrand || "").trim()
  const last4 = String(current?.cardLast4 || "").trim()
  if (last4) {
    const card = `${brand ? `${brand.charAt(0).toUpperCase()}${brand.slice(1).toLowerCase()} ` : ""}•••• ${last4}`
    return locale.value.startsWith("zh") ? `通过 ${card} 支付` : `Paid via ${card}`
  }

  const method = String(current?.paymentMethod || "").trim()
  const normalized = method.toLowerCase().replace(/[\s-]+/g, "_")
  if (!normalized || normalized === "stripe") {
    return locale.value.startsWith("zh")
      ? "支付由 Stripe 安全处理"
      : "Payment processed securely by Stripe"
  }
  const methodLabels: Record<string, string> = {
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    paypal: "PayPal",
  }
  const methodLabel =
    methodLabels[normalized] ||
    method
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
      .join(" ")
  return locale.value.startsWith("zh")
    ? `通过 ${methodLabel} 支付`
    : `Paid via ${methodLabel}`
})
const listRouteName = computed(() =>
  props.mobile ? "h5-orders" : "order-list",
)
const goBack = () => router.push({ name: listRouteName.value })
const closeReview = () => {
  if (!reviewSubmitting.value) reviewDialogVisible.value = false
}
const openFeedback = () => {
  reviewRating.value = 0
  reviewContent.value = ""
  reviewError.value = ""
  reviewDialogVisible.value = true
}
const submitFeedback = async () => {
  if (reviewSubmitting.value || !order.value?.orderNo) return
  if (reviewRating.value < 1) {
    reviewError.value = locale.value.startsWith("zh")
      ? "请选择 1–5 星评分。"
      : "Please select a 1–5 star rating."
    return
  }
  if (!reviewContent.value.trim()) {
    reviewError.value = locale.value.startsWith("zh")
      ? "请填写评价内容。"
      : "Please write a short review."
    return
  }
  reviewSubmitting.value = true
  reviewError.value = ""
  try {
    await review({
      orderNo: order.value.orderNo,
      rating: reviewRating.value,
      content: reviewContent.value.trim(),
    })
    order.value.reviewed = true
    reviewDialogVisible.value = false
  } catch (error: any) {
    reviewError.value =
      error?.message ||
      (locale.value.startsWith("zh")
        ? "评价提交失败，请稍后重试。"
        : "Unable to submit your review. Please try again.")
  } finally {
    reviewSubmitting.value = false
  }
}

// Reschedule computed & functions
const rescheduleDatePickerLocale = computed(() =>
  locale.value.startsWith("zh") ? elLocaleZhCn : elLocaleEn,
)
const minRescheduleDate = computed(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
})
const isRescheduleDateDisabled = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}` < minRescheduleDate.value
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
  (rescheduleAvailableTimeRecords.value as AvailableTimeRecord[])
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
          normalizeTimeSlot(time) === normalizeTimeSlot(rescheduleForm.currentTimeText),
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
const fetchRescheduleAvailableTimes = async () => {
  const serviceTime = rescheduleForm.serviceTime.trim()
  const spuId = String(order.value?.spuId || "").trim()
  if (!serviceTime || !spuId) return
  const cacheKey = `${spuId}:${serviceTime}`
  if (
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
  void fetchRescheduleAvailableTimes()
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
const openReschedule = () => {
  const rawSchedule = String(order.value?.serviceDateTime || "").trim()
  const dateMatch = /\d{4}-\d{2}-\d{2}/.exec(rawSchedule)
  const timeMatch = /(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/.exec(rawSchedule)
  rescheduleForm.currentServiceDate = dateMatch?.[0] || ""
  rescheduleForm.currentTimeText = timeMatch
    ? `${timeMatch[1]}-${timeMatch[2]}`
    : ""
  rescheduleForm.serviceTime = rescheduleForm.currentServiceDate
  rescheduleForm.timeRange = null
  rescheduleAvailableTimeRecords.value = []
  lastLoadedRescheduleKey.value = ""
  rescheduleDialogVisible.value = true
  void fetchRescheduleAvailableTimes()
}
const closeReschedule = () => {
  if (!isRescheduleSubmitting.value) rescheduleDialogVisible.value = false
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
      orderNo: order.value?.orderNo || "",
      serviceTime: rescheduleForm.serviceTime,
      timeRange: rescheduleForm.timeRange,
    })
    rescheduleDialogVisible.value = false
    ElMessage.success(
      locale.value.startsWith("zh")
        ? "服务时间已更新"
        : "Your service has been rescheduled",
    )
    // Reload order data
    const orderNo = String(route.params.orderNo || "").trim()
    const records = await getOrderList({ status: 0, keyWord: orderNo })
    order.value =
      records.find((item) => String(item.orderNo) === orderNo) ||
      records[0] ||
      null
    if (order.value && !orderEmail.value) {
      try {
        profileEmail.value = String((await getClientProfile())?.email || "").trim()
      } catch (error) {
        console.warn("load account email fallback failed:", error)
      }
    }
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
const ensureRefundReasons = async () => {
  if (refundReasonRecords.value.length) return
  try {
    const records = await getRefundReasons()
    if (records.length) refundReasonRecords.value = records
  } catch (error) {
    console.warn("load refund reasons failed, using fallback options:", error)
  }
}
const closeCancellation = () => {
  if (!isCancelSubmitting.value) cancelDialogVisible.value = false
}
const rescheduleFromCancellation = () => {
  if (isCancelSubmitting.value) return
  cancelDialogVisible.value = false
  openReschedule()
}
const reloadCurrentOrder = async () => {
  const orderNo = String(route.params.orderNo || "").trim()
  const records = await getOrderList({ status: 0, keyWord: orderNo })
  order.value =
    records.find((item) => String(item.orderNo) === orderNo) ||
    records[0] ||
    null
}
const cancelFromManage = async () => {
  const orderNo = String(order.value?.orderNo || "").trim()
  if (!orderNo) return
  try {
    await ensureRefundReasons()
    const check = (await checkOrderRefund(
      orderNo,
    )) as OrderRefundCheckResult | null
    if (!check?.canRefund && !check?.canCancelWithoutRefund) {
      ElMessage.warning(
        i18nText(check?.cannotRefundReason) ||
          (locale.value.startsWith("zh")
            ? "该订单当前不可取消"
            : "This booking cannot currently be cancelled"),
      )
      return
    }
    cancelForm.reason = cancelReasonOptions.value[0]?.value || "PLANS_CHANGED"
    cancelForm.otherReason = ""
    cancelForm.mode = check.canRefund ? "refund" : "cancel"
    cancelForm.amountText = formatAed(check.canRefund ? check.refundAmount : 0)
    cancelForm.handlingFeeText = check.canRefund
      ? formatAed(check.handlingFee)
      : ""
    cancelConfirmed.value = false
    rescheduleDialogVisible.value = false
    cancelDialogVisible.value = false
    cancelPolicyVisible.value = true
  } catch (error: any) {
    ElMessage.error(
      error?.message ||
        (locale.value.startsWith("zh")
          ? "无法检查取消资格"
          : "Unable to check cancellation eligibility"),
    )
  }
}

const continueCancellation = () => {
  cancelPolicyVisible.value = false
  cancelDialogVisible.value = true
}

const submitCancellation = async () => {
  if (isCancelSubmitting.value) return
  const orderNo = String(order.value?.orderNo || "").trim()
  const selectedReason = selectedCancelReason.value
  const otherReason = cancelForm.otherReason.trim()
  if (!orderNo || !selectedReason) return
  if (selectedReason.remarkRequired && !otherReason) {
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "请填写取消原因"
        : "Please tell us why you are cancelling",
    )
    return
  }
  isCancelSubmitting.value = true
  try {
    if (cancelForm.mode === "refund") {
      await requestOrderRefund({
        orderNo,
        refundReason: selectedReason.value,
        ...(otherReason ? { refundReasonRemark: otherReason } : {}),
      })
    } else {
      await cancelOrder({
        orderNo,
        cancelReason: [selectedReason.label, otherReason]
          .filter(Boolean)
          .join(": "),
      })
    }
    cancelConfirmed.value = true
    await reloadCurrentOrder()
  } catch (error: any) {
    ElMessage.error(
      error?.message ||
        (locale.value.startsWith("zh")
          ? "取消失败，请稍后重试"
          : "Unable to cancel. Please try again."),
    )
  } finally {
    isCancelSubmitting.value = false
  }
}

const runAction = (action: string) => {
  if (action === "review") {
    openFeedback()
    return
  }
  if (action === "rebook" && order.value?.spuId) {
    void router.push({
      name: props.mobile ? "h5-product-detail" : "product-detail",
      params: { spuId: String(order.value.spuId) },
    })
    return
  }
  if (action === "manage-booking") {
    openReschedule()
    return
  }
}

onMounted(async () => {
  try {
    const orderNo = String(route.params.orderNo || "").trim()
    const records = await getOrderList({ status: 0, keyWord: orderNo })
    order.value =
      records.find((item) => String(item.orderNo) === orderNo) ||
      records[0] ||
      null
    if (order.value && !orderEmail.value) {
      try {
        profileEmail.value = String((await getClientProfile())?.email || "").trim()
      } catch (error) {
        console.warn("load account email fallback failed:", error)
      }
    }
    if (order.value && rawStatus.value === 0) {
      await router.replace({
        name: listRouteName.value,
        query: { action: "manage", orderNo: order.value.orderNo || orderNo },
      })
      return
    }
    if (order.value && rawStatus.value === 2 && order.value.reviewed !== true) {
      openFeedback()
    }
    void refreshCart()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.client-order-detail {
  min-height: 100vh;
  padding: 38px 22px 110px;
  background:
    radial-gradient(
      circle at 92% 4%,
      rgba(23, 105, 194, 0.12),
      transparent 28%
    ),
    #f4f7fb;
  color: #05152b;
}
.client-order-detail__container {
  width: min(1120px, 100%);
  margin: 0 auto;
}
.client-order-detail__back {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font-weight: 800;
  cursor: pointer;
}
.client-order-detail__back span {
  margin-right: 8px;
  font-size: 20px;
}
.client-order-detail__hero {
  margin-top: 26px;
  padding: 28px 30px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  background: linear-gradient(135deg, #05152b, #12385e);
  color: #fff;
  box-shadow: 0 22px 54px rgba(5, 21, 43, 0.2);
}
.client-order-detail__eyebrow {
  color: #7fc0ff;
  font-family: Inter, "Avenir Next", Arial, sans-serif;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.24em;
  line-height: 1;
  text-transform: uppercase;
}
.client-order-detail__hero h1 {
  margin: 7px 0 5px;
  font-size: clamp(26px, 4vw, 38px);
}
.client-order-detail__hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.64);
}
.client-order-detail__status {
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.12);
}
.client-order-detail__status.is-success {
  background: #dff7e8;
  color: #128340;
}
.client-order-detail__status.is-warning {
  background: #fff0c7;
  color: #a65b00;
}
.client-order-detail__status.is-muted {
  background: #e8edf3;
  color: #526174;
}
.client-order-detail__status.is-danger {
  background: #fee2e2;
  color: #b91c1c;
}
.client-order-detail__progress {
  margin: 22px 0;
  padding: 22px 26px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  box-shadow: 0 10px 26px rgba(5, 21, 43, 0.05);
}
.client-order-detail__progress div {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.client-order-detail__progress div:not(:last-child)::after {
  position: absolute;
  top: 16px;
  left: calc(50% + 22px);
  right: calc(-50% + 22px);
  height: 2px;
  background: #e2e8f0;
  content: "";
  z-index: 0;
}
.client-order-detail__progress-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  position: relative;
  z-index: 1;
}
.client-order-detail__progress i {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #edf1f5;
  font-style: normal;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}
.client-order-detail__progress-label {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
}
.client-order-detail__progress .is-active {
  color: #1769c2;
}
.client-order-detail__progress .is-active i {
  background: #1769c2;
  color: #fff;
}
.client-order-detail__progress .is-active .client-order-detail__progress-label {
  color: #1769c2;
}
.client-order-detail__progress .is-active:not(:last-child)::after {
  background: #1769c2;
}
.client-order-detail__status-box {
  margin: 0 0 18px;
  padding: 16px 18px;
  border: 1px solid #bdd9f8;
  border-radius: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #eff7ff;
  color: #12589f;
}
.client-order-detail__status-box > span {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #1769c2;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
}
.client-order-detail__status-box strong {
  display: block;
  font-size: 14px;
}
.client-order-detail__status-box p {
  margin: 4px 0 0;
  color: #4d6d8d;
  font-size: 12px;
  line-height: 1.5;
}
.client-order-detail__status-box.is-success {
  border-color: #b8e7ca;
  background: #effbf4;
  color: #128340;
}
.client-order-detail__status-box.is-success > span {
  background: #128340;
}
.client-order-detail__status-box.is-success p {
  color: #41765a;
}
.client-order-detail__status-box.is-warning {
  border-color: #f2d793;
  background: #fff9e8;
  color: #995800;
}
.client-order-detail__status-box.is-warning > span {
  background: #c27800;
}
.client-order-detail__status-box.is-warning p {
  color: #795d2a;
}
.client-order-detail__status-box.is-muted {
  border-color: #dce3eb;
  background: #f5f7fa;
  color: #526174;
}
.client-order-detail__status-box.is-muted > span {
  background: #64748b;
}
.client-order-detail__status-box.is-muted p {
  color: #64748b;
}
.client-order-detail__status-box.is-danger {
  border-color: #fecaca;
  background: #fff4f4;
  color: #b91c1c;
}
.client-order-detail__status-box.is-danger > span {
  background: #dc2626;
}
.client-order-detail__status-box.is-danger p {
  color: #8f3a3a;
}
.client-order-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.client-order-detail__panel {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e1e8f0;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(5, 21, 43, 0.055);
}
.client-order-detail__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf1f5;
  color: #05152b;
  font-size: 15px;
  font-weight: 900;
}
.client-order-detail__section-title strong {
  color: #1769c2;
}
.client-order-detail__service {
  grid-column: 1 / -1;
}
.client-order-detail__service-main {
  padding-top: 18px;
  display: flex;
  gap: 18px;
}
.client-order-detail__service-main img {
  width: 110px;
  height: 88px;
  border-radius: 14px;
  object-fit: cover;
}
.client-order-detail__service-main h2 {
  margin: 2px 0 10px;
  font-size: 20px;
}
.client-order-detail__service-main p {
  margin: 5px 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.client-order-detail__service-description {
  margin: 5px 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.client-order-detail__service-description :deep(p) {
  margin: 0 0 6px;
}
.client-order-detail__service-description :deep(p:last-child) {
  margin-bottom: 0;
}
.client-order-detail__service-main .client-order-detail__service-variant {
  color: #1769c2;
  font-weight: 800;
}
.client-order-detail__service-main b {
  margin-right: 8px;
  color: #334155;
}
.client-order-detail__facts,
.client-order-detail__info-list {
  margin: 0;
}
.client-order-detail__facts > div {
  padding: 13px 0;
  display: flex;
  gap: 12px;
}
.client-order-detail__facts dt {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #edf5ff;
  color: #1769c2;
}
.client-order-detail__facts dd {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.client-order-detail__facts small,
.client-order-detail__info-list dt {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
}
.client-order-detail__facts strong {
  color: #334155;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.client-order-detail__info-list > div {
  padding: 12px 0;
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  gap: 14px;
  border-bottom: 1px solid #f0f3f6;
}
.client-order-detail__info-list dd {
  margin: 0;
  color: #334155;
  font-size: 13px;
  text-align: right;
  overflow-wrap: anywhere;
}
.client-order-detail__info-list .is-total {
  border-bottom: 0;
}
.client-order-detail__info-list .is-total dt,
.client-order-detail__info-list .is-total dd {
  color: #05152b;
  font-size: 16px;
  font-weight: 900;
}
.client-order-detail__actions {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid #e1e8f0;
  border-radius: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fff;
}
.client-order-detail__actions button,
.client-order-detail__cart-bar button,
.client-order-detail__state button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
}
.client-order-detail__actions .primary,
.client-order-detail__cart-bar button,
.client-order-detail__state button {
  border: 0;
  background: #05152b;
  color: #fff;
}
.client-order-detail__actions .secondary {
  border: 1px solid #d5dee8;
  background: #fff;
  color: #334155;
}
.client-order-detail__actions .danger {
  border: 1px solid #dc2626;
  background: #fff;
  color: #dc2626;
}
.client-order-detail__cart-bar {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 20;
  width: min(720px, calc(100% - 32px));
  transform: translateX(-50%);
  padding: 13px 14px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 50px rgba(5, 21, 43, 0.2);
  backdrop-filter: blur(16px);
}
.client-order-detail__cart-bar > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #edf5ff;
}
.client-order-detail__cart-bar div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.client-order-detail__cart-bar strong {
  font-size: 13px;
}
.client-order-detail__cart-bar small {
  color: #7b8797;
  font-size: 11px;
}
.client-order-detail__state {
  min-height: 380px;
  margin-top: 26px;
  border: 1px solid #e1e8f0;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fff;
  color: #64748b;
}
.client-order-detail__state--empty {
  flex-direction: column;
  text-align: center;
  padding: 26px;
}
.client-order-detail__state--empty strong {
  color: #05152b;
  font-size: 22px;
}
.client-order-detail__state--empty p {
  margin: 0 0 10px;
  max-width: 480px;
  line-height: 1.65;
}
.client-order-detail__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #dbe5ef;
  border-top-color: #1769c2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.client-order-detail__review-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 18px;
  display: grid;
  place-items: center;
  background: rgba(5, 21, 43, 0.62);
  backdrop-filter: blur(4px);
}
.client-order-detail__review-dialog {
  position: relative;
  width: min(460px, 100%);
  padding: 30px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 28px 80px rgba(5, 21, 43, 0.32);
  text-align: center;
}
.client-order-detail__review-close {
  position: absolute;
  top: 13px;
  right: 15px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  font-size: 24px;
  cursor: pointer;
}
.client-order-detail__review-kicker {
  color: #1769c2;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.2em;
}
.client-order-detail__review-dialog h2 {
  margin: 8px 0 5px;
  color: #05152b;
  font-size: 26px;
}
.client-order-detail__review-dialog > p {
  margin: 0 0 18px;
  color: #64748b;
  font-size: 13px;
}
.client-order-detail__review-stars {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.client-order-detail__review-stars button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #cbd5e1;
  font-size: 34px;
  cursor: pointer;
}
.client-order-detail__review-stars button.is-active {
  color: #f6b91c;
}
.client-order-detail__review-dialog textarea {
  width: 100%;
  min-height: 112px;
  padding: 13px;
  border: 1px solid #d7e0ea;
  border-radius: 12px;
  box-sizing: border-box;
  resize: vertical;
  font: inherit;
}
.client-order-detail__review-dialog > small {
  display: block;
  margin-top: 5px;
  color: #94a3b8;
  text-align: right;
}
.client-order-detail__review-dialog .client-order-detail__review-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-size: 12px;
}
.client-order-detail__review-submit {
  width: 100%;
  min-height: 46px;
  margin-top: 16px;
  border: 0;
  border-radius: 12px;
  background: #05152b;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}
.client-order-detail__review-submit:disabled {
  opacity: 0.6;
  cursor: wait;
}
.client-order-detail__cancel-dialog {
  width: min(620px, 100%);
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  text-align: left;
}
.client-order-detail__cancel-dialog > h2,
.client-order-detail__cancel-dialog > p,
.client-order-detail__cancel-dialog > .client-order-detail__review-kicker {
  display: block;
  text-align: center;
}
.client-order-detail__cancel-reasons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 12px;
}
.client-order-detail__cancel-reasons label {
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #e0e7ef;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #334155;
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
}
.client-order-detail__cancel-reasons input {
  width: auto;
  margin: 2px 0 0;
  accent-color: #1769c2;
}
.client-order-detail__cancel-summary {
  margin-top: 14px;
  padding: 13px 14px;
  border-radius: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  background: #f4f7fb;
}
.client-order-detail__cancel-summary span,
.client-order-detail__cancel-summary strong {
  color: #05152b;
  font-size: 14px;
  font-weight: 900;
}
.client-order-detail__cancel-summary small {
  grid-column: 1 / -1;
  color: #64748b;
  font-size: 11px;
}
.client-order-detail__cancel-policy {
  margin-top: 12px;
  padding: 14px;
  border: 1px solid #dbe5ef;
  border-radius: 12px;
  background: #fbfdff;
  color: #475569;
  font-size: 12px;
  line-height: 1.55;
}
.client-order-detail__cancel-policy > p {
  margin: 0 0 8px;
}
.client-order-detail__cancel-policy-links {
  display: flex;
  align-items: center;
  gap: 7px;
}
.client-order-detail__cancel-policy-links button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #1769c2;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
.client-order-detail__cancel-policy > label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #334155;
}
.client-order-detail__cancel-policy > label input {
  margin-top: 2px;
  accent-color: #1769c2;
}
.client-order-detail__cancel-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.client-order-detail__cancel-actions button {
  min-height: 44px;
  padding: 0 17px;
  border: 1px solid #d5dee8;
  border-radius: 11px;
  background: #fff;
  color: #334155;
  font-weight: 900;
  cursor: pointer;
}
.client-order-detail__cancel-actions button.is-danger {
  border-color: #dc2626;
  background: #dc2626;
  color: #fff;
}
.client-order-detail__cancel-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
@media (max-width: 720px) {
  .client-order-detail {
    padding: 14px 14px 108px;
  }
  .client-order-detail__hero {
    margin-top: 10px;
    padding: 15px 16px;
    border-radius: 17px;
  }
  .client-order-detail__hero h1 {
    margin: 4px 0 2px;
    font-size: 21px;
  }
  .client-order-detail__hero p {
    font-size: 11px;
  }
  .client-order-detail__status {
    padding: 7px 10px;
    font-size: 10px;
  }
  .client-order-detail__progress {
    margin: 10px 0 12px;
    padding: 11px 8px;
    border-radius: 15px;
  }
  .client-order-detail__progress div {
    flex-direction: column;
    gap: 6px;
    font-size: 10px;
  }
  .client-order-detail__progress-label {
    font-size: 10px;
  }
  .client-order-detail__progress div:not(:last-child)::after {
    top: 16px;
    left: 58%;
    right: -42%;
  }
  .client-order-detail__status-box {
    display: none;
  }
  .client-order-detail__grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .client-order-detail__panel {
    padding: 15px;
    border-radius: 17px;
  }
  .client-order-detail__service {
    grid-column: auto;
  }
  .client-order-detail__service-main img {
    width: 70px;
    height: 70px;
  }
  .client-order-detail__service-main h2 {
    font-size: 17px;
  }
  .client-order-detail__info-list > div {
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 10px;
  }
  .client-order-detail__actions {
    position: sticky;
    bottom: 10px;
    z-index: 5;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  .client-order-detail__actions button {
    padding: 0 10px;
  }
  .client-order-detail__review-dialog {
    padding: 28px 20px 22px;
  }
  .client-order-detail__cancel-reasons {
    grid-template-columns: 1fr;
  }
  .client-order-detail__cancel-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .client-order-detail__cart-bar {
    bottom: 10px;
  }
  .client-order-detail__cart-bar small {
    display: none;
  }
  .client-order-detail__cart-bar button {
    min-height: 40px;
    padding: 0 12px;
    font-size: 11px;
  }
  .client-order-detail__reschedule-dialog {
    padding: 28px 20px 22px;
  }
  .client-order-detail__reschedule-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .client-order-detail__reschedule-actions {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 8px;
  }
  .client-order-detail__reschedule-actions .client-order-detail__review-submit {
    width: 100%;
  }
  .client-order-detail__reschedule-cancel {
    text-align: center;
    padding: 8px 0;
  }
}

/* Reschedule dialog styles */
.client-order-detail__reschedule-dialog {
  max-width: 520px;
  text-align: left;
}
.client-order-detail__reschedule-summary {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px;
  border: 1px solid #dbe8f5;
  border-radius: 14px;
  background: linear-gradient(135deg, #edf5ff 0%, #f9fbfe 100%);
  margin-bottom: 16px;
}
.client-order-detail__reschedule-summary span {
  color: #05152b;
  font-size: 15px;
  font-weight: 800;
}
.client-order-detail__reschedule-summary small {
  color: #64748b;
  font-size: 11px;
}
.client-order-detail__reschedule-summary strong {
  color: #1769c2;
  font-size: 13px;
}
.client-order-detail__reschedule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.client-order-detail__reschedule-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  overflow: visible;
}
.client-order-detail__reschedule-grid span {
  color: #334155;
  font-size: 12px;
  font-weight: 750;
}
.client-order-detail__reschedule-grid select {
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  padding: 0 10px;
  border: 1px solid #d6e0ea;
  border-radius: 10px;
  outline: none;
  background: #fff;
  color: #05152b;
  font: inherit;
  font-size: 13px;
}
.client-order-detail__reschedule-grid select:focus {
  border-color: #1769c2;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.1);
}
.client-order-detail__reschedule-date {
  width: 100% !important;
}
.client-order-detail__reschedule-date :deep(.el-input__wrapper) {
  min-height: 40px;
  box-sizing: border-box;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #d6e0ea inset;
}
.client-order-detail__reschedule-date :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #1769c2 inset,
    0 0 0 3px rgba(23, 105, 194, 0.1);
}
.client-order-detail__reschedule-date-hint {
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
  margin-top: 2px;
  position: relative;
  z-index: 1;
}
.client-order-detail__reschedule-note {
  margin: 0 0 16px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}
.client-order-detail__reschedule-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}
.client-order-detail__reschedule-cancel {
  background: none;
  border: none;
  color: rgba(15, 23, 42, 0.38);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
  flex-shrink: 0;
  white-space: nowrap;
}
.client-order-detail__reschedule-cancel:hover {
  color: rgba(15, 23, 42, 0.55);
}
.client-order-detail__reschedule-cancel:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
