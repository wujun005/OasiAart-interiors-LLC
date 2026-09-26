<template>
  <div class="apply">
    <header class="apply-hero">
      <p>HourX Supplier</p>
      <h1>{{ copy.title }}</h1>
      <span>{{ copy.lead }}</span>
    </header>

    <div v-if="done" class="apply-sheet apply-done">
      <h2>{{ copy.doneTitle }}</h2>
      <p>{{ login.existing ? copy.doneExisting : copy.doneNew }}</p>
      <dl class="apply-login">
        <div>
          <dt>{{ copy.accountLabel }}</dt>
          <dd>{{ login.account }}</dd>
        </div>
        <div v-if="login.password">
          <dt>{{ copy.passwordLabel }}</dt>
          <dd>{{ login.password }}</dd>
        </div>
      </dl>
      <div class="apply-done__actions">
        <a href="/admin/login">{{ copy.signIn }}</a>
        <RouterLink class="ghost" :to="{ name: 'join-us' }">{{ copy.backJoin }}</RouterLink>
      </div>
    </div>

    <form v-else class="apply-sheet" @submit.prevent="submit">
      <div class="apply-steps" role="tablist">
        <button type="button" :class="{ 'is-active': step === 1 }" @click="step = 1">01 {{ copy.stepCompany }}</button>
        <button type="button" :class="{ 'is-active': step === 2 }" @click="goCapacity">02 {{ copy.stepCapacity }}</button>
      </div>

      <p class="apply-legend"><i class="req">*</i> {{ copy.requiredHint }}</p>

      <section v-show="step === 1" class="apply-block">
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
                :placeholder="copy.datePlaceholder"
              />
            </el-config-provider>
          </label>
          <label><span>{{ copy.vat }}<em class="opt">{{ copy.optional }}</em></span><input v-model="form.vatTrn" /></label>
          <label><span>{{ copy.years }}<em class="opt">{{ copy.optional }}</em></span><el-input-number v-model="form.yearsInBusiness" :min="0" controls-position="right" /></label>
          <label class="span-2"><span>{{ copy.address }}<i class="req">*</i></span><input v-model="form.officeAddress" required /></label>
          <label><span>{{ copy.contact }}<i class="req">*</i></span><input v-model="form.contactPerson" required /></label>
          <label><span>{{ copy.email }}<i class="req">*</i></span><input v-model="form.email" type="email" required /></label>
          <label><span>{{ copy.mobile }}<i class="req">*</i></span><input v-model="form.mobile" placeholder="+971" required /></label>
          <label><span>{{ copy.whatsapp }}<i class="req">*</i></span><input v-model="form.whatsapp" placeholder="+971" required /></label>
        </div>

        <div class="apply-choices">
          <article v-for="item in companyChoices" :key="item.key">
            <div>
              <strong>{{ item.label }}<i class="req">*</i></strong>
              <small v-if="item.hint">{{ item.hint }}</small>
            </div>
            <div class="yes-no">
              <button type="button" :class="{ 'is-on': form[item.key] === 1 }" @click="form[item.key] = 1">{{ copy.yes }}</button>
              <button type="button" :class="{ 'is-on': form[item.key] === 0 }" @click="setNo(item.key)">{{ copy.no }}</button>
            </div>
            <div v-if="item.file && form[item.key] === 1" class="policy-files">
              <label class="file-pick" :class="{ 'is-done': fileList(item.file).length }">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  :disabled="uploadingKey === item.file"
                  @change="onFiles(item.file, $event)"
                />
                <span class="file-pick__btn">
                  {{ uploadingKey === item.file ? copy.uploading : (fileList(item.file).length ? copy.addFiles : copy.upload) }}
                  <i v-if="!fileList(item.file).length && uploadingKey !== item.file" class="req">*</i>
                </span>
                <span class="file-pick__meta">{{ copy.fileTypes }}</span>
              </label>
              <ul v-if="fileList(item.file).length" class="file-list">
                <li v-for="(file, index) in fileList(item.file)" :key="`${file.url}-${index}`">
                  <span>{{ file.name }}</span>
                  <button type="button" @click="removeFile(item.file, index)">{{ copy.removeFile }}</button>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section v-show="step === 2" class="apply-block">
        <h2>{{ copy.stepCapacity }}</h2>
        <p v-if="catalogError" class="apply-error">{{ catalogError }}</p>
        <div class="apply-grid">
          <label><span>{{ copy.workers }}<em class="opt">{{ copy.optional }}</em></span><el-input-number v-model="form.totalAvailableWorkers" :min="0" controls-position="right" /></label>
          <label><span>{{ copy.simultaneous }}<em class="opt">{{ copy.optional }}</em></span><el-input-number v-model="form.maxSimultaneousOrders" :min="0" controls-position="right" /></label>
          <label><span>{{ copy.monthly }}<em class="opt">{{ copy.optional }}</em></span><el-input-number v-model="form.monthlyCapacity" :min="0" controls-position="right" /></label>
          <label><span>{{ copy.leadTime }}<em class="opt">{{ copy.optional }}</em></span><el-input-number v-model="form.minLeadTimeHours" :min="0" controls-position="right" /></label>
          <label><span>{{ copy.workStart }}<i class="req">*</i></span><input v-model="form.workStart" type="time" required /></label>
          <label><span>{{ copy.workEnd }}<i class="req">*</i></span><input v-model="form.workEnd" type="time" required /></label>
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
            <label v-if="item.count && form[item.key] === 1" class="count-field">
              <span>{{ copy.count }}<i class="req">*</i></span>
              <el-input-number v-model="form[item.count]" :min="1" controls-position="right" />
            </label>
          </article>
        </div>

        <h3>{{ copy.services }}<i class="req">*</i></h3>
        <p class="apply-muted">{{ copy.servicesHint }}</p>
        <div v-if="catalogLoading" class="apply-muted">{{ copy.loading }}</div>
        <p v-else-if="!visibleGroups.length" class="apply-muted">{{ copy.servicesEmpty }}</p>
        <div v-for="group in visibleGroups" :key="group.categoryId" class="service-group">
          <h4>{{ pickName(group.categoryName, group.nameI18n) }}</h4>
          <label
            v-for="service in visibleServices(group)"
            :key="service.spuId"
            class="service-row"
            :class="{ 'is-on': selected[service.spuId] != null }"
          >
            <input type="checkbox" :checked="selected[service.spuId] != null" @change="toggleService(service.spuId)" />
            <span class="service-row__name">{{ pickName(service.spuName, service.nameI18n) }}</span>
            <span v-if="selected[service.spuId] != null" class="service-count" @click.prevent>
              {{ copy.serviceWorkers }}
              <el-input-number v-model="selected[service.spuId]" :min="1" controls-position="right" />
            </span>
          </label>
        </div>

        <h3>{{ copy.areas }}<i class="req">*</i></h3>
        <div class="area-grid">
          <button
            v-for="area in areas"
            :key="area.id"
            type="button"
            :class="{ 'is-on': areaIds.includes(area.id) }"
            @click="toggleArea(area.id)"
          >
            {{ area.name }}
          </button>
        </div>
      </section>

      <p v-if="errorText" class="apply-error">{{ errorText }}</p>
      <footer class="apply-actions">
        <button v-if="step === 2" type="button" class="ghost" @click="step = 1">{{ copy.back }}</button>
        <button v-if="step === 1" type="button" class="primary" @click="goCapacity">{{ copy.next }}</button>
        <button v-else class="primary" type="submit" :disabled="saving">{{ saving ? copy.saving : copy.submit }}</button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import elLocaleEn from 'element-plus/es/locale/lang/en';
