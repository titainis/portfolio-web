import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CameraLayers from './CameraLayers'
import AboutSection from '../components/AboutSection'
import WorkSection from '../components/WorkSection'
import ContactSection from '../components/ContactSection'
import { PRELOADER_REVEALED } from '../components/preloaderRevealEvent'
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

    // The landscape + train window both start slightly dimmed (Preloader's
    // white panels are covering them anyway) and brighten to full opacity in
    // lockstep with the panels sliding apart, so the scene visibly "gains
    // light" as the split opens rather than just sitting there fully lit.
    // Set after buildCameraTimeline() so this overrides its initial
    // autoAlpha: 1 on the train layer.
    gsap.set([landscape, train], { autoAlpha: 0.5 })
    function revealScene() {
      gsap.to([landscape, train], {
        autoAlpha: 1,
        duration: 1.1,
        ease: 'power2.out',
      })
    }
    window.addEventListener(PRELOADER_REVEALED, revealScene)

    return () => {
      ctx.revert()
      window.removeEventListener(PRELOADER_REVEALED, revealScene)
    }
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

      {/* CONTACT — revealed as WORK slides off; plain text call-to-action. */}
      <ContactSection />
    </>
  )
}
