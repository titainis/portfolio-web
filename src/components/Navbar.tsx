import { useEffect, useState } from 'react'
import Shuffle from './ui/Shuffle'
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

  useEffect(() => {
    function update() {
      // Derive progress from scroll position directly so it works before and
      // after GSAP initialises the CSS variable.
      const spacer = document.querySelector<HTMLElement>('.cinematic-phase1-spacer')
      const spacerH = spacer?.offsetHeight ?? window.innerHeight * 4
      const progress = Math.min(1, window.scrollY / spacerH)

      // Show once the train rush starts blurring (~50% through the cinematic).
      setVisible(progress >= 0.5)

      const about = document.getElementById('about')
      if (about) {
        const { top, bottom } = about.getBoundingClientRect()
        // About section has a light (#ededed) background — switch to dark text
        // when it overlaps the navbar area (top 80 px).
        setIsLightBg(top <= 80 && bottom > 0)
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
                tag="span"
                shuffleDirection="right"
                duration={0.26}
                stagger={0.02}
                animationMode="evenodd"
                triggerOnce={true}
                triggerOnHover={true}
                threshold={0}
                rootMargin="10000px"
                textAlign="left"
                className="text-xl font-extrabold tracking-[0.22em] cursor-pointer"
                style={{ color: textColor, transition: 'color 0.4s ease' }}
                respectReducedMotion={true}
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
