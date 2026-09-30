<template>
  <div class="apply">
    <header class="apply-hero">
      <p>HourX</p>
      <h1>{{ copy.title }}</h1>
      <span>{{ copy.lead }}</span>
    </header>

    <div v-if="done" class="apply-sheet apply-done">
      <h2>{{ copy.doneTitle }}</h2>
      <p>{{ copy.doneBody }}</p>
      <div class="apply-done__actions">
        <RouterLink class="ghost" :to="{ name: 'join-us' }">{{ copy.backJoin }}</RouterLink>
      </div>
    </div>

    <form v-else class="apply-sheet" @submit.prevent="submit">
      <p class="apply-legend">{{ copy.requiredHint }}</p>

      <section class="apply-block">
        <h2>{{ copy.stepCompany }}</h2>
        <div class="apply-grid">
          <label class="span-2"><span>{{ copy.companyName }}<i class="req">*</i></span><input v-model="form.companyName" required /></label>
          <label><span>{{ copy.licenseNo }}<i class="req">*</i></span><input v-model="form.tradeLicenseNo" required /></label>
          <label>
            <span>{{ copy.licenseExpiry }}<i class="req">*</i></span>
            <el-config-provider :locale="datePickerLocale">
              <el-date-picker
                v-model="form.licenseExpiry"
                class="apply-date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :editable="false"
                :clearable="false"
                :disabled-date="disableLicenseDate"
                :placeholder="copy.datePlaceholder"
              />
            </el-config-provider>
          </label>
          <label><span>{{ copy.vat }}</span><input v-model="form.vatTrn" /></label>
          <label><span>{{ copy.years }}</span><input :value="wholeText(form.yearsInBusiness)" inputmode="numeric" @input="form.yearsInBusiness = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
          <label class="span-2"><span>{{ copy.address }}<i class="req">*</i></span><input v-model="form.officeAddress" required /></label>
        </div>
      </section>

      <section class="apply-block apply-block--next">
        <h2>{{ copy.stepContact }}</h2>
        <div class="apply-grid">
          <label><span>{{ copy.contact }}<i class="req">*</i></span><input v-model="form.contactPerson" required /></label>
          <label><span>{{ copy.email }}<i class="req">*</i></span><input v-model="form.email" type="email" required /></label>
          <div class="phone-pair span-2">
            <label>
              <span>{{ copy.mobile }}<i class="req">*</i></span>
              <div class="phone-field">
                <select v-model="form.mobileCode" :aria-label="copy.dialCode">
                  <option v-for="item in PHONE_DIAL_OPTIONS" :key="item.value" :value="item.value">{{ phoneDialLabel(item, locale) }}</option>
                </select>
                <input v-model="form.mobile" inputmode="numeric" maxlength="15" placeholder="501234567" required />
              </div>
            </label>
            <label>
              <span>{{ copy.whatsapp }}<i class="req">*</i></span>
              <div class="phone-field">
                <select v-model="form.whatsappCode" :aria-label="copy.dialCode" :disabled="whatsappSame">
                  <option v-for="item in PHONE_DIAL_OPTIONS" :key="`wa-${item.value}`" :value="item.value">{{ phoneDialLabel(item, locale) }}</option>
                </select>
                <input v-model="form.whatsapp" inputmode="numeric" maxlength="15" placeholder="501234567" :disabled="whatsappSame" required />
              </div>
            </label>
            <span class="same-mobile"><input v-model="whatsappSame" type="checkbox" @change="syncWhatsapp" /> {{ copy.sameAsMobile }}</span>
          </div>
        </div>
      </section>

      <section class="apply-block apply-block--next">
        <h2>{{ copy.stepCapacity }}</h2>
        <div class="service-categories">
          <div class="service-categories__head">
            <strong>{{ copy.services }}</strong>
          </div>
          <p v-if="categoriesLoading" class="apply-muted">{{ copy.servicesLoading }}</p>
          <p v-else-if="categoriesError" class="apply-error">{{ categoriesError }}</p>
          <div v-else class="service-categories__options">
            <button
              v-for="option in categories"
              :key="option.categoryId"
              type="button"
              :class="{ 'is-on': selectedIds.includes(option.categoryId) }"
              :aria-pressed="selectedIds.includes(option.categoryId)"
              @click="toggleCategory(option)"
            >
              {{ serviceCategoryLabel(option, locale) }}
            </button>
          </div>
          <label v-if="otherSelected" class="community-note">
            <span>{{ copy.serviceNote }}</span>
            <textarea v-model="expectedServiceRemark" rows="3" maxlength="512" :placeholder="copy.serviceNotePlaceholder" />
          </label>
        </div>
        <div class="apply-grid align-fields">
          <label><span>{{ copy.workers }}</span><input :value="wholeText(form.totalAvailableWorkers)" inputmode="numeric" @input="form.totalAvailableWorkers = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
          <label><span>{{ copy.simultaneous }}</span><input :value="wholeText(form.maxSimultaneousOrders)" inputmode="numeric" @input="form.maxSimultaneousOrders = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
          <label><span>{{ copy.monthly }}</span><input :value="wholeText(form.monthlyCapacity)" inputmode="numeric" @input="form.monthlyCapacity = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
          <label><span>{{ copy.leadTime }}</span><input :value="wholeText(form.minLeadTimeHours)" inputmode="numeric" @input="form.minLeadTimeHours = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
          <label><span>{{ copy.workStart }}<i class="req">*</i></span><el-time-select v-model="form.workStart" class="apply-time" start="00:00" step="00:15" end="23:45" :clearable="false" /></label>
          <label><span>{{ copy.workEnd }}<i class="req">*</i></span><el-time-select v-model="form.workEnd" class="apply-time" start="00:00" step="00:15" end="23:45" :clearable="false" /></label>
        </div>

        <div class="apply-choices">
          <article v-for="item in capacityChoices" :key="item.key">
            <div>
              <strong>{{ item.label }}<i class="req">*</i></strong>
            </div>
            <div class="yes-no">
              <button type="button" :class="{ 'is-on': form[item.key] === 1 }" @click="form[item.key] = 1">{{ copy.yes }}</button>
              <button type="button" :class="{ 'is-on': form[item.key] === 0 }" @click="form[item.key] = 0">{{ copy.no }}</button>
            </div>
          </article>
          <article>
            <div>
              <strong>{{ copy.emaar }}<i class="req">*</i></strong>
            </div>
            <div class="yes-no">
              <button type="button" :class="{ 'is-on': form.emaarOnboarded === 1 }" @click="form.emaarOnboarded = 1">{{ copy.yes }}</button>
              <button type="button" :class="{ 'is-on': form.emaarOnboarded === 0 }" @click="form.emaarOnboarded = 0">{{ copy.no }}</button>
            </div>
          </article>
          <article>
            <div>
              <strong>{{ copy.otherCommunity }}<i class="req">*</i></strong>
            </div>
            <div class="yes-no">
              <button type="button" :class="{ 'is-on': form.otherCommunityOnboarded === 1 }" @click="form.otherCommunityOnboarded = 1">{{ copy.yes }}</button>
              <button type="button" :class="{ 'is-on': form.otherCommunityOnboarded === 0 }" @click="setOtherCommunity(0)">{{ copy.no }}</button>
            </div>
          </article>
        </div>
        <label v-if="form.otherCommunityOnboarded === 1" class="community-note">
          <span>{{ copy.applyRenmark }}<i class="req">*</i></span>
          <textarea v-model="form.applyRenmark" rows="3" maxlength="512" :placeholder="copy.applyRenmarkPlaceholder" />
        </label>
      </section>

      <p v-if="errorText" class="apply-error">{{ errorText }}</p>
      <footer class="apply-actions">
        <button class="primary" type="submit" :disabled="saving">{{ saving ? copy.saving : copy.submit }}</button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import elLocaleEn from 'element-plus/es/locale/lang/en';
