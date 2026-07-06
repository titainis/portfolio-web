import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
  openLabel?: string
  closeLabel?: string
}

const THICK = 3
const THIN = 1.5

export default function HamburgerButton({
  isOpen,
  onClick,
  className,
  openLabel = 'Open menu',
  closeLabel = 'Close menu',
}: HamburgerButtonProps) {
  const topRef = useRef<SVGLineElement>(null)
  const bottomRef = useRef<SVGLineElement>(null)

  // Open/close: the two lines rotate to meet in the middle and form an ×,
  // each keeping its own thickness (the thick line becomes one diagonal,
  // the thin one the other) rather than normalizing to a uniform X.
  useEffect(() => {
    const top = topRef.current
    const bottom = bottomRef.current
    if (!top || !bottom) return

    gsap.set([top, bottom], { transformOrigin: '50% 50%' })

    const duration = 0.4
    const ease = 'power2.inOut'

    gsap.to(top, { rotate: isOpen ? -45 : 0, y: isOpen ? 4 : 0, duration, ease })
    gsap.to(bottom, { rotate: isOpen ? 45 : 0, y: isOpen ? -4 : 0, duration, ease })
  }, [isOpen])

  // Hover: the two lines swap thickness, like a little seesaw.
  const onMouseEnter = () => {
    gsap.to(topRef.current, { attr: { 'stroke-width': THIN }, duration: 0.3, ease: 'power2.inOut' })
    gsap.to(bottomRef.current, { attr: { 'stroke-width': THICK }, duration: 0.3, ease: 'power2.inOut' })
  }
  const onMouseLeave = () => {
    gsap.to(topRef.current, { attr: { 'stroke-width': THICK }, duration: 0.3, ease: 'power2.inOut' })
    gsap.to(bottomRef.current, { attr: { 'stroke-width': THIN }, duration: 0.3, ease: 'power2.inOut' })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={isOpen ? closeLabel : openLabel}
      aria-expanded={isOpen}
      className={className}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        <line
          ref={topRef}
          x1="4" y1="12" x2="28" y2="12"
          stroke="currentColor"
          strokeWidth={THICK}
          strokeLinecap="round"
        />
        <line
          ref={bottomRef}
          x1="4" y1="20" x2="28" y2="20"
          stroke="currentColor"
          strokeWidth={THIN}
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
