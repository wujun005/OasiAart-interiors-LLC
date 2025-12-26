<template>
  <div class="page">
    <el-card>
      <div class="card-header">
        <div class="card-title">概览</div>
        <div class="card-subtitle">快速查看核心指标</div>
      </div>
      <el-table :data="metrics" stripe border>
        <el-table-column prop="metric" label="指标" />
        <el-table-column prop="value" label="数值" width="120" />
        <el-table-column prop="trend" label="趋势" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const metrics = [
  { metric: '今日订单', value: 128, trend: '较昨日 +12%' },
  { metric: '活跃用户', value: 342, trend: '较昨日 +5%' },
  { metric: '退款率', value: '1.8%', trend: '较昨日 -0.3%' },
];
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