import elLocaleZhCn from 'element-plus/es/locale/lang/zh-cn';
import {
  fetchOnboardingAreas,
  fetchOnboardingServices,
  submitOnboarding,
  uploadOnboardingFile,
  type OnboardingArea,
  type OnboardingServiceGroup,
} from '@/modules/client/api/supplier-onboarding';

type Bit = 0 | 1 | null;
type ChoiceKey =
  | 'publicLiabilityInsurance'
  | 'employeeInsurance'
  | 'taxInvoiceAvailable'
  | 'ownTransportation'
  | 'ownEquipment'
  | 'weekendService'
  | 'publicHolidayService'
  | 'sameDayBooking'
  | 'emergencyService'
  | 'femaleStaffAvailable'
  | 'maleStaffAvailable';

const { locale } = useI18n({ useScope: 'global' });
const isZh = computed(() => locale.value.startsWith('zh'));
const datePickerLocale = computed(() => (isZh.value ? elLocaleZhCn : elLocaleEn));
const step = ref(1);
const saving = ref(false);
const done = ref(false);
const login = reactive({ account: '', password: '', existing: false });
const errorText = ref('');
const catalogError = ref('');
const catalogLoading = ref(false);
const groups = ref<OnboardingServiceGroup[]>([]);
const areas = ref<OnboardingArea[]>([]);
const areaIds = ref<number[]>([]);
const selected = reactive<Record<number, number>>({});
type PolicyFile = { name: string; url: string };
type PolicyKey = 'publicLiabilityInsuranceFile' | 'employeeInsuranceFile';

