import gsap from 'gsap'

/** Reports the unified scroll progress (0..1 vertical, 1..2 horizontal). */
export type ProgressReporter = (progress: number) => void

export interface CameraRefs {
  /** Transparent in-flow spacer whose scroll length drives phase 1 (0 -> 1). */
  spacer: HTMLElement
  /** Background layer — independent transform target. */
  landscape: HTMLElement
  /** Mid atmospheric layer — independent target. */
  haze: HTMLElement
  /** Foreground train layer — independent transform target. */
  train: HTMLElement
  /** Fixed navbar overlay. */
  overlay: HTMLElement
}

/**
 * PHASE 1 (scrollProgress 0 -> 1): one continuous, fully scrubbed camera move.
 *
 * Everything is a function of scroll position — there is no state machine and
 * no onComplete trigger. Layers respond on independent systems:
 *
 *   Background : scale 1 -> 2.4, accelerating (power2.in) toward the window
 *                center so it reads as forward camera motion and "pops out".
 *   Mid haze   : opacity swells through the crossing (~0.5 -> 0.8) then clears.
 *   Foreground : the train interior scales UP from the window center (1 -> 6),
 *                accelerating — it gets closer and closer until the camera flies
 *                THROUGH the window, the frame/seats sliding off every edge.
 *                Motion blur builds during the rush; opacity fades 1 -> 0 only
 *                at the end, once it has engulfed the screen ("pass-through").
 *   Hero UI    : purely scroll-mapped reveal — hidden < 0.75, fading 0.75 ->
 *                0.95, full by 1.0.
 */
export function buildCameraTimeline(refs: CameraRefs, report?: ProgressReporter) {
  const { spacer, landscape, haze, train, overlay } = refs

  gsap.set(landscape, { scale: 1, yPercent: 0, transformOrigin: '50% 44%' })
  gsap.set(haze, { autoAlpha: 0 })
  gsap.set(train, {
    autoAlpha: 1,
    scale: 1,
    yPercent: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 43%',
  })
  gsap.set(overlay, { autoAlpha: 0, pointerEvents: 'none' })

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: spacer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      invalidateOnRefresh: true,
      onUpdate: (self) => report?.(self.progress),
    },
  })

  // --- BACKGROUND: forward dolly, accelerating + popping out as we fly in ---
  tl.to(landscape, { scale: 1.9, ease: 'power2.in', duration: 1 }, 0)

  // --- MID: atmospheric haze peaks during the crossing, then clears ---
  tl.fromTo(
    haze,
    { autoAlpha: 0 },
    { autoAlpha: 0.28, ease: 'power1.in', duration: 0.25 },
    0.5,
  ).to(haze, { autoAlpha: 0, ease: 'power1.out', duration: 0.25 }, 0.78)

  // --- FOREGROUND: train rushes toward camera and flies THROUGH the window ---
  // Scale up the whole way, accelerating, so it gets closer and closer; the
  // opaque frame/seats slide off every edge as the transparent window engulfs
  // the screen. Motion blur builds during the rush; it fades out only at the
  // very end, after it has passed the camera.
  tl.to(train, { scale: 6, ease: 'power2.in', duration: 0.9 }, 0)
    .to(train, { filter: 'blur(7px)', ease: 'power1.in', duration: 0.25 }, 0.55)
    .to(train, { autoAlpha: 0, ease: 'power2.in', duration: 0.18 }, 0.72)

  // --- NAV OVERLAY: fade in at the end of the camera move ---
  tl.to(overlay, { autoAlpha: 1, ease: 'power2.out', duration: 0.2 }, 0.75)
    .set(overlay, { pointerEvents: 'auto' }, 0.9)

  return tl
}
