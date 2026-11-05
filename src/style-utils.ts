import type { BlockNode, BlockStyle, CarouselNode, CustomFontRef } from './template-schema'
import { CUSTOM_CSS_BLOCK_PATTERN, CUSTOM_CSS_CONDITION_PATTERN } from './template-schema'
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

export interface CustomCssBlock {
  condition: string
  props: CssProps
}

export function parseCustomCssBlocks(customCss?: string): CustomCssBlock[] {
  if (!customCss) return []
  const blocks: CustomCssBlock[] = []
  const pattern = new RegExp(CUSTOM_CSS_BLOCK_PATTERN.source, 'gi')
  let match = pattern.exec(customCss)
  while (match) {
    const condition = match[1].trim()
    if (CUSTOM_CSS_CONDITION_PATTERN.test(condition)) {
      const props = parseDeclarations(match[2])
      if (Object.keys(props).length > 0) blocks.push({ condition, props })
    }
    match = pattern.exec(customCss)
  }
  return blocks
}

export function parseCustomCss(customCss?: string): CssProps {
  if (!customCss) return {}
  return parseDeclarations(customCss.replace(new RegExp(CUSTOM_CSS_BLOCK_PATTERN.source, 'gi'), ''))
}

function parseDeclarations(source: string): CssProps {
  const props: CssProps = {}
  for (const declaration of source.split(';')) {
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
  if (style.lineClamp === 1) {
    props.whiteSpace = 'nowrap'
    props.textOverflow = 'ellipsis'
    props.overflow = 'hidden'
  } else if (style.lineClamp !== undefined) {
    props.display = '-webkit-box'
    props.WebkitLineClamp = style.lineClamp
    props.WebkitBoxOrient = 'vertical'
    props.overflow = 'hidden'
  }
  return props
}

const SHORTHAND_LONGHANDS: Record<string, readonly string[]> = {
  background: [
    'backgroundColor',
    'backgroundImage',
    'backgroundPosition',
    'backgroundSize',
    'backgroundRepeat',
    'backgroundAttachment',
    'backgroundClip',
    'backgroundOrigin',
  ],
  font: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight'],
  border: ['borderWidth', 'borderStyle', 'borderColor'],
  borderRadius: [
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomRightRadius',
    'borderBottomLeftRadius',
  ],
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  flex: ['flexGrow', 'flexShrink', 'flexBasis'],
  overflow: ['overflowX', 'overflowY'],
  gap: ['rowGap', 'columnGap'],
  textDecoration: ['textDecorationLine', 'textDecorationColor', 'textDecorationStyle'],
  inset: ['top', 'right', 'bottom', 'left'],
}

export function mergeCustomCss(generated: CssProps, custom: CssProps): CssProps {
  const merged: CssProps = { ...generated }
  for (const property of Object.keys(custom)) {
    for (const longhand of SHORTHAND_LONGHANDS[property] ?? []) delete merged[longhand]
  }
  return { ...merged, ...custom }
}

export function customCssCovers(custom: CssProps): Set<string> {
  const covered = new Set<string>(Object.keys(custom))
  for (const property of Object.keys(custom)) {
    for (const longhand of SHORTHAND_LONGHANDS[property] ?? []) covered.add(longhand)
  }
  return covered
}

export const BORDER_BOX: CssProps = { boxSizing: 'border-box' }

export function baseCssProps(style: BlockStyle): CssProps {
  return mergeCustomCss({ ...BORDER_BOX, ...coreCssProps(style) }, parseCustomCss(style.customCss))
}

export function camelToKebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function escapeAttrValue(value: string): string {
  return value.replace(/["\\]/g, '\\$&')
}

const STATE_TRANSITION =
  'transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;'

const STATES = [
  { key: 'hover', pseudos: [':hover'] },
  { key: 'focus', pseudos: [':active', ':focus-visible', ':has(:focus-visible)'] },
] as const

const WRAPPED_PRESS_PSEUDOS = [':active', ':has(:focus-visible)'] as const

export function buildStateCss(root: BlockNode): string {
  const rules: string[] = []

  function visit(node: BlockNode) {
    for (const { key, pseudos } of STATES) {
      if (node.type === 'carousel') {
        const base = `[data-node-id="${escapeAttrValue(node.id)}"]`
        const state = node.style?.[key]
        if (state) {
          const matched = pseudos.map((pseudo) => `${base}${pseudo}`)
          const { box, photo } = carouselCssProps(state, node.photoStyle && {})
          const boxDeclarations = cssDeclarations(box)
          if (boxDeclarations) {
            rules.push(`${matched.join(', ')} { ${boxDeclarations}; ${STATE_TRANSITION} }`)
          }
          const photoDeclarations = cssDeclarations(photo)
          if (photoDeclarations) {
            rules.push(
              `${matched.map((selector) => `${selector} img`).join(', ')} { ${photoDeclarations}; ${STATE_TRANSITION} }`
            )
          }
        }
        const photoState = node.photoStyle?.[key]
        const photoStateDeclarations = photoState ? cssDeclarations(carouselPhotoCssProps(photoState)) : ''
        if (photoStateDeclarations) {
          rules.push(
            `${pseudos.map((pseudo) => `${base} img${pseudo}`).join(', ')} { ${photoStateDeclarations}; ${STATE_TRANSITION} }`
          )
        }
        continue
      }

      const state = 'style' in node ? node.style?.[key] : undefined
      if (!state) continue

      const props = mergeCustomCss(coreCssProps(state), parseCustomCss(state.customCss))
      const declarations = Object.entries(props)
        .map(([prop, value]) => `${camelToKebab(prop)}: ${value} !important`)
        .join('; ')
      if (!declarations) continue

      const selectors =
        node.type === 'pagination'
          ? [
              `button[data-node-id="${escapeAttrValue(node.id)}"]:not(:disabled)`,
              `a[data-node-id="${escapeAttrValue(node.id)}"]:not([aria-current="page"])`,
            ]
          : [`[data-node-id="${escapeAttrValue(node.id)}"]`]
      const matched = selectors.flatMap((selector) =>
        pseudos.map((pseudo) => `${selector}${pseudo}`)
      )
      if (key === 'focus' && node.type !== 'container' && 'clickAction' in node && node.clickAction) {
        const wrapper = `[data-click-wrap="${escapeAttrValue(node.id)}"]`
        const block = `[data-node-id="${escapeAttrValue(node.id)}"]`
        for (const pseudo of WRAPPED_PRESS_PSEUDOS) {
          matched.push(`${wrapper}${pseudo} > ${block}`)
        }
      }
      rules.push(`${matched.join(', ')} { ${declarations}; ${STATE_TRANSITION} }`)
    }
    for (const child of getChildren(node)) visit(child)
  }

  visit(root)
  return rules.join('\n')
}

export const CAROUSEL_IMAGE_WIDTHS = { small: 140, medium: 240, large: 380 } as const

export const CAROUSEL_DEFAULT_GAP = 12

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

export function carouselCssProps(style: BlockStyle, photoStyle?: BlockStyle): { box: CssProps; photo: CssProps } {
  const all = mergeCustomCss(coreCssProps(style), parseCustomCss(style.customCss))
  if (photoStyle) return { box: all, photo: carouselPhotoCssProps(photoStyle) }
  const box: CssProps = {}
  const photo: CssProps = {}
  for (const [prop, value] of Object.entries(all)) {
    if (CAROUSEL_PHOTO_PROPS.has(prop)) photo[prop] = value
    else box[prop] = value
  }
  return { box, photo }
}

export function carouselPhotoCssProps(style: BlockStyle): CssProps {
  const props = coreCssProps(style)
  if (style.aspectRatio) props.aspectRatio = style.aspectRatio
  if (style.objectFit) props.objectFit = style.objectFit
  return mergeCustomCss(props, parseCustomCss(style.customCss))
}

const LEGACY_CAROUSEL_PHOTO_KEYS = [
  'borderRadius',
  'borderRadiusTopLeft',
  'borderRadiusTopRight',
  'borderRadiusBottomRight',
  'borderRadiusBottomLeft',
  'borderWidth',
  'borderColor',
  'borderColorOpacity',
] as const

function splitLegacyCarouselState(style: BlockStyle): { box: BlockStyle; photo: BlockStyle } {
  const box: BlockStyle = { ...style }
  const photo: BlockStyle = {}
  for (const key of LEGACY_CAROUSEL_PHOTO_KEYS) {
    if (style[key] === undefined) continue
    ;(photo as Record<string, unknown>)[key] = style[key]
    delete box[key]
  }
  return { box, photo }
}

export function withCarouselPhotoStyle(node: CarouselNode): CarouselNode {
  if (node.photoStyle) return node
  const { hover, focus, ...rest } = node.style
  const main = splitLegacyCarouselState(rest)
  const style: BlockStyle = { ...main.box }
  const photoStyle: BlockStyle = { ...main.photo }
  if (hover) {
    const split = splitLegacyCarouselState(hover)
    style.hover = split.box
    if (Object.keys(split.photo).length > 0) photoStyle.hover = split.photo
  }
  if (focus) {
    const split = splitLegacyCarouselState(focus)
    style.focus = split.box
    if (Object.keys(split.photo).length > 0) photoStyle.focus = split.photo
  }
  return { ...node, style, photoStyle }
}

function cssDeclarations(props: CssProps, important = true): string {
  return Object.entries(props)
    .map(([prop, value]) => `${camelToKebab(prop)}: ${value}${important ? ' !important' : ''}`)
    .join('; ')
}

export const COLUMN_MIN_PX = 260

export function columnTracks(columns: number, gap: number): string {
  const share = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`
  return `repeat(auto-fit, minmax(max(min(100%, ${COLUMN_MIN_PX}px), ${share}), 1fr))`
}

export function containerCssProps(style: BlockStyle): CssProps {
  const props = { ...BORDER_BOX, ...coreCssProps(style) }
  if (style.columns !== undefined) {
    props.display = 'grid'
    props.gridTemplateColumns = columnTracks(style.columns, style.gap ?? 0)
  } else {
    props.display = 'flex'
    props.flexDirection = style.direction === 'row' ? 'row' : 'column'
    if (style.wrap) props.flexWrap = 'wrap'
  }
  if (style.gap !== undefined) props.gap = `${style.gap}px`
  if (style.align) props.alignItems = ALIGN_MAP[style.align]
  if (style.justify) props.justifyContent = JUSTIFY_MAP[style.justify]
  return mergeCustomCss(props, parseCustomCss(style.customCss))
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
  return mergeCustomCss(props, parseCustomCss(style.customCss))
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
  return mergeCustomCss(props, parseCustomCss(style.customCss))
}

export function blockCssText(node: BlockNode): string {
  if (!('style' in node) || !node.style) return ''
  const style = node.style
  const props =
    node.type === 'container' || node.type === 'postListLoop'
      ? containerCssProps(style)
      : node.type === 'image'
        ? imageCssProps(style)
        : node.type === 'button'
          ? buttonCssProps(style)
          : node.type === 'carousel'
            ? carouselCssProps(style, node.photoStyle).box
            : baseCssProps(style)
  const covered = customCssCovers(parseCustomCss(style.customCss))
  return Object.entries(props)
    .filter(([prop]) => !covered.has(prop))
    .map(([prop, value]) => `${camelToKebab(prop)}: ${value};`)
    .join('\n')
}

export function formatCssText(css: string): string {
  if (!css.trim()) return ''

  const blocks: string[] = []
  const flat = css.replace(new RegExp(CUSTOM_CSS_BLOCK_PATTERN.source, 'gi'), (_match, condition: string, body: string) => {
    const declarations = body
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => `  ${declaration};`)
    blocks.push(`@container ${condition.trim()} {\n${declarations.join('\n')}\n}`)
    return ''
  })

  const lines = flat
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => `${declaration};`)

  return [...lines, ...blocks].join('\n')
}

export interface CssEdit {
  customCss: string | undefined
  clear: string[]
}

function splitDocument(css: string): { props: Map<string, string>; blocks: string[] } {
  const blocks: string[] = []
  const flat = css.replace(new RegExp(CUSTOM_CSS_BLOCK_PATTERN.source, 'gi'), (match) => {
    blocks.push(match.trim())
    return ''
  })
  const props = new Map<string, string>()
  for (const declaration of flat.split(/[;\n]/)) {
    const at = declaration.indexOf(':')
    if (at === -1) continue
    const property = declaration.slice(0, at).trim()
    const value = declaration.slice(at + 1).replace(/;\s*$/, '').trim()
    if (property && value) props.set(property, value)
  }
  return { props, blocks }
}

function styleKeysOwning(node: BlockNode, property: string): string[] {
  if (!('style' in node) || !node.style) return []
  const base = { ...node.style, customCss: undefined }
  const without = (key: string) => {
    const style: Record<string, unknown> = { ...base }
    delete style[key]
    return splitDocument(blockCssText({ ...node, style } as BlockNode)).props.has(property)
  }
  return Object.keys(base)
    .filter((key) => key !== 'customCss' && key !== 'hover' && key !== 'focus')
    .filter((key) => !without(key))
}

export function cssEditFor(node: BlockNode, edited: string): CssEdit {
  const generated = splitDocument(blockCssText(node)).props
  const { props, blocks } = splitDocument(edited)

  const kept: string[] = []
  props.forEach((value, property) => {
    if (generated.get(property) === value) return
    kept.push(`${property}: ${value};`)
  })

  const clear: string[] = []
  generated.forEach((_value, property) => {
    if (props.has(property)) return
    for (const key of styleKeysOwning(node, property)) {
      if (!clear.includes(key)) clear.push(key)
    }
  })

  const text = [...kept, ...blocks].join('\n').trim()
  return { customCss: text || undefined, clear }
}

export function changedCssProps(node: BlockNode, before: BlockStyle, after: BlockStyle): string[] {
  const read = (style: BlockStyle) =>
    parseDeclarations(blockCssText({ ...node, style } as BlockNode))
  const from = read(before)
  const to = read(after)
  const names = Array.from(new Set(Object.keys(from).concat(Object.keys(to))))
  return names.filter((name) => from[name] !== to[name]).map(camelToKebab)
}

export function dropDeclarations(customCss: string | undefined, properties: string[]): string | undefined {
  if (!customCss) return customCss
  const unwanted = new Set(properties)
  const blocks: string[] = []
  const flat = customCss.replace(new RegExp(CUSTOM_CSS_BLOCK_PATTERN.source, 'gi'), (match) => {
    blocks.push(match.trim())
    return ''
  })
  const kept = flat
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => {
      const at = declaration.indexOf(':')
      if (at === -1) return false
      return !unwanted.has(declaration.slice(0, at).trim())
    })
    .map((declaration) => `${declaration};`)
  const text = [...kept, ...blocks].join('\n').trim()
  return text || undefined
}

export const RESPONSIVE_CONTAINER_NAME = 'blogbuddy'

export const RESPONSIVE_BREAKPOINT_PX = 560

export function buildResponsiveCss(root: BlockNode): string {
  const rules: string[] = []

  function visit(node: BlockNode) {
    if ('style' in node && node.style?.customCss) {
      const selector = `[data-node-id="${escapeAttrValue(node.id)}"]`
      for (const block of parseCustomCssBlocks(node.style.customCss)) {
        const declarations = cssDeclarations(block.props)
        if (!declarations) continue
        rules.push(
          `@container ${RESPONSIVE_CONTAINER_NAME} ${block.condition} { ${selector} { ${declarations}; } }`
        )
      }
    }
    for (const child of getChildren(node)) visit(child)
  }

  visit(root)
  return rules.join('\n')
}

const GENERIC_FONT_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'])

export function cssFontFamily(family: string): string {
  return GENERIC_FONT_FAMILIES.has(family) ? family : `"${family}"`
}

const FONT_FORMAT_NAMES: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

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
