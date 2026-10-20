<template>
  <section class="staff-board" v-loading="loading">
    <header class="staff-head">
      <div>
        <h2>{{ t("admin.supplierStaff.title") }}</h2>
        <p>{{ t("admin.supplierStaff.description") }}</p>
      </div>
    </header>
    <div class="staff-add">
      <button type="button" class="add-staff" @click="openEditor()">
        <span>+</span>{{ t("admin.supplierStaff.add") }}
      </button>
    </div>

    <div class="staff-main">
      <div class="stat-grid">
        <article class="stat-card">
          <span class="stat-icon stat-icon--people" aria-hidden="true"></span>
          <div>
            <small>{{ t("admin.supplierStaff.total") }}</small>
            <strong>{{ stats.total }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <i class="status-dot status-dot--available" aria-hidden="true"></i>
          <div>
            <small>{{ t("admin.supplierStaff.available") }}</small>
            <strong>{{ stats.available }}</strong>
            <em>{{ t("admin.supplierStaff.availableHint") }}</em>
          </div>
        </article>
        <article class="stat-card">
          <i class="status-dot status-dot--onJob" aria-hidden="true"></i>
          <div>
            <small>{{ t("admin.supplierStaff.onJobs") }}</small>
            <strong>{{ stats.onJob }}</strong>
            <em>{{ t("admin.supplierStaff.onJobsHint") }}</em>
          </div>
        </article>
        <article class="stat-card">
          <i class="status-dot status-dot--offline" aria-hidden="true"></i>
          <div>
            <small>{{ t("admin.supplierStaff.away") }}</small>
            <strong>{{ stats.away }}</strong>
            <em>{{ t("admin.supplierStaff.awayHint") }}</em>
          </div>
        </article>
      </div>

      <div class="staff-filters">
        <el-input
          v-model="query"
          clearable
          :prefix-icon="Search"
          :placeholder="t('admin.supplierStaff.search')"
        />
        <el-select v-model="statusFilter">
          <el-option value="all" :label="t('admin.supplierStaff.allStatuses')" />
          <el-option value="available" :label="t('admin.supplierStaff.jobAvailable')" />
          <el-option value="onJob" :label="t('admin.supplierStaff.jobOnJob')" />
          <el-option value="offline" :label="t('admin.supplierStaff.jobOffline')" />
          <el-option value="unavailable" :label="t('admin.supplierStaff.jobUnavailable')" />
        </el-select>
        <el-select v-model="serviceFilter">
          <el-option :value="0" :label="t('admin.supplierStaff.allServices')" />
          <el-option
            v-for="service in serviceOptions"
            :key="service.id"
            :value="service.id"
            :label="labelOf(service)"
          />
        </el-select>
        <button
          type="button"
          class="more-filters"
          :class="{ 'is-open': moreOpen || accountFilter !== 'all' }"
          @click="moreOpen = !moreOpen"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5h14M6 10h8M9 15h2" />
          </svg>
          {{ t("admin.supplierStaff.moreFilters") }}
        </button>
      </div>
      <div v-if="moreOpen" class="account-filter">
        <span>{{ t("admin.supplierStaff.accountStatus") }}</span>
        <el-select v-model="accountFilter">
          <el-option value="all" :label="t('admin.supplierStaff.allAccounts')" />
          <el-option value="active" :label="t('admin.supplierStaff.accountActive')" />
          <el-option value="suspended" :label="t('admin.supplierStaff.accountSuspended')" />
        </el-select>
      </div>

      <div v-if="selected.length" class="selection-bar">
        <span>{{ t("admin.supplierStaff.selectedCount", { count: selected.length }) }}</span>
        <button v-if="selectedActive.length" type="button" @click="suspendMany">
          {{ t("admin.supplierStaff.suspendSelected") }}
        </button>
        <button v-if="selectedSuspended.length" type="button" @click="reactivateMany">
          {{ t("admin.supplierStaff.reactivateSelected") }}
        </button>
      </div>

      <div class="staff-table-card">
        <div class="staff-table-scroll">
          <table>
            <thead>
              <tr>
                <th class="check-col">
                  <input
                    type="checkbox"
                    :checked="pageSelected"
                    :aria-label="t('admin.supplierStaff.selectAll')"
                    @change="togglePage"
                  />
                </th>
                <th>{{ t("admin.supplierStaff.name") }}</th>
                <th>{{ t("admin.supplierStaff.phone") }}</th>
                <th>{{ t("admin.supplierStaff.services") }}</th>
                <th>{{ t("admin.supplierStaff.jobStatus") }}</th>
                <th>{{ t("admin.supplierStaff.todayJobs") }}</th>
                <th>{{ t("admin.supplierStaff.account") }}</th>
                <th>{{ t("admin.supplierStaff.actions") }}</th>
              </tr>
            </thead>
            <tbody v-if="pageRows.length">
              <tr v-for="row in pageRows" :key="row.id">
                <td class="check-col">
                  <input
                    type="checkbox"
                    :checked="selected.includes(row.id)"
                    :aria-label="t('admin.supplierStaff.selectRow', { name: row.name || row.phone })"
                    @change="toggleRow(row.id)"
                  />
                </td>
                <td>
                  <div class="person">
                    <span class="avatar" :style="{ background: avatarColor(row.name) }">{{
                      initials(row.name)
                    }}</span>
                    <strong>{{ row.name || "—" }}</strong>
                  </div>
                </td>
                <td class="phone">{{ prettyPhone(row.phone) }}</td>
                <td>
                  <div v-if="row.services.length" class="chips">
                    <span
                      v-for="service in row.services"
                      :key="service.id"
                      class="chip"
                      :style="chipStyle(service.id)"
                    >{{ labelOf(service) }}</span>
                  </div>
                  <span v-else class="muted">—</span>
                </td>
                <td>
                  <span v-if="row.jobStatus" class="job-status">
                    <i class="status-dot" :class="`status-dot--${row.jobStatus}`"></i>
                    {{ jobLabel(row.jobStatus) }}
                  </span>
                  <span v-else class="muted">—</span>
                </td>
                <td class="count">{{ row.todayJobCount == null ? "—" : row.todayJobCount }}</td>
                <td>
                  <span class="account-pill" :class="{ 'is-suspended': suspended(row) }">{{
                    suspended(row)
                      ? t("admin.supplierStaff.accountSuspended")
                      : t("admin.supplierStaff.accountActive")
                  }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button
                      type="button"
                      class="view-jobs"
                      :disabled="!row.adminUserId"
                      @click="viewJobs(row)"
                    >
                      {{ t("admin.supplierStaff.viewJobs") }}
                    </button>
                    <button
                      v-if="suspended(row)"
                      type="button"
                      class="reactivate"
                      @click="reactivate(row)"
                    >
                      {{ t("admin.supplierStaff.reactivate") }}
                    </button>
                    <el-dropdown trigger="click" @command="(command) => runCommand(String(command), row)">
                      <button type="button" class="more" :aria-label="t('admin.supplierStaff.moreActions')">
                        ···
                      </button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="edit">{{ t("admin.supplierStaff.edit") }}</el-dropdown-item>
                          <el-dropdown-item v-if="row.acceptJobs === false" command="available">{{
                            t("admin.supplierStaff.markAvailable")
                          }}</el-dropdown-item>
                          <el-dropdown-item v-else command="unavailable">{{
                            t("admin.supplierStaff.markUnavailable")
                          }}</el-dropdown-item>
                          <el-dropdown-item v-if="suspended(row)" command="reactivate">{{
                            t("admin.supplierStaff.reactivate")
                          }}</el-dropdown-item>
                          <el-dropdown-item v-else command="suspend">{{
                            t("admin.supplierStaff.suspend")
                          }}</el-dropdown-item>
                          <el-dropdown-item command="delete" divided>{{
                            t("admin.supplierStaff.remove")
                          }}</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!loading && !pageRows.length" class="empty">
          {{ staff.length ? t("admin.supplierStaff.emptyFiltered") : t("admin.supplierStaff.empty") }}
        </p>
        <footer class="staff-footer">
          <span>{{
            t("admin.supplierStaff.showing", { shown: pageRows.length, total: filtered.length })
          }}</span>
          <div class="pager">
            <button type="button" :disabled="page <= 1" :aria-label="t('admin.supplierStaff.prev')" @click="page -= 1">
              ‹
            </button>
            <strong>{{ page }}</strong>
            <button
              type="button"
              :disabled="page >= pageCount"
              :aria-label="t('admin.supplierStaff.next')"
              @click="page += 1"
            >
              ›
            </button>
          </div>
        </footer>
      </div>
    </div>

    <aside class="staff-rail">
      <article class="login-card">
        <strong>{{ t("admin.supplierStaff.appTitle") }}</strong>
        <p>{{ t("admin.supplierStaff.appBody") }}</p>
      </article>
      <section class="rail-block">
        <h3>{{ t("admin.supplierStaff.moreActions") }}</h3>
        <button type="button" :disabled="importing" @click="fileRef?.click()">
          <i class="rail-icon rail-icon--in"></i>
          <span><b>{{ t("admin.supplierStaff.importTitle") }}</b><small>{{ t("admin.supplierStaff.importHint") }}</small></span>
        </button>
        <button type="button" :disabled="exporting" @click="downloadSheet">
          <i class="rail-icon rail-icon--out"></i>
          <span><b>{{ t("admin.supplierStaff.exportTitle") }}</b><small>{{ t("admin.supplierStaff.exportHint") }}</small></span>
        </button>
        <button type="button" :disabled="templating" @click="downloadTemplate">
          <i class="rail-icon rail-icon--file"></i>
          <span><b>{{ t("admin.supplierStaff.templateTitle") }}</b><small>{{ t("admin.supplierStaff.templateHint") }}</small></span>
        </button>
        <input
          ref="fileRef"
          class="file-input"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          @change="importFile"
        />
      </section>
      <section class="rail-block guide">
        <h3>{{ t("admin.supplierStaff.guideTitle") }}</h3>
        <p><i class="status-dot status-dot--available"></i><span><b>{{ t("admin.supplierStaff.jobAvailable") }}</b><small>{{ t("admin.supplierStaff.guideAvailable") }}</small></span></p>
        <p><i class="status-dot status-dot--onJob"></i><span><b>{{ t("admin.supplierStaff.jobOnJob") }}</b><small>{{ t("admin.supplierStaff.guideOnJob") }}</small></span></p>
        <p><i class="status-dot status-dot--offline"></i><span><b>{{ t("admin.supplierStaff.jobOffline") }}</b><small>{{ t("admin.supplierStaff.guideOffline") }}</small></span></p>
        <p><i class="status-dot status-dot--unavailable"></i><span><b>{{ t("admin.supplierStaff.jobUnavailable") }}</b><small>{{ t("admin.supplierStaff.guideUnavailable") }}</small></span></p>
        <p><i class="status-dot status-dot--suspended"></i><span><b>{{ t("admin.supplierStaff.accountSuspended") }}</b><small>{{ t("admin.supplierStaff.guideSuspended") }}</small></span></p>
      </section>
    </aside>

    <el-dialog
      v-model="dialogOpen"
      class="supplier-form-dialog"
      :title="form.id ? t('admin.supplierStaff.dialogEdit') : t('admin.supplierStaff.dialogCreate')"
      width="min(560px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-position="top">
        <el-form-item :label="t('admin.supplierStaff.name')" required>
          <el-input v-model.trim="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item :label="t('admin.supplierStaff.phone')" required>
          <el-input v-model.trim="form.phone" :placeholder="t('admin.supplierStaff.phonePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.supplierStaff.email')">
          <el-input v-model.trim="form.email" :placeholder="t('admin.supplierStaff.emailPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.supplierStaff.servicesLabel')">
          <el-select
            v-if="serviceOptions.length"
            v-model="form.categoryIds"
            multiple
            filterable
            class="service-select"
          >
            <el-option
              v-for="service in serviceOptions"
              :key="service.id"
              :value="service.id"
              :label="labelOf(service)"
            />
          </el-select>
          <p v-else class="dialog-note">{{ t("admin.supplierStaff.servicesEmpty") }}</p>
        </el-form-item>
      </el-form>
      <p class="dialog-note">{{ t("admin.supplierStaff.passwordHint") }}</p>
      <template #footer>
        <el-button @click="dialogOpen = false">{{ t("admin.supplierStaff.cancel") }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveAccount">{{
          t("admin.supplierStaff.save")
        }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Search } from "@element-plus/icons-vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import {
  deleteSupplierStaff,
  downloadSupplierStaffTemplate,
  exportSupplierStaff,
  importSupplierStaff,
  saveSupplierStaff,
  serviceCatalog,
  supplierAssignedOrders,
  supplierStaffPage,
  updateSupplierStaffState,
} from "@/modules/admin/api/supplierWorkbench"
import {
  deriveStaffJob,
  dubaiDateKey,
  serviceLabel,
  tallyStaffJobs,
  type StaffJobStatus,
} from "@/modules/admin/utils/staffBoard"

