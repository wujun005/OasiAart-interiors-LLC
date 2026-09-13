const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{1,2})-(\d{1,2})[T\s]+(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/

const SERVICE_RANGE_PATTERN =
  /^(\d{4})-(\d{1,2})-(\d{1,2})[T\s]+(\d{1,2}):(\d{2})(?::\d{2})?\s*[-~–—]\s*(\d{1,2}):(\d{2})(?::\d{2})?/

const formatEnglishTime = (hour: number, minute: number) => ({
  text: `${hour % 12 || 12}:${String(minute).padStart(2, "0")}`,
  period: hour < 12 ? "AM" : "PM",
})

const formatEnglishRange = (
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
) => {
  const start = formatEnglishTime(startHour, startMinute)
  const end = formatEnglishTime(endHour, endMinute)
  return start.period === end.period
    ? `${start.text}–${end.text} ${end.period}`
    : `${start.text} ${start.period}–${end.text} ${end.period}`
}

const formatEnglishDate = (
  year: number,
  month: number,
  day: number,
  withYear: boolean,
) => {
  const monthName = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][month - 1]
  if (withYear) return `${day} ${monthName} ${year}`
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))
  return `${weekday}, ${day} ${monthName}`
}

const formatChineseWeekday = (year: number, month: number, day: number) =>
  new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))

export const formatServiceSchedule = (
  raw: string | undefined,
  locale: string,
  fallback: string,
) => {
  const text = String(raw || "").trim()
  if (!text) return fallback
  const matched = SERVICE_RANGE_PATTERN.exec(text)
  if (!matched) return formatCreatedAt(text, locale, fallback)

  const [, yearText, monthText, dayText, startHourText, startMinuteText, endHourText, endMinuteText] =
    matched
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const startHour = Number(startHourText)
  const startMinute = Number(startMinuteText)
  const endHour = Number(endHourText)
  const endMinute = Number(endMinuteText)

  if (locale.startsWith("zh")) {
    return `${year}年${month}月${day}日 ${formatChineseWeekday(year, month, day)} · ${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}–${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
  }
  return `${formatEnglishDate(year, month, day, false)} · ${formatEnglishRange(startHour, startMinute, endHour, endMinute)}`
}

export const formatCreatedAt = (
  raw: string | undefined,
  locale: string,
  fallback: string,
) => {
  const text = String(raw || "").trim()
  if (!text) return fallback
  const matched = DATE_TIME_PATTERN.exec(text)
  if (!matched) return text

  const [, yearText, monthText, dayText, hourText, minuteText] = matched
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (locale.startsWith("zh")) {
    return `${year}年${month}月${day}日 · ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  }
  const time = formatEnglishTime(hour, minute)
  return `${formatEnglishDate(year, month, day, true)} · ${time.text} ${time.period}`
}
