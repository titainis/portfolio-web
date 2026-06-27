import { useCallback, useRef } from 'react'

/**
 * The single source of truth for the whole experience.
 *
 *   0.0  initial train POV
 *   0.5  approaching the window
 *   0.8  passing through the window
 *   1.0  fully outside, in the landscape
 *   1.0 -> 2.0  horizontal cinematic world
 *
 * The value is intentionally kept OUT of React state (a ref + a CSS variable)
 * so updating it every frame never triggers a re-render. GSAP scrubbed
 * timelines do the actual animating; this just exposes the unified progress
 * for any consumer (CSS, debugging, future layers).
 */
export function useScrollProgress() {
  const progressRef = useRef(0)

  const report = useCallback((progress: number) => {
    progressRef.current = progress
    document.documentElement.style.setProperty(
      '--scroll-progress',
      progress.toFixed(4),
    )
  }, [])

  return { progressRef, report }
}
