import { defineStore } from 'pinia';
import { getServicesList } from '@/modules/client/api';

export const useServiceStore = defineStore('h5-services', {
  state: () => ({
    services: [] as any[],
    loaded: false,
  }),
  actions: {
    async fetchServices(force = false) {
      if (this.loaded && !force) return;
      try {
        const response: any = await getServicesList();
        const servicesData = Array.isArray(response)
          ? response
          : response?.data || (response as any)?.list || [];
        this.services = servicesData;
        this.loaded = true;
      } catch (error) {
        console.error('fetchServices error', error);
      }
    },
    setServices(list: any[]) {
      this.services = list;
      this.loaded = true;
    },
  },
});
