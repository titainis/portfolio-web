import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { lenisStore } from '../cinematic/lenisStore'

/**
 * Premium "theater" video popup with a Hero (shared-element) transition.
 *
 * The clicked thumbnail visually lifts out of the page: a single fixed leaf
 * element starts perfectly aligned over the thumbnail's bounding rect, then
 * tweens into a centered floating window occupying ~78% of the viewport. A
 * dark, blurred backdrop fades in behind it; the page stays visible. Closing
 * reverses the exact same tween back into the thumbnail.
 *
 * The container's real box (top/left/width/height) is set ONCE, to the final
 * open geometry, and never transitions — only `transform` (translate + scale)
 * animates, which is GPU-composited. Animating top/left/width/height directly
 * forces a synchronous layout recalculation on every frame; at this element's
 * size that reads as visible stutter no matter how good the easing curve is.
 * This is the classic FLIP technique: fake the "grow from the thumbnail" look
 * by scaling a full-size box down to the thumbnail's rect, then transitioning
 * that transform back to identity.
 *
 * The expand/collapse is driven imperatively: we commit the start transform,
 * force one synchronous reflow to lock it in as the transition baseline, then
 * write the target transform. This makes the trigger independent of
 * requestAnimationFrame timing (which can be throttled), so the animation
 * always runs.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DURATION = 520 // ms — weighty, not snappy (spec: 450–550ms)
const CONTROLS_FADE = 150 // ms
// Same per-frame lerp factor as the fixed nav's cursor-follow "SCROLL" hint
// (CursorScroll.tsx) — the custom cursor trails the pointer with a soft lag
// instead of snapping to it 1:1.
const CURSOR_LAG = 0.03

const OPEN_RADIUS = 24
const START_RADIUS = 16

const OPEN_SHADOW =
  '0 40px 120px -24px rgba(0,0,0,0.78), 0 16px 48px -16px rgba(0,0,0,0.55)'
const START_SHADOW = '0 18px 40px -22px rgba(0,0,0,0.45)'

interface Geometry {
  top: number
  left: number
  width: number
  height: number
}

interface VideoLightboxProps {
  src: string
  /** The thumbnail element the popup grows from / returns into. */
  originEl: HTMLElement
  onClose: () => void
}

function rectToGeometry(rect: DOMRect): Geometry {
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
}

/**
 * A centered box matching the video's own aspect ratio, fitted within ~78% of
 * the viewport with margins. Sizing to the real ratio means the video fills the
 * popup edge-to-edge — no letterbox bars / "edges" around it. This box is the
 * container's one-time, never-animated real geometry.
 */
function computeOpenGeometry(aspect: number): Geometry {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxW = vw * 0.78
  const maxH = vh * 0.78

  let width = maxW
  let height = width / aspect
  if (height > maxH) {
    height = maxH
    width = height * aspect
  }

  return {
    width,
    height,
    left: (vw - width) / 2,
    top: (vh - height) / 2,
  }
}

