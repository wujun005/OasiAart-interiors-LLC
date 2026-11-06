<template>
  <div
    class="supplier-document-preview"
    :class="{ 'is-compact': compact }"
    :aria-busy="loading"
  >
    <p v-if="loading" class="supplier-document-preview__status" role="status">
      {{ t('admin.common.documentLoading') }}
    </p>
    <template v-else-if="!error && previewUrl">
      <img v-if="kind === 'image'" :src="previewUrl" :alt="name" @error="error = 'load'" />
      <iframe v-else :src="previewUrl" :title="name" @error="error = 'load'" />
    </template>
    <div v-else class="supplier-document-preview__fallback">
      <p :role="error === 'load' ? 'alert' : undefined">
        {{ t(error === 'load' ? 'admin.common.documentPreviewFailed' : 'admin.supplierProfile.previewUnsupported') }}
      </p>
      <div class="supplier-document-preview__actions">
        <el-button v-if="error === 'load'" @click="attempt++">{{ t('admin.common.retry') }}</el-button>
        <a v-if="downloadUrl" :href="downloadUrl" :download="name" target="_blank" rel="noopener noreferrer">
          {{ t('admin.common.documentDownload') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadPdfPreviewBlob, UnsupportedDocumentError, type DocumentKind } from '@/modules/admin/utils/documentPreview'

const props = defineProps<{
  url: string
  name: string
  kind: DocumentKind
  active: boolean
  compact?: boolean
}>()

const { t } = useI18n({ useScope: 'global' })
const previewUrl = ref('')
const loading = ref(false)
const error = ref<'' | 'load' | 'unsupported'>('')
const attempt = ref(0)
const downloadUrl = computed(() => /^(https?:\/\/|\/(?!\/))/i.test(props.url) ? props.url : '')

watch(
  () => [props.active, props.url, props.kind, attempt.value] as const,
  async ([active, url, kind], _previous, onCleanup) => {
    previewUrl.value = ''
    loading.value = false
    error.value = ''
    if (!active || !url) return
    if (kind === 'image') {
      previewUrl.value = url
      return
    }

    const controller = new AbortController()
    let disposed = false
    let objectUrl = ''
    onCleanup(() => {
      disposed = true
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    })

    loading.value = true
    try {
      const blob = await loadPdfPreviewBlob(url, controller.signal)
      if (disposed) return
      objectUrl = URL.createObjectURL(blob)
      previewUrl.value = objectUrl
    } catch (cause) {
      if (!disposed) {
        error.value = cause instanceof UnsupportedDocumentError && kind !== 'pdf' ? 'unsupported' : 'load'
      }
    } finally {
      if (!disposed) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.supplier-document-preview {
  display: grid;
  box-sizing: border-box;
  place-items: center;
  min-height: 240px;
  max-height: 78vh;
  padding: 16px;
  overflow: auto;
  background: #f3f5f8;
  color: #526070;
}
.supplier-document-preview.is-compact { min-height: 192px; padding: 13px; }
.supplier-document-preview img { max-width: 100%; max-height: 72vh; object-fit: contain; background: #fff; }
.supplier-document-preview iframe { width: 100%; height: 72vh; border: 0; background: #fff; }
.supplier-document-preview__status,
.supplier-document-preview__fallback { margin: 24px; text-align: center; }
.supplier-document-preview__actions { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 16px; }
.supplier-document-preview__actions a { color: #1f4e79; text-underline-offset: 3px; }
</style>