import elLocaleZhCn from 'element-plus/es/locale/lang/zh-cn';
import { categoryIdPayload, isOtherService, listServiceCategories, serviceCategoryLabel, submitOnboarding, type ServiceCategoryOption } from '@/modules/client/api/supplier-onboarding';
import { DEFAULT_PHONE_DIAL, PHONE_DIAL_OPTIONS, joinPhone, nationalNumberOk, phoneDialLabel } from '@/utils/phone-dial';

type Bit = 0 | 1 | null;

const { locale } = useI18n({ useScope: 'global' });
const isZh = computed(() => locale.value.startsWith('zh'));
const datePickerLocale = computed(() => (isZh.value ? elLocaleZhCn : elLocaleEn));
const saving = ref(false);
const done = ref(false);
const errorText = ref('');
const categories = ref<ServiceCategoryOption[]>([]);
const categoriesLoading = ref(false);
const categoriesError = ref('');
const selectedIds = ref<string[]>([]);
const expectedServiceRemark = ref('');
const whatsappSame = ref(false);
const otherSelected = computed(() => categories.value.some((option) => selectedIds.value.includes(option.categoryId) && isOtherService(option)));

const form = reactive({
  companyName: '',
  tradeLicenseNo: '',
  licenseExpiry: '',
  vatTrn: '',
  officeAddress: '',
  contactPerson: '',
  mobileCode: DEFAULT_PHONE_DIAL,
  mobile: '',
  whatsappCode: DEFAULT_PHONE_DIAL,
  whatsapp: '',
  email: '',
  yearsInBusiness: null as number | null,
  totalAvailableWorkers: null as number | null,
  maxSimultaneousOrders: null as number | null,
  monthlyCapacity: null as number | null,
  minLeadTimeHours: null as number | null,
  workStart: '08:00',
  workEnd: '20:00',
  weekendService: 1 as Bit,
  publicHolidayService: 1 as Bit,
  emergencyService: null as Bit,
  emaarOnboarded: null as Bit,
  otherCommunityOnboarded: null as Bit,
  applyRenmark: '',
});

