<template>
  <button type="button" class="review-notice__bell" :aria-label="t('admin.reviewNotice.label')" @click="openPage">
    <el-icon><Bell /></el-icon>
    <span v-if="pendingCount" class="review-notice__count">{{ pendingCount > 99 ? '99+' : pendingCount }}</span>
  </button>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell } from '@element-plus/icons-vue'
import { platformReviewNotice } from '@/modules/admin/api/supplierWorkbench'
import { getAdminAuthStorageValue } from '@/utils/auth-state'

const POLL_MS = 10000

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const pendingCount = ref(0)
let timer = 0

const load = async () => {
  if (!getAdminAuthStorageValue('token')) return
  try {
    const board = await platformReviewNotice()
    pendingCount.value = board.pending.length
  } catch {
    // 接口暂时失败时，角标保持上一次的数量。
  }
}

const openPage = () => {
  router.push({ path: '/admin/review-notices' })
}

onMounted(() => {
  load()
  timer = window.setInterval(load, POLL_MS)
})

onUnmounted(() => {
  window.clearInterval(timer)
})
</script>

<style scoped>
.review-notice__bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid #ddd5c9;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.74);
  color: #33445a;
  cursor: pointer;
}
.review-notice__count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #e23b3b;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
}
</style>
