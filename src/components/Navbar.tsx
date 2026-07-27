import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextReveal } from './ui/cascade-text'
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

  // Close the panel on outside click or Escape.
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

  // Lock / unlock Lenis scroll while the panel covers the page.
  useEffect(() => {
    if (open) lenisStore.stop()
    else lenisStore.start()
  }, [open])

  function handleClick(target: string | null, pinId: string | null) {
    setOpen(false)
    if (!target) { onContactOpen(); return }

    // The effect that resumes Lenis on `open` becoming false only runs on
    // the next render — too late for the scrollTo below, which would
    // silently no-op against a still-stopped instance. Resume it here too.
    lenisStore.start()

    // A pinned section stays `position:fixed` for its entire scrubbed scroll
    // range, so its own bounding rect always reads "already at the top" —
    // even scrolled deep into it (mid-gallery, or past the phase-2 slide).
    // Scroll to the trigger's real start position instead of the (frozen)
    // element position, so the nav link works no matter how far in we are.
    const pinStart = pinId ? ScrollTrigger.getById(pinId)?.start : undefined
    lenisStore.scrollTo(pinStart ?? target)
  }

  // Fully opaque — the fused-square icon relies on the four squares landing
  // exactly edge-to-edge on hover, and any alpha here would turn the tiniest
  // sub-pixel overlap between them into a visible darker seam.
  const textColor = isLightBg ? '#000000' : '#ffffff'

  return (
    <nav
      ref={navRef}
      className="fixed top-0 right-0 z-[40] flex items-center p-4 sm:p-6"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Trigger — four squares that fuse into one solid block on hover,
          replacing the old hamburger/× morph. The panel below has its own
          Close control, so this button only ever opens. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('nav.openMenu')}
        className="group flex shrink-0 cursor-pointer items-center"
        style={{ color: textColor }}
      >
        <span className="relative block h-6 w-6 shrink-0">
          <span className="absolute left-0 top-0 h-[10px] w-[10px] bg-current transition-transform duration-300 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px]" />
          <span className="absolute right-0 top-0 h-[10px] w-[10px] bg-current transition-transform duration-300 ease-out group-hover:-translate-x-[2px] group-hover:translate-y-[2px]" />
          <span className="absolute bottom-0 left-0 h-[10px] w-[10px] bg-current transition-transform duration-300 ease-out group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
          <span className="absolute bottom-0 right-0 h-[10px] w-[10px] bg-current transition-transform duration-300 ease-out group-hover:-translate-x-[2px] group-hover:-translate-y-[2px]" />
        </span>
      </button>

      {/* Panel — full-height, slides in from the right over the whole page.
          Mirrors ContactModal's slide-in mechanics for a consistent feel. */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[45]">
            <motion.div
              className="absolute inset-0 bg-black/60"
              style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto bg-black px-7 py-6 sm:w-[460px] sm:px-10 sm:py-8"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[10px] tracking-[0.28em] text-white/70">
                  <span aria-hidden className="inline-block h-[6px] w-[6px] bg-white/70" />
                  {t('nav.menu').toUpperCase()}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  aria-label={t('nav.closeMenu')}
                  className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {t('modal.close')}
                  <span aria-hidden className="text-lg leading-none">&times;</span>
                </button>
              </div>

              <ul className="mt-16 flex flex-col">
                {navItems.map(({ key, target, pinId }) => (
                  <li key={key} className="border-b border-white/15 first:border-t">
                    <a
                      href={target ?? '#'}
                      onClick={(e) => { e.preventDefault(); handleClick(target, pinId) }}
                      className="block py-6"
                    >
                      <TextReveal
                        as="span"
                        text={t(`nav.${key}`)}
                        fontSize="inherit"
                        color="#ffffff"
                        hoverColor="#ffffff"
                        className="!text-4xl sm:!text-5xl"
                        style={{ padding: 0, letterSpacing: 'normal' }}
                      />
                    </a>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'lt' : 'en')}
                aria-label={language === 'en' ? 'Switch to Lithuanian' : 'Perjungti į anglų kalbą'}
                className="mt-auto w-fit cursor-pointer border-t border-white/15 pt-6 text-sm font-bold tracking-[0.2em] text-white"
              >
                <span style={{ opacity: language === 'en' ? 1 : 0.4 }}>EN</span>
                <span className="mx-1 opacity-40">/</span>
                <span style={{ opacity: language === 'lt' ? 1 : 0.4 }}>LT</span>
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </nav>
  )
}
