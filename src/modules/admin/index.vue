<template>
  <div
    class="admin-page"
    :class="{
      'admin-page--orders-h5': isOrdersH5,
      'admin-page--supplier': isSupplierPortal,
      'admin-page--collapsed': isSidebarCollapsed,
    }"
  >
    <el-container class="layout">
      <el-aside
        v-if="!isOrdersH5"
        :width="isSidebarCollapsed ? '88px' : '272px'"
        class="sidebar"
      >
        <div class="brand">
          <span class="brand__mark">
            <img
              src="/assets/images/client/hourx-mark.svg"
              :alt="isSidebarCollapsed ? 'HourX' : ''"
            />
          </span>
          <span v-show="!isSidebarCollapsed" class="brand__copy">
            <strong>HourX</strong>
            <small>{{ brandLabel }}</small>
          </span>
        </div>
        <div v-show="!isSidebarCollapsed" class="navigation-label">{{ navigationLabel }}</div>
        <el-menu
          :default-active="activeMenu"
          :default-openeds="defaultOpeneds"
          :collapse="isSidebarCollapsed"
          :collapse-transition="false"
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
        <div class="sidebar-foot">
          <span class="sidebar-foot__signal" aria-hidden="true"><i /></span>
          <span v-show="!isSidebarCollapsed" class="sidebar-foot__copy">
            <strong>{{ systemOnlineLabel }}</strong>
            <small>{{ secureConsoleLabel }}</small>
          </span>
        </div>
      </el-aside>
      <el-container class="workspace">
        <el-header class="header">
          <div class="header-leading">
            <button
              v-if="!isOrdersH5"
              type="button"
              class="sidebar-toggle"
              :aria-label="sidebarToggleLabel"
              :title="sidebarToggleLabel"
              @click="toggleSidebar"
            >
              <el-icon><component :is="isSidebarCollapsed ? Expand : Fold" /></el-icon>
            </button>
            <div class="page-heading">
              <span class="page-heading__eyebrow">{{ consoleLabel }}</span>
              <h1 class="breadcrumb">{{ pageTitle }}</h1>
            </div>
          </div>
          <div class="actions">
            <div v-if="!isOrdersH5" class="header-date">
              <span>{{ todayLabel }}</span>
              <strong>{{ formattedDate }}</strong>
            </div>
            <el-select
              v-model="currentLocale"
              size="small"
              class="lang-switcher"
              :aria-label="t('admin.common.language')"
              @change="handleLocaleChange"
            >
              <el-option value="zh" :label="t('admin.common.langZh')" />
              <el-option value="en" :label="t('admin.common.langEn')" />
            </el-select>
            <el-button
              class="header-icon-button"
              circle
              :aria-label="t('admin.common.refresh')"
              :title="t('admin.common.refresh')"
              @click="refresh"
            >
              <el-icon><Refresh /></el-icon>
            </el-button>
            <div v-if="!isOrdersH5" class="account-chip">
              <span class="account-chip__avatar">{{ accountInitial }}</span>
              <span class="account-chip__copy">
                <strong>{{ accountName }}</strong>
                <small>{{ administratorLabel }}</small>
              </span>
            </div>
            <el-button
              class="logout-button"
              :aria-label="t('admin.common.logout')"
              :title="t('admin.common.logout')"
              @click="handleLogout"
            >
              <el-icon><SwitchButton /></el-icon>
              <span>{{ t('admin.common.logout') }}</span>
            </el-button>
          </div>
        </el-header>
        <el-main class="content">
          <RouterView v-slot="{ Component: RouteComponent }">
            <Transition name="admin-route" mode="out-in">
              <component :is="RouteComponent" :key="route.fullPath" />
            </Transition>
          </RouterView>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue';
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
  Fold,
  Expand,
  Refresh,
  SwitchButton,
  Menu as MenuIcon,
} from '@element-plus/icons-vue';
import { ADMIN_LOCALE_STORAGE_KEY, type AdminLocale } from '@/modules/admin/locales';
import {
  clearAdminAuthState,
  getAdminAuthStorageValue,
} from '@/utils/auth-state';
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
const getInitialSidebarCollapsed = () => {
  try {
    return window.innerWidth < 1180 || localStorage.getItem('hourx.admin.sidebarCollapsed') === '1';
  } catch {
    return false;
  }
};
const isSidebarCollapsed = ref(getInitialSidebarCollapsed());
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

const consoleLabel = computed(() => currentLocale.value === 'zh'
  ? '运营管理中枢'
  : 'OPERATIONS CONSOLE');
