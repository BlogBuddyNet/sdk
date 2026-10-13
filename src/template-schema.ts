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

export const DISALLOWED_CUSTOM_CSS_PATTERN = /<|>|[{}]|@import|expression\(|-moz-binding|behavior\s*:/i

const customCssSchema = z
  .string()
  .max(2000)
  .refine((value) => !DISALLOWED_CUSTOM_CSS_PATTERN.test(value), {
    message: 'Custom CSS contains disallowed content',
  })

const baseBlockStyleSchema = z
  .object({
    color: hexColorSchema,
    background: hexColorSchema,
    colorOpacity: z.number().min(0).max(100),
    backgroundOpacity: z.number().min(0).max(100),
    padding: z.number().min(0).max(200),
    margin: z.number().min(0).max(200),
    paddingTop: z.number().min(0).max(200),
    paddingRight: z.number().min(0).max(200),
    paddingBottom: z.number().min(0).max(200),
    paddingLeft: z.number().min(0).max(200),
    marginTop: z.number().min(0).max(200),
    marginRight: z.number().min(0).max(200),
    marginBottom: z.number().min(0).max(200),
    marginLeft: z.number().min(0).max(200),
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
    aspectRatio: z.enum(['1/1', '4/3', '16/9', '3/4', '21/9']),
    opacity: z.number().min(0).max(100),
    boxShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
    customCss: customCssSchema,
  })
  .partial()

export const blockStyleSchema = baseBlockStyleSchema.extend({
  hover: baseBlockStyleSchema.optional(),
  mobile: baseBlockStyleSchema.optional(),
})

export type BlockStyle = z.infer<typeof blockStyleSchema>

export const dataBindingKeySchema = z.enum([
  'post.title',
  'post.content',
  'post.excerpt',
  'post.coverImage',
  'post.publishedAt',
  'post.url',
])
export type DataBindingKey = z.infer<typeof dataBindingKeySchema>

const MAX_LITERAL_TEXT = 2000

export const textContentSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('literal'), value: z.string().max(MAX_LITERAL_TEXT) }),
  z.object({ source: z.literal('binding'), binding: dataBindingKeySchema }),
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

/** Optional on every block type that can carry one - see ClickAction above. */
const clickActionSchema = z
  .object({ href: linkSchema, label: z.string().max(120).optional() })
  .optional()

/**
 * Makes a whole block clickable, so a post card can open its post without a separate
 * "Read more" button. Rendered as a real `<a>` stretched over the block.
 *
 * `label` is the accessible name, since the anchor covers the block rather than wrapping
 * text. Defaults to the post title when the href is bound to a post.
 */
export interface ClickAction {
  href: Link
  label?: string
}

export interface ContainerNode {
  type: 'container'
  id: string
  style: BlockStyle
  children: BlockNode[]
  clickAction?: ClickAction
}

export interface HeadingNode {
  type: 'heading'
  id: string
  style: BlockStyle
  level: 1 | 2 | 3 | 4
  content: TextContent
  clickAction?: ClickAction
}

export interface TextNode {
  type: 'text'
  id: string
  style: BlockStyle
  content: TextContent
  clickAction?: ClickAction
}

export interface ImageNode {
  type: 'image'
  id: string
  style: BlockStyle
  source: ImageSource
  alt: string
  clickAction?: ClickAction
}

export interface ButtonNode {
  type: 'button'
  id: string
  style: BlockStyle
  label: TextContent
  href: Link
}

export interface SpacerNode {
  type: 'spacer'
  id: string
  size: number
}

export interface PostListLoopNode {
  type: 'postListLoop'
  id: string
  style: BlockStyle
  itemTemplate: BlockNode
}

export interface PaginationNode {
  type: 'pagination'
  id: string
  style: BlockStyle
  postsPerPage: number
  mode: 'numbered' | 'loadMore'
  activeStyle?: BlockStyle
}

export interface RichContentNode {
  type: 'richContent'
  id: string
  style: BlockStyle
}

export interface DividerNode {
  type: 'divider'
  id: string
  style: BlockStyle
}

export interface TableOfContentsNode {
  type: 'tableOfContents'
  id: string
  style: BlockStyle
}

/**
 * Where a "Related posts" block draws from.
 *
 * 'collection': posts in the same collection, falling back to the whole blog when this
 * post is in none. 'blog': any other post in the blog.
 */
export const RELATED_POSTS_SOURCES = ['collection', 'blog'] as const
export type RelatedPostsSource = (typeof RELATED_POSTS_SOURCES)[number]

