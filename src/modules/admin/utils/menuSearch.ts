export type SearchableMenuItem = {
  name?: string
  children?: SearchableMenuItem[] | null
}

const menuHaystack = (item: SearchableMenuItem, labelsOf: (item: SearchableMenuItem) => string[]) =>
  [item.name || '', ...labelsOf(item)].join('\n').toLowerCase()

export function filterAdminMenu<T extends SearchableMenuItem>(
  items: T[],
  query: string,
  labelsOf: (item: T) => string[] = () => [],
): T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return items
  return items.flatMap((item) => {
    const children = Array.isArray(item.children) ? item.children : []
    if (menuHaystack(item, labelsOf as (item: SearchableMenuItem) => string[]).includes(needle)) return [item]
    const nextChildren = filterAdminMenu(children as T[], needle, labelsOf)
    if (!nextChildren.length) return []
    return [{ ...item, children: nextChildren }]
  })
}
