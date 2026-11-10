export type PermissionCheckNode = {
  id: string | number
  path?: string
  children?: PermissionCheckNode[]
}

const buttonNode = (node: PermissionCheckNode) =>
  String(node.path || "").trim().startsWith("btn:")

const findPermissionNode = (
  nodes: readonly PermissionCheckNode[] | undefined,
  id: string,
): PermissionCheckNode | null => {
  for (const node of nodes || []) {
    if (String(node.id) === id) return node
    const found = findPermissionNode(node.children, id)
    if (found) return found
  }
  return null
}

const descendantPages = (node: PermissionCheckNode) => {
  const ids: string[] = []
  const walk = (current: PermissionCheckNode) => {
    for (const child of current.children || []) {
      if (!buttonNode(child)) ids.push(String(child.id))
      walk(child)
    }
  }
  walk(node)
  return ids
}

/** Pages on the way to a button, then the buttons themselves. */
const buttonBranch = (node: PermissionCheckNode) => {
  const pages: string[] = []
  const buttons: string[] = []
  const walk = (current: PermissionCheckNode): boolean => {
    let found = false
    for (const child of current.children || []) {
      if (buttonNode(child)) {
        buttons.push(String(child.id))
        found = true
        walk(child)
      } else if (walk(child)) {
        pages.push(String(child.id))
        found = true
      }
    }
    return found
  }
  walk(node)
  return { pages, buttons }
}

/**
 * Checking a page selects its child pages and every button under it.
 * Unchecking a page clears those child pages and buttons, and leaves other branches as they are.
 * Toggling a button does not change anything else.
 */
export function permissionKeysAfterToggle(
  tree: readonly PermissionCheckNode[],
  checkedIds: readonly (string | number)[],
  toggledId: string | number,
) {
  const checked = new Set(checkedIds.map((id) => String(id)))
  const node = findPermissionNode(tree, String(toggledId))
  if (!node || buttonNode(node)) return Array.from(checked)
  const branch = buttonBranch(node)
  const pages = descendantPages(node)
  if (checked.has(String(toggledId))) {
    branch.pages.forEach((id) => checked.add(id))
    branch.buttons.forEach((id) => checked.add(id))
    pages.forEach((id) => checked.add(id))
  } else {
    branch.buttons.forEach((id) => checked.delete(id))
    pages.forEach((id) => checked.delete(id))
  }
  return Array.from(checked)
}

export function buttonAllowed(input: {
  superAdmin: boolean
  catalog: readonly string[]
  granted: readonly string[]
  code: string
}) {
  const code = String(input.code || "").trim()
  if (!code) return true
  if (input.superAdmin) return true
  if (!input.catalog.length) return true
  if (!input.catalog.includes(code)) return true
  return input.granted.includes(code)
}
