<template>
  <div class="apply">
    <header class="apply-hero">
      <div class="apply-hero__inner">
        <p>HourX</p>
        <h1>{{ copy.title }}</h1>
        <span>{{ copy.lead }}</span>
      </div>
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
        <h2>{{ individual ? copy.stepPerson : copy.stepCompany }}</h2>
        <div v-if="individual" class="apply-grid">
          <label class="span-2"><span>{{ copy.fullName }}<i class="req">*</i></span><input v-model="form.fullName" maxlength="255" required /></label>
          <label>
            <span>{{ copy.dateOfBirth }}<i class="req">*</i></span>
            <el-config-provider :locale="datePickerLocale">
              <el-date-picker
                v-model="form.dateOfBirth"
                class="apply-date"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :editable="false"
                :clearable="false"
                :disabled-date="disableBirthDate"
                :placeholder="copy.datePlaceholder"
              />
            </el-config-provider>
          </label>
          <label><span>{{ copy.nationality }}<i class="req">*</i></span><input v-model="form.nationality" maxlength="64" required /></label>
          <label class="span-2"><span>{{ copy.residentialCity }}<i class="req">*</i></span><input v-model="form.residentialCity" maxlength="64" required /></label>
          <label><span>{{ copy.vat }}</span><input v-model="form.vatTrn" maxlength="128" /></label>
          <label><span>{{ copy.yearsPersonal }}</span><input :value="wholeText(form.yearsInBusiness)" inputmode="numeric" @input="form.yearsInBusiness = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
        </div>
        <div v-else class="apply-grid">
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
          <label><span>{{ copy.vat }}</span><input v-model="form.vatTrn" maxlength="128" /></label>
          <label><span>{{ copy.years }}</span><input :value="wholeText(form.yearsInBusiness)" inputmode="numeric" @input="form.yearsInBusiness = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
          <label class="span-2"><span>{{ copy.address }}<i class="req">*</i></span><input v-model="form.officeAddress" required /></label>
        </div>
        <div v-if="form.vatTrn.trim()" class="tax-files">
          <span>{{ copy.taxFile }}<i class="req">*</i></span>
          <small>{{ copy.taxFileHint }}</small>
          <ul v-if="vatFiles.length" class="file-list">
            <li v-for="(file, index) in vatFiles" :key="`${file.url}-${index}`">
              <span>{{ file.name }}</span>
              <button type="button" @click="removeVatFile(index)">{{ copy.removeFile }}</button>
            </li>
          </ul>
          <label class="file-pick" :class="{ 'is-done': vatFiles.length }">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple :disabled="vatUploading" @change="onVatFiles" />
            <span class="file-pick__btn">{{ vatUploading ? copy.uploading : (vatFiles.length ? copy.addFiles : copy.uploadTax) }}</span>
            <span class="file-pick__meta">{{ copy.fileTypes }}</span>
          </label>
        </div>
      </section>

      <section class="apply-block apply-block--next">
        <h2>{{ copy.stepContact }}</h2>
        <div class="apply-grid">
          <label v-if="!individual"><span>{{ copy.contact }}<i class="req">*</i></span><input v-model="form.contactPerson" required /></label>
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
          <label v-if="!individual"><span>{{ copy.workers }}</span><input :value="wholeText(form.totalAvailableWorkers)" inputmode="numeric" @input="form.totalAvailableWorkers = wholeNumber(($event.target as HTMLInputElement).value)" /></label>
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
              <button type="button" :class="{ 'is-on': form[item.key] === 1 }" @click="setCapacity(item.key, 1)">{{ copy.yes }}</button>
              <button type="button" :class="{ 'is-on': form[item.key] === 0 }" @click="setCapacity(item.key, 0)">{{ copy.no }}</button>
            </div>
          </article>
          <article>
            <div>
              <strong>{{ copy.wearUniform }}<i class="req">*</i></strong>
            </div>
            <div class="yes-no">
              <button type="button" :class="{ 'is-on': form.wearUniform === 1 }" @click="form.wearUniform = 1">{{ copy.yes }}</button>
              <button type="button" :class="{ 'is-on': form.wearUniform === 0 }" @click="form.wearUniform = 0">{{ copy.no }}</button>
            </div>
          </article>
        </div>
        <div v-if="!individual" class="community-picks">
          <strong>{{ copy.communities }}<i class="req">*</i></strong>
          <div class="community-picks__options" role="group" :aria-label="copy.communities">
            <button
              v-for="item in communityChips"
              :key="item.key"
              type="button"
              :class="{ 'is-on': form[item.key] === 1 }"
              :aria-pressed="form[item.key] === 1"
              @click="toggleCommunity(item.key)"
            >{{ item.label }}</button>
          </div>
        </div>
        <label v-if="!individual && form.otherCommunityOnboarded === 1" class="community-note">
          <span>{{ copy.applyRenmark }}<i class="req">*</i></span>
          <textarea v-model="form.applyRenmark" rows="3" maxlength="512" :placeholder="copy.applyRenmarkPlaceholder" />
        </label>
      </section>

      <p v-if="errorText" class="apply-error">{{ errorText }}</p>
      <footer class="apply-actions">
        <button class="primary" type="submit" :disabled="saving || vatUploading">{{ saving ? copy.saving : copy.submit }}</button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import elLocaleEn from 'element-plus/es/locale/lang/en';
