export type StaffJobStatus = "available" | "onJob" | "offline" | "unavailable"

const JOBS: StaffJobStatus[] = ["available", "onJob", "offline", "unavailable"]

export function dubaiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function deriveStaffJob(input: {
  serverStatus?: string | null
  suspended?: boolean
  acceptJobs?: boolean | null
  onJob?: boolean
  loggedInToday?: boolean | null
}): StaffJobStatus | "" {
  if (input.serverStatus && JOBS.includes(input.serverStatus as StaffJobStatus)) {
    return input.serverStatus as StaffJobStatus
  }
  if (input.suspended) return "unavailable"
  if (input.onJob) return "onJob"
  if (input.acceptJobs === false) return "unavailable"
  if (input.loggedInToday === false) return "offline"
  if (input.loggedInToday === true) return "available"
  return ""
}

type StaffOrder = {
  serviceDate?: string | null
  serviceStatus?: number | string | null
  scheduleStatus?: number | string | null
  orderStatus?: number | string | null
  supplierStage?: string | null
  assignedStaff?: Array<{ adminUserId?: number | string | null }> | null
}

export function tallyStaffJobs(orders: StaffOrder[], adminUserId: number, today: string) {
  let count = 0
  let onJob = false
  for (const order of orders || []) {
    if (!order) continue
    if (Number(order.orderStatus) === 3) continue
    if (Number(order.scheduleStatus) === 2) continue
    if (String(order.supplierStage || "").toUpperCase() === "CANCELLED") continue
    if (String(order.serviceDate || "").slice(0, 10) !== today) continue
    const assigned = Array.isArray(order.assignedStaff) ? order.assignedStaff : []
    if (!assigned.some((item) => Number(item?.adminUserId) === adminUserId)) continue
    count += 1
    const status = Number(order.serviceStatus)
    if (status === 1 || status === 3) onJob = true
  }
  return { count, onJob }
}

export function serviceLabel(
  service: { name?: string | null; nameZh?: string | null; nameEn?: string | null },
  language: string,
) {
  const zh = String(language || "").toLowerCase().startsWith("zh")
  const preferred = zh ? service.nameZh : service.nameEn
  return String(preferred || service.name || service.nameZh || service.nameEn || "").trim()
}
