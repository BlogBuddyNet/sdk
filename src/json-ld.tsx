import type { PublicPost } from './post-data'
import { buildArticleJsonLd, type SeoSiteConfig } from './seo'

export function ArticleJsonLd({ post, config }: { post: PublicPost; config: SeoSiteConfig }) {
  const json = JSON.stringify(buildArticleJsonLd(post, config)).replace(/</g, '\\u003c')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