import elLocaleZhCn from 'element-plus/es/locale/lang/zh-cn';
import { categoryIdPayload, isOtherService, listServiceCategories, serviceCategoryLabel, submitOnboarding, uploadOnboardingFile, type ServiceCategoryOption } from '@/modules/client/api/supplier-onboarding';
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
const vatFiles = ref<Array<{ name: string; url: string }>>([]);
const vatUploading = ref(false);
const VAT_FILE_LIMIT = 20;
const VAT_FILE_BYTES = 20 * 1024 * 1024;
const individual = computed(() => form.supplierType === 2);
const otherSelected = computed(() => categories.value.some((option) => selectedIds.value.includes(option.categoryId) && isOtherService(option)));

const form = reactive({
  supplierType: 1 as 1 | 2,
  fullName: '',
  dateOfBirth: '',
  nationality: '',
  residentialCity: '',
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
  minLeadTimeHours: null as number | null,
  workStart: '08:00',
  workEnd: '20:00',
  saturdayService: 1 as Bit,
  sundayService: 1 as Bit,
  publicHolidayService: 1 as Bit,
  emergencyService: null as Bit,
  wearUniform: null as Bit,
  emaarOnboarded: null as Bit,
  nakheelOnboarded: null as Bit,
  dubaiHoldingsOnboarded: null as Bit,
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
        lead: '填写公司资料并提交，我们会审核。',
        channelLabel: '入驻类型',
        channelCompany: '企业入驻',
        channelIndividual: '个人入驻',
        individualLead: '填写姓名、出生日期、国籍、居住城市和联系方式。证件、签证和银行资料在审核通过后登录后台补充。',
        stepPerson: '个人资料',
        fullName: '姓名',
        dateOfBirth: '出生日期',
        birthHint: '出生日期不能晚于今天',
        nationality: '国籍',
        residentialCity: '居住城市',
        yearsPersonal: '从业年限',
        stepCompany: '公司',
        stepContact: '联系方式',
        stepCapacity: '服务能力',
        companyName: '公司名称',
        licenseNo: '营业执照号码',
        licenseExpiry: '营业执照到期日',
        licenseHint: '营业执照日期不可低于当前日期',
        datePlaceholder: '请选择日期',
        vat: 'VAT / TRN 号码（如有）',
        taxFile: '税务文件',
        taxFileHint: '填写了税号时，请至少上传一份税务文件。',
        taxFileRequired: '填写了税号时请至少上传一份税务文件',
        uploadTax: '上传税务文件',
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
        leadTime: '您需要提前多少小时收到订单？',
        workStart: '您几点开始工作？',
        workEnd: '您几点结束工作？',
        wearUniform: '是否愿意穿我们的制服？',
        communities: '是否已在以下社区注册？',
        otherChip: '其他（请说明）',
        emaar: '您是否已在 Emaar 社区注册？',
        emaarHint: '是否曾在 Emaar 社区完成入驻或提供服务',
        nakheel: '您是否已在 Nakheel 社区注册？',
        dubaiHoldings: '您是否已在 Dubai Holdings 社区注册？',
        otherCommunity: '您是否已在其他社区注册？',
        otherCommunityHint: '选「是」后请填写社区说明',
        applyRenmark: '其他社区说明',
        applyRenmarkPlaceholder: '请填写入驻过的其他社区，最多 512 字',
        submit: '提交审核',
        saving: '提交中',
        doneTitle: 'Application Submitted Successfully',
        doneBody: "Thank you! Your application is under review. Once approved, we'll email your login details. Please check your inbox and spam folder.",
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
        lead: 'Applications are reviewed by the HourX team before access is granted.',
        channelLabel: 'Application type',
        channelCompany: 'Company',
        channelIndividual: 'Individual',
        individualLead: 'Add your name, date of birth, nationality, city, and contact details. Identity documents, visa, and bank details are added in the workspace after approval.',
        stepPerson: 'Personal details',
        fullName: 'Full name',
        dateOfBirth: 'Date of birth',
        birthHint: 'Date of birth cannot be in the future',
        nationality: 'Nationality',
        residentialCity: 'Residential city',
        yearsPersonal: 'Years of experience',
        stepCompany: 'Company',
        stepContact: 'Contact',
        stepCapacity: 'Capacity',
        companyName: 'Company name',
        licenseNo: 'Trade license number',
        licenseExpiry: 'License expiry date',
        licenseHint: 'The business license expiration date must be later than today',
        datePlaceholder: 'Select a date',
        vat: 'VAT / TRN number (if you have one)',
        taxFile: 'Tax document',
        taxFileHint: 'If you enter a VAT / TRN, upload at least one tax document.',
        taxFileRequired: 'Please attach at least one tax document when VAT / TRN is provided',
        uploadTax: 'Upload tax document',
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
        leadTime: 'How many hours\' notice do you need before a job?',
        workStart: 'What time do you start work?',
        workEnd: 'What time do you finish work?',
        wearUniform: 'Are you willing to wear our uniform?',
        communities: 'Registered with the following Communities?',
        otherChip: 'Other (Please specify)',
        emaar: 'Are you registered with an Emaar community?',
        emaarHint: 'Whether you have already onboarded or provided service in an Emaar community',
        nakheel: 'Are you registered with a Nakheel community?',
        dubaiHoldings: 'Are you registered with a Dubai Holdings community?',
        otherCommunity: 'Are you registered with other communities?',
        otherCommunityHint: 'Choose yes, then describe those communities',
        applyRenmark: 'Other community note',
        applyRenmarkPlaceholder: 'Name the other communities you have joined. Up to 512 characters.',
        submit: 'Submit for review',
        saving: 'Submitting',
        doneTitle: 'Application Submitted Successfully',
        doneBody: "Thank you! Your application is under review. Once approved, we'll email your login details. Please check your inbox and spam folder.",
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
  { key: 'saturdayService' as const, label: isZh.value ? '您周六提供服务吗？' : 'Do you provide service on Saturdays?' },
  { key: 'sundayService' as const, label: isZh.value ? '您周日提供服务吗？' : 'Do you provide service on Sundays?' },
  { key: 'publicHolidayService' as const, label: isZh.value ? '您公共假期工作吗？' : 'Do you work on public holidays?' },
  { key: 'emergencyService' as const, label: isZh.value ? '您可以接紧急订单吗？' : 'Can you take urgent / emergency jobs?' },
]);
const setCapacity = (key: 'saturdayService' | 'sundayService' | 'publicHolidayService' | 'emergencyService', value: Bit) => {
  form[key] = value
}

