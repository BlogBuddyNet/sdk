import * as React from 'react'
import type { BlockNode, CustomFontRef, ImageSource, Link, TemplateDocument, TextContent } from './template-schema'
import { extractGalleryImages, resolveBinding, type PaginationRenderState, type PublicPost } from './post-data'
import { PaginationNav } from './pagination-nav'
import { CarouselStrip } from './carousel-strip'
import { baseCssProps, BORDER_BOX, buildFontFaceCss, buildStateCss, buildResponsiveCss, buttonCssProps, CAROUSEL_DEFAULT_GAP, CAROUSEL_IMAGE_WIDTHS, carouselCssProps, containerCssProps, imageCssProps, RESPONSIVE_CONTAINER_NAME, RICH_CONTENT_CSS } from './style-utils'

interface RenderContext {
  posts: PublicPost[]
  currentPost?: PublicPost
  postUrlTemplate?: string
  apiKey?: string
  baseUrl?: string
  blogSlug?: string
  pagination?: PaginationRenderState
  editing?: boolean
  interactive?: boolean
  inLoop?: boolean
}

function resolveText(content: TextContent, ctx: RenderContext): string {
  if (content.source === 'literal') return content.value
  if (!ctx.currentPost) return ''
  return resolveBinding(
    content.binding,
    { post: ctx.currentPost, postUrlTemplate: ctx.postUrlTemplate },
    { dateFormat: content.dateFormat }
  )
}

function headingLevelFor(node: Extract<BlockNode, { type: 'text' }>, ctx: RenderContext): 1 | 2 | 3 | 4 | undefined {
  if (node.level) return node.level
  if (node.content.source === 'binding' && node.content.binding === 'post.title') {
    return ctx.inLoop ? 2 : 1
  }
  return undefined
}

