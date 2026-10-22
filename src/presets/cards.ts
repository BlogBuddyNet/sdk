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
        id: 'card-loop',
        style: { columns: 2, gap: 44, customCss: '@container (max-width: 560px) { gap: 28px }' },
        itemTemplate: {
          type: 'container',
          id: 'card-card',
          style: {
            direction: 'column',
            background: CARD,
            borderRadius: 20,
            clip: true,
            boxShadow: 'md',
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
                    customCss: '@container (max-width: 560px) { font-size: 20px }',
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
        },
        activeStyle: { background: INK, color: PAPER, borderColor: INK },
        postsPerPage: 8,
        mode: 'numbered',
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
    style: {
      direction: 'column',
      background: PAPER,
      color: INK,
      fontFamily: 'sans-serif',
      paddingTop: 56,
      paddingBottom: 80,
      paddingLeft: 24,
      paddingRight: 24,
      customCss: '@container (max-width: 560px) { padding-top: 28px; padding-right: 16px; padding-bottom: 48px; padding-left: 16px }',
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
              customCss: '@container (max-width: 560px) { padding-top: 30px; padding-right: 22px; padding-bottom: 34px; padding-left: 22px }',
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
                  customCss: '@container (max-width: 560px) { font-size: 28px }',
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
                  customCss: '@container (max-width: 560px) { font-size: 16px }',
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
}
