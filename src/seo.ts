import { extractContentText, type PublicPost } from './post-data'

const MAX_DESCRIPTION_LENGTH = 160

interface ImageMeta {
  url: string
  width?: number
  height?: number
}

export interface SeoSiteConfig {
  /** The site's origin, e.g. 'https://acme.com'. Set per blog in BlogBuddy's blog
   * settings and returned by /api/v1/blog. */
  siteUrl: string
  /** Path pattern for a post, with {slug} substituted, e.g. '/blog/{slug}'. */
  postUrlTemplate: string
  /** Used for og:site_name and as the fallback title suffix. */
  siteName?: string
  /** Falls back to the post's cover image when a post has none. */
  defaultImage?: string
  /** The default image's pixel dimensions, when known. Only meaningful alongside
   * `defaultImage`; see `imageMeta` below for why they are worth carrying. */
  defaultImageWidth?: number
  defaultImageHeight?: number
  /** Shown as the article's author when a post has none of its own. */
  authorName?: string
  /** A page identifying that author, emitted as JSON-LD `author.url`. Only used when the
   * byline came from `authorName`. */
  authorUrl?: string
  /** Path pattern for a per-post share image, e.g. '/blog/{slug}/opengraph-image'.
   * Preferred over `defaultImage` for posts with no cover of their own. You provide the
   * route; this only builds the URL. */
  postImageUrlTemplate?: string
  /** Path pattern for page N of the index, e.g. '/blog?page={page}'. Without it every
   * page canonicalises to page one, which reads as duplicate content. */
  pageUrlTemplate?: string
  /** BCP 47, e.g. 'en' or 'pt-BR'. Emitted as JSON-LD `inLanguage` and, underscored
   * to the form Open Graph wants ('pt_BR'), as og:locale. */
  locale?: string
}

/** Joins the configured origin to a path, tolerating a trailing slash on one and a
 * missing leading slash on the other. */
function absolute(config: SeoSiteConfig, path: string): string {
  const origin = config.siteUrl.replace(/\/+$/, '')
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

/** Leaves an absolute or protocol-relative URL alone, resolves anything else against
 * the site origin. A relative og:image is one a crawler cannot fetch. */
function absoluteImage(config: SeoSiteConfig, url: string): string {
  return /^([a-z][a-z0-9+.-]*:)?\/{2}/i.test(url) ? url : absolute(config, url)
}

/** The blog's own share image, when it has one. */
function defaultImage(config: SeoSiteConfig): ImageMeta | undefined {
  if (!config.defaultImage) return undefined
  return {
    url: absoluteImage(config, config.defaultImage),
    width: config.defaultImageWidth,
    height: config.defaultImageHeight,
  }
}

/** Where the blog index lives: the post pattern with its final /{slug} segment removed,
 * so '/blog/{slug}' becomes '/blog'. */
function indexPath(config: SeoSiteConfig): string {
  if (config.pageUrlTemplate) {
    const stripped = config.pageUrlTemplate
      .replace(/[?&][^?&=]*=\{page\}.*$/, '')
      .replace(/\/?(page\/)?\{page\}.*$/, '')
    return stripped || '/'
  }
  return config.postUrlTemplate.replace(/\/?\{slug\}.*$/, '') || '/'
}

/** The canonical, absolute URL for a post on the customer's site. */
export function postUrl(post: Pick<PublicPost, 'slug'>, config: SeoSiteConfig): string {
  const origin = config.siteUrl.replace(/\/+$/, '')
  const path = config.postUrlTemplate.replace(/\{slug\}/g, encodeURIComponent(post.slug))
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

/** A post's description: the SEO panel override, then the excerpt, then the opening of
 * the body. Always trimmed at a word boundary. */
export function postDescription(post: PublicPost): string {
  const source =
    post.seoDescription?.trim() || post.excerpt?.trim() || extractContentText(post.content).trim()
  const collapsed = source.replace(/\s+/g, ' ')
  if (collapsed.length <= MAX_DESCRIPTION_LENGTH) return collapsed

  const clipped = collapsed.slice(0, MAX_DESCRIPTION_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

/** The share image for a post: its own cover, then `postImageUrlTemplate`, then
 * `defaultImage`. Dimensions are included only when known, never guessed. */
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

/** og:image entries carry dimensions only when we actually have them. */
function openGraphImage(image: ImageMeta, alt: string) {
  return {
    url: image.url,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
    alt,
  }
}

/** Open Graph spells locales with an underscore ('pt_BR'), BCP 47 with a hyphen. */
function openGraphLocale(locale: string | undefined): string | undefined {
  return locale ? locale.replace('-', '_') : undefined
}

/** The byline: the post's own author, then the blog's default. */
function postAuthor(post: PublicPost, config: SeoSiteConfig): string | undefined {
  return post.author?.trim() || config.authorName
}

/** Metadata for a post page, ready to return from a Next.js `generateMetadata`. The
 * canonical URL is the field that matters most. */
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

/** Metadata for the blog index page. Separate from buildPostMetadata because a list
 * page is not an article: no publish date, no author, and its canonical is the index
 * itself rather than any post on it. */
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

/** The absolute URL of the blog index, or of page N. Page 1 is the bare index, never
 * '?page=1'. */
export function blogIndexUrl(config: SeoSiteConfig, page?: number): string {
  const base = indexPath(config)
  if (!page || page <= 1 || !config.pageUrlTemplate) return absolute(config, base)
  return absolute(config, config.pageUrlTemplate.replace(/\{page\}/g, String(page)))
}

/** schema.org Article JSON-LD for a post. Meta tags say how to display a link; this
 * says what the page is. */
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

/** schema.org BreadcrumbList for a post, which is what a search result shows in place
 * of the raw path. Pass `home` to include the site root as the first crumb. */
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

/** schema.org Blog JSON-LD for the index page. Lists only the posts passed in, which
 * is one page of them. */
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

/** Sitemap entries for published posts, shaped for Next.js's `MetadataRoute.Sitemap`.
 * Serve it from your own domain: a sitemap may only list URLs on the host serving it. */
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
