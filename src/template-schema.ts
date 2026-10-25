import { z } from 'zod'

const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #RRGGBB')

const fontWeightSchema = z.union([
  z.literal(400),
  z.literal(500),
  z.literal(600),
  z.literal(700),
  z.literal(800),
])

const fontFamilySchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-zA-Z0-9 _-]+$/, 'Font family name can only contain letters, numbers, spaces, hyphens, and underscores')

export const DISALLOWED_CUSTOM_CSS_PATTERN = /<|>|@import|expression\(|-moz-binding|behavior\s*:/i

export const CUSTOM_CSS_CONDITION_PATTERN =
  /^\(\s*(?:min|max)-width\s*:\s*\d{1,5}(?:px|rem|em)\s*\)(?:\s*and\s*\(\s*(?:min|max)-width\s*:\s*\d{1,5}(?:px|rem|em)\s*\))*$/i

export const CUSTOM_CSS_BLOCK_PATTERN = /@(?:container|media)([^{]*)\{([^{}]*)\}/gi

export function customCssProblem(value: string): string | null {
  if (DISALLOWED_CUSTOM_CSS_PATTERN.test(value)) {
    return 'Remove the disallowed part (@import, expression(), or an HTML tag).'
  }
  let remainder = value
  const pattern = new RegExp(CUSTOM_CSS_BLOCK_PATTERN.source, 'gi')
  let match = pattern.exec(value)
  while (match) {
    const condition = match[1].trim()
    if (!CUSTOM_CSS_CONDITION_PATTERN.test(condition)) {
      return `"${condition}" is not a width - write @container (max-width: 560px) { ... }`
    }
    remainder = remainder.replace(match[0], '')
    match = pattern.exec(value)
  }
  if (/[{}]/.test(remainder)) {
    return 'Braces are only for a @container block.'
  }
  return null
}

const customCssSchema = z
  .string()
  .max(2000)
  .refine((value) => customCssProblem(value) === null, {
    message: 'Custom CSS contains disallowed content',
  })

const baseBlockStyleSchema = z
  .object({
    color: hexColorSchema,
    background: hexColorSchema,
    colorOpacity: z.number().min(0).max(100),
    backgroundOpacity: z.number().min(0).max(100),
    padding: z.number().min(0).max(200),
    margin: z.number().min(-200).max(200),
    paddingTop: z.number().min(0).max(200),
    paddingRight: z.number().min(0).max(200),
    paddingBottom: z.number().min(0).max(200),
    paddingLeft: z.number().min(0).max(200),
    marginTop: z.number().min(-200).max(200),
    marginRight: z.number().min(-200).max(200),
    marginBottom: z.number().min(-200).max(200),
    marginLeft: z.number().min(-200).max(200),
    gap: z.number().min(0).max(200),
    fontSize: z.number().min(8).max(96),
    fontWeight: fontWeightSchema,
    fontFamily: fontFamilySchema,
    textAlign: z.enum(['left', 'center', 'right']),
    lineClamp: z.number().min(1).max(10),
    borderRadius: z.number().min(0).max(64),
    borderRadiusTopLeft: z.number().min(0).max(64),
    borderRadiusTopRight: z.number().min(0).max(64),
    borderRadiusBottomRight: z.number().min(0).max(64),
    borderRadiusBottomLeft: z.number().min(0).max(64),
    borderWidth: z.number().min(0).max(20),
    borderColor: hexColorSchema,
    borderColorOpacity: z.number().min(0).max(100),
    direction: z.enum(['row', 'column']),
    wrap: z.boolean(),
    columns: z.number().min(1).max(6),
    align: z.enum(['start', 'center', 'end', 'stretch']),
    justify: z.enum(['start', 'center', 'end', 'space-between']),
    alignSelf: z.enum(['start', 'center', 'end', 'stretch']),
    pushToEnd: z.boolean(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none']),
    aspectRatio: z.enum(['1/1', '4/3', '3/2', '16/9', '3/4', '21/9']),
    opacity: z.number().min(0).max(100),
    boxShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
    lineHeight: z.number().min(0.8).max(3),
    letterSpacing: z.number().min(-0.2).max(1),
    textDecoration: z.enum(['none', 'underline']),
    noWrap: z.boolean(),
    width: z.number().min(0).max(4000),
    widthUnit: z.enum(['px', 'percent', 'fit']),
    maxWidth: z.number().min(0).max(4000),
    minHeight: z.number().min(0).max(4000),
    centerHorizontally: z.boolean(),
    borderWidthTop: z.number().min(0).max(20),
    borderWidthRight: z.number().min(0).max(20),
    borderWidthBottom: z.number().min(0).max(20),
    borderWidthLeft: z.number().min(0).max(20),
    flexMode: z.enum(['auto', 'grow', 'fixed']),
    flexBasis: z.number().min(0).max(100),
    layer: z.enum(['fill', 'front']),
    clip: z.boolean(),
    translateY: z.number().min(-40).max(40),
    customCss: customCssSchema,
  })
  .partial()

export const blockStyleSchema = baseBlockStyleSchema.extend({
  hover: baseBlockStyleSchema.optional(),
  focus: baseBlockStyleSchema.optional(),
})

export type BlockStyle = z.infer<typeof blockStyleSchema>

export const dataBindingKeySchema = z.enum([
  'post.title',
  'post.content',
  'post.excerpt',
  'post.author',
  'post.coverImage',
  'post.publishedAt',
  'post.url',
])
export type DataBindingKey = z.infer<typeof dataBindingKeySchema>

const MAX_LITERAL_TEXT = 2000

export const DATE_FORMATS = [
  'medium',
  'long',
  'dayMonthYear',
  'monthDayYearSlash',
  'dayMonthYearSlash',
  'monthDayYearDash',
  'iso',
] as const
export const dateFormatSchema = z.enum(DATE_FORMATS)
export type DateFormat = z.infer<typeof dateFormatSchema>

export const DEFAULT_DATE_FORMAT: DateFormat = 'medium'

export const textContentSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('literal'), value: z.string().max(MAX_LITERAL_TEXT) }),
  z.object({
    source: z.literal('binding'),
    binding: dataBindingKeySchema,
    dateFormat: dateFormatSchema.optional(),
  }),
])
export type TextContent = z.infer<typeof textContentSchema>

