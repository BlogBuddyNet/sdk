import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const INK = '#0f1420'
const BODY = '#5b6577'
const MUTED = '#7b8494'
const CANVAS = '#f4f6f9'
const CARD = '#ffffff'
const ACCENT = '#4f46e5'
const ACCENT_DARK = '#4338ca'

const SHELL = 'max-width: 1120px; margin-left: auto; margin-right: auto; width: 100%'

export const cardsList: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'list',
  root: {
    type: 'container',
    id: 'card-root',
    style: { direction: 'column', background: CANVAS, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'card-shell',
        style: {
          direction: 'column',
          paddingTop: 72,
          paddingBottom: 88,
          paddingLeft: 28,
          paddingRight: 28,
          customCss: SHELL,
          mobile: { paddingTop: 44, paddingBottom: 56 },
        },
        children: [
          {
            type: 'heading',
            id: 'card-masthead',
            style: {
              fontSize: 38,
              fontWeight: 700,
              customCss: 'letter-spacing: -0.028em; line-height: 1.15',
              mobile: { fontSize: 28 },
            },
            level: 1,
            content: { source: 'literal', value: 'From the blog' },
          },
          {
            type: 'text',
            id: 'card-masthead-sub',
            style: { fontSize: 16, color: BODY, marginTop: 12, customCss: 'line-height: 1.6; max-width: 52ch' },
            content: { source: 'literal', value: 'Product updates, engineering notes and the thinking behind them.' },
          },
          { type: 'spacer', id: 'card-masthead-gap', size: 40 },
          {
            type: 'postListLoop',
            id: 'card-loop',
            style: { columns: 3, gap: 24, mobile: { columns: 1, gap: 18 } },
            itemTemplate: {
              type: 'container',
              id: 'card-card',
              style: {
                direction: 'column',
                background: CARD,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: '#e6eaf0',
                boxShadow: 'sm',
                customCss: 'overflow: hidden; transition: transform 0.18s ease, box-shadow 0.18s ease',
                hover: { boxShadow: 'lg', customCss: 'transform: translateY(-3px)' },
              },
              children: [
                {
                  type: 'image',
                  id: 'card-card-cover',
                  style: { aspectRatio: '16/9', objectFit: 'cover' },
                  source: { source: 'binding', binding: 'post.coverImage' },
                  alt: '',
                },
                {
                  type: 'container',
                  id: 'card-card-body',
                  style: { direction: 'column', gap: 10, padding: 22, customCss: 'flex: 1 1 auto' },
                  children: [
                    {
                      type: 'text',
                      id: 'card-card-date',
                      style: {
                        fontSize: 12,
                        color: MUTED,
                        fontWeight: 600,
                        customCss: 'letter-spacing: 0.08em; text-transform: uppercase',
                      },
                      content: { source: 'binding', binding: 'post.publishedAt' },
                    },
                    {
                      type: 'heading',
                      id: 'card-card-title',
                      style: {
                        fontSize: 19,
                        fontWeight: 700,
                        lineClamp: 2,
                        customCss: 'letter-spacing: -0.014em; line-height: 1.32',
                      },
                      level: 2,
                      content: { source: 'binding', binding: 'post.title' },
                    },
                    {
                      type: 'text',
                      id: 'card-card-excerpt',
                      style: { fontSize: 14, color: BODY, lineClamp: 3, customCss: 'line-height: 1.6' },
                      content: { source: 'binding', binding: 'post.excerpt' },
                    },
                    {
                      type: 'button',
                      id: 'card-card-cta',
                      style: {
                        pushToEnd: true,
                        marginTop: 8,
                        background: ACCENT,
                        color: '#ffffff',
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        paddingRight: 16,
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        customCss: 'transition: background 0.15s ease',
                        hover: { background: ACCENT_DARK },
                      },
                      label: { source: 'literal', value: 'Read post' },
                      href: { source: 'binding', binding: 'post.url' },
                    },
                  ],
                },
              ],
            },
          },
          {
            type: 'pagination',
            id: 'card-pager',
            style: {
              marginTop: 44,
              gap: 8,
              justify: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: INK,
              background: CARD,
              borderWidth: 1,
              borderColor: '#e6eaf0',
              borderRadius: 10,
              padding: 10,
              hover: { borderColor: ACCENT, color: ACCENT },
            },
            activeStyle: { background: ACCENT, color: '#ffffff', borderColor: ACCENT },
            postsPerPage: 9,
            mode: 'numbered',
          },
        ],
      },
    ],
  },
}

