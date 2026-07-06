import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../context/LanguageContext'

export default function CursorScroll() {
  const { t } = useTranslation()
  const spanRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(true)

  const target = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const pos    = useRef({ ...target.current })
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
    }

    const tick = () => {
      const ease = reduce ? 1 : 0.03
      pos.current.x += (target.current.x - pos.current.x) * ease
      pos.current.y += (target.current.y - pos.current.y) * ease
      if (spanRef.current) {
        spanRef.current.style.transform =
          `translate3d(${pos.current.x}px,${pos.current.y}px,0) translate(-50%,-50%)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    const spacer = document.querySelector<HTMLElement>('.cinematic-phase1-spacer')
    const onScroll = () => {
      const spacerH = spacer?.offsetHeight ?? window.innerHeight * 4
      setVisible(Math.min(1, window.scrollY / spacerH) < 0.5)
    }

    window.addEventListener('mousemove', onMove,   { passive: true })
    window.addEventListener('scroll',    onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll',    onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <span
      ref={spanRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[45] will-change-transform text-[11px] font-bold tracking-[0.3em] text-white"
      style={{
        transform: `translate3d(${pos.current.x}px,${pos.current.y}px,0) translate(-50%,-50%)`,
        // When hidden: opacity 0 + animation stopped. When visible: animation
        // drives opacity; transition handles the fade-out when hiding.
        opacity:   visible ? undefined : 0,
        animation: visible ? 'scroll-blink 2.5s ease-in-out infinite' : 'none',
        transition: 'opacity 0.5s ease',
      }}
    >
      {t('hero.scroll')}
    </span>
  )
}
