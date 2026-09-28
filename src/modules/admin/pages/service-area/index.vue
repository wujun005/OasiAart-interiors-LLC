<template>
  <div class="area-admin">
    <header class="area-admin__head">
      <div>
        <h1>{{ t('admin.platformServiceAreas.title') }}</h1>
        <p>{{ t('admin.platformServiceAreas.description') }}</p>
      </div>
    </header>

    <div class="area-admin__board">
      <section class="pane">
        <div class="pane__bar">
          <el-input v-model="areaKeyword" :placeholder="t('admin.platformServiceAreas.search')" clearable @keyup.enter="loadAreas" @clear="loadAreas" />
          <el-button type="primary" @click="openArea()">{{ t('admin.platformServiceAreas.addArea') }}</el-button>
        </div>
        <el-table
          :data="areas"
          v-loading="areaLoading"
          row-key="id"
          highlight-current-row
          height="640"
          @current-change="selectArea"
        >
          <el-table-column :label="t('admin.platformServiceAreas.area')" min-width="160" prop="name" />
          <el-table-column :label="t('admin.platformServiceAreas.communities')" width="110" prop="communityCount" />
          <el-table-column :label="t('admin.platformServiceAreas.status')" width="90">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                @change="toggleAreaStatus(row, Boolean($event))"
              />
            </template>
          </el-table-column>
          <el-table-column label="" width="150" align="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="openArea(row)">{{ t('admin.platformServiceAreas.edit') }}</el-button>
              <el-button link type="danger" @click.stop="removeArea(row)">{{ t('admin.platformServiceAreas.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="pane">
        <div class="pane__bar">
          <strong>{{ currentArea?.name || t('admin.platformServiceAreas.selectArea') }}</strong>
          <div>
            <el-button type="primary" :disabled="!currentArea" @click="openCommunity()">{{ t('admin.platformServiceAreas.addCommunity') }}</el-button>
          </div>
        </div>
        <el-table :data="communities" v-loading="communityLoading" row-key="id" height="640">
          <el-table-column :label="t('admin.platformServiceAreas.community')" min-width="180" prop="name" />
          <el-table-column :label="t('admin.platformServiceAreas.sort')" width="80" prop="sort" />
          <el-table-column :label="t('admin.platformServiceAreas.status')" width="90">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                @change="toggleCommunityStatus(row, Boolean($event))"
              />
            </template>
          </el-table-column>
          <el-table-column label="" width="150" align="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openCommunity(row)">{{ t('admin.platformServiceAreas.edit') }}</el-button>
              <el-button link type="danger" @click="removeCommunity(row)">{{ t('admin.platformServiceAreas.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          layout="prev, pager, next"
          :current-page="communityPageNum"
          :page-size="20"
          :total="communityTotal"
          @current-change="changeCommunityPage"
        />
      </section>
    </div>

    <el-dialog v-model="areaVisible" :title="areaForm.id ? t('admin.platformServiceAreas.editArea') : t('admin.platformServiceAreas.createArea')" width="420px">
      <el-form label-position="top">
        <el-form-item :label="t('admin.platformServiceAreas.areaName')" required>
          <el-input v-model="areaForm.name" />
        </el-form-item>
        <el-form-item :label="t('admin.platformServiceAreas.sort')">
          <el-input-number v-model="areaForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="areaVisible = false">{{ t('admin.platformServiceAreas.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitArea">{{ t('admin.platformServiceAreas.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="communityVisible" :title="communityForm.id ? t('admin.platformServiceAreas.editCommunity') : t('admin.platformServiceAreas.createCommunity')" width="420px">
      <el-form label-position="top">
        <el-form-item :label="t('admin.platformServiceAreas.communityName')" required>
          <el-input v-model="communityForm.name" />
        </el-form-item>
        <el-form-item :label="t('admin.platformServiceAreas.sort')">
          <el-input-number v-model="communityForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="communityVisible = false">{{ t('admin.platformServiceAreas.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitCommunity">{{ t('admin.platformServiceAreas.save') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  changeAreaStatus,
  changeCommunityStatus,
  deleteArea,
  deleteCommunity,
  listAreas,
  pageCommunities,
  saveArea,
  saveCommunity,
} from '@/modules/admin/api/serviceArea'

const { t } = useI18n({ useScope: 'global' })
const areas = ref<any[]>([])
const areaLoading = ref(false)
const areaKeyword = ref('')
const currentArea = ref<any>(null)
const communities = ref<any[]>([])
const communityLoading = ref(false)
const communityPageNum = ref(1)
const communityTotal = ref(0)
const saving = ref(false)
const areaVisible = ref(false)
const communityVisible = ref(false)
const areaForm = reactive({ id: 0, name: '', sort: 0 })
const communityForm = reactive({ id: 0, name: '', sort: 0 })

const loadAreas = async () => {
  areaLoading.value = true
  try {
    areas.value = (await listAreas({ keyword: areaKeyword.value || undefined })) || []
    if (!currentArea.value && areas.value[0]) selectArea(areas.value[0])
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.areaLoadFailed'))
  } finally {
    areaLoading.value = false
  }
}

const selectArea = (row: any) => {
  if (!row) return
  currentArea.value = row
  communityPageNum.value = 1
  loadCommunities()
}

const loadCommunities = async () => {
  if (!currentArea.value?.id) return
  communityLoading.value = true
  try {
    const page = await pageCommunities({
      areaId: currentArea.value.id,
      pageNum: communityPageNum.value,
      pageSize: 20,
    })
    communities.value = page?.list || []
    communityTotal.value = Number(page?.total || 0)
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.communityLoadFailed'))
  } finally {
    communityLoading.value = false
  }
}

const changeCommunityPage = (page: number) => {
  communityPageNum.value = page
  loadCommunities()
}

const openArea = (row?: any) => {
  areaForm.id = row?.id || 0
  areaForm.name = row?.name || ''
  areaForm.sort = row?.sort || 0
  areaVisible.value = true
}

const submitArea = async () => {
  if (!areaForm.name.trim()) return ElMessage.warning(t('admin.platformServiceAreas.areaNameRequired'))
  saving.value = true
  try {
    await saveArea({
      id: areaForm.id || undefined,
      name: areaForm.name.trim(),
      sort: areaForm.sort,
    })
    areaVisible.value = false
    ElMessage.success(t('admin.platformServiceAreas.areaSaved'))
    await loadAreas()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.areaSaveFailed'))
  } finally {
    saving.value = false
  }
}

const toggleAreaStatus = async (row: any, enabled: boolean) => {
  try {
    await changeAreaStatus({ id: row.id, status: enabled ? 1 : 0 })
    row.status = enabled ? 1 : 0
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.statusFailed'))
  }
}

const removeArea = async (row: any) => {
  try {
    await ElMessageBox.confirm(t('admin.platformServiceAreas.deleteAreaConfirm', { name: row.name }), t('admin.platformServiceAreas.deleteAreaTitle'))
  } catch {
    return
  }
  try {
    await deleteArea(row.id)
    if (currentArea.value?.id === row.id) currentArea.value = null
    ElMessage.success(t('admin.platformServiceAreas.deleted'))
    await loadAreas()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.deleteFailed'))
  }
}

const openCommunity = (row?: any) => {
  communityForm.id = row?.id || 0
  communityForm.name = row?.name || ''
  communityForm.sort = row?.sort || 0
  communityVisible.value = true
}

const submitCommunity = async () => {
  if (!currentArea.value || !communityForm.name.trim()) return ElMessage.warning(t('admin.platformServiceAreas.communityNameRequired'))
  saving.value = true
  try {
    await saveCommunity({
      id: communityForm.id || undefined,
      areaId: currentArea.value.id,
      name: communityForm.name.trim(),
      sort: communityForm.sort,
    })
    communityVisible.value = false
    ElMessage.success(t('admin.platformServiceAreas.communitySaved'))
    await loadCommunities()
    await loadAreas()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.communitySaveFailed'))
  } finally {
    saving.value = false
  }
}

const toggleCommunityStatus = async (row: any, enabled: boolean) => {
  try {
    await changeCommunityStatus({ id: row.id, status: enabled ? 1 : 0 })
    row.status = enabled ? 1 : 0
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.statusFailed'))
  }
}

const removeCommunity = async (row: any) => {
  try {
    await ElMessageBox.confirm(t('admin.platformServiceAreas.deleteCommunityConfirm', { name: row.name }), t('admin.platformServiceAreas.deleteCommunityTitle'))
  } catch {
    return
  }
  try {
    await deleteCommunity(row.id)
    ElMessage.success(t('admin.platformServiceAreas.deleted'))
    await loadCommunities()
    await loadAreas()
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.platformServiceAreas.deleteFailed'))
  }
}

onMounted(loadAreas)
</script>

<style scoped>
.area-admin { padding: 20px; color: #1c2433; }
.area-admin__head h1 { margin: 0 0 6px; font-size: 24px; }
.area-admin__head p { margin: 0 0 16px; color: #6d7686; }
.area-admin__board { display: grid; grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr); gap: 16px; }
.pane { padding: 14px; background: #fff; border: 1px solid #e7ebf2; border-radius: 14px; }
.pane__bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.pane__bar .el-input { width: 180px; }
@media (max-width: 980px) { .area-admin__board { grid-template-columns: 1fr; } }
</style>
