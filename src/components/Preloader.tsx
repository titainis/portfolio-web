import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { lenisStore } from '../cinematic/lenisStore'

// The very first thing shown on entering the site: a large 0→100 counter,
// then two white panels physically slide apart (left panel exits left,
// right panel exits right) to reveal the page underneath (the mountain/train
// hero, already sitting at full opacity behind this overlay, "loads in" as
// the panels clear the viewport). Sits above everything (including
// ContactModal's z-[200]) and freezes scroll while it's up so there's
// nothing to see moving behind it.
export default function Preloader() {
  const [mounted, setMounted] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const leftHalfRef = useRef<HTMLDivElement>(null)
  const rightHalfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const content = contentRef.current
    const counterEl = counterRef.current
    const leftHalf = leftHalfRef.current
    const rightHalf = rightHalfRef.current
    if (!root || !content || !counterEl || !leftHalf || !rightHalf) return

    lenisStore.stop()

    const MIN_DISPLAY_MS = 1500
    // ponytail: hard cap so a stalled/adblocked asset can't wedge the site behind the panels forever
    const MAX_WAIT_MS = 8000
    const start = Date.now()
    const counter = { value: 0 }
    const assets: { frac: number }[] = []
    const cleanups: Array<() => void> = []
    let splitStarted = false
    let pendingRecheck: number | undefined

    const playSplit = () => {
      if (splitStarted) return
      splitStarted = true
      gsap.to(counter, { value: 100, duration: 0.2, ease: 'power1.out', overwrite: true, onUpdate: () => {
        counterEl.textContent = String(Math.floor(counter.value))
      } })
      gsap
        .timeline({
          delay: 0.2,
          onComplete: () => {
            lenisStore.start()
            setMounted(false)
          },
        })
        .to(content, { autoAlpha: 0, duration: 0.3 })
        .to(leftHalf, { x: '-100%', duration: 1.2, ease: 'power4.inOut' }, '<')
        .to(rightHalf, { x: '100%', duration: 1.2, ease: 'power4.inOut' }, '<')
    }

    const tryFinish = () => {
      if (splitStarted) return
      const allLoaded = assets.every((a) => a.frac >= 1)
      const elapsed = Date.now() - start
      if (elapsed >= MAX_WAIT_MS) {
        playSplit()
        return
      }
      if (!allLoaded) return
      if (elapsed >= MIN_DISPLAY_MS) {
        playSplit()
      } else {
        window.clearTimeout(pendingRecheck)
        pendingRecheck = window.setTimeout(tryFinish, MIN_DISPLAY_MS - elapsed)
      }
    }

    const updateCounter = () => {
      const total = assets.length || 1
      const sum = assets.reduce((s, a) => s + a.frac, 0)
      const pct = Math.min(100, (sum / total) * 100)
      gsap.to(counter, { value: pct, duration: 0.25, ease: 'power1.out', overwrite: true, onUpdate: () => {
        counterEl.textContent = String(Math.floor(counter.value))
      } })
      tryFinish()
    }

    const track = (el: HTMLImageElement | HTMLVideoElement) => {
      const asset = { frac: 0 }
      assets.push(asset)

      const markDone = () => {
        if (asset.frac >= 1) return
        asset.frac = 1
        updateCounter()
      }
      const onProgress = (e: Event) => {
        const pe = e as ProgressEvent
        if (pe.lengthComputable && pe.total > 0) {
          asset.frac = Math.min(1, pe.loaded / pe.total)
          updateCounter()
        }
      }
      const doneEvent = el instanceof HTMLVideoElement ? 'canplaythrough' : 'load'
      el.addEventListener('progress', onProgress)
      el.addEventListener(doneEvent, markDone)
      el.addEventListener('error', markDone)
      cleanups.push(() => {
        el.removeEventListener('progress', onProgress)
        el.removeEventListener(doneEvent, markDone)
        el.removeEventListener('error', markDone)
      })

      if (el instanceof HTMLImageElement && el.complete) markDone()
      else if (el instanceof HTMLVideoElement && el.readyState >= 3) markDone()
    }

    document.querySelectorAll('img').forEach((img) => track(img as HTMLImageElement))
    document.querySelectorAll('video').forEach((video) => track(video as HTMLVideoElement))
    document.querySelectorAll('*').forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage
      const match = bg.match(/url\(["']?([^"')]+)["']?\)/)
      if (match?.[1]) {
        const proxy = new Image()
        track(proxy)
        proxy.src = match[1]
      }
    })

    if (assets.length === 0) assets.push({ frac: 1 })
    tryFinish()

    return () => {
      window.clearTimeout(pendingRecheck)
      cleanups.forEach((fn) => fn())
      gsap.killTweensOf(counter)
      lenisStore.start()
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-transparent"
    >
      <div ref={leftHalfRef} className="absolute top-0 left-0 w-1/2 h-full bg-white" />
      <div ref={rightHalfRef} className="absolute top-0 right-0 w-1/2 h-full bg-white" />
      <div ref={contentRef} className="relative z-10">
        <span className="text-5xl font-bold leading-none text-black sm:text-7xl">
          <span ref={counterRef}>0</span>
        </span>
      </div>
    </div>
  )
}
