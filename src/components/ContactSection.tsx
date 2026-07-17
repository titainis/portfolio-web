import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextReveal } from './ui/cascade-text'
import { CONTACT_REVEALED } from './contactRevealEvent'
import { useTranslation } from '../context/LanguageContext'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  onContactOpen: () => void
}

export default function ContactSection({ onContactOpen }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // Visibility gate — desktop only. There, a fixed section can't be hidden
    // by the hero, because the hero is itself a stack of FIXED layers behind
    // a transparent in-flow spacer — no static z-order can put the (opaque,
    // permanent) landscape above this section during the intro AND below it
    // at the reveal. So it stays hidden until the WORK cover scrolls on
    // screen — from that point it sits safely behind WORK's opaque z-30
    // until the phase-2 slide uncovers it. Scrolling back above WORK re-hides
    // it so it never bleeds through the hero or the intro layers.
    //
    // On mobile WORK is plain in-flow markup (no pin, no slide-away — see
    // WorkSection.tsx), so this section is plain in-flow too and just follows
    // it in normal scroll; it needs none of this fixed/gated behaviour.
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      const trigger = ScrollTrigger.create({
        trigger: '#work',
        start: 'top bottom',
        onEnter: () => gsap.set(section, { autoAlpha: 1 }),
        onLeaveBack: () => gsap.set(section, { autoAlpha: 0 }),
      })
      return () => trigger.kill()
    })

    // Text reveal — tagline/headline/CTA sink up into place once the section
    // is actually reached, instead of already sitting there when it's
    // uncovered. Plays once. ('workSinkIn' ease is registered at module load
    // by About/WorkSection, both imported alongside this component.)
    const items = section.querySelectorAll<HTMLElement>('[data-contact-reveal]')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let played = false
    const play = () => {
      if (played) return
      played = true
      gsap.to(items, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.12, ease: 'workSinkIn' })
    }
    if (!reduced && items.length) {
      gsap.set(items, { y: 40, autoAlpha: 0 })
      // Desktop: the section is fixed and gets uncovered by WORK's pinned
      // slide — its own position never changes, so no scroll trigger can see
      // the reveal. WORK's pin announces it instead.
      window.addEventListener(CONTACT_REVEALED, play)
      // Mobile: plain in-flow section, a normal viewport trigger works.
      mm.add('(max-width: 767.9px)', () => {
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: 'top 70%',
          once: true,
          onEnter: play,
        })
        return () => trigger.kill()
      })
    }

    return () => {
      window.removeEventListener(CONTACT_REVEALED, play)
      mm.revert()
    }
  }, [])

  // Vilnius's current UTC offset (not the visitor's) — computed rather than
  // hardcoded "GMT+3" so it stays correct across the DST switch to GMT+2.
  const vilniusOffset = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Vilnius',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+2'

  return (
    // Permanently fixed, filling the viewport — it never occupies document
    // flow, so it can sit directly behind WORK (z-30) at all times. WORK's
    // own pin (in WorkSection.tsx) is extended to slide itself away via
    // xPercent:-100 once its gallery finishes scrubbing, which is what
    // actually performs the reveal; this section just needs to already be
    // here, one z-index lower, the whole time.
    //
    // z-[25]: above the fixed cinematic layers, below the WORK cover (z-30).
    // Starts visibility:hidden inline so it can't flash over the hero before
    // the gating effect above runs.
    <section
      id="contact"
      ref={sectionRef}
      className="relative z-[25] w-full min-h-dvh overflow-hidden bg-white p-6 text-black sm:p-10 md:fixed md:inset-0 md:invisible md:opacity-0"
    >
      {/* Tagline, headline and CTA sit together as one cluster instead of
          being pinned to separate edges of the viewport. */}
      <div className="flex h-full flex-col justify-center">
        <p data-contact-reveal className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-black">
          {t('contact.tagline')}
        </p>
        <h2 className="text-5xl font-normal leading-[1.05] tracking-tight text-black sm:text-6xl lg:text-7xl">
          {/* Heading stays static — no reveal animation on these lines. */}
          <span className="block">{t('contact.headingLine1')}</span>
          <span className="block">{t('contact.headingLine2')}</span>
        </h2>
        <button
          data-contact-reveal
          type="button"
          onClick={onContactOpen}
          className="group mt-8 inline-flex w-fit items-center gap-2 border-b border-black/30 pb-1 text-xs transition-colors hover:border-black"
        >
          <TextReveal
            as="span"
            text={t('contact.cta')}
            fontSize="inherit"
            color="#000000"
            hoverColor="#000000"
            style={{ padding: 0, letterSpacing: '0.2em' }}
          />
          <span aria-hidden>&rarr;</span>
        </button>
      </div>

      {/* Footer strip — copyright + location left, enquiry + social right. */}
      <div className="absolute inset-x-6 bottom-6 flex flex-col gap-6 sm:inset-x-10 sm:bottom-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1 text-xs tracking-widest text-black/40">
          <p>{t('contact.copyright')}</p>
          <p>{vilniusOffset}, Vilnius</p>
        </div>

        <div className="flex gap-16">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-black/40">
              {t('contact.businessEnquiry')}
            </p>
            <a href="mailto:titasgr0228@gmail.com" className="inline-block text-sm">
              <TextReveal
                as="span"
                text="titasgr0228@gmail.com"
                fontSize="inherit"
                color="#000000"
                hoverColor="#000000"
                style={{ padding: 0, letterSpacing: 'normal', textTransform: 'none' }}
              />
            </a>
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-black/40">
              {t('contact.social')}
            </p>
            <a
              href="https://www.linkedin.com/in/titas-g-4466b135b"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm"
            >
              <TextReveal
                as="span"
                text={t('contact.linkedin')}
                fontSize="inherit"
                color="#000000"
                hoverColor="#000000"
                style={{ padding: 0, letterSpacing: 'normal', textTransform: 'none' }}
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
