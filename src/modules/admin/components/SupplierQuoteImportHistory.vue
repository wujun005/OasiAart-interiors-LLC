<template>
  <el-dialog
    v-model="dialogVisible"
    class="quote-history-dialog"
    width="min(960px, 94vw)"
    :title="t('admin.platformSuppliers.quoteHistory.title')"
    append-to-body
    destroy-on-close
  >
    <section class="quote-history" :aria-busy="loading">
      <header class="quote-history__header">
        <div>
          <span class="quote-history__eyebrow">{{ t('admin.platformSuppliers.quoteHistory.supplier') }}</span>
          <h3>{{ supplierName || (validSupplierId ? `#${supplierId}` : '—') }}</h3>
          <p>{{ t('admin.platformSuppliers.quoteHistory.hint') }}</p>
        </div>
        <el-button :loading="loading" :disabled="!validSupplierId" @click="loadRecords">
          {{ t('admin.platformSuppliers.quoteHistory.refresh') }}
        </el-button>
      </header>

      <div class="quote-history__meta">
        <span v-if="!loading && !error">{{ t('admin.platformSuppliers.quoteHistory.count', { count: records.length }) }}</span>
        <span class="quote-history__time-zone">{{ t('admin.platformSuppliers.quoteHistory.timeZone') }}</span>
      </div>

      <div v-if="loading" class="quote-history__state" role="status">
        <span class="quote-history__spinner" aria-hidden="true" />
        {{ t('admin.platformSuppliers.quoteHistory.loading') }}
      </div>
      <div v-else-if="error" class="quote-history__state quote-history__state--error" role="alert">
        <strong>{{ t('admin.platformSuppliers.quoteHistory.loadFailed') }}</strong>
        <p v-if="error !== t('admin.platformSuppliers.quoteHistory.loadFailed')">{{ error }}</p>
        <el-button :disabled="!validSupplierId" @click="loadRecords">
          {{ t('admin.platformSuppliers.quoteHistory.retry') }}
        </el-button>
      </div>
      <el-empty v-else-if="!records.length" :image-size="64" :description="t('admin.platformSuppliers.quoteHistory.empty')" />
      <template v-else>
        <div class="quote-history__list">
          <article v-for="row in pagedRows" :key="row.key" class="quote-history__card">
            <header class="quote-history__card-header">
              <div class="quote-history__identity">
                <span class="quote-history__source">{{ row.sourceLabel }}</span>
                <span class="quote-history__status" :class="`is-${row.statusTone}`">{{ row.statusLabel }}</span>
              </div>
              <time>{{ row.operateTime || '—' }}</time>
            </header>
            <p class="quote-history__operator">
              <span>{{ t('admin.platformSuppliers.quoteHistory.operator') }}</span>
              {{ row.operatorLabel }}
            </p>
            <dl class="quote-history__counts">
              <div>
                <dt>{{ t('admin.platformSuppliers.quoteHistory.serviceCount') }}</dt>
                <dd>{{ row.counts.services }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.platformSuppliers.quoteHistory.skuCount') }}</dt>
                <dd>{{ row.counts.skus }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.platformSuppliers.quoteHistory.skippedCount') }}</dt>
                <dd>{{ row.counts.skipped }}</dd>
              </div>
            </dl>
            <div class="quote-history__file">
              <span>{{ t('admin.platformSuppliers.quoteHistory.file') }}</span>
              <strong>{{ row.fileName || '—' }}</strong>
              <a
                v-if="row.fileUrl"
                :href="row.fileUrl"
                :download="row.fileName || undefined"
                target="_blank"
                rel="noopener noreferrer"
              >{{ t('admin.platformSuppliers.quoteHistory.download') }}</a>
              <small v-else>{{ t('admin.platformSuppliers.quoteHistory.noSnapshot') }}</small>
            </div>
            <p v-if="row.errorText" class="quote-history__error">{{ row.errorText }}</p>
            <details v-if="row.messages.length || row.content" class="quote-history__details">
              <summary>{{ t('admin.platformSuppliers.quoteHistory.details') }}</summary>
              <ul v-if="row.messages.length">
                <li v-for="(message, index) in row.messages" :key="index">{{ message }}</li>
              </ul>
              <p v-if="row.content">{{ row.content }}</p>
            </details>
          </article>
        </div>
        <el-pagination
          v-model:current-page="page"
          class="quote-history__pagination"
          :page-size="pageSize"
          :total="records.length"
          layout="prev, pager, next"
          :pager-count="5"
          hide-on-single-page
          small
        />
      </template>
    </section>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  listPlatformQuoteImports,
  type SupplierQuoteImportLog,
} from '@/modules/admin/api/supplierWorkbench'
import { pickI18nText } from '@/modules/admin/utils/i18n'

const props = defineProps<{
  modelValue: boolean
  supplierId: number
  supplierName?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const { t, locale } = useI18n({ useScope: 'global' })
const records = ref<SupplierQuoteImportLog[]>([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = 10
let requestSequence = 0

const validSupplierId = computed(() => Number.isSafeInteger(props.supplierId) && props.supplierId > 0)
const invalidateAndClear = () => {
  requestSequence += 1
  records.value = []
  loading.value = false
  error.value = ''
  page.value = 1
}
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (!value) invalidateAndClear()
    emit('update:modelValue', value)
  },
})

const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
const safeFileUrl = (value: unknown) => {
  const candidate = text(value)
  if (!candidate || /[\u0000-\u001f\u007f]/.test(candidate)) return ''
  try {
    const url = new URL(candidate)
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}
const countText = (value: unknown) => {
  if (!text(value)) return '—'
  const count = Number(value)
  return Number.isSafeInteger(count) && count >= 0 ? String(count) : '—'
}
const messageLines = (value: unknown) => (Array.isArray(value) ? value : [value]).map(text).filter(Boolean)
const historyRows = computed(() => records.value.map((row, index) => {
  const source = text(row.importBy).toUpperCase()
  const sourceFallback = source === 'PLATFORM'
    ? t('admin.platformSuppliers.quoteHistory.platform')
    : source === 'SUPPLIER'
      ? t('admin.platformSuppliers.quoteHistory.supplierSource')
      : t('admin.platformSuppliers.quoteHistory.unknownSource')
  const operatorName = text(row.operatorName)
  const operatorId = text(row.operatorId)
  const messages = messageLines(row.messages)
  const errorText = text(row.error)
  const status = errorText ? 'failed' : messages.length ? 'hasMessages' : 'processed'
  return {
    key: `${text(row.id) || 'record'}:${index}`,
    sourceLabel: pickI18nText(row.importByI18n, locale.value, sourceFallback),
    operatorLabel: [operatorName, operatorId ? `#${operatorId}` : ''].filter(Boolean).join(' · ') || '—',
    operateTime: text(row.operateTime),
    fileName: text(row.fileName),
    fileUrl: safeFileUrl(row.fileUrl),
    counts: { services: countText(row.serviceCount), skus: countText(row.skuCount), skipped: countText(row.skippedCount) },
    errorText,
    messages,
    content: pickI18nText(row.contentI18n, locale.value),
    statusLabel: t(`admin.platformSuppliers.quoteHistory.${status}`),
    statusTone: errorText ? 'failed' : messages.length ? 'warning' : 'processed',
  }
}))
const pagedRows = computed(() => historyRows.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const loadRecords = async () => {
  if (!props.modelValue || !validSupplierId.value) return
  const supplierId = props.supplierId
  const sequence = ++requestSequence
  records.value = []
  page.value = 1
  error.value = ''
  loading.value = true
  const isCurrent = () => sequence === requestSequence && props.modelValue && props.supplierId === supplierId
  try {
    const result = await listPlatformQuoteImports(supplierId)
    if (!isCurrent()) return
    if (!Array.isArray(result)) throw new Error(t('admin.platformSuppliers.quoteHistory.loadFailed'))
    records.value = result.filter((row) => row && typeof row === 'object' && !Array.isArray(row)
      && (row.supplierId == null || Number(row.supplierId) === supplierId))
  } catch (failure) {
    if (!isCurrent()) return
    records.value = []
    error.value = failure instanceof Error ? failure.message : text((failure as { message?: unknown } | null)?.message)
    if (!error.value) error.value = t('admin.platformSuppliers.quoteHistory.loadFailed')
  } finally {
    if (isCurrent()) loading.value = false
  }
}

watch(() => [props.modelValue, props.supplierId] as const, ([open]) => {
  invalidateAndClear()
  if (!open) return
  if (validSupplierId.value) void loadRecords()
  else error.value = t('admin.platformSuppliers.quoteHistory.loadFailed')
}, { immediate: true, flush: 'sync' })
onBeforeUnmount(invalidateAndClear)
</script>

<style scoped>
.quote-history-dialog {
  --el-color-primary: #102a43;
  --el-dialog-bg-color: #fbf8f2;
  --el-dialog-border-radius: 18px;
}

.quote-history {
  color: #24374b;
  font-family: var(--hx-font-sans, Inter, "PingFang SC", "Microsoft YaHei", sans-serif);
  font-size: 12px;
  font-variant-numeric: normal;
}

.quote-history__header,
.quote-history__card-header,
.quote-history__identity,
.quote-history__meta,
.quote-history__file {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quote-history__header {
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.quote-history__header > div {
  min-width: 0;
}

.quote-history__eyebrow {
  color: #8b7658;
  font-size: 11px;
}

.quote-history__header h3 {
  margin: 4px 0 6px;
  color: #102a43;
  font-size: 17px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.quote-history__header p {
  margin: 0;
  color: #7a7469;
  line-height: 1.6;
}

.quote-history__header :deep(.el-button) {
  flex-shrink: 0;
  height: 30px;
  padding: 0 12px;
  border-radius: 9px;
  font-size: 12px;
}

.quote-history__meta {
  justify-content: space-between;
  min-height: 34px;
  margin: 10px 0 4px;
  color: #8b8172;
  font-size: 11px;
}

.quote-history__time-zone {
  margin-left: auto;
}

.quote-history__list {
  display: grid;
  gap: 10px;
  max-height: min(56vh, 560px);
  overflow-y: auto;
  padding: 1px 4px 2px 1px;
  overscroll-behavior: contain;
}

.quote-history__card {
  min-width: 0;
  padding: 13px 15px;
  border: 1px solid #e7dfd2;
  border-radius: 12px;
  background: #fffdf9;
}

.quote-history__card-header {
  justify-content: space-between;
  flex-wrap: wrap;
}

.quote-history__identity {
  flex-wrap: wrap;
}

.quote-history__source,
.quote-history__status {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.4;
}

.quote-history__source {
  background: #f0e9db;
  color: #6f5936;
}

.quote-history__status.is-processed {
  background: #edf2f7;
  color: #425a70;
}

.quote-history__status.is-warning {
  background: #fff3d9;
  color: #926310;
}

.quote-history__status.is-failed {
  background: #fbecea;
  color: #aa3e35;
}

.quote-history__card-header time {
  color: #8b8172;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.quote-history__operator {
  margin: 9px 0 10px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.quote-history__operator > span {
  margin-right: 8px;
  color: #8b8172;
}

.quote-history__counts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 11px;
  padding: 9px 11px;
  border-radius: 8px;
  background: #f7f3ec;
}

.quote-history__counts dt {
  margin-bottom: 4px;
  color: #8b8172;
  font-size: 11px;
}

.quote-history__counts dd {
  margin: 0;
  color: #102a43;
  font-size: 13px;
  font-weight: 650;
}

.quote-history__file {
  flex-wrap: wrap;
  line-height: 1.5;
}

.quote-history__file > span,
.quote-history__file > small {
  color: #8b8172;
  font-size: 11px;
}

.quote-history__file > strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: 500;
}

.quote-history__file a {
  color: #254e74;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.quote-history__error {
  margin: 9px 0 0;
  color: #aa3e35;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.quote-history__details {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid #eee7dc;
  color: #617184;
  line-height: 1.6;
}

.quote-history__details summary {
  width: fit-content;
  color: #425a70;
  cursor: pointer;
}

.quote-history__details ul {
  margin: 7px 0 0;
  padding-left: 18px;
}

.quote-history__details li,
.quote-history__details p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.quote-history__details p {
  margin: 7px 0 0;
}

.quote-history__state {
  display: flex;
  min-height: 170px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8b8172;
}

.quote-history__state--error {
  flex-direction: column;
  gap: 9px;
  color: #aa3e35;
  text-align: center;
}

.quote-history__state--error p {
  max-width: 100%;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.quote-history__spinner {
  width: 15px;
  height: 15px;
  border: 2px solid #e7dfd2;
  border-top-color: #425a70;
  border-radius: 50%;
  animation: quote-history-spin 0.8s linear infinite;
}

.quote-history__pagination {
  justify-content: flex-end;
  padding-top: 15px;
}

@keyframes quote-history-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .quote-history__card { padding: 11px; }
  .quote-history__counts { gap: 6px; padding: 8px; }
  .quote-history__list { max-height: 52vh; }
}

@media (prefers-reduced-motion: reduce) {
  .quote-history__spinner { animation: none; }
}
</style>