const safeUrlSchema = z
  .string()
  .max(2000)
  .refine(
    (value) => {
      if (value.startsWith('/')) return true
      try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'URL must be http(s) or start with "/"' }
  )

export const imageSourceSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('literal'), value: safeUrlSchema }),
  z.object({ source: z.literal('binding'), binding: z.literal('post.coverImage') }),
])
export type ImageSource = z.infer<typeof imageSourceSchema>

export const linkSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('literal'), value: safeUrlSchema }),
  z.object({ source: z.literal('binding'), binding: z.literal('post.url') }),
])
export type Link = z.infer<typeof linkSchema>

const clickActionSchema = z
  .object({ href: linkSchema, label: z.string().max(120).optional() })
  .optional()

export interface ClickAction {
  href: Link
  label?: string
}

export interface ContainerNode {
  type: 'container'
  id: string
  hidden?: boolean
  style: BlockStyle
  children: BlockNode[]
  clickAction?: ClickAction
}

export interface HeadingNode {
  type: 'heading'
  id: string
  hidden?: boolean
  style: BlockStyle
  level: 1 | 2 | 3 | 4
  content: TextContent
  clickAction?: ClickAction
}

export interface TextNode {
  type: 'text'
  id: string
  hidden?: boolean
  style: BlockStyle
  content: TextContent
  level?: 1 | 2 | 3 | 4
  maxChars?: number
  clickAction?: ClickAction
}

export interface ImageNode {
  type: 'image'
  id: string
  hidden?: boolean
  style: BlockStyle
  source: ImageSource
  alt: string
  clickAction?: ClickAction
}

export interface ButtonNode {
  type: 'button'
  id: string
  hidden?: boolean
  style: BlockStyle
  label: TextContent
  href: Link
}

export interface SpacerNode {
  type: 'spacer'
  id: string
  hidden?: boolean
  size: number
}

export interface PostListLoopNode {
  type: 'postListLoop'
  id: string
  hidden?: boolean
  style: BlockStyle
  itemTemplate: BlockNode
}

export interface PaginationNode {
  type: 'pagination'
  id: string
  hidden?: boolean
  style: BlockStyle
  postsPerPage: number
  mode: 'numbered' | 'loadMore'
  activeStyle?: BlockStyle
}

export interface RichContentNode {
  type: 'richContent'
  id: string
  hidden?: boolean
  style: BlockStyle
}

export interface DividerNode {
  type: 'divider'
  id: string
  hidden?: boolean
  style: BlockStyle
}

export interface TableOfContentsNode {
  type: 'tableOfContents'
  id: string
  hidden?: boolean
  style: BlockStyle
}

export const RELATED_POSTS_SOURCES = ['collection', 'blog'] as const
export type RelatedPostsSource = (typeof RELATED_POSTS_SOURCES)[number]

export const RELATED_POSTS_ORDERS = ['newest', 'oldest', 'random'] as const
export type RelatedPostsOrder = (typeof RELATED_POSTS_ORDERS)[number]

