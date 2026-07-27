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
  // Rotation/translation (open/close) lives on the <g> wrappers; hover
  // thickness lives on the <rect>s inside via CSS scale — kept on separate
  // elements so GSAP's inline transform and the CSS transition never fight
  // over the same `transform` property.
  const topRef = useRef<SVGGElement>(null)
  const bottomRef = useRef<SVGGElement>(null)

  // Open/close: the two bars rotate to meet in the middle and form an ×,
  // each keeping its own thickness (the thick bar becomes one diagonal,
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

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? closeLabel : openLabel}
      aria-expanded={isOpen}
      className={`group ${className ?? ''}`}
    >
      <svg width="32" height="32" viewBox="0 0 32 32">
        <g ref={topRef}>
          <rect
            x="4" y={12 - THICK / 2} width="24" height={THICK} rx={THICK / 2}
            fill="currentColor"
            className="origin-center scale-y-100 transition-transform duration-300 ease-in-out group-hover:scale-y-50"
          />
        </g>
        <g ref={bottomRef}>
          <rect
            x="4" y={20 - THICK / 2} width="24" height={THICK} rx={THICK / 2}
            fill="currentColor"
            className="origin-center scale-y-50 transition-transform duration-300 ease-in-out group-hover:scale-y-100"
          />
        </g>
      </svg>
    </button>
  )
}
