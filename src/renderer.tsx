'use client'

import * as React from 'react'
import { DEFAULT_BASE_URL } from './api-origin'
import { TemplateRenderer } from './renderer-react'
import { getPaginationNode } from './template-tree-utils'
import { useBlogBuddy, useBlogBuddyPost, useBlogBuddyTemplate, type BlogBuddyClientOptions } from './hooks'
import type { PublicPost } from './post-data'
import {
  postUrl,
  postDescription,
  blogIndexUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildBlogJsonLd,
  type SeoSiteConfig,
} from './seo'


interface SharedProps extends BlogBuddyClientOptions {
  postUrlTemplate?: string
  pageUrlTemplate?: string
  siteUrl?: string
  siteName?: string
  seo?: boolean
  fallback?: React.ReactNode
}

export interface BlogBuddyPostProps extends SharedProps {
  slug: string
}

export interface BlogBuddyListProps extends SharedProps {
  perPage?: number
  title?: string
  description?: string
}

function useSiteUrl(explicit?: string): string {
  const [origin, setOrigin] = React.useState(explicit ?? '')
  React.useEffect(() => {
    if (!explicit && typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [explicit])
  return explicit ?? origin
}

function HeadTags({
  title,
  description,
  canonical,
  image,
  noindex,
  siteName,
  type,
}: {
  title: string
  description?: string
  canonical?: string
  image?: string | null
  noindex?: boolean
  siteName?: string
  type: 'article' | 'website'
}) {
  return (
    <>
      <title>{siteName ? `${title} · ${siteName}` : title}</title>
      {description ? <meta name="description" content={description} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {noindex ? <meta name="robots" content="noindex" /> : null}

      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:type" content={type} />
      {siteName ? <meta property="og:site_name" content={siteName} /> : null}
      {image ? <meta property="og:image" content={image} /> : null}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      {image ? <meta name="twitter:image" content={image} /> : null}
    </>
  )
}

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

function coverImageOf(post: PublicPost): string | null {
  const content = post.content as { coverImage?: string } | null | undefined
  return content?.coverImage ?? null
}

function ErrorBox({ error }: { error: string }) {
  React.useEffect(() => {
    console.error(`[BlogBuddy] ${error}`)
  }, [error])

  return (
    <div
      role="alert"
      style={{ padding: 16, border: '1px solid #d97066', borderRadius: 8, color: '#a3372c', font: '14px/1.5 system-ui, sans-serif' }}
    >
      This blog could not be loaded. {error}
    </div>
  )
}

function Post({
  blog,
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  slug,
  postUrlTemplate = '/blog/{slug}',
  pageUrlTemplate,
  siteUrl,
  siteName,
  seo = true,
  fallback = null,
}: BlogBuddyPostProps) {
  const templates = useBlogBuddyTemplate({ blog, apiKey, baseUrl })
  const single = useBlogBuddyPost({ blog, slug, apiKey, baseUrl })
  const origin = useSiteUrl(siteUrl)

  const error = templates.error ?? single.error
  if (error) return <ErrorBox error={error} />

  const post = single.data
  if (!templates.data || !post) return <>{fallback}</>

  const config: SeoSiteConfig = { siteUrl: origin, postUrlTemplate, pageUrlTemplate, siteName }
  const canonical = origin ? postUrl(post, config) : undefined
  const description = post.seoDescription ?? postDescription(post)
  const image = coverImageOf(post)

  return (
    <>
      {seo ? (
        <>
          <HeadTags
            title={post.seoTitle ?? post.title}
            description={description}
            canonical={canonical}
            image={image}
            noindex={post.seoNoindex}
            siteName={siteName}
            type="article"
          />
          {origin ? (
            <>
              <JsonLdScript data={buildArticleJsonLd(post, config)} />
              <JsonLdScript data={buildBreadcrumbJsonLd(post, config)} />
            </>
          ) : null}
        </>
      ) : null}

      <TemplateRenderer
        document={templates.data.post}
        post={post}
        posts={[post]}
        fonts={templates.data.fonts ?? []}
        postUrlTemplate={postUrlTemplate}
      />
    </>
  )
}

function List({
  blog,
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  perPage,
  postUrlTemplate = '/blog/{slug}',
  pageUrlTemplate,
  siteUrl,
  siteName,
  title = 'Blog',
  description,
  seo = true,
  fallback = null,
}: BlogBuddyListProps) {
  const [page, setPage] = React.useState(1)
  const templates = useBlogBuddyTemplate({ blog, apiKey, baseUrl })
  const origin = useSiteUrl(siteUrl)

  const paginationMode = templates.data ? getPaginationNode(templates.data.list.root)?.mode : undefined
  const cumulative = paginationMode === 'loadMore'

  const list = useBlogBuddy({
    blog,
    apiKey,
    baseUrl,
    page: cumulative ? 1 : page,
    perPage: perPage ? (cumulative ? perPage * page : perPage) : undefined,
  })

  const error = templates.error ?? list.error
  if (error) return <ErrorBox error={error} />

  const posts = list.data ?? []
  if (!templates.data || posts.length === 0) return <>{fallback}</>

  const config: SeoSiteConfig = { siteUrl: origin, postUrlTemplate, pageUrlTemplate, siteName }
  const canonical = origin ? blogIndexUrl(config) : undefined

  return (
    <>
      {seo ? (
        <>
          <HeadTags
            title={title}
            description={description ?? `Latest posts${siteName ? ` from ${siteName}` : ''}.`}
            canonical={canonical}
            siteName={siteName}
            type="website"
          />
          {origin ? <JsonLdScript data={buildBlogJsonLd(posts, { ...config, title, description })} /> : null}
        </>
      ) : null}

      <TemplateRenderer
        document={templates.data.list}
        posts={posts}
        fonts={templates.data.fonts ?? []}
        postUrlTemplate={postUrlTemplate}
        pagination={
          perPage
            ? {
                page,
                totalPages: list.meta?.totalPages ?? 1,
                loading: list.loading,
                onPageChange: setPage,
                onLoadMore: () => setPage((p) => p + 1),
              }
            : undefined
        }
      />
    </>
  )
}

export const BlogBuddy = { Post, List }
