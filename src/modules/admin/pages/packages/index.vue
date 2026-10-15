<template>
  <div class="package-page">
    <header class="page-header">
      <div>
        <h1>{{ t('admin.packages.title') }}</h1>
        <p>{{ t('admin.packages.description') }}</p>
      </div>
      <el-button type="primary" @click="openCreate">{{ t('admin.packages.create') }}</el-button>
    </header>
    <p class="scope">{{ t('admin.packages.scope') }}</p>

    <el-table :data="rows" border :empty-text="t('admin.packages.empty')">
      <el-table-column :label="t('admin.packages.name')" min-width="180" prop="name" />
      <el-table-column :label="t('admin.packages.kind')" width="120">
        <template #default="{ row }">{{ kindLabel(row.kind) }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.packages.rule')" min-width="320">
        <template #default="{ row }">{{ ruleText(row) }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.packages.price')" width="140">
        <template #default="{ row }">{{ money(row.price) }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.packages.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" effect="light">
            {{ row.enabled ? t('admin.packages.enabled') : t('admin.packages.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.packages.actions')" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">{{ t('admin.packages.edit') }}</el-button>
          <el-button link type="danger" @click="remove(row)">{{ t('admin.packages.remove') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogOpen"
      :title="form.id ? t('admin.packages.edit') : t('admin.packages.create')"
      width="min(640px, calc(100vw - 32px))"
      append-to-body
    >
      <el-form label-position="top">
        <el-form-item :label="t('admin.packages.name')" required>
          <el-input v-model="form.name" maxlength="80" />
        </el-form-item>
        <el-form-item :label="t('admin.packages.kind')" required>
          <el-radio-group v-model="form.kind">
            <el-radio-button value="times">{{ t('admin.packages.timesKind') }}</el-radio-button>
            <el-radio-button value="combo">{{ t('admin.packages.comboKind') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="form.kind === 'times'">
          <el-form-item :label="t('admin.packages.service')" required>
            <el-select
              v-model="form.serviceId"
              class="service-select"
              filterable
              :loading="servicesLoading"
              :placeholder="t('admin.packages.servicePlaceholder')"
            >
              <el-option v-for="item in services" :key="item.id" :label="serviceLabel(item)" :value="item.id" />
            </el-select>
          </el-form-item>
          <div class="pair">
            <el-form-item :label="t('admin.packages.times')" required>
              <el-input-number v-model="form.times" :min="1" :max="99" :step="1" />
            </el-form-item>
            <el-form-item :label="t('admin.packages.validDays')" required>
              <el-input-number v-model="form.validDays" :min="1" :max="365" :step="1" />
            </el-form-item>
          </div>
        </template>
        <template v-else>
          <el-form-item :label="t('admin.packages.visits')" required>
            <div v-for="(visit, index) in form.visits" :key="index" class="visit-row">
              <el-select
                v-model="visit.serviceId"
                class="service-select"
                filterable
                :loading="servicesLoading"
                :placeholder="t('admin.packages.servicePlaceholder')"
              >
                <el-option v-for="item in services" :key="item.id" :label="serviceLabel(item)" :value="item.id" />
              </el-select>
              <el-input-number v-model="visit.times" :min="1" :max="99" :step="1" />
              <el-button link type="danger" @click="form.visits.splice(index, 1)">{{ t('admin.packages.remove') }}</el-button>
            </div>
            <el-button @click="form.visits.push({ serviceName: '', times: 1 })">{{ t('admin.packages.addVisit') }}</el-button>
          </el-form-item>
          <el-form-item :label="t('admin.packages.validDays')" required>
            <el-input-number v-model="form.validDays" :min="1" :max="365" :step="1" />
          </el-form-item>
        </template>
        <div class="pair">
          <el-form-item :label="t('admin.packages.price')">
            <el-input-number v-model="form.price" :min="0" :precision="2" :step="10" />
          </el-form-item>
          <el-form-item :label="t('admin.packages.original')">
            <el-input-number v-model="form.originalPrice" :min="0" :precision="2" :step="10" />
          </el-form-item>
        </div>
        <el-form-item :label="t('admin.packages.status')">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <p class="rule">{{ ruleText(form) }}</p>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">{{ t('admin.packages.cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ t('admin.packages.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { page as pageServices } from '@/modules/admin/api/spu'
import { pickI18nText } from '@/modules/admin/utils/i18n'

type PackageKind = 'times' | 'combo'
type PackageVisit = { serviceId: string; serviceName: string; times: number }
type PackageRow = {
  id: string
  name: string
  kind: PackageKind
  serviceId: string
  serviceName: string
  times: number
  validDays: number
  price: number
  originalPrice: number
  enabled: boolean
  visits: PackageVisit[]
}
type ServiceOption = {
  id: string
  nameI18n: Record<string, unknown>
  fallback: string
}

const STORAGE_KEY = 'hourx.admin.packageDrafts'
const { t, locale } = useI18n({ useScope: 'global' })
const services = ref<ServiceOption[]>([])
const servicesLoading = ref(false)

const seed = (): PackageRow[] => [
  {
    id: 'massage-5-30',
    name: '30 天按摩 5 次',
    kind: 'times',
    serviceId: '',
    serviceName: '按摩',
    times: 5,
    validDays: 30,
    price: 900,
    originalPrice: 1100,
    enabled: true,
    visits: [],
  },
  {
    id: 'cleaning-ac',
    name: 'Home Cleaning + AC',
    kind: 'combo',
    serviceId: '',
    serviceName: '',
    times: 0,
    validDays: 45,
    price: 542.86,
    originalPrice: 597.15,
    enabled: true,
    visits: [
      { serviceId: '', serviceName: 'Basic Home Cleaning', times: 4 },
      { serviceId: '', serviceName: 'Duct AC Cleaning', times: 1 },
    ],
  },
]

const readRows = (): PackageRow[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    // Keep the sample packages when this browser has no saved draft.
  }
  return seed()
}

const rows = ref<PackageRow[]>(readRows())
const dialogOpen = ref(false)
const form = reactive<PackageRow>({
  id: '',
  name: '',
  kind: 'times',
  serviceId: '',
  serviceName: '',
  times: 5,
  validDays: 30,
  price: 0,
  originalPrice: 0,
  enabled: true,
  visits: [],
})

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.value))
}

const serviceLabel = (item: ServiceOption) => pickI18nText(item.nameI18n, locale.value, item.fallback)
const findService = (hint: string) => {
  const text = hint.trim().toLowerCase()
  if (!text) return undefined
  const exact = services.value.find((item) => serviceLabel(item).toLowerCase() === text)
  if (exact) return exact
  return services.value.find((item) => {
    const name = serviceLabel(item).toLowerCase()
    return name.includes(text) || text.includes(name)
  })
}
const displayService = (serviceId: string, fallback: string) => {
  const found = services.value.find((item) => item.id === String(serviceId || ''))
  return found ? serviceLabel(found) : (fallback.trim() || '—')
}
const loadServices = async () => {
  servicesLoading.value = true
  try {
    const collected: ServiceOption[] = []
    let pageNum = 1
    let total = Number.POSITIVE_INFINITY
    while (collected.length < total && pageNum <= 20) {
      const res = await pageServices({ pageNum, pageSize: 200 })
      const body = res?.data ?? res ?? {}
      const list = Array.isArray(body.list) ? body.list : []
      total = typeof body.total === 'number' ? body.total : collected.length + list.length
      list.forEach((item: any) => {
        const spu = item?.spu ?? item ?? {}
        const id = spu.id ?? item?.id
        if (id == null || id === '') return
        collected.push({
          id: String(id),
          nameI18n: item?.nameI18n && typeof item.nameI18n === 'object' ? item.nameI18n : {},
          fallback: String(spu.spuName || item?.spuName || ''),
        })
      })
      if (!list.length) break
      pageNum += 1
    }
    const seen = new Set<string>()
    services.value = collected.filter((item) => {
      if (seen.has(item.id) || !serviceLabel(item)) return false
      seen.add(item.id)
      return true
    })
    rows.value.forEach((row) => {
      if (!row.serviceId && row.serviceName) {
        row.serviceId = findService(row.serviceName)?.id || ''
      }
      row.visits.forEach((visit) => {
        if (!visit.serviceId && visit.serviceName) {
          visit.serviceId = findService(visit.serviceName)?.id || ''
        }
      })
    })
  } catch (error: any) {
    ElMessage.error(error?.message || t('admin.packages.servicesFailed'))
  } finally {
    servicesLoading.value = false
  }
}
onMounted(loadServices)

const money = (value: number) => Number(value || 0).toFixed(2)
const kindLabel = (kind: PackageKind) => t(kind === 'times' ? 'admin.packages.timesKind' : 'admin.packages.comboKind')
const ruleText = (row: Pick<PackageRow, 'kind' | 'serviceId' | 'serviceName' | 'times' | 'validDays' | 'visits'>) => {
  if (row.kind === 'times') {
    return t('admin.packages.timesRule', {
      days: row.validDays || 0,
      service: displayService(row.serviceId, row.serviceName),
      times: row.times || 0,
    })
  }
  const included = row.visits
    .filter((visit) => visit.serviceId || visit.serviceName.trim())
    .map((visit) => `${displayService(visit.serviceId, visit.serviceName)} × ${visit.times}`)
    .join('，')
  return `${t('admin.packages.comboRule', { days: row.validDays || 0 })}${included ? ` ${included}` : ''}`
}

const blankForm = (): PackageRow => ({
  id: '',
  name: '',
  kind: 'times',
  serviceId: '',
  serviceName: '',
  times: 5,
  validDays: 30,
  price: 0,
  originalPrice: 0,
  enabled: true,
  visits: [{ serviceId: '', serviceName: '', times: 1 }],
})

const fillForm = (row: PackageRow) => {
  form.id = row.id
  form.name = row.name
  form.kind = row.kind
  form.serviceId = row.serviceId || findService(row.serviceName)?.id || ''
  form.serviceName = row.serviceName
  form.times = row.times
  form.validDays = row.validDays
  form.price = row.price
  form.originalPrice = row.originalPrice
  form.enabled = row.enabled
  form.visits = row.visits.map((visit) => ({
    serviceId: visit.serviceId || findService(visit.serviceName)?.id || '',
    serviceName: visit.serviceName,
    times: visit.times,
  }))
}

const openCreate = () => {
  fillForm(blankForm())
  dialogOpen.value = true
}

const openEdit = (row: PackageRow) => {
  fillForm(row)
  dialogOpen.value = true
}

const save = () => {
  const name = form.name.trim()
  const selected = services.value.find((item) => item.id === form.serviceId)
  const visits = form.visits
    .map((visit) => {
      const service = services.value.find((item) => item.id === visit.serviceId)
      return {
        serviceId: service?.id || '',
        serviceName: service ? serviceLabel(service) : '',
        times: Number(visit.times) || 0,
      }
    })
    .filter((visit) => visit.serviceId && visit.times > 0)
  const timesReady = form.kind === 'times' && Boolean(selected) && form.times > 0 && form.validDays > 0
  const comboReady = form.kind === 'combo' && visits.length > 0 && form.validDays > 0
  if (!name || (!timesReady && !comboReady)) {
    ElMessage.warning(t('admin.packages.required'))
    return
  }
  const next: PackageRow = {
    id: form.id || `pkg-${Date.now()}`,
    name,
    kind: form.kind,
    serviceId: form.kind === 'times' ? selected?.id || '' : '',
    serviceName: form.kind === 'times' && selected ? serviceLabel(selected) : '',
    times: form.kind === 'times' ? form.times : 0,
    validDays: form.validDays,
    price: Number(form.price) || 0,
    originalPrice: Number(form.originalPrice) || 0,
    enabled: form.enabled,
    visits: form.kind === 'combo' ? visits : [],
  }
  const index = rows.value.findIndex((row) => row.id === next.id)
  if (index >= 0) rows.value.splice(index, 1, next)
  else rows.value.unshift(next)
  persist()
  dialogOpen.value = false
  ElMessage.success(t('admin.packages.saved'))
}

const remove = async (row: PackageRow) => {
  try {
    await ElMessageBox.confirm(row.name, t('admin.packages.remove'), { type: 'warning' })
  } catch {
    return
  }
  rows.value = rows.value.filter((item) => item.id !== row.id)
  persist()
  ElMessage.success(t('admin.packages.removed'))
}
</script>

<style scoped>
.package-page { padding: 20px; color: #1c2433; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.page-header h1 { margin: 0 0 6px; color: #05152b; font-family: Georgia, serif; font-size: 28px; font-weight: 500; }
.page-header p, .scope, .rule { margin: 0; color: #6d7686; line-height: 1.5; }
.scope { margin: 12px 0 16px; padding: 12px 14px; border: 1px solid #f0d7a4; border-radius: 12px; background: #fff8ea; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.visit-row { display: grid; grid-template-columns: 1fr 140px auto; gap: 8px; margin-bottom: 8px; }
.service-select { width: 100%; }
.rule { margin-top: 4px; }
</style>
