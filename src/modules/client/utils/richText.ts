const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

type RichListItem = {
  tag: 'ul' | 'ol'
  indent: number
  html: string
  children: RichListItem[]
}

const listTag = (kind: string) => (kind === 'ordered' ? 'ol' : 'ul')

const readItems = (block: string): RichListItem[] =>
  [...block.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)].map((match) => {
    const attrs = match[1] || ''
    const kind = /data-list=["']?(bullet|ordered|checked|unchecked)["']?/i.exec(attrs)?.[1]?.toLowerCase() || 'bullet'
    const indent = Number(/ql-indent-(\d+)/i.exec(attrs)?.[1] || 0)
    const html = match[2].replace(/<span\b[^>]*\bql-ui\b[^>]*>[\s\S]*?<\/span>/gi, '')
    return {
      tag: listTag(kind),
      indent: Number.isFinite(indent) ? Math.max(0, indent) : 0,
      html,
      children: [],
    }
  })

const renderList = (nodes: RichListItem[]) => {
  const groups: Array<{ tag: 'ul' | 'ol'; items: RichListItem[] }> = []
  nodes.forEach((node) => {
    const last = groups[groups.length - 1]
    if (!last || last.tag !== node.tag) groups.push({ tag: node.tag, items: [node] })
    else last.items.push(node)
  })
  return groups
    .map((group) => `<${group.tag}>${group.items.map((item) => `<li>${item.html}${renderList(item.children)}</li>`).join('')}</${group.tag}>`)
    .join('')
}

const nestQuillList = (block: string) => {
  const items = readItems(block)
  if (!items.length) return block
  const root: RichListItem = { tag: 'ul', indent: -1, html: '', children: [] }
  const stack = [root]
  items.forEach((item) => {
    while (stack.length > 1 && stack[stack.length - 1].indent >= item.indent) stack.pop()
    stack[stack.length - 1].children.push(item)
    stack.push(item)
  })
  return renderList(root.children)
}

export const normalizeRichTextHtml = (value: string) => {
  const content = String(value || '').trim()
  if (!content) return ''
  if (!/<\/?[a-z][^>]*>/i.test(content)) {
    return `<p>${escapeHtml(content).replace(/\r?\n/g, '<br>')}</p>`
  }
  return content.replace(/<(ol|ul)\b[^>]*>[\s\S]*?<\/\1>/gi, (block) => (
    /data-list=|ql-indent-/i.test(block) ? nestQuillList(block) : block
  ))
}
