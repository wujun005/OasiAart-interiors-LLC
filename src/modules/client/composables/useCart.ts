import { computed, ref } from 'vue';
import {
  addCartItem,
  getCartDetail,
  getCartList,
  removeCartItems,
  type AddCartItemPayload,
  type ClientCartItemRecord,
  type CartSkuDetail,
} from '@/modules/client/api';
import {
  formatOrderAddOns,
  formatOrderSpecs,
} from '@/modules/client/utils/order-localization';

export type CartLocalizedText = Record<string, string>;

export interface CartItem {
  id: string;
  spuId: string;
  skuId?: string;
  titleI18n: CartLocalizedText;
  categoryI18n?: CartLocalizedText;
  image?: string;
  specSummary?: string;
  specSummaryI18n?: CartLocalizedText;
  addOns?: string[];
  addOnsI18n?: CartLocalizedText[];
  selectedSpecValueIds?: string[];
  specValueNameI18n?: Record<string, CartLocalizedText>;
  skuDetail?: CartSkuDetail;
  unitPrice: number;
  detailPath?: string;
  selected: boolean;
  addressId?: number | string;
  serviceAddress?: string;
  serviceTimeDisplay?: string;
  serviceDateTime?: string;
  timeRange?: number | string;
  expiresAt?: string;
}

const TAX_RATE = 0.05;
const CART_TIME_RANGES: Record<string, string> = {
  '1': '09:00-11:00',
  '2': '11:00-13:00',
  '3': '13:00-15:00',
  '4': '15:00-17:00',
  '5': '17:00-19:00',
  '6': '19:00-21:00',
};
const cartItems = ref<CartItem[]>([]);
const cartLoading = ref(false);
const cartError = ref('');
let initialized = false;
let loadingPromise: Promise<void> | null = null;
let cartRevision = 0;

const normalizeCartServiceDateTime = (record: ClientCartItemRecord) => {
  const value = String(record.serviceDateTime || record.serviceTime || '').trim();
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) return value;

  const rawTimeRange = String(record.timeRange ?? '').trim();
  const timeRange = CART_TIME_RANGES[rawTimeRange]
    || (/^\d{1,2}:\d{2}\s*[-~–—]\s*\d{1,2}:\d{2}$/.test(rawTimeRange)
      ? rawTimeRange
      : '');
  return timeRange ? `${value} ${timeRange}` : value;
};

