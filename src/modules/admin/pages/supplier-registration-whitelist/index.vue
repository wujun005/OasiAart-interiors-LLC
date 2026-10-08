<template>
  <div class="whitelist-page">
    <header class="page-header">
      <div>
        <p>{{ t('admin.supplierWhitelist.eyebrow') }}</p>
        <h1>{{ t('admin.supplierWhitelist.title') }}</h1>
        <span>{{ t('admin.supplierWhitelist.description') }}</span>
      </div>
      <div class="page-header__count">
        <strong>{{ phones.length }}</strong>
        <span>{{ t('admin.supplierWhitelist.phoneCount') }}</span>
      </div>
    </header>

    <el-alert
      :title="t('admin.supplierWhitelist.warningTitle')"
      :description="t('admin.supplierWhitelist.warningDescription')"
      type="warning"
      show-icon
      :closable="false"
    />

    <section class="add-panel">
      <div>
        <h2>{{ t('admin.supplierWhitelist.addTitle') }}</h2>
        <p>{{ t('admin.supplierWhitelist.addHint') }}</p>
      </div>
      <div class="add-panel__form">
        <el-input
          v-model="phoneInput"
          clearable
          maxlength="32"
          :placeholder="t('admin.supplierWhitelist.phonePlaceholder')"
          @keyup.enter="addPhone"
        />
        <el-button type="primary" :loading="saving" @click="addPhone">
          {{ t('admin.supplierWhitelist.add') }}
        </el-button>
      </div>
    </section>

    <section class="list-panel">
      <div class="list-panel__head">
        <div>
          <h2>{{ t('admin.supplierWhitelist.listTitle') }}</h2>
          <p>{{ t('admin.supplierWhitelist.listHint') }}</p>
        </div>
        <el-button :loading="loading" @click="load">{{ t('admin.common.refresh') }}</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" border empty-text="—">
        <el-table-column type="index" width="70" :label="t('admin.supplierWhitelist.sequence')" />
        <el-table-column prop="phone" :label="t('admin.supplierWhitelist.phone')" min-width="240">
          <template #default="{ row }">
            <span class="phone-value">{{ row.phone }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierWhitelist.effect')" min-width="360">
          <template #default>
            {{ t('admin.supplierWhitelist.effectValue') }}
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.supplierWhitelist.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="removePhone(row.phone)">
              {{ t('admin.supplierWhitelist.remove') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  addSupplierRegistrationWhitelistPhone,
  listSupplierRegistrationWhitelist,
  removeSupplierRegistrationWhitelistPhone,
} from '@/modules/admin/api/supplierRegistrationWhitelist'

const { t } = useI18n({ useScope: 'global' })
const loading = ref(false)
const saving = ref(false)
const phoneInput = ref('')
const phones = ref<string[]>([])
const rows = computed(() => phones.value.map((phone) => ({ phone })))
const unwrap = (payload: any) => (
  payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
)

const applyList = (payload: any) => {
  const data = unwrap(payload)
  phones.value = Array.isArray(data) ? data.map(String) : []
}

const load = async () => {
  loading.value = true
  try {
    applyList(await listSupplierRegistrationWhitelist())
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierWhitelist.loadFailed'))
  } finally {
    loading.value = false
  }
}

const addPhone = async () => {
  const phone = phoneInput.value.trim()
  if (!phone) {
    ElMessage.warning(t('admin.supplierWhitelist.phoneRequired'))
    return
  }
  saving.value = true
  try {
    applyList(await addSupplierRegistrationWhitelistPhone(phone))
    phoneInput.value = ''
    ElMessage.success(t('admin.supplierWhitelist.added'))
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierWhitelist.saveFailed'))
  } finally {
    saving.value = false
  }
}

const removePhone = async (phone: string) => {
  try {
    await ElMessageBox.confirm(
      t('admin.supplierWhitelist.removeConfirm', { phone }),
      t('admin.supplierWhitelist.removeTitle'),
      { type: 'warning' },
    )
  } catch {
    return
  }
  try {
    applyList(await removeSupplierRegistrationWhitelistPhone(phone))
    ElMessage.success(t('admin.supplierWhitelist.removed'))
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.supplierWhitelist.saveFailed'))
  }
}

onMounted(load)
</script>

<style scoped>
.whitelist-page { display: grid; gap: 18px; color: #081a2f; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.page-header p, .page-header h1, .page-header span,
.add-panel h2, .add-panel p, .list-panel h2, .list-panel p { margin: 0; }
.page-header p { margin-bottom: 5px; color: #8a6b34; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.page-header h1 { font-size: 28px; line-height: 1.25; }
.page-header > div > span { display: block; margin-top: 8px; color: #64748b; font-size: 14px; }
.page-header__count { min-width: 130px; padding: 14px 18px; text-align: right; border: 1px solid #dfe6ee; border-radius: 14px; background: #fff; }
.page-header__count strong, .page-header__count span { display: block; }
.page-header__count strong { font-size: 26px; }
.page-header__count span { color: #64748b; font-size: 12px; }
.add-panel, .list-panel { padding: 20px; border: 1px solid #e0e7ef; border-radius: 16px; background: #fff; box-shadow: 0 10px 28px rgba(15, 35, 58, .05); }
.add-panel { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.add-panel h2, .list-panel h2 { font-size: 17px; }
.add-panel p, .list-panel p { margin-top: 5px; color: #728096; font-size: 13px; }
.add-panel__form { display: flex; gap: 10px; width: min(520px, 100%); }
.list-panel__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.phone-value { color: #0b5cad; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; }
.list-panel :deep(.el-table) { border-radius: 12px; }
@media (max-width: 760px) {
  .page-header, .add-panel { align-items: stretch; flex-direction: column; }
  .page-header__count { text-align: left; }
  .add-panel__form { width: 100%; }
}
</style>
