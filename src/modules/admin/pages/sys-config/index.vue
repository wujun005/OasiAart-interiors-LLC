<template>
  <div class="config-page">
    <header class="page-header">
      <div>
        <p>{{ t('admin.sysConfig.description') }}</p>
        <h1>{{ t('admin.sysConfig.title') }}</h1>
      </div>
      <el-button type="primary" @click="openCreate">{{ t('admin.sysConfig.create') }}</el-button>
    </header>

    <section class="toolbar">
      <el-input
        v-model="keyword"
        clearable
        :placeholder="t('admin.sysConfig.keyword')"
        @keyup.enter="load"
        @clear="load"
      />
      <el-select v-model="statusFilter" @change="load">
        <el-option :label="t('admin.sysConfig.allStatus')" value="all" />
        <el-option :label="t('admin.sysConfig.enabled')" value="true" />
        <el-option :label="t('admin.sysConfig.disabled')" value="false" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="load">{{ t('admin.sysConfig.search') }}</el-button>
    </section>

    <el-table v-loading="loading" :data="rows" border>
      <el-table-column :label="t('admin.sysConfig.key')" prop="configKey" min-width="180" show-overflow-tooltip />
      <el-table-column :label="t('admin.sysConfig.value')" prop="configValue" min-width="220" show-overflow-tooltip />
      <el-table-column :label="t('admin.sysConfig.note')" prop="description" min-width="200" show-overflow-tooltip />
      <el-table-column :label="t('admin.sysConfig.status')" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'" effect="light">
            {{ row.status ? t('admin.sysConfig.enabled') : t('admin.sysConfig.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.sysConfig.updated')" width="170">
        <template #default="{ row }">{{ formatTime(row.modifyTime || row.createTime) }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.sysConfig.actions')" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">{{ t('admin.sysConfig.edit') }}</el-button>
          <el-button link type="danger" @click="remove(row)">{{ t('admin.sysConfig.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogOpen"
      :title="form.id ? t('admin.sysConfig.edit') : t('admin.sysConfig.create')"
      width="min(520px, calc(100vw - 32px))"
      append-to-body
    >
      <el-form label-position="top">
        <el-form-item :label="t('admin.sysConfig.key')" required>
          <el-input v-model="form.configKey" maxlength="128" />
        </el-form-item>
        <el-form-item :label="t('admin.sysConfig.value')">
          <el-input v-model="form.configValue" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item :label="t('admin.sysConfig.note')">
          <el-input v-model="form.description" maxlength="512" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="t('admin.sysConfig.status')">
          <el-switch v-model="form.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">{{ t('admin.sysConfig.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ t('admin.sysConfig.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { createSysConfig, deleteSysConfig, listSysConfigs, updateSysConfig } from '@/modules/admin/api/sys-config'

type ConfigRow = {
  id?: number | string
  configKey?: string
  configValue?: string
  description?: string
  status?: boolean
  createTime?: string
  modifyTime?: string
}

const { t } = useI18n({ useScope: 'global' })
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const keyword = ref('')
const statusFilter = ref<'all' | 'true' | 'false'>('all')
const rows = ref<ConfigRow[]>([])
const form = reactive({ id: '' as number | string | '', configKey: '', configValue: '', description: '', status: true })
const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)

const formatTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const load = async () => {
  loading.value = true
  try {
    const status = statusFilter.value === 'all' ? undefined : statusFilter.value === 'true'
    const data = unwrap(await listSysConfigs({ keyword: keyword.value.trim() || undefined, status }))
    rows.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.sysConfig.loadFailed'))
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  form.id = ''
  form.configKey = ''
  form.configValue = ''
  form.description = ''
  form.status = true
  dialogOpen.value = true
}

const openEdit = (row: ConfigRow) => {
  form.id = row.id ?? ''
  form.configKey = row.configKey || ''
  form.configValue = row.configValue || ''
  form.description = row.description || ''
  form.status = row.status !== false
  dialogOpen.value = true
}

const save = async () => {
  const configKey = form.configKey.trim()
  if (!configKey) {
    ElMessage.warning(t('admin.sysConfig.keyRequired'))
    return
  }
  saving.value = true
  try {
    const payload = {
      configKey,
      configValue: form.configValue,
      description: form.description.trim(),
      status: form.status,
    }
    if (form.id === '') await createSysConfig(payload)
    else await updateSysConfig({ id: form.id, ...payload })
    ElMessage.success(t('admin.sysConfig.saved'))
    dialogOpen.value = false
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.sysConfig.saveFailed'))
  } finally {
    saving.value = false
  }
}

const remove = async (row: ConfigRow) => {
  if (row.id == null) return
  try {
    await ElMessageBox.confirm(t('admin.sysConfig.deleteConfirm', { key: row.configKey || row.id }), t('admin.sysConfig.delete'))
  } catch {
    return
  }
  try {
    await deleteSysConfig(row.id)
    ElMessage.success(t('admin.sysConfig.deleted'))
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.sysConfig.deleteFailed'))
  }
}

onMounted(load)
</script>

<style scoped>
.config-page { display: grid; gap: 16px; color: #05152b; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.page-header p { margin: 0 0 4px; color: #74685a; font-size: 13px; }
.page-header h1 { margin: 0; font-size: 28px; }
.toolbar { display: flex; gap: 10px; }
.toolbar .el-input { max-width: 320px; }
.toolbar .el-select { width: 160px; }
.config-page :deep(.el-table) { border-radius: 12px; }
</style>