type ServiceChip = {
  id: number
  name: string
  nameZh: string
  nameEn: string
}
type StaffRow = {
  id: number
  adminUserId: number
  name: string
  phone: string
  email: string
  jobStatus: StaffJobStatus | ""
  accountStatus: string
  acceptJobs: boolean | null
  suspended: boolean
  todayJobCount: number | null
  services: ServiceChip[]
}

const { t, locale } = useI18n()
const router = useRouter()
const unwrap = (res: any) => (res && typeof res === "object" && "data" in res ? res.data : res)
const pageSize = 8
const staff = ref<StaffRow[]>([])
const serviceOptions = ref<ServiceChip[]>([])
const catalogLoaded = ref(false)
const loading = ref(false)
const saving = ref(false)
const exporting = ref(false)
const importing = ref(false)
const templating = ref(false)
const query = ref("")
const statusFilter = ref("all")
const serviceFilter = ref(0)
const accountFilter = ref("all")
const moreOpen = ref(false)
const page = ref(1)
const selected = ref<number[]>([])
const dialogOpen = ref(false)
const fileRef = ref<HTMLInputElement | null>(null)
const form = reactive({
  id: undefined as number | undefined,
  name: "",
  phone: "",
  email: "",
  categoryIds: [] as number[],
})

const phoneOk = (value: string) => /^[1-9]\d{7,14}$/.test(value.replace(/\D/g, ""))
const emailOk = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
const suspended = (row: StaffRow) => row.suspended || row.accountStatus === "suspended"
const labelOf = (service: ServiceChip) => serviceLabel(service, String(locale.value))
const stats = computed(() => ({
  total: staff.value.length,
  available: staff.value.filter((row) => row.jobStatus === "available").length,
  onJob: staff.value.filter((row) => row.jobStatus === "onJob").length,
  away: staff.value.filter((row) => row.jobStatus === "offline" || row.jobStatus === "unavailable")
    .length,
}))
const filtered = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return staff.value.filter((row) => {
    if (statusFilter.value !== "all" && row.jobStatus !== statusFilter.value) return false
    if (serviceFilter.value && !row.services.some((service) => service.id === serviceFilter.value))
      return false
    if (accountFilter.value === "active" && suspended(row)) return false
    if (accountFilter.value === "suspended" && !suspended(row)) return false
    if (!keyword) return true
    return [row.name, row.phone, row.email].some((value) =>
      String(value || "").toLowerCase().includes(keyword),
    )
  })
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
const pageSelected = computed(
  () => pageRows.value.length > 0 && pageRows.value.every((row) => selected.value.includes(row.id)),
)
const selectedRows = computed(() =>
  staff.value.filter((row) => selected.value.includes(row.id)),
)
const selectedActive = computed(() => selectedRows.value.filter((row) => !suspended(row)))
const selectedSuspended = computed(() => selectedRows.value.filter((row) => suspended(row)))

