import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import VideoLightbox from './VideoLightbox'
import Shuffle, { shufflePreset } from './ui/Shuffle'
import { CONTACT_REVEALED } from './contactRevealEvent'

gsap.registerPlugin(ScrollTrigger, CustomEase)
// "Fast start, gentle landing" — matches CSS cubic-bezier(0.16, 1, 0.3, 1).
// (Raw control points only — no "cubic-bezier(...)" wrapper: CustomEase treats
// any stray letter as an SVG path command, which would misparse this.)
CustomEase.create('workSinkIn', '0.16, 1, 0.3, 1')

/**
 * WORK — a single horizontally-scrolling track. The intro panel ("Selected
 * work & explorations") is the first item in that track, not a fixed column:
 * vertical scroll carries it fully off-screen before any project card comes
 * into view, so the gallery only shows once the intro has hidden itself.
 *
 * The section pins for the length of the track's own scrollWidth; vertical
 * scroll is scrubbed into horizontal translateX of the track. Each project
 * card stacks vertically — a large 16/9 video on top, framed with thin
 * "technical drawing" line work (hairlines sitting slightly OUTSIDE the video
 * that overshoot at the corners), with the title/description/link below it.
 *
 * The SAME pin is then extended by one extra viewport of scroll: once the
 * gallery track finishes scrubbing, the whole section (still pinned, opaque,
 * z-30) slides off to the left via xPercent, uncovering the permanently
 * fixed <ContactSection/> (z-25) sitting behind it the entire time. A single
 * ScrollTrigger drives both phases — GSAP won't let the same element be
 * pinned by two separate triggers, so the "slide away" can't be a second,
 * independent pin the way it might be on a plain (non-gallery) section.
 *
 * Per-panel reveal is driven manually from the same scrub progress that moves
 * the track (not IntersectionObserver — under a pinned, transform-driven
 * scroll a panel's bounding box moves via translateX rather than a real
 * document scroll, which whileInView-style observers don't reliably key off).
 * Panel 0 (the intro) sits at the track's rest position from the moment the
 * section pins, so it reveals during the normal vertical *approach* into the
 * section instead; panels after it reveal as the horizontal scrub brings
 * them in.
 *
 * The click-to-expand behaviour is unchanged: the thumbnail button opens the
 * shared-element <VideoLightbox/>.
 */

interface Project {
  n: string
  title: string
  body: string
  url?: string
  video: string
}

const projects: Project[] = [
  {
    n: '01',
    title: 'Movie Page',
    body: 'A sleek movie discovery site with a clean, content-first interface.',
    url: 'https://titainis.github.io/project-repo/',
    video: '/work/movie-page-recording.mp4',
  },
  {
    n: '02',
    title: 'Karate Club Alfa',
    body: "A landing page introducing a karate club's programs and schedule.",
    url: 'https://karate-klubas-alfa.lovable.app',
    video: '/work/karate-club-recording.mp4',
  },
  {
    n: '03',
    title: 'Folidify',
    body: 'A downloadable desktop app that uses AI to search, organize, and manage local files.',
    url: 'https://folidify.com',
    video: '/work/folidify-recording.mp4',
  },
]

function IntroCopy() {
  return (
    <h2 className="text-4xl font-normal leading-[1.05] text-white sm:text-5xl lg:text-6xl">
      <span data-sink-item className="block">Selected work</span>
      <span data-sink-item className="block">&amp; projects</span>
    </h2>
  )
}

