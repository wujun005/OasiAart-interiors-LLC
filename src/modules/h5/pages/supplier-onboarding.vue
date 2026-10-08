<template>
  <div class="h5-apply">
    <header class="h5-apply__bar">
      <button type="button" @click="goBack">
        <van-icon name="arrow-left" />
      </button>
      <strong>{{ t('h5.supplierOnboarding.kicker') }}</strong>
      <span />
    </header>

    <main v-if="done" class="h5-apply__done">
      <h1>{{ t('h5.supplierOnboarding.doneTitle') }}</h1>
      <p>{{ t('h5.supplierOnboarding.doneBody') }}</p>
      <button type="button" @click="goBack">{{ t('h5.supplierOnboarding.back') }}</button>
    </main>

    <form v-else class="h5-apply__form" @submit.prevent="submit">
      <header class="h5-apply__intro">
        <h1>{{ t('h5.supplierOnboarding.title') }}</h1>
        <p>{{ t('h5.supplierOnboarding.lead') }}</p>
        <small class="h5-apply__note">{{ t('h5.supplierOnboarding.requiredNote') }}</small>
      </header>

      <section>
        <h2>{{ t('h5.supplierOnboarding.company') }}</h2>
        <label>
          <span>{{ t('h5.supplierOnboarding.companyName') }}<i>*</i></span>
          <input v-model.trim="form.companyName" required />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.licenseNo') }}<i>*</i></span>
          <input v-model.trim="form.tradeLicenseNo" required />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.licenseExpiry') }}<i>*</i></span>
          <input v-model="form.licenseExpiry" type="date" :min="tomorrow" required />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.vat') }}</span>
          <input v-model.trim="form.vatTrn" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.years') }}</span>
          <input :value="wholeText(form.yearsInBusiness)" inputmode="numeric" @input="form.yearsInBusiness = wholeNumber(($event.target as HTMLInputElement).value)" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.address') }}<i>*</i></span>
          <input v-model.trim="form.officeAddress" required />
        </label>
      </section>

      <section>
        <h2>{{ t('h5.supplierOnboarding.contactTitle') }}</h2>
        <label>
          <span>{{ t('h5.supplierOnboarding.contact') }}<i>*</i></span>
          <input v-model.trim="form.contactPerson" required />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.email') }}<i>*</i></span>
          <input v-model.trim="form.email" type="email" required />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.mobile') }}<i>*</i></span>
          <div class="h5-apply__phone">
            <select v-model="form.mobileCode" :aria-label="t('h5.supplierOnboarding.dialCode')">
              <option v-for="item in PHONE_DIAL_OPTIONS" :key="item.value" :value="item.value">{{ phoneDialLabel(item, locale) }}</option>
            </select>
            <input v-model="form.mobile" inputmode="numeric" maxlength="15" placeholder="501234567" required />
          </div>
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.whatsapp') }}<i>*</i></span>
          <div class="h5-apply__phone">
            <select v-model="form.whatsappCode" :disabled="whatsappSame" :aria-label="t('h5.supplierOnboarding.dialCode')">
              <option v-for="item in PHONE_DIAL_OPTIONS" :key="`wa-${item.value}`" :value="item.value">{{ phoneDialLabel(item, locale) }}</option>
            </select>
            <input v-model="form.whatsapp" inputmode="numeric" maxlength="15" placeholder="501234567" :disabled="whatsappSame" required />
          </div>
          <span class="h5-apply__same"><input v-model="whatsappSame" type="checkbox" @change="syncWhatsapp" /> {{ t('h5.supplierOnboarding.sameAsMobile') }}</span>
        </label>
      </section>

      <section>
        <h2>{{ t('h5.supplierOnboarding.capacity') }}</h2>
        <div class="h5-apply__services">
          <span>{{ t('h5.supplierOnboarding.services') }}</span>
          <p v-if="categoriesLoading">{{ t('h5.supplierOnboarding.servicesLoading') }}</p>
          <p v-else-if="categoriesError" class="h5-apply__error">{{ categoriesError }}</p>
          <div v-else class="h5-apply__options">
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
        </div>
        <label v-if="otherSelected">
          <span>{{ t('h5.supplierOnboarding.serviceNote') }}</span>
          <textarea v-model="expectedServiceRemark" rows="3" maxlength="512" :placeholder="t('h5.supplierOnboarding.serviceNotePlaceholder')" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.workers') }}</span>
          <input :value="wholeText(form.totalAvailableWorkers)" inputmode="numeric" @input="form.totalAvailableWorkers = wholeNumber(($event.target as HTMLInputElement).value)" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.simultaneous') }}</span>
          <input :value="wholeText(form.maxSimultaneousOrders)" inputmode="numeric" @input="form.maxSimultaneousOrders = wholeNumber(($event.target as HTMLInputElement).value)" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.monthly') }}</span>
          <input :value="wholeText(form.monthlyCapacity)" inputmode="numeric" @input="form.monthlyCapacity = wholeNumber(($event.target as HTMLInputElement).value)" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.leadTime') }}</span>
          <input :value="wholeText(form.minLeadTimeHours)" inputmode="numeric" @input="form.minLeadTimeHours = wholeNumber(($event.target as HTMLInputElement).value)" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.workStart') }}<i>*</i></span>
          <input v-model="form.workStart" class="time-field" type="time" required @click="openTimePicker" />
        </label>
        <label>
          <span>{{ t('h5.supplierOnboarding.workEnd') }}<i>*</i></span>
          <input v-model="form.workEnd" class="time-field" type="time" required @click="openTimePicker" />
        </label>

        <article v-for="item in choices" :key="item.key">
          <div>
            <strong>{{ item.label }}<i>*</i></strong>
          </div>
          <div class="h5-apply__choice">
            <button type="button" :class="{ 'is-on': form[item.key] === 1 }" @click="setChoice(item.key, 1)">{{ t('h5.supplierOnboarding.yes') }}</button>
            <button type="button" :class="{ 'is-on': form[item.key] === 0 }" @click="setChoice(item.key, 0)">{{ t('h5.supplierOnboarding.no') }}</button>
          </div>
        </article>

        <label v-if="form.otherCommunityOnboarded === 1">
          <span>{{ t('h5.supplierOnboarding.note') }}<i>*</i></span>
          <textarea v-model="form.applyRenmark" rows="3" maxlength="512" :placeholder="t('h5.supplierOnboarding.notePlaceholder')" />
        </label>
      </section>

      <p v-if="errorText" class="h5-apply__error">{{ errorText }}</p>
      <button class="h5-apply__submit" type="submit" :disabled="saving">
        {{ saving ? t('h5.supplierOnboarding.submitting') : t('h5.supplierOnboarding.submit') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { categoryIdPayload, isOtherService, listServiceCategories, serviceCategoryLabel, submitOnboarding, type ServiceCategoryOption } from '@/modules/client/api/supplier-onboarding';
import { DEFAULT_PHONE_DIAL, PHONE_DIAL_OPTIONS, joinPhone, nationalNumberOk, phoneDialLabel } from '@/utils/phone-dial';

type Bit = 0 | 1 | null;
type ChoiceKey = 'saturdayService' | 'sundayService' | 'publicHolidayService' | 'emergencyService' | 'emaarOnboarded' | 'otherCommunityOnboarded';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const saving = ref(false);
const done = ref(false);
const errorText = ref('');
const categories = ref<ServiceCategoryOption[]>([]);
const categoriesLoading = ref(false);
const categoriesError = ref('');
const selectedIds = ref<string[]>([]);
const expectedServiceRemark = ref('');
const otherSelected = computed(() => categories.value.some((option) => selectedIds.value.includes(option.categoryId) && isOtherService(option)));

const form = reactive({
  companyName: '',
  tradeLicenseNo: '',
  licenseExpiry: '',
  vatTrn: '',
  yearsInBusiness: null as number | null,
  officeAddress: '',
  contactPerson: '',
  email: '',
  mobileCode: DEFAULT_PHONE_DIAL,
  mobile: '',
  whatsappCode: DEFAULT_PHONE_DIAL,
  whatsapp: '',
  totalAvailableWorkers: null as number | null,
  maxSimultaneousOrders: null as number | null,
  monthlyCapacity: null as number | null,
  minLeadTimeHours: null as number | null,
  workStart: '08:00',
  workEnd: '20:00',
  saturdayService: 1 as Bit,
  sundayService: 1 as Bit,
  publicHolidayService: 1 as Bit,
  emergencyService: null as Bit,
  emaarOnboarded: null as Bit,
  otherCommunityOnboarded: null as Bit,
  applyRenmark: '',
});

const whatsappSame = ref(false);
const syncWhatsapp = () => {
  if (!whatsappSame.value) return;
  form.whatsappCode = form.mobileCode;
  form.whatsapp = form.mobile;
};
watch(() => [form.mobile, form.mobileCode], syncWhatsapp);
const choices = computed(() => [
  { key: 'saturdayService' as const, label: t('h5.supplierOnboarding.saturday') },
  { key: 'sundayService' as const, label: t('h5.supplierOnboarding.sunday') },
  { key: 'publicHolidayService' as const, label: t('h5.supplierOnboarding.holiday') },
  { key: 'emergencyService' as const, label: t('h5.supplierOnboarding.emergency') },
  { key: 'emaarOnboarded' as const, label: t('h5.supplierOnboarding.emaar') },
  { key: 'otherCommunityOnboarded' as const, label: t('h5.supplierOnboarding.other') },
]);

const pad = (value: number) => String(value).padStart(2, '0');
const tomorrow = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
});

