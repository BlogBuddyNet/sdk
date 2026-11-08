import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'
import { postPage } from './post-page'

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
    style: {
      direction: 'column',
      background: PAPER,
      color: INK,
      paddingTop: 64,
      paddingBottom: 64,
      paddingLeft: 28,
      paddingRight: 28,
      customCss: '@container (max-width: 560px) { padding-top: 36px; padding-right: 18px; padding-bottom: 40px; padding-left: 18px }',
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
            customCss: '@container (max-width: 560px) { padding-right: 0px; padding-left: 0px }',
          },
          children: [
            {
              type: 'text',
              id: 'min-row-date',
              style: { fontSize: 15, color: MUTED, lineHeight: 1.4 },
              content: { source: 'binding', binding: 'post.publishedAt' },
            },
            {
              type: 'text',
              id: 'min-row-title',
              style: {
                fontSize: 34,
                fontWeight: 700,
                marginTop: 14,
                lineClamp: 2,
                letterSpacing: -0.022,
                lineHeight: 1.2,
                customCss: '@container (max-width: 560px) { font-size: 25px }',
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
                customCss: '@container (max-width: 560px) { font-size: 16px }',
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
        },
        activeStyle: { background: INK, color: PAPER, borderColor: INK },
        postsPerPage: 10,
        mode: 'numbered',
      },
    
    ],
  },
}

export const minimalPost: TemplateDocument = postPage({ prefix: 'min', ink: INK, muted: MUTED, rule: RULE, paper: PAPER, titleSize: 44, titleSizeNarrow: 30, coverRadius: 4, coverAspect: '16/9' })
