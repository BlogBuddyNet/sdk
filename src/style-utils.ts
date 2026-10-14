import type { BlockNode, BlockStyle, CustomFontRef } from './template-schema'
import { getChildren } from './template-tree-utils'

export type CssProps = Record<string, string | number>

const ALIGN_MAP: Record<NonNullable<BlockStyle['align']>, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

const JUSTIFY_MAP: Record<NonNullable<BlockStyle['justify']>, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
}

const BOX_SHADOW_VALUES: Record<NonNullable<BlockStyle['boxShadow']>, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px rgba(0, 0, 0, 0.10)',
  lg: '0 10px 24px rgba(0, 0, 0, 0.14)',
  xl: '0 20px 40px rgba(0, 0, 0, 0.18)',
}

/** Parses a `style.customCss` string into a CssProps map. Declarations only, never
 * selectors, so it can only affect the node it is applied to. */
export function parseCustomCss(customCss?: string): CssProps {
  const props: CssProps = {}
  if (!customCss) return props
  for (const declaration of customCss.split(';')) {
    const separatorIndex = declaration.indexOf(':')
    if (separatorIndex === -1) continue
    const rawProperty = declaration.slice(0, separatorIndex).trim()
    const value = declaration.slice(separatorIndex + 1).trim()
    if (!rawProperty || !value) continue
    if (/[{}]/.test(rawProperty) || /[{}]/.test(value)) continue
    const camelProperty = rawProperty.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
    props[camelProperty] = value
  }
  return props
}

/** Combines a validated #RRGGBB/#RGB hex color with a 0-100 opacity into an rgba()
 * string. The schema keeps colors as plain hex (so they can't smuggle a CSS
 * function) - opacity is applied here, at render time, as a separate step. */
