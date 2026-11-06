<template>
  <div class="supplier-review">
    <template v-if="!detailId">
      <header class="supplier-review__head">
        <div>
          <h1>{{ quoteDesk ? t('admin.platformSuppliers.quoteDeskTitle') : t('admin.platformSuppliers.title') }}</h1>
          <p>{{ quoteDesk ? t('admin.platformSuppliers.quoteDeskDescription') : t('admin.platformSuppliers.description') }}</p>
        </div>
      </header>

      <div v-if="quoteDesk" class="detail-tabs quote-scope" role="tablist">
        <button type="button" role="tab" :class="{ on: quoteScope === 'services' }" :aria-selected="quoteScope === 'services'" @click="setQuoteScope('services')">{{ t('admin.platformSuppliers.serviceQuotes') }}</button>
        <button type="button" role="tab" :class="{ on: quoteScope === 'packages' }" :aria-selected="quoteScope === 'packages'" @click="setQuoteScope('packages')">{{ t('admin.platformSuppliers.packages') }}</button>
      </div>

      <div v-if="visibleReviewChips.length" class="review-chips" role="group" :aria-label="t('admin.platformSuppliers.reviewFilters')">
        <button
          v-for="chip in visibleReviewChips"
          :key="chip.key"
          type="button"
          class="review-chip"
          :class="[chip.tone, { on: chip.active }]"
          :aria-pressed="chip.active"
          @click="toggleReviewChip(chip.key)"
        >
          <b>{{ chip.count }}</b>
          <span>{{ chip.label }}</span>
        </button>
      </div>

      <section class="board">
        <div class="board__bar">
          <el-input
            v-model.trim="keyword"
            :placeholder="t('admin.platformSuppliers.searchPlaceholder')"
            clearable
            @keyup.enter="search"
            @clear="search"
          />
          <el-select
            v-model="serviceIds"
            class="service-filter"
            popper-class="supplier-review-select"
            multiple
            filterable
            remote
            clearable
            collapse-tags
            collapse-tags-tooltip
            reserve-keyword
            :remote-method="searchServices"
            :loading="serviceSearchLoading"
            :placeholder="t('admin.platformSuppliers.serviceSearch')"
            @change="rememberServiceOptions(); searchFromFilters()"
            @clear="rememberServiceOptions(); searchFromFilters()"
          >
            <el-option v-for="item in serviceOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-select
            v-if="quoteDesk && quoteScope === 'services'"
            popper-class="supplier-review-select"
            :model-value="quoteStatus === '' ? 'all' : quoteStatus"
            :placeholder="t('admin.platformSuppliers.allSuppliers')"
            @change="changeQuoteStatus"
          >
            <el-option :label="t('admin.platformSuppliers.allSuppliers')" value="all">
              <span @click="showEverySupplier">{{ t('admin.platformSuppliers.allSuppliers') }}</span>
            </el-option>
            <el-option :label="t('admin.platformSuppliers.quotePendingFilter')" :value="1" />
            <el-option :label="t('admin.platformSuppliers.quoteDraftFilter')" :value="0" />
            <el-option :label="t('admin.platformSuppliers.quoteApprovedFilter')" :value="2" />
            <el-option :label="t('admin.platformSuppliers.quoteRejectedFilter')" :value="3" />
          </el-select>
          <el-select
            v-if="!quoteDesk"
            popper-class="supplier-review-select"
            class="review-filter"
            :model-value="onboardingStatus === '' || onboardingStatus == null ? 'all' : onboardingStatus"
            :placeholder="t('admin.platformSuppliers.onboardingStatus')"
            @change="changeOnboardingStatus"
          >
            <el-option :label="t('admin.platformSuppliers.filterAll')" value="all" />
            <el-option :label="t('admin.platformSuppliers.draft')" :value="0" />
            <el-option :label="t('admin.platformSuppliers.pending')" :value="1" />
            <el-option :label="t('admin.platformSuppliers.approved')" :value="2" />
            <el-option :label="t('admin.platformSuppliers.rejected')" :value="3" />
          </el-select>
          <el-select
            v-if="!quoteDesk"
            popper-class="supplier-review-select"
            class="review-filter"
            :model-value="needReview === 'yes' || needReview === 'no' ? needReview : 'all'"
            :placeholder="t('admin.platformSuppliers.needReview')"
            @change="changeNeedReview"
          >
            <el-option :label="t('admin.platformSuppliers.filterAll')" value="all" />
            <el-option :label="t('admin.platformSuppliers.reviewYes')" value="yes" />
            <el-option :label="t('admin.platformSuppliers.reviewNo')" value="no" />
          </el-select>
          <span class="board__count">{{ t('admin.platformSuppliers.supplierCount', { total }) }}</span>
        </div>

        <el-table
          :data="suppliers"
          v-loading="loading"
          row-key="id"
          :empty-text="t('admin.platformSuppliers.empty')"
          :row-class-name="reviewRowClass"
          @row-click="openReview"
        >
          <el-table-column :label="t('admin.platformSuppliers.supplierNo')" min-width="112">
            <template #default="{ row }">
              <b class="supplier-no">{{ row.supplierNo || row.id }}</b>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.supplier')" min-width="160">
            <template #default="{ row }">
              <div class="supplier-cell">{{ row.supplierName || '—' }}<span v-if="Number(row.supplierType) === 2" class="type-pill">{{ t('admin.platformSuppliers.individualType') }}</span></div>
              <small v-if="row.contactPerson || row.mobile">{{ [row.contactPerson, row.mobile].filter(Boolean).join(' · ') }}</small>
            </template>
          </el-table-column>
          <el-table-column class-name="category-col" :label="t('admin.platformSuppliers.categories')" min-width="176">
            <template #default="{ row }">
              <el-tooltip
                v-if="displayCategories(row).length"
                :content="categorySummary(row)"
                placement="top"
                :show-after="250"
              >
                <div class="category-line">
                  <span v-for="cat in displayCategories(row)" :key="cat.key" class="pill">{{ cat.label }}</span>
                </div>
              </el-tooltip>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!quoteDesk" :label="t('admin.platformSuppliers.onboarding')" min-width="96">
            <template #default="{ row }">
              <button
                type="button"
                class="status-pill"
                :class="statusClass(row.onboardingStatus)"
                @click.stop="applyOnboardingFilter(Number(row.onboardingStatus))"
              >
                {{ onboardingLabel(row.onboardingStatus) }}
              </button>
              <small v-if="row.profileChangeCount" class="change-count">{{ t('admin.platformSuppliers.profileChangeCount', { count: row.profileChangeCount }) }}</small>
            </template>
          </el-table-column>
          <el-table-column v-if="quoteDesk && quoteScope === 'services'" :label="t('admin.platformSuppliers.quoteStatus')" min-width="176">
            <template #default="{ row }">
              <div class="row-updates" @click.stop>
                <button v-if="quoteBadge(row).pending" type="button" class="status-pill pending" @click="applyQuoteFilter(1)">
                  {{ t('admin.platformSuppliers.quoteUpdatePending', { count: quoteBadge(row).pending }) }}
                </button>
                <span v-if="quoteBadge(row).rejected" class="status-pill bad">
                  {{ t('admin.platformSuppliers.quoteRejectedCount', { count: quoteBadge(row).rejected }) }}
                </span>
                <button v-if="quoteBadge(row).approved" type="button" class="status-pill ok" @click="applyQuoteFilter(2)">
                  {{ t('admin.platformSuppliers.quoteApprovedCount', { count: quoteBadge(row).approved }) }}
                </button>
                <span v-if="!quoteBadge(row).pending && !quoteBadge(row).rejected && !quoteBadge(row).approved" class="status-empty">—</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="quoteDesk && quoteScope === 'services'" :label="t('admin.platformSuppliers.priceChangeColumn')" min-width="120">
            <template #default="{ row }">
              <button
                v-if="quoteBadge(row).priceChange"
                type="button"
                class="status-pill pending"
                @click.stop="applyQueueFocus('priceChange')"
              >
                {{ t('admin.platformSuppliers.priceChangeUpdatePending', { count: quoteBadge(row).priceChange }) }}
              </button>
              <span v-else class="status-empty">—</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!quoteDesk" :label="t('admin.platformSuppliers.licenceColumn')" min-width="96">
            <template #default="{ row }">
              <button
                v-if="listLicenceState(row) === 'expired'"
                type="button"
                class="status-pill bad"
                @click.stop="applyQueueFocus('licence')"
              >
                {{ t('admin.platformSuppliers.licenceExpired') }}
              </button>
              <button
                v-else-if="listLicenceState(row) === 'soon'"
                type="button"
                class="status-pill pending"
                @click.stop="applyQueueFocus('licence')"
              >
                {{ t('admin.platformSuppliers.expiringSoon') }}
              </button>
              <span v-else class="status-empty">—</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.latestSubmit')" min-width="128">
            <template #default="{ row }">{{ formatTime(row.latestSubmitTime) }}</template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.actions')" min-width="176">
            <template #default="{ row }">
              <div v-if="!quoteDesk && Number(row.onboardingStatus) === 1" class="row-actions" @click.stop>
                <button type="button" class="act ok" :disabled="saving" @click="approveOnboardingRow(row)">{{ t('admin.platformSuppliers.approve') }}</button>
                <button type="button" class="act no" :disabled="saving" @click="openReject('onboarding', row)">{{ t('admin.platformSuppliers.reject') }}</button>
              </div>
              <button v-else type="button" class="open-link" @click.stop="openReview(row)">{{ t('admin.platformSuppliers.open') }}</button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          layout="prev, pager, next, total"
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          @current-change="changePage"
        />
      </section>
    </template>

    <section v-else class="supplier-page">
      <AdminBreadcrumb class="supplier-breadcrumb" :items="breadcrumbItems" @back="crumbBack" />

      <el-skeleton v-if="quoteRoutePending || (detailLoading && screen !== 'quote')" :rows="12" animated />
      <div v-else class="supplier-body">
        <header v-if="screen !== 'quote'" class="supplier-hero">
          <div class="avatar">{{ supplierInitials }}</div>
          <div class="supplier-hero__main">
            <p>{{ t('admin.platformSuppliers.supplierNo') }} {{ profile.supplierNo || current?.supplierNo || '—' }}<template v-if="onboarding.snapshotVersion"> · {{ t('admin.platformSuppliers.snapshotVersion', { version: onboarding.snapshotVersion }) }}</template></p>
            <h1>{{ profile.companyName || current?.supplierName || '—' }}</h1>
            <div class="hero-pills">
              <span class="status-pill">{{ individualSupplier ? t('admin.platformSuppliers.individualType') : t('admin.platformSuppliers.companyType') }}</span>
              <span class="status-pill" :class="statusClass(onboarding.status)">{{ t('admin.platformSuppliers.onboarding') }}: {{ onboardingLabel(onboarding.status) }}</span>
              <span class="status-pill" :class="pendingQuoteCount ? 'pending' : 'ok'">{{ t('admin.platformSuppliers.quoteReviewState') }}: {{ quoteRollup }}</span>
              <span class="status-pill" :class="eligibilityKey === 'active' ? 'ok' : 'pending'">{{ t('admin.platformSuppliers.dispatchEligibility') }}: {{ eligibilityLabel }}</span>
            </div>
          </div>
          <div v-if="!quoteDesk && Number(onboarding.status) === 1" class="hero-actions">
            <button type="button" class="act no" :disabled="saving" @click="openReject('onboarding')">{{ t('admin.platformSuppliers.reject') }}</button>
            <button type="button" class="act navy" :disabled="saving" @click="approveOnboarding">{{ t('admin.platformSuppliers.approveOnboarding') }}</button>
          </div>
        </header>
        <p v-if="!quoteDesk && onboarding.rejectReason" class="reject-note">{{ t('admin.platformSuppliers.rejectReason', { reason: onboarding.rejectReason }) }}</p>
        <p v-if="!quoteDesk && onboarding.snapshotVersion && (Number(onboarding.status) === 1 || Number(onboarding.status) === 3)" class="snapshot-note">{{ t('admin.platformSuppliers.snapshotReview') }}</p>
        <section v-if="!quoteDesk && profileChanges.length" class="profile-changes">
          <h3>{{ t('admin.platformSuppliers.profileChangesTitle', { count: profileChanges.length }) }}</h3>
          <ul>
            <li v-for="change in profileChanges" :key="change.field">
              <b>{{ changeLabel(change) }}</b>
              <span class="was">{{ changeValue(change, 'before') }}</span>
              <em>→</em>
              <span class="now">{{ changeValue(change, 'after') }}</span>
            </li>
          </ul>
        </section>

        <div v-if="quoteDesk && screen !== 'quote'" class="detail-tabs">
          <button type="button" :class="{ on: quoteScope === 'services' }" @click="setQuoteScope('services')">{{ t('admin.platformSuppliers.serviceQuotes') }}</button>
          <button type="button" :class="{ on: quoteScope === 'packages' }" @click="setQuoteScope('packages')">{{ t('admin.platformSuppliers.packages') }}</button>
        </div>
        <div v-else-if="!quoteDesk" class="detail-tabs">
          <button type="button" :class="{ on: detailTab === 'overview' }" @click="openSupplierTab('overview')">{{ t('admin.platformSuppliers.overview') }}</button>
          <button type="button" :class="{ on: detailTab === 'company' }" @click="openSupplierTab('company')">{{ individualSupplier ? t('admin.platformSuppliers.personTab') : t('admin.platformSuppliers.companyTab') }}</button>
          <button type="button" :class="{ on: detailTab === 'capacity' }" @click="openSupplierTab('capacity')">{{ t('admin.platformSuppliers.capacityTab') }}</button>
          <button type="button" :class="{ on: detailTab === 'bank' }" @click="openSupplierTab('bank')">{{ t('admin.platformSuppliers.bankTab') }}</button>
          <button type="button" :class="{ on: detailTab === 'docs' }" @click="openSupplierTab('docs')">{{ t('admin.platformSuppliers.documents') }}</button>
        </div>

        <template v-if="screen === 'supplier'">

          <div v-if="detailTab === 'overview'" class="tab-panel">
            <div class="stat-row">
              <button type="button" @click="openQuoteDesk('services')"><small>{{ t('admin.platformSuppliers.servicesOffered') }}</small><b>{{ services.length }}</b><em>{{ t('admin.platformSuppliers.bookableServices', { count: bookableServiceCount }) }}</em></button>
              <div><small>{{ t('admin.platformSuppliers.approvedQuotes') }}</small><b>{{ approvedQuoteCount }}</b><em>{{ t('admin.platformSuppliers.draftQuotes', { count: draftQuoteCount }) }}</em></div>
              <button type="button" @click="openQuoteDesk('services')"><small>{{ t('admin.platformSuppliers.quotesToReview') }}</small><b>{{ pendingQuoteCount }}</b></button>
              <div><small>{{ t('admin.platformSuppliers.dispatchEligibility') }}</small><b>{{ eligibilityLabel }}</b></div>
            </div>
            <div class="overview-board">
              <section class="panel">
                <h3>{{ t('admin.platformSuppliers.keyDetails') }}</h3>
                <dl class="kv">
                  <div><dt>{{ t('admin.platformSuppliers.primaryContact') }}</dt><dd>{{ text(profile.contactPerson) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.phone') }}</dt><dd>{{ text(profile.mobile) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.categories') }}</dt><dd>{{ expectedServiceNames.length || displayCategoryCount }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.serviceAreas') }}</dt><dd>{{ areaTags.length || '—' }}</dd></div>
                  <div v-if="!individualSupplier"><dt>{{ t('admin.platformSuppliers.availableWorkers') }}</dt><dd>{{ text(profile.totalAvailableWorkers) }}<small class="field-note">{{ t('admin.platformSuppliers.workersNote') }}</small></dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.workingHours') }}</dt><dd>{{ scheduleText }}</dd></div>
                </dl>
              </section>
              <section class="panel">
                <h3>{{ t('admin.platformSuppliers.documents') }}</h3>
                <dl class="kv">
                  <div v-for="group in documentGroups" :key="group.label">
                    <dt>{{ group.label }}</dt>
                    <dd :class="group.files.length ? 'yes' : 'no'">{{ group.files.length ? t('admin.platformSuppliers.uploaded') : t('admin.platformSuppliers.missing') }}</dd>
                  </div>
                  <div v-if="!individualSupplier"><dt>{{ t('admin.platformSuppliers.licenceExpiryDate') }}</dt><dd :class="licenceState === 'soon' || licenceState === 'expired' ? 'expiry-soon' : ''">{{ text(profile.licenseExpiry) }}<small v-if="licenceState === 'soon'" class="field-note">{{ t('admin.platformSuppliers.expiringSoon') }}</small><small v-else-if="licenceState === 'expired'" class="field-note">{{ t('admin.platformSuppliers.licenceExpired') }}</small></dd></div>
                </dl>
              </section>
            </div>
          </div>

          <div v-else-if="detailTab === 'company'" class="split">
            <section class="panel">
              <h3>{{ individualSupplier ? t('admin.platformSuppliers.personTab') : t('admin.platformSuppliers.company') }}</h3>
              <dl v-if="individualSupplier" class="kv">
                <div><dt>{{ t('admin.platformSuppliers.fullName') }}</dt><dd>{{ text(profile.fullName || profile.companyName) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.dateOfBirth') }}</dt><dd>{{ text(profile.dateOfBirth) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.nationality') }}</dt><dd>{{ text(profile.nationality) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.residentialCity') }}</dt><dd>{{ text(profile.residentialCity) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.vatRegistration') }}</dt><dd>{{ profile.vatTrn ? text(profile.vatTrn) : t('admin.platformSuppliers.notProvided') }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.yearsPersonal') }}</dt><dd>{{ Number(profile.yearsInBusiness) > 0 ? text(profile.yearsInBusiness) : t('admin.platformSuppliers.notProvided') }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.uniformAgreement') }}</dt><dd>{{ yesNo(profile.wearUniform) }}</dd></div>
              </dl>
              <dl v-else class="kv">
                <div><dt>{{ t('admin.platformSuppliers.legalCompanyName') }}</dt><dd>{{ text(profile.companyName) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.licenseNo') }}</dt><dd>{{ text(profile.tradeLicenseNo) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.licensingAuthority') }}</dt><dd>{{ licenseIssuerText(profile) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.licenceExpiryDate') }}</dt><dd :class="licenceState === 'soon' || licenceState === 'expired' ? 'expiry-soon' : ''">{{ text(profile.licenseExpiry) }}<small v-if="licenceState === 'soon'" class="field-note">{{ t('admin.platformSuppliers.expiringSoon') }}</small><small v-else-if="licenceState === 'expired'" class="field-note">{{ t('admin.platformSuppliers.licenceExpired') }}</small></dd></div>
                <div><dt>{{ t('admin.platformSuppliers.vatRegistration') }}</dt><dd>{{ profile.vatTrn ? text(profile.vatTrn) : t('admin.platformSuppliers.notProvided') }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.businessEstablished') }}</dt><dd>{{ Number(profile.yearsInBusiness) > 0 ? text(profile.yearsInBusiness) : t('admin.platformSuppliers.notProvided') }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.registeredAddress') }}</dt><dd>{{ text(profile.officeAddress) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.uniformAgreement') }}</dt><dd>{{ yesNo(profile.wearUniform) }}</dd></div>
              </dl>
            </section>
            <section class="panel">
              <h3>{{ t('admin.platformSuppliers.contactTitle') }}</h3>
              <dl class="kv">
                <div><dt>{{ t('admin.platformSuppliers.primaryContact') }}</dt><dd>{{ text(profile.contactPerson) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.email') }}</dt><dd>{{ text(profile.email) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.phone') }}</dt><dd>{{ text(profile.mobile) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.whatsapp') }}</dt><dd>{{ text(profile.whatsapp) }}</dd></div>
              </dl>
            </section>
          </div>

          <div v-else-if="detailTab === 'capacity'" class="tab-panel">
            <section class="panel">
              <h3>{{ t('admin.platformSuppliers.expectedServices') }}</h3>
              <div v-if="expectedServiceNames.length" class="category-tags">
                <span v-for="name in expectedServiceNames" :key="name" class="pill">{{ name }}</span>
              </div>
              <p v-else class="muted">—</p>
              <p v-if="profile.expectedServiceRemark" class="muted">{{ profile.expectedServiceRemark }}</p>
            </section>
            <div class="split">
              <section class="panel">
                <h3>{{ t('admin.platformSuppliers.capacity') }}</h3>
                <dl class="kv">
                  <div v-if="!individualSupplier"><dt>{{ t('admin.platformSuppliers.availableWorkers') }}</dt><dd>{{ text(profile.totalAvailableWorkers) }}<small class="field-note">{{ t('admin.platformSuppliers.workersNote') }}</small></dd></div>
                  <div v-if="!individualSupplier"><dt>{{ t('admin.platformSuppliers.femaleStaff') }}</dt><dd>{{ staffText(profile.femaleStaffAvailable, profile.femaleStaffCount) }}</dd></div>
                  <div v-if="!individualSupplier"><dt>{{ t('admin.platformSuppliers.maleStaff') }}</dt><dd>{{ staffText(profile.maleStaffAvailable, profile.maleStaffCount) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.leadTime') }}</dt><dd>{{ profile.minLeadTimeHours == null ? '—' : t('admin.platformSuppliers.leadHours', { hours: profile.minLeadTimeHours }) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.workingHours') }}</dt><dd>{{ scheduleText }}</dd></div>
                </dl>
              </section>
              <section class="panel">
                <h3>{{ t('admin.platformSuppliers.availability') }}</h3>
                <dl class="kv">
                  <div><dt>{{ t('admin.platformSuppliers.weekend') }}</dt><dd>{{ yesNo(profile.weekendService) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.saturday') }}</dt><dd>{{ yesNo(profile.saturdayService) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.sunday') }}</dt><dd>{{ yesNo(profile.sundayService) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.holiday') }}</dt><dd>{{ yesNo(profile.publicHolidayService) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.sameDay') }}</dt><dd>{{ yesNo(profile.sameDayBooking) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.emergency') }}</dt><dd>{{ yesNo(profile.emergencyService) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.ownVehicle') }}</dt><dd>{{ yesNo(profile.ownTransportation) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.ownEquipment') }}</dt><dd>{{ yesNo(profile.ownEquipment) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.wearUniform') }}</dt><dd>{{ yesNo(profile.wearUniform) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.taxInvoice') }}</dt><dd>{{ yesNo(profile.taxInvoiceAvailable) }}</dd></div>
                  <div v-if="!individualSupplier" class="span-all">
                    <dt>{{ t('admin.platformSuppliers.communities') }}</dt>
                    <dd>
                      <div v-if="registeredCommunities.length" class="community-picks">
                        <span v-for="name in registeredCommunities" :key="name">{{ name }}</span>
                      </div>
                      <template v-else>—</template>
                    </dd>
                  </div>
                  <div v-if="!individualSupplier"><dt>{{ t('admin.platformSuppliers.otherNote') }}</dt><dd>{{ text(profile.applyRenmark) }}</dd></div>
                </dl>
              </section>
            </div>
            <section class="panel">
              <h3>{{ t('admin.platformSuppliers.serviceAreas') }}</h3>
              <div v-if="areaTags.length" class="category-tags">
                <span v-for="name in areaTags" :key="name" class="pill">{{ name }}</span>
              </div>
              <p v-else class="muted">—</p>
            </section>
          </div>

          <div v-else-if="detailTab === 'quotes'" class="tab-panel">
            <section class="panel">
              <div class="panel-head">
                <div>
                  <h3>{{ t('admin.platformSuppliers.services') }}</h3>
                  <p class="quote-sheet-hint">{{ t('admin.platformSuppliers.quoteSheetHint') }}</p>
                  <p class="quote-sheet-hint">{{ t('admin.platformSuppliers.exportSelectionHint') }}</p>
                  <p v-if="pendingQuoteCount" class="quote-sheet-hint">{{ t('admin.platformSuppliers.quotesToReview') }}: {{ pendingQuoteCount }}</p>
                </div>
                <div class="panel-actions">
                  <button type="button" class="act" :disabled="quoteImporting || !detailId" @click="quoteHistoryOpen = true">
                    {{ t('admin.platformSuppliers.quoteHistory.title') }}
                  </button>
                  <button type="button" class="act" :disabled="quoteExporting || !detailId" @click="downloadQuoteSheet">
                    {{ quoteExporting ? t('admin.platformSuppliers.exportingQuotes') : quoteExportLabel }}
                  </button>
                  <button type="button" class="act navy" :disabled="quoteImporting || !detailId" @click="quoteFileInput?.click()">
                    {{ quoteImporting ? t('admin.platformSuppliers.importingQuotes') : t('admin.platformSuppliers.importQuoteSheet') }}
                  </button>
                  <button type="button" class="act" :disabled="exportingPrices || !services.length" @click="exportPriceList">
                    {{ exportingPrices ? t('admin.platformSuppliers.exportingPrices') : t('admin.platformSuppliers.exportPrices') }}
                  </button>
                </div>
              </div>
              <p v-if="!services.length" class="muted">{{ t('admin.platformSuppliers.noServicesHint') }}</p>
              <div v-if="!services.length && expectedServiceNames.length" class="category-tags">
                <span v-for="name in expectedServiceNames" :key="name" class="pill">{{ name }}</span>
              </div>
              <div v-else class="service-filters">
                <el-input v-model.trim="serviceKeyword" clearable :placeholder="t('admin.platformSuppliers.serviceSearch')" />
                <el-select popper-class="supplier-review-select" v-model="serviceCategoryFilter" clearable :placeholder="t('admin.platformSuppliers.category')">
                  <el-option v-for="name in serviceCategoryOptions" :key="name" :label="name" :value="name" />
                </el-select>
                <el-select popper-class="supplier-review-select" v-model="serviceStatusFilter" clearable :placeholder="t('admin.platformSuppliers.quoteStatus')">
                  <el-option :label="t('admin.supplierPricing.quotationDraft')" :value="0" />
                  <el-option :label="t('admin.supplierPricing.priceUnderReview')" :value="1" />
                  <el-option :label="t('admin.supplierPricing.priceActive')" :value="2" />
                  <el-option :label="t('admin.supplierPricing.priceRejected')" :value="3" />
                </el-select>
              </div>
              <el-table v-if="services.length" :data="visibleServices" row-key="spuId" :empty-text="t('admin.platformSuppliers.noServices')" @row-click="openQuote">
                <el-table-column width="42" align="center">
                  <template #header>
                    <span class="quote-select" @click.stop>
                      <el-checkbox
                        :model-value="allVisibleQuotesSelected"
                        :indeterminate="someVisibleQuotesSelected"
                        :disabled="!visibleServices.length"
                        :aria-label="t('admin.platformSuppliers.selectVisible')"
                        @change="toggleVisibleQuoteSelection"
                      />
                    </span>
                  </template>
                  <template #default="{ row }">
                    <span class="quote-select" @click.stop>
                      <el-checkbox
                        :model-value="quoteSpuSelected(row.spuId)"
                        :aria-label="t('admin.platformSuppliers.selectService', { name: serviceName(row) })"
                        @change="(checked) => toggleQuoteSpu(row.spuId, checked === true)"
                      />
                    </span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.service')" min-width="128">
                  <template #default="{ row }"><b>{{ serviceName(row) }}</b></template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.category')" min-width="112">
                  <template #default="{ row }">{{ serviceCategory(row) }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.contactTitle')" min-width="120">
                  <template #default="{ row }">{{ row.contactName || '—' }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.phones')" min-width="156">
                  <template #default="{ row }">
                    <span v-if="listedPhones(row.contactPhones).length" class="contact-lines">
                      <span v-for="phone in listedPhones(row.contactPhones)" :key="phone">{{ phone }}</span>
                    </span>
                    <template v-else>—</template>
                  </template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.quoteStatus')" width="144">
                  <template #default="{ row }">
                    <span class="status-pill" :class="statusClass(row.priceChangeStatus === 1 ? 1 : row.status)">{{ serviceQuoteStatus(row) }}</span>
                    <small v-if="Number(row.priceChangeStatus) === 1" class="price-change-note">{{ t('admin.platformSuppliers.priceChangePending') }}</small>
                    <small v-if="Number(row.priceChangeStatus) === 1 && row.priceChangeReason" class="price-change-note">{{ t('admin.platformSuppliers.priceChangeReasonLabel', { reason: row.priceChangeReason }) }}</small>
                  </template>
                </el-table-column>
                <el-table-column v-if="!individualSupplier" :label="t('admin.platformSuppliers.workers')" width="96">
                  <template #default="{ row }">{{ row.workerCount ?? '—' }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.actions')" min-width="224">
                  <template #default="{ row }">
                    <div class="row-actions" @click.stop>
                      <button type="button" class="act navy" @click="openQuote(row)">{{ Number(row.status) === 1 || Number(row.priceChangeStatus) === 1 ? t('admin.platformSuppliers.reviewQuote') : t('admin.platformSuppliers.viewQuote') }}</button>
                      <button v-if="Number(row.status) === 1" type="button" class="act no" @click="openWholeQuoteReject(row)">{{ t('admin.platformSuppliers.rejectQuote') }}</button>
                      <button v-if="Number(row.priceChangeStatus) === 1" type="button" class="act" @click="approvePriceChange(row)">{{ t('admin.platformSuppliers.approvePriceChange') }}</button>
                      <button v-if="Number(row.priceChangeStatus) === 1" type="button" class="act no" @click="openPriceChangeReject(row)">{{ t('admin.platformSuppliers.rejectPriceChange') }}</button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>

          <div v-else-if="detailTab === 'packages'" class="tab-panel">
            <section class="panel">
              <div class="panel-head">
                <div>
                  <h3>{{ t('admin.platformSuppliers.packages') }}</h3>
                  <p class="quote-sheet-hint">{{ t('admin.platformSuppliers.packagesHint') }}</p>
                </div>
              </div>
              <p v-if="!packageServiceRows.length" class="muted">{{ t('admin.platformSuppliers.noPackages') }}</p>
              <div v-else class="service-filters">
                <el-input v-model.trim="packageKeyword" clearable :placeholder="t('admin.platformSuppliers.serviceSearch')" />
                <el-select popper-class="supplier-review-select" v-model="packageCategoryFilter" clearable :placeholder="t('admin.platformSuppliers.category')">
                  <el-option v-for="name in packageCategoryOptions" :key="name" :label="name" :value="name" />
                </el-select>
                <el-select popper-class="supplier-review-select" v-model="packageStatusFilter" clearable :placeholder="t('admin.platformSuppliers.quoteStatus')">
                  <el-option :label="t('admin.supplierPricing.quotationDraft')" :value="0" />
                  <el-option :label="t('admin.supplierPricing.priceUnderReview')" :value="1" />
                  <el-option :label="t('admin.supplierPricing.priceActive')" :value="2" />
                  <el-option :label="t('admin.supplierPricing.priceRejected')" :value="3" />
                </el-select>
              </div>
              <el-table v-if="packageServiceRows.length" :data="visiblePackageServices" row-key="key" :empty-text="t('admin.platformSuppliers.noPackages')" @row-click="openPackageQuote">
                <el-table-column :label="t('admin.platformSuppliers.packageName')" min-width="160">
                  <template #default="{ row }"><b>{{ row.packageName }}</b></template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.category')" min-width="120">
                  <template #default="{ row }">{{ row.categoryName }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.service')" min-width="160">
                  <template #default="{ row }"><b>{{ serviceName(row) }}</b></template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.quoteStatus')" width="144">
                  <template #default="{ row }">
                    <span class="status-pill" :class="statusClass(row.priceChangeStatus === 1 ? 1 : row.status)">{{ serviceQuoteStatus(row) }}</span>
                    <small v-if="Number(row.priceChangeStatus) === 1" class="price-change-note">{{ t('admin.platformSuppliers.priceChangePending') }}</small>
                  </template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.actions')" min-width="224">
                  <template #default="{ row }">
                    <div class="row-actions" @click.stop>
                      <button type="button" class="act navy" @click="openPackageQuote(row)">{{ Number(row.status) === 1 || Number(row.priceChangeStatus) === 1 ? t('admin.platformSuppliers.reviewQuote') : t('admin.platformSuppliers.viewQuote') }}</button>
                      <button v-if="Number(row.status) === 1" type="button" class="act no" @click="openWholeQuoteReject(row)">{{ t('admin.platformSuppliers.rejectQuote') }}</button>
                      <button v-if="Number(row.priceChangeStatus) === 1" type="button" class="act" @click="approvePriceChange(row)">{{ t('admin.platformSuppliers.approvePriceChange') }}</button>
                      <button v-if="Number(row.priceChangeStatus) === 1" type="button" class="act no" @click="openPriceChangeReject(row)">{{ t('admin.platformSuppliers.rejectPriceChange') }}</button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>

          <div v-else-if="detailTab === 'bank'" class="tab-panel">
            <section class="panel">
              <h3>{{ t('admin.platformSuppliers.bankTab') }} <span class="status-pill muted-pill">{{ t('admin.supplierProfile.bankHint') }}</span></h3>
              <dl class="kv">
                <div><dt>{{ t('admin.supplierProfile.accountName') }}</dt><dd>{{ text(bankAccount.accountName) }}</dd></div>
                <div><dt>{{ t('admin.supplierProfile.bankName') }}</dt><dd>{{ text(bankAccount.bankName) }}</dd></div>
                <div><dt>{{ t('admin.supplierProfile.iban') }}</dt><dd>{{ text(bankAccount.iban) }}</dd></div>
                <div><dt>{{ t('admin.supplierProfile.swift') }}</dt><dd>{{ text(bankAccount.swift) }}</dd></div>
                <div><dt>{{ t('admin.supplierProfile.currency') }}</dt><dd>{{ text(bankAccount.currency || 'AED') }}</dd></div>
              </dl>
            </section>
          </div>

          <div v-else-if="detailTab === 'docs'" class="tab-panel">
            <section class="panel">
              <h3>{{ t('admin.platformSuppliers.documents') }}</h3>
              <div v-for="group in documentGroups" :key="group.label" class="doc-row">
                <div class="doc-mark">{{ group.files.length ? 'PDF' : '—' }}</div>
                <div>
                  <b>{{ group.label }}</b>
                  <small v-if="group.files.length">{{ group.files.map((file) => file.name).join(', ') }}</small>
                  <small v-else class="miss">{{ t('admin.platformSuppliers.notUploaded') }}</small>
                </div>
                <button v-if="group.files.length" type="button" class="act" @click="openFilePreview(group.files[0].url)">{{ t('admin.platformSuppliers.viewFile') }}</button>
              </div>
            </section>
          </div>
        </template>

        <section v-else class="panel quote-page">
          <header class="quote-head">
            <div class="quote-head__copy">
              <div class="quote-head__title">
                <h2>{{ skuDialogTitle }}</h2>
                <span class="status-pill" :class="statusClass(skuStatus)">{{ quoteStatusLabel(skuStatus, skuStatusI18n) }}</span>
              </div>
              <p class="quote-head__meta">
                <span v-if="packageQuoteLabel">{{ packageQuoteLabel }}</span>
                <span>{{ t('admin.platformSuppliers.reviewStatus') }}: {{ quoteStatusLabel(skuStatus, skuStatusI18n) }}</span>
                <span>{{ t('admin.supplierPricing.quoteMode') }}: {{ quoteModeText }}</span>
              </p>
              <div v-if="hourlyQuoteReview" class="quote-head__hourly-rates">
                <span v-if="staffHourQuote">{{ t('admin.platformSuppliers.hourlyRateLabel') }}: {{ hourlyRateText(skuUnitPrice, true) }}</span>
                <template v-else>
                  <span>{{ t('admin.platformSuppliers.hourlyRateWithMaterial') }}: {{ hourlyRateText(skuUnitPriceWithMaterial, true) }}</span>
                  <span>{{ t('admin.platformSuppliers.hourlyRateWithoutMaterial') }}: {{ hourlyRateText(skuUnitPriceWithoutMaterial, true) }}</span>
                </template>
              </div>
              <p v-if="skuRejectReason" class="quote-head__reason">{{ skuRejectReason }}</p>
            </div>
            <div class="quote-toolbar">
              <div
                v-if="!hourlyQuoteReview && reviewSkuRows.length"
                class="quote-status-counts"
                :aria-label="t('admin.platformSuppliers.lineReviewStatus')"
              >
                <span v-for="item in lineStatusCounts" :key="item.key" class="quote-status-count" :class="item.tone">
                  <b>{{ item.count }}</b>
                  <span>{{ item.label }}</span>
                </span>
              </div>
              <div class="quote-head__actions">
                <button v-if="!packageQuoteReview" type="button" class="act" :disabled="quoteImporting || !detailId" @click="quoteHistoryOpen = true">
                  {{ t('admin.platformSuppliers.quoteHistory.title') }}
                </button>
                <button v-if="canRejectWholeQuote" type="button" class="act no" :disabled="saving" @click="openWholeQuoteReject()">{{ t('admin.platformSuppliers.rejectQuote') }}</button>
                <button v-if="!packageQuoteReview" type="button" class="act" :disabled="quoteExporting || !detailId" @click="downloadQuoteSheet">
                  {{ quoteExporting ? t('admin.platformSuppliers.exportingQuotes') : quoteExportLabel }}
                </button>
                <button v-if="!packageQuoteReview" type="button" class="act navy" :disabled="quoteImporting || !detailId" @click="quoteFileInput?.click()">
                  {{ quoteImporting ? t('admin.platformSuppliers.importingQuotes') : t('admin.platformSuppliers.importQuoteSheet') }}
                </button>
              </div>
            </div>
          </header>
          <section v-if="hourlyQuoteReview" v-loading="skuLoading" class="hourly-review">
            <div class="hourly-review__content">
              <div class="hourly-review__rates">
                <div v-if="staffHourQuote">
                  <span>{{ t('admin.platformSuppliers.hourlyRateLabel') }}</span>
                  <strong>{{ hourlyRateText(skuUnitPrice, true) }}</strong>
                  <small v-if="hourlyCompareLabel(null)" class="hourly-review__compare" :class="{ 'is-negative': hourlyCompareNegative(null) }">{{ hourlyCompareLabel(null) }}</small>
                  <small v-else class="hourly-review__compare is-muted">{{ hourlyCompareGapText(null) }}</small>
                </div>
                <template v-else>
                  <div>
                    <span>{{ t('admin.platformSuppliers.hourlyRateWithMaterial') }}</span>
                    <strong>{{ hourlyRateText(skuUnitPriceWithMaterial, true) }}</strong>
                    <small v-if="hourlyCompareLabel('with')" class="hourly-review__compare" :class="{ 'is-negative': hourlyCompareNegative('with') }">{{ hourlyCompareLabel('with') }}</small>
                    <small v-else class="hourly-review__compare is-muted">{{ hourlyCompareGapText('with') }}</small>
                  </div>
                  <div>
                    <span>{{ t('admin.platformSuppliers.hourlyRateWithoutMaterial') }}</span>
                    <strong>{{ hourlyRateText(skuUnitPriceWithoutMaterial, true) }}</strong>
                    <small v-if="hourlyCompareLabel('without')" class="hourly-review__compare" :class="{ 'is-negative': hourlyCompareNegative('without') }">{{ hourlyCompareLabel('without') }}</small>
                    <small v-else class="hourly-review__compare is-muted">{{ hourlyCompareGapText('without') }}</small>
                  </div>
                </template>
              </div>
              <p>{{ t(staffHourQuote ? 'admin.platformSuppliers.staffHourReviewHint' : 'admin.platformSuppliers.hourlyReviewHint') }}</p>
            </div>
            <div v-if="showHourlyReview" class="hourly-review__actions">
              <button type="button" class="act no" :disabled="saving" @click="openHourlyReject">{{ t('admin.platformSuppliers.reject') }}</button>
              <button type="button" class="act navy" :disabled="saving" @click="reviewHourlyQuote(2)">{{ t('admin.platformSuppliers.approve') }}</button>
            </div>
          </section>
          <p v-if="!hourlyQuoteReview" class="muted">{{ t('admin.platformSuppliers.grossMarginHint') }}</p>
          <div v-if="!hourlyQuoteReview || orderedSkuAttaches.length" class="quote-lines" :class="{ 'is-review-attaches': pendingReviewAttaches.length }">
          <el-table
            v-if="!hourlyQuoteReview"
            class="quote-table"
            scrollbar-always-on
            v-loading="skuLoading"
            :data="reviewSkuRows"
            row-key="skuId"
            :empty-text="t('admin.platformSuppliers.noSpecs')"
            @selection-change="onReviewSelectionChange"
          >
            <el-table-column v-if="showLineReview" type="selection" width="38" align="center" fixed="left" :selectable="isLineSelectable" />
            <el-table-column v-if="skuGroupLabel" :label="skuGroupLabel" width="148" fixed="left">
              <template #default="{ row }">{{ row.groupValue || '—' }}</template>
            </el-table-column>
            <el-table-column v-for="column in skuColumns" :key="column.key" :label="specColumnLabel(column)" width="132" fixed="left">
              <template #default="{ row }">{{ specCell(row.specs[column.key]) }}</template>
            </el-table-column>
            <el-table-column v-if="showSkuCodeColumn" label="SKU" prop="skuCode" width="112" fixed="left" />
            <el-table-column class-name="quote-price-col" label-class-name="quote-price-col" :label="t('admin.platformSuppliers.clientPrice')" min-width="176" align="right">
              <template #default="{ row }">{{ moneyText(clientPrice(row)) }}</template>
            </el-table-column>
            <el-table-column class-name="quote-price-col" label-class-name="quote-price-col" :label="t('admin.platformSuppliers.taxQuote')" min-width="196" align="right">
              <template #default="{ row }">
                {{ moneyText(reviewQuoteAmount(row)) }}
                <small v-if="priceDiffers(row)" class="price-change-note">{{ t('admin.platformSuppliers.pendingDifferent') }}</small>
              </template>
            </el-table-column>
            <el-table-column class-name="quote-price-col" label-class-name="quote-price-col" :label="t('admin.platformSuppliers.margin')" min-width="112" align="right">
              <template #default="{ row }">{{ marginText(row) }}</template>
            </el-table-column>
            <el-table-column class-name="quote-price-col" label-class-name="quote-price-col" :label="t('admin.platformSuppliers.effectivePrice')" min-width="128" align="right">
              <template #default="{ row }">{{ moneyText(row.approvedPrice) }}</template>
            </el-table-column>
            <el-table-column :label="t('admin.platformSuppliers.lineReviewStatus')" width="168" fixed="right">
              <template #default="{ row }">
                <div class="line-review-result">
                  <el-tag v-if="lineEffectLabel(row)" :type="lineReviewTagType(row)" effect="light">{{ lineEffectLabel(row) }}</el-tag>
                  <small v-if="Number(row.reviewStatus) === 3 && row.rejectReason">{{ row.rejectReason }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="showLineReview" :label="t('admin.platformSuppliers.actions')" width="147" fixed="right">
              <template #default="{ row }">
                <div v-if="isLineSelectable(row)" class="line-actions">
                  <button type="button" class="act no" :disabled="saving" @click="openLineReject([row])">{{ t('admin.platformSuppliers.reject') }}</button>
                  <button type="button" class="act navy" :disabled="saving" @click="approveLine(row)">{{ t('admin.platformSuppliers.approve') }}</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <section v-if="orderedSkuAttaches.length" class="sku-attaches">
            <h4>{{ t('admin.platformSuppliers.addons') }}</h4>
            <div v-for="item in orderedSkuAttaches" :key="item.attachValueId" class="sku-attach">
              <label v-if="isAttachSelectable(item)" class="sku-attach__check">
                <input
                  type="checkbox"
                  :checked="isAttachSelected(item)"
                  :disabled="saving"
                  @change="onAttachCheck(item, $event)"
                />
              </label>
              <div>
                <strong>{{ attachName(item) }}<template v-if="attachUnit(item)"> / {{ attachUnit(item) }}</template></strong>
                <small>{{ t('admin.platformSuppliers.addonMeta', { type: attachTypeName(item), platform: moneyText(item.platformPriceWithTax ?? item.platformPrice), quote: moneyText(item.quotePrice), margin: profitRateText(item.profitRate), approved: moneyText(item.approvedPrice), approvedMargin: profitRateText(item.approvedProfitRate) }) }}</small>
                <small v-if="Number(item.reviewStatus) === 3 && item.rejectReason">{{ item.rejectReason }}</small>
              </div>
              <div class="sku-attach__side">
                <el-tag v-if="attachEffectLabel(item)" :type="lineReviewTagType(item)" effect="light">{{ attachEffectLabel(item) }}</el-tag>
                <span class="sku-attach__margin" :class="{ 'is-negative': Number(item.profitRate) < 0 }">{{ profitRateText(item.profitRate) }}</span>
                <span>{{ item.offered ? moneyText(item.quotePrice) : t('admin.platformSuppliers.unavailable') }}</span>
                <div v-if="isAttachSelectable(item)" class="line-actions">
                  <button type="button" class="act no" :disabled="saving" @click="openLineReject([], [item])">{{ t('admin.platformSuppliers.reject') }}</button>
                  <button type="button" class="act navy" :disabled="saving" @click="approveAttach(item)">{{ t('admin.platformSuppliers.approve') }}</button>
                </div>
              </div>
            </div>
          </section>
          </div>
          <footer v-if="showQuoteFoot" class="quote-foot">
            <span class="quote-foot__selection">{{ t('admin.platformSuppliers.selectedLines', { count: selectedReviewCount }) }}</span>
            <button type="button" class="act no" :disabled="saving" @click="selectedReviewCount ? openLineReject() : openWholeQuoteReject()">{{ selectedReviewCount ? t('admin.platformSuppliers.reject') : t('admin.platformSuppliers.rejectQuote') }}</button>
            <button type="button" class="act navy" :disabled="saving || !selectedReviewCount" @click="approveSelectedLines">{{ t('admin.platformSuppliers.approve') }}</button>
          </footer>
        </section>
      </div>
    </section>

    <SupplierQuoteImportHistory
      v-model="quoteHistoryOpen"
      :supplier-id="detailId"
      :supplier-name="profile.companyName || current?.supplierName || ''"
    />

    <el-dialog
      v-model="filePreview.open"
      class="policy-preview supplier-review-dialog"
      :title="filePreview.name"
      width="min(768px, 92vw)"
      append-to-body
      :z-index="6000"
      destroy-on-close
    >
      <SupplierDocumentPreview
        :url="filePreview.url"
        :name="filePreview.name"
        :kind="filePreview.kind"
        :active="filePreview.open"
        compact
      />
    </el-dialog>


    <input
      ref="quoteFileInput"
      class="quote-file-input"
      type="file"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      @change="importQuoteFile"
    />

    <el-dialog v-model="rejectOpen" :title="t('admin.platformSuppliers.rejectOnboarding')" class="supplier-review-dialog" width="min(368px, calc(100vw - 32px))" append-to-body>
      <el-input v-model="rejectReason" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="t('admin.platformSuppliers.reasonPlaceholder')" />
      <template #footer>
        <el-button @click="rejectOpen = false">{{ t('admin.platformSuppliers.cancel') }}</el-button>
        <el-button type="danger" :loading="saving" @click="submitReject">{{ t('admin.platformSuppliers.confirmReject') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="priceChangeRejectOpen" :title="t('admin.platformSuppliers.rejectPriceChange')" class="supplier-review-dialog" width="min(368px, calc(100vw - 32px))" append-to-body>
      <p v-if="priceChangeTarget?.priceChangeReason" class="line-reject-summary">{{ t('admin.platformSuppliers.priceChangeReasonLabel', { reason: priceChangeTarget.priceChangeReason }) }}</p>
      <el-input v-model="priceChangeRejectReason" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="t('admin.platformSuppliers.reasonPlaceholder')" />
      <template #footer>
        <el-button @click="priceChangeRejectOpen = false">{{ t('admin.platformSuppliers.cancel') }}</el-button>
        <el-button type="danger" :loading="saving" @click="submitPriceChangeReject">{{ t('admin.platformSuppliers.confirmReject') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="lineRejectOpen" :title="rejectingWholeQuote || hourlyRejecting || rejectDialogCount <= 1 ? t('admin.platformSuppliers.rejectQuote') : t('admin.platformSuppliers.rejectSelectedTitle')" class="supplier-review-dialog" width="min(368px, calc(100vw - 32px))" append-to-body @closed="resetQuoteReject">
      <p v-if="hourlyRejecting" class="line-reject-summary">{{ t('admin.platformSuppliers.hourlyRejectHint') }}</p>
      <p v-else-if="rejectingWholeQuote && rejectDialogCount" class="line-reject-summary">{{ t('admin.platformSuppliers.rejectWholeCountHint', { count: rejectDialogCount }) }}</p>
      <p v-else-if="rejectingWholeQuote" class="line-reject-summary">{{ t('admin.platformSuppliers.rejectWholeHint') }}</p>
      <p v-else class="line-reject-summary">{{ t('admin.platformSuppliers.rejectSelectedHint', { count: rejectDialogCount }) }}</p>
      <el-input v-model="lineRejectReason" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="t('admin.platformSuppliers.reasonPlaceholder')" />
      <template #footer>
        <el-button @click="lineRejectOpen = false">{{ t('admin.platformSuppliers.cancel') }}</el-button>
        <el-button type="danger" :loading="saving" @click="rejectSelectedLines">{{ t('admin.platformSuppliers.confirmReject') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import AdminBreadcrumb from '@/modules/admin/components/AdminBreadcrumb.vue'
import SupplierDocumentPreview from '@/modules/admin/components/SupplierDocumentPreview.vue'
import { listBySpu, listSpuAttachCatalog, page as productPage } from '@/modules/admin/api/spu'
import { page as supplierPage } from '@/modules/admin/api/supplier'
import SupplierQuoteImportHistory from '@/modules/admin/components/SupplierQuoteImportHistory.vue'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import { dispatchEligibility, licenceExpiryState, supplierOperationsReady } from '@/modules/admin/utils/supplierReviewState'
import { countQuoteLineStatuses, hourlyCompareGap, hourlyMarginPercent, hourlySupplierCost, quotePriceView, summarizeHourlyCompare } from '@/modules/admin/utils/supplierPortal'
import {
  sortSupplierQueue,
  supplierMatchesQueueFocus,
  supplierQuoteBadges,
  type SupplierQueueFocus,
} from '@/modules/admin/utils/supplierQueue'
import { listServiceCategories, serviceCategoryLabel } from '@/modules/client/api/supplier-onboarding'
import {
  onboardingChangeStatus,
  onboardingDetail,
  onboardingPage,
  platformSupplierQuotePage,
  platformSupplierQuoteReview,
  reviewQuotePriceChange,
  platformSupplierQuoteServices,
  platformSupplierQuoteSkus,
  supplierPackageQuotes,
  exportPlatformQuoteSheet,
  importPlatformQuoteSheet,
  serviceCatalog,
} from '@/modules/admin/api/supplierWorkbench'
import { packageServiceSpuIds } from '@/modules/admin/utils/supplierServiceCatalog'

type ServiceCategory = {
  categoryId: number
  categoryName?: string
  nameI18n?: Record<string, string>
}

type SupplierRow = {
  id: number
  supplierNo?: string
  supplierName: string
  contactPerson: string
  mobile: string
  serviceCount: number
  serviceCategories?: ServiceCategory[]
  expectedCategoryIds?: string[]
  onboardingStatus?: number
  onboardingStatusI18n?: Record<string, string>
  pendingCount?: number
  priceChangePendingCount?: number
  effectiveCount?: number
  rejectedCount?: number
  licenseExpiry?: string
  supplierType?: number
  nationality?: string
  residentialCity?: string
  pendingReview?: boolean
  latestSubmitTime?: string
  profileChangeCount?: number
}

type ProfileChange = {
  field?: string
  labelI18n?: Record<string, string>
  beforeI18n?: Record<string, string>
  afterI18n?: Record<string, string>
}

const route = useRoute()
const router = useRouter()
const props = defineProps<{ desk?: 'quotes' }>()
const quoteDesk = computed(() => props.desk === 'quotes')
const QUOTE_DESK_PATH = '/admin/basic/quotes'
const { t, locale } = useI18n({ useScope: 'global' })
const keyword = ref('')
const serviceIds = ref<number[]>([])
const serviceOptions = ref<Array<{ id: number; name: string }>>([])
const selectedServiceOptions = ref<Array<{ id: number; name: string }>>([])
const serviceSearchLoading = ref(false)
const serviceKeyword = ref('')
const serviceCategoryFilter = ref('')
const serviceStatusFilter = ref<number | ''>('')
const quoteStatus = ref<number | ''>('')
const readStatusQuery = () => {
  const status = Number(route.query.onboardingStatus)
  return status === 0 || status === 1 || status === 2 || status === 3 ? status : ''
}
const onboardingStatus = ref<number | '' | null>(readStatusQuery())
const needReview = ref<'' | 'yes' | 'no' | null>('')
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const suppliers = ref<SupplierRow[]>([])

const detailId = computed(() => {
  const id = Number(route.query.id)
  return Number.isFinite(id) && id > 0 ? id : 0
})
const screen = computed(() => {
  if (!detailId.value) return 'list'
  return String(route.query.view || '') === 'quote' ? 'quote' : 'supplier'
})
const quoteScope = computed<'services' | 'packages'>(() => {
  if (String(route.query.scope || '') === 'packages' || Number(route.query.package) > 0 || String(route.query.tab || '') === 'packages') return 'packages'
  return 'services'
})
const detailTab = computed(() => {
  if (quoteDesk.value) return quoteScope.value === 'packages' ? 'packages' : 'quotes'
  const view = String(route.query.view || '')
  if (view === 'quote') return route.query.package ? 'packages' : 'quotes'
  const tab = String(route.query.tab || 'overview')
  return ['overview', 'company', 'capacity', 'bank', 'docs'].includes(tab) ? tab : 'overview'
})
const packageQuoteReview = computed(() => Number(route.query.package) > 0)
const reviewCounts = reactive({
  onboarding: 0,
  quotePending: 0,
  priceChange: 0,
  licence: 0,
})
const queueFocus = ref<Exclude<SupplierQueueFocus, 'noQuote'> | ''>('')
const detailLoading = ref(false)
const quoteRoutePending = ref(false)
const saving = ref(false)
const exportingPrices = ref(false)
const quoteExporting = ref(false)
const quoteImporting = ref(false)
const quoteHistoryOpen = ref(false)
const quoteFileInput = ref<HTMLInputElement | null>(null)
const current = ref<SupplierRow | null>(null)
const profile = reactive<Record<string, any>>({})
const individualSupplier = computed(() => Number(profile.supplierType) === 2)
const services = ref<any[]>([])
const packageQuotes = ref<any[]>([])
const packageKeyword = ref('')
const packageCategoryFilter = ref('')
const packageStatusFilter = ref<number | ''>('')
const onboarding = reactive({
  status: undefined as number | undefined,
  rejectReason: '',
  snapshotVersion: undefined as number | undefined,
  reviewKind: undefined as number | undefined,
})
const profileChanges = ref<ProfileChange[]>([])
const areaNames = computed(() =>
  (profile.serviceAreas || []).map((area: any) => area.areaName).filter(Boolean).join('、'),
)
const areaTags = computed(() => {
  const areas = Array.isArray(profile.serviceAreas) ? profile.serviceAreas : []
  const names = areas.map((area: any) => String(area.areaName || '').trim()).filter(Boolean)
  if (names.length) return names
  return String(profile.dubaiServiceAreas || '').split(/[、,]/).map((item) => item.trim()).filter(Boolean)
})
const supplierInitials = computed(() => {
  const name = String(profile.companyName || current.value?.supplierName || '').trim()
  const parts = name.split(/\s+/).filter(Boolean)
  return (parts.length ? parts : [name]).map((part) => part[0] || '').slice(0, 2).join('').toUpperCase() || '—'
})
const bankAccount = computed(() => {
  const extra = profile.extra && typeof profile.extra === 'object' ? profile.extra : {}
  const bank = extra.bank && typeof extra.bank === 'object' ? extra.bank : {}
  return {
    accountName: bank.accountName || '',
    bankName: bank.bankName || '',
    iban: bank.iban || '',
    swift: bank.swift || '',
    currency: bank.currency || '',
  }
})
const pendingQuoteCount = computed(() => services.value.filter((row) => Number(row.status) === 1).length)
const approvedQuoteCount = computed(() => services.value.filter((row) => Number(row.status) === 2).length)
const draftQuoteCount = computed(() => services.value.filter((row) => row.status == null || Number(row.status) === 0).length)
const bookableServiceCount = computed(() => services.value.filter((row) => Number(row.status) === 2 && Number(row.acceptOrder) !== 0).length)
const eligibilityKey = computed(() => dispatchEligibility({
  reviewStatus: onboarding.status,
  enabled: profile.enabled,
  acceptDispatch: profile.acceptDispatch,
  operationsReady: supplierOperationsReady({
    quotes: services.value,
    packageQuotes: packageQuotes.value,
    areas: profile.serviceAreas,
  }),
}))
const eligibilityLabel = computed(() => {
  const keys = {
    pendingVerification: 'eligibilityPending',
    verificationApproved: 'eligibilityApproved',
    setupIncomplete: 'eligibilitySetup',
    notBookable: 'eligibilityNotBookable',
    active: 'eligibilityActive',
    suspended: 'eligibilitySuspended',
    changesRequired: 'eligibilityChanges',
  } as const
  return t(`admin.supplierAvailability.${keys[eligibilityKey.value]}`)
})
const quoteRollup = computed(() => {
  if (pendingQuoteCount.value) return t('admin.platformSuppliers.quotesWaiting', { count: pendingQuoteCount.value })
  if (services.value.length && approvedQuoteCount.value === services.value.length) return t('admin.supplierPricing.quotationApproved')
  if (draftQuoteCount.value) return t('admin.platformSuppliers.draftQuotes', { count: draftQuoteCount.value })
  return '—'
})
const licenceState = computed(() => licenceExpiryState(profile.licenseExpiry))
const scheduleText = computed(() => {
  const saturday = Number(profile.saturdayService) === 1
  const sunday = Number(profile.sundayService) === 1
  const days = saturday && sunday
    ? t('admin.supplierAvailability.daysAll')
    : saturday
      ? t('admin.supplierAvailability.daysWithSaturday')
      : sunday
        ? t('admin.supplierAvailability.daysWithSunday')
        : t('admin.supplierAvailability.daysWeek')
  return t('admin.platformSuppliers.scheduleZone', { days, hours: text(profile.workingHours) })
})

type DocFile = { url: string; name: string; kind: 'image' | 'pdf' | 'other' }
const filePreview = reactive({
  open: false,
  url: '',
  name: '',
  kind: 'other' as DocFile['kind'],
})
const text = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value))
const LICENSE_AUTHORITY_OTHER = 'Other (type the authority name)'
const licenseIssuerText = (record: Record<string, any>) => {
  const extra = record?.extra && typeof record.extra === 'object' ? record.extra : {}
  const issued = String(extra.licenseIssuedBy || '').trim()
  const other = String(extra.licenseIssuedByOther || '').trim()
  if (issued === LICENSE_AUTHORITY_OTHER) return other || '—'
  return issued || '—'
}
const yesNo = (value: unknown) => (Number(value) === 1 ? t('admin.platformSuppliers.yes') : Number(value) === 0 ? t('admin.platformSuppliers.no') : '—')
const registeredCommunities = computed(() => [
  Number(profile.emaarOnboarded) === 1 ? 'Emaar' : '',
  Number(profile.nakheelOnboarded) === 1 ? 'Nakheel' : '',
  Number(profile.dubaiHoldingsOnboarded) === 1 ? 'Dubai Holdings' : '',
  Number(profile.otherCommunityOnboarded) === 1 ? t('admin.platformSuppliers.otherChip') : '',
].filter(Boolean))
const staffText = (available: unknown, count: unknown) => {
  if (available === null || available === undefined || available === '') return '—'
  if (Number(available) !== 1 || count === null || count === undefined || count === '') return yesNo(available)
  return t('admin.platformSuppliers.staffLine', { answer: yesNo(available), count })
}
const asFileList = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}
const fileNameFromUrl = (url: string) => {
  let path = url.split('?')[0].split('#')[0]
  try { path = decodeURIComponent(path) } catch { /* Preserve legacy file names. */ }
  return path.split('/').filter(Boolean).pop() || url
}
const fileKind = (url: string): DocFile['kind'] => {
  const name = fileNameFromUrl(url).toLowerCase()
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'image'
  if (name.endsWith('.pdf')) return 'pdf'
  return 'other'
}
const toDocFiles = (value: unknown): DocFile[] =>
  asFileList(value).map((url) => ({ url, name: fileNameFromUrl(url), kind: fileKind(url) }))
const documentGroups = computed(() => {
  const groups = [
    { label: t('admin.platformSuppliers.publicLiability'), answer: yesNo(profile.publicLiabilityInsurance), files: toDocFiles(profile.publicLiabilityInsuranceFile) },
    ...(individualSupplier.value ? [] : [
      { label: t('admin.platformSuppliers.employeeInsurance'), answer: yesNo(profile.employeeInsurance), files: toDocFiles(profile.employeeInsuranceFile) },
    ]),
  ]
  const extra = profile.extra && typeof profile.extra === 'object' ? profile.extra as Record<string, unknown> : {}
  const extraLabels: Record<string, string> = {
    tradeLicenseFile: t('admin.platformSuppliers.tradeLicense'),
    tradeLicenseFiles: t('admin.platformSuppliers.tradeLicense'),
    licenseFile: t('admin.platformSuppliers.tradeLicense'),
    vatFile: t('admin.platformSuppliers.vatCertificate'),
    otherDocuments: t('admin.supplierProfile.otherDocuments'),
  }
  Object.entries(extra).forEach(([key, value]) => {
    const files = toDocFiles(value).filter((file) => /^https?:\/\//i.test(file.url))
    if (files.length) groups.push({ label: extraLabels[key] || key, answer: '', files })
  })
  return groups
})
const imagePreviewList = (files: DocFile[]) =>
  files.filter((file) => file.kind === 'image').map((file) => file.url)
const imagePreviewIndex = (files: DocFile[], url: string) =>
  Math.max(0, imagePreviewList(files).indexOf(url))
const openFilePreview = (url: string) => {
  filePreview.url = url
  filePreview.name = fileNameFromUrl(url)
  filePreview.kind = fileKind(url)
  filePreview.open = true
}

const skuOpen = ref(false)
const skuLoading = ref(false)
const skuTitle = ref('')
const skuStatus = ref<number | undefined>()
const skuVersionNo = ref<number | undefined>()
const skuRejectReason = ref('')
const skuTarget = ref<any>(null)
const skuColumns = ref<{ key: string; nameI18n: Record<string, unknown> | null; fallback: string }[]>([])
const skuGroupLabel = ref('')
const skuRows = ref<any[]>([])
const hourlyCompareSources = ref<any[]>([])
const skuAttaches = ref<Array<{ attachValueId: number; typeName: string; typeNameI18n?: Record<string, unknown> | null; name: string; nameI18n?: Record<string, unknown> | null; unit?: string; unitI18n?: Record<string, unknown> | null; platformPrice: unknown; platformPriceWithTax?: unknown; profitRate?: unknown; approvedProfitRate?: unknown; approvedPrice: unknown; offered: boolean; quotePrice: unknown; reviewStatus?: number; rejectReason?: string }>>([])
const skuQuoteMode = ref<number | null>(null)
const skuReviewByUnitPrice = ref(false)
const skuUnitPrice = ref<unknown>(null)
const skuUnitPriceWithMaterial = ref<unknown>(null)
const skuUnitPriceWithoutMaterial = ref<unknown>(null)
const skuStatusI18n = ref<Record<string, string> | null>(null)
const hourlyRejecting = ref(false)
const rejectingWholeQuote = ref(false)
const pendingQuoteRow = ref<any>(null)

const rejectOpen = ref(false)
const rejectReason = ref('')
const rejectTarget = ref<any>(null)
const lineRejectOpen = ref(false)
const lineRejectReason = ref('')
const lineRejectTargets = ref<any[]>([])
const lineRejectAttachTargets = ref<any[]>([])
const selectedReviewAttaches = ref<any[]>([])
const priceChangeRejectOpen = ref(false)
const priceChangeRejectReason = ref('')
const priceChangeTarget = ref<any>(null)
const selectedReviewLines = ref<any[]>([])

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const quoteStatusLabel = (status?: number) => {
  const keys = ['quotationDraft', 'priceUnderReview', 'priceActive', 'priceRejected']
  const key = keys[Number(status)]
  return key ? t(`admin.supplierPricing.${key}`) : t('admin.platformSuppliers.quoteNone')
}
const serviceQuoteStatus = (row: { status?: number; priceChangeStatus?: number }) =>
  Number(row.priceChangeStatus) === 1
    ? t('admin.platformSuppliers.priceChangePending')
    : quoteStatusLabel(row.status)
const listLicenceState = (row: SupplierRow) => licenceExpiryState(row.licenseExpiry)
const quoteTagType = (status?: number) => (Number(status) === 1 ? 'warning' : Number(status) === 2 ? 'success' : Number(status) === 3 ? 'danger' : 'info')
const normalizeLineReviewStatus = (status: unknown) => {
  const value = Number(status)
  return value === 2 || value === 3 ? value : undefined
}
const lineReviewStatusLabel = (row: any) => {
  const value = normalizeLineReviewStatus(row?.reviewStatus)
  if (value === 2) return t('admin.platformSuppliers.lineApproved')
  if (value === 3) return t('admin.platformSuppliers.lineRejected')
  return ''
}
const priceDiffers = (row: { approvedPrice?: unknown; quotePrice?: unknown }) => {
  const active = Number(row.approvedPrice)
  const pending = Number(row.quotePrice)
  return Number.isFinite(active) && active > 0 && Number.isFinite(pending) && pending > 0 && Math.abs(active - pending) > 0.009
}
const lineEffectLabel = (row: any) => {
  const facts = quotePriceView({
    approvedPrice: row?.approvedPrice,
    quotePrice: row?.quotePrice,
    reviewStatus: row?.reviewStatus,
    quoteStatus: skuStatus.value,
    rejected: Number(row?.reviewStatus) === 3,
  })
  if (facts.view === 'rejected') return t('admin.supplierPricing.priceRejected')
  if (facts.view === 'approvedPending') return t('admin.platformSuppliers.priceEffectWaiting')
  if (facts.view === 'underReview') return t('admin.supplierPricing.priceUnderReview')
  if (facts.view === 'active') return t('admin.platformSuppliers.priceEffectActive')
  return lineReviewStatusLabel(row)
}
const sheetLineStatus = (row: any, quoteStatus: unknown, priceChangeStatus: unknown) => {
  const facts = quotePriceView({
    approvedPrice: row?.approvedPrice,
    quotePrice: row?.quotePrice,
    reviewStatus: row?.reviewStatus,
    quoteStatus,
    priceChangeStatus,
    rejected: Number(row?.reviewStatus) === 3,
  })
  if (facts.view === 'rejected') return t('admin.supplierPricing.priceRejected')
  if (facts.view === 'approvedPending') return t('admin.platformSuppliers.priceEffectWaiting')
  if (facts.view === 'underReview') return t('admin.supplierPricing.priceUnderReview')
  if (facts.view === 'active') return t('admin.platformSuppliers.priceEffectActive')
  if (facts.view === 'draft') return t('admin.supplierPricing.quoteDraft')
  return ''
}
const lineReviewTagType = (row: any) => {
  const value = normalizeLineReviewStatus(row?.reviewStatus)
  if (value === 2) return 'success'
  if (value === 3) return 'danger'
  return 'info'
}
const onboardingLabel = (status?: number) => {
  const keys = ['draft', 'pending', 'approved', 'rejected']
  const key = keys[Number(status)]
  return key ? t(`admin.platformSuppliers.${key}`) : '—'
}
const serviceName = (row: any) => {
  const localized = specText(row?.nameI18n)
  return localized !== '—' ? localized : (row?.spuName || '—')
}
const skuDialogTitle = computed(() => {
  const name = serviceName(skuTarget.value)
  if (name && name !== '—') return name
  return skuTitle.value || t('admin.platformSuppliers.serviceFallback')
})
const specColumnLabel = (column: { nameI18n?: unknown; fallback?: string }) => {
  const text = specText(column.nameI18n)
  return text !== '—' ? text : (column.fallback || '—')
}
const specCell = (value: unknown) => {
  const text = specText(value)
  return text === '—' ? '—' : text
}
const lineStatusRank = (row: { approvedPrice?: unknown; quotePrice?: unknown; reviewStatus?: unknown }) => {
  const view = quotePriceView({
    approvedPrice: row.approvedPrice,
    quotePrice: row.quotePrice,
    reviewStatus: row.reviewStatus,
    quoteStatus: skuStatus.value,
    rejected: Number(row.reviewStatus) === 3,
  }).view
  return view === 'underReview' ? 0 : 1
}
const reviewSkuRows = computed(() => skuRows.value
  .filter((row) => Number(row?.enabled) === 1 && row.available !== false)
  .map((row, index) => ({ row, index }))
  .sort((left, right) => lineStatusRank(left.row) - lineStatusRank(right.row) || left.index - right.index)
  .map((item) => item.row))
const orderedSkuAttaches = computed(() => skuAttaches.value
  .map((item, index) => ({ item, index }))
  .sort((left, right) => {
    const rank = (entry: typeof left) => lineStatusRank({
      approvedPrice: entry.item.approvedPrice,
      quotePrice: entry.item.offered ? entry.item.quotePrice : null,
      reviewStatus: entry.item.reviewStatus,
    })
    return rank(left) - rank(right) || left.index - right.index
  })
  .map((entry) => entry.item))
const lineStatusCounts = computed(() => {
  const offeredAttaches = skuAttaches.value.filter((item) => item.offered).map((item) => ({
    reviewStatus: item.reviewStatus,
    quotePrice: item.quotePrice,
    approvedPrice: item.approvedPrice,
  }))
  const counts = countQuoteLineStatuses([...reviewSkuRows.value, ...offeredAttaches], skuStatus.value)
  const items = [
    { key: 'underReview', label: t('admin.supplierPricing.priceUnderReview'), count: counts.underReview, tone: 'is-review' },
    { key: 'rejected', label: t('admin.supplierPricing.priceRejected'), count: counts.rejected, tone: 'is-rejected' },
    { key: 'active', label: t('admin.platformSuppliers.priceEffectActive'), count: counts.active, tone: 'is-active' },
    { key: 'approvedPending', label: t('admin.platformSuppliers.priceEffectWaiting'), count: counts.approvedPending, tone: 'is-active' },
  ]
  if (counts.draft) items.push({ key: 'draft', label: t('admin.platformSuppliers.quoteDraft'), count: counts.draft, tone: 'is-draft' })
  if (counts.none) items.push({ key: 'none', label: t('admin.platformSuppliers.quoteNone'), count: counts.none, tone: 'is-draft' })
  return items
})
const showSkuCodeColumn = computed(() => !skuColumns.value.length || reviewSkuRows.value.some((row) =>
  skuColumns.value.every((column) => specCell(row?.specs?.[column.key]) === '—')))
const mergeAttachSource = (catalogAttaches: any[], quoteAttaches: any[]) => {
  const saved = Array.isArray(quoteAttaches) ? quoteAttaches : []
  if (!catalogAttaches.length) return saved
  const seen = new Set(catalogAttaches.map((item) => Number(item?.attachValueId)))
  const extras = saved.filter((item) => {
    const id = Number(item?.attachValueId)
    if (!id || seen.has(id)) return false
    const price = item?.quotePrice
    return price != null && price !== '' && Number.isFinite(Number(price))
  })
  return extras.length ? [...catalogAttaches, ...extras] : catalogAttaches
}
const attachName = (item: { nameI18n?: unknown; name?: string }) => {
  const text = specText(item.nameI18n)
  return text !== '—' ? text : (item.name || '—')
}
const attachTypeName = (item: { typeNameI18n?: unknown; typeName?: string }) => {
  const text = specText(item.typeNameI18n)
  return text !== '—' ? text : (item.typeName || '—')
}
const attachUnit = (item: { unitI18n?: unknown; unit?: string }) => {
  const text = specText(item.unitI18n)
  if (text !== '—') return text
  return String(item.unit || '').trim()
}
const serviceCategory = (row: any) => {
  const localized = specText(row?.categoryNameI18n)
  return localized !== '—' ? localized : (row?.categoryName || '—')
}
const serviceCategoryOptions = computed(() => {
  const names = services.value.map((row) => serviceCategory(row)).filter((name) => name && name !== '—')
  return [...new Set(names)]
})
const visibleServices = computed(() => services.value.filter((row) => {
  const keyword = serviceKeyword.value.trim().toLowerCase()
  if (keyword && !serviceName(row).toLowerCase().includes(keyword)) return false
  if (serviceCategoryFilter.value && serviceCategory(row) !== serviceCategoryFilter.value) return false
  if (serviceStatusFilter.value !== '' && Number(row.status) !== Number(serviceStatusFilter.value)) return false
  return true
}))
const packageLabel = (names: unknown, fallback?: unknown) => {
  const text = pickI18nText(names && typeof names === 'object' ? names as Record<string, unknown> : undefined, locale.value, '')
  return text || (fallback == null ? '' : String(fallback))
}
const packageServiceRows = computed(() => packageQuotes.value.flatMap((pkg) => {
  const servicesInPackage = Array.isArray(pkg?.services) ? pkg.services : []
  return servicesInPackage.filter((service: any) => service?.available !== false && Number(service?.spuId) > 0).map((service: any) => ({
    key: `${pkg.packageId}-${service.spuId}`,
    packageId: Number(pkg.packageId),
    packageName: packageLabel(pkg.nameI18n, pkg.packageName) || '—',
    categoryName: packageLabel(pkg.categoryNameI18n, pkg.categoryName) || '—',
    spuId: Number(service.spuId),
    spuName: service.spuName,
    nameI18n: service.nameI18n,
    status: service.status,
    statusI18n: service.statusI18n,
    rejectReason: service.rejectReason || '',
    priceChangeStatus: service.priceChangeStatus,
    priceChangeReason: service.priceChangeReason || '',
    skuIds: (Array.isArray(service.skus) ? service.skus : []).map((sku: any) => Number(sku?.skuId)).filter((id: number) => id > 0),
    attachIds: (Array.isArray(service.attaches) ? service.attaches : []).map((item: any) => Number(item?.attachValueId)).filter((id: number) => id > 0),
  }))
}))
const packageCategoryOptions = computed(() => [...new Set(packageServiceRows.value.map((row) => row.categoryName).filter((name) => name && name !== '—'))])
const visiblePackageServices = computed(() => packageServiceRows.value.filter((row) => {
  const keyword = packageKeyword.value.trim().toLowerCase()
  if (keyword && !`${row.packageName} ${serviceName(row)}`.toLowerCase().includes(keyword)) return false
  if (packageCategoryFilter.value && row.categoryName !== packageCategoryFilter.value) return false
  if (packageStatusFilter.value !== '' && Number(row.status) !== Number(packageStatusFilter.value)) return false
  return true
}))
const packageQuoteLabel = computed(() => {
  const packageId = Number(route.query.package)
  const spuId = Number(route.query.spu)
  const row = packageServiceRows.value.find((item) => item.packageId === packageId && item.spuId === spuId)
  return row?.packageName && row.packageName !== '—' ? row.packageName : ''
})
const packageSkuIdSet = (packageId: number, spuId: number) => {
  const row = packageServiceRows.value.find((item) => item.packageId === packageId && item.spuId === spuId)
  return new Set(row?.skuIds || [])
}
const packageAttachIdSet = (packageId: number, spuId: number) => {
  const row = packageServiceRows.value.find((item) => item.packageId === packageId && item.spuId === spuId)
  return new Set(row?.attachIds || [])
}
const quoteSpuId = (value: unknown) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : 0
}
const selectedQuoteSpuIds = ref<number[]>([])
const quoteSpuSelected = (spuId: unknown) => selectedQuoteSpuIds.value.includes(quoteSpuId(spuId))
const visibleQuoteSpuIds = computed(() => visibleServices.value.map((row) => quoteSpuId(row?.spuId)).filter((id) => id > 0))
const allVisibleQuotesSelected = computed(() => {
  const ids = visibleQuoteSpuIds.value
  return ids.length > 0 && ids.every((id) => selectedQuoteSpuIds.value.includes(id))
})
const someVisibleQuotesSelected = computed(() => {
  const ids = visibleQuoteSpuIds.value
  const selected = ids.filter((id) => selectedQuoteSpuIds.value.includes(id)).length
  return selected > 0 && selected < ids.length
})
const toggleQuoteSpu = (spuId: unknown, checked: boolean) => {
  const id = quoteSpuId(spuId)
  if (!id) return
  const next = new Set(selectedQuoteSpuIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedQuoteSpuIds.value = [...next]
}
const toggleVisibleQuoteSelection = (checked: boolean | string | number) => {
  const next = new Set(selectedQuoteSpuIds.value)
  for (const id of visibleQuoteSpuIds.value) {
    if (checked === true) next.add(id)
    else next.delete(id)
  }
  selectedQuoteSpuIds.value = [...next]
}
const quoteExportLabel = computed(() => selectedQuoteSpuIds.value.length
  ? t('admin.platformSuppliers.exportSelectedQuotes', { count: selectedQuoteSpuIds.value.length })
  : t('admin.platformSuppliers.exportQuoteSheet'))
watch(services, (rows) => {
  const ids = new Set((rows || []).map((row) => quoteSpuId(row?.spuId)).filter((id) => id > 0))
  const next = selectedQuoteSpuIds.value.filter((id) => ids.has(id))
  if (next.length !== selectedQuoteSpuIds.value.length) selectedQuoteSpuIds.value = next
})
const onboardingText = (status?: number, i18n?: Record<string, unknown> | null) => {
  const localized = specText(i18n)
  return localized !== '—' ? localized : onboardingLabel(status)
}
const onboardingStatusParam = () => {
  const value = onboardingStatus.value
  return value === '' || value == null ? undefined : Number(value)
}
const listedPhones = (phones?: string[]) => (phones || []).map((phone) => String(phone || '').trim()).filter(Boolean)
const moneyText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const hourlyRateText = (value: unknown, withCurrency = false) => {
  const text = moneyText(value)
  return text === '—' ? '-' : `${withCurrency ? 'AED ' : ''}${text}`
}
const clientPrice = (row: { platformPriceWithTax?: unknown }) => {
  const amount = Number(row.platformPriceWithTax)
  return Number.isFinite(amount) ? amount : null
}
const hourlyPricingActive = () =>
  skuQuoteMode.value === 2 || skuQuoteMode.value === 3 || skuReviewByUnitPrice.value === true
const platformHourlyInput = (row: any) => ({
  quoteMode: skuQuoteMode.value,
  unitPrice: skuUnitPrice.value,
  unitPriceWithMaterial: skuUnitPriceWithMaterial.value,
  unitPriceWithoutMaterial: skuUnitPriceWithoutMaterial.value,
  quotePrice: row?.quotePrice,
  staffCount: row?.staffCount,
  serviceHours: row?.serviceHours,
  platformPriceWithTax: row?.platformPriceWithTax,
  platformPrice: row?.platformPrice,
  platformOriginalPrice: row?.platformOriginalPrice,
  sources: [row?.specs, row?.specDetails, row?.groupValue],
})
const reviewQuoteAmount = (row: any) =>
  hourlyPricingActive() ? hourlySupplierCost(platformHourlyInput(row)) : row?.quotePrice
const hourlySourceUseful = (inputs: any[]) => {
  const summary = summarizeHourlyCompare(inputs, null)
  return summary.customerMin != null || summary.marginMin != null
}
const catalogHourlyInputs = (skus: any[]) => (Array.isArray(skus) ? skus : [])
  .filter((sku) => {
    if (!sku || typeof sku !== 'object') return false
    if (Number(sku.valid ?? 1) === 0) return false
    if (sku.available === false) return false
    if (sku.status != null && sku.status !== '' && Number(sku.status) === 0) return false
    const price = Number(sku.platformPriceWithTax ?? sku.price ?? sku.originalPrice)
    return Number.isFinite(price) && price > 0
  })
  .map((sku) => platformHourlyInput({
    platformPrice: sku.price ?? sku.platformPrice,
    platformOriginalPrice: sku.originalPrice ?? sku.platformOriginalPrice,
    platformPriceWithTax: sku.platformPriceWithTax,
    staffCount: sku.staffCount,
    serviceHours: sku.serviceHours,
    quotePrice: null,
    specs: sku,
    specDetails: [sku.specs, sku.groupSpecValueNameI18n, sku.groupSpecValueName],
    groupValue: sku.groupSpecValueName,
  }))
const quoteHourlyInputs = (skus: any[]) => (Array.isArray(skus) ? skus : [])
  .filter((sku) => sku && sku.available !== false && Number(sku.enabled ?? 1) === 1)
  .map((sku) => platformHourlyInput({
    platformPrice: sku.platformPrice,
    platformOriginalPrice: sku.platformOriginalPrice,
    platformPriceWithTax: sku.platformPriceWithTax,
    staffCount: sku.staffCount,
    serviceHours: sku.serviceHours,
    quotePrice: sku.quotePrice,
    specs: sku.specs,
    specDetails: [sku.specs, sku.groupSpecValueNameI18n, sku.groupSpecValueName],
    groupValue: sku.groupSpecValueName || sku.groupValue,
  }))
const hourlyCompare = (material: 'with' | 'without' | null) => summarizeHourlyCompare(
  hourlyCompareSources.value,
  material,
)
const formatCompareSpan = (min: number | null, max: number | null, suffix = '') => {
  if (min == null || max == null) return ''
  const left = suffix ? `${min}${suffix}` : moneyText(min)
  const right = suffix ? `${max}${suffix}` : moneyText(max)
  return left === right ? left : `${left} – ${right}`
}
const hourlyCompareLabel = (material: 'with' | 'without' | null) => {
  const summary = hourlyCompare(material)
  const prices = formatCompareSpan(summary.customerMin, summary.customerMax)
  const margins = formatCompareSpan(summary.marginMin, summary.marginMax, '%')
  return [
    prices ? t('admin.platformSuppliers.hourlyCustomerCompare', { prices }) : '',
    margins ? t('admin.platformSuppliers.hourlyMarginCompare', { margins }) : '',
  ].filter(Boolean).join(' · ')
}
const hourlyCompareNegative = (material: 'with' | 'without' | null) => {
  const summary = hourlyCompare(material)
  return summary.marginMin != null && summary.marginMin < 0
}
const hourlyCompareGapText = (material: 'with' | 'without' | null) => {
  const gap = hourlyCompareGap(hourlyCompareSources.value, material)
  if (gap === 'ok') return ''
  return t(gap === 'effort'
    ? 'admin.platformSuppliers.hourlyCompareMissingEffort'
    : 'admin.platformSuppliers.hourlyCompareMissingPrice')
}
const marginText = (row: { platformPrice?: unknown; platformOriginalPrice?: unknown; quotePrice?: unknown }) => {
  if (hourlyPricingActive()) {
    const percent = hourlyMarginPercent(platformHourlyInput(row))
    return percent == null ? '—' : `${percent}%`
  }
  const client = Number(clientPrice(row))
  const quote = Number(row.quotePrice)
  if (!Number.isFinite(client) || client <= 0 || !Number.isFinite(quote)) return '—'
  return `${Math.round(((client - quote) / client) * 100)}%`
}
const profitRateText = (value: unknown) => {
  if (value == null || value === '') return '—'
  const rate = Number(value)
  if (!Number.isFinite(rate)) return '—'
  const percent = Math.round((rate * 100 + Number.EPSILON) * 100) / 100
  const text = Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, '')
  return `${text}%`
}
const statusClass = (status?: number) => {
  const value = Number(status)
  if (value === 1) return 'pending'
  if (value === 2) return 'ok'
  if (value === 3) return 'bad'
  return 'muted-pill'
}
const reviewRowClass = ({ row }: { row: SupplierRow }) => (Number(row.onboardingStatus) === 1 ? 'is-waiting' : '')
const onboardingCategoryLabels = ref<Record<string, string>>({})
const changeLabel = (change: ProfileChange) =>
  pickI18nText(change.labelI18n, locale.value, change.field || '—') || change.field || '—'
const changeValue = (change: ProfileChange, side: 'before' | 'after') => {
  const raw = pickI18nText(side === 'before' ? change.beforeI18n : change.afterI18n, locale.value, '—') || '—'
  if (change.field !== 'expectedServiceCategoryIds' || raw === '—') return raw
  const names = raw.split(/[、,]/).map((item) => item.trim()).filter(Boolean)
    .map((id) => onboardingCategoryLabels.value[id] || id)
  return names.join('、') || '—'
}
const expectedServiceNames = computed(() => {
  const items = Array.isArray(profile.expectedServiceCategoryIds) ? profile.expectedServiceCategoryIds : []
  return items.map((id: unknown) => onboardingCategoryLabels.value[String(id)] || String(id)).filter(Boolean)
})
const displayCategoryCount = computed(() => {
  if (expectedServiceNames.value.length) return expectedServiceNames.value.length
  return new Set(services.value.map((row) => serviceCategory(row)).filter((name) => name && name !== '—')).size
})
const categoryName = (category: ServiceCategory) =>
  pickI18nText(category?.nameI18n, locale.value, category?.categoryName || '') || category?.categoryName || '—'
const specText = (value: unknown) => {
  locale.value
  if (value == null || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value !== 'object') return '—'
  const record = { ...(value as Record<string, unknown>) }
  delete record.remarkI18n
  const nested = record.nameI18n
  const source = nested && typeof nested === 'object' ? nested as Record<string, unknown> : record
  return pickI18nText(source, locale.value, '—') || '—'
}
const formatTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type OnboardingListItem = {
  id?: number
  supplierNo?: string
  companyName?: string
  contactPerson?: string
  mobile?: string
  status?: number
  pendingReview?: boolean
  modifyTime?: string
  licenseExpiry?: string
  supplierType?: number
  services?: ServiceCategory[]
  expectedServiceCategoryIds?: Array<number | string>
  profileChanges?: ProfileChange[]
}

const reviewChoice = () => (needReview.value === 'yes' || needReview.value === 'no' ? needReview.value : '')

const categoryIdsOf = (item: OnboardingListItem) => (
  Array.isArray(item.expectedServiceCategoryIds)
    ? item.expectedServiceCategoryIds.map((id) => String(id)).filter((id) => id !== '')
    : []
)

const attachOnboardingStatus = async (rows: SupplierRow[]) => {
  if (!rows.length) return rows
  const wanted = new Set(rows.map((row) => Number(row.id)))
  const statusById = new Map<number, number | undefined>()
  const reviewById = new Map<number, boolean>()
  const contactById = new Map<number, string>()
  const mobileById = new Map<number, string>()
  const expectedById = new Map<number, string[]>()
  const expiryById = new Map<number, string>()
  const typeById = new Map<number, number>()
  const changeCountById = new Map<number, number>()
  const statusPageSize = 200
  let statusPage = 1
  let statusTotal = 0
  do {
    const result = unwrap(await onboardingPage({ pageNum: statusPage, pageSize: statusPageSize })) || {}
    const list = Array.isArray(result.list) ? result.list : []
    statusTotal = Number(result.total || 0)
    list.forEach((item: OnboardingListItem) => {
      const id = Number(item.id)
      if (!wanted.has(id)) return
      const status = Number(item.status)
      statusById.set(id, Number.isFinite(status) ? status : undefined)
      if (typeof item.pendingReview === 'boolean') reviewById.set(id, item.pendingReview)
      const contact = String(item.contactPerson || '').trim()
      const mobile = String(item.mobile || '').trim()
      if (contact) contactById.set(id, contact)
      if (mobile) mobileById.set(id, mobile)
      const expected = categoryIdsOf(item)
      if (expected.length) expectedById.set(id, expected)
      const expiry = String(item.licenseExpiry || '').trim()
      if (expiry) expiryById.set(id, expiry)
      const supplierType = Number(item.supplierType)
      if (supplierType === 1 || supplierType === 2) typeById.set(id, supplierType)
      const changeCount = Array.isArray(item.profileChanges) ? item.profileChanges.length : 0
      if (changeCount) changeCountById.set(id, changeCount)
    })
    if (statusById.size >= wanted.size || list.length < statusPageSize) break
    statusPage += 1
  } while ((statusPage - 1) * statusPageSize < statusTotal && statusPage <= 5)
  return rows.map((row) => {
    const parsed = row.onboardingStatus == null ? NaN : Number(row.onboardingStatus)
    const id = Number(row.id)
    return {
      ...row,
      contactPerson: String(row.contactPerson || '').trim() || contactById.get(id) || '',
      mobile: String(row.mobile || '').trim() || mobileById.get(id) || '',
      expectedCategoryIds: expectedById.get(id) || [],
      onboardingStatus: Number.isFinite(parsed) ? parsed : statusById.get(id),
      pendingReview: reviewById.get(id),
      licenseExpiry: expiryById.get(id) || row.licenseExpiry,
      supplierType: typeById.get(id) ?? row.supplierType,
      profileChangeCount: changeCountById.get(id),
    }
  })
}

const collectOnboarding = async (review: 'yes' | 'no') => {
  const matched: OnboardingListItem[] = []
  const scanSize = 100
  let scanPage = 1
  let scanTotal = 0
  const wantReview = review === 'yes'
  do {
    const result = unwrap(await onboardingPage({
      pageNum: scanPage,
      pageSize: scanSize,
      ...(keyword.value ? { keyword: keyword.value } : {}),
      ...(onboardingStatusParam() == null ? {} : { status: onboardingStatusParam() }),
      pendingReview: wantReview,
    })) || {}
    const list = (Array.isArray(result.list) ? result.list : []) as OnboardingListItem[]
    scanTotal = Number(result.total || 0)
    list.forEach((item) => {
      if (item.pendingReview !== wantReview) return
      matched.push(item)
    })
    if (list.length < scanSize) break
    scanPage += 1
  } while ((scanPage - 1) * scanSize < scanTotal && scanPage <= 50)
  return matched
}

const collectQuoteRows = async (scope: 'list' | 'counts' = 'list') => {
  const rows: SupplierRow[] = []
  const scanSize = 100
  let scanPage = 1
  let scanTotal = 0
  do {
    const payload: Record<string, unknown> = { pageNum: scanPage, pageSize: scanSize }
    if (keyword.value) payload.keyword = keyword.value
    if (scope === 'list' && quoteStatus.value !== '') payload.quoteStatus = quoteStatus.value
    if (scope === 'list' && onboardingStatusParam() != null) payload.onboardingStatus = onboardingStatusParam()
    const result = unwrap(await platformSupplierQuotePage(payload)) || {}
    const list = (result.list || []) as SupplierRow[]
    rows.push(...list)
    scanTotal = Number(result.total || 0)
    if (list.length < scanSize) break
    scanPage += 1
  } while ((scanPage - 1) * scanSize < scanTotal && scanPage <= 50)
  return rows
}

const toReviewRow = (item: OnboardingListItem, quote?: SupplierRow): SupplierRow => {
  const groups = (item.services || []).filter((group) => group.categoryId)
  const serviceCount = groups.reduce((sum, group) => {
    const services = (group as { services?: unknown[] }).services
    return sum + (Array.isArray(services) ? services.length : 0)
  }, 0)
  return {
    id: Number(item.id),
    supplierNo: quote?.supplierNo || item.supplierNo,
    supplierName: quote?.supplierName || item.companyName || '',
    contactPerson: quote?.contactPerson || item.contactPerson || '',
    mobile: quote?.mobile || item.mobile || '',
    serviceCount: quote?.serviceCount ?? serviceCount,
    serviceCategories: quote?.serviceCategories?.length ? quote.serviceCategories : groups,
    onboardingStatus: quote?.onboardingStatus != null && quote.onboardingStatus !== undefined
      ? Number(quote.onboardingStatus)
      : (Number.isFinite(Number(item.status)) ? Number(item.status) : undefined),
    onboardingStatusI18n: quote?.onboardingStatusI18n,
    pendingReview: item.pendingReview,
    pendingCount: quote?.pendingCount,
    priceChangePendingCount: quote?.priceChangePendingCount,
    effectiveCount: quote?.effectiveCount,
    licenseExpiry: item.licenseExpiry || quote?.licenseExpiry,
    supplierType: Number(item.supplierType) === 2 || Number(quote?.supplierType) === 2
      ? 2
      : (Number(item.supplierType) === 1 || Number(quote?.supplierType) === 1 ? 1 : undefined),
    expectedCategoryIds: categoryIdsOf(item),
    latestSubmitTime: quote?.latestSubmitTime || item.modifyTime,
    profileChangeCount: Array.isArray(item.profileChanges) ? item.profileChanges.length : undefined,
  }
}

const ensureCategoryLabels = async () => {
  try {
    const options = await listServiceCategories()
    const labels: Record<string, string> = {}
    options.forEach((option) => {
      labels[option.categoryId] = serviceCategoryLabel(option, String(locale.value || 'zh'))
    })
    onboardingCategoryLabels.value = labels
  } catch {
    onboardingCategoryLabels.value = {}
  }
}

const displayCategories = (row: SupplierRow) => {
  void locale.value
  if (row.serviceCategories?.length) {
    return row.serviceCategories.map((cat) => ({
      key: String(cat.categoryId),
      label: categoryName(cat),
    }))
  }
  return (row.expectedCategoryIds || []).map((id) => ({
    key: id,
    label: onboardingCategoryLabels.value[id] || id,
  }))
}
const categorySummary = (row: SupplierRow) => displayCategories(row).map((cat) => cat.label).join('、')
const quoteBadge = supplierQuoteBadges
const reviewChips = computed(() => [
  {
    key: 'onboarding' as const,
    count: reviewCounts.onboarding,
    label: t('admin.platformSuppliers.reviewOnboarding'),
    tone: 'tone-pending',
    active: Number(onboardingStatus.value) === 1 && quoteStatus.value === '' && !queueFocus.value && !reviewChoice(),
  },
  {
    key: 'quotePending' as const,
    count: reviewCounts.quotePending,
    label: t('admin.platformSuppliers.reviewQuotes'),
    tone: 'tone-pending',
    active: quoteStatus.value === 1 && onboardingStatusParam() == null && !queueFocus.value && !reviewChoice(),
  },
  {
    key: 'priceChange' as const,
    count: reviewCounts.priceChange,
    label: t('admin.platformSuppliers.reviewPriceChange'),
    tone: 'tone-pending',
    active: queueFocus.value === 'priceChange' && quoteStatus.value === '' && onboardingStatusParam() == null && !reviewChoice(),
  },
  {
    key: 'licence' as const,
    count: reviewCounts.licence,
    label: t('admin.platformSuppliers.reviewLicence'),
    tone: 'tone-bad',
    active: queueFocus.value === 'licence' && quoteStatus.value === '' && onboardingStatusParam() == null && !reviewChoice(),
  },
])
const visibleReviewChips = computed(() => {
  if (quoteDesk.value) {
    if (quoteScope.value === 'packages') return []
    return reviewChips.value.filter((chip) => chip.key === 'quotePending' || chip.key === 'priceChange')
  }
  return reviewChips.value.filter((chip) => chip.key === 'onboarding' || chip.key === 'licence')
})
const clearReviewFilters = () => {
  quoteStatus.value = ''
  onboardingStatus.value = ''
  queueFocus.value = ''
  needReview.value = ''
}
const applyOnboardingFilter = (status: number) => {
  if (!Number.isFinite(status)) return
  const active = Number(onboardingStatus.value) === status && quoteStatus.value === '' && !queueFocus.value && !reviewChoice()
  clearReviewFilters()
  if (!active) onboardingStatus.value = status
  search()
}
const applyQuoteFilter = (status: number) => {
  const active = quoteStatus.value === status && onboardingStatusParam() == null && !queueFocus.value && !reviewChoice()
  clearReviewFilters()
  if (!active) quoteStatus.value = status
  search()
}
const applyQueueFocus = (focus: Exclude<SupplierQueueFocus, 'noQuote'>) => {
  const active = queueFocus.value === focus && quoteStatus.value === '' && onboardingStatusParam() == null && !reviewChoice()
  clearReviewFilters()
  if (!active) queueFocus.value = focus
  search()
}
const toggleReviewChip = (key: 'onboarding' | 'quotePending' | 'priceChange' | 'licence') => {
  if (key === 'onboarding') applyOnboardingFilter(1)
  else if (key === 'quotePending') applyQuoteFilter(1)
  else applyQueueFocus(key)
}
const focusRows = (rows: SupplierRow[]) => {
  const focus = queueFocus.value
  return focus ? rows.filter((row) => supplierMatchesQueueFocus(row, focus)) : rows
}
let supplierLoadGeneration = 0

const attachRejectedCounts = async (rows: SupplierRow[], generation: number) => {
  await Promise.all(rows.map(async (row) => {
    try {
      const list = unwrap(await platformSupplierQuoteServices(row.id)) || []
      const rejected = (Array.isArray(list) ? list : []).filter((item: { status?: unknown }) => Number(item?.status) === 3).length
      if (generation !== supplierLoadGeneration) return
      const current = suppliers.value.find((item) => item.id === row.id)
      if (current) current.rejectedCount = rejected
    } catch {
      if (generation !== supplierLoadGeneration) return
      const current = suppliers.value.find((item) => item.id === row.id)
      if (current) current.rejectedCount = 0
    }
  }))
}

const serviceOptionName = (item: any) => {
  const spu = item?.spu || item || {}
  return pickI18nText(item?.nameI18n, locale.value, String(spu.spuName || spu.name || ''))
}
const rememberServiceOptions = () => {
  const chosen = new Set(serviceIds.value.map((id) => Number(id)))
  const known = new Map([...selectedServiceOptions.value, ...serviceOptions.value].map((item) => [item.id, item]))
  selectedServiceOptions.value = [...chosen].flatMap((id) => {
    const option = known.get(id)
    return option ? [option] : []
  })
  const visible = new Map(serviceOptions.value.map((item) => [item.id, item]))
  selectedServiceOptions.value.forEach((item) => visible.set(item.id, item))
  serviceOptions.value = [...visible.values()]
}
const searchServices = async (query: string) => {
  const name = query.trim()
  if (!name) {
    serviceOptions.value = [...selectedServiceOptions.value]
    return
  }
  serviceSearchLoading.value = true
  try {
    const result = unwrap(await productPage({
      pageNum: 1,
      pageSize: 20,
      packageService: 0,
      shelfStatus: 1,
      nameKeyword: name,
    })) || {}
    const found = (Array.isArray(result.list) ? result.list : []).flatMap((item: any) => {
      const id = Number(item?.spu?.id ?? item?.id)
      const serviceName = serviceOptionName(item)
      return Number.isFinite(id) && id > 0 && serviceName ? [{ id, name: serviceName }] : []
    })
    const visible = new Map(found.map((item) => [item.id, item]))
    selectedServiceOptions.value.forEach((item) => visible.set(item.id, item))
    serviceOptions.value = [...visible.values()]
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.loadFailed'))
  } finally {
    serviceSearchLoading.value = false
  }
}
const fulfillableSupplierIds = async (ids: number[]) => {
  const spuIds = [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
  if (!spuIds.length) return null
  const matched = new Set<number>()
  const scanSize = 100
  let scanPage = 1
  let scanTotal = 0
  do {
    const result = unwrap(await supplierPage({ pageNum: scanPage, pageSize: scanSize, spuIds })) || {}
    const list = Array.isArray(result.list) ? result.list : []
    scanTotal = Number(result.total || 0)
    list.forEach((item: { id?: unknown }) => {
      const id = Number(item?.id)
      if (Number.isFinite(id) && id > 0) matched.add(id)
    })
    if (list.length < scanSize) break
    scanPage += 1
  } while ((scanPage - 1) * scanSize < scanTotal && scanPage <= 50)
  return matched
}
const matchesServiceFilter = (row: { id?: unknown }, allowed: Set<number> | null) =>
  !allowed || allowed.has(Number(row.id))

const loadSuppliers = async () => {
  const generation = ++supplierLoadGeneration
  loading.value = true
  const allowedPromise = fulfillableSupplierIds(serviceIds.value)
  const countsPromise = allowedPromise.then((allowed) => refreshReviewCounts(generation, allowed))
  try {
    await ensureCategoryLabels()
    const allowed = await allowedPromise
    const review = reviewChoice()
    const pageOf = (rows: SupplierRow[]) => {
      total.value = rows.length
      const start = (pageNum.value - 1) * pageSize
      return rows.slice(start, start + pageSize).map((row) => ({ ...row, rejectedCount: 0 }))
    }
    if (review) {
      const [onboardingRows, quoteRows] = await Promise.all([
        collectOnboarding(review),
        collectQuoteRows(),
      ])
      const quoteById = new Map(quoteRows.map((row) => [Number(row.id), row]))
      const merged = sortSupplierQueue(focusRows(onboardingRows
        .filter((item) => matchesServiceFilter(item, allowed))
        .filter((item) => quoteStatus.value === '' || quoteById.has(Number(item.id)))
        .map((item) => toReviewRow(item, quoteById.get(Number(item.id))))))
      if (generation !== supplierLoadGeneration) return
      const pageRows = pageOf(merged)
      suppliers.value = pageRows
      await countsPromise
      void attachRejectedCounts(pageRows, generation)
      return
    }
    const attachedRows = await attachOnboardingStatus(await collectQuoteRows())
    const rows = sortSupplierQueue(focusRows(attachedRows.filter((row) => matchesServiceFilter(row, allowed))))
    if (generation !== supplierLoadGeneration) return
    const pageRows = pageOf(rows)
    suppliers.value = pageRows
    await countsPromise
    void attachRejectedCounts(pageRows, generation)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.loadFailed'))
  } finally {
    if (generation === supplierLoadGeneration) loading.value = false
  }
}

const pageTotal = (result: unknown) => Number((unwrap(result) || {}).total || 0)

const refreshReviewCounts = async (generation: number, allowed: Set<number> | null) => {
  try {
    const keywordPayload = keyword.value ? { keyword: keyword.value } : {}
    const countedRowsPromise = collectQuoteRows('counts').then((rows) => attachOnboardingStatus(rows))
    const [onboardingResult, pendingResult, countedRows] = await Promise.all([
      allowed ? Promise.resolve(null) : platformSupplierQuotePage({ pageNum: 1, pageSize: 1, onboardingStatus: 1, ...keywordPayload }),
      allowed ? Promise.resolve(null) : platformSupplierQuotePage({ pageNum: 1, pageSize: 1, quoteStatus: 1, ...keywordPayload }),
      countedRowsPromise,
    ])
    if (generation !== supplierLoadGeneration) return
    const visibleRows = countedRows.filter((row) => matchesServiceFilter(row, allowed))
    reviewCounts.onboarding = allowed
      ? visibleRows.filter((row) => Number(row.onboardingStatus) === 1).length
      : pageTotal(onboardingResult)
    reviewCounts.quotePending = allowed
      ? visibleRows.filter((row) => Number(row.pendingCount) > 0).length
      : pageTotal(pendingResult)
    reviewCounts.priceChange = visibleRows.filter((row) => supplierMatchesQueueFocus(row, 'priceChange')).length
    reviewCounts.licence = visibleRows.filter((row) => supplierMatchesQueueFocus(row, 'licence')).length
  } catch {
    // Keep the previous counts when a summary request fails.
  }
}

const search = () => {
  pageNum.value = 1
  return loadSuppliers()
}
const searchFromFilters = () => {
  queueFocus.value = ''
  search()
}
const showEverySupplier = () => {
  quoteStatus.value = ''
  onboardingStatus.value = ''
  needReview.value = ''
  queueFocus.value = ''
  return search()
}
const changeQuoteStatus = (value: number | 'all' | '') => {
  if (value === 'all' || value === '' || value == null) return showEverySupplier()
  quoteStatus.value = Number(value)
  return searchFromFilters()
}
const changeOnboardingStatus = (value: number | 'all' | '' | null) => {
  onboardingStatus.value = value === 'all' || value === '' || value == null ? '' : Number(value)
  return searchFromFilters()
}
const changeNeedReview = (value: 'all' | 'yes' | 'no' | '' | null) => {
  needReview.value = value === 'yes' || value === 'no' ? value : ''
  return searchFromFilters()
}
const changePage = (page: number) => {
  pageNum.value = page
  loadSuppliers()
}

let reviewTicket = 0
let reviewRequest: Promise<void> = Promise.resolve()

const loadReview = (supplierId: number) => {
  const ticket = ++reviewTicket
  detailLoading.value = true
  profileChanges.value = []
  const request = (async () => {
  try {
    const [detail, serviceList, catalog, packageServiceCatalog, packageList] = await Promise.all([
      onboardingDetail(supplierId),
      platformSupplierQuoteServices(supplierId),
      serviceCatalog(supplierId, false).catch(() => null),
      serviceCatalog(supplierId, true).catch(() => null),
      supplierPackageQuotes(supplierId).catch(() => null),
    ])
    if (ticket !== reviewTicket) return
    const nextProfile = unwrap(detail) || {}
    Object.keys(profile).forEach((key) => delete profile[key])
    Object.assign(profile, nextProfile)
    listServiceCategories().then((options) => {
      const labels: Record<string, string> = {}
      options.forEach((option) => {
        labels[option.categoryId] = serviceCategoryLabel(option, locale.value)
      })
      onboardingCategoryLabels.value = labels
    }).catch(() => {})
    onboarding.status = nextProfile.status
    onboarding.rejectReason = nextProfile.rejectReason || ''
    onboarding.snapshotVersion = nextProfile.snapshotVersion == null || nextProfile.snapshotVersion === ''
      ? undefined
      : Number(nextProfile.snapshotVersion)
    onboarding.reviewKind = nextProfile.reviewKind == null || nextProfile.reviewKind === ''
      ? undefined
      : Number(nextProfile.reviewKind)
    profileChanges.value = Array.isArray(nextProfile.profileChanges) ? nextProfile.profileChanges : []
    const selection = new Map<number, { workerCount?: number }>()
    const categoryI18n = new Map<number, Record<string, string>>()
    const categoryContact = new Map<number, { contactName: string; contactPhones: string[] }>()
    ;(unwrap(catalog) || []).forEach((group: any) => {
      const categoryId = Number(group?.categoryId)
      if (categoryId && group?.nameI18n) categoryI18n.set(categoryId, group.nameI18n)
      if (categoryId) {
        categoryContact.set(categoryId, {
          contactName: String(group?.contactName || '').trim(),
          contactPhones: Array.isArray(group?.contactPhones) ? group.contactPhones : [],
        })
      }
      ;(group.services || []).forEach((service: any) => {
        if (!service.selected || Number(service.packageService) === 1) return
        selection.set(Number(service.spuId), {
          workerCount: service.workerCount,
        })
      })
    })
    const packageServiceIds = packageServiceSpuIds(unwrap(packageServiceCatalog) || [])
    const packageRows = unwrap(packageList)
    packageQuotes.value = Array.isArray(packageRows) ? packageRows : []
    services.value = (unwrap(serviceList) || []).flatMap((row: any) => {
      if (packageServiceIds.has(Number(row?.spuId))) return []
      const saved = categoryContact.get(Number(row?.categoryId))
      const contactName = row?.contactName == null
        ? (saved?.contactName || '')
        : String(row.contactName).trim()
      const contactPhones = Array.isArray(row?.contactPhones)
        ? row.contactPhones
        : (saved?.contactPhones || [])
      return {
        ...row,
        categoryNameI18n: categoryI18n.get(Number(row.categoryId)),
        workerCount: selection.get(Number(row.spuId))?.workerCount,
        contactName,
        contactPhones,
      }
    })
    current.value = {
      id: supplierId,
      supplierNo: nextProfile.supplierNo,
      supplierName: nextProfile.companyName || '',
      contactPerson: nextProfile.contactPerson || '',
      mobile: nextProfile.mobile || '',
      serviceCount: services.value.length,
      onboardingStatus: nextProfile.status,
    }
  } catch (error: any) {
    if (ticket !== reviewTicket) return
    ElMessage.error(error?.message || t('admin.platformSuppliers.reviewLoadFailed'))
  } finally {
    if (ticket === reviewTicket) detailLoading.value = false
  }
  })()
  reviewRequest = request
  return request
}

const openReview = (row: SupplierRow) => {
  if (quoteDesk.value) {
    router.push({ path: QUOTE_DESK_PATH, query: { id: String(row.id), scope: quoteScope.value } })
    return
  }
  router.push({ path: route.path, query: { id: String(row.id), tab: 'overview' } })
}
const backToList = () => {
  router.push({ path: route.path })
}
const openSupplierTab = (tab: string) => {
  router.push({ path: route.path, query: { id: String(detailId.value), tab } })
}
const setQuoteScope = (scope: 'services' | 'packages') => {
  if (scope === quoteScope.value && screen.value !== 'quote') return
  if (scope === 'packages') {
    quoteStatus.value = ''
    queueFocus.value = ''
  }
  const query: Record<string, string> = { scope }
  if (detailId.value) query.id = String(detailId.value)
  router.push({ path: QUOTE_DESK_PATH, query })
  if (!detailId.value) search()
}
const openQuoteDesk = (scope: 'services' | 'packages' = 'services') => {
  if (!detailId.value) return
  router.push({ path: QUOTE_DESK_PATH, query: { id: String(detailId.value), scope } })
}
const openQuotes = () => setQuoteScope('services')
const openPackages = () => setQuoteScope('packages')
const openQuote = (row: { spuId?: number }) => {
  router.push({
    path: QUOTE_DESK_PATH,
    query: { id: String(detailId.value), view: 'quote', spu: String(row.spuId || ''), scope: 'services' },
  })
}
const openPackageQuote = (row: { spuId?: number; packageId?: number }) => {
  router.push({
    path: QUOTE_DESK_PATH,
    query: {
      id: String(detailId.value),
      view: 'quote',
      spu: String(row.spuId || ''),
      package: String(row.packageId || ''),
      scope: 'packages',
    },
  })
}
const crumbBack = () => {
  if (screen.value === 'quote') {
    if (packageQuoteReview.value) openPackages()
    else openQuotes()
  } else backToList()
}
const breadcrumbItems = computed(() => [
  { label: quoteDesk.value ? t('admin.platformSuppliers.quoteDeskTitle') : t('admin.platformSuppliers.title'), onClick: backToList },
  ...(screen.value === 'list' ? [] : [{
    label: profile.companyName || current.value?.supplierName || '—',
    onClick: () => (packageQuoteReview.value ? openPackages() : openQuotes()),
  }]),
  ...(screen.value === 'quote' ? [
    {
      label: t(packageQuoteReview.value ? 'admin.platformSuppliers.packages' : 'admin.platformSuppliers.serviceQuotes'),
      onClick: () => (packageQuoteReview.value ? openPackages() : openQuotes()),
    },
    { label: skuDialogTitle.value },
  ] : []),
])

const supplierDecisionName = (row?: { supplierName?: string } | null) => {
  const named = String(row?.supplierName || profile.companyName || current.value?.supplierName || '').trim()
  return named || t('admin.platformSuppliers.detailTitle')
}

const confirmReview = async (message: string, title: string, confirmText: string) => {
  try {
    await ElMessageBox.confirm(message, title, {
      type: 'warning',
      customClass: 'supplier-review-confirm',
      confirmButtonText: confirmText,
      cancelButtonText: t('admin.platformSuppliers.cancel'),
    })
    return true
  } catch {
    return false
  }
}

const approveOnboarding = async () => {
  if (!detailId.value || saving.value) return
  const firstReview = onboarding.reviewKind !== 2
  const name = supplierDecisionName()
  const confirmed = await confirmReview(
    t(firstReview ? 'admin.platformSuppliers.approveOnboardingConfirm' : 'admin.platformSuppliers.approveChangesConfirm', { name }),
    t(firstReview ? 'admin.platformSuppliers.approveOnboardingTitle' : 'admin.platformSuppliers.approveChangesTitle'),
    t(firstReview ? 'admin.platformSuppliers.approveOnboarding' : 'admin.platformSuppliers.approveChangesTitle'),
  )
  if (!confirmed) return
  saving.value = true
  try {
    await onboardingChangeStatus({ id: detailId.value, status: 2 })
    ElMessage.success(t(firstReview ? 'admin.platformSuppliers.approveOnboardingSuccess' : 'admin.platformSuppliers.approveChangesSuccess'))
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.approveOnboardingFailed'))
  } finally {
    saving.value = false
  }
}

const approveOnboardingRow = async (row: SupplierRow) => {
  if (saving.value) return
  const confirmed = await confirmReview(
    t('admin.platformSuppliers.approveOnboardingConfirm', { name: supplierDecisionName(row) }),
    t('admin.platformSuppliers.approveOnboardingTitle'),
    t('admin.platformSuppliers.approve'),
  )
  if (!confirmed) return
  saving.value = true
  try {
    await onboardingChangeStatus({ id: row.id, status: 2 })
    ElMessage.success(t('admin.platformSuppliers.approveOnboardingSuccess'))
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.approveOnboardingFailed'))
  } finally {
    saving.value = false
  }
}

const isPendingReviewLine = (row: any) => row?.quoted === true
  && Number(row?.enabled) === 1
  && normalizeLineReviewStatus(row?.reviewStatus) == null
const pendingReviewLines = computed(() => skuRows.value.filter(isPendingReviewLine))
const quoteModeCode = (value: unknown) => {
  const code = Number(value)
  return code === 1 || code === 2 || code === 3 ? code : null
}
const displayedQuoteMode = (quote?: { quoteMode?: unknown; configuredQuoteMode?: unknown } | null) => {
  const saved = quoteModeCode(quote?.quoteMode)
  const configured = quoteModeCode(quote?.configuredQuoteMode)
  if ((saved == null || saved === 1) && (configured === 2 || configured === 3)) return configured
  return saved
}
const positiveRate = (value: unknown) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0
}
const quoteHasHourlyRate = (
  quote?: { unitPrice?: unknown; unitPriceWithMaterial?: unknown; unitPriceWithoutMaterial?: unknown } | null,
  mode?: number | null,
) => {
  if (mode === 3) return positiveRate(quote?.unitPrice)
  if (mode === 2) {
    return positiveRate(quote?.unitPriceWithMaterial)
      || positiveRate(quote?.unitPriceWithoutMaterial)
      || positiveRate(quote?.unitPrice)
  }
  return false
}
const quoteUsesHourlyReview = (quote?: {
  quoteMode?: unknown
  configuredQuoteMode?: unknown
  reviewByUnitPrice?: unknown
  unitPrice?: unknown
  unitPriceWithMaterial?: unknown
  unitPriceWithoutMaterial?: unknown
} | null) => {
  const mode = displayedQuoteMode(quote)
  const hourlyMode = mode === 2 || mode === 3 || quote?.reviewByUnitPrice === true
  return hourlyMode && quoteHasHourlyRate(quote, mode === 3 ? 3 : 2)
}
const staffHourQuote = computed(() => skuQuoteMode.value === 3)
const quoteModeText = computed(() => {
  if (skuQuoteMode.value === 3) return t('admin.platformSuppliers.personHour')
  if (skuQuoteMode.value === 2) return t('admin.platformSuppliers.unitPrice')
  if (skuQuoteMode.value === 1) return t('admin.platformSuppliers.fixedPrice')
  return t('admin.platformSuppliers.modeUnset')
})
const hourlyQuoteReview = computed(() => quoteUsesHourlyReview({
  quoteMode: skuQuoteMode.value,
  reviewByUnitPrice: skuReviewByUnitPrice.value,
  unitPrice: skuUnitPrice.value,
  unitPriceWithMaterial: skuUnitPriceWithMaterial.value,
  unitPriceWithoutMaterial: skuUnitPriceWithoutMaterial.value,
}))
const hourlyRatePending = computed(() => {
  if (!hourlyQuoteReview.value || Number(skuStatus.value) !== 1) return false
  const enabled = skuRows.value.filter((row) => Number(row?.enabled) === 1)
  if (!enabled.length) return true
  return enabled.some((row) => normalizeLineReviewStatus(row?.reviewStatus) == null)
})
const showHourlyReview = computed(() => hourlyRatePending.value)
const showLineReview = computed(() => !hourlyQuoteReview.value && Number(skuStatus.value) === 1 && pendingReviewLines.value.length > 0)
const isPendingReviewAttach = (item: any) => item?.offered === true && normalizeLineReviewStatus(item?.reviewStatus) == null
const isAttachSelectable = (item: any) => Number(skuStatus.value) === 1 && isPendingReviewAttach(item)
const pendingReviewAttaches = computed(() => skuAttaches.value.filter(isAttachSelectable))
const showAttachReview = computed(() => pendingReviewAttaches.value.length > 0)
const showQuoteFoot = computed(() => showLineReview.value || showAttachReview.value)
const selectedReviewCount = computed(() => selectedReviewLines.value.length + selectedReviewAttaches.value.length)
const rejectDialogCount = computed(() => lineRejectTargets.value.length + lineRejectAttachTargets.value.length)
const isAttachSelected = (item: any) => selectedReviewAttaches.value.some((row) => Number(row?.attachValueId) === Number(item?.attachValueId))
const toggleReviewAttach = (item: any, checked: boolean) => {
  const id = Number(item?.attachValueId)
  const rest = selectedReviewAttaches.value.filter((row) => Number(row?.attachValueId) !== id)
  selectedReviewAttaches.value = checked ? [...rest, item] : rest
}
const onAttachCheck = (item: any, event: Event) => {
  toggleReviewAttach(item, Boolean((event.target as HTMLInputElement | null)?.checked))
}
const attachEffectLabel = (item: any) => lineEffectLabel({
  approvedPrice: item?.approvedPrice,
  quotePrice: item?.quotePrice,
  reviewStatus: item?.reviewStatus,
})
const canRejectWholeQuote = computed(() => Number(skuStatus.value) === 1)
const isLineSelectable = (row: any) => Number(skuStatus.value) === 1 && isPendingReviewLine(row)

const onReviewSelectionChange = (rows: any[]) => {
  selectedReviewLines.value = rows.filter(isLineSelectable)
}

const refreshCurrentQuote = async () => {
  const spuId = Number(skuTarget.value?.spuId)
  const packageId = Number(skuTarget.value?.packageId || route.query.package) || 0
  await loadReview(detailId.value)
  await loadSuppliers()
  const current = packageId
    ? packageServiceRows.value.find((item) => item.packageId === packageId && item.spuId === spuId) || { ...skuTarget.value, spuId, packageId }
    : services.value.find((item) => Number(item.spuId) === spuId) || skuTarget.value
  await openSkus(current)
}

const quoteDecisionName = (row?: any) => {
  const named = row ? serviceName(row) : ''
  if (named && named !== '—') return named
  const current = skuDialogTitle.value
  return current && current !== '—' ? current : t('admin.platformSuppliers.thisService')
}

const confirmQuoteDecision = async (action: 'approve' | 'reject', name: string, count?: number) => {
  const whole = count == null
  const messageKey = action === 'approve'
    ? (whole ? 'admin.platformSuppliers.approveQuoteConfirm' : 'admin.platformSuppliers.approveQuoteLinesConfirm')
    : (whole ? 'admin.platformSuppliers.rejectQuoteConfirm' : 'admin.platformSuppliers.rejectQuoteLinesConfirm')
  return confirmReview(
    t(messageKey, { name, count }),
    t(action === 'approve' ? 'admin.platformSuppliers.approveQuoteTitle' : 'admin.platformSuppliers.rejectQuote'),
    t(action === 'approve' ? 'admin.platformSuppliers.approveQuoteTitle' : 'admin.platformSuppliers.confirmReject'),
  )
}

const reviewSelectedLines = async (status: 2 | 3, rows: any[], reason?: string, attachRows: any[] = []) => {
  if (!detailId.value || !skuTarget.value?.spuId || saving.value) return
  const lines = rows
    .filter(isLineSelectable)
    .map((row) => ({
      skuId: row.skuId,
      status,
      rejectReason: status === 3 ? reason : undefined,
    }))
  const attaches = (attachRows || [])
    .filter(isAttachSelectable)
    .map((item) => ({
      attachValueId: item.attachValueId,
      status,
      rejectReason: status === 3 ? reason : undefined,
    }))
  if (!lines.length && !attaches.length) {
    ElMessage.warning(t('admin.platformSuppliers.selectReviewLines'))
    return
  }
  if (!await confirmQuoteDecision(status === 2 ? 'approve' : 'reject', quoteDecisionName(), lines.length + attaches.length)) return
  saving.value = true
  try {
    await platformSupplierQuoteReview({
      supplierId: detailId.value,
      spuId: skuTarget.value.spuId,
      versionNo: skuVersionNo.value,
      ...(lines.length ? { lines } : {}),
      ...(attaches.length ? { attaches } : {}),
    })
    ElMessage.success(t(status === 2 ? 'admin.platformSuppliers.selectedApproved' : 'admin.platformSuppliers.selectedRejected'))
    lineRejectOpen.value = false
    lineRejectReason.value = ''
    lineRejectTargets.value = []
    lineRejectAttachTargets.value = []
    selectedReviewLines.value = []
    selectedReviewAttaches.value = []
    await refreshCurrentQuote()
  } catch (error: any) {
    ElMessage.error(error?.message || t(status === 2 ? 'admin.platformSuppliers.approveQuoteFailed' : 'admin.platformSuppliers.rejectFailed'))
  } finally {
    saving.value = false
  }
}

const approveSelectedLines = () => reviewSelectedLines(2, selectedReviewLines.value, undefined, selectedReviewAttaches.value)

const approveLine = (row: any) => reviewSelectedLines(2, [row])

const approveAttach = (item: any) => reviewSelectedLines(2, [], undefined, [item])

const reviewHourlyQuote = async (status: 2 | 3, reason?: string) => {
  if (!detailId.value || !skuTarget.value?.spuId || saving.value || !hourlyQuoteReview.value) return
  if (!await confirmQuoteDecision(status === 2 ? 'approve' : 'reject', quoteDecisionName())) return
  saving.value = true
  try {
    const packageId = Number(skuTarget.value?.packageId || route.query.package) || 0
    const pendingRateLines = (status === 2 || packageId)
      ? skuRows.value
        .filter((row) => Number(row?.enabled) === 1 && normalizeLineReviewStatus(row?.reviewStatus) == null)
        .map((row) => ({
          skuId: row.skuId,
          status,
          rejectReason: status === 3 ? reason : undefined,
        }))
      : []
    if (packageId && !pendingRateLines.length) {
      ElMessage.warning(t('admin.platformSuppliers.selectReviewLines'))
      return
    }
    await platformSupplierQuoteReview(pendingRateLines.length
      ? {
        supplierId: detailId.value,
        spuId: skuTarget.value.spuId,
        versionNo: skuVersionNo.value,
        lines: pendingRateLines,
      }
      : {
        supplierId: detailId.value,
        spuId: skuTarget.value.spuId,
        versionNo: skuVersionNo.value,
        status,
        rejectReason: status === 3 ? reason : undefined,
      })
    ElMessage.success(t(status === 2 ? 'admin.platformSuppliers.selectedApproved' : 'admin.platformSuppliers.selectedRejected'))
    lineRejectOpen.value = false
    lineRejectReason.value = ''
    hourlyRejecting.value = false
    await refreshCurrentQuote()
  } catch (error: any) {
    ElMessage.error(error?.message || t(status === 2 ? 'admin.platformSuppliers.approveQuoteFailed' : 'admin.platformSuppliers.rejectFailed'))
  } finally {
    saving.value = false
  }
}

const openHourlyReject = () => {
  if (!showHourlyReview.value || saving.value) return
  rejectingWholeQuote.value = false
  pendingQuoteRow.value = null
  hourlyRejecting.value = true
  lineRejectTargets.value = []
  lineRejectAttachTargets.value = []
  lineRejectReason.value = ''
  lineRejectOpen.value = true
}

const resetQuoteReject = () => {
  hourlyRejecting.value = false
  rejectingWholeQuote.value = false
  pendingQuoteRow.value = null
}

const quoteLinesToReject = (quote: any, reason: string) =>
  (Array.isArray(quote?.skus) ? quote.skus : [])
    .filter((sku: any) => (sku?.quoted === true || Number(sku?.quoted) === 1)
      && Number(sku?.enabled ?? 1) === 1
      && normalizeLineReviewStatus(sku?.reviewStatus) == null)
    .map((sku: any) => ({
      skuId: sku.skuId,
      status: 3 as const,
      rejectReason: reason,
    }))

const quoteAttachesToReject = (quote: any, reason: string) =>
  (Array.isArray(quote?.attaches) ? quote.attaches : [])
    .filter((item: any) => item?.canServe === true && normalizeLineReviewStatus(item?.reviewStatus) == null)
    .map((item: any) => ({
      attachValueId: item.attachValueId,
      status: 3 as const,
      rejectReason: reason,
    }))

const finishQuoteReject = async (spuId: number) => {
  ElMessage.success(t('admin.platformSuppliers.selectedRejected'))
  lineRejectOpen.value = false
  lineRejectReason.value = ''
  lineRejectTargets.value = []
  lineRejectAttachTargets.value = []
  selectedReviewLines.value = []
  selectedReviewAttaches.value = []
  resetQuoteReject()
  if (screen.value === 'quote' && Number(skuTarget.value?.spuId) === spuId) await refreshCurrentQuote()
  else if (detailId.value) await loadReview(detailId.value)
}

const rejectWholeQuote = async (row: any, reason: string) => {
  const supplierId = detailId.value
  const spuId = Number(row?.spuId || skuTarget.value?.spuId)
  if (!supplierId || !spuId || saving.value) return
  if (!await confirmQuoteDecision('reject', quoteDecisionName(row))) return
  const useLoaded = screen.value === 'quote' && Number(skuTarget.value?.spuId) === spuId
  const packageId = Number(row?.packageId || skuTarget.value?.packageId || route.query.package) || 0
  saving.value = true
  try {
    let versionNo = useLoaded ? skuVersionNo.value : undefined
    let hourly = useLoaded && hourlyQuoteReview.value
    let lines: Array<{ skuId: unknown; status: 3; rejectReason: string }> = []
    let attaches: Array<{ attachValueId: unknown; status: 3; rejectReason: string }> = []
    if (!useLoaded) {
      const quote = unwrap(await platformSupplierQuoteSkus(supplierId, spuId)) || {}
      versionNo = quote.versionNo == null ? undefined : Number(quote.versionNo)
      hourly = quoteUsesHourlyReview(quote)
      if (!hourly || packageId) {
        lines = quoteLinesToReject(quote, reason)
        attaches = quoteAttachesToReject(quote, reason)
      }
    } else if (!hourly || packageId) {
      lines = pendingReviewLines.value.map((item) => ({
        skuId: item.skuId,
        status: 3 as const,
        rejectReason: reason,
      }))
      attaches = pendingReviewAttaches.value.map((item) => ({
        attachValueId: item.attachValueId,
        status: 3 as const,
        rejectReason: reason,
      }))
    }
    if (packageId) {
      const allowedSkus = packageSkuIdSet(packageId, spuId)
      const allowedAttaches = packageAttachIdSet(packageId, spuId)
      if (allowedSkus.size) lines = lines.filter((line) => allowedSkus.has(Number(line.skuId)))
      attaches = allowedAttaches.size ? attaches.filter((item) => allowedAttaches.has(Number(item.attachValueId))) : []
      if (!lines.length && !attaches.length) {
        ElMessage.warning(t('admin.platformSuppliers.selectReviewLines'))
        return
      }
    }
    if (!packageId && (hourly || (!lines.length && !attaches.length))) {
      await platformSupplierQuoteReview({
        supplierId,
        spuId,
        versionNo,
        status: 3,
        rejectReason: reason,
      })
    } else {
      await platformSupplierQuoteReview({
        supplierId,
        spuId,
        versionNo,
        ...(lines.length ? { lines } : {}),
        ...(attaches.length ? { attaches } : {}),
      })
    }
    await finishQuoteReject(spuId)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.rejectFailed'))
  } finally {
    saving.value = false
  }
}

const openWholeQuoteReject = (row?: any) => {
  if (saving.value) return
  const spuId = Number(row?.spuId || 0)
  const useLoaded = screen.value === 'quote' && (!spuId || spuId === Number(skuTarget.value?.spuId))
  pendingQuoteRow.value = useLoaded ? null : (row || null)
  rejectingWholeQuote.value = true
  hourlyRejecting.value = Boolean(useLoaded && showHourlyReview.value)
  lineRejectTargets.value = useLoaded && !hourlyRejecting.value ? pendingReviewLines.value.slice() : []
  lineRejectAttachTargets.value = useLoaded && !hourlyRejecting.value ? pendingReviewAttaches.value.slice() : []
  lineRejectReason.value = ''
  lineRejectOpen.value = true
}

const reviewPriceChange = async (row: any, status: 2 | 3, reason?: string) => {
  const supplierId = detailId.value
  const spuId = Number(row?.spuId)
  if (!supplierId || !spuId || saving.value) return
  const serviceLabel = serviceName(row)
  const confirmed = await confirmReview(
    t(status === 2 ? 'admin.platformSuppliers.approvePriceChangeConfirm' : 'admin.platformSuppliers.rejectPriceChangeConfirm', {
      name: serviceLabel === '—' ? t('admin.platformSuppliers.thisService') : serviceLabel,
    }),
    t(status === 2 ? 'admin.platformSuppliers.approvePriceChange' : 'admin.platformSuppliers.rejectPriceChange'),
    t(status === 2 ? 'admin.platformSuppliers.approvePriceChange' : 'admin.platformSuppliers.confirmReject'),
  )
  if (!confirmed) return
  saving.value = true
  try {
    await reviewQuotePriceChange({
      supplierId,
      spuId,
      status,
      rejectReason: status === 3 ? reason : undefined,
    })
    ElMessage.success(status === 2 ? t('admin.platformSuppliers.priceChangeApproved') : t('admin.platformSuppliers.priceChangeRejected'))
    priceChangeRejectOpen.value = false
    priceChangeRejectReason.value = ''
    priceChangeTarget.value = null
    await loadReview(supplierId)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.rejectFailed'))
  } finally {
    saving.value = false
  }
}

const approvePriceChange = (row: any) => reviewPriceChange(row, 2)

const openPriceChangeReject = (row: any) => {
  priceChangeTarget.value = row
  priceChangeRejectReason.value = ''
  priceChangeRejectOpen.value = true
}

const submitPriceChangeReject = () => {
  const reason = priceChangeRejectReason.value.trim()
  if (!reason) {
    ElMessage.warning(t('admin.platformSuppliers.reasonRequired'))
    return
  }
  return reviewPriceChange(priceChangeTarget.value, 3, reason)
}

const openLineReject = (rows?: any[] | null, attaches?: any[] | null) => {
  rejectingWholeQuote.value = false
  pendingQuoteRow.value = null
  hourlyRejecting.value = false
  const lineSource = rows === undefined ? selectedReviewLines.value : (rows || [])
  const attachSource = attaches === undefined
    ? (rows === undefined ? selectedReviewAttaches.value : [])
    : (attaches || [])
  const targets = lineSource.filter(isLineSelectable)
  const attachTargets = attachSource.filter(isAttachSelectable)
  if (!targets.length && !attachTargets.length) {
    ElMessage.warning(t('admin.platformSuppliers.selectReviewLines'))
    return
  }
  lineRejectTargets.value = targets
  lineRejectAttachTargets.value = attachTargets
  lineRejectReason.value = ''
  lineRejectOpen.value = true
}

const rejectSelectedLines = () => {
  const reason = lineRejectReason.value.trim()
  if (!reason) {
    ElMessage.warning(t('admin.platformSuppliers.reasonRequired'))
    return
  }
  if (hourlyRejecting.value) return reviewHourlyQuote(3, reason)
  if (rejectingWholeQuote.value) return rejectWholeQuote(pendingQuoteRow.value, reason)
  return reviewSelectedLines(3, lineRejectTargets.value, reason, lineRejectAttachTargets.value)
}

const openReject = (_mode: 'onboarding', row?: any) => {
  rejectTarget.value = row || null
  rejectReason.value = ''
  rejectOpen.value = true
}

const submitReject = async () => {
  const reason = rejectReason.value.trim()
  if (!reason) {
    ElMessage.warning(t('admin.platformSuppliers.reasonRequired'))
    return
  }
  const supplierId = Number(rejectTarget.value?.id || detailId.value)
  if (!supplierId) return
  const confirmed = await confirmReview(
    t('admin.platformSuppliers.rejectOnboardingConfirm', { name: supplierDecisionName(rejectTarget.value) }),
    t('admin.platformSuppliers.rejectOnboarding'),
    t('admin.platformSuppliers.confirmReject'),
  )
  if (!confirmed) return
  saving.value = true
  try {
    await onboardingChangeStatus({ id: supplierId, status: 3, rejectReason: reason })
    ElMessage.success(t('admin.platformSuppliers.onboardingRejected'))
    rejectOpen.value = false
    if (detailId.value) await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.rejectFailed'))
  } finally {
    saving.value = false
  }
}

const sheetMoney = (value: unknown) => {
  const text = moneyText(value)
  return text === '—' ? '' : text
}
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
const downloadCsv = (fileName: string, rows: string[][]) => {
  const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
const priceFileName = () => {
  const name = String(profile.companyName || current.value?.supplierName || 'supplier').trim()
  const safe = name.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'supplier'
  const no = String(current.value?.supplierNo || profile.supplierNo || '').trim()
  return `${safe}${no ? `-${no}` : ''}-price-list.csv`
}
const billingLabel = (mode: unknown) => {
  const value = Number(mode)
  if (value === 3) return t('admin.platformSuppliers.personHour')
  if (value === 2) return t('admin.platformSuppliers.unitPrice')
  if (value === 1) return t('admin.platformSuppliers.fixedPrice')
  return ''
}
const sheetMargin = (row: { platformPriceWithTax?: unknown; quotePrice?: unknown }) => {
  const text = marginText(row)
  return text === '—' ? '' : text
}
const specSheetText = (specs: Record<string, unknown>, columns: { key: string }[]) => columns
  .map((column) => specCell(specs[column.key]))
  .filter((text) => text && text !== '—')
  .join(' · ')

const loadServicePriceRows = async (row: any) => {
  const quote = unwrap(await platformSupplierQuoteSkus(detailId.value as number, row.spuId)) || {}
  const quoteSkus = Array.isArray(quote.skus) ? quote.skus : []
  let columns: { key: string; nameI18n: Record<string, unknown> | null; fallback: string }[] = []
  let specSkus: any[] = []
  let catalogAttaches: any[] = []
  try {
    const detail = unwrap(await listBySpu(row.spuId)) || {}
    const specTypes = Array.isArray(detail.specTypes) ? detail.specTypes : []
    columns = specTypes.map((spec: any) => ({
      key: String(spec.specKey ?? spec.specTypeId),
      nameI18n: spec.nameI18n && typeof spec.nameI18n === 'object' ? spec.nameI18n : null,
      fallback: spec.specTypeName || '',
    }))
    specSkus = Array.isArray(detail.skus) ? detail.skus : []
    catalogAttaches = Array.isArray(detail.attaches) ? detail.attaches : []
  } catch {
    columns = []
    specSkus = []
  }
  if (!catalogAttaches.length) {
    try {
      catalogAttaches = await listSpuAttachCatalog(row.spuId, catalogAttaches)
    } catch {
      catalogAttaches = []
    }
  }
  const catalogBySku = new Map(specSkus.map((sku: any) => [Number(sku.skuId), sku]))
  const lines = quoteSkus
    .filter((sku: any) => (sku?.quoted === true || Number(sku?.quoted) === 1) && sku?.available !== false)
    .map((saved: any) => {
      const catalogSku = catalogBySku.get(Number(saved.skuId)) || {}
      const enabled = saved.enabled == null || saved.enabled === '' ? 1 : Number(saved.enabled)
      return {
        enabled,
        skuCode: String(saved.skuCode || catalogSku.skuCode || '').trim(),
        specs: Object.fromEntries(columns.map((column) => [
          column.key,
          saved[column.key] ?? saved.specs?.[column.key] ?? catalogSku[column.key],
        ])),
        platformPriceWithTax: saved.platformPriceWithTax ?? null,
        platformPrice: saved.platformPrice ?? catalogSku.price ?? null,
        platformOriginalPrice: saved.platformOriginalPrice ?? catalogSku.originalPrice ?? null,
        approvedPrice: saved.approvedPrice ?? null,
        staffCount: saved.staffCount ?? null,
        serviceHours: saved.serviceHours ?? null,
        quotePrice: saved.quotePrice ?? null,
        reviewStatus: normalizeLineReviewStatus(saved.reviewStatus),
        specDetails: [catalogSku.specs, saved.specs],
      }
    })
    .filter((line) => line.enabled === 1)
  const savedAttaches = new Map((Array.isArray(quote.attaches) ? quote.attaches : []).map((item: any) => [Number(item.attachValueId), item]))
  const attachSource = mergeAttachSource(catalogAttaches, quote.attaches)
  const addons = attachSource.map((item: any) => {
    const saved = savedAttaches.get(Number(item.attachValueId)) || {}
    return {
      offered: saved.canServe === true,
      name: attachName({
        nameI18n: (saved.attachValueNameI18n || item.attachValueNameI18n) && typeof (saved.attachValueNameI18n || item.attachValueNameI18n) === 'object'
          ? (saved.attachValueNameI18n || item.attachValueNameI18n)
          : null,
        name: String(saved.attachValueName || item.attachValueName || ''),
      }),
      quotePrice: saved.quotePrice ?? null,
      approvedPrice: saved.approvedPrice ?? null,
      platformPriceWithTax: saved.platformPriceWithTax ?? item.platformPriceWithTax ?? null,
      profitRate: saved.profitRate ?? item.profitRate ?? null,
    }
  }).filter((item) => item.offered)
  const service = serviceName(row)
  const category = serviceCategory(row)
  const status = quoteStatusLabel(quote.status ?? row.status, quote.statusI18n || row.statusI18n)
  const mode = displayedQuoteMode(quote)
  const billing = billingLabel(mode)
  const staffHour = mode === 3
  const hourly = quoteUsesHourlyReview(quote)
  const sheetRows = hourly
    ? (staffHour
      ? [{ label: 'hourlyRateLabel', price: quote.unitPrice }]
      : [
          { label: 'hourlyRateWithMaterial', price: quote.unitPriceWithMaterial },
          { label: 'hourlyRateWithoutMaterial', price: quote.unitPriceWithoutMaterial },
        ]).map((rate) => [
        service,
        category,
        status,
        billing,
        t(`admin.platformSuppliers.${rate.label}`),
        '',
        t('admin.platformSuppliers.perPersonHour'),
        '',
        hourlyRateText(rate.price),
        '',
        '',
        '',
      ])
    : lines.map((line) => [
        service,
        category,
        status,
        billing,
        t('admin.platformSuppliers.exportSpecItem'),
        line.skuCode,
        specSheetText(line.specs, columns),
        sheetMoney(clientPrice(line)),
        sheetMoney(line.quotePrice),
        sheetMargin(line),
        sheetMoney(line.approvedPrice),
        sheetLineStatus(line, quote.status, quote.priceChangeStatus),
      ])
  if (hourly) {
    lines.forEach((line) => {
      const input = {
        quoteMode: mode,
        unitPrice: quote.unitPrice,
        unitPriceWithMaterial: quote.unitPriceWithMaterial,
        unitPriceWithoutMaterial: quote.unitPriceWithoutMaterial,
        quotePrice: line.quotePrice,
        staffCount: line.staffCount,
        serviceHours: line.serviceHours,
        platformPriceWithTax: line.platformPriceWithTax,
        platformPrice: line.platformPrice,
        platformOriginalPrice: line.platformOriginalPrice,
        sources: [line.specs, line.specDetails],
      }
      const percent = hourlyMarginPercent(input)
      sheetRows.push([
        service,
        category,
        status,
        billing,
        t('admin.platformSuppliers.exportSpecItem'),
        line.skuCode,
        specSheetText(line.specs, columns),
        sheetMoney(line.platformPriceWithTax),
        sheetMoney(hourlySupplierCost(input)),
        percent == null ? '' : `${percent}%`,
        sheetMoney(line.approvedPrice),
        sheetLineStatus(line, quote.status, quote.priceChangeStatus),
      ])
    })
  }
  addons.forEach((item) => {
    sheetRows.push([
      service,
      category,
      status,
      billing,
      t('admin.platformSuppliers.exportAddonItem'),
      '',
      item.name,
      sheetMoney(item.platformPriceWithTax),
      sheetMoney(item.quotePrice),
      item.profitRate == null || item.profitRate === '' ? '' : profitRateText(item.profitRate),
      sheetMoney(item.approvedPrice),
      '',
    ])
  })
  if (!sheetRows.length) {
    sheetRows.push([service, category, status, billing, '', '', '', '', '', '', '', ''])
  }
  return sheetRows
}

const exportPriceList = async () => {
  if (!detailId.value || !services.value.length || exportingPrices.value) return
  exportingPrices.value = true
  try {
    const groups = []
    const pending = services.value.slice()
    while (pending.length) {
      const chunk = pending.splice(0, 4)
      groups.push(...await Promise.all(chunk.map((row) => loadServicePriceRows(row))))
    }
    const company = String(profile.companyName || current.value?.supplierName || '').trim()
    const supplierNo = String(current.value?.supplierNo || profile.supplierNo || '').trim()
    const rows = [
      [t('admin.platformSuppliers.exportPrices'), company, supplierNo],
      [],
      [
        t('admin.platformSuppliers.service'),
        t('admin.platformSuppliers.category'),
        t('admin.platformSuppliers.quoteStatus'),
        t('admin.platformSuppliers.billing'),
        t('admin.platformSuppliers.exportItem'),
        t('admin.platformSuppliers.exportSku'),
        t('admin.platformSuppliers.exportSpec'),
        t('admin.platformSuppliers.clientPrice'),
        t('admin.platformSuppliers.taxQuote'),
        t('admin.platformSuppliers.margin'),
        t('admin.platformSuppliers.effectivePrice'),
        t('admin.platformSuppliers.lineReviewStatus'),
      ],
      ...groups.flat(),
    ]
    downloadCsv(priceFileName(), rows)
    ElMessage.success(t('admin.platformSuppliers.exportPricesDone'))
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.exportPricesFailed'))
  } finally {
    exportingPrices.value = false
  }
}

const quoteSheetName = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const supplierNo = String(current.value?.supplierNo || profile.supplierNo || detailId.value || '').trim()
  return `supplier-quote_${supplierNo}_${stamp}.xlsx`
}

const downloadQuoteSheet = async () => {
  if (!detailId.value || quoteExporting.value) return
  quoteExporting.value = true
  try {
    const data = await exportPlatformQuoteSheet(detailId.value, selectedQuoteSpuIds.value)
    const blob = data instanceof Blob ? data : new Blob([data as BlobPart])
    if (blob.type.includes('json') || blob.type.startsWith('text/')) {
      const text = await blob.text()
      let message = text
      try {
        const parsed = JSON.parse(text)
        message = String(parsed?.message || parsed?.msg || text)
      } catch {
        message = text
      }
      throw new Error(message)
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = quoteSheetName()
    link.click()
    URL.revokeObjectURL(url)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.exportQuoteFailed'))
  } finally {
    quoteExporting.value = false
  }
}

const importQuoteFile = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file || !detailId.value || quoteImporting.value) return
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    ElMessage.warning(t('admin.platformSuppliers.quoteFileType'))
    return
  }
  quoteImporting.value = true
  try {
    const result = unwrap(await importPlatformQuoteSheet(detailId.value, file)) as {
      serviceCount?: number
      skuCount?: number
      skippedCount?: number
      messages?: string[]
    }
    if (screen.value === 'quote') await refreshCurrentQuote()
    else await loadReview(detailId.value)
    const summary = t('admin.platformSuppliers.importDone', {
      services: result?.serviceCount ?? 0,
      skus: result?.skuCount ?? 0,
      skipped: result?.skippedCount ?? 0,
    })
    const notes = Array.isArray(result?.messages)
      ? result.messages.map((item) => String(item || '').trim()).filter(Boolean)
      : []
    if (notes.length) {
      await ElMessageBox.alert(
        [summary, ...notes].join('\n'),
        t('admin.platformSuppliers.importResult'),
        { customClass: 'supplier-review-confirm', confirmButtonText: t('admin.platformSuppliers.importClose') },
      )
    } else {
      ElMessage.success(summary)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.importFailed'))
  } finally {
    quoteImporting.value = false
  }
}

const openSkus = async (row: any) => {
  if (!detailId.value) return
  const packageId = Number(row?.packageId || route.query.package) || 0
  skuTarget.value = packageId ? { ...row, packageId } : row
  skuTitle.value = serviceName(row) || t('admin.platformSuppliers.serviceFallback')
  skuStatus.value = row.status
  skuVersionNo.value = undefined
  skuStatusI18n.value = row.statusI18n || null
  skuRejectReason.value = row.rejectReason || ''
  skuQuoteMode.value = null
  skuReviewByUnitPrice.value = false
  skuUnitPrice.value = null
  skuUnitPriceWithMaterial.value = null
  skuUnitPriceWithoutMaterial.value = null
  skuColumns.value = []
  skuGroupLabel.value = ''
  skuRows.value = []
  hourlyCompareSources.value = []
  skuAttaches.value = []
  selectedReviewLines.value = []
  selectedReviewAttaches.value = []
  lineRejectTargets.value = []
  lineRejectAttachTargets.value = []
  lineRejectOpen.value = false
  skuLoading.value = true
  lineRejectReason.value = ''
  try {
    const quote = unwrap(await platformSupplierQuoteSkus(detailId.value, row.spuId)) || {}
    skuStatus.value = quote.status ?? row.status
    skuVersionNo.value = quote.versionNo == null ? undefined : Number(quote.versionNo)
    skuStatusI18n.value = quote.statusI18n || row.statusI18n || null
    skuRejectReason.value = quote.rejectReason || row.rejectReason || ''
    skuQuoteMode.value = displayedQuoteMode(quote)
    skuReviewByUnitPrice.value = quote.reviewByUnitPrice === true
    skuUnitPrice.value = quote.unitPrice ?? null
    skuUnitPriceWithMaterial.value = quote.unitPriceWithMaterial ?? null
    skuUnitPriceWithoutMaterial.value = quote.unitPriceWithoutMaterial ?? null
    let quoteSkus = Array.isArray(quote.skus) ? quote.skus : []
    const scopedPackageId = Number(skuTarget.value?.packageId) || 0
    if (scopedPackageId) {
      const allowed = packageSkuIdSet(scopedPackageId, Number(row.spuId))
      quoteSkus = allowed.size ? quoteSkus.filter((sku: any) => allowed.has(Number(sku.skuId))) : []
    }
    let columns: { key: string; nameI18n: Record<string, unknown> | null; fallback: string }[] = []
    let specSkus: any[] = []
    let catalogAttaches: any[] = []
    try {
      const detail = unwrap(await listBySpu(row.spuId)) || {}
      const specTypes = Array.isArray(detail.specTypes) ? detail.specTypes : []
      columns = specTypes.map((spec: any) => ({
        key: String(spec.specKey ?? spec.specTypeId),
        nameI18n: spec.nameI18n && typeof spec.nameI18n === 'object' ? spec.nameI18n : null,
        fallback: spec.specTypeName || '',
      }))
      specSkus = Array.isArray(detail.skus) ? detail.skus : []
      catalogAttaches = Array.isArray(detail.attaches) ? detail.attaches : []
    } catch {
      columns = []
      specSkus = []
    }
    const catalogInputs = catalogHourlyInputs(specSkus)
    const quotedInputs = quoteHourlyInputs(quoteSkus)
    hourlyCompareSources.value = hourlySourceUseful(catalogInputs) ? catalogInputs : quotedInputs
    const catalogBySku = new Map(specSkus.map((sku: any) => [Number(sku.skuId), sku]))
    const groups = Array.isArray(quote.skuGroups) ? quote.skuGroups : []
    const groupBySku = new Map<number, any>()
    groups.forEach((group: any, index: number) => {
      for (const sku of group?.skus || []) {
        groupBySku.set(Number(sku?.skuId), { group, index })
      }
    })
    const firstGroup = groups.find((group: any) => group?.specTypeName || group?.specTypeNameI18n)
    const groupType = firstGroup ? specText(firstGroup.specTypeNameI18n) : '—'
    skuGroupLabel.value = groupType !== '—' ? groupType : String(firstGroup?.specTypeName || '')
    const groupKey = firstGroup ? String(firstGroup.specKey ?? firstGroup.specTypeId ?? '') : ''
    if (groupKey) columns = columns.filter((column) => column.key !== groupKey)
    skuColumns.value = columns
    const specEntries = (specs: unknown) => {
      if (!Array.isArray(specs)) return {}
      return Object.fromEntries(
        specs
          .map((spec: any) => [String(spec?.specKey ?? spec?.specTypeId ?? ''), spec?.specValueNameI18n || spec?.specValueName])
          .filter(([key]) => key),
      )
    }
    skuRows.value = quoteSkus.filter((sku: any) => sku?.quoted === true || Number(sku?.quoted) === 1).map((saved: any) => {
      const catalogSku = catalogBySku.get(Number(saved.skuId)) || {}
      const grouped = groupBySku.get(Number(saved.skuId))
      const groupValue = grouped ? specText(grouped.group.specValueNameI18n) : '—'
      return {
        skuId: saved.skuId,
        skuCode: saved.skuCode || catalogSku.skuCode || `#${saved.skuId}`,
        groupOrder: grouped?.index ?? 999,
        groupValue: groupValue !== '—' ? groupValue : String(grouped?.group?.specValueName || ''),
        specs: {
          ...Object.fromEntries(columns.map((column) => [
            column.key,
            saved[column.key] ?? catalogSku[column.key],
          ])),
          ...specEntries(catalogSku.specs),
          ...specEntries(saved.specs),
        },
        platformPrice: saved.platformPrice ?? catalogSku.price,
        platformPriceWithTax: saved.platformPriceWithTax ?? null,
        platformOriginalPrice: saved.platformOriginalPrice ?? catalogSku.originalPrice,
        approvedPrice: saved.approvedPrice ?? null,
        available: saved.available != null ? saved.available !== false : Number(catalogSku.status ?? 1) === 1,
        quoted: true,
        enabled: saved.enabled == null || saved.enabled === '' ? 1 : Number(saved.enabled),
        reviewStatus: normalizeLineReviewStatus(saved.reviewStatus),
        staffCount: saved.staffCount ?? null,
        serviceHours: saved.serviceHours ?? null,
        quotePrice: saved.quotePrice ?? null,
        rejectReason: saved.rejectReason || '',
        specDetails: [catalogSku.specs, saved.specs],
      }
    }).sort((left: any, right: any) => left.groupOrder - right.groupOrder)
    if (!catalogAttaches.length) {
      try {
        catalogAttaches = await listSpuAttachCatalog(row.spuId, catalogAttaches)
      } catch {
        catalogAttaches = []
      }
    }
    const savedAttaches = new Map((Array.isArray(quote.attaches) ? quote.attaches : []).map((item: any) => [Number(item.attachValueId), item]))
    const attachSource = mergeAttachSource(catalogAttaches, quote.attaches)
    skuAttaches.value = attachSource.map((item: any) => {
      const saved = savedAttaches.get(Number(item.attachValueId)) || {}
      return {
        attachValueId: Number(item.attachValueId),
        typeName: String(saved.attachTypeName || item.attachTypeName || ''),
        typeNameI18n: (saved.attachTypeNameI18n || item.attachTypeNameI18n) && typeof (saved.attachTypeNameI18n || item.attachTypeNameI18n) === 'object'
          ? (saved.attachTypeNameI18n || item.attachTypeNameI18n)
          : null,
        name: String(saved.attachValueName || item.attachValueName || ''),
        nameI18n: (saved.attachValueNameI18n || item.attachValueNameI18n) && typeof (saved.attachValueNameI18n || item.attachValueNameI18n) === 'object'
          ? (saved.attachValueNameI18n || item.attachValueNameI18n)
          : null,
        unit: String(saved.unit || item.unit || ''),
        unitI18n: (saved.unitI18n || item.unitI18n) && typeof (saved.unitI18n || item.unitI18n) === 'object'
          ? (saved.unitI18n || item.unitI18n)
          : null,
        platformPrice: saved.platformPrice ?? item.platformPrice ?? null,
        platformPriceWithTax: saved.platformPriceWithTax ?? item.platformPriceWithTax ?? null,
        profitRate: saved.profitRate ?? item.profitRate ?? null,
        approvedProfitRate: saved.approvedProfitRate ?? item.approvedProfitRate ?? null,
        approvedPrice: saved.approvedPrice ?? null,
        offered: saved.canServe === true,
        quotePrice: saved.quotePrice ?? null,
        reviewStatus: normalizeLineReviewStatus(saved.reviewStatus),
        rejectReason: saved.rejectReason || '',
      }
    })
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.quoteLoadFailed'))
    skuOpen.value = false
  } finally {
    skuLoading.value = false
  }
}

watch(() => route.fullPath, () => {
  if (quoteDesk.value) return
  const view = String(route.query.view || '')
  const tab = String(route.query.tab || '')
  if (view !== 'quote' && tab !== 'quotes' && tab !== 'packages') return
  const scope = tab === 'packages' || Number(route.query.package) > 0 ? 'packages' : 'services'
  const query: Record<string, unknown> = { ...route.query, scope }
  delete query.tab
  router.replace({ path: QUOTE_DESK_PATH, query })
}, { immediate: true })

watch(detailId, (id) => {
  quoteHistoryOpen.value = false
  selectedQuoteSpuIds.value = []
  if (id) void loadReview(id)
}, { immediate: true })

watch(() => [detailId.value, String(route.query.view || ''), String(route.query.spu || ''), String(route.query.package || '')] as const, async ([id, view, spuText, packageText]) => {
  if (view !== 'quote' || !id) {
    quoteRoutePending.value = false
    return
  }
  const spu = Number(spuText)
  const packageId = Number(packageText) || 0
  if (!spu) {
    quoteRoutePending.value = false
    return
  }
  const sameSupplier = Number(current.value?.id) === id
  const listed = packageId
    ? packageServiceRows.value.some((item) => item.packageId === packageId && item.spuId === spu)
    : services.value.some((item) => Number(item.spuId) === spu)
  const sameTarget = Number(skuTarget.value?.spuId) === spu && Number(skuTarget.value?.packageId || 0) === packageId
  if (sameSupplier && listed && sameTarget) {
    quoteRoutePending.value = false
    return
  }
  const ticket = reviewTicket
  if (!sameSupplier || !listed) quoteRoutePending.value = true
  try {
    await reviewRequest
    if (ticket !== reviewTicket) return
    if (detailId.value !== id || String(route.query.view || '') !== 'quote' || Number(route.query.spu) !== spu || (Number(route.query.package) || 0) !== packageId) return
    const row = packageId
      ? packageServiceRows.value.find((item) => item.packageId === packageId && item.spuId === spu) || { spuId: spu, packageId }
      : services.value.find((item) => Number(item.spuId) === spu) || { spuId: spu }
    await openSkus(row)
  } finally {
    if (ticket === reviewTicket && detailId.value === id && String(route.query.view || '') === 'quote' && Number(route.query.spu) === spu && (Number(route.query.package) || 0) === packageId) {
      quoteRoutePending.value = false
    }
  }
}, { immediate: true })

watch(() => route.query.onboardingStatus, (value) => {
  if (value == null || value === '') return
  const next = readStatusQuery()
  if (next === '' || next === onboardingStatus.value) return
  onboardingStatus.value = next
  queueFocus.value = ''
  pageNum.value = 1
  if (!detailId.value) loadSuppliers()
})

onMounted(loadSuppliers)
</script>

<style scoped>
.supplier-review {
  --el-font-size-base: 12px;
  --el-font-size-small: 11px;
  --el-component-size: 26px;
  --el-component-size-small: 24px;
  padding: 16px;
  color: #1c2433;
  font-size: 13px;
  line-height: 1.4;
}
.supplier-review :deep(.el-select__wrapper) { min-height: 26px; padding: 3px 10px; font-size: 12px; line-height: 20px; }
.supplier-review :deep(.el-select__input) { height: 20px; font-size: 12px; }
.supplier-review__head h1 { margin: 0 0 5px; color: #05152b; font-family: Georgia, serif; font-size: 22px; font-weight: 500; }
.supplier-review__head p { margin: 0 0 13px; color: #6d7686; }
.review-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 11px; }
.review-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid #e4e9f0; border-radius: 999px; background: #fff; color: #05152b; font: inherit; font-size: 11px; cursor: pointer; }
.review-chip b { min-width: 1ch; font-size: 13px; font-variant-numeric: tabular-nums; }
.review-chip.tone-pending b { color: #9a6700; }
.review-chip.tone-bad b { color: #b42318; }
.review-chip.on { border-color: #05152b; background: #05152b; color: #fff; }
.review-chip.on b { color: #fff; }
.status-empty { color: #98a2b3; }
button.status-pill { border: 0; font: inherit; font-size: 11px; line-height: 1.4; cursor: pointer; }
button.status-pill:hover { box-shadow: inset 0 0 0 1px rgba(5, 21, 43, 0.2); }
.supplier-no { color: #05152b; }
.supplier-cell { color: #05152b; font-weight: 650; }
.type-pill { display: inline-flex; margin-left: 6px; padding: 1px 6px; border-radius: 999px; background: #eef2f7; color: #526070; font-size: 11px; font-weight: 650; vertical-align: 1px; }
.board :deep(small) { display: block; color: #6d7686; font-size: 11px; }
.pill { display: inline-flex; margin: 0 3px 3px 0; padding: 2px 6px; border-radius: 999px; background: #eef2f7; color: #05152b; font-size: 11px; }
.status-pill { display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 999px; background: #eef2f7; color: #526070; font-size: 11px; font-weight: 650; }
.status-pill.pending { background: #fff4df; color: #9a6700; }
.status-pill.ok { background: #e7f6ee; color: #1f7a4a; }
.status-pill.bad { background: #fdecec; color: #b42318; }
.muted-pill { background: #eef2f7; color: #6d7686; }
.row-actions, .hero-actions, .quote-foot, .line-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.row-updates { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; margin-bottom: 5px; }
.act, .open-link { border: 1px solid #d7dee8; border-radius: 6px; background: #fff; color: #05152b; font: inherit; font-size: 11px; cursor: pointer; }
.act { padding: 5px 8px; }
.price-change-note { display: block; margin-top: 3px; color: #9a6700; font-size: 11px; line-height: 1.4; }
.contact-lines { display: grid; gap: 2px; color: #243246; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
.act.ok { border-color: #1f7a4a; color: #1f7a4a; }
.act.no { border-color: #b42318; color: #b42318; }
.act.navy { border-color: #05152b; background: #05152b; color: #fff; }
.act:disabled { opacity: 0.6; cursor: default; }
.open-link { padding: 0; border: 0; background: transparent; color: #1f4e79; }
.board :deep(.is-waiting) { background: #fffaf1; }
.board :deep(.el-table__row) { cursor: pointer; }
.supplier-breadcrumb {
  margin: -16px -16px 16px;
  padding: 6px 16px;
  font-size: 12px;
}
.supplier-breadcrumb :deep(.admin-breadcrumb__back) { flex-basis: 28px; width: 28px; height: 28px; border-radius: 7px; }
.supplier-breadcrumb :deep(.admin-breadcrumb__back svg) { width: 14px; height: 14px; }
.supplier-breadcrumb :deep(.admin-breadcrumb__label) { padding: 5px 6px; }
.supplier-hero { display: flex; gap: 11px; align-items: flex-start; margin-bottom: 11px; padding: 13px; border: 1px solid #e7ebf2; border-radius: 11px; background: #fff; }
.avatar { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 11px; background: #05152b; color: #fff; font-weight: 700; }
.supplier-hero__main { flex: 1; min-width: 0; }
.supplier-hero__main p { margin: 0; color: #6d7686; font-size: 11px; }
.supplier-hero__main h1 { margin: 3px 0; color: #05152b; font-size: 21px; overflow-wrap: anywhere; }
.hero-pills, .quote-preview, .category-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.detail-tabs { display: flex; gap: 5px; margin-bottom: 11px; overflow-x: auto; }
.detail-tabs button { padding: 6px 10px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #526070; font: inherit; cursor: pointer; white-space: nowrap; }
.detail-tabs button.on { border-color: #05152b; color: #05152b; font-weight: 700; }
.stat-row, .split { display: grid; gap: 10px; }
.stat-row { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 10px; }
.stat-row > div, .stat-row > button, .panel { padding: 13px; border: 1px solid #e7ebf2; border-radius: 11px; background: #fff; }
.stat-row > button { text-align: left; font: inherit; cursor: pointer; }
.stat-row em, .field-note { display: block; margin-top: 3px; color: #6d7686; font-size: 11px; font-style: normal; font-weight: 500; }
.overview-board { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-items: stretch; }
.expiry-soon { color: #9a6700; }
.stat-row small, .kv dt, .muted { color: #6d7686; }
.stat-row b { display: block; margin-top: 3px; color: #05152b; font-size: 16px; }
.split { grid-template-columns: 1fr 1fr; }
.tab-panel { display: flex; flex-direction: column; gap: 10px; }
.panel h3 { margin: 0 0 10px; color: #05152b; font-size: 13px; }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.panel-head h3 { margin: 0; }
.panel-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.quote-sheet-hint { margin: 5px 0 0; color: #6d7686; font-size: 11px; line-height: 1.5; }
.quote-select { display: inline-flex; align-items: center; }
.quote-file-input { display: none; }
.quote-head__actions { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 6px; min-width: 0; max-width: 100%; margin-inline-start: auto; }
.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 13px; margin: 0; }
.kv .span-all { grid-column: 1 / -1; }
.community-picks { display: flex; flex-wrap: wrap; gap: 6px; }
.community-picks span { display: inline-flex; align-items: center; min-height: 29px; padding: 0 13px; border-radius: 999px; background: #071426; color: #fff; font-size: 11px; font-weight: 750; }
.kv dt { margin-bottom: 2px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.kv dd { margin: 0; color: #05152b; }
.kv dd.yes { color: #1f7a4a; font-weight: 700; }
.kv dd.no { color: #6d7686; }
.doc-row { display: flex; gap: 10px; align-items: center; padding: 8px 0; border-top: 1px solid #eef2f6; }
.doc-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: #eef2f7; color: #05152b; font-size: 11px; font-weight: 700; }
.doc-row div { flex: 1; }
.doc-row small { display: block; color: #6d7686; }
.doc-row .miss { color: #b42318; }
.supplier-body, .quote-page { min-width: 0; max-width: 100%; }
.quote-head { display: flex; flex-direction: column; gap: 13px; margin-bottom: 13px; }
.quote-head__copy { min-width: 0; }
.quote-head__title { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 6px 13px; }
.quote-head h2 { min-width: 0; margin: 0; color: #05152b; font-size: 18px; line-height: 1.35; overflow-wrap: anywhere; }
.quote-head__title > .status-pill { flex: 0 0 auto; margin-top: 2px; }
.quote-head p { margin: 5px 0 0; color: #6d7686; font-size: 11px; line-height: 1.6; }
.quote-head__meta { display: flex; flex-wrap: wrap; gap: 2px 16px; }
.quote-head .quote-head__reason { color: #b42318; overflow-wrap: anywhere; }
.quote-head__hourly-rates { display: flex; flex-wrap: wrap; gap: 3px 13px; margin-top: 5px; font-size: 11px; }
.quote-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px 16px; min-width: 0; padding-top: 11px; border-top: 1px solid #eef2f6; }
.quote-status-counts { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; max-width: 100%; }
.quote-status-count { display: inline-flex; align-items: baseline; gap: 5px; min-height: 26px; max-width: 100%; box-sizing: border-box; padding: 5px 8px; border-radius: 6px; background: #f4f1ea; color: #526070; font-size: 11px; line-height: 1.4; }
.quote-status-count b { color: #05152b; font-size: 13px; font-variant-numeric: tabular-nums; }
.quote-status-count.is-review { background: #fff4df; color: #9a6700; }
.quote-status-count.is-review b { color: #9a6700; }
.quote-status-count.is-rejected { background: #fdecec; color: #b42318; }
.quote-status-count.is-rejected b { color: #b42318; }
.quote-status-count.is-active { background: #e7f6ee; color: #1f7a4a; }
.quote-status-count.is-active b { color: #1f7a4a; }
.quote-status-count.is-waiting { background: #e8f1fb; color: #1f4e79; }
.quote-status-count.is-waiting b { color: #1f4e79; }
.hourly-review { display: flex; align-items: center; justify-content: space-between; gap: 13px; margin-bottom: 11px; padding: 13px 14px; background: #f7f3ec; border: 1px solid #eadfce; border-radius: 11px; }
.hourly-review__content { flex: 1; min-width: 0; }
.hourly-review__rates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 19px; margin-bottom: 6px; }
.hourly-review span { display: block; color: #74685a; font-size: 11px; font-weight: 700; }
.hourly-review strong { display: block; margin: 3px 0; color: #05152b; font-size: 22px; line-height: 1.1; }
.hourly-review__compare { display: block; max-width: 320px; color: #33445a; font-size: 12px; font-weight: 650; line-height: 1.45; }
.hourly-review__compare.is-negative { color: #b42318; }
.hourly-review__compare.is-muted { color: #8a5a12; font-weight: 650; }
.hourly-review p { max-width: 416px; margin: 0; color: #6d7686; font-size: 11px; line-height: 1.5; }
.hourly-review__actions { display: flex; flex: 0 0 auto; gap: 6px; }
.quote-foot { justify-content: flex-end; align-items: center; flex-wrap: wrap; margin-top: 11px; }
.quote-foot__selection { margin-right: auto; color: #6d7686; font-size: 11px; }
.act { flex: 0 0 auto; }
.quote-page .act { display: inline-flex; align-items: center; justify-content: center; min-height: 27px; max-width: 100%; box-sizing: border-box; line-height: 1.4; text-align: center; }
.quote-page .line-actions { flex-wrap: nowrap; gap: 6px; }
.quote-page .line-actions .act { white-space: nowrap; }
.quote-lines { display: flex; flex-direction: column; min-width: 0; }
.quote-lines .quote-table { order: 1; }
.quote-lines .sku-attaches { order: 2; }
.quote-lines.is-review-attaches .sku-attaches { order: 0; margin-top: 0; margin-bottom: 11px; }
.quote-table { width: 100%; font-variant-numeric: tabular-nums; }
.quote-table :deep(th .cell) { word-break: normal; overflow-wrap: anywhere; line-height: 1.5; }
.quote-table :deep(th.quote-price-col .cell) { white-space: nowrap; overflow-wrap: normal; }
.quote-table :deep(td .cell) { word-break: normal; overflow-wrap: anywhere; }
.quote-table :deep(.el-table-fixed-column--left),
.quote-table :deep(.el-table-fixed-column--right) { background-color: #fff; }
.quote-table :deep(th.el-table-fixed-column--left),
.quote-table :deep(th.el-table-fixed-column--right) { background-color: var(--el-table-header-bg-color, #f4eee5); }
.quote-table :deep(.el-table__body tr:hover > td.el-table-fixed-column--left),
.quote-table :deep(.el-table__body tr:hover > td.el-table-fixed-column--right) { background-color: var(--el-table-row-hover-bg-color, #fbf7ef); }
.quote-table :deep(.el-table__body-wrapper .el-scrollbar__view) { padding-bottom: 16px; }
.quote-table :deep(.el-scrollbar__bar.is-horizontal) { height: 10px; bottom: 0; z-index: 4; opacity: 1; }
.quote-table :deep(.el-scrollbar__bar.is-horizontal .el-scrollbar__thumb) { opacity: 1; }
.quote-table :deep(.el-tag) { max-width: 100%; height: auto; min-height: 19px; padding-block: 2px; white-space: normal; line-height: 1.4; }
.line-review-result { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
.line-review-result small { color: #b42318; white-space: normal; }
.line-reject-summary { margin: 0 0 10px; color: #6d7686; }
@media (max-width: 900px) {
  .stat-row, .split, .kv, .overview-board { grid-template-columns: 1fr; }
  .quote-status-counts { justify-content: flex-start; }
  .quote-head__actions { justify-content: flex-start; margin-inline-start: 0; }
  .quote-toolbar > * { flex-basis: 100%; }
  .supplier-hero { flex-wrap: wrap; }
  .hourly-review { align-items: flex-start; flex-direction: column; }
  .hourly-review__content { width: 100%; }
}
@media (max-width: 560px) {
  .hourly-review__rates { grid-template-columns: 1fr; }
}
.supplier-review__head--detail .el-button { margin-bottom: 6px; padding-left: 0; }
.board { padding: 11px; background: #fff; border: 1px solid #e7ebf2; border-radius: 11px; }
.board__bar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.board__bar .el-input { width: 192px; }
.board__bar .el-select { width: 176px; }
.board__bar .service-filter { width: 240px; }
.board__bar .review-filter { width: 152px; }
.board__count { color: #6d7686; font-size: 11px; }
.board :deep(.el-pagination) { justify-content: flex-end; margin-top: 10px; }
.board :deep(td.category-col .cell) { overflow: hidden; }
.board :deep(td.category-col .el-tooltip__trigger) { display: block; max-width: 100%; overflow: hidden; }
.category-line { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; line-height: 22px; }
.category-line .pill { display: inline-flex; margin: 0 3px 0 0; vertical-align: middle; }
.service-filters { display: grid; grid-template-columns: minmax(144px, 1.4fr) minmax(112px, 1fr) minmax(112px, 1fr); gap: 6px; margin: 0 0 10px; }
.expected-categories { align-items: center; margin: 0 0 6px; }
.expected-categories > span { width: 100%; color: #74685a; font-size: 11px; }
.phone-list { display: flex; flex-direction: column; gap: 2px; line-height: 1.45; }
.supplier-review :deep(td.phone-col .cell) { white-space: normal; overflow: visible; text-overflow: clip; }
.sku-meta { margin: 0 0 8px; color: #6d7686; font-size: 11px; }
.sku-attaches { display: flex; flex-direction: column; gap: 6px; margin-top: 11px; }
.sku-attaches h4 { margin: 0; font-size: 11px; }
.sku-attach { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; padding: 8px 10px; border: 1px solid #eadfce; border-radius: 8px; background: #fffdf8; }
.sku-attach__check { display: flex; flex: 0 0 auto; align-items: center; }
.sku-attach__check input { width: 13px; height: 13px; }
.sku-attach > div:not(.sku-attach__side) { display: flex; flex: 1 1 192px; flex-direction: column; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.sku-attach__side { display: flex; flex: 1 1 176px; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px; }
.sku-attach small { color: #74685a; font-size: 11px; }
.sku-attach__side > span { flex: 0 0 auto; max-width: 100%; font-weight: 700; overflow-wrap: anywhere; }
.sku-attach__margin { color: #1d6b45; }
.sku-attach__margin.is-negative { color: #a33b3b; }
.order-detail { min-height: 100%; color: #05152b; }
.order-detail__hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 19px; padding: 3px 2px 6px; }
.order-detail__eyebrow { margin-bottom: 3px; color: #7a8494; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.order-detail__title { margin: 0; color: #05152b; font-size: 22px; line-height: 1.2; }
.order-detail__booked-at { margin: 6px 0 0; color: #697386; font-size: 11px; }
.order-detail__amount { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; color: #7a8494; font-size: 11px; }
.order-detail__toolbar { display: flex; justify-content: flex-end; gap: 6px; margin: 11px 0; }
.reject-note { margin: 0 0 11px; color: #c45656; font-size: 11px; }
.snapshot-note { margin: 0 0 11px; color: #74685a; font-size: 11px; }
.change-count { display: block; margin-top: 3px; color: #8a5a12; font-size: 11px; line-height: 1.3; }
.profile-changes { margin: 0 0 11px; padding: 10px 11px; border: 1px solid #eadfce; border-radius: 10px; background: #fffdf8; }
.profile-changes h3 { margin: 0 0 6px; font-size: 11px; }
.profile-changes ul { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; list-style: none; }
.profile-changes li { display: flex; flex-wrap: wrap; gap: 3px 6px; align-items: baseline; font-size: 11px; line-height: 1.45; }
.profile-changes b { flex: 0 0 144px; }
.profile-changes .was, .profile-changes .now { overflow-wrap: anywhere; }
.profile-changes .was { color: #8a7560; text-decoration: line-through; }
.profile-changes .now { color: #1d6b45; font-weight: 700; }
.profile-changes em { color: #8a7560; font-style: normal; }
.order-detail__services { margin-bottom: 14px; }
.order-detail__services :deep(.el-table) { width: 100%; }
.order-detail__columns { display: grid; grid-template-columns: minmax(0, 3fr) minmax(192px, 2fr); gap: 14px; }
.order-detail__stack { display: flex; flex-direction: column; gap: 14px; }
.order-detail__panel { padding: 14px 16px; border: 1px solid #e3e8ef; border-radius: 8px; background: #fff; box-shadow: 0 2px 10px rgb(5 21 43 / 5%); }
.order-detail__panel h3 { margin: 0 0 13px; padding-bottom: 10px; border-bottom: 1px solid #edf0f4; color: #05152b; font-size: 13px; }
.order-detail__list { margin: 0; }
.order-detail__list > div + div { margin-top: 10px; }
.order-detail__list dt { margin-bottom: 4px; color: #8791a1; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.order-detail__list dd { margin: 0; }
.service-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.service-chips em { min-height: 24px; padding: 2px 10px; display: inline-flex; align-items: center; border-radius: 999px; background: #05152b; color: #f7f1e6; font-style: normal; font-size: 11px; font-weight: 650; }
.service-chips__empty { color: #697386; }
.doc-group + .doc-group { margin-top: 13px; }
.doc-group__head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.doc-group__head span, .doc-empty, .area-text { color: #697386; font-size: 11px; }
.doc-empty, .area-text { margin: 0; }
.doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.doc-card { display: flex; flex-direction: column; gap: 5px; margin: 0; padding: 0; overflow: hidden; border: 1px solid #e3e8ef; border-radius: 8px; background: #f6f8fb; }
.doc-card :deep(.el-image), .doc-card__file { width: 100%; height: 77px; background: #fff; }
.doc-card :deep(.el-image) { cursor: zoom-in; }
.doc-card__file { display: grid; place-items: center; border: 0; color: #05152b; font-weight: 700; cursor: pointer; }
.doc-card figcaption { padding: 0 6px 6px; overflow: hidden; color: #526070; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 900px) {
  .order-detail__columns { grid-template-columns: 1fr; }
}
</style>

<style>
.supplier-review-select .el-select-dropdown__item { height: 28px; padding-inline: 16px; font-size: 12px; line-height: 28px; }
.supplier-review-dialog,
.supplier-review-confirm {
  --el-font-size-base: 12px;
  --el-font-size-small: 11px;
  --el-component-size: 26px;
  --el-component-size-small: 24px;
  border-radius: 16px;
  font-size: 13px;
}
.supplier-review-confirm { width: min(336px, calc(100vw - 32px)); }
.supplier-review-dialog .el-dialog__header,
.supplier-review-confirm .el-message-box__header { padding: 18px 19px 14px; }
.supplier-review-dialog .el-dialog__title,
.supplier-review-confirm .el-message-box__title { font-size: 15px; }
.supplier-review-dialog .el-dialog__headerbtn { top: 12px; right: 13px; width: 29px; height: 29px; }
.supplier-review-dialog .el-dialog__body,
.supplier-review-confirm .el-message-box__content { padding: 18px 19px; font-size: 12px; }
.supplier-review-dialog .el-dialog__footer,
.supplier-review-confirm .el-message-box__btns { padding: 13px 19px 18px; }
.supplier-review-dialog .el-button,
.supplier-review-confirm .el-button { min-height: 28px; height: 28px; padding: 6px 12px; border-radius: 8px; font-size: 12px; }
.supplier-detail-drawer .el-drawer__body { background: #f6f8fb; }
.policy-preview.el-dialog { overflow: hidden; }
.policy-preview .el-dialog__body { padding: 0 0 18px; }
.approve-plain-confirm .el-message-box__container { display: none; }
.approve-plain-confirm .el-message-box__btns { padding-top: 0; }
</style>