const wholeText = (value: number | null) => (value == null ? '' : String(value));
const wholeNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  return digits ? Number(digits) : null;
};
const syncWhatsapp = () => {
  if (!whatsappSame.value) return;
  form.whatsappCode = form.mobileCode;
  form.whatsapp = form.mobile;
};
watch(() => [form.mobile, form.mobileCode], syncWhatsapp);

const copy = computed(() =>
  isZh.value
    ? {
        title: '服务伙伴注册',
        lead: '填写公司资料和服务能力，提交后进入审核。',
        stepCompany: '公司',
        stepContact: '联系方式',
        stepCapacity: '服务能力',
        companyName: '公司名称',
        licenseNo: '营业执照号码',
        licenseExpiry: '营业执照到期日',
        licenseHint: '营业执照日期不可低于当前日期',
        datePlaceholder: '请选择日期',
        vat: 'VAT / TRN 号码（如有）',
        years: '您的公司经营多少年了？',
        address: '办公地址',
        contact: '联系人',
        email: '邮箱',
        mobile: '手机号码',
        whatsapp: 'WhatsApp 号码',
        sameAsMobile: '与手机号相同',
        yes: '是',
        no: '否',
        workers: '您共有多少名员工？',
        simultaneous: '您同时可以处理多少个订单？',
        monthly: '您每月可以完成多少个订单？',
        leadTime: '您需要提前多少小时收到订单？',
        workStart: '您几点开始工作？',
        workEnd: '您几点结束工作？',
        emaar: '您是否已在 Emaar 社区注册？',
        emaarHint: '是否曾在 Emaar 社区完成入驻或提供服务',
        otherCommunity: '您是否已在其他社区注册？',
        otherCommunityHint: '选「是」后请填写社区说明',
        applyRenmark: '其他社区说明',
        applyRenmarkPlaceholder: '请填写入驻过的其他社区，最多 512 字',
        submit: '提交审核',
        saving: '提交中',
        doneTitle: '申请提交成功',
        doneBody: '感谢提交申请。申请正在审核。审核通过后，将为您创建服务伙伴账号。账号信息和登录方式会发送到申请中填写的邮箱。',
        backJoin: '返回合作页',
        requiredHint: '标有 * 的为必填，其余为选填。',
        optional: '选填',
        upload: '上传保单',
        addFiles: '继续添加',
        uploading: '上传中',
        removeFile: '移除',
        fileTypes: 'PDF、JPG 或 PNG，最多 20 份',
        fileLimit: '每种保险最多 20 份',
        fileSize: '单个文件不能超过 20MB',
        uploaded: '已上传',
        required: '请补全必填项',
        insuranceFile: '选择“是”时请至少上传一份保单，可以多份',
        dialCode: '区号',
        phone: '请填写区号后面的号码',
        communityNoteRequired: '入驻过其他社区时请填写说明',
        services: '您提供哪些服务？',
        servicesHint: '选择可以提供的服务大类，可以多选。',
        servicesLoading: '正在加载服务大类',
        servicesRequired: '服务大类暂时无法加载',
        serviceNote: '其他服务说明',
        serviceNotePlaceholder: '请说明其他可提供的服务，最多 512 字',
        serviceNoteError: '选择了其他时请填写说明',
      }
    : {
        title: 'Service Partner Registration',
        lead: 'Share your company details and capacity. We review every application.',
        stepCompany: 'Company',
        stepContact: 'Contact',
        stepCapacity: 'Capacity',
        companyName: 'Company name',
        licenseNo: 'Trade license number',
        licenseExpiry: 'License expiry date',
        licenseHint: 'The business license expiration date must be later than today',
        datePlaceholder: 'Select a date',
        vat: 'VAT / TRN number (if you have one)',
        years: 'How many years have you been in business?',
        address: 'Office address',
        contact: 'Contact person',
        email: 'Email',
        mobile: 'Mobile number',
        whatsapp: 'WhatsApp number',
        sameAsMobile: 'Same as mobile number',
        yes: 'Yes',
        no: 'No',
        workers: 'How many staff do you have in total?',
        simultaneous: 'How many jobs can you handle at the same time?',
        monthly: 'How many jobs can you do in one month?',
        leadTime: 'How many hours\' notice do you need before a job?',
        workStart: 'What time do you start work?',
        workEnd: 'What time do you finish work?',
        emaar: 'Are you registered with an Emaar community?',
        emaarHint: 'Whether you have already onboarded or provided service in an Emaar community',
        otherCommunity: 'Are you registered with other communities?',
        otherCommunityHint: 'Choose yes, then describe those communities',
        applyRenmark: 'Other community note',
        applyRenmarkPlaceholder: 'Name the other communities you have joined. Up to 512 characters.',
        submit: 'Submit for review',
        saving: 'Submitting',
        doneTitle: 'Application Submitted Successfully',
        doneBody: 'Thank you for submitting your application. Your application is now under review. Once approved, your service partner account will be created. Your account details and login credentials will be shared with you via the email address provided in your application.',
        backJoin: 'Back to Partners',
        requiredHint: 'Fields marked with * are required. All other fields are optional.',
        optional: 'Optional',
        upload: 'Upload policies',
        addFiles: 'Add files',
        uploading: 'Uploading',
        removeFile: 'Remove',
        fileTypes: 'PDF, JPG or PNG. Up to 20 files.',
        fileLimit: 'Each insurance type allows at most 20 files.',
        fileSize: 'Each file must be 20MB or smaller.',
        uploaded: 'Uploaded',
        required: 'Please complete the required fields',
        insuranceFile: 'Upload at least one policy when the answer is yes. Several files are allowed.',
        dialCode: 'Country code',
        phone: 'Enter the number after the country code',
        communityNoteRequired: 'Please describe the other communities',
        services: 'Which services do you offer?',
        servicesHint: 'Select every top-level category you can provide. Choose more than one if needed.',
        servicesLoading: 'Loading categories',
        servicesRequired: 'Service categories could not be loaded',
        serviceNote: 'Other service note',
        serviceNotePlaceholder: 'Describe the other services you can provide. Up to 512 characters.',
        serviceNoteError: 'Please describe the other services',
      },
);

