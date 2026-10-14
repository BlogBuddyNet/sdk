import { DATE_FORMATS, DEFAULT_DATE_FORMAT, type DataBindingKey, type DateFormat } from './template-schema'

export interface PostHeading {
  id: string
  text: string
  level: number
}

export interface PublicPost {
  id: string
  title: string
  slug: string
  content: unknown
  published_at: string | null
  updated_at?: string
  /** Plain-text summary, derived server-side from `content` at read time. */
  excerpt?: string
  /** Sanitized-by-construction HTML rendering of `content`, computed client-side at save time. */
  contentHtml?: string
  /** Denormalized read counter, incremented by the single-post endpoint. Single-post responses only. */
  view_count?: number
  /** Up to 3 other posts from the same blog, most recent first. Single-post responses only. */
  relatedPosts?: PublicPost[]
  /** This post's headings, derived server-side from `content` at read time, for a "table of contents" block. */
  headings?: PostHeading[]
  /** Byline, when the post names one. Free text, not a BlogBuddy user - a guest post
   * has an author too. Falls back to the blog's configured author for SEO purposes. */
  author?: string | null
  /** Meta/OG title override. The visible headline stays `title` either way. */
  seoTitle?: string | null
  /** Meta description override, ahead of the derived excerpt. */
  seoDescription?: string | null
  /** Keeps the post out of search indexes while leaving it publicly readable. */
  seoNoindex?: boolean
}

export interface BindingContext {
  post: PublicPost
  /** e.g. "/blog/{slug}" - how the customer's own site routes to a post. Required to resolve post.url. */
  postUrlTemplate?: string
}

/** Live pagination state, threaded through the render context so a `pagination` block
 * can draw itself wherever it sits in the tree. */
export interface PaginationRenderState {
  page: number
  totalPages: number
  loading: boolean
  /** Callback mode (the client `<BlogBuddy.List>`): page changes are state updates, so
   * the nav renders <button>s and the list swaps in place without a navigation. */
  onPageChange?: (page: number) => void
  onLoadMore?: () => void
  /** Link mode (the server `<BlogBuddyList>`): a URL pattern containing `{page}`, e.g.
   * "?page={page}" or "/blog/page/{page}". A server component has no click handler to
   * attach, so the nav renders real <a href>s - which is also what makes each page a
   * crawlable URL. Takes precedence over the callbacks if both are set. */
  hrefTemplate?: string
}

/** Substitutes a page number into a `hrefTemplate` - see PaginationRenderState. */
export function paginationHref(template: string, page: number): string {
  return template.replace(/\{page\}/g, String(page))
}

const MAX_EXCERPT_LENGTH = 200

function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; content?: unknown }
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.content)) return n.content.map(nodeText).join('')
  return ''
}

function docTopLevelNodes(content: unknown): unknown[] {
  if (!content || typeof content !== 'object') return []
  const doc = (content as { doc?: unknown }).doc
  if (!doc || typeof doc !== 'object') return []
  const nodes = (doc as { content?: unknown }).content
  return Array.isArray(nodes) ? nodes : []
}

/** Flattens a Tiptap document into plain text, one line per top-level node (structure like headings/lists isn't preserved beyond that - this is a simple summary, not a rendering). Exported so the public API routes can precompute `excerpt` server-side. */
export function extractContentText(content: unknown): string {
  return docTopLevelNodes(content)
    .map(nodeText)
    .filter(Boolean)
    .join('\n\n')
}

/** A post's summary line: its opening prose, cut at a word boundary. Only
 * paragraph-like nodes contribute, so a heading never lands in the middle of it. */
export function buildExcerpt(content: unknown, maxLength = MAX_EXCERPT_LENGTH): string {
  const PROSE_TYPES = new Set(['paragraph', 'blockquote', 'bulletList', 'orderedList'])

  const prose = docTopLevelNodes(content)
    .filter((node) => {
      const type = (node as { type?: unknown })?.type
      return typeof type === 'string' && PROSE_TYPES.has(type)
    })
    .map(nodeText)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (prose.length <= maxLength) return prose

  const clipped = prose.slice(0, maxLength)
  const lastSpace = clipped.lastIndexOf(' ')
  const cut = lastSpace > maxLength * 0.5 ? clipped.slice(0, lastSpace) : clipped
  return `${cut.replace(/[,;:.\s]+$/, '')}…`
}

