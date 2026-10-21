import { TemplateRenderer } from './renderer-react'
import { DEFAULT_BASE_URL } from './api-origin'
import { getListItemTemplate, getPaginationNode } from './template-tree-utils'
import type { PublicPost } from './post-data'
import type { CustomFontRef, TemplateDocument } from './template-schema'
import { ArticleJsonLd, JsonLd } from './json-ld'
import { BlogBuddyViewBeacon } from './view-beacon'
import {
  blogIndexUrl,
  buildBlogJsonLd,
  buildBlogMetadata,
  buildBreadcrumbJsonLd,
  buildPostMetadata,
  buildSitemapEntries,
  type SeoSiteConfig,
  type SitemapEntry,
} from './seo'
import { buildAtomFeed, buildRssFeed, type FeedOptions } from './feed'

/**
 * Everything the SDK needs, in one object. The SEO fields are fallbacks: Blog settings
 * wins over them.
 *
 *   export const blog = {
 *     blog: 'field-notes',
 *     apiKey: process.env.BLOGBUDDY_API_KEY!,
 *     siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
 *     postUrlTemplate: '/blog/{slug}',
 *   }
 */
export type BlogBuddyConfig = BlogBuddyServerOptions & Partial<Omit<SeoSiteConfig, 'postUrlTemplate'>>

export interface BlogBuddyServerOptions {
  /** The blog's slug, e.g. "engineering-updates". */
  blog: string
  /** An API key from Dashboard -> API keys. Never sent to the browser by these
   * components, so a server-side secret is fine here. */
  apiKey: string
  /** BlogBuddy's origin. Override only when self-hosting. */
  baseUrl?: string
  /** e.g. "/blog/{slug}" - how this site routes to a post, for "Read more" links.
   * Defaults to the pattern configured in BlogBuddy's blog settings. */
  postUrlTemplate?: string
  /** Passed to fetch's Next.js cache options. Defaults to revalidating hourly so a
   * newly published post appears without a redeploy. */
  revalidate?: number | false
}

const DEFAULT_REVALIDATE = 3600

/** What /api/v1/blog returns. Every field past `slug` is deliberately named to match
 * SeoSiteConfig, so `seoConfig()` below is a spread rather than a transcription. */
export interface BlogConfig {
  name: string
  slug: string
  siteUrl: string | null
  postUrlTemplate: string
  siteName: string | null
  defaultImage: string | null
  defaultImageWidth: number | null
  defaultImageHeight: number | null
  authorName: string | null
  locale: string | null
}

/** Thrown by every request helper. `status` is the HTTP status, so a 404 can be told
 * apart from a 500 without reading the message. */
export class BlogBuddyRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'BlogBuddyRequestError'
    this.status = status
  }
}

/** Whether an error is a BlogBuddy request failure with this status. */
export function isRequestError(error: unknown, status?: number): error is BlogBuddyRequestError {
  if (!(error instanceof Error) || error.name !== 'BlogBuddyRequestError') return false
  return status === undefined || (error as BlogBuddyRequestError).status === status
}

async function apiFetch<T>(
  path: string,
  { apiKey, baseUrl = DEFAULT_BASE_URL, revalidate = DEFAULT_REVALIDATE }: BlogBuddyServerOptions
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    ...(revalidate === false ? { cache: 'no-store' as const } : { next: { revalidate } }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      (body && typeof body.error === 'string' && body.error) ||
      `BlogBuddy request failed with ${response.status}`
    throw new BlogBuddyRequestError(message, response.status)
  }

  return (await response.json()) as T
}

/** The blog's configuration, including where it is published on this site. Exported so
 * a `generateMetadata` can build its SeoSiteConfig from the same source the renderer
 * uses, rather than repeating the site URL in two places that can drift apart. */
export async function getBlogConfig(options: BlogBuddyServerOptions): Promise<BlogConfig> {
  const { data } = await apiFetch<{ data: BlogConfig }>(
    `/api/v1/blog?blog=${encodeURIComponent(options.blog)}`,
    options
  )
  return data
}

/**
 * The resolved SEO config: Blog settings, with your own config filling the gaps.
 *
 * Rarely needed directly, since the components call it themselves. A network failure
 * resolves to your own values rather than throwing.
 */