function colorWithOpacity(hex: string, opacityPct: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacityPct)) / 100})`
}

function coreCssProps(style: BlockStyle): CssProps {
  const props: CssProps = {}
  if (style.color) {
    props.color = style.colorOpacity !== undefined ? colorWithOpacity(style.color, style.colorOpacity) : style.color
  }
  if (style.background) {
    props.backgroundColor =
      style.backgroundOpacity !== undefined ? colorWithOpacity(style.background, style.backgroundOpacity) : style.background
  }
  if (style.padding !== undefined) props.padding = `${style.padding}px`
  if (style.paddingTop !== undefined) props.paddingTop = `${style.paddingTop}px`
  if (style.paddingRight !== undefined) props.paddingRight = `${style.paddingRight}px`
  if (style.paddingBottom !== undefined) props.paddingBottom = `${style.paddingBottom}px`
  if (style.paddingLeft !== undefined) props.paddingLeft = `${style.paddingLeft}px`
  if (style.margin !== undefined) props.margin = `${style.margin}px`
  if (style.centerHorizontally) {
    props.marginLeft = 'auto'
    props.marginRight = 'auto'
  }
  if (style.marginTop !== undefined) props.marginTop = `${style.marginTop}px`
  if (style.marginRight !== undefined) props.marginRight = `${style.marginRight}px`
  if (style.marginBottom !== undefined) props.marginBottom = `${style.marginBottom}px`
  if (style.marginLeft !== undefined) props.marginLeft = `${style.marginLeft}px`
  if (style.fontSize !== undefined) props.fontSize = `${style.fontSize}px`
  if (style.fontWeight !== undefined) props.fontWeight = style.fontWeight
  if (style.fontFamily) props.fontFamily = cssFontFamily(style.fontFamily)
  if (style.textAlign) props.textAlign = style.textAlign
  if (style.borderRadius !== undefined) props.borderRadius = `${style.borderRadius}px`
  if (style.borderRadiusTopLeft !== undefined) props.borderTopLeftRadius = `${style.borderRadiusTopLeft}px`
  if (style.borderRadiusTopRight !== undefined) props.borderTopRightRadius = `${style.borderRadiusTopRight}px`
  if (style.borderRadiusBottomRight !== undefined)
    props.borderBottomRightRadius = `${style.borderRadiusBottomRight}px`
  if (style.borderRadiusBottomLeft !== undefined) props.borderBottomLeftRadius = `${style.borderRadiusBottomLeft}px`
  if (style.borderWidth !== undefined) {
    props.borderWidth = `${style.borderWidth}px`
    props.borderStyle = 'solid'
  }
  const sideBorders = [
    ['borderWidthTop', 'borderTopWidth'],
    ['borderWidthRight', 'borderRightWidth'],
    ['borderWidthBottom', 'borderBottomWidth'],
    ['borderWidthLeft', 'borderLeftWidth'],
  ] as const
  for (const [prop, cssProp] of sideBorders) {
    const value = style[prop]
    if (value === undefined) continue
    props[cssProp] = `${value}px`
    props[`${cssProp.replace('Width', '')}Style`] = 'solid'
  }
  if (style.borderColor) {
    props.borderColor =
      style.borderColorOpacity !== undefined ? colorWithOpacity(style.borderColor, style.borderColorOpacity) : style.borderColor
  }
  if (style.alignSelf) props.alignSelf = ALIGN_MAP[style.alignSelf]
  if (style.pushToEnd) props.marginTop = 'auto'
  if (style.opacity !== undefined) props.opacity = style.opacity / 100
  if (style.boxShadow && style.boxShadow !== 'none') props.boxShadow = BOX_SHADOW_VALUES[style.boxShadow]
  if (style.lineHeight !== undefined) props.lineHeight = String(style.lineHeight)
  if (style.letterSpacing !== undefined) props.letterSpacing = `${style.letterSpacing}em`
  if (style.textDecoration === 'underline') {
    props.textDecoration = 'underline'
    props.textUnderlineOffset = '4px'
    props.textDecorationThickness = '1px'
  } else if (style.textDecoration === 'none') {
    props.textDecoration = 'none'
  }
  if (style.noWrap) props.whiteSpace = 'nowrap'
  if (style.width !== undefined || style.widthUnit === 'fit') {
    props.width =
      style.widthUnit === 'fit'
        ? 'fit-content'
        : style.widthUnit === 'percent'
          ? `${style.width}%`
          : `${style.width}px`
  }
  if (style.maxWidth !== undefined) props.maxWidth = `${style.maxWidth}px`
  if (style.minHeight !== undefined) props.minHeight = `${style.minHeight}px`
  if (style.clip) props.overflow = 'hidden'
  if (style.translateY !== undefined) props.transform = `translateY(${style.translateY}px)`
  if (style.flexMode === 'grow') {
    props.flex = '1 1 auto'
    props.minWidth = '0'
  } else if (style.flexMode === 'fixed') {
    props.flex = `0 0 ${style.flexBasis ?? 50}%`
    props.minWidth = '0'
  }
  if (style.layer === 'fill') {
    props.position = 'absolute'
    props.top = '0'
    props.left = '0'
    props.width = '100%'
    props.height = '100%'
  } else if (style.layer === 'front') {
    props.position = 'relative'
    props.zIndex = '1'
  }
  if (style.lineClamp !== undefined) {
    props.display = '-webkit-box'
    props.WebkitLineClamp = style.lineClamp
    props.WebkitBoxOrient = 'vertical'
    props.overflow = 'hidden'
  }
  return props
}

/** Padding counts inside the width. Inline styles only, never the hover or media rules. */
export const BORDER_BOX: CssProps = { boxSizing: 'border-box' }

export function baseCssProps(style: BlockStyle): CssProps {
  return { ...BORDER_BOX, ...coreCssProps(style), ...parseCustomCss(style.customCss) }
}

export function camelToKebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function escapeAttrValue(value: string): string {
  return value.replace(/["\\]/g, '\\$&')
}

/** One `:hover` rule per block that sets `style.hover`. Inline styles cannot express a
 * pseudo-class, so this needs a real stylesheet, and every declaration is `!important`
 * to outrank the block's own inline style. */
const HOVER_TRANSITION =
  'transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;'

export function buildHoverCss(root: BlockNode): string {
  const rules: string[] = []

  function visit(node: BlockNode) {
    if (node.type === 'carousel' && node.style?.hover) {
      const selector = `[data-node-id="${escapeAttrValue(node.id)}"]`
      const { box, photo } = carouselCssProps(node.style.hover)
      const boxDeclarations = cssDeclarations(box)
      if (boxDeclarations) rules.push(`${selector}:hover { ${boxDeclarations}; ${HOVER_TRANSITION} }`)
      const photoDeclarations = cssDeclarations(photo)
      if (photoDeclarations) rules.push(`${selector}:hover img { ${photoDeclarations}; ${HOVER_TRANSITION} }`)
      for (const child of getChildren(node)) visit(child)
      return
    }
    if ('style' in node && node.style?.hover) {
      const props = { ...coreCssProps(node.style.hover), ...parseCustomCss(node.style.hover.customCss) }
      const declarations = Object.entries(props)
        .map(([prop, value]) => `${camelToKebab(prop)}: ${value} !important`)
        .join('; ')
      if (declarations) {
        const selectors =
          node.type === 'pagination'
            ? [
                `button[data-node-id="${escapeAttrValue(node.id)}"]:not(:disabled)`,
                `a[data-node-id="${escapeAttrValue(node.id)}"]:not([aria-current="page"])`,
              ]
            : [`[data-node-id="${escapeAttrValue(node.id)}"]`]
        rules.push(
          `${selectors.map((selector) => `${selector}:hover`).join(', ')} { ${declarations}; ${HOVER_TRANSITION} }`
        )
      }
    }
    for (const child of getChildren(node)) visit(child)
  }

  visit(root)
  return rules.join('\n')
}

/** The three widths a carousel's "Image size" maps to. Width only: the height follows
 * from CAROUSEL_ASPECT_RATIO in carousel-strip.tsx, which every photo is cropped to. */
export const CAROUSEL_IMAGE_WIDTHS = { small: 140, medium: 240, large: 380 } as const

/** Default spacing between a carousel's photos when the block sets no `gap` of its own. */
export const CAROUSEL_DEFAULT_GAP = 12

/** The properties a carousel routes to its photos rather than to the box around them
 * - see carouselCssProps. */
const CAROUSEL_PHOTO_PROPS = new Set([
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'borderWidth',
  'borderStyle',
  'borderColor',
])

/** Splits a carousel's style between the box and the photos inside it. Rounding and
 * borders go to the photos, where they are visible; the rest stays on the box. */
export function carouselCssProps(style: BlockStyle): { box: CssProps; photo: CssProps } {
  const box: CssProps = {}
  const photo: CssProps = {}
  for (const [prop, value] of Object.entries({ ...coreCssProps(style), ...parseCustomCss(style.customCss) })) {
    if (CAROUSEL_PHOTO_PROPS.has(prop)) photo[prop] = value
    else box[prop] = value
  }
  return { box, photo }
}

function cssDeclarations(props: CssProps, important = true): string {
  return Object.entries(props)
    .map(([prop, value]) => `${camelToKebab(prop)}: ${value}${important ? ' !important' : ''}`)
    .join('; ')
}

export function containerCssProps(style: BlockStyle): CssProps {
  const props = { ...BORDER_BOX, ...coreCssProps(style) }
  if (style.columns !== undefined) {
    props.display = 'grid'
    props.gridTemplateColumns = `repeat(${style.columns}, minmax(0, 1fr))`
  } else {
    props.display = 'flex'
    props.flexDirection = style.direction === 'row' ? 'row' : 'column'
    if (style.wrap) props.flexWrap = 'wrap'
  }
  if (style.gap !== undefined) props.gap = `${style.gap}px`
  if (style.align) props.alignItems = ALIGN_MAP[style.align]
  if (style.justify) props.justifyContent = JUSTIFY_MAP[style.justify]
  return { ...props, ...parseCustomCss(style.customCss) }
}

export function imageCssProps(style: BlockStyle): CssProps {
  const props: CssProps = {
    ...BORDER_BOX,
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    objectFit: style.objectFit ?? 'cover',
    ...coreCssProps(style),
  }
  if (style.aspectRatio) props.aspectRatio = style.aspectRatio
  return { ...props, ...parseCustomCss(style.customCss) }
}

export function buttonCssProps(style: BlockStyle): CssProps {
  const props: CssProps = {
    ...BORDER_BOX,
    display: 'inline-block',
    textDecoration: 'none',
    cursor: 'pointer',
    ...coreCssProps(style),
  }
  if (style.alignSelf !== 'stretch' && props.width === undefined) props.width = 'fit-content'
  return { ...props, ...parseCustomCss(style.customCss) }
}

export const RESPONSIVE_BREAKPOINT_PX = 767

/** The same CSS-prop builder renderNode uses for a node type, so a `style.mobile`
 * override reaches the same fields as the base style - including layout-only ones like
 * `columns`. An unlisted type falls back to baseCssProps. */
function cssPropsForNodeType(type: BlockNode['type'], style: BlockStyle): CssProps {
  switch (type) {
    case 'container':
    case 'postListLoop':
      return containerCssProps(style)
    case 'image':
      return imageCssProps(style)
    case 'button':
      return buttonCssProps(style)
    default:
      return baseCssProps(style)
  }
}

/** Drops the baseline every block gets anyway, so a rule is not emitted for it alone. */
function withoutInlineBaseline(props: CssProps): CssProps {
  const rest = { ...props }
  for (const prop of Object.keys(BORDER_BOX)) delete rest[prop]
  return rest
}

/** One `@media (max-width: ...)` rule per block that sets `style.mobile`, for the same
 * reason buildHoverCss exists. The constructor's preview merges `style.mobile` into the
 * base style instead and does not use this. */
export function buildResponsiveCss(root: BlockNode): string {
  const rules: string[] = []

  function visit(node: BlockNode) {
    if (node.type === 'carousel' && node.style?.mobile) {
      const selector = `[data-node-id="${escapeAttrValue(node.id)}"]`
      const { box, photo } = carouselCssProps(node.style.mobile)
      const boxDeclarations = cssDeclarations(box)
      if (boxDeclarations) rules.push(`${selector} { ${boxDeclarations}; }`)
      const photoDeclarations = cssDeclarations(photo)
      if (photoDeclarations) rules.push(`${selector} img { ${photoDeclarations}; }`)
      for (const child of getChildren(node)) visit(child)
      return
    }
    if ('style' in node && node.style?.mobile) {
      const props = withoutInlineBaseline(cssPropsForNodeType(node.type, node.style.mobile))
      const declarations = Object.entries(props)
        .map(([prop, value]) => `${camelToKebab(prop)}: ${value} !important`)
        .join('; ')
      if (declarations) {
        rules.push(`[data-node-id="${escapeAttrValue(node.id)}"] { ${declarations}; }`)
      }
    }
    if (node.type === 'pagination' && node.activeStyle?.mobile) {
      const props = withoutInlineBaseline(baseCssProps(node.activeStyle.mobile))
      const declarations = Object.entries(props)
        .map(([prop, value]) => `${camelToKebab(prop)}: ${value} !important`)
        .join('; ')
      if (declarations) {
        rules.push(
          `[data-node-id="${escapeAttrValue(node.id)}"]:disabled, [data-node-id="${escapeAttrValue(node.id)}"][aria-current="page"] { ${declarations}; }`
        )
      }
    }
    for (const child of getChildren(node)) visit(child)
  }

  visit(root)
  if (rules.length === 0) return ''
  return `@media (max-width: ${RESPONSIVE_BREAKPOINT_PX}px) { ${rules.join('\n')} }`
}

/** CSS generic families, which must never be quoted: `font-family: "serif"` asks for a
 * font whose actual name is "serif" and finds nothing. */
const GENERIC_FONT_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'])

/** Renders a stored font-family as a valid CSS value. Custom families are quoted: an
 * unquoted one has to be a sequence of CSS identifiers, which a name like "Playfair
 * Display" is not. Generic keywords are left bare. */
export function cssFontFamily(family: string): string {
  return GENERIC_FONT_FAMILIES.has(family) ? family : `"${family}"`
}

const FONT_FORMAT_NAMES: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

/** One @font-face rule per custom font. The family and the URL are both validated
 * before they reach CSS text; an entry failing either is dropped. */
/** An absolute http(s) URL, or a root-relative path - never a protocol-relative
 * "//host" one. http is allowed because a font endpoint is plain http in local
 * development; the characters that could break out of `url("...")` are rejected either
 * way. */
function isSafeFontUrl(url: string): boolean {
  if (/["'()\\\s]/.test(url)) return false
  return /^https?:\/\/[^/]/.test(url) || /^\/[^/]/.test(url)
}

export function buildFontFaceCss(fonts: CustomFontRef[]): string {
  return fonts
    .filter((font) => /^[a-zA-Z0-9 _-]{1,60}$/.test(font.family) && isSafeFontUrl(font.url) && FONT_FORMAT_NAMES[font.format])
    .map((font) => `@font-face { font-family: "${font.family}"; src: url("${font.url}") format("${FONT_FORMAT_NAMES[font.format]}"); font-display: swap; }`)
    .join('\n')
}

/**
 * Styles for a post's rich body, scoped under `.pw-rich-content`. Post HTML is plain
 * semantic tags with no classes, so without this it renders as flat text.
 *
 * `list-style-type` and `display: list-item` are explicit because CSS resets commonly
 * clear them, which would hide every bullet in a post.
 */
export const RICH_CONTENT_CSS = `
.pw-rich-content { line-height: 1.65; font-size: 16px; }
.pw-rich-content h1, .pw-rich-content h2, .pw-rich-content h3 { font-weight: 700; line-height: 1.3; margin: 0.8em 0 0.3em; }
.pw-rich-content h1:first-child, .pw-rich-content h2:first-child, .pw-rich-content h3:first-child { margin-top: 0; }
.pw-rich-content h1 { font-size: 2em; }
.pw-rich-content h2 { font-size: 1.6em; }
.pw-rich-content h3 { font-size: 1.3em; }
.pw-rich-content p { margin: 0.8em 0; }
.pw-rich-content p:first-child { margin-top: 0; }
.pw-rich-content a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
.pw-rich-content ul, .pw-rich-content ol { margin: 0.8em 0; padding-left: 1.5em; }
.pw-rich-content ul { list-style-type: disc; }
.pw-rich-content ol { list-style-type: decimal; }
.pw-rich-content li { display: list-item; }
.pw-rich-content li p { margin: 0.2em 0; }
.pw-rich-content blockquote { margin: 0.8em 0; padding: 0.1em 0 0.1em 1em; border-left: 3px solid rgba(125,125,125,0.4); opacity: 0.85; font-style: italic; }
.pw-rich-content pre { margin: 0.8em 0; padding: 0.9em 1em; overflow-x: auto; border-radius: 8px; background: rgba(125,125,125,0.12); font-size: 0.875em; line-height: 1.5; }
.pw-rich-content pre code, .pw-rich-content code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.pw-rich-content :not(pre) > code { background: rgba(125,125,125,0.15); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.875em; }
.pw-rich-content hr { border: none; border-top: 1px solid rgba(125,125,125,0.3); margin: 1.5em 0; }
.pw-rich-content img { max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 0.8em 0; }
`.trim()
