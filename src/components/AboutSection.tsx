const stats = [
  { value: '40+', label: 'Products shipped' },
  { value: '8 yrs', label: 'Building on the web' },
  { value: '12', label: 'Industries served' },
  { value: '100%', label: 'Remote & async' },
]

const services = [
  {
    n: '01',
    title: 'Web Development',
    body: 'Fast, modern websites built to perform and convert — from marketing pages to full-scale portals.',
  },
  {
    n: '02',
    title: 'E-Commerce',
    body: 'Stores that sell. From product page to checkout, optimised for revenue at every step.',
  },
  {
    n: '03',
    title: 'Web Applications',
    body: 'Complex tools made simple. Dashboards, platforms, and internal tools your team will actually use.',
  },
  {
    n: '04',
    title: 'AI Solutions',
    body: 'Workflows that think. AI features woven directly into your product, not bolted on.',
  },
]

export default function AboutSection() {
  return (
    <section id="about" className="relative z-30 w-full bg-[#ededed]">

      {/* ── INTRO ─────────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-20 pt-24 pb-16">
        <span className="text-xs font-medium tracking-[0.35em] text-[#6b94bf]">
          ABOUT
        </span>
        <h2
          className="mt-6 max-w-3xl text-4xl font-normal leading-[1.06] text-[#1e3a5f] sm:text-5xl md:text-6xl lg:text-[4rem]"
          style={{ letterSpacing: '-0.02em' }}
        >
          We build digital products that matter.
        </h2>
      </div>

      <div className="border-t border-[#c5d5e5] mx-6 sm:mx-10 md:mx-20" />

      {/* ── BODY COPY  +  STATS ───────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-20 py-16 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 md:gap-20 items-start">
        {/* Left */}
        <div>
          <p className="text-xl font-light leading-relaxed text-[#2d4a6b] md:text-2xl">
            From scattered signals to fast, considered products people actually enjoy using.
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#3d5a7a]">
            We're a small studio with an outsized obsession for the details. From the first wireframe to the final deploy, we obsess over the craft — so you don't have to.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#3d5a7a]">
            Every project starts with listening. We take time to understand your users, your constraints, and your ambitions before a single line of code is written.
          </p>
        </div>

        {/* Right — stats */}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 pt-2">
          {stats.map(stat => (
            <div key={stat.label}>
              <dt className="text-4xl font-semibold text-[#1e3a5f] tabular-nums">
                {stat.value}
              </dt>
              <dd className="mt-1 text-sm leading-snug text-[#3d5a7a]">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-[#c5d5e5] mx-6 sm:mx-10 md:mx-20" />

      {/* ── SERVICES ──────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-20 py-16">
        <span className="text-xs font-medium tracking-[0.35em] text-[#6b94bf]">
          WHAT WE BUILD
        </span>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {services.map(s => (
            <div
              key={s.n}
              className="border-t border-[#c5d5e5] pt-6 pb-6 pr-8"
            >
              <span className="text-xs font-medium tracking-[0.3em] text-[#6b94bf]">
                {s.n}
              </span>
              <h3 className="mt-3 text-base font-semibold text-[#1e3a5f] leading-snug">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3d5a7a]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#c5d5e5] mx-6 sm:mx-10 md:mx-20" />

      {/* ── QUOTE  +  PROCESS ─────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-20 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left — pull quote */}
        <p
          className="text-2xl font-light leading-relaxed text-[#2d4a6b] md:text-3xl"
          style={{ letterSpacing: '-0.01em' }}
        >
          "The difference between good and great is in the details most people never see."
        </p>

        {/* Right — process steps */}
        <div className="space-y-8">
          {[
            { n: '01', label: 'Discovery', desc: 'We listen, ask hard questions, and map out what success actually looks like.' },
            { n: '02', label: 'Design & Build', desc: 'Iterative sprints. You see real progress every week, not just a final reveal.' },
            { n: '03', label: 'Ship & Grow', desc: 'Launch is the beginning. We stay close, measure, and keep improving.' },
          ].map(step => (
            <div key={step.n} className="flex gap-6 items-start">
              <span className="shrink-0 text-xs font-medium tracking-[0.3em] text-[#6b94bf] pt-0.5">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1e3a5f]">{step.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#3d5a7a]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#c5d5e5] mx-6 sm:mx-10 md:mx-20" />

      {/* ── FOOTER ROW ────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 md:px-20 py-10 flex items-center justify-between flex-wrap gap-4">
        <p className="text-xs font-medium tracking-[0.3em] text-[#6b94bf]">EST. 2016</p>
        <p className="text-sm text-[#3d5a7a]">Remote-first · Globally distributed</p>
      </div>

    </section>
  )
}