export const cardsPost: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'post',
  root: {
    type: 'container',
    id: 'card-root',
    style: { direction: 'column', background: CANVAS, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'card-shell',
        style: {
          direction: 'column',
          paddingTop: 56,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
          customCss: 'max-width: 860px; margin-left: auto; margin-right: auto; width: 100%',
          mobile: { paddingTop: 28, paddingBottom: 48, paddingLeft: 16, paddingRight: 16 },
        },
        children: [
          {
            type: 'container',
            id: 'card-sheet',
            style: {
              direction: 'column',
              background: CARD,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#e6eaf0',
              boxShadow: 'md',
              customCss: 'overflow: hidden',
            },
            children: [
              {
                type: 'image',
                id: 'card-cover',
                style: { aspectRatio: '21/9', objectFit: 'cover' },
                source: { source: 'binding', binding: 'post.coverImage' },
                alt: '',
              },
              {
                type: 'container',
                id: 'card-sheet-body',
                style: {
                  direction: 'column',
                  paddingTop: 44,
                  paddingBottom: 48,
                  paddingLeft: 44,
                  paddingRight: 44,
                  mobile: { paddingLeft: 22, paddingRight: 22, paddingTop: 30, paddingBottom: 34 },
                },
                children: [
                  {
                    type: 'text',
                    id: 'card-date',
                    style: {
                      fontSize: 12,
                      color: MUTED,
                      fontWeight: 600,
                      customCss: 'letter-spacing: 0.08em; text-transform: uppercase',
                    },
                    content: { source: 'binding', binding: 'post.publishedAt' },
                  },
                  {
                    type: 'heading',
                    id: 'card-title',
                    style: {
                      fontSize: 40,
                      fontWeight: 700,
                      marginTop: 12,
                      customCss: 'letter-spacing: -0.03em; line-height: 1.12',
                      mobile: { fontSize: 28 },
                    },
                    level: 1,
                    content: { source: 'binding', binding: 'post.title' },
                  },
                  {
                    type: 'text',
                    id: 'card-standfirst',
                    style: {
                      fontSize: 18,
                      color: BODY,
                      marginTop: 16,
                      customCss: 'line-height: 1.6; max-width: 58ch',
                      mobile: { fontSize: 16 },
                    },
                    content: { source: 'binding', binding: 'post.excerpt' },
                  },
                  { type: 'divider', id: 'card-rule', style: { marginTop: 28, borderColor: '#e6eaf0' } },
                  {
                    type: 'richContent',
                    id: 'card-body',
                    style: { fontSize: 17, marginTop: 28, customCss: 'line-height: 1.75' },
                  },
                  {
                    type: 'carousel',
                    id: 'card-gallery',
                    style: { marginTop: 36 },
                    imageSize: 'medium',
                    navigation: 'arrows',
                  },
                ],
              },
            ],
          },
          {
            type: 'heading',
            id: 'card-more-label',
            style: {
              fontSize: 13,
              fontWeight: 700,
              color: MUTED,
              marginTop: 48,
              customCss: 'letter-spacing: 0.1em; text-transform: uppercase',
            },
            level: 2,
            content: { source: 'literal', value: 'More from the blog' },
          },
          {
            type: 'relatedPosts',
            id: 'card-related',
            style: { marginTop: 18 },
            source: 'blog',
            order: 'newest',
          },
        ],
      },
    ],
  },
}
