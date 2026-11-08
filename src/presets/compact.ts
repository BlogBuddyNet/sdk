import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'
import { postPage } from './post-page'

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
        id: 'cmp-loop',
        style: { columns: 2, gap: 48, customCss: '@container (max-width: 560px) { gap: 28px }' },
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
            customCss: '@container (max-width: 560px) { padding-top: 18px; padding-right: 16px; padding-bottom: 18px; padding-left: 16px }',
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
              type: 'text',
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
                textAlign: 'center',
                layer: 'front',
                marginTop: -34,
                marginLeft: 32,
                marginRight: 32,
                alignSelf: 'center',
                widthUnit: 'fit',
                customCss: '@container (max-width: 560px) { margin-top: -26px; font-size: 18px; margin-left: 16px; margin-right: 16px }',
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
        },
        activeStyle: { background: INK, color: PAPER, borderColor: INK },
        postsPerPage: 8,
        mode: 'numbered',
      },
    
    ],
  },
}

export const compactPost: TemplateDocument = postPage({ prefix: 'cmp', ink: INK, muted: MUTED, rule: '#e5e5e5', paper: PAPER, titleSize: 34, titleSizeNarrow: 25, coverRadius: 0, coverAspect: '16/9', dateFormat: 'monthDayYearDash' })
