<template>
  <div
    class="supplier-demo"
    :class="{ 'supplier-demo--profile': section === 'profile', 'supplier-demo--mobile': mobile, 'supplier-demo--quote': (section === 'pricing' || section === 'package-pricing') && quoteDialog.visible }"
  >
    <section v-if="mobile && section === 'overview'" class="mobile-workspace-hero">
      <div class="mobile-workspace-hero__top"><span>HOURX PARTNER</span><em>{{ profileStatusLabel }}</em></div>
      <h1>{{ profileDisplayName || t('admin.supplierPortal.workspaceTitle') }}</h1>
      <p>{{ supplierNo || t('admin.supplierPortal.workspaceHint') }}</p>
      <button v-if="mobileMenuAllowed('profile')" type="button" @click="goTo('profile')">
        {{ individualSupplier ? t('admin.supplierProfile.personTitle') : mobileCopy.company }}<ArrowRight />
      </button>
    </section>
    <div v-if="mobile && section === 'overview'" class="mobile-workspace-shortcuts">
      <button v-if="mobileMenuAllowed('orders')" type="button" @click="goTo('orders')"><Tickets /><span>{{ t('admin.supplierOrders.title') }}</span><ArrowRight /></button>
      <button v-if="mobileMenuAllowed('staff') && !individualSupplier" type="button" @click="goTo('staff')"><UserFilled /><span>{{ t('admin.supplierStaff.title') }}</span><ArrowRight /></button>
      <button v-if="section === 'overview' && mobileMenuAllowed('pricing')" type="button" @click="goTo('pricing')"><Document /><span>{{ t('admin.supplierPortal.services') }}</span><ArrowRight /></button>
      <button v-if="section === 'overview' && mobileMenuAllowed('coverage-availability')" type="button" @click="goTo('coverage-availability')"><Calendar /><span>{{ t('admin.supplierAvailability.title') }}</span><ArrowRight /></button>
    </div>
    <header v-if="section !== 'pricing' && section !== 'package-pricing' && section !== 'staff' && !(mobile && section === 'overview')" class="page-header">
      <div>
        <p class="page-kicker">{{ meta.description }}</p>
        <h1>{{ meta.title }}</h1>
      </div>
      <div class="page-actions">
        <el-button
          v-if="section === 'settlement'"
          :icon="Download"
          @click="showToast('结算明细已生成 Demo 导出任务')"
          >导出结算</el-button
        >
        <el-button
          v-if="meta.primaryAction"
          type="primary"
          :icon="section === 'schedule' ? Plus : undefined"
          @click="handlePrimaryAction"
        >
          {{ meta.primaryAction }}
        </el-button>
      </div>
    </header>

    <template v-if="section === 'overview'">
      <section class="workspace-setup">
        <header>
          <div>
            <span class="portal-eyebrow">HOURX SUPPLIER PORTAL</span>
            <h2>{{ t("admin.supplierPortal.setupProgress") }}</h2>
          </div>
        </header>
        <p>{{ t("admin.supplierPortal.workspaceHint") }}</p>
        <div class="setup-cards">
          <article v-if="!mobile || mobileMenuAllowed('profile')">
            <h3>{{ t("admin.supplierPortal.profile") }}</h3>
            <p>{{ t("admin.supplierPortal.profileHint") }}</p>
            <p class="setup-status-label">
              {{ t("admin.supplierPortal.profileStatus") }}
            </p>
            <ul
              class="setup-status"
              :aria-label="t('admin.supplierPortal.profileStatus')"
            >
              <li
                v-for="item in profileStatusItems"
                :key="item.key"
                :class="[item.tone, { 'has-count': Number(item.count) > 0 }]"
              >
                <span>{{ item.label }}</span>
                <b class="portal-numeric">{{ item.count }}</b>
              </li>
            </ul>
            <el-button type="primary" @click="goTo('profile')"
              >{{ t("admin.supplierPortal.openProfile") }} <ArrowRight
            /></el-button>
          </article>
          <article v-if="!mobile || mobileMenuAllowed('coverage-availability')">
            <h3>{{ t("admin.supplierPortal.coverage") }}</h3>
            <p>{{ t("admin.supplierPortal.coverageHint") }}</p>
            <p class="setup-status-label">
              {{ t("admin.supplierPortal.coverageStatus") }}
            </p>
            <ul
              class="setup-status"
              :aria-label="t('admin.supplierPortal.coverageStatus')"
            >
              <li
                v-for="item in coverageStatusItems"
                :key="item.key"
                :class="[item.tone, { 'has-count': Number(item.count) > 0 }]"
              >
                <span>{{ item.label }}</span>
                <b class="portal-numeric">{{ item.count == null ? "—" : item.count }}</b>
              </li>
            </ul>
            <el-button @click="goTo('coverage-availability')"
              >{{ t("admin.supplierPortal.openCoverage") }} <ArrowRight
            /></el-button>
          </article>
          <article v-if="!mobile || mobileMenuAllowed('pricing')">
            <h3>{{ t("admin.supplierPortal.services") }}</h3>
            <p>{{ t("admin.supplierPortal.servicesHint") }}</p>
            <p class="setup-status-label">
              {{ t("admin.supplierPortal.quoteStatus") }}
            </p>
            <ul
              class="setup-status"
              :aria-label="t('admin.supplierPortal.quoteStatus')"
            >
              <li
                v-for="item in quoteStatusItems"
                :key="item.key"
                :class="[item.tone, { 'has-count': Number(item.count) > 0 }]"
              >
                <span>{{ item.label }}</span>
                <b class="portal-numeric">{{ item.count }}</b>
              </li>
            </ul>
            <el-button @click="goTo('pricing')"
              >{{ t("admin.supplierPortal.openServices") }} <ArrowRight
            /></el-button>
          </article>
          <article v-if="!mobile || mobileMenuAllowed('package-pricing')">
            <h3>{{ t("admin.supplierPortal.packages") }}</h3>
            <p>{{ t("admin.supplierPortal.packagesHint") }}</p>
            <el-button @click="openPackageQuotes"
              >{{ t("admin.supplierPortal.openPackages") }} <ArrowRight
            /></el-button>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="section === 'profile'">
      <div class="dossier">
        <aside class="dossier-rail">
          <p>{{ t("admin.supplierPortal.setupProgress") }}</p>
          <nav>
            <button
              v-for="item in profileNav"
              :key="item.id"
              type="button"
              :class="{
                'is-active':
                  profileView === 'section' &&
                  (profileSection === item.index ||
                    (item.index === 0 && profileSection === 1)),
                'is-alert': profileStepIncomplete(item.index),
              }"
              @click="openProfileSection(item.index)"
            >
              <span class="profile-step-copy"
                ><b>{{ item.title }}</b
                ><small
                  ><span
                    v-if="!profileStepIncomplete(item.index)"
                    class="profile-step-check"
                    aria-hidden="true"
                    >✓</span
                  >{{ profileStepLabel(item.index) }}</small
                ></span
              ><ArrowRight />
            </button>
          </nav>
          <div class="profile-progress">
            <span class="portal-numeric">{{
              t("admin.supplierPortal.sectionsComplete", {
                count: profileNav.filter(
                  (item) => !profileStepIncomplete(item.index),
                ).length,
                total: profileNav.length,
              })
            }}</span
            ><el-progress
              :percentage="
                Math.round(
                  (profileNav.filter(
                    (item) => !profileStepIncomplete(item.index),
                  ).length /
                    Math.max(profileNav.length, 1)) *
                    100,
                )
              "
              :show-text="false"
              color="#19976a"
            />
          </div>
          <small v-if="rejectReason">{{
            t("admin.supplierProfile.rejected", { reason: rejectReason })
          }}</small>
        </aside>

        <div class="profile-main">
          <div class="profile-status" :class="profileStatusClass" role="status">
            <div class="profile-status__heading">
              <span>{{ t("admin.supplierProfile.statusLabel") }}:</span>
              <strong>{{ profileStatusLabel }}</strong>
            </div>
            <p v-if="onboardingStatus === 1">
              {{ t("admin.supplierProfile.reviewHint") }}
            </p>
            <p v-else-if="onboardingStatus === 3 && rejectReason">
              {{
                t("admin.supplierProfile.rejected", { reason: rejectReason })
              }}
            </p>
          </div>
          <div class="lightbox">
            <div>
              <p>{{ lightboxCrumb }}</p>
              <h2>
                {{ lightboxTitle }}
              </h2>
              <small>{{ lightboxDesc }}</small>
            </div>
            <em :class="lightboxChipClass">{{ lightboxChip }}</em>
          </div>

          <div
            v-if="
              submitTried && profileIssues.length && profileView === 'section'
            "
            class="error-banner"
            role="alert"
          >
            <strong>{{
              t("admin.supplierProfile.fixCount", {
                count: profileIssues.length,
              })
            }}</strong>
            <button
              v-for="issue in profileIssues"
              :key="`${issue.section}-${issue.id}`"
              type="button"
              @click="jumpProfileField(issue)"
            >
              {{ profileSections[issue.section].title }} · {{ issue.message }}
            </button>
          </div>
          <p v-if="!profileEditable" class="review-lock">
            {{ t("admin.supplierProfile.locked") }}
          </p>

          <div
            class="dossier-sheet"
            :class="{ 'is-all': profileView === 'all', 'is-locked': !profileEditable }"
          >
            <section v-show="showProfileSection(0)">
              <header class="sec-h">
                <div>
                  <h2>{{ individualSupplier ? t("admin.supplierProfile.personTitle") : t("admin.supplierProfile.companyTitle") }}</h2>
                </div>
                <el-button
                  v-if="profileView === 'all'"
                  @click="openProfileSection(0)"
                  >{{ t("admin.supplierProfile.editSection") }}</el-button
                >
              </header>
              <div class="dossier-grid">
                <template v-if="individualSupplier">
                  <label
                    id="profile-field-fullName"
                    class="profile-field span-2"
                    :class="{ error: issueOf('fullName') }"
                  >
                    <span>{{ t("admin.supplierProfile.fullName") }} <i>*</i></span>
                    <el-input
                      v-model="companyForm.fullName"
                      maxlength="255"
                      :disabled="profileReadOnly"
                    />
                    <small v-if="issueOf('fullName')">{{ issueOf("fullName") }}</small>
                  </label>
                  <label
                    id="profile-field-dateOfBirth"
                    class="profile-field"
                    :class="{ error: issueOf('dateOfBirth') }"
                  >
                    <span>{{ t("admin.supplierProfile.dateOfBirth") }} <i>*</i></span>
                    <input v-if="mobile" v-model="companyForm.dateOfBirth" class="mobile-profile-date" type="date" :max="mobileBirthMax" :disabled="profileReadOnly" :aria-label="t('admin.supplierProfile.dateOfBirth')" />
                    <el-date-picker
                      v-else
                      v-model="companyForm.dateOfBirth"
                      type="date"
                      value-format="YYYY-MM-DD"
                      placeholder="YYYY-MM-DD"
                      :disabled="profileReadOnly"
                      :disabled-date="disableBirthDate"
                    />
                    <small v-if="issueOf('dateOfBirth')">{{ issueOf("dateOfBirth") }}</small>
                  </label>
                  <label
                    id="profile-field-nationality"
                    class="profile-field"
                    :class="{ error: issueOf('nationality') }"
                  >
                    <span>{{ t("admin.supplierProfile.nationality") }} <i>*</i></span>
                    <el-input
                      v-model="companyForm.nationality"
                      maxlength="64"
                      :disabled="profileReadOnly"
                    />
                    <small v-if="issueOf('nationality')">{{ issueOf("nationality") }}</small>
                  </label>
                  <label
                    id="profile-field-residentialCity"
                    class="profile-field span-2"
                    :class="{ error: issueOf('residentialCity') }"
                  >
                    <span>{{ t("admin.supplierProfile.residentialCity") }} <i>*</i></span>
                    <el-input
                      v-model="companyForm.residentialCity"
                      maxlength="64"
                      :disabled="profileReadOnly"
                    />
                    <small v-if="issueOf('residentialCity')">{{ issueOf("residentialCity") }}</small>
                  </label>
                </template>
                <label
                  v-if="!individualSupplier"
                  id="profile-field-companyName"
                  class="profile-field span-2"
                  :class="{ error: issueOf('companyName') }"
                >
                  <span
                    >{{ t("admin.supplierProfile.companyName") }} <i>*</i></span
                  >
                  <el-input
                    v-model="companyForm.companyName"
                    :disabled="profileReadOnly"
                  />
                  <small v-if="issueOf('companyName')">{{
                    issueOf("companyName")
                  }}</small>
                </label>
                <label
                  v-if="!individualSupplier"
                  id="profile-field-licenseNo"
                  class="profile-field"
                  :class="{ error: issueOf('licenseNo') }"
                >
                  <span
                    >{{ t("admin.supplierProfile.licenseNo") }} <i>*</i></span
                  >
                  <el-input
                    v-model="companyForm.licenseNo"
                    :disabled="profileReadOnly"
                  />
                  <small v-if="issueOf('licenseNo')">{{
                    issueOf("licenseNo")
                  }}</small>
                </label>
                <label
                  v-if="!individualSupplier"
                  id="profile-field-licenseIssuedBy"
                  class="profile-field"
                  :class="{
                    error:
                      issueOf('licenseIssuedBy') ||
                      issueOf('licenseIssuedByOther'),
                  }"
                >
                  <span
                    >{{ t("admin.supplierProfile.licenseIssuedBy") }}
                    <i>*</i></span
                  >
                  <el-select
                    v-model="companyForm.licenseIssuedBy"
                    filterable
                    :disabled="profileReadOnly"
                    :placeholder="
                      t('admin.supplierProfile.licenseIssuedByPlaceholder')
                    "
                    @change="onLicenseAuthorityChange"
                  >
                    <el-option-group
                      v-for="group in licenseAuthorities"
                      :key="group.emirate"
                      :label="group.emirate"
                    >
                      <el-option
                        v-for="item in group.items"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-option-group>
                  </el-select>
                  <el-input
                    v-if="
                      companyForm.licenseIssuedBy === LICENSE_AUTHORITY_OTHER
                    "
                    id="profile-field-licenseIssuedByOther"
                    v-model="companyForm.licenseIssuedByOther"
                    :disabled="profileReadOnly"
                    :placeholder="
                      t('admin.supplierProfile.licenseIssuedByOtherPlaceholder')
                    "
                  />
                  <small v-if="issueOf('licenseIssuedBy')">{{
                    issueOf("licenseIssuedBy")
                  }}</small>
                  <small v-if="issueOf('licenseIssuedByOther')">{{
                    issueOf("licenseIssuedByOther")
                  }}</small>
                </label>
                <label
                  v-if="!individualSupplier"
                  id="profile-field-licenseExpiry"
                  class="profile-field"
                  :class="{ error: issueOf('licenseExpiry') }"
                >
                  <span
                    >{{ t("admin.supplierProfile.licenseExpiry") }}
                    <i>*</i></span
                  >
                  <input v-if="mobile" v-model="companyForm.licenseExpiry" class="mobile-profile-date" type="date" :min="mobileLicenseMin" :disabled="profileReadOnly" :aria-label="t('admin.supplierProfile.licenseExpiry')" />
                  <el-date-picker
                    v-else
                    v-model="companyForm.licenseExpiry"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="YYYY-MM-DD"
                    :disabled="profileReadOnly"
                    :disabled-date="disableLicenseDate"
                  />
                  <small v-if="issueOf('licenseExpiry')">{{
                    issueOf("licenseExpiry")
                  }}</small>
                </label>
                <label class="profile-field"
                  ><span>{{ t("admin.supplierProfile.vat") }}</span
                  ><el-input
                    v-model="companyForm.trn"
                    :disabled="profileReadOnly"
                /></label>
                <label class="profile-field"
                  ><span>{{ individualSupplier ? t("admin.supplierProfile.yearsPersonal") : t("admin.supplierProfile.years") }}</span>
                  ><input
                    class="plain-count"
                    :value="wholeText(companyForm.years)"
                    inputmode="numeric"
                    :disabled="profileReadOnly"
                    @input="
                      companyForm.years = wholeOrZero(
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                /></label>
                <label
                  v-if="!individualSupplier"
                  id="profile-field-address"
                  class="profile-field span-2"
                  :class="{ error: issueOf('address') }"
                >
                  <span>{{ t("admin.supplierProfile.address") }} <i>*</i></span>
                  <el-input
                    v-model="companyForm.address"
                    :disabled="profileReadOnly"
                  />
                  <small v-if="issueOf('address')">{{
                    issueOf("address")
                  }}</small>
                </label>
              </div>
            </section>

            <section v-show="showProfileSection(1)">
              <h3 v-if="profileView === 'section'" class="profile-group-title">
                {{ t("admin.supplierProfile.contactTitle") }}
              </h3>
              <header v-else class="sec-h">
                <div>
                  <h2>{{ t("admin.supplierProfile.contactTitle") }}</h2>
                </div>
                <el-button
                  v-if="profileView === 'all'"
                  @click="openProfileSection(1)"
                  >{{ t("admin.supplierProfile.editSection") }}</el-button
                >
              </header>
              <div class="dossier-grid">
                <label
                  v-if="!individualSupplier"
                  id="profile-field-contact"
                  class="profile-field"
                  :class="{ error: issueOf('contact') }"
                >
                  <span
                    >{{ t("admin.supplierProfile.contactPerson") }}
                    <i>*</i></span
                  >
                  <el-input
                    v-model="companyForm.contact"
                    :disabled="profileReadOnly"
                  />
                  <small v-if="issueOf('contact')">{{
                    issueOf("contact")
                  }}</small>
                </label>
                <label
                  id="profile-field-email"
                  class="profile-field"
                  :class="{ error: issueOf('email') }"
                >
                  <span>{{ t("admin.supplierProfile.email") }} <i>*</i></span>
                  <el-input
                    v-model="companyForm.email"
                    :disabled="profileReadOnly"
                  />
                  <small v-if="issueOf('email')">{{ issueOf("email") }}</small>
                </label>
                <label
                  id="profile-field-mobile"
                  class="profile-field phone-field"
                  :class="{ error: issueOf('mobile') }"
                >
                  <span>{{ t("admin.supplierProfile.mobile") }} <i>*</i></span>
                  <el-input
                    v-model="companyForm.mobile"
                    maxlength="15"
                    inputmode="numeric"
                    :disabled="profileReadOnly"
                    :placeholder="t('admin.supplierProfile.phonePlaceholder')"
                  >
                    <template #prepend>
                      <el-select
                        v-model="companyForm.mobileCode"
                        class="dial-prepend"
                        :disabled="profileReadOnly"
                      >
                        <el-option
                          v-for="item in PHONE_DIAL_OPTIONS"
                          :key="item.value"
                          :label="item.value"
                          :value="item.value"
                          >{{ phoneDialLabel(item, locale) }}</el-option
                        >
                      </el-select>
                    </template>
                  </el-input>
                  <small v-if="issueOf('mobile')">{{
                    issueOf("mobile")
                  }}</small>
                </label>
                <div
                  id="profile-field-whatsapp"
                  class="profile-field phone-field"
                  :class="{ error: issueOf('whatsapp') }"
                >
                  <span
                    >{{ t("admin.supplierProfile.whatsapp") }} <i>*</i></span
                  >
                  <el-input
                    v-model="companyForm.whatsapp"
                    maxlength="15"
                    inputmode="numeric"
                    :disabled="profileReadOnly || whatsappSame"
                    :placeholder="t('admin.supplierProfile.phonePlaceholder')"
                  >
                    <template #prepend>
                      <el-select
                        v-model="companyForm.whatsappCode"
                        class="dial-prepend"
                        :disabled="profileReadOnly || whatsappSame"
                      >
                        <el-option
                          v-for="item in PHONE_DIAL_OPTIONS"
                          :key="`wa-${item.value}`"
                          :label="item.value"
                          :value="item.value"
                          >{{ phoneDialLabel(item, locale) }}</el-option
                        >
                      </el-select>
                    </template>
                  </el-input>
                  <label class="same-line">
                    <input
                      v-model="whatsappSame"
                      type="checkbox"
                      :disabled="profileReadOnly"
                      @change="syncWhatsapp"
                    />
                    <span>{{ t("admin.supplierProfile.sameAsMobile") }}</span>
                  </label>
                  <small v-if="issueOf('whatsapp')">{{
                    issueOf("whatsapp")
                  }}</small>
                </div>
              </div>
            </section>

            <section v-show="showProfileSection(2)">
              <header class="sec-h">
                <div>
                  <h2>{{ t("admin.supplierProfile.capacityTitle") }}</h2>
                </div>
                <el-button
                  v-if="profileView === 'all'"
                  @click="openProfileSection(2)"
                  >{{ t("admin.supplierProfile.editSection") }}</el-button
                >
              </header>
              <div class="service-pills">
                <strong>{{ t("admin.supplierProfile.yourServices") }}</strong>
                <p>{{ t("admin.supplierProfile.servicesFromPricing") }}</p>
                <div
                  v-if="offeredCategoryOptions.length"
                  class="service-category-options"
                >
                  <button
                    v-for="option in offeredCategoryOptions"
                    :key="option.categoryId"
                    type="button"
                    :disabled="profileReadOnly"
                    :class="{
                      'is-on': expectedServiceIds.includes(option.categoryId),
                    }"
                    :aria-pressed="
                      expectedServiceIds.includes(option.categoryId)
                    "
                    @click="toggleExpectedService(option)"
                  >
                    {{ serviceCategoryLabel(option, String(locale)) }}
                  </button>
                </div>
                <em v-else-if="!expectedServiceNameList.length">{{
                  t("admin.supplierProfile.noSelectedServices")
                }}</em>
                <div v-else>
                  <span v-for="name in expectedServiceNameList" :key="name">{{
                    name
                  }}</span>
                </div>
                <label v-if="otherServiceSelected" class="profile-field">
                  <span>{{
                    t("admin.supplierProfile.expectedServiceDescription")
                  }}</span>
                  <el-input
                    v-model="expectedServiceRemark"
                    type="textarea"
                    :rows="3"
                    maxlength="512"
                    show-word-limit
                    :disabled="profileReadOnly"
                    :placeholder="
                      t('admin.supplierProfile.serviceNotePlaceholder')
                    "
                  />
                </label>
              </div>
              <div class="dossier-grid align-fields">
                <label v-if="!individualSupplier" class="profile-field"
                  ><span>{{ t("admin.supplierProfile.workers") }}</span
                  ><input
                    class="plain-count"
                    :value="wholeText(capacityForm.workers)"
                    inputmode="numeric"
                    :disabled="profileReadOnly"
                    @input="
                      capacityForm.workers = wholeOrZero(
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                /></label>
                <label class="profile-field"
                  ><span>{{ t("admin.supplierProfile.leadTime") }}</span
                  ><input
                    class="plain-count"
                    :value="wholeText(capacityForm.leadTime)"
                    inputmode="numeric"
                    :disabled="profileReadOnly"
                    @input="
                      capacityForm.leadTime = wholeOrZero(
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                /></label>
                <h3 class="profile-group-title span-2">
                  {{ t("admin.supplierAvailability.workingHours") }}
                </h3>
                <label class="profile-field"
                  ><span>{{ t("admin.supplierProfile.workStart") }}</span
                  ><el-time-select
                    v-model="capacityForm.start"
                    start="06:00"
                    step="00:30"
                    end="12:00"
                    :disabled="profileReadOnly"
                /></label>
                <label class="profile-field"
                  ><span>{{ t("admin.supplierProfile.workEnd") }}</span
                  ><el-time-select
                    v-model="capacityForm.end"
                    start="14:00"
                    step="00:30"
                    end="23:30"
                    :disabled="profileReadOnly"
                /></label>
                <label v-if="!individualSupplier" class="profile-field"
                  ><span>{{ t("admin.supplierProfile.femaleStaff") }}</span
                  ><input
                    class="plain-count"
                    :value="wholeText(femaleStaffCount)"
                    inputmode="numeric"
                    :disabled="profileReadOnly"
                    @input="
                      femaleStaffCount = wholeOrZero(
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                /></label>
                <label v-if="!individualSupplier" class="profile-field"
                  ><span>{{ t("admin.supplierProfile.maleStaff") }}</span
                  ><input
                    class="plain-count"
                    :value="wholeText(maleStaffCount)"
                    inputmode="numeric"
                    :disabled="profileReadOnly"
                    @input="
                      maleStaffCount = wholeOrZero(
                        ($event.target as HTMLInputElement).value,
                      )
                    "
                /></label>
              </div>
              <h3 class="profile-group-title">
                {{ t("admin.supplierPortal.operations") }}
              </h3>
              <div class="dossier-toggles">
                <template v-for="item in capacityToggles" :key="item.key">
                  <label v-if="item.key !== 'weekend'">
                    <span
                      ><strong>{{
                        t(`admin.supplierProfile.${item.key}`)
                      }}</strong></span
                    >
                    <el-switch
                      :model-value="item.enabled"
                      :disabled="profileReadOnly"
                      @change="
                        (value: boolean) => onCapacityToggle(item.key, value)
                      "
                    />
                  </label>
                </template>
                <label
                  ><span
                    ><strong>{{
                      t("admin.supplierProfile.ownVehicle")
                    }}</strong></span
                  ><el-switch
                    v-model="ownTransportation"
                    :disabled="profileReadOnly"
                /></label>
                <label
                  ><span
                    ><strong>{{
                      t("admin.supplierProfile.ownEquipment")
                    }}</strong></span
                  ><el-switch
                    v-model="complianceItems[3].enabled"
                    :disabled="profileReadOnly"
                /></label>
                <label
                  ><span
                    ><strong>{{
                      t("admin.supplierProfile.taxInvoice")
                    }}</strong></span
                  ><el-switch
                    v-model="complianceItems[2].enabled"
                    :disabled="profileReadOnly"
                /></label>
              </div>
              <h3 class="profile-group-title">
                {{ t("admin.supplierPortal.compliance") }}
              </h3>
              <div class="dossier-toggles">
                <div class="dossier-toggle">
                  <span
                    ><strong>{{
                      t("admin.supplierProfile.wearUniform")
                    }}</strong></span
                  >
                  <el-radio-group
                    v-model="wearUniform"
                    :aria-label="t('admin.supplierProfile.wearUniform')"
                    :disabled="profileReadOnly"
                  >
                    <el-radio :value="1">{{
                      t("admin.supplierProfile.yes")
                    }}</el-radio>
                    <el-radio :value="0">{{
                      t("admin.supplierProfile.no")
                    }}</el-radio>
                  </el-radio-group>
                </div>
                <label
                  ><span
                    ><strong>{{
                      t("admin.supplierProfile.taxInvoice")
                    }}</strong></span
                  ><el-switch
                    v-model="complianceItems[2].enabled"
                    :disabled="profileReadOnly"
                /></label>
              </div>
              <div v-if="!individualSupplier" class="community-picks">
                <strong
                  >{{ t("admin.supplierProfile.communities") }} <i>*</i></strong
                >
                <div
                  class="community-picks__options"
                  role="group"
                  :aria-label="t('admin.supplierProfile.communities')"
                >
                  <button
                    v-for="item in communityChips"
                    :key="item.key"
                    type="button"
                    :class="{ 'is-on': item.value === 1 }"
                    :aria-pressed="item.value === 1"
                    :disabled="profileReadOnly"
                    @click="toggleCommunity(item.key)"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>
              <label
                v-if="!individualSupplier && asYesNo(otherCommunityOnboarded) === 1"
                id="profile-field-communities"
                class="profile-field"
                :class="{ error: issueOf('communities') }"
              >
                <span
                  >{{ t("admin.supplierProfile.applyRenmark") }} <i>*</i></span
                >
                <el-input
                  v-model="applyRenmark"
                  type="textarea"
                  :rows="3"
                  maxlength="512"
                  show-word-limit
                  :disabled="profileReadOnly"
                />
                <small v-if="issueOf('communities')">{{
                  issueOf("communities")
                }}</small>
              </label>
            </section>

            <section v-show="showProfileSection(3)">
              <h3 class="profile-group-title">
                {{ t("admin.supplierPortal.payoutDetails") }}
              </h3>
              <div class="dossier-grid">
                <label
                  id="profile-field-accountName"
                  class="profile-field"
                  :class="{ error: issueOf('accountName') }"
                  ><span
                    >{{ t("admin.supplierProfile.accountName") }} <i>*</i></span
                  ><el-input
                    v-model="bankForm.accountName"
                    :disabled="profileReadOnly"
                  /><small>{{ t("admin.supplierProfile.accountNameHint") }}</small
                  ><small v-if="issueOf('accountName')">{{
                    issueOf("accountName")
                  }}</small></label
                >
                <label
                  id="profile-field-bankName"
                  class="profile-field"
                  :class="{ error: issueOf('bankName') || issueOf('bankNameOther') }"
                  ><span
                    >{{ t("admin.supplierProfile.bankName") }} <i>*</i></span
                  ><el-select
                    v-model="bankForm.bankName"
                    filterable
                    :disabled="profileReadOnly"
                    :placeholder="t('admin.supplierProfile.bankNamePlaceholder')"
                  >
                    <el-option
                      v-for="bank in uaeBanks"
                      :key="bank"
                      :label="bank === BANK_OTHER ? t('admin.supplierProfile.bankOther') : bank"
                      :value="bank"
                    />
                  </el-select>
                  <el-input
                    v-if="bankForm.bankName === BANK_OTHER"
                    v-model="bankForm.bankNameOther"
                    :disabled="profileReadOnly"
                    :placeholder="t('admin.supplierProfile.bankNamePlaceholder')"
                  />
                  <small v-if="issueOf('bankName')">{{
                    issueOf("bankName")
                  }}</small>
                  <small v-if="issueOf('bankNameOther')">{{
                    issueOf("bankNameOther")
                  }}</small></label
                >
                <label
                  id="profile-field-iban"
                  class="profile-field span-2"
                  :class="{ error: issueOf('iban') }"
                  ><span>{{ t("admin.supplierProfile.iban") }} <i>*</i></span
                  ><el-input
                    v-model="bankForm.iban"
                    :disabled="profileReadOnly"
                  /><small v-if="issueOf('iban')">{{ issueOf("iban") }}</small
                ></label>
                <label
                  id="profile-field-swift"
                  class="profile-field"
                  :class="{ error: issueOf('swift') }"
                  ><span>{{ t("admin.supplierProfile.swift") }}</span
                  ><el-input
                    v-model="bankForm.swift"
                    :disabled="profileReadOnly"
                  /><small v-if="issueOf('swift')">{{ issueOf("swift") }}</small></label
                >
                <label class="profile-field"
                  ><span>{{ t("admin.supplierProfile.currency") }}</span
                  ><strong class="currency-fixed">{{
                    t("admin.supplierProfile.currencyFixed")
                  }}</strong></label
                >
              </div>
            </section>

            <section v-show="showProfileSection(3)">
              <h3 class="profile-group-title">
                {{ t("admin.supplierPortal.verificationDocs") }}
              </h3>
              <p class="document-hint">
                {{ t("admin.supplierPortal.documentHint") }}
              </p>
              <div
                v-if="!individualSupplier"
                id="profile-field-tradeLicense"
                class="doc-row"
                :class="{ error: issueOf('tradeLicense') }"
              >
                <div>
                  <strong
                    >{{ t("admin.supplierProfile.tradeLicenseFile") }} <i>*</i>
                    <el-tag
                      size="small"
                      :type="tradeLicenseFiles.length ? 'success' : 'warning'"
                      >{{
                        t(
                          tradeLicenseFiles.length
                            ? "admin.supplierPortal.uploaded"
                            : "admin.supplierPortal.notUploaded",
                        )
                      }}</el-tag
                    ></strong
                  >
                  <p
                    v-for="(url, index) in tradeLicenseFiles"
                    :key="`trade-${url}-${index}`"
                  >
                    <button type="button" @click="openFilePreview(url)">
                      {{ fileNameFromUrl(url) }}
                    </button>
                    <button
                      v-if="!profileReadOnly"
                      type="button"
                      class="is-remove"
                      @click="removeDocFile('trade', index)"
                    >
                      {{ t("admin.supplierProfile.remove") }}
                    </button>
                  </p>
                  <small v-if="!tradeLicenseFiles.length">{{
                    t("admin.supplierProfile.notUploaded")
                  }}</small>
                  <small v-if="issueOf('tradeLicense')" class="err">{{
                    issueOf("tradeLicense")
                  }}</small>
                  <small v-if="docUploading('trade')" class="doc-uploading">{{
                    uploadStatusText("trade")
                  }}</small>
                  <div
                    v-if="docUploading('trade')"
                    class="doc-progress"
                    role="progressbar"
                    :aria-valuenow="docUploadPercent('trade')"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="uploadStatusText('trade')"
                  >
                    <span
                      :style="{
                        width: `${Math.max(docUploadPercent('trade'), 8)}%`,
                      }"
                    ></span>
                  </div>
                </div>
                <el-upload
                  v-if="!profileReadOnly"
                  :disabled="docUploading('trade')"
                  :show-file-list="false"
                  :http-request="(options) => uploadDocFile('trade', options)"
                >
                  <el-button :loading="docUploading('trade')">{{
                    tradeLicenseFiles.length
                      ? t("admin.supplierProfile.replaceFile")
                      : t("admin.supplierProfile.upload")
                  }}</el-button>
                </el-upload>
              </div>
              <div v-for="doc in insuranceDocs" :key="doc.id" class="doc-row">
                <div>
                  <strong
                    >{{ doc.label }}
                    <el-tag
                      size="small"
                      :type="doc.files.length ? 'success' : 'info'"
                      >{{
                        t(
                          doc.files.length
                            ? "admin.supplierPortal.uploaded"
                            : "admin.supplierPortal.notUploaded",
                        )
                      }}</el-tag
                    ></strong
                  >
                  <p
                    v-for="(url, index) in doc.files"
                    :key="`${doc.id}-${url}-${index}`"
                  >
                    <button type="button" @click="openFilePreview(url)">
                      {{ fileNameFromUrl(url) }}
                    </button>
                    <button
                      v-if="!profileReadOnly"
                      type="button"
                      class="is-remove"
                      @click="removeDocFile(doc.id, index)"
                    >
                      {{ t("admin.supplierProfile.remove") }}
                    </button>
                  </p>
                  <small v-if="!doc.files.length">{{
                    t("admin.supplierProfile.notUploaded")
                  }}</small>
                  <small v-if="docUploading(doc.id)" class="doc-uploading">{{
                    uploadStatusText(doc.id)
                  }}</small>
                  <div
                    v-if="docUploading(doc.id)"
                    class="doc-progress"
                    role="progressbar"
                    :aria-valuenow="docUploadPercent(doc.id)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="uploadStatusText(doc.id)"
                  >
                    <span
                      :style="{
                        width: `${Math.max(docUploadPercent(doc.id), 8)}%`,
                      }"
                    ></span>
                  </div>
                </div>
                <el-upload
                  v-if="!profileReadOnly"
                  :disabled="docUploading(doc.id)"
                  :show-file-list="false"
                  :http-request="(options) => uploadDocFile(doc.id, options)"
                >
                  <el-button :loading="docUploading(doc.id)">{{
                    doc.files.length
                      ? t("admin.supplierProfile.replaceFile")
                      : t("admin.supplierProfile.upload")
                  }}</el-button>
                </el-upload>
              </div>
              <div
                id="profile-field-bankCertificate"
                class="doc-row"
                :class="{ error: issueOf('bankCertificate') }"
              >
                <div>
                  <strong
                    >{{ t("admin.supplierProfile.otherDocuments") }} <i>*</i>
                    <el-tag
                      size="small"
                      :type="otherDocumentFiles.length ? 'success' : 'warning'"
                      >{{
                        t(
                          otherDocumentFiles.length
                            ? "admin.supplierPortal.uploaded"
                            : "admin.supplierPortal.notUploaded",
                        )
                      }}</el-tag
                    ></strong
                  >
                  <p
                    v-for="(url, index) in otherDocumentFiles"
                    :key="`other-${url}-${index}`"
                  >
                    <button type="button" @click="openFilePreview(url)">
                      {{ fileNameFromUrl(url) }}
                    </button>
                    <button
                      v-if="!profileReadOnly"
                      type="button"
                      class="is-remove"
                      @click="removeDocFile('other', index)"
                    >
                      {{ t("admin.supplierProfile.remove") }}
                    </button>
                  </p>
                  <small v-if="!otherDocumentFiles.length">{{
                    t("admin.supplierProfile.notUploaded")
                  }}</small>
                  <small v-if="issueOf('bankCertificate')" class="err">{{
                    issueOf("bankCertificate")
                  }}</small>
                  <small v-if="docUploading('other')" class="doc-uploading">{{
                    uploadStatusText("other")
                  }}</small>
                  <div
                    v-if="docUploading('other')"
                    class="doc-progress"
                    role="progressbar"
                    :aria-valuenow="docUploadPercent('other')"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="uploadStatusText('other')"
                  >
                    <span
                      :style="{
                        width: `${Math.max(docUploadPercent('other'), 8)}%`,
                      }"
                    ></span>
                  </div>
                </div>
                <el-upload
                  v-if="!profileReadOnly"
                  :disabled="docUploading('other')"
                  :show-file-list="false"
                  :http-request="(options) => uploadDocFile('other', options)"
                >
                  <el-button :loading="docUploading('other')">{{
                    otherDocumentFiles.length
                      ? t("admin.supplierProfile.replaceFile")
                      : t("admin.supplierProfile.upload")
                  }}</el-button>
                </el-upload>
              </div>
              <div id="profile-field-vatCertificate" class="doc-row">
                <div>
                  <strong
                    >{{ t("admin.supplierProfile.vatCertificate") }}
                    <el-tag
                      size="small"
                      :type="vatCertificateFiles.length ? 'success' : 'info'"
                      >{{
                        t(
                          vatCertificateFiles.length
                            ? "admin.supplierPortal.uploaded"
                            : "admin.supplierPortal.notUploaded",
                        )
                      }}</el-tag
                    ></strong
                  >
                  <p
                    v-for="(url, index) in vatCertificateFiles"
                    :key="`vat-${url}-${index}`"
                  >
                    <button type="button" @click="openFilePreview(url)">
                      {{ fileNameFromUrl(url) }}
                    </button>
                    <button
                      v-if="!profileReadOnly"
                      type="button"
                      class="is-remove"
                      @click="removeDocFile('vat', index)"
                    >
                      {{ t("admin.supplierProfile.remove") }}
                    </button>
                  </p>
                  <small v-if="!vatCertificateFiles.length">{{
                    t("admin.supplierProfile.notUploaded")
                  }}</small>
                  <small v-if="docUploading('vat')" class="doc-uploading">{{
                    uploadStatusText("vat")
                  }}</small>
                  <div
                    v-if="docUploading('vat')"
                    class="doc-progress"
                    role="progressbar"
                    :aria-valuenow="docUploadPercent('vat')"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="uploadStatusText('vat')"
                  >
                    <span
                      :style="{
                        width: `${Math.max(docUploadPercent('vat'), 8)}%`,
                      }"
                    ></span>
                  </div>
                </div>
                <el-upload
                  v-if="!profileReadOnly"
                  :disabled="docUploading('vat')"
                  :show-file-list="false"
                  :http-request="(options) => uploadDocFile('vat', options)"
                >
                  <el-button :loading="docUploading('vat')">{{
                    vatCertificateFiles.length
                      ? t("admin.supplierProfile.replaceFile")
                      : t("admin.supplierProfile.upload")
                  }}</el-button>
                </el-upload>
              </div>
            </section>
          </div>

          <Teleport to="#supplier-mobile-actions" :disabled="!mobile" defer>
          <footer v-if="profileView === 'section'" class="profile-footer" :class="{ 'profile-footer--mobile': mobile }">
            <div>
              <el-button v-if="profileFromAll" @click="backToFullProfile">{{
                t("admin.supplierProfile.backToProfile")
              }}</el-button>
              <el-button
                v-else-if="adjacentProfileIndex(-1) != null"
                @click="moveProfileSection(-1)"
                >{{
                  mobile ? mobileCopy.previous : t("admin.supplierPortal.previousTo", {
                    section: profileSections[adjacentProfileIndex(-1) || 0].title,
                  })
                }}</el-button
              >
            </div>
            <div>
              <el-button
                v-if="profileEditable && !needsResubmit"
                :loading="saving"
                @click="saveProfile(0)"
                >{{
                  profileSection === 2
                    ? t("admin.user.actions.save")
                    : t("admin.supplierProfile.saveDraft")
                }}</el-button
              >
              <el-button
                v-if="!profileFromAll && adjacentProfileIndex(1) != null"
                type="primary"
                @click="moveProfileSection(1)"
                >{{
                  mobile ? mobileCopy.continue : t("admin.supplierPortal.continueTo", {
                    section: profileSections[adjacentProfileIndex(1) || 0].title,
                  })
                }}</el-button
              >
              <el-button
                v-if="
                  canAction('btn:/admin/supplier-management/profile:save') &&
                  profileEditable &&
                  (profileFromAll ||
                    profileSection === profileSections.length - 1)
                "
                type="primary"
                :disabled="saving"
                :loading="saving"
                @click="submitProfileForm"
              >
                {{
                  mobile ? (needsResubmit ? mobileCopy.resubmitReview : mobileCopy.submitReview) : t(
                    needsResubmit
                      ? "admin.supplierProfile.resubmit"
                      : "admin.supplierProfile.submitReview",
                  )
                }}
              </el-button>
            </div>
          </footer>
          </Teleport>
          <div
            v-if="
              profileSection === 3 && profileEditable && profileIssues.length
            "
            class="profile-missing"
          >
            <strong>{{ t("admin.supplierPortal.missingProfile") }}</strong
            ><button
              v-for="issue in profileIssues"
              :key="issue.id"
              type="button"
              @click="jumpProfileField(issue)"
            >
              {{ issue.message }}
            </button>
          </div>
        </div>
      </div>
      <el-dialog
        v-model="profileSubmittedOpen"
        class="profile-success-dialog"
        width="min(620px, calc(100vw - 28px))"
        align-center
        :show-close="false"
        :close-on-click-modal="false"
      >
        <div class="submission-result">
          <span class="submission-check"><Check /></span>
          <div class="submission-result__intro">
            <h2>{{ t("admin.supplierPortal.profileSubmitted") }}</h2>
            <p>{{ t("admin.supplierPortal.profileSubmittedHint") }}</p>
          </div>

          <div class="submission-next">
            <strong class="submission-next__title">{{
              t("admin.supplierPortal.continueSetup")
            }}</strong>
            <div class="submission-next__actions">
              <button
                type="button"
                class="submission-next-card"
                @click="continueProfileSetup('coverage-availability')"
              >
                <span class="submission-next-card__icon"><Location /></span>
                <span class="submission-next-card__copy">
                  <strong>{{ t("admin.supplierPortal.openCoverage") }}</strong>
                  <small>{{
                    t("admin.supplierPortal.coverageSetupHint")
                  }}</small>
                </span>
                <ArrowRight />
              </button>

              <button
                type="button"
                class="submission-next-card is-pricing"
                @click="continueProfileSetup('pricing')"
              >
                <span class="submission-next-card__icon"><Money /></span>
                <span class="submission-next-card__copy">
                  <strong>{{
                    t("admin.supplierPortal.setupServicesPricing")
                  }}</strong>
                  <small>{{ t("admin.supplierPortal.pricingSetupHint") }}</small>
                </span>
                <ArrowRight />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="submission-later"
            @click="continueProfileSetup('overview')"
          >
            {{ t("admin.supplierPortal.setupLater") }}
          </button>
        </div>
      </el-dialog>
    </template>

    <template
      v-else-if="
        ['service-area', 'availability', 'coverage-availability'].includes(
          section,
        )
      "
    >
      <SupplierAvailability
        :mobile="mobile"
        :enabled="supplierEnabled"
        :accept-dispatch="supplierAcceptDispatch"
        :review-status="onboardingStatus"
        :dispatch-saving="dispatchSaving"
        :can-toggle="Boolean(supplierRecordId)"
        :operations-ready="dispatchOperationsReady"
        :services="availabilityServices"
        :areas="availabilityAreas"
        :coverage-rows="coverageWorkspaceRows"
        :coverage-loading="editorLoading && !areaCatalogReady"
        @manage-coverage="openAreaEditor"
        @toggle-dispatch="toggleAcceptDispatch"
      />
      <el-dialog
        v-model="areaEditorVisible"
        class="supplier-form-dialog area-manage-dialog"
        :title="t('admin.supplierArea.dialogTitle')"
        width="min(820px, calc(100vw - 32px))"
        :close-on-click-modal="false"
        append-to-body
      >
        <div class="area-manage-tools">
          <el-input
            v-model="areaKeyword"
            :prefix-icon="Search"
            clearable
            :placeholder="t('admin.supplierArea.searchPlaceholder')"
          />
          <div>
            <el-button @click="selectAllAreas">{{
              t("admin.supplierArea.selectAll")
            }}</el-button>
            <el-button @click="clearAllAreas">{{
              t("admin.supplierArea.clearAll")
            }}</el-button>
          </div>
        </div>
        <p class="area-manage-note">{{ t("admin.supplierArea.searchNote") }}</p>
        <div v-loading="editorLoading" class="area-zone-list">
          <article
            v-for="area in editorZones"
            :key="area.id"
            class="area-zone"
            :class="{ 'is-open': expandedAreaIds.includes(area.id) }"
          >
            <header>
              <input
                :ref="(el) => bindZoneBox(el as Element | null, area.id)"
                type="checkbox"
                :checked="zoneMode(area.id) === 'all'"
                @change="toggleZone(area.id)"
              />
              <button type="button" @click="toggleExpanded(area.id)">
                <strong>
                  <template
                    v-for="(part, index) in highlight(area.name)"
                    :key="`${area.id}-${index}`"
                  >
                    <mark v-if="part.hit">{{ part.text }}</mark
                    ><template v-else>{{ part.text }}</template>
                  </template>
                </strong>
                <small>{{
                  t("admin.supplierArea.communityCount", {
                    count: (communitiesByArea[area.id] || []).length,
                  })
                }}</small>
              </button>
              <button
                type="button"
                class="area-zone__chevron"
                :aria-expanded="expandedAreaIds.includes(area.id)"
                @click="toggleExpanded(area.id)"
              >
                {{ expandedAreaIds.includes(area.id) ? "▾" : "▸" }}
              </button>
            </header>
            <div
              v-if="expandedAreaIds.includes(area.id)"
              class="area-communities"
            >
              <p v-if="!(communitiesByArea[area.id] || []).length">
                {{ t("admin.supplierArea.noCommunities") }}
              </p>
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
                  <template
                    v-for="(part, index) in highlight(community.name)"
                    :key="`${community.id}-${index}`"
                  >
                    <mark v-if="part.hit">{{ part.text }}</mark
                    ><template v-else>{{ part.text }}</template>
                  </template>
                </span>
              </label>
            </div>
          </article>
          <p v-if="!editorLoading && !editorZones.length" class="policy-empty">
            {{ t("admin.supplierArea.noAreas") }}
          </p>
        </div>
        <template #footer>
          <div class="area-dialog-foot">
            <span>{{
              t("admin.supplierArea.selectedSummary", {
                summary: coverageSummary(
                  draftSummary.areas,
                  draftSummary.communities,
                ),
              })
            }}</span>
            <div>
              <el-button @click="areaEditorVisible = false">{{
                t("admin.supplierArea.cancel")
              }}</el-button>
              <el-button v-if="canAction('btn:/admin/supplier-management/service-area:save')" type="primary" :loading="saving" @click="saveAreas">{{
                t("admin.supplierArea.save")
              }}</el-button>
            </div>
          </div>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="section === 'staff' && !individualSupplier">
      <StaffBoard :mobile="mobile" />
    </template>

    <template v-else-if="section === 'schedule'">
      <section class="review-banner schedule-review">
        <span><Clock /></span>
        <div>
          <strong>2 个排班动作待处理</strong>
          <p>1 个休假申请和 1 个时间冲突需要确认。</p>
        </div>
        <el-button size="small" @click="showToast('已打开待处理排班动作')"
          >查看</el-button
        >
      </section>
      <div class="schedule-toolbar">
        <div class="week-navigation">
          <el-button
            circle
            :icon="ArrowLeft"
            @click="showToast('已切换到上一周')"
          />
          <div>
            <strong class="portal-numeric">2026年9月21日 – 9月27日</strong
            ><span>Asia/Dubai · GST</span>
          </div>
          <el-button
            circle
            :icon="ArrowRight"
            @click="showToast('已切换到下一周')"
          />
          <el-button @click="showToast('已返回本周')">本周</el-button>
        </div>
        <div class="schedule-filters">
          <el-radio-group v-model="scheduleView" size="small"
            ><el-radio-button value="day">日</el-radio-button
            ><el-radio-button value="week">周</el-radio-button></el-radio-group
          ><el-select v-model="scheduleSkill"
            ><el-option label="全部服务" value="all" /><el-option
              label="Cleaning"
              value="Cleaning" /><el-option
              label="AC Service"
              value="AC Service" /></el-select
          ><el-button
            :icon="Plus"
            type="primary"
            @click="shiftDialogVisible = true"
            >添加班次 / Block</el-button
          >
        </div>
      </div>
      <div class="metric-grid metric-grid--schedule">
        <article class="mini-metric">
          <span>本周可用工时</span><strong>1,284h</strong
          ><small class="positive">+8.2% vs last week</small>
        </article>
        <article class="mini-metric">
          <span>已分配工时</span><strong>936h</strong
          ><small>72.9% utilization</small>
        </article>
        <article class="mini-metric">
          <span>未覆盖班次</span><strong>7</strong
          ><small class="warning-text">需要安排人员</small>
        </article>
        <article class="mini-metric">
          <span>休假申请</span><strong>4</strong
          ><small>2 pending approval</small>
        </article>
      </div>
      <el-card class="surface-card schedule-card" shadow="never">
        <div class="schedule-grid schedule-grid--header">
          <div class="staff-column-title">人员 / Staff</div>
          <div
            v-for="day in weekDays"
            :key="day.key"
            class="day-head"
            :class="{ today: day.today }"
          >
            <span>{{ day.weekday }}</span
            ><strong class="portal-numeric">{{ day.date }}</strong
            ><small class="portal-numeric">{{ day.orders }} orders</small>
          </div>
        </div>
        <div
          v-for="person in schedulePeople"
          :key="person.id"
          class="schedule-grid schedule-row"
        >
          <div class="schedule-person">
            <el-avatar :size="34" :style="{ background: person.color }">{{
              initials(person.name)
            }}</el-avatar
            ><span
              ><strong>{{ person.name }}</strong
              ><small>{{ person.skill }}</small></span
            >
          </div>
          <button
            v-for="day in weekDays"
            :key="day.key"
            type="button"
            class="shift-cell"
            :class="shiftFor(person.id, day.key).type"
            @click="openShift(person, day)"
          >
            <template v-if="shiftFor(person.id, day.key).label"
              ><strong>{{ shiftFor(person.id, day.key).label }}</strong
              ><span class="portal-numeric">{{ shiftFor(person.id, day.key).time }}</span
              ><small>{{
                shiftFor(person.id, day.key).orders
              }}</small></template
            >
            <template v-else
              ><span class="add-shift">+</span><small>添加班次</small></template
            >
          </button>
        </div>
        <div class="schedule-legend">
          <span><i class="shift-standard"></i>正常班次</span
          ><span><i class="shift-busy"></i>订单较满</span
          ><span><i class="shift-leave"></i>休假 / 不可用</span
          ><span><i class="shift-open"></i>未排班</span>
        </div>
      </el-card>
    </template>

    <template v-else-if="section === 'orders'">
      <section
        v-if="onboardingStatus === 1"
        class="portal-orders-review"
        role="status"
      >
        <Warning />
        <div>
          <strong>{{ t("admin.supplierPortal.reviewInProgress") }}</strong>
          <p>{{ t("admin.supplierPortal.reviewOrdersHint") }}</p>
        </div>
      </section>
      <section
        class="portal-orders-metrics"
        :aria-label="t('admin.supplierPortal.orderManagement')"
      >
        <button
          v-for="metric in orderMetrics"
          :key="metric.key"
          type="button"
          :class="[
            `portal-orders-metric--${metric.key}`,
            { 'is-selected': orderStage === metric.key },
          ]"
          :aria-pressed="orderStage === metric.key"
          @click="selectOrderMetric(metric.key)"
        >
          <span>{{ metric.label }}</span>
          <strong class="portal-numeric">{{ metric.value ?? "—" }}</strong>
          <small v-if="metric.value === null">{{
            t("admin.supplierPortal.metricsPending")
          }}</small>
        </button>
      </section>

      <el-card
        class="surface-card orders-card portal-orders-card"
        shadow="never"
        v-loading="orderLoading"
      >
        <div class="order-toolbar portal-orders-toolbar">
          <div class="order-toolbar__head">
            <div>
              <strong>{{ t("admin.supplierPortal.orderManagement") }}</strong>
              <span>{{
                t(
                  orderTotal === 1
                    ? "admin.supplierOrders.countOne"
                    : "admin.supplierOrders.count",
                  { count: orderTotal },
                )
              }}</span>
            </div>
            <el-button v-if="hasOrderFilters" link @click="resetOrderFilters">{{
              t("admin.supplierOrders.resetFilters")
            }}</el-button>
            <button v-if="mobile" type="button" class="mobile-order-filter-toggle" :aria-expanded="mobileOrderFiltersOpen" @click="mobileOrderFiltersOpen = !mobileOrderFiltersOpen"><Search />{{ mobileCopy.filters }}</button>
          </div>
          <p v-if="staffOrderUserId" class="staff-order-filter">
            {{ t("admin.supplierStaff.jobsForStaff") }}
            <button type="button" @click="clearStaffOrderFilter">
              {{ t("admin.supplierStaff.clearStaffJobs") }}
            </button>
          </p>
          <nav
            class="portal-orders-stages"
            :aria-label="t('admin.supplierPortal.status')"
          >
            <button
              v-for="stage in orderStages"
              :key="stage.value"
              type="button"
              :class="{ 'is-active': orderStage === stage.value }"
              :aria-pressed="orderStage === stage.value"
              @click="changeOrderStage(stage.value)"
            >
              {{ stage.label }}
              <b v-if="stage.count != null" class="portal-numeric">{{ stage.count }}</b>
            </button>
          </nav>
          <div class="order-filters portal-orders-filters" :class="{ 'mobile-filters-collapsed': mobile && !mobileOrderFiltersOpen }">
            <label class="order-filter">
              <span>{{ t("admin.supplierOrders.orderNo") }}</span>
              <el-input
                v-model.trim="orderKeyword"
                :prefix-icon="Search"
                :placeholder="t('admin.supplierOrders.searchOrder')"
                clearable
                @keyup.enter="searchOrders"
                @clear="searchOrders"
              />
            </label>
            <label class="order-filter">
              <span>{{ t("admin.supplierOrders.serviceName") }}</span>
              <el-input
                v-model.trim="orderServiceKeyword"
                :placeholder="t('admin.supplierOrders.searchService')"
                clearable
                @keyup.enter="searchOrders"
                @clear="searchOrders"
              />
            </label>
            <label class="order-filter">
              <span>{{ t("admin.supplierOrders.searchCategory") }}</span>
              <el-select
                v-model="orderCategory"
                filterable
                clearable
                :placeholder="t('admin.supplierOrders.searchCategory')"
                @change="searchOrders"
              >
                <el-option
                  v-for="category in orderCategoryOptions"
                  :key="category.id"
                  :label="category.label"
                  :value="category.id"
                />
              </el-select>
            </label>
            <label class="order-filter order-filter--date">
              <span>{{ t("admin.supplierOrders.serviceTime") }}</span>
              <div v-if="mobile" class="mobile-order-dates">
                <input type="date" :value="orderDateRange[0] || ''" :max="orderDateRange[1] || undefined" :aria-label="t('admin.supplierOrders.dateStart')" @change="updateMobileOrderDate(0, $event)" />
                <input type="date" :value="orderDateRange[1] || ''" :min="orderDateRange[0] || undefined" :aria-label="t('admin.supplierOrders.dateEnd')" @change="updateMobileOrderDate(1, $event)" />
              </div>
              <el-date-picker
                v-else
                v-model="orderDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                :start-placeholder="t('admin.supplierOrders.dateStart')"
                :end-placeholder="t('admin.supplierOrders.dateEnd')"
                clearable
                @change="searchOrders"
              />
            </label>
            <el-button
              class="order-search"
              type="primary"
              :icon="Search"
              @click="searchOrders"
              >{{ t("admin.supplierOrders.search") }}</el-button
            >
          </div>
        </div>
        <div
          v-if="supplierOrders.length"
          class="orders-table-shell portal-orders-table-shell"
        >
          <el-table
            :data="visibleSupplierOrders"
            class="data-table orders-table portal-orders-table"
            :row-key="orderVisitKey"
            table-layout="fixed"
          >
            <el-table-column
              :label="t('admin.supplierPortal.orderId')"
              min-width="110"
            >
              <template #default="{ row }">
                <button
                  type="button"
                  class="order-no"
                  @click="openAssignedOrder(row)"
                >
                  {{ row.orderNo || "—" }}
                </button>
              </template>
            </el-table-column>
            <el-table-column
              class-name="order-wrap"
              :label="t('admin.supplierOrders.serviceName')"
              min-width="150"
            >
              <template #default="{ row }">
                <div class="order-cell">
                  <small
                    v-if="orderKindLabel(row)"
                    class="order-kind"
                    :class="{ 'is-package': supplierOrderKind(row) === 'package' }"
                    >{{ orderKindLabel(row) }}</small
                  >
                  <strong>{{ orderServiceTitle(row) }}</strong>
                  <small v-if="packageOrderTitle(row)" class="order-package-visit">{{
                    packageOrderTitle(row)
                  }}</small>
                  <small v-if="packageVisitText(row)" class="order-package-visit">{{
                    packageVisitText(row)
                  }}</small>
                  <small
                    v-if="orderSpecText(row) !== '—'"
                    class="order-clamp"
                    >{{ orderSpecText(row) }}</small
                  >
                  <small
                    v-for="note in orderFulfillRemarks(row)"
                    :key="note"
                    class="order-fulfill-remark"
                    >{{ t("admin.supplierOrders.fulfillRemarkLine", { remark: note }) }}</small
                  >
                  <small v-if="orderCancelled(row)" class="order-alert">{{
                    row.cancelReason
                      ? t("admin.supplierOrders.cancelReason", {
                          reason: row.cancelReason,
                        })
                      : t("admin.supplierOrders.orderCancelled")
                  }}</small>
                  <small
                    v-else-if="orderRescheduleUnread(row)"
                    class="order-reschedule"
                    >{{ t("admin.supplierOrders.rescheduleNotice") }}</small
                  >
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-if="!individualSupplier"
              class-name="order-wrap"
              :label="t('admin.supplierOrders.assignedStaff')"
              min-width="120"
            >
              <template #default="{ row }">
                <div class="order-cell">
                  <strong v-if="assignedStaffText(row)" class="order-staff-name">{{
                    assignedStaffText(row)
                  }}</strong>
                  <span v-else-if="canAssignStaff(row)" class="order-staff-name is-empty">{{
                    t("admin.supplierOrders.assignedStaffEmpty")
                  }}</span>
                  <span v-else>—</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              class-name="order-wrap"
              :label="t('admin.supplierPortal.schedule')"
              min-width="110"
            >
              <template #default="{ row }">
                <div class="order-cell">
                  <strong class="portal-numeric">{{ row.serviceDate || "—" }}</strong>
                  <small class="portal-numeric" v-if="orderStartTime(row.serviceTime)">{{
                    orderStartTime(row.serviceTime)
                  }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              class-name="order-wrap"
              :label="t('admin.supplierPortal.amount')"
              min-width="95"
              align="right"
            >
              <template #default="{ row }">
                <div class="order-cell order-cell--end">
                  <strong class="money-value portal-numeric portal-numeric--money"
                    ><small>AED</small>{{ orderMoney(supplierOrderEarning(row)) }}</strong
                  >
                </div>
              </template>
            </el-table-column>
            <el-table-column
              class-name="order-status-col"
              :label="t('admin.supplierPortal.status')"
              min-width="115"
            >
              <template #default="{ row }">
                <el-tag
                  :type="workbenchStatusTag(row)"
                  effect="light"
                  >{{ workbenchStatusText(row) }}</el-tag
                >
              </template>
            </el-table-column>
            <el-table-column
              :label="t('admin.supplierPortal.action')"
              min-width="130"
              align="right"
            >
              <template #default="{ row }">
                <div class="order-row-actions">
                  <el-button link @click="openAssignedOrder(row)">{{
                    t("admin.supplierOrders.viewDetail")
                  }}</el-button>
                  <el-button
                    v-if="canAction('btn:/admin/supplier-management/orders:assign') && canAssignStaff(row)"
                    link
                    type="primary"
                    @click="openAssignStaff(row)"
                    >{{ t("admin.supplierOrders.assignStaff") }}</el-button
                  >
                  <el-button
                    v-if="canAction('btn:/admin/supplier-management/orders:reject') && serviceStep(row) === 0 && !orderCancelled(row)"
                    link
                    type="danger"
                    @click="rejectOrder(row)"
                    >{{ t("admin.supplierOrders.rejectAction") }}</el-button
                  >
                  <el-button
                    v-if="canAction('btn:/admin/supplier-management/orders:accept') && serviceStep(row) === 0 && !orderCancelled(row)"
                    link
                    type="primary"
                    @click="acceptOrder(row)"
                    >{{ t("admin.supplierOrders.acceptAction") }}</el-button
                  >
                  <el-button
                    v-else-if="canAction('btn:/admin/supplier-management/orders:progress') && canOperateVisit(row) && serviceStep(row) === 4"
                    link
                    type="primary"
                    @click="departForService(row)"
                    >{{ t("admin.supplierOrders.departAction") }}</el-button
                  >
                  <el-button
                    v-else-if="canAction('btn:/admin/supplier-management/orders:progress') && canOperateVisit(row) && serviceStep(row) === 3"
                    link
                    type="primary"
                    @click="openServiceAction(row, 'arrive')"
                    >{{ t("admin.supplierOrders.arriveAction") }}</el-button
                  >
                  <el-button
                    v-else-if="canAction('btn:/admin/supplier-management/orders:progress') && canOperateVisit(row) && serviceStep(row) === 1"
                    link
                    type="primary"
                    @click="openServiceAction(row, 'complete')"
                    >{{ t("admin.supplierOrders.completeAction") }}</el-button
                  >
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div
          v-if="supplierOrders.length"
          class="orders-mobile portal-orders-mobile"
          :aria-label="t('admin.supplierOrders.queueTitle')"
        >
          <article
            v-for="row in visibleSupplierOrders"
            :key="orderVisitKey(row)"
            class="order-mobile-card portal-orders-mobile-card"
          >
            <header>
              <button
                type="button"
                class="order-no"
                @click="openAssignedOrder(row)"
              >
                {{ row.orderNo || "—" }}
              </button>
              <el-tag :type="workbenchStatusTag(row)" effect="light">{{
                workbenchStatusText(row)
              }}</el-tag>
            </header>
            <small
              v-if="orderKindLabel(row)"
              class="order-kind"
              :class="{ 'is-package': supplierOrderKind(row) === 'package' }"
              >{{ orderKindLabel(row) }}</small
            >
            <h3>{{ orderServiceTitle(row) }}</h3>
            <p v-if="packageOrderTitle(row)" class="order-package-visit">{{ packageOrderTitle(row) }}</p>
            <p v-if="packageVisitText(row)" class="order-package-visit">{{ packageVisitText(row) }}</p>
            <p v-if="orderSpecText(row) !== '—'">{{ orderSpecText(row) }}</p>
            <p
              v-for="note in orderFulfillRemarks(row)"
              :key="note"
              class="order-fulfill-remark"
            >{{ t("admin.supplierOrders.fulfillRemarkLine", { remark: note }) }}</p>
            <p v-if="orderCancelled(row)" class="order-alert">
              {{
                row.cancelReason
                  ? t("admin.supplierOrders.cancelReason", {
                      reason: row.cancelReason,
                    })
                  : t("admin.supplierOrders.orderCancelled")
              }}
            </p>
            <p v-else-if="orderRescheduleUnread(row)" class="order-reschedule">
              {{ t("admin.supplierOrders.rescheduleNotice") }}
            </p>
            <dl>
              <div>
                <dt>{{ t("admin.supplierOrders.serviceTime") }}</dt>
                <dd class="portal-numeric">{{ orderWhen(row) }}</dd>
              </div>
              <div>
                <dt>{{ t("admin.supplierOrders.price") }}</dt>
                <dd class="portal-numeric portal-numeric--money">AED {{ orderMoney(supplierOrderEarning(row)) }}</dd>
              </div>
              <div
                v-if="!individualSupplier && (assignedStaffText(row) || canAssignStaff(row))"
                class="is-wide"
              >
                <dt>{{ t("admin.supplierOrders.assignedStaff") }}</dt>
                <dd>{{
                  assignedStaffText(row) ||
                  t("admin.supplierOrders.assignedStaffEmpty")
                }}</dd>
              </div>
            </dl>
            <footer>
              <el-button @click="openAssignedOrder(row)">{{
                t("admin.supplierOrders.viewDetail")
              }}</el-button>
              <el-button
                v-if="canAction('btn:/admin/supplier-management/orders:assign') && canAssignStaff(row)"
                type="primary"
                @click="openAssignStaff(row)"
                >{{ t("admin.supplierOrders.assignStaff") }}</el-button
              >
              <el-button
                v-if="canAction('btn:/admin/supplier-management/orders:reject') && serviceStep(row) === 0 && !orderCancelled(row)"
                @click="rejectOrder(row)"
                >{{ t("admin.supplierOrders.rejectAction") }}</el-button
              >
              <el-button
                v-if="canAction('btn:/admin/supplier-management/orders:accept') && serviceStep(row) === 0 && !orderCancelled(row)"
                type="primary"
                @click="acceptOrder(row)"
                >{{ t("admin.supplierOrders.acceptAction") }}</el-button
              >
              <el-button
                v-else-if="canAction('btn:/admin/supplier-management/orders:progress') && canOperateVisit(row) && serviceStep(row) === 4"
                type="primary"
                @click="departForService(row)"
                >{{ t("admin.supplierOrders.departAction") }}</el-button
              >
              <el-button
                v-else-if="canAction('btn:/admin/supplier-management/orders:progress') && canOperateVisit(row) && serviceStep(row) === 3"
                type="primary"
                @click="openServiceAction(row, 'arrive')"
                >{{ t("admin.supplierOrders.arriveAction") }}</el-button
              >
              <el-button
                v-else-if="canAction('btn:/admin/supplier-management/orders:progress') && canOperateVisit(row) && serviceStep(row) === 1"
                type="primary"
                @click="openServiceAction(row, 'complete')"
                >{{ t("admin.supplierOrders.completeAction") }}</el-button
              >
            </footer>
          </article>
        </div>
        <div
          v-if="!orderLoading && orderLoadFailed"
          class="portal-orders-empty"
          role="alert"
        >
          <span class="portal-orders-empty-icon" aria-hidden="true"
            ><Warning
          /></span>
          <h2>{{ t("admin.supplierOrders.loadFailed") }}</h2>
          <el-button @click="loadOrders">{{
            t("admin.common.refresh")
          }}</el-button>
        </div>
        <div
          v-else-if="!orderLoading && !supplierOrders.length"
          class="portal-orders-empty"
        >
          <span class="portal-orders-empty-icon" aria-hidden="true"
            ><Tickets
          /></span>
          <h2>
            {{
              t(
                hasOrderFilters
                  ? "admin.supplierPortal.noResults"
                  : "admin.supplierPortal.noOrders",
              )
            }}
          </h2>
          <p>
            {{
              t(
                hasOrderFilters
                  ? "admin.supplierPortal.noResultsHint"
                  : "admin.supplierPortal.noOrdersHint",
              )
            }}
          </p>
          <div>
            <el-button v-if="hasOrderFilters" @click="resetOrderFilters">{{
              t("admin.supplierOrders.resetFilters")
            }}</el-button>
            <el-button type="primary" @click="goTo('coverage-availability')">{{
              t("admin.supplierPortal.reviewCoverage")
            }}</el-button>
            <el-button @click="goTo('pricing')">{{
              t("admin.supplierPortal.openServices")
            }}</el-button>
          </div>
        </div>
        <div v-if="orderTotal > 0" class="order-pager portal-orders-pager">
          <span>{{ orderPageRange }}</span>
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

    <template v-else-if="section === 'pricing' || section === 'package-pricing'">
      <div
        v-if="!quoteDialog.visible"
        class="sv-page"
        v-loading="catalogLoading || quoteLoading"
      >
        <header class="portal-pricing-header">
          <div>
            <span class="portal-eyebrow">{{
              t(packageMode ? "admin.supplierPortal.packages" : "admin.supplierPortal.services")
            }}</span>
            <h1>{{ t(packageMode ? "admin.supplierPortal.packages" : "admin.supplierPricing.title") }}</h1>
            <p>{{ t(packageMode ? "admin.supplierPortal.packagesHint" : "admin.supplierPortal.selectedCategoryHint") }}</p>
          </div>
          <div class="portal-pricing-actions">
            <el-button
              v-if="!packageMode"
              :icon="Download"
              :loading="quoteExporting"
              :disabled="!supplierRecordId"
              @click="downloadQuoteTemplate"
              >{{ quoteExportLabel }}</el-button
            >
            <el-button
              v-if="!packageMode"
              :icon="Upload"
              :loading="quoteImporting"
              :disabled="!supplierRecordId"
              @click="quoteFileInput?.click()"
              >{{ t("admin.supplierPricing.importQuotes") }}</el-button
            >
            <el-button
              type="primary"
              :icon="Plus"
              :disabled="!supplierRecordId"
              @click="packageMode ? openPackagePicker() : openServicePicker()"
              >{{ t(packageMode ? "admin.supplierPortal.selectPackages" : "admin.supplierPricing.addService") }}</el-button
            >
            <input
              v-if="!packageMode"
              ref="quoteFileInput"
              class="quote-file-input"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              @change="importQuoteFile"
            />
          </div>
        </header>
        <section v-if="packageMode && packageNoticeUnread" class="package-shelf-banner" role="status">
          <div>
            <h2>{{ t("admin.supplierPortal.packageShelfTitle") }}</h2>
            <p>{{ t("admin.supplierPortal.packageShelfLead") }}</p>
            <ul>
              <li v-for="item in packageNotices" :key="item.packageId">{{ serviceTitle(item.packageName || "", item.nameI18n) }}</li>
            </ul>
          </div>
          <el-button :loading="packageNoticeAcking" @click="acknowledgePackageNotice">{{ t("admin.supplierPortal.shelfNoticeAck") }}</el-button>
        </section>
        <nav
          class="portal-journey"
          :aria-label="t('admin.supplierPricing.title')"
        >
          <span class="is-current"
            ><b>1</b>{{ t("admin.supplierPortal.categoryStep") }}</span
          ><ArrowRight /><span
            ><b>2</b>{{ t("admin.supplierPortal.serviceStep") }}</span
          ><ArrowRight /><span
            ><b>3</b>{{ t("admin.supplierPortal.setupStep") }}</span
          >
        </nav>
        <div class="portal-service-layout" :class="{ 'is-linked': pricingCategoryLinked }">
          <aside class="portal-categories">
            <div v-if="mobile" class="mobile-category-picker">
              <label><span>{{ t('admin.supplierPortal.categoryPanel') }}</span>
                <el-select v-model="quoteCategory" :aria-label="t('admin.supplierPortal.categoryPanel')">
                  <el-option v-for="category in serviceCategoryOptions" :key="category.id" :value="String(category.id)" :label="category.label" />
                </el-select>
              </label>
              <button v-if="!packageMode && mobilePricingCategory" type="button" class="mobile-category-contact" @click="openCategoryContact(mobilePricingCategory.id)"><Phone /><span>{{ t('admin.supplierPortal.categoryContact') }}</span></button>
            </div>
            <h2 v-else>{{ t("admin.supplierPortal.categoryPanel") }}</h2>
            <nav v-if="!mobile">
              <article
                v-for="category in serviceCategoryOptions"
                :key="category.id"
                class="portal-category"
                :class="{ 'is-active': Number(quoteCategory) === category.id }"
              >
                <button
                  type="button"
                  class="portal-category__select"
                  :aria-pressed="Number(quoteCategory) === category.id"
                  @click="quoteCategory = String(category.id)"
                >
                  <span>{{ category.label }}</span
                  ><small>{{ categoryBadgeCount(category.id) }}</small
                  ><ArrowRight />
                </button>
                <button
                  v-if="!packageMode"
                  type="button"
                  class="portal-category__contact"
                  :class="{
                    'is-filled':
                      Boolean(category.contactName) ||
                      categoryPhoneCount(category.phones) > 0,
                  }"
                  @click="openCategoryContact(category.id)"
                >
                  <span class="portal-category__contact-icon" aria-hidden="true"><Phone /></span>
                  <span class="portal-category__contact-label">{{ t("admin.supplierPortal.addCategoryContact") }}</span>
                  <ArrowRight class="portal-category__contact-arrow" aria-hidden="true" />
                </button>
              </article>
            </nav>
            <p v-if="!mobile">{{ t("admin.supplierPortal.categoryHint") }}</p>
          </aside>
          <section class="portal-services" :class="{ 'is-linked': pricingCategoryLinked }">
            <header>
              <div>
                <span class="portal-eyebrow">{{
                  t("admin.supplierPricing.service")
                }}</span>
                <h2>{{ selectedPricingCategory }}</h2>
                <p class="portal-quote-select">
                  <el-checkbox
                    v-if="!packageMode"
                    :model-value="allVisibleQuotesSelected"
                    :indeterminate="someVisibleQuotesSelected"
                    :disabled="!filteredServiceRows.length"
                    :aria-label="t('admin.supplierPricing.selectVisible')"
                    @change="toggleVisibleQuoteSelection"
                  />
                  <span>{{
                    t("admin.supplierPricing.count", {
                      count: filteredServiceRows.length,
                    })
                  }}</span>
                </p>
                <p v-if="!packageMode" class="portal-quote-select-hint">
                  {{ t("admin.supplierPricing.exportSelectionHint") }}
                </p>
              </div>
              <div class="portal-service-filters">
                <el-input
                  v-model="addedKeyword"
                  :prefix-icon="Search"
                  clearable
                  :placeholder="t('admin.supplierPricing.searchAdded')"
                />
              </div>
            </header>
            <div
              class="portal-status-board"
              role="tablist"
              :aria-label="t('admin.supplierPricing.reviewStatus')"
            >
              <button
                v-for="item in quoteStatusOptions"
                :key="item.value"
                type="button"
                role="tab"
                :aria-selected="quoteStatusFilter === item.value"
                :class="{ 'is-active': quoteStatusFilter === item.value }"
                @click="quoteStatusFilter = item.value"
              >
                <strong class="portal-numeric">{{ item.count }}</strong>
                <span>{{ item.label }}</span>
              </button>
            </div>
            <p
              v-if="filteredServiceRows.some((row) => Number(row.status) === 2)"
              class="portal-accept-legend"
            >{{ t("admin.supplierPricing.acceptLegend") }}</p>
            <div class="portal-service-list" :class="{ 'is-package-list': packageMode }">
              <section
                v-for="group in serviceRowGroups"
                :key="group.key"
                class="portal-service-group"
                :class="{ 'portal-package-group': packageMode }"
                :aria-label="packageMode ? group.name : undefined"
              >
                <article v-if="packageMode" class="portal-package-card">
                  <div>
                    <h3>{{ group.name }}</h3>
                    <div v-if="packagePlanChips(group).length" class="portal-package-plan">
                      <span v-for="chip in packagePlanChips(group)" :key="chip.key">
                        <b>{{ chip.name }}</b> {{ chip.detail }}
                      </span>
                    </div>
                  </div>
                  <div class="portal-package-card__actions">
                    <el-tag :type="quoteTagType(group.rows[0].status)" effect="light">{{
                      quoteStatusLabel(group.rows[0].status)
                    }}</el-tag>
                    <el-button type="primary" @click="openPackageQuote(group)">{{
                      t("admin.supplierPortal.packageSetupQuote")
                    }}</el-button>
                    <el-button
                      text
                      type="danger"
                      :loading="removingPackageId === Number(group.rows[0].packageId)"
                      :disabled="packageSaving && removingPackageId !== Number(group.rows[0].packageId)"
                      @click="removeSavedPackage(group.rows[0])"
                    >{{ t("admin.supplierPricing.removeAction") }}</el-button>
                  </div>
                </article>
                <div v-else class="portal-service-group__rows">
                  <article
                    v-for="row in group.rows"
                    :key="packageMode ? `${row.packageId}-${row.spuId}` : row.spuId"
                    class="portal-service-row"
                    :class="{ 'is-package': packageMode }"
                  >
                    <div class="portal-service-name">
                      <el-checkbox
                        v-if="!packageMode"
                        class="portal-quote-check"
                        :model-value="quoteSpuSelected(row.spuId)"
                        :aria-label="
                          t('admin.supplierPricing.selectService', {
                            name: serviceTitle(row.name, row.spuNameI18n),
                          })
                        "
                        @click.stop
                        @change="(checked) => toggleQuoteSpu(row.spuId, checked === true)"
                      />
                      <span class="portal-service-avatar">{{
                        String(serviceTitle(row.name, row.spuNameI18n) || "S")
                          .slice(0, 1)
                          .toUpperCase()
                      }}</span>
                      <div>
                        <h3>{{ serviceTitle(row.name, row.spuNameI18n) }}</h3>
                        <p
                          class="portal-service-price portal-numeric portal-numeric--money"
                          :class="{ 'is-rejected': row.status === 3 }"
                        >{{ yourPriceText(row) }}</p>
                        <p v-if="packageMode && row.times?.length" class="portal-service-times">
                          <span v-for="(count, index) in row.times" :key="`${row.spuId}-times-${index}`">{{
                            t('admin.supplierPortal.packageItemTimes', { count })
                          }}</span>
                        </p>
                        <p
                          v-if="Number(row.status) === 2 && acceptBandItems(row).length"
                          class="portal-accept-bands"
                        >
                          <span
                            v-for="item in acceptBandItems(row)"
                            :key="item.key"
                            :class="`is-${item.key}`"
                          >{{
                            t("admin.supplierPricing.acceptCount", {
                              count: item.count,
                              label: item.label,
                            })
                          }}</span>
                        </p>
                      </div>
                    </div>
                    <el-tag :type="quoteTagType(row.status)" effect="light">{{
                      quoteStatusLabel(row.status)
                    }}</el-tag>
                    <label v-if="!packageMode" class="portal-offer-control"
                      ><span>{{ t("admin.supplierPortal.offerService") }}</span
                      ><el-switch
                        :model-value="Number(row.acceptOrder) !== 0"
                        :loading="acceptOrderSaving === row.spuId"
                        @change="toggleServiceAccept(row)"
                    /></label>
                    <div class="portal-service-actions">
                      <el-button
                        v-if="!packageMode || packageServiceCount(row.packageId) < 2"
                        class="portal-service-cta"
                        :type="row.status == null ? 'primary' : undefined"
                        @click="openServiceQuote(row)"
                        >{{ t(`admin.supplierPortal.${quoteActionKey(row.status)}`) }}
                        <ArrowRight
                      /></el-button>
                      <el-button
                        v-if="!packageMode"
                        class="portal-service-remove"
                        text
                        type="danger"
                        :loading="removingServiceId === row.spuId"
                        :disabled="removingServiceId != null && removingServiceId !== row.spuId"
                        @click="removeSavedService(row)"
                        >{{ t("admin.supplierPricing.removeAction") }}</el-button
                      >
                      <el-button
                        v-else
                        class="portal-service-remove"
                        text
                        type="danger"
                        :loading="removingPackageId === Number(row.packageId)"
                        :disabled="packageSaving && removingPackageId !== Number(row.packageId)"
                        @click="removeSavedPackage(row)"
                        >{{ t("admin.supplierPricing.removeAction") }}</el-button
                      >
                    </div>
                    <p v-if="row.rejectReason" class="portal-service-reason">
                      {{
                        t("admin.supplierPricing.rejectReason", {
                          reason: supplierRejectCopy(row.rejectReason),
                        })
                      }}
                    </p>
                  </article>
                </div>
              </section>
              <section
                v-if="packageMode && offeredPackages.length"
                class="portal-package-offers"
                :aria-label="t('admin.supplierPortal.packageOffersTitle')"
              >
                <header>
                  <h3>{{ t("admin.supplierPortal.packageOffersTitle") }}</h3>
                  <p>{{ t("admin.supplierPortal.packageOffersHint") }}</p>
                </header>
                <article
                  v-for="item in offeredPackages"
                  :key="item.packageId"
                  class="portal-package-offer"
                >
                  <div>
                    <strong>{{ serviceTitle(item.name, item.nameI18n) }}</strong>
                    <small>{{ selectedPricingCategory }}</small>
                  </div>
                  <el-button
                    type="primary"
                    :loading="packageSaving"
                    @click="addPackageOffer(item.packageId)"
                  >{{ t("admin.supplierPortal.quoteThisPackage") }}</el-button>
                </article>
              </section>
              <el-empty
                v-if="!filteredServiceRows.length && !offeredPackages.length"
                :description="
                  packageMode && !packageCatalogChoices
                    ? t('admin.supplierPortal.packagesNoneOnShelf')
                    : packageMode && !serviceRows.length
                    ? t('admin.supplierPortal.packagesEmpty')
                    : serviceRows.length
                    ? t('admin.supplierPortal.noServices')
                    : t('admin.supplierPricing.empty')
                "
                ><el-button
                  v-if="packageMode && packageCatalogChoices && !serviceRows.length"
                  type="primary"
                  @click="openPackagePicker"
                  >{{ t("admin.supplierPortal.selectPackages") }}</el-button
                ><el-button
                  v-else-if="addedKeyword || quoteStatusFilter !== 'all'"
                  @click="resetPricingFilters"
                  >{{ t("admin.supplierPricing.clearFilters") }}</el-button
                ></el-empty
              >
            </div>
          </section>
        </div>
      </div>

      <div v-else class="sv-editor">
        <AdminBreadcrumb
          class="sv-breadcrumb"
          :items="quoteBreadcrumbItems"
          @back="quoteScreen === 'review' ? backToQuoteSetup() : closeServiceQuote()"
        />
        <section class="portal-quote-header">
          <div>
            <span>{{ t("admin.supplierPricing.editorKicker") }}</span>
            <h1>
              {{
                quoteScreen === "submitted"
                  ? t("admin.supplierPortal.quoteSubmitted")
                  : quoteDialogTitle
              }}
            </h1>
            <p>
              {{
                quoteScreen === "submitted" ? quoteDialogTitle : quoteDialogCategory
              }}
              ·
              {{
                t(
                  quoteScreen === "submitted"
                    ? "admin.supplierPortal.reviewHint"
                    : "admin.supplierPricing.editorHint",
                )
              }}
            </p>
            <p v-if="quoteDialog.packageTimes.length" class="portal-service-times">
              <span v-for="(count, index) in quoteDialog.packageTimes" :key="`quote-times-${index}`">{{
                t("admin.supplierPortal.packageItemTimes", { count })
              }}</span>
            </p>
            <p v-if="quoteIntroText" class="quote-supplier-desc">{{ quoteIntroText }}</p>
          </div>
          <el-tag v-if="!packageBundle.active" :type="quoteTagType(quoteEffectiveStatus)" effect="dark">{{
            quoteStatusLabel(quoteEffectiveStatus)
          }}</el-tag>
        </section>
        <nav
          v-if="!packageBundle.active"
          class="portal-journey portal-journey--quote"
          :aria-label="t('admin.supplierPortal.setupStep')"
        >
          <span class="is-done"
            ><b>✓</b>{{ t("admin.supplierPortal.serviceStep") }}</span
          ><i></i
          ><span :class="quoteScreen === 'setup' ? 'is-current' : 'is-done'"
            ><b>{{ quoteScreen === "setup" ? "2" : "✓" }}</b
            >{{ t("admin.supplierPortal.setupStep") }}</span
          ><i></i
          ><span :class="{ 'is-current': quoteScreen !== 'setup' }"
            ><b>3</b>{{ t("admin.supplierPortal.reviewStep") }}</span
          >
        </nav>
        <section
          v-if="packageBundle.active"
          class="sv-quote package-bundle"
          v-loading="packageBundle.saving"
        >
          <article v-if="packageQuotedSection" class="package-price-card">
            <header class="package-price-card__head">
              <div>
                <h2>{{ t("admin.supplierPortal.packageFixedTitle") }}</h2>
                <p>{{ t("admin.supplierPortal.packageFixedHint") }}</p>
              </div>
              <span class="package-price-card__count">{{ packagePriceLineCount() }}</span>
            </header>
            <div class="package-includes">
              <span>{{ t("admin.supplierPortal.packageIncludes") }}</span>
              <b v-for="section in packageBundle.sections" :key="section.spuId">✓ {{ serviceTitle(section.name, section.nameI18n) }}</b>
              <em v-if="packageVisitTotal()">{{ t("admin.supplierPortal.packageWholeVisits", { count: packageVisitTotal() }) }}</em>
            </div>
            <div class="package-how">
              <strong>{{ t("admin.supplierPortal.packageHowTitle") }}</strong>
              <p v-if="packageBundle.quoteDesc">{{ packageBundle.quoteDesc }}</p>
              <table v-else>
                <tbody>
                  <tr v-for="section in packageBundle.sections" :key="`how-${section.spuId}`">
                    <th>{{ serviceTitle(section.name, section.nameI18n) }}</th>
                    <td>{{ section.times.map((count) => t("admin.supplierPortal.packagePlanTimes", { count })).join(" · ") || "—" }}</td>
                  </tr>
                  <tr>
                    <th>{{ t("admin.supplierPortal.packageFixedTitle") }}</th>
                    <td>{{ t("admin.supplierPortal.packageHowPrice") }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="packageQuotedSection.quoteMode === 1" class="package-price-toolbar">
              <div v-if="packageQuoteTabs().length" class="package-price-tabs">
                <span>{{ packageQuotedSection.groupType }}</span>
                <button
                  v-for="tab in packageQuoteTabs()"
                  :key="tab"
                  type="button"
                  :class="{ 'is-on': tab === packageBundle.tab }"
                  @click="packageBundle.tab = tab"
                >{{ tab }}</button>
              </div>
              <div class="package-price-bulk">
                <button type="button" :disabled="!packageSectionEditable(packageQuotedSection)" @click="setPackageQuoteEnabled(true)">{{ t("admin.supplierPricing.selectAll") }}</button>
                <button type="button" :disabled="!packageSectionEditable(packageQuotedSection)" @click="setPackageQuoteEnabled(false)">{{ t("admin.supplierPricing.selectNone") }}</button>
              </div>
            </div>
            <div v-if="packageSectionRates(packageQuotedSection).length" class="package-bundle__rates">
              <label v-for="rate in packageSectionRates(packageQuotedSection)" :key="rate.key">
                <span>{{ t(rate.label) }}</span>
                <el-input v-model="packageQuotedSection[rate.key]" :disabled="!packageSectionEditable(packageQuotedSection)" />
              </label>
            </div>
            <article
              v-for="line in packageVisibleLines()"
              :key="line.key"
              class="package-price-row"
              :class="{ 'is-off': !familyEnabled(line) }"
            >
              <el-checkbox
                v-if="packageQuotedSection.quoteMode === 1"
                :model-value="familyEnabled(line)"
                :disabled="!packageSectionEditable(packageQuotedSection)"
                @change="setFamilyEnabled(line, $event)"
              />
              <div>
                <strong>
                  {{ packageQuoteTabs().length && line.title !== packageBundle.tab ? `${packageBundle.tab} · ` : "" }}{{ line.title }}
                  <em v-if="packageLineDirect(line)">{{ t("admin.supplierPricing.acceptDirect") }}</em>
                </strong>
                <p>{{ packageLineMeta(line) }}</p>
              </div>
              <div v-if="packageQuotedSection.quoteMode === 1">
                <label class="package-price-pin">
                  <span>AED</span>
                  <el-input
                    :model-value="familyPrice(line)"
                    :placeholder="t('admin.supplierPortal.packagePricePlaceholder')"
                    :disabled="!packageSectionEditable(packageQuotedSection) || !familyEnabled(line)"
                    @update:model-value="setFamilyPrice(line, $event)"
                  />
                </label>
                <p>{{ packagePriceCalc(line) }}</p>
              </div>
            </article>
            <ul v-if="packageQuotedSection.attaches.length" class="package-bundle__options">
              <li v-for="item in packageQuotedSection.attaches" :key="item.attachValueId">
                <span>{{ item.name }}</span>
                <el-input v-model="item.quotePrice" :disabled="!packageSectionEditable(packageQuotedSection)" />
              </li>
            </ul>
            <p class="package-price-foot">{{ t("admin.supplierPortal.packagePriceFoot") }}</p>
          </article>
          <footer class="package-bundle__foot">
            <el-button :loading="packageBundle.saving" @click="savePackageBundle(false)">{{
              t('admin.supplierPricing.saveDraft')
            }}</el-button>
            <el-button type="primary" :loading="packageBundle.saving" @click="savePackageBundle(true)">{{
              t('admin.supplierPricing.submitReview')
            }}</el-button>
          </footer>
        </section>
        <section
          v-else-if="quoteScreen !== 'submitted'"
          class="sv-quote"
          v-loading="quoteDialog.loading"
        >
          <div v-if="quoteDialog.modeReset" class="pricing-editor-alert">
            <span>!</span>
            <div>
              <strong>{{ t("admin.supplierPricing.modeResetTitle") }}</strong>
              <p>{{ t("admin.supplierPricing.modeResetHint", { mode: quoteModeLabel(quoteDialog.quoteMode) }) }}</p>
            </div>
          </div>
          <div v-else-if="quoteCanRevise" class="pricing-editor-alert">
            <span>!</span>
            <div>
              <strong>{{ t("admin.supplierPricing.reviseTitle") }}</strong>
              <p>{{ t("admin.supplierPricing.reviseHint") }}</p>
            </div>
          </div>
          <div
            v-if="quotePriceLocked"
            class="pricing-editor-alert"
            :class="{
              'is-rejected': Number(quoteDialog.priceChangeStatus) === 3,
            }"
          >
            <span>!</span>
            <div>
              <strong>{{
                Number(quoteDialog.priceChangeStatus) === 1
                  ? t("admin.supplierPricing.priceChangePending")
                  : Number(quoteDialog.priceChangeStatus) === 3
                    ? t("admin.supplierPricing.priceChangeRejected")
                    : t("admin.supplierPricing.priceChangeTitle")
              }}</strong>
              <p v-if="Number(quoteDialog.priceChangeStatus) === 1">
                {{ t("admin.supplierPricing.priceChangePendingHint") }}
              </p>
              <p
                v-else-if="
                  Number(quoteDialog.priceChangeStatus) === 3 &&
                  quoteDialog.priceChangeRejectReason
                "
              >
                {{
                  t("admin.supplierPricing.rejectReason", {
                    reason: quoteDialog.priceChangeRejectReason,
                  })
                }}
              </p>
              <p v-else>{{ t("admin.supplierPricing.priceChangeHint") }}</p>
            </div>
          </div>
          <div
            v-if="quoteDialog.rejectReason || quoteHasRejectedLines || quoteHasRejectedAttaches"
            class="pricing-editor-alert is-rejected"
          >
            <span>!</span>
            <div>
              <strong>{{
                Number(quoteDialog.status) === 3
                  ? t("admin.supplierPricing.statusRejected")
                  : t("admin.supplierPricing.lineRejectedTitle")
              }}</strong>
              <p v-if="quoteDialog.rejectReason">
                {{
                  t("admin.supplierPricing.rejectReason", {
                    reason: supplierRejectCopy(quoteDialog.rejectReason),
                  })
                }}
              </p>
              <p>{{
                t(
                  Number(quoteDialog.status) === 3
                    ? "admin.supplierPricing.rejectedEditableHint"
                    : "admin.supplierPricing.lineRejectedHint",
                )
              }}</p>
            </div>
          </div>
          <div class="pricing-editor-layout">
            <div class="pricing-editor-main">
              <section
                v-if="hourlyQuote && !addonOnlyQuote"
                class="pricing-editor-section"
              >
                <header class="pricing-section-head">
                  <div>
                    <h2>{{ quoteModeLabel(quoteDialog.quoteMode) }}</h2>
                    <p>{{ t(hourlyRuleKey) }}</p>
                  </div>
                </header>
                <div class="rate-card">
                  <label
                    v-for="rate in activeHourlyRateFields"
                    :key="rate.key"
                    class="rate-field"
                    :data-quote-rate="rate.key"
                    :class="{ 'is-quote-target': quoteGapFocusId === rate.key }"
                  >
                    <span><b class="rate-required" aria-hidden="true">*</b> {{ t(rate.label) }}</span>
                    <span class="currency-input">
                      <b>AED</b>
                      <el-input-number
                        v-model="quoteDialog[rate.key]"
                        :aria-label="t(rate.label)"
                        :min="0"
                        :precision="2"
                        :value-on-clear="null"
                        :disabled="hourlyRateHeld"
                        controls-position="right"
                      />
                    </span>
                  </label>
                </div>
              </section>

              <section
                v-if="!hourlyQuote && !addonOnlyQuote"
                class="pricing-editor-section"
              >
                <header class="pricing-section-head">
                  <div>
                    <h2>{{ t("admin.supplierPricing.fixedPrice") }}</h2>
                    <p>
                      {{ t("admin.supplierPortal.fixedRule") }}
                    </p>
                  </div>
                  <em>{{ quoteDisplayLines(quoteDialog.rows).length }}</em>
                </header>
                <div class="quote-lines">
                  <p
                    v-if="!quoteDialog.loading && !quoteDialog.rows.length"
                    class="quote-lines__empty"
                  >
                    {{ t("admin.supplierPricing.noSpecs") }}
                  </p>
                  <div
                    v-if="showQuoteGroupTabs || visibleQuoteRows.length"
                    class="quote-line-tools"
                  >
                    <div
                      v-if="showQuoteGroupTabs"
                      class="quote-group-tabs"
                      role="tablist"
                      :aria-label="quoteGroupType || t('admin.supplierPricing.specStep')"
                    >
                      <span v-if="quoteGroupType" class="quote-group-tabs__type">{{
                        quoteGroupType
                      }}</span>
                      <button
                        v-for="group in quoteGroupTabs"
                        :key="group.key"
                        type="button"
                        role="tab"
                        :aria-selected="group.key === quoteGroupTab"
                        :class="{
                          'is-on': group.key === quoteGroupTab,
                          'is-gap': quoteGroupHasGap(group.key),
                        }"
                        @click="quoteGroupTab = group.key"
                      >
                        {{ group.title }}
                      </button>
                    </div>
                    <div v-if="quoteDialog.rows.length" class="quote-line-bulk">
                      <button
                        type="button"
                        :disabled="!selectableQuoteRows.length"
                        @click="setQuotesEnabled(true)"
                      >
                        {{ t("admin.supplierPricing.selectAll") }}
                      </button>
                      <button
                        type="button"
                        :disabled="!selectableQuoteRows.length"
                        @click="setQuotesEnabled(false)"
                      >
                        {{ t("admin.supplierPricing.selectNone") }}
                      </button>
                    </div>
                  </div>
                  <section
                    v-for="group in visibleQuoteGroups"
                    :key="group.key"
                    class="quote-group"
                  >
                    <header v-if="!showQuoteGroupTabs && group.title" class="quote-group__head">
                      <small v-if="group.type">{{ group.type }}</small>
                      <strong>{{ group.title }}</strong>
                    </header>
                    <article
                      v-for="(line, index) in quoteDisplayLines(group.rows)"
                      :key="line.key"
                      class="quote-line portal-quote-line"
                      :data-quote-sku="line.rows[0].skuId"
                      :class="{
                        'is-off': familyOff(line),
                        'has-missing': familyMissing(line),
                        'is-quote-target': line.rows.some((row) => quoteGapFocusId === String(row.skuId)),
                      }"
                    >
                      <label class="quote-line__switch">
                        <el-checkbox
                          :model-value="familyEnabled(line)"
                          :disabled="familyHeld(line)"
                          :aria-label="line.title || t('admin.supplierPricing.skuSwitch')"
                          @change="setFamilyEnabled(line, $event)"
                        />
                      </label>
                      <div class="quote-line__spec">
                        <span>{{ String(index + 1).padStart(2, "0") }}</span>
                        <div>
                          <strong>
                            {{ line.title }}
                            <span
                              v-if="familyBadge(line)"
                              class="quote-accept-band"
                              :class="`is-${familyBadge(line).tone}`"
                            >{{ familyBadge(line).label }}</span>
                          </strong>
                          <small v-if="familyCoverText(line)" class="quote-line__covers">{{ familyCoverText(line) }}</small>
                          <small v-if="line.rows[0].rejectReason" class="line-reject">{{
                            t("admin.supplierPricing.lineRejected", {
                              reason: supplierRejectCopy(line.rows[0].rejectReason),
                            })
                          }}</small>
                          <small v-if="line.rows.every((row) => row.available === false)">{{
                            t("admin.supplierPricing.discontinued")
                          }}</small>
                          <small v-else class="quote-rate-facts">
                            <span class="portal-numeric portal-numeric--money" v-if="familyFacts(line).showActive">{{
                              t("admin.supplierPricing.activeRate", {
                                price: moneyText(line.rows[0].approvedPrice),
                              })
                            }}</span>
                            <span
                              class="portal-numeric portal-numeric--money"
                              :class="{ 'is-rejected': familyFacts(line).view === 'rejected' }"
                              v-if="familyFacts(line).showPending"
                            >{{
                              t("admin.supplierPricing.pendingQuote", {
                                price: moneyText(familyPrice(line)),
                              })
                            }}</span>
                            <span :class="{ 'is-rejected': familyFacts(line).view === 'rejected' }">{{ linePriceStateLabel(familyFacts(line).view) }}</span>
                          </small>
                          <small v-if="familyRemark(line)" class="quote-fulfill-remark">{{
                            t("admin.supplierOrders.fulfillRemarkLine", { remark: familyRemark(line) })
                          }}</small>
                        </div>
                      </div>
                      <label
                        class="quote-line__price"
                        :class="{ 'is-rejected': familyFacts(line).view === 'rejected' }"
                      >
                          <span>{{ t("admin.supplierPricing.taxPrice") }}</span>
                          <el-input
                            :model-value="familyPrice(line)"
                            inputmode="decimal"
                            :placeholder="t('admin.supplierPricing.pricePlaceholder')"
                            :disabled="familyOff(line) || familyHeld(line)"
                            @update:model-value="setFamilyPrice(line, $event)"
                          >
                            <template #prepend>AED</template>
                          </el-input>
                          <em v-if="line.unit" class="quote-line__unit">/ {{ line.unit }}</em>
                        </label>
                    </article>
                  </section>
                </div>
              </section>

              <section
                v-if="quoteDialog.attaches.length"
                class="pricing-editor-section"
              >
                <header class="pricing-section-head">
                  <div>
                    <h2>{{ quoteAddonTitle }}</h2>
                    <p>{{ t("admin.supplierPricing.addonStepHint") }}</p>
                  </div>
                  <em class="portal-numeric"
                    >{{ selectedAttachCount }}/{{
                      quoteDialog.attaches.length
                    }}</em
                  >
                </header>
                <div class="quote-attaches">
                  <section
                    v-for="group in quoteAttachGroups"
                    :key="group.key"
                    class="quote-attach-group"
                  >
                    <h3 v-if="group.label" class="quote-attach-group__title">{{ group.label }}</h3>
                  <article
                    v-for="item in group.items"
                    :key="item.attachValueId"
                    class="quote-attach"
                    :data-quote-addon="item.attachValueId"
                    :class="{
                      'is-selected': item.offered,
                      'is-rejected':
                        Number(item.reviewStatus) === 3 ||
                        Boolean(String(item.rejectReason || '').trim()),
                      'is-quote-target':
                        quoteGapFocusId === `addon-${item.attachValueId}`,
                    }"
                  >
                    <div class="quote-attach__name">
                      <el-checkbox
                        :model-value="item.offered"
                        :disabled="attachHeld(item)"
                        @change="
                          (value: boolean | string | number) =>
                            toggleAttach(item, Boolean(value))
                        "
                      >
                        {{ attachDisplay(item, "name")
                        }}<template v-if="attachUnit(item)">
                          / {{ attachUnit(item) }}</template
                        >
                      </el-checkbox>
                      <small class="portal-numeric portal-numeric--money">{{
                        t("admin.supplierPricing.activeRate", {
                          price: moneyText(item.approvedPrice),
                        })
                      }}</small>
                      <small v-if="item.rejectReason" class="line-reject">{{
                        t("admin.supplierPricing.lineRejected", {
                          reason: supplierRejectCopy(item.rejectReason),
                        })
                      }}</small>
                      <small
                        v-if="attachBadge(item)"
                        class="quote-accept-band"
                        :class="`is-${attachBadge(item).tone}`"
                      >{{ attachBadge(item).label }}</small>
                    </div>
                    <el-input
                      v-if="item.offered"
                      v-model="item.quotePrice"
                      inputmode="decimal"
                      :disabled="attachHeld(item)"
                      :placeholder="t('admin.supplierPricing.taxPrice')"
                    >
                      <template #prepend>AED</template>
                    </el-input>
                  </article>
                  </section>
                </div>
              </section>

              <div v-if="hourlyQuote && !addonOnlyQuote && quoteDialog.showOptionPrice !== false" class="option-prices">
                    <div class="option-prices__head">
                      <strong>{{ t("admin.supplierPricing.optionPriceTitle") }}</strong>
                      <p>{{ t(optionPriceHintKey) }}</p>
                    </div>
                    <div class="option-prices__stats">
                      <span>{{ t("admin.supplierPricing.optionPriceCount", { count: optionPrices.length }) }}</span>
                      <span v-if="optionPriceRange.low != null">{{
                        t("admin.supplierPricing.optionPriceLow", { price: moneyText(optionPriceRange.low) })
                      }}</span>
                      <span v-if="optionPriceRange.high != null">{{
                        t("admin.supplierPricing.optionPriceHigh", { price: moneyText(optionPriceRange.high) })
                      }}</span>
                    </div>
                    <div class="option-prices__filters">
                      <input
                        v-model="optionPriceQuery"
                        type="search"
                        :placeholder="t('admin.supplierPricing.optionPriceSearch')"
                        :aria-label="t('admin.supplierPricing.optionPriceSearch')"
                      />
                      <select
                        v-model="optionPriceGroup"
                        :aria-label="t('admin.supplierPricing.optionPriceAllGroups')"
                      >
                        <option value="">{{ t("admin.supplierPricing.optionPriceAllGroups") }}</option>
                        <option
                          v-for="group in optionPriceGroups"
                          :key="group.key"
                          :value="group.key"
                        >
                          {{ group.title }}
                        </option>
                      </select>
                    </div>
                    <div class="option-prices__table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>{{ t("admin.supplierPricing.optionPriceColOption") }}</th>
                            <th>{{ t("admin.supplierPricing.optionPriceColNote") }}</th>
                            <th>{{ t("admin.supplierPricing.optionPriceColCalc") }}</th>
                            <th>{{ t("admin.supplierPricing.optionPriceColExcl") }}</th>
                            <th>{{ t("admin.supplierPricing.optionPriceColPrice") }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="!visibleOptionPrices.length">
                            <td colspan="5" class="is-empty">{{ t("admin.supplierPricing.optionPriceEmpty") }}</td>
                          </tr>
                          <template v-for="group in visibleOptionPriceGroups" :key="group.key">
                            <tr v-if="group.title" class="is-group">
                              <td colspan="5">
                                <b>{{ group.title }}</b>
                                <em>{{ t("admin.supplierPricing.optionPriceGroupCount", { count: group.rows.length }) }}</em>
                              </td>
                            </tr>
                            <tr v-for="row in group.rows" :key="row.id">
                              <td class="is-option">
                                <b>{{ row.title }}</b>
                                <small v-if="row.detail">{{ row.detail }}</small>
                              </td>
                              <td class="is-note">
                                <span v-for="pill in row.pills" :key="pill">{{ pill }}</span>
                              </td>
                              <td class="is-calc">{{ row.calculation }}</td>
                              <td class="is-money">{{ row.excl == null ? "—" : `AED ${moneyText(row.excl)}` }}</td>
                              <td class="is-price">{{ row.price == null ? "—" : `AED ${moneyText(row.price)}` }}</td>
                            </tr>
                          </template>
                        </tbody>
                      </table>
                    </div>
                <p class="portal-vat-note">
                  {{ t("admin.supplierPortal.vatNote") }}
                </p>
              </div>
            </div>

            <aside class="pricing-review-panel">
              <span>{{ t("admin.supplierPortal.quoteSummary") }}</span>
              <h3>{{ t("admin.supplierPortal.priceStatus") }}</h3>
              <dl>
                <div>
                  <dt>{{ t("admin.supplierPortal.pricingProgress") }}</dt>
                  <dd class="portal-numeric">
                    {{ quoteProgress.done }} / {{ quoteProgress.total }}
                  </dd>
                </div>
                <div>
                  <dt>{{ t("admin.supplierPricing.reviewStatus") }}</dt>
                  <dd>
                    <el-tag
                      :type="quoteTagType(quoteEffectiveStatus)"
                      effect="light"
                      >{{ quoteStatusLabel(quoteEffectiveStatus) }}</el-tag
                    >
                  </dd>
                </div>
                <div v-if="Number(quoteDialog.status) === 2 && quoteDialogAcceptItems.length">
                  <dt>{{ t("admin.supplierPricing.acceptOutcome") }}</dt>
                  <dd class="portal-accept-bands">
                    <span
                      v-for="item in quoteDialogAcceptItems"
                      :key="item.key"
                      :class="`is-${item.key}`"
                    >{{
                      t("admin.supplierPricing.acceptCount", {
                        count: item.count,
                        label: item.label,
                      })
                    }}</span>
                  </dd>
                </div>
                <div>
                  <dt>{{ t("admin.supplierPricing.quoteMode") }}</dt>
                  <dd>{{ quoteModeLabel(quoteDialog.quoteMode) }}</dd>
                </div>
                <div v-if="!hourlyQuote && !addonOnlyQuote">
                  <dt>{{ t("admin.supplierPortal.enabledOptions") }}</dt>
                  <dd class="portal-numeric">
                    {{ enabledQuoteRows.length }} /
                    {{ quoteDialog.rows.length }}
                  </dd>
                </div>
                <div>
                  <dt>{{ t("admin.supplierPricing.missingPriceLabel") }}</dt>
                  <dd class="portal-numeric"
                    :class="{ 'portal-price-missing': quoteMissingCount > 0 }"
                  >
                    {{ quoteMissingCount }}
                  </dd>
                </div>
                <div v-if="quoteDialog.quoteMode === 1 && !addonOnlyQuote">
                  <dt>{{ t("admin.supplierPortal.completedPrices") }}</dt>
                  <dd class="portal-numeric">
                    {{
                      enabledQuoteRows.filter((row) =>
                        positiveAmount(row.quotePrice),
                      ).length
                    }}
                    / {{ enabledQuoteRows.length }}
                  </dd>
                </div>
                <div>
                  <dt>{{ quoteAddonTitle }}</dt>
                  <dd class="portal-numeric">{{ selectedAttachCount }}</dd>
                </div>
              </dl>
              <button
                v-if="quotePriceChanges.length"
                type="button"
                @click="priceChangesOpen = !priceChangesOpen"
              >
                <span>{{
                  t(
                    priceChangesOpen
                      ? "admin.supplierPortal.hidePriceChanges"
                      : "admin.supplierPortal.viewPriceChanges",
                  )
                }}</span>
                <small class="portal-numeric">{{ quotePriceChanges.length }}</small>
                <b>→</b>
              </button>
              <ul v-if="priceChangesOpen" class="quote-price-changes">
                <li v-for="row in quotePriceChanges" :key="row.skuId">
                  {{
                    t("admin.supplierPortal.priceChangeLine", {
                      name: row.lineLabel || quoteSpecLabel(row),
                      from: moneyText(row.approvedPrice),
                      to: moneyText(row.quotePrice),
                    })
                  }}
                </li>
              </ul>
            </aside>
          </div>

          <footer class="sv-quote__foot">
            <div class="sv-quote__foot-note">
              <span>{{ quoteStatusLabel(quoteEffectiveStatus) }}</span>
              <small v-if="quoteDialog.rejectReason">{{
                t("admin.supplierPricing.rejectReason", {
                  reason: supplierRejectCopy(quoteDialog.rejectReason),
                })
              }}</small>
              <small v-else>
                <button
                  v-if="quoteGaps.length"
                  type="button"
                  class="sv-quote__gap"
                  @click="focusQuoteGap"
                >
                  {{ quoteGapText }}
                </button>
                <template v-else>{{ t("admin.supplierPortal.vatNote") }}</template>
              </small>
            </div>
            <div>
              <el-button
                v-if="canAction(packageMode ? 'btn:/admin/supplier-management/package-pricing:save' : 'btn:/admin/supplier-management/pricing:save')"
                :loading="quoteDialog.saving"
                :disabled="quoteUnderReview || quotePriceLocked"
                @click="saveServiceQuote"
                >{{ t("admin.supplierPricing.saveDraft") }}</el-button
              >
              <el-button
                v-if="canAction(packageMode ? 'btn:/admin/supplier-management/package-pricing:save' : 'btn:/admin/supplier-management/pricing:save') && canRequestPriceChange"
                type="primary"
                @click="openPriceChange"
                >{{ t("admin.supplierPricing.priceChangeApply") }}</el-button
              >
              <el-button
                v-else-if="canAction(packageMode ? 'btn:/admin/supplier-management/package-pricing:save' : 'btn:/admin/supplier-management/pricing:save')"
                type="primary"
                :disabled="quoteUnderReview || quotePriceLocked"
                @click="reviewServiceQuote"
                >{{ t("admin.supplierPortal.reviewQuote") }}</el-button
              >
            </div>
          </footer>
        </section>
        <el-dialog
          class="supplier-form-dialog quote-review-dialog"
          :model-value="quoteScreen === 'review'"
          :title="t('admin.supplierPortal.reviewTitle')"
          width="min(760px, calc(100vw - 32px))"
          append-to-body
          :close-on-click-modal="false"
          :close-on-press-escape="!quoteDialog.saving"
          :show-close="!quoteDialog.saving"
          @update:model-value="closeQuoteReview"
        >
          <p class="quote-review-dialog__hint">
            {{ t("admin.supplierPortal.reviewHint") }}
          </p>
          <dl class="quote-review-dialog__facts">
            <div>
              <dt>{{ t("admin.supplierPricing.service") }}</dt>
              <dd>{{ quoteDialogTitle }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.supplierPricing.category") }}</dt>
              <dd>{{ quoteDialogCategory }}</dd>
            </div>
            <div>
              <dt>{{ t("admin.supplierPricing.quoteMode") }}</dt>
              <dd>{{ quoteModeLabel(quoteDialog.quoteMode ?? undefined) }}</dd>
            </div>
            <template v-if="hourlyQuote && !addonOnlyQuote">
              <div v-for="rate in activeHourlyRateFields" :key="rate.key">
                <dt>{{ t(rate.label) }}</dt>
                <dd class="portal-numeric portal-numeric--money">AED {{ moneyText(quoteDialog[rate.key]) }}</dd>
              </div>
              <div v-if="optionPrices.length && quoteDialog.showOptionPrice !== false" class="quantity-sku-notes">
                <dt>{{ t("admin.supplierPricing.optionPriceTitle") }}</dt>
                <dd>
                  <span v-for="row in optionPrices" :key="row.id">{{ optionPriceLine(row) }}</span>
                </dd>
              </div>
            </template>
            <div v-else-if="!addonOnlyQuote">
              <dt>{{ t("admin.supplierPortal.enabledOptions") }}</dt>
              <dd class="portal-numeric">{{ enabledQuoteRows.length }} / {{ quoteDialog.rows.length }}</dd>
            </div>
          </dl>
          <div
            v-if="!hourlyQuote && !addonOnlyQuote && reviewQuoteGroups.length"
            class="quote-review-dialog__groups"
          >
            <section v-for="group in reviewQuoteGroups" :key="group.key">
              <h3 v-if="group.title">
                <small v-if="group.type">{{ group.type }}</small>
                {{ group.title }}
              </h3>
              <div v-for="line in quoteDisplayLines(group.rows)" :key="line.key">
                <span v-if="line.title && line.title !== group.title">{{ line.title }}</span>
                <span
                  v-if="familyBadge(line)"
                  class="quote-accept-band"
                  :class="`is-${familyBadge(line).tone}`"
                >{{ familyBadge(line).label }}</span>
                <strong class="portal-numeric portal-numeric--money">AED {{ moneyText(familyPrice(line)) }}<template v-if="line.unit"> / {{ line.unit }}</template></strong>
                <small v-if="familyCoverText(line)" class="quote-line__covers">{{ familyCoverText(line) }}</small>
                <small v-if="familyRemark(line)" class="quote-fulfill-remark">{{
                  t("admin.supplierOrders.fulfillRemarkLine", { remark: familyRemark(line) })
                }}</small>
              </div>
            </section>
          </div>
          <div class="quote-review-dialog__addons">
            <h3>
              {{ quoteAddonTitle }}
              <small class="portal-numeric">{{ selectedAttachCount }}</small>
            </h3>
            <section
              v-for="group in offeredAttachGroups"
              :key="group.key"
              class="quote-attach-group"
            >
              <h4 v-if="group.label" class="quote-attach-group__title">{{ group.label }}</h4>
            <div
              v-for="item in group.items"
              :key="item.attachValueId"
              class="quote-review-addon"
            >
              <span
                >{{ attachDisplay(item, "name")
                }}<template v-if="attachUnit(item)">
                  / {{ attachUnit(item) }}</template
                ></span
              >
              <strong class="portal-numeric portal-numeric--money">AED {{ moneyText(item.quotePrice) }}</strong>
              <small v-if="item.rejectReason">{{
                t("admin.supplierPricing.lineRejected", { reason: supplierRejectCopy(item.rejectReason) })
              }}</small>
            </div>
            </section>
            <p v-if="!selectedAttachCount">
              {{ t("admin.supplierOrders.noAddons") }}
            </p>
          </div>
          <p class="quote-review-dialog__note">
            {{ t("admin.supplierPortal.vatNote") }}
            {{ t("admin.supplierPortal.lockNotice") }}
          </p>
          <template #footer>
            <el-checkbox
              v-model="quoteConfirmed"
              class="quote-review-dialog__confirmation"
              :class="{ 'is-confirmed': quoteConfirmed }"
            >
              <span class="quote-review-dialog__confirmation-copy">
                <strong>{{ t(quoteConfirmed ? 'admin.supplierPortal.quoteConfirmedLabel' : 'admin.supplierPortal.confirmQuotePrompt') }}</strong>
                <span>{{ t("admin.supplierPortal.confirmQuote") }}</span>
              </span>
            </el-checkbox>
            <div class="quote-review-dialog__actions">
              <el-button
                :disabled="quoteDialog.saving"
                @click="backToQuoteSetup"
                >{{ t("admin.supplierPortal.backQuote") }}</el-button
              >
              <el-button
                type="primary"
                :loading="quoteDialog.saving"
                :disabled="
                  quotePriceLocked ||
                  !quoteConfirmed ||
                  quoteMissingCount > 0 ||
                  !enabledQuoteRows.length
                "
                @click="submitServiceQuote"
                >{{ t("admin.supplierPortal.submitQuote") }}</el-button
              >
            </div>
          </template>
        </el-dialog>
        <el-dialog
          v-model="priceChangeOpen"
          class="supplier-form-dialog"
          :title="t('admin.supplierPricing.priceChangeApply')"
          width="min(480px, calc(100vw - 32px))"
          append-to-body
          :close-on-click-modal="!priceChangeSaving"
          :close-on-press-escape="!priceChangeSaving"
          :show-close="!priceChangeSaving"
        >
          <p>{{ t("admin.supplierPricing.priceChangeHint") }}</p>
          <el-input
            v-model="priceChangeReason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            :placeholder="t('admin.supplierPricing.priceChangeReason')"
          />
          <template #footer>
            <el-button :disabled="priceChangeSaving" @click="priceChangeOpen = false">{{
              t("admin.supplierPricing.close")
            }}</el-button>
            <el-button type="primary" :loading="priceChangeSaving" @click="submitPriceChange">{{
              t("admin.supplierPricing.priceChangeApply")
            }}</el-button>
          </template>
        </el-dialog>
        <section
          v-if="quoteScreen === 'submitted' && !packageBundle.active"
          class="portal-review-layout"
          v-loading="quoteDialog.loading"
        >
          <main class="portal-review-main">
            <div
              v-if="quoteScreen === 'submitted'"
              class="portal-submitted-notice"
              role="status"
            >
              <CircleCheck />
              <div>
                <strong>{{ t("admin.supplierPortal.quoteSubmitted") }}</strong>
                <p>
                  {{ t("admin.supplierPortal.lockNotice") }}
                  {{ t("admin.supplierPortal.reviewEta") }}
                </p>
                <small class="portal-numeric" v-if="quoteDialog.submittedAt">{{
                  t("admin.supplierPortal.submittedOn", {
                    date: orderClock(quoteDialog.submittedAt),
                  })
                }}</small>
              </div>
            </div>
            <section class="portal-review-card">
              <h2>{{ t("admin.supplierPortal.quoteOverview") }}</h2>
              <dl class="portal-review-facts">
                <div>
                  <dt>{{ t("admin.supplierPricing.service") }}</dt>
                  <dd>{{ quoteDialogTitle }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.supplierPricing.category") }}</dt>
                  <dd>{{ quoteDialogCategory }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.supplierPricing.quoteMode") }}</dt>
                  <dd>
                    {{ quoteModeLabel(quoteDialog.quoteMode ?? undefined) }}
                  </dd>
                </div>
                <template v-if="hourlyQuote && !addonOnlyQuote">
                  <div v-for="rate in activeHourlyRateFields" :key="rate.key">
                    <dt>{{ t(rate.label) }}</dt>
                    <dd class="portal-numeric portal-numeric--money">AED {{ moneyText(quoteDialog[rate.key]) }}</dd>
                  </div>
                  <div v-if="optionPrices.length && quoteDialog.showOptionPrice !== false" class="quantity-sku-notes">
                    <dt>{{ t("admin.supplierPricing.optionPriceTitle") }}</dt>
                    <dd>
                      <span v-for="row in optionPrices" :key="row.id">{{ optionPriceLine(row) }}</span>
                    </dd>
                  </div>
                </template>
                <div v-if="!hourlyQuote && !addonOnlyQuote">
                  <dt>{{ t("admin.supplierPortal.enabledOptions") }}</dt>
                  <dd class="portal-numeric">
                    {{ enabledQuoteRows.length }} /
                    {{ quoteDialog.rows.length }}
                  </dd>
                </div>
              </dl>
            </section>
            <section
              v-if="!hourlyQuote && !addonOnlyQuote"
              class="portal-review-card"
            >
              <h2>{{ t("admin.supplierPortal.optionsPrices") }}</h2>
              <div class="portal-review-options">
                <div
                  v-if="showQuoteGroupTabs"
                  class="quote-group-tabs"
                  role="tablist"
                  :aria-label="quoteGroupType || t('admin.supplierPortal.optionsPrices')"
                >
                  <span v-if="quoteGroupType" class="quote-group-tabs__type">{{
                    quoteGroupType
                  }}</span>
                  <button
                    v-for="group in quoteGroupTabs"
                    :key="group.key"
                    type="button"
                    role="tab"
                    :aria-selected="group.key === quoteGroupTab"
                    :class="{ 'is-on': group.key === quoteGroupTab }"
                    @click="quoteGroupTab = group.key"
                  >
                    {{ group.title }}
                  </button>
                </div>
                <section
                  v-for="group in visibleQuoteGroups"
                  :key="group.key"
                  class="quote-group"
                >
                  <header v-if="!showQuoteGroupTabs && group.title" class="quote-group__head">
                    <small v-if="group.type">{{ group.type }}</small>
                    <strong>{{ group.title }}</strong>
                  </header>
                  <article
                    v-for="line in quoteDisplayLines(group.rows)"
                    :key="line.key"
                    :class="{ 'is-blocked': line.rows.some((row) => quoteOutcomeName(row) === 'blocked') }"
                  >
                    <h3>
                      <span>{{ line.title }}</span>
                      <span
                        v-if="familyBadge(line)"
                        class="quote-accept-band"
                        :class="`is-${familyBadge(line).tone}`"
                      >{{ familyBadge(line).label }}</span>
                    </h3>
                    <p v-if="familyCoverText(line)" class="quote-line__covers">{{ familyCoverText(line) }}</p>
                    <p v-if="familyRemark(line)" class="quote-fulfill-remark">{{
                      t("admin.supplierOrders.fulfillRemarkLine", { remark: familyRemark(line) })
                    }}</p>
                    <dl>
                      <div v-if="familyPrice(line) != null && familyPrice(line) !== ''">
                        <dt>{{ t("admin.supplierPortal.customerPrice") }}</dt>
                        <dd class="portal-review-price portal-numeric portal-numeric--money">
                          AED {{ moneyText(familyPrice(line)) }}<template v-if="line.unit"> / {{ line.unit }}</template>
                        </dd>
                      </div>
                    </dl>
                  </article>
                </section>
              </div>
              <p class="portal-review-note">
                {{ t("admin.supplierPortal.fixedRule") }}
              </p>
            </section>
            <section class="portal-review-card">
              <header>
                <h2>{{ t(individualSupplier ? "admin.supplierPortal.orderContact" : "admin.supplierPortal.staffContact") }}</h2>
                <el-button
                  v-if="quoteScreen === 'review'"
                  link
                  @click="openQuotedServiceEditor"
                  >{{ t(individualSupplier ? "admin.supplierPortal.editOrderContact" : "admin.supplierPortal.editContact") }}</el-button
                >
              </header>
              <dl class="portal-review-facts">
                <div>
                  <dt>{{ t("admin.supplierProfile.contactPerson") }}</dt>
                  <dd>{{ (individualSupplier ? profileDisplayName : companyForm.contact) || "—" }}</dd>
                </div>
                <div v-if="!individualSupplier">
                  <dt>{{ t("admin.supplierPricing.headcount") }}</dt>
                  <dd class="portal-numeric">{{ quoteContact?.workerCount ?? "—" }}</dd>
                </div>
                <div>
                  <dt>{{ t("admin.supplierPricing.phone") }}</dt>
                  <dd class="portal-numeric">
                    {{
                      quoteContact?.phones.filter(Boolean).join(" / ") || "—"
                    }}
                  </dd>
                </div>
              </dl>
            </section>
            <section class="portal-review-card">
              <h2>
                {{ quoteAddonTitle }}
                <small class="portal-numeric">{{ selectedAttachCount }}</small>
              </h2>
              <section
                v-for="group in offeredAttachGroups"
                :key="group.key"
                class="quote-attach-group"
              >
                <h3 v-if="group.label" class="quote-attach-group__title">{{ group.label }}</h3>
              <div
                v-for="item in group.items"
                :key="item.attachValueId"
                class="portal-review-addon"
              >
                <span
                  >{{ attachDisplay(item, "name")
                  }}<template v-if="attachUnit(item)">
                    / {{ attachUnit(item) }}</template
                  ></span
                ><strong class="portal-numeric portal-numeric--money">AED {{ moneyText(item.quotePrice) }}</strong>
                <small v-if="item.rejectReason">{{
                  t("admin.supplierPricing.lineRejected", { reason: supplierRejectCopy(item.rejectReason) })
                }}</small>
              </div>
              </section>
              <p v-if="!selectedAttachCount" class="portal-review-note">
                {{ t("admin.supplierOrders.noAddons") }}
              </p>
            </section>
          </main>
          <aside class="portal-review-submit">
            <h2>{{ t("admin.supplierPortal.quoteSummary") }}</h2>
            <dl>
              <div>
                <dt>{{ t("admin.supplierPricing.reviewStatus") }}</dt>
                <dd>
                  <el-tag
                    :type="quoteScreen === 'submitted' ? 'warning' : 'success'"
                    >{{
                      quoteScreen === "submitted"
                        ? quoteStatusLabel(1)
                        : t("admin.supplierPortal.ready")
                    }}</el-tag
                  >
                </dd>
              </div>
              <div v-if="!hourlyQuote && !addonOnlyQuote">
                <dt>{{ t("admin.supplierPortal.enabledOptions") }}</dt>
                <dd class="portal-numeric">{{ enabledQuoteRows.length }}</dd>
              </div>
              <div>
                <dt>{{ t("admin.supplierPortal.missingFields") }}</dt>
                <dd class="portal-numeric">{{ quoteMissingCount }}</dd>
              </div>
              <div>
                <dt>{{ quoteAddonTitle }}</dt>
                <dd class="portal-numeric">{{ selectedAttachCount }}</dd>
              </div>
            </dl>
            <p>{{ t("admin.supplierPortal.vatNote") }}</p>
            <el-button @click="closeServiceQuote">{{
              t("admin.supplierPortal.backCategory", {
                category: quoteDialogCategory,
              })
            }}</el-button>
            <p class="portal-review-note">
              {{ t("admin.supplierPortal.reviewEta") }}
            </p>
          </aside>
        </section>
      </div>

      <el-dialog
        v-model="servicePicker.open"
        class="supplier-form-dialog sv-add-dialog"
        :title="t('admin.supplierPricing.addService')"
        width="min(760px, calc(100vw - 32px))"
        :close-on-click-modal="false"
        append-to-body
      >
        <p class="sv-add__note">
          {{ t("admin.supplierPricing.onlyCategories") }}
        </p>
        <div class="picker-toolbar">
          <el-select
            v-model="servicePicker.categoryId"
            filterable
            clearable
            :placeholder="t('admin.supplierPricing.selectCategory')"
          >
            <el-option
              v-for="group in pickerCategories"
              :key="group.categoryId"
              :label="
                localizedCategory(group.categoryName, group.categoryNameI18n)
              "
              :value="group.categoryId"
            />
          </el-select>
          <el-input
            v-model="servicePicker.keyword"
            clearable
            :placeholder="t('admin.supplierPricing.searchService')"
          />
        </div>
        <p v-if="!pickerReady" class="picker-hint">
          {{ t("admin.supplierPricing.pickerGate") }}
        </p>
        <div v-else class="picker-list">
          <div class="picker-list__bar">
            <small
              >{{
                t("admin.supplierPricing.shown", {
                  count: pickerVisible.length,
                })
              }}<template v-if="servicePicker.drafts.length">
                ·
                {{
                  t("admin.supplierPricing.selected", {
                    count: servicePicker.drafts.length,
                  })
                }}</template
              ></small
            >
          </div>
          <p v-if="!pickerVisible.length" class="picker-hint">
            {{ t("admin.supplierPricing.noMatch") }}
          </p>
          <div
            v-for="service in pickerVisible"
            :key="pickKey(service)"
            class="picker-row"
            :class="{ 'is-added': service.added, 'is-open': draftOf(service) }"
          >
            <div class="picker-row__head">
              <el-checkbox
                :model-value="service.added || Boolean(draftOf(service))"
                :disabled="service.added"
                @change="(value) => togglePick(service, Boolean(value))"
              />
              <span class="picker-row__name">
                <strong>{{
                  serviceTitle(service.spuName, service.spuNameI18n)
                }}</strong>
                <small
                  >{{
                    localizedCategory(
                      service.categoryName,
                      service.categoryNameI18n,
                    )
                  }}<template v-if="!service.available">
                    · {{ t("admin.supplierPricing.unavailable") }}</template
                  ></small
                >
              </span>
              <em v-if="service.added">{{
                t("admin.supplierPricing.added")
              }}</em>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="servicePicker.open = false">{{
            t("admin.supplierPricing.cancel")
          }}</el-button>
          <el-button
            type="primary"
            :loading="catalogSaving"
            @click="confirmAddServices"
            >{{ t("admin.supplierPricing.addToList") }}</el-button
          >
        </template>
      </el-dialog>

      <el-dialog
        v-model="packagePicker.open"
        class="supplier-form-dialog sv-add-dialog"
        :title="t('admin.supplierPortal.selectPackages')"
        width="min(760px, calc(100vw - 32px))"
        :close-on-click-modal="false"
        append-to-body
      >
        <p class="sv-add__note">{{ t("admin.supplierPortal.packagesHint") }}</p>
        <div class="picker-toolbar">
          <el-select
            v-model="packagePicker.categoryId"
            filterable
            clearable
            :placeholder="t('admin.supplierPricing.selectCategory')"
          >
            <el-option
              v-for="group in packageCatalog"
              :key="group.categoryId"
              :label="localizedCategory(group.categoryName, group.nameI18n)"
              :value="group.categoryId"
            />
          </el-select>
          <el-input
            v-model="packagePicker.keyword"
            clearable
            :placeholder="t('admin.supplierPricing.searchService')"
          />
        </div>
        <div class="picker-list">
          <div class="picker-list__bar">
            <small>{{
              t("admin.supplierPricing.shown", { count: packagePickerRows.length })
            }}<template v-if="packagePicker.checked.length">
              · {{ t("admin.supplierPricing.selected", { count: packagePicker.checked.length }) }}
            </template></small>
          </div>
          <p v-if="!packagePickerRows.length" class="picker-hint">
            {{ t("admin.supplierPricing.noMatch") }}
          </p>
          <div
            v-for="item in packagePickerRows"
            :key="item.packageId"
            class="picker-row"
            :class="{ 'is-added': packagePicker.checked.includes(item.packageId) }"
          >
            <div class="picker-row__head">
              <el-checkbox
                :model-value="packagePicker.checked.includes(item.packageId)"
                @change="(value) => togglePackagePick(item.packageId, Boolean(value))"
              />
              <span class="picker-row__name">
                <strong>{{ serviceTitle(item.name, item.nameI18n) }}</strong>
                <small>{{ localizedCategory(item.categoryName, item.categoryNameI18n) }}</small>
              </span>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="packagePicker.open = false">{{ t("admin.supplierPricing.cancel") }}</el-button>
          <el-button v-if="canAction('btn:/admin/supplier-management/package-pricing:save')" type="primary" :loading="packageSaving" @click="savePackageSelection">{{ t("admin.supplierPortal.saveSelection") }}</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="serviceEditor.open"
        class="supplier-form-dialog"
        :title="`${serviceEditorTitle} · ${t(individualSupplier ? 'admin.supplierPortal.orderContact' : 'admin.supplierPortal.staffContact')}`"
        width="min(560px, calc(100vw - 32px))"
        :close-on-click-modal="false"
        append-to-body
      >
        <div class="service-editor-intro">
          <span>{{ t("admin.supplierPricing.serviceSetupTitle") }}</span>
          <strong>{{ serviceEditorTitle }}</strong>
          <p>{{ t(individualSupplier ? "admin.supplierPricing.serviceSetupHintPersonal" : "admin.supplierPricing.serviceSetupHint") }}</p>
        </div>
        <div class="picker-fields">
          <label v-if="!individualSupplier">
            <span>{{ t("admin.supplierPricing.headcount") }}</span>
            <el-input-number
              v-model="serviceEditor.workerCount"
              :min="1"
              :precision="0"
              controls-position="right"
            />
          </label>
          <div class="phone-stack">
            <span>{{ t("admin.supplierPricing.phone") }}</span>
            <div
              v-for="(_phone, index) in serviceEditor.phones"
              :key="`edit-${index}`"
              class="phone-row"
            >
              <small>{{
                t("admin.supplierPricing.phoneEntry", { index: index + 1 })
              }}</small>
              <el-input
                v-model="serviceEditor.phones[index]"
                maxlength="24"
                placeholder="+971501234567"
              />
              <el-button
                v-if="serviceEditor.phones.length > 1"
                @click="removePhone(serviceEditor, index)"
                >{{ t("admin.supplierPricing.delete") }}</el-button
              >
            </div>
            <el-button
              v-if="serviceEditor.phones.length < 10"
              link
              type="primary"
              @click="addPhone(serviceEditor)"
              >{{ t("admin.supplierPricing.addPhone") }}</el-button
            >
          </div>
        </div>
        <template #footer>
          <el-button @click="serviceEditor.open = false">{{
            t("admin.supplierPricing.cancel")
          }}</el-button>
          <el-button
            type="primary"
            :loading="catalogSaving"
            @click="saveServiceEditor"
            >{{ t("admin.supplierPricing.save") }}</el-button
          >
        </template>
      </el-dialog>

      <el-dialog
        v-model="categoryContactDialog.open"
        class="supplier-form-dialog"
        :title="t('admin.supplierPortal.categoryContact')"
        width="min(480px, calc(100vw - 32px))"
        :close-on-click-modal="false"
        append-to-body
      >
        <div class="service-editor-intro">
          <span>{{ t("admin.supplierPortal.categoryContact") }}</span>
          <strong>{{ categoryContactDialog.label }}</strong>
          <p>{{ t("admin.supplierPortal.categoryContactHint") }}</p>
        </div>
        <div class="portal-contact-form">
          <label>
            <span>{{ t("admin.supplierPortal.categoryContactName") }}</span>
            <el-input
              v-model="categoryContactDialog.contactName"
              maxlength="128"
              :placeholder="t('admin.supplierPortal.categoryContactName')"
            />
          </label>
          <div class="phone-stack portal-contact-phones">
            <span>{{ t("admin.supplierPricing.phone") }}</span>
            <div
              v-for="(_phone, index) in categoryContactDialog.phones"
              :key="`category-phone-${index}`"
              class="phone-row"
            >
              <el-input
                v-model="categoryContactDialog.phones[index]"
                maxlength="24"
                :placeholder="'+971501234567'"
                :aria-label="
                  t('admin.supplierPricing.phoneEntry', { index: index + 1 })
                "
              />
              <el-button
                v-if="categoryContactDialog.phones.length > 1"
                @click="removeCategoryPhone(index)"
                >{{ t("admin.supplierPricing.delete") }}</el-button
              >
            </div>
            <el-button
              v-if="categoryContactDialog.phones.length < 10"
              link
              type="primary"
              @click="addCategoryPhone"
              >{{ t("admin.supplierPricing.addPhone") }}</el-button
            >
          </div>
        </div>
        <template #footer>
          <el-button @click="categoryContactDialog.open = false">{{
            t("admin.supplierPricing.cancel")
          }}</el-button>
          <el-button
            type="primary"
            :loading="Boolean(categoryPhoneSaving[categoryContactDialog.categoryId])"
            @click="saveCategoryPhones"
            >{{ t("admin.supplierPricing.save") }}</el-button
          >
        </template>
      </el-dialog>
    </template>

    <template v-else-if="section === 'settlement'">
      <div class="metric-grid">
        <article class="metric-card">
          <span class="metric-icon metric-icon--green"><Money /></span>
          <div>
            <small>累计收益</small><strong>AED 286.4k</strong>
            <p>Since Jan 2026</p>
          </div>
        </article>
        <article class="metric-card">
          <span class="metric-icon metric-icon--blue"><CircleCheck /></span>
          <div>
            <small>已结算</small><strong>AED 243.1k</strong>
            <p>18 payout batches</p>
          </div>
        </article>
        <article class="metric-card">
          <span class="metric-icon metric-icon--amber"><Clock /></span>
          <div>
            <small>待结算</small><strong>AED 12,680</strong>
            <p>Next payout · 30 Sep</p>
          </div>
        </article>
        <article class="metric-card">
          <span class="metric-icon metric-icon--purple"><Document /></span>
          <div>
            <small>本期调整</small><strong>- AED 180</strong>
            <p>1 append-only adjustment</p>
          </div>
        </article>
      </div>
      <el-card class="surface-card" shadow="never">
        <el-tabs v-model="settlementTab" class="settlement-tabs">
          <el-tab-pane label="交易明细" name="transactions">
            <section class="settlement-note">
              <CircleCheck /><span
                ><strong>每笔收益均来自订单完成时锁定的快照</strong
                ><small
                  >金额调整不会覆盖原记录，而是新增一条调整流水。</small
                ></span
              >
            </section>
            <el-table :data="settlementRows" class="data-table" row-key="jobId">
              <el-table-column label="Web Order / Job ID" min-width="205"
                ><template #default="{ row }"
                  ><div class="order-id">
                    <strong class="portal-numeric">{{ row.webOrder }}</strong
                    ><small class="portal-numeric">{{ row.jobId }} · {{ row.date }}</small>
                  </div></template
                ></el-table-column
              >
              <el-table-column label="服务" min-width="190" prop="service" />
              <el-table-column label="执行人员" min-width="150" prop="staff" />
              <el-table-column label="订单收益" min-width="125" align="right"
                ><template #default="{ row }"
                  >AED {{ row.base }}</template
                ></el-table-column
              >
              <el-table-column label="调整" min-width="110" align="right"
                ><template #default="{ row }"
                  ><span class="portal-numeric portal-numeric--money"
                    :class="row.adjustment < 0 ? 'negative' : 'muted-text'"
                    >{{
                      row.adjustment ? `- AED ${Math.abs(row.adjustment)}` : "—"
                    }}</span
                  ></template
                ></el-table-column
              >
              <el-table-column label="最终应付" min-width="130" align="right"
                ><template #default="{ row }"
                  ><strong class="money-value portal-numeric portal-numeric--money"
                    >AED {{ row.payable }}</strong
                  ></template
                ></el-table-column
              >
              <el-table-column label="结算状态" width="100"
                ><template #default="{ row }"
                  ><el-tag
                    :type="row.status === 'Paid' ? 'success' : 'warning'"
                    effect="light"
                    >{{ row.status }}</el-tag
                  ></template
                ></el-table-column
              >
              <el-table-column label="批次" min-width="130" prop="batch" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="付款批次" name="payouts">
            <el-table :data="payoutBatches" class="data-table" row-key="batch">
              <el-table-column
                label="批次"
                prop="batch"
                width="120"
              /><el-table-column
                label="账期"
                prop="period"
                min-width="160"
              /><el-table-column
                label="订单数"
                prop="orders"
                width="88"
              /><el-table-column label="应付金额" width="120"
                ><template #default="{ row }"
                  ><strong class="portal-numeric portal-numeric--money">AED {{ row.amount }}</strong></template
                ></el-table-column
              ><el-table-column
                label="付款日"
                prop="paidAt"
                width="118"
              /><el-table-column label="状态" width="88"
                ><template #default="{ row }"
                  ><el-tag
                    :type="row.status === 'Paid' ? 'success' : 'warning'"
                    >{{ row.status }}</el-tag
                  ></template
                ></el-table-column
              >
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <el-dialog
      v-model="shiftDialogVisible"
      class="supplier-form-dialog"
      title="添加班次 / Block"
      width="min(620px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-position="top" class="form-grid">
        <el-form-item label="人员"
          ><el-select v-model="shiftForm.staff"
            ><el-option
              v-for="person in schedulePeople"
              :key="person.id"
              :label="person.name"
              :value="person.id" /></el-select
        ></el-form-item>
        <el-form-item label="动作"
          ><el-select v-model="shiftForm.type"
            ><el-option label="工作班次" value="shift" /><el-option
              label="不可用 Block"
              value="block" /><el-option
              label="休假"
              value="leave" /></el-select
        ></el-form-item>
        <el-form-item label="日期"
          ><el-date-picker v-model="shiftForm.date" value-format="YYYY-MM-DD"
        /></el-form-item>
        <el-form-item label="时间"
          ><el-time-picker
            v-model="shiftForm.time"
            is-range
            range-separator="至"
        /></el-form-item>
        <el-form-item label="备注" class="span-2"
          ><el-input v-model="shiftForm.note" type="textarea"
        /></el-form-item>
      </el-form>
      <section v-if="shiftConflict" class="conflict-alert">
        <Warning /><span
          ><strong>发现时间冲突</strong
          ><small>该员工 14:00–18:00 已被订单 JOB-88421 占用。</small></span
        >
      </section>
      <template #footer
        ><el-button @click="shiftDialogVisible = false">取消</el-button
        ><el-button type="primary" @click="validateShift"
          >校验并保存</el-button
        ></template
      >
    </el-dialog>

    <el-drawer
      v-model="orderDrawerVisible"
      class="order-drawer"
      :title="t('admin.supplierOrders.detailTitle')"
      size="min(760px, 100vw)"
      append-to-body
    >
      <div v-loading="orderDetailLoading" class="order-sheet">
        <template v-if="selectedOrder">
          <header class="order-lead">
            <div class="order-lead__topline">
              <span>{{ orderKindLabel(selectedOrder) || t("admin.supplierOrders.assignedOrder") }}</span>
              <el-tag
                :type="serviceStatusTag(selectedOrder.serviceStatus)"
                effect="light"
                >{{ serviceStatusText(selectedOrder) }}</el-tag
              >
            </div>
            <strong class="order-lead__number">{{
              selectedOrder.orderNo || "—"
            }}</strong>
            <h2>{{ orderServiceTitle(selectedOrder) }}</h2>
            <p v-if="packageOrderTitle(selectedOrder) || packageVisitText(selectedOrder)" class="order-package-visit">
              <template v-if="packageOrderTitle(selectedOrder)">{{ packageOrderTitle(selectedOrder) }}</template>
              <template v-if="packageOrderTitle(selectedOrder) && packageVisitText(selectedOrder)"> · </template>
              <template v-if="packageVisitText(selectedOrder)">{{ packageVisitText(selectedOrder) }}</template>
            </p>
            <p>{{ t("admin.supplierOrders.detailHint") }}</p>
            <p v-if="orderCancelled(selectedOrder)" class="order-alert">
              {{
                selectedOrder.cancelReason
                  ? t("admin.supplierOrders.cancelReason", {
                      reason: selectedOrder.cancelReason,
                    })
                  : t("admin.supplierOrders.orderCancelled")
              }}
            </p>
            <p v-else-if="selectedOrder.rescheduled" class="order-reschedule">
              {{ t("admin.supplierOrders.rescheduleNotice") }}
            </p>
            <div class="order-lead__summary">
              <div>
                <Calendar /><span
                  ><small>{{ t("admin.supplierOrders.serviceTime") }}</small
                  ><strong class="portal-numeric">{{ orderWhen(selectedOrder) }}</strong></span
                >
              </div>
              <div>
                <Money /><span
                  ><small>{{ t("admin.supplierOrders.price") }}</small
                  ><strong class="portal-numeric portal-numeric--money"
                    >AED
                    {{ orderMoney(supplierOrderEarning(selectedOrder)) }}</strong
                  ></span
                >
              </div>
            </div>
          </header>

          <div class="order-detail-grid">
            <section class="order-panel order-panel--wide">
              <h3>
                {{ t("admin.supplierOrders.serviceBlock") }}
              </h3>
              <div class="order-facts">
                <div v-if="orderGroups(selectedOrder).length" class="is-wide">
                  <span>{{ t("admin.supplierOrders.orderItems") }}</span>
                  <div class="order-groups">
                    <section
                      v-for="(group, index) in orderGroups(selectedOrder)"
                      :key="group.key"
                      class="order-group"
                      :class="{ 'order-group--addon': group.source === 'ADDON' }"
                    >
                      <header>
                        <i>{{ index + 1 }}</i>
                        <strong>{{ groupTitle(group) }}</strong>
                        <small v-if="group.addonPaymentId">{{
                          t("admin.supplierOrders.addonPayment", { id: group.addonPaymentId })
                        }}</small>
                      </header>
                      <div v-if="group.skus.length" class="order-lines">
                        <article v-for="sku in group.skus" :key="sku.id">
                          <div>
                            <strong>{{ orderServiceTitle(sku) }}</strong>
                            <small v-if="orderSpecText(sku) !== '—'">{{ orderSpecText(sku) }}</small>
                            <small v-if="sku.supplierFulfillRemark" class="order-fulfill-remark">{{
                              t("admin.supplierOrders.fulfillRemarkLine", { remark: sku.supplierFulfillRemark })
                            }}</small>
                          </div>
                          <dl>
                            <div v-if="sku.quantity != null">
                              <dt>{{ t("admin.supplierOrders.quantity") }}</dt>
                              <dd class="portal-numeric">{{ sku.quantity }}</dd>
                            </div>
                            <div v-if="supplierLineEarning(sku) != null">
                              <dt>{{ t("admin.supplierOrders.price") }}</dt>
                              <dd class="portal-numeric portal-numeric--money">AED {{ orderMoney(supplierLineEarning(sku)) }}</dd>
                            </div>
                          </dl>
                        </article>
                      </div>
                      <ul v-if="group.attaches.length" class="order-attaches">
                        <li v-for="item in group.attaches" :key="item.id">
                          <p>
                            <strong>{{ attachLabel(item) }}</strong>
                            <em>{{ attachQuantity(item) }}</em>
                          </p>
                          <dl>
                            <div v-if="supplierAttachEarning(item) != null">
                              <dt>{{ t("admin.supplierOrders.price") }}</dt>
                              <dd>AED {{ orderMoney(supplierAttachEarning(item)) }}</dd>
                            </div>
                          </dl>
                        </li>
                      </ul>
                    </section>
                  </div>
                </div>
                <div v-else class="is-wide">
                  <span>{{ t("admin.supplierOrders.specs") }}</span
                  ><strong>{{ orderSpecText(selectedOrder) }}</strong>
                </div>
                <div
                  v-if="!orderGroups(selectedOrder).length && orderFulfillRemarks(selectedOrder).length"
                  class="is-wide"
                >
                  <span>{{ t("admin.supplierOrders.fulfillRemark") }}</span>
                  <strong>{{ orderFulfillRemarks(selectedOrder).join(String(locale).startsWith("en") ? "; " : "；") }}</strong>
                </div>
                <div v-if="!orderGroups(selectedOrder).length" class="is-wide">
                  <span>{{ t("admin.supplierOrders.addons") }}</span>
                  <strong>{{ orderAddonText(selectedOrder) }}</strong>
                </div>
                <div class="is-wide">
                  <span>{{ t("admin.supplierOrders.serviceTime") }}</span
                  ><strong class="portal-numeric">{{ orderWhen(selectedOrder) }}</strong>
                </div>
                <div v-if="!individualSupplier" class="is-wide">
                  <span>{{ t("admin.supplierOrders.assignedStaff") }}</span
                  ><strong>{{
                    assignedStaffText(selectedOrder) ||
                    t("admin.supplierOrders.assignedStaffEmpty")
                  }}</strong>
                </div>
                <div v-if="materialHourStaffCount(selectedOrder) != null">
                  <span>{{ t("admin.supplierOrders.serviceStaffCount") }}</span
                  ><strong class="portal-numeric">{{ materialHourStaffCount(selectedOrder) }}</strong>
                </div>
                <div v-if="materialHourServiceHours(selectedOrder) != null">
                  <span>{{ t("admin.supplierOrders.serviceDuration") }}</span
                  ><strong class="portal-numeric">{{ orderHours(materialHourServiceHours(selectedOrder)) }}</strong>
                </div>
              </div>
            </section>

            <section class="order-panel">
              <h3>{{ t("admin.supplierOrders.placeBlock") }}</h3>
              <p class="order-address">
                {{ selectedOrder.serviceAddress || "—" }}
              </p>
              <p class="order-address">
                {{ t("admin.supplierOrders.customerRemark") }}:
                {{ selectedOrder.remark || "—" }}
              </p>
              <p v-if="selectedOrder.additionalNotes" class="order-address">
                {{ t("admin.supplierOrders.additionalNotes") }}:
                {{ selectedOrder.additionalNotes }}
              </p>
              <a
                v-if="googleNavigateUrl(selectedOrder)"
                class="order-map"
                :href="googleNavigateUrl(selectedOrder)"
                target="_blank"
                rel="noopener noreferrer"
                >{{ t("admin.supplierOrders.navigateGoogle") }}</a
              >
            </section>

            <section class="order-panel">
              <h3>{{ t("admin.supplierOrders.quoteBlock") }}</h3>
              <div class="order-quote">
                <div>
                  <span>{{ t("admin.supplierOrders.price") }}</span>
                  <strong class="portal-numeric portal-numeric--money"
                    ><small>AED</small
                    >{{ orderMoney(supplierOrderEarning(selectedOrder)) }}</strong
                  >
                </div>
              </div>
            </section>

            <section class="order-panel order-panel--wide">
              <h3>
                {{ t("admin.supplierOrders.contactBlock") }}
              </h3>
              <div class="order-facts">
                <div>
                  <span>{{ t("admin.supplierOrders.phones") }}</span>
                  <strong
                    v-if="orderPhones(selectedOrder).length"
                    class="phone-list"
                  >
                    <em
                      v-for="(phone, index) in orderPhones(selectedOrder)"
                      :key="`${phone}-${index}`"
                      >{{ phone }}</em
                    >
                  </strong>
                  <strong v-else>—</strong>
                </div>
                <div v-if="selectedOrder.customerPhoneTail">
                  <span>{{ t("admin.supplierOrders.customerTail") }}</span>
                  <strong class="portal-numeric">{{ selectedOrder.customerPhoneTail }}</strong>
                </div>
              </div>
            </section>

            <section
              v-if="
                selectedOrder.departTime ||
                selectedOrder.additionalNotes ||
                selectedOrder.arriveRemark ||
                selectedOrder.completeRemark
              "
              class="order-panel order-panel--wide"
            >
              <h3>
                {{ t("admin.supplierOrders.executionBlock") }}
              </h3>
              <div class="order-facts">
                <div v-if="selectedOrder.departTime">
                  <span>{{ t("admin.supplierOrders.departTime") }}</span
                  ><strong class="portal-numeric">{{ orderClock(selectedOrder.departTime) }}</strong>
                </div>
                <div v-if="selectedOrder.additionalNotes" class="is-wide">
                  <span>{{ t("admin.supplierOrders.additionalNotes") }}</span
                  ><strong>{{ selectedOrder.additionalNotes }}</strong>
                </div>
                <div v-if="selectedOrder.arriveRemark">
                  <span>{{ t("admin.supplierOrders.arriveNote") }}</span
                  ><strong>{{ selectedOrder.arriveRemark }}</strong>
                </div>
                <div v-if="selectedOrder.completeRemark">
                  <span>{{ t("admin.supplierOrders.completeNote") }}</span
                  ><strong>{{ selectedOrder.completeRemark }}</strong>
                </div>
              </div>
            </section>

            <section
              v-if="orderPhotos(selectedOrder.arrivePhotos).length"
              class="order-panel order-panel--wide order-photos"
            >
              <h3>
                {{ t("admin.supplierOrders.arrivePhotos") }}
              </h3>
              <button
                v-for="(url, index) in orderPhotos(selectedOrder.arrivePhotos)"
                :key="url"
                type="button"
                :aria-label="`${t('admin.supplierOrders.arrivePhotos')} ${index + 1}`"
                @click="openFilePreview(url)"
              >
                <img
                  :src="url"
                  :alt="`${t('admin.supplierOrders.arrivePhotos')} ${index + 1}`"
                />
              </button>
            </section>
            <section
              v-if="orderPhotos(selectedOrder.completePhotos).length"
              class="order-panel order-panel--wide order-photos"
            >
              <h3>
                {{ t("admin.supplierOrders.completePhotos") }}
              </h3>
              <button
                v-for="(url, index) in orderPhotos(
                  selectedOrder.completePhotos,
                )"
                :key="url"
                type="button"
                :aria-label="`${t('admin.supplierOrders.completePhotos')} ${index + 1}`"
                @click="openFilePreview(url)"
              >
                <img
                  :src="url"
                  :alt="`${t('admin.supplierOrders.completePhotos')} ${index + 1}`"
                />
              </button>
            </section>
          </div>
        </template>
      </div>
      <template #footer>
        <div v-if="selectedOrder" class="order-drawer-footer">
          <div>
            <span>{{ t("admin.supplierOrders.serviceStatus") }}</span
            ><strong>{{ serviceStatusText(selectedOrder) }}</strong>
          </div>
          <el-button
            v-if="canAction('btn:/admin/supplier-management/orders:assign') && canAssignStaff(selectedOrder)"
            type="primary"
            @click="openAssignStaff(selectedOrder)"
            >{{ t("admin.supplierOrders.assignStaff") }}</el-button
          >
          <el-button
            v-if="
              canAction('btn:/admin/supplier-management/orders:reject') &&
              serviceStep(selectedOrder) === 0 && !orderCancelled(selectedOrder)
            "
            @click="rejectOrder(selectedOrder)"
            >{{ t("admin.supplierOrders.rejectAction") }}</el-button
          >
          <el-button
            v-if="
              canAction('btn:/admin/supplier-management/orders:accept') &&
              serviceStep(selectedOrder) === 0 && !orderCancelled(selectedOrder)
            "
            type="primary"
            @click="acceptOrder(selectedOrder)"
            >{{ t("admin.supplierOrders.acceptAction") }}</el-button
          >
          <el-button
            v-else-if="
              canAction('btn:/admin/supplier-management/orders:progress') &&
              canOperateVisit(selectedOrder) &&
              serviceStep(selectedOrder) === 4
            "
            type="primary"
            @click="departForService(selectedOrder)"
            >{{ t("admin.supplierOrders.departAction") }}</el-button
          >
          <el-button
            v-else-if="
              canAction('btn:/admin/supplier-management/orders:progress') &&
              canOperateVisit(selectedOrder) &&
              serviceStep(selectedOrder) === 3
            "
            type="primary"
            @click="openServiceAction(selectedOrder, 'arrive')"
            >{{ t("admin.supplierOrders.arriveAction") }}</el-button
          >
          <el-button
            v-else-if="
              canAction('btn:/admin/supplier-management/orders:progress') &&
              canOperateVisit(selectedOrder) &&
              serviceStep(selectedOrder) === 1
            "
            type="primary"
            @click="openServiceAction(selectedOrder, 'complete')"
            >{{ t("admin.supplierOrders.completeAction") }}</el-button
          >
          <span
            v-else-if="!canAssignStaff(selectedOrder)"
            class="order-drawer-footer__done"
            ><CircleCheck />{{ t("admin.supplierOrders.noAction") }}</span
          >
        </div>
      </template>
    </el-drawer>

    <el-dialog
      v-model="assignStaffDialog.open"
      class="supplier-form-dialog"
      :title="t('admin.supplierOrders.assignStaffTitle')"
      width="min(520px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      append-to-body
    >
      <p class="assign-staff-hint">
        {{ assignStaffDialog.orderNo }} · {{ t("admin.supplierOrders.assignStaffHint") }}
      </p>
      <p v-if="!assignStaffDialog.loading && !assignStaffDialog.options.length">
        {{ t("admin.supplierOrders.assignStaffEmpty") }}
      </p>
      <el-select
        v-else
        v-model="assignStaffDialog.staffUserIds"
        multiple
        filterable
        :loading="assignStaffDialog.loading"
        :placeholder="t('admin.supplierOrders.assignStaffPlaceholder')"
        style="width: 100%"
      >
        <el-option
          v-for="person in assignStaffDialog.options"
          :key="person.adminUserId"
          :label="person.label"
          :value="person.adminUserId"
        />
      </el-select>
      <template #footer>
        <el-button @click="assignStaffDialog.open = false">{{
          t("admin.orders.actions.cancel")
        }}</el-button>
        <el-button
          v-if="canAction('btn:/admin/supplier-management/orders:assign')"
          type="primary"
          :loading="assignStaffDialog.saving"
          :disabled="assignStaffDialog.loading"
          @click="saveAssignStaff"
          >{{ t("admin.supplierOrders.assignStaff") }}</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      v-model="serviceAction.open"
      class="supplier-form-dialog service-action-dialog"
      :title="
        serviceAction.mode === 'arrive'
          ? t('admin.supplierOrders.arriveTitle')
          : t('admin.supplierOrders.completeTitle')
      "
      width="min(600px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="service-action__intro">
        <span>{{ t("admin.supplierOrders.assignedOrder") }}</span>
        <strong>{{ serviceAction.orderNo }}</strong>
        <p>{{ t("admin.supplierOrders.evidenceHint") }}</p>
      </div>
      <label class="service-action__note">
        <span>{{ t("admin.supplierOrders.remark") }}</span>
        <el-input
          v-model="serviceAction.remark"
          type="textarea"
          maxlength="512"
          show-word-limit
          :rows="3"
          :placeholder="t('admin.supplierOrders.remarkPlaceholder')"
        />
      </label>
      <div class="service-action__photos">
        <div>
          <strong>{{ t("admin.supplierOrders.photos") }}</strong>
          <small>{{ t("admin.supplierOrders.photosHint") }}</small>
        </div>
        <label class="service-action__pick">
          <input
            type="file"
            accept="image/*"
            multiple
            :disabled="serviceAction.uploading"
            @change="addServicePhotos"
          />
          {{ t("admin.supplierOrders.addPhoto") }}
        </label>
        <ul v-if="serviceAction.photos.length">
          <li v-for="(photo, index) in serviceAction.photos" :key="photo.url">
            <button
              type="button"
              :aria-label="photo.name"
              @click="openFilePreview(photo.url)"
            >
              <img :src="photo.url" :alt="photo.name" />
            </button>
            <span>{{ photo.name }}</span>
            <el-button
              link
              type="danger"
              @click="serviceAction.photos.splice(index, 1)"
              >{{ t("admin.supplierPricing.delete") }}</el-button
            >
          </li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="serviceAction.open = false">{{
          t("admin.supplierPricing.cancel")
        }}</el-button>
        <el-button
          type="primary"
          :loading="serviceAction.saving"
          :disabled="serviceAction.uploading"
          @click="submitServiceAction"
          >{{ t("admin.supplierOrders.confirm") }}</el-button
        >
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
      <SupplierDocumentPreview
        :url="filePreview.url"
        :name="filePreview.name"
        :kind="filePreview.kind"
        :active="filePreview.open"
      />
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { ElButton, ElMessage, ElMessageBox, ElNotification } from "element-plus"
import type { NotificationHandle } from "element-plus"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import AdminBreadcrumb from "@/modules/admin/components/AdminBreadcrumb.vue"
import SupplierDocumentPreview from "@/modules/admin/components/SupplierDocumentPreview.vue"
import {
  onboardingMine,
  onboardingResubmit,
  onboardingSave,
  serviceCommunityPage,
  exportQuoteSheet,
  importQuoteSheet,
  acknowledgeSupplierShelfNotices,
  saveQuoteDraft,
  savePackageQuoteDraft,
  saveSupplierPackages,
  acknowledgeSupplierPackageShelfNotices,
  supplierPackageQuotes,
  supplierQuoteShowOptionPrice,
  supplierPackageShelfNotices,
  supplierPackages,
  saveCategoryContacts,
  saveServiceContacts,
  supplierStaffPage,
  saveServices,
  serviceCatalog,
  removeSupplierService,
  submitQuote,
  applyQuotePriceChange,
  supplierAccept,
  supplierReject,
  assignOrderStaff,
  supplierArrive,
  supplierDepart,
  supplierAssignedOrderDetail,
  supplierAssignedOrders,
  supplierChangeAcceptDispatch,
  supplierChangeAcceptOrder,
  supplierOperationsMine,
  supplierCoverageSave,
  supplierComplete,
  supplierShelfNotices,
  uploadFile,
} from "@/modules/admin/api/supplierWorkbench"
import { supplierShelfNoticeUnread } from "@/modules/admin/utils/supplierShelfNotice"
import {
  packageVisitProgress,
  supplierMineCounts,
  supplierAttachEarning,
  supplierLineEarning,
  supplierOrderEarning,
  supplierOrderGroups,
  supplierOrderKind,
  supplierFulfillRemarks,
  supplierSpecSummary,
  materialHourServiceHours,
  materialHourStaffCount,
} from "@/modules/admin/utils/supplier-mine"
import { listBySpu, listSpuAttachCatalog } from "@/modules/admin/api/spu"
import SupplierAvailability from "@/modules/admin/pages/supplier-management/availability.vue"
import StaffBoard from "@/modules/admin/pages/supplier-management/staff-board.vue"
import { useAdminSessionStore } from "@/modules/admin/stores/session"
import { supplierOperationsApiEnabled } from "@/modules/admin/utils/features"
import { isSupplierStaffOrdersOnly, resolveAllowedAdminPath } from "@/modules/admin/utils/menuPermission"
import { pickI18nText } from "@/modules/admin/utils/i18n"
import { googleNavigateUrl } from "@/modules/admin/utils/supplierMap"
import {
  countCoverageStatuses,
  countSingleReviewStatus,
  countWorkspaceQuotes,
  optionMissingFields,
  positiveAmount,
  quoteActionKey,
  quotePriceView,
} from "@/modules/admin/utils/supplierPortal"
import { ibanValid, supplierOperationsReady, swiftValid } from "@/modules/admin/utils/supplierReviewState"
import {
  acceptBandName,
  countAcceptBands,
  quoteLineOutcome,
  type AcceptBandCounts,
  type QuoteLineOutcome,
} from "@/modules/admin/utils/quoteAcceptBand"
import {
  categoryIdPayload,
  isOtherService,
  listServiceCategories,
  serviceCategoryLabel,
  type ServiceCategoryOption,
} from "@/modules/client/api/supplier-onboarding"
import {
  DEFAULT_PHONE_DIAL,
  PHONE_DIAL_OPTIONS,
  joinPhone,
  nationalNumberOk,
  phoneDialLabel,
  splitPhone,
} from "@/utils/phone-dial"
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
  Phone,
  Plus,
  Present,
  Search,
  Tickets,
  Upload,
  UserFilled,
  Warning,
} from "@element-plus/icons-vue"

type Section =
  | "overview"
  | "profile"
  | "service-area"
  | "coverage-availability"
  | "staff"
  | "schedule"
  | "orders"
  | "pricing"
  | "package-pricing"
  | "settlement"
  | "availability"

const props = withDefaults(defineProps<{ section?: Section; mobile?: boolean }>(), {
  section: "overview",
  mobile: false,
})
const section = computed(() => props.section)
const packageMode = computed(() => section.value === "package-pricing")
const mobile = computed(() => props.mobile)
const router = useRouter()
const { t, locale } = useI18n({ useScope: "global" })
const mobileCopy = computed(() => locale.value.startsWith('zh')
  ? { company: '查看企业资料', filters: '筛选', previous: '上一步', continue: '下一步', submitReview: '提交审核', resubmitReview: '重新提交审核' }
  : { company: 'Company profile', filters: 'Filters', previous: 'Previous', continue: 'Continue', submitReview: 'Submit for review', resubmitReview: 'Resubmit for review' })
const mobileMenuAllowed = (target: string) => {
  const path = `/admin/supplier-management/${target}`
  return resolveAllowedAdminPath(path) === path
}
const mobileOrderFiltersOpen = ref(false)
const updateMobileOrderDate = (index: number, event: Event) => {
  const next = [...orderDateRange.value]
  next[index] = (event.target as HTMLInputElement).value
  orderDateRange.value = next.some(Boolean) ? [next[0] || '', next[1] || ''] : []
  searchOrders()
}

const pageMeta = {
  overview: {
    title: "数据与收益",
    description: "查看经营表现、收益趋势、服务容量与待处理事项。",
    primaryAction: "",
  },
  profile: {
    title: "Company Profile",
    description:
      "One page for company details, contact, capacity, and insurance.",
    primaryAction: "Submit for review",
  },
  "service-area": {
    title: "Service Area",
    description: "Areas and communities saved on the onboarding form.",
    primaryAction: "Manage service areas",
  },
  staff: {
    title: "人员管理",
    description: "维护人员角色、技能、默认工作时间、证件与可派状态。",
    primaryAction: "新增人员",
  },
  schedule: {
    title: "日程管理",
    description: "按日或周管理工作班次、休假、Block 与订单占用。",
    primaryAction: "添加班次 / Block",
  },
  orders: {
    title: "订单管理",
    description: "查看分配给当前供应商的订单、服务地点和生效报价。",
    primaryAction: "",
  },
  availability: {
    title: "可用时间",
    description: "可以接单的时间",
    primaryAction: "",
  },
  pricing: {
    title: "服务与报价",
    description: "先添加要提供的服务，再为列表里的服务报价。",
    primaryAction: "",
  },
  settlement: {
    title: "收益与结算",
    description: "核对订单收益、调整流水和付款批次。",
    primaryAction: "",
  },
} as const

const meta = computed(() => {
  if (section.value === "overview")
    return {
      title: t("admin.supplierPortal.workspaceTitle"),
      description: t("admin.supplierPortal.workspaceHint"),
      primaryAction: "",
    }
  if (section.value === "coverage-availability")
    return {
      title: t("admin.supplierPortal.coverage"),
      description: t("admin.supplierPortal.coverageHint"),
      primaryAction: "",
    }
  if (section.value === "pricing")
    return {
      title: t("admin.supplierPricing.title"),
      description: t("admin.supplierPricing.description"),
      primaryAction: "",
    }
  if (section.value === "package-pricing")
    return {
      title: t("admin.supplierPortal.packages"),
      description: t("admin.supplierPortal.packagesHint"),
      primaryAction: "",
    }
  if (section.value === "profile")
    return {
      title: t("admin.supplierProfile.title"),
      description: t("admin.supplierProfile.description"),
      primaryAction: "",
    }
  if (section.value === "orders")
    return {
      title: t("admin.supplierOrders.title"),
      description: t("admin.supplierOrders.description"),
      primaryAction: "",
    }
  if (section.value === "staff")
    return {
      title: t("admin.supplierStaff.title"),
      description: t("admin.supplierStaff.description"),
      primaryAction: "",
    }
  if (section.value === "availability")
    return {
      title: t("admin.supplierAvailability.title"),
      description: t("admin.supplierAvailability.description"),
      primaryAction: "",
    }
  if (section.value === "service-area")
    return {
      title: t("admin.supplierArea.title"),
      description: t("admin.supplierArea.description"),
      primaryAction: t("admin.supplierArea.manage"),
    }
  return pageMeta[section.value]
})
const profileStatusLabel = computed(() => {
  const keys = [
    "statusDraft",
    "statusSubmitted",
    "statusApproved",
    "statusRejected",
  ]
  const key =
    onboardingStatus.value == null
      ? "statusNone"
      : keys[onboardingStatus.value] || "statusNone"
  return t(`admin.supplierProfile.${key}`)
})
const profileStatusClass = computed(() => {
  if (onboardingStatus.value === 1) return "is-review"
  if (onboardingStatus.value === 2) return "is-approved"
  if (onboardingStatus.value === 3) return "is-rejected"
  if (onboardingStatus.value === 0) return "is-draft"
  return "is-none"
})
const session = useAdminSessionStore()
const supplierRecordId = ref<number | null>(null)
const supplierNo = ref("")
const onboardingStatus = ref<number | null>(null)
const profileEditable = ref(true)
const snapshotVersion = ref<number | null>(null)
const profileView = ref<"section" | "all">("section")
const profileSection = ref(0)
const profileFromAll = ref(false)
const profileBooted = ref(false)
const submitTried = ref(false)
const whatsappSame = ref(false)
const tradeLicenseFiles = ref<string[]>([])
const otherDocumentFiles = ref<string[]>([])
const vatCertificateFiles = ref<string[]>([])
const docUploadProgress = ref<Record<string, number>>({})
const docUploading = (id: string) => docUploadProgress.value[id] != null
const docUploadPercent = (id: string) => docUploadProgress.value[id] ?? 0
const uploadStatusText = (id: string) => {
  const percent = docUploadPercent(id)
  return percent > 0
    ? t("admin.supplierProfile.uploadingPercent", { percent })
    : t("admin.supplierProfile.uploading")
}
const setDocUploadProgress = (id: string, percent: number) => {
  docUploadProgress.value = { ...docUploadProgress.value, [id]: percent }
}
const clearDocUploadProgress = (id: string) => {
  if (docUploadProgress.value[id] == null) return
  const next = { ...docUploadProgress.value }
  delete next[id]
  docUploadProgress.value = next
}
const profileExtra = ref<Record<string, unknown>>({})
const independentOperationsReady = ref(false)
const profileSubmittedOpen = ref(false)
const documentNames = ref<Record<string, string>>({})
const needsResubmit = computed(
  () =>
    profileEditable.value &&
    (onboardingStatus.value === 2 || onboardingStatus.value === 3),
)
const profileReadOnly = computed(
  () => !profileEditable.value || profileView.value === "all",
)
const profileSections = computed(() => [
  {
    id: "company",
    title: companyForm.supplierType === 2
      ? t("admin.supplierProfile.personTitle")
      : t("admin.supplierPortal.companyDetails"),
    desc: companyForm.supplierType === 2
      ? t("admin.supplierProfile.personHint")
      : t("admin.supplierProfile.companyHint"),
  },
  {
    id: "contact",
    title: t("admin.supplierPortal.contactDetails"),
    desc: t("admin.supplierProfile.contactHint"),
  },
  {
    id: "capacity",
    title: t("admin.supplierPortal.capacity"),
    desc: t("admin.supplierProfile.capacityHint"),
  },
  {
    id: "bank",
    title: t("admin.supplierPortal.payouts"),
    desc: t("admin.supplierPortal.payoutsHint"),
  },
])
const activeProfileSection = computed(
  () => profileSections.value[profileSection.value] || profileSections.value[0],
)
const showProfileSection = (index: number) => {
  if (profileView.value === "all") return true
  if (index === 1) return profileSection.value === 0 || profileSection.value === 1
  return profileSection.value === index
}
const supplierEnabled = ref(false)
const supplierAcceptDispatch = ref(true)
const dispatchSaving = ref(false)
const acceptOrderSaving = ref<number | null>(null)
const removingServiceId = ref<number | null>(null)
const rejectReason = ref("")
const saving = ref(false)
const femaleStaffCount = ref(0)
const maleStaffCount = ref(0)
const wholeText = (value: number | null | undefined) =>
  value == null ? "" : String(value)
const wholeOrZero = (raw: string) => {
  const digits = raw.replace(/\D/g, "")
  return digits ? Number(digits) : 0
}
const ownTransportation = ref(false)
const scrollProfileTop = () => {
  const scroller = document.querySelector(".el-main") as HTMLElement | null
  scroller?.scrollTo({ top: 0, behavior: "smooth" })
}
const openProfileSection = (index: number) => {
  if (profileView.value === "all") profileFromAll.value = true
  profileSection.value = index === 1 ? 0 : index
  profileView.value = "section"
  scrollProfileTop()
}
const backToFullProfile = () => {
  profileFromAll.value = false
  profileView.value = "all"
  scrollProfileTop()
}
const profileNav = computed(() =>
  profileSections.value
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.id !== "contact"),
)
const adjacentProfileIndex = (step: number) => {
  const order = profileNav.value.map((item) => item.index)
  const current = profileSection.value === 1 ? 0 : profileSection.value
  const position = order.indexOf(current)
  if (position < 0) return undefined
  return order[position + step]
}
const moveProfileSection = (step: number) => {
  const next = adjacentProfileIndex(step)
  if (next == null) return
  profileSection.value = next
  scrollProfileTop()
}
const syncWhatsapp = () => {
  if (!whatsappSame.value) return
  companyForm.whatsappCode = companyForm.mobileCode
  companyForm.whatsapp = companyForm.mobile
}

const earningRange = ref("6m")
const earningBars = [
  { month: "Apr", value: 24.6, height: 54 },
  { month: "May", value: 27.8, height: 63 },
  { month: "Jun", value: 31.2, height: 72 },
  { month: "Jul", value: 29.5, height: 67 },
  { month: "Aug", value: 35.5, height: 83 },
  { month: "Sep", value: 38.4, height: 92 },
]
const recentTransactions = [
  {
    webOrder: "HX-260924-0186",
    jobId: "JOB-88421",
    service: "Regular Cleaning",
    amount: 224,
    date: "24 Sep",
  },
  {
    webOrder: "HX-260924-0179",
    jobId: "JOB-88408",
    service: "Split AC Cleaning",
    amount: 360,
    date: "24 Sep",
  },
  {
    webOrder: "HX-260923-0138",
    jobId: "JOB-88366",
    service: "Sofa Cleaning",
    amount: 250,
    date: "23 Sep",
  },
]
const goTo = (target: Section, query = router.currentRoute.value.query) =>
  router.push({
    path: `/admin/supplier-management/${mobile.value ? 'h5/' : ''}${target}`,
    query,
  })
const openPackageQuotes = () =>
  router.push({
    path: `/admin/supplier-management/${mobile.value ? 'h5/' : ''}package-pricing`,
    query: router.currentRoute.value.query,
  })
const continueProfileSetup = (target: Section) => {
  profileSubmittedOpen.value = false
  goTo(target)
}

const companyForm = reactive({
  supplierType: 1 as 1 | 2,
  fullName: "",
  dateOfBirth: "",
  nationality: "",
  residentialCity: "",
  companyName: "",
  licenseNo: "",
  licenseIssuedBy: "",
  licenseIssuedByOther: "",
  licenseExpiry: "",
  trn: "",
  years: 0,
  address: "",
  contact: "",
  email: "",
  mobileCode: DEFAULT_PHONE_DIAL,
  mobile: "",
  whatsappCode: DEFAULT_PHONE_DIAL,
  whatsapp: "",
})
const individualSupplier = computed(() => companyForm.supplierType === 2)
const profileDisplayName = computed(() =>
  String((individualSupplier.value ? companyForm.fullName : companyForm.companyName) || "").trim(),
)
watch([individualSupplier, section], () => {
  if (individualSupplier.value && section.value === "staff") goTo("overview")
})

const complianceItems = reactive([
  {
    key: "public",
    fileKey: "publicLiabilityInsuranceFile",
    labelKey: "publicLiability",
    enabled: false,
    files: [] as string[],
  },
  {
    key: "employee",
    fileKey: "employeeInsuranceFile",
    labelKey: "employeeInsurance",
    enabled: false,
    files: [] as string[],
  },
  { key: "tax", labelKey: "taxInvoice", enabled: false, files: [] as string[] },
  {
    key: "equipment",
    labelKey: "ownEquipment",
    enabled: false,
    files: [] as string[],
  },
])

const BANK_OTHER = "Other"
const UAE_BANKS = [
  "Emirates NBD",
  "Abu Dhabi Commercial Bank",
  "First Abu Dhabi Bank",
  "Dubai Islamic Bank",
  "Mashreq Bank",
  "Abu Dhabi Islamic Bank",
  "Commercial Bank of Dubai",
  "RAKBANK",
  "Sharjah Islamic Bank",
  "National Bank of Fujairah",
  BANK_OTHER,
]
const uaeBanks = UAE_BANKS
const bankForm = reactive({
  accountName: "",
  bankName: "",
  bankNameOther: "",
  iban: "",
  swift: "",
  currency: "AED",
})
const fileNameFromUrl = (url: string) => {
  if (documentNames.value[url]) return documentNames.value[url]
  let path = url.split("?")[0].split("#")[0]
  try {
    path = decodeURIComponent(path)
  } catch {
    /* Keep undecodable legacy URLs usable. */
  }
  const name = path.split("/").filter(Boolean).pop() || ""
  const extension = /\.[a-z0-9]{2,5}$/i.exec(name)?.[0] || ""
  if (/[a-f\d]{16,}|[a-f\d]{8}-[a-f\d-]{24,}|\d{13,}/i.test(name))
    return `${t("admin.supplierPortal.documentName")}${extension}`
  return name.length > 48
    ? `${name.slice(0, 38)}…${extension}`
    : name || t("admin.supplierPortal.documentName")
}

const fileKind = (url: string) => {
  const name = fileNameFromUrl(url).toLowerCase()
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return "image"
  if (name.endsWith(".pdf")) return "pdf"
  return "other"
}

const filePreview = reactive({
  open: false,
  url: "",
  name: "",
  kind: "other" as "image" | "pdf" | "other",
})

const openFilePreview = (url: string) => {
  filePreview.url = url
  filePreview.name = fileNameFromUrl(url)
  filePreview.kind = fileKind(url)
  filePreview.open = true
}

const asFileList = (value: unknown) => {
  if (Array.isArray(value))
    return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value !== "string" || !value.trim()) return []
  const text = value.trim()
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed))
        return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      return [text]
    }
  }
  return [text]
}

const policyDocuments = computed(() =>
  complianceItems
    .filter((item) => item.fileKey)
    .flatMap((item) =>
      item.files.map((url, index) => ({
        key: `${item.key}-${index}-${url}`,
        label: t(`admin.supplierProfile.${item.labelKey}`),
        name: fileNameFromUrl(url),
        url,
        kind: fileKind(url),
      })),
    ),
)

const capacityForm = reactive({
  workers: 0,
  leadTime: 0,
  start: "08:00",
  end: "18:00",
})
const capacityToggles = reactive([
  { key: "weekend", enabled: false },
  { key: "saturday", enabled: true },
  { key: "sunday", enabled: true },
  { key: "publicHoliday", enabled: false },
  { key: "sameDay", enabled: false },
  { key: "emergency", enabled: false },
])
const onCapacityToggle = (key: string, enabled: boolean) => {
  const item = capacityToggles.find((row) => row.key === key)
  if (!item) return
  item.enabled = enabled
  if (key === "saturday" || key === "sunday") {
    capacityToggles[0].enabled =
      capacityToggles[1].enabled || capacityToggles[2].enabled
    return
  }
  if (key !== "weekend") return
  const saturday = capacityToggles.find((row) => row.key === "saturday")
  const sunday = capacityToggles.find((row) => row.key === "sunday")
  if (saturday) saturday.enabled = enabled
  if (sunday) sunday.enabled = enabled
}

type StaffStatus = "available" | "busy" | "leave"
type StaffRow = {
  id: string
  name: string
  gender: string
  role: string
  employment: string
  workingDays: string
  workingHours: string
  mobile: string
  language: string
  skills: string[]
  zones: string[]
  docs: string
  status: StaffStatus
  color: string
}

const staffSkills = [
  "Cleaning",
  "Deep Cleaning",
  "AC Service",
  "Handyman",
  "Painting",
  "Beauty & Wellness",
]
const staff = ref<StaffRow[]>([
  {
    id: "STF-0042",
    name: "Amina Noor",
    gender: "Female",
    role: "Team Lead",
    employment: "Full-time",
    workingDays: "Mon–Fri",
    workingHours: "07:00–16:00",
    mobile: "+971 52 874 2210",
    language: "English · Arabic",
    skills: ["Cleaning", "Deep Cleaning"],
    zones: ["Z01", "Z02", "Z08"],
    docs: "Verified",
    status: "available",
    color: "#6c63d9",
  },
  {
    id: "STF-0038",
    name: "Ravi Kumar",
    gender: "Male",
    role: "Technician",
    employment: "Full-time",
    workingDays: "Sun–Thu",
    workingHours: "10:00–19:00",
    mobile: "+971 55 390 1184",
    language: "English · Hindi",
    skills: ["AC Service", "Handyman"],
    zones: ["Z03", "Z04", "Z05"],
    docs: "Verified",
    status: "busy",
    color: "#2c8b7b",
  },
  {
    id: "STF-0034",
    name: "Fatima Zahra",
    gender: "Female",
    role: "Specialist",
    employment: "Part-time",
    workingDays: "Tue–Sun",
    workingHours: "08:00–17:00",
    mobile: "+971 50 612 4473",
    language: "English · Urdu",
    skills: ["Cleaning", "Beauty & Wellness"],
    zones: ["Z01", "Z09"],
    docs: "Expiring",
    status: "available",
    color: "#d17a45",
  },
  {
    id: "STF-0029",
    name: "Arjun Singh",
    gender: "Male",
    role: "Technician",
    employment: "Full-time",
    workingDays: "Wed–Sun",
    workingHours: "10:00–19:00",
    mobile: "+971 56 338 9017",
    language: "English · Hindi",
    skills: ["Painting", "Handyman"],
    zones: ["Z05", "Z06", "Z07"],
    docs: "Verified",
    status: "leave",
    color: "#3976b8",
  },
  {
    id: "STF-0024",
    name: "Lina Santos",
    gender: "Female",
    role: "Cleaner",
    employment: "Full-time",
    workingDays: "Mon–Sat",
    workingHours: "07:00–16:00",
    mobile: "+971 54 480 2216",
    language: "English · Tagalog",
    skills: ["Deep Cleaning"],
    zones: ["Z02", "Z03", "Z04"],
    docs: "Verified",
    status: "busy",
    color: "#9b5e9d",
  },
  {
    id: "STF-0018",
    name: "Ahmed Nasser",
    gender: "Male",
    role: "Technician",
    employment: "Full-time",
    workingDays: "Sun–Thu",
    workingHours: "09:00–18:00",
    mobile: "+971 50 991 7625",
    language: "Arabic · English",
    skills: ["AC Service", "Handyman"],
    zones: ["Z08", "Z09", "Z10"],
    docs: "Expiring",
    status: "available",
    color: "#3d8e55",
  },
])
const staffKeyword = ref("")
const staffSkill = ref("")
const staffStatus = ref("")
const filteredStaff = computed(() =>
  staff.value.filter((person) => {
    const keyword = staffKeyword.value.trim().toLowerCase()
    const matchesKeyword =
      !keyword ||
      `${person.name} ${person.id} ${person.mobile}`
        .toLowerCase()
        .includes(keyword)
    return (
      matchesKeyword &&
      (!staffSkill.value || person.skills.includes(staffSkill.value)) &&
      (!staffStatus.value || person.status === staffStatus.value)
    )
  }),
)
const staffDialogVisible = ref(false)
const newStaff = reactive({
  name: "",
  id: "STF-0043",
  mobile: "",
  gender: "Female",
  role: "Cleaner",
  skill: "Cleaning",
})

const addStaff = () => {
  if (!newStaff.name.trim()) return ElMessage.warning("请输入人员姓名")
  staff.value.unshift({
    id: newStaff.id,
    name: newStaff.name,
    gender: newStaff.gender,
    role: newStaff.role,
    employment: "Full-time",
    workingDays: "Mon–Fri",
    workingHours: "08:00–17:00",
    mobile: newStaff.mobile || "+971 —",
    language: "English",
    skills: [newStaff.skill],
    zones: ["Z01"],
    docs: "Expiring",
    status: "available",
    color: "#5966b1",
  })
  staffDialogVisible.value = false
  ElMessage.success("Demo 人员已添加")
}

const staffStatusLabel = (status: StaffStatus) =>
  ({ available: "可派", busy: "服务中", leave: "休假" })[status]
const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

const scheduleSkill = ref("all")
const scheduleView = ref("week")
const weekDays = [
  { key: "mon", weekday: "周一", date: "09/21", orders: 18 },
  { key: "tue", weekday: "周二", date: "09/22", orders: 21 },
  { key: "wed", weekday: "周三", date: "09/23", orders: 24 },
  { key: "thu", weekday: "周四", date: "09/24", orders: 26, today: true },
  { key: "fri", weekday: "周五", date: "09/25", orders: 23 },
  { key: "sat", weekday: "周六", date: "09/26", orders: 31 },
  { key: "sun", weekday: "周日", date: "09/27", orders: 28 },
]
const schedulePeople = staff.value
  .slice(0, 5)
  .map((person) => ({
    id: person.id,
    name: person.name,
    color: person.color,
    skill: person.skills[0],
  }))
type Shift = { type: string; label?: string; time?: string; orders?: string }
const shifts: Record<string, Shift> = {
  "STF-0042-mon": {
    type: "standard",
    label: "早班",
    time: "07:00–16:00",
    orders: "3 orders",
  },
  "STF-0042-tue": {
    type: "standard",
    label: "早班",
    time: "07:00–16:00",
    orders: "4 orders",
  },
  "STF-0042-wed": {
    type: "busy",
    label: "长班",
    time: "07:00–19:00",
    orders: "6 orders",
  },
  "STF-0042-thu": {
    type: "standard",
    label: "早班",
    time: "07:00–16:00",
    orders: "4 orders",
  },
  "STF-0042-fri": {
    type: "standard",
    label: "早班",
    time: "07:00–16:00",
    orders: "3 orders",
  },
  "STF-0042-sat": {
    type: "leave",
    label: "休假",
    time: "Approved",
    orders: "",
  },
  "STF-0042-sun": { type: "open" },
  "STF-0038-mon": {
    type: "standard",
    label: "中班",
    time: "10:00–19:00",
    orders: "4 orders",
  },
  "STF-0038-tue": {
    type: "busy",
    label: "中班",
    time: "10:00–21:00",
    orders: "6 orders",
  },
  "STF-0038-wed": {
    type: "standard",
    label: "中班",
    time: "10:00–19:00",
    orders: "4 orders",
  },
  "STF-0038-thu": {
    type: "busy",
    label: "长班",
    time: "09:00–21:00",
    orders: "7 orders",
  },
  "STF-0038-fri": {
    type: "standard",
    label: "中班",
    time: "10:00–19:00",
    orders: "4 orders",
  },
  "STF-0038-sat": {
    type: "standard",
    label: "早班",
    time: "08:00–17:00",
    orders: "4 orders",
  },
  "STF-0038-sun": { type: "leave", label: "休息", time: "Day off", orders: "" },
  "STF-0034-mon": { type: "leave", label: "休息", time: "Day off", orders: "" },
  "STF-0034-tue": {
    type: "standard",
    label: "早班",
    time: "08:00–17:00",
    orders: "3 orders",
  },
  "STF-0034-wed": {
    type: "standard",
    label: "早班",
    time: "08:00–17:00",
    orders: "4 orders",
  },
  "STF-0034-thu": {
    type: "standard",
    label: "早班",
    time: "08:00–17:00",
    orders: "4 orders",
  },
  "STF-0034-fri": { type: "open" },
  "STF-0034-sat": {
    type: "busy",
    label: "长班",
    time: "09:00–21:00",
    orders: "7 orders",
  },
  "STF-0034-sun": {
    type: "busy",
    label: "长班",
    time: "09:00–21:00",
    orders: "6 orders",
  },
  "STF-0029-mon": {
    type: "leave",
    label: "年假",
    time: "Annual leave",
    orders: "",
  },
  "STF-0029-tue": {
    type: "leave",
    label: "年假",
    time: "Annual leave",
    orders: "",
  },
  "STF-0029-wed": {
    type: "leave",
    label: "年假",
    time: "Annual leave",
    orders: "",
  },
  "STF-0029-thu": { type: "open" },
  "STF-0029-fri": {
    type: "standard",
    label: "中班",
    time: "10:00–19:00",
    orders: "3 orders",
  },
  "STF-0029-sat": {
    type: "standard",
    label: "中班",
    time: "10:00–19:00",
    orders: "4 orders",
  },
  "STF-0029-sun": {
    type: "standard",
    label: "中班",
    time: "10:00–19:00",
    orders: "3 orders",
  },
  "STF-0024-mon": {
    type: "standard",
    label: "早班",
    time: "07:00–16:00",
    orders: "4 orders",
  },
  "STF-0024-tue": {
    type: "standard",
    label: "早班",
    time: "07:00–16:00",
    orders: "4 orders",
  },
  "STF-0024-wed": { type: "open" },
  "STF-0024-thu": {
    type: "standard",
    label: "早班",
    time: "07:00–16:00",
    orders: "4 orders",
  },
  "STF-0024-fri": {
    type: "busy",
    label: "长班",
    time: "07:00–19:00",
    orders: "6 orders",
  },
  "STF-0024-sat": {
    type: "busy",
    label: "长班",
    time: "07:00–19:00",
    orders: "7 orders",
  },
  "STF-0024-sun": { type: "leave", label: "休息", time: "Day off", orders: "" },
}
const shiftFor = (personId: string, day: string) =>
  shifts[`${personId}-${day}`] || { type: "open" }
const shiftDialogVisible = ref(false)
const shiftConflict = ref(false)
const shiftForm = reactive<{
  staff: string
  type: string
  date: string
  time: Date[]
  note: string
}>({ staff: "STF-0042", type: "shift", date: "2026-09-24", time: [], note: "" })
const openShift = (
  person: { id: string },
  day: { key: string; date: string },
) => {
  shiftForm.staff = person.id
  shiftForm.date = `2026-${day.date.replace("/", "-")}`
  shiftConflict.value = false
  shiftDialogVisible.value = true
}
const validateShift = () => {
  if (!shiftConflict.value && shiftForm.staff === "STF-0042") {
    shiftConflict.value = true
    return
  }
  shiftDialogVisible.value = false
  shiftConflict.value = false
  ElMessage.success("排班动作已保存")
}

const orderKeyword = ref("")
const orderServiceKeyword = ref("")
const orderCategory = ref<number | null>(null)
const orderDateRange = ref<string[]>([])
const orderDrawerVisible = ref(false)
const orderDetailLoading = ref(false)
const selectedOrder = ref<any>(null)
let orderDetailRequest = 0
const orderMoney = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—"
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : "—"
}
const visitIds = (row: any) => {
  const orderId = Number(row?.orderId)
  const fulfillmentId = Number(row?.fulfillmentId)
  return {
    orderId,
    ...(Number.isFinite(fulfillmentId) && fulfillmentId > 0
      ? { fulfillmentId }
      : {}),
  }
}
const assignedStaffText = (row: any) => {
  const list = Array.isArray(row?.assignedStaff) ? row.assignedStaff : []
  return list
    .map((item: any) => String(item?.name || item?.phone || "").trim())
    .filter(Boolean)
    .join("、")
}
const selectedAssignedStaff = () =>
  assignStaffDialog.staffUserIds
    .map((id) => {
      const person = assignStaffDialog.options.find(
        (item) => item.adminUserId === id,
      )
      const [name, phone] = String(person?.label || "").split(" · ")
      return {
        adminUserId: id,
        name: String(name || "").trim(),
        phone: String(phone || "").trim(),
      }
    })
    .filter((item) => item.adminUserId > 0)
const paintAssignedStaff = (
  staff: Array<{ adminUserId: number; name: string; phone: string }>,
) => {
  const orderId = assignStaffDialog.orderId
  const fulfillmentId = assignStaffDialog.fulfillmentId
  const matches = (item: any) => {
    if (Number(item?.orderId) !== orderId) return false
    if (!fulfillmentId) return true
    const current = Number(item?.fulfillmentId)
    return !current || current === fulfillmentId
  }
  supplierOrders.value = supplierOrders.value.map((item) =>
    matches(item) ? { ...item, assignedStaff: staff } : item,
  )
  if (selectedOrder.value && matches(selectedOrder.value)) {
    selectedOrder.value = { ...selectedOrder.value, assignedStaff: staff }
  }
}
const supplierOwnsOrders = () => !isSupplierStaffOrdersOnly()
const canOperateVisit = (row: any) =>
  (individualSupplier.value || !supplierOwnsOrders()) && !orderCancelled(row)
const canAssignStaff = (row: any) =>
  !individualSupplier.value &&
  supplierOwnsOrders() &&
  !orderCancelled(row) &&
  [1, 3, 4].includes(serviceStep(row)) &&
  Number(row?.orderId) > 0
const assignStaffDialog = reactive({
  open: false,
  saving: false,
  loading: false,
  orderId: 0,
  fulfillmentId: undefined as number | undefined,
  orderNo: "",
  staffUserIds: [] as number[],
  options: [] as { adminUserId: number; label: string }[],
})
const openAssignStaff = async (row: any) => {
  const ids = visitIds(row)
  if (!ids.orderId || !canAssignStaff(row)) return
  assignStaffDialog.orderId = ids.orderId
  assignStaffDialog.fulfillmentId = ids.fulfillmentId
  assignStaffDialog.orderNo = String(row?.orderNo || "")
  const current = Array.isArray(row?.assignedStaff) ? row.assignedStaff : []
  assignStaffDialog.staffUserIds = current
    .map((item: any) => Number(item?.adminUserId))
    .filter((id: number) => Number.isFinite(id) && id > 0)
  assignStaffDialog.open = true
  assignStaffDialog.loading = true
  try {
    const page = unwrap(await supplierStaffPage({ pageNum: 1, pageSize: 500 }))
    assignStaffDialog.options = (Array.isArray(page?.list) ? page.list : [])
      .filter(
        (item: any) =>
          item?.suspended !== true &&
          item?.suspended !== 1 &&
          item?.accountStatus !== "suspended",
      )
      .map((item: any) => ({
        adminUserId: Number(item?.adminUserId),
        label: [item?.name, item?.phone].filter(Boolean).join(" · "),
      }))
      .filter((item: { adminUserId: number }) => item.adminUserId > 0)
  } catch (error: any) {
    assignStaffDialog.options = []
    ElMessage.error(error?.message || t("admin.supplierStaff.loadFailed"))
  } finally {
    assignStaffDialog.loading = false
  }
}
const saveAssignStaff = async () => {
  if (!assignStaffDialog.orderId) return
  assignStaffDialog.saving = true
  const staff = selectedAssignedStaff()
  try {
    unwrap(
      await assignOrderStaff({
        orderId: assignStaffDialog.orderId,
        ...(assignStaffDialog.fulfillmentId
          ? { fulfillmentId: assignStaffDialog.fulfillmentId }
          : {}),
        staffUserIds: assignStaffDialog.staffUserIds,
      }),
    )
    ElMessage.success(t("admin.supplierOrders.assignStaffSaved"))
    assignStaffDialog.open = false
    paintAssignedStaff(staff)
    await loadOrders()
    if (
      orderDrawerVisible.value &&
      Number(selectedOrder.value?.orderId) === assignStaffDialog.orderId
    ) {
      await loadOrderDetail(
        assignStaffDialog.orderId,
        assignStaffDialog.fulfillmentId,
      )
    }
    const savedVisit = supplierOrders.value.find((item) => {
      if (Number(item?.orderId) !== assignStaffDialog.orderId) return false
      if (!assignStaffDialog.fulfillmentId) return true
      const current = Number(item?.fulfillmentId)
      return !current || current === assignStaffDialog.fulfillmentId
    })
    const detailMissing =
      selectedOrder.value &&
      Number(selectedOrder.value.orderId) === assignStaffDialog.orderId &&
      !assignedStaffText(selectedOrder.value)
    if (staff.length && ((savedVisit && !assignedStaffText(savedVisit)) || detailMissing)) {
      paintAssignedStaff(staff)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierOrders.actionFailed"))
  } finally {
    assignStaffDialog.saving = false
  }
}
const orderVisitKey = (row: any) => {
  const ids = visitIds(row)
  return `${ids.orderId}-${ids.fulfillmentId || row?.serviceDate || ""}-${row?.serviceTime || ""}`
}
const openAssignedOrder = (row: any) => {
  selectedOrder.value = row
  orderDrawerVisible.value = true
  const ids = visitIds(row)
  if (ids.orderId) loadOrderDetail(ids.orderId, ids.fulfillmentId)
}
const serviceStep = (row: any) => {
  const status = Number(row?.serviceStatus)
  return status === 1 || status === 2 || status === 3 || status === 4
    ? status
    : 0
}
const orderCancelled = (row: any) =>
  Number(row?.orderStatus) === 3 ||
  String(row?.supplierStage || "").toUpperCase() === "CANCELLED"
const orderRescheduleUnread = (row: any) =>
  row?.rescheduled === true && row?.rescheduleRead !== true
const serviceStatusText = (row: any) => {
  const localized = specText(row?.serviceStatusI18n)
  if (localized !== "—") return localized
  const status = serviceStep(row)
  if (status === 4) return t("admin.supplierOrders.accepted")
  if (status === 3) return t("admin.supplierOrders.departed")
  if (status === 1) return t("admin.supplierOrders.arrived")
  if (status === 2) return t("admin.supplierOrders.completed")
  return t("admin.supplierOrders.notStarted")
}
const serviceStatusTag = (status: unknown) => {
  const step = Number(status)
  if (step === 2) return "success"
  if (step === 4 || step === 1 || step === 3) return "warning"
  return "info"
}
const workbenchStatusText = (row: any) => {
  const localized = specText(row?.supplierStageI18n)
  if (localized !== "—") return localized
  const code = String(row?.supplierStage || "").toUpperCase()
  if (code === "NEW") return t("admin.supplierPortal.newRequests")
  if (code === "UPCOMING") return t("admin.supplierPortal.upcoming")
  if (code === "IN_PROGRESS") return t("admin.supplierPortal.inProgress")
  if (code === "COMPLETED") return t("admin.supplierPortal.completed")
  if (code === "CANCELLED") return t("admin.supplierPortal.cancelled")
  return serviceStatusText(row)
}
const workbenchStatusTag = (row: any) => {
  const code = String(row?.supplierStage || "").toUpperCase()
  if (code === "CANCELLED" || orderCancelled(row)) return "danger"
  if (code === "COMPLETED") return "success"
  if (code === "IN_PROGRESS" || code === "UPCOMING") return "warning"
  return code === "NEW" ? "info" : serviceStatusTag(row?.serviceStatus)
}
const orderClock = (value: unknown) => {
  if (value == null || value === "") return "—"
  const date =
    value instanceof Date
      ? value
      : new Date(typeof value === "number" ? value : String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const orderPhotos = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : []
const serviceAction = reactive({
  open: false,
  mode: "arrive" as "arrive" | "complete",
  orderId: 0,
  fulfillmentId: undefined as number | undefined,
  orderNo: "",
  remark: "",
  photos: [] as Array<{ name: string; url: string }>,
  uploading: false,
  saving: false,
})
const openServiceAction = (row: any, mode: "arrive" | "complete") => {
  const ids = visitIds(row)
  serviceAction.mode = mode
  serviceAction.orderId = ids.orderId
  serviceAction.fulfillmentId = ids.fulfillmentId
  serviceAction.orderNo = row.orderNo || ""
  serviceAction.remark = ""
  serviceAction.photos = []
  serviceAction.open = true
}
const addServicePhotos = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files || [])
  input.value = ""
  const room = 20 - serviceAction.photos.length
  if (room <= 0 || picked.length > room) {
    ElMessage.warning(t("admin.supplierOrders.photoLimit"))
    if (room <= 0) return
  }
  const batch = picked.slice(0, Math.max(room, 0))
  serviceAction.uploading = true
  try {
    for (const file of batch) {
      const uploaded = unwrap(await uploadFile(file))
      const url = typeof uploaded === "string" ? uploaded : uploaded?.url || ""
      if (url) serviceAction.photos.push({ name: file.name, url })
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierOrders.actionFailed"))
  } finally {
    serviceAction.uploading = false
  }
}
const rejectOrder = async (row: any) => {
  const ids = visitIds(row)
  if (!ids.orderId || orderCancelled(row) || serviceStep(row) !== 0) return
  let reason = ""
  try {
    const result = await ElMessageBox.prompt(
      t("admin.supplierOrders.rejectConfirm", {
        orderNo: row?.orderNo || ids.orderId,
      }),
      t("admin.supplierOrders.rejectTitle"),
      {
        type: "warning",
        confirmButtonText: t("admin.supplierOrders.rejectAction"),
        cancelButtonText: t("admin.orders.actions.cancel"),
        inputPlaceholder: t("admin.supplierOrders.rejectReasonPlaceholder"),
        inputValidator: (value) =>
          String(value || "").trim().length <= 512 ||
          t("admin.supplierOrders.rejectTooLong"),
      },
    )
    reason = String(result.value || "").trim()
  } catch {
    return
  }
  try {
    unwrap(await supplierReject({
      ...ids,
      ...(reason ? { rejectReason: reason } : {}),
    }))
    ElMessage.success(t("admin.supplierOrders.rejectSaved"))
    await loadOrders()
    if (
      orderDrawerVisible.value &&
      Number(selectedOrder.value?.orderId) === ids.orderId
    ) {
      orderDrawerVisible.value = false
      selectedOrder.value = null
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierOrders.actionFailed"))
  }
}
const acceptOrder = async (row: any) => {
  const orderId = Number(row?.orderId)
  if (!orderId || orderCancelled(row) || serviceStep(row) !== 0) return
  try {
    await ElMessageBox.confirm(
      t("admin.supplierOrders.acceptAssignConfirm", {
        orderNo: row?.orderNo || orderId,
      }),
      t("admin.supplierOrders.acceptTitle"),
      {
        type: "warning",
        confirmButtonText: t("admin.supplierOrders.acceptAction"),
      },
    )
  } catch {
    return
  }
  try {
    unwrap(await supplierAccept(visitIds(row)))
    ElMessage.success(t("admin.supplierOrders.acceptSaved"))
    await loadOrders()
    if (
      orderDrawerVisible.value &&
      Number(selectedOrder.value?.orderId) === orderId
    )
      await loadOrderDetail(orderId, visitIds(row).fulfillmentId)
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierOrders.actionFailed"))
  }
}
const departForService = async (row: any) => {
  const orderId = Number(row?.orderId)
  if (!orderId || orderCancelled(row) || serviceStep(row) !== 4) return
  try {
    await ElMessageBox.confirm(
      t("admin.supplierOrders.departConfirm", { orderNo: row.orderNo || "—" }),
      t("admin.supplierOrders.departTitle"),
    )
  } catch {
    return
  }
  orderLoading.value = true
  try {
    await supplierDepart(visitIds(row))
    ElMessage.success(t("admin.supplierOrders.departSaved"))
    await loadOrders()
    if (
      orderDrawerVisible.value &&
      Number(selectedOrder.value?.orderId) === orderId
    )
      await loadOrderDetail(orderId, visitIds(row).fulfillmentId)
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierOrders.actionFailed"))
  } finally {
    orderLoading.value = false
  }
}
const submitServiceAction = async () => {
  if (!serviceAction.orderId) return
  serviceAction.saving = true
  const payload = {
    orderId: serviceAction.orderId,
    ...(serviceAction.fulfillmentId
      ? { fulfillmentId: serviceAction.fulfillmentId }
      : {}),
    photos: serviceAction.photos.map((photo) => photo.url),
    remark: serviceAction.remark.trim() || null,
  }
  try {
    if (serviceAction.mode === "arrive") await supplierArrive(payload)
    else await supplierComplete(payload)
    ElMessage.success(
      t(
        serviceAction.mode === "arrive"
          ? "admin.supplierOrders.arriveSaved"
          : "admin.supplierOrders.completeSaved",
      ),
    )
    serviceAction.open = false
    await loadOrders()
    if (
      orderDrawerVisible.value &&
      Number(selectedOrder.value?.orderId) === serviceAction.orderId
    ) {
      await loadOrderDetail(serviceAction.orderId, serviceAction.fulfillmentId)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierOrders.actionFailed"))
  } finally {
    serviceAction.saving = false
  }
}

const quoteCategory = ref(
  String(router.currentRoute.value.query.category || "all"),
)
const quoteStatusFilter = ref("all")
const quoteScreen = ref<"setup" | "review" | "submitted">("setup")
const quoteConfirmed = ref(false)
const optionPriceQuery = ref("")
const optionPriceGroup = ref("")
const liveQuotes = ref<any[]>([])
const packageCatalog = ref<any[]>([])
const packageFlat = ref<any[]>([])
const packageNotices = ref<any[]>([])
const packageNoticeUnread = ref(false)
const packageNoticeAcking = ref(false)
const packageSaving = ref(false)
const packageBundle = reactive({
  active: false,
  saving: false,
  packageId: 0,
  quoteDesc: "",
  tab: "",
  sections: [] as any[],
})
const removingPackageId = ref<number | null>(null)
const packagePicker = reactive({
  open: false,
  categoryId: "" as number | "",
  keyword: "",
  checked: [] as number[],
})
const quoteDialog = reactive({
  visible: false,
  loading: false,
  saving: false,
  packageId: 0,
  spuId: 0,
  name: "",
  nameI18n: null as Record<string, unknown> | null,
  category: "",
  categoryI18n: null as Record<string, unknown> | null,
  status: undefined as number | undefined,
  submittedAt: "",
  rejectReason: "",
  priceEditable: true,
  canApplyPriceChange: false,
  priceChangeStatus: null as number | null,
  priceChangeReason: "",
  priceChangeRejectReason: "",
  quoteMode: null as 1 | 2 | 3 | 4 | null,
  modeReset: false,
  unitPrice: null as number | null,
  unitPriceWithMaterial: null as number | null,
  unitPriceWithoutMaterial: null as number | null,
  columns: [] as {
    key: string
    nameI18n: Record<string, unknown> | null
    fallback: string
  }[],
  rows: [] as any[],
  attachModuleTitle: "",
  onlyAddonPrice: false,
  supplierQuoteDesc: "",
  showOptionPrice: true,
  packageTimes: [] as number[],
  attaches: [] as Array<{
    attachValueId: number
    typeName: string
    typeNameI18n?: Record<string, unknown> | null
    name: string
    nameI18n?: Record<string, unknown> | null
    platformPrice: unknown
    approvedPrice: unknown
    offered: boolean
    quotePrice: string
    reviewStatus?: number
    rejectReason?: string
  }>,
})
const selectedAttachCount = computed(
  () => quoteDialog.attaches.filter((item) => item.offered).length,
)
const quoteAddonTitle = computed(() => {
  const title = quoteDialog.attachModuleTitle.trim()
  return title || t("admin.supplierPricing.addonStep")
})
const groupQuoteAttaches = <T extends { attachValueId: number; typeName?: string; typeNameI18n?: unknown; typeId?: number }>(
  items: T[],
) => {
  const groups: Array<{ key: string; label: string; items: T[] }> = []
  for (const item of items) {
    const label = attachDisplay(item, "type")
    const named = label && label !== "—" ? label : ""
    const key = item.typeId ? `type-${item.typeId}` : named || "addons"
    let group = groups.find((entry) => entry.key === key)
    if (!group) {
      group = { key, label: named, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}
const quoteAttachGroups = computed(() => groupQuoteAttaches(quoteDialog.attaches))
const offeredAttachGroups = computed(() =>
  groupQuoteAttaches(quoteDialog.attaches.filter((item) => item.offered)),
)
const addonOnlyQuote = computed(() => quoteDialog.onlyAddonPrice === true)
const zeroAddonSpecPrices = () => {
  if (!addonOnlyQuote.value) return
  for (const row of quoteDialog.rows) {
    if (row.available === false) continue
    row.quotePrice = 0
    row.enabled = true
  }
}
const quoteHasRejectedLines = computed(() =>
  quoteDialog.rows.some(
    (row) =>
      Number(row.reviewStatus) === 3 || String(row.rejectReason || "").trim(),
  ),
)
const quoteHasRejectedAttaches = computed(() =>
  quoteDialog.attaches.some(
    (item) =>
      Number(item.reviewStatus) === 3 || String(item.rejectReason || "").trim(),
  ),
)
const quoteEffectiveStatus = computed(() =>
  quoteDialog.rejectReason || quoteHasRejectedLines.value || quoteHasRejectedAttaches.value
    ? 3
    : quoteDialog.status,
)
const lineRejected = (row: { reviewStatus?: number | null; rejectReason?: string }) =>
  Number(row.reviewStatus) === 3 || Boolean(String(row.rejectReason || "").trim())
const quoteRevisionLocked = computed(() => Number(quoteDialog.status) === 1)
const quoteDirectEdit = computed(
  () =>
    Number(quoteDialog.status) === 3 ||
    Boolean(String(quoteDialog.rejectReason || "").trim()) ||
    quoteHasRejectedLines.value ||
    quoteHasRejectedAttaches.value,
)
const quoteReturned = computed(
  () =>
    Number(quoteDialog.status) === 3 ||
    (Boolean(String(quoteDialog.rejectReason || "").trim()) &&
      !quoteHasRejectedLines.value &&
      !quoteHasRejectedAttaches.value),
)
const quotePriceUnlocked = computed(
  () =>
    Number(quoteDialog.status) === 2 &&
    quoteDialog.priceEditable === true &&
    !quoteDirectEdit.value,
)
const quotePriceLocked = computed(
  () =>
    !quoteDialog.modeReset &&
    Number(quoteDialog.status) === 2 &&
    !quotePriceUnlocked.value &&
    !quoteDirectEdit.value &&
    Number(quoteDialog.priceChangeStatus) === 1,
)
const quoteCanRevise = computed(
  () =>
    !quoteDialog.modeReset &&
    Number(quoteDialog.status) === 2 &&
    !quotePriceLocked.value &&
    !quoteDirectEdit.value &&
    !quoteRevisionLocked.value,
)
const quotePartHeld = (row: {
  settled?: boolean
  reviewStatus?: number | null
  rejectReason?: string
}) => {
  if (quoteDialog.modeReset || quoteReturned.value || quotePriceUnlocked.value) return false
  if (quotePriceLocked.value) return true
  if (quoteRevisionLocked.value || quoteDirectEdit.value) return !lineRejected(row)
  return false
}
const attachHeld = (_item?: {
  settled?: boolean
  reviewStatus?: number | null
  rejectReason?: string
}) => quotePriceLocked.value
const quoteLineHeld = (row: {
  settled?: boolean
  reviewStatus?: number | null
  rejectReason?: string
}) => quotePartHeld(row)
const hourlyRateHeld = computed(() => {
  if (quoteDialog.modeReset || quoteReturned.value || quotePriceUnlocked.value || quoteDirectEdit.value) return false
  return quotePriceLocked.value || quoteRevisionLocked.value
})
const canRequestPriceChange = computed(
  () =>
    quotePriceLocked.value &&
    quoteDialog.canApplyPriceChange &&
    Number(quoteDialog.priceChangeStatus) !== 1,
)
const priceChangeOpen = ref(false)
const priceChangeReason = ref("")
const priceChangeSaving = ref(false)
const quoteUnderReview = computed(
  () => quoteRevisionLocked.value && !quoteDirectEdit.value,
)
const enabledQuoteRows = computed(() =>
  quoteDialog.rows.filter(
    (row) =>
      row.available !== false &&
      (hourlyQuote.value || row.enabled),
  ),
)
const quoteGroups = computed(() => {
  const groups: Array<{
    key: string
    type: string
    title: string
    rows: any[]
  }> = []
  const index = new Map<string, (typeof groups)[number]>()
  for (const row of quoteDialog.rows) {
    const key = String(row.groupId || "all")
    let group = index.get(key)
    if (!group) {
      group = {
        key,
        type: String(row.groupType || ""),
        title: String(row.groupValue || ""),
        rows: [],
      }
      index.set(key, group)
      groups.push(group)
    }
    group.rows.push(row)
  }
  return groups.length
    ? groups
    : [{ key: "all", type: "", title: "", rows: [] }]
})
const quoteGroupTab = ref("")
const quoteGroupTabs = computed(() => {
  const titled = quoteGroups.value.filter((group) => group.title && group.rows.length)
  const rest = quoteGroups.value
    .filter((group) => !group.title)
    .flatMap((group) => group.rows)
  const tabs = [...titled]
  if (rest.length && titled.length) {
    tabs.push({
      key: "rest",
      type: "",
      title: t("admin.supplierPricing.otherSpecs"),
      rows: rest,
    })
  }
  return tabs.length > 1 ? tabs : []
})
const quoteGroupType = computed(() => {
  const types = [
    ...new Set(quoteGroupTabs.value.map((group) => group.type).filter(Boolean)),
  ]
  return types.length === 1 ? types[0] : ""
})
const showQuoteGroupTabs = computed(() => quoteGroupTabs.value.length > 1)
const visibleQuoteGroups = computed(() => {
  if (!showQuoteGroupTabs.value) return quoteGroups.value
  const current =
    quoteGroupTabs.value.find((group) => group.key === quoteGroupTab.value) ||
    quoteGroupTabs.value[0]
  return current ? [current] : []
})
const visibleQuoteRows = computed(() =>
  visibleQuoteGroups.value.flatMap((group) => group.rows),
)
const selectableQuoteRows = computed(() =>
  visibleQuoteRows.value.filter(
    (row) => row.available !== false && !quoteLineHeld(row),
  ),
)
const reviewQuoteGroups = computed(() =>
  quoteGroups.value
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => row.available !== false),
    }))
    .filter((group) => group.rows.length),
)
const setQuotesEnabled = (enabled: boolean) => {
  for (const row of selectableQuoteRows.value) row.enabled = enabled
}
watch(quoteGroupTabs, (tabs) => {
  if (!tabs.some((group) => group.key === quoteGroupTab.value))
    quoteGroupTab.value = tabs[0]?.key || ""
})
const hourlyRateFields = [
  { key: 'unitPriceWithMaterial', label: 'admin.supplierPricing.rateWithMaterial' },
  { key: 'unitPriceWithoutMaterial', label: 'admin.supplierPricing.rateWithoutMaterial' },
] as const
const staffHourRateFields = [
  { key: 'unitPrice', label: 'admin.supplierPricing.rateLabel' },
] as const
const quantityRateFields = [
  { key: 'unitPrice', label: 'admin.supplierPricing.quantityRateLabel' },
] as const
const unitQuoteMode = (mode?: number | null) => mode === 2 || mode === 3 || mode === 4
const singleRateMode = (mode?: number | null) => mode === 3 || mode === 4
const hourlyQuote = computed(() => unitQuoteMode(quoteDialog.quoteMode))
const hourlyRuleKey = computed(() =>
  quoteDialog.quoteMode === 4
    ? 'admin.supplierPortal.quantityRule'
    : quoteDialog.quoteMode === 3
      ? 'admin.supplierPortal.staffHourRule'
      : 'admin.supplierPortal.hourlyRule',
)
const activeHourlyRateFields = computed(() =>
  quoteDialog.quoteMode === 4
    ? quantityRateFields
    : quoteDialog.quoteMode === 3
      ? staffHourRateFields
      : hourlyRateFields,
)
const hourlyRateProblem = (allowMissing = false) => {
  for (const rate of activeHourlyRateFields.value) {
    const value = quoteDialog[rate.key]
    if (allowMissing && value == null) continue
    if (!positiveAmount(value)) {
      return t('admin.supplierPricing.hourlyRateRequired', { name: t(rate.label) })
    }
  }
  return ''
}
const quoteContact = computed(() =>
  savedServices.value.find((service) => service.spuId === quoteDialog.spuId),
)
const quoteContactComplete = computed(() =>
  Boolean(
    quoteContact.value &&
    !contactProblem(
      quoteDialogTitle.value,
      quoteContact.value.workerCount,
      quoteContact.value.phones,
    ),
  ),
)
const quoteGaps = computed(() => {
  const gaps: Array<{
    kind: "mode" | "rate" | "price" | "addon" | "contact"
    groupKey: string
    groupTitle: string
    label: string
    targetId: string
  }> = []
  if (quoteDialog.quoteMode == null)
    gaps.push({
      kind: "mode",
      groupKey: "",
      groupTitle: "",
      label: "",
      targetId: "",
    })
  if (!addonOnlyQuote.value && hourlyQuote.value) {
    for (const rate of activeHourlyRateFields.value) {
      if (positiveAmount(quoteDialog[rate.key])) continue
      gaps.push({
        kind: "rate",
        groupKey: "",
        groupTitle: "",
        label: t(rate.label),
        targetId: rate.key,
      })
    }
  }
  if (!addonOnlyQuote.value && !hourlyQuote.value) {
    for (const row of enabledQuoteRows.value) {
      if (
        !optionMissingFields(
          row,
          quoteDialog.quoteMode,
          quoteDialog.unitPrice,
        ).includes("price")
      )
        continue
      gaps.push({
        kind: "price",
        groupKey: String(row.groupId || ""),
        groupTitle: String(row.groupValue || ""),
        label: String(row.lineLabel || quoteSpecLabel(row) || ""),
        targetId: String(row.skuId),
      })
    }
  }
  for (const item of quoteDialog.attaches) {
    if (!item.offered || positiveAmount(item.quotePrice)) continue
    gaps.push({
      kind: "addon",
      groupKey: "",
      groupTitle: "",
      label: attachDisplay(item, "name"),
      targetId: String(item.attachValueId),
    })
  }
  return gaps
})
const quoteMissingCount = computed(() => quoteGaps.value.length)
const quoteProgress = computed(() => {
  if (addonOnlyQuote.value) {
    const offered = quoteDialog.attaches.filter((item) => item.offered)
    const rows = offered.length ? offered : quoteDialog.attaches
    return {
      done: rows.filter((item) => positiveAmount(item.quotePrice)).length,
      total: rows.length,
    }
  }
  if (hourlyQuote.value) {
    const fields = activeHourlyRateFields.value
    return {
      done: fields.filter((rate) => positiveAmount(quoteDialog[rate.key])).length,
      total: fields.length,
    }
  }
  const rows = enabledQuoteRows.value
  return {
    done: rows.filter((row) => positiveAmount(row.quotePrice)).length,
    total: rows.length || quoteDialog.rows.length,
  }
})
const quoteGroupHasGap = (key: string) =>
  quoteGaps.value.some((gap) => gap.kind === "price" && gap.groupKey === key)
const quoteGapText = computed(() => {
  const gaps = quoteGaps.value
  const gap = gaps[0]
  if (!gap) return ""
  const name =
    gap.groupTitle && gap.label && gap.label !== gap.groupTitle
      ? `${gap.groupTitle} · ${gap.label}`
      : gap.groupTitle || gap.label
  if (gap.kind === "contact") return t("admin.supplierPortal.contactRequired")
  if (gap.kind === "rate") return t("admin.supplierPricing.hourlyRateRequired", { name: gap.label })
  if (gap.kind === "mode") return t("admin.supplierPricing.modeRequired")
  if (gap.kind === "addon")
    return t(
      gaps.filter((item) => item.kind === "addon").length > 1
        ? "admin.supplierPortal.missingAddons"
        : "admin.supplierPortal.missingAddon",
      { count: gaps.length, name: gap.label },
    )
  return t(
    gaps.length > 1
      ? "admin.supplierPortal.missingPrices"
      : "admin.supplierPortal.missingPrice",
    { count: gaps.length, name: name || t("admin.supplierPricing.specFallback") },
  )
})
const quoteReviewBlockReason = computed(() => {
  if (quoteUnderReview.value) return t("admin.supplierPricing.reviewNoticeHint")
  if (quotePriceLocked.value) return t("admin.supplierPricing.priceChangeHint")
  if (!enabledQuoteRows.value.length) return t("admin.supplierPortal.enableOne")
  if (quoteMissingCount.value) return quoteGapText.value
  return ""
})
const quoteGapFocusId = ref("")
const scrollToQuoteField = (selector: string) => {
  const node = document.querySelector(selector)
  if (!node || !("getBoundingClientRect" in node)) return
  const field = node.querySelector("input, textarea")
  const target =
    field && "getBoundingClientRect" in field && "focus" in field ? field : node
  const scroller = document.querySelector(".el-main")
  if (
    scroller &&
    "scrollTo" in scroller &&
    "getBoundingClientRect" in scroller
  ) {
    const scrollerBox = scroller.getBoundingClientRect()
    const targetBox = target.getBoundingClientRect()
    const top =
      scroller.scrollTop +
      targetBox.top -
      scrollerBox.top -
      (scroller.clientHeight - targetBox.height) / 2
    scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
  } else if ("scrollIntoView" in target) {
    target.scrollIntoView({ block: "center", behavior: "smooth" })
  }
  if ("focus" in target) target.focus({ preventScroll: true })
}
const focusQuoteGap = () => {
  const gap =
    quoteGaps.value.find((item) =>
      item.kind === "price" || item.kind === "rate" || item.kind === "addon",
    ) || quoteGaps.value[0]
  if (!gap) return
  quoteGapFocusId.value =
    gap.kind === "addon" ? `addon-${gap.targetId}` : gap.targetId
  if (gap.kind === "price" && gap.groupKey) quoteGroupTab.value = gap.groupKey
  nextTick(() => {
    const selector =
      gap.kind === "price"
        ? `[data-quote-sku="${gap.targetId}"]`
        : gap.kind === "addon"
          ? `[data-quote-addon="${gap.targetId}"]`
          : gap.kind === "rate"
            ? `[data-quote-rate="${gap.targetId}"]`
            : gap.kind === "contact"
              ? ".pricing-review-panel > button"
              : ".pricing-editor-section"
    scrollToQuoteField(selector)
  })
}

const settlementTab = ref("transactions")
const settlementRows = [
  {
    webOrder: "HX-260923-0138",
    jobId: "JOB-88366",
    date: "23 Sep",
    service: "Sofa Cleaning",
    staff: "Fatima Zahra",
    base: 250,
    adjustment: 0,
    payable: 250,
    status: "Pending",
    batch: "PAY-2609-03",
  },
  {
    webOrder: "HX-260922-0112",
    jobId: "JOB-88321",
    date: "22 Sep",
    service: "Deep Cleaning – 2BR",
    staff: "Amina + Lina",
    base: 420,
    adjustment: -180,
    payable: 240,
    status: "Pending",
    batch: "PAY-2609-03",
  },
  {
    webOrder: "HX-260920-0098",
    jobId: "JOB-88274",
    date: "20 Sep",
    service: "Split AC Cleaning",
    staff: "Ravi Kumar",
    base: 360,
    adjustment: 0,
    payable: 360,
    status: "Paid",
    batch: "PAY-2609-02",
  },
  {
    webOrder: "HX-260919-0071",
    jobId: "JOB-88233",
    date: "19 Sep",
    service: "Regular Cleaning",
    staff: "Amina Noor",
    base: 224,
    adjustment: 0,
    payable: 224,
    status: "Paid",
    batch: "PAY-2609-02",
  },
]
const payoutBatches = [
  {
    batch: "PAY-2609-03",
    period: "21–30 Sep 2026",
    orders: 42,
    amount: "12,680",
    paidAt: "30 Sep 2026",
    status: "Pending",
  },
  {
    batch: "PAY-2609-02",
    period: "11–20 Sep 2026",
    orders: 48,
    amount: "14,920",
    paidAt: "22 Sep 2026",
    status: "Paid",
  },
  {
    batch: "PAY-2609-01",
    period: "01–10 Sep 2026",
    orders: 36,
    amount: "10,820",
    paidAt: "12 Sep 2026",
    status: "Paid",
  },
]

const showToast = (message: string) => ElMessage.success(message)

type SupplierArea = { areaId: number; areaName: string; status?: number }
type AreaCommunity = { id: number; name: string }
type AreaZone = { id: number; name: string }
const platformAreas = ref<any[]>([])
const supplierAreas = ref<SupplierArea[]>([])
const dispatchOperationsReady = computed(() => {
  const id = supplierRecordId.value
  if (!id) return false
  const key = String(id)
  const quotes = session.quotes[key]
  const packageQuotes = session.packageQuotes[key]
  if (!quotes || !packageQuotes) return false
  return supplierOperationsReady({
    quotes,
    packageQuotes,
    areas: supplierAreas.value,
  })
})
const selectedAreaIds = ref<number[]>([])
const coveredCommunityIds = ref<number[] | null>(null)
const draftCommunityIds = ref<number[]>([])
const draftBareAreaIds = ref<number[]>([])
const expandedAreaIds = ref<number[]>([])
const areaKeyword = ref("")
const areaEditorVisible = ref(false)
const editorLoading = ref(false)
const areaCatalogReady = ref(false)
const communitiesByArea = ref<Record<number, AreaCommunity[]>>({})
const servicesProvided = ref("")
const expectedServiceIds = ref<string[]>([])
const expectedServicesKnown = ref(false)
const expectedServiceRemark = ref("")
const expectedCategoryLabels = ref<Record<string, string>>({})
const offeredCategoryOptions = ref<ServiceCategoryOption[]>([])
const expectedServiceNameList = computed(() =>
  expectedServiceIds.value
    .map((id) => expectedCategoryLabels.value[id] || id)
    .filter(Boolean),
)
const otherServiceSelected = computed(() =>
  offeredCategoryOptions.value.some(
    (option) =>
      expectedServiceIds.value.includes(option.categoryId) &&
      isOtherService(option),
  ),
)
const loadServiceCategoryOptions = async () => {
  try {
    const options = await listServiceCategories()
    offeredCategoryOptions.value = options
    const labels: Record<string, string> = {}
    options.forEach((option) => {
      labels[option.categoryId] = serviceCategoryLabel(
        option,
        String(locale.value || "zh"),
      )
    })
    expectedCategoryLabels.value = labels
  } catch (error: any) {
    offeredCategoryOptions.value = []
    ElMessage.error(
      error?.message || t("admin.supplierProfile.noSelectedServices"),
    )
  }
}
const toggleExpectedService = (option: ServiceCategoryOption) => {
  if (profileReadOnly.value) return
  expectedServicesKnown.value = true
  if (expectedServiceIds.value.includes(option.categoryId)) {
    expectedServiceIds.value = expectedServiceIds.value.filter(
      (id) => id !== option.categoryId,
    )
    if (isOtherService(option)) expectedServiceRemark.value = ""
    return
  }
  expectedServiceIds.value = [...expectedServiceIds.value, option.categoryId]
}
const applyExpectedServices = (detail: any) => {
  const raw = detail?.expectedServiceCategoryIds
  if (!Array.isArray(raw)) {
    expectedServicesKnown.value = false
    expectedServiceIds.value = []
    expectedServiceRemark.value = ""
    return
  }
  expectedServicesKnown.value = true
  expectedServiceIds.value = raw.map((id: unknown) => String(id))
  expectedServiceRemark.value = String(detail?.expectedServiceRemark || "")
}
const dubaiServiceAreas = ref("")
const emaarOnboarded = ref<0 | 1>(0)
const nakheelOnboarded = ref<0 | 1>(0)
const dubaiHoldingsOnboarded = ref<0 | 1>(0)
const wearUniform = ref<0 | 1 | null>(null)
const otherCommunityOnboarded = ref<0 | 1>(0)
const applyRenmark = ref("")
const asYesNo = (value: unknown): 0 | 1 => (Number(value) === 1 ? 1 : 0)
type CommunityKey =
  | "emaarOnboarded"
  | "nakheelOnboarded"
  | "dubaiHoldingsOnboarded"
  | "otherCommunityOnboarded"
const communityState: Record<CommunityKey, typeof emaarOnboarded> = {
  emaarOnboarded,
  nakheelOnboarded,
  dubaiHoldingsOnboarded,
  otherCommunityOnboarded,
}
const communityChips = computed(() => [
  {
    key: "emaarOnboarded" as const,
    label: "Emaar",
    value: emaarOnboarded.value,
  },
  {
    key: "nakheelOnboarded" as const,
    label: "Nakheel",
    value: nakheelOnboarded.value,
  },
  {
    key: "dubaiHoldingsOnboarded" as const,
    label: "Dubai Holdings",
    value: dubaiHoldingsOnboarded.value,
  },
  {
    key: "otherCommunityOnboarded" as const,
    label: t("admin.supplierProfile.otherChip"),
    value: otherCommunityOnboarded.value,
  },
])
const toggleCommunity = (key: CommunityKey) => {
  if (profileReadOnly.value) return
  const next: 0 | 1 = communityState[key].value === 1 ? 0 : 1
  communityState[key].value = next
  if (key === "otherCommunityOnboarded" && next !== 1) applyRenmark.value = ""
}
const LICENSE_AUTHORITY_OTHER = "Other (type the authority name)"
const LICENSE_AUTHORITIES = [
  {
    emirate: "Abu Dhabi",
    items: [
      "Abu Dhabi Department of Economic Development",
      "Abu Dhabi Global Market",
      "Khalifa Economic Zones Abu Dhabi",
      "Masdar City Free Zone",
      "twofour54 (Abu Dhabi media zone)",
      "Abu Dhabi Airports Free Zone",
    ],
  },
  {
    emirate: "Dubai",
    items: [
      "Dubai Department of Economy and Tourism (formerly DED)",
      "Dubai Multi Commodities Centre",
      "Jebel Ali Free Zone",
      "Dubai Airport Freezone",
      "Dubai Silicon Oasis",
      "Dubai CommerCity",
      "International Free Zone Authority",
      "Meydan Free Zone",
      "Dubai South Free Zone",
      "Dubai World Trade Centre Free Zone",
      "Dubai International Financial Centre",
      "Dubai Healthcare City Authority",
      "Dubai Development Authority (TECOM free zones)",
      "Dubai Maritime City",
      "International Humanitarian City",
      "Expo City Dubai Free Zone",
      "Jebel Ali Free Zone Offshore",
    ],
  },
  {
    emirate: "Sharjah",
    items: [
      "Sharjah Economic Development Department",
      "Sharjah Airport International Free Zone",
      "Hamriyah Free Zone",
      "Sharjah Media City",
      "Sharjah Publishing City Free Zone",
      "Sharjah Research, Technology and Innovation Park",
      "Sharjah Healthcare City",
    ],
  },
  {
    emirate: "Ajman",
    items: [
      "Ajman Department of Economic Development",
      "Ajman Free Zone",
      "Ajman Media City Free Zone",
      "Ajman NuVentures Centre Free Zone",
    ],
  },
  {
    emirate: "Umm Al Quwain",
    items: [
      "Umm Al Quwain Department of Economic Development",
      "Umm Al Quwain Free Trade Zone",
    ],
  },
  {
    emirate: "Ras Al Khaimah",
    items: [
      "Ras Al Khaimah Department of Economic Development",
      "Ras Al Khaimah Economic Zone",
      "RAK Digital Assets Oasis",
      "RAK Maritime City Free Zone",
      "RAK International Corporate Centre",
    ],
  },
  {
    emirate: "Fujairah",
    items: [
      "Fujairah Department of Industry and Economy",
      "Fujairah Free Zone",
      "Fujairah Creative City Free Zone",
    ],
  },
  {
    emirate: "Other",
    items: [LICENSE_AUTHORITY_OTHER],
  },
]
const licenseAuthorities = LICENSE_AUTHORITIES
const licenseAuthorityValues = new Set(
  LICENSE_AUTHORITIES.flatMap((group) => group.items),
)
const onLicenseAuthorityChange = () => {
  if (companyForm.licenseIssuedBy !== LICENSE_AUTHORITY_OTHER)
    companyForm.licenseIssuedByOther = ""
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
  contactName: string
  contactPhones: string[]
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
  available?: boolean
}
type PickerService = CatalogServiceDraft & {
  categoryId: number
  categoryName: string
  categoryNameI18n: Record<string, unknown> | null
  added: boolean
}

const catalogDraft = ref<CatalogGroupDraft[]>([])
const savedServices = ref<SavedService[]>([])
const savedCategoryPhoneKeys = ref(new Map<number, string>())
const categoryPhoneSaving = ref<Record<number, boolean>>({})
const phoneListKey = (phones: string[]) =>
  phones
    .map((phone) => phone.trim())
    .filter(Boolean)
    .join("|")
const categoryContactKey = (name: string, phones: string[]) =>
  `${name.trim()}\n${phoneListKey(phones)}`
watch(() => [companyForm.mobile, companyForm.mobileCode], syncWhatsapp)
const availabilityServices = computed(() => {
  const byId = new Map<number, { spuId: number; name: string }>()
  for (const quote of liveQuotes.value || []) {
    const spuId = Number(quote?.spuId)
    if (!spuId) continue
    const i18n =
      quote?.nameI18n && typeof quote.nameI18n === "object"
        ? quote.nameI18n
        : null
    byId.set(spuId, {
      spuId,
      name:
        pickI18nText(i18n, locale.value, "") || String(quote?.spuName || ""),
    })
  }
  for (const service of savedServices.value) {
    if (byId.has(service.spuId)) continue
    byId.set(service.spuId, {
      spuId: service.spuId,
      name: pickI18nText(service.spuNameI18n, locale.value, "") || service.name,
    })
  }
  return [...byId.values()]
})
const availabilityAreas = computed(() =>
  supplierAreas.value.map((area) => ({
    areaId: area.areaId,
    areaName: area.areaName,
  })),
)
const catalogLoading = ref(false)
const catalogSaving = ref(false)
const quoteLoading = ref(false)
const quoteExporting = ref(false)
const quoteImporting = ref(false)
const quoteFileInput = ref<HTMLInputElement | null>(null)
const addedKeyword = ref("")
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
  categoryId: "" as number | "",
  keyword: "",
  drafts: [] as PickedDraft[],
})
const serviceEditor = reactive({
  open: false,
  spuId: 0,
  categoryId: 0,
  name: "",
  nameI18n: null as Record<string, unknown> | null,
  workerCount: null as number | null,
  phones: [""],
})
const flattenSelected = (groups: CatalogGroupDraft[]): SavedService[] =>
  groups.flatMap((group) =>
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
        phones: service.contactPhones
          .map((phone) => phone.trim())
          .filter(Boolean),
        acceptOrder: service.acceptOrder === 0 ? 0 : 1,
        available: service.available !== false,
      })),
  )

const otherCatalogGroup = (group: any) => {
  if (Number(group?.categoryId) === 0 || group?.other === true) return true
  const names = [
    group?.categoryName,
    ...(group?.nameI18n && typeof group.nameI18n === "object"
      ? Object.values(group.nameI18n)
      : []),
  ]
  return names.some((name) => {
    const text = String(name || "").trim()
    return text === "其他" || text.toLowerCase() === "other"
  })
}
const mapCatalog = (groups: any[]): CatalogGroupDraft[] =>
  (groups || [])
    .filter((group) => !otherCatalogGroup(group))
    .map((group) => ({
    categoryId: Number(group.categoryId),
    categoryName:
      group.categoryName || t("admin.supplierPricing.uncategorized"),
    categoryNameI18n:
      group.nameI18n && typeof group.nameI18n === "object"
        ? group.nameI18n
        : null,
    available: group.available !== false,
    contactName: String(group.contactName || "").trim(),
    contactPhones: (() => {
      const phones = Array.isArray(group.contactPhones)
        ? group.contactPhones
            .map((phone: unknown) => String(phone || "").trim())
            .filter(Boolean)
        : []
      return phones.length ? phones : [""]
    })(),
    services: (group.services || [])
      .filter((service: any) => Number(service?.packageService) !== 1)
      .map((service: any) => {
      const selected = Boolean(service.selected)
      const phones = Array.isArray(service.contactPhones)
        ? service.contactPhones.map((phone: unknown) => String(phone || ""))
        : []
      return {
        spuId: Number(service.spuId),
        spuName:
          service.spuName ||
          t("admin.supplierPricing.serviceNamed", { id: service.spuId }),
        spuNameI18n:
          service.nameI18n && typeof service.nameI18n === "object"
            ? service.nameI18n
            : null,
        available: service.available !== false,
        selected,
        workerCount:
          service.workerCount == null || service.workerCount === ""
            ? null
            : Number(service.workerCount),
        contactPhones: selected && !phones.length ? [""] : phones,
        acceptOrder: Number(service.acceptOrder) === 0 ? 0 : 1,
      }
    }),
  }))
    .filter((group) => group.services.length)

const rememberCatalog = (groups: CatalogGroupDraft[]) => {
  catalogDraft.value = groups
  savedServices.value = flattenSelected(groups)
  savedCategoryPhoneKeys.value = new Map(
    groups.map((group) => [
      group.categoryId,
      categoryContactKey(group.contactName, group.contactPhones),
    ]),
  )
}

const localizedCategory = (
  name: string,
  i18n?: Record<string, unknown> | null,
) => pickI18nText(i18n || undefined, locale.value, "") || name
const serviceTitle = (name: string, i18n?: Record<string, unknown> | null) =>
  pickI18nText(i18n || undefined, locale.value, "") || name
const serviceHaystack = (
  name: string,
  i18n?: Record<string, unknown> | null,
) => {
  const extra = i18n
    ? Object.values(i18n)
        .filter((value): value is string => typeof value === "string")
        .join(" ")
    : ""
  return `${name} ${serviceTitle(name, i18n)} ${extra}`.toLowerCase()
}
const quoteForService = (spuId: number) =>
  liveQuotes.value.find((quote) => Number(quote?.spuId) === spuId)
const serviceListed = (service: { spuId: number; available?: boolean }) => {
  if (service.available === false) return false
  const quote = quoteForService(service.spuId)
  return !quote || quote.available !== false
}
const packageChoices = (group: any) =>
  (Array.isArray(group?.packages) ? group.packages : []).filter(
    (item: any) => item?.available !== false && Number(item?.packageId) > 0,
  )
const serviceCategoryOptions = computed(() => {
  const seen = new Set<number>()
  if (packageMode.value) {
    const options: Array<{ id: number; label: string; phones: string[]; contactName: string }> = []
    const push = (categoryId: number, label: string) => {
      if (!categoryId || seen.has(categoryId)) return
      seen.add(categoryId)
      options.push({ id: categoryId, label, phones: [""], contactName: "" })
    }
    for (const entry of packageFlat.value) {
      const categoryId = Number(entry?.categoryId)
      if (!categoryId || entry?.service?.available === false) continue
      push(categoryId, localizedCategory(entry.categoryName || "", entry.categoryNameI18n))
    }
    for (const group of packageCatalog.value) {
      if (group?.available === false || !packageChoices(group).length) continue
      push(
        Number(group?.categoryId),
        localizedCategory(String(group?.categoryName || ""), group?.nameI18n),
      )
    }
    return options
  }
  return savedServices.value.flatMap((service) => {
    if (!serviceListed(service) || seen.has(service.categoryId)) return []
    seen.add(service.categoryId)
    const group = catalogDraft.value.find(
      (item) => item.categoryId === service.categoryId,
    )
    return [
      {
        id: service.categoryId,
        label: localizedCategory(service.category, service.categoryNameI18n),
        phones: group?.contactPhones || [""],
        contactName: group?.contactName || "",
      },
    ]
  })
})
const selectedPricingCategory = computed(
  () =>
    serviceCategoryOptions.value.find(
      (category) => category.id === Number(quoteCategory.value),
    )?.label || t("admin.supplierPortal.categoryPanel"),
)
const pricingCategoryLinked = computed(() =>
  serviceCategoryOptions.value.some(
    (category) => category.id === Number(quoteCategory.value),
  ),
)
const packageCountByCategory = computed(() => {
  const counts = new Map<number, number>()
  for (const group of packageCatalog.value) {
    const categoryId = Number(group?.categoryId)
    const count = packageChoices(group).length
    if (categoryId && count) counts.set(categoryId, count)
  }
  return counts
})
const categoryBadgeCount = (categoryId: number) => {
  const services = serviceRows.value.filter((row) => row.categoryId === categoryId).length
  if (!packageMode.value || services) return services
  return packageCountByCategory.value.get(categoryId) || 0
}
const packageCatalogChoices = computed(() =>
  packageCatalog.value.some((group) => packageChoices(group).length > 0),
)
const offeredPackages = computed(() => {
  if (!packageMode.value) return []
  const categoryId = Number(quoteCategory.value)
  const selected = new Set(currentPackageIds())
  const group = packageCatalog.value.find((item) => Number(item?.categoryId) === categoryId)
  return packageChoices(group).flatMap((item: any) => {
    const packageId = Number(item.packageId)
    if (selected.has(packageId)) return []
    return [{
      packageId,
      name: String(item.packageName || ""),
      nameI18n: item.nameI18n && typeof item.nameI18n === "object" ? item.nameI18n : null,
    }]
  })
})
const mobilePricingCategory = computed(() => serviceCategoryOptions.value.find(category => category.id === Number(quoteCategory.value)))
watch(
  serviceCategoryOptions,
  (categories) => {
    if (
      categories.length &&
      !categories.some(
        (category) => category.id === Number(quoteCategory.value),
      )
    )
      quoteCategory.value = String(categories[0].id)
  },
  { immediate: true },
)
const pickKey = (service: { categoryId: number; spuId: number }) =>
  `${service.categoryId}:${service.spuId}`
const addedKeys = computed(
  () => new Set(savedServices.value.map((service) => pickKey(service))),
)
const pickerCategoryId = computed(() => {
  const value = servicePicker.categoryId as number | "" | null | undefined
  return value === "" || value == null ? null : Number(value)
})
const pickerReady = computed(
  () =>
    pickerCategoryId.value != null || servicePicker.keyword.trim().length > 0,
)
const pickerCategories = computed(() =>
  catalogDraft.value.filter(
    (group) =>
      group.available !== false &&
      group.services.some((service) => service.available),
  ),
)
const packagePickerRows = computed(() => {
  const keyword = packagePicker.keyword.trim().toLowerCase()
  const categoryId = packagePicker.categoryId === "" ? null : Number(packagePicker.categoryId)
  const rows: Array<{
    packageId: number
    name: string
    nameI18n: Record<string, unknown> | null
    categoryName: string
    categoryNameI18n: Record<string, unknown> | null
  }> = []
  for (const group of packageCatalog.value) {
    if (categoryId != null && Number(group?.categoryId) !== categoryId) continue
    for (const item of Array.isArray(group?.packages) ? group.packages : []) {
      if (item?.available === false) continue
      const name = String(item?.packageName || "")
      const nameI18n = item?.nameI18n && typeof item.nameI18n === "object" ? item.nameI18n : null
      const extra = nameI18n ? Object.values(nameI18n).filter((value) => typeof value === "string").join(" ") : ""
      if (keyword && !`${name} ${extra}`.toLowerCase().includes(keyword)) continue
      rows.push({
        packageId: Number(item.packageId),
        name,
        nameI18n,
        categoryName: String(group?.categoryName || ""),
        categoryNameI18n: group?.nameI18n && typeof group.nameI18n === "object" ? group.nameI18n : null,
      })
    }
  }
  return rows.filter((row) => Number.isInteger(row.packageId) && row.packageId > 0)
})
const pickerVisible = computed(() => {
  if (!pickerReady.value) return [] as PickerService[]
  const keyword = servicePicker.keyword.trim().toLowerCase()
  const rows: PickerService[] = []
  catalogDraft.value.forEach((group) => {
    if (group.available === false) return
    if (
      pickerCategoryId.value != null &&
      group.categoryId !== pickerCategoryId.value
    )
      return
    group.services.forEach((service) => {
      if (!service.available) return
      if (
        keyword &&
        !serviceHaystack(service.spuName, service.spuNameI18n).includes(keyword)
      )
        return
      rows.push({
        ...service,
        categoryId: group.categoryId,
        categoryName: group.categoryName,
        categoryNameI18n: group.categoryNameI18n,
        added: addedKeys.value.has(
          pickKey({ categoryId: group.categoryId, spuId: service.spuId }),
        ),
      })
    })
  })
  return rows
})
const draftOf = (service: { categoryId: number; spuId: number }) =>
  servicePicker.drafts.find((item) => item.key === pickKey(service))
const packagePriceList = (quote: any) =>
  (quote?.skus || [])
    .filter((line: any) => Number(line.enabled ?? 1) !== 0)
    .map((line: any) => Number(line.approvedPrice ?? line.quotePrice))
    .filter((price: number) => Number.isFinite(price) && price > 0)
const packageTimesFor = (contents: any[], spuId: number) =>
  (Array.isArray(contents) ? contents : []).flatMap((item) => {
    if (Number(item?.spuId) !== spuId) return []
    const count = Number(item?.redeemTimes)
    return Number.isInteger(count) && count > 0 ? [count] : []
  })
const serviceRows = computed(() => {
  if (packageMode.value) {
    return packageFlat.value.flatMap((entry) => {
      const quote = entry?.service
      const spuId = Number(quote?.spuId)
      if (!spuId || quote?.available === false) return []
      return [{
        packageId: Number(entry.packageId),
        packageName: String(entry.packageName || ""),
        packageNameI18n: entry.packageNameI18n || null,
        spuId,
        categoryId: Number(entry.categoryId),
        category: String(entry.categoryName || ""),
        categoryNameI18n: entry.categoryNameI18n || null,
        name: String(quote?.spuName || ""),
        spuNameI18n: quote?.nameI18n || null,
        phones: [] as string[],
        workerCount: null,
        acceptOrder: 1 as const,
        available: true,
        status: quoteRejectText(quote)
          ? 3
          : quote?.status == null
            ? undefined
            : Number(quote.status),
        rejectReason: quoteRejectText(quote),
        priceEditable: quote?.priceEditable === true,
        canApplyPriceChange: quote?.canApplyPriceChange === true,
        priceChangeStatus: quote?.priceChangeStatus == null ? null : Number(quote.priceChangeStatus),
        priceChangeReason: quote?.priceChangeReason || "",
        priceChangeRejectReason: quote?.priceChangeRejectReason || "",
        quoteMode: assignedQuoteMode(quote),
        unitPrice: quote?.unitPrice,
        unitPriceWithMaterial: quote?.unitPriceWithMaterial,
        unitPriceWithoutMaterial: quote?.unitPriceWithoutMaterial,
        prices: packagePriceList(quote),
        acceptBands: countAcceptBands(quote),
        times: packageTimesFor(entry.contents, spuId),
      }]
    })
  }
  const quoteBySpu = new Map(
    liveQuotes.value.map((quote) => [Number(quote.spuId), quote]),
  )
  return savedServices.value.flatMap((service) => {
    if (!serviceListed(service)) return []
    const quote = quoteBySpu.get(service.spuId)
    return [{
      ...service,
      status: quoteRejectText(quote)
        ? 3
        : quote?.status == null
          ? undefined
          : Number(quote.status),
      rejectReason: quoteRejectText(quote),
      priceEditable: quote?.priceEditable === true,
      canApplyPriceChange: quote?.canApplyPriceChange === true,
      priceChangeStatus:
        quote?.priceChangeStatus == null
          ? null
          : Number(quote.priceChangeStatus),
      priceChangeReason: quote?.priceChangeReason || "",
      priceChangeRejectReason: quote?.priceChangeRejectReason || "",
      quoteMode: assignedQuoteMode(quote),
      unitPrice: quote?.unitPrice,
      unitPriceWithMaterial: quote?.unitPriceWithMaterial,
      unitPriceWithoutMaterial: quote?.unitPriceWithoutMaterial,
      prices: (quote?.skus || [])
        .filter((line: any) => Number(line.enabled ?? 1) !== 0)
        .map((line: any) => Number(line.approvedPrice ?? line.quotePrice))
        .filter((price: number) => Number.isFinite(price) && price > 0),
      acceptBands: countAcceptBands(quote),
    }]
  })
})
const categoryServiceRows = computed(() =>
  serviceRows.value.filter(
    (row) => row.categoryId === Number(quoteCategory.value),
  ),
)
const quoteStatusOptions = computed(() => {
  const rows = categoryServiceRows.value
  const options = [
    { value: "all", label: t("admin.supplierPortal.allStatuses") },
    { value: "none", label: t("admin.supplierPricing.statusNone") },
    ...[0, 1, 2, 3].map((status) => ({
      value: String(status),
      label: quoteStatusLabel(status),
    })),
  ]
  return options.map((item) => ({
    ...item,
    count: rows.filter((row) => {
      if (item.value === "all") return true
      if (item.value === "none") return row.status == null
      return row.status === Number(item.value)
    }).length,
  }))
})
const filteredServiceRows = computed(() => {
  const keyword = addedKeyword.value.trim().toLowerCase()
  return serviceRows.value.filter((row) => {
    if (row.categoryId !== Number(quoteCategory.value)) return false
    if (quoteStatusFilter.value === "none" && row.status != null) return false
    if (
      quoteStatusFilter.value !== "all" &&
      quoteStatusFilter.value !== "none" &&
      row.status !== Number(quoteStatusFilter.value)
    )
      return false
    if (!keyword) return true
    const category = localizedCategory(row.category, row.categoryNameI18n)
    const packageName = packageMode.value && "packageName" in row
      ? serviceHaystack(row.packageName || "", row.packageNameI18n)
      : ""
    return `${serviceHaystack(row.name, row.spuNameI18n)} ${packageName} ${category} ${row.category} ${row.phones.join(" ")}`.includes(
      keyword,
    )
  })
})
const packageServiceCount = (packageId: number) =>
  serviceRows.value.filter((row) => "packageId" in row && Number(row.packageId) === Number(packageId)).length
const serviceRowGroups = computed(() => {
  const rows = filteredServiceRows.value
  if (!rows.length) return []
  if (!packageMode.value) return [{ key: "services", name: "", rows }]
  const groups = new Map<number, { key: string; name: string; rows: typeof rows }>()
  for (const row of rows) {
    if (!("packageId" in row)) continue
    const packageId = Number(row.packageId)
    let group = groups.get(packageId)
    if (!group) {
      group = {
        key: `package-${packageId}`,
        name: serviceTitle(row.packageName || "", row.packageNameI18n)
          || `${t("admin.supplierPortal.packages")} #${packageId}`,
        rows: [],
      }
      groups.set(packageId, group)
    }
    group.rows.push(row)
  }
  return [...groups.values()]
})
const AUTO_REJECT_REASON = "Your price is too high. Please submit a lower quote."
const isAutoRejectReason = (reason: unknown) =>
  String(reason ?? "").trim() === AUTO_REJECT_REASON
const supplierRejectCopy = (reason: unknown) =>
  String(reason ?? "")
    .split("；")
    .map((part) => {
      const text = part.trim()
      if (!text) return ""
      return isAutoRejectReason(text) ? t("admin.supplierPricing.autoRejected") : text
    })
    .filter(Boolean)
    .join("；")
const quoteWasAutoRejected = (quote: {
  rejectReason?: unknown
  skus?: { rejectReason?: unknown }[]
  attaches?: { rejectReason?: unknown }[]
} | null | undefined) => {
  if (!quote) return false
  if (isAutoRejectReason(quote.rejectReason)) return true
  const lines = [
    ...(Array.isArray(quote.skus) ? quote.skus : []),
    ...(Array.isArray(quote.attaches) ? quote.attaches : []),
  ]
  return lines.some((item) => isAutoRejectReason(item?.rejectReason))
}
const quoteRejectText = (
  quote:
    | {
        rejectReason?: string
        skus?: { reviewStatus?: number; rejectReason?: string }[]
      }
    | undefined,
) => {
  const header = String(quote?.rejectReason || "").trim()
  const reasons: string[] = []
  if (header) reasons.push(header)
  for (const sku of quote?.skus || []) {
    const reason = String(sku?.rejectReason || "").trim()
    if (
      (Number(sku?.reviewStatus) === 3 || reason) &&
      reason &&
      !reasons.includes(reason)
    )
      reasons.push(reason)
  }
  return reasons.join("；")
}
const quoteNeedsResubmit = (row: { status?: number; rejectReason?: string }) =>
  Number(row.status) === 3 || Boolean(String(row.rejectReason || "").trim())
const pendingQuoteCount = computed(
  () => serviceRows.value.filter((row) => Number(row.status) === 1).length,
)
const enabledServiceCount = computed(
  () => serviceRows.value.filter((row) => Number(row.acceptOrder) !== 0).length,
)
const resetPricingFilters = () => {
  addedKeyword.value = ""
  quoteStatusFilter.value = "all"
}
const addPhone = (holder: { phones: string[] }) => {
  if (holder.phones.length >= 10) return
  holder.phones.push("")
}
const removePhone = (holder: { phones: string[] }, index: number) => {
  holder.phones.splice(index, 1)
  if (!holder.phones.length) holder.phones.push("")
}
const togglePick = (service: PickerService, checked: boolean) => {
  const key = pickKey(service)
  if (!checked) {
    servicePicker.drafts = servicePicker.drafts.filter(
      (item) => item.key !== key,
    )
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
    phones: [""],
  })
}
const openServicePicker = () => {
  servicePicker.categoryId = ""
  servicePicker.keyword = ""
  servicePicker.drafts = []
  servicePicker.open = true
}
const currentPackageIds = () => {
  const ids = new Set<number>()
  for (const group of packageCatalog.value) {
    for (const item of Array.isArray(group?.packages) ? group.packages : []) {
      if (item?.selected === true || Number(item?.selected) === 1)
        ids.add(Number(item.packageId))
    }
  }
  for (const entry of packageFlat.value) ids.add(Number(entry?.packageId))
  return [...ids].filter((id) => Number.isInteger(id) && id > 0)
}
const openPackagePicker = () => {
  packagePicker.categoryId = ""
  packagePicker.keyword = ""
  packagePicker.checked = currentPackageIds()
  packagePicker.open = true
}
const togglePackagePick = (packageId: number, checked: boolean) => {
  const next = new Set(packagePicker.checked)
  if (checked) next.add(packageId)
  else next.delete(packageId)
  packagePicker.checked = [...next]
}
const packageSelectionPayload = (ids: number[]) => {
  const chosen = new Set(ids)
  const packages: Array<{ categoryId: number; items: Array<{ packageId: number }> }> = []
  for (const group of packageCatalog.value) {
    const categoryId = Number(group?.categoryId)
    const items = (Array.isArray(group?.packages) ? group.packages : [])
      .filter((item: any) => item?.available !== false && chosen.has(Number(item?.packageId)))
      .map((item: any) => ({ packageId: Number(item.packageId) }))
    if (Number.isInteger(categoryId) && categoryId > 0 && items.length)
      packages.push({ categoryId, items })
  }
  return packages
}
const savePackageSelection = async () => {
  if (!supplierRecordId.value || packageSaving.value) return
  if (!packagePicker.checked.length && currentPackageIds().length) {
    try {
      await ElMessageBox.confirm(
        t("admin.supplierPortal.removePackageConfirm"),
        t("admin.supplierPortal.removePackageTitle"),
        { type: "warning" },
      )
    } catch {
      return
    }
  }
  await persistPackageSelection(packagePicker.checked, true)
}
const addPackageOffer = async (packageId: number) => {
  if (!supplierRecordId.value || packageSaving.value || !packageId) return
  await persistPackageSelection([...new Set([...currentPackageIds(), packageId])], false)
}
const removeSavedPackage = async (row: {
  packageId?: number
  packageName?: string
  packageNameI18n?: unknown
}) => {
  const packageId = Number(row.packageId)
  if (!supplierRecordId.value || !packageId || packageSaving.value || removingPackageId.value != null) return
  const name = serviceTitle(row.packageName || "", row.packageNameI18n) || String(packageId)
  try {
    await ElMessageBox.confirm(
      t("admin.supplierPortal.removePackageNamedConfirm", { name }),
      t("admin.supplierPortal.removePackageTitle"),
      {
        type: "warning",
        confirmButtonText: t("admin.supplierPricing.removeAction"),
      },
    )
  } catch {
    return
  }
  removingPackageId.value = packageId
  packageSaving.value = true
  try {
    await saveSupplierPackages({
      supplierId: supplierRecordId.value,
      packages: packageSelectionPayload(currentPackageIds().filter((id) => id !== packageId)),
    })
    if (quoteDialog.visible && Number(quoteDialog.packageId) === packageId) await closeServiceQuote()
    ElMessage.success(t("admin.supplierPortal.packageRemoved"))
    await loadPackageWorkspace()
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPortal.loadFailed"))
  } finally {
    removingPackageId.value = null
    packageSaving.value = false
  }
}
const persistPackageSelection = async (ids: number[], closePicker: boolean) => {
  packageSaving.value = true
  try {
    await saveSupplierPackages({
      supplierId: supplierRecordId.value,
      packages: packageSelectionPayload(ids),
    })
    if (closePicker) packagePicker.open = false
    ElMessage.success(t("admin.supplierPortal.selectionSaved"))
    await loadPackageWorkspace()
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPortal.loadFailed"))
  } finally {
    packageSaving.value = false
  }
}
const acknowledgePackageNotice = async () => {
  if (!supplierRecordId.value || packageNoticeAcking.value) return
  packageNoticeAcking.value = true
  try {
    await acknowledgeSupplierPackageShelfNotices(supplierRecordId.value)
    packageNoticeUnread.value = false
    packageNotices.value = []
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPortal.shelfNoticeAckFailed"))
  } finally {
    packageNoticeAcking.value = false
  }
}
const listedPhones = (phones: string[]) =>
  (phones || []).map((phone) => phone.trim()).filter(Boolean)
const quoteModeCode = (value: unknown): 1 | 2 | 3 | 4 | null => {
  const code = Number(value)
  return code === 1 || code === 2 || code === 3 || code === 4 ? code : null
}
const quoteModeLabel = (mode?: number | null) =>
  mode === 1
    ? t("admin.supplierPricing.fixedPrice")
    : mode === 2
      ? t("admin.supplierPricing.hourlyRate")
      : mode === 3
        ? t("admin.supplierPricing.staffHourRate")
        : mode === 4
          ? t("admin.supplierPricing.quantityRate")
          : t("admin.supplierPricing.modeUnset")
const assignedQuoteMode = (source?: {
  quoteMode?: unknown
  configuredQuoteMode?: unknown
  status?: unknown
  priceEditable?: unknown
} | null): 1 | 2 | 3 | 4 => {
  const savedMode = quoteModeCode(source?.quoteMode)
  const configuredMode = quoteModeCode(source?.configuredQuoteMode)
  if (Number(source?.status) === 1 && savedMode) return savedMode
  return configuredMode ?? savedMode ?? 1
}
const quoteNeedsNewMode = (source?: {
  quoteMode?: unknown
  configuredQuoteMode?: unknown
  status?: unknown
  unitPrice?: unknown
  skus?: Array<{ quotePrice?: unknown }>
} | null) => {
  const savedMode = quoteModeCode(source?.quoteMode)
  const configuredMode = quoteModeCode(source?.configuredQuoteMode)
  if (Number(source?.status) === 1) return false
  if (savedMode != null && configuredMode != null && savedMode !== configuredMode) return true
  const mode = configuredMode ?? savedMode
  if (!singleRateMode(mode)) return false
  const rate = Number(source?.unitPrice)
  if (Number.isFinite(rate) && rate > 0) return false
  return (source?.skus || []).some((sku) => Number(sku?.quotePrice) > 0)
}
const applyConfiguredQuoteModeToDialog = (source?: {
  quoteMode?: unknown
  configuredQuoteMode?: unknown
  status?: unknown
} | null) => {
  const reset = quoteNeedsNewMode(source)
  quoteDialog.modeReset = reset
  quoteDialog.quoteMode = assignedQuoteMode(source)
  if (!reset) return
  quoteDialog.unitPrice = null
  quoteDialog.unitPriceWithMaterial = null
  quoteDialog.unitPriceWithoutMaterial = null
  quoteDialog.rejectReason = ""
  quoteDialog.rows.forEach((row) => {
    row.quotePrice = null
    row.reviewStatus = undefined
    row.rejectReason = ""
    row.settled = false
    row.acceptBand = null
    row.approvedPrice = null
  })
  quoteDialog.attaches.forEach((item) => {
    item.reviewStatus = undefined
    item.rejectReason = ""
    item.settled = false
  })
}
const quoteSpuId = (value: unknown) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : 0
}
const selectedQuoteSpuIds = ref<number[]>([])
const quoteSpuSelected = (spuId: unknown) =>
  selectedQuoteSpuIds.value.includes(quoteSpuId(spuId))
const visibleQuoteSpuIds = computed(() =>
  filteredServiceRows.value
    .map((row) => quoteSpuId(row.spuId))
    .filter((id) => id > 0),
)
const allVisibleQuotesSelected = computed(() => {
  const ids = visibleQuoteSpuIds.value
  return (
    ids.length > 0 && ids.every((id) => selectedQuoteSpuIds.value.includes(id))
  )
})
const someVisibleQuotesSelected = computed(() => {
  const ids = visibleQuoteSpuIds.value
  const selected = ids.filter((id) =>
    selectedQuoteSpuIds.value.includes(id),
  ).length
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
const quoteExportLabel = computed(() =>
  selectedQuoteSpuIds.value.length
    ? t("admin.supplierPricing.exportSelected", {
        count: selectedQuoteSpuIds.value.length,
      })
    : t("admin.supplierPricing.downloadTemplate"),
)
watch(serviceRows, (rows) => {
  const ids = new Set(
    rows.map((row) => quoteSpuId(row.spuId)).filter((id) => id > 0),
  )
  const next = selectedQuoteSpuIds.value.filter((id) => ids.has(id))
  if (next.length !== selectedQuoteSpuIds.value.length)
    selectedQuoteSpuIds.value = next
})
const phoneOk = (value: string) =>
  /^[1-9]\d{7,14}$/.test(value.replace(/\D/g, ""))
const categoryGroup = (categoryId: number) =>
  catalogDraft.value.find((group) => group.categoryId === categoryId)
const filledCategoryPhones = (phones: string[]) =>
  phones.map((phone) => phone.trim()).filter(Boolean)
const categoryPhoneCount = (phones: string[]) => filledCategoryPhones(phones).length
const categoryContactDialog = reactive({
  open: false,
  categoryId: 0,
  label: "",
  contactName: "",
  phones: [""] as string[],
})
const openCategoryContact = (categoryId: number) => {
  const group = categoryGroup(categoryId)
  if (!group) return
  quoteCategory.value = String(categoryId)
  const phones = filledCategoryPhones(group.contactPhones)
  categoryContactDialog.categoryId = categoryId
  categoryContactDialog.label = localizedCategory(
    group.categoryName,
    group.categoryNameI18n,
  )
  categoryContactDialog.contactName = group.contactName || ""
  categoryContactDialog.phones = phones.length ? [...phones] : [""]
  categoryContactDialog.open = true
}
const addCategoryPhone = () => {
  if (categoryContactDialog.phones.length >= 10) return
  categoryContactDialog.phones.push("")
}
const removeCategoryPhone = (index: number) => {
  categoryContactDialog.phones.splice(index, 1)
  if (!categoryContactDialog.phones.length) categoryContactDialog.phones.push("")
}
const saveCategoryPhones = async () => {
  const categoryId = categoryContactDialog.categoryId
  const group = categoryGroup(categoryId)
  if (
    !group ||
    !supplierRecordId.value ||
    categoryPhoneSaving.value[categoryId]
  )
    return
  const phones = filledCategoryPhones(categoryContactDialog.phones)
  const contactName = categoryContactDialog.contactName.trim()
  const key = categoryContactKey(contactName, phones)
  const savedKey = savedCategoryPhoneKeys.value.get(categoryId) || ""
  const name = categoryContactDialog.label
  if (!contactName) {
    ElMessage.warning(t("admin.supplierPortal.categoryContactNameRequired"))
    return
  }
  if (contactName.length > 128) {
    ElMessage.warning(t("admin.supplierPortal.categoryContactNameMax"))
    return
  }
  if (!phones.length) {
    ElMessage.warning(t("admin.supplierPortal.categoryContactRequired"))
    return
  }
  if (phones.length > 10) {
    ElMessage.warning(t("admin.supplierPricing.phoneMax", { name }))
    return
  }
  const invalid = phones.find((phone) => !phoneOk(phone))
  if (invalid) {
    ElMessage.warning(
      t("admin.supplierPricing.phoneInvalid", { name, phone: invalid }),
    )
    return
  }
  if (key === savedKey) {
    categoryContactDialog.open = false
    return
  }
  categoryPhoneSaving.value = {
    ...categoryPhoneSaving.value,
    [categoryId]: true,
  }
  try {
    await saveCategoryContacts({
      supplierId: supplierRecordId.value,
      categories: [{ categoryId, contactName, contactPhones: phones }],
    })
    ElMessage.success(t("admin.supplierPortal.categoryContactSaved"))
    categoryContactDialog.open = false
    await loadCatalog(true)
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.supplierPricing.saveServicesFailed"),
    )
  } finally {
    const next = { ...categoryPhoneSaving.value }
    delete next[categoryId]
    categoryPhoneSaving.value = next
  }
}
const supplierOrders = ref<any[]>([])
const staffOrderUserId = computed(() => {
  const id = Number(router.currentRoute.value.query.staff)
  return Number.isFinite(id) && id > 0 ? id : 0
})
const visibleSupplierOrders = computed(() => {
  if (!staffOrderUserId.value) return supplierOrders.value
  return supplierOrders.value.filter((row) =>
    (Array.isArray(row?.assignedStaff) ? row.assignedStaff : []).some(
      (item: any) => Number(item?.adminUserId) === staffOrderUserId.value,
    ),
  )
})
const orderLoading = ref(false)
const orderLoadFailed = ref(false)
const orderTotal = ref(0)
const orderPage = ref(1)
type OrderMetricKey = "newRequests" | "upcoming" | "inProgress" | "completed"
type OrderStage = "all" | OrderMetricKey | "cancelled"
const orderMetricKeys: OrderMetricKey[] = [
  "newRequests",
  "upcoming",
  "inProgress",
  "completed",
]
const orderStage = ref<OrderStage>("all")
const orderSummary = ref<Partial<Record<OrderMetricKey, number>>>({})
const supplierStageParam = (stage: OrderStage) => {
  if (stage === "newRequests") return "NEW"
  if (stage === "upcoming") return "UPCOMING"
  if (stage === "inProgress") return "IN_PROGRESS"
  if (stage === "completed") return "COMPLETED"
  if (stage === "cancelled") return "CANCELLED"
  return undefined
}
let orderListRequest = 0
const orderMetrics = computed(() =>
  orderMetricKeys.map((key) => ({
    key,
    label: t(`admin.supplierPortal.${key}`),
    value: orderSummary.value[key] ?? null,
  })),
)
const orderStages = computed(() => [
  { value: "all" as OrderStage, label: t("admin.supplierPortal.allOrders"), count: null as number | null },
  ...orderMetricKeys.map((value) => ({
    value: value as OrderStage,
    label: t(`admin.supplierPortal.${value}`),
    count: orderSummary.value[value] ?? null,
  })),
  {
    value: "cancelled" as OrderStage,
    label: t("admin.supplierPortal.cancelled"),
    count: null as number | null,
  },
])
const orderPageRange = computed(() => {
  const count = supplierOrders.value.length
  const from = count ? (orderPage.value - 1) * 10 + 1 : 0
  const to = count ? Math.min(from + count - 1, orderTotal.value) : 0
  return t("admin.supplierOrders.pageRange", {
    from,
    to,
    total: orderTotal.value,
  })
})
const hasOrderFilters = computed(() =>
  Boolean(
    orderKeyword.value ||
    orderServiceKeyword.value ||
    orderCategory.value ||
    orderDateRange.value.length ||
    orderStage.value !== "all" ||
    staffOrderUserId.value > 0,
  ),
)
const clearStaffOrderFilter = () => {
  if (!staffOrderUserId.value) return
  const query = { ...router.currentRoute.value.query }
  delete query.staff
  router.replace({ path: router.currentRoute.value.path, query })
}
const resetOrderFilters = () => {
  orderKeyword.value = ""
  orderServiceKeyword.value = ""
  orderCategory.value = null
  orderDateRange.value = []
  orderStage.value = "all"
  clearStaffOrderFilter()
  searchOrders()
}
const changeOrderStage = (stage: OrderStage) => {
  if (stage === orderStage.value) return
  orderStage.value = stage
  searchOrders()
}
const selectOrderMetric = (key: OrderMetricKey) => {
  changeOrderStage(orderStage.value === key ? "all" : key)
}

const profileStatusItems = computed(() => {
  const counts = countSingleReviewStatus(onboardingStatus.value)
  return [
    {
      key: "none",
      label: t("admin.supplierPortal.profileNone"),
      count: counts.none,
      tone: "is-muted",
    },
    {
      key: "draft",
      label: t("admin.supplierPortal.profileDraft"),
      count: counts.draft,
      tone: "is-review",
    },
    {
      key: "reviewing",
      label: t("admin.supplierPortal.profileReviewing"),
      count: counts.reviewing,
      tone: "is-review",
    },
    {
      key: "approved",
      label: t("admin.supplierPortal.profileApproved"),
      count: counts.approved,
      tone: "is-approved",
    },
    {
      key: "rejected",
      label: t("admin.supplierPortal.profileRejected"),
      count: counts.rejected,
      tone: "is-rejected",
    },
  ]
})
const quoteStatusItems = computed(() => {
  const counts = countWorkspaceQuotes(serviceRows.value)
  return [
    {
      key: "awaiting",
      label: t("admin.supplierPortal.awaitingQuote"),
      count: counts.awaiting,
      tone: "is-review",
    },
    {
      key: "draft",
      label: t("admin.supplierPortal.quoteDraft"),
      count: counts.draft,
      tone: "is-review",
    },
    {
      key: "reviewing",
      label: t("admin.supplierPortal.quoteReviewing"),
      count: counts.reviewing,
      tone: "is-review",
    },
    {
      key: "approved",
      label: t("admin.supplierPortal.quoteApproved"),
      count: counts.approved,
      tone: "is-approved",
    },
    {
      key: "rejected",
      label: t("admin.supplierPortal.quoteRejected"),
      count: counts.rejected,
      tone: "is-rejected",
    },
    {
      key: "priceChange",
      label: t("admin.supplierPortal.quotePriceChange"),
      count: counts.priceChange,
      tone: "is-review",
    },
    {
      key: "priceChangeRejected",
      label: t("admin.supplierPortal.quotePriceChangeRejected"),
      count: counts.priceChangeRejected,
      tone: "is-rejected",
    },
  ]
})
const areaCatalog = computed(() => {
  const map = new Map<number, AreaZone>()
  platformAreas.value.forEach((area) => {
    const id = Number(area.id)
    if (id) map.set(id, { id, name: String(area.name || `Area ${id}`) })
  })
  supplierAreas.value.forEach((area) => {
    if (!map.has(area.areaId))
      map.set(area.areaId, {
        id: area.areaId,
        name: area.areaName || `Area ${area.areaId}`,
      })
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
      if (explicit ? explicit.includes(community.id) : selected.has(area.id))
        included.add(community.id)
    })
  })
  return { included: [...included], bare }
})
const coverageRows = computed(() => {
  const included = new Set(savedCoverage.value.included)
  const bare = new Set(savedCoverage.value.bare)
  return areaCatalog.value
    .map((area) => {
      const communities = communitiesByArea.value[area.id] || []
      return {
        ...area,
        communities,
        picked: communities.filter((community) => included.has(community.id)),
        bare: bare.has(area.id),
      }
    })
    .filter((row) => row.picked.length || row.bare)
})
const coveredCommunityCount = computed(
  () => savedCoverage.value.included.length,
)
const coverageWorkspaceRows = computed(() =>
  coverageRows.value.map((row) => ({
    id: row.id,
    zone: row.name,
    selectedCommunities: row.picked.length,
    totalCommunities: row.communities.length,
    status:
      !row.communities.length || row.picked.length === row.communities.length
        ? "full"
        : "partial",
  })),
)
const coverageStatusItems = computed(() => {
  const selected = selectedAreaIds.value.length
  const ready = areaCatalogReady.value
  const rows = ready ? coverageWorkspaceRows.value : []
  const counts = countCoverageStatuses({
    selectedAreas: selected,
    fullAreas:
      !selected || ready
        ? rows.filter((row) => row.status === "full").length
        : null,
    partialAreas:
      !selected || ready
        ? rows.filter((row) => row.status === "partial").length
        : null,
    communities: !selected
      ? 0
      : ready
        ? coveredCommunityCount.value
        : Array.isArray(coveredCommunityIds.value)
          ? coveredCommunityIds.value.length
          : null,
  })
  return [
    {
      key: "unset",
      label: t("admin.supplierPortal.coverageUnset"),
      count: counts.unset,
      tone: "is-rejected",
    },
    {
      key: "areas",
      label: t("admin.supplierPortal.coverageAreas"),
      count: counts.areas,
      tone: "is-approved",
    },
    {
      key: "full",
      label: t("admin.supplierPortal.coverageFull"),
      count: counts.full,
      tone: "is-approved",
    },
    {
      key: "partial",
      label: t("admin.supplierPortal.coveragePartial"),
      count: counts.partial,
      tone: "is-review",
    },
    {
      key: "communities",
      label: t("admin.supplierPortal.coverageCommunities"),
      count: counts.communities,
      tone: "is-approved",
    },
  ]
})
const coverageSummary = (areas: number, communities: number) =>
  t("admin.supplierArea.count", {
    areas: t(
      areas === 1
        ? "admin.supplierArea.oneArea"
        : "admin.supplierArea.manyAreas",
      { count: areas },
    ),
    communities: t(
      communities === 1
        ? "admin.supplierArea.oneCommunity"
        : "admin.supplierArea.manyCommunities",
      { count: communities },
    ),
  })
const areaSelectionEmpty = computed(
  () => areaCatalogReady.value && !coverageRows.value.length,
)
const coverageLabel = (row: {
  communities: AreaCommunity[]
  picked: AreaCommunity[]
}) => {
  if (!row.communities.length) return t("admin.supplierArea.zoneOnly")
  if (row.picked.length === row.communities.length)
    return t("admin.supplierArea.allCoverage", {
      total: row.communities.length,
    })
  return t("admin.supplierArea.partialCoverage", {
    count: row.picked.length,
    total: row.communities.length,
  })
}
const editorZones = computed(() => {
  const keyword = areaKeyword.value.trim().toLowerCase()
  return areaCatalog.value.filter((area) => {
    if (!keyword) return true
    if (area.name.toLowerCase().includes(keyword)) return true
    return (communitiesByArea.value[area.id] || []).some((community) =>
      community.name.toLowerCase().includes(keyword),
    )
  })
})
const draftSummary = computed(() => {
  const picked = new Set(draftCommunityIds.value)
  let areas = draftBareAreaIds.value.length
  let communities = 0
  areaCatalog.value.forEach((area) => {
    const count = (communitiesByArea.value[area.id] || []).filter((community) =>
      picked.has(community.id),
    ).length
    if (!count) return
    areas += 1
    communities += count
  })
  return { areas, communities }
})
const zoneMode = (areaId: number) => {
  const communities = communitiesByArea.value[areaId] || []
  if (!communities.length)
    return draftBareAreaIds.value.includes(areaId) ? "all" : "none"
  const picked = communities.filter((community) =>
    draftCommunityIds.value.includes(community.id),
  ).length
  if (!picked) return "none"
  return picked === communities.length ? "all" : "partial"
}
const bindZoneBox = (el: Element | null, areaId: number) => {
  if (el instanceof HTMLInputElement)
    el.indeterminate = zoneMode(areaId) === "partial"
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
  if (zoneMode(areaId) === "all") {
    const drop = new Set(communities.map((community) => community.id))
    draftCommunityIds.value = draftCommunityIds.value.filter(
      (id) => !drop.has(id),
    )
    return
  }
  const next = new Set(draftCommunityIds.value)
  communities.forEach((community) => next.add(community.id))
  draftCommunityIds.value = [...next]
}
const onCommunityToggle = (id: number, event: Event) => {
  const checked =
    event.target instanceof HTMLInputElement && event.target.checked
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

const unwrap = (res: any) =>
  res && typeof res === "object" && "data" in res ? res.data : res
const bit = (enabled: boolean) => (enabled ? 1 : 0)
const quoteStatusLabel = (status?: number) =>
  [
    t("admin.supplierPricing.quotationDraft"),
    t("admin.supplierPricing.quotationReview"),
    t("admin.supplierPricing.quotationApproved"),
    t("admin.supplierPricing.quotationRejected"),
  ][status ?? -1] || t("admin.supplierPricing.statusNone")
const linePriceFacts = (row: {
  approvedPrice?: unknown
  quotePrice?: unknown
  reviewStatus?: unknown
  rejectReason?: unknown
}) =>
  quotePriceView({
    approvedPrice: row.approvedPrice,
    quotePrice: row.quotePrice,
    reviewStatus: row.reviewStatus,
    quoteStatus: quoteDialog.status,
    priceChangeStatus: quoteDialog.priceChangeStatus,
    rejected: Boolean(row.rejectReason),
  })
const linePriceStateLabel = (view: string) => {
  const keys: Record<string, string> = {
    underReview: "admin.supplierPricing.priceUnderReview",
    approvedPending: "admin.supplierPricing.priceApprovedPending",
    rejected: "admin.supplierPricing.priceRejected",
    active: "admin.supplierPricing.priceActive",
    draft: "admin.supplierPricing.quotationDraft",
  }
  return keys[view] ? t(keys[view]) : ""
}
const priceChangesOpen = ref(false)
const quotePriceChanges = computed(() =>
  quoteDialog.rows.filter((row) => {
    const facts = linePriceFacts(row)
    return facts.showActive && facts.showPending
  }),
)
const quoteTagType = (status?: number) =>
  Number(status) === 1
    ? "warning"
    : Number(status) === 2
      ? "success"
      : Number(status) === 3
        ? "danger"
        : "info"
const moneyText = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—"
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : "—"
}
const acceptBandLabel = (band: unknown) => {
  const named = typeof band === "string" ? band : ""
  const name = acceptBandName(band) || named
  if (name === "direct") return t("admin.supplierPricing.acceptDirect")
  if (name === "deferred") return t("admin.supplierPricing.acceptDeferred")
  if (name === "blocked") return t("admin.supplierPricing.acceptBlocked")
  if (name === "open") return t("admin.supplierPricing.acceptOpen")
  return ""
}
const quoteOutcomeName = (row: unknown): QuoteLineOutcome => quoteLineOutcome(row as never)
const quoteDispatchVisible = () => Number(quoteDialog.status) === 2
const quoteLineBadge = (row: { reviewStatus?: number | null; rejectReason?: string }) => {
  if (lineRejected(row)) {
    return { tone: "blocked", label: linePriceStateLabel("rejected") }
  }
  if (Number(quoteDialog.status) === 1 || quoteScreen.value === "submitted") {
    return { tone: "review", label: t("admin.supplierPricing.priceUnderReview") }
  }
  if (!quoteDispatchVisible()) return null
  const tone = quoteOutcomeName(row)
  if (tone === "open") return null
  return { tone, label: acceptBandLabel(tone) }
}
const attachBadge = (item: {
  acceptBand?: unknown
  reviewStatus?: number | null
  rejectReason?: string
}) => {
  if (lineRejected(item)) {
    return { tone: "blocked", label: linePriceStateLabel("rejected") }
  }
  const band = acceptBandName(item.acceptBand)
  if (Number(quoteDialog.status) === 1 || quoteScreen.value === "submitted") {
    return band ? { tone: "review", label: t("admin.supplierPricing.priceUnderReview") } : null
  }
  if (!quoteDispatchVisible() || !band) return null
  return { tone: band, label: acceptBandLabel(band) }
}
const openPriceChange = () => {
  priceChangeReason.value = ""
  priceChangeOpen.value = true
}
const submitPriceChange = async () => {
  const reason = priceChangeReason.value.trim()
  if (!reason) {
    ElMessage.warning(t("admin.supplierPricing.priceChangeReasonRequired"))
    return
  }
  if (!supplierRecordId.value || !quoteDialog.spuId || priceChangeSaving.value) return
  priceChangeSaving.value = true
  try {
    const saved = unwrap(
      await applyQuotePriceChange({
        supplierId: supplierRecordId.value,
        spuId: quoteDialog.spuId,
        reason,
      }),
    )
    applySavedQuote(saved)
    priceChangeOpen.value = false
    priceChangeReason.value = ""
    ElMessage.success(t("admin.supplierPricing.priceChangeSent"))
    if (packageMode.value) await loadPackageWorkspace()
    else await loadQuotes(true)
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPricing.priceChangeFailed"))
  } finally {
    priceChangeSaving.value = false
  }
}
const acceptBandItems = (row: { acceptBands?: AcceptBandCounts }) => {
  const bands = row.acceptBands
  if (!bands) return []
  return (
    [
      ["direct", bands.direct, "admin.supplierPricing.acceptDirect"],
      ["deferred", bands.deferred, "admin.supplierPricing.acceptDeferred"],
      ["blocked", bands.blocked, "admin.supplierPricing.acceptBlocked"],
    ] as const
  )
    .filter(([, count]) => count > 0)
    .map(([key, count, label]) => ({ key, count, label: t(label) }))
}
const quoteDialogAcceptItems = computed(() =>
  acceptBandItems({
    acceptBands: countAcceptBands({
      skus: quoteDialog.rows,
      attaches: quoteDialog.attaches,
    }),
  }),
)
const yourPriceText = (row: {
  quoteMode?: number
  unitPrice?: unknown
  unitPriceWithMaterial?: unknown
  unitPriceWithoutMaterial?: unknown
  prices?: number[]
}) => {
  if (Number(row.quoteMode) === 3) {
    return row.unitPrice == null || row.unitPrice === ""
      ? t("admin.supplierPricing.priceNotSet")
      : t("admin.supplierPricing.priceHourly", { price: moneyText(row.unitPrice) })
  }
  if (Number(row.quoteMode) === 2) {
    if (row.unitPriceWithMaterial == null && row.unitPriceWithoutMaterial == null) {
      return t("admin.supplierPricing.priceNotSet")
    }
    return t("admin.supplierPricing.priceHourlyMaterials", {
      withMaterial: moneyText(row.unitPriceWithMaterial),
      withoutMaterial: moneyText(row.unitPriceWithoutMaterial),
    })
  }
  if (Number(row.quoteMode) === 1 && row.prices?.length) {
    const min = Math.min(...row.prices)
    const max = Math.max(...row.prices)
    return `AED ${moneyText(min)}${max === min ? "" : ` – ${moneyText(max)}`}`
  }
  return t("admin.supplierPricing.priceNotSet")
}
const supplierInitials = computed(() => {
  const raw = profileDisplayName.value
  const parts = raw.split(/\s+/).filter(Boolean)
  const letters =
    parts.length > 1
      ? parts
          .slice(0, 2)
          .map((part) => part[0] || "")
          .join("")
      : raw.slice(0, 2)
  return letters || "SP"
})
const specText = (value: unknown) => {
  locale.value
  if (value == null || value === "") return "—"
  if (typeof value === "string" || typeof value === "number")
    return String(value)
  if (typeof value !== "object") return "—"
  const record = { ...(value as Record<string, unknown>) }
  delete record.remarkI18n
  const nested = record.nameI18n
  const source =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>)
      : record
  return pickI18nText(source, locale.value, "—") || "—"
}
const localizedName = (i18n: unknown, plain?: unknown) => {
  const text = specText(i18n)
  if (text !== "—") return text
  const fallback = plain == null ? "" : String(plain).trim()
  return fallback || "—"
}
const internalSpecCode = (value: string) =>
  /^[A-Za-z][A-Za-z0-9]*$/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value.slice(1))
/** Customer prompts such as "What do you need help with?" are not spec labels. */
const questionSpecLabel = (value: string) => /[?？]\s*$/.test(value)
const visibleSpecType = (value: string) =>
  value && value !== "—" && !internalSpecCode(value) && !questionSpecLabel(value) ? value : ""
const quantitySkuText = (row: any) => {
  const english = String(locale.value).toLowerCase().startsWith("en")
  const joiner = english ? "; " : "；"
  const lines = Array.isArray(row?.specLines) ? row.specLines : []
  const fromLines = lines
    .map((spec: any) => {
      const typeName = localizedName(spec?.specTypeNameI18n, spec?.specTypeName)
      const valueName = localizedName(spec?.specValueNameI18n, spec?.specValueName)
      const type = visibleSpecType(typeName)
      const value = valueName !== "—" ? valueName : ""
      if (!type && !value) return ""
      return type && value ? `${type}: ${value}` : value || type
    })
    .filter(Boolean)
  const fromColumns = quoteDialog.columns
    .map((column) => {
      const value = specText(row?.specs?.[column.key])
      if (!value || value === "—") return ""
      const typeName = column.nameI18n ? specText(column.nameI18n) : column.fallback
      const type = visibleSpecType(String(typeName || ""))
      return type ? `${type}: ${value}` : value
    })
    .filter(Boolean)
  const method = localizedName(row?.pricingMethodI18n, row?.pricingMethod)
  const text = fromLines.length
    ? fromLines.join(joiner)
    : fromColumns.length
      ? fromColumns.join(joiner)
      : method !== "—"
        ? method
        : ""
  return text
}
const quoteFulfillRemark = (row: { supplierFulfillRemark?: unknown } | null | undefined) =>
  String(row?.supplierFulfillRemark ?? "").trim().slice(0, 512)
const quantitySkuNotes = computed(() => {
  const mode = quoteModeCode(quoteDialog.quoteMode)
  if (mode == null || mode === 1) return []
  const joiner = String(locale.value).toLowerCase().startsWith("en") ? "; " : "；"
  return quoteDialog.rows
    .filter((row) => row.available !== false)
    .map((row) => {
      const spec = quantitySkuText(row)
      const remark = quoteFulfillRemark(row)
      const note = remark ? t("admin.supplierOrders.fulfillRemarkLine", { remark }) : ""
      return { id: row.skuId, text: spec && note ? `${spec}${joiner}${note}` : spec || note }
    })
    .filter((note) => note.text)
})
const CLEANING_SERVICE = /clean(?:ing|ers?)?|家政|保洁|清洁/i
const CLEANING_SPEC = /cleaners?|保洁员|保洁|清洁工/i
const quoteIdentityText = () =>
  [
    quoteDialog.name,
    quoteDialog.category,
    ...specTexts(quoteDialog.nameI18n),
    ...specTexts(quoteDialog.categoryI18n),
  ].join("\n")
const cleaningQuote = computed(() => CLEANING_SERVICE.test(quoteIdentityText()))
const optionStaffRole = (row: any, text: string) => {
  if (cleaningQuote.value) return "cleaner" as const
  const { current, every } = optionSpecValues(row)
  return CLEANING_SPEC.test([...current, ...every, text].join("\n"))
    ? "cleaner" as const
    : "tech" as const
}
const staffRoleLabel = (count: string, role: "cleaner" | "tech", lower = false) => {
  const key =
    role === "tech"
      ? "admin.supplierPricing.staffRoleTech"
      : Number(count) === 1
        ? "admin.supplierPricing.staffRoleCleaner"
        : "admin.supplierPricing.staffRoleCleaners"
  const word = t(key)
  return lower ? word.toLowerCase() : word
}
const optionPriceHintKey = computed(() => {
  if (quoteDialog.quoteMode === 4) return "admin.supplierPricing.optionPriceHintQuantity"
  if (quoteDialog.quoteMode === 2) {
    return cleaningQuote.value
      ? "admin.supplierPricing.optionPriceHintMaterialCleaner"
      : "admin.supplierPricing.optionPriceHintMaterial"
  }
  return cleaningQuote.value
    ? "admin.supplierPricing.optionPriceHintCleaner"
    : "admin.supplierPricing.optionPriceHintStaff"
})
const optionCountText = (value: number) => {
  const rounded = Math.round(value * 100) / 100
  return String(rounded)
}
const exclVat = (price: number) =>
  Math.round((price / 1.05 + Number.EPSILON) * 100) / 100
const workloadSpec = (type: string, value: string) =>
  /time\s*of\s*technicians?|技术人员|技师时间/i.test(type) ||
  /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|小时)\s*\/\s*/i.test(value)
const materialRateSide = (text: string) => {
  if (/without\s*materials?|不带材料|不含材料|无材料/i.test(text)) return "without"
  if (/with\s*materials?|带材料|含材料|有材料/i.test(text)) return "with"
  return ""
}
const STAFF_COUNT =
  /(\d+(?:\.\d+)?)\s*(?:cleaners?|techs?|technicians?|workers?|persons?|people|staff|技术员|技术人员|技师|清洁工|保洁员|保洁|人)/i
const HOUR_COUNT = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|小时)/i
const specTexts = (value: unknown): string[] => {
  if (value == null || value === "") return []
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim()
    return text ? [text] : []
  }
  if (typeof value !== "object") return []
  return Object.values(value as Record<string, unknown>).flatMap((item) =>
    typeof item === "string" || typeof item === "number" ? specTexts(item) : [],
  )
}
const uniqueTexts = (values: string[]) => [...new Set(values.filter(Boolean))]
const optionSpecValues = (row: any) => {
  const lines = Array.isArray(row?.specLines) ? row.specLines : []
  const current: string[] = []
  const every: string[] = []
  for (const spec of lines) {
    const localized = localizedName(spec?.specValueNameI18n, spec?.specValueName)
    if (localized && localized !== "—") current.push(localized)
    every.push(...specTexts(spec?.specValueName), ...specTexts(spec?.specValueNameI18n))
  }
  if (!lines.length && row?.specs && typeof row.specs === "object") {
    for (const value of Object.values(row.specs as Record<string, unknown>)) {
      const localized = specText(value)
      if (localized && localized !== "—") current.push(localized)
      every.push(...specTexts(value))
    }
  }
  if (row?.groupValue) {
    current.push(String(row.groupValue))
    every.push(String(row.groupValue))
  }
  return { current: uniqueTexts(current), every: uniqueTexts(every) }
}
const firstCount = (texts: string[], pattern: RegExp) => {
  for (const text of texts) {
    const match = text.match(pattern)
    if (match) return Number(match[1])
  }
  return 0
}
const materialSideOf = (texts: string[]) => {
  for (const text of texts) {
    const side = materialRateSide(text)
    if (side) return side
  }
  return ""
}
const hourTechWorkload = (text: string) => {
  const combo = text.match(
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|小时)\s*\/\s*(?:(\d+(?:\.\d+)?)\s*)?(?:cleaners?|techs?|technicians?|技术员|技术)/i,
  )
  if (!combo) return null
  return {
    hours: Number(combo[1]),
    staff: combo[2] ? Number(combo[2]) : 1,
  }
}
const optionWorkload = (row: { staffCount?: unknown; serviceHours?: unknown }, text: string) => {
  const savedStaff = blankPositive(row?.staffCount)
  const savedHours = blankPositive(row?.serviceHours)
  if (savedStaff && savedHours) return { staff: savedStaff, hours: savedHours }
  const parsed = hourTechWorkload(text)
  if (parsed) return parsed
  const { current, every } = optionSpecValues(row)
  const staff =
    savedStaff ||
    firstCount(current, STAFF_COUNT) ||
    firstCount(every, STAFF_COUNT) ||
    firstCount([text], STAFF_COUNT) ||
    0
  const hours =
    savedHours ||
    firstCount(current, HOUR_COUNT) ||
    firstCount(every, HOUR_COUNT) ||
    firstCount([text], HOUR_COUNT) ||
    0
  if (quoteDialog.quoteMode === 3) return { staff: staff || 1, hours: hours || 1 }
  return { staff, hours }
}
const optionRate = (row: any, text: string) => {
  if (quoteDialog.quoteMode === 3 || quoteDialog.quoteMode === 4) {
    return blankPositive(quoteDialog.unitPrice)
  }
  const { current, every } = optionSpecValues(row)
  const side = materialSideOf(current) || materialSideOf(every) || materialRateSide(text)
  if (side === "with") return blankPositive(quoteDialog.unitPriceWithMaterial)
  if (side === "without") return blankPositive(quoteDialog.unitPriceWithoutMaterial)
  const withRate = blankPositive(quoteDialog.unitPriceWithMaterial)
  const withoutRate = blankPositive(quoteDialog.unitPriceWithoutMaterial)
  if (withRate != null && withoutRate != null && withRate === withoutRate) return withRate
  return null
}
const optionSpecParts = (row: any) => {
  const lines = Array.isArray(row?.specLines) ? row.specLines : []
  return lines.flatMap((spec: any) => {
    const typeName = localizedName(spec?.specTypeNameI18n, spec?.specTypeName)
    const valueName = localizedName(spec?.specValueNameI18n, spec?.specValueName)
    const type = visibleSpecType(typeName)
    const value = valueName !== "—" ? valueName : ""
    if (!value || workloadSpec(type, value)) return []
    if (row?.groupValue && value === row.groupValue) return []
    return [{ type, value }]
  })
}
const optionPrices = computed(() => {
  if (!hourlyQuote.value) return []
  return quantitySkuNotes.value.map((note) => {
    const row = quoteDialog.rows.find((item) => item.skuId === note.id) || {}
    const parts = optionSpecParts(row)
    const rate = optionRate(row, note.text)
    const quantityMode = quoteDialog.quoteMode === 4
    const load = quantityMode ? { staff: 0, hours: 0 } : optionWorkload(row, note.text)
    const priced = !quantityMode && rate != null && load.staff > 0 && load.hours > 0
    const price = quantityMode ? rate : priced ? Math.round((rate * load.staff * load.hours + Number.EPSILON) * 100) / 100 : null
    const staff = optionCountText(load.staff)
    const hours = optionCountText(load.hours)
    const role = optionStaffRole(row, note.text)
    const roleLabel = staffRoleLabel(staff, role)
    const driver =
      load.staff > 0 && load.hours > 0
        ? t("admin.supplierPricing.optionPriceDriver", { staff, hours, role: roleLabel })
        : ""
    return {
      id: note.id,
      groupId: String(row.groupId || "all"),
      groupTitle: String(row.groupValue || ""),
      title: parts[0]?.value || String(row.lineLabel || note.text),
      detail: parts.slice(1).map((part: { value: string }) => part.value).join(" / "),
      types: parts.map((part: { type: string }) => part.type).filter(Boolean).join(" · "),
      text: note.text,
      note: driver,
      pills: driver
        ? [
            t("admin.supplierPricing.optionPriceStaff", { count: staff, role: roleLabel }),
            t("admin.supplierPricing.optionPriceHour", { count: hours }),
          ]
        : [],
      calculation:
        price == null
          ? ""
          : quantityMode
            ? moneyText(rate)
            : t("admin.supplierPricing.optionPriceCalc", {
                rate: moneyText(rate),
                staff,
                role: staffRoleLabel(staff, role, true),
                hours,
              }),
      excl: price == null ? null : exclVat(price),
      price,
    }
  })
})
const optionPriceRange = computed(() => {
  const prices = optionPrices.value
    .map((row) => row.price)
    .filter((price): price is number => price != null)
  if (!prices.length) return { low: null, high: null }
  return { low: Math.min(...prices), high: Math.max(...prices) }
})
const optionPriceGroups = computed(() => {
  const groups: Array<{ key: string; title: string }> = []
  for (const row of optionPrices.value) {
    if (!row.groupTitle || groups.some((group) => group.key === row.groupId)) continue
    groups.push({ key: row.groupId, title: row.groupTitle })
  }
  return groups
})
const visibleOptionPrices = computed(() => {
  const query = optionPriceQuery.value.trim().toLowerCase()
  return optionPrices.value.filter((row) => {
    if (optionPriceGroup.value && row.groupId !== optionPriceGroup.value) return false
    if (!query) return true
    return [row.title, row.detail, row.types, row.groupTitle, row.text, row.note]
      .join(" ")
      .toLowerCase()
      .includes(query)
  })
})
const visibleOptionPriceGroups = computed(() => {
  const groups: Array<{ key: string; title: string; rows: typeof visibleOptionPrices.value }> = []
  for (const row of visibleOptionPrices.value) {
    let group = groups.find((item) => item.key === row.groupId)
    if (!group) {
      group = { key: row.groupId, title: row.groupTitle, rows: [] }
      groups.push(group)
    }
    group.rows.push(row)
  }
  return groups
})
const optionPriceLine = (row: {
  title?: string
  detail?: string
  text: string
  note: string
  price: number | null
}) => {
  const short = [row.title, row.detail].filter(Boolean).join(" / ")
  const label = short || (row.note ? `${row.text} (${row.note})` : row.text)
  return row.price == null ? label : `${label} · AED ${moneyText(row.price)}`
}
const quoteDialogTitle = computed(() =>
  localizedName(quoteDialog.nameI18n, quoteDialog.name),
)
const supplierQuoteDescription = (i18n: unknown) => {
  const text = specText(i18n).trim()
  return text === "—" ? "" : text
}
const quoteIntroText = computed(() =>
  packageBundle.active ? packageBundle.quoteDesc : quoteDialog.supplierQuoteDesc,
)
const quoteDialogCategory = computed(() =>
  localizedName(quoteDialog.categoryI18n, quoteDialog.category),
)
const serviceEditorTitle = computed(() =>
  localizedName(serviceEditor.nameI18n, serviceEditor.name) === "—"
    ? t("admin.supplierPricing.serviceFallback")
    : localizedName(serviceEditor.nameI18n, serviceEditor.name),
)
const attachDisplay = (
  item: {
    name?: string
    nameI18n?: unknown
    typeName?: string
    typeNameI18n?: unknown
  },
  kind: "name" | "type",
) =>
  kind === "name"
    ? localizedName(item.nameI18n, item.name)
    : localizedName(item.typeNameI18n, item.typeName)
const attachUnit = (item: { unit?: string; unitI18n?: unknown }) => {
  const text = localizedName(item.unitI18n, item.unit)
  return text === "—" ? "" : text
}
const orderCategoryOptions = computed(() => {
  locale.value
  return catalogDraft.value.map((group) => {
    const text = specText(group.categoryNameI18n)
    return {
      id: group.categoryId,
      label: text !== "—" ? text : group.categoryName,
    }
  })
})
const orderKindLabel = (row: any) => {
  const kind = supplierOrderKind(row)
  if (kind === "package") return t("admin.supplierOrders.orderTypePackage")
  if (kind === "normal") return t("admin.supplierOrders.orderTypeNormal")
  return ""
}
const packageOrderTitle = (row: any) => {
  if (row?.packageOrder !== true && Number(row?.orderType) !== 2) return ""
  const localized = specText(row?.packageNameI18n)
  if (localized !== "—") return localized
  return String(row?.packageName || "").trim()
}
const packageVisitText = (row: any) => {
  const visit = packageVisitProgress(row)
  if (!visit) return ""
  if (visit.seq != null && visit.total != null) {
    return t("admin.supplierOrders.packageVisit", visit)
  }
  if (visit.seq != null) return t("admin.supplierOrders.packageVisitSeq", visit)
  return t("admin.supplierOrders.packageVisitTotal", visit)
}
const orderServiceTitle = (row: any) => {
  const localized = specText(row?.spuNameI18n)
  if (localized !== "—") return localized
  if (row?.spuName) return row.spuName
  const names = (row?.lines || [])
    .map((line: any) => orderServiceTitle(line))
    .filter((name: string) => name && name !== "—")
  return names.length ? names.join("、") : "—"
}
const orderFulfillRemarks = (row: any) => supplierFulfillRemarks(row)
const orderSpecText = (row: any) =>
  supplierSpecSummary(row, (i18n, plain) => {
    const localized = specText(i18n)
    return localized !== "—" ? localized : plain
  }) || "—"
const orderGroups = (row: any) => supplierOrderGroups(row)
const groupTitle = (group: { source?: string; sourceI18n?: unknown }) =>
  attachSource({
    source: group.source,
    sourceI18n: group.sourceI18n,
    addedAfterPay: group.source === "ADDON",
  })
const attachLabel = (item: { name?: unknown; nameI18n?: unknown }) => {
  const localized = specText(item?.nameI18n)
  return localized !== "—" ? localized : String(item?.name || "").trim() || "—"
}
const attachQuantity = (item: { quantity?: number; unit?: string; unitI18n?: unknown }) => {
  const unit = attachUnit(item)
  return unit ? `× ${item.quantity || 1} ${unit}` : `× ${item.quantity || 1}`
}
const attachSource = (item: { source?: unknown; sourceI18n?: unknown; addedAfterPay?: boolean }) => {
  const localized = specText(item?.sourceI18n)
  if (localized !== "—") return localized
  if (item?.source === "ADDON" || item?.addedAfterPay) return t("admin.supplierOrders.sourceAddon")
  if (item?.source === "INITIAL") return t("admin.supplierOrders.initialOrder")
  return ""
}
const orderAddonText = (row: any) => {
  const attaches = Array.isArray(row?.attaches) ? row.attaches : []
  if (!attaches.length) {
    const extra = String(row?.additionalItems || "").trim()
    return !extra || extra === "None"
      ? t("admin.supplierOrders.noAddons")
      : extra
  }
  return (
    attaches
      .map((item: any) => {
        const localized = specText(item?.nameI18n)
        const name = localized !== "—" ? localized : item?.name
        if (!name) return ""
        const unitText = specText(item?.unitI18n)
        const unit = unitText !== "—" ? unitText : String(item?.unit || "").trim()
        const labeled = unit ? `${name} / ${unit}` : name
        const quantity = Number(item?.quantity)
        return quantity > 1 ? `${labeled} × ${quantity}` : labeled
      })
      .filter(Boolean)
      .join(", ") || t("admin.supplierOrders.noAddons")
  )
}
const orderStartTime = (value?: string) => {
  const text = String(value || "").trim()
  const matched = text.match(/^(\d{1,2}:\d{2})\s*[-~–—～]\s*\d{1,2}:\d{2}$/)
  if (!matched) return text
  const [hour, minute] = matched[1].split(":")
  return `${hour.padStart(2, "0")}:${minute}`
}
const orderWhen = (row: any) =>
  [row?.serviceDate, orderStartTime(row?.serviceTime)]
    .filter(Boolean)
    .join(", ") || "—"
const orderPhones = (row: any) =>
  listedPhones(
    (Array.isArray(row?.contactPhones) ? row.contactPhones : []).map(
      (phone: unknown) => String(phone || ""),
    ),
  )
const orderHours = (value: unknown) => {
  if (value == null || value === "") return "—"
  const hours = Number(value)
  if (!Number.isFinite(hours)) return "—"
  const text = Number.isInteger(hours)
    ? String(hours)
    : String(Number(hours.toFixed(2)))
  return t("admin.supplierOrders.hoursValue", { hours: text })
}

const buildProfilePayload = (status?: number, areaIds?: number[]) => ({
  id: supplierRecordId.value || undefined,
  supplierType: companyForm.supplierType,
  ...(individualSupplier.value
    ? {
        fullName: companyForm.fullName.trim(),
        companyName: companyForm.fullName.trim(),
        dateOfBirth: companyForm.dateOfBirth || null,
        nationality: companyForm.nationality.trim(),
        residentialCity: companyForm.residentialCity.trim(),
      }
    : {
        companyName: companyForm.companyName,
        tradeLicenseNo: companyForm.licenseNo,
        licenseExpiry: companyForm.licenseExpiry,
        officeAddress: companyForm.address,
        contactPerson: companyForm.contact,
      }),
  vatTrn: companyForm.trn,
  mobile: joinPhone(companyForm.mobileCode, companyForm.mobile),
  whatsapp: joinPhone(companyForm.whatsappCode, companyForm.whatsapp),
  email: companyForm.email,
  yearsInBusiness: companyForm.years,
  publicLiabilityInsurance: complianceItems[0].files.length ? 1 : 0,
  publicLiabilityInsuranceFile: complianceItems[0].files,
  ...(individualSupplier.value
    ? {
        employeeInsurance: null,
        employeeInsuranceFile: null,
        totalAvailableWorkers: null,
        femaleStaffAvailable: null,
        femaleStaffCount: null,
        maleStaffAvailable: null,
        maleStaffCount: null,
      }
    : {
        employeeInsurance: complianceItems[1].files.length ? 1 : 0,
        employeeInsuranceFile: complianceItems[1].files,
        totalAvailableWorkers: capacityForm.workers,
        femaleStaffAvailable: femaleStaffCount.value > 0 ? 1 : 0,
        femaleStaffCount: femaleStaffCount.value,
        maleStaffAvailable: maleStaffCount.value > 0 ? 1 : 0,
        maleStaffCount: maleStaffCount.value,
      }),
  taxInvoiceAvailable: bit(complianceItems[2].enabled),
  ownEquipment: bit(complianceItems[3].enabled),
  wearUniform: wearUniform.value,
  ownTransportation: ownTransportation.value ? 1 : 0,
  minLeadTimeHours: capacityForm.leadTime,
  workingHours:
    capacityForm.start && capacityForm.end
      ? `${capacityForm.start}-${capacityForm.end}`
      : "",
  weekendService: bit(capacityToggles[1].enabled || capacityToggles[2].enabled),
  saturdayService: bit(capacityToggles[1].enabled),
  sundayService: bit(capacityToggles[2].enabled),
  publicHolidayService: bit(capacityToggles[3].enabled),
  sameDayBooking: bit(capacityToggles[4].enabled),
  emergencyService: bit(capacityToggles[5].enabled),
  servicesProvided: servicesProvided.value || null,
  ...(expectedServicesKnown.value
    ? {
        expectedServiceCategoryIds: categoryIdPayload(expectedServiceIds.value),
        expectedServiceRemark: expectedServiceRemark.value.trim() || null,
      }
    : {}),
  dubaiServiceAreas: dubaiServiceAreas.value || null,
  ...(individualSupplier.value
    ? {}
    : {
        emaarOnboarded: asYesNo(emaarOnboarded.value),
        nakheelOnboarded: asYesNo(nakheelOnboarded.value),
        dubaiHoldingsOnboarded: asYesNo(dubaiHoldingsOnboarded.value),
        otherCommunityOnboarded: asYesNo(otherCommunityOnboarded.value),
        applyRenmark:
          asYesNo(otherCommunityOnboarded.value) === 1
            ? applyRenmark.value.trim() || null
            : null,
      }),
  status,
  areaIds,
  extra: {
    ...profileExtra.value,
    licenseIssuedBy: companyForm.licenseIssuedBy || null,
    licenseIssuedByOther:
      companyForm.licenseIssuedBy === LICENSE_AUTHORITY_OTHER
        ? companyForm.licenseIssuedByOther.trim() || null
        : null,
    bank: {
      accountName: bankForm.accountName.trim(),
      bankName:
        bankForm.bankName === BANK_OTHER
          ? bankForm.bankNameOther.trim()
          : bankForm.bankName.trim(),
      iban: bankForm.iban.replace(/\s+/g, "").toUpperCase(),
      swift: bankForm.swift.replace(/\s+/g, "").toUpperCase(),
      currency: "AED",
    },
    tradeLicenseFiles: [...tradeLicenseFiles.value],
    otherDocuments: [...otherDocumentFiles.value],
    vatFile: [...vatCertificateFiles.value],
    documentNames: { ...documentNames.value },
  },
})

const applyProfile = (detail: any) => {
  supplierRecordId.value = detail?.id ?? null
  const status =
    detail?.status == null || detail?.status === ""
      ? null
      : Number(detail.status)
  onboardingStatus.value = Number.isFinite(status) ? status : null
  if (onboardingStatus.value === 1 || detail?.editable === false) profileEditable.value = false
  else if (detail?.editable === true) profileEditable.value = true
  else profileEditable.value = true
  snapshotVersion.value =
    detail?.snapshotVersion == null || detail?.snapshotVersion === ""
      ? null
      : Number(detail.snapshotVersion)
  supplierEnabled.value = Number(detail?.enabled) === 1
  supplierAcceptDispatch.value =
    detail?.acceptDispatch == null ? true : Number(detail.acceptDispatch) === 1
  rejectReason.value = detail?.rejectReason || ""
  const supplierType = Number(detail?.supplierType) === 2 ? 2 : 1
  companyForm.supplierType = supplierType
  companyForm.fullName = supplierType === 2 ? String(detail?.fullName || detail?.companyName || "") : ""
  companyForm.dateOfBirth = isoDay(detail?.dateOfBirth)
  companyForm.nationality = detail?.nationality || ""
  companyForm.residentialCity = detail?.residentialCity || ""
  companyForm.companyName = supplierType === 2 ? companyForm.fullName : detail?.companyName || ""
  companyForm.licenseNo = detail?.tradeLicenseNo || ""
  const savedAuthority = String(
    (detail?.extra && detail.extra.licenseIssuedBy) || "",
  )
  const savedAuthorityOther = String(
    (detail?.extra && detail.extra.licenseIssuedByOther) || "",
  )
  if (
    savedAuthority === LICENSE_AUTHORITY_OTHER ||
    (savedAuthority && !licenseAuthorityValues.has(savedAuthority))
  ) {
    companyForm.licenseIssuedBy = LICENSE_AUTHORITY_OTHER
    companyForm.licenseIssuedByOther =
      savedAuthority === LICENSE_AUTHORITY_OTHER
        ? savedAuthorityOther
        : savedAuthority
  } else {
    companyForm.licenseIssuedBy = savedAuthority
    companyForm.licenseIssuedByOther = ""
  }
  companyForm.licenseExpiry = detail?.licenseExpiry || ""
  companyForm.trn = detail?.vatTrn || ""
  companyForm.years = detail?.yearsInBusiness || 0
  companyForm.address = detail?.officeAddress || ""
  companyForm.contact = detail?.contactPerson || ""
  companyForm.email = detail?.email || ""
  const mobilePhone = splitPhone(detail?.mobile)
  const whatsappPhone = splitPhone(detail?.whatsapp)
  companyForm.mobileCode = mobilePhone.code
  companyForm.mobile = mobilePhone.local
  companyForm.whatsappCode = whatsappPhone.code
  companyForm.whatsapp = whatsappPhone.local
  whatsappSame.value =
    Boolean(companyForm.mobile) &&
    companyForm.mobileCode === companyForm.whatsappCode &&
    companyForm.mobile === companyForm.whatsapp
  const extra =
    detail?.extra && typeof detail.extra === "object" ? detail.extra : {}
  const bank = extra.bank && typeof extra.bank === "object" ? extra.bank : {}
  profileExtra.value = { ...extra }
  documentNames.value =
    extra.documentNames && typeof extra.documentNames === "object"
      ? { ...extra.documentNames }
      : {}
  bankForm.accountName = String(bank.accountName || "")
  const savedBank = String(bank.bankName || "")
  if (savedBank && !UAE_BANKS.includes(savedBank)) {
    bankForm.bankName = BANK_OTHER
    bankForm.bankNameOther = savedBank
  } else {
    bankForm.bankName = savedBank
    bankForm.bankNameOther = ""
  }
  bankForm.iban = String(bank.iban || "")
  bankForm.swift = String(bank.swift || "")
  bankForm.currency = "AED"
  tradeLicenseFiles.value = asFileList(extra.tradeLicenseFiles)
  otherDocumentFiles.value = asFileList(extra.otherDocuments)
  vatCertificateFiles.value = asFileList(extra.vatFile)
  if (!profileEditable.value) {
    profileView.value = "all"
    profileFromAll.value = false
  } else if (!profileBooted.value) {
    profileView.value = "section"
    profileSection.value = 0
    profileBooted.value = true
  }
  capacityForm.workers = detail?.totalAvailableWorkers || 0
  capacityForm.leadTime = detail?.minLeadTimeHours || 0
  const hours = String(detail?.workingHours || "").split("-")
  capacityForm.start = hours[0] || "08:00"
  capacityForm.end = hours[1] || "18:00"
  const legacyWeekend =
    detail?.weekendService == null || detail?.weekendService === ""
      ? true
      : Number(detail.weekendService) === 1
  capacityToggles[1].enabled =
    detail?.saturdayService == null || detail?.saturdayService === ""
      ? legacyWeekend
      : Number(detail.saturdayService) === 1
  capacityToggles[2].enabled =
    detail?.sundayService == null || detail?.sundayService === ""
      ? legacyWeekend
      : Number(detail.sundayService) === 1
  capacityToggles[0].enabled =
    capacityToggles[1].enabled || capacityToggles[2].enabled
  capacityToggles[3].enabled = detail?.publicHolidayService === 1
  capacityToggles[4].enabled = detail?.sameDayBooking === 1
  capacityToggles[5].enabled = detail?.emergencyService === 1
  complianceItems[0].enabled = detail?.publicLiabilityInsurance === 1
  complianceItems[0].files = asFileList(detail?.publicLiabilityInsuranceFile)
  complianceItems[1].enabled = detail?.employeeInsurance === 1
  complianceItems[1].files = asFileList(detail?.employeeInsuranceFile)
  complianceItems[2].enabled = detail?.taxInvoiceAvailable === 1
  complianceItems[3].enabled = detail?.ownEquipment === 1
  wearUniform.value =
    detail?.wearUniform === 1 ? 1 : detail?.wearUniform === 0 ? 0 : null
  ownTransportation.value = detail?.ownTransportation === 1
  femaleStaffCount.value = detail?.femaleStaffCount || 0
  maleStaffCount.value = detail?.maleStaffCount || 0
  servicesProvided.value = detail?.servicesProvided || ""
  applyExpectedServices(detail)
  dubaiServiceAreas.value = detail?.dubaiServiceAreas || ""
  emaarOnboarded.value = asYesNo(detail?.emaarOnboarded)
  nakheelOnboarded.value = asYesNo(detail?.nakheelOnboarded)
  dubaiHoldingsOnboarded.value = asYesNo(detail?.dubaiHoldingsOnboarded)
  otherCommunityOnboarded.value = asYesNo(detail?.otherCommunityOnboarded)
  applyRenmark.value =
    otherCommunityOnboarded.value === 1
      ? String(detail?.applyRenmark || "")
      : ""
  supplierAreas.value = (detail?.serviceAreas || [])
    .map((area: any) => ({
      areaId: Number(area.areaId),
      areaName: area.areaName || "",
      status: area.status,
    }))
    .filter((area: SupplierArea) => area.areaId)
  selectedAreaIds.value = supplierAreas.value.map((area) => area.areaId)
  const savedCoverage = extra?.coveredCommunityIds
  coveredCommunityIds.value = Array.isArray(savedCoverage)
    ? savedCoverage
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isFinite(id) && id > 0)
    : null
  if (
    ["service-area", "availability", "coverage-availability"].includes(
      section.value,
    )
  )
    ensureAreaCatalog()
}

const loadSupplierDetail = async (id: number, fresh = false) => {
  const detail = await session.supplierDetail(id, fresh)
  applyProfile(detail)
  await Promise.all([
    section.value === "package-pricing" ? loadPackageWorkspace() : loadCatalog(fresh),
    section.value === "package-pricing" ? Promise.resolve() : loadQuotes(fresh),
    section.value === "orders" ? loadOrders() : Promise.resolve(),
  ])
}

const reloadOwnProfile = async () => {
  try {
    const detail = unwrap(await onboardingMine())
    if (!detail?.id) throw new Error("empty")
    applyProfile(detail)
    session.rememberSupplierDetail(detail)
    await Promise.all([
      section.value === "package-pricing" ? loadPackageWorkspace() : loadCatalog(),
      section.value === "package-pricing" ? Promise.resolve() : loadQuotes(),
      section.value === "orders" ? loadOrders() : Promise.resolve(),
    ])
  } catch {
    if (!supplierRecordId.value)
      throw new Error(t("admin.supplierProfile.loadFailed"))
    await loadSupplierDetail(supplierRecordId.value, true)
  }
}

const applyOperations = (operations: any) => {
  if (
    !operations ||
    typeof operations !== "object" ||
    Array.isArray(operations)
  )
    return
  const coverage = operations.coverage
  if (coverage && typeof coverage === "object") {
    if (Array.isArray(coverage.areaIds)) {
      selectedAreaIds.value = coverage.areaIds
        .map(Number)
        .filter((id: number) => id > 0)
      supplierAreas.value = selectedAreaIds.value.map((areaId) => ({
        areaId,
        areaName:
          (coverage.areas || []).find(
            (area: any) => Number(area.areaId) === areaId,
          )?.areaName || areaNameById(areaId),
      }))
    }
    if (Array.isArray(coverage.communityIds))
      coveredCommunityIds.value = coverage.communityIds
        .map(Number)
        .filter((id: number) => id > 0)
    independentOperationsReady.value = true
    if (supplierRecordId.value) {
      session.patchSupplierDetail(supplierRecordId.value, {
        serviceAreas: supplierAreas.value.map((area) => ({
          areaId: area.areaId,
          areaName: area.areaName,
          status: area.status,
        })),
      })
    }
  }
}
const loadOwnOperations = async () => {
  if (!supplierRecordId.value) return
  if (!supplierOperationsApiEnabled) {
    independentOperationsReady.value = false
    return
  }
  try {
    const operations = unwrap(await supplierOperationsMine())
    independentOperationsReady.value = true
    applyOperations(operations)
  } catch {
    independentOperationsReady.value = false
    // Older servers still expose draft operational fields in onboarding details.
    // Submitted profiles never fall back to a full onboarding write.
  }
}

const requireIndependentOperations = () => {
  if (independentOperationsReady.value) return true
  ElMessage.warning(t("admin.supplierPortal.operationsUnavailable"))
  return false
}

const loadCurrentSupplier = async () => {
  const me = await session.currentUser()
  supplierNo.value = String(me?.supplierNo || "")
  const supplierId = Number(me?.supplierId || 0)
  if (!supplierId) {
    ElMessage.warning(t("admin.supplierProfile.noSupplier"))
    return
  }
  supplierRecordId.value = supplierId
  await reloadOwnProfile()
  if (
    [
      "overview",
      "coverage-availability",
      "service-area",
      "availability",
    ].includes(section.value)
  )
    await loadOwnOperations()
  if (section.value === "overview") ensureAreaCatalog()
  if (section.value === "profile") await loadCatalog()
}

const toggleAcceptDispatch = async (next: boolean) => {
  if (!supplierRecordId.value || dispatchSaving.value) return
  const previous = supplierAcceptDispatch.value
  supplierAcceptDispatch.value = next
  dispatchSaving.value = true
  try {
    await supplierChangeAcceptDispatch({
      id: supplierRecordId.value,
      acceptDispatch: next ? 1 : 0,
    })
    session.patchSupplierDetail(supplierRecordId.value, {
      acceptDispatch: next ? 1 : 0,
    })
    ElMessage.success(t("admin.supplierAvailability.dispatchSaved"))
  } catch (error: any) {
    supplierAcceptDispatch.value = previous
    ElMessage.error(
      error?.message || t("admin.supplierAvailability.dispatchFailed"),
    )
  } finally {
    dispatchSaving.value = false
  }
}

const toggleServiceAccept = async (row: SavedService) => {
  if (!supplierRecordId.value || acceptOrderSaving.value != null) return
  const next: 0 | 1 = row.acceptOrder === 0 ? 1 : 0
  const previous = savedServices.value.map((service) => ({ ...service }))
  savedServices.value = savedServices.value.map((service) =>
    service.spuId === row.spuId ? { ...service, acceptOrder: next } : service,
  )
  acceptOrderSaving.value = row.spuId
  try {
    await supplierChangeAcceptOrder({
      supplierId: supplierRecordId.value,
      spuId: row.spuId,
      acceptOrder: next,
    })
    ElMessage.success(
      t(
        next === 1
          ? "admin.supplierPricing.acceptEnabled"
          : "admin.supplierPricing.acceptDisabled",
      ),
    )
  } catch (error: any) {
    savedServices.value = previous
    ElMessage.error(error?.message || t("admin.supplierPricing.acceptFailed"))
  } finally {
    acceptOrderSaving.value = null
  }
}

const removeSavedService = async (row: SavedService) => {
  if (!supplierRecordId.value || removingServiceId.value != null) return
  const name = serviceTitle(row.name, row.spuNameI18n)
  try {
    await ElMessageBox.confirm(
      t("admin.supplierPricing.removeConfirm", { name }),
      t("admin.supplierPricing.removeTitle"),
      {
        type: "warning",
        confirmButtonText: t("admin.supplierPricing.removeTitle"),
      },
    )
  } catch {
    return
  }
  removingServiceId.value = row.spuId
  try {
    await removeSupplierService({
      supplierId: supplierRecordId.value,
      spuId: row.spuId,
    })
    selectedQuoteSpuIds.value = selectedQuoteSpuIds.value.filter(
      (id) => id !== row.spuId,
    )
    if (quoteDialog.spuId === row.spuId && quoteDialog.visible)
      closeServiceQuote()
    await Promise.all([loadCatalog(true), loadQuotes(true)])
    ElMessage.success(t("admin.supplierPricing.removed"))
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPricing.removeFailed"))
  } finally {
    removingServiceId.value = null
  }
}

const uaeLocalOk = (value: string) => nationalNumberOk(value)
const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}
const isoDay = (value: unknown) => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value || "").trim())
  return match ? match[1] : ""
}
const disableLicenseDate = (date: Date) =>
  date.getTime() <= startOfToday().getTime()
const disableBirthDate = (date: Date) => date.getTime() > startOfToday().getTime()
const mobileLicenseMin = computed(() => {
  const next = startOfToday()
  next.setDate(next.getDate() + 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
})
const mobileBirthMax = computed(() => {
  const today = startOfToday()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
})
const birthNotFuture = (value: string) => {
  const day = isoDay(value)
  if (!day) return false
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return false
  const picked = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return picked.getTime() <= startOfToday().getTime()
}
const licenseAfterToday = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const picked = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  return picked.getTime() > startOfToday().getTime()
}
const profileProblem = (status: number) => {
  if (status === 1) return profileIssues.value[0]?.message || ""
  if (
    individualSupplier.value &&
    companyForm.dateOfBirth &&
    !birthNotFuture(companyForm.dateOfBirth)
  )
    return t("admin.supplierProfile.birthHint")
  if (
    !individualSupplier.value &&
    companyForm.licenseExpiry &&
    !licenseAfterToday(companyForm.licenseExpiry)
  )
    return t("admin.supplierProfile.licenseExpiryHint")
  if (
    (companyForm.mobile || companyForm.whatsapp) &&
    (!uaeLocalOk(companyForm.mobile) || !uaeLocalOk(companyForm.whatsapp))
  ) {
    return t("admin.supplierProfile.phoneInvalid")
  }
  return ""
}

const profileIssues = computed(() => {
  const issues: Array<{
    id: string
    section: number
    label: string
    message: string
  }> = []
  const add = (
    id: string,
    section: number,
    label: string,
    ok: boolean,
    message: string,
  ) => {
    if (!ok) issues.push({ id, section, label, message })
  }
  if (individualSupplier.value) {
    add(
      "fullName",
      0,
      t("admin.supplierProfile.fullName"),
      Boolean(companyForm.fullName.trim()),
      t("admin.supplierProfile.namePersonalRequired"),
    )
    add(
      "dateOfBirth",
      0,
      t("admin.supplierProfile.dateOfBirth"),
      birthNotFuture(companyForm.dateOfBirth),
      companyForm.dateOfBirth
        ? t("admin.supplierProfile.birthHint")
        : t("admin.supplierProfile.birthRequired"),
    )
    add(
      "nationality",
      0,
      t("admin.supplierProfile.nationality"),
      Boolean(companyForm.nationality.trim()),
      t("admin.supplierProfile.nationalityRequired"),
    )
    add(
      "residentialCity",
      0,
      t("admin.supplierProfile.residentialCity"),
      Boolean(companyForm.residentialCity.trim()),
      t("admin.supplierProfile.cityRequired"),
    )
  } else {
    add(
      "companyName",
      0,
      t("admin.supplierProfile.companyName"),
      Boolean(companyForm.companyName.trim()),
      t("admin.supplierProfile.nameRequired"),
    )
    add(
      "licenseNo",
      0,
      t("admin.supplierProfile.licenseNo"),
      Boolean(companyForm.licenseNo.trim()),
      t("admin.supplierProfile.licenseRequired"),
    )
    add(
      "licenseIssuedBy",
      0,
      t("admin.supplierProfile.licenseIssuedBy"),
      Boolean(companyForm.licenseIssuedBy.trim()),
      t("admin.supplierProfile.licenseIssuedByRequired"),
    )
    add(
      "licenseIssuedByOther",
      0,
      t("admin.supplierProfile.licenseIssuedBy"),
      companyForm.licenseIssuedBy !== LICENSE_AUTHORITY_OTHER ||
        Boolean(companyForm.licenseIssuedByOther.trim()),
      t("admin.supplierProfile.licenseIssuedByOtherRequired"),
    )
    add(
      "licenseExpiry",
      0,
      t("admin.supplierProfile.licenseExpiry"),
      licenseAfterToday(companyForm.licenseExpiry),
      t("admin.supplierProfile.licenseExpiryHint"),
    )
    add(
      "address",
      0,
      t("admin.supplierProfile.address"),
      Boolean(companyForm.address.trim()),
      t("admin.supplierProfile.addressRequired"),
    )
    add(
      "contact",
      1,
      t("admin.supplierProfile.contactPerson"),
      Boolean(companyForm.contact.trim()),
      t("admin.supplierProfile.contactRequired"),
    )
  }
  add(
    "email",
    1,
    t("admin.supplierProfile.email"),
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.email.trim()),
    t("admin.supplierProfile.emailRequired"),
  )
  add(
    "mobile",
    1,
    t("admin.supplierProfile.mobile"),
    uaeLocalOk(companyForm.mobile),
    t("admin.supplierProfile.phoneInvalid"),
  )
  add(
    "whatsapp",
    1,
    t("admin.supplierProfile.whatsapp"),
    whatsappSame.value
      ? uaeLocalOk(companyForm.mobile)
      : uaeLocalOk(companyForm.whatsapp),
    t("admin.supplierProfile.whatsappRequired"),
  )
  if (!individualSupplier.value) {
    add(
      "communities",
      2,
      t("admin.supplierProfile.applyRenmark"),
      asYesNo(otherCommunityOnboarded.value) !== 1 ||
        Boolean(applyRenmark.value.trim()),
      t("admin.supplierProfile.communityRequired"),
    )
  }
  add(
    "accountName",
    3,
    t("admin.supplierProfile.accountName"),
    Boolean(bankForm.accountName.trim()),
    t("admin.supplierPortal.requiredField", {
      field: t("admin.supplierProfile.accountName"),
    }),
  )
  add(
    "bankName",
    3,
    t("admin.supplierProfile.bankName"),
    Boolean(bankForm.bankName.trim()),
    t("admin.supplierPortal.requiredField", {
      field: t("admin.supplierProfile.bankName"),
    }),
  )
  add(
    "bankNameOther",
    3,
    t("admin.supplierProfile.bankName"),
    bankForm.bankName !== BANK_OTHER || Boolean(bankForm.bankNameOther.trim()),
    t("admin.supplierPortal.requiredField", {
      field: t("admin.supplierProfile.bankName"),
    }),
  )
  add(
    "iban",
    3,
    t("admin.supplierProfile.iban"),
    ibanValid(bankForm.iban),
    bankForm.iban.trim()
      ? t("admin.supplierProfile.ibanInvalid")
      : t("admin.supplierPortal.requiredField", {
          field: t("admin.supplierProfile.iban"),
        }),
  )
  add(
    "swift",
    3,
    t("admin.supplierProfile.swift"),
    swiftValid(bankForm.swift),
    t("admin.supplierProfile.swiftInvalid"),
  )
  if (!individualSupplier.value) {
    add(
      "tradeLicense",
      3,
      t("admin.supplierProfile.tradeLicenseFile"),
      tradeLicenseFiles.value.length > 0,
      t("admin.supplierProfile.tradeFileRequired"),
    )
  }
  add(
    "bankCertificate",
    3,
    t("admin.supplierProfile.otherDocuments"),
    otherDocumentFiles.value.length > 0,
    t("admin.supplierProfile.bankCertificateRequired"),
  )
  return issues
})
const issueOf = (id: string) =>
  profileIssues.value.find((item) => item.id === id)?.message || ""
const sectionHasIssue = (index: number) =>
  profileIssues.value.some((item) => item.section === index)
const lightboxTitle = computed(() =>
  profileView.value === "all"
    ? profileDisplayName.value || t("admin.supplierProfile.untitled")
    : activeProfileSection.value.title,
)
const lightboxDesc = computed(() =>
  profileView.value === "all"
    ? t("admin.supplierProfile.allDesc")
    : activeProfileSection.value.desc,
)
const lightboxCrumb = computed(() => {
  if (profileView.value === "all") return t("admin.supplierProfile.title")
  if (profileFromAll.value) return t("admin.supplierProfile.editingCrumb")
  const current = profileSection.value === 1 ? 0 : profileSection.value
  const position = profileNav.value.findIndex((item) => item.index === current)
  return t("admin.supplierProfile.stepOf", {
    current: Math.max(position, 0) + 1,
    total: profileNav.value.length,
  })
})
const bankComplete = computed(() =>
  Boolean(
    bankForm.accountName.trim() &&
    (bankForm.bankName === BANK_OTHER
      ? bankForm.bankNameOther.trim()
      : bankForm.bankName.trim()) &&
    ibanValid(bankForm.iban) &&
    swiftValid(bankForm.swift),
  ),
)
const profileStepIncomplete = (index: number) =>
  index === 0
    ? sectionHasIssue(0) || sectionHasIssue(1)
    : sectionHasIssue(index)
const profileStepLabel = (index: number) => {
  const incomplete = profileStepIncomplete(index)
  if (onboardingStatus.value === 1) {
    return t(
      incomplete
        ? "admin.supplierProfile.changesRequired"
        : "admin.supplierProfile.submittedStep",
    )
  }
  if (onboardingStatus.value === 2 && !incomplete)
    return t("admin.supplierProfile.verified")
  if (onboardingStatus.value === 3)
    return t("admin.supplierProfile.changesRequired")
  if (incomplete) return t("admin.supplierPortal.actionRequired")
  return t("admin.supplierProfile.filled")
}
const sectionIncomplete = (index: number) => profileStepIncomplete(index)
const lightboxChip = computed(() => {
  if (profileView.value === "all" && onboardingStatus.value === 1)
    return t("admin.supplierProfile.submittedChip")
  if (profileView.value === "all" && !profileEditable.value)
    return t("admin.supplierProfile.submittedChip")
  const current = profileSection.value === 1 ? 0 : profileSection.value
  const bad =
    profileView.value === "all"
      ? profileIssues.value.length > 0 || !bankComplete.value
      : profileStepIncomplete(current)
  if (bad) return t("admin.supplierProfile.needsFix")
  return profileStepLabel(current)
})
const lightboxChipClass = computed(() => {
  if (profileView.value === "all" && !profileEditable.value) return "is-wait"
  const bad =
    profileView.value === "all"
      ? profileIssues.value.length > 0 || !bankComplete.value
      : sectionIncomplete(profileSection.value)
  return bad ? "is-warn" : "is-ok"
})
const insuranceDocs = computed(() => [
  {
    id: "public" as const,
    label: t("admin.supplierProfile.publicLiability"),
    files: complianceItems[0].files,
  },
  ...(individualSupplier.value
    ? []
    : [
        {
          id: "employee" as const,
          label: t("admin.supplierProfile.employeeInsurance"),
          files: complianceItems[1].files,
        },
      ]),
])
const jumpProfileField = async (issue: { section: number; id: string }) => {
  profileFromAll.value = false
  profileView.value = "section"
  profileSection.value = issue.section
  await nextTick()
  const field = document.getElementById(`profile-field-${issue.id}`)
  field?.scrollIntoView({ behavior: "smooth", block: "center" })
  field
    ?.querySelector<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled]), button:not([disabled])",
    )
    ?.focus({ preventScroll: true })
}
const submitProfileForm = async () => {
  if (saving.value) return
  if (!profileEditable.value) {
    ElMessage.warning(t("admin.supplierProfile.locked"))
    return
  }
  submitTried.value = true
  const firstIssue = profileIssues.value[0]
  if (firstIssue) {
    ElMessage.warning(firstIssue.message)
    await jumpProfileField(firstIssue)
    return
  }
  if (needsResubmit.value) return resubmitProfile()
  return saveProfile(1)
}
type ProfileDocId = "trade" | "public" | "employee" | "other" | "vat"
const docFiles = (id: ProfileDocId) => {
  if (id === "trade") return tradeLicenseFiles.value
  if (id === "other") return otherDocumentFiles.value
  if (id === "vat") return vatCertificateFiles.value
  return id === "public" ? complianceItems[0].files : complianceItems[1].files
}
const removeDocFile = (id: ProfileDocId, index: number) => {
  docFiles(id).splice(index, 1)
}

const resubmitProfile = async () => {
  if (!profileEditable.value) {
    ElMessage.warning(t("admin.supplierProfile.locked"))
    return
  }
  const problem = profileProblem(1)
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  saving.value = true
  try {
    const result = unwrap(await onboardingResubmit(buildProfilePayload(1)))
    if (result && typeof result === "object" && result.unchanged) {
      await ElMessageBox.alert(
        t("admin.supplierProfile.unchanged"),
        t("admin.common.confirmTitle"),
        { type: "info" },
      ).catch(() => {})
      return
    }
    ElMessage.success(t("admin.supplierProfile.resubmitted"))
    await reloadOwnProfile()
    profileSubmittedOpen.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierProfile.saveFailed"))
  } finally {
    saving.value = false
  }
}

const saveProfile = async (status: number) => {
  if (!profileEditable.value) {
    ElMessage.warning(t("admin.supplierProfile.locked"))
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
    ElMessage.success(
      t(
        status === 1
          ? "admin.supplierProfile.submitted"
          : "admin.supplierProfile.draftSaved",
      ),
    )
    if (supplierRecordId.value)
      await loadSupplierDetail(supplierRecordId.value, true)
    if (status === 1) profileSubmittedOpen.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierProfile.saveFailed"))
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
      throw new Error(t("admin.supplierProfile.uploadLimit"))
    }
    const url = unwrap(await uploadFile(options.file as File))
    const fileUrl = typeof url === "string" ? url : url?.url || ""
    if (target && fileUrl && !target.files.includes(fileUrl))
      target.files.push(fileUrl)
    options.onSuccess?.(url)
    ElMessage.success(t("admin.supplierProfile.uploaded"))
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || t("admin.supplierProfile.uploadFailed"))
  }
}

const uploadDocFile = async (id: ProfileDocId, options: any) => {
  if (docUploading(id)) return
  try {
    const file = options.file as File
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || file.size > 10 * 1024 * 1024)
      throw new Error(t("admin.supplierPortal.fileInvalid"))
    const files = docFiles(id)
    if (files.length >= 20)
      throw new Error(t("admin.supplierProfile.uploadLimit"))
    setDocUploadProgress(id, 0)
    const url = unwrap(
      await uploadFile(file, (percent) => {
        setDocUploadProgress(id, percent)
        options.onProgress?.({ percent })
      }),
    )
    const fileUrl = typeof url === "string" ? url : url?.url || ""
    if (fileUrl && !files.includes(fileUrl)) files.push(fileUrl)
    if (fileUrl) documentNames.value[fileUrl] = file.name
    options.onSuccess?.(url)
    ElMessage.success(t("admin.supplierProfile.uploaded"))
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || t("admin.supplierProfile.uploadFailed"))
  } finally {
    clearDocUploadProgress(id)
  }
}

const loadCommunityRecords = async (areaId: number) => {
  const rows: AreaCommunity[] = []
  let pageNum = 1
  let total = Number.POSITIVE_INFINITY
  while (rows.length < total && pageNum <= 8) {
    const page = unwrap(
      await serviceCommunityPage({ areaId, pageNum, pageSize: 200, status: 1 }),
    )
    const list = Array.isArray(page?.list) ? page.list : []
    total = Number(page?.total ?? list.length)
    rows.push(
      ...list
        .map((item: any) => ({
          id: Number(item.id),
          name: String(item.name || ""),
        }))
        .filter((item: AreaCommunity) => item.id),
    )
    if (!list.length) break
    pageNum += 1
  }
  return rows
}

let areaCatalogChain: Promise<void> = Promise.resolve()
const loadMissingAreas = async () => {
  editorLoading.value = true
  try {
    if (!platformAreas.value.length)
      platformAreas.value = await session.serviceAreas()
    const wanted = new Set<number>()
    platformAreas.value.forEach((area) => {
      const id = Number(area.id)
      if (id) wanted.add(id)
    })
    supplierAreas.value.forEach((area) => {
      if (area.areaId) wanted.add(area.areaId)
    })
    const missing = [...wanted].filter(
      (id) => communitiesByArea.value[id] == null,
    )
    if (missing.length) {
      const loaded = await Promise.all(
        missing.map(
          async (areaId) =>
            [areaId, await loadCommunityRecords(areaId)] as const,
        ),
      )
      const next = { ...communitiesByArea.value }
      loaded.forEach(([areaId, communities]) => {
        next[areaId] = communities
      })
      communitiesByArea.value = next
    }
    areaCatalogReady.value = true
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierArea.loadFailed"))
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
    ElMessage.warning(t("admin.supplierArea.saveProfileFirst"))
    return
  }
  areaKeyword.value = ""
  expandedAreaIds.value = []
  areaEditorVisible.value = true
  await ensureAreaCatalog()
  seedAreaDraft()
}

const areaNameById = (id: number) => {
  const platform = platformAreas.value.find((area) => Number(area.id) === id)
  if (platform?.name) return String(platform.name)
  return supplierAreas.value.find((area) => area.areaId === id)?.areaName || ""
}

const chosenAreaIds = () => {
  const picked = new Set(draftCommunityIds.value)
  return areaCatalog.value
    .filter((area) => {
      const communities = communitiesByArea.value[area.id] || []
      if (!communities.length) return draftBareAreaIds.value.includes(area.id)
      return communities.some((community) => picked.has(community.id))
    })
    .map((area) => area.id)
}

const saveAreas = async () => {
  if (!supplierRecordId.value || saving.value) return
  if (!profileDisplayName.value) {
    ElMessage.warning(t("admin.supplierArea.profileRequired"))
    return
  }
  if (
    (onboardingStatus.value !== 0 || !profileEditable.value) &&
    !requireIndependentOperations()
  )
    return
  const areaIds = chosenAreaIds()
  const previousAreas = dubaiServiceAreas.value
  const previousExtra = profileExtra.value
  const previousCovered = coveredCommunityIds.value
  dubaiServiceAreas.value = areaIds.map(areaNameById).filter(Boolean).join(", ")
  profileExtra.value = {
    ...profileExtra.value,
    coveredCommunityIds: [...draftCommunityIds.value],
  }
  coveredCommunityIds.value = [...draftCommunityIds.value]
  saving.value = true
  try {
    if (
      independentOperationsReady.value ||
      onboardingStatus.value !== 0 ||
      !profileEditable.value
    ) {
      const saved = unwrap(
        await supplierCoverageSave({
          supplierId: supplierRecordId.value,
          areaIds,
          communityIds: [...draftCommunityIds.value],
        }),
      )
      supplierAreas.value = areaIds.map((areaId) => ({
        areaId,
        areaName: areaNameById(areaId),
      }))
      selectedAreaIds.value = areaIds
      applyOperations(saved)
    } else {
      const id = unwrap(await onboardingSave(buildProfilePayload(0, areaIds)))
      if (id) supplierRecordId.value = Number(id)
      await loadSupplierDetail(supplierRecordId.value, true)
    }
    areaEditorVisible.value = false
    ElMessage.success(t("admin.supplierArea.saved"))
  } catch (error: any) {
    dubaiServiceAreas.value = previousAreas
    profileExtra.value = previousExtra
    coveredCommunityIds.value = previousCovered
    ElMessage.error(error?.message || t("admin.supplierArea.saveFailed"))
  } finally {
    saving.value = false
  }
}

const loadCatalog = async (fresh = false) => {
  if (!supplierRecordId.value) return
  catalogLoading.value = true
  try {
    rememberCatalog(
      mapCatalog((await session.catalog(supplierRecordId.value, fresh)) || []),
    )
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPricing.catalogFailed"))
  } finally {
    catalogLoading.value = false
  }
}

const cleanPhones = (phones: string[]) =>
  phones.map((phone) => phone.trim()).filter(Boolean)
const contactProblem = (
  name: string,
  workerCount: number | null,
  phones: string[],
) => {
  const list = cleanPhones(phones)
  if (!individualSupplier.value && !(Number(workerCount) > 0))
    return t("admin.supplierPricing.workerRequired", { name })
  if (!list.length) return t("admin.supplierPricing.phoneRequired", { name })
  if (list.length > 10) return t("admin.supplierPricing.phoneMax", { name })
  const invalid = list.find((phone) => !phoneOk(phone))
  if (invalid)
    return t("admin.supplierPricing.phoneInvalid", { name, phone: invalid })
  return ""
}
const selectedPackageServices = async (supplierId: number) => {
  const groups = unwrap(await serviceCatalog(supplierId, true))
  const kept: Array<{ categoryId: number; spuId: number; acceptOrder: 0 | 1 }> = []
  for (const group of Array.isArray(groups) ? groups : []) {
    const categoryId = Number(group?.categoryId)
    for (const service of group?.services || []) {
      const spuId = Number(service?.spuId)
      if (Number(service?.packageService) !== 1 || !service?.selected || !categoryId || !spuId) continue
      kept.push({
        categoryId,
        spuId,
        acceptOrder: Number(service.acceptOrder) === 0 ? 0 : 1,
      })
    }
  }
  return kept
}
const persistServices = async (rows: SavedService[], success: string) => {
  if (!supplierRecordId.value) return false
  const grouped = new Map<
    number,
    {
      categoryId: number
      items: Array<{
        spuId: number
        acceptOrder: 0 | 1
      }>
    }
  >()
  catalogSaving.value = true
  try {
    const keptPackageServices = await selectedPackageServices(supplierRecordId.value)
    const seen = new Set<string>()
    for (const row of [...rows, ...keptPackageServices]) {
      const key = `${row.categoryId}:${row.spuId}`
      if (seen.has(key)) continue
      seen.add(key)
      const group = grouped.get(row.categoryId) || {
        categoryId: row.categoryId,
        items: [],
      }
      group.items.push({
        spuId: row.spuId,
        acceptOrder: row.acceptOrder === 0 ? 0 : 1,
      })
      grouped.set(row.categoryId, group)
    }
    await saveServices({
      supplierId: supplierRecordId.value,
      services: [...grouped.values()],
    })
    if (success) ElMessage.success(success)
    await Promise.all([loadCatalog(true), loadQuotes(true)])
    return true
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.supplierPricing.saveServicesFailed"),
    )
    return false
  } finally {
    catalogSaving.value = false
  }
}
const contactStarted = (workerCount: number | null, phones: string[]) =>
  Number(workerCount) > 0 || cleanPhones(phones).length > 0
const saveContacts = async (
  services: Array<{ spuId: number; workerCount: number; phones: string[] }>,
  success: string,
) => {
  if (!supplierRecordId.value || !services.length) return false
  catalogSaving.value = true
  try {
    await saveServiceContacts({
      supplierId: supplierRecordId.value,
      services: services.map((service) => ({
        spuId: service.spuId,
        ...(individualSupplier.value
          ? {}
          : { workerCount: Number(service.workerCount) }),
        contactPhones: service.phones,
      })),
    })
    await Promise.all([loadCatalog(true), loadQuotes(true)])
    if (success) ElMessage.success(success)
    return true
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.supplierPricing.saveServicesFailed"),
    )
    return false
  } finally {
    catalogSaving.value = false
  }
}
const confirmAddServices = async () => {
  if (!servicePicker.drafts.length) {
    ElMessage.warning(t("admin.supplierPricing.selectFirst"))
    return
  }
  const problem = servicePicker.drafts
    .filter((draft) => contactStarted(draft.workerCount, draft.phones))
    .map((draft) => contactProblem(draft.name, draft.workerCount, draft.phones))
    .find(Boolean)
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  const ready = servicePicker.drafts.filter(
    (draft) => !contactProblem(draft.name, draft.workerCount, draft.phones),
  )
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
      workerCount: null,
      phones: [],
      acceptOrder: 1,
      available: true,
    })
  })
  const saved = await persistServices(
    next,
    ready.length
      ? ""
      : t("admin.supplierPricing.addedSuccess", {
          count: servicePicker.drafts.length,
        }),
  )
  if (!saved) return
  if (ready.length) {
    const contactsSaved = await saveContacts(
      ready.map((draft) => ({
        spuId: draft.spuId,
        workerCount: Number(draft.workerCount),
        phones: cleanPhones(draft.phones),
      })),
      t("admin.supplierPricing.addedSuccess", {
        count: servicePicker.drafts.length,
      }),
    )
    if (!contactsSaved) return
  }
  servicePicker.open = false
}
const openServiceEditor = (row: SavedService) => {
  serviceEditor.spuId = row.spuId
  serviceEditor.categoryId = row.categoryId
  serviceEditor.name = row.name
  serviceEditor.nameI18n = row.spuNameI18n
  serviceEditor.workerCount = row.workerCount
  serviceEditor.phones = row.phones.length ? [...row.phones] : [""]
  serviceEditor.open = true
}
const saveServiceEditor = async () => {
  const problem = contactProblem(
    serviceEditorTitle.value || t("admin.supplierPricing.thisService"),
    serviceEditor.workerCount,
    serviceEditor.phones,
  )
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  const saved = await saveContacts(
    [
      {
        spuId: serviceEditor.spuId,
        workerCount: Number(serviceEditor.workerCount),
        phones: cleanPhones(serviceEditor.phones),
      },
    ],
    t("admin.supplierPricing.serviceSaved"),
  )
  if (saved) serviceEditor.open = false
}
const quoteSheetName = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `supplier-quote_${supplierNo.value || supplierRecordId.value}_${stamp}.xlsx`
}
const downloadQuoteTemplate = async () => {
  if (!supplierRecordId.value || quoteExporting.value) return
  const selected = selectedQuoteSpuIds.value
  const listedIds = serviceRows.value
    .map((row) => quoteSpuId(row.spuId))
    .filter((id) => id > 0)
  const hasHidden = savedServices.value.some((service) => !serviceListed(service))
  let ids = selected
  if (!selected.length && hasHidden) {
    if (!listedIds.length) {
      ElMessage.warning(t("admin.supplierPricing.empty"))
      return
    }
    ids = listedIds
  }
  quoteExporting.value = true
  try {
    const data = await exportQuoteSheet(ids)
    const blob = data instanceof Blob ? data : new Blob([data as BlobPart])
    if (blob.type.includes("json") || blob.type.startsWith("text/")) {
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
    const link = document.createElement("a")
    link.href = url
    link.download = quoteSheetName()
    link.click()
    URL.revokeObjectURL(url)
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPricing.exportFailed"))
  } finally {
    quoteExporting.value = false
  }
}
const importQuoteFile = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (input) input.value = ""
  if (!file || !supplierRecordId.value || quoteImporting.value) return
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    ElMessage.warning(t("admin.supplierPricing.quoteFileType"))
    return
  }
  quoteImporting.value = true
  try {
    const result = (await importQuoteSheet(file)) as {
      serviceCount?: number
      skuCount?: number
      skippedCount?: number
      messages?: string[]
    }
    await loadQuotes(true)
    const summary = t("admin.supplierPricing.importDone", {
      services: result?.serviceCount ?? 0,
      skus: result?.skuCount ?? 0,
      skipped: result?.skippedCount ?? 0,
    })
    const notes = Array.isArray(result?.messages)
      ? result.messages.map((item) => String(item || "").trim()).filter(Boolean)
      : []
    if (notes.length) {
      await ElMessageBox.alert(
        [summary, ...notes].join("\n"),
        t("admin.supplierPricing.importResult"),
        { confirmButtonText: t("admin.supplierPricing.importClose") },
      )
    } else {
      ElMessage.success(summary)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPricing.importFailed"))
  } finally {
    quoteImporting.value = false
  }
}
const loadQuotes = async (fresh = false) => {
  if (!supplierRecordId.value) return
  quoteLoading.value = true
  try {
    liveQuotes.value =
      (await session.supplierQuotes(supplierRecordId.value, fresh)) || []
  } finally {
    quoteLoading.value = false
  }
}
const loadPackageWorkspace = async () => {
  if (!supplierRecordId.value) return
  catalogLoading.value = true
  quoteLoading.value = true
  try {
    const id = supplierRecordId.value
    const [catalogRes, quoteRes, noticeRes] = await Promise.all([
      supplierPackages(id),
      supplierPackageQuotes(id),
      supplierPackageShelfNotices(id),
    ])
    packageCatalog.value = Array.isArray(unwrap(catalogRes)) ? unwrap(catalogRes) : []
    const quotes = Array.isArray(unwrap(quoteRes)) ? unwrap(quoteRes) : []
    session.rememberPackageQuotes(id, quotes)
    packageFlat.value = quotes.flatMap((pkg: any) =>
      (Array.isArray(pkg?.services) ? pkg.services : []).map((service: any) => ({
        packageId: Number(pkg?.packageId),
        packageName: String(pkg?.packageName || ""),
        packageNameI18n: pkg?.nameI18n || null,
        categoryId: Number(pkg?.categoryId),
        categoryName: String(pkg?.categoryName || ""),
        categoryNameI18n: pkg?.categoryNameI18n || null,
        packageQuoteDescI18n: pkg?.supplierQuoteDescI18n || null,
        contents: Array.isArray(pkg?.contents) ? pkg.contents : [],
        service,
      })),
    )
    const shelf = unwrap(noticeRes)
    packageNotices.value = Array.isArray(shelf?.packages) ? shelf.packages : []
    packageNoticeUnread.value = shelf?.unread === true && packageNotices.value.length > 0
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPortal.loadFailed"))
  } finally {
    catalogLoading.value = false
    quoteLoading.value = false
  }
}

const quoteSpecLabel = (row: {
  specs: Record<string, unknown>
  skuCode: string
}) => {
  const parts = quoteDialog.columns
    .map((column) => {
      const text = specText(row.specs[column.key])
      return text !== "—" ? text : ""
    })
    .filter(Boolean)
  return parts.length
    ? parts.join(" · ")
    : row.skuCode || t("admin.supplierPricing.specFallback")
}
const QUOTE_PRICE_UNIT =
  /^(?:\d+(?:\.\d+)?\s*)?(?:techs?|technicians?|cleaners?|persons?|people|staff|workers?|技术员|技术人员|技师|技术|清洁工|保洁员|保洁|人)$/i
const QUOTE_PRICE_DRIVER =
  /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|bhk|sqm|sq\.?\s*m|bedrooms?|rooms?|cleaners?|techs?|technicians?|persons?|people|staff|workers?|mins?|minutes)|materials?|小时|居室|房型|平米|平方米|材料|保洁|清洁工|技术员/i
const sharedQuoteHead = (title: string) => {
  const splitAt = title.indexOf(" - ")
  if (splitAt <= 0) return null
  const head = title.slice(0, splitAt).trim()
  const tail = title.slice(splitAt + 3).trim()
  if (!head || !tail) return null
  if (QUOTE_PRICE_DRIVER.test(head) || QUOTE_PRICE_DRIVER.test(tail)) return null
  return { head, tail }
}
const quoteLineParts = (row: {
  lineLabel?: string
  specs?: Record<string, unknown>
  skuCode?: string
}) => {
  const label = String(row.lineLabel || quoteSpecLabel(row as { specs: Record<string, unknown>; skuCode: string }) || "").trim()
  const split = label.match(/^(.*\S)\s*\/\s*(\S.*?)$/)
  const unit = split?.[2]?.trim() || ""
  if (!split || !QUOTE_PRICE_UNIT.test(unit)) return { name: label, unit: "" }
  return { name: split[1].trim(), unit }
}
const quoteDisplayLines = (rows: any[], labelOf?: (row: any) => string) => {
  const titleOf = (row: any) => {
    if (labelOf) return String(labelOf(row) || "").trim()
    return quoteLineParts(row).name
  }
  const unitOf = (row: any) => (labelOf ? "" : quoteLineParts(row).unit)
  const buckets = new Map<string, { key: string; title: string; unit: string; rows: any[]; tails: string[] }>()
  const order: string[] = []
  rows.forEach((row, index) => {
    const title = titleOf(row)
    const shared = sharedQuoteHead(title)
    const key = shared
      ? `shared:${row?.groupId || ""}:${shared.head}`
      : `row:${row?.skuId ?? index}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { key, title: shared ? shared.head : title, unit: shared ? "" : unitOf(row), rows: [], tails: [] }
      buckets.set(key, bucket)
      order.push(key)
    }
    bucket.rows.push(row)
    if (shared) bucket.tails.push(shared.tail)
  })
  return order.flatMap((key) => {
    const bucket = buckets.get(key)
    if (!bucket) return []
    if (bucket.rows.length < 2) {
      const row = bucket.rows[0]
      return [{ key: `row:${row?.skuId ?? key}`, title: titleOf(row), unit: unitOf(row), rows: [row], tails: [] as string[] }]
    }
    return [bucket]
  })
}
const familyCoverText = (line: { tails?: string[] }) => {
  const tails = line.tails || []
  if (!tails.length) return ""
  const separator = String(locale.value).toLowerCase().startsWith("en") ? ", " : "、"
  return t("admin.supplierPricing.samePriceCovers", { items: tails.join(separator) })
}
const familyPrice = (line: { rows: Array<{ quotePrice?: unknown }> }) => {
  const prices = line.rows.map((row) => row.quotePrice)
  const first = prices[0]
  return prices.every((price) => String(price ?? "") === String(first ?? "")) ? (first ?? "") : ""
}
const setFamilyPrice = (line: { rows: Array<{ quotePrice?: unknown }> }, value: unknown) => {
  line.rows.forEach((row) => {
    row.quotePrice = value
  })
}
const familyEnabled = (line: { rows: Array<{ available?: boolean; enabled?: boolean }> }) =>
  line.rows.every((row) => row.available === false || row.enabled)
const setFamilyEnabled = (line: { rows: any[] }, enabled: boolean) => {
  line.rows.forEach((row) => {
    if (row.available === false || quoteLineHeld(row)) return
    row.enabled = enabled
  })
}
const familyHeld = (line: { rows: any[] }) =>
  line.rows.every((row) => row.available === false || quoteLineHeld(row))
const familyOff = (line: { rows: any[] }) =>
  line.rows.every((row) => row.available === false || !row.enabled)
const familyMissing = (line: { rows: any[] }) =>
  line.rows.some(
    (row) => optionMissingFields(row, quoteDialog.quoteMode, quoteDialog.unitPrice).length > 0,
  )
const familyFacts = (line: { rows: any[] }) => {
  const first = line.rows[0] || {}
  const same = (key: string) =>
    line.rows.every((row) => String(row?.[key] ?? "") === String(first?.[key] ?? ""))
  if (same("approvedPrice") && same("quotePrice") && same("rejectReason")) return linePriceFacts(first)
  return linePriceFacts({ ...first, approvedPrice: null, quotePrice: familyPrice(line), rejectReason: "" })
}
const familyBadge = (line: { rows: any[] }) => {
  const rejected = line.rows.find((row) => lineRejected(row))
  return quoteLineBadge(rejected || line.rows[0] || {})
}
const familyRemark = (line: { rows: Array<{ supplierFulfillRemark?: string }> }) =>
  line.rows.map((row) => String(row.supplierFulfillRemark || "").trim()).find(Boolean) || ""
const blankPositive = (value: unknown) => {
  if (value == null || value === "") return null
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}
const firstPositive = (...values: unknown[]) => {
  for (const value of values) {
    const number = blankPositive(value)
    if (number != null) return number
  }
  return null
}
const skuEnabled = (value: unknown, available = true) =>
  available !== false && (value == null || value === "" || Number(value) === 1)
const quoteItems = () =>
  quoteDialog.rows.filter((row) => row.available !== false).map((row) => {
    const hourly = unitQuoteMode(quoteDialog.quoteMode)
    const enabled = addonOnlyQuote.value
      ? row.available !== false
      : hourly
        ? row.available !== false
        : skuEnabled(row.enabled, row.available !== false)
    const quotePrice = addonOnlyQuote.value
      ? 0
      : singleRateMode(quoteDialog.quoteMode)
        ? null
        : row.quotePrice == null || row.quotePrice === ""
          ? null
          : Number(row.quotePrice)
    return {
      skuId: row.skuId,
      staffCount: blankPositive(row.staffCount) ?? 0,
      serviceHours: blankPositive(row.serviceHours) ?? 0,
      quotePrice,
      enabled: enabled ? 1 : 0,
    }
  })

const draftProblem = () => {
  if (!addonOnlyQuote.value && hourlyQuote.value && hourlyRateProblem(true)) return hourlyRateProblem(true)
  for (const item of quoteItems()) {
    if (addonOnlyQuote.value || item.enabled !== 1 || quoteDialog.quoteMode !== 1) continue
    if (item.quotePrice != null && !(item.quotePrice > 0))
      return t("admin.supplierPricing.pricePositive")
  }
  if (
    quoteDialog.attaches.some(
      (item) => item.offered && !addonPriceOk(item.quotePrice),
    )
  )
    return t("admin.supplierPricing.addonPriceInvalid")
  return ""
}

const addonPriceOk = (value: unknown) => {
  const text = String(value ?? "").trim()
  return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0
}

const mergeAttaches = (
  catalog: any[] | undefined,
  saved: any[] | undefined,
) => {
  const savedById = new Map(
    (Array.isArray(saved) ? saved : []).map((item) => [
      Number(item.attachValueId),
      item,
    ]),
  )
  const base =
    Array.isArray(catalog) && catalog.length
      ? catalog
      : Array.isArray(saved)
        ? saved
        : []
  return mapAttaches(
    base.map((item) => {
      const quote = savedById.get(Number(item.attachValueId))
      if (!quote) return item
      return {
        ...item,
        attachTypeName: quote.attachTypeName || item.attachTypeName,
        attachTypeNameI18n: quote.attachTypeNameI18n || item.attachTypeNameI18n,
        attachValueName: quote.attachValueName || item.attachValueName,
        attachValueNameI18n:
          quote.attachValueNameI18n || item.attachValueNameI18n,
        unit: quote.unit || item.unit,
        unitI18n: quote.unitI18n || item.unitI18n,
        platformPrice: quote.platformPrice ?? item.platformPrice,
        approvedPrice: quote.approvedPrice ?? null,
        canServe: quote.canServe,
        quotePrice: quote.quotePrice,
        reviewStatus: quote.reviewStatus,
        rejectReason: quote.rejectReason,
      }
    }),
  )
}

const quoteOptionSettled = (
  quote: { status?: unknown; quoteMode?: unknown } | null | undefined,
  saved: any,
) => {
  if (!quote || !saved) return false
  const rejected =
    Number(saved.reviewStatus) === 3 || String(saved.rejectReason || "").trim()
  if (rejected) return false
  const approved = Number(quote.status) === 2 || Number(saved.reviewStatus) === 2
  if (!approved) return false
  if (saved.enabled != null && Number(saved.enabled) === 0) return false
  const hourly = Number(quote.quoteMode) === 2 || Number(quote.quoteMode) === 3
  const price = Number(saved.quotePrice)
  if (Number.isFinite(price) && price > 0) return true
  return hourly && saved.skuId != null
}
const attachSettled = (item: any) => {
  const rejected =
    Number(item?.reviewStatus) === 3 || String(item?.rejectReason || "").trim()
  if (rejected) return false
  const approved =
    Number(quoteDialog.status) === 2 || Number(item?.reviewStatus) === 2
  if (!approved) return false
  const price = Number(item?.quotePrice)
  return Number.isFinite(price) && price > 0
}
const addonQuoted = (item: { canServe?: unknown; quotePrice?: unknown }) =>
  item?.canServe === true ||
  (item?.quotePrice != null && item.quotePrice !== "")
const mapAttaches = (list: any[]) => {
  const rows = Array.isArray(list) ? list : []
  const keepSavedSelection = rows.some(addonQuoted)
  return rows.map((item) => ({
    attachValueId: Number(item.attachValueId),
    typeId: Number(item.attachTypeId) || 0,
    typeName: item.attachTypeName ? String(item.attachTypeName) : "",
    typeNameI18n:
      item.attachTypeNameI18n && typeof item.attachTypeNameI18n === "object"
        ? item.attachTypeNameI18n
        : null,
    name: item.attachValueName ? String(item.attachValueName) : "",
    nameI18n:
      item.attachValueNameI18n && typeof item.attachValueNameI18n === "object"
        ? item.attachValueNameI18n
        : null,
    unit: item.unit ? String(item.unit) : "",
    unitI18n:
      item.unitI18n && typeof item.unitI18n === "object" ? item.unitI18n : null,
    platformPrice: item.platformPrice ?? null,
    approvedPrice: item.approvedPrice ?? null,
    reviewStatus:
      Number(item.reviewStatus) === 2 || Number(item.reviewStatus) === 3
        ? Number(item.reviewStatus)
        : undefined,
    rejectReason: item.rejectReason ? String(item.rejectReason) : "",
    acceptBand: acceptBandName(item.acceptBand) ? Number(item.acceptBand) : null,
    settled: attachSettled(item),
    offered: keepSavedSelection ? addonQuoted(item) : true,
    quotePrice:
      item.quotePrice == null || item.quotePrice === ""
        ? ""
        : String(item.quotePrice),
  }))
}

const toggleAttach = (
  item: { offered: boolean; quotePrice: string },
  offered: boolean,
) => {
  item.offered = offered
  if (!offered) item.quotePrice = ""
}

const submitProblem = () => {
  if (!quoteModeCode(quoteDialog.quoteMode))
    return t("admin.supplierPricing.modeRequired")
  if (!addonOnlyQuote.value && hourlyQuote.value && hourlyRateProblem()) return hourlyRateProblem()
  if (
    quoteDialog.attaches.some(
      (item) => item.offered && !addonPriceOk(item.quotePrice),
    )
  ) {
    return t("admin.supplierPricing.addonPriceInvalid")
  }
  const items = quoteItems().filter((item) => item.enabled === 1)
  if (!quoteDialog.rows.some((row) => row.available !== false))
    return t("admin.supplierPricing.noSellable")
  if (!items.length) return t("admin.supplierPricing.skuSwitchRequired")
  const incomplete =
    !addonOnlyQuote.value &&
    quoteDialog.quoteMode === 1 &&
    items.some((item) => !(Number(item.quotePrice) > 0))
  if (incomplete) return t("admin.supplierPricing.submitIncomplete")
  return ""
}

const quotePayload = () => {
  const payload: Record<string, unknown> = {
    supplierId: supplierRecordId.value,
    spuId: quoteDialog.spuId,
    items: quoteItems(),
  }
  if (packageMode.value) payload.packageId = quoteDialog.packageId
  if (quoteModeCode(quoteDialog.quoteMode))
    payload.quoteMode = quoteDialog.quoteMode
  if (!addonOnlyQuote.value && quoteDialog.quoteMode === 2) {
    payload.unitPriceWithMaterial = quoteDialog.unitPriceWithMaterial == null ? null : Number(quoteDialog.unitPriceWithMaterial)
    payload.unitPriceWithoutMaterial = quoteDialog.unitPriceWithoutMaterial == null ? null : Number(quoteDialog.unitPriceWithoutMaterial)
  }
  if (!addonOnlyQuote.value && singleRateMode(quoteDialog.quoteMode)) {
    payload.unitPrice = quoteDialog.unitPrice == null ? null : Number(quoteDialog.unitPrice)
  }
  payload.attaches = quoteDialog.attaches
    .filter((item) => item.offered && addonPriceOk(item.quotePrice))
    .map((item) => ({
      attachValueId: item.attachValueId,
      quotePrice: Number(item.quotePrice),
    }))
  return payload
}

const applySavedQuote = (saved: any) => {
  if (!saved) return
  quoteDialog.status = saved.status ?? quoteDialog.status
  quoteDialog.submittedAt = String(
    saved.submitTime || saved.submittedAt || quoteDialog.submittedAt || "",
  )
  quoteDialog.rejectReason = saved.rejectReason || ""
  quoteDialog.priceEditable = saved.priceEditable === true
  quoteDialog.canApplyPriceChange = saved.canApplyPriceChange === true
  quoteDialog.priceChangeStatus =
    saved.priceChangeStatus == null ? null : Number(saved.priceChangeStatus)
  quoteDialog.priceChangeReason = saved.priceChangeReason || ""
  quoteDialog.priceChangeRejectReason = saved.priceChangeRejectReason || ""
  quoteDialog.quoteMode = assignedQuoteMode(saved)
  quoteDialog.unitPrice =
    saved.unitPrice == null || saved.unitPrice === ""
      ? null
      : Number(saved.unitPrice)
  quoteDialog.unitPriceWithMaterial = blankPositive(saved.unitPriceWithMaterial)
  quoteDialog.unitPriceWithoutMaterial = blankPositive(saved.unitPriceWithoutMaterial)
  const quoted = new Map(
    (saved.skus || []).map((sku: any) => [Number(sku.skuId), sku]),
  )
  quoteDialog.rows.forEach((row) => {
    const next = quoted.get(Number(row.skuId))
    if (!next) return
    row.staffCount = blankPositive(next.staffCount)
    row.serviceHours = blankPositive(next.serviceHours)
    row.quotePrice = next.quotePrice == null ? null : Number(next.quotePrice)
    row.reviewStatus =
      Number(next.reviewStatus) === 2 || Number(next.reviewStatus) === 3
        ? Number(next.reviewStatus)
        : undefined
    row.rejectReason = next.rejectReason || ""
    const lineRejected =
      Number(saved.status) === 3 ||
      Number(next.reviewStatus) === 3 ||
      String(next.rejectReason || "").trim()
    row.enabled = lineRejected
      ? row.available !== false
      : skuEnabled(next.enabled, row.available !== false)
    row.settled = quoteOptionSettled(
      { status: saved.status, quoteMode: quoteDialog.quoteMode },
      next,
    )
    if (next.approvedPrice != null) row.approvedPrice = next.approvedPrice
    if (next.supplierFulfillRemark != null) row.supplierFulfillRemark = quoteFulfillRemark(next)
  })
  if (saved.onlyAddonPrice != null) quoteDialog.onlyAddonPrice = saved.onlyAddonPrice === true
  zeroAddonSpecPrices()
  if (Array.isArray(saved.attaches)) {
    const previous = new Map(
      quoteDialog.attaches.map((item) => [Number(item.attachValueId), item]),
    )
    quoteDialog.attaches = mapAttaches(saved.attaches).map((item) => {
      const prior = previous.get(Number(item.attachValueId))
      const kept = {
        ...item,
        typeId: item.typeId || prior?.typeId || 0,
        typeName: item.typeName || prior?.typeName || "",
        typeNameI18n: item.typeNameI18n || prior?.typeNameI18n || null,
      }
      if (!prior?.offered || kept.offered) return kept
      return {
        ...kept,
        offered: true,
        quotePrice: kept.quotePrice || prior.quotePrice || "",
      }
    })
  }
  applyConfiguredQuoteModeToDialog(saved)
}

const packageSectionRates = (block: { quoteMode?: number; onlyAddonPrice?: boolean }) => {
  if (block.onlyAddonPrice) return []
  if (block.quoteMode === 2) return hourlyRateFields
  if (block.quoteMode === 3) return staffHourRateFields
  if (block.quoteMode === 4) return quantityRateFields
  return []
}
const packageSectionEditable = (block: { status?: number; priceEditable?: boolean }) =>
  Number(block.status) !== 1 && block.priceEditable !== false
const packageOptionLabel = (sku: any) => {
  const group = localizedName(sku?.groupSpecValueNameI18n, sku?.groupSpecValueName)
  const specs = (Array.isArray(sku?.specs) ? sku.specs : [])
    .map((spec: any) => localizedName(spec?.specValueNameI18n, spec?.specValueName))
    .filter((text: string) => text && text !== "—" && text !== group)
  const parts = [group !== "—" ? group : "", ...specs].filter(Boolean)
  if (parts.length) return parts.join(" · ")
  const method = localizedName(sku?.pricingMethodI18n, sku?.pricingMethod)
  return method !== "—" ? method : String(sku?.skuCode || t("admin.supplierPricing.specFallback"))
}
const packageSkus = (quote: any) => {
  const seen = new Set<number>()
  const rows: any[] = []
  const push = (sku: any, group?: any) => {
    const skuId = Number(sku?.skuId)
    if (!skuId || seen.has(skuId) || sku?.available === false) return
    seen.add(skuId)
    rows.push({
      ...sku,
      groupSpecValueName: sku?.groupSpecValueName || group?.specValueName,
      groupSpecValueNameI18n: sku?.groupSpecValueNameI18n || group?.specValueNameI18n,
    })
  }
  for (const group of Array.isArray(quote?.skuGroups) ? quote.skuGroups : []) {
    for (const sku of Array.isArray(group?.skus) ? group.skus : []) push(sku, group)
  }
  if (!rows.length) {
    for (const sku of Array.isArray(quote?.skus) ? quote.skus : []) push(sku)
  }
  return rows
}
const packageSectionFromQuote = (entry: any) => {
  const quote = entry?.service || {}
  const mode = assignedQuoteMode(quote)
  const onlyAddon = quote?.onlyAddonPrice === true
  const spuId = Number(quote.spuId)
  return {
    spuId,
    name: String(quote.spuName || ""),
    nameI18n: quote.nameI18n || null,
    quoteMode: mode,
    status: quote.status == null ? undefined : Number(quote.status),
    priceEditable: quote.priceEditable !== false,
    onlyAddonPrice: onlyAddon,
    showOptionPrice: true,
    quoteDesc: supplierQuoteDescription(quote?.supplierQuoteDescI18n),
    groupType: (() => {
      const named = localizedName(
        quote?.skuGroupBy?.specTypeNameI18n,
        quote?.skuGroupBy?.specTypeName || quote?.skuGroups?.[0]?.specTypeName,
      )
      return named === "—" ? "" : named
    })(),
    times: packageTimesFor(entry.contents, spuId),
    unitPrice: quote.unitPrice == null || quote.unitPrice === "" ? "" : String(quote.unitPrice),
    unitPriceWithMaterial:
      quote.unitPriceWithMaterial == null || quote.unitPriceWithMaterial === ""
        ? ""
        : String(quote.unitPriceWithMaterial),
    unitPriceWithoutMaterial:
      quote.unitPriceWithoutMaterial == null || quote.unitPriceWithoutMaterial === ""
        ? ""
        : String(quote.unitPriceWithoutMaterial),
    rows: packageSkus(quote).map((sku: any) => {
      const group = localizedName(sku?.groupSpecValueNameI18n, sku?.groupSpecValueName)
      const groupLabel = group === "—" ? "" : group
      const optionLabel = (Array.isArray(sku?.specs) ? sku.specs : [])
        .map((spec: any) => localizedName(spec?.specValueNameI18n, spec?.specValueName))
        .filter((text: string) => text && text !== "—" && text !== groupLabel)
        .join(" · ")
      return {
        skuId: Number(sku.skuId),
        label: packageOptionLabel(sku),
        groupLabel,
        optionLabel,
        enabled: sku.enabled == null || Number(sku.enabled) !== 0,
        acceptBand: sku.acceptBand ?? null,
        quotePrice:
          onlyAddon || mode !== 1
            ? "0"
            : sku.quotePrice == null || sku.quotePrice === ""
              ? ""
              : String(sku.quotePrice),
        staffCount: blankPositive(sku.staffCount),
        serviceHours: blankPositive(sku.serviceHours),
      }
    }),
    attaches: mapAttaches(quote.attaches || []),
  }
}
const packageSectionPayload = (block: any) => {
  const payload: Record<string, unknown> = {
    supplierId: supplierRecordId.value,
    packageId: packageBundle.packageId,
    spuId: block.spuId,
    quoteMode: block.quoteMode,
    items: block.rows.map((row: any) => ({
      skuId: row.skuId,
      staffCount: blankPositive(row.staffCount) ?? 0,
      serviceHours: blankPositive(row.serviceHours) ?? 0,
      quotePrice: block.onlyAddonPrice
        ? 0
        : unitQuoteMode(block.quoteMode)
          ? null
          : row.quotePrice == null || row.quotePrice === ""
            ? null
            : Number(row.quotePrice),
      enabled: row.enabled === false ? 0 : 1,
    })),
  }
  if (!block.onlyAddonPrice && block.quoteMode === 2) {
    payload.unitPriceWithMaterial =
      String(block.unitPriceWithMaterial ?? "").trim() === "" ? null : Number(block.unitPriceWithMaterial)
    payload.unitPriceWithoutMaterial =
      String(block.unitPriceWithoutMaterial ?? "").trim() === "" ? null : Number(block.unitPriceWithoutMaterial)
  }
  if (!block.onlyAddonPrice && singleRateMode(block.quoteMode)) {
    payload.unitPrice = String(block.unitPrice ?? "").trim() === "" ? null : Number(block.unitPrice)
  }
  payload.attaches = block.attaches
    .filter((item: any) => item.offered && addonPriceOk(item.quotePrice))
    .map((item: any) => ({
      attachValueId: item.attachValueId,
      quotePrice: Number(item.quotePrice),
    }))
  return payload
}
const packageQuotedBlocks = () =>
  packageBundle.sections.filter((block) => block.quoted && packageSectionEditable(block))
const packageBundleProblem = (submitting: boolean) => {
  const editable = packageQuotedBlocks()
  if (!editable.length) return t("admin.supplierPricing.submitIncomplete")
  for (const block of editable) {
    for (const rate of packageSectionRates(block)) {
      const text = String(block[rate.key] ?? "").trim()
      if (!text && !submitting) continue
      if (!addonPriceOk(text)) return t("admin.supplierPricing.hourlyRateRequired", { name: t(rate.label) })
    }
    if (!block.onlyAddonPrice && block.quoteMode === 1) {
      const chosen = block.rows.filter((row: any) => row.enabled !== false)
      if (submitting && !chosen.length) return t("admin.supplierPricing.skuSwitchRequired")
      for (const row of chosen) {
        const text = String(row.quotePrice ?? "").trim()
        if (!text && !submitting) continue
        if (!addonPriceOk(text)) return t("admin.supplierPricing.pricePositive")
      }
      if (submitting && chosen.some((row: any) => !addonPriceOk(row.quotePrice))) {
        return t("admin.supplierPricing.submitIncomplete")
      }
    }
    if (
      block.attaches.some((item: any) => {
        const text = String(item.quotePrice ?? "").trim()
        if (!text) return submitting && item.offered
        return !addonPriceOk(text)
      })
    ) {
      return t("admin.supplierPricing.addonPriceInvalid")
    }
  }
  return ""
}
const packageQuotedSection = computed(
  () => packageBundle.sections.find((section) => section.quoted) || null,
)
const packageVisitTotal = () => {
  const counts = packageBundle.sections.flatMap((section) =>
    (Array.isArray(section.times) ? section.times : []).map((count: unknown) => Number(count)),
  ).filter((count) => Number.isInteger(count) && count > 0)
  return counts.length ? Math.max(...counts) : 0
}
const packagePlanChips = (group: { rows?: any[] }) =>
  (group.rows || []).flatMap((row) => {
    const name = serviceTitle(row.name, row.spuNameI18n)
    const times = Array.isArray(row.times) ? row.times : []
    if (!times.length) return [{ key: `${row.packageId}-${row.spuId}`, name, detail: "" }]
    return times.map((count: number, index: number) => ({
      key: `${row.packageId}-${row.spuId}-${index}`,
      name,
      detail: t("admin.supplierPortal.packagePlanTimes", { count }),
    }))
  })
const packageQuoteTabs = () => {
  const section = packageQuotedSection.value
  if (!section) return []
  const labels = [...new Set(section.rows.map((row: any) => String(row.groupLabel || "")).filter(Boolean))]
  if (labels.length < 2) return []
  if (!section.rows.some((row: any) => row.optionLabel && row.optionLabel !== row.groupLabel)) return []
  return labels
}
const packagePriceLineCount = () => {
  const section = packageQuotedSection.value
  if (!section) return 0
  return quoteDisplayLines(section.rows, (row) => row.label).length
}
const packageVisibleLines = () => {
  const section = packageQuotedSection.value
  if (!section) return []
  const tabs = packageQuoteTabs()
  const rows = tabs.length
    ? section.rows.filter((row: any) => row.groupLabel === packageBundle.tab)
    : section.rows
  return quoteDisplayLines(rows, (row) => (tabs.length ? row.optionLabel || row.label : row.label))
}
const packageLineDirect = (line: { rows: any[] }) =>
  line.rows.some((row) => acceptBandName(row.acceptBand) === "direct")
const packageLineMeta = (line: { title?: string; tails?: string[]; rows: any[] }) => {
  const text = [line.title, ...(line.tails || []), ...line.rows.map((row) => row.label)].filter(Boolean).join("\n")
  const staff = firstCount([text], STAFF_COUNT)
  const hours = firstCount([text], HOUR_COUNT)
  if (staff && hours) {
    const cleaning = /cleaners?|保洁|清洁/i.test(text)
    const role = cleaning
      ? t(staff === 1 ? "admin.supplierPricing.staffRoleCleaner" : "admin.supplierPricing.staffRoleCleaners")
      : t("admin.supplierPricing.staffRoleTech")
    return t("admin.supplierPortal.packageTeamMeta", { staff, hours, role: String(role).toLowerCase() })
  }
  if (line.tails?.length) {
    const separator = String(locale.value).toLowerCase().startsWith("en") ? ", " : "、"
    return line.tails.join(separator)
  }
  const visits = packageVisitTotal()
  return visits ? t("admin.supplierPortal.packageWholeVisits", { count: visits }) : ""
}
const packagePriceCalc = (line: { rows: Array<{ quotePrice?: unknown }> }) => {
  const amount = Number(familyPrice(line))
  const visits = packageVisitTotal()
  if (!(amount > 0)) return visits ? t("admin.supplierPortal.packageWholeVisits", { count: visits }) : ""
  if (visits > 1) return t("admin.supplierPortal.packagePerVisit", { price: moneyText(amount / visits) })
  return t("admin.supplierPortal.packageExclVat", { price: moneyText(exclVat(amount)) })
}
const setPackageQuoteEnabled = (enabled: boolean) => {
  packageVisibleLines().forEach((line) => setFamilyEnabled(line, enabled))
}
const openPackageQuote = (group: { rows: any[] }, sync = true) => {
  const packageId = Number(group.rows[0]?.packageId)
  if (!packageId) return
  const seen = new Set<number>()
  const sections = packageFlat.value.flatMap((entry) => {
    if (Number(entry?.packageId) !== packageId) return []
    const spuId = Number(entry?.service?.spuId)
    if (!spuId || seen.has(spuId) || entry?.service?.available === false) return []
    seen.add(spuId)
    return [packageSectionFromQuote(entry)]
  })
  if (!sections.length) return
  sections.forEach((section, index) => {
    section.quoted = index === 0
  })
  packageBundle.packageId = packageId
  packageBundle.quoteDesc = supplierQuoteDescription(
    packageFlat.value.find((entry) => Number(entry?.packageId) === packageId)?.packageQuoteDescI18n,
  )
  packageBundle.sections = sections
  packageBundle.tab = packageQuoteTabs()[0] || ""
  packageBundle.active = true
  quoteDialog.visible = true
  quoteDialog.packageId = packageId
  quoteDialog.spuId = 0
  quoteDialog.name = serviceTitle(String(group.rows[0]?.packageName || ""), group.rows[0]?.packageNameI18n)
  quoteDialog.nameI18n = null
  quoteDialog.category = serviceTitle(group.rows[0]?.category || "", group.rows[0]?.categoryNameI18n)
  quoteDialog.categoryI18n = null
  quoteDialog.status = undefined
  quoteDialog.rejectReason = ""
  quoteDialog.supplierQuoteDesc = ""
  quoteDialog.packageTimes = []
  quoteScreen.value = "setup"
  if (sync) syncPackageQuoteRoute()
  void refreshPackageOptionPrices(sections.filter((section) => section.quoted))
}
const refreshPackageOptionPrices = async (sections: any[]) => {
  await Promise.all(sections.map(async (block) => {
    try {
      const flag = unwrap(await supplierQuoteShowOptionPrice(block.spuId))
      block.showOptionPrice = flag?.showOptionPrice !== false
    } catch {
      block.showOptionPrice = true
    }
  }))
}
const syncPackageQuoteRoute = () => {
  const query: Record<string, unknown> = {
    ...router.currentRoute.value.query,
    packageQuote: String(packageBundle.packageId),
    category: quoteCategory.value,
  }
  if (packageMode.value) query.package = String(packageBundle.packageId)
  delete query.service
  delete query.quoteStep
  router.replace({ path: router.currentRoute.value.path, query })
}
const savePackageBundle = async (submit: boolean) => {
  if (!supplierRecordId.value || packageBundle.saving) return
  const problem = packageBundleProblem(submit)
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  packageBundle.saving = true
  try {
    const editable = packageQuotedBlocks()
    for (const block of editable) await savePackageQuoteDraft(packageSectionPayload(block))
    if (submit) {
      for (const block of editable) {
        await submitQuote({
          supplierId: supplierRecordId.value,
          spuId: block.spuId,
          confirmation: { pricesIncludeVat: true, informationAccurate: true },
        })
      }
    }
    ElMessage.success(t(submit ? "admin.supplierPricing.submitted" : "admin.supplierPricing.draftSaved"))
    if (submit) await closeServiceQuote()
    await loadPackageWorkspace()
  } catch (error: any) {
    ElMessage.error(error?.message || t(submit ? "admin.supplierPricing.submitFailed" : "admin.supplierPricing.saveQuoteFailed"))
  } finally {
    packageBundle.saving = false
  }
}
const openQuotedServiceEditor = () => {
  const row = savedServices.value.find(
    (service) => service.spuId === quoteDialog.spuId,
  )
  if (row) openServiceEditor(row)
}
const openServiceQuote = async (row: {
  spuId: number
  name: string
  spuNameI18n?: Record<string, unknown> | null
  category: string
  categoryNameI18n?: Record<string, unknown> | null
  status?: number
  rejectReason?: string
  quoteMode?: number
  unitPrice?: number | null
  unitPriceWithMaterial?: number | null
  unitPriceWithoutMaterial?: number | null
}) => {
  packageBundle.active = false
  quoteDialog.visible = true
  quoteDialog.packageId = Number((row as { packageId?: number }).packageId) || 0
  quoteConfirmed.value = false
  optionPriceQuery.value = ""
  optionPriceGroup.value = ""
  quoteScreen.value =
    router.currentRoute.value.query.quoteStep === "review" ? "review" : "setup"
  quoteDialog.loading = true
  await nextTick()
  scrollProfileTop()
  quoteDialog.spuId = row.spuId
  quoteDialog.name = row.name || ""
  quoteDialog.nameI18n = row.spuNameI18n || null
  quoteDialog.category = row.category || ""
  quoteDialog.categoryI18n = row.categoryNameI18n || null
  if (packageMode.value) {
    const packageLabel = serviceTitle(
      String((row as { packageName?: string }).packageName || ""),
      (row as { packageNameI18n?: Record<string, unknown> | null }).packageNameI18n,
    )
    const categoryLabel = serviceTitle(row.category || "", row.categoryNameI18n)
    quoteDialog.category = [categoryLabel, packageLabel].filter(Boolean).join(" · ")
    quoteDialog.categoryI18n = null
  }
  quoteDialog.status = row.status
  quoteDialog.submittedAt = ""
  quoteDialog.rejectReason = row.rejectReason || ""
  quoteDialog.priceEditable = (row as any).priceEditable === true
  quoteDialog.canApplyPriceChange = (row as any).canApplyPriceChange === true
  quoteDialog.priceChangeStatus =
    (row as any).priceChangeStatus == null
      ? null
      : Number((row as any).priceChangeStatus)
  quoteDialog.priceChangeReason = (row as any).priceChangeReason || ""
  quoteDialog.priceChangeRejectReason =
    (row as any).priceChangeRejectReason || ""
  quoteDialog.quoteMode = assignedQuoteMode(row)
  quoteDialog.unitPrice = row.unitPrice == null ? null : Number(row.unitPrice)
  quoteDialog.unitPriceWithMaterial = blankPositive(row.unitPriceWithMaterial)
  quoteDialog.unitPriceWithoutMaterial = blankPositive(row.unitPriceWithoutMaterial)
  quoteDialog.columns = []
  quoteDialog.rows = []
  quoteDialog.attachModuleTitle = ""
  quoteDialog.onlyAddonPrice = false
  quoteDialog.supplierQuoteDesc = ""
  quoteDialog.showOptionPrice = true
  quoteDialog.packageTimes = packageMode.value && Array.isArray((row as { times?: number[] }).times)
    ? (row as { times?: number[] }).times || []
    : []
  quoteDialog.attaches = []
  try {
    const detail = unwrap(await listBySpu(row.spuId)) || {}
    const quote = packageMode.value
      ? packageFlat.value.find(
          (item) =>
            item.packageId === quoteDialog.packageId &&
            Number(item.service?.spuId) === Number(row.spuId),
        )?.service
      : liveQuotes.value.find(
          (item) => Number(item.spuId) === Number(row.spuId),
        )
    quoteDialog.attachModuleTitle = String(quote?.attachModuleTitle || "").trim()
    quoteDialog.onlyAddonPrice = quote?.onlyAddonPrice === true
    const serviceQuoteDesc = supplierQuoteDescription(quote?.supplierQuoteDescI18n)
    const packageQuoteDesc = packageMode.value
      ? supplierQuoteDescription(
          packageFlat.value.find(
            (item) =>
              item.packageId === quoteDialog.packageId &&
              Number(item.service?.spuId) === Number(row.spuId),
          )?.packageQuoteDescI18n,
        )
      : ""
    quoteDialog.supplierQuoteDesc = [packageQuoteDesc, serviceQuoteDesc]
      .filter((text, index, list) => text && list.indexOf(text) === index)
      .join("\n\n")
    const quoted = new Map(
      (quote?.skus || []).map((sku: any) => [Number(sku.skuId), sku]),
    )
    const specTypes = Array.isArray(detail.specTypes) ? detail.specTypes : []
    quoteDialog.columns = specTypes.map((spec: any) => ({
      key: String(spec.specKey ?? spec.specTypeId),
      nameI18n:
        spec.nameI18n && typeof spec.nameI18n === "object"
          ? spec.nameI18n
          : null,
      fallback: spec.specTypeName || "",
    }))
    const skus = Array.isArray(detail.skus) ? detail.skus : []
    const specRecord = (specs: unknown) => {
      if (!Array.isArray(specs)) return {}
      return Object.fromEntries(
        specs
          .map((spec: any) => [
            String(spec?.specKey ?? spec?.specTypeId ?? ""),
            spec?.specValueNameI18n || spec?.specValueName,
          ])
          .filter(([key]) => key),
      )
    }
    const groupFields = (group: any, sku: any) => {
      const type = localizedName(group?.specTypeNameI18n, group?.specTypeName)
      const value = localizedName(
        group?.specValueNameI18n,
        group?.specValueName,
      )
      const groupValueId = group?.specValueId
      const lineLabel = (Array.isArray(sku?.specs) ? sku.specs : [])
        .filter(
          (spec: any) =>
            groupValueId == null ||
            String(spec?.specValueId) !== String(groupValueId),
        )
        .map((spec: any) =>
          localizedName(spec?.specValueNameI18n, spec?.specValueName),
        )
        .filter((text: string) => text && text !== "—")
        .join(" · ")
      return {
        groupId: groupValueId != null ? String(groupValueId) : "all",
        groupType: type === "—" ? "" : type,
        groupValue: value === "—" ? "" : value,
        lineLabel,
      }
    }
    const mapQuoteRow = (
      sku: any,
      saved: any,
      meta: {
        groupId: string
        groupType: string
        groupValue: string
        lineLabel: string
      },
    ) => {
      const available =
        saved.available != null
          ? saved.available !== false
          : sku.available != null
            ? sku.available !== false
            : Number(sku.status ?? 1) === 1
      return {
        skuId: sku.skuId ?? saved.skuId,
        skuCode: sku.skuCode || saved.skuCode || "",
        specLines:
          Array.isArray(sku?.specs) && sku.specs.length
            ? sku.specs
            : Array.isArray(saved?.specs)
              ? saved.specs
              : [],
        pricingMethod: sku?.pricingMethod || saved?.pricingMethod || "",
        pricingMethodI18n: sku?.pricingMethodI18n || saved?.pricingMethodI18n || null,
        supplierFulfillRemark: quoteFulfillRemark({
          supplierFulfillRemark: sku?.supplierFulfillRemark || saved?.supplierFulfillRemark,
        }),
        specs: {
          ...Object.fromEntries(
            quoteDialog.columns.map((column) => [column.key, sku[column.key]]),
          ),
          ...specRecord(sku.specs),
          ...specRecord(saved.specs),
        },
        ...meta,
        platformPrice: saved.platformPrice ?? sku.platformPrice ?? sku.price,
        approvedPrice: saved.approvedPrice ?? sku.approvedPrice ?? null,
        available,
        enabled:
          Number(quote?.status) === 3 ||
          Number(saved.reviewStatus) === 3 ||
          String(saved.rejectReason || "").trim()
            ? available
            : skuEnabled(saved.enabled ?? sku.enabled, available),
        staffCount: firstPositive(saved.staffCount, sku.staffCount),
        serviceHours: firstPositive(saved.serviceHours, sku.serviceHours),
        quotePrice:
          saved.quotePrice == null || saved.quotePrice === ""
            ? sku.quotePrice == null || sku.quotePrice === ""
              ? null
              : Number(sku.quotePrice)
            : Number(saved.quotePrice),
        reviewStatus:
          Number(saved.reviewStatus ?? sku.reviewStatus) === 2 ||
          Number(saved.reviewStatus ?? sku.reviewStatus) === 3
            ? Number(saved.reviewStatus ?? sku.reviewStatus)
            : undefined,
        rejectReason: saved.rejectReason || sku.rejectReason || "",
        acceptBand: acceptBandName(saved.acceptBand ?? sku.acceptBand)
          ? Number(saved.acceptBand ?? sku.acceptBand)
          : null,
        settled: quoteOptionSettled(quote, quoted.get(Number(sku.skuId ?? saved.skuId))),
      }
    }
    const grouped =
      Array.isArray(quote?.skuGroups) &&
      quote.skuGroups.some(
        (group: any) => Array.isArray(group?.skus) && group.skus.length,
      )
        ? quote.skuGroups
        : Array.isArray(detail.skuGroups) && detail.skuGroups.length
          ? detail.skuGroups
          : null
    if (grouped) {
      const seen = new Set<number>()
      const rows: any[] = []
      for (const group of grouped) {
        for (const sku of group.skus || []) {
          const id = Number(sku?.skuId)
          if (!Number.isFinite(id) || seen.has(id)) continue
          seen.add(id)
          rows.push(
            mapQuoteRow(sku, quoted.get(id) || sku, groupFields(group, sku)),
          )
        }
      }
      for (const sku of skus) {
        const id = Number(sku?.skuId)
        if (!Number.isFinite(id) || seen.has(id)) continue
        rows.push(
          mapQuoteRow(sku, quoted.get(id) || {}, {
            groupId: "all",
            groupType: "",
            groupValue: "",
            lineLabel: "",
          }),
        )
      }
      quoteDialog.rows = rows
    } else {
      quoteDialog.rows = skus.map((sku: any) =>
        mapQuoteRow(sku, quoted.get(Number(sku.skuId)) || {}, {
          groupId: "all",
          groupType: "",
          groupValue: "",
          lineLabel: "",
        }),
      )
    }
    if (packageMode.value) {
      const allowed = new Set(
        (Array.isArray(quote?.skus) ? quote.skus : [])
          .map((sku: any) => Number(sku?.skuId))
          .filter((id: number) => Number.isInteger(id) && id > 0),
      )
      quoteDialog.rows = allowed.size
        ? quoteDialog.rows.filter((line) => allowed.has(Number(line.skuId)))
        : []
      if (!quoteDialog.rows.length && Array.isArray(quote?.skus) && quote.skus.length) {
        quoteDialog.rows = quote.skus.map((sku: any) =>
          mapQuoteRow(sku, sku, {
            groupId: "all",
            groupType: "",
            groupValue: "",
            lineLabel: "",
          }),
        )
      }
    }
    quoteDialog.rows = quoteDialog.rows.filter((row) => row.available !== false)
    zeroAddonSpecPrices()
    if (quote) {
      quoteDialog.status = quote.status
      quoteDialog.rejectReason = quoteRejectText(quote)
      quoteDialog.priceEditable = quote.priceEditable === true
      quoteDialog.canApplyPriceChange = quote.canApplyPriceChange === true
      quoteDialog.priceChangeStatus =
        quote.priceChangeStatus == null ? null : Number(quote.priceChangeStatus)
      quoteDialog.priceChangeReason = quote.priceChangeReason || ""
      quoteDialog.priceChangeRejectReason = quote.priceChangeRejectReason || ""
      quoteDialog.quoteMode = assignedQuoteMode(quote)
      quoteDialog.unitPrice =
        quote.unitPrice == null || quote.unitPrice === ""
          ? quoteDialog.unitPrice
          : Number(quote.unitPrice)
      quoteDialog.unitPriceWithMaterial = blankPositive(quote.unitPriceWithMaterial)
      quoteDialog.unitPriceWithoutMaterial = blankPositive(quote.unitPriceWithoutMaterial)
      quoteDialog.submittedAt = String(
        quote.submitTime || quote.submittedAt || "",
      )
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
    if (quote) applyConfiguredQuoteModeToDialog(quote)
    try {
      const flag = unwrap(await supplierQuoteShowOptionPrice(row.spuId))
      quoteDialog.showOptionPrice = flag?.showOptionPrice !== false
    } catch {
      quoteDialog.showOptionPrice = true
    }
    if (quoteUnderReview.value) quoteScreen.value = "submitted"
    else if (quotePriceLocked.value || (quoteScreen.value === "review" && quoteMissingCount.value))
      quoteScreen.value = "setup"
    syncQuoteRoute()
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPricing.specsFailed"))
    quoteDialog.visible = false
  } finally {
    quoteDialog.loading = false
  }
}

const syncQuoteRoute = () => {
  const query: Record<string, unknown> = {
    ...router.currentRoute.value.query,
    service: String(quoteDialog.spuId),
    quoteStep: quoteScreen.value,
    category: quoteCategory.value,
  }
  if (packageMode.value) query.package = String(quoteDialog.packageId)
  else delete query.package
  delete query.packageQuote
  router.replace({
    path: router.currentRoute.value.path,
    query,
  })
}
const closeServiceQuote = async () => {
  quoteDialog.visible = false
  packageBundle.active = false
  packageBundle.quoteDesc = ""
  packageBundle.sections = []
  const { service, quoteStep, category, package: _packageId, packageQuote: _packageQuote, ...query } =
    router.currentRoute.value.query
  await router.replace({ path: router.currentRoute.value.path, query })
}
const backToQuoteSetup = () => {
  if (quoteUnderReview.value) return
  quoteScreen.value = "setup"
  quoteConfirmed.value = false
  syncQuoteRoute()
  scrollProfileTop()
}
const reviewServiceQuote = () => {
  const reason = quoteReviewBlockReason.value
  if (reason) {
    ElMessage.warning(reason)
    if (quoteMissingCount.value && !quoteUnderReview.value && !quotePriceLocked.value)
      focusQuoteGap()
    return
  }
  quoteScreen.value = "review"
  quoteConfirmed.value = false
  syncQuoteRoute()
}
const closeQuoteReview = (open: boolean) => {
  if (open || quoteDialog.saving) return
  backToQuoteSetup()
}

const saveServiceQuote = async () => {
  if (
    !supplierRecordId.value ||
    quoteUnderReview.value ||
    quotePriceLocked.value
  )
    return
  const problem = draftProblem()
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  quoteDialog.saving = true
  try {
    const saved = unwrap(
      await (packageMode.value ? savePackageQuoteDraft(quotePayload()) : saveQuoteDraft(quotePayload())),
    )
    applySavedQuote(saved)
    ElMessage.success(t("admin.supplierPricing.draftSaved"))
    if (packageMode.value) await loadPackageWorkspace()
    else await loadQuotes(true)
  } catch (error: any) {
    ElMessage.error(
      error?.message || t("admin.supplierPricing.saveQuoteFailed"),
    )
  } finally {
    quoteDialog.saving = false
  }
}

const submitServiceQuote = async () => {
  if (quotePriceLocked.value) {
    ElMessage.warning(t("admin.supplierPricing.priceChangeHint"))
    quoteScreen.value = "setup"
    return
  }
  if (
    !supplierRecordId.value ||
    quoteDialog.saving ||
    quoteUnderReview.value ||
    quoteScreen.value !== "review" ||
    !quoteConfirmed.value
  )
    return
  const problem = submitProblem()
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  quoteDialog.saving = true
  try {
    if (packageMode.value) await savePackageQuoteDraft(quotePayload())
    else await saveQuoteDraft(quotePayload())
    const submitted = unwrap(
      await submitQuote({
        supplierId: supplierRecordId.value,
        spuId: quoteDialog.spuId,
        confirmation: { pricesIncludeVat: true, informationAccurate: true },
      }),
    )
    applySavedQuote(submitted)
    const autoRejected = quoteWasAutoRejected(submitted)
    quoteDialog.status = submitted?.status ?? 1
    if (!autoRejected) {
      quoteDialog.rejectReason = ""
      quoteDialog.rows.forEach((row) => {
        row.rejectReason = ""
        row.reviewStatus = undefined
      })
    }
    quoteDialog.submittedAt = String(
      submitted?.submitTime ||
        submitted?.submittedAt ||
        new Date().toISOString(),
    )
    if (autoRejected) {
      ElMessage.warning(t("admin.supplierPricing.autoRejected"))
      quoteScreen.value = "setup"
    } else {
      ElMessage.success(t("admin.supplierPricing.submitted"))
      quoteScreen.value = "submitted"
    }
    syncQuoteRoute()
    if (packageMode.value) await loadPackageWorkspace()
    else await loadQuotes(true)
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierPricing.submitFailed"))
  } finally {
    quoteDialog.saving = false
  }
}

const loadOrderDetail = async (orderId: number, fulfillmentId?: number) => {
  const requestId = ++orderDetailRequest
  orderDetailLoading.value = true
  try {
    const detail = unwrap(
      await supplierAssignedOrderDetail(orderId, fulfillmentId),
    )
    if (
      requestId !== orderDetailRequest ||
      Number(selectedOrder.value?.orderId) !== orderId
    )
      return
    selectedOrder.value = detail || selectedOrder.value
    const index = supplierOrders.value.findIndex((item) => {
      if (Number(item?.orderId) !== orderId) return false
      if (!fulfillmentId) return true
      return Number(item?.fulfillmentId) === fulfillmentId
    })
    if (index >= 0 && detail)
      supplierOrders.value[index] = {
        ...supplierOrders.value[index],
        ...detail,
      }
  } catch (error: any) {
    if (requestId !== orderDetailRequest) return
    ElMessage.error(error?.message || t("admin.supplierOrders.detailFailed"))
  } finally {
    if (requestId === orderDetailRequest) orderDetailLoading.value = false
  }
}
const loadOrders = async () => {
  const requestId = ++orderListRequest
  const requestedStage = orderStage.value
  orderLoading.value = true
  orderLoadFailed.value = false
  try {
    const [serviceTimeStart, serviceTimeEnd] = orderDateRange.value || []
    const page = unwrap(
      await supplierAssignedOrders({
        orderNo: orderKeyword.value || undefined,
        serviceName: orderServiceKeyword.value || undefined,
        categoryId: orderCategory.value || undefined,
        serviceTimeStart: serviceTimeStart || undefined,
        serviceTimeEnd: serviceTimeEnd || undefined,
        supplierStage: supplierStageParam(requestedStage),
        pageNum: orderPage.value,
        pageSize: staffOrderUserId.value ? 100 : 10,
      }),
    )
    if (requestId !== orderListRequest) return
    orderSummary.value = supplierMineCounts(page)
    supplierOrders.value = Array.isArray(page?.list) ? page.list : []
    orderTotal.value = Number(page?.total || 0)
  } catch (error: any) {
    if (requestId !== orderListRequest) return
    supplierOrders.value = []
    orderTotal.value = 0
    orderSummary.value = {}
    orderLoadFailed.value = true
    ElMessage.error(error?.message || t("admin.supplierOrders.loadFailed"))
  } finally {
    if (requestId === orderListRequest) orderLoading.value = false
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

const quoteBreadcrumbItems = computed(() => [
  {
    label: t(packageMode.value ? "admin.supplierPortal.packages" : "admin.supplierPricing.title"),
    onClick: closeServiceQuote,
  },
  ...(quoteDialogCategory.value && quoteDialogCategory.value !== "—"
    ? [{ label: quoteDialogCategory.value, onClick: closeServiceQuote }]
    : []),
  { label: quoteDialogTitle.value, onClick: backToQuoteSetup },
  ...(quoteScreen.value === "review"
    ? [{ label: t("admin.supplierPortal.reviewTitle") }]
    : []),
])

const handlePrimaryAction = () => {
  if (section.value === "service-area") {
    openAreaEditor()
    return
  }
  if (section.value === "schedule") {
    shiftDialogVisible.value = true
    return
  }
  if (section.value === "profile") {
    submitProfileForm()
  }
}

type ShelfNoticeRow = { spuId: number; name: string; detail: string }
const shelfNotice = reactive({
  open: false,
  acking: false,
  acked: false,
  services: [] as ShelfNoticeRow[],
})
let shelfNoticeHandle: NotificationHandle | null = null
let shelfNoticeClosing = false
let shelfNoticeDisposed = false
const ShelfNoticeBody = defineComponent({
  name: "ShelfNoticeBody",
  setup() {
    return () =>
      h("div", { class: "shelf-notice" }, [
        h(
          "p",
          { class: "shelf-notice-lead" },
          t("admin.supplierPortal.shelfNoticeLead"),
        ),
        h(
          "ul",
          { class: "shelf-notice-list" },
          shelfNotice.services.map((item) =>
            h("li", { key: item.spuId }, [
              h("strong", item.name),
              item.detail ? h("small", item.detail) : null,
            ]),
          ),
        ),
        h("div", { class: "shelf-notice-actions" }, [
          h(
            ElButton,
            { loading: shelfNotice.acking, onClick: () => dismissShelfNotice() },
            () => t("admin.supplierPortal.shelfNoticeAck"),
          ),
          h(
            ElButton,
            {
              type: "primary",
              loading: shelfNotice.acking,
              onClick: () => quoteShelfNotice(),
            },
            () => t("admin.supplierPortal.shelfNoticeQuote"),
          ),
        ]),
      ])
  },
})
const closeShelfNotice = () => {
  shelfNoticeClosing = true
  const handle = shelfNoticeHandle
  shelfNoticeHandle = null
  shelfNotice.open = false
  handle?.close()
}
const presentShelfNotice = () => {
  if (shelfNoticeDisposed || shelfNoticeHandle || !shelfNotice.services.length) return
  shelfNotice.open = true
  shelfNoticeHandle = ElNotification({
    title: t("admin.supplierPortal.shelfNoticeTitle"),
    message: h(ShelfNoticeBody),
    position: "top-right",
    duration: 0,
    offset: 24,
    customClass: "shelf-notice-notification",
    onClose: () => {
      shelfNoticeHandle = null
      shelfNotice.open = false
      if (shelfNoticeClosing || shelfNotice.acked || shelfNoticeDisposed) {
        shelfNoticeClosing = false
        return
      }
      void acknowledgeShelfNotice().then((ok) => {
        if (shelfNoticeDisposed || ok) return
        ElMessage.error(t("admin.supplierPortal.shelfNoticeAckFailed"))
        presentShelfNotice()
      })
    },
  })
}
const formatShelfDate = (value?: number | null) => {
  const time = Number(value || 0)
  if (!Number.isFinite(time) || time <= 0) return ""
  return new Intl.DateTimeFormat(locale.value?.startsWith("en") ? "en" : "zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(time))
}
const loadShelfNotices = async () => {
  const supplierId = supplierRecordId.value
  if (!supplierId || shelfNotice.acked) return
  try {
    const notice = unwrap(await supplierShelfNotices(supplierId)) as {
      unread?: boolean
      services?: Array<{
        spuId?: number
        spuName?: string
        nameI18n?: Record<string, unknown> | null
        shelvedAt?: number
        categories?: Array<{
          categoryName?: string
          nameI18n?: Record<string, unknown> | null
        }>
      }>
    }
    const services = Array.isArray(notice?.services) ? notice.services : []
    const unread = Boolean(notice?.unread) && services.length > 0
    supplierShelfNoticeUnread.value = unread
    if (!unread) return
    shelfNotice.services = services.map((item, index) => {
      const categories = (item.categories || [])
        .map((category) =>
          localizedCategory(
            String(category?.categoryName || ""),
            category?.nameI18n,
          ),
        )
        .filter(Boolean)
      const date = formatShelfDate(item.shelvedAt)
      return {
        spuId: Number(item.spuId || index + 1),
        name:
          serviceTitle(String(item.spuName || ""), item.nameI18n) ||
          t("admin.supplierPortal.services"),
        detail: [categories.join(" · "), date].filter(Boolean).join(" · "),
      }
    })
    presentShelfNotice()
  } catch {
    supplierShelfNoticeUnread.value = false
  }
}
const acknowledgeShelfNotice = async () => {
  const supplierId = supplierRecordId.value
  if (!supplierId) return false
  if (shelfNotice.acked) return true
  shelfNotice.acking = true
  try {
    await acknowledgeSupplierShelfNotices({ supplierId })
    shelfNotice.acked = true
    supplierShelfNoticeUnread.value = false
    return true
  } catch {
    return false
  } finally {
    shelfNotice.acking = false
  }
}
const dismissShelfNotice = async () => {
  if (shelfNotice.acking) return
  const ok = await acknowledgeShelfNotice()
  if (!ok) {
    ElMessage.error(t("admin.supplierPortal.shelfNoticeAckFailed"))
    return
  }
  closeShelfNotice()
}
const quoteShelfNotice = async () => {
  if (shelfNotice.acking) return
  const ok = await acknowledgeShelfNotice()
  if (!ok) {
    ElMessage.error(t("admin.supplierPortal.shelfNoticeAckFailed"))
    return
  }
  closeShelfNotice()
  if (section.value === "pricing") {
    if (quoteDialog.visible) closeServiceQuote()
    openServicePicker()
    return
  }
  const query: Record<string, unknown> = {
    ...router.currentRoute.value.query,
    addService: "1",
  }
  delete query.service
  delete query.quoteStep
  delete query.package
  await goTo("pricing", query)
}
watch(
  () =>
    [section.value, String(router.currentRoute.value.query.addService || "")] as const,
  ([current, flag]) => {
    if (current !== "pricing" || flag !== "1") return
    openServicePicker()
    const { addService: _addService, ...query } =
      router.currentRoute.value.query
    void router.replace({ path: router.currentRoute.value.path, query })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  shelfNoticeDisposed = true
  closeShelfNotice()
})
onMounted(() => {
  loadServiceCategoryOptions()
  loadCurrentSupplier()
    .then(() => loadShelfNotices())
    .catch((error: any) =>
      ElMessage.error(error?.message || t("admin.supplierProfile.loadFailed")),
    )
})
watch(staffOrderUserId, () => {
  if (section.value !== "orders") return
  orderPage.value = 1
  loadOrders()
})
watch(section, (value, previous) => {
  if (
    previous &&
    previous !== value &&
    (previous === "pricing" || previous === "package-pricing")
  ) {
    quoteDialog.visible = false
    quoteDialog.packageId = 0
    packageBundle.active = false
    packageBundle.sections = []
  }
  scrollProfileTop()
  if (value === "orders") loadOrders()
  if (
    ["service-area", "availability", "coverage-availability"].includes(value)
  ) {
    ensureAreaCatalog()
    loadOwnOperations()
  }
  if (value === "overview") {
    loadOwnOperations()
    ensureAreaCatalog()
  }
  if (value === "pricing") {
    loadCatalog()
    loadQuotes()
  }
  if (value === "package-pricing") loadPackageWorkspace()
})
watch(
  [
    () => router.currentRoute.value.query.service,
    () => router.currentRoute.value.query.quoteStep,
    () => catalogLoading.value,
    () => quoteLoading.value,
    () => serviceRows.value.length,
  ],
  () => {
    if (
      (section.value !== "pricing" && section.value !== "package-pricing") ||
      catalogLoading.value ||
      quoteLoading.value
    )
      return
    const id = Number(router.currentRoute.value.query.service)
    const requestedPackage = Number(router.currentRoute.value.query.package)
    const packageQuoteId = Number(router.currentRoute.value.query.packageQuote)
    if (!id) {
      if (
        packageMode.value &&
        packageQuoteId &&
        packageBundle.active &&
        packageBundle.packageId === packageQuoteId &&
        quoteDialog.visible
      ) {
        return
      }
      const group = serviceRowGroups.value.find(
        (item) => Number(item.rows[0]?.packageId) === packageQuoteId,
      )
      if (packageMode.value && group && packageServiceCount(packageQuoteId) >= 1) {
        openPackageQuote(group, false)
        return
      }
      quoteDialog.visible = false
      packageBundle.active = false
      return
    }
    if (
      quoteDialog.visible &&
      quoteDialog.spuId === id &&
      (!packageMode.value || quoteDialog.packageId === requestedPackage)
    ) {
      if (quoteUnderReview.value) quoteScreen.value = "submitted"
      else if (quotePriceLocked.value) quoteScreen.value = "setup"
      else if (!quoteDialog.loading)
        quoteScreen.value =
          router.currentRoute.value.query.quoteStep === "review" &&
          !quoteMissingCount.value
            ? "review"
            : "setup"
      return
    }
    const row = serviceRows.value.find(
      (service) =>
        service.spuId === id &&
        (!packageMode.value || service.packageId === requestedPackage),
    )
    if (row) {
      quoteCategory.value = String(row.categoryId)
      openServiceQuote(row)
    }
  },
)
watch(
  () =>
    JSON.stringify([
      quoteDialog.quoteMode,
      quoteDialog.unitPrice,
      quoteDialog.unitPriceWithMaterial,
      quoteDialog.unitPriceWithoutMaterial,
      quoteDialog.rows,
      quoteDialog.attaches,
      quoteContact.value,
    ]),
  () => {
    quoteConfirmed.value = false
  },
)
watch(areaKeyword, (keyword) => {
  const query = keyword.trim().toLowerCase()
  if (!query) return
  const next = new Set(expandedAreaIds.value)
  areaCatalog.value.forEach((area) => {
    const communities = communitiesByArea.value[area.id] || []
    if (
      communities.some((community) =>
        community.name.toLowerCase().includes(query),
      )
    )
      next.add(area.id)
  })
  expandedAreaIds.value = [...next]
})
</script>

<style scoped>
.staff-order-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 12px;
  color: #243246;
  font-size: 14px;
}
.staff-order-filter button {
  border: 0;
  background: transparent;
  color: #8d5a32;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
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
.supplier-demo--profile {
  padding: 0 0 28px;
  background: transparent;
}
/* Numeric data stays distinct from editorial headings and brand typography. */
.supplier-demo .portal-numeric,
.order-sheet .portal-numeric,
.quote-review-dialog .portal-numeric,
.supplier-demo :deep(.el-input-number .el-input__inner),
.supplier-demo :deep(input[inputmode="decimal"]),
.supplier-demo :deep(.el-date-editor .el-input__inner),
.supplier-form-dialog :deep(.el-input-number .el-input__inner),
.supplier-form-dialog :deep(input[inputmode="decimal"]) {
  font-family: var(--hx-font-numeric);
  font-weight: 600;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.supplier-demo .portal-numeric--money,
.order-sheet .portal-numeric--money,
.quote-review-dialog .portal-numeric--money {
  font-weight: 650;
}
.setup-cards article > h3 {
  margin-top: 0;
}
.supplier-demo--profile .page-header {
  align-items: center;
  margin: 0 0 22px;
  padding: 28px 32px 22px;
  color: #f6f1e8;
  background: #05152b;
}
.supplier-demo--profile .page-header p {
  display: none;
}
.supplier-demo--profile .page-header h1 {
  margin: 0;
  color: #f7f1e6;
  font-family: Fraunces, Georgia, serif;
  font-size: 40px;
  font-weight: 520;
  letter-spacing: -0.03em;
}
.supplier-demo--profile .page-actions {
  align-items: center;
  padding-top: 0;
}
.supplier-demo--profile .page-actions :deep(.el-button) {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 650;
}
.supplier-demo--profile
  .page-actions
  :deep(.el-button:not(.el-button--primary)) {
  color: #e8c27a;
  background: transparent;
  border-color: #c4a36a;
}
.supplier-demo--profile .page-actions :deep(.el-button--primary) {
  color: #05152b;
  background: #f7f1e6;
  border-color: #f7f1e6;
}
.supplier-demo--profile .dossier {
  padding: 0 22px;
}
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}
.page-kicker {
  margin: 0 0 6px;
  color: #8d5a32;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.page-header h1 {
  margin: 0;
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 40px;
  font-weight: 520;
  line-height: 1.05;
  letter-spacing: -0.035em;
}
.page-actions {
  display: flex;
  gap: 10px;
  padding-bottom: 4px;
}
.page-actions :deep(.el-button) {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 600;
}
.page-actions :deep(.el-button--primary) {
  color: #f7f1e6;
  background: #05152b;
  border-color: #05152b;
}
.community-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.supplier-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 92px;
  padding: 18px 22px;
  margin-bottom: 22px;
  background: #fffdf8;
  border: 1px solid #e6dccb;
  border-radius: 18px;
}
.supplier-identity {
  display: flex;
  align-items: center;
  gap: 16px;
}
.supplier-logo {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  color: #e8c27a;
  background: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 18px;
  font-weight: 520;
}
.supplier-label {
  margin-bottom: 4px;
  color: #8d5a32;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.supplier-identity:has(.supplier-select) .supplier-name {
  display: none;
}
.supplier-select {
  width: 290px;
}
.supplier-select :deep(.el-select__wrapper) {
  padding-left: 0;
  background: transparent;
  box-shadow: none !important;
  font-family: Fraunces, Georgia, serif;
  font-size: 22px;
  font-weight: 520;
}
.supplier-facts {
  display: flex;
  align-items: center;
  gap: 28px;
}
.supplier-facts > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.supplier-facts span {
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.supplier-facts strong {
  font-family: var(--hx-font-numeric);
  font-size: 18px;
  font-weight: 650;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.supplier-facts .progress-value {
  color: #8d5a32;
}
.compact-progress {
  display: block !important;
  width: 108px;
  height: 3px;
  border-radius: 99px;
  background: #eadfce;
  overflow: hidden;
}
.compact-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #05152b;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.metric-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-height: 118px;
  padding: 18px 18px 16px;
  background: #fffdf8;
  border: 1px solid #e6dccb;
  border-radius: 18px;
  box-shadow: none;
}
.metric-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #8d5a32;
  background: #f6efe4;
}
.metric-icon :deep(svg) {
  width: 16px;
}
.metric-icon--blue,
.metric-icon--green,
.metric-icon--purple,
.metric-icon--amber {
  color: #8d5a32;
  background: #f6efe4;
}
.metric-card div {
  display: flex;
  flex-direction: column;
}
.metric-card small,
.mini-metric span {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.metric-card strong {
  margin: 8px 0 4px;
  color: #05152b;
  font-family: var(--hx-font-numeric);
  font-size: 28px;
  font-weight: 650;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.metric-card p {
  margin: 0;
  color: #8a7d70;
  font-size: 12px;
}
.surface-card {
  background: #fffdf8;
  border: 1px solid #e6dccb;
  border-radius: 18px;
  box-shadow: none;
}
.surface-card :deep(.el-card__body) {
  padding: 0;
}
.onboarding-card :deep(.el-card__body) {
  padding: 0 22px 24px;
}
.dossier {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
}
.dossier-rail {
  position: sticky;
  top: 16px;
  padding: 26px 20px;
  color: #f6f1e8;
  background: #05152b
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M0 159h160M159 0v160' fill='none' stroke='%23ffffff14'/%3E%3C/svg%3E");
  border-radius: 22px;
}
.dossier-rail p {
  margin: 0 0 16px;
  color: #d7b48a;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.dossier-rail strong {
  display: block;
  font-family: Fraunces, Georgia, serif;
  font-size: 28px;
  font-weight: 520;
  line-height: 1.12;
}
.dossier-rail em {
  display: inline-block;
  margin-top: 14px;
  padding: 8px 14px;
  border-radius: 999px;
  color: #05152b;
  background: #e8c27a;
  font-style: normal;
  font-size: 16px;
  font-weight: 800;
}
.profile-status {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: #f7f1e6;
  border: 1px solid #e4d3b8;
  border-radius: 14px;
}
.profile-status__heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
}
.profile-status__heading span {
  color: #6f5b40;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.profile-status__heading strong {
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.profile-status p {
  display: block;
  width: 100%;
  margin: 7px 0 0;
  color: #6a5334;
  font-size: 13px;
  line-height: 1.45;
}
.profile-status.is-review,
.profile-status-pill.is-review {
  background: #fff1d6;
  border-color: #e2b15a;
}
.profile-status.is-review strong,
.profile-status-pill.is-review {
  color: #8a3d00;
}
.profile-status-pill.is-review {
  background: #8a3d00;
  color: #fff8ee;
}
.profile-status.is-approved {
  background: #e7f6ec;
  border-color: #9dceb0;
}
.profile-status.is-approved strong,
.profile-status-pill.is-approved {
  color: #146c3a;
}
.profile-status-pill.is-approved {
  background: #146c3a;
  color: #f3fff6;
}
.profile-status.is-rejected {
  background: #fdecea;
  border-color: #e7b2ab;
}
.profile-status.is-rejected strong,
.profile-status-pill.is-rejected {
  color: #a3261c;
}
.profile-status-pill.is-rejected {
  background: #a3261c;
  color: #fff6f5;
}
.profile-status.is-draft {
  background: #f4f1ea;
}
.profile-status.is-draft strong {
  color: #5c564c;
}
.dossier-rail nav {
  display: grid;
  gap: 2px;
  margin-top: 26px;
}
.dossier-rail button {
  position: relative;
  display: flex;
  gap: 12px;
  width: 100%;
  padding: 9px 0 9px 12px;
  color: #efe7dc;
  text-align: left;
  background: transparent;
  border: 0;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.dossier-rail button.is-active {
  color: #e8c27a;
}
.dossier-rail button.is-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #e8c27a;
}
.dossier-rail small {
  display: block;
  margin-top: 18px;
  color: #f0b4a2;
  line-height: 1.45;
}
.profile-main {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.lightbox {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px 22px;
  background: #fff;
  border: 1px solid #e9e2d3;
  border-left: 5px solid #c99b4a;
  border-radius: 12px;
}
.lightbox p {
  margin: 0;
  color: #7a8090;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.lightbox h2 {
  margin: 4px 0;
  font-family: Fraunces, Georgia, serif;
  font-size: 28px;
  font-weight: 520;
  color: #05152b;
}
.lightbox small {
  color: #7a8090;
}
.lightbox em {
  flex: none;
  padding: 5px 12px;
  border-radius: 14px;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}
.lightbox em.is-ok {
  background: #e8f5ec;
  color: #2e7d4f;
}
.lightbox em.is-warn {
  background: #fdecea;
  color: #c0392b;
}
.lightbox em.is-wait {
  background: #fdf1de;
  color: #b6791f;
}
.error-banner {
  padding: 14px 18px;
  background: #fdecea;
  border: 1px solid #f1c3bd;
  border-left: 4px solid #c0392b;
  border-radius: 10px;
}
.error-banner strong {
  display: block;
  margin-bottom: 8px;
  color: #c0392b;
}
.error-banner button {
  margin: 0 8px 8px 0;
  padding: 6px 12px;
  border: 1px solid #f1c3bd;
  border-radius: 16px;
  background: #fff;
  color: #c0392b;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.review-lock {
  margin: 0;
  padding: 12px 16px;
  border-radius: 14px;
  background: #fff4e5;
  color: #8d5a32;
  font-weight: 700;
}
.dossier-sheet {
  overflow: hidden;
  background: #fffdf8;
  border: 1px solid #e4d8c6;
  border-radius: 24px;
  box-shadow: 0 22px 48px rgba(5, 21, 43, 0.06);
}
.dossier-sheet .sec-h {
  display: none;
}
.dossier-sheet.is-all .sec-h {
  display: flex;
}
.dossier-sheet.is-all section + section {
  border-top: 1px solid #efe4d4;
}
.profile-field {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  margin-bottom: 16px;
}
.profile-field > span {
  color: #3a3f4a;
  font-size: 13px;
  font-weight: 700;
}
.profile-field > span i,
.doc-row i {
  color: #c0392b;
  font-style: normal;
}
.profile-field > small,
.doc-row .err {
  color: #c0392b;
  font-size: 13px;
  font-weight: 700;
}
.profile-field.error :deep(.el-input__wrapper),
.profile-field.error :deep(.el-textarea__inner) {
  background: #fdecea;
  box-shadow: 0 0 0 2px #c0392b inset;
}
.profile-field.error :deep(.el-input-group) {
  border-radius: 8px;
  box-shadow: 0 0 0 2px #c0392b;
}
.profile-field.error :deep(.el-input-group .el-input__wrapper) {
  box-shadow: none;
  background: #fdecea;
}
.profile-field.error :deep(.dial-prepend .el-select__wrapper) {
  background: transparent;
  box-shadow: none;
}
.same-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  margin: 2px 0 0;
  color: #7a7166;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
}
.same-line input {
  width: 16px;
  height: 16px;
  margin: 1px 0 0;
  flex: none;
  accent-color: #05152b;
}
.same-line span {
  min-width: 0;
}
.service-pills {
  margin-bottom: 16px;
}
.service-pills strong {
  display: block;
  margin-bottom: 8px;
}
.service-pills > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.service-pills span {
  padding: 6px 12px;
  border: 1px solid #dde0e6;
  border-radius: 16px;
  background: #eef0f3;
  color: #3a3f4a;
  font-size: 13px;
  font-weight: 700;
}
.service-category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.service-category-options button {
  min-height: 36px;
  padding: 6px 14px;
  border: 1px solid #dde0e6;
  border-radius: 999px;
  background: #fff;
  color: #05152b;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.service-category-options button.is-on {
  color: #f7f1e6;
  background: #05152b;
  border-color: #05152b;
}
.service-category-options button:disabled {
  cursor: default;
}
.service-category-options button:disabled:not(.is-on) {
  color: #7a7166;
  background: #f6f4f0;
}
.service-pills em,
.service-pills p,
.doc-row small {
  color: #7a7166;
  font-size: 12px;
  font-style: normal;
}
.service-pills .profile-field {
  margin-top: 12px;
}
.doc-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  padding: 16px;
  border: 1px solid #e9e2d3;
  border-radius: 10px;
  background: #fff;
}
.doc-row.error {
  border: 2px solid #c0392b;
  background: #fffafa;
}
.doc-row p {
  display: flex;
  gap: 8px;
  margin: 6px 0 0;
}
.doc-row button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2e7d4f;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.doc-row .is-remove {
  color: #c0392b;
}
.doc-uploading {
  display: block;
  margin-top: 6px;
  color: #0c243b;
  font-weight: 700;
}
.doc-progress {
  height: 4px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #efe4d4;
}
.doc-progress > span {
  display: block;
  height: 100%;
  background: #0c243b;
  transition: width 0.2s linear;
}
.profile-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #e9e2d3;
  border-radius: 12px;
}
.dossier-sheet section {
  padding: 28px 32px 12px;
}
.dossier-sheet section + section {
  border-top: 1px solid #efe4d4;
}
.dossier-sheet header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}
.dossier-sheet h2 {
  margin: 0;
  font-family: Fraunces, Georgia, serif;
  font-size: 30px;
  font-weight: 520;
  letter-spacing: -0.03em;
  color: #05152b;
}
.dossier-sheet header p {
  margin: 4px 0 0;
  color: #7a7166;
  font-size: 13px;
}
.dossier-sheet header .el-button {
  margin-left: auto;
}
.dossier-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 22px;
  min-width: 0;
  align-items: start;
}
.dossier-grid.align-fields .profile-field > span {
  min-height: 2.7em;
}
.field-hint {
  margin: 6px 0 0;
  color: #8a5a2b;
  font-size: 12px;
  line-height: 1.45;
}
.dossier-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.dossier-grid :deep(.el-form-item__label) {
  color: #5c564c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.dossier-grid :deep(.el-input),
.dossier-grid :deep(.el-input-number),
.dossier-grid :deep(.el-date-editor),
.dossier-grid :deep(.el-select) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}
.dossier-grid :deep(.el-input__inner) {
  min-width: 0;
}
.dossier-grid :deep(.el-input-group) {
  display: flex;
  width: 100%;
  min-width: 0;
}
.dossier-grid :deep(.el-input-group__prepend) {
  flex: 0 0 84px;
  width: 84px;
  padding: 0;
  overflow: hidden;
  background: #05152b;
  border-radius: 8px 0 0 8px;
  box-shadow: none;
}
.dossier-grid :deep(.el-input-group .el-input__wrapper) {
  flex: 1;
  min-width: 0;
  border-radius: 0 8px 8px 0;
}
.dossier-grid :deep(.dial-prepend) {
  width: 84px;
  margin: 0;
}
.dossier-grid :deep(.dial-prepend .el-select__wrapper) {
  min-height: 40px;
  padding: 0 8px;
  background: transparent;
  box-shadow: none;
}
.dossier-grid :deep(.dial-prepend .el-select__selected-item),
.dossier-grid :deep(.dial-prepend .el-select__placeholder),
.dossier-grid :deep(.dial-prepend .el-select__caret) {
  color: #f7f1e6;
  font-weight: 700;
}
.dossier-grid :deep(.el-input__wrapper),
.dossier-grid :deep(.el-select__wrapper) {
  min-height: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e6dccb inset;
}
.plain-count {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 1px #e6dccb inset;
  color: #05152b;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
}
.plain-count:disabled {
  color: #7a7166;
  background: #f7f4ee;
}
.doc-list article > svg {
  width: 18px;
  height: 18px;
  color: #8d5a32;
}
.dossier-toggles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 4px 0 12px;
}
@media (min-width: 1500px) {
  .dossier-toggles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.expected-services {
  display: grid;
  gap: 8px;
  margin: 0 0 16px;
  color: #314255;
  font-size: 13px;
  line-height: 1.5;
}
.expected-services p {
  margin: 0;
}
.expected-services strong {
  color: #05152b;
}
.expected-services__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.expected-services__chips span {
  min-height: 34px;
  padding: 4px 14px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #05152b;
  border-radius: 999px;
  background: #05152b;
  color: #f7f1e6;
  font-size: 14px;
  font-weight: 650;
}
.expected-services__chips em {
  color: #7a7166;
  font-style: normal;
}
.community-picks {
  display: grid;
  gap: 12px;
  margin: 4px 0 16px;
}
.community-picks > strong {
  color: #111827;
  font-size: 16px;
  font-weight: 800;
}
.community-picks > strong i {
  color: #c2412d;
  font-style: normal;
}
.community-picks__options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.community-picks__options button {
  min-height: 44px;
  padding: 0 22px;
  border: 1.5px solid #d5dbe3;
  border-radius: 999px;
  background: #fff;
  color: #05152b;
  font: inherit;
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
}
.community-picks__options button.is-on {
  border-color: #071426;
  background: #071426;
  color: #fff;
}
.community-picks__options button:disabled {
  cursor: default;
}
.community-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 18px;
}
.community-fields article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 76px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #eadfce;
  border-radius: 14px;
}
.community-fields strong {
  display: block;
  color: #05152b;
  font-size: 14px;
}
.community-fields small {
  display: block;
  margin-top: 4px;
  color: #7a7166;
  font-size: 12px;
  line-height: 1.4;
}
.community-note {
  margin-bottom: 8px;
}
.dossier-toggles label,
.dossier-toggle,
.policy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #eadfce;
  border-radius: 14px;
}
.dossier-toggles :deep(.el-radio-group) {
  display: inline-flex;
  flex: none;
  flex-wrap: nowrap;
  gap: 18px;
}
.dossier-toggles :deep(.el-radio) {
  height: auto;
  margin-right: 0;
}
.dossier-toggles span,
.policy-row > div {
  display: grid;
  min-width: 0;
}
.dossier-toggles strong,
.policy-row strong {
  color: #05152b;
  font-size: 14px;
}
.dossier-toggles small,
.policy-row small {
  color: #7a7166;
  font-size: 12px;
}
.policy-row {
  margin-bottom: 10px;
}
.doc-list {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}
.doc-list article {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #eadfce;
  border-radius: 14px;
}
.doc-list strong,
.doc-list small {
  display: block;
}
.doc-list small,
.doc-list article > span {
  color: #7a7166;
  font-size: 12px;
}
.policy-row {
  align-items: flex-start;
  margin-bottom: 10px;
}
.policy-row div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.policy-row small {
  color: #8a7d70;
  font-size: 12px;
}
.policy-files {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}
.policy-files li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.policy-files button,
.doc-view,
.doc-thumb {
  border: 0;
  padding: 0;
  background: transparent;
  color: #05152b;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.policy-files button.policy-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
.policy-files button.is-remove {
  flex: 0 0 auto;
  color: #8d5a32;
  font-size: 12px;
  text-decoration: none;
}
.policy-thumb,
.doc-thumb {
  display: grid;
  flex: 0 0 48px;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid #eadfce !important;
  border-radius: 8px;
  background: #fffdf8 !important;
  text-decoration: none !important;
}
.doc-thumb {
  width: 56px;
  height: 44px;
}
.policy-thumb img,
.doc-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.doc-thumb svg {
  width: 18px;
  height: 18px;
  color: #8d5a32;
}
.policy-empty {
  margin: 0;
  color: #7a7166;
  font-size: 13px;
}
@media (max-width: 980px) {
  .dossier,
  .dossier-grid,
  .dossier-grid--three,
  .dossier-toggles,
  .community-fields {
    grid-template-columns: 1fr;
  }
  .dossier-rail {
    position: static;
  }
}
.section-tabs :deep(.el-tabs__header) {
  margin-bottom: 22px;
}
.section-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--line);
}
.section-tabs :deep(.el-tabs__item) {
  height: 54px;
  padding: 0 22px;
  font-weight: 600;
}
.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin: 2px 0 20px;
}
.section-heading h2 {
  margin: 0 0 4px;
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 26px;
  font-weight: 520;
  letter-spacing: -0.03em;
}
.section-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.section-heading.compact {
  align-items: center;
  margin: 0;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--line);
}
.section-heading.compact h2 {
  font-size: 22px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}
.form-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.span-2 {
  grid-column: span 2;
}
.form-grid :deep(.el-form-item) {
  margin-bottom: 17px;
}
.form-grid :deep(.el-form-item__label) {
  padding-bottom: 6px;
  color: #4e596d;
  font-size: 12px;
  font-weight: 600;
}
.form-grid :deep(.el-input-number),
.form-grid :deep(.el-select),
.form-grid :deep(.el-time-select) {
  width: 100%;
}
.field-suffix {
  margin-left: 8px;
  color: var(--muted);
  font-size: 12px;
}
.compliance-grid,
.toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding-top: 4px;
}
.compliance-item,
.toggle-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fbfcfe;
}
.compliance-item span,
.toggle-item span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.compliance-item strong,
.toggle-item strong {
  font-size: 13px;
}
.compliance-item small,
.toggle-item small {
  color: var(--muted);
  font-size: 11px;
}
.toggle-item {
  justify-content: space-between;
}
.toggle-item > span {
  order: 0;
}
.toggle-item :deep(.el-switch) {
  order: 1;
}
.gender-capacity {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 18px;
}
.gender-capacity > div {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f7f8fb;
  border-radius: 11px;
}
.gender-capacity span {
  color: var(--muted);
  font-size: 12px;
}
.gender-capacity strong {
  margin: 4px 0;
  font-size: 24px;
}
.gender-capacity small {
  color: #929aae;
}
.coverage-heading {
  align-items: center;
}
.coverage-legend {
  display: flex;
  gap: 13px;
}
.coverage-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-size: 11px;
}
.coverage-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.coverage-legend .standard {
  background: #4f7bd9;
}
.coverage-legend .extended {
  background: #d8892d;
}
.coverage-legend .restricted {
  background: #c04f5e;
}
.coverage-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 16px;
  padding: 15px 0;
  border: 1px solid #e4e5f1;
  border-radius: 11px;
  background: #fbfbfe;
}
.coverage-summary div {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 7px;
  border-right: 1px solid #e5e7ef;
}
.coverage-summary div:last-child {
  border-right: 0;
}
.coverage-summary strong {
  font-size: 20px;
}
.coverage-summary span {
  color: var(--muted);
  font-size: 11px;
}
.zone-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.zone-card {
  appearance: none;
  padding: 13px 14px;
  text-align: left;
  color: var(--ink);
  background: #fff;
  border: 1px solid #e3e6ee;
  border-radius: 11px;
  cursor: pointer;
  transition: 0.18s ease;
}
.zone-card:hover {
  transform: translateY(-1px);
  border-color: #c4a36a;
  box-shadow: 0 5px 14px rgba(5, 21, 43, 0.06);
}
.zone-card.selected {
  border-color: #05152b;
  background: #f7f3ec;
  box-shadow: inset 0 0 0 1px #05152b;
}
.zone-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.zone-top > span {
  padding: 3px 7px;
  color: #4e63a8;
  background: #edf1fc;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}
.zone-card--extended .zone-top > span {
  color: #a96221;
  background: #fff0dc;
}
.zone-card--restricted .zone-top > span {
  color: #a23d4b;
  background: #fdecef;
}
.zone-card > strong {
  display: block;
  margin-top: 7px;
  font-size: 12px;
}
.zone-card p {
  margin: 6px 0 3px;
  color: var(--muted);
  font-size: 10px;
}
.zone-card small {
  color: #9ba3b3;
  font-size: 10px;
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 17px 18px;
  border-bottom: 1px solid var(--line);
}
.table-search {
  display: flex;
  gap: 10px;
}
.table-search .el-input {
  width: 290px;
}
.table-search .el-select {
  width: 150px;
}
.table-search .el-date-editor {
  width: 260px;
}
.result-count {
  color: var(--muted);
  font-size: 12px;
}
.data-table {
  --el-table-header-bg-color: #f7f3ec;
  --el-table-row-hover-bg-color: #fbf8f3;
  --el-table-bg-color: #fffdf8;
}
.data-table :deep(th.el-table__cell) {
  height: 42px;
  color: #74685a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.data-table :deep(td.el-table__cell) {
  padding: 13px 0;
  border-bottom-color: #eef0f5;
}
.person-cell,
.service-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.person-cell > span,
.service-cell > span:last-child,
.muted-stack,
.order-id {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.person-cell strong,
.service-cell strong,
.order-id strong {
  font-size: 12px;
}
.person-cell small,
.service-cell small,
.muted-stack small,
.order-id small {
  color: var(--muted);
  font-size: 10px;
}
.tag-list,
.zone-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.zone-list span,
.zone-list em {
  padding: 3px 6px;
  color: #586375;
  background: #f0f2f6;
  border-radius: 5px;
  font-size: 10px;
  font-style: normal;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.status-pill i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.status-pill--available i {
  background: #2da77b;
  box-shadow: 0 0 0 3px #dff5ed;
}
.status-pill--busy i {
  background: #5378d3;
  box-shadow: 0 0 0 3px #e5eafd;
}
.status-pill--leave i {
  background: #a5acb9;
  box-shadow: 0 0 0 3px #eceef2;
}
.schedule-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: #fffdf8;
  border: 1px solid var(--line);
  border-radius: 16px;
}
.week-navigation,
.schedule-filters {
  display: flex;
  align-items: center;
  gap: 10px;
}
.week-navigation > div {
  display: flex;
  flex-direction: column;
  min-width: 210px;
  text-align: center;
}
.week-navigation strong {
  font-size: 13px;
}
.week-navigation span {
  margin-top: 2px;
  color: var(--muted);
  font-size: 10px;
}
.schedule-filters .el-select {
  width: 150px;
}
.mini-metric {
  display: flex;
  flex-direction: column;
  padding: 15px 17px;
  background: #fffdf8;
  border: 1px solid var(--line);
  border-radius: 16px;
}
.mini-metric strong {
  margin: 5px 0 2px;
  color: #05152b;
  font-family: var(--hx-font-numeric);
  font-size: 26px;
  font-weight: 650;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.mini-metric small {
  color: var(--muted);
  font-size: 10px;
}
.positive {
  color: #218367 !important;
}
.warning-text {
  color: #bb6d20 !important;
}
.schedule-card {
  overflow-x: auto;
}
.schedule-card :deep(.el-card__body) {
  min-width: 1180px;
}
.schedule-grid {
  display: grid;
  grid-template-columns: 190px repeat(7, minmax(125px, 1fr));
}
.schedule-grid--header {
  border-bottom: 1px solid var(--line);
  background: #fafbfc;
}
.staff-column-title,
.day-head {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 68px;
  padding: 10px 13px;
  border-right: 1px solid var(--line);
}
.staff-column-title {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}
.day-head {
  align-items: center;
}
.day-head span,
.day-head small {
  color: var(--muted);
  font-size: 10px;
}
.day-head strong {
  margin: 2px 0;
  font-size: 14px;
}
.day-head.today {
  color: #8d5a32;
  background: #f6efe4;
}
.schedule-row {
  min-height: 96px;
  border-bottom: 1px solid var(--line);
}
.schedule-person {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px;
  border-right: 1px solid var(--line);
}
.schedule-person span {
  display: flex;
  flex-direction: column;
}
.schedule-person strong {
  font-size: 12px;
}
.schedule-person small {
  margin-top: 3px;
  color: var(--muted);
  font-size: 10px;
}
.shift-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  margin: 7px 5px;
  padding: 9px;
  text-align: left;
  color: #455064;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}
.shift-cell strong {
  margin-bottom: 3px;
  font-size: 11px;
}
.shift-cell span,
.shift-cell small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
}
.shift-cell small {
  margin-top: 3px;
  opacity: 0.72;
}
.shift-cell.standard {
  color: #285f72;
  background: #e9f7fa;
  border-color: #c6e9ed;
}
.shift-cell.busy {
  color: #6d4524;
  background: #f6efe4;
  border-color: #e4d3b8;
}
.shift-cell.leave {
  color: #7a6570;
  background: #f6eff2;
  border-color: #eadce2;
}
.shift-cell.open {
  align-items: center;
  color: #9ba3b0;
  background: #fff;
  border-color: #dfe3e9;
  border-style: dashed;
}
.add-shift {
  font-size: 18px !important;
}
.schedule-legend {
  display: flex;
  gap: 20px;
  padding: 13px 18px;
}
.schedule-legend span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 10px;
}
.schedule-legend i {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}
.shift-standard {
  background: #c6e9ed;
}
.shift-busy {
  background: #d9d2ff;
}
.shift-leave {
  background: #eadce2;
}
.shift-open {
  border: 1px dashed #c8cdd6;
}
.service-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  color: #8d5a32;
  background: #f6efe4;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 800;
}
.money-value {
  color: #263348;
  font-size: 12px;
  font-family: var(--hx-font-numeric);
  font-weight: 650;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.order-status {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
}
.order-status--pending {
  color: #9d5f20;
  background: #fff0da;
}
.order-status--confirmed {
  color: #425eb5;
  background: #e9edff;
}
.order-status--in_progress {
  color: #176f69;
  background: #def5f0;
}
.order-status--completed {
  color: #4e5a69;
  background: #edf0f3;
}
.picker-note,
.picker-hint {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}
.picker-fields {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}
.picker-fields label,
.phone-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.picker-fields label > span,
.phone-stack > span,
.quote-terms span {
  color: #74685a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.picker-fields :deep(.el-input-number) {
  width: 100%;
}
.picker-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.picker-toolbar .el-select,
.picker-toolbar .el-input {
  flex: 1;
}
.picker-list {
  max-height: min(420px, 46vh);
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.sv-add__note {
  margin: 0 0 14px;
  color: #7a7166;
  font-size: 13px;
  line-height: 1.5;
}
.picker-list__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f7f3ec;
  position: sticky;
  top: 0;
  z-index: 1;
}
.picker-list__bar small {
  color: var(--muted);
  font-size: 12px;
}
.picker-row {
  margin: 0;
  padding: 10px 12px;
  border-top: 1px solid var(--line);
}
.picker-row.is-added {
  opacity: 0.62;
}
.picker-row.is-open {
  background: #fffdf8;
}
.picker-row__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.picker-row__name {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.picker-row strong {
  font-size: 13px;
}
.picker-row small,
.picker-row em {
  color: var(--muted);
  font-size: 11px;
  font-style: normal;
}
.phone-stack {
  min-width: 0;
}
.phone-row {
  display: flex;
  gap: 8px;
}
.phone-row .el-input {
  flex: 1;
}
.quote-terms {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 18px 28px;
  margin-bottom: 14px;
  padding: 12px 14px;
  background: #f7f3ec;
  border-radius: 12px;
}
.quote-terms > div,
.quote-terms__price {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.quote-terms small {
  color: var(--muted);
  font-size: 12px;
}
.quote-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: min(56vh, 560px);
  overflow: auto;
}
.quote-lines__empty {
  margin: 28px 0;
  text-align: center;
  color: var(--muted);
}
.quote-line {
  display: grid;
  grid-template-columns: 72px minmax(148px, 1.2fr) repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
  align-items: end;
  padding: 12px 14px;
  background: #fffdf8;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.quote-line__switch {
  align-items: flex-start;
}
.quote-line__switch :deep(.el-switch) {
  height: 32px;
}
.quote-line.is-off {
  background: #f7f8f9;
}
.quote-line.is-off .quote-line__spec,
.quote-line.is-off .quote-line__price {
  opacity: 0.72;
}
.quote-line.is-off:has(.el-checkbox__input.is-disabled) .quote-line__switch {
  opacity: 0.5;
}
.quote-line.is-quote-target,
.rate-card.is-quote-target,
.rate-field.is-quote-target,
.quote-attach.is-quote-target {
  border-color: #c89447;
  box-shadow: 0 0 0 3px rgba(200, 148, 71, 0.28);
}
.quote-line__spec {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-bottom: 6px;
}
.quote-line__spec strong {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
}
.quote-line__spec small {
  color: var(--muted);
  font-size: 12px;
}
.quote-line label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.quote-line :deep(.el-input),
.quote-line :deep(.el-input-number) {
  width: 100%;
}
.quote-attaches {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}
.quote-attach-group {
  display: grid;
  gap: 8px;
}
.quote-attach-group__title {
  margin: 2px 0 0;
  color: #05152b;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.35;
}
.quote-attaches header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.quote-attaches header strong {
  color: var(--ink);
  font-size: 14px;
}
.quote-attaches header small,
.quote-attach small {
  color: var(--muted);
  font-size: 12px;
}
.quote-attach {
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) minmax(0, 220px);
  gap: 10px 12px;
  align-items: center;
  padding: 12px 14px;
  background: #fffdf8;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.quote-attach__name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.service-action__intro {
  min-width: 0;
  margin-bottom: 18px;
  padding: 18px 20px;
  overflow: hidden;
  color: #f7f1e6;
  background-color: #05152b;
  background-image:
    linear-gradient(90deg, rgba(5, 21, 43, 0.98), rgba(5, 21, 43, 0.62)),
    url("../../../../assets/images/admin/supplier-order-network.webp");
  background-position: center right;
  background-size: cover;
  border-radius: 14px;
}
.service-action__intro > span {
  color: #e8c27a;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.service-action__intro strong {
  display: block;
  margin-top: 7px;
  color: #fffdf8;
  font-family: Fraunces, Georgia, serif;
  font-size: 25px;
  font-weight: 520;
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.service-action__intro p {
  max-width: 440px;
  margin: 9px 0 0;
  color: rgba(247, 241, 230, 0.7);
  font-size: 11px;
  line-height: 1.55;
}
.service-action__note {
  display: grid;
  gap: 7px;
  min-width: 0;
  color: #74685a;
  font-size: 12px;
  font-weight: 700;
}
.service-action__note :deep(.el-textarea__inner) {
  min-height: 104px !important;
  border-radius: 10px;
}
.service-action__photos {
  display: grid;
  gap: 10px;
  min-width: 0;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #efe4d4;
}
.service-action__photos > div {
  min-width: 0;
}
.service-action__photos small {
  display: block;
  color: #8a7d70;
  font-weight: 500;
  line-height: 1.45;
}
.service-action__pick {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 38px;
  padding: 0 14px;
  overflow: hidden;
  color: #05152b;
  border: 1px solid #d9cbb7;
  border-radius: 9px;
  background: #fffdf8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.service-action__pick input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.service-action__photos ul {
  display: grid;
  gap: 7px;
  max-height: min(300px, 36vh);
  margin: 0;
  padding: 2px 4px 2px 0;
  overflow: auto;
  list-style: none;
}
.service-action__photos li {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 7px;
  background: #f8f4ed;
  border: 1px solid #eee2d2;
  border-radius: 10px;
}
.service-action__photos li > span {
  min-width: 0;
  overflow: hidden;
  color: #27374c;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.service-action__photos li > .el-button {
  flex: 0 0 auto;
  margin-left: 0;
}
.service-action__photos img,
.order-photos img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
}
.service-action__photos button,
.order-photos button {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.sv-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.sv-editor {
  display: block;
  min-width: 0;
}
.sv-editor > * + * {
  margin-top: 16px;
}
.sv-eyebrow {
  margin: 0;
  color: #8d5a32;
  font-size: 13px;
  font-weight: 650;
}
.sv-title {
  margin: 0;
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 34px;
  font-weight: 520;
  letter-spacing: -0.02em;
}
.sv-supplier {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  background: #fffdf8;
  border: 1px solid #e4d8c6;
  border-radius: 18px;
}
.sv-avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 16px;
  background: #05152b;
  color: #f7f1e6;
  font-weight: 750;
  letter-spacing: 0.04em;
}
.sv-supplier__main {
  flex: 1;
  min-width: 0;
}
.sv-supplier__main small,
.sv-fact small {
  display: block;
  color: #7a7166;
  font-size: 12px;
}
.sv-supplier__main strong {
  display: block;
  margin: 2px 0 8px;
  color: #05152b;
  font-size: 18px;
}
.sv-supplier__main p {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.sv-supplier__main em {
  padding: 3px 10px;
  border-radius: 999px;
  background: #f4f1eb;
  color: #05152b;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}
.sv-supplier__main button {
  border: 0;
  background: transparent;
  color: #8d5a32;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}
.sv-fact {
  min-width: 120px;
}
.sv-fact strong {
  color: #05152b;
}
.sv-board,
.sv-quote {
  background: #fffdf8;
  border: 1px solid #e4d8c6;
  border-radius: 18px;
  overflow: hidden;
}
.sv-quote__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sv-quote__head p {
  margin: 4px 0 0;
  color: #7a7166;
  font-size: 13px;
}
.sv-quote {
  padding: 8px 0 0;
}
.sv-quote__head,
.sv-quote h3,
.mode-cards,
.rate-field,
.quote-lines,
.quote-attaches {
  padding-left: 18px;
  padding-right: 18px;
}
.sv-quote__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-top: 16px;
}
.sv-quote__head h2,
.sv-quote h3 {
  margin: 0;
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-weight: 520;
}
.sv-quote h3 {
  margin-top: 8px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 750;
}
.mode-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 10px;
}
.mode-cards button {
  display: grid;
  gap: 4px;
  min-height: 84px;
  padding: 14px;
  text-align: left;
  border: 1px solid #eadfce;
  border-radius: 14px;
  background: #fff;
  color: #05152b;
  cursor: pointer;
}
.mode-cards button.is-on {
  background: #05152b;
  color: #f7f1e6;
  border-color: #05152b;
}
.mode-cards small {
  color: #7a7166;
  font-size: 12px;
  line-height: 1.4;
}
.mode-cards button.is-on small {
  color: #d9d1c5;
}
.rate-field {
  display: grid;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  margin-top: 14px;
  color: #5c564c;
  font-size: 13px;
  font-weight: 700;
}
.rate-required {
  color: #b24f3e;
}
.sv-quote__foot {
  padding: 14px 18px;
  border-top: 1px solid #eadfce;
}
.sv-quote__foot > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 980px) {
  .sv-supplier,
  .mode-cards,
  .sv-quote__foot {
    flex-direction: column;
    align-items: stretch;
  }
  .mode-cards {
    grid-template-columns: 1fr;
  }
  .sv-title {
    font-size: 28px;
  }
}
.pricing-health {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
  padding: 15px 18px;
  background: #fff8eb;
  border: 1px solid #f0dbb5;
  border-radius: 16px;
}
.pricing-health > div {
  display: flex;
  align-items: center;
  gap: 12px;
}
.health-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: #218365;
  background: #d4f0e6;
  border-radius: 50%;
}
.pricing-health strong {
  font-size: 13px;
}
.pricing-health p {
  margin: 3px 0 0;
  color: #5f7b72;
  font-size: 11px;
}
.quote-dialog__meta {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 820px) {
  .quote-line {
    grid-template-columns: 1fr 1fr;
  }
  .quote-line__spec,
  .quote-line label:last-child {
    grid-column: 1 / -1;
  }
  .quote-attach {
    grid-template-columns: 1fr;
  }
  .quote-line__spec {
    padding-bottom: 0;
  }
}
.pricing-card {
  margin-bottom: 14px;
}
.pricing-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
}
.pricing-actions {
  display: flex;
  gap: 8px;
  padding-top: 13px;
}
.quote-service {
  display: flex;
  align-items: center;
  gap: 10px;
}
.quote-service > span {
  padding: 4px 6px;
  color: #8d5a32;
  background: #f6efe4;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
}
.quote-service > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.quote-service strong {
  font-size: 12px;
}
.quote-service small {
  color: var(--muted);
  font-size: 10px;
}
.price-value {
  color: #27334a;
  font-size: 13px;
  font-family: var(--hx-font-numeric);
  font-weight: 650;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.pricing-table :deep(.el-input-number) {
  width: 128px;
}
.pricing-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
}
.pricing-filter > span {
  font-size: 12px;
  font-weight: 700;
}
.pricing-filter .el-select {
  width: 170px;
}
.pricing-filter .el-input {
  width: 220px;
}
.pricing-filter small {
  color: var(--muted);
  font-size: 10px;
}
.pricing-bottom-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 14px;
}
.rule-list > div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 19px;
  border-bottom: 1px solid var(--line);
}
.rule-list > div:last-child {
  border-bottom: 0;
}
.rule-badge {
  display: inline-flex;
  justify-content: center;
  padding: 5px 7px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
}
.rule-badge--standard {
  color: #4269b5;
  background: #edf2fd;
}
.rule-badge--extended {
  color: #a86723;
  background: #fff0dc;
}
.rule-badge--restricted {
  color: #a94250;
  background: #fdecef;
}
.rule-list > div > span:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.rule-list strong {
  font-size: 12px;
}
.rule-list small {
  color: var(--muted);
  font-size: 10px;
}
.rule-values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}
.rule-values b {
  font-size: 11px;
}
.rule-values em {
  color: var(--muted);
  font-size: 10px;
  font-style: normal;
}
.terms-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin: 0;
  padding: 11px 20px 18px;
}
.terms-list div {
  padding: 10px 0;
  border-bottom: 1px solid #eff1f5;
}
.terms-list div:nth-last-child(-n + 2) {
  border-bottom: 0;
}
.terms-list dt {
  color: var(--muted);
  font-size: 10px;
}
.terms-list dd {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 700;
}
.drawer-order-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 0 19px;
  border-bottom: 1px solid var(--line);
}
.drawer-order-head > div > span {
  color: #8d5a32;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.drawer-order-head h2 {
  margin: 6px 0 3px;
  font-size: 19px;
}
.drawer-order-head p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.drawer-section {
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}
.drawer-section h3 {
  margin: 0 0 13px;
  font-size: 13px;
}
.detail-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin: 0;
}
.detail-list dt {
  color: var(--muted);
  font-size: 10px;
}
.detail-list dd {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 600;
}
.address-panel {
  display: flex;
  gap: 11px;
  padding: 13px;
  background: #f7f8fb;
  border-radius: 10px;
}
.address-panel > svg {
  flex: 0 0 auto;
  width: 19px;
  color: #8d5a32;
}
.address-panel div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.address-panel strong {
  font-size: 12px;
}
.address-panel p {
  margin: 0;
  color: #677186;
  font-size: 11px;
}
.address-panel span {
  color: #969dac;
  font-size: 10px;
}
.supplier-name {
  display: block;
  margin-top: 5px;
  font-size: 15px;
}
.overview-grid {
  display: grid;
  grid-template-columns: 1.55fr 0.85fr;
  gap: 14px;
  margin-bottom: 14px;
}
.overview-grid--bottom {
  grid-template-columns: 1.1fr 0.9fr;
}
.earnings-card :deep(.el-select) {
  width: 118px;
}
.earnings-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 270px;
  padding: 38px 26px 20px;
}
.bar-item {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: flex-end;
  width: 11%;
  height: 100%;
}
.bar-item i {
  display: block;
  width: 100%;
  max-width: 28px;
  min-height: 8px;
  background: linear-gradient(180deg, #e8c27a, #05152b);
  border-radius: 3px 3px 0 0;
  box-shadow: none;
}
.bar-item small {
  margin-top: 9px;
  color: var(--muted);
  font-size: 10px;
}
.bar-value {
  margin-bottom: 5px;
  color: #4f596d;
  font-size: 10px;
}
.capacity-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 22px;
}
.capacity-list > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 14px;
  align-items: center;
}
.capacity-list span {
  color: var(--muted);
  font-size: 11px;
}
.capacity-list strong {
  font-size: 12px;
}
.capacity-list :deep(.el-progress) {
  grid-column: 1 / -1;
}
.transaction-list > div {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 13px 19px;
  border-bottom: 1px solid var(--line);
}
.transaction-list > div:last-child {
  border-bottom: 0;
}
.transaction-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #298267;
  background: #e7f6f0;
  border-radius: 9px;
}
.transaction-icon :deep(svg) {
  width: 16px;
}
.transaction-list > div > span:nth-child(2),
.transaction-amount {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.transaction-list strong {
  font-size: 12px;
}
.transaction-list small {
  color: var(--muted);
  font-size: 10px;
}
.transaction-amount {
  text-align: right;
}
.transaction-amount strong {
  color: #263348;
}
.action-list button {
  display: grid;
  grid-template-columns: 32px 1fr 18px;
  align-items: center;
  width: 100%;
  gap: 11px;
  padding: 13px 18px;
  color: var(--ink);
  text-align: left;
  background: #fff;
  border: 0;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
}
.action-list button:last-child {
  border-bottom: 0;
}
.action-list button:hover {
  background: #fbf8f3;
}
.action-list button > span:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.action-list button strong {
  font-size: 12px;
}
.action-list button small {
  color: var(--muted);
  font-size: 10px;
}
.action-list button > svg {
  width: 14px;
  color: #a0a6b3;
}
.action-badge {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
}
.action-badge.amber,
.action-badge.purple,
.action-badge.blue {
  color: #8d5a32;
  background: #f6efe4;
}
.review-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 16px;
  background: #fff8eb;
  border: 1px solid #f1ddb7;
  border-radius: 11px;
}
.review-banner > span:first-child {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #a96c25;
  background: #ffedcf;
  border-radius: 9px;
}
.review-banner > span svg {
  width: 17px;
}
.review-banner > div {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}
.review-banner strong {
  font-size: 12px;
}
.review-banner p {
  margin: 0;
  color: #856d50;
  font-size: 10px;
}
.area-banner,
.schedule-review {
  margin-bottom: 14px;
  background: #f7f3ec;
  border-color: #e6dccb;
}
.schedule-review > span:first-child {
  color: #8d5a32;
  background: #f6efe4;
}
.schedule-review p {
  color: #74685a;
}
.document-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.document-cell > svg {
  width: 22px;
  color: #8d5a32;
}
.document-cell > span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.document-cell strong {
  font-size: 12px;
}
.document-cell small {
  color: var(--muted);
  font-size: 10px;
}
.coverage-type {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}
.coverage-type--standard {
  color: #4269b5;
  background: #edf2fd;
}
.coverage-type--extended {
  color: #a86723;
  background: #fff0dc;
}
.coverage-type--restricted {
  color: #a94250;
  background: #fdecef;
}
.health-icon.pending {
  color: #ac6a21;
  background: #ffe9c8;
}
.pricing-health:has(.health-icon.pending) {
  background: #fff8eb;
  border-color: #f0dbb5;
}
.pricing-health:has(.health-icon.pending) p {
  color: #806e57;
}
.requested-price {
  color: #a66722;
  font-size: 13px;
}
.muted-text {
  color: #a2a9b7;
}
.negative {
  color: #b84f5a;
  font-weight: 600;
}
.privacy-note {
  margin-top: 14px;
  padding: 11px 13px;
  color: #657083;
  background: #f3f5f8;
  border-radius: 9px;
  font-size: 10px;
  line-height: 1.55;
}
.dialog-tip {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 18px;
  padding: 11px 13px;
  color: #806a4d;
  background: #fff7e9;
  border-radius: 9px;
  font-size: 11px;
}
.dialog-tip > svg {
  width: 17px;
  flex: 0 0 auto;
}
.conflict-alert {
  display: flex;
  gap: 10px;
  padding: 12px;
  color: #a84650;
  background: #fdeff1;
  border: 1px solid #f0cfd4;
  border-radius: 9px;
}
.conflict-alert > svg {
  width: 18px;
  flex: 0 0 auto;
}
.conflict-alert span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.conflict-alert strong {
  font-size: 12px;
}
.conflict-alert small {
  font-size: 10px;
}
.settlement-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 18px;
}
.settlement-tabs :deep(.el-tabs__content) {
  overflow: visible;
}
.settlement-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 18px;
  padding: 12px 14px;
  color: #246e58;
  background: #eaf7f2;
  border-radius: 9px;
}
.settlement-note > svg {
  width: 20px;
}
.settlement-note span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.settlement-note strong {
  font-size: 11px;
}
.settlement-note small {
  color: #628176;
  font-size: 10px;
}
.linked-banner {
  background: #eef6ff;
  border-color: #d4e5f7;
}
.linked-banner > span:first-child {
  color: #3c74b7;
  background: #dcecff;
}
.linked-banner p {
  color: #64788f;
}
.area-link-tip {
  color: #526e8c;
  background: #eef6ff;
}
.option-id {
  float: right;
  margin-left: 18px;
  color: #9ba3b3;
}
.area-service-status,
.area-review-status {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
}
.area-service-status small,
.area-review-status small {
  color: var(--muted);
  font-size: 9px;
}
.pending-copy {
  color: #a66b24 !important;
}
.rejected-copy {
  color: #b84f5a !important;
}
.area-choice-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  max-height: 520px;
  margin-top: 12px;
  overflow: auto;
}
.area-choice-list :deep(.el-checkbox) {
  height: auto;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #e7ebf2;
  border-radius: 10px;
  white-space: normal;
  align-items: flex-start;
}
.area-choice-list :deep(.el-checkbox__input) {
  margin-top: 3px;
}
.area-choice-list :deep(.el-checkbox__label) {
  line-height: 1.4;
  white-space: normal;
}
.area-choice {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.area-choice strong {
  color: #1c2433;
  font-weight: 700;
}
.area-choice small {
  color: #6d7686;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
}
.area-alert,
.area-note {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 14px;
}
.area-alert {
  color: #8d2f2f;
  background: #fdecec;
  border: 1px solid #f3c7c7;
}
.area-note {
  color: #3d4d63;
  background: #eef3f8;
  border: 1px solid #d5e0ea;
}
.area-alert strong,
.area-note strong {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}
.area-alert p,
.area-note p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}
.area-board {
  overflow: hidden;
  background: #fffdf8;
  border: 1px solid var(--line);
  border-radius: 16px;
}
.area-board header {
  padding: 14px 18px;
  color: #74685a;
  font-size: 13px;
  border-bottom: 1px solid var(--line);
}
.area-board table {
  width: 100%;
  border-collapse: collapse;
}
.area-board th {
  padding: 12px 18px;
  color: #74685a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  background: #f7f3ec;
}
.area-board td {
  padding: 14px 18px;
  vertical-align: top;
  border-top: 1px solid #efe6d8;
}
.area-board td strong {
  color: #05152b;
}
.area-all {
  margin: 0;
  color: #74685a;
  font-style: italic;
}
.area-manage-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}
.area-manage-tools .el-input {
  flex: 1;
}
.area-manage-tools > div {
  display: flex;
  gap: 8px;
}
.area-manage-note {
  margin: 12px 0;
  color: #74685a;
  font-size: 13px;
  line-height: 1.45;
}
.area-zone-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
  overflow: auto;
}
.area-zone {
  border: 1px solid #eadfce;
  border-radius: 12px;
  background: #fff;
}
.area-zone header {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 28px;
  gap: 10px;
  align-items: center;
  padding: 12px;
}
.area-zone header > button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.area-zone header strong {
  color: #05152b;
  font-size: 15px;
}
.area-zone header small {
  color: #74685a;
  font-size: 12px;
}
.area-zone header input,
.area-communities input {
  width: 16px;
  height: 16px;
  accent-color: #05152b;
}
.area-zone__chevron {
  justify-content: center !important;
  align-items: center !important;
  color: #74685a;
  font-size: 16px;
}
.area-communities {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  padding: 0 12px 12px 44px;
}
.area-communities > p {
  grid-column: 1 / -1;
  margin: 0;
  color: #74685a;
}
.area-communities label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #243044;
  font-size: 13px;
  line-height: 1.4;
}
.area-communities label.is-dim {
  opacity: 0.38;
}
.area-zone mark,
.area-communities mark {
  padding: 0 1px;
  color: inherit;
  background: #f3e2b8;
}
.area-dialog-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.area-dialog-foot > span {
  color: #74685a;
  font-size: 13px;
}
@media (max-width: 720px) {
  .area-manage-tools,
  .area-dialog-foot {
    align-items: stretch;
    flex-direction: column;
  }
  .area-communities {
    grid-template-columns: 1fr;
    padding-left: 12px;
  }
}
.phone-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.45;
}
.accept-state {
  margin-right: 8px;
  color: #1f8a5b;
  font-size: 12px;
  font-weight: 700;
}
.accept-state.is-off {
  color: #8a7d70;
}
.data-table :deep(td.phone-col .cell) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}
.data-table :deep(td.order-wrap .cell) {
  white-space: normal;
  overflow: hidden;
  text-overflow: clip;
}
.orders-command {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.9fr);
  gap: 28px;
  align-items: end;
  min-width: 0;
  min-height: 206px;
  margin-bottom: 18px;
  padding: 28px 30px;
  overflow: hidden;
  color: #f7f1e6;
  background-color: #05152b;
  background-image:
    linear-gradient(
      90deg,
      rgba(5, 21, 43, 0.98) 0%,
      rgba(5, 21, 43, 0.9) 44%,
      rgba(5, 21, 43, 0.38) 100%
    ),
    url("../../../../assets/images/admin/supplier-order-network.webp");
  background-position: center right;
  background-size: cover;
  border: 1px solid rgba(232, 194, 122, 0.26);
  border-radius: 22px;
  box-shadow: 0 24px 54px rgba(5, 21, 43, 0.16);
  animation: order-reveal 0.42s ease-out both;
}
.orders-command::after {
  position: absolute;
  z-index: -1;
  inset: auto -8% -68% 40%;
  height: 180px;
  content: "";
  background: radial-gradient(
    circle,
    rgba(232, 194, 122, 0.16),
    transparent 66%
  );
  pointer-events: none;
}
.orders-command__copy {
  min-width: 0;
}
.orders-command__copy > span {
  color: #e8c27a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.orders-command__copy h2 {
  margin: 8px 0 8px;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(30px, 3.2vw, 44px);
  font-weight: 520;
  line-height: 1;
  letter-spacing: -0.035em;
}
.orders-command__copy p {
  max-width: 520px;
  margin: 0;
  color: rgba(247, 241, 230, 0.72);
  font-size: 13px;
  line-height: 1.6;
}
.orders-command__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}
.orders-command__metrics article {
  min-width: 0;
  padding: 15px 16px;
  background: rgba(5, 21, 43, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 15px;
  backdrop-filter: blur(12px);
}
.orders-command__metrics span,
.orders-command__metrics small {
  display: block;
  overflow: hidden;
  color: rgba(247, 241, 230, 0.62);
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.orders-command__metrics span {
  color: #d8c19a;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.orders-command__metrics strong {
  display: block;
  margin: 8px 0 4px;
  color: #fffdf8;
  font-family: var(--hx-font-numeric);
  font-size: 28px;
  font-weight: 650;
  line-height: 1;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.orders-card :deep(.el-card__body) {
  padding: 0;
}
.order-toolbar {
  display: grid;
  gap: 15px;
  padding: 18px 20px 20px;
  border-bottom: 1px solid var(--line);
}
.order-toolbar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}
.order-toolbar__head > div {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.order-toolbar__head strong {
  color: #05152b;
  font-size: 15px;
}
.order-toolbar__head span {
  color: #8a7d70;
  font-size: 12px;
}
.order-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  min-width: 0;
}
.order-filter {
  display: grid;
  flex: 1 1 160px;
  gap: 6px;
  min-width: 0;
  color: #74685a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.order-filter--date {
  flex: 1.45 1 270px;
}
.order-filter .el-input,
.order-filter .el-select,
.order-filter :deep(.el-date-editor) {
  width: 100%;
  min-width: 0;
}
.order-filter :deep(.el-input__wrapper),
.order-filter :deep(.el-select__wrapper),
.order-filter :deep(.el-date-editor) {
  min-height: 40px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e6dccb inset;
}
.order-search {
  flex: 0 0 auto;
  min-width: 94px;
  height: 40px;
}
.orders-table-shell {
  min-width: 0;
  overflow-x: auto;
}
.orders-table {
  min-width: 1360px;
}
.order-pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 18px 14px;
}
.orders-table :deep(td.el-table__cell) {
  vertical-align: top;
}
.orders-table :deep(.order-status-col .cell) {
  white-space: nowrap;
}
.order-no {
  padding: 0;
  border: 0;
  background: transparent;
  color: #05152b;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.order-no:hover {
  color: #0b2747;
}
.order-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}
.order-cell--end {
  align-items: flex-end;
}
.order-cell strong {
  max-width: 100%;
  color: #05152b;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.order-cell small,
.order-cell > span {
  color: #74685a;
  font-size: 12px;
  line-height: 1.4;
}
.order-clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.order-remark-text {
  color: #05152b;
  font-weight: 600;
}
.order-alert,
.order-reschedule {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
}
.order-alert {
  color: #b42318;
}
.order-reschedule {
  color: #9a6700;
}
.order-pin,
.order-map {
  color: #05152b;
  font-size: 12px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.money-value {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
  white-space: nowrap;
}
.money-value > small {
  color: #8d5a32;
  font-size: 9px;
  letter-spacing: 0.08em;
}
.order-row-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  white-space: nowrap;
}
.order-row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.orders-mobile {
  display: none;
}
.order-sheet {
  min-width: 0;
  min-height: 180px;
}
.order-lead {
  position: relative;
  isolation: isolate;
  min-width: 0;
  padding: 26px;
  overflow: hidden;
  color: #f7f1e6;
  background-color: #05152b;
  background-image:
    linear-gradient(
      90deg,
      rgba(5, 21, 43, 0.98),
      rgba(5, 21, 43, 0.74) 60%,
      rgba(5, 21, 43, 0.42)
    ),
    url("../../../../assets/images/admin/supplier-order-network.webp");
  background-position: center right;
  background-size: cover;
  border-radius: 20px;
}
.order-lead::after {
  position: absolute;
  z-index: -1;
  right: -30px;
  bottom: -90px;
  width: 260px;
  height: 180px;
  content: "";
  background: radial-gradient(
    circle,
    rgba(232, 194, 122, 0.2),
    transparent 68%
  );
}
.order-lead__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}
.order-lead__topline > span {
  color: #e8c27a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.order-lead__number {
  display: block;
  margin-top: 20px;
  color: #e8c27a !important;
  font-size: 12px !important;
  letter-spacing: normal;
  text-transform: uppercase;
  font-family: var(--hx-font-numeric);
  font-weight: 600;
  font-variant-numeric: lining-nums tabular-nums;
}
.order-lead h2 {
  max-width: 560px;
  margin: 7px 0 7px;
  color: #fffdf8;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 520;
  line-height: 1.1;
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
}
.order-lead > p {
  margin: 0;
  color: rgba(247, 241, 230, 0.66);
  font-size: 12px;
}
.order-lead__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-width: 560px;
  margin-top: 24px;
}
.order-lead__summary > div {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 12px 14px;
  background: rgba(5, 21, 43, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
.order-lead__summary svg {
  flex: 0 0 auto;
  width: 17px;
  color: #e8c27a;
}
.order-lead__summary span {
  min-width: 0;
}
.order-lead__summary small,
.order-lead__summary strong {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.order-lead__summary small {
  color: rgba(247, 241, 230, 0.58);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.order-lead__summary strong {
  margin-top: 4px;
  color: #fffdf8;
  font-size: 12px;
}
.order-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
  min-width: 0;
}
.order-panel {
  min-width: 0;
  padding: 18px;
  background: #fffdf8;
  border: 1px solid #e9decd;
  border-radius: 16px;
}
.order-panel--wide {
  grid-column: 1 / -1;
}
.order-facts span,
.order-quote span {
  display: block;
  color: #8a7d70;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.order-sheet h3 {
  margin: 0 0 16px;
  color: #74685a;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.order-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  min-width: 0;
}
.order-facts > div {
  min-width: 0;
}
.order-facts .is-wide {
  grid-column: 1 / -1;
}
.order-facts strong {
  display: block;
  margin-top: 4px;
  color: #05152b;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.order-facts strong.phone-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-style: normal;
}
.order-facts .phone-list em {
  font-style: normal;
  font-weight: 650;
}
.order-address {
  margin: 0;
  color: #05152b;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.order-map {
  display: inline-flex;
  margin-top: 10px;
  font-size: 13px;
}
.order-quote {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.order-quote > div {
  min-width: 0;
  padding: 14px;
  background: #f7f3ec;
  border-radius: 13px;
}
.order-quote strong {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 6px;
  color: #05152b;
  font-family: var(--hx-font-numeric);
  font-size: 25px;
  font-weight: 650;
  letter-spacing: normal;
  overflow-wrap: anywhere;
  font-variant-numeric: lining-nums tabular-nums;
}
.order-quote strong > small {
  color: #8d5a32;
  font-family: Sora, "PingFang SC", sans-serif;
  font-size: 9px;
  letter-spacing: 0.08em;
}
.order-quote small {
  display: block;
  margin-top: 4px;
  color: #74685a;
  font-size: 11px;
}
.order-groups {
  position: relative;
  display: grid;
  gap: 16px;
  padding-left: 28px;
}
.order-groups::before {
  content: "";
  position: absolute;
  top: 18px;
  bottom: 18px;
  left: 10px;
  width: 2px;
  background: #ead7bf;
}
.order-group {
  position: relative;
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #efe7dc;
  border-radius: 14px;
  background: #fff;
}
.order-group--addon {
  border-color: #ead7bf;
  background: #fffaf3;
}
.order-group header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
}
.order-group header i {
  position: absolute;
  top: 14px;
  left: -28px;
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  background: #24384c;
  color: #fff;
  font-size: 11px;
  font-style: normal;
  font-weight: 750;
}
.order-group--addon header i {
  background: #8a5a12;
}
.order-lines code,
.staff-order-group code {
  display: inline-block;
  width: fit-content;
  padding: 2px 7px;
  border-radius: 999px;
  background: #24384c;
  color: #fff;
  font-size: 12px;
  font-weight: 750;
}
.order-group header strong {
  color: #24384c;
  font-size: 14px;
}
.order-group header small {
  color: #8d5a32;
  font-size: 12px;
}
.order-attaches {
  display: grid;
  gap: 10px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}
.order-attaches li {
  display: grid;
  gap: 6px;
  padding-bottom: 10px;
  border-bottom: 1px solid #efe7dc;
}
.order-attaches li:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.order-attaches p {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: baseline;
  margin: 0;
}
.order-attaches small {
  color: #8d5a32;
  font-size: 12px;
  font-weight: 750;
}
.order-attaches em {
  color: #74685a;
  font-style: normal;
  font-size: 12px;
}
.order-attaches dl {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0;
}
.order-attaches dt {
  color: #8a7d70;
  font-size: 11px;
}
.order-attaches dd {
  margin: 2px 0 0;
  color: #05152b;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.order-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}
.order-lines article {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 16px;
  align-items: center;
  padding: 14px;
  background: #f7f3ec;
  border-radius: 12px;
}
.order-lines article > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.order-lines small {
  color: #74685a;
}
.order-lines dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}
.order-lines dt {
  color: #8a7d70;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.order-lines dd {
  margin: 4px 0 0;
  color: #05152b;
  font-size: 12px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.order-photos {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
  margin: 0;
}
.order-photos h3 {
  flex: 1 0 100%;
}
.order-photos img {
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: 11px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.order-photos button {
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 11px;
  background: transparent;
  cursor: pointer;
}
.order-photos button:hover img {
  transform: scale(1.035);
  box-shadow: 0 8px 22px rgba(5, 21, 43, 0.18);
}
.order-drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-width: 0;
}
.order-drawer-footer > div {
  display: grid;
  min-width: 0;
}
.order-drawer-footer > div span {
  color: #8a7d70;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.order-drawer-footer > div strong {
  margin-top: 3px;
  color: #05152b;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.order-drawer-footer__done {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #28785f;
  font-size: 12px;
  font-weight: 700;
}
.order-drawer-footer__done svg {
  width: 17px;
}
@keyframes order-reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .orders-command {
    animation: none;
  }
  .order-photos img {
    transition: none;
  }
}
@media (max-width: 1180px) {
  .orders-command {
    grid-template-columns: minmax(0, 1fr);
  }
  .orders-command__metrics {
    max-width: 560px;
  }
}
@media (max-width: 760px) {
  .orders-command {
    min-height: 0;
    padding: 22px;
    background-position: 66% center;
  }
  .orders-command__metrics {
    grid-template-columns: repeat(3, minmax(96px, 1fr));
    max-width: none;
    overflow-x: auto;
  }
  .orders-command__metrics article {
    padding: 13px;
  }
  .order-toolbar__head {
    align-items: flex-start;
  }
  .order-toolbar__head > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }
  .order-filter,
  .order-filter--date {
    flex: 1 1 100%;
  }
  .order-search {
    width: 100%;
  }
  .orders-table-shell {
    display: none;
  }
  .orders-mobile {
    display: grid;
    gap: 10px;
    padding: 12px;
    background: #f7f3ec;
  }
  .order-mobile-card {
    min-width: 0;
    padding: 16px;
    background: #fffdf8;
    border: 1px solid #e6dccb;
    border-radius: 15px;
  }
  .order-mobile-card header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .order-mobile-card h3 {
    margin: 14px 0 5px;
    color: #05152b;
    font-family: Fraunces, Georgia, serif;
    font-size: 21px;
    font-weight: 520;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .order-mobile-card > p {
    margin: 0;
    color: #74685a;
    font-size: 12px;
    line-height: 1.5;
  }
  .order-mobile-card dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
    margin: 18px 0 0;
    padding-top: 14px;
    border-top: 1px solid #efe4d4;
  }
  .order-mobile-card dl .is-wide {
    grid-column: 1 / -1;
  }
  .order-mobile-card dt {
    color: #8a7d70;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  .order-mobile-card dd {
    margin: 4px 0 0;
    color: #05152b;
    font-size: 12px;
    font-weight: 650;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .order-mobile-card footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  .order-mobile-card footer :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  .order-pager {
    justify-content: center;
  }
  .order-lead {
    padding: 20px;
  }
  .order-lead__topline {
    align-items: flex-start;
  }
  .order-lead__summary,
  .order-detail-grid,
  .order-facts,
  .order-quote {
    grid-template-columns: minmax(0, 1fr);
  }
  .order-panel--wide {
    grid-column: auto;
  }
  .order-facts .is-wide {
    grid-column: auto;
  }
  .order-lines article {
    grid-template-columns: minmax(0, 1fr);
  }
  .order-lines dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 480px) {
  .supplier-demo {
    padding-right: 12px;
    padding-left: 12px;
  }
  .orders-command {
    padding: 19px;
    border-radius: 18px;
  }
  .orders-command__copy h2 {
    font-size: 30px;
  }
  .orders-command__metrics {
    grid-template-columns: repeat(3, 102px);
    margin-right: -19px;
    padding-right: 19px;
  }
  .order-toolbar {
    padding: 16px;
  }
  .order-lead__summary {
    grid-template-columns: minmax(0, 1fr);
  }
  .order-drawer-footer {
    align-items: stretch;
    flex-direction: column;
  }
  .order-drawer-footer :deep(.el-button),
  .order-drawer-footer__done {
    width: 100%;
    justify-content: center;
  }
}
@media (max-width: 1200px) {
  .supplier-facts {
    gap: 16px;
  }
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .zone-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .form-grid--three {
    grid-template-columns: repeat(2, 1fr);
  }
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

/* Services & pricing workspace */
.pricing-command {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(390px, 0.75fr);
  gap: 32px;
  align-items: end;
  min-width: 0;
  min-height: 244px;
  padding: 30px;
  overflow: hidden;
  color: #f7f1e6;
  background-color: #05152b;
  background-image:
    linear-gradient(
      90deg,
      rgba(5, 21, 43, 0.99) 0%,
      rgba(5, 21, 43, 0.93) 48%,
      rgba(5, 21, 43, 0.38) 100%
    ),
    url("../../../../assets/images/admin/supplier-pricing-matrix.webp");
  background-position: center right;
  background-size: cover;
  border: 1px solid rgba(232, 194, 122, 0.26);
  border-radius: 22px;
  box-shadow: 0 24px 54px rgba(5, 21, 43, 0.16);
  animation: pricing-reveal 0.42s ease-out both;
}
.pricing-command::after {
  position: absolute;
  z-index: -1;
  inset: auto -8% -58% 42%;
  height: 190px;
  content: "";
  background: radial-gradient(
    circle,
    rgba(232, 194, 122, 0.18),
    transparent 68%
  );
  pointer-events: none;
}
.pricing-command__copy {
  min-width: 0;
}
.pricing-command__copy > span,
.pricing-editor-hero > div > span {
  color: #e8c27a;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.19em;
  text-transform: uppercase;
}
.pricing-command h1,
.pricing-editor-hero h1 {
  max-width: 720px;
  margin: 9px 0 8px;
  color: #fffdf8;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(34px, 4vw, 50px);
  font-weight: 520;
  letter-spacing: -0.035em;
  line-height: 1.04;
  overflow-wrap: anywhere;
}
.pricing-command__copy > p {
  max-width: 680px;
  margin: 0;
  color: rgba(247, 241, 230, 0.72);
  font-size: 13px;
  line-height: 1.65;
}
.pricing-command__supplier {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-top: 20px;
}
.pricing-command__avatar {
  display: grid;
  flex: 0 0 40px;
  place-items: center;
  width: 40px;
  height: 40px;
  color: #05152b;
  background: linear-gradient(145deg, #f5dba9, #c89447);
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.32);
  font-size: 11px;
  font-weight: 800;
}
.pricing-command__supplier > span:nth-child(2) {
  display: grid;
  min-width: 0;
}
.pricing-command__supplier small {
  color: rgba(247, 241, 230, 0.55);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pricing-command__supplier strong {
  margin-top: 2px;
  overflow: hidden;
  color: #fffdf8;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pricing-command__supplier :deep(.el-tag) {
  margin-left: 4px;
  border-color: rgba(255, 255, 255, 0.22);
}
.pricing-command__categories {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 13px;
}
.pricing-command__categories small {
  color: rgba(247, 241, 230, 0.55);
  font-size: 10px;
}
.pricing-command__categories em {
  max-width: 210px;
  padding: 4px 9px;
  overflow: hidden;
  color: #f7f1e6;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pricing-command__categories button {
  padding: 3px 0;
  color: #e8c27a;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.pricing-command__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(104px, 1fr));
  gap: 9px;
  min-width: 0;
}
.pricing-command__metrics article {
  min-width: 0;
  min-height: 112px;
  padding: 14px;
  background: rgba(8, 28, 51, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}
.pricing-command__metrics article.is-pending {
  border-color: rgba(232, 194, 122, 0.5);
  box-shadow: inset 0 2px 0 rgba(232, 194, 122, 0.42);
}
.pricing-command__metrics small,
.pricing-command__metrics span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pricing-command__metrics small {
  color: rgba(247, 241, 230, 0.58);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
}
.pricing-command__metrics strong {
  display: block;
  margin: 10px 0 5px;
  color: #fffdf8;
  font-family: var(--hx-font-numeric);
  font-size: 30px;
  font-weight: 650;
  line-height: 1;
  letter-spacing: normal;
  font-variant-numeric: lining-nums tabular-nums;
}
.pricing-command__metrics span {
  color: rgba(247, 241, 230, 0.62);
  font-size: 9px;
  line-height: 1.35;
}
.sv-board {
  box-shadow: 0 14px 38px rgba(5, 21, 43, 0.07);
}
.pricing-toolbar {
  align-items: center;
  gap: 16px;
  padding: 15px 18px;
}
.pricing-filter {
  display: grid;
  grid-template-columns: minmax(145px, auto) 170px minmax(220px, 300px) auto;
  flex: 1;
  gap: 10px;
  min-width: 0;
}
.pricing-filter__title {
  display: grid;
  align-content: center;
  min-width: 0;
}
.pricing-filter__title strong {
  color: #05152b;
  font-size: 12px;
}
.pricing-filter__title small {
  margin-top: 2px;
  color: #8a7d70;
  font-size: 9px;
  font-weight: 500;
  line-height: 1.3;
}
.pricing-filter .el-select,
.pricing-filter .el-input {
  width: 100%;
  min-width: 0;
}
.pricing-actions {
  align-items: center;
  flex: 0 0 auto;
  padding: 0;
}
.pricing-actions > small {
  color: #8a7d70;
  font-size: 10px;
  white-space: nowrap;
}
.pricing-service-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.pricing-service-cell > span {
  display: grid;
  flex: 0 0 36px;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #8d5a32;
  background: linear-gradient(145deg, #f8efe1, #efe0ca);
  border-radius: 11px;
  font-size: 11px;
  font-weight: 800;
}
.pricing-service-cell > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}
.pricing-service-cell strong {
  overflow: hidden;
  color: #05152b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pricing-service-cell small {
  overflow: hidden;
  color: #8a7d70;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quote-reject-reason,
.line-reject {
  color: #b42318;
  font-size: 12px;
  font-style: normal;
  line-height: 1.45;
  white-space: normal;
}
.quote-mode-pill {
  display: inline-flex;
  padding: 5px 8px;
  color: #5d4930;
  background: #f5ecdf;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
.pricing-price {
  color: #23354b;
  font-size: 12px;
  font-weight: 750;
}
.pricing-data-table :deep(.el-table__row) {
  cursor: pointer;
}
.pricing-mobile-list {
  display: none;
}

.pricing-editor-hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  min-width: 0;
  min-height: 176px;
  padding: 28px 30px;
  overflow: hidden;
  color: #f7f1e6;
  background-color: #05152b;
  background-image:
    linear-gradient(
      90deg,
      rgba(5, 21, 43, 0.99) 0%,
      rgba(5, 21, 43, 0.9) 50%,
      rgba(5, 21, 43, 0.36) 100%
    ),
    url("../../../../assets/images/admin/supplier-pricing-matrix.webp");
  background-position: center right;
  background-size: cover;
  border: 1px solid rgba(232, 194, 122, 0.26);
  border-radius: 20px;
  box-shadow: 0 20px 48px rgba(5, 21, 43, 0.14);
  animation: pricing-reveal 0.38s ease-out both;
}
.pricing-editor-hero > div {
  min-width: 0;
}
.pricing-editor-hero h1 {
  max-width: 820px;
  margin-top: 8px;
  font-size: clamp(30px, 3.6vw, 45px);
}
.pricing-editor-hero p {
  margin: 0;
  color: rgba(247, 241, 230, 0.68);
  font-size: 12px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.pricing-editor-hero :deep(.el-tag) {
  flex: 0 0 auto;
  border-color: rgba(255, 255, 255, 0.2);
}
.sv-quote {
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 0;
}
.pricing-editor-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 14px 16px;
  color: #725122;
  background: #fff7e8;
  border: 1px solid #efd8ad;
  border-radius: 14px;
}
.pricing-editor-alert > span,
.pricing-editor-alert > svg {
  display: grid;
  flex: 0 0 30px;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #9b6124;
  background: #ffe6bd;
  border-radius: 9px;
  font-weight: 800;
}
.pricing-editor-alert > svg {
  padding: 6px;
}
.pricing-editor-alert div {
  min-width: 0;
}
.pricing-editor-alert strong {
  font-size: 12px;
}
.pricing-editor-alert p {
  margin: 3px 0 0;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.pricing-editor-alert.is-rejected {
  color: #8e3944;
  background: #fff0f1;
  border-color: #efcbd0;
}
.pricing-editor-alert.is-rejected > span {
  color: #9f3f4b;
  background: #f9dfe3;
}
.pricing-editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 286px;
  gap: 16px;
  align-items: start;
  min-width: 0;
}
.pricing-editor-main {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.pricing-editor-section {
  min-width: 0;
  padding: 20px;
  background: #fffdf8;
  border: 1px solid #e4d8c6;
  border-radius: 18px;
  box-shadow: 0 12px 34px rgba(5, 21, 43, 0.05);
}
.pricing-section-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  margin-bottom: 16px;
}
.pricing-section-head > div {
  min-width: 0;
}
.pricing-section-head h2 {
  margin: 0;
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 22px;
  font-weight: 520;
  letter-spacing: -0.02em;
}
.pricing-section-head p {
  margin: 4px 0 0;
  color: #7a7166;
  font-size: 11px;
  line-height: 1.5;
}
.pricing-section-head p.spec-step-hint {
  margin-top: 8px;
  color: #9a3d08;
  font-size: 22px;
  font-weight: 750;
  line-height: 1.35;
  letter-spacing: -0.02em;
}
.pricing-section-head > em {
  align-self: center;
  min-width: 30px;
  padding: 5px 8px;
  color: #6e5c45;
  background: #f4eee5;
  border-radius: 999px;
  font-size: 10px;
  font-style: normal;
  font-weight: 800;
  text-align: center;
}
.pricing-editor-section .mode-cards,
.pricing-editor-section .quote-lines,
.pricing-editor-section .quote-attaches {
  padding-right: 0;
  padding-left: 0;
}
.pricing-editor-section .mode-cards {
  margin: 0;
}
.mode-cards button {
  position: relative;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 4px;
  min-width: 0;
  min-height: 104px;
  padding: 16px;
  font: inherit;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}
.mode-cards button:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #c8a66d;
  box-shadow: 0 10px 24px rgba(5, 21, 43, 0.08);
}
.mode-cards button:focus-visible {
  outline: 3px solid rgba(200, 148, 71, 0.26);
  outline-offset: 2px;
}
.mode-cards button:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}
.mode-cards button.is-on {
  background: linear-gradient(145deg, #071a31, #0e2b46);
  border-color: #163c5a;
  box-shadow: 0 14px 28px rgba(5, 21, 43, 0.14);
}
.mode-cards button strong,
.mode-cards button small {
  min-width: 0;
  overflow-wrap: anywhere;
}
.rate-card {
  margin-top: 14px;
  padding: 14px;
  background: #f7f3ec;
  border: 1px solid #eadfce;
  border-radius: 14px;
}
.rate-field {
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
  max-width: 100%;
  margin: 0;
  padding: 0;
}
.rate-field > span:first-child {
  color: #5c564c;
  font-size: 11px;
  font-weight: 750;
}
.rate-card > .quantity-sku-notes,
.quote-review-dialog__facts > .quantity-sku-notes,
.portal-review-facts > .quantity-sku-notes,
.rate-card > .option-prices {
  grid-column: 1 / -1;
}
.option-prices {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  padding: 14px;
  background: #fff;
  border: 1px solid #eadfce;
  border-radius: 12px;
}
.option-prices__head strong {
  color: #1b2839;
  font-size: 15px;
  font-weight: 750;
}
.option-prices__head p {
  margin: 4px 0 0;
  color: #7a7166;
  font-size: 12px;
  line-height: 1.5;
}
.option-prices__stats,
.option-prices__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.option-prices__stats span {
  border: 1px solid #e4d8c6;
  border-radius: 999px;
  background: #faf7f2;
  color: #5c564c;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1.4;
}
.option-prices__filters input,
.option-prices__filters select {
  min-width: 0;
  height: 36px;
  border: 1px solid #e4d8c6;
  border-radius: 10px;
  background: #fff;
  color: #1b2839;
  font: inherit;
  font-size: 13px;
}
.option-prices__filters input {
  flex: 1 1 220px;
  padding: 0 12px;
}
.option-prices__filters select {
  flex: 0 1 180px;
  padding: 0 10px;
}
.option-prices__table-wrap {
  overflow: visible;
  border: 1px solid #f0e8dc;
  border-radius: 10px;
}
.option-prices table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.option-prices th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 10px;
  background: #faf7f2;
  color: #8a7b68;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
}
.option-prices td {
  padding: 10px;
  border-top: 1px solid #f3eee6;
  vertical-align: top;
}
.option-prices tr.is-group td {
  background: #fbf6ee;
  color: #6e5c45;
}
.option-prices tr.is-group b {
  margin-right: 8px;
  color: #1b2839;
}
.option-prices tr.is-group em {
  color: #8a7b68;
  font-style: normal;
}
.option-prices .is-option b,
.option-prices .is-option small,
.option-prices .is-option span {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}
.option-prices .is-option b {
  color: #1b2839;
  font-size: 13px;
}
.option-prices .is-option small,
.option-prices .is-option span {
  margin-top: 2px;
  color: #8a7b68;
  font-size: 11px;
}
.option-prices .is-note span {
  display: inline-flex;
  margin: 0 4px 4px 0;
  padding: 2px 7px;
  border-radius: 999px;
  background: #eef3f8;
  color: #3d5f86;
  font-size: 11px;
  font-style: normal;
}
.option-prices .is-calc,
.option-prices .is-money,
.option-prices .is-price {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.option-prices .is-calc,
.option-prices .is-money {
  color: #6e5c45;
}
.option-prices .is-price {
  color: #1b2839;
  font-weight: 750;
}
.option-prices .is-empty {
  color: #8a7b68;
  text-align: center;
}
.quantity-sku-notes {
  display: grid;
  gap: 6px;
  min-width: 0;
  margin: 2px 0 0;
  color: #5c564c;
  font-size: 12px;
  line-height: 1.55;
}
.quantity-sku-notes p,
.quantity-sku-notes dt {
  margin: 0;
  color: #8a7b68;
  font-size: 11px;
  font-weight: 750;
}
.quantity-sku-notes ul,
.quantity-sku-notes dd {
  display: grid;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 0;
}
.quantity-sku-notes li,
.quantity-sku-notes dd span {
  position: relative;
  min-width: 0;
  margin: 0;
  padding-left: 12px;
  overflow-wrap: anywhere;
}
.quantity-sku-notes li::before,
.quantity-sku-notes dd span::before {
  content: "";
  position: absolute;
  top: 0.55em;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c4b49a;
}
.currency-input {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: stretch;
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dfd4c4;
  border-radius: 10px;
}
.currency-input > b {
  display: flex;
  align-items: center;
  padding: 0 11px;
  color: #6f5b40;
  background: #f3eadc;
  border-right: 1px solid #dfd4c4;
  font-size: 10px;
  letter-spacing: 0.04em;
}
.currency-input :deep(.el-input-number) {
  width: 100%;
}
.currency-input :deep(.el-input__wrapper) {
  box-shadow: none;
}
.pricing-editor-section .quote-lines {
  gap: 10px;
  max-height: none;
  overflow: visible;
}
.quote-line.is-hourly {
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
}
.quote-group {
  display: grid;
  gap: 8px;
}
.quote-group + .quote-group {
  margin-top: 8px;
}
.quote-group__head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 6px 2px 0;
}
.quote-group__head small {
  color: #7a7166;
  font-size: 12px;
  font-weight: 700;
}
.quote-group__head strong {
  color: #05152b;
  font-size: 15px;
}
.quote-line-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
}
.quote-line-bulk {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
.quote-line-bulk button {
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid #eadfce;
  border-radius: 999px;
  background: #fff;
  color: #05152b;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}
.quote-line-bulk button:disabled {
  color: #a3988c;
  cursor: not-allowed;
}
.quote-line-bulk button:focus-visible {
  outline: 3px solid rgba(200, 148, 71, 0.26);
  outline-offset: 2px;
}
.quote-line__switch :deep(.el-checkbox) {
  height: auto;
  margin: 0;
  cursor: pointer;
}
.quote-line__switch :deep(.el-checkbox__input) {
  cursor: pointer;
}
.quote-line__switch :deep(.el-checkbox__inner) {
  width: 18px;
  height: 18px;
  border: 1.5px solid #1d344b;
  border-radius: 5px;
  background: #fff;
}
.quote-line__switch :deep(.el-checkbox__inner::after) {
  top: 2px;
  left: 6px;
  width: 4px;
  height: 8px;
  border-width: 2px;
}
.quote-line__switch :deep(.el-checkbox__input:not(.is-disabled):hover .el-checkbox__inner) {
  border-color: #0b2340;
  background: #eef3f8;
}
.quote-line__switch :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
.quote-line__switch :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background: #05152b;
  border-color: #05152b;
}
.quote-line__switch :deep(.el-checkbox__input.is-disabled) {
  cursor: not-allowed;
}
.quote-line__switch :deep(.el-checkbox__input.is-disabled .el-checkbox__inner) {
  border-color: #d5dbe3;
  background: #f4f6f8;
}
.quote-group-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.quote-group-tabs__type {
  margin-right: 4px;
  color: #7a7166;
  font-size: 12px;
  font-weight: 700;
}
.quote-group-tabs button {
  min-height: 34px;
  padding: 6px 14px;
  border: 1px solid #eadfce;
  border-radius: 999px;
  background: #fff;
  color: #05152b;
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}
.quote-group-tabs button.is-on {
  color: #f7f1e6;
  background: #05152b;
  border-color: #05152b;
}
.quote-group-tabs button:focus-visible {
  outline: 3px solid rgba(200, 148, 71, 0.26);
  outline-offset: 2px;
}
.quote-line {
  grid-template-columns:
    auto minmax(160px, 1.2fr) minmax(104px, 0.62fr) minmax(104px, 0.62fr)
    minmax(140px, 0.85fr) auto;
  gap: 12px;
  align-items: start;
  padding: 14px;
  background: #fcfaf6;
  border-color: #e9decd;
  border-radius: 14px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.quote-line:hover {
  border-color: #d7c4a8;
  box-shadow: 0 8px 20px rgba(5, 21, 43, 0.045);
}
.quote-line__spec {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  min-width: 0;
  padding: 3px 0 0;
}
.quote-line__spec > span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #8d5a32;
  background: #f4eadb;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 800;
}
.quote-line__spec > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}
.quote-line__spec small.quote-fulfill-remark,
.quote-review-dialog__groups .quote-fulfill-remark,
.portal-review-options .quote-fulfill-remark {
  display: block;
  margin: 0;
  color: #243044;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.45;
  white-space: normal;
}
.quote-line__spec strong,
.quote-attach__name :deep(.el-checkbox__label) {
  overflow-wrap: anywhere;
}
.quote-line label > span:first-child {
  min-height: 16px;
  color: #74685a;
  font-size: 10px;
  font-weight: 750;
}
.quote-line :deep(.el-input-number),
.quote-line :deep(.el-input) {
  min-width: 0;
}
.quote-line :deep(.el-input-group__prepend),
.quote-attach :deep(.el-input-group__prepend) {
  padding: 0 9px;
  color: #705a3f;
  background: #f4ecdf;
  font-size: 9px;
  font-weight: 800;
}
.quote-line label.quote-line__price {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
}
.quote-line label.quote-line__price > span:first-child {
  flex: 1 0 100%;
}
.quote-line label.quote-line__price :deep(.el-input) {
  width: auto;
  flex: 1 1 140px;
  min-width: 0;
}
.quote-line__covers { display: block; margin-top: 4px; color: #718094; font-size: 12px; line-height: 1.5; }
.quote-line__unit {
  flex: none;
  color: #243044;
  font-size: 13px;
  font-style: normal;
  font-weight: 650;
  white-space: nowrap;
}
.auto-price {
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-width: 0;
  min-height: 32px;
  padding: 7px 10px;
  color: #205f50;
  background: #eaf6f1;
  border: 1px solid #cae8dc;
  border-radius: 8px;
}
.auto-price small {
  color: #42806f;
  font-size: 9px;
  font-weight: 800;
}
.auto-price strong {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field-help {
  color: #8a7d70;
  font-size: 9px;
  line-height: 1.35;
}
.pricing-editor-section .quote-attaches {
  gap: 9px;
  margin-top: 0;
}
.quote-attach {
  grid-template-columns: minmax(0, 1fr) minmax(180px, 240px);
  padding: 13px 14px;
  background: #fcfaf6;
  border-color: #eadfce;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}
.quote-attach.is-selected {
  background: #f9f5ed;
  border-color: #cfb384;
  box-shadow: inset 3px 0 0 #c89447;
}
.quote-attach__name {
  overflow: hidden;
}
.quote-attach__name :deep(.el-checkbox) {
  height: auto;
  min-width: 0;
  margin-right: 0;
  white-space: normal;
}
.quote-attach__name :deep(.el-checkbox__label) {
  min-width: 0;
  line-height: 1.4;
  white-space: normal;
}
.pricing-review-panel {
  position: sticky;
  top: 16px;
  display: grid;
  min-width: 0;
  padding: 19px;
  color: #f7f1e6;
  background: linear-gradient(155deg, #071a31, #0c2944);
  border: 1px solid rgba(232, 194, 122, 0.25);
  border-radius: 18px;
  box-shadow: 0 18px 42px rgba(5, 21, 43, 0.16);
}
.pricing-review-panel > span {
  color: #e8c27a;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.sv-quote .pricing-review-panel h3 {
  margin: 8px 0 15px;
  padding: 0;
  color: #fffdf8;
  font-family: Fraunces, Georgia, serif;
  font-size: 22px;
  font-weight: 520;
  line-height: 1.2;
}
.pricing-review-panel dl {
  display: grid;
  gap: 0;
  margin: 0;
}
.pricing-review-panel dl > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 11px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.pricing-review-panel dt {
  color: rgba(247, 241, 230, 0.55);
  font-size: 10px;
}
.pricing-review-panel dd {
  min-width: 0;
  margin: 0;
  color: #fffdf8;
  font-size: 11px;
  font-weight: 750;
  text-align: right;
  overflow-wrap: anywhere;
}
.pricing-review-panel button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 3px 10px;
  align-items: center;
  margin-top: 14px;
  padding: 13px;
  color: #05152b;
  text-align: left;
  background: linear-gradient(145deg, #f6ddb0, #d9ab65);
  border: 0;
  border-radius: 12px;
  cursor: pointer;
}
.pricing-review-panel button span,
.pricing-review-panel button small {
  min-width: 0;
  overflow-wrap: anywhere;
}
.pricing-review-panel button span {
  font-size: 11px;
  font-weight: 800;
}
.pricing-review-panel button small {
  color: #745a35;
  font-size: 9px;
  line-height: 1.4;
}
.pricing-review-panel button b {
  grid-column: 2;
  grid-row: 1 / 3;
  font-size: 17px;
}
.sv-quote__foot {
  position: sticky;
  z-index: 5;
  bottom: 0;
  min-width: 0;
  margin-top: 14px;
  padding: 13px 16px;
  background: rgba(255, 253, 248, 0.94);
  border: 1px solid #e1d3bf;
  border-radius: 15px;
  box-shadow: 0 -12px 32px rgba(5, 21, 43, 0.09);
  backdrop-filter: blur(14px);
}
.sv-quote__foot > .sv-quote__foot-note {
  display: grid;
  min-width: 0;
}
.sv-quote__foot-note span {
  color: #05152b;
  font-size: 11px;
  font-weight: 800;
}
.sv-quote__gap {
  border: 0;
  padding: 0;
  background: transparent;
  color: #9a6230;
  font: inherit;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
}
.sv-quote__gap:focus-visible {
  outline: 3px solid rgba(200, 148, 71, 0.26);
  outline-offset: 2px;
}
.quote-group-tabs button.is-gap:not(.is-on) {
  border-color: #e2c08a;
}
.sv-quote__foot-note small {
  margin-top: 2px;
  color: #8a7d70;
  font-size: 9px;
  overflow-wrap: anywhere;
}
.service-editor-intro {
  display: grid;
  gap: 4px;
  min-width: 0;
  margin-bottom: 18px;
  padding: 17px 18px;
  color: #f7f1e6;
  background-color: #05152b;
  background-image:
    linear-gradient(90deg, rgba(5, 21, 43, 0.98), rgba(5, 21, 43, 0.68)),
    url("../../../../assets/images/admin/supplier-pricing-matrix.webp");
  background-position: right center;
  background-size: cover;
  border-radius: 14px;
}
.service-editor-intro span {
  color: #e8c27a;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.service-editor-intro strong {
  color: #fffdf8;
  font-family: Fraunces, Georgia, serif;
  font-size: 23px;
  font-weight: 520;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.service-editor-intro p {
  margin: 2px 0 0;
  color: rgba(247, 241, 230, 0.65);
  font-size: 10px;
  line-height: 1.5;
}
.picker-fields .phone-row {
  align-items: center;
  min-width: 0;
}
.picker-fields .phone-row > small {
  flex: 0 0 26px;
  color: #8a7d70;
  font-size: 9px;
  font-weight: 700;
}
.phone-row .el-input {
  min-width: 0;
}
@keyframes pricing-reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pricing-command,
  .pricing-editor-hero {
    animation: none;
  }
  .mode-cards button,
  .quote-line {
    transition: none;
  }
}
@media (max-width: 1180px) {
  .pricing-command {
    grid-template-columns: minmax(0, 1fr);
  }
  .pricing-command__metrics {
    max-width: 560px;
  }
  .pricing-filter {
    grid-template-columns: minmax(145px, auto) minmax(150px, 0.7fr) minmax(
        190px,
        1fr
      );
  }
  .pricing-filter > .el-button {
    grid-column: 2 / -1;
    justify-self: start;
  }
  .quote-line {
    grid-template-columns: minmax(0, 1fr) minmax(140px, 0.55fr);
  }
  .quote-line__spec,
  .quote-line__price {
    grid-column: auto;
  }
}
@media (max-width: 920px) {
  .pricing-editor-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .pricing-review-panel {
    position: static;
    grid-row: 1;
  }
  .pricing-review-panel dl {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .pricing-review-panel dl > div {
    align-items: flex-start;
    flex-direction: column;
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .pricing-review-panel dd {
    text-align: left;
  }
  .pricing-review-panel button {
    max-width: 360px;
  }
}
@media (max-width: 760px) {
  .pricing-command {
    min-height: 0;
    padding: 22px;
    background-position: 66% center;
  }
  .pricing-command__metrics {
    grid-template-columns: repeat(3, minmax(100px, 1fr));
    max-width: none;
    overflow-x: auto;
  }
  .pricing-command__metrics article {
    min-height: 102px;
    padding: 13px;
  }
  .pricing-toolbar {
    align-items: stretch;
  }
  .pricing-filter {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }
  .pricing-filter > .el-button {
    grid-column: auto;
    justify-self: start;
  }
  .pricing-actions {
    justify-content: space-between;
    width: 100%;
    padding: 0;
  }
  .pricing-data-table {
    display: none;
  }
  .pricing-mobile-list {
    display: grid;
    gap: 10px;
    padding: 12px;
    background: #f7f3ec;
  }
  .pricing-mobile-list > article {
    min-width: 0;
    padding: 15px;
    background: #fffdf8;
    border: 1px solid #e6dccb;
    border-radius: 15px;
    box-shadow: 0 8px 20px rgba(5, 21, 43, 0.04);
  }
  .pricing-mobile-list > article > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .pricing-mobile-list > article > header :deep(.el-tag) {
    flex: 0 0 auto;
  }
  .pricing-mobile-list dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 14px 0 0;
    padding-top: 12px;
    border-top: 1px solid #efe4d4;
  }
  .pricing-mobile-list dt {
    color: #8a7d70;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .pricing-mobile-list dd {
    margin: 4px 0 0;
    color: #05152b;
    font-size: 11px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .pricing-mobile-list footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 14px;
  }
  .pricing-mobile-list footer > span {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #74685a;
    font-size: 10px;
  }
  .pricing-mobile-list footer > div {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .pricing-mobile-empty {
    margin: 24px 12px;
    color: #8a7d70;
    font-size: 12px;
    text-align: center;
  }
  .pricing-editor-hero {
    min-height: 150px;
    padding: 22px;
  }
  .pricing-editor-hero {
    align-items: flex-start;
    flex-direction: column;
  }
  .pricing-editor-hero h1 {
    font-size: 32px;
  }
  .pricing-editor-section {
    padding: 16px;
  }
  .quote-line {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .quote-line__switch,
  .quote-line__spec,
  .quote-line__price {
    grid-column: 1 / -1;
  }
  .quote-line label.quote-line__switch {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .pricing-review-panel dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sv-quote__foot {
    align-items: stretch;
    flex-direction: column;
  }
  .sv-quote__foot > div:last-child {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sv-quote__foot :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
@media (max-width: 520px) {
  .profile-status {
    padding: 13px 14px;
  }
  .profile-status__heading strong,
  .profile-status.is-review .profile-status__heading strong {
    font-size: 17px;
  }
  .pricing-command {
    padding: 19px;
    border-radius: 18px;
  }
  .pricing-command h1 {
    font-size: 32px;
  }
  .pricing-command__supplier {
    flex-wrap: wrap;
  }
  .pricing-command__metrics {
    grid-template-columns: repeat(3, 104px);
    margin-right: -19px;
    padding-right: 19px;
  }
  .pricing-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .pricing-actions :deep(.el-button) {
    width: 100%;
  }
  .pricing-editor-hero {
    padding: 19px;
    border-radius: 17px;
  }
  .pricing-editor-hero h1 {
    font-size: 29px;
  }
  .pricing-section-head {
    gap: 9px;
  }
  .pricing-section-head h2 {
    font-size: 20px;
  }
  .pricing-section-head p.spec-step-hint {
    font-size: 18px;
  }
  .mode-cards {
    grid-template-columns: minmax(0, 1fr);
  }
  .quote-line {
    grid-template-columns: minmax(0, 1fr);
  }
  .quote-line__spec,
  .quote-line__price {
    grid-column: auto;
  }
  .quote-attach {
    grid-template-columns: minmax(0, 1fr);
  }
  .pricing-review-panel dl {
    grid-template-columns: minmax(0, 1fr);
  }
  .pricing-review-panel button {
    max-width: none;
  }
  .sv-quote__foot > div:last-child {
    grid-template-columns: minmax(0, 1fr);
  }
  .picker-fields {
    grid-template-columns: minmax(0, 1fr);
  }
  .picker-fields .phone-row {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .picker-fields .phone-row > small {
    flex: 1 0 100%;
  }
  .picker-fields .phone-row .el-input {
    flex: 1 1 180px;
  }
}
</style>

<style>
.policy-preview.el-dialog {
  overflow: hidden;
}
.policy-preview .el-dialog__body {
  padding: 0 0 18px;
}
.order-drawer.el-drawer {
  width: min(760px, 100vw) !important;
  max-width: 100vw;
  background: #f7f3ec;
}
.order-drawer .el-drawer__header {
  flex: 0 0 auto;
  margin-bottom: 0;
  padding: 18px 24px;
  background: #fffdf8;
  border-bottom: 1px solid #e7dac7;
}
.order-drawer .el-drawer__title {
  min-width: 0;
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 24px;
  font-weight: 520;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}
.order-drawer .el-drawer__close-btn {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  margin: -5px -7px -5px 12px;
  border-radius: 10px;
}
.order-drawer .el-drawer__close-btn:hover {
  color: #05152b;
  background: #f3eadc;
}
.order-drawer .el-drawer__body {
  min-height: 0;
  padding: 16px 18px 20px;
  overflow: auto;
}
.order-drawer .el-drawer__footer {
  flex: 0 0 auto;
  padding: 14px 18px;
  background: rgba(255, 253, 248, 0.96);
  border-top: 1px solid #e4d6c2;
  box-shadow: 0 -10px 28px rgba(5, 21, 43, 0.06);
  backdrop-filter: blur(12px);
}
.supplier-form-dialog.el-dialog {
  --el-color-primary: #8d5a32;
  --el-color-primary-light-3: #aa7b55;
  --el-color-primary-light-5: #c6a68a;
  --el-color-primary-light-7: #dfcfc0;
  --el-color-primary-light-8: #eadfd6;
  --el-color-primary-light-9: #f5efea;
  --el-color-primary-dark-2: #714827;
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  margin-top: 16px !important;
  margin-bottom: 16px;
  overflow: hidden;
  border-radius: 18px;
  background: #fffdf8;
  box-shadow: 0 28px 80px rgba(5, 21, 43, 0.24);
}
.supplier-form-dialog .el-dialog__header {
  flex: 0 0 auto;
  margin-right: 0;
  padding: 20px 64px 16px 22px;
  border-bottom: 1px solid #eadfce;
}
.supplier-form-dialog .el-dialog__title {
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 24px;
  font-weight: 520;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.supplier-form-dialog .el-dialog__headerbtn {
  top: 12px;
  right: 14px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}
.supplier-form-dialog .el-dialog__headerbtn:hover {
  background: #f3eadc;
}
.supplier-form-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px 22px;
  overflow: auto;
}
.supplier-form-dialog .el-dialog__footer {
  flex: 0 0 auto;
  padding: 14px 22px 16px;
  background: #fffdf8;
  border-top: 1px solid #eadfce;
}
.quote-review-dialog .el-dialog__title {
  font-size: 22px;
}
.quote-review-dialog .el-dialog__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}
.quote-review-dialog__confirmation.el-checkbox {
  display: flex;
  width: 100%;
  height: auto;
  margin: 0;
  padding: 14px 16px;
  align-items: flex-start;
  box-sizing: border-box;
  border: 2px solid #c79443;
  border-radius: 10px;
  background: #fff5df;
  color: #75501e;
  text-align: left;
  white-space: normal;
  transition: border-color 160ms ease, background-color 160ms ease;
}
.quote-review-dialog__confirmation.el-checkbox:hover {
  border-color: #a87526;
  background: #fff0cf;
}
.quote-review-dialog__confirmation:focus-within {
  outline: 3px solid rgba(167, 117, 38, 0.25);
  outline-offset: 3px;
}
.quote-review-dialog__confirmation .el-checkbox__input {
  flex: none;
  margin-top: 1px;
}
.quote-review-dialog__confirmation .el-checkbox__inner {
  width: 24px;
  height: 24px;
  border: 2px solid #a87526;
  border-radius: 6px;
  background: #fff;
}
.quote-review-dialog__confirmation .el-checkbox__inner::after {
  top: 2px;
  left: 7px;
  width: 6px;
  height: 12px;
  border-width: 2px;
}
.quote-review-dialog__confirmation .el-checkbox__label {
  flex: 1;
  min-width: 0;
  padding-left: 12px;
  color: inherit;
  white-space: normal;
}
.quote-review-dialog__confirmation-copy {
  display: block;
}
.quote-review-dialog__confirmation-copy strong {
  display: block;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.5;
}
.quote-review-dialog__confirmation-copy > span {
  display: block;
  margin-top: 4px;
  color: #503e25;
  font-size: 14px;
  line-height: 1.65;
}
.quote-review-dialog__confirmation.is-confirmed,
.quote-review-dialog__confirmation.is-confirmed:hover {
  border-color: #3c9971;
  background: #eef8f2;
  color: #1c5f43;
}
.quote-review-dialog__confirmation .el-checkbox__input.is-checked .el-checkbox__inner {
  border-color: #20734e;
  background: #20734e;
}
.quote-review-dialog__confirmation .el-checkbox__input.is-checked + .el-checkbox__label {
  color: inherit;
}
.quote-review-dialog__confirmation.is-confirmed:focus-within {
  outline-color: rgba(32, 115, 78, 0.25);
}
.quote-review-dialog__confirmation.is-confirmed .quote-review-dialog__confirmation-copy > span {
  color: #315747;
}
.quote-review-dialog__hint,
.quote-review-dialog__note {
  margin: 0;
  color: #7a7166;
  font-size: 13px;
  line-height: 1.6;
}
.quote-review-dialog__hint {
  margin-bottom: 14px;
}
.quote-review-dialog__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 0 0 16px;
}
.quote-review-dialog__facts dt,
.quote-review-dialog__groups h3 small {
  color: #8a7d70;
  font-size: 11px;
  font-weight: 500;
}
.quote-review-dialog__facts dd {
  margin: 2px 0 0;
  color: #102338;
  font-weight: 650;
}
.quote-review-dialog__groups,
.quote-review-dialog__addons {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}
.quote-review-dialog__groups section,
.quote-review-dialog__addons {
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #eadfce;
  border-radius: 12px;
}
.quote-review-dialog__groups h3,
.quote-review-dialog__addons h3 {
  margin: 0 0 8px;
  color: #102338;
  font-size: 14px;
}
.quote-review-dialog__groups h3 small {
  display: block;
  margin-bottom: 2px;
}
.quote-review-dialog__groups section > div,
.quote-review-dialog__addons .quote-review-addon {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-top: 1px solid #f3eadf;
  color: #102338;
  font-size: 13px;
}
.quote-review-dialog__groups section > div strong,
.quote-review-dialog__addons .quote-review-addon strong {
  margin-left: auto;
  white-space: nowrap;
}
.quote-review-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@media (max-width: 600px) {
  .order-drawer .el-drawer__header {
    padding: 15px 16px;
  }
  .order-drawer .el-drawer__body {
    padding: 12px;
  }
  .order-drawer .el-drawer__footer {
    padding: 12px;
  }
  .supplier-form-dialog.el-dialog {
    max-width: calc(100vw - 16px);
    max-height: calc(100dvh - 16px);
    margin-top: 8px !important;
    margin-bottom: 8px;
    border-radius: 14px;
  }
  .supplier-form-dialog .el-dialog__header {
    padding: 17px 58px 14px 17px;
  }
  .supplier-form-dialog .el-dialog__title {
    font-size: 21px;
  }
  .supplier-form-dialog .el-dialog__body {
    padding: 16px 17px;
  }
  .supplier-form-dialog .el-dialog__footer {
    padding: 12px 17px 14px;
  }
  .quote-review-dialog__confirmation.el-checkbox {
    padding: 12px;
  }
  .quote-review-dialog__actions {
    flex-direction: column;
  }
  .quote-review-dialog__actions .el-button {
    min-height: 44px;
    margin-left: 0;
  }
}
</style>

<style scoped>
.portal-orders-review {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
  padding: 16px 18px;
  color: #805a17;
  background: #fff8e8;
  border: 1px solid #efdfb8;
  border-radius: 12px;
}
.portal-orders-review > svg {
  flex: 0 0 20px;
  width: 20px;
  margin-top: 1px;
}
.portal-orders-review strong {
  font-size: 14px;
}
.portal-orders-review p {
  margin: 5px 0 0;
  font-size: 13px;
  line-height: 1.6;
}
.portal-orders-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
  margin-bottom: 20px;
}
.portal-orders-metrics button {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 112px;
  padding: 18px 20px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e7e5df;
  border-radius: 12px;
}
.portal-orders-metrics button.is-selected {
  background: #fffaf3;
  border-color: #c4a36a;
  box-shadow: inset 0 0 0 1px #c4a36a;
}
.portal-orders-metrics button:focus-visible {
  outline: 2px solid #8d5a32;
  outline-offset: 2px;
}
.portal-orders-metrics button::before {
  position: absolute;
  top: 20px;
  right: 18px;
  width: 8px;
  height: 8px;
  content: "";
  background: #c69a42;
  border-radius: 50%;
}
.portal-orders-metric--upcoming::before {
  background: #5c8bc4 !important;
}
.portal-orders-metric--inProgress::before {
  background: #8e75c2 !important;
}
.portal-orders-metric--completed::before {
  background: #439e7b !important;
}
.portal-orders-metrics span {
  display: block;
  padding-right: 14px;
  color: #677487;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}
.portal-orders-metrics strong {
  display: block;
  margin-top: 10px;
  color: #122b45;
  font-size: 30px;
  font-weight: 650;
  line-height: 1.1;
}
.portal-orders-metrics small {
  display: block;
  margin-top: 6px;
  color: #8a94a2;
  font-size: 11px;
}
.portal-orders-card {
  min-width: 0;
  overflow: hidden;
  border-color: #e7e5df;
  border-radius: 14px;
}
.portal-orders-toolbar {
  gap: 16px;
  padding: 20px;
}
.portal-orders-stages {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  padding-bottom: 2px;
}
.portal-orders-stages button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 8px 12px;
  color: #627082;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.portal-orders-stages b {
  min-width: 1.2em;
  padding: 0 6px;
  border-radius: 999px;
  background: #f3efe8;
  color: #8d5a32;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
}
.order-kind {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 4px;
  padding: 0 6px;
  border-radius: 999px;
  background: #eef2f6;
  color: #52627a;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
}
.order-kind.is-package {
  background: #f8efe2;
  color: #8d5a32;
}
.order-package-visit {
  color: #8d5a32;
  font-weight: 650;
}
.order-fulfill-remark {
  color: #243044;
  font-weight: 650;
  white-space: normal;
}
.portal-orders-stages button:hover:not(:disabled),
.portal-orders-stages button.is-active {
  color: #8d5a32;
  background: #f8f1e6;
  border-color: #ead8bc;
}
.portal-orders-stages button:focus-visible {
  outline: 2px solid #8d5a32;
  outline-offset: 2px;
}
.portal-orders-stages button:disabled {
  color: #8b929b;
  cursor: not-allowed;
}
.portal-orders-compatibility {
  margin: -6px 0 0;
  color: #7c8795;
  font-size: 12px;
  line-height: 1.5;
}
.portal-orders-filters {
  gap: 12px;
}
.portal-orders-table-shell {
  width: 100%;
  min-width: 0;
  overflow-x: clip;
}
.portal-orders-table {
  width: 100%;
  min-width: 0;
}
.portal-orders-table :deep(.cell) {
  padding-right: 10px;
  padding-left: 10px;
  overflow-wrap: anywhere;
}
.portal-orders-table :deep(th .cell) {
  color: #738093;
  font-size: 11px;
  font-weight: 600;
  white-space: normal;
  line-height: 1.45;
}
.portal-orders-table :deep(.order-status-col .cell) {
  white-space: normal;
}
.portal-orders-table :deep(.el-tag) {
  height: auto;
  min-height: 24px;
  padding-top: 3px;
  padding-bottom: 3px;
  line-height: 1.35;
  white-space: normal;
  text-align: center;
}
.portal-orders-table .order-no {
  max-width: 100%;
  overflow-wrap: anywhere;
}
.order-staff-name {
  color: #1b2839;
  font-weight: 650;
}
.order-staff-name.is-empty {
  color: #8a7d70;
  font-weight: 500;
}
.portal-orders-table .order-row-actions {
  align-items: flex-end;
  white-space: normal;
}
.portal-orders-table .order-row-actions :deep(.el-button) {
  max-width: 100%;
  height: auto;
  min-height: 26px;
  line-height: 1.45;
  white-space: normal;
  text-align: right;
}
.portal-orders-table .order-row-actions :deep(.el-button > span) {
  white-space: normal;
}
.portal-orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 62px 24px 68px;
  text-align: center;
}
.portal-orders-empty-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  color: #ab8550;
  background: #faf4ea;
  border: 1px solid #eee0ca;
  border-radius: 17px;
}
.portal-orders-empty-icon svg {
  width: 27px;
}
.portal-orders-empty h2 {
  margin: 18px 0 0;
  color: #172e45;
  font-size: 19px;
  font-weight: 650;
}
.portal-orders-empty p {
  max-width: 460px;
  margin: 9px 0 24px;
  color: #7a8798;
  font-size: 13px;
  line-height: 1.7;
}
.portal-orders-empty > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.portal-orders-empty :deep(.el-button + .el-button) {
  margin-left: 0;
}
.portal-orders-pager {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #edf0f2;
}
.portal-orders-pager > span {
  color: #85909f;
  font-size: 11px;
}
@media (max-width: 1280px) {
  .portal-orders-table-shell {
    display: none;
  }
  .portal-orders-mobile {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 16px;
    background: #fafbfc;
  }
  .portal-orders-mobile-card {
    min-width: 0;
    padding: 18px;
    background: #fff;
    border: 1px solid #e7e9ed;
    border-radius: 12px;
  }
  .portal-orders-mobile-card header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .portal-orders-mobile-card .order-no {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .portal-orders-mobile-card :deep(.el-tag) {
    flex: 0 0 auto;
    max-width: 50%;
    height: auto;
    min-height: 24px;
    padding-top: 3px;
    padding-bottom: 3px;
    line-height: 1.35;
    white-space: normal;
    text-align: center;
  }
  .portal-orders-mobile-card h3 {
    margin: 18px 0 6px;
    color: #172e45;
    font-size: 17px;
    font-weight: 650;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .portal-orders-mobile-card > p {
    margin: 0;
    color: #7b8797;
    font-size: 12px;
    line-height: 1.5;
  }
  .portal-orders-mobile-card dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 18px 0 0;
    padding-top: 16px;
    border-top: 1px solid #edf0f3;
  }
  .portal-orders-mobile-card dl .is-wide {
    grid-column: 1 / -1;
  }
  .portal-orders-mobile-card dt {
    color: #85909f;
    font-size: 11px;
  }
  .portal-orders-mobile-card dd {
    margin: 4px 0 0;
    color: #243b51;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .portal-orders-mobile-card footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  .portal-orders-mobile-card footer :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
@media (max-width: 760px) {
  .portal-orders-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .portal-orders-metrics button {
    min-height: 106px;
    padding: 16px;
  }
  .portal-orders-metrics button::before {
    top: 19px;
    right: 14px;
  }
  .portal-orders-toolbar {
    padding: 16px;
  }
  .portal-orders-stages {
    gap: 4px;
  }
  .portal-orders-stages button {
    padding: 8px 10px;
  }
  .portal-orders-mobile {
    grid-template-columns: minmax(0, 1fr);
    padding: 12px;
  }
  .portal-orders-empty {
    padding: 42px 18px 48px;
  }
  .portal-orders-empty > div {
    flex-direction: column;
    width: min(100%, 320px);
  }
  .portal-orders-pager {
    flex-wrap: wrap;
    justify-content: center;
  }
  .portal-orders-pager > span {
    flex-basis: 100%;
    text-align: center;
  }
}
@media (max-width: 820px) {
  .picker-fields,
  .picker-toolbar {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
  .pricing-filter .el-input,
  .pricing-filter .el-select {
    width: 100%;
  }
  .supplier-demo {
    padding: 14px;
  }
  .supplier-demo--profile {
    padding: 0 0 20px;
  }
  .supplier-demo--profile .page-header h1 {
    font-size: 30px;
  }
  .supplier-demo--profile .dossier {
    padding: 0 12px;
  }
  .page-header,
  .supplier-strip,
  .table-toolbar,
  .schedule-toolbar,
  .pricing-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .page-header {
    gap: 12px;
  }
  .page-actions {
    flex-wrap: wrap;
  }
  .supplier-strip {
    gap: 14px;
  }
  .supplier-facts {
    flex-wrap: wrap;
    gap: 12px 20px;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .overview-grid--bottom,
  .pricing-bottom-grid {
    grid-template-columns: 1fr;
  }
  .table-search {
    flex-wrap: wrap;
  }
  .table-search .el-input,
  .table-search .el-select {
    width: 100%;
  }
  .form-grid,
  .form-grid--three {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: span 1;
  }
  .pricing-actions {
    padding-bottom: 13px;
  }
  .section-tabs :deep(.el-tabs__item) {
    padding: 0 10px;
  }
  .compliance-grid,
  .toggle-grid,
  .gender-capacity {
    grid-template-columns: 1fr;
  }
}
</style>

<style scoped src="./portal-optimization.css"></style>

<style>
.shelf-notice-notification.el-notification {
  width: min(380px, calc(100vw - 32px));
  padding: 18px 18px 16px;
  border: 1px solid #eadfcd;
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(16, 35, 56, 0.14);
}
.shelf-notice-notification .el-notification__group {
  margin-left: 0;
  margin-right: 0;
}
.shelf-notice-notification .el-notification__title {
  color: #1c3147;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}
.shelf-notice-notification .el-notification__content {
  margin: 8px 0 0;
  color: #5c5146;
}
.shelf-notice-lead {
  margin: 0;
  color: #5c5146;
  font-size: 13px;
  line-height: 1.6;
}
.shelf-notice-list {
  display: grid;
  gap: 8px;
  max-height: min(280px, 42vh);
  margin: 12px 0 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}
.shelf-notice-list li {
  display: grid;
  gap: 3px;
  padding: 10px 12px;
  background: #fbf8f2;
  border: 1px solid #eadfcd;
  border-radius: 10px;
}
.shelf-notice-list strong {
  color: #1c3147;
  font-size: 14px;
  font-weight: 650;
}
.shelf-notice-list small {
  color: #8a7352;
  font-size: 12px;
  line-height: 1.45;
}
.shelf-notice-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
