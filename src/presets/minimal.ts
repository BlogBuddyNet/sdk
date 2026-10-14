import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const INK = '#000000'
const BODY = '#525252'
const MUTED = '#7c7c7c'
const RULE = '#dadada'
const PAPER = '#ffffff'

export const minimalList: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'list',
  root: {
    type: 'container',
    id: 'min-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'min-shell',
        style: {
          direction: 'column',
          paddingTop: 64,
          paddingBottom: 64,
          paddingLeft: 28,
          paddingRight: 28,
          maxWidth: 900,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          mobile: { paddingTop: 36, paddingBottom: 40, paddingLeft: 18, paddingRight: 18 },
        },
        children: [
          {
            type: 'postListLoop',
            id: 'min-loop',
            style: { direction: 'column' },
            itemTemplate: {
              type: 'container',
              id: 'min-row',
              style: {
                direction: 'column',
                paddingTop: 34,
                paddingBottom: 34,
                paddingLeft: 20,
                paddingRight: 20,
                borderWidthBottom: 1,
                borderColor: RULE,
                mobile: { paddingLeft: 0, paddingRight: 0 },
              },
              children: [
                {
                  type: 'text',
                  id: 'min-row-date',
                  style: { fontSize: 15, color: MUTED, lineHeight: 1.4 },
                  content: { source: 'binding', binding: 'post.publishedAt' },
                },
                {
                  type: 'heading',
                  id: 'min-row-title',
                  style: {
                    fontSize: 34,
                    fontWeight: 700,
                    marginTop: 14,
                    lineClamp: 2,
                    letterSpacing: -0.022,
                    lineHeight: 1.2,
                    mobile: { fontSize: 25 },
                  },
                  level: 2,
                  content: { source: 'binding', binding: 'post.title' },
                  clickAction: { href: { source: 'binding', binding: 'post.url' } },
                },
                {
                  type: 'text',
                  id: 'min-row-excerpt',
                  style: {
                    fontSize: 19,
                    color: BODY,
                    marginTop: 16,
                    lineClamp: 3,
                    lineHeight: 1.55,
                    mobile: { fontSize: 16 },
                  },
                  content: { source: 'binding', binding: 'post.excerpt' },
                },
                {
                  type: 'button',
                  id: 'min-row-link',
                  style: {
                    fontSize: 15,
                    fontWeight: 500,
                    color: INK,
                    marginTop: 20,
                    textDecoration: 'underline',
                    hover: { color: MUTED },
                  },
                  label: { source: 'literal', value: 'Read More' },
                  href: { source: 'binding', binding: 'post.url' },
                },
              ],
            },
          },
          {
            type: 'pagination',
            id: 'min-pager',
            style: {
              marginTop: 48,
              gap: 8,
              justify: 'center',
              fontSize: 14,
              color: INK,
              borderWidth: 1,
              borderColor: RULE,
              borderRadius: 9,
              padding: 9,
              hover: { borderColor: '#9a9a9a' },
            },
            activeStyle: { background: INK, color: PAPER, borderColor: INK },
            postsPerPage: 10,
            mode: 'numbered',
          },
        ],
      },
    ],
  },
}

export const minimalPost: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'post',
  root: {
    type: 'container',
    id: 'min-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'min-shell',
        style: {
          direction: 'column',
          paddingTop: 72,
          paddingBottom: 88,
          paddingLeft: 28,
          paddingRight: 28,
          maxWidth: 760,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          mobile: { paddingTop: 36, paddingBottom: 48, paddingLeft: 18, paddingRight: 18 },
        },
        children: [
          {
            type: 'text',
            id: 'min-date',
            style: { fontSize: 15, color: MUTED },
            content: { source: 'binding', binding: 'post.publishedAt' },
          },
          {
            type: 'heading',
            id: 'min-title',
            style: {
              fontSize: 44,
              fontWeight: 700,
              marginTop: 14,
              letterSpacing: -0.026,
              lineHeight: 1.14,
              mobile: { fontSize: 30 },
            },
            level: 1,
            content: { source: 'binding', binding: 'post.title' },
          },
          {
            type: 'text',
            id: 'min-standfirst',
            style: {
              fontSize: 20,
              color: BODY,
              marginTop: 18,
              lineHeight: 1.55,
              mobile: { fontSize: 17 },
            },
            content: { source: 'binding', binding: 'post.excerpt' },
          },
          {
            type: 'image',
            id: 'min-cover',
            style: { marginTop: 36, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 4 },
            source: { source: 'binding', binding: 'post.coverImage' },
            alt: '',
          },
          { type: 'divider', id: 'min-rule', style: { marginTop: 36, borderColor: RULE } },
          {
            type: 'richContent',
            id: 'min-body',
            style: { fontSize: 18, marginTop: 32, lineHeight: 1.75 },
          },
          {
            type: 'carousel',
            id: 'min-gallery',
            style: { marginTop: 36 },
            imageSize: 'medium',
            navigation: 'arrows',
          },
          { type: 'divider', id: 'min-rule-end', style: { marginTop: 56, borderColor: RULE } },
          {
            type: 'heading',
            id: 'min-more-label',
            style: {
              fontSize: 15,
              fontWeight: 600,
              color: MUTED,
              marginTop: 32,
              letterSpacing: 0.02,
            },
            level: 2,
            content: { source: 'literal', value: 'More posts' },
          },
          {
            type: 'relatedPosts',
            id: 'min-related',
            style: { marginTop: 18 },
            source: 'blog',
            order: 'newest',
          },
        ],
      },
    ],
  },
}
