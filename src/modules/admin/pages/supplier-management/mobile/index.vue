<template>
  <div class="supplier-mobile-workspace">
    <SupplierStaffOrders v-if="section === 'orders' && staffOrdersOnly" />
    <SupplierWorkspace v-else :section="section" mobile />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SupplierWorkspace from '../index.vue'
import SupplierStaffOrders from '../orders-h5.vue'
import { isSupplierStaffOrdersOnly } from '@/modules/admin/utils/menuPermission'
import type { SupplierMobileSection } from '@/modules/admin/utils/supplierMobile'

withDefaults(defineProps<{ section?: SupplierMobileSection }>(), { section: 'overview' })
const staffOrdersOnly = computed(() => isSupplierStaffOrdersOnly())
</script>

<style lang="scss" src="./workspace.scss"></style>
