import { useState } from 'react'
import { RotatingText } from '@/components/ui/rotating-text'

const services = [
  {
    n: '01',
    title: 'Web Development',
    body: 'Fast, modern websites built to convert.',
    image: 'https://picsum.photos/seed/web-development-studio/160/160',
  },
  {
    n: '02',
    title: 'E-Commerce',
    body: 'Stores that sell, optimised for revenue.',
    image: 'https://picsum.photos/seed/ecommerce-storefront/160/160',
  },
  {
    n: '03',
    title: 'Web Applications',
    body: 'Simple, powerful tools your team will use.',
    image: 'https://picsum.photos/seed/web-app-dashboard/160/160',
  },
  {
    n: '04',
    title: 'AI Solutions',
    body: 'AI features woven directly into your product.',
    image: 'https://picsum.photos/seed/ai-solutions-tech/160/160',
  },
]

export default function AboutSection() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section id="about" className="relative z-30 w-full overflow-hidden bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-32 sm:px-10 md:gap-40 md:px-20 md:py-64">

        {/* ── INTRO ─────────────────────────────────────────────────────── */}
        <p className="max-w-xl text-[23.12px] font-light [&_*]:leading-[3rem] [word-spacing:0.5em] text-black md:text-2xl">
          <span>We provide </span>
          <RotatingText
            words={[
              'Website Development',
              'E-Commerce Solutions',
              'Web Applications',
              'AI Solutions',
            ]}
            interval={2500}
            className="font-semibold text-black align-bottom"
          />
          <span>
            . We're a small studio with an outsized obsession for the details —
            from the first wireframe to the final deploy. Every project starts
            with listening: your users, your constraints, your ambitions,
            before a single line of code is written.
          </span>
        </p>

        {/* Spacer between the intro description and the "what we build" list */}
        <div className="my-12 py-16 md:my-20 md:py-24" />

        {/* ── WHAT WE BUILD ─────────────────────────────────────────────── */}
        <div className="relative">

          <div className="relative z-10 pl-[32vw] pr-[10vw] md:pl-[32vw] md:pr-[12vw]">
            <span className="text-2xl font-extrabold tracking-[0.20em]">
              What We Do
            </span>

            <ul className="mt-20 flex flex-col items-start gap-8 md:gap-10">
              {services.map((s, i) => {
                const isHovered = hovered === i
                return (
                 <li
                    key={s.n}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    className="relative flex cursor-default items-center gap-3 py-2"
                  >

                    {/* NEW TEXT — absolute, at the very left of the page */}
                    <span
                      className="pointer-events-none absolute left-[-32vw] top-1/2 whitespace-nowrap text-2xl font-bold text-black transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:left-[-50vw] md:text-2xl"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transform: `translateY(-50%) translateX(${isHovered ? '0px' : '20px'})`,
                      }}
                    >
                      {s.body}
                    </span>

                    {/* TITLE CONTAINER — invisible ghost holds width when title fades out */}
                    <span className="relative inline-block">
                      <span className="invisible whitespace-nowrap text-2xl md:text-3xl" aria-hidden="true">
                        {s.title}
                      </span>

                      {/* ORIGINAL TITLE — fades OUT in place */}
                      <span
                        className="absolute inset-0 whitespace-nowrap text-2xl text-black transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-2xl"
                        style={{
                          fontWeight: 400,
                          opacity: isHovered ? 0 : 1,
                        }}
                      >
                        {s.title}
                      </span>
                    </span>

                    {/* BIG TITLE — slides in from the RIGHT on hover */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-full top-1/2 ml-6 hidden whitespace-nowrap text-[9vw] font-semibold leading-none text-black transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:ml-10 md:block"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transform: `translateY(-50%) translateX(${isHovered ? '0px' : '60px'})`,
                      }}
                    >
                      {s.title}
                    </span>

                  </li>
                )
              })}
            </ul>
          </div>
        </div>

      </div>
    </section>
  )
}
