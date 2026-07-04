import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Hls from 'hls.js'
import { CONTACT_REVEALED } from './contactRevealEvent'

gsap.registerPlugin(ScrollTrigger)

const STREAM_URL =
  'https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8'

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // Visibility gate. A fixed section can't be hidden by the hero, because
    // the hero is itself a stack of FIXED layers behind a transparent
    // in-flow spacer — no static z-order can put the (opaque, permanent)
    // landscape above this section during the intro AND below it at the
    // reveal. So it stays hidden until the WORK cover scrolls on screen —
    // from that point it sits safely behind WORK's opaque z-30 until the
    // phase-2 slide uncovers it. Scrolling back above WORK re-hides it so
    // it never bleeds through the hero or the intro layers.
    const trigger = ScrollTrigger.create({
      trigger: '#work',
      start: 'top bottom',
      onEnter: () => gsap.set(section, { autoAlpha: 1 }),
      onLeaveBack: () => gsap.set(section, { autoAlpha: 0 }),
    })

    return () => trigger.kill()
  }, [])

  // Background video: loads the Mux stream in the background the whole time
  // it's mounted, sitting invisible as a small square in the middle of the
  // frame until CONTACT is fully reached (CONTACT_REVEALED). It then pops
  // into view instantly at that small size and scales smoothly up to fill
  // the screen — no loading UI, no delay, just an immediate "pop" followed
  // by a smooth grow. Fires once; once revealed it stays visible and playing
  // for good.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // hls.js is ~400 kB minified — dynamically imported so it loads as its own
    // chunk after the main bundle instead of blocking first paint. Safari plays
    // the stream natively and never downloads it at all.
    let hls: Hls | null = null
    let cancelled = false
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = STREAM_URL
    } else {
      import('hls.js').then(({ default: HlsLib }) => {
        if (cancelled || !HlsLib.isSupported()) return
        hls = new HlsLib()
        hls.loadSource(STREAM_URL)
        hls.attachMedia(video)
      })
    }

    gsap.set(video, { opacity: 0, scale: 0.14 })

    let revealed = false
    let tl: gsap.core.Timeline | undefined

    const reveal = () => {
      if (revealed) return
      revealed = true

      tl = gsap.timeline()
      tl.set(video, { opacity: 1 })
        .call(() => video.play().catch(() => {}))
        .to(video, { scale: 1, duration: 1.2, ease: 'power3.out' }, '<')
    }

    window.addEventListener(CONTACT_REVEALED, reveal)

    return () => {
      cancelled = true
      tl?.kill()
      window.removeEventListener(CONTACT_REVEALED, reveal)
      hls?.destroy()
    }
  }, [])

  return (
    // Permanently fixed, filling the viewport — it never occupies document
    // flow, so it can sit directly behind WORK (z-30) at all times. WORK's
    // own pin (in WorkSection.tsx) is extended to slide itself away via
    // xPercent:-100 once its gallery finishes scrubbing, which is what
    // actually performs the reveal; this section just needs to already be
    // here, one z-index lower, the whole time.
    //
    // z-[25]: above the fixed cinematic layers, below the WORK cover (z-30).
    // Starts visibility:hidden inline so it can't flash over the hero before
    // the gating effect above runs.
    <section
      id="contact"
      ref={sectionRef}
      className="fixed inset-0 z-[25] flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        muted
        loop
        playsInline
      />

      <div className="relative z-10 text-center px-6">
        <h2 className="text-4xl font-normal leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          WANT TO WORK ON SOMETHING?
        </h2>
        <p className="mt-6 text-sm uppercase tracking-widest text-white/50 sm:text-base">
          CONTACT US
        </p>
      </div>
    </section>
  )
}