/** Which of the candidates win the (at most 3) slots. 'random' is picked fresh per
 * request, so a reader coming back to the same article is shown something else. */
export const RELATED_POSTS_ORDERS = ['newest', 'oldest', 'random'] as const
export type RelatedPostsOrder = (typeof RELATED_POSTS_ORDERS)[number]

/** How many suggestions the block will ever show. */
export const MAX_RELATED_POSTS = 3

export interface RelatedPostsNode {
  type: 'relatedPosts'
  id: string
  style: BlockStyle
  source?: RelatedPostsSource
  order?: RelatedPostsOrder
}

/** How wide each photo in a carousel is drawn. Three fixed steps rather than a free px
 * number - see CAROUSEL_IMAGE_WIDTHS in style-utils.ts for what they resolve to. */
export const CAROUSEL_IMAGE_SIZES = ['small', 'medium', 'large'] as const
export type CarouselImageSize = (typeof CAROUSEL_IMAGE_SIZES)[number]

/** How a reader moves along the strip. 'arrows' draws previous/next buttons over it;
 * 'scroll' leaves it to the trackpad, wheel, touch and keyboard, with a visible
 * scrollbar as the affordance instead. Both modes stay scrollable either way - this
 * chooses what is *drawn*, so 'arrows' never takes swiping away on a phone. */
export const CAROUSEL_NAVIGATIONS = ['arrows', 'scroll'] as const
export type CarouselNavigation = (typeof CAROUSEL_NAVIGATIONS)[number]

export interface CarouselNode {
  type: 'carousel'
  id: string
  style: BlockStyle
  imageSize: CarouselImageSize
  /** Optional so a carousel saved before this field existed keeps rendering - it reads
   * as the 'arrows' it was built with. */
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

const headingSchema = z.object({
  type: z.literal('heading'),
  id: nodeIdSchema,
  style: blockStyleSchema,
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  content: textContentSchema,
  clickAction: clickActionSchema,
})

const textSchema = z.object({
  type: z.literal('text'),
  id: nodeIdSchema,
  style: blockStyleSchema,
  content: textContentSchema,
  clickAction: clickActionSchema,
})

const imageSchema = z.object({
  type: z.literal('image'),
  id: nodeIdSchema,
  style: blockStyleSchema,
  source: imageSourceSchema,
  alt: z.string().max(200),
  clickAction: clickActionSchema,
})

const buttonSchema = z.object({
  type: z.literal('button'),
  id: nodeIdSchema,
  style: blockStyleSchema,
  label: textContentSchema,
  href: linkSchema,
})

const spacerSchema = z.object({
  type: z.literal('spacer'),
  id: nodeIdSchema,
  size: z.number().min(0).max(200),
})

const richContentSchema = z.object({
  type: z.literal('richContent'),
  id: nodeIdSchema,
  style: blockStyleSchema,
})

const dividerSchema = z.object({
  type: z.literal('divider'),
  id: nodeIdSchema,
  style: blockStyleSchema,
})

const tableOfContentsSchema = z.object({
  type: z.literal('tableOfContents'),
  id: nodeIdSchema,
  style: blockStyleSchema,
})

const relatedPostsSchema = z.object({
  type: z.literal('relatedPosts'),
  id: nodeIdSchema,
  style: blockStyleSchema,
  source: z.enum(RELATED_POSTS_SOURCES).optional(),
  order: z.enum(RELATED_POSTS_ORDERS).optional(),
})

const carouselSchema = z.object({
  type: z.literal('carousel'),
  id: nodeIdSchema,
  style: blockStyleSchema,
  imageSize: z.enum(CAROUSEL_IMAGE_SIZES),
  navigation: z.enum(CAROUSEL_NAVIGATIONS).optional(),
})

const paginationNodeSchema = z.object({
  type: z.literal('pagination'),
  id: nodeIdSchema,
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
    style: blockStyleSchema,
    children: z.array(blockNodeSchema).max(MAX_CHILDREN),
    clickAction: clickActionSchema,
  })
)

const postListLoopSchema: z.ZodType<PostListLoopNode> = z.lazy(() =>
  z.object({
    type: z.literal('postListLoop'),
    id: nodeIdSchema,
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

/** A custom font uploaded for a blog (constructor's "Fonts" panel), returned alongside its templates by /api/v1/templates. The renderers inject one @font-face rule per entry. */
export interface CustomFontRef {
  family: string
  url: string
  format: string
}
