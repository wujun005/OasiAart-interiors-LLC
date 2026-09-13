export const copyText = async (value: string): Promise<boolean> => {
  const text = value.trim()
  if (!text || typeof document === "undefined") return false

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall back to the selection-based copy path below.
    }
  }

  const input = document.createElement("textarea")
  input.value = text
  input.setAttribute("readonly", "")
  input.style.position = "fixed"
  input.style.opacity = "0"
  input.style.pointerEvents = "none"
  document.body.appendChild(input)
  input.select()

  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    document.body.removeChild(input)
  }
}
