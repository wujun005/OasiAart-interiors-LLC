<template>
  <section class="address-manager">
    <header class="address-manager__header">
      <div>
        <h3>{{ locale === 'zh' ? '联系信息与服务地址' : 'Contact & Service Addresses' }}</h3>
        <p>{{ locale === 'zh' ? '联系人和服务地址在这里统一维护，下单时直接选择。' : 'Manage contacts and service addresses here, then select one at checkout.' }}</p>
      </div>
      <button class="address-manager__add" type="button" @click="openCreate">
        <span aria-hidden="true">+</span>
        {{ locale === 'zh' ? '新增地址' : 'Add Address' }}
      </button>
    </header>

    <p v-if="message" class="address-manager__message" :class="{ 'is-error': messageType === 'error' }" role="status">
      {{ message }}
    </p>

    <div v-if="loading" class="address-manager__state">
      {{ t('client.orderConfirm.addressBook.loading') }}
    </div>
    <div v-else-if="loadFailed" class="address-manager__state address-manager__state--error">
      <span>{{ t('client.orderConfirm.addressBook.listFailed') }}</span>
      <button type="button" @click="loadAddresses">{{ locale === 'zh' ? '重试' : 'Retry' }}</button>
    </div>
    <div v-else-if="addresses.length" class="address-manager__list">
      <article v-for="item in addresses" :key="item.id" class="address-manager__card">
        <div class="address-manager__tags">
          <span class="address-manager__category">
            <AddressCategoryIcon :category="normalizeCategory(item.category)" />
            {{ categoryLabel(item.category) }}
          </span>
          <span v-if="item.isDefault" class="is-default">{{ t('client.orderConfirm.addressBook.defaultTag') }}</span>
        </div>
        <strong>{{ getAddressFullName(item) }}</strong>
        <p>{{ formatPhone(item) }}</p>
        <p class="address-manager__address">{{ formatAddress(item) }}</p>
        <small v-if="item.additionalNotes">{{ item.additionalNotes }}</small>
        <div class="address-manager__actions">
          <button type="button" @click="openEdit(item)">{{ t('client.orderConfirm.addressBook.edit') }}</button>
          <button class="is-danger" type="button" :disabled="deletingId === item.id" @click="removeAddress(item)">
            {{ deletingId === item.id ? (locale === 'zh' ? '删除中…' : 'Deleting…') : t('client.orderConfirm.addressBook.delete') }}
          </button>
        </div>
      </article>
    </div>
    <div v-else class="address-manager__state address-manager__state--empty">
      <strong>{{ locale === 'zh' ? '还没有保存的联系地址' : 'No saved contact addresses yet' }}</strong>
      <span>{{ locale === 'zh' ? '新增后即可在订单确认页直接选择。' : 'Add one to select it directly during checkout.' }}</span>
      <button type="button" @click="openCreate">{{ locale === 'zh' ? '新增地址' : 'Add Address' }}</button>
    </div>

    <Teleport to="body">
      <div v-if="editorVisible" class="address-editor" role="dialog" aria-modal="true" :aria-label="editorTitle" @click.self="closeEditor">
        <form class="address-editor__panel" @submit.prevent="saveAddress">
          <header>
            <div>
              <span>HOURX HOME</span>
              <h3>{{ editorTitle }}</h3>
            </div>
            <button type="button" :disabled="saving" aria-label="Close" @click="closeEditor">×</button>
          </header>

          <div class="address-editor__categories">
            <button v-for="item in categoryOptions" :key="item.value" type="button" :class="{ 'is-active': form.category === item.value }" @click="form.category = item.value">
              <AddressCategoryIcon :category="item.value" />
              <span>{{ item.label }}</span>
            </button>
          </div>

          <div v-if="!editingId" class="address-editor__location" :class="`is-${locationStatusType}`">
            <button type="button" :disabled="locating" @click="fillWithCurrentLocation(true)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="7" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              {{ locating ? t('client.orderConfirm.location.locating') : t('client.orderConfirm.location.useCurrent') }}
            </button>
            <span role="status">{{ locationStatus }}</span>
          </div>

          <div class="address-editor__grid">
            <div class="address-editor__section-title is-wide">
              <span aria-hidden="true">⌖</span>
              <div>
                <strong>{{ locale === 'zh' ? '地址详情' : 'Address Details' }}</strong>
                <small>{{ locale === 'zh' ? '请输入您的迪拜地址' : 'Enter your Dubai address.' }}</small>
              </div>
            </div>
            <label class="is-wide"><span>{{ t('client.orderConfirm.fields.areaCommunity') }} *</span><input v-model.trim="form.community" type="text" maxlength="128" :placeholder="t('client.orderConfirm.placeholders.areaCommunity')" /></label>
            <label class="is-wide"><span>{{ t('client.orderConfirm.fields.street') }} *</span><input v-model.trim="form.address" type="text" maxlength="128" autocomplete="street-address" :placeholder="t('client.orderConfirm.placeholders.street')" /></label>
            <label class="is-wide"><span>{{ t('client.orderConfirm.fields.buildingVilla') }} *</span><input v-model.trim="form.building" type="text" maxlength="128" :placeholder="t('client.orderConfirm.placeholders.buildingVilla')" /></label>
            <label class="is-wide"><span>{{ t('client.orderConfirm.fields.apartmentUnitFloor') }} *</span><input v-model.trim="form.roomNo" type="text" maxlength="128" :placeholder="t('client.orderConfirm.placeholders.apartmentUnitFloor')" /></label>

            <div class="address-editor__section-title is-wide">
              <span aria-hidden="true">♙</span>
              <div>
                <strong>{{ locale === 'zh' ? '联系人信息' : 'Contact Details' }}</strong>
                <small>{{ locale === 'zh' ? '我们应该联系谁？' : 'Who should we deliver to?' }}</small>
              </div>
            </div>
            <label class="is-wide"><span>{{ t('client.orderConfirm.fields.fullName') }} *</span><input v-model.trim="form.fullName" type="text" autocomplete="name" :placeholder="t('client.orderConfirm.placeholders.fullName')" /></label>
            <label class="is-wide">
              <span>{{ t('client.orderConfirm.fields.phone') }} *</span>
              <div class="address-editor__phone">
                <select v-model="form.phoneCountryCode" autocomplete="tel-country-code">
                  <option v-for="item in countryCodes" :key="item" :value="item">{{ item }}</option>
                </select>
                <input v-model.trim="form.phone" type="tel" autocomplete="tel-national" />
              </div>
            </label>
            <div class="address-editor__section-title is-wide">
              <span aria-hidden="true">✎</span>
              <div>
                <strong>{{ t('client.orderConfirm.fields.remark') }}</strong>
              </div>
            </div>
            <label class="is-wide"><textarea v-model.trim="form.additionalNotes" rows="3" :aria-label="t('client.orderConfirm.fields.remark')" :placeholder="t('client.orderConfirm.placeholders.remark')" /></label>
          </div>

          <p v-if="formError" class="address-editor__error" role="alert">{{ formError }}</p>
          <footer>
            <button type="button" :disabled="saving" @click="closeEditor">{{ t('client.orderConfirm.addressBook.cancel') }}</button>
            <button class="is-primary" type="submit" :disabled="saving">
              {{ saving ? (locale === 'zh' ? '保存中…' : 'Saving…') : (editingId ? t('client.orderConfirm.addressBook.saveChanges') : t('client.orderConfirm.addressBook.save')) }}
            </button>
          </footer>
        </form>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  addClientAddress,
  deleteClientAddress,
  getClientAddressList,
  updateClientAddress,
  type AddressCategory,
  type ClientAddressRecord,
} from '@/modules/client/api';
import {
  locateCurrentAddress,
  LocationLookupError,
  type LocationLookupErrorCode,
} from '@/modules/client/utils/geolocation';
import AddressCategoryIcon from '@/modules/client/components/address-category-icon.vue';