export const MAX_RELATED_POSTS = 3

export interface RelatedPostsNode {
  type: 'relatedPosts'
  id: string
  hidden?: boolean
  style: BlockStyle
  source?: RelatedPostsSource
  order?: RelatedPostsOrder
}

export const CAROUSEL_IMAGE_SIZES = ['small', 'medium', 'large'] as const
export type CarouselImageSize = (typeof CAROUSEL_IMAGE_SIZES)[number]

export const CAROUSEL_NAVIGATIONS = ['arrows', 'scroll'] as const
export type CarouselNavigation = (typeof CAROUSEL_NAVIGATIONS)[number]

export interface CarouselNode {
  type: 'carousel'
  id: string
  hidden?: boolean
  style: BlockStyle
  imageSize: CarouselImageSize
  navigation?: CarouselNavigation
}

export type BlockNode =
  | ContainerNode
  | HeadingNode
  | TextNode
  | ImageNode
  | ButtonNode
  | SpacerNode
  | PostListLoopNode
  | RichContentNode
  | DividerNode
  | TableOfContentsNode
  | RelatedPostsNode
  | CarouselNode
  | PaginationNode

const nodeIdSchema = z.string().min(1).max(64)

const hiddenSchema = z.boolean().optional()

const headingSchema = z.object({
  type: z.literal('heading'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  content: textContentSchema,
  clickAction: clickActionSchema,
})

const textSchema = z.object({
  type: z.literal('text'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
  content: textContentSchema,
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  maxChars: z.number().int().min(10).max(2000).optional(),
  clickAction: clickActionSchema,
})

const imageSchema = z.object({
  type: z.literal('image'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
  source: imageSourceSchema,
  alt: z.string().max(200),
  clickAction: clickActionSchema,
})

const buttonSchema = z.object({
  type: z.literal('button'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
  label: textContentSchema,
  href: linkSchema,
})

const spacerSchema = z.object({
  type: z.literal('spacer'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  size: z.number().min(0).max(200),
})

const richContentSchema = z.object({
  type: z.literal('richContent'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
})

const dividerSchema = z.object({
  type: z.literal('divider'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
})

const tableOfContentsSchema = z.object({
  type: z.literal('tableOfContents'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
})

const relatedPostsSchema = z.object({
  type: z.literal('relatedPosts'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
  source: z.enum(RELATED_POSTS_SOURCES).optional(),
  order: z.enum(RELATED_POSTS_ORDERS).optional(),
})

const carouselSchema = z.object({
  type: z.literal('carousel'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
  imageSize: z.enum(CAROUSEL_IMAGE_SIZES),
  navigation: z.enum(CAROUSEL_NAVIGATIONS).optional(),
})

const paginationNodeSchema = z.object({
  type: z.literal('pagination'),
  id: nodeIdSchema,
  hidden: hiddenSchema,
  style: blockStyleSchema,
  postsPerPage: z.number().min(1).max(50),
  mode: z.enum(['numbered', 'loadMore']),
  activeStyle: blockStyleSchema.optional(),
})

const MAX_CHILDREN = 50

export const blockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
  z.union([
    containerSchema,
    headingSchema,
    textSchema,
    imageSchema,
    buttonSchema,
    spacerSchema,
    richContentSchema,
    postListLoopSchema,
    dividerSchema,
    tableOfContentsSchema,
    relatedPostsSchema,
    carouselSchema,
    paginationNodeSchema,
  ])
)

const containerSchema: z.ZodType<ContainerNode> = z.lazy(() =>
  z.object({
    type: z.literal('container'),
    id: nodeIdSchema,
    hidden: hiddenSchema,
    style: blockStyleSchema,
    children: z.array(blockNodeSchema).max(MAX_CHILDREN),
    clickAction: clickActionSchema,
  })
)

const postListLoopSchema: z.ZodType<PostListLoopNode> = z.lazy(() =>
  z.object({
    type: z.literal('postListLoop'),
    id: nodeIdSchema,
    hidden: hiddenSchema,
    style: blockStyleSchema,
    itemTemplate: blockNodeSchema,
  })
)

export const CURRENT_SCHEMA_VERSION = 1 as const

export const templateDocumentSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  kind: z.enum(['list', 'post']),
  root: blockNodeSchema,
})
export type TemplateDocument = z.infer<typeof templateDocumentSchema>

export const BLOCK_NODE_TYPES = [
  'container',
  'heading',
  'text',
  'image',
  'button',
  'spacer',
  'richContent',
  'postListLoop',
  'divider',
  'tableOfContents',
  'relatedPosts',
  'carousel',
  'pagination',
] as const

export interface CustomFontRef {
  family: string
  url: string
  format: string
}
