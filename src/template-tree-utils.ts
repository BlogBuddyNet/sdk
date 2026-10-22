import type { BlockNode, BlockStyle, PaginationNode, PostListLoopNode, RelatedPostsNode } from './template-schema'

/** The node's children, whether they live in `container.children` or `postListLoop.itemTemplate`. Exported for the constructor's tree flattening (layers panel, drag-and-drop). */
export function getChildren(node: BlockNode): BlockNode[] {
  if (node.type === 'container') return node.children
  if (node.type === 'postListLoop') return [node.itemTemplate]
  return []
}

function withChildren(node: BlockNode, children: BlockNode[]): BlockNode {
  if (node.type === 'container') return { ...node, children }
  if (node.type === 'postListLoop') return { ...node, itemTemplate: children[0] }
  return node
}

/** The id of `id`'s parent node, or null if `id` is the root or isn't found. */
export function findParentId(root: BlockNode, id: string): string | null {
  for (const child of getChildren(root)) {
    if (child.id === id) return root.id
    const found = findParentId(child, id)
    if (found) return found
  }
  return null
}

/** True if `descendantId` is `ancestorId` itself, or is found anywhere under it. Used to reject drops that would create a cycle. */
export function isSelfOrDescendant(ancestor: BlockNode, descendantId: string): boolean {
  if (ancestor.id === descendantId) return true
  return getChildren(ancestor).some((child) => isSelfOrDescendant(child, descendantId))
}

export function findNodeById(root: BlockNode, id: string): BlockNode | undefined {
  if (root.id === id) return root
  for (const child of getChildren(root)) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return undefined
}

/** Finds the first postListLoop anywhere in a 'list'-kind document and returns its per-post card design. Used to render a single post as a compact card (matching the list's own item design) instead of the full post-page template - see BlogBuddy.Post's `expanded` prop. */
export function getListItemTemplate(root: BlockNode): BlockNode | undefined {
  return getPostListLoopNode(root)?.itemTemplate
}

/** Finds the first postListLoop node anywhere in a document. */
export function getPostListLoopNode(root: BlockNode): PostListLoopNode | undefined {
  if (root.type === 'postListLoop') return root
  for (const child of getChildren(root)) {
    const found = getPostListLoopNode(child)
    if (found) return found
  }
  return undefined
}

/** Finds the first pagination block in a document, so a caller can read its
 * postsPerPage and mode. Fetching is the caller's concern; the renderers only draw
 * whatever `ctx.pagination` state they are handed. */
export function getPaginationNode(root: BlockNode): PaginationNode | undefined {
  if (root.type === 'pagination') return root
  for (const child of getChildren(root)) {
    const found = getPaginationNode(child)
    if (found) return found
  }
  return undefined
}

/** Finds the first "Related posts" block anywhere in a document. Read server-side by
 * the public single-post endpoint, which needs the block's own Source/Order settings to
 * know which posts to suggest - the selection is a database query, so it cannot happen
 * at render time the way every other block's settings do. */
export function getRelatedPostsNode(root: BlockNode): RelatedPostsNode | undefined {
  if (root.type === 'relatedPosts') return root
  for (const child of getChildren(root)) {
    const found = getRelatedPostsNode(child)
    if (found) return found
  }
  return undefined
}

/** Returns a new tree with `id` replaced by `updater(node)`. Leaves the tree untouched (same reference) if `id` isn't found. */
export function updateNodeById(
  root: BlockNode,
  id: string,
  updater: (node: BlockNode) => BlockNode
): BlockNode {
  if (root.id === id) return updater(root)
  const children = getChildren(root)
  if (children.length === 0) return root

  let changed = false
  const nextChildren = children.map((child) => {
    const next = updateNodeById(child, id, updater)
    if (next !== child) changed = true
    return next
  })

  return changed ? withChildren(root, nextChildren) : root
}

/** Deep-clones `node` and every descendant with fresh ids, so the copy can be inserted
 * alongside the original without id collisions. Used by the constructor's "Duplicate"
 * action. */
export function cloneWithNewIds(node: BlockNode): BlockNode {
  const cloned = { ...node, id: crypto.randomUUID() }
  const children = getChildren(node).map(cloneWithNewIds)
  return children.length > 0 ? withChildren(cloned, children) : cloned
}

