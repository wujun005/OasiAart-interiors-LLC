import { computed, ref, watch, type Ref } from 'vue';
import { packageDetail, type PackageCatalogCard } from '@/modules/client/api';
import { toPlainText } from '@/modules/client/utils/plain-text';

export interface PackageFirstServiceOption {
  value: string;
  spuId: string;
  label: string;
  spec: string;
}

/** Select the service whose first visit is booked together with this purchase. */
export const usePackageFirstBooking = (
  isPackageMode: Readonly<Ref<boolean>>,
  getPackageId: () => string,
  locale: Readonly<Ref<string>>,
) => {
  const catalog = ref<PackageCatalogCard | null>(null);
  const selectedSkuId = ref('');
  const loading = ref(false);
  const failed = ref(false);
  let requestSequence = 0;
  const isChinese = computed(() => locale.value.startsWith('zh'));
  const localized = (map?: Record<string, string>) => {
    const languages = isChinese.value ? ['zh-CN', 'zh', 'en', 'en-US'] : ['en', 'en-US', 'zh-CN', 'zh'];
    return toPlainText(languages.map((key) => map?.[key]).find((value) => typeof value === 'string' && value.trim())
      || Object.values(map || {}).find((value) => typeof value === 'string' && value.trim()) || '');
  };
  const options = computed<PackageFirstServiceOption[]>(() => {
    const seen = new Set<string>();
    const items = Array.isArray(catalog.value?.items) ? catalog.value.items : [];
    return items.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const value = String(item.skuId ?? '').trim();
      const spuId = String(item.spuId ?? '').trim();
      const visits = Number(item.redeemTimes);
      if (!/^[1-9]\d*$/.test(value) || !/^[1-9]\d*$/.test(spuId)
        || !Number.isFinite(visits) || visits <= 0 || seen.has(value)) return [];
      seen.add(value);
      return [{
        value,
        spuId,
        label: localized(item.spuNameI18n) || (isChinese.value ? '套餐服务' : 'Included service'),
        spec: (Array.isArray(item.specI18n) ? item.specI18n : []).filter(Boolean)
          .map((line) => [localized(line.specTypeNameI18n), localized(line.specValueNameI18n)]
          .filter(Boolean).join(': ')).filter(Boolean).join(' · '),
      }];
    });
  });
  const selectedService = computed(() => options.value.find((item) => item.value === selectedSkuId.value));
  const error = computed(() => failed.value
    ? (isChinese.value ? '套餐服务加载失败，请重试' : 'Unable to load included services. Please try again.') : '');
  const reload = async () => {
    const sequence = ++requestSequence;
    catalog.value = null;
    selectedSkuId.value = '';
    failed.value = false;
    loading.value = false;
    if (!isPackageMode.value) return;
    const packageId = getPackageId();
    if (!/^[1-9]\d*$/.test(packageId)) {
      failed.value = true;
      return;
    }
    loading.value = true;
    try {
      const result = await packageDetail(packageId);
      if (sequence !== requestSequence) return;
      catalog.value = result;
      if (options.value.length === 1) selectedSkuId.value = options.value[0].value;
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
    if (!options.value.length) return isChinese.value ? '套餐没有可预约的服务，请返回重试' : 'No bookable service was found in this package.';
    if (!selectedService.value) return isChinese.value ? '请选择首次预约的服务' : 'Please select a service for your first visit.';
    return '';
  });
  watch(() => [isPackageMode.value, getPackageId()] as const, () => { void reload(); }, { immediate: true });
  return { options, selectedSkuId, selectedService, loading, error, reload, validationMessage };
};
