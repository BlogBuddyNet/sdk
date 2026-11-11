'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

export interface ImageViewerProps {
  images: string[]
  startIndex: number
  altFor: (index: number) => string
  onClose: () => void
}

const SWIPE_DISTANCE = 48

export const IMAGE_VIEWER_CSS = `
.bbv-root{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:rgba(10,10,12,0.94);color:#fff;font-family:inherit;animation:bbv-fade .18s ease-out;-webkit-tap-highlight-color:transparent}
@supports (backdrop-filter:blur(1px)){.bbv-root{background:rgba(10,10,12,0.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}}
.bbv-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:max(14px,env(safe-area-inset-top)) 16px 10px}
.bbv-count{padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.1);font-size:13px;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.bbv-btn{display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,0.12);color:#fff;cursor:pointer;transition:background .15s,transform .15s}
.bbv-btn:hover{background:rgba(255,255,255,0.22)}
.bbv-btn:active{transform:scale(.94)}
.bbv-btn:focus-visible,.bbv-thumb:focus-visible{outline:2px solid #fff;outline-offset:2px}
.bbv-btn:disabled{opacity:.3;cursor:default}
.bbv-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px 84px;touch-action:pan-y}
.bbv-img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:14px;user-select:none;-webkit-user-drag:none;animation:bbv-in .26s cubic-bezier(.2,.8,.2,1)}
.bbv-nav{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px}
.bbv-nav:active{transform:translateY(-50%) scale(.94)}
.bbv-prev{left:18px}
.bbv-next{right:18px}
.bbv-thumbs{display:flex;gap:8px;justify-content:safe center;overflow-x:auto;padding:12px 16px max(16px,env(safe-area-inset-bottom));scrollbar-width:none}
.bbv-thumbs::-webkit-scrollbar{display:none}
.bbv-thumb{flex:0 0 auto;width:64px;height:48px;padding:0;border:0;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.08);cursor:pointer;opacity:.45;outline:2px solid transparent;outline-offset:2px;transition:opacity .15s,outline-color .15s}
.bbv-thumb:hover{opacity:.8}
.bbv-thumb[aria-current="true"]{opacity:1;outline-color:#fff}
.bbv-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.bbv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:640px){.bbv-stage{padding:4px 0}.bbv-img{border-radius:0}.bbv-nav{display:none}.bbv-thumb{width:48px;height:36px;border-radius:6px}}
@keyframes bbv-fade{from{opacity:0}to{opacity:1}}
@keyframes bbv-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.bbv-root,.bbv-img{animation:none}.bbv-btn,.bbv-thumb{transition:none}}
`

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function ImageViewer({ images, startIndex, altFor, onClose }: ImageViewerProps) {
  const [index, setIndex] = React.useState(() => Math.min(Math.max(startIndex, 0), images.length - 1))
  const rootRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const thumbsRef = React.useRef<HTMLDivElement>(null)
  const touchX = React.useRef<number | null>(null)
  const count = images.length
  const many = count > 1

  const go = React.useCallback(
    (step: number) => setIndex((current) => (current + step + count) % count),
    [count],
  )

  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowRight' && many) {
        event.preventDefault()
        go(1)
      } else if (event.key === 'ArrowLeft' && many) {
        event.preventDefault()
        go(-1)
      } else if (event.key === 'Tab' && rootRef.current) {
        const focusable = Array.from(
          rootRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'),
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, many, onClose])

  React.useEffect(() => {
    for (const neighbour of [index - 1, index + 1]) {
      const src = images[(neighbour + count) % count]
      if (src) new window.Image().src = src
    }
    const active = thumbsRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    active?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [index, images, count])

  if (typeof document === 'undefined' || count === 0) return null

  return createPortal(
    <div
      ref={rootRef}
      className="bbv-root"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <style>{IMAGE_VIEWER_CSS}</style>
      <div className="bbv-bar">
        <span className="bbv-count" aria-hidden="true">
          {index + 1} / {count}
        </span>
        <span className="bbv-sr" aria-live="polite">
          {`Photo ${index + 1} of ${count}`}
        </span>
        <button ref={closeRef} type="button" className="bbv-btn" aria-label="Close photo viewer" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div
        className="bbv-stage"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
        onTouchStart={(event) => {
          touchX.current = event.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(event) => {
          const start = touchX.current
          touchX.current = null
          const end = event.changedTouches[0]?.clientX
          if (start === null || end === undefined || !many) return
          const distance = end - start
          if (Math.abs(distance) >= SWIPE_DISTANCE) go(distance < 0 ? 1 : -1)
        }}
      >
        <img key={index} className="bbv-img" src={images[index]} alt={altFor(index)} draggable={false} />
        {many && (
          <>
            <button type="button" className="bbv-btn bbv-nav bbv-prev" aria-label="Previous photo" onClick={() => go(-1)}>
              <Chevron direction="left" />
            </button>
            <button type="button" className="bbv-btn bbv-nav bbv-next" aria-label="Next photo" onClick={() => go(1)}>
              <Chevron direction="right" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div ref={thumbsRef} className="bbv-thumbs" aria-label="All photos">
          {images.map((src, thumbIndex) => (
            <button
              key={`${src}-${thumbIndex}`}
              type="button"
              className="bbv-thumb"
              data-index={thumbIndex}
              aria-label={`Show photo ${thumbIndex + 1}`}
              aria-current={thumbIndex === index}
              onClick={() => setIndex(thumbIndex)}
            >
              <img src={src} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
