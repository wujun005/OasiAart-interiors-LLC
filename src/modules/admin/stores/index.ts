import { defineStore } from 'pinia';
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    roles: [] as string[],
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    hasRole: (s) => (r: string) => s.roles.includes(r),
  },
  actions: {
    login(token: string, roles: string[]) {
      this.token = token;
      this.roles = roles;
    },
    logout() {
      this.token = '';
      this.roles = [];
    },
  },
});