/** Inserts `newNode` into the container at `parentId`'s children at `index` (clamped). No-op if `parentId` isn't a container. */
export function insertNode(
  root: BlockNode,
  parentId: string,
  index: number,
  newNode: BlockNode
): BlockNode {
  return updateNodeById(root, parentId, (node) => {
    if (node.type !== 'container') return node
    const children = [...node.children]
    const at = Math.max(0, Math.min(index, children.length))
    children.splice(at, 0, newNode)
    return { ...node, children }
  })
}

/** Removes the node with `id` from its parent container. No-op for the root node itself, or if `id` isn't found. */
export function removeNode(root: BlockNode, id: string): BlockNode {
  if (root.id === id) return root
  const children = getChildren(root)
  if (children.length === 0) return root

  if (root.type === 'container' && root.children.some((child) => child.id === id)) {
    return { ...root, children: root.children.filter((child) => child.id !== id) }
  }

  let changed = false
  const nextChildren = children.map((child) => {
    const next = removeNode(child, id)
    if (next !== child) changed = true
    return next
  })

  return changed ? withChildren(root, nextChildren) : root
}

/** Returns a new tree with every block's `fontFamily` cleared back to the default
 * wherever it references `familyName` - in the base style, the `hover` override, the
 * `mobile` override, and a pagination node's `activeStyle`. Used when a custom font is
 * deleted, so no block is left pointing at a font that no longer exists. */
export function clearFontFamilyReferences(root: BlockNode, familyName: string): BlockNode {
  function clearStyle(style: BlockStyle): BlockStyle {
    let next = style
    if (next.fontFamily === familyName) next = { ...next, fontFamily: undefined }
    if (next.hover?.fontFamily === familyName) {
      next = { ...next, hover: { ...next.hover, fontFamily: undefined } }
    }
    return next
  }

  function visit(node: BlockNode): BlockNode {
    let updated: BlockNode = node
    if ('style' in updated) {
      const style = clearStyle(updated.style)
      if (style !== updated.style) updated = { ...updated, style }
    }
    if (updated.type === 'pagination' && updated.activeStyle) {
      const activeStyle = clearStyle(updated.activeStyle)
      if (activeStyle !== updated.activeStyle) updated = { ...updated, activeStyle }
    }
    const children = getChildren(updated)
    if (children.length > 0) {
      const nextChildren = children.map(visit)
      if (nextChildren.some((c, i) => c !== children[i])) {
        updated = withChildren(updated, nextChildren)
      }
    }
    return updated
  }

  return visit(root)
}

/**
 * Removes any node whose `type` the schema no longer knows about, along with its
 * subtree, so a document saved against an older schema still validates on the next save.
 *
 * A postListLoop whose `itemTemplate` is stripped keeps a placeholder container: the
 * slot is required, and losing the loop would take every post with it.
 */
export function stripUnknownNodeTypes(root: BlockNode, knownTypes: ReadonlySet<string>): BlockNode {
  function visit(node: BlockNode): BlockNode | null {
    if (!knownTypes.has(node.type)) return null

    if (node.type === 'container') {
      const existing = Array.isArray(node.children) ? node.children : []
      const children = existing.map(visit).filter((child): child is BlockNode => child !== null)
      if (!Array.isArray(node.children)) return { ...node, children }
      return children.length === existing.length && children.every((c, i) => c === existing[i])
        ? node
        : { ...node, children }
    }

    if (node.type === 'postListLoop') {
      const itemTemplate = node.itemTemplate ? visit(node.itemTemplate) : null
      if (itemTemplate === node.itemTemplate) return node
      return {
        ...node,
        itemTemplate: itemTemplate ?? {
          type: 'container',
          id: crypto.randomUUID(),
          style: { direction: 'column', gap: 8 },
          children: [],
        },
      }
    }

    return node
  }

  return visit(root) ?? root
}

/** Structural equality for two template documents, which is what answers "is this
 * design still the preset?". Key order is not significant. */
export function documentsMatch(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null) return false
  if (typeof a !== 'object') return false

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, i) => documentsMatch(item, b[i]))
  }

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
  for (const key of Array.from(keys)) {
    if (aObj[key] === undefined && bObj[key] === undefined) continue
    if (!documentsMatch(aObj[key], bObj[key])) return false
  }
  return true
}
