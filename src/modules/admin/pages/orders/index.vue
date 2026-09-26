<template>
  <div class="page" :class="{ 'page--h5': isOrdersH5 }">
    <section v-if="isOrdersH5" class="orders-h5">
      <header class="orders-h5__bar">
        <div class="orders-h5__search">
          <el-input
            v-model.trim="query.orderNo"
            :placeholder="t('admin.orders.filters.orderNo')"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <button type="button" class="orders-h5__filter" @click="handleSearch">
            {{ t("admin.orders.actions.search") }}
          </button>
        </div>
        <p class="orders-h5__count">{{ total }}</p>
      </header>

      <p v-if="!tableLoading && !orders.length" class="orders-h5__empty">
        {{ t("admin.orders.empty") }}
      </p>
      <div v-else class="orders-h5__list" v-loading="tableLoading">
        <div
          v-for="row in orders"
          :key="row.id"
          class="orders-h5__row"
          :class="orderRowClassName({ row })"
          role="button"
          tabindex="0"
          @click="openOrderDetail(row)"
          @keydown.enter="openOrderDetail(row)"
        >
          <span class="orders-h5__rail" aria-hidden="true"></span>
          <span class="orders-h5__main">
            <span class="orders-h5__top">
              <span class="orders-h5__no">{{ row.orderNo || "-" }}</span>
              <span class="orders-h5__amount">{{ row.amountText || "-" }}</span>
            </span>
            <span class="orders-h5__service">{{ row.productName || "-" }}</span>
            <span class="orders-h5__sub">
              {{ row.customerName || "-" }}
              <span aria-hidden="true">·</span>
              {{ row.serviceTime || "-" }}
            </span>
            <span class="orders-h5__pills">
              <span class="orders-h5__pill">{{ orderStatusLabel(row.orderStatusCode) }}</span>
              <span class="orders-h5__pill orders-h5__pill--quiet">{{ row.paymentStatusText }}</span>
              <span v-if="hasUnreadReschedule(row)" class="orders-h5__pill orders-h5__pill--alert">
                {{ t("admin.orders.table.rescheduledUnread") }}
              </span>
            </span>
          </span>
          <span class="orders-h5__chevron" aria-hidden="true">›</span>
        </div>
      </div>

      <footer class="orders-h5__pager">
        <button type="button" :disabled="query.pageNum <= 1" @click="onPageChange(query.pageNum - 1)">
          {{ t("admin.orders.actions.prev") }}
        </button>
        <span>{{ query.pageNum }} / {{ h5PageCount }}</span>
        <button type="button" :disabled="query.pageNum >= h5PageCount" @click="onPageChange(query.pageNum + 1)">
          {{ t("admin.orders.actions.next") }}
        </button>
      </footer>
    </section>

    <el-card v-else>
      <div class="toolbar">
        <div class="toolbar-row">
          <el-input
            v-model.trim="query.orderNo"
            :placeholder="t('admin.orders.filters.orderNo')"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model.trim="query.customerName"
            :placeholder="t('admin.orders.filters.customerName')"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model.trim="query.contactPhone"
            :placeholder="t('admin.orders.filters.contactPhone')"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="query.productIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('admin.orders.filters.productName')"
            clearable
          >
            <el-option
              v-for="item in serviceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="toolbar-time">
            <span class="toolbar-time__label">
              {{ t("admin.orders.table.serviceTime") }}
            </span>
            <el-date-picker
              v-model="query.serviceTimeRange"
              type="daterange"
              unlink-panels
              value-format="YYYY-MM-DD"
              :range-separator="t('admin.orders.filters.rangeSeparator')"
              :start-placeholder="t('admin.orders.filters.serviceTimeStart')"
              :end-placeholder="t('admin.orders.filters.serviceTimeEnd')"
              clearable
            />
          </div>
        </div>
        <div class="toolbar-row">
          <el-select
            v-model="query.orderStatuses"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('admin.orders.filters.orderStatus')"
            clearable
          >
            <el-option
              v-for="item in orderStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="query.paymentStatuses"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('admin.orders.filters.paymentStatus')"
            clearable
          >
            <el-option
              v-for="item in paymentStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="query.rescheduleFilter"
            :placeholder="t('admin.orders.filters.rescheduled')"
          >
            <el-option
              :label="t('admin.orders.filters.rescheduledAll')"
              value="ALL"
            />
            <el-option
              :label="t('admin.orders.filters.rescheduledUnprocessed')"
              value="UNPROCESSED"
            />
            <el-option
              :label="t('admin.orders.filters.rescheduledProcessed')"
              value="PROCESSED"
            />
            <el-option
              :label="t('admin.orders.filters.rescheduledYes')"
              value="RESCHEDULED"
            />
            <el-option
              :label="t('admin.orders.filters.rescheduledNo')"
              value="NOT_RESCHEDULED"
            />
          </el-select>
          <el-select
            v-model="query.serviceTimeSort"
            :placeholder="t('admin.orders.filters.serviceTimeSort')"
            clearable
            @change="handleSearch"
          >
            <el-option
              :label="t('admin.orders.filters.serviceTimeEarliest')"
              value="SERVICE_TIME_ASC"
            />
            <el-option
              :label="t('admin.orders.filters.serviceTimeLatest')"
              value="SERVICE_TIME_DESC"
            />
          </el-select>
          <el-button type="primary" @click="handleSearch">
            {{ t("admin.orders.actions.search") }}
          </el-button>
          <el-button @click="reset">
            {{ t("admin.orders.actions.reset") }}
          </el-button>
          <el-dropdown :disabled="exportLoading" @command="handleExportCommand">
            <el-button :loading="exportLoading">
              {{ t("admin.orders.actions.export") }}
              <span class="export-caret">⌄</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="current">
                  {{ t("admin.orders.export.currentPage") }}
                </el-dropdown-item>
                <el-dropdown-item command="all">
                  {{ t("admin.orders.export.allOrders") }}
                </el-dropdown-item>
                <el-dropdown-item command="date">
                  {{ t("admin.orders.export.byDate") }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div
        class="order-status-legend"
        role="group"
        :aria-label="t('admin.orders.statusColourKey')"
      >
        <strong>{{ t("admin.orders.statusColourKey") }}</strong>
        <span
          v-for="item in orderStatusLegend"
          :key="item.value"
          class="order-status-legend__item"
          :class="`order-status--${orderStatusTone(item.value)}`"
        >
          {{ item.label }}
        </span>
      </div>

      <el-table
        class="orders-table"
        :data="orders"
        border
        v-loading="tableLoading"
        row-key="id"
        :row-class-name="orderRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="36" />
        <el-table-column
          prop="orderNo"
          :label="t('admin.orders.table.orderNo')"
          width="122"
        >
          <template #default="{ row }">
            <el-tooltip
              v-if="row.orderNo"
              :content="row.orderNo"
              placement="top"
              :show-after="250"
            >
              <el-button
                class="order-number-link"
                link
                type="primary"
                @click="openOrderDetail(row)"
              >
                {{ row.orderNo }}
              </el-button>
            </el-tooltip>
            <el-tag
              v-if="hasUnreadReschedule(row)"
              class="order-reschedule-alert"
              type="danger"
              size="small"
            >
              {{ t("admin.orders.table.rescheduledUnread") }}
            </el-tag>
            <span v-if="!row.orderNo">-</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('admin.orders.table.createdAt')"
          width="110"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          :label="t('admin.orders.table.customerContact')"
          width="105"
        >
          <template #default="{ row }">
            <div class="table-stack">
              <el-tooltip :content="row.customerName || '-'" placement="top" :show-after="250">
                <strong class="table-stack__ellipsis">{{ row.customerName || "-" }}</strong>
              </el-tooltip>
              <el-tooltip
                :content="row.contactPhone || row.userPhone || '-'"
                placement="top"
                :show-after="250"
              >
                <span class="table-stack__ellipsis">{{ row.contactPhone || row.userPhone || "-" }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('admin.orders.table.serviceDetails')"
          min-width="135"
        >
          <template #default="{ row }">
            <div class="table-stack">
              <el-tooltip :content="row.productName || '-'" placement="top" :show-after="250">
                <strong class="table-stack__ellipsis">{{ row.productName || "-" }}</strong>
              </el-tooltip>
              <el-tooltip :content="row.specDescText || '-'" placement="top" :show-after="250">
                <span class="table-stack__ellipsis">{{ row.specDescText || "-" }}</span>
              </el-tooltip>
              <el-tooltip
                v-if="row.specRemarkText && row.specRemarkText !== '-'"
                :content="row.specRemarkText"
                placement="top"
                :show-after="250"
              >
                <small class="table-stack__ellipsis spec-remark-text">
                  {{ t("admin.orders.table.specRemark") }}: {{ row.specRemarkText }}
                </small>
              </el-tooltip>
              <el-tooltip
                v-if="row.attachDetailsText && row.attachDetailsText !== '-'"
                :content="row.attachDetailsText"
                placement="top"
                :show-after="250"
              >
                <small class="table-stack__ellipsis">{{ row.attachDetailsText }}</small>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="serviceTime"
          :label="t('admin.orders.table.scheduledTime')"
          width="125"
        >
          <template #default="{ row }">
            <div class="table-stack">
              <el-tooltip :content="row.serviceTime || '-'" placement="top" :show-after="250">
                <strong class="table-stack__ellipsis">{{ row.serviceTime || "-" }}</strong>
              </el-tooltip>
              <span
                v-if="formatServiceDayLabel(row.serviceTime)"
                class="service-day-label"
                :class="`service-day-label--${serviceDayKind(row.serviceTime)}`"
              >
                {{ formatServiceDayLabel(row.serviceTime) }}
              </span>
              <el-tooltip :content="formatServiceAddress(row)" placement="top" :show-after="250">
                <span class="table-stack__ellipsis">{{ formatServiceAddress(row) }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('admin.orders.table.rescheduleChanges')"
          width="78"
        >
          <template #default="{ row }">
            <div v-if="row.rescheduleChanges.length" class="reschedule-compact">
              <span>{{ row.rescheduleChanges.length }}</span>
              <el-button link type="primary" size="small" @click="openRescheduleHistory(row)">
                {{ t('admin.orders.actions.viewReschedule') }}
              </el-button>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="amountText"
          :label="t('admin.orders.table.amount')"
          width="80"
          show-overflow-tooltip
        />
        <el-table-column
          :label="t('admin.orders.table.paymentStatus')"
          width="86"
        >
          <template #default="{ row }">
            <el-tag :type="paymentStatusTag(row.paymentStatusCode)">
              {{ row.paymentStatusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('admin.orders.table.orderStatus')"
          width="112"
        >
          <template #default="{ row }">
            <el-select
              class="order-status-select"
              :class="`order-status-select--${orderStatusTone(row.orderStatusCode)}`"
              :model-value="row.orderStatusCode"
              :disabled="!row.orderId || updatingStatusOrderId !== null"
              :loading="updatingStatusOrderId === row.id"
              @change="(value: number) => handleOrderStatusChange(row, value)"
            >
              <el-option
                v-for="item in orderStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column
          prop="supplierName"
          :label="t('admin.orders.table.supplierName')"
          min-width="160"
        >
          <template #default="{ row }">
            <div class="supplier-cell">
              <el-button
                link
                :type="
                  !isSupplierReadOnly(row) && hasAssignedSupplier(row)
                    ? 'success'
                    : 'primary'
                "
                size="small"
                :disabled="!row.orderId"
                @click="openAssignDialog(row)"
              >
                {{ t(supplierActionKey(row)) }}
              </el-button>
              <el-tooltip :content="row.supplierName || '-'" placement="top" :show-after="250">
                <span>{{ row.supplierName || '-' }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('admin.orders.table.actions')"
          width="86"
        >
          <template #default="{ row }">
            <div class="order-table-actions">
              <el-badge
                :is-dot="hasOrderRemark(row)"
                type="warning"
                class="order-remark-badge"
              >
                <el-button
                  link
                  :type="hasOrderRemark(row) ? 'warning' : 'primary'"
                  size="small"
                  :title="
                    hasOrderRemark(row)
                      ? t('admin.orders.actions.remarkAdded')
                      : t('admin.orders.actions.remark')
                  "
                  :disabled="!row.orderId"
                  @click="openRemarkDialog(row)"
                >
                  {{ t("admin.orders.actions.remark") }}
                </el-button>
              </el-badge>
              <el-button
                link
                type="primary"
                size="small"
                :disabled="!row.orderNo"
                @click="openOrderDetail(row)"
              >
                {{ t("admin.orders.actions.details") }}
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                :loading="copyingOrderId === row.id"
                @click="copySupplierInfo(row)"
              >
                {{ t("admin.orders.actions.copySupplier") }}
              </el-button>
              <el-button
                v-if="isStripeRefundAllowed(row)"
                link
                type="danger"
                size="small"
                :loading="refundingOrderId === row.orderId"
                @click="handleStripeRefund(row)"
              >
                {{ t("admin.orders.actions.stripeRefund") }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedRows.length" class="bulk-bar">
        <span class="bulk-bar__count">
          {{ t("admin.orders.bulk.selected", { count: selectedRows.length }) }}
        </span>
        <span class="bulk-bar__label">
          {{ t("admin.orders.bulk.label") }}
        </span>
        <div class="bulk-bar__actions">
          <el-button type="primary" plain @click="openBulkAssignDialog">
            {{ t("admin.orders.actions.bulkAssignSupplier") }}
          </el-button>
          <el-button
            type="success"
            plain
            :loading="bulkCompleting"
            @click="handleBulkMarkCompleted"
          >
            {{ t("admin.orders.actions.markCompleted") }}
          </el-button>
          <el-button :loading="exportLoading" @click="handleExportSelected">
            {{ t("admin.orders.actions.exportSelected") }}
          </el-button>
        </div>
      </div>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          layout="prev, pager, next, jumper, ->, total, sizes"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-drawer
      v-model="detailDrawerVisible"
      :class="{ 'orders-h5-detail': isOrdersH5 }"
      :title="t('admin.orders.dialog.detailTitle')"
      :with-header="!isOrdersH5"
      direction="rtl"
      :z-index="isOrdersH5 ? 2100 : undefined"
      :size="isOrdersH5 ? '100%' : 'min(980px, 100%)'"
      @closed="closeOrderDetail"
    >
      <button
        v-if="isOrdersH5"
        type="button"
        class="h5-nav"
        @click="detailDrawerVisible = false"
      >
        <span aria-hidden="true">‹</span>
        {{ t("admin.orders.actions.back") }}
      </button>
      <el-skeleton v-if="detailLoading" :rows="12" animated />
      <div v-else-if="detailRow" class="order-detail">
        <header class="order-detail__hero">
          <div>
            <div class="order-detail__eyebrow">
              {{ t("admin.orders.detail.orderId") }}
            </div>
            <h2 class="order-detail__title">
              #{{ displayValue(detailRow.orderNo) }}
            </h2>
            <p class="order-detail__booked-at">
              {{ t("admin.orders.detail.bookedAt") }}:
              {{ formatDateTime(detailRow.createdAt) }}
            </p>
          </div>
          <div class="order-detail__amount">
            <span>{{ t("admin.orders.detail.totalAmount") }}</span>
            <strong>{{ displayValue(detailRow.amountText) }}</strong>
          </div>
        </header>

        <div class="order-detail__toolbar">
          <el-button type="primary" @click="openDetailEdit">
            <span aria-hidden="true">✎</span>
            {{ t("admin.orders.detail.editOrder") }}
          </el-button>
          <el-button
            v-if="!isOrdersH5"
            type="primary"
            plain
            :disabled="!detailRow.receiptUrl"
            @click="openReceipt"
          >
            {{ t("admin.orders.detail.generateInvoice") }}
          </el-button>
          <el-button
            v-if="isStripeRefundAllowed(detailRow)"
            type="danger"
            plain
            :loading="refundingOrderId === detailRow.orderId"
            @click="handleStripeRefund(detailRow)"
          >
            {{ t("admin.orders.actions.stripeRefund") }}
          </el-button>
          <el-button v-if="!isOrdersH5" @click="printOrderDetail">
            {{ t("admin.orders.detail.print") }}
          </el-button>
          <el-button
            v-if="!isOrdersH5"
            circle
            :title="t('admin.orders.detail.notifyCustomer')"
            @click="notifyCustomer"
          >
            <span aria-hidden="true">✉</span>
          </el-button>
        </div>

        <section class="order-detail__status-bar">
          <strong>{{ t("admin.orders.detail.statusControl") }}</strong>
          <div class="order-detail__tags">
            <el-tag :type="paymentStatusTag(detailRow.paymentStatusCode)" round>
              {{ detailRow.paymentStatusText }}
            </el-tag>
            <el-select
              v-if="isOrdersH5"
              class="h5-status-select"
              :model-value="detailRow.orderStatusCode"
              :disabled="!detailRow.orderId || updatingStatusOrderId !== null"
              :loading="updatingStatusOrderId === detailRow.id"
              @change="(value: number) => handleOrderStatusChange(detailRow, value)"
            >
              <el-option
                v-for="item in orderStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-tag v-else :type="orderStatusTag(detailRow.orderStatusCode)" round>
              {{ detailRow.orderStatusText }}
            </el-tag>
          </div>
        </section>

        <div v-if="isOrdersH5" class="h5-actions">
          <button type="button" @click="openRemarkDialog(detailRow)">
            {{ t("admin.orders.actions.remark") }}
          </button>
          <button
            type="button"
            :disabled="copyingOrderId === detailRow.id"
            @click="copySupplierInfo(detailRow)"
          >
            {{ t("admin.orders.actions.copySupplier") }}
          </button>
          <button
            v-if="detailRow.rescheduleChanges.length"
            type="button"
            @click="openRescheduleHistory(detailRow)"
          >
            {{ t("admin.orders.actions.viewReschedule") }}
            {{ detailRow.rescheduleChanges.length }}
          </button>
        </div>

        <section v-if="isOrdersH5" class="h5-supplier">
          <div class="h5-supplier__copy">
            <small>{{ t("admin.orders.table.supplierName") }}</small>
            <strong>
              {{
                detailRow.supplierName ||
                t("admin.orders.supplierView.unassigned")
              }}
            </strong>
          </div>
          <div class="h5-supplier__actions">
            <button
              v-if="!isSupplierReadOnly(detailRow) && !hasAssignedSupplier(detailRow)"
              type="button"
              class="h5-supplier__btn"
              @click="openAssignDialog(detailRow)"
            >
              {{ t("admin.orders.actions.assignSupplier") }}
            </button>
            <button
              v-if="!isSupplierReadOnly(detailRow) && hasAssignedSupplier(detailRow)"
              type="button"
              class="h5-supplier__btn"
              @click="openAssignDialog(detailRow)"
            >
              {{ t("admin.orders.actions.assigned") }}
            </button>
            <button
              v-if="isSupplierReadOnly(detailRow)"
              type="button"
              class="h5-supplier__btn h5-supplier__btn--ghost"
              @click="openSupplierView(detailRow)"
            >
              {{ t("admin.orders.actions.viewSupplier") }}
            </button>
          </div>
        </section>

        <div class="order-detail__columns">
          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <h3>{{ t("admin.orders.detail.serviceBooked") }}</h3>
              <div class="order-detail__service-heading">
                <strong>{{ displayValue(detailRow.productName) }}</strong>
                <strong>{{ displayValue(detailRow.serviceAmountText) }}</strong>
              </div>
              <dl class="order-detail__list">
                <div>
                  <dt>{{ t("admin.orders.table.specDesc") }}</dt>
                  <dd>{{ displayValue(detailRow.specDescText) }}</dd>
                </div>
                <div v-if="detailRow.specRemarkText !== '-'">
                  <dt>{{ t("admin.orders.table.specRemark") }}</dt>
                  <dd>{{ displayValue(detailRow.specRemarkText) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.attachDetails") }}</dt>
                  <dd>{{ displayValue(detailRow.attachDetailsText) }}</dd>
                </div>
              </dl>
              <div class="order-detail__schedule">
                <span>{{ t("admin.orders.detail.scheduledAt") }}</span>
                <strong>{{ displayValue(detailRow.serviceTime) }}</strong>
              </div>
            </section>

            <section class="order-detail__panel">
              <h3>{{ t("admin.orders.detail.financialSummary") }}</h3>
              <div
                v-if="detailRow.lineItems.length"
                class="order-detail__line-items"
              >
                <div
                  v-for="(lineItem, index) in detailRow.lineItems"
                  :key="`${lineItem.lineType}-${lineItem.name}-${index}`"
                  class="order-detail__line-item"
                >
                  <div class="order-detail__line-item-main">
                    <strong>{{ displayValue(lineItem.name) }}</strong>
                    <span v-if="lineItem.lineType">{{
                      lineItem.lineType
                    }}</span>
                  </div>
                  <div class="order-detail__line-item-amount">
                    <strong>{{ lineItem.amountWithTaxText }}</strong>
                    <small>
                      {{ t("admin.orders.detail.quantity") }}:
                      {{ lineItem.quantity ?? "-" }}
                      · {{ t("admin.orders.detail.beforeTax") }}:
                      {{ lineItem.amountWithoutTaxText }}
                      · {{ t("admin.orders.detail.lineTax") }}:
                      {{ lineItem.taxAmountText }}
                    </small>
                  </div>
                </div>
              </div>
              <div class="order-detail__summary-row">
                <span>{{ t("admin.orders.detail.subtotal") }}</span>
                <strong>{{ displayValue(detailRow.subtotalText) }}</strong>
              </div>
              <div class="order-detail__summary-row">
                <span>{{ t("admin.orders.detail.tax") }}</span>
                <strong>{{ displayValue(detailRow.taxText) }}</strong>
              </div>
              <div
                class="order-detail__summary-row order-detail__summary-row--total"
              >
                <span>{{ t("admin.orders.detail.totalAmount") }}</span>
                <strong>{{ displayValue(detailRow.amountText) }}</strong>
              </div>
            </section>
          </div>

          <div class="order-detail__stack">
            <section class="order-detail__panel">
              <div class="order-detail__panel-title">
                <h3>{{ t("admin.orders.detail.bookingNotes") }}</h3>
                <el-button link type="primary" @click="openDetailEdit"
                  >✎</el-button
                >
              </div>
              <div class="order-detail__note">
                {{ displayValue(detailRow.customerRemark) }}
              </div>
            </section>

            <section class="order-detail__panel">
              <div class="order-detail__panel-title">
                <h3>{{ t("admin.orders.detail.internalRemark") }}</h3>
                <el-button
                  link
                  type="primary"
                  @click="openRemarkDialog(detailRow)"
                  >✎</el-button
                >
              </div>
              <div class="order-detail__note">
                {{ displayValue(detailRow.adminRemark) }}
              </div>
            </section>

            <section class="order-detail__panel">
              <div class="order-detail__panel-title">
                <h3>{{ t("admin.orders.detail.customerDetails") }}</h3>
                <el-button link type="primary" @click="openDetailEdit"
                  >✎</el-button
                >
              </div>
              <dl class="order-detail__list order-detail__list--customer">
                <div>
                  <dt>{{ t("admin.orders.detail.customerName") }}</dt>
                  <dd>{{ displayValue(detailRow.customerName) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.userPhone") }}</dt>
                  <dd>{{ displayValue(detailRow.userPhone) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.contactPhone") }}</dt>
                  <dd>{{ displayValue(detailRow.contactPhone) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.detail.accountEmail") }}</dt>
                  <dd>
                    {{
                      displayValue(
                        detailRow.userEmail || detailRow.customerEmail,
                      )
                    }}
                  </dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.detail.contactEmail") }}</dt>
                  <dd>{{ displayValue(detailRow.contactEmail) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.serviceAddress") }}</dt>
                  <dd>{{ displayValue(detailRow.serviceAddress) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.building") }}</dt>
                  <dd>{{ displayValue(detailRow.building) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.roomNo") }}</dt>
                  <dd>{{ displayValue(detailRow.roomNo) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.community") }}</dt>
                  <dd>{{ displayValue(detailRow.community) }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.orders.table.supplierName") }}</dt>
                  <dd>{{ displayValue(detailRow.supplierName) }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <section
          v-if="
            isCustomerCancelled(detailRow) &&
            (cancellationReasonText(detailRow) ||
              cancellationRemarkText(detailRow) ||
              cancellationTimeText(detailRow))
          "
          class="order-detail__panel order-detail__cancellation"
        >
          <h3>{{ t("admin.orders.detail.cancellationDetails") }}</h3>
          <dl class="order-detail__refund-grid">
            <div class="order-detail__refund-reason">
              <dt>{{ t("admin.orders.detail.cancellationReason") }}</dt>
              <dd>{{ displayValue(cancellationReasonText(detailRow)) }}</dd>
            </div>
            <div
              v-if="cancellationRemarkText(detailRow)"
              class="order-detail__refund-reason"
            >
              <dt>{{ t("admin.orders.detail.cancellationReasonRemark") }}</dt>
              <dd>{{ displayValue(cancellationRemarkText(detailRow)) }}</dd>
            </div>
            <div v-if="cancellationTimeText(detailRow)">
              <dt>{{ t("admin.orders.detail.cancelledAt") }}</dt>
              <dd>{{ formatDateTime(cancellationTimeText(detailRow)) }}</dd>
            </div>
          </dl>
        </section>

        <section class="order-detail__panel order-detail__payment">
          <h3>{{ t("admin.orders.detail.paymentDetails") }}</h3>
          <dl class="order-detail__payment-grid">
            <div>
              <dt>{{ t("admin.orders.detail.paymentGateway") }}</dt>
              <dd>{{ displayValue(detailRow.paymentGateway) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.table.paymentStatus") }}</dt>
              <dd class="order-detail__success">
                {{ detailRow.paymentStatusText }}
              </dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.table.paymentIntentId") }}</dt>
              <dd>{{ displayValue(detailRow.paymentIntentId) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.paidAt") }}</dt>
              <dd>{{ formatDateTime(detailRow.paidAt) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.paymentMethod") }}</dt>
              <dd>{{ displayValue(detailRow.paymentMethod) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.paymentMethodDetail") }}</dt>
              <dd>{{ displayValue(detailRow.paymentMethodDetail) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.cardLast4") }}</dt>
              <dd>{{ displayValue(detailRow.cardLast4) }}</dd>
            </div>
          </dl>
        </section>

        <section
          v-if="detailRow.refundInfo"
          class="order-detail__panel order-detail__refund"
        >
          <h3>{{ t("admin.orders.detail.refundDetails") }}</h3>
          <dl class="order-detail__refund-grid">
            <div class="order-detail__refund-reason">
              <dt>{{ t("admin.orders.detail.refundReason") }}</dt>
              <dd>
                {{
                  displayValue(
                    pickI18nValue(
                      detailRow.refundInfo.refundReasonI18n,
                      detailRow.refundInfo.refundReason,
                    ),
                  )
                }}
              </dd>
            </div>
            <div
              v-if="detailRow.refundInfo.refundReasonRemark"
              class="order-detail__refund-reason"
            >
              <dt>{{ t("admin.orders.detail.refundReasonRemark") }}</dt>
              <dd>
                {{ displayValue(detailRow.refundInfo.refundReasonRemark) }}
              </dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.requestedRefundAmount") }}</dt>
              <dd>
                {{
                  detailRow.refundInfo.requestedRefundAmountText === "-"
                    ? displayValue(detailRow.amountText)
                    : detailRow.refundInfo.requestedRefundAmountText
                }}
              </dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.requestedAt") }}</dt>
              <dd>{{ formatDateTime(detailRow.refundInfo.requestedAt) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.refundedAmount") }}</dt>
              <dd>
                {{ displayValue(detailRow.refundInfo.refundedAmountText) }}
              </dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.stripeRefundId") }}</dt>
              <dd>{{ displayValue(detailRow.refundInfo.stripeRefundId) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.refundedAt") }}</dt>
              <dd>{{ formatDateTime(detailRow.refundInfo.refundedAt) }}</dd>
            </div>
            <div class="order-detail__refund-reason">
              <dt>{{ t("admin.orders.detail.rejectReason") }}</dt>
              <dd>{{ displayValue(detailRow.refundInfo.rejectReason) }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.orders.detail.rejectedAt") }}</dt>
              <dd>{{ formatDateTime(detailRow.refundInfo.rejectedAt) }}</dd>
            </div>
          </dl>
        </section>
      </div>
      <template v-if="!isOrdersH5" #footer>
        <el-button @click="detailDrawerVisible = false">
          {{ t("admin.orders.actions.close") }}
        </el-button>
      </template>
    </el-drawer>

    <el-dialog
      :class="{ 'orders-h5-dialog': isOrdersH5 }"
      v-model="detailEditVisible"
      :title="t('admin.orders.detail.editOrder')"
      class="order-detail-edit-dialog"
      width="min(720px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      :show-close="!detailEditSubmitting"
    >
      <el-form label-position="top">
        <section class="detail-edit-section">
          <h4>{{ t("admin.orders.detail.customerDetails") }}</h4>
          <div class="detail-edit-grid">
            <el-form-item :label="t('admin.orders.detail.firstName')">
              <el-input v-model="detailEditForm.firstName" />
            </el-form-item>
            <el-form-item :label="t('admin.orders.detail.lastName')">
              <el-input v-model="detailEditForm.lastName" />
            </el-form-item>
          </div>
          <el-form-item :label="t('admin.orders.table.contactPhone')">
            <el-input v-model="detailEditForm.phone" />
          </el-form-item>
          <el-form-item :label="t('admin.orders.detail.contactEmail')">
            <el-input v-model="detailEditForm.email" />
          </el-form-item>
        </section>
        <section class="detail-edit-section">
          <h4>{{ t("admin.orders.detail.serviceBooked") }}</h4>
          <el-form-item :label="t('admin.orders.table.serviceAddress')">
            <el-input
              v-model="detailEditForm.serviceAddress"
              type="textarea"
              :rows="2"
            />
          </el-form-item>
          <el-form-item :label="t('admin.orders.table.building')">
            <el-input
              v-model="detailEditForm.building"
              type="textarea"
              :rows="2"
              maxlength="128"
            />
          </el-form-item>
          <div class="detail-edit-grid">
            <el-form-item :label="t('admin.orders.table.roomNo')">
              <el-input v-model="detailEditForm.roomNo" maxlength="128" />
            </el-form-item>
            <el-form-item :label="t('admin.orders.table.community')">
              <el-input v-model="detailEditForm.community" maxlength="128" />
            </el-form-item>
          </div>
          <div class="detail-edit-grid">
            <el-form-item :label="t('admin.orders.detail.serviceDate')">
              <el-date-picker
                v-model="detailEditForm.serviceTime"
                type="date"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item :label="t('admin.orders.detail.serviceSlot')">
              <el-select v-model="detailEditForm.timeRange" clearable>
                <el-option
                  v-for="item in serviceTimeRangeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item :label="t('admin.orders.detail.bookingNotes')">
            <el-input
              v-model="detailEditForm.remark"
              type="textarea"
              :rows="5"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </section>
      </el-form>
      <template #footer>
        <el-button
          :disabled="detailEditSubmitting"
          @click="detailEditVisible = false"
        >
          {{ t("admin.orders.actions.cancel") }}
        </el-button>
        <el-button
          type="primary"
          :loading="detailEditSubmitting"
          @click="submitDetailEdit"
        >
          {{ t("admin.orders.actions.save") }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      :class="{ 'orders-h5-dialog': isOrdersH5 }"
      v-model="refundDialogVisible"
      :title="t('admin.orders.dialog.stripeRefundTitle')"
      :close-on-click-modal="false"
      width="min(560px, calc(100vw - 28px))"
    >
      <el-alert
        :title="t('admin.orders.refund.warning')"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form class="refund-reason-form" label-position="top">
        <el-form-item :label="t('admin.orders.form.orderNo')">
          <el-input :model-value="refundTarget?.orderNo || ''" disabled />
        </el-form-item>
        <el-form-item :label="t('admin.orders.refund.reason')" required>
          <el-select
            v-model="refundForm.refundReason"
            :loading="refundReasonsLoading"
            :placeholder="t('admin.orders.refund.reasonPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in refundReasonOptions"
              :key="item.code"
              :label="refundReasonLabel(item)"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="selectedRefundReason?.remarkRequired"
          :label="t('admin.orders.refund.reasonRemark')"
          required
        >
          <el-input
            v-model.trim="refundForm.refundReasonRemark"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            :placeholder="t('admin.orders.refund.reasonRemarkPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button
          :disabled="refundingOrderId !== null"
          @click="refundDialogVisible = false"
        >
          {{ t("admin.orders.actions.cancel") }}
        </el-button>
        <el-button
          type="danger"
          :disabled="refundReasonsLoading || !refundForm.refundReason"
          :loading="refundingOrderId !== null"
          @click="submitStripeRefund"
        >
          {{ t("admin.orders.refund.continue") }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      :class="{ 'orders-h5-dialog': isOrdersH5 }"
      v-model="remarkDialogVisible"
      :title="t('admin.orders.dialog.remarkTitle')"
      :close-on-click-modal="false"
      width="560px"
    >
      <el-form label-width="90px">
        <el-form-item :label="t('admin.orders.form.orderNo')">
          <el-input :model-value="remarkForm.orderNo" disabled />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.adminRemark')">
          <el-input
            v-model="remarkForm.adminRemark"
            type="textarea"
            :rows="5"
            :placeholder="t('admin.orders.form.adminRemarkPlaceholder')"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">
          {{ t("admin.orders.actions.cancel") }}
        </el-button>
        <el-button
          type="primary"
          :loading="remarkSubmitting"
          @click="submitRemark"
        >
          {{ t("admin.orders.actions.save") }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      :class="{ 'orders-h5-dialog': isOrdersH5 }"
      v-model="rescheduleDialogVisible"
      :title="t('admin.orders.dialog.rescheduleHistoryTitle')"
      width="560px"
    >
      <div v-if="rescheduleTarget" class="reschedule-history">
        <p class="reschedule-history__order">
          {{ t('admin.orders.table.orderNo') }}:
          <strong>{{ rescheduleTarget.orderNo }}</strong>
        </p>
        <div
          v-for="(change, index) in rescheduleTarget.rescheduleChanges"
          :key="`${rescheduleTarget.id}-history-${index}`"
          class="reschedule-history__item"
        >
          <span class="reschedule-history__index">{{ index + 1 }}</span>
          <div>
            <strong>{{ formatRescheduleChangeTime(change) }}</strong>
            <p>{{ formatRescheduleChangeAddress(change) }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="rescheduleDialogVisible = false">
          {{ t('admin.orders.actions.close') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      :class="{ 'orders-h5-dialog': isOrdersH5 }"
      :modal-class="isOrdersH5 ? 'orders-h5-dialog-mask' : ''"
      v-model="supplierViewVisible"
      :title="t('admin.orders.actions.viewSupplier')"
      :width="isOrdersH5 ? '100%' : '520px'"
      @close="closeSupplierView"
    >
      <div class="supplier-view" :class="{ 'supplier-view--h5': isOrdersH5 }">
        <p>{{ t("admin.orders.supplierView.readOnly") }}</p>
        <dl v-if="isOrdersH5" class="h5-supplier-view">
          <div>
            <dt>{{ t("admin.orders.table.orderNo") }}</dt>
            <dd>{{ displayValue(supplierViewOrderNo) }}</dd>
          </div>
          <div>
            <dt>{{ t("admin.supplier.table.supplierName") }}</dt>
            <dd>
              {{
                supplierViewInfo.supplierName ||
                t("admin.orders.supplierView.unassigned")
              }}
            </dd>
          </div>
          <div>
            <dt>{{ t("admin.supplier.table.contactInfo") }}</dt>
            <dd>{{ displayValue(supplierViewInfo.contactInfo) }}</dd>
          </div>
        </dl>
        <el-descriptions v-else :column="1" border>
          <el-descriptions-item :label="t('admin.orders.table.orderNo')">
            {{ displayValue(supplierViewOrderNo) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('admin.supplier.table.supplierName')">
            {{
              supplierViewInfo.supplierName ||
              t("admin.orders.supplierView.unassigned")
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('admin.supplier.table.contactInfo')">
            {{ displayValue(supplierViewInfo.contactInfo) }}
          </el-descriptions-item>
        </el-descriptions>
        <el-skeleton v-if="supplierViewLoading" :rows="2" animated />
        <el-alert
          v-if="supplierViewError"
          :title="supplierViewError"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
      <template #footer>
        <el-button @click="supplierViewVisible = false">
          {{ t("admin.orders.actions.close") }}
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-if="isOrdersH5"
      v-model="assignDialogVisible"
      class="orders-h5-sheet"
      direction="btt"
      size="auto"
      append-to-body
      :z-index="5200"
      :title="assignDialogTitle"
      :close-on-click-modal="false"
    >
      <div class="h5-assign">
        <p class="h5-assign__order">{{ assignForm.orderNo }}</p>
        <p
          v-if="assignTarget && hasAssignedSupplier(assignTarget)"
          class="h5-assign__current"
        >
          {{ assignSupplierPreview.supplierName || assignTarget.supplierName }}
          <span v-if="assignSupplierPreview.contactInfo">
            {{ assignSupplierPreview.contactInfo }}
          </span>
        </p>
        <el-select
          v-model="assignForm.supplierIds"
          multiple
          filterable
          clearable
          collapse-tags
          collapse-tags-tooltip
          :loading="supplierLoading"
          :placeholder="t('admin.orders.form.supplierPlaceholder')"
          popper-class="orders-h5-select"
          style="width: 100%"
        >
          <el-option
            v-for="item in supplierOptions"
            :key="item.id"
            :label="item.supplierName"
            :value="item.id"
          />
        </el-select>
        <div class="h5-assign__footer">
          <button type="button" @click="assignDialogVisible = false">
            {{ t("admin.orders.actions.cancel") }}
          </button>
          <button
            type="button"
            :disabled="assignSubmitting"
            @click="submitSupplierAssignment"
          >
            {{ t("admin.orders.actions.save") }}
          </button>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-if="!isOrdersH5"
      v-model="assignDialogVisible"
      :title="t('admin.orders.dialog.assignSupplierTitle')"
      :close-on-click-modal="false"
      width="520px"
    >
      <el-form label-width="100px">
        <el-form-item :label="t('admin.orders.form.orderNo')">
          <el-input
            :model-value="
              bulkAssignMode
                ? t('admin.orders.bulk.ordersSelected', {
                    count: bulkAssignTargets.length,
                  })
                : assignForm.orderNo
            "
            disabled
          />
        </el-form-item>
        <el-form-item :label="t('admin.orders.form.supplier')">
          <el-select
            v-model="assignForm.supplierIds"
            multiple
            filterable
            remote
            clearable
            collapse-tags
            collapse-tags-tooltip
            :remote-method="loadSupplierOptions"
            :loading="supplierLoading"
            :placeholder="t('admin.orders.form.supplierPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in supplierOptions"
              :key="item.id"
              :label="item.supplierName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">
          {{ t("admin.orders.actions.cancel") }}
        </el-button>
        <el-button
          type="primary"
          :loading="assignSubmitting"
          @click="submitSupplierAssignment"
        >
          {{ t("admin.orders.actions.save") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import {
  detail as getOrderDetail,
  edit as editOrder,
  exportOrders,
  getRefundReasons,
  page,
  querySuppliers,
  stripeRefund as requestStripeRefund,
  updateOrderStatus,
  updateAdminRemark,
  updateSupplier,
  type OrderExportPayload,
  type RefundReasonOption,
} from "@/modules/admin/api/order"
import { detail as getSupplierDetail } from "@/modules/admin/api/supplier"
import { page as pageServices } from "@/modules/admin/api/spu"

type I18nText = Record<string, string>
type SpecValueI18nEntry = {
  remarkI18n?: I18nText
  [key: string]: string | I18nText | undefined
}
type RescheduleFilter =
  | "UNPROCESSED"
  | "PROCESSED"
  | "RESCHEDULED"
  | "NOT_RESCHEDULED"
  | "ALL"
type ServiceTimeSort = "" | "SERVICE_TIME_ASC" | "SERVICE_TIME_DESC"

type RescheduleChangeItem = {
  serviceAddress: string
  building: string
  roomNo: string
  community: string
  serviceDate: string
  timeRange: number | null
  timeRangeLabel: string
  serviceTime: string
}

type OrderRow = {
  orderId: number | null
  id: string | number
  orderNo: string
  userPhone: string
  contactPhone: string
  firstName: string
  lastName: string
  customerName: string
  customerEmail: string
  contactEmail: string
  userEmail: string
  customerRemark: string
  cancelReason: string
  cancelReasonRemark: string
  cancelledAt: string
  serviceAddress: string
  building: string
  roomNo: string
  community: string
  rescheduled: boolean
  rescheduleRead: boolean
  rescheduleChanges: RescheduleChangeItem[]
  supplierId: number | string | null
  supplierName: string
  suppliers: SupplierOption[]
  productName: string
  adminRemark: string
  specDescText: string
  specRemarkText: string
  attachDetailsText: string
  serviceTime: string
  timeRange: number | null
  orderStatusCode: number | null
  paymentStatusCode: number | null
  orderStatusText: string
  paymentStatusText: string
  paymentIntentId: string
  paymentMethod: string
  paymentMethodDetail: string
  paymentGateway: string
  cardLast4: string
  paidAt: string
  receiptUrl: string
  serviceAmountText: string
  subtotalText: string
  taxText: string
  amountText: string
  createdAt: string
  lineItems: OrderLineItem[]
  refundInfo: OrderRefundInfo | null
}

type OrderRefundInfo = {
  refundReason: string
  refundReasonI18n: I18nText
  refundReasonRemark: string
  requestedRefundAmountText: string
  requestedAt: string
  refundedAmountText: string
  stripeRefundId: string
  refundedAt: string
  rejectReason: string
  rejectedAt: string
}

type OrderLineItem = {
  lineType: string
  name: string
  quantity: number | null
  amountWithTaxText: string
  amountWithoutTaxText: string
  taxAmountText: string
}

type SupplierOption = {
  id: number | string
  supplierName: string
}

type RawSpecSelection = {
  specTypeId?: number | string
  specValueId?: number | string
  specTypeName?: string
  specValueName?: string
}

type RawAttachDetail = {
  attachTypeId?: number | string
  attachValueId?: number | string
  quantity?: number | string
  amountWithTax?: number | string
  amount?: number | string
  totalPrice?: number | string
  attachTypeName?: string
  attachValueName?: string
}

const orderStatusNameMap: Record<string, number> = {
  CREATED: 0,
  UNPAID: 0,
  PENDING_PAYMENT: 0,
  ACTION_NEEDED: 1,
  CONFIRMED: 1,
  PAID: 1,
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

const paymentStatusNameMap: Record<string, number> = {
  UNPAID: 0,
  PAID: 1,
  CANCELLED: 2,
  FAILED: 3,
  REFUNDING: 4,
  REFUNDED: 5,
  REFUNDED_FAIL: 6,
  REFUND_FAILED: 6,
}

const { t, locale } = useI18n({ useScope: "global" })
const route = useRoute()
const isOrdersH5 = computed(() => route.name === "admin-orders-h5")

const orderStatusOptions = computed(() => [
  { value: 0, label: t("admin.orders.status.orderDraft") },
  { value: 1, label: t("admin.orders.status.orderActionNeeded") },
  { value: 2, label: t("admin.orders.status.orderCompleted") },
  { value: 3, label: t("admin.orders.status.orderCancelled") },
  { value: 4, label: t("admin.orders.status.orderRefunding") },
  { value: 5, label: t("admin.orders.status.orderRefunded") },
  { value: 6, label: t("admin.orders.status.orderRefundRejected") },
])

const orderStatusLabel = (code: number | null) =>
  orderStatusOptions.value.find((item) => item.value === code)?.label || "-"

const orderStatusLegend = computed(() =>
  orderStatusOptions.value.filter((item) =>
    [0, 1, 2, 3, 5].includes(item.value),
  ),
)

const paymentStatusOptions = computed(() => [
  { value: 0, label: t("admin.orders.status.paymentUnpaid") },
  { value: 1, label: t("admin.orders.status.paymentPaid") },
  { value: 2, label: t("admin.orders.status.paymentCancelled") },
  { value: 3, label: t("admin.orders.status.paymentFailed") },
  { value: 4, label: t("admin.orders.status.paymentRefunding") },
  { value: 5, label: t("admin.orders.status.paymentRefunded") },
  { value: 6, label: t("admin.orders.status.paymentRefundFailed") },
])

const query = reactive({
  orderNo: "",
  customerName: "",
  contactPhone: "",
  productIds: [] as number[],
  serviceTimeRange: [] as string[],
  orderStatuses: [] as number[],
  paymentStatuses: (isOrdersH5.value ? [1] : []) as number[],
  rescheduleFilter: "ALL" as RescheduleFilter,
  serviceTimeSort: "" as ServiceTimeSort,
  pageNum: 1,
  pageSize: 10,
})

const orders = ref<OrderRow[]>([])
const total = ref(0)
const h5PageCount = computed(() =>
  Math.max(1, Math.ceil(total.value / Math.max(query.pageSize, 1))),
)
const tableLoading = ref(false)
const exportLoading = ref(false)
const selectedRows = ref<OrderRow[]>([])
const serviceOptions = ref<Array<{ value: number; label: string }>>([])
const copyingOrderId = ref<OrderRow["id"] | null>(null)
const updatingStatusOrderId = ref<OrderRow["id"] | null>(null)
const refundingOrderId = ref<number | null>(null)
const refundDialogVisible = ref(false)
const refundReasonsLoading = ref(false)
const refundTarget = ref<OrderRow | null>(null)
const refundReasonOptions = ref<RefundReasonOption[]>([])
const refundForm = reactive({
  refundReason: "",
  refundReasonRemark: "",
})
const selectedRefundReason = computed(
  () =>
    refundReasonOptions.value.find(
      (item) => item.code === refundForm.refundReason,
    ) || null,
)
const detailDrawerVisible = ref(false)
const detailRow = ref<OrderRow | null>(null)
const detailLoading = ref(false)
const detailRequestId = ref(0)
const detailEditVisible = ref(false)
const detailEditSubmitting = ref(false)
const detailEditForm = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  serviceAddress: "",
  building: "",
  roomNo: "",
  community: "",
  serviceTime: "",
  timeRange: null as number | null,
  remark: "",
})
const serviceTimeRangeOptions = [
  { value: 1, label: "09:00-11:00" },
  { value: 2, label: "11:00-13:00" },
  { value: 3, label: "13:00-15:00" },
  { value: 4, label: "15:00-17:00" },
  { value: 5, label: "17:00-19:00" },
  { value: 6, label: "19:00-21:00" },
]
const remarkDialogVisible = ref(false)
const remarkSubmitting = ref(false)
const remarkForm = reactive({
  orderId: null as number | null,
  orderNo: "",
  adminRemark: "",
})
const rescheduleDialogVisible = ref(false)
const rescheduleTarget = ref<OrderRow | null>(null)
const supplierViewVisible = ref(false)
const supplierViewLoading = ref(false)
const supplierViewError = ref("")
const supplierViewRequestId = ref(0)
const supplierViewOrderNo = ref("")
const supplierViewInfo = ref({ supplierName: "", contactInfo: "" })
const assignDialogVisible = ref(false)
const assignSubmitting = ref(false)
const assignTarget = ref<OrderRow | null>(null)
const bulkAssignMode = ref(false)
const bulkAssignTargets = ref<OrderRow[]>([])
const bulkCompleting = ref(false)
const supplierLoading = ref(false)
const supplierOptions = ref<SupplierOption[]>([])
const assignForm = reactive({
  orderId: null as number | null,
  orderNo: "",
  supplierIds: [] as Array<number | string>,
})
const assignSupplierPreview = ref({ supplierName: "", contactInfo: "" })

const formatDateTime = (value?: string) => {
  const text = String(value || "").trim()
  if (!text) return "-"
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return text
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  const hh = `${d.getHours()}`.padStart(2, "0")
  const mm = `${d.getMinutes()}`.padStart(2, "0")
  const ss = `${d.getSeconds()}`.padStart(2, "0")
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

const displayValue = (value: unknown) => {
  const text = String(value ?? "").trim()
  return text || "-"
}

const parseServiceDate = (value: unknown) => {
  const text = String(value ?? "").trim()
  const match = text.match(
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?/,
  )
  if (!match) return null
  const [, year, month, day, hour = "0", minute = "0"] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )
  return Number.isNaN(date.getTime()) ? null : date
}

const serviceDayKind = (value: unknown) => {
  const date = parseServiceDate(value)
  if (!date) return "weekday"
  const today = new Date()
  const dayValue = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const todayValue = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  const difference = Math.round((dayValue - todayValue) / 86_400_000)
  if (difference === 0) return "today"
  if (difference === 1) return "tomorrow"
  return "weekday"
}

const formatServiceDayLabel = (value: unknown) => {
  const date = parseServiceDate(value)
  if (!date) return ""
  const weekday = new Intl.DateTimeFormat(
    locale.value === "zh" ? "zh-CN" : "en-US",
    { weekday: "long" },
  ).format(date)
  const kind = serviceDayKind(value)
  if (kind === "today") {
    return `${t("admin.orders.table.today")} · ${weekday}`
  }
  if (kind === "tomorrow") {
    return `${t("admin.orders.table.tomorrow")} · ${weekday}`
  }
  return weekday
}

const hasAssignedSupplier = (row: OrderRow) =>
  (row.supplierId !== null &&
    row.supplierId !== undefined &&
    row.supplierId !== "") ||
  Boolean(row.supplierName.trim())

const isSupplierReadOnly = (row: OrderRow) =>
  row.orderStatusCode === 2 ||
  row.orderStatusCode === 3 ||
  row.orderStatusCode === 5

const supplierActionKey = (row: OrderRow) =>
  isSupplierReadOnly(row)
    ? "admin.orders.actions.viewSupplier"
    : hasAssignedSupplier(row)
      ? "admin.orders.actions.assigned"
      : "admin.orders.actions.assignSupplier"

const assignDialogTitle = computed(() => {
  if (!isOrdersH5.value || bulkAssignMode.value) {
    return t("admin.orders.dialog.assignSupplierTitle")
  }
  const row = assignTarget.value
  return t(
    row && hasAssignedSupplier(row)
      ? "admin.orders.actions.assigned"
      : "admin.orders.actions.assignSupplier",
  )
})

const isStripeRefundAllowed = (row: OrderRow) =>
  Boolean(row.orderId) &&
  (row.paymentStatusCode === 1 || row.paymentStatusCode === 4)

const canStripeRefund = (row: OrderRow) =>
  isStripeRefundAllowed(row) &&
  (refundingOrderId.value === null || refundingOrderId.value === row.orderId)

const hasOrderRemark = (row: OrderRow) => Boolean(row.adminRemark.trim())

const isCustomerCancelled = (row: OrderRow) => row.orderStatusCode === 3

const cancellationReasonText = (row: OrderRow) =>
  row.cancelReason ||
  pickI18nValue(
    row.refundInfo?.refundReasonI18n,
    row.refundInfo?.refundReason || "",
  )

const cancellationRemarkText = (row: OrderRow) =>
  row.cancelReasonRemark || row.refundInfo?.refundReasonRemark || ""

const cancellationTimeText = (row: OrderRow) =>
  row.cancelledAt || row.refundInfo?.requestedAt || ""

const hasUnreadReschedule = (row: OrderRow) =>
  row.rescheduled && !row.rescheduleRead

const orderStatusTone = (code: number | null) => {
  if (code === 1) return "action-needed"
  if (code === 2) return "completed"
  if (code === 3 || code === 5) return "closed"
  // 图中未指定退款中、退款失败及未知状态，保持中性底色。
  return "neutral"
}

const orderRowTone = (row: OrderRow) => {
  // 未付款订单即使已取消，也保持白色，避免与已付款后关闭的订单混淆。
  if (row.paymentStatusCode === 0 && row.orderStatusCode === 3) {
    return "neutral"
  }
  return orderStatusTone(row.orderStatusCode)
}

const orderRowClassName = ({ row }: { row: OrderRow }) => {
  const classes = [`order-status--${orderRowTone(row)}`]
  if (hasUnreadReschedule(row)) classes.push("order-row--rescheduled-unread")
  return classes.join(" ")
}

const formatServiceAddress = (row: OrderRow) =>
  [row.serviceAddress, row.building, row.roomNo, row.community]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ") || "-"

const formatRescheduleChangeTime = (item: RescheduleChangeItem) =>
  item.serviceTime ||
  [item.serviceDate, item.timeRangeLabel]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ") ||
  "-"

const formatRescheduleChangeAddress = (item: RescheduleChangeItem) =>
  [item.serviceAddress, item.building, item.roomNo, item.community]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ") || "-"

const openRescheduleHistory = (row: OrderRow) => {
  if (!row.rescheduleChanges.length) return
  rescheduleTarget.value = row
  rescheduleDialogVisible.value = true
}

const openOrderDetail = async (row: OrderRow) => {
  detailRow.value = row
  detailDrawerVisible.value = true
  if (!row.orderId) {
    ElMessage.warning(t("admin.orders.message.detailOrderIdMissing"))
    return
  }

  const requestId = ++detailRequestId.value
  detailLoading.value = true
  try {
    const response = await getOrderDetail(row.orderId)
    if (requestId === detailRequestId.value) {
      const normalized = normalizeOrderDetail(response, row)
      const source = orders.value.find((item) => item.orderId === row.orderId)
      if (source?.rescheduled) source.rescheduleRead = true
      if (normalized.rescheduled) normalized.rescheduleRead = true
      detailRow.value = normalized
      if (query.rescheduleFilter === "UNPROCESSED" && normalized.rescheduled) {
        orders.value = orders.value.filter(
          (item) => item.orderId !== row.orderId,
        )
        total.value = Math.max(0, total.value - 1)
        if (!orders.value.length && query.pageNum > 1) {
          query.pageNum -= 1
        }
        void fetchOrders()
      }
    }
  } catch (error: any) {
    if (requestId === detailRequestId.value) {
      ElMessage.error(error?.message || t("admin.orders.message.detailFailed"))
    }
  } finally {
    if (requestId === detailRequestId.value) {
      detailLoading.value = false
    }
  }
}

const closeOrderDetail = () => {
  detailRequestId.value += 1
  detailLoading.value = false
  detailRow.value = null
}

const normalizeCustomerNamePart = (value: unknown) => {
  const normalized = String(value ?? "").trim()
  return normalized === "-" ? "" : normalized
}

const splitCustomerName = (row: OrderRow) => {
  const parts = String(row.customerName || "")
    .trim()
    .split(/\s+/)
    .filter((part) => Boolean(part) && part !== "-")
  return {
    firstName: normalizeCustomerNamePart(row.firstName) || parts[0] || "",
    lastName:
      normalizeCustomerNamePart(row.lastName) || parts.slice(1).join(" ") || "",
  }
}

const openDetailEdit = () => {
  const row = detailRow.value
  if (!row?.orderId) return
  const names = splitCustomerName(row)
  const dateMatch = /\d{4}-\d{2}-\d{2}/.exec(row.serviceTime || "")
  Object.assign(detailEditForm, {
    firstName: names.firstName,
    lastName: names.lastName,
    phone: row.contactPhone || row.userPhone,
    email: row.contactEmail || row.customerEmail,
    serviceAddress: row.serviceAddress,
    building: row.building,
    roomNo: row.roomNo,
    community: row.community,
    serviceTime: dateMatch?.[0] || "",
    timeRange: row.timeRange,
    remark: row.customerRemark,
  })
  detailEditVisible.value = true
}

const submitDetailEdit = async () => {
  const row = detailRow.value
  if (!row?.orderId || detailEditSubmitting.value) return
  const email = detailEditForm.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning(t("admin.orders.message.invalidContactEmail"))
    return
  }
  detailEditSubmitting.value = true
  try {
    const firstName = detailEditForm.firstName.trim()
    const lastName = detailEditForm.lastName.trim()
    const contactPhone = detailEditForm.phone.trim()
    const serviceAddress = detailEditForm.serviceAddress.trim()
    const building = detailEditForm.building.trim()
    const roomNo = detailEditForm.roomNo.trim()
    const community = detailEditForm.community.trim()
    const customerRemark = detailEditForm.remark.trim()
    await editOrder({
      orderId: row.orderId,
      firstName,
      lastName,
      phone: contactPhone,
      email,
      serviceAddress,
      building,
      roomNo,
      community,
      serviceTime: detailEditForm.serviceTime || undefined,
      timeRange: detailEditForm.timeRange ?? undefined,
      remark: customerRemark,
    })
    const optimisticRow: OrderRow = {
      ...row,
      firstName,
      lastName,
      customerName:
        [firstName, lastName].filter(Boolean).join(" ") || row.customerName,
      contactPhone,
      contactEmail: email,
      serviceAddress,
      building,
      roomNo,
      community,
      serviceTime: detailEditForm.serviceTime || row.serviceTime,
      timeRange: detailEditForm.timeRange,
      customerRemark,
    }
    const refreshed = normalizeOrderDetail(
      await getOrderDetail(row.orderId),
      optimisticRow,
    )
    detailRow.value = refreshed
    const index = orders.value.findIndex((item) => item.orderId === row.orderId)
    if (index >= 0) orders.value[index] = refreshed
    detailEditVisible.value = false
    ElMessage.success(t("admin.orders.message.detailEditSuccess"))
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.orders.message.detailEditFailed"),
    )
  } finally {
    detailEditSubmitting.value = false
  }
}

const printOrderDetail = () => window.print()

const refundReasonLabel = (item: RefundReasonOption) =>
  pickI18nValue(item.nameI18n, item.code)

const loadRefundReasons = async () => {
  refundReasonsLoading.value = true
  try {
    refundReasonOptions.value = await getRefundReasons()
    if (!refundReasonOptions.value.length) {
      ElMessage.warning(t("admin.orders.refund.noReasons"))
    }
  } catch (error: any) {
    refundReasonOptions.value = []
    ElMessage.error(error?.message || t("admin.orders.refund.reasonLoadFailed"))
  } finally {
    refundReasonsLoading.value = false
  }
}

const handleStripeRefund = (row: OrderRow) => {
  if (!row.orderId || !canStripeRefund(row)) return

  refundTarget.value = row
  refundForm.refundReason = ""
  refundForm.refundReasonRemark = ""
  refundDialogVisible.value = true
  void loadRefundReasons()
}

const submitStripeRefund = async () => {
  const row = refundTarget.value
  if (!row?.orderId || !canStripeRefund(row)) return
  if (!refundForm.refundReason) {
    ElMessage.warning(t("admin.orders.refund.reasonRequired"))
    return
  }
  if (
    selectedRefundReason.value?.remarkRequired &&
    !refundForm.refundReasonRemark.trim()
  ) {
    ElMessage.warning(t("admin.orders.refund.reasonRemarkRequired"))
    return
  }

  try {
    await ElMessageBox.confirm(
      t("admin.orders.refund.confirmWithReason", {
        orderNo: row.orderNo,
        amount: row.amountText,
        reason: refundReasonLabel(
          selectedRefundReason.value || {
            code: refundForm.refundReason,
          },
        ),
      }),
      t("admin.orders.refund.confirmTitle"),
      {
        type: "warning",
        confirmButtonText: t("admin.orders.refund.confirm"),
        cancelButtonText: t("admin.orders.actions.cancel"),
        confirmButtonClass: "el-button--danger",
      },
    )
  } catch {
    return
  }

  refundingOrderId.value = row.orderId
  try {
    const result = await requestStripeRefund({
      orderId: row.orderId,
      deductHandlingFee: false,
      refundReason: refundForm.refundReason,
      refundReasonRemark: refundForm.refundReasonRemark.trim() || undefined,
    })
    const refundId = String(
      typeof result === "string" ? result : ((result as any)?.data ?? ""),
    ).trim()
    ElMessage.success(
      refundId
        ? t("admin.orders.refund.successWithId", { refundId })
        : t("admin.orders.refund.success"),
    )
    refundDialogVisible.value = false
    await fetchOrders()
    if (detailRow.value?.orderId === row.orderId) {
      try {
        detailRow.value = normalizeOrderDetail(
          await getOrderDetail(row.orderId),
          detailRow.value,
        )
      } catch {
        // The refund succeeded; a later refresh can recover detail display.
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.orders.refund.failed"))
  } finally {
    refundingOrderId.value = null
  }
}

const openReceipt = () => {
  const receiptUrl = String(detailRow.value?.receiptUrl || "").trim()
  if (!receiptUrl) {
    ElMessage.warning(t("admin.orders.message.receiptUnavailable"))
    return
  }
  try {
    const targetUrl = new URL(receiptUrl, window.location.origin)
    if (!/^https?:$/.test(targetUrl.protocol))
      throw new Error("invalid protocol")
    window.open(targetUrl.toString(), "_blank", "noopener,noreferrer")
  } catch {
    ElMessage.warning(t("admin.orders.message.receiptUnavailable"))
  }
}

const notifyCustomer = () => {
  const row = detailRow.value
  const email = String(
    row?.contactEmail || row?.customerEmail || row?.userEmail || "",
  ).trim()
  if (!row || !email) {
    ElMessage.warning(t("admin.orders.message.customerEmailMissing"))
    return
  }
  const subject = encodeURIComponent(`HourX order ${row.orderNo} status update`)
  const body = encodeURIComponent(
    `Order ${row.orderNo}\nStatus: ${row.orderStatusText}\nScheduled: ${row.serviceTime}`,
  )
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`
}

const handleOrderStatusChange = async (row: OrderRow, nextStatus: number) => {
  if (!row.orderId) {
    ElMessage.warning(t("admin.orders.message.statusOrderIdMissing"))
    return
  }
  if (!Number.isInteger(nextStatus) || nextStatus < 0 || nextStatus > 6) {
    return
  }
  if (row.orderStatusCode === nextStatus) {
    return
  }

  updatingStatusOrderId.value = row.id
  try {
    await updateOrderStatus({
      orderId: row.orderId,
      orderStatus: nextStatus,
    })
    row.orderStatusCode = nextStatus
    row.orderStatusText = getOrderStatusText(nextStatus)
    ElMessage.success(t("admin.orders.message.statusUpdateSuccess"))
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.orders.message.statusUpdateFailed"),
    )
  } finally {
    updatingStatusOrderId.value = null
  }
}

const paymentStatusTag = (code: number | null) => {
  if (code === 1) return "success"
  if (code === 2 || code === 5) return "info"
  if (code === 0 || code === 4) return "warning"
  if (code === 3 || code === 6) return "danger"
  return ""
}

const orderStatusTag = (code: number | null) => {
  if (code === 2 || code === 5) return "success"
  if (code === 0 || code === 1 || code === 4) return "warning"
  if (code === 3) return "info"
  if (code === 6) return "danger"
  return ""
}

const normalizeCode = (
  value: unknown,
  nameMap: Record<string, number>,
): number | null => {
  if (value === null || value === undefined || value === "") return null
  const num = Number(value)
  if (Number.isFinite(num)) {
    return num
  }
  const key = String(value).trim().toUpperCase()
  if (!key) return null
  return key in nameMap ? (nameMap[key] ?? null) : null
}

const normalizeOrderId = (value: unknown): number | null => {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

const normalizeBoolean = (value: unknown) =>
  value === true || value === 1 || String(value ?? "").toLowerCase() === "true"

const parseRescheduleChanges = (value: unknown): RescheduleChangeItem[] => {
  if (typeof value === "string") {
    const legacyText = value.trim()
    return legacyText
      ? [
          {
            serviceAddress: "",
            building: "",
            roomNo: "",
            community: "",
            serviceDate: "",
            timeRange: null,
            timeRangeLabel: "",
            serviceTime: legacyText,
          },
        ]
      : []
  }
  if (!Array.isArray(value)) return []
  return value
    .map((entry: any) => {
      const rawTimeRange = entry?.timeRange
      const parsedTimeRange = Number(rawTimeRange)
      return {
        serviceAddress: String(entry?.serviceAddress ?? "").trim(),
        building: String(entry?.building ?? "").trim(),
        roomNo: String(entry?.roomNo ?? "").trim(),
        community: String(entry?.community ?? "").trim(),
        serviceDate: String(entry?.serviceDate ?? "").trim(),
        timeRange:
          rawTimeRange !== null &&
          rawTimeRange !== undefined &&
          rawTimeRange !== "" &&
          Number.isFinite(parsedTimeRange)
            ? parsedTimeRange
            : null,
        timeRangeLabel: String(entry?.timeRangeLabel ?? "").trim(),
        serviceTime: String(entry?.serviceTime ?? "").trim(),
      }
    })
    .filter(
      (item) =>
        Boolean(item.serviceAddress) ||
        Boolean(item.building) ||
        Boolean(item.roomNo) ||
        Boolean(item.community) ||
        Boolean(item.serviceDate) ||
        item.timeRange !== null ||
        Boolean(item.timeRangeLabel) ||
        Boolean(item.serviceTime),
    )
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

const getI18nMapValue = (
  source: Record<string, I18nText> | undefined,
  id: unknown,
  fallback = "",
) => {
  const key = String(id ?? "").trim()
  if (!key || !source || typeof source !== "object") {
    return fallback
  }
  return pickI18nValue(source[key], fallback)
}

const joinLabelValue = (label: string, value: string) => {
  const normalizedLabel = String(label || "").trim()
  const normalizedValue = String(value || "").trim()
  if (!normalizedLabel) return normalizedValue
  if (!normalizedValue) return normalizedLabel
  if (/[：:]$/.test(normalizedLabel)) {
    return `${normalizedLabel}${normalizedValue}`
  }
  return `${normalizedLabel}: ${normalizedValue}`
}

const getOrderStatusText = (code: number | null) => {
  if (code === 0) return t("admin.orders.status.orderDraft")
  if (code === 1) return t("admin.orders.status.orderActionNeeded")
  if (code === 2) return t("admin.orders.status.orderCompleted")
  if (code === 3) return t("admin.orders.status.orderCancelled")
  if (code === 4) return t("admin.orders.status.orderRefunding")
  if (code === 5) return t("admin.orders.status.orderRefunded")
  if (code === 6) return t("admin.orders.status.orderRefundRejected")
  return "-"
}

const getPaymentStatusText = (code: number | null) => {
  if (code === 0) return t("admin.orders.status.paymentUnpaid")
  if (code === 1) return t("admin.orders.status.paymentPaid")
  if (code === 2) return t("admin.orders.status.paymentCancelled")
  if (code === 3) return t("admin.orders.status.paymentFailed")
  if (code === 4) return t("admin.orders.status.paymentRefunding")
  if (code === 5) return t("admin.orders.status.paymentRefunded")
  if (code === 6) return t("admin.orders.status.paymentRefundFailed")
  return "-"
}

const parseSpecDescText = (item: any) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {}
  const specTypeNameI18n = (order.specTypeNameI18n ??
    item.specTypeNameI18n ??
    {}) as Record<string, I18nText>
  const specValueNameI18n = (order.specValueNameI18n ??
    item.specValueNameI18n ??
    {}) as Record<string, I18nText>
  const selections = (
    Array.isArray(order.specSelections)
      ? order.specSelections
      : Array.isArray(item.specSelections)
        ? item.specSelections
        : []
  ) as RawSpecSelection[]
  const specValues = selections
    .map((s) => {
      const typeName =
        String(s?.specTypeName || "").trim() ||
        getI18nMapValue(specTypeNameI18n, s?.specTypeId)
      const valueName =
        String(s?.specValueName || "").trim() ||
        getI18nMapValue(specValueNameI18n, s?.specValueId)
      return joinLabelValue(typeName, valueName)
    })
    .filter(Boolean)
  if (specValues.length) return specValues.join(" / ")
  const fallback = String(order.specDesc ?? item.specDesc ?? "").trim()
  return fallback || "-"
}

const parseSpecRemarkText = (item: any) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {}
  const specValueNameI18n = (order.specValueNameI18n ??
    item.specValueNameI18n ??
    {}) as Record<string, SpecValueI18nEntry>
  const selections = (
    Array.isArray(order.specSelections)
      ? order.specSelections
      : Array.isArray(item.specSelections)
        ? item.specSelections
        : []
  ) as RawSpecSelection[]
  const remarks = selections
    .map((selection) => {
      const key = String(selection?.specValueId ?? "").trim()
      if (!key) return ""
      const valueI18n = specValueNameI18n[key]
      const remark = pickI18nValue(valueI18n?.remarkI18n, "")
      if (!remark) return ""
      const valueName =
        String(selection?.specValueName || "").trim() ||
        pickI18nValue(valueI18n as I18nText, "")
      return joinLabelValue(valueName, remark)
    })
    .filter(Boolean)
  return remarks.length ? remarks.join(" / ") : "-"
}

const parseAttachDetailsText = (item: any) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {}
  const attachItems = (
    Array.isArray(order.attachItems)
      ? order.attachItems
      : Array.isArray(item.attachItems)
        ? item.attachItems
        : []
  )
    .map((attach: unknown) => String(attach ?? "").trim())
    .filter(Boolean)
  const attachTypeNameI18n = (order.attachTypeNameI18n ??
    item.attachTypeNameI18n ??
    {}) as Record<string, I18nText>
  const attachValueNameI18n = (order.attachValueNameI18n ??
    item.attachValueNameI18n ??
    {}) as Record<string, I18nText>
  const attachDetails = (
    Array.isArray(order.attachDetails)
      ? order.attachDetails
      : Array.isArray(item.attachDetails)
        ? item.attachDetails
        : Array.isArray(order.attachSelections)
          ? order.attachSelections
          : Array.isArray(item.attachSelections)
            ? item.attachSelections
            : []
  ) as RawAttachDetail[]
  const attachValues = attachDetails
    .map((attach) => {
      const typeName =
        String(attach?.attachTypeName || "").trim() ||
        getI18nMapValue(attachTypeNameI18n, attach?.attachTypeId)
      const valueName =
        String(attach?.attachValueName || "").trim() ||
        getI18nMapValue(attachValueNameI18n, attach?.attachValueId)
      const quantity = Number(attach?.quantity ?? 0)
      const summary = joinLabelValue(typeName, valueName)
      if (!summary) {
        return ""
      }
      const quantityText = quantity > 0 ? `${summary} x ${quantity}` : summary
      const priceText = formatMoneyText(
        attach?.amountWithTax ?? attach?.totalPrice ?? attach?.amount,
      )
      return priceText === "-" ? quantityText : `${quantityText} · ${priceText}`
    })
    .filter(Boolean)
  if (attachValues.length) return attachValues.join(" / ")
  return attachItems.length ? attachItems.join(" / ") : "-"
}

const formatMoneyText = (value: unknown) => {
  const text = String(value ?? "").trim()
  if (!text) return "-"
  const numeric = Number(text)
  if (!Number.isFinite(numeric)) return text
  return `AED ${numeric.toFixed(2)}`
}

const parseMoneyText = (item: any, fields: string[]) => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {}
  for (const field of fields) {
    const value = order?.[field] ?? item?.[field]
    const text = String(value ?? "").trim()
    if (text && text !== "-") {
      return formatMoneyText(value)
    }
  }
  return "-"
}

const parseAmountText = (item: any) => {
  return parseMoneyText(item, [
    "amountText",
    "orderAmount",
    "amountWithTax",
    "totalAmountWithTax",
    "totalAmount",
    "amount",
  ])
}

const parseLineItems = (item: any): OrderLineItem[] => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {}
  const rawItems = Array.isArray(order.lineItems)
    ? order.lineItems
    : Array.isArray(item?.lineItems)
      ? item.lineItems
      : []

  return rawItems.map((lineItem: any) => {
    const quantity = Number(lineItem?.quantity)
    return {
      lineType: String(lineItem?.lineType ?? "").trim(),
      name: String(lineItem?.name ?? "").trim(),
      quantity: Number.isFinite(quantity) ? quantity : null,
      amountWithTaxText: formatMoneyText(lineItem?.amountWithTax),
      amountWithoutTaxText: formatMoneyText(lineItem?.amountWithoutTax),
      taxAmountText: formatMoneyText(lineItem?.taxAmount),
    }
  })
}

const parseRefundInfo = (item: any): OrderRefundInfo | null => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {}
  const raw = order.refundInfo ?? item?.refundInfo
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  const refundReason = String(raw.refundReason ?? "").trim()
  const refundReasonI18n =
    raw.refundReasonI18n && typeof raw.refundReasonI18n === "object"
      ? (raw.refundReasonI18n as Record<string, string>)
      : undefined
  return {
    refundReason,
    refundReasonI18n: refundReasonI18n ?? {},
    refundReasonRemark: String(raw.refundReasonRemark ?? "").trim(),
    requestedRefundAmountText: formatMoneyText(raw.requestedRefundAmount),
    requestedAt: String(raw.requestedAt ?? "").trim(),
    refundedAmountText: formatMoneyText(raw.refundedAmount),
    stripeRefundId: String(raw.stripeRefundId ?? "").trim(),
    refundedAt: String(raw.refundedAt ?? "").trim(),
    rejectReason: String(raw.rejectReason ?? "").trim(),
    rejectedAt: String(raw.rejectedAt ?? "").trim(),
  }
}

const normalizePage = (payload: any) => {
  const root = payload?.data ?? payload ?? {}
  if (Array.isArray(root.list)) {
    return {
      list: root.list,
      total: Number(root.total ?? root.list.length) || root.list.length,
      pageNum: Number(root.pageNum ?? query.pageNum) || query.pageNum,
      pageSize: Number(root.pageSize ?? query.pageSize) || query.pageSize,
    }
  }
  if (Array.isArray(root.data?.list)) {
    const pageData = root.data
    return {
      list: pageData.list,
      total:
        Number(pageData.total ?? pageData.list.length) || pageData.list.length,
      pageNum: Number(pageData.pageNum ?? query.pageNum) || query.pageNum,
      pageSize: Number(pageData.pageSize ?? query.pageSize) || query.pageSize,
    }
  }
  if (Array.isArray(root.data)) {
    return {
      list: root.data,
      total: Number(root.total ?? root.data.length) || root.data.length,
      pageNum: Number(root.pageNum ?? query.pageNum) || query.pageNum,
      pageSize: Number(root.pageSize ?? query.pageSize) || query.pageSize,
    }
  }
  return {
    list: [],
    total: 0,
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  }
}

const deDuplicateCustomerName = (value: unknown) => {
  const parts = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter((part) => Boolean(part) && part !== "-")
  if (
    parts.length === 2 &&
    parts[0]?.localeCompare(parts[1] || "", undefined, {
      sensitivity: "accent",
    }) === 0
  ) {
    return parts[0] || ""
  }
  return parts.join(" ")
}

const parseAssignedSupplierList = (value: unknown): SupplierOption[] => {
  let source = value
  if (typeof source === "string" && source.trim()) {
    try {
      source = JSON.parse(source)
    } catch {
      return []
    }
  }
  if (!Array.isArray(source)) return []
  const seen = new Set<string>()
  const suppliers: SupplierOption[] = []
  source.forEach((entry) => {
    if (!entry || typeof entry !== "object") return
    const item = entry as Record<string, unknown>
    const id = item.supplierId ?? item.id
    if (id === null || id === undefined || id === "") return
    const key = String(id)
    if (seen.has(key)) return
    seen.add(key)
    suppliers.push({
      id: id as number | string,
      supplierName: String(item.supplierName ?? item.name ?? "").trim(),
    })
  })
  return suppliers
}

const resolveAssignedSuppliers = (
  order: any,
  item: any,
  supplierNameI18n: I18nText,
) => {
  const fallbackId =
    order.supplierId ??
    item.supplierId ??
    order.supplier?.id ??
    item.supplier?.id ??
    null
  const fallbackName = pickI18nValue(
    supplierNameI18n,
    String(
      order.supplierName ??
        item.supplierName ??
        order.supplier?.supplierName ??
        item.supplier?.supplierName ??
        order.supplier?.name ??
        item.supplier?.name ??
        "",
    ).trim(),
  )
  const assigned = parseAssignedSupplierList(
    order.assignedSuppliers ?? item.assignedSuppliers,
  )
  const existing = Array.isArray(order.suppliers)
    ? (order.suppliers as SupplierOption[])
    : []
  const suppliers = assigned.length
    ? assigned
    : existing.length
      ? existing
      : fallbackId
        ? [{ id: fallbackId, supplierName: fallbackName }]
        : []
  const supplierName =
    suppliers
      .map((supplier) => supplier.supplierName)
      .filter(Boolean)
      .join("、") || fallbackName
  return {
    supplierId: suppliers[0]?.id ?? fallbackId ?? null,
    supplierName,
    suppliers,
  }
}

const parseOrderRow = (item: any): OrderRow => {
  const order = item?.order ?? item?.orderHeader ?? item ?? {}
  const orderId = normalizeOrderId(
    order.orderId ?? item.orderId ?? order.id ?? item.id,
  )
  const rawOrderStatus =
    order.orderStatus ?? item.orderStatus ?? order.status ?? item.status
  const rawPaymentStatus =
    order.paymentStatus ??
    item.paymentStatus ??
    order.payStatus ??
    item.payStatus
  const productNameI18n = (order.productNameI18n ??
    item.productNameI18n ??
    {}) as I18nText
  const orderStatusNameI18n = (order.orderStatusNameI18n ??
    item.orderStatusNameI18n ??
    {}) as I18nText
  const paymentStatusNameI18n = (order.paymentStatusNameI18n ??
    item.paymentStatusNameI18n ??
    {}) as I18nText
  const supplierNameI18n = (order.supplierNameI18n ??
    item.supplierNameI18n ??
    order.supplier?.nameI18n ??
    item.supplier?.nameI18n ??
    {}) as I18nText
  const cancellationReasonI18n = (order.cancelReasonI18n ??
    item.cancelReasonI18n ??
    order.cancellationReasonI18n ??
    item.cancellationReasonI18n ??
    {}) as I18nText
  const orderStatusCode = normalizeCode(rawOrderStatus, orderStatusNameMap)
  const paymentStatusCode = normalizeCode(
    rawPaymentStatus,
    paymentStatusNameMap,
  )
  const contactCustomerName = [
    order.firstName ?? item.firstName,
    order.lastName ?? item.lastName,
  ]
    .map(normalizeCustomerNamePart)
    .filter(Boolean)
    .join(" ")
  const resolvedCustomerName = deDuplicateCustomerName(
    order.customerName ??
      item.customerName ??
      order.contactName ??
      item.contactName ??
      order.recipientName ??
      item.recipientName ??
      (contactCustomerName || undefined) ??
      order.userName ??
      item.userName ??
      order.user?.name ??
      item.user?.name ??
      "",
  )

  return {
    orderId,
    id: orderId ?? String(order.orderNo ?? item.orderNo ?? ""),
    orderNo: String(order.orderNo ?? item.orderNo ?? "").trim(),
    userPhone: String(
      order.userPhone ?? item.userPhone ?? order.phone ?? item.phone ?? "",
    ).trim(),
    contactPhone: String(
      order.contactPhone ??
        item.contactPhone ??
        order.recipientPhone ??
        item.recipientPhone ??
        "",
    ).trim(),
    firstName: normalizeCustomerNamePart(order.firstName ?? item.firstName),
    lastName: normalizeCustomerNamePart(order.lastName ?? item.lastName),
    customerName: resolvedCustomerName,
    customerEmail: String(
      order.customerEmail ??
        item.customerEmail ??
        order.userEmail ??
        item.userEmail ??
        order.contactEmail ??
        item.contactEmail ??
        order.email ??
        item.email ??
        order.user?.email ??
        item.user?.email ??
        "",
    ).trim(),
    contactEmail: String(
      order.contactEmail ??
        item.contactEmail ??
        order.recipientEmail ??
        item.recipientEmail ??
        "",
    ).trim(),
    userEmail: String(
      order.userEmail ??
        item.userEmail ??
        order.customerEmail ??
        item.customerEmail ??
        order.user?.email ??
        item.user?.email ??
        "",
    ).trim(),
    customerRemark: String(
      order.customerRemark ??
        item.customerRemark ??
        order.bookingRemark ??
        item.bookingRemark ??
        order.customerNotes ??
        item.customerNotes ??
        order.remark ??
        item.remark ??
        "",
    ).trim(),
    cancelReason: pickI18nValue(
      cancellationReasonI18n,
      String(
        order.cancelReason ??
          item.cancelReason ??
          order.cancellationReason ??
          item.cancellationReason ??
          order.cancelledReason ??
          item.cancelledReason ??
          "",
      ).trim(),
    ),
    cancelReasonRemark: String(
      order.cancelReasonRemark ??
        item.cancelReasonRemark ??
        order.cancellationRemark ??
        item.cancellationRemark ??
        order.cancelRemark ??
        item.cancelRemark ??
        "",
    ).trim(),
    cancelledAt: String(
      order.cancelledAt ??
        item.cancelledAt ??
        order.canceledAt ??
        item.canceledAt ??
        order.cancelTime ??
        item.cancelTime ??
        "",
    ).trim(),
    serviceAddress: String(
      order.serviceAddress ??
        item.serviceAddress ??
        order.fullAddress ??
        item.fullAddress ??
        order.address ??
        item.address ??
        "",
    ).trim(),
    building: String(order.building ?? item.building ?? "").trim(),
    roomNo: String(order.roomNo ?? item.roomNo ?? "").trim(),
    community: String(order.community ?? item.community ?? "").trim(),
    rescheduled: normalizeBoolean(order.rescheduled ?? item.rescheduled),
    rescheduleRead: normalizeBoolean(
      order.rescheduleRead ?? item.rescheduleRead,
    ),
    rescheduleChanges: parseRescheduleChanges(
      order.rescheduleChanges ?? item.rescheduleChanges,
    ),
    ...resolveAssignedSuppliers(order, item, supplierNameI18n),
    productName: pickI18nValue(
      productNameI18n,
      String(
        order.productName ??
          item.productName ??
          order.spuName ??
          item.spuName ??
          "",
      ).trim(),
    ),
    adminRemark: String(order.adminRemark ?? item.adminRemark ?? "").trim(),
    specDescText: parseSpecDescText(item),
    specRemarkText: parseSpecRemarkText(item),
    attachDetailsText: parseAttachDetailsText(item),
    serviceTime: String(
      order.serviceTime ??
        item.serviceTime ??
        order.serviceDateTime ??
        item.serviceDateTime ??
        "",
    ).trim(),
    timeRange: normalizeOptionalNumberParam(order.timeRange ?? item.timeRange),
    orderStatusCode,
    paymentStatusCode,
    orderStatusText: pickI18nValue(
      orderStatusNameI18n,
      orderStatusCode === null
        ? String(rawOrderStatus ?? "").trim() || "-"
        : getOrderStatusText(orderStatusCode),
    ),
    paymentStatusText: pickI18nValue(
      paymentStatusNameI18n,
      paymentStatusCode === null
        ? String(rawPaymentStatus ?? "").trim() || "-"
        : getPaymentStatusText(paymentStatusCode),
    ),
    paymentIntentId: String(
      order.paymentIntentId ??
        item.paymentIntentId ??
        order.paymentIntentld ??
        item.paymentIntentld ??
        "",
    ).trim(),
    paymentMethod: String(
      order.paymentMethodName ??
        item.paymentMethodName ??
        order.paymentMethod ??
        item.paymentMethod ??
        "",
    ).trim(),
    paymentMethodDetail: String(
      order.paymentMethodDetail ?? item.paymentMethodDetail ?? "",
    ).trim(),
    paymentGateway: String(
      order.paymentGateway ??
        item.paymentGateway ??
        order.paymentChannelName ??
        item.paymentChannelName ??
        order.paymentChannel ??
        item.paymentChannel ??
        "",
    ).trim(),
    cardLast4: String(order.cardLast4 ?? item.cardLast4 ?? "").trim(),
    paidAt: String(
      order.paidTime ??
        item.paidTime ??
        order.paymentTime ??
        item.paymentTime ??
        order.payTime ??
        item.payTime ??
        "",
    ).trim(),
    receiptUrl: String(
      order.receiptUrl ??
        item.receiptUrl ??
        order.payment?.receiptUrl ??
        item.payment?.receiptUrl ??
        "",
    ).trim(),
    serviceAmountText: parseMoneyText(item, [
      "serviceAmountWithTax",
      "serviceAmount",
      "baseAmountWithTax",
      "baseAmount",
      "skuAmount",
    ]),
    subtotalText: parseMoneyText(item, [
      "subtotalText",
      "subtotal",
      "subtotalAmount",
      "amountWithoutTax",
    ]),
    taxText: parseMoneyText(item, ["taxText", "taxAmount", "vatAmount", "vat"]),
    amountText: parseAmountText(item),
    createdAt: String(
      order.orderTime ??
        item.orderTime ??
        order.createTime ??
        item.createTime ??
        "",
    ).trim(),
    lineItems: parseLineItems(item),
    refundInfo: parseRefundInfo(item),
  }
}

const preferPopulatedText = (primary: string, fallback: string) => {
  const value = String(primary ?? "").trim()
  return value && value !== "-" ? value : fallback
}

const normalizeOrderDetail = (payload: any, fallback: OrderRow): OrderRow => {
  const root = payload?.data ?? payload ?? {}
  const detailCustomerName = deDuplicateCustomerName(
    [root.firstName, root.lastName]
      .map(normalizeCustomerNamePart)
      .filter(Boolean)
      .join(" ") ||
      String(
        root.customerName ?? root.contactName ?? root.recipientName ?? "",
      ).trim() ||
      fallback.customerName,
  )
  const rawLineItems = Array.isArray(root.lineItems) ? root.lineItems : []
  const sumLineItemAmount = (
    field: "amountWithTax" | "amountWithoutTax" | "taxAmount",
  ) => {
    const values = rawLineItems
      .map((lineItem: any) => Number(lineItem?.[field]))
      .filter((value: number) => Number.isFinite(value))
    return values.length
      ? values.reduce((total: number, value: number) => total + value, 0)
      : undefined
  }
  const attachItems = Array.isArray(root.attachItems)
    ? root.attachItems
    : fallback.attachDetailsText && fallback.attachDetailsText !== "-"
      ? [fallback.attachDetailsText]
      : []
  const parsed = parseOrderRow({
    ...fallback,
    ...root,
    orderId: root.orderId ?? fallback.orderId,
    orderNo: root.orderNo ?? fallback.orderNo,
    productName: fallback.productName || root.productName,
    specDesc: root.specDesc ?? fallback.specDescText,
    attachItems,
    serviceAddress: root.serviceAddress ?? fallback.serviceAddress,
    building: root.building ?? fallback.building,
    roomNo: root.roomNo ?? fallback.roomNo,
    community: root.community ?? fallback.community,
    rescheduled: root.rescheduled ?? fallback.rescheduled,
    rescheduleRead: root.rescheduleRead ?? fallback.rescheduleRead,
    serviceTime: root.serviceTime ?? fallback.serviceTime,
    timeRange: root.timeRange ?? fallback.timeRange,
    contactPhone: root.contactPhone ?? fallback.contactPhone,
    contactEmail: root.contactEmail ?? fallback.contactEmail,
    firstName: normalizeCustomerNamePart(root.firstName) || fallback.firstName,
    lastName: normalizeCustomerNamePart(root.lastName) || fallback.lastName,
    customerName: detailCustomerName,
    customerEmail: root.userEmail ?? fallback.customerEmail,
    userEmail: root.userEmail ?? fallback.userEmail,
    customerRemark: root.remark ?? fallback.customerRemark,
    cancelReason:
      root.cancelReason ?? root.cancellationReason ?? fallback.cancelReason,
    cancelReasonRemark:
      root.cancelReasonRemark ??
      root.cancellationRemark ??
      fallback.cancelReasonRemark,
    cancelledAt:
      root.cancelledAt ??
      root.canceledAt ??
      root.cancelTime ??
      fallback.cancelledAt,
    orderTime: root.orderTime ?? fallback.createdAt,
    paymentGateway: root.paymentGateway ?? fallback.paymentGateway,
    paymentMethod: fallback.paymentMethod,
    paymentMethodDetail:
      root.paymentMethodDetail ?? fallback.paymentMethodDetail,
    cardLast4: root.cardLast4 ?? fallback.cardLast4,
    paidTime: root.paidTime ?? fallback.paidAt,
    receiptUrl:
      root.receiptUrl ?? root.payment?.receiptUrl ?? fallback.receiptUrl,
    amountWithTax:
      root.amountWithTax ??
      sumLineItemAmount("amountWithTax") ??
      fallback.amountText,
    amountWithoutTax:
      root.amountWithoutTax ??
      sumLineItemAmount("amountWithoutTax") ??
      fallback.subtotalText,
    taxAmount:
      root.taxAmount ?? sumLineItemAmount("taxAmount") ?? fallback.taxText,
    orderStatus: root.orderStatus ?? fallback.orderStatusCode,
    paymentStatus: root.paymentStatus ?? fallback.paymentStatusCode,
  })
  const lineItems = parsed.lineItems.map((lineItem) => {
    const type = lineItem.lineType.toUpperCase()
    if (
      fallback.productName &&
      (type.includes("SERVICE") ||
        type.includes("PRODUCT") ||
        type.includes("SKU"))
    ) {
      return { ...lineItem, name: fallback.productName }
    }
    return lineItem
  })
  const serviceLineItem =
    lineItems.find((lineItem) => {
      const type = lineItem.lineType.toUpperCase()
      return (
        type.includes("SERVICE") ||
        type.includes("PRODUCT") ||
        type.includes("SKU")
      )
    }) ??
    lineItems.find((lineItem) => {
      const type = lineItem.lineType.toUpperCase()
      return !type.includes("ADD") && !type.includes("ATTACH")
    })

  return {
    ...fallback,
    ...parsed,
    orderStatusCode: parsed.orderStatusCode ?? fallback.orderStatusCode,
    paymentStatusCode: parsed.paymentStatusCode ?? fallback.paymentStatusCode,
    orderStatusText: preferPopulatedText(
      parsed.orderStatusText,
      fallback.orderStatusText,
    ),
    paymentStatusText: preferPopulatedText(
      parsed.paymentStatusText,
      fallback.paymentStatusText,
    ),
    paymentIntentId: preferPopulatedText(
      parsed.paymentIntentId,
      fallback.paymentIntentId,
    ),
    supplierName: preferPopulatedText(
      parsed.supplierName,
      fallback.supplierName,
    ),
    serviceAmountText: serviceLineItem
      ? serviceLineItem.amountWithTaxText
      : preferPopulatedText(
          parsed.serviceAmountText,
          fallback.serviceAmountText,
        ),
    lineItems,
  }
}

const normalizeOptionalParam = (value: unknown) => {
  if (value === null || value === undefined) return ""
  const text = String(value).trim()
  if (!text) return ""
  const lower = text.toLowerCase()
  if (lower === "undefined" || lower === "null") return ""
  return text
}

const normalizeOptionalNumberParam = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const requestPayload = computed(() => {
  const payload: Record<string, any> = {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
  }

  const orderNo = normalizeOptionalParam(query.orderNo)
  if (orderNo) payload.orderNo = orderNo

  const customerName = normalizeOptionalParam(query.customerName)
  if (customerName) payload.customerName = customerName

  const contactPhone = normalizeOptionalParam(query.contactPhone)
  if (contactPhone) payload.contactPhone = contactPhone

  if (query.productIds.length) payload.productIds = [...query.productIds]

  const [rawServiceTimeStart = "", rawServiceTimeEnd = ""] = Array.isArray(
    query.serviceTimeRange,
  )
    ? query.serviceTimeRange
    : ["", ""]
  const serviceTimeStart = normalizeOptionalParam(rawServiceTimeStart)
  const serviceTimeEnd = normalizeOptionalParam(rawServiceTimeEnd)
  if (serviceTimeStart) payload.serviceTimeStart = serviceTimeStart
  if (serviceTimeEnd) payload.serviceTimeEnd = serviceTimeEnd

  if (query.orderStatuses.length) {
    payload.orderStatuses = query.orderStatuses.filter(Number.isInteger)
  }

  if (query.paymentStatuses.length) {
    payload.paymentStatuses = query.paymentStatuses.filter(Number.isInteger)
  }

  payload.rescheduleFilter = query.rescheduleFilter
  if (query.serviceTimeSort) {
    payload.sortField = "serviceTime"
    payload.sortOrder =
      query.serviceTimeSort === "SERVICE_TIME_ASC" ? "ASC" : "DESC"
  }

  return payload
})

const sortOrdersByServiceTime = (rows: OrderRow[]) => {
  if (!query.serviceTimeSort) return rows

  const direction = query.serviceTimeSort === "SERVICE_TIME_ASC" ? 1 : -1
  return [...rows].sort((left, right) => {
    const leftDate = parseServiceDate(left.serviceTime)
    const rightDate = parseServiceDate(right.serviceTime)
    if (!leftDate && !rightDate) return 0
    if (!leftDate) return 1
    if (!rightDate) return -1
    return (leftDate.getTime() - rightDate.getTime()) * direction
  })
}

const fetchOrders = async () => {
  tableLoading.value = true
  try {
    const res = await page(requestPayload.value)
    const parsed = normalizePage(res)
    orders.value = sortOrdersByServiceTime(
      (parsed.list || []).map(parseOrderRow),
    )
    total.value = parsed.total
    query.pageNum = parsed.pageNum
    query.pageSize = parsed.pageSize
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.orders.message.fetchFailed"))
  } finally {
    tableLoading.value = false
  }
}

const openRemarkDialog = (row: OrderRow) => {
  if (!row.orderId) {
    ElMessage.warning(t("admin.orders.message.remarkOrderIdMissing"))
    return
  }
  remarkForm.orderId = row.orderId
  remarkForm.orderNo = row.orderNo
  remarkForm.adminRemark = row.adminRemark || ""
  remarkDialogVisible.value = true
}

const submitRemark = async () => {
  if (!remarkForm.orderId) {
    ElMessage.warning(t("admin.orders.message.remarkOrderIdMissing"))
    return
  }
  remarkSubmitting.value = true
  try {
    await updateAdminRemark({
      orderId: remarkForm.orderId,
      adminRemark: remarkForm.adminRemark || "",
    })
    ElMessage.success(t("admin.orders.message.remarkSaveSuccess"))
    remarkDialogVisible.value = false
    const target = orders.value.find(
      (item) => item.orderId === remarkForm.orderId,
    )
    if (target) target.adminRemark = remarkForm.adminRemark || ""
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.orders.message.remarkSaveFailed"),
    )
  } finally {
    remarkSubmitting.value = false
  }
}

const normalizeSupplierOptions = (payload: any): SupplierOption[] => {
  const root = payload?.data ?? payload ?? {}
  const records = Array.isArray(root)
    ? root
    : Array.isArray(root.list)
      ? root.list
      : Array.isArray(root.records)
        ? root.records
        : Array.isArray(root.options)
          ? root.options
          : Array.isArray(root.data)
            ? root.data
            : []

  return records
    .map((item: any) => {
      const supplier = item?.supplier ?? item ?? {}
      const id =
        supplier.id ??
        supplier.supplierId ??
        supplier.value ??
        item?.id ??
        item?.supplierId ??
        item?.value
      const nameI18n = (supplier.nameI18n ??
        supplier.supplierNameI18n ??
        item?.nameI18n ??
        item?.supplierNameI18n ??
        {}) as I18nText
      const supplierName = pickI18nValue(
        nameI18n,
        String(
          supplier.supplierName ??
            supplier.name ??
            supplier.label ??
            item?.supplierName ??
            item?.name ??
            item?.label ??
            "",
        ).trim(),
      )
      if (id === null || id === undefined || !supplierName) return null
      return { id, supplierName }
    })
    .filter((item: SupplierOption | null): item is SupplierOption => !!item)
}

const loadSupplierOptions = async (keyword = "") => {
  supplierLoading.value = true
  try {
    const supplierName = normalizeOptionalParam(keyword)
    const res = await querySuppliers({
      pageNum: 1,
      pageSize: 500,
      ...(supplierName ? { supplierName } : {}),
    })
    const nextOptions = normalizeSupplierOptions(res)
    const selectedIds = new Set(assignForm.supplierIds.map((id) => String(id)))
    const kept = supplierOptions.value.filter((item) =>
      selectedIds.has(String(item.id)),
    )
    const merged = [...kept]
    nextOptions.forEach((item) => {
      if (!merged.some((option) => String(option.id) === String(item.id))) {
        merged.push(item)
      }
    })
    supplierOptions.value = merged
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.orders.message.supplierFetchFailed"),
    )
  } finally {
    supplierLoading.value = false
  }
}

const closeSupplierView = () => {
  supplierViewRequestId.value++
  supplierViewLoading.value = false
}

const openSupplierView = async (row: OrderRow) => {
  const requestId = ++supplierViewRequestId.value
  supplierViewOrderNo.value = row.orderNo
  supplierViewInfo.value = {
    supplierName:
      row.supplierName || (row.supplierId ? `#${row.supplierId}` : ""),
    contactInfo: "",
  }
  supplierViewError.value = ""
  supplierViewLoading.value = false
  supplierViewVisible.value = true
  if (!row.supplierId) return

  supplierViewLoading.value = true
  try {
    const response = await getSupplierDetail(row.supplierId)
    if (requestId !== supplierViewRequestId.value) return
    supplierViewInfo.value = normalizeSupplierCopyInfo(
      response,
      supplierViewInfo.value.supplierName,
    )
  } catch (error: any) {
    if (requestId === supplierViewRequestId.value) {
      supplierViewError.value =
        error?.message || t("admin.orders.supplierView.loadFailed")
    }
  } finally {
    if (requestId === supplierViewRequestId.value)
      supplierViewLoading.value = false
  }
}

const openAssignDialog = async (row: OrderRow) => {
  if (isSupplierReadOnly(row)) {
    assignDialogVisible.value = false
    assignTarget.value = null
    return openSupplierView(row)
  }
  if (!row.orderId) {
    ElMessage.warning(t("admin.orders.message.assignOrderIdMissing"))
    return
  }
  bulkAssignMode.value = false
  bulkAssignTargets.value = []
  assignTarget.value = row
  const suppliers = row.suppliers?.length
    ? row.suppliers
    : row.supplierId
      ? [{ id: row.supplierId, supplierName: row.supplierName }]
      : []
  assignForm.orderId = row.orderId
  assignForm.orderNo = row.orderNo
  assignForm.supplierIds = suppliers.map((supplier) => supplier.id)
  assignSupplierPreview.value = {
    supplierName: row.supplierName || "",
    contactInfo: "",
  }
  supplierOptions.value = suppliers.filter((supplier) => supplier.supplierName)
  assignDialogVisible.value = true
  await loadSupplierOptions()
  if (suppliers.length !== 1 || !suppliers[0]?.id) return
  try {
    assignSupplierPreview.value = normalizeSupplierCopyInfo(
      await getSupplierDetail(suppliers[0].id),
      suppliers[0].supplierName,
    )
  } catch {
    assignSupplierPreview.value = {
      supplierName: row.supplierName || "",
      contactInfo: "",
    }
  }
}

const openBulkAssignDialog = async () => {
  const targets = selectedRows.value.filter((row) => row.orderId)
  if (targets.some(isSupplierReadOnly)) {
    ElMessage.warning(t("admin.orders.message.supplierReadOnly"))
    return
  }
  if (!targets.length) {
    ElMessage.warning(t("admin.orders.message.bulkNoValidOrders"))
    return
  }
  bulkAssignMode.value = true
  assignTarget.value = null
  bulkAssignTargets.value = targets
  assignForm.orderId = null
  assignForm.orderNo = ""
  assignForm.supplierIds = []
  supplierOptions.value = []
  assignDialogVisible.value = true
  await loadSupplierOptions()
}

const submitSupplierAssignment = async () => {
  if (assignSubmitting.value || !assignDialogVisible.value) return
  const targets = bulkAssignMode.value
    ? bulkAssignTargets.value
    : assignTarget.value
      ? [assignTarget.value]
      : []
  if (!targets.length) return
  // 提交时再次检查当前行状态，避免通过批量入口或旧弹窗修改只读订单。
  if (
    targets.some((target) =>
      isSupplierReadOnly(
        orders.value.find((row) => row.orderId === target.orderId) || target,
      ),
    )
  ) {
    ElMessage.warning(t("admin.orders.message.supplierReadOnly"))
    return
  }
  if (!bulkAssignMode.value && !assignForm.orderId) {
    ElMessage.warning(t("admin.orders.message.assignOrderIdMissing"))
    return
  }
  assignSubmitting.value = true
  try {
    const supplierIds = assignForm.supplierIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id))
    const selectedSuppliers = supplierIds.map((id) => {
      const matched = supplierOptions.value.find(
        (item) => Number(item.id) === id,
      )
      return {
        id,
        supplierName: matched?.supplierName || "",
      }
    })
    const supplierName = selectedSuppliers
      .map((supplier) => supplier.supplierName)
      .filter(Boolean)
      .join("、")
    const applySelection = (row: OrderRow): OrderRow => ({
      ...row,
      supplierId: selectedSuppliers[0]?.id ?? null,
      supplierName,
      suppliers: selectedSuppliers,
    })
    if (bulkAssignMode.value) {
      const results = await Promise.allSettled(
        bulkAssignTargets.value.map((row) =>
          updateSupplier({
            orderId: row.orderId as number,
            supplierIds,
          }),
        ),
      )
      const failedIds = new Set(
        results.flatMap((result, index) =>
          result.status === "rejected"
            ? [bulkAssignTargets.value[index]?.orderId]
            : [],
        ),
      )
      const failed = failedIds.size
      const success = results.length - failed
      if (failed === 0) {
        ElMessage.success(
          t("admin.orders.message.bulkAssignSuccess", { count: success }),
        )
      } else if (success > 0) {
        ElMessage.warning(
          t("admin.orders.message.bulkAssignPartial", { success, failed }),
        )
      } else {
        ElMessage.error(t("admin.orders.message.assignFailed"))
      }
      assignDialogVisible.value = false
      await fetchOrders()
      orders.value = orders.value.map((row) =>
        targets.some((target) => target.orderId === row.orderId) &&
        !failedIds.has(row.orderId)
          ? applySelection(row)
          : row,
      )
    } else {
      await updateSupplier({
        orderId: assignForm.orderId as number,
        supplierIds,
      })
      ElMessage.success(
        t(
          supplierIds.length
            ? "admin.orders.message.assignSuccess"
            : "admin.orders.message.unassignSuccess",
        ),
      )
      assignDialogVisible.value = false
      await fetchOrders()
      orders.value = orders.value.map((row) =>
        targets.some((target) => target.orderId === row.orderId)
          ? applySelection(row)
          : row,
      )
    }
    const current = detailRow.value
    if (
      current?.orderId &&
      targets.some((row) => row.orderId === current.orderId)
    ) {
      const fresh = orders.value.find((row) => row.orderId === current.orderId)
      if (fresh) {
        detailRow.value = {
          ...current,
          supplierId: fresh.supplierId,
          supplierName: fresh.supplierName,
          suppliers: fresh.suppliers,
        }
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.orders.message.assignFailed"))
  } finally {
    assignSubmitting.value = false
  }
}

const handleBulkMarkCompleted = async () => {
  const targets = selectedRows.value.filter((row) => row.orderId)
  if (!targets.length) {
    ElMessage.warning(t("admin.orders.message.bulkNoValidOrders"))
    return
  }
  const pending = targets.filter((row) => row.orderStatusCode !== 2)
  if (!pending.length) {
    ElMessage.info(t("admin.orders.message.bulkCompleteNoOrders"))
    return
  }

  try {
    await ElMessageBox.confirm(
      t("admin.orders.message.bulkCompleteConfirm", { count: pending.length }),
      t("admin.orders.message.bulkCompleteConfirmTitle"),
      { type: "warning" },
    )
  } catch {
    return
  }

  bulkCompleting.value = true
  try {
    const results = await Promise.allSettled(
      pending.map((row) =>
        updateOrderStatus({
          orderId: row.orderId as number,
          orderStatus: 2,
        }),
      ),
    )
    const failed = results.filter(
      (result) => result.status === "rejected",
    ).length
    const success = results.length - failed
    if (failed === 0) {
      ElMessage.success(
        t("admin.orders.message.bulkCompleteSuccess", { count: success }),
      )
    } else if (success > 0) {
      ElMessage.warning(
        t("admin.orders.message.bulkCompletePartial", { success, failed }),
      )
    } else {
      ElMessage.error(t("admin.orders.message.statusUpdateFailed"))
    }
    await fetchOrders()
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.orders.message.statusUpdateFailed"),
    )
  } finally {
    bulkCompleting.value = false
  }
}

const normalizeSupplierCopyInfo = (payload: any, fallbackName = "") => {
  const root = payload?.data ?? payload ?? {}
  const supplier = root?.supplier ?? root
  const nameI18n = (root?.nameI18n ??
    root?.supplierNameI18n ??
    supplier?.nameI18n ??
    supplier?.supplierNameI18n ??
    {}) as I18nText
  return {
    supplierName: pickI18nValue(
      nameI18n,
      String(supplier?.supplierName ?? supplier?.name ?? fallbackName).trim(),
    ),
    contactInfo: String(supplier?.contactInfo ?? "").trim(),
  }
}

const writeClipboardText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall back to the selection-based copy flow when clipboard permission is unavailable.
    }
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  textarea.remove()
  if (!copied) {
    throw new Error(t("admin.orders.message.copySupplierFailed"))
  }
}

const formatCopyField = (label: string, value: unknown) => {
  const normalizedLabel = String(label || "")
    .trim()
    .replace(/[：:]$/, "")
  const rawValue = String(value ?? "").trim()
  const normalizedValue = rawValue === "-" ? "" : rawValue
  const separator = locale.value === "zh" ? "：" : ": "
  return `${normalizedLabel}${separator}${normalizedValue}`
}

const copySupplierInfo = async (row: OrderRow) => {
  copyingOrderId.value = row.id
  try {
    const supplier = row.supplierId
      ? normalizeSupplierCopyInfo(
          await getSupplierDetail(row.supplierId),
          row.supplierName,
        )
      : {
          supplierName: row.supplierName || "",
          contactInfo: "",
        }
    const content = [
      formatCopyField(t("admin.orders.table.orderNo"), row.orderNo),
      formatCopyField(t("admin.orders.table.productName"), row.productName),
      formatCopyField(t("admin.orders.table.specDesc"), row.specDescText),
      formatCopyField(
        t("admin.orders.table.attachDetails"),
        row.attachDetailsText,
      ),
      formatCopyField(
        t("admin.orders.table.serviceAddress"),
        row.serviceAddress,
      ),
      formatCopyField(
        t("admin.orders.copyFields.servicePhone"),
        row.contactPhone,
      ),
      formatCopyField(t("admin.orders.table.serviceTime"), row.serviceTime),
      formatCopyField(
        t("admin.supplier.table.supplierName"),
        supplier.supplierName,
      ),
      formatCopyField(
        t("admin.supplier.table.contactInfo"),
        supplier.contactInfo,
      ),
    ].join("\n")
    await writeClipboardText(content)
    ElMessage.success(t("admin.orders.message.copySupplierSuccess"))
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.orders.message.copySupplierFailed"),
    )
  } finally {
    copyingOrderId.value = null
  }
}

const getExportFileName = () => {
  const now = new Date()
  const date = [
    now.getFullYear(),
    `${now.getMonth() + 1}`.padStart(2, "0"),
    `${now.getDate()}`.padStart(2, "0"),
  ].join("")
  const time = [
    `${now.getHours()}`.padStart(2, "0"),
    `${now.getMinutes()}`.padStart(2, "0"),
    `${now.getSeconds()}`.padStart(2, "0"),
  ].join("")
  return `orders-${date}-${time}.xlsx`
}

const handleSelectionChange = (rows: OrderRow[]) => {
  selectedRows.value = Array.isArray(rows) ? rows : []
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const getCurrentExportFilters = (): OrderExportPayload => ({
  ...requestPayload.value,
})

const handleExport = async (filters: OrderExportPayload) => {
  exportLoading.value = true
  try {
    const response = await exportOrders(filters)
    const rawBlob =
      response instanceof Blob ? response : (response as any)?.data
    if (!(rawBlob instanceof Blob)) {
      throw new Error(t("admin.orders.message.exportInvalidFile"))
    }
    if (rawBlob.size === 0) {
      throw new Error(t("admin.orders.message.exportInvalidFile"))
    }
    if (rawBlob.type.includes("json")) {
      const text = await rawBlob.text()
      let message = t("admin.orders.message.exportFailed")
      try {
        const payload = JSON.parse(text)
        message = payload?.message || payload?.msg || message
      } catch {
        message = text || message
      }
      throw new Error(message)
    }

    downloadBlob(rawBlob, getExportFileName())
    ElMessage.success(t("admin.orders.message.exportSuccess"))
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.orders.message.exportFailed"))
  } finally {
    exportLoading.value = false
  }
}

const handleExportSelected = async () => {
  const orderIds = selectedRows.value
    .map((row) => row.orderId)
    .filter((orderId): orderId is number => Number.isFinite(orderId))
  if (!orderIds.length) {
    ElMessage.warning(t("admin.orders.message.exportNoData"))
    return
  }
  await handleExport({ orderIds })
}

const handleExportCommand = async (command: "current" | "all" | "date") => {
  const filters = getCurrentExportFilters()
  if (command === "current") {
    if (!orders.value.length) {
      ElMessage.warning(t("admin.orders.message.exportNoData"))
      return
    }
    await handleExport({
      ...filters,
      exportScope: "CURRENT_PAGE",
      pageNum: query.pageNum,
      pageSize: query.pageSize,
    })
    return
  }
  if (command === "all") {
    await handleExport({
      ...filters,
      exportScope: "ALL",
    })
    return
  }
  const [serviceTimeStart, serviceTimeEnd] = query.serviceTimeRange
  if (!serviceTimeStart || !serviceTimeEnd) {
    ElMessage.warning(t("admin.orders.message.exportDateRequired"))
    return
  }
  await handleExport({
    ...filters,
    exportScope: "SERVICE_DATE",
    serviceTimeStart,
    serviceTimeEnd,
  })
}

const loadServiceOptions = async () => {
  try {
    const response = await pageServices({ pageNum: 1, pageSize: 500 })
    const root = response?.data ?? response ?? {}
    const list = Array.isArray(root)
      ? root
      : Array.isArray(root.list)
        ? root.list
        : Array.isArray(root.records)
          ? root.records
          : []
    serviceOptions.value = list
      .map((entry: any) => {
        const item = entry?.productSpu ?? entry?.spu ?? entry ?? {}
        const value = Number(item.id ?? item.spuId ?? item.productId)
        const label = pickI18nValue(
          item.nameI18n ?? item.spuNameI18n ?? entry?.nameI18n ?? {},
          String(item.spuName ?? item.productName ?? item.name ?? "").trim(),
        )
        return Number.isFinite(value) && label ? { value, label } : null
      })
      .filter(
        (
          item: { value: number; label: string } | null,
        ): item is {
          value: number
          label: string
        } => Boolean(item),
      )
  } catch {
    serviceOptions.value = []
  }
}

const handleSearch = () => {
  query.pageNum = 1
  fetchOrders()
}

const reset = () => {
  query.orderNo = ""
  query.customerName = ""
  query.contactPhone = ""
  query.productIds = []
  query.serviceTimeRange = []
  query.orderStatuses = []
  query.paymentStatuses = []
  query.rescheduleFilter = "ALL"
  query.serviceTimeSort = ""
  query.pageNum = 1
  query.pageSize = 10
  fetchOrders()
}

const onPageChange = (pageNum: number) => {
  query.pageNum = pageNum
  fetchOrders()
}

const onSizeChange = (pageSize: number) => {
  query.pageSize = pageSize
  query.pageNum = 1
  fetchOrders()
}

onMounted(() => {
  void loadServiceOptions()
  void fetchOrders()
})
</script>

<style scoped>
.refund-reason-form {
  margin-top: 18px;
}
.page {
  --el-font-size-base: 12px;
  --el-component-size: 30px;
  --el-component-size-small: 26px;
  padding: 12px;
  font-size: 12px;
}
.page > :deep(.el-card) {
  --el-card-padding: 12px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.table-stack {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1.35;
}
.table-stack strong {
  color: #05152b;
  font-weight: 700;
}
.table-stack span,
.table-stack small {
  color: #64748b;
  overflow-wrap: anywhere;
}
.table-stack__ellipsis {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-stack .spec-remark-text {
  color: #8a5b12;
}
.reschedule-compact {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
.reschedule-compact > span,
.reschedule-history__index {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 10px;
  font-weight: 800;
  flex: 0 0 auto;
}
.reschedule-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reschedule-history__order {
  margin: 0 0 2px;
  color: #64748b;
  font-size: 12px;
}
.reschedule-history__order strong {
  color: #2f7ee0;
}
.reschedule-history__item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}
.reschedule-history__item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.reschedule-history__item strong {
  color: #334155;
  font-size: 12px;
}
.reschedule-history__item p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.export-caret {
  margin-left: 6px;
  font-size: 14px;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.toolbar-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.toolbar-time {
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar-time__label {
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
}
.toolbar .el-input,
.toolbar .el-select,
.toolbar .el-date-editor {
  width: 160px;
}
.toolbar-time .el-date-editor {
  width: 250px;
}
.bulk-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 16px;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  background: #f8fafc;
}
.bulk-bar__count {
  font-weight: 700;
  color: #05152b;
}
.bulk-bar__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #64748b;
}
.bulk-bar__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.bulk-bar__actions .el-button + .el-button {
  margin-left: 0;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.order-number-link {
  height: auto;
  padding: 0;
  font-weight: 600;
}
.order-reschedule-alert {
  margin-left: 8px;
  vertical-align: middle;
}
.service-day-label {
  width: fit-content;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2f7;
  color: #526176;
  font-size: 12px;
  font-weight: 700;
}
.service-day-label--today {
  background: #fff0d5;
  color: #9a5700;
}
.service-day-label--tomorrow {
  background: #e8f2ff;
  color: #185ca8;
}
.order-status-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  padding: 7px 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafbfc;
  color: #606266;
  font-size: 12px;
}
.order-status-legend strong {
  margin-right: 4px;
}
.order-status-legend__item {
  padding: 2px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  background-color: var(--order-status-bg);
}
.order-status--neutral,
:deep(.el-table__body tr.order-status--neutral) {
  --order-status-bg: #ffffff;
}
.order-status--action-needed,
:deep(.el-table__body tr.order-status--action-needed) {
  --order-status-bg: #e7f6ec;
}
.order-status--completed,
:deep(.el-table__body tr.order-status--completed) {
  --order-status-bg: #e8f2ff;
}
.order-status--closed,
:deep(.el-table__body tr.order-status--closed) {
  --order-status-bg: #e5e7eb;
}
/* 固定列与悬停行同样使用订单状态底色，不被表格默认背景覆盖。 */
.orders-table :deep(.el-table__body tr > td.el-table__cell) {
  background-color: var(--order-status-bg, #ffffff) !important;
}
.orders-table :deep(.el-table__cell) {
  padding: 6px 0;
  font-size: 12px;
}
.orders-table :deep(.el-table__header .cell) {
  line-height: 1.3;
  word-break: normal;
}
.orders-table :deep(.el-table__body .cell) {
  line-height: 1.4;
}
.orders-table :deep(.el-button.is-link) {
  height: 24px;
  padding: 0 3px;
  font-size: 12px;
}
.order-table-actions,
.supplier-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}
.order-table-actions :deep(.el-button + .el-button),
.supplier-cell :deep(.el-button + .el-button) {
  margin-left: 0;
}
.supplier-cell > span {
  display: block;
  width: 100%;
  overflow: hidden;
  color: #606266;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.orders-table :deep(.el-tag) {
  height: 22px;
  padding: 0 7px;
  font-size: 11px;
}
.supplier-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-wrap: anywhere;
}
.supplier-view p {
  margin: 0;
  color: #606266;
}
:deep(.el-table__body tr.order-row--rescheduled-unread .order-number-link) {
  color: #dc2626;
}
:deep(.orders-table .el-table__body tr.order-row--rescheduled-unread > td.el-table__cell) {
  background: #fdeaea !important;
}
.order-status-select {
  width: 102px;
}
.order-status-select--action-needed :deep(.el-select__wrapper) {
  background: #eefaf0;
  box-shadow: 0 0 0 1px #bfe8cb inset;
}
.order-status-select--completed :deep(.el-select__wrapper) {
  background: #eaf2ff;
  box-shadow: 0 0 0 1px #cfe2fb inset;
}
.order-status-select--closed :deep(.el-select__wrapper) {
  background: #f2f2f4;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
.order-number-link {
  display: block;
  max-width: 104px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.order-detail {
  min-height: 100%;
  padding: 4px;
  color: #05152b;
}
.order-detail__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 4px 2px 20px;
}
.order-detail__toolbar {
  margin: 14px 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.order-detail__panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.order-detail__panel-title h3 {
  margin: 0;
}
.detail-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.detail-edit-section {
  padding: 18px;
  border: 1px solid #e3eaf2;
  border-radius: 16px;
  background: #fbfcfe;
}
.detail-edit-section + .detail-edit-section {
  margin-top: 16px;
}
.detail-edit-section h4 {
  margin: 0 0 16px;
  color: #05152b;
  font-size: 15px;
}
.detail-edit-section :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
:deep(.order-detail-edit-dialog .el-date-editor.el-input),
:deep(.order-detail-edit-dialog .el-select) {
  width: 100%;
}
@media print {
  :global(body *) {
    visibility: hidden;
  }
  .order-detail,
  .order-detail * {
    visibility: visible;
  }
  .order-detail {
    position: absolute;
    inset: 0;
    width: 100%;
    background: #fff;
  }
  .order-detail__toolbar {
    display: none;
  }
}
.order-detail__eyebrow {
  margin-bottom: 4px;
  color: #7a8494;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.order-detail__title {
  margin: 0;
  color: #05152b;
  font-size: 28px;
  line-height: 1.2;
}
.order-detail__booked-at {
  margin: 8px 0 0;
  color: #697386;
  font-size: 13px;
}
.order-detail__amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  color: #7a8494;
  font-size: 12px;
}
.order-detail__amount strong {
  color: #0b8f55;
  font-size: 22px;
}
.order-detail__status-bar,
.order-detail__panel {
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 3px 12px rgb(5 21 43 / 5%);
}
.order-detail__status-bar {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
  padding: 13px 18px;
}
.order-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.order-detail__columns {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr);
  gap: 18px;
}
.order-detail__stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.order-detail__panel {
  padding: 18px 20px;
}
.order-detail__panel h3 {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf0f4;
  color: #05152b;
  font-size: 16px;
}
.order-detail__service-heading,
.order-detail__summary-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.order-detail__service-heading {
  margin-bottom: 16px;
  font-size: 15px;
}
.order-detail__list,
.order-detail__payment-grid {
  margin: 0;
}
.order-detail__list > div + div {
  margin-top: 13px;
}
.order-detail__list dt,
.order-detail__payment-grid dt {
  margin-bottom: 5px;
  color: #8791a1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.order-detail__list dd,
.order-detail__payment-grid dd {
  margin: 0;
  color: #303b4b;
  font-size: 13px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.order-detail__schedule {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #edf0f4;
  color: #7a8494;
  font-size: 12px;
}
.order-detail__schedule strong {
  color: var(--hx-champagne-600, #a97b38);
  font-size: 15px;
}
.order-detail__line-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf0f4;
}
.order-detail__line-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #f7f9fc;
}
.order-detail__line-item-main,
.order-detail__line-item-amount {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-detail__line-item-main span {
  align-self: flex-start;
  padding: 2px 7px;
  border-radius: 999px;
  background: #e8eef7;
  color: #52627a;
  font-size: 10px;
  font-weight: 700;
}
.order-detail__line-item-amount {
  align-items: flex-end;
  color: #05152b;
  text-align: right;
}
.order-detail__line-item-amount small {
  color: #8791a1;
  font-size: 11px;
  line-height: 1.45;
}
.order-detail__summary-row--total {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf0f4;
  color: #05152b;
  font-size: 15px;
}
.order-detail__summary-row
  + .order-detail__summary-row:not(.order-detail__summary-row--total) {
  margin-top: 10px;
}
.order-detail__summary-row--total strong {
  color: #0b8f55;
  font-size: 18px;
}
.order-detail__note {
  min-height: 76px;
  padding: 13px 14px;
  border: 1px solid #e9edf2;
  border-radius: 7px;
  background: #fafbfc;
  color: #5f6978;
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.order-detail__list--customer > div + div {
  margin-top: 14px;
}
.order-detail__payment {
  margin-top: 18px;
}
.order-detail__payment-grid,
.order-detail__refund-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 20px;
}
.order-detail__refund {
  margin-top: 18px;
  border-color: #f0d7a6;
  background: #fffdf8;
}
.order-detail__refund-grid {
  margin: 0;
}
.order-detail__refund-grid dt {
  margin-bottom: 5px;
  color: #8791a1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.order-detail__refund-grid dd {
  margin: 0;
  color: #303b4b;
  font-size: 13px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.order-detail__refund-reason {
  grid-column: span 2;
}
.order-detail__success {
  color: #0b8f55 !important;
  font-weight: 700;
}
.order-detail__payment-method {
  display: flex;
  gap: 6px;
  margin-top: 16px;
  color: #8791a1;
  font-size: 12px;
}
.order-detail__payment-method strong {
  color: #303b4b;
}
@media (max-width: 760px) {
  .page {
    padding: 12px;
  }
  .order-detail__hero {
    flex-direction: column;
  }
  .order-detail__amount {
    align-items: flex-start;
  }
  .order-detail__status-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
  .order-detail__columns,
  .order-detail__payment-grid,
  .order-detail__refund-grid {
    grid-template-columns: 1fr;
  }
  .order-detail__refund-reason {
    grid-column: auto;
  }
  .order-detail__panel {
    padding: 16px;
  }
  .order-detail__toolbar {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .detail-edit-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .detail-edit-section {
    padding: 14px;
  }
  .order-detail__line-item {
    flex-direction: column;
  }
  .order-detail__line-item-amount {
    align-items: flex-start;
    text-align: left;
  }
}


.page--h5 {
  max-width: 100%;
  min-height: 100%;
  overflow-x: hidden;
  background: #e7ebf0;
}

.orders-h5 {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 48px);
  min-height: calc(100dvh - 48px);
  color: #102033;
}

.orders-h5__bar {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(231, 235, 240, 0.92);
  backdrop-filter: blur(10px);
}

.orders-h5__search {
  flex: 1;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.orders-h5__filter,
.orders-h5__pager button,
.orders-h5__ghost,
.orders-h5__solid,
.h5-nav {
  border: 0;
  background: transparent;
  font: inherit;
}

.orders-h5__filter {
  flex: 0 0 auto;
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: #05152b;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.orders-h5__count {
  margin: 0;
  color: #6d7c8f;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.orders-h5__empty {
  margin: 48px 20px;
  color: #6d7c8f;
  text-align: center;
}

.orders-h5__list {
  margin: 0 12px;
  overflow: hidden;
  border: 1px solid rgba(16, 32, 51, 0.08);
  border-radius: 18px;
  background: #fff;
}

.orders-h5__row {
  width: 100%;
  display: grid;
  grid-template-columns: 4px minmax(0, 1fr) 16px;
  gap: 12px;
  align-items: center;
  padding: 14px 12px 14px 0;
  border: 0;
  border-bottom: 1px solid #eef2f6;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.orders-h5__row:last-child {
  border-bottom: 0;
}

.orders-h5__row:active {
  background: #f4f7fb;
}

.orders-h5__rail {
  align-self: stretch;
  border-radius: 0 3px 3px 0;
  background: #9aabbe;
}

.orders-h5__row.order-status--action-needed .orders-h5__rail {
  background: #c9842a;
}

.orders-h5__row.order-status--completed .orders-h5__rail {
  background: #1f7a4d;
}

.orders-h5__row.order-status--closed .orders-h5__rail {
  background: #8b97a6;
}

.orders-h5__row.order-row--rescheduled-unread .orders-h5__rail {
  background: #b42318;
}

.orders-h5__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.orders-h5__top,
.orders-h5__sub,
.orders-h5__pills {
  display: flex;
  align-items: center;
  gap: 8px;
}

.orders-h5__top {
  justify-content: space-between;
}

.orders-h5__no {
  font-size: 15px;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.orders-h5__amount {
  color: #05152b;
  font-size: 15px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.orders-h5__service,
.orders-h5__sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orders-h5__service {
  color: #24364c;
  font-size: 14px;
}

.orders-h5__sub {
  color: #6d7c8f;
  font-size: 12px;
}

.orders-h5__pills {
  flex-wrap: wrap;
  margin-top: 4px;
}

.orders-h5__pill {
  padding: 2px 7px;
  border-radius: 999px;
  background: #eef3f8;
  color: #24364c;
  font-size: 11px;
  font-weight: 700;
}

.orders-h5__pill--quiet {
  background: transparent;
  color: #6d7c8f;
  padding-left: 0;
}

.orders-h5__pill--alert {
  background: #fde8e6;
  color: #b42318;
}

.orders-h5__chevron {
  color: #9aabbe;
  font-size: 22px;
  line-height: 1;
}

.orders-h5__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  color: #6d7c8f;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.orders-h5__pager button {
  min-width: 72px;
  height: 36px;
  border-radius: 999px;
  background: #fff;
  color: #05152b;
  font-weight: 700;
}

.orders-h5__pager button:disabled {
  color: #b7c2ce;
}

.orders-h5__filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 8px;
}

.orders-h5__filters .el-select,
.orders-h5__filters .el-date-editor,
.orders-h5__filters .el-input {
  width: 100% !important;
  max-width: 100%;
  box-sizing: border-box;
}

.orders-h5__filter-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.orders-h5__ghost,
.orders-h5__solid {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 750;
}

.orders-h5__ghost {
  background: #eef2f6;
  color: #24364c;
}

.orders-h5__solid {
  background: #05152b;
  color: #fff;
}
</style>

<style>
.orders-h5-detail.el-drawer {
  background: #eef1f5;
}

.orders-h5-detail .el-drawer__body {
  max-width: 100%;
  overflow-x: hidden;
  padding: 0 0 28px;
}

.h5-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0 0 12px;
}

.h5-actions button {
  min-height: 40px;
  padding: 8px 10px;
  border: 0;
  border-radius: 12px;
  background: #fff;
  color: #05152b;
  font-size: 13px;
  font-weight: 750;
}

.h5-status-select {
  width: min(148px, 46vw);
}

.orders-h5-detail .order-detail,
.orders-h5-detail .order-detail__toolbar,
.orders-h5-detail .order-detail__list,
.orders-h5-detail .order-detail__payment-grid,
.orders-h5-detail .order-detail__refund-grid {
  max-width: 100%;
  min-width: 0;
}

.orders-h5-detail .order-detail__toolbar {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.orders-h5-detail .order-detail__toolbar .el-button {
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 40px;
  margin: 0;
  white-space: normal;
}

.h5-nav {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 48px;
  padding: 0 8px;
  border: 0;
  background: rgba(238, 241, 245, 0.94);
  color: #05152b;
  font-size: 16px;
  font-weight: 750;
  text-align: left;
}

.h5-nav span {
  font-size: 28px;
  line-height: 1;
}

.h5-supplier {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  margin: 0 0 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
  color: #05152b;
}

.h5-supplier__copy {
  min-width: 0;
}

.h5-supplier__copy small {
  display: block;
  margin-bottom: 4px;
  color: #6b7c90;
  font-size: 12px;
}

.h5-supplier__copy strong {
  display: block;
  overflow: hidden;
  font-size: 16px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h5-supplier__actions {
  display: flex;
  flex: none;
  gap: 8px;
}

.h5-supplier__btn {
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: #05152b;
  color: #fff;
  font-size: 13px;
  font-weight: 750;
}

.h5-supplier__btn--ghost {
  background: #eef2f6;
  color: #05152b;
}

.h5-assign__order,
.h5-assign__current,
.h5-assign__hint {
  margin: 0 0 10px;
  color: #5d6e82;
  font-size: 13px;
}

.h5-assign__current {
  color: #05152b;
  font-weight: 750;
}

.h5-assign__current span {
  display: block;
  margin-top: 4px;
  color: #5d6e82;
  font-weight: 500;
}

.h5-assign :deep(.el-select) {
  width: 100%;
  margin-top: 8px;
}

.orders-h5-select {
  z-index: 5400 !important;
}

.h5-assign__list button {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #d7e0ea;
  border-radius: 12px;
  background: #fff;
  color: #05152b;
  font-size: 15px;
  font-weight: 650;
  text-align: left;
}

.h5-assign__list button.is-active {
  border-color: #05152b;
  background: #f1f4f7;
}

.h5-assign__footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.h5-assign__footer button {
  flex: 1;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: #eef2f6;
  color: #05152b;
  font-size: 15px;
  font-weight: 750;
}

.h5-assign__footer button:last-child {
  background: #05152b;
  color: #fff;
}

.h5-assign__footer button:disabled {
  opacity: 0.6;
}

.h5-supplier-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.h5-supplier-view div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.h5-supplier-view dt {
  color: #6b7c90;
  font-size: 12px;
}

.h5-supplier-view dd {
  margin: 0;
  color: #05152b;
  font-size: 15px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.orders-h5-dialog-mask {
  z-index: 5000 !important;
}

.orders-h5-detail .order-detail {
  margin: 0 12px;
}

.orders-h5-detail .order-detail__hero,
.orders-h5-detail .order-detail__toolbar {
  border-radius: 16px;
}

.orders-h5-detail .order-detail__toolbar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.orders-h5-detail .order-detail__toolbar .el-button {
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 40px;
  margin: 0;
  white-space: normal;
}

.el-overlay:has(.orders-h5-dialog) {
  z-index: 5300 !important;
}

.el-overlay-dialog:has(.orders-h5-dialog) {
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.orders-h5-dialog.el-dialog {
  width: 100% !important;
  max-width: 100%;
  margin: 0;
  border-radius: 22px 22px 0 0;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
}

.orders-h5-dialog .el-dialog__body {
  overflow: auto;
  padding: 4px 16px 12px;
}

.orders-h5-dialog .el-dialog__footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
}

.orders-h5-dialog .el-dialog__footer .el-button {
  flex: 1;
  height: 42px;
  margin: 0;
}

.orders-h5-dialog .el-form-item {
  display: block;
}

.orders-h5-dialog .el-form-item__label {
  width: auto !important;
  height: auto;
  justify-content: flex-start;
  padding: 0 0 6px;
  line-height: 1.3;
}

.orders-h5-dialog .el-form-item__content {
  margin-left: 0 !important;
}

.orders-h5-sheet.el-drawer {
  border-radius: 22px 22px 0 0;
  max-height: 88dvh;
}

.orders-h5-sheet .el-drawer__body {
  padding: 0 16px calc(16px + env(safe-area-inset-bottom));
}
</style>