const capacityChoices = computed(() => [
  { key: 'weekendService' as const, label: isZh.value ? '您周末工作吗？' : 'Do you work on weekends?' },
  { key: 'publicHolidayService' as const, label: isZh.value ? '您公共假期工作吗？' : 'Do you work on public holidays?' },
  { key: 'emergencyService' as const, label: isZh.value ? '您可以接紧急订单吗？' : 'Can you take urgent / emergency jobs?' },
]);

const setOtherCommunity = (value: Bit) => {
  form.otherCommunityOnboarded = value
  if (value !== 1) form.applyRenmark = ''
}

const toggleCategory = (option: ServiceCategoryOption) => {
  if (selectedIds.value.includes(option.categoryId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== option.categoryId)
    if (isOtherService(option)) expectedServiceRemark.value = ''
    return
  }
  selectedIds.value = [...selectedIds.value, option.categoryId]
}

const loadCategories = async () => {
  categoriesLoading.value = true
  categoriesError.value = ''
  try {
    categories.value = await listServiceCategories()
  } catch (error) {
    categories.value = []
    categoriesError.value = error instanceof Error ? error.message : copy.value.servicesRequired
  } finally {
    categoriesLoading.value = false
  }
}

onMounted(loadCategories)

const phoneOk = (value: string) => nationalNumberOk(value);
const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};
const disableLicenseDate = (date: Date) => date.getTime() <= startOfToday().getTime();
const licenseAfterToday = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const picked = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return picked.getTime() > startOfToday().getTime();
};

