import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProximityText from './ui/proximity-text'
import HamburgerButton from './HamburgerButton'
import { lenisStore } from '../cinematic/lenisStore'
import { useTranslation } from '../context/LanguageContext'

// `key` looks up the label in nav.<key>; `pinId` names the ScrollTrigger (if
// any) that pins this section — see the comment in handleClick() for why
// that matters.
const navItems = [
  { key: 'about',   target: '#about', pinId: null         },
  { key: 'work',    target: '#work',  pinId: 'work-pin'   },
  { key: 'contact', target: null,     pinId: null         },
]

interface Props {
  onContactOpen: () => void
}

// Parses a computed rgb()/rgba() string into a 0–255 perceptual luminance,
// or null if the color is transparent (so the caller can keep walking up).
function luminanceOf(color: string): number | null {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(color)
  if (!m) return null
  const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1
  if (alpha < 0.5) return null
  return (Number(m[1]) * 299 + Number(m[2]) * 587 + Number(m[3]) * 114) / 1000
}

export default function Navbar({ onContactOpen }: Props) {
  const [visible, setVisible] = useState(false)
  const [isLightBg, setIsLightBg] = useState(false)
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const { language, setLanguage, t } = useTranslation()

  useEffect(() => {
    // Static for the life of the page — look it up once, not on every scroll event.
    const spacer = document.querySelector<HTMLElement>('.cinematic-phase1-spacer')

    // Samples whatever is actually rendered under the nav's own position and
    // walks up the DOM until it finds a solid background color — the nav's
    // color always follows what's really behind it, not a hardcoded list of
    // section ids (those go stale the moment z-order or reveal timing
    // changes, which is exactly what broke this before).
    function sampleBg(x: number, y: number): number | null {
      const nav = navRef.current
      const prevPE = nav?.style.pointerEvents
      if (nav) nav.style.pointerEvents = 'none'
      let el = document.elementFromPoint(x, y) as HTMLElement | null
      if (nav) nav.style.pointerEvents = prevPE ?? ''

      while (el) {
        const lum = luminanceOf(getComputedStyle(el).backgroundColor)
        if (lum !== null) return lum
        el = el.parentElement
      }
      return null
    }

    function update() {
      const spacerH = spacer?.offsetHeight ?? window.innerHeight * 4
      const progress = Math.min(1, window.scrollY / spacerH)

      // Show once the train rush starts blurring (~50% through the cinematic).
      setVisible(progress >= 0.5)

      const navRect = navRef.current?.getBoundingClientRect()
      const sampleX = navRect ? navRect.left + navRect.width / 2 : window.innerWidth - 60
      const sampleY = navRect ? (navRect.top + navRect.bottom) / 2 : 40

      const lum = sampleBg(sampleX, sampleY)
      // No solid color found (e.g. still over the photographic cinematic
      // layers) — that's always a dark scene here, so keep the light text.
      setIsLightBg(lum !== null && lum > 150)
    }

    window.addEventListener('scroll', update, { passive: true })
    // Run once immediately so the navbar is correct on first paint / page reload.
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  // Close the expanded menu on outside click or Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleClick(target: string | null, pinId: string | null) {
    setOpen(false)
    if (!target) { onContactOpen(); return }

    // A pinned section stays `position:fixed` for its entire scrubbed scroll
    // range, so its own bounding rect always reads "already at the top" —
    // even scrolled deep into it (mid-gallery, or past the phase-2 slide).
    // Scroll to the trigger's real start position instead of the (frozen)
    // element position, so the nav link works no matter how far in we are.
    const pinStart = pinId ? ScrollTrigger.getById(pinId)?.start : undefined
    lenisStore.scrollTo(pinStart ?? target)
  }

  const textColor = isLightBg ? '#000000' : 'rgba(255,255,255,0.9)'

  return (
    <nav
      ref={navRef}
      className="fixed top-0 right-0 z-[40] flex items-center gap-5 p-6"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Collapsed to zero width behind the icon; expands leftward (the nav
          is right-anchored, so growth reads as sliding out to the left)
          rather than a full-screen overlay. */}
      <ul
        className="flex items-center gap-6 overflow-hidden"
        style={{
          maxWidth: open ? '480px' : '0px',
          opacity: open ? 1 : 0,
          transition:
            'max-width 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease',
        }}
      >
        {navItems.map(({ key, target, pinId }) => (
          <li key={key} className="whitespace-nowrap">
            <a
              href={target ?? '#'}
              onClick={(e) => { e.preventDefault(); handleClick(target, pinId) }}
            >
              <ProximityText
                text={t(`nav.${key}`)}
                radius={80}
                className="text-xl font-extrabold tracking-[0.22em] cursor-pointer"
                style={{ color: textColor }}
              />
            </a>
          </li>
        ))}
      </ul>

      {/* Language toggle — always visible, independent of the collapsing
          nav-link list. Active language stays full opacity, the other dims. */}
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'lt' : 'en')}
        aria-label={language === 'en' ? 'Switch to Lithuanian' : 'Perjungti į anglų kalbą'}
        className="shrink-0 cursor-pointer text-sm font-bold tracking-[0.15em]"
        style={{ color: textColor }}
      >
        <span style={{ opacity: language === 'en' ? 1 : 0.4 }}>EN</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ opacity: language === 'lt' ? 1 : 0.4 }}>LT</span>
      </button>

      {/* Hamburger, morphs into an × while the menu is open. */}
      <span style={{ color: textColor }}>
        <HamburgerButton
          isOpen={open}
          onClick={() => setOpen((o) => !o)}
          className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center"
          openLabel={t('nav.openMenu')}
          closeLabel={t('nav.closeMenu')}
        />
      </span>
    </nav>
  )
}