export default function WorkSection() {
  const [lightbox, setLightbox] = useState<{
    src: string
    el: HTMLElement
  } | null>(null)

  const wrapRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const wrap = wrapRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!wrap || !viewport || !track) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // The scrollable viewport is only the right column (half the screen on
    // desktop, the full width on mobile where the intro isn't split out) —
    // measured live rather than assumed, so it tracks the actual breakpoint.
    const distance = () => track.scrollWidth - viewport.clientWidth
    const panels = panelRefs.current.filter((p): p is HTMLElement => !!p)

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

    // Drives one panel's frame lines + video from a single 0..1 progress.
    const applyReveal = (panel: HTMLElement, raw: number) => {
      const t = easeOutCubic(clamp01(raw))
      const hLines = panel.querySelectorAll<HTMLElement>('[data-frame-line="h"]')
      const vLines = panel.querySelectorAll<HTMLElement>('[data-frame-line="v"]')
      const videoWrap = panel.querySelector<HTMLElement>('[data-video-wrap]')

      gsap.set(hLines, { scaleX: t })
      gsap.set(vLines, { scaleY: t })
      gsap.set(videoWrap, { opacity: t, y: 60 * (1 - t), scale: 0.95 + 0.05 * t })

      // The thumbnails deliberately have no autoPlay: together they're tens of
      // MB, so each one only downloads/decodes once its reveal actually starts.
      // ponytail: panels already scrolled past keep playing; pause those too if
      // decode cost ever shows up.
      const video = videoWrap?.querySelector('video')
      if (video) {
        if (t === 0) {
          if (!video.paused) video.pause()
        } else if (video.paused) {
          video.play().catch(() => {})
        }
      }
    }

    // Sinks every text element in a panel up into place together, staggered
    // top-to-bottom in DOM order. Tracks per-panel state so it plays once
    // per scroll pass — scrolling back out and returning replays it, rather
    // than firing only once for the whole page lifetime.
    const sunk = new Map<HTMLElement, boolean>()
    const playSinkIn = (panel: HTMLElement) => {
      if (sunk.get(panel)) return
      sunk.set(panel, true)
      const items = panel.querySelectorAll<HTMLElement>('[data-sink-item]')
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'workSinkIn',
        stagger: 0.1,
        overwrite: true,
      })
    }
    // Snaps back to hidden (no animation — this only happens off-screen,
    // while scrolled back above the trigger point) so the reveal is ready
    // to replay next time this panel scrolls into view.
    const resetSinkIn = (panel: HTMLElement) => {
      if (!sunk.get(panel)) return
      sunk.set(panel, false)
      const items = panel.querySelectorAll<HTMLElement>('[data-sink-item]')
      gsap.set(items, { opacity: 0, y: 40, overwrite: true })
    }

    const ctx = gsap.context(() => {
      const sinkItems = wrap.querySelectorAll<HTMLElement>('[data-sink-item]')

      if (reduced) {
        panels.forEach((panel) => applyReveal(panel, 1))
        gsap.set(sinkItems, { opacity: 1, y: 0 })
      } else {
        panels.forEach((panel) => applyReveal(panel, 0))
        gsap.set(sinkItems, { opacity: 0, y: 40 })

        // Panel 0 has no horizontal travel — it sinks in during the normal
        // vertical approach into the section, before the pin engages.
        // Scrolling back above the trigger point resets it so scrolling
        // down into it again replays the reveal. Queried directly by class
        // rather than via panelRefs[0]: that ref can still be null the
        // first time this effect runs, which silently skipped creating
        // this trigger entirely.
        const introItems = wrap.querySelectorAll<HTMLElement>('.intro-panel [data-sink-item]')
        ScrollTrigger.create({
          trigger: wrap,
          start: 'top 85%',
          end: 'top top',
          onEnter: () => {
            gsap.to(introItems, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'workSinkIn',
              stagger: 0.1,
              overwrite: true,
            })
          },
          onLeaveBack: () => {
            gsap.set(introItems, { opacity: 0, y: 40, overwrite: true })
          },
        })
      }

      // --- Horizontal pin: vertical scroll scrubs the track's translateX,
      // then (same pin, phase 2) slides the whole section away. ---
      const revealDistance = () => window.innerHeight

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: 'top top',
          end: () => '+=' + (distance() + revealDistance()),
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // The instant scroll continues past this trigger's own end — i.e.
          // the phase-2 slide has fully finished and CONTACT is completely
          // uncovered.
          onLeave: () => window.dispatchEvent(new Event(CONTACT_REVEALED)),
          onUpdate: (self) => {
            if (reduced) return
            const n = panels.length
            if (n < 2) return
            const total = distance() + revealDistance()
            const galleryFraction = total > 0 ? distance() / total : 0
            panels.forEach((panel, i) => {
              if (i === 0) return
              // Rescaled by galleryFraction: panel choreography must still
              // finish entirely within phase 1, which is now only part of
              // the pin's total (gallery + reveal) scroll range.
              const startP = ((i - 0.85) / (n - 1)) * galleryFraction
              const endP = ((i - 0.15) / (n - 1)) * galleryFraction
              applyReveal(panel, (self.progress - startP) / (endP - startP))
              // Panels never move vertically under the pin, so a normal
              // scroll-position trigger can't tell when one has scrolled
              // into (horizontal) view — reuse the same scrub progress
              // that already drives its reveal instead.
              if (self.progress >= startP) playSinkIn(panel)
              else resetSinkIn(panel)
            })
          },
        },
      })

      // Phase 1 — gallery scrub. "duration" is just the phase's share of
      // the timeline under scrub (arbitrary time units); using the raw
      // pixel distances keeps phase 1 : phase 2 proportional to their
      // actual scroll lengths.
      tl.to(track, { x: () => -distance(), ease: 'none', duration: distance() }, 0)
        // Phase 2 — the whole (still-pinned) section slides off to the
        // left, starting exactly where phase 1 ends, uncovering the fixed
        // ContactSection sitting behind it the entire time.
        .to(wrap, { xPercent: -100, ease: 'none', duration: revealDistance() }, distance())
    })

    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      // GSAP's pin-spacer copies this section's z-30 and keeps occupying the
      // viewport after the phase-2 slide — transparent, but it swallows
      // pointer input meant for whatever's now visible underneath. Let
      // input pass through the spacer while keeping the gallery itself
      // interactive (an explicit pointer-events:auto child still receives
      // events under a :none parent).
      const spacer = wrap.parentElement
      if (spacer?.classList.contains('pin-spacer')) {
        spacer.style.pointerEvents = 'none'
        wrap.style.pointerEvents = 'auto'
      }
    })
    // Re-measure once every asset (the project videos especially) has
    // settled, in case anything above this section shifted layout after
    // the first refresh ran.
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    return () => {
      window.removeEventListener('load', onLoad)
      wrap.style.pointerEvents = ''
      ctx.revert()
    }
  }, [])

  return (
    <>
      <section
        id="work"
        ref={wrapRef}
        className="horizontal-wrapper relative z-30 flex h-screen w-full overflow-hidden bg-black text-white"
      >
        {/* Single horizontally-scrolling track — the intro is its first
            panel, so it scrolls fully out of view before any project card
            appears rather than sitting fixed alongside the gallery. */}
        <div ref={viewportRef} className="relative z-10 h-screen w-full overflow-hidden">
          <div
            ref={trackRef}
            className="relative flex h-screen will-change-transform"
          >
            <div
              ref={(el) => { panelRefs.current[0] = el }}
              className="intro-panel relative flex h-screen w-screen shrink-0 flex-col justify-center border-r border-white/10 px-6 sm:px-10 md:px-14 lg:px-20"
            >
              <div className="mx-auto w-full max-w-2xl">
                <IntroCopy />
              </div>
            </div>

            {projects.map((project, i) => (
              <article
                key={project.n}
                ref={(el) => { panelRefs.current[i + 1] = el }}
                className="relative flex h-screen w-screen shrink-0 flex-col justify-center overflow-hidden px-6 sm:px-10 md:px-14 lg:px-20"
              >
                <div className="relative mx-auto w-full max-w-4xl">
                  {/* Framed video — a real button so it stays keyboard-
                      focusable and focus can be restored when the lightbox
                      closes. */}
                  <div className="relative">
                    {/* Technical-drawing frame: hairlines offset outside the
                        video, overshooting at the corners. Non-interactive so
                        the video stays clickable. */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-4 z-20 sm:-inset-6 md:-inset-8"
                    >
                      <span
                        data-frame-line="h"
                        style={{ transformOrigin: 'left center' }}
                        className="absolute -left-3 -right-3 top-0 h-px bg-white/25"
                      />
                      <span
                        data-frame-line="h"
                        style={{ transformOrigin: 'right center' }}
                        className="absolute -left-3 -right-3 bottom-0 h-px bg-white/25"
                      />
                      <span
                        data-frame-line="v"
                        style={{ transformOrigin: 'center top' }}
                        className="absolute -top-3 -bottom-3 left-0 w-px bg-white/25"
                      />
                      <span
                        data-frame-line="v"
                        style={{ transformOrigin: 'center bottom' }}
                        className="absolute -top-3 -bottom-3 right-0 w-px bg-white/25"
                      />
                    </div>

                    <div data-video-wrap>
                      <button
                        type="button"
                        aria-label={`Play ${project.title} showcase video`}
                        className="group relative block w-full cursor-zoom-in overflow-hidden bg-white/[0.03] shadow-2xl ring-1 ring-white/10 transition-transform duration-500 ease-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        style={{ aspectRatio: '16 / 9' }}
                        onClick={(e) =>
                          setLightbox({ src: project.video, el: e.currentTarget })
                        }
                      >
                        <video
                          src={project.video}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Caption — below the video, title/description on the
                      left, the link on the right. */}
                  <div className="mt-8 flex items-start justify-between gap-6 md:mt-20">
                    <div>
                      <h3
                        data-sink-item
                        className="text-xl font-normal text-white sm:text-2xl"
                      >
                        {project.title}
                      </h3>
                      <p
                        data-sink-item
                        className="mt-2 max-w-[30ch] text-sm leading-relaxed text-white/60"
                      >
                        {project.body}
                      </p>
                    </div>
                    {project.url && (
                      <a
                        data-sink-item
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
                      >
                        <Shuffle text="Explore project" {...shufflePreset} />
                        <span aria-hidden>&rarr;</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Shared-element video popup (unchanged behaviour). */}
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