const openTimePicker = (event: MouseEvent) => {
  const input = event.currentTarget;
  if (!(input instanceof HTMLInputElement) || typeof input.showPicker !== 'function') return;
  try {
    input.showPicker();
  } catch {
    input.focus();
  }
};
const wholeText = (value: number | null) => (value == null ? '' : String(value));
const wholeNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  return digits ? Number(digits) : null;
};
const phoneOk = (value: string) => nationalNumberOk(value);
const emailOk = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
const chosen = (value: Bit) => value === 0 || value === 1;

const setChoice = (key: ChoiceKey, value: Bit) => {
  form[key] = value;
  if (key === 'otherCommunityOnboarded' && value !== 1) form.applyRenmark = '';
};

const toggleCategory = (option: ServiceCategoryOption) => {
  if (selectedIds.value.includes(option.categoryId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== option.categoryId);
    if (isOtherService(option)) expectedServiceRemark.value = '';
    return;
  }
  selectedIds.value = [...selectedIds.value, option.categoryId];
};

const loadCategories = async () => {
  categoriesLoading.value = true;
  categoriesError.value = '';
  try {
    categories.value = await listServiceCategories();
  } catch (error) {
    categories.value = [];
    categoriesError.value = error instanceof Error ? error.message : t('h5.supplierOnboarding.servicesRequired');
  } finally {
    categoriesLoading.value = false;
  }
};