const { t, locale } = useI18n({ useScope: 'global' });
const countryCodes = ['+971', '+966', '+1', '+44', '+91', '+86'];
const addresses = ref<ClientAddressRecord[]>([]);
const loading = ref(false);
const loadFailed = ref(false);
const editorVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const deletingId = ref<number | null>(null);
const formError = ref('');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const locating = ref(false);
const locationStatus = ref('');
const locationStatusType = ref<'info' | 'success' | 'error'>('info');
let locationRequestId = 0;
const form = reactive({
  fullName: '',
  phoneCountryCode: '+971',
  phone: '',
  district: '',
  address: '',
  building: '',
  roomNo: '',
  community: '',
  additionalNotes: '',
  category: 'home' as AddressCategory,
});

const categoryOptions = computed(() => [
  { value: 'home' as AddressCategory, label: t('client.orderConfirm.addressBook.categories.home') },
  { value: 'office' as AddressCategory, label: t('client.orderConfirm.addressBook.categories.office') },
  { value: 'others' as AddressCategory, label: t('client.orderConfirm.addressBook.categories.others') },
]);
const editorTitle = computed(() => editingId.value
  ? t('client.orderConfirm.addressBook.editTitle')
  : t('client.orderConfirm.addressBook.addTitle'));
const normalize = (value: unknown) => String(value || '').trim();
const normalizeCategory = (category: unknown): AddressCategory =>
  category === 'home' || category === 'office' || category === 'others' ? category : 'others';
