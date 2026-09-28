import { defineStore } from 'pinia';
import { getCurrentAdminUser } from '@/modules/admin/api/user';
import {
  onboardingDetail,
  quoteList,
  serviceAreaList,
  serviceCatalog,
  serviceCommunityPage,
  supplierEventPage,
} from '@/modules/admin/api/supplierWorkbench';
import { getAdminAuthStorageValue } from '@/utils/auth-state';

type SupplierEventCache = {
  list: any[];
  total: number;
};

const unwrap = (payload: any) => (
  payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
);

let epoch = 0;
let meRequest: Promise<any> | null = null;
const detailRequests = new Map<string, Promise<any>>();
const catalogRequests = new Map<string, Promise<any>>();
const quoteRequests = new Map<string, Promise<any>>();
let areaRequest: Promise<any[]> | null = null;
const communityRequests = new Map<string, Promise<string[]>>();
let eventRequest: Promise<SupplierEventCache> | null = null;

const clearInflight = () => {
  meRequest = null;
  detailRequests.clear();
  catalogRequests.clear();
  quoteRequests.clear();
  areaRequest = null;
  communityRequests.clear();
  eventRequest = null;
};

const loadCommunityNames = async (areaId: number) => {
  const names: string[] = [];
  let pageNum = 1;
  let total = Number.POSITIVE_INFINITY;
  while (names.length < total && pageNum <= 5) {
    const page = unwrap(await serviceCommunityPage({ areaId, pageNum, pageSize: 200, status: 1 }));
    const list = page?.list || [];
    total = Number(page?.total ?? list.length);
    names.push(...list.map((item: any) => String(item.name || '')).filter(Boolean));
    if (!list.length) break;
    pageNum += 1;
  }
  return names;
};

const loadAllEvents = async (): Promise<SupplierEventCache> => {
  const list: any[] = [];
  let pageNum = 1;
  let total = 0;
  do {
    const result = unwrap(await supplierEventPage({ pageNum, pageSize: 50 }));
    const page = Array.isArray(result?.list) ? result.list : [];
    total = Number(result?.total || 0);
    list.push(...page);
    if (!page.length) break;
    pageNum += 1;
  } while (list.length < total && pageNum <= 8);
  return { list, total };
};

export const useAdminSessionStore = defineStore('admin-session', {
  state: () => ({
    token: '',
    me: null as any,
    details: {} as Record<string, any>,
    catalogs: {} as Record<string, any>,
    quotes: {} as Record<string, any>,
    areas: null as any[] | null,
    communities: {} as Record<string, string[]>,
    events: null as SupplierEventCache | null,
  }),
  actions: {
    reset() {
      epoch += 1;
      clearInflight();
      this.token = '';
      this.me = null;
      this.details = {};
      this.catalogs = {};
      this.quotes = {};
      this.areas = null;
      this.communities = {};
      this.events = null;
    },
    alignToken() {
      const token = getAdminAuthStorageValue('token') || '';
      if (token === this.token) return token;
      epoch += 1;
      clearInflight();
      this.token = token;
      this.me = null;
      this.details = {};
      this.catalogs = {};
      this.quotes = {};
      this.areas = null;
      this.communities = {};
      this.events = null;
      return token;
    },
    async currentUser(fresh = false) {
      const token = this.alignToken();
      if (!token) return null;
      if (!fresh && this.me) return this.me;
      if (!fresh && meRequest) return meRequest;
      const stamp = epoch;
      const task = getCurrentAdminUser().then(unwrap);
      meRequest = task;
      try {
        const me = await task;
        if (stamp === epoch) this.me = me;
        return me;
      } finally {
        if (meRequest === task) meRequest = null;
      }
    },
    async supplierDetail(id: number | string, fresh = false) {
      this.alignToken();
      const key = String(id);
      if (!fresh && this.details[key]) return this.details[key];
      if (!fresh && detailRequests.has(key)) return detailRequests.get(key);
      const stamp = epoch;
      const task = onboardingDetail(id).then(unwrap);
      detailRequests.set(key, task);
      try {
        const detail = await task;
        if (stamp === epoch) this.details[key] = detail;
        return detail;
      } finally {
        if (detailRequests.get(key) === task) detailRequests.delete(key);
      }
    },
    async catalog(id: number | string, fresh = false) {
      this.alignToken();
      const key = String(id);
      if (!fresh && this.catalogs[key]) return this.catalogs[key];
      if (!fresh && catalogRequests.has(key)) return catalogRequests.get(key);
      const stamp = epoch;
      const task = serviceCatalog(id).then(unwrap);
      catalogRequests.set(key, task);
      try {
        const catalog = await task;
        if (stamp === epoch) this.catalogs[key] = catalog;
        return catalog;
      } finally {
        if (catalogRequests.get(key) === task) catalogRequests.delete(key);
      }
    },
    async supplierQuotes(id: number | string, fresh = false) {
      this.alignToken();
      const key = String(id);
      if (!fresh && this.quotes[key]) return this.quotes[key];
      if (!fresh && quoteRequests.has(key)) return quoteRequests.get(key);
      const stamp = epoch;
      const task = quoteList(id).then(unwrap);
      quoteRequests.set(key, task);
      try {
        const quotes = await task;
        if (stamp === epoch) this.quotes[key] = quotes;
        return quotes;
      } finally {
        if (quoteRequests.get(key) === task) quoteRequests.delete(key);
      }
    },
    async serviceAreas(fresh = false) {
      this.alignToken();
      if (!fresh && this.areas) return this.areas;
      if (!fresh && areaRequest) return areaRequest;
      const stamp = epoch;
      const task = serviceAreaList({ status: 1 }).then((payload) => unwrap(payload) || []);
      areaRequest = task;
      try {
        const areas = await task;
        if (stamp === epoch) this.areas = areas;
        return areas;
      } finally {
        if (areaRequest === task) areaRequest = null;
      }
    },
    async communitiesFor(areaIds: number[]) {
      this.alignToken();
      const ids = [...new Set(areaIds.map(Number).filter((id) => id > 0))];
      await Promise.all(ids.filter((id) => this.communities[id] == null).map(async (id) => {
        const key = String(id);
        if (!communityRequests.has(key)) {
          const stamp = epoch;
          const task = loadCommunityNames(id).catch(() => [] as string[]);
          communityRequests.set(key, task);
          task.then((names) => {
            if (stamp === epoch) this.communities[key] = names;
          }).finally(() => {
            if (communityRequests.get(key) === task) communityRequests.delete(key);
          });
        }
        await communityRequests.get(key);
      }));
      return Object.fromEntries(ids.map((id) => [id, this.communities[id] || []]));
    },
    async supplierEvents(fresh = false) {
      this.alignToken();
      if (!fresh && this.events) return this.events;
      if (!fresh && eventRequest) return eventRequest;
      const stamp = epoch;
      const task = loadAllEvents();
      eventRequest = task;
      try {
        const events = await task;
        if (stamp === epoch) this.events = events;
        return events;
      } finally {
        if (eventRequest === task) eventRequest = null;
      }
    },
  },
});
