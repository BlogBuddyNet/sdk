import type { DateFormat, TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

export interface PostPageLook {
  prefix: string
  ink: string
  muted: string
  rule: string
  paper: string
  titleSize: number
  titleSizeNarrow: number
  coverRadius: number
  coverAspect: '16/9' | '3/2'
  dateFormat?: DateFormat
}

export function postPage(look: PostPageLook): TemplateDocument {
  const id = (name: string) => `${look.prefix}-${name}`
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    kind: 'post',
    root: {
      type: 'container',
      id: id('root'),
      style: {
        direction: 'column',
        background: look.paper,
        color: look.ink,
        paddingTop: 64,
        paddingBottom: 88,
        paddingLeft: 28,
        paddingRight: 28,
        customCss: '@container (max-width: 560px) { padding-top: 32px; padding-right: 18px; padding-bottom: 48px; padding-left: 18px }',
      },
      children: [
        {
          type: 'container',
          id: id('column'),
          style: { direction: 'column', maxWidth: 760, centerHorizontally: true, width: 100, widthUnit: 'percent' },
          children: [
            {
              type: 'text',
              id: id('date'),
              style: { fontSize: 14, color: look.muted },
              content: look.dateFormat
                ? { source: 'binding', binding: 'post.publishedAt', dateFormat: look.dateFormat }
                : { source: 'binding', binding: 'post.publishedAt' },
            },
            {
              type: 'image',
              id: id('cover'),
              style: {
                marginTop: 18,
                aspectRatio: look.coverAspect,
                objectFit: 'cover',
                borderRadius: look.coverRadius,
                width: 100,
                widthUnit: 'percent',
              },
              source: { source: 'binding', binding: 'post.coverImage' },
              alt: '',
            },
            {
              type: 'text',
              id: id('title'),
              style: {
                fontSize: look.titleSize,
                fontWeight: 700,
                marginTop: 32,
                letterSpacing: -0.026,
                lineHeight: 1.14,
                customCss: `@container (max-width: 560px) { font-size: ${look.titleSizeNarrow}px }`,
              },
              level: 1,
              content: { source: 'binding', binding: 'post.title' },
            },
            { type: 'divider', id: id('rule'), style: { marginTop: 28, borderColor: look.rule } },
            {
              type: 'text',
              id: id('body'),
              style: { fontSize: 17, marginTop: 28, lineHeight: 1.75 },
              content: { source: 'binding', binding: 'post.content' },
            },
          ],
        },
      ],
    },
  }
}
