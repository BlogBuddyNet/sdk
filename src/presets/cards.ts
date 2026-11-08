import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'
import { postPage } from './post-page'

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
                  type: 'text',
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

export const cardsPost: TemplateDocument = postPage({ prefix: 'card', ink: INK, muted: MUTED, rule: RULE, paper: PAPER, titleSize: 40, titleSizeNarrow: 28, coverRadius: 24, coverAspect: '16/9' })
