import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TiltCard } from './ui/be-ui-tilt-card'
import { lenisStore } from '../cinematic/lenisStore'
import Shuffle from './ui/Shuffle'

// ─── Formspree setup ────────────────────────────────────────────────────────
// 1. Go to https://formspree.io and create a free account
// 2. Create a new form pointing to titasgr0228@gmail.com
// 3. Copy the form ID (e.g. "xabc1234") and replace the placeholder below
const FORMSPREE_ID = 'YOUR_FORM_ID'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const [form, setForm] = useState({ name: '', email: '', details: '' })
  const [status, setStatus] = useState<Status>('idle')

  // Lock / unlock Lenis scroll while modal is open
  useEffect(() => {
    if (open) {
      lenisStore.stop()
    } else {
      lenisStore.start()
      // Reset form state after close animation settles
      const t = setTimeout(() => {
        setStatus('idle')
        setForm({ name: '', email: '', details: '' })
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // Escape key dismissal
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (FORMSPREE_ID === 'YOUR_FORM_ID') {
      // Fallback: open mailto when Formspree isn't configured yet
      const subject = encodeURIComponent(`Project request from ${form.name}`)
      const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.details}`)
      window.open(`mailto:titasgr0228@gmail.com?subject=${subject}&body=${body}`)
      setStatus('success')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* Backdrop — heavy blur to fully obscure the scene behind */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-3xl"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 w-full max-w-[480px]"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltCard max={5} className="bg-[#0b1220] border border-white/10 p-8 sm:p-10">

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 border border-dashed border-white/25 p-0 transition-colors hover:border-white/50"
              >
                <Shuffle
                  text="CLOSE ×"
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
                  className="inline-block px-3 py-1.5 text-[10px] font-medium tracking-[0.22em] text-white/45 cursor-pointer"
                  respectReducedMotion={true}
                />
              </button>

              {/* Heading */}
              <div className="mb-8">
                <p className="mb-2 text-[10px] tracking-[0.32em] text-white/35">GET IN TOUCH</p>
                <h2 className="text-[2.4rem] font-bold leading-[0.95] text-white">
                  START A<br />PROJECT
                </h2>
              </div>

              {/* Success state */}
              {status === 'success' ? (
                <div className="flex flex-col gap-3 py-6">
                  <p className="text-white/90 text-sm tracking-wide">
                    Your request is on its way — we'll be in touch soon.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 w-full border border-white/20 py-3 text-[10px] font-medium tracking-[0.25em] text-white/60 transition-colors hover:border-white/40 hover:text-white/90"
                  >
                    CLOSE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* NAME */}
                  <div>
                    <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/35">
                      NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Your name"
                      className="w-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/35">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={set('email')}
                      placeholder="your@email.com"
                      className="w-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* PROJECT DETAILS */}
                  <div>
                    <label className="mb-2 block text-[10px] tracking-[0.25em] text-white/35">
                      PROJECT DETAILS
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.details}
                      onChange={set('details')}
                      placeholder="Tell us about your project — what you're building, your timeline, and budget."
                      className="w-full resize-none border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-colors"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-[11px] tracking-wide text-red-400/80">
                      Something went wrong — please try again.
                    </p>
                  )}

                  {/* CTA */}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`mt-1 w-full bg-white p-0 transition-opacity disabled:opacity-50 ${status === 'loading' ? 'pointer-events-none' : ''}`}
                  >
                    <Shuffle
                      text={status === 'loading' ? 'SENDING…' : 'Submit'}
                      tag="span"
                      shuffleDirection="right"
                      duration={0.26}
                      stagger={0.02}
                      animationMode="evenodd"
                      triggerOnce={true}
                      triggerOnHover={true}
                      threshold={0}
                      rootMargin="10000px"
                      textAlign="center"
                      className="block py-3.5 text-[10px] font-medium tracking-[0.28em] text-[#0b1220] cursor-pointer"
                      respectReducedMotion={true}
                    />
                  </button>
                </form>
              )}
            </TiltCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