type CommunityKey = 'emaarOnboarded' | 'nakheelOnboarded' | 'dubaiHoldingsOnboarded' | 'otherCommunityOnboarded'
const communityChips = computed(() => [
  { key: 'emaarOnboarded' as const, label: 'Emaar' },
  { key: 'nakheelOnboarded' as const, label: 'Nakheel' },
  { key: 'dubaiHoldingsOnboarded' as const, label: 'Dubai Holdings' },
  { key: 'otherCommunityOnboarded' as const, label: copy.value.otherChip },
])
const toggleCommunity = (key: CommunityKey) => {
  const next: Bit = form[key] === 1 ? 0 : 1
  form[key] = next
  if (key === 'otherCommunityOnboarded' && next !== 1) form.applyRenmark = ''
}
const communityBit = (value: Bit) => (value === 1 ? 1 : 0)

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
const disableBirthDate = (date: Date) => date.getTime() > startOfToday().getTime();
const birthNotFuture = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const picked = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return picked.getTime() <= startOfToday().getTime();
};
const licenseAfterToday = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const picked = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return picked.getTime() > startOfToday().getTime();
};

const emailOk = () => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());
const contactReady = () => emailOk() && phoneOk(form.mobile) && phoneOk(form.whatsapp);
const companyReady = () => Boolean(
  form.companyName.trim()
  && form.tradeLicenseNo.trim()
  && licenseAfterToday(form.licenseExpiry)
  && form.officeAddress.trim()
  && form.contactPerson.trim()
  && contactReady(),
);
const individualReady = () => Boolean(
  form.fullName.trim()
  && birthNotFuture(form.dateOfBirth)
  && form.nationality.trim()
  && form.residentialCity.trim()
  && contactReady(),
);