function truncateText(value: string, maxChars: number | undefined): string {
  if (maxChars === undefined || value.length <= maxChars) return value
  const cut = value.slice(0, maxChars)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}\u2026`
}

function resolveUrl(ref: Link | ImageSource, ctx: RenderContext): string {
  if (ref.source === 'literal') return ref.value
  if (!ctx.currentPost) return ''
  return resolveBinding(ref.binding, { post: ctx.currentPost, postUrlTemplate: ctx.postUrlTemplate })
}

function clickOverlay(node: BlockNode, ctx: RenderContext): React.ReactNode {
  const action = 'clickAction' in node ? node.clickAction : undefined
  if (!action) return null

  const href = resolveUrl(action.href, ctx)
  if (!href || href === '#') return null

  const label = action.label || (ctx.currentPost?.title ?? 'Read more')

  return (
    <a
      key={`${node.id}-click`}
      href={href}
      aria-label={label}
      {...(ctx.editing ? { 'data-href-source': action.href.source } : {})}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        ...(ctx.editing && !ctx.interactive ? { pointerEvents: 'none' as const } : {}),
      }}
    />
  )
}

function withClickOverlay(
  node: BlockNode,
  ctx: RenderContext,
  element: React.ReactNode
): React.ReactNode {
  const action = 'clickAction' in node ? node.clickAction : undefined
  if (!action) return element

  const overlay = clickOverlay(node, ctx)
  if (!overlay) return element

  return (
    <div key={node.id} data-click-wrap={node.id} style={{ position: 'relative' }}>
      {element}
      {overlay}
    </div>
  )
}

function renderNode(node: BlockNode, ctx: RenderContext): React.ReactNode {
  if (node.hidden) return null
  if (node.type !== 'container' && 'clickAction' in node && node.clickAction) {
    return withClickOverlay(node, ctx, renderNodeInner(node, ctx))
  }
  return renderNodeInner(node, ctx)
}

function renderNodeInner(node: BlockNode, ctx: RenderContext): React.ReactNode {
  switch (node.type) {
    case 'container': {
      const overlay = clickOverlay(node, ctx)
      const holdsLayer = node.children.some((child) => 'style' in child && child.style?.layer === 'fill')
      return (
        <div
          key={node.id}
          data-node-id={node.id}
          style={{
            ...containerCssProps(node.style),
            ...(overlay || holdsLayer ? { position: 'relative' as const } : {}),
          }}
        >
          {node.children.map((child) => renderNode(child, ctx))}
          {overlay}
        </div>
      )
    }

    case 'heading': {
      const Tag = `h${node.level}` as 'h1' | 'h2' | 'h3' | 'h4'
      return (
        <Tag
          key={node.id}
          data-node-id={node.id}
          style={{
            margin: 0,
            ...baseCssProps(node.style),
          }}
        >
          {resolveText(node.content, ctx)}
        </Tag>
      )
    }

    case 'text': {
      if (node.content.source === 'binding' && node.content.binding === 'post.content') {
        if (!ctx.currentPost?.contentHtml) return null
        return (
          <React.Fragment key={node.id}>
            <style dangerouslySetInnerHTML={{ __html: RICH_CONTENT_CSS }} />
            <div
              data-node-id={node.id}
              className="pw-rich-content"
              style={baseCssProps(node.style)}
              dangerouslySetInnerHTML={{ __html: ctx.currentPost.contentHtml }}
            />
          </React.Fragment>
        )
      }
      const level = headingLevelFor(node, ctx)
      const Tag = level ? (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4') : 'p'
      return (
        <Tag
          key={node.id}
          data-node-id={node.id}
          style={{
            ...(node.level ? { margin: 0 } : {}),
            whiteSpace: 'pre-wrap',
            ...baseCssProps(node.style),
          }}
        >
          {truncateText(resolveText(node.content, ctx), node.maxChars)}
        </Tag>
      )
    }

    case 'image': {
      const src = resolveUrl(node.source, ctx)
      if (!src) return null
      return (
        <img
          key={node.id}
          data-node-id={node.id}
          src={src}
          alt={node.alt}
          style={imageCssProps(node.style)}
        />
      )
    }

    case 'button': {
      const href = resolveUrl(node.href, ctx)
      return (
        <a
          key={node.id}
          data-node-id={node.id}
          href={href || undefined}
          {...(ctx.editing ? { 'data-href-source': node.href.source } : {})}
          style={buttonCssProps(node.style)}
        >
          {resolveText(node.label, ctx)}
        </a>
      )
    }

    case 'spacer':
      return <div key={node.id} data-node-id={node.id} style={{ height: node.size }} />

    case 'richContent':
      if (!ctx.currentPost?.contentHtml) return null
      return (
        <React.Fragment key={node.id}>
          <style dangerouslySetInnerHTML={{ __html: RICH_CONTENT_CSS }} />
          <div
            data-node-id={node.id}
            className="pw-rich-content"
            style={baseCssProps(node.style)}
            dangerouslySetInnerHTML={{ __html: ctx.currentPost.contentHtml }}
          />
        </React.Fragment>
      )

    case 'postListLoop':
      return (
        <div key={node.id} data-node-id={node.id} style={containerCssProps(node.style)}>
          {ctx.posts.map((post) => (
            <React.Fragment key={post.id}>
              {renderNode(node.itemTemplate, { ...ctx, currentPost: post, inLoop: true })}
            </React.Fragment>
          ))}
        </div>
      )

    case 'divider':
      return (
        <hr
          key={node.id}
          data-node-id={node.id}
          style={{
            width: '100%',
            marginInline: 0,
            border: 0,
            borderTop: '1px solid currentcolor',
            ...baseCssProps(node.style),
          }}
        />
      )

    case 'tableOfContents': {
      const headings = ctx.currentPost?.headings
      if (!headings || headings.length === 0) return null
      return (
        <nav key={node.id} data-node-id={node.id} style={baseCssProps(node.style)}>
          {headings.map((h) => (
            <a key={h.id} href={`#${h.id}`} style={{ display: 'block', paddingLeft: (h.level - 1) * 12 }}>
              {h.text}
            </a>
          ))}
        </nav>
      )
    }

    case 'relatedPosts': {
      const related = ctx.currentPost?.relatedPosts
      if (!related || related.length === 0) return null
      return (
        <div key={node.id} data-node-id={node.id} style={{ ...baseCssProps(node.style), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {related.map((post) => (
            <a key={post.id} href={resolveBinding('post.url', { post, postUrlTemplate: ctx.postUrlTemplate })} style={{ display: 'block' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{post.title}</div>
              {post.excerpt && <div style={{ fontSize: 13, opacity: 0.7 }}>{post.excerpt}</div>}
            </a>
          ))}
        </div>
      )
    }

    case 'carousel': {
      const images = extractGalleryImages(ctx.currentPost?.content)
      if (images.length === 0) return null
      const { box, photo } = carouselCssProps(node.style, node.photoStyle)
      const boxStyle = { ...BORDER_BOX, ...box }
      return (
        <CarouselStrip
          key={node.id}
          nodeId={node.id}
          images={images}
          imageWidth={CAROUSEL_IMAGE_WIDTHS[node.imageSize]}
          gap={node.style.gap ?? CAROUSEL_DEFAULT_GAP}
          style={boxStyle}
          photoStyle={photo}
          navigation={node.navigation ?? 'arrows'}
          altPrefix={ctx.currentPost?.title ? `${ctx.currentPost.title}, ` : ''}
          viewer={!ctx.editing || Boolean(ctx.interactive)}
        />
      )
    }

    case 'pagination': {
      return (
        <PaginationNav
          key={node.id}
          node={node}
          pagination={ctx.pagination}
          style={baseCssProps(node.style)}
          activeStyle={node.activeStyle ? baseCssProps({ ...node.style, ...node.activeStyle }) : undefined}
        />
      )
    }

    default: {
      const exhaustive: never = node
      void exhaustive
      return null
    }
  }
}

export interface TemplateRendererProps {
  document: TemplateDocument
  posts?: PublicPost[]
  post?: PublicPost
  postUrlTemplate?: string
  fonts?: CustomFontRef[]
  apiKey?: string
  baseUrl?: string
  blogSlug?: string
  pagination?: PaginationRenderState
  interactive?: boolean
  editing?: boolean
}

export function TemplateRenderer({ document, posts, post, postUrlTemplate, fonts, apiKey, baseUrl, blogSlug, pagination, editing, interactive }: TemplateRendererProps) {
  const ctx: RenderContext = { posts: posts ?? [], currentPost: post, postUrlTemplate, apiKey, baseUrl, blogSlug, pagination, editing, interactive }
  const fontFaceCss = fonts && fonts.length > 0 ? buildFontFaceCss(fonts) : ''
  const stateCss = editing && !interactive ? '' : buildStateCss(document.root)
  const responsiveCss = buildResponsiveCss(document.root)
  return (
    <>
      {fontFaceCss && <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />}
      {stateCss && <style dangerouslySetInnerHTML={{ __html: stateCss }} />}
      {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
      {}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          containerType: 'inline-size',
          containerName: RESPONSIVE_CONTAINER_NAME,
          opacity: pagination?.loading ? 0.6 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        {renderNode(document.root, ctx)}
      </div>
    </>
  )
}
