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
              <img :src="orderImage || order.spuImage || fallbackImage" :alt="serviceTitle" />
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
                <p v-for="item in packageItemViews" :key="item.id">
                  <b>{{ item.name }}</b> {{ item.times }}
                </p>
              </div>
            </div>
          </section>

          <section
            v-if="isPackageOrder"
            class="client-order-detail__panel client-order-detail__fulfillments"
          >
            <div class="client-order-detail__section-title">
              <span>{{
                locale.startsWith("zh") ? "预约与履约记录" : "Visits & fulfilment"
              }}</span>
              <div class="client-order-detail__section-actions">
                <button
                  v-if="canBookPackageVisit"
                  type="button"
                  class="client-order-detail__book-visit"
                  @click="openBookVisit"
                >
                  {{ locale.startsWith("zh") ? "预约上门" : "Book a visit" }}
                </button>
                <strong v-if="packageFulfillmentViews.length">
                  {{
                    locale.startsWith("zh")
                      ? `${packageFulfillmentViews.length} 条记录`
                      : `${packageFulfillmentViews.length} record${packageFulfillmentViews.length === 1 ? "" : "s"}`
                  }}
                </strong>
              </div>
            </div>

            <p
              v-if="!packageFulfillmentViews.length"
              class="client-order-detail__fulfillment-empty"
            >
              {{
                locale.startsWith("zh")
                  ? "暂无预约记录，后续预约会显示在这里。"
                  : "No visits have been scheduled yet. Future bookings will appear here."
              }}
            </p>

            <div v-else class="client-order-detail__fulfillment-list">
              <article
                v-for="visit in packageFulfillmentViews"
                :key="visit.id"
                class="client-order-detail__fulfillment-card"
              >
                <header>
                  <div class="client-order-detail__fulfillment-identity">
                    <span>{{ visit.visitLabel }}</span>
                    <div>
                      <h3>{{ visit.serviceName }}</h3>
                      <small v-if="visit.fulfillmentNo">{{ visit.fulfillmentNo }}</small>
                    </div>
                  </div>
                  <span
                    class="client-order-detail__fulfillment-status"
                    :class="`is-${visit.statusTone}`"
                  >
                    {{ visit.statusText }}
                  </span>
                </header>

                <div class="client-order-detail__fulfillment-facts">
                  <div>
                    <span aria-hidden="true">◷</span>
                    <p>
                      <small>{{
                        locale.startsWith("zh") ? "预约时间" : "Scheduled time"
                      }}</small>
                      <strong>{{ visit.scheduleText }}</strong>
                    </p>
                  </div>
                  <div>
                    <span aria-hidden="true">⌖</span>
                    <p>
                      <small>{{
                        locale.startsWith("zh") ? "服务地址" : "Service address"
                      }}</small>
                      <strong>{{ visit.addressText }}</strong>
                    </p>
                  </div>
                  <div v-if="visit.contactText">
                    <span aria-hidden="true">♙</span>
                    <p>
                      <small>{{
                        locale.startsWith("zh") ? "预约联系人" : "Booking contact"
                      }}</small>
                      <strong>{{ visit.contactText }}</strong>
                    </p>
                  </div>
                  <div v-if="visit.supplierName">
                    <span aria-hidden="true">◇</span>
                    <p>
                      <small>{{
                        locale.startsWith("zh") ? "服务商" : "Service provider"
                      }}</small>
                      <strong>{{ visit.supplierName }}</strong>
                    </p>
                  </div>
                </div>

                <p v-if="visit.remark" class="client-order-detail__fulfillment-note">
                  <b>{{ locale.startsWith("zh") ? "预约备注" : "Booking notes" }}</b>
                  {{ visit.remark }}
                </p>
                <p
                  v-if="visit.cancelDetail"
                  class="client-order-detail__fulfillment-note is-cancelled"
                >
                  <b>{{ locale.startsWith("zh") ? "取消信息" : "Cancellation" }}</b>
                  {{ visit.cancelDetail }}
                </p>
              </article>
            </div>
          </section>

          <section class="client-order-detail__panel">
            <div class="client-order-detail__section-title">
              <span>{{
                locale.startsWith("zh") ? "服务安排" : "Service schedule"
              }}</span>
            </div>
            <dl class="client-order-detail__facts">
              <template v-if="isPackageOrder">
                <div>
                  <dt>◷</dt>
                  <dd>
                    <small>{{ t("client.home.packages.remainingLabel") }}</small
                    ><strong>{{ packageRemainingText }}</strong>
                  </dd>
                </div>
                <div v-if="packageValidText">
                  <dt>⌖</dt>
                  <dd>
                    <small>{{ t("client.home.packages.validity") }}</small
                    ><strong>{{ packageValidText }}</strong>
                  </dd>
                </div>
              </template>
              <div v-if="!isPackageOrder">
                <dt>◷</dt>
                <dd>
                  <small>{{
                    locale.startsWith("zh") ? "服务时间" : "Date & time"
                  }}</small
                  ><strong>{{ formattedServiceSchedule }}</strong>
                </dd>
              </div>
              <div v-if="!isPackageOrder">
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
              <div>
                <dt>{{ locale.startsWith("zh") ? "小计" : "Subtotal" }}</dt>
                <dd>{{ formatAed(orderSubtotal) }}</dd>
              </div>
              <div>
                <dt>{{ locale.startsWith("zh") ? "增值税 VAT（5%）" : "VAT (5%)" }}</dt>
                <dd>{{ formatAed(orderTax) }}</dd>
              </div>
              <div
                class="is-total"
                :class="{ 'has-refund-breakdown': showRefundBreakdown }"
              >
                <dt>
                  {{ locale.startsWith("zh") ? "总额" : "Total" }}
                </dt>
                <dd>{{ formatAed(order.orderAmount) }}</dd>
              </div>
              <div v-if="showRefundBreakdown" class="is-refund-deduction">
                <dt>{{ locale.startsWith("zh") ? "扣款金额" : "Deducted amount" }}</dt>
                <dd>− {{ formatAed(refundHandlingFeeAmount) }}</dd>
              </div>
              <div v-if="showRefundBreakdown" class="is-refund-amount">
                <dt>{{ locale.startsWith("zh") ? "退款金额" : "Refund amount" }}</dt>
                <dd>{{ formatAed(refundedAmount) }}</dd>
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
              <div v-if="String(order.additionalNotes || '').trim()">
                <dt>
                  {{ locale.startsWith("zh") ? "地址额外备注" : "Address notes" }}
                </dt>
                <dd>{{ displayValue(order.additionalNotes) }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section v-if="actions.length" class="client-order-detail__actions">
          <button
            v-for="action in visibleActions"
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
        <span class="client-order-detail__review-field-label">
          {{ locale.startsWith("zh") ? "评分" : "Rating" }}
        </span>
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
        <small
          v-if="reviewRatingLabel"
          class="client-order-detail__review-rating-label"
        >
          {{ reviewRatingLabel }}
        </small>
        <div class="client-order-detail__review-tag-field">
          <span class="client-order-detail__review-field-label">
            {{
              locale.startsWith("zh")
                ? "你最满意什么？"
                : "WHAT DID YOU LIKE MOST?"
            }}
          </span>
          <div class="client-order-detail__review-tags">
            <button
              v-for="tag in reviewTagOptions"
              :key="tag"
              type="button"
              :class="{ 'is-selected': reviewTags.includes(tag) }"
              @click="toggleReviewTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        <span class="client-order-detail__review-field-label">
          {{ locale.startsWith("zh") ? "评价内容" : "Comment" }}
        </span>
        <textarea
          v-model.trim="reviewContent"
          maxlength="500"
          :placeholder="
            locale.startsWith('zh') ? '写下您的服务体验…' : 'Write your review…'
          "
        />
        <small class="client-order-detail__review-counter">
          {{ reviewContent.length }}/500
        </small>
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
      :show-refund-summary="cancelForm.mode === 'refund'"
      :handling-fee-text="cancelForm.handlingFeeText"
      :refund-amount-text="cancelForm.amountText"
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

    <div
      v-if="bookVisitVisible"
      class="client-order-detail__review-backdrop"
      role="presentation"
      @click.self="closeBookVisit"
    >
      <section
        class="client-order-detail__review-dialog client-order-detail__reschedule-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="locale.startsWith('zh') ? '预约上门' : 'Book a visit'"
      >
        <button
          class="client-order-detail__review-close"
          type="button"
          :disabled="bookVisitSubmitting"
          aria-label="Close"
          @click="closeBookVisit"
        >
          ×
        </button>
        <span class="client-order-detail__review-kicker">{{
          locale.startsWith("zh") ? "套餐履约" : "PACKAGE VISIT"
        }}</span>
        <h2>{{ locale.startsWith("zh") ? "再约一次上门" : "Book another visit" }}</h2>
        <p>
          {{
            locale.startsWith("zh")
              ? "每次预约占用所选服务的 1 次。同一服务第一次填写地点后，之后都用这个地点。"
              : "Each booking uses one visit for the selected service. After the first visit, that service keeps the same address."
          }}
        </p>

        <label class="client-order-detail__book-field">
          <span>{{ locale.startsWith("zh") ? "服务" : "Service" }}</span>
          <select v-model="bookForm.skuId" :disabled="bookVisitSubmitting" @change="handleBookServiceChange">
            <option value="" disabled>
              {{ locale.startsWith("zh") ? "请选择服务" : "Select a service" }}
            </option>
            <option v-for="item in packageBookableServices" :key="item.skuId" :value="item.skuId">
              {{ item.name }} · {{ locale.startsWith("zh") ? `剩余 ${item.remaining} 次` : `${item.remaining} left` }}
            </option>
          </select>
        </label>

        <div class="client-order-detail__reschedule-grid">
          <label>
            <span>{{ locale.startsWith("zh") ? "上门日期" : "Visit date" }}</span>
            <el-config-provider :locale="rescheduleDatePickerLocale">
              <el-date-picker
                v-model="bookForm.serviceDate"
                class="client-order-detail__reschedule-date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :editable="false"
                :clearable="false"
                :disabled="bookVisitSubmitting"
                :disabled-date="isRescheduleDateDisabled"
                :placeholder="locale.startsWith('zh') ? '请选择日期' : 'Select a date'"
                @change="handleBookDateChange"
              />
            </el-config-provider>
          </label>
          <label>
            <span>{{ locale.startsWith("zh") ? "上门时段" : "Time slot" }}</span>
            <select
              v-model.number="bookForm.timeRange"
              :disabled="bookVisitSubmitting"
              @mousedown="fetchBookAvailableTimes"
            >
              <option :value="null" disabled>{{ bookTimePlaceholder }}</option>
              <option
                v-for="slot in bookTimeOptions"
                :key="slot.timeRange"
                :value="slot.timeRange"
                :disabled="!slot.available"
              >
                {{ slot.time }}
              </option>
            </select>
          </label>
        </div>

        <p v-if="lockedBookAddress" class="client-order-detail__book-lock">
          <b>{{ locale.startsWith("zh") ? "上门地点已锁定" : "Visit address is locked" }}</b>
          {{ lockedBookAddress }}
        </p>
        <template v-else>
          <label v-if="savedAddresses.length" class="client-order-detail__book-field">
            <span>{{ locale.startsWith("zh") ? "已保存地址" : "Saved address" }}</span>
            <select :disabled="bookVisitSubmitting" @change="applySavedAddress">
              <option value="">
                {{ locale.startsWith("zh") ? "手动填写" : "Enter manually" }}
              </option>
              <option v-for="item in savedAddresses" :key="item.id" :value="item.id">
                {{ item.address }}
              </option>
            </select>
          </label>
          <div class="client-order-detail__reschedule-grid">
            <label>
              <span>{{ locale.startsWith("zh") ? "名" : "First name" }}</span>
              <input v-model.trim="bookForm.firstName" :disabled="bookVisitSubmitting" />
            </label>
            <label>
              <span>{{ locale.startsWith("zh") ? "姓" : "Last name" }}</span>
              <input v-model.trim="bookForm.lastName" :disabled="bookVisitSubmitting" />
            </label>
          </div>
          <label class="client-order-detail__book-field">
            <span>{{ locale.startsWith("zh") ? "手机号" : "Phone" }}</span>
            <input v-model.trim="bookForm.phone" :disabled="bookVisitSubmitting" />
          </label>
          <label class="client-order-detail__book-field">
            <span>{{ locale.startsWith("zh") ? "服务地址" : "Service address" }}</span>
            <input v-model.trim="bookForm.serviceAddress" :disabled="bookVisitSubmitting" />
          </label>
          <div class="client-order-detail__reschedule-grid">
            <label>
              <span>{{ locale.startsWith("zh") ? "楼栋" : "Building" }}</span>
              <input v-model.trim="bookForm.building" :disabled="bookVisitSubmitting" />
            </label>
            <label>
              <span>{{ locale.startsWith("zh") ? "房号" : "Room" }}</span>
              <input v-model.trim="bookForm.roomNo" :disabled="bookVisitSubmitting" />
            </label>
          </div>
          <label class="client-order-detail__book-field">
            <span>{{ locale.startsWith("zh") ? "社区" : "Community" }}</span>
            <input v-model.trim="bookForm.community" :disabled="bookVisitSubmitting" />
          </label>
        </template>
        <label v-if="!lockedBookAddress" class="client-order-detail__book-field">
          <span>{{ locale.startsWith("zh") ? "备注" : "Notes" }}</span>
          <input v-model.trim="bookForm.remark" :disabled="bookVisitSubmitting" />
        </label>

        <div class="client-order-detail__reschedule-actions">
          <button
            class="client-order-detail__reschedule-cancel"
            type="button"
            :disabled="bookVisitSubmitting"
            @click="closeBookVisit"
          >
            {{ locale.startsWith("zh") ? "取消" : "Cancel" }}
          </button>
          <button
            class="client-order-detail__review-submit"
            type="button"
            :disabled="bookVisitSubmitting || bookTimeLoading"
            @click="submitBookVisit"
          >
            {{
              bookVisitSubmitting
                ? locale.startsWith("zh")
                  ? "提交中…"
                  : "Submitting…"
                : locale.startsWith("zh")
                  ? "确认预约"
                  : "Confirm visit"
            }}
          </button>
        </div>
      </section>
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
  fulfillPackageOrder,
  getAvailableSelectTime,
  getClientAddressList,
  getClientOrderDetail,
  getClientProfile,
  getOrderByOrderNo,
  getOrderList,
  getOrderRefundAmount,
  getRefundReasons,
  requestOrderRefund,
  rescheduleOrder,
  review,
  type ClientAddressRecord,
  type OrderListRecord,
  type OrderRefundCheckResult,
  type RefundReasonRecord,
} from "@/modules/client/api"
import { useCart } from "@/modules/client/composables/useCart"
import { normalizeRichTextHtml } from "@/modules/client/utils/richText"
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
const { t, locale } = useI18n({ useScope: "global" })
const { cartCount, refreshCart } = useCart()
const loading = ref(true)
const order = ref<OrderListRecord | null>(null)
const profileEmail = ref("")
const reviewDialogVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewRating = ref(0)
const reviewContent = ref("")
const reviewTags = ref<string[]>([])
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
const refundSummaryFallback = reactive({
  handlingFee: null as number | null,
  refundedAmount: null as number | null,
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
const isPackageOrder = computed(() => {
  const current = order.value
  if (!current) return false
  return (
    current.packageOrder === true ||
    Number(current.orderType) === 2 ||
    current.packageId != null
  )
})
const orderImage = computed(
  () =>
    (order.value?.imageUrls || []).find((url) => String(url || "").trim()) ||
    order.value?.spuImage ||
    "",
)
const serviceTitle = computed(() =>
  i18nText(
    isPackageOrder.value
      ? order.value?.packageNameI18n || order.value?.nameI18n
      : order.value?.spuNameI18n,
    isPackageOrder.value
      ? locale.value.startsWith("zh")
        ? "套餐"
        : "Package"
      : order.value?.spuName ||
        (locale.value.startsWith("zh") ? "家居服务" : "Home service"),
  ),
)
const serviceDescriptionHtml = computed(() =>
  normalizeRichTextHtml(
    i18nText(
      isPackageOrder.value
        ? order.value?.packageDescI18n || order.value?.descI18n
        : order.value?.descI18n,
    ),
  ),
)
const packageItemViews = computed(() =>
  (order.value?.packageItems || []).map((item, index) => ({
    id: String(item.skuId ?? item.spuId ?? index),
    name: i18nText(
      item.spuNameI18n,
      locale.value.startsWith("zh") ? "服务" : "Service",
    ),
    times: t("client.home.packages.itemTimes", {
      count: Number(item.redeemTimes) || 0,
    }),
  })),
)
const packageFulfillmentViews = computed(() =>
  (Array.isArray(order.value?.fulfillmentList)
    ? order.value.fulfillmentList
    : []
  ).map((item, index) => {
    const sequence = Math.max(1, Number(item.seqNo) || index + 1)
    const scheduleStatus = Number(item.scheduleStatus)
    const serviceStatus = Number(item.serviceStatus)
    const scheduleStatusText = i18nText(item.scheduleStatusI18n)
    const serviceStatusText = i18nText(item.serviceStatusI18n)
    const rawSchedule =
      String(item.serviceDateTime || "").trim() ||
      String(item.serviceTimeDisplay || "").trim() ||
      String(item.serviceDate || "").trim()
    const addressText = [
      item.serviceAddress,
      item.building,
      item.roomNo,
      item.community,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", ")
    const cancelled = scheduleStatus === 2
    const completed = !cancelled && serviceStatus === 2
    const inProgress = !cancelled && [1, 3, 4].includes(serviceStatus)
    const scheduled = !cancelled && scheduleStatus === 1
    const contactName = [item.firstName, item.lastName]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ")
    const contactText = [contactName, item.phone, item.email]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" · ")
    const serviceStatusFallback =
      serviceStatus === 2
        ? locale.value.startsWith("zh")
          ? "已完成"
          : "Completed"
        : serviceStatus === 1
          ? locale.value.startsWith("zh")
            ? "已到达"
            : "Arrived"
          : serviceStatus === 3
            ? locale.value.startsWith("zh")
              ? "已出发"
              : "On the way"
            : locale.value.startsWith("zh")
              ? "已接单"
              : "Accepted"
    const cancelDetail = cancelled
      ? [
          item.cancelTime
            ? formatCreatedAt(
                String(item.cancelTime),
                locale.value,
                String(item.cancelTime),
              )
            : "",
          String(item.cancelReason || "").trim(),
        ]
          .filter(Boolean)
          .join(" · ")
      : ""

    return {
      id: String(item.fulfillmentNo || `${item.skuId || "visit"}-${sequence}-${index}`),
      fulfillmentNo: String(item.fulfillmentNo || "").trim(),
      visitLabel: locale.value.startsWith("zh")
        ? `第 ${sequence} 次`
        : `Visit ${sequence}`,
      serviceName: i18nText(
        item.spuNameI18n,
        locale.value.startsWith("zh") ? "套餐服务" : "Package service",
      ),
      statusText: cancelled
        ? scheduleStatusText || (locale.value.startsWith("zh") ? "已取消" : "Cancelled")
        : completed || inProgress
          ? serviceStatusText || serviceStatusFallback
          : scheduled
            ? scheduleStatusText || (locale.value.startsWith("zh") ? "已预约" : "Scheduled")
            : scheduleStatusText ||
              (locale.value.startsWith("zh") ? "待预约" : "Not scheduled"),
      statusTone: cancelled
        ? "cancelled"
        : completed
          ? "completed"
          : inProgress
            ? "progress"
            : scheduled
              ? "scheduled"
              : "pending",
      scheduleText: rawSchedule
        ? formatServiceSchedule(
            rawSchedule,
            locale.value,
            locale.value.startsWith("zh") ? "暂未预约时间" : "Not scheduled yet",
          )
        : locale.value.startsWith("zh")
          ? "暂未预约时间"
          : "Not scheduled yet",
      addressText:
        addressText ||
        (locale.value.startsWith("zh") ? "暂未填写服务地址" : "Service address not provided"),
      contactText,
      supplierName: String(item.supplierName || "").trim(),
      remark: String(item.remark || "").trim(),
      cancelDetail,
    }
  }),
)
const packageVisitRemaining = (item: NonNullable<OrderListRecord["packageItems"]>[number]) => {
  const remaining = Number(item.remainingTimes)
  if (Number.isFinite(remaining)) return remaining
  const redeem = Number(item.redeemTimes)
  const occupied = Number(item.occupiedTimes)
  if (Number.isFinite(redeem) && Number.isFinite(occupied)) return Math.max(0, redeem - occupied)
  return Number.isFinite(redeem) ? redeem : 0
}
const packageExpired = computed(() => {
  const raw = String(order.value?.validUntil || "").trim()
  if (!raw) return false
  const end = new Date(`${raw.slice(0, 10)}T23:59:59`)
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now()
})
const packageBookableServices = computed(() =>
  (order.value?.packageItems || [])
    .map((item) => {
      const skuId = Number(item.skuId)
      const spec = (item.specI18n || [])
        .map((row) => i18nText(row.specValueNameI18n))
        .filter(Boolean)
        .join(" / ")
      const name = i18nText(
        item.spuNameI18n,
        locale.value.startsWith("zh") ? "套餐服务" : "Package service",
      )
      return {
        skuId: String(skuId),
        spuId: String(item.spuId || ""),
        name: spec ? `${name} · ${spec}` : name,
        remaining: packageVisitRemaining(item),
      }
    })
    .filter((item) => Number(item.skuId) > 0 && item.remaining > 0),
)
const canBookPackageVisit = computed(
  () =>
    isPackageOrder.value &&
    rawStatus.value === 1 &&
    !packageExpired.value &&
    packageBookableServices.value.length > 0,
)
const packageRemainingText = computed(() => {
  const remaining = Number(order.value?.remainingTimes)
  const total = Number(order.value?.redeemTimes)
  if (Number.isFinite(remaining) && Number.isFinite(total)) {
    return t("client.home.packages.remaining", { remaining, total })
  }
  return t("client.home.packages.visitLater")
})
const packageValidText = computed(() => {
  const value = String(order.value?.validUntil || "").trim()
  return value
    ? t("client.home.packages.validUntil", { date: value.slice(0, 10) })
    : ""
})
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
const orderTotal = computed(() => Math.max(0, Number(order.value?.orderAmount) || 0))
const orderSubtotal = computed(() => orderTotal.value / 1.05)
const orderTax = computed(() => orderTotal.value - orderSubtotal.value)
const nullableAmount = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") return null
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.max(0, amount) : null
}
const showRefundBreakdown = computed(() => rawStatus.value === 5)
const refundHandlingFeeAmount = computed(() =>
  nullableAmount(order.value?.refundHandlingFee)
    ?? refundSummaryFallback.handlingFee
    ?? 0,
)
const refundedAmount = computed(() =>
  nullableAmount(order.value?.refundedAmount)
    ?? refundSummaryFallback.refundedAmount
    ?? Math.max(0, orderTotal.value - refundHandlingFeeAmount.value),
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
  if (rawStatus.value === 1) {
    if (isPackageOrder.value) {
      return canBookPackageVisit.value
        ? [
            {
              key: "book-visit",
              label: locale.value.startsWith("zh") ? "预约上门" : "Book a visit",
              tone: "primary",
            },
          ]
        : []
    }
    return [
      {
        key: "manage-booking",
        label: locale.value.startsWith("zh") ? "管理预订" : "Manage Booking",
        tone: "primary",
      },
    ]
  }
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
const visibleActions = computed(() =>
  actions.value.filter((action) => {
    if (!isPackageOrder.value) return true
    if (action.key === "rebook" && props.mobile) return false
    return true
  }),
)

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
const reviewRatingLabel = computed(() => {
  const labels = locale.value.startsWith("zh")
    ? ["", "较差", "一般", "满意", "很好", "非常满意"]
    : ["", "Poor", "Fair", "Good", "Very good", "Excellent"]
  return labels[Math.round(reviewRating.value)] || ""
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
  const index = reviewTags.value.indexOf(tag)
  if (index >= 0) reviewTags.value.splice(index, 1)
  else reviewTags.value.push(tag)
}
const openFeedback = () => {
  reviewRating.value = 0
  reviewContent.value = ""
  reviewTags.value = []
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
  const note = reviewContent.value.trim()
  const content = [reviewTags.value.join(", "), note]
    .filter(Boolean)
    .join(" — ")
  if (!content) {
    reviewError.value = locale.value.startsWith("zh")
      ? "请选择评价标签或填写评价内容。"
      : "Please select a feedback tag or write a short review."
    return
  }
  reviewSubmitting.value = true
  reviewError.value = ""
  try {
    await review({
      orderNo: order.value.orderNo,
      rating: Math.round(reviewRating.value),
      content,
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
const loadOrderRecord = async (orderNo: string): Promise<OrderListRecord | null> => {
  if (!orderNo) return null
  try {
    const detail = await getClientOrderDetail(orderNo)
    if (detail) return detail
  } catch (error) {
    console.warn("load order detail failed, falling back to order list:", error)
  }
  const results = await Promise.allSettled([
    getOrderList({ tab: "ACTIVE", keyWord: orderNo }),
    getOrderList({ tab: "HISTORY", keyWord: orderNo }),
  ])
  const records = results.flatMap((result) =>
    result.status === "fulfilled" && Array.isArray(result.value)
      ? result.value
      : [],
  )
  const matched = records.find(
    (item) => String(item.orderNo || "").trim() === orderNo,
  )
  if (matched) return matched
  try {
    return (await getOrderByOrderNo(orderNo)) || records[0] || null
  } catch (error) {
    console.warn("load order detail fallback failed:", error)
    return records[0] || null
  }
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
    order.value = await loadOrderRecord(orderNo)
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
  order.value = await loadOrderRecord(orderNo)
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
    if (check.canRefund) {
      const refundAmount = await getOrderRefundAmount(orderNo)
      if (!refundAmount) throw new Error(
        locale.value.startsWith("zh") ? "无法获取退款金额" : "Unable to load refund amount",
      )
      cancelForm.amountText = formatAed(refundAmount.refundAmount)
      cancelForm.handlingFeeText = formatAed(refundAmount.handlingFee)
    } else {
      cancelForm.amountText = ""
      cancelForm.handlingFeeText = ""
    }
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

const bookVisitVisible = ref(false)
const bookVisitSubmitting = ref(false)
const bookTimeLoading = ref(false)
const bookTimeOptions = ref<
  Array<{ time: string; timeRange: number; available: boolean }>
>([])
const savedAddresses = ref<ClientAddressRecord[]>([])
const lastBookTimeKey = ref("")
const bookForm = reactive({
  skuId: "",
  serviceDate: "",
  timeRange: null as number | null,
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  serviceAddress: "",
  building: "",
  roomNo: "",
  community: "",
  remark: "",
})
const selectedBookService = computed(
  () =>
    packageBookableServices.value.find((item) => item.skuId === bookForm.skuId) ||
    null,
)
const lockedBookSource = computed(() => {
  const skuId = bookForm.skuId
  if (!skuId) return null
  const rows = (order.value?.fulfillmentList || []).filter(
    (item) =>
      String(item.skuId || "") === skuId &&
      String(item.serviceAddress || "").trim(),
  )
  return rows.find((item) => Number(item.scheduleStatus) !== 2) || rows[0] || null
})
const lockedBookAddress = computed(() => {
  const item = lockedBookSource.value
  if (!item) return ""
  return [item.serviceAddress, item.building, item.roomNo, item.community]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" · ")
})
const bookTimePlaceholder = computed(() => {
  if (!bookForm.serviceDate)
    return locale.value.startsWith("zh")
      ? "请先选择日期"
      : "Please select a date first"
  if (bookTimeLoading.value)
    return locale.value.startsWith("zh") ? "时间加载中…" : "Loading times…"
  if (!bookTimeOptions.value.length)
    return locale.value.startsWith("zh") ? "暂无可选时间" : "No available times"
  return locale.value.startsWith("zh") ? "请选择时段" : "Select a time slot"
})
const clearBookContact = () => {
  bookForm.firstName = ""
  bookForm.lastName = ""
  bookForm.phone = ""
  bookForm.email = ""
  bookForm.serviceAddress = ""
  bookForm.building = ""
  bookForm.roomNo = ""
  bookForm.community = ""
  bookForm.remark = ""
}
const applyLockedBookContact = () => {
  const item = lockedBookSource.value
  if (!item) return
  bookForm.firstName = String(item.firstName || "").trim()
  bookForm.lastName = String(item.lastName || "").trim()
  bookForm.phone = String(item.phone || "").trim()
  bookForm.email = String(item.email || "").trim()
  bookForm.serviceAddress = String(item.serviceAddress || "").trim()
  bookForm.building = String(item.building || "").trim()
  bookForm.roomNo = String(item.roomNo || "").trim()
  bookForm.community = String(item.community || "").trim()
}
const fetchBookAvailableTimes = async () => {
  const serviceTime = bookForm.serviceDate.trim()
  const spuId = String(selectedBookService.value?.spuId || "").trim()
  if (!serviceTime || !spuId) return
  const cacheKey = `${spuId}:${serviceTime}`
  if (cacheKey === lastBookTimeKey.value && bookTimeOptions.value.length) return
  bookTimeLoading.value = true
  try {
    const payload = await getAvailableSelectTime({
      spuId: Number.isFinite(Number(spuId)) ? Number(spuId) : spuId,
      serviceTime,
    })
    const rows = Array.isArray(payload) ? (payload as AvailableTimeRecord[]) : []
    bookTimeOptions.value = rows
      .map((item) => {
        const time = String(item.time || "").trim()
        const timeRange = Number(item.timeRange)
        if (!time || !Number.isFinite(timeRange)) return null
        return {
          time,
          timeRange,
          available: Boolean(item.avaiable ?? item.available ?? false),
        }
      })
      .filter(
        (
          item,
        ): item is { time: string; timeRange: number; available: boolean } =>
          Boolean(item),
      )
    lastBookTimeKey.value = cacheKey
  } catch (error) {
    console.error("load package visit times failed:", error)
    bookTimeOptions.value = []
    lastBookTimeKey.value = ""
  } finally {
    bookTimeLoading.value = false
  }
}
const handleBookServiceChange = () => {
  bookForm.timeRange = null
  bookTimeOptions.value = []
  lastBookTimeKey.value = ""
  clearBookContact()
  applyLockedBookContact()
  void fetchBookAvailableTimes()
}
const handleBookDateChange = () => {
  bookForm.timeRange = null
  bookTimeOptions.value = []
  lastBookTimeKey.value = ""
  void fetchBookAvailableTimes()
}
const applySavedAddress = (event: Event) => {
  const id = Number((event.target as HTMLSelectElement | null)?.value)
  const item = savedAddresses.value.find((row) => row.id === id)
  if (!item) {
    clearBookContact()
    return
  }
  const nameParts = String(item.fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  bookForm.firstName = nameParts[0] || ""
  bookForm.lastName = nameParts.slice(1).join(" ")
  const phone = String(item.phone || "").trim()
  const country = String(item.phoneCountryCode || "").trim()
  bookForm.phone = phone.startsWith("+") || !country ? phone : `${country}${phone}`
  bookForm.email = String(item.email || "").trim()
  bookForm.serviceAddress = String(item.address || "").trim()
  bookForm.building = String(item.building || "").trim()
  bookForm.roomNo = String(item.roomNo || "").trim()
  bookForm.community = String(item.community || "").trim()
  bookForm.remark = String(item.additionalNotes || "").trim()
}
const openBookVisit = async () => {
  if (!canBookPackageVisit.value) return
  bookForm.skuId = packageBookableServices.value[0]?.skuId || ""
  bookForm.serviceDate = ""
  bookForm.timeRange = null
  bookTimeOptions.value = []
  lastBookTimeKey.value = ""
  clearBookContact()
  applyLockedBookContact()
  bookVisitVisible.value = true
  if (!lockedBookSource.value && !savedAddresses.value.length) {
    try {
      savedAddresses.value = await getClientAddressList()
    } catch (error) {
      console.warn("load saved addresses failed:", error)
      savedAddresses.value = []
    }
  }
}
const closeBookVisit = () => {
  if (!bookVisitSubmitting.value) bookVisitVisible.value = false
}
const submitBookVisit = async () => {
  if (bookVisitSubmitting.value) return
  const skuId = Number(bookForm.skuId)
  if (!skuId) {
    ElMessage.warning(
      locale.value.startsWith("zh") ? "请选择服务" : "Select a service",
    )
    return
  }
  if (!bookForm.serviceDate) {
    ElMessage.warning(
      locale.value.startsWith("zh") ? "请选择上门日期" : "Select a visit date",
    )
    return
  }
  if (!bookForm.timeRange) {
    ElMessage.warning(
      locale.value.startsWith("zh") ? "请选择上门时段" : "Select a time slot",
    )
    return
  }
  const selectedSlot = bookTimeOptions.value.find(
    (slot) => slot.timeRange === bookForm.timeRange,
  )
  if (selectedSlot && !selectedSlot.available) {
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "这个时段已经约满"
        : "This time slot is unavailable",
    )
    return
  }
  const locked = lockedBookSource.value
  if (
    !locked &&
    (!bookForm.firstName || !bookForm.phone || !bookForm.serviceAddress)
  ) {
    ElMessage.warning(
      locale.value.startsWith("zh")
        ? "请填写姓名、手机号和上门地址"
        : "Enter the name, phone and visit address",
    )
    return
  }
  const orderNo = String(order.value?.orderNo || route.params.orderNo || "").trim()
  if (!orderNo) return
  bookVisitSubmitting.value = true
  try {
    const fulfillmentNo = await fulfillPackageOrder({
      orderNo,
      skuId,
      serviceDate: bookForm.serviceDate,
      timeRange: bookForm.timeRange,
      firstName: locked
        ? String(locked.firstName || "").trim()
        : bookForm.firstName,
      lastName: locked
        ? String(locked.lastName || "").trim()
        : bookForm.lastName,
      phone: locked ? String(locked.phone || "").trim() : bookForm.phone,
      email: locked ? String(locked.email || "").trim() : bookForm.email,
      serviceAddress: locked
        ? String(locked.serviceAddress || "").trim()
        : bookForm.serviceAddress,
      building: locked ? String(locked.building || "").trim() : bookForm.building,
      roomNo: locked ? String(locked.roomNo || "").trim() : bookForm.roomNo,
      community: locked
        ? String(locked.community || "").trim()
        : bookForm.community,
      remark: locked ? String(locked.remark || "").trim() : bookForm.remark,
    })
    ElMessage.success(
      locale.value.startsWith("zh")
        ? `已预约上门${fulfillmentNo ? `：${fulfillmentNo}` : ""}`
        : `Visit booked${fulfillmentNo ? `: ${fulfillmentNo}` : ""}`,
    )
    bookVisitVisible.value = false
    await reloadCurrentOrder()
  } catch (error: any) {
    ElMessage.error(
      error?.message ||
        (locale.value.startsWith("zh")
          ? "预约失败，请稍后重试"
          : "Unable to book this visit. Please try again."),
    )
  } finally {
    bookVisitSubmitting.value = false
  }
}

const runAction = (action: string) => {
  if (action === "review") {
    openFeedback()
    return
  }
  if (action === "rebook" && order.value?.packageId && !props.mobile) {
    void router.push({
      name: "package-detail",
      params: { id: String(order.value.packageId) },
    })
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
  if (action === "book-visit") {
    openBookVisit()
  }
}

onMounted(async () => {
  try {
    const orderNo = String(route.params.orderNo || "").trim()
    order.value = await loadOrderRecord(orderNo)
    if (
      order.value
      && rawStatus.value === 5
      && (
        nullableAmount(order.value.refundHandlingFee) === null
        || nullableAmount(order.value.refundedAmount) === null
      )
    ) {
      try {
        const summary = await getOrderRefundAmount(order.value.orderNo || orderNo)
        refundSummaryFallback.handlingFee = nullableAmount(summary?.handlingFee)
        refundSummaryFallback.refundedAmount = nullableAmount(summary?.refundAmount)
      } catch (error) {
        console.warn("load refunded order amount fallback failed:", error)
      }
    }
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
    if (
      order.value &&
      String(route.query.book || "") === "1" &&
      canBookPackageVisit.value
    ) {
      void openBookVisit()
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
.client-order-detail__section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.client-order-detail__book-visit {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: #1769c2;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.client-order-detail__book-visit:disabled {
  cursor: default;
  opacity: 0.6;
}
.client-order-detail__book-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.client-order-detail__book-field span {
  color: #334155;
  font-size: 12px;
  font-weight: 750;
}
.client-order-detail__book-field select,
.client-order-detail__book-field input,
.client-order-detail__reschedule-grid input {
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
.client-order-detail__book-field select:focus,
.client-order-detail__book-field input:focus,
.client-order-detail__reschedule-grid input:focus {
  border-color: #1769c2;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.1);
}
.client-order-detail__book-lock {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f4f7fb;
  color: #526176;
  font-size: 13px;
  line-height: 1.5;
}
.client-order-detail__book-lock b {
  display: block;
  margin-bottom: 4px;
  color: #05152b;
}
.client-order-detail__service {
  grid-column: 1 / -1;
}
.client-order-detail__fulfillments {
  grid-column: 1 / -1;
}
.client-order-detail__fulfillment-list {
  padding-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.client-order-detail__fulfillment-empty {
  margin: 0;
  padding: 20px 0 2px;
  color: #7b8797;
  font-size: 13px;
}
.client-order-detail__fulfillment-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid #e4eaf1;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #fbfcfe);
}
.client-order-detail__fulfillment-card > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.client-order-detail__fulfillment-identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.client-order-detail__fulfillment-identity > span {
  min-width: 48px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fbf1df;
  color: #9a6510;
  font-size: 10px;
  font-weight: 900;
  white-space: nowrap;
}
.client-order-detail__fulfillment-identity div {
  min-width: 0;
}
.client-order-detail__fulfillment-identity h3 {
  margin: 0;
  color: #17263b;
  font-size: 14px;
  line-height: 1.35;
}
.client-order-detail__fulfillment-identity small {
  display: block;
  margin-top: 3px;
  color: #9aa6b5;
  font-size: 10px;
  overflow-wrap: anywhere;
}
.client-order-detail__fulfillment-status {
  min-height: 23px;
  padding: 3px 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: #eaf3fd;
  color: #1769c2;
  font-size: 10px;
  font-weight: 900;
  white-space: nowrap;
}
.client-order-detail__fulfillment-status.is-progress {
  background: #fff4d6;
  color: #a85b00;
}
.client-order-detail__fulfillment-status.is-completed {
  background: #e8f8ef;
  color: #128340;
}
.client-order-detail__fulfillment-status.is-cancelled {
  background: #f1f4f7;
  color: #758293;
}
.client-order-detail__fulfillment-status.is-pending {
  background: #f3f4f6;
  color: #667085;
}
.client-order-detail__fulfillment-facts {
  margin-top: 14px;
  display: grid;
  gap: 9px;
}
.client-order-detail__fulfillment-facts > div {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 9px;
}
.client-order-detail__fulfillment-facts > div > span {
  width: 25px;
  height: 25px;
  flex: 0 0 auto;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #edf5ff;
  color: #1769c2;
  font-size: 11px;
}
.client-order-detail__fulfillment-facts p {
  min-width: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.client-order-detail__fulfillment-facts small {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
}
.client-order-detail__fulfillment-facts strong {
  color: #334155;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.client-order-detail__fulfillment-note {
  margin: 12px 0 0;
  padding: 9px 10px;
  border-radius: 9px;
  background: #f7f9fb;
  color: #64748b;
  font-size: 11px;
  line-height: 1.45;
}
.client-order-detail__fulfillment-note b {
  margin-right: 6px;
  color: #475569;
}
.client-order-detail__fulfillment-note.is-cancelled {
  background: #f5f6f8;
  color: #6b7280;
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
.client-order-detail__info-list .is-total.has-refund-breakdown {
  border-bottom: 1px solid #f0f3f6;
}
.client-order-detail__info-list .is-total dt,
.client-order-detail__info-list .is-total dd {
  color: #05152b;
  font-size: 16px;
  font-weight: 900;
}
.client-order-detail__info-list .is-refund-deduction dd {
  color: #a65b00;
  font-weight: 800;
}
.client-order-detail__info-list .is-refund-amount {
  border-bottom: 0;
}
.client-order-detail__info-list .is-refund-amount dt,
.client-order-detail__info-list .is-refund-amount dd {
  color: #087a51;
  font-size: 15px;
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
  margin: 5px 0 0;
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
.client-order-detail__review-field-label {
  display: block;
  margin-top: 15px;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
}
.client-order-detail__review-rating-label {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
  text-align: center;
}
.client-order-detail__review-tag-field {
  text-align: left;
}
.client-order-detail__review-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}
.client-order-detail__review-tags button {
  min-height: 30px;
  padding: 5px 10px;
  border: 1px solid #d7e0ea;
  border-radius: 999px;
  background: #fff;
  color: #526176;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.client-order-detail__review-tags button.is-selected {
  border-color: #1769c2;
  background: #eaf3fd;
  color: #1769c2;
  font-weight: 800;
}
.client-order-detail__review-dialog textarea {
  margin-top: 8px;
  width: 100%;
  min-height: 112px;
  padding: 13px;
  border: 1px solid #d7e0ea;
  border-radius: 12px;
  box-sizing: border-box;
  resize: vertical;
  font: inherit;
}
.client-order-detail__review-counter {
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
  .client-order-detail__fulfillments {
    grid-column: auto;
  }
  .client-order-detail__fulfillment-list {
    grid-template-columns: 1fr;
  }
  .client-order-detail__fulfillment-card {
    padding: 13px;
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
