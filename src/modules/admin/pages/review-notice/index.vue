<template>
  <div class="review-page">
    <header class="review-page__head">
      <h1>{{ t('admin.reviewNotice.label') }}</h1>
      <p>{{ t('admin.reviewNotice.pageDesc') }}</p>
    </header>

    <section class="board">
      <div class="review-tabs">
        <button type="button" :class="{ on: tab === 'pending' }" @click="switchTab('pending')">
          {{ t('admin.reviewNotice.pending') }}
          <span>{{ pending.length }}</span>
        </button>
        <button type="button" :class="{ on: tab === 'records' }" @click="switchTab('records')">
          {{ t('admin.reviewNotice.records') }}
          <span>{{ records.length }}</span>
        </button>
      </div>

      <el-table :data="pageItems" v-loading="loading">
        <el-table-column :label="t('admin.reviewNotice.type')" width="120">
          <template #default="{ row }">{{ kindLabel(row) }}</template>
        </el-table-column>
        <el-table-column :label="t('admin.reviewNotice.supplier')" min-width="180">
          <template #default="{ row }">
            <div class="who">
              <strong>{{ row.supplierName || '—' }}</strong>
              <small>{{ row.supplierNo || '—' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.reviewNotice.detail')" min-width="180">
          <template #default="{ row }">{{ itemTitle(row) }}</template>
        </el-table-column>
        <el-table-column :label="tab === 'records' ? t('admin.reviewNotice.reviewedAt') : t('admin.reviewNotice.submitted')" width="170">
          <template #default="{ row }">{{ formatTime(tab === 'records' ? row.reviewTime : row.submitTime) }}</template>
        </el-table-column>
        <el-table-column v-if="tab === 'records'" :label="t('admin.reviewNotice.handler')" min-width="140">
          <template #default="{ row }">{{ row.reviewerName || t('admin.reviewNotice.unknownReviewer') }}</template>
        </el-table-column>
        <el-table-column v-if="tab === 'records'" :label="t('admin.reviewNotice.result')" width="110">
          <template #default="{ row }">{{ resultLabel(row) }}</template>
        </el-table-column>
        <el-table-column v-if="tab === 'pending'" :label="t('admin.platformSuppliers.actions')" width="120">
          <template #default="{ row }">
            <button type="button" class="handle" @click="openReview(row)">{{ t('admin.reviewNotice.handle') }}</button>
          </template>
        </el-table-column>
        <template #empty>
          <span>{{ tab === 'pending' ? t('admin.reviewNotice.emptyPending') : t('admin.reviewNotice.emptyRecords') }}</span>
        </template>
      </el-table>

      <el-pagination
        layout="prev, pager, next, total"
        :current-page="pageNum"
        :page-size="pageSize"
        :total="activeItems.length"
        @current-change="changePage"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { platformReviewNotice, type ReviewNoticeItem } from '@/modules/admin/api/supplierWorkbench'

const pageSize = 10
const POLL_MS = 10000

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const pending = ref<ReviewNoticeItem[]>([])
const records = ref<ReviewNoticeItem[]>([])
const loading = ref(false)
let timer = 0

const tab = computed(() => (route.query.tab === 'records' ? 'records' : 'pending'))
const pageNum = computed(() => {
  const value = Number(route.query.page || 1)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
})
const activeItems = computed(() => (tab.value === 'records' ? records.value : pending.value))
const pageItems = computed(() => {
  const start = (pageNum.value - 1) * pageSize
  return activeItems.value.slice(start, start + pageSize)
})

const kindLabel = (item: ReviewNoticeItem) => (
  item.kind === 'quote' ? t('admin.reviewNotice.quote') : t('admin.reviewNotice.onboarding')
)

const itemTitle = (item: ReviewNoticeItem) => {
  if (String(locale.value || '').startsWith('en') && item.titleEn) return item.titleEn
  return item.title || item.supplierName || '—'
}

const resultLabel = (item: ReviewNoticeItem) => (
  Number(item.status) === 3 ? t('admin.reviewNotice.rejected') : t('admin.reviewNotice.approved')
)

const formatTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const writeQuery = (nextTab: 'pending' | 'records', page: number) => {
  router.replace({ path: '/admin/review-notices', query: { tab: nextTab, page: String(page) } })
}

const switchTab = (next: 'pending' | 'records') => {
  if (next === tab.value) return
  writeQuery(next, 1)
}

const changePage = (page: number) => {
  writeQuery(tab.value, page)
}

const openReview = (item: ReviewNoticeItem) => {
  const id = String(item.supplierId || '')
  if (!id) return
  if (item.kind === 'quote') {
    router.push({ path: '/admin/basic/suppliers', query: { id, view: 'quote', spu: String(item.spuId || '') } })
    return
  }
  router.push({ path: '/admin/basic/suppliers', query: { id, tab: 'overview' } })
}

const load = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const board = await platformReviewNotice()
    pending.value = board.pending
    records.value = board.records
    const pages = Math.max(1, Math.ceil((tab.value === 'records' ? board.records : board.pending).length / pageSize))
    if (pageNum.value > pages) writeQuery(tab.value, pages)
  } catch {
    if (!silent) {
      pending.value = []
      records.value = []
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  timer = window.setInterval(() => load(true), POLL_MS)
})

onUnmounted(() => {
  window.clearInterval(timer)
})
</script>

<style scoped>
.review-page { color: #1c2433; }
.review-page__head h1 { margin: 0 0 6px; color: #05152b; font-family: Georgia, serif; font-size: 28px; font-weight: 500; }
.review-page__head p { margin: 0 0 16px; color: #6d7686; }
.board { padding: 14px; background: #fff; border: 1px solid #e7ebf2; border-radius: 14px; }
.review-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.review-tabs button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #526070;
  font: inherit;
  cursor: pointer;
}
.review-tabs button.on { border-color: #05152b; color: #05152b; font-weight: 700; }
.review-tabs span { color: #6d7686; font-size: 12px; }
.who { display: flex; flex-direction: column; gap: 2px; }
.who strong { color: #05152b; }
.who small { color: #6d7686; }
.board :deep(.el-pagination) { justify-content: flex-end; margin-top: 12px; }
.handle {
  border: 0;
  border-radius: 8px;
  background: #05152b;
  color: #fff;
  padding: 6px 12px;
  font: inherit;
  cursor: pointer;
}
</style>