const normalizeRecord = (record: ClientCartItemRecord): CartItem => {
  const title = String(record.productName || '').trim() || 'Service';
  const productNameI18n = record.productNameI18n && typeof record.productNameI18n === 'object'
    ? record.productNameI18n
    : {};
  const englishSpecs = formatOrderSpecs(record.specSelections, 'en');
  const chineseSpecs = formatOrderSpecs(record.specSelections, 'zh');
  const englishAddOns = formatOrderAddOns(record.attachSelections, 'en');
  const chineseAddOns = formatOrderAddOns(record.attachSelections, 'zh');
  const fallbackSpec = String(record.specDesc || '').trim();
  const specValueNameI18n = Object.fromEntries(
    (record.specSelections || [])
      .map((selection) => [
        String(selection.specValueId ?? '').trim(),
        selection.specValueNameI18n || {
          en: String(selection.specValueName || '').trim(),
          zh: String(selection.specValueName || '').trim(),
        },
      ] as const)
      .filter(([id]) => Boolean(id)),
  );
  const skuDetail = record.spuId
    ? {
        spuId: record.spuId,
        specValueIds: (record.specValueIds || []).map((item) => String(item)),
        attachItems: (record.attachItems || [])
          .filter((item) => item.attachValueId !== undefined && item.attachValueId !== null)
          .map((item) => ({
            attachValueId: item.attachValueId as number | string,
            quantity: Math.max(1, Number(item.quantity) || 1),
          })),
      }
    : undefined;
  return {
    id: String(record.cartItemId || ''),
    spuId: String(record.spuId ?? ''),
    skuId: String(record.skuCode || ''),
    titleI18n: Object.keys(productNameI18n).length
      ? productNameI18n
      : { en: title, zh: title },
    categoryI18n: { en: 'Home Services', zh: '家居服务' },
    image: String(record.spuImage || ''),
    specSummary: englishSpecs || fallbackSpec,
    specSummaryI18n: {
      en: englishSpecs || fallbackSpec,
      zh: chineseSpecs || fallbackSpec,
    },
    addOns: englishAddOns ? englishAddOns.split(' · ') : [],
    addOnsI18n: englishAddOns || chineseAddOns
      ? [{ en: englishAddOns, zh: chineseAddOns }]
      : [],
    selectedSpecValueIds: (record.specValueIds || []).map((item) => String(item)),
    specValueNameI18n,
    skuDetail,
    unitPrice: Math.max(0, Number(record.amountWithTax) || 0),
    detailPath: record.spuId ? `/services/detail/${record.spuId}` : '/',
    selected: true,
    addressId: record.addressId,
    serviceAddress: [
      record.serviceAddress,
      record.building,
      record.roomNo,
      record.community,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(', '),
    serviceTimeDisplay: String(record.serviceTimeDisplay || '').trim(),
    serviceDateTime: normalizeCartServiceDateTime(record),
    timeRange: record.timeRange,
    expiresAt: String(record.expiresAt || '').trim(),
  };
};

const refreshCart = async () => {
  if (loadingPromise) return loadingPromise;
  const requestRevision = cartRevision;
  cartLoading.value = true;
  cartError.value = '';
  loadingPromise = (async () => {
    try {
      const list = await getCartList();
      const detailed = await Promise.all(
        list.map(async (item) => {
          try {
            return (await getCartDetail(String(item.cartItemId))) || item;
          } catch {
            return item;
          }
        }),
      );
      if (requestRevision === cartRevision) {
        cartItems.value = detailed
          .filter((item) => Boolean(item.cartItemId))
          .map(normalizeRecord);
      }
    } catch (error: any) {
      if (requestRevision === cartRevision) {
        cartItems.value = [];
      }
      cartError.value = String(error?.message || 'Failed to load booking cart');
    } finally {
      cartLoading.value = false;
      loadingPromise = null;
    }
  })();
  return loadingPromise;
};

const initializeCart = () => {
  if (initialized) return;
  initialized = true;
  void refreshCart();
};

export const useCart = () => {
  initializeCart();

  const selectedItems = computed(() => cartItems.value.filter((item) => item.selected));
  const cartCount = computed(() => cartItems.value.length);
  const selectedCount = computed(() => selectedItems.value.length);
  const selectedLineCount = computed(() => selectedItems.value.length);
  const allSelected = computed(() => cartItems.value.length > 0 && cartItems.value.every((item) => item.selected));
  const partiallySelected = computed(() => selectedItems.value.length > 0 && !allSelected.value);
  const total = computed(() => selectedItems.value.reduce((sum, item) => sum + item.unitPrice, 0));
  const subtotal = computed(() => total.value / (1 + TAX_RATE));
  const tax = computed(() => total.value - subtotal.value);

  const addItem = async (payload: AddCartItemPayload) => {
    const cartItemId = await addCartItem(payload);
    await refreshCart();
    return cartItemId;
  };

  const setSelected = (id: string, selected: boolean) => {
    const item = cartItems.value.find((entry) => entry.id === id);
    if (item) item.selected = selected;
  };

  const setAllSelected = (selected: boolean) => {
    cartItems.value.forEach((item) => {
      item.selected = selected;
    });
  };

  const removeItems = async (ids: string[]) => {
    if (!ids.length) return;
    await removeCartItems(ids);
    await refreshCart();
  };

  const clearCart = async () => {
    const localIds = cartItems.value.map((item) => item.id).filter(Boolean);
    cartRevision += 1;
    cartItems.value = [];
    cartError.value = '';

    try {
      const serverItems = await getCartList();
      const ids = Array.from(new Set([
        ...localIds,
        ...serverItems.map((item) => String(item.cartItemId || '')).filter(Boolean),
      ]));
      if (ids.length) {
        await removeCartItems(ids);
      }
    } catch (error: any) {
      cartError.value = String(error?.message || 'Failed to clear booking cart');
      throw error;
    }
  };

  return {
    items: cartItems,
    selectedItems,
    cartCount,
    selectedCount,
    selectedLineCount,
    allSelected,
    partiallySelected,
    subtotal,
    tax,
    total,
    isLoading: cartLoading,
    error: cartError,
    addItem,
    refreshCart,
    setSelected,
    setAllSelected,
    removeItems,
    clearCart,
  };
};
