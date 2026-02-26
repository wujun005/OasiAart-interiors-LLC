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
    />
  </el-sub-menu>
  <el-menu-item v-else :index="item.path || fallbackIndex" :disabled="!item.path">
    <el-icon><component :is="iconComponent" /></el-icon>
    <span>{{ labelText }}</span>
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
</script>
