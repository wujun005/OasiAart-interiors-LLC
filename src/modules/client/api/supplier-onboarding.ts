import axios from 'axios';
import { getClientLocale } from '@/modules/client/locales';

const clientBase = import.meta.env.VITE_CLIENT_API_BASE_URL || '/client-api';

export type NameI18n = Record<string, string> | null | undefined;

export type OnboardingServiceItem = {
  spuId: number;
  spuName: string;
  nameI18n?: NameI18n;
  available?: boolean;
};

export type OnboardingServiceGroup = {
  categoryId: number;
  categoryName: string;
  nameI18n?: NameI18n;
  available?: boolean;
  services: OnboardingServiceItem[];
};

export type OnboardingArea = {
  id: number;
  name: string;
  status?: number;
};

export type OnboardingApplyPayload = Record<string, unknown>;

export type OnboardingSubmitResult = {
  id?: number;
  account: string;
  password: string;
  existing: boolean;
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

export async function fetchOnboardingServices() {
  try {
    const { data } = await axios.get(`${clientBase}/client/supplier/onboarding/services`, { headers: headers() });
    return unwrap<OnboardingServiceGroup[]>(data) || [];
  } catch (error) {
    throw readError(error);
  }
}

export async function fetchOnboardingAreas() {
  try {
    const { data } = await axios.get(`${clientBase}/client/supplier/onboarding/areas`, { headers: headers() });
    return unwrap<OnboardingArea[]>(data) || [];
  } catch (error) {
    throw readError(error);
  }
}

export async function submitOnboarding(payload: OnboardingApplyPayload) {
  try {
    const { data } = await axios.post(`${clientBase}/client/supplier/onboarding/submit`, payload, { headers: headers() });
    const body = unwrap<unknown>(data);
    if (typeof body === 'number') {
      return { id: body, account: '', password: '', existing: false };
    }
    const result = (body && typeof body === 'object' ? body : {}) as {
      id?: number;
      account?: string | null;
      password?: string | null;
    };
    const account = result.account?.trim() || '';
    const password = result.password?.trim() || '';
    return {
      id: result.id,
      account,
      password,
      existing: Boolean(account) && !password,
    } satisfies OnboardingSubmitResult;
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
