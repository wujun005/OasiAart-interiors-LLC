<template>
  <div class="supplier-review">
    <template v-if="!detailId">
      <header class="supplier-review__head">
        <div>
          <h1>{{ t('admin.platformSuppliers.title') }}</h1>
          <p>{{ t('admin.platformSuppliers.description') }}</p>
        </div>
      </header>

      <div v-if="waitingCount" class="waiting-bar">
        <span>!</span>
        <div>
          <b>{{ t('admin.platformSuppliers.waitingTitle', { count: waitingCount }) }}</b>
          <p>{{ t('admin.platformSuppliers.waitingBody') }}</p>
        </div>
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
          <el-select v-model="quoteStatus" filterable :placeholder="t('admin.platformSuppliers.allSuppliers')" @change="search">
            <el-option :label="t('admin.platformSuppliers.allSuppliers')" value="" />
            <el-option :label="t('admin.platformSuppliers.quotePendingFilter')" :value="1" />
            <el-option :label="t('admin.platformSuppliers.quoteDraftFilter')" :value="0" />
            <el-option :label="t('admin.platformSuppliers.quoteApprovedFilter')" :value="2" />
            <el-option :label="t('admin.platformSuppliers.quoteRejectedFilter')" :value="3" />
          </el-select>
          <el-select v-model="onboardingStatus" clearable :placeholder="t('admin.platformSuppliers.onboardingStatus')" class="review-filter" @change="search">
            <el-option :label="t('admin.platformSuppliers.draft')" :value="0" />
            <el-option :label="t('admin.platformSuppliers.pending')" :value="1" />
            <el-option :label="t('admin.platformSuppliers.approved')" :value="2" />
            <el-option :label="t('admin.platformSuppliers.rejected')" :value="3" />
          </el-select>
          <el-select v-model="needReview" clearable :placeholder="t('admin.platformSuppliers.needReview')" class="review-filter" @change="search">
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
          <el-table-column :label="t('admin.platformSuppliers.supplierNo')" min-width="140">
            <template #default="{ row }">
              <b class="supplier-no">{{ row.supplierNo || row.id }}</b>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.supplier')" min-width="200">
            <template #default="{ row }">
              <div class="supplier-cell">{{ row.supplierName || '—' }}</div>
              <small v-if="row.contactPerson || row.mobile">{{ [row.contactPerson, row.mobile].filter(Boolean).join(' · ') }}</small>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.categories')" min-width="180">
            <template #default="{ row }">
              <div v-if="displayCategories(row).length" class="category-tags">
                <span v-for="cat in displayCategories(row)" :key="cat.key" class="pill">{{ cat.label }}</span>
              </div>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.onboarding')" width="150">
            <template #default="{ row }">
              <span class="status-pill" :class="statusClass(row.onboardingStatus)">
                {{ onboardingText(row.onboardingStatus, row.onboardingStatusI18n) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.latestSubmit')" min-width="160">
            <template #default="{ row }">{{ formatTime(row.latestSubmitTime) }}</template>
          </el-table-column>
          <el-table-column :label="t('admin.platformSuppliers.actions')" width="210">
            <template #default="{ row }">
              <div v-if="Number(row.onboardingStatus) === 1" class="row-actions" @click.stop>
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
      <nav class="crumbs">
        <button type="button" class="crumb-back" @click="crumbBack">←</button>
        <button type="button" class="crumb-home" @click="backToList">{{ t('admin.platformSuppliers.title') }}</button>
        <template v-if="screen === 'list'" />
        <template v-else>
          <span>›</span>
          <button v-if="screen !== 'supplier'" type="button" @click="openSupplierTab('overview')">{{ profile.companyName || current?.supplierName || '—' }}</button>
          <b v-else>{{ profile.companyName || current?.supplierName || '—' }}</b>
        </template>
        <template v-if="screen === 'quote'">
          <span>›</span>
          <button type="button" @click="openQuotes">{{ t('admin.platformSuppliers.services') }}</button>
        </template>
        <template v-if="screen === 'quote'">
          <span>›</span>
          <b>{{ skuDialogTitle }}</b>
        </template>
      </nav>

      <el-skeleton v-if="detailLoading && screen !== 'quote'" :rows="12" animated />
      <div v-else class="supplier-body">
        <header v-if="screen !== 'quote'" class="supplier-hero">
          <div class="avatar">{{ supplierInitials }}</div>
          <div class="supplier-hero__main">
            <p>{{ t('admin.platformSuppliers.supplierNo') }} {{ profile.supplierNo || current?.supplierNo || '—' }}<template v-if="onboarding.snapshotVersion"> · {{ t('admin.platformSuppliers.snapshotVersion', { version: onboarding.snapshotVersion }) }}</template></p>
            <h1>{{ profile.companyName || current?.supplierName || '—' }}</h1>
            <div class="hero-pills">
              <span class="status-pill" :class="statusClass(onboarding.status)">{{ t('admin.platformSuppliers.onboarding') }}: {{ onboardingLabel(onboarding.status) }}</span>
              <span v-if="pendingQuoteCount" class="status-pill pending">{{ t('admin.platformSuppliers.quotesWaiting', { count: pendingQuoteCount }) }}</span>
            </div>
          </div>
          <div v-if="Number(onboarding.status) === 1" class="hero-actions">
            <button type="button" class="act no" :disabled="saving" @click="openReject('onboarding')">{{ t('admin.platformSuppliers.reject') }}</button>
            <button type="button" class="act navy" :disabled="saving" @click="approveOnboarding">{{ t('admin.platformSuppliers.approveOnboarding') }}</button>
          </div>
        </header>
        <p v-if="onboarding.rejectReason" class="reject-note">{{ t('admin.platformSuppliers.rejectReason', { reason: onboarding.rejectReason }) }}</p>
        <p v-if="onboarding.snapshotVersion && (Number(onboarding.status) === 1 || Number(onboarding.status) === 3)" class="snapshot-note">{{ t('admin.platformSuppliers.snapshotReview') }}</p>

        <div class="detail-tabs">
          <button type="button" :class="{ on: detailTab === 'overview' }" @click="openSupplierTab('overview')">{{ t('admin.platformSuppliers.overview') }}</button>
          <button type="button" :class="{ on: detailTab === 'quotes' }" @click="openQuotes">{{ t('admin.platformSuppliers.services') }}</button>
          <button type="button" :class="{ on: detailTab === 'company' }" @click="openSupplierTab('company')">{{ t('admin.platformSuppliers.companyTab') }}</button>
          <button type="button" :class="{ on: detailTab === 'capacity' }" @click="openSupplierTab('capacity')">{{ t('admin.platformSuppliers.capacityTab') }}</button>
          <button type="button" :class="{ on: detailTab === 'bank' }" @click="openSupplierTab('bank')">{{ t('admin.platformSuppliers.bankTab') }}</button>
          <button type="button" :class="{ on: detailTab === 'docs' }" @click="openSupplierTab('docs')">{{ t('admin.platformSuppliers.documents') }}</button>
        </div>

        <template v-if="screen === 'supplier'">

          <div v-if="detailTab === 'overview'" class="tab-panel">
            <div class="stat-row">
              <div><small>{{ t('admin.platformSuppliers.servicesOffered') }}</small><b>{{ services.length }}</b></div>
              <div><small>{{ t('admin.platformSuppliers.approvedQuotes') }}</small><b>{{ approvedQuoteCount }}</b></div>
              <div><small>{{ t('admin.platformSuppliers.quotesToReview') }}</small><b>{{ pendingQuoteCount }}</b></div>
              <div><small>{{ t('admin.platformSuppliers.onboarding') }}</small><b>{{ onboardingLabel(onboarding.status) }}</b></div>
            </div>
            <button type="button" class="quote-link" @click="openQuotes">
              <div>
                <h3>{{ t('admin.platformSuppliers.services') }} →</h3>
                <p>{{ t('admin.platformSuppliers.quotesLinkBody') }}</p>
              </div>
              <div class="quote-preview">
                <span v-for="row in services" :key="row.spuId" class="status-pill" :class="statusClass(row.status)">{{ serviceName(row) }} · {{ quoteStatusLabel(row.status, row.statusI18n) }}</span>
                <span v-if="!services.length" class="muted">{{ t('admin.platformSuppliers.noServices') }}</span>
              </div>
            </button>
            <div class="split">
              <section class="panel">
                <h3>{{ t('admin.platformSuppliers.keyDetails') }}</h3>
                <dl class="kv">
                  <div><dt>{{ t('admin.platformSuppliers.contact') }}</dt><dd>{{ text(profile.contactPerson) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.phone') }}</dt><dd>{{ text(profile.mobile) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.categories') }}</dt><dd>{{ expectedServiceNames.length || displayCategoryCount }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.serviceAreas') }}</dt><dd>{{ areaTags.length || '—' }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.availableWorkers') }}</dt><dd>{{ text(profile.totalAvailableWorkers) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.workingHours') }}</dt><dd>{{ text(profile.workingHours) }}</dd></div>
                </dl>
              </section>
              <section class="panel">
                <h3>{{ t('admin.platformSuppliers.documents') }}</h3>
                <dl class="kv">
                  <div v-for="group in documentGroups" :key="group.label">
                    <dt>{{ group.label }}</dt>
                    <dd :class="group.files.length ? 'yes' : 'no'">{{ group.files.length ? t('admin.platformSuppliers.uploaded') : t('admin.platformSuppliers.notUploaded') }}</dd>
                  </div>
                  <div><dt>{{ t('admin.platformSuppliers.licenseExpiry') }}</dt><dd>{{ text(profile.licenseExpiry) }}</dd></div>
                </dl>
              </section>
            </div>
          </div>

          <div v-else-if="detailTab === 'company'" class="split">
            <section class="panel">
              <h3>{{ t('admin.platformSuppliers.company') }}</h3>
              <dl class="kv">
                <div><dt>{{ t('admin.platformSuppliers.supplier') }}</dt><dd>{{ text(profile.companyName) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.licenseNo') }}</dt><dd>{{ text(profile.tradeLicenseNo) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.licenseIssuedBy') }}</dt><dd>{{ licenseIssuerText(profile) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.licenseExpiry') }}</dt><dd>{{ text(profile.licenseExpiry) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.vat') }}</dt><dd>{{ text(profile.vatTrn) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.years') }}</dt><dd>{{ text(profile.yearsInBusiness) }}</dd></div>
                <div><dt>{{ t('admin.platformSuppliers.address') }}</dt><dd>{{ text(profile.officeAddress) }}</dd></div>
              </dl>
            </section>
            <section class="panel">
              <h3>{{ t('admin.platformSuppliers.contactTitle') }}</h3>
              <dl class="kv">
                <div><dt>{{ t('admin.platformSuppliers.contact') }}</dt><dd>{{ text(profile.contactPerson) }}</dd></div>
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
                  <div><dt>{{ t('admin.platformSuppliers.availableWorkers') }}</dt><dd>{{ text(profile.totalAvailableWorkers) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.femaleStaff') }}</dt><dd>{{ staffText(profile.femaleStaffAvailable, profile.femaleStaffCount) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.maleStaff') }}</dt><dd>{{ staffText(profile.maleStaffAvailable, profile.maleStaffCount) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.concurrent') }}</dt><dd>{{ text(profile.maxSimultaneousOrders) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.monthly') }}</dt><dd>{{ text(profile.monthlyCapacity) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.leadTime') }}</dt><dd>{{ profile.minLeadTimeHours == null ? '—' : t('admin.platformSuppliers.leadHours', { hours: profile.minLeadTimeHours }) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.workingHours') }}</dt><dd>{{ text(profile.workingHours) }}</dd></div>
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
                  <div><dt>{{ t('admin.platformSuppliers.taxInvoice') }}</dt><dd>{{ yesNo(profile.taxInvoiceAvailable) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.emaar') }}</dt><dd>{{ yesNo(profile.emaarOnboarded) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.otherCommunity') }}</dt><dd>{{ yesNo(profile.otherCommunityOnboarded) }}</dd></div>
                  <div><dt>{{ t('admin.platformSuppliers.otherNote') }}</dt><dd>{{ text(profile.applyRenmark) }}</dd></div>
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
              <h3>{{ t('admin.platformSuppliers.services') }}</h3>
              <p v-if="!services.length" class="muted">{{ t('admin.platformSuppliers.noServicesHint') }}</p>
              <div v-if="!services.length && expectedServiceNames.length" class="category-tags">
                <span v-for="name in expectedServiceNames" :key="name" class="pill">{{ name }}</span>
              </div>
              <el-table v-else :data="services" row-key="spuId" :empty-text="t('admin.platformSuppliers.noServices')" @row-click="openQuote">
                <el-table-column :label="t('admin.platformSuppliers.service')" min-width="160">
                  <template #default="{ row }"><b>{{ serviceName(row) }}</b></template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.category')" min-width="140">
                  <template #default="{ row }">{{ serviceCategory(row) }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.quoteStatus')" width="140">
                  <template #default="{ row }">
                    <span class="status-pill" :class="statusClass(row.status)">{{ quoteStatusLabel(row.status, row.statusI18n) }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.workers')" width="120">
                  <template #default="{ row }">{{ row.workerCount ?? '—' }}</template>
                </el-table-column>
                <el-table-column :label="t('admin.platformSuppliers.actions')" width="140">
                  <template #default="{ row }">
                    <button type="button" class="act navy" @click.stop="openQuote(row)">{{ t('admin.platformSuppliers.reviewQuote') }}</button>
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
            <div>
              <h2>{{ skuDialogTitle }}</h2>
              <p>
                {{ quoteStatusLabel(skuStatus, skuStatusI18n) }}
                · {{ skuQuoteMode === 2 ? t('admin.platformSuppliers.unitPrice') : skuQuoteMode === 1 ? t('admin.platformSuppliers.fixedPrice') : t('admin.platformSuppliers.modeUnset') }}
                <span v-if="skuQuoteMode === 2"> {{ t('admin.platformSuppliers.perHour', { price: moneyText(skuUnitPrice) }) }}</span>
                <span v-if="skuRejectReason"> · {{ skuRejectReason }}</span>
              </p>
            </div>
            <span class="status-pill" :class="statusClass(skuStatus)">{{ quoteStatusLabel(skuStatus, skuStatusI18n) }}</span>
          </header>
          <el-table v-loading="skuLoading" :data="skuRows" row-key="skuId" :empty-text="t('admin.platformSuppliers.noSpecs')">
            <el-table-column v-for="column in skuColumns" :key="column.key" :label="specColumnLabel(column)" min-width="120">
              <template #default="{ row }">{{ specCell(row.specs[column.key]) }}</template>
            </el-table-column>
            <el-table-column v-if="!skuColumns.length" label="SKU" prop="skuCode" min-width="120" />
            <el-table-column :label="t('admin.platformSuppliers.clientPrice')" width="120">
              <template #default="{ row }">{{ moneyText(clientPrice(row)) }}</template>
            </el-table-column>
            <el-table-column :label="t('admin.platformSuppliers.taxQuote')" width="130">
              <template #default="{ row }">{{ moneyText(row.quotePrice) }}</template>
            </el-table-column>
            <el-table-column :label="t('admin.platformSuppliers.margin')" width="110">
              <template #default="{ row }">{{ marginText(row) }}</template>
            </el-table-column>
            <el-table-column :label="t('admin.platformSuppliers.effectivePrice')" width="150">
              <template #default="{ row }">{{ moneyText(row.approvedPrice) }}</template>
            </el-table-column>
            <el-table-column :label="t('admin.platformSuppliers.skuSwitch')" width="90">
              <template #default="{ row }">{{ row.enabled ? t('admin.platformSuppliers.skuOn') : t('admin.platformSuppliers.skuOff') }}</template>
            </el-table-column>
            <el-table-column :label="t('admin.platformSuppliers.staffCount')" width="80">
              <template #default="{ row }">{{ row.staffCount ?? '—' }}</template>
            </el-table-column>
            <el-table-column :label="t('admin.platformSuppliers.durationHours')" width="90">
              <template #default="{ row }">{{ row.serviceHours ?? '—' }}</template>
            </el-table-column>
          </el-table>
          <section v-if="skuAttaches.length" class="sku-attaches">
            <h4>{{ t('admin.platformSuppliers.addons') }}</h4>
            <div v-for="item in skuAttaches" :key="item.attachValueId" class="sku-attach">
              <div>
                <strong>{{ attachName(item) }}</strong>
                <small>{{ t('admin.platformSuppliers.addonMeta', { type: attachTypeName(item), platform: moneyText(item.platformPrice), approved: moneyText(item.approvedPrice) }) }}</small>
              </div>
              <span>{{ item.offered ? moneyText(item.quotePrice) : t('admin.platformSuppliers.unavailable') }}</span>
            </div>
          </section>
          <footer v-if="Number(skuStatus) === 1" class="quote-foot">
            <button type="button" class="act no" :disabled="saving" @click="openReject('quote', skuTarget)">{{ t('admin.platformSuppliers.reject') }}</button>
            <button type="button" class="act navy" :disabled="saving" @click="approveQuote(skuTarget)">{{ t('admin.platformSuppliers.approve') }}</button>
          </footer>
        </section>
      </div>
    </section>

    <el-dialog
      v-model="filePreview.open"
      class="policy-preview"
      :title="filePreview.name"
      width="min(960px, 92vw)"
      append-to-body
      :z-index="6000"
      destroy-on-close
    >
      <div class="policy-preview__stage">
        <img v-if="filePreview.kind === 'image'" :src="filePreview.url" :alt="filePreview.name" />
        <iframe v-else-if="filePreview.kind === 'pdf'" :src="filePreview.url" :title="filePreview.name" />
        <p v-else>{{ t('admin.platformSuppliers.previewUnsupported') }}</p>
      </div>
    </el-dialog>


    <el-dialog v-model="rejectOpen" :title="rejectMode === 'onboarding' ? t('admin.platformSuppliers.rejectOnboarding') : t('admin.platformSuppliers.rejectQuote')" width="460px" append-to-body>
      <el-input v-model="rejectReason" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="t('admin.platformSuppliers.reasonPlaceholder')" />
      <template #footer>
        <el-button @click="rejectOpen = false">{{ t('admin.platformSuppliers.cancel') }}</el-button>
        <el-button type="danger" :loading="saving" @click="submitReject">{{ t('admin.platformSuppliers.confirmReject') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { listBySpu, listSpuAttachCatalog } from '@/modules/admin/api/spu'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import { listServiceCategories, serviceCategoryLabel } from '@/modules/client/api/supplier-onboarding'
import {
  onboardingChangeStatus,
  onboardingDetail,
  onboardingPage,
  platformSupplierQuotePage,
  platformSupplierQuoteReview,
  platformSupplierQuoteServices,
  platformSupplierQuoteSkus,
  serviceCatalog,
} from '@/modules/admin/api/supplierWorkbench'

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
  pendingReview?: boolean
  latestSubmitTime?: string
}

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const keyword = ref('')
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
const detailTab = computed(() => {
  const view = String(route.query.view || '')
  if (view === 'quotes' || view === 'quote') return 'quotes'
  const tab = String(route.query.tab || 'overview')
  return ['overview', 'quotes', 'company', 'capacity', 'bank', 'docs'].includes(tab) ? tab : 'overview'
})
const waitingCount = ref(0)
const detailLoading = ref(false)
const saving = ref(false)
const current = ref<SupplierRow | null>(null)
const profile = reactive<Record<string, any>>({})
const services = ref<any[]>([])
const onboarding = reactive({
  status: undefined as number | undefined,
  rejectReason: '',
  snapshotVersion: undefined as number | undefined,
  reviewKind: undefined as number | undefined,
})
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
  const path = decodeURIComponent(url.split('?')[0].split('#')[0])
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
    { label: t('admin.platformSuppliers.employeeInsurance'), answer: yesNo(profile.employeeInsurance), files: toDocFiles(profile.employeeInsuranceFile) },
  ]
  const extra = profile.extra && typeof profile.extra === 'object' ? profile.extra as Record<string, unknown> : {}
  const extraLabels: Record<string, string> = {
    tradeLicenseFile: t('admin.platformSuppliers.tradeLicense'),
    licenseFile: t('admin.platformSuppliers.tradeLicense'),
    vatFile: t('admin.platformSuppliers.vatCertificate'),
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
const skuRejectReason = ref('')
const skuTarget = ref<any>(null)
const skuColumns = ref<{ key: string; nameI18n: Record<string, unknown> | null; fallback: string }[]>([])
const skuRows = ref<any[]>([])
const skuAttaches = ref<Array<{ attachValueId: number; typeName: string; typeNameI18n?: Record<string, unknown> | null; name: string; nameI18n?: Record<string, unknown> | null; platformPrice: unknown; approvedPrice: unknown; offered: boolean; quotePrice: unknown }>>([])
const skuQuoteMode = ref<number | null>(null)
const skuUnitPrice = ref<number | null>(null)
const skuStatusI18n = ref<Record<string, string> | null>(null)

const rejectOpen = ref(false)
const rejectMode = ref<'quote' | 'onboarding'>('quote')
const rejectReason = ref('')
const rejectTarget = ref<any>(null)

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const quoteStatusLabel = (status?: number, i18n?: Record<string, unknown> | null) => {
  const localized = specText(i18n)
  if (localized !== '—') return localized
  const keys = ['quoteDraft', 'quotePending', 'quoteApproved', 'quoteRejected']
  const key = keys[Number(status)]
  return key ? t(`admin.platformSuppliers.${key}`) : t('admin.platformSuppliers.quoteNone')
}
const quoteTagType = (status?: number) => (Number(status) === 1 ? 'warning' : Number(status) === 2 ? 'success' : Number(status) === 3 ? 'danger' : 'info')
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
const attachName = (item: { nameI18n?: unknown; name?: string }) => {
  const text = specText(item.nameI18n)
  return text !== '—' ? text : (item.name || '—')
}
const attachTypeName = (item: { typeNameI18n?: unknown; typeName?: string }) => {
  const text = specText(item.typeNameI18n)
  return text !== '—' ? text : (item.typeName || '—')
}
const serviceCategory = (row: any) => {
  const localized = specText(row?.categoryNameI18n)
  return localized !== '—' ? localized : (row?.categoryName || '—')
}
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
const clientPrice = (row: { platformPrice?: unknown; platformOriginalPrice?: unknown }) => {
  const sale = Number(row.platformPrice)
  if (Number.isFinite(sale) && sale > 0) return sale
  const original = Number(row.platformOriginalPrice)
  return Number.isFinite(original) ? original : null
}
const marginText = (row: { platformPrice?: unknown; platformOriginalPrice?: unknown; quotePrice?: unknown }) => {
  const client = Number(clientPrice(row))
  const quote = Number(row.quotePrice)
  if (!Number.isFinite(client) || client <= 0 || !Number.isFinite(quote)) return '—'
  return `${Math.round(((client - quote) / client) * 100)}%`
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
  services?: ServiceCategory[]
  expectedServiceCategoryIds?: Array<number | string>
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

const collectQuoteRows = async () => {
  const rows: SupplierRow[] = []
  const scanSize = 100
  let scanPage = 1
  let scanTotal = 0
  do {
    const payload: Record<string, unknown> = { pageNum: scanPage, pageSize: scanSize }
    if (keyword.value) payload.keyword = keyword.value
    if (quoteStatus.value !== '') payload.quoteStatus = quoteStatus.value
    if (onboardingStatusParam() != null) payload.onboardingStatus = onboardingStatusParam()
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
    expectedCategoryIds: categoryIdsOf(item),
    latestSubmitTime: quote?.latestSubmitTime || item.modifyTime,
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

const loadSuppliers = async () => {
  loading.value = true
  try {
    await ensureCategoryLabels()
    const review = reviewChoice()
    if (review) {
      const [onboardingRows, quoteRows] = await Promise.all([
        collectOnboarding(review),
        collectQuoteRows(),
      ])
      const quoteById = new Map(quoteRows.map((row) => [Number(row.id), row]))
      const merged = onboardingRows
        .filter((item) => quoteStatus.value === '' || quoteById.has(Number(item.id)))
        .map((item) => toReviewRow(item, quoteById.get(Number(item.id))))
      total.value = merged.length
      const start = (pageNum.value - 1) * pageSize
      suppliers.value = merged.slice(start, start + pageSize)
      await refreshWaiting()
      return
    }
    const payload: Record<string, unknown> = { pageNum: pageNum.value, pageSize }
    if (keyword.value) payload.keyword = keyword.value
    if (quoteStatus.value !== '') payload.quoteStatus = quoteStatus.value
    if (onboardingStatusParam() != null) payload.onboardingStatus = onboardingStatusParam()
    const page = unwrap(await platformSupplierQuotePage(payload)) || {}
    const rows = (page.list || []) as SupplierRow[]
    suppliers.value = await attachOnboardingStatus(rows)
    total.value = Number(page.total || 0)
    await refreshWaiting()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.loadFailed'))
  } finally {
    loading.value = false
  }
}

const refreshWaiting = async () => {
  try {
    const result = unwrap(await onboardingPage({ pageNum: 1, pageSize: 1, status: 1 })) || {}
    waitingCount.value = Number(result.total || 0)
  } catch {
    waitingCount.value = 0
  }
}

const search = () => {
  pageNum.value = 1
  loadSuppliers()
}
const changePage = (page: number) => {
  pageNum.value = page
  loadSuppliers()
}

const loadReview = async (supplierId: number) => {
  detailLoading.value = true
  try {
    const [detail, serviceList, catalog] = await Promise.all([
      onboardingDetail(supplierId),
      platformSupplierQuoteServices(supplierId),
      serviceCatalog(supplierId).catch(() => null),
    ])
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
    const selection = new Map<number, { workerCount?: number; contactPhones: string[] }>()
    const categoryI18n = new Map<number, Record<string, string>>()
    ;(unwrap(catalog) || []).forEach((group: any) => {
      if (group?.categoryId && group?.nameI18n) categoryI18n.set(Number(group.categoryId), group.nameI18n)
      ;(group.services || []).forEach((service: any) => {
        if (!service.selected) return
        selection.set(Number(service.spuId), {
          workerCount: service.workerCount,
          contactPhones: Array.isArray(service.contactPhones) ? service.contactPhones : [],
        })
      })
    })
    services.value = (unwrap(serviceList) || []).map((row: any) => ({
      ...row,
      categoryNameI18n: categoryI18n.get(Number(row.categoryId)),
      ...(selection.get(Number(row.spuId)) || {}),
    }))
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
    ElMessage.error(error?.message || t('admin.platformSuppliers.reviewLoadFailed'))
  } finally {
    detailLoading.value = false
  }
}

const openReview = (row: SupplierRow) => {
  router.push({ path: route.path, query: { id: String(row.id), tab: 'overview' } })
}
const backToList = () => {
  router.push({ path: route.path })
}
const openSupplierTab = (tab: string) => {
  router.push({ path: route.path, query: { id: String(detailId.value), tab } })
}
const openQuotes = () => {
  router.push({ path: route.path, query: { id: String(detailId.value), tab: 'quotes' } })
}
const openQuote = (row: { spuId?: number }) => {
  router.push({ path: route.path, query: { id: String(detailId.value), view: 'quote', spu: String(row.spuId || '') } })
}
const crumbBack = () => {
  if (screen.value === 'quote') openQuotes()
  else backToList()
}

const approveOnboarding = async () => {
  if (!detailId.value || saving.value) return
  const firstReview = onboarding.reviewKind !== 2
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

const approveQuote = async (row: any) => {
  if (!detailId.value || !row?.spuId) return
  try {
    await ElMessageBox.confirm(
      t('admin.platformSuppliers.approveQuoteConfirm', { name: serviceName(row) || t('admin.platformSuppliers.thisService') }),
      t('admin.platformSuppliers.approveQuoteTitle'),
    )
  } catch {
    return
  }
  saving.value = true
  try {
    await platformSupplierQuoteReview({
      supplierId: detailId.value,
      spuId: row.spuId,
      status: 2,
    })
    ElMessage.success(t('admin.platformSuppliers.approveQuoteSuccess'))
    skuStatus.value = 2
    await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.approveQuoteFailed'))
  } finally {
    saving.value = false
  }
}

const openReject = (mode: 'quote' | 'onboarding', row?: any) => {
  rejectMode.value = mode
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
  const supplierId = rejectMode.value === 'onboarding'
    ? Number(rejectTarget.value?.id || detailId.value)
    : detailId.value
  if (!supplierId) return
  saving.value = true
  try {
    if (rejectMode.value === 'onboarding') {
      await onboardingChangeStatus({ id: supplierId, status: 3, rejectReason: reason })
      ElMessage.success(t('admin.platformSuppliers.onboardingRejected'))
    } else {
      await platformSupplierQuoteReview({
        supplierId,
        spuId: rejectTarget.value?.spuId,
        status: 3,
        rejectReason: reason,
      })
      ElMessage.success(t('admin.platformSuppliers.quoteRejectedSuccess'))
      skuStatus.value = 3
      skuRejectReason.value = reason
    }
    rejectOpen.value = false
    if (detailId.value) await loadReview(detailId.value)
    await loadSuppliers()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.rejectFailed'))
  } finally {
    saving.value = false
  }
}

const openSkus = async (row: any) => {
  if (!detailId.value) return
  skuTarget.value = row
  skuTitle.value = serviceName(row) || t('admin.platformSuppliers.serviceFallback')
  skuStatus.value = row.status
  skuStatusI18n.value = row.statusI18n || null
  skuRejectReason.value = row.rejectReason || ''
  skuQuoteMode.value = null
  skuUnitPrice.value = null
  skuColumns.value = []
  skuRows.value = []
  skuAttaches.value = []
  skuLoading.value = true
  try {
    const quote = unwrap(await platformSupplierQuoteSkus(detailId.value, row.spuId)) || {}
    skuStatus.value = quote.status ?? row.status
    skuStatusI18n.value = quote.statusI18n || row.statusI18n || null
    skuRejectReason.value = quote.rejectReason || row.rejectReason || ''
    skuQuoteMode.value = quote.quoteMode == null ? null : Number(quote.quoteMode)
    skuUnitPrice.value = quote.unitPrice == null ? null : Number(quote.unitPrice)
    const quoted = new Map((quote.skus || []).map((sku: any) => [Number(sku.skuId), sku]))
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
    skuColumns.value = columns
    const source = specSkus.length ? specSkus : (quote.skus || [])
    skuRows.value = source.map((sku: any) => {
      const saved = quoted.get(Number(sku.skuId)) || sku
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        specs: Object.fromEntries(columns.map((column) => [column.key, sku[column.key]])),
        platformPrice: saved.platformPrice ?? sku.price,
        platformOriginalPrice: saved.platformOriginalPrice ?? sku.originalPrice,
        approvedPrice: saved.approvedPrice ?? null,
        enabled: saved.enabled == null || saved.enabled === '' ? true : Number(saved.enabled) === 1,
        staffCount: saved.staffCount ?? null,
        serviceHours: saved.serviceHours ?? null,
        quotePrice: saved.quotePrice ?? null,
      }
    })
    if (!catalogAttaches.length) {
      try {
        catalogAttaches = await listSpuAttachCatalog(row.spuId, catalogAttaches)
      } catch {
        catalogAttaches = []
      }
    }
    const savedAttaches = new Map((Array.isArray(quote.attaches) ? quote.attaches : []).map((item: any) => [Number(item.attachValueId), item]))
    const attachSource = catalogAttaches.length ? catalogAttaches : (Array.isArray(quote.attaches) ? quote.attaches : [])
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
        platformPrice: saved.platformPrice ?? item.platformPrice ?? null,
        approvedPrice: saved.approvedPrice ?? null,
        offered: saved.canServe === true,
        quotePrice: saved.quotePrice ?? null,
      }
    })
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformSuppliers.quoteLoadFailed'))
    skuOpen.value = false
  } finally {
    skuLoading.value = false
  }
}

watch(detailId, (id) => {
  if (id) loadReview(id)
}, { immediate: true })

watch(() => [detailId.value, String(route.query.view || ''), String(route.query.spu || '')], () => {
  if (String(route.query.view) !== 'quote' || !detailId.value) return
  const spu = Number(route.query.spu)
  if (!spu || Number(skuTarget.value?.spuId) === spu) return
  const row = services.value.find((item) => Number(item.spuId) === spu) || { spuId: spu }
  openSkus(row)
})

watch(() => route.query.onboardingStatus, (value) => {
  if (value == null || value === '') return
  const next = readStatusQuery()
  if (next === '' || next === onboardingStatus.value) return
  onboardingStatus.value = next
  pageNum.value = 1
  if (!detailId.value) loadSuppliers()
})

onMounted(loadSuppliers)
</script>

<style scoped>
.supplier-review { padding: 20px; color: #1c2433; }
.supplier-review__head h1 { margin: 0 0 6px; color: #05152b; font-family: Georgia, serif; font-size: 28px; font-weight: 500; }
.supplier-review__head p { margin: 0 0 16px; color: #6d7686; }
.waiting-bar { display: flex; gap: 12px; align-items: flex-start; margin: 0 0 14px; padding: 12px 14px; border: 1px solid #f0d7a4; border-radius: 12px; background: #fff8ea; }
.waiting-bar > span { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #05152b; color: #fff; font-weight: 700; }
.waiting-bar b { display: block; color: #05152b; }
.waiting-bar p { margin: 4px 0 0; color: #6d7686; font-size: 12.5px; }
.supplier-no { color: #05152b; }
.supplier-cell { color: #05152b; font-weight: 650; }
.board :deep(small) { display: block; color: #6d7686; font-size: 12px; }
.pill { display: inline-flex; margin: 0 4px 4px 0; padding: 2px 8px; border-radius: 999px; background: #eef2f7; color: #05152b; font-size: 12px; }
.status-pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; background: #eef2f7; color: #526070; font-size: 12px; font-weight: 650; }
.status-pill.pending { background: #fff4df; color: #9a6700; }
.status-pill.ok { background: #e7f6ee; color: #1f7a4a; }
.status-pill.bad { background: #fdecec; color: #b42318; }
.muted-pill { background: #eef2f7; color: #6d7686; }
.row-actions, .hero-actions, .quote-foot { display: flex; gap: 8px; }
.act, .open-link { border: 1px solid #d7dee8; border-radius: 8px; background: #fff; color: #05152b; font: inherit; font-size: 13px; cursor: pointer; }
.act { padding: 6px 10px; }
.act.ok { border-color: #1f7a4a; color: #1f7a4a; }
.act.no { border-color: #b42318; color: #b42318; }
.act.navy { border-color: #05152b; background: #05152b; color: #fff; }
.act:disabled { opacity: 0.6; cursor: default; }
.open-link { padding: 0; border: 0; background: transparent; color: #1f4e79; }
.board :deep(.is-waiting) { background: #fffaf1; }
.board :deep(.el-table__row) { cursor: pointer; }
.crumbs { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; color: #6d7686; font-size: 13px; }
.crumbs button { border: 0; background: transparent; color: #1f4e79; font: inherit; cursor: pointer; }
.crumbs b { color: #05152b; }
.crumb-back, .crumb-home { padding: 4px 8px; border: 1px solid #d7dee8 !important; border-radius: 8px; color: #05152b !important; }
.supplier-hero { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; padding: 16px; border: 1px solid #e7ebf2; border-radius: 14px; background: #fff; }
.avatar { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 14px; background: #05152b; color: #fff; font-weight: 700; }
.supplier-hero__main { flex: 1; }
.supplier-hero__main p { margin: 0; color: #6d7686; font-size: 12px; }
.supplier-hero__main h1 { margin: 4px 0; color: #05152b; font-size: 26px; }
.hero-pills, .quote-preview, .category-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.detail-tabs { display: flex; gap: 6px; margin-bottom: 14px; overflow-x: auto; }
.detail-tabs button { padding: 8px 12px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #526070; font: inherit; cursor: pointer; white-space: nowrap; }
.detail-tabs button.on { border-color: #05152b; color: #05152b; font-weight: 700; }
.stat-row, .split { display: grid; gap: 12px; }
.stat-row { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 12px; }
.stat-row > div, .panel { padding: 16px; border: 1px solid #e7ebf2; border-radius: 14px; background: #fff; }
.stat-row small, .kv dt, .muted { color: #6d7686; }
.stat-row b { display: block; margin-top: 4px; color: #05152b; font-size: 20px; }
.quote-link { display: block; width: 100%; margin-bottom: 12px; padding: 16px; border: 1px solid #e7ebf2; border-radius: 14px; background: #fff; text-align: left; cursor: pointer; }
.quote-link h3 { margin: 0 0 4px; color: #05152b; }
.quote-link p { margin: 0 0 10px; color: #6d7686; }
.split { grid-template-columns: 1fr 1fr; }
.tab-panel { display: flex; flex-direction: column; gap: 12px; }
.panel h3 { margin: 0 0 12px; color: #05152b; font-size: 16px; }
.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin: 0; }
.kv dt { margin-bottom: 3px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.kv dd { margin: 0; color: #05152b; }
.kv dd.yes { color: #1f7a4a; font-weight: 700; }
.kv dd.no { color: #6d7686; }
.doc-row { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid #eef2f6; }
.doc-mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 10px; background: #eef2f7; color: #05152b; font-size: 12px; font-weight: 700; }
.doc-row div { flex: 1; }
.doc-row small { display: block; color: #6d7686; }
.doc-row .miss { color: #b42318; }
.quote-head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.quote-head h2 { margin: 0 0 6px; color: #05152b; }
.quote-head p { margin: 0; color: #6d7686; }
.quote-foot { justify-content: flex-end; margin-top: 14px; }
@media (max-width: 900px) {
  .stat-row, .split, .kv { grid-template-columns: 1fr; }
  .supplier-hero { flex-wrap: wrap; }
}
.supplier-review__head--detail .el-button { margin-bottom: 8px; padding-left: 0; }
.board { padding: 14px; background: #fff; border: 1px solid #e7ebf2; border-radius: 14px; }
.board__bar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.board__bar .el-input { width: 240px; }
.board__bar .el-select { width: 220px; }
.board__bar .review-filter { width: 190px; }
.board__count { color: #6d7686; font-size: 13px; }
.board :deep(.el-pagination) { justify-content: flex-end; margin-top: 12px; }
.category-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.expected-categories { align-items: center; margin: 0 0 8px; }
.expected-categories > span { width: 100%; color: #74685a; font-size: 12px; }
.phone-list { display: flex; flex-direction: column; gap: 2px; line-height: 1.45; }
.supplier-review :deep(td.phone-col .cell) { white-space: normal; overflow: visible; text-overflow: clip; }
.sku-meta { margin: 0 0 10px; color: #6d7686; font-size: 13px; }
.sku-attaches { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.sku-attaches h4 { margin: 0; font-size: 14px; }
.sku-attach { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid #eadfce; border-radius: 10px; background: #fffdf8; }
.sku-attach div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.sku-attach small { color: #74685a; font-size: 12px; }
.sku-attach span { flex: 0 0 auto; font-weight: 700; }
.order-detail { min-height: 100%; color: #05152b; }
.order-detail__hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 4px 2px 8px; }
.order-detail__eyebrow { margin-bottom: 4px; color: #7a8494; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.order-detail__title { margin: 0; color: #05152b; font-size: 28px; line-height: 1.2; }
.order-detail__booked-at { margin: 8px 0 0; color: #697386; font-size: 13px; }
.order-detail__amount { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; color: #7a8494; font-size: 12px; }
.order-detail__toolbar { display: flex; justify-content: flex-end; gap: 8px; margin: 14px 0; }
.reject-note { margin: 0 0 14px; color: #c45656; font-size: 13px; }
.snapshot-note { margin: 0 0 14px; color: #74685a; font-size: 13px; }
.order-detail__services { margin-bottom: 18px; }
.order-detail__services :deep(.el-table) { width: 100%; }
.order-detail__columns { display: grid; grid-template-columns: minmax(0, 3fr) minmax(240px, 2fr); gap: 18px; }
.order-detail__stack { display: flex; flex-direction: column; gap: 18px; }
.order-detail__panel { padding: 18px 20px; border: 1px solid #e3e8ef; border-radius: 10px; background: #fff; box-shadow: 0 3px 12px rgb(5 21 43 / 5%); }
.order-detail__panel h3 { margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid #edf0f4; color: #05152b; font-size: 16px; }
.order-detail__list { margin: 0; }
.order-detail__list > div + div { margin-top: 13px; }
.order-detail__list dt { margin-bottom: 5px; color: #8791a1; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.order-detail__list dd { margin: 0; }
.service-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.service-chips em { min-height: 30px; padding: 3px 12px; display: inline-flex; align-items: center; border-radius: 999px; background: #05152b; color: #f7f1e6; font-style: normal; font-size: 13px; font-weight: 650; }
.service-chips__empty { color: #697386; }
.doc-group + .doc-group { margin-top: 16px; }
.doc-group__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.doc-group__head span, .doc-empty, .area-text { color: #697386; font-size: 13px; }
.doc-empty, .area-text { margin: 0; }
.doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.doc-card { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; overflow: hidden; border: 1px solid #e3e8ef; border-radius: 10px; background: #f6f8fb; }
.doc-card :deep(.el-image), .doc-card__file { width: 100%; height: 96px; background: #fff; }
.doc-card :deep(.el-image) { cursor: zoom-in; }
.doc-card__file { display: grid; place-items: center; border: 0; color: #05152b; font-weight: 700; cursor: pointer; }
.doc-card figcaption { padding: 0 8px 8px; overflow: hidden; color: #526070; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 900px) {
  .order-detail__columns { grid-template-columns: 1fr; }
}
</style>

<style>
.supplier-detail-drawer .el-drawer__body { background: #f6f8fb; }
.policy-preview.el-dialog { overflow: hidden; }
.policy-preview .el-dialog__body { padding: 0 0 18px; }
.policy-preview__stage { display: grid; place-items: center; min-height: 240px; max-height: 78vh; overflow: auto; padding: 16px; background: #f3f5f8; }
.policy-preview__stage img { max-width: 100%; max-height: 72vh; object-fit: contain; background: #fff; }
.policy-preview__stage iframe { width: 100%; height: 72vh; border: 0; background: #fff; }
.policy-preview__stage p { margin: 24px; color: #526070; }
.approve-plain-confirm .el-message-box__container { display: none; }
.approve-plain-confirm .el-message-box__btns { padding-top: 0; }
</style>
