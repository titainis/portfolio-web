import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CameraLayers from './CameraLayers'
import AboutSection from '../components/AboutSection'
import VideoLightbox from '../components/VideoLightbox'
import GenerativeMountainScene from '../components/ui/mountain-scene'
import { useLenis } from './useLenis'
import { useScrollProgress } from './useScrollProgress'
import { useMouseParallax } from './useMouseParallax'
import {
  buildCameraTimeline,
  buildHorizontalTimeline,
} from './scrollTimelines'

interface CinematicScrollLayerProps {
  children?: ReactNode
}

const horizontalPanels = [
  {
    n: '01',
    title: 'Movie Page',
    body: 'A sleek movie discovery site for browsing titles, exploring details, and finding something worth watching — built with a clean, content-first interface.',
    panelClass: 'panel-1',
    url: 'https://titainis.github.io/project-repo/',
    video: '/work/movie-page-recording.mp4',
  },
  {
    n: '02',
    title: 'Karate Club Alfa',
    body: 'A landing page for a karate club — introducing the club, its training programs, and schedule, with a clear path for new members to get in touch.',
    panelClass: 'panel-2',
    url: 'https://karate-klubas-alfa.lovable.app',
    video: '/work/karate-club-recording.mp4',
  },
  {
    n: '03',
    title: 'Action lands',
    body: 'The rift closes — meaningful outcomes, delivered on autopilot.',
    panelClass: 'panel-3',
    url: undefined,
    video: undefined,
  },
]

export default function CinematicScrollLayer({ children }: CinematicScrollLayerProps) {
  const [lightbox, setLightbox] = useState<{
    src: string
    el: HTMLElement
  } | null>(null)

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
    const horizWrap = horizWrapRef.current
    const track = trackRef.current
    if (!landscape || !haze || !train || !overlay || !spacer || !horizWrap || !track) {
      return
    }

    const ctx = gsap.context(() => {
      buildCameraTimeline({ spacer, landscape, haze, train, overlay }, report)
      buildHorizontalTimeline({ wrap: horizWrap, track }, report)
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

      {/* PHASE 2 — horizontal WORK section (scrollProgress 1 -> 2). Each panel
          is one project: title + description on the left, a large video of the
          live site on the right. Owns #work so the navbar lands here. */}
      <section
        id="work"
        ref={horizWrapRef}
        className="horizontal-wrapper relative z-30 w-full h-screen overflow-hidden"
      >
        {/* Generative animated mountain landscape — scoped to the work section
            as its living background (replaces the per-panel flat gradients). */}
        <GenerativeMountainScene />

        {/* Legibility scrim: darkens the scene just enough for the light panel
            text to stay readable over the bright sky-blue ridges. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#0b1220]/75 via-[#0b1220]/35 to-[#0b1220]/85"
        />

        <div
          ref={trackRef}
          className="relative z-[2] flex h-screen will-change-transform"
        >
          {horizontalPanels.map((panel) => (
            <article
              key={panel.n}
              className={`panel relative flex h-screen w-screen shrink-0 items-center justify-center overflow-hidden px-6 sm:px-10 md:px-14 ${panel.panelClass}`}
            >
              <div data-parallax className="panel-parallax" aria-hidden />

              <div
                className={`relative z-10 grid w-full max-w-7xl grid-cols-1 items-center gap-6 md:gap-10 ${
                  panel.video ? 'md:grid-cols-[minmax(0,240px)_1fr]' : ''
                }`}
              >
                {/* Left — number + title + description (narrow strip) */}
                <div>
                  <span className="text-xs font-medium tracking-[0.35em] text-[#9fc0dd]">
                    {panel.n}
                  </span>
                  <h2 className="mt-3 text-3xl font-normal leading-[1.05] text-[#eaf2fb] sm:text-4xl md:text-5xl">
                    {panel.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[#b9cfe4]">
                    {panel.body}
                  </p>
                  {panel.url && (
                    <a
                      href={panel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-[#9fc0dd] transition-colors hover:text-white"
                    >
                      View live site &nbsp;&rarr;
                    </a>
                  )}
                </div>

                {/* Right — dominant video showcase. A real button so it's
                    keyboard-focusable and focus can be restored on close. */}
                {panel.video && (
                  <button
                    type="button"
                    aria-label={`Play ${panel.title} showcase video`}
                    className="group relative w-full cursor-zoom-in overflow-hidden rounded-2xl bg-black/20 shadow-2xl ring-1 ring-white/10 transition-transform duration-500 ease-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    style={{ aspectRatio: '16/9', maxHeight: '72vh' }}
                    onClick={(e) =>
                      setLightbox({ src: panel.video!, el: e.currentTarget })
                    }
                  >
                    <video
                      src={panel.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Premium Hero (shared-element) video popup */}
      {lightbox && (
        <VideoLightbox
          src={lightbox.src}
          originEl={lightbox.el}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
