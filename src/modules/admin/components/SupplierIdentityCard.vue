<template>
  <section
    class="supplier-identity"
    :class="{ 'supplier-identity--compact': compact }"
    :aria-label="isZh ? '供应商身份与状态' : 'Supplier identity and status'"
  >
    <strong class="supplier-identity__company" :title="companyName">{{ companyName }}</strong>
    <p class="supplier-identity__id"><span>Supplier ID</span><strong>{{ supplierId }}</strong></p>
    <dl v-if="detail" class="supplier-identity__statuses">
      <div>
        <dt>{{ isZh ? '企业审核' : 'Business verification' }}</dt>
        <dd :class="reviewTone"><i aria-hidden="true" />{{ reviewLabel }}</dd>
      </div>
      <div>
        <dt>{{ t('admin.supplierAvailability.acceptJobs') }}</dt>
        <dd :class="dispatchTone"><i aria-hidden="true" />{{ acceptPreference }}</dd>
      </div>
      <div>
        <dt>{{ t('admin.platformSuppliers.dispatchEligibility') }}</dt>
        <dd :class="eligibilityTone"><i aria-hidden="true" />{{ eligibilityLabel }}</dd>
      </div>
    </dl>
    <p v-if="detail && eligibilityKey !== 'active'" class="supplier-identity__note">{{ t('admin.supplierAvailability.preferenceSaved') }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdminSessionStore } from '@/modules/admin/stores/session';
import { dispatchEligibility } from '@/modules/admin/utils/supplierReviewState';

defineProps<{ compact?: boolean }>();
const session = useAdminSessionStore();
const { t, locale } = useI18n({ useScope: 'global' });
const isZh = computed(() => locale.value !== 'en');
const detail = computed(() => {
  const id = session.me?.supplierId;
  return id == null ? null : session.details[String(id)] || null;
});
const companyName = computed(() => String(detail.value?.companyName || '').trim()
  || (isZh.value ? '待完善公司名称' : 'Company name pending'));
const supplierId = computed(() => detail.value?.supplierNo || session.me?.supplierNo
  || (session.me?.supplierId ? `#${session.me.supplierId}` : '—'));
const reviewStatus = computed(() => {
  const value = detail.value?.status;
  return value == null || value === '' ? null : Number(value);
});
const reviewLabel = computed(() => {
  const keys = ['statusDraft', 'statusSubmitted', 'statusApproved', 'statusRejected'];
  const key = reviewStatus.value == null ? 'statusNone' : keys[reviewStatus.value] || 'statusNone';
  return t(`admin.supplierProfile.${key}`);
});
const reviewTone = computed(() => ['is-neutral', 'is-pending', 'is-positive', 'is-negative'][reviewStatus.value ?? -1] || 'is-neutral');
const dispatchStatus = computed(() => {
  const value = detail.value?.acceptDispatch;
  return value == null || value === '' ? null : Number(value);
});
const acceptPreference = computed(() => t(dispatchStatus.value === 1
  ? 'admin.supplierAvailability.preferenceOn'
  : 'admin.supplierAvailability.preferenceOff'));
const eligibilityKey = computed(() => dispatchEligibility({
  reviewStatus: reviewStatus.value,
  enabled: detail.value?.enabled,
  acceptDispatch: detail.value?.acceptDispatch,
}));
const eligibilityLabel = computed(() => {
  const keys = {
    pendingVerification: 'eligibilityPending',
    verificationApproved: 'eligibilityApproved',
    setupIncomplete: 'eligibilitySetup',
    active: 'eligibilityActive',
    suspended: 'eligibilitySuspended',
    changesRequired: 'eligibilityChanges',
  } as const;
  return t(`admin.supplierAvailability.${keys[eligibilityKey.value]}`);
});
const dispatchTone = computed(() => dispatchStatus.value === 1 ? 'is-positive' : 'is-paused');
const eligibilityTone = computed(() => eligibilityKey.value === 'active' ? 'is-positive'
  : eligibilityKey.value === 'suspended' || eligibilityKey.value === 'changesRequired' ? 'is-negative' : 'is-pending');
</script>

<style scoped>
.supplier-identity {
  flex: none;
  margin: 16px 16px 0;
  padding: 15px 13px 12px;
  border: 1px solid rgba(225, 192, 132, 0.2);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.045);
}

.supplier-identity__company {
  display: block;
  color: #fff9ee;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.supplier-identity__id {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px 8px;
  margin: 7px 0 13px;
  color: rgba(245, 235, 215, 0.65);
  font-size: 10px;
  line-height: 1.5;
}

.supplier-identity__id strong {
  color: #e4c997;
  font-size: 11px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.supplier-identity__statuses {
  display: grid;
  gap: 9px;
  margin: 0;
  padding-top: 11px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.supplier-identity__statuses > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 8px;
  font-size: 10px;
  line-height: 1.5;
}

.supplier-identity__statuses dt {
  color: rgba(245, 235, 215, 0.65);
}

.supplier-identity__note {
  margin: 10px 0 0;
  color: rgba(245, 235, 215, 0.72);
  font-size: 10px;
  line-height: 1.45;
}

.supplier-identity__statuses dd {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-weight: 600;
}

.supplier-identity__statuses i {
  width: 5px;
  height: 5px;
  flex: none;
  border-radius: 50%;
  background: currentColor;
}

.is-positive { color: #91d8b4; }
.is-pending { color: #e9c57f; }
.is-negative { color: #f2a6a1; }
.is-paused { color: #e7c397; }
.is-neutral { color: #bdc7d3; }

.supplier-identity--compact {
  margin-inline: 7px;
  padding: 10px 7px;
}

.supplier-identity--compact .supplier-identity__company {
  font-size: 10px;
}

.supplier-identity--compact .supplier-identity__id {
  gap: 2px;
  margin-block: 6px 9px;
  font-size: 8px;
}

.supplier-identity--compact .supplier-identity__id strong,
.supplier-identity--compact .supplier-identity__statuses > div {
  font-size: 9px;
}

.supplier-identity--compact .supplier-identity__statuses > div {
  gap: 2px;
}
</style>