watch([query, statusFilter, serviceFilter, accountFilter], () => {
  page.value = 1
})
watch(filtered, (rows) => {
  const ids = new Set(rows.map((row) => row.id))
  selected.value = selected.value.filter((id) => ids.has(id))
  if (page.value > pageCount.value) page.value = pageCount.value
})

const chipPalette = ["#e7f6ea", "#e7f0ff", "#f4ecff", "#fff1df", "#e7f7f5", "#fdecef"]
const chipInk = ["#1d7a45", "#2458c5", "#6d3bb5", "#a15c12", "#0f766e", "#b4233c"]
const avatarPalette = ["#e7eef8", "#e7f6ea", "#fff1df", "#f4ecff", "#fdecef", "#e7f7f5"]
const chipStyle = (id: number) => {
  const index = Math.abs(id) % chipPalette.length
  return { background: chipPalette[index], color: chipInk[index] }
}
const avatarColor = (name: string) =>
  avatarPalette[Math.abs(hash(name)) % avatarPalette.length]
const hash = (value: string) =>
  [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0)
const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (name.trim().slice(0, 1) || "?").toUpperCase()
}
const prettyPhone = (phone: string) => {
  const compact = phone.replace(/[^\d+]/g, "")
  if (compact.startsWith("+971") && compact.length >= 12) {
    const rest = compact.slice(4)
    return `+971 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`
  }
  return phone || "—"
}
const jobLabel = (status: string) => {
  if (status === "available") return t("admin.supplierStaff.jobAvailable")
  if (status === "onJob") return t("admin.supplierStaff.jobOnJob")
  if (status === "offline") return t("admin.supplierStaff.jobOffline")
  if (status === "unavailable") return t("admin.supplierStaff.jobUnavailable")
  return "—"
}

