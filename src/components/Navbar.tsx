import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextReveal } from './ui/cascade-text'
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

// Phones get a permanently visible navbar (no scroll-linked reveal); tracked
// once up front so first paint is already correct instead of flashing the
// desktop behaviour for a frame.
// ponytail: read once, not on resize — this site doesn't support rotating a
// phone into desktop width mid-session, so a resize listener buys nothing.
function isPhoneViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 639.9px)').matches
}

export default function Navbar({ onContactOpen }: Props) {
  const [visible, setVisible] = useState(isPhoneViewport)
  const [isLightBg, setIsLightBg] = useState(false)
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const isPhone = useRef(isPhoneViewport()).current
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
      // Phone navbar is permanently visible (no scroll-linked reveal), but it
      // has no background of its own, so it samples what's behind it just
      // like desktop does.
      if (!isPhone) {
        const spacerH = spacer?.offsetHeight ?? window.innerHeight * 4
        const progress = Math.min(1, window.scrollY / spacerH)

        // Show once the train rush starts blurring (~50% through the cinematic).
        setVisible(progress >= 0.5)
      }

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
    // The background also changes without scroll events — the preloader
    // panels slide away, and sections reveal/animate in after scrolling
    // settles — so scroll sampling alone goes stale on every viewport. A
    // cheap poll keeps the icon color in sync between scrolls.
    // ponytail: 500ms interval over a MutationObserver — sampling is a few
    // getComputedStyle calls, and the observer would need the same debounce.
    const pollId = window.setInterval(update, 500)
    return () => {
      window.removeEventListener('scroll', update)
      window.clearInterval(pollId)
    }
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

  // Follows the sampled background everywhere; the open phone panel is white,
  // so the × over it is always black regardless of what the page shows.
  const lightBehind = isLightBg || (isPhone && open)
  const textColor = lightBehind ? '#000000' : 'rgba(255,255,255,0.9)'

  return (
    <nav
      ref={navRef}
      className="fixed top-0 right-0 z-[40] flex items-center gap-3 p-4 sm:gap-5 sm:p-6"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Phones only: hamburger drops a half-screen panel instead of the
          leftward-expanding list (that list has no room to grow on a phone
          width). Placed before the list/icons in the DOM so it paints
          underneath them and never blocks the close tap. White to match the
          now-permanent white top bar, with its own language toggle since
          there's no room for one in the collapsed phone bar. */}
      <div
        className="fixed inset-x-0 top-0 z-[35] overflow-hidden bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] sm:hidden"
        style={{
          height: open ? '50vh' : '0px',
          transition: 'height 0.4s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-10">
          <ul className="flex flex-col items-center gap-7">
            {navItems.map(({ key, target, pinId }) => (
              <li key={key}>
                <a
                  href={target ?? '#'}
                  onClick={(e) => { e.preventDefault(); handleClick(target, pinId) }}
                >
                  <TextReveal
                    as="span"
                    text={t(`nav.${key}`)}
                    fontSize="inherit"
                    color="#000000"
                    hoverColor="#000000"
                    className="text-2xl !tracking-[0.22em]"
                  />
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'lt' : 'en')}
            aria-label={language === 'en' ? 'Switch to Lithuanian' : 'Perjungti į anglų kalbą'}
            className="cursor-pointer border-t border-black/10 pt-6 text-sm font-bold tracking-[0.2em] text-black"
          >
            <span style={{ opacity: language === 'en' ? 1 : 0.35 }}>EN</span>
            <span className="mx-1 opacity-35">/</span>
            <span style={{ opacity: language === 'lt' ? 1 : 0.35 }}>LT</span>
          </button>
        </div>
      </div>

      {/* Collapsed to zero width behind the icon; expands leftward (the nav
          is right-anchored, so growth reads as sliding out to the left)
          rather than a full-screen overlay. maxWidth is clamped to the
          viewport (minus this row's own padding) so the longest Lithuanian
          labels can never overflow past the left edge of the screen and get
          silently clipped there. Desktop only now — phones use the
          half-screen panel above instead. */}
      <ul
        className="hidden items-center justify-end gap-x-3 gap-y-1 overflow-hidden sm:flex sm:flex-nowrap sm:gap-x-6"
        style={{
          // Reserves room for this row's own padding + gaps + the language
          // toggle + hamburger (~9rem at the mobile scale) so the cap itself
          // never invites overflow; flex-wrap above is the backstop for
          // whatever that estimate still doesn't cover (e.g. the longest
          // Lithuanian labels on the very smallest phones).
          maxWidth: open ? 'min(480px, calc(100vw - 9rem))' : '0px',
          opacity: open ? 1 : 0,
          transition:
            'max-width 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease',
        }}
      >
        {navItems.map(({ key, target, pinId }) => (
          <li key={key} className="whitespace-nowrap text-sm sm:text-xl">
            <a
              href={target ?? '#'}
              onClick={(e) => { e.preventDefault(); handleClick(target, pinId) }}
            >
              <TextReveal
                as="span"
                text={t(`nav.${key}`)}
                fontSize="inherit"
                color={textColor}
                hoverColor={textColor}
                style={{ padding: 0 }}
                className="!tracking-[0.12em] sm:!tracking-[0.22em]"
              />
            </a>
          </li>
        ))}
      </ul>

      {/* Language toggle — desktop only; phones get one inside the dropdown
          panel above instead, where there's actually room for it. Active
          language stays full opacity, the other dims. */}
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'lt' : 'en')}
        aria-label={language === 'en' ? 'Switch to Lithuanian' : 'Perjungti į anglų kalbą'}
        className="hidden shrink-0 cursor-pointer text-sm font-bold tracking-[0.15em] sm:block"
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