const removeVatFile = (index: number) => {
  vatFiles.value = vatFiles.value.filter((_, item) => item !== index);
};
const onVatFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const picked = Array.from(input.files || []);
  input.value = '';
  if (!picked.length || vatUploading.value) return;
  if (vatFiles.value.length + picked.length > VAT_FILE_LIMIT) {
    errorText.value = copy.value.fileLimit;
    return;
  }
  const oversized = picked.find((file) => file.size > VAT_FILE_BYTES);
  const unsupported = picked.find((file) => !/\.(pdf|jpe?g|png)$/i.test(file.name));
  if (oversized) {
    errorText.value = copy.value.fileSize;
    return;
  }
  if (unsupported) {
    errorText.value = copy.value.fileTypes;
    return;
  }
  vatUploading.value = true;
  errorText.value = '';
  try {
    const uploaded: Array<{ name: string; url: string }> = [];
    for (const file of picked) {
      uploaded.push({ name: file.name, url: await uploadOnboardingFile(file) });
    }
    vatFiles.value = [...vatFiles.value, ...uploaded];
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : copy.value.required;
  } finally {
    vatUploading.value = false;
  }
};
const sharedPayload = () => ({
  mobile: joinPhone(form.mobileCode, form.mobile),
  whatsapp: joinPhone(form.whatsappCode, form.whatsapp),
  email: form.email.trim(),
  vatTrn: form.vatTrn.trim() || null,
  vatTrnFile: form.vatTrn.trim() ? vatFiles.value.map((file) => file.url) : null,
  yearsInBusiness: form.yearsInBusiness,
  totalAvailableWorkers: individual.value ? null : form.totalAvailableWorkers,
  workingHours: `${form.workStart}-${form.workEnd}`,
  weekendService: form.saturdayService === 1 || form.sundayService === 1 ? 1 : 0,
  saturdayService: form.saturdayService,
  sundayService: form.sundayService,
  publicHolidayService: form.publicHolidayService,
  emergencyService: form.emergencyService,
  minLeadTimeHours: form.minLeadTimeHours,
  wearUniform: form.wearUniform,
  expectedServiceCategoryIds: selectedIds.value.length ? categoryIdPayload(selectedIds.value) : null,
  expectedServiceRemark: otherSelected.value && expectedServiceRemark.value.trim() ? expectedServiceRemark.value.trim() : null,
});
const submit = async () => {
  const bits = capacityChoices.value.every((item) => form[item.key] === 0 || form[item.key] === 1);
  const uniformReady = form.wearUniform === 0 || form.wearUniform === 1
  const noteReady = individual.value || form.otherCommunityOnboarded !== 1 || Boolean(form.applyRenmark.trim())
  const identityReady = individual.value ? individualReady() : companyReady()
  const taxReady = !form.vatTrn.trim() || vatFiles.value.length > 0
  if (vatUploading.value) return
  if (!identityReady || !bits || !uniformReady || !noteReady || !form.workStart || !form.workEnd || !taxReady) {
    if (individual.value && form.dateOfBirth && !birthNotFuture(form.dateOfBirth)) errorText.value = copy.value.birthHint;
    else if (!individual.value && form.licenseExpiry && !licenseAfterToday(form.licenseExpiry)) errorText.value = copy.value.licenseHint;
    else if ((form.mobile.trim() || form.whatsapp.trim()) && (!phoneOk(form.mobile) || !phoneOk(form.whatsapp))) errorText.value = copy.value.phone;
    else if (!noteReady) errorText.value = copy.value.communityNoteRequired;
    else if (!taxReady) errorText.value = copy.value.taxFileRequired;
    else errorText.value = copy.value.required;
    return;
  }
  saving.value = true;
  errorText.value = '';
  try {
    await submitOnboarding(individual.value ? {
      supplierType: 2,
      fullName: form.fullName.trim(),
      dateOfBirth: form.dateOfBirth,
      nationality: form.nationality.trim(),
      residentialCity: form.residentialCity.trim(),
      ...sharedPayload(),
    } : {
      supplierType: 1,
      companyName: form.companyName.trim(),
      tradeLicenseNo: form.tradeLicenseNo.trim(),
      licenseExpiry: form.licenseExpiry,
      officeAddress: form.officeAddress.trim(),
      contactPerson: form.contactPerson.trim(),
      emaarOnboarded: communityBit(form.emaarOnboarded),
      nakheelOnboarded: communityBit(form.nakheelOnboarded),
      dubaiHoldingsOnboarded: communityBit(form.dubaiHoldingsOnboarded),
      otherCommunityOnboarded: communityBit(form.otherCommunityOnboarded),
      applyRenmark: form.otherCommunityOnboarded === 1 ? form.applyRenmark.trim() : null,
      ...sharedPayload(),
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
.apply { min-height: 100%; background: var(--hourx-client-canvas); color: var(--hourx-client-text); }
.apply-hero {
  padding: 48px 24px;
  color: #fff;
  background-color: var(--hourx-client-text);
  background-image:
    linear-gradient(rgb(184 154 114 / 6%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(184 154 114 / 6%) 1px, transparent 1px);
  background-size: 48px 48px;
}
.apply-hero__inner { width: min(100%, 980px); margin: 0 auto; }
.apply-hero p { margin: 0 0 8px; color: var(--hourx-client-accent); font-size: var(--hourx-client-size-label); font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
.apply-hero h1 { margin: 0; font: 700 var(--hourx-client-size-page)/1.2 var(--hourx-client-heading-font); letter-spacing: -.02em; }
.apply-hero span { display: block; max-width: 640px; margin-top: 10px; color: var(--hourx-client-on-dark); }
.apply-sheet { width: min(980px, calc(100% - 48px)); margin: 32px auto 0; padding-bottom: 48px; }
.yes-no button, .apply-actions button, .file-pick { font: inherit; }
.apply-legend { margin: 0 0 16px; color: var(--hourx-client-muted); font-size: .8125rem; font-weight: 600; }
.apply-channel { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.apply-channel button { min-height: 46px; border: 1px solid var(--hourx-client-border); border-radius: 12px; background: #fff; color: var(--hourx-client-text); font: inherit; font-weight: 600; cursor: pointer; }
.apply-channel button.is-on { border-color: var(--hourx-client-text); background: var(--hourx-client-text); color: #fff; }
.apply-channel__hint { margin: 10px 0 18px; color: var(--hourx-client-muted); font-size: .8125rem; line-height: 1.55; }
.phone-pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 16px; row-gap: 8px; align-items: start; }
.phone-pair > label { display: grid; gap: 6px; min-width: 0; }
.phone-pair > label > span { min-height: 1.35em; }
.same-mobile { grid-column: 2; display: flex; align-items: center; gap: 8px; min-height: 22px; margin: 0; color: var(--hourx-client-muted); font-size: .8125rem; font-weight: 500; }
.same-mobile input { width: 16px; height: 16px; margin: 0; flex: none; accent-color: var(--hourx-client-text); }
.apply-block, .apply-done {
  padding: 24px;
  border: 1px solid var(--hourx-client-border);
  border-radius: 16px;
  background: #fff;
}
.apply-block--next { margin-top: 24px; }
.apply-block h2, .apply-done h2 { margin: 0 0 16px; font: 700 var(--hourx-client-size-section)/1.25 var(--hourx-client-heading-font); }
.apply-block h3 { margin: 22px 0 10px; font-size: var(--hourx-client-size-card); }
.req { color: #c2412d; font-style: normal; font-weight: 600; letter-spacing: 0; text-transform: none; }
.opt { color: var(--hourx-client-muted); font-size: var(--hourx-client-size-label); font-style: normal; font-weight: 600; letter-spacing: 0; text-transform: none; }
.apply-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; align-items: start; }
.apply-grid label, .apply-choices article { display: grid; gap: 6px; min-width: 0; align-content: start; }
.apply-grid label { color: var(--hourx-client-text); font-size: var(--hourx-client-size-action); font-weight: 600; letter-spacing: 0; text-transform: none; }
.apply-grid label > span { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 6px; min-height: 1.35em; line-height: 1.35; }
.apply-grid.align-fields > label > span { min-height: 2.7em; }
.apply :deep(.apply-date.el-date-editor) { width: 100%; height: 48px; }
.apply :deep(.apply-date .el-input__wrapper) { height: 48px; padding: 0 12px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px var(--hourx-client-border) inset; }
.apply :deep(.apply-date .el-input__inner) { color: var(--hourx-client-text); font-size: var(--hourx-client-size-body); font-weight: 400; }
.apply :deep(.el-input__inner) { text-transform: none; }
.apply-grid > label > input, .phone-field input { width: 100%; height: 48px; padding: 0 12px; border: 1px solid var(--hourx-client-border); border-radius: 12px; background: #fff; color: var(--hourx-client-text); font: inherit; font-size: var(--hourx-client-size-body); font-weight: 400; letter-spacing: 0; text-transform: none; }
.apply :deep(.apply-time) { width: 100%; }
.apply :deep(.apply-time .el-select__wrapper) { min-height: 48px; padding: 0 12px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px var(--hourx-client-border) inset; cursor: pointer; }
.apply :deep(.apply-time .el-select__selected-item),
.apply :deep(.apply-time .el-select__placeholder) { color: var(--hourx-client-text); font-size: var(--hourx-client-size-body); font-weight: 400; }
.phone-field { display: flex; align-items: center; gap: 8px; }
.phone-field select { flex: 0 0 auto; max-width: 148px; height: 48px; padding: 0 22px 0 10px; border: 0; border-radius: 12px; background: var(--hourx-client-text) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23f7f1e6' d='M1 1.2 6 6.2 11 1.2'/%3E%3C/svg%3E") no-repeat right 8px center; color: #fff; font: inherit; font-size: .8125rem; font-weight: 600; appearance: none; cursor: pointer; }
.phone-field select option { color: var(--hourx-client-text); background: #fff; }
.phone-field input { min-width: 0; }
.field-hint { color: #8a5a2b; font-size: var(--hourx-client-size-label); font-weight: 600; line-height: 1.45; }
.tax-files { display: grid; gap: 8px; margin-top: 14px; }
.tax-files > span { display: flex; align-items: center; gap: 6px; color: var(--hourx-client-text); font-size: .8125rem; font-weight: 600; }
.tax-files > small { color: var(--hourx-client-muted); font-size: var(--hourx-client-size-label); font-weight: 500; }
.span-2 { grid-column: span 2; }
.community-picks { display: grid; gap: 12px; margin-top: 18px; }
.community-picks > strong { color: var(--hourx-client-text); font-size: var(--hourx-client-size-card); font-weight: 600; }
.community-picks > strong .req { margin-left: 2px; }
.community-picks__options { display: flex; flex-wrap: wrap; gap: 12px; }
.community-picks__options button { min-height: 44px; padding: 0 22px; border: 1.5px solid var(--hourx-client-border); border-radius: 999px; background: #fff; color: var(--hourx-client-text); font: inherit; font-size: var(--hourx-client-size-body); font-weight: 600; cursor: pointer; }
.community-picks__options button.is-on { border-color: var(--hourx-client-text); background: var(--hourx-client-text); color: #fff; }
.community-note { display: grid; gap: 6px; margin-top: 14px; color: var(--hourx-client-muted); font-size: .8125rem; font-weight: 600; }
.community-note > span { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.community-note textarea { width: 100%; min-height: 88px; padding: 10px 12px; border: 1px solid var(--hourx-client-border); border-radius: 12px; background: #fff; color: var(--hourx-client-text); font: inherit; font-size: var(--hourx-client-size-body); font-weight: 400; resize: vertical; }
.service-categories { display: grid; gap: 10px; margin-bottom: 18px; }
.service-categories__head { display: grid; gap: 4px; }
.service-categories__head strong { color: var(--hourx-client-text); font-size: var(--hourx-client-size-action); }
.service-categories__head small { color: var(--hourx-client-muted); font-size: var(--hourx-client-size-label); font-weight: 500; }
.service-categories__options { display: flex; flex-wrap: wrap; gap: 8px; }
.service-categories__options button { min-height: 36px; padding: 6px 14px; border: 1px solid var(--hourx-client-border); border-radius: 999px; background: #fff; color: var(--hourx-client-text); font: inherit; font-size: var(--hourx-client-size-action); font-weight: 600; cursor: pointer; }
.service-categories__options button.is-on { color: #fff; background: var(--hourx-client-text); border-color: var(--hourx-client-text); }
.apply-choices { display: grid; gap: 10px; margin-top: 18px; }
.apply-choices article { grid-template-columns: minmax(0, 1fr) auto; align-items: center; padding: 14px; background: #fff; border: 1px solid var(--hourx-client-border); border-radius: 14px; }
.apply-choices article > div:first-child { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
.apply-choices strong { color: var(--hourx-client-text); font-size: var(--hourx-client-size-action); letter-spacing: 0; text-transform: none; }
.apply-choices strong .req { margin-left: 2px; }
.apply-choices small, .apply-muted { color: var(--hourx-client-muted); font-size: var(--hourx-client-size-label); font-weight: 500; letter-spacing: 0; text-transform: none; }
.yes-no { display: flex; gap: 6px; }
.yes-no button { height: 34px; padding: 0 12px; border: 1px solid var(--hourx-client-border); border-radius: 999px; background: #fff; cursor: pointer; }
.yes-no button.is-on { color: #fff; background: var(--hourx-client-text); border-color: var(--hourx-client-text); }
.policy-files { grid-column: 1 / -1; display: grid; gap: 8px; }
.file-pick { position: relative; display: flex; align-items: center; gap: 12px; min-height: 48px; margin-top: 4px; padding: 8px; border: 1px dashed var(--hourx-client-text); border-radius: 12px; background: var(--hourx-client-canvas); cursor: pointer; }
.file-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.file-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; padding: 6px 12px; border: 1px solid var(--hourx-client-border); border-radius: 12px; background: #fff; color: var(--hourx-client-text); font-size: .8125rem; font-weight: 600; }
.file-list li span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-list button { flex: 0 0 auto; border: 0; background: transparent; color: #8d5a32; font: inherit; font-size: .8125rem; font-weight: 600; cursor: pointer; }
.file-pick input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.file-pick__btn { position: relative; z-index: 1; display: inline-flex; align-items: center; flex: 0 0 auto; height: 36px; padding: 0 14px; border-radius: 9px; background: var(--hourx-client-text); color: #fff; font-size: var(--hourx-client-size-action); font-weight: 600; letter-spacing: 0; text-transform: none; white-space: nowrap; pointer-events: none; }
.file-pick__btn .req { color: #ffb4a2; }
.file-pick__meta { position: relative; z-index: 1; color: var(--hourx-client-text); font-size: .8125rem; font-weight: 600; letter-spacing: 0; text-transform: none; pointer-events: none; }
.file-pick.is-done { border-style: solid; background: #fff; }
.file-pick.is-done .file-pick__btn { background: #fff; color: var(--hourx-client-text); box-shadow: inset 0 0 0 1px var(--hourx-client-text); }
.apply-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.apply-actions button, .apply-done a { min-height: 52px; padding: 8px 22px; border-radius: 12px; border: 0; cursor: pointer; font-size: var(--hourx-client-size-action); font-weight: 600; text-decoration: none; }
.primary { color: #fff; background: var(--hourx-client-text); }
.ghost { color: var(--hourx-client-text); background: transparent; border: 1px solid var(--hourx-client-border) !important; }
.apply-error { margin: 14px 0 0; color: #9a3b32; }
.apply-done { margin-bottom: 48px; }
.apply-done p { max-width: 640px; color: var(--hourx-client-muted); line-height: 1.6; }
.apply-done__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.apply-done__actions a { display: inline-flex; align-items: center; color: #fff; background: var(--hourx-client-text); }
.apply-done__actions a.ghost { color: var(--hourx-client-text); background: transparent; box-shadow: inset 0 0 0 1px var(--hourx-client-border); }
@media (max-width: 720px) {
  .apply-hero { padding: 32px 16px; }
  .apply-sheet { width: calc(100% - 32px); margin-top: 24px; padding-bottom: 28px; }
  .apply-block, .apply-done { padding: 16px; }
  .apply-block--next { margin-top: 16px; }
  .apply-grid, .phone-pair, .apply-choices article { grid-template-columns: 1fr; }
  .same-mobile { grid-column: auto; }
  .apply-grid.align-fields > label > span { min-height: 0; }
  .span-2 { grid-column: auto; }
  .yes-no { justify-content: flex-start; }
  .apply-actions { justify-content: stretch; }
  .apply-actions button { width: 100%; }
}
</style>