const POLICY_FILE_LIMIT = 20;
const POLICY_FILE_BYTES = 20 * 1024 * 1024;

const files = reactive<Record<PolicyKey, PolicyFile[]>>({
  publicLiabilityInsuranceFile: [],
  employeeInsuranceFile: [],
});
const uploadingKey = ref<PolicyKey | null>(null);

const form = reactive({
  companyName: '',
  tradeLicenseNo: '',
  licenseExpiry: '',
  vatTrn: '',
  officeAddress: '',
  contactPerson: '',
  mobile: '',
  whatsapp: '',
  email: '',
  yearsInBusiness: null as number | null,
  publicLiabilityInsurance: null as Bit,
  employeeInsurance: null as Bit,
  taxInvoiceAvailable: null as Bit,
  ownTransportation: null as Bit,
  ownEquipment: null as Bit,
  totalAvailableWorkers: null as number | null,
  maxSimultaneousOrders: null as number | null,
  monthlyCapacity: null as number | null,
  minLeadTimeHours: null as number | null,
  workStart: '08:00',
  workEnd: '18:00',
  weekendService: null as Bit,
  publicHolidayService: null as Bit,
  sameDayBooking: null as Bit,
  emergencyService: null as Bit,
  femaleStaffAvailable: null as Bit,
  femaleStaffCount: null as number | null,
  maleStaffAvailable: null as Bit,
  maleStaffCount: null as number | null,
});

const copy = computed(() =>
  isZh.value
    ? {
        title: '供应商入驻问卷',
        lead: '填写公司资料和服务能力，提交后进入审核。',
        stepCompany: '公司资料',
        stepCapacity: '服务能力',
        companyName: '公司名称',
        licenseNo: '营业执照号',
        licenseExpiry: '执照到期日',
        datePlaceholder: '请选择日期',
        vat: 'VAT / TRN',
        years: '经营年限',
        address: '公司地址',
        contact: '联系人',
        email: '邮箱',
        mobile: '电话',
        whatsapp: 'WhatsApp',
        yes: '是',
        no: '否',
        count: '人数',
        workers: '可派员工数',
        simultaneous: '最大同时订单',
        monthly: '月订单容量',
        leadTime: '最短提前时间（小时）',
        workStart: '工作开始',
        workEnd: '工作结束',
        services: '可提供服务',
        servicesHint: '勾选你们能提供的服务。',
        servicesEmpty: '暂时没有可勾选的服务。',
        serviceWorkers: '人数',
        areas: '迪拜服务区域',
        loading: '正在加载服务和区域',
        next: '下一步',
        back: '上一步',
        submit: '提交审核',
        saving: '提交中',
        doneTitle: '申请已提交',
        doneNew: '我们已收到入驻资料。请使用下面的账号登录供应商后台。',
        doneExisting: '我们已收到入驻资料。该手机号已有后台账号，请使用原来的密码登录。',
        accountLabel: '账号',
        passwordLabel: '初始密码',
        signIn: '去登录',
        backJoin: '返回合作页',
        requiredHint: '必填',
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
        serviceRequired: '请至少勾选一项服务并填写人数',
        areaRequired: '请至少选择一个服务区域',
        phone: '电话请带国家区号，例如 +971',
      }
    : {
        title: 'Supplier onboarding',
        lead: 'Share your company details and capacity. We review every application.',
        stepCompany: 'Company',
        stepCapacity: 'Capacity',
        companyName: 'Company Name',
        licenseNo: 'Trade License No.',
        licenseExpiry: 'License Expiry',
        datePlaceholder: 'Select a date',
        vat: 'VAT / TRN',
        years: 'Years in Business',
        address: 'Office Address',
        contact: 'Contact Person',
        email: 'Email',
        mobile: 'Mobile',
        whatsapp: 'WhatsApp',
        yes: 'Yes',
        no: 'No',
        count: 'Number',
        workers: 'Total Available Workers',
        simultaneous: 'Maximum Simultaneous Orders',
        monthly: 'Monthly Capacity',
        leadTime: 'Minimum Lead Time (hours)',
        workStart: 'Working Hours Start',
        workEnd: 'Working Hours End',
        services: 'Services Provided',
        servicesHint: 'Tick the services you can provide.',
        servicesEmpty: 'No services are available to select yet.',
        serviceWorkers: 'Workers',
        areas: 'Dubai Service Areas',
        loading: 'Loading services and areas',
        next: 'Continue',
        back: 'Back',
        submit: 'Submit for review',
        saving: 'Submitting',
        doneTitle: 'Application submitted',
        doneNew: 'We have your onboarding file. Use this account to sign in to the supplier console.',
        doneExisting: 'We have your onboarding file. This mobile number already has a supplier account. Sign in with your current password.',
        accountLabel: 'Account',
        passwordLabel: 'Initial password',
        signIn: 'Sign in',
        backJoin: 'Back to partners',
        requiredHint: 'Required',
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
        serviceRequired: 'Select at least one service and enter the headcount',
        areaRequired: 'Select at least one service area',
        phone: 'Include the country code, for example +971',
      },
);

