import CinematicScrollLayer from './cinematic/CinematicScrollLayer'
import { lenisStore } from './cinematic/lenisStore'
import Shuffle from './components/ui/Shuffle'

const navItems = [
  { label: 'ABOUT',   target: '#about' },
  { label: 'WORK',    target: '#work'  },
  { label: 'CONTACT', target: null     },
]

function scrollTo(target: string | null) {
  if (!target) return
  lenisStore.scrollTo(target)
}

export default function App() {
  return (
    <CinematicScrollLayer>
      <nav className="flex justify-center py-16">
        <ul className="flex items-center gap-10">
          {navItems.map(({ label, target }) => (
            <li key={label}>
              <a
                href={target ?? '#'}
                onClick={(e) => { e.preventDefault(); scrollTo(target) }}
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
                  className="text-xl font-extrabold tracking-[0.22em] text-[#0f172a] cursor-pointer"
                  respectReducedMotion={true}
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </CinematicScrollLayer>
  )
}