const companyReady = () => {
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());
  return Boolean(
    form.companyName.trim()
    && form.tradeLicenseNo.trim()
    && licenseAfterToday(form.licenseExpiry)
    && form.officeAddress.trim()
    && form.contactPerson.trim()
    && emailOk
    && phoneOk(form.mobile)
    && phoneOk(form.whatsapp),
  );
};

const submit = async () => {
  const bits = capacityChoices.value.every((item) => form[item.key] === 0 || form[item.key] === 1);
  const emaarReady = form.emaarOnboarded === 0 || form.emaarOnboarded === 1
  const otherReady = form.otherCommunityOnboarded === 0 || form.otherCommunityOnboarded === 1
  const noteReady = form.otherCommunityOnboarded !== 1 || Boolean(form.applyRenmark.trim())
  if (!companyReady() || !bits || !emaarReady || !otherReady || !noteReady || !form.workStart || !form.workEnd) {
    if (form.licenseExpiry && !licenseAfterToday(form.licenseExpiry)) errorText.value = copy.value.licenseHint;
    else if ((form.mobile.trim() || form.whatsapp.trim()) && (!phoneOk(form.mobile) || !phoneOk(form.whatsapp))) errorText.value = copy.value.phone;
    else if (otherReady && !noteReady) errorText.value = copy.value.communityNoteRequired;
    else errorText.value = copy.value.required;
    return;
  }
  saving.value = true;
  errorText.value = '';
  try {
    await submitOnboarding({
      companyName: form.companyName.trim(),
      tradeLicenseNo: form.tradeLicenseNo.trim(),
      licenseExpiry: form.licenseExpiry,
      vatTrn: form.vatTrn.trim() || null,
      officeAddress: form.officeAddress.trim(),
      contactPerson: form.contactPerson.trim(),
      mobile: joinPhone(form.mobileCode, form.mobile),
      whatsapp: joinPhone(form.whatsappCode, form.whatsapp),
      email: form.email.trim(),
      yearsInBusiness: form.yearsInBusiness,
      totalAvailableWorkers: form.totalAvailableWorkers,
      maxSimultaneousOrders: form.maxSimultaneousOrders,
      workingHours: `${form.workStart}-${form.workEnd}`,
      weekendService: form.weekendService,
      publicHolidayService: form.publicHolidayService,
      emergencyService: form.emergencyService,
      minLeadTimeHours: form.minLeadTimeHours,
      monthlyCapacity: form.monthlyCapacity,
      emaarOnboarded: form.emaarOnboarded,
      otherCommunityOnboarded: form.otherCommunityOnboarded,
      applyRenmark: form.otherCommunityOnboarded === 1 ? form.applyRenmark.trim() : null,
      expectedServiceCategoryIds: selectedIds.value.length ? categoryIdPayload(selectedIds.value) : null,
      expectedServiceRemark: otherSelected.value && expectedServiceRemark.value.trim() ? expectedServiceRemark.value.trim() : null,
    });
    done.value = true;
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : copy.value.required;
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.apply, .apply *, .apply *::before, .apply *::after { box-sizing: border-box; }
.apply { min-height: 100%; background: #f4f1eb; color: #05152b; }
.apply-hero { padding: 36px 28px 28px; background: #05152b; color: #f7f1e6; }
.apply-hero p { margin: 0 0 8px; color: #e8c27a; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
.apply-hero h1 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 40px; font-weight: 500; letter-spacing: -.03em; }
.apply-hero span { display: block; max-width: 640px; margin-top: 10px; color: #d9d1c5; }
.apply-sheet { width: min(980px, calc(100% - 32px)); margin: -18px auto 48px; padding: 22px; background: #fffdf8; border: 1px solid #e4d8c6; border-radius: 22px; }
.yes-no button, .apply-actions button, .file-pick { font: inherit; }
.apply-legend { margin: 0 0 16px; color: #5c564c; font-size: 13px; font-weight: 650; }
.phone-pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 16px; row-gap: 8px; align-items: start; }
.phone-pair > label { display: grid; gap: 6px; min-width: 0; }
.phone-pair > label > span { min-height: 1.35em; }
.same-mobile { grid-column: 2; display: flex; align-items: center; gap: 8px; min-height: 22px; margin: 0; color: #74685a; font-size: 13px; font-weight: 500; }
.same-mobile input { width: 16px; height: 16px; margin: 0; flex: none; accent-color: #05152b; }
.apply-block--next { margin-top: 28px; padding-top: 24px; border-top: 1px solid #eadfce; }
.apply-block h2, .apply-done h2 { margin: 0 0 8px; font-family: Georgia, "Times New Roman", serif; font-size: 32px; font-weight: 500; }
.apply-block h3 { margin: 22px 0 10px; font-size: 16px; }
.req { color: #c2412d; font-style: normal; font-weight: 800; letter-spacing: 0; text-transform: none; }
.opt { color: #8a8175; font-size: 12px; font-style: normal; font-weight: 650; letter-spacing: 0; text-transform: none; }
.apply-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; align-items: start; }
.apply-grid label, .apply-choices article { display: grid; gap: 6px; min-width: 0; align-content: start; }
.apply-grid label { color: #5c564c; font-size: 13px; font-weight: 700; letter-spacing: 0; text-transform: none; }
.apply-grid label > span { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 6px; min-height: 1.35em; line-height: 1.35; }
.apply-grid.align-fields > label > span { min-height: 2.7em; }
.apply :deep(.apply-date.el-date-editor) { width: 100%; height: 40px; }
.apply :deep(.apply-date .el-input__wrapper) { height: 40px; padding: 0 12px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #e6dccb inset; }
.apply :deep(.apply-date .el-input__inner) { color: #05152b; font-size: 14px; font-weight: 500; }
.apply :deep(.el-input__inner) { text-transform: none; }
.apply-grid > label > input, .phone-field input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #e6dccb; border-radius: 10px; background: #fff; color: #05152b; font: inherit; font-size: 14px; font-weight: 500; letter-spacing: 0; text-transform: none; }
.apply :deep(.apply-time) { width: 100%; }
.apply :deep(.apply-time .el-select__wrapper) { min-height: 40px; padding: 0 12px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #e6dccb inset; cursor: pointer; }
.apply :deep(.apply-time .el-select__selected-item),
.apply :deep(.apply-time .el-select__placeholder) { color: #05152b; font-size: 14px; font-weight: 500; }
.phone-field { display: flex; align-items: center; gap: 8px; }
.phone-field select { flex: 0 0 auto; max-width: 148px; height: 40px; padding: 0 22px 0 10px; border: 0; border-radius: 10px; background: #05152b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23f7f1e6' d='M1 1.2 6 6.2 11 1.2'/%3E%3C/svg%3E") no-repeat right 8px center; color: #f7f1e6; font: inherit; font-size: 13px; font-weight: 750; appearance: none; cursor: pointer; }
.phone-field select option { color: #05152b; background: #fff; }
.phone-field input { min-width: 0; }
.field-hint { color: #8a5a2b; font-size: 12px; font-weight: 650; line-height: 1.45; }
.span-2 { grid-column: span 2; }
.community-note { display: grid; gap: 6px; margin-top: 14px; color: #5c564c; font-size: 13px; font-weight: 700; }
.community-note > span { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.community-note textarea { width: 100%; min-height: 88px; padding: 10px 12px; border: 1px solid #e6dccb; border-radius: 10px; background: #fff; color: #05152b; font: inherit; font-size: 14px; font-weight: 500; resize: vertical; }
.service-categories { display: grid; gap: 10px; margin-bottom: 18px; }
.service-categories__head { display: grid; gap: 4px; }
.service-categories__head strong { color: #05152b; font-size: 14px; }
.service-categories__head small { color: #7a7166; font-size: 12px; font-weight: 500; }
.service-categories__options { display: flex; flex-wrap: wrap; gap: 8px; }
.service-categories__options button { min-height: 36px; padding: 6px 14px; border: 1px solid #eadfce; border-radius: 999px; background: #fff; color: #05152b; font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
.service-categories__options button.is-on { color: #f7f1e6; background: #05152b; border-color: #05152b; }
.apply-choices { display: grid; gap: 10px; margin-top: 18px; }
.apply-choices article { grid-template-columns: minmax(0, 1fr) auto; align-items: center; padding: 14px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.apply-choices article > div:first-child { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
.apply-choices strong { color: #05152b; font-size: 14px; letter-spacing: 0; text-transform: none; }
.apply-choices strong .req { margin-left: 2px; }
.apply-choices small, .apply-muted { color: #7a7166; font-size: 12px; font-weight: 500; letter-spacing: 0; text-transform: none; }
.yes-no { display: flex; gap: 6px; }
.yes-no button { height: 34px; padding: 0 12px; border: 1px solid #eadfce; border-radius: 999px; background: #fff; cursor: pointer; }
.yes-no button.is-on { color: #f7f1e6; background: #05152b; border-color: #05152b; }
.policy-files { grid-column: 1 / -1; display: grid; gap: 8px; }
.file-pick { position: relative; display: flex; align-items: center; gap: 12px; min-height: 48px; margin-top: 4px; padding: 8px; border: 1px dashed #05152b; border-radius: 12px; background: #f4f1eb; cursor: pointer; }
.file-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.file-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; padding: 6px 12px; border: 1px solid #eadfce; border-radius: 10px; background: #fff; color: #05152b; font-size: 13px; font-weight: 650; }
.file-list li span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-list button { flex: 0 0 auto; border: 0; background: transparent; color: #8d5a32; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.file-pick input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.file-pick__btn { position: relative; z-index: 1; display: inline-flex; align-items: center; flex: 0 0 auto; height: 36px; padding: 0 14px; border-radius: 9px; background: #05152b; color: #f7f1e6; font-size: 14px; font-weight: 750; letter-spacing: 0; text-transform: none; white-space: nowrap; pointer-events: none; }
.file-pick__btn .req { color: #ffb4a2; }
.file-pick__meta { position: relative; z-index: 1; color: #05152b; font-size: 13px; font-weight: 650; letter-spacing: 0; text-transform: none; pointer-events: none; }
.file-pick.is-done { border-style: solid; background: #fff; }
.file-pick.is-done .file-pick__btn { background: #fff; color: #05152b; box-shadow: inset 0 0 0 1px #05152b; }
.apply-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.apply-actions button, .apply-done a { height: 44px; padding: 0 18px; border-radius: 12px; border: 0; cursor: pointer; font-weight: 700; text-decoration: none; }
.primary { color: #f7f1e6; background: #05152b; }
.ghost { color: #05152b; background: transparent; border: 1px solid #eadfce !important; }
.apply-error { margin: 14px 0 0; color: #9a3b32; }
.apply-done { padding: 36px 28px 32px; }
.apply-done p { max-width: 640px; color: #5c564c; line-height: 1.6; }
.apply-done__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.apply-done__actions a { display: inline-flex; align-items: center; color: #f7f1e6; background: #05152b; }
.apply-done__actions a.ghost { color: #05152b; background: transparent; box-shadow: inset 0 0 0 1px #eadfce; }
@media (max-width: 720px) {
  .apply-hero { padding: 28px 18px 22px; }
  .apply-hero h1 { font-size: 32px; }
  .apply-sheet { width: min(100% - 20px, 980px); margin-bottom: 28px; padding: 16px; border-radius: 16px; }
  .apply-grid, .phone-pair, .apply-choices article { grid-template-columns: 1fr; }
  .same-mobile { grid-column: auto; }
  .apply-grid.align-fields > label > span { min-height: 0; }
  .span-2 { grid-column: auto; }
  .yes-no { justify-content: flex-start; }
  .apply-actions { justify-content: stretch; }
  .apply-actions button { width: 100%; }
}
</style>