const readServices = (value: any): ServiceChip[] =>
  (Array.isArray(value) ? value : [])
    .map((item: any) => ({
      id: Number(item?.id ?? item?.categoryId),
      name: String(item?.name || item?.categoryName || ""),
      nameZh: String(item?.nameZh || item?.nameI18n?.zh || ""),
      nameEn: String(item?.nameEn || item?.nameI18n?.en || ""),
    }))
    .filter((item: ServiceChip) => item.id > 0)

const readStaff = (row: any): StaffRow => {
  const accept = row?.acceptJobs
  return {
    id: Number(row?.id),
    adminUserId: Number(row?.adminUserId) || 0,
    name: String(row?.name || ""),
    phone: String(row?.phone || ""),
    email: String(row?.email || ""),
    jobStatus: deriveStaffJob({ serverStatus: row?.jobStatus }),
    accountStatus: String(row?.accountStatus || ""),
    acceptJobs: accept === true || accept === 1 ? true : accept === false || accept === 0 ? false : null,
    suspended: row?.suspended === true || row?.suspended === 1 || row?.accountStatus === "suspended",
    todayJobCount:
      row?.todayJobCount == null || row?.todayJobCount === "" ? null : Number(row.todayJobCount),
    services: readServices(row?.services),
  }
}

const load = async () => {
  loading.value = true
  try {
    const [staffPage, catalog] = await Promise.all([
      supplierStaffPage({ pageNum: 1, pageSize: 500 }),
      serviceCatalog().catch(() => null),
    ])
    const pageData = unwrap(staffPage)
    staff.value = (Array.isArray(pageData?.list) ? pageData.list : []).map(readStaff)
    const rawCatalog = unwrap(catalog)
    const groups = Array.isArray(rawCatalog)
      ? rawCatalog
      : Array.isArray(rawCatalog?.list)
        ? rawCatalog.list
        : null
    catalogLoaded.value = Array.isArray(groups)
    serviceOptions.value = catalogLoaded.value ? readServices(groups) : []
    await fillFromOrders()
  } catch (error: any) {
    staff.value = []
    ElMessage.error(error?.message || t("admin.supplierStaff.loadFailed"))
  } finally {
    loading.value = false
  }
}

