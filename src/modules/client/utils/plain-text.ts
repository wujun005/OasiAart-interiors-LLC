const SCRIPT_STYLE_CONTENT = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
const HTML_COMMENTS = /<!--[\s\S]*?-->/g
const BLOCK_TAGS = /<\/?(?:address|article|aside|blockquote|br|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b[^>]*>/gi
const HTML_TAGS = /<\/?[a-z][^>]*>/gi
const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
}

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim()

const withoutScriptAndStyle = (value: string) =>
  value
    .replace(SCRIPT_STYLE_CONTENT, " ")
    .replace(/<(?:script|style)\b[^>]*\/?\s*>/gi, " ")

const decodeHtmlEntities = (value: string) =>
  value.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][\da-z]+);/gi, (match, entity: string) => {
    if (!entity.startsWith("#")) {
      return HTML_ENTITIES[entity.toLowerCase()] ?? match
    }

    const hexadecimal = entity[1]?.toLowerCase() === "x"
    const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10)
    if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return match

    try {
      return String.fromCodePoint(codePoint)
    } catch {
      return match
    }
  })

const fallbackPlainText = (value: string) => {
  const decoded = decodeHtmlEntities(value)
  return withoutScriptAndStyle(decoded)
    .replace(HTML_COMMENTS, " ")
    .replace(BLOCK_TAGS, " ")
    .replace(HTML_TAGS, " ")
}

export const toPlainText = (value: unknown): string => {
  let text = String(value ?? "").trim()
  if (!text) return ""

  for (let pass = 0; pass < 3; pass += 1) {
    const readable = withoutScriptAndStyle(text)
      .replace(HTML_COMMENTS, " ")
      .replace(BLOCK_TAGS, " ")
    let next = ""

    if (typeof DOMParser !== "undefined") {
      try {
        const document = new DOMParser().parseFromString(readable, "text/html")
        document.querySelectorAll("script, style").forEach((node) => node.remove())
        next = document.body?.textContent || ""
      } catch {
        next = fallbackPlainText(readable)
      }
    } else {
      next = fallbackPlainText(readable)
    }

    next = normalizeWhitespace(next)
    if (next === normalizeWhitespace(text)) return next
    text = next
    if (!text) return ""
  }

  return normalizeWhitespace(fallbackPlainText(text))
}