const categoryLabel = (category: unknown) => {
  const normalized = normalizeCategory(category);
  return categoryOptions.value.find((item) => item.value === normalized)?.label || normalized;
};
const formatPhone = (item: ClientAddressRecord) => [normalize(item.phoneCountryCode), normalize(item.phone)].filter(Boolean).join(' ');
const getAddressFullName = (item: ClientAddressRecord) => normalize(item.fullName);
const formatAddress = (item: ClientAddressRecord) => [
  normalize(item.community) || normalize(item.district),
  normalize(item.address),
  normalize(item.building),
  normalize(item.roomNo),
].filter(Boolean).join(', ');

const loadAddresses = async () => {
  loading.value = true;
  loadFailed.value = false;
  try {
    addresses.value = await getClientAddressList();
  } catch (error) {
    console.error('load address list failed:', error);
    addresses.value = [];
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => Object.assign(form, {
  fullName: '',
  phoneCountryCode: '+971', phone: '',
  district: '', address: '', building: '', roomNo: '', community: '', additionalNotes: '', category: 'home' as AddressCategory,
});

const locationErrorKeyMap: Record<LocationLookupErrorCode, string> = {
  UNSUPPORTED: 'unsupported',
  PERMISSION_DENIED: 'permissionDenied',
  UNAVAILABLE: 'unavailable',
  TIMEOUT: 'timeout',
  LOOKUP_FAILED: 'lookupFailed',
};

const fillWithCurrentLocation = async (overwrite = false) => {
  if (locating.value) return;
  const requestId = ++locationRequestId;
  locating.value = true;
  locationStatusType.value = 'info';
  locationStatus.value = locale.value === 'zh'
    ? '正在获取当前位置并填写区域和街道…'
    : 'Getting your current location and filling the area and street…';
  try {
    const result = await locateCurrentAddress(String(locale.value));
    if (requestId !== locationRequestId || !editorVisible.value || editingId.value) return;
    if (overwrite || !normalize(form.community)) {
      const area = result.district || result.address;
      form.community = area;
      form.district = area;
      form.address = result.street || result.address;
    }
    locationStatusType.value = 'success';
    locationStatus.value = locale.value === 'zh'
      ? '已自动填写区域和街道，请补充楼栋、别墅、公寓或楼层信息。'
      : 'Area and street added. Enter the building, villa, apartment, unit, or floor details.';
  } catch (error) {
    if (requestId !== locationRequestId || !editorVisible.value) return;
    const code = error instanceof LocationLookupError ? error.code : 'LOOKUP_FAILED';
    locationStatusType.value = 'error';
    locationStatus.value = t(`client.orderConfirm.location.errors.${locationErrorKeyMap[code]}`);
  } finally {
    if (requestId === locationRequestId) locating.value = false;
  }
};

const openCreate = () => {
  locationRequestId += 1;
  locating.value = false;
  editingId.value = null;
  resetForm();
  formError.value = '';
  locationStatus.value = '';
  locationStatusType.value = 'info';
  editorVisible.value = true;
  void fillWithCurrentLocation();
};
const openEdit = (item: ClientAddressRecord) => {
  locationRequestId += 1;
  locating.value = false;
  editingId.value = item.id;
  Object.assign(form, {
    fullName: getAddressFullName(item),
    phoneCountryCode: normalize(item.phoneCountryCode) || '+971', phone: normalize(item.phone),
    district: normalize(item.district), address: normalize(item.address),
    building: normalize(item.building),
    roomNo: normalize(item.roomNo), community: normalize(item.community) || normalize(item.district),
    additionalNotes: normalize(item.additionalNotes), category: item.category || 'others',
  });
  formError.value = '';
  locationStatus.value = '';
  editorVisible.value = true;
};
const closeEditor = () => {
  if (!saving.value) {
    locationRequestId += 1;
    locating.value = false;
    editorVisible.value = false;
  }
};

const validate = () => {
  const fields: Array<[string, string]> = [
    [form.fullName, t('client.orderConfirm.fields.fullName')],
    [form.phone, t('client.orderConfirm.fields.phone')],
    [form.community, t('client.orderConfirm.fields.areaCommunity')],
    [form.address, t('client.orderConfirm.fields.street')],
    [form.building, t('client.orderConfirm.fields.buildingVilla')],
    [form.roomNo, t('client.orderConfirm.fields.apartmentUnitFloor')],
  ];
  const missing = fields.find(([value]) => !normalize(value));
  if (missing) return t('client.orderConfirm.validation.requiredField', { field: missing[1] });
  return '';
};

const saveAddress = async () => {
  formError.value = validate();
  if (formError.value || saving.value) return;
  saving.value = true;
  try {
    const payload = {
      fullName: normalize(form.fullName),
      phoneCountryCode: normalize(form.phoneCountryCode) || '+971', phone: normalize(form.phone),
      district: normalize(form.community) || undefined,
      address: normalize(form.address), building: normalize(form.building),
      roomNo: normalize(form.roomNo),
      community: normalize(form.community) || undefined,
      additionalNotes: normalize(form.additionalNotes) || undefined,
      category: form.category,
    };
    if (editingId.value) await updateClientAddress({ id: editingId.value, ...payload });
    else await addClientAddress(payload);
    editorVisible.value = false;
    messageType.value = 'success';
    message.value = editingId.value
      ? t('client.orderConfirm.addressBook.editSuccess')
      : t('client.orderConfirm.addressBook.addSuccess');
    await loadAddresses();
  } catch (error: any) {
    formError.value = error?.message || (locale.value === 'zh' ? '地址保存失败，请重试。' : 'Failed to save address. Please try again.');
  } finally {
    saving.value = false;
  }
};

const removeAddress = async (item: ClientAddressRecord) => {
  if (deletingId.value !== null) return;
  const confirmed = window.confirm(t('client.orderConfirm.addressBook.deleteConfirmMessage'));
  if (!confirmed) return;
  deletingId.value = item.id;
  try {
    await deleteClientAddress(item.id);
    messageType.value = 'success';
    message.value = t('client.orderConfirm.addressBook.deleteSuccess');
    await loadAddresses();
  } catch (error: any) {
    messageType.value = 'error';
    message.value = error?.message || t('client.orderConfirm.addressBook.deleteFailed');
  } finally {
    deletingId.value = null;
  }
};

onMounted(loadAddresses);
</script>

<style scoped>
.address-manager { display: grid; gap: 18px; }
.address-manager__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; }
.address-manager__header h3 { margin: 0; color: #05152b; font-size: 17px; }
.address-manager__header p { margin: 6px 0 0; color: #64748b; font-size: 13px; line-height: 1.55; }
.address-manager button { font: inherit; }
.address-manager__add, .address-manager__state button { min-height: 38px; padding: 0 16px; border: 0; border-radius: 10px; background: #1769c2; color: #fff; font-weight: 800; cursor: pointer; white-space: nowrap; }
.address-manager__add span { margin-right: 5px; font-size: 18px; }
.address-manager__message { margin: 0; padding: 10px 12px; border-radius: 10px; background: #ecfdf5; color: #047857; font-size: 13px; }
.address-manager__message.is-error { background: #fef2f2; color: #b91c1c; }
.address-manager__state { min-height: 88px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 1px dashed #cbd5e1; border-radius: 14px; color: #64748b; font-size: 13px; }
.address-manager__state--empty { flex-direction: column; padding: 20px; text-align: center; }
.address-manager__state--empty strong { color: #334155; }
.address-manager__state--error { color: #b91c1c; }
.address-manager__list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.address-manager__card { min-width: 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; box-shadow: 0 8px 20px rgb(15 23 42 / 5%); }
.address-manager__card > strong { display: block; margin-top: 10px; color: #0f172a; font-size: 15px; }
.address-manager__card p { margin: 5px 0 0; color: #64748b; font-size: 12px; overflow-wrap: anywhere; }
.address-manager__card small { display: block; margin-top: 6px; color: #94a3b8; }
.address-manager__address { color: #334155 !important; line-height: 1.5; }
.address-manager__tags { display: flex; gap: 6px; }
.address-manager__tags span { padding: 3px 8px; border-radius: 999px; background: #eff6ff; color: #1769c2; font-size: 10px; font-weight: 800; }
.address-manager__tags .address-manager__category { display: inline-flex; align-items: center; gap: 5px; }
.address-manager__category :deep(.address-category-icon) { font-size: 13px; }
.address-manager__tags .is-default { background: #ecfdf5; color: #047857; }
.address-manager__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
.address-manager__actions button { min-height: 32px; padding: 0 12px; border: 1px solid #dbe3ec; border-radius: 9px; background: #fff; color: #1769c2; font-size: 12px; font-weight: 800; cursor: pointer; }
.address-manager__actions .is-danger { color: #dc2626; }
.address-manager__actions button:disabled { opacity: .5; cursor: wait; }
.address-editor { position: fixed; inset: 0; z-index: 3000; padding: 24px; display: grid; place-items: center; background: rgb(5 21 43 / 58%); backdrop-filter: blur(5px); }
.address-editor__panel { width: min(680px, 100%); max-height: calc(100dvh - 48px); overflow: auto; border-radius: 20px; background: #fff; box-shadow: 0 28px 80px rgb(5 21 43 / 30%); }
.address-editor__panel header { padding: 20px 22px 16px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eef2f7; }
.address-editor__panel header span { color: #1769c2; font-size: 10px; font-weight: 900; letter-spacing: .14em; }
.address-editor__panel header h3 { margin: 5px 0 0; color: #05152b; font-size: 20px; }
.address-editor__panel header button { width: 34px; height: 34px; border: 0; border-radius: 50%; background: #f1f5f9; color: #334155; font-size: 22px; cursor: pointer; }
.address-editor__categories { padding: 18px 22px 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.address-editor__categories button { min-width: 0; min-height: 68px; padding: 8px 12px; border: 1px solid #dbe3ec; border-radius: 14px; background: #fff; color: #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-weight: 800; cursor: pointer; transition: border-color .18s ease, background-color .18s ease, box-shadow .18s ease; }
.address-editor__categories button :deep(.address-category-icon) { font-size: 22px; }
.address-editor__categories button.is-active { border-color: #1769c2; background: #eff6ff; color: #1769c2; box-shadow: inset 0 0 0 1px #1769c2; }
.address-editor__location { margin: 16px 22px 0; padding: 11px 12px; display: flex; align-items: center; gap: 12px; border: 1px solid #dbeafe; border-radius: 11px; background: #f8fbff; color: #526176; font-size: 12px; line-height: 1.45; }
.address-editor__location > button { min-height: 34px; flex: 0 0 auto; padding: 0 12px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid #1769c2; border-radius: 9px; background: #1769c2; color: #fff; font-weight: 800; cursor: pointer; }
.address-editor__location > button:disabled { opacity: .62; cursor: wait; }
.address-editor__location svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.address-editor__location.is-success { border-color: #bbf7d0; background: #f0fdf4; color: #047857; }
.address-editor__location.is-error { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.address-editor__grid { padding: 18px 22px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
.address-editor__section-title { margin-top: 2px; padding-top: 4px; display: flex; align-items: center; gap: 10px; }
.address-editor__section-title:not(:first-child) { margin-top: 6px; padding-top: 18px; border-top: 1px solid #eef2f7; }
.address-editor__section-title > span { width: 32px; height: 32px; flex: 0 0 auto; border-radius: 10px; display: grid; place-items: center; background: #edf5ff; color: #1769c2; font-size: 18px; font-weight: 900; }
.address-editor__section-title div { min-width: 0; display: grid; gap: 2px; }
.address-editor__section-title strong { color: #17233a; font-size: 13px; }
.address-editor__section-title small { color: #8a99aa; font-size: 10px; font-weight: 600; }
.address-editor__grid label { min-width: 0; display: grid; gap: 7px; color: #475569; font-size: 12px; font-weight: 800; }
.address-editor__grid label.is-wide { grid-column: 1 / -1; }
.address-editor__grid input, .address-editor__grid select, .address-editor__grid textarea { width: 100%; box-sizing: border-box; border: 1px solid #dbe3ec; border-radius: 10px; background: #fff; color: #0f172a; font: inherit; outline: none; }
.address-editor__grid input, .address-editor__grid select { height: 42px; padding: 0 11px; }
.address-editor__grid textarea { padding: 11px; resize: vertical; }
.address-editor__grid input:focus, .address-editor__grid select:focus, .address-editor__grid textarea:focus { border-color: #1769c2; box-shadow: 0 0 0 3px rgb(23 105 194 / 12%); }
.address-editor__phone { display: grid; grid-template-columns: 92px 1fr; gap: 8px; }
.address-editor__error { margin: 0 22px 16px; padding: 10px 12px; border-radius: 9px; background: #fef2f2; color: #b91c1c; font-size: 12px; }
.address-editor__panel footer { padding: 16px 22px 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #eef2f7; }
.address-editor__panel footer button { min-height: 40px; padding: 0 18px; border: 1px solid #dbe3ec; border-radius: 10px; background: #fff; color: #475569; font-weight: 800; cursor: pointer; }
.address-editor__panel footer .is-primary { border-color: #1769c2; background: #1769c2; color: #fff; }
.address-editor__panel footer button:disabled { opacity: .55; cursor: wait; }
@media (max-width: 700px) {
  .address-manager__header { align-items: stretch; flex-direction: column; }
  .address-manager__add { width: 100%; }
  .address-manager__list, .address-editor__grid { grid-template-columns: 1fr; }
  .address-editor { padding: 10px; align-items: end; }
  .address-editor__panel { max-height: calc(100dvh - 10px); border-radius: 20px 20px 0 0; }
  .address-editor__location { align-items: stretch; flex-direction: column; }
  .address-editor__location > button { justify-content: center; }
  .address-editor__grid label.is-wide { grid-column: auto; }
}
</style>
