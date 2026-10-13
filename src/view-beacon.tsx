'use client'

import { useEffect } from 'react'
import { DEFAULT_BASE_URL } from './api-origin'

/** Views already sent from this document, so React's double-invoke in development, and
 * any re-render, do not send the same one twice. The server deduplicates properly, by
 * viewer and time window; this just avoids the obvious noise. */
const sent = new Set<string>()

export interface ViewBeaconOptions {
  /** The blog's slug, e.g. "engineering-updates". */
  blog: string
  /** The post's slug. */
  slug: string
  /** A blog-scoped API key, as used by the hooks. */
  apiKey: string
  /** Override to point at a preview deployment or a self-hosted install. */
  baseUrl?: string
}

/** Records one view. Safe to call repeatedly: the first call wins for this document and
 * the server dedupes across visits. Never throws. */
export async function recordView({ blog, slug, apiKey, baseUrl = DEFAULT_BASE_URL }: ViewBeaconOptions): Promise<void> {
  if (!blog || !slug || !apiKey) return

  const key = `${baseUrl}|${blog}|${slug}`
  if (sent.has(key)) return
  sent.add(key)

  const url = `${baseUrl}/api/v1/posts/${encodeURIComponent(slug)}/view?blog=${encodeURIComponent(blog)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      keepalive: true,
    })

    if (res.status >= 500) sent.delete(key)
  } catch {
    sent.delete(key)
  }
}

/**
 * The same thing as a component, for the server-rendered path.
 *
 * <BlogBuddyPost> renders this itself, so most consumers never reach for it directly. It
 * renders nothing.
 */
export function BlogBuddyViewBeacon(props: ViewBeaconOptions) {
  const { blog, slug, apiKey, baseUrl = DEFAULT_BASE_URL } = props

  useEffect(() => {
    void recordView({ blog, slug, apiKey, baseUrl })
  }, [blog, slug, apiKey, baseUrl])

  return null
}
