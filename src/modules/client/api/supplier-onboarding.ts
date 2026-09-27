import axios from 'axios';
import { getClientLocale } from '@/modules/client/locales';

const clientBase = import.meta.env.VITE_CLIENT_API_BASE_URL || '/client-api';

export type OnboardingApplyPayload = Record<string, unknown>;

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
