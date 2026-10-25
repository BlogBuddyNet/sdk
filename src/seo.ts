import { extractContentText, type PublicPost } from './post-data'

const MAX_DESCRIPTION_LENGTH = 160

interface ImageMeta {
  url: string
  width?: number
  height?: number
}

export interface SeoSiteConfig {
  siteUrl: string
  postUrlTemplate: string
  siteName?: string
  defaultImage?: string
  defaultImageWidth?: number
  defaultImageHeight?: number
  authorName?: string
  authorUrl?: string
  postImageUrlTemplate?: string
  pageUrlTemplate?: string
  locale?: string
}

function absolute(config: SeoSiteConfig, path: string): string {
  const origin = config.siteUrl.replace(/\/+$/, '')
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

function absoluteImage(config: SeoSiteConfig, url: string): string {
  return /^([a-z][a-z0-9+.-]*:)?\/{2}/i.test(url) ? url : absolute(config, url)
}

function defaultImage(config: SeoSiteConfig): ImageMeta | undefined {
  if (!config.defaultImage) return undefined
  return {
    url: absoluteImage(config, config.defaultImage),
    width: config.defaultImageWidth,
    height: config.defaultImageHeight,
  }
}

function indexPath(config: SeoSiteConfig): string {
  if (config.pageUrlTemplate) {
    const stripped = config.pageUrlTemplate
      .replace(/[?&][^?&=]*=\{page\}.*$/, '')
      .replace(/\/?(page\/)?\{page\}.*$/, '')
    return stripped || '/'
  }
  return config.postUrlTemplate.replace(/\/?\{slug\}.*$/, '') || '/'
}

export function postUrl(post: Pick<PublicPost, 'slug'>, config: SeoSiteConfig): string {
  const origin = config.siteUrl.replace(/\/+$/, '')
  const path = config.postUrlTemplate.replace(/\{slug\}/g, encodeURIComponent(post.slug))
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function postDescription(post: PublicPost): string {
  const source =
    post.seoDescription?.trim() || post.excerpt?.trim() || extractContentText(post.content).trim()
  const collapsed = source.replace(/\s+/g, ' ')
  if (collapsed.length <= MAX_DESCRIPTION_LENGTH) return collapsed

  const clipped = collapsed.slice(0, MAX_DESCRIPTION_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

function postImage(post: PublicPost, config: SeoSiteConfig): ImageMeta | undefined {
  const content = post.content as
    | { coverImage?: string; coverImageWidth?: number; coverImageHeight?: number }
    | null
  const cover = content?.coverImage

  if (cover) {
    return {
      url: absoluteImage(config, cover),
      width: content?.coverImageWidth,
      height: content?.coverImageHeight,
    }
  }
  if (config.postImageUrlTemplate) {
    return { url: absolute(config, config.postImageUrlTemplate.replace(/\{slug\}/g, encodeURIComponent(post.slug))) }
  }
  return defaultImage(config)
}

function openGraphImage(image: ImageMeta, alt: string) {
  return {
    url: image.url,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
    alt,
  }
}

function openGraphLocale(locale: string | undefined): string | undefined {
  return locale ? locale.replace('-', '_') : undefined
}

function postAuthor(post: PublicPost, config: SeoSiteConfig): string | undefined {
  return post.author?.trim() || config.authorName
}

export function buildPostMetadata(post: PublicPost, config: SeoSiteConfig) {
  const url = postUrl(post, config)
  const description = postDescription(post)
  const image = postImage(post, config)
  const author = postAuthor(post, config)
  const title = post.seoTitle?.trim() || post.title

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(post.seoNoindex
      ?
        { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    openGraph: {
      type: 'article' as const,
      title,
      description,
      url,
      siteName: config.siteName,
      locale: openGraphLocale(config.locale),
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? post.published_at ?? undefined,
      ...(author ? { authors: [author] } : {}),
      ...(image ? { images: [openGraphImage(image, title)] } : {}),
    },
    twitter: {
      card: image ? ('summary_large_image' as const) : ('summary' as const),
      title,
      description,
      ...(author ? { creator: author } : {}),
      ...(image ? { images: [image.url] } : {}),
    },
  }
}

export function buildBlogMetadata(
  config: SeoSiteConfig & { title?: string; description?: string; page?: number }
) {
  const url = blogIndexUrl(config, config.page)
  const page = config.page && config.page > 1 ? config.page : undefined
  const baseTitle = config.title ?? `Blog${config.siteName ? ` | ${config.siteName}` : ''}`
  const title = page ? `${baseTitle} - page ${page}` : baseTitle
  const description = config.description ?? `Latest posts${config.siteName ? ` from ${config.siteName}` : ''}.`

  const image = defaultImage(config)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website' as const,
      title,
      description,
      url,
      siteName: config.siteName,
      locale: openGraphLocale(config.locale),
      ...(image ? { images: [openGraphImage(image, title)] } : {}),
    },
    twitter: {
      card: image ? ('summary_large_image' as const) : ('summary' as const),
      title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  }
}

export function blogIndexUrl(config: SeoSiteConfig, page?: number): string {
  const base = indexPath(config)
  if (!page || page <= 1 || !config.pageUrlTemplate) return absolute(config, base)
  return absolute(config, config.pageUrlTemplate.replace(/\{page\}/g, String(page)))
}

export function buildArticleJsonLd(post: PublicPost, config: SeoSiteConfig): Record<string, unknown> {
  const url = postUrl(post, config)
  const image = postImage(post, config)
  const author = postAuthor(post, config)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: postDescription(post),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(image ? { image: [image.url] } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at || post.published_at
      ? { dateModified: post.updated_at ?? post.published_at }
      : {}),
    ...(author
      ? {
          author: {
            '@type': 'Person',
            name: author,
            ...(config.authorUrl && !post.author?.trim() ? { url: config.authorUrl } : {}),
          },
        }
      : {}),
    ...(config.siteName
      ? { publisher: { '@type': 'Organization', name: config.siteName } }
      : {}),
    ...(config.locale ? { inLanguage: config.locale } : {}),
  }
}

export function buildBreadcrumbJsonLd(
  post: Pick<PublicPost, 'title' | 'slug'>,
  config: SeoSiteConfig,
  options: { home?: string; blogLabel?: string } = {}
): Record<string, unknown> {
  const crumbs: Array<{ name: string; url: string }> = []

  if (options.home) crumbs.push({ name: options.home, url: absolute(config, '/') })
  crumbs.push({ name: options.blogLabel ?? 'Blog', url: blogIndexUrl(config) })
  crumbs.push({ name: post.title, url: postUrl(post, config) })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

export function buildBlogJsonLd(
  posts: Array<Pick<PublicPost, 'title' | 'slug' | 'published_at'>>,
  config: SeoSiteConfig & { title?: string; description?: string; page?: number }
): Record<string, unknown> {
  const url = blogIndexUrl(config, config.page)

  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': url,
    url,
    name: config.title ?? `Blog${config.siteName ? ` | ${config.siteName}` : ''}`,
    ...(config.description ? { description: config.description } : {}),
    ...(config.locale ? { inLanguage: config.locale } : {}),
    ...(config.siteName
      ? { publisher: { '@type': 'Organization', name: config.siteName } }
      : {}),
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: postUrl(post, config),
      mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl(post, config) },
      ...(post.published_at ? { datePublished: post.published_at } : {}),
    })),
  }
}

export interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

export function buildSitemapEntries(
  posts: Pick<PublicPost, 'slug' | 'published_at' | 'updated_at' | 'seoNoindex'>[],
  config: SeoSiteConfig
): SitemapEntry[] {
  return posts
    .filter((post) => !post.seoNoindex)
    .map((post) => ({
      url: postUrl(post, config),
      lastModified: post.updated_at ?? post.published_at ?? new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
}