const companyChoices = computed(() => [
  { key: 'publicLiabilityInsurance' as const, label: isZh.value ? '公众责任保险' : 'Public Liability Insurance', hint: copy.value.insuranceFile, file: 'publicLiabilityInsuranceFile' as const },
  { key: 'employeeInsurance' as const, label: isZh.value ? '员工保险' : 'Employee Insurance', hint: copy.value.insuranceFile, file: 'employeeInsuranceFile' as const },
  { key: 'taxInvoiceAvailable' as const, label: isZh.value ? '可开税务发票' : 'Tax Invoice Available' },
  { key: 'ownTransportation' as const, label: isZh.value ? '自有车辆' : 'Own Transportation' },
  { key: 'ownEquipment' as const, label: isZh.value ? '自有设备' : 'Own Equipment' },
]);

const capacityChoices = computed(() => [
  { key: 'weekendService' as const, label: isZh.value ? '周末服务' : 'Weekend Service' },
  { key: 'publicHolidayService' as const, label: isZh.value ? '公共假期服务' : 'Public Holiday Service' },
  { key: 'sameDayBooking' as const, label: isZh.value ? '当日预约' : 'Same-Day Booking' },
  { key: 'emergencyService' as const, label: isZh.value ? '紧急服务' : 'Emergency Service' },
  { key: 'femaleStaffAvailable' as const, label: isZh.value ? '女性员工' : 'Female Staff Available', count: 'femaleStaffCount' as const },
  { key: 'maleStaffAvailable' as const, label: isZh.value ? '男性员工' : 'Male Staff Available', count: 'maleStaffCount' as const },
]);

const visibleGroups = computed(() => groups.value.filter((group) => group.available !== false && visibleServices(group).length));

const pickName = (fallback: string, names?: OnboardingServiceGroup['nameI18n']) => {
  if (isZh.value) return names?.['zh-CN'] || names?.zh || fallback;
  return names?.en || fallback;
};

const visibleServices = (group: OnboardingServiceGroup) => (group.services || []).filter((item) => item.available !== false);

const setNo = (key: ChoiceKey) => {
  form[key] = 0;
  if (key === 'publicLiabilityInsurance') files.publicLiabilityInsuranceFile = [];
  if (key === 'employeeInsurance') files.employeeInsuranceFile = [];
};

const fileList = (key: PolicyKey) => files[key];

const removeFile = (key: PolicyKey, index: number) => {
  files[key].splice(index, 1);
};

