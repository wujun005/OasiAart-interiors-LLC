<template>
  <el-sub-menu v-if="hasChildren" :index="submenuIndex">
    <template #title>
      <el-icon><component :is="iconComponent" /></el-icon>
      <span>{{ labelText }}</span>
    </template>
    <PermissionMenuItem
      v-for="child in item.children"
      :key="child.id"
      :item="child"
      :resolve-icon="resolveIcon"
      :resolve-label="resolveLabel"
      :resolve-badge="resolveBadge"
    />
  </el-sub-menu>
  <el-menu-item v-else :index="item.path || fallbackIndex" :disabled="!item.path">
    <el-icon><component :is="iconComponent" /></el-icon>
    <span class="permission-menu-label">{{ labelText }}<em v-if="badgeText" class="permission-menu-badge">{{ badgeText }}</em></span>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { Menu as MenuIcon } from '@element-plus/icons-vue';
import type { AdminMenuPermissionItem } from '@/modules/admin/utils/menuPermission';

defineOptions({
  name: 'PermissionMenuItem',
});

const props = defineProps<{
  item: AdminMenuPermissionItem;
  resolveIcon: (item: AdminMenuPermissionItem) => Component;
  resolveLabel?: (item: AdminMenuPermissionItem) => string;
  resolveBadge?: (item: AdminMenuPermissionItem) => string;
}>();

const hasChildren = computed(
  () => Array.isArray(props.item.children) && props.item.children.length > 0,
);
const submenuIndex = computed(() => props.item.path || `menu-${props.item.id}`);
const fallbackIndex = computed(() => `menu-${props.item.id}`);
const iconComponent = computed(
  () => props.resolveIcon?.(props.item) || MenuIcon,
);
const labelText = computed(
  () => props.resolveLabel?.(props.item) || props.item.name || '',
);
const badgeText = computed(() => props.resolveBadge?.(props.item) || '');
</script>

<style scoped>
.permission-menu-label { display: flex; align-items: center; flex-wrap: wrap; gap: 5px 7px; min-width: 0; line-height: 1.5; white-space: normal; }
.permission-menu-badge { padding: 2px 6px; color: #263246; background: #edcd89; border-radius: 9px; font-size: 8px; line-height: 1.4; font-style: normal; font-weight: 650; }
</style>