export async function seoConfig(config: BlogBuddyConfig): Promise<SeoSiteConfig> {
  const fallback: SeoSiteConfig = {
    siteUrl: config.siteUrl ?? '',
    postUrlTemplate: config.postUrlTemplate ?? '/blog/{slug}',
    siteName: config.siteName,
    defaultImage: config.defaultImage,
    defaultImageWidth: config.defaultImageWidth,
    defaultImageHeight: config.defaultImageHeight,
    authorName: config.authorName,
    authorUrl: config.authorUrl,
    locale: config.locale,
    postImageUrlTemplate: config.postImageUrlTemplate,
    pageUrlTemplate: config.pageUrlTemplate,
  }

  const blog = await optionalBlogConfig(config)
  if (!blog) return fallback

  return {
    ...fallback,
    siteUrl: config.siteUrl ?? blog.siteUrl ?? fallback.siteUrl,
    postUrlTemplate: config.postUrlTemplate ?? blog.postUrlTemplate ?? fallback.postUrlTemplate,
    siteName: blog.siteName ?? fallback.siteName,
    defaultImage: blog.defaultImage ?? fallback.defaultImage,
    defaultImageWidth: blog.defaultImageWidth ?? fallback.defaultImageWidth,
    defaultImageHeight: blog.defaultImageHeight ?? fallback.defaultImageHeight,
    authorName: blog.authorName ?? fallback.authorName,
    locale: blog.locale ?? fallback.locale,
  }
}

export async function getPost(
  options: BlogBuddyServerOptions & { slug: string }
): Promise<PublicPost> {
  const { data } = await apiFetch<{ data: PublicPost }>(
    `/api/v1/posts/${encodeURIComponent(options.slug)}?blog=${encodeURIComponent(options.blog)}`,
    options
  )
  return data
}

export async function getPosts(
  options: BlogBuddyServerOptions & { page?: number; perPage?: number }
): Promise<PublicPost[]> {
  const query = new URLSearchParams({ blog: options.blog })
  if (options.perPage) {
    query.set('per_page', String(options.perPage))
    query.set('page', String(options.page ?? 1))
  }
  const { data } = await apiFetch<{ data: PublicPost[] }>(`/api/v1/posts?${query}`, options)
  return data
}

export interface PostsPage {
  posts: PublicPost[]
  page: number
  totalPages: number
}

/** getPosts, but also returning how many pages there are - what a paginated list needs
 * in order to render a nav. Separate from getPosts so the common "just give me the
 * posts" call keeps its simpler return type. */
export async function getPostsPage(
  options: BlogBuddyServerOptions & { page?: number; perPage: number }
): Promise<PostsPage> {
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const query = new URLSearchParams({
    blog: options.blog,
    per_page: String(options.perPage),
    page: String(page),
  })
  const { data, meta } = await apiFetch<{
    data: PublicPost[]
    meta?: { count: number; page?: number; perPage?: number; total?: number; totalPages?: number }
  }>(`/api/v1/posts?${query}`, options)
  return { posts: data, page, totalPages: meta?.totalPages ?? 1 }
}

/** Every published post's slug and dates, for a sitemap. Deliberately does not fetch
 * post bodies - see `fields=sitemap`. */
export async function getPostsForSitemap(
  options: BlogBuddyServerOptions
): Promise<Pick<PublicPost, 'slug' | 'published_at' | 'updated_at' | 'seoNoindex'>[]> {
  const { data } = await apiFetch<{ data: PublicPost[] }>(
    `/api/v1/posts?blog=${encodeURIComponent(options.blog)}&fields=sitemap`,
    options
  )
  return data
}

/** getBlogConfig, but a failure resolves to null instead of throwing - see the call
 * sites in the components below. */
async function optionalBlogConfig(options: BlogBuddyServerOptions): Promise<BlogConfig | null> {
  try {
    return await getBlogConfig(options)
  } catch {
    return null
  }
}

async function getTemplates(options: BlogBuddyServerOptions) {
  return apiFetch<{
    data: { list: TemplateDocument; post: TemplateDocument; fonts?: CustomFontRef[] }
  }>(
    `/api/v1/templates?blog=${encodeURIComponent(options.blog)}`,
    options
  )
}

/** A single post, rendered on the server with the design published for this blog, so
 * the HTML is in the document a crawler downloads. */
function assertServerRuntime(component: string): never | void {
  const proc = (globalThis as { process?: { versions?: { node?: string } } }).process
  if (proc?.versions?.node) return
  throw new Error(
    `<${component}> is a server component and cannot run in the browser. This build has ` +
      'no server pass, so nothing here can be rendered ahead of time or seen by a crawler. ' +
      'Render it in the browser instead - same design, same props, and it emits the ' +
      'same title, description, canonical and JSON-LD:\n\n' +
      "  import { BlogBuddy } from '@blogbuddy/sdk/renderer'\n" +
      "  <BlogBuddy.Post ... />   // or <BlogBuddy.List ... />\n\n" +
      'If you did mean to server-render, you are in a Next.js App Router app and this ' +
      "module reached the browser because a file above it is marked 'use client'."
  )
}

