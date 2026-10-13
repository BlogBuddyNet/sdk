'use client'

import * as React from 'react'
import type { PaginationNode } from './template-schema'
import { paginationHref, type PaginationRenderState } from './post-data'
import type { CssProps } from './style-utils'

const PAGINATION_ACCENT = '#6f57f4'

function pageButtonInlineStyle(active: boolean, custom: React.CSSProperties): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    padding: '0 6px',
    borderRadius: 999,
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: 'currentcolor',
    fontSize: 14,
    fontWeight: 600,
    cursor: active ? 'default' : 'pointer',
    background: 'transparent',
    color: active ? '#ffffff' : PAGINATION_ACCENT,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    ...custom,
  }
}

export function PaginationNav({
  node,
  pagination,
  style,
  activeStyle,
}: {
  node: PaginationNode
  pagination?: PaginationRenderState
  style: CssProps
  /** Only meaningful in 'numbered' mode - overrides `style` for the active page's own
   * button, so it can look completely different from the rest. */
  activeStyle?: CssProps
}) {
  const p = pagination
  if (!p || p.totalPages <= 1) return null

  const custom = style as React.CSSProperties
  const activeCustom = (activeStyle ?? style) as React.CSSProperties

  if (node.mode === 'loadMore') {
    if (p.page >= p.totalPages) return null
    const loadMoreStyle: React.CSSProperties = {
      display: 'block',
      margin: '20px auto 0',
      padding: '11px 26px',
      borderRadius: 999,
      border: 'none',
      fontSize: 14,
      fontWeight: 600,
      background: PAGINATION_ACCENT,
      color: '#ffffff',
      cursor: 'pointer',
      opacity: p.loading ? 0.6 : 1,
      transition: 'opacity 0.15s ease',
      ...custom,
    }
    if (p.hrefTemplate) {
      return (
        <a
          data-node-id={node.id}
          href={paginationHref(p.hrefTemplate, p.page + 1)}
          style={{ textAlign: 'center', textDecoration: 'none', width: 'fit-content', ...loadMoreStyle }}
        >
          Load more
        </a>
      )
    }
    return (
      <button
        data-node-id={node.id}
        type="button"
        onClick={() => p.onLoadMore?.()}
        disabled={p.loading}
        style={loadMoreStyle}
      >
        {p.loading ? 'Loading…' : 'Load more'}
      </button>
    )
  }

  return (
    <nav
      data-node-id={node.id}
      style={{ display: 'flex', gap: 6, justifyContent: 'center', opacity: p.loading ? 0.6 : 1, transition: 'opacity 0.15s ease' }}
    >
      {Array.from({ length: p.totalPages }, (_, i) => i + 1).map((n) => {
        const active = n === p.page
        const style = pageButtonInlineStyle(active, active ? activeCustom : custom)
        if (p.hrefTemplate) {
          return active ? (
            <span key={n} data-node-id={node.id} aria-current="page" style={style}>
              {n}
            </span>
          ) : (
            <a
              key={n}
              data-node-id={node.id}
              href={paginationHref(p.hrefTemplate, n)}
              style={{ textDecoration: 'none', ...style }}
            >
              {n}
            </a>
          )
        }
        return (
          <button
            key={n}
            data-node-id={node.id}
            type="button"
            disabled={active || p.loading}
            onClick={() => p.onPageChange?.(n)}
            style={style}
          >
            {n}
          </button>
        )
      })}
    </nav>
  )
}
