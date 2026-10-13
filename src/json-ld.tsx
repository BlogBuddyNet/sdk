import type { PublicPost } from './post-data'
import { buildArticleJsonLd, type SeoSiteConfig } from './seo'

/**
 * Structured data for a post, as a script tag.
 *
 * `dangerouslySetInnerHTML` is the only way to emit JSON-LD, since React escapes text
 * children and would corrupt the JSON. Safe here because the content is
 * `JSON.stringify` output with `<` escaped.
 */
export function ArticleJsonLd({ post, config }: { post: PublicPost; config: SeoSiteConfig }) {
  const json = JSON.stringify(buildArticleJsonLd(post, config)).replace(/</g, '\\u003c')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

/** The same, for any schema.org object you have built yourself. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
