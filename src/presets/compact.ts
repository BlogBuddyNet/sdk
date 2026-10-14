import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const INK = '#000000'
const BODY = '#3a3a3a'
const MUTED = '#9a9a9a'
const EDGE = '#000000'
const PAPER = '#ffffff'

export const compactList: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'list',
  root: {
    type: 'container',
    id: 'cmp-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'cmp-shell',
        style: {
          direction: 'column',
          paddingTop: 64,
          paddingBottom: 80,
          paddingLeft: 28,
          paddingRight: 28,
          maxWidth: 1020,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          mobile: { paddingTop: 36, paddingBottom: 48, paddingLeft: 18, paddingRight: 18 },
        },
        children: [
          {
            type: 'postListLoop',
            id: 'cmp-loop',
            style: { columns: 2, gap: 48, mobile: { columns: 1, gap: 28 } },
            itemTemplate: {
              type: 'container',
              id: 'cmp-card',
              style: {
                direction: 'column',
                background: PAPER,
                borderWidth: 1,
                borderColor: EDGE,
                paddingTop: 24,
                paddingBottom: 24,
                paddingLeft: 26,
                paddingRight: 26,
                hover: { boxShadow: 'lg' },
              },
              clickAction: { href: { source: 'binding', binding: 'post.url' } },
              children: [
                {
                  type: 'image',
                  id: 'cmp-card-cover',
                  style: { aspectRatio: '16/9', objectFit: 'cover' },
                  source: { source: 'binding', binding: 'post.coverImage' },
                  alt: '',
                },
                {
                  type: 'heading',
                  id: 'cmp-card-title',
                  style: {
                    fontSize: 21,
                    fontWeight: 700,
                    background: PAPER,
                    paddingTop: 10,
                    paddingBottom: 6,
                    paddingLeft: 14,
                    paddingRight: 14,
                    lineClamp: 2,
                    letterSpacing: -0.014,
                    lineHeight: 1.3,
                    layer: 'front',
                    marginTop: -34,
                    marginLeft: 44,
                    widthUnit: 'fit',
                    mobile: { fontSize: 18 },
                  },
                  level: 2,
                  content: { source: 'binding', binding: 'post.title' },
                },
                {
                  type: 'text',
                  id: 'cmp-card-excerpt',
                  style: {
                    fontSize: 15,
                    color: BODY,
                    marginTop: 18,
                    lineClamp: 4,
                    lineHeight: 1.55,
                  },
                  content: { source: 'binding', binding: 'post.excerpt' },
                },
                {
                  type: 'text',
                  id: 'cmp-card-date',
                  style: {
                    fontSize: 14,
                    color: MUTED,
                    textAlign: 'center',
                    pushToEnd: true,
                    paddingTop: 36,
                    letterSpacing: 0.06,
                  },
                  content: { source: 'binding', binding: 'post.publishedAt', dateFormat: 'monthDayYearDash' },
                },
              ],
            },
          },
          {
            type: 'pagination',
            id: 'cmp-pager',
            style: {
              marginTop: 52,
              gap: 8,
              justify: 'center',
              fontSize: 14,
              color: INK,
              borderWidth: 1,
              borderColor: EDGE,
              padding: 10,
              hover: { background: '#f2f2f2' },
            },
            activeStyle: { background: INK, color: PAPER, borderColor: INK },
            postsPerPage: 8,
            mode: 'numbered',
          },
        ],
      },
    ],
  },
}

export const compactPost: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'post',
  root: {
    type: 'container',
    id: 'cmp-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'cmp-shell',
        style: {
          direction: 'column',
          paddingTop: 56,
          paddingBottom: 80,
          paddingLeft: 28,
          paddingRight: 28,
          maxWidth: 840,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          mobile: { paddingTop: 28, paddingBottom: 48, paddingLeft: 18, paddingRight: 18 },
        },
        children: [
          {
            type: 'container',
            id: 'cmp-sheet',
            style: {
              direction: 'column',
              borderWidth: 1,
              borderColor: EDGE,
              paddingTop: 30,
              paddingBottom: 40,
              paddingLeft: 34,
              paddingRight: 34,
              mobile: { paddingLeft: 18, paddingRight: 18, paddingTop: 20, paddingBottom: 28 },
            },
            children: [
              {
                type: 'image',
                id: 'cmp-cover',
                style: { aspectRatio: '16/9', objectFit: 'cover' },
                source: { source: 'binding', binding: 'post.coverImage' },
                alt: '',
              },
              {
                type: 'heading',
                id: 'cmp-title',
                style: {
                  fontSize: 34,
                  fontWeight: 700,
                  background: PAPER,
                  paddingTop: 14,
                  paddingBottom: 8,
                  paddingLeft: 18,
                  paddingRight: 18,
                  letterSpacing: -0.024,
                  lineHeight: 1.18,
                  layer: 'front',
                  marginTop: -34,
                  marginLeft: 44,
                  widthUnit: 'fit',
                  mobile: { fontSize: 25, letterSpacing: -0.02, lineHeight: 1.2 },
                },
                level: 1,
                content: { source: 'binding', binding: 'post.title' },
              },
              {
                type: 'text',
                id: 'cmp-standfirst',
                style: {
                  fontSize: 17,
                  color: BODY,
                  marginTop: 22,
                  lineHeight: 1.6,
                  mobile: { fontSize: 16 },
                },
                content: { source: 'binding', binding: 'post.excerpt' },
              },
              {
                type: 'richContent',
                id: 'cmp-body',
                style: { fontSize: 17, marginTop: 28, lineHeight: 1.75 },
              },
              {
                type: 'carousel',
                id: 'cmp-gallery',
                style: { marginTop: 36 },
                imageSize: 'medium',
                navigation: 'arrows',
              },
              {
                type: 'text',
                id: 'cmp-date',
                style: {
                  fontSize: 14,
                  color: MUTED,
                  textAlign: 'center',
                  marginTop: 44,
                  letterSpacing: 0.06,
                },
                content: { source: 'binding', binding: 'post.publishedAt', dateFormat: 'monthDayYearDash' },
              },
            ],
          },
          {
            type: 'heading',
            id: 'cmp-more-label',
            style: { fontSize: 15, fontWeight: 600, color: MUTED, marginTop: 52 },
            level: 2,
            content: { source: 'literal', value: 'More posts' },
          },
          {
            type: 'relatedPosts',
            id: 'cmp-related',
            style: { marginTop: 18 },
            source: 'blog',
            order: 'newest',
          },
        ],
      },
    ],
  },
}
