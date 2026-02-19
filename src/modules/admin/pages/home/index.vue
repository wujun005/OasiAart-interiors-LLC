<template>
  <div class="page">
    <el-card>
      <div class="card-header">
        <div class="card-title">{{ t('admin.home.title') }}</div>
        <div class="card-subtitle">{{ t('admin.home.subtitle') }}</div>
      </div>
      <el-table :data="metrics" stripe border>
        <el-table-column prop="metric" :label="t('admin.home.metric')" />
        <el-table-column prop="value" :label="t('admin.home.value')" width="120" />
        <el-table-column prop="trend" :label="t('admin.home.trend')" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

const metrics = computed(() => [
  {
    metric: t('admin.home.todayOrders.metric'),
    value: 128,
    trend: t('admin.home.todayOrders.trend'),
  },
  {
    metric: t('admin.home.activeUsers.metric'),
    value: 342,
    trend: t('admin.home.activeUsers.trend'),
  },
  {
    metric: t('admin.home.refundRate.metric'),
    value: '1.8%',
    trend: t('admin.home.refundRate.trend'),
  },
]);
</script>

<style scoped>
.page {
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.card-title {
  font-size: 18px;
  font-weight: 600;
}
.card-subtitle {
  color: #888;
}
</style>
