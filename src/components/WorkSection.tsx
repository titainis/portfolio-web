import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import VideoLightbox from './VideoLightbox'
import ProximityText from './ui/proximity-text'
import { CONTACT_REVEALED } from './contactRevealEvent'
import { useTranslation } from '../context/LanguageContext'

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

// Title/body come from the dictionary (titles happen to be identical in both
// languages — they're project names, not descriptions); only the video/url
// pairing lives here since that's language-independent.
const projectKeys = ['moviePage', 'karateClub', 'folidify'] as const
const projectMeta: Record<(typeof projectKeys)[number], { url?: string; video: string }> = {
  moviePage: { url: 'https://titainis.github.io/project-repo/', video: '/work/movie-page-recording.mp4' },
  karateClub: { url: 'https://karate-klubas-alfa.lovable.app', video: '/work/karate-club-recording.mp4' },
  folidify: { url: 'https://folidify.com', video: '/work/folidify-recording.mp4' },
}

function IntroCopy() {
  const { t } = useTranslation()
  return (
    <h2 className="text-4xl font-normal leading-[1.05] text-white sm:text-5xl lg:text-6xl">
      <span data-sink-item className="block">{t('work.introLine1')}</span>
      <span data-sink-item className="block">{t('work.introLine2')}</span>
    </h2>
  )
}