export async function BlogBuddyPost({
  expanded = true,
  jsonLd = true,
  countViews = true,
  referrer = true,
  breadcrumbHome,
  onNotFound,
  ...options
}: BlogBuddyConfig & {
  slug: string
  expanded?: boolean
  /** Structured data is emitted by default: the component has already fetched the post
   * and the config, so there is nothing left for you to wire up. Turn it off only to
   * emit your own. */
  jsonLd?: boolean
  /**
   * Whether reading this post counts as a view. On by default.
   *
   * Counting happens in the browser after render, so this puts your `apiKey` in the
   * page. The key is blog-scoped and meant to be publishable, but set this to false to
   * keep it server-side, or for a preview route where a read is not a reader.
   */
  countViews?: boolean
  /** Send the page the reader arrived from, for the Sources panel in Analytics. Only
   * the site is recorded, never the full address. On by default; set false to count the
   * view without it. */
  referrer?: boolean
  /** Label for the site root in the breadcrumb trail, e.g. "Acme". Omitted, the trail
   * starts at the blog. */
  breadcrumbHome?: string
  /**
   * Called instead of throwing when the slug matches no published post.
   *
   * Pass your framework's own helper and the component needs no second fetch to decide:
   *
   *   import { notFound } from 'next/navigation'
   *   <BlogBuddyPost {...blog} slug={slug} onNotFound={notFound} />
   *
   * Without it a missing post throws, which a framework will usually turn into a 500.
   */
  onNotFound?: () => never | void
}) {
  assertServerRuntime('BlogBuddyPost')

  let fetched: [
    PublicPost,
    Awaited<ReturnType<typeof getTemplates>>,
    BlogConfig | null,
    SeoSiteConfig,
  ]
  try {
    fetched = await Promise.all([
      getPost(options),
      getTemplates(options),
      optionalBlogConfig(options),
      seoConfig(options),
    ])
  } catch (error) {
    if (onNotFound && isRequestError(error, 404)) {
      onNotFound()
      return null
    }
    throw error
  }
  const [post, templates, config, seo] = fetched

  const document = expanded
    ? templates.data.post
    :
      (() => {
        const itemTemplate = getListItemTemplate(templates.data.list.root)
        return itemTemplate ? { ...templates.data.list, root: itemTemplate } : templates.data.post
      })()

  return (
    <>
      {/* Counting a read used to be a side effect of the API answering one, which is what
          kept the single-post route off the CDN: a cached response never reaches the
          origin, so the number would have become "origin fetches" rather than "readers".
          The read is cached now, and this is what counts it. */}
      {countViews ? (
        <BlogBuddyViewBeacon
          blog={options.blog}
          slug={options.slug}
          apiKey={options.apiKey}
          baseUrl={options.baseUrl}
          referrer={referrer}
        />
      ) : null}
      {jsonLd && seo.siteUrl ? (
        <>
          <ArticleJsonLd post={post} config={seo} />
          <JsonLd data={buildBreadcrumbJsonLd(post, seo, { home: breadcrumbHome })} />
        </>
      ) : null}
      <TemplateRenderer
        document={document}
        post={post}
        posts={[post]}
        fonts={templates.data.fonts ?? []}
        postUrlTemplate={options.postUrlTemplate ?? config?.postUrlTemplate ?? '/blog/{slug}'}
      />
    </>
  )
}

/**
 * The blog's list page, rendered on the server. Page controls are links, so every page
 * has a crawlable URL. `perPage` turns pagination on; omit it and every post renders on
 * one page.
 *
 *   export default async function Page({ searchParams }) {
 *     const { page } = await searchParams
 *     return <BlogBuddyList blog="..." apiKey={...} perPage={10} page={Number(page) || 1} />
 *   }
 */
export async function BlogBuddyList({
  page,
  perPage,
  pageHref,
  jsonLd = true,
  title,
  description,
  ...options
}: BlogBuddyConfig & {
  page?: number
  perPage?: number
  /** Structured data for the index, on by default - same reasoning as BlogBuddyPost. */
  jsonLd?: boolean
  /** Used in the Blog structured data, and matched to whatever blogBuddyMetadata is
   * given so the two describe the page the same way. */
  title?: string
  description?: string
  /** URL pattern for a page link, containing `{page}`. Defaults to "?page={page}",
   * which keeps the current path and works with the `searchParams` example above; pass
   * e.g. "/blog/page/{page}" if the site routes pages as real path segments. */
  pageHref?: string
}) {
  assertServerRuntime('BlogBuddyList')

  const currentPage = Math.max(1, Math.floor(page ?? 1))

  const [initial, templates, config] = await Promise.all([
    perPage
      ? getPostsPage({ ...options, page: currentPage, perPage })
      : getPosts(options).then((posts) => ({ posts, page: 1, totalPages: 1 })),
    getTemplates(options),
    optionalBlogConfig(options),
  ])

  const seo = await seoConfig(options)
  const paginationNode = getPaginationNode(templates.data.list.root)
  const cumulative = Boolean(perPage) && paginationNode?.mode === 'loadMore' && currentPage > 1
  const posts = cumulative
    ? (await getPostsPage({ ...options, page: 1, perPage: perPage! * currentPage })).posts
    : initial.posts

  return (
    <>
      {jsonLd && seo.siteUrl ? (
        <JsonLd
          data={buildBlogJsonLd(posts, { ...seo, title, description, page: currentPage })}
        />
      ) : null}
    <TemplateRenderer
      document={templates.data.list}
      posts={posts}
      fonts={templates.data.fonts ?? []}
      postUrlTemplate={options.postUrlTemplate ?? config?.postUrlTemplate ?? '/blog/{slug}'}
      pagination={
        perPage
          ? {
              page: currentPage,
              totalPages: initial.totalPages,
              loading: false,
              hrefTemplate: pageHref ?? '?page={page}',
            }
          : undefined
      }
    />
    </>
  )
}

