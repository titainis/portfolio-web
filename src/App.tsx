import { useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import CinematicScrollLayer from './cinematic/CinematicScrollLayer'
import { lenisStore } from './cinematic/lenisStore'
import Shuffle from './components/ui/Shuffle'

const navItems = [
  { label: 'ABOUT', target: '#about' },
  { label: 'WORK',  target: '#work'  },
  { label: 'CONTACT', target: null  },
]

function scrollTo(target: string | null) {
  if (!target) return
  lenisStore.scrollTo(target)
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const heroHeadingRef = useRef<HTMLHeadingElement>(null)
  const heroParagraphRef = useRef<HTMLParagraphElement>(null)

  const heroHiddenStyle = {
    opacity: 0,
    transform: 'translateY(20px)',
    visibility: 'hidden' as const,
    willChange: 'opacity, transform',
  }

  return (
    <CinematicScrollLayer
      headingRef={heroHeadingRef}
      paragraphRef={heroParagraphRef}
    >
    <section className="relative w-full min-h-screen bg-transparent overflow-hidden">

      {/* Cinematic gradient: dark top (nav legibility) → transparent (mountain) → dark bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(4,12,24,0.82) 0%, rgba(4,12,24,0.42) 18%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.04) 62%, rgba(4,12,24,0.32) 80%, rgba(4,12,24,0.68) 100%)',
        }}
      />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-end px-4 sm:px-6 md:px-10 py-5 sm:py-6">

        {/* Desktop glassmorphic pill */}
        <div className="hidden md:flex items-center bg-white/10 backdrop-blur-2xl rounded-full pl-7 pr-1.5 py-1.5 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.28)]">
          <ul className="flex items-center gap-7 text-sm">
            {navItems.map(({ label, target }) => (
              <li key={label}>
                <a
                  href={target ?? '#'}
                  onClick={(e) => { e.preventDefault(); scrollTo(target) }}
                  className="block leading-none"
                >
                  <Shuffle
                    text={label}
                    tag="span"
                    shuffleDirection="right"
                    duration={0.28}
                    stagger={0.022}
                    animationMode="evenodd"
                    triggerOnce={true}
                    triggerOnHover={true}
                    threshold={0}
                    rootMargin="10000px"
                    textAlign="left"
                    className="text-sm font-medium tracking-[0.12em] text-white/90 cursor-pointer"
                    respectReducedMotion={true}
                  />
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#"
            className="ml-7 bg-white text-[#0b1220] hover:bg-white/90 text-sm font-medium px-5 py-2.5 rounded-full transition-colors tracking-wide"
          >
            GET OFFER
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-white hover:opacity-80 transition-opacity"
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 right-0 z-40 h-full w-72 max-w-[80%] bg-[#0b1220]/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 sm:py-6">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="text-white/80 hover:opacity-80 transition-opacity"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <ul className="flex flex-col gap-1 px-6 py-4">
          {navItems.map(({ label, target }) => (
            <li key={label}>
              <a
                href={target ?? '#'}
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollTo(target) }}
                className="block py-2 font-medium tracking-widest text-sm text-white/80 hover:text-white transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4 px-6 py-4">
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="bg-white text-[#0b1220] text-sm font-medium px-5 py-2.5 rounded-full text-center transition-colors tracking-wide hover:bg-white/90"
          >
            GET OFFER
          </a>
        </div>
      </aside>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6">
        <h1
          ref={heroHeadingRef}
          className="font-normal leading-[0.95] text-white text-[2rem] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem] max-w-4xl tracking-tight"
          style={{
            fontFamily:
              "'Futura', 'Futura PT', 'Jost', 'Century Gothic', 'Twentieth Century', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            letterSpacing: '-0.03em',
            ...heroHiddenStyle,
          }}
        >
          Building digital experiences{' '}
          <span className="text-[#9fc0dd]">
            that inspire
          </span>
        </h1>

        <p
          ref={heroParagraphRef}
          className="mt-6 sm:mt-8 text-white/70 text-sm sm:text-base md:text-lg leading-relaxed max-w-md px-2"
          style={heroHiddenStyle}
        >
          Shape scattered signals into meaningful outcomes via AI-driven
          workflows.
        </p>
      </div>
    </section>
    </CinematicScrollLayer>
  )
}
