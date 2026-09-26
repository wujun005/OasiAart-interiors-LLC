<template>
  <div class="admin-page" :class="{ 'admin-page--orders-h5': isOrdersH5, 'admin-page--supplier': isSupplierPortal }">
    <el-container class="layout">
      <el-aside v-if="!isOrdersH5" width="248px" class="sidebar">
        <div class="logo">{{ brandLabel }}</div>
        <el-menu
          :default-active="activeMenu"
          :default-openeds="defaultOpeneds"
          class="menu"
          @select="handleSelect"
        >
          <PermissionMenuItem
            v-for="item in menuTree"
            :key="item.id"
            :item="item"
            :resolve-icon="resolveMenuIcon"
            :resolve-label="resolveMenuLabel"
          />
        </el-menu>
        <div v-if="!menuTree.length" class="menu-empty">
          {{ t('admin.layout.noMenuPermission') }}
        </div>
      </el-aside>
      <el-container>
        <el-header class="header">
          <div class="breadcrumb">{{ pageTitle }}</div>
          <div class="actions">
            <el-select
              v-model="currentLocale"
              size="small"
              class="lang-switcher"
              @change="handleLocaleChange"
            >
              <el-option value="zh" :label="t('admin.common.langZh')" />
              <el-option value="en" :label="t('admin.common.langEn')" />
            </el-select>
            <el-button size="small" @click="refresh">{{ t('admin.common.refresh') }}</el-button>
            <el-button size="small" @click="handleLogout">{{ t('admin.common.logout') }}</el-button>
          </div>
        </el-header>
        <el-main class="content">
          <RouterView />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  House,
  Document,
  User,
  Goods,
  FolderOpened,
  CollectionTag,
  Collection,
  Tickets,
  Ticket,
  OfficeBuilding,
  UserFilled,
  Calendar,
  List,
  PriceTag,
  DataAnalysis,
  Location,
  Wallet,
  Menu as MenuIcon,
} from '@element-plus/icons-vue';
import { ADMIN_LOCALE_STORAGE_KEY, type AdminLocale } from '@/modules/admin/locales';
import { clearAdminAuthState } from '@/utils/auth-state';
import PermissionMenuItem from '@/modules/admin/components/PermissionMenuItem.vue';
import {
  adminMenuState,
  loadAdminMenuPermissions,
  resetAdminMenuPermissions,
  resolveAllowedAdminPath,
  type AdminMenuPermissionItem,
} from '@/modules/admin/utils/menuPermission';

const route = useRoute();
const isOrdersH5 = computed(() => route.name === 'admin-orders-h5');
const isSupplierPortal = computed(() => route.path.startsWith('/admin/supplier-management'));
const router = useRouter();
const { t, locale } = useI18n({ useScope: 'global' });
const currentLocale = ref<AdminLocale>(locale.value === 'en' ? 'en' : 'zh');
const menuTree = computed(() => adminMenuState.menus);
const getMenuIndex = (item: AdminMenuPermissionItem) =>
  item.path || `menu-${item.id}`;

const menuByPath = computed(() => {
  const map = new Map<string, AdminMenuPermissionItem>();
  adminMenuState.flatMenus.forEach((item) => {
    if (item.path) {
      map.set(item.path, item);
    }
  });
  return map;
});

const defaultOpeneds = computed(() =>
  adminMenuState.flatMenus
    .filter((item) => Array.isArray(item.children) && item.children.length > 0)
    .map((item) => getMenuIndex(item)),
);

const activeMenu = computed(() => {
  const path = resolveAllowedAdminPath(route.path);
  return path || '';
});

const pageTitle = computed(() => {
  if (!activeMenu.value) return t('admin.layout.overview');
  const activeItem = menuByPath.value.get(activeMenu.value);
  return activeItem ? resolveMenuLabel(activeItem) : t('admin.layout.overview');
});

const brandLabel = computed(() => route.path.startsWith('/admin/supplier-management')
  ? t('admin.layout.supplierPortal')
  : t('admin.layout.logo'));

const handleSelect = (path: string) => {
  if (!path || !path.startsWith('/')) return;
  if (path === route.path) return;
  if (import.meta.env.DEV && route.query.preview === 'supplier') {
    router.push({ path, query: { preview: 'supplier' } });
    return;
  }
  router.push(path);
};

const handleLocaleChange = (lang: AdminLocale) => {
  locale.value = lang;
  currentLocale.value = lang;
  localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
};

const refresh = () => {
  router.replace({ path: route.fullPath, query: { ...route.query, t: Date.now() } });
};