const onFiles = async (key: PolicyKey, event: Event) => {
  const input = event.target as HTMLInputElement;
  const picked = Array.from(input.files || []);
  input.value = '';
  if (!picked.length) return;
  const room = POLICY_FILE_LIMIT - files[key].length;
  if (room <= 0) {
    errorText.value = copy.value.fileLimit;
    return;
  }
  const batch = picked.slice(0, room);
  if (batch.some((file) => file.size > POLICY_FILE_BYTES)) {
    errorText.value = copy.value.fileSize;
    return;
  }
  if (picked.length > room) errorText.value = copy.value.fileLimit;
  else errorText.value = '';
  uploadingKey.value = key;
  try {
    for (const file of batch) {
      const url = await uploadOnboardingFile(file);
      files[key].push({ name: file.name, url });
    }
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : copy.value.required;
  } finally {
    uploadingKey.value = null;
  }
};

const toggleService = (spuId: number) => {
  if (selected[spuId] != null) delete selected[spuId];
  else selected[spuId] = 1;
};

const toggleArea = (id: number) => {
  areaIds.value = areaIds.value.includes(id) ? areaIds.value.filter((item) => item !== id) : [...areaIds.value, id];
};

const companyReady = () => {
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());
  const phoneOk = /^\+?[0-9][0-9\s()-]{6,}$/.test(form.mobile.trim()) && /^\+?[0-9][0-9\s()-]{6,}$/.test(form.whatsapp.trim());
  const bits = companyChoices.value.every((item) => form[item.key] === 0 || form[item.key] === 1);
  const liabilityOk = form.publicLiabilityInsurance !== 1 || files.publicLiabilityInsuranceFile.length > 0;
  const employeeOk = form.employeeInsurance !== 1 || files.employeeInsuranceFile.length > 0;
  return Boolean(
    form.companyName.trim()
    && form.tradeLicenseNo.trim()
    && form.licenseExpiry
    && form.officeAddress.trim()
    && form.contactPerson.trim()
    && emailOk
    && phoneOk
    && bits
    && liabilityOk
    && employeeOk,
  );
};

const goCapacity = () => {
  if (!companyReady()) {
    errorText.value = form.mobile.trim().startsWith('+') || !form.mobile.trim() ? copy.value.required : copy.value.phone;
    if (form.publicLiabilityInsurance === 1 && !files.publicLiabilityInsuranceFile.length) errorText.value = copy.value.insuranceFile;
    if (form.employeeInsurance === 1 && !files.employeeInsuranceFile.length) errorText.value = copy.value.insuranceFile;
    return;
  }
  errorText.value = '';
  step.value = 2;
};

const buildServices = () => {
  const payload: Array<{ categoryId: number; items: Array<{ spuId: number; workerCount: number }> }> = [];
  const names: string[] = [];
  groups.value.forEach((group) => {
    const items = visibleServices(group)
      .filter((service) => selected[service.spuId] != null && selected[service.spuId] > 0)
      .map((service) => {
        names.push(pickName(service.spuName, service.nameI18n));
        return { spuId: service.spuId, workerCount: selected[service.spuId] };
      });
    if (items.length) payload.push({ categoryId: group.categoryId, items });
  });
  return { payload, names };
};

