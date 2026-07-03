import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CameraLayers from './CameraLayers'
import AboutSection from '../components/AboutSection'
import WorkSection from '../components/WorkSection'
import ContactSection from '../components/ContactSection'
import { useLenis } from './useLenis'
import { useScrollProgress } from './useScrollProgress'
import { useMouseParallax } from './useMouseParallax'
import { buildCameraTimeline } from './scrollTimelines'

interface CinematicScrollLayerProps {
  children?: ReactNode
}

export default function CinematicScrollLayer({ children }: CinematicScrollLayerProps) {
  // Smooth-scroll engine + single source of truth for scroll progress.
  useLenis()
  const { report } = useScrollProgress()

  const landscapeRef = useRef<HTMLDivElement>(null)
  const hazeRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)

  // Subtle cursor-driven perspective on the fixed camera layers. Writes only
  // x/y/rotationX/rotationY, so it composes with — never overrides — the
  // scroll-driven scale/yPercent on the same elements.
  useMouseParallax(landscapeRef, trainRef)

  useEffect(() => {
    const landscape = landscapeRef.current
    const haze = hazeRef.current
    const train = trainRef.current
    const overlay = overlayRef.current
    const spacer = spacerRef.current
    if (!landscape || !haze || !train || !overlay || !spacer) {
      return
    }

    const ctx = gsap.context(() => {
      buildCameraTimeline({ spacer, landscape, haze, train, overlay }, report)
    })

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => ctx.revert()
  }, [report])

  return (
    <>
      {/* PHASE 1 — independent fixed camera layers (bg / haze / fg) */}
      <CameraLayers
        landscapeRef={landscapeRef}
        hazeRef={hazeRef}
        trainRef={trainRef}
      />

      {/* Fixed navbar + hero overlay — scroll-revealed, structurally untouched */}
      <div
        ref={overlayRef}
        className="cinematic-ui-overlay"
        style={{ opacity: 0, visibility: 'hidden', pointerEvents: 'none' }}
      >
        {children}
      </div>

      {/* Transparent scroll driver for phase 1 (fixed layers show through). */}
      <div ref={spacerRef} className="cinematic-phase1-spacer" aria-hidden />

      {/* ABOUT — a separate section that begins only after the zoom-in. Opaque
          and z-30, so it scrolls up over the fixed cinematic layers + hero. */}
      <AboutSection />

      {/* WORK — vertical, editorial grid of project cards. Owns #work so the
          navbar lands here. Self-contained: manages its own video lightbox. */}
      <WorkSection />

      {/* CONTACT — full-screen 3D background (spinning torii gate) with the
          call-to-action text overlaid on top. */}
      <ContactSection />
    </>
  )
}
