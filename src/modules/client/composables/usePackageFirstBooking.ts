import { computed, onScopeDispose, ref, watch, type Ref } from 'vue';
import { getClientOrderDetailById, type OrderListRecord } from '@/modules/client/api';
import { toPlainText } from '@/modules/client/utils/plain-text';

export interface PackageFirstServiceOption {
  value: string;
  spuId: string;
  label: string;
  spec: string;
}

const positiveId = (value: unknown) => {
  const text = String(value ?? '').trim();
  return /^[1-9]\d*$/.test(text) && Number.isSafeInteger(Number(text)) ? text : '';
};

/** Every included service is booked once, using the purchased SKU snapshot. */
export const usePackageFirstBooking = (
  isPackageMode: Readonly<Ref<boolean>>,
  getOrderId: () => string,
  locale: Readonly<Ref<string>>,
  getPackageId: () => string,
) => {
  const order = ref<OrderListRecord | null>(null);
  const loading = ref(false);
  const failed = ref(false);
  let requestSequence = 0;
  const isChinese = computed(() => locale.value.startsWith('zh'));
  const localized = (map?: Record<string, string>) => {
    const languages = isChinese.value ? ['zh-CN', 'zh', 'en', 'en-US'] : ['en', 'en-US', 'zh-CN', 'zh'];
    return toPlainText(languages.map((key) => map?.[key]).find((value) => typeof value === 'string' && value.trim())
      || Object.values(map || {}).find((value) => typeof value === 'string' && value.trim()) || '');
  };
  const parsedServices = computed<PackageFirstServiceOption[] | null>(() => {
    const items = order.value?.packageSnapshot?.items;
    if (!Array.isArray(items) || !items.length) return null;
    const seen = new Set<string>();
    const services: PackageFirstServiceOption[] = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') return null;
      const value = positiveId(Number(item.bindType) === 1 ? item.chosenSkuId : item.chosenSkuId ?? item.skuId);
      const spuId = positiveId(item.spuId);
      const visits = Number(item.redeemTimes);
      if (!value || !spuId || !Number.isSafeInteger(visits) || visits <= 0) return null;
      const key = `${spuId}:${value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      services.push({
        value,
        spuId,
        label: localized(item.spuNameI18n) || (isChinese.value ? '套餐服务' : 'Included service'),
        spec: (Array.isArray(item.specs) ? item.specs : []).filter(Boolean)
          .map((line) => [localized(line.specTypeNameI18n), localized(line.specValueNameI18n)]
            .filter(Boolean).join(': ')).filter(Boolean).join(' · '),
      });
    }
    return services;
  });
  const options = computed(() => parsedServices.value || []);
  const error = computed(() => failed.value
    ? (isChinese.value ? '套餐服务加载失败，请重试' : 'Unable to load included services. Please try again.') : '');
  const reload = async () => {
    const sequence = ++requestSequence;
    order.value = null;
    failed.value = false;
    loading.value = false;
    if (!isPackageMode.value) return;
    const orderId = positiveId(getOrderId());
    const packageId = positiveId(getPackageId());
    if (!orderId || !packageId) {
      failed.value = true;
      return;
    }
    loading.value = true;
    try {
      const result = await getClientOrderDetailById(orderId);
      if (sequence !== requestSequence) return;
      if (!result || (result.packageOrder !== true && Number(result.orderType) !== 2)
        || positiveId(result.orderId) !== orderId
        || positiveId(result.packageSnapshot?.packageId ?? result.packageId) !== packageId) {
        failed.value = true;
        return;
      }
      order.value = result;
    } catch {
      if (sequence === requestSequence) failed.value = true;
    } finally {
      if (sequence === requestSequence) loading.value = false;
    }
  };
  const validationMessage = computed(() => {
    if (!isPackageMode.value) return '';
    if (loading.value) return isChinese.value ? '正在加载套餐服务，请稍候' : 'Included services are loading. Please wait.';
    if (error.value) return error.value;
    if (!parsedServices.value?.length) return isChinese.value
      ? '套餐已购服务信息不完整，请返回套餐详情后重试'
      : 'The purchased package services are incomplete. Please return to the package details and try again.';
    return '';
  });
  watch(() => [isPackageMode.value, getOrderId(), getPackageId()] as const, () => { void reload(); }, { immediate: true });
  onScopeDispose(() => { requestSequence += 1; });
  return { options, loading, error, reload, validationMessage };
};