const submit = async () => {
  const services = buildServices();
  const chosenAreas = areas.value.filter((area) => areaIds.value.includes(area.id));
  const bits = capacityChoices.value.every((item) => form[item.key] === 0 || form[item.key] === 1);
  const femaleOk = form.femaleStaffAvailable !== 1 || (form.femaleStaffCount || 0) > 0;
  const maleOk = form.maleStaffAvailable !== 1 || (form.maleStaffCount || 0) > 0;
  if (!bits || !femaleOk || !maleOk || !form.workStart || !form.workEnd) {
    errorText.value = copy.value.required;
    return;
  }
  if (!services.payload.length) {
    errorText.value = copy.value.serviceRequired;
    return;
  }
  if (!chosenAreas.length) {
    errorText.value = copy.value.areaRequired;
    return;
  }
  saving.value = true;
  errorText.value = '';
  try {
    const result = await submitOnboarding({
      companyName: form.companyName.trim(),
      tradeLicenseNo: form.tradeLicenseNo.trim(),
      licenseExpiry: form.licenseExpiry,
      vatTrn: form.vatTrn.trim() || null,
      officeAddress: form.officeAddress.trim(),
      contactPerson: form.contactPerson.trim(),
      mobile: form.mobile.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      yearsInBusiness: form.yearsInBusiness,
      publicLiabilityInsurance: form.publicLiabilityInsurance,
      publicLiabilityInsuranceFile: form.publicLiabilityInsurance === 1 ? files.publicLiabilityInsuranceFile.map((file) => file.url) : null,
      employeeInsurance: form.employeeInsurance,
      employeeInsuranceFile: form.employeeInsurance === 1 ? files.employeeInsuranceFile.map((file) => file.url) : null,
      taxInvoiceAvailable: form.taxInvoiceAvailable,
      ownTransportation: form.ownTransportation,
      ownEquipment: form.ownEquipment,
      servicesProvided: services.names.join(', '),
      dubaiServiceAreas: chosenAreas.map((area) => area.name).join(', '),
      totalAvailableWorkers: form.totalAvailableWorkers,
      maxSimultaneousOrders: form.maxSimultaneousOrders,
      workingHours: `${form.workStart}-${form.workEnd}`,
      weekendService: form.weekendService,
      publicHolidayService: form.publicHolidayService,
      sameDayBooking: form.sameDayBooking,
      emergencyService: form.emergencyService,
      minLeadTimeHours: form.minLeadTimeHours,
      femaleStaffAvailable: form.femaleStaffAvailable,
      femaleStaffCount: form.femaleStaffAvailable === 1 ? form.femaleStaffCount : 0,
      maleStaffAvailable: form.maleStaffAvailable,
      maleStaffCount: form.maleStaffAvailable === 1 ? form.maleStaffCount : 0,
      monthlyCapacity: form.monthlyCapacity,
      services: services.payload,
      areaIds: chosenAreas.map((area) => area.id),
    });
    login.account = result.account || form.mobile.trim();
    login.password = result.account ? result.password : '123456';
    login.existing = result.account ? result.existing : false;
    done.value = true;
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : copy.value.required;
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  catalogLoading.value = true;
  try {
    const [serviceList, areaList] = await Promise.all([fetchOnboardingServices(), fetchOnboardingAreas()]);
    groups.value = serviceList;
    areas.value = areaList;
  } catch (error) {
    catalogError.value = error instanceof Error ? error.message : copy.value.required;
  } finally {
    catalogLoading.value = false;
  }
});
</script>

