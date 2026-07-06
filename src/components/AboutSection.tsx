import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import { useTranslation } from '../context/LanguageContext'

gsap.registerPlugin(ScrollTrigger, CustomEase)
CustomEase.create('workSinkIn', '0.16, 1, 0.3, 1')

const serviceKeys = ['webDev', 'ecommerce', 'webApps', 'aiSolutions'] as const

export default function AboutSection() {
  const [hovered, setHovered] = useState<number | null>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const services = serviceKeys.map((key) => ({
    n: key,
    title: t(`about.services.${key}.title`),
    body: t(`about.services.${key}.body`),
  }))

  useEffect(() => {
    const intro = introRef.current
    if (!intro) return

    const items = intro.querySelectorAll<HTMLElement>('[data-sink-item]')

    const ctx = gsap.context(() => {
      gsap.set(items, { y: -40, autoAlpha: 0 })

      gsap.to(items, {
        y: 0,
        autoAlpha: 1,
        duration: 1.1,
        stagger: 0.12,
        ease: 'workSinkIn',
        scrollTrigger: {
          trigger: intro,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <section id="about" className="relative z-30 w-full overflow-hidden bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-32 sm:px-10 md:gap-40 md:px-20 md:py-64">

        {/* ── INTRO ─────────────────────────────────────────────────────── */}
        <div ref={introRef} className="max-w-xl text-[23.12px] font-light [&_*]:leading-[3rem] text-black md:text-2xl">
          <span data-sink-item className="block">
            {t('about.intro1')}
          </span>
          <span data-sink-item className="block">
            {t('about.intro2')}
          </span>
          <span data-sink-item className="block">
            {t('about.intro3')}
          </span>
          <span data-sink-item className="block">
            {t('about.intro4')}
          </span>

          <span data-sink-item className="mt-20 block">{t('about.tagline')}</span>
        </div>

        {/* Spacer between the intro description and the "what we build" list */}
        <div className="my-8 md:my-12" />

        {/* ── WHAT WE DO ─────────────────────────────────────────────── */}
        <div className="relative">

          {/* The 32vw indent is a desktop layout device (it's also where the
              hover text sits at -32vw, offscreen to the left) — on mobile
              there's no hover reveal to make room for, and eating a third of
              a phone's width left nothing for longer (esp. Lithuanian)
              service titles. */}
          <div className="relative z-10 px-6 sm:px-10 md:pl-[32vw] md:pr-[12vw]">
            <span className="text-2xl font-extrabold tracking-[0.20em]">
              {t('about.whatWeDo')}
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
                      <span className="invisible text-2xl md:whitespace-nowrap md:text-3xl" aria-hidden="true">
                        {s.title}
                      </span>

                      {/* ORIGINAL TITLE — fades OUT in place */}
                      <span
                        className="absolute inset-0 text-2xl text-black transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:whitespace-nowrap md:text-2xl"
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