/**
 * `generateMetadata` for a post page or a blog index. Which one it produces depends on
 * whether the route has a `slug` param, so the same helper works in both.
 *
 *   export const generateMetadata = blogBuddyMetadata(blog)
 */
/** What blogBuddyMetadata resolves to. One shape for post, index and not found, so the
 * result can be spread without narrowing. Structurally compatible with Next's
 * `Metadata`. */
export interface BlogBuddyRouteMetadata {
  title: string
  description?: string
  alternates?: { canonical?: string; types?: Record<string, string> }
  robots?: unknown
  openGraph?: Record<string, unknown>
  twitter?: Record<string, unknown>
}

export function blogBuddyMetadata(
  config: BlogBuddyConfig,
  options: { title?: string; description?: string; home?: string } = {}
) {
  return async function generateMetadata({
    params,
    searchParams,
  }: {
    params?: Promise<{ slug?: string }>
    searchParams?: Promise<{ page?: string }>
  } = {}): Promise<BlogBuddyRouteMetadata> {
    const seo = await seoConfig(config)
    const slug = (await params)?.slug

    if (slug) {
      try {
        return buildPostMetadata(await getPost({ ...config, slug }), seo)
      } catch {
        return { title: options.title ?? 'Not found' }
      }
    }

    const page = Number((await searchParams)?.page) || 1
    return buildBlogMetadata({ ...seo, title: options.title, description: options.description, page })
  }
}

/**
 * `generateStaticParams` for a post page, prerendering every post.
 *
 *   export const generateStaticParams = blogBuddyStaticParams(blog)
 */
export function blogBuddyStaticParams(config: BlogBuddyConfig) {
  return async function generateStaticParams() {
    try {
      return (await getPostsForSitemap(config)).map((post) => ({ slug: post.slug }))
    } catch {
      return []
    }
  }
}

/**
 * A `sitemap.ts` default export, listing the blog index and every post. Pass `extra` for
 * the rest of the site's pages.
 *
 *   export default blogBuddySitemap(blog)
 */
export function blogBuddySitemap(
  config: BlogBuddyConfig,
  options: { extra?: SitemapEntry[] } = {}
) {
  return async function sitemap(): Promise<SitemapEntry[]> {
    const seo = await seoConfig(config)
    const index: SitemapEntry = {
      url: blogIndexUrl(seo),
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.9,
    }

    try {
      return [...(options.extra ?? []), index, ...buildSitemapEntries(await getPostsForSitemap(config), seo)]
    } catch {
      return [...(options.extra ?? []), index]
    }
  }
}

/**
 * A feed route's `GET` handler. RSS by default; pass `format: 'atom'` for the other.
 *
 *   export const GET = blogBuddyFeed(blog, { feedUrl: 'https://acme.com/blog/feed.xml' })
 */
export function blogBuddyFeed(
  config: BlogBuddyConfig,
  options: Omit<FeedOptions, 'feedUrl'> & { feedUrl?: string; format?: 'rss' | 'atom' } = {}
) {
  return async function GET(): Promise<Response> {
    const seo = await seoConfig(config)
    const { format = 'rss', feedUrl, ...feedOptions } = options
    const build = format === 'atom' ? buildAtomFeed : buildRssFeed
    const origin = seo.siteUrl.replace(/\/+$/, '')

    const resolved = feedUrl?.startsWith('/')
      ? `${origin}${feedUrl}`
      : (feedUrl ?? `${origin}/blog/${format === 'atom' ? 'atom' : 'feed'}.xml`)

    const feed = build(await getPosts(config), seo, { ...feedOptions, feedUrl: resolved })

    return new Response(feed.body, { headers: { 'Content-Type': feed.contentType } })
  }
}