<style scoped>
.apply, .apply *, .apply *::before, .apply *::after { box-sizing: border-box; }
.apply { min-height: 100%; background: #f4f1eb; color: #05152b; }
.apply-hero { padding: 36px 28px 28px; background: #05152b; color: #f7f1e6; }
.apply-hero p { margin: 0 0 8px; color: #e8c27a; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
.apply-hero h1 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 40px; font-weight: 500; letter-spacing: -.03em; }
.apply-hero span { display: block; max-width: 640px; margin-top: 10px; color: #d9d1c5; }
.apply-sheet { width: min(980px, calc(100% - 32px)); margin: -18px auto 48px; padding: 22px; background: #fffdf8; border: 1px solid #e4d8c6; border-radius: 22px; }
.apply-steps { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 22px; }
.apply-steps button, .area-grid button, .yes-no button, .apply-actions button, .file-pick { font: inherit; }
.apply-steps button { height: 44px; border: 1px solid #eadfce; border-radius: 12px; background: #fff; color: #5c564c; cursor: pointer; }
.apply-steps button.is-active { color: #05152b; background: #f4f1eb; border-color: #05152b; font-weight: 700; }
.apply-legend { margin: 0 0 16px; color: #5c564c; font-size: 13px; font-weight: 650; }
.apply-block h2, .apply-done h2 { margin: 0 0 8px; font-family: Georgia, "Times New Roman", serif; font-size: 32px; font-weight: 500; }
.apply-block h3 { margin: 22px 0 10px; font-size: 16px; }
.req { color: #c2412d; font-style: normal; font-weight: 800; letter-spacing: 0; text-transform: none; }
.opt { color: #8a8175; font-size: 12px; font-style: normal; font-weight: 650; letter-spacing: 0; text-transform: none; }
.apply-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; }
.apply-grid label, .service-group, .apply-choices article { display: grid; gap: 6px; min-width: 0; }
.apply-grid label { color: #5c564c; font-size: 13px; font-weight: 700; letter-spacing: 0; text-transform: none; }
.apply-grid label > span, .count-field > span { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; line-height: 1.35; }
.apply :deep(.el-input-number) { width: 100%; }
.apply :deep(.apply-date.el-date-editor) { width: 100%; height: 40px; }
.apply :deep(.apply-date .el-input__wrapper) { height: 40px; padding: 0 12px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #e6dccb inset; }
.apply :deep(.apply-date .el-input__inner) { color: #05152b; font-size: 14px; font-weight: 500; }
.apply :deep(.el-input__inner) { text-transform: none; }
.apply-grid > label > input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #e6dccb; border-radius: 10px; background: #fff; color: #05152b; font: inherit; font-size: 14px; font-weight: 500; letter-spacing: 0; text-transform: none; }
.span-2 { grid-column: span 2; }
.apply-choices { display: grid; gap: 10px; margin-top: 18px; }
.apply-choices article { grid-template-columns: minmax(0, 1fr) auto; align-items: center; padding: 14px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.apply-choices article > div:first-child { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
.apply-choices strong { color: #05152b; font-size: 14px; letter-spacing: 0; text-transform: none; }
.apply-choices strong .req { margin-left: 2px; }
.apply-choices small, .apply-muted { color: #7a7166; font-size: 12px; font-weight: 500; letter-spacing: 0; text-transform: none; }
.yes-no { display: flex; gap: 6px; }
.yes-no button, .area-grid button { height: 34px; padding: 0 12px; border: 1px solid #eadfce; border-radius: 999px; background: #fff; cursor: pointer; }
.yes-no button.is-on, .area-grid button.is-on { color: #f7f1e6; background: #05152b; border-color: #05152b; }
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
.count-field { grid-column: 1 / -1; display: grid; gap: 6px; color: #5c564c; font-size: 13px; font-weight: 700; letter-spacing: 0; text-transform: none; }
.service-group { display: grid; gap: 8px; margin-top: 14px; }
.service-group h4 { margin: 0; color: #05152b; font-size: 14px; }
.service-row { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 8px 12px; border: 1px solid #eadfce; border-radius: 12px; background: #fff; color: #05152b; font-size: 14px; font-weight: 500; letter-spacing: 0; text-transform: none; cursor: pointer; }
.service-row.is-on { border-color: #05152b; background: #f4f1eb; }
.service-row input { width: 16px; height: 16px; margin: 0; flex: 0 0 auto; accent-color: #05152b; }
.service-row__name { flex: 1; min-width: 0; }
.service-count { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; color: #5c564c; font-size: 12px; font-weight: 700; }
.service-count :deep(.el-input-number) { width: 120px; }
.area-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.apply-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.apply-actions button, .apply-done a { height: 44px; padding: 0 18px; border-radius: 12px; border: 0; cursor: pointer; font-weight: 700; text-decoration: none; }
.primary { color: #f7f1e6; background: #05152b; }
.ghost { color: #05152b; background: transparent; border: 1px solid #eadfce !important; }
.apply-error { margin: 14px 0 0; color: #9a3b32; }
.apply-done { padding: 36px 28px 32px; }
.apply-done p { max-width: 640px; color: #5c564c; line-height: 1.6; }
.apply-login { display: grid; gap: 10px; max-width: 420px; margin: 18px 0 22px; }
.apply-login div { display: grid; gap: 4px; padding: 12px 14px; border: 1px solid #eadfce; border-radius: 12px; background: #fff; }
.apply-login dt { color: #8a8175; font-size: 12px; font-weight: 700; }
.apply-login dd { margin: 0; color: #05152b; font-size: 18px; font-weight: 700; word-break: break-all; }
.apply-done__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.apply-done__actions a { display: inline-flex; align-items: center; color: #f7f1e6; background: #05152b; }
.apply-done__actions a.ghost { color: #05152b; background: transparent; box-shadow: inset 0 0 0 1px #eadfce; }
@media (max-width: 720px) {
  .apply-hero h1 { font-size: 32px; }
  .apply-grid, .apply-choices article { grid-template-columns: 1fr; }
  .service-row { align-items: flex-start; flex-wrap: wrap; }
  .span-2 { grid-column: auto; }
}
</style>
