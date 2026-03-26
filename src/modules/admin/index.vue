<template>
  <div class="admin-page">
    <el-container class="layout">
      <el-aside width="270px" class="sidebar">
        <div class="logo">{{ t('admin.layout.logo') }}</div>
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
  Menu as MenuIcon,
} from '@element-plus/icons-vue';
import { ADMIN_LOCALE_STORAGE_KEY, type AdminLocale } from '@/modules/admin/locales';
import PermissionMenuItem from '@/modules/admin/components/PermissionMenuItem.vue';
import {
  adminMenuState,
  loadAdminMenuPermissions,
  resetAdminMenuPermissions,
  resolveAllowedAdminPath,
  type AdminMenuPermissionItem,
} from '@/modules/admin/utils/menuPermission';

const route = useRoute();
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

const handleSelect = (path: string) => {
  if (!path || !path.startsWith('/')) return;
  if (path === route.path) return;
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
  localStorage.removeItem('token');
  localStorage.removeItem('expiresAt');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('userType');
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
  min-height: 100vh;
  background: #f6f7fb;
}
.layout {
  height: 100vh;
}
.sidebar {
  background: #1f2d3d;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-weight: 600;
  letter-spacing: 1px;
  border-bottom: 1px solid #273849;
}
.menu {
  border-right: none;
  flex: 1;
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
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
}
.breadcrumb {
  font-size: 16px;
  font-weight: 600;
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lang-switcher {
  width: 110px;
}
.content {
  padding: 20px;
}
</style>
