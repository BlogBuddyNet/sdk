import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const INK = '#000000'
const BODY = '#3f3f46'
const MUTED = '#8e8e93'
const PAPER = '#ffffff'
const CARD = '#ffffff'
const RULE = '#e8e8ea'

export const cardsList: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'list',
  root: {
    type: 'container',
    id: 'card-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'card-shell',
        style: {
          direction: 'column',
          paddingTop: 64,
          paddingBottom: 80,
          paddingLeft: 28,
          paddingRight: 28,
          maxWidth: 1080,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          mobile: { paddingTop: 36, paddingBottom: 48, paddingLeft: 18, paddingRight: 18 },
        },
        children: [
          {
            type: 'postListLoop',
            id: 'card-loop',
            style: { columns: 2, gap: 44, mobile: { columns: 1, gap: 28 } },
            itemTemplate: {
              type: 'container',
              id: 'card-card',
              style: {
                direction: 'column',
                background: CARD,
                borderRadius: 20,
                clip: true,
                boxShadow: 'md',
                hover: { boxShadow: 'xl', translateY: -4 },
              },
              clickAction: { href: { source: 'binding', binding: 'post.url' } },
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
                  style: {
                    direction: 'column',
                    paddingTop: 26,
                    paddingBottom: 26,
                    paddingLeft: 24,
                    paddingRight: 24,
                    flexMode: 'grow',
                  },
                  children: [
                    {
                      type: 'heading',
                      id: 'card-card-title',
                      style: {
                        fontSize: 23,
                        fontWeight: 700,
                        lineClamp: 2,
                        letterSpacing: -0.018,
                        lineHeight: 1.28,
                        mobile: { fontSize: 20 },
                      },
                      level: 2,
                      content: { source: 'binding', binding: 'post.title' },
                    },
                    {
                      type: 'text',
                      id: 'card-card-excerpt',
                      style: {
                        fontSize: 16,
                        color: BODY,
                        marginTop: 10,
                        lineClamp: 2,
                        lineHeight: 1.5,
                      },
                      content: { source: 'binding', binding: 'post.excerpt' },
                    },
                    {
                      type: 'text',
                      id: 'card-card-date',
                      style: { fontSize: 13, color: MUTED, pushToEnd: true, paddingTop: 28 },
                      content: { source: 'binding', binding: 'post.publishedAt' },
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
              marginTop: 56,
              gap: 8,
              justify: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: INK,
              background: CARD,
              borderWidth: 1,
              borderColor: RULE,
              borderRadius: 12,
              padding: 10,
              hover: { borderColor: '#b8b8bd' },
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

export const cardsPost: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'post',
  root: {
    type: 'container',
    id: 'card-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
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
          maxWidth: 860,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          mobile: { paddingTop: 28, paddingBottom: 48, paddingLeft: 16, paddingRight: 16 },
        },
        children: [
          {
            type: 'container',
            id: 'card-sheet',
            style: {
              direction: 'column',
              background: CARD,
              borderRadius: 24,
              clip: true,
              boxShadow: 'md',
            },
            children: [
              {
                type: 'image',
                id: 'card-cover',
                style: { aspectRatio: '16/9', objectFit: 'cover' },
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
                    type: 'heading',
                    id: 'card-title',
                    style: {
                      fontSize: 40,
                      fontWeight: 700,
                      letterSpacing: -0.028,
                      lineHeight: 1.14,
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
                      lineHeight: 1.6,
                      mobile: { fontSize: 16 },
                    },
                    content: { source: 'binding', binding: 'post.excerpt' },
                  },
                  {
                    type: 'text',
                    id: 'card-date',
                    style: { fontSize: 13, color: MUTED, marginTop: 20 },
                    content: { source: 'binding', binding: 'post.publishedAt' },
                  },
                  { type: 'divider', id: 'card-rule', style: { marginTop: 28, borderColor: RULE } },
                  {
                    type: 'richContent',
                    id: 'card-body',
                    style: { fontSize: 17, marginTop: 28, lineHeight: 1.75 },
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
            style: { fontSize: 15, fontWeight: 600, color: MUTED, marginTop: 56 },
            level: 2,
            content: { source: 'literal', value: 'More posts' },
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
