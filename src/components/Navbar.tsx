import { useEffect, useRef, useState } from 'react'
import Shuffle, { shufflePreset } from './ui/Shuffle'
import { lenisStore } from '../cinematic/lenisStore'

const navItems = [
  { label: 'ABOUT',   target: '#about' },
  { label: 'WORK',    target: '#work'  },
  { label: 'CONTACT', target: null     },
]

interface Props {
  onContactOpen: () => void
}

export default function Navbar({ onContactOpen }: Props) {
  const [visible, setVisible] = useState(false)
  const [isLightBg, setIsLightBg] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Both elements are static for the life of the page — look them up once,
    // not on every scroll event.
    const spacer = document.querySelector<HTMLElement>('.cinematic-phase1-spacer')
    const about = document.getElementById('about')

    function update() {
      const spacerH = spacer?.offsetHeight ?? window.innerHeight * 4
      const progress = Math.min(1, window.scrollY / spacerH)

      // Show once the train rush starts blurring (~50% through the cinematic).
      setVisible(progress >= 0.5)

      // Sample the background directly under the nav text's own vertical
      // center, rather than a magic pixel offset, so the color flips exactly
      // when a section's edge actually reaches the text — not before or after.
      const navRect = navRef.current?.getBoundingClientRect()
      const sampleY = navRect ? (navRect.top + navRect.bottom) / 2 : 0

      if (about) {
        const { top, bottom } = about.getBoundingClientRect()
        // About section has a light background — switch to dark text only
        // while it's actually behind the nav text.
        setIsLightBg(top <= sampleY && bottom > sampleY)
      }
    }

    window.addEventListener('scroll', update, { passive: true })
    // Run once immediately so the navbar is correct on first paint / page reload.
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  function handleClick(target: string | null) {
    if (!target) { onContactOpen(); return }
    lenisStore.scrollTo(target)
  }

  const textColor = isLightBg ? '#000000' : 'rgba(255,255,255,0.9)'

  return (
    <nav
      ref={navRef}
      className="fixed top-0 right-0 z-[40] flex justify-end p-6"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
      <ul className="flex items-center gap-6">
        {navItems.map(({ label, target }) => (
          <li key={label}>
            <a
              href={target ?? '#'}
              onClick={(e) => { e.preventDefault(); handleClick(target) }}
            >
              <Shuffle
                text={label}
                {...shufflePreset}
                className="text-xl font-extrabold tracking-[0.22em] cursor-pointer"
                style={{ color: textColor }}
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
