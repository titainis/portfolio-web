import type Lenis from 'lenis'

// Module-level store so any component can trigger a smooth scroll without
// needing the Lenis instance passed down via props or context.
let _instance: Lenis | null = null

export const lenisStore = {
  set(l: Lenis | null) {
    _instance = l
  },
  scrollTo(target: string | number | HTMLElement) {
    _instance?.scrollTo(target as string, {
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
  },
  // Freeze / resume smooth scrolling — used while a modal owns the viewport.
  stop() {
    _instance?.stop()
  },
  start() {
    _instance?.start()
  },
}