const navigationLabel = computed(() => currentLocale.value === 'zh' ? '工作导航' : 'WORKSPACE');
const systemOnlineLabel = computed(() => currentLocale.value === 'zh' ? '安全会话已连接' : 'Secure session connected');
const secureConsoleLabel = computed(() => currentLocale.value === 'zh' ? '安全运营环境' : 'Secure operations');
const administratorLabel = computed(() => currentLocale.value === 'zh' ? '管理员' : 'Administrator');
const todayLabel = computed(() => currentLocale.value === 'zh' ? '今天' : 'Today');
const sidebarToggleLabel = computed(() => {
  if (isSidebarCollapsed.value) {
    return currentLocale.value === 'zh' ? '展开侧边栏' : 'Expand sidebar';
  }
  return currentLocale.value === 'zh' ? '收起侧边栏' : 'Collapse sidebar';
});
const formattedDate = computed(() => new Intl.DateTimeFormat(
  currentLocale.value === 'zh' ? 'zh-CN' : 'en-GB',
  { month: 'short', day: '2-digit', weekday: 'short' },
).format(new Date()));
const accountName = computed(() => getAdminAuthStorageValue('username') || 'HourX Admin');
const accountInitial = computed(() => accountName.value.trim().charAt(0).toUpperCase() || 'H');

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  try {
    localStorage.setItem(
      'hourx.admin.sidebarCollapsed',
      isSidebarCollapsed.value ? '1' : '0',
    );
  } catch {
    // The layout remains usable when browser storage is unavailable.
  }
};

const handleViewportResize = () => {
  if (window.innerWidth < 760) {
    isSidebarCollapsed.value = true;
  }
};

