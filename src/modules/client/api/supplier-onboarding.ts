import axios from 'axios';
import { getClientLocale } from '@/modules/client/locales';

const clientBase = import.meta.env.VITE_CLIENT_API_BASE_URL || '/client-api';

export type OnboardingApplyPayload = Record<string, unknown>;

export type ServiceCategoryOption = {
  categoryId: string;
  categoryName?: string;
  nameI18n?: Record<string, string>;
  other?: boolean;
};

const headers = () => ({ language: getClientLocale() });

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object') {
    const body = payload as { success?: boolean; message?: string; data?: T };
    if (body.success === false) {
      throw new Error(body.message || 'Request failed');
    }
    if ('data' in body) return body.data as T;
  }
  return payload as T;
};

const readError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return new Error(data.message);
  }
  return error instanceof Error ? error : new Error('Request failed');
};

const keepCategoryIds = (payload: string) => payload.replace(/"categoryId"\s*:\s*(-?\d+)/g, '"categoryId":"$1"');

export async function listServiceCategories() {
  try {
    const { data } = await axios.get(`${clientBase}/client/supplier/onboarding/service-categories`, {
      headers: headers(),
      transformResponse: [(payload) => {
        if (typeof payload !== 'string' || !payload) return payload;
        return JSON.parse(keepCategoryIds(payload));
      }],
    });
    const list = unwrap<ServiceCategoryOption[]>(data);
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => ({ ...item, categoryId: item?.categoryId == null ? '' : String(item.categoryId) }))
      .filter((item) => item.categoryId !== '');
  } catch (error) {
    throw readError(error);
  }
}

export function isOtherService(option: Pick<ServiceCategoryOption, 'categoryId' | 'other'>) {
  return option.other === true || String(option.categoryId) === '0';
}

export function serviceCategoryLabel(option: ServiceCategoryOption, locale: string) {
  const names = option.nameI18n || {};
  const keys = locale.startsWith('zh') ? ['zh-CN', 'zh', 'en', 'en-US'] : ['en', 'en-US', 'zh-CN', 'zh'];
  for (const key of keys) {
    const text = names[key];
    if (typeof text === 'string' && text.trim()) return text.trim();
  }
  return option.categoryName || option.categoryId;
}

export function categoryIdPayload(ids: string[]) {
  return ids.map((id) => {
    const numeric = Number(id);
    return Number.isSafeInteger(numeric) ? numeric : id;
  });
}

export async function submitOnboarding(payload: OnboardingApplyPayload) {
  try {
    const { data } = await axios.post(`${clientBase}/client/supplier/onboarding/submit`, payload, { headers: headers() });
    const id = unwrap<unknown>(data);
    return typeof id === 'number' ? id : Number(id) || undefined;
  } catch (error) {
    throw readError(error);
  }
}

export async function uploadOnboardingFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const { data } = await axios.post(`${clientBase}/client/file/upload`, formData, { headers: headers() });
    const url = unwrap<string>(data);
    if (!url || typeof url !== 'string') throw new Error('Upload failed');
    return url;
  } catch (error) {
    throw readError(error);
  }
}
