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
    })
    lenisRef.current = lenis
    lenisStore.set(lenis)

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
      lenisStore.set(null)
    }
  }, [])

  return lenisRef
}
