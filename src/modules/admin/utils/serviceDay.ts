const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

export type ServiceDayRelation = "today" | "tomorrow" | "other"

function calendarDate(year: number, month: number, day: number) {
  const date = new Date(year, month, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

/** Reads a supplier display date ("Friday, 27 Nov 2026") or an ISO calendar date. */
export function parseServiceCalendarDate(value: unknown) {
  const text = String(value ?? "").trim()
  if (!text) return null
  const iso = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) {
    return calendarDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  }
  const written = text.match(/(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})/)
  if (!written) return null
  const month = MONTHS.indexOf(written[2].slice(0, 3).toLowerCase())
  if (month < 0) return null
  return calendarDate(Number(written[3]), month, Number(written[1]))
}

export function serviceDayRelation(value: unknown, now = new Date()): ServiceDayRelation {
  const date = parseServiceCalendarDate(value)
  if (!date) return "other"
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const difference = Math.round((day - today) / 86_400_000)
  if (difference === 0) return "today"
  if (difference === 1) return "tomorrow"
  return "other"
}

export function serviceDayHint(
  value: unknown,
  locale: string,
  labels: { today: string; tomorrow: string },
  now = new Date(),
) {
  const kind = serviceDayRelation(value, now)
  const date = parseServiceCalendarDate(value)
  if (!date || (kind !== "today" && kind !== "tomorrow")) return ""
  const weekday = new Intl.DateTimeFormat(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    weekday: "long",
  }).format(date)
  return `${kind === "today" ? labels.today : labels.tomorrow} · ${weekday}`
}
