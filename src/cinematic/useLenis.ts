import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { lenisStore } from './lenisStore'

// Registered once at module load so timelines built in any effect can rely on it.
gsap.registerPlugin(ScrollTrigger)

/**
 * Smooth-scroll engine. Lenis drives the scroll; GSAP's ticker drives Lenis;
 * ScrollTrigger.update is fired on every Lenis scroll so all scrubbed timelines
 * read a single, smoothed scroll position. Returns the live Lenis instance ref.
 */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
      // Touch scrolling stays native (no syncTouch) so mobile gestures are
      // never blocked; this only scales the momentum Lenis reads back from
      // that native scroll, so flicks don't feel sluggish.
      touchMultiplier: 1.8,
    })
    lenisRef.current = lenis
    lenisStore.set(lenis)

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // Lenis caches document height at construction time and never
    // re-measures it on its own — ResizeObserver doesn't fire for
    // document.documentElement's scrollable-overflow growth, so as the
    // cinematic content mounts, Lenis's scroll limit stays stuck near the
    // initial (near-empty) page height. ScrollTrigger.refresh() already runs
    // whenever content/images settle, so resync Lenis's measurement there.
    const onRefresh = () => lenis.resize()
    ScrollTrigger.addEventListener('refresh', onRefresh)

    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
      lenisStore.set(null)
    }
  }, [])

  return lenisRef
}
