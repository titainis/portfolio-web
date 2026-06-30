import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { lenisStore } from '../cinematic/lenisStore'

/**
 * Premium "theater" video popup with a Hero (shared-element) transition.
 *
 * The clicked thumbnail visually lifts out of the page: a single fixed leaf
 * element starts perfectly aligned over the thumbnail's bounding rect, then
 * tweens its geometry (position, size, border-radius, box-shadow) to a centered
 * floating window occupying ~78% of the viewport. A dark, blurred backdrop
 * fades in behind it; the page stays visible. Closing reverses the exact same
 * tween back into the thumbnail.
 *
 * The expand/collapse is driven imperatively: we commit the start frame, force
 * one synchronous reflow to lock it in as the transition baseline, then write
 * the target styles. This makes the trigger independent of requestAnimationFrame
 * timing (which can be throttled), so the animation always runs.
 *
 * Because the popup is a position: fixed leaf with no siblings to push around,
 * animating its own geometry reflows nothing else on the page. will-change +
 * a promoted compositing layer keep it on the GPU at 60fps.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DURATION = 520 // ms — weighty, not snappy (spec: 450–550ms)
const CONTROLS_FADE = 150 // ms

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

interface Frame {
  geom: Geometry
  radius: number
  shadow: string
  backdrop: number
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
 * popup edge-to-edge — no letterbox bars / "edges" around it.
 */
function computeTargetGeometry(aspect: number): Geometry {
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

  const containerRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const timers = useRef<number[]>([])
  const closingRef = useRef(false)

  // The video's aspect ratio. Seeded from the already-loaded thumbnail video so
  // the popup is sized to the real ratio from the very first frame (no bars),
  // and refined from the popup's own metadata if the thumbnail wasn't ready.
  const aspectRef = useRef(16 / 9)

  const [controlsReady, setControlsReady] = useState(false)

  const startFrame = (): Frame => ({
    geom: rectToGeometry(originEl.getBoundingClientRect()),
    radius: START_RADIUS,
    shadow: START_SHADOW,
    backdrop: 0,
  })
  const openFrame = (): Frame => ({
    geom: computeTargetGeometry(aspectRef.current),
    radius: OPEN_RADIUS,
    shadow: OPEN_SHADOW,
    backdrop: 1,
  })

  const applyFrame = (frame: Frame) => {
    const el = containerRef.current
    const bd = backdropRef.current
    if (!el || !bd) return
    el.style.top = `${frame.geom.top}px`
    el.style.left = `${frame.geom.left}px`
    el.style.width = `${frame.geom.width}px`
    el.style.height = `${frame.geom.height}px`
    el.style.borderRadius = `${frame.radius}px`
    el.style.boxShadow = frame.shadow
    bd.style.opacity = String(frame.backdrop)
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
        `top ${duration}ms ${EASE}`,
        `left ${duration}ms ${EASE}`,
        `width ${duration}ms ${EASE}`,
        `height ${duration}ms ${EASE}`,
        `border-radius ${duration}ms ${EASE}`,
        `box-shadow ${duration}ms ${EASE}`,
      ].join(', ')

  // ---- Open: commit the origin frame, lock it in, then expand to target. ----
  useLayoutEffect(() => {
    lenisStore.stop()
    document.body.style.overflow = 'hidden'

    // Seed the aspect ratio from the thumbnail video (same src, already loaded)
    // so the popup expands to the exact video shape with no letterbox bars.
    const originVideo = originEl.querySelector('video')
    if (originVideo?.videoWidth && originVideo.videoHeight) {
      aspectRef.current = originVideo.videoWidth / originVideo.videoHeight
    }

    // Commit the origin frame with transitions OFF so it can't animate in from
    // the element's initial corner position.
    const el = containerRef.current
    if (el) el.style.transition = 'none'
    applyFrame(startFrame())
    // Force a reflow so the start frame is the transition's baseline, then
    // re-enable transitions and write the target — the browser interpolates.
    void el?.offsetWidth
    if (el) el.style.transition = transition
    applyFrame(openFrame())

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

    closeBtnRef.current?.focus()

    // Fallback: if the thumbnail metadata wasn't available, re-fit the popup to
    // the true ratio once the popup video reports its dimensions.
    const video = videoRef.current
    const onMeta = () => {
      if (!video?.videoWidth || !video.videoHeight) return
      aspectRef.current = video.videoWidth / video.videoHeight
      if (closingRef.current) return
      // Snap to the corrected geometry without animating (the open tween already
      // ran with the thumbnail's ratio — this is a silent correction).
      if (el) el.style.transition = 'none'
      applyFrame(openFrame())
      void el?.offsetWidth
      if (el) el.style.transition = transition
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
      if (!closingRef.current) applyFrame(openFrame())
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
    applyFrame(startFrame())
    schedule(onClose, duration + 20)
  }

  // ---- Keyboard: Escape closes, Tab is trapped within the popup. ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        beginClose()
        return
      }
      if (e.key !== 'Tab') return

      const root = containerRef.current
      if (!root) return
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], video, input, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
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
    >
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

      {/* The shared-element popup. Clicks inside don't close it. */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          borderRadius: START_RADIUS,
          overflow: 'hidden',
          background: '#000',
          isolation: 'isolate',
          transition,
          willChange: 'transform, opacity',
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

        {/* Close affordance — fades in with the controls. */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={beginClose}
          aria-label="Close video"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-[opacity,background-color] hover:bg-black/60"
          style={{
            opacity: controlsReady ? 1 : 0,
            transitionDuration: `${CONTROLS_FADE}ms`,
            pointerEvents: controlsReady ? 'auto' : 'none',
          }}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body,
  )
}
