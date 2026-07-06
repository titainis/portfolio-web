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

    const counter = { value: 0 }
    const tl = gsap.timeline({
      onComplete: () => {
        lenisStore.start()
        setMounted(false)
      },
    })

    tl.to(counter, {
      value: 100,
      duration: 1.6,
      ease: 'power1.inOut',
      onUpdate: () => {
        counterEl.textContent = String(Math.floor(counter.value))
      },
    })
      .to(content, { autoAlpha: 0, duration: 0.3 }, '<')
      .to(leftHalf, { x: '-100%', duration: 1.2, ease: 'power4.inOut' }, '<')
      .to(rightHalf, { x: '100%', duration: 1.2, ease: 'power4.inOut' }, '<')

    return () => {
      tl.kill()
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
