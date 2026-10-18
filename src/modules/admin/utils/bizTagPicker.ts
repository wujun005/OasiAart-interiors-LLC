import { reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { ElMessage } from "element-plus"
import {
  bizTagOptions,
  bizTagsByRef,
  replaceBizTags,
  saveBizTag,
  type BizTag,
} from "@/modules/admin/api/bizTag"
import { bizTagLabel } from "@/modules/client/utils/biz-tag"

const asTags = (payload: unknown): BizTag[] => {
  if (Array.isArray(payload)) return payload
  const data = (payload as { data?: unknown })?.data
  if (Array.isArray(data)) return data
  if (Array.isArray((data as { list?: unknown })?.list)) {
    return (data as { list: BizTag[] }).list
  }
  return []
}

export function useBizTagPicker() {
  const { t, locale } = useI18n({ useScope: "global" })
  const options = ref<BizTag[]>([])
  const selectedIds = ref<number[]>([])
  const draft = reactive({ zh: "", en: "" })
  const creating = ref(false)

  const labelOf = (tag: BizTag) => bizTagLabel(tag, String(locale.value))

  const englishLabel = (tag: BizTag) => {
    const map = tag?.nameI18n || {}
    const text = [map.en, map["en-US"], map["en-GB"], tag?.name, map.zh, map["zh-CN"]]
      .find((item) => String(item || "").trim())
    return String(text || "").trim()
  }

  const remember = (tag: BizTag) => {
    const id = Number(tag?.id)
    if (!id) return
    const index = options.value.findIndex((item) => Number(item.id) === id)
    if (index >= 0) options.value[index] = { ...options.value[index], ...tag }
    else options.value.push(tag)
  }

  const loadOptions = async () => {
    asTags(await bizTagOptions()).forEach(remember)
  }

  const loadBound = async (refType: number, refId: number) => {
    const tags = asTags(await bizTagsByRef(refType, refId))
    tags.forEach(remember)
    selectedIds.value = tags
      .map((tag) => Number(tag.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  }

  const reset = () => {
    selectedIds.value = []
    draft.zh = ""
    draft.en = ""
  }

  const create = async () => {
    const zh = draft.zh.trim()
    const en = draft.en.trim()
    if (!zh && !en) {
      ElMessage.warning(t("admin.bizTag.needName"))
      return
    }
    creating.value = true
    try {
      const nameI18n: Record<string, string> = {}
      if (zh) nameI18n.zh = zh
      if (en) nameI18n.en = en
      const saved = (await saveBizTag({ nameI18n })) as BizTag
      remember(saved)
      const id = Number(saved?.id)
      if (id > 0 && !selectedIds.value.includes(id)) selectedIds.value.push(id)
      draft.zh = ""
      draft.en = ""
      ElMessage.success(t("admin.bizTag.created"))
    } catch (error: any) {
      ElMessage.error(error?.message || t("admin.bizTag.saveFailed"))
    } finally {
      creating.value = false
    }
  }

  const replace = (refType: number, refId: number) =>
    replaceBizTags({ refType, refId, tagIds: [...selectedIds.value] })

  const saveItems = (names: string[] = []) => {
    const rows: Array<{ id?: number; nameI18n?: { en: string } }> = []
    const seen = new Set<number>()
    const pushId = (id: number) => {
      if (id > 0 && !seen.has(id)) {
        seen.add(id)
        rows.push({ id })
      }
    }
    selectedIds.value.forEach((id) => pushId(Number(id)))
    names.forEach((raw) => {
      const en = raw.trim()
      if (!en) return
      const existing = options.value.find(
        (tag) => englishLabel(tag).toLowerCase() === en.toLowerCase(),
      )
      const existingId = Number(existing?.id)
      if (existingId > 0) {
        pushId(existingId)
        return
      }
      rows.push({ nameI18n: { en } })
    })
    return rows
  }

  const commit = async (refType: number, refId: number, names: string[] = []) => {
    for (const raw of names) {
      const en = raw.trim()
      if (!en) continue
      const existing = options.value.find(
        (tag) => englishLabel(tag).toLowerCase() === en.toLowerCase(),
      )
      const existingId = Number(existing?.id)
      if (existingId > 0) {
        select(existingId)
        continue
      }
      const saved = (await saveBizTag({ nameI18n: { en } })) as BizTag
      remember(saved)
      select(Number(saved?.id))
    }
    return replace(refType, refId)
  }

  const select = (id: number) => {
    if (id > 0 && !selectedIds.value.includes(id)) selectedIds.value.push(id)
  }

  const remove = (id: number) => {
    selectedIds.value = selectedIds.value.filter((item) => item !== id)
  }

  const addEnglish = async (raw: string) => {
    const en = raw.trim()
    if (!en) {
      ElMessage.warning(t("admin.bizTag.needEnglish"))
      return false
    }
    const existing = options.value.find(
      (tag) => englishLabel(tag).toLowerCase() === en.toLowerCase(),
    )
    const existingId = Number(existing?.id)
    if (existingId > 0) {
      select(existingId)
      return true
    }
    creating.value = true
    try {
      const saved = (await saveBizTag({ nameI18n: { en } })) as BizTag
      remember(saved)
      select(Number(saved?.id))
      ElMessage.success(t("admin.bizTag.created"))
      return true
    } catch (error: any) {
      ElMessage.error(error?.message || t("admin.bizTag.saveFailed"))
      return false
    } finally {
      creating.value = false
    }
  }

  return {
    options,
    selectedIds,
    draft,
    creating,
    labelOf,
    englishLabel,
    loadOptions,
    loadBound,
    reset,
    create,
    replace,
    saveItems,
    commit,
    select,
    remove,
    addEnglish,
  }
}
