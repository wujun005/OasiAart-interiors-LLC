<template>
  <div class="admin-page">
    <el-container class="layout">
      <el-aside width="220px" class="sidebar">
        <div class="logo">后台管理</div>
        <el-menu
          :default-active="activeMenu"
          class="menu"
          router
          @select="handleSelect"
        >
          <el-menu-item index="/admin">
            <el-icon><House /></el-icon>
            <span>概览</span>
          </el-menu-item>
          <el-menu-item index="/admin/products">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/orders">
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-sub-menu index="/admin/basic">
            <template #title>
              <el-icon><FolderOpened /></el-icon>
              <span>基础数据</span>
            </template>
            <el-menu-item index="/admin/basic/categories">
              <el-icon><CollectionTag /></el-icon>
              <span>一级分类</span>
            </el-menu-item>
            <el-menu-item index="/admin/basic/subcategories">
              <el-icon><Collection /></el-icon>
              <span>二级分类</span>
            </el-menu-item>
            <el-menu-item index="/admin/basic/specs">
              <el-icon><Tickets /></el-icon>
              <span>规格</span>
            </el-menu-item>
            <el-menu-item index="/admin/basic/spec-types">
              <el-icon><Ticket /></el-icon>
              <span>规格类型</span>
            </el-menu-item>
            <el-menu-item index="/admin/basic/addon-categories">
              <el-icon><CollectionTag /></el-icon>
              <span>附加项分类</span>
            </el-menu-item>
            <el-menu-item index="/admin/basic/addons">
              <el-icon><Collection /></el-icon>
              <span>附加项</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="header">
          <div class="breadcrumb">{{ pageTitle }}</div>
          <div class="actions">
            <el-button size="small" @click="refresh">刷新</el-button>
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
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { House, Document, User, Goods, FolderOpened, CollectionTag, Collection, Tickets, Ticket } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith('/admin/orders')) return '/admin/orders';
  if (path.startsWith('/admin/products')) return '/admin/products';
  if (path.startsWith('/admin/users')) return '/admin/users';
  if (path.startsWith('/admin/basic/categories')) return '/admin/basic/categories';
  if (path.startsWith('/admin/basic/subcategories')) return '/admin/basic/subcategories';
  if (path.startsWith('/admin/basic/specs')) return '/admin/basic/specs';
  if (path.startsWith('/admin/basic/spec-types')) return '/admin/basic/spec-types';
  if (path.startsWith('/admin/basic/addon-categories')) return '/admin/basic/addon-categories';
  if (path.startsWith('/admin/basic/addons')) return '/admin/basic/addons';
  if (path.startsWith('/admin/basic')) return '/admin/basic';
  return '/admin';
});

const pageTitle = computed(() => {
  switch (activeMenu.value) {
    case '/admin/products':
      return '商品管理';
    case '/admin/orders':
      return '订单管理';
    case '/admin/users':
      return '用户管理';
    case '/admin/basic/categories':
      return '一级分类';
    case '/admin/basic/subcategories':
      return '二级分类';
    case '/admin/basic/specs':
      return '规格';
    case '/admin/basic/spec-types':
      return '规格类型';
    case '/admin/basic/addon-categories':
      return '附加项分类';
    case '/admin/basic/addons':
      return '附加项';
    default:
      return '概览';
  }
});

const handleSelect = (path: string) => {
  router.push(path);
};

const refresh = () => {
  router.replace({ path: route.fullPath, query: { ...route.query, t: Date.now() } });
};
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
  gap: 10px;
}
.content {
  padding: 20px;
}
</style>
