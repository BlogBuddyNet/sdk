import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const INK = '#0b0b0c'
const BODY = '#4b4b52'
const MUTED = '#8a8a90'
const RULE = '#e2e2e4'
const PAPER = '#ffffff'
const PILL = '#3d3d3d'
const PILL_HOVER = '#000000'

export const magazineList: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'list',
  root: {
    type: 'container',
    id: 'mag-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'mag-shell',
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
            id: 'mag-loop',
            style: { direction: 'column' },
            itemTemplate: {
              type: 'container',
              id: 'mag-row',
              style: {
                direction: 'row',
                gap: 32,
                paddingTop: 40,
                paddingBottom: 40,
                borderWidthBottom: 1,
                borderColor: RULE,
                mobile: { direction: 'column', gap: 20, paddingTop: 28, paddingBottom: 28 },
              },
              children: [
                {
                  type: 'image',
                  id: 'mag-row-cover',
                  style: {
                    objectFit: 'cover',
                    aspectRatio: '3/2',
                    flexMode: 'fixed',
                    flexBasis: 64,
                    width: 100,
                    widthUnit: 'percent',
                    mobile: { aspectRatio: '16/9', flexMode: 'auto' },
                  },
                  source: { source: 'binding', binding: 'post.coverImage' },
                  alt: '',
                },
                {
                  type: 'container',
                  id: 'mag-row-aside',
                  style: { direction: 'column', flexMode: 'grow' },
                  children: [
                    {
                      type: 'heading',
                      id: 'mag-row-title',
                      style: {
                        fontSize: 21,
                        fontWeight: 700,
                        lineClamp: 3,
                        letterSpacing: -0.016,
                        lineHeight: 1.26,
                      },
                      level: 2,
                      content: { source: 'binding', binding: 'post.title' },
                      clickAction: { href: { source: 'binding', binding: 'post.url' } },
                    },
                    {
                      type: 'text',
                      id: 'mag-row-excerpt',
                      style: {
                        fontSize: 14,
                        color: BODY,
                        marginTop: 14,
                        lineClamp: 10,
                        lineHeight: 1.6,
                      },
                      content: { source: 'binding', binding: 'post.excerpt' },
                    },
                    {
                      type: 'container',
                      id: 'mag-row-foot',
                      style: {
                        direction: 'row',
                        align: 'center',
                        justify: 'space-between',
                        gap: 12,
                        pushToEnd: true,
                        paddingTop: 24,
                      },
                      children: [
                        {
                          type: 'text',
                          id: 'mag-row-date',
                          style: { fontSize: 12, color: MUTED },
                          content: { source: 'binding', binding: 'post.publishedAt' },
                        },
                        {
                          type: 'button',
                          id: 'mag-row-cta',
                          style: {
                            background: PILL,
                            color: PAPER,
                            fontSize: 13,
                            fontWeight: 500,
                            paddingTop: 11,
                            paddingBottom: 11,
                            paddingLeft: 22,
                            paddingRight: 22,
                            borderRadius: 24,
                            noWrap: true,
                            hover: { background: PILL_HOVER },
                          },
                          label: { source: 'literal', value: 'Read More' },
                          href: { source: 'binding', binding: 'post.url' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          {
            type: 'pagination',
            id: 'mag-pager',
            style: {
              marginTop: 48,
              gap: 8,
              justify: 'center',
              fontSize: 14,
              color: INK,
              borderWidth: 1,
              borderColor: RULE,
              borderRadius: 24,
              paddingTop: 9,
              paddingBottom: 9,
              paddingLeft: 15,
              paddingRight: 15,
              hover: { borderColor: MUTED },
            },
            activeStyle: { background: PILL, color: PAPER, borderColor: PILL },
            postsPerPage: 8,
            mode: 'numbered',
          },
        ],
      },
    ],
  },
}

export const magazinePost: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'post',
  root: {
    type: 'container',
    id: 'mag-root',
    style: { direction: 'column', background: PAPER, color: INK, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'mag-shell',
        style: {
          direction: 'column',
          paddingTop: 64,
          paddingBottom: 88,
          paddingLeft: 28,
          paddingRight: 28,
          maxWidth: 820,
          centerHorizontally: true,
          width: 100,
          widthUnit: 'percent',
          mobile: { paddingTop: 32, paddingBottom: 48, paddingLeft: 18, paddingRight: 18 },
        },
        children: [
          {
            type: 'heading',
            id: 'mag-title',
            style: {
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: -0.028,
              lineHeight: 1.14,
              mobile: { fontSize: 29 },
            },
            level: 1,
            content: { source: 'binding', binding: 'post.title' },
          },
          {
            type: 'text',
            id: 'mag-date',
            style: { fontSize: 13, color: MUTED, marginTop: 16 },
            content: { source: 'binding', binding: 'post.publishedAt' },
          },
          {
            type: 'image',
            id: 'mag-cover',
            style: { marginTop: 32, objectFit: 'cover', aspectRatio: '3/2', width: 100, widthUnit: 'percent' },
            source: { source: 'binding', binding: 'post.coverImage' },
            alt: '',
          },
          {
            type: 'text',
            id: 'mag-standfirst',
            style: {
              fontSize: 19,
              color: BODY,
              marginTop: 32,
              lineHeight: 1.6,
              mobile: { fontSize: 17 },
            },
            content: { source: 'binding', binding: 'post.excerpt' },
          },
          { type: 'divider', id: 'mag-rule', style: { marginTop: 28, borderColor: RULE } },
          {
            type: 'richContent',
            id: 'mag-body',
            style: { fontSize: 17, marginTop: 28, lineHeight: 1.75 },
          },
          {
            type: 'carousel',
            id: 'mag-gallery',
            style: { marginTop: 36 },
            imageSize: 'medium',
            navigation: 'arrows',
          },
          { type: 'divider', id: 'mag-rule-end', style: { marginTop: 56, borderColor: RULE } },
          {
            type: 'heading',
            id: 'mag-more-label',
            style: { fontSize: 15, fontWeight: 600, color: MUTED, marginTop: 32 },
            level: 2,
            content: { source: 'literal', value: 'More posts' },
          },
          {
            type: 'relatedPosts',
            id: 'mag-related',
            style: { marginTop: 18 },
            source: 'blog',
            order: 'newest',
          },
        ],
      },
    ],
  },
}
