import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TiltCard } from './ui/be-ui-tilt-card'
import { TextReveal } from './ui/cascade-text'
import { lenisStore } from '../cinematic/lenisStore'
import { useTranslation } from '../context/LanguageContext'

// Formspree form ID — submissions POST straight to https://formspree.io/f/<id>,
// which forwards them to the email configured on formspree.io.
const FORMSPREE_ID = 'mkolewwy'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', details: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, boolean>>>({})

  // Lock / unlock Lenis scroll while modal is open
  useEffect(() => {
    if (open) {
      lenisStore.stop()
    } else {
      lenisStore.start()
      // Reset form state after close animation settles
      const timeoutId = setTimeout(() => {
        setStatus('idle')
        setForm({ name: '', email: '', details: '' })
        setErrors({})
      }, 300)
      return () => clearTimeout(timeoutId)
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
    const nextErrors = {
      name: !form.name.trim(),
      email: !form.email.trim(),
      details: !form.details.trim(),
    }
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
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

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => (er[field] ? { ...er, [field]: false } : er))
  }

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
          {/* Backdrop — blur radius is held constant and only opacity
              animates. Animating the blur radius itself forces the browser
              to resample everything behind it on every frame, which reads
              as a laggy "catch-up" instead of a smooth transition; fading in
              an already-blurred layer is compositor-only work and looks just
              as much like the scene "smoothly defocusing". */}
          <motion.div
            className="absolute inset-0 bg-black/75"
            style={{ backdropFilter: 'blur(64px)', WebkitBackdropFilter: 'blur(64px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
          />

          {/* Card — folds down into place like a hinged sheet of paper,
              instead of just fading/scaling in. Origin at the top edge +
              perspective on the wrapper are what sell the fold: rotateX
              alone (no perspective) would just look like a flat squash. */}
          <motion.div
            className="relative z-10 w-full max-w-[480px]"
            style={{ perspective: 1400 }}
          >
            <motion.div
              style={{ transformOrigin: 'top center', transformPerspective: 1400 }}
              initial={{ opacity: 0, rotateX: -100, y: -24 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, rotateX: -80, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
            <TiltCard max={5} className="bg-black border border-white/10 p-8 sm:p-10">

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label={t('modal.close')}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <span aria-hidden className="text-lg leading-none">&times;</span>
              </button>

              {/* Heading */}
              <div className="mb-8">
                <p className="mb-2 text-xs tracking-[0.32em] text-white/35">{t('modal.getInTouch')}</p>
                <h2 className="text-[2.4rem] font-bold leading-[0.95] text-white">
                  {t('modal.headingLine1')}<br />{t('modal.headingLine2')}
                </h2>
              </div>

              {/* Success state */}
              {status === 'success' ? (
                <div className="flex flex-col gap-3 py-6">
                  <p className="text-white/90 text-base tracking-wide">
                    {t('modal.successMessage')}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 w-full border border-white/20 py-3 text-xs font-medium tracking-[0.25em] text-white/60 transition-colors hover:border-white/40 hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    {t('modal.close')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* NAME */}
                  <div>
                    <label className="mb-2 block text-xs tracking-[0.25em] text-white/35">
                      {t('modal.nameLabel')}
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={set('name')}
                      placeholder={t('modal.namePlaceholder')}
                      className={`w-full border bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/20 focus:outline-none transition-colors ${errors.name ? 'border-red-400/60 focus:border-red-400/60' : 'border-white/10 focus:border-white/30'}`}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs tracking-wide text-red-400/80">{t('modal.required')}</p>
                    )}
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="mb-2 block text-xs tracking-[0.25em] text-white/35">
                      {t('modal.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder={t('modal.emailPlaceholder')}
                      className={`w-full border bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/20 focus:outline-none transition-colors ${errors.email ? 'border-red-400/60 focus:border-red-400/60' : 'border-white/10 focus:border-white/30'}`}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs tracking-wide text-red-400/80">{t('modal.required')}</p>
                    )}
                  </div>

                  {/* PROJECT DETAILS */}
                  <div>
                    <label className="mb-2 block text-xs tracking-[0.25em] text-white/35">
                      {t('modal.detailsLabel')}
                    </label>
                    <textarea
                      rows={4}
                      value={form.details}
                      onChange={set('details')}
                      placeholder={t('modal.detailsPlaceholder')}
                      className={`w-full resize-none border bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/20 focus:outline-none transition-colors ${errors.details ? 'border-red-400/60 focus:border-red-400/60' : 'border-white/10 focus:border-white/30'}`}
                    />
                    {errors.details && (
                      <p className="mt-1.5 text-xs tracking-wide text-red-400/80">{t('modal.required')}</p>
                    )}
                  </div>

                  {status === 'error' && (
                    <p className="text-xs tracking-wide text-red-400/80">
                      {t('modal.errorMessage')}
                    </p>
                  )}

                  {/* CTA — filled white, inverts to black on hover/focus; the
                      cascade text flip syncs its color with the bg invert so
                      the label always stays legible. */}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`mt-1 w-full overflow-hidden border border-white bg-white text-xs transition-colors duration-300 hover:bg-black disabled:opacity-50 disabled:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${status === 'loading' ? 'pointer-events-none' : ''}`}
                  >
                    <TextReveal
                      as="span"
                      text={status === 'loading' ? t('modal.sending') : t('modal.submit')}
                      fontSize="inherit"
                      color="#000000"
                      hoverColor="#ffffff"
                      className="!flex !w-full !justify-center"
                      style={{ padding: '0.875rem 0', letterSpacing: '0.28em' }}
                    />
                  </button>
                </form>
              )}
            </TiltCard>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
