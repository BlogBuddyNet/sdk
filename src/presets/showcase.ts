import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const INK = '#111827'
const BODY = '#1f2937'
const MUTED = '#374151'
const PAPER = '#ffffff'
const RULE = '#e5e7eb'

export const showcaseList: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'list',
  root: {
    type: 'container',
    id: 'show-root',
    style: {
      direction: 'column',
      background: PAPER,
      color: INK,
      fontFamily: 'sans-serif',
      paddingTop: 64,
      paddingBottom: 80,
      paddingLeft: 28,
      paddingRight: 28,
      customCss: '@container (max-width: 560px) { padding-top: 36px; padding-right: 18px; padding-bottom: 48px; padding-left: 18px }',
    },
    children: [
      {
        type: 'postListLoop',
        id: 'show-loop',
        style: { columns: 2, gap: 48, customCss: '@container (max-width: 560px) { gap: 28px }' },
        itemTemplate: {
          type: 'container',
          id: 'show-card',
          style: {
            direction: 'column',
            background: '#f3f4f6',
            clip: true,
            minHeight: 420,
            customCss: '@container (max-width: 560px) { min-height: 360px }',
          },
          children: [
            {
              type: 'image',
              id: 'show-card-cover',
              style: { objectFit: 'cover', layer: 'fill' },
              source: { source: 'binding', binding: 'post.coverImage' },
              alt: '',
            },
            {
              type: 'container',
              id: 'show-card-top',
              style: {
                direction: 'row',
                justify: 'end',
                align: 'start',
                paddingTop: 20,
                paddingLeft: 20,
                paddingRight: 20,
                layer: 'front',
                flexMode: 'grow',
              },
              children: [
                {
                  type: 'button',
                  id: 'show-card-cta',
                  style: {
                    background: PAPER,
                    backgroundOpacity: 60,
                    color: BODY,
                    fontSize: 13,
                    fontWeight: 500,
                    paddingTop: 9,
                    paddingBottom: 9,
                    paddingLeft: 18,
                    paddingRight: 18,
                    noWrap: true,
                  },
                  label: { source: 'literal', value: 'Read More' },
                  href: { source: 'binding', binding: 'post.url' },
                },
              ],
            },
            {
              type: 'container',
              id: 'show-card-panel',
              style: {
                direction: 'column',
                background: PAPER,
                backgroundOpacity: 20,
                paddingTop: 22,
                paddingBottom: 22,
                paddingLeft: 24,
                paddingRight: 24,
                layer: 'front',
              },
              children: [
                {
                  type: 'heading',
                  id: 'show-card-title',
                  style: {
                    fontSize: 22,
                    fontWeight: 700,
                    lineClamp: 2,
                    letterSpacing: -0.016,
                    lineHeight: 1.28,
                    customCss: '@container (max-width: 560px) { font-size: 19px }',
                  },
                  level: 2,
                  content: { source: 'binding', binding: 'post.title' },
                  clickAction: { href: { source: 'binding', binding: 'post.url' } },
                },
                {
                  type: 'text',
                  id: 'show-card-excerpt',
                  style: {
                    fontSize: 14,
                    color: BODY,
                    marginTop: 8,
                    lineClamp: 2,
                    lineHeight: 1.5,
                  },
                  content: { source: 'binding', binding: 'post.excerpt' },
                },
                {
                  type: 'text',
                  id: 'show-card-date',
                  style: { fontSize: 12, color: MUTED, marginTop: 14 },
                  content: { source: 'binding', binding: 'post.publishedAt' },
                },
              ],
            },
          ],
        },
      },
      {
        type: 'pagination',
        id: 'show-pager',
        style: {
          marginTop: 52,
          gap: 8,
          justify: 'center',
          fontSize: 14,
          color: INK,
          borderWidth: 1,
          borderColor: RULE,
          padding: 10,
        },
        activeStyle: { background: INK, color: PAPER, borderColor: INK },
        postsPerPage: 8,
        mode: 'numbered',
      },
    
    ],
  },
}

export const showcasePost: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'post',
  root: {
    type: 'container',
    id: 'show-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'show-hero',
        style: {
          direction: 'column',
          background: '#f3f4f6',
          clip: true,
          minHeight: 460,
          customCss: '@container (max-width: 560px) { min-height: 320px }',
        },
        children: [
          {
            type: 'image',
            id: 'show-cover',
            style: { objectFit: 'cover', layer: 'fill' },
            source: { source: 'binding', binding: 'post.coverImage' },
            alt: '',
          },
          {
            type: 'container',
            id: 'show-hero-panel',
            style: {
              direction: 'column',
              background: PAPER,
              backgroundOpacity: 22,
              paddingTop: 32,
              paddingBottom: 32,
              paddingLeft: 28,
              paddingRight: 28,
              layer: 'front',
              pushToEnd: true,
              customCss: '@container (max-width: 560px) { padding-top: 22px; padding-right: 18px; padding-bottom: 22px; padding-left: 18px }',
            },
            children: [
              {
                type: 'container',
                id: 'show-hero-column',
                style: { direction: 'column', maxWidth: 760, centerHorizontally: true, width: 100, widthUnit: 'percent' },
                children: [
                  {
                    type: 'heading',
                    id: 'show-title',
                    style: {
                      fontSize: 42,
                      fontWeight: 700,
                      letterSpacing: -0.028,
                      lineHeight: 1.14,
                      customCss: '@container (max-width: 560px) { font-size: 28px }',
                    },
                    level: 1,
                    content: { source: 'binding', binding: 'post.title' },
                  },
                  {
                    type: 'text',
                    id: 'show-date',
                    style: { fontSize: 13, color: MUTED, marginTop: 14 },
                    content: { source: 'binding', binding: 'post.publishedAt' },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'container',
        id: 'show-shell',
        style: {
          direction: 'column',
          paddingTop: 48,
          paddingBottom: 80,
          paddingLeft: 28,
          paddingRight: 28,
          maxWidth: 760,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          customCss: '@container (max-width: 560px) { padding-top: 28px; padding-right: 18px; padding-bottom: 48px; padding-left: 18px }',
        },
        children: [
          {
            type: 'text',
            id: 'show-standfirst',
            style: {
              fontSize: 19,
              color: BODY,
              lineHeight: 1.6,
              customCss: '@container (max-width: 560px) { font-size: 17px }',
            },
            content: { source: 'binding', binding: 'post.excerpt' },
          },
          { type: 'divider', id: 'show-rule', style: { marginTop: 28, borderColor: RULE } },
          {
            type: 'richContent',
            id: 'show-body',
            style: { fontSize: 17, marginTop: 28, lineHeight: 1.75 },
          },
          {
            type: 'carousel',
            id: 'show-gallery',
            style: { marginTop: 36 },
            imageSize: 'medium',
            navigation: 'arrows',
          },
          { type: 'divider', id: 'show-rule-end', style: { marginTop: 56, borderColor: RULE } },
          {
            type: 'heading',
            id: 'show-more-label',
            style: { fontSize: 15, fontWeight: 600, color: MUTED, marginTop: 32 },
            level: 2,
            content: { source: 'literal', value: 'More posts' },
          },
          {
            type: 'relatedPosts',
            id: 'show-related',
            style: { marginTop: 18 },
            source: 'blog',
            order: 'newest',
          },
        ],
      },
    ],
  },
}
