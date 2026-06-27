import { useRef, useState } from 'react'
import { LogIn, UserPlus, Menu, X } from 'lucide-react'
import CinematicScrollLayer from './cinematic/CinematicScrollLayer'

const navLinks = ['About', 'Services', 'Projects', 'Contacts']

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Hero text refs. Visibility/transform are driven entirely by scroll progress
  // in GSAP (no React state, no onComplete). These styles are the static
  // initial-hidden state; they stay constant across renders so React never
  // reverts the values GSAP scrubs. Interactivity is gated by the fixed overlay.
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
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6">
        {/* Logo */}
        <a
          href="#"
          className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-[#1f2a1d]"
        >
          LinkFlow™
        </a>

        {/* Desktop navigation pill */}
        <div className="hidden md:flex items-center bg-white/70 backdrop-blur-md rounded-full pl-6 pr-1 py-1 shadow-sm border border-white/60">
          <ul className="flex items-center gap-6 text-sm">
            {navLinks.map((link, i) => (
              <li key={link}>
                <a
                  href="#"
                  className={
                    i === 0
                      ? 'font-semibold text-[#1f2a1d]'
                      : 'font-medium text-[#4b5b47] hover:text-[#1f2a1d]'
                  }
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#"
            className="ml-6 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            Get Started
          </a>
        </div>

        {/* Right-side buttons (desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#"
            className="flex items-center text-sm font-medium gap-2 text-[#1f2a1d] hover:opacity-80 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            Sign Me Up!
          </a>
          <a
            href="#"
            className="flex items-center text-sm font-medium gap-2 text-[#1f2a1d] hover:opacity-80 transition-opacity"
          >
            <LogIn className="h-4 w-4" />
            Enter
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-[#1f2a1d] hover:opacity-80 transition-opacity"
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Mobile slide-out drawer */}
      <aside
        className={`fixed top-0 right-0 z-40 h-full w-72 max-w-[80%] bg-white shadow-xl transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 sm:py-6">
          <span className="text-lg font-semibold tracking-tight text-[#1f2a1d]">
            LinkFlow™
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="text-[#1f2a1d] hover:opacity-80 transition-opacity"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <ul className="flex flex-col gap-1 px-6 py-4">
          {navLinks.map((link, i) => (
            <li key={link}>
              <a
                href="#"
                onClick={() => setMenuOpen(false)}
                className={`block py-2 ${
                  i === 0
                    ? 'font-semibold text-[#1f2a1d]'
                    : 'font-medium text-[#4b5b47] hover:text-[#1f2a1d]'
                }`}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4 px-6 py-4">
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="flex items-center text-sm font-medium gap-2 text-[#1f2a1d] hover:opacity-80 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            Sign Me Up!
          </a>
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="flex items-center text-sm font-medium gap-2 text-[#1f2a1d] hover:opacity-80 transition-opacity"
          >
            <LogIn className="h-4 w-4" />
            Enter
          </a>
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium px-5 py-2.5 rounded-full text-center transition-colors"
          >
            Get Started
          </a>
        </div>
      </aside>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6">
        <h1
          ref={heroHeadingRef}
          className="font-normal leading-[0.95] text-[#336443] text-[2rem] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem] max-w-5xl"
          style={{
            fontFamily:
              '"Neue Haas Grotesk Display Pro 55 Roman", "Neue Haas Grotesk Text Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
            letterSpacing: '-0.035em',
            ...heroHiddenStyle,
          }}
        >
          Close the rift{' '}
          <span className="text-[#85AB8B]">
            linking
            <br className="hidden sm:block" /> signals and action
          </span>
        </h1>

        <p
          ref={heroParagraphRef}
          className="mt-6 sm:mt-8 text-[#4b5b47] text-sm sm:text-base md:text-lg leading-relaxed max-w-md px-2"
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