const handleLogout = async () => {
  clearAdminAuthState();
  delete axios.defaults.headers.common.Authorization;
  resetAdminMenuPermissions();
  ElMessage.success(t('admin.common.logoutSuccess'));
  await router.replace('/admin/login');
};

const iconMap: Record<string, Component> = {
  house: House,
  goods: Goods,
  document: Document,
  user: User,
  folderopened: FolderOpened,
  collectiontag: CollectionTag,
  collection: Collection,
  tickets: Tickets,
  ticket: Ticket,
  officebuilding: OfficeBuilding,
  userfilled: UserFilled,
  calendar: Calendar,
  list: List,
  pricetag: PriceTag,
  dataanalysis: DataAnalysis,
  location: Location,
  wallet: Wallet,
};

const resolveMenuIcon = (item: AdminMenuPermissionItem) => {
  const iconKey = item.icon?.replace(/[-_\s]/g, '').toLowerCase() || '';
  if (iconKey && iconMap[iconKey]) {
    return iconMap[iconKey];
  }
  const path = item.path || '';
  if (path.startsWith('/admin/products')) return Goods;
  if (path.startsWith('/admin/orders')) return Document;
  if (path.startsWith('/admin/users')) return User;
  if (path.startsWith('/admin/supplier-management/overview')) return DataAnalysis;
  if (path.startsWith('/admin/supplier-management/profile')) return Document;
  if (path.startsWith('/admin/supplier-management/service-area')) return Location;
  if (path.startsWith('/admin/supplier-management/staff')) return UserFilled;
  if (path.startsWith('/admin/supplier-management/schedule')) return Calendar;
  if (path.startsWith('/admin/supplier-management/orders')) return List;
  if (path.startsWith('/admin/supplier-management/pricing')) return PriceTag;
  if (path.startsWith('/admin/supplier-management/settlement')) return Wallet;
  if (path.startsWith('/admin/supplier-management')) return OfficeBuilding;
  if (path.startsWith('/admin/basic/service-areas')) return Location;
  if (path.startsWith('/admin/basic/suppliers')) return User;
  if (path.startsWith('/admin/basic/spec-types')) return Ticket;
  if (path.startsWith('/admin/basic/specs')) return Tickets;
  if (path.startsWith('/admin/basic')) return FolderOpened;
  if (path === '/admin') return House;
  return MenuIcon;
};

const menuLabelKeyByPath: Record<string, string> = {
  '/admin': 'admin.layout.overview',
  '/admin/orders': 'admin.layout.order',
  '/admin/products': 'admin.layout.product',
  '/admin/users': 'admin.layout.user',
  '/admin/basic': 'admin.layout.basicData',
  '/admin/basic/categories': 'admin.layout.categoryL1',
  '/admin/basic/subcategories': 'admin.layout.categoryL2',
  '/admin/basic/spec-types': 'admin.layout.specType',
  '/admin/basic/specs': 'admin.layout.spec',
  '/admin/basic/addon-categories': 'admin.layout.addonCategory',
  '/admin/basic/addons': 'admin.layout.addon',
  '/admin/basic/suppliers': 'admin.layout.supplier',
  '/admin/basic/service-areas': 'admin.layout.serviceAreas',
  '/admin/supplier-management': 'admin.layout.supplierManagement',
  '/admin/supplier-management/overview': 'admin.layout.supplierOverview',
  '/admin/supplier-management/profile': 'admin.layout.supplierProfile',
  '/admin/supplier-management/service-area': 'admin.layout.supplierArea',
  '/admin/supplier-management/staff': 'admin.layout.supplierStaff',
  '/admin/supplier-management/schedule': 'admin.layout.supplierSchedule',
  '/admin/supplier-management/orders': 'admin.layout.supplierOrders',
  '/admin/supplier-management/pricing': 'admin.layout.supplierPricing',
  '/admin/supplier-management/settlement': 'admin.layout.supplierSettlement',
};

const resolveMenuLabel = (item: AdminMenuPermissionItem) => {
  const key = item.path ? menuLabelKeyByPath[item.path] : '';
  if (key) return t(key);
  return item.name || '';
};

