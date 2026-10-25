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

export type BlogBuddyConfig = BlogBuddyServerOptions & Partial<Omit<SeoSiteConfig, 'postUrlTemplate'>>

export interface BlogBuddyServerOptions {
  blog: string
  apiKey: string
  baseUrl?: string
  postUrlTemplate?: string
  revalidate?: number | false
}

const DEFAULT_REVALIDATE = 3600

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

export class BlogBuddyRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'BlogBuddyRequestError'
    this.status = status
  }
}

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

export async function getBlogConfig(options: BlogBuddyServerOptions): Promise<BlogConfig> {
  const { data } = await apiFetch<{ data: BlogConfig }>(
    `/api/v1/blog?blog=${encodeURIComponent(options.blog)}`,
    options
  )
  return data
}

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

export async function getPostsForSitemap(
  options: BlogBuddyServerOptions
): Promise<Pick<PublicPost, 'slug' | 'published_at' | 'updated_at' | 'seoNoindex'>[]> {
  const { data } = await apiFetch<{ data: PublicPost[] }>(
    `/api/v1/posts?blog=${encodeURIComponent(options.blog)}&fields=sitemap`,
    options
  )
  return data
}

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
  jsonLd?: boolean
  countViews?: boolean
  referrer?: boolean
  breadcrumbHome?: string
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
  jsonLd?: boolean
  title?: string
  description?: string
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

export function blogBuddyStaticParams(config: BlogBuddyConfig) {
  return async function generateStaticParams() {
    try {
      return (await getPostsForSitemap(config)).map((post) => ({ slug: post.slug }))
    } catch {
      return []
    }
  }
}

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
