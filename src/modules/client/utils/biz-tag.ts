export type BizTag = {
  id?: number | string
  name?: string
  nameI18n?: Record<string, string>
}

export function bizTagLabel(tag: BizTag, locale: string) {
  const map = tag?.nameI18n || {}
  const chinese = locale.startsWith("zh")
  const preferred = chinese
    ? [map.zh, map["zh-CN"], map["zh-Hans"]]
    : [map.en, map["en-US"], map["en-GB"]]
  const text = preferred.find((item) => String(item || "").trim())
    || tag?.name
    || Object.values(map).find((item) => String(item || "").trim())
  return String(text || "").trim()
}

export function bizTagLabels(tags: unknown, locale: string) {
  if (!Array.isArray(tags)) return []
  const seen = new Set<string>()
  const labels: string[] = []
  for (const tag of tags) {
    if (!tag || typeof tag !== "object") continue
    const label = bizTagLabel(tag as BizTag, locale)
    if (!label || seen.has(label)) continue
    seen.add(label)
    labels.push(label)
  }
  return labels
}