onMounted(loadCategories);

const goBack = () => {
  if (window.history.length > 1) router.back();
  else router.push({ name: 'h5-home' });
};

const submit = async () => {
  const noteReady = form.otherCommunityOnboarded !== 1 || Boolean(form.applyRenmark.trim());
  const ready = Boolean(
    form.companyName
    && form.tradeLicenseNo
    && form.licenseExpiry
    && form.licenseExpiry >= tomorrow.value
    && form.officeAddress
    && form.contactPerson
    && emailOk(form.email)
    && phoneOk(form.mobile)
    && phoneOk(form.whatsapp)
    && form.workStart
    && form.workEnd
    && choices.value.every((item) => chosen(form[item.key]))
    && noteReady,
  );
  if (!ready) {
    if (form.licenseExpiry && form.licenseExpiry < tomorrow.value) errorText.value = t('h5.supplierOnboarding.licenseHint');
    else if ((form.mobile || form.whatsapp) && (!phoneOk(form.mobile) || !phoneOk(form.whatsapp))) errorText.value = t('h5.supplierOnboarding.phoneHint');
    else if (!noteReady) errorText.value = t('h5.supplierOnboarding.noteError');
    else errorText.value = t('h5.supplierOnboarding.requiredError');
    return;
  }
  saving.value = true;
  errorText.value = '';
  try {
    await submitOnboarding({
      companyName: form.companyName,
      tradeLicenseNo: form.tradeLicenseNo,
      licenseExpiry: form.licenseExpiry,
      vatTrn: form.vatTrn || null,
      officeAddress: form.officeAddress,
      contactPerson: form.contactPerson,
      mobile: joinPhone(form.mobileCode, form.mobile),
      whatsapp: joinPhone(form.whatsappCode, form.whatsapp),
      email: form.email,
      yearsInBusiness: form.yearsInBusiness == null || Number.isNaN(Number(form.yearsInBusiness)) ? null : Number(form.yearsInBusiness),
      totalAvailableWorkers: form.totalAvailableWorkers,
      maxSimultaneousOrders: form.maxSimultaneousOrders,
      monthlyCapacity: form.monthlyCapacity,
      minLeadTimeHours: form.minLeadTimeHours,
      workingHours: `${form.workStart}-${form.workEnd}`,
      weekendService: form.saturdayService === 1 || form.sundayService === 1 ? 1 : 0,
      saturdayService: form.saturdayService,
      sundayService: form.sundayService,
      publicHolidayService: form.publicHolidayService,
      emergencyService: form.emergencyService,
      emaarOnboarded: form.emaarOnboarded,
      otherCommunityOnboarded: form.otherCommunityOnboarded,
      applyRenmark: form.otherCommunityOnboarded === 1 ? form.applyRenmark.trim() : null,
      expectedServiceCategoryIds: selectedIds.value.length ? categoryIdPayload(selectedIds.value) : null,
      expectedServiceRemark: otherSelected.value && expectedServiceRemark.value.trim() ? expectedServiceRemark.value.trim() : null,
    });
    done.value = true;
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : t('h5.supplierOnboarding.requiredError');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.h5-apply {
  min-height: 100vh;
  background: #f4f7fb;
  color: #05152b;
}
.h5-apply__bar {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 52px;
  padding: 0 8px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e6edf5;
}
.h5-apply__bar strong {
  text-align: center;
  font-size: 15px;
}
.h5-apply__bar button {
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  color: #05152b;
  font-size: 18px;
}
.h5-apply__form,
.h5-apply__done {
  padding: 18px 16px 32px;
}
.h5-apply__intro h1,
.h5-apply__done h1,
.h5-apply section h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
}
.h5-apply__intro p,
.h5-apply__note { display: block; margin-top: 8px; color: #74685a; font-size: 12px; }
.h5-apply__same { display: flex; align-items: center; gap: 8px; margin-top: 8px; color: #74685a; font-size: 13px; }
.h5-apply__same input { width: auto; }
.h5-apply__intro p,
.h5-apply__done p {
  margin: 8px 0 0;
  color: #5d6b7c;
  font-size: 14px;
  line-height: 1.5;
}
.h5-apply section {
  margin-top: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
  background: #fff;
  border: 1px solid #e6edf5;
  border-radius: 16px;
}
.h5-apply label,
.h5-apply article {
  display: grid;
  gap: 6px;
}
.h5-apply label > span,
.h5-apply article strong {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: #314255;
  font-size: 13px;
  font-weight: 750;
}
.h5-apply i {
  color: #c2412d;
  font-style: normal;
}
.h5-apply em {
  color: #8b97a6;
  font-size: 12px;
  font-style: normal;
  font-weight: 650;
}
.h5-apply .time-field { position: relative; padding-right: 40px; cursor: pointer; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2305152b' stroke-width='1.8'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3Cpath d='M12 8v4.2l2.4 1.6'/%3E%3C/svg%3E") no-repeat right 14px center; }
.h5-apply .time-field::-webkit-calendar-picker-indicator { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; cursor: pointer; background: transparent; opacity: 0; }
.h5-apply input,
.h5-apply textarea {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #d7e2ee;
  border-radius: 12px;
  background: #fff;
  color: #05152b;
  font: inherit;
  font-size: 16px;
}
.h5-apply textarea {
  min-height: 88px;
  resize: vertical;
}
.h5-apply small {
  color: #8a5a2b;
  font-size: 12px;
  line-height: 1.4;
}
.h5-apply__phone {
  display: flex;
  align-items: center;
  gap: 8px;
}
.h5-apply__phone select {
  flex: 0 0 auto;
  max-width: 46%;
  height: 44px;
  padding: 0 22px 0 10px;
  border: 0;
  border-radius: 12px;
  background: #05152b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23ffffff' d='M1 1.2 6 6.2 11 1.2'/%3E%3C/svg%3E") no-repeat right 8px center;
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 750;
  appearance: none;
}
.h5-apply__phone input {
  min-width: 0;
}
.h5-apply article {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding-top: 4px;
}
.h5-apply article small {
  display: block;
  margin-top: 4px;
  color: #7b8796;
  font-weight: 500;
}
.h5-apply__choice {
  display: flex;
  gap: 6px;
}
.h5-apply__choice button,
.h5-apply__submit,
.h5-apply__done button {
  border: 0;
  font: inherit;
  font-weight: 750;
}
.h5-apply__choice button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d7e2ee;
  border-radius: 999px;
  background: #fff;
  color: #314255;
}
.h5-apply__choice button.is-on {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
}
.h5-apply__services {
  display: grid;
  gap: 8px;
}
.h5-apply__services > span {
  color: #314255;
  font-size: 13px;
  font-weight: 750;
}
.h5-apply__services > small {
  color: #7b8796;
  font-weight: 500;
}
.h5-apply__options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.h5-apply__options button {
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid #d7e2ee;
  border-radius: 999px;
  background: #fff;
  color: #314255;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}
.h5-apply__options button.is-on {
  border-color: #05152b;
  background: #05152b;
  color: #fff;
}
.h5-apply__error {
  margin: 12px 0 0;
  color: #9a3b32;
  font-size: 13px;
}
.h5-apply__submit,
.h5-apply__done button {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border-radius: 14px;
  background: #05152b;
  color: #fff;
  font-size: 16px;
}
.h5-apply__submit:disabled {
  opacity: 0.65;
}
</style>
