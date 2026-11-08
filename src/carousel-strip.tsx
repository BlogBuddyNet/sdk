'use client'

import * as React from 'react'
import type { CarouselNavigation } from './template-schema'
import type { CssProps } from './style-utils'

export interface CarouselStripProps {
  images: string[]
  imageWidth: number
  gap: number
  style: CssProps
  photoStyle: CssProps
  navigation: CarouselNavigation
  nodeId: string
  altPrefix: string
}

const ARROW_SIZE = 32

export const CAROUSEL_ASPECT_RATIO = '4 / 3'

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    ...(side === 'left' ? { left: 4 } : { right: 4 }),
    transform: 'translateY(-50%)',
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderRadius: 999,
    borderWidth: 0,
    borderStyle: 'none',
    background: 'rgba(17, 17, 17, 0.55)',
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 1,
    cursor: 'pointer',
    zIndex: 1,
  }
}

export function CarouselStrip({
  images,
  imageWidth,
  gap,
  style,
  photoStyle,
  navigation,
  nodeId,
  altPrefix,
}: CarouselStripProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)

  const scrollByOne = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * (imageWidth + gap), behavior: 'smooth' })
  }

  if (images.length === 0) return null

  return (
    <div
      data-node-id={nodeId}
      style={{
        minWidth: 0,
        maxWidth: '100%',
        ...(style as React.CSSProperties),
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
      }}
    >
      <div
        ref={scrollerRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: navigation === 'scroll' ? 'thin' : 'none',
          alignItems: 'flex-start',
        }}
      >
        {images.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`${altPrefix}photo ${index + 1} of ${images.length}`}
            loading="lazy"
            style={{
              flex: '0 0 auto',
              width: imageWidth,
              aspectRatio: CAROUSEL_ASPECT_RATIO,
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
              scrollSnapAlign: 'start',
              ...(photoStyle as React.CSSProperties),
            }}
          />
        ))}
      </div>
      {navigation === 'arrows' && images.length > 1 && (
        <>
          <button type="button" aria-label="Previous photo" onClick={() => scrollByOne(-1)} style={arrowStyle('left')}>
            {'‹'}
          </button>
          <button type="button" aria-label="Next photo" onClick={() => scrollByOne(1)} style={arrowStyle('right')}>
            {'›'}
          </button>
        </>
      )}
    </div>
  )
}
