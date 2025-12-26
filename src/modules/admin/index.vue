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
import { House, Document, User, Goods } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => {
  const path = route.path;
  if (path.startsWith('/admin/orders')) return '/admin/orders';
  if (path.startsWith('/admin/products')) return '/admin/products';
  if (path.startsWith('/admin/users')) return '/admin/users';
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