onMounted(() => window.addEventListener('resize', handleViewportResize, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('resize', handleViewportResize));

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
.admin-page {
  --el-color-primary: var(--hx-midnight-900, #06182d);
  --el-color-primary-light-3: #465b70;
  --el-color-primary-light-5: #82909f;
  --el-color-primary-light-7: #bec6cd;
  --el-color-primary-light-8: #d9dee2;
  --el-color-primary-light-9: #f0f2f4;
  --el-color-primary-dark-2: #031121;
  min-height: 100vh;
  overflow: hidden;
  color: var(--hx-ink, #0a1d33);
  background: var(--hx-ivory-100, #f9f5ed);
  font-family: var(--hx-font-sans, Inter, "PingFang SC", "Microsoft YaHei", sans-serif);
}

.layout {
  height: 100vh;
  height: 100dvh;
  min-width: 0;
}

.sidebar {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f9f5ed;
  border-right: 1px solid rgba(226, 194, 132, 0.16);
  background:
    radial-gradient(circle at 6% 0%, rgba(235, 196, 120, 0.18), transparent 25%),
    radial-gradient(circle at 105% 68%, rgba(35, 142, 157, 0.12), transparent 34%),
    linear-gradient(160deg, #0b2440 0%, #06182e 46%, #03101f 100%);
  box-shadow: 20px 0 60px rgba(4, 18, 35, 0.1);
  transition: width 0.28s cubic-bezier(0.2, 0.75, 0.25, 1);
}

.sidebar::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.14;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, #000, transparent 72%);
}

.brand {
  min-height: 91px;
  box-sizing: border-box;
  padding: 22px 20px 16px;
  display: flex;
  align-items: center;
  gap: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.brand__mark {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  background: linear-gradient(145deg, #fff 0%, #eee7db 100%);
  box-shadow:
    0 13px 30px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 #fff;
}

.brand__mark img {
  width: 31px;
  height: 31px;
  object-fit: contain;
}

.brand__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand__copy strong {
  color: #fffdf8;
  font-family: "Iowan Old Style", "Songti SC", Georgia, serif;
  font-size: 24px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.brand__copy small {
  max-width: 165px;
  overflow: hidden;
  color: rgba(240, 230, 213, 0.56);
  font-size: 10px;
  line-height: 1.2;
  font-weight: 650;
  letter-spacing: 0.12em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.navigation-label {
  padding: 22px 24px 8px;
  color: rgba(235, 214, 175, 0.68);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.menu {
  min-height: 0;
  flex: 1;
  padding: 4px 12px 20px;
  overflow-x: hidden;
  overflow-y: auto;
  background: transparent;
  border-right: 0;
}

.admin-page :deep(.el-menu) {
  background: transparent;
  border-right: 0;
}

.admin-page :deep(.el-menu-item),
.admin-page :deep(.el-sub-menu__title) {
  position: relative;
  height: 46px;
  margin: 3px 0;
  padding-right: 14px;
  border-radius: 13px;
  color: rgba(242, 236, 225, 0.7);
  background: transparent;
  font-size: 13.5px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.admin-page :deep(.el-menu-item .el-icon),
.admin-page :deep(.el-sub-menu__title .el-icon) {
  width: 20px;
  color: rgba(232, 194, 122, 0.72);
  font-size: 18px;
}

.admin-page :deep(.el-menu-item:hover),
.admin-page :deep(.el-sub-menu__title:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.07);
  transform: translateX(2px);
}

.admin-page :deep(.el-menu-item.is-active) {
  color: #fff;
  background:
    linear-gradient(90deg, rgba(216, 176, 100, 0.2), rgba(255, 255, 255, 0.07));
  box-shadow:
    inset 0 0 0 1px rgba(234, 200, 136, 0.16),
    0 8px 22px rgba(0, 0, 0, 0.12);
  font-weight: 650;
}

.admin-page :deep(.el-menu-item.is-active::before) {
  content: "";
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(to bottom, #f4d69d, #b98a3e);
  box-shadow: 0 0 14px rgba(232, 194, 122, 0.62);
}

.admin-page :deep(.el-menu-item.is-active .el-icon) {
  color: #f2cf8d;
}

.admin-page :deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
  padding-left: 50px !important;
  color: rgba(242, 236, 225, 0.6);
  font-size: 12.5px;
}

.admin-page :deep(.el-menu--collapse) {
  width: auto;
}

.admin-page :deep(.el-menu--collapse > .el-menu-item),
.admin-page :deep(.el-menu--collapse > .el-sub-menu > .el-sub-menu__title) {
  justify-content: center;
  padding: 0 !important;
}

.admin-page :deep(.el-menu--collapse .el-icon) {
  margin: 0;
}

.menu-empty {
  margin: 12px;
  padding: 13px;
  color: rgba(255, 255, 255, 0.64);
  border: 1px dashed rgba(255, 255, 255, 0.22);
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.55;
}

.sidebar-foot {
  min-height: 76px;
  margin: 0 12px 14px;
  padding: 14px 13px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.045);
  backdrop-filter: blur(12px);
}

.sidebar-foot__signal {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: rgba(62, 169, 132, 0.14);
}

.sidebar-foot__signal i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #63c69e;
  box-shadow: 0 0 0 5px rgba(99, 198, 158, 0.12), 0 0 15px rgba(99, 198, 158, 0.48);
  animation: status-pulse 2.6s ease-in-out infinite;
}

.sidebar-foot__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sidebar-foot__copy strong {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.82);
  font-size: 11.5px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-foot__copy small {
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
}

.admin-page--collapsed .brand {
  justify-content: center;
  padding-inline: 0;
}

.admin-page--collapsed .sidebar-foot {
  justify-content: center;
  padding-inline: 0;
}

.workspace {
  min-width: 0;
}

.header {
  position: relative;
  z-index: 15;
  height: 80px;
  padding: 0 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid rgba(171, 148, 112, 0.2);
  background: rgba(249, 247, 243, 0.88);
  box-shadow: 0 8px 28px rgba(31, 36, 42, 0.035);
  backdrop-filter: blur(18px) saturate(135%);
}

.header-leading,
.actions {
  display: flex;
  align-items: center;
}

.header-leading {
  min-width: 0;
  gap: 14px;
}

.sidebar-toggle {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  padding: 0;
  display: grid;
  place-items: center;
  color: #33445a;
  border: 1px solid #ddd5c9;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(10, 28, 48, 0.04);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.sidebar-toggle:hover {
  border-color: #baa274;
  box-shadow: 0 8px 20px rgba(10, 28, 48, 0.08);
  transform: translateY(-1px);
}

.page-heading {
  min-width: 0;
}

.page-heading__eyebrow {
  display: block;
  margin-bottom: 4px;
  color: #9b7b45;
  font-size: 9.5px;
  line-height: 1;
  font-weight: 760;
  letter-spacing: 0.15em;
}

.breadcrumb {
  margin: 0;
  max-width: 480px;
  overflow: hidden;
  color: #07182d;
  font-family: "Iowan Old Style", "Songti SC", Georgia, serif;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  flex: none;
  gap: 9px;
}

.header-date {
  min-width: 104px;
  padding-right: 17px;
  margin-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-right: 1px solid #ded7cc;
  text-align: right;
}

.header-date span {
  color: #9b8e7d;
  font-size: 9px;
  font-weight: 720;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.header-date strong {
  color: #334155;
  font-size: 11.5px;
  font-weight: 650;
}

.lang-switcher {
  width: 112px;
}

.actions :deep(.el-select__wrapper) {
  min-height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 0 0 1px #ddd5c9 inset, 0 4px 14px rgba(10, 28, 48, 0.035);
}

.actions :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #a88b56 inset, 0 0 0 3px rgba(186, 148, 78, 0.09);
}

.actions :deep(.el-button) {
  min-height: 40px;
  border-radius: 12px;
}

.header-icon-button {
  width: 40px;
  color: #33445a;
  border-color: #ddd5c9;
  background: rgba(255, 255, 255, 0.74);
}

.account-chip {
  height: 42px;
  padding: 0 11px 0 5px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #ded7cc;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.66);
}

.account-chip__avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: #f9f2e6;
  border-radius: 10px;
  background: linear-gradient(145deg, #183a5c, #07182d);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.17);
  font-size: 12px;
  font-weight: 760;
}

.account-chip__copy {
  max-width: 116px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.account-chip__copy strong,
.account-chip__copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-chip__copy strong {
  color: #203247;
  font-size: 11.5px;
  font-weight: 700;
}

.account-chip__copy small {
  color: #8d8172;
  font-size: 9.5px;
}

.logout-button {
  padding: 0 14px;
  color: #5e5040;
  border-color: #d9d0c3;
  background: transparent;
}

.logout-button:hover {
  color: #fff;
  border-color: #7e3d45;
  background: #7e3d45;
}

.content {
  position: relative;
  min-width: 0;
  padding: 24px 26px 34px;
  overflow: auto;
  background:
    radial-gradient(circle at 98% 0%, rgba(215, 174, 96, 0.17), transparent 25%),
    radial-gradient(circle at 8% 100%, rgba(30, 111, 122, 0.07), transparent 28%),
    linear-gradient(135deg, #f3f0ea 0%, #ece7df 100%);
}

.content::before {
  content: "";
  position: fixed;
  right: -150px;
  top: 110px;
  width: 420px;
  height: 420px;
  border: 1px solid rgba(172, 137, 76, 0.08);
  border-radius: 50%;
  box-shadow: 0 0 0 54px rgba(172, 137, 76, 0.025), 0 0 0 108px rgba(172, 137, 76, 0.018);
  pointer-events: none;
}

.admin-route-enter-active,
.admin-route-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.admin-route-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.admin-route-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.admin-page--orders-h5 {
  max-width: 100%;
  overflow-x: hidden;
}

.admin-page--orders-h5 .layout,
.admin-page--orders-h5 .workspace {
  max-width: 100%;
  min-width: 0;
}

.admin-page--orders-h5 .header {
  height: 48px;
  min-width: 0;
  padding: 0 12px;
  gap: 8px;
}

.admin-page--orders-h5 .page-heading__eyebrow {
  display: none;
}

.admin-page--orders-h5 .breadcrumb {
  max-width: 124px;
  color: #07182d;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.admin-page--orders-h5 .actions {
  flex: none;
  gap: 6px;
}

.admin-page--orders-h5 .lang-switcher {
  width: 80px;
}

.admin-page--orders-h5 .actions :deep(.el-select__wrapper),
.admin-page--orders-h5 .actions :deep(.el-button) {
  min-height: 34px;
}

.admin-page--orders-h5 .logout-button {
  width: 36px;
  padding: 0;
}

.admin-page--orders-h5 .logout-button span {
  display: none;
}

.admin-page--orders-h5 .content {
  padding: 0;
  background: #f4f6f8;
}

.admin-page--orders-h5 .content::before {
  display: none;
}

.admin-page--supplier .page-heading {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.admin-page--supplier .content {
  padding: 0;
}

.admin-page--supplier .content::before {
  display: none;
}

@keyframes status-pulse {
  0%, 100% { transform: scale(0.9); opacity: 0.76; }
  50% { transform: scale(1.08); opacity: 1; }
}

@media (max-width: 1340px) {
  .header-date {
    display: none;
  }

  .account-chip__copy {
    display: none;
  }

  .account-chip {
    width: 42px;
    padding: 4px;
  }

  .account-chip__avatar {
    width: 32px;
  }
}

@media (max-width: 980px) {
  .header {
    padding-inline: 16px;
  }

  .page-heading__eyebrow,
  .logout-button span {
    display: none;
  }

  .breadcrumb {
    max-width: 220px;
    font-family: inherit;
    font-size: 17px;
    font-weight: 720;
  }

  .logout-button {
    width: 40px;
    padding: 0;
  }

  .content {
    padding: 18px;
  }
}

@media (max-width: 760px) {
  .sidebar-toggle,
  .header-icon-button,
  .account-chip {
    display: none;
  }

  .header {
    gap: 10px;
  }

  .header-leading {
    gap: 8px;
  }

  .breadcrumb {
    max-width: 150px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-toggle,
  .admin-page :deep(.el-menu-item),
  .admin-page :deep(.el-sub-menu__title),
  .admin-route-enter-active,
  .admin-route-leave-active {
    transition: none !important;
  }

  .sidebar-foot__signal i {
    animation: none;
  }
}
</style>
