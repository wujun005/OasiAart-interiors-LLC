<template>
  <section class="coverage-board">
    <header class="board-header">
      <div>
        <h2>{{ t('admin.coverage.overview') }}</h2>
        <p>{{ t('admin.coverage.overviewHint') }}</p>
      </div>
      <el-button :icon="RefreshRight" :loading="boardLoading" @click="refresh">
        {{ t('admin.common.refresh') }}
      </el-button>
    </header>

    <TodayDispatchRisk :refresh-token="refreshToken" />
    <div class="coverage-actions">
      <section class="board-panel action-panel" aria-labelledby="coverage-risks">
        <header class="panel-heading">
          <div>
            <h2 id="coverage-risks">{{ t('admin.coverage.riskTitle') }}</h2>
            <p v-if="locale.startsWith('zh')" lang="en">{{ t('admin.coverage.riskTitle', {}, { locale: 'en' }) }}</p>
            <p>{{ t('admin.coverage.riskHint') }}</p>
            <p v-if="locale.startsWith('zh')" lang="en">{{ t('admin.coverage.riskHint', {}, { locale: 'en' }) }}</p>
          </div>
        </header>
        <table class="risk-table">
          <thead>
            <tr>
              <th scope="col">
                {{ t('admin.coverage.catalogType') }}
                <small v-if="locale.startsWith('zh')" lang="en">{{ t('admin.coverage.catalogType', {}, { locale: 'en' }) }}</small>
              </th>
              <th v-for="risk in supplyRiskFilters" :key="risk.key" scope="col">
                {{ t(risk.label) }}
                <small v-if="locale.startsWith('zh')" lang="en">{{ t(risk.label, {}, { locale: 'en' }) }}</small>
                <small>{{ t(risk.hint) }}</small>
                <small v-if="locale.startsWith('zh')" lang="en">{{ t(risk.hint, {}, { locale: 'en' }) }}</small>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tab in catalogTabs" :key="tab">
              <th scope="row">{{ t(tab === 'service' ? 'admin.coverage.services' : 'admin.coverage.packages') }}</th>
              <td v-for="risk in supplyRiskFilters" :key="risk.key">
                <button
                  type="button"
                  class="risk-count"
                  :class="`is-${risk.key}`"
                  :disabled="riskCounts[tab] === null"
                  :aria-pressed="kind === tab && coverageFilter === risk.key"
                  :aria-label="t('admin.coverage.openRisk', {
                    type: t(tab === 'service' ? 'admin.coverage.services' : 'admin.coverage.packages'),
                    risk: t(risk.label),
                    count: numberText(riskCounts[tab]?.[risk.key]),
                  })"
                  @click="showCatalogRisk(tab, risk.key)"
                >
                  <span class="risk-figure">
                    <strong>{{ numberText(riskCounts[tab]?.[risk.key]) }}</strong>
                    <span class="risk-unit">
                      {{ t('admin.coverage.itemUnit') }}<template v-if="locale.startsWith('zh')"> / {{ t('admin.coverage.itemUnit', {}, { locale: 'en' }) }}</template>
                    </span>
                  </span>
                  <el-icon aria-hidden="true"><ArrowRight /></el-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="risk-threshold">
          {{ t('admin.coverage.riskThreshold') }}
          <span v-if="locale.startsWith('zh')" lang="en">{{ t('admin.coverage.riskThreshold', {}, { locale: 'en' }) }}</span>
        </p>
        <button
          type="button"
          class="detail-button risk-margin-link"
          :disabled="riskCounts.service === null"
          @click="showCatalogRisk('service', 'negative')"
        >
          {{ t('admin.coverage.negativeServices', { count: numberText(riskCounts.service?.negative) }) }}
          <el-icon aria-hidden="true"><ArrowRight /></el-icon>
        </button>
      </section>

      <section class="board-panel action-panel" aria-labelledby="coverage-reviews">
        <header class="panel-heading">
          <div>
            <h2 id="coverage-reviews">{{ t('admin.coverage.reviewTitle') }}</h2>
            <p>{{ t('admin.coverage.reviewHint') }}</p>
          </div>
        </header>
        <ul class="review-queue">
          <li v-for="review in reviews" :key="review.key">
            <component :is="review.href ? 'a' : 'div'" :href="review.href || undefined" class="review-queue__row">
              <span>{{ t(review.label) }}</span>
              <strong v-if="review.key !== 'priceChange'">{{ numberText(review.count) }}</strong>
              <span v-else-if="review.href" class="review-queue__open">{{ t('admin.coverage.openQueue') }}</span>
              <el-icon v-if="review.href" aria-hidden="true"><ArrowRight /></el-icon>
            </component>
          </li>
        </ul>
      </section>
    </div>
    <p v-if="overviewFailed" class="board-notice is-error" role="status">
      {{ t('admin.coverage.overviewFailed') }}
    </p>

    <section ref="catalogSection" class="board-panel coverage-catalog" aria-labelledby="coverage-catalog" tabindex="-1">
      <header class="panel-heading">
        <div>
          <h2 id="coverage-catalog">{{ t('admin.coverage.catalogTitle') }}</h2>
          <p>{{ t('admin.coverage.catalogHint') }}</p>
        </div>
      </header>
      <div class="board-toolbar">
        <div class="catalog-switch" :aria-label="t('admin.coverage.catalogTitle')" role="group">
          <button
            v-for="tab in catalogTabs"
            :key="tab"
            type="button"
            :aria-pressed="kind === tab"
            @click="kind = tab"
          >
            {{ t(tab === 'service' ? 'admin.coverage.services' : 'admin.coverage.packages') }}
          </button>
        </div>
        <div class="catalog-filters">
          <el-input
            v-model="catalogKeyword"
            :prefix-icon="Search"
            clearable
            :aria-label="t('admin.coverage.catalogSearch')"
            :placeholder="t('admin.coverage.catalogSearch')"
          />
          <el-select v-model="coverageFilter" :aria-label="t('admin.coverage.riskFilter')">
            <el-option v-for="option in catalogFilters" :key="option.key" :value="option.key" :label="t(option.label)" />
          </el-select>
        </div>
      </div>

      <el-skeleton v-if="boardLoading && !catalogReady" :rows="3" animated />
      <p v-else-if="catalogFailed" class="board-notice is-error" role="status">
        {{ t('admin.coverage.catalogFailed') }}
      </p>
      <p v-else-if="!visibleCategories.length" class="board-notice" role="status">
        {{ t(filtering ? 'admin.coverage.noCatalogMatch' : 'admin.coverage.emptyCategory') }}
      </p>
      <div v-else class="table-scroll" tabindex="0" :aria-label="t('admin.coverage.catalogTitle')">
        <table class="category-table">
          <thead>
            <tr>
              <th scope="col">{{ t('admin.coverage.category') }}</th>
              <th scope="col">{{ t('admin.coverage.covered') }}</th>
              <th scope="col">{{ t('admin.coverage.onShelf') }}</th>
              <th scope="col">{{ t('admin.coverage.gaps') }}</th>
              <th scope="col">{{ t('admin.coverage.categoryFulfillable') }}</th>
              <th scope="col">{{ t('admin.coverage.coverageRate') }}</th>
            </tr>
          </thead>
          <tbody v-for="category in visibleCategories" :key="category.categoryId">
            <tr class="category-row" :class="{ 'is-open': isExpanded(category) }">
              <th scope="row">
                <button type="button" class="category-toggle" :aria-expanded="isExpanded(category)" @click="toggle(category)">
                  <el-icon class="category-chevron"><ArrowRight /></el-icon>
                  <span>{{ nameOf(category) }}</span>
                  <small v-if="filtering">{{ t('admin.coverage.matchCount', { count: category.visibleItems.length }) }}</small>
                </button>
              </th>
              <td>{{ numberText(category.covered) }}</td>
              <td>{{ numberText(category.onShelf) }}</td>
              <td>
                <span class="gap-count" :class="{ 'has-gap': category.gaps > 0 }">{{ category.gaps }}</span>
              </td>
              <td>
                <strong>{{ numberText(category.fulfillableSupplierCount) }}</strong>
                <small class="onboarding-text">
                  {{ t(kind === 'service' ? 'admin.coverage.quotedSuppliers' : 'admin.coverage.selected') }}
                  {{ numberText(kind === 'service' ? category.quotedSupplierCount : category.selectedSupplierCount) }}
                </small>
              </td>
              <td>
                <div class="category-rate">
                  <strong>{{ category.onShelf ? percent(category.coverageRate) : '—' }}</strong>
                  <span class="meter" aria-hidden="true">
                    <i :style="{ width: rateWidth(category.onShelf ? category.coverageRate : 0) }" />
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="isExpanded(category)" class="category-details">
              <td colspan="6">
                <p v-if="!category.visibleItems.length" class="board-notice">{{ t('admin.coverage.emptyCategory') }}</p>
                <div v-else class="table-scroll detail-scroll" tabindex="0" :aria-label="nameOf(category)">
                  <table class="item-table">
                    <thead>
                      <tr>
                        <th scope="col">{{ t(kind === 'service' ? 'admin.coverage.serviceName' : 'admin.coverage.packageName') }}</th>
                        <th v-for="column in quoteColumns" :key="column.key" scope="col">{{ t(column.label) }}</th>
                        <th scope="col">{{ t(kind === 'package' ? 'admin.coverage.componentMargin' : 'admin.coverage.avg') }}</th>
                        <th scope="col">{{ t('admin.coverage.details') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in category.visibleItems" :key="itemId(item)">
                        <th scope="row">
                          <a
                            v-if="catalogHref(item)"
                            class="record-link item-name"
                            :href="catalogHref(item)"
                            target="_blank"
                            rel="noopener noreferrer"
                            :aria-label="t(kind === 'service' ? 'admin.coverage.openService' : 'admin.coverage.openPackage', { name: nameOf(item) })"
                          >{{ nameOf(item) }}</a>
                          <span v-else class="item-name">{{ nameOf(item) }}</span>
                          <small v-if="Number(item.status) === 0 && item.status != null" class="off-shelf">{{ t('admin.coverage.offShelf') }}</small>
                        </th>
                        <td v-for="column in quoteColumns" :key="column.key">
                          <span
                            :class="column.key === 'fulfillableSupplierCount' ? ['capacity', {
                              'has-gap': matchesCoverageFilter(item, 'uncovered'),
                              'has-single': matchesCoverageFilter(item, 'single'),
                              'has-supply': count(item.fulfillableSupplierCount) > 1,
                            }] : undefined"
                          >{{ numberText(item[column.key]) }}</span>
                        </td>
                        <td class="margin-cell">
                          <div>{{ percent(item.avgProfitRate) }}</div>
                          <small v-if="hasMarginSpan(item)" class="margin-span">
                            {{ t('admin.coverage.marginRange', { min: percent(item.minProfitRate), max: percent(item.maxProfitRate) }) }}
                          </small>
                          <small v-if="matchesCoverageFilter(item, 'negative')" class="margin-flag">
                            {{ t('admin.coverage.negativeQuote') }}
                          </small>
                        </td>
                        <td>
                          <button class="detail-button" type="button" @click="openDrill(kind, item)">
                            {{ t('admin.coverage.viewSuppliers') }}
                            <el-icon><ArrowRight /></el-icon>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="coverage-trends" aria-labelledby="coverage-trends">
      <h2 id="coverage-trends">{{ t('admin.coverage.trendsTitle') }}</h2>
      <el-skeleton v-if="boardLoading && !summary" :rows="3" animated class="board-loading" />
      <CoverageOverview
        v-if="summary"
        :summary="summary"
        :trend="trend"
        :profit-bands="profitBands"
        :registrations="registrations"
        :trend-range="trendRange"
        :trend-loading="trendLoading"
        @trend-range="loadTrendRange"
      />
    </section>

    <section ref="supplierSection" class="board-panel" aria-labelledby="coverage-suppliers">
      <header class="panel-heading">
        <div>
          <h2 id="coverage-suppliers">{{ t('admin.coverage.supplierTable') }}</h2>
          <p>{{ t('admin.coverage.supplierHint') }}</p>
        </div>
        <span v-if="supplierReady && !suppliersFailed" class="result-count">
          {{ t('admin.coverage.bandSupplierCount', { count: numberText(supplierTotal) }) }}
        </span>
      </header>
      <form class="board-toolbar supplier-filters" @submit.prevent="searchSuppliers">
        <el-input v-model="query.keyword" :prefix-icon="Search" :aria-label="t('admin.coverage.keyword')" clearable :placeholder="t('admin.coverage.keyword')" />
        <el-select v-model="query.supplierType" clearable :aria-label="t('admin.coverage.supplierType')" :placeholder="t('admin.coverage.supplierType')">
          <el-option :label="t('admin.coverage.enterprise')" :value="1" />
          <el-option :label="t('admin.coverage.individual')" :value="2" />
        </el-select>
        <el-select v-model="query.status" clearable :aria-label="t('admin.coverage.status')" :placeholder="t('admin.coverage.status')">
          <el-option :label="t('admin.coverage.enabledStatus')" :value="1" />
          <el-option :label="t('admin.coverage.disabledStatus')" :value="0" />
        </el-select>
        <el-select v-model="query.onboardingStatus" clearable :aria-label="t('admin.coverage.onboarding')" :placeholder="t('admin.coverage.onboarding')">
          <el-option v-for="(key, value) in onboardingKeys" :key="value" :label="t(key)" :value="value" />
        </el-select>
        <el-select
          v-model="query.spuId"
          filterable
          clearable
          class="catalog-query"
          :aria-label="t('admin.coverage.serviceQuery')"
          :placeholder="t('admin.coverage.serviceQueryPlaceholder')"
        >
          <el-option v-for="option in serviceOptions" :key="option.id" :value="option.id" :label="option.label" />
        </el-select>
        <el-select
          v-model="query.packageId"
          filterable
          clearable
          class="catalog-query"
          :aria-label="t('admin.coverage.packageQuery')"
          :placeholder="t('admin.coverage.packageQueryPlaceholder')"
        >
          <el-option v-for="option in packageOptions" :key="option.id" :value="option.id" :label="option.label" />
        </el-select>
        <el-date-picker
          v-model="joinRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          clearable
          :start-placeholder="t('admin.coverage.joinedFrom')"
          :end-placeholder="t('admin.coverage.joinedTo')"
          :aria-label="t('admin.coverage.joinedRange')"
        />
        <el-checkbox v-model="query.onlyFulfillable">{{ t('admin.coverage.onlyFulfillable') }}</el-checkbox>
        <div class="filter-buttons">
          <el-button type="primary" native-type="submit" :loading="suppliersLoading">{{ t('admin.coverage.applyFilters') }}</el-button>
          <el-button @click="resetSuppliers">{{ t('admin.coverage.resetFilters') }}</el-button>
        </div>
      </form>

      <el-skeleton v-if="suppliersLoading || !supplierReady" :rows="3" animated />
      <div v-else-if="suppliersFailed" class="board-notice is-error" role="status">
        {{ t('admin.coverage.supplierLoadFailed') }}
        <button type="button" class="detail-button" @click="loadSuppliers">{{ t('admin.coverage.retry') }}</button>
      </div>
      <p v-else-if="!supplierRows.length" class="board-notice" role="status">{{ t('admin.coverage.emptySuppliers') }}</p>
      <el-table
        v-else
        ref="supplierTable"
        :data="supplierRows"
        row-key="supplierId"
        class="supplier-table"
        size="small"
        @row-click="onSupplierRowClick"
        @expand-change="onSupplierExpand"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="fulfillable-panel">
              <p v-if="fulfillableState(row).loading" class="board-notice">{{ t('admin.coverage.loading') }}</p>
              <div v-else-if="fulfillableState(row).failed" class="board-notice is-error" role="status">
                {{ t('admin.coverage.fulfillableServicesFailed') }}
                <button type="button" class="detail-button" @click="loadFulfillable(row, true)">{{ t('admin.coverage.retry') }}</button>
              </div>
              <div v-else class="fulfillable-groups">
                <div>
                  <p class="fulfillable-title">{{ t('admin.coverage.fulfillableServices') }}</p>
                  <p v-if="!fulfillableState(row).services.length" class="fulfillable-empty">{{ t('admin.coverage.fulfillableServicesEmpty') }}</p>
                  <ul v-else class="fulfillable-list">
                    <li v-for="item in fulfillableState(row).services" :key="`service-${item.id}`">
                      <a
                        v-if="storefrontService(item.id)"
                        class="record-link"
                        :href="storefrontService(item.id)"
                        target="_blank"
                        rel="noopener noreferrer"
                        :aria-label="t('admin.coverage.openStorefrontService', { name: refName(item) })"
                      >{{ refName(item) }}</a>
                      <span v-else>{{ refName(item) }}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p class="fulfillable-title">{{ t('admin.coverage.fulfillablePackages') }}</p>
                  <p v-if="!fulfillableState(row).packages.length" class="fulfillable-empty">{{ t('admin.coverage.fulfillablePackagesEmpty') }}</p>
                  <ul v-else class="fulfillable-list">
                    <li v-for="item in fulfillableState(row).packages" :key="`package-${item.id}`">
                      <a
                        v-if="storefrontPackage(item.id)"
                        class="record-link"
                        :href="storefrontPackage(item.id)"
                        target="_blank"
                        rel="noopener noreferrer"
                        :aria-label="t('admin.coverage.openStorefrontPackage', { name: refName(item) })"
                      >{{ refName(item) }}</a>
                      <span v-else>{{ refName(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.coverage.suppliers')" min-width="210">
          <template #default="{ row }">
            <div class="supplier-identity">
              <button type="button" class="supplier-expand" @click="toggleFulfillable(row)">
                <strong>{{ row.supplierName || '—' }}</strong>
              </button>
              <small>
                {{ row.supplierNo || '—' }} · {{ supplierType(row) }}
                <a
                  v-if="supplierHref(row.supplierId)"
                  class="record-link"
                  :href="supplierHref(row.supplierId)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="t('admin.coverage.openSupplier', { name: row.supplierName || row.supplierNo || '—' })"
                >{{ t('admin.coverage.openRecord') }}</a>
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.coverage.status')" min-width="128">
          <template #default="{ row }">
            <span class="status-pill" :class="{ 'is-positive': Number(row.status) === 1 }">{{ supplierStatus(row.status) }}</span>
            <small class="onboarding-text">{{ onboardingStatus(row) }}</small>
            <small v-if="joinedOn(row.createTime)" class="onboarding-text">{{ joinedOn(row.createTime) }}</small>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.coverage.services')" min-width="128">
          <template #default="{ row }">
            <button type="button" class="detail-button" @click="toggleFulfillable(row)">
              <strong>{{ numberText(row.effectiveServiceCount) }}</strong>
              <span class="ratio-total"> / {{ numberText(row.selectedServiceCount) }}</span>
            </button>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.coverage.packages')" min-width="128">
          <template #default="{ row }">
            <button type="button" class="detail-button" @click="toggleFulfillable(row)">
              <strong>{{ numberText(row.fulfillablePackageCount) }}</strong>
              <span class="ratio-total"> / {{ numberText(row.selectedPackageCount) }}</span>
            </button>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.coverage.avgProfit')" min-width="120">
          <template #default="{ row }">{{ percent(row.avgProfitRate) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.coverage.bands')" min-width="115">
          <template #default="{ row }">
            <span class="status-pill" :class="bandClass(row.profitBand)">{{ marginBand(row.profitBand) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="supplierReady && !suppliersFailed && supplierTotal > pageSize"
        class="supplier-pagination"
        :layout="'prev, pager, next'"
        :pager-count="5"
        :current-page="page"
        :page-size="pageSize"
        :total="supplierTotal"
        @current-change="changeSupplierPage"
      />
    </section>

    <el-drawer v-model="drillOpen" :title="drillTitle" size="min(100%, 620px)" @close="cancelDrill">
      <el-skeleton v-if="drillLoading" :rows="4" animated />
      <div v-else-if="drillFailed" class="board-notice is-error" role="status">
        {{ t('admin.coverage.supplierLoadFailed') }}
        <button type="button" class="detail-button" @click="loadDrill">{{ t('admin.coverage.retry') }}</button>
      </div>
      <p v-else-if="!drillRows.length" class="board-notice" role="status">{{ t('admin.coverage.drillEmpty') }}</p>
      <div v-else class="table-scroll" tabindex="0" :aria-label="drillTitle">
        <table class="drill-table">
          <thead>
            <tr>
              <th scope="col">{{ t('admin.coverage.suppliers') }}</th>
              <th scope="col">{{ t('admin.coverage.quoteStatus') }}</th>
              <th scope="col">{{ t('admin.coverage.serviceStatus') }}</th>
              <th scope="col">{{ t(drillTarget?.kind === 'package' ? 'admin.coverage.componentMargin' : 'admin.coverage.profit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in drillRows" :key="row.supplierId">
              <th scope="row">
                <div class="supplier-identity">
                  <a
                    v-if="supplierHref(row.supplierId)"
                    class="record-link"
                    :href="supplierHref(row.supplierId)"
                    target="_blank"
                    rel="noopener noreferrer"
                    :aria-label="t('admin.coverage.openSupplier', { name: row.supplierName || row.supplierNo || '—' })"
                  ><strong>{{ row.supplierName || '—' }}</strong></a>
                  <strong v-else>{{ row.supplierName || '—' }}</strong>
                  <small>{{ row.supplierNo || '—' }} · {{ supplierType(row) }}</small>
                </div>
              </th>
              <td>
                <a
                  v-if="drillQuoteHref(row)"
                  class="record-link"
                  :href="drillQuoteHref(row)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="t('admin.coverage.openQuote')"
                >{{ localized(row.quoteStatusI18n) || t('admin.coverage.openQuote') }}</a>
                <template v-else>{{ localized(row.quoteStatusI18n) || '—' }}</template>
              </td>
              <td>
                <span class="status-pill" :class="{ 'is-positive': row.fulfillable === true }">{{ fulfillableLabel(row.fulfillable) }}</span>
              </td>
              <td>{{ percent(row.profitRate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowRight, RefreshRight, Search } from '@element-plus/icons-vue';
import CoverageOverview from './CoverageOverview.vue';
import TodayDispatchRisk from './TodayDispatchRisk.vue';
import { countCoverageRisks, matchesCoverageFilter, type CoverageFilter } from './catalogRisks';
import { adminHref, packagePageHref, packageQuoteHref, recordId, servicePageHref, serviceQuoteHref as serviceQuotePageHref, storefrontPackageHref, storefrontServiceHref, supplierPageHref } from './links';
import { registrationTrend } from '@/modules/admin/api/clientUser';
import { resolveAllowedAdminPath } from '@/modules/admin/utils/menuPermission';
import { dubaiDateKey } from '@/modules/admin/utils/staffBoard';
import {
  dashboardCatalog,
  dashboardFulfillable,
  dashboardOnboardingTrend,
  dashboardOverview,
  dashboardPackageSuppliers,
  dashboardServiceSuppliers,
  dashboardSuppliers,
} from '@/modules/admin/api/supplierDashboard';

type Kind = 'service' | 'package';
type Id = number | string;
type Numeric = number | string | null | undefined;
type I18nMap = Record<string, string> | null | undefined;
type Summary = Record<string, number | string | null>;
type Trend = {
  date?: string;
  newSupplierCount?: number;
  suppliers?: Array<{ supplierId?: Id; supplierName?: string; supplierNo?: string }>;
};
type Band = { band?: number; bandI18nZh?: string; bandI18nEn?: string; supplierCount?: number };
type CatalogItem = {
  nameI18n?: I18nMap;
  spuId?: Id;
  spuName?: string;
  spuCode?: string;
  packageId?: Id;
  packageName?: string;
  packageCode?: string;
  status?: Numeric;
  selectedSupplierCount?: Numeric;
  quotedSupplierCount?: Numeric;
  fullyApprovedSupplierCount?: Numeric;
  reviewingSupplierCount?: Numeric;
  pendingQuoteSupplierCount?: Numeric;
  fulfillableSupplierCount?: Numeric;
  avgProfitRate?: Numeric;
  minProfitRate?: Numeric;
  maxProfitRate?: Numeric;
};
type Category = {
  categoryId: Id;
  categoryName?: string;
  nameI18n?: I18nMap;
  coveredServiceCount?: Numeric;
  onShelfServiceCount?: Numeric;
  coveredPackageCount?: Numeric;
  onShelfPackageCount?: Numeric;
  coverageRate?: Numeric;
  quotedSupplierCount?: Numeric;
  selectedSupplierCount?: Numeric;
  fulfillableSupplierCount?: Numeric;
  services?: CatalogItem[];
  packages?: CatalogItem[];
};
type Supplier = {
  supplierId: Id;
  supplierName?: string;
  supplierNo?: string;
  supplierType?: Numeric;
  supplierTypeI18n?: I18nMap;
  status?: Numeric;
  onboardingStatus?: Numeric;
  onboardingStatusI18n?: I18nMap;
  effectiveServiceCount?: Numeric;
  selectedServiceCount?: Numeric;
  fulfillablePackageCount?: Numeric;
  selectedPackageCount?: Numeric;
  avgProfitRate?: Numeric;
  profitBand?: Numeric;
  createTime?: unknown;
  quoteStatus?: Numeric;
  quoteStatusI18n?: I18nMap;
  fulfillable?: boolean | null;
  profitRate?: Numeric;
};
type SupplierFilters = {
  keyword: string;
  supplierType?: number | string;
  status?: number | string;
  onboardingStatus?: number | string;
  spuId?: number | null;
  packageId?: number | null;
  onlyFulfillable: boolean;
  createTimeStart?: string;
  createTimeEnd?: string;
};
type NamedRef = { id?: Id; name?: string; nameI18n?: I18nMap };
type FulfillableState = {
  loading: boolean;
  failed: boolean;
  loaded: boolean;
  services: NamedRef[];
  packages: NamedRef[];
};

const router = useRouter();
const { t, locale } = useI18n();
const supplierHref = (id: unknown) => supplierPageHref(router, id);
const storefrontService = (id: unknown) => storefrontServiceHref(id);
const storefrontPackage = (id: unknown) => storefrontPackageHref(id);
const catalogTabs = ['service', 'package'] as const;
const supplyRiskFilters = [
  { key: 'uncovered', label: 'admin.coverage.uncoveredRisk', hint: 'admin.coverage.uncoveredRiskHint' },
  { key: 'single', label: 'admin.coverage.singleRisk', hint: 'admin.coverage.singleRiskHint' },
] as const;
const catalogFilters = [
  { key: 'all', label: 'admin.coverage.all' },
  ...supplyRiskFilters,
  { key: 'sufficient', label: 'admin.coverage.sufficient' },
  { key: 'negative', label: 'admin.coverage.negativeQuote' },
] as const;
const quoteColumns = [
  { key: 'selectedSupplierCount', label: 'admin.coverage.selected' },
  { key: 'quotedSupplierCount', label: 'admin.coverage.quoted' },
  { key: 'fullyApprovedSupplierCount', label: 'admin.coverage.approved' },
  { key: 'reviewingSupplierCount', label: 'admin.coverage.reviewing' },
  { key: 'pendingQuoteSupplierCount', label: 'admin.coverage.pending' },
  { key: 'fulfillableSupplierCount', label: 'admin.coverage.fulfillable' },
] as const;
const onboardingKeys = [
  'admin.coverage.draft', 'admin.coverage.submitted', 'admin.coverage.approvedStatus', 'admin.coverage.rejected',
];

const summary = ref<Summary | null>(null);
const registrations = ref<{ week: number | null; total: number | null; failed?: boolean } | null>(null);
const trend = ref<Trend[]>([]);
const defaultTrend = ref<Trend[]>([]);
const trendRange = ref<[string, string] | null>(null);
const trendLoading = ref(false);
const profitBands = ref<Band[]>([]);
const serviceCategories = ref<Category[]>([]);
const packageCategories = ref<Category[]>([]);
const boardLoading = ref(true);
const overviewFailed = ref(false);
const catalogFailed = ref(false);
const catalogReady = ref(false);
const kind = ref<Kind>('service');
const catalogSection = ref<HTMLElement | null>(null);
const catalogKeyword = ref('');
const coverageFilter = ref<CoverageFilter>('all');
const refreshToken = ref(0);
const expanded = reactive<Partial<Record<Kind, Id | null>>>({});

const riskCounts = computed(() => ({
  service: catalogReady.value && !catalogFailed.value ? countCoverageRisks(serviceCategories.value, 'service') : null,
  package: catalogReady.value && !catalogFailed.value ? countCoverageRisks(packageCategories.value, 'package') : null,
}));

function reviewHref(path: string, query: Record<string, string>) {
  return resolveAllowedAdminPath(path) === path ? adminHref(router, path, query) : '';
}
const reviews = computed(() => [
  {
    key: 'onboarding',
    label: 'admin.coverage.onboardingReview',
    count: summary.value?.supplierPendingReview,
    href: reviewHref('/admin/basic/suppliers', { onboardingStatus: '1' }),
  },
  {
    key: 'quote',
    label: 'admin.coverage.deskQuotePending',
    count: summary.value?.quotePendingCount,
    href: reviewHref('/admin/basic/quotes', { quoteStatus: '1' }),
  },
  {
    key: 'priceChange',
    label: 'admin.coverage.priceChangeReview',
    href: reviewHref('/admin/basic/quotes', { queueFocus: 'priceChange' }),
  },
]);

const supplierSection = ref<HTMLElement | null>(null);
const suppliersLoading = ref(false);
const supplierReady = ref(false);
const suppliersFailed = ref(false);
const supplierRows = ref<Supplier[]>([]);
const supplierTotal = ref(0);
const pageSize = 20;
const page = ref(1);
const defaultFilters = (): SupplierFilters => ({
  keyword: '',
  supplierType: undefined,
  status: undefined,
  onboardingStatus: undefined,
  spuId: undefined,
  packageId: undefined,
  onlyFulfillable: false,
});
const query = reactive(defaultFilters());
const joinRange = ref<[string, string] | null>(null);
let appliedFilters = defaultFilters();
const supplierTable = ref<{ toggleRowExpansion: (row: Supplier, expanded?: boolean) => void } | null>(null);
const fulfillableBySupplier = reactive<Record<string, FulfillableState>>({});

const drillOpen = ref(false);
const drillLoading = ref(false);
const drillFailed = ref(false);
const drillTarget = ref<{ kind: Kind; id: Id; item: CatalogItem } | null>(null);
const catalogHref = (item: CatalogItem) => (
  kind.value === 'service' ? servicePageHref(router, item.spuId) : packagePageHref(router, item.packageId)
);
const drillQuoteHref = (row: Supplier) => {
  if (row.quoteStatus == null || row.quoteStatus === '' || !drillTarget.value) return '';
  return drillTarget.value.kind === 'service'
    ? serviceQuotePageHref(router, row.supplierId, drillTarget.value.item.spuId)
    : packageQuoteHref(router, row.supplierId, drillTarget.value.item.packageId);
};
const drillRows = ref<Supplier[]>([]);
const drillTitle = computed(() => drillTarget.value ? nameOf(drillTarget.value.item) : '');
let observer: IntersectionObserver | null = null;
let boardRequest = 0;
let supplierRequest = 0;
let drillRequest = 0;
let trendRequest = 0;

function refName(item: NamedRef) {
  return localized(item.nameI18n) || item.name || '—';
}
const serviceOptions = computed(() => catalogOptions('service'));
const packageOptions = computed(() => catalogOptions('package'));
function catalogOptions(tab: Kind) {
  const services = tab === 'service';
  return (services ? serviceCategories.value : packageCategories.value).flatMap((category) => {
    const items = (services ? category.services : category.packages) ?? [];
    return items.flatMap((item) => {
      const id = recordId(services ? item.spuId : item.packageId);
      if (!id) return [];
      const itemName = nameOf(item);
      const categoryName = nameOf(category);
      const label = categoryName && categoryName !== '—' && categoryName !== itemName
        ? `${itemName} · ${categoryName}`
        : itemName;
      return [{ id: Number(id), label }];
    });
  });
}
function positiveId(value: Numeric) {
  const id = number(value);
  return id != null && Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function number(value: Numeric): number | null {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
const count = (value: Numeric) => Math.max(0, number(value) ?? 0);
const formatter = computed(() => new Intl.NumberFormat(locale.value));
const numberText = (value: Numeric) => number(value) == null ? '—' : formatter.value.format(count(value));
const percentFormatter = computed(() => new Intl.NumberFormat(locale.value, { style: 'percent', maximumFractionDigits: 1 }));
const percent = (value: Numeric) => {
  const rate = number(value);
  return rate == null ? '—' : percentFormatter.value.format(rate);
};
const rateWidth = (value: Numeric) => Math.min(100, count(value) * 100) + '%';

function localized(map: I18nMap) {
  if (!map) return '';
  const language = locale.value.split('-')[0] ?? locale.value;
  return map[locale.value] || map[language]
    || Object.entries(map).find(([key, value]) => key.startsWith(language + '-') && value)?.[1]
    || map.en || map.zh || Object.values(map).find(Boolean) || '';
}
function nameOf(row: Category | CatalogItem) {
  const name = 'categoryId' in row ? row.categoryName : row.spuName || row.packageName;
  return localized(row.nameI18n) || name || '—';
}
const supplierType = (row: Supplier) => localized(row.supplierTypeI18n)
  || t(Number(row.supplierType) === 2 ? 'admin.coverage.individual' : 'admin.coverage.enterprise');
const supplierStatus = (status: Numeric) => {
  const value = number(status);
  return value == null ? '—' : t(value === 1 ? 'admin.coverage.enabledStatus' : 'admin.coverage.disabledStatus');
};
const onboardingStatus = (row: Supplier) => {
  const state = number(row.onboardingStatus);
  const key = state == null ? undefined : onboardingKeys[state];
  return localized(row.onboardingStatusI18n) || (key ? t(key) : '—');
};
const marginBandKeys: Record<number, string> = { 1: 'admin.coverage.highMargin', 2: 'admin.coverage.midMargin', 3: 'admin.coverage.lowMargin' };
const marginBand = (band: Numeric) => {
  const key = marginBandKeys[Number(band)];
  return key ? t(key) : '—';
};
const bandClass = (band: Numeric) => ({ 'is-positive': Number(band) === 1, 'is-warm': Number(band) === 2 });
const hasMarginSpan = (item: CatalogItem) => number(item.minProfitRate) != null || number(item.maxProfitRate) != null;
const joinedFormat = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeZone: 'Asia/Dubai' }));
function joinedOn(value: unknown) {
  if (value == null || value === '') return '';
  const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : String(value));
  return Number.isFinite(date.getTime()) ? joinedFormat.value.format(date) : '';
}
function daySpan(start: string, end: string) {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.round((to - from) / 86400000) + 1;
}
const fulfillableLabel = (value?: boolean | null) => (
  value == null ? '—' : t(value ? 'admin.coverage.readyStatus' : 'admin.coverage.notFulfillable')
);

const keyword = computed(() => catalogKeyword.value.trim().toLocaleLowerCase());
const filtering = computed(() => Boolean(keyword.value || coverageFilter.value !== 'all'));
const itemId = (item: CatalogItem) => kind.value === 'service' ? item.spuId : item.packageId;

const visibleCategories = computed(() => {
  const services = kind.value === 'service';
  const rows = services ? serviceCategories.value : packageCategories.value;
  return rows.flatMap((row) => {
    const items = (services ? row.services : row.packages) ?? [];
    const categoryMatch = nameOf(row).toLocaleLowerCase().includes(keyword.value);
    const visibleItems = items.filter((item) => {
      const searchText = [nameOf(item), item.spuCode, item.packageCode, ...Object.values(item.nameI18n ?? {})]
        .filter(Boolean).join(' ').toLocaleLowerCase();
      return matchesCoverageFilter(item, coverageFilter.value) && (categoryMatch || searchText.includes(keyword.value));
    });
    if (filtering.value && !visibleItems.length) return [];
    const covered = count(services ? row.coveredServiceCount : row.coveredPackageCount);
    const onShelf = count(services ? row.onShelfServiceCount : row.onShelfPackageCount);
    return [{ ...row, covered, onShelf, gaps: Math.max(0, onShelf - covered), visibleItems }];
  });
});
async function showCatalogRisk(tab: Kind, filter: CoverageFilter) {
  kind.value = tab;
  coverageFilter.value = filter;
  catalogKeyword.value = '';
  expanded[tab] = visibleCategories.value[0]?.categoryId;
  await nextTick();
  catalogSection.value?.focus({ preventScroll: true });
  catalogSection.value?.scrollIntoView({ block: 'start' });
}

const isExpanded = (category: Category) => expanded[kind.value] === category.categoryId;
function toggle(category: Category) {
  expanded[kind.value] = isExpanded(category) ? null : category.categoryId;
}
watch(visibleCategories, (rows) => {
  if (!rows.length) return;
  const active = expanded[kind.value];
  if (active !== null && !rows.some((category) => category.categoryId === active)) {
    expanded[kind.value] = rows.find((category) => category.visibleItems.length)?.categoryId ?? rows[0]?.categoryId;
  }
});

function unwrap<T>(payload: unknown): T {
  return ((payload as { data?: T } | null)?.data ?? payload ?? {}) as T;
}
function shiftDateKey(day: string, delta: number) {
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) return day;
  const utc = new Date(Date.UTC(year, month - 1, date));
  utc.setUTCDate(utc.getUTCDate() + delta);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}
function wholeCount(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}
async function loadBoard() {
  const request = ++boardRequest;
  boardLoading.value = true;
  overviewFailed.value = false;
  catalogFailed.value = false;
  const today = dubaiDateKey();
  const [overview, catalog, registration] = await Promise.allSettled([
    dashboardOverview(),
    dashboardCatalog(),
    registrationTrend({ startDate: shiftDateKey(today, -6), endDate: today }),
  ]);
  if (request !== boardRequest) return;
  if (overview.status === 'fulfilled') {
    const data = unwrap<{ summary?: Summary; onboardingTrend?: Trend[]; profitBands?: Band[] }>(overview.value);
    summary.value = data.summary ?? null;
    overviewFailed.value = !summary.value;
    defaultTrend.value = Array.isArray(data.onboardingTrend) ? data.onboardingTrend : [];
    if (!trendRange.value) trend.value = defaultTrend.value;
    profitBands.value = Array.isArray(data.profitBands) ? data.profitBands : [];
  } else {
    summary.value = null;
    overviewFailed.value = true;
  }
  if (registration.status === 'fulfilled') {
    const data = unwrap<{ rangeCount?: unknown; totalCount?: unknown }>(registration.value);
    registrations.value = { week: wholeCount(data.rangeCount), total: wholeCount(data.totalCount) };
  } else {
    registrations.value = { week: null, total: null, failed: true };
  }
  if (catalog.status === 'fulfilled') {
    const data = unwrap<{ serviceCategories?: Category[]; packageCategories?: Category[] }>(catalog.value);
    catalogFailed.value = !Array.isArray(data.serviceCategories) || !Array.isArray(data.packageCategories);
    serviceCategories.value = Array.isArray(data.serviceCategories) ? data.serviceCategories : [];
    packageCategories.value = Array.isArray(data.packageCategories) ? data.packageCategories : [];
  } else {
    serviceCategories.value = [];
    packageCategories.value = [];
    catalogFailed.value = true;
  }
  catalogReady.value = true;
  boardLoading.value = false;
  if (trendRange.value) void loadTrendRange(trendRange.value);
}

async function loadTrendRange(range: [string, string] | null) {
  const request = ++trendRequest;
  if (!range) {
    trendRange.value = null;
    trend.value = defaultTrend.value;
    trendLoading.value = false;
    return;
  }
  if (daySpan(range[0], range[1]) > 366) {
    ElMessage.warning(t('admin.coverage.trendTooLong'));
    return;
  }
  trendLoading.value = true;
  try {
    const data = unwrap<Trend[]>(await dashboardOnboardingTrend({ startDate: range[0], endDate: range[1] }));
    if (request !== trendRequest) return;
    trendRange.value = range;
    trend.value = Array.isArray(data) ? data : [];
  } catch {
    if (request === trendRequest) ElMessage.error(t('admin.coverage.trendFailed'));
  } finally {
    if (request === trendRequest) trendLoading.value = false;
  }
}

function disconnectObserver() {
  observer?.disconnect();
  observer = null;
}
async function loadSuppliers() {
  disconnectObserver();
  Object.keys(fulfillableBySupplier).forEach((key) => { delete fulfillableBySupplier[key]; });
  const request = ++supplierRequest;
  suppliersLoading.value = true;
  suppliersFailed.value = false;
  try {
    const data = unwrap<{ list?: Supplier[]; total?: Numeric }>(await dashboardSuppliers({
      pageNum: page.value,
      pageSize,
      keyword: appliedFilters.keyword.trim() || undefined,
      supplierType: number(appliedFilters.supplierType) ?? undefined,
      status: number(appliedFilters.status) ?? undefined,
      onboardingStatus: number(appliedFilters.onboardingStatus) ?? undefined,
      spuId: positiveId(appliedFilters.spuId),
      packageId: positiveId(appliedFilters.packageId),
      onlyFulfillable: appliedFilters.onlyFulfillable || undefined,
      createTimeStart: appliedFilters.createTimeStart || undefined,
      createTimeEnd: appliedFilters.createTimeEnd || undefined,
    }));
    if (request !== supplierRequest) return;
    supplierRows.value = Array.isArray(data.list) ? data.list : [];
    supplierTotal.value = count(data.total);
  } catch {
    if (request !== supplierRequest) return;
    supplierRows.value = [];
    supplierTotal.value = 0;
    suppliersFailed.value = true;
  } finally {
    if (request === supplierRequest) {
      suppliersLoading.value = false;
      supplierReady.value = true;
    }
  }
}
function currentSupplierFilters(): SupplierFilters {
  return {
    ...query,
    spuId: positiveId(query.spuId),
    packageId: positiveId(query.packageId),
    createTimeStart: joinRange.value?.[0] || undefined,
    createTimeEnd: joinRange.value?.[1] || undefined,
  };
}
function sameSupplierFilters(left: SupplierFilters, right: SupplierFilters) {
  return left.keyword.trim() === right.keyword.trim()
    && left.supplierType === right.supplierType
    && left.status === right.status
    && left.onboardingStatus === right.onboardingStatus
    && positiveId(left.spuId) === positiveId(right.spuId)
    && positiveId(left.packageId) === positiveId(right.packageId)
    && left.onlyFulfillable === right.onlyFulfillable
    && (left.createTimeStart || '') === (right.createTimeStart || '')
    && (left.createTimeEnd || '') === (right.createTimeEnd || '');
}
function searchSuppliers() {
  const next = currentSupplierFilters();
  if (suppliersLoading.value && page.value === 1 && sameSupplierFilters(next, appliedFilters)) return;
  appliedFilters = next;
  page.value = 1;
  void loadSuppliers();
}
function resetSuppliers() {
  Object.assign(query, defaultFilters());
  joinRange.value = null;
  searchSuppliers();
}
const emptyFulfillable = (): FulfillableState => ({
  loading: false, failed: false, loaded: false, services: [], packages: [],
});
function fulfillableState(row: Supplier): FulfillableState {
  return fulfillableBySupplier[String(row.supplierId)] ?? emptyFulfillable();
}
function toggleFulfillable(row: Supplier) {
  supplierTable.value?.toggleRowExpansion(row);
}
function onSupplierRowClick(row: Supplier, _column: unknown, event: Event) {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('a, button, .el-table__expand-icon')) return;
  toggleFulfillable(row);
}
async function loadFulfillable(row: Supplier, force = false) {
  const key = String(row.supplierId);
  const current = fulfillableBySupplier[key];
  if (!force && (current?.loaded || current?.loading)) return;
  fulfillableBySupplier[key] = { loading: true, failed: false, loaded: false, services: [], packages: [] };
  try {
    const data = unwrap<{ services?: NamedRef[]; packages?: NamedRef[] }>(await dashboardFulfillable(row.supplierId));
    fulfillableBySupplier[key] = {
      loading: false,
      failed: false,
      loaded: true,
      services: Array.isArray(data.services) ? data.services : [],
      packages: Array.isArray(data.packages) ? data.packages : [],
    };
  } catch {
    fulfillableBySupplier[key] = { loading: false, failed: true, loaded: false, services: [], packages: [] };
  }
}
function onSupplierExpand(row: Supplier, expandedRows: Supplier[]) {
  if (expandedRows.some((item) => item.supplierId === row.supplierId)) void loadFulfillable(row);
}
function changeSupplierPage(next: number) {
  if (next === page.value) return;
  page.value = next;
  void loadSuppliers();
}
function refresh() {
  refreshToken.value++;
  void loadBoard();
  if (supplierReady.value || suppliersLoading.value) void loadSuppliers();
}
async function loadDrill() {
  const target = drillTarget.value;
  if (!target) return;
  const request = ++drillRequest;
  drillLoading.value = true;
  drillFailed.value = false;
  drillRows.value = [];
  try {
    const path = target.kind === 'service' ? dashboardServiceSuppliers : dashboardPackageSuppliers;
    const data = unwrap<Supplier[]>(await path(target.id));
    if (request === drillRequest) drillRows.value = Array.isArray(data) ? data : [];
  } catch {
    if (request === drillRequest) drillFailed.value = true;
  } finally {
    if (request === drillRequest) drillLoading.value = false;
  }
}
function openDrill(type: Kind, item: CatalogItem) {
  const id = type === 'service' ? item.spuId : item.packageId;
  if (id == null) return;
  drillTarget.value = { kind: type, id, item };
  drillOpen.value = true;
  void loadDrill();
}
function cancelDrill() {
  ++drillRequest;
}

onMounted(() => {
  void loadBoard();
  if (!supplierSection.value || typeof IntersectionObserver === 'undefined') {
    void loadSuppliers();
    return;
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting) && !supplierRequest) void loadSuppliers();
  }, { rootMargin: '160px' });
  observer.observe(supplierSection.value);
});
onBeforeUnmount(() => {
  disconnectObserver();
  ++boardRequest;
  ++supplierRequest;
  ++drillRequest;
  ++trendRequest;
});
</script>

<style scoped>
.coverage-board {
  --coverage-ink: #10233a;
  --coverage-muted: #586b7c;
  --coverage-line: #e3e8ea;
  --coverage-teal: #0e7867;
  --coverage-teal-soft: #e9f5f0;
  --coverage-amber: #925114;
  --coverage-amber-soft: #fff1dc;
  display: grid;
  min-width: 0;
  gap: 18px;
  color: var(--coverage-ink);
  font-variant-numeric: tabular-nums;
}
.board-header, .panel-heading, .board-toolbar, .catalog-filters, .filter-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}
.board-header, .panel-heading, .board-toolbar { justify-content: space-between; }
.board-header { padding: 1px 0 0; }
.board-header h2, .panel-heading h2 {
  margin: 0;
  color: var(--coverage-ink);
  font-size: clamp(19px, 2vw, 25px);
  line-height: 1.3;
  font-weight: 750;
}
.board-header p, .panel-heading p {
  margin: 5px 0 0;
  color: var(--coverage-muted);
  font-size: 12px;
  line-height: 1.55;
}
.board-header > :deep(.el-button) { flex: none; }
.board-panel, .board-loading {
  min-width: 0;
  padding: 19px;
  border: 1px solid var(--coverage-line);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 12px rgb(28 49 63 / 3%);
}
.panel-heading h2 { font-size: 17px; }
.panel-heading { align-items: start; margin-bottom: 15px; }
.coverage-actions {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 14px;
}
.action-panel .panel-heading { margin-bottom: 12px; }
.risk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
.risk-table th, .risk-table td { padding: 7px 9px; }
.risk-table th:first-child { padding-inline-start: 0; }
.risk-table thead { color: var(--coverage-muted); font-size: 12px; }
.risk-table thead th { vertical-align: top; }
.risk-table thead small { display: block; margin-top: 2px; font-size: 11px; font-weight: 400; }
.risk-table tbody tr { border-top: 1px solid var(--coverage-line); }
.risk-count {
  display: flex;
  width: 100%;
  min-height: 33px;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.risk-figure { display: inline-flex; align-items: baseline; gap: 4px; }
.risk-count strong { font-size: 18px; line-height: 1.2; }
.risk-unit { font-size: 12px; font-weight: 650; }
.risk-threshold span { display: block; margin-top: 2px; }
.risk-count.is-uncovered, .capacity.has-gap { color: #a03042; background: #fbecef; }
.risk-count.is-single, .capacity.has-single { color: var(--coverage-amber); background: var(--coverage-amber-soft); }
.risk-count:hover:not(:disabled), .risk-count[aria-pressed="true"] { border-color: currentColor; }
.risk-count:disabled { cursor: default; opacity: .6; }
.risk-threshold { margin: 7px 0 0; color: var(--coverage-muted); font-size: 12px; }
.risk-margin-link { margin-top: 7px; }
.risk-margin-link:disabled { opacity: .6; cursor: default; text-decoration: none; }
.review-queue { margin: 0; padding: 0; list-style: none; }
.review-queue li { border-top: 1px solid var(--coverage-line); }
.review-queue__row {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  padding: 6px 3px;
  color: var(--coverage-ink);
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
}
.review-queue__row strong { font-size: 19px; }
.review-queue__row > :first-child { flex: 1; }
a.review-queue__row:hover { color: var(--coverage-teal); background: #f5faf8; }
a.review-queue__row:focus-visible { outline: 2px solid var(--coverage-teal); outline-offset: 2px; }
.review-queue__open { color: var(--coverage-teal); font-size: 12px; }
.coverage-catalog { scroll-margin-top: 76px; }
.coverage-catalog:focus { outline: none; }
.coverage-trends { min-width: 0; }
.coverage-trends > h2 { margin: 0 0 12px; font-size: 18px; }
.margin-flag { display: block; margin-top: 4px; color: #a03042; font-size: 11px; font-weight: 650; }
.board-toolbar { flex-wrap: wrap; margin-bottom: 13px; }
.catalog-switch {
  display: inline-flex;
  flex: none;
  gap: 3px;
  padding: 3px;
  border: 1px solid #e3e8e9;
  border-radius: 9px;
  background: #f3f6f6;
}
.catalog-switch button {
  min-width: 72px;
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--coverage-muted);
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}
.catalog-switch button[aria-pressed="true"] {
  border-color: #d5e6e0;
  background: #fff;
  color: var(--coverage-teal);
  box-shadow: 0 1px 3px rgb(17 78 66 / 8%);
}
.catalog-filters { flex-wrap: wrap; }
.catalog-filters :deep(.el-input) { width: 230px; max-width: 100%; }
.catalog-filters :deep(.el-select) { width: 156px; max-width: 100%; }
.table-scroll { min-width: 0; overflow-x: auto; border: 1px solid var(--coverage-line); border-radius: 10px; }
.category-table, .item-table, .drill-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
.category-table { min-width: 680px; }
.item-table { min-width: 760px; }
.drill-table { min-width: 430px; }
.category-table th, .category-table td, .item-table th, .item-table td, .drill-table th, .drill-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #edf0f1;
  vertical-align: middle;
}
.category-table thead, .item-table thead, .drill-table thead { background: #f4f7f7; color: #42586a; }
.category-table thead th, .item-table thead th, .drill-table thead th { font-weight: 650; white-space: nowrap; }
.category-table > tbody:last-child > tr:last-child > *, .item-table tbody > tr:last-child > *, .drill-table tbody > tr:last-child > * { border-bottom: 0; }
.category-row:hover { background: #f8fbfa; }
.category-row.is-open { background: #edf7f3; }
.category-row > th { width: 37%; padding: 0; }
.category-toggle {
  display: flex;
  min-height: 45px;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: var(--coverage-ink);
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.category-chevron { flex: none; color: var(--coverage-teal); }
.category-row.is-open .category-chevron { transform: rotate(90deg); }
.category-toggle small { font-weight: 650; color: var(--coverage-muted); }
.category-row > td:last-child { width: 29%; }
.category-rate { display: flex; align-items: center; gap: 9px; }
.category-rate strong { min-width: 45px; }
.meter { flex: 1; min-width: 40px; height: 6px; overflow: hidden; border-radius: 6px; background: #e3e9e8; }
.meter i { display: block; height: 100%; border-radius: inherit; background: var(--coverage-teal); }
.category-details > td { padding: 11px 12px 13px; background: #f8faf9; }
.detail-scroll { background: #fff; }
.item-table tbody tr:hover { background: #fbfcfc; }
.item-table th[scope="row"], .drill-table th[scope="row"] { font-weight: 650; }
.item-table td { white-space: nowrap; }
.item-name { display: block; min-width: 100px; }
.record-link { color: var(--coverage-teal); font-weight: 700; text-decoration: none; }
.record-link:hover { text-decoration: underline; text-underline-offset: 2px; }
.fulfillable-list .record-link.is-quote { margin-inline-start: 8px; font-size: 11px; }
.off-shelf, .onboarding-text, .margin-span { display: block; margin-top: 4px; color: var(--coverage-muted); font-size: 11px; font-weight: 400; }
.margin-cell { white-space: normal; }
.gap-count, .capacity, .status-pill, .result-count {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f0f3f5;
  color: #455a6c;
  font-size: 11px;
  line-height: 1.5;
  font-weight: 650;
  white-space: nowrap;
}
.gap-count, .capacity { min-width: 26px; text-align: center; }
.has-gap, .status-pill.is-warm { background: var(--coverage-amber-soft); color: var(--coverage-amber); }
.has-supply, .status-pill.is-positive, .result-count { background: var(--coverage-teal-soft); color: var(--coverage-teal); }
.detail-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 30px;
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: var(--coverage-teal);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.detail-button:hover { text-decoration: underline; }
.coverage-board button:focus-visible, .detail-button:focus-visible { outline: 2px solid #319b86; outline-offset: 2px; }
.table-scroll:focus-visible { outline: 2px solid #319b86; outline-offset: -2px; }
.supplier-filters { justify-content: start; gap: 9px; }
.supplier-filters :deep(.el-input) { width: 190px; max-width: 100%; }
.supplier-filters :deep(.el-select) { width: 134px; max-width: 100%; }
.supplier-filters :deep(.catalog-query) { width: 220px; }
.supplier-filters :deep(.el-date-editor) { width: 248px; max-width: 100%; }
.fulfillable-panel { padding: 2px 8px 10px 28px; }
.fulfillable-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 22px; }
.fulfillable-title { margin: 0 0 8px; font-size: 12px; font-weight: 700; }
.fulfillable-empty { margin: 0; color: var(--coverage-muted); font-size: 12px; }
.fulfillable-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.fulfillable-list li {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--coverage-teal-soft);
  color: var(--coverage-teal);
  font-size: 12px;
  font-weight: 650;
}
.filter-buttons { gap: 8px; }
.filter-buttons :deep(.el-button + .el-button) { margin-left: 0; }
.supplier-table { border: 1px solid var(--coverage-line); border-radius: 10px; }
.supplier-table :deep(.el-table__row) { cursor: pointer; }
.supplier-table :deep(.el-table__header th) { background: #f4f7f7; color: #42586a; font-weight: 650; }
.supplier-table :deep(.el-table__row td) { padding-block: 9px; }
.supplier-identity strong { display: block; font-weight: 700; overflow-wrap: anywhere; }
.supplier-expand {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.supplier-expand:hover strong { color: var(--coverage-teal); }
.supplier-identity .record-link { margin-inline-start: 6px; font-size: 11px; }
.supplier-identity small, .ratio-total { color: var(--coverage-muted); font-size: 11px; }
.supplier-pagination { justify-content: end; margin-top: 13px; }
.board-notice { margin: 0; padding: 17px 12px; color: var(--coverage-muted); text-align: center; font-size: 13px; line-height: 1.5; }
.board-notice.is-error { border-radius: 8px; background: var(--coverage-amber-soft); color: var(--coverage-amber); }
.board-notice .detail-button { margin-inline-start: 6px; }
@media (max-width: 700px) {
  .coverage-actions { grid-template-columns: minmax(0, 1fr); }
  .coverage-board { gap: 13px; }
  .board-header { align-items: start; }
  .board-panel { padding: 13px; }
  .catalog-filters { width: 100%; gap: 8px; }
  .catalog-filters :deep(.el-input) { flex: 1; min-width: 145px; }
  .supplier-filters :deep(.el-input) { width: 100%; }
  .supplier-filters :deep(.el-select),
  .supplier-filters :deep(.catalog-query),
  .supplier-filters :deep(.el-date-editor) { flex: 1 0 160px; }
  .fulfillable-groups { grid-template-columns: minmax(0, 1fr); }
  .category-details > td { padding-inline: 7px; }
}
</style>
