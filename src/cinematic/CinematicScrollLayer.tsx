import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CameraLayers from './CameraLayers'
import { useLenis } from './useLenis'
import { useScrollProgress } from './useScrollProgress'
import {
  buildCameraTimeline,
  buildHorizontalTimeline,
} from './scrollTimelines'

interface CinematicScrollLayerProps {
  headingRef: RefObject<HTMLElement>
  paragraphRef: RefObject<HTMLElement>
  /** The untouched LinkFlow landing section (navbar + hero). */
  children: ReactNode
}

const horizontalPanels = [
  {
    n: '01',
    title: 'Signals arrive',
    body: 'Raw, scattered, unread — events stream in from everywhere at once.',
    panelClass: 'panel-1',
  },
  {
    n: '02',
    title: 'Workflows align',
    body: 'AI shapes the noise into structure, routing every signal to intent.',
    panelClass: 'panel-2',
  },
  {
    n: '03',
    title: 'Action lands',
    body: 'The rift closes — meaningful outcomes, delivered on autopilot.',
    panelClass: 'panel-3',
  },
]

export default function CinematicScrollLayer({
  headingRef,
  paragraphRef,
  children,
}: CinematicScrollLayerProps) {
  // Smooth-scroll engine + single source of truth for scroll progress.
  useLenis()
  const { report } = useScrollProgress()

  const landscapeRef = useRef<HTMLDivElement>(null)
  const hazeRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const horizWrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const heading = headingRef.current
    const paragraph = paragraphRef.current
    const landscape = landscapeRef.current
    const haze = hazeRef.current
    const train = trainRef.current
    const overlay = overlayRef.current
    const spacer = spacerRef.current
    const horizWrap = horizWrapRef.current
    const track = trackRef.current

    if (
      !heading ||
      !paragraph ||
      !landscape ||
      !haze ||
      !train ||
      !overlay ||
      !spacer ||
      !horizWrap ||
      !track
    ) {
      return
    }

    const ctx = gsap.context(() => {
      buildCameraTimeline(
        { spacer, landscape, haze, train, overlay, heading, paragraph },
        report,
      )
      buildHorizontalTimeline({ wrap: horizWrap, track }, report)
    })

    // Lenis changes document height; ensure triggers measure after layout.
    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => ctx.revert()
  }, [headingRef, paragraphRef, report])

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

      {/* PHASE 2 — horizontal storytelling (scrollProgress 1 -> 2) */}
      <section
        ref={horizWrapRef}
        className="horizontal-wrapper relative z-30 w-full h-screen overflow-hidden"
      >
        <div ref={trackRef} className="flex h-screen will-change-transform">
          {horizontalPanels.map((panel) => (
            <article
              key={panel.n}
              className={`panel relative flex h-screen w-screen shrink-0 flex-col items-start justify-center overflow-hidden px-8 sm:px-16 md:px-24 ${panel.panelClass}`}
            >
              <div data-parallax className="panel-parallax" aria-hidden />
              <span className="relative z-10 text-sm font-medium tracking-[0.35em] text-white/70">
                {panel.n}
              </span>
              <h2 className="relative z-10 mt-4 max-w-3xl text-4xl font-normal leading-[1.05] text-white sm:text-5xl md:text-6xl">
                {panel.title}
              </h2>
              <p className="relative z-10 mt-6 max-w-md text-base leading-relaxed text-white/80 md:text-lg">
                {panel.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
