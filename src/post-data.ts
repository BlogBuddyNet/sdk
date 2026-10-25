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
  excerpt?: string
  contentHtml?: string
  view_count?: number
  relatedPosts?: PublicPost[]
  headings?: PostHeading[]
  author?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoNoindex?: boolean
}

export interface BindingContext {
  post: PublicPost
  postUrlTemplate?: string
}

export interface PaginationRenderState {
  page: number
  totalPages: number
  loading: boolean
  onPageChange?: (page: number) => void
  onLoadMore?: () => void
  hrefTemplate?: string
}

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

export function extractContentText(content: unknown): string {
  return docTopLevelNodes(content)
    .map(nodeText)
    .filter(Boolean)
    .join('\n\n')
}

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

export const MAX_GALLERY_IMAGES = 5

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

export const DATE_FORMAT_SAMPLE = '2026-03-17T00:00:00.000Z'

export function dateFormatOptions(sample: string = DATE_FORMAT_SAMPLE): { value: DateFormat; example: string }[] {
  return DATE_FORMATS.map((value) => ({ value, example: formatPostDate(sample, value) }))
}

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
    case 'post.author':
      return ctx.post.author ?? ''
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
