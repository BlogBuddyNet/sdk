import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const INK = '#14110c'
const MUTED = '#7c766a'
const RULE = '#e7e3db'
const PAPER = '#ffffff'

/** Centres a column and gives it a real measure, which no structured style prop does. */
const COLUMN = 'max-width: 720px; margin-left: auto; margin-right: auto; width: 100%'

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
          paddingTop: 88,
          paddingBottom: 88,
          paddingLeft: 28,
          paddingRight: 28,
          customCss: COLUMN,
          mobile: { paddingTop: 48, paddingBottom: 48 },
        },
        children: [
          {
            type: 'heading',
            id: 'min-masthead',
            style: { fontSize: 15, fontWeight: 600, customCss: 'letter-spacing: 0.16em; text-transform: uppercase' },
            level: 1,
            content: { source: 'literal', value: 'Writing' },
          },
          {
            type: 'text',
            id: 'min-masthead-sub',
            style: { fontSize: 15, color: MUTED, marginTop: 10, customCss: 'line-height: 1.6; max-width: 46ch' },
            content: { source: 'literal', value: 'Notes, essays and the occasional changelog.' },
          },
          { type: 'spacer', id: 'min-masthead-gap', size: 24 },
          {
            type: 'postListLoop',
            id: 'min-loop',
            style: { direction: 'column' },
            itemTemplate: {
              type: 'container',
              id: 'min-row',
              style: {
                direction: 'column',
                gap: 9,
                paddingTop: 34,
                paddingBottom: 34,
                borderRadius: 10,
                customCss: `border-bottom: 1px solid ${RULE}; transition: background 0.15s ease`,
                hover: { customCss: 'background: rgba(20, 17, 12, 0.028)' },
              },
              children: [
                {
                  type: 'text',
                  id: 'min-row-date',
                  style: {
                    fontSize: 12,
                    color: MUTED,
                    customCss: 'letter-spacing: 0.1em; text-transform: uppercase',
                  },
                  content: { source: 'binding', binding: 'post.publishedAt' },
                },
                {
                  type: 'heading',
                  id: 'min-row-title',
                  style: {
                    fontSize: 27,
                    fontWeight: 600,
                    lineClamp: 2,
                    customCss: 'letter-spacing: -0.022em; line-height: 1.22',
                    mobile: { fontSize: 22 },
                  },
                  level: 2,
                  content: { source: 'binding', binding: 'post.title' },
                },
                {
                  type: 'text',
                  id: 'min-row-excerpt',
                  style: {
                    fontSize: 15,
                    color: '#5f594e',
                    lineClamp: 2,
                    customCss: 'line-height: 1.65; max-width: 62ch',
                  },
                  content: { source: 'binding', binding: 'post.excerpt' },
                },
                {
                  type: 'button',
                  id: 'min-row-link',
                  style: {
                    fontSize: 14,
                    fontWeight: 500,
                    color: INK,
                    marginTop: 4,
                    customCss: 'border-bottom: 1px solid currentColor; padding-bottom: 2px',
                  },
                  label: { source: 'literal', value: 'Read' },
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
              hover: { borderColor: '#c9c2b5' },
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
          paddingTop: 88,
          paddingBottom: 96,
          paddingLeft: 28,
          paddingRight: 28,
          customCss: COLUMN,
          mobile: { paddingTop: 48, paddingBottom: 56 },
        },
        children: [
          {
            type: 'text',
            id: 'min-date',
            style: { fontSize: 12, color: MUTED, customCss: 'letter-spacing: 0.1em; text-transform: uppercase' },
            content: { source: 'binding', binding: 'post.publishedAt' },
          },
          {
            type: 'heading',
            id: 'min-title',
            style: {
              fontSize: 46,
              fontWeight: 700,
              marginTop: 14,
              customCss: 'letter-spacing: -0.033em; line-height: 1.08; max-width: 18ch',
              mobile: { fontSize: 32 },
            },
            level: 1,
            content: { source: 'binding', binding: 'post.title' },
          },
          {
            type: 'text',
            id: 'min-standfirst',
            style: {
              fontSize: 19,
              color: '#5f594e',
              marginTop: 18,
              customCss: 'line-height: 1.55; max-width: 54ch',
              mobile: { fontSize: 17 },
            },
            content: { source: 'binding', binding: 'post.excerpt' },
          },
          { type: 'spacer', id: 'min-gap-cover', size: 40 },
          {
            type: 'image',
            id: 'min-cover',
            style: { borderRadius: 10, aspectRatio: '16/9', objectFit: 'cover' },
            source: { source: 'binding', binding: 'post.coverImage' },
            alt: '',
          },
          { type: 'spacer', id: 'min-gap-body', size: 40 },
          {
            type: 'richContent',
            id: 'min-body',
            style: { fontSize: 17, customCss: 'line-height: 1.78' },
          },
          {
            type: 'carousel',
            id: 'min-gallery',
            style: { marginTop: 40 },
            imageSize: 'medium',
            navigation: 'arrows',
          },
          {
            type: 'divider',
            id: 'min-rule',
            style: { marginTop: 56, borderColor: RULE },
          },
          {
            type: 'heading',
            id: 'min-more-label',
            style: {
              fontSize: 12,
              fontWeight: 600,
              color: MUTED,
              marginTop: 40,
              customCss: 'letter-spacing: 0.14em; text-transform: uppercase',
            },
            level: 2,
            content: { source: 'literal', value: 'Keep reading' },
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
