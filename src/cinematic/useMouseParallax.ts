import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'

/**
 * Subtle cursor-driven depth on the fixed camera layers — a virtual camera that
 * pans slightly around a fixed point in the scene, so the hero reads like a
 * window you're looking *through* rather than a flat image dragged by the mouse.
 *
 * Coexistence with the scroll camera is the whole game here. The landscape and
 * train already have scrubbed GSAP timelines animating `scale` / `yPercent`.
 * GSAP keeps every transform sub-property (x, y, rotationX, rotationY, scale,
 * perspective) in ONE per-element cache and flushes a single combined matrix,
 * so as long as the mouse only ever writes x / y / rotationX / rotationY and
 * scroll keeps scale / yPercent, the two systems touch disjoint channels of the
 * same matrix and never overwrite each other. No shared update loop required.
 *
 * `gsap.quickTo` supplies the smoothing: each pointer event just re-targets a
 * running tween, so motion trails the cursor with a soft ease, keeps drifting
 * toward it after the mouse stops, and never snaps. It rides the GSAP ticker
 * (the same one driving Lenis), so there is no React state touched on move and
 * nothing is bound directly to raw cursor coordinates.
 */

// Per-layer displacement at maximum cursor offset (viewport corner).
// Background reads as the distant plane; the train is the near foreground and
// travels further, which is what sells the parallax separation.
const BG_SHIFT_X = 10 // px
const BG_SHIFT_Y = 7 // px
// Background tilt kept gentle (1.2° / 1.0°). The rotation's perspective
// foreshortening is what pulls the landscape's edge inward and threatens a
// black gap; the overscan needed to hide it scales with the tilt angle AND the
// viewport size. These angles keep a clear sense of depth while letting the
// landscape overscan stay at -4%: measured to leave ≥16px of edge coverage in
// the true worst case (cursor in a corner, both axes engaged) all the way out
// to a 3440px ultrawide viewport — so no edge can ever surface. The strongest
// depth cue is the foreground/background translate split below, not this tilt,
// so trimming the angle costs almost nothing visually.
const BG_ROT_X = 1.0 // deg
const BG_ROT_Y = 1.2 // deg
const FG_SHIFT_X = 20 // px — foreground moves ~2x the background
const FG_SHIFT_Y = 14 // px

const EASE = 'power2.out'
const DURATION = 1.1 // long, soft trail

export function useMouseParallax(
  landscapeRef: RefObject<HTMLElement>,
  trainRef: RefObject<HTMLElement>,
) {
  useEffect(() => {
    const landscape = landscapeRef.current
    const train = trainRef.current
    if (!landscape || !train) return

    // Restraint first: skip entirely for reduced-motion users and for devices
    // without a fine pointer (touch), where there is no cursor to follow.
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    if (reduceMotion || !finePointer) return

    // Perspective lives on each element so rotationX/Y read as genuine depth.
    // It is a transform sub-property too, so it merges into the same matrix the
    // scroll timeline scrubs — it does not reset scale/yPercent.
    //
    // 1400px (not a tighter value): the perspective division is what pulls the
    // landscape's receding edge inward during a rotationY tilt, and that inward
    // shift scales with the element's half-width — i.e. it gets larger on wider
    // viewports. A softer perspective keeps the same tilt angle while shrinking
    // that edge displacement, so the landscape's overscan can stay modest
    // instead of needing a heavy background zoom to hide a black edge.
    gsap.set([landscape, train], { transformPerspective: 1400 })

    const tween = { duration: DURATION, ease: EASE }
    const setBgX = gsap.quickTo(landscape, 'x', tween)
    const setBgY = gsap.quickTo(landscape, 'y', tween)
    const setBgRotX = gsap.quickTo(landscape, 'rotationX', tween)
    const setBgRotY = gsap.quickTo(landscape, 'rotationY', tween)
    const setFgX = gsap.quickTo(train, 'x', tween)
    const setFgY = gsap.quickTo(train, 'y', tween)

    const onPointerMove = (e: PointerEvent) => {
      // Normalized cursor offset from viewport center, clamped to -1..1.
      const nx = gsap.utils.clamp(-1, 1, (e.clientX / window.innerWidth) * 2 - 1)
      const ny = gsap.utils.clamp(
        -1,
        1,
        (e.clientY / window.innerHeight) * 2 - 1,
      )

      // Camera pivots around a fixed point: the scene slides slightly opposite
      // the cursor (foreground further than background) while the plane tilts
      // *toward* the cursor — the look of glancing into the frame, not of the
      // image sliding under the pointer.
      setBgX(-nx * BG_SHIFT_X)
      setBgY(-ny * BG_SHIFT_Y)
      setBgRotY(nx * BG_ROT_Y)
      setBgRotX(-ny * BG_ROT_X)
      setFgX(-nx * FG_SHIFT_X)
      setFgY(-ny * FG_SHIFT_Y)
    }

    // Ease gently back to rest when the cursor leaves the window.
    const onPointerLeave = () => {
      setBgX(0)
      setBgY(0)
      setBgRotX(0)
      setBgRotY(0)
      setFgX(0)
      setFgY(0)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onPointerLeave)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('mouseleave', onPointerLeave)
      // Kill only the channels we own; leave scale/yPercent for the scroll
      // timeline, then clear our channels so nothing lingers after unmount.
      gsap.killTweensOf([landscape, train], 'x,y,rotationX,rotationY')
      gsap.set([landscape, train], {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
      })
    }
  }, [landscapeRef, trainRef])
}
