'use client'

import { useEffect } from 'react'
import { DEFAULT_BASE_URL } from './api-origin'

const sent = new Set<string>()

export interface ViewBeaconOptions {
  blog: string
  slug: string
  apiKey: string
  baseUrl?: string
  referrer?: boolean
}

export async function recordView({
  blog,
  slug,
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  referrer = true,
}: ViewBeaconOptions): Promise<void> {
  if (!blog || !slug || !apiKey) return

  const key = `${baseUrl}|${blog}|${slug}`
  if (sent.has(key)) return
  sent.add(key)

  const url = `${baseUrl}/api/v1/posts/${encodeURIComponent(slug)}/view?blog=${encodeURIComponent(blog)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        referrer: referrer && typeof document !== 'undefined' ? document.referrer : '',
      }),
      keepalive: true,
    })

    if (res.status >= 500) sent.delete(key)
  } catch {
    sent.delete(key)
  }
}

export function BlogBuddyViewBeacon(props: ViewBeaconOptions) {
  const { blog, slug, apiKey, baseUrl = DEFAULT_BASE_URL, referrer = true } = props

  useEffect(() => {
    void recordView({ blog, slug, apiKey, baseUrl, referrer })
  }, [blog, slug, apiKey, baseUrl, referrer])

  return null
}