loadAdminMenuPermissions().catch((error) => {
  console.error('Failed to load admin menu permissions:', error);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,520;9..144,620&family=Sora:wght@400;500;600&display=swap');
.admin-page {
  --el-color-primary: #05152b;
  --el-color-primary-light-3: #3a4a60;
  --el-color-primary-light-5: #6d7b8d;
  --el-color-primary-light-7: #b7c0cb;
  --el-color-primary-light-8: #d7dde4;
  --el-color-primary-light-9: #eef1f4;
  --el-color-primary-dark-2: #020912;
  min-height: 100vh;
  background: #efeae2;
  color: #05152b;
  font-family: Sora, "PingFang SC", "Segoe UI", sans-serif;
}
.layout {
  height: 100vh;
}
.sidebar {
  display: flex;
  flex-direction: column;
  color: #f6f1e8;
  background:
    radial-gradient(90% 28% at 0% 0%, rgba(232, 194, 122, 0.18), transparent 46%),
    #05152b;
}
.logo {
  height: auto;
  padding: 28px 22px 8px;
  line-height: 1.1;
  text-align: left;
  color: #f6f1e8;
  font-family: Fraunces, Georgia, serif;
  font-size: 26px;
  font-weight: 520;
  letter-spacing: -0.03em;
  border-bottom: 0;
}
.logo::after {
  content: "";
  display: block;
  width: 36px;
  height: 1px;
  margin-top: 16px;
  background: #e8c27a;
}
.menu {
  flex: 1;
  padding: 10px 12px 28px;
  background: transparent;
  border-right: 0;
}
.admin-page :deep(.el-menu) {
  background: transparent;
  border-right: 0;
}
.admin-page :deep(.el-menu-item),
.admin-page :deep(.el-sub-menu__title) {
  height: 42px;
  margin: 2px 0;
  border-radius: 12px;
  color: #d7d0c4;
  background: transparent;
}
.admin-page :deep(.el-menu-item:hover),
.admin-page :deep(.el-sub-menu__title:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.admin-page :deep(.el-menu-item.is-active) {
  color: #05152b;
  background: #f4efe6;
  font-weight: 600;
}
.admin-page :deep(.el-sub-menu .el-menu) {
  background: transparent;
}
.menu-empty {
  margin: 12px;
  padding: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  border: 1px dashed rgba(255, 255, 255, 0.35);
  border-radius: 8px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 22px;
  background: rgba(247, 243, 236, 0.92);
  border-bottom: 1px solid #e4d9c8;
  backdrop-filter: blur(10px);
}
.breadcrumb {
  color: #05152b;
  font-family: Fraunces, Georgia, serif;
  font-size: 26px;
  font-weight: 520;
  letter-spacing: -0.03em;
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.actions :deep(.el-button) {
  color: #05152b;
  background: transparent;
  border-color: #d8cbb8;
  border-radius: 10px;
}
.actions :deep(.el-select__wrapper) {
  background: transparent;
  box-shadow: 0 0 0 1px #d8cbb8 inset;
}
.lang-switcher {
  width: 110px;
}
.content {
  padding: 18px 22px 28px;
  background:
    radial-gradient(80% 40% at 100% 0%, rgba(232, 194, 122, 0.16), transparent 42%),
    #efeae2;
}
.admin-page:not(.admin-page--orders-h5) .content :deep(.el-card) {
  background: #fffdf8;
  border: 1px solid #e6dccb;
  border-radius: 18px;
  box-shadow: none;
}
.admin-page:not(.admin-page--orders-h5) .content :deep(.el-table) {
  --el-table-header-bg-color: #f7f3ec;
  --el-table-header-text-color: #74685a;
  --el-table-row-hover-bg-color: #fbf8f3;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  color: #05152b;
}
.admin-page:not(.admin-page--orders-h5) .content :deep(.el-button--primary) {
  color: #f7f1e6;
  background: #05152b;
  border-color: #05152b;
}
.admin-page--orders-h5 {
  max-width: 100%;
  overflow-x: hidden;
}
.admin-page--orders-h5 .layout,
.admin-page--orders-h5 .el-container {
  max-width: 100%;
  min-width: 0;
}
.admin-page--orders-h5 .header {
  height: 48px;
  min-width: 0;
  padding: 0 12px;
}
.admin-page--orders-h5 .breadcrumb {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-page--orders-h5 .actions {
  flex: none;
  gap: 6px;
}
.admin-page--orders-h5 .lang-switcher {
  width: 78px;
}
.admin-page--orders-h5 .breadcrumb {
  position: static;
  width: auto;
  height: auto;
  overflow: hidden;
  clip: auto;
  color: #05152b;
  font-family: Sora, "PingFang SC", sans-serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
}
.admin-page--orders-h5 .actions .el-button:first-of-type {
  display: none;
}
.admin-page--orders-h5 .content {
  padding: 0;
  background: #f4f6f8;
}
.admin-page--supplier .header {
  justify-content: flex-end;
}
.admin-page--supplier .breadcrumb {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.admin-page--supplier .content {
  padding: 0;
}
</style>