/** Walks a document for heading nodes, for the "table of contents" block. Heading ids
 * are assigned once at save time and read back as-is, so they always match the `id`
 * attributes in the sibling `contentHtml`. */
export function extractHeadings(content: unknown): PostHeading[] {
  const headings: PostHeading[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: unknown; attrs?: unknown; content?: unknown }
    if (n.type === 'heading') {
      const attrs = n.attrs as { id?: unknown; level?: unknown } | undefined
      const text = nodeText(n)
      if (text && typeof attrs?.id === 'string') {
        headings.push({ id: attrs.id, text, level: typeof attrs.level === 'number' ? attrs.level : 2 })
      }
    }
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }

  docTopLevelNodes(content).forEach(walk)
  return headings
}

/** How many gallery photos a post can carry. Enforced in the post editor's own
 * uploader, again server-side in savePost, and used as the ceiling on the design
 * constructor's "Sample photos" preview counter. */
export const MAX_GALLERY_IMAGES = 5

/** A post's extra photos, from `content.galleryImages`. Empty and non-string entries
 * are dropped and the list is capped. */
export function extractGalleryImages(content: unknown): string[] {
  if (!content || typeof content !== 'object') return []
  const raw = (content as { galleryImages?: unknown }).galleryImages
  if (!Array.isArray(raw)) return []
  return raw
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .slice(0, MAX_GALLERY_IMAGES)
}

function extractCoverImage(content: unknown): string {
  if (
    content &&
    typeof content === 'object' &&
    typeof (content as { coverImage?: unknown }).coverImage === 'string'
  ) {
    return (content as { coverImage: string }).coverImage
  }
  return ''
}

/** Reads the pre-rendered HTML stored alongside a post's blocks. Exported so the public API routes can surface it as `contentHtml`. */
export function extractContentHtml(content: unknown): string {
  if (
    content &&
    typeof content === 'object' &&
    typeof (content as { contentHtml?: unknown }).contentHtml === 'string'
  ) {
    return (content as { contentHtml: string }).contentHtml
  }
  return ''
}

function resolvePostUrl(post: PublicPost, template?: string): string {
  if (!template) return '#'
  return template.replace('{slug}', encodeURIComponent(post.slug))
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Built from UTC parts, not toLocaleDateString, whose ICU tables differ host to host. */
export function formatPostDate(value: string, format: DateFormat = DEFAULT_DATE_FORMAT): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  switch (format) {
    case 'long':
      return `${MONTHS_LONG[month]} ${day}, ${year}`
    case 'dayMonthYear':
      return `${day} ${MONTHS_LONG[month]} ${year}`
    case 'monthDayYearSlash':
      return `${pad(month + 1)}/${pad(day)}/${year}`
    case 'dayMonthYearSlash':
      return `${pad(day)}/${pad(month + 1)}/${year}`
    case 'monthDayYearDash':
      return `${pad(month + 1)}-${pad(day)}-${year}`
    case 'iso':
      return `${year}-${pad(month + 1)}-${pad(day)}`
    case 'medium':
    default:
      return `${MONTHS_SHORT[month]} ${day}, ${year}`
  }
}

/** Fixed, so server and client agree. The 17th tells 03/17 from 17/03 apart. */
export const DATE_FORMAT_SAMPLE = '2026-03-17T00:00:00.000Z'

/** Every format with the example the picker shows for it. */
export function dateFormatOptions(sample: string = DATE_FORMAT_SAMPLE): { value: DateFormat; example: string }[] {
  return DATE_FORMATS.map((value) => ({ value, example: formatPostDate(sample, value) }))
}

/** Resolves a fixed DataBindingKey against a post. Never evaluates the key as code - it's an enum, matched by a switch. */
export function resolveBinding(
  key: DataBindingKey,
  ctx: BindingContext,
  options?: { dateFormat?: DateFormat }
): string {
  switch (key) {
    case 'post.title':
      return ctx.post.title ?? ''
    case 'post.content':
      return extractContentText(ctx.post.content)
    case 'post.excerpt':
      return ctx.post.excerpt ?? buildExcerpt(ctx.post.content)
    case 'post.coverImage':
      return extractCoverImage(ctx.post.content)
    case 'post.publishedAt':
      return ctx.post.published_at ? formatPostDate(ctx.post.published_at, options?.dateFormat) : ''
    case 'post.url':
      return resolvePostUrl(ctx.post, ctx.postUrlTemplate)
    default: {
      const exhaustive: never = key
      return exhaustive
    }
  }
}