const fillFromOrders = async () => {
  const needsTally = staff.value.some((row) => row.todayJobCount == null || !row.jobStatus)
  if (!needsTally) return
  try {
    const pageData = unwrap(await supplierAssignedOrders({ pageNum: 1, pageSize: 100 }))
    const orders = Array.isArray(pageData?.list) ? pageData.list : []
    const today = dubaiDateKey()
    staff.value = staff.value.map((row) => {
      if (!row.adminUserId) return row
      const tally = tallyStaffJobs(orders, row.adminUserId, today)
      return {
        ...row,
        todayJobCount: row.todayJobCount == null ? tally.count : row.todayJobCount,
        jobStatus:
          row.jobStatus ||
          deriveStaffJob({
            suspended: row.suspended,
            acceptJobs: row.acceptJobs,
            onJob: tally.onJob,
          }),
      }
    })
  } catch {
    return
  }
}

const toggleRow = (id: number) => {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id]
}
const togglePage = () => {
  const ids = pageRows.value.map((row) => row.id)
  selected.value = pageSelected.value
    ? selected.value.filter((id) => !ids.includes(id))
    : [...new Set([...selected.value, ...ids])]
}
const openEditor = (row?: StaffRow) => {
  form.id = row?.id
  form.name = row?.name || ""
  form.phone = row?.phone || ""
  form.email = row?.email || ""
  form.categoryIds = (row?.services || []).map((service) => service.id)
  dialogOpen.value = true
}
const saveAccount = async () => {
  const name = form.name.trim()
  const phone = form.phone.trim()
  const email = form.email.trim()
  if (!name) {
    ElMessage.warning(t("admin.supplierStaff.nameRequired"))
    return
  }
  if (!phoneOk(phone)) {
    ElMessage.warning(t("admin.supplierStaff.phoneInvalid"))
    return
  }
  if (email && !emailOk(email)) {
    ElMessage.warning(t("admin.supplierStaff.emailInvalid"))
    return
  }
  saving.value = true
  try {
    await saveSupplierStaff({
      id: form.id,
      name,
      phone,
      email: email || undefined,
      ...(catalogLoaded.value ? { categoryIds: [...form.categoryIds] } : {}),
    })
    dialogOpen.value = false
    ElMessage.success(t("admin.supplierStaff.saved"))
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierStaff.saveFailed"))
  } finally {
    saving.value = false
  }
}
const confirmState = async (message: string) => {
  try {
    await ElMessageBox.confirm(message, t("admin.common.confirmTitle"), { type: "warning" })
    return true
  } catch {
    return false
  }
}
const applyState = async (
  rows: StaffRow[],
  patch: { acceptJobs?: boolean; suspended?: boolean },
) => {
  if (!rows.length) return
  try {
    for (const row of rows) {
      await updateSupplierStaffState({ id: row.id, ...patch })
    }
    ElMessage.success(t("admin.supplierStaff.stateSaved"))
    selected.value = []
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierStaff.stateFailed"))
  }
}
const suspend = async (row: StaffRow) => {
  if (!(await confirmState(t("admin.supplierStaff.suspendConfirm", { name: row.name || row.phone }))))
    return
  await applyState([row], { suspended: true })
}
const reactivate = async (row: StaffRow) => {
  if (
    !(await confirmState(t("admin.supplierStaff.reactivateConfirm", { name: row.name || row.phone })))
  )
    return
  await applyState([row], { suspended: false })
}
const suspendMany = async () => {
  const rows = selectedActive.value
  if (!rows.length) return
  if (!(await confirmState(t("admin.supplierStaff.suspendConfirm", { name: String(rows.length) }))))
    return
  await applyState(rows, { suspended: true })
}
const reactivateMany = async () => {
  const rows = selectedSuspended.value
  if (!rows.length) return
  if (
    !(await confirmState(t("admin.supplierStaff.reactivateConfirm", { name: String(rows.length) })))
  )
    return
  await applyState(rows, { suspended: false })
}
const remove = async (row: StaffRow) => {
  if (!(await confirmState(t("admin.supplierStaff.removeConfirm", { name: row.name || row.phone }))))
    return
  try {
    await deleteSupplierStaff([row.id])
    ElMessage.success(t("admin.supplierStaff.removed"))
    await load()
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierStaff.removeFailed"))
  }
}
const runCommand = (command: string, row: StaffRow) => {
  if (command === "edit") openEditor(row)
  if (command === "available") applyState([row], { acceptJobs: true })
  if (command === "unavailable") applyState([row], { acceptJobs: false })
  if (command === "suspend") suspend(row)
  if (command === "reactivate") reactivate(row)
  if (command === "delete") remove(row)
}
const viewJobs = (row: StaffRow) => {
  if (!row.adminUserId) return
  router.push({
    path: "/admin/supplier-management/orders",
    query: { staff: String(row.adminUserId) },
  })
}
const saveBlob = async (data: unknown, filename: string) => {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart])
  const head = await blob.slice(0, 1).text()
  if (
    blob.type.includes("json") ||
    blob.type.startsWith("text/") ||
    head === "{" ||
    head === "<"
  ) {
    const text = await blob.text()
    let message = text
    try {
      message = String(JSON.parse(text)?.message || text)
    } catch {
      message = text
    }
    throw new Error(message)
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
const downloadSheet = async () => {
  if (exporting.value) return
  exporting.value = true
  try {
    await saveBlob(
      await exportSupplierStaff(),
      String(locale.value).startsWith("zh") ? "供应商员工.xlsx" : "supplier-staff.xlsx",
    )
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierStaff.exportFailed"))
  } finally {
    exporting.value = false
  }
}
const downloadTemplate = async () => {
  if (templating.value) return
  templating.value = true
  try {
    await saveBlob(
      await downloadSupplierStaffTemplate(),
      String(locale.value).startsWith("zh") ? "员工导入模板.xlsx" : "staff-template.xlsx",
    )
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierStaff.templateFailed"))
  } finally {
    templating.value = false
  }
}
const importFile = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (input) input.value = ""
  if (!file || importing.value) return
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    ElMessage.warning(t("admin.supplierStaff.fileType"))
    return
  }
  importing.value = true
  try {
    const result = unwrap(await importSupplierStaff(file)) as {
      created?: number
      updated?: number
      skipped?: number
      messages?: string[]
    }
    await load()
    const summary = t("admin.supplierStaff.importDone", {
      created: result?.created ?? 0,
      updated: result?.updated ?? 0,
      skipped: result?.skipped ?? 0,
    })
    const notes = Array.isArray(result?.messages)
      ? result.messages.map((item) => String(item || "").trim()).filter(Boolean)
      : []
    if (notes.length) {
      await ElMessageBox.alert([summary, ...notes].join("\n"), t("admin.supplierStaff.importResult"), {
        confirmButtonText: t("admin.supplierStaff.importClose"),
      })
    } else {
      ElMessage.success(summary)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t("admin.supplierStaff.importFailed"))
  } finally {
    importing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.staff-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 292px;
  column-gap: 22px;
  row-gap: 18px;
  align-items: start;
  color: #172033;
}
.staff-head h2 {
  margin: 0;
  color: #102033;
  font-family: Fraunces, Georgia, serif;
  font-size: 40px;
  font-weight: 560;
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.staff-head p {
  margin: 8px 0 0;
  color: #7d7368;
  font-size: 15px;
}
.staff-add {
  align-self: center;
}
.add-staff {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 14px;
  background: #10233f;
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.add-staff span {
  font-size: 20px;
  line-height: 1;
}
.staff-main {
  grid-column: 1;
  min-width: 0;
}
.staff-rail {
  grid-column: 2;
  display: grid;
  gap: 14px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.stat-card,
.staff-table-card,
.login-card,
.rail-block {
  border: 1px solid #e7e0d4;
  border-radius: 18px;
  background: #fff;
}
.stat-card {
  display: flex;
  gap: 12px;
  min-height: 108px;
  padding: 16px;
}
.stat-card small,
.stat-card em {
  display: block;
  color: #7d7368;
  font-style: normal;
}
.stat-card small {
  font-size: 13px;
  font-weight: 650;
}
.stat-card strong {
  display: block;
  margin: 2px 0;
  color: #102033;
  font-family: Fraunces, Georgia, serif;
  font-size: 32px;
  font-weight: 560;
  line-height: 1;
}
.stat-card em {
  font-size: 12px;
}
.stat-icon {
  width: 28px;
  height: 28px;
  margin-top: 2px;
  border-radius: 50%;
  background: #eef2f6 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b6776' stroke-width='1.8'%3E%3Ccircle cx='12' cy='8' r='3'/%3E%3Cpath d='M6 19c1.2-3 3.2-4.5 6-4.5S16.8 16 18 19'/%3E%3C/svg%3E")
    center / 18px no-repeat;
}
.status-dot {
  width: 10px;
  height: 10px;
  margin-top: 4px;
  border-radius: 50%;
  background: #9aa3af;
  flex: 0 0 auto;
}
.status-dot--available { background: #1f9d55; }
.status-dot--onJob { background: #2f6fed; }
.status-dot--offline { background: #9aa3af; }
.status-dot--unavailable { background: #e39b2b; }
.status-dot--suspended { background: #e15b64; }
.staff-filters {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 168px 168px auto;
  gap: 12px;
  margin-top: 16px;
}
.more-filters,
.view-jobs,
.reactivate,
.more,
.selection-bar button,
.pager button {
  border: 1px solid #ddd4c6;
  background: #fff;
  color: #243246;
  font: inherit;
  cursor: pointer;
}
.more-filters {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  white-space: nowrap;
}
.more-filters svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}
.more-filters.is-open {
  border-color: #10233f;
  color: #10233f;
}
.account-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  color: #6f675e;
  font-size: 13px;
}
.account-filter .el-select {
  width: 180px;
}
.selection-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  color: #243246;
  font-size: 14px;
}
.selection-bar button {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
}
.staff-table-card {
  margin-top: 14px;
  padding: 6px 8px 12px;
}
.staff-table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}
th {
  padding: 14px 10px;
  color: #8d847a;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
}
td {
  padding: 14px 10px;
  border-top: 1px solid #f1ebe3;
  vertical-align: middle;
}
.check-col {
  width: 36px;
}
.person {
  display: flex;
  align-items: center;
  gap: 10px;
}
.person strong {
  font-weight: 750;
}
.avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: #243246;
  font-size: 13px;
  font-weight: 750;
}
.phone,
.count {
  color: #243246;
  font-variant-numeric: tabular-nums;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 650;
}
.job-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 650;
}
.job-status .status-dot {
  margin-top: 0;
}
.account-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #e7f6ea;
  color: #1d7a45;
  font-size: 12px;
  font-weight: 700;
}
.account-pill.is-suspended {
  background: #fde8ea;
  color: #c53645;
}
.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.view-jobs,
.reactivate {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 650;
}
.reactivate {
  border-color: #f0c2c6;
  color: #c53645;
}
.view-jobs:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.more {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  letter-spacing: 1px;
}
.muted,
.empty {
  color: #8d847a;
}
.empty {
  margin: 28px 12px;
  text-align: center;
}
.staff-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 8px 4px;
  color: #7d7368;
  font-size: 13px;
}
.pager {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pager button,
.pager strong {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
}
.pager strong {
  background: #10233f;
  color: #fff;
  font-weight: 700;
}
.pager button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.login-card,
.rail-block {
  padding: 16px;
}
.login-card {
  background: #fbf6ee;
}
.login-card strong,
.rail-block h3 {
  display: block;
  margin: 0 0 8px;
  font-size: 15px;
}
.login-card p,
.rail-block small {
  margin: 0;
  color: #7d7368;
  font-size: 13px;
  line-height: 1.45;
}
.rail-block button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #eee6da;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.rail-block button:disabled {
  cursor: progress;
  opacity: 0.6;
}
.rail-block b {
  display: block;
  font-weight: 750;
}
.rail-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f4efe6 center / 16px no-repeat;
  flex: 0 0 auto;
}
.rail-icon--in {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23243246' stroke-width='1.8'%3E%3Cpath d='M12 4v10m0 0 4-4m-4 4-4-4M5 19h14'/%3E%3C/svg%3E");
}
.rail-icon--out {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23243246' stroke-width='1.8'%3E%3Cpath d='M12 16V6m0 0 4 4m-4-4-4 4M5 19h14'/%3E%3C/svg%3E");
}
.rail-icon--file {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23243246' stroke-width='1.8'%3E%3Cpath d='M7 3h7l5 5v13H7zM14 3v5h5'/%3E%3C/svg%3E");
}
.guide p {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 12px 0 0;
}
.guide b,
.guide small {
  display: block;
}
.file-input {
  display: none;
}
.dialog-note {
  margin: 0;
  color: #7d7368;
  font-size: 13px;
  line-height: 1.45;
}
.service-select {
  width: 100%;
}
@media (max-width: 1180px) {
  .staff-board,
  .staff-main,
  .staff-rail,
  .staff-add {
    grid-column: 1;
  }
  .staff-board {
    grid-template-columns: 1fr;
  }
  .stat-grid,
  .staff-filters {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
