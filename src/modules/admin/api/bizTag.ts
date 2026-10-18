import http from '@/modules/admin/utils/request';
import type { BizTag } from '@/modules/client/utils/biz-tag';

export type { BizTag };

export function bizTagOptions() {
  return http.get('/api/bizTag/options') as Promise<BizTag[]>;
}

export function bizTagsByRef(refType: number, refId: number) {
  return http.get('/api/bizTag/listByRef', { params: { refType, refId } }) as Promise<BizTag[]>;
}

export function saveBizTag(payload: { id?: number; nameI18n: Record<string, string>; sort?: number }) {
  return http.post('/api/bizTag/save', payload) as Promise<BizTag>;
}

export function replaceBizTags(payload: { refType: number; refId: number; tagIds: number[] }) {
  return http.post('/api/bizTag/replace', payload) as Promise<BizTag[]>;
}