export default function VideoLightbox({
  src,
  originEl,
  onClose,
}: VideoLightboxProps) {
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current
  const duration = prefersReduced ? 0 : DURATION

  const [hasFinePointer] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorTarget = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })
  const timers = useRef<number[]>([])
  const closingRef = useRef(false)

  // The video's aspect ratio. Seeded from the already-loaded thumbnail video so
  // the popup is sized to the real ratio from the very first frame (no bars),
  // and refined from the popup's own metadata if the thumbnail wasn't ready.
  const aspectRef = useRef(16 / 9)
  // The container's fixed, never-animated real box — set once on open. Every
  // transform below is expressed relative to this rect.
  const openGeomRef = useRef<Geometry>({ top: 0, left: 0, width: 0, height: 0 })

  const [controlsReady, setControlsReady] = useState(false)

  const applyTransform = (
    rect: Geometry,
    radius: number,
    shadow: string,
    backdrop: number,
  ) => {
    const el = containerRef.current
    const bd = backdropRef.current
    if (!el || !bd) return
    const open = openGeomRef.current
    const scaleX = rect.width / open.width
    const scaleY = rect.height / open.height
    const tx = rect.left - open.left
    const ty = rect.top - open.top
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY})`
    el.style.borderRadius = `${radius}px`
    el.style.boxShadow = shadow
    bd.style.opacity = String(backdrop)
  }

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const transition = prefersReduced
    ? 'none'
    : [
        `transform ${duration}ms ${EASE}`,
        `border-radius ${duration}ms ${EASE}`,
        `box-shadow ${duration}ms ${EASE}`,
      ].join(', ')

  // ---- Open: commit the origin transform, lock it in, then expand. ----
  useLayoutEffect(() => {
    lenisStore.stop()
    document.body.style.overflow = 'hidden'

    // Seed the aspect ratio from the thumbnail video (same src, already loaded)
    // so the popup expands to the exact video shape with no letterbox bars.
    const originVideo = originEl.querySelector('video')
    if (originVideo?.videoWidth && originVideo.videoHeight) {
      aspectRef.current = originVideo.videoWidth / originVideo.videoHeight
    }

    // Fix the container's real box ONCE, to the target geometry. It never
    // transitions again — everything below animates via `transform` only.
    const open = computeOpenGeometry(aspectRef.current)
    openGeomRef.current = open
    const el = containerRef.current
    if (el) {
      el.style.top = `${open.top}px`
      el.style.left = `${open.left}px`
      el.style.width = `${open.width}px`
      el.style.height = `${open.height}px`
    }

    // Commit the origin transform with transitions OFF so it can't animate in
    // from the identity transform.
    const originRect = rectToGeometry(originEl.getBoundingClientRect())
    if (el) el.style.transition = 'none'
    applyTransform(originRect, START_RADIUS, START_SHADOW, 0)
    // Force a reflow so the start transform is the transition's baseline, then
    // re-enable transitions and write the target — the browser interpolates.
    void el?.offsetWidth
    if (el) el.style.transition = transition
    applyTransform(open, OPEN_RADIUS, OPEN_SHADOW, 1)

    // After the expand settles: fade controls in, then begin playback.
    schedule(() => {
      if (closingRef.current) return
      setControlsReady(true)
      schedule(() => {
        const v = videoRef.current
        if (!v) return
        v.play().catch(() => {
          // Unmuted autoplay can be blocked. With no native controls there is
          // no manual fallback, so mute and retry to guarantee playback.
          v.muted = true
          v.play().catch(() => {})
        })
      }, prefersReduced ? 0 : CONTROLS_FADE)
    }, duration + 20)

    containerRef.current?.focus()

    // Fallback: if the thumbnail metadata wasn't available, re-fit the popup to
    // the true ratio once the popup video reports its dimensions.
    const video = videoRef.current
    const onMeta = () => {
      if (!video?.videoWidth || !video.videoHeight) return
      aspectRef.current = video.videoWidth / video.videoHeight
      if (closingRef.current) return
      // Snap to the corrected geometry without animating (the open tween already
      // ran with the thumbnail's ratio — this is a silent correction).
      const corrected = computeOpenGeometry(aspectRef.current)
      openGeomRef.current = corrected
      const c = containerRef.current
      if (c) {
        c.style.transition = 'none'
        c.style.top = `${corrected.top}px`
        c.style.left = `${corrected.left}px`
        c.style.width = `${corrected.width}px`
        c.style.height = `${corrected.height}px`
      }
      applyTransform(corrected, OPEN_RADIUS, OPEN_SHADOW, 1)
      void c?.offsetWidth
      if (c) c.style.transition = transition
    }
    video?.addEventListener('loadedmetadata', onMeta)

    return () => {
      video?.removeEventListener('loadedmetadata', onMeta)
      clearTimers()
      lenisStore.start()
      document.body.style.overflow = ''
      // Return keyboard focus to the thumbnail that opened the popup.
      originEl.focus?.()
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the centered target accurate if the viewport changes while open.
  useEffect(() => {
    const onResize = () => {
      if (closingRef.current) return
      const open = computeOpenGeometry(aspectRef.current)
      openGeomRef.current = open
      const el = containerRef.current
      if (el) {
        el.style.transition = 'none'
        el.style.top = `${open.top}px`
        el.style.left = `${open.left}px`
        el.style.width = `${open.width}px`
        el.style.height = `${open.height}px`
      }
      applyTransform(open, OPEN_RADIUS, OPEN_SHADOW, 1)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const beginClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    setControlsReady(false)
    clearTimers()
    videoRef.current?.pause()
    // Reverse the tween back into the (re-measured) thumbnail rect.
    applyTransform(
      rectToGeometry(originEl.getBoundingClientRect()),
      START_RADIUS,
      START_SHADOW,
      0,
    )
    schedule(onClose, duration + 20)
  }

  // ---- Cursor-follow close affordance. Replaces a corner button: the video
  // fills the popup edge-to-edge, so clicking ANYWHERE closes it, and the
  // custom cursor is the only affordance needed to communicate that. Skipped
  // on touch devices, where there's no cursor to follow and tapping already
  // closes via the dialog's own click handler. Trails the pointer with the
  // same soft per-frame lerp as the nav's cursor-follow "SCROLL" hint, rather
  // than snapping to it — a hard 1:1 follow reads as jittery next to that. ----
  useEffect(() => {
    if (!hasFinePointer || prefersReduced) return
    cursorTarget.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    cursorPos.current = { ...cursorTarget.current }

    const onMove = (e: MouseEvent) => {
      cursorTarget.current.x = e.clientX
      cursorTarget.current.y = e.clientY
    }

    let raf: number
    const tick = () => {
      cursorPos.current.x += (cursorTarget.current.x - cursorPos.current.x) * CURSOR_LAG
      cursorPos.current.y += (cursorTarget.current.y - cursorPos.current.y) * CURSOR_LAG
      const el = cursorRef.current
      if (el) {
        el.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [hasFinePointer, prefersReduced])

  // ---- Keyboard: Escape closes. ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        beginClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-label="Video player"
      onClick={beginClose}
      style={{ cursor: hasFinePointer && !prefersReduced ? 'none' : 'pointer' }}
    >
      <span className="sr-only">Click anywhere, or press Escape, to close.</span>

      {/* Dark, blurred backdrop — page stays visible behind it. */}
      <div
        ref={backdropRef}
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'rgba(4, 8, 16, 0.62)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          opacity: 0,
          transition: prefersReduced ? 'none' : `opacity ${duration}ms ${EASE}`,
          willChange: 'opacity',
        }}
      />

      {/* The shared-element popup. Real box set once on open; everything else
          animates via transform only (GPU-composited — no layout thrash). */}
      <div
        ref={containerRef}
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          borderRadius: START_RADIUS,
          overflow: 'hidden',
          background: '#000',
          isolation: 'isolate',
          transformOrigin: 'top left',
          transition,
          willChange: 'transform',
          outline: 'none',
        }}
      >
        {/* Opaque black fill — prevents any backdrop-filter glow from compositing
            boundaries bleeding through the letterbox areas, even at sub-pixel edges. */}
        <div className="absolute inset-0 bg-black" aria-hidden />
        <video
          ref={videoRef}
          src={src}
          loop
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          tabIndex={-1}
          className="relative block h-full w-full object-fill"
          style={{ background: '#000', outline: 'none' }}
        />
      </div>

      {/* Cursor-follow close affordance — an "X" that tracks the pointer in
          place of the native cursor. Clicking anywhere closes the popup. */}
      {hasFinePointer && !prefersReduced && (
        <div
          ref={cursorRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[210] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-lg text-white backdrop-blur-md will-change-transform"
          style={{
            opacity: controlsReady ? 1 : 0,
            transitionProperty: 'opacity',
            transitionDuration: `${CONTROLS_FADE}ms`,
          }}
        >
          ✕
        </div>
      )}
    </div>,
    document.body,
  )
}
