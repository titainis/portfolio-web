import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TextReveal } from './ui/cascade-text'
import { lenisStore } from '../cinematic/lenisStore'
import { useTranslation } from '../context/LanguageContext'

// Formspree form ID — submissions POST straight to https://formspree.io/f/<id>,
// which forwards them to the email configured on formspree.io.
const FORMSPREE_ID = 'mkolewwy'

const EMAIL = 'titasgr0228@gmail.com'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

// Underline that grows from the left: a hint on hover, full on focus. One
// absolutely-positioned bar scaled on the X axis — compositor-only, unlike
// animating border-width or width.
const fieldWrap = 'group relative border-b border-white/20 pb-2'
const fieldBar =
  'pointer-events-none absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-[0.35] group-focus-within:!scale-x-100'
const fieldInput =
  'w-full bg-transparent text-lg text-white placeholder:text-white/45 focus:outline-none'

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
        <div className="fixed inset-0 z-[200]">
          {/* Backdrop — blur radius is held constant and only opacity
              animates. Animating the blur radius itself forces the browser
              to resample everything behind it on every frame, which reads
              as a laggy "catch-up" instead of a smooth transition; fading in
              an already-blurred layer is compositor-only work and looks just
              as much like the scene "smoothly defocusing". */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
          />

          {/* Panel — slides in from the right edge, full viewport height. */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto bg-black px-7 py-6 sm:w-[460px] sm:px-10 sm:py-8"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[10px] tracking-[0.28em] text-white/70">
                <span aria-hidden className="inline-block h-[6px] w-[6px] bg-white/70" />
                {t('modal.getInTouch')}
              </p>
              <button
                onClick={onClose}
                aria-label={t('modal.close')}
                className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {t('modal.close')}
                <span aria-hidden className="text-lg leading-none">&times;</span>
              </button>
            </div>

            {/* Heading */}
            <h2 className="mt-12 text-[2.1rem] font-bold leading-[1.05] text-white">
              {t('modal.headingLine1')} {t('modal.headingLine2')}
            </h2>

            {/* Success state */}
            {status === 'success' ? (
              <div className="mt-10 flex flex-col gap-3">
                <p className="text-base tracking-wide text-white/90">{t('modal.successMessage')}</p>
                <button
                  onClick={onClose}
                  className="mt-4 w-full border border-white/20 py-3 text-xs font-medium tracking-[0.25em] text-white/60 transition-colors hover:border-white/40 hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {t('modal.close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-10 flex flex-col gap-9">
                <div className={fieldWrap}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    placeholder={t('modal.nameLabel')}
                    aria-label={t('modal.nameLabel')}
                    className={fieldInput}
                  />
                  <span className={`${fieldBar} ${errors.name ? '!bg-red-400 scale-x-100' : ''}`} />
                </div>

                <div className={fieldWrap}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder={t('modal.emailLabel')}
                    aria-label={t('modal.emailLabel')}
                    className={fieldInput}
                  />
                  <span className={`${fieldBar} ${errors.email ? '!bg-red-400 scale-x-100' : ''}`} />
                </div>

                <div className={fieldWrap}>
                  <textarea
                    rows={3}
                    value={form.details}
                    onChange={set('details')}
                    placeholder={t('modal.detailsLabel')}
                    aria-label={t('modal.detailsLabel')}
                    className={`${fieldInput} resize-none`}
                  />
                  <span className={`${fieldBar} ${errors.details ? '!bg-red-400 scale-x-100' : ''}`} />
                </div>

                {(status === 'error' || Object.values(errors).some(Boolean)) && (
                  <p className="-mt-4 text-xs tracking-wide text-red-400/80">
                    {status === 'error' ? t('modal.errorMessage') : t('modal.required')}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className={`w-fit overflow-hidden text-lg font-bold text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${status === 'loading' ? 'pointer-events-none' : ''}`}
                >
                  <TextReveal
                    as="span"
                    text={`[ ${status === 'loading' ? t('modal.sending') : t('modal.submit')} ]`}
                    fontSize="inherit"
                    color="#ffffff"
                    hoverColor="#ffffff"
                    style={{ padding: 0, letterSpacing: 'normal', textTransform: 'none' }}
                  />
                </button>
              </form>
            )}

            {/* Direct email — pinned to the bottom of the panel. */}
            <p className="mt-auto flex items-center gap-1 pt-12 text-xs tracking-wide text-white/70">
              {t('contact.businessEnquiry')}:
              <a href={`mailto:${EMAIL}`} className="inline-block text-sm text-white">
                <TextReveal
                  as="span"
                  text={EMAIL}
                  fontSize="inherit"
                  color="#ffffff"
                  hoverColor="#ffffff"
                  style={{ padding: 0, letterSpacing: 'normal', textTransform: 'none' }}
                />
              </a>
            </p>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
