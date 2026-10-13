import type { TemplateDocument } from '../template-schema'
import { CURRENT_SCHEMA_VERSION } from '../template-schema'

const PAPER = '#f3f1ec'
const BODY = '#a9b2bf'
const MUTED = '#8b95a3'
const NIGHT = '#0e1116'
const PANEL = '#151a21'
const RULE = '#242c37'
const ACCENT = '#d8b26a'

const SHELL = 'max-width: 1160px; margin-left: auto; margin-right: auto; width: 100%'

export const magazineList: TemplateDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  kind: 'list',
  root: {
    type: 'container',
    id: 'mag-root',
    style: { direction: 'column', background: NIGHT, color: PAPER, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'mag-shell',
        style: {
          direction: 'column',
          paddingTop: 72,
          paddingBottom: 96,
          paddingLeft: 28,
          paddingRight: 28,
          customCss: SHELL,
          mobile: { paddingTop: 44, paddingBottom: 56 },
        },
        children: [
          {
            type: 'heading',
            id: 'mag-kicker',
            style: {
              fontSize: 12,
              fontWeight: 700,
              color: ACCENT,
              customCss: 'letter-spacing: 0.26em; text-transform: uppercase',
            },
            level: 2,
            content: { source: 'literal', value: 'The Dispatch' },
          },
          {
            type: 'heading',
            id: 'mag-masthead',
            style: {
              fontSize: 54,
              fontWeight: 800,
              marginTop: 14,
              customCss: 'letter-spacing: -0.04em; line-height: 1.02; max-width: 16ch',
              mobile: { fontSize: 34 },
            },
            level: 1,
            content: { source: 'literal', value: 'Stories from the workshop' },
          },
          { type: 'divider', id: 'mag-masthead-rule', style: { marginTop: 40, borderColor: RULE } },
          {
            type: 'postListLoop',
            id: 'mag-loop',
            style: { direction: 'column' },
            itemTemplate: {
              type: 'container',
              id: 'mag-story',
              style: {
                direction: 'row',
                gap: 32,
                paddingTop: 34,
                paddingBottom: 34,
                paddingLeft: 14,
                paddingRight: 14,
                borderRadius: 10,
                customCss: `border-bottom: 1px solid ${RULE}; align-items: flex-start; transition: background 0.16s ease`,
                hover: { customCss: 'background: rgba(216, 178, 106, 0.05)' },
                mobile: { direction: 'column', gap: 16 },
              },
              children: [
                {
                  type: 'image',
                  id: 'mag-story-cover',
                  style: {
                    aspectRatio: '4/3',
                    objectFit: 'cover',
                    borderRadius: 6,
                    customCss: 'flex: 0 0 244px',
                    mobile: { customCss: 'flex: 1 1 auto' },
                  },
                  source: { source: 'binding', binding: 'post.coverImage' },
                  alt: '',
                },
                {
                  type: 'container',
                  id: 'mag-story-text',
                  style: {
                    direction: 'column',
                    gap: 12,
                    customCss: 'flex: 999 1 320px; min-width: 0',
                  },
                  children: [
                    {
                      type: 'text',
                      id: 'mag-story-date',
                      style: {
                        fontSize: 11,
                        fontWeight: 600,
                        color: MUTED,
                        customCss: 'letter-spacing: 0.16em; text-transform: uppercase',
                      },
                      content: { source: 'binding', binding: 'post.publishedAt' },
                    },
                    {
                      type: 'heading',
                      id: 'mag-story-title',
                      style: {
                        fontSize: 32,
                        fontWeight: 800,
                        lineClamp: 3,
                        customCss: 'letter-spacing: -0.032em; line-height: 1.1',
                        mobile: { fontSize: 24 },
                      },
                      level: 2,
                      content: { source: 'binding', binding: 'post.title' },
                    },
                    {
                      type: 'text',
                      id: 'mag-story-excerpt',
                      style: {
                        fontSize: 15,
                        color: BODY,
                        lineClamp: 2,
                        customCss: 'line-height: 1.62; max-width: 64ch',
                      },
                      content: { source: 'binding', binding: 'post.excerpt' },
                    },
                    {
                      type: 'button',
                      id: 'mag-story-link',
                      style: {
                        fontSize: 12,
                        fontWeight: 700,
                        color: ACCENT,
                        marginTop: 4,
                        customCss:
                          'letter-spacing: 0.14em; text-transform: uppercase; border-bottom: 1px solid currentColor; padding-bottom: 3px',
                      },
                      label: { source: 'literal', value: 'Read the story' },
                      href: { source: 'binding', binding: 'post.url' },
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
              fontSize: 13,
              fontWeight: 600,
              color: PAPER,
              background: PANEL,
              borderWidth: 1,
              borderColor: RULE,
              borderRadius: 8,
              padding: 10,
              hover: { color: ACCENT, borderColor: ACCENT },
            },
            activeStyle: { background: ACCENT, color: NIGHT, borderColor: ACCENT },
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
    style: { direction: 'column', background: NIGHT, color: PAPER, fontFamily: 'sans-serif' },
    children: [
      {
        type: 'container',
        id: 'mag-shell',
        style: {
          direction: 'column',
          paddingTop: 72,
          paddingBottom: 96,
          paddingLeft: 28,
          paddingRight: 28,
          customCss: SHELL,
          mobile: { paddingTop: 40, paddingBottom: 56 },
        },
        children: [
          {
            type: 'text',
            id: 'mag-date',
            style: {
              fontSize: 11,
              fontWeight: 600,
              color: ACCENT,
              customCss: 'letter-spacing: 0.2em; text-transform: uppercase',
            },
            content: { source: 'binding', binding: 'post.publishedAt' },
          },
          {
            type: 'heading',
            id: 'mag-title',
            style: {
              fontSize: 60,
              fontWeight: 800,
              marginTop: 16,
              customCss: 'letter-spacing: -0.042em; line-height: 1.0; max-width: 19ch',
              mobile: { fontSize: 34 },
            },
            level: 1,
            content: { source: 'binding', binding: 'post.title' },
          },
          {
            type: 'text',
            id: 'mag-standfirst',
            style: {
              fontSize: 20,
              color: BODY,
              marginTop: 20,
              customCss: 'line-height: 1.55; max-width: 56ch',
              mobile: { fontSize: 17 },
            },
            content: { source: 'binding', binding: 'post.excerpt' },
          },
          { type: 'spacer', id: 'mag-gap-cover', size: 44 },
          {
            type: 'image',
            id: 'mag-cover',
            style: { aspectRatio: '21/9', objectFit: 'cover', borderRadius: 8 },
            source: { source: 'binding', binding: 'post.coverImage' },
            alt: '',
          },
          {
            type: 'container',
            id: 'mag-reading',
            style: {
              direction: 'row',
              gap: 56,
              marginTop: 52,
              customCss: 'align-items: flex-start',
              mobile: { direction: 'column', gap: 28, marginTop: 32 },
            },
            children: [
              {
                type: 'tableOfContents',
                id: 'mag-toc',
                style: {
                  fontSize: 13,
                  color: MUTED,
                  customCss: 'flex: 0 0 190px; position: sticky; top: 32px; line-height: 1.9',
                  mobile: { customCss: 'flex: 1 1 auto; position: static' },
                },
              },
              {
                type: 'richContent',
                id: 'mag-body',
                style: {
                  fontSize: 17,
                  customCss: 'flex: 999 1 360px; min-width: 0; line-height: 1.8',
                },
              },
            ],
          },
          {
            type: 'carousel',
            id: 'mag-gallery',
            style: { marginTop: 44 },
            imageSize: 'large',
            navigation: 'arrows',
          },
          { type: 'divider', id: 'mag-rule', style: { marginTop: 60, borderColor: RULE } },
          {
            type: 'heading',
            id: 'mag-more-label',
            style: {
              fontSize: 12,
              fontWeight: 700,
              color: ACCENT,
              marginTop: 44,
              customCss: 'letter-spacing: 0.2em; text-transform: uppercase',
            },
            level: 2,
            content: { source: 'literal', value: 'More dispatches' },
          },
          {
            type: 'relatedPosts',
            id: 'mag-related',
            style: { marginTop: 20 },
            source: 'blog',
            order: 'newest',
          },
        ],
      },
    ],
  },
}
