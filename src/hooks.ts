'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_BASE_URL } from './api-origin'
import { recordView } from './view-beacon'
import type { PublicPost } from './post-data'
import type { CustomFontRef, TemplateDocument } from './template-schema'

export interface BlogBuddyClientOptions {
  blog: string
  apiKey: string
  baseUrl?: string
}

export interface ListMeta {
  count: number
  page?: number
  perPage?: number
  total?: number
  totalPages?: number
}

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  meta?: ListMeta
}

const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 400

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const inFlightRequests = new Map<string, Promise<unknown>>()

async function fetchJsonOnce(url: string, apiKey: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = (body && typeof body.error === 'string' && body.error) || `Request failed with ${res.status}`
    throw Object.assign(new Error(message), { retryable: res.status >= 500 })
  }
  return res.json()
}

async function fetchJsonWithRetry(url: string, apiKey: string) {
  const dedupeKey = `${apiKey}\n${url}`
  const cached = inFlightRequests.get(dedupeKey)
  if (cached) return cached

  const promise = (async () => {
    let lastError: unknown
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fetchJsonOnce(url, apiKey)
      } catch (err) {
        lastError = err
        const retryable = err instanceof Error && (err as Error & { retryable?: boolean }).retryable !== false
        if (!retryable || attempt === MAX_RETRIES) break
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
      }
    }
    throw lastError
  })()

  inFlightRequests.set(dedupeKey, promise)
  try {
    return await promise
  } finally {
    inFlightRequests.delete(dedupeKey)
  }
}

function useJsonFetch<T>(url: string | null, apiKey: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: Boolean(url), error: null })

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: null })
      return
    }

    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    fetchJsonWithRetry(url, apiKey)
      .then((json) => {
        if (!cancelled) setState({ data: json.data, loading: false, error: null, meta: json.meta })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Unknown error' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [url, apiKey])

  return state
}

export function useBlogBuddy({
  blog,
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  page,
  perPage,
}: BlogBuddyClientOptions & { page?: number; perPage?: number }): FetchState<PublicPost[]> {
  const url = blog
    ? `${baseUrl}/api/v1/posts?blog=${encodeURIComponent(blog)}${perPage ? `&page=${page ?? 1}&per_page=${perPage}` : ''}`
    : null
  return useJsonFetch<PublicPost[]>(url, apiKey)
}

export function useBlogBuddyPost({
  blog,
  slug,
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  countViews = true,
  referrer = true,
}: BlogBuddyClientOptions & { slug: string; countViews?: boolean; referrer?: boolean }): FetchState<PublicPost> {
  const url = blog && slug ? `${baseUrl}/api/v1/posts/${encodeURIComponent(slug)}?blog=${encodeURIComponent(blog)}` : null
  const state = useJsonFetch<PublicPost>(url, apiKey)

  const arrived = Boolean(state.data) && !state.loading && !state.error
  useEffect(() => {
    if (!countViews || !arrived) return
    void recordView({ blog, slug, apiKey, baseUrl, referrer })
  }, [countViews, arrived, blog, slug, apiKey, baseUrl, referrer])

  return state
}

export function useBlogBuddyTemplate({
  blog,
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
}: BlogBuddyClientOptions): FetchState<{ list: TemplateDocument; post: TemplateDocument; fonts: CustomFontRef[] }> {
  const url = blog ? `${baseUrl}/api/v1/templates?blog=${encodeURIComponent(blog)}` : null
  return useJsonFetch<{ list: TemplateDocument; post: TemplateDocument; fonts: CustomFontRef[] }>(url, apiKey)
}
