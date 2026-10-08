<template>
  <div class="supplier-demo" :class="{ 'supplier-demo--profile': section === 'profile' }">
    <header v-if="section !== 'pricing'" class="page-header">
      <div>
        <p class="page-kicker">{{ meta.description }}</p>
        <h1>{{ meta.title }}</h1>
      </div>
      <div class="page-actions">
        <el-button v-if="section === 'settlement'" :icon="Download" @click="showToast('结算明细已生成 Demo 导出任务')">导出结算</el-button>
        <el-button v-if="meta.primaryAction" type="primary" :icon="section === 'schedule' ? Plus : undefined" @click="handlePrimaryAction">
          {{ meta.primaryAction }}
        </el-button>
      </div>
    </header>

    <section v-if="section !== 'profile' && section !== 'pricing'" class="supplier-strip">
      <div class="supplier-identity">
        <div class="supplier-logo">{{ supplierInitials }}</div>
        <div>
          <div class="supplier-label">{{ t('admin.supplierOrders.signedIn') }}</div>
          <strong class="supplier-name">{{ companyForm.companyName || t('admin.supplierOrders.unnamed') }}</strong>
        </div>
      </div>
      <div class="supplier-facts">
        <div><span>{{ t('admin.supplierOrders.supplierId') }}</span><strong>{{ supplierNo || supplierRecordId || '—' }}</strong></div>
        <div><span>{{ t('admin.supplierOrders.onboarding') }}</span><el-tag :type="onboardingTagType" effect="light">{{ profileStatusLabel }}</el-tag></div>
      </div>
    </section>

    <template v-if="section === 'overview'">
      <div class="metric-grid metric-grid--overview">
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><Tickets /></span><div><small>本月完成订单</small><strong>126</strong><p class="positive">+12.5% vs last month</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--green"><Money /></span><div><small>本月收益</small><strong>AED 38,420</strong><p class="positive">+8.2% vs last month</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--amber"><Clock /></span><div><small>待结算</small><strong>AED 12,680</strong><p>预计 30 Sep 到账</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--purple"><CircleCheck /></span><div><small>服务评分</small><strong>4.86 / 5</strong><p>来自 118 条评价</p></div></article>
      </div>
      <div class="overview-grid">
        <el-card class="surface-card earnings-card" shadow="never">
          <div class="section-heading compact"><div><h2>收益趋势</h2><p>Earnings overview · AED</p></div><el-select v-model="earningRange" size="small"><el-option label="近 6 个月" value="6m" /><el-option label="今年" value="year" /></el-select></div>
          <div class="earnings-chart">
            <div v-for="bar in earningBars" :key="bar.month" class="bar-item"><span class="bar-value">{{ bar.value }}k</span><i :style="{ height: `${bar.height}%` }"></i><small>{{ bar.month }}</small></div>
          </div>
        </el-card>
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>运营概况</h2><p>Capacity & fulfilment</p></div></div>
          <div class="capacity-list">
            <div><span>可派员工</span><strong>36 / 42</strong><el-progress :percentage="86" :show-text="false" /></div>
            <div><span>并发订单容量</span><strong>8 / 12</strong><el-progress :percentage="67" :show-text="false" color="#8d5a32" /></div>
            <div><span>月订单容量</span><strong>284 / 380</strong><el-progress :percentage="75" :show-text="false" color="#c4a36a" /></div>
            <div><span>准时完成率</span><strong>96.8%</strong><el-progress :percentage="97" :show-text="false" color="#2f9c78" /></div>
          </div>
        </el-card>
      </div>
      <div class="overview-grid overview-grid--bottom">
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>最近交易</h2><p>Recent transactions</p></div><el-button link type="primary" @click="goTo('settlement')">查看全部</el-button></div>
          <div class="transaction-list"><div v-for="item in recentTransactions" :key="item.jobId"><span class="transaction-icon"><Money /></span><span><strong>{{ item.service }}</strong><small>{{ item.webOrder }} · {{ item.jobId }}</small></span><span class="transaction-amount"><strong>AED {{ item.amount }}</strong><small>{{ item.date }}</small></span></div></div>
        </el-card>
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>待处理事项</h2><p>Actions required</p></div></div>
          <div class="action-list">
            <button @click="goTo('orders')"><span class="action-badge amber">4</span><span><strong>待确认订单</strong><small>最早已等待 18 分钟</small></span><ArrowRight /></button>
            <button @click="goTo('pricing')"><span class="action-badge purple">3</span><span><strong>报价变更审核中</strong><small>审核期间继续使用当前价格</small></span><ArrowRight /></button>
            <button @click="goTo('profile')"><span class="action-badge blue">1</span><span><strong>保险文件即将到期</strong><small>2026-10-18 到期</small></span><ArrowRight /></button>
          </div>
        </el-card>
      </div>
    </template>

    <template v-else-if="section === 'profile'">
      <div class="dossier">
        <aside class="dossier-rail">
          <p>{{ t('admin.supplierProfile.kicker') }}</p>
          <strong>{{ companyForm.companyName || t('admin.supplierProfile.untitled') }}</strong>
          <em class="profile-status-pill" :class="profileStatusClass">{{ profileStatusLabel }}</em>
          <small v-if="snapshotVersion">{{ t('admin.supplierProfile.snapshotVersion', { version: snapshotVersion }) }}</small>
          <nav>
            <button
              v-for="(item, index) in profileSections"
              :key="item.id"
              type="button"
              :class="{ 'is-active': profileView === 'section' && profileSection === index }"
              @click="openProfileSection(index)"
            ><span>{{ item.num }}</span>{{ item.title }}</button>
          </nav>
          <small v-if="rejectReason">{{ t('admin.supplierProfile.rejected', { reason: rejectReason }) }}</small>
        </aside>

        <div class="profile-main">
          <div class="profile-status" :class="profileStatusClass" role="status">
            <span>{{ t('admin.supplierProfile.statusLabel') }}</span>
            <strong>{{ profileStatusLabel }}</strong>
            <p v-if="onboardingStatus === 1">{{ t('admin.supplierProfile.locked') }}</p>
            <p v-else-if="onboardingStatus === 3 && rejectReason">{{ t('admin.supplierProfile.rejected', { reason: rejectReason }) }}</p>
          </div>
          <div class="lightbox">
            <div>
              <p>{{ lightboxCrumb }}</p>
              <h2><span v-if="profileView === 'section'">{{ activeProfileSection.num }}</span>{{ lightboxTitle }}</h2>
              <small>{{ lightboxDesc }}</small>
            </div>
            <em :class="lightboxChipClass">{{ lightboxChip }}</em>
          </div>

          <div v-if="submitTried && profileIssues.length && profileView === 'section'" class="error-banner">
            <strong>{{ t('admin.supplierProfile.fixCount', { count: profileIssues.length }) }}</strong>
            <button v-for="issue in profileIssues" :key="`${issue.section}-${issue.id}`" type="button" @click="jumpProfileField(issue)">
              {{ profileSections[issue.section].num }} {{ profileSections[issue.section].title }} · {{ issue.label }}
            </button>
          </div>
          <p v-if="!profileEditable" class="review-lock">{{ t('admin.supplierProfile.locked') }}</p>

          <div class="dossier-sheet" :class="{ 'is-all': profileView === 'all' }">
            <section v-show="showProfileSection(0)">
              <header class="sec-h"><span>01</span><div><h2>{{ t('admin.supplierProfile.companyTitle') }}</h2></div><el-button v-if="profileView === 'all'" @click="openProfileSection(0)">{{ t('admin.supplierProfile.editSection') }}</el-button></header>
              <div class="dossier-grid">
                <label id="profile-field-companyName" class="profile-field span-2" :class="{ error: issueOf('companyName') }">
                  <span>{{ t('admin.supplierProfile.companyName') }} <i>*</i></span>
                  <el-input v-model="companyForm.companyName" :disabled="profileReadOnly" />
                  <small v-if="issueOf('companyName')">{{ issueOf('companyName') }}</small>
                </label>
                <label id="profile-field-licenseNo" class="profile-field" :class="{ error: issueOf('licenseNo') }">
                  <span>{{ t('admin.supplierProfile.licenseNo') }} <i>*</i></span>
                  <el-input v-model="companyForm.licenseNo" :disabled="profileReadOnly" />
                  <small v-if="issueOf('licenseNo')">{{ issueOf('licenseNo') }}</small>
                </label>
                <label id="profile-field-licenseIssuedBy" class="profile-field" :class="{ error: issueOf('licenseIssuedBy') || issueOf('licenseIssuedByOther') }">
                  <span>{{ t('admin.supplierProfile.licenseIssuedBy') }} <i>*</i></span>
                  <el-select v-model="companyForm.licenseIssuedBy" filterable :disabled="profileReadOnly" :placeholder="t('admin.supplierProfile.licenseIssuedByPlaceholder')" @change="onLicenseAuthorityChange">
                    <el-option-group v-for="group in licenseAuthorities" :key="group.emirate" :label="group.emirate">
                      <el-option v-for="item in group.items" :key="item" :label="item" :value="item" />
                    </el-option-group>
                  </el-select>
                  <el-input
                    v-if="companyForm.licenseIssuedBy === LICENSE_AUTHORITY_OTHER"
                    id="profile-field-licenseIssuedByOther"
                    v-model="companyForm.licenseIssuedByOther"
                    :disabled="profileReadOnly"
                    :placeholder="t('admin.supplierProfile.licenseIssuedByOtherPlaceholder')"
                  />
                  <small v-if="issueOf('licenseIssuedBy')">{{ issueOf('licenseIssuedBy') }}</small>
                  <small v-if="issueOf('licenseIssuedByOther')">{{ issueOf('licenseIssuedByOther') }}</small>
                </label>
                <label id="profile-field-licenseExpiry" class="profile-field" :class="{ error: issueOf('licenseExpiry') }">
                  <span>{{ t('admin.supplierProfile.licenseExpiry') }} <i>*</i></span>
                  <el-date-picker v-model="companyForm.licenseExpiry" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" :disabled="profileReadOnly" :disabled-date="disableLicenseDate" />
                  <small v-if="issueOf('licenseExpiry')">{{ issueOf('licenseExpiry') }}</small>
                </label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.vat') }}</span><el-input v-model="companyForm.trn" :disabled="profileReadOnly" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.years') }}</span><input class="plain-count" :value="wholeText(companyForm.years)" inputmode="numeric" :disabled="profileReadOnly" @input="companyForm.years = wholeOrZero(($event.target as HTMLInputElement).value)" /></label>
                <label id="profile-field-address" class="profile-field span-2" :class="{ error: issueOf('address') }">
                  <span>{{ t('admin.supplierProfile.address') }} <i>*</i></span>
                  <el-input v-model="companyForm.address" :disabled="profileReadOnly" />
                  <small v-if="issueOf('address')">{{ issueOf('address') }}</small>
                </label>
              </div>
            </section>

            <section v-show="showProfileSection(1)">
              <header class="sec-h"><span>02</span><div><h2>{{ t('admin.supplierProfile.contactTitle') }}</h2></div><el-button v-if="profileView === 'all'" @click="openProfileSection(1)">{{ t('admin.supplierProfile.editSection') }}</el-button></header>
              <div class="dossier-grid">
                <label id="profile-field-contact" class="profile-field" :class="{ error: issueOf('contact') }">
                  <span>{{ t('admin.supplierProfile.contactPerson') }} <i>*</i></span>
                  <el-input v-model="companyForm.contact" :disabled="profileReadOnly" />
                  <small v-if="issueOf('contact')">{{ issueOf('contact') }}</small>
                </label>
                <label id="profile-field-email" class="profile-field" :class="{ error: issueOf('email') }">
                  <span>{{ t('admin.supplierProfile.email') }} <i>*</i></span>
                  <el-input v-model="companyForm.email" :disabled="profileReadOnly" />
                  <small v-if="issueOf('email')">{{ issueOf('email') }}</small>
                </label>
                <label id="profile-field-mobile" class="profile-field phone-field" :class="{ error: issueOf('mobile') }">
                  <span>{{ t('admin.supplierProfile.mobile') }} <i>*</i></span>
                  <el-input v-model="companyForm.mobile" maxlength="15" inputmode="numeric" :disabled="profileReadOnly" :placeholder="t('admin.supplierProfile.phonePlaceholder')">
                    <template #prepend>
                      <el-select v-model="companyForm.mobileCode" class="dial-prepend" :disabled="profileReadOnly">
                        <el-option v-for="item in PHONE_DIAL_OPTIONS" :key="item.value" :label="item.value" :value="item.value">{{ phoneDialLabel(item, locale) }}</el-option>
                      </el-select>
                    </template>
                  </el-input>
                  <small v-if="issueOf('mobile')">{{ issueOf('mobile') }}</small>
                </label>
                <div id="profile-field-whatsapp" class="profile-field phone-field" :class="{ error: issueOf('whatsapp') }">
                  <span>{{ t('admin.supplierProfile.whatsapp') }} <i>*</i></span>
                  <el-input v-model="companyForm.whatsapp" maxlength="15" inputmode="numeric" :disabled="profileReadOnly || whatsappSame" :placeholder="t('admin.supplierProfile.phonePlaceholder')">
                    <template #prepend>
                      <el-select v-model="companyForm.whatsappCode" class="dial-prepend" :disabled="profileReadOnly || whatsappSame">
                        <el-option v-for="item in PHONE_DIAL_OPTIONS" :key="`wa-${item.value}`" :label="item.value" :value="item.value">{{ phoneDialLabel(item, locale) }}</el-option>
                      </el-select>
                    </template>
                  </el-input>
                  <label class="same-line">
                    <input v-model="whatsappSame" type="checkbox" :disabled="profileReadOnly" @change="syncWhatsapp" />
                    <span>{{ t('admin.supplierProfile.sameAsMobile') }}</span>
                  </label>
                  <small v-if="issueOf('whatsapp')">{{ issueOf('whatsapp') }}</small>
                </div>
              </div>
            </section>

            <section v-show="showProfileSection(2)">
              <header class="sec-h"><span>03</span><div><h2>{{ t('admin.supplierProfile.capacityTitle') }}</h2></div><el-button v-if="profileView === 'all'" @click="openProfileSection(2)">{{ t('admin.supplierProfile.editSection') }}</el-button></header>
              <div class="service-pills">
                <strong>{{ t('admin.supplierProfile.yourServices') }}</strong>
                <div>
                  <span v-for="name in selectedServiceNames" :key="name">{{ name }}</span>
                  <em v-if="!selectedServiceNames.length">{{ t('admin.supplierProfile.noSelectedServices') }}</em>
                </div>
                <p>{{ t('admin.supplierProfile.servicesFromPricing') }}</p>
              </div>
              <div class="dossier-grid align-fields">
                <label class="profile-field"><span>{{ t('admin.supplierProfile.workers') }}</span><input class="plain-count" :value="wholeText(capacityForm.workers)" inputmode="numeric" :disabled="profileReadOnly" @input="capacityForm.workers = wholeOrZero(($event.target as HTMLInputElement).value)" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.concurrent') }}</span><input class="plain-count" :value="wholeText(capacityForm.concurrent)" inputmode="numeric" :disabled="profileReadOnly" @input="capacityForm.concurrent = wholeOrZero(($event.target as HTMLInputElement).value)" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.monthly') }}</span><input class="plain-count" :value="wholeText(capacityForm.monthly)" inputmode="numeric" :disabled="profileReadOnly" @input="capacityForm.monthly = wholeOrZero(($event.target as HTMLInputElement).value)" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.leadTime') }}</span><input class="plain-count" :value="wholeText(capacityForm.leadTime)" inputmode="numeric" :disabled="profileReadOnly" @input="capacityForm.leadTime = wholeOrZero(($event.target as HTMLInputElement).value)" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.workStart') }}</span><el-time-select v-model="capacityForm.start" start="06:00" step="00:30" end="12:00" :disabled="profileReadOnly" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.workEnd') }}</span><el-time-select v-model="capacityForm.end" start="14:00" step="00:30" end="23:30" :disabled="profileReadOnly" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.femaleStaff') }}</span><input class="plain-count" :value="wholeText(femaleStaffCount)" inputmode="numeric" :disabled="profileReadOnly" @input="femaleStaffCount = wholeOrZero(($event.target as HTMLInputElement).value)" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.maleStaff') }}</span><input class="plain-count" :value="wholeText(maleStaffCount)" inputmode="numeric" :disabled="profileReadOnly" @input="maleStaffCount = wholeOrZero(($event.target as HTMLInputElement).value)" /></label>
              </div>
              <div class="dossier-toggles">
                <template v-for="item in capacityToggles" :key="item.key">
                  <label v-if="item.key !== 'weekend'">
                    <span><strong>{{ t(`admin.supplierProfile.${item.key}`) }}</strong></span>
                    <el-switch :model-value="item.enabled" :disabled="profileReadOnly" @change="(value: boolean) => onCapacityToggle(item.key, value)" />
                  </label>
                </template>
                <label><span><strong>{{ t('admin.supplierProfile.ownVehicle') }}</strong></span><el-switch v-model="ownTransportation" :disabled="profileReadOnly" /></label>
                <label><span><strong>{{ t('admin.supplierProfile.ownEquipment') }}</strong></span><el-switch v-model="complianceItems[3].enabled" :disabled="profileReadOnly" /></label>
                <label><span><strong>{{ t('admin.supplierProfile.taxInvoice') }}</strong></span><el-switch v-model="complianceItems[2].enabled" :disabled="profileReadOnly" /></label>
                <label><span><strong>{{ t('admin.supplierProfile.emaar') }}</strong></span>
                  <el-radio-group v-model="emaarOnboarded" :disabled="profileReadOnly">
                    <el-radio-button :value="1">{{ t('admin.supplierProfile.yes') }}</el-radio-button>
                    <el-radio-button :value="0">{{ t('admin.supplierProfile.no') }}</el-radio-button>
                  </el-radio-group>
                </label>
                <label><span><strong>{{ t('admin.supplierProfile.otherCommunity') }}</strong></span>
                  <el-radio-group v-model="otherCommunityOnboarded" :disabled="profileReadOnly" @change="onOtherCommunityChange">
                    <el-radio-button :value="1">{{ t('admin.supplierProfile.yes') }}</el-radio-button>
                    <el-radio-button :value="0">{{ t('admin.supplierProfile.no') }}</el-radio-button>
                  </el-radio-group>
                </label>
              </div>
              <label v-if="asYesNo(otherCommunityOnboarded) === 1" id="profile-field-communities" class="profile-field" :class="{ error: issueOf('communities') }">
                <span>{{ t('admin.supplierProfile.applyRenmark') }} <i>*</i></span>
                <el-input v-model="applyRenmark" type="textarea" :rows="3" maxlength="512" show-word-limit :disabled="profileReadOnly" />
                <small v-if="issueOf('communities')">{{ issueOf('communities') }}</small>
              </label>
            </section>

            <section v-show="showProfileSection(3)">
              <header class="sec-h"><span>04</span><div><h2>{{ t('admin.supplierProfile.bankTitle') }}</h2></div><el-button v-if="profileView === 'all'" @click="openProfileSection(3)">{{ t('admin.supplierProfile.editSection') }}</el-button></header>
              <div class="dossier-grid">
                <label class="profile-field"><span>{{ t('admin.supplierProfile.accountName') }}</span><el-input v-model="bankForm.accountName" :disabled="profileReadOnly" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.bankName') }}</span><el-input v-model="bankForm.bankName" :disabled="profileReadOnly" /></label>
                <label class="profile-field span-2"><span>{{ t('admin.supplierProfile.iban') }}</span><el-input v-model="bankForm.iban" :disabled="profileReadOnly" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.swift') }}</span><el-input v-model="bankForm.swift" :disabled="profileReadOnly" /></label>
                <label class="profile-field"><span>{{ t('admin.supplierProfile.currency') }}</span><el-select v-model="bankForm.currency" :disabled="profileReadOnly"><el-option label="AED" value="AED" /></el-select></label>
              </div>
            </section>

            <section v-show="showProfileSection(4)">
              <header class="sec-h"><span>05</span><div><h2>{{ t('admin.supplierProfile.documentsTitle') }}</h2></div><el-button v-if="profileView === 'all'" @click="openProfileSection(4)">{{ t('admin.supplierProfile.editSection') }}</el-button></header>
              <div id="profile-field-tradeLicense" class="doc-row" :class="{ error: issueOf('tradeLicense') }">
                <div>
                  <strong>{{ t('admin.supplierProfile.tradeLicenseFile') }} <i>*</i></strong>
                  <p v-for="(url, index) in tradeLicenseFiles" :key="`trade-${url}-${index}`">
                    <button type="button" @click="openFilePreview(url)">{{ fileNameFromUrl(url) }}</button>
                    <button v-if="!profileReadOnly" type="button" class="is-remove" @click="removeDocFile('trade', index)">{{ t('admin.supplierProfile.remove') }}</button>
                  </p>
                  <small v-if="!tradeLicenseFiles.length">{{ t('admin.supplierProfile.notUploaded') }}</small>
                  <small v-if="issueOf('tradeLicense')" class="err">{{ issueOf('tradeLicense') }}</small>
                </div>
                <el-upload v-if="!profileReadOnly" :show-file-list="false" :http-request="(options) => uploadDocFile('trade', options)">
                  <el-button>{{ tradeLicenseFiles.length ? t('admin.supplierProfile.replaceFile') : t('admin.supplierProfile.upload') }}</el-button>
                </el-upload>
              </div>
              <div v-for="doc in insuranceDocs" :key="doc.id" class="doc-row">
                <div>
                  <strong>{{ doc.label }}</strong>
                  <p v-for="(url, index) in doc.files" :key="`${doc.id}-${url}-${index}`">
                    <button type="button" @click="openFilePreview(url)">{{ fileNameFromUrl(url) }}</button>
                    <button v-if="!profileReadOnly" type="button" class="is-remove" @click="removeDocFile(doc.id, index)">{{ t('admin.supplierProfile.remove') }}</button>
                  </p>
                  <small v-if="!doc.files.length">{{ t('admin.supplierProfile.notUploaded') }}</small>
                </div>
                <el-upload v-if="!profileReadOnly" :show-file-list="false" :http-request="(options) => uploadDocFile(doc.id, options)">
                  <el-button>{{ doc.files.length ? t('admin.supplierProfile.replaceFile') : t('admin.supplierProfile.upload') }}</el-button>
                </el-upload>
              </div>
              <div class="doc-row">
                <div>
                  <strong>{{ t('admin.supplierProfile.otherDocuments') }}</strong>
                  <p v-for="(url, index) in otherDocumentFiles" :key="`other-${url}-${index}`">
                    <button type="button" @click="openFilePreview(url)">{{ fileNameFromUrl(url) }}</button>
                    <button v-if="!profileReadOnly" type="button" class="is-remove" @click="removeDocFile('other', index)">{{ t('admin.supplierProfile.remove') }}</button>
                  </p>
                  <small v-if="!otherDocumentFiles.length">{{ t('admin.supplierProfile.notUploaded') }}</small>
                </div>
                <el-upload v-if="!profileReadOnly" :show-file-list="false" :http-request="(options) => uploadDocFile('other', options)">
                  <el-button>{{ otherDocumentFiles.length ? t('admin.supplierProfile.replaceFile') : t('admin.supplierProfile.upload') }}</el-button>
                </el-upload>
              </div>
            </section>
          </div>

          <footer v-if="profileView === 'section'" class="profile-footer">
            <div>
              <el-button v-if="profileFromAll" @click="backToFullProfile">{{ t('admin.supplierProfile.backToProfile') }}</el-button>
              <el-button v-else-if="profileSection > 0" @click="moveProfileSection(-1)">{{ t('admin.supplierProfile.previous') }}</el-button>
            </div>
            <div>
              <el-button v-if="profileEditable && !needsResubmit" :loading="saving" @click="saveProfile(0)">{{ t('admin.supplierProfile.saveDraft') }}</el-button>
              <el-button v-if="!profileFromAll && profileSection < 4" type="primary" @click="moveProfileSection(1)">{{ t('admin.supplierProfile.next') }}</el-button>
              <el-button v-if="profileFromAll || profileSection === 4" type="primary" :loading="saving" @click="submitProfileForm">
                {{ needsResubmit || profileFromAll ? t('admin.supplierProfile.resubmit') : t('admin.supplierProfile.submitReview') }}
              </el-button>
            </div>
          </footer>
        </div>
      </div>
    </template>

    <template v-else-if="section === 'service-area'">
      <section v-if="areaSelectionEmpty" class="area-alert">
        <strong>{{ t('admin.supplierArea.noneTitle') }}</strong>
        <p>{{ t('admin.supplierArea.noneBody') }}</p>
      </section>
      <section class="area-note">
        <strong>{{ t('admin.supplierArea.bannerTitle') }}</strong>
        <p>{{ t('admin.supplierArea.bannerBody') }}</p>
      </section>
      <section class="area-board" v-loading="editorLoading && !areaCatalogReady">
        <header>
          <span>{{ coverageSummary(coverageRows.length, coveredCommunityCount) }}</span>
        </header>
        <table>
          <thead>
            <tr>
              <th>{{ t('admin.supplierArea.area') }}</th>
              <th>{{ t('admin.supplierArea.coverage') }}</th>
              <th>{{ t('admin.supplierArea.included') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="areaCatalogReady && !coverageRows.length">
              <td colspan="3">{{ t('admin.supplierArea.empty') }}</td>
            </tr>
            <tr v-for="row in coverageRows" :key="row.id">
              <td><strong>{{ row.name }}</strong></td>
              <td>{{ coverageLabel(row) }}</td>
              <td>
                <p v-if="!row.communities.length">{{ t('admin.supplierArea.zoneOnly') }}</p>
                <p v-else-if="row.picked.length === row.communities.length" class="area-all">{{ t('admin.supplierArea.allIncluded') }}</p>
                <div v-else class="zone-list">
                  <span v-for="community in row.picked" :key="community.id">{{ community.name }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <el-dialog v-model="areaEditorVisible" class="supplier-form-dialog area-manage-dialog" :title="t('admin.supplierArea.dialogTitle')" width="min(820px, calc(100vw - 32px))" :close-on-click-modal="false" append-to-body>
        <div class="area-manage-tools">
          <el-input v-model="areaKeyword" :prefix-icon="Search" clearable :placeholder="t('admin.supplierArea.searchPlaceholder')" />
          <div>
            <el-button @click="selectAllAreas">{{ t('admin.supplierArea.selectAll') }}</el-button>
            <el-button @click="clearAllAreas">{{ t('admin.supplierArea.clearAll') }}</el-button>
          </div>
        </div>
        <p class="area-manage-note">{{ t('admin.supplierArea.searchNote') }}</p>
        <div v-loading="editorLoading" class="area-zone-list">
          <article v-for="area in editorZones" :key="area.id" class="area-zone" :class="{ 'is-open': expandedAreaIds.includes(area.id) }">
            <header>
              <input
                :ref="(el) => bindZoneBox(el as Element | null, area.id)"
                type="checkbox"
                :checked="zoneMode(area.id) === 'all'"
                @change="toggleZone(area.id)"
              />
              <button type="button" @click="toggleExpanded(area.id)">
                <strong>
                  <template v-for="(part, index) in highlight(area.name)" :key="`${area.id}-${index}`">
                    <mark v-if="part.hit">{{ part.text }}</mark><template v-else>{{ part.text }}</template>
                  </template>
                </strong>
                <small>{{ t('admin.supplierArea.communityCount', { count: (communitiesByArea[area.id] || []).length }) }}</small>
              </button>
              <button type="button" class="area-zone__chevron" :aria-expanded="expandedAreaIds.includes(area.id)" @click="toggleExpanded(area.id)">
                {{ expandedAreaIds.includes(area.id) ? '▾' : '▸' }}
              </button>
            </header>
            <div v-if="expandedAreaIds.includes(area.id)" class="area-communities">
              <p v-if="!(communitiesByArea[area.id] || []).length">{{ t('admin.supplierArea.noCommunities') }}</p>
              <label
                v-for="community in communitiesByArea[area.id] || []"
                :key="community.id"
                :class="{ 'is-dim': communityDim(area.name, community.name) }"
              >
                <input
                  type="checkbox"
                  :checked="draftCommunityIds.includes(community.id)"
                  @change="onCommunityToggle(community.id, $event)"
                />
                <span>
                  <template v-for="(part, index) in highlight(community.name)" :key="`${community.id}-${index}`">
                    <mark v-if="part.hit">{{ part.text }}</mark><template v-else>{{ part.text }}</template>
                  </template>
                </span>
              </label>
            </div>
          </article>
          <p v-if="!editorLoading && !editorZones.length" class="policy-empty">{{ t('admin.supplierArea.noAreas') }}</p>
        </div>
        <template #footer>
          <div class="area-dialog-foot">
            <span>{{ t('admin.supplierArea.selectedSummary', { summary: coverageSummary(draftSummary.areas, draftSummary.communities) }) }}</span>
            <div>
              <el-button @click="areaEditorVisible = false">{{ t('admin.supplierArea.cancel') }}</el-button>
              <el-button type="primary" :loading="saving" @click="saveAreas">{{ t('admin.supplierArea.save') }}</el-button>
            </div>
          </div>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="section === 'staff'">
      <div class="metric-grid">
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><UserFilled /></span><div><small>员工总数</small><strong>42</strong><p>36 active today</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--green"><CircleCheck /></span><div><small>资料已验证</small><strong>35</strong><p>83% verified</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--amber"><Warning /></span><div><small>证件即将到期</small><strong>5</strong><p>Within 30 days</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--purple"><Calendar /></span><div><small>今日可派</small><strong>28</strong><p>6 already assigned</p></div></article>
      </div>
      <el-card class="surface-card" shadow="never">
        <div class="table-toolbar">
          <div class="table-search">
            <el-input v-model="staffKeyword" :prefix-icon="Search" placeholder="搜索姓名、手机号或员工编号" clearable />
            <el-select v-model="staffSkill" placeholder="全部技能" clearable><el-option v-for="skill in staffSkills" :key="skill" :label="skill" :value="skill" /></el-select>
            <el-select v-model="staffStatus" placeholder="全部状态" clearable><el-option label="可派" value="available" /><el-option label="服务中" value="busy" /><el-option label="休假" value="leave" /></el-select>
          </div>
          <div class="result-count">{{ filteredStaff.length }} 位员工</div>
        </div>
        <el-table :data="filteredStaff" class="data-table" row-key="id">
          <el-table-column label="员工" min-width="210">
            <template #default="{ row }"><div class="person-cell"><el-avatar :size="38" :style="{ background: row.color }">{{ initials(row.name) }}</el-avatar><span><strong>{{ row.name }}</strong><small>{{ row.id }} · {{ row.gender }}</small></span></div></template>
          </el-table-column>
          <el-table-column label="角色" min-width="135"><template #default="{ row }"><div class="muted-stack"><strong>{{ row.role }}</strong><small>{{ row.employment }}</small></div></template></el-table-column>
          <el-table-column label="技能 / Services" min-width="240">
            <template #default="{ row }"><div class="tag-list"><el-tag v-for="skill in row.skills" :key="skill" size="small" effect="plain">{{ skill }}</el-tag></div></template>
          </el-table-column>
          <el-table-column label="联系方式" min-width="160"><template #default="{ row }"><div class="muted-stack"><span>{{ row.mobile }}</span><small>{{ row.language }}</small></div></template></el-table-column>
          <el-table-column label="默认工作时间" min-width="175"><template #default="{ row }"><div class="muted-stack"><span>{{ row.workingDays }}</span><small>{{ row.workingHours }}</small></div></template></el-table-column>
          <el-table-column label="覆盖区域" min-width="150"><template #default="{ row }"><div class="zone-list"><span v-for="zone in row.zones" :key="zone">{{ zone }}</span></div></template></el-table-column>
          <el-table-column label="证件" width="96"><template #default="{ row }"><el-tag :type="row.docs === 'Verified' ? 'success' : 'warning'" effect="light">{{ row.docs === 'Verified' ? '已验证' : '即将到期' }}</el-tag></template></el-table-column>
          <el-table-column label="今日状态" width="96"><template #default="{ row }"><span class="status-pill" :class="`status-pill--${row.status}`"><i></i>{{ staffStatusLabel(row.status) }}</span></template></el-table-column>
          <el-table-column label="操作" width="96" align="right"><template #default="{ row }"><el-button link type="primary" @click="showToast(`打开 ${row.name} 的人员档案`)">查看</el-button></template></el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'schedule'">
      <section class="review-banner schedule-review"><span><Clock /></span><div><strong>2 个排班动作待处理</strong><p>1 个休假申请和 1 个时间冲突需要确认。</p></div><el-button size="small" @click="showToast('已打开待处理排班动作')">查看</el-button></section>
      <div class="schedule-toolbar">
        <div class="week-navigation">
          <el-button circle :icon="ArrowLeft" @click="showToast('已切换到上一周')" />
          <div><strong>2026年9月21日 – 9月27日</strong><span>Asia/Dubai · GST</span></div>
          <el-button circle :icon="ArrowRight" @click="showToast('已切换到下一周')" />
          <el-button @click="showToast('已返回本周')">本周</el-button>
        </div>
        <div class="schedule-filters"><el-radio-group v-model="scheduleView" size="small"><el-radio-button value="day">日</el-radio-button><el-radio-button value="week">周</el-radio-button></el-radio-group><el-select v-model="scheduleSkill"><el-option label="全部服务" value="all" /><el-option label="Cleaning" value="Cleaning" /><el-option label="AC Service" value="AC Service" /></el-select><el-button :icon="Plus" type="primary" @click="shiftDialogVisible = true">添加班次 / Block</el-button></div>
      </div>
      <div class="metric-grid metric-grid--schedule">
        <article class="mini-metric"><span>本周可用工时</span><strong>1,284h</strong><small class="positive">+8.2% vs last week</small></article>
        <article class="mini-metric"><span>已分配工时</span><strong>936h</strong><small>72.9% utilization</small></article>
        <article class="mini-metric"><span>未覆盖班次</span><strong>7</strong><small class="warning-text">需要安排人员</small></article>
        <article class="mini-metric"><span>休假申请</span><strong>4</strong><small>2 pending approval</small></article>
      </div>
      <el-card class="surface-card schedule-card" shadow="never">
        <div class="schedule-grid schedule-grid--header">
          <div class="staff-column-title">人员 / Staff</div>
          <div v-for="day in weekDays" :key="day.key" class="day-head" :class="{ today: day.today }"><span>{{ day.weekday }}</span><strong>{{ day.date }}</strong><small>{{ day.orders }} orders</small></div>
        </div>
        <div v-for="person in schedulePeople" :key="person.id" class="schedule-grid schedule-row">
          <div class="schedule-person"><el-avatar :size="34" :style="{ background: person.color }">{{ initials(person.name) }}</el-avatar><span><strong>{{ person.name }}</strong><small>{{ person.skill }}</small></span></div>
          <button v-for="day in weekDays" :key="day.key" type="button" class="shift-cell" :class="shiftFor(person.id, day.key).type" @click="openShift(person, day)">
            <template v-if="shiftFor(person.id, day.key).label"><strong>{{ shiftFor(person.id, day.key).label }}</strong><span>{{ shiftFor(person.id, day.key).time }}</span><small>{{ shiftFor(person.id, day.key).orders }}</small></template>
            <template v-else><span class="add-shift">+</span><small>添加班次</small></template>
          </button>
        </div>
        <div class="schedule-legend"><span><i class="shift-standard"></i>正常班次</span><span><i class="shift-busy"></i>订单较满</span><span><i class="shift-leave"></i>休假 / 不可用</span><span><i class="shift-open"></i>未排班</span></div>
      </el-card>
    </template>

    <template v-else-if="section === 'orders'">
      <section class="orders-command" aria-labelledby="orders-command-title">
        <div class="orders-command__copy">
          <span>{{ t('admin.supplierOrders.assignedOrder') }}</span>
          <h2 id="orders-command-title">{{ t('admin.supplierOrders.queueTitle') }}</h2>
          <p>{{ t('admin.supplierOrders.queueHint') }}</p>
        </div>
        <div class="orders-command__metrics">
          <article>
            <span>{{ t('admin.supplierOrders.visibleNow') }}</span>
            <strong>{{ visibleOrderCount }}</strong>
            <small>{{ orderPageRange }}</small>
          </article>
          <article>
            <span>{{ t('admin.supplierOrders.activeNow') }}</span>
            <strong>{{ activeOrdersOnPage }}</strong>
            <small>{{ t('admin.supplierOrders.serviceStatus') }}</small>
          </article>
          <article>
            <span>{{ t('admin.supplierOrders.completedNow') }}</span>
            <strong>{{ completedOrdersOnPage }}</strong>
            <small>{{ t('admin.supplierOrders.visibleNow') }}</small>
          </article>
        </div>
      </section>

      <el-card class="surface-card orders-card" shadow="never" v-loading="orderLoading">
        <div class="order-toolbar">
          <div class="order-toolbar__head">
            <div>
              <strong>{{ t('admin.supplierOrders.queueTitle') }}</strong>
              <span>{{ t('admin.supplierOrders.count', { count: orderTotal }) }}</span>
            </div>
            <el-button v-if="hasOrderFilters" link @click="resetOrderFilters">{{ t('admin.supplierOrders.resetFilters') }}</el-button>
          </div>
          <div class="order-filters">
            <label class="order-filter">
              <span>{{ t('admin.supplierOrders.orderNo') }}</span>
              <el-input v-model.trim="orderKeyword" :prefix-icon="Search" :placeholder="t('admin.supplierOrders.searchOrder')" clearable @keyup.enter="searchOrders" @clear="searchOrders" />
            </label>
            <label class="order-filter">
              <span>{{ t('admin.supplierOrders.serviceName') }}</span>
              <el-input v-model.trim="orderServiceKeyword" :placeholder="t('admin.supplierOrders.searchService')" clearable @keyup.enter="searchOrders" @clear="searchOrders" />
            </label>
            <label class="order-filter">
              <span>{{ t('admin.supplierOrders.searchCategory') }}</span>
              <el-select v-model="orderCategory" filterable clearable :placeholder="t('admin.supplierOrders.searchCategory')" @change="searchOrders">
                <el-option v-for="category in orderCategoryOptions" :key="category.id" :label="category.label" :value="category.id" />
              </el-select>
            </label>
            <label class="order-filter order-filter--date">
              <span>{{ t('admin.supplierOrders.serviceTime') }}</span>
              <el-date-picker
                v-model="orderDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                :start-placeholder="t('admin.supplierOrders.dateStart')"
                :end-placeholder="t('admin.supplierOrders.dateEnd')"
                clearable
                @change="searchOrders"
              />
            </label>
            <el-button class="order-search" type="primary" :icon="Search" @click="searchOrders">{{ t('admin.supplierOrders.search') }}</el-button>
          </div>
        </div>
        <div class="orders-table-shell">
          <el-table :data="supplierOrders" class="data-table orders-table" row-key="orderId" :empty-text="t('admin.supplierOrders.empty')">
            <el-table-column :label="t('admin.supplierOrders.orderNo')" min-width="154">
              <template #default="{ row }">
                <button type="button" class="order-no" @click="openAssignedOrder(row)">{{ row.orderNo || '—' }}</button>
              </template>
            </el-table-column>
            <el-table-column class-name="order-wrap" :label="t('admin.supplierOrders.serviceName')" min-width="220">
              <template #default="{ row }">
                <div class="order-cell">
                  <strong>{{ orderServiceTitle(row) }}</strong>
                  <small v-if="orderSpecText(row) !== '—'" class="order-clamp">{{ orderSpecText(row) }}</small>
                  <small v-if="orderAddonBrief(row)" class="order-clamp">{{ orderAddonBrief(row) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column class-name="order-wrap" :label="t('admin.supplierOrders.serviceTime')" min-width="172">
              <template #default="{ row }">
                <div class="order-cell">
                  <strong>{{ row.serviceDate || '—' }}</strong>
                  <small v-if="orderStartTime(row.serviceTime)">{{ orderStartTime(row.serviceTime) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column class-name="order-wrap" :label="t('admin.supplierOrders.address')" min-width="220">
              <template #default="{ row }">
                <div class="order-cell">
                  <span class="order-clamp">{{ row.serviceAddress || '—' }}</span>
                  <small v-if="row.additionalNotes" class="order-clamp">{{ t('admin.supplierOrders.additionalNotes') }}: {{ row.additionalNotes }}</small>
                  <a v-if="row.pinLocation" class="order-pin" :href="row.pinLocation" target="_blank" rel="noopener noreferrer" @click.stop>{{ t('admin.supplierOrders.openMap') }}</a>
                </div>
              </template>
            </el-table-column>
            <el-table-column class-name="order-wrap" :label="t('admin.supplierOrders.customerRemark')" min-width="180">
              <template #default="{ row }">
                <div class="order-cell">
                  <span class="order-clamp order-remark-text">{{ row.remark || '—' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column class-name="order-wrap" :label="t('admin.supplierOrders.price')" width="126" align="right">
              <template #default="{ row }">
                <div class="order-cell order-cell--end">
                  <strong class="money-value"><small>AED</small>{{ orderMoney(row.quotePrice) }}</strong>
                  <small v-if="row.quoteMode != null">{{ orderQuoteMode(row) }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column class-name="order-status-col" :label="t('admin.supplierOrders.serviceStatus')" width="178">
              <template #default="{ row }">
                <el-tag :type="serviceStatusTag(row.serviceStatus)" effect="light">{{ serviceStatusText(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('admin.supplierOrders.detail')" width="188" align="right">
              <template #default="{ row }">
                <div class="order-row-actions">
                  <el-button link @click="openAssignedOrder(row)">{{ t('admin.supplierOrders.viewDetail') }}</el-button>
                  <el-button v-if="serviceStep(row) === 0" link type="primary" @click="departForService(row)">{{ t('admin.supplierOrders.departAction') }}</el-button>
                  <el-button v-else-if="serviceStep(row) === 3" link type="primary" @click="openServiceAction(row, 'arrive')">{{ t('admin.supplierOrders.arriveAction') }}</el-button>
                  <el-button v-else-if="serviceStep(row) === 1" link type="primary" @click="openServiceAction(row, 'complete')">{{ t('admin.supplierOrders.completeAction') }}</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="orders-mobile" :aria-label="t('admin.supplierOrders.queueTitle')">
          <article v-for="row in supplierOrders" :key="`mobile-${row.orderId}`" class="order-mobile-card">
            <header>
              <button type="button" class="order-no" @click="openAssignedOrder(row)">{{ row.orderNo || '—' }}</button>
              <el-tag :type="serviceStatusTag(row.serviceStatus)" effect="light">{{ serviceStatusText(row) }}</el-tag>
            </header>
            <h3>{{ orderServiceTitle(row) }}</h3>
            <p v-if="orderSpecText(row) !== '—'">{{ orderSpecText(row) }}</p>
            <dl>
              <div><dt>{{ t('admin.supplierOrders.serviceTime') }}</dt><dd>{{ orderWhen(row) }}</dd></div>
              <div><dt>{{ t('admin.supplierOrders.price') }}</dt><dd>AED {{ orderMoney(row.quotePrice) }}</dd></div>
              <div class="is-wide"><dt>{{ t('admin.supplierOrders.address') }}</dt><dd>{{ row.serviceAddress || '—' }}</dd></div>
              <div v-if="row.additionalNotes" class="is-wide"><dt>{{ t('admin.supplierOrders.additionalNotes') }}</dt><dd>{{ row.additionalNotes }}</dd></div>
              <div class="is-wide"><dt>{{ t('admin.supplierOrders.customerRemark') }}</dt><dd>{{ row.remark || '—' }}</dd></div>
            </dl>
            <footer>
              <el-button @click="openAssignedOrder(row)">{{ t('admin.supplierOrders.viewDetail') }}</el-button>
              <el-button v-if="serviceStep(row) === 0" type="primary" @click="departForService(row)">{{ t('admin.supplierOrders.departAction') }}</el-button>
              <el-button v-else-if="serviceStep(row) === 3" type="primary" @click="openServiceAction(row, 'arrive')">{{ t('admin.supplierOrders.arriveAction') }}</el-button>
              <el-button v-else-if="serviceStep(row) === 1" type="primary" @click="openServiceAction(row, 'complete')">{{ t('admin.supplierOrders.completeAction') }}</el-button>
            </footer>
          </article>
          <el-empty v-if="!orderLoading && !supplierOrders.length" :description="t('admin.supplierOrders.empty')" />
        </div>
        <div class="order-pager">
          <el-pagination
            layout="prev, pager, next"
            :current-page="orderPage"
            :page-size="10"
            :total="orderTotal"
            @current-change="changeOrderPage"
          />
        </div>
      </el-card>
    </template>

    <template v-else-if="section === 'availability'">
      <SupplierAvailability
        :enabled="supplierEnabled"
        :accept-dispatch="supplierAcceptDispatch"
        :dispatch-saving="dispatchSaving"
        :can-toggle="Boolean(supplierRecordId)"
        :start="capacityForm.start"
        :end="capacityForm.end"
        :concurrent="capacityForm.concurrent"
        :saturday="capacityToggles[1].enabled"
        :sunday="capacityToggles[2].enabled"
        :saving="saving"
        :services="availabilityServices"
        :areas="availabilityAreas"
        @save-hours="saveAvailabilityHours"
        @toggle-dispatch="toggleAcceptDispatch"
      />
    </template>

    <template v-else-if="section === 'pricing'">
      <div v-if="!quoteDialog.visible" class="sv-page" v-loading="catalogLoading || quoteLoading">
        <section class="pricing-command">
          <div class="pricing-command__copy">
            <span>{{ t('admin.supplierPricing.workspaceTitle') }}</span>
            <h1>{{ t('admin.supplierPricing.title') }}</h1>
            <p>{{ t('admin.supplierPricing.workspaceHint') }}</p>
            <div class="pricing-command__supplier">
              <span class="pricing-command__avatar">{{ supplierInitials }}</span>
              <span>
                <small>{{ t('admin.supplierOrders.signedIn') }}</small>
                <strong>{{ companyForm.companyName || t('admin.supplierOrders.unnamed') }}</strong>
              </span>
              <el-tag :type="onboardingTagType" effect="light">{{ profileStatusLabel }}</el-tag>
            </div>
            <div class="pricing-command__categories">
              <small>{{ t('admin.supplierPricing.yourCategories') }}</small>
              <em v-for="category in serviceCategoryOptions" :key="category.id">{{ category.label }}</em>
              <em v-if="!serviceCategoryOptions.length">—</em>
              <button type="button" @click="goTo('profile')">{{ t('admin.supplierPricing.changeInProfile') }}</button>
            </div>
          </div>
          <div class="pricing-command__metrics">
            <article>
              <small>{{ t('admin.supplierPricing.servicesMetric') }}</small>
              <strong>{{ serviceRows.length }}</strong>
              <span>{{ t('admin.supplierPricing.count', { count: serviceRows.length }) }}</span>
            </article>
            <article :class="{ 'is-pending': pendingQuoteCount > 0 }">
              <small>{{ t('admin.supplierPricing.pendingMetric') }}</small>
              <strong>{{ pendingQuoteCount }}</strong>
              <span>{{ t('admin.supplierPricing.pending', { count: pendingQuoteCount }) }}</span>
            </article>
            <article>
              <small>{{ t('admin.supplierPricing.enabledMetric') }}</small>
              <strong>{{ enabledServiceCount }}</strong>
              <span>{{ t('admin.supplierPricing.acceptEnabled') }}</span>
            </article>
          </div>
        </section>

        <section class="sv-board">
          <div class="pricing-toolbar">
            <div class="pricing-filter">
              <span class="pricing-filter__title">
                <strong>{{ t('admin.supplierPricing.added') }}</strong>
                <small>{{ t('admin.supplierPricing.listHint') }}</small>
              </span>
              <el-select v-model="quoteCategory" filterable>
                <el-option :label="t('admin.supplierPricing.allServices')" value="all" />
                <el-option v-for="category in serviceCategoryOptions" :key="category.id" :label="category.label" :value="category.id" />
              </el-select>
              <el-input v-model="addedKeyword" clearable :placeholder="t('admin.supplierPricing.searchAdded')" />
              <el-button v-if="quoteCategory !== 'all' || addedKeyword" link @click="resetPricingFilters">{{ t('admin.supplierPricing.clearFilters') }}</el-button>
            </div>
            <div class="pricing-actions">
              <small>{{ t('admin.supplierPricing.count', { count: filteredServiceRows.length }) }}</small>
              <el-button type="primary" :icon="Plus" :disabled="!supplierRecordId" @click="openServicePicker">{{ t('admin.supplierPricing.addService') }}</el-button>
            </div>
          </div>
          <el-table :data="filteredServiceRows" class="data-table pricing-data-table" row-key="spuId" :empty-text="t('admin.supplierPricing.empty')" @row-click="openServiceQuote">
            <el-table-column :label="t('admin.supplierPricing.service')" min-width="260">
              <template #default="{ row }">
                <div class="pricing-service-cell">
                  <span>{{ String(serviceTitle(row.name, row.spuNameI18n) || 'S').slice(0, 1).toUpperCase() }}</span>
                  <div><strong>{{ serviceTitle(row.name, row.spuNameI18n) }}</strong><small>{{ localizedCategory(row.category, row.categoryNameI18n) }}</small></div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('admin.supplierPricing.quoteMode')" min-width="130">
              <template #default="{ row }"><span class="quote-mode-pill">{{ quoteModeLabel(row.quoteMode) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('admin.supplierPricing.yourPrice')" min-width="180">
              <template #default="{ row }"><strong class="pricing-price">{{ yourPriceText(row) }}</strong></template>
            </el-table-column>
            <el-table-column :label="t('admin.supplierPricing.reviewStatus')" width="130">
              <template #default="{ row }">
                <el-tag :type="quoteTagType(row.status)" effect="light">{{ quoteStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('admin.supplierPricing.enabled')" width="90" align="center">
              <template #default="{ row }">
                <el-switch :model-value="Number(row.acceptOrder) !== 0" :loading="acceptOrderSaving === row.spuId" @click.stop @change="toggleServiceAccept(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="t('admin.supplierPricing.actions')" width="250" align="right">
              <template #default="{ row }">
                <el-button link @click.stop="openServiceEditor(row)">{{ t('admin.supplierPricing.staffPhone') }}</el-button>
                <el-button link type="primary" @click.stop="openServiceQuote(row)">{{ t('admin.supplierPricing.edit') }}</el-button>
                <el-button link type="danger" @click.stop="removeAddedService(row)">{{ t('admin.supplierPricing.remove') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pricing-mobile-list">
            <p v-if="!filteredServiceRows.length" class="pricing-mobile-empty">{{ t('admin.supplierPricing.empty') }}</p>
            <article v-for="row in filteredServiceRows" :key="`mobile-${row.categoryId}-${row.spuId}`" @click="openServiceQuote(row)">
              <header>
                <div class="pricing-service-cell">
                  <span>{{ String(serviceTitle(row.name, row.spuNameI18n) || 'S').slice(0, 1).toUpperCase() }}</span>
                  <div><strong>{{ serviceTitle(row.name, row.spuNameI18n) }}</strong><small>{{ localizedCategory(row.category, row.categoryNameI18n) }}</small></div>
                </div>
                <el-tag :type="quoteTagType(row.status)" effect="light">{{ quoteStatusLabel(row.status) }}</el-tag>
              </header>
              <dl>
                <div><dt>{{ t('admin.supplierPricing.quoteMode') }}</dt><dd>{{ quoteModeLabel(row.quoteMode) }}</dd></div>
                <div><dt>{{ t('admin.supplierPricing.yourPrice') }}</dt><dd>{{ yourPriceText(row) }}</dd></div>
              </dl>
              <footer @click.stop>
                <span><el-switch :model-value="Number(row.acceptOrder) !== 0" :loading="acceptOrderSaving === row.spuId" @change="toggleServiceAccept(row)" /> {{ Number(row.acceptOrder) !== 0 ? t('admin.supplierPricing.enabled') : t('admin.supplierPricing.disabled') }}</span>
                <div>
                  <el-button link @click="openServiceEditor(row)">{{ t('admin.supplierPricing.staffPhone') }}</el-button>
                  <el-button link type="primary" @click="openServiceQuote(row)">{{ t('admin.supplierPricing.edit') }}</el-button>
                </div>
              </footer>
            </article>
          </div>
        </section>
      </div>

      <div v-else class="sv-editor">
        <nav class="sv-crumb">
          <button type="button" @click="quoteDialog.visible = false">← {{ t('admin.supplierPricing.back') }}</button>
          <span>{{ t('admin.supplierPricing.title') }}</span>
          <em>›</em>
            <strong>{{ quoteDialogTitle }}</strong>
          </nav>
        <section class="pricing-editor-hero">
          <div>
            <span>{{ t('admin.supplierPricing.editorKicker') }}</span>
            <h1>{{ quoteDialogTitle }}</h1>
            <p>{{ quoteDialogCategory }} · {{ t('admin.supplierPricing.editorHint') }}</p>
          </div>
          <el-tag :type="quoteTagType(quoteDialog.status)" effect="dark">{{ quoteStatusLabel(quoteDialog.status) }}</el-tag>
        </section>
        <section class="sv-quote" v-loading="quoteDialog.loading">
          <div v-if="quoteDialog.rejectReason" class="pricing-editor-alert is-rejected">
            <span>!</span>
            <div>
              <strong>{{ t('admin.supplierPricing.statusRejected') }}</strong>
              <p>{{ t('admin.supplierPricing.rejectReason', { reason: quoteDialog.rejectReason }) }}</p>
            </div>
          </div>
          <div class="pricing-editor-layout">
            <div class="pricing-editor-main">
              <section class="pricing-editor-section">
                <header class="pricing-section-head">
                  <span>01</span>
                  <div>
                    <h2>{{ t('admin.supplierPricing.billingStep') }}</h2>
                    <p>{{ t('admin.supplierPricing.billingStepHint') }}</p>
                  </div>
                </header>
                <div class="mode-cards">
                  <button type="button" :aria-pressed="quoteDialog.quoteMode === 2" :class="{ 'is-on': quoteDialog.quoteMode === 2 }" @click="pickQuoteMode(2)">
                    <span class="mode-card__mark">{{ quoteDialog.quoteMode === 2 ? '✓' : '01' }}</span>
                    <strong>{{ t('admin.supplierPricing.hourlyRate') }}</strong>
                    <small>{{ t('admin.supplierPricing.hourlyCardHint') }}</small>
                  </button>
                  <button type="button" :aria-pressed="quoteDialog.quoteMode === 1" :class="{ 'is-on': quoteDialog.quoteMode === 1 }" @click="pickQuoteMode(1)">
                    <span class="mode-card__mark">{{ quoteDialog.quoteMode === 1 ? '✓' : '02' }}</span>
                    <strong>{{ t('admin.supplierPricing.fixedPrice') }}</strong>
                    <small>{{ t('admin.supplierPricing.fixedCardHint') }}</small>
                  </button>
                </div>
                <div v-if="quoteDialog.quoteMode === 2" class="rate-card">
                  <label class="rate-field">
                    <span>{{ t('admin.supplierPricing.rateLabel') }}</span>
                    <span class="currency-input">
                      <b>AED</b>
                      <el-input-number v-model="quoteDialog.unitPrice" :min="0" :precision="2" controls-position="right" />
                    </span>
                  </label>
                </div>
              </section>

              <section class="pricing-editor-section">
                <header class="pricing-section-head">
                  <span>02</span>
                  <div>
                    <h2>{{ t('admin.supplierPricing.specStep') }}</h2>
                    <p class="spec-step-hint">{{ t('admin.supplierPricing.specStepHint') }}</p>
                  </div>
                  <em>{{ quoteDialog.rows.length }}</em>
                </header>
                <div class="quote-lines">
                  <p v-if="!quoteDialog.loading && !quoteDialog.rows.length" class="quote-lines__empty">{{ t('admin.supplierPricing.noSpecs') }}</p>
                  <article v-for="(row, index) in quoteDialog.rows" :key="row.skuId" class="quote-line" :class="{ 'is-off': row.available === false || !row.enabled }">
                    <label class="quote-line__switch">
                      <span>{{ t('admin.supplierPricing.skuSwitch') }}</span>
                      <el-switch v-model="row.enabled" :disabled="row.available === false" />
                    </label>
                    <div class="quote-line__spec">
                      <span>{{ String(index + 1).padStart(2, '0') }}</span>
                      <div>
                        <strong>{{ quoteSpecLabel(row) }}</strong>
                        <small v-if="row.available === false">{{ t('admin.supplierPricing.discontinued') }}</small>
                        <small v-else>{{ t('admin.supplierPricing.livePrice', { price: moneyText(row.approvedPrice) }) }}</small>
                      </div>
                    </div>
                    <label>
                      <span>{{ t('admin.supplierPricing.headcount') }}</span>
                      <el-input-number v-model="row.staffCount" :min="1" :precision="0" :disabled="row.available === false || !row.enabled" controls-position="right" />
                    </label>
                    <label>
                      <span>{{ t('admin.supplierPricing.hours') }}</span>
                      <el-input-number v-model="row.serviceHours" :min="0.01" :precision="2" :step="0.5" :disabled="row.available === false || !row.enabled" controls-position="right" />
                    </label>
                    <label class="quote-line__price">
                      <span>{{ t('admin.supplierPricing.taxPrice') }}</span>
                      <span v-if="quoteDialog.quoteMode === 2" class="auto-price">
                        <small>AED</small>
                        <strong>{{ skuAmount(row) == null ? '—' : moneyText(skuAmount(row)) }}</strong>
                      </span>
                      <el-input v-else v-model="row.quotePrice" inputmode="decimal" :disabled="row.available === false || !row.enabled">
                        <template #prepend>AED</template>
                      </el-input>
                      <small v-if="quoteDialog.quoteMode === 2" class="field-help">{{ t('admin.supplierPricing.readonlyPriceHint') }}</small>
                    </label>
                  </article>
                </div>
              </section>

              <section v-if="quoteDialog.attaches.length" class="pricing-editor-section">
                <header class="pricing-section-head">
                  <span>03</span>
                  <div>
                    <h2>{{ t('admin.supplierPricing.addonStep') }}</h2>
                    <p>{{ t('admin.supplierPricing.addonStepHint') }}</p>
                  </div>
                  <em>{{ selectedAttachCount }}/{{ quoteDialog.attaches.length }}</em>
                </header>
                <div class="quote-attaches">
                  <article v-for="item in quoteDialog.attaches" :key="item.attachValueId" class="quote-attach" :class="{ 'is-selected': item.offered }">
                    <div class="quote-attach__name">
                      <el-checkbox :model-value="item.offered" @change="(value: boolean | string | number) => toggleAttach(item, Boolean(value))">
                        {{ attachDisplay(item, 'name') }}
                      </el-checkbox>
                      <small>{{ attachDisplay(item, 'type') }} · {{ t('admin.supplierPricing.livePrice', { price: moneyText(item.approvedPrice) }) }}</small>
                    </div>
                    <el-input v-if="item.offered" v-model="item.quotePrice" inputmode="decimal" :placeholder="t('admin.supplierPricing.taxPrice')">
                      <template #prepend>AED</template>
                    </el-input>
                  </article>
                </div>
              </section>
            </div>

            <aside class="pricing-review-panel">
              <span>{{ t('admin.supplierPricing.reviewNoticeTitle') }}</span>
              <h3>{{ t('admin.supplierPricing.reviewNoticeHint') }}</h3>
              <dl>
                <div><dt>{{ t('admin.supplierPricing.reviewStatus') }}</dt><dd><el-tag :type="quoteTagType(quoteDialog.status)" effect="light">{{ quoteStatusLabel(quoteDialog.status) }}</el-tag></dd></div>
                <div><dt>{{ t('admin.supplierPricing.quoteMode') }}</dt><dd>{{ quoteModeLabel(quoteDialog.quoteMode) }}</dd></div>
                <div><dt>{{ t('admin.supplierPricing.package') }}</dt><dd>{{ quoteDialog.rows.length }}</dd></div>
                <div><dt>{{ t('admin.supplierPricing.addons') }}</dt><dd>{{ selectedAttachCount }}</dd></div>
              </dl>
              <button type="button" @click="openQuotedServiceEditor">
                <span>{{ t('admin.supplierPricing.serviceSetupTitle') }}</span>
                <small>{{ t('admin.supplierPricing.serviceSetupHint') }}</small>
                <b>→</b>
              </button>
            </aside>
          </div>

          <footer class="sv-quote__foot">
            <div class="sv-quote__foot-note">
              <span>{{ quoteStatusLabel(quoteDialog.status) }}</span>
              <small>{{ t('admin.supplierPricing.priceIntro') }}</small>
            </div>
            <div>
              <el-button :loading="quoteDialog.saving" @click="saveServiceQuote">{{ t('admin.supplierPricing.saveDraft') }}</el-button>
              <el-button type="primary" :loading="quoteDialog.saving" @click="submitServiceQuote">{{ t('admin.supplierPricing.submitReview') }}</el-button>
            </div>
          </footer>
        </section>
      </div>

      <el-dialog v-model="servicePicker.open" class="supplier-form-dialog sv-add-dialog" :title="t('admin.supplierPricing.addService')" width="min(760px, calc(100vw - 32px))" :close-on-click-modal="false" append-to-body>
        <p class="sv-add__note">{{ t('admin.supplierPricing.onlyCategories') }}</p>
        <div class="picker-toolbar">
          <el-select v-model="servicePicker.categoryId" filterable clearable :placeholder="t('admin.supplierPricing.selectCategory')">
            <el-option v-for="group in pickerCategories" :key="group.categoryId" :label="localizedCategory(group.categoryName, group.categoryNameI18n)" :value="group.categoryId" />
          </el-select>
          <el-input v-model="servicePicker.keyword" clearable :placeholder="t('admin.supplierPricing.searchService')" />
        </div>
        <p v-if="!pickerReady" class="picker-hint">{{ t('admin.supplierPricing.pickerGate') }}</p>
        <div v-else class="picker-list">
          <div class="picker-list__bar">
            <small>{{ t('admin.supplierPricing.shown', { count: pickerVisible.length }) }}<template v-if="servicePicker.drafts.length"> · {{ t('admin.supplierPricing.selected', { count: servicePicker.drafts.length }) }}</template></small>
          </div>
          <p v-if="!pickerVisible.length" class="picker-hint">{{ t('admin.supplierPricing.noMatch') }}</p>
          <div v-for="service in pickerVisible" :key="pickKey(service)" class="picker-row" :class="{ 'is-added': service.added, 'is-open': draftOf(service) }">
            <div class="picker-row__head">
              <el-checkbox
                :model-value="service.added || Boolean(draftOf(service))"
                :disabled="service.added"
                @change="(value) => togglePick(service, Boolean(value))"
              />
              <span class="picker-row__name">
                <strong>{{ serviceTitle(service.spuName, service.spuNameI18n) }}</strong>
                <small>{{ localizedCategory(service.categoryName, service.categoryNameI18n) }}<template v-if="!service.available"> · {{ t('admin.supplierPricing.unavailable') }}</template></small>
              </span>
              <em v-if="service.added">{{ t('admin.supplierPricing.added') }}</em>
            </div>
            <div v-if="draftOf(service)" class="picker-row__fields">
              <label>
                <span>{{ t('admin.supplierPricing.headcount') }}</span>
                <el-input-number v-model="draftOf(service)!.workerCount" :min="1" :precision="0" controls-position="right" />
              </label>
              <div class="phone-stack">
                <span>{{ t('admin.supplierPricing.phone') }}</span>
                <div v-for="(_phone, index) in draftOf(service)!.phones" :key="`${pickKey(service)}-${index}`" class="phone-row">
                  <el-input v-model="draftOf(service)!.phones[index]" maxlength="24" placeholder="+971501234567" />
                  <el-button v-if="draftOf(service)!.phones.length > 1" @click="removePhone(draftOf(service)!, index)">{{ t('admin.supplierPricing.delete') }}</el-button>
                </div>
                <el-button v-if="draftOf(service)!.phones.length < 10" link type="primary" @click="addPhone(draftOf(service)!)">{{ t('admin.supplierPricing.addPhone') }}</el-button>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="servicePicker.open = false">{{ t('admin.supplierPricing.cancel') }}</el-button>
          <el-button type="primary" :loading="catalogSaving" @click="confirmAddServices">{{ t('admin.supplierPricing.addToList') }}</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="serviceEditor.open" class="supplier-form-dialog" :title="t('admin.supplierPricing.editTitle', { name: serviceEditorTitle })" width="min(560px, calc(100vw - 32px))" :close-on-click-modal="false" append-to-body>
        <div class="service-editor-intro">
          <span>{{ t('admin.supplierPricing.serviceSetupTitle') }}</span>
          <strong>{{ serviceEditorTitle }}</strong>
          <p>{{ t('admin.supplierPricing.serviceSetupHint') }}</p>
        </div>
        <div class="picker-fields">
          <label>
            <span>{{ t('admin.supplierPricing.headcount') }}</span>
            <el-input-number v-model="serviceEditor.workerCount" :min="1" :precision="0" controls-position="right" />
          </label>
          <div class="phone-stack">
            <span>{{ t('admin.supplierPricing.phone') }}</span>
            <div v-for="(_phone, index) in serviceEditor.phones" :key="`edit-${index}`" class="phone-row">
              <small>{{ t('admin.supplierPricing.phoneEntry', { index: index + 1 }) }}</small>
              <el-input v-model="serviceEditor.phones[index]" maxlength="24" placeholder="+971501234567" />
              <el-button v-if="serviceEditor.phones.length > 1" @click="removePhone(serviceEditor, index)">{{ t('admin.supplierPricing.delete') }}</el-button>
            </div>
            <el-button v-if="serviceEditor.phones.length < 10" link type="primary" @click="addPhone(serviceEditor)">{{ t('admin.supplierPricing.addPhone') }}</el-button>
          </div>
        </div>
        <template #footer>
          <el-button @click="serviceEditor.open = false">{{ t('admin.supplierPricing.cancel') }}</el-button>
          <el-button type="primary" :loading="catalogSaving" @click="saveServiceEditor">{{ t('admin.supplierPricing.save') }}</el-button>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="section === 'settlement'">
      <div class="metric-grid">
        <article class="metric-card"><span class="metric-icon metric-icon--green"><Money /></span><div><small>累计收益</small><strong>AED 286.4k</strong><p>Since Jan 2026</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><CircleCheck /></span><div><small>已结算</small><strong>AED 243.1k</strong><p>18 payout batches</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--amber"><Clock /></span><div><small>待结算</small><strong>AED 12,680</strong><p>Next payout · 30 Sep</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--purple"><Document /></span><div><small>本期调整</small><strong>- AED 180</strong><p>1 append-only adjustment</p></div></article>
      </div>
      <el-card class="surface-card" shadow="never">
        <el-tabs v-model="settlementTab" class="settlement-tabs">
          <el-tab-pane label="交易明细" name="transactions">
            <section class="settlement-note"><CircleCheck /><span><strong>每笔收益均来自订单完成时锁定的快照</strong><small>金额调整不会覆盖原记录，而是新增一条调整流水。</small></span></section>
            <el-table :data="settlementRows" class="data-table" row-key="jobId">
              <el-table-column label="Web Order / Job ID" min-width="205"><template #default="{ row }"><div class="order-id"><strong>{{ row.webOrder }}</strong><small>{{ row.jobId }} · {{ row.date }}</small></div></template></el-table-column>
              <el-table-column label="服务" min-width="190" prop="service" />
              <el-table-column label="执行人员" min-width="150" prop="staff" />
              <el-table-column label="订单收益" min-width="125" align="right"><template #default="{ row }">AED {{ row.base }}</template></el-table-column>
              <el-table-column label="调整" min-width="110" align="right"><template #default="{ row }"><span :class="row.adjustment < 0 ? 'negative' : 'muted-text'">{{ row.adjustment ? `- AED ${Math.abs(row.adjustment)}` : '—' }}</span></template></el-table-column>
              <el-table-column label="最终应付" min-width="130" align="right"><template #default="{ row }"><strong class="money-value">AED {{ row.payable }}</strong></template></el-table-column>
              <el-table-column label="结算状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'Paid' ? 'success' : 'warning'" effect="light">{{ row.status }}</el-tag></template></el-table-column>
              <el-table-column label="批次" min-width="130" prop="batch" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="付款批次" name="payouts">
            <el-table :data="payoutBatches" class="data-table" row-key="batch">
              <el-table-column label="批次" prop="batch" width="120" /><el-table-column label="账期" prop="period" min-width="160" /><el-table-column label="订单数" prop="orders" width="88" /><el-table-column label="应付金额" width="120"><template #default="{ row }"><strong>AED {{ row.amount }}</strong></template></el-table-column><el-table-column label="付款日" prop="paidAt" width="118" /><el-table-column label="状态" width="88"><template #default="{ row }"><el-tag :type="row.status === 'Paid' ? 'success' : 'warning'">{{ row.status }}</el-tag></template></el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <el-dialog v-model="staffDialogVisible" class="supplier-form-dialog" title="新增供应商人员 / Add Staff" width="min(620px, calc(100vw - 32px))" :close-on-click-modal="false" append-to-body>
      <el-form label-position="top" class="form-grid">
        <el-form-item label="姓名 / Full Name"><el-input v-model="newStaff.name" placeholder="例如：Amina Noor" /></el-form-item>
        <el-form-item label="员工编号 / Staff ID"><el-input v-model="newStaff.id" /></el-form-item>
        <el-form-item label="手机号 / Mobile"><el-input v-model="newStaff.mobile" placeholder="+971" /></el-form-item>
        <el-form-item label="性别 / Gender"><el-select v-model="newStaff.gender" style="width: 100%"><el-option label="Female" value="Female" /><el-option label="Male" value="Male" /></el-select></el-form-item>
        <el-form-item label="角色 / Role"><el-select v-model="newStaff.role" style="width: 100%"><el-option label="Technician" value="Technician" /><el-option label="Cleaner" value="Cleaner" /><el-option label="Team Lead" value="Team Lead" /></el-select></el-form-item>
        <el-form-item label="主要技能 / Primary Skill"><el-select v-model="newStaff.skill" style="width: 100%"><el-option v-for="skill in staffSkills" :key="skill" :label="skill" :value="skill" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="staffDialogVisible = false">取消</el-button><el-button type="primary" @click="addStaff">保存人员</el-button></template>
    </el-dialog>


    <el-dialog v-model="shiftDialogVisible" class="supplier-form-dialog" title="添加班次 / Block" width="min(620px, calc(100vw - 32px))" :close-on-click-modal="false" append-to-body>
      <el-form label-position="top" class="form-grid">
        <el-form-item label="人员"><el-select v-model="shiftForm.staff"><el-option v-for="person in schedulePeople" :key="person.id" :label="person.name" :value="person.id" /></el-select></el-form-item>
        <el-form-item label="动作"><el-select v-model="shiftForm.type"><el-option label="工作班次" value="shift" /><el-option label="不可用 Block" value="block" /><el-option label="休假" value="leave" /></el-select></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="shiftForm.date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="时间"><el-time-picker v-model="shiftForm.time" is-range range-separator="至" /></el-form-item>
        <el-form-item label="备注" class="span-2"><el-input v-model="shiftForm.note" type="textarea" /></el-form-item>
      </el-form>
      <section v-if="shiftConflict" class="conflict-alert"><Warning /><span><strong>发现时间冲突</strong><small>该员工 14:00–18:00 已被订单 JOB-88421 占用。</small></span></section>
      <template #footer><el-button @click="shiftDialogVisible = false">取消</el-button><el-button type="primary" @click="validateShift">校验并保存</el-button></template>
    </el-dialog>

    <el-drawer v-model="orderDrawerVisible" class="order-drawer" :title="t('admin.supplierOrders.detailTitle')" size="min(760px, 100vw)" append-to-body>
      <div v-loading="orderDetailLoading" class="order-sheet">
        <template v-if="selectedOrder">
          <header class="order-lead">
            <div class="order-lead__topline">
              <span>{{ t('admin.supplierOrders.assignedOrder') }}</span>
              <el-tag :type="serviceStatusTag(selectedOrder.serviceStatus)" effect="light">{{ serviceStatusText(selectedOrder) }}</el-tag>
            </div>
            <strong class="order-lead__number">{{ selectedOrder.orderNo || '—' }}</strong>
            <h2>{{ orderServiceTitle(selectedOrder) }}</h2>
            <p>{{ t('admin.supplierOrders.detailHint') }}</p>
            <div class="order-lead__summary">
              <div><Calendar /><span><small>{{ t('admin.supplierOrders.serviceTime') }}</small><strong>{{ orderWhen(selectedOrder) }}</strong></span></div>
              <div><Money /><span><small>{{ t('admin.supplierOrders.quoteTotal') }}</small><strong>AED {{ orderMoney(selectedOrder.quoteAmount ?? selectedOrder.quotePrice) }}</strong></span></div>
            </div>
          </header>

          <div class="order-detail-grid">
          <section class="order-panel order-panel--wide">
            <h3><span>01</span>{{ t('admin.supplierOrders.serviceBlock') }}</h3>
            <div class="order-facts">
              <div class="is-wide"><span>{{ t('admin.supplierOrders.specs') }}</span><strong>{{ orderSpecText(selectedOrder) }}</strong></div>
              <div class="is-wide"><span>{{ t('admin.supplierOrders.addons') }}</span><strong>{{ orderAddonText(selectedOrder) }}</strong></div>
              <div class="is-wide"><span>{{ t('admin.supplierOrders.serviceTime') }}</span><strong>{{ orderWhen(selectedOrder) }}</strong></div>
              <div><span>{{ t('admin.supplierOrders.staffCount') }}</span><strong>{{ selectedOrder.staffCount ?? '—' }}</strong></div>
              <div><span>{{ t('admin.supplierOrders.serviceHours') }}</span><strong>{{ orderHours(selectedOrder.serviceHours) }}</strong></div>
            </div>
          </section>

          <section class="order-panel">
            <h3><span>02</span>{{ t('admin.supplierOrders.placeBlock') }}</h3>
            <p class="order-address">{{ selectedOrder.serviceAddress || '—' }}</p>
            <p class="order-address">{{ t('admin.supplierOrders.customerRemark') }}: {{ selectedOrder.remark || '—' }}</p>
            <p v-if="selectedOrder.additionalNotes" class="order-address">{{ t('admin.supplierOrders.additionalNotes') }}: {{ selectedOrder.additionalNotes }}</p>
            <a v-if="selectedOrder.pinLocation" class="order-map" :href="selectedOrder.pinLocation" target="_blank" rel="noopener noreferrer">{{ t('admin.supplierOrders.openMap') }}</a>
          </section>

          <section class="order-panel">
            <h3><span>03</span>{{ t('admin.supplierOrders.quoteBlock') }}</h3>
            <div class="order-quote">
              <div>
                <span>{{ t('admin.supplierOrders.taxPrice') }}</span>
                <strong><small>AED</small>{{ orderMoney(selectedOrder.quotePrice) }}</strong>
                <small>{{ orderQuoteMode(selectedOrder) }}</small>
              </div>
              <div>
                <span>{{ t('admin.supplierOrders.quoteTotal') }}</span>
                <strong><small>AED</small>{{ orderMoney(selectedOrder.quoteAmount) }}</strong>
              </div>
            </div>
          </section>

          <section class="order-panel order-panel--wide">
            <h3><span>04</span>{{ t('admin.supplierOrders.contactBlock') }}</h3>
            <div class="order-facts">
              <div>
                <span>{{ t('admin.supplierOrders.phones') }}</span>
                <strong v-if="orderPhones(selectedOrder).length" class="phone-list">
                  <em v-for="(phone, index) in orderPhones(selectedOrder)" :key="`${phone}-${index}`">{{ phone }}</em>
                </strong>
                <strong v-else>—</strong>
              </div>
              <div v-if="selectedOrder.customerPhoneTail">
                <span>{{ t('admin.supplierOrders.customerTail') }}</span>
                <strong>{{ selectedOrder.customerPhoneTail }}</strong>
              </div>
            </div>
          </section>

          <section v-if="(selectedOrder.lines || []).length > 1" class="order-panel order-panel--wide">
            <h3><span>05</span>{{ t('admin.supplierOrders.serviceName') }}</h3>
            <div class="order-lines">
              <article v-for="(line, index) in selectedOrder.lines" :key="line.skuId || index">
                <div><strong>{{ orderServiceTitle(line) }}</strong><small>{{ orderSpecText(line) }}</small></div>
                <dl>
                  <div><dt>{{ t('admin.supplierOrders.staffCount') }}</dt><dd>{{ line.staffCount ?? '—' }}</dd></div>
                  <div><dt>{{ t('admin.supplierOrders.serviceHours') }}</dt><dd>{{ orderHours(line.serviceHours) }}</dd></div>
                  <div><dt>{{ t('admin.supplierOrders.price') }}</dt><dd>AED {{ orderMoney(line.quotePrice) }}</dd></div>
                </dl>
              </article>
            </div>
          </section>

          <section v-if="selectedOrder.departTime || selectedOrder.additionalNotes || selectedOrder.arriveRemark || selectedOrder.completeRemark" class="order-panel order-panel--wide">
            <h3><span>06</span>{{ t('admin.supplierOrders.executionBlock') }}</h3>
            <div class="order-facts">
              <div v-if="selectedOrder.departTime"><span>{{ t('admin.supplierOrders.departTime') }}</span><strong>{{ orderClock(selectedOrder.departTime) }}</strong></div>
              <div v-if="selectedOrder.additionalNotes" class="is-wide"><span>{{ t('admin.supplierOrders.additionalNotes') }}</span><strong>{{ selectedOrder.additionalNotes }}</strong></div>
              <div v-if="selectedOrder.arriveRemark"><span>{{ t('admin.supplierOrders.arriveNote') }}</span><strong>{{ selectedOrder.arriveRemark }}</strong></div>
              <div v-if="selectedOrder.completeRemark"><span>{{ t('admin.supplierOrders.completeNote') }}</span><strong>{{ selectedOrder.completeRemark }}</strong></div>
            </div>
          </section>

          <section v-if="orderPhotos(selectedOrder.arrivePhotos).length" class="order-panel order-panel--wide order-photos">
            <h3><span>07</span>{{ t('admin.supplierOrders.arrivePhotos') }}</h3>
            <button v-for="(url, index) in orderPhotos(selectedOrder.arrivePhotos)" :key="url" type="button" :aria-label="`${t('admin.supplierOrders.arrivePhotos')} ${index + 1}`" @click="openFilePreview(url)">
              <img :src="url" :alt="`${t('admin.supplierOrders.arrivePhotos')} ${index + 1}`" />
            </button>
          </section>
          <section v-if="orderPhotos(selectedOrder.completePhotos).length" class="order-panel order-panel--wide order-photos">
            <h3><span>08</span>{{ t('admin.supplierOrders.completePhotos') }}</h3>
            <button v-for="(url, index) in orderPhotos(selectedOrder.completePhotos)" :key="url" type="button" :aria-label="`${t('admin.supplierOrders.completePhotos')} ${index + 1}`" @click="openFilePreview(url)">
              <img :src="url" :alt="`${t('admin.supplierOrders.completePhotos')} ${index + 1}`" />
            </button>
          </section>
          </div>
        </template>
      </div>
      <template #footer>
        <div v-if="selectedOrder" class="order-drawer-footer">
          <div><span>{{ t('admin.supplierOrders.serviceStatus') }}</span><strong>{{ serviceStatusText(selectedOrder) }}</strong></div>
          <el-button v-if="serviceStep(selectedOrder) === 0" type="primary" @click="departForService(selectedOrder)">{{ t('admin.supplierOrders.departAction') }}</el-button>
          <el-button v-else-if="serviceStep(selectedOrder) === 3" type="primary" @click="openServiceAction(selectedOrder, 'arrive')">{{ t('admin.supplierOrders.arriveAction') }}</el-button>
          <el-button v-else-if="serviceStep(selectedOrder) === 1" type="primary" @click="openServiceAction(selectedOrder, 'complete')">{{ t('admin.supplierOrders.completeAction') }}</el-button>
          <span v-else class="order-drawer-footer__done"><CircleCheck />{{ t('admin.supplierOrders.noAction') }}</span>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="serviceAction.open" class="supplier-form-dialog service-action-dialog" :title="serviceAction.mode === 'arrive' ? t('admin.supplierOrders.arriveTitle') : t('admin.supplierOrders.completeTitle')" width="min(600px, calc(100vw - 32px))" :close-on-click-modal="false" append-to-body>
      <div class="service-action__intro">
        <span>{{ t('admin.supplierOrders.assignedOrder') }}</span>
        <strong>{{ serviceAction.orderNo }}</strong>
        <p>{{ t('admin.supplierOrders.evidenceHint') }}</p>
      </div>
      <label class="service-action__note">
        <span>{{ t('admin.supplierOrders.remark') }}</span>
        <el-input v-model="serviceAction.remark" type="textarea" maxlength="512" show-word-limit :rows="3" :placeholder="t('admin.supplierOrders.remarkPlaceholder')" />
      </label>
      <div class="service-action__photos">
        <div>
          <strong>{{ t('admin.supplierOrders.photos') }}</strong>
          <small>{{ t('admin.supplierOrders.photosHint') }}</small>
        </div>
        <label class="service-action__pick">
          <input type="file" accept="image/*" multiple :disabled="serviceAction.uploading" @change="addServicePhotos" />
          {{ t('admin.supplierOrders.addPhoto') }}
        </label>
        <ul v-if="serviceAction.photos.length">
          <li v-for="(photo, index) in serviceAction.photos" :key="photo.url">
            <button type="button" :aria-label="photo.name" @click="openFilePreview(photo.url)"><img :src="photo.url" :alt="photo.name" /></button>
            <span>{{ photo.name }}</span>
            <el-button link type="danger" @click="serviceAction.photos.splice(index, 1)">{{ t('admin.supplierPricing.delete') }}</el-button>
          </li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="serviceAction.open = false">{{ t('admin.supplierPricing.cancel') }}</el-button>
        <el-button type="primary" :loading="serviceAction.saving" :disabled="serviceAction.uploading" @click="submitServiceAction">{{ t('admin.supplierOrders.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="filePreview.open"
      class="policy-preview"
      :title="filePreview.name"
      width="min(960px, 92vw)"
      append-to-body
      destroy-on-close
    >
      <div class="policy-preview__stage">
        <img v-if="filePreview.kind === 'image'" :src="filePreview.url" :alt="filePreview.name" />
        <iframe v-else-if="filePreview.kind === 'pdf'" :src="filePreview.url" :title="filePreview.name" />
        <p v-else>{{ t('admin.supplierProfile.previewUnsupported') }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  onboardingMine,
  onboardingResubmit,
  onboardingSave,
  serviceCommunityPage,
  saveQuoteDraft,
  saveServices,
  submitQuote,
  supplierArrive,
  supplierDepart,
  supplierAssignedOrderDetail,
  supplierAssignedOrders,
  supplierChangeAcceptDispatch,
  supplierChangeAcceptOrder,
  supplierComplete,
  uploadFile,
} from '@/modules/admin/api/supplierWorkbench'
import { listBySpu, listSpuAttachCatalog } from '@/modules/admin/api/spu'
import SupplierAvailability from '@/modules/admin/pages/supplier-management/availability.vue'
import { useAdminSessionStore } from '@/modules/admin/stores/session'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import { categoryIdPayload, listServiceCategories, serviceCategoryLabel } from '@/modules/client/api/supplier-onboarding'
import { DEFAULT_PHONE_DIAL, PHONE_DIAL_OPTIONS, joinPhone, nationalNumberOk, phoneDialLabel, splitPhone } from '@/utils/phone-dial'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  Document,
  Download,
  Location,
  Money,
  OfficeBuilding,
  Plus,
  Search,
  Tickets,
  UserFilled,
  Warning,
} from '@element-plus/icons-vue'

type Section = 'overview' | 'profile' | 'service-area' | 'staff' | 'schedule' | 'orders' | 'pricing' | 'settlement' | 'availability'

const props = withDefaults(defineProps<{ section?: Section }>(), { section: 'overview' })
const section = computed(() => props.section)
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const pageMeta = {
  overview: { title: '数据与收益', description: '查看经营表现、收益趋势、服务容量与待处理事项。', primaryAction: '' },
  profile: { title: 'Company Profile', description: 'One page for company details, contact, capacity, and insurance.', primaryAction: 'Submit for review' },
  'service-area': { title: 'Service Area', description: 'Areas and communities saved on the onboarding form.', primaryAction: 'Manage service areas' },
  staff: { title: '人员管理', description: '维护人员角色、技能、默认工作时间、证件与可派状态。', primaryAction: '新增人员' },
  schedule: { title: '日程管理', description: '按日或周管理工作班次、休假、Block 与订单占用。', primaryAction: '添加班次 / Block' },
  orders: { title: '订单管理', description: '查看分配给当前供应商的订单、服务地点和生效报价。', primaryAction: '' },
  availability: { title: '可用时间', description: '可以接单的时间', primaryAction: '' },
  pricing: { title: '服务与报价', description: '先添加要提供的服务，再为列表里的服务报价。', primaryAction: '' },
  settlement: { title: '收益与结算', description: '核对订单收益、调整流水和付款批次。', primaryAction: '' },
} as const

const meta = computed(() => {
  if (section.value === 'pricing') return { title: t('admin.supplierPricing.title'), description: t('admin.supplierPricing.description'), primaryAction: '' }
  if (section.value === 'profile') return { title: t('admin.supplierProfile.title'), description: t('admin.supplierProfile.description'), primaryAction: '' }
  if (section.value === 'orders') return { title: t('admin.supplierOrders.title'), description: t('admin.supplierOrders.description'), primaryAction: '' }
  if (section.value === 'availability') return { title: t('admin.supplierAvailability.title'), description: t('admin.supplierAvailability.description'), primaryAction: '' }
  if (section.value === 'service-area') return { title: t('admin.supplierArea.title'), description: t('admin.supplierArea.description'), primaryAction: t('admin.supplierArea.manage') }
  return pageMeta[section.value]
})
const profileStatusLabel = computed(() => {
  const keys = ['statusDraft', 'statusSubmitted', 'statusApproved', 'statusRejected']
  const key = onboardingStatus.value == null ? 'statusNone' : keys[onboardingStatus.value] || 'statusNone'
  return t(`admin.supplierProfile.${key}`)
})
const profileStatusClass = computed(() => {
  if (onboardingStatus.value === 1) return 'is-review'
  if (onboardingStatus.value === 2) return 'is-approved'
  if (onboardingStatus.value === 3) return 'is-rejected'
  if (onboardingStatus.value === 0) return 'is-draft'
  return 'is-none'
})
const session = useAdminSessionStore()
const supplierRecordId = ref<number | null>(null)
const supplierNo = ref('')
const onboardingStatus = ref<number | null>(null)
const profileEditable = ref(true)
const snapshotVersion = ref<number | null>(null)
const profileView = ref<'section' | 'all'>('section')
const profileSection = ref(0)
const profileFromAll = ref(false)
const profileBooted = ref(false)
const submitTried = ref(false)
const whatsappSame = ref(false)
const tradeLicenseFiles = ref<string[]>([])
const otherDocumentFiles = ref<string[]>([])
const profileExtra = ref<Record<string, unknown>>({})
const needsResubmit = computed(() => profileEditable.value && (onboardingStatus.value === 2 || onboardingStatus.value === 3))
const profileReadOnly = computed(() => !profileEditable.value || profileView.value === 'all')
const profileSections = computed(() => [
  { id: 'company', num: '01', title: t('admin.supplierProfile.companyTitle'), desc: t('admin.supplierProfile.companyHint') },
  { id: 'contact', num: '02', title: t('admin.supplierProfile.contactTitle'), desc: t('admin.supplierProfile.contactHint') },
  { id: 'capacity', num: '03', title: t('admin.supplierProfile.capacityTitle'), desc: t('admin.supplierProfile.capacityHint') },
  { id: 'bank', num: '04', title: t('admin.supplierProfile.bankTitle'), desc: t('admin.supplierProfile.bankHint') },
  { id: 'documents', num: '05', title: t('admin.supplierProfile.documentsTitle'), desc: t('admin.supplierProfile.documentsHint') },
])
const activeProfileSection = computed(() => profileSections.value[profileSection.value] || profileSections.value[0])
const showProfileSection = (index: number) => profileView.value === 'all' || profileSection.value === index
const supplierEnabled = ref(false)
const supplierAcceptDispatch = ref(true)
const dispatchSaving = ref(false)
const acceptOrderSaving = ref<number | null>(null)
const rejectReason = ref('')
const saving = ref(false)
const femaleStaffCount = ref(0)
const maleStaffCount = ref(0)
const wholeText = (value: number | null | undefined) => (value == null ? '' : String(value))
const wholeOrZero = (raw: string) => {
  const digits = raw.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}
const ownTransportation = ref(false)
const scrollProfileTop = () => {
  const scroller = document.querySelector('.el-main') as HTMLElement | null
  scroller?.scrollTo({ top: 0, behavior: 'smooth' })
}
const openProfileSection = (index: number) => {
  if (profileView.value === 'all') profileFromAll.value = true
  profileSection.value = index
  profileView.value = 'section'
  scrollProfileTop()
}
const backToFullProfile = () => {
  profileFromAll.value = false
  profileView.value = 'all'
  scrollProfileTop()
}
const moveProfileSection = (step: number) => {
  const next = profileSection.value + step
  if (next < 0 || next > 4) return
  profileSection.value = next
  scrollProfileTop()
}
const syncWhatsapp = () => {
  if (!whatsappSame.value) return
  companyForm.whatsappCode = companyForm.mobileCode
  companyForm.whatsapp = companyForm.mobile
}

const earningRange = ref('6m')
const earningBars = [
  { month: 'Apr', value: 24.6, height: 54 }, { month: 'May', value: 27.8, height: 63 }, { month: 'Jun', value: 31.2, height: 72 },
  { month: 'Jul', value: 29.5, height: 67 }, { month: 'Aug', value: 35.5, height: 83 }, { month: 'Sep', value: 38.4, height: 92 },
]
const recentTransactions = [
  { webOrder: 'HX-260924-0186', jobId: 'JOB-88421', service: 'Regular Cleaning', amount: 224, date: '24 Sep' },
  { webOrder: 'HX-260924-0179', jobId: 'JOB-88408', service: 'Split AC Cleaning', amount: 360, date: '24 Sep' },
  { webOrder: 'HX-260923-0138', jobId: 'JOB-88366', service: 'Sofa Cleaning', amount: 250, date: '23 Sep' },
]
const goTo = (target: Section) => router.push({ path: `/admin/supplier-management/${target}`, query: router.currentRoute.value.query })

const companyForm = reactive({
  companyName: '',
  licenseNo: '',
  licenseIssuedBy: '',
  licenseIssuedByOther: '',
  licenseExpiry: '',
  trn: '',
  years: 0,
  address: '',
  contact: '',
  email: '',
  mobileCode: DEFAULT_PHONE_DIAL,
  mobile: '',
  whatsappCode: DEFAULT_PHONE_DIAL,
  whatsapp: '',
})

const complianceItems = reactive([
  { key: 'public', fileKey: 'publicLiabilityInsuranceFile', labelKey: 'publicLiability', enabled: false, files: [] as string[] },
  { key: 'employee', fileKey: 'employeeInsuranceFile', labelKey: 'employeeInsurance', enabled: false, files: [] as string[] },
  { key: 'tax', labelKey: 'taxInvoice', enabled: false, files: [] as string[] },
  { key: 'equipment', labelKey: 'ownEquipment', enabled: false, files: [] as string[] },
])

const bankForm = reactive({
  accountName: '',
  bankName: '',
  iban: '',
  swift: '',
  currency: 'AED',
})
const fileNameFromUrl = (url: string) => {
  const path = decodeURIComponent(url.split('?')[0].split('#')[0])
  return path.split('/').filter(Boolean).pop() || url
}

const fileKind = (url: string) => {
  const name = fileNameFromUrl(url).toLowerCase()
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'image'
  if (name.endsWith('.pdf')) return 'pdf'
  return 'other'
}

const filePreview = reactive({
  open: false,
  url: '',
  name: '',
  kind: 'other' as 'image' | 'pdf' | 'other',
})

const openFilePreview = (url: string) => {
  filePreview.url = url
  filePreview.name = fileNameFromUrl(url)
  filePreview.kind = fileKind(url)
  filePreview.open = true
}

const asFileList = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value !== 'string' || !value.trim()) return []
  const text = value.trim()
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      return [text]
    }
  }
  return [text]
}

const policyDocuments = computed(() => complianceItems
  .filter((item) => item.fileKey)
  .flatMap((item) => item.files.map((url, index) => ({
    key: `${item.key}-${index}-${url}`,
    label: t(`admin.supplierProfile.${item.labelKey}`),
    name: fileNameFromUrl(url),
    url,
    kind: fileKind(url),
  }))))

const capacityForm = reactive({ workers: 0, concurrent: 0, monthly: 0, leadTime: 0, start: '08:00', end: '18:00' })
const capacityToggles = reactive([
  { key: 'weekend', enabled: false },
  { key: 'saturday', enabled: true },
  { key: 'sunday', enabled: true },
  { key: 'publicHoliday', enabled: false },
  { key: 'sameDay', enabled: false },
  { key: 'emergency', enabled: false },
])
const onCapacityToggle = (key: string, enabled: boolean) => {
  const item = capacityToggles.find((row) => row.key === key)
  if (!item) return
  item.enabled = enabled
  if (key === 'saturday' || key === 'sunday') {
    capacityToggles[0].enabled = capacityToggles[1].enabled || capacityToggles[2].enabled
    return
  }
  if (key !== 'weekend') return
  const saturday = capacityToggles.find((row) => row.key === 'saturday')
  const sunday = capacityToggles.find((row) => row.key === 'sunday')
  if (saturday) saturday.enabled = enabled
  if (sunday) sunday.enabled = enabled
}

type StaffStatus = 'available' | 'busy' | 'leave'
type StaffRow = { id: string; name: string; gender: string; role: string; employment: string; workingDays: string; workingHours: string; mobile: string; language: string; skills: string[]; zones: string[]; docs: string; status: StaffStatus; color: string }

const staffSkills = ['Cleaning', 'Deep Cleaning', 'AC Service', 'Handyman', 'Painting', 'Beauty & Wellness']
const staff = ref<StaffRow[]>([
  { id: 'STF-0042', name: 'Amina Noor', gender: 'Female', role: 'Team Lead', employment: 'Full-time', workingDays: 'Mon–Fri', workingHours: '07:00–16:00', mobile: '+971 52 874 2210', language: 'English · Arabic', skills: ['Cleaning', 'Deep Cleaning'], zones: ['Z01', 'Z02', 'Z08'], docs: 'Verified', status: 'available', color: '#6c63d9' },
  { id: 'STF-0038', name: 'Ravi Kumar', gender: 'Male', role: 'Technician', employment: 'Full-time', workingDays: 'Sun–Thu', workingHours: '10:00–19:00', mobile: '+971 55 390 1184', language: 'English · Hindi', skills: ['AC Service', 'Handyman'], zones: ['Z03', 'Z04', 'Z05'], docs: 'Verified', status: 'busy', color: '#2c8b7b' },
  { id: 'STF-0034', name: 'Fatima Zahra', gender: 'Female', role: 'Specialist', employment: 'Part-time', workingDays: 'Tue–Sun', workingHours: '08:00–17:00', mobile: '+971 50 612 4473', language: 'English · Urdu', skills: ['Cleaning', 'Beauty & Wellness'], zones: ['Z01', 'Z09'], docs: 'Expiring', status: 'available', color: '#d17a45' },
  { id: 'STF-0029', name: 'Arjun Singh', gender: 'Male', role: 'Technician', employment: 'Full-time', workingDays: 'Wed–Sun', workingHours: '10:00–19:00', mobile: '+971 56 338 9017', language: 'English · Hindi', skills: ['Painting', 'Handyman'], zones: ['Z05', 'Z06', 'Z07'], docs: 'Verified', status: 'leave', color: '#3976b8' },
  { id: 'STF-0024', name: 'Lina Santos', gender: 'Female', role: 'Cleaner', employment: 'Full-time', workingDays: 'Mon–Sat', workingHours: '07:00–16:00', mobile: '+971 54 480 2216', language: 'English · Tagalog', skills: ['Deep Cleaning'], zones: ['Z02', 'Z03', 'Z04'], docs: 'Verified', status: 'busy', color: '#9b5e9d' },
  { id: 'STF-0018', name: 'Ahmed Nasser', gender: 'Male', role: 'Technician', employment: 'Full-time', workingDays: 'Sun–Thu', workingHours: '09:00–18:00', mobile: '+971 50 991 7625', language: 'Arabic · English', skills: ['AC Service', 'Handyman'], zones: ['Z08', 'Z09', 'Z10'], docs: 'Expiring', status: 'available', color: '#3d8e55' },
])
const staffKeyword = ref('')
const staffSkill = ref('')
const staffStatus = ref('')
const filteredStaff = computed(() => staff.value.filter((person) => {
  const keyword = staffKeyword.value.trim().toLowerCase()
  const matchesKeyword = !keyword || `${person.name} ${person.id} ${person.mobile}`.toLowerCase().includes(keyword)
  return matchesKeyword && (!staffSkill.value || person.skills.includes(staffSkill.value)) && (!staffStatus.value || person.status === staffStatus.value)
}))
const staffDialogVisible = ref(false)
const newStaff = reactive({ name: '', id: 'STF-0043', mobile: '', gender: 'Female', role: 'Cleaner', skill: 'Cleaning' })

const addStaff = () => {
  if (!newStaff.name.trim()) return ElMessage.warning('请输入人员姓名')
  staff.value.unshift({ id: newStaff.id, name: newStaff.name, gender: newStaff.gender, role: newStaff.role, employment: 'Full-time', workingDays: 'Mon–Fri', workingHours: '08:00–17:00', mobile: newStaff.mobile || '+971 —', language: 'English', skills: [newStaff.skill], zones: ['Z01'], docs: 'Expiring', status: 'available', color: '#5966b1' })
  staffDialogVisible.value = false
  ElMessage.success('Demo 人员已添加')
}

const staffStatusLabel = (status: StaffStatus) => ({ available: '可派', busy: '服务中', leave: '休假' })[status]
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

const scheduleSkill = ref('all')
const scheduleView = ref('week')
const weekDays = [
  { key: 'mon', weekday: '周一', date: '09/21', orders: 18 },
  { key: 'tue', weekday: '周二', date: '09/22', orders: 21 },
  { key: 'wed', weekday: '周三', date: '09/23', orders: 24 },
  { key: 'thu', weekday: '周四', date: '09/24', orders: 26, today: true },
  { key: 'fri', weekday: '周五', date: '09/25', orders: 23 },
  { key: 'sat', weekday: '周六', date: '09/26', orders: 31 },
  { key: 'sun', weekday: '周日', date: '09/27', orders: 28 },
]
const schedulePeople = staff.value.slice(0, 5).map((person) => ({ id: person.id, name: person.name, color: person.color, skill: person.skills[0] }))
type Shift = { type: string; label?: string; time?: string; orders?: string }
const shifts: Record<string, Shift> = {
  'STF-0042-mon': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '3 orders' }, 'STF-0042-tue': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0042-wed': { type: 'busy', label: '长班', time: '07:00–19:00', orders: '6 orders' }, 'STF-0042-thu': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0042-fri': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '3 orders' }, 'STF-0042-sat': { type: 'leave', label: '休假', time: 'Approved', orders: '' }, 'STF-0042-sun': { type: 'open' },
  'STF-0038-mon': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0038-tue': { type: 'busy', label: '中班', time: '10:00–21:00', orders: '6 orders' }, 'STF-0038-wed': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0038-thu': { type: 'busy', label: '长班', time: '09:00–21:00', orders: '7 orders' }, 'STF-0038-fri': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0038-sat': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '4 orders' }, 'STF-0038-sun': { type: 'leave', label: '休息', time: 'Day off', orders: '' },
  'STF-0034-mon': { type: 'leave', label: '休息', time: 'Day off', orders: '' }, 'STF-0034-tue': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '3 orders' }, 'STF-0034-wed': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '4 orders' }, 'STF-0034-thu': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '4 orders' }, 'STF-0034-fri': { type: 'open' }, 'STF-0034-sat': { type: 'busy', label: '长班', time: '09:00–21:00', orders: '7 orders' }, 'STF-0034-sun': { type: 'busy', label: '长班', time: '09:00–21:00', orders: '6 orders' },
  'STF-0029-mon': { type: 'leave', label: '年假', time: 'Annual leave', orders: '' }, 'STF-0029-tue': { type: 'leave', label: '年假', time: 'Annual leave', orders: '' }, 'STF-0029-wed': { type: 'leave', label: '年假', time: 'Annual leave', orders: '' }, 'STF-0029-thu': { type: 'open' }, 'STF-0029-fri': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '3 orders' }, 'STF-0029-sat': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0029-sun': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '3 orders' },
  'STF-0024-mon': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0024-tue': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0024-wed': { type: 'open' }, 'STF-0024-thu': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0024-fri': { type: 'busy', label: '长班', time: '07:00–19:00', orders: '6 orders' }, 'STF-0024-sat': { type: 'busy', label: '长班', time: '07:00–19:00', orders: '7 orders' }, 'STF-0024-sun': { type: 'leave', label: '休息', time: 'Day off', orders: '' },
}
const shiftFor = (personId: string, day: string) => shifts[`${personId}-${day}`] || { type: 'open' }
const shiftDialogVisible = ref(false)
const shiftConflict = ref(false)
const shiftForm = reactive<{ staff: string; type: string; date: string; time: Date[]; note: string }>({ staff: 'STF-0042', type: 'shift', date: '2026-09-24', time: [], note: '' })
const openShift = (person: { id: string }, day: { key: string; date: string }) => {
  shiftForm.staff = person.id
  shiftForm.date = `2026-${day.date.replace('/', '-')}`
  shiftConflict.value = false
  shiftDialogVisible.value = true
}
const validateShift = () => {
  if (!shiftConflict.value && shiftForm.staff === 'STF-0042') { shiftConflict.value = true; return }
  shiftDialogVisible.value = false
  shiftConflict.value = false
  ElMessage.success('排班动作已保存')
}

const orderKeyword = ref('')
const orderServiceKeyword = ref('')
const orderCategory = ref<number | null>(null)
const orderDateRange = ref<string[]>([])
const orderDrawerVisible = ref(false)
const orderDetailLoading = ref(false)
const selectedOrder = ref<any>(null)
let orderDetailRequest = 0
const orderMoney = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const openAssignedOrder = (row: any) => {
  selectedOrder.value = row
  orderDrawerVisible.value = true
  const orderId = Number(row?.orderId)
  if (orderId) loadOrderDetail(orderId)
}
const serviceStep = (row: any) => {
  const status = Number(row?.serviceStatus)
  return status === 1 || status === 2 || status === 3 ? status : 0
}
const serviceStatusText = (row: any) => {
  const localized = specText(row?.serviceStatusI18n)
  if (localized !== '—') return localized
  const status = serviceStep(row)
  if (status === 3) return t('admin.supplierOrders.departed')
  if (status === 1) return t('admin.supplierOrders.arrived')
  if (status === 2) return t('admin.supplierOrders.completed')
  return t('admin.supplierOrders.notStarted')
}
const serviceStatusTag = (status: unknown) => {
  const step = Number(status)
  if (step === 2) return 'success'
  if (step === 1 || step === 3) return 'warning'
  return 'info'
}
const orderClock = (value: unknown) => {
  if (value == null || value === '') return '—'
  const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const orderPhotos = (value: unknown) => (Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [])
const serviceAction = reactive({
  open: false,
  mode: 'arrive' as 'arrive' | 'complete',
  orderId: 0,
  orderNo: '',
  remark: '',
  photos: [] as Array<{ name: string; url: string }>,
  uploading: false,
  saving: false,
})
const openServiceAction = (row: any, mode: 'arrive' | 'complete') => {
  serviceAction.mode = mode
  serviceAction.orderId = Number(row.orderId)
  serviceAction.orderNo = row.orderNo || ''
  serviceAction.remark = ''
  serviceAction.photos = []
  serviceAction.open = true
}
const addServicePhotos = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files || [])
  input.value = ''
  const room = 20 - serviceAction.photos.length
  if (room <= 0 || picked.length > room) {
    ElMessage.warning(t('admin.supplierOrders.photoLimit'))
    if (room <= 0) return
  }
  const batch = picked.slice(0, Math.max(room, 0))
  serviceAction.uploading = true
  try {
    for (const file of batch) {
      const uploaded = unwrap(await uploadFile(file))
      const url = typeof uploaded === 'string' ? uploaded : uploaded?.url || ''
      if (url) serviceAction.photos.push({ name: file.name, url })
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierOrders.actionFailed'))
  } finally {
    serviceAction.uploading = false
  }
}
const departForService = async (row: any) => {
  const orderId = Number(row?.orderId)
  if (!orderId) return
  try {
    await ElMessageBox.confirm(
      t('admin.supplierOrders.departConfirm', { orderNo: row.orderNo || '—' }),
      t('admin.supplierOrders.departTitle'),
    )
  } catch {
    return
  }
  orderLoading.value = true
  try {
    await supplierDepart({ orderId })
    ElMessage.success(t('admin.supplierOrders.departSaved'))
    await loadOrders()
    if (orderDrawerVisible.value && Number(selectedOrder.value?.orderId) === orderId) await loadOrderDetail(orderId)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierOrders.actionFailed'))
  } finally {
    orderLoading.value = false
  }
}
const submitServiceAction = async () => {
  if (!serviceAction.orderId) return
  serviceAction.saving = true
  const payload = {
    orderId: serviceAction.orderId,
    photos: serviceAction.photos.map((photo) => photo.url),
    remark: serviceAction.remark.trim() || null,
  }
  try {
    if (serviceAction.mode === 'arrive') await supplierArrive(payload)
    else await supplierComplete(payload)
    ElMessage.success(t(serviceAction.mode === 'arrive' ? 'admin.supplierOrders.arriveSaved' : 'admin.supplierOrders.completeSaved'))
    serviceAction.open = false
    await loadOrders()
    if (orderDrawerVisible.value && Number(selectedOrder.value?.orderId) === serviceAction.orderId) {
      await loadOrderDetail(serviceAction.orderId)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierOrders.actionFailed'))
  } finally {
    serviceAction.saving = false
  }
}

const quoteCategory = ref('all')
const liveQuotes = ref<any[]>([])
const quoteDialog = reactive({
  visible: false,
  loading: false,
  saving: false,
  spuId: 0,
  name: '',
  nameI18n: null as Record<string, unknown> | null,
  category: '',
  categoryI18n: null as Record<string, unknown> | null,
  status: undefined as number | undefined,
  rejectReason: '',
  quoteMode: null as 1 | 2 | null,
  unitPrice: null as number | null,
  columns: [] as { key: string; nameI18n: Record<string, unknown> | null; fallback: string }[],
  rows: [] as any[],
  attaches: [] as Array<{ attachValueId: number; typeName: string; typeNameI18n?: Record<string, unknown> | null; name: string; nameI18n?: Record<string, unknown> | null; platformPrice: unknown; approvedPrice: unknown; offered: boolean; quotePrice: string }>,
})
const selectedAttachCount = computed(() => quoteDialog.attaches.filter((item) => item.offered).length)

const settlementTab = ref('transactions')
const settlementRows = [
  { webOrder: 'HX-260923-0138', jobId: 'JOB-88366', date: '23 Sep', service: 'Sofa Cleaning', staff: 'Fatima Zahra', base: 250, adjustment: 0, payable: 250, status: 'Pending', batch: 'PAY-2609-03' },
  { webOrder: 'HX-260922-0112', jobId: 'JOB-88321', date: '22 Sep', service: 'Deep Cleaning – 2BR', staff: 'Amina + Lina', base: 420, adjustment: -180, payable: 240, status: 'Pending', batch: 'PAY-2609-03' },
  { webOrder: 'HX-260920-0098', jobId: 'JOB-88274', date: '20 Sep', service: 'Split AC Cleaning', staff: 'Ravi Kumar', base: 360, adjustment: 0, payable: 360, status: 'Paid', batch: 'PAY-2609-02' },
  { webOrder: 'HX-260919-0071', jobId: 'JOB-88233', date: '19 Sep', service: 'Regular Cleaning', staff: 'Amina Noor', base: 224, adjustment: 0, payable: 224, status: 'Paid', batch: 'PAY-2609-02' },
]
const payoutBatches = [
  { batch: 'PAY-2609-03', period: '21–30 Sep 2026', orders: 42, amount: '12,680', paidAt: '30 Sep 2026', status: 'Pending' },
  { batch: 'PAY-2609-02', period: '11–20 Sep 2026', orders: 48, amount: '14,920', paidAt: '22 Sep 2026', status: 'Paid' },
  { batch: 'PAY-2609-01', period: '01–10 Sep 2026', orders: 36, amount: '10,820', paidAt: '12 Sep 2026', status: 'Paid' },
]

const showToast = (message: string) => ElMessage.success(message)

type SupplierArea = { areaId: number; areaName: string; status?: number }
type AreaCommunity = { id: number; name: string }
type AreaZone = { id: number; name: string }
const platformAreas = ref<any[]>([])
const supplierAreas = ref<SupplierArea[]>([])
const selectedAreaIds = ref<number[]>([])
const coveredCommunityIds = ref<number[] | null>(null)
const draftCommunityIds = ref<number[]>([])
const draftBareAreaIds = ref<number[]>([])
const expandedAreaIds = ref<number[]>([])
const areaKeyword = ref('')
const areaEditorVisible = ref(false)
const editorLoading = ref(false)
const areaCatalogReady = ref(false)
const communitiesByArea = ref<Record<number, AreaCommunity[]>>({})
const servicesProvided = ref('')
const expectedServiceIds = ref<string[]>([])
const expectedServicesKnown = ref(false)
const expectedServiceRemark = ref('')
const expectedCategoryLabels = ref<Record<string, string>>({})
const expectedServiceNameList = computed(() =>
  expectedServiceIds.value.map((id) => expectedCategoryLabels.value[id] || id).filter(Boolean),
)
const applyExpectedServices = (detail: any) => {
  const raw = detail?.expectedServiceCategoryIds
  if (!Array.isArray(raw)) {
    expectedServicesKnown.value = false
    expectedServiceIds.value = []
    expectedServiceRemark.value = ''
    return
  }
  expectedServicesKnown.value = true
  expectedServiceIds.value = raw.map((id: unknown) => String(id))
  expectedServiceRemark.value = String(detail?.expectedServiceRemark || '')
  listServiceCategories().then((options) => {
    const labels: Record<string, string> = {}
    options.forEach((option) => {
      labels[option.categoryId] = serviceCategoryLabel(option, String(locale.value || 'zh'))
    })
    expectedCategoryLabels.value = labels
  }).catch(() => {})
}
const dubaiServiceAreas = ref('')
const emaarOnboarded = ref<0 | 1>(0)
const otherCommunityOnboarded = ref<0 | 1>(0)
const applyRenmark = ref('')
const asYesNo = (value: unknown): 0 | 1 => (Number(value) === 1 ? 1 : 0)
const onOtherCommunityChange = (value: string | number | boolean) => {
  if (Number(value) !== 1) applyRenmark.value = ''
}
const LICENSE_AUTHORITY_OTHER = 'Other (type the authority name)'
const LICENSE_AUTHORITIES = [
  {
    emirate: 'Abu Dhabi',
    items: [
      'Abu Dhabi Department of Economic Development',
      'Abu Dhabi Global Market',
      'Khalifa Economic Zones Abu Dhabi',
      'Masdar City Free Zone',
      'twofour54 (Abu Dhabi media zone)',
      'Abu Dhabi Airports Free Zone',
    ],
  },
  {
    emirate: 'Dubai',
    items: [
      'Dubai Department of Economy and Tourism (formerly DED)',
      'Dubai Multi Commodities Centre',
      'Jebel Ali Free Zone',
      'Dubai Airport Freezone',
      'Dubai Silicon Oasis',
      'Dubai CommerCity',
      'International Free Zone Authority',
      'Meydan Free Zone',
      'Dubai South Free Zone',
      'Dubai World Trade Centre Free Zone',
      'Dubai International Financial Centre',
      'Dubai Healthcare City Authority',
      'Dubai Development Authority (TECOM free zones)',
      'Dubai Maritime City',
      'International Humanitarian City',
      'Expo City Dubai Free Zone',
      'Jebel Ali Free Zone Offshore',
    ],
  },
  {
    emirate: 'Sharjah',
    items: [
      'Sharjah Economic Development Department',
      'Sharjah Airport International Free Zone',
      'Hamriyah Free Zone',
      'Sharjah Media City',
      'Sharjah Publishing City Free Zone',
      'Sharjah Research, Technology and Innovation Park',
      'Sharjah Healthcare City',
    ],
  },
  {
    emirate: 'Ajman',
    items: [
      'Ajman Department of Economic Development',
      'Ajman Free Zone',
      'Ajman Media City Free Zone',
      'Ajman NuVentures Centre Free Zone',
    ],
  },
  {
    emirate: 'Umm Al Quwain',
    items: [
      'Umm Al Quwain Department of Economic Development',
      'Umm Al Quwain Free Trade Zone',
    ],
  },
  {
    emirate: 'Ras Al Khaimah',
    items: [
      'Ras Al Khaimah Department of Economic Development',
      'Ras Al Khaimah Economic Zone',
      'RAK Digital Assets Oasis',
      'RAK Maritime City Free Zone',
      'RAK International Corporate Centre',
    ],
  },
  {
    emirate: 'Fujairah',
    items: [
      'Fujairah Department of Industry and Economy',
      'Fujairah Free Zone',
      'Fujairah Creative City Free Zone',
    ],
  },
  {
    emirate: 'Other',
    items: [LICENSE_AUTHORITY_OTHER],
  },
]
const licenseAuthorities = LICENSE_AUTHORITIES
const licenseAuthorityValues = new Set(LICENSE_AUTHORITIES.flatMap((group) => group.items))
const onLicenseAuthorityChange = () => {
  if (companyForm.licenseIssuedBy !== LICENSE_AUTHORITY_OTHER) companyForm.licenseIssuedByOther = ''
}

type CatalogServiceDraft = {
  spuId: number
  spuName: string
  spuNameI18n: Record<string, unknown> | null
  available: boolean
  selected: boolean
  workerCount: number | null
  contactPhones: string[]
  acceptOrder: 0 | 1
}
type CatalogGroupDraft = {
  categoryId: number
  categoryName: string
  categoryNameI18n: Record<string, unknown> | null
  available: boolean
  services: CatalogServiceDraft[]
}
type SavedService = {
  spuId: number
  categoryId: number
  category: string
  categoryNameI18n: Record<string, unknown> | null
  name: string
  spuNameI18n: Record<string, unknown> | null
  workerCount: number | null
  phones: string[]
  acceptOrder: 0 | 1
}
type PickerService = CatalogServiceDraft & {
  categoryId: number
  categoryName: string
  categoryNameI18n: Record<string, unknown> | null
  added: boolean
}

const catalogDraft = ref<CatalogGroupDraft[]>([])
const savedServices = ref<SavedService[]>([])
watch(() => [companyForm.mobile, companyForm.mobileCode], syncWhatsapp)
const availabilityServices = computed(() => {
  const byId = new Map<number, { spuId: number; name: string }>()
  for (const quote of liveQuotes.value || []) {
    const spuId = Number(quote?.spuId)
    if (!spuId) continue
    const i18n = quote?.nameI18n && typeof quote.nameI18n === 'object' ? quote.nameI18n : null
    byId.set(spuId, { spuId, name: pickI18nText(i18n, locale.value, '') || String(quote?.spuName || '') })
  }
  for (const service of savedServices.value) {
    if (byId.has(service.spuId)) continue
    byId.set(service.spuId, { spuId: service.spuId, name: pickI18nText(service.spuNameI18n, locale.value, '') || service.name })
  }
  return [...byId.values()]
})
const availabilityAreas = computed(() => supplierAreas.value.map((area) => ({
  areaId: area.areaId,
  areaName: area.areaName,
})))
const catalogLoading = ref(false)
const catalogSaving = ref(false)
const quoteLoading = ref(false)
const addedKeyword = ref('')
type PickedDraft = {
  key: string
  categoryId: number
  category: string
  categoryNameI18n: Record<string, unknown> | null
  spuId: number
  name: string
  spuNameI18n: Record<string, unknown> | null
  workerCount: number | null
  phones: string[]
}
const servicePicker = reactive({
  open: false,
  categoryId: '' as number | '',
  keyword: '',
  drafts: [] as PickedDraft[],
})
const serviceEditor = reactive({
  open: false,
  spuId: 0,
  categoryId: 0,
  name: '',
  nameI18n: null as Record<string, unknown> | null,
  workerCount: null as number | null,
  phones: [''],
})

const flattenSelected = (groups: CatalogGroupDraft[]): SavedService[] => groups.flatMap((group) =>
  group.services
    .filter((service) => service.selected)
    .map((service) => ({
      spuId: service.spuId,
      categoryId: group.categoryId,
      category: group.categoryName,
      categoryNameI18n: group.categoryNameI18n,
      name: service.spuName,
      spuNameI18n: service.spuNameI18n,
      workerCount: service.workerCount,
      phones: service.contactPhones.map((phone) => phone.trim()).filter(Boolean),
      acceptOrder: service.acceptOrder === 0 ? 0 : 1,
    })),
)

const mapCatalog = (groups: any[]): CatalogGroupDraft[] => (groups || []).map((group) => ({
  categoryId: Number(group.categoryId),
  categoryName: group.categoryName || t('admin.supplierPricing.uncategorized'),
  categoryNameI18n: group.nameI18n && typeof group.nameI18n === 'object' ? group.nameI18n : null,
  available: group.available !== false,
  services: (group.services || []).map((service: any) => {
    const selected = Boolean(service.selected)
    const phones = Array.isArray(service.contactPhones) ? service.contactPhones.map((phone: unknown) => String(phone || '')) : []
    return {
      spuId: Number(service.spuId),
      spuName: service.spuName || t('admin.supplierPricing.serviceNamed', { id: service.spuId }),
      spuNameI18n: service.nameI18n && typeof service.nameI18n === 'object' ? service.nameI18n : null,
      available: service.available !== false,
      selected,
      workerCount: service.workerCount == null || service.workerCount === '' ? null : Number(service.workerCount),
      contactPhones: selected && !phones.length ? [''] : phones,
      acceptOrder: Number(service.acceptOrder) === 0 ? 0 : 1,
    }
  }),
}))

const rememberCatalog = (groups: CatalogGroupDraft[]) => {
  catalogDraft.value = groups
  savedServices.value = flattenSelected(groups)
}

const localizedCategory = (name: string, i18n?: Record<string, unknown> | null) =>
  pickI18nText(i18n || undefined, locale.value, '') || name
const serviceTitle = (name: string, i18n?: Record<string, unknown> | null) =>
  pickI18nText(i18n || undefined, locale.value, '') || name
const serviceHaystack = (name: string, i18n?: Record<string, unknown> | null) => {
  const extra = i18n
    ? Object.values(i18n).filter((value): value is string => typeof value === 'string').join(' ')
    : ''
  return `${name} ${serviceTitle(name, i18n)} ${extra}`.toLowerCase()
}
const serviceCategoryOptions = computed(() => {
  const seen = new Set<number>()
  return savedServices.value.flatMap((service) => {
    if (seen.has(service.categoryId)) return []
    seen.add(service.categoryId)
    return [{ id: service.categoryId, label: localizedCategory(service.category, service.categoryNameI18n) }]
  })
})
const pickKey = (service: { categoryId: number; spuId: number }) => `${service.categoryId}:${service.spuId}`
const addedKeys = computed(() => new Set(savedServices.value.map((service) => pickKey(service))))
const pickerCategoryId = computed(() => {
  const value = servicePicker.categoryId as number | '' | null | undefined
  return value === '' || value == null ? null : Number(value)
})
const pickerReady = computed(() => pickerCategoryId.value != null || servicePicker.keyword.trim().length > 0)
const pickerCategories = computed(() => catalogDraft.value.filter((group) => (
  group.available !== false && group.services.some((service) => service.available)
)))
const pickerVisible = computed(() => {
  if (!pickerReady.value) return [] as PickerService[]
  const keyword = servicePicker.keyword.trim().toLowerCase()
  const rows: PickerService[] = []
  catalogDraft.value.forEach((group) => {
    if (group.available === false) return
    if (pickerCategoryId.value != null && group.categoryId !== pickerCategoryId.value) return
    group.services.forEach((service) => {
      if (!service.available) return
      if (keyword && !serviceHaystack(service.spuName, service.spuNameI18n).includes(keyword)) return
      rows.push({
        ...service,
        categoryId: group.categoryId,
        categoryName: group.categoryName,
        categoryNameI18n: group.categoryNameI18n,
        added: addedKeys.value.has(pickKey({ categoryId: group.categoryId, spuId: service.spuId })),
      })
    })
  })
  return rows
})
const draftOf = (service: { categoryId: number; spuId: number }) => servicePicker.drafts.find((item) => item.key === pickKey(service))
const serviceRows = computed(() => {
  const quoteBySpu = new Map(liveQuotes.value.map((quote) => [Number(quote.spuId), quote]))
  return savedServices.value.map((service) => {
    const quote = quoteBySpu.get(service.spuId)
    return {
      ...service,
      status: quote?.status,
      rejectReason: quote?.rejectReason || '',
      quoteMode: quote?.quoteMode == null ? undefined : Number(quote.quoteMode),
      unitPrice: quote?.unitPrice,
    }
  })
})
const filteredServiceRows = computed(() => {
  const keyword = addedKeyword.value.trim().toLowerCase()
  return serviceRows.value.filter((row) => {
    if (quoteCategory.value !== 'all' && row.categoryId !== Number(quoteCategory.value)) return false
    if (!keyword) return true
    const category = localizedCategory(row.category, row.categoryNameI18n)
    return `${serviceHaystack(row.name, row.spuNameI18n)} ${category} ${row.category} ${row.phones.join(' ')}`.includes(keyword)
  })
})
const pendingQuoteCount = computed(() => serviceRows.value.filter((row) => Number(row.status) === 1).length)
const enabledServiceCount = computed(() => serviceRows.value.filter((row) => Number(row.acceptOrder) !== 0).length)
const resetPricingFilters = () => {
  quoteCategory.value = 'all'
  addedKeyword.value = ''
}
const addPhone = (holder: { phones: string[] }) => {
  if (holder.phones.length >= 10) return
  holder.phones.push('')
}
const removePhone = (holder: { phones: string[] }, index: number) => {
  holder.phones.splice(index, 1)
  if (!holder.phones.length) holder.phones.push('')
}
const togglePick = (service: PickerService, checked: boolean) => {
  const key = pickKey(service)
  if (!checked) {
    servicePicker.drafts = servicePicker.drafts.filter((item) => item.key !== key)
    return
  }
  if (servicePicker.drafts.some((item) => item.key === key)) return
  servicePicker.drafts.push({
    key,
    categoryId: service.categoryId,
    category: service.categoryName,
    categoryNameI18n: service.categoryNameI18n,
    spuId: service.spuId,
    name: service.spuName,
    spuNameI18n: service.spuNameI18n,
    workerCount: null,
    phones: [''],
  })
}
const openServicePicker = () => {
  servicePicker.categoryId = ''
  servicePicker.keyword = ''
  servicePicker.drafts = []
  servicePicker.open = true
}
const listedPhones = (phones: string[]) => (phones || []).map((phone) => phone.trim()).filter(Boolean)
const quoteModeLabel = (mode?: number) => (mode === 1 ? t('admin.supplierPricing.fixedPrice') : mode === 2 ? t('admin.supplierPricing.hourlyRate') : t('admin.supplierPricing.modeUnset'))
const phoneOk = (value: string) => /^[1-9]\d{7,14}$/.test(value.replace(/\D/g, ''))
const supplierOrders = ref<any[]>([])
const orderLoading = ref(false)
const orderTotal = ref(0)
const orderPage = ref(1)
const visibleOrderCount = computed(() => supplierOrders.value.length)
const activeOrdersOnPage = computed(() => supplierOrders.value.filter((order) => serviceStep(order) !== 2).length)
const completedOrdersOnPage = computed(() => supplierOrders.value.filter((order) => serviceStep(order) === 2).length)
const orderPageRange = computed(() => {
  const from = visibleOrderCount.value ? ((orderPage.value - 1) * 10) + 1 : 0
  const to = visibleOrderCount.value ? Math.min(from + visibleOrderCount.value - 1, orderTotal.value) : 0
  return t('admin.supplierOrders.pageRange', { from, to, total: orderTotal.value })
})
const hasOrderFilters = computed(() => Boolean(
  orderKeyword.value
  || orderServiceKeyword.value
  || orderCategory.value
  || orderDateRange.value.length,
))
const resetOrderFilters = () => {
  orderKeyword.value = ''
  orderServiceKeyword.value = ''
  orderCategory.value = null
  orderDateRange.value = []
  searchOrders()
}

const onboardingTagType = computed(() => {
  if (onboardingStatus.value === 2) return 'success'
  if (onboardingStatus.value === 3) return 'danger'
  if (onboardingStatus.value === 1) return 'warning'
  return 'info'
})
const areaCatalog = computed(() => {
  const map = new Map<number, AreaZone>()
  platformAreas.value.forEach((area) => {
    const id = Number(area.id)
    if (id) map.set(id, { id, name: String(area.name || `Area ${id}`) })
  })
  supplierAreas.value.forEach((area) => {
    if (!map.has(area.areaId)) map.set(area.areaId, { id: area.areaId, name: area.areaName || `Area ${area.areaId}` })
  })
  return [...map.values()]
})
const savedCoverage = computed(() => {
  const included = new Set<number>()
  const bare: number[] = []
  const explicit = coveredCommunityIds.value
  const selected = new Set(selectedAreaIds.value)
  areaCatalog.value.forEach((area) => {
    const communities = communitiesByArea.value[area.id] || []
    if (!communities.length) {
      if (selected.has(area.id)) bare.push(area.id)
      return
    }
    communities.forEach((community) => {
      if (explicit ? explicit.includes(community.id) : selected.has(area.id)) included.add(community.id)
    })
  })
  return { included: [...included], bare }
})
const coverageRows = computed(() => {
  const included = new Set(savedCoverage.value.included)
  const bare = new Set(savedCoverage.value.bare)
  return areaCatalog.value.map((area) => {
    const communities = communitiesByArea.value[area.id] || []
    return {
      ...area,
      communities,
      picked: communities.filter((community) => included.has(community.id)),
      bare: bare.has(area.id),
    }
  }).filter((row) => row.picked.length || row.bare)
})
const coveredCommunityCount = computed(() => savedCoverage.value.included.length)
const coverageSummary = (areas: number, communities: number) => t('admin.supplierArea.count', {
  areas: t(areas === 1 ? 'admin.supplierArea.oneArea' : 'admin.supplierArea.manyAreas', { count: areas }),
  communities: t(communities === 1 ? 'admin.supplierArea.oneCommunity' : 'admin.supplierArea.manyCommunities', { count: communities }),
})
const areaSelectionEmpty = computed(() => areaCatalogReady.value && !coverageRows.value.length)
const coverageLabel = (row: { communities: AreaCommunity[]; picked: AreaCommunity[] }) => {
  if (!row.communities.length) return t('admin.supplierArea.zoneOnly')
  if (row.picked.length === row.communities.length) return t('admin.supplierArea.allCoverage', { total: row.communities.length })
  return t('admin.supplierArea.partialCoverage', { count: row.picked.length, total: row.communities.length })
}
const editorZones = computed(() => {
  const keyword = areaKeyword.value.trim().toLowerCase()
  return areaCatalog.value.filter((area) => {
    if (!keyword) return true
    if (area.name.toLowerCase().includes(keyword)) return true
    return (communitiesByArea.value[area.id] || []).some((community) => community.name.toLowerCase().includes(keyword))
  })
})
const draftSummary = computed(() => {
  const picked = new Set(draftCommunityIds.value)
  let areas = draftBareAreaIds.value.length
  let communities = 0
  areaCatalog.value.forEach((area) => {
    const count = (communitiesByArea.value[area.id] || []).filter((community) => picked.has(community.id)).length
    if (!count) return
    areas += 1
    communities += count
  })
  return { areas, communities }
})
const zoneMode = (areaId: number) => {
  const communities = communitiesByArea.value[areaId] || []
  if (!communities.length) return draftBareAreaIds.value.includes(areaId) ? 'all' : 'none'
  const picked = communities.filter((community) => draftCommunityIds.value.includes(community.id)).length
  if (!picked) return 'none'
  return picked === communities.length ? 'all' : 'partial'
}
const bindZoneBox = (el: Element | null, areaId: number) => {
  if (el instanceof HTMLInputElement) el.indeterminate = zoneMode(areaId) === 'partial'
}
const highlight = (text: string) => {
  const keyword = areaKeyword.value.trim()
  if (!keyword) return [{ text, hit: false }]
  const lower = text.toLowerCase()
  const query = keyword.toLowerCase()
  const parts: { text: string; hit: boolean }[] = []
  let cursor = 0
  while (cursor < text.length) {
    const at = lower.indexOf(query, cursor)
    if (at < 0) {
      parts.push({ text: text.slice(cursor), hit: false })
      break
    }
    if (at > cursor) parts.push({ text: text.slice(cursor, at), hit: false })
    parts.push({ text: text.slice(at, at + keyword.length), hit: true })
    cursor = at + keyword.length
  }
  return parts.length ? parts : [{ text, hit: false }]
}
const communityDim = (areaName: string, communityName: string) => {
  const keyword = areaKeyword.value.trim().toLowerCase()
  if (!keyword || areaName.toLowerCase().includes(keyword)) return false
  return !communityName.toLowerCase().includes(keyword)
}
const toggleExpanded = (areaId: number) => {
  expandedAreaIds.value = expandedAreaIds.value.includes(areaId)
    ? expandedAreaIds.value.filter((id) => id !== areaId)
    : [...expandedAreaIds.value, areaId]
}
const toggleZone = (areaId: number) => {
  const communities = communitiesByArea.value[areaId] || []
  if (!communities.length) {
    draftBareAreaIds.value = draftBareAreaIds.value.includes(areaId)
      ? draftBareAreaIds.value.filter((id) => id !== areaId)
      : [...draftBareAreaIds.value, areaId]
    return
  }
  if (zoneMode(areaId) === 'all') {
    const drop = new Set(communities.map((community) => community.id))
    draftCommunityIds.value = draftCommunityIds.value.filter((id) => !drop.has(id))
    return
  }
  const next = new Set(draftCommunityIds.value)
  communities.forEach((community) => next.add(community.id))
  draftCommunityIds.value = [...next]
}
const onCommunityToggle = (id: number, event: Event) => {
  const checked = event.target instanceof HTMLInputElement && event.target.checked
  draftCommunityIds.value = checked
    ? Array.from(new Set([...draftCommunityIds.value, id]))
    : draftCommunityIds.value.filter((item) => item !== id)
}
const selectAllAreas = () => {
  const communities: number[] = []
  const bare: number[] = []
  areaCatalog.value.forEach((area) => {
    const rows = communitiesByArea.value[area.id] || []
    if (!rows.length) bare.push(area.id)
    else rows.forEach((community) => communities.push(community.id))
  })
  draftCommunityIds.value = communities
  draftBareAreaIds.value = bare
}
const clearAllAreas = () => {
  draftCommunityIds.value = []
  draftBareAreaIds.value = []
}

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const bit = (enabled: boolean) => (enabled ? 1 : 0)
const quoteStatusLabel = (status?: number) => [t('admin.supplierPricing.statusDraft'), t('admin.supplierPricing.statusPending'), t('admin.supplierPricing.statusApproved'), t('admin.supplierPricing.statusRejected')][status ?? -1] || t('admin.supplierPricing.statusNone')
const quoteTagType = (status?: number) => (Number(status) === 1 ? 'warning' : Number(status) === 2 ? 'success' : Number(status) === 3 ? 'danger' : 'info')
const moneyText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const yourPriceText = (row: { quoteMode?: number; unitPrice?: unknown }) => {
  if (Number(row.quoteMode) === 2 && row.unitPrice != null && row.unitPrice !== '') {
    return t('admin.supplierPricing.priceHourly', { price: moneyText(row.unitPrice) })
  }
  return Number(row.quoteMode) === 1 ? t('admin.supplierPricing.fixedPrice') : t('admin.supplierPricing.priceNotSet')
}
const supplierInitials = computed(() => {
  const raw = String(companyForm.companyName || '').trim()
  const parts = raw.split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts.slice(0, 2).map((part) => part[0] || '').join('') : raw.slice(0, 2)
  return letters || 'SP'
})
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
const localizedName = (i18n: unknown, plain?: unknown) => {
  const text = specText(i18n)
  if (text !== '—') return text
  const fallback = plain == null ? '' : String(plain).trim()
  return fallback || '—'
}
const quoteDialogTitle = computed(() => localizedName(quoteDialog.nameI18n, quoteDialog.name))
const quoteDialogCategory = computed(() => localizedName(quoteDialog.categoryI18n, quoteDialog.category))
const serviceEditorTitle = computed(() => localizedName(serviceEditor.nameI18n, serviceEditor.name) === '—'
  ? t('admin.supplierPricing.serviceFallback')
  : localizedName(serviceEditor.nameI18n, serviceEditor.name))
const attachDisplay = (item: { name?: string; nameI18n?: unknown; typeName?: string; typeNameI18n?: unknown }, kind: 'name' | 'type') => (
  kind === 'name' ? localizedName(item.nameI18n, item.name) : localizedName(item.typeNameI18n, item.typeName)
)
const orderCategoryOptions = computed(() => {
  locale.value
  return catalogDraft.value.map((group) => {
    const text = specText(group.categoryNameI18n)
    return { id: group.categoryId, label: text !== '—' ? text : group.categoryName }
  })
})
const orderServiceTitle = (row: any) => {
  const localized = specText(row?.spuNameI18n)
  if (localized !== '—') return localized
  if (row?.spuName) return row.spuName
  const names = (row?.lines || []).map((line: any) => orderServiceTitle(line)).filter((name: string) => name && name !== '—')
  return names.length ? names.join('、') : '—'
}
const orderSpecText = (row: any) => {
  const specs = Array.isArray(row?.specs) ? row.specs : []
  const text = specs.map((spec: any) => {
    const typeName = specText(spec?.typeNameI18n)
    const valueName = specText(spec?.valueNameI18n)
    const typeLabel = typeName !== '—' ? typeName : spec?.typeName
    const valueLabel = valueName !== '—' ? valueName : spec?.valueName
    return [typeLabel, valueLabel].filter((part) => part && part !== '—').join(': ')
  }).filter(Boolean)
  if (text.length) return text.join('; ')
  return row?.specDescription || '—'
}
const orderAddonText = (row: any) => {
  const attaches = Array.isArray(row?.attaches) ? row.attaches : []
  if (!attaches.length) {
    const extra = String(row?.additionalItems || '').trim()
    return !extra || extra === 'None' ? t('admin.supplierOrders.noAddons') : extra
  }
  return attaches.map((item: any) => {
    const localized = specText(item?.nameI18n)
    const name = localized !== '—' ? localized : item?.name
    if (!name) return ''
    const quantity = Number(item?.quantity)
    return quantity > 1 ? `${name} × ${quantity}` : name
  }).filter(Boolean).join(', ') || t('admin.supplierOrders.noAddons')
}
const orderAddonBrief = (row: any) => {
  const text = orderAddonText(row)
  return !text || text === t('admin.supplierOrders.noAddons') ? '' : text
}
const orderStartTime = (value?: string) => {
  const text = String(value || '').trim()
  const matched = text.match(/^(\d{1,2}:\d{2})\s*[-~–—～]\s*\d{1,2}:\d{2}$/)
  if (!matched) return text
  const [hour, minute] = matched[1].split(':')
  return `${hour.padStart(2, '0')}:${minute}`
}
const orderWhen = (row: any) => [row?.serviceDate, orderStartTime(row?.serviceTime)].filter(Boolean).join(', ') || '—'
const orderPhones = (row: any) => listedPhones((Array.isArray(row?.contactPhones) ? row.contactPhones : []).map((phone: unknown) => String(phone || '')))
const orderQuoteMode = (row: any) => {
  const localized = specText(row?.quoteModeI18n)
  if (localized !== '—') return localized
  return quoteModeLabel(row?.quoteMode == null ? undefined : Number(row.quoteMode))
}
const orderHours = (value: unknown) => {
  if (value == null || value === '') return '—'
  const hours = Number(value)
  if (!Number.isFinite(hours)) return '—'
  const text = Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)))
  return t('admin.supplierOrders.hoursValue', { hours: text })
}

const buildProfilePayload = (status?: number, areaIds?: number[]) => ({
  id: supplierRecordId.value || undefined,
  companyName: companyForm.companyName,
  tradeLicenseNo: companyForm.licenseNo,
  licenseExpiry: companyForm.licenseExpiry,
  vatTrn: companyForm.trn,
  officeAddress: companyForm.address,
  contactPerson: companyForm.contact,
  mobile: joinPhone(companyForm.mobileCode, companyForm.mobile),
  whatsapp: joinPhone(companyForm.whatsappCode, companyForm.whatsapp),
  email: companyForm.email,
  yearsInBusiness: companyForm.years,
  publicLiabilityInsurance: complianceItems[0].files.length ? 1 : 0,
  publicLiabilityInsuranceFile: complianceItems[0].files,
  employeeInsurance: complianceItems[1].files.length ? 1 : 0,
  employeeInsuranceFile: complianceItems[1].files,
  taxInvoiceAvailable: bit(complianceItems[2].enabled),
  ownEquipment: bit(complianceItems[3].enabled),
  ownTransportation: ownTransportation.value ? 1 : 0,
  totalAvailableWorkers: capacityForm.workers,
  maxSimultaneousOrders: capacityForm.concurrent,
  monthlyCapacity: capacityForm.monthly,
  minLeadTimeHours: capacityForm.leadTime,
  workingHours: capacityForm.start && capacityForm.end ? `${capacityForm.start}-${capacityForm.end}` : '',
  weekendService: bit(capacityToggles[1].enabled || capacityToggles[2].enabled),
  saturdayService: bit(capacityToggles[1].enabled),
  sundayService: bit(capacityToggles[2].enabled),
  publicHolidayService: bit(capacityToggles[3].enabled),
  sameDayBooking: bit(capacityToggles[4].enabled),
  emergencyService: bit(capacityToggles[5].enabled),
  femaleStaffAvailable: femaleStaffCount.value > 0 ? 1 : 0,
  femaleStaffCount: femaleStaffCount.value,
  maleStaffAvailable: maleStaffCount.value > 0 ? 1 : 0,
  maleStaffCount: maleStaffCount.value,
  servicesProvided: servicesProvided.value || null,
  ...(expectedServicesKnown.value ? {
    expectedServiceCategoryIds: categoryIdPayload(expectedServiceIds.value),
    expectedServiceRemark: expectedServiceRemark.value.trim() || null,
  } : {}),
  dubaiServiceAreas: dubaiServiceAreas.value || null,
  emaarOnboarded: asYesNo(emaarOnboarded.value),
  otherCommunityOnboarded: asYesNo(otherCommunityOnboarded.value),
  applyRenmark: asYesNo(otherCommunityOnboarded.value) === 1 ? (applyRenmark.value.trim() || null) : null,
  status,
  areaIds,
  extra: {
    ...profileExtra.value,
    licenseIssuedBy: companyForm.licenseIssuedBy || null,
    licenseIssuedByOther: companyForm.licenseIssuedBy === LICENSE_AUTHORITY_OTHER
      ? (companyForm.licenseIssuedByOther.trim() || null)
      : null,
    bank: { ...bankForm },
    tradeLicenseFiles: [...tradeLicenseFiles.value],
    otherDocuments: [...otherDocumentFiles.value],
  },
})

const applyProfile = (detail: any) => {
  supplierRecordId.value = detail?.id ?? null
  const status = detail?.status == null || detail?.status === '' ? null : Number(detail.status)
  onboardingStatus.value = Number.isFinite(status) ? status : null
  if (detail?.editable === false) profileEditable.value = false
  else if (detail?.editable === true) profileEditable.value = true
  else profileEditable.value = onboardingStatus.value !== 1
  snapshotVersion.value = detail?.snapshotVersion == null || detail?.snapshotVersion === ''
    ? null
    : Number(detail.snapshotVersion)
  supplierEnabled.value = Number(detail?.enabled) === 1
  supplierAcceptDispatch.value = detail?.acceptDispatch == null ? true : Number(detail.acceptDispatch) === 1
  rejectReason.value = detail?.rejectReason || ''
  companyForm.companyName = detail?.companyName || ''
  companyForm.licenseNo = detail?.tradeLicenseNo || ''
  const savedAuthority = String((detail?.extra && detail.extra.licenseIssuedBy) || '')
  const savedAuthorityOther = String((detail?.extra && detail.extra.licenseIssuedByOther) || '')
  if (savedAuthority === LICENSE_AUTHORITY_OTHER || (savedAuthority && !licenseAuthorityValues.has(savedAuthority))) {
    companyForm.licenseIssuedBy = LICENSE_AUTHORITY_OTHER
    companyForm.licenseIssuedByOther = savedAuthority === LICENSE_AUTHORITY_OTHER ? savedAuthorityOther : savedAuthority
  } else {
    companyForm.licenseIssuedBy = savedAuthority
    companyForm.licenseIssuedByOther = ''
  }
  companyForm.licenseExpiry = detail?.licenseExpiry || ''
  companyForm.trn = detail?.vatTrn || ''
  companyForm.years = detail?.yearsInBusiness || 0
  companyForm.address = detail?.officeAddress || ''
  companyForm.contact = detail?.contactPerson || ''
  companyForm.email = detail?.email || ''
  const mobilePhone = splitPhone(detail?.mobile)
  const whatsappPhone = splitPhone(detail?.whatsapp)
  companyForm.mobileCode = mobilePhone.code
  companyForm.mobile = mobilePhone.local
  companyForm.whatsappCode = whatsappPhone.code
  companyForm.whatsapp = whatsappPhone.local
  whatsappSame.value = Boolean(companyForm.mobile) && companyForm.mobileCode === companyForm.whatsappCode && companyForm.mobile === companyForm.whatsapp
  const extra = detail?.extra && typeof detail.extra === 'object' ? detail.extra : {}
  const bank = extra.bank && typeof extra.bank === 'object' ? extra.bank : {}
  profileExtra.value = { ...extra }
  bankForm.accountName = String(bank.accountName || '')
  bankForm.bankName = String(bank.bankName || '')
  bankForm.iban = String(bank.iban || '')
  bankForm.swift = String(bank.swift || '')
  bankForm.currency = String(bank.currency || 'AED')
  tradeLicenseFiles.value = asFileList(extra.tradeLicenseFiles)
  otherDocumentFiles.value = asFileList(extra.otherDocuments)
  if (!profileEditable.value) {
    profileView.value = 'all'
    profileFromAll.value = false
  } else if (!profileBooted.value) {
    profileView.value = 'section'
    profileSection.value = 0
    profileBooted.value = true
  }
  capacityForm.workers = detail?.totalAvailableWorkers || 0
  capacityForm.concurrent = detail?.maxSimultaneousOrders || 0
  capacityForm.monthly = detail?.monthlyCapacity || 0
  capacityForm.leadTime = detail?.minLeadTimeHours || 0
  const hours = String(detail?.workingHours || '').split('-')
  capacityForm.start = hours[0] || '08:00'
  capacityForm.end = hours[1] || '18:00'
  const legacyWeekend = detail?.weekendService == null || detail?.weekendService === ''
    ? true
    : Number(detail.weekendService) === 1
  capacityToggles[1].enabled = detail?.saturdayService == null || detail?.saturdayService === ''
    ? legacyWeekend
    : Number(detail.saturdayService) === 1
  capacityToggles[2].enabled = detail?.sundayService == null || detail?.sundayService === ''
    ? legacyWeekend
    : Number(detail.sundayService) === 1
  capacityToggles[0].enabled = capacityToggles[1].enabled || capacityToggles[2].enabled
  capacityToggles[3].enabled = detail?.publicHolidayService === 1
  capacityToggles[4].enabled = detail?.sameDayBooking === 1
  capacityToggles[5].enabled = detail?.emergencyService === 1
  complianceItems[0].enabled = detail?.publicLiabilityInsurance === 1
  complianceItems[0].files = asFileList(detail?.publicLiabilityInsuranceFile)
  complianceItems[1].enabled = detail?.employeeInsurance === 1
  complianceItems[1].files = asFileList(detail?.employeeInsuranceFile)
  complianceItems[2].enabled = detail?.taxInvoiceAvailable === 1
  complianceItems[3].enabled = detail?.ownEquipment === 1
  ownTransportation.value = detail?.ownTransportation === 1
  femaleStaffCount.value = detail?.femaleStaffCount || 0
  maleStaffCount.value = detail?.maleStaffCount || 0
  servicesProvided.value = detail?.servicesProvided || ''
  applyExpectedServices(detail)
  dubaiServiceAreas.value = detail?.dubaiServiceAreas || ''
  emaarOnboarded.value = asYesNo(detail?.emaarOnboarded)
  otherCommunityOnboarded.value = asYesNo(detail?.otherCommunityOnboarded)
  applyRenmark.value = otherCommunityOnboarded.value === 1 ? String(detail?.applyRenmark || '') : ''
  supplierAreas.value = (detail?.serviceAreas || [])
    .map((area: any) => ({
      areaId: Number(area.areaId),
      areaName: area.areaName || '',
      status: area.status,
    }))
    .filter((area: SupplierArea) => area.areaId)
  selectedAreaIds.value = supplierAreas.value.map((area) => area.areaId)
  const savedCoverage = extra?.coveredCommunityIds
  coveredCommunityIds.value = Array.isArray(savedCoverage)
    ? savedCoverage.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
    : null
  if (section.value === 'service-area') ensureAreaCatalog()
}

const loadSupplierDetail = async (id: number, fresh = false) => {
  const detail = await session.supplierDetail(id, fresh)
  applyProfile(detail)
  await Promise.all([
    loadCatalog(fresh),
    loadQuotes(fresh),
    section.value === 'orders' ? loadOrders() : Promise.resolve(),
  ])
}

const reloadOwnProfile = async () => {
  try {
    const detail = unwrap(await onboardingMine())
    if (!detail?.id) throw new Error('empty')
    applyProfile(detail)
    session.rememberSupplierDetail(detail)
    await Promise.all([
      loadCatalog(),
      loadQuotes(),
      section.value === 'orders' ? loadOrders() : Promise.resolve(),
    ])
  } catch {
    if (!supplierRecordId.value) throw new Error(t('admin.supplierProfile.loadFailed'))
    await loadSupplierDetail(supplierRecordId.value, true)
  }
}

const loadCurrentSupplier = async () => {
  const me = await session.currentUser()
  supplierNo.value = String(me?.supplierNo || '')
  const supplierId = Number(me?.supplierId || 0)
  if (!supplierId) {
    ElMessage.warning(t('admin.supplierProfile.noSupplier'))
    return
  }
  supplierRecordId.value = supplierId
  await reloadOwnProfile()
  if (section === 'profile') await loadCatalog()
}

const saveAvailabilityHours = async (next: { start: string; end: string; concurrent: number; saturday: boolean; sunday: boolean }) => {
  const previous = {
    start: capacityForm.start,
    end: capacityForm.end,
    concurrent: capacityForm.concurrent,
    saturday: capacityToggles[1].enabled,
    sunday: capacityToggles[2].enabled,
  }
  if (!profileEditable.value) {
    ElMessage.warning(t('admin.supplierProfile.locked'))
    return
  }
  capacityForm.start = next.start
  capacityForm.end = next.end
  capacityForm.concurrent = next.concurrent
  capacityToggles[1].enabled = next.saturday
  capacityToggles[2].enabled = next.sunday
  capacityToggles[0].enabled = next.saturday || next.sunday
  saving.value = true
  try {
    if (onboardingStatus.value === 2 || onboardingStatus.value === 3) {
      unwrap(await onboardingResubmit(buildProfilePayload(1)))
      ElMessage.success(t('admin.supplierProfile.resubmitted'))
      await reloadOwnProfile()
      return
    }
    const id = unwrap(await onboardingSave(buildProfilePayload(onboardingStatus.value ?? 0)))
    if (id) supplierRecordId.value = Number(id)
    ElMessage.success(t('admin.supplierAvailability.hoursSaved'))
    if (supplierRecordId.value) await loadSupplierDetail(supplierRecordId.value, true)
  } catch (error: any) {
    capacityForm.start = previous.start
    capacityForm.end = previous.end
    capacityForm.concurrent = previous.concurrent
    capacityToggles[1].enabled = previous.saturday
    capacityToggles[2].enabled = previous.sunday
    capacityToggles[0].enabled = previous.saturday || previous.sunday
    ElMessage.error(error?.message || t('admin.supplierAvailability.hoursFailed'))
  } finally {
    saving.value = false
  }
}

const toggleAcceptDispatch = async (next: boolean) => {
  if (!supplierRecordId.value || dispatchSaving.value) return
  const previous = supplierAcceptDispatch.value
  supplierAcceptDispatch.value = next
  dispatchSaving.value = true
  try {
    await supplierChangeAcceptDispatch({ id: supplierRecordId.value, acceptDispatch: next ? 1 : 0 })
    ElMessage.success(t('admin.supplierAvailability.dispatchSaved'))
  } catch (error: any) {
    supplierAcceptDispatch.value = previous
    ElMessage.error(error?.message || t('admin.supplierAvailability.dispatchFailed'))
  } finally {
    dispatchSaving.value = false
  }
}

const toggleServiceAccept = async (row: SavedService) => {
  if (!supplierRecordId.value || acceptOrderSaving.value != null) return
  const next: 0 | 1 = row.acceptOrder === 0 ? 1 : 0
  const previous = savedServices.value.map((service) => ({ ...service }))
  savedServices.value = savedServices.value.map((service) => (
    service.spuId === row.spuId ? { ...service, acceptOrder: next } : service
  ))
  acceptOrderSaving.value = row.spuId
  try {
    await supplierChangeAcceptOrder({ supplierId: supplierRecordId.value, spuId: row.spuId, acceptOrder: next })
    ElMessage.success(t(next === 1 ? 'admin.supplierPricing.acceptEnabled' : 'admin.supplierPricing.acceptDisabled'))
  } catch (error: any) {
    savedServices.value = previous
    ElMessage.error(error?.message || t('admin.supplierPricing.acceptFailed'))
  } finally {
    acceptOrderSaving.value = null
  }
}

const uaeLocalOk = (value: string) => nationalNumberOk(value)
const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}
const disableLicenseDate = (date: Date) => date.getTime() <= startOfToday().getTime()
const licenseAfterToday = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const picked = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return picked.getTime() > startOfToday().getTime()
}
const profileProblem = (status: number) => {
  if (status === 1) return profileIssues.value[0]?.message || ''
  if (companyForm.licenseExpiry && !licenseAfterToday(companyForm.licenseExpiry)) return t('admin.supplierProfile.licenseExpiryHint')
  if ((companyForm.mobile || companyForm.whatsapp) && (!uaeLocalOk(companyForm.mobile) || !uaeLocalOk(companyForm.whatsapp))) {
    return t('admin.supplierProfile.phoneInvalid')
  }
  return ''
}

const profileIssues = computed(() => {
  const issues: Array<{ id: string; section: number; label: string; message: string }> = []
  const add = (id: string, section: number, label: string, ok: boolean, message: string) => {
    if (!ok) issues.push({ id, section, label, message })
  }
  add('companyName', 0, t('admin.supplierProfile.companyName'), Boolean(companyForm.companyName.trim()), t('admin.supplierProfile.nameRequired'))
  add('licenseNo', 0, t('admin.supplierProfile.licenseNo'), Boolean(companyForm.licenseNo.trim()), t('admin.supplierProfile.licenseRequired'))
  add('licenseIssuedBy', 0, t('admin.supplierProfile.licenseIssuedBy'), Boolean(companyForm.licenseIssuedBy.trim()), t('admin.supplierProfile.licenseIssuedByRequired'))
  add('licenseIssuedByOther', 0, t('admin.supplierProfile.licenseIssuedBy'), companyForm.licenseIssuedBy !== LICENSE_AUTHORITY_OTHER || Boolean(companyForm.licenseIssuedByOther.trim()), t('admin.supplierProfile.licenseIssuedByOtherRequired'))
  add('licenseExpiry', 0, t('admin.supplierProfile.licenseExpiry'), licenseAfterToday(companyForm.licenseExpiry), t('admin.supplierProfile.licenseExpiryHint'))
  add('address', 0, t('admin.supplierProfile.address'), Boolean(companyForm.address.trim()), t('admin.supplierProfile.addressRequired'))
  add('contact', 1, t('admin.supplierProfile.contactPerson'), Boolean(companyForm.contact.trim()), t('admin.supplierProfile.contactRequired'))
  add('email', 1, t('admin.supplierProfile.email'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.email.trim()), t('admin.supplierProfile.emailRequired'))
  add('mobile', 1, t('admin.supplierProfile.mobile'), uaeLocalOk(companyForm.mobile), t('admin.supplierProfile.phoneInvalid'))
  add('whatsapp', 1, t('admin.supplierProfile.whatsapp'), whatsappSame.value ? uaeLocalOk(companyForm.mobile) : uaeLocalOk(companyForm.whatsapp), t('admin.supplierProfile.whatsappRequired'))
  add('communities', 2, t('admin.supplierProfile.applyRenmark'), asYesNo(otherCommunityOnboarded.value) !== 1 || Boolean(applyRenmark.value.trim()), t('admin.supplierProfile.communityRequired'))
  add('tradeLicense', 4, t('admin.supplierProfile.tradeLicenseFile'), tradeLicenseFiles.value.length > 0, t('admin.supplierProfile.tradeFileRequired'))
  return issues
})
const issueOf = (id: string) => profileIssues.value.find((item) => item.id === id)?.message || ''
const sectionHasIssue = (index: number) => profileIssues.value.some((item) => item.section === index)
const lightboxTitle = computed(() => profileView.value === 'all'
  ? (companyForm.companyName || t('admin.supplierProfile.untitled'))
  : activeProfileSection.value.title)
const lightboxDesc = computed(() => profileView.value === 'all'
  ? t('admin.supplierProfile.allDesc')
  : activeProfileSection.value.desc)
const lightboxCrumb = computed(() => {
  if (profileView.value === 'all') return t('admin.supplierProfile.title')
  if (profileFromAll.value) return t('admin.supplierProfile.editingCrumb')
  return t('admin.supplierProfile.stepOf', { current: profileSection.value + 1, total: 5 })
})
const bankComplete = computed(() => Boolean(
  bankForm.accountName.trim() && bankForm.bankName.trim() && bankForm.iban.trim(),
))
const sectionIncomplete = (index: number) => index === 3 ? !bankComplete.value : sectionHasIssue(index)
const lightboxChip = computed(() => {
  if (profileView.value === 'all' && !profileEditable.value) return t('admin.supplierProfile.submittedChip')
  const bad = profileView.value === 'all'
    ? profileIssues.value.length > 0 || !bankComplete.value
    : sectionIncomplete(profileSection.value)
  return bad ? t('admin.supplierProfile.needsFix') : t('admin.supplierProfile.completed')
})
const lightboxChipClass = computed(() => {
  if (profileView.value === 'all' && !profileEditable.value) return 'is-wait'
  const bad = profileView.value === 'all'
    ? profileIssues.value.length > 0 || !bankComplete.value
    : sectionIncomplete(profileSection.value)
  return bad ? 'is-warn' : 'is-ok'
})
const selectedServiceNames = computed(() => [...new Set(savedServices.value.map((service) => serviceTitle(service.name, service.spuNameI18n)).filter(Boolean))])
const insuranceDocs = computed(() => [
  { id: 'public' as const, label: t('admin.supplierProfile.publicLiability'), files: complianceItems[0].files },
  { id: 'employee' as const, label: t('admin.supplierProfile.employeeInsurance'), files: complianceItems[1].files },
])
const jumpProfileField = async (issue: { section: number; id: string }) => {
  profileFromAll.value = false
  profileView.value = 'section'
  profileSection.value = issue.section
  await nextTick()
  document.getElementById(`profile-field-${issue.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
const submitProfileForm = () => {
  if (!profileEditable.value) {
    ElMessage.warning(t('admin.supplierProfile.locked'))
    return
  }
  submitTried.value = true
  if (profileIssues.value.length) {
    scrollProfileTop()
    return
  }
  if (needsResubmit.value) resubmitProfile()
  else saveProfile(1)
}
const docFiles = (id: 'trade' | 'public' | 'employee' | 'other') => {
  if (id === 'trade') return tradeLicenseFiles.value
  if (id === 'other') return otherDocumentFiles.value
  return id === 'public' ? complianceItems[0].files : complianceItems[1].files
}
const removeDocFile = (id: 'trade' | 'public' | 'employee' | 'other', index: number) => {
  docFiles(id).splice(index, 1)
}

const resubmitProfile = async () => {
  if (!profileEditable.value) {
    ElMessage.warning(t('admin.supplierProfile.locked'))
    return
  }
  const problem = profileProblem(1)
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  saving.value = true
  try {
    unwrap(await onboardingResubmit(buildProfilePayload(1)))
    ElMessage.success(t('admin.supplierProfile.resubmitted'))
    await reloadOwnProfile()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierProfile.saveFailed'))
  } finally {
    saving.value = false
  }
}

const saveProfile = async (status: number) => {
  if (!profileEditable.value) {
    ElMessage.warning(t('admin.supplierProfile.locked'))
    return
  }
  const problem = profileProblem(status)
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  saving.value = true
  try {
    const id = unwrap(await onboardingSave(buildProfilePayload(status)))
    if (id) supplierRecordId.value = Number(id)
    onboardingStatus.value = status
    ElMessage.success(t(status === 1 ? 'admin.supplierProfile.submitted' : 'admin.supplierProfile.draftSaved'))
    if (supplierRecordId.value) await loadSupplierDetail(supplierRecordId.value, true)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierProfile.saveFailed'))
  } finally {
    saving.value = false
  }
}

const removeInsuranceFile = (fileKey: string | undefined, index: number) => {
  const target = complianceItems.find((item) => item.fileKey === fileKey)
  if (target) target.files.splice(index, 1)
}

const uploadInsurance = async (fileKey: string | undefined, options: any) => {
  try {
    const target = complianceItems.find((item) => item.fileKey === fileKey)
    if (target && target.files.length >= 20) {
      throw new Error(t('admin.supplierProfile.uploadLimit'))
    }
    const url = unwrap(await uploadFile(options.file as File))
    const fileUrl = typeof url === 'string' ? url : url?.url || ''
    if (target && fileUrl && !target.files.includes(fileUrl)) target.files.push(fileUrl)
    options.onSuccess?.(url)
    ElMessage.success(t('admin.supplierProfile.uploaded'))
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || t('admin.supplierProfile.uploadFailed'))
  }
}

const uploadDocFile = async (id: 'trade' | 'public' | 'employee' | 'other', options: any) => {
  try {
    const files = docFiles(id)
    if (files.length >= 20) throw new Error(t('admin.supplierProfile.uploadLimit'))
    const url = unwrap(await uploadFile(options.file as File))
    const fileUrl = typeof url === 'string' ? url : url?.url || ''
    if (fileUrl && !files.includes(fileUrl)) files.push(fileUrl)
    options.onSuccess?.(url)
    ElMessage.success(t('admin.supplierProfile.uploaded'))
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || t('admin.supplierProfile.uploadFailed'))
  }
}

const loadCommunityRecords = async (areaId: number) => {
  const rows: AreaCommunity[] = []
  let pageNum = 1
  let total = Number.POSITIVE_INFINITY
  while (rows.length < total && pageNum <= 8) {
    const page = unwrap(await serviceCommunityPage({ areaId, pageNum, pageSize: 200, status: 1 }))
    const list = Array.isArray(page?.list) ? page.list : []
    total = Number(page?.total ?? list.length)
    rows.push(...list.map((item: any) => ({ id: Number(item.id), name: String(item.name || '') })).filter((item: AreaCommunity) => item.id))
    if (!list.length) break
    pageNum += 1
  }
  return rows
}

let areaCatalogChain: Promise<void> = Promise.resolve()
const loadMissingAreas = async () => {
  editorLoading.value = true
  try {
    if (!platformAreas.value.length) platformAreas.value = await session.serviceAreas()
    const wanted = new Set<number>()
    platformAreas.value.forEach((area) => {
      const id = Number(area.id)
      if (id) wanted.add(id)
    })
    supplierAreas.value.forEach((area) => {
      if (area.areaId) wanted.add(area.areaId)
    })
    const missing = [...wanted].filter((id) => communitiesByArea.value[id] == null)
    if (missing.length) {
      const loaded = await Promise.all(missing.map(async (areaId) => [areaId, await loadCommunityRecords(areaId)] as const))
      const next = { ...communitiesByArea.value }
      loaded.forEach(([areaId, communities]) => {
        next[areaId] = communities
      })
      communitiesByArea.value = next
    }
    areaCatalogReady.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierArea.loadFailed'))
  } finally {
    editorLoading.value = false
  }
}
const ensureAreaCatalog = () => {
  areaCatalogChain = areaCatalogChain.then(loadMissingAreas, loadMissingAreas)
  return areaCatalogChain
}

const seedAreaDraft = () => {
  draftCommunityIds.value = [...savedCoverage.value.included]
  draftBareAreaIds.value = [...savedCoverage.value.bare]
}

const openAreaEditor = async () => {
  if (!supplierRecordId.value) {
    ElMessage.warning(t('admin.supplierArea.saveProfileFirst'))
    return
  }
  areaKeyword.value = ''
  expandedAreaIds.value = []
  areaEditorVisible.value = true
  await ensureAreaCatalog()
  seedAreaDraft()
}

const areaNameById = (id: number) => {
  const platform = platformAreas.value.find((area) => Number(area.id) === id)
  if (platform?.name) return String(platform.name)
  return supplierAreas.value.find((area) => area.areaId === id)?.areaName || ''
}

const chosenAreaIds = () => {
  const picked = new Set(draftCommunityIds.value)
  return areaCatalog.value.filter((area) => {
    const communities = communitiesByArea.value[area.id] || []
    if (!communities.length) return draftBareAreaIds.value.includes(area.id)
    return communities.some((community) => picked.has(community.id))
  }).map((area) => area.id)
}

const saveAreas = async () => {
  if (!companyForm.companyName) {
    ElMessage.warning(t('admin.supplierArea.profileRequired'))
    return
  }
  const areaIds = chosenAreaIds()
  const previousAreas = dubaiServiceAreas.value
  const previousExtra = profileExtra.value
  const previousCovered = coveredCommunityIds.value
  dubaiServiceAreas.value = areaIds.map(areaNameById).filter(Boolean).join(', ')
  profileExtra.value = { ...profileExtra.value, coveredCommunityIds: [...draftCommunityIds.value] }
  coveredCommunityIds.value = [...draftCommunityIds.value]
  saving.value = true
  try {
    const id = unwrap(await onboardingSave(buildProfilePayload(onboardingStatus.value ?? undefined, areaIds)))
    if (id) supplierRecordId.value = Number(id)
    areaEditorVisible.value = false
    ElMessage.success(t('admin.supplierArea.saved'))
    if (supplierRecordId.value) await loadSupplierDetail(supplierRecordId.value, true)
  } catch (error: any) {
    dubaiServiceAreas.value = previousAreas
    profileExtra.value = previousExtra
    coveredCommunityIds.value = previousCovered
    ElMessage.error(error?.message || t('admin.supplierArea.saveFailed'))
  } finally {
    saving.value = false
  }
}

const loadCatalog = async (fresh = false) => {
  if (!supplierRecordId.value) return
  catalogLoading.value = true
  try {
    rememberCatalog(mapCatalog(await session.catalog(supplierRecordId.value, fresh) || []))
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierPricing.catalogFailed'))
  } finally {
    catalogLoading.value = false
  }
}

const cleanPhones = (phones: string[]) => phones.map((phone) => phone.trim()).filter(Boolean)
const contactProblem = (name: string, workerCount: number | null, phones: string[]) => {
  const list = cleanPhones(phones)
  if (!(Number(workerCount) > 0)) return t('admin.supplierPricing.workerRequired', { name })
  if (!list.length) return t('admin.supplierPricing.phoneRequired', { name })
  if (list.length > 10) return t('admin.supplierPricing.phoneMax', { name })
  const invalid = list.find((phone) => !phoneOk(phone))
  if (invalid) return t('admin.supplierPricing.phoneInvalid', { name, phone: invalid })
  return ''
}
const persistServices = async (rows: SavedService[], success: string) => {
  if (!supplierRecordId.value) return false
  const grouped = new Map<number, { categoryId: number; items: Array<{ spuId: number; workerCount: number; contactPhones: string[]; acceptOrder: 0 | 1 }> }>()
  rows.forEach((row) => {
    const group = grouped.get(row.categoryId) || { categoryId: row.categoryId, items: [] }
    group.items.push({
      spuId: row.spuId,
      workerCount: Number(row.workerCount),
      contactPhones: cleanPhones(row.phones),
      acceptOrder: row.acceptOrder === 0 ? 0 : 1,
    })
    grouped.set(row.categoryId, group)
  })
  catalogSaving.value = true
  try {
    await saveServices({ supplierId: supplierRecordId.value, services: [...grouped.values()] })
    ElMessage.success(success)
    await Promise.all([loadCatalog(true), loadQuotes(true)])
    return true
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierPricing.saveServicesFailed'))
    return false
  } finally {
    catalogSaving.value = false
  }
}
const confirmAddServices = async () => {
  if (!servicePicker.drafts.length) {
    ElMessage.warning(t('admin.supplierPricing.selectFirst'))
    return
  }
  const problem = servicePicker.drafts.map((draft) => contactProblem(draft.name, draft.workerCount, draft.phones)).find(Boolean)
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  const next = [...savedServices.value]
  servicePicker.drafts.forEach((draft) => {
    if (addedKeys.value.has(draft.key)) return
    next.push({
      spuId: draft.spuId,
      categoryId: draft.categoryId,
      category: draft.category,
      categoryNameI18n: draft.categoryNameI18n,
      name: draft.name,
      spuNameI18n: draft.spuNameI18n,
      workerCount: Number(draft.workerCount),
      phones: cleanPhones(draft.phones),
      acceptOrder: 1,
    })
  })
  const saved = await persistServices(next, t('admin.supplierPricing.addedSuccess', { count: servicePicker.drafts.length }))
  if (saved) servicePicker.open = false
}
const openServiceEditor = (row: SavedService) => {
  serviceEditor.spuId = row.spuId
  serviceEditor.categoryId = row.categoryId
  serviceEditor.name = row.name
  serviceEditor.nameI18n = row.spuNameI18n
  serviceEditor.workerCount = row.workerCount
  serviceEditor.phones = row.phones.length ? [...row.phones] : ['']
  serviceEditor.open = true
}
const saveServiceEditor = async () => {
  const problem = contactProblem(serviceEditorTitle.value || t('admin.supplierPricing.thisService'), serviceEditor.workerCount, serviceEditor.phones)
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  const phones = cleanPhones(serviceEditor.phones)
  const next = savedServices.value.map((service) => (
    service.spuId === serviceEditor.spuId && service.categoryId === serviceEditor.categoryId
      ? { ...service, workerCount: Number(serviceEditor.workerCount), phones }
      : service
  ))
  const saved = await persistServices(next, t('admin.supplierPricing.serviceSaved'))
  if (saved) serviceEditor.open = false
}
const removeAddedService = async (row: SavedService) => {
  try {
    await ElMessageBox.confirm(t('admin.supplierPricing.removeConfirm', { name: serviceTitle(row.name, row.spuNameI18n) }), t('admin.supplierPricing.removeTitle'), { type: 'warning' })
  } catch {
    return
  }
  await persistServices(
    savedServices.value.filter((service) => !(service.spuId === row.spuId && service.categoryId === row.categoryId)),
    t('admin.supplierPricing.removed'),
  )
}

const loadQuotes = async (fresh = false) => {
  if (!supplierRecordId.value) return
  quoteLoading.value = true
  try {
    liveQuotes.value = await session.supplierQuotes(supplierRecordId.value, fresh) || []
  } finally {
    quoteLoading.value = false
  }
}

const quoteSpecLabel = (row: { specs: Record<string, unknown>; skuCode: string }) => {
  const parts = quoteDialog.columns.map((column) => {
    const text = specText(row.specs[column.key])
    return text !== '—' ? text : ''
  }).filter(Boolean)
  return parts.length ? parts.join(' · ') : (row.skuCode || t('admin.supplierPricing.specFallback'))
}

const skuAmount = (row: { staffCount?: number | null; serviceHours?: number | null }) => {
  if (quoteDialog.quoteMode !== 2) return null
  const unit = Number(quoteDialog.unitPrice)
  const staff = Number(row.staffCount)
  const hours = Number(row.serviceHours)
  if (!(unit > 0) || !(staff > 0) || !(hours > 0)) return null
  return Math.round((unit * staff * hours + Number.EPSILON) * 100) / 100
}

const skuEnabled = (value: unknown, available = true) => available !== false && (value == null || value === '' || Number(value) === 1)
const quoteItems = () => quoteDialog.rows.map((row) => {
  const enabled = skuEnabled(row.enabled, row.available !== false)
  const staffCount = row.staffCount == null || row.staffCount === '' ? null : Number(row.staffCount)
  const serviceHours = row.serviceHours == null || row.serviceHours === '' ? null : Number(row.serviceHours)
  const quotePrice = quoteDialog.quoteMode === 2
    ? skuAmount(row)
    : (row.quotePrice == null || row.quotePrice === '' ? null : Number(row.quotePrice))
  return { skuId: row.skuId, staffCount, serviceHours, quotePrice, enabled: enabled ? 1 : 0 }
})

const draftProblem = () => {
  if (quoteDialog.quoteMode === 2 && quoteDialog.unitPrice != null && !(Number(quoteDialog.unitPrice) > 0)) {
    return t('admin.supplierPricing.unitPositive')
  }
  for (const item of quoteItems()) {
    if (item.enabled !== 1) continue
    if (item.staffCount != null && !(item.staffCount > 0)) return t('admin.supplierPricing.staffPositive')
    if (item.serviceHours != null && !(item.serviceHours > 0)) return t('admin.supplierPricing.hoursPositive')
    if (quoteDialog.quoteMode === 1 && item.quotePrice != null && !(item.quotePrice > 0)) return t('admin.supplierPricing.pricePositive')
  }
  if (quoteDialog.attaches.some((item) => item.offered && !addonPriceOk(item.quotePrice))) return t('admin.supplierPricing.addonPriceInvalid')
  return ''
}

const addonPriceOk = (value: unknown) => {
  const text = String(value ?? '').trim()
  return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0
}

const mergeAttaches = (catalog: any[] | undefined, saved: any[] | undefined) => {
  const savedById = new Map((Array.isArray(saved) ? saved : []).map((item) => [Number(item.attachValueId), item]))
  const base = Array.isArray(catalog) && catalog.length ? catalog : (Array.isArray(saved) ? saved : [])
  return mapAttaches(base.map((item) => {
    const quote = savedById.get(Number(item.attachValueId))
    if (!quote) return item
    return {
      ...item,
      attachTypeName: quote.attachTypeName || item.attachTypeName,
      attachTypeNameI18n: quote.attachTypeNameI18n || item.attachTypeNameI18n,
      attachValueName: quote.attachValueName || item.attachValueName,
      attachValueNameI18n: quote.attachValueNameI18n || item.attachValueNameI18n,
      platformPrice: quote.platformPrice ?? item.platformPrice,
      approvedPrice: quote.approvedPrice ?? null,
      canServe: quote.canServe,
      quotePrice: quote.quotePrice,
    }
  }))
}

const mapAttaches = (list: any[]) => (Array.isArray(list) ? list : []).map((item) => ({
  attachValueId: Number(item.attachValueId),
  typeName: item.attachTypeName ? String(item.attachTypeName) : '',
  typeNameI18n: item.attachTypeNameI18n && typeof item.attachTypeNameI18n === 'object' ? item.attachTypeNameI18n : null,
  name: item.attachValueName ? String(item.attachValueName) : '',
  nameI18n: item.attachValueNameI18n && typeof item.attachValueNameI18n === 'object' ? item.attachValueNameI18n : null,
  platformPrice: item.platformPrice ?? null,
  approvedPrice: item.approvedPrice ?? null,
  offered: item.canServe === true || (item.quotePrice != null && item.quotePrice !== ''),
  quotePrice: item.quotePrice == null || item.quotePrice === '' ? '' : String(item.quotePrice),
}))

const toggleAttach = (item: { offered: boolean; quotePrice: string }, offered: boolean) => {
  item.offered = offered
  if (!offered) item.quotePrice = ''
}

const submitProblem = () => {
  if (quoteDialog.quoteMode !== 1 && quoteDialog.quoteMode !== 2) return t('admin.supplierPricing.modeRequired')
  if (quoteDialog.quoteMode === 2 && !(Number(quoteDialog.unitPrice) > 0)) return t('admin.supplierPricing.hourlyRequired')
  if (quoteDialog.attaches.some((item) => item.offered && !addonPriceOk(item.quotePrice))) {
    return t('admin.supplierPricing.addonPriceInvalid')
  }
  const items = quoteItems().filter((item) => item.enabled === 1)
  if (!quoteDialog.rows.some((row) => row.available !== false)) return t('admin.supplierPricing.noSellable')
  if (!items.length) return t('admin.supplierPricing.skuSwitchRequired')
  const incomplete = items.some((item) => !(Number(item.staffCount) > 0 && Number(item.serviceHours) > 0 && Number(item.quotePrice) > 0))
  if (incomplete) return t('admin.supplierPricing.submitIncomplete')
  return ''
}

const quotePayload = () => {
  const payload: Record<string, unknown> = {
    supplierId: supplierRecordId.value,
    spuId: quoteDialog.spuId,
    items: quoteItems(),
  }
  if (quoteDialog.quoteMode === 1 || quoteDialog.quoteMode === 2) payload.quoteMode = quoteDialog.quoteMode
  if (quoteDialog.quoteMode === 2) payload.unitPrice = quoteDialog.unitPrice == null ? null : Number(quoteDialog.unitPrice)
  payload.attaches = quoteDialog.attaches
    .filter((item) => item.offered && addonPriceOk(item.quotePrice))
    .map((item) => ({ attachValueId: item.attachValueId, quotePrice: Number(item.quotePrice) }))
  return payload
}

const applySavedQuote = (saved: any) => {
  if (!saved) return
  quoteDialog.status = saved.status ?? quoteDialog.status
  quoteDialog.rejectReason = saved.rejectReason || ''
  if (saved.quoteMode != null) quoteDialog.quoteMode = Number(saved.quoteMode) === 2 ? 2 : 1
  quoteDialog.unitPrice = saved.unitPrice == null || saved.unitPrice === '' ? null : Number(saved.unitPrice)
  const quoted = new Map((saved.skus || []).map((sku: any) => [Number(sku.skuId), sku]))
  quoteDialog.rows.forEach((row) => {
    const next = quoted.get(Number(row.skuId))
    if (!next) return
    row.staffCount = next.staffCount == null ? null : Number(next.staffCount)
    row.serviceHours = next.serviceHours == null ? null : Number(next.serviceHours)
    row.quotePrice = next.quotePrice == null ? null : Number(next.quotePrice)
    row.enabled = skuEnabled(next.enabled, row.available !== false)
    if (next.approvedPrice != null) row.approvedPrice = next.approvedPrice
  })
  if (Array.isArray(saved.attaches)) quoteDialog.attaches = mapAttaches(saved.attaches)
}

const openQuotedServiceEditor = () => {
  const row = savedServices.value.find((service) => service.spuId === quoteDialog.spuId)
  if (row) openServiceEditor(row)
}
const onQuoteMode = (mode: string | number | boolean | undefined) => {
  if (Number(mode) !== 1) return
  quoteDialog.rows.forEach((row) => {
    if (row.quotePrice != null && row.quotePrice !== '') return
    const unit = Number(quoteDialog.unitPrice)
    const staff = Number(row.staffCount)
    const hours = Number(row.serviceHours)
    if (unit > 0 && staff > 0 && hours > 0) row.quotePrice = Math.round((unit * staff * hours + Number.EPSILON) * 100) / 100
  })
}
const pickQuoteMode = (mode: 1 | 2) => {
  quoteDialog.quoteMode = mode
  onQuoteMode(mode)
}

const openServiceQuote = async (row: { spuId: number; name: string; spuNameI18n?: Record<string, unknown> | null; category: string; categoryNameI18n?: Record<string, unknown> | null; status?: number; rejectReason?: string; quoteMode?: number; unitPrice?: number | null }) => {
  quoteDialog.visible = true
  quoteDialog.loading = true
  await nextTick()
  scrollProfileTop()
  quoteDialog.spuId = row.spuId
  quoteDialog.name = row.name || ''
  quoteDialog.nameI18n = row.spuNameI18n || null
  quoteDialog.category = row.category || ''
  quoteDialog.categoryI18n = row.categoryNameI18n || null
  quoteDialog.status = row.status
  quoteDialog.rejectReason = row.rejectReason || ''
  quoteDialog.quoteMode = row.quoteMode === 2 ? 2 : 1
  quoteDialog.unitPrice = row.unitPrice == null ? null : Number(row.unitPrice)
  quoteDialog.columns = []
  quoteDialog.rows = []
  quoteDialog.attaches = []
  try {
    const detail = unwrap(await listBySpu(row.spuId)) || {}
    const quote = liveQuotes.value.find((item) => Number(item.spuId) === Number(row.spuId))
    const quoted = new Map((quote?.skus || []).map((sku: any) => [Number(sku.skuId), sku]))
    const specTypes = Array.isArray(detail.specTypes) ? detail.specTypes : []
    quoteDialog.columns = specTypes.map((spec: any) => ({
      key: String(spec.specKey ?? spec.specTypeId),
      nameI18n: spec.nameI18n && typeof spec.nameI18n === 'object' ? spec.nameI18n : null,
      fallback: spec.specTypeName || '',
    }))
    const skus = Array.isArray(detail.skus) ? detail.skus : []
    quoteDialog.rows = skus.map((sku: any) => {
      const saved = quoted.get(Number(sku.skuId)) || {}
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        specs: Object.fromEntries(quoteDialog.columns.map((column) => [column.key, sku[column.key]])),
        platformPrice: saved.platformPrice ?? sku.price,
        approvedPrice: saved.approvedPrice ?? null,
        available: saved.available != null ? saved.available !== false : Number(sku.status ?? 1) === 1,
        enabled: skuEnabled(saved.enabled, (saved.available != null ? saved.available !== false : Number(sku.status ?? 1) === 1)),
        staffCount: saved.staffCount == null || saved.staffCount === '' ? null : Number(saved.staffCount),
        serviceHours: saved.serviceHours == null || saved.serviceHours === '' ? null : Number(saved.serviceHours),
        quotePrice: saved.quotePrice == null || saved.quotePrice === '' ? null : Number(saved.quotePrice),
      }
    })
    if (quote) {
      quoteDialog.status = quote.status
      quoteDialog.rejectReason = quote.rejectReason || ''
      quoteDialog.quoteMode = Number(quote.quoteMode) === 2 ? 2 : 1
      quoteDialog.unitPrice = quote.unitPrice == null || quote.unitPrice === '' ? quoteDialog.unitPrice : Number(quote.unitPrice)
    }
    let catalogAttaches = Array.isArray(detail.attaches) ? detail.attaches : []
    if (!catalogAttaches.length) {
      try {
        catalogAttaches = await listSpuAttachCatalog(row.spuId)
      } catch {
        catalogAttaches = []
      }
    }
    quoteDialog.attaches = mergeAttaches(catalogAttaches, quote?.attaches)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierPricing.specsFailed'))
    quoteDialog.visible = false
  } finally {
    quoteDialog.loading = false
  }
}

const saveServiceQuote = async () => {
  if (!supplierRecordId.value) return
  const problem = draftProblem()
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  quoteDialog.saving = true
  try {
    const saved = unwrap(await saveQuoteDraft(quotePayload()))
    applySavedQuote(saved)
    ElMessage.success(t('admin.supplierPricing.draftSaved'))
    await loadQuotes(true)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierPricing.saveQuoteFailed'))
  } finally {
    quoteDialog.saving = false
  }
}

const submitServiceQuote = async () => {
  if (!supplierRecordId.value) return
  const problem = submitProblem()
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  quoteDialog.saving = true
  try {
    await saveQuoteDraft(quotePayload())
    const submitted = unwrap(await submitQuote({
      supplierId: supplierRecordId.value,
      spuId: quoteDialog.spuId,
    }))
    applySavedQuote(submitted)
    quoteDialog.status = submitted?.status ?? 1
    ElMessage.success(t('admin.supplierPricing.submitted'))
    quoteDialog.visible = false
    await loadQuotes(true)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierPricing.submitFailed'))
  } finally {
    quoteDialog.saving = false
  }
}

const loadOrderDetail = async (orderId: number) => {
  const requestId = ++orderDetailRequest
  orderDetailLoading.value = true
  try {
    const detail = unwrap(await supplierAssignedOrderDetail(orderId))
    if (requestId !== orderDetailRequest || Number(selectedOrder.value?.orderId) !== orderId) return
    selectedOrder.value = detail || selectedOrder.value
  } catch (error: any) {
    if (requestId !== orderDetailRequest) return
    ElMessage.error(error?.message || t('admin.supplierOrders.detailFailed'))
  } finally {
    if (requestId === orderDetailRequest) orderDetailLoading.value = false
  }
}
const loadOrders = async () => {
  orderLoading.value = true
  try {
    const [serviceTimeStart, serviceTimeEnd] = orderDateRange.value || []
    const page = unwrap(await supplierAssignedOrders({
      orderNo: orderKeyword.value || undefined,
      serviceName: orderServiceKeyword.value || undefined,
      categoryId: orderCategory.value || undefined,
      serviceTimeStart: serviceTimeStart || undefined,
      serviceTimeEnd: serviceTimeEnd || undefined,
      pageNum: orderPage.value,
      pageSize: 10,
    }))
    supplierOrders.value = page?.list || []
    orderTotal.value = Number(page?.total || 0)
  } catch (error: any) {
    supplierOrders.value = []
    orderTotal.value = 0
    ElMessage.error(error?.message || t('admin.supplierOrders.loadFailed'))
  } finally {
    orderLoading.value = false
  }
}
const searchOrders = () => {
  orderPage.value = 1
  loadOrders()
}
const changeOrderPage = (page: number) => {
  orderPage.value = page
  loadOrders()
}

const handlePrimaryAction = () => {
  if (section.value === 'staff') { staffDialogVisible.value = true; return }
  if (section.value === 'service-area') { openAreaEditor(); return }
  if (section.value === 'schedule') { shiftDialogVisible.value = true; return }
  if (section.value === 'profile') {
    if (needsResubmit.value) resubmitProfile()
    else saveProfile(1)
  }
}

onMounted(() => {
  loadCurrentSupplier().catch((error: any) => ElMessage.error(error?.message || t('admin.supplierProfile.loadFailed')))
})
watch(section, (value) => {
  if (value === 'orders') loadOrders()
  if (value === 'service-area') ensureAreaCatalog()
  if (value === 'pricing') {
    loadCatalog()
    loadQuotes()
  }
})
watch(areaKeyword, (keyword) => {
  const query = keyword.trim().toLowerCase()
  if (!query) return
  const next = new Set(expandedAreaIds.value)
  areaCatalog.value.forEach((area) => {
    const communities = communitiesByArea.value[area.id] || []
    if (communities.some((community) => community.name.toLowerCase().includes(query))) next.add(area.id)
  })
  expandedAreaIds.value = [...next]
})
</script>

<style scoped>
.supplier-demo {
  --ink: #05152b;
  --muted: #74685a;
  --line: #e6dccb;
  --el-color-primary: #05152b;
  --el-color-primary-light-3: #3a4a60;
  --el-color-primary-light-5: #6d7b8d;
  --el-color-primary-light-7: #b7c0cb;
  --el-color-primary-light-8: #d7dde4;
  --el-color-primary-light-9: #eef1f4;
  --el-color-primary-dark-2: #020912;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 28px 32px 40px;
  color: var(--ink);
  font-family: Sora, "PingFang SC", "Segoe UI", sans-serif;
}
.supplier-demo--profile { padding: 0 0 28px; background: transparent; }
.supplier-demo--profile .page-header { align-items: center; margin: 0 0 22px; padding: 28px 32px 22px; color: #f6f1e8; background: #05152b; }
.supplier-demo--profile .page-header p { display: none; }
.supplier-demo--profile .page-header h1 { margin: 0; color: #f7f1e6; font-family: Fraunces, Georgia, serif; font-size: 40px; font-weight: 520; letter-spacing: -.03em; }
.supplier-demo--profile .page-actions { align-items: center; padding-top: 0; }
.supplier-demo--profile .page-actions :deep(.el-button) { height: 40px; padding: 0 16px; border-radius: 10px; font-weight: 650; }
.supplier-demo--profile .page-actions :deep(.el-button:not(.el-button--primary)) { color: #e8c27a; background: transparent; border-color: #c4a36a; }
.supplier-demo--profile .page-actions :deep(.el-button--primary) { color: #05152b; background: #f7f1e6; border-color: #f7f1e6; }
.supplier-demo--profile .dossier { padding: 0 22px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-kicker { margin: 0 0 6px; color: #8d5a32; font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
.page-header h1 { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 40px; font-weight: 520; line-height: 1.05; letter-spacing: -.035em; }
.page-actions { display: flex; gap: 10px; padding-bottom: 4px; }
.page-actions :deep(.el-button) { height: 40px; padding: 0 16px; border-radius: 10px; font-weight: 600; }
.page-actions :deep(.el-button--primary) { color: #f7f1e6; background: #05152b; border-color: #05152b; }
.community-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.supplier-strip { display: flex; align-items: center; justify-content: space-between; min-height: 92px; padding: 18px 22px; margin-bottom: 22px; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 18px; }
.supplier-identity { display: flex; align-items: center; gap: 16px; }
.supplier-logo { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; color: #e8c27a; background: #05152b; font-family: Fraunces, Georgia, serif; font-size: 18px; font-weight: 520; }
.supplier-label { margin-bottom: 4px; color: #8d5a32; font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.supplier-identity:has(.supplier-select) .supplier-name { display: none; }
.supplier-select { width: 290px; }
.supplier-select :deep(.el-select__wrapper) { padding-left: 0; background: transparent; box-shadow: none !important; font-family: Fraunces, Georgia, serif; font-size: 22px; font-weight: 520; }
.supplier-facts { display: flex; align-items: center; gap: 28px; }
.supplier-facts > div { display: flex; flex-direction: column; gap: 4px; }
.supplier-facts span { color: var(--muted); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
.supplier-facts strong { font-family: Fraunces, Georgia, serif; font-size: 18px; font-weight: 520; }
.supplier-facts .progress-value { color: #8d5a32; }
.compact-progress { display: block !important; width: 108px; height: 3px; border-radius: 99px; background: #eadfce; overflow: hidden; }
.compact-progress i { display: block; height: 100%; border-radius: inherit; background: #05152b; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.metric-card { display: flex; align-items: flex-start; gap: 14px; min-height: 118px; padding: 18px 18px 16px; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 18px; box-shadow: none; }
.metric-icon { display: grid; place-items: center; flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px; color: #8d5a32; background: #f6efe4; }
.metric-icon :deep(svg) { width: 16px; }
.metric-icon--blue, .metric-icon--green, .metric-icon--purple, .metric-icon--amber { color: #8d5a32; background: #f6efe4; }
.metric-card div { display: flex; flex-direction: column; }.metric-card small, .mini-metric span { color: var(--muted); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }.metric-card strong { margin: 8px 0 4px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 28px; font-weight: 520; letter-spacing: -.03em; }.metric-card p { margin: 0; color: #8a7d70; font-size: 12px; }
.surface-card { background: #fffdf8; border: 1px solid #e6dccb; border-radius: 18px; box-shadow: none; }
.surface-card :deep(.el-card__body) { padding: 0; }
.onboarding-card :deep(.el-card__body) { padding: 0 22px 24px; }
.dossier { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 22px; align-items: start; }
.dossier-rail { position: sticky; top: 16px; padding: 26px 20px; color: #f6f1e8; background: #05152b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M0 159h160M159 0v160' fill='none' stroke='%23ffffff14'/%3E%3C/svg%3E"); border-radius: 22px; }
.dossier-rail p { margin: 0 0 16px; color: #d7b48a; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
.dossier-rail strong { display: block; font-family: Fraunces, Georgia, serif; font-size: 28px; font-weight: 520; line-height: 1.12; }
.dossier-rail em { display: inline-block; margin-top: 14px; padding: 8px 14px; border-radius: 999px; color: #05152b; background: #e8c27a; font-style: normal; font-size: 16px; font-weight: 800; }
.profile-status { display: grid; gap: 4px; margin-bottom: 16px; padding: 22px 24px; background: #f7f1e6; border: 1px solid #e4d3b8; border-radius: 18px; }
.profile-status span { color: #6f5b40; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.profile-status strong { color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 40px; font-weight: 560; letter-spacing: -.03em; line-height: 1.05; }
.profile-status p { margin: 6px 0 0; color: #6a5334; font-size: 16px; line-height: 1.45; }
.profile-status.is-review, .profile-status-pill.is-review { background: #fff1d6; border-color: #e2b15a; }
.profile-status.is-review strong, .profile-status-pill.is-review { color: #8a3d00; }
.profile-status.is-review strong { font-size: 44px; }
.profile-status-pill.is-review { background: #8a3d00; color: #fff8ee; }
.profile-status.is-approved { background: #e7f6ec; border-color: #9dceb0; }
.profile-status.is-approved strong, .profile-status-pill.is-approved { color: #146c3a; }
.profile-status-pill.is-approved { background: #146c3a; color: #f3fff6; }
.profile-status.is-rejected { background: #fdecea; border-color: #e7b2ab; }
.profile-status.is-rejected strong, .profile-status-pill.is-rejected { color: #a3261c; }
.profile-status-pill.is-rejected { background: #a3261c; color: #fff6f5; }
.profile-status.is-draft { background: #f4f1ea; }
.profile-status.is-draft strong { color: #5c564c; }
.dossier-rail nav { display: grid; gap: 2px; margin-top: 26px; }
.dossier-rail button { position: relative; display: flex; gap: 12px; width: 100%; padding: 9px 0 9px 12px; color: #efe7dc; text-align: left; background: transparent; border: 0; font: inherit; font-size: 14px; cursor: pointer; }
.dossier-rail button.is-active { color: #e8c27a; }
.dossier-rail button.is-active::before { content: ""; position: absolute; left: 0; top: 10px; bottom: 10px; width: 2px; background: #e8c27a; }
.dossier-rail a span, .dossier-rail button span { width: 22px; color: #d7b48a; font-family: Fraunces, Georgia, serif; }
.dossier-rail small { display: block; margin-top: 18px; color: #f0b4a2; line-height: 1.45; }
.profile-main { display: grid; gap: 14px; min-width: 0; }
.lightbox { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 18px 22px; background: #fff; border: 1px solid #e9e2d3; border-left: 5px solid #c99b4a; border-radius: 12px; }
.lightbox p { margin: 0; color: #7a8090; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }
.lightbox h2 { margin: 4px 0; font-family: Fraunces, Georgia, serif; font-size: 28px; font-weight: 520; color: #05152b; }
.lightbox h2 span { margin-right: 8px; color: #b98a3a; }
.lightbox small { color: #7a8090; }
.lightbox em { flex: none; padding: 5px 12px; border-radius: 14px; font-style: normal; font-size: 12px; font-weight: 700; }
.lightbox em.is-ok { background: #e8f5ec; color: #2e7d4f; }
.lightbox em.is-warn { background: #fdecea; color: #c0392b; }
.lightbox em.is-wait { background: #fdf1de; color: #b6791f; }
.error-banner { padding: 14px 18px; background: #fdecea; border: 1px solid #f1c3bd; border-left: 4px solid #c0392b; border-radius: 10px; }
.error-banner strong { display: block; margin-bottom: 8px; color: #c0392b; }
.error-banner button { margin: 0 8px 8px 0; padding: 6px 12px; border: 1px solid #f1c3bd; border-radius: 16px; background: #fff; color: #c0392b; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.review-lock { margin: 0; padding: 12px 16px; border-radius: 14px; background: #fff4e5; color: #8d5a32; font-weight: 700; }
.dossier-sheet { overflow: hidden; background: #fffdf8; border: 1px solid #e4d8c6; border-radius: 24px; box-shadow: 0 22px 48px rgba(5, 21, 43, .06); }
.dossier-sheet .sec-h { display: none; }
.dossier-sheet.is-all .sec-h { display: flex; }
.dossier-sheet.is-all section + section { border-top: 1px solid #efe4d4; }
.profile-field { display: grid; align-content: start; gap: 6px; min-width: 0; max-width: 100%; margin-bottom: 16px; }
.profile-field > span { color: #3a3f4a; font-size: 13px; font-weight: 700; }
.profile-field > span i, .doc-row i { color: #c0392b; font-style: normal; }
.profile-field > small, .doc-row .err { color: #c0392b; font-size: 13px; font-weight: 700; }
.profile-field.error :deep(.el-input__wrapper),
.profile-field.error :deep(.el-textarea__inner) { background: #fdecea; box-shadow: 0 0 0 2px #c0392b inset; }
.profile-field.error :deep(.el-input-group) { border-radius: 8px; box-shadow: 0 0 0 2px #c0392b; }
.profile-field.error :deep(.el-input-group .el-input__wrapper) { box-shadow: none; background: #fdecea; }
.profile-field.error :deep(.dial-prepend .el-select__wrapper) { background: transparent; box-shadow: none; }
.same-line { display: flex; align-items: flex-start; gap: 8px; min-width: 0; max-width: 100%; margin: 2px 0 0; color: #7a7166; font-size: 13px; font-weight: 500; line-height: 1.4; cursor: pointer; }
.same-line input { width: 16px; height: 16px; margin: 1px 0 0; flex: none; accent-color: #05152b; }
.same-line span { min-width: 0; }
.service-pills { margin-bottom: 16px; }
.service-pills strong { display: block; margin-bottom: 8px; }
.service-pills div { display: flex; flex-wrap: wrap; gap: 8px; }
.service-pills span { padding: 6px 12px; border: 1px solid #dde0e6; border-radius: 16px; background: #eef0f3; color: #3a3f4a; font-size: 13px; font-weight: 700; }
.service-pills em, .service-pills p, .doc-row small { color: #7a7166; font-size: 12px; font-style: normal; }
.doc-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 12px; padding: 16px; border: 1px solid #e9e2d3; border-radius: 10px; background: #fff; }
.doc-row.error { border: 2px solid #c0392b; background: #fffafa; }
.doc-row p { display: flex; gap: 8px; margin: 6px 0 0; }
.doc-row button { padding: 0; border: 0; background: transparent; color: #2e7d4f; font: inherit; font-weight: 700; cursor: pointer; }
.doc-row .is-remove { color: #c0392b; }
.profile-footer { display: flex; justify-content: space-between; gap: 12px; padding: 14px 18px; background: #fff; border: 1px solid #e9e2d3; border-radius: 12px; }
.dossier-sheet section { padding: 28px 32px 12px; }
.dossier-sheet section + section { border-top: 1px solid #efe4d4; }
.dossier-sheet header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
.dossier-sheet header > span { font-family: Fraunces, Georgia, serif; font-size: 28px; color: #8d5a32; line-height: 1; }
.dossier-sheet h2 { margin: 0; font-family: Fraunces, Georgia, serif; font-size: 30px; font-weight: 520; letter-spacing: -.03em; color: #05152b; }
.dossier-sheet header p { margin: 4px 0 0; color: #7a7166; font-size: 13px; }
.dossier-sheet header .el-button { margin-left: auto; }
.dossier-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 22px; min-width: 0; align-items: start; }
.dossier-grid.align-fields .profile-field > span { min-height: 2.7em; }
.field-hint { margin: 6px 0 0; color: #8a5a2b; font-size: 12px; line-height: 1.45; }
.dossier-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dossier-grid :deep(.el-form-item__label) { color: #5c564c; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.dossier-grid :deep(.el-input),
.dossier-grid :deep(.el-input-number),
.dossier-grid :deep(.el-date-editor),
.dossier-grid :deep(.el-select) { width: 100%; max-width: 100%; min-width: 0; }
.dossier-grid :deep(.el-input__inner) { min-width: 0; }
.dossier-grid :deep(.el-input-group) { display: flex; width: 100%; min-width: 0; }
.dossier-grid :deep(.el-input-group__prepend) { flex: 0 0 84px; width: 84px; padding: 0; overflow: hidden; background: #05152b; border-radius: 8px 0 0 8px; box-shadow: none; }
.dossier-grid :deep(.el-input-group .el-input__wrapper) { flex: 1; min-width: 0; border-radius: 0 8px 8px 0; }
.dossier-grid :deep(.dial-prepend) { width: 84px; margin: 0; }
.dossier-grid :deep(.dial-prepend .el-select__wrapper) { min-height: 40px; padding: 0 8px; background: transparent; box-shadow: none; }
.dossier-grid :deep(.dial-prepend .el-select__selected-item),
.dossier-grid :deep(.dial-prepend .el-select__placeholder),
.dossier-grid :deep(.dial-prepend .el-select__caret) { color: #f7f1e6; font-weight: 700; }
.dossier-grid :deep(.el-input__wrapper),
.dossier-grid :deep(.el-select__wrapper) { min-height: 40px; background: #fff; border-radius: 8px; box-shadow: 0 0 0 1px #e6dccb inset; }
.plain-count { width: 100%; height: 40px; padding: 0 12px; border: 0; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px #e6dccb inset; color: #05152b; font: inherit; font-size: 14px; font-weight: 500; }
.plain-count:disabled { color: #7a7166; background: #f7f4ee; }
.doc-list article > svg { width: 18px; height: 18px; color: #8d5a32; }
.dossier-toggles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 4px 0 12px; }
@media (min-width: 1500px) { .dossier-toggles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.expected-services { display: grid; gap: 8px; margin: 0 0 16px; color: #314255; font-size: 13px; line-height: 1.5; }
.expected-services p { margin: 0; }
.expected-services strong { color: #05152b; }
.expected-services__chips { display: flex; flex-wrap: wrap; gap: 8px; }
.expected-services__chips span { min-height: 34px; padding: 4px 14px; display: inline-flex; align-items: center; border: 1px solid #05152b; border-radius: 999px; background: #05152b; color: #f7f1e6; font-size: 14px; font-weight: 650; }
.expected-services__chips em { color: #7a7166; font-style: normal; }
.community-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0 0 18px; }
.community-fields article { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 76px; padding: 14px 16px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.community-fields strong { display: block; color: #05152b; font-size: 14px; }
.community-fields small { display: block; margin-top: 4px; color: #7a7166; font-size: 12px; line-height: 1.4; }
.community-note { margin-bottom: 8px; }
.dossier-toggles label, .policy-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; padding: 12px 14px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.dossier-toggles :deep(.el-radio-group) { display: inline-flex; flex: none; flex-wrap: nowrap; }
.dossier-toggles :deep(.el-radio-button__inner) { padding: 6px 14px; }
.dossier-toggles span, .policy-row > div { display: grid; min-width: 0; }
.dossier-toggles strong, .policy-row strong { color: #05152b; font-size: 14px; }
.dossier-toggles small, .policy-row small { color: #7a7166; font-size: 12px; }
.policy-row { margin-bottom: 10px; }
.doc-list { display: grid; gap: 8px; margin-bottom: 18px; }
.doc-list article { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px 14px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.doc-list strong, .doc-list small { display: block; }
.doc-list small, .doc-list article > span { color: #7a7166; font-size: 12px; }
.policy-row { align-items: flex-start; margin-bottom: 10px; }
.policy-row div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.policy-row small { color: #8a7d70; font-size: 12px; }
.policy-files { margin: 6px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.policy-files li { display: flex; align-items: center; gap: 10px; min-width: 0; }
.policy-files button, .doc-view, .doc-thumb { border: 0; padding: 0; background: transparent; color: #05152b; font: inherit; font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.policy-files button.policy-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.policy-files button.is-remove { flex: 0 0 auto; color: #8d5a32; font-size: 12px; text-decoration: none; }
.policy-thumb, .doc-thumb { display: grid; flex: 0 0 48px; place-items: center; width: 48px; height: 48px; overflow: hidden; border: 1px solid #eadfce !important; border-radius: 8px; background: #fffdf8 !important; text-decoration: none !important; }
.doc-thumb { width: 56px; height: 44px; }
.policy-thumb img, .doc-thumb img { width: 100%; height: 100%; object-fit: cover; }
.doc-thumb svg { width: 18px; height: 18px; color: #8d5a32; }
.policy-empty { margin: 0; color: #7a7166; font-size: 13px; }
@media (max-width: 980px) { .dossier, .dossier-grid, .dossier-grid--three, .dossier-toggles, .community-fields { grid-template-columns: 1fr; } .dossier-rail { position: static; } }
.section-tabs :deep(.el-tabs__header) { margin-bottom: 22px; }.section-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background: var(--line); }.section-tabs :deep(.el-tabs__item) { height: 54px; padding: 0 22px; font-weight: 600; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin: 2px 0 20px; }.section-heading h2 { margin: 0 0 4px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 26px; font-weight: 520; letter-spacing: -.03em; }.section-heading p { margin: 0; color: var(--muted); font-size: 12px; }.section-heading.compact { align-items: center; margin: 0; padding: 18px 22px 14px; border-bottom: 1px solid var(--line); }.section-heading.compact h2 { font-size: 22px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }.form-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }.span-2 { grid-column: span 2; }.form-grid :deep(.el-form-item) { margin-bottom: 17px; }.form-grid :deep(.el-form-item__label) { padding-bottom: 6px; color: #4e596d; font-size: 12px; font-weight: 600; }.form-grid :deep(.el-input-number), .form-grid :deep(.el-select), .form-grid :deep(.el-time-select) { width: 100%; }
.field-suffix { margin-left: 8px; color: var(--muted); font-size: 12px; }
.compliance-grid, .toggle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding-top: 4px; }.compliance-item, .toggle-item { display: flex; align-items: center; gap: 12px; padding: 13px 14px; border: 1px solid var(--line); border-radius: 10px; background: #fbfcfe; }.compliance-item span, .toggle-item span { display: flex; flex-direction: column; gap: 2px; }.compliance-item strong, .toggle-item strong { font-size: 13px; }.compliance-item small, .toggle-item small { color: var(--muted); font-size: 11px; }.toggle-item { justify-content: space-between; }.toggle-item > span { order: 0; }.toggle-item :deep(.el-switch) { order: 1; }
.gender-capacity { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }.gender-capacity > div { display: flex; flex-direction: column; padding: 16px; background: #f7f8fb; border-radius: 11px; }.gender-capacity span { color: var(--muted); font-size: 12px; }.gender-capacity strong { margin: 4px 0; font-size: 24px; }.gender-capacity small { color: #929aae; }
.coverage-heading { align-items: center; }.coverage-legend { display: flex; gap: 13px; }.coverage-legend span { display: flex; align-items: center; gap: 5px; color: var(--muted); font-size: 11px; }.coverage-legend i { width: 8px; height: 8px; border-radius: 50%; }.coverage-legend .standard { background: #4f7bd9; }.coverage-legend .extended { background: #d8892d; }.coverage-legend .restricted { background: #c04f5e; }
.coverage-summary { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; padding: 15px 0; border: 1px solid #e4e5f1; border-radius: 11px; background: #fbfbfe; }.coverage-summary div { display: flex; align-items: baseline; justify-content: center; gap: 7px; border-right: 1px solid #e5e7ef; }.coverage-summary div:last-child { border-right: 0; }.coverage-summary strong { font-size: 20px; }.coverage-summary span { color: var(--muted); font-size: 11px; }
.zone-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.zone-card { appearance: none; padding: 13px 14px; text-align: left; color: var(--ink); background: #fff; border: 1px solid #e3e6ee; border-radius: 11px; cursor: pointer; transition: .18s ease; }.zone-card:hover { transform: translateY(-1px); border-color: #c4a36a; box-shadow: 0 5px 14px rgba(5, 21, 43, .06); }.zone-card.selected { border-color: #05152b; background: #f7f3ec; box-shadow: inset 0 0 0 1px #05152b; }.zone-top { display: flex; align-items: center; justify-content: space-between; }.zone-top > span { padding: 3px 7px; color: #4e63a8; background: #edf1fc; border-radius: 6px; font-size: 10px; font-weight: 700; }.zone-card--extended .zone-top > span { color: #a96221; background: #fff0dc; }.zone-card--restricted .zone-top > span { color: #a23d4b; background: #fdecef; }.zone-card > strong { display: block; margin-top: 7px; font-size: 12px; }.zone-card p { margin: 6px 0 3px; color: var(--muted); font-size: 10px; }.zone-card small { color: #9ba3b3; font-size: 10px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 17px 18px; border-bottom: 1px solid var(--line); }.table-search { display: flex; gap: 10px; }.table-search .el-input { width: 290px; }.table-search .el-select { width: 150px; }.table-search .el-date-editor { width: 260px; }.result-count { color: var(--muted); font-size: 12px; }.data-table { --el-table-header-bg-color: #f7f3ec; --el-table-row-hover-bg-color: #fbf8f3; --el-table-bg-color: #fffdf8; }.data-table :deep(th.el-table__cell) { height: 42px; color: #74685a; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }.data-table :deep(td.el-table__cell) { padding: 13px 0; border-bottom-color: #eef0f5; }.person-cell, .service-cell { display: flex; align-items: center; gap: 10px; }.person-cell > span, .service-cell > span:last-child, .muted-stack, .order-id { display: flex; flex-direction: column; gap: 3px; }.person-cell strong, .service-cell strong, .order-id strong { font-size: 12px; }.person-cell small, .service-cell small, .muted-stack small, .order-id small { color: var(--muted); font-size: 10px; }.tag-list, .zone-list { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }.zone-list span, .zone-list em { padding: 3px 6px; color: #586375; background: #f0f2f6; border-radius: 5px; font-size: 10px; font-style: normal; }.status-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }.status-pill i { width: 7px; height: 7px; border-radius: 50%; }.status-pill--available i { background: #2da77b; box-shadow: 0 0 0 3px #dff5ed; }.status-pill--busy i { background: #5378d3; box-shadow: 0 0 0 3px #e5eafd; }.status-pill--leave i { background: #a5acb9; box-shadow: 0 0 0 3px #eceef2; }
.schedule-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 14px 16px; background: #fffdf8; border: 1px solid var(--line); border-radius: 16px; }.week-navigation, .schedule-filters { display: flex; align-items: center; gap: 10px; }.week-navigation > div { display: flex; flex-direction: column; min-width: 210px; text-align: center; }.week-navigation strong { font-size: 13px; }.week-navigation span { margin-top: 2px; color: var(--muted); font-size: 10px; }.schedule-filters .el-select { width: 150px; }
.mini-metric { display: flex; flex-direction: column; padding: 15px 17px; background: #fffdf8; border: 1px solid var(--line); border-radius: 16px; }.mini-metric strong { margin: 5px 0 2px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 26px; font-weight: 520; }.mini-metric small { color: var(--muted); font-size: 10px; }.positive { color: #218367 !important; }.warning-text { color: #bb6d20 !important; }
.schedule-card { overflow-x: auto; }.schedule-card :deep(.el-card__body) { min-width: 1180px; }.schedule-grid { display: grid; grid-template-columns: 190px repeat(7, minmax(125px, 1fr)); }.schedule-grid--header { border-bottom: 1px solid var(--line); background: #fafbfc; }.staff-column-title, .day-head { display: flex; flex-direction: column; justify-content: center; min-height: 68px; padding: 10px 13px; border-right: 1px solid var(--line); }.staff-column-title { color: var(--muted); font-size: 11px; font-weight: 700; }.day-head { align-items: center; }.day-head span, .day-head small { color: var(--muted); font-size: 10px; }.day-head strong { margin: 2px 0; font-size: 14px; }.day-head.today { color: #8d5a32; background: #f6efe4; }.schedule-row { min-height: 96px; border-bottom: 1px solid var(--line); }.schedule-person { display: flex; align-items: center; gap: 9px; padding: 13px; border-right: 1px solid var(--line); }.schedule-person span { display: flex; flex-direction: column; }.schedule-person strong { font-size: 12px; }.schedule-person small { margin-top: 3px; color: var(--muted); font-size: 10px; }.shift-cell { display: flex; flex-direction: column; justify-content: center; min-width: 0; margin: 7px 5px; padding: 9px; text-align: left; color: #455064; border: 1px solid transparent; border-radius: 8px; cursor: pointer; }.shift-cell strong { margin-bottom: 3px; font-size: 11px; }.shift-cell span, .shift-cell small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }.shift-cell small { margin-top: 3px; opacity: .72; }.shift-cell.standard { color: #285f72; background: #e9f7fa; border-color: #c6e9ed; }.shift-cell.busy { color: #6d4524; background: #f6efe4; border-color: #e4d3b8; }.shift-cell.leave { color: #7a6570; background: #f6eff2; border-color: #eadce2; }.shift-cell.open { align-items: center; color: #9ba3b0; background: #fff; border-color: #dfe3e9; border-style: dashed; }.add-shift { font-size: 18px !important; }.schedule-legend { display: flex; gap: 20px; padding: 13px 18px; }.schedule-legend span { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 10px; }.schedule-legend i { width: 11px; height: 11px; border-radius: 3px; }.shift-standard { background: #c6e9ed; }.shift-busy { background: #d9d2ff; }.shift-leave { background: #eadce2; }.shift-open { border: 1px dashed #c8cdd6; }
.service-icon { display: grid; place-items: center; flex: 0 0 auto; width: 32px; height: 32px; color: #8d5a32; background: #f6efe4; border-radius: 9px; font-size: 10px; font-weight: 800; }.money-value { color: #263348; font-size: 12px; }.order-status { display: inline-flex; padding: 5px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }.order-status--pending { color: #9d5f20; background: #fff0da; }.order-status--confirmed { color: #425eb5; background: #e9edff; }.order-status--in_progress { color: #176f69; background: #def5f0; }.order-status--completed { color: #4e5a69; background: #edf0f3; }
.picker-note, .picker-hint { margin: 0 0 12px; color: var(--muted); font-size: 12px; line-height: 1.5; }
.picker-fields { display: grid; grid-template-columns: 168px minmax(0, 1fr); gap: 14px; margin-bottom: 14px; }
.picker-fields label, .phone-stack { display: flex; flex-direction: column; gap: 6px; }
.picker-fields label > span, .phone-stack > span, .quote-terms span { color: #74685a; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.picker-fields :deep(.el-input-number) { width: 100%; }
.picker-toolbar { display: flex; gap: 10px; margin-bottom: 10px; }
.picker-toolbar .el-select, .picker-toolbar .el-input { flex: 1; }
.picker-list { max-height: min(420px, 46vh); overflow: auto; border: 1px solid var(--line); border-radius: 12px; }
.sv-add__note { margin: 0 0 14px; color: #7a7166; font-size: 13px; line-height: 1.5; }
.picker-list__bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f7f3ec; position: sticky; top: 0; z-index: 1; }
.picker-list__bar small { color: var(--muted); font-size: 12px; }
.picker-row { margin: 0; padding: 10px 12px; border-top: 1px solid var(--line); }
.picker-row.is-added { opacity: .62; }
.picker-row.is-open { background: #fffdf8; }
.picker-row__head { display: flex; align-items: flex-start; gap: 10px; }
.picker-row__name { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.picker-row strong { font-size: 13px; }
.picker-row small, .picker-row em { color: var(--muted); font-size: 11px; font-style: normal; }
.picker-row__fields { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 12px; margin: 10px 0 2px 28px; }
.picker-row__fields :deep(.el-input-number) { width: 100%; }
.phone-stack { min-width: 0; }
.phone-row { display: flex; gap: 8px; }
.phone-row .el-input { flex: 1; }
.quote-terms { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 18px 28px; margin-bottom: 14px; padding: 12px 14px; background: #f7f3ec; border-radius: 12px; }
.quote-terms > div, .quote-terms__price { display: flex; flex-direction: column; gap: 8px; }
.quote-terms small { color: var(--muted); font-size: 12px; }
.quote-lines { display: flex; flex-direction: column; gap: 8px; max-height: min(56vh, 560px); overflow: auto; }
.quote-lines__empty { margin: 28px 0; text-align: center; color: var(--muted); }
.quote-line { display: grid; grid-template-columns: 72px minmax(148px, 1.2fr) repeat(3, minmax(0, 1fr)); gap: 10px 12px; align-items: end; padding: 12px 14px; background: #fffdf8; border: 1px solid var(--line); border-radius: 12px; }
.quote-line__switch { align-items: flex-start; }
.quote-line__switch :deep(.el-switch) { height: 32px; }
.quote-line.is-off { opacity: .55; }
.quote-line__spec { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-bottom: 6px; }
.quote-line__spec strong { color: var(--ink); font-size: 14px; font-weight: 650; line-height: 1.35; }
.quote-line__spec small { color: var(--muted); font-size: 12px; }
.quote-line label { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.quote-line :deep(.el-input), .quote-line :deep(.el-input-number) { width: 100%; }
.quote-attaches { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.quote-attaches header { display: flex; flex-direction: column; gap: 4px; }
.quote-attaches header strong { color: var(--ink); font-size: 14px; }
.quote-attaches header small, .quote-attach small { color: var(--muted); font-size: 12px; }
.quote-attach { display: grid; grid-template-columns: minmax(180px, 1.4fr) minmax(0, 220px); gap: 10px 12px; align-items: center; padding: 12px 14px; background: #fffdf8; border: 1px solid var(--line); border-radius: 12px; }
.quote-attach__name { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.service-action__intro { min-width: 0; margin-bottom: 18px; padding: 18px 20px; overflow: hidden; color: #f7f1e6; background-color: #05152b; background-image: linear-gradient(90deg, rgba(5, 21, 43, .98), rgba(5, 21, 43, .62)), url("../../../../assets/images/admin/supplier-order-network.webp"); background-position: center right; background-size: cover; border-radius: 14px; }
.service-action__intro > span { color: #e8c27a; font-size: 9px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; }
.service-action__intro strong { display: block; margin-top: 7px; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: 25px; font-weight: 520; line-height: 1.1; overflow-wrap: anywhere; }
.service-action__intro p { max-width: 440px; margin: 9px 0 0; color: rgba(247, 241, 230, .7); font-size: 11px; line-height: 1.55; }
.service-action__note { display: grid; gap: 7px; min-width: 0; color: #74685a; font-size: 12px; font-weight: 700; }
.service-action__note :deep(.el-textarea__inner) { min-height: 104px !important; border-radius: 10px; }
.service-action__photos { display: grid; gap: 10px; min-width: 0; margin-top: 18px; padding-top: 16px; border-top: 1px solid #efe4d4; }
.service-action__photos > div { min-width: 0; }
.service-action__photos small { display: block; color: #8a7d70; font-weight: 500; line-height: 1.45; }
.service-action__pick { position: relative; display: inline-flex; align-items: center; justify-content: center; width: fit-content; min-height: 38px; padding: 0 14px; overflow: hidden; color: #05152b; border: 1px solid #d9cbb7; border-radius: 9px; background: #fffdf8; font-size: 12px; font-weight: 700; cursor: pointer; }
.service-action__pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.service-action__photos ul { display: grid; gap: 7px; max-height: min(300px, 36vh); margin: 0; padding: 2px 4px 2px 0; overflow: auto; list-style: none; }
.service-action__photos li { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-width: 0; padding: 7px; background: #f8f4ed; border: 1px solid #eee2d2; border-radius: 10px; }
.service-action__photos li > span { min-width: 0; overflow: hidden; color: #27374c; font-size: 12px; font-weight: 650; white-space: nowrap; text-overflow: ellipsis; }
.service-action__photos li > .el-button { flex: 0 0 auto; margin-left: 0; }
.service-action__photos img, .order-photos img { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; }
.service-action__photos button, .order-photos button { padding: 0; border: 0; background: transparent; cursor: pointer; }
.sv-page, .sv-editor { display: grid; gap: 16px; min-width: 0; }
.sv-eyebrow { margin: 0; color: #8d5a32; font-size: 13px; font-weight: 650; }
.sv-title { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 34px; font-weight: 520; letter-spacing: -.02em; }
.sv-supplier { display: flex; align-items: center; gap: 16px; padding: 16px 18px; background: #fffdf8; border: 1px solid #e4d8c6; border-radius: 18px; }
.sv-avatar { display: grid; place-items: center; width: 52px; height: 52px; flex: none; border-radius: 16px; background: #05152b; color: #f7f1e6; font-weight: 750; letter-spacing: .04em; }
.sv-supplier__main { flex: 1; min-width: 0; }
.sv-supplier__main small, .sv-fact small { display: block; color: #7a7166; font-size: 12px; }
.sv-supplier__main strong { display: block; margin: 2px 0 8px; color: #05152b; font-size: 18px; }
.sv-supplier__main p { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0; }
.sv-supplier__main em { padding: 3px 10px; border-radius: 999px; background: #f4f1eb; color: #05152b; font-style: normal; font-size: 12px; font-weight: 700; }
.sv-supplier__main button { border: 0; background: transparent; color: #8d5a32; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: underline; }
.sv-fact { min-width: 120px; }
.sv-fact strong { color: #05152b; }
.sv-board, .sv-quote { background: #fffdf8; border: 1px solid #e4d8c6; border-radius: 18px; overflow: hidden; }
.sv-quote__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sv-quote__head p { margin: 4px 0 0; color: #7a7166; font-size: 13px; }
.sv-crumb { display: flex; align-items: center; gap: 8px; color: #7a7166; font-size: 13px; }
.sv-crumb button { border: 0; background: transparent; color: #05152b; font: inherit; font-weight: 700; cursor: pointer; }
.sv-crumb strong { color: #05152b; }
.sv-quote { padding: 8px 0 0; }
.sv-quote__head, .sv-quote h3, .mode-cards, .rate-field, .quote-lines, .quote-attaches { padding-left: 18px; padding-right: 18px; }
.sv-quote__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-top: 16px; }
.sv-quote__head h2, .sv-quote h3 { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-weight: 520; }
.sv-quote h3 { margin-top: 8px; font-family: inherit; font-size: 16px; font-weight: 750; }
.mode-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
.mode-cards button { display: grid; gap: 4px; min-height: 84px; padding: 14px; text-align: left; border: 1px solid #eadfce; border-radius: 14px; background: #fff; color: #05152b; cursor: pointer; }
.mode-cards button.is-on { background: #05152b; color: #f7f1e6; border-color: #05152b; }
.mode-cards small { color: #7a7166; font-size: 12px; line-height: 1.4; }
.mode-cards button.is-on small { color: #d9d1c5; }
.rate-field { display: grid; gap: 6px; max-width: 320px; margin-top: 14px; color: #5c564c; font-size: 13px; font-weight: 700; }
.sv-quote__foot { padding: 14px 18px; border-top: 1px solid #eadfce; }
.sv-quote__foot > div { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 980px) {
  .sv-supplier, .mode-cards, .sv-quote__foot { flex-direction: column; align-items: stretch; }
  .mode-cards { grid-template-columns: 1fr; }
  .sv-title { font-size: 28px; }
}
.pricing-health { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; padding: 15px 18px; background: #fff8eb; border: 1px solid #f0dbb5; border-radius: 16px; }.pricing-health > div { display: flex; align-items: center; gap: 12px; }.health-icon { display: grid; place-items: center; width: 38px; height: 38px; color: #218365; background: #d4f0e6; border-radius: 50%; }.pricing-health strong { font-size: 13px; }.pricing-health p { margin: 3px 0 0; color: #5f7b72; font-size: 11px; }
.quote-dialog__meta { margin: 0 0 10px; color: var(--muted); font-size: 12px; }
@media (max-width: 820px) {
  .quote-line { grid-template-columns: 1fr 1fr; }
  .quote-line__spec, .quote-line label:last-child { grid-column: 1 / -1; }
  .quote-attach { grid-template-columns: 1fr; }
  .quote-line__spec { padding-bottom: 0; }
}
.pricing-card { margin-bottom: 14px; }.pricing-toolbar { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid var(--line); }.pricing-actions { display: flex; gap: 8px; padding-top: 13px; }.quote-service { display: flex; align-items: center; gap: 10px; }.quote-service > span { padding: 4px 6px; color: #8d5a32; background: #f6efe4; border-radius: 5px; font-size: 9px; font-weight: 700; }.quote-service > div { display: flex; flex-direction: column; gap: 3px; }.quote-service strong { font-size: 12px; }.quote-service small { color: var(--muted); font-size: 10px; }.price-value { color: #27334a; font-size: 13px; }.pricing-table :deep(.el-input-number) { width: 128px; }
.pricing-filter { display: flex; align-items: center; gap: 10px; min-height: 58px; }.pricing-filter > span { font-size: 12px; font-weight: 700; }.pricing-filter .el-select { width: 170px; }.pricing-filter .el-input { width: 220px; }.pricing-filter small { color: var(--muted); font-size: 10px; }
.pricing-bottom-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 14px; }.rule-list > div { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 14px 19px; border-bottom: 1px solid var(--line); }.rule-list > div:last-child { border-bottom: 0; }.rule-badge { display: inline-flex; justify-content: center; padding: 5px 7px; border-radius: 6px; font-size: 9px; font-weight: 700; }.rule-badge--standard { color: #4269b5; background: #edf2fd; }.rule-badge--extended { color: #a86723; background: #fff0dc; }.rule-badge--restricted { color: #a94250; background: #fdecef; }.rule-list > div > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.rule-list strong { font-size: 12px; }.rule-list small { color: var(--muted); font-size: 10px; }.rule-values { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }.rule-values b { font-size: 11px; }.rule-values em { color: var(--muted); font-size: 10px; font-style: normal; }.terms-list { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0; padding: 11px 20px 18px; }.terms-list div { padding: 10px 0; border-bottom: 1px solid #eff1f5; }.terms-list div:nth-last-child(-n + 2) { border-bottom: 0; }.terms-list dt { color: var(--muted); font-size: 10px; }.terms-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 700; }
.drawer-order-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 0 19px; border-bottom: 1px solid var(--line); }.drawer-order-head > div > span { color: #8d5a32; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }.drawer-order-head h2 { margin: 6px 0 3px; font-size: 19px; }.drawer-order-head p { margin: 0; color: var(--muted); font-size: 12px; }.drawer-section { padding: 20px 0; border-bottom: 1px solid var(--line); }.drawer-section h3 { margin: 0 0 13px; font-size: 13px; }.detail-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 0; }.detail-list dt { color: var(--muted); font-size: 10px; }.detail-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 600; }.address-panel { display: flex; gap: 11px; padding: 13px; background: #f7f8fb; border-radius: 10px; }.address-panel > svg { flex: 0 0 auto; width: 19px; color: #8d5a32; }.address-panel div { display: flex; flex-direction: column; gap: 4px; }.address-panel strong { font-size: 12px; }.address-panel p { margin: 0; color: #677186; font-size: 11px; }.address-panel span { color: #969dac; font-size: 10px; }
.supplier-name { display: block; margin-top: 5px; font-size: 15px; }
.overview-grid { display: grid; grid-template-columns: 1.55fr .85fr; gap: 14px; margin-bottom: 14px; }
.overview-grid--bottom { grid-template-columns: 1.1fr .9fr; }
.earnings-card :deep(.el-select) { width: 118px; }
.earnings-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 270px; padding: 38px 26px 20px; }
.bar-item { display: flex; align-items: center; flex-direction: column; justify-content: flex-end; width: 11%; height: 100%; }
.bar-item i { display: block; width: 100%; max-width: 28px; min-height: 8px; background: linear-gradient(180deg, #e8c27a, #05152b); border-radius: 3px 3px 0 0; box-shadow: none; }
.bar-item small { margin-top: 9px; color: var(--muted); font-size: 10px; }.bar-value { margin-bottom: 5px; color: #4f596d; font-size: 10px; }
.capacity-list { display: flex; flex-direction: column; gap: 20px; padding: 24px 22px; }.capacity-list > div { display: grid; grid-template-columns: 1fr auto; gap: 8px 14px; align-items: center; }.capacity-list span { color: var(--muted); font-size: 11px; }.capacity-list strong { font-size: 12px; }.capacity-list :deep(.el-progress) { grid-column: 1 / -1; }
.transaction-list > div { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: 11px; padding: 13px 19px; border-bottom: 1px solid var(--line); }.transaction-list > div:last-child { border-bottom: 0; }.transaction-icon { display: grid; place-items: center; width: 34px; height: 34px; color: #298267; background: #e7f6f0; border-radius: 9px; }.transaction-icon :deep(svg) { width: 16px; }.transaction-list > div > span:nth-child(2), .transaction-amount { display: flex; flex-direction: column; gap: 3px; }.transaction-list strong { font-size: 12px; }.transaction-list small { color: var(--muted); font-size: 10px; }.transaction-amount { text-align: right; }.transaction-amount strong { color: #263348; }
.action-list button { display: grid; grid-template-columns: 32px 1fr 18px; align-items: center; width: 100%; gap: 11px; padding: 13px 18px; color: var(--ink); text-align: left; background: #fff; border: 0; border-bottom: 1px solid var(--line); cursor: pointer; }.action-list button:last-child { border-bottom: 0; }.action-list button:hover { background: #fbf8f3; }.action-list button > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.action-list button strong { font-size: 12px; }.action-list button small { color: var(--muted); font-size: 10px; }.action-list button > svg { width: 14px; color: #a0a6b3; }.action-badge { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; font-size: 11px; font-weight: 700; }.action-badge.amber, .action-badge.purple, .action-badge.blue { color: #8d5a32; background: #f6efe4; }
.review-banner { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 14px 16px; background: #fff8eb; border: 1px solid #f1ddb7; border-radius: 11px; }.review-banner > span:first-child { display: grid; place-items: center; width: 34px; height: 34px; color: #a96c25; background: #ffedcf; border-radius: 9px; }.review-banner > span svg { width: 17px; }.review-banner > div { display: flex; flex: 1; flex-direction: column; gap: 3px; }.review-banner strong { font-size: 12px; }.review-banner p { margin: 0; color: #856d50; font-size: 10px; }.area-banner, .schedule-review { margin-bottom: 14px; background: #f7f3ec; border-color: #e6dccb; }.schedule-review > span:first-child { color: #8d5a32; background: #f6efe4; }.schedule-review p { color: #74685a; }
.document-cell { display: flex; align-items: center; gap: 10px; }.document-cell > svg { width: 22px; color: #8d5a32; }.document-cell > span { display: flex; flex-direction: column; gap: 3px; }.document-cell strong { font-size: 12px; }.document-cell small { color: var(--muted); font-size: 10px; }
.coverage-type { display: inline-flex; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }.coverage-type--standard { color: #4269b5; background: #edf2fd; }.coverage-type--extended { color: #a86723; background: #fff0dc; }.coverage-type--restricted { color: #a94250; background: #fdecef; }
.health-icon.pending { color: #ac6a21; background: #ffe9c8; }.pricing-health:has(.health-icon.pending) { background: #fff8eb; border-color: #f0dbb5; }.pricing-health:has(.health-icon.pending) p { color: #806e57; }
.requested-price { color: #a66722; font-size: 13px; }.muted-text { color: #a2a9b7; }.negative { color: #b84f5a; font-weight: 600; }
.privacy-note { margin-top: 14px; padding: 11px 13px; color: #657083; background: #f3f5f8; border-radius: 9px; font-size: 10px; line-height: 1.55; }
.dialog-tip { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; padding: 11px 13px; color: #806a4d; background: #fff7e9; border-radius: 9px; font-size: 11px; }.dialog-tip > svg { width: 17px; flex: 0 0 auto; }.conflict-alert { display: flex; gap: 10px; padding: 12px; color: #a84650; background: #fdeff1; border: 1px solid #f0cfd4; border-radius: 9px; }.conflict-alert > svg { width: 18px; flex: 0 0 auto; }.conflict-alert span { display: flex; flex-direction: column; gap: 3px; }.conflict-alert strong { font-size: 12px; }.conflict-alert small { font-size: 10px; }
.settlement-tabs :deep(.el-tabs__header) { margin: 0; padding: 0 18px; }.settlement-tabs :deep(.el-tabs__content) { overflow: visible; }.settlement-note { display: flex; align-items: center; gap: 10px; margin: 14px 18px; padding: 12px 14px; color: #246e58; background: #eaf7f2; border-radius: 9px; }.settlement-note > svg { width: 20px; }.settlement-note span { display: flex; flex-direction: column; gap: 3px; }.settlement-note strong { font-size: 11px; }.settlement-note small { color: #628176; font-size: 10px; }
.linked-banner { background: #eef6ff; border-color: #d4e5f7; }.linked-banner > span:first-child { color: #3c74b7; background: #dcecff; }.linked-banner p { color: #64788f; }.area-link-tip { color: #526e8c; background: #eef6ff; }.option-id { float: right; margin-left: 18px; color: #9ba3b3; }
.area-service-status, .area-review-status { display: flex; align-items: flex-start; flex-direction: column; gap: 5px; }.area-service-status small, .area-review-status small { color: var(--muted); font-size: 9px; }.pending-copy { color: #a66b24 !important; }.rejected-copy { color: #b84f5a !important; }
.area-choice-list { display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 520px; margin-top: 12px; overflow: auto; }
.area-choice-list :deep(.el-checkbox) { height: auto; margin: 0; padding: 10px 12px; border: 1px solid #e7ebf2; border-radius: 10px; white-space: normal; align-items: flex-start; }
.area-choice-list :deep(.el-checkbox__input) { margin-top: 3px; }
.area-choice-list :deep(.el-checkbox__label) { line-height: 1.4; white-space: normal; }
.area-choice { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.area-choice strong { color: #1c2433; font-weight: 700; }
.area-choice small { color: #6d7686; font-size: 12px; font-weight: 500; line-height: 1.45; }
.area-alert, .area-note { margin-bottom: 14px; padding: 14px 16px; border-radius: 14px; }
.area-alert { color: #8d2f2f; background: #fdecec; border: 1px solid #f3c7c7; }
.area-note { color: #3d4d63; background: #eef3f8; border: 1px solid #d5e0ea; }
.area-alert strong, .area-note strong { display: block; margin-bottom: 4px; font-size: 14px; }
.area-alert p, .area-note p { margin: 0; font-size: 13px; line-height: 1.5; }
.area-board { overflow: hidden; background: #fffdf8; border: 1px solid var(--line); border-radius: 16px; }
.area-board header { padding: 14px 18px; color: #74685a; font-size: 13px; border-bottom: 1px solid var(--line); }
.area-board table { width: 100%; border-collapse: collapse; }
.area-board th { padding: 12px 18px; color: #74685a; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-align: left; text-transform: uppercase; background: #f7f3ec; }
.area-board td { padding: 14px 18px; vertical-align: top; border-top: 1px solid #efe6d8; }
.area-board td strong { color: #05152b; }
.area-all { margin: 0; color: #74685a; font-style: italic; }
.area-manage-tools { display: flex; align-items: center; gap: 12px; }
.area-manage-tools .el-input { flex: 1; }
.area-manage-tools > div { display: flex; gap: 8px; }
.area-manage-note { margin: 12px 0; color: #74685a; font-size: 13px; line-height: 1.45; }
.area-zone-list { display: flex; flex-direction: column; gap: 8px; max-height: 520px; overflow: auto; }
.area-zone { border: 1px solid #eadfce; border-radius: 12px; background: #fff; }
.area-zone header { display: grid; grid-template-columns: 22px minmax(0, 1fr) 28px; gap: 10px; align-items: center; padding: 12px; }
.area-zone header > button { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 0; color: inherit; text-align: left; background: transparent; border: 0; cursor: pointer; }
.area-zone header strong { color: #05152b; font-size: 15px; }
.area-zone header small { color: #74685a; font-size: 12px; }
.area-zone header input, .area-communities input { width: 16px; height: 16px; accent-color: #05152b; }
.area-zone__chevron { justify-content: center !important; align-items: center !important; color: #74685a; font-size: 16px; }
.area-communities { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 0 12px 12px 44px; }
.area-communities > p { grid-column: 1 / -1; margin: 0; color: #74685a; }
.area-communities label { display: flex; align-items: flex-start; gap: 8px; color: #243044; font-size: 13px; line-height: 1.4; }
.area-communities label.is-dim { opacity: .38; }
.area-zone mark, .area-communities mark { padding: 0 1px; color: inherit; background: #f3e2b8; }
.area-dialog-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.area-dialog-foot > span { color: #74685a; font-size: 13px; }
@media (max-width: 720px) {
  .area-manage-tools, .area-dialog-foot { align-items: stretch; flex-direction: column; }
  .area-communities { grid-template-columns: 1fr; padding-left: 12px; }
}
.phone-list { display: flex; flex-direction: column; gap: 2px; line-height: 1.45; }
.accept-state { margin-right: 8px; color: #1f8a5b; font-size: 12px; font-weight: 700; }
.accept-state.is-off { color: #8a7d70; }
.data-table :deep(td.phone-col .cell) { white-space: normal; overflow: visible; text-overflow: clip; }
.data-table :deep(td.order-wrap .cell) { white-space: normal; overflow: hidden; text-overflow: clip; }
.orders-command { position: relative; isolation: isolate; display: grid; grid-template-columns: minmax(0, 1fr) minmax(420px, .9fr); gap: 28px; align-items: end; min-width: 0; min-height: 206px; margin-bottom: 18px; padding: 28px 30px; overflow: hidden; color: #f7f1e6; background-color: #05152b; background-image: linear-gradient(90deg, rgba(5, 21, 43, .98) 0%, rgba(5, 21, 43, .9) 44%, rgba(5, 21, 43, .38) 100%), url("../../../../assets/images/admin/supplier-order-network.webp"); background-position: center right; background-size: cover; border: 1px solid rgba(232, 194, 122, .26); border-radius: 22px; box-shadow: 0 24px 54px rgba(5, 21, 43, .16); animation: order-reveal .42s ease-out both; }
.orders-command::after { position: absolute; z-index: -1; inset: auto -8% -68% 40%; height: 180px; content: ""; background: radial-gradient(circle, rgba(232, 194, 122, .16), transparent 66%); pointer-events: none; }
.orders-command__copy { min-width: 0; }
.orders-command__copy > span { color: #e8c27a; font-size: 10px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; }
.orders-command__copy h2 { margin: 8px 0 8px; font-family: Fraunces, Georgia, serif; font-size: clamp(30px, 3.2vw, 44px); font-weight: 520; line-height: 1; letter-spacing: -.035em; }
.orders-command__copy p { max-width: 520px; margin: 0; color: rgba(247, 241, 230, .72); font-size: 13px; line-height: 1.6; }
.orders-command__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; min-width: 0; }
.orders-command__metrics article { min-width: 0; padding: 15px 16px; background: rgba(5, 21, 43, .68); border: 1px solid rgba(255, 255, 255, .14); border-radius: 15px; backdrop-filter: blur(12px); }
.orders-command__metrics span, .orders-command__metrics small { display: block; overflow: hidden; color: rgba(247, 241, 230, .62); font-size: 10px; white-space: nowrap; text-overflow: ellipsis; }
.orders-command__metrics span { color: #d8c19a; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.orders-command__metrics strong { display: block; margin: 8px 0 4px; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: 28px; font-weight: 520; line-height: 1; }
.orders-card :deep(.el-card__body) { padding: 0; }
.order-toolbar { display: grid; gap: 15px; padding: 18px 20px 20px; border-bottom: 1px solid var(--line); }
.order-toolbar__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-width: 0; }
.order-toolbar__head > div { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.order-toolbar__head strong { color: #05152b; font-size: 15px; }
.order-toolbar__head span { color: #8a7d70; font-size: 12px; }
.order-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; min-width: 0; }
.order-filter { display: grid; flex: 1 1 160px; gap: 6px; min-width: 0; color: #74685a; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.order-filter--date { flex: 1.45 1 270px; }
.order-filter .el-input, .order-filter .el-select, .order-filter :deep(.el-date-editor) { width: 100%; min-width: 0; }
.order-filter :deep(.el-input__wrapper), .order-filter :deep(.el-select__wrapper), .order-filter :deep(.el-date-editor) { min-height: 40px; border-radius: 10px; box-shadow: 0 0 0 1px #e6dccb inset; }
.order-search { flex: 0 0 auto; min-width: 94px; height: 40px; }
.orders-table-shell { min-width: 0; overflow-x: auto; }
.orders-table { min-width: 1360px; }
.order-pager { display: flex; justify-content: flex-end; padding: 12px 18px 14px; }
.orders-table :deep(td.el-table__cell) { vertical-align: top; }
.orders-table :deep(.order-status-col .cell) { white-space: nowrap; }
.order-no { padding: 0; border: 0; background: transparent; color: #05152b; font: inherit; font-size: 13px; font-weight: 700; letter-spacing: .01em; text-align: left; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.order-no:hover { color: #0b2747; }
.order-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
.order-cell--end { align-items: flex-end; }
.order-cell strong { max-width: 100%; color: #05152b; font-size: 13px; font-weight: 650; line-height: 1.35; overflow-wrap: anywhere; }
.order-cell small, .order-cell > span { color: #74685a; font-size: 12px; line-height: 1.4; }
.order-clamp { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.order-remark-text { color: #05152b; font-weight: 600; }
.order-pin, .order-map { color: #05152b; font-size: 12px; font-weight: 650; text-decoration: underline; text-underline-offset: 3px; }
.money-value { display: inline-flex; align-items: baseline; justify-content: flex-end; gap: 4px; white-space: nowrap; }
.money-value > small { color: #8d5a32; font-size: 9px; letter-spacing: .08em; }
.order-row-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; white-space: nowrap; }
.order-row-actions :deep(.el-button + .el-button) { margin-left: 0; }
.orders-mobile { display: none; }
.order-sheet { min-width: 0; min-height: 180px; }
.order-lead { position: relative; isolation: isolate; min-width: 0; padding: 26px; overflow: hidden; color: #f7f1e6; background-color: #05152b; background-image: linear-gradient(90deg, rgba(5, 21, 43, .98), rgba(5, 21, 43, .74) 60%, rgba(5, 21, 43, .42)), url("../../../../assets/images/admin/supplier-order-network.webp"); background-position: center right; background-size: cover; border-radius: 20px; }
.order-lead::after { position: absolute; z-index: -1; right: -30px; bottom: -90px; width: 260px; height: 180px; content: ""; background: radial-gradient(circle, rgba(232, 194, 122, .2), transparent 68%); }
.order-lead__topline { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-width: 0; }
.order-lead__topline > span { color: #e8c27a; font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.order-lead__number { display: block; margin-top: 20px; color: #e8c27a !important; font-size: 12px !important; letter-spacing: .08em; text-transform: uppercase; }
.order-lead h2 { max-width: 560px; margin: 7px 0 7px; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: clamp(26px, 4vw, 38px); font-weight: 520; line-height: 1.1; letter-spacing: -.035em; overflow-wrap: anywhere; }
.order-lead > p { margin: 0; color: rgba(247, 241, 230, .66); font-size: 12px; }
.order-lead__summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; max-width: 560px; margin-top: 24px; }
.order-lead__summary > div { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 12px 14px; background: rgba(5, 21, 43, .62); border: 1px solid rgba(255, 255, 255, .12); border-radius: 12px; backdrop-filter: blur(10px); }
.order-lead__summary svg { flex: 0 0 auto; width: 17px; color: #e8c27a; }
.order-lead__summary span { min-width: 0; }
.order-lead__summary small, .order-lead__summary strong { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.order-lead__summary small { color: rgba(247, 241, 230, .58); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
.order-lead__summary strong { margin-top: 4px; color: #fffdf8; font-size: 12px; }
.order-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; min-width: 0; }
.order-panel { min-width: 0; padding: 18px; background: #fffdf8; border: 1px solid #e9decd; border-radius: 16px; }
.order-panel--wide { grid-column: 1 / -1; }
.order-facts span, .order-quote span { display: block; color: #8a7d70; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.order-sheet h3 { display: flex; align-items: center; gap: 9px; margin: 0 0 16px; color: #74685a; font-size: 11px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
.order-sheet h3 > span { display: grid; place-items: center; flex: 0 0 auto; width: 25px; height: 25px; color: #8d5a32; background: #f5ecdf; border-radius: 8px; font-family: Fraunces, Georgia, serif; font-size: 11px; letter-spacing: 0; }
.order-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 20px; min-width: 0; }
.order-facts > div { min-width: 0; }
.order-facts .is-wide { grid-column: 1 / -1; }
.order-facts strong { display: block; margin-top: 4px; color: #05152b; font-size: 14px; font-weight: 650; line-height: 1.45; overflow-wrap: anywhere; }
.order-facts strong.phone-list { display: flex; flex-direction: column; gap: 4px; font-style: normal; }
.order-facts .phone-list em { font-style: normal; font-weight: 650; }
.order-address { margin: 0; color: #05152b; font-size: 15px; font-weight: 650; line-height: 1.55; overflow-wrap: anywhere; }
.order-map { display: inline-flex; margin-top: 10px; font-size: 13px; }
.order-quote { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.order-quote > div { min-width: 0; padding: 14px; background: #f7f3ec; border-radius: 13px; }
.order-quote strong { display: flex; align-items: baseline; gap: 5px; margin-top: 6px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 25px; font-weight: 520; letter-spacing: -.03em; overflow-wrap: anywhere; }
.order-quote strong > small { color: #8d5a32; font-family: Sora, "PingFang SC", sans-serif; font-size: 9px; letter-spacing: .08em; }
.order-quote small { display: block; margin-top: 4px; color: #74685a; font-size: 11px; }
.order-lines { display: flex; flex-direction: column; gap: 10px; margin: 0; }
.order-lines article { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr); gap: 16px; align-items: center; padding: 14px; background: #f7f3ec; border-radius: 12px; }
.order-lines article > div { display: grid; gap: 4px; min-width: 0; }
.order-lines small { color: #74685a; }
.order-lines dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 0; }
.order-lines dt { color: #8a7d70; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.order-lines dd { margin: 4px 0 0; color: #05152b; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
.order-photos { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 10px; margin: 0; }
.order-photos h3 { flex: 1 0 100%; }
.order-photos img { width: 76px; height: 76px; object-fit: cover; border-radius: 11px; transition: transform .2s ease, box-shadow .2s ease; }
.order-photos button { padding: 0; overflow: hidden; border: 0; border-radius: 11px; background: transparent; cursor: pointer; }
.order-photos button:hover img { transform: scale(1.035); box-shadow: 0 8px 22px rgba(5, 21, 43, .18); }
.order-drawer-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-width: 0; }
.order-drawer-footer > div { display: grid; min-width: 0; }
.order-drawer-footer > div span { color: #8a7d70; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.order-drawer-footer > div strong { margin-top: 3px; color: #05152b; font-size: 13px; overflow-wrap: anywhere; }
.order-drawer-footer__done { display: inline-flex; align-items: center; gap: 7px; color: #28785f; font-size: 12px; font-weight: 700; }
.order-drawer-footer__done svg { width: 17px; }
@keyframes order-reveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .orders-command { animation: none; } .order-photos img { transition: none; } }
@media (max-width: 1180px) {
  .orders-command { grid-template-columns: minmax(0, 1fr); }
  .orders-command__metrics { max-width: 560px; }
}
@media (max-width: 760px) {
  .orders-command { min-height: 0; padding: 22px; background-position: 66% center; }
  .orders-command__metrics { grid-template-columns: repeat(3, minmax(96px, 1fr)); max-width: none; overflow-x: auto; }
  .orders-command__metrics article { padding: 13px; }
  .order-toolbar__head { align-items: flex-start; }
  .order-toolbar__head > div { align-items: flex-start; flex-direction: column; gap: 3px; }
  .order-filter, .order-filter--date { flex: 1 1 100%; }
  .order-search { width: 100%; }
  .orders-table-shell { display: none; }
  .orders-mobile { display: grid; gap: 10px; padding: 12px; background: #f7f3ec; }
  .order-mobile-card { min-width: 0; padding: 16px; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 15px; }
  .order-mobile-card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .order-mobile-card h3 { margin: 14px 0 5px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 21px; font-weight: 520; line-height: 1.25; overflow-wrap: anywhere; }
  .order-mobile-card > p { margin: 0; color: #74685a; font-size: 12px; line-height: 1.5; }
  .order-mobile-card dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; margin: 18px 0 0; padding-top: 14px; border-top: 1px solid #efe4d4; }
  .order-mobile-card dl .is-wide { grid-column: 1 / -1; }
  .order-mobile-card dt { color: #8a7d70; font-size: 9px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
  .order-mobile-card dd { margin: 4px 0 0; color: #05152b; font-size: 12px; font-weight: 650; line-height: 1.45; overflow-wrap: anywhere; }
  .order-mobile-card footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .order-mobile-card footer :deep(.el-button + .el-button) { margin-left: 0; }
  .order-pager { justify-content: center; }
  .order-lead { padding: 20px; }
  .order-lead__topline { align-items: flex-start; }
  .order-lead__summary, .order-detail-grid, .order-facts, .order-quote { grid-template-columns: minmax(0, 1fr); }
  .order-panel--wide { grid-column: auto; }
  .order-facts .is-wide { grid-column: auto; }
  .order-lines article { grid-template-columns: minmax(0, 1fr); }
  .order-lines dl { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .supplier-demo { padding-right: 12px; padding-left: 12px; }
  .orders-command { padding: 19px; border-radius: 18px; }
  .orders-command__copy h2 { font-size: 30px; }
  .orders-command__metrics { grid-template-columns: repeat(3, 102px); margin-right: -19px; padding-right: 19px; }
  .order-toolbar { padding: 16px; }
  .order-lead__summary { grid-template-columns: minmax(0, 1fr); }
  .order-drawer-footer { align-items: stretch; flex-direction: column; }
  .order-drawer-footer :deep(.el-button), .order-drawer-footer__done { width: 100%; justify-content: center; }
}
@media (max-width: 1200px) { .supplier-facts { gap: 16px; }.metric-grid { grid-template-columns: repeat(2, 1fr); }.zone-grid { grid-template-columns: repeat(2, 1fr); }.form-grid--three { grid-template-columns: repeat(2, 1fr); }.overview-grid { grid-template-columns: 1fr; } }

/* Services & pricing workspace */
.pricing-command { position: relative; isolation: isolate; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(390px, .75fr); gap: 32px; align-items: end; min-width: 0; min-height: 244px; padding: 30px; overflow: hidden; color: #f7f1e6; background-color: #05152b; background-image: linear-gradient(90deg, rgba(5, 21, 43, .99) 0%, rgba(5, 21, 43, .93) 48%, rgba(5, 21, 43, .38) 100%), url("../../../../assets/images/admin/supplier-pricing-matrix.webp"); background-position: center right; background-size: cover; border: 1px solid rgba(232, 194, 122, .26); border-radius: 22px; box-shadow: 0 24px 54px rgba(5, 21, 43, .16); animation: pricing-reveal .42s ease-out both; }
.pricing-command::after { position: absolute; z-index: -1; inset: auto -8% -58% 42%; height: 190px; content: ""; background: radial-gradient(circle, rgba(232, 194, 122, .18), transparent 68%); pointer-events: none; }
.pricing-command__copy { min-width: 0; }
.pricing-command__copy > span, .pricing-editor-hero > div > span { color: #e8c27a; font-size: 10px; font-weight: 750; letter-spacing: .19em; text-transform: uppercase; }
.pricing-command h1, .pricing-editor-hero h1 { max-width: 720px; margin: 9px 0 8px; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: clamp(34px, 4vw, 50px); font-weight: 520; letter-spacing: -.035em; line-height: 1.04; overflow-wrap: anywhere; }
.pricing-command__copy > p { max-width: 680px; margin: 0; color: rgba(247, 241, 230, .72); font-size: 13px; line-height: 1.65; }
.pricing-command__supplier { display: flex; align-items: center; gap: 10px; min-width: 0; margin-top: 20px; }
.pricing-command__avatar { display: grid; flex: 0 0 40px; place-items: center; width: 40px; height: 40px; color: #05152b; background: linear-gradient(145deg, #f5dba9, #c89447); border-radius: 12px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .32); font-size: 11px; font-weight: 800; }
.pricing-command__supplier > span:nth-child(2) { display: grid; min-width: 0; }
.pricing-command__supplier small { color: rgba(247, 241, 230, .55); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
.pricing-command__supplier strong { margin-top: 2px; overflow: hidden; color: #fffdf8; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.pricing-command__supplier :deep(.el-tag) { margin-left: 4px; border-color: rgba(255, 255, 255, .22); }
.pricing-command__categories { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 13px; }
.pricing-command__categories small { color: rgba(247, 241, 230, .55); font-size: 10px; }
.pricing-command__categories em { max-width: 210px; padding: 4px 9px; overflow: hidden; color: #f7f1e6; background: rgba(255, 255, 255, .1); border: 1px solid rgba(255, 255, 255, .1); border-radius: 999px; font-size: 10px; font-style: normal; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.pricing-command__categories button { padding: 3px 0; color: #e8c27a; border: 0; border-bottom: 1px solid currentColor; background: transparent; font: inherit; font-size: 10px; font-weight: 700; cursor: pointer; }
.pricing-command__metrics { display: grid; grid-template-columns: repeat(3, minmax(104px, 1fr)); gap: 9px; min-width: 0; }
.pricing-command__metrics article { min-width: 0; min-height: 112px; padding: 14px; background: rgba(8, 28, 51, .64); border: 1px solid rgba(255, 255, 255, .12); border-radius: 16px; backdrop-filter: blur(10px); }
.pricing-command__metrics article.is-pending { border-color: rgba(232, 194, 122, .5); box-shadow: inset 0 2px 0 rgba(232, 194, 122, .42); }
.pricing-command__metrics small, .pricing-command__metrics span { display: block; overflow: hidden; text-overflow: ellipsis; }
.pricing-command__metrics small { color: rgba(247, 241, 230, .58); font-size: 9px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; white-space: nowrap; }
.pricing-command__metrics strong { display: block; margin: 10px 0 5px; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: 30px; font-weight: 520; line-height: 1; }
.pricing-command__metrics span { color: rgba(247, 241, 230, .62); font-size: 9px; line-height: 1.35; }
.sv-board { box-shadow: 0 14px 38px rgba(5, 21, 43, .07); }
.pricing-toolbar { align-items: center; gap: 16px; padding: 15px 18px; }
.pricing-filter { display: grid; grid-template-columns: minmax(145px, auto) 170px minmax(220px, 300px) auto; flex: 1; gap: 10px; min-width: 0; }
.pricing-filter__title { display: grid; align-content: center; min-width: 0; }
.pricing-filter__title strong { color: #05152b; font-size: 12px; }
.pricing-filter__title small { margin-top: 2px; color: #8a7d70; font-size: 9px; font-weight: 500; line-height: 1.3; }
.pricing-filter .el-select, .pricing-filter .el-input { width: 100%; min-width: 0; }
.pricing-actions { align-items: center; flex: 0 0 auto; padding: 0; }
.pricing-actions > small { color: #8a7d70; font-size: 10px; white-space: nowrap; }
.pricing-service-cell { display: flex; align-items: center; gap: 11px; min-width: 0; }
.pricing-service-cell > span { display: grid; flex: 0 0 36px; place-items: center; width: 36px; height: 36px; color: #8d5a32; background: linear-gradient(145deg, #f8efe1, #efe0ca); border-radius: 11px; font-size: 11px; font-weight: 800; }
.pricing-service-cell > div { display: grid; min-width: 0; gap: 3px; }
.pricing-service-cell strong { overflow: hidden; color: #05152b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.pricing-service-cell small { overflow: hidden; color: #8a7d70; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.quote-mode-pill { display: inline-flex; padding: 5px 8px; color: #5d4930; background: #f5ecdf; border-radius: 999px; font-size: 10px; font-weight: 700; }
.pricing-price { color: #23354b; font-size: 12px; font-weight: 750; }
.pricing-data-table :deep(.el-table__row) { cursor: pointer; }
.pricing-mobile-list { display: none; }

.sv-crumb { min-width: 0; overflow: hidden; white-space: nowrap; }
.sv-crumb > * { flex: 0 0 auto; }
.sv-crumb strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pricing-editor-hero { position: relative; isolation: isolate; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; min-width: 0; min-height: 176px; padding: 28px 30px; overflow: hidden; color: #f7f1e6; background-color: #05152b; background-image: linear-gradient(90deg, rgba(5, 21, 43, .99) 0%, rgba(5, 21, 43, .9) 50%, rgba(5, 21, 43, .36) 100%), url("../../../../assets/images/admin/supplier-pricing-matrix.webp"); background-position: center right; background-size: cover; border: 1px solid rgba(232, 194, 122, .26); border-radius: 20px; box-shadow: 0 20px 48px rgba(5, 21, 43, .14); animation: pricing-reveal .38s ease-out both; }
.pricing-editor-hero > div { min-width: 0; }
.pricing-editor-hero h1 { max-width: 820px; margin-top: 8px; font-size: clamp(30px, 3.6vw, 45px); }
.pricing-editor-hero p { margin: 0; color: rgba(247, 241, 230, .68); font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }
.pricing-editor-hero :deep(.el-tag) { flex: 0 0 auto; border-color: rgba(255, 255, 255, .2); }
.sv-quote { padding: 0; overflow: visible; background: transparent; border: 0; border-radius: 0; }
.pricing-editor-alert { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; padding: 14px 16px; color: #725122; background: #fff7e8; border: 1px solid #efd8ad; border-radius: 14px; }
.pricing-editor-alert > span, .pricing-editor-alert > svg { display: grid; flex: 0 0 30px; place-items: center; width: 30px; height: 30px; color: #9b6124; background: #ffe6bd; border-radius: 9px; font-weight: 800; }
.pricing-editor-alert > svg { padding: 6px; }
.pricing-editor-alert div { min-width: 0; }
.pricing-editor-alert strong { font-size: 12px; }
.pricing-editor-alert p { margin: 3px 0 0; font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.pricing-editor-alert.is-rejected { color: #8e3944; background: #fff0f1; border-color: #efcbd0; }
.pricing-editor-alert.is-rejected > span { color: #9f3f4b; background: #f9dfe3; }
.pricing-editor-layout { display: grid; grid-template-columns: minmax(0, 1fr) 286px; gap: 16px; align-items: start; min-width: 0; }
.pricing-editor-main { display: grid; gap: 14px; min-width: 0; }
.pricing-editor-section { min-width: 0; padding: 20px; background: #fffdf8; border: 1px solid #e4d8c6; border-radius: 18px; box-shadow: 0 12px 34px rgba(5, 21, 43, .05); }
.pricing-section-head { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 12px; align-items: start; margin-bottom: 16px; }
.pricing-section-head > span { display: grid; place-items: center; width: 34px; height: 34px; color: #8d5a32; background: #f5ecdf; border-radius: 10px; font-family: Fraunces, Georgia, serif; font-size: 12px; font-weight: 650; }
.pricing-section-head > div { min-width: 0; }
.pricing-section-head h2 { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 22px; font-weight: 520; letter-spacing: -.02em; }
.pricing-section-head p { margin: 4px 0 0; color: #7a7166; font-size: 11px; line-height: 1.5; }
.pricing-section-head p.spec-step-hint { margin-top: 8px; color: #9a3d08; font-size: 22px; font-weight: 750; line-height: 1.35; letter-spacing: -.02em; }
.pricing-section-head > em { align-self: center; min-width: 30px; padding: 5px 8px; color: #6e5c45; background: #f4eee5; border-radius: 999px; font-size: 10px; font-style: normal; font-weight: 800; text-align: center; }
.pricing-editor-section .mode-cards, .pricing-editor-section .quote-lines, .pricing-editor-section .quote-attaches { padding-right: 0; padding-left: 0; }
.pricing-editor-section .mode-cards { margin: 0; }
.mode-cards button { position: relative; grid-template-columns: 32px minmax(0, 1fr); grid-template-rows: auto auto; gap: 4px 10px; min-width: 0; min-height: 104px; padding: 16px; font: inherit; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease; }
.mode-cards button:hover:not(:disabled) { transform: translateY(-2px); border-color: #c8a66d; box-shadow: 0 10px 24px rgba(5, 21, 43, .08); }
.mode-cards button:focus-visible { outline: 3px solid rgba(200, 148, 71, .26); outline-offset: 2px; }
.mode-cards button:disabled { cursor: not-allowed; opacity: .68; }
.mode-card__mark { display: grid; grid-row: 1 / 3; place-items: center; width: 30px; height: 30px; color: #8d5a32; background: #f5ecdf; border-radius: 9px; font-family: Fraunces, Georgia, serif; font-size: 11px; font-weight: 700; }
.mode-cards button.is-on { background: linear-gradient(145deg, #071a31, #0e2b46); border-color: #163c5a; box-shadow: 0 14px 28px rgba(5, 21, 43, .14); }
.mode-cards button.is-on .mode-card__mark { color: #071a31; background: #e8c27a; }
.mode-cards button strong, .mode-cards button small { min-width: 0; overflow-wrap: anywhere; }
.rate-card { margin-top: 14px; padding: 14px; background: #f7f3ec; border: 1px solid #eadfce; border-radius: 14px; }
.rate-field { display: grid; align-content: start; gap: 7px; max-width: 320px; margin: 0; padding: 0; }
.rate-field > span:first-child { color: #5c564c; font-size: 11px; font-weight: 750; }
.currency-input { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: stretch; min-width: 0; overflow: hidden; background: #fff; border: 1px solid #dfd4c4; border-radius: 10px; }
.currency-input > b { display: flex; align-items: center; padding: 0 11px; color: #6f5b40; background: #f3eadc; border-right: 1px solid #dfd4c4; font-size: 10px; letter-spacing: .04em; }
.currency-input :deep(.el-input-number) { width: 100%; }
.currency-input :deep(.el-input__wrapper) { box-shadow: none; }
.pricing-editor-section .quote-lines { gap: 10px; max-height: none; overflow: visible; }
.quote-line { grid-template-columns: minmax(190px, 1.2fr) minmax(112px, .65fr) minmax(112px, .65fr) minmax(160px, .9fr); gap: 12px; align-items: start; padding: 14px; background: #fcfaf6; border-color: #e9decd; border-radius: 14px; transition: border-color .18s ease, box-shadow .18s ease; }
.quote-line:hover { border-color: #d7c4a8; box-shadow: 0 8px 20px rgba(5, 21, 43, .045); }
.quote-line__spec { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; align-items: start; min-width: 0; padding: 3px 0 0; }
.quote-line__spec > span { display: grid; place-items: center; width: 28px; height: 28px; color: #8d5a32; background: #f4eadb; border-radius: 8px; font-size: 9px; font-weight: 800; }
.quote-line__spec > div { display: grid; min-width: 0; gap: 4px; }
.quote-line__spec strong, .quote-attach__name :deep(.el-checkbox__label) { overflow-wrap: anywhere; }
.quote-line label > span:first-child { min-height: 16px; color: #74685a; font-size: 10px; font-weight: 750; }
.quote-line :deep(.el-input-number), .quote-line :deep(.el-input) { min-width: 0; }
.quote-line :deep(.el-input-group__prepend), .quote-attach :deep(.el-input-group__prepend) { padding: 0 9px; color: #705a3f; background: #f4ecdf; font-size: 9px; font-weight: 800; }
.quote-line__price { min-width: 0; }
.auto-price { display: flex; align-items: baseline; gap: 7px; min-width: 0; min-height: 32px; padding: 7px 10px; color: #205f50; background: #eaf6f1; border: 1px solid #cae8dc; border-radius: 8px; }
.auto-price small { color: #42806f; font-size: 9px; font-weight: 800; }
.auto-price strong { min-width: 0; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.field-help { color: #8a7d70; font-size: 9px; line-height: 1.35; }
.pricing-editor-section .quote-attaches { gap: 9px; margin-top: 0; }
.quote-attach { grid-template-columns: minmax(0, 1fr) minmax(180px, 240px); padding: 13px 14px; background: #fcfaf6; border-color: #eadfce; transition: border-color .18s ease, background .18s ease; }
.quote-attach.is-selected { background: #f9f5ed; border-color: #cfb384; box-shadow: inset 3px 0 0 #c89447; }
.quote-attach__name { overflow: hidden; }
.quote-attach__name :deep(.el-checkbox) { height: auto; min-width: 0; margin-right: 0; white-space: normal; }
.quote-attach__name :deep(.el-checkbox__label) { min-width: 0; line-height: 1.4; white-space: normal; }
.pricing-review-panel { position: sticky; top: 16px; display: grid; min-width: 0; padding: 19px; color: #f7f1e6; background: linear-gradient(155deg, #071a31, #0c2944); border: 1px solid rgba(232, 194, 122, .25); border-radius: 18px; box-shadow: 0 18px 42px rgba(5, 21, 43, .16); }
.pricing-review-panel > span { color: #e8c27a; font-size: 9px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.sv-quote .pricing-review-panel h3 { margin: 8px 0 15px; padding: 0; color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: 22px; font-weight: 520; line-height: 1.2; }
.pricing-review-panel dl { display: grid; gap: 0; margin: 0; }
.pricing-review-panel dl > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; padding: 11px 0; border-top: 1px solid rgba(255, 255, 255, .1); }
.pricing-review-panel dt { color: rgba(247, 241, 230, .55); font-size: 10px; }
.pricing-review-panel dd { min-width: 0; margin: 0; color: #fffdf8; font-size: 11px; font-weight: 750; text-align: right; overflow-wrap: anywhere; }
.pricing-review-panel button { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 10px; align-items: center; margin-top: 14px; padding: 13px; color: #05152b; text-align: left; background: linear-gradient(145deg, #f6ddb0, #d9ab65); border: 0; border-radius: 12px; cursor: pointer; }
.pricing-review-panel button span, .pricing-review-panel button small { min-width: 0; overflow-wrap: anywhere; }
.pricing-review-panel button span { font-size: 11px; font-weight: 800; }
.pricing-review-panel button small { color: #745a35; font-size: 9px; line-height: 1.4; }
.pricing-review-panel button b { grid-column: 2; grid-row: 1 / 3; font-size: 17px; }
.sv-quote__foot { position: sticky; z-index: 5; bottom: 0; min-width: 0; margin-top: 14px; padding: 13px 16px; background: rgba(255, 253, 248, .94); border: 1px solid #e1d3bf; border-radius: 15px; box-shadow: 0 -12px 32px rgba(5, 21, 43, .09); backdrop-filter: blur(14px); }
.sv-quote__foot > .sv-quote__foot-note { display: grid; min-width: 0; }
.sv-quote__foot-note span { color: #05152b; font-size: 11px; font-weight: 800; }
.sv-quote__foot-note small { margin-top: 2px; color: #8a7d70; font-size: 9px; overflow-wrap: anywhere; }
.service-editor-intro { display: grid; gap: 4px; min-width: 0; margin-bottom: 18px; padding: 17px 18px; color: #f7f1e6; background-color: #05152b; background-image: linear-gradient(90deg, rgba(5, 21, 43, .98), rgba(5, 21, 43, .68)), url("../../../../assets/images/admin/supplier-pricing-matrix.webp"); background-position: right center; background-size: cover; border-radius: 14px; }
.service-editor-intro span { color: #e8c27a; font-size: 9px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.service-editor-intro strong { color: #fffdf8; font-family: Fraunces, Georgia, serif; font-size: 23px; font-weight: 520; line-height: 1.2; overflow-wrap: anywhere; }
.service-editor-intro p { margin: 2px 0 0; color: rgba(247, 241, 230, .65); font-size: 10px; line-height: 1.5; }
.picker-fields .phone-row { align-items: center; min-width: 0; }
.picker-fields .phone-row > small { flex: 0 0 26px; color: #8a7d70; font-size: 9px; font-weight: 700; }
.phone-row .el-input { min-width: 0; }
@keyframes pricing-reveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .pricing-command, .pricing-editor-hero { animation: none; } .mode-cards button, .quote-line { transition: none; } }
@media (max-width: 1180px) {
  .pricing-command { grid-template-columns: minmax(0, 1fr); }
  .pricing-command__metrics { max-width: 560px; }
  .pricing-filter { grid-template-columns: minmax(145px, auto) minmax(150px, .7fr) minmax(190px, 1fr); }
  .pricing-filter > .el-button { grid-column: 2 / -1; justify-self: start; }
  .quote-line { grid-template-columns: minmax(0, 1fr) minmax(140px, .55fr); }
  .quote-line__spec, .quote-line__price { grid-column: auto; }
}
@media (max-width: 920px) {
  .pricing-editor-layout { grid-template-columns: minmax(0, 1fr); }
  .pricing-review-panel { position: static; grid-row: 1; }
  .pricing-review-panel dl { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .pricing-review-panel dl > div { align-items: flex-start; flex-direction: column; padding: 10px; border: 1px solid rgba(255, 255, 255, .1); border-radius: 10px; }
  .pricing-review-panel dd { text-align: left; }
  .pricing-review-panel button { max-width: 360px; }
}
@media (max-width: 760px) {
  .pricing-command { min-height: 0; padding: 22px; background-position: 66% center; }
  .pricing-command__metrics { grid-template-columns: repeat(3, minmax(100px, 1fr)); max-width: none; overflow-x: auto; }
  .pricing-command__metrics article { min-height: 102px; padding: 13px; }
  .pricing-toolbar { align-items: stretch; }
  .pricing-filter { grid-template-columns: minmax(0, 1fr); width: 100%; }
  .pricing-filter > .el-button { grid-column: auto; justify-self: start; }
  .pricing-actions { justify-content: space-between; width: 100%; padding: 0; }
  .pricing-data-table { display: none; }
  .pricing-mobile-list { display: grid; gap: 10px; padding: 12px; background: #f7f3ec; }
  .pricing-mobile-list > article { min-width: 0; padding: 15px; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 15px; box-shadow: 0 8px 20px rgba(5, 21, 43, .04); }
  .pricing-mobile-list > article > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .pricing-mobile-list > article > header :deep(.el-tag) { flex: 0 0 auto; }
  .pricing-mobile-list dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 14px 0 0; padding-top: 12px; border-top: 1px solid #efe4d4; }
  .pricing-mobile-list dt { color: #8a7d70; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .pricing-mobile-list dd { margin: 4px 0 0; color: #05152b; font-size: 11px; font-weight: 700; overflow-wrap: anywhere; }
  .pricing-mobile-list footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: 14px; }
  .pricing-mobile-list footer > span { display: flex; align-items: center; gap: 7px; color: #74685a; font-size: 10px; }
  .pricing-mobile-list footer > div { display: flex; flex-wrap: wrap; justify-content: flex-end; }
  .pricing-mobile-empty { margin: 24px 12px; color: #8a7d70; font-size: 12px; text-align: center; }
  .picker-row__fields { grid-template-columns: minmax(0, 1fr); margin-left: 0; }
  .pricing-editor-hero { min-height: 150px; padding: 22px; }
  .pricing-editor-hero { align-items: flex-start; flex-direction: column; }
  .pricing-editor-hero h1 { font-size: 32px; }
  .pricing-editor-section { padding: 16px; }
  .quote-line { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .quote-line__switch, .quote-line__spec, .quote-line__price { grid-column: 1 / -1; }
  .quote-line label.quote-line__switch { flex-direction: row; align-items: center; justify-content: space-between; }
  .pricing-review-panel dl { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sv-quote__foot { align-items: stretch; flex-direction: column; }
  .sv-quote__foot > div:last-child { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sv-quote__foot :deep(.el-button) { width: 100%; margin-left: 0; }
}
@media (max-width: 520px) {
  .profile-status { padding: 16px 16px 18px; }
  .profile-status strong, .profile-status.is-review strong { font-size: 28px; }
  .pricing-command { padding: 19px; border-radius: 18px; }
  .pricing-command h1 { font-size: 32px; }
  .pricing-command__supplier { flex-wrap: wrap; }
  .pricing-command__metrics { grid-template-columns: repeat(3, 104px); margin-right: -19px; padding-right: 19px; }
  .pricing-actions { align-items: stretch; flex-direction: column-reverse; }
  .pricing-actions :deep(.el-button) { width: 100%; }
  .pricing-editor-hero { padding: 19px; border-radius: 17px; }
  .pricing-editor-hero h1 { font-size: 29px; }
  .pricing-section-head { grid-template-columns: 30px minmax(0, 1fr) auto; gap: 9px; }
  .pricing-section-head > span { width: 30px; height: 30px; }
  .pricing-section-head h2 { font-size: 20px; }
  .pricing-section-head p.spec-step-hint { font-size: 18px; }
  .mode-cards { grid-template-columns: minmax(0, 1fr); }
  .quote-line { grid-template-columns: minmax(0, 1fr); }
  .quote-line__spec, .quote-line__price { grid-column: auto; }
  .quote-attach { grid-template-columns: minmax(0, 1fr); }
  .pricing-review-panel dl { grid-template-columns: minmax(0, 1fr); }
  .pricing-review-panel button { max-width: none; }
  .sv-quote__foot > div:last-child { grid-template-columns: minmax(0, 1fr); }
  .picker-fields { grid-template-columns: minmax(0, 1fr); }
  .picker-fields .phone-row { align-items: stretch; flex-wrap: wrap; }
  .picker-fields .phone-row > small { flex: 1 0 100%; }
  .picker-fields .phone-row .el-input { flex: 1 1 180px; }
}
</style>

<style>
.policy-preview.el-dialog { overflow: hidden; }
.policy-preview .el-dialog__body { padding: 0 0 18px; }
.policy-preview__stage { display: grid; place-items: center; min-height: 240px; max-height: 78vh; overflow: auto; padding: 16px; background: #f3f5f8; }
.policy-preview__stage img { max-width: 100%; max-height: 72vh; object-fit: contain; background: #fff; }
.policy-preview__stage iframe { width: 100%; height: 72vh; border: 0; background: #fff; }
.policy-preview__stage p { margin: 24px; color: #526070; }
.order-drawer.el-drawer { width: min(760px, 100vw) !important; max-width: 100vw; background: #f7f3ec; }
.order-drawer .el-drawer__header { flex: 0 0 auto; margin-bottom: 0; padding: 18px 24px; background: #fffdf8; border-bottom: 1px solid #e7dac7; }
.order-drawer .el-drawer__title { min-width: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 24px; font-weight: 520; letter-spacing: -.025em; overflow-wrap: anywhere; }
.order-drawer .el-drawer__close-btn { flex: 0 0 auto; width: 38px; height: 38px; margin: -5px -7px -5px 12px; border-radius: 10px; }
.order-drawer .el-drawer__close-btn:hover { color: #05152b; background: #f3eadc; }
.order-drawer .el-drawer__body { min-height: 0; padding: 16px 18px 20px; overflow: auto; }
.order-drawer .el-drawer__footer { flex: 0 0 auto; padding: 14px 18px; background: rgba(255, 253, 248, .96); border-top: 1px solid #e4d6c2; box-shadow: 0 -10px 28px rgba(5, 21, 43, .06); backdrop-filter: blur(12px); }
.supplier-form-dialog.el-dialog { --el-color-primary: #8d5a32; --el-color-primary-light-3: #aa7b55; --el-color-primary-light-5: #c6a68a; --el-color-primary-light-7: #dfcfc0; --el-color-primary-light-8: #eadfd6; --el-color-primary-light-9: #f5efea; --el-color-primary-dark-2: #714827; display: flex; flex-direction: column; max-width: calc(100vw - 32px); max-height: calc(100dvh - 32px); margin-top: 16px !important; margin-bottom: 16px; overflow: hidden; border-radius: 18px; background: #fffdf8; box-shadow: 0 28px 80px rgba(5, 21, 43, .24); }
.supplier-form-dialog .el-dialog__header { flex: 0 0 auto; margin-right: 0; padding: 20px 64px 16px 22px; border-bottom: 1px solid #eadfce; }
.supplier-form-dialog .el-dialog__title { color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 24px; font-weight: 520; line-height: 1.25; overflow-wrap: anywhere; }
.supplier-form-dialog .el-dialog__headerbtn { top: 12px; right: 14px; width: 40px; height: 40px; border-radius: 10px; }
.supplier-form-dialog .el-dialog__headerbtn:hover { background: #f3eadc; }
.supplier-form-dialog .el-dialog__body { flex: 1 1 auto; min-height: 0; padding: 20px 22px; overflow: auto; }
.supplier-form-dialog .el-dialog__footer { flex: 0 0 auto; padding: 14px 22px 16px; background: #fffdf8; border-top: 1px solid #eadfce; }
@media (max-width: 600px) {
  .order-drawer .el-drawer__header { padding: 15px 16px; }
  .order-drawer .el-drawer__body { padding: 12px; }
  .order-drawer .el-drawer__footer { padding: 12px; }
  .supplier-form-dialog.el-dialog { max-width: calc(100vw - 16px); max-height: calc(100dvh - 16px); margin-top: 8px !important; margin-bottom: 8px; border-radius: 14px; }
  .supplier-form-dialog .el-dialog__header { padding: 17px 58px 14px 17px; }
  .supplier-form-dialog .el-dialog__title { font-size: 21px; }
  .supplier-form-dialog .el-dialog__body { padding: 16px 17px; }
  .supplier-form-dialog .el-dialog__footer { padding: 12px 17px 14px; }
}
</style>

<style scoped>
@media (max-width: 820px) { .picker-fields, .picker-toolbar { grid-template-columns: 1fr; flex-direction: column; } .pricing-filter .el-input, .pricing-filter .el-select { width: 100%; } .supplier-demo { padding: 14px; } .supplier-demo--profile { padding: 0 0 20px; } .supplier-demo--profile .page-header h1 { font-size: 30px; } .supplier-demo--profile .dossier { padding: 0 12px; }.page-header, .supplier-strip, .table-toolbar, .schedule-toolbar, .pricing-toolbar { align-items: flex-start; flex-direction: column; }.page-header { gap: 12px; }.page-actions { flex-wrap: wrap; }.supplier-strip { gap: 14px; }.supplier-facts { flex-wrap: wrap; gap: 12px 20px; }.metric-grid { grid-template-columns: 1fr; }.overview-grid--bottom, .pricing-bottom-grid { grid-template-columns: 1fr; }.table-search { flex-wrap: wrap; }.table-search .el-input, .table-search .el-select { width: 100%; }.form-grid, .form-grid--three { grid-template-columns: 1fr; }.span-2 { grid-column: span 1; }.pricing-actions { padding-bottom: 13px; }.section-tabs :deep(.el-tabs__item) { padding: 0 10px; }.compliance-grid, .toggle-grid, .gender-capacity { grid-template-columns: 1fr; } }
</style>
