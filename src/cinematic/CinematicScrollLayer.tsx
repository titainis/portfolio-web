import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CameraLayers from './CameraLayers'
import AboutSection from '../components/AboutSection'
import WorkSection from '../components/WorkSection'
import ContactSection from '../components/ContactSection'
import { useLenis } from './useLenis'
import { useMouseParallax } from './useMouseParallax'
import { buildCameraTimeline } from './scrollTimelines'

interface Props {
  onContactOpen: () => void
}

export default function CinematicScrollLayer({ onContactOpen }: Props) {
  // Smooth-scroll engine.
  useLenis()

  const landscapeRef = useRef<HTMLDivElement>(null)
  const hazeRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)

  // Subtle cursor-driven perspective on the fixed camera layers. Writes only
  // x/y/rotationX/rotationY, so it composes with — never overrides — the
  // scroll-driven scale/yPercent on the same elements.
  useMouseParallax(landscapeRef, trainRef)

  useEffect(() => {
    const landscape = landscapeRef.current
    const haze = hazeRef.current
    const train = trainRef.current
    const spacer = spacerRef.current
    if (!landscape || !haze || !train || !spacer) {
      return
    }

    // The zoom/fly-through timeline is desktop-only — the train layer it
    // animates is hidden below `md` (see CameraLayers.tsx), and mobile just
    // shows the static mountain photo, so there's nothing to scrub there.
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      const tl = buildCameraTimeline({ spacer, landscape, haze, train })
      return () => tl.scrollTrigger?.kill()
    })

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      mm.revert()
    }
  }, [])

  return (
    <>
      {/* PHASE 1 — independent fixed camera layers (bg / haze / fg) */}
      <CameraLayers
        landscapeRef={landscapeRef}
        hazeRef={hazeRef}
        trainRef={trainRef}
      />

      {/* Transparent scroll driver for phase 1 (fixed layers show through). */}
      <div ref={spacerRef} className="cinematic-phase1-spacer" aria-hidden />

      {/* ABOUT — a separate section that begins only after the zoom-in. Opaque
          and z-30, so it scrolls up over the fixed cinematic layers + hero. */}
      <AboutSection />

      {/* WORK — vertical, editorial grid of project cards. Owns #work so the
          navbar lands here. Self-contained: manages its own video lightbox. */}
      <WorkSection />

      {/* CONTACT — revealed as WORK slides off; plain text call-to-action. */}
      <ContactSection onContactOpen={onContactOpen} />
    </>
  )
}