export default function WorkSection() {
  const { t } = useTranslation()
  const projects: Project[] = projectKeys.map((key) => ({
    n: key,
    title: t(`work.projects.${key}.title`),
    body: t(`work.projects.${key}.body`),
    ...projectMeta[key],
  }))

  const [lightbox, setLightbox] = useState<{
    src: string
    el: HTMLElement
  } | null>(null)

  const wrapRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLElement | null)[]>([])

  // Cursor-follow "WATCH" hint on video hover — same soft-lag follower as the
  // hero's "SCROLL" hint (CursorScroll.tsx), scoped to whichever thumbnail is
  // currently hovered instead of running for the whole page.
  const [watchHover, setWatchHover] = useState(false)
  const watchRef = useRef<HTMLSpanElement>(null)
  const watchTarget = useRef({ x: 0, y: 0 })
  const watchPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    let raf: number
    const tick = () => {
      watchPos.current.x += (watchTarget.current.x - watchPos.current.x) * 0.03
      watchPos.current.y += (watchTarget.current.y - watchPos.current.y) * 0.03
      if (watchRef.current) {
        watchRef.current.style.transform =
          `translate3d(${watchPos.current.x}px, ${watchPos.current.y}px, 0) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onVideoEnter = (e: React.MouseEvent) => {
    watchTarget.current = { x: e.clientX, y: e.clientY }
    watchPos.current = { x: e.clientX, y: e.clientY }
    setWatchHover(true)
  }
  const onVideoMove = (e: React.MouseEvent) => {
    watchTarget.current = { x: e.clientX, y: e.clientY }
  }
  const onVideoLeave = () => setWatchHover(false)

  // The gallery scrubs panels via transform under a stationary cursor, so a
  // hovered video can slide out from under the pointer without the browser
  // ever firing a real mouseleave (that only fires on pointer movement, not
  // on the element moving) — leaving "WATCH" stuck on screen. Re-check on
  // scroll whether the last known cursor position is still over a video.
  useEffect(() => {
    const onScroll = () => {
      const el = document.elementFromPoint(watchTarget.current.x, watchTarget.current.y)
      if (!el?.closest('[data-video-button]')) setWatchHover(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!wrap || !viewport || !track) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const panels = panelRefs.current.filter((p): p is HTMLElement => !!p)
    const sinkItems = wrap.querySelectorAll<HTMLElement>('[data-sink-item]')

    // Horizontal pin + scrub is desktop-only — GSAP's pin/scrub-on-x is
    // unstable on mobile Safari (jank, blank frames, broken layout). Below
    // `md` the gallery is plain stacked flex-col markup (see JSX) that just
    // scrolls vertically; the only JS it needs is a simple fade-in per panel.
    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      // The scrollable viewport is only the right column (half the screen on
      // desktop) — measured live rather than assumed, so it tracks the
      // actual breakpoint.
      const distance = () => track.scrollWidth - viewport.clientWidth

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
      // top-to-bottom in DOM order. Tracks per-panel state so it only ever
      // plays once — scrolling back out and returning leaves it revealed.
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

      if (reduced) {
        panels.forEach((panel) => applyReveal(panel, 1))
        gsap.set(sinkItems, { opacity: 1, y: 0 })
      } else {
        panels.forEach((panel) => applyReveal(panel, 0))
        gsap.set(sinkItems, { opacity: 0, y: 40 })

        // Panel 0 has no horizontal travel — it sinks in during the normal
        // vertical approach into the section, before the pin engages.
        // Queried directly by class rather than via panelRefs[0]: that ref
        // can still be null the first time this effect runs, which silently
        // skipped creating this trigger entirely.
        const introItems = wrap.querySelectorAll<HTMLElement>('.intro-panel [data-sink-item]')
        ScrollTrigger.create({
          trigger: wrap,
          // "center" (not "top") 85%: the intro text sits vertically centered
          // in this full-screen panel, not pinned to its top edge — anchoring
          // on the section's own top meant the reveal fired while the text
          // was still well below the viewport (off-screen) and had finished
          // tweening long before the text itself scrolled into view.
          start: 'center 85%',
          end: 'top top',
          once: true,
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
        })
      }

      // --- Horizontal pin: vertical scroll scrubs the track's translateX,
      // then (same pin, phase 2) slides the whole section away. ---
      const revealDistance = () => window.innerHeight

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'work-pin',
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
      }
    })

    // Mobile: no pin, no horizontal scrub, no frame-line drawing (those need
    // the scrub progress to animate) — just a plain per-panel fade/rise as
    // each one scrolls into view, same easing as the desktop text reveal.
    mm.add('(max-width: 767.9px)', () => {
      if (reduced) {
        gsap.set(sinkItems, { opacity: 1, y: 0 })
        return
      }
      gsap.set(sinkItems, { opacity: 0, y: 40 })
      const triggers = panels.map((panel) =>
        ScrollTrigger.create({
          trigger: panel,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(panel.querySelectorAll<HTMLElement>('[data-sink-item]'), {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'workSinkIn',
              stagger: 0.1,
              overwrite: true,
            })
          },
        }),
      )
      return () => triggers.forEach((trigger) => trigger.kill())
    })

    return () => mm.revert()
  }, [])

  return (
    <>
      <span
        ref={watchRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-50 text-[11px] font-bold tracking-[0.3em] text-white transition-opacity duration-300"
        style={{ opacity: watchHover ? 1 : 0 }}
      >
        {t('work.watch')}
      </span>

      <section
        id="work"
        ref={wrapRef}
        className="horizontal-wrapper relative z-30 w-full bg-black text-white md:flex md:h-dvh md:overflow-hidden"
      >
        {/* Single horizontally-scrolling track on desktop — the intro is its
            first panel, so it scrolls fully out of view before any project
            card appears rather than sitting fixed alongside the gallery. On
            mobile this is just a plain flex-col stack scrolling vertically. */}
        <div ref={viewportRef} className="relative z-10 w-full md:h-dvh md:overflow-hidden">
          <div
            ref={trackRef}
            className="relative flex flex-col md:h-dvh md:flex-row md:gap-x-24 md:will-change-transform"
          >
            <div
              ref={(el) => { panelRefs.current[0] = el }}
              className="intro-panel relative flex w-full shrink-0 flex-col justify-center border-b border-white/10 px-6 py-24 sm:px-10 md:h-dvh md:w-screen md:border-b-0 md:border-r md:px-14 md:py-0 lg:px-20"
            >
              <div className="mx-auto w-full max-w-2xl">
                <IntroCopy />
              </div>
            </div>

            {projects.map((project, i) => (
              <article
                key={project.n}
                ref={(el) => { panelRefs.current[i + 1] = el }}
                className="relative flex w-full shrink-0 flex-col justify-center px-6 py-16 sm:px-10 md:h-dvh md:w-screen md:overflow-hidden md:px-14 md:py-0 lg:px-20"
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
                      className="pointer-events-none absolute -inset-4 z-20 hidden sm:-inset-6 md:-inset-8 md:block"
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
                        data-video-button
                        aria-label={t('work.playAria', { title: project.title })}
                        className="group relative block w-full cursor-none overflow-hidden bg-white/[0.03] shadow-2xl ring-1 ring-white/10 transition-transform duration-500 ease-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        style={{ aspectRatio: '16 / 9' }}
                        onClick={(e) =>
                          setLightbox({ src: project.video, el: e.currentTarget })
                        }
                        onMouseEnter={onVideoEnter}
                        onMouseMove={onVideoMove}
                        onMouseLeave={onVideoLeave}
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

                  {/* Caption — title + link in one horizontal row, description below. */}
                  <div className="mt-8 text-center md:mt-20 md:text-left">
                    <div className="flex items-center justify-center gap-6 md:justify-between">
                      <h3
                        data-sink-item
                        className="text-xl font-normal text-white sm:text-2xl"
                      >
                        {project.title}
                      </h3>
                      {project.url && (
                        <a
                          data-sink-item
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
                        >
                          <ProximityText text={t('work.explore')} radius={60} />
                          <span aria-hidden>&rarr;</span>
                        </a>
                      )}
                    </div>
                    <p
                      data-sink-item
                      className="mt-2 text-sm leading-relaxed text-white/60"
                    >
                      {project.body}
                    </p>
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
