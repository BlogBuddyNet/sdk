import { extractContentText, type PublicPost } from './post-data'
import { postDescription, postUrl, type SeoSiteConfig } from './seo'

export const DEFAULT_FEED_LIMIT = 20

export interface FeedOptions {
  title?: string
  description?: string
  feedUrl: string
  limit?: number
  fullContent?: boolean
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function toDate(value: string | null | undefined): Date {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function feedTitle(config: SeoSiteConfig, options: FeedOptions): string {
  return options.title ?? (config.siteName ? `${config.siteName} Blog` : 'Blog')
}

function feedDescription(config: SeoSiteConfig, options: FeedOptions): string {
  return (
    options.description ??
    `Latest posts${config.siteName ? ` from ${config.siteName}` : ''}.`
  )
}

function entryContent(post: PublicPost): string {
  return post.contentHtml || `<p>${escapeXml(extractContentText(post.content))}</p>`
}

export interface Feed {
  body: string
  contentType: string
}

export function buildRssFeed(
  posts: PublicPost[],
  config: SeoSiteConfig,
  options: FeedOptions
): Feed {
  const limit = options.limit ?? DEFAULT_FEED_LIMIT
  const items = posts.slice(0, limit)
  const title = feedTitle(config, options)
  const siteUrl = config.siteUrl.replace(/\/+$/, '')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(feedDescription(config, options))}</description>
    <atom:link href="${escapeXml(options.feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${toDate(items[0]?.published_at).toUTCString()}</lastBuildDate>${
      config.locale ? `\n    <language>${escapeXml(config.locale)}</language>` : ''
    }
${items
  .map((post) => {
    const url = postUrl(post, config)
    const author = post.author?.trim() || config.authorName
    return `    <item>
      <title>${escapeXml(post.seoTitle?.trim() || post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="false">${escapeXml(url)}</guid>
      <pubDate>${toDate(post.published_at).toUTCString()}</pubDate>
      <description>${escapeXml(postDescription(post))}</description>${
        author ? `\n      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${escapeXml(author)}</dc:creator>` : ''
      }${options.fullContent ? `\n      <content:encoded>${cdata(entryContent(post))}</content:encoded>` : ''}
    </item>`
  })
  .join('\n')}
  </channel>
</rss>`

  return { body, contentType: 'application/rss+xml; charset=utf-8' }
}

export function buildAtomFeed(
  posts: PublicPost[],
  config: SeoSiteConfig,
  options: FeedOptions
): Feed {
  const limit = options.limit ?? DEFAULT_FEED_LIMIT
  const items = posts.slice(0, limit)
  const title = feedTitle(config, options)
  const siteUrl = config.siteUrl.replace(/\/+$/, '')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"${config.locale ? ` xml:lang="${escapeXml(config.locale)}"` : ''}>
  <title>${escapeXml(title)}</title>
  <subtitle>${escapeXml(feedDescription(config, options))}</subtitle>
  <link href="${escapeXml(options.feedUrl)}" rel="self" type="application/atom+xml" />
  <link href="${escapeXml(siteUrl)}" />
  <id>${escapeXml(siteUrl)}/</id>
  <updated>${toDate(items[0]?.updated_at ?? items[0]?.published_at).toISOString()}</updated>${
    `\n  <author><name>${escapeXml(config.authorName || title)}</name>${
      config.authorName && config.authorUrl ? `<uri>${escapeXml(config.authorUrl)}</uri>` : ''
    }</author>`
  }
${items
  .map((post) => {
    const url = postUrl(post, config)
    const author = post.author?.trim() || config.authorName || title
    return `  <entry>
    <title>${escapeXml(post.seoTitle?.trim() || post.title)}</title>
    <link href="${escapeXml(url)}" />
    <id>${escapeXml(url)}</id>
    <published>${toDate(post.published_at).toISOString()}</published>
    <updated>${toDate(post.updated_at ?? post.published_at).toISOString()}</updated>
    <summary>${escapeXml(postDescription(post))}</summary>${
      author ? `\n    <author><name>${escapeXml(author)}</name></author>` : ''
    }${options.fullContent ? `\n    <content type="html">${cdata(entryContent(post))}</content>` : ''}
  </entry>`
  })
  .join('\n')}
</feed>`

  return { body, contentType: 'application/atom+xml; charset=utf-8' }
}

export function feedLinkTags(feeds: { rss?: string; atom?: string }): Record<string, string> {
  return {
    ...(feeds.rss ? { 'application/rss+xml': feeds.rss } : {}),
    ...(feeds.atom ? { 'application/atom+xml': feeds.atom } : {}),
  }
}
