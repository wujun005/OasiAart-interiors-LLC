export type StaffPresence = "idle" | "enRoute" | "serving"

const PRESENCE: StaffPresence[] = ["idle", "enRoute", "serving"]

export function dubaiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function staffPresence(serverStatus?: string | null): StaffPresence | "" {
  if (serverStatus && PRESENCE.includes(serverStatus as StaffPresence)) {
    return serverStatus as StaffPresence
  }
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
  let presence: StaffPresence = "idle"
  for (const order of orders || []) {
    if (!order) continue
    if (Number(order.orderStatus) === 3) continue
    if (Number(order.scheduleStatus) === 2) continue
    if (String(order.supplierStage || "").toUpperCase() === "CANCELLED") continue
    const assigned = Array.isArray(order.assignedStaff) ? order.assignedStaff : []
    if (!assigned.some((item) => Number(item?.adminUserId) === adminUserId)) continue
    const status = Number(order.serviceStatus)
    const sameDay = String(order.serviceDate || "").slice(0, 10) === today
    if (sameDay) count += 1
    if (!sameDay && status !== 1 && status !== 3) continue
    if (status === 1) presence = "serving"
    else if (status === 3 && presence !== "serving") presence = "enRoute"
  }
  return { count, presence }
}

export function serviceLabel(
  service: { name?: string | null; nameZh?: string | null; nameEn?: string | null },
  language: string,
) {
  const zh = String(language || "").toLowerCase().startsWith("zh")
  const preferred = zh ? service.nameZh : service.nameEn
  return String(preferred || service.name || service.nameZh || service.nameEn || "").trim()
}
